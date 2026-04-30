import { generateHooks } from '@lib/llm/anthropic.ts';
import { snapshotBucket } from './brand-bucket-manager.ts';
import { validateHook } from './validation.ts';
import type { BriefShape, GenerationResult, Hook } from '@lib/llm/types.ts';

// PRD §6.1.2 — the only LLM-driven agent in the system.
// Owns: brief → 3 hook variants × 3 sub-variants, validated.
// Called by Render Orchestrator from worker pipeline (state: hooks_generating).

const MAX_VALIDATION_REGEN = 3;

export interface RunHookGeneratorArgs {
  brief: BriefShape;
}

export interface RunHookGeneratorResult {
  generation: GenerationResult;
  brandBucketVersionId: number;
  rejected: { hook: Hook; failure: { rule: string; detail: string } }[];
}

export async function runHookGenerator(_args: RunHookGeneratorArgs): Promise<RunHookGeneratorResult> {
  // TODO:
  //   1. snapshotBucket() → BrandBucketSnapshot + brand_bucket_version row
  //   2. assemble system + user prompt (lib/llm/prompts/*.md templated with bucket fields)
  //   3. call generateHooks() — get 3 main × 3 sub-variants
  //   4. validate every hook → if any fails, regen up to MAX_VALIDATION_REGEN times
  //   5. persist variant rows (status='queued') in caller (render-orchestrator)
  //   6. return result for worker to advance state machine
  throw new Error('not_implemented: hook-generator.runHookGenerator');
}

export { validateHook, MAX_VALIDATION_REGEN };
