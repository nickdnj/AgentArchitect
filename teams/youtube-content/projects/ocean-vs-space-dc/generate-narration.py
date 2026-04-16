#!/usr/bin/env python3
"""Generate all narration clips via ElevenLabs API, then splice into a single podcast file."""
import json
import os
import subprocess
import sys
import time
import urllib.request

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
STORYBOARD = os.path.join(PROJECT_DIR, "storyboard-app", "storyboard-data.json")
AUDIO_DIR = os.path.join(PROJECT_DIR, "audio")
OUTPUT_FILE = os.path.join(PROJECT_DIR, "output", "narration-full.mp3")

# ElevenLabs config
API_KEY = os.environ.get("XI_API_KEY", "")
VOICE_ID = "TxGEqnHWrfWFTfGW9XjX"  # Josh — warm, authoritative, documentary
VOICE_NAME = "Josh"
MODEL_ID = "eleven_multilingual_v2"  # Highest quality model
API_URL = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"

# Voice settings tuned for documentary narration
VOICE_SETTINGS = {
    "stability": 0.65,         # Slightly more expressive than default
    "similarity_boost": 0.78,  # Stay close to voice character
    "style": 0.35,             # Moderate style for documentary feel
    "use_speaker_boost": True
}

# Silence durations (seconds) for pacing
PAUSE_BETWEEN_SCENES = 1.5      # Normal scene transition
PAUSE_BETWEEN_CHAPTERS = 3.0    # Chapter break
PAUSE_AFTER_DRAMATIC = 2.0      # After a dramatic beat


def generate_clip(text, output_path, scene_id):
    """Generate a single TTS clip via ElevenLabs API."""
    if os.path.exists(output_path):
        size = os.path.getsize(output_path)
        if size > 1000:  # Skip if already generated (>1KB = real audio)
            print(f"  [skip] Scene {scene_id} already exists ({size:,} bytes)")
            return True

    payload = json.dumps({
        "text": text,
        "model_id": MODEL_ID,
        "voice_settings": VOICE_SETTINGS
    }).encode("utf-8")

    req = urllib.request.Request(API_URL, data=payload, method="POST")
    req.add_header("xi-api-key", API_KEY)
    req.add_header("Content-Type", "application/json")
    req.add_header("Accept", "audio/mpeg")

    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            audio_data = resp.read()
            with open(output_path, "wb") as f:
                f.write(audio_data)
            print(f"  [done] Scene {scene_id}: {len(audio_data):,} bytes")
            return True
    except Exception as e:
        print(f"  [FAIL] Scene {scene_id}: {e}")
        return False


def generate_silence(duration_s, output_path):
    """Generate a silence clip using FFmpeg."""
    subprocess.run([
        "ffmpeg", "-y", "-f", "lavfi", "-i",
        f"anullsrc=r=44100:cl=mono",
        "-t", str(duration_s),
        "-c:a", "libmp3lame", "-b:a", "192k",
        output_path
    ], capture_output=True)


def main():
    if not API_KEY:
        print("ERROR: XI_API_KEY not set. Run: source ~/.zshrc")
        sys.exit(1)

    # Load storyboard
    with open(STORYBOARD) as f:
        data = json.load(f)

    scenes = data["scenes"]
    narration_scenes = [s for s in scenes if s.get("narration", "").strip()]
    print(f"Project: {data['project']}")
    print(f"Total scenes: {len(scenes)}, with narration: {len(narration_scenes)}")
    print(f"Voice: {VOICE_NAME} ({VOICE_ID})")
    print(f"Model: {MODEL_ID}")
    print()

    # Create directories
    os.makedirs(AUDIO_DIR, exist_ok=True)
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

    # Generate silence files
    silence_scene = os.path.join(AUDIO_DIR, "silence-scene.mp3")
    silence_chapter = os.path.join(AUDIO_DIR, "silence-chapter.mp3")
    silence_dramatic = os.path.join(AUDIO_DIR, "silence-dramatic.mp3")
    if not os.path.exists(silence_scene):
        print("Generating silence clips...")
        generate_silence(PAUSE_BETWEEN_SCENES, silence_scene)
        generate_silence(PAUSE_BETWEEN_CHAPTERS, silence_chapter)
        generate_silence(PAUSE_AFTER_DRAMATIC, silence_dramatic)

    # Generate narration clips
    print("=" * 60)
    print("GENERATING NARRATION CLIPS")
    print("=" * 60)

    failed = []
    current_chapter = None

    for s in scenes:
        narration = s.get("narration", "").strip()
        if not narration:
            continue

        scene_id = s["id"]
        chapter = s["chapter"]

        if chapter != current_chapter:
            current_chapter = chapter
            print(f"\nChapter {chapter}: {s['chapter_title']}")

        clip_path = os.path.join(AUDIO_DIR, f"scene-{scene_id:02d}.mp3")
        ok = generate_clip(narration, clip_path, scene_id)
        if not ok:
            failed.append(scene_id)

        # Rate limit: ElevenLabs free tier allows ~3 concurrent
        time.sleep(0.5)

    if failed:
        print(f"\n{'=' * 60}")
        print(f"FAILED SCENES: {failed}")
        print(f"Re-run the script to retry failed scenes.")
        print(f"{'=' * 60}")

    # Build concat list for FFmpeg
    print(f"\n{'=' * 60}")
    print("SPLICING INTO SINGLE FILE")
    print("=" * 60)

    concat_list = os.path.join(AUDIO_DIR, "concat.txt")
    current_chapter = None

    with open(concat_list, "w") as f:
        for s in scenes:
            narration = s.get("narration", "").strip()
            if not narration:
                continue

            scene_id = s["id"]
            chapter = s["chapter"]
            clip_path = os.path.join(AUDIO_DIR, f"scene-{scene_id:02d}.mp3")

            if not os.path.exists(clip_path):
                continue

            # Add chapter pause or scene pause before this clip
            if current_chapter is not None:
                if chapter != current_chapter:
                    f.write(f"file '{silence_chapter}'\n")
                else:
                    # Check if previous scene was dramatic (hard cut)
                    f.write(f"file '{silence_scene}'\n")

            current_chapter = chapter
            f.write(f"file '{clip_path}'\n")

    # Concat with FFmpeg
    result = subprocess.run([
        "ffmpeg", "-y", "-f", "concat", "-safe", "0",
        "-i", concat_list,
        "-c:a", "libmp3lame", "-b:a", "192k",
        "-metadata", f"title={data['project']}",
        "-metadata", "artist=Vistter",
        "-metadata", "album=Inner Space vs Outer Space",
        OUTPUT_FILE
    ], capture_output=True, text=True)

    if result.returncode == 0:
        size = os.path.getsize(OUTPUT_FILE)
        # Get duration
        probe = subprocess.run([
            "ffprobe", "-v", "quiet", "-show_entries", "format=duration",
            "-of", "csv=p=0", OUTPUT_FILE
        ], capture_output=True, text=True)
        duration = float(probe.stdout.strip()) if probe.stdout.strip() else 0
        mins = int(duration // 60)
        secs = int(duration % 60)

        print(f"\nDONE!")
        print(f"  Output: {OUTPUT_FILE}")
        print(f"  Size: {size:,} bytes ({size/1024/1024:.1f} MB)")
        print(f"  Duration: {mins}:{secs:02d}")
        print(f"  Clips generated: {len(narration_scenes) - len(failed)}/{len(narration_scenes)}")
    else:
        print(f"\nFFmpeg concat failed:")
        print(result.stderr[-500:] if result.stderr else "No error output")


if __name__ == "__main__":
    main()
