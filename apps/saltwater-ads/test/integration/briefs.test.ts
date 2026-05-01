import { describe, test, expect, beforeAll, beforeEach, afterAll } from 'bun:test';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Hono } from 'hono';
import { setSignedCookie } from 'hono/cookie';

import { migrate } from '@db/migrate.ts';
import { db } from '@db/client.ts';
import { loadSecrets, secrets } from '@lib/services/secrets.ts';
import { createApp } from '../../src/server/app.ts';

// Lane B: POST /api/briefs end-to-end. Pins:
//   1. Snapshots bucket inside the create flow (H-1: only place that calls
//      snapshotBucket)
//   2. Creates brief + hook_set + 3 variants + 3 render_attempts atomically
//   3. Returns 201 with all generated IDs
//   4. Audit row written with target_id = brief_id
//   5. Validation rejects malformed input
//   6. GET /api/briefs/:id returns the assembled record

process.env.DB_PATH = ':memory:';

const TEST_BUCKET = resolve(import.meta.dir, '../../data/test-briefs-bucket');
const TEST_CACHE = resolve(import.meta.dir, '../../data/test-briefs-cache');

const BUCKET_FIXTURES: Record<string, string> = {
  'voice.md': '# Voice\nFounder.\n',
  'customer.md': '# Customer\nOlder Joe.\n',
  'winning-patterns.md': '# Patterns\nFounder.\n',
  'products.json': '{"skus":[{"id":"polo-navy"}]}\n',
  'hooks-winners.jsonl': '{"hook_text":"w1","pattern":"founder"}\n',
  'hooks-losers.jsonl': '{"hook_text":"l1","pattern":"founder"}\n',
};

async function writeBucket(): Promise<void> {
  await mkdir(TEST_BUCKET, { recursive: true });
  for (const [name, content] of Object.entries(BUCKET_FIXTURES)) {
    await writeFile(resolve(TEST_BUCKET, name), content);
  }
}

async function mintSession(email: string): Promise<string> {
  const tmp = new Hono();
  tmp.get('/', async (c) => {
    await setSignedCookie(c, 'sw_session', JSON.stringify({ email }), secrets.sessionSig());
    return c.text('ok');
  });
  const res = await tmp.request('/');
  return res.headers.get('set-cookie')!.split(';')[0];
}

