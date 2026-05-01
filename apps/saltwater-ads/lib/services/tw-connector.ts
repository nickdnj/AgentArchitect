import { db } from '@db/client.ts';
import { secrets } from './secrets.ts';

// PRD §6.1.3 — Triple Whale Connector.
//
// IMPORTANT (discovered 2026-04-30): API-key auth exposes only 5 endpoints.
// Per-ad ROAS is NOT directly available — only account-level summary metrics
// and customer journeys (which can be aggregated to per-ad with post-processing).
//
// Available endpoints (with x-api-key auth):
//   GET  /api/v2/users/api-keys/me                  — identity / verify
//   POST /api/v2/summary-page/get-data              — account-level metrics
//   POST /api/v2/tw-metrics/metrics                 — push custom metrics
//   GET  /api/v2/tw-metrics/metrics-data            — read pushed metrics
//   POST /api/v2/attribution/get-orders-with-journeys-v2 — per-order journey data

const TW_BASE = 'https://api.triplewhale.com/api/v2';
const SHOP_DOMAIN = 'saltwater-longisland.myshopify.com'; // discovered from saltwaterclothingco.com source
const SYNC_WINDOW_DAYS = 30;

// Six TW attribution models. F-TW-4 — operator picks one for analysis;
// the rollup table keeps all six so the choice is reversible without re-pulling.
const ATTRIBUTION_MODELS = [
  'firstClick',
  'lastClick',
  'fullFirstClick',
  'fullLastClick',
  'lastPlatformClick',
  'linearAll',
] as const;
type AttributionModel = (typeof ATTRIBUTION_MODELS)[number];

// Test hatch: lets tests inject a fake fetch without monkeypatching globalThis.
type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;
let _fetch: Fetcher | null = null;
export function setFetchForTest(f: Fetcher | null): void {
  _fetch = f;
}
function fetcher(): Fetcher {
  return _fetch ?? (globalThis.fetch as Fetcher);
}

function authHeaders(): HeadersInit {
  return {
    'x-api-key': secrets.triplewhale(),
    'content-type': 'application/json',
  };
}

/**
 * CQ5: TW errors used to throw bare status codes ("TW verifyKey failed: 403").
 * The actual reason ({"error":"invalid_scope"} etc.) was in the response body
 * and got dropped on the floor. Now we capture the first 200 chars so
 * journalctl shows what TW actually said.
 */
async function twError(label: string, r: Response): Promise<Error> {
  let bodySnippet = '';
  try {
    const text = await r.text();
    bodySnippet = text.slice(0, 200);
  } catch {
    bodySnippet = '<unreadable response body>';
  }
  return new Error(`TW ${label} failed: ${r.status} ${r.statusText} — ${bodySnippet}`);
}

export async function verifyKey(): Promise<{ user_id: string; email: string }> {
  const r = await fetcher()(`${TW_BASE}/users/api-keys/me`, { headers: authHeaders() });
  if (!r.ok) throw await twError('verifyKey', r);
  const data = (await r.json()) as { user: { user_id: string; email: string } };
  return data.user;
}

export interface SummaryPeriod {
  startISO: string;
  endISO: string;
}

interface SummaryMetric {
  id: string;
  title?: string;
  metricId?: string;
  type?: string;
  delta?: number;
  values?: { current?: number | null; previous?: number | null };
}
interface SummaryResponse {
  metrics?: SummaryMetric[];
}

export async function pullSummary(period: SummaryPeriod): Promise<SummaryResponse> {
  const r = await fetcher()(`${TW_BASE}/summary-page/get-data`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      shopDomain: SHOP_DOMAIN,
      period: { start: period.startISO, end: period.endISO },
      todayHour: null,
    }),
  });
  if (!r.ok) throw await twError('summary-page', r);
  return (await r.json()) as SummaryResponse;
}

export interface JourneyPeriod {
  /** YYYY-MM-DD — F-TW-3 says NOT ISO timestamps. */
  startDate: string;
  /** YYYY-MM-DD. */
  endDate: string;
}

export interface JourneyClick {
  source: string;
  campaignId: string;
  adsetId: string;
  adId: string;
  clickDate: string;
}

export type AttributionByModel = Record<AttributionModel, JourneyClick[]>;

export interface JourneyOrder {
  order_id: string;
  order_name?: string | null;
  total_price?: number | null;
  currency?: string | null;
  created_at?: string | null;
  customer_id?: string | number | null;
  attribution: Partial<AttributionByModel>;
  journey?: unknown[];
}

