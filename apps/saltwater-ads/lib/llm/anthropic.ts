import Anthropic from '@anthropic-ai/sdk';
import { secrets } from '@lib/services/secrets.ts';
import type { BrandBucketSnapshot, BriefShape, GenerationResult } from './types.ts';

// Repo-owned LLM provider abstraction (SAD §3 + §8).
// Provider abstraction supports prompt caching keyed by (brand_bucket_version_id + brief shape).

const MODEL = 'claude-sonnet-4-6';

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (_client) return _client;
  _client = new Anthropic({ apiKey: secrets.anthropic() });
  return _client;
}

export interface GenerateHooksArgs {
  brief: BriefShape;
  bucket: BrandBucketSnapshot;
  systemPrompt: string;     // loaded from lib/llm/prompts/hook-system.md (templated)
  userPrompt: string;       // loaded from lib/llm/prompts/hook-user.md (templated)
}

export async function generateHooks(_args: GenerateHooksArgs): Promise<GenerationResult> {
  // TODO:
  //   1. messages.create with cache_control: { type: 'ephemeral' } on the system message
  //      (system-message content includes bucket priming so Anthropic can cache by content)
  //   2. parse JSON output → HookSet (3 main × 3 sub-variants)
  //   3. capture token usage including cache_read_tokens / cache_creation_tokens
  //   4. compute promptHash = SHA-256 of full assembled prompt
  //   5. return GenerationResult
  throw new Error('not_implemented: lib/llm/anthropic.generateHooks');
}

export const llmConfig = {
  model: MODEL,
  maxTokens: 2000,
  temperature: 0.8,
};
