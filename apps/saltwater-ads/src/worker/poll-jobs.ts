import { loadSecrets } from '@lib/services/secrets.ts';
import { tick } from './tick.ts';

// SAD §3 + §4 — worker process. Polls SQLite every 2s for queued render attempts.
// Run via: bun run src/worker/poll-jobs.ts

loadSecrets();

const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS ?? 2000);
const MAX_CONCURRENT = Number(process.env.MAX_CONCURRENT_RENDERS ?? 4);

let stopping = false;
process.on('SIGINT', () => { stopping = true; });
process.on('SIGTERM', () => { stopping = true; });

async function loop(): Promise<void> {
  console.log(`saltwater-ads worker starting — poll=${POLL_INTERVAL_MS}ms concurrency=${MAX_CONCURRENT}`);
  while (!stopping) {
    try {
      await tick({ maxConcurrent: MAX_CONCURRENT });
    } catch (err) {
      console.error(JSON.stringify({ level: 'error', source: 'worker.tick', error: (err as Error).message }));
    }
    await Bun.sleep(POLL_INTERVAL_MS);
  }
  console.log('worker stopped');
}

loop();
