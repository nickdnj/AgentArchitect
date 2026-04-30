// Shared LLM types for the Hook Generator pipeline.

export type Pattern = 'founder' | 'problem_solution' | 'limited_drop';

export interface BriefShape {
  free_text: string;
  sku_id?: string | null;
  pattern?: Pattern | null;
  audience_tag?: string | null;
  season?: string | null;
}

export interface Hook {
  label: 'V1' | 'V2' | 'V3';
  pattern: Pattern;
  hook_text: string;       // ≤140 chars, lip-sync-ready
}

export interface HookSet {
  variants: Hook[][];      // 3 main angles × 3 sub-variants
}

export interface BrandBucketSnapshot {
  voice: string;
  customer: string;
  winning_patterns: string;
  products: string;        // raw JSON text
  hooks_winners: string[]; // JSONL lines (last 20)
  hooks_losers: string[];  // JSONL lines (last 5)
  versionId: number;       // FK into brand_bucket_version
}

export interface GenerationResult {
  hookSet: HookSet;
  promptHash: string;
  model: string;
  tokensInput: number;
  tokensOutput: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
}
