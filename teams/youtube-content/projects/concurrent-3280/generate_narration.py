#!/usr/bin/env python3
"""
Generate per-scene narration WAVs for The Concurrent 3280 — Standalone documentary.
ElevenLabs Josh voice. 48kHz 16-bit mono WAV output.
Source: storyboard-v1.md, all 18 scenes. v2 decisions applied (Cold Open A locked, standalone framing).
"""

import os
import sys
import time
import subprocess
import json
from pathlib import Path

ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY", "")
VOICE_ID = "TxGEqnHWrfWFTfGW9XjX"
MODEL_ID = "eleven_multilingual_v2"
VOICE_SETTINGS = {
    "stability": 0.5,
    "similarity_boost": 0.75,
    "style": 0.4,
}

PROJECT_DIR = Path("/Users/nickd/Workspaces/AgentArchitect/teams/youtube-content/projects/concurrent-3280")
NARRATION_DIR = PROJECT_DIR / "assets" / "audio" / "narration"

SCENES = {
    1: "These two machines sit thirty feet apart in a museum in Wall, New Jersey. One is the last great minicomputer of an era that's about to end. The other is the chip that ended it. The same engineer designed both.",
    2: None,
    3: "Edison, New Jersey. Nineteen sixty-six. A handful of engineers walk out of Electronic Associates and start a company called Interdata. Their bet: a thirty-two-bit minicomputer at a time when the rest of the industry is still arguing about sixteen. Six years later they ship the seven thirty-two — one of the first thirty-two-bit minis on the market, designed and built in New Jersey.",
    4: "Nineteen seventy-five — Interdata ships the eight thirty-two, faster, refined for industrial and real-time work. By nineteen seventy-three Perkin-Elmer had already bought the company for seventy-three million dollars and rebranded it Data Systems. The Interdata machines went where DEC and IBM didn't want to go: refineries, weapons systems, factory floors. Quiet, reliable, mostly invisible.",
    5: "November nineteen eighty-five. Perkin-Elmer spins the data systems group off as a standalone company. They call it Concurrent Computer Corporation. Headquarters: Tinton Falls, New Jersey. And inside that building, a small team is already deep into the design of the machine that will become the company's flagship — the Concurrent thirty-two eighty.",
    6: "These photographs were taken inside the Concurrent engineering lab in Tinton Falls in December of nineteen eighty-five. They are, as far as anyone has been able to tell, the only known photographs of the thirty-two eighty in development. The machine in the cabinet would not be announced for another two years.",
    7: "The architect of the thirty-two eighty was Ken Yeager. M-I-T, class of seventy-two. He'd come to Concurrent — then still Perkin-Elmer — in nineteen seventy-nine. He rode his bicycle to work every day. His pants cuffs stayed rolled up at the ankle, even at his desk. He wore the same kind of checkered, bowling-style shirt every week. He hummed, almost constantly, while he worked. He stayed in his office. Engineers had audiences with him — they'd go in, come out with a scrap of paper covered in Yeager's handwriting, and they'd execute on it. The thirty-two eighty was designed on those scraps.",
    8: "The thirty-two eighty's CPU was four boards. Each board was one stage of a scalar pipeline: fetch, decode, A-L-U, write-back. Four hundred nanoseconds per stage. One instruction every clock cycle. The whole thing was built from Schottky T-T-L — discrete logic chips, soldered to printed-circuit boards, hand-routed. By nineteen eighty-eight this was anachronistic. The rest of the industry was moving to single-chip CPUs. But for real-time work — refineries, defense, simulators — the thirty-two eighty's discrete-logic pipeline was deterministic, predictable, and proven. The engineering team was small — four boards, one architect, a senior engineer consulting across all of them, an engineer on loan from another group, and the technician who actually built the prototype on the bench. The architect handed out the scraps. The team turned the scraps into silicon and copper.",
    9: "January twenty-sixth, nineteen eighty-eight. Concurrent announces the thirty-two eighty S-P — single processor, six and a half MIPS, up to thirty-two megabytes of RAM, a one-gigabyte disk. List price in the U-K: two hundred thousand pounds. It runs Concurrent's own real-time operating system, O-S thirty-two, alongside a Unix port called XELOS.",
    10: "Eleven months later, November twenty-ninth, nineteen eighty-eight — Concurrent announces the thirty-two eighty E M-P-S. Up to twelve processors in a single cabinet. Seventy-six point eight aggregate MIPS. Two hundred fifty-six megabytes of memory. One point eight million dollars, fully loaded. The processors talked to each other over a synchronous bus called the S-Bus, on a patent filed by Ken Yeager in nineteen eighty-six. This was the most powerful machine the Interdata lineage ever produced. And it would be the last.",
    11: "By the end of nineteen eighty-eight, the thirty-two eighty was Concurrent's flagship. Inside that lab in Tinton Falls there were maybe twenty people who knew how it actually worked. Most of them are not on the public internet. Most of them have no Wikipedia page, no LinkedIn, no obituary. The technician who built the prototype, a man named Mike Martone, is the one keeping the machine's memory alive — he posts about it, almost forty years later, in a small Facebook group of ex-Concurrent engineers.",
    12: "Around nineteen ninety, Ken Yeager leaves Concurrent. He goes west — Silicon Graphics, MIPS Computer Systems, in Sunnyvale, California. He arrives in time for the next great processor war. The industry has finally figured out how to put a thirty-two-bit CPU on a single piece of silicon. The minicomputer is about to become a museum piece. And Yeager — the man who built the thirty-two eighty from four boards of Schottky T-T-L — is going to help design what replaces it.",
    13: "In nineteen ninety-six, Yeager publishes a paper in I-E-E-E Micro. The title: 'The MIPS R ten thousand Superscalar Microprocessor.' Four-instruction issue. Out-of-order execution. Speculative execution. A textbook RISC processor — the kind they teach computer architecture grad students with. One chip, one piece of silicon, more performance than the thirty-two eighty had with twelve CPUs and a million-eight-hundred-thousand-dollar price tag. Yeager went on to architect the R twelve thousand and the R eighteen thousand. He held four sole patents and ten team patents during those years. The chips he designed at MIPS shipped inside Silicon Graphics workstations — the machines that rendered Jurassic Park, Toy Story, the early web.",
    14: "Ken Yeager died in August of twenty-seventeen. He was sixty-six. The same year, Concurrent Computer Corporation was acquired and ceased to exist as an independent company.",
    15: "There are only a handful of Concurrent thirty-two eighties left in the world. One of them sits at the InfoAge Science Center in Wall, New Jersey — a former Cold War Army communications base, now a computer museum. The cabinet is intact. The four pipeline boards are still in their slots. The Schottky T-T-L chips are still soldered where Mike Martone soldered them. The machine has not been powered on in years.",
    16: "The chip that powered the SGI Onyx ten thousand — also in this museum, about thirty feet from the thirty-two eighty — is the MIPS R ten thousand. Ken Yeager designed both. The minicomputer he built in New Jersey, and the chip in California that helped replace it. They retired into the same room.",
    17: None,
    18: "If you worked at Concurrent — or knew someone who did — find us in the comments.",
}

