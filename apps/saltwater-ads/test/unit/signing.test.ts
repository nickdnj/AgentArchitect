import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { loadSecrets } from '@lib/services/secrets.ts';
import { sign, verify } from '../../src/server/signing.ts';

// T-3 (eng-review-2): signing.ts is the entire media security model. A bad
// algorithm or expired-vs-not-yet-valid edge case would let unauthenticated
// users download approved variants. These tests pin:
//   1. Happy roundtrip (sign then verify the same params)
//   2. Tampered signature → reject
//   3. Tampered asset_id (after signing) → reject
//   4. Tampered exp (extending TTL after signing) → reject
//   5. Past-exp → reject (even with valid sig — clock check)
//   6. Length-mismatch attempt → reject (not crash)

describe('T-3 HMAC media URL signing', () => {
  beforeAll(() => {
    loadSecrets();
  });

  test('happy path: sign then verify same params → true', () => {
    const { url, exp } = sign({ assetId: 'asset-42', ttlSeconds: 3600 });
    const parsed = new URL(url, 'http://x');
    const sig = parsed.searchParams.get('sig')!;
    const iat = Number(parsed.searchParams.get('iat'));
    expect(verify({ assetId: 'asset-42', iat, exp, sig })).toBe(true);
  });

  test('tampered signature → reject', () => {
    const { exp } = sign({ assetId: 'asset-99', ttlSeconds: 3600 });
    const iat = Math.floor(Date.now() / 1000);
    const fakeSig = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    expect(verify({ assetId: 'asset-99', iat, exp, sig: fakeSig })).toBe(false);
  });

  test('tampered asset_id (e.g. attacker swaps asset id, keeps sig) → reject', () => {
    const { url, exp } = sign({ assetId: 'asset-original', ttlSeconds: 3600 });
    const parsed = new URL(url, 'http://x');
    const sig = parsed.searchParams.get('sig')!;
    const iat = Number(parsed.searchParams.get('iat'));
    expect(verify({ assetId: 'asset-attacker-swapped', iat, exp, sig })).toBe(false);
  });

  test('tampered exp (extend TTL) → reject', () => {
    const { url, exp } = sign({ assetId: 'asset-x', ttlSeconds: 60 });
    const parsed = new URL(url, 'http://x');
    const sig = parsed.searchParams.get('sig')!;
    const iat = Number(parsed.searchParams.get('iat'));
    // Attacker tries to extend 60s TTL to 1 year
    const extendedExp = exp + 365 * 24 * 3600;
    expect(verify({ assetId: 'asset-x', iat, exp: extendedExp, sig })).toBe(false);
  });

  test('past-exp → reject (even with valid sig)', () => {
    const { url } = sign({ assetId: 'asset-y', ttlSeconds: 3600 });
    const parsed = new URL(url, 'http://x');
    const sig = parsed.searchParams.get('sig')!;
    const iat = Number(parsed.searchParams.get('iat'));
    const pastExp = Math.floor(Date.now() / 1000) - 1;
    expect(verify({ assetId: 'asset-y', iat, exp: pastExp, sig })).toBe(false);
  });

  test('garbage sig of wrong byte length → reject (no crash)', () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const iat = Math.floor(Date.now() / 1000);
    expect(verify({ assetId: 'asset-z', iat, exp, sig: 'too-short' })).toBe(false);
    expect(verify({ assetId: 'asset-z', iat, exp, sig: 'A'.repeat(500) })).toBe(false);
    expect(verify({ assetId: 'asset-z', iat, exp, sig: '' })).toBe(false);
  });

  test('different asset_ids produce different signatures', () => {
    const a = sign({ assetId: 'asset-1', ttlSeconds: 3600 });
    const b = sign({ assetId: 'asset-2', ttlSeconds: 3600 });
    const sigA = new URL(a.url, 'http://x').searchParams.get('sig');
    const sigB = new URL(b.url, 'http://x').searchParams.get('sig');
    expect(sigA).not.toBe(sigB);
  });

  test('1h preview vs 24h download produce different exp but same sign-verify shape', () => {
    const preview = sign({ assetId: 'a-preview', ttlSeconds: 3600 });
    const download = sign({ assetId: 'a-preview', ttlSeconds: 24 * 3600 });
    expect(download.exp - preview.exp).toBeGreaterThanOrEqual(23 * 3600);

    const previewParsed = new URL(preview.url, 'http://x');
    const downloadParsed = new URL(download.url, 'http://x');
    expect(verify({
      assetId: 'a-preview',
      iat: Number(previewParsed.searchParams.get('iat')),
      exp: preview.exp,
      sig: previewParsed.searchParams.get('sig')!,
    })).toBe(true);
    expect(verify({
      assetId: 'a-preview',
      iat: Number(downloadParsed.searchParams.get('iat')),
      exp: download.exp,
      sig: downloadParsed.searchParams.get('sig')!,
    })).toBe(true);
  });
});
