// Local-dev seed: populate one sample brief + variant for UI smoke tests.
// Run via: bun scripts/seed.ts

import { db } from '@db/client.ts';

function seed(): void {
  const conn = db();
  conn.transaction(() => {
    const ver = conn.run(
      `INSERT INTO brand_bucket_version (voice_sha256, customer_sha256, winning_patterns_sha256, products_sha256, hooks_winners_sha256, hooks_losers_sha256)
       VALUES ('seed','seed','seed','seed','seed','seed')`
    );
    const brief = conn.run(
      `INSERT INTO brief (operator, free_text, sku_id, pattern, audience_tag, season)
       VALUES ('nick', 'Seed brief — Memorial Day performance polo bundle', 'performance-polo-navy', 'limited_drop', 'coastal-business-owner', 'summer')`
    );
    const hookSet = conn.run(
      `INSERT INTO hook_set (brief_id, brand_bucket_version_id, model, prompt_hash, status)
       VALUES (?, ?, 'claude-sonnet-4-6', 'seed', 'ready')`,
      [Number(brief.lastInsertRowid), Number(ver.lastInsertRowid)]
    );
    for (const label of ['V1', 'V2', 'V3'] as const) {
      conn.run(
        `INSERT INTO variant (hook_set_id, hook_text, sub_variant_label, sku_id, pattern, status)
         VALUES (?, ?, ?, 'performance-polo-navy', 'limited_drop', 'ready_for_review')`,
        [Number(hookSet.lastInsertRowid), `Coastal Comfort™ — Memorial Day drop ${label}.`, label]
      );
    }
  })();
  console.log('seeded one brief + 3 variants');
}

if (import.meta.main) seed();
