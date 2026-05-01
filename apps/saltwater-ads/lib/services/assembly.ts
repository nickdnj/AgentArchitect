import { resolve } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { combineSignals } from '../../src/worker/deadlines.ts';

// PRD §6.1.5 + §7.4 — FFmpeg Assembly.
// Concat HeyGen + Fashn + B-roll layers, burn captions, brand overlay.
// 30 fps, -16 LUFS audio loudness, 9:16 1080p MP4.
//
// Sprint 1 simplification: caption burn-in is a single drawtext layer with the
// hook text (no per-word timing). Sprint 2 adds Whisper-generated SRT with
// proper timestamps + lower-third strip styling.
//
// FFmpeg invocation runs via Bun.spawn so we can:
//   1. Pipe stderr to pino (otherwise FFmpeg's loud output drowns the journalctl tail)
//   2. SIGKILL on AbortSignal (TODO A2: SIGKILL discipline) so a stuck filter graph
//      doesn't outlive the worker tick.
//   3. Capture exit codes properly without shell-escaping shenanigans.
//
// SAD §7.7 disclosure metadata: we embed `comment="ai_layers=heygen,fashn"` in
// the master.mp4 metadata so a downstream Meta upload can read it back.

export interface AssembleArgs {
  variantId: number;
  attemptNumber?: number;
  hookText: string;
  /** At least one of these MUST be non-null. */
  heygenMp4Path: string | null;
  fashnMp4Path: string | null;
  brollMp4Path: string | null;
  /** AI layers used — used for embedded disclosure metadata. */
  disclosureLayers: string[];
  outputDir: string;
  abortSignal: AbortSignal;
}

export interface AssembleResult {
  masterPath: string;
  srtPath: string;
  thumbPath: string;
  durationSeconds: number;
}

interface SpawnLike {
  (cmd: string[], opts: { signal?: AbortSignal; stderr?: 'pipe' | 'inherit' }): {
    exited: Promise<number>;
    stderr: ReadableStream<Uint8Array> | null;
  };
}

let _spawn: SpawnLike | null = null;
export function setFfmpegSpawnForTest(s: SpawnLike | null): void {
  _spawn = s;
}
function spawn(): SpawnLike {
  // Bun.spawn shape matches SpawnLike for our purposes.
  return _spawn ?? ((cmd, opts) => Bun.spawn(cmd, { ...opts, stderr: opts.stderr ?? 'pipe' }) as ReturnType<SpawnLike>);
}

const FFMPEG_BIN = process.env.FFMPEG_BIN ?? 'ffmpeg';
const TIMEOUT_MS = 2 * 60 * 1000;

/**
 * Cross-platform font discovery (Codex eng-review-3 #2).
 *
 * Priority order:
 *   1. CAPTION_FONT_PATH env (deploy-side override)
 *   2. assets/fonts/*.{ttf,otf,ttc} bundled with the repo
 *   3. Common Linux paths (Debian/Ubuntu DejaVu defaults)
 *   4. macOS dev fallback (Helvetica)
 *
 * The original hardcoded /System/Library/Fonts/Helvetica.ttc only existed on
 * macOS — first Linux deploy would fail at drawtext. Tests assert the resolved
 * path is non-empty (so the filter graph is always shape-valid).
 */
function captionFontPath(): string {
  const env = process.env.CAPTION_FONT_PATH;
  if (env) return env;
  const fs = require('node:fs') as typeof import('node:fs');
  const candidates = [
    // Repo-bundled (preferred — pin the brand font alongside the code).
    resolve(import.meta.dir, '../../assets/fonts/saltwater.ttf'),
    resolve(import.meta.dir, '../../assets/fonts/saltwater.otf'),
    // Linux defaults (Debian/Ubuntu base systems include DejaVu).
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf',
    // macOS dev fallback.
    '/System/Library/Fonts/Helvetica.ttc',
    '/System/Library/Fonts/Supplemental/Arial.ttf',
  ];
  for (const p of candidates) {
    try { if (fs.existsSync(p)) return p; } catch { /* keep trying */ }
  }
  // No font found anywhere. Don't silently drop the caption; surface loudly.
  throw new Error(
    'assembly: no caption font found. Set CAPTION_FONT_PATH env, drop a font in assets/fonts/, or install fonts-dejavu (Linux).',
  );
}

