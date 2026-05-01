import { describe, test, expect, beforeAll, beforeEach, afterAll } from 'bun:test';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

import { migrate } from '@db/migrate.ts';
import { db } from '@db/client.ts';
import { loadSecrets } from '@lib/services/secrets.ts';
import { snapshotBucket } from '@lib/services/brand-bucket-manager.ts';
import { setAnthropicClientForTest } from '@lib/llm/anthropic.ts';
import { setHeygenFetchForTest, setFashnFetchForTest } from '@lib/services/render-orchestrator.ts';
import { setFfmpegSpawnForTest } from '@lib/services/assembly.ts';
import { tick, sweepStaleAttempts, markFailed } from '../../src/worker/tick.ts';

// Lane C: end-to-end pipeline state machine. Joe submits a brief, the
// worker drives it from queued → ready_for_review across three tick
// iterations (one per state transition). Stubs every external dependency
// so the test runs deterministically in <100ms.

process.env.DB_PATH = ':memory:';
const TEST_BUCKET = resolve(import.meta.dir, '../../data/test-pipeline-bucket');
const TEST_CACHE = resolve(import.meta.dir, '../../data/test-pipeline-cache');
const TEST_RENDERS = resolve(import.meta.dir, '../../data/test-pipeline-renders');

const BUCKET_FILES: Record<string, string> = {
  'voice.md': '# Voice\nFounder.\n',
  'customer.md': '# Customer\nOlder Joe.\n',
  'winning-patterns.md': '# Patterns\nFounder.\n',
  'products.json': '{"skus":[{"id":"polo-navy","image":"https://saltwater.test/polo-navy.jpg"}]}\n',
  'hooks-winners.jsonl': '{"hook_text":"w1"}\n',
  'hooks-losers.jsonl': '{"hook_text":"l1"}\n',
};

async function writeBucket(): Promise<void> {
  await mkdir(TEST_BUCKET, { recursive: true });
  for (const [name, content] of Object.entries(BUCKET_FILES)) {
    await writeFile(resolve(TEST_BUCKET, name), content);
  }
}

async function seedBriefAndAttempts(opts: { skuId: string | null }): Promise<{ briefId: number; hookSetId: number; variantIds: number[]; attemptIds: number[] }> {
  const snap = await snapshotBucket();
  const conn = db();
  return conn.transaction(() => {
    const briefId = Number(conn.run(
      `INSERT INTO brief (operator, free_text, sku_id, pattern) VALUES ('joe', 'spring drop', ?, 'founder')`,
      [opts.skuId],
    ).lastInsertRowid);
    const hookSetId = Number(conn.run(
      `INSERT INTO hook_set (brief_id, brand_bucket_version_id, model, prompt_hash, status)
       VALUES (?, ?, '', '', 'pending')`,
      [briefId, snap.versionId],
    ).lastInsertRowid);
    const variantIds: number[] = [];
    const attemptIds: number[] = [];
    for (const label of ['V1', 'V2', 'V3']) {
      const vid = Number(conn.run(
        `INSERT INTO variant (hook_set_id, hook_text, sub_variant_label, sku_id, pattern, status)
         VALUES (?, '', ?, ?, 'founder', 'queued')`,
        [hookSetId, label, opts.skuId],
      ).lastInsertRowid);
      variantIds.push(vid);
      const aid = Number(conn.run(
        `INSERT INTO render_attempt (variant_id, attempt_number, state) VALUES (?, 1, 'queued')`,
        [vid],
      ).lastInsertRowid);
      attemptIds.push(aid);
    }
    return { briefId, hookSetId, variantIds, attemptIds };
  })();
}

