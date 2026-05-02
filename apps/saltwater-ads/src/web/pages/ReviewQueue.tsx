// UXD §4 — Screen 2: Review Queue (master-detail inbox).
//
// This is the primary screen for Joe's day-to-day flow. After eng-review-3
// dogfood, the page does:
//   - Fetches /api/variants?status=ready_for_review on mount + every 8s
//   - Master-detail with status-pill chips + selection state
//   - Loads /api/variants/:id detail (brief, attempt history, asset paths)
//   - AI disclosure gate (H-2): hard-gate Approve via z.literal(true) on POST
//   - Disclosure resets on every variant change (UXD §4.3)
//   - Regen modal with feedback textarea
//   - Reject with confirmation
//
// Things still NOT done (bigger Sprint 2 surfaces):
//   - Compare-3-variants side-by-side toggle (UXD §4.5)
//   - Inline caption editor before approval (UXD §4.4)
//   - Signed video preview (needs /media + signed URL flow)

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
  pattern: string | null;
  sku_id: string | null;
}

interface VariantDetail {
  id: number;
  hook_text: string;
  sub_variant_label: string;
  sku_id: string | null;
  pattern: string | null;
  status: PillState;
  brief: { id: number; free_text: string; brand_bucket_version_id: number };
  attempt: {
    id: number;
    state: string;
    error: string | null;
    master_path: string | null;
    thumb_path: string | null;
    preview_url: string | null;
    thumb_url: string | null;
    ai_disclosure_layers: string[];
  } | null;
}

const POLL_INTERVAL_MS = 8000;

