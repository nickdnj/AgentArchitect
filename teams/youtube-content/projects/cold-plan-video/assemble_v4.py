#!/usr/bin/env python3
"""
Cold Plan Video Assembly v4
Removes text overlays from brand breakdown scenes 07, 08, 09, 11, 12.
The gpt-image-1 recipe card images already have brand names and price
comparisons baked in — the overlays were redundant.

Everything else (images, audio, timing, motion styles) is identical to v3.
Only the 5 affected segments are regenerated; all others are reused.

Output: output/cold-plan-final-v3.mp4
"""

import subprocess
import os
import sys
import numpy as np

PROJECT = "/Users/nickd/Workspaces/AgentArchitect/teams/youtube-content/projects/cold-plan-video"
IMAGES = f"{PROJECT}/assets/images"
NARRATION = f"{PROJECT}/assets/audio/narration"
MUSIC_SRC = f"{PROJECT}/assets/audio/music/ambient-pad.mp3"
SEGMENTS = f"{PROJECT}/assembly/segments"
ASSEMBLY = f"{PROJECT}/assembly"
OUTPUT = f"{PROJECT}/output"
FPS = 30

# ------------------------------------------------------------------
# Scene definitions — identical to v3 except scenes 07/08/09/11/12
# have overlay_text set to "" (no text overlay)
#
# Format: (seg_id, image_stem, audio_stem_or_None, duration_s, style,
#          overlay_text, overlay_config)
# ------------------------------------------------------------------

SCENES = [
    # seg_id  img_stem              audio_stem              dur    style             overlay_text                                       overlay_config
    ("00",    "scene_00_cold_open", "scene_00_cold_open",   17.3,  "ken-burns-pan",  "Hampton Inn. Kokomo, Indiana.",                   "lower_third"),
    ("01",    "scene_01",           None,                    3.0,  "static",         "NyQuil Costs $12.\nThese 3 Pills Cost $0.47.",    "center_large"),
    ("02",    "scene_02",           "scene_02_v2",          19.6,  "ken-burns-zoom", "$12                    $0.47\nSame chemicals. Same doses.", "lower_third"),
    ("03",    "scene_03",           "scene_03",             22.3,  "ken-burns-pan",  "Every brand-name cold medicine\nworks the same way.", "lower_third"),
    ("04",    "scene_04",           "scene_04",             26.7,  "ken-burns-pan",  "The \"combo meal\" business model.",               "lower_third"),
    ("05",    "scene_05",           "scene_05",             17.9,  "gentle-zoom",    "Same active ingredients. Same doses.\nRequired by the FDA.", "lower_third"),
    ("06",    "scene_06",           "scene_06",             18.2,  "ken-burns-zoom", "Tylenol. Advil. Benadryl. Robitussin.\nAll generic. All cheap.", "lower_third"),
    # --- Brand breakdown scenes: overlays REMOVED ---
    ("07",    "scene_07",           "scene_07",             23.6,  "gentle-zoom",    "",                                                ""),
    ("08",    "scene_08",           "scene_08",             20.9,  "gentle-zoom",    "",                                                ""),
    ("09",    "scene_09",           "scene_09",             19.2,  "gentle-zoom",    "",                                                ""),
    # ------------------------------------------------
    ("10",    "scene_10",           "scene_10",             24.3,  "ken-burns-zoom", "Pseudoephedrine: Behind the counter.\nNo prescription needed.", "lower_third"),
    # --- Brand breakdown scenes: overlays REMOVED ---
    ("11",    "scene_11",           "scene_11",             20.8,  "gentle-zoom",    "",                                                ""),
    ("12",    "scene_12",           "scene_12",             15.7,  "gentle-zoom",    "",                                                ""),
    # ------------------------------------------------
    ("13",    "scene_13",           "scene_13_v2",          20.6,  "ken-burns-pan",  "That hotel lobby? That was me. For thirty years.", "lower_third"),
    ("14",    "scene_14",           "scene_14",             18.6,  "ken-burns-zoom", "Manage symptoms. Save money.\nKeep moving.",      "lower_third"),
    ("15",    "scene_15",           "scene_15",             19.0,  "ken-burns-zoom", "Built it. Made it free. Put it online.",          "lower_third"),
    ("16",    "scene_16",           "scene_16",             20.2,  "gentle-zoom",    "Pick your symptoms. Get your plan.",              "lower_third"),
    ("17",    "scene_17",           "scene_17",             18.8,  "gentle-zoom",    "20 brand products. Every recipe revealed.",       "lower_third"),
    ("18",    "scene_18",           "scene_18",             28.4,  "ken-burns-zoom", "Home. Travel. College. Office.",                  "lower_third"),
    ("19",    "scene_19",           "scene_19",             10.0,  "static",         "Adults only. Always read your labels.",           "center_medium"),
    ("20",    "scene_20",           "scene_20",             18.5,  "gentle-zoom",    "Free. No ads. No tracking.",                      "lower_third"),
    ("21",    "scene_21",           "scene_21",             14.8,  "static",         "Subscribe for more like this.",                   "center_medium"),
    ("22",    "scene_22",           "scene_22",              4.5,  "gentle-zoom",    "$12 vs $0.47. You decide.",                       "center_large"),
    ("23",    "scene_23",           None,                   12.0,  "static",         "cold-plan-app.web.app",                           "bottom_center"),
]

