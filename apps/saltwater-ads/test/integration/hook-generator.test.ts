import { describe, test, expect, beforeAll, beforeEach, afterAll } from 'bun:test';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

import { migrate } from '@db/migrate.ts';
import { db } from '@db/client.ts';
import { snapshotBucket } from '@lib/services/brand-bucket-manager.ts';
import { setAnthropicClientForTest } from '@lib/llm/anthropic.ts';
import { runHookGenerator } from '@lib/services/hook-generator.ts';
import type { HookSet } from '@lib/llm/types.ts';

// Lane B: hook-generator integration. Stitches snapshotBucket + Anthropic
// stub + validation regen loop. Pins:
//   1. Loads bucket from cache (NEVER re-snapshots — H-1 contract)
//   2. Runs validation; regens up to 3 times when violations surface
//   3. Returns rejected list when regens exhausted
//   4. Token usage flows through

process.env.DB_PATH = ':memory:';

const TEST_BUCKET = resolve(import.meta.dir, '../../data/test-hook-gen-bucket');
const TEST_CACHE = resolve(import.meta.dir, '../../data/test-hook-gen-cache');

const BUCKET_FIXTURES = {
  'voice.md': '# Voice\nFounder-led, salt-sun-and-grit.\n',
  'customer.md': '# Customer\nOlder Joe DeMarco.\n',
  'winning-patterns.md': '# Patterns\nFounder, problem-solution, limited drop.\n',
  'products.json': '{"skus":[{"id":"polo-navy","name":"Performance Polo Navy"}]}\n',
  'hooks-winners.jsonl': '{"hook_text":"winner one","pattern":"founder"}\n',
  'hooks-losers.jsonl': '{"hook_text":"loser one","pattern":"limited_drop"}\n',
};

async function writeBucket(): Promise<void> {
  await mkdir(TEST_BUCKET, { recursive: true });
  for (const [name, content] of Object.entries(BUCKET_FIXTURES)) {
    await writeFile(resolve(TEST_BUCKET, name), content);
  }
}

const VALID_HOOK_TEXT = 'I built this for guys like my dad — Coastal Comfort™ that holds up after the boat ramp.';

function validHookSet(): HookSet {
  return {
    variants: [
      [
        { label: 'V1', pattern: 'founder', hook_text: VALID_HOOK_TEXT },
        { label: 'V2', pattern: 'founder', hook_text: 'My brother Buddy and I started Saltwater because nothing fit right.' },
        { label: 'V3', pattern: 'founder', hook_text: 'This is the polo I wished existed when I was thirty.' },
      ],
      [
        { label: 'V1', pattern: 'founder', hook_text: 'A1 valid' },
        { label: 'V2', pattern: 'founder', hook_text: 'A2 valid' },
        { label: 'V3', pattern: 'founder', hook_text: 'A3 valid' },
      ],
      [
        { label: 'V1', pattern: 'founder', hook_text: 'B1 valid' },
        { label: 'V2', pattern: 'founder', hook_text: 'B2 valid' },
        { label: 'V3', pattern: 'founder', hook_text: 'B3 valid' },
      ],
    ],
  };
}

function tooLongHookSet(): HookSet {
  const tooLong = 'X'.repeat(141);
  return {
    variants: [
      [
        { label: 'V1', pattern: 'founder', hook_text: tooLong },
        { label: 'V2', pattern: 'founder', hook_text: 'ok 2' },
        { label: 'V3', pattern: 'founder', hook_text: 'ok 3' },
      ],
      [
        { label: 'V1', pattern: 'founder', hook_text: 'B1' },
        { label: 'V2', pattern: 'founder', hook_text: 'B2' },
        { label: 'V3', pattern: 'founder', hook_text: 'B3' },
      ],
      [
        { label: 'V1', pattern: 'founder', hook_text: 'C1' },
        { label: 'V2', pattern: 'founder', hook_text: 'C2' },
        { label: 'V3', pattern: 'founder', hook_text: 'C3' },
      ],
    ],
  };
}

function fakeAnthropicResponse(hookSet: HookSet) {
  return {
    content: [{ type: 'text', text: JSON.stringify(hookSet) }],
    usage: { input_tokens: 100, output_tokens: 50 },
  };
}

