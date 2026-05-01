import { resolve } from 'node:path';
import { mkdir } from 'node:fs/promises';
import { db } from '@db/client.ts';
import { log } from '@lib/log.ts';
import { VENDOR_TIMEOUTS_MS, withDeadline } from '../../src/worker/deadlines.ts';
import { createHookClip, downloadClip as downloadHeygen, setHeygenFetchForTest } from '@lib/vendors/heygen.ts';
import { createShowcaseClip, downloadClip as downloadFashn, setFashnFetchForTest } from '@lib/vendors/fashn.ts';

// PRD §6.1.4 — Render Orchestrator.
// Calls HeyGen Photo Avatar + Fashn try-on in parallel with per-vendor timeout
// budgets. Idempotency cache keyed by (hook_text, avatar_id) avoids re-billing
// HeyGen on regenerated variants with identical hooks.
//
// Failure semantics (SAD §4.4):
//   - Either vendor terminal-fails → partial=true, that layer skipped at assembly
//   - BOTH vendors terminal-fail → throw → A1 marks failed_recoverable
//   - Per-vendor timeout fires AbortController → vendor adapter throws "aborted"
//
// File layout: media/renders/YYYY-MM-DD/<variant_id>/<attempt>/{heygen,fashn}.mp4

const RENDERS_ROOT = process.env.RENDERS_ROOT ?? resolve(import.meta.dir, '../../media/renders');

// Re-export the test hatches so callers (tests, dev tools) can stub via
// the orchestrator instead of importing every vendor module directly.
export { setHeygenFetchForTest, setFashnFetchForTest };

export interface RenderArgs {
  variantId: number;
  hookText: string;
  skuId: string | null;
  attemptNumber: number;
  /** Sub-variant label V1/V2/V3 — passed through to HeyGen for analytics. */
  subVariantLabel?: string;
  /** Garment image URL for Fashn. Resolved from products.json by caller. */
  garmentImageUrl?: string | null;
  /** Pull from b_roll_clip table; null if no match. */
  brollSeason?: string | null;
  brollTags?: string[];
  /** Job-level abort. Vendors get child signals derived from this + per-vendor timeout. */
  jobSignal: AbortSignal;
}

export interface RenderResult {
  heygenClipId: string | null;
  heygenLocalPath: string | null;
  fashnClipId: string | null;
  fashnLocalPath: string | null;
  brollId: string | null;
  brollLocalPath: string | null;
  costCreditsTotal: number;
  /** True if at least one vendor degraded but not all. */
  partial: boolean;
  /** Layers that contributed to the final result. */
  disclosureLayers: string[];
  errors: string[];
}

interface BRollClipRow {
  id: number;
  path: string;
  duration_seconds: number;
  tags: string;
  season: string | null;
}

/**
 * F-RO-4: pick a B-roll clip by season + tag match. Falls back to no-broll
 * if nothing matches. Sprint 1 picks the FIRST match deterministically;
 * Sprint 2+ rotates by recent-use to avoid b-roll fatigue.
 */
export function pickBRoll(season: string | null, tags: string[]): BRollClipRow | null {
  const conn = db();
  // Try exact season match first, then 'all', then any.
  const seasons = [season, 'all'].filter((s): s is string => Boolean(s));
  for (const s of seasons) {
    const rows = conn.query(
      `SELECT id, path, duration_seconds, tags, season
       FROM b_roll_clip WHERE season = ? OR season = 'all'
       ORDER BY id ASC`,
    ).all(s) as BRollClipRow[];
    for (const row of rows) {
      let clipTags: string[] = [];
      try { clipTags = JSON.parse(row.tags) as string[]; } catch { /* ignore */ }
      if (tags.length === 0) return row;
      if (clipTags.some((t) => tags.includes(t))) return row;
    }
  }
  return null;
}

/**
 * F-RO-2 idempotency: if a previous render_attempt for the same hook_text +
 * avatar combo already produced a HeyGen clip, reuse it. Saves the ~$1.50
 * per HeyGen call on regen flows where Joe re-renders with the same hook.
 */
function findCachedHeygenClip(hookText: string): { clipId: string; localPath: string; cost: number } | null {
  const conn = db();
  const row = conn.query(
    `SELECT ra.heygen_clip_id, ra.cost_credits_total, v.hook_text
     FROM render_attempt ra
     JOIN variant v ON v.id = ra.variant_id
     WHERE v.hook_text = ?
       AND ra.heygen_clip_id IS NOT NULL
       AND ra.heygen_clip_id <> ''
     ORDER BY ra.id ASC LIMIT 1`,
  ).get(hookText) as { heygen_clip_id: string; cost_credits_total: number } | null;
  if (!row || !row.heygen_clip_id) return null;
  // Path convention: cache lookups assume the file persisted at the renders
  // root. We don't currently track per-attempt local paths in the schema, so
  // disable caching when the file isn't present. Sprint 1.5 fix: add
  // asset.path lookup keyed by clip_id.
  return null;
}

async function attemptHookClip(args: {
  hookText: string;
  subVariantLabel?: string;
  outputDir: string;
  jobSignal: AbortSignal;
}): Promise<{ clipId: string; localPath: string; cost: number } | { error: string }> {
  const cached = findCachedHeygenClip(args.hookText);
  if (cached) {
    log.info({ hook_text: args.hookText.slice(0, 40), reused: true }, 'heygen_cache_hit');
    return cached;
  }

  const dl = withDeadline(VENDOR_TIMEOUTS_MS.heygen);
  const signal = combineSignals(args.jobSignal, dl.signal);
  try {
    const clip = await createHookClip({
      hookText: args.hookText,
      subVariantLabel: args.subVariantLabel,
      abortSignal: signal,
    });
    const localPath = resolve(args.outputDir, 'heygen.mp4');
    await downloadHeygen(clip.videoUrl, localPath, signal);
    return { clipId: clip.videoId, localPath, cost: clip.costCredits };
  } catch (err) {
    return { error: (err as Error).message };
  } finally {
    dl.cancel();
  }
}

