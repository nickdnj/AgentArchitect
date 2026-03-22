#!/usr/bin/env python3
"""
Seven Presidents Park - Video Assembly Script
Assembles draft-v5.mp4 from images, narration audio, and v2 storyboard spec.

v5 changes:
  - Swapped in Nick's real photos (24 shots from site visit)
  - Updated Grant cottage text: "grassy lot" -> "construction site"
  - Re-recorded segment 3 narration with updated text
  - Scene image swaps: 1e, 3d, 4e, 5a2, 7a, 7b, 7b2 now use real photos
  - Tea House scene 7b uses nick-teahouse-exterior.jpg + nick-teahouse-interior.jpg

v4 changes:
  - Split 4 long scenes into pairs: 1d->1d+1e, 3b->3b+3b2, 5a->5a+5a2, 7b->7b+7b2
  - 2 new AI images (ai-scene-3b2.png, ai-scene-7b2.png)
  - Scene count: 25 -> 28 (5a2 replaces old 5b)

v3 changes:
  - Segment 4 re-recorded (Netflix reference removed)
  - Garfield trimmed to 5 scenes (4a-4e) matching v2 storyboard
  - Scene layout matches generate_storyboard_pptx.py v2
  - Added Wilson 6c scene (Wilson accepting nomination)

Strategy:
  1. Build video-only segments for each scene using the correct visual style
  2. Concatenate all video-only segments
  3. Build continuous narration track with adelay positioning
  4. Mix narration + subtle ambient tone (music placeholder)
  5. Mux final audio with video
  6. Final encode to YouTube-optimized H.264 1080p
"""

import subprocess
import json
import os
import sys
import math

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
PROJECT = "/Users/nickd/Workspaces/AgentArchitect/teams/youtube-content/projects/seven-presidents-park"
IMAGES = f"{PROJECT}/images"
NARRATION = f"{PROJECT}/audio/narration"
SEGMENTS_DIR = f"{PROJECT}/assembly/segments"
ASSEMBLY_DIR = f"{PROJECT}/assembly"
OUTPUT_DIR = f"{PROJECT}/output"
OUTPUT_FILE = f"{OUTPUT_DIR}/seven-presidents-draft-v5.mp4"

FPS = 30
RESOLUTION = "1920x1080"
W, H = 1920, 1080

