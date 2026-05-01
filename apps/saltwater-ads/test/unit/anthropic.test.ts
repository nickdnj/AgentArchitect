import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { generateHooks, setAnthropicClientForTest } from '@lib/llm/anthropic.ts';
import type { BrandBucketSnapshot } from '@lib/llm/types.ts';

// Lane B: generateHooks contract. Stubs the Anthropic SDK so we can pin
// happy-path JSON parsing, fence stripping, error handling, and token
// usage capture.

const FAKE_BUCKET: BrandBucketSnapshot = {
  voice: 'voice content',
  customer: 'customer content',
  winning_patterns: 'patterns content',
  products: '{"skus":[]}',
  hooks_winners: ['{"hook_text":"w1"}'],
  hooks_losers: ['{"hook_text":"l1"}'],
  versionId: 1,
};

function fakeResponse(text: string, usage?: Partial<{
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens: number;
  cache_creation_input_tokens: number;
}>) {
  return {
    content: [{ type: 'text', text }],
    usage: {
      input_tokens: usage?.input_tokens ?? 100,
      output_tokens: usage?.output_tokens ?? 50,
      cache_read_input_tokens: usage?.cache_read_input_tokens,
      cache_creation_input_tokens: usage?.cache_creation_input_tokens,
    },
  };
}

const VALID_HOOKSET_JSON = JSON.stringify({
  variants: [
    [
      { label: 'V1', pattern: 'founder', hook_text: 'I built this for guys like my dad.' },
      { label: 'V2', pattern: 'founder', hook_text: 'My brother and I started Saltwater because we were tired of fast fashion.' },
      { label: 'V3', pattern: 'founder', hook_text: 'This is the polo I wish existed when I was thirty.' },
    ],
    [
      { label: 'V1', pattern: 'founder', hook_text: 'A1' },
      { label: 'V2', pattern: 'founder', hook_text: 'A2' },
      { label: 'V3', pattern: 'founder', hook_text: 'A3' },
    ],
    [
      { label: 'V1', pattern: 'founder', hook_text: 'B1' },
      { label: 'V2', pattern: 'founder', hook_text: 'B2' },
      { label: 'V3', pattern: 'founder', hook_text: 'B3' },
    ],
  ],
});