# Silent scenes get a fixed-duration silence WAV
SILENT_SCENE_DURATIONS = {
    2: 8.0,
    17: 6.0,
}


def get_duration(filepath):
    result = subprocess.run(
        ["ffprobe", "-v", "quiet", "-show_entries", "format=duration",
         "-of", "csv=p=0", str(filepath)],
        capture_output=True, text=True,
    )
    try:
        return float(result.stdout.strip())
    except Exception:
        return None


def generate_scene(scene_num, text, retries=2):
    padded = f"{scene_num:02d}"
    wav_path = NARRATION_DIR / f"scene-{padded}.wav"
    mp3_tmp = NARRATION_DIR / f"scene-{padded}.tmp.mp3"

    if wav_path.exists():
        duration = get_duration(wav_path)
        print(f"  SKIP (exists): scene-{padded}.wav  ({duration:.2f}s)")
        return True, duration

    print(f"  Generating: scene-{padded}  ({len(text)} chars)...", end="", flush=True)

    import urllib.request
    import json as jsonlib

    payload = jsonlib.dumps({
        "text": text,
        "model_id": MODEL_ID,
        "voice_settings": VOICE_SETTINGS,
    }).encode("utf-8")

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"

    for attempt in range(retries + 1):
        try:
            req = urllib.request.Request(
                url,
                data=payload,
                headers={
                    "xi-api-key": ELEVENLABS_API_KEY,
                    "Content-Type": "application/json",
                    "Accept": "audio/mpeg",
                },
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=120) as resp:
                mp3_data = resp.read()

            mp3_tmp.write_bytes(mp3_data)

            result = subprocess.run([
                "ffmpeg", "-y", "-i", str(mp3_tmp),
                "-ar", "48000", "-ac", "1", "-sample_fmt", "s16",
                str(wav_path),
            ], capture_output=True, text=True)

            mp3_tmp.unlink(missing_ok=True)

            if result.returncode != 0:
                print(" FFMPEG ERROR")
                print(result.stderr[-500:])
                return False, None

            duration = get_duration(wav_path)
            print(f" done ({duration:.2f}s)")
            return True, duration

        except Exception as e:
            if attempt < retries:
                print(f" retry ({attempt+1})...", end="", flush=True)
                time.sleep(2)
            else:
                print(f" FAILED: {e}")
                return False, None

    return False, None