# ---------------------------------------------------------------------------
# Scene definitions
# Columns: scene_id, image_file, motion, duration (seconds), text_overlay,
#          transition_out, segment
# duration = None means "fill remaining segment time"
# ---------------------------------------------------------------------------
SCENES = [
    # Segment 1 — The Myth (audio: 67.824s, scenes: 10+12+6+20 = 48s explicit)
    # Remaining ~19.8s goes to 1e
    {
        "id": "1a", "segment": 1,
        "image": "ai-scene-1a.png",
        "motion": "ken-burns-pan",
        "duration": 10,
        "text": "Long Branch, New Jersey",
        "text_position": "lower_third",
        "text_start": 0, "text_end": 8,
        "transition": None,
        "orientation": "landscape",
    },
    {
        "id": "1b", "segment": 1,
        "image": "composite-portraits.png",  # generated below
        "motion": "ken-burns-pan",
        "duration": 12,
        "text": "Grant - Hayes - Garfield - Arthur - Harrison - McKinley - Wilson",
        "text_position": "lower_third",
        "text_start": 0, "text_end": 10,
        "transition": None,
        "orientation": "landscape",
    },
    {
        "id": "1c", "segment": 1,
        "image": "ai-scene-1c.png",
        "motion": "static",
        "duration": 6,
        "text": "SEVEN PRESIDENTS PARK:\nThe Myth and The Shore",
        "text_position": "center",
        "text_start": 0, "text_end": 6,
        "transition": "crossfade",
        "orientation": "landscape",
    },
    {
        "id": "1d", "segment": 1,
        "image": "church-presidents-habs.jpg",
        "motion": "ken-burns-zoom",
        "duration": 20,
        "text": "The Church of the Presidents -- Long Branch, NJ -- Est. 1879",
        "text_position": "lower_third",
        "text_start": 0, "text_end": 17,
        "transition": "crossfade",
        "orientation": "landscape",
    },
    {
        "id": "1e", "segment": 1,
        "image": "nick-church-today.jpg",
        "motion": "ken-burns-pan",
        "duration": None,  # fill rest of segment 1
        "text": "Seven Presidents Oceanfront Park -- Est. 1930",
        "text_position": "lower_third",
        "text_start": 0, "text_end": None,
        "transition": "crossfade",
        "orientation": "landscape",
    },
    # Segment 2 — America's Summer Capital (audio: 60.096s, scenes: 15+12 = 27s explicit)
    # Remaining ~33.1s goes to 2c
    {
        "id": "2a", "segment": 2,
        "image": "beach-longbranch-detroit.jpg",
        "motion": "ken-burns-pan",
        "duration": 15,
        "text": "Long Branch -- 'America's Summer Capital' -- 1870s",
        "text_position": "lower_third",
        "text_start": 0, "text_end": 12,
        "transition": "crossfade",
        "orientation": "landscape",
    },
    {
        "id": "2b", "segment": 2,
        "image": "elberon-hotel-detroit.jpg",
        "motion": "ken-burns-zoom",
        "duration": 12,
        "text": None,
        "text_position": None,
        "text_start": None, "text_end": None,
        "transition": "crossfade",
        "orientation": "landscape",
    },
    {
        "id": "2c", "segment": 2,
        "image": "ai-scene-2c.png",
        "motion": "ken-burns-zoom",
        "duration": None,  # fill rest of segment 2
        "text": "Phil Daly's Pennsylvania Club -- 'The Monte Carlo of America'",
        "text_position": "lower_third",
        "text_start": 0, "text_end": None,
        "transition": "crossfade",
        "orientation": "landscape",
    },
    # Segment 3 — Grant (audio: 78.864s, scenes: 15+10+8+12 = 45s explicit)
    # Remaining ~33.9s goes to 3d
    {
        "id": "3a", "segment": 3,
        "image": "grant-longbranch-stereograph.jpg",
        "motion": "ken-burns-zoom",
        "duration": 15,
        "text": "President Grant at Long Branch -- 1872",
        "text_position": "lower_third",
        "text_start": 0, "text_end": 12,
        "transition": "crossfade",
        "orientation": "landscape",
    },
    {
        "id": "3b", "segment": 3,
        "image": "grant-cottage-habs-exterior.jpg",
        "motion": "ken-burns-pan",
        "duration": 10,
        "text": "The Grant Cottage -- 995 Ocean Avenue, Elberon",
        "text_position": "lower_third",
        "text_start": 0, "text_end": 8,
        "transition": "crossfade",
        "orientation": "landscape",
    },
    {
        "id": "3b2", "segment": 3,
        "image": "ai-scene-3b2.png",
        "motion": "ken-burns-zoom",
        "duration": 8,
        "text": "The Summer White House -- Friday Night Poker",
        "text_position": "lower_third",
        "text_start": 0, "text_end": 6,
        "transition": "crossfade",
        "orientation": "landscape",
    },
    {
        "id": "3c", "segment": 3,
        "image": "winslow-homer-long-branch.jpg",
        "motion": "ken-burns-pan",
        "duration": 12,
        "text": "Winslow Homer -- 'Long Branch, New Jersey' -- 1869",
        "text_position": "lower_third",
        "text_start": 0, "text_end": 10,
        "transition": "crossfade",
        "orientation": "landscape",
    },
    {
        "id": "3d", "segment": 3,
        "image": "nick-grant-construction.jpg",
        "motion": "ken-burns-zoom",
        "duration": None,  # fill rest of segment 3
        "text": "Demolished 1963 -- Now a construction site",
        "text_position": "lower_third",
        "text_start": 0, "text_end": None,
        "transition": "crossfade_long",
        "orientation": "landscape",
    },
    # Segment 4 — The Garfield Story (TRIMMED v2: audio: 75.984s, scenes: 10+10+15+12 = 47s explicit)
    # Remaining ~29s goes to 4e
    {
        "id": "4a", "segment": 4,
        "image": "garfield-assassination-composite.jpg",
        "motion": "gentle-zoom",
        "duration": 10,
        "text": "July 2, 1881",
        "text_position": "lower_third",
        "text_start": 0, "text_end": 8,
        "transition": None,
        "orientation": "landscape",
    },
    {
        "id": "4b", "segment": 4,
        "image": "garfield-assassination-engraving.jpg",
        "motion": "ken-burns-zoom",
        "duration": 10,
        "text": "'I am a Stalwart of the Stalwarts! Arthur is now President!'",
        "text_position": "lower_third",
        "text_start": 0, "text_end": 8,
        "transition": "crossfade",
        "orientation": "portrait",  # pillarbox
    },
    {
        "id": "4c", "segment": 4,
        "image": "railroad-track-laying-leslies.jpg",
        "motion": "ken-burns-pan",
        "duration": 15,
        "text": "September 5, 1881 -- Elberon, New Jersey",
        "text_position": "lower_third",
        "text_start": 0, "text_end": 12,
        "transition": None,
        "orientation": "portrait",  # pillarbox
    },
    {
        "id": "4d", "segment": 4,
        "image": "garfield-removal-francklyn-leslies.jpg",
        "motion": "ken-burns-zoom",
        "duration": 12,
        "text": "Francklyn Cottage -- Elberon, Long Branch",
        "text_position": "lower_third",
        "text_start": 0, "text_end": 10,
        "transition": "crossfade",
        "orientation": "landscape",
    },
    {
        "id": "4e", "segment": 4,
        "image": "nick-garfield-marker.jpg",
        "motion": "gentle-zoom",
        "duration": None,  # fill rest of segment 4
        "text": "September 19, 1881 -- 10:35 PM",
        "text_position": "lower_third",
        "text_start": 0, "text_end": None,
        "transition": "crossfade_long",
        "orientation": "landscape",
    },
    # Segment 5 — The Disputed Presidents (audio: 55.920s, scenes: 14s explicit)
    # Remaining ~41.9s goes to 5a2
    {
        "id": "5a", "segment": 5,
        "image": "composite-disputed.png",  # generated below
        "motion": "ken-burns-pan",
        "duration": 14,
        "text": "The Disputed Three",
        "text_position": "lower_third",
        "text_start": 0, "text_end": 12,
        "transition": None,
        "orientation": "landscape",
    },
    {
        "id": "5a2", "segment": 5,
        "image": "nick-church-monument.jpg",
        "motion": "ken-burns-zoom",
        "duration": None,  # fill rest of segment 5
        "text": "Four Presidents Park?",
        "text_position": "lower_third",
        "text_start": 0, "text_end": None,
        "transition": "crossfade",
        "orientation": "landscape",
    },
    # Segment 6 — Wilson & McKinley (audio: 69.624s, scenes: 15+15+12 = 42s explicit)
    # Remaining ~27.6s goes to 6d
    {
        "id": "6a", "segment": 6,
        "image": "wilson-notification-shadow-lawn.jpg",
        "motion": "ken-burns-pan",
        "duration": 15,
        "text": "Shadow Lawn -- West Long Branch -- 1916",
        "text_position": "lower_third",
        "text_start": 0, "text_end": 12,
        "transition": None,
        "orientation": "landscape",
    },
    {
        "id": "6b", "segment": 6,
        "image": "shadow-lawn-exterior-harris-ewing.jpg",
        "motion": "ken-burns-zoom",
        "duration": 15,
        "text": None,
        "text_position": None,
        "text_start": None, "text_end": None,
        "transition": None,
        "orientation": "landscape",
    },
    {
        "id": "6c", "segment": 6,
        "image": "wilson-accepting-nomination-1916.jpg",
        "motion": "ken-burns-zoom",
        "duration": 12,
        "text": "'He Kept Us Out of War' -- a promise broken five months later",
        "text_position": "lower_third",
        "text_start": 0, "text_end": 10,
        "transition": None,
        "orientation": "landscape",
    },
    {
        "id": "6d", "segment": 6,
        "image": "shadow-lawn-interior-hallway.jpg",
        "motion": "gentle-zoom",
        "duration": None,  # fill rest of segment 6
        "text": "Shadow Lawn burned in 1927. The replacement became\nMonmouth University. Wilson's name was removed in 2020.",
        "text_position": "lower_third",
        "text_start": 0, "text_end": None,
        "transition": "crossfade_long",
        "orientation": "portrait",  # pillarbox
    },
    # Segment 7 — What Endures (audio: 50.400s, scenes: 10+8+10 = 28s explicit)
    # Remaining ~22.4s goes to 7c
    {
        "id": "7a", "segment": 7,
        "image": "nick-park-beach.jpg",
        "motion": "ken-burns-pan",
        "duration": 10,
        "text": None,
        "text_position": None,
        "text_start": None, "text_end": None,
        "transition": "crossfade",
        "orientation": "landscape",
    },
    {
        "id": "7b", "segment": 7,
        "image": "nick-teahouse-exterior.jpg",
        "motion": "ken-burns-zoom",
        "duration": 4,
        "text": "The Garfield Tea House -- Built from the Railroad Ties of 1881",
        "text_position": "lower_third",
        "text_start": 0, "text_end": 3.5,
        "transition": "crossfade",
        "orientation": "landscape",
    },
    {
        "id": "7b-int", "segment": 7,
        "image": "nick-teahouse-interior.jpg",
        "motion": "ken-burns-pan",
        "duration": 4,
        "text": "Railroad Tie Walls -- Stained Glass Windows",
        "text_position": "lower_third",
        "text_start": 0, "text_end": 3.5,
        "transition": "crossfade",
        "orientation": "landscape",
    },
    {
        "id": "7b2", "segment": 7,
        "image": "nick-park-jetty.jpg",
        "motion": "ken-burns-pan",
        "duration": 10,
        "text": "Seven Presidents. Four Undeniable. Three Debatable.",
        "text_position": "lower_third",
        "text_start": 0, "text_end": 8,
        "transition": "crossfade",
        "orientation": "landscape",
    },
    {
        "id": "7c", "segment": 7,
        "image": "ai-scene-7c.png",
        "motion": "static",
        "duration": None,  # fill rest of segment 7
        "text": "Five Videos. Seven Presidents. This is just the beginning.\n\nSUBSCRIBE for the full Seven Presidents series",
        "text_position": "center",
        "text_start": 0, "text_end": None,
        "transition": "fade_to_black",
        "orientation": "landscape",
    },
]

