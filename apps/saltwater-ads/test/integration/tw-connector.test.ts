import { describe, test, expect, beforeAll, beforeEach, afterAll } from 'bun:test';

import { migrate } from '@db/migrate.ts';
import { db } from '@db/client.ts';
import { loadSecrets } from '@lib/services/secrets.ts';
import {
  pullJourneys,
  syncIncremental,
  setFetchForTest,
  type JourneyOrder,
} from '@lib/services/tw-connector.ts';

// Lane D: TW pullJourneys + syncIncremental. Pins:
//   1. pullJourneys posts shop/startDate/endDate (NOT shopDomain, NOT ISO)
//   2. pullJourneys follows earliestDate cursor across pages until null
//   3. pullJourneys dedupes orders that re-appear on cursor boundary
//   4. pullJourneys throws with response body on error
//   5. syncIncremental upserts account_metric_snapshot + order_journey
//   6. syncIncremental computes ad_performance per attribution model
//   7. syncIncremental.UNIQUE constraints make repeat sync idempotent
//   8. settings/tw-sync endpoint returns 502 on TW failure (graceful degrade)

process.env.DB_PATH = ':memory:';

const FIXED_NOW = new Date('2026-04-30T12:00:00Z');

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function summaryFixture() {
  return {
    metrics: [
      { id: 'sales', metricId: 'totalSales', delta: -3, values: { current: 68038.88, previous: 70864.84 } },
      { id: 'shopifyAov', delta: -32, values: { current: 85.82, previous: 126.0 } },
      { id: 'roas', delta: 5, values: { current: 3.98, previous: 3.79 } },
    ],
  };
}

function orderFixture(adId: string | null, total: number, orderId: string, source = 'facebook-ads', model: 'fullFirstClick' | 'fullLastClick' = 'fullFirstClick'): JourneyOrder {
  const click = adId
    ? [{ source, campaignId: 'c1', adsetId: 'a1', adId, clickDate: '2026-04-15T00:00:00Z' }]
    : [{ source: 'klaviyo', campaignId: 'email', adsetId: '', adId: '', clickDate: '2026-04-15T00:00:00Z' }];
  return {
    order_id: orderId,
    order_name: `#${orderId}`,
    total_price: total,
    currency: 'USD',
    created_at: '2026-04-15T10:00:00Z',
    customer_id: '12345',
    attribution: { [model]: click } as Partial<JourneyOrder['attribution']>,
    journey: [],
  };
}

