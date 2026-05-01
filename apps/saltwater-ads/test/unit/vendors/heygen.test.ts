import { describe, test, expect, beforeAll, afterEach } from 'bun:test';
import { loadSecrets } from '@lib/services/secrets.ts';
import { createHookClip, setHeygenFetchForTest } from '@lib/vendors/heygen.ts';

// Lane C: HeyGen adapter contract. Pins the request shape (X-Api-Key,
// dimensions 1080×1920, photo_avatar character, voice text input) and
// the polling-until-completed loop with abort handling.

describe('HeyGen createHookClip', () => {
  beforeAll(() => {
    loadSecrets();
    process.env.HEYGEN_POLL_MS = '1';
  });

  afterEach(() => {
    setHeygenFetchForTest(null);
  });

  test('happy path: posts video_inputs with photo_avatar + voice text, polls until completed', async () => {
    let createBody: any;
    let pollCount = 0;
    setHeygenFetchForTest(async (url, init) => {
      if (url.includes('/v2/video/generate')) {
        createBody = JSON.parse(init!.body as string);
        return new Response(JSON.stringify({ data: { video_id: 'vid-42' } }), {
          status: 200, headers: { 'content-type': 'application/json' },
        });
      }
      if (url.includes('/v1/video_status.get')) {
        pollCount++;
        // First poll: still processing. Second: completed.
        if (pollCount === 1) {
          return new Response(JSON.stringify({ data: { status: 'processing' } }), {
            status: 200, headers: { 'content-type': 'application/json' },
          });
        }
        return new Response(JSON.stringify({ data: { status: 'completed', video_url: 'https://heygen.test/v.mp4', duration: 12 } }), {
          status: 200, headers: { 'content-type': 'application/json' },
        });
      }
      throw new Error(`unexpected: ${url}`);
    });

    const result = await createHookClip({
      hookText: 'I built this for guys like my dad.',
      abortSignal: new AbortController().signal,
    });

    expect(result.videoId).toBe('vid-42');
    expect(result.videoUrl).toBe('https://heygen.test/v.mp4');
    expect(result.durationSeconds).toBe(12);
    expect(result.costCredits).toBeGreaterThan(0);
    expect(pollCount).toBe(2);

    // Request shape
    expect(createBody.dimension).toEqual({ width: 1080, height: 1920 });
    expect(createBody.aspect_ratio).toBe('9:16');
    expect(createBody.video_inputs[0].character.type).toBe('photo_avatar');
    expect(createBody.video_inputs[0].voice.input_text).toBe('I built this for guys like my dad.');
  });

  test('failed status from HeyGen → throws with detail', async () => {
    setHeygenFetchForTest(async (url) => {
      if (url.includes('/v2/video/generate')) return new Response(JSON.stringify({ data: { video_id: 'fail' } }), { status: 200 });
      return new Response(JSON.stringify({ data: { status: 'failed', error: { detail: 'avatar id not found' } } }), { status: 200 });
    });

    await expect(createHookClip({
      hookText: 'h',
      abortSignal: new AbortController().signal,
    })).rejects.toThrow(/avatar id not found/);
  });

  test('non-2xx on create → throws with response body snippet', async () => {
    setHeygenFetchForTest(async () =>
      new Response('{"error":"forbidden"}', { status: 403, statusText: 'Forbidden' }),
    );
    await expect(createHookClip({
      hookText: 'h',
      abortSignal: new AbortController().signal,
    })).rejects.toThrow(/HeyGen video.generate failed: 403.*forbidden/);
  });

  test('aborted before create → throws aborted error', async () => {
    const ctrl = new AbortController();
    ctrl.abort('test-cancel');
    await expect(createHookClip({
      hookText: 'h',
      abortSignal: ctrl.signal,
    })).rejects.toThrow(/aborted at before-create/);
  });

  test('aborted mid-poll → throws aborted error from sleep', async () => {
    const ctrl = new AbortController();
    let pollCount = 0;
    setHeygenFetchForTest(async (url) => {
      if (url.includes('/v2/video/generate')) return new Response(JSON.stringify({ data: { video_id: 'abort-1' } }), { status: 200 });
      pollCount++;
      // Abort partway through polling
      if (pollCount === 1) {
        setTimeout(() => ctrl.abort('test-mid-poll'), 0);
      }
      return new Response(JSON.stringify({ data: { status: 'processing' } }), { status: 200 });
    });

    await expect(createHookClip({
      hookText: 'h',
      abortSignal: ctrl.signal,
    })).rejects.toThrow(/aborted/);
  });

  test('missing video_id in create response → throws', async () => {
    setHeygenFetchForTest(async () => new Response(JSON.stringify({ data: {} }), { status: 200 }));
    await expect(createHookClip({
      hookText: 'h',
      abortSignal: new AbortController().signal,
    })).rejects.toThrow(/no video_id/);
  });
});
