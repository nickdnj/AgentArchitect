import { resolve } from 'node:path';
import { generateHooks } from '@lib/llm/anthropic.ts';
import { loadBucketSnapshot } from './brand-bucket-manager.ts';
import { validateHook, type ValidationFailure } from './validation.ts';
import type { BriefShape, GenerationResult, Hook, HookSet, BrandBucketSnapshot } from '@lib/llm/types.ts';

// PRD §6.1.2 — the only LLM-driven agent in the system.
// Owns: brief → 3 hook variants × 3 sub-variants, validated.
// Called by Render Orchestrator from worker pipeline (state: hooks_generating).
//
// H-1 fix (internal eng review v0.4): this agent MUST hydrate the bucket
// from the content-addressed cache via loadBucketSnapshot(versionId). It
// MUST NOT call snapshotBucket() — that would re-snapshot mid-job and
// silently re-version any in-flight Settings upload, lying about which
// content actually drove the generation. The brief's create transaction
// (routes/briefs.ts) is the single place where snapshotBucket() runs.

const MAX_VALIDATION_REGEN = 3;

const SYSTEM_PROMPT_PATH = resolve(import.meta.dir, '../llm/prompts/hook-system.md');
const USER_PROMPT_PATH = resolve(import.meta.dir, '../llm/prompts/hook-user.md');

let _systemTemplate: string | null = null;
let _userTemplate: string | null = null;

async function loadTemplates(): Promise<{ system: string; user: string }> {
  if (_systemTemplate === null) {
    _systemTemplate = await Bun.file(SYSTEM_PROMPT_PATH).text();
  }
  if (_userTemplate === null) {
    _userTemplate = await Bun.file(USER_PROMPT_PATH).text();
  }
  return { system: _systemTemplate, user: _userTemplate };
}

function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{([A-Z_]+)\}\}/g, (_match, key: string) => {
    return vars[key] ?? '';
  });
}

function buildSystemPrompt(template: string, bucket: BrandBucketSnapshot): string {
  return fillTemplate(template, {
    VOICE_MD: bucket.voice,
    CUSTOMER_MD: bucket.customer,
    WINNING_PATTERNS_MD: bucket.winning_patterns,
    PRODUCTS_JSON: bucket.products,
    HOOKS_WINNERS_JSONL: bucket.hooks_winners.join('\n'),
    HOOKS_LOSERS_JSONL: bucket.hooks_losers.join('\n'),
  });
}

function buildUserPrompt(template: string, brief: BriefShape, regenFeedback?: string): string {
  let prompt = fillTemplate(template, {
    FREE_TEXT: brief.free_text,
    PATTERN: brief.pattern ?? 'founder',
    SKU_ID: brief.sku_id ?? '(none)',
    AUDIENCE_TAG: brief.audience_tag ?? '(none)',
    SEASON: brief.season ?? '(none)',
  });
  if (regenFeedback) {
    prompt += `\n\n## Validation feedback (previous attempt)\n\n${regenFeedback}\n\nFix every listed violation in this attempt. Keep variants in the locked pattern.`;
  }
  return prompt;
}

function flattenHooks(hookSet: HookSet): Hook[] {
  return hookSet.variants.flat();
}

interface RejectedEntry {
  hook: Hook;
  failures: ValidationFailure[];
}

function findRejected(hookSet: HookSet, now: Date): RejectedEntry[] {
  const rejected: RejectedEntry[] = [];
  for (const hook of flattenHooks(hookSet)) {
    const failures = validateHook(hook.hook_text, now);
    if (failures.length > 0) {
      rejected.push({ hook, failures });
    }
  }
  return rejected;
}

function buildRegenFeedback(rejected: RejectedEntry[]): string {
  return rejected.map((r) => {
    const ruleList = r.failures.map((f) => `- ${f.rule}: ${f.detail}`).join('\n');
    return `Hook (${r.hook.label}, ${r.hook.pattern}): "${r.hook.hook_text}"\n${ruleList}`;
  }).join('\n\n');
}

export interface RunHookGeneratorArgs {
  brief: BriefShape;
  brandBucketVersionId: number; // assigned at brief-create time, frozen for life of job
  /** Inject a clock for tests. */
  now?: Date;
  /**
   * Codex eng-review-3 #3: caller's totalJob abort signal. Threaded into
   * generateHooks() so a stuck Anthropic call doesn't outlive the 15-min
   * worker ceiling and corrupt rows after the A3 sweep marks the attempt
   * failed_recoverable.
   */
  abortSignal?: AbortSignal;
}

export interface RunHookGeneratorResult {
  generation: GenerationResult;
  brandBucketVersionId: number;
  /** Hooks that failed every regen attempt — caller decides what to do. */
  rejected: RejectedEntry[];
  /** How many extra LLM calls happened beyond the first. */
  regenAttempts: number;
}

export async function runHookGenerator(args: RunHookGeneratorArgs): Promise<RunHookGeneratorResult> {
  const now = args.now ?? new Date();
  const bucket = await loadBucketSnapshot(args.brandBucketVersionId);
  const { system: systemTemplate, user: userTemplate } = await loadTemplates();
  const systemPrompt = buildSystemPrompt(systemTemplate, bucket);

  let regenFeedback: string | undefined;
  let lastResult: GenerationResult | null = null;
  let lastRejected: RejectedEntry[] = [];
  let regenAttempts = 0;

  // 1 initial call + MAX_VALIDATION_REGEN regens = MAX_VALIDATION_REGEN + 1 total.
  // regenAttempts counts only the regens (not the initial call).
  for (let attempt = 0; attempt <= MAX_VALIDATION_REGEN; attempt++) {
    if (attempt > 0) regenAttempts++;
    const userPrompt = buildUserPrompt(userTemplate, args.brief, regenFeedback);
    lastResult = await generateHooks({
      brief: args.brief,
      bucket,
      systemPrompt,
      userPrompt,
      abortSignal: args.abortSignal,
    });
    lastRejected = findRejected(lastResult.hookSet, now);
    if (lastRejected.length === 0) {
      return {
        generation: lastResult,
        brandBucketVersionId: args.brandBucketVersionId,
        rejected: [],
        regenAttempts,
      };
    }
    regenFeedback = buildRegenFeedback(lastRejected);
  }

  // Exhausted regens — return the last attempt anyway. Caller decides whether
  // the partial set is good enough (e.g., 8 of 9 valid) or to fail the job.
  return {
    generation: lastResult!,
    brandBucketVersionId: args.brandBucketVersionId,
    rejected: lastRejected,
    regenAttempts,
  };
}

export { validateHook, MAX_VALIDATION_REGEN };
