import { describe, test, expect, afterEach } from 'bun:test';
import { mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { buildFfmpegCommand, buildThumbnailCommand, assemble, setFfmpegSpawnForTest } from '@lib/services/assembly.ts';

// Lane C / F-AS-1..5: assembly's ffmpeg pipeline. We don't actually shell
// out to ffmpeg in tests — Bun.spawn is too slow + binary may not be
// present in CI. Instead, the spawn hatch lets us assert the command
// shape (filter graph, codec flags, disclosure metadata) without running.

const TMP_OUT = resolve(import.meta.dir, '../../data/test-assembly-out');

afterEach(async () => {
  await rm(TMP_OUT, { recursive: true, force: true });
  setFfmpegSpawnForTest(null);
});

describe('buildFfmpegCommand', () => {
  test('happy path: 3 layers → 3 inputs + concat=n=3 + 1080×1920 scale + drawtext caption', () => {
    const cmd = buildFfmpegCommand({
      inputs: [
        { path: '/m/heygen.mp4', layer: 'heygen' },
        { path: '/m/fashn.mp4', layer: 'fashn' },
        { path: '/m/broll.mp4', layer: 'broll' },
      ],
      hookText: 'I built this for guys like my dad.',
      outputPath: '/m/master.mp4',
      thumbPath: '/m/thumb.jpg',
      srtPath: '/m/master.srt',
      disclosureLayers: ['heygen', 'fashn'],
    });

    expect(cmd[0]).toBe('ffmpeg');
    expect(cmd).toContain('-i');
    expect(cmd).toContain('/m/heygen.mp4');
    expect(cmd).toContain('/m/fashn.mp4');
    expect(cmd).toContain('/m/broll.mp4');

    const filterIdx = cmd.indexOf('-filter_complex');
    expect(filterIdx).toBeGreaterThan(0);
    const filter = cmd[filterIdx + 1];
    expect(filter).toContain('concat=n=3:v=1:a=1');
    expect(filter).toContain('scale=1080:1920');
    expect(filter).toContain('fps=30');
    expect(filter).toContain('drawtext=');
    expect(filter).toContain('loudnorm=I=-16:TP=-1.5:LRA=11');

    expect(cmd).toContain('-c:v');
    expect(cmd).toContain('libx264');
    expect(cmd).toContain('-pix_fmt');
    expect(cmd).toContain('yuv420p');
    expect(cmd).toContain('-movflags');
    expect(cmd).toContain('+faststart');
    expect(cmd[cmd.length - 1]).toBe('/m/master.mp4');
  });

  test('disclosure metadata: ai_layers comment embedded when layers present', () => {
    const cmd = buildFfmpegCommand({
      inputs: [{ path: '/m/h.mp4', layer: 'heygen' }],
      hookText: 'short',
      outputPath: '/o.mp4', thumbPath: '/t.jpg', srtPath: '/s.srt',
      disclosureLayers: ['heygen', 'fashn'],
    });
    const metaIdx = cmd.indexOf('-metadata');
    expect(metaIdx).toBeGreaterThan(-1);
    expect(cmd[metaIdx + 1]).toBe('comment=ai_layers=heygen,fashn');
  });

  test('no AI layers (broll only) → no comment metadata embedded', () => {
    const cmd = buildFfmpegCommand({
      inputs: [{ path: '/m/b.mp4', layer: 'broll' }],
      hookText: 'broll only',
      outputPath: '/o.mp4', thumbPath: '/t.jpg', srtPath: '/s.srt',
      disclosureLayers: [],
    });
    expect(cmd).not.toContain('-metadata');
  });

  test('caption escaping: quote and backslash in hook do not break filter graph', () => {
    const cmd = buildFfmpegCommand({
      inputs: [{ path: '/m/h.mp4', layer: 'heygen' }],
      hookText: "Joe's pick: don't \\settle\\.",
      outputPath: '/o.mp4', thumbPath: '/t.jpg', srtPath: '/s.srt',
      disclosureLayers: ['heygen'],
    });
    const filter = cmd[cmd.indexOf('-filter_complex') + 1];
    expect(filter).toContain("\\'"); // single quote escaped
    expect(filter).toContain('\\\\'); // backslash escaped
    // The text='...' wrapper uses unescaped quotes (those are intentional);
    // verify the INNER content has no bare quotes between the wrappers.
    const inner = filter.match(/text='([^]*?)'(?=:fontsize)/)?.[1] ?? '';
    expect(inner).not.toMatch(/(^|[^\\])'/); // every quote inside is preceded by backslash
  });

  test('caption truncates at 140 chars (PRD §6.1.2 hook limit)', () => {
    const longHook = 'x'.repeat(200);
    const cmd = buildFfmpegCommand({
      inputs: [{ path: '/m/h.mp4', layer: 'heygen' }],
      hookText: longHook,
      outputPath: '/o.mp4', thumbPath: '/t.jpg', srtPath: '/s.srt',
      disclosureLayers: ['heygen'],
    });
    const filter = cmd[cmd.indexOf('-filter_complex') + 1];
    const drawtextMatch = filter.match(/text='([^']+)'/);
    expect(drawtextMatch).not.toBeNull();
    expect(drawtextMatch![1].length).toBeLessThanOrEqual(140);
  });

  test('throws when no input layers provided', () => {
    expect(() => buildFfmpegCommand({
      inputs: [],
      hookText: 'x',
      outputPath: '/o.mp4', thumbPath: '/t.jpg', srtPath: '/s.srt',
      disclosureLayers: [],
    })).toThrow(/at least one of heygen\/fashn\/broll/);
  });
});

describe('buildThumbnailCommand', () => {
  test('seeks to 1s, single frame, q:v 2', () => {
    const cmd = buildThumbnailCommand('/m/master.mp4', '/m/thumb.jpg');
    expect(cmd).toContain('-ss');
    expect(cmd).toContain('1');
    expect(cmd).toContain('-frames:v');
    expect(cmd[cmd.length - 1]).toBe('/m/thumb.jpg');
  });
});

describe('assemble (with stubbed spawn)', () => {
  test('happy path: spawn invoked twice (concat + thumb), srt written, returns master path', async () => {
    await mkdir(TMP_OUT, { recursive: true });
    const calls: string[][] = [];
    setFfmpegSpawnForTest((cmd) => {
      calls.push(cmd);
      return {
        exited: Promise.resolve(0),
        stderr: null,
      };
    });

    const result = await assemble({
      variantId: 1,
      attemptNumber: 1,
      hookText: 'test hook',
      heygenMp4Path: '/fake/h.mp4',
      fashnMp4Path: '/fake/f.mp4',
      brollMp4Path: null,
      disclosureLayers: ['heygen', 'fashn'],
      outputDir: TMP_OUT,
      abortSignal: new AbortController().signal,
    });

    expect(calls.length).toBe(2);
    expect(calls[0]).toContain('-filter_complex');
    expect(calls[1]).toContain('-frames:v'); // thumbnail
    expect(result.masterPath).toBe(resolve(TMP_OUT, 'master.mp4'));
    expect(result.thumbPath).toBe(resolve(TMP_OUT, 'thumb.jpg'));
    expect(result.srtPath).toBe(resolve(TMP_OUT, 'master.srt'));

    // SRT was written to disk
    const srt = await Bun.file(result.srtPath).text();
    expect(srt).toContain('test hook');
    expect(srt).toMatch(/^\d+\n\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}\n/);
  });

  test('non-zero ffmpeg exit → throws with stderr snippet', async () => {
    await mkdir(TMP_OUT, { recursive: true });
    const stderrText = 'fake ffmpeg error: filter chain busted';
    setFfmpegSpawnForTest(() => ({
      exited: Promise.resolve(1),
      stderr: new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(stderrText));
          controller.close();
        },
      }),
    }));

    await expect(assemble({
      variantId: 2,
      attemptNumber: 1,
      hookText: 'fail',
      heygenMp4Path: '/fake/h.mp4',
      fashnMp4Path: null,
      brollMp4Path: null,
      disclosureLayers: ['heygen'],
      outputDir: TMP_OUT,
      abortSignal: new AbortController().signal,
    })).rejects.toThrow(/ffmpeg exit 1.*filter chain busted/);
  });

  test('no inputs at all → throws', async () => {
    await mkdir(TMP_OUT, { recursive: true });
    await expect(assemble({
      variantId: 3,
      attemptNumber: 1,
      hookText: 'x',
      heygenMp4Path: null,
      fashnMp4Path: null,
      brollMp4Path: null,
      disclosureLayers: [],
      outputDir: TMP_OUT,
      abortSignal: new AbortController().signal,
    })).rejects.toThrow(/at least one layer/);
  });

  test('abort signal propagates to spawn', async () => {
    await mkdir(TMP_OUT, { recursive: true });
    let receivedSignal: AbortSignal | undefined;
    setFfmpegSpawnForTest((_cmd, opts) => {
      receivedSignal = opts.signal;
      return { exited: Promise.resolve(0), stderr: null };
    });

    const ctrl = new AbortController();
    await assemble({
      variantId: 4,
      attemptNumber: 1,
      hookText: 'sig',
      heygenMp4Path: '/fake/h.mp4',
      fashnMp4Path: null,
      brollMp4Path: null,
      disclosureLayers: ['heygen'],
      outputDir: TMP_OUT,
      abortSignal: ctrl.signal,
    });
    expect(receivedSignal).toBeDefined();
  });
});
