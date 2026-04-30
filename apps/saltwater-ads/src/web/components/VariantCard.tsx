// UXD §4 — variant card (used in Review Queue list + Compare mode).

import { StatusPill, type PillState } from './StatusPill.tsx';

export interface VariantCardProps {
  variant: {
    id: number;
    hook_text: string;
    sub_variant_label: string;
    status: PillState;
    thumb_url?: string;
  };
  selected?: boolean;
  onSelect?: (id: number) => void;
}

export function VariantCard({ variant, selected, onSelect }: VariantCardProps): JSX.Element {
  return (
    <article
      className={`variant-card ${selected ? 'is-selected' : ''}`}
      onClick={() => onSelect?.(variant.id)}
    >
      {variant.thumb_url && <img src={variant.thumb_url} alt="" className="variant-thumb" />}
      <div className="variant-meta">
        <code className="variant-hook">{variant.hook_text.slice(0, 40)}{variant.hook_text.length > 40 ? '…' : ''}</code>
        <StatusPill state={variant.status} />
      </div>
    </article>
  );
}
