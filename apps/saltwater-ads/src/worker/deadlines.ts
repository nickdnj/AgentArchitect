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
