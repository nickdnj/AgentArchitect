import { Hono } from 'hono';
import { z } from 'zod';
import { resolve, basename, extname } from 'node:path';
import { mkdir, readdir, stat, unlink, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { db } from '@db/client.ts';
import { audit } from '../middleware/audit.ts';
import { log } from '@lib/log.ts';

// Reusable assets library — B-roll clips, brand logos, reference images.
// Sprint 1 surfaces:
//   GET  /api/assets/b-roll              — list b_roll_clip rows
//   POST /api/assets/b-roll              — upload mp4 + tags + season
//   PATCH /api/assets/b-roll/:id          — update tags/season/notes
//   DELETE /api/assets/b-roll/:id         — remove DB row + file
//   GET  /api/assets/brand               — list /media/brand/ static files
//   POST /api/assets/brand               — upload logo/reference
//
// Storage layout:
//   media/b-roll/<filename>.mp4          — clip files (referenced by b_roll_clip.path)
//   media/brand/<filename>               — logos + reference images
//
// All routes require valid session (parent app.ts wires requireAuth on /api/*).

const app = new Hono();

const MEDIA_ROOT = process.env.MEDIA_ROOT ?? resolve(import.meta.dir, '../../../media');
const BROLL_ROOT = resolve(MEDIA_ROOT, 'b-roll');
const BRAND_ROOT = resolve(MEDIA_ROOT, 'brand');

const ALLOWED_VIDEO_EXTS = new Set(['.mp4', '.mov', '.webm']);
const ALLOWED_IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.svg', '.webp', '.avif']);
const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200 MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;  // 10 MB

interface BRollClipRow {
  id: number;
  path: string;
  duration_seconds: number;
  width: number;
  height: number;
  tags: string;
  season: string | null;
  added_at: string;
  notes: string | null;
}

// ---- B-roll ----

app.get('/b-roll', (c) => {
  const rows = db().query(
    `SELECT id, path, duration_seconds, width, height, tags, season, added_at, notes
     FROM b_roll_clip ORDER BY added_at DESC, id DESC`,
  ).all() as BRollClipRow[];
  return c.json({
    clips: rows.map((r) => ({
      ...r,
      tags: parseTags(r.tags),
      url: `/api/assets/b-roll/${r.id}/file`,
    })),
  });
});

app.get('/b-roll/:id/file', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return c.json({ error: 'invalid_id' }, 400);
  const row = db().query(`SELECT path FROM b_roll_clip WHERE id = ?`).get(id) as { path: string } | null;
  if (!row) return c.json({ error: 'not_found', reason: 'broll_missing', id }, 404);
  const filePath = resolve(BROLL_ROOT, row.path);
  const file = Bun.file(filePath);
  if (!(await file.exists())) return c.json({ error: 'not_found', reason: 'file_missing_on_disk', path: row.path }, 404);
  return new Response(file);
});