describe('generateHooks', () => {
  let lastParams: unknown;

  beforeEach(() => {
    lastParams = undefined;
  });

  afterEach(() => {
    setAnthropicClientForTest(null);
  });

  test('happy path: parses 3×3 hookSet, captures tokens, returns promptHash', async () => {
    setAnthropicClientForTest({
      messages: {
        create: async (params) => {
          lastParams = params;
          return fakeResponse(VALID_HOOKSET_JSON, {
            input_tokens: 5000,
            output_tokens: 800,
            cache_creation_input_tokens: 4500,
            cache_read_input_tokens: 0,
          });
        },
      },
    });

    const result = await generateHooks({
      brief: { free_text: 'spring drop' },
      bucket: FAKE_BUCKET,
      systemPrompt: 'system text',
      userPrompt: 'user text',
    });

    expect(result.hookSet.variants.length).toBe(3);
    expect(result.hookSet.variants[0].length).toBe(3);
    expect(result.hookSet.variants[0][0].label).toBe('V1');
    expect(result.hookSet.variants[0][0].hook_text).toContain('built this');
    expect(result.tokensInput).toBe(5000);
    expect(result.tokensOutput).toBe(800);
    expect(result.cacheWriteTokens).toBe(4500);
    expect(result.cacheReadTokens).toBe(0);
    expect(result.promptHash).toMatch(/^[0-9a-f]{64}$/);
    expect(result.model).toBe('claude-sonnet-4-6');
  });

  test('cache_control is applied to system block (so providers can cache by content)', async () => {
    setAnthropicClientForTest({
      messages: {
        create: async (params) => {
          lastParams = params;
          return fakeResponse(VALID_HOOKSET_JSON);
        },
      },
    });

    await generateHooks({
      brief: { free_text: 't' },
      bucket: FAKE_BUCKET,
      systemPrompt: 'sys',
      userPrompt: 'usr',
    });

    const params = lastParams as { system: Array<{ type: string; text: string; cache_control: { type: string } }> };
    expect(params.system).toBeDefined();
    expect(params.system[0].cache_control.type).toBe('ephemeral');
    expect(params.system[0].text).toBe('sys');
  });

  test('strips ```json fences if model wraps output', async () => {
    setAnthropicClientForTest({
      messages: {
        create: async () => fakeResponse('```json\n' + VALID_HOOKSET_JSON + '\n```'),
      },
    });

    const result = await generateHooks({
      brief: { free_text: 't' },
      bucket: FAKE_BUCKET,
      systemPrompt: 's',
      userPrompt: 'u',
    });
    expect(result.hookSet.variants.length).toBe(3);
  });

  test('non-JSON output throws with first 200 chars in message', async () => {
    setAnthropicClientForTest({
      messages: {
        create: async () => fakeResponse('Sorry, I cannot do that.'),
      },
    });

    await expect(
      generateHooks({ brief: { free_text: 't' }, bucket: FAKE_BUCKET, systemPrompt: 's', userPrompt: 'u' }),
    ).rejects.toThrow(/non-JSON/);
  });

  test('JSON without variants[] throws', async () => {
    setAnthropicClientForTest({
      messages: {
        create: async () => fakeResponse('{"foo": "bar"}'),
      },
    });

    await expect(
      generateHooks({ brief: { free_text: 't' }, bucket: FAKE_BUCKET, systemPrompt: 's', userPrompt: 'u' }),
    ).rejects.toThrow(/missing variants/);
  });

  test('wrong variant count throws', async () => {
    const onlyTwo = JSON.stringify({
      variants: [
        [{ label: 'V1', pattern: 'founder', hook_text: 'a' }, { label: 'V2', pattern: 'founder', hook_text: 'b' }, { label: 'V3', pattern: 'founder', hook_text: 'c' }],
        [{ label: 'V1', pattern: 'founder', hook_text: 'a' }, { label: 'V2', pattern: 'founder', hook_text: 'b' }, { label: 'V3', pattern: 'founder', hook_text: 'c' }],
      ],
    });
    setAnthropicClientForTest({
      messages: { create: async () => fakeResponse(onlyTwo) },
    });

    await expect(
      generateHooks({ brief: { free_text: 't' }, bucket: FAKE_BUCKET, systemPrompt: 's', userPrompt: 'u' }),
    ).rejects.toThrow(/variants\.length === 3/);
  });

  test('bad sub-variant label throws', async () => {
    const badLabel = JSON.stringify({
      variants: [
        [
          { label: 'A', pattern: 'founder', hook_text: 'x' },
          { label: 'V2', pattern: 'founder', hook_text: 'y' },
          { label: 'V3', pattern: 'founder', hook_text: 'z' },
        ],
        [
          { label: 'V1', pattern: 'founder', hook_text: '1' },
          { label: 'V2', pattern: 'founder', hook_text: '2' },
          { label: 'V3', pattern: 'founder', hook_text: '3' },
        ],
        [
          { label: 'V1', pattern: 'founder', hook_text: 'a' },
          { label: 'V2', pattern: 'founder', hook_text: 'b' },
          { label: 'V3', pattern: 'founder', hook_text: 'c' },
        ],
      ],
    });
    setAnthropicClientForTest({ messages: { create: async () => fakeResponse(badLabel) } });
    await expect(
      generateHooks({ brief: { free_text: 't' }, bucket: FAKE_BUCKET, systemPrompt: 's', userPrompt: 'u' }),
    ).rejects.toThrow(/bad label/);
  });

  test('empty hook_text throws', async () => {
    const emptyHook = JSON.stringify({
      variants: [
        [
          { label: 'V1', pattern: 'founder', hook_text: '' },
          { label: 'V2', pattern: 'founder', hook_text: 'b' },
          { label: 'V3', pattern: 'founder', hook_text: 'c' },
        ],
        [
          { label: 'V1', pattern: 'founder', hook_text: '1' },
          { label: 'V2', pattern: 'founder', hook_text: '2' },
          { label: 'V3', pattern: 'founder', hook_text: '3' },
        ],
        [
          { label: 'V1', pattern: 'founder', hook_text: 'a' },
          { label: 'V2', pattern: 'founder', hook_text: 'b' },
          { label: 'V3', pattern: 'founder', hook_text: 'c' },
        ],
      ],
    });
    setAnthropicClientForTest({ messages: { create: async () => fakeResponse(emptyHook) } });
    await expect(
      generateHooks({ brief: { free_text: 't' }, bucket: FAKE_BUCKET, systemPrompt: 's', userPrompt: 'u' }),
    ).rejects.toThrow(/hook_text missing or empty/);
  });

  test('promptHash is deterministic for identical prompts', async () => {
    setAnthropicClientForTest({
      messages: { create: async () => fakeResponse(VALID_HOOKSET_JSON) },
    });
    const a = await generateHooks({ brief: { free_text: 't' }, bucket: FAKE_BUCKET, systemPrompt: 'AAA', userPrompt: 'BBB' });
    const b = await generateHooks({ brief: { free_text: 't' }, bucket: FAKE_BUCKET, systemPrompt: 'AAA', userPrompt: 'BBB' });
    expect(a.promptHash).toBe(b.promptHash);
  });

  test('promptHash differs when system OR user prompt changes', async () => {
    setAnthropicClientForTest({
      messages: { create: async () => fakeResponse(VALID_HOOKSET_JSON) },
    });
    const a = await generateHooks({ brief: { free_text: 't' }, bucket: FAKE_BUCKET, systemPrompt: 'AAA', userPrompt: 'BBB' });
    const b = await generateHooks({ brief: { free_text: 't' }, bucket: FAKE_BUCKET, systemPrompt: 'AAA', userPrompt: 'CCC' });
    const c = await generateHooks({ brief: { free_text: 't' }, bucket: FAKE_BUCKET, systemPrompt: 'XXX', userPrompt: 'BBB' });
    expect(a.promptHash).not.toBe(b.promptHash);
    expect(a.promptHash).not.toBe(c.promptHash);
  });
});
