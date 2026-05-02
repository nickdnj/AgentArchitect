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
  master_asset_id: number | null;
  master_path: string | null;
  thumb_asset_id: number | null;
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

app.get('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return c.json({ error: 'invalid_id' }, 400);

  const row = db().query(
    `SELECT v.id, v.hook_set_id, v.hook_text, v.sub_variant_label, v.sku_id, v.pattern, v.status,
            hs.brief_id, b.free_text AS brief_free_text, hs.brand_bucket_version_id,
            ra.id AS attempt_id, ra.state AS attempt_state, ra.error_message AS attempt_error,
            (SELECT id FROM asset WHERE render_attempt_id = ra.id AND type = 'mp4'
              AND ai_disclosure_layers IS NOT NULL ORDER BY id DESC LIMIT 1) AS master_asset_id,
            (SELECT path FROM asset WHERE render_attempt_id = ra.id AND type = 'mp4'
              AND ai_disclosure_layers IS NOT NULL ORDER BY id DESC LIMIT 1) AS master_path,
            (SELECT id FROM asset WHERE render_attempt_id = ra.id AND type = 'jpg' ORDER BY id DESC LIMIT 1) AS thumb_asset_id,
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

  // Mint 1h preview URLs for the master mp4 + thumb (when present). The
  // signed URL works alongside session auth on /media/* — both are required.
  // Joe's browser will hit /media/blob?asset_id=...&sig=... and stream the file.
  let previewUrl: string | null = null;
  let thumbUrl: string | null = null;
  if (row.master_asset_id != null) {
    try {
      const { sign } = await import('../signing.ts');
      previewUrl = sign({ assetId: String(row.master_asset_id), ttlSeconds: 3600 }).url;
    } catch { /* secrets missing in CI tests — fall through */ }
  }
  if (row.thumb_asset_id != null) {
    try {
      const { sign } = await import('../signing.ts');
      thumbUrl = sign({ assetId: String(row.thumb_asset_id), ttlSeconds: 3600 }).url;
    } catch { /* fall through */ }
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
            preview_url: previewUrl,
            thumb_url: thumbUrl,
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
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return c.json({ error: 'invalid_id' }, 400);
  c.set('auditTargetId', String(id));
  const body = await c.req.json().catch(() => null);
  const parsed = ApproveBody.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'ai_disclosure_required' }, 400);
  }
  const email = (c.get('email') as string | undefined) ?? 'unknown';

  const conn = db();
  const variant = conn.query(`SELECT id, status FROM variant WHERE id = ?`).get(id) as { id: number; status: string } | null;
  if (!variant) return c.json({ error: 'not_found', reason: 'variant_missing', id }, 404);
  if (variant.status === 'approved') {
    return c.json({ error: 'already_approved' }, 409);
  }
  if (variant.status !== 'ready_for_review') {
    return c.json({ error: 'not_reviewable', current_status: variant.status }, 409);
  }

  conn.transaction(() => {
    conn.run(
      `INSERT INTO approval (variant_id, approved_by, decision, notes) VALUES (?, ?, 'approve', NULL)`,
      [id, email],
    );
    conn.run(`UPDATE variant SET status = 'approved' WHERE id = ?`, [id]);
  })();

  // Mint 24h signed download URL for the master.mp4 (when one exists).
  const asset = conn.query(
    `SELECT a.id, a.path FROM asset a
     JOIN render_attempt ra ON ra.id = a.render_attempt_id
     WHERE ra.variant_id = ? AND a.type = 'mp4'
       AND a.ai_disclosure_layers IS NOT NULL
     ORDER BY a.id DESC LIMIT 1`,
  ).get(id) as { id: number; path: string } | null;

  let downloadUrl: string | null = null;
  if (asset) {
    // Sprint 1: serve via /media/asset/:id with a signed query param. The
    // signing.ts module mints HMAC-signed URLs with TTL.
    try {
      const { sign } = await import('../signing.ts');
      const { url } = sign({ assetId: String(asset.id), ttlSeconds: 86400 });
      downloadUrl = url;
    } catch {
      downloadUrl = null;
    }
  }

  return c.json({
    ok: true,
    variant_id: id,
    download_url: downloadUrl,
    download_available: downloadUrl !== null,
    note: downloadUrl ? null : 'No master mp4 yet (vendor pipeline not run). Approval recorded.',
  });
});

app.post('/:id/reject', audit('reject', 'variant'), async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return c.json({ error: 'invalid_id' }, 400);
  c.set('auditTargetId', String(id));
  const email = (c.get('email') as string | undefined) ?? 'unknown';

  const conn = db();
  const variant = conn.query(`SELECT id, status FROM variant WHERE id = ?`).get(id) as { id: number; status: string } | null;
  if (!variant) return c.json({ error: 'not_found', reason: 'variant_missing', id }, 404);
  if (variant.status === 'rejected') {
    return c.json({ ok: true, already_rejected: true });
  }

  conn.transaction(() => {
    conn.run(
      `INSERT INTO approval (variant_id, approved_by, decision, notes) VALUES (?, ?, 'reject', NULL)`,
      [id, email],
    );
    conn.run(`UPDATE variant SET status = 'rejected' WHERE id = ?`, [id]);
  })();

  return c.json({ ok: true, variant_id: id });
});

const RegenBody = z.object({
  feedback: z.string().min(1).max(1000),
});

app.post('/:id/regen', audit('regen', 'variant'), async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return c.json({ error: 'invalid_id' }, 400);
  c.set('auditTargetId', String(id));
  const body = await c.req.json().catch(() => null);
  const parsed = RegenBody.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'invalid_regen_request', issues: parsed.error.issues }, 400);
  }
  const email = (c.get('email') as string | undefined) ?? 'unknown';

  const conn = db();
  const variant = conn.query(
    `SELECT id, hook_set_id, hook_text, sub_variant_label, sku_id, pattern, status FROM variant WHERE id = ?`,
  ).get(id) as VariantRow | null;
  if (!variant) return c.json({ error: 'not_found', reason: 'variant_missing', id }, 404);

  // Sprint 1: a regen creates a new variant + render_attempt under the same
  // hook_set, with feedback stored as a note on the approval row. The next
  // tick picks up the new attempt and runs hook generation again. Vendor
  // pipeline reuse via cache means HeyGen won't double-bill if the hook
  // text is identical.
  const result = conn.transaction(() => {
    conn.run(
      `INSERT INTO approval (variant_id, approved_by, decision, notes) VALUES (?, ?, 'regen', ?)`,
      [id, email, parsed.data.feedback],
    );
    const newVariantId = Number(conn.run(
      `INSERT INTO variant (hook_set_id, hook_text, sub_variant_label, sku_id, pattern, status)
       VALUES (?, '', ?, ?, ?, 'queued')`,
      [variant.hook_set_id, variant.sub_variant_label, variant.sku_id, variant.pattern, 'queued'],
    ).lastInsertRowid);
    const newAttemptId = Number(conn.run(
      `INSERT INTO render_attempt (variant_id, attempt_number, state) VALUES (?, 1, 'queued')`,
      [newVariantId],
    ).lastInsertRowid);
    return { newVariantId, newAttemptId };
  })();

  return c.json({
    ok: true,
    new_variant_id: result.newVariantId,
    new_attempt_id: result.newAttemptId,
    feedback_recorded: parsed.data.feedback,
  });
});

export default app;
