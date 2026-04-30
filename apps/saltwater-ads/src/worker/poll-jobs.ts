import { loadSecrets } from '@lib/services/secrets.ts';
import { log } from '@lib/log.ts';
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
      log.error(
        { err: { message: (err as Error).message, stack: (err as Error).stack } },
        'worker_tick_failed',
      );
    }
    await Bun.sleep(POLL_INTERVAL_MS);
  }
  log.info('worker_stopped');
}

loop();
