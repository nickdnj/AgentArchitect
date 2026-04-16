#!/usr/bin/env python3
"""
Generate word-level captions for draft-v1.mp4.
Steps:
  1. Whisper-align every scene audio clip → per-scene word timestamps
  2. Compute global video timestamps (accounting for inter-scene pauses)
  3. Write an ASS subtitle file with TikTok-style Impact captions
  4. Burn captions into draft-v1.mp4 → draft-v1-captioned.mp4
"""

import json, os, re, subprocess, sys
import whisper

PROJECT_DIR  = os.path.dirname(os.path.abspath(__file__))
STORYBOARD   = os.path.join(PROJECT_DIR, "storyboard-app", "storyboard-data.json")
AUDIO_DIR    = os.path.join(PROJECT_DIR, "audio")
CLIPS_DIR    = os.path.join(PROJECT_DIR, "output", "clips")
OUTPUT_DIR   = os.path.join(PROJECT_DIR, "output")
WORDS_CACHE  = os.path.join(OUTPUT_DIR, "whisper-words.json")
ASS_FILE     = os.path.join(OUTPUT_DIR, "captions.ass")
INPUT_VIDEO  = os.path.join(OUTPUT_DIR, "draft-v1.mp4")
OUTPUT_VIDEO = os.path.join(OUTPUT_DIR, "draft-v1-captioned.mp4")

PAUSE_SCENE   = 1.5
PAUSE_CHAPTER = 3.0

# Caption style
WORDS_PER_GROUP = 4      # how many words per caption line
FONT_NAME  = "Impact"
FONT_SIZE  = 72
PRIMARY    = "&H00FFFFFF"   # white fill
OUTLINE    = "&H00000000"   # black outline
SHADOW     = "&H80000000"   # semi-transparent shadow
OUTLINE_W  = 3
SHADOW_D   = 2
MARGIN_V   = 100            # px from bottom


def probe_duration(path):
    r = subprocess.run(
        ["ffprobe","-v","quiet","-show_entries","format=duration","-of","csv=p=0", path],
        capture_output=True, text=True)
    return float(r.stdout.strip()) if r.stdout.strip() else 0.0


def parse_storyboard_duration(s):
    m = re.search(r'\((\d+)s\)', s.get("duration",""))
    return float(m.group(1)) if m else 10.0


