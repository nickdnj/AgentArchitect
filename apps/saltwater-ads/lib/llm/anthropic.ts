import Anthropic from '@anthropic-ai/sdk';
import { createHash } from 'node:crypto';
import { secrets } from '@lib/services/secrets.ts';
import type { BrandBucketSnapshot, BriefShape, GenerationResult, HookSet } from './types.ts';

// Repo-owned LLM provider abstraction (SAD §3 + §8).
// Provider abstraction supports prompt caching keyed by (brand_bucket_version_id + brief shape).
//
// Cache strategy: the system prompt holds the entire brand bucket (voice,
// customer, winning patterns, products, winners, losers). With cache_control
// on the system block, Anthropic stores an ephemeral cache keyed by the
// content hash. Two briefs against the same brand_bucket_version reuse that
// cache, dropping per-call input tokens from ~5k to <500.

const MODEL = 'claude-sonnet-4-6';

interface AnthropicLike {
  messages: {
    create: (params: unknown, options?: { signal?: AbortSignal }) => Promise<unknown>;
  };
}

let _client: AnthropicLike | null = null;

function client(): AnthropicLike {
  if (_client) return _client;
  _client = new Anthropic({ apiKey: secrets.anthropic() }) as unknown as AnthropicLike;
  return _client;
}

/**
 * Test-only: inject a fake client. Pass `null` to reset.
 */
export function setAnthropicClientForTest(c: AnthropicLike | null): void {
  _client = c;
}

export interface GenerateHooksArgs {
  brief: BriefShape;
  bucket: BrandBucketSnapshot;
  systemPrompt: string;     // fully assembled (templates already substituted)
  userPrompt: string;       // fully assembled
  /**
   * Codex eng-review-3 #3: thread caller's totalJob signal into the SDK call
   * so a stuck Anthropic request can be aborted before the worker's 15-min
   * ceiling triggers a sweep + post-failure row mutation.
   */
  abortSignal?: AbortSignal;
}

interface AnthropicResponse {
  content: Array<{ type: string; text?: string }>;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_read_input_tokens?: number;
    cache_creation_input_tokens?: number;
  };
}

function extractText(resp: AnthropicResponse): string {
  for (const block of resp.content) {
    if (block.type === 'text' && typeof block.text === 'string') {
      return block.text;
    }
  }
  throw new Error('anthropic response had no text content block');
}

/**
 * Strip optional ```json fences. Some models slip them in despite instructions.
 */
function stripFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return fenced ? fenced[1].trim() : trimmed;
}

function parseHookSet(text: string): HookSet {
  const cleaned = stripFences(text);
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`anthropic returned non-JSON: ${(err as Error).message}. First 200 chars: ${cleaned.slice(0, 200)}`);
  }
  if (!parsed || typeof parsed !== 'object' || !('variants' in parsed)) {
    throw new Error('anthropic JSON missing variants[]');
  }
  const variants = (parsed as { variants: unknown }).variants;
  if (!Array.isArray(variants) || variants.length !== 3) {
    throw new Error(`expected variants.length === 3, got ${Array.isArray(variants) ? variants.length : typeof variants}`);
  }
  for (const main of variants) {
    if (!Array.isArray(main) || main.length !== 3) {
      throw new Error('each variant group must have exactly 3 sub-variants');
    }
    for (const sub of main) {
      if (!sub || typeof sub !== 'object') {
        throw new Error('hook entry must be an object');
      }
      const s = sub as { label?: unknown; pattern?: unknown; hook_text?: unknown };
      if (typeof s.hook_text !== 'string' || !s.hook_text.trim()) {
        throw new Error('hook_text missing or empty');
      }
      if (s.label !== 'V1' && s.label !== 'V2' && s.label !== 'V3') {
        throw new Error(`bad label: ${String(s.label)}`);
      }
    }
  }
  return parsed as HookSet;
}

export async function generateHooks(args: GenerateHooksArgs): Promise<GenerationResult> {
  const promptHash = createHash('sha256')
    .update(args.systemPrompt)
    .update('\n---\n')
    .update(args.userPrompt)
    .digest('hex');

  // The Anthropic SDK takes the body params as the first argument and
  // request options (including AbortSignal) as the SECOND argument.
  // Putting `signal` on the body params object causes a 400
  // "Extra inputs are not permitted" because signal isn't an API field.
  // First-contact bug discovered in eng-review-3 dogfood.
  const createParams = {
    model: MODEL,
    max_tokens: llmConfig.maxTokens,
    temperature: llmConfig.temperature,
    system: [
      {
        type: 'text',
        text: args.systemPrompt,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: args.userPrompt }],
  };
  const requestOptions: { signal?: AbortSignal } = {};
  if (args.abortSignal) {
    requestOptions.signal = args.abortSignal;
  }
  const resp = (await client().messages.create(createParams as unknown, requestOptions)) as AnthropicResponse;

  const hookSet = parseHookSet(extractText(resp));

  return {
    hookSet,
    promptHash,
    model: MODEL,
    tokensInput: resp.usage.input_tokens,
    tokensOutput: resp.usage.output_tokens,
    cacheReadTokens: resp.usage.cache_read_input_tokens ?? 0,
    cacheWriteTokens: resp.usage.cache_creation_input_tokens ?? 0,
  };
}

export const llmConfig = {
  model: MODEL,
  maxTokens: 2000,
  temperature: 0.8,
};
