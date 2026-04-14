#!/usr/bin/env python3
"""
Cold Plan Shorts Builder
Extracts, reorders, and assembles trailer-style vertical shorts from the main video.
Output: 5 vertical (1080x1920) shorts under 60 seconds each.
"""

import subprocess
import os
import json
from pathlib import Path

SOURCE = "/Users/nickd/Workspaces/AgentArchitect/teams/youtube-content/projects/cold-plan-video/output/cold-plan-final-v3.mp4"
OUT_DIR = "/Users/nickd/Workspaces/AgentArchitect/teams/youtube-content/projects/cold-plan-video/shorts"
SUBS_DIR = os.path.join(OUT_DIR, "subs")

# Font path - Arial Black for pop-style subs, Arial Bold for overlays
FONT_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FONT_BLACK = "/System/Library/Fonts/Supplemental/Arial Black.ttf"
FONT_REGULAR = "/System/Library/Fonts/Helvetica.ttc"

# Use Arial Bold as fallback if Arial Black not present
import os.path
if not os.path.exists(FONT_BLACK):
    FONT_BLACK = FONT_BOLD
if not os.path.exists(FONT_BOLD):
    FONT_BOLD = FONT_REGULAR

# CTA text
CTA_TEXT = "Full breakdown on my channel"

def run(cmd, desc=""):
    """Run a shell command, print output on error."""
    print(f"  -> {desc or cmd[:80]}")
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"  ERROR: {result.stderr[-500:]}")
        raise RuntimeError(f"Command failed: {desc}")
    return result.stdout

def extract_segment(source, start, duration, output, desc=""):
    """Extract a segment from the source video."""
    cmd = (
        f'ffmpeg -y -ss {start} -i "{source}" -t {duration} '
        f'-c:v libx264 -preset fast -crf 20 -c:a aac -b:a 192k '
        f'"{output}"'
    )
    run(cmd, desc or f"Extract {start}+{duration}s -> {Path(output).name}")

def make_vertical(input_file, output_file, desc=""):
    """Crop 1920x1080 to 1080x1920 (9:16 vertical). Center crop."""
    # Scale so height is 1920, then center crop to 1080 wide
    cmd = (
        f'ffmpeg -y -i "{input_file}" '
        f'-vf "scale=-1:1920,crop=1080:1920:(iw-1080)/2:0" '
        f'-c:v libx264 -preset fast -crf 20 -c:a copy '
        f'"{output_file}"'
    )
    run(cmd, desc or f"Vertical crop -> {Path(output_file).name}")

def get_duration(file):
    """Get video duration in seconds."""
    result = subprocess.run(
        f'ffprobe -v quiet -show_entries format=duration -of csv=p=0 "{file}"',
        shell=True, capture_output=True, text=True
    )
    return float(result.stdout.strip())

def concat_segments(segment_files, output_file, desc=""):
    """Concatenate multiple video segments using concat demuxer."""
    list_file = output_file.replace(".mp4", "_concat_list.txt")
    with open(list_file, "w") as f:
        for seg in segment_files:
            f.write(f"file '{seg}'\n")
    cmd = (
        f'ffmpeg -y -f concat -safe 0 -i "{list_file}" '
        f'-c:v libx264 -preset fast -crf 20 -c:a aac -b:a 192k '
        f'"{output_file}"'
    )
    run(cmd, desc or f"Concat {len(segment_files)} segments -> {Path(output_file).name}")
    os.remove(list_file)

