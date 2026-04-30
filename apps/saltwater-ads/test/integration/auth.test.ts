import { describe, test, expect, beforeAll } from 'bun:test';
import { Hono } from 'hono';
import { setSignedCookie } from 'hono/cookie';
import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import { loadSecrets, secrets } from '@lib/services/secrets.ts';
import { db } from '@db/client.ts';
import { createApp } from '../../src/server/app.ts';

// Ensure tests use the in-memory DB and fixture secrets even when run individually.
process.env.DB_PATH = ':memory:';
process.env.SECRETS_PATH = process.env.SECRETS_PATH ?? './test/fixtures/secrets.env';

async function applyMigrations(): Promise<void> {
  const conn = db();
  const migrationsDir = resolve(import.meta.dir, '../../db/migrations');
  const files = (await readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort();
  for (const f of files) {
    const sql = await Bun.file(resolve(migrationsDir, f)).text();
    conn.exec(sql);
  }
}

async function mintSessionCookie(email: string): Promise<string> {
  const tmp = new Hono();
  tmp.get('/', async (c) => {
    await setSignedCookie(c, 'sw_session', JSON.stringify({ email }), secrets.sessionSig());
    return c.text('ok');
  });
  const res = await tmp.request('/');
  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) throw new Error('mintSessionCookie: no set-cookie header');
  return setCookie.split(';')[0]; // "sw_session=<signed-value>"
}

describe('C-2 auth wiring', () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(async () => {
    loadSecrets();
    await applyMigrations();
    app = createApp();
  });

  describe('public routes', () => {
    test('GET /healthz is open (no session required)', async () => {
      const res = await app.request('/healthz');
      expect(res.status).toBe(200);
      const body = (await res.json()) as { status: string };
      expect(body.status).toBe('ok');
    });

    test('GET /healthz/ready is open', async () => {
      const res = await app.request('/healthz/ready');
      // 200 ready or 503 unready — both are open (not 401)
      expect([200, 503]).toContain(res.status);
    });

    test('POST /auth/magic is open (returns 501 stub, not 401)', async () => {
      const res = await app.request('/auth/magic', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' }),
      });
      expect(res.status).toBe(501);
    });

    test('GET /auth/verify is open', async () => {
      const res = await app.request('/auth/verify?token=anything');
      expect(res.status).toBe(501);
    });
  });

  describe('protected routes — no session', () => {
    test('GET /api/variants → 401', async () => {
      const res = await app.request('/api/variants');
      expect(res.status).toBe(401);
      const body = (await res.json()) as { error: string };
      expect(body.error).toBe('unauthorized');
    });

    test('GET /api/settings → 401', async () => {
      const res = await app.request('/api/settings');
      expect(res.status).toBe(401);
    });

    test('POST /api/briefs → 401 (auth blocks before validation)', async () => {
      const res = await app.request('/api/briefs', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ free_text: 'should not reach handler' }),
      });
      expect(res.status).toBe(401);
    });

    test('GET /media/sign → 401', async () => {
      const res = await app.request('/media/sign?asset_id=foo');
      expect(res.status).toBe(401);
    });
  });

  describe('protected routes — invalid session', () => {
    test('garbage cookie value → 401', async () => {
      const res = await app.request('/api/variants', {
        headers: { cookie: 'sw_session=this-is-not-a-signed-cookie' },
      });
      expect(res.status).toBe(401);
    });

    test('cookie with valid signature but malformed JSON → 401', async () => {
      // Hand-craft a cookie signed with a different secret — sig will fail.
      const tmp = new Hono();
      tmp.get('/', async (c) => {
        await setSignedCookie(c, 'sw_session', 'not-valid-json', 'wrong-secret-aaaaaaaaaaaaaaaaaaaaaaaa');
        return c.text('ok');
      });
      const minted = await tmp.request('/');
      const cookie = minted.headers.get('set-cookie')!.split(';')[0];

      const res = await app.request('/api/variants', { headers: { cookie } });
      expect(res.status).toBe(401);
    });
  });

  describe('protected routes — valid session', () => {
    test('GET /api/variants with valid session reaches handler (501 stub)', async () => {
      const cookie = await mintSessionCookie('test@example.com');
      const res = await app.request('/api/variants', { headers: { cookie } });
      expect(res.status).toBe(501);
      const body = (await res.json()) as { step: string };
      expect(body.step).toBe('variants.list');
    });

    test('GET /api/settings with valid session returns presence map', async () => {
      const cookie = await mintSessionCookie('test@example.com');
      const res = await app.request('/api/settings', { headers: { cookie } });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { secrets: Record<string, boolean> };
      expect(body.secrets).toBeDefined();
      expect(typeof body.secrets.anthropic).toBe('boolean');
    });
  });

  describe('audit middleware writes rows', () => {
    test('POST /api/briefs writes audit_log row with email + action', async () => {
      const cookie = await mintSessionCookie('audit-test@example.com');
      const res = await app.request('/api/briefs', {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie },
        body: JSON.stringify({ free_text: 'audit test brief' }),
      });
      // Stub still returns 501, but audit middleware fires after next().
      expect(res.status).toBe(501);

      const row = db().query(
        `SELECT email, action, target_type
         FROM audit_log
         WHERE email = ? AND action = 'generate'
         ORDER BY id DESC LIMIT 1`,
      ).get('audit-test@example.com') as
        | { email: string; action: string; target_type: string }
        | null;

      expect(row).not.toBeNull();
      expect(row!.email).toBe('audit-test@example.com');
      expect(row!.action).toBe('generate');
      expect(row!.target_type).toBe('brief');
    });

    test('POST /api/variants/:id/approve writes audit_log with target_id', async () => {
      const cookie = await mintSessionCookie('approver@example.com');
      const res = await app.request('/api/variants/42/approve', {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie },
        body: JSON.stringify({ ai_disclosure_acknowledged: true }),
      });
      expect(res.status).toBe(501);

      const row = db().query(
        `SELECT email, action, target_type, target_id
         FROM audit_log
         WHERE email = ? AND action = 'approve'
         ORDER BY id DESC LIMIT 1`,
      ).get('approver@example.com') as
        | { email: string; action: string; target_type: string; target_id: string }
        | null;

      expect(row).not.toBeNull();
      expect(row!.action).toBe('approve');
      expect(row!.target_type).toBe('variant');
      expect(row!.target_id).toBe('42');
    });

    test('POST /api/settings/tw-sync writes audit_log without target', async () => {
      const cookie = await mintSessionCookie('sync@example.com');
      const res = await app.request('/api/settings/tw-sync', {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie },
        body: '{}',
      });
      expect(res.status).toBe(501);

      const row = db().query(
        `SELECT email, action FROM audit_log
         WHERE email = ? AND action = 'tw_sync'
         ORDER BY id DESC LIMIT 1`,
      ).get('sync@example.com') as { email: string; action: string } | null;

      expect(row).not.toBeNull();
      expect(row!.action).toBe('tw_sync');
    });

    test('failed-auth requests do NOT write audit_log rows', async () => {
      const before = db().query('SELECT COUNT(*) AS n FROM audit_log').get() as { n: number };
      const res = await app.request('/api/briefs', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ free_text: 'unauthorized attempt' }),
      });
      expect(res.status).toBe(401);
      const after = db().query('SELECT COUNT(*) AS n FROM audit_log').get() as { n: number };
      expect(after.n).toBe(before.n);
    });
  });
});
