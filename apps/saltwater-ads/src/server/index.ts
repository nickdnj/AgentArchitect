import { serve } from 'bun';
import { createApp } from './app.ts';
import { loadSecrets } from '@lib/services/secrets.ts';
import { log } from '@lib/log.ts';
import { tick } from '../worker/tick.ts';
import { resetDbConnection } from '@db/client.ts';

loadSecrets();

const PORT = Number(process.env.PORT ?? 3001);
const app = createApp();

serve({
  fetch: app.fetch,
  port: PORT,
  development: process.env.NODE_ENV !== 'production',
});

log.info({ port: PORT, pid: process.pid }, 'web_started');

// Eng-review-3 dogfood: bun:sqlite is unstable under concurrent ops on a
// shared connection. setInterval(tick) running in the SAME process as the
// request handlers caused intermittent SQLITE_IOERR when an interval
// callback fired between the awaits in snapshotBucket(). Sprint 1 instead
// uses LAZY-DRIVEN ticks: each successful POST /api/briefs schedules a
// tick via setImmediate so the brief response returns first, then the tick
// runs on the next event loop iteration with no concurrent DB access.
//
// In production, ALSO run a separate worker process (bun src/worker/poll-jobs.ts)
// for time-based progress (vendor poll completion, A3 sweep). The systemd unit
// in SAD §12.1 should ship two services: saltwater-web + saltwater-worker.
// Locally, the worker process is optional — interactive flows work without it.
if (process.env.INLINE_WORKER === 'true') {
  const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS ?? 2000);
  const MAX_CONCURRENT = Number(process.env.MAX_CONCURRENT_RENDERS ?? 4);
  log.info(
    { poll_ms: POLL_INTERVAL_MS, max_concurrent: MAX_CONCURRENT },
    'inline_worker_started',
  );
  setInterval(() => {
    tick({ maxConcurrent: MAX_CONCURRENT }).catch((err) => {
      const message = (err as Error).message;
      log.error({ err: { message } }, 'inline_worker_tick_failed');
      if (message.includes('disk I/O error')) {
        resetDbConnection();
      }
    });
  }, POLL_INTERVAL_MS);
}
