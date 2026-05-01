// SAD §4 — deadline enforcement.
// Per-vendor + total job deadlines via AbortController.

export const VENDOR_TIMEOUTS_MS = {
  heygen: 5 * 60 * 1000,        // 5 min
  fashn: 8 * 60 * 1000,         // 8 min
  ffmpeg: 2 * 60 * 1000,        // 2 min
  totalJob: 15 * 60 * 1000,     // 15 min hard ceiling (PRD §7.2)
} as const;

export function withDeadline(ms: number): { signal: AbortSignal; cancel: () => void } {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort('timeout'), ms);
  return { signal: ctrl.signal, cancel: () => clearTimeout(t) };
}

/**
 * Combine multiple AbortSignals into one — fires when any input fires.
 * AbortSignal.any() is Node 20.3+ and Bun-native. Manual fallback otherwise.
 *
 * Single source of truth: pipeline.ts, render-orchestrator.ts, and assembly.ts
 * all combine signals from caller + per-step deadlines. Don't duplicate.
 */
export function combineSignals(...signals: AbortSignal[]): AbortSignal {
  const anyFn = (AbortSignal as unknown as { any?: (s: AbortSignal[]) => AbortSignal }).any;
  if (typeof anyFn === 'function') return anyFn(signals);
  const ctrl = new AbortController();
  for (const s of signals) {
    if (s.aborted) {
      ctrl.abort(s.reason);
      return ctrl.signal;
    }
    s.addEventListener('abort', () => ctrl.abort(s.reason), { once: true });
  }
  return ctrl.signal;
}
