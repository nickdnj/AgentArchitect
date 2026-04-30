import { Hono } from 'hono';
import { z } from 'zod';
import { audit } from '../middleware/audit.ts';
// SAD §3 — happy path: POST /briefs creates brief + hook_set + 3 variants + 3 render_attempts
//   in one BEGIN IMMEDIATE transaction, returns 201 with variant IDs.

const app = new Hono();

const BriefInput = z.object({
  free_text: z.string().min(1).max(400),
  sku_id: z.string().nullable().optional(),
  pattern: z.enum(['founder', 'problem_solution', 'limited_drop']).nullable().optional(),
  audience_tag: z.string().nullable().optional(),
  season: z.string().nullable().optional(),
});

app.post('/', audit('generate', 'brief'), async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = BriefInput.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'invalid_brief', issues: parsed.error.issues }, 400);
  }
  // TODO: implement brand-bucket snapshot + INSERT brief/hook_set/variant/render_attempt rows.
  //
  // H-1 contract (internal eng review v0.4): this route is the ONLY place
  // that calls snapshotBucket(). It runs synchronously inside the brief's
  // BEGIN IMMEDIATE transaction, BEFORE any worker can pick up the job.
  // Pseudo:
  //
  //   const snap = await snapshotBucket();           // materializes cache + brand_bucket_version row
  //   conn.transaction(() => {
  //     INSERT brief ... RETURNING id;
  //     INSERT hook_set (brief_id, brand_bucket_version_id=snap.versionId) RETURNING id;
  //     INSERT variant × 3 (hook_set_id);
  //     INSERT render_attempt × 3 (variant_id, state='queued');
  //   }).immediate();
  //
  // The worker picks up render_attempt rows by state. When it advances to
  // hooks_generating, it calls runHookGenerator({brief, brandBucketVersionId})
  // which uses loadBucketSnapshot() — the bucket is frozen to the cache
  // entry that was hashed at this transaction's commit time.
  return c.json({ error: 'not_implemented', step: 'briefs.create' }, 501);
});

app.get('/:id', (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return c.json({ error: 'invalid_id' }, 400);
  // TODO: SELECT brief + associated hook_set + variants
  return c.json({ error: 'not_implemented', step: 'briefs.get' }, 501);
});

export default app;
