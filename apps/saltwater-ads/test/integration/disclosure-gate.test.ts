import { describe, test, expect, beforeAll } from 'bun:test';
import { Hono } from 'hono';
import { setSignedCookie } from 'hono/cookie';

import { loadSecrets, secrets } from '@lib/services/secrets.ts';
import { migrate } from '@db/migrate.ts';
import { createApp } from '../../src/server/app.ts';

// H-2 server-side defense-in-depth: even if a future client sneaks
// `ai_disclosure_acknowledged: false` (or omits it) past the UI, the server's
// z.literal(true) validator must reject with 400 ai_disclosure_required.

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

describe('H-2 server-side disclosure gate', () => {
  let app: ReturnType<typeof createApp>;
  let cookie: string;

  beforeAll(async () => {
    loadSecrets();
    await migrate({ quiet: true });
    app = createApp();
    cookie = await mintSession('h2-test@example.com');
  });

  test('approve with ai_disclosure_acknowledged: true → reaches handler', async () => {
    const res = await app.request('/api/variants/1/approve', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie },
      body: JSON.stringify({ ai_disclosure_acknowledged: true }),
    });
    // Approve handler is now real. Variant 1 may or may not exist depending
    // on test execution order — could be 404 (no variant), 409 (wrong
    // status), or 200 (ready_for_review). Importantly NOT 400 — that would
    // mean the disclosure gate rejected, and we need to prove the gate
    // LET IT THROUGH on ack=true.
    expect(res.status).not.toBe(400);
    expect([200, 404, 409]).toContain(res.status);
  });

  test('approve with ai_disclosure_acknowledged: false → 400 ai_disclosure_required', async () => {
    const res = await app.request('/api/variants/1/approve', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie },
      body: JSON.stringify({ ai_disclosure_acknowledged: false }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('ai_disclosure_required');
  });

  test('approve with field omitted → 400 ai_disclosure_required', async () => {
    const res = await app.request('/api/variants/1/approve', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('ai_disclosure_required');
  });

  test('approve with empty body → 400 ai_disclosure_required', async () => {
    const res = await app.request('/api/variants/1/approve', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie },
      body: '',
    });
    expect(res.status).toBe(400);
  });
});