# Narration segment durations — read dynamically from audio files
def get_audio_duration(filepath):
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1", filepath],
        capture_output=True, text=True
    )
    return float(result.stdout.strip().split("=")[-1])

SEGMENT_DURATIONS = {}
for _seg_num in range(1, 8):
    _audio_path = os.path.join(NARRATION, f"segment-{_seg_num:02d}.mp3")
    if os.path.exists(_audio_path):
        SEGMENT_DURATIONS[_seg_num] = get_audio_duration(_audio_path)
        print(f"  Segment {_seg_num}: {SEGMENT_DURATIONS[_seg_num]:.2f}s")
    else:
        print(f"  WARNING: {_audio_path} not found!")


def run(cmd, label=""):
    """Run an ffmpeg command and exit on failure."""
    print(f"\n--- {label} ---")
    print("CMD:", " ".join(cmd))
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print("STDERR:", result.stderr[-3000:])
        print(f"FAILED: {label}")
        sys.exit(1)
    return result


def run_silent(cmd):
    """Run a command quietly; return (returncode, stderr)."""
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.returncode, result.stderr


def image_is_portrait(img_file):
    """Return True if the image is taller than wide."""
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0",
         "-show_entries", "stream=width,height", "-of", "csv=p=0", img_file],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        return False
    parts = result.stdout.strip().split(",")
    if len(parts) < 2:
        return False
    w, h = int(parts[0]), int(parts[1])
    return h > w


