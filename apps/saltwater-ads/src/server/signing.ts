import { createHmac, timingSafeEqual } from 'node:crypto';
import { secrets } from '@lib/services/secrets.ts';

// HMAC-SHA256 short-lived signed URLs.
// SAD §5/§6 — 1h for preview thumbnails, 24h for approved download.

export interface SignParams {
  assetId: string;
  ttlSeconds: number;
}

export function sign({ assetId, ttlSeconds }: SignParams): { url: string; exp: number } {
  const key = secrets.signingKey();
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const iat = Math.floor(Date.now() / 1000);
  const msg = `${assetId}.${iat}.${exp}`;
  const sig = createHmac('sha256', key).update(msg).digest('base64url');
  const url = `/media/blob?asset_id=${encodeURIComponent(assetId)}&iat=${iat}&exp=${exp}&sig=${sig}`;
  return { url, exp };
}

export function verify(params: { assetId: string; iat: number; exp: number; sig: string }): boolean {
  if (Math.floor(Date.now() / 1000) > params.exp) return false;
  const key = secrets.signingKey();
  const msg = `${params.assetId}.${params.iat}.${params.exp}`;
  const expected = createHmac('sha256', key).update(msg).digest();
  const provided = Buffer.from(params.sig, 'base64url');
  if (expected.length !== provided.length) return false;
  return timingSafeEqual(expected, provided);
}
