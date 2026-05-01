// Login screen — magic-link request form.
//
// Flow:
//   1. User enters email
//   2. POST /auth/magic → server emails a verify link (Resend) or returns
//      ok:true silently if email isn't allowlisted (no leak per Lane A spec)
//   3. UI shows "Check your email" success state
//
// Dev bypass: if /auth/dev-login?email=... is enabled (DEV_AUTH_BYPASS=true
// in data/secrets.env), a small link below the form skips the magic-link
// round-trip when Resend isn't wired with a real key.

import { useState } from 'react';

export function Login(): JSX.Element {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    setError(null);
    setSent(false);
    try {
      const r = await fetch('/auth/magic', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
        credentials: 'include',
      });
      if (r.ok) {
        setSent(true);
      } else {
        const body = await r.json().catch(() => ({}));
        setError((body as { error?: string; message?: string }).message
          ?? (body as { error?: string }).error
          ?? `Request failed (${r.status})`);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Saltwater AI Ads</h1>
        <p>Enter your email — we'll send a sign-in link valid for 15 minutes.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="you@saltwaterlongisland.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting || sent}
            autoFocus
            required
          />
          <button type="submit" disabled={submitting || !email.trim() || sent}>
            {submitting ? 'Sending…' : sent ? 'Sent' : 'Send sign-in link'}
          </button>
        </form>

        {sent && (
          <div className="login-success">
            Check your inbox. The link expires in 15 minutes and can only be used once.
          </div>
        )}
        {error && <p className="login-error">{error}</p>}

        <div className="login-dev-bypass">
          Local dev only: <a href={`/auth/dev-login?email=${encodeURIComponent(email || 'nickd@demarconet.com')}`}>
            Skip magic link →
          </a>
        </div>
      </div>
    </div>
  );
}
