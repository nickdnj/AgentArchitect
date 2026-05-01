import { secrets } from './secrets.ts';
// import { db } from '@db/client.ts';

// PRD §6.1.3 — Triple Whale Connector.
//
// IMPORTANT (discovered 2026-04-30): API-key auth exposes only 5 endpoints.
// Per-ad ROAS is NOT directly available — only account-level summary metrics
// and customer journeys (which can be aggregated to per-ad with post-processing).
// SAD §3 / PRD §6.1.3 will be revised to reflect this before /plan-eng-review.
//
// Available endpoints (with x-api-key auth):
//   GET  /api/v2/users/api-keys/me                  — identity / verify
//   POST /api/v2/summary-page/get-data              — account-level metrics
//   POST /api/v2/tw-metrics/metrics                 — push custom metrics
//   GET  /api/v2/tw-metrics/metrics-data            — read pushed metrics
//   POST /api/v2/attribution/get-orders-with-journeys-v2 — per-order journey data

const TW_BASE = 'https://api.triplewhale.com/api/v2';
const SHOP_DOMAIN = 'saltwater-longisland.myshopify.com'; // discovered from saltwaterclothingco.com source

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
  const r = await fetch(`${TW_BASE}/users/api-keys/me`, { headers: authHeaders() });
  if (!r.ok) throw await twError('verifyKey', r);
  const data = (await r.json()) as { user: { user_id: string; email: string } };
  return data.user;
}

export interface SummaryPeriod {
  startISO: string;
  endISO: string;
}

export async function pullSummary(period: SummaryPeriod): Promise<unknown> {
  const r = await fetch(`${TW_BASE}/summary-page/get-data`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      shopDomain: SHOP_DOMAIN,
      period: { start: period.startISO, end: period.endISO },
      todayHour: null,
    }),
  });
  if (!r.ok) throw await twError('summary-page', r);
  return await r.json();
}

export async function pullJourneys(period: SummaryPeriod): Promise<unknown> {
  // TODO: per-order customer journey data; aggregate to per-ad ROAS in post-processing
  throw new Error('not_implemented: tw-connector.pullJourneys');
}

export async function syncIncremental(): Promise<{ rowsUpserted: number; watermark: string }> {
  // TODO: pull last 30d account summary → upsert into account_metric_snapshot
  //       pull last 30d journeys → upsert into order_journey (watermark = MAX(created_at))
  //       compute ad_performance rollup per attribution model (PRD §6.1.3 F-TW-5)
  throw new Error('not_implemented: tw-connector.syncIncremental');
}
