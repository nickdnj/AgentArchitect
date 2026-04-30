// UXD §5 — Screen 3: Settings.
// Vendor key presence (never values), brand bucket file uploads, audit log link.
// TODO: full implementation per UXD §5.

export function Settings(): JSX.Element {
  return (
    <section className="page page-settings">
      <h1>Settings</h1>
      <p style={{ color: '#666' }}>API keys (presence only), brand bucket uploads, audit log — see docs/saltwater-ads/UXD.md §5.</p>
    </section>
  );
}