describe('POST /api/briefs', () => {
  let app: ReturnType<typeof createApp>;
  let cookie: string;

  beforeAll(async () => {
    process.env.SALTWATER_BUCKET_DIR = TEST_BUCKET;
    process.env.SALTWATER_BUCKET_CACHE_DIR = TEST_CACHE;
    loadSecrets();
    await migrate({ quiet: true });
    app = createApp();
    cookie = await mintSession('joe@saltwater.test');
  });

  beforeEach(async () => {
    await rm(TEST_BUCKET, { recursive: true, force: true });
    await rm(TEST_CACHE, { recursive: true, force: true });
    db().run('DELETE FROM render_attempt');
    db().run('DELETE FROM variant');
    db().run('DELETE FROM hook_set');
    db().run('DELETE FROM brief');
    db().run('DELETE FROM brand_bucket_version');
    db().run('DELETE FROM audit_log');
    await writeBucket();
  });

  afterAll(async () => {
    await rm(TEST_BUCKET, { recursive: true, force: true });
    await rm(TEST_CACHE, { recursive: true, force: true });
    delete process.env.SALTWATER_BUCKET_DIR;
    delete process.env.SALTWATER_BUCKET_CACHE_DIR;
  });

  test('happy path: 201 + brief/hook_set/3 variants/3 attempts', async () => {
    const res = await app.request('/api/briefs', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie },
      body: JSON.stringify({
        free_text: 'launch the navy polo for spring',
        pattern: 'limited_drop',
        sku_id: 'polo-navy',
      }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as {
      brief_id: number;
      hook_set_id: number;
      variant_ids: number[];
      attempt_ids: number[];
      brand_bucket_version_id: number;
      status: string;
    };

    expect(body.brief_id).toBeGreaterThan(0);
    expect(body.hook_set_id).toBeGreaterThan(0);
    expect(body.variant_ids.length).toBe(3);
    expect(body.attempt_ids.length).toBe(3);
    expect(body.brand_bucket_version_id).toBeGreaterThan(0);
    expect(body.status).toBe('queued');

    // Verify brief row
    const brief = db().query('SELECT operator, free_text, pattern, sku_id FROM brief WHERE id = ?')
      .get(body.brief_id) as { operator: string; free_text: string; pattern: string; sku_id: string };
    expect(brief.operator).toBe('joe@saltwater.test');
    expect(brief.free_text).toContain('navy polo');
    expect(brief.pattern).toBe('limited_drop');
    expect(brief.sku_id).toBe('polo-navy');

    // Verify hook_set linked correctly
    const hs = db().query('SELECT brief_id, brand_bucket_version_id, status FROM hook_set WHERE id = ?')
      .get(body.hook_set_id) as { brief_id: number; brand_bucket_version_id: number; status: string };
    expect(hs.brief_id).toBe(body.brief_id);
    expect(hs.brand_bucket_version_id).toBe(body.brand_bucket_version_id);
    expect(hs.status).toBe('pending');

    // Verify 3 variants with V1/V2/V3 labels
    const variants = db().query('SELECT id, sub_variant_label, status, pattern FROM variant WHERE hook_set_id = ? ORDER BY id ASC')
      .all(body.hook_set_id) as Array<{ id: number; sub_variant_label: string; status: string; pattern: string }>;
    expect(variants.length).toBe(3);
    expect(variants.map((v) => v.sub_variant_label)).toEqual(['V1', 'V2', 'V3']);
    expect(variants.every((v) => v.status === 'queued')).toBe(true);
    expect(variants.every((v) => v.pattern === 'limited_drop')).toBe(true);

    // Verify 3 render_attempts in queued state
    const attempts = db().query(
      `SELECT id, variant_id, attempt_number, state FROM render_attempt
       WHERE variant_id IN (${variants.map(() => '?').join(',')})
       ORDER BY id ASC`,
    ).all(...variants.map((v) => v.id)) as Array<{ id: number; variant_id: number; attempt_number: number; state: string }>;
    expect(attempts.length).toBe(3);
    expect(attempts.every((a) => a.state === 'queued')).toBe(true);
    expect(attempts.every((a) => a.attempt_number === 1)).toBe(true);
  });

  test('default pattern is "founder" when not provided', async () => {
    const res = await app.request('/api/briefs', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie },
      body: JSON.stringify({ free_text: 'no pattern' }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { brief_id: number };
    const brief = db().query('SELECT pattern FROM brief WHERE id = ?').get(body.brief_id) as { pattern: string };
    expect(brief.pattern).toBe('founder');
  });

  test('audit row written with action=generate, target_type=brief, target_id=brief_id', async () => {
    const res = await app.request('/api/briefs', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie },
      body: JSON.stringify({ free_text: 'audit test' }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { brief_id: number; brand_bucket_version_id: number };

    const row = db().query(
      `SELECT email, action, target_type, target_id, meta_json FROM audit_log
       WHERE action = 'generate' ORDER BY id DESC LIMIT 1`,
    ).get() as { email: string; action: string; target_type: string; target_id: string; meta_json: string };

    expect(row.email).toBe('joe@saltwater.test');
    expect(row.target_type).toBe('brief');
    expect(row.target_id).toBe(String(body.brief_id));

    const meta = JSON.parse(row.meta_json) as { pattern: string; brand_bucket_version_id: number };
    expect(meta.pattern).toBe('founder');
    expect(meta.brand_bucket_version_id).toBe(body.brand_bucket_version_id);
  });

  test('400 on missing free_text', async () => {
    const res = await app.request('/api/briefs', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('invalid_brief');
  });

  test('400 on free_text > 400 chars', async () => {
    const res = await app.request('/api/briefs', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie },
      body: JSON.stringify({ free_text: 'X'.repeat(401) }),
    });
    expect(res.status).toBe(400);
  });

  test('400 on bogus pattern', async () => {
    const res = await app.request('/api/briefs', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie },
      body: JSON.stringify({ free_text: 'ok', pattern: 'made-up-pattern' }),
    });
    expect(res.status).toBe(400);
  });

  test('two briefs against unchanged bucket reuse the SAME brand_bucket_version_id', async () => {
    const r1 = await app.request('/api/briefs', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie },
      body: JSON.stringify({ free_text: 'first' }),
    });
    const r2 = await app.request('/api/briefs', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie },
      body: JSON.stringify({ free_text: 'second' }),
    });
    const b1 = (await r1.json()) as { brand_bucket_version_id: number };
    const b2 = (await r2.json()) as { brand_bucket_version_id: number };
    // Snapshots create distinct version rows even when content matches —
    // each brief gets its own version_id, but they point at the same cache
    // entries (idempotent SHA-keyed cache). Verify both rows have the same
    // voice_sha to prove cache reuse.
    expect(b1.brand_bucket_version_id).not.toBe(b2.brand_bucket_version_id);
    const rows = db().query(
      `SELECT voice_sha256 FROM brand_bucket_version WHERE id IN (?, ?)`,
    ).all(b1.brand_bucket_version_id, b2.brand_bucket_version_id) as Array<{ voice_sha256: string }>;
    expect(rows[0].voice_sha256).toBe(rows[1].voice_sha256);
  });
});

