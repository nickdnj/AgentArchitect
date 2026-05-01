import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '@db/client.ts';
import { audit } from '../middleware/audit.ts';

const app = new Hono();

interface VariantRow {
  id: number;
  hook_set_id: number;
  hook_text: string;
  sub_variant_label: string;
  sku_id: string | null;
  pattern: string | null;
  status: string;
}

interface VariantDetailRow extends VariantRow {
  brief_id: number;
  brief_free_text: string;
  brand_bucket_version_id: number;
  attempt_id: number | null;
  attempt_state: string | null;
  attempt_error: string | null;
  master_path: string | null;
  thumb_path: string | null;
  ai_disclosure_layers: string | null;
}

// GET /api/variants?status=ready_for_review
//
// eng-review-3 dogfood: previously a 501 stub which surfaced as a red error
// banner on the Review Queue. Now returns the variants in the requested
// status. When `status` is omitted, returns ALL non-archived statuses so
// dev/debug surfaces also see queued + failed variants. Demo includes the
// real LLM-generated hook_text on every row.
app.get('/', (c) => {
  const status = c.req.query('status');
  let rows: VariantRow[];
  if (status) {
    rows = db().query(
      `SELECT id, hook_set_id, hook_text, sub_variant_label, sku_id, pattern, status
       FROM variant
       WHERE status = ?
       ORDER BY id ASC`,
    ).all(status) as VariantRow[];
  } else {
    rows = db().query(
      `SELECT id, hook_set_id, hook_text, sub_variant_label, sku_id, pattern, status
       FROM variant
       ORDER BY id ASC`,
    ).all() as VariantRow[];
  }
  return c.json({ variants: rows });
});

app.get('/:id', (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return c.json({ error: 'invalid_id' }, 400);

  const row = db().query(
    `SELECT v.id, v.hook_set_id, v.hook_text, v.sub_variant_label, v.sku_id, v.pattern, v.status,
            hs.brief_id, b.free_text AS brief_free_text, hs.brand_bucket_version_id,
            ra.id AS attempt_id, ra.state AS attempt_state, ra.error_message AS attempt_error,
            (SELECT path FROM asset WHERE render_attempt_id = ra.id AND type = 'mp4'
              AND ai_disclosure_layers IS NOT NULL ORDER BY id DESC LIMIT 1) AS master_path,
            (SELECT path FROM asset WHERE render_attempt_id = ra.id AND type = 'jpg' ORDER BY id DESC LIMIT 1) AS thumb_path,
            (SELECT ai_disclosure_layers FROM asset WHERE render_attempt_id = ra.id AND type = 'mp4'
              AND ai_disclosure_layers IS NOT NULL ORDER BY id DESC LIMIT 1) AS ai_disclosure_layers
     FROM variant v
     JOIN hook_set hs ON hs.id = v.hook_set_id
     JOIN brief b ON b.id = hs.brief_id
     LEFT JOIN render_attempt ra ON ra.variant_id = v.id
     WHERE v.id = ?
     ORDER BY ra.id DESC LIMIT 1`,
  ).get(id) as VariantDetailRow | null;

  if (!row) return c.json({ error: 'not_found', reason: 'variant_missing', id }, 404);

  let aiLayers: string[] = [];
  if (row.ai_disclosure_layers) {
    try { aiLayers = JSON.parse(row.ai_disclosure_layers) as string[]; } catch { /* ignore */ }
  }

  return c.json({
    variant: {
      id: row.id,
      hook_text: row.hook_text,
      sub_variant_label: row.sub_variant_label,
      sku_id: row.sku_id,
      pattern: row.pattern,
      status: row.status,
      brief: {
        id: row.brief_id,
        free_text: row.brief_free_text,
        brand_bucket_version_id: row.brand_bucket_version_id,
      },
      attempt: row.attempt_id != null
        ? {
            id: row.attempt_id,
            state: row.attempt_state,
            error: row.attempt_error,
            master_path: row.master_path,
            thumb_path: row.thumb_path,
            ai_disclosure_layers: aiLayers,
          }
        : null,
    },
  });
});

const ApproveBody = z.object({
  ai_disclosure_acknowledged: z.literal(true), // hard gate per PRD §7.5
});

app.post('/:id/approve', audit('approve', 'variant'), async (c) => {
  c.set('auditTargetId', c.req.param('id'));
  const body = await c.req.json().catch(() => null);
  const parsed = ApproveBody.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'ai_disclosure_required' }, 400);
  }
  // TODO: INSERT approval, UPDATE variant.status='approved', mint 24h signed download URL
  return c.json({ error: 'not_implemented', step: 'variants.approve' }, 501);
});

app.post('/:id/reject', audit('reject', 'variant'), async (c) => {
  c.set('auditTargetId', c.req.param('id'));
  // TODO: INSERT approval(decision='reject'), UPDATE variant.status='rejected'
  return c.json({ error: 'not_implemented', step: 'variants.reject' }, 501);
});

const RegenBody = z.object({
  feedback: z.string().min(1).max(1000),
});

app.post('/:id/regen', audit('regen', 'variant'), async (c) => {
  c.set('auditTargetId', c.req.param('id'));
  const body = await c.req.json().catch(() => null);
  const parsed = RegenBody.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'invalid_regen_request', issues: parsed.error.issues }, 400);
  }
  // TODO: enqueue new render_attempt with feedback included in next prompt
  return c.json({ error: 'not_implemented', step: 'variants.regen' }, 501);
});

export default app;
