// UXD §3 + §4 — every job state surfaces in UI.
// TODO: full color + microcopy + click-deep-link mapping per UXD.

export type PillState =
  | 'queued'
  | 'hooks_generating'
  | 'hooks_ready'
  | 'vendor_pending'
  | 'partial'
  | 'assembling'
  | 'ready_for_review'
  | 'approved'
  | 'rejected'
  | 'failed_recoverable'
  | 'failed_terminal';

export function StatusPill({ state }: { state: PillState }): JSX.Element {
  return <span className={`pill pill-${state}`}>{state.replace(/_/g, ' ')}</span>;
}
