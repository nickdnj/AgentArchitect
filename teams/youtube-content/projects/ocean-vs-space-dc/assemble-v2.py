#!/usr/bin/env python3
"""
Clean single-pass video assembly.
- Every clip encoded with identical params (no mixed encoding)
- Stereo audio from the start
- All special handling (letterbox, drawtext) baked in
- Final concat re-encoded (not copy) for uniform H.264
"""
import json, os, re, subprocess, sys

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
STORYBOARD  = os.path.join(PROJECT_DIR, "storyboard-app", "storyboard-data.json")
AUDIO_DIR   = os.path.join(PROJECT_DIR, "audio")
IMAGES_DIR  = os.path.join(PROJECT_DIR, "assets", "images")
CLIPS_DIR   = os.path.join(PROJECT_DIR, "output", "clips")
OUTPUT      = os.path.join(PROJECT_DIR, "output", "draft-v7.mp4")

FONT   = "/System/Library/Fonts/Supplemental/Impact.ttf"
FPS    = 24
W, H   = 1920, 1080
SW, SH = 3840, 2160   # 2× scale for zoompan room

PAUSE_SCENE   = 0.5
PAUSE_CHAPTER = 1.5

# ── Scenes that need letterbox (no zoom — chart/infographic content) ──────────
LETTERBOX_SCENES = {10, 19, 30, 35}

