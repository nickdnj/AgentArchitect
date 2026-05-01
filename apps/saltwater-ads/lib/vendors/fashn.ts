import { secrets } from '@lib/services/secrets.ts';

// Fashn.ai try-on + animate API adapter. PRD §6.1.4 F-RO-3.
//
// Real flow (per fashn.ai/docs):
//   1. POST /v1/run { model_image, garment_image, category }
//      → returns { id }
//   2. Poll GET /v1/status/<id> until status='completed'
//      → returns { output: [imageUrl] }
//   3. POST /v1/animate { image_url, prompt, duration_seconds }
//      → returns { id }
//   4. Poll until completed → mp4 url
//   5. Download
//
// Sprint 1 budget: 8 min (480s) end-to-end. Polling cadence: 5s.
// Two-step (try-on → animate) is why budget is ~60% longer than HeyGen.
//
// Cost: Fashn Pro ~$99/mo for 1500 try-on credits (≈ $0.07/try-on) +
// $0.20/animation. Caching by (sku_id + archetype_ref) avoids re-billing
// when multiple briefs ship the same SKU.

const FASHN_BASE = 'https://api.fashn.ai/v1';
function pollIntervalMs(): number { return Number(process.env.FASHN_POLL_MS ?? 5000); }
function archetypeRefUrl(): string { return process.env.FASHN_ARCHETYPE_REF_URL ?? 'https://saltwater-ads.test/fashn/older-joe-archetype.jpg'; }

type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;
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

async function fashnError(label: string, r: Response): Promise<Error> {
  let snippet = '';
  try { snippet = (await r.text()).slice(0, 200); } catch { snippet = '<unreadable>'; }
  return new Error(`Fashn ${label} failed: ${r.status} ${r.statusText} — ${snippet}`);
}

function throwIfAborted(signal: AbortSignal, where: string): void {
  if (signal.aborted) {
    const reason = typeof signal.reason === 'string' ? signal.reason : 'aborted';
    throw new Error(`Fashn aborted at ${where}: ${reason}`);
  }
}

async function abortableSleep(ms: number, signal: AbortSignal): Promise<void> {
  if (signal.aborted) throw new Error('Fashn aborted before sleep');
  await new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    const onAbort = () => {
      clearTimeout(t);
      const reason = typeof signal.reason === 'string' ? signal.reason : 'aborted';
      reject(new Error(`Fashn aborted during sleep: ${reason}`));
    };
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

interface RunResponse { id?: string }
interface StatusResponse {
  status?: 'starting' | 'in_queue' | 'processing' | 'completed' | 'failed';
  output?: string[] | string | null;
  error?: { message?: string } | string | null;
}

async function pollUntilDone(id: string, label: string, signal: AbortSignal): Promise<string> {
  for (let i = 0; ; i++) {
    throwIfAborted(signal, `${label}-poll-${i}`);
    const r = await fetcher()(`${FASHN_BASE}/status/${encodeURIComponent(id)}`, {
      headers: authHeaders(),
      signal,
    });
    if (!r.ok) throw await fashnError(`${label}-status`, r);
    const body = (await r.json()) as StatusResponse;
    if (body.status === 'completed') {
      const out = body.output;
      const url = Array.isArray(out) ? out[0] : out;
      if (!url) throw new Error(`Fashn ${label} completed without output url`);
      return url;
    }
    if (body.status === 'failed') {
      const msg = typeof body.error === 'string' ? body.error : body.error?.message ?? 'unknown';
      throw new Error(`Fashn ${label} failed: ${msg}`);
    }
    await abortableSleep(pollIntervalMs(), signal);
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
  // Step 1: try-on
  throwIfAborted(args.abortSignal, 'before-tryon');
  const tryonReq = await fetcher()(`${FASHN_BASE}/run`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      model_image: args.archetypeRefUrl ?? archetypeRefUrl(),
      garment_image: args.garmentImageUrl,
      category: 'tops',
    }),
    signal: args.abortSignal,
  });
  if (!tryonReq.ok) throw await fashnError('tryon-run', tryonReq);
  const tryonBody = (await tryonReq.json()) as RunResponse;
  const tryonId = tryonBody.id;
  if (!tryonId) throw new Error('Fashn try-on returned no id');

  const tryonImageUrl = await pollUntilDone(tryonId, 'tryon', args.abortSignal);

  // Step 2: animate
  throwIfAborted(args.abortSignal, 'before-animate');
  const animateReq = await fetcher()(`${FASHN_BASE}/animate`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      image_url: tryonImageUrl,
      prompt: args.animatePrompt ?? 'coastal background, gentle ocean breeze, natural lighting',
      duration_seconds: 8,
    }),
    signal: args.abortSignal,
  });
  if (!animateReq.ok) throw await fashnError('animate-run', animateReq);
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
  throwIfAborted(signal, 'download');
  const r = await fetcher()(url, { signal });
  if (!r.ok) throw await fashnError('download', r);
  const buf = await r.arrayBuffer();
  await Bun.write(destPath, buf);
  return destPath;
}
