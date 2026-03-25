#!/usr/bin/env python3
"""
Seven Presidents Park -- Trailer Short Assembly
Builds a single 50-second trailer-style short natively for 9:16 vertical.

Usage:
  python assemble-trailer.py tts         -- generate narration via Kokoro TTS
  python assemble-trailer.py scenes      -- build individual scene clips
  python assemble-trailer.py concat      -- concatenate scenes + mux audio
  python assemble-trailer.py overlay     -- add hook text + CTA overlays
  python assemble-trailer.py transcribe  -- Whisper transcription
  python assemble-trailer.py subtitles   -- generate ASS subtitle file
  python assemble-trailer.py burn        -- burn subtitles into final video
  python assemble-trailer.py all         -- run all phases
"""

import subprocess
import sys
import os
import json
import requests
import struct
import wave

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
IMAGES = os.path.join(PROJECT_DIR, "images")
TRAILER_DIR = os.path.join(SCRIPT_DIR, "trailer")
SUBS_DIR = os.path.join(TRAILER_DIR, "subs")
FONT = "/System/Library/Fonts/Supplemental/Arial Black.ttf"

os.makedirs(TRAILER_DIR, exist_ok=True)
os.makedirs(SUBS_DIR, exist_ok=True)

FPS = 30
W, H = 1080, 1920  # 9:16 vertical

# ---------------------------------------------------------------------------
# Narration text (trailer cut)
# ---------------------------------------------------------------------------

NARRATION_TEXT = (
    "This beach is named after seven presidents. "
    "The real number? Maybe four. "
    "Ulysses Grant came first. He held cabinet meetings on the porch "
    "and played poker with America's wealthiest men every Friday night. "
    "Then Garfield was shot. The bullet missed every vital organ. "
    "It was the infections that killed him. "
    "Volunteers laid thirty-two hundred feet of track overnight, by torchlight, "
    "to bring a dying president to the sea. "
    "Today, a small tea house still stands on the church grounds, "
    "built from those very railroad ties. The original red paint has faded to pink after a hundred and forty years of shore weather. "
    "Woodrow Wilson ran his entire campaign from a fifty-two room beach house. "
    "His slogan: He Kept Us Out of War. "
    "Five months later, he asked Congress to declare war on Germany. "
    "Three of the seven? Almost certainly fiction. "
    "But the stories they left behind are real."
)

# ---------------------------------------------------------------------------
# Scene definitions (natively vertical)
# ---------------------------------------------------------------------------

SCENES = [
    # 0-6s: Hook
    {"id": "01", "image": "nick-park-opening.jpg",              "duration": 6,  "motion": "gentle-zoom",  "orientation": "landscape"},
    # 6-9s: Grant
    {"id": "02", "image": "grant-portrait-brady.jpg",           "duration": 3,  "motion": "gentle-zoom",  "orientation": "portrait"},
    # 9-12s: Grant poker on the porch (AI)
    {"id": "03", "image": "ai-scene-3b2.png",                   "duration": 3,  "motion": "ken-burns-pan", "orientation": "landscape"},
    # 12-15s: Garfield
    {"id": "04", "image": "garfield-portrait.jpg",              "duration": 3,  "motion": "gentle-zoom",  "orientation": "portrait"},
    # 15-19s: Assassination
    {"id": "05", "image": "garfield-assassination-engraving.jpg","duration": 4,  "motion": "ken-burns-zoom","orientation": "landscape"},
    # 19-24s: Railroad by torchlight
    {"id": "06", "image": "railroad-track-laying-leslies.jpg",  "duration": 5,  "motion": "ken-burns-pan", "orientation": "landscape"},
    # 24-30s: Tea house exterior (pink paint)
    {"id": "07", "image": "nick-teahouse-exterior.jpg",         "duration": 6,  "motion": "gentle-zoom",  "orientation": "landscape"},
    # 30-35s: Tea house detail (ivy side)
    {"id": "07b","image": "nick-teahouse-detail.jpg",           "duration": 5,  "motion": "ken-burns-pan", "orientation": "landscape"},
    # 35-41s: Tea house interior (railroad tie walls)
    {"id": "08", "image": "nick-teahouse-interior.jpg",         "duration": 6,  "motion": "ken-burns-zoom","orientation": "portrait"},
    # 41-44s: Wilson
    {"id": "09", "image": "wilson-portrait.jpg",                "duration": 3,  "motion": "gentle-zoom",  "orientation": "portrait"},
    # 44-49s: Shadow Lawn
    {"id": "10", "image": "wilson-notification-shadow-lawn.jpg","duration": 5,  "motion": "ken-burns-pan", "orientation": "landscape"},
    # 49-52s: Disputed
    {"id": "11", "image": "hayes-portrait-brady.jpg",           "duration": 3,  "motion": "gentle-zoom",  "orientation": "portrait"},
    # 52-56s: CTA
    {"id": "12", "image": "nick-park-beach.jpg",                "duration": 4,  "motion": "gentle-zoom",  "orientation": "landscape"},
]

