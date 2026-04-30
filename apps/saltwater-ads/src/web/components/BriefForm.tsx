// UXD §3 — brief form on Generate screen.
// TODO: pattern chips, SKU picker, audience tag, Generate CTA, loading + error states.

export function BriefForm(): JSX.Element {
  return (
    <form className="brief-form">
      <textarea placeholder="What ad do you want to make?" maxLength={400} />
      <button type="submit">Generate 3 Variants →</button>
    </form>
  );
}