# ---------------------------------------------------------------------------
# Step 0: Resolve fill durations
# ---------------------------------------------------------------------------
def resolve_fill_durations():
    """For scenes with duration=None, assign remaining segment time."""
    by_segment = {}
    for s in SCENES:
        seg = s["segment"]
        by_segment.setdefault(seg, []).append(s)

    for seg, scenes in by_segment.items():
        total_dur = SEGMENT_DURATIONS[seg]
        explicit = sum(s["duration"] for s in scenes if s["duration"] is not None)
        fill_count = sum(1 for s in scenes if s["duration"] is None)
        fill_dur = (total_dur - explicit) / fill_count if fill_count > 0 else 0
        for s in scenes:
            if s["duration"] is None:
                s["duration"] = round(fill_dur, 3)
                # Also set text_end for "till end" overlays
                if s["text_end"] is None and s["text"] is not None:
                    s["text_end"] = s["duration"]


# ---------------------------------------------------------------------------
# Step 1: Generate composite images for scenes needing multiple portraits
# ---------------------------------------------------------------------------
def generate_composite_portraits():
    """Build a side-by-side composite of 7 presidential portraits (scene 1b)."""
    out = f"{IMAGES}/composite-portraits.png"
    if os.path.exists(out):
        print(f"Composite portraits already exists: {out}")
        return

    portraits = [
        f"{IMAGES}/grant-portrait-brady.jpg",
        f"{IMAGES}/hayes-portrait-brady.jpg",
        f"{IMAGES}/garfield-portrait.jpg",
        f"{IMAGES}/arthur-portrait.jpg",
        f"{IMAGES}/harrison-portrait-brady.jpg",
        f"{IMAGES}/mckinley-portrait.jpg",
        f"{IMAGES}/wilson-portrait.jpg",
    ]
    # Scale each to 274x400 (7 * 274 = 1918 ≈ 1920), then hstack
    scaled = []
    for i, p in enumerate(portraits):
        tmp = f"{ASSEMBLY_DIR}/portrait_{i}.png"
        run(["ffmpeg", "-y", "-i", p,
             "-vf", "scale=274:400:force_original_aspect_ratio=increase,crop=274:400",
             tmp], f"Scale portrait {i}")
        scaled.append(tmp)

    # Stack horizontally
    inputs = []
    for s in scaled:
        inputs += ["-i", s]
    filter_str = "".join(f"[{i}:v]" for i in range(7)) + "hstack=inputs=7[h]"
    # Pad to full 1920x1080 on dark background
    filter_str += ";[h]pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=#1a1a1a[out]"
    run(["ffmpeg", "-y"] + inputs +
        ["-filter_complex", filter_str, "-map", "[out]", out],
        "Composite portraits")