async function attemptShowcaseClip(args: {
  skuId: string | null;
  garmentImageUrl?: string | null;
  outputDir: string;
  jobSignal: AbortSignal;
}): Promise<{ clipId: string; localPath: string; cost: number } | { error: string } | { skipped: true }> {
  if (!args.skuId || !args.garmentImageUrl) {
    return { skipped: true };
  }
  const dl = withDeadline(VENDOR_TIMEOUTS_MS.fashn);
  const signal = combineSignals(args.jobSignal, dl.signal);
  try {
    const clip = await createShowcaseClip({
      skuId: args.skuId,
      garmentImageUrl: args.garmentImageUrl,
      abortSignal: signal,
    });
    const localPath = resolve(args.outputDir, 'fashn.mp4');
    await downloadFashn(clip.videoUrl, localPath, signal);
    return { clipId: clip.animateId, localPath, cost: clip.costCredits };
  } catch (err) {
    return { error: (err as Error).message };
  } finally {
    dl.cancel();
  }
}

/**
 * Combine multiple AbortSignals into one — fires when any input fires.
 * AbortSignal.any() is Node 20.3+ but Bun supports it.
 */
function combineSignals(...signals: AbortSignal[]): AbortSignal {
  // Bun + modern Node have AbortSignal.any. Fall back to manual wiring otherwise.
  const anyFn = (AbortSignal as unknown as { any?: (s: AbortSignal[]) => AbortSignal }).any;
  if (typeof anyFn === 'function') return anyFn(signals);
  const ctrl = new AbortController();
  for (const s of signals) {
    if (s.aborted) {
      ctrl.abort(s.reason);
      return ctrl.signal;
    }
    s.addEventListener('abort', () => ctrl.abort(s.reason), { once: true });
  }
  return ctrl.signal;
}

function dateFolder(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export async function runRender(args: RenderArgs): Promise<RenderResult> {
  const outputDir = resolve(
    RENDERS_ROOT,
    dateFolder(),
    String(args.variantId),
    String(args.attemptNumber),
  );
  await mkdir(outputDir, { recursive: true });

  const errors: string[] = [];
  const layers: string[] = [];
  let heygenResult: { clipId: string; localPath: string; cost: number } | null = null;
  let fashnResult: { clipId: string; localPath: string; cost: number } | null = null;
  let costCreditsTotal = 0;

  // Run vendors in parallel. Promise.all rejects on first throw — but each
  // vendor wrapper catches its own error and returns it instead of throwing,
  // so we always get both results.
  const [hg, fa] = await Promise.all([
    attemptHookClip({
      hookText: args.hookText,
      subVariantLabel: args.subVariantLabel,
      outputDir,
      jobSignal: args.jobSignal,
    }),
    attemptShowcaseClip({
      skuId: args.skuId,
      garmentImageUrl: args.garmentImageUrl,
      outputDir,
      jobSignal: args.jobSignal,
    }),
  ]);

  if ('error' in hg) {
    errors.push(`heygen: ${hg.error}`);
  } else {
    heygenResult = hg;
    costCreditsTotal += hg.cost;
    layers.push('heygen');
  }

  if ('skipped' in fa) {
    // No SKU = no Fashn layer; not an error, just a different ad shape.
  } else if ('error' in fa) {
    errors.push(`fashn: ${fa.error}`);
  } else {
    fashnResult = fa;
    costCreditsTotal += fa.cost;
    layers.push('fashn');
  }

  // B-roll selection. PRD F-RO-4 — best-effort, never blocking.
  let broll: BRollClipRow | null = null;
  try {
    broll = pickBRoll(args.brollSeason ?? null, args.brollTags ?? []);
    if (broll) layers.push('broll');
  } catch (err) {
    errors.push(`broll: ${(err as Error).message}`);
  }

  // Both vendors hard-failed → caller (pipeline) treats as terminal.
  if (!heygenResult && !fashnResult) {
    throw new Error(`render orchestration: both HeyGen and Fashn failed: ${errors.join('; ')}`);
  }

  // "partial" = we have something usable but not the full layer set.
  // Strict version: heygen succeeded but fashn failed (or vice-versa) AND
  // the brief had a SKU. If no SKU was supplied, fashn-skip is by design,
  // not partial.
  const fashnExpected = Boolean(args.skuId && args.garmentImageUrl);
  const fashnDelivered = fashnResult !== null;
  const heygenDelivered = heygenResult !== null;
  const partial =
    (!heygenDelivered && fashnDelivered) ||
    (heygenDelivered && fashnExpected && !fashnDelivered);

  return {
    heygenClipId: heygenResult?.clipId ?? null,
    heygenLocalPath: heygenResult?.localPath ?? null,
    fashnClipId: fashnResult?.clipId ?? null,
    fashnLocalPath: fashnResult?.localPath ?? null,
    brollId: broll ? String(broll.id) : null,
    brollLocalPath: broll ? resolveBrollPath(broll.path) : null,
    costCreditsTotal,
    partial,
    disclosureLayers: layers,
    errors,
  };
}

const BROLL_ROOT = process.env.BROLL_ROOT ?? resolve(import.meta.dir, '../../media/b-roll');
function resolveBrollPath(rel: string): string {
  return resolve(BROLL_ROOT, rel);
}
