// PRD §6.1.2 F-HG-6 — validation pass.
// Reject hooks that violate brand bucket rules. Trigger regen if any variant fails.

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

const VERONICA_WIFE_GATE_DATE = new Date('2026-11-01T00:00:00Z');

export interface ValidationFailure {
  rule: 'out_vocab' | 'anti_pattern' | 'coastal_comfort_verbatim' | 'veronica_wife_gate' | 'too_long';
  detail: string;
}

export function validateHook(hookText: string, now: Date = new Date()): ValidationFailure | null {
  if (hookText.length > 140) {
    return { rule: 'too_long', detail: `${hookText.length} > 140 chars` };
  }
  const lower = hookText.toLowerCase();
  for (const word of OUT_VOCAB) {
    if (new RegExp(`\\b${word}\\b`, 'i').test(lower)) {
      return { rule: 'out_vocab', detail: word };
    }
  }
  for (const rx of ANTI_PATTERNS) {
    if (rx.test(hookText)) {
      return { rule: 'anti_pattern', detail: rx.source };
    }
  }
  // Coastal Comfort™ enforcement
  if (COASTAL_COMFORT_RX.test(hookText) && !hookText.includes(COASTAL_COMFORT_VERBATIM)) {
    return { rule: 'coastal_comfort_verbatim', detail: 'must use Coastal Comfort™ verbatim with ™' };
  }
  // Veronica wife-rule date gate
  if (/\bwife\b/i.test(hookText) && /\bveronica\b/i.test(hookText) && now < VERONICA_WIFE_GATE_DATE) {
    return { rule: 'veronica_wife_gate', detail: `wife reference allowed on or after ${VERONICA_WIFE_GATE_DATE.toISOString().slice(0,10)}` };
  }
  return null;
}
