import { describe, test, expect, beforeAll, beforeEach, afterAll } from 'bun:test';

import { migrate } from '@db/migrate.ts';
import { db } from '@db/client.ts';
import { loadSecrets } from '@lib/services/secrets.ts';
import { setResendClientForTest } from '@lib/services/auth-email.ts';
import { createApp } from '../../src/server/app.ts';

// Lane A: magic-link auth flow end-to-end. Pins:
//   1. POST /magic with allowed email → 200 + token row + Resend.send called
//   2. POST /magic with unallowed email → 200 ok:true, NO token, NO send
//      (don't leak which addresses are operators)
//   3. POST /magic with invalid email format → 400
//   4. POST /magic when Resend throws → 502, token row deleted
//   5. GET /verify with valid token → 302 redirect, single-use (row deleted),
//      session cookie set
//   6. GET /verify with garbage token → 401
//   7. GET /verify with expired token → 401
//   8. GET /verify replay (same token twice) → second 401
//   9. POST /logout → 200 + cookie deleted
//   10. ALLOWED_OPERATORS is case-insensitive
//   11. Audit rows written for magic_link_send and login

process.env.DB_PATH = ':memory:';

interface SentEmail {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

function makeFakeResend(): { sent: SentEmail[]; throwOnce?: boolean } {
  return { sent: [] };
}

function installResend(state: { sent: SentEmail[]; throwOn?: boolean | string }): void {
  setResendClientForTest({
    emails: {
      send: async (params) => {
        if (state.throwOn) {
          throw new Error(typeof state.throwOn === 'string' ? state.throwOn : 'fake send failure');
        }
        state.sent.push(params);
        return { id: 'fake-msg-id' };
      },
    },
  });
}

describe('magic-link auth flow', () => {
  let app: ReturnType<typeof createApp>;
  let state: { sent: SentEmail[]; throwOn?: boolean | string };

  beforeAll(async () => {
    loadSecrets();
    process.env.PUBLIC_BASE_URL = 'http://test.local';
    await migrate({ quiet: true });
    app = createApp();
  });

  beforeEach(() => {
    db().run('DELETE FROM auth_token');
    db().run('DELETE FROM audit_log');
    state = makeFakeResend();
    installResend(state);
  });

  afterAll(() => {
    setResendClientForTest(null);
    delete process.env.PUBLIC_BASE_URL;
  });

  describe('POST /auth/magic', () => {
    test('allowed email → 200 ok, token row written, email sent', async () => {
      const res = await app.request('/auth/magic', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' }),
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { ok: boolean };
      expect(body.ok).toBe(true);

      const row = db().query(
        `SELECT email, token_hash FROM auth_token WHERE email = 'test@example.com'`,
      ).get() as { email: string; token_hash: string } | null;
      expect(row).not.toBeNull();
      expect(row!.token_hash).toMatch(/^[0-9a-f]{64}$/);

      expect(state.sent.length).toBe(1);
      expect(state.sent[0].to).toBe('test@example.com');
      expect(state.sent[0].subject).toContain('Saltwater');
      expect(state.sent[0].html).toContain('http://test.local/auth/verify?token=');
    });

    test('unallowed email → 200 ok (don\'t leak), but NO token + NO send', async () => {
      const res = await app.request('/auth/magic', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'attacker@evil.test' }),
      });
      expect(res.status).toBe(200);

      const row = db().query(
        `SELECT email FROM auth_token WHERE email = ?`,
      ).get('attacker@evil.test');
      expect(row).toBeNull();
      expect(state.sent.length).toBe(0);

      // Audit row records the rejected attempt
      const audit = db().query(
        `SELECT meta_json FROM audit_log WHERE action = 'magic_link_send' ORDER BY id DESC LIMIT 1`,
      ).get() as { meta_json: string };
      const meta = JSON.parse(audit.meta_json) as { allowed: boolean };
      expect(meta.allowed).toBe(false);
    });

    test('invalid email format → 400', async () => {
      const res = await app.request('/auth/magic', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'not-an-email' }),
      });
      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: string };
      expect(body.error).toBe('invalid_email');
    });

    test('missing body → 400', async () => {
      const res = await app.request('/auth/magic', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '',
      });
      expect(res.status).toBe(400);
    });

    test('Resend throws → 502 + token row deleted', async () => {
      state.throwOn = 'simulated provider outage';
      const res = await app.request('/auth/magic', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' }),
      });
      expect(res.status).toBe(502);
      const body = (await res.json()) as { error: string };
      expect(body.error).toBe('email_send_failed');

      const row = db().query(`SELECT email FROM auth_token WHERE email = 'test@example.com'`).get();
      expect(row).toBeNull();
    });

    test('email is case-insensitive against ALLOWED_OPERATORS', async () => {
      const res = await app.request('/auth/magic', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'TEST@Example.COM' }),
      });
      expect(res.status).toBe(200);
      expect(state.sent.length).toBe(1);
      // Stored email is lowercased
      const row = db().query(`SELECT email FROM auth_token`).get() as { email: string };
      expect(row.email).toBe('test@example.com');
    });
  });

  describe('GET /auth/verify', () => {
    async function requestMagicLink(email: string): Promise<string> {
      // Trigger the magic-link flow and pluck the raw token off the captured email body.
      await app.request('/auth/magic', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const body = state.sent[state.sent.length - 1].html;
      const m = body.match(/\/auth\/verify\?token=([^"&]+)/);
      if (!m) throw new Error('test setup: no token in sent email');
      return decodeURIComponent(m[1]);
    }

    test('valid token → 302 + Set-Cookie sw_session + token row deleted', async () => {
      const token = await requestMagicLink('test@example.com');

      const res = await app.request(`/auth/verify?token=${encodeURIComponent(token)}`, {
        redirect: 'manual',
      });
      expect(res.status).toBe(302);
      expect(res.headers.get('location')).toBe('/');

      const setCookie = res.headers.get('set-cookie') ?? '';
      expect(setCookie).toContain('sw_session=');
      expect(setCookie.toLowerCase()).toContain('httponly');
      expect(setCookie.toLowerCase()).toContain('samesite=lax');

      const remaining = db().query(`SELECT email FROM auth_token WHERE email = 'test@example.com'`).get();
      expect(remaining).toBeNull();

      // Audit row written with action=login, target_id=email
      const audit = db().query(
        `SELECT email, target_id FROM audit_log WHERE action = 'login' ORDER BY id DESC LIMIT 1`,
      ).get() as { email: string; target_id: string };
      expect(audit.email).toBe('test@example.com');
      expect(audit.target_id).toBe('test@example.com');
    });

    test('replay (same token twice) → first 302, second 401', async () => {
      const token = await requestMagicLink('test@example.com');
      const r1 = await app.request(`/auth/verify?token=${encodeURIComponent(token)}`, { redirect: 'manual' });
      expect(r1.status).toBe(302);
      const r2 = await app.request(`/auth/verify?token=${encodeURIComponent(token)}`, { redirect: 'manual' });
      expect(r2.status).toBe(401);
      const body = (await r2.json()) as { error: string };
      expect(body.error).toBe('invalid_token');
    });

    test('garbage token → 401 invalid_token', async () => {
      const res = await app.request('/auth/verify?token=this-is-not-a-real-token-aaaaaaaaaaaaaaaa');
      expect(res.status).toBe(401);
    });

    test('missing token → 401', async () => {
      const res = await app.request('/auth/verify');
      expect(res.status).toBe(401);
    });

    test('absurdly short / long token → 401 (no DB query needed)', async () => {
      const r1 = await app.request('/auth/verify?token=abc');
      expect(r1.status).toBe(401);
      const r2 = await app.request(`/auth/verify?token=${'X'.repeat(500)}`);
      expect(r2.status).toBe(401);
    });

    test('expired token → 401 expired_token', async () => {
      // Insert an already-expired row directly with a known raw token.
      const { randomBytes, createHash } = await import('node:crypto');
      const raw = randomBytes(32).toString('base64url');
      const hash = createHash('sha256').update(raw).digest('hex');
      db().run(
        `INSERT INTO auth_token (token_hash, email, expires_at)
         VALUES (?, 'test@example.com', datetime('now', '-1 hour'))`,
        [hash],
      );
      const res = await app.request(`/auth/verify?token=${encodeURIComponent(raw)}`, { redirect: 'manual' });
      expect(res.status).toBe(401);
      const body = (await res.json()) as { error: string };
      expect(body.error).toBe('expired_token');
      // Row WAS deleted because verify is single-use even on expiry
      const row = db().query(`SELECT email FROM auth_token`).get();
      expect(row).toBeNull();
    });

    test('concurrent verify with same token — only ONE succeeds (race fix)', async () => {
      // T-VERIFY-RACE (eng-review-3): SELECT/DELETE was not atomic. Two
      // simultaneous verifies with the same token both passed SELECT, both
      // ran DELETE (one was a no-op), both minted sessions. Now using
      // DELETE...RETURNING which guarantees at most one verify succeeds.
      const token = await requestMagicLink('test@example.com');

      const [r1, r2] = await Promise.all([
        app.request(`/auth/verify?token=${encodeURIComponent(token)}`, { redirect: 'manual' }),
        app.request(`/auth/verify?token=${encodeURIComponent(token)}`, { redirect: 'manual' }),
      ]);

      const statuses = [r1.status, r2.status].sort();
      // One 302 (winner), one 401 (loser).
      expect(statuses).toEqual([302, 401]);

      // Token row deleted (atomically, by the winner).
      const remaining = db().query('SELECT COUNT(*) AS n FROM auth_token').get() as { n: number };
      expect(remaining.n).toBe(0);
    });

    test('the issued cookie unlocks /api/* on subsequent requests', async () => {
      const token = await requestMagicLink('test@example.com');
      const verify = await app.request(`/auth/verify?token=${encodeURIComponent(token)}`, { redirect: 'manual' });
      const setCookie = verify.headers.get('set-cookie')!;
      const cookie = setCookie.split(';')[0]; // sw_session=<value>

      const res = await app.request('/api/settings', { headers: { cookie } });
      expect(res.status).toBe(200);
    });
  });

  describe('POST /auth/logout', () => {
    test('returns ok and emits a cookie with maxAge=0', async () => {
      const res = await app.request('/auth/logout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      });
      expect(res.status).toBe(200);
      const setCookie = res.headers.get('set-cookie') ?? '';
      // deleteCookie sets Max-Age=0 (or expires in the past)
      expect(setCookie).toContain('sw_session=');
      expect(setCookie.toLowerCase()).toMatch(/max-age=0|expires=/);
    });
  });

  describe('expired-token sweep', () => {
    test('expired tokens are cleaned out when a new magic-link is requested', async () => {
      // Insert 2 expired tokens
      db().run(
        `INSERT INTO auth_token (token_hash, email, expires_at)
         VALUES ('aa', 'old1@example.com', datetime('now', '-2 hour'))`,
      );
      db().run(
        `INSERT INTO auth_token (token_hash, email, expires_at)
         VALUES ('bb', 'old2@example.com', datetime('now', '-3 hour'))`,
      );
      expect((db().query('SELECT COUNT(*) AS n FROM auth_token').get() as { n: number }).n).toBe(2);

      await app.request('/auth/magic', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' }),
      });
      // 1 fresh row only
      const remaining = db().query('SELECT email FROM auth_token').all() as Array<{ email: string }>;
      expect(remaining.length).toBe(1);
      expect(remaining[0].email).toBe('test@example.com');
    });
  });
});
