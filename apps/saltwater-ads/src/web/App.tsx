import { useEffect, useState } from 'react';
import { Generate } from './pages/Generate.tsx';
import { ReviewQueue } from './pages/ReviewQueue.tsx';
import { Settings } from './pages/Settings.tsx';
import { Assets } from './pages/Assets.tsx';
import { Login } from './pages/Login.tsx';
import { api } from './api.ts';

type Page = 'generate' | 'review' | 'assets' | 'settings';
type AuthState = 'checking' | 'authed' | 'anon';

// Hash routing: '#generate' | '#review' | '#review/123' | '#assets' | '#settings'.
// The optional /<id> suffix on review hops the user straight to the variant
// detail (used by the "Recent variants" rows on the Generate page).
function pageFromHash(): Page {
  const h = window.location.hash.replace(/^#/, '').split('/')[0];
  if (h === 'review' || h === 'assets' || h === 'settings' || h === 'generate') return h;
  return 'generate';
}

export function App(): JSX.Element {
  const [page, setPageState] = useState<Page>(pageFromHash());
  const [auth, setAuth] = useState<AuthState>('checking');

  function setPage(p: Page): void {
    window.location.hash = p;
    setPageState(p);
  }

  // Watch for external hash changes (e.g., the Generate page deep-linking
  // into #review/123 when the user clicks a Recent Variants row).
  useEffect(() => {
    const onHash = (): void => setPageState(pageFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

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
        <div className="brand">
          <img src="/favicon.svg" alt="" width="24" height="24" style={{ verticalAlign: 'middle', marginRight: 8 }} />
          Saltwater AI Ads
        </div>
        <button className={page === 'generate' ? 'active' : ''} onClick={() => setPage('generate')}>Generate</button>
        <button className={page === 'review' ? 'active' : ''} onClick={() => setPage('review')}>Review Queue</button>
        <button className={page === 'assets' ? 'active' : ''} onClick={() => setPage('assets')}>Assets</button>
        <button className={page === 'settings' ? 'active' : ''} onClick={() => setPage('settings')}>Settings</button>
        <div style={{ flex: 1 }} />
        <button onClick={handleLogout} style={{ fontSize: 12, color: 'var(--ink-3)' }}>Sign out</button>
      </aside>
      <main className="content">
        {page === 'generate' && <Generate />}
        {page === 'review' && <ReviewQueue />}
        {page === 'assets' && <Assets />}
        {page === 'settings' && <Settings />}
      </main>
    </div>
  );
}