def ts(seconds):
    """Float seconds → ASS timestamp  H:MM:SS.cc"""
    h  = int(seconds // 3600)
    m  = int((seconds % 3600) // 60)
    s  = seconds % 60
    cs = round((s % 1) * 100)
    s  = int(s)
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"


def group_words(words, n=WORDS_PER_GROUP):
    """Yield groups of n words with (start, end, text)."""
    for i in range(0, len(words), n):
        chunk = words[i:i+n]
        start = chunk[0]["start"]
        end   = chunk[-1]["end"]
        text  = " ".join(w["word"].strip() for w in chunk)
        yield start, end, text


# ── 1. Load storyboard ────────────────────────────────────────────────────────

with open(STORYBOARD) as f:
    data = json.load(f)

scenes = [s for s in data["scenes"] if isinstance(s["id"], int)]

# ── 2. Whisper-align each scene ───────────────────────────────────────────────

if os.path.exists(WORDS_CACHE):
    print(f"Loading cached Whisper results from {WORDS_CACHE}")
    with open(WORDS_CACHE) as f:
        scene_words = json.load(f)   # dict: str(sid) → list of word dicts
else:
    print("Loading Whisper model (base.en) …")
    model = whisper.load_model("base.en")
    scene_words = {}

    for s in scenes:
        sid = s["id"]
        audio_path = os.path.join(AUDIO_DIR, f"scene-{sid:02d}.mp3")
        if not os.path.exists(audio_path):
            print(f"  [skip] Scene {sid} — no audio")
            continue

        print(f"  [whisper] Scene {sid:02d} …", end="", flush=True)
        result = model.transcribe(
            audio_path,
            word_timestamps=True,
            language="en",
            fp16=False,
        )
        words = []
        for seg in result["segments"]:
            for w in seg.get("words", []):
                words.append({
                    "word":  w["word"],
                    "start": w["start"],
                    "end":   w["end"],
                })
        scene_words[str(sid)] = words
        print(f" {len(words)} words")

    with open(WORDS_CACHE, "w") as f:
        json.dump(scene_words, f, indent=2)
    print(f"Saved to {WORDS_CACHE}\n")

# ── 3. Build global timeline ──────────────────────────────────────────────────
# Walk scenes in order; track running video offset accounting for pauses.

# First build scene_offset map: scene_id → video start time (seconds)
scene_offset = {}
current_chapter = None
cursor = 0.0

for s in scenes:
    sid     = s["id"]
    chapter = s["chapter"]
    audio_p = os.path.join(AUDIO_DIR, f"scene-{sid:02d}.mp3")
    has_a   = os.path.exists(audio_p)
    dur     = probe_duration(audio_p) if has_a else parse_storyboard_duration(s)

    if dur < 0.5:
        continue

    img_p = s.get("image_path") or f"assets/images/scene-{sid:02d}.png"
    if not os.path.exists(img_p):
        continue

    # Add pause before this scene
    if current_chapter is not None:
        cursor += PAUSE_CHAPTER if chapter != current_chapter else PAUSE_SCENE

    scene_offset[sid] = cursor
    cursor += dur
    current_chapter = chapter

print("Scene offsets (first 5):")
for sid, off in list(scene_offset.items())[:5]:
    print(f"  Scene {sid}: {off:.2f}s")
print()

# ── 4. Write ASS file ─────────────────────────────────────────────────────────

ASS_HEADER = f"""\
[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Caption,{FONT_NAME},{FONT_SIZE},{PRIMARY},&H000000FF,{OUTLINE},{SHADOW},-1,0,0,0,100,100,2,0,1,{OUTLINE_W},{SHADOW_D},2,40,40,{MARGIN_V},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

events = []

for s in scenes:
    sid = s["id"]
    if sid not in scene_offset:
        continue
    words = scene_words.get(str(sid), [])
    if not words:
        continue

    base = scene_offset[sid]
    for start, end, text in group_words(words, WORDS_PER_GROUP):
        t_start = base + start
        t_end   = base + end
        # Ensure minimum display time
        if t_end - t_start < 0.4:
            t_end = t_start + 0.4
        text_esc = text.replace("{","\\{").replace("}","\\}").upper()
        events.append(
            f"Dialogue: 0,{ts(t_start)},{ts(t_end)},Caption,,0,0,0,,{text_esc}"
        )

with open(ASS_FILE, "w") as f:
    f.write(ASS_HEADER)
    f.write("\n".join(events))
    f.write("\n")

print(f"Wrote {len(events)} caption events → {ASS_FILE}")

# ── 5. Burn captions into video ───────────────────────────────────────────────

print(f"\nBurning captions …  {INPUT_VIDEO} → {OUTPUT_VIDEO}")

result = subprocess.run([
    "ffmpeg", "-y",
    "-i", INPUT_VIDEO,
    "-vf", f"ass={ASS_FILE}",
    "-c:v", "libx264", "-preset", "fast", "-crf", "20",
    "-c:a", "copy",
    OUTPUT_VIDEO
], capture_output=True, text=True)

if result.returncode == 0:
    size = os.path.getsize(OUTPUT_VIDEO)
    dur  = probe_duration(OUTPUT_VIDEO)
    mins, secs = int(dur // 60), int(dur % 60)
    print(f"\nDONE  {OUTPUT_VIDEO}")
    print(f"  Duration : {mins}:{secs:02d}")
    print(f"  File size: {size/1024/1024:.1f} MB")
else:
    print("FFmpeg failed:")
    print(result.stderr[-600:])
