#!/usr/bin/env python3
"""
Cold Plan Video Assembly Script
Assembles 23 scenes into a final YouTube-ready MP4.
"""

import subprocess
import os
import sys
import json
import numpy as np
import soundfile as sf
from pathlib import Path

# ─── Paths ──────────────────────────────────────────────────────────────────
PROJECT = Path("/Users/nickd/Workspaces/AgentArchitect/teams/youtube-content/projects/cold-plan-video")
IMAGES  = PROJECT / "assets/images"
NARR    = PROJECT / "assets/audio/narration"
MUSIC   = PROJECT / "assets/audio/music/ambient-pad.mp3"
SEGS    = PROJECT / "assembly/segments"
OUT     = PROJECT / "output"

SEGS.mkdir(parents=True, exist_ok=True)
OUT.mkdir(parents=True, exist_ok=True)
(PROJECT / "assembly").mkdir(parents=True, exist_ok=True)

FPS = 30

# ─── Scene definitions ───────────────────────────────────────────────────────
# (scene_num, duration_sec, motion_style, text_overlay_spec)
# text_overlay_spec: list of (text, start_t, end_t, x_expr, y_expr, color, fontsize)
# color: "white" = plain, "gold" = highlighted karaoke word

W = 1920
H = 1080

def cx(text_len_approx):
    """Approximate center x — use (w-text_w)/2 in ffmpeg."""
    return "(w-text_w)/2"

def lower_third_y(offset=0):
    return f"h*0.82{'+'+str(offset) if offset else ''}"

def center_y():
    return "(h-text_h)/2"

def upper_y():
    return "h*0.12"

# Scene durations: scene 1 = 5s, scenes 2-22 = narration+0.5s, scene 23 = 10s
NARRATION_DURATIONS = {
    2:  17.376,
    3:  21.816,
    4:  26.208,
    5:  17.448,
    6:  17.736,
    7:  23.112,
    8:  20.376,
    9:  18.696,
    10: 23.808,
    11: 20.328,
    12: 15.192,
    13: 21.528,
    14: 18.144,
    15: 18.552,
    16: 19.680,
    17: 18.336,
    18: 27.912,
    19:  9.456,
    20: 18.024,
    21: 14.328,
    22:  3.984,
}

SCENE_DURATIONS = {1: 5.0}
for s, d in NARRATION_DURATIONS.items():
    SCENE_DURATIONS[s] = d + 0.5
SCENE_DURATIONS[23] = 10.0

# ─── Text overlay definitions ────────────────────────────────────────────────
# Each entry: dict with keys:
#   lines: list of (text, start, end, y_expr, color, fontsize, box)
#   Note: x is always centered unless specified

def esc(s):
    """Escape text for FFmpeg drawtext (subprocess list form — no shell).
    FFmpeg drawtext uses ':' as option separator and "'" to delimit text value.
    In list-form subprocess, no shell layer, so we escape for FFmpeg only.
    Replace apostrophes with Unicode right single quote to avoid quoting issues.
    """
    s = s.replace("'", "\u2019")   # smart apostrophe — visually identical, avoids quote issues
    s = s.replace(":", "\\:")      # colon is ffmpeg option separator
    return s

