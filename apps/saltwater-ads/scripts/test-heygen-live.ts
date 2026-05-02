/**
 * Live HeyGen smoke test with per-step logging. Bypasses the adapter so
 * we can see exactly what HeyGen returns at each poll.
 *
 * Run: bun scripts/test-heygen-live.ts
 */
import { loadSecrets, secrets } from '@lib/services/secrets.ts';
import { resolve } from 'node:path';
import { existsSync, mkdirSync, statSync, createWriteStream } from 'node:fs';

loadSecrets();

const BASE = 'https://api.heygen.com';
const NICK_AVATAR = 'c9ba88cc7e5c489081723d11869e7f77';
const NICK_VOICE  = '68ab41ca436444adbce77031a98849f7';
const HOOK = "My dad and I built this polo because we couldn't find one worth wearing on the water. That's Coastal Comfort.";
const POLL_MS = 5000;
const MAX_WAIT_MS = 5 * 60 * 1000;

const ts = Date.now();
const outDir = resolve('data');
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
const outPath = resolve(outDir, `heygen-test-${ts}.mp4`);

const headers = { 'X-Api-Key': secrets.heygen(), 'content-type': 'application/json' };

console.log('[heygen] starting');
console.log('  avatar:', NICK_AVATAR, '(Gentlemen in light blue shirts)');
console.log('  voice :', NICK_VOICE, '(Nick DeMarco voice clone)');
console.log('  out   :', outPath);
console.log('');

// 1. Create
console.log('[heygen] POST /v2/video/generate');
const createT0 = Date.now();
const createRes = await fetch(`${BASE}/v2/video/generate`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    video_inputs: [{
      character: { type: 'talking_photo', talking_photo_id: NICK_AVATAR, scale: 1, offset: { x: 0, y: 0 } },
      voice: { type: 'text', voice_id: NICK_VOICE, input_text: HOOK },
      background: { type: 'color', value: '#1a3a52' },
    }],
    dimension: { width: 1080, height: 1920 },
    aspect_ratio: '9:16',
  }),
});
const createBody = await createRes.json() as any;
console.log(`  → ${createRes.status} in ${Date.now() - createT0}ms`);
console.log('  body:', JSON.stringify(createBody).slice(0, 300));

if (!createRes.ok || !createBody.data?.video_id) {
  console.error('[heygen] CREATE FAILED');
  process.exit(1);
}
const videoId = createBody.data.video_id;
console.log(`  video_id: ${videoId}`);
console.log('');

// 2. Poll
const pollT0 = Date.now();
let lastStatus: string | null = null;
let videoUrl: string | null = null;
let duration: number | null = null;

while (Date.now() - pollT0 < MAX_WAIT_MS) {
  const elapsed = Math.floor((Date.now() - pollT0) / 1000);
  const sres = await fetch(`${BASE}/v1/video_status.get?video_id=${videoId}`, { headers });
  const sbody = await sres.json() as any;
  const status = sbody.data?.status ?? 'unknown';

  if (status !== lastStatus) {
    console.log(`[heygen] +${elapsed}s status=${status} (HTTP ${sres.status})`);
    lastStatus = status;
  } else {
    process.stdout.write(`.`);
  }

  if (status === 'completed') {
    process.stdout.write('\n');
    videoUrl = sbody.data.video_url;
    duration = sbody.data.duration;
    console.log(`[heygen] COMPLETED at +${elapsed}s — duration=${duration}s`);
    console.log(`  video_url: ${videoUrl}`);
    break;
  }
  if (status === 'failed') {
    process.stdout.write('\n');
    console.error(`[heygen] FAILED at +${elapsed}s — ${JSON.stringify(sbody.data?.error)}`);
    process.exit(1);
  }
  await new Promise((r) => setTimeout(r, POLL_MS));
}

if (!videoUrl) {
  console.error('\n[heygen] TIMEOUT after 5 min — no terminal status');
  process.exit(1);
}

// 3. Download
console.log('');
console.log(`[heygen] downloading mp4…`);
const dlRes = await fetch(videoUrl);
if (!dlRes.ok || !dlRes.body) {
  console.error(`[heygen] download failed: ${dlRes.status}`);
  process.exit(1);
}
const stream = createWriteStream(outPath);
const reader = dlRes.body.getReader();
let total = 0;
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  stream.write(value);
  total += value.length;
}
stream.end();
await new Promise((r) => stream.on('finish', r));
const size = statSync(outPath).size;
console.log(`[heygen] DOWNLOAD OK — ${size} bytes (${(size/1024/1024).toFixed(2)} MB) at ${outPath}`);
