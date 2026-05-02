// UXD §3 — Screen 1: Generate.
//   Brief textarea (JetBrains Mono, 400-char cap)
//   Pattern chips (founder | problem_solution | limited_drop)
//   SKU dropdown (sourced from products.json via brand bucket)
//   Audience tag (free text)
//   Generate CTA → POST /api/briefs → success banner with link to Review Queue
//
// Right sidebar: "Top hooks this week" — placeholder for now (the per-ad
// rollup table is wired but we'd need a /api/analytics endpoint to surface
// it. Next pass.)
//
// Bottom strip: status pills for the 5 most recent variants. Updates on a
// 5-second poll while the user has the page open.

import { useEffect, useState } from 'react';
import { api } from '../api.ts';
import { StatusPill, type PillState } from '../components/StatusPill.tsx';

type Pattern = 'founder' | 'problem_solution' | 'limited_drop';

const PATTERNS: { id: Pattern; label: string; hint: string }[] = [
  { id: 'founder', label: 'Founder Story', hint: 'Joe + Buddy, family business, why we made it.' },
  { id: 'problem_solution', label: 'Problem / Solution', hint: 'Specific pain point, then the fix.' },
  { id: 'limited_drop', label: 'Limited Drop', hint: 'Scarcity + new SKU launch.' },
];

// Sprint 1 SKU list — should come from /api/skus once that's wired. Hardcoded
// for now from the products.json that the brand bucket already exposes.
const SKUS = [
  { id: 'polo-navy', label: 'Performance Polo — Navy' },
  { id: 'polo-white', label: 'Performance Polo — White' },
  { id: 'tee-classic', label: 'Classic Tee — Heather' },
  { id: 'shorts-dock', label: 'Dock Shorts — Stone' },
  { id: 'hat-trucker', label: 'Trucker Hat — Navy/White' },
];

// Audience archetypes seeded from customer.md "Older Joe DeMarco" profile +
// patterns Joe identified. Combobox: surfaced as a datalist dropdown for
// consistency, but the input still accepts free-text so Joe can introduce
// new micro-segments without a code change. Sprint 2: pull from /api/audiences.
const AUDIENCES = [
  'older-joe',
  'coastal-dad',
  'weekend-warrior',
  'first-time-buyer',
  'irish-flag-loyalist',
  'dad-with-boat',
  'memorial-day-buyer',
];

const MAX_BRIEF_LEN = 400;

interface RecentVariant {
  id: number;
  hook_text: string;
  sub_variant_label: string;
  status: PillState;
}