interface JourneyPage {
  startDate: string;
  endDate: string;
  earliestDate: string | null;
  count: number;
  page: number;
  ordersWithJourneys: JourneyOrder[];
}

const MAX_JOURNEY_PAGES = 50; // hard ceiling so a misbehaving cursor can't loop forever

/**
 * Pull every page of journey orders in [startDate, endDate]. Pagination uses
 * the `earliestDate` cursor: subsequent calls pass the last response's
 * `earliestDate` so TW returns orders strictly older. `null` means done.
 *
 * F-TW-3 body shape uses `shop` (not `shopDomain`) and `YYYY-MM-DD` strings
 * (not ISO timestamps). Different from the summary endpoint.
 */
export async function pullJourneys(period: JourneyPeriod): Promise<JourneyOrder[]> {
  const out: JourneyOrder[] = [];
  let cursor: string | null = null;
  let pageCount = 0;
  const seenOrderIds = new Set<string>();

  for (;;) {
    const body: Record<string, unknown> = {
      shop: SHOP_DOMAIN,
      startDate: period.startDate,
      endDate: period.endDate,
    };
    if (cursor) body.earliestDate = cursor;

    const r = await fetcher()(`${TW_BASE}/attribution/get-orders-with-journeys-v2`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    if (!r.ok) throw await twError('get-orders-with-journeys-v2', r);

    const page = (await r.json()) as JourneyPage;
    for (const order of page.ordersWithJourneys ?? []) {
      // Pagination cursor occasionally re-includes the boundary order.
      // Dedupe on order_id to keep upsert idempotent.
      if (!seenOrderIds.has(order.order_id)) {
        seenOrderIds.add(order.order_id);
        out.push(order);
      }
    }

    pageCount++;
    if (!page.earliestDate) break;
    if (pageCount >= MAX_JOURNEY_PAGES) {
      // Codex eng-review-3 #10: never silently truncate. If the cursor
      // hasn't terminated by MAX_JOURNEY_PAGES (50 × 100 orders/page = 5000
      // orders, way above Joe's monthly volume), something is wrong: a
      // misbehaving cursor, an unusually busy window, or TW pagination drift.
      // Throw so syncIncremental returns 502 → ops sees it instead of
      // corrupting order_journey + ad_performance with partial data.
      throw new Error(
        `TW pullJourneys exceeded MAX_JOURNEY_PAGES=${MAX_JOURNEY_PAGES} ` +
        `(start=${period.startDate} end=${period.endDate}, last cursor=${cursor}). ` +
        `Refusing to silently truncate.`,
      );
    }
    cursor = page.earliestDate;
  }

  return out;
}

interface SyncIncrementalArgs {
  /** Override the clock for tests. Default: new Date(). */
  now?: Date;
  /** Override the window in days. Default: 30. */
  windowDays?: number;
}

export interface SyncIncrementalResult {
  windowStart: string;
  windowEnd: string;
  metricsUpserted: number;
  ordersUpserted: number;
  adRowsUpserted: number;
  watermark: string;
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Subtract `days` days from `d`, returning a new Date. */
function subDays(d: Date, days: number): Date {
  const out = new Date(d.getTime());
  out.setUTCDate(out.getUTCDate() - days);
  return out;
}

/**
 * Sprint 1 incremental sync (F-TW-6). Pulls last `windowDays` days of:
 *   - account-level summary  → upsert account_metric_snapshot
 *   - per-order journeys     → upsert order_journey
 * Then computes the ad_performance rollup across all six attribution models.
 *
 * Watermark = MAX(created_at) from the journey set, or windowEnd if no orders.
 */
export async function syncIncremental(args: SyncIncrementalArgs = {}): Promise<SyncIncrementalResult> {
  const now = args.now ?? new Date();
  const windowDays = args.windowDays ?? SYNC_WINDOW_DAYS;
  const windowEnd = toIsoDate(now);
  const windowStart = toIsoDate(subDays(now, windowDays));

  // ---- Summary ----
  const summary = await pullSummary({
    startISO: `${windowStart}T00:00:00Z`,
    endISO: `${windowEnd}T23:59:59Z`,
  });
  const metricsUpserted = upsertAccountMetrics(summary, windowStart, windowEnd);

  // ---- Journeys ----
  const orders = await pullJourneys({ startDate: windowStart, endDate: windowEnd });
  const ordersUpserted = upsertOrderJourneys(orders);

  // ---- Per-ad rollup (F-TW-5) ----
  const adRowsUpserted = computeAdPerformance(orders, windowStart, windowEnd);

  // Watermark: latest order created_at, or windowEnd if no orders this pull.
  const watermark = orders.reduce<string>((acc, o) => {
    const ts = o.created_at ?? '';
    return ts > acc ? ts : acc;
  }, '') || windowEnd;

  return { windowStart, windowEnd, metricsUpserted, ordersUpserted, adRowsUpserted, watermark };
}

function upsertAccountMetrics(summary: SummaryResponse, windowStart: string, windowEnd: string): number {
  const conn = db();
  let count = 0;
  conn.transaction(() => {
    for (const m of summary.metrics ?? []) {
      if (!m.id) continue;
      conn.run(
        `INSERT INTO account_metric_snapshot
           (window_start, window_end, metric_id, current_value, previous_value, delta_pct, pulled_at)
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(window_start, window_end, metric_id) DO UPDATE SET
           current_value = excluded.current_value,
           previous_value = excluded.previous_value,
           delta_pct = excluded.delta_pct,
           pulled_at = CURRENT_TIMESTAMP`,
        [
          windowStart,
          windowEnd,
          m.id,
          m.values?.current ?? null,
          m.values?.previous ?? null,
          m.delta ?? null,
        ],
      );
      count++;
    }
  })();
  return count;
}

function upsertOrderJourneys(orders: JourneyOrder[]): number {
  const conn = db();
  let count = 0;
  conn.transaction(() => {
    for (const o of orders) {
      conn.run(
        `INSERT INTO order_journey
           (order_id, order_name, total_price, currency, created_at, customer_id, attribution_json, pulled_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(order_id) DO UPDATE SET
           order_name = excluded.order_name,
           total_price = excluded.total_price,
           currency = excluded.currency,
           created_at = excluded.created_at,
           customer_id = excluded.customer_id,
           attribution_json = excluded.attribution_json,
           pulled_at = CURRENT_TIMESTAMP`,
        [
          o.order_id,
          o.order_name ?? null,
          o.total_price ?? null,
          o.currency ?? null,
          o.created_at ?? null,
          o.customer_id != null ? String(o.customer_id) : null,
          JSON.stringify(o.attribution ?? {}),
        ],
      );
      count++;
    }
  })();
  return count;
}

/**
 * F-TW-5: GROUP BY (attribution_model, source, ad_id) → SUM revenue + COUNT orders.
 * For each (model, ad) pair the ad gets credit for any order where it appears
 * in attribution[model]. Multiple ads in the same model on one order each get
 * full credit (matches "full*" semantics).
 */
function computeAdPerformance(orders: JourneyOrder[], windowStart: string, windowEnd: string): number {
  type Bucket = { source: string; revenue: number; orderIds: Set<string> };
  // key = `${model}|${source}|${adId}`
  const buckets = new Map<string, Bucket>();

  for (const o of orders) {
    const revenue = typeof o.total_price === 'number' ? o.total_price : 0;
    for (const model of ATTRIBUTION_MODELS) {
      const clicks = o.attribution?.[model] ?? [];
      // Dedupe ad_ids within a single order under one model — same ad
      // appearing twice in fullFirstClick shouldn't double-credit.
      const seenInOrder = new Set<string>();
      for (const c of clicks) {
        if (!c.adId) continue; // organic / klaviyo / direct have no adId
        const key = `${model}|${c.source}|${c.adId}`;
        if (seenInOrder.has(key)) continue;
        seenInOrder.add(key);
        let b = buckets.get(key);
        if (!b) {
          b = { source: c.source, revenue: 0, orderIds: new Set() };
          buckets.set(key, b);
        }
        if (!b.orderIds.has(o.order_id)) {
          b.orderIds.add(o.order_id);
          b.revenue += revenue;
        }
      }
    }
  }

  const conn = db();
  let count = 0;
  conn.transaction(() => {
    // Wipe rollup for this window across ALL models — recompute is cheap and
    // avoids stale rows when a previous sync had ads that this sync doesn't.
    conn.run(
      `DELETE FROM ad_performance WHERE window_start = ? AND window_end = ?`,
      [windowStart, windowEnd],
    );
    for (const [key, b] of buckets) {
      const [model, _source, adId] = key.split('|');
      const orderCount = b.orderIds.size;
      const aov = orderCount > 0 ? b.revenue / orderCount : null;
      conn.run(
        `INSERT INTO ad_performance
           (attribution_model, source, ad_id, campaign_id, adset_id,
            window_start, window_end, order_count, revenue, computed_aov, computed_at)
         VALUES (?, ?, ?, NULL, NULL, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [model, b.source, adId, windowStart, windowEnd, orderCount, b.revenue, aov],
      );
      count++;
    }
  })();
  return count;
}