app.post('/b-roll', audit('asset_upload', 'b_roll'), async (c) => {
  const ct = c.req.header('content-type') ?? '';
  if (!ct.startsWith('multipart/form-data')) {
    return c.json({ error: 'expected_multipart' }, 400);
  }
  const form = await c.req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return c.json({ error: 'missing_file' }, 400);
  }
  const ext = extname(file.name).toLowerCase();
  if (!ALLOWED_VIDEO_EXTS.has(ext)) {
    return c.json({ error: 'unsupported_video_format', allowed: Array.from(ALLOWED_VIDEO_EXTS) }, 400);
  }
  if (file.size > MAX_VIDEO_SIZE) {
    return c.json({ error: 'file_too_large', max_bytes: MAX_VIDEO_SIZE }, 400);
  }
  const tagsRaw = (form.get('tags') as string) ?? '';
  const tags = tagsRaw.split(',').map((t) => t.trim()).filter(Boolean);
  const season = ((form.get('season') as string) ?? 'all').toLowerCase();
  const notes = ((form.get('notes') as string) ?? '').slice(0, 500) || null;

  await mkdir(BROLL_ROOT, { recursive: true });
  // Filename: timestamp + safe original name to avoid collisions.
  const safeName = basename(file.name).replace(/[^A-Za-z0-9._-]/g, '_');
  const filename = `${Date.now()}_${safeName}`;
  const path = filename; // relative to BROLL_ROOT
  const absPath = resolve(BROLL_ROOT, filename);
  const bytes = new Uint8Array(await file.arrayBuffer());
  await writeFile(absPath, bytes);

  // ffprobe-less metadata fallback. Joe can fix in PATCH later.
  const result = db().run(
    `INSERT INTO b_roll_clip (path, duration_seconds, width, height, tags, season, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [path, 8.0, 1920, 1080, JSON.stringify(tags), season, notes],
  );
  const id = Number(result.lastInsertRowid);
  c.set('auditTargetId', String(id));
  c.set('auditMeta', { filename: safeName, size_bytes: file.size, season, tags });

  return c.json({
    ok: true,
    clip: {
      id, path, tags, season, notes,
      duration_seconds: 8, width: 1920, height: 1080,
      url: `/api/assets/b-roll/${id}/file`,
    },
  }, 201);
});

const BRollPatch = z.object({
  tags: z.array(z.string()).optional(),
  season: z.string().optional(),
  notes: z.string().max(500).nullable().optional(),
  duration_seconds: z.number().positive().optional(),
});

app.patch('/b-roll/:id', audit('asset_update', 'b_roll'), async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return c.json({ error: 'invalid_id' }, 400);
  c.set('auditTargetId', String(id));
  const body = await c.req.json().catch(() => null);
  const parsed = BRollPatch.safeParse(body);
  if (!parsed.success) return c.json({ error: 'invalid_patch', issues: parsed.error.issues }, 400);
  const updates: string[] = [];
  const values: (string | number | null)[] = [];
  if (parsed.data.tags !== undefined) {
    updates.push('tags = ?');
    values.push(JSON.stringify(parsed.data.tags));
  }
  if (parsed.data.season !== undefined) {
    updates.push('season = ?');
    values.push(parsed.data.season);
  }
  if (parsed.data.notes !== undefined) {
    updates.push('notes = ?');
    values.push(parsed.data.notes);
  }
  if (parsed.data.duration_seconds !== undefined) {
    updates.push('duration_seconds = ?');
    values.push(parsed.data.duration_seconds);
  }
  if (updates.length === 0) return c.json({ ok: true, changed: 0 });
  values.push(id);
  const result = db().run(
    `UPDATE b_roll_clip SET ${updates.join(', ')} WHERE id = ?`,
    values,
  );
  return c.json({ ok: true, changed: Number(result.changes) });
});

app.delete('/b-roll/:id', audit('asset_delete', 'b_roll'), async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return c.json({ error: 'invalid_id' }, 400);
  c.set('auditTargetId', String(id));
  const row = db().query(`SELECT path FROM b_roll_clip WHERE id = ?`).get(id) as { path: string } | null;
  if (!row) return c.json({ error: 'not_found' }, 404);
  // Remove file before deleting row (idempotent on missing file).
  try {
    await unlink(resolve(BROLL_ROOT, row.path));
  } catch (err) {
    log.warn({ err: { message: (err as Error).message }, path: row.path }, 'broll_unlink_failed');
  }
  db().run(`DELETE FROM b_roll_clip WHERE id = ?`, [id]);
  return c.json({ ok: true });
});

// ---- Brand assets (logos, references) ----

interface BrandAsset {
  name: string;
  size_bytes: number;
  added_at: string;
  url: string;
  type: 'image' | 'video' | 'other';
}

app.get('/brand', async (c) => {
  await mkdir(BRAND_ROOT, { recursive: true });
  const names = await readdir(BRAND_ROOT);
  const assets: BrandAsset[] = [];
  for (const name of names) {
    if (name.startsWith('.')) continue;
    try {
      const s = await stat(resolve(BRAND_ROOT, name));
      if (!s.isFile()) continue;
      const ext = extname(name).toLowerCase();
      const type: BrandAsset['type'] = ALLOWED_IMAGE_EXTS.has(ext)
        ? 'image' : ALLOWED_VIDEO_EXTS.has(ext) ? 'video' : 'other';
      assets.push({
        name,
        size_bytes: s.size,
        added_at: s.mtime.toISOString(),
        url: `/api/assets/brand/${encodeURIComponent(name)}`,
        type,
      });
    } catch { /* skip */ }
  }
  assets.sort((a, b) => b.added_at.localeCompare(a.added_at));
  return c.json({ assets });
});

app.get('/brand/:name', async (c) => {
  const name = c.req.param('name');
  if (!name || name.includes('..') || name.includes('/')) {
    return c.json({ error: 'invalid_name' }, 400);
  }
  const filePath = resolve(BRAND_ROOT, name);
  const file = Bun.file(filePath);
  if (!(await file.exists())) return c.json({ error: 'not_found' }, 404);
  return new Response(file);
});

app.post('/brand', audit('asset_upload', 'brand'), async (c) => {
  const ct = c.req.header('content-type') ?? '';
  if (!ct.startsWith('multipart/form-data')) {
    return c.json({ error: 'expected_multipart' }, 400);
  }
  const form = await c.req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return c.json({ error: 'missing_file' }, 400);
  const ext = extname(file.name).toLowerCase();
  const isImage = ALLOWED_IMAGE_EXTS.has(ext);
  const isVideo = ALLOWED_VIDEO_EXTS.has(ext);
  if (!isImage && !isVideo) {
    return c.json({ error: 'unsupported_format' }, 400);
  }
  const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
  if (file.size > maxSize) {
    return c.json({ error: 'file_too_large', max_bytes: maxSize }, 400);
  }
  await mkdir(BRAND_ROOT, { recursive: true });
  const safeName = basename(file.name).replace(/[^A-Za-z0-9._-]/g, '_');
  const target = resolve(BRAND_ROOT, safeName);
  if (existsSync(target)) {
    return c.json({ error: 'name_collision', message: `${safeName} already exists. Rename and retry.` }, 409);
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  await writeFile(target, bytes);
  c.set('auditTargetId', safeName);
  c.set('auditMeta', { size_bytes: file.size });
  return c.json({
    ok: true,
    asset: {
      name: safeName,
      size_bytes: file.size,
      type: isImage ? 'image' : 'video',
      url: `/api/assets/brand/${encodeURIComponent(safeName)}`,
    },
  }, 201);
});

app.delete('/brand/:name', audit('asset_delete', 'brand'), async (c) => {
  const name = c.req.param('name');
  if (!name || name.includes('..') || name.includes('/')) {
    return c.json({ error: 'invalid_name' }, 400);
  }
  c.set('auditTargetId', name);
  const filePath = resolve(BRAND_ROOT, name);
  try {
    await unlink(filePath);
    return c.json({ ok: true });
  } catch (err) {
    log.warn({ err: { message: (err as Error).message }, name }, 'brand_unlink_failed');
    return c.json({ error: 'delete_failed', message: (err as Error).message }, 500);
  }
});

// ---- Brand bucket files (markdown + jsonl) ----
//
// Sprint 1: read-only listing of the 6 brand bucket files. PATCH/POST will
// come in Sprint 2 once Joe wants direct in-app editing. For now the bucket
// is edited on the filesystem and snapshotBucket() picks up changes on the
// next brief.

const BUCKET_FILES = [
  'voice.md',
  'customer.md',
  'winning-patterns.md',
  'products.json',
  'hooks-winners.jsonl',
  'hooks-losers.jsonl',
] as const;

function bucketDir(): string {
  // src/server/routes/assets.ts → repo root needs 5 ../ to reach
  // /Users/nickd/Workspaces/AgentArchitect/, then context-buckets/...
  return process.env.SALTWATER_BUCKET_DIR
    ?? resolve(import.meta.dir, '../../../../../context-buckets/saltwater-brand/files');
}

app.get('/bucket', async (c) => {
  const dir = bucketDir();
  const files = await Promise.all(BUCKET_FILES.map(async (name) => {
    const p = resolve(dir, name);
    const f = Bun.file(p);
    if (!(await f.exists())) return { name, exists: false, size_bytes: 0, content: '' };
    const text = await f.text();
    return { name, exists: true, size_bytes: text.length, content: text };
  }));
  return c.json({ files });
});

function parseTags(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed.filter((x): x is string => typeof x === 'string');
  } catch { /* fall through */ }
  return [];
}

export default app;
