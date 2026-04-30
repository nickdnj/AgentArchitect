// UXD §3 — Screen 1: Generate.
// Brief textarea (JetBrains Mono, 400-char cap) + pattern chips + SKU + audience + Generate CTA.
// Right sidebar: "Top hooks this week". Bottom strip: status pills.
// TODO: full implementation per UXD §3 + §10 wait UX patterns.

export function Generate(): JSX.Element {
  return (
    <section className="page page-generate">
      <h1>Generate</h1>
      <p style={{ color: '#666' }}>BriefForm + sidebar + bottom strip — see docs/saltwater-ads/UXD.md §3.</p>
    </section>
  );
}
