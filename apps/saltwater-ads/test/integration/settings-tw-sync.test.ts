import { describe, test, expect, beforeAll, beforeEach, afterAll } from 'bun:test';
import { Hono } from 'hono';
import { setSignedCookie } from 'hono/cookie';

import { migrate } from '@db/migrate.ts';
import { db } from '@db/client.ts';
import { loadSecrets, secrets } from '@lib/services/secrets.ts';
import { setFetchForTest } from '@lib/services/tw-connector.ts';
import { createApp } from '../../src/server/app.ts';

// Lane D: POST /api/settings/tw-sync end-to-end. Pins:
//   1. 200 with sync result on TW happy path
//   2. 502 with tw_sync_failed error when TW fails (graceful degrade per F-TW-8)
//   3. Audit row written with action=tw_sync + meta_json carrying counts
//   4. Audit row written even when TW fails (records the error reason)

process.env.DB_PATH = ':memory:';

async function mintSession(email: string): Promise<string> {
  const tmp = new Hono();
  tmp.get('/', async (c) => {
    await setSignedCookie(c, 'sw_session', JSON.stringify({ email }), secrets.sessionSig());
    return c.text('ok');
  });
  const res = await tmp.request('/');
  return res.headers.get('set-cookie')!.split(';')[0];
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('POST /api/settings/tw-sync', () => {
  let app: ReturnType<typeof createApp>;
  let cookie: string;

  beforeAll(async () => {
    loadSecrets();
    await migrate({ quiet: true });
    app = createApp();
    cookie = await mintSession('joe@saltwater.test');
  });

  beforeEach(() => {
    db().run('DELETE FROM ad_performance');
    db().run('DELETE FROM order_journey');
    db().run('DELETE FROM account_metric_snapshot');
    db().run('DELETE FROM audit_log');
    setFetchForTest(null);
  });

  afterAll(() => {
    setFetchForTest(null);
  });

  test('200 with windowStart/windowEnd/counts on success', async () => {
    setFetchForTest(async (url) => {
      if (url.endsWith('/summary-page/get-data')) {
        return jsonResponse({
          metrics: [{ id: 'sales', delta: 5, values: { current: 100, previous: 95 } }],
        });
      }
      return jsonResponse({
        earliestDate: null, count: 1, page: 1,
        ordersWithJourneys: [{
          order_id: 'o1', order_name: '#1', total_price: 50, currency: 'USD',
          created_at: '2026-04-15T10:00:00Z', customer_id: '1',
          attribution: { fullFirstClick: [{ source: 'facebook-ads', campaignId: 'c', adsetId: 'a', adId: 'ad-X', clickDate: '2026-04-10T00:00:00Z' }] },
          journey: [],
        }],
      });
    });

    const res = await app.request('/api/settings/tw-sync', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie },
      body: '{}',
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      metricsUpserted: number;
      ordersUpserted: number;
      adRowsUpserted: number;
      windowStart: string;
      windowEnd: string;
      watermark: string;
    };
    expect(body.metricsUpserted).toBe(1);
    expect(body.ordersUpserted).toBe(1);
    expect(body.adRowsUpserted).toBe(1);
    expect(body.windowStart).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(body.windowEnd).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('502 with tw_sync_failed when TW returns 500', async () => {
    setFetchForTest(async () =>
      new Response('{"error":"internal"}', { status: 500, statusText: 'Internal Server Error' }),
    );

    const res = await app.request('/api/settings/tw-sync', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie },
      body: '{}',
    });
    expect(res.status).toBe(502);
    const body = (await res.json()) as { error: string; message: string };
    expect(body.error).toBe('tw_sync_failed');
    expect(body.message).toContain('500');
  });

  test('audit row written on success with counts in meta_json', async () => {
    setFetchForTest(async (url) => {
      if (url.endsWith('/summary-page/get-data')) return jsonResponse({ metrics: [] });
      return jsonResponse({ earliestDate: null, count: 0, page: 1, ordersWithJourneys: [] });
    });

    const res = await app.request('/api/settings/tw-sync', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie },
      body: '{}',
    });
    expect(res.status).toBe(200);

    const row = db().query(
      `SELECT email, action, meta_json FROM audit_log WHERE action = 'tw_sync' ORDER BY id DESC LIMIT 1`,
    ).get() as { email: string; action: string; meta_json: string };
    expect(row.email).toBe('joe@saltwater.test');
    const meta = JSON.parse(row.meta_json) as { metrics: number; orders: number; ad_rows: number };
    expect(meta.metrics).toBe(0);
    expect(meta.orders).toBe(0);
  });

  test('audit row written on failure with error in meta_json', async () => {
    setFetchForTest(async () =>
      new Response('{"error":"unauthorized"}', { status: 401, statusText: 'Unauthorized' }),
    );

    const res = await app.request('/api/settings/tw-sync', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie },
      body: '{}',
    });
    expect(res.status).toBe(502);

    const row = db().query(
      `SELECT meta_json FROM audit_log WHERE action = 'tw_sync' ORDER BY id DESC LIMIT 1`,
    ).get() as { meta_json: string };
    const meta = JSON.parse(row.meta_json) as { error: string };
    expect(meta.error).toContain('401');
  });
});
