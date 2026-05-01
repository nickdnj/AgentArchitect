import { useEffect, useState } from 'react';
import { Generate } from './pages/Generate.tsx';
import { ReviewQueue } from './pages/ReviewQueue.tsx';
import { Settings } from './pages/Settings.tsx';
import { Login } from './pages/Login.tsx';
import { api } from './api.ts';

type Page = 'generate' | 'review' | 'settings';
type AuthState = 'checking' | 'authed' | 'anon';

export function App(): JSX.Element {
  const [page, setPage] = useState<Page>('generate');
  const [auth, setAuth] = useState<AuthState>('checking');

  // Probe an authed endpoint at mount. /api/settings is the cheapest auth-
  // gated route and it always returns the presence map when authed. If it
  // 401s, we show the login screen.
  useEffect(() => {
    let cancelled = false;
    api.settings.get()
      .then(() => { if (!cancelled) setAuth('authed'); })
      .catch(() => { if (!cancelled) setAuth('anon'); });
    return () => { cancelled = true; };
  }, []);

  async function handleLogout(): Promise<void> {
    try {
      await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
    } catch { /* swallow */ }
    setAuth('anon');
  }

  if (auth === 'checking') {
    return <div className="login-page"><p style={{ color: 'var(--ink-3)' }}>Loading…</p></div>;
  }
  if (auth === 'anon') {
    return <Login />;
  }

  return (
    <div className="app">
      <aside className="nav">
        <div className="brand">Saltwater AI Ads</div>
        <button className={page === 'generate' ? 'active' : ''} onClick={() => setPage('generate')}>Generate</button>
        <button className={page === 'review' ? 'active' : ''} onClick={() => setPage('review')}>Review Queue</button>
        <button className={page === 'settings' ? 'active' : ''} onClick={() => setPage('settings')}>Settings</button>
        <div style={{ flex: 1 }} />
        <button onClick={handleLogout} style={{ fontSize: 12, color: 'var(--ink-3)' }}>Sign out</button>
      </aside>
      <main className="content">
        {page === 'generate' && <Generate />}
        {page === 'review' && <ReviewQueue />}
        {page === 'settings' && <Settings />}
      </main>
    </div>
  );
}