def make_silence(scene_num, seconds):
    padded = f"{scene_num:02d}"
    wav_path = NARRATION_DIR / f"scene-{padded}.wav"
    if wav_path.exists():
        dur = get_duration(wav_path)
        print(f"  SKIP (exists): scene-{padded}.wav  ({dur:.2f}s silence)")
        return dur or seconds
    print(f"  Creating silence: scene-{padded}.wav  ({seconds:.1f}s)", end="", flush=True)
    result = subprocess.run([
        "ffmpeg", "-y", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono",
        "-t", str(seconds), "-ar", "48000", "-ac", "1", "-sample_fmt", "s16",
        str(wav_path),
    ], capture_output=True, text=True)
    if result.returncode == 0:
        print(" done")
        return seconds
    print(" ERROR")
    print(result.stderr[-300:])
    return None


def main():
    if not ELEVENLABS_API_KEY:
        print("ERROR: ELEVENLABS_API_KEY not set")
        sys.exit(1)

    NARRATION_DIR.mkdir(parents=True, exist_ok=True)

    results = {}
    failed = []
    voiced = [k for k, v in SCENES.items() if v]
    print(f"\nGenerating {len(voiced)} narration WAVs + {len(SILENT_SCENE_DURATIONS)} silence beats ({len(SCENES)} total scenes)...\n")

    for scene_num in sorted(SCENES.keys()):
        text = SCENES[scene_num]
        if text is None:
            secs = SILENT_SCENE_DURATIONS.get(scene_num, 1.0)
            dur = make_silence(scene_num, secs)
            results[scene_num] = dur
            continue
        ok, dur = generate_scene(scene_num, text)
        if ok:
            results[scene_num] = dur
        else:
            failed.append(scene_num)
            results[scene_num] = None
        time.sleep(0.5)

    results_path = NARRATION_DIR / "generation_results.json"
    results_path.write_text(json.dumps(results, indent=2))

    print("\n--- Generation complete ---")
    print(f"Success: {len([v for v in results.values() if v is not None])}/{len(SCENES)}")
    if failed:
        print(f"FAILED scenes: {failed}")
    total = sum(v for v in results.values() if v)
    print(f"Total narration duration: {total:.1f}s ({total/60:.1f} min)")
    return failed


if __name__ == "__main__":
    main()
