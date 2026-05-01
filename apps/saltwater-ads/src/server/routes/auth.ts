import { Hono } from 'hono';
import { setSignedCookie, deleteCookie } from 'hono/cookie';
import { z } from 'zod';
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { db } from '@db/client.ts';
import { secrets } from '@lib/services/secrets.ts';
import { sendMagicLink } from '@lib/services/auth-email.ts';
import { log } from '@lib/log.ts';
import { audit } from '../middleware/audit.ts';

// SAD §5.1 — magic-link flow
//   POST /auth/magic { email }       — generate token, send via Resend, store SHA-256 in auth_token
//   GET  /auth/verify?token=...      — look up SHA-256, mint signed-cookie session, delete row
//   POST /auth/logout                — clear cookie

const app = new Hono();

const TOKEN_TTL_MIN = 15;
const SESSION_TTL_DAYS = 30;
const SESSION_TTL_SECONDS = SESSION_TTL_DAYS * 86400;

const MagicReq = z.object({ email: z.string().email() });

function tokenHash(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

function isAllowedOperator(email: string): boolean {
  const allowed = secrets.allowedOperators(); // already lowercased
  return allowed.includes(email.toLowerCase());
}

function magicLinkBaseUrl(): string {
  return process.env.PUBLIC_BASE_URL ?? 'http://localhost:3001';
}

/**
 * Sweep expired tokens whenever we touch the table. Cheap (indexed on
 * expires_at), keeps the table from growing unbounded if Joe never
 * actually clicks his links.
 */
function sweepExpired(): void {
  db().run(`DELETE FROM auth_token WHERE expires_at < datetime('now')`);
}

app.post('/magic', audit('magic_link_send'), async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = MagicReq.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'invalid_email' }, 400);
  }
  const email = parsed.data.email.toLowerCase();
  c.set('auditTargetId', email);

  // Allowlist check. To avoid leaking which emails are operators, we still
  // return 200 + ok:true even when the address isn't allowed — but we don't
  // send anything. Audit row records the rejection.
  if (!isAllowedOperator(email)) {
    log.warn({ email }, 'magic_link_request_rejected_unauthorized');
    c.set('auditMeta', { allowed: false });
    return c.json({ ok: true });
  }

  sweepExpired();

  const rawToken = randomBytes(32).toString('base64url');
  const hash = tokenHash(rawToken);

  db().run(
    `INSERT INTO auth_token (token_hash, email, expires_at)
     VALUES (?, ?, datetime('now', ?))`,
    [hash, email, `+${TOKEN_TTL_MIN} minutes`],
  );

  const link = `${magicLinkBaseUrl()}/auth/verify?token=${encodeURIComponent(rawToken)}`;

  try {
    await sendMagicLink({ to: email, link });
  } catch (err) {
    const message = (err as Error).message;
    log.error({ email, err: { message } }, 'magic_link_send_failed');
    // Drop the token row — it'd be unusable anyway, and we don't want a
    // fail-state to leave dead tokens behind.
    db().run(`DELETE FROM auth_token WHERE token_hash = ?`, [hash]);
    c.set('auditMeta', { allowed: true, sent: false, error: message.slice(0, 200) });
    return c.json({ error: 'email_send_failed' }, 502);
  }

  c.set('auditMeta', { allowed: true, sent: true });
  return c.json({ ok: true });
});

app.get('/verify', audit('login'), async (c) => {
  const raw = c.req.query('token');
  if (!raw || typeof raw !== 'string' || raw.length < 16 || raw.length > 256) {
    return c.json({ error: 'invalid_token' }, 401);
  }

  const hash = tokenHash(raw);

  // SELECT first so we can timingSafeEqual on the hash compare. SQL '=' is
  // already constant-time-ish on hex strings, but the explicit compare
  // keeps intent clear and lets us pivot to a different storage shape later.
  const row = db().query(
    `SELECT token_hash, email, expires_at FROM auth_token WHERE token_hash = ?`,
  ).get(hash) as { token_hash: string; email: string; expires_at: string } | null;

  if (!row) {
    log.warn({}, 'magic_link_verify_unknown_token');
    return c.json({ error: 'invalid_token' }, 401);
  }

  // Timing-safe hash compare (defense-in-depth on SQL match).
  const a = Buffer.from(row.token_hash, 'hex');
  const b = Buffer.from(hash, 'hex');
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return c.json({ error: 'invalid_token' }, 401);
  }

  // Single-use: delete BEFORE issuing the session, so a replay can't sneak
  // another verify even if the cookie write fails.
  db().run(`DELETE FROM auth_token WHERE token_hash = ?`, [hash]);

  // SQLite stores expires_at as 'YYYY-MM-DD HH:MM:SS'. Append Z to parse as UTC.
  const expiresAt = new Date(row.expires_at.replace(' ', 'T') + 'Z');
  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
    return c.json({ error: 'expired_token' }, 401);
  }

  c.set('email', row.email);
  c.set('auditTargetId', row.email);

  await setSignedCookie(
    c,
    'sw_session',
    JSON.stringify({ email: row.email, iat: Date.now() }),
    secrets.sessionSig(),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: SESSION_TTL_SECONDS,
      path: '/',
    },
  );

  // Browser flow: redirect to SPA root. JSON clients (tests) get the cookie
  // either way via Set-Cookie header.
  return c.redirect('/', 302);
});

app.post('/logout', audit('logout'), async (c) => {
  deleteCookie(c, 'sw_session', { path: '/' });
  return c.json({ ok: true });
});

export default app;
