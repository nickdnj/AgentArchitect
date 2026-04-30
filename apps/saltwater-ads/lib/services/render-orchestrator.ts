// PRD §6.1.4 — Render Orchestrator.
// Calls HeyGen Photo Avatar + Fashn try-on in parallel with per-vendor timeout budgets.
// Idempotency cache keyed by (hook_text, avatar_id) avoids re-billing.

export interface RenderArgs {
  variantId: number;
  hookText: string;
  skuId: string | null;
  attemptNumber: number;
  abortSignal: AbortSignal;   // SAD §4 — per-vendor AbortController
}

export interface RenderResult {
  heygenClipId: string | null;
  fashnClipId: string | null;
  brollId: string | null;
  costCreditsTotal: number;
  partial: boolean;
  errors: string[];
}

export async function runRender(_args: RenderArgs): Promise<RenderResult> {
  // TODO:
  //   1. HeyGen + Fashn calls in Promise.all with per-vendor AbortController timeouts
  //      (HeyGen 5min, Fashn 8min)
  //   2. On HeyGen success → poll until 'completed', download to media/renders/.../heygen.mp4
  //   3. On Fashn success → animate, download to media/renders/.../fashn.mp4
  //   4. Pick B-roll clip from b_roll_clip table (season + tag match)
  //   5. Return RenderResult; degrade if either vendor times out (partial=true)
  throw new Error('not_implemented: render-orchestrator.runRender');
}
