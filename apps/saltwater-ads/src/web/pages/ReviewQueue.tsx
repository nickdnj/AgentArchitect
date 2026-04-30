// UXD §4 — Screen 2: Review Queue (master-detail inbox).
// Left list (Gmail-style) + right detail pane with video preview, AI disclosure hard gate, compare-mode toggle.
// TODO: full implementation per UXD §4.

export function ReviewQueue(): JSX.Element {
  return (
    <section className="page page-review">
      <h1>Review Queue</h1>
      <p style={{ color: '#666' }}>Master-detail inbox + compare-mode toggle — see docs/saltwater-ads/UXD.md §4.</p>
    </section>
  );
}
