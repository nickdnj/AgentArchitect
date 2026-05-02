import { describe, test, expect, beforeAll, beforeEach, afterAll } from 'bun:test';
import { mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

import { migrate } from '@db/migrate.ts';
import { db } from '@db/client.ts';
import { loadSecrets } from '@lib/services/secrets.ts';
import {
  runRender,
  pickBRoll,
  setHeygenFetchForTest,
  setFashnFetchForTest,
} from '@lib/services/render-orchestrator.ts';

// Lane C: render-orchestrator. Pins parallel-vendor calls + degradation
// behavior + b-roll selection without touching the actual HeyGen / Fashn
// APIs. Uses the per-vendor fetch hatches for stubbing.

process.env.DB_PATH = ':memory:';
const TEST_RENDERS = resolve(import.meta.dir, '../../data/test-render-out');
const TEST_BROLL = resolve(import.meta.dir, '../../data/test-broll-out');

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function binaryResponse(): Response {
  return new Response(new Uint8Array([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70]), {
    status: 200,
    headers: { 'content-type': 'video/mp4' },
  });
}

function heygenHappyFetch(videoId = 'hg-clip-1'): (url: string) => Promise<Response> {
  return async (url) => {
    if (url.includes('/v2/video/generate')) {
      return jsonResponse({ data: { video_id: videoId } });
    }
    if (url.includes('/v1/video_status.get')) {
      return jsonResponse({ data: { status: 'completed', video_url: `https://heygen.test/${videoId}.mp4`, duration: 8 } });
    }
    if (url.includes(`heygen.test/${videoId}.mp4`)) {
      return binaryResponse();
    }
    throw new Error(`unexpected heygen url: ${url}`);
  };
}

function fashnHappyFetch(): (url: string, init?: RequestInit) => Promise<Response> {
  return async (url, init) => {
    if (url.endsWith('/v1/run')) {
      const body = JSON.parse((init?.body as string) ?? '{}');
      // Fashn uses one POST /v1/run endpoint with model_name dispatching
      // (V-VERIFY 2026-05-02: tryon-max + image-to-video).
      if (body.model_name === 'tryon-max') return jsonResponse({ id: 'tryon-1', error: null });
      if (body.model_name === 'image-to-video') return jsonResponse({ id: 'animate-1', error: null });
      throw new Error(`unexpected model_name: ${body.model_name}`);
    }
    if (url.includes('/v1/status/tryon-1')) {
      return jsonResponse({ status: 'completed', output: ['https://fashn.test/tryon.jpg'], error: null });
    }
    if (url.includes('/v1/status/animate-1')) {
      return jsonResponse({ status: 'completed', output: ['https://fashn.test/animate.mp4'], error: null });
    }
    if (url.includes('fashn.test/')) {
      return binaryResponse();
    }
    throw new Error(`unexpected fashn url: ${url}`);
  };
}

describe('runRender', () => {
  beforeAll(async () => {
    loadSecrets();
    process.env.RENDERS_ROOT = TEST_RENDERS;
    process.env.BROLL_ROOT = TEST_BROLL;
    process.env.HEYGEN_POLL_MS = '1';
    process.env.FASHN_POLL_MS = '1';
    await migrate({ quiet: true });
  });

  beforeEach(async () => {
    await rm(TEST_RENDERS, { recursive: true, force: true });
    await mkdir(TEST_RENDERS, { recursive: true });
    db().run('DELETE FROM b_roll_clip');
    setHeygenFetchForTest(null);
    setFashnFetchForTest(null);
  });

  afterAll(async () => {
    await rm(TEST_RENDERS, { recursive: true, force: true });
    await rm(TEST_BROLL, { recursive: true, force: true });
    setHeygenFetchForTest(null);
    setFashnFetchForTest(null);
  });

  test('happy path: HeyGen + Fashn both succeed → both clips downloaded, partial=false', async () => {
    setHeygenFetchForTest(heygenHappyFetch());
    setFashnFetchForTest(fashnHappyFetch());

    const result = await runRender({
      variantId: 1,
      hookText: 'spring drop',
      skuId: 'polo-navy',
      attemptNumber: 1,
      garmentImageUrl: 'https://saltwater.test/polo-navy.jpg',
      jobSignal: new AbortController().signal,
    });

    expect(result.heygenClipId).toBe('hg-clip-1');
    expect(result.fashnClipId).toBe('animate-1');
    expect(result.partial).toBe(false);
    expect(result.disclosureLayers).toContain('heygen');
    expect(result.disclosureLayers).toContain('fashn');
    expect(result.errors.length).toBe(0);
    expect(result.costCreditsTotal).toBeGreaterThan(0);

    // Files actually written to disk
    expect(await Bun.file(result.heygenLocalPath!).exists()).toBe(true);
    expect(await Bun.file(result.fashnLocalPath!).exists()).toBe(true);
  });

  test('HeyGen fails + Fashn succeeds → partial=true, only fashn delivered', async () => {
    setHeygenFetchForTest(async () => new Response('{"error":"nope"}', { status: 500, statusText: 'Internal' }));
    setFashnFetchForTest(fashnHappyFetch());

    const result = await runRender({
      variantId: 2,
      hookText: 'h',
      skuId: 'polo-navy',
      attemptNumber: 1,
      garmentImageUrl: 'https://saltwater.test/polo-navy.jpg',
      jobSignal: new AbortController().signal,
    });

    expect(result.heygenClipId).toBeNull();
    expect(result.fashnClipId).toBe('animate-1');
    expect(result.partial).toBe(true);
    expect(result.errors.some((e) => e.includes('heygen'))).toBe(true);
  });

  test('Fashn fails + HeyGen succeeds → partial=true (when SKU was supplied)', async () => {
    setHeygenFetchForTest(heygenHappyFetch());
    setFashnFetchForTest(async () => new Response('{"error":"nope"}', { status: 500, statusText: 'Internal' }));

    const result = await runRender({
      variantId: 3,
      hookText: 'h',
      skuId: 'polo-navy',
      attemptNumber: 1,
      garmentImageUrl: 'https://saltwater.test/polo-navy.jpg',
      jobSignal: new AbortController().signal,
    });

    expect(result.heygenClipId).not.toBeNull();
    expect(result.fashnClipId).toBeNull();
    expect(result.partial).toBe(true);
    expect(result.errors.some((e) => e.includes('fashn'))).toBe(true);
  });

  test('no SKU → Fashn skipped (not partial — designed shape)', async () => {
    setHeygenFetchForTest(heygenHappyFetch());
    // Fashn fetch should NEVER be called if there's no SKU
    let fashnCalls = 0;
    setFashnFetchForTest(async () => {
      fashnCalls++;
      throw new Error('fashn should not be called');
    });

    const result = await runRender({
      variantId: 4,
      hookText: 'no-sku hook',
      skuId: null,
      attemptNumber: 1,
      garmentImageUrl: null,
      jobSignal: new AbortController().signal,
    });

    expect(fashnCalls).toBe(0);
    expect(result.heygenClipId).not.toBeNull();
    expect(result.fashnClipId).toBeNull();
    expect(result.partial).toBe(false);
  });

  test('both vendors fail → throws (caller marks failed_recoverable)', async () => {
    setHeygenFetchForTest(async () => new Response('hg-fail', { status: 500, statusText: 'Internal' }));
    setFashnFetchForTest(async () => new Response('fa-fail', { status: 500, statusText: 'Internal' }));

    await expect(runRender({
      variantId: 5,
      hookText: 'h',
      skuId: 'polo-navy',
      attemptNumber: 1,
      garmentImageUrl: 'https://saltwater.test/polo-navy.jpg',
      jobSignal: new AbortController().signal,
    })).rejects.toThrow(/both HeyGen and Fashn failed/);
  });

  test('HeyGen returns failed status → throws with vendor message', async () => {
    setHeygenFetchForTest(async (url) => {
      if (url.includes('/v2/video/generate')) return jsonResponse({ data: { video_id: 'fail-1' } });
      return jsonResponse({ data: { status: 'failed', error: { detail: 'voice id not found' } } });
    });
    setFashnFetchForTest(fashnHappyFetch());

    const result = await runRender({
      variantId: 6,
      hookText: 'h',
      skuId: 'polo-navy',
      attemptNumber: 1,
      garmentImageUrl: 'https://saltwater.test/polo-navy.jpg',
      jobSignal: new AbortController().signal,
    });
    expect(result.heygenClipId).toBeNull();
    expect(result.errors.some((e) => e.includes('voice id not found'))).toBe(true);
  });
});

describe('pickBRoll', () => {
  beforeAll(async () => {
    loadSecrets();
    await migrate({ quiet: true });
  });

  beforeEach(() => {
    db().run('DELETE FROM b_roll_clip');
  });

  test('picks first matching tag in season', () => {
    db().run(`INSERT INTO b_roll_clip (path, duration_seconds, width, height, tags, season) VALUES ('a.mp4', 5, 1080, 1920, '["beach","summer"]', 'summer')`);
    db().run(`INSERT INTO b_roll_clip (path, duration_seconds, width, height, tags, season) VALUES ('b.mp4', 5, 1080, 1920, '["winter","ski"]', 'winter')`);
    const pick = pickBRoll('summer', ['beach']);
    expect(pick).not.toBeNull();
    expect(pick!.path).toBe('a.mp4');
  });

  test('falls back to season=all when seasonal match missing', () => {
    db().run(`INSERT INTO b_roll_clip (path, duration_seconds, width, height, tags, season) VALUES ('all.mp4', 5, 1080, 1920, '["evergreen"]', 'all')`);
    const pick = pickBRoll('summer', ['evergreen']);
    expect(pick).not.toBeNull();
    expect(pick!.path).toBe('all.mp4');
  });

  test('returns null when no clips match', () => {
    db().run(`INSERT INTO b_roll_clip (path, duration_seconds, width, height, tags, season) VALUES ('a.mp4', 5, 1080, 1920, '["winter"]', 'winter')`);
    const pick = pickBRoll('summer', ['beach']);
    expect(pick).toBeNull();
  });

  test('empty tag list with available season clips → first in season', () => {
    db().run(`INSERT INTO b_roll_clip (path, duration_seconds, width, height, tags, season) VALUES ('a.mp4', 5, 1080, 1920, '["x"]', 'summer')`);
    const pick = pickBRoll('summer', []);
    expect(pick).not.toBeNull();
    expect(pick!.path).toBe('a.mp4');
  });
});