export interface AssemblyInput {
  path: string;
  layer: 'heygen' | 'fashn' | 'broll';
  /** True iff this input has an audio stream we want to use. */
  hasAudio?: boolean;
}

/**
 * Build the ffmpeg command for the concat-and-overlay pipeline. Exported for
 * testing: the test asserts the command shape (which inputs, which filter
 * graph, which output flags) without actually invoking ffmpeg.
 *
 * Codex eng-review-3 #1 fix: the previous filter graph assumed every input
 * had an audio stream and ran loudnorm on the video. Both wrong. New design:
 *   - Video: scale → concat (v=1:a=0) → drawtext → output
 *   - Audio: take the first input that hasAudio=true (typically heygen
 *     voiceover); apad to match concat duration, loudnorm normalize. If no
 *     input has audio, generate silent track via anullsrc.
 *   - loudnorm runs on the AUDIO chain, not video.
 */
export function buildFfmpegCommand(input: {
  inputs: AssemblyInput[];
  hookText: string;
  outputPath: string;
  thumbPath: string;
  srtPath: string;
  disclosureLayers: string[];
}): string[] {
  if (input.inputs.length === 0) {
    throw new Error('assembly: no input layers — at least one of heygen/fashn/broll must be non-null');
  }

  const cmd: string[] = [FFMPEG_BIN, '-y', '-hide_banner', '-loglevel', 'warning'];

  // -i for each input layer.
  for (const layer of input.inputs) {
    cmd.push('-i', layer.path);
  }

  // Determine the audio source: the FIRST input flagged as having audio.
  // hasAudio defaults to true ONLY for heygen (founder voiceover is the
  // standard ad audio); fashn and broll default to false unless explicitly set.
  function hasAudioForInput(inp: AssemblyInput): boolean {
    if (typeof inp.hasAudio === 'boolean') return inp.hasAudio;
    return inp.layer === 'heygen';
  }
  const audioSourceIdx = input.inputs.findIndex(hasAudioForInput);
  const audioFromInput = audioSourceIdx >= 0;

  // Synthetic silent input if no real audio source. anullsrc with cl=stereo,r=48000.
  if (!audioFromInput) {
    cmd.push('-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000');
  }
  const silentIdx = input.inputs.length; // index of the synthetic anullsrc input (only present if !audioFromInput)

  // Video chain: scale each, concat, drawtext caption.
  const scales: string[] = [];
  for (let i = 0; i < input.inputs.length; i++) {
    scales.push(`[${i}:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30[v${i}]`);
  }
  const videoConcatInputs = input.inputs.map((_, i) => `[v${i}]`).join('');
  const concatCount = input.inputs.length;

  // Caption text: white on translucent black box, lower third.
  const safeText = input.hookText
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/:/g, '\\:')
    .slice(0, 140);
  const fontPath = captionFontPath();
  const drawtext = `drawtext=fontfile=${fontPath}:text='${safeText}':fontsize=48:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=20:x=(w-text_w)/2:y=h*0.78`;

  // Audio chain: from input source (apad to match video duration) or synthetic silence,
  // then loudnorm. loudnorm runs on AUDIO not video — the previous code had this wrong.
  const audioChain = audioFromInput
    ? `[${audioSourceIdx}:a]aresample=48000,apad,loudnorm=I=-16:TP=-1.5:LRA=11[a]`
    : `[${silentIdx}:a]loudnorm=I=-16:TP=-1.5:LRA=11[a]`;

  const filterComplex = [
    scales.join(';'),
    `${videoConcatInputs}concat=n=${concatCount}:v=1:a=0[vcat]`,
    `[vcat]${drawtext}[v]`,
    audioChain,
  ].join(';');

  cmd.push('-filter_complex', filterComplex);
  cmd.push('-map', '[v]');
  cmd.push('-map', '[a]');
  cmd.push('-c:v', 'libx264');
  cmd.push('-pix_fmt', 'yuv420p');
  cmd.push('-r', '30');
  cmd.push('-c:a', 'aac');
  cmd.push('-b:a', '128k');
  // -shortest so video duration controls the cut (audio gets padded by apad).
  cmd.push('-shortest');
  cmd.push('-movflags', '+faststart');
  // Embedded metadata for AI disclosure (F-AS-5).
  if (input.disclosureLayers.length > 0) {
    cmd.push('-metadata', `comment=ai_layers=${input.disclosureLayers.join(',')}`);
  }
  cmd.push(input.outputPath);

  return cmd;
}

