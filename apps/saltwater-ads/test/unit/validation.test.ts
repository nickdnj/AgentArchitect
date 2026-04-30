import { test, expect, describe } from 'bun:test';
import { validateHook } from '@lib/services/validation.ts';

describe('validation', () => {
  test('accepts a clean hook', () => {
    expect(validateHook('Built for the boat. Comfortable enough for dinner.')).toBeNull();
  });

  test('rejects too long', () => {
    expect(validateHook('x'.repeat(141))?.rule).toBe('too_long');
  });

  test('rejects OUT vocabulary', () => {
    expect(validateHook('This shirt is cheap and comfortable.')?.rule).toBe('out_vocab');
    expect(validateHook('Hypebeast vibes.')?.rule).toBe('out_vocab');
  });

  test('rejects anti-pattern phrase', () => {
    expect(validateHook('Elevate your wardrobe with our coastal pieces.')?.rule).toBe('anti_pattern');
  });

  test('rejects coastal comfort without TM', () => {
    expect(validateHook('Real coastal comfort, every day.')?.rule).toBe('coastal_comfort_verbatim');
  });

  test('accepts Coastal Comfort™ verbatim', () => {
    expect(validateHook('Coastal Comfort™ — every day.')).toBeNull();
  });

  test('blocks Veronica wife reference before wedding date', () => {
    const before = new Date('2026-04-30');
    expect(validateHook('Veronica is my wife — and she made me wear this.', before)?.rule).toBe('veronica_wife_gate');
  });

  test('allows Veronica wife reference on or after wedding date', () => {
    const after = new Date('2026-11-02');
    expect(validateHook('Veronica is my wife — and she made me wear this.', after)).toBeNull();
  });
});