OVERLAYS = {
    # Scene 1 — title card, large centered
    1: [
        # line 1
        {"text": "NyQuil Costs $12.", "start": 0.3, "end": 4.5,
         "y": "(h-text_h)/2 - 60", "color": "white", "size": 72, "box": True},
        # line 2
        {"text": "These 3 Pills Cost $0.47.", "start": 0.3, "end": 4.5,
         "y": "(h-text_h)/2 + 30", "color": "FFD700", "size": 72, "box": True},
    ],

    # Scene 2 — price shock karaoke
    2: [
        {"text": "$12", "start": 1.0, "end": 5.0,
         "y": "(h-text_h)/2", "color": "FF6B6B", "size": 110, "box": True},
        {"text": "$0.47", "start": 5.5, "end": 11.0,
         "y": "(h-text_h)/2", "color": "FFD700", "size": 110, "box": True},
        {"text": "Same chemicals. Same doses.", "start": 11.5, "end": 17.5,
         "y": "h*0.80", "color": "white", "size": 52, "box": True},
    ],

    # Scene 3 — single line lower third
    3: [
        {"text": "Every brand-name cold medicine works the same way.",
         "start": 1.0, "end": 21.0,
         "y": "h*0.82", "color": "white", "size": 46, "box": True},
    ],

    # Scene 4 — combo meal karaoke highlight
    4: [
        {"text": "It's like a combo meal for your cold.",
         "start": 2.0, "end": 10.0,
         "y": "h*0.82", "color": "white", "size": 48, "box": True},
        {"text": "combo meal", "start": 3.5, "end": 9.5,
         "y": "h*0.75", "color": "FFD700", "size": 64, "box": True},
    ],

    # Scene 5 — ingredients
    5: [
        {"text": "Same active ingredients. Same doses.",
         "start": 1.0, "end": 9.0,
         "y": "h*0.82", "color": "white", "size": 50, "box": True},
        {"text": "Required by the FDA.", "start": 9.5, "end": 17.5,
         "y": "h*0.82", "color": "FFD700", "size": 50, "box": True},
    ],

    # Scene 6 — karaoke brand names
    6: [
        {"text": "Tylenol", "start": 1.5, "end": 5.0,
         "y": "h*0.80", "color": "FFD700", "size": 80, "box": True},
        {"text": "Advil", "start": 5.5, "end": 9.0,
         "y": "h*0.80", "color": "FFD700", "size": 80, "box": True},
        {"text": "Benadryl", "start": 9.5, "end": 13.0,
         "y": "h*0.80", "color": "FFD700", "size": 80, "box": True},
        {"text": "Robitussin", "start": 13.5, "end": 17.5,
         "y": "h*0.80", "color": "FFD700", "size": 80, "box": True},
    ],

    # Scene 7 — NyQuil breakdown
    7: [
        {"text": "NyQuil = 3 pills", "start": 0.3, "end": 23.5,
         "y": "h*0.10", "color": "white", "size": 58, "box": True},
        {"text": "$12", "start": 9.0, "end": 16.0,
         "y": "h*0.82", "color": "FF6B6B", "size": 80, "box": True},
        {"text": "vs  $0.12", "start": 13.0, "end": 23.5,
         "y": "h*0.82", "color": "FFD700", "size": 80, "box": True},
    ],

    # Scene 8 — DayQuil breakdown
    8: [
        {"text": "DayQuil = 3 pills", "start": 0.3, "end": 20.5,
         "y": "h*0.10", "color": "white", "size": 58, "box": True},
        {"text": "$12", "start": 8.0, "end": 14.0,
         "y": "h*0.82", "color": "FF6B6B", "size": 80, "box": True},
        {"text": "vs  $0.19", "start": 12.0, "end": 20.5,
         "y": "h*0.82", "color": "FFD700", "size": 80, "box": True},
    ],

    # Scene 9 — Advil Cold & Sinus
    9: [
        {"text": "Advil Cold & Sinus = 2 pills", "start": 0.3, "end": 19.0,
         "y": "h*0.10", "color": "white", "size": 56, "box": True},
        {"text": "$10", "start": 8.0, "end": 14.0,
         "y": "h*0.82", "color": "FF6B6B", "size": 80, "box": True},
        {"text": "vs  $0.12", "start": 12.0, "end": 19.0,
         "y": "h*0.82", "color": "FFD700", "size": 80, "box": True},
    ],

    # Scene 10 — Pseudoephedrine aside
    10: [
        {"text": "Pseudoephedrine:", "start": 1.0, "end": 12.0,
         "y": "h*0.82", "color": "white", "size": 54, "box": True},
        {"text": "Behind the counter. No prescription needed.",
         "start": 4.0, "end": 23.5,
         "y": "h*0.88", "color": "FFD700", "size": 46, "box": True},
    ],

    # Scene 11 — Theraflu
    11: [
        {"text": "Theraflu = 3 pills + hot water", "start": 0.3, "end": 20.5,
         "y": "h*0.10", "color": "white", "size": 54, "box": True},
        {"text": "$10", "start": 8.0, "end": 14.0,
         "y": "h*0.82", "color": "FF6B6B", "size": 80, "box": True},
        {"text": "vs  $0.23", "start": 12.0, "end": 20.5,
         "y": "h*0.82", "color": "FFD700", "size": 80, "box": True},
    ],

    # Scene 12 — Advil PM (most dramatic gap)
    12: [
        {"text": "Advil PM = 2 pills", "start": 0.3, "end": 15.5,
         "y": "h*0.10", "color": "white", "size": 58, "box": True},
        {"text": "$14", "start": 5.0, "end": 11.0,
         "y": "h*0.82", "color": "FF6B6B", "size": 90, "box": True},
        {"text": "vs  $0.05", "start": 9.0, "end": 15.5,
         "y": "h*0.82", "color": "FFD700", "size": 110, "box": True},
    ],

    # Scene 13 — road warrior
    13: [
        {"text": "1.3 million miles on United Airlines",
         "start": 1.0, "end": 21.5,
         "y": "h*0.82", "color": "white", "size": 52, "box": True},
    ],

    # Scene 14 — pill organizer
    14: [
        {"text": "Manage symptoms. Save money. Keep moving.",
         "start": 1.5, "end": 18.5,
         "y": "h*0.82", "color": "white", "size": 48, "box": True},
    ],

    # Scene 15 — building it
    15: [
        {"text": "Built it. Made it free. Put it online.",
         "start": 1.0, "end": 18.5,
         "y": "h*0.82", "color": "FFD700", "size": 56, "box": True},
    ],

    # Scene 16 — symptom planner
    16: [
        {"text": "Pick your symptoms. Get your plan.",
         "start": 1.0, "end": 19.5,
         "y": "h*0.82", "color": "white", "size": 54, "box": True},
    ],

    # Scene 17 — brand lookup
    17: [
        {"text": "20 brand products. Every recipe revealed.",
         "start": 1.0, "end": 18.5,
         "y": "h*0.82", "color": "white", "size": 52, "box": True},
    ],

    # Scene 18 — curated kits karaoke
    18: [
        {"text": "Home", "start": 1.5, "end": 8.0,
         "y": "h*0.82", "color": "FFD700", "size": 80, "box": True},
        {"text": "Travel", "start": 8.5, "end": 15.5,
         "y": "h*0.82", "color": "FFD700", "size": 80, "box": True},
        {"text": "College", "start": 16.0, "end": 21.5,
         "y": "h*0.82", "color": "FFD700", "size": 80, "box": True},
        {"text": "Office", "start": 22.0, "end": 28.0,
         "y": "h*0.82", "color": "FFD700", "size": 80, "box": True},
    ],

    # Scene 19 — adults only
    19: [
        {"text": "Adults only. Always read your labels.",
         "start": 0.5, "end": 9.5,
         "y": "(h-text_h)/2 + 80", "color": "white", "size": 52, "box": True},
    ],

    # Scene 20 — values karaoke
    20: [
        {"text": "Free.", "start": 1.0, "end": 6.0,
         "y": "h*0.82", "color": "FFD700", "size": 80, "box": True},
        {"text": "No ads.", "start": 6.5, "end": 11.5,
         "y": "h*0.82", "color": "FFD700", "size": 80, "box": True},
        {"text": "No tracking.", "start": 12.0, "end": 18.5,
         "y": "h*0.82", "color": "FFD700", "size": 80, "box": True},
    ],

    # Scene 21 — subscribe CTA
    21: [
        {"text": "Subscribe for more like this.",
         "start": 0.5, "end": 14.5,
         "y": "h*0.82", "color": "white", "size": 58, "box": True},
    ],

    # Scene 22 — bookend
    22: [
        {"text": "$12  vs  $0.47.", "start": 0.3, "end": 3.0,
         "y": "(h-text_h)/2 - 30", "color": "white", "size": 90, "box": True},
        {"text": "You decide.", "start": 1.5, "end": 4.5,
         "y": "(h-text_h)/2 + 60", "color": "FFD700", "size": 80, "box": True},
    ],

    # Scene 23 — end screen
    23: [
        {"text": "cold-plan-app.web.app", "start": 0.5, "end": 9.5,
         "y": "h*0.90", "color": "white", "size": 42, "box": True},
    ],
}

