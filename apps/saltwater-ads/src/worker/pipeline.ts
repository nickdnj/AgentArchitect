import { resolve } from 'node:path';
import { db } from '@db/client.ts';
import { log } from '@lib/log.ts';
import type { ClaimedJob } from './tick.ts';
import { runHookGenerator } from '@lib/services/hook-generator.ts';
import { runRender } from '@lib/services/render-orchestrator.ts';
import { assemble } from '@lib/services/assembly.ts';
import { withDeadline, VENDOR_TIMEOUTS_MS } from './deadlines.ts';
import type { BriefShape } from '@lib/llm/types.ts';

// SAD §3 + §4 — runs one render_attempt through the state machine.
//
//   queued
//   → hooks_generating  (Hook Generator — one LLM call per hook_set)
//   → hooks_ready
//   → vendor_pending    (HeyGen + Fashn parallel with per-vendor timeouts)
//   → partial           (one or both vendors complete)
//   → assembling        (FFmpeg)
//   → ready_for_review
//
// Pipeline is invoked by tick.ts AFTER tick has already advanced state from
// queued → hooks_generating (or hooks_ready → vendor_pending, partial → assembling).
// Pipeline owns the single forward step and the corresponding state advance.
//
// Hook generation lock: 3 variants share one hook_set. We don't want 3 LLM
// calls per brief. The first attempt to hit hooks_generating "wins" the lock
// (compare-and-swap on hook_set.status='pending' → 'generating'). Other
// attempts wait until status='ready' and then transition themselves.
//
// A1 contract: every throw out of runPipeline becomes failed_recoverable
// via tick.ts's markFailed catch handler. Don't try to handle errors here —
// just let them propagate.

// Read at call time so tests can override via env after module load.
function hookLockPollMs(): number { return Number(process.env.HOOK_LOCK_POLL_MS ?? 1500); }
function hookLockMaxWaitMs(): number { return Number(process.env.HOOK_LOCK_MAX_WAIT_MS ?? 90 * 1000); }

interface VariantRow {
  id: number;
  hook_set_id: number;
  hook_text: string;
  sub_variant_label: string;
  sku_id: string | null;
  pattern: string | null;
}
interface HookSetRow {
  id: number;
  brief_id: number;
  brand_bucket_version_id: number;
  status: string;
  prompt_hash: string;
}
interface BriefRow {
  id: number;
  free_text: string;
  sku_id: string | null;
  pattern: string | null;
  audience_tag: string | null;
  season: string | null;
}
interface RenderAttemptRow {
  id: number;
  variant_id: number;
  attempt_number: number;
  state: string;
  heygen_clip_id: string | null;
  fashn_clip_id: string | null;
  broll_id: string | null;
  cost_credits_total: number;
}

function loadAttempt(attemptId: number): RenderAttemptRow {
  const row = db().query(
    `SELECT id, variant_id, attempt_number, state, heygen_clip_id, fashn_clip_id, broll_id, cost_credits_total
     FROM render_attempt WHERE id = ?`,
  ).get(attemptId) as RenderAttemptRow | null;
  if (!row) throw new Error(`pipeline: render_attempt ${attemptId} not found`);
  return row;
}

function loadVariant(variantId: number): VariantRow {
  const row = db().query(
    `SELECT id, hook_set_id, hook_text, sub_variant_label, sku_id, pattern
     FROM variant WHERE id = ?`,
  ).get(variantId) as VariantRow | null;
  if (!row) throw new Error(`pipeline: variant ${variantId} not found`);
  return row;
}

function loadHookSet(hookSetId: number): HookSetRow {
  const row = db().query(
    `SELECT id, brief_id, brand_bucket_version_id, status, prompt_hash
     FROM hook_set WHERE id = ?`,
  ).get(hookSetId) as HookSetRow | null;
  if (!row) throw new Error(`pipeline: hook_set ${hookSetId} not found`);
  return row;
}

function loadBrief(briefId: number): BriefRow {
  const row = db().query(
    `SELECT id, free_text, sku_id, pattern, audience_tag, season
     FROM brief WHERE id = ?`,
  ).get(briefId) as BriefRow | null;
  if (!row) throw new Error(`pipeline: brief ${briefId} not found`);
  return row;
}

/**
 * Compare-and-swap on hook_set.status to acquire the LLM lock.
 * Returns true if THIS attempt is responsible for the LLM call.
 */
function tryAcquireHookSetLock(hookSetId: number): boolean {
  const res = db().run(
    `UPDATE hook_set SET status = 'generating' WHERE id = ? AND status = 'pending'`,
    [hookSetId],
  );
  return res.changes === 1;
}