TOTAL_DURATION = sum(s["duration"] for s in SCENES)


def run(cmd, description=""):
    print(f"\n--- {description or 'Running'} ---")
    print(" ".join(cmd))
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"STDERR: {result.stderr[-2000:]}")
        print(f"ERROR: command failed with code {result.returncode}")
        sys.exit(1)


def image_is_portrait(img_file):
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
# Phase 1: TTS narration
# ---------------------------------------------------------------------------

def tts():
    print("\n=== PHASE 1: Generating TTS narration ===")
    out = os.path.join(TRAILER_DIR, "narration.wav")
    if os.path.exists(out):
        print(f"  SKIP: {out} already exists")
        return

    # Use OpenAI TTS-1-HD with "onyx" voice to match the full documentary
    openai_url = "https://api.openai.com/v1/audio/speech"
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("  ERROR: OPENAI_API_KEY not set")
        sys.exit(1)

    print(f"  Sending to OpenAI TTS-1-HD (voice: onyx)...")
    try:
        response = requests.post(
            openai_url,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "tts-1-hd",
                "voice": "onyx",
                "input": NARRATION_TEXT,
                "response_format": "wav",
                "speed": 1.0,
            },
            timeout=120,
        )
        response.raise_for_status()
        with open(out, "wb") as f:
            f.write(response.content)
        print(f"  Saved: {out} ({len(response.content) / 1024:.0f} KB)")
    except requests.exceptions.ConnectionError:
        print("  ERROR: Cannot connect to OpenAI API")
        sys.exit(1)
    except Exception as e:
        print(f"  ERROR: {e}")
        sys.exit(1)


# ---------------------------------------------------------------------------
# Phase 2: Build individual scene clips (vertical native)
# ---------------------------------------------------------------------------

def build_vertical_filter(motion, orientation, duration, img_file):
    """Build FFmpeg filter for 9:16 vertical output.

    All images are pre-cropped to 9:16 aspect ratio before zoompan
    to prevent stretching. The approach:
    1. Scale height to 7680 (keeping aspect ratio)
    2. Center-crop width to 4320 (= 7680 * 9/16) → exact 9:16
    3. Apply zoompan with output 1080x1920
    """
    d_frames = int(FPS * duration)

    # Universal pre-crop to 9:16 at high resolution for zoom headroom
    precrop = "scale=-1:7680,crop=4320:7680:(iw-4320)/2:0"

    if motion == "gentle-zoom":
        return (
            f"{precrop},"
            f"zoompan=z='min(zoom+0.0001,1.03)'"
            f":x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"
            f":d={d_frames}:s={W}x{H}:fps={FPS}"
        )
    elif motion == "ken-burns-zoom":
        return (
            f"{precrop},"
            f"zoompan=z='min(zoom+0.0005,1.15)'"
            f":x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"
            f":d={d_frames}:s={W}x{H}:fps={FPS}"
        )
    elif motion == "ken-burns-pan":
        return (
            f"{precrop},"
            f"zoompan=z='1.1'"
            f":x='if(eq(on,1),0,x+2)'"
            f":y='ih/2-(ih/zoom/2)'"
            f":d={d_frames}:s={W}x{H}:fps={FPS}"
        )
    else:
        return f"{precrop},scale={W}:{H}"