# ─── Motion style → FFmpeg vf string ────────────────────────────────────────

def video_filter(style, duration):
    d = int(duration * FPS)
    if style == "static":
        return (
            "scale=1920:1080:force_original_aspect_ratio=decrease,"
            "pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black"
        )
    elif style == "gentle-zoom":
        return (
            f"scale=8000:-1,"
            f"zoompan=z='min(zoom+0.0001,1.03)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':"
            f"d={d}:s=1920x1080:fps={FPS}"
        )
    elif style == "ken-burns-zoom":
        return (
            f"scale=8000:-1,"
            f"zoompan=z='min(zoom+0.0005,1.15)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':"
            f"d={d}:s=1920x1080:fps={FPS}"
        )
    elif style == "ken-burns-pan":
        return (
            f"scale=8000:-1,"
            f"zoompan=z='1.1':x='if(eq(on,1),0,x+2)':y='ih/2-(ih/zoom/2)':"
            f"d={d}:s=1920x1080:fps={FPS}"
        )
    else:
        # fallback gentle-zoom
        return (
            f"scale=8000:-1,"
            f"zoompan=z='min(zoom+0.0001,1.03)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':"
            f"d={d}:s=1920x1080:fps={FPS}"
        )

# ─── Drawtext filter builder ─────────────────────────────────────────────────

