import { $ } from 'bun';
// PRD §6.1.5 + §7.4 — FFmpeg Assembly.
// Concat HeyGen + Fashn + B-roll layers, burn captions, brand overlay.
// 30 fps, -16 LUFS audio loudness, 9:16 1080p MP4.

export interface AssembleArgs {
  variantId: number;
  heygenMp4Path: string;
  fashnMp4Path: string | null;
  brollMp4Path: string | null;
  hookText: string;
  outputDir: string;          // media/renders/YYYY-MM-DD/<variant_id>/
  abortSignal: AbortSignal;
}

export interface AssembleResult {
  masterPath: string;         // master.mp4
  srtPath: string;            // master.srt (Whisper or HeyGen captions)
  thumbPath: string;          // thumb.jpg (1s frame)
  durationSeconds: number;
}

export async function assemble(_args: AssembleArgs): Promise<AssembleResult> {
  // TODO:
  //   1. ffmpeg concat with -filter_complex (matching aspect ratio + scale)
  //   2. drawtext for caption burn-in (Saltwater brand font from assets/fonts/)
  //   3. -af loudnorm=I=-16:TP=-1.5:LRA=11
  //   4. -c:v libx264 -r 30 -pix_fmt yuv420p -movflags +faststart
  //   5. Generate thumb.jpg + master.srt
  //   6. 2-min hard timeout via abortSignal
  void $;   // tactical no-op so the import isn't unused
  throw new Error('not_implemented: assembly.assemble');
}