export function buildThumbnailCommand(masterPath: string, thumbPath: string): string[] {
  return [
    FFMPEG_BIN, '-y', '-hide_banner', '-loglevel', 'warning',
    '-ss', '1',
    '-i', masterPath,
    '-frames:v', '1',
    '-q:v', '2',
    thumbPath,
  ];
}

async function runCommand(cmd: string[], signal: AbortSignal, label: string): Promise<void> {
  const proc = spawn()(cmd, { signal, stderr: 'pipe' });
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    let stderr = '';
    if (proc.stderr) {
      try {
        const reader = proc.stderr.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          stderr += decoder.decode(value);
        }
      } catch { /* best-effort */ }
    }
    throw new Error(`assembly ${label} ffmpeg exit ${exitCode}: ${stderr.slice(-500)}`);
  }
}

/** Sprint 1 SRT: single caption spanning the whole clip duration. */
function buildSimpleSrt(hookText: string, durationSeconds: number): string {
  const end = Math.max(durationSeconds, 1);
  const fmt = (t: number): string => {
    const h = Math.floor(t / 3600).toString().padStart(2, '0');
    const m = Math.floor((t % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(t % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s},000`;
  };
  return `1\n${fmt(0)} --> ${fmt(end)}\n${hookText}\n`;
}

export async function assemble(args: AssembleArgs): Promise<AssembleResult> {
  // Codex eng-review-3 #1: only heygen carries usable audio for the founder
  // voiceover. fashn animations are silent product showcases. broll may have
  // ambient sound but at unpredictable levels — safer to drop it and let
  // loudnorm-on-heygen carry the master audio. If heygen is missing entirely,
  // assembly synthesizes silence via anullsrc.
  const inputs: AssemblyInput[] = [];
  if (args.heygenMp4Path) inputs.push({ path: args.heygenMp4Path, layer: 'heygen', hasAudio: true });
  if (args.fashnMp4Path) inputs.push({ path: args.fashnMp4Path, layer: 'fashn', hasAudio: false });
  if (args.brollMp4Path) inputs.push({ path: args.brollMp4Path, layer: 'broll', hasAudio: false });
  if (inputs.length === 0) {
    throw new Error('assembly: at least one layer required');
  }

  await mkdir(args.outputDir, { recursive: true });
  const masterPath = resolve(args.outputDir, 'master.mp4');
  const thumbPath = resolve(args.outputDir, 'thumb.jpg');
  const srtPath = resolve(args.outputDir, 'master.srt');

  // Hard ceiling. AbortController fires after TIMEOUT_MS regardless of
  // the caller's signal — combined into one signal for ffmpeg.
  const localCtrl = new AbortController();
  const timer = setTimeout(() => localCtrl.abort('ffmpeg-timeout'), TIMEOUT_MS);
  const signal = combineSignals(args.abortSignal, localCtrl.signal);

  try {
    const concatCmd = buildFfmpegCommand({
      inputs,
      hookText: args.hookText,
      outputPath: masterPath,
      thumbPath,
      srtPath,
      disclosureLayers: args.disclosureLayers,
    });
    await runCommand(concatCmd, signal, 'concat');

    const thumbCmd = buildThumbnailCommand(masterPath, thumbPath);
    await runCommand(thumbCmd, signal, 'thumb');

    // Sprint 1 SRT: simplistic single-caption spanning estimated duration.
    // Sprint 2 will swap in Whisper word-level timing.
    const estimatedDuration = inputs.length * 8; // ~8s per layer assumption
    await writeFile(srtPath, buildSimpleSrt(args.hookText, estimatedDuration));

    return {
      masterPath,
      srtPath,
      thumbPath,
      durationSeconds: estimatedDuration,
    };
  } finally {
    clearTimeout(timer);
  }
}