def scenes():
    print(f"\n=== PHASE 2: Building {len(SCENES)} scene clips (vertical native) ===")
    for s in SCENES:
        out = os.path.join(TRAILER_DIR, f"scene-{s['id']}.mp4")
        if os.path.exists(out):
            print(f"  SKIP: {out} already exists")
            continue

        img = os.path.join(IMAGES, s["image"])
        if not os.path.exists(img):
            print(f"  WARNING: {img} not found, using black frame")
            run(["ffmpeg", "-y", "-f", "lavfi",
                 "-i", f"color=c=black:s={W}x{H}:d={s['duration']}:r={FPS}",
                 "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", str(FPS),
                 out], f"Black placeholder {s['id']}")
            continue

        vf = build_vertical_filter(s["motion"], s["orientation"], s["duration"], img)
        run([
            "ffmpeg", "-y",
            "-loop", "1", "-i", img,
            "-vf", vf,
            "-t", str(s["duration"]),
            "-c:v", "libx264", "-crf", "18", "-preset", "medium",
            "-pix_fmt", "yuv420p", "-r", str(FPS),
            out,
        ], f"Scene {s['id']} ({s['image']}, {s['duration']}s)")
    print("\nScenes complete.")


# ---------------------------------------------------------------------------
# Phase 3: Concatenate + mux audio
# ---------------------------------------------------------------------------

def concat():
    print("\n=== PHASE 3: Concatenate scenes + mux audio ===")
    raw_video = os.path.join(TRAILER_DIR, "trailer-video.mp4")
    narration = os.path.join(TRAILER_DIR, "narration.wav")
    out = os.path.join(TRAILER_DIR, "trailer-raw.mp4")

    if os.path.exists(out):
        print(f"  SKIP: {out} already exists")
        return

    # Write concat list
    concat_txt = os.path.join(TRAILER_DIR, "concat.txt")
    with open(concat_txt, "w") as f:
        for s in SCENES:
            path = os.path.join(TRAILER_DIR, f"scene-{s['id']}.mp4")
            f.write(f"file '{path}'\n")

    # Concatenate video
    if not os.path.exists(raw_video):
        run([
            "ffmpeg", "-y",
            "-f", "concat", "-safe", "0",
            "-i", concat_txt,
            "-c", "copy",
            raw_video,
        ], "Concatenate scenes")

    # Mux with narration audio
    if not os.path.exists(narration):
        print(f"  ERROR: narration not found: {narration}")
        print("  Run 'tts' phase first.")
        sys.exit(1)

    run([
        "ffmpeg", "-y",
        "-i", raw_video,
        "-i", narration,
        "-c:v", "copy",
        "-c:a", "aac", "-b:a", "192k",
        "-shortest",
        out,
    ], "Mux video + narration")
    print("\nConcat complete.")


# ---------------------------------------------------------------------------
# Phase 4: Text overlays (hook + Wilson slogan + CTA)
# ---------------------------------------------------------------------------