def add_overlays(input_file, output_file, hook_text, cta_text, total_duration, desc=""):
    """
    Add hook title overlay (first 4s) and CTA overlay (last 3s).
    Hook text: large, centered, top third of frame.
    CTA text: medium, centered, bottom quarter of frame.
    """
    # Escape special characters for drawtext filter
    # Must escape: single quotes, colons (filter separator), backslash, dollar signs
    def esc(s):
        s = s.replace("\\", "\\\\")
        s = s.replace("'", "\\'")
        s = s.replace(":", "\\:")
        s = s.replace("$", "\\$")
        s = s.replace(",", "\\,")
        return s

    hook = esc(hook_text)
    cta = esc(cta_text)
    cta_start = max(0, total_duration - 3.5)

    # Break hook into lines if > 28 chars
    if len(hook_text) > 28:
        words = hook_text.split()
        mid = len(words) // 2
        line1 = " ".join(words[:mid])
        line2 = " ".join(words[mid:])
        hook_vf = (
            f"drawtext=text='{esc(line1)}':fontfile='{FONT_BOLD}':"
            f"fontsize=72:fontcolor=white:borderw=5:bordercolor=black@0.9:"
            f"x=(w-text_w)/2:y=220:enable='lte(t,4)',"
            f"drawtext=text='{esc(line2)}':fontfile='{FONT_BOLD}':"
            f"fontsize=72:fontcolor=white:borderw=5:bordercolor=black@0.9:"
            f"x=(w-text_w)/2:y=310:enable='lte(t,4)'"
        )
    else:
        hook_vf = (
            f"drawtext=text='{hook}':fontfile='{FONT_BOLD}':"
            f"fontsize=80:fontcolor=white:borderw=5:bordercolor=black@0.9:"
            f"x=(w-text_w)/2:y=250:enable='lte(t,4)'"
        )

    cta_vf = (
        f"drawtext=text='{cta}':fontfile='{FONT_BOLD}':"
        f"fontsize=52:fontcolor=white:borderw=3:bordercolor=black@0.9:"
        f"x=(w-text_w)/2:y=h-280:enable='gte(t,{cta_start:.1f})'"
    )

    cmd = (
        f'ffmpeg -y -i "{input_file}" '
        f'-vf "{hook_vf},{cta_vf}" '
        f'-c:v libx264 -preset slow -crf 18 -c:a copy '
        f'"{output_file}"'
    )
    run(cmd, desc or f"Overlays -> {Path(output_file).name}")

def extract_thumbnail(video_file, thumb_file, time_offset=2.0):
    """Extract a thumbnail frame."""
    cmd = (
        f'ffmpeg -y -ss {time_offset} -i "{video_file}" '
        f'-vframes 1 -q:v 2 "{thumb_file}"'
    )
    run(cmd, f"Thumbnail -> {Path(thumb_file).name}")

def make_short(short_id, slug, segments, hook_text, cta_text, description):
    """
    Build one complete short from a list of (start, duration) segments.
    segments: list of (start_seconds, duration_seconds) tuples
    """
    print(f"\n{'='*60}")
    print(f"Building Short {short_id}: {slug}")
    print(f"{'='*60}")

    work_dir = os.path.join(OUT_DIR, f"_work_short{short_id:02d}")
    os.makedirs(work_dir, exist_ok=True)

    # Step 1: Extract raw landscape segments
    seg_files = []
    for i, (start, duration) in enumerate(segments):
        seg_file = os.path.join(work_dir, f"seg_{i+1:02d}_raw.mp4")
        extract_segment(SOURCE, start, duration, seg_file,
                       f"Seg {i+1}: {start}s + {duration}s")
        seg_files.append(seg_file)

    # Step 2: Make each segment vertical (9:16)
    vert_files = []
    for i, seg_file in enumerate(seg_files):
        vert_file = os.path.join(work_dir, f"seg_{i+1:02d}_vert.mp4")
        make_vertical(seg_file, vert_file, f"Vertical crop seg {i+1}")
        vert_files.append(vert_file)

    # Step 3: Concatenate vertical segments
    concat_file = os.path.join(work_dir, "concat.mp4")
    if len(vert_files) == 1:
        import shutil
        shutil.copy(vert_files[0], concat_file)
        print(f"  -> Single segment, skip concat")
    else:
        concat_segments(vert_files, concat_file, f"Concat {len(vert_files)} vertical segments")

    # Step 4: Get duration for CTA timing
    total_dur = get_duration(concat_file)
    print(f"  -> Assembled duration: {total_dur:.1f}s")

    # Step 5: Add hook title + CTA overlays
    overlay_file = os.path.join(work_dir, "with_overlays.mp4")
    add_overlays(concat_file, overlay_file, hook_text, cta_text, total_dur,
                f"Text overlays")

    # Step 6: Move to final output location
    final_file = os.path.join(OUT_DIR, f"short-{short_id:02d}-{slug}.mp4")
    import shutil
    shutil.copy(overlay_file, final_file)
    print(f"  -> Final: {Path(final_file).name} ({total_dur:.1f}s)")

    # Step 7: Extract thumbnail
    thumb_file = os.path.join(OUT_DIR, f"short-{short_id:02d}-{slug}-thumb.jpg")
    extract_thumbnail(final_file, thumb_file, time_offset=1.5)

    # Step 8: Save metadata
    metadata = {
        "id": f"short-{short_id:02d}",
        "slug": slug,
        "description": description,
        "source_video": SOURCE,
        "source_segments": [{"start": s, "duration": d} for s, d in segments],
        "duration_seconds": round(total_dur, 1),
        "hook_text": hook_text,
        "cta_text": cta_text,
        "created_date": "2026-04-13",
        "platforms": {
            "youtube": {"title": "", "description": "", "status": "ready", "upload_date": None, "url": None},
            "instagram": {"caption": "", "status": "ready", "upload_date": None, "url": None},
            "tiktok": {"caption": "", "status": "ready", "upload_date": None, "url": None}
        }
    }
    meta_file = os.path.join(OUT_DIR, f"short-{short_id:02d}-{slug}-metadata.json")
    with open(meta_file, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"  -> Metadata saved: {Path(meta_file).name}")
    return final_file, total_dur

