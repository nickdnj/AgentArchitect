import { Hono } from 'hono';
import { setSignedCookie } from 'hono/cookie';
import { loadSecrets, secrets } from '@lib/services/secrets.ts';

// Dev-only: mint a signed sw_session cookie for a given email so we can hit
// /api/* without going through the magic-link flow. NOT FOR PROD.

loadSecrets();

const email = process.argv[2] ?? 'nickd@demarconet.com';
const app = new Hono();
app.get('/', async (c) => {
  await setSignedCookie(c, 'sw_session', JSON.stringify({ email, iat: Date.now() }), secrets.sessionSig(), {
    path: '/', httpOnly: true, sameSite: 'Lax', maxAge: 30 * 86400,
  });
  return c.text('ok');
});

const res = await app.request('/');
const cookie = res.headers.get('set-cookie');
console.log(cookie?.split(';')[0]);