# ── Scenes with sequential drawtext reveals ───────────────────────────────────
DRAWTEXT_REVEALS = {
    4: {
        "title_lines": [
            ("INNER SPACE vs OUTER SPACE", 0.3, H//2 - 80, 90),
            ("THE DATA CENTER BATTLE", 0.7, H//2 + 20, 50),
            ("NOBODY'S TALKING ABOUT", 1.0, H//2 + 80, 50),
        ]
    },
    6: {
        "items": [
            ("STARCLOUD",          "$200M · $1.1B valuation",       2.0,  180),
            ("ORBITAL (a16z)",     "Apr 2027 · NVIDIA GPUs",       10.0,  340),
            ("THALES",             "10 MW concept · 2036 target",  18.5,  500),
            ("GOOGLE × NVIDIA",   "Exploratory joint tests",       27.0,  660),
        ]
    },
    14: {
        "items": [
            ("HIGHLANDER — Hainan",       "OPERATIONAL · 1,200 servers",   3.0,  180),
            ("AIKIDO — North Sea",        "2026 · NVIDIA partner · PUE 1.08", 22.0, 340),
            ("NAUTILUS — Stockton CA",    "7 MW floating · 86% occupied",  42.0,  500),
            ("HYPERSCALE DATA — Gulf",    "Nov 2024-Feb 2025 · proven",    58.0,  660),
        ]
    },
    32: {
        "items": [
            ("BAKER HUGHES",              "1.2 GW DC work booked",          3.0,  140),
            ("HALLIBURTON / VoltaGrid",   "2.3 GW for Oracle",             14.0,  270),
            ("SLB DIGITAL",               "$1B ARR · +121% YoY",           24.0,  400),
            ("6 GW STRANDED ENERGY",      "In US alone — Armada",          36.0,  530),
            ("SHELL 2050",                "DCs → 5,000 TWh globally",      50.0,  660),
        ]
    },
    35: {
        "title_lines": [
            ("RESEARCH & FACT-CHECKING",                          0.5,  100, 52),
            ("All claims verified against primary sources",       2.0,  200, 32),
            ("Microsoft · ETH Zurich · BOEM · OEUK",             3.5,  320, 36),
            ("Crusoe · Aikido · Nautilus · Hyperscale Data",      4.5,  380, 36),
            ("Narration: ElevenLabs",                             6.5,  500, 30),
            ("Full source list in description",                   8.5,  620, 40),
            ("VISTTER",                                          10.5,  780, 80),
        ]
    },
}


# ── Helpers ───────────────────────────────────────────────────────────────────

def probe_dur(path):
    r = subprocess.run(
        ["ffprobe","-v","quiet","-show_entries","format=duration","-of","csv=p=0", path],
        capture_output=True, text=True)
    return float(r.stdout.strip()) if r.stdout.strip() else 0.0


def parse_sb_dur(s):
    m = re.search(r'\((\d+)s\)', s.get("duration",""))
    return float(m.group(1)) if m else 10.0


def esc(text):
    return text.replace("'", "\\'").replace(",", "\\,").replace(":", "\\:")


def dt_item(name, stat, t_in, y):
    """Drawtext pair: name + stat, fade in at t_in."""
    n = (f"drawtext=fontfile='{FONT}':text='{esc(name)}'"
         f":fontcolor=white:fontsize=52:borderw=3:bordercolor=black"
         f":x=(w-text_w)/2:y={y}"
         f":alpha='if(lt(t\\,{t_in})\\,0\\,min(1\\,(t-{t_in})/0.4))'")
    s = (f"drawtext=fontfile='{FONT}':text='{esc(stat)}'"
         f":fontcolor=#FFDD44:fontsize=36:borderw=2:bordercolor=black"
         f":x=(w-text_w)/2:y={y+58}"
         f":alpha='if(lt(t\\,{t_in+0.3})\\,0\\,min(1\\,(t-{t_in+0.3})/0.4))'")
    return n + "," + s


def dt_title(text, t_in, y, size):
    return (f"drawtext=fontfile='{FONT}':text='{esc(text)}'"
            f":fontcolor=white:fontsize={size}:borderw=4:bordercolor=black"
            f":x=(w-text_w)/2:y={y}"
            f":alpha='if(lt(t\\,{t_in})\\,0\\,min(1\\,(t-{t_in})/0.5))'")


def build_vf(sid, motion, dur):
    frames = int(dur * FPS)
    draws  = DRAWTEXT_REVEALS.get(sid, {})

    # Base video filter
    if sid in LETTERBOX_SCENES:
        # Fit entire image within frame — no cropping
        base = (f"scale={W}:{H}:force_original_aspect_ratio=decrease,"
                f"pad={W}:{H}:(ow-iw)/2:(oh-ih)/2:color=black")
    else:
        # Scale up for zoompan room
        base = (f"scale={SW}:{SH}:force_original_aspect_ratio=increase,"
                f"crop={SW}:{SH}")

        if motion == "static":
            base += (f",zoompan=z='1.05':x='iw/2-(iw/zoom/2)'"
                     f":y='ih/2-(ih/zoom/2)':d={frames}:s={W}x{H}:fps={FPS}")
        elif motion == "gentle-zoom":
            base += (f",zoompan=z='min(1.0+0.00025*on\\,1.2)':x='iw/2-(iw/zoom/2)'"
                     f":y='ih/2-(ih/zoom/2)':d={frames}:s={W}x{H}:fps={FPS}")
        elif motion == "ken-burns-pan":
            base += (f",zoompan=z='1.2':x='(iw-iw/zoom)*on/{frames}'"
                     f":y='ih/2-(ih/zoom/2)':d={frames}:s={W}x{H}:fps={FPS}")
        elif motion == "ken-burns-zoom":
            base += (f",zoompan=z='min(1.0+0.00035*on\\,1.35)':x='iw/2-(iw/zoom/2)'"
                     f":y='max(0\\,ih/2-(ih/zoom/2)-0.12*on)':d={frames}:s={W}x{H}:fps={FPS}")
        else:
            base += (f",zoompan=z='1.05':x='iw/2-(iw/zoom/2)'"
                     f":y='ih/2-(ih/zoom/2)':d={frames}:s={W}x{H}:fps={FPS}")

    # Append drawtext overlays
    overlay_parts = []
    if "title_lines" in draws:
        for text, t_in, y, size in draws["title_lines"]:
            overlay_parts.append(dt_title(text, t_in, y, size))
    if "items" in draws:
        for name, stat, t_in, y in draws["items"]:
            overlay_parts.append(dt_item(name, stat, t_in, y))

    if overlay_parts:
        return base + "," + ",".join(overlay_parts)
    return base


def make_silence(dur, path):
    subprocess.run([
        "ffmpeg","-y","-f","lavfi","-i","anullsrc=r=44100:cl=stereo",
        "-t",str(dur),"-c:a","aac","-b:a","128k", path
    ], capture_output=True)


def make_black_clip(dur, path):
    subprocess.run([
        "ffmpeg","-y",
        "-f","lavfi","-i",f"color=c=black:size={W}x{H}:rate={FPS}",
        "-f","lavfi","-i","anullsrc=r=44100:cl=stereo",
        "-t",str(dur),
        "-c:v","libx264","-preset","fast","-crf","23","-bf","0","-g","24",
        "-c:a","aac","-b:a","128k","-ac","2","-ar","44100",
        "-pix_fmt","yuv420p", path
    ], capture_output=True)


def make_clip(img, audio, sid, motion, dur, out):
    vf = build_vf(sid, motion, dur)
    cmd = [
        "ffmpeg","-y",
        "-loop","1","-i", img,
        "-i", audio,
        "-vf", vf,
        "-t", str(dur),
        "-c:v","libx264","-preset","fast","-crf","23",
        "-bf","0","-g","24","-keyint_min","24",
        "-c:a","aac","-b:a","192k","-ac","2","-ar","44100",
        "-shortest","-pix_fmt","yuv420p",
        out
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(f"\n  [FAIL] {r.stderr[-400:]}")
        return False
    return True


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    with open(STORYBOARD) as f:
        data = json.load(f)

    os.makedirs(CLIPS_DIR, exist_ok=True)
    scenes = [s for s in data["scenes"] if isinstance(s["id"], int)]
    print(f"Project: {data['project']}")
    print(f"Scenes : {len(scenes)}")
    print("=" * 64)

    clip_list      = []
    current_chapter = None
    failed         = []

    for s in scenes:
        sid     = s["id"]
        chapter = s["chapter"]
        motion  = s.get("motion","static")
        img     = s.get("image_path") or f"{IMAGES_DIR}/scene-{sid:02d}.png"

        if not os.path.exists(img):
            print(f"  [skip] Scene {sid:02d} — no image")
            continue

        audio_p = os.path.join(AUDIO_DIR, f"scene-{sid:02d}.mp3")
        has_a   = os.path.exists(audio_p)
        dur     = probe_dur(audio_p) if has_a else parse_sb_dur(s)

        # Scene 4: extend to 4s so title card holds
        if sid == 4:
            dur = max(dur, 4.0)

        if dur < 0.3:
            print(f"  [skip] Scene {sid:02d} — zero duration")
            continue

        # ── pause before this scene ──────────────────────────────────────────
        if current_chapter is not None:
            pause_dur  = PAUSE_CHAPTER if chapter != current_chapter else PAUSE_SCENE
            pause_path = os.path.join(CLIPS_DIR, f"pause-{sid:02d}.mp4")
            make_black_clip(pause_dur, pause_path)
            clip_list.append(pause_path)

        current_chapter = chapter

        # ── scene clip ───────────────────────────────────────────────────────
        clip_path = os.path.join(CLIPS_DIR, f"clip-{sid:02d}.mp4")

        # Prepare audio (pad scene 4 to dur, silence for no-audio scenes)
        if has_a:
            if sid == 4:
                padded = os.path.join(CLIPS_DIR, f"audio-{sid:02d}-padded.aac")
                subprocess.run([
                    "ffmpeg","-y","-i", audio_p,
                    "-af",f"apad=whole_dur={dur}",
                    "-c:a","aac","-b:a","192k","-ac","2","-ar","44100", padded
                ], capture_output=True)
                use_audio = padded
            else:
                use_audio = audio_p
        else:
            sil = os.path.join(CLIPS_DIR, f"sil-{sid:02d}.aac")
            make_silence(dur, sil)
            use_audio = sil

        print(f"  [gen] Scene {sid:02d}  {motion:<18s}  {dur:.1f}s", end="", flush=True)
        ok = make_clip(img, use_audio, sid, motion, dur, clip_path)
        if ok:
            mb = os.path.getsize(clip_path) / 1024 / 1024
            print(f"  {mb:.1f} MB")
            clip_list.append(clip_path)
        else:
            failed.append(sid)

    # ── concat with re-encode (uniform H.264) ────────────────────────────────
    print()
    print("=" * 64)
    print(f"JOINING {len(clip_list)} clips (re-encode for uniform H.264)...")

    concat_txt = os.path.join(CLIPS_DIR, "concat.txt")
    with open(concat_txt, "w") as f:
        for cp in clip_list:
            f.write(f"file '{cp}'\n")

    r = subprocess.run([
        "ffmpeg","-y","-f","concat","-safe","0",
        "-i", concat_txt,
        "-c:v","libx264","-preset","fast","-crf","20",
        "-bf","0","-g","24","-keyint_min","24",
        "-c:a","aac","-b:a","192k","-ac","2","-ar","44100",
        "-pix_fmt","yuv420p",
        OUTPUT
    ], capture_output=True, text=True)

    if r.returncode == 0:
        size = os.path.getsize(OUTPUT)
        dur  = probe_dur(OUTPUT)
        mins, secs = int(dur//60), int(dur%60)
        print(f"\nDONE  {OUTPUT}")
        print(f"  Duration  : {mins}:{secs:02d}")
        print(f"  Size      : {size/1024/1024:.1f} MB")
        print(f"  Failed    : {failed if failed else 'none'}")
    else:
        print("CONCAT FAILED:")
        print(r.stderr[-600:])

if __name__ == "__main__":
    main()