async function awaitHookSetReady(hookSetId: number, jobSignal: AbortSignal): Promise<HookSetRow> {
  const maxWait = hookLockMaxWaitMs();
  const pollMs = hookLockPollMs();
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    if (jobSignal.aborted) throw new Error('pipeline: aborted while awaiting hook_set lock');
    const hs = loadHookSet(hookSetId);
    if (hs.status === 'ready') return hs;
    if (hs.status === 'failed') {
      throw new Error(`hook_set ${hookSetId} failed during parallel hook generation`);
    }
    await new Promise<void>((resolve) => setTimeout(resolve, pollMs));
  }
  throw new Error(`hook_set ${hookSetId} did not finish hook generation within ${maxWait}ms`);
}

/**
 * Pick the (mainAngle, subVariant) entry for a given V1/V2/V3 sub-variant.
 * Sprint 1 uses main angle 0 only — the other two main angles are stored in
 * the hook_set for analytics but not surfaced. The sub-variant label maps
 * 1:1 to index 0/1/2 of variants[0].
 */
function hookForSubVariant(hookSet: { variants: Array<Array<{ hook_text: string; pattern: string }>> }, label: string): { hookText: string; pattern: string } {
  const idx = label === 'V1' ? 0 : label === 'V2' ? 1 : label === 'V3' ? 2 : -1;
  if (idx < 0) throw new Error(`unknown sub_variant_label: ${label}`);
  const v = hookSet.variants[0]?.[idx];
  if (!v) throw new Error(`hookSet missing variants[0][${idx}]`);
  return { hookText: v.hook_text, pattern: v.pattern };
}

async function runHooksGeneratingStep(attempt: RenderAttemptRow): Promise<void> {
  const variant = loadVariant(attempt.variant_id);
  const hookSet = loadHookSet(variant.hook_set_id);

  if (hookSet.status === 'ready') {
    // Another attempt already populated the hook_set. Just transition self.
    db().run(
      `UPDATE render_attempt SET state = 'hooks_ready' WHERE id = ? AND state = 'hooks_generating'`,
      [attempt.id],
    );
    return;
  }

  const acquired = tryAcquireHookSetLock(variant.hook_set_id);
  if (!acquired) {
    // Wait for the lock-holder to finish, then transition self.
    const ready = await awaitHookSetReady(variant.hook_set_id, AbortSignal.timeout(hookLockMaxWaitMs()));
    if (ready.status !== 'ready') {
      throw new Error(`hook_set ${variant.hook_set_id} did not become ready`);
    }
    db().run(
      `UPDATE render_attempt SET state = 'hooks_ready' WHERE id = ? AND state = 'hooks_generating'`,
      [attempt.id],
    );
    return;
  }

  // Lock acquired. Run the LLM call.
  try {
    const brief = loadBrief(hookSet.brief_id);
    const briefShape: BriefShape = {
      free_text: brief.free_text,
      sku_id: brief.sku_id,
      pattern: (brief.pattern ?? null) as BriefShape['pattern'],
      audience_tag: brief.audience_tag,
      season: brief.season,
    };
    const result = await runHookGenerator({
      brief: briefShape,
      brandBucketVersionId: hookSet.brand_bucket_version_id,
    });

    // Populate all three variants of THIS hook_set + advance their attempts.
    const variants = db().query(
      `SELECT id, sub_variant_label FROM variant WHERE hook_set_id = ? ORDER BY id ASC`,
    ).all(hookSet.id) as Array<{ id: number; sub_variant_label: string }>;

    db().transaction(() => {
      for (const v of variants) {
        const { hookText, pattern } = hookForSubVariant(result.generation.hookSet, v.sub_variant_label);
        db().run(
          `UPDATE variant SET hook_text = ?, pattern = ?, status = 'queued' WHERE id = ?`,
          [hookText, pattern, v.id],
        );
      }
      db().run(
        `UPDATE hook_set SET status = 'ready', model = ?, prompt_hash = ? WHERE id = ?`,
        [result.generation.model, result.generation.promptHash, hookSet.id],
      );
      // Advance THIS attempt to hooks_ready. Other attempts in queued state
      // remain queued — tick.ts will pick them up on the next pass and they'll
      // see hook_set.status='ready' (top-of-function early-return path).
      db().run(
        `UPDATE render_attempt SET state = 'hooks_ready' WHERE id = ? AND state = 'hooks_generating'`,
        [attempt.id],
      );
    })();

    log.info(
      {
        hook_set_id: hookSet.id,
        attempt_id: attempt.id,
        regen_attempts: result.regenAttempts,
        rejected: result.rejected.length,
        tokens_input: result.generation.tokensInput,
        tokens_output: result.generation.tokensOutput,
        cache_read: result.generation.cacheReadTokens,
        cache_write: result.generation.cacheWriteTokens,
      },
      'hook_generation_complete',
    );
  } catch (err) {
    // Mark hook_set failed so other attempts unblock instead of polling forever.
    db().run(`UPDATE hook_set SET status = 'failed' WHERE id = ?`, [hookSet.id]);
    throw err;
  }
}

