import { Hono } from 'hono';
import { presence } from '@lib/services/secrets.ts';
import { audit } from '../middleware/audit.ts';

const app = new Hono();

// SAD §6.1 — Settings screen contract: presence booleans only, never values
app.get('/', (c) => c.json({ secrets: presence() }));

app.post('/secrets', audit('secret_update', 'secret'), async (c) => {
  // TODO: validate vendor key against vendor identity endpoint, persist to data/secrets.env, audit-log
  return c.json({ error: 'not_implemented', step: 'settings.update_secret' }, 501);
});

app.post('/tw-sync', audit('tw_sync'), async (c) => {
  // TODO: trigger TW Connector incremental sync, return new watermark + row counts
  return c.json({ error: 'not_implemented', step: 'settings.tw_sync' }, 501);
});

export default app;