# ─── SHORT DEFINITIONS ───────────────────────────────────────────────────────
# Timestamps are approximate based on scene audio durations.
# Source video is 7:03 total.
#
# Scene timing (approximate seconds from start):
#   Scene 01 (Title Card):       0 -   5
#   Scene 02 (Price Shock):      5 -  24
#   Scene 03 (The Tease):       24 -  47
#   Scene 04 (Combo Meal):      47 -  74
#   Scene 05 (Same Ingredients):74 -  93
#   Scene 06 (Kleenex Names):   93 - 112
#   Scene 07 (NyQuil):         112 - 137
#   Scene 08 (DayQuil):        137 - 159
#   Scene 09 (Advil C&S):      159 - 180
#   Scene 10 (Pseudoephedrine):180 - 206
#   Scene 11 (Theraflu):       206 - 228
#   Scene 12 (Advil PM):       228 - 245
#   Scene 13 (Road Warrior):   245 - 269
#   Scene 14 (Pill Organizer): 269 - 289
#   Scene 15 (Building It):    289 - 309
#   Scene 16 (Symptom Planner):309 - 330
#   Scene 17 (Brand Lookup):   330 - 350
#   Scene 18 (Curated Kits):   350 - 380
#   Scene 19 (Adults Only):    380 - 391
#   Scene 20 (The Values):     391 - 411
#   Scene 21 (Subscribe CTA):  411 - 427
#   Scene 22 (Bookend):        427 - 418 (actual video ends ~423s)