def generate_composite_disputed():
    """Build a side-by-side composite of 3 disputed presidents (scene 5a)."""
    out = f"{IMAGES}/composite-disputed.png"
    if os.path.exists(out):
        print(f"Composite disputed already exists: {out}")
        return

    portraits = [
        f"{IMAGES}/hayes-portrait-brady.jpg",
        f"{IMAGES}/harrison-portrait-brady.jpg",
        f"{IMAGES}/arthur-portrait.jpg",
    ]
    scaled = []
    for i, p in enumerate(portraits):
        tmp = f"{ASSEMBLY_DIR}/disputed_{i}.png"
        run(["ffmpeg", "-y", "-i", p,
             "-vf", "scale=620:800:force_original_aspect_ratio=increase,crop=620:800",
             tmp], f"Scale disputed portrait {i}")
        scaled.append(tmp)

    inputs = []
    for s in scaled:
        inputs += ["-i", s]
    filter_str = "[0:v][1:v][2:v]hstack=inputs=3[h]"
    filter_str += ";[h]pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=#1a1a1a[out]"
    run(["ffmpeg", "-y"] + inputs +
        ["-filter_complex", filter_str, "-map", "[out]", out],
        "Composite disputed")


# ---------------------------------------------------------------------------
# Step 2: Build video segments (video only, no audio)
# ---------------------------------------------------------------------------

# Track temp text files so we can clean up
_text_files = []


def write_text_file(text, scene_id, line_idx):
    """Write text to a temp file for FFmpeg textfile= parameter. Returns path."""
    path = f"{ASSEMBLY_DIR}/textfile_{scene_id}_{line_idx}.txt"
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
    _text_files.append(path)
    return path


def make_text_filter(text, position, t_start, t_end, duration, scene_id="x"):
    """Build FFmpeg drawtext filter string using textfile= to avoid escaping issues."""
    if not text:
        return None

    lines = text.split("\n")

    # Use t_end = duration if it's still None
    if t_end is None:
        t_end = duration

    enable = f"between(t,{t_start},{t_end})"
    font_size = 44 if len(lines) > 1 else 52
    line_spacing = font_size + 10

    filters = []
    for idx, line in enumerate(lines):
        line = line.strip()
        if not line:
            continue

        # Write line to temp file to avoid ALL escaping issues
        tf = write_text_file(line, scene_id, idx)

        if position == "lower_third":
            y_expr = f"h*0.85+{idx * line_spacing}"
        elif position == "center":
            total_height = len([l for l in lines if l.strip()]) * line_spacing
            y_expr = f"(h-{total_height})/2+{idx * line_spacing}"
        else:
            y_expr = f"h*0.85+{idx * line_spacing}"

        # Fade in/out: 0.5s in, 0.5s out
        alpha_expr = (
            f"if(lt(t,{t_start + 0.5}),(t-{t_start})/0.5,"
            f"if(gt(t,{t_end - 0.5}),({t_end}-t)/0.5,1))"
        )

        draw = (
            f"drawtext=textfile={tf}"
            f":fontsize={font_size}"
            f":fontcolor=white"
            f":borderw=3:bordercolor=black@0.8"
            f":x=(w-text_w)/2:y={y_expr}"
            f":enable='{enable}'"
            f":alpha='{alpha_expr}'"
        )
        filters.append(draw)

    return ",".join(filters) if filters else None