function validHookSetJson(): string {
  return JSON.stringify({
    variants: [
      [
        { label: 'V1', pattern: 'founder', hook_text: 'V1 valid hook' },
        { label: 'V2', pattern: 'founder', hook_text: 'V2 valid hook' },
        { label: 'V3', pattern: 'founder', hook_text: 'V3 valid hook' },
      ],
      [
        { label: 'V1', pattern: 'founder', hook_text: 'main2 V1' },
        { label: 'V2', pattern: 'founder', hook_text: 'main2 V2' },
        { label: 'V3', pattern: 'founder', hook_text: 'main2 V3' },
      ],
      [
        { label: 'V1', pattern: 'founder', hook_text: 'main3 V1' },
        { label: 'V2', pattern: 'founder', hook_text: 'main3 V2' },
        { label: 'V3', pattern: 'founder', hook_text: 'main3 V3' },
      ],
    ],
  });
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

function binaryResponse(): Response {
  return new Response(new Uint8Array([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70]), { status: 200 });
}

function installVendorStubs(): void {
  setHeygenFetchForTest(async (url) => {
    if (url.includes('/v2/video/generate')) return jsonResponse({ data: { video_id: 'hg-1' } });
    if (url.includes('/v1/video_status.get')) return jsonResponse({ data: { status: 'completed', video_url: 'https://heygen.test/hg-1.mp4', duration: 8 } });
    if (url.includes('heygen.test/')) return binaryResponse();
    throw new Error(`unexpected heygen url: ${url}`);
  });

  setFashnFetchForTest(async (url) => {
    if (url.endsWith('/v1/run')) return jsonResponse({ id: 'tryon-1' });
    if (url.endsWith('/v1/animate')) return jsonResponse({ id: 'animate-1' });
    if (url.includes('/v1/status/tryon-1')) return jsonResponse({ status: 'completed', output: ['https://fashn.test/tryon.jpg'] });
    if (url.includes('/v1/status/animate-1')) return jsonResponse({ status: 'completed', output: ['https://fashn.test/animate.mp4'] });
    if (url.includes('fashn.test/')) return binaryResponse();
    throw new Error(`unexpected fashn url: ${url}`);
  });

  setFfmpegSpawnForTest(() => ({ exited: Promise.resolve(0), stderr: null }));
}

function installLLMStub(): { calls: number } {
  const state = { calls: 0 };
  setAnthropicClientForTest({
    messages: {
      create: async () => {
        state.calls++;
        return {
          content: [{ type: 'text', text: validHookSetJson() }],
          usage: { input_tokens: 100, output_tokens: 50 },
        };
      },
    },
  });
  return state;
}

describe('end-to-end pipeline', () => {
  beforeAll(async () => {
    loadSecrets();
    process.env.SALTWATER_BUCKET_DIR = TEST_BUCKET;
    process.env.SALTWATER_BUCKET_CACHE_DIR = TEST_CACHE;
    process.env.RENDERS_ROOT = TEST_RENDERS;
    process.env.HEYGEN_POLL_MS = '1';
    process.env.FASHN_POLL_MS = '1';
    process.env.HOOK_LOCK_POLL_MS = '5';
    process.env.HOOK_LOCK_MAX_WAIT_MS = '500';
    process.env.SALTWATER_PRODUCTS_JSON = resolve(TEST_BUCKET, 'products.json');
    await migrate({ quiet: true });
  });

  beforeEach(async () => {
    await rm(TEST_BUCKET, { recursive: true, force: true });
    await rm(TEST_CACHE, { recursive: true, force: true });
    await rm(TEST_RENDERS, { recursive: true, force: true });
    db().run('DELETE FROM asset');
    db().run('DELETE FROM render_attempt');
    db().run('DELETE FROM variant');
    db().run('DELETE FROM hook_set');
    db().run('DELETE FROM brief');
    db().run('DELETE FROM brand_bucket_version');
    await writeBucket();
    setAnthropicClientForTest(null);
    setHeygenFetchForTest(null);
    setFashnFetchForTest(null);
    setFfmpegSpawnForTest(null);
  });

  afterAll(async () => {
    await rm(TEST_BUCKET, { recursive: true, force: true });
    await rm(TEST_CACHE, { recursive: true, force: true });
    await rm(TEST_RENDERS, { recursive: true, force: true });
    delete process.env.SALTWATER_BUCKET_DIR;
    delete process.env.SALTWATER_BUCKET_CACHE_DIR;
    delete process.env.RENDERS_ROOT;
    delete process.env.SALTWATER_PRODUCTS_JSON;
    setAnthropicClientForTest(null);
    setHeygenFetchForTest(null);
    setFashnFetchForTest(null);
    setFfmpegSpawnForTest(null);
  });

  test('three tick iterations drive a brief from queued → ready_for_review', async () => {
    const llm = installLLMStub();
    installVendorStubs();
    const { hookSetId, variantIds, attemptIds } = await seedBriefAndAttempts({ skuId: 'polo-navy' });

    // ---- Tick 1: claims queued attempts → hooks_generating, runs LLM, advances to hooks_ready ----
    await tick({ maxConcurrent: 4 });

    // The lock-holder finished hook generation. Other attempts may have been
    // claimed but they should ALSO be at hooks_ready (skipped LLM). LLM was
    // called exactly ONCE (the lock prevented multiple calls).
    expect(llm.calls).toBe(1);

    const hs = db().query(`SELECT status, prompt_hash, model FROM hook_set WHERE id = ?`)
      .get(hookSetId) as { status: string; prompt_hash: string; model: string };
    expect(hs.status).toBe('ready');
    expect(hs.prompt_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hs.model).toBe('claude-sonnet-4-6');

    // All 3 variants populated with hook_text
    const variants = db().query(`SELECT id, sub_variant_label, hook_text FROM variant WHERE hook_set_id = ? ORDER BY id`)
      .all(hookSetId) as Array<{ id: number; sub_variant_label: string; hook_text: string }>;
    expect(variants.length).toBe(3);
    expect(variants[0].hook_text).toBe('V1 valid hook');
    expect(variants[1].hook_text).toBe('V2 valid hook');
    expect(variants[2].hook_text).toBe('V3 valid hook');

    // The lock-holder is at hooks_ready; the other two are still at queued
    // (they were not yet claimed by this tick — claimJobs took a snapshot).
    const stateCounts1 = db().query(`SELECT state, COUNT(*) as n FROM render_attempt GROUP BY state`)
      .all() as Array<{ state: string; n: number }>;
    const map1 = new Map(stateCounts1.map((r) => [r.state, r.n]));
    expect(map1.get('hooks_ready')).toBeGreaterThanOrEqual(1);

    // ---- Tick 2: every attempt now at hooks_ready (or queued and skipping straight to hooks_ready) → vendor_pending → partial ----
    await tick({ maxConcurrent: 4 });
    // The LLM was already done; the queued attempts should have skipped the LLM and gone straight to hooks_ready in Tick 2,
    // OR vendors ran for the lock-holder. Multiple ticks may be needed.
    // Run a few more ticks to drain the cascade.
    for (let i = 0; i < 6; i++) {
      await tick({ maxConcurrent: 4 });
    }

    // By now everything should be ready_for_review.
    const finalStates = db().query(`SELECT state FROM render_attempt WHERE id IN (?, ?, ?)`)
      .all(...attemptIds) as Array<{ state: string }>;
    expect(finalStates.every((r) => r.state === 'ready_for_review')).toBe(true);

    // LLM still called exactly ONCE total — the lock held across all ticks
    expect(llm.calls).toBe(1);

    // Each attempt has master.mp4, thumb.jpg, master.srt assets
    for (const aid of attemptIds) {
      const assets = db().query(`SELECT type FROM asset WHERE render_attempt_id = ? ORDER BY type`)
        .all(aid) as Array<{ type: string }>;
      expect(assets.map((a) => a.type)).toContain('mp4');
      expect(assets.map((a) => a.type)).toContain('jpg');
      expect(assets.map((a) => a.type)).toContain('srt');
    }

    // Variant status flipped to ready_for_review
    const finalVariants = db().query(`SELECT status FROM variant WHERE id IN (?, ?, ?)`)
      .all(...variantIds) as Array<{ status: string }>;
    expect(finalVariants.every((v) => v.status === 'ready_for_review')).toBe(true);
  });

  test('LLM failure → hook_set marked failed, all attempts → failed_recoverable on next tick', async () => {
    setAnthropicClientForTest({
      messages: {
        create: async () => {
          throw new Error('synthetic LLM outage');
        },
      },
    });
    installVendorStubs();
    const { hookSetId, attemptIds } = await seedBriefAndAttempts({ skuId: 'polo-navy' });

    await tick({ maxConcurrent: 4 });

    const hs = db().query(`SELECT status FROM hook_set WHERE id = ?`).get(hookSetId) as { status: string };
    expect(hs.status).toBe('failed');

    // The lock-holder threw → tick.markFailed → state=failed_recoverable
    const lockHolderState = db().query(`SELECT state FROM render_attempt WHERE id = ?`).get(attemptIds[0]) as { state: string };
    expect(lockHolderState.state).toBe('failed_recoverable');

    // Subsequent ticks: queued attempts will see hook_set.status='failed'
    // and throw, getting marked failed_recoverable too.
    for (let i = 0; i < 3; i++) {
      await tick({ maxConcurrent: 4 });
    }
    const finalStates = db().query(`SELECT state FROM render_attempt WHERE id IN (?, ?, ?)`)
      .all(...attemptIds) as Array<{ state: string }>;
    expect(finalStates.every((r) => r.state === 'failed_recoverable')).toBe(true);
  });

  test('vendor failure (both vendors fail) → render_attempt → failed_recoverable', async () => {
    installLLMStub();
    setHeygenFetchForTest(async () => new Response('fail', { status: 500, statusText: 'Internal' }));
    setFashnFetchForTest(async () => new Response('fail', { status: 500, statusText: 'Internal' }));
    setFfmpegSpawnForTest(() => ({ exited: Promise.resolve(0), stderr: null }));
    const { attemptIds } = await seedBriefAndAttempts({ skuId: 'polo-navy' });

    for (let i = 0; i < 8; i++) {
      await tick({ maxConcurrent: 4 });
    }

    const states = db().query(`SELECT state, error_message FROM render_attempt WHERE id IN (?, ?, ?)`)
      .all(...attemptIds) as Array<{ state: string; error_message: string | null }>;
    expect(states.every((r) => r.state === 'failed_recoverable')).toBe(true);
    expect(states[0].error_message).toContain('both HeyGen and Fashn failed');
  });

  test('partial render (HeyGen fails, Fashn succeeds) still completes via assembly', async () => {
    installLLMStub();
    setHeygenFetchForTest(async () => new Response('hg-fail', { status: 500, statusText: 'Internal' }));
    setFashnFetchForTest(async (url) => {
      if (url.endsWith('/v1/run')) return jsonResponse({ id: 'tryon-1' });
      if (url.endsWith('/v1/animate')) return jsonResponse({ id: 'animate-1' });
      if (url.includes('/v1/status/tryon-1')) return jsonResponse({ status: 'completed', output: ['https://fashn.test/tryon.jpg'] });
      if (url.includes('/v1/status/animate-1')) return jsonResponse({ status: 'completed', output: ['https://fashn.test/animate.mp4'] });
      if (url.includes('fashn.test/')) return binaryResponse();
      throw new Error(`unexpected: ${url}`);
    });
    setFfmpegSpawnForTest(() => ({ exited: Promise.resolve(0), stderr: null }));

    const { attemptIds } = await seedBriefAndAttempts({ skuId: 'polo-navy' });

    for (let i = 0; i < 8; i++) {
      await tick({ maxConcurrent: 4 });
    }

    const states = db().query(`SELECT state, heygen_clip_id, fashn_clip_id FROM render_attempt WHERE id = ?`)
      .get(attemptIds[0]) as { state: string; heygen_clip_id: string | null; fashn_clip_id: string | null };
    expect(states.state).toBe('ready_for_review');
    expect(states.heygen_clip_id).toBeNull();
    expect(states.fashn_clip_id).toBe('animate-1');
  });
});

describe('A3 totalJob ceiling sweep', () => {
  beforeAll(async () => {
    loadSecrets();
    await migrate({ quiet: true });
  });

  beforeEach(async () => {
    db().run('DELETE FROM asset');
    db().run('DELETE FROM render_attempt');
    db().run('DELETE FROM variant');
    db().run('DELETE FROM hook_set');
    db().run('DELETE FROM brief');
    db().run('DELETE FROM brand_bucket_version');
  });

  async function seedAttempt(state: string, startedMinutesAgo: number | null): Promise<number> {
    const conn = db();
    const bbvId = Number(conn.run(
      `INSERT INTO brand_bucket_version (voice_sha256, customer_sha256, winning_patterns_sha256, products_sha256, hooks_winners_sha256, hooks_losers_sha256) VALUES ('a','b','c','d','e','f')`,
    ).lastInsertRowid);
    const briefId = Number(conn.run(`INSERT INTO brief (operator, free_text) VALUES ('t','t')`).lastInsertRowid);
    const hsId = Number(conn.run(
      `INSERT INTO hook_set (brief_id, brand_bucket_version_id, model, prompt_hash, status) VALUES (?, ?, '', '', 'ready')`,
      [briefId, bbvId],
    ).lastInsertRowid);
    const vid = Number(conn.run(
      `INSERT INTO variant (hook_set_id, hook_text, sub_variant_label, status) VALUES (?, 'h', 'V1', 'queued')`,
      [hsId],
    ).lastInsertRowid);
    const startedSql = startedMinutesAgo == null
      ? 'NULL'
      : `datetime('now', '-${startedMinutesAgo} minutes')`;
    const aid = Number(conn.run(
      `INSERT INTO render_attempt (variant_id, attempt_number, state, started_at) VALUES (?, 1, ?, ${startedSql})`,
      [vid, state],
    ).lastInsertRowid);
    return aid;
  }

  test('sweepStaleAttempts: transit-state row >15min old → failed_recoverable', async () => {
    const aid = await seedAttempt('hooks_generating', 20);
    const swept = sweepStaleAttempts();
    expect(swept).toBe(1);
    const row = db().query(`SELECT state, error_message FROM render_attempt WHERE id = ?`).get(aid) as { state: string; error_message: string };
    expect(row.state).toBe('failed_recoverable');
    expect(row.error_message).toContain('total-job ceiling exceeded');
  });

  test('sweepStaleAttempts: transit-state row <15min old → untouched', async () => {
    const aid = await seedAttempt('vendor_pending', 5);
    const swept = sweepStaleAttempts();
    expect(swept).toBe(0);
    const row = db().query(`SELECT state FROM render_attempt WHERE id = ?`).get(aid) as { state: string };
    expect(row.state).toBe('vendor_pending');
  });

  test('sweepStaleAttempts: row with NULL started_at → untouched (never started)', async () => {
    const aid = await seedAttempt('hooks_generating', null);
    const swept = sweepStaleAttempts();
    expect(swept).toBe(0);
    const row = db().query(`SELECT state FROM render_attempt WHERE id = ?`).get(aid) as { state: string };
    expect(row.state).toBe('hooks_generating');
  });

  test('sweepStaleAttempts: claimable-state row (queued/hooks_ready/partial) → untouched even if old', async () => {
    const aid = await seedAttempt('queued', 60);
    const swept = sweepStaleAttempts();
    expect(swept).toBe(0);
    const row = db().query(`SELECT state FROM render_attempt WHERE id = ?`).get(aid) as { state: string };
    expect(row.state).toBe('queued');
  });

  test('tick.tick() runs sweep before claiming new work', async () => {
    const stale = await seedAttempt('hooks_generating', 30);
    await tick({ maxConcurrent: 4 });
    const row = db().query(`SELECT state FROM render_attempt WHERE id = ?`).get(stale) as { state: string };
    expect(row.state).toBe('failed_recoverable');
  });

  test('previously-failed (markFailed) row not re-touched by sweep', async () => {
    const aid = await seedAttempt('hooks_generating', 30);
    markFailed(aid, 'previous failure');
    // Now state=failed_recoverable; sweep should ignore it (not in TRANSIT_STATES anymore)
    const swept = sweepStaleAttempts();
    expect(swept).toBe(0);
  });
});
