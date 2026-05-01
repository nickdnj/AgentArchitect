// PRD §6.1.2 F-HG-6 — validation pass.
// Reject hooks that violate brand bucket rules. Trigger regen if any variant fails.
//
// CQ2 (eng-review-2): validateHook now returns ALL failures instead of the
// first one. The regen prompt needs to see every rule violated so it can fix
// them in a single pass — otherwise a hook that's both too long AND uses
// out-vocab gets reported as 'too_long', the regen fixes the length, and the
// out-vocab violation surfaces only on the second regen. Wasted vendor calls.

const OUT_VOCAB = new Set([
  'cheap', 'tacky', 'hypebeast', 'gimmick', 'fratty', 'disposable', 'corny', 'stiff', 'stuffy',
]);

const ANTI_PATTERNS = [
  /\belevate your wardrobe\b/i,
  /\bdiscover the difference\b/i,
  /\bcrafted for the modern man\b/i,
];

const COASTAL_COMFORT_RX = /coastal\s*comfort/i;
const COASTAL_COMFORT_VERBATIM = 'Coastal Comfort™';   // ™ U+2122

// Veronica wife-gate: blocks "wife" + "Veronica" co-occurrence until the
// wedding (Nov 2026). Exact date TBC with Joe — using 2026-11-01 as a safe
// upper bound. Reset to the actual ceremony date once known.
const VERONICA_WIFE_GATE_DATE = new Date('2026-11-01T00:00:00Z');

export type ValidationRule =
  | 'too_long'
  | 'out_vocab'
  | 'anti_pattern'
  | 'coastal_comfort_verbatim'
  | 'veronica_wife_gate';

export interface ValidationFailure {
  rule: ValidationRule;
  detail: string;
}

/**
 * Returns every rule the hook violates. Empty array = valid.
 *
 * Caller (Hook Generator regen path) feeds every failure back to the model
 * so a single regen can address all of them.
 */
export function validateHook(hookText: string, now: Date = new Date()): ValidationFailure[] {
  const failures: ValidationFailure[] = [];

  if (hookText.length > 140) {
    failures.push({ rule: 'too_long', detail: `${hookText.length} > 140 chars` });
  }

  const lower = hookText.toLowerCase();
  for (const word of OUT_VOCAB) {
    if (new RegExp(`\\b${word}\\b`, 'i').test(lower)) {
      failures.push({ rule: 'out_vocab', detail: word });
    }
  }

  for (const rx of ANTI_PATTERNS) {
    if (rx.test(hookText)) {
      failures.push({ rule: 'anti_pattern', detail: rx.source });
    }
  }

  if (COASTAL_COMFORT_RX.test(hookText) && !hookText.includes(COASTAL_COMFORT_VERBATIM)) {
    failures.push({
      rule: 'coastal_comfort_verbatim',
      detail: 'must use Coastal Comfort™ verbatim with ™',
    });
  }

  if (/\bwife\b/i.test(hookText) && /\bveronica\b/i.test(hookText) && now < VERONICA_WIFE_GATE_DATE) {
    failures.push({
      rule: 'veronica_wife_gate',
      detail: `wife reference allowed on or after ${VERONICA_WIFE_GATE_DATE.toISOString().slice(0, 10)}`,
    });
  }

  return failures;
}

/** Convenience: true if the hook has zero violations. */
export function isValidHook(hookText: string, now: Date = new Date()): boolean {
  return validateHook(hookText, now).length === 0;
}