def drawtext_filter(scene_num):
    """Build a chained drawtext filter string for the scene's overlays."""
    entries = OVERLAYS.get(scene_num, [])
    if not entries:
        return None

    parts = []
    for e in entries:
        txt = esc(e["text"])
        col = e["color"] if e["color"] != "white" else "white"
        # If color is a hex code, prefix with 0x for ffmpeg
        if len(col) == 6 and all(c in "0123456789ABCDEFabcdef" for c in col):
            fc = f"0x{col}"
        else:
            fc = col

        size = e["size"]
        y_expr = e["y"]
        start = e["start"]
        end = e["end"]
        box = e.get("box", False)
        box_str = ":box=1:boxcolor=black@0.55:boxborderw=8" if box else ""

        dt = (
            f"drawtext=text='{txt}'"
            f":fontsize={size}"
            f":fontcolor={fc}"
            f":x=(w-text_w)/2"
            f":y={y_expr}"
            f":fontfile=/System/Library/Fonts/Supplemental/Georgia.ttf"
            f":borderw=2:bordercolor=black@0.8"
            f"{box_str}"
            f":enable='between(t,{start},{end})'"
        )
        parts.append(dt)

    return ",".join(parts)

# ─── Generate a single video-only segment ────────────────────────────────────

MOTION_STYLE = {
    1:  "static",
    2:  "ken-burns-zoom",
    3:  "ken-burns-pan",
    4:  "ken-burns-pan",
    5:  "gentle-zoom",
    6:  "ken-burns-zoom",
    7:  "gentle-zoom",
    8:  "gentle-zoom",
    9:  "gentle-zoom",
    10: "ken-burns-zoom",
    11: "gentle-zoom",
    12: "gentle-zoom",
    13: "ken-burns-pan",
    14: "ken-burns-zoom",
    15: "ken-burns-zoom",
    16: "gentle-zoom",
    17: "gentle-zoom",
    18: "ken-burns-zoom",
    19: "static",
    20: "gentle-zoom",
    21: "static",
    22: "gentle-zoom",
    23: "static",
}

def make_segment(scene_num, force=False):
    img = IMAGES / f"scene_{scene_num:02d}.png"
    out = SEGS / f"seg_{scene_num:02d}.mp4"
    dur = SCENE_DURATIONS[scene_num]
    style = MOTION_STYLE[scene_num]

    if out.exists() and not force:
        print(f"  [skip] segment {scene_num:02d} already exists")
        return out

    print(f"  [render] scene {scene_num:02d}  style={style}  dur={dur:.2f}s")

    vf = video_filter(style, dur)
    dt = drawtext_filter(scene_num)
    if dt:
        vf = vf + "," + dt

    cmd = [
        "ffmpeg", "-y",
        "-loop", "1",
        "-i", str(img),
        "-vf", vf,
        "-t", str(dur),
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "20",
        "-pix_fmt", "yuv420p",
        "-r", str(FPS),
        "-an",
        str(out)
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"  [ERROR] scene {scene_num:02d} failed:")
        print(result.stderr[-2000:])
        return None

    return out


# ─── Audio assembly ──────────────────────────────────────────────────────────

