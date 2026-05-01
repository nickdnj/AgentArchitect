// Reusable Assets Library page.
//
// Three sections (tabs):
//   1. B-roll clips    — videos used as Layer 3 in the render (coastal footage)
//   2. Brand assets    — logos + reference images (used in assembly + Fashn)
//   3. Brand bucket    — read-only view of voice.md, customer.md, etc.
//
// Each upload writes to media/{b-roll|brand}/ and (for b-roll) inserts a
// b_roll_clip row. Files are served via /api/assets/{b-roll|brand}/<name>.

import { useEffect, useState } from 'react';
import { api } from '../api.ts';

type Tab = 'broll' | 'brand' | 'bucket';

interface BRollClip {
  id: number;
  path: string;
  duration_seconds: number;
  tags: string[];
  season: string | null;
  notes: string | null;
  url: string;
  added_at: string;
}

interface BrandAsset {
  name: string;
  size_bytes: number;
  added_at: string;
  url: string;
  type: 'image' | 'video' | 'other';
}

interface BucketFile {
  name: string;
  exists: boolean;
  size_bytes: number;
  content: string;
}

export function Assets(): JSX.Element {
  const [tab, setTab] = useState<Tab>('broll');

  return (
    <section className="page page-assets">
      <h1>Assets Library</h1>
      <p style={{ color: 'var(--ink-3)', fontSize: 13, marginTop: 0 }}>
        Reusable b-roll clips, brand logos, reference images, and the brand bucket files
        that drive every hook generation.
      </p>

      <div className="assets-tabs">
        <button className={tab === 'broll' ? 'is-selected' : ''} onClick={() => setTab('broll')}>B-roll</button>
        <button className={tab === 'brand' ? 'is-selected' : ''} onClick={() => setTab('brand')}>Brand assets</button>
        <button className={tab === 'bucket' ? 'is-selected' : ''} onClick={() => setTab('bucket')}>Brand bucket</button>
      </div>

      {tab === 'broll' && <BRollTab />}
      {tab === 'brand' && <BrandTab />}
      {tab === 'bucket' && <BucketTab />}
    </section>
  );
}

