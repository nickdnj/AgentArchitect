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

  test('happy path: tryon-max run → poll → image-to-video run → poll → return video url', async () => {
    let runCount = 0;
    setFashnFetchForTest(async (url, init) => {
      if (url.endsWith('/v1/run')) {
        const body = JSON.parse(init!.body as string);
        if (body.model_name === 'tryon-max') {
          // Step 1: try-on. Real Fashn API uses model_name + inputs envelope.
          expect(body.inputs.product_image).toBe('https://saltwater.test/polo-navy.jpg');
          expect(body.inputs.model_image).toBeDefined();
          runCount++;
          return new Response(JSON.stringify({ id: 'tryon-99', error: null }), { status: 200 });
        }
        if (body.model_name === 'image-to-video') {
          // Step 2: animate via image-to-video. duration must be 5 or 10.
          expect(body.inputs.image).toBe('https://fashn.test/tryon.jpg');
          expect(body.inputs.duration).toBe(5);
          runCount++;
          return new Response(JSON.stringify({ id: 'animate-99', error: null }), { status: 200 });
        }
        throw new Error(`unexpected model_name: ${body.model_name}`);
      }
      if (url.includes('/v1/status/tryon-99')) {
        return new Response(JSON.stringify({ status: 'completed', output: ['https://fashn.test/tryon.jpg'], error: null }), { status: 200 });
      }
      if (url.includes('/v1/status/animate-99')) {
        return new Response(JSON.stringify({ status: 'completed', output: ['https://fashn.test/animate.mp4'], error: null }), { status: 200 });
      }
      throw new Error(`unexpected: ${url}`);
    });

    const result = await createShowcaseClip({
      skuId: 'polo-navy',
      garmentImageUrl: 'https://saltwater.test/polo-navy.jpg',
      abortSignal: new AbortController().signal,
    });

    expect(runCount).toBe(2); // tryon-max + image-to-video, both via /v1/run
    expect(result.tryonId).toBe('tryon-99');
    expect(result.animateId).toBe('animate-99');
    expect(result.videoUrl).toBe('https://fashn.test/animate.mp4');
    expect(result.costCredits).toBeGreaterThan(0);
  });

  test('try-on failed → throws (animate never called)', async () => {
    let animateCalled = false;
    setFashnFetchForTest(async (url, init) => {
      if (url.endsWith('/v1/run')) {
        const body = JSON.parse(init!.body as string);
        if (body.model_name === 'tryon-max') {
          return new Response(JSON.stringify({ id: 'try-fail', error: null }), { status: 200 });
        }
        if (body.model_name === 'image-to-video') {
          animateCalled = true;
          return new Response(JSON.stringify({ id: 'should-not-happen' }), { status: 200 });
        }
      }
      if (url.includes('/v1/status/try-fail')) {
        return new Response(JSON.stringify({ status: 'failed', error: { name: 'InputError', message: 'garment image broken' } }), { status: 200 });
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
    setFashnFetchForTest(async (url, init) => {
      if (url.endsWith('/v1/run')) {
        const body = JSON.parse(init!.body as string);
        const id = body.model_name === 'tryon-max' ? 'tr' : 'an';
        return new Response(JSON.stringify({ id, error: null }), { status: 200 });
      }
      if (url.includes('/v1/status/tr')) return new Response(JSON.stringify({ status: 'completed', output: ['https://x/img.jpg'], error: null }), { status: 200 });
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
