#!/usr/bin/env python3
"""
Seven Presidents Park -- Shorts Assembly Script
Produces 3 vertical shorts from seven-presidents-draft-v5.mp4

Usage:
  python assemble-shorts.py extract       -- extract raw clips from source
  python assemble-shorts.py crop          -- convert to vertical 9:16
  python assemble-shorts.py overlay       -- add hook text + CTA text overlays
  python assemble-shorts.py transcribe    -- Whisper transcription (requires localhost:8880)
  python assemble-shorts.py subtitles     -- generate ASS subtitle files from transcription
  python assemble-shorts.py burn          -- burn subtitles into final videos
  python assemble-shorts.py thumbnails    -- extract thumbnail frames
  python assemble-shorts.py all           -- run all phases in sequence
  python assemble-shorts.py status        -- print current file status

All output goes to this directory (same folder as this script).
"""

import subprocess
import sys
import os
import json
import requests

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
SOURCE_VIDEO = os.path.join(PROJECT_DIR, "output", "seven-presidents-clean.mp4")
SUBS_DIR = os.path.join(SCRIPT_DIR, "subs")
FONT = "/System/Library/Fonts/Supplemental/Arial Black.ttf"

os.makedirs(SUBS_DIR, exist_ok=True)

# ---------------------------------------------------------------------------
# Short definitions
# ---------------------------------------------------------------------------

SHORTS = [
    {
        "id": "short-01",
        "slug": "the-myth",
        "start": "00:00:00",
        "duration": 50,          # seconds to extract
        "hook_text": "This NJ beach is named after 7 presidents.",
        "hook_line2": "The real number? Maybe 4.",
        "hook_duration": 4.5,    # seconds hook text is visible
        "cta_text": "Full story drops Saturday. Link in description.",
        "title": "This beach is named after 7 presidents. The truth is weirder. #Shorts",
    },
    {
        "id": "short-02",
        "slug": "railroad-overnight",
        "start": "00:04:30",
        "duration": 55,
        "hook_text": "A dying president couldn't reach the beach.",
        "hook_line2": "So they built a railroad overnight.",
        "hook_duration": 4.5,
        "cta_text": "Full story drops Saturday. Link in description.",
        "title": "They built a railroad overnight to save a dying president #Shorts",
    },
    {
        "id": "short-03",
        "slug": "beach-house-campaign",
        "start": "00:06:10",
        "duration": 50,
        "hook_text": "He ran his entire presidential campaign...",
        "hook_line2": "...from a NJ beach house.",
        "hook_duration": 4.5,
        "cta_text": "Full documentary link in description.",
        "title": "He ran his entire presidential campaign from a NJ beach house #Shorts",
    },
]


def run(cmd, description=""):
    """Run a shell command, print it, and raise on failure."""
    print(f"\n--- {description or 'Running'} ---")
    print(" ".join(cmd))
    result = subprocess.run(cmd, capture_output=False)
    if result.returncode != 0:
        print(f"ERROR: command failed with code {result.returncode}")
        sys.exit(1)


def file_path(short, suffix):
    name = f"{short['id']}-{short['slug']}{suffix}"
    return os.path.join(SCRIPT_DIR, name)


# ---------------------------------------------------------------------------
# Phase 1: Extract raw clips from source video
# ---------------------------------------------------------------------------

def extract():
    print("\n=== PHASE 1: Extracting raw clips ===")
    for s in SHORTS:
        out = file_path(s, "-raw.mp4")
        if os.path.exists(out):
            print(f"  SKIP: {out} already exists")
            continue
        run([
            "ffmpeg", "-y",
            "-ss", s["start"],
            "-i", SOURCE_VIDEO,
            "-t", str(s["duration"]),
            "-c:v", "libx264",
            "-c:a", "aac",
            "-b:v", "8M",
            "-b:a", "192k",
            out,
        ], f"Extract {s['id']} from {s['start']}, {s['duration']}s")
    print("\nExtract complete.")


# ---------------------------------------------------------------------------
# Phase 2: Crop to vertical 9:16 (1080x1920)
# ---------------------------------------------------------------------------

def crop():
    print("\n=== PHASE 2: Cropping to vertical 9:16 ===")
    for s in SHORTS:
        inp = file_path(s, "-raw.mp4")
        out = file_path(s, "-vertical.mp4")
        if not os.path.exists(inp):
            print(f"  SKIP: source not found: {inp}")
            continue
        if os.path.exists(out):
            print(f"  SKIP: {out} already exists")
            continue
        # Scale height to 1920, center-crop width to 1080.
        # Source is the clean (no text overlay) version of the documentary.
        run([
            "ffmpeg", "-y",
            "-i", inp,
            "-vf", "scale=-1:1920,crop=1080:1920:(iw-1080)/2:0",
            "-c:a", "copy",
            out,
        ], f"Vertical crop {s['id']}")
    print("\nCrop complete.")


