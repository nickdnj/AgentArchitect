#!/usr/bin/env python3
"""
Regenerate scene-26.wav and scene-29.wav from their .txt files.
Reads text from disk so it stays the single source of truth.
ElevenLabs Josh voice, 48kHz 16-bit mono WAV.
"""
import os, sys, time, subprocess, json, urllib.request
from pathlib import Path

API_KEY = os.environ.get("ELEVENLABS_API_KEY", "")
VOICE_ID = "TxGEqnHWrfWFTfGW9XjX"  # Josh
MODEL_ID = "eleven_multilingual_v2"
SETTINGS = {"stability": 0.5, "similarity_boost": 0.75, "style": 0.4}

NARR = Path(__file__).resolve().parent / "assets" / "audio" / "narration"
TARGETS = [26, 29]


def duration(p):
    r = subprocess.run(
        ["ffprobe", "-v", "quiet", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)],
        capture_output=True, text=True,
    )
    try:
        return float(r.stdout.strip())
    except Exception:
        return None


def gen(scene_id):
    padded = f"{scene_id:02d}"
    txt_p = NARR / f"scene-{padded}.txt"
    wav_p = NARR / f"scene-{padded}.wav"
    mp3_p = NARR / f"scene-{padded}.tmp.mp3"

    text = txt_p.read_text().strip()
    if not text:
        print(f"  scene-{padded}: empty text — abort"); return False
    print(f"  scene-{padded}: {len(text)} chars… ", end="", flush=True)

    payload = json.dumps({"text": text, "model_id": MODEL_ID, "voice_settings": SETTINGS}).encode()
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}",
        data=payload,
        headers={
            "xi-api-key": API_KEY,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        },
        method="POST",
    )
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                mp3_p.write_bytes(resp.read())
            break
        except Exception as e:
            if attempt == 2:
                print(f"FAILED: {e}"); return False
            print(f"retry({attempt+1}) ", end="", flush=True); time.sleep(2)

    r = subprocess.run(
        ["ffmpeg", "-y", "-i", str(mp3_p), "-ar", "48000", "-ac", "1", "-sample_fmt", "s16", str(wav_p)],
        capture_output=True, text=True,
    )
    mp3_p.unlink(missing_ok=True)
    if r.returncode != 0:
        print(f"FFMPEG ERROR\n{r.stderr[-400:]}"); return False
    print(f"done ({duration(wav_p):.2f}s)")
    return True


def main():
    if not API_KEY:
        print("ERROR: ELEVENLABS_API_KEY not set"); sys.exit(1)
    print(f"Regenerating scenes {TARGETS}…")
    failed = []
    for s in TARGETS:
        ok = gen(s)
        if not ok:
            failed.append(s)
        time.sleep(0.5)
    if failed:
        print(f"\nFAILED: {failed}"); sys.exit(1)
    print("\nAll target scenes regenerated.")


if __name__ == "__main__":
    main()
