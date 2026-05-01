import { Hono } from 'hono';
import { z } from 'zod';
import { audit } from '../middleware/audit.ts';
import { db } from '@db/client.ts';
import { log } from '@lib/log.ts';
import { snapshotBucket } from '@lib/services/brand-bucket-manager.ts';
import { tick } from '../../worker/tick.ts';
// SAD §3 — happy path: POST /briefs creates brief + hook_set + 3 variants + 3 render_attempts
//   in one BEGIN IMMEDIATE transaction, returns 201 with variant IDs.
//
// H-1 contract: snapshotBucket() runs HERE (and only here). It materializes
// the content-addressed cache + brand_bucket_version row BEFORE the
// transaction so the row's hashes refer to cache files that already exist.
// The worker hydrates from cache via loadBucketSnapshot(versionId).

const app = new Hono();

const PATTERNS = ['founder', 'problem_solution', 'limited_drop'] as const;
const DEFAULT_PATTERN = 'founder';

const BriefInput = z.object({
  free_text: z.string().min(1).max(400),
  sku_id: z.string().nullable().optional(),
  pattern: z.enum(PATTERNS).nullable().optional(),
  audience_tag: z.string().nullable().optional(),
  season: z.string().nullable().optional(),
});

interface BriefRow {
  id: number;
  created_at: string;
  operator: string;
  free_text: string;
  sku_id: string | null;
  pattern: string | null;
  audience_tag: string | null;
  season: string | null;
}

interface HookSetRow {
  id: number;
  brief_id: number;
  brand_bucket_version_id: number;
  status: string;
  model: string;
  prompt_hash: string;
  created_at: string;
}

interface VariantRow {
  id: number;
  hook_set_id: number;
  hook_text: string;
  sub_variant_label: string;
  status: string;
  sku_id: string | null;
  pattern: string | null;
}

app.post('/', audit('generate', 'brief'), async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = BriefInput.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'invalid_brief', issues: parsed.error.issues }, 400);
  }
  const input = parsed.data;
  const operator = (c.get('email') as string | undefined) ?? 'unknown';
  const pattern = input.pattern ?? DEFAULT_PATTERN;

  // Snapshot OUTSIDE the inner transaction. snapshotBucket runs its own
  // transaction on brand_bucket_version. Combining them would nest
  // transactions, which bun:sqlite does not support cleanly.
  const snap = await snapshotBucket();

  const conn = db();
  const result = conn.transaction(() => {
    const briefId = Number(
      conn.run(
        `INSERT INTO brief (operator, free_text, sku_id, pattern, audience_tag, season)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          operator,
          input.free_text,
          input.sku_id ?? null,
          pattern,
          input.audience_tag ?? null,
          input.season ?? null,
        ],
      ).lastInsertRowid,
    );

    // hook_set is created with status='pending'. The first render_attempt to
    // hit hooks_generating wins a CAS lock (UPDATE ... WHERE status='pending')
    // and runs the LLM call. The other two attempts wait until status='ready'
    // and then transition themselves. This avoids 3× LLM cost per brief.
    const hookSetId = Number(
      conn.run(
        `INSERT INTO hook_set (brief_id, brand_bucket_version_id, model, prompt_hash, status)
         VALUES (?, ?, ?, ?, ?)`,
        [briefId, snap.versionId, '', '', 'pending'],
      ).lastInsertRowid,
    );

    // Three variant placeholders — V1/V2/V3 of variant 1. The worker
    // populates them after the Hook Generator returns.
    //
    // Sprint 1 simplification: we create 3 placeholder variants for the FIRST
    // main angle. PRD §6.1.2 promises 3 main × 3 sub-variants = 9 hooks, but
    // Sprint 1 ships 3 reviewable variants per brief (one main angle, V1/V2/V3
    // sub-variants). The other 2 main angles ride along inside the hook_set
    // rows for analytics but aren't surfaced for review.
    const variantIds: number[] = [];
    for (const label of ['V1', 'V2', 'V3']) {
      const variantId = Number(
        conn.run(
          `INSERT INTO variant (hook_set_id, hook_text, sub_variant_label, sku_id, pattern, status)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [hookSetId, '', label, input.sku_id ?? null, pattern, 'queued'],
        ).lastInsertRowid,
      );
      variantIds.push(variantId);
    }

    // One render_attempt per variant, attempt_number=1, state=queued.
    const attemptIds: number[] = [];
    for (const variantId of variantIds) {
      const attemptId = Number(
        conn.run(
          `INSERT INTO render_attempt (variant_id, attempt_number, state)
           VALUES (?, 1, 'queued')`,
          [variantId],
        ).lastInsertRowid,
      );
      attemptIds.push(attemptId);
    }

    return { briefId, hookSetId, variantIds, attemptIds };
  }).immediate();

  c.set('auditTargetId', String(result.briefId));
  c.set('auditMeta', {
    pattern,
    sku_id: input.sku_id ?? null,
    brand_bucket_version_id: snap.versionId,
  });

  // Lazy-driven worker: schedule a tick AFTER the response goes out so the
  // brief response returns first, then the tick runs on the next event loop
  // iteration. Eliminates the concurrent-DB issue we hit when setInterval(tick)
  // fired between awaits in snapshotBucket(). For long-running progress
  // (vendor polling, A3 sweep) deploy a separate worker process per SAD §12.1.
  //
  // Disabled in test mode so the unit assertions can read DB state before
  // the lazy tick mutates it.
  if (process.env.NODE_ENV !== 'test') {
    setImmediate(() => {
      tick({ maxConcurrent: 4 }).catch((err) => {
        log.error({ err: { message: (err as Error).message } }, 'lazy_tick_failed');
      });
      // Schedule a few follow-up ticks at intervals to drain the cascade
      // (queued → hooks_ready → vendor_pending → partial → assembling).
      for (const delayMs of [2000, 4000, 8000, 16000]) {
        setTimeout(() => {
          tick({ maxConcurrent: 4 }).catch((err) => {
            log.error({ err: { message: (err as Error).message } }, 'lazy_tick_delayed_failed');
          });
        }, delayMs);
      }
    });
  }

  return c.json(
    {
      brief_id: result.briefId,
      hook_set_id: result.hookSetId,
      variant_ids: result.variantIds,
      attempt_ids: result.attemptIds,
      brand_bucket_version_id: snap.versionId,
      status: 'queued',
    },
    201,
  );
});

app.get('/:id', (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return c.json({ error: 'invalid_id' }, 400);

  const conn = db();
  const brief = conn.query(
    `SELECT id, created_at, operator, free_text, sku_id, pattern, audience_tag, season
     FROM brief WHERE id = ?`,
  ).get(id) as BriefRow | null;
  if (!brief) return c.json({ error: 'not_found', reason: 'brief_missing', id }, 404);

  const hookSet = conn.query(
    `SELECT id, brief_id, brand_bucket_version_id, status, model, prompt_hash, created_at
     FROM hook_set WHERE brief_id = ? ORDER BY id DESC LIMIT 1`,
  ).get(id) as HookSetRow | null;

  const variants = hookSet
    ? (conn.query(
        `SELECT id, hook_set_id, hook_text, sub_variant_label, status, sku_id, pattern
         FROM variant WHERE hook_set_id = ? ORDER BY id ASC`,
      ).all(hookSet.id) as VariantRow[])
    : [];

  return c.json({ brief, hook_set: hookSet, variants });
});

export default app;