// Read the variant ID from #review/<id> if present. Lets the Generate page
// (and other surfaces) deep-link to a specific variant in the queue.
function selectedIdFromHash(): number | null {
  const m = window.location.hash.match(/^#review\/(\d+)/);
  return m ? Number(m[1]) : null;
}

export function ReviewQueue(): JSX.Element {
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(selectedIdFromHash());
  const [detail, setDetail] = useState<VariantDetail | null>(null);
  const [aiDisclosureChecked, setAiDisclosureChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [showRegen, setShowRegen] = useState(false);
  const [regenFeedback, setRegenFeedback] = useState('');

  // Fetch list — initial + poll
  useEffect(() => {
    let cancelled = false;
    async function load(): Promise<void> {
      try {
        const r = await api.variants.list('ready_for_review');
        if (cancelled) return;
        setVariants((r.variants as VariantRow[]) ?? []);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError((err as Error).message.replace(/^API \d+ [^:]+:\s*/, ''));
      }
    }
    load();
    const t = setInterval(load, POLL_INTERVAL_MS);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  // Reset disclosure gate on every variant change (UXD §4.3).
  useEffect(() => {
    setAiDisclosureChecked(false);
    setShowRegen(false);
    setRegenFeedback('');
    setActionMessage(null);
  }, [selectedId]);

  // Watch the hash for deep-link changes (Generate page → Recent Variants).
  useEffect(() => {
    const onHash = (): void => setSelectedId(selectedIdFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Fetch detail for the selected variant.
  useEffect(() => {
    if (selectedId === null) { setDetail(null); return; }
    let cancelled = false;
    api.variants.get(selectedId)
      .then((r) => {
        if (cancelled) return;
        setDetail((r.variant as VariantDetail) ?? null);
      })
      .catch(() => {
        if (cancelled) return;
        setDetail(null);
      });
    return () => { cancelled = true; };
  }, [selectedId]);

  // Prefer the list row (when present) but fall back to the detail fetch
  // when the user deep-linked to a variant not in the ready_for_review
  // list (e.g., still in queued / vendor_pending). Both shapes share the
  // fields the detail panel reads; we coerce to VariantRow for typing.
  const selected: VariantRow | null = variants.find((v) => v.id === selectedId)
    ?? (detail
      ? {
          id: detail.id,
          hook_text: detail.hook_text,
          sub_variant_label: detail.sub_variant_label,
          status: detail.status,
          pattern: detail.pattern,
          sku_id: detail.sku_id,
        }
      : null);
  const approveEnabled = selected
    ? canApprove({ aiDisclosureChecked, variantStatus: selected.status })
    : false;

  async function handleApprove(): Promise<void> {
    if (!selected || !approveEnabled) return;
    setBusy(true);
    setActionMessage(null);
    try {
      await api.variants.approve(selected.id, aiDisclosureChecked);
      setActionMessage('Approved. Download will be available shortly.');
    } catch (err) {
      setActionMessage(`Approve failed: ${(err as Error).message.replace(/^API \d+ [^:]+:\s*/, '')}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleReject(): Promise<void> {
    if (!selected) return;
    if (!confirm(`Reject variant #${selected.id}? This cannot be undone.`)) return;
    setBusy(true);
    setActionMessage(null);
    try {
      await api.variants.reject(selected.id);
      setActionMessage('Rejected.');
      setSelectedId(null);
    } catch (err) {
      setActionMessage(`Reject failed: ${(err as Error).message.replace(/^API \d+ [^:]+:\s*/, '')}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleRegen(): Promise<void> {
    if (!selected) return;
    if (regenFeedback.trim().length < 4) return;
    setBusy(true);
    setActionMessage(null);
    try {
      const r = await api.variants.regen(selected.id, regenFeedback.trim());
      const ids = (r.new_variant_ids ?? [r.new_variant_id]).filter(Boolean);
      setActionMessage(
        `3 new variants generating with your feedback (#${ids.join(', #')}). They'll appear in the list above when ready (~90s).`,
      );
      setShowRegen(false);
      setRegenFeedback('');
      // Reject the parent variant so it stops cluttering the queue —
      // the regen replaces it. We deliberately keep selectedId pointing at
      // the (now-rejected) parent so the success banner stays visible.
      // useEffect([selectedId]) clears actionMessage on selection change,
      // so changing selection here would wipe the confirmation Joe needs.
      try { await api.variants.reject(selected.id); } catch { /* swallow — not critical */ }
    } catch (err) {
      setActionMessage(`Regen failed: ${(err as Error).message.replace(/^API \d+ [^:]+:\s*/, '')}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="page page-review">
      <h1>Review Queue</h1>
      {error && <p className="error-banner">{error}</p>}
      {actionMessage && (
        <div
          className={actionMessage.toLowerCase().includes('failed') ? 'error-banner' : 'success-banner'}
          role="status"
          style={{ marginBottom: 16 }}
        >
          {actionMessage}
        </div>
      )}

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
              <code className="variant-hook" title={v.hook_text}>
                {v.hook_text.slice(0, 60)}{v.hook_text.length > 60 ? '…' : ''}
              </code>
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
                {selected.pattern && ` · ${selected.pattern}`}
                {selected.sku_id && ` · ${selected.sku_id}`}
              </p>

              {detail?.brief && (
                <div style={{ background: 'var(--sand-50)', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
                  <strong style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-3)' }}>Brief</strong>
                  <p style={{ margin: '4px 0 0' }}>{detail.brief.free_text}</p>
                </div>
              )}

              {detail?.attempt?.error && (
                <div className="error-banner" style={{ marginBottom: 16 }}>
                  <strong>Pipeline failure:</strong> {detail.attempt.error}
                </div>
              )}

              {detail?.attempt?.preview_url && (
                <figure className="variant-preview">
                  <video
                    key={detail.attempt.preview_url}
                    src={detail.attempt.preview_url}
                    poster={detail.attempt.thumb_url ?? undefined}
                    controls
                    playsInline
                    preload="metadata"
                  />
                  <figcaption>
                    Preview · 9:16 · {detail.attempt.ai_disclosure_layers.length > 0
                      ? `AI layers: ${detail.attempt.ai_disclosure_layers.join(', ')}`
                      : 'no AI layers'}
                  </figcaption>
                </figure>
              )}

              {detail?.attempt && !detail.attempt.preview_url && !detail.attempt.error && (
                <p className="variant-preview-pending">
                  Render not ready yet. Pipeline state: <code>{detail.attempt.state}</code>.
                </p>
              )}

              {detail?.attempt?.master_path && (
                <div style={{ marginBottom: 16, fontSize: 12, color: 'var(--ink-3)' }}>
                  Master: <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{detail.attempt.master_path}</code>
                </div>
              )}

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
                <button className="btn-regen" disabled={busy} onClick={() => setShowRegen(true)}>
                  Regen with feedback
                </button>
                <button className="btn-reject" disabled={busy} onClick={handleReject}>Reject</button>
              </div>


              {showRegen && (
                <div style={{ marginTop: 24, padding: 16, border: '1px solid var(--line)', borderRadius: 8 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 13 }}>
                    What should the regen do differently?
                  </label>
                  <textarea
                    value={regenFeedback}
                    onChange={(e) => setRegenFeedback(e.target.value)}
                    placeholder="e.g. lean harder into the dock-shorts comfort angle, drop the ocean breeze line"
                    style={{ width: '100%', minHeight: 80, padding: 10, fontFamily: 'var(--font-mono)', fontSize: 13, border: '1px solid var(--line)', borderRadius: 4 }}
                    disabled={busy}
                  />
                  <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                    <button
                      onClick={handleRegen}
                      disabled={busy || regenFeedback.trim().length < 4}
                      style={{ background: 'var(--navy)', color: 'white', border: 0, padding: '8px 14px', borderRadius: 4, cursor: 'pointer' }}
                    >
                      Send feedback
                    </button>
                    <button
                      onClick={() => { setShowRegen(false); setRegenFeedback(''); }}
                      disabled={busy}
                      style={{ background: 'none', border: 0, color: 'var(--ink-3)', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
