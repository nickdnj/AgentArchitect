import { loadSecrets } from '@lib/services/secrets.ts';
import { log } from '@lib/log.ts';
import { resetDbConnection } from '@db/client.ts';
import { tick } from './tick.ts';

// SAD §3 + §4 — worker process. Polls SQLite every 2s for queued render attempts.
// Run via: bun run src/worker/poll-jobs.ts
// PROC_NAME=worker is set by the systemd unit (SAD §12.1) so log lines carry
// proc='worker' instead of the default 'web'.

loadSecrets();

const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS ?? 2000);
const MAX_CONCURRENT = Number(process.env.MAX_CONCURRENT_RENDERS ?? 4);

let stopping = false;
process.on('SIGINT', () => { stopping = true; });
process.on('SIGTERM', () => { stopping = true; });

async function loop(): Promise<void> {
  log.info(
    { poll_ms: POLL_INTERVAL_MS, max_concurrent: MAX_CONCURRENT, pid: process.pid },
    'worker_started',
  );
  while (!stopping) {
    try {
      await tick({ maxConcurrent: MAX_CONCURRENT });
    } catch (err) {
      const message = (err as Error).message;
      log.error(
        { err: { message, stack: (err as Error).stack } },
        'worker_tick_failed',
      );
      // eng-review-3 demo: bun:sqlite occasionally produces SQLITE_IOERR
      // ('disk I/O error') under sustained load. Self-heal by dropping the
      // singleton DB connection — next tick opens a fresh one.
      if (message.includes('disk I/O error')) {
        log.warn({}, 'resetting_db_connection_after_io_error');
        resetDbConnection();
      }
    }
    await Bun.sleep(POLL_INTERVAL_MS);
  }
  log.info('worker_stopped');
}

loop();