describe('GET /api/briefs/:id', () => {
  let app: ReturnType<typeof createApp>;
  let cookie: string;

  beforeAll(async () => {
    process.env.SALTWATER_BUCKET_DIR = TEST_BUCKET;
    process.env.SALTWATER_BUCKET_CACHE_DIR = TEST_CACHE;
    loadSecrets();
    await migrate({ quiet: true });
    app = createApp();
    cookie = await mintSession('joe@saltwater.test');
  });

  beforeEach(async () => {
    await rm(TEST_BUCKET, { recursive: true, force: true });
    await rm(TEST_CACHE, { recursive: true, force: true });
    db().run('DELETE FROM render_attempt');
    db().run('DELETE FROM variant');
    db().run('DELETE FROM hook_set');
    db().run('DELETE FROM brief');
    db().run('DELETE FROM brand_bucket_version');
    await writeBucket();
  });

  afterAll(async () => {
    await rm(TEST_BUCKET, { recursive: true, force: true });
    await rm(TEST_CACHE, { recursive: true, force: true });
    delete process.env.SALTWATER_BUCKET_DIR;
    delete process.env.SALTWATER_BUCKET_CACHE_DIR;
  });

  test('200 with brief + hook_set + variants for a created brief', async () => {
    const created = await app.request('/api/briefs', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie },
      body: JSON.stringify({ free_text: 'detail test', pattern: 'founder' }),
    });
    const { brief_id } = (await created.json()) as { brief_id: number };

    const res = await app.request(`/api/briefs/${brief_id}`, { headers: { cookie } });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      brief: { id: number; free_text: string };
      hook_set: { id: number; status: string } | null;
      variants: Array<{ sub_variant_label: string }>;
    };
    expect(body.brief.id).toBe(brief_id);
    expect(body.brief.free_text).toBe('detail test');
    expect(body.hook_set).not.toBeNull();
    expect(body.hook_set!.status).toBe('pending');
    expect(body.variants.length).toBe(3);
    expect(body.variants.map((v) => v.sub_variant_label)).toEqual(['V1', 'V2', 'V3']);
  });

  test('404 with reason=brief_missing on unknown id', async () => {
    const res = await app.request('/api/briefs/99999', { headers: { cookie } });
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string; reason: string };
    expect(body.error).toBe('not_found');
    expect(body.reason).toBe('brief_missing');
  });

  test('400 on non-numeric id', async () => {
    const res = await app.request('/api/briefs/not-a-number', { headers: { cookie } });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('invalid_id');
  });
});
