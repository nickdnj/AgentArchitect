import type { ClaimedJob } from './tick.ts';
// SAD §3 + §4 — runs one render_attempt through the state machine.
//
//   queued
//   → hooks_generating  (Hook Generator)
//   → hooks_ready
//   → vendor_pending    (HeyGen + Fashn parallel with per-vendor timeouts)
//   → partial           (one or both vendors complete)
//   → assembling        (FFmpeg)
//   → ready_for_review

export async function runPipeline(_job: ClaimedJob): Promise<void> {
  // TODO:
  //   1. If state=queued → call hook-generator.runHookGenerator → transition hooks_ready
  //   2. If state=hooks_ready → kick render-orchestrator.runRender (Promise.all w/ AbortController) → partial
  //   3. If state=partial → assembly.assemble → ready_for_review
  //   4. Each transition is a SQLite BEGIN IMMEDIATE with state precondition check
  //   5. Vendor timeouts enforced by AbortController per SAD §4
  //   6. On error → failed_recoverable; after 24h with no operator action → failed_terminal
  throw new Error('not_implemented: pipeline.runPipeline');
}
