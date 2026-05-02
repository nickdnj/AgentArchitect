import { Hono } from 'hono';
import { extname } from 'node:path';
import { db } from '@db/client.ts';
import { sign, verify } from '../signing.ts';

// SAD §5/§6 — media access via HMAC-signed short-lived URLs.
//   GET /media/sign?asset_id=&ttl=  → { url, exp }
//   GET /media/blob?asset_id=&iat=&exp=&sig= → file stream

const app = new Hono();

const CONTENT_TYPES: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.srt': 'application/x-subrip',
};

app.get('/sign', (c) => {
  const assetId = c.req.query('asset_id');
  if (!assetId) return c.json({ error: 'missing_asset_id' }, 400);
  const ttl = Number(c.req.query('ttl') ?? 3600); // 1h preview default
  const row = db().query(`SELECT id FROM asset WHERE id = ?`).get(Number(assetId)) as { id: number } | null;
  if (!row) return c.json({ error: 'not_found' }, 404);
  const { url, exp } = sign({ assetId: String(row.id), ttlSeconds: ttl });
  return c.json({ url, exp });
});

app.get('/blob', async (c) => {
  const assetId = c.req.query('asset_id');
  const iat = Number(c.req.query('iat'));
  const exp = Number(c.req.query('exp'));
  const sig = c.req.query('sig');
  if (!assetId || !sig || !Number.isFinite(iat) || !Number.isFinite(exp)) {
    return c.json({ error: 'invalid_params' }, 400);
  }
  if (!verify({ assetId, iat, exp, sig })) {
    return c.json({ error: 'bad_signature_or_expired' }, 403);
  }
  const row = db().query(`SELECT id, path, type FROM asset WHERE id = ?`).get(Number(assetId)) as
    | { id: number; path: string; type: string }
    | null;
  if (!row) return c.json({ error: 'not_found' }, 404);
  const file = Bun.file(row.path);
  if (!(await file.exists())) return c.json({ error: 'file_missing_on_disk', path: row.path }, 404);
  const ct = CONTENT_TYPES[extname(row.path).toLowerCase()] ?? 'application/octet-stream';
  return new Response(file, { headers: { 'content-type': ct } });
});

export default app;