async function runVendorPendingStep(attempt: RenderAttemptRow, jobSignal: AbortSignal): Promise<void> {
  const variant = loadVariant(attempt.variant_id);
  if (!variant.hook_text) {
    throw new Error(`variant ${variant.id} has no hook_text — hook generation should have populated it`);
  }

  // Garment image lookup: products.json maps sku_id → image. Sprint 1 keeps
  // it lazy (read at render time). Sprint 2 caches the brand bucket parse.
  let garmentImageUrl: string | null = null;
  if (variant.sku_id) {
    garmentImageUrl = lookupGarmentImage(variant.sku_id, attempt);
  }

  const result = await runRender({
    variantId: variant.id,
    hookText: variant.hook_text,
    skuId: variant.sku_id,
    attemptNumber: attempt.attempt_number,
    subVariantLabel: variant.sub_variant_label,
    garmentImageUrl,
    brollSeason: null,
    brollTags: [],
    jobSignal,
  });

  // Stash local paths in the asset table so assembly can pick them up.
  // We use one asset per layer — type='mp4' for videos.
  const conn = db();
  conn.transaction(() => {
    if (result.heygenLocalPath) {
      conn.run(
        `INSERT INTO asset (render_attempt_id, type, path, ai_disclosure_layers)
         VALUES (?, 'mp4', ?, ?)`,
        [attempt.id, result.heygenLocalPath, JSON.stringify(['heygen'])],
      );
    }
    if (result.fashnLocalPath) {
      conn.run(
        `INSERT INTO asset (render_attempt_id, type, path, ai_disclosure_layers)
         VALUES (?, 'mp4', ?, ?)`,
        [attempt.id, result.fashnLocalPath, JSON.stringify(['fashn'])],
      );
    }
    if (result.brollLocalPath) {
      conn.run(
        `INSERT INTO asset (render_attempt_id, type, path, ai_disclosure_layers)
         VALUES (?, 'mp4', ?, NULL)`,
        [attempt.id, result.brollLocalPath],
      );
    }
    conn.run(
      `UPDATE render_attempt
       SET heygen_clip_id = ?, fashn_clip_id = ?, broll_id = ?,
           cost_credits_total = ?, state = 'partial'
       WHERE id = ? AND state = 'vendor_pending'`,
      [
        result.heygenClipId,
        result.fashnClipId,
        result.brollId,
        result.costCreditsTotal,
        attempt.id,
      ],
    );
  })();

  log.info(
    {
      attempt_id: attempt.id,
      variant_id: variant.id,
      partial: result.partial,
      layers: result.disclosureLayers,
      cost_credits: result.costCreditsTotal,
      errors: result.errors.length,
    },
    'render_complete',
  );
}

