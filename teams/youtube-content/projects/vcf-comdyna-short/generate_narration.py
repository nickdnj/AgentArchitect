#!/usr/bin/env python3
"""
Generate PER-SCENE narration for the VCF Comdyna GP-6 short.
ElevenLabs "Josh" (locked shorts template). Outputs:
  assets/audio/scene-NN.wav    — per-scene 48kHz 16-bit mono (surgical re-record)
  assets/audio/narration.mp3   — concatenated full VO (Gate-2 listening review)
  assets/audio/durations.json  — {scene: seconds} for assembly sync
"""
import os, sys, subprocess, urllib.request, json
from pathlib import Path

KEY = os.environ.get("ELEVENLABS_API_KEY", "")
VOICE_ID = os.environ.get("VOICE_ID", "TxGEqnHWrfWFTfGW9XjX")   # default Josh; override for A/B
MODEL_ID = "eleven_multilingual_v2"
VS = {"stability": 0.5, "similarity_boost": 0.75, "style": 0.4, "speed": float(os.environ.get("SPEED", "1.0"))}

PROJ = Path("/Users/nickd/Workspaces/AgentArchitect/teams/youtube-content/projects/vcf-comdyna-short")
AUD = PROJ / "assets" / os.environ.get("AUD_SUB", "audio")

SCENES = {
    1: "This 1970s box solves this equation…",
    2: "Faster than your laptop.",
    3: "No chip. No code. No ones and zeros. It's an analog computer — you wire it up and turn knobs.",
    4: "Gravity is just a voltage you dial in. Watch.",
    5: "I turn the gravity knob down — the arc stretches, the ball sails. That's the Moon. Crank it up, it slams down. I never re-ran anything. The wiring is the equation.",
    6: "It doesn't calculate the motion — it becomes the motion. That's the one thing analog computers still win — the way engineers flew Apollo and guided missiles for thirty years, before digital won on precision.",
    7: "See this analog computer trainer here in Wall, New Jersey — on the old Army Signal Corps base where they helped invent the radar that won World War Two. Run by volunteers. You've driven right past the sign.",
    8: "Come turn the knob yourself.",
}

def dur(p):
    r = subprocess.run(["ffprobe","-v","quiet","-show_entries","format=duration","-of","csv=p=0",str(p)],
                       capture_output=True, text=True)
    try: return float(r.stdout.strip())
    except: return None

def gen(n, text):
    wav = AUD / f"scene-{n:02d}.wav"
    mp3 = AUD / f"scene-{n:02d}.tmp.mp3"
    payload = json.dumps({"text": text, "model_id": MODEL_ID, "voice_settings": VS}).encode()
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}",
        data=payload, headers={"xi-api-key": KEY, "Content-Type":"application/json","Accept":"audio/mpeg"}, method="POST")
    with urllib.request.urlopen(req, timeout=120) as resp:
        mp3.write_bytes(resp.read())
    subprocess.run(["ffmpeg","-y","-i",str(mp3),"-ar","48000","-ac","1","-sample_fmt","s16",str(wav)],
                   capture_output=True, text=True)
    mp3.unlink(missing_ok=True)
    return dur(wav)

def main():
    if not KEY: print("ERROR: ELEVENLABS_API_KEY not set"); sys.exit(1)
    AUD.mkdir(parents=True, exist_ok=True)
    durations = {}
    for n in range(1, 9):
        d = gen(n, SCENES[n])
        durations[n] = d
        print(f"  scene-{n:02d}.wav  {d:.2f}s")
    # concat to a single mp3 for review
    listf = AUD / "concat.txt"
    listf.write_text("".join(f"file 'scene-{n:02d}.wav'\n" for n in range(1,9)))
    subprocess.run(["ffmpeg","-y","-f","concat","-safe","0","-i",str(listf),
                    "-codec:a","libmp3lame","-q:a","2",str(AUD/"narration.mp3")],
                   capture_output=True, text=True)
    listf.unlink(missing_ok=True)
    (AUD/"durations.json").write_text(json.dumps(durations, indent=2))
    total = sum(durations.values())
    print(f"  narration.mp3  {dur(AUD/'narration.mp3'):.2f}s   (total {total:.1f}s)")

if __name__ == "__main__":
    main()
