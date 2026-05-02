import { secrets } from '@lib/services/secrets.ts';
import {
  throwIfAborted,
  abortableSleep,
  vendorError,
  downloadToFile,
  type Fetcher,
} from './_abort.ts';

const VENDOR = 'Fashn';

// Fashn.ai try-on + animate API adapter. PRD §6.1.4 F-RO-3.
//
// V-VERIFY 2026-05-02: confirmed against docs.fashn.ai. All Fashn jobs
// post to a single /v1/run endpoint with a {model_name, inputs} envelope.
// Poll /v1/status/<id> until status='completed' or 'failed'.
//
//   1. POST /v1/run { model_name: 'tryon-max', inputs: { product_image, model_image } }
//      → returns { id, error: null }
//   2. Poll GET /v1/status/<id> until status='completed'
//      → returns { id, status, output: [imageUrl], error: null }
//   3. POST /v1/run { model_name: 'image-to-video', inputs: { image, prompt, duration } }
//      → returns { id }
//   4. Poll until completed → output: [mp4Url]
//   5. Download
//
// Failure shape: { id, status: 'failed', error: { name, message } }
//
// Sprint 1 budget: 8 min (480s) end-to-end. Polling cadence: 5s.
// Two-step (try-on → image-to-video) is why budget is ~60% longer than HeyGen.
//
// duration: Fashn only accepts 5 or 10 seconds for image-to-video. We use
// 5s (default) to keep cost down — a 5s hook is plenty for a TikTok loop.
// Bump to 10 if Joe wants longer.
//
// Cost: Fashn Pro ~$99/mo for 1500 try-on credits (≈ $0.07/try-on) +
// $0.20/animation. Caching by (sku_id + archetype_ref) avoids re-billing
// when multiple briefs ship the same SKU.

const FASHN_BASE = 'https://api.fashn.ai/v1';
function pollIntervalMs(): number { return Number(process.env.FASHN_POLL_MS ?? 5000); }
function archetypeRefUrl(): string { return process.env.FASHN_ARCHETYPE_REF_URL ?? 'https://saltwater-ads.test/fashn/older-joe-archetype.jpg'; }

let _fetch: Fetcher | null = null;
export function setFashnFetchForTest(f: Fetcher | null): void {
  _fetch = f;
}
function fetcher(): Fetcher {
  return _fetch ?? (globalThis.fetch as Fetcher);
}

function authHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${secrets.fashn()}`,
    'content-type': 'application/json',
  };
}

interface RunResponse { id?: string }
interface StatusResponse {
  status?: 'starting' | 'in_queue' | 'processing' | 'completed' | 'failed';
  output?: string[] | string | null;
  error?: { message?: string } | string | null;
}

interface StatusResponseV2 extends StatusResponse {
  error?: { name?: string; message?: string } | string | null;
}

async function pollUntilDone(id: string, label: string, signal: AbortSignal): Promise<string> {
  for (let i = 0; ; i++) {
    throwIfAborted(signal, VENDOR, `${label}-poll-${i}`);
    const r = await fetcher()(`${FASHN_BASE}/status/${encodeURIComponent(id)}`, {
      headers: authHeaders(),
      signal,
    });
    if (!r.ok) throw await vendorError(VENDOR, `${label}-status`, r);
    const body = (await r.json()) as StatusResponseV2;
    if (body.status === 'completed') {
      const out = body.output;
      const url = Array.isArray(out) ? out[0] : out;
      if (!url) throw new Error(`Fashn ${label} completed without output url`);
      return url;
    }
    if (body.status === 'failed') {
      const msg = typeof body.error === 'string'
        ? body.error
        : body.error?.message ?? body.error?.name ?? 'unknown';
      throw new Error(`Fashn ${label} failed: ${msg}`);
    }
    await abortableSleep(pollIntervalMs(), signal, VENDOR);
  }
}

export interface CreateShowcaseClipArgs {
  /** SKU id used for asset paths + idempotency cache key. */
  skuId: string;
  /** Public URL or path for the SKU garment image. */
  garmentImageUrl: string;
  /** Visual prompt for the animation phase (coastal background, etc.). */
  animatePrompt?: string;
  /** Override the archetype reference for the try-on phase. */
  archetypeRefUrl?: string;
  abortSignal: AbortSignal;
}

export interface FashnClip {
  /** Try-on job id (intermediate). */
  tryonId: string;
  /** Animate job id (final clip). */
  animateId: string;
  videoUrl: string;
  costCredits: number;
}

export async function createShowcaseClip(args: CreateShowcaseClipArgs): Promise<FashnClip> {
  // Step 1: try-on (model_name=tryon-max)
  throwIfAborted(args.abortSignal, VENDOR, 'before-tryon');
  const tryonReq = await fetcher()(`${FASHN_BASE}/run`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      model_name: 'tryon-max',
      inputs: {
        product_image: args.garmentImageUrl,
        model_image: args.archetypeRefUrl ?? archetypeRefUrl(),
      },
    }),
    signal: args.abortSignal,
  });
  if (!tryonReq.ok) throw await vendorError(VENDOR, 'tryon-run', tryonReq);
  const tryonBody = (await tryonReq.json()) as RunResponse;
  const tryonId = tryonBody.id;
  if (!tryonId) throw new Error('Fashn try-on returned no id');

  const tryonImageUrl = await pollUntilDone(tryonId, 'tryon', args.abortSignal);

  // Step 2: animate (model_name=image-to-video — same /v1/run endpoint)
  throwIfAborted(args.abortSignal, VENDOR, 'before-animate');
  const animateReq = await fetcher()(`${FASHN_BASE}/run`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      model_name: 'image-to-video',
      inputs: {
        image: tryonImageUrl,
        prompt: args.animatePrompt ?? 'coastal background, gentle ocean breeze, natural lighting',
        duration: 5,
      },
    }),
    signal: args.abortSignal,
  });
  if (!animateReq.ok) throw await vendorError(VENDOR, 'animate-run', animateReq);
  const animateBody = (await animateReq.json()) as RunResponse;
  const animateId = animateBody.id;
  if (!animateId) throw new Error('Fashn animate returned no id');

  const videoUrl = await pollUntilDone(animateId, 'animate', args.abortSignal);

  return {
    tryonId,
    animateId,
    videoUrl,
    // Pro plan: $0.07 try-on + $0.20 animate. Approx as credit-equivalent.
    costCredits: 27,
  };
}

export async function downloadClip(url: string, destPath: string, signal: AbortSignal): Promise<string> {
  return downloadToFile(fetcher(), url, destPath, signal, VENDOR);
}
