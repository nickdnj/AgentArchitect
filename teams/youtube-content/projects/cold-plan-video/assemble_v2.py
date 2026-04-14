#!/usr/bin/env python3
"""
Cold Plan Video Reassembly v2
Regenerates all 23 video segments from new gpt-image-1 images,
reuses existing final-audio.wav (unchanged), and produces final output.
"""

import subprocess
import os
import sys

PROJECT = "/Users/nickd/Workspaces/AgentArchitect/teams/youtube-content/projects/cold-plan-video"
IMAGES = f"{PROJECT}/assets/images"
SEGMENTS = f"{PROJECT}/assembly/segments"
ASSEMBLY = f"{PROJECT}/assembly"
OUTPUT = f"{PROJECT}/output"
FPS = 30

# ------------------------------------------------------------------
# Scene definitions
# Duration = narration duration + 0.5s buffer (or storyboard for non-narrated)
# Style: gentle-zoom, ken-burns-zoom, ken-burns-pan, static
# Text overlays are baked in via drawtext
# ------------------------------------------------------------------

# From project.json scene_durations (narration actual), adding ~0.5s buffer
# Non-narrated scenes: sc01=5s, sc23=10s (end screen)
# sc22 narration is 3.98s — use 5s total (fade-to-black time needed)

SCENES = [
    # (scene_num, duration_s, style, overlay_text, overlay_config)
    # overlay_config keys: pos (lower_third|center|bottom), size, color, bg
    (1,  5.0,   "static",        "NyQuil Costs $12.\nThese 3 Pills Cost $0.47.", "center_large"),
    (2,  18.0,  "ken-burns-zoom","$12                    $0.47\nSame chemicals. Same doses.", "lower_third"),
    (3,  22.5,  "ken-burns-pan", "Every brand-name cold medicine\nworks the same way.", "lower_third"),
    (4,  26.7,  "ken-burns-pan", "The \"combo meal\" business model.", "lower_third"),
    (5,  18.0,  "gentle-zoom",   "Same active ingredients. Same doses.\nRequired by the FDA.", "lower_third"),
    (6,  18.3,  "ken-burns-zoom","Tylenol. Advil. Benadryl. Robitussin.\nAll generic. All cheap.", "lower_third"),
    (7,  23.6,  "gentle-zoom",   "NyQuil = 3 pills\n$12  vs  $0.12", "lower_third"),
    (8,  21.0,  "gentle-zoom",   "DayQuil = 3 pills\n$12  vs  $0.19", "lower_third"),
    (9,  19.2,  "gentle-zoom",   "Advil Cold & Sinus = 2 pills\n$10  vs  $0.12", "lower_third"),
    (10, 24.3,  "ken-burns-zoom","Pseudoephedrine: Behind the counter.\nNo prescription needed.", "lower_third"),
    (11, 21.0,  "gentle-zoom",   "Theraflu = 3 pills + hot water\n$10  vs  $0.23", "lower_third"),
    (12, 15.7,  "gentle-zoom",   "Advil PM = 2 pills\n$14  vs  $0.05", "lower_third"),
    (13, 22.0,  "ken-burns-pan", "1.3 million miles on United Airlines", "lower_third"),
    (14, 18.6,  "ken-burns-zoom","Manage symptoms. Save money.\nKeep moving.", "lower_third"),
    (15, 19.1,  "ken-burns-zoom","Built it. Made it free. Put it online.", "lower_third"),
    (16, 20.2,  "gentle-zoom",   "Pick your symptoms. Get your plan.", "lower_third"),
    (17, 18.8,  "gentle-zoom",   "20 brand products. Every recipe revealed.", "lower_third"),
    (18, 28.4,  "ken-burns-zoom","Home. Travel. College. Office.", "lower_third"),
    (19, 10.0,  "static",        "Adults only. Always read your labels.", "center_medium"),
    (20, 18.5,  "gentle-zoom",   "Free. No ads. No tracking.", "lower_third"),
    (21, 14.8,  "static",        "Subscribe for more like this.", "center_medium"),
    (22, 4.5,   "gentle-zoom",   "$12 vs $0.47. You decide.", "center_large"),
    (23, 10.0,  "static",        "cold-plan-app.web.app", "bottom_center"),
]

