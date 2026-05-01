import { Hono } from 'hono';
import { setSignedCookie, deleteCookie } from 'hono/cookie';
import { z } from 'zod';
import { randomBytes, createHash } from 'node:crypto';
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

  // T-VERIFY-RACE fix (eng-review-3): atomic DELETE...RETURNING ensures only
  // ONE concurrent verify of the same token wins. Two requests racing both
  // tried to SELECT then DELETE; both passed and both minted sessions.
  // SQLite supports RETURNING since 3.35 (bun:sqlite ships ≥ 3.45). The
  // DELETE WHERE clause already proves the hash matched, so timingSafeEqual
  // is redundant — only the winning DELETE returns a row.
  const row = db().query(
    `DELETE FROM auth_token WHERE token_hash = ? RETURNING email, expires_at`,
  ).get(hash) as { email: string; expires_at: string } | null;

  if (!row) {
    log.warn({}, 'magic_link_verify_unknown_or_replayed_token');
    return c.json({ error: 'invalid_token' }, 401);
  }

  // No timingSafeEqual: the atomic DELETE WHERE token_hash = ? already
  // proved hash equality at the storage layer. Race window is closed.

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

// Dev-only bypass: GET /auth/dev-login?email=... mints a session and redirects
// to /. Guarded by DEV_AUTH_BYPASS env (must be 'true') AND the email must be
// in ALLOWED_OPERATORS. Lets local dev skip the magic-link round-trip when
// Resend isn't wired with a real key.
//
// SAFETY: this route 404s in any env where DEV_AUTH_BYPASS !== 'true'.
// Production deployments MUST NOT set that env var. The systemd unit
// (SAD §12.1) doesn't set it.
app.get('/dev-login', async (c) => {
  if (process.env.DEV_AUTH_BYPASS !== 'true') {
    return c.json({ error: 'not_found' }, 404);
  }
  const email = (c.req.query('email') ?? '').toLowerCase();
  if (!email || !isAllowedOperator(email)) {
    return c.json({ error: 'unauthorized', reason: 'email_not_in_allowlist' }, 403);
  }
  await setSignedCookie(
    c,
    'sw_session',
    JSON.stringify({ email, iat: Date.now() }),
    secrets.sessionSig(),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: SESSION_TTL_SECONDS,
      path: '/',
    },
  );
  return c.redirect('/', 302);
});

export default app;
