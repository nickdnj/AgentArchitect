// UXD §5 — Screen 3: Settings.
// Vendor key presence (never values), update form, TW sync trigger, audit
// log link. Per SAD §6.1 we display BOOLEAN presence only — never the key
// values themselves. Updates POST to /api/settings/secrets which validates
// (TW gets a live identity check) before persisting to data/secrets.env.

import { useEffect, useState } from 'react';
import { api } from '../api.ts';

interface SecretField {
  key: string;
  label: string;
  hint: string;
}

const FIELDS: SecretField[] = [
  { key: 'ANTHROPIC_API_KEY', label: 'Anthropic (Claude)', hint: 'sk-ant-... — Hook generation. Required.' },
  { key: 'HEYGEN_API_KEY', label: 'HeyGen', hint: 'For Joe-avatar founder hook clips.' },
  { key: 'FASHN_API_KEY', label: 'Fashn.ai', hint: 'For try-on showcase clips.' },
  { key: 'TRIPLEWHALE_API_KEY', label: 'Triple Whale', hint: 'Validated against /users/api-keys/me on save.' },
  { key: 'RESEND_API_KEY', label: 'Resend (email)', hint: 're_... — Magic-link sign-in delivery.' },
];

export function Settings(): JSX.Element {
  const [presence, setPresence] = useState<Record<string, boolean>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successes, setSuccesses] = useState<Record<string, boolean>>({});
  const [twSync, setTwSync] = useState<{
    state: 'idle' | 'syncing' | 'success' | 'error';
    message?: string;
    result?: {
      windowStart: string;
      windowEnd: string;
      metricsUpserted: number;
      ordersUpserted: number;
      adRowsUpserted: number;
    };
  }>({ state: 'idle' });

  useEffect(() => {
    loadPresence();
  }, []);

  async function loadPresence(): Promise<void> {
    try {
      const r = await api.settings.get();
      setPresence(r.secrets);
    } catch {
      // Settings panel still usable without presence map
    }
  }

  async function handleSave(key: string): Promise<void> {
    const value = drafts[key]?.trim();
    if (!value) return;
    setSaving(key);
    setErrors((e) => ({ ...e, [key]: '' }));
    setSuccesses((s) => ({ ...s, [key]: false }));
    try {
      await api.settings.updateSecret(key, value);
      setDrafts((d) => ({ ...d, [key]: '' }));
      setSuccesses((s) => ({ ...s, [key]: true }));
      await loadPresence();
      // Auto-clear the success badge after 4s
      setTimeout(() => setSuccesses((s) => ({ ...s, [key]: false })), 4000);
    } catch (err) {
      const msg = (err as Error).message;
      // Strip the "API 400 /path: " prefix from request() errors
      const cleaned = msg.replace(/^API \d+ [^:]+:\s*/, '');
      try {
        const parsed = JSON.parse(cleaned) as { error?: string; message?: string };
        setErrors((e) => ({ ...e, [key]: parsed.message ?? parsed.error ?? cleaned }));
      } catch {
        setErrors((e) => ({ ...e, [key]: cleaned }));
      }
    } finally {
      setSaving(null);
    }
  }

  async function handleTwSync(): Promise<void> {
    setTwSync({ state: 'syncing' });
    try {
      const r = await api.settings.twSync();
      setTwSync({ state: 'success', result: r });
    } catch (err) {
      const msg = (err as Error).message;
      const cleaned = msg.replace(/^API \d+ [^:]+:\s*/, '');
      setTwSync({ state: 'error', message: cleaned });
    }
  }

  const presenceKey = (k: string): keyof typeof presence => {
    // backend presence map uses short keys (anthropic, heygen, fashn, triplewhale, resend)
    if (k === 'ANTHROPIC_API_KEY') return 'anthropic';
    if (k === 'HEYGEN_API_KEY') return 'heygen';
    if (k === 'FASHN_API_KEY') return 'fashn';
    if (k === 'TRIPLEWHALE_API_KEY') return 'triplewhale';
    if (k === 'RESEND_API_KEY') return 'resend';
    return k as keyof typeof presence;
  };

  return (
    <section className="page page-settings">
      <h1>Settings</h1>

      <section className="settings-section">
        <h2>Vendor API Keys</h2>
        <p className="settings-hint">
          Keys never leave the server. UI shows presence only (configured / not configured).
          Saving a key writes it to <code>data/secrets.env</code> with mode 0600 and
          updates <code>process.env</code> in place — no restart needed.
        </p>

        <div className="settings-keys">
          {FIELDS.map((f) => {
            const isSet = presence[presenceKey(f.key)];
            const isSaving = saving === f.key;
            const draft = drafts[f.key] ?? '';
            return (
              <div key={f.key} className="settings-key-row">
                <div className="settings-key-meta">
                  <label htmlFor={f.key}>
                    <span className="settings-key-label">{f.label}</span>
                    <span className={`settings-presence ${isSet ? 'is-set' : 'is-unset'}`}>
                      {isSet ? '✓ configured' : '✗ not configured'}
                    </span>
                  </label>
                  <p className="settings-key-hint">{f.hint}</p>
                </div>
                <div className="settings-key-form">
                  <input
                    id={f.key}
                    type="password"
                    placeholder={isSet ? 'Update value (current value hidden)' : 'Enter key value'}
                    value={draft}
                    onChange={(e) => setDrafts((d) => ({ ...d, [f.key]: e.target.value }))}
                    disabled={isSaving}
                  />
                  <button
                    onClick={() => handleSave(f.key)}
                    disabled={!draft.trim() || isSaving}
                  >
                    {isSaving ? 'Saving…' : 'Save'}
                  </button>
                </div>
                {errors[f.key] && <p className="settings-key-error">{errors[f.key]}</p>}
                {successes[f.key] && <p className="settings-key-success">Saved.</p>}
              </div>
            );
          })}
        </div>
      </section>

      <section className="settings-section">
        <h2>Triple Whale Sync</h2>
        <p className="settings-hint">
          Pulls last 30 days of orders + per-ad rollup. Safe to re-run; UPSERT-on-conflict
          ensures idempotency.
        </p>
        <button onClick={handleTwSync} disabled={twSync.state === 'syncing'}>
          {twSync.state === 'syncing' ? 'Syncing…' : 'Sync now'}
        </button>
        {twSync.state === 'success' && twSync.result && (
          <div className="settings-sync-result">
            <p><strong>Window:</strong> {twSync.result.windowStart} → {twSync.result.windowEnd}</p>
            <p><strong>Metrics:</strong> {twSync.result.metricsUpserted}</p>
            <p><strong>Orders:</strong> {twSync.result.ordersUpserted}</p>
            <p><strong>Per-ad rollup rows:</strong> {twSync.result.adRowsUpserted}</p>
          </div>
        )}
        {twSync.state === 'error' && (
          <p className="settings-key-error">Sync failed: {twSync.message}</p>
        )}
      </section>
    </section>
  );
}
