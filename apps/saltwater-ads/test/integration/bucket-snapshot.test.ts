import { describe, test, expect, beforeAll, beforeEach, afterAll } from 'bun:test';
import { mkdir, writeFile, rm, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

import { migrate } from '@db/migrate.ts';
import { db } from '@db/client.ts';
import { snapshotBucket, loadBucketSnapshot } from '@lib/services/brand-bucket-manager.ts';

// H-1 (internal eng review v0.4): the worker hydrates buckets from a
// content-addressed cache, immune to mid-flight Settings uploads.
// These tests prove:
//   1. snapshotBucket writes data/bucket-cache/<sha>.<ext> entries
//   2. Two snapshots of identical content reuse the cache (idempotent)
//   3. A live bucket edit BETWEEN snapshot and load does NOT leak into the
//      loaded snapshot — it reads the frozen cache copy by hash
//   4. Different content → different hash → different cache entry

process.env.DB_PATH = ':memory:';

const TEST_BUCKET = resolve(import.meta.dir, '../../data/test-bucket-src');
const TEST_CACHE = resolve(import.meta.dir, '../../data/test-bucket-cache');

const BUCKET_FILES = {
  'voice.md': '# Voice v1\nFounder-led, salt-sun-and-grit.\n',
  'customer.md': '# Customer\nOlder Joe DeMarco archetype.\n',
  'winning-patterns.md': '# Patterns\nFounder Story / Problem-Solution / Limited Drop\n',
  'products.json': '{"skus":[{"id":"polo-navy","name":"Performance Polo Navy"}]}\n',
  'hooks-winners.jsonl': '{"hook_text":"winner one","pattern":"founder"}\n',
  'hooks-losers.jsonl': '{"hook_text":"loser one","pattern":"limited_drop"}\n',
};

async function writeBucket(files: Record<string, string>): Promise<void> {
  await mkdir(TEST_BUCKET, { recursive: true });
  for (const [name, content] of Object.entries(files)) {
    await writeFile(resolve(TEST_BUCKET, name), content);
  }
}

function sha256(s: string): string {
  return createHash('sha256').update(s).digest('hex');
}

describe('H-1 bucket cache materialization + load isolation', () => {
  beforeAll(async () => {
    process.env.SALTWATER_BUCKET_DIR = TEST_BUCKET;
    process.env.SALTWATER_BUCKET_CACHE_DIR = TEST_CACHE;
    await migrate({ quiet: true });
  });

  beforeEach(async () => {
    // Wipe per test so we observe cache writes from a clean slate.
    await rm(TEST_BUCKET, { recursive: true, force: true });
    await rm(TEST_CACHE, { recursive: true, force: true });
    db().run('DELETE FROM brand_bucket_version');
    await writeBucket(BUCKET_FILES);
  });

  afterAll(async () => {
    await rm(TEST_BUCKET, { recursive: true, force: true });
    await rm(TEST_CACHE, { recursive: true, force: true });
    delete process.env.SALTWATER_BUCKET_DIR;
    delete process.env.SALTWATER_BUCKET_CACHE_DIR;
  });

  test('snapshotBucket writes a brand_bucket_version row with all 6 sha columns', async () => {
    const snap = await snapshotBucket();
    expect(snap.versionId).toBeGreaterThan(0);

    const row = db().query(
      `SELECT voice_sha256, customer_sha256, winning_patterns_sha256,
              products_sha256, hooks_winners_sha256, hooks_losers_sha256
       FROM brand_bucket_version WHERE id = ?`,
    ).get(snap.versionId) as Record<string, string>;

    expect(row.voice_sha256).toBe(sha256(BUCKET_FILES['voice.md']));
    expect(row.winning_patterns_sha256).toBe(sha256(BUCKET_FILES['winning-patterns.md']));
    expect(row.hooks_winners_sha256).toBe(sha256(BUCKET_FILES['hooks-winners.jsonl']));
  });

  test('snapshotBucket materializes cache files at <sha>.<ext>', async () => {
    await snapshotBucket();
    const cached = (await readdir(TEST_CACHE)).sort();
    // 6 unique files in fixture → 6 cache entries
    expect(cached.length).toBe(6);

    const voiceSha = sha256(BUCKET_FILES['voice.md']);
    const productsSha = sha256(BUCKET_FILES['products.json']);
    expect(cached).toContain(`${voiceSha}.md`);
    expect(cached).toContain(`${productsSha}.json`);
  });

  test('two snapshots of identical content reuse cache entries (idempotent)', async () => {
    await snapshotBucket();
    const before = (await readdir(TEST_CACHE)).length;
    await snapshotBucket();
    const after = (await readdir(TEST_CACHE)).length;
    expect(after).toBe(before); // no duplicates
  });

  test('mid-flight bucket edit does NOT change loaded snapshot (the H-1 promise)', async () => {
    // Joe submits brief → snapshot at t=0
    const snap = await snapshotBucket();
    const originalVoice = snap.voice;
    expect(originalVoice).toContain('Founder-led, salt-sun-and-grit');

    // Joe uploads new voice.md while worker is mid-job.
    await writeFile(
      resolve(TEST_BUCKET, 'voice.md'),
      '# Voice v2\nTotally different tone. Should NOT show up in version_id ' + snap.versionId + '.\n',
    );

    // Worker reaches hooks_generating → loadBucketSnapshot(versionId).
    const loaded = await loadBucketSnapshot(snap.versionId);
    expect(loaded.voice).toBe(originalVoice);
    expect(loaded.voice).not.toContain('Voice v2');
  });

  test('a fresh snapshot AFTER the edit picks up the new content (correct for next brief)', async () => {
    const v1 = await snapshotBucket();
    await writeFile(resolve(TEST_BUCKET, 'voice.md'), '# Voice v2\nNew content.\n');
    const v2 = await snapshotBucket();

    expect(v2.versionId).not.toBe(v1.versionId);
    expect(v2.voice).toContain('Voice v2');

    // Old version still loads original content (cache is content-addressed).
    const v1Reloaded = await loadBucketSnapshot(v1.versionId);
    expect(v1Reloaded.voice).toContain('salt-sun-and-grit');
  });

  test('loadBucketSnapshot of unknown versionId throws clearly', async () => {
    await expect(loadBucketSnapshot(99999)).rejects.toThrow(/brand_bucket_version 99999 not found/);
  });

  test('loadBucketSnapshot with cache wiped throws cache-miss error', async () => {
    const snap = await snapshotBucket();
    // Simulate someone clearing data/ — snapshot row exists, cache files gone.
    await rm(TEST_CACHE, { recursive: true, force: true });
    await expect(loadBucketSnapshot(snap.versionId)).rejects.toThrow(/bucket cache miss/);
  });

  test('hooks_winners truncates to last 20 lines but cache stores full file', async () => {
    const allLines = Array.from({ length: 50 }, (_, i) => `{"hook_text":"hook ${i}","pattern":"founder"}`).join('\n') + '\n';
    await writeFile(resolve(TEST_BUCKET, 'hooks-winners.jsonl'), allLines);

    const snap = await snapshotBucket();
    expect(snap.hooks_winners.length).toBe(20);
    expect(snap.hooks_winners[19]).toContain('hook 49');
    expect(snap.hooks_winners[0]).toContain('hook 30');

    // Cache holds the full 50-line file.
    const cached = await Bun.file(resolve(TEST_CACHE, `${sha256(allLines)}.jsonl`)).text();
    expect(cached.split('\n').filter(Boolean).length).toBe(50);
  });
});
