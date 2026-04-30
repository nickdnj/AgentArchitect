import type { MiddlewareHandler } from 'hono';
import { getSignedCookie } from 'hono/cookie';
import { secrets } from '@lib/services/secrets.ts';

// SAD §5.2 — session storage in signed cookie
export function requireAuth(): MiddlewareHandler {
  return async (c, next) => {
    const sessionSecret = secrets.sessionSig();
    const cookie = await getSignedCookie(c, sessionSecret, 'sw_session');
    if (!cookie) {
      return c.json({ error: 'unauthorized' }, 401);
    }
    try {
      const session = JSON.parse(cookie);
      c.set('email', session.email);
      await next();
    } catch {
      return c.json({ error: 'unauthorized' }, 401);
    }
  };
}
