import { test, expect, describe } from 'bun:test';
import { validateHook, isValidHook } from '@lib/services/validation.ts';

describe('validation — single-rule cases', () => {
  test('accepts a clean hook (empty failures array)', () => {
    expect(validateHook('Built for the boat. Comfortable enough for dinner.')).toEqual([]);
    expect(isValidHook('Built for the boat. Comfortable enough for dinner.')).toBe(true);
  });

  test('rejects too long', () => {
    const failures = validateHook('x'.repeat(141));
    expect(failures.length).toBe(1);
    expect(failures[0].rule).toBe('too_long');
  });

  test('rejects OUT vocabulary', () => {
    const failures1 = validateHook('This shirt is cheap and comfortable.');
    expect(failures1.some((f) => f.rule === 'out_vocab' && f.detail === 'cheap')).toBe(true);
    const failures2 = validateHook('Hypebeast vibes.');
    expect(failures2.some((f) => f.rule === 'out_vocab' && f.detail === 'hypebeast')).toBe(true);
  });

  test('rejects anti-pattern phrase', () => {
    const failures = validateHook('Elevate your wardrobe with our coastal pieces.');
    expect(failures.some((f) => f.rule === 'anti_pattern')).toBe(true);
  });

  test('rejects coastal comfort without TM', () => {
    const failures = validateHook('Real coastal comfort, every day.');
    expect(failures.some((f) => f.rule === 'coastal_comfort_verbatim')).toBe(true);
  });

  test('accepts Coastal Comfort™ verbatim', () => {
    expect(validateHook('Coastal Comfort™ — every day.')).toEqual([]);
  });

  test('blocks Veronica wife reference before wedding date', () => {
    const before = new Date('2026-04-30');
    const failures = validateHook('Veronica is my wife — and she made me wear this.', before);
    expect(failures.some((f) => f.rule === 'veronica_wife_gate')).toBe(true);
  });

  test('allows Veronica wife reference on or after wedding date', () => {
    const after = new Date('2026-11-02');
    expect(validateHook('Veronica is my wife — and she made me wear this.', after)).toEqual([]);
  });
});

describe('validation — multiple-rule cases (CQ2 fix)', () => {
  test('hook violating BOTH too_long AND out_vocab returns BOTH failures', () => {
    const hook = 'This is a cheap and tacky shirt. ' + 'x'.repeat(120);
    const failures = validateHook(hook);
    const rules = failures.map((f) => f.rule);
    expect(rules).toContain('too_long');
    expect(rules).toContain('out_vocab');
    expect(failures.length).toBeGreaterThanOrEqual(2);
  });

  test('hook with multiple out_vocab words returns one failure per word', () => {
    const hook = 'cheap tacky disposable polo for the modern man';
    const failures = validateHook(hook);
    const outVocabFailures = failures.filter((f) => f.rule === 'out_vocab');
    expect(outVocabFailures.length).toBe(3);
    expect(outVocabFailures.map((f) => f.detail).sort()).toEqual(['cheap', 'disposable', 'tacky']);
  });

  test('regen-feedback shape: every failure carries enough detail to fix', () => {
    // The Hook Generator's regen prompt feeds these back to the model — each
    // failure must be self-describing without needing the original hook text.
    const failures = validateHook('Elevate your wardrobe — discover the difference of cheap coastal comfort.');
    expect(failures.length).toBeGreaterThanOrEqual(3); // anti_pattern x2 + out_vocab + coastal_comfort
    for (const f of failures) {
      expect(f.rule).toBeTruthy();
      expect(f.detail).toBeTruthy();
      expect(f.detail.length).toBeGreaterThan(0);
    }
  });

  test('isValidHook is the negation convenience', () => {
    expect(isValidHook('Built for the boat.')).toBe(true);
    expect(isValidHook('cheap tacky shirt')).toBe(false);
  });
});
