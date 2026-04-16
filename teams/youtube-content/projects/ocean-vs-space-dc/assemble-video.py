#!/usr/bin/env python3
"""Assemble draft video: images + narration audio → scene clips → final MP4."""

import json, os, re, subprocess, sys

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
STORYBOARD   = os.path.join(PROJECT_DIR, "storyboard-app", "storyboard-data.json")
AUDIO_DIR    = os.path.join(PROJECT_DIR, "audio")
IMAGES_DIR   = os.path.join(PROJECT_DIR, "assets", "images")
CLIPS_DIR    = os.path.join(PROJECT_DIR, "output", "clips")
OUTPUT_FILE  = os.path.join(PROJECT_DIR, "output", "draft-v1.mp4")

FPS      = 24
OUT_W    = 1920
OUT_H    = 1080
SCALE_W  = 3840   # 2× output — gives zoompan room to pan/zoom
SCALE_H  = 2160

PAUSE_SCENE   = 1.5   # seconds between scenes
PAUSE_CHAPTER = 3.0   # seconds between chapters


# ── Motion filter expressions ─────────────────────────────────────────────────

def vf(motion: str, frames: int) -> str:
    base = (
        f"scale={SCALE_W}:{SCALE_H}:force_original_aspect_ratio=increase,"
        f"crop={SCALE_W}:{SCALE_H},"
    )
    d = frames
    s = f"{OUT_W}x{OUT_H}"
    f_ = FPS

    if motion == "static":
        zp = f"zoompan=z='1.05':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={d}:s={s}:fps={f_}"
    elif motion == "gentle-zoom":
        zp = f"zoompan=z='min(1.0+0.00025*on,1.2)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={d}:s={s}:fps={f_}"
    elif motion == "ken-burns-pan":
        zp = f"zoompan=z='1.2':x='(iw-iw/zoom)*on/{d}':y='ih/2-(ih/zoom/2)':d={d}:s={s}:fps={f_}"
    elif motion == "ken-burns-zoom":
        zp = f"zoompan=z='min(1.0+0.00035*on,1.35)':x='iw/2-(iw/zoom/2)':y='max(0,ih/2-(ih/zoom/2)-0.12*on)':d={d}:s={s}:fps={f_}"
    else:
        zp = f"zoompan=z='1.0':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={d}:s={s}:fps={f_}"

    return base + zp


# ── Helpers ───────────────────────────────────────────────────────────────────

def probe_duration(path):
    r = subprocess.run(
        ["ffprobe","-v","quiet","-show_entries","format=duration","-of","csv=p=0", path],
        capture_output=True, text=True)
    return float(r.stdout.strip()) if r.stdout.strip() else 0.0


def parse_storyboard_duration(s):
    m = re.search(r'\((\d+)s\)', s.get("duration", ""))
    return float(m.group(1)) if m else 10.0


def make_black_clip(dur, path):
    subprocess.run([
        "ffmpeg","-y",
        "-f","lavfi","-i",f"color=c=black:size={OUT_W}x{OUT_H}:rate={FPS}",
        "-f","lavfi","-i","anullsrc=r=44100:cl=stereo",
        "-t", str(dur),
        "-c:v","libx264","-preset","fast","-crf","23",
        "-c:a","aac","-b:a","128k","-pix_fmt","yuv420p",
        path
    ], capture_output=True)


def make_silence(dur, path):
    subprocess.run([
        "ffmpeg","-y","-f","lavfi","-i","anullsrc=r=44100:cl=stereo",
        "-t", str(dur), "-c:a","aac","-b:a","128k", path
    ], capture_output=True)


