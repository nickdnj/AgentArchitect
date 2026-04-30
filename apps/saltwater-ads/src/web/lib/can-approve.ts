// Pure gate function for the Approve button — extracted so it can be unit
// tested without rendering React. Called by ReviewQueue.tsx; the component's
// `disabled` prop reads this directly.
//
// The contract: Approve is enabled IFF the variant is ready_for_review AND
// the user has actively checked the AI disclosure gate this session for this
// variant load. PRD §7.5 hard gate — both conditions must hold.

import type { PillState } from '../components/StatusPill.tsx';

export function canApprove(opts: {
  aiDisclosureChecked: boolean;
  variantStatus: PillState | undefined;
}): boolean {
  if (opts.variantStatus !== 'ready_for_review') return false;
  if (!opts.aiDisclosureChecked) return false;
  return true;
}
