import { Hono } from 'hono';
import { z } from 'zod';
// TODO: implement magic-link flow per SAD §5.1
//   POST /auth/magic { email }       — generate token, send via Resend, store SHA-256 in auth_token
//   GET  /auth/verify?token=...      — look up SHA-256, mint signed-cookie session, delete row
//   POST /auth/logout                — clear cookie

const app = new Hono();

const _MagicReq = z.object({ email: z.string().email() });

app.post('/magic', async (c) => {
  return c.json({ error: 'not_implemented', step: 'auth.magic-link.send' }, 501);
});

app.get('/verify', async (c) => {
  return c.json({ error: 'not_implemented', step: 'auth.magic-link.verify' }, 501);
});

app.post('/logout', async (c) => {
  return c.json({ error: 'not_implemented', step: 'auth.logout' }, 501);
});

export default app;