async function runAssemblingStep(attempt: RenderAttemptRow, jobSignal: AbortSignal): Promise<void> {
  const variant = loadVariant(attempt.variant_id);

  // Pull asset paths for this attempt.
  const rows = db().query(
    `SELECT path, ai_disclosure_layers FROM asset WHERE render_attempt_id = ? AND type = 'mp4' ORDER BY id ASC`,
  ).all(attempt.id) as Array<{ path: string; ai_disclosure_layers: string | null }>;

  let heygenPath: string | null = null;
  let fashnPath: string | null = null;
  let brollPath: string | null = null;
  const allLayers: string[] = [];
  for (const row of rows) {
    let layers: string[] = [];
    if (row.ai_disclosure_layers) {
      try { layers = JSON.parse(row.ai_disclosure_layers) as string[]; } catch { /* ignore */ }
    }
    if (layers.includes('heygen')) heygenPath = row.path;
    if (layers.includes('fashn')) fashnPath = row.path;
    if (layers.length === 0) brollPath = row.path;
    for (const l of layers) if (!allLayers.includes(l)) allLayers.push(l);
  }

  if (!heygenPath && !fashnPath && !brollPath) {
    throw new Error(`attempt ${attempt.id} has no usable assets to assemble`);
  }

  const dl = withDeadline(VENDOR_TIMEOUTS_MS.ffmpeg);
  const signal = combineSignals(jobSignal, dl.signal);
  try {
    const dateFolder = new Date().toISOString().slice(0, 10);
    const outputDir = resolve(
      process.env.RENDERS_ROOT ?? resolve(import.meta.dir, '../../media/renders'),
      dateFolder,
      String(variant.id),
      String(attempt.attempt_number),
    );

    const result = await assemble({
      variantId: variant.id,
      attemptNumber: attempt.attempt_number,
      hookText: variant.hook_text,
      heygenMp4Path: heygenPath,
      fashnMp4Path: fashnPath,
      brollMp4Path: brollPath,
      disclosureLayers: allLayers,
      outputDir,
      abortSignal: signal,
    });

    db().transaction(() => {
      db().run(
        `INSERT INTO asset (render_attempt_id, type, path, ai_disclosure_layers)
         VALUES (?, 'mp4', ?, ?)`,
        [attempt.id, result.masterPath, JSON.stringify(allLayers)],
      );
      db().run(
        `INSERT INTO asset (render_attempt_id, type, path) VALUES (?, 'jpg', ?)`,
        [attempt.id, result.thumbPath],
      );
      db().run(
        `INSERT INTO asset (render_attempt_id, type, path) VALUES (?, 'srt', ?)`,
        [attempt.id, result.srtPath],
      );
      db().run(
        `UPDATE render_attempt
         SET state = 'ready_for_review', finished_at = CURRENT_TIMESTAMP
         WHERE id = ? AND state = 'assembling'`,
        [attempt.id],
      );
      db().run(
        `UPDATE variant SET status = 'ready_for_review' WHERE id = ?`,
        [variant.id],
      );
    })();

    log.info(
      {
        attempt_id: attempt.id,
        variant_id: variant.id,
        master_path: result.masterPath,
        duration_seconds: result.durationSeconds,
      },
      'assembly_complete',
    );
  } finally {
    dl.cancel();
  }
}

function lookupGarmentImage(skuId: string, attempt: RenderAttemptRow): string | null {
  // The brand-bucket-manager owns the products.json read; for Sprint 1 we
  // just look up the sku by id and pick the first image. If the products
  // file isn't available or the sku isn't found, return null and Fashn
  // will be skipped (no SKU = no showcase layer, by design).
  try {
    // Lazy import to avoid circular deps if this grows.
    void attempt;
    const fs = require('node:fs') as typeof import('node:fs');
    const path = require('node:path') as typeof import('node:path');
    const productsPath = process.env.SALTWATER_PRODUCTS_JSON
      ?? path.resolve(
        import.meta.dir,
        '../../../../context-buckets/saltwater-brand/files/products.json',
      );
    if (!fs.existsSync(productsPath)) return null;
    const products = JSON.parse(fs.readFileSync(productsPath, 'utf8')) as {
      skus?: Array<{ id?: string; image?: string; images?: string[] }>;
    };
    const sku = products.skus?.find((s) => s.id === skuId);
    if (!sku) return null;
    return sku.image ?? sku.images?.[0] ?? null;
  } catch {
    return null;
  }
}

function combineSignals(...signals: AbortSignal[]): AbortSignal {
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

export async function runPipeline(job: ClaimedJob): Promise<void> {
  const attempt = loadAttempt(job.renderAttemptId);
  if (attempt.state !== job.state) {
    // Someone else moved the attempt between claim and pipeline-run. Skip.
    log.warn(
      { attempt_id: attempt.id, expected: job.state, actual: attempt.state },
      'pipeline_state_drift_skipped',
    );
    return;
  }

  // A3 totalJob ceiling — wraps the whole step. tick.ts also has a sweep
  // that catches anything that escapes this (e.g., bun --hot restart mid-step).
  const total = withDeadline(VENDOR_TIMEOUTS_MS.totalJob);
  try {
    if (attempt.state === 'hooks_generating') {
      await runHooksGeneratingStep(attempt);
    } else if (attempt.state === 'vendor_pending') {
      await runVendorPendingStep(attempt, total.signal);
    } else if (attempt.state === 'assembling') {
      await runAssemblingStep(attempt, total.signal);
    } else {
      throw new Error(`pipeline: unexpected state ${attempt.state}`);
    }
  } finally {
    total.cancel();
  }
}
