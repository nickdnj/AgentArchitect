// UXD §4 — Screen 2: Review Queue (master-detail inbox).
// This pass wires the AI disclosure gate (H-2 from internal eng review v0.4):
// real component state, Approve button properly disabled until checkbox is
// actively checked, gate resets on every variant change, and the API call
// sends the actual checkbox value (not the previous hardcoded `true`).
//
// Full master-detail layout (compare mode, signed thumbnails, regen modal,
// caption editor, etc.) per UXD §4 is still TODO — this pass is scoped to
// closing the disclosure-gate finding.

import { useEffect, useState } from 'react';
import { api } from '../api.ts';
import { AiDisclosureGate } from '../components/AiDisclosureGate.tsx';
import { StatusPill, type PillState } from '../components/StatusPill.tsx';
import { canApprove } from '../lib/can-approve.ts';

interface VariantRow {
  id: number;
  hook_text: string;
  sub_variant_label: string;
  status: PillState;
}

export function ReviewQueue(): JSX.Element {
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [aiDisclosureChecked, setAiDisclosureChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // On mount, fetch the queue. /api/variants is still a 501 stub — the catch
  // path keeps the page usable until the real endpoint lands.
  useEffect(() => {
    let cancelled = false;
    api.variants
      .list('ready_for_review')
      .then((r) => {
        if (cancelled) return;
        setVariants((r.variants as VariantRow[]) ?? []);
      })
      .catch(() => {
        if (cancelled) return;
        setError('Variants endpoint not implemented yet (501).');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // UXD §4.3: checkbox is unchecked on every variant load — Joe must actively
  // re-check it for each variant. Resetting here enforces that.
  useEffect(() => {
    setAiDisclosureChecked(false);
  }, [selectedId]);

  const selected = variants.find((v) => v.id === selectedId) ?? null;
  const approveEnabled = selected
    ? canApprove({ aiDisclosureChecked, variantStatus: selected.status })
    : false;

  async function handleApprove(): Promise<void> {
    if (!selected) return;
    if (!approveEnabled) return; // belt-and-suspenders; disabled button shouldn't fire
    setBusy(true);
    try {
      await api.variants.approve(selected.id, aiDisclosureChecked);
    } finally {
      setBusy(false);
    }
  }

  async function handleReject(): Promise<void> {
    if (!selected) return;
    setBusy(true);
    try {
      await api.variants.reject(selected.id);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="page page-review">
      <h1>Review Queue</h1>
      {error && <p className="error-banner">{error}</p>}

      <div className="review-layout">
        <aside className="review-list">
          <header className="review-list-header">Pending review · {variants.length}</header>
          {variants.length === 0 && !error && <p className="empty">No variants in the queue.</p>}
          {variants.map((v) => (
            <article
              key={v.id}
              className={`variant-row ${selectedId === v.id ? 'is-selected' : ''}`}
              onClick={() => setSelectedId(v.id)}
            >
              <code className="variant-hook">{v.hook_text.slice(0, 40)}{v.hook_text.length > 40 ? '…' : ''}</code>
              <StatusPill state={v.status} />
            </article>
          ))}
        </aside>

        <div className="review-detail">
          {!selected && <p className="empty">Select a variant from the list.</p>}
          {selected && (
            <>
              <h2 className="variant-title">{selected.hook_text}</h2>
              <p className="variant-meta">
                <StatusPill state={selected.status} /> · {selected.sub_variant_label}
              </p>

              <AiDisclosureGate
                checked={aiDisclosureChecked}
                onChange={setAiDisclosureChecked}
                disabled={selected.status !== 'ready_for_review' || busy}
              />

              <div className="review-actions">
                <button
                  className="btn-approve"
                  disabled={!approveEnabled || busy}
                  aria-disabled={!approveEnabled || busy}
                  onClick={handleApprove}
                >
                  Approve <span className="red-accent">→</span> Download for Meta
                </button>
                <button className="btn-regen" disabled={busy}>Regen with feedback</button>
                <button className="btn-reject" disabled={busy} onClick={handleReject}>Reject</button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
