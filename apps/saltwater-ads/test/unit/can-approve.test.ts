import { describe, test, expect } from 'bun:test';
import { canApprove } from '../../src/web/lib/can-approve.ts';

describe('H-2 canApprove gate logic', () => {
  test('Approve disabled when checkbox unchecked, even if status ready', () => {
    expect(canApprove({ aiDisclosureChecked: false, variantStatus: 'ready_for_review' })).toBe(false);
  });

  test('Approve disabled when checkbox checked but status NOT ready', () => {
    expect(canApprove({ aiDisclosureChecked: true, variantStatus: 'assembling' })).toBe(false);
    expect(canApprove({ aiDisclosureChecked: true, variantStatus: 'rejected' })).toBe(false);
    expect(canApprove({ aiDisclosureChecked: true, variantStatus: 'failed_terminal' })).toBe(false);
    expect(canApprove({ aiDisclosureChecked: true, variantStatus: 'queued' })).toBe(false);
  });

  test('Approve disabled when both unchecked AND status not ready', () => {
    expect(canApprove({ aiDisclosureChecked: false, variantStatus: 'vendor_pending' })).toBe(false);
  });

  test('Approve disabled when status undefined (no variant selected)', () => {
    expect(canApprove({ aiDisclosureChecked: true, variantStatus: undefined })).toBe(false);
  });

  test('Approve enabled ONLY when checkbox checked AND status ready_for_review', () => {
    expect(canApprove({ aiDisclosureChecked: true, variantStatus: 'ready_for_review' })).toBe(true);
  });

  test('Approve disabled for `approved` status (re-download requires re-acknowledge per UXD §4.3)', () => {
    // UXD §4.3: "Disclosure gate is still present and unchecked (Joe must
    // re-acknowledge for re-download)". So `approved` status alone does NOT
    // re-enable Approve — the gate must be re-checked. canApprove guards the
    // primary Approve button; re-download flows through a separate path.
    expect(canApprove({ aiDisclosureChecked: true, variantStatus: 'approved' })).toBe(false);
  });
});
