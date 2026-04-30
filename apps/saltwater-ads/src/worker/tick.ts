import { db } from '@db/client.ts';
import { runPipeline } from './pipeline.ts';

// SAD §4 — one polling iteration.
// Claims jobs atomically via BEGIN IMMEDIATE + compare-and-swap state precondition.
// The CAS pattern: UPDATE ... WHERE id=? AND state=? — only proceeds if state matches expected.
// This makes the claim safe under concurrent workers / bun --hot restarts.

const CLAIMABLE_STATES = ['queued', 'hooks_ready', 'partial'] as const;
type ClaimableState = (typeof CLAIMABLE_STATES)[number];

const NEXT_STATE: Record<ClaimableState, string> = {
  queued: 'hooks_generating',
  hooks_ready: 'vendor_pending',
  partial: 'assembling',
};

export interface TickArgs {
  maxConcurrent: number;
}

export interface ClaimedJob {
  renderAttemptId: number;
  variantId: number;
  /** State AFTER successful claim (i.e., the state the pipeline runs from). */
  state: string;
  /** State BEFORE the claim — useful for pipeline branching on what work was already done. */
  fromState: ClaimableState;
}

export function claimJobs(limit: number): ClaimedJob[] {
  const conn = db();
  return conn.transaction(() => {
    const candidates = conn.query(
      `SELECT id, variant_id, state FROM render_attempt
       WHERE state IN (${CLAIMABLE_STATES.map(() => '?').join(',')})
       ORDER BY id ASC LIMIT ?`
    ).all(...CLAIMABLE_STATES, limit) as { id: number; variant_id: number; state: ClaimableState }[];

    const claimed: ClaimedJob[] = [];
    for (const c of candidates) {
      const next = NEXT_STATE[c.state];
      if (!next) continue;
      // Compare-and-swap: only claim if state hasn't changed since the SELECT.
      const res = conn.run(
        `UPDATE render_attempt
         SET state = ?, started_at = COALESCE(started_at, CURRENT_TIMESTAMP)
         WHERE id = ? AND state = ?`,
        [next, c.id, c.state]
      );
      if (res.changes === 1) {
        claimed.push({
          renderAttemptId: c.id,
          variantId: c.variant_id,
          state: next,
          fromState: c.state,
        });
      }
    }
    return claimed;
  }).immediate();
}

export async function tick(args: TickArgs): Promise<void> {
  const claimed = claimJobs(args.maxConcurrent);
  if (claimed.length === 0) return;
  await Promise.all(claimed.map((job) =>
    runPipeline(job).catch((err) => {
      console.error(JSON.stringify({
        level: 'error',
        source: 'worker.pipeline',
        render_attempt_id: job.renderAttemptId,
        from_state: job.fromState,
        error: (err as Error).message,
      }));
    })
  ));
}