describe('runHookGenerator', () => {
  let bbvId: number;

  beforeAll(async () => {
    process.env.SALTWATER_BUCKET_DIR = TEST_BUCKET;
    process.env.SALTWATER_BUCKET_CACHE_DIR = TEST_CACHE;
    await migrate({ quiet: true });
  });

  beforeEach(async () => {
    await rm(TEST_BUCKET, { recursive: true, force: true });
    await rm(TEST_CACHE, { recursive: true, force: true });
    db().run('DELETE FROM render_attempt');
    db().run('DELETE FROM variant');
    db().run('DELETE FROM hook_set');
    db().run('DELETE FROM brief');
    db().run('DELETE FROM brand_bucket_version');
    await writeBucket();
    const snap = await snapshotBucket();
    bbvId = snap.versionId;
  });

  afterAll(async () => {
    await rm(TEST_BUCKET, { recursive: true, force: true });
    await rm(TEST_CACHE, { recursive: true, force: true });
    delete process.env.SALTWATER_BUCKET_DIR;
    delete process.env.SALTWATER_BUCKET_CACHE_DIR;
    setAnthropicClientForTest(null);
  });

  test('happy path: returns generation with no rejections, regenAttempts=0', async () => {
    setAnthropicClientForTest({
      messages: {
        create: async () => fakeAnthropicResponse(validHookSet()),
      },
    });

    const result = await runHookGenerator({
      brief: { free_text: 'spring drop teaser', pattern: 'founder' },
      brandBucketVersionId: bbvId,
    });

    expect(result.rejected.length).toBe(0);
    expect(result.regenAttempts).toBe(0);
    expect(result.generation.hookSet.variants.length).toBe(3);
    expect(result.brandBucketVersionId).toBe(bbvId);
  });

  test('regen path: first call invalid, second call valid → regenAttempts=1, no rejections', async () => {
    let call = 0;
    setAnthropicClientForTest({
      messages: {
        create: async () => {
          call++;
          if (call === 1) return fakeAnthropicResponse(tooLongHookSet());
          return fakeAnthropicResponse(validHookSet());
        },
      },
    });

    const result = await runHookGenerator({
      brief: { free_text: 'test', pattern: 'founder' },
      brandBucketVersionId: bbvId,
    });

    expect(call).toBe(2);
    expect(result.regenAttempts).toBe(1);
    expect(result.rejected.length).toBe(0);
  });

  test('exhausted regens: 4 calls all invalid → returns last result + rejected entries', async () => {
    let call = 0;
    setAnthropicClientForTest({
      messages: {
        create: async () => {
          call++;
          return fakeAnthropicResponse(tooLongHookSet());
        },
      },
    });

    const result = await runHookGenerator({
      brief: { free_text: 'test', pattern: 'founder' },
      brandBucketVersionId: bbvId,
    });

    // 1 initial + 3 regens = 4 calls total. After 3 failed regens, return the
    // last attempt with the rejected list populated.
    expect(call).toBe(4);
    expect(result.regenAttempts).toBe(3);
    expect(result.rejected.length).toBeGreaterThan(0);
    expect(result.rejected[0].failures[0].rule).toBe('too_long');
  });

  test('regen feedback is included in the second user prompt', async () => {
    const userPrompts: string[] = [];
    let call = 0;
    setAnthropicClientForTest({
      messages: {
        create: async (params) => {
          const p = params as { messages: Array<{ content: string }> };
          userPrompts.push(p.messages[0].content);
          call++;
          if (call === 1) return fakeAnthropicResponse(tooLongHookSet());
          return fakeAnthropicResponse(validHookSet());
        },
      },
    });

    await runHookGenerator({
      brief: { free_text: 'test', pattern: 'founder' },
      brandBucketVersionId: bbvId,
    });

    expect(userPrompts[0]).not.toContain('Validation feedback');
    expect(userPrompts[1]).toContain('Validation feedback');
    expect(userPrompts[1]).toContain('too_long');
  });

  test('system prompt includes bucket content (templating works)', async () => {
    let capturedSystem = '';
    setAnthropicClientForTest({
      messages: {
        create: async (params) => {
          const p = params as { system: Array<{ text: string }> };
          capturedSystem = p.system[0].text;
          return fakeAnthropicResponse(validHookSet());
        },
      },
    });

    await runHookGenerator({
      brief: { free_text: 'spring', pattern: 'founder' },
      brandBucketVersionId: bbvId,
    });

    expect(capturedSystem).toContain('Founder-led, salt-sun-and-grit');
    expect(capturedSystem).toContain('Older Joe DeMarco');
    expect(capturedSystem).toContain('Performance Polo Navy');
    expect(capturedSystem).toContain('winner one');
    // Templates fully filled — no leftover {{...}} markers.
    expect(capturedSystem).not.toMatch(/\{\{[A-Z_]+\}\}/);
  });

  test('user prompt includes brief fields', async () => {
    let capturedUser = '';
    setAnthropicClientForTest({
      messages: {
        create: async (params) => {
          const p = params as { messages: Array<{ content: string }> };
          capturedUser = p.messages[0].content;
          return fakeAnthropicResponse(validHookSet());
        },
      },
    });

    await runHookGenerator({
      brief: {
        free_text: 'launch the new navy polo for spring',
        pattern: 'limited_drop',
        sku_id: 'polo-navy',
        audience_tag: 'older-joe',
        season: 'SS26',
      },
      brandBucketVersionId: bbvId,
    });

    expect(capturedUser).toContain('launch the new navy polo for spring');
    expect(capturedUser).toContain('limited_drop');
    expect(capturedUser).toContain('polo-navy');
    expect(capturedUser).toContain('older-joe');
    expect(capturedUser).toContain('SS26');
  });

  test('unknown brandBucketVersionId surfaces as load error', async () => {
    setAnthropicClientForTest({
      messages: { create: async () => fakeAnthropicResponse(validHookSet()) },
    });
    await expect(
      runHookGenerator({ brief: { free_text: 't', pattern: 'founder' }, brandBucketVersionId: 99999 }),
    ).rejects.toThrow(/brand_bucket_version 99999/);
  });

  test('null pattern defaults to "founder" in the prompt', async () => {
    let capturedUser = '';
    setAnthropicClientForTest({
      messages: {
        create: async (params) => {
          const p = params as { messages: Array<{ content: string }> };
          capturedUser = p.messages[0].content;
          return fakeAnthropicResponse(validHookSet());
        },
      },
    });

    await runHookGenerator({
      brief: { free_text: 'no pattern given' },
      brandBucketVersionId: bbvId,
    });

    expect(capturedUser).toContain('founder');
  });
});
