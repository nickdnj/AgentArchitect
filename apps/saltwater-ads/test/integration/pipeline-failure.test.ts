import { describe, test, expect, beforeAll, beforeEach, mock } from 'bun:test';

import { migrate } from '@db/migrate.ts';
import { db } from '@db/client.ts';
import { tick, claimJobs, markFailed } from '../../src/worker/tick.ts';

// A1 (eng-review-2): when the pipeline throws, the render_attempt sits in a
// transit state forever (zombie job, never re-claimable, blocks the variant).
// PRD §6.5 promises "On error → failed_recoverable". These tests prove tick.ts
// honors that contract.

process.env.DB_PATH = ':memory:';

interface RenderAttemptRow {
  id: number;
  variant_id: number;
  state: string;
  error_message: string | null;
  started_at: string | null;
  finished_at: string | null;
}

async function seedQueuedAttempt(): Promise<{ variantId: number; attemptId: number }> {
  const conn = db();
  // Brand bucket version for FK
  const bbvId = Number(
    conn.run(
      `INSERT INTO brand_bucket_version
        (voice_sha256, customer_sha256, winning_patterns_sha256, products_sha256, hooks_winners_sha256, hooks_losers_sha256)
       VALUES ('a','b','c','d','e','f')`,
    ).lastInsertRowid,
  );
  const briefId = Number(
    conn.run(`INSERT INTO brief (operator, free_text) VALUES ('test', 'pipeline-failure seed')`).lastInsertRowid,
  );
  const hookSetId = Number(
    conn.run(
      `INSERT INTO hook_set (brief_id, brand_bucket_version_id, model, prompt_hash, status)
       VALUES (?, ?, 'claude-sonnet-4-6', 'test-hash', 'ready')`,
      [briefId, bbvId],
    ).lastInsertRowid,
  );
  const variantId = Number(
    conn.run(
      `INSERT INTO variant (hook_set_id, hook_text, sub_variant_label, status)
       VALUES (?, 'test hook for failure path', 'V1', 'queued')`,
      [hookSetId],
    ).lastInsertRowid,
  );
  const attemptId = Number(
    conn.run(
      `INSERT INTO render_attempt (variant_id, attempt_number, state) VALUES (?, 1, 'queued')`,
      [variantId],
    ).lastInsertRowid,
  );
  return { variantId, attemptId };
}

describe('A1 pipeline failure transitions to failed_recoverable', () => {
  beforeAll(async () => {
    await migrate({ quiet: true });
  });

  beforeEach(() => {
    db().run('DELETE FROM render_attempt');
    db().run('DELETE FROM variant');
    db().run('DELETE FROM hook_set');
    db().run('DELETE FROM brief');
    db().run('DELETE FROM brand_bucket_version');
  });

  test('markFailed() updates state, error_message, finished_at', async () => {
    const { attemptId } = await seedQueuedAttempt();
    // Move to transit state to simulate pipeline mid-run
    db().run(`UPDATE render_attempt SET state='hooks_generating', started_at=CURRENT_TIMESTAMP WHERE id=?`, [attemptId]);

    markFailed(attemptId, 'HeyGen 504 Gateway Timeout');

    const row = db().query('SELECT id, variant_id, state, error_message, started_at, finished_at FROM render_attempt WHERE id = ?')
      .get(attemptId) as RenderAttemptRow;
    expect(row.state).toBe('failed_recoverable');
    expect(row.error_message).toBe('HeyGen 504 Gateway Timeout');
    expect(row.finished_at).not.toBeNull();
  });

  test('markFailed truncates error message at 1000 chars', () => {
    const huge = 'X'.repeat(5000);
    db().run(
      `INSERT INTO brand_bucket_version
        (voice_sha256, customer_sha256, winning_patterns_sha256, products_sha256, hooks_winners_sha256, hooks_losers_sha256)
       VALUES ('a','b','c','d','e','f')`,
    );
    const briefId = Number(db().run(`INSERT INTO brief (operator, free_text) VALUES ('t', 't')`).lastInsertRowid);
    const hsId = Number(
      db().run(
        `INSERT INTO hook_set (brief_id, brand_bucket_version_id, model, prompt_hash, status) VALUES (?, 1, 'm', 'h', 'ready')`,
        [briefId],
      ).lastInsertRowid,
    );
    const vId = Number(
      db().run(`INSERT INTO variant (hook_set_id, hook_text, sub_variant_label, status) VALUES (?, 'h', 'V1', 'queued')`, [hsId])
        .lastInsertRowid,
    );
    const aId = Number(
      db().run(`INSERT INTO render_attempt (variant_id, attempt_number, state) VALUES (?, 1, 'hooks_generating')`, [vId])
        .lastInsertRowid,
    );

    markFailed(aId, huge);

    const row = db().query('SELECT error_message FROM render_attempt WHERE id = ?').get(aId) as { error_message: string };
    expect(row.error_message.length).toBe(1000);
  });

  test('tick: pipeline throws → state advances to failed_recoverable, not stuck in transit', async () => {
    const { attemptId } = await seedQueuedAttempt();

    // Stub runPipeline to throw. Bun's `mock.module` swaps the real import.
    mock.module('../../src/worker/pipeline.ts', () => ({
      runPipeline: async () => {
        throw new Error('synthetic pipeline failure: HeyGen returned 504');
      },
    }));

    await tick({ maxConcurrent: 4 });

    const row = db().query('SELECT id, state, error_message FROM render_attempt WHERE id = ?')
      .get(attemptId) as RenderAttemptRow;
    expect(row.state).toBe('failed_recoverable');
    expect(row.error_message).toContain('HeyGen returned 504');
  });

  test('tick: claimJobs ignores failed_recoverable rows on next pass (no zombie re-pickup)', async () => {
    const { attemptId } = await seedQueuedAttempt();
    markFailed(attemptId, 'previous failure');

    // failed_recoverable is NOT in CLAIMABLE_STATES — claimJobs returns nothing.
    const claimed = claimJobs(10);
    expect(claimed.find((j) => j.renderAttemptId === attemptId)).toBeUndefined();
  });

  test('tick: claim succeeds → pipeline throws → state moves; second tick does not re-claim', async () => {
    const { attemptId } = await seedQueuedAttempt();

    mock.module('../../src/worker/pipeline.ts', () => ({
      runPipeline: async () => {
        throw new Error('persistent failure');
      },
    }));

    await tick({ maxConcurrent: 4 });
    const afterFirst = db().query('SELECT state FROM render_attempt WHERE id = ?').get(attemptId) as { state: string };
    expect(afterFirst.state).toBe('failed_recoverable');

    // Second tick — must not re-claim, must not double-record an error.
    await tick({ maxConcurrent: 4 });
    const afterSecond = db().query('SELECT state FROM render_attempt WHERE id = ?').get(attemptId) as { state: string };
    expect(afterSecond.state).toBe('failed_recoverable');
  });
});