def overlay():
    print("\n=== PHASE 4: Adding text overlays ===")
    inp = os.path.join(TRAILER_DIR, "trailer-raw.mp4")
    out = os.path.join(TRAILER_DIR, "trailer-overlay.mp4")

    if not os.path.exists(inp):
        print(f"  ERROR: {inp} not found. Run 'concat' first.")
        sys.exit(1)
    if os.path.exists(out):
        print(f"  SKIP: {out} already exists")
        return

    def esc(text):
        return text.replace("'", "\\'").replace(":", "\\:").replace(",", "\\,")

    dur = TOTAL_DURATION
    hook1 = esc("This beach is named after 7 presidents.")
    hook2 = esc("The real number? Maybe 4.")
    wilson1 = esc("He Kept Us Out of War")
    wilson2 = esc("5 months later... he declared war.")
    cta = esc("Full documentary. Link in description.")

    vf = (
        # Hook line 1 (0-4s)
        f"drawtext=text='{hook1}'"
        f":fontfile='{FONT}':fontsize=36"
        f":fontcolor=white:borderw=4:bordercolor=black"
        f":x=(w-text_w)/2:y=250"
        f":enable='lte(t\\,4)',"

        # Hook line 2 (4-7s, yellow)
        f"drawtext=text='{hook2}'"
        f":fontfile='{FONT}':fontsize=36"
        f":fontcolor=yellow:borderw=4:bordercolor=black"
        f":x=(w-text_w)/2:y=320"
        f":enable='between(t\\,3.5\\,7)',"

        # Wilson slogan (44-48s — during Shadow Lawn)
        f"drawtext=text='{wilson1}'"
        f":fontfile='{FONT}':fontsize=36"
        f":fontcolor=yellow:borderw=4:bordercolor=black"
        f":x=(w-text_w)/2:y=h/2-50"
        f":enable='between(t\\,44\\,48)',"

        # Wilson war (48-49s)
        f"drawtext=text='{wilson2}'"
        f":fontfile='{FONT}':fontsize=36"
        f":fontcolor=white:borderw=4:bordercolor=black"
        f":x=(w-text_w)/2:y=h/2+20"
        f":enable='between(t\\,48\\,49)',"

        # CTA (last 4s)
        f"drawtext=text='{cta}'"
        f":fontfile='{FONT}':fontsize=32"
        f":fontcolor=white:borderw=3:bordercolor=black"
        f":x=(w-text_w)/2:y=h-120"
        f":enable='gte(t\\,{dur - 4})'"
    )

    run([
        "ffmpeg", "-y", "-i", inp,
        "-vf", vf,
        "-c:a", "copy", out,
    ], "Add text overlays")
    print("\nOverlay complete.")


# ---------------------------------------------------------------------------
# Phase 5: Whisper transcription
# ---------------------------------------------------------------------------

def transcribe():
    print("\n=== PHASE 5: Whisper transcription ===")
    inp = os.path.join(TRAILER_DIR, "trailer-overlay.mp4")
    wav = os.path.join(TRAILER_DIR, "trailer-audio.wav")
    json_out = os.path.join(SUBS_DIR, "trailer-words.json")

    if os.path.exists(json_out):
        print(f"  SKIP: {json_out} already exists")
        return

    # Extract audio
    run([
        "ffmpeg", "-y", "-i", inp,
        "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1",
        wav,
    ], "Extract audio")

    # Transcribe
    whisper_url = "http://localhost:2022/v1/audio/transcriptions"
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
    except Exception as e:
        print(f"  ERROR: {e}")
        sys.exit(1)


# ---------------------------------------------------------------------------
# Phase 6: ASS subtitles (reuse logic from assemble-shorts.py)
# ---------------------------------------------------------------------------

HIGHLIGHT_WORDS = {
    "seven", "7", "four", "4", "five", "three", "3",
    "garfield", "grant", "wilson", "mckinley", "hayes", "arthur", "harrison",
    "shot", "killed", "died", "death", "infections", "war", "declared",
    "overnight", "torchlight", "railroad", "track",
    "shadow", "lawn", "elberon", "poker", "fiction",
    "3,200", "3200", "thirty-two", "fifty-two",
}


def should_highlight(word):
    return word.lower().strip(".,!?;:'\"").replace(",", "") in HIGHLIGHT_WORDS


