#!/usr/bin/env python3
"""
Generate captions by running Whisper on the FINAL VIDEO's audio.
This guarantees perfect sync — no theoretical timestamp accumulation.
"""
import os, subprocess, json
import whisper

PROJECT_DIR  = os.path.dirname(os.path.abspath(__file__))
AUDIO_WAV    = os.path.join(PROJECT_DIR, "output", "draft-v6-audio.wav")
WORDS_CACHE  = os.path.join(PROJECT_DIR, "output", "whisper-v2-words.json")
ASS_FILE     = os.path.join(PROJECT_DIR, "output", "captions-v2.ass")
INPUT_VIDEO  = os.path.join(PROJECT_DIR, "output", "draft-v6.mp4")
OUTPUT_VIDEO = os.path.join(PROJECT_DIR, "output", "draft-v6-captioned.mp4")

WORDS_PER_GROUP = 4
FONT_NAME  = "Impact"
FONT_SIZE  = 72
PRIMARY    = "&H00FFFFFF"
OUTLINE    = "&H00000000"
SHADOW     = "&H80000000"
OUTLINE_W  = 3
SHADOW_D   = 2
MARGIN_V   = 100

# Scene 29 timestamp range for repositioned captions (top-center)
# We'll detect silence gaps to find this dynamically, or use a fallback
S29_APPROX_START = 570   # approximate — will use word content to detect
S29_APPROX_END   = 630


def ts(seconds):
    h  = int(seconds // 3600)
    m  = int((seconds % 3600) // 60)
    s  = seconds % 60
    cs = round((s % 1) * 100)
    s  = int(s)
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"


def group_words(words, n=WORDS_PER_GROUP):
    for i in range(0, len(words), n):
        chunk = words[i:i+n]
        start = chunk[0]["start"]
        end   = chunk[-1]["end"]
        text  = " ".join(w["word"].strip() for w in chunk)
        yield start, end, text


# ── 1. Whisper on full audio ──────────────────────────────────────────────────

if os.path.exists(WORDS_CACHE):
    print(f"Loading cached words from {WORDS_CACHE}")
    with open(WORDS_CACHE) as f:
        all_words = json.load(f)
else:
    print("Loading Whisper model (small.en) for full-video alignment...")
    model = whisper.load_model("small.en")

    print(f"Transcribing {AUDIO_WAV} ...")
    result = model.transcribe(
        AUDIO_WAV,
        word_timestamps=True,
        language="en",
        fp16=False,
        verbose=False,
    )

    all_words = []
    for seg in result["segments"]:
        for w in seg.get("words", []):
            all_words.append({
                "word":  w["word"],
                "start": w["start"],
                "end":   w["end"],
            })

    with open(WORDS_CACHE, "w") as f:
        json.dump(all_words, f, indent=2)
    print(f"  {len(all_words)} words saved to {WORDS_CACHE}")


# ── 2. Detect scene 29 range from word timestamps ────────────────────────────
# Scene 29 narration is about the "community ripple" / multiplier effect
# Find the approximate window by looking for key phrases

s29_start = None
s29_end   = None
for i, w in enumerate(all_words):
    text_window = " ".join(x["word"] for x in all_words[i:i+10]).lower()
    if "multiplier" in text_window or "ripple" in text_window or "community" in text_window:
        if s29_start is None:
            s29_start = all_words[i]["start"] - 2
    if s29_start and w["start"] > s29_start + 70:
        s29_end = w["start"]
        break

if not s29_start:
    s29_start = S29_APPROX_START
    s29_end   = S29_APPROX_END

print(f"Scene 29 detected: {s29_start:.1f}s – {s29_end:.1f}s (captions → top-center)")


# ── 3. Build ASS file ─────────────────────────────────────────────────────────

ASS_HEADER = f"""\
[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Caption,{FONT_NAME},{FONT_SIZE},{PRIMARY},&H000000FF,{OUTLINE},{SHADOW},-1,0,0,0,100,100,2,0,1,{OUTLINE_W},{SHADOW_D},2,40,40,{MARGIN_V},1
Style: CaptionTop,{FONT_NAME},{FONT_SIZE},{PRIMARY},&H000000FF,{OUTLINE},{SHADOW},-1,0,0,0,100,100,2,0,1,{OUTLINE_W},{SHADOW_D},8,40,40,120,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

events = []

for start, end, text in group_words(all_words, WORDS_PER_GROUP):
    # Ensure min display time
    if end - start < 0.4:
        end = start + 0.4

    text_esc = text.replace("{", "\\{").replace("}", "\\}").upper()

    # Scene 29: use top-center style
    if s29_start <= start <= s29_end:
        style = "CaptionTop"
    else:
        style = "Caption"

    events.append(
        f"Dialogue: 0,{ts(start)},{ts(end)},{style},,0,0,0,,{text_esc}"
    )

with open(ASS_FILE, "w") as f:
    f.write(ASS_HEADER)
    f.write("\n".join(events))
    f.write("\n")

print(f"Wrote {len(events)} caption events → {ASS_FILE}")


# ── 4. Burn onto video ────────────────────────────────────────────────────────

print(f"\nBurning captions → {OUTPUT_VIDEO}")

r = subprocess.run([
    "ffmpeg", "-y",
    "-i", INPUT_VIDEO,
    "-vf", f"ass={ASS_FILE}",
    "-c:v", "libx264", "-preset", "fast", "-crf", "20",
    "-bf", "0", "-g", "24", "-keyint_min", "24",
    "-pix_fmt", "yuv420p",
    "-c:a", "copy",
    OUTPUT_VIDEO
], capture_output=True, text=True)

if r.returncode == 0:
    size = os.path.getsize(OUTPUT_VIDEO)
    probe = subprocess.run(
        ["ffprobe","-v","quiet","-show_entries","format=duration","-of","csv=p=0", OUTPUT_VIDEO],
        capture_output=True, text=True)
    dur = float(probe.stdout.strip()) if probe.stdout.strip() else 0
    mins, secs = int(dur//60), int(dur%60)
    print(f"\nDONE  {OUTPUT_VIDEO}")
    print(f"  Duration : {mins}:{secs:02d}")
    print(f"  Size     : {size/1024/1024:.1f} MB")
    print(f"  Words    : {len(all_words)}")
    print(f"  Events   : {len(events)}")
else:
    print("FFmpeg FAILED:")
    print(r.stderr[-600:])