def build_audio_track():
    """
    Build final mixed audio: continuous narration + background music.
    Uses Python/soundfile for reliable mixing without dropout.
    """
    print("\n[audio] Building continuous narration track...")

    SAMPLE_RATE = 44100

    # Convert all narration MP3s to WAV at consistent sample rate
    narr_wavs = {}
    for scene_num in range(2, 23):
        mp3 = NARR / f"scene_{scene_num:02d}.mp3"
        wav = PROJECT / f"assembly/narr_{scene_num:02d}.wav"
        if not wav.exists():
            subprocess.run([
                "ffmpeg", "-y", "-i", str(mp3),
                "-ar", str(SAMPLE_RATE), "-ac", "2",
                "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
                str(wav)
            ], capture_output=True, check=True)
        narr_wavs[scene_num] = wav
        print(f"  narration {scene_num:02d} ready")

    # Calculate start times for each narration clip (cumulative scene durations)
    start_times = {}
    cumulative = 0.0
    for scene_num in range(1, 24):
        if scene_num in range(2, 23):
            start_times[scene_num] = cumulative
        cumulative += SCENE_DURATIONS[scene_num]

    total_duration = cumulative
    total_samples = int(total_duration * SAMPLE_RATE) + SAMPLE_RATE  # +1s buffer

    print(f"\n[audio] Total video duration: {total_duration:.2f}s ({total_duration/60:.1f}m)")

    # Build narration array
    narration_array = np.zeros((total_samples, 2), dtype=np.float32)

    for scene_num, wav_path in narr_wavs.items():
        data, sr = sf.read(str(wav_path))
        if sr != SAMPLE_RATE:
            print(f"  WARNING: scene {scene_num} sample rate {sr} != {SAMPLE_RATE}")
        if data.ndim == 1:
            data = np.stack([data, data], axis=1)
        elif data.shape[1] == 1:
            data = np.repeat(data, 2, axis=1)

        start_sample = int(start_times[scene_num] * SAMPLE_RATE)
        end_sample = start_sample + len(data)
        if end_sample > total_samples:
            data = data[:total_samples - start_sample]
            end_sample = total_samples

        narration_array[start_sample:end_sample] += data

    # Convert music MP3 to WAV
    music_wav = PROJECT / "assembly/music.wav"
    if not music_wav.exists():
        print("[audio] Converting background music to WAV...")
        subprocess.run([
            "ffmpeg", "-y", "-i", str(MUSIC),
            "-ar", str(SAMPLE_RATE), "-ac", "2",
            str(music_wav)
        ], capture_output=True, check=True)

    # Load and loop music to match total duration
    music_data, sr_m = sf.read(str(music_wav))
    if music_data.ndim == 1:
        music_data = np.stack([music_data, music_data], axis=1)

    # Loop music if needed
    if len(music_data) < total_samples:
        repeats = total_samples // len(music_data) + 1
        music_data = np.tile(music_data, (repeats, 1))

    music_data = music_data[:total_samples].astype(np.float32)

    # Fade music in over 3s, fade out over last 4s
    fade_in_samples = int(3.0 * SAMPLE_RATE)
    fade_out_samples = int(4.0 * SAMPLE_RATE)
    fade_in = np.linspace(0, 1, fade_in_samples)
    fade_out = np.linspace(1, 0, fade_out_samples)

    music_data[:fade_in_samples] *= fade_in[:, np.newaxis]
    music_data[-fade_out_samples:] *= fade_out[:, np.newaxis]

    # Mix: narration at 100%, music at 15%
    MUSIC_LEVEL = 0.15
    mixed = narration_array + music_data * MUSIC_LEVEL

    # Normalize to prevent clipping
    peak = np.max(np.abs(mixed))
    if peak > 0.92:
        mixed = mixed * (0.92 / peak)
        print(f"  [audio] Normalized from peak {peak:.3f} to 0.92")

    # Write final mixed audio
    final_audio = PROJECT / "assembly/final-audio.wav"
    sf.write(str(final_audio), mixed, SAMPLE_RATE)
    print(f"  [audio] Final mixed audio written: {final_audio}")
    print(f"  [audio] Total duration: {total_duration:.2f}s")

    return final_audio, total_duration


# ─── Concatenate video segments ──────────────────────────────────────────────

