import { Hono } from 'hono';
import { presence } from '@lib/services/secrets.ts';
import { syncIncremental } from '@lib/services/tw-connector.ts';
import { log } from '@lib/log.ts';
import { audit } from '../middleware/audit.ts';

const app = new Hono();

// SAD §6.1 — Settings screen contract: presence booleans only, never values
app.get('/', (c) => c.json({ secrets: presence() }));

app.post('/secrets', audit('secret_update', 'secret'), async (c) => {
  // TODO: validate vendor key against vendor identity endpoint, persist to data/secrets.env, audit-log
  return c.json({ error: 'not_implemented', step: 'settings.update_secret' }, 501);
});

app.post('/tw-sync', audit('tw_sync'), async (c) => {
  const requestId = c.get('requestId') as string | undefined;
  try {
    const result = await syncIncremental();
    c.set('auditMeta', {
      window_start: result.windowStart,
      window_end: result.windowEnd,
      metrics: result.metricsUpserted,
      orders: result.ordersUpserted,
      ad_rows: result.adRowsUpserted,
    });
    return c.json(result);
  } catch (err) {
    const message = (err as Error).message;
    log.error({ request_id: requestId, err: { message } }, 'tw_sync_failed');
    c.set('auditMeta', { error: message.slice(0, 500) });
    // Graceful degradation per F-TW-8: return 502 so the UI can show "TW
    // sync failed — last good sync at <pulled_at>". Never crash the server.
    return c.json({ error: 'tw_sync_failed', message }, 502);
  }
});

export default app;
