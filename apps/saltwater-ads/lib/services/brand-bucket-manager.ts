import { createHash } from 'node:crypto';
import { appendFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { db } from '@db/client.ts';
import type { BrandBucketSnapshot } from '@lib/llm/types.ts';

// PRD §6.1.1 — Brand Bucket Manager.
// Owns context-buckets/saltwater-brand/files/ + content-addressed cache +
// versioning + JSONL appends.
//
// H-1 fix (internal eng review v0.4): the worker MUST hydrate from a
// content-addressed cache, not the live filesystem. Otherwise a Settings
// upload during a 12-minute generation flips the file Joe sees in his
// hook_set's recorded version row, and the audit trail becomes a lie.
//
// Snapshot (called inside the brief-create transaction in routes/briefs.ts):
//   1. Read all 6 bucket files from live FS
//   2. Compute SHA-256 of each
//   3. Write each content to data/bucket-cache/<sha>.<ext> if missing
//      (content-addressed: if two snapshots share a hash, one cache entry)
//   4. INSERT brand_bucket_version row, get versionId
//   5. Return snapshot { versionId, content... } for the route's response
//
// Load (called by worker mid-job through hook-generator):
//   1. SELECT brand_bucket_version WHERE id = ?
//   2. Read content from data/bucket-cache/<sha>.<ext> for each file
//   3. Return snapshot
//
// Mid-flight edits to the live bucket WILL show up in the next snapshotBucket()
// call (correct — that's the next brief). They will NOT affect any snapshot
// already loaded, because load reads the frozen cache copy by hash.

const FILES = {
  voice: { name: 'voice.md', ext: 'md', column: 'voice_sha256' },
  customer: { name: 'customer.md', ext: 'md', column: 'customer_sha256' },
  winningPatterns: { name: 'winning-patterns.md', ext: 'md', column: 'winning_patterns_sha256' },
  products: { name: 'products.json', ext: 'json', column: 'products_sha256' },
  hooksWinners: { name: 'hooks-winners.jsonl', ext: 'jsonl', column: 'hooks_winners_sha256' },
  hooksLosers: { name: 'hooks-losers.jsonl', ext: 'jsonl', column: 'hooks_losers_sha256' },
} as const;

function bucketDir(): string {
  return process.env.SALTWATER_BUCKET_DIR
    ?? resolve(import.meta.dir, '../../../../context-buckets/saltwater-brand/files');
}

function cacheDir(): string {
  return process.env.SALTWATER_BUCKET_CACHE_DIR
    ?? resolve(import.meta.dir, '../../data/bucket-cache');
}

function sha256(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

function lastNLines(text: string, n: number): string[] {
  return text.split('\n').filter((l) => l.trim()).slice(-n);
}

async function readBucketFile(name: string): Promise<string> {
  return await Bun.file(resolve(bucketDir(), name)).text();
}

async function writeCacheIfMissing(content: string, sha: string, ext: string): Promise<void> {
  const path = resolve(cacheDir(), `${sha}.${ext}`);
  const file = Bun.file(path);
  if (!(await file.exists())) {
    await Bun.write(path, content);
  }
}

async function readCacheBySha(sha: string, ext: string): Promise<string> {
  const path = resolve(cacheDir(), `${sha}.${ext}`);
  const file = Bun.file(path);
  if (!(await file.exists())) {
    throw new Error(`bucket cache miss: ${sha}.${ext} (was ${path}). The cache was supposed to be written at snapshotBucket() time. Did the data/ volume get cleared?`);
  }
  return await file.text();
}

export async function snapshotBucket(): Promise<BrandBucketSnapshot> {
  // Ensure cache dir exists. mkdir -p is idempotent.
  await mkdir(cacheDir(), { recursive: true });

  const [voice, customer, winning, products, winnersText, losersText] = await Promise.all([
    readBucketFile(FILES.voice.name),
    readBucketFile(FILES.customer.name),
    readBucketFile(FILES.winningPatterns.name),
    readBucketFile(FILES.products.name),
    readBucketFile(FILES.hooksWinners.name),
    readBucketFile(FILES.hooksLosers.name),
  ]);

  const hashes = {
    voice: sha256(voice),
    customer: sha256(customer),
    winning: sha256(winning),
    products: sha256(products),
    winners: sha256(winnersText),
    losers: sha256(losersText),
  };

  // Materialize cache entries before the DB row goes in. If we crash here, the
  // cache may have orphan entries — that's fine (they're content-addressed,
  // future snapshots will reuse them). What we MUST avoid is a brand_bucket_version
  // row whose cache content doesn't exist yet.
  await Promise.all([
    writeCacheIfMissing(voice, hashes.voice, FILES.voice.ext),
    writeCacheIfMissing(customer, hashes.customer, FILES.customer.ext),
    writeCacheIfMissing(winning, hashes.winning, FILES.winningPatterns.ext),
    writeCacheIfMissing(products, hashes.products, FILES.products.ext),
    writeCacheIfMissing(winnersText, hashes.winners, FILES.hooksWinners.ext),
    writeCacheIfMissing(losersText, hashes.losers, FILES.hooksLosers.ext),
  ]);

  const conn = db();
  const versionId = conn.transaction(() => {
    const result = conn.run(
      `INSERT INTO brand_bucket_version
        (voice_sha256, customer_sha256, winning_patterns_sha256, products_sha256, hooks_winners_sha256, hooks_losers_sha256)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [hashes.voice, hashes.customer, hashes.winning, hashes.products, hashes.winners, hashes.losers],
    );
    return Number(result.lastInsertRowid);
  })();

  return {
    voice,
    customer,
    winning_patterns: winning,
    products,
    hooks_winners: lastNLines(winnersText, 20),
    hooks_losers: lastNLines(losersText, 5),
    versionId,
  };
}

interface BrandBucketVersionRow {
  id: number;
  voice_sha256: string;
  customer_sha256: string;
  winning_patterns_sha256: string;
  products_sha256: string;
  hooks_winners_sha256: string;
  hooks_losers_sha256: string;
}

export async function loadBucketSnapshot(versionId: number): Promise<BrandBucketSnapshot> {
  const row = db().query(
    `SELECT id, voice_sha256, customer_sha256, winning_patterns_sha256,
            products_sha256, hooks_winners_sha256, hooks_losers_sha256
     FROM brand_bucket_version WHERE id = ?`,
  ).get(versionId) as BrandBucketVersionRow | null;

  if (!row) {
    throw new Error(`brand_bucket_version ${versionId} not found`);
  }

  const [voice, customer, winning, products, winnersText, losersText] = await Promise.all([
    readCacheBySha(row.voice_sha256, FILES.voice.ext),
    readCacheBySha(row.customer_sha256, FILES.customer.ext),
    readCacheBySha(row.winning_patterns_sha256, FILES.winningPatterns.ext),
    readCacheBySha(row.products_sha256, FILES.products.ext),
    readCacheBySha(row.hooks_winners_sha256, FILES.hooksWinners.ext),
    readCacheBySha(row.hooks_losers_sha256, FILES.hooksLosers.ext),
  ]);

  return {
    voice,
    customer,
    winning_patterns: winning,
    products,
    hooks_winners: lastNLines(winnersText, 20),
    hooks_losers: lastNLines(losersText, 5),
    versionId,
  };
}

export interface JsonlHookEntry {
  ad_id: string;
  hook_text: string;
  pattern: string;
  sku?: string | null;
  hook_rate?: number | null;
  roas?: number | null;
  source: 'tw' | 'manual';
  logged_at: string;
}

export function appendWinner(entry: JsonlHookEntry): void {
  appendFileSync(resolve(bucketDir(), FILES.hooksWinners.name), JSON.stringify(entry) + '\n');
}

export function appendLoser(entry: JsonlHookEntry): void {
  appendFileSync(resolve(bucketDir(), FILES.hooksLosers.name), JSON.stringify(entry) + '\n');
}