describe('pullJourneys', () => {
  beforeAll(async () => {
    loadSecrets();
    await migrate({ quiet: true });
  });

  beforeEach(() => {
    setFetchForTest(null);
  });

  afterAll(() => {
    setFetchForTest(null);
  });

  test('posts {shop, startDate, endDate} body shape (NOT shopDomain, NOT ISO)', async () => {
    let capturedBody: Record<string, unknown> | null = null;
    setFetchForTest(async (_url, init) => {
      capturedBody = JSON.parse(init!.body as string);
      return jsonResponse({
        startDate: '2026-04-01',
        endDate: '2026-04-30',
        earliestDate: null,
        count: 0,
        page: 1,
        ordersWithJourneys: [],
      });
    });

    await pullJourneys({ startDate: '2026-04-01', endDate: '2026-04-30' });

    expect(capturedBody).toBeDefined();
    expect(capturedBody!.shop).toBe('saltwater-longisland.myshopify.com');
    expect(capturedBody!.shopDomain).toBeUndefined();
    expect(capturedBody!.startDate).toBe('2026-04-01');
    expect(capturedBody!.endDate).toBe('2026-04-30');
  });

  test('follows earliestDate cursor across pages until null', async () => {
    let call = 0;
    const seen: Array<string | undefined> = [];
    setFetchForTest(async (_url, init) => {
      const body = JSON.parse(init!.body as string) as { earliestDate?: string };
      seen.push(body.earliestDate);
      call++;
      if (call === 1) {
        return jsonResponse({
          earliestDate: '2026-04-15',
          count: 2,
          page: 1,
          ordersWithJourneys: [
            orderFixture('ad-1', 100, 'o1'),
            orderFixture('ad-2', 200, 'o2'),
          ],
        });
      }
      if (call === 2) {
        return jsonResponse({
          earliestDate: '2026-04-01',
          count: 1,
          page: 2,
          ordersWithJourneys: [orderFixture('ad-3', 50, 'o3')],
        });
      }
      // Final page → earliestDate null = stop.
      return jsonResponse({
        earliestDate: null,
        count: 0,
        page: 3,
        ordersWithJourneys: [],
      });
    });

    const orders = await pullJourneys({ startDate: '2026-04-01', endDate: '2026-04-30' });
    expect(call).toBe(3);
    expect(seen).toEqual([undefined, '2026-04-15', '2026-04-01']);
    expect(orders.length).toBe(3);
    expect(orders.map((o) => o.order_id)).toEqual(['o1', 'o2', 'o3']);
  });

  test('dedupes orders that re-appear at cursor boundary', async () => {
    let call = 0;
    setFetchForTest(async () => {
      call++;
      if (call === 1) {
        return jsonResponse({
          earliestDate: '2026-04-15',
          count: 2,
          page: 1,
          ordersWithJourneys: [orderFixture('ad-1', 100, 'o1'), orderFixture('ad-2', 200, 'o2')],
        });
      }
      // Page 2 RE-includes o2 at boundary, plus a fresh order.
      return jsonResponse({
        earliestDate: null,
        count: 2,
        page: 2,
        ordersWithJourneys: [orderFixture('ad-2', 200, 'o2'), orderFixture('ad-3', 50, 'o3')],
      });
    });

    const orders = await pullJourneys({ startDate: '2026-04-01', endDate: '2026-04-30' });
    expect(orders.length).toBe(3);
    expect(new Set(orders.map((o) => o.order_id))).toEqual(new Set(['o1', 'o2', 'o3']));
  });

  test('Codex #10: throws on MAX_JOURNEY_PAGES instead of silently truncating', async () => {
    // Simulate a misbehaving cursor: every page returns earliestDate so
    // pagination never terminates. pullJourneys must throw at MAX_JOURNEY_PAGES,
    // NOT silently return partial data and corrupt order_journey/ad_performance.
    let call = 0;
    setFetchForTest(async () => {
      call++;
      return jsonResponse({
        earliestDate: '2026-01-01', // never null → never terminates
        count: 1,
        page: call,
        ordersWithJourneys: [orderFixture('ad-x', 1, `o${call}`)],
      });
    });
    await expect(pullJourneys({ startDate: '2026-04-01', endDate: '2026-04-30' }))
      .rejects.toThrow(/exceeded MAX_JOURNEY_PAGES/);
    expect(call).toBe(50); // hit the cap exactly
  });

  test('throws with response body snippet on error', async () => {
    setFetchForTest(async () =>
      new Response('{"error":"invalid_scope"}', {
        status: 403,
        statusText: 'Forbidden',
        headers: { 'content-type': 'application/json' },
      }),
    );
    await expect(pullJourneys({ startDate: '2026-04-01', endDate: '2026-04-30' })).rejects.toThrow(/get-orders-with-journeys-v2 failed: 403.*invalid_scope/);
  });
});