def build_video_filter(motion, orientation, text_filter, duration):
    """Build the full FFmpeg -vf filter chain for a scene."""
    fps = FPS

    # Base video transform based on orientation and motion
    if orientation == "portrait":
        # Pillarbox: scale height to 1080, pad to 1920 width
        if motion in ("ken-burns-zoom", "gentle-zoom"):
            # Scale up for zoom headroom, apply gentle zoom, then pillarbox
            zoom_rate = 0.0001 if motion == "gentle-zoom" else 0.0005
            max_zoom = 1.03 if motion == "gentle-zoom" else 1.15
            d_frames = int(fps * duration)
            scale_h = 4320  # ~4x for zoom headroom
            video_vf = (
                f"scale=-1:{scale_h},"
                f"zoompan=z='min(zoom+{zoom_rate},{max_zoom})'"
                f":x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"
                f":d={d_frames}:s=608x1080:fps={fps},"
                f"pad=1920:1080:(ow-iw)/2:0:black"
            )
        else:
            # Static pillarbox
            video_vf = "scale=-1:1080,pad=1920:1080:(ow-iw)/2:0:black"

    elif motion == "ken-burns-zoom":
        d_frames = int(fps * duration)
        video_vf = (
            f"scale=8000:-1,"
            f"zoompan=z='min(zoom+0.0005,1.15)'"
            f":x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"
            f":d={d_frames}:s={RESOLUTION}:fps={fps}"
        )

    elif motion == "ken-burns-pan":
        d_frames = int(fps * duration)
        video_vf = (
            f"scale=8000:-1,"
            f"zoompan=z='1.1'"
            f":x='if(eq(on,1),0,x+2)'"
            f":y='ih/2-(ih/zoom/2)'"
            f":d={d_frames}:s={RESOLUTION}:fps={fps}"
        )

    elif motion == "gentle-zoom":
        d_frames = int(fps * duration)
        video_vf = (
            f"scale=8000:-1,"
            f"zoompan=z='min(zoom+0.0001,1.05)'"
            f":x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"
            f":d={d_frames}:s={RESOLUTION}:fps={fps}"
        )

    else:  # static
        video_vf = (
            f"scale={W}:{H}:force_original_aspect_ratio=decrease,"
            f"pad={W}:{H}:(ow-iw)/2:(oh-ih)/2:black"
        )

    if text_filter:
        return video_vf + "," + text_filter
    return video_vf


def build_segment(scene, out_path):
    """Create a video-only MP4 segment for a single scene."""
    if os.path.exists(out_path):
        print(f"  Segment already exists, skipping: {out_path}")
        return

    img = f"{IMAGES}/{scene['image']}"
    if not os.path.exists(img):
        print(f"  WARNING: Image not found: {img} — using placeholder black frame")
        # Create a black placeholder
        run(["ffmpeg", "-y", "-f", "lavfi",
             f"-i", f"color=c=black:s={RESOLUTION}:d={scene['duration']}:r={FPS}",
             "-c:v", "libx264", "-pix_fmt", "yuv420p",
             "-r", str(FPS), out_path], f"Black placeholder for {scene['id']}")
        return

    duration = scene["duration"]
    orientation = scene["orientation"]
    # Auto-detect portrait images regardless of storyboard spec
    if image_is_portrait(img):
        orientation = "portrait"

    text_filter = make_text_filter(
        scene.get("text"),
        scene.get("text_position"),
        scene.get("text_start", 0) or 0,
        scene.get("text_end"),
        duration,
        scene_id=scene["id"]
    )

    vf = build_video_filter(scene["motion"], orientation, text_filter, duration)

    cmd = [
        "ffmpeg", "-y",
        "-loop", "1", "-i", img,
        "-vf", vf,
        "-t", str(duration),
        "-c:v", "libx264",
        "-crf", "18",
        "-preset", "medium",
        "-pix_fmt", "yuv420p",
        "-r", str(FPS),
        out_path
    ]

    run(cmd, f"Segment {scene['id']}")


# ---------------------------------------------------------------------------
# Step 3: Build continuous narration track
# ---------------------------------------------------------------------------
def normalize_narration():
    """Normalize all narration MP3s to -16 LUFS WAV files."""
    for seg_num in range(1, 8):
        src = f"{NARRATION}/segment-0{seg_num}.mp3"
        dst = f"{ASSEMBLY_DIR}/narration/seg{seg_num}-norm.wav"
        if os.path.exists(dst):
            print(f"  Narration {seg_num} already normalized")
            continue
        run([
            "ffmpeg", "-y", "-i", src,
            "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
            dst
        ], f"Normalize narration segment {seg_num}")