def make_scene_clip(image, audio, motion, dur, path):
    frames = int(dur * FPS)
    cmd = [
        "ffmpeg","-y",
        "-loop","1","-i", image,
        "-i", audio,
        "-vf", vf(motion, frames),
        "-t", str(dur),
        "-c:v","libx264","-preset","fast","-crf","23",
        "-c:a","aac","-b:a","192k",
        "-shortest","-pix_fmt","yuv420p",
        path
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(f"    [FAIL]\n{r.stderr[-400:]}")
        return False
    return True


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    with open(STORYBOARD) as f:
        data = json.load(f)

    os.makedirs(CLIPS_DIR, exist_ok=True)
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

    scenes = [s for s in data["scenes"] if isinstance(s["id"], int)]
    print(f"Project: {data['project']}")
    print(f"Scenes: {len(scenes)}  Output: {OUTPUT_FILE}")
    print("=" * 62)

    clip_list = []
    current_chapter = None
    failed = []

    for s in scenes:
        sid       = s["id"]
        img_path  = s.get("image_path") or f"{IMAGES_DIR}/scene-{sid:02d}.png"
        audio_path= os.path.join(AUDIO_DIR, f"scene-{sid:02d}.mp3")
        motion    = s.get("motion", "static")
        chapter   = s.get("chapter")

        # ── skip if no image ──
        if not os.path.exists(img_path):
            print(f"  [skip] Scene {sid:02d} — no image")
            continue

        has_audio = os.path.exists(audio_path)
        dur = probe_duration(audio_path) if has_audio else parse_storyboard_duration(s)

        if dur < 0.5:
            print(f"  [skip] Scene {sid:02d} — zero duration")
            continue

        # ── inter-scene / inter-chapter pause ──
        if current_chapter is not None:
            if chapter != current_chapter:
                pause_path = os.path.join(CLIPS_DIR, f"pause-ch{chapter:02d}.mp4")
                if not os.path.exists(pause_path):
                    make_black_clip(PAUSE_CHAPTER, pause_path)
                clip_list.append(pause_path)
            else:
                pause_path = os.path.join(CLIPS_DIR, f"pause-sc{sid:02d}.mp4")
                if not os.path.exists(pause_path):
                    make_black_clip(PAUSE_SCENE, pause_path)
                clip_list.append(pause_path)
        current_chapter = chapter

        # ── scene clip ──
        clip_path = os.path.join(CLIPS_DIR, f"clip-{sid:02d}.mp4")

        if os.path.exists(clip_path):
            print(f"  [skip] Scene {sid:02d} — exists")
        else:
            if not has_audio:
                sil = os.path.join(CLIPS_DIR, f"sil-{sid:02d}.aac")
                make_silence(dur, sil)
                use_audio = sil
            else:
                use_audio = audio_path

            print(f"  [gen]  Scene {sid:02d}  {motion:<18s} {dur:.1f}s", end="", flush=True)
            ok = make_scene_clip(img_path, use_audio, motion, dur, clip_path)
            if ok:
                sz = os.path.getsize(clip_path) / 1024 / 1024
                print(f"  → {sz:.1f} MB")
            else:
                failed.append(sid)
                continue

        clip_list.append(clip_path)

    # ── concatenate ───────────────────────────────────────────────────────────
    print()
    print("=" * 62)
    print(f"JOINING {len(clip_list)} clips …")

    concat_txt = os.path.join(CLIPS_DIR, "concat.txt")
    with open(concat_txt, "w") as f:
        for cp in clip_list:
            f.write(f"file '{cp}'\n")

    r = subprocess.run([
        "ffmpeg","-y","-f","concat","-safe","0",
        "-i", concat_txt,
        "-c","copy",
        OUTPUT_FILE
    ], capture_output=True, text=True)

    if r.returncode == 0:
        size = os.path.getsize(OUTPUT_FILE)
        dur  = probe_duration(OUTPUT_FILE)
        mins, secs = int(dur // 60), int(dur % 60)
        print(f"\nDONE  {OUTPUT_FILE}")
        print(f"  Duration : {mins}:{secs:02d}")
        print(f"  File size: {size/1024/1024:.1f} MB")
        print(f"  Scenes   : {len(clip_list) - clip_list.count(None)} clips ({len(failed)} failed)")
        if failed:
            print(f"  Failed   : {failed}")
    else:
        print("FFmpeg concat failed:")
        print(r.stderr[-500:])


if __name__ == "__main__":
    main()