SHORTS = [
    {
        "id": 1,
        "slug": "the-price-shock",
        "description": "Hero short — the $12 vs $0.47 thesis in 45s. Leads with the price split, proves FDA equivalence, bookend close.",
        "hook_text": "$12 vs $0.47. Same medicine.",
        "cta_text": "Full breakdown in the main video",
        "segments": [
            (0, 24),    # Scene 1+2: Title card + price shock narration
            (74, 19),   # Scene 5: FDA same ingredients reveal
            (418, 5),   # Scene 22: Bookend "$12 vs $0.47. Your call."
        ],
    },
    {
        "id": 2,
        "slug": "advil-pm-5-cents",
        "description": "Most shocking single stat: Advil PM = 2 pills = $0.05. They charge $14.",
        "hook_text": "Advil PM is 5 cents of medicine.",
        "cta_text": "Free app at cold-plan-app.web.app",
        "segments": [
            (228, 17),  # Scene 12: Advil PM breakdown ($0.05 vs $14)
            (93, 19),   # Scene 6: Kleenex names (so viewer understands the generics)
            (418, 5),   # Scene 22: Bookend close
        ],
    },
    {
        "id": 3,
        "slug": "combo-meal-trick",
        "description": "The combo meal business model analogy — most teachable concept, great for TikTok.",
        "hook_text": "Cold medicine runs the combo meal trick.",
        "cta_text": "Full video on my channel",
        "segments": [
            (47, 27),   # Scene 4: Combo meal analogy (full)
            (93, 19),   # Scene 6: Kleenex names (instant proof)
        ],
    },
    {
        "id": 4,
        "slug": "nyquil-3-pills",
        "description": "NyQuil recipe card: open the capsule, reveal 3 cheap generics. Best visual sequence.",
        "hook_text": "Let me open a NyQuil capsule.",
        "cta_text": "5 more brands broken down in the full video",
        "segments": [
            (5, 19),    # Scene 2: Price shock setup
            (74, 19),   # Scene 5: Open the capsule reveal (FDA)
            (112, 25),  # Scene 7: NyQuil recipe card full breakdown
        ],
    },
    {
        "id": 5,
        "slug": "road-warrior-secret",
        "description": "Emotional founder story: 1.3M miles of travel, the pill organizer hack, built a free app to share it.",
        "hook_text": "1.3M miles taught me this hack.",
        "cta_text": "Free app at cold-plan-app.web.app",
        "segments": [
            (245, 24),  # Scene 13: Road warrior (airport, 1.3M miles)
            (269, 20),  # Scene 14: The pill organizer routine
            (5, 15),    # Scene 2 (partial): Price hook callback ($12 vs $0.47)
        ],
    },
]

# ─── MAIN ────────────────────────────────────────────────────────────────────

def main():
    print("Cold Plan Shorts Builder")
    print(f"Source: {SOURCE}")
    print(f"Output: {OUT_DIR}")
    print()

    # Verify source exists
    if not os.path.exists(SOURCE):
        raise FileNotFoundError(f"Source video not found: {SOURCE}")

    results = []
    for short_def in SHORTS[1:]:
        final_file, duration = make_short(
            short_id=short_def["id"],
            slug=short_def["slug"],
            segments=short_def["segments"],
            hook_text=short_def["hook_text"],
            cta_text=short_def["cta_text"],
            description=short_def["description"],
        )
        results.append({
            "id": short_def["id"],
            "slug": short_def["slug"],
            "file": final_file,
            "duration": duration,
        })

    # Save tracker
    tracker = {
        "project": "cold-plan-video",
        "source_video": SOURCE,
        "full_video_url": "https://www.youtube.com/watch?v=ZxknYxKfDMg",
        "app_url": "https://cold-plan-app.web.app",
        "amazon_tag": "coldplanapp-20",
        "full_video_publish_date": "2026-04-13",
        "total_shorts": len(results),
        "shorts": [
            {
                "id": f"short-{r['id']:02d}",
                "slug": r["slug"],
                "file": f"short-{r['id']:02d}-{r['slug']}.mp4",
                "duration_seconds": r["duration"],
                "youtube": {"status": "ready", "url": None, "upload_date": None},
                "instagram": {"status": "ready", "url": None, "upload_date": None},
                "tiktok": {"status": "ready", "url": None, "upload_date": None},
            }
            for r in results
        ],
    }
    tracker_file = os.path.join(OUT_DIR, "shorts-tracker.json")
    with open(tracker_file, "w") as f:
        json.dump(tracker, f, indent=2)

    print(f"\n{'='*60}")
    print("DONE")
    print(f"{'='*60}")
    for r in results:
        print(f"  Short {r['id']}: {r['slug']}.mp4  [{r['duration']:.1f}s]")
    print(f"\nTracker: {tracker_file}")

if __name__ == "__main__":
    main()
