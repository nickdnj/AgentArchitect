import { createHash } from 'node:crypto';
import { readFileSync, appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { db } from '@db/client.ts';
import type { BrandBucketSnapshot } from '@lib/llm/types.ts';

// PRD §6.1.1 — Brand Bucket Manager.
// Owns context-buckets/saltwater-brand/files/ + versioning + JSONL appends.

const BUCKET_DIR = resolve(import.meta.dir, '../../../../context-buckets/saltwater-brand/files');

const FILES = {
  voice: 'voice.md',
  customer: 'customer.md',
  winningPatterns: 'winning-patterns.md',
  products: 'products.json',
  hooksWinners: 'hooks-winners.jsonl',
  hooksLosers: 'hooks-losers.jsonl',
} as const;

function sha256(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

function readFile(name: string): string {
  return readFileSync(resolve(BUCKET_DIR, name), 'utf8');
}

function lastNLines(text: string, n: number): string[] {
  return text.split('\n').filter((l) => l.trim()).slice(-n);
}

export function snapshotBucket(): BrandBucketSnapshot {
  const voice = readFile(FILES.voice);
  const customer = readFile(FILES.customer);
  const winning = readFile(FILES.winningPatterns);
  const products = readFile(FILES.products);
  const winnersText = readFile(FILES.hooksWinners);
  const losersText = readFile(FILES.hooksLosers);

  const conn = db();
  const versionId = conn.transaction(() => {
    const result = conn.run(
      `INSERT INTO brand_bucket_version
        (voice_sha256, customer_sha256, winning_patterns_sha256, products_sha256, hooks_winners_sha256, hooks_losers_sha256)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [sha256(voice), sha256(customer), sha256(winning), sha256(products), sha256(winnersText), sha256(losersText)]
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
  appendFileSync(resolve(BUCKET_DIR, FILES.hooksWinners), JSON.stringify(entry) + '\n');
}

export function appendLoser(entry: JsonlHookEntry): void {
  appendFileSync(resolve(BUCKET_DIR, FILES.hooksLosers), JSON.stringify(entry) + '\n');
}
