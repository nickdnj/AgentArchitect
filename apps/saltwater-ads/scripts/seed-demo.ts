// Seed the DB with three sample briefs so the Review Queue has content
// to click through on first load. Useful for fresh dev environments and
// for showing Joe the UI before real vendor keys are wired.
//
// Usage:
//   bun scripts/seed-demo.ts [--reset] [--count=3]
//
// --reset: wipe the DB first (rm + db:migrate)
// --count: how many briefs to seed (default 3, max 10)
//
// Side effects:
//   1. snapshotBucket() runs once
//   2. INSERTs N briefs + N hook_sets + 3N variants + 3N render_attempts
//   3. Calls runHookGenerator() for each (real Anthropic call)
//   4. Marks all variants ready_for_review so they show in the Review Queue
//
// Costs ~$0.05 per brief in Anthropic prompt cache.

import { db, resetDbConnection } from '@db/client.ts';
import { loadSecrets } from '@lib/services/secrets.ts';
import { snapshotBucket } from '@lib/services/brand-bucket-manager.ts';
import { runHookGenerator } from '@lib/services/hook-generator.ts';
import type { BriefShape } from '@lib/llm/types.ts';

loadSecrets();

const args = process.argv.slice(2);
const resetFlag = args.includes('--reset');
const countArg = args.find((a) => a.startsWith('--count='));
const count = Math.min(10, Math.max(1, Number(countArg?.split('=')[1] ?? 3)));

const SAMPLE_BRIEFS: { free_text: string; pattern: 'founder' | 'problem_solution' | 'limited_drop'; sku_id: string; audience_tag: string }[] = [
  {
    free_text: 'Spring drop teaser for the navy performance polo. Coastal comfort, weekends on the water, dad-and-son founder voice.',
    pattern: 'founder',
    sku_id: 'polo-navy',
    audience_tag: 'older-joe',
  },
  {
    free_text: 'Why we built dock shorts: tired of board shorts that look like swimwear at the marina, and golf shorts that scream country club.',
    pattern: 'problem_solution',
    sku_id: 'shorts-dock',
    audience_tag: 'coastal-dad',
  },
  {
    free_text: 'Limited drop alert: the Memorial Day classic tee in heather. Last batch before summer. 200 units, will sell out.',
    pattern: 'limited_drop',
    sku_id: 'tee-classic',
    audience_tag: 'weekend-warrior',
  },
  {
    free_text: 'Trucker hat for the boat. Saltwater-resistant. The hat we wore every Saturday last summer that finally made it into the catalog.',
    pattern: 'founder',
    sku_id: 'hat-trucker',
    audience_tag: 'fishing-dad',
  },
  {
    free_text: 'Performance polo white edition: built for the brutal humidity that turns every other polo into a sweat rag by 11am.',
    pattern: 'problem_solution',
    sku_id: 'polo-white',
    audience_tag: 'older-joe',
  },
];

if (resetFlag) {
  console.log('--reset: wiping DB...');
  const fs = await import('node:fs/promises');
  for (const f of ['data/saltwater.db', 'data/saltwater.db-shm', 'data/saltwater.db-wal']) {
    await fs.rm(f, { force: true }).catch(() => {});
  }
  // Re-run migrations
  const { migrate } = await import('@db/migrate.ts');
  await migrate({ quiet: false });
}

const briefs = SAMPLE_BRIEFS.slice(0, count);
console.log(`Seeding ${briefs.length} demo briefs...\n`);

