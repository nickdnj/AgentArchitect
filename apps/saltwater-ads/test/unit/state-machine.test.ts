import { test, expect, describe, beforeEach, afterEach } from 'bun:test';
import { openInMemoryDb, type Database } from '@db/client.ts';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';

// Test the claim CAS in tick.ts against an in-memory DB.
// We exercise the SQL pattern directly so we don't pull in the worker's loop.
//
// The claim must be atomic compare-and-swap: SELECT + UPDATE ... WHERE id=? AND state=?
// Two simulated concurrent workers must NOT both claim the same render_attempt row.

const MIGRATIONS_DIR = resolve(import.meta.dir, '../../db/migrations');

let db: Database;

beforeEach(() => {
  db = openInMemoryDb();
  // Apply migrations in order
  db.exec(readFileSync(resolve(MIGRATIONS_DIR, '0001_init.sql'), 'utf8'));
  db.exec(readFileSync(resolve(MIGRATIONS_DIR, '0002_indexes.sql'), 'utf8'));

  // Seed: one brief, one hook_set, one variant, one queued render_attempt
  const ver = db.run(
    `INSERT INTO brand_bucket_version
       (voice_sha256, customer_sha256, winning_patterns_sha256, products_sha256, hooks_winners_sha256, hooks_losers_sha256)
     VALUES ('a','b','c','d','e','f')`
  );
  const brief = db.run(
    `INSERT INTO brief (operator, free_text) VALUES ('test', 'seed')`
  );
  const hookSet = db.run(
    `INSERT INTO hook_set (brief_id, brand_bucket_version_id, model, prompt_hash, status)
     VALUES (?, ?, 'test', 'h', 'ready')`,
    [Number(brief.lastInsertRowid), Number(ver.lastInsertRowid)]
  );
  const variant = db.run(
    `INSERT INTO variant (hook_set_id, hook_text, sub_variant_label, pattern, status)
     VALUES (?, 'Hook text', 'V1', 'founder', 'queued')`,
    [Number(hookSet.lastInsertRowid)]
  );
  db.run(
    `INSERT INTO render_attempt (variant_id, attempt_number, state)
     VALUES (?, 1, 'queued')`,
    [Number(variant.lastInsertRowid)]
  );
});

afterEach(() => {
  db.close();
});

function claimOnce(limit: number): { id: number; fromState: string; toState: string }[] {
  // Mirror tick.ts's claimJobs SQL pattern (without the import dance for test isolation).
  const NEXT: Record<string, string> = {
    queued: 'hooks_generating',
    hooks_ready: 'vendor_pending',
    partial: 'assembling',
  };
  return db.transaction(() => {
    const rows = db.query(
      `SELECT id, state FROM render_attempt
       WHERE state IN ('queued','hooks_ready','partial')
       ORDER BY id ASC LIMIT ?`
    ).all(limit) as { id: number; state: string }[];
    const claimed: { id: number; fromState: string; toState: string }[] = [];
    for (const r of rows) {
      const next = NEXT[r.state];
      if (!next) continue;
      const res = db.run(
        `UPDATE render_attempt
         SET state = ?, started_at = COALESCE(started_at, CURRENT_TIMESTAMP)
         WHERE id = ? AND state = ?`,
        [next, r.id, r.state]
      );
      if (res.changes === 1) {
        claimed.push({ id: r.id, fromState: r.state, toState: next });
      }
    }
    return claimed;
  }).immediate();
}

describe('state machine — claim CAS', () => {
  test('first claim transitions queued → hooks_generating', () => {
    const claimed = claimOnce(10);
    expect(claimed).toHaveLength(1);
    expect(claimed[0].fromState).toBe('queued');
    expect(claimed[0].toState).toBe('hooks_generating');
    const row = db.query('SELECT state FROM render_attempt WHERE id = ?').get(claimed[0].id) as { state: string };
    expect(row.state).toBe('hooks_generating');
  });

  test('second claim is empty — same row not re-claimed', () => {
    const first = claimOnce(10);
    expect(first).toHaveLength(1);
    const second = claimOnce(10);
    expect(second).toHaveLength(0);
  });

  test('hooks_ready → vendor_pending transition lands', () => {
    // Move our seed row into hooks_ready manually
    db.run(`UPDATE render_attempt SET state = 'hooks_ready' WHERE id = 1`);
    const claimed = claimOnce(10);
    expect(claimed).toHaveLength(1);
    expect(claimed[0].fromState).toBe('hooks_ready');
    expect(claimed[0].toState).toBe('vendor_pending');
  });

  test('non-claimable states (e.g. ready_for_review) ignored', () => {
    db.run(`UPDATE render_attempt SET state = 'ready_for_review' WHERE id = 1`);
    const claimed = claimOnce(10);
    expect(claimed).toHaveLength(0);
  });

  test('failed_recoverable not re-claimed automatically (operator must intervene)', () => {
    db.run(`UPDATE render_attempt SET state = 'failed_recoverable' WHERE id = 1`);
    const claimed = claimOnce(10);
    expect(claimed).toHaveLength(0);
  });
});