# Only regenerate the 5 brand breakdown scenes — all others reuse v3 segments
REGENERATE = {"07", "08", "09", "11", "12"}

# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------

def run(cmd, label=""):
    print(f"\n--- {label} ---")
    print(f"CMD: {' '.join(str(c) for c in cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"STDERR:\n{result.stderr[-3000:]}")
        print(f"FAILED: {label}")
        sys.exit(1)
    return result


def esc(text):
    """Escape text for FFmpeg drawtext filter."""
    return (text
        .replace('\\', '\\\\')
        .replace(':', '\\:')
        .replace("'", "\\'")
        .replace('%', '\\%'))


def build_drawtext(text, config, duration):
    """Return drawtext filter string, or empty string if no text."""
    if not text:
        return ""

    lines = text.split('\n')

    fontsize_map = {
        "center_large":  96,
        "center_medium": 72,
        "lower_third":   54,
        "bottom_center": 48,
    }
    fontsize = fontsize_map.get(config, 54)

    filters = []
    for idx, line in enumerate(lines):
        escaped = esc(line)

        if config == "center_large":
            y_expr = f"(h-text_h)/2+{(idx - len(lines)/2 + 0.5) * (fontsize + 14):.0f}"
            x_expr = "(w-text_w)/2"
        elif config == "center_medium":
            y_expr = f"(h-text_h)/2+{(idx - len(lines)/2 + 0.5) * (fontsize + 12):.0f}"
            x_expr = "(w-text_w)/2"
        elif config == "lower_third":
            base_y = "h*0.78"
            y_expr = f"{base_y}+{idx * (fontsize + 10)}"
            x_expr = "(w-text_w)/2"
        elif config == "bottom_center":
            y_expr = f"h*0.88+{idx * (fontsize + 8)}"
            x_expr = "(w-text_w)/2"
        else:
            y_expr = "(h-text_h)/2"
            x_expr = "(w-text_w)/2"

        is_price_line = any(c in line for c in ['$', 'vs'])
        color = "FFD700" if is_price_line else "FFFFFF"

        dt = (
            f"drawtext="
            f"text='{escaped}':"
            f"fontsize={fontsize}:"
            f"fontcolor=#{color}:"
            f"fontfile=/System/Library/Fonts/Helvetica.ttc:"
            f"borderw=3:"
            f"bordercolor=black:"
            f"box=1:"
            f"boxcolor=black@0.55:"
            f"boxborderw=12:"
            f"x={x_expr}:"
            f"y={y_expr}:"
            f"enable='between(t,0.5,{duration-0.3:.1f})'"
        )
        filters.append(dt)

    return ",".join(filters)


def make_segment(seg_id, img_stem, duration, style, text, text_config):
    img = f"{IMAGES}/{img_stem}.png"
    out = f"{SEGMENTS}/seg_{seg_id}.mp4"
    d = int(duration * FPS)
    drawtext = build_drawtext(text, text_config, duration)

    base_flags = ["-y", "-loop", "1", "-i", img]
    encode_flags = ["-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p"]

    # Build the VF chain — only append drawtext if non-empty
    def vf_chain(*parts):
        return ",".join(p for p in parts if p)

    if style == "gentle-zoom":
        zoom_vf = (f"scale=8000:-1,"
                   f"zoompan=z='min(zoom+0.0001,1.03)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={d}:s=1920x1080:fps={FPS}")
        vf = vf_chain(zoom_vf, drawtext)
        cmd = ["ffmpeg"] + base_flags + ["-vf", vf, "-t", str(duration)] + encode_flags + [out]

    elif style == "ken-burns-zoom":
        zoom_vf = (f"scale=8000:-1,"
                   f"zoompan=z='min(zoom+0.0005,1.15)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={d}:s=1920x1080:fps={FPS}")
        vf = vf_chain(zoom_vf, drawtext)
        cmd = ["ffmpeg"] + base_flags + ["-vf", vf, "-t", str(duration)] + encode_flags + [out]

    elif style == "ken-burns-pan":
        zoom_vf = (f"scale=8000:-1,"
                   f"zoompan=z='1.1':x='if(eq(on,1),0,x+2)':y='ih/2-(ih/zoom/2)':d={d}:s=1920x1080:fps={FPS}")
        vf = vf_chain(zoom_vf, drawtext)
        cmd = ["ffmpeg"] + base_flags + ["-vf", vf, "-t", str(duration)] + encode_flags + [out]

    elif style == "static":
        static_vf = (f"scale=1920:1080:force_original_aspect_ratio=decrease,"
                     f"pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black")
        vf = vf_chain(static_vf, drawtext)
        cmd = ["ffmpeg"] + base_flags + ["-vf", vf, "-t", str(duration)] + encode_flags + ["-r", str(FPS), out]

    else:
        print(f"Unknown style: {style}")
        sys.exit(1)

    run(cmd, f"Segment {seg_id} {style} {'(no overlay)' if not text else ''}")


# ------------------------------------------------------------------
# STEP 1: Regenerate only the 5 brand breakdown segments (no overlays)
# ------------------------------------------------------------------
print("\n" + "="*60)
print("STEP 1: Regenerating brand breakdown segments (overlay removed)")
print(f"Regenerating: {sorted(REGENERATE)}")
print("="*60)

for (seg_id, img_stem, audio_stem, duration, style, text, text_config) in SCENES:
    if seg_id in REGENERATE:
        make_segment(seg_id, img_stem, duration, style, text, text_config)
    else:
        seg_path = f"{SEGMENTS}/seg_{seg_id}.mp4"
        if os.path.exists(seg_path):
            print(f"  Reusing existing: seg_{seg_id}.mp4")
        else:
            print(f"  WARNING: seg_{seg_id}.mp4 missing — regenerating")
            make_segment(seg_id, img_stem, duration, style, text, text_config)

print("\nSegment phase complete.")

# ------------------------------------------------------------------
# STEP 2: Concatenate all 24 segments into video-only track
# ------------------------------------------------------------------
print("\n" + "="*60)
print("STEP 2: Concatenating all 24 segments (video only)")
print("="*60)

concat_file = f"{ASSEMBLY}/concat_v4.txt"
with open(concat_file, "w") as cf:
    for (seg_id, *_) in SCENES:
        cf.write(f"file '{SEGMENTS}/seg_{seg_id}.mp4'\n")

video_only = f"{ASSEMBLY}/video-only-v4.mp4"
run([
    "ffmpeg", "-y",
    "-f", "concat", "-safe", "0", "-i", concat_file,
    "-c", "copy",
    video_only
], "Concat video-only-v4")

# ------------------------------------------------------------------
# STEP 3: Build continuous narration track using adelay positioning
# ------------------------------------------------------------------
print("\n" + "="*60)
print("STEP 3: Building continuous narration track")
print("="*60)

# Normalize all narration files that have audio
narr_norm = {}  # seg_id -> normalized wav path
narr_scenes = [(seg_id, audio_stem) for (seg_id, _, audio_stem, *rest) in SCENES if audio_stem]

for seg_id, audio_stem in narr_scenes:
    src = f"{NARRATION}/{audio_stem}.mp3"
    norm = f"{ASSEMBLY}/narr_{seg_id}_norm.wav"
    if not os.path.exists(src):
        print(f"ERROR: Missing narration file: {src}")
        sys.exit(1)
    run([
        "ffmpeg", "-y", "-i", src,
        "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
        norm
    ], f"Normalize narration {audio_stem}")
    narr_norm[seg_id] = norm

# Calculate cumulative start times for adelay (in milliseconds)
cum_ms = 0.0
adelay_map = {}  # seg_id -> start_ms
for (seg_id, _, audio_stem, duration, *rest) in SCENES:
    if audio_stem:
        adelay_map[seg_id] = cum_ms
    cum_ms += duration * 1000.0

print("\nNarration start times (ms):")
for seg_id, start_ms in adelay_map.items():
    print(f"  seg_{seg_id}: {start_ms:.0f}ms ({start_ms/1000:.2f}s)")

# Build adelay amix filter_complex
inputs = []
filter_parts = []
mix_inputs = []

ordered_narr = [(seg_id, narr_norm[seg_id]) for (seg_id, _, audio_stem, *rest) in SCENES if audio_stem]

for i, (seg_id, norm_path) in enumerate(ordered_narr):
    inputs += ["-i", norm_path]
    delay_ms = int(adelay_map[seg_id])
    filter_parts.append(f"[{i}:a]adelay={delay_ms}|{delay_ms}[a{i}]")
    mix_inputs.append(f"[a{i}]")

n = len(ordered_narr)
filter_complex = "; ".join(filter_parts) + f"; {''.join(mix_inputs)}amix=inputs={n}:duration=longest:normalize=0[out]"

narr_continuous = f"{ASSEMBLY}/narr-continuous-v4.wav"
run(
    ["ffmpeg", "-y"] + inputs + [
        "-filter_complex", filter_complex,
        "-map", "[out]",
        narr_continuous
    ],
    "Build continuous narration track"
)

# ------------------------------------------------------------------
# STEP 4: Mix narration + background music using Python/numpy
# ------------------------------------------------------------------
print("\n" + "="*60)
print("STEP 4: Mixing narration + music (Python/numpy)")
print("="*60)

try:
    import soundfile as sf
    HAS_SF = True
except ImportError:
    HAS_SF = False

if HAS_SF:
    # Convert music to WAV first
    music_wav = f"{ASSEMBLY}/music_v4.wav"
    run(["ffmpeg", "-y", "-i", MUSIC_SRC,
         "-af", "loudnorm=I=-23:TP=-2:LRA=7",
         "-ar", "44100", "-ac", "2",
         music_wav], "Convert + normalize music")

    narr, sr = sf.read(narr_continuous)
    music, sr_m = sf.read(music_wav)

    # Ensure stereo
    if narr.ndim == 1:
        narr = np.column_stack([narr, narr])
    if music.ndim == 1:
        music = np.column_stack([music, music])

    # Resample music to match narration sample rate if needed
    if sr_m != sr:
        print(f"WARNING: Music SR {sr_m} != narration SR {sr}. Resampling via FFmpeg.")
        music_resampled = f"{ASSEMBLY}/music_resampled_v4.wav"
        run(["ffmpeg", "-y", "-i", music_wav, "-ar", str(sr), music_resampled], "Resample music")
        music, _ = sf.read(music_resampled)
        if music.ndim == 1:
            music = np.column_stack([music, music])

    # Tile or trim music to match narration length
    target_len = len(narr)
    if len(music) < target_len:
        repeats = (target_len // len(music)) + 2
        music = np.tile(music, (repeats, 1))[:target_len]
    else:
        music = music[:target_len]

    # Mix: narration at 100%, music at 15%
    mixed = narr + music * 0.15

    # Fade music in (first 3s) and out (last 3s)
    fade_samples = int(3.0 * sr)
    fade_in = np.linspace(0, 1, min(fade_samples, len(mixed)))
    fade_out = np.linspace(1, 0, min(fade_samples, len(mixed)))
    mixed[:len(fade_in)] *= fade_in[:, np.newaxis]
    mixed[-len(fade_out):] *= fade_out[:, np.newaxis]

    # Normalize to prevent clipping
    peak = np.max(np.abs(mixed))
    if peak > 0.95:
        mixed = mixed * (0.95 / peak)
        print(f"  Peak was {peak:.3f} — normalized to 0.95")

    final_audio = f"{ASSEMBLY}/final-audio-v4.wav"
    sf.write(final_audio, mixed, sr)
    print(f"  Mixed audio written: {final_audio}")
    print(f"  Duration: {len(mixed)/sr:.1f}s, Peak: {np.max(np.abs(mixed)):.3f}")

else:
    # Fallback: FFmpeg-only mix
    print("soundfile not available — using FFmpeg fallback for music mix")
    music_wav = f"{ASSEMBLY}/music_v4.wav"
    run(["ffmpeg", "-y", "-i", MUSIC_SRC,
         "-af", "loudnorm=I=-23:TP=-2:LRA=7",
         "-ar", "44100", "-ac", "2",
         music_wav], "Convert + normalize music")

    total_dur = sum(dur for (_, _, _, dur, *rest) in SCENES)
    final_audio = f"{ASSEMBLY}/final-audio-v4.wav"
    run([
        "ffmpeg", "-y",
        "-i", narr_continuous,
        "-i", music_wav,
        "-filter_complex",
        f"[1:a]volume=0.15,afade=t=in:st=0:d=3,afade=t=out:st={total_dur-3:.1f}:d=3[music];"
        f"[0:a][music]amix=inputs=2:duration=first:normalize=0[aout]",
        "-map", "[aout]",
        "-ar", "44100",
        final_audio
    ], "Mix narration + music (FFmpeg fallback)")

# ------------------------------------------------------------------
# STEP 5: Mux video + audio and final encode
# ------------------------------------------------------------------
print("\n" + "="*60)
print("STEP 5: Final encode — mux video + audio")
print("="*60)

final_out = f"{OUTPUT}/cold-plan-final-v3.mp4"
run([
    "ffmpeg", "-y",
    "-i", video_only,
    "-i", final_audio,
    "-c:v", "libx264", "-preset", "slow", "-crf", "18",
    "-c:a", "aac", "-b:a", "192k",
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    "-shortest",
    final_out
], "Final encode cold-plan-final-v3.mp4")

# ------------------------------------------------------------------
# STEP 6: Verify output
# ------------------------------------------------------------------
print("\n" + "="*60)
print("STEP 6: Verification")
print("="*60)

probe = subprocess.run([
    "ffprobe", "-v", "error",
    "-show_entries", "format=duration,size",
    "-of", "default=noprint_wrappers=1:nokey=1",
    final_out
], capture_output=True, text=True)

lines_out = probe.stdout.strip().split('\n')
duration_s = float(lines_out[0])
size_bytes = int(lines_out[1])
size_mb = size_bytes / (1024 * 1024)
mins = int(duration_s // 60)
secs = duration_s % 60
print(f"Duration:  {mins}:{secs:05.2f}  ({duration_s:.1f}s total)")
print(f"File size: {size_mb:.1f} MB")
print(f"Output:    {final_out}")

# Audio level check
levels = subprocess.run([
    "ffmpeg", "-i", final_out,
    "-af", "volumedetect",
    "-f", "null", "/dev/null"
], capture_output=True, text=True)
for line in levels.stderr.split('\n'):
    if 'mean_volume' in line or 'max_volume' in line:
        print(line.strip())

print("\nASSEMBLY V4 COMPLETE")
print(f"Output: {final_out}")
