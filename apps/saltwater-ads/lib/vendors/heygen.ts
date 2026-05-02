import { secrets } from '@lib/services/secrets.ts';
import {
  throwIfAborted,
  abortableSleep,
  vendorError,
  downloadToFile,
  type Fetcher,
} from './_abort.ts';

const VENDOR = 'HeyGen';

// HeyGen Photo Avatar API adapter. PRD §6.1.4 F-RO-2.
//
// Real flow (per docs.heygen.com/v2):
//   1. POST /v2/video/generate { input_text, voice_id, photo_avatar_id, ... }
//      → returns { video_id }
//   2. Poll GET /v1/video_status.get?video_id=... every 5–10s until status='completed'
//      → returns { video_url, duration }
//   3. Download video_url to disk
//
// Sprint 1 budget: 5 min (300s) end-to-end. Polling cadence: 5s.
// On timeout via AbortSignal, throw a clearly-labeled error so the
// orchestrator can degrade to "partial" instead of crashing the worker.
//
// Cost: HeyGen Team plan ~$89/mo for 60 video credits/mo (≈ $1.50/clip).
// Cached by (hook_text + photo_avatar_id) at the orchestrator level.

const HEYGEN_BASE = 'https://api.heygen.com';
function pollIntervalMs(): number { return Number(process.env.HEYGEN_POLL_MS ?? 5000); }
function defaultAvatarId(): string { return process.env.HEYGEN_AVATAR_ID ?? 'joe-demarco-photo-avatar'; }
function defaultVoiceId(): string { return process.env.HEYGEN_VOICE_ID ?? 'joe-demarco-voice'; }

let _fetch: Fetcher | null = null;
export function setHeygenFetchForTest(f: Fetcher | null): void {
  _fetch = f;
}
function fetcher(): Fetcher {
  return _fetch ?? (globalThis.fetch as Fetcher);
}

function authHeaders(): HeadersInit {
  return {
    'X-Api-Key': secrets.heygen(),
    'content-type': 'application/json',
  };
}

export interface CreateHookClipArgs {
  hookText: string;
  /** Sub-variant label V1/V2/V3 — included in the request for HeyGen analytics. */
  subVariantLabel?: string;
  photoAvatarId?: string;
  voiceId?: string;
  abortSignal: AbortSignal;
}

export interface HeygenClip {
  videoId: string;
  videoUrl: string;
  durationSeconds: number;
  /** Credit consumption — used by the per-ad cost ledger (F-RO-6). */
  costCredits: number;
}

interface CreateResponse { data?: { video_id?: string } }
interface StatusResponse {
  data?: {
    status?: 'pending' | 'processing' | 'completed' | 'failed' | 'waiting';
    video_url?: string | null;
    duration?: number | null;
    error?: { detail?: string } | null;
    callback_id?: string;
  };
}

export async function createHookClip(args: CreateHookClipArgs): Promise<HeygenClip> {
  throwIfAborted(args.abortSignal, VENDOR, 'before-create');

  // V-VERIFY 2026-05-01: live API rejected type:'photo_avatar' / photo_avatar_id.
  // Real shape uses type:'talking_photo' / talking_photo_id (the Photo Avatar IDs
  // returned by /v1/talking_photo.list and /v2/avatars.talking_photos[].talking_photo_id).
  const create = await fetcher()(`${HEYGEN_BASE}/v2/video/generate`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      video_inputs: [
        {
          character: {
            type: 'talking_photo',
            talking_photo_id: args.photoAvatarId ?? defaultAvatarId(),
            scale: 1,
            offset: { x: 0, y: 0 },
          },
          voice: {
            type: 'text',
            voice_id: args.voiceId ?? defaultVoiceId(),
            input_text: args.hookText,
          },
          background: { type: 'color', value: '#1a3a52' },
        },
      ],
      dimension: { width: 1080, height: 1920 },
      aspect_ratio: '9:16',
    }),
    signal: args.abortSignal,
  });
  if (!create.ok) throw await vendorError(VENDOR, 'video.generate', create);
  const createBody = (await create.json()) as CreateResponse;
  const videoId = createBody.data?.video_id;
  if (!videoId) throw new Error('HeyGen video.generate returned no video_id');

  // Poll until done OR aborted.
  for (let i = 0; ; i++) {
    throwIfAborted(args.abortSignal, VENDOR, `poll-${i}`);
    const status = await fetcher()(
      `${HEYGEN_BASE}/v1/video_status.get?video_id=${encodeURIComponent(videoId)}`,
      { headers: authHeaders(), signal: args.abortSignal },
    );
    if (!status.ok) throw await vendorError(VENDOR, 'video_status.get', status);
    const body = (await status.json()) as StatusResponse;
    const s = body.data?.status;

    if (s === 'completed') {
      const url = body.data?.video_url;
      if (!url) throw new Error('HeyGen completed without video_url');
      return {
        videoId,
        videoUrl: url,
        durationSeconds: body.data?.duration ?? 0,
        // HeyGen doesn't return per-job credit cost in v2; we approximate
        // by duration. Refined when ops actually wires real billing.
        costCredits: Math.max(1, Math.ceil((body.data?.duration ?? 8) / 30)),
      };
    }
    if (s === 'failed') {
      const detail = body.data?.error?.detail ?? 'unknown failure';
      throw new Error(`HeyGen video failed: ${detail}`);
    }
    // pending | processing | waiting — keep polling.
    await abortableSleep(pollIntervalMs(), args.abortSignal, VENDOR);
  }
}

export async function downloadClip(url: string, destPath: string, signal: AbortSignal): Promise<string> {
  return downloadToFile(fetcher(), url, destPath, signal, VENDOR);
}