function BRollTab(): JSX.Element {
  const [clips, setClips] = useState<BRollClip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload form state
  const [file, setFile] = useState<File | null>(null);
  const [tags, setTags] = useState('');
  const [season, setSeason] = useState('all');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function load(): Promise<void> {
    setLoading(true);
    try {
      const r = await api.assets.listBRoll();
      setClips(r.clips);
      setError(null);
    } catch (err) {
      setError((err as Error).message.replace(/^API \d+ [^:]+:\s*/, ''));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function handleUpload(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean);
      await api.assets.uploadBRoll(file, tagList, season, notes);
      setFile(null);
      setTags('');
      setNotes('');
      // Reset the file input
      const input = document.getElementById('broll-file') as HTMLInputElement;
      if (input) input.value = '';
      await load();
    } catch (err) {
      setUploadError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: number): Promise<void> {
    if (!confirm(`Delete b-roll clip #${id}? This removes the file too.`)) return;
    try {
      await api.assets.deleteBRoll(id);
      await load();
    } catch (err) {
      alert(`Delete failed: ${(err as Error).message}`);
    }
  }

  return (
    <div>
      <section className="settings-section" style={{ marginTop: 0, paddingTop: 0, borderTop: 0 }}>
        <h2>Upload new b-roll</h2>
        <p className="settings-hint">
          Coastal footage Joe shot — sunsets on the beach, dock walks, boat shots. The render
          orchestrator picks one matching the brief's season and tags as Layer 3.
        </p>
        <form onSubmit={handleUpload} className="broll-upload-form">
          <input
            id="broll-file"
            type="file"
            accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            disabled={uploading}
          />
          <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
            <label style={{ flex: '1 1 240px' }}>
              <span style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                Tags (comma-separated)
              </span>
              <input
                type="text"
                placeholder="beach, sunset, boat, dock"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                disabled={uploading}
                style={{ width: '100%', padding: 8, border: '1px solid var(--line)', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 13 }}
              />
            </label>
            <label style={{ flex: '0 0 140px' }}>
              <span style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Season</span>
              <select
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                disabled={uploading}
                style={{ width: '100%', padding: 8, border: '1px solid var(--line)', borderRadius: 4 }}
              >
                <option value="all">all</option>
                <option value="spring">spring</option>
                <option value="summer">summer</option>
                <option value="fall">fall</option>
                <option value="winter">winter</option>
              </select>
            </label>
          </div>
          <label style={{ display: 'block', marginTop: 12 }}>
            <span style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
              Notes (optional)
            </span>
            <input
              type="text"
              placeholder="Filmed at Captree State Park, July 2025"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={uploading}
              style={{ width: '100%', padding: 8, border: '1px solid var(--line)', borderRadius: 4, fontSize: 13 }}
            />
          </label>
          <button type="submit" disabled={!file || uploading} style={{ marginTop: 12 }}>
            {uploading ? 'Uploading…' : 'Upload b-roll'}
          </button>
          {uploadError && <p className="settings-key-error">{uploadError}</p>}
        </form>
      </section>

      <section className="settings-section">
        <h2>Library ({clips.length})</h2>
        {loading && <p className="empty">Loading…</p>}
        {error && <p className="error-banner">{error}</p>}
        {!loading && !error && clips.length === 0 && (
          <p className="empty" style={{ padding: 0 }}>No b-roll clips yet — upload above.</p>
        )}
        <div className="asset-grid">
          {clips.map((c) => (
            <article key={c.id} className="asset-card">
              <video src={c.url} controls preload="metadata" muted style={{ width: '100%', borderRadius: 4, background: '#000' }} />
              <div className="asset-meta">
                <code>{c.path}</code>
                <p>
                  <span className="pill">{c.season ?? 'all'}</span>
                  {' '}
                  {c.tags.map((t) => <span key={t} className="tag-chip">{t}</span>)}
                </p>
                {c.notes && <p className="notes">{c.notes}</p>}
              </div>
              <button onClick={() => handleDelete(c.id)} className="asset-delete">Delete</button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function BrandTab(): JSX.Element {
  const [assets, setAssets] = useState<BrandAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function load(): Promise<void> {
    setLoading(true);
    try {
      const r = await api.assets.listBrand();
      setAssets(r.assets);
      setError(null);
    } catch (err) {
      setError((err as Error).message.replace(/^API \d+ [^:]+:\s*/, ''));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function handleUpload(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      await api.assets.uploadBrand(file);
      setFile(null);
      const input = document.getElementById('brand-file') as HTMLInputElement;
      if (input) input.value = '';
      await load();
    } catch (err) {
      setUploadError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(name: string): Promise<void> {
    if (!confirm(`Delete ${name}?`)) return;
    try {
      await api.assets.deleteBrand(name);
      await load();
    } catch (err) {
      alert(`Delete failed: ${(err as Error).message}`);
    }
  }

  return (
    <div>
      <section className="settings-section" style={{ marginTop: 0, paddingTop: 0, borderTop: 0 }}>
        <h2>Upload brand asset</h2>
        <p className="settings-hint">
          Logos, reference images, archetype shots used by the assembly stage and as model references for Fashn.
          Images: png, jpg, webp, svg (max 10 MB). Videos: mp4, mov, webm (max 200 MB).
        </p>
        <form onSubmit={handleUpload}>
          <input
            id="brand-file"
            type="file"
            accept="image/*,video/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            disabled={uploading}
          />
          <button type="submit" disabled={!file || uploading} style={{ marginLeft: 12 }}>
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
          {uploadError && <p className="settings-key-error">{uploadError}</p>}
        </form>
      </section>

      <section className="settings-section">
        <h2>Library ({assets.length})</h2>
        {loading && <p className="empty">Loading…</p>}
        {error && <p className="error-banner">{error}</p>}
        {!loading && !error && assets.length === 0 && (
          <p className="empty" style={{ padding: 0 }}>No brand assets yet — upload above.</p>
        )}
        <div className="asset-grid">
          {assets.map((a) => (
            <article key={a.name} className="asset-card">
              {a.type === 'image' && <img src={a.url} alt={a.name} style={{ width: '100%', borderRadius: 4, background: '#fff' }} />}
              {a.type === 'video' && <video src={a.url} controls preload="metadata" muted style={{ width: '100%', borderRadius: 4 }} />}
              {a.type === 'other' && <div style={{ padding: 24, textAlign: 'center', background: 'var(--sand-100)', borderRadius: 4 }}>📄 {a.name}</div>}
              <div className="asset-meta">
                <code>{a.name}</code>
                <p style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                  {(a.size_bytes / 1024).toFixed(1)} KB · {new Date(a.added_at).toLocaleDateString()}
                </p>
              </div>
              <button onClick={() => handleDelete(a.name)} className="asset-delete">Delete</button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function BucketTab(): JSX.Element {
  const [files, setFiles] = useState<BucketFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openName, setOpenName] = useState<string | null>(null);

  useEffect(() => {
    api.assets.listBucket()
      .then((r) => setFiles(r.files))
      .catch((err) => setError((err as Error).message.replace(/^API \d+ [^:]+:\s*/, '')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="empty">Loading bucket…</p>;
  if (error) return <p className="error-banner">{error}</p>;

  return (
    <div>
      <p className="settings-hint" style={{ marginTop: 0 }}>
        These six files drive every hook generation. The Hook Generator reads them at brief-create
        time and freezes the version (content-addressed cache by SHA-256). Sprint 1 is read-only —
        Sprint 2 will add in-app editing.
      </p>
      <div className="bucket-files">
        {files.map((f) => {
          const isOpen = openName === f.name;
          return (
            <article key={f.name} className="bucket-file">
              <header
                onClick={() => setOpenName(isOpen ? null : f.name)}
                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <code>{f.name}</code>
                <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                  {f.exists ? `${f.size_bytes} chars` : 'missing'}
                  {' '}
                  {isOpen ? '▾' : '▸'}
                </span>
              </header>
              {isOpen && f.exists && (
                <pre className="bucket-content">{f.content}</pre>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