def build_continuous_narration(segment_durations):
    """Combine normalized narration segments into one continuous WAV using adelay."""
    out = f"{ASSEMBLY_DIR}/narration-continuous.wav"
    if os.path.exists(out):
        print(f"  Continuous narration already built: {out}")
        return out

    # Calculate start times (ms) for each segment based on video segment durations
    # Narration starts at the beginning of each visual segment
    cumulative_ms = 0
    delays = []
    inputs = []
    for seg_num in range(1, 8):
        delays.append(int(cumulative_ms))
        inputs += ["-i", f"{ASSEMBLY_DIR}/narration/seg{seg_num}-norm.wav"]
        cumulative_ms += segment_durations[seg_num] * 1000

    # Build adelay filter
    filter_parts = []
    for i, delay_ms in enumerate(delays):
        filter_parts.append(f"[{i}:a]adelay={delay_ms}|{delay_ms}[a{i}]")

    mix_inputs = "".join(f"[a{i}]" for i in range(7))
    mix = f"{mix_inputs}amix=inputs=7:duration=longest:normalize=0[out]"
    filter_complex = "; ".join(filter_parts) + "; " + mix

    cmd = ["ffmpeg", "-y"] + inputs + [
        "-filter_complex", filter_complex,
        "-map", "[out]",
        out
    ]
    run(cmd, "Build continuous narration track")
    return out


# ---------------------------------------------------------------------------
# Step 4: Mix narration + ambient music placeholder (Python)
# ---------------------------------------------------------------------------
def mix_audio_with_ambient(narration_path, total_duration, out_path):
    """
    Mix narration with a gentle ambient sine tone at 5% volume as music placeholder.
    Uses scipy/numpy if available, otherwise ffmpeg fallback.
    """
    if os.path.exists(out_path):
        print(f"  Final audio already exists: {out_path}")
        return out_path

    # Try Python mixing first
    try:
        import numpy as np
        import soundfile as sf

        print("  Mixing audio with Python (numpy/soundfile)...")
        narration, sr = sf.read(narration_path)

        # Generate a subtle low-frequency ambient tone (220 Hz sine, very quiet)
        num_samples = int(total_duration * sr)
        t = np.linspace(0, total_duration, num_samples, endpoint=False)

        # Layered ambient: 220 Hz + 330 Hz at very low volume
        ambient = (
            np.sin(2 * np.pi * 220 * t) * 0.03 +
            np.sin(2 * np.pi * 330 * t) * 0.015 +
            np.sin(2 * np.pi * 110 * t) * 0.02
        )

        # Apply slow amplitude envelope (fade in over 3s, fade out over 5s)
        fade_in_samples = int(3 * sr)
        fade_out_samples = int(5 * sr)
        envelope = np.ones(num_samples)
        envelope[:fade_in_samples] = np.linspace(0, 1, fade_in_samples)
        envelope[-fade_out_samples:] = np.linspace(1, 0, fade_out_samples)
        ambient = ambient * envelope

        # Make stereo
        if narration.ndim == 1:
            narration = np.column_stack([narration, narration])
        ambient_stereo = np.column_stack([ambient, ambient])

        # Trim/pad ambient to match narration length
        nar_len = len(narration)
        if len(ambient_stereo) < nar_len:
            pad = np.zeros((nar_len - len(ambient_stereo), 2))
            ambient_stereo = np.vstack([ambient_stereo, pad])
        else:
            ambient_stereo = ambient_stereo[:nar_len]

        mixed = narration + ambient_stereo

        # Normalize to prevent clipping
        peak = np.max(np.abs(mixed))
        if peak > 0.95:
            mixed = mixed * (0.95 / peak)

        sf.write(out_path, mixed, sr)
        print(f"  Mixed audio written: {out_path}")
        return out_path

    except ImportError:
        print("  numpy/soundfile not available — using ffmpeg ambient tone fallback")

    # FFmpeg fallback: mix narration with a generated sine tone
    # Generate ambient sine tone WAV
    tone_path = f"{ASSEMBLY_DIR}/ambient-tone.wav"
    run([
        "ffmpeg", "-y",
        "-f", "lavfi",
        "-i", f"sine=frequency=220:sample_rate=44100:duration={total_duration}",
        "-af", "volume=0.05",
        tone_path
    ], "Generate ambient tone")

    run([
        "ffmpeg", "-y",
        "-i", narration_path,
        "-i", tone_path,
        "-filter_complex",
        "[0:a][1:a]amix=inputs=2:duration=first:normalize=0[aout]",
        "-map", "[aout]",
        out_path
    ], "Mix narration + ambient tone")

    return out_path