def run(cmd, label=""):
    """Run a shell command, print progress, exit on failure."""
    print(f"\n--- {label} ---")
    print(f"CMD: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"STDERR:\n{result.stderr[-3000:]}")
        print(f"FAILED: {label}")
        sys.exit(1)
    return result

def build_drawtext(text, config, duration):
    """Build an FFmpeg drawtext filter string."""
    # Escape text for FFmpeg drawtext
    # Replace newlines with two-pass approach — we'll split into multiple drawtexts
    lines = text.split('\n')

    # Base style
    fontsize_map = {
        "center_large":  96,
        "center_medium": 72,
        "lower_third":   54,
        "bottom_center": 48,
    }
    fontsize = fontsize_map.get(config, 54)

    filters = []
    for idx, line in enumerate(lines):
        # Escape special chars for drawtext
        escaped = (line
            .replace('\\', '\\\\')
            .replace(':', '\\:')
            .replace("'", "\\'")
            .replace('%', '\\%'))

        if config == "center_large":
            # Two lines centered vertically
            y_expr = f"(h-text_h)/2+{(idx - len(lines)/2 + 0.5) * (fontsize + 14):.0f}"
            x_expr = "(w-text_w)/2"
        elif config == "center_medium":
            y_expr = f"(h-text_h)/2+{(idx - len(lines)/2 + 0.5) * (fontsize + 12):.0f}"
            x_expr = "(w-text_w)/2"
        elif config == "lower_third":
            # Position lines in lower third
            base_y = "h*0.78"
            y_expr = f"{base_y}+{idx * (fontsize + 10)}"
            x_expr = "(w-text_w)/2"
        elif config == "bottom_center":
            y_expr = f"h*0.88+{idx * (fontsize + 8)}"
            x_expr = "(w-text_w)/2"
        else:
            y_expr = "(h-text_h)/2"
            x_expr = "(w-text_w)/2"

        # Line 1 in warm yellow/gold for impact lines, white for others
        # Make first line of price comparisons yellow
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

def make_segment_gentle_zoom(scene_num, duration, text, text_config):
    img = f"{IMAGES}/scene_{scene_num:02d}.png"
    out = f"{SEGMENTS}/seg_{scene_num:02d}.mp4"
    d = int(duration * FPS)

    drawtext = build_drawtext(text, text_config, duration)

    cmd = [
        "ffmpeg", "-y",
        "-loop", "1", "-i", img,
        "-vf",
        f"scale=8000:-1,"
        f"zoompan=z='min(zoom+0.0001,1.03)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={d}:s=1920x1080:fps={FPS},"
        f"{drawtext}",
        "-t", str(duration),
        "-c:v", "libx264", "-preset", "fast", "-crf", "18",
        "-pix_fmt", "yuv420p",
        out
    ]
    run(cmd, f"Scene {scene_num:02d} gentle-zoom")

def make_segment_kb_zoom(scene_num, duration, text, text_config):
    img = f"{IMAGES}/scene_{scene_num:02d}.png"
    out = f"{SEGMENTS}/seg_{scene_num:02d}.mp4"
    d = int(duration * FPS)

    drawtext = build_drawtext(text, text_config, duration)

    cmd = [
        "ffmpeg", "-y",
        "-loop", "1", "-i", img,
        "-vf",
        f"scale=8000:-1,"
        f"zoompan=z='min(zoom+0.0005,1.15)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={d}:s=1920x1080:fps={FPS},"
        f"{drawtext}",
        "-t", str(duration),
        "-c:v", "libx264", "-preset", "fast", "-crf", "18",
        "-pix_fmt", "yuv420p",
        out
    ]
    run(cmd, f"Scene {scene_num:02d} ken-burns-zoom")

def make_segment_kb_pan(scene_num, duration, text, text_config):
    img = f"{IMAGES}/scene_{scene_num:02d}.png"
    out = f"{SEGMENTS}/seg_{scene_num:02d}.mp4"
    d = int(duration * FPS)

    drawtext = build_drawtext(text, text_config, duration)

    cmd = [
        "ffmpeg", "-y",
        "-loop", "1", "-i", img,
        "-vf",
        f"scale=8000:-1,"
        f"zoompan=z='1.1':x='if(eq(on,1),0,x+2)':y='ih/2-(ih/zoom/2)':d={d}:s=1920x1080:fps={FPS},"
        f"{drawtext}",
        "-t", str(duration),
        "-c:v", "libx264", "-preset", "fast", "-crf", "18",
        "-pix_fmt", "yuv420p",
        out
    ]
    run(cmd, f"Scene {scene_num:02d} ken-burns-pan")

def make_segment_static(scene_num, duration, text, text_config):
    img = f"{IMAGES}/scene_{scene_num:02d}.png"
    out = f"{SEGMENTS}/seg_{scene_num:02d}.mp4"

    drawtext = build_drawtext(text, text_config, duration)

    cmd = [
        "ffmpeg", "-y",
        "-loop", "1", "-i", img,
        "-vf",
        f"scale=1920:1080:force_original_aspect_ratio=decrease,"
        f"pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black,"
        f"{drawtext}",
        "-t", str(duration),
        "-c:v", "libx264", "-preset", "fast", "-crf", "18",
        "-pix_fmt", "yuv420p", "-r", str(FPS),
        out
    ]
    run(cmd, f"Scene {scene_num:02d} static")

# ------------------------------------------------------------------
# STEP 1: Generate all video segments (VIDEO ONLY, no audio)
# ------------------------------------------------------------------
print("\n" + "="*60)
print("STEP 1: Generating video segments from new images")
print("="*60)

style_map = {
    "gentle-zoom":    make_segment_gentle_zoom,
    "ken-burns-zoom": make_segment_kb_zoom,
    "ken-burns-pan":  make_segment_kb_pan,
    "static":         make_segment_static,
}

for (scene_num, duration, style, text, text_config) in SCENES:
    fn = style_map[style]
    fn(scene_num, duration, text, text_config)

print("\nAll 23 segments generated.")

# ------------------------------------------------------------------
# STEP 2: Concatenate segments into video-only track
# ------------------------------------------------------------------
print("\n" + "="*60)
print("STEP 2: Concatenating segments (video only)")
print("="*60)

concat_file = f"{ASSEMBLY}/concat.txt"
# concat.txt already exists with correct paths, but let's regenerate it to be safe
with open(concat_file, "w") as f:
    for i in range(1, 24):
        f.write(f"file '{SEGMENTS}/seg_{i:02d}.mp4'\n")

video_only = f"{ASSEMBLY}/video-only.mp4"
run([
    "ffmpeg", "-y",
    "-f", "concat", "-safe", "0", "-i", concat_file,
    "-c", "copy",
    video_only
], "Concat video-only")

# ------------------------------------------------------------------
# STEP 3: Mux existing final-audio.wav with new video
# ------------------------------------------------------------------
print("\n" + "="*60)
print("STEP 3: Muxing video with final-audio.wav")
print("="*60)

final_out = f"{OUTPUT}/cold-plan-final.mp4"
final_audio = f"{ASSEMBLY}/final-audio.wav"

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
], "Final encode + audio mux")

# ------------------------------------------------------------------
# STEP 4: Verify output
# ------------------------------------------------------------------
print("\n" + "="*60)
print("STEP 4: Verifying output")
print("="*60)

probe = subprocess.run([
    "ffprobe", "-v", "error",
    "-show_entries", "format=duration,size",
    "-of", "default=noprint_wrappers=1:nokey=1",
    final_out
], capture_output=True, text=True)

lines = probe.stdout.strip().split('\n')
duration_s = float(lines[0])
size_bytes = int(lines[1])
size_mb = size_bytes / (1024 * 1024)
mins = int(duration_s // 60)
secs = duration_s % 60
print(f"Duration: {mins}:{secs:05.2f} ({duration_s:.1f}s)")
print(f"File size: {size_mb:.1f} MB")
print(f"Output: {final_out}")

# Audio level check
levels = subprocess.run([
    "ffmpeg", "-i", final_out,
    "-af", "volumedetect",
    "-f", "null", "/dev/null"
], capture_output=True, text=True)
for line in levels.stderr.split('\n'):
    if 'mean_volume' in line or 'max_volume' in line:
        print(line.strip())

print("\nASSEMBLY COMPLETE")