for (let i = 0; i < briefs.length; i++) {
  const b = briefs[i];
  console.log(`[${i + 1}/${briefs.length}] ${b.pattern}: ${b.free_text.slice(0, 60)}...`);

  // 1. snapshot bucket
  const snap = await snapshotBucket();

  // 2. INSERT brief + hook_set + variants + attempts inside a transaction
  const conn = db();
  const { briefId, hookSetId, variantIds, attemptIds } = conn.transaction(() => {
    const briefId = Number(conn.run(
      `INSERT INTO brief (operator, free_text, sku_id, pattern, audience_tag) VALUES (?, ?, ?, ?, ?)`,
      ['demo-seed', b.free_text, b.sku_id, b.pattern, b.audience_tag],
    ).lastInsertRowid);
    const hookSetId = Number(conn.run(
      `INSERT INTO hook_set (brief_id, brand_bucket_version_id, model, prompt_hash, status)
       VALUES (?, ?, '', '', 'pending')`,
      [briefId, snap.versionId],
    ).lastInsertRowid);
    const variantIds: number[] = [];
    const attemptIds: number[] = [];
    for (const label of ['V1', 'V2', 'V3']) {
      const vid = Number(conn.run(
        `INSERT INTO variant (hook_set_id, hook_text, sub_variant_label, sku_id, pattern, status)
         VALUES (?, '', ?, ?, ?, 'queued')`,
        [hookSetId, label, b.sku_id, b.pattern],
      ).lastInsertRowid);
      variantIds.push(vid);
      const aid = Number(conn.run(
        `INSERT INTO render_attempt (variant_id, attempt_number, state) VALUES (?, 1, 'queued')`,
        [vid],
      ).lastInsertRowid);
      attemptIds.push(aid);
    }
    return { briefId, hookSetId, variantIds, attemptIds };
  }).immediate();

  // bun:sqlite quirk: reset the connection between the previous transaction
  // commit and the next query/transaction. Otherwise we hit SQLITE_IOERR_VNODE.
  resetDbConnection();

  // 3. Run hook generation
  const briefShape: BriefShape = {
    free_text: b.free_text,
    sku_id: b.sku_id,
    pattern: b.pattern,
    audience_tag: b.audience_tag,
    season: null,
  };
  const result = await runHookGenerator({
    brief: briefShape,
    brandBucketVersionId: snap.versionId,
  });

  // 4. Populate variants + flip to ready_for_review.
  // Reset connection between LLM call (which read variants via a different
  // path inside hook-generator) and the next write here.
  resetDbConnection();
  const conn2 = db();
  const variants = conn2.query(
    `SELECT id, sub_variant_label FROM variant WHERE hook_set_id = ? ORDER BY id ASC`,
  ).all(hookSetId) as Array<{ id: number; sub_variant_label: string }>;

  conn2.transaction(() => {
    for (const v of variants) {
      const idx = v.sub_variant_label === 'V1' ? 0 : v.sub_variant_label === 'V2' ? 1 : 2;
      const main = result.generation.hookSet.variants[0];
      const match = main.find((h) => h.label === v.sub_variant_label) ?? main[idx];
      conn2.run(
        `UPDATE variant SET hook_text = ?, status = 'ready_for_review' WHERE id = ?`,
        [match.hook_text, v.id],
      );
    }
    conn2.run(
      `UPDATE hook_set SET status = 'ready', model = ?, prompt_hash = ? WHERE id = ?`,
      [result.generation.model, result.generation.promptHash, hookSetId],
    );
    // Mark all attempts ready_for_review (skip the vendor + assembly steps for the demo)
    for (const aid of attemptIds) {
      conn2.run(
        `UPDATE render_attempt SET state = 'ready_for_review', finished_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [aid],
      );
    }
  })();

  for (const v of variants) {
    const row = conn2.query(`SELECT sub_variant_label, hook_text FROM variant WHERE id = ?`).get(v.id) as { sub_variant_label: string; hook_text: string };
    console.log(`    ${row.sub_variant_label}: ${row.hook_text}`);
  }
  console.log('');

  // Reset between briefs to keep the connection clean.
  resetDbConnection();
}

const totalVariants = (db().query(`SELECT COUNT(*) as n FROM variant WHERE status = 'ready_for_review'`).get() as { n: number }).n;
console.log(`✓ Done. ${totalVariants} variants in 'ready_for_review' state.`);
console.log('  Open the app + go to Review Queue to see them.');