def concat_segments(segment_paths):
    print("\n[concat] Concatenating video segments...")

    concat_file = PROJECT / "assembly/concat.txt"
    with open(concat_file, "w") as f:
        for p in segment_paths:
            f.write(f"file '{p}'\n")

    raw_video = PROJECT / "assembly/video-only.mp4"
    cmd = [
        "ffmpeg", "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", str(concat_file),
        "-c", "copy",
        str(raw_video)
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print("[ERROR] Concat failed:")
        print(result.stderr[-3000:])
        return None

    print(f"  [concat] Video-only track: {raw_video}")
    return raw_video


# ─── Final mux and encode ────────────────────────────────────────────────────

def final_encode(video_path, audio_path):
    print("\n[encode] Final encode to YouTube-optimized MP4...")

    final_out = OUT / "cold-plan-final.mp4"
    cmd = [
        "ffmpeg", "-y",
        "-i", str(video_path),
        "-i", str(audio_path),
        "-c:v", "libx264",
        "-preset", "slow",
        "-crf", "18",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-movflags", "+faststart",
        "-shortest",
        str(final_out)
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
    if result.returncode != 0:
        print("[ERROR] Final encode failed:")
        print(result.stderr[-3000:])
        return None

    print(f"  [encode] Final video: {final_out}")
    return final_out


# ─── Verify output ────────────────────────────────────────────────────────────

def verify_output(path):
    print("\n[verify] Checking output...")

    size_mb = os.path.getsize(path) / (1024 * 1024)
    dur_result = subprocess.run([
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration",
        "-of", "csv=p=0", str(path)
    ], capture_output=True, text=True)
    duration = float(dur_result.stdout.strip())
    minutes = int(duration // 60)
    seconds = duration % 60

    vol_result = subprocess.run([
        "ffmpeg", "-i", str(path),
        "-af", "volumedetect",
        "-f", "null", "/dev/null"
    ], capture_output=True, text=True)

    mean_vol = max_vol = "unknown"
    for line in vol_result.stderr.split("\n"):
        if "mean_volume" in line:
            mean_vol = line.split(":")[-1].strip()
        if "max_volume" in line:
            max_vol = line.split(":")[-1].strip()

    print(f"  Duration: {minutes}:{seconds:05.2f} ({duration:.1f}s)")
    print(f"  File size: {size_mb:.1f} MB")
    print(f"  Audio mean: {mean_vol}")
    print(f"  Audio max:  {max_vol}")

    return {
        "duration_seconds": round(duration, 1),
        "duration_display": f"{minutes}:{int(seconds):02d}",
        "file_size_mb": round(size_mb, 1),
        "audio_mean_volume": mean_vol,
        "audio_max_volume": max_vol,
    }


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("Cold Plan Video Assembly")
    print("=" * 60)

    # Step 1: Generate all video segments
    print("\n[segments] Rendering 23 video segments...")
    segment_paths = []
    failed = []
    for scene_num in range(1, 24):
        seg = make_segment(scene_num)
        if seg is None:
            failed.append(scene_num)
        else:
            segment_paths.append(seg)

    if failed:
        print(f"\n[ERROR] Failed segments: {failed}")
        print("Fix these before proceeding.")
        sys.exit(1)

    print(f"\n[segments] All {len(segment_paths)} segments rendered successfully.")

    # Step 2: Build audio track
    final_audio, total_duration = build_audio_track()

    # Step 3: Concatenate video
    raw_video = concat_segments(segment_paths)
    if raw_video is None:
        sys.exit(1)

    # Step 4: Final encode
    final_video = final_encode(raw_video, final_audio)
    if final_video is None:
        sys.exit(1)

    # Step 5: Verify
    stats = verify_output(final_video)

    # Step 6: Update project.json
    print("\n[project] Updating project.json...")
    proj_path = PROJECT / "project.json"
    with open(proj_path) as f:
        proj = json.load(f)

    proj["phases"]["assembly"] = {
        "status": "complete",
        "completed": "2026-04-13",
        "output_file": "output/cold-plan-final.mp4",
        "duration_seconds": stats["duration_seconds"],
        "duration_display": stats["duration_display"],
        "file_size_mb": stats["file_size_mb"],
        "audio_mean_volume": stats["audio_mean_volume"],
        "audio_max_volume": stats["audio_max_volume"],
        "scenes_assembled": 23,
        "encoding": {
            "codec": "libx264",
            "preset": "slow",
            "crf": 18,
            "fps": 30,
            "resolution": "1920x1080",
            "audio_codec": "aac",
            "audio_bitrate": "192k",
        }
    }

    with open(proj_path, "w") as f:
        json.dump(proj, f, indent=2)

    print("\n" + "=" * 60)
    print("ASSEMBLY COMPLETE")
    print("=" * 60)
    print(f"Output: {final_video}")
    print(f"Duration: {stats['duration_display']} ({stats['duration_seconds']}s)")
    print(f"File size: {stats['file_size_mb']} MB")
    print(f"Audio mean: {stats['audio_mean_volume']}")
    print(f"Audio max:  {stats['audio_max_volume']}")


if __name__ == "__main__":
    main()