export function Generate(): JSX.Element {
  const [freeText, setFreeText] = useState('');
  const [pattern, setPattern] = useState<Pattern>('founder');
  const [skuId, setSkuId] = useState<string>('polo-navy');
  const [audienceTag, setAudienceTag] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ briefId: number; variantIds: number[] } | null>(null);
  const [recent, setRecent] = useState<RecentVariant[]>([]);

  // Poll recent variants every 5s.
  useEffect(() => {
    let cancelled = false;
    async function load(): Promise<void> {
      try {
        const r = await api.variants.list();
        if (cancelled) return;
        setRecent(((r.variants as RecentVariant[]) ?? []).slice(-5).reverse());
      } catch {
        // silent — ok if endpoint is briefly unavailable
      }
    }
    load();
    const t = setInterval(load, 5000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  const charCount = freeText.length;
  const overLimit = charCount > MAX_BRIEF_LEN;
  const canSubmit = freeText.trim().length > 0 && !overLimit && !submitting;

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const r = await api.briefs.create({
        free_text: freeText.trim(),
        pattern,
        sku_id: skuId || null,
        audience_tag: audienceTag.trim() || null,
      });
      setSuccess({ briefId: r.brief_id, variantIds: r.variant_ids });
      setFreeText('');
      setAudienceTag('');
      // Refresh recent list immediately
      const updated = await api.variants.list();
      setRecent(((updated.variants as RecentVariant[]) ?? []).slice(-5).reverse());
    } catch (err) {
      const msg = (err as Error).message;
      const cleaned = msg.replace(/^API \d+ [^:]+:\s*/, '');
      setError(cleaned);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page page-generate">
      <h1>Generate</h1>

      <div className="generate-layout">
        <form className="brief-form" onSubmit={handleSubmit}>
          <label htmlFor="brief-text">
            Brief
            <span className={`char-count ${overLimit ? 'over' : ''}`}>{charCount} / {MAX_BRIEF_LEN}</span>
          </label>
          <textarea
            id="brief-text"
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            placeholder="Spring drop teaser for the navy polo — focus on coastal comfort, weekend on the water, founder voice"
            disabled={submitting}
            maxLength={MAX_BRIEF_LEN}
          />

          <label>Pattern</label>
          <div className="pattern-chips">
            {PATTERNS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`pattern-chip ${pattern === p.id ? 'is-selected' : ''}`}
                onClick={() => setPattern(p.id)}
                title={p.hint}
                disabled={submitting}
              >
                {p.label}
              </button>
            ))}
          </div>

          <label htmlFor="sku">SKU</label>
          <select id="sku" value={skuId} onChange={(e) => setSkuId(e.target.value)} disabled={submitting}>
            <option value="">— No SKU (hook only, no Fashn try-on layer) —</option>
            {SKUS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>

          <label htmlFor="audience">Audience tag (optional)</label>
          <input
            id="audience"
            type="text"
            list="audience-options"
            value={audienceTag}
            onChange={(e) => setAudienceTag(e.target.value)}
            placeholder="older-joe, coastal-dad, weekend-warrior"
            disabled={submitting}
            autoComplete="off"
          />
          <datalist id="audience-options">
            {AUDIENCES.map((a) => <option key={a} value={a} />)}
          </datalist>

          <button type="submit" disabled={!canSubmit}>
            {submitting ? 'Generating…' : 'Generate'}
          </button>

          {error && <p className="error-banner" style={{ marginTop: 16 }}>{error}</p>}

          {success && (
            <div className="generate-success">
              <strong>Brief #{success.briefId} queued.</strong> Three variants ({success.variantIds.join(', ')})
              are in the pipeline. Real generation takes 5–15 minutes once vendor keys are wired.
              {' '}<a href="#review" onClick={(e) => { e.preventDefault(); window.location.hash = ''; }}>
                View in Review Queue →
              </a>
            </div>
          )}
        </form>

        <aside className="generate-sidebar">
          <h3>Top hooks this week</h3>
          <p style={{ fontSize: 12, color: 'var(--ink-3)' }}>
            Per-ad revenue from Triple Whale. Updates after every TW sync.
          </p>
          <div className="sidebar-card">
            <div className="ad-id">Sync to populate</div>
            <div className="metric">— —</div>
          </div>
          <p style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 16 }}>
            Run Settings → Triple Whale Sync to seed this panel with last-30-day winners.
          </p>
        </aside>
      </div>

      <section className="bottom-strip">
        <h3>Recent variants ({recent.length})</h3>
        {recent.length === 0 && <p className="empty" style={{ padding: 0 }}>None yet — generate a brief above.</p>}
        <div className="bottom-strip-rows">
          {recent.map((v) => (
            <button
              key={v.id}
              type="button"
              className="bottom-strip-row"
              onClick={() => {
                // Setting hash navigates the SPA: App.tsx watches hashchange
                // and switches to review; ReviewQueue watches it too and
                // selects the variant.
                window.location.hash = `review/${v.id}`;
              }}
              title="Open in Review Queue"
            >
              <span className="b-label">#{v.id} {v.sub_variant_label}</span>
              <span className="b-text">{v.hook_text || '(generating…)'}</span>
              <StatusPill state={v.status} />
            </button>
          ))}
        </div>
      </section>
    </section>
  );
}
