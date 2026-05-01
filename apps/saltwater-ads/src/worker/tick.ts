import { db } from '@db/client.ts';
import { log } from '@lib/log.ts';
import { runPipeline } from './pipeline.ts';
import { VENDOR_TIMEOUTS_MS } from './deadlines.ts';

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

// Transit states that should NOT live longer than totalJob ceiling. Anything
// older than 15 min in one of these states gets swept to failed_recoverable.
// PRD §7.2 + A3 (deferred from eng-review-2): without this, a bun --hot
// restart mid-render leaves attempts wedged forever.
const TRANSIT_STATES = ['hooks_generating', 'vendor_pending', 'assembling'] as const;
const TOTAL_JOB_MS = VENDOR_TIMEOUTS_MS.totalJob;

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

/**
 * A1 fix: when a pipeline throws, the render_attempt is in a transit state
 * (hooks_generating | vendor_pending | assembling) that is NOT in
 * CLAIMABLE_STATES. Without an explicit transition, the row sits forever and
 * blocks the variant.
 *
 * markFailed transitions the attempt to failed_recoverable with the error
 * message recorded. Operator-action thresholds (24h with no retry → terminal)
 * are enforced by a separate sweep job (deferred — see TODOS.md A1-followup).
 *
 * Codex eng-review-3 #11: also flips variant.status='failed' so Joe's review
 * queue (filtered by variant.status) actually shows the failure. Previously
 * variant.status stayed 'queued' on failure — no operator query surface.
 */
export function markFailed(attemptId: number, errorMessage: string): void {
  const conn = db();
  conn.transaction(() => {
    conn.run(
      `UPDATE render_attempt
       SET state = 'failed_recoverable',
           error_message = ?,
           finished_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [errorMessage.slice(0, 1000), attemptId],
    );
    // Flip the parent variant so the Review Queue surfaces the failure.
    conn.run(
      `UPDATE variant
       SET status = 'failed'
       WHERE id = (SELECT variant_id FROM render_attempt WHERE id = ?)
         AND status NOT IN ('approved', 'rejected', 'ready_for_review')`,
      [attemptId],
    );
  })();
}

/**
 * A3: sweep render_attempts that have lived in a transit state past the
 * totalJob ceiling (15 min). Likely caused by:
 *   - worker crash / restart after the claim but before completion
 *   - vendor hung past per-vendor timeout (shouldn't happen, defense-in-depth)
 *   - hook-set lock holder died and parallel attempts kept polling
 *
 * Swept rows transition to failed_recoverable. Joe sees them as "needs
 * attention" in the Review Queue and can retry. Operator-action sweep
 * (failed_recoverable → failed_terminal at 24h) is still deferred — see
 * TODOS.md A1-followup.
 */
export function sweepStaleAttempts(): number {
  const ceilingMinutes = Math.ceil(TOTAL_JOB_MS / 60_000);
  const conn = db();
  let swept = 0;
  conn.transaction(() => {
    const res = conn.run(
      `UPDATE render_attempt
       SET state = 'failed_recoverable',
           error_message = COALESCE(error_message, '') || 'swept: total-job ceiling exceeded',
           finished_at = CURRENT_TIMESTAMP
       WHERE state IN (${TRANSIT_STATES.map(() => '?').join(',')})
         AND started_at IS NOT NULL
         AND started_at < datetime('now', '-' || ? || ' minutes')`,
      [...TRANSIT_STATES, ceilingMinutes],
    );
    swept = res.changes as number;
    if (swept > 0) {
      // Codex #11: also flip variant.status so Review Queue surfaces them.
      conn.run(
        `UPDATE variant
         SET status = 'failed'
         WHERE id IN (
           SELECT variant_id FROM render_attempt
           WHERE state = 'failed_recoverable' AND finished_at >= datetime('now', '-1 minute')
         )
         AND status NOT IN ('approved', 'rejected', 'ready_for_review')`,
      );
    }
  })();
  if (swept > 0) {
    log.warn({ swept, ceiling_minutes: ceilingMinutes }, 'sweep_stale_attempts');
  }
  return swept;
}

export async function tick(args: TickArgs): Promise<void> {
  // Sweep wedged transit-state rows BEFORE claiming new work.
  // Isolate sweep failures so a transient SQLite hiccup doesn't gate claims.
  // Discovered in eng-review-3 dogfood: sweep was throwing "disk I/O error"
  // on a long-running worker process and blocking the entire tick loop.
  // Sweep is best-effort (it cleans up stale rows) — claim is the hot path.
  try {
    sweepStaleAttempts();
  } catch (err) {
    log.error(
      { err: { message: (err as Error).message } },
      'sweep_failed_continuing_to_claim',
    );
  }

  const claimed = claimJobs(args.maxConcurrent);
  if (claimed.length === 0) return;
  await Promise.all(claimed.map((job) =>
    runPipeline(job).catch((err) => {
      const message = (err as Error).message;
      log.error(
        {
          attempt_id: job.renderAttemptId,
          variant_id: job.variantId,
          from_state: job.fromState,
          to_state: job.state,
          err: { message, stack: (err as Error).stack },
        },
        'pipeline_failed',
      );
      try {
        markFailed(job.renderAttemptId, message);
      } catch (markErr) {
        // If we can't even record the failure, log it loudly — but don't
        // re-throw, the worker loop must keep going.
        log.error(
          {
            attempt_id: job.renderAttemptId,
            err: { message: (markErr as Error).message },
          },
          'mark_failed_failed',
        );
      }
    })
  ));
}