def seconds_to_ass_time(t):
    h = int(t // 3600)
    m = int((t % 3600) // 60)
    s = int(t % 60)
    cs = int(round((t - int(t)) * 100))
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"


def group_into_phrases(words, max_words=4, max_duration=2.2):
    phrases = []
    current_words = []
    current_start = None
    for w in words:
        wstart = w.get("start", 0)
        wend = w.get("end", wstart + 0.3)
        wtext = w.get("word", w.get("text", "")).strip()
        if not wtext:
            continue
        if current_start is None:
            current_start = wstart
        current_words.append((wtext, wend))
        if len(current_words) >= max_words or (wend - current_start) >= max_duration:
            phrases.append((current_start, current_words[-1][1],
                            " ".join(t for t, _ in current_words)))
            current_words = []
            current_start = None
    if current_words:
        phrases.append((current_start, current_words[-1][1],
                        " ".join(t for t, _ in current_words)))
    return phrases


ASS_HEADER = """\
[Script Info]
Title: Seven Presidents Trailer Subtitles
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
    print("\n=== PHASE 6: Generating ASS subtitles ===")
    json_in = os.path.join(SUBS_DIR, "trailer-words.json")
    ass_out = os.path.join(SUBS_DIR, "trailer.ass")

    if os.path.exists(ass_out):
        print(f"  SKIP: {ass_out} already exists")
        return
    if not os.path.exists(json_in):
        print(f"  ERROR: {json_in} not found. Run 'transcribe' first.")
        sys.exit(1)

    with open(json_in) as f:
        data = json.load(f)

    words = data.get("words", [])
    if not words:
        segments = data.get("segments", [])
        words = []
        for seg in segments:
            seg_text = seg.get("text", "").strip().split()
            seg_start = seg.get("start", 0)
            seg_end = seg.get("end", seg_start + len(seg_text) * 0.35)
            if not seg_text:
                continue
            step = (seg_end - seg_start) / len(seg_text)
            for i, w in enumerate(seg_text):
                words.append({
                    "word": w,
                    "start": seg_start + i * step,
                    "end": seg_start + (i + 1) * step,
                })

    phrases = group_into_phrases(words)
    lines = []
    for start, end, text in phrases:
        parts = text.split()
        highlighted = []
        for p in parts:
            if should_highlight(p):
                highlighted.append(r"{\c&H00FFFF&}" + p + r"{\c&HFFFFFF&}")
            else:
                highlighted.append(p)
        display = " ".join(highlighted)
        lines.append(
            f"Dialogue: 0,{seconds_to_ass_time(start)},{seconds_to_ass_time(end)},Pop,,0,0,0,,{display}"
        )

    with open(ass_out, "w") as f:
        f.write(ASS_HEADER)
        f.write("\n".join(lines))
        f.write("\n")
    print(f"  Wrote {len(lines)} phrases: {ass_out}")


# ---------------------------------------------------------------------------
# Phase 7: Burn subtitles
# ---------------------------------------------------------------------------

def burn():
    print("\n=== PHASE 7: Burning subtitles ===")
    inp = os.path.join(TRAILER_DIR, "trailer-overlay.mp4")
    ass_in = os.path.join(SUBS_DIR, "trailer.ass")
    out = os.path.join(SCRIPT_DIR, "trailer-seven-presidents.mp4")

    if os.path.exists(out):
        print(f"  SKIP: {out} already exists")
        return

    ass_escaped = ass_in.replace(":", "\\:")
    run([
        "ffmpeg", "-y", "-i", inp,
        "-vf", f"ass={ass_escaped}",
        "-c:v", "libx264", "-preset", "slow", "-crf", "18",
        "-c:a", "copy",
        out,
    ], "Burn subtitles")

    size_mb = os.path.getsize(out) / 1_000_000
    print(f"\n  Final trailer: {out} ({size_mb:.1f} MB)")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

PHASES = {
    "tts": tts,
    "scenes": scenes,
    "concat": concat,
    "overlay": overlay,
    "transcribe": transcribe,
    "subtitles": subtitles,
    "burn": burn,
}


def run_all():
    for phase in ["tts", "scenes", "concat", "overlay", "transcribe", "subtitles", "burn"]:
        PHASES[phase]()
    print("\n=== TRAILER BUILD COMPLETE ===")


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
        print(f"Unknown: {cmd}. Available: {', '.join(list(PHASES.keys()) + ['all'])}")
        sys.exit(1)
