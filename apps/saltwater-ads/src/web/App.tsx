import { useState } from 'react';
import { Generate } from './pages/Generate.tsx';
import { ReviewQueue } from './pages/ReviewQueue.tsx';
import { Settings } from './pages/Settings.tsx';

type Page = 'generate' | 'review' | 'settings';

export function App(): JSX.Element {
  const [page, setPage] = useState<Page>('generate');

  return (
    <div className="app">
      <aside className="nav">
        <div className="brand">Saltwater AI Ads</div>
        <button className={page === 'generate' ? 'active' : ''} onClick={() => setPage('generate')}>Generate</button>
        <button className={page === 'review' ? 'active' : ''} onClick={() => setPage('review')}>Review Queue</button>
        <button className={page === 'settings' ? 'active' : ''} onClick={() => setPage('settings')}>Settings</button>
      </aside>
      <main className="content">
        {page === 'generate' && <Generate />}
        {page === 'review' && <ReviewQueue />}
        {page === 'settings' && <Settings />}
      </main>
    </div>
  );
}
