// UXD §4.3 — AI disclosure gate.
// Amber background, checkbox + label, Approve button must be disabled until
// the user actively checks this. Unchecked on every variant load — does NOT
// persist across variants or sessions. Joe must consciously acknowledge each
// time before downloading. PRD §7.5 enforces this server-side too as
// defense-in-depth (see routes/variants.ts ApproveBody validator).

export interface AiDisclosureGateProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  // When the parent variant is not ready_for_review, disable interaction.
  disabled?: boolean;
}

export function AiDisclosureGate({ checked, onChange, disabled }: AiDisclosureGateProps): JSX.Element {
  return (
    <div className="ai-disclosure" role="group" aria-labelledby="ai-disclosure-label">
      <label className="ai-disclosure-label" id="ai-disclosure-label">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          aria-describedby="ai-disclosure-help"
        />
        <span>
          AI-generated content flag. I confirm I will set Meta's AI-generated
          content flag during upload. <strong className="ai-disclosure-required">(Required before download.)</strong>
        </span>
      </label>
    </div>
  );
}
