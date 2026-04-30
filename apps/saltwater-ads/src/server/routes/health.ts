import { Hono } from 'hono';
import { db } from '@db/client.ts';

const app = new Hono();

app.get('/', (c) => c.json({ status: 'ok', service: 'saltwater-ads' }));

app.get('/ready', (c) => {
  try {
    const row = db().query('SELECT 1 AS ok').get() as { ok: number } | null;
    if (row?.ok === 1) return c.json({ status: 'ready' });
    return c.json({ status: 'degraded', reason: 'db_query_unexpected' }, 503);
  } catch (err) {
    return c.json({ status: 'unready', reason: (err as Error).message }, 503);
  }
});

export default app;