# ---------------------------------------------------------------------------
# Phase 3: Add hook text + CTA text overlays
# ---------------------------------------------------------------------------

def overlay():
    print("\n=== PHASE 3: Adding hook text + CTA overlays ===")
    for s in SHORTS:
        inp = file_path(s, "-vertical.mp4")
        out = file_path(s, "-overlay.mp4")
        if not os.path.exists(inp):
            print(f"  SKIP: source not found: {inp}")
            continue
        if os.path.exists(out):
            print(f"  SKIP: {out} already exists")
            continue

        dur = s["duration"]
        hook_end = s["hook_duration"]
        cta_start = dur - 3.5

        # Escape special chars for ffmpeg drawtext filter
        def esc(text):
            return text.replace("'", "\\'").replace(":", "\\:").replace(",", "\\,")

        hook1 = esc(s["hook_text"])
        hook2 = esc(s["hook_line2"])
        cta   = esc(s["cta_text"])

        # Hook text: sized to fit 1080px vertical frame (38px for safety)
        # CTA: 32px, positioned near bottom
        # All text centered with black border for readability
        hook_size = 38
        cta_size = 32
        vf = (
            f"drawtext=text='{hook1}'"
            f":fontfile='{FONT}'"
            f":fontsize={hook_size}"
            f":fontcolor=white"
            f":borderw=4:bordercolor=black"
            f":x=(w-text_w)/2:y=250"
            f":enable='lte(t\\,{hook_end})',"

            f"drawtext=text='{hook2}'"
            f":fontfile='{FONT}'"
            f":fontsize={hook_size}"
            f":fontcolor=yellow"
            f":borderw=4:bordercolor=black"
            f":x=(w-text_w)/2:y=320"
            f":enable='lte(t\\,{hook_end})',"

            f"drawtext=text='{cta}'"
            f":fontfile='{FONT}'"
            f":fontsize={cta_size}"
            f":fontcolor=white"
            f":borderw=3:bordercolor=black"
            f":x=(w-text_w)/2:y=h-120"
            f":enable='gte(t\\,{cta_start})'"
        )

        run([
            "ffmpeg", "-y",
            "-i", inp,
            "-vf", vf,
            "-c:a", "copy",
            out,
        ], f"Overlay text {s['id']}")
    print("\nOverlay complete.")


# ---------------------------------------------------------------------------
# Phase 4: Whisper transcription for subtitles
# ---------------------------------------------------------------------------

def transcribe():
    print("\n=== PHASE 4: Whisper transcription ===")
    whisper_url = "http://localhost:2022/v1/audio/transcriptions"
    for s in SHORTS:
        inp = file_path(s, "-overlay.mp4")
        wav = file_path(s, "-audio.wav")
        json_out = os.path.join(SUBS_DIR, f"{s['id']}-{s['slug']}-words.json")
        if not os.path.exists(inp):
            print(f"  SKIP: source not found: {inp}")
            continue
        if os.path.exists(json_out):
            print(f"  SKIP: transcription already exists: {json_out}")
            continue

        # Extract audio as 16kHz mono WAV for Whisper
        print(f"\n  Extracting audio: {wav}")
        run([
            "ffmpeg", "-y",
            "-i", inp,
            "-vn",
            "-acodec", "pcm_s16le",
            "-ar", "16000",
            "-ac", "1",
            wav,
        ], f"Extract audio for {s['id']}")

        # Transcribe with Whisper (word-level timestamps)
        print(f"  Sending to Whisper: {wav}")
        try:
            with open(wav, "rb") as f:
                response = requests.post(
                    whisper_url,
                    files={"file": (os.path.basename(wav), f, "audio/wav")},
                    data={
                        "model": "whisper-1",
                        "response_format": "verbose_json",
                        "timestamp_granularities[]": "word",
                    },
                    timeout=120,
                )
            response.raise_for_status()
            data = response.json()
            with open(json_out, "w") as jf:
                json.dump(data, jf, indent=2)
            print(f"  Saved: {json_out}")
            word_count = len(data.get("words", []))
            seg_count  = len(data.get("segments", []))
            print(f"  Words: {word_count}  Segments: {seg_count}")
        except requests.exceptions.ConnectionError:
            print(f"  ERROR: Cannot connect to Whisper at {whisper_url}")
            print("  Is the Whisper service running? Check localhost:8880")
            sys.exit(1)
        except Exception as e:
            print(f"  ERROR: {e}")
            sys.exit(1)
    print("\nTranscription complete.")


# ---------------------------------------------------------------------------
# Phase 5: Generate ASS subtitle files
# ---------------------------------------------------------------------------

