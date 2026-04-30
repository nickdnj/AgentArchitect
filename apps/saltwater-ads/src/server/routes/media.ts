import { Hono } from 'hono';
// SAD §5/§6 — media access via HMAC-signed short-lived URLs
// GET /media/sign?asset_id=...   → 302 to signed URL
// GET /media/blob?asset_id=...&sig=...&exp=...&iat=... → MP4 stream (verifies sig + exp)

const app = new Hono();

app.get('/sign', (c) => {
  const assetId = c.req.query('asset_id');
  if (!assetId) return c.json({ error: 'missing_asset_id' }, 400);
  // TODO: lookup asset, mint HMAC URL with 1h preview / 24h download TTL via signing.ts
  return c.json({ error: 'not_implemented', step: 'media.sign' }, 501);
});

app.get('/blob', (c) => {
  // TODO: verify HMAC + exp, stream from media/renders/...
  return c.json({ error: 'not_implemented', step: 'media.blob' }, 501);
});

export default app;