# ---------------------------------------------------------------------------
# Step 5: Verify audio levels
# ---------------------------------------------------------------------------
def verify_audio(path):
    result = subprocess.run(
        ["ffmpeg", "-i", path, "-af", "volumedetect", "-f", "null", "/dev/null"],
        capture_output=True, text=True
    )
    lines = [l for l in result.stderr.split("\n")
             if "mean_volume" in l or "max_volume" in l]
    for line in lines:
        print("  AUDIO:", line.strip())


# ---------------------------------------------------------------------------
# Step 6: Concatenate all video segments
# ---------------------------------------------------------------------------
def concatenate_segments(segment_paths, out_path):
    """Write concat.txt and join all video-only segments."""
    if os.path.exists(out_path):
        print(f"  Concat already exists: {out_path}")
        return out_path

    concat_txt = f"{ASSEMBLY_DIR}/concat.txt"
    with open(concat_txt, "w") as f:
        for p in segment_paths:
            f.write(f"file '{p}'\n")

    run([
        "ffmpeg", "-y",
        "-f", "concat", "-safe", "0",
        "-i", concat_txt,
        "-c", "copy",
        out_path
    ], "Concatenate all segments")
    return out_path


# ---------------------------------------------------------------------------
# Step 7: Mux video + audio, final encode
# ---------------------------------------------------------------------------
def final_encode(video_path, audio_path, out_path):
    """Mux video with final audio and encode to YouTube-optimized H.264."""
    run([
        "ffmpeg", "-y",
        "-i", video_path,
        "-i", audio_path,
        "-c:v", "libx264",
        "-preset", "slow",
        "-crf", "18",
        "-c:a", "aac",
        "-b:a", "192k",
        "-movflags", "+faststart",
        "-pix_fmt", "yuv420p",
        "-shortest",
        out_path
    ], "Final encode")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    print("=" * 60)
    print("Seven Presidents Park -- Video Assembly")
    print("=" * 60)

    os.makedirs(SEGMENTS_DIR, exist_ok=True)
    os.makedirs(f"{ASSEMBLY_DIR}/narration", exist_ok=True)
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Step 0: Resolve fill durations
    print("\n[Step 0] Resolving fill durations...")
    resolve_fill_durations()
    for s in SCENES:
        print(f"  Scene {s['id']}: {s['duration']:.1f}s ({s['motion']})")

    total_video_dur = sum(SEGMENT_DURATIONS.values())
    print(f"\n  Total video duration: {total_video_dur:.1f}s")

    # Step 1: Build composite images
    print("\n[Step 1] Building composite images...")
    generate_composite_portraits()
    generate_composite_disputed()

    # Step 2: Build all video segments
    print("\n[Step 2] Building video segments...")
    segment_paths = []
    for scene in SCENES:
        out = f"{SEGMENTS_DIR}/scene-{scene['id']}.mp4"
        build_segment(scene, out)
        segment_paths.append(out)
        print(f"  Done: scene-{scene['id']}.mp4")

    # Step 3: Concatenate video segments
    print("\n[Step 3] Concatenating video segments...")
    raw_video = f"{ASSEMBLY_DIR}/video-only.mp4"
    concatenate_segments(segment_paths, raw_video)

    # Step 4: Normalize narration
    print("\n[Step 4] Normalizing narration audio...")
    normalize_narration()

    # Step 5: Build continuous narration track
    print("\n[Step 5] Building continuous narration track...")
    narration_continuous = build_continuous_narration(SEGMENT_DURATIONS)

    # Step 6: Mix with ambient music placeholder
    print("\n[Step 6] Mixing narration + ambient music...")
    final_audio = f"{ASSEMBLY_DIR}/final-audio.wav"
    mix_audio_with_ambient(narration_continuous, total_video_dur, final_audio)

    print("\n  Verifying audio levels:")
    verify_audio(final_audio)

    # Step 7: Final encode
    print("\n[Step 7] Final encode...")
    final_encode(raw_video, final_audio, OUTPUT_FILE)

    # Report
    size_mb = os.path.getsize(OUTPUT_FILE) / (1024 * 1024)
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", OUTPUT_FILE],
        capture_output=True, text=True
    )
    runtime = float(result.stdout.strip())
    mins = int(runtime // 60)
    secs = int(runtime % 60)

    print("\n" + "=" * 60)
    print("ASSEMBLY COMPLETE")
    print(f"  Output: {OUTPUT_FILE}")
    print(f"  Runtime: {mins}m {secs}s")
    print(f"  File size: {size_mb:.1f} MB")
    print(f"  Scenes: {len(SCENES)}")
    print(f"  Encoding: H.264 1080p 30fps, AAC 192kbps")
    print("=" * 60)


if __name__ == "__main__":
    main()