def seconds_to_ass_time(t):
    """Convert float seconds to ASS timestamp format: H:MM:SS.cc"""
    h = int(t // 3600)
    m = int((t % 3600) // 60)
    s = int(t % 60)
    cs = int(round((t - int(t)) * 100))
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"


# Words to highlight in yellow -- numbers, dramatic verbs, key proper nouns
HIGHLIGHT_WORDS = {
    "seven", "7", "four", "4", "five", "5", "six", "6",
    "garfield", "grant", "wilson", "mckinley", "hayes", "arthur", "harrison",
    "assassinated", "shot", "died", "death", "dead", "killed", "murder",
    "overnight", "torchlight", "railroad", "midnight", "midnight",
    "war", "cancer", "broke", "ruined", "demolished", "burned",
    "shadow", "lawn", "elberon", "long", "branch",
    "3,200", "3200", "forty-nine", "three", "fifty-two", "twenty-eight",
    "whispered", "declared", "broke", "lost", "won", "tipped",
    "westminster", "abbey",
}


def should_highlight(word):
    cleaned = word.lower().strip(".,!?;:'\"").replace(",", "")
    return cleaned in HIGHLIGHT_WORDS


def group_into_phrases(words, max_words=4, max_duration=2.2):
    """
    Group word-level timestamps into short display phrases.
    Each phrase is 2-4 words and up to max_duration seconds.
    Returns list of (start, end, text) tuples.
    """
    phrases = []
    if not words:
        return phrases

    current_words = []
    current_start = None

    for w in words:
        wstart = w.get("start", 0)
        wend   = w.get("end", wstart + 0.3)
        wtext  = w.get("word", w.get("text", "")).strip()

        if not wtext:
            continue

        if current_start is None:
            current_start = wstart

        current_words.append((wtext, wend))

        phrase_duration = wend - current_start
        if len(current_words) >= max_words or phrase_duration >= max_duration:
            phrase_text = " ".join(t for t, _ in current_words)
            phrase_end  = current_words[-1][1]
            phrases.append((current_start, phrase_end, phrase_text))
            current_words = []
            current_start = None

    # Flush remaining words
    if current_words:
        phrase_text = " ".join(t for t, _ in current_words)
        phrase_end  = current_words[-1][1]
        phrases.append((current_start, phrase_end, phrase_text))

    return phrases


def build_ass_dialogue(phrases):
    """
    Convert phrases to ASS dialogue lines.
    Words that match HIGHLIGHT_WORDS get an inline yellow color tag.
    """
    lines = []
    for start, end, text in phrases:
        ass_start = seconds_to_ass_time(start)
        ass_end   = seconds_to_ass_time(end)

        # Build inline-highlighted text
        parts = text.split()
        highlighted_parts = []
        for p in parts:
            if should_highlight(p):
                highlighted_parts.append(r"{\c&H00FFFF&}" + p + r"{\c&HFFFFFF&}")
            else:
                highlighted_parts.append(p)
        display_text = " ".join(highlighted_parts)

        lines.append(
            f"Dialogue: 0,{ass_start},{ass_end},Pop,,0,0,0,,{display_text}"
        )
    return lines


ASS_HEADER = """\
[Script Info]
Title: Seven Presidents Park Shorts Subtitles
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Pop,Arial Black,56,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,3,0,5,60,60,640,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""


def subtitles():
    print("\n=== PHASE 5: Generating ASS subtitle files ===")
    for s in SHORTS:
        json_in = os.path.join(SUBS_DIR, f"{s['id']}-{s['slug']}-words.json")
        ass_out = os.path.join(SUBS_DIR, f"{s['id']}-{s['slug']}.ass")

        if not os.path.exists(json_in):
            print(f"  SKIP: transcription not found: {json_in} (run 'transcribe' first)")
            continue
        if os.path.exists(ass_out):
            print(f"  SKIP: ASS file already exists: {ass_out}")
            continue

        with open(json_in) as f:
            data = json.load(f)

        words = data.get("words", [])
        if not words:
            # Fall back to segments: split each segment text into pseudo-words
            print(f"  No word-level data for {s['id']}, falling back to segments")
            segments = data.get("segments", [])
            words = []
            for seg in segments:
                seg_text  = seg.get("text", "").strip().split()
                seg_start = seg.get("start", 0)
                seg_end   = seg.get("end", seg_start + len(seg_text) * 0.35)
                if not seg_text:
                    continue
                step = (seg_end - seg_start) / len(seg_text)
                for i, w in enumerate(seg_text):
                    words.append({
                        "word": w,
                        "start": seg_start + i * step,
                        "end":   seg_start + (i + 1) * step,
                    })

        phrases = group_into_phrases(words, max_words=4, max_duration=2.2)
        dialogue_lines = build_ass_dialogue(phrases)

        with open(ass_out, "w") as f:
            f.write(ASS_HEADER)
            f.write("\n".join(dialogue_lines))
            f.write("\n")

        print(f"  Wrote {len(dialogue_lines)} subtitle phrases: {ass_out}")
    print("\nSubtitles complete.")


# ---------------------------------------------------------------------------
# Phase 6: Burn subtitles into final videos
# ---------------------------------------------------------------------------

def burn():
    print("\n=== PHASE 6: Burning subtitles into final videos ===")
    for s in SHORTS:
        inp     = file_path(s, "-overlay.mp4")
        ass_in  = os.path.join(SUBS_DIR, f"{s['id']}-{s['slug']}.ass")
        out     = file_path(s, ".mp4")   # final output: short-01-the-myth.mp4

        if not os.path.exists(inp):
            print(f"  SKIP: overlay not found: {inp}")
            continue
        if not os.path.exists(ass_in):
            print(f"  SKIP: ASS file not found: {ass_in} (run 'subtitles' first)")
            continue
        if os.path.exists(out):
            print(f"  SKIP: final output already exists: {out}")
            continue

        # Escape path for ffmpeg ass filter (colons must be escaped on macOS)
        ass_escaped = ass_in.replace(":", "\\:")

        run([
            "ffmpeg", "-y",
            "-i", inp,
            "-vf", f"ass={ass_escaped}",
            "-c:v", "libx264",
            "-preset", "slow",
            "-crf", "18",
            "-c:a", "copy",
            out,
        ], f"Burn subtitles {s['id']}")
    print("\nBurn complete.")


# ---------------------------------------------------------------------------
# Phase 7: Extract thumbnail frames
# ---------------------------------------------------------------------------

def thumbnails():
    print("\n=== PHASE 7: Extracting thumbnails ===")
    for s in SHORTS:
        inp = file_path(s, ".mp4")
        out = file_path(s, "-thumb.jpg")
        if not os.path.exists(inp):
            print(f"  SKIP: final video not found: {inp}")
            continue
        if os.path.exists(out):
            print(f"  SKIP: {out} already exists")
            continue
        # Frame 45 (roughly 1.5 seconds in at 30fps) -- past the opening slate
        run([
            "ffmpeg", "-y",
            "-i", inp,
            "-vf", "select=eq(n\\,45)",
            "-vframes", "1",
            out,
        ], f"Thumbnail {s['id']}")
    print("\nThumbnails complete.")


# ---------------------------------------------------------------------------
# Status check
# ---------------------------------------------------------------------------

def status():
    print("\n=== File Status ===\n")
    suffixes = [
        ("-raw.mp4",        "1. Raw extract"),
        ("-vertical.mp4",   "2. Vertical crop"),
        ("-overlay.mp4",    "3. Text overlay"),
        (".mp4",            "4. Final (with subs)"),
        ("-thumb.jpg",      "5. Thumbnail"),
    ]
    for s in SHORTS:
        print(f"{s['id']} -- {s['slug']}")
        for suf, label in suffixes:
            path = file_path(s, suf)
            exists = "OK" if os.path.exists(path) else "missing"
            size_str = ""
            if os.path.exists(path):
                size_mb = os.path.getsize(path) / 1_000_000
                size_str = f" ({size_mb:.1f} MB)"
            print(f"    {label:30s} {exists}{size_str}")
        # Subs
        ass_path = os.path.join(SUBS_DIR, f"{s['id']}-{s['slug']}.ass")
        exists = "OK" if os.path.exists(ass_path) else "missing"
        print(f"    {'6. ASS subtitles':30s} {exists}")
        words_path = os.path.join(SUBS_DIR, f"{s['id']}-{s['slug']}-words.json")
        exists = "OK" if os.path.exists(words_path) else "missing"
        print(f"    {'   Whisper JSON':30s} {exists}")
        print()


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

PHASES = {
    "extract":    extract,
    "crop":       crop,
    "overlay":    overlay,
    "transcribe": transcribe,
    "subtitles":  subtitles,
    "burn":       burn,
    "thumbnails": thumbnails,
    "status":     status,
}

def run_all():
    for phase in ["extract", "crop", "overlay", "transcribe", "subtitles", "burn", "thumbnails"]:
        PHASES[phase]()
    print("\n=== ALL PHASES COMPLETE ===")
    status()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(0)

    cmd = sys.argv[1].lower()
    if cmd == "all":
        run_all()
    elif cmd in PHASES:
        PHASES[cmd]()
    else:
        print(f"Unknown command: {cmd}")
        print(f"Available: {', '.join(list(PHASES.keys()) + ['all'])}")
        sys.exit(1)