describe('syncIncremental', () => {
  beforeAll(async () => {
    loadSecrets();
    await migrate({ quiet: true });
  });

  beforeEach(() => {
    db().run('DELETE FROM ad_performance');
    db().run('DELETE FROM order_journey');
    db().run('DELETE FROM account_metric_snapshot');
    setFetchForTest(null);
  });

  afterAll(() => {
    setFetchForTest(null);
  });

  test('happy path: upserts metrics, orders, and ad rollup', async () => {
    setFetchForTest(async (url) => {
      if (url.endsWith('/summary-page/get-data')) {
        return jsonResponse(summaryFixture());
      }
      if (url.endsWith('/attribution/get-orders-with-journeys-v2')) {
        return jsonResponse({
          earliestDate: null,
          count: 3,
          page: 1,
          ordersWithJourneys: [
            orderFixture('ad-A', 100, 'o1'),
            orderFixture('ad-A', 50, 'o2'),
            orderFixture('ad-B', 200, 'o3'),
          ],
        });
      }
      throw new Error(`unexpected fetch: ${url}`);
    });

    const result = await syncIncremental({ now: FIXED_NOW });
    expect(result.metricsUpserted).toBe(3);
    expect(result.ordersUpserted).toBe(3);
    // 2 ads × 1 model = 2 ad_performance rows under fullFirstClick
    expect(result.adRowsUpserted).toBe(2);
    expect(result.windowStart).toBe('2026-03-31');
    expect(result.windowEnd).toBe('2026-04-30');
    expect(result.watermark).toBe('2026-04-15T10:00:00Z');

    // Spot-check the rollup
    const adA = db().query(
      `SELECT order_count, revenue, computed_aov FROM ad_performance
       WHERE attribution_model = 'fullFirstClick' AND ad_id = 'ad-A'`,
    ).get() as { order_count: number; revenue: number; computed_aov: number };
    expect(adA.order_count).toBe(2);
    expect(adA.revenue).toBe(150);
    expect(adA.computed_aov).toBe(75);

    const adB = db().query(
      `SELECT revenue FROM ad_performance
       WHERE attribution_model = 'fullFirstClick' AND ad_id = 'ad-B'`,
    ).get() as { revenue: number };
    expect(adB.revenue).toBe(200);
  });

  test('repeat sync is idempotent (UNIQUE constraints upsert in place)', async () => {
    setFetchForTest(async (url) => {
      if (url.endsWith('/summary-page/get-data')) return jsonResponse(summaryFixture());
      return jsonResponse({
        earliestDate: null, count: 1, page: 1,
        ordersWithJourneys: [orderFixture('ad-A', 100, 'o1')],
      });
    });

    await syncIncremental({ now: FIXED_NOW });
    const beforeMetrics = db().query('SELECT COUNT(*) AS n FROM account_metric_snapshot').get() as { n: number };
    const beforeOrders = db().query('SELECT COUNT(*) AS n FROM order_journey').get() as { n: number };

    await syncIncremental({ now: FIXED_NOW });
    const afterMetrics = db().query('SELECT COUNT(*) AS n FROM account_metric_snapshot').get() as { n: number };
    const afterOrders = db().query('SELECT COUNT(*) AS n FROM order_journey').get() as { n: number };

    expect(afterMetrics.n).toBe(beforeMetrics.n);
    expect(afterOrders.n).toBe(beforeOrders.n);
  });

  test('changed metric value updates in place (upsert path)', async () => {
    setFetchForTest(async (url) => {
      if (url.endsWith('/summary-page/get-data')) {
        return jsonResponse({
          metrics: [{ id: 'sales', delta: -3, values: { current: 1000, previous: 1100 } }],
        });
      }
      return jsonResponse({ earliestDate: null, count: 0, page: 1, ordersWithJourneys: [] });
    });
    await syncIncremental({ now: FIXED_NOW });

    setFetchForTest(async (url) => {
      if (url.endsWith('/summary-page/get-data')) {
        return jsonResponse({
          metrics: [{ id: 'sales', delta: 5, values: { current: 1200, previous: 1100 } }],
        });
      }
      return jsonResponse({ earliestDate: null, count: 0, page: 1, ordersWithJourneys: [] });
    });
    await syncIncremental({ now: FIXED_NOW });

    const row = db().query(
      `SELECT current_value, delta_pct FROM account_metric_snapshot
       WHERE metric_id = 'sales' AND window_start = ? AND window_end = ?`,
    ).get('2026-03-31', '2026-04-30') as { current_value: number; delta_pct: number };
    expect(row.current_value).toBe(1200);
    expect(row.delta_pct).toBe(5);
  });

  test('multi-model rollup: same order shows up under multiple attribution models', async () => {
    const order: JourneyOrder = {
      order_id: 'multi-1',
      total_price: 100,
      currency: 'USD',
      created_at: '2026-04-15T10:00:00Z',
      attribution: {
        fullFirstClick: [{ source: 'facebook-ads', campaignId: 'c1', adsetId: 'a1', adId: 'ad-X', clickDate: '2026-04-10T10:00:00Z' }],
        fullLastClick: [{ source: 'klaviyo', campaignId: 'em', adsetId: '', adId: '', clickDate: '2026-04-15T09:00:00Z' }],
        lastPlatformClick: [
          { source: 'klaviyo', campaignId: 'em', adsetId: '', adId: '', clickDate: '2026-04-15T09:00:00Z' },
          { source: 'facebook-ads', campaignId: 'c1', adsetId: 'a1', adId: 'ad-X', clickDate: '2026-04-10T10:00:00Z' },
        ],
      },
    };

    setFetchForTest(async (url) => {
      if (url.endsWith('/summary-page/get-data')) return jsonResponse({ metrics: [] });
      return jsonResponse({ earliestDate: null, count: 1, page: 1, ordersWithJourneys: [order] });
    });

    await syncIncremental({ now: FIXED_NOW });

    // ad-X gets credit under fullFirstClick AND lastPlatformClick (NOT fullLastClick — empty there)
    const rows = db().query(
      `SELECT attribution_model, revenue FROM ad_performance WHERE ad_id = 'ad-X' ORDER BY attribution_model`,
    ).all() as Array<{ attribution_model: string; revenue: number }>;
    expect(rows.length).toBe(2);
    expect(rows.map((r) => r.attribution_model).sort()).toEqual(['fullFirstClick', 'lastPlatformClick']);
    expect(rows.every((r) => r.revenue === 100)).toBe(true);
  });

  test('orders with no adId (klaviyo, organic) do not produce ad_performance rows', async () => {
    setFetchForTest(async (url) => {
      if (url.endsWith('/summary-page/get-data')) return jsonResponse({ metrics: [] });
      return jsonResponse({
        earliestDate: null, count: 2, page: 1,
        ordersWithJourneys: [
          orderFixture(null, 100, 'k1'),
          orderFixture(null, 200, 'k2'),
        ],
      });
    });

    const result = await syncIncremental({ now: FIXED_NOW });
    expect(result.ordersUpserted).toBe(2);
    expect(result.adRowsUpserted).toBe(0);
  });

  test('rollup is recomputed (not appended) on second sync', async () => {
    setFetchForTest(async (url) => {
      if (url.endsWith('/summary-page/get-data')) return jsonResponse({ metrics: [] });
      return jsonResponse({
        earliestDate: null, count: 1, page: 1,
        ordersWithJourneys: [orderFixture('ad-A', 100, 'o1')],
      });
    });
    await syncIncremental({ now: FIXED_NOW });

    // Second sync drops ad-A (refunded? returned?), adds ad-B
    setFetchForTest(async (url) => {
      if (url.endsWith('/summary-page/get-data')) return jsonResponse({ metrics: [] });
      return jsonResponse({
        earliestDate: null, count: 1, page: 1,
        ordersWithJourneys: [orderFixture('ad-B', 200, 'o2')],
      });
    });
    await syncIncremental({ now: FIXED_NOW });

    const rows = db().query(
      `SELECT ad_id FROM ad_performance WHERE window_start = ? AND window_end = ?`,
    ).all('2026-03-31', '2026-04-30') as Array<{ ad_id: string }>;
    expect(rows.map((r) => r.ad_id).sort()).toEqual(['ad-B']);
  });

  test('window dates compute from now - windowDays', async () => {
    setFetchForTest(async (url) => {
      if (url.endsWith('/summary-page/get-data')) return jsonResponse({ metrics: [] });
      return jsonResponse({ earliestDate: null, count: 0, page: 1, ordersWithJourneys: [] });
    });

    const r = await syncIncremental({ now: new Date('2026-04-30T00:00:00Z'), windowDays: 7 });
    expect(r.windowStart).toBe('2026-04-23');
    expect(r.windowEnd).toBe('2026-04-30');
  });

  test('watermark falls back to windowEnd when no orders', async () => {
    setFetchForTest(async (url) => {
      if (url.endsWith('/summary-page/get-data')) return jsonResponse({ metrics: [] });
      return jsonResponse({ earliestDate: null, count: 0, page: 1, ordersWithJourneys: [] });
    });
    const r = await syncIncremental({ now: FIXED_NOW });
    expect(r.watermark).toBe('2026-04-30');
  });
});
