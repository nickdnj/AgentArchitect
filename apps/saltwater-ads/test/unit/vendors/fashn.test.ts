import { describe, test, expect, beforeAll, afterEach } from 'bun:test';
import { loadSecrets } from '@lib/services/secrets.ts';
import { createShowcaseClip, setFashnFetchForTest } from '@lib/vendors/fashn.ts';

// Lane C: Fashn adapter contract. Two-phase flow (try-on → animate),
// each with its own status-poll loop. Auth via Bearer token.

describe('Fashn createShowcaseClip', () => {
  beforeAll(() => {
    loadSecrets();
    process.env.FASHN_POLL_MS = '1';
  });

  afterEach(() => {
    setFashnFetchForTest(null);
  });

  test('happy path: try-on → poll → animate → poll → return video url', async () => {
    const calls: string[] = [];
    setFashnFetchForTest(async (url, init) => {
      calls.push(`${init?.method ?? 'GET'} ${url.split('/').slice(-2).join('/')}`);
      if (url.endsWith('/v1/run')) {
        const body = JSON.parse(init!.body as string);
        expect(body.model_image).toBeDefined();
        expect(body.garment_image).toBe('https://saltwater.test/polo-navy.jpg');
        expect(body.category).toBe('tops');
        return new Response(JSON.stringify({ id: 'tryon-99' }), { status: 200 });
      }
      if (url.endsWith('/v1/animate')) {
        const body = JSON.parse(init!.body as string);
        expect(body.image_url).toBe('https://fashn.test/tryon.jpg');
        expect(body.duration_seconds).toBe(8);
        return new Response(JSON.stringify({ id: 'animate-99' }), { status: 200 });
      }
      if (url.includes('/v1/status/tryon-99')) {
        return new Response(JSON.stringify({ status: 'completed', output: ['https://fashn.test/tryon.jpg'] }), { status: 200 });
      }
      if (url.includes('/v1/status/animate-99')) {
        return new Response(JSON.stringify({ status: 'completed', output: ['https://fashn.test/animate.mp4'] }), { status: 200 });
      }
      throw new Error(`unexpected: ${url}`);
    });

    const result = await createShowcaseClip({
      skuId: 'polo-navy',
      garmentImageUrl: 'https://saltwater.test/polo-navy.jpg',
      abortSignal: new AbortController().signal,
    });

    expect(result.tryonId).toBe('tryon-99');
    expect(result.animateId).toBe('animate-99');
    expect(result.videoUrl).toBe('https://fashn.test/animate.mp4');
    expect(result.costCredits).toBeGreaterThan(0);
  });

  test('try-on failed → throws (animate never called)', async () => {
    let animateCalled = false;
    setFashnFetchForTest(async (url) => {
      if (url.endsWith('/v1/run')) return new Response(JSON.stringify({ id: 'try-fail' }), { status: 200 });
      if (url.endsWith('/v1/animate')) {
        animateCalled = true;
        return new Response(JSON.stringify({ id: 'should-not-happen' }), { status: 200 });
      }
      if (url.includes('/v1/status/try-fail')) {
        return new Response(JSON.stringify({ status: 'failed', error: { message: 'garment image broken' } }), { status: 200 });
      }
      throw new Error(`unexpected: ${url}`);
    });

    await expect(createShowcaseClip({
      skuId: 'sku',
      garmentImageUrl: 'https://x',
      abortSignal: new AbortController().signal,
    })).rejects.toThrow(/tryon failed.*garment image broken/);
    expect(animateCalled).toBe(false);
  });

  test('animate failed → throws (try-on succeeded but downstream busted)', async () => {
    setFashnFetchForTest(async (url) => {
      if (url.endsWith('/v1/run')) return new Response(JSON.stringify({ id: 'tr' }), { status: 200 });
      if (url.endsWith('/v1/animate')) return new Response(JSON.stringify({ id: 'an' }), { status: 200 });
      if (url.includes('/v1/status/tr')) return new Response(JSON.stringify({ status: 'completed', output: ['https://x/img.jpg'] }), { status: 200 });
      if (url.includes('/v1/status/an')) return new Response(JSON.stringify({ status: 'failed', error: 'downstream timeout' }), { status: 200 });
      throw new Error(`unexpected: ${url}`);
    });

    await expect(createShowcaseClip({
      skuId: 'sku',
      garmentImageUrl: 'https://x',
      abortSignal: new AbortController().signal,
    })).rejects.toThrow(/animate failed.*downstream timeout/);
  });

  test('non-2xx on /v1/run → throws with body snippet', async () => {
    setFashnFetchForTest(async () => new Response('{"error":"unauthorized"}', { status: 401, statusText: 'Unauthorized' }));
    await expect(createShowcaseClip({
      skuId: 'sku',
      garmentImageUrl: 'https://x',
      abortSignal: new AbortController().signal,
    })).rejects.toThrow(/Fashn tryon-run failed: 401.*unauthorized/);
  });

  test('aborted signal before tryon → throws', async () => {
    const ctrl = new AbortController();
    ctrl.abort('cancel');
    await expect(createShowcaseClip({
      skuId: 'sku',
      garmentImageUrl: 'https://x',
      abortSignal: ctrl.signal,
    })).rejects.toThrow(/aborted at before-tryon/);
  });

  test('missing id in run response → throws', async () => {
    setFashnFetchForTest(async () => new Response(JSON.stringify({}), { status: 200 }));
    await expect(createShowcaseClip({
      skuId: 'sku',
      garmentImageUrl: 'https://x',
      abortSignal: new AbortController().signal,
    })).rejects.toThrow(/no id/);
  });
});
