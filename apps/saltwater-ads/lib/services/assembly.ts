import { resolve } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';

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
 * Build the ffmpeg command for the concat-and-overlay pipeline. Exported for
 * testing: the test asserts the command shape (which inputs, which filter
 * graph, which output flags) without actually invoking ffmpeg.
 */
export function buildFfmpegCommand(input: {
  inputs: Array<{ path: string; layer: string }>;
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

  // -i for each input layer
  for (const layer of input.inputs) {
    cmd.push('-i', layer.path);
  }

  // Filter graph: scale each layer to 1080×1920, concat them in order, drawtext caption,
  // then output. Build dynamically based on input count.
  const scales: string[] = [];
  for (let i = 0; i < input.inputs.length; i++) {
    scales.push(`[${i}:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30[v${i}]`);
    scales.push(`[${i}:a]aresample=48000[a${i}]`);
  }
  const concatInputs = input.inputs.map((_, i) => `[v${i}][a${i}]`).join('');
  const concatCount = input.inputs.length;
  // Caption: white text on a translucent black strip in the lower third.
  const safeText = input.hookText
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/:/g, '\\:')
    .slice(0, 140);
  const drawtext = `drawtext=fontfile=/System/Library/Fonts/Helvetica.ttc:text='${safeText}':fontsize=48:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=20:x=(w-text_w)/2:y=h*0.78`;
  const filterComplex = [
    scales.join(';'),
    `${concatInputs}concat=n=${concatCount}:v=1:a=1[vraw][a]`,
    `[vraw]${drawtext},loudnorm=I=-16:TP=-1.5:LRA=11[v]`,
  ].join(';');

  cmd.push('-filter_complex', filterComplex);
  cmd.push('-map', '[v]');
  cmd.push('-map', '[a]');
  cmd.push('-c:v', 'libx264');
  cmd.push('-pix_fmt', 'yuv420p');
  cmd.push('-r', '30');
  cmd.push('-c:a', 'aac');
  cmd.push('-b:a', '128k');
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
  const inputs: Array<{ path: string; layer: string }> = [];
  if (args.heygenMp4Path) inputs.push({ path: args.heygenMp4Path, layer: 'heygen' });
  if (args.fashnMp4Path) inputs.push({ path: args.fashnMp4Path, layer: 'fashn' });
  if (args.brollMp4Path) inputs.push({ path: args.brollMp4Path, layer: 'broll' });
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
