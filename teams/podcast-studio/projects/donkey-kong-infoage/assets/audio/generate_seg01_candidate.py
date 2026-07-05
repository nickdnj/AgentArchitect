#!/usr/bin/env python3
"""CANDIDATE-ONLY re-render of seg-01 (intro) for a cleaner, less-pausey take.
Does NOT overwrite seg-01-intro.wav or episode-vo.mp3 — writes candidate files only.

Change vs current take: the 6 decade beats are flowed as ONE continuous paragraph
(no blank-line breaks) so ElevenLabs doesn't insert big inter-paragraph pauses.
Same locked voice params. Produces:
  seg-01-intro-candidate.wav   (48k mono, silence-trimmed)
  seg-01-intro-candidate.mp3   (atempo 1.06 applied = final-mix pace, for listening)
"""
import os, sys, subprocess, urllib.request, json
from pathlib import Path

KEY = os.environ.get("ELEVENLABS_API_KEY", "")
VOICE_ID = os.environ.get("VOICE_ID", "")
MODEL_ID = "eleven_multilingual_v2"
VS = {"stability": 0.5, "similarity_boost": 0.75, "style": 0.4, "speed": float(os.environ.get("SPEED", "1.12"))}
NICK2 = "6SxuwKUiBpZjFTc06v9Y"
ATEMPO = 1.06
AUD = Path("/Users/nickd/Workspaces/AgentArchitect/teams/podcast-studio/projects/donkey-kong-infoage/assets/audio")

# Same words as seg-01 rev v21 — but ONE continuous paragraph (no blank-line pauses)
SEG_01_FLOWED = (
    "Hi, my name is Nick. I'm a docent here at the Vintage Computer Museum at InfoAge, "
    "in Wall Township, New Jersey. Let me show you around. The whole museum is laid out by decade. "
    "You walk in, and you're standing in the 1940s, back when a computer filled a whole room, all relays and vacuum tubes. "
    "Then the 1950s, magnetic core memory, the first machines that could really remember. "
    "The 1960s, transistors, and the mainframes that ran the world. "
    "The 1970s, when it all shrank down onto little chips, and for the first time a computer could sit on your desk. "
    "And then you reach the 1980s. And this is the decade I want to stop on. "
    "Because sitting right here is a TRS-80, the old Radio Shack computer. "
    "The exact kind of machine my dad had down in our basement, in 1981. And that machine is where my story starts."
)


def dur(p):
    r = subprocess.run(["ffprobe","-v","quiet","-show_entries","format=duration","-of","csv=p=0",str(p)],
                       capture_output=True, text=True)
    try: return float(r.stdout.strip())
    except Exception: return None


def main():
    if not KEY: print("ERROR: ELEVENLABS_API_KEY not set."); sys.exit(1)
    if VOICE_ID != NICK2: print(f"ERROR: VOICE_ID must be Nick 2 ({NICK2}); got {VOICE_ID!r}."); sys.exit(1)

    print("Rendering seg-01 CANDIDATE (flowed intro, cleaner take)...", flush=True)
    payload = json.dumps({"text": SEG_01_FLOWED, "model_id": MODEL_ID, "voice_settings": VS}).encode()
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}", data=payload,
        headers={"xi-api-key": KEY, "Content-Type": "application/json", "Accept": "audio/mpeg"}, method="POST")
    tmp = AUD / "seg-01-intro-candidate.tmp.mp3"
    with urllib.request.urlopen(req, timeout=180) as r:
        tmp.write_bytes(r.read())

    raw = AUD / "seg-01-intro-candidate_raw.wav"
    subprocess.run(["ffmpeg","-y","-i",str(tmp),"-ar","48000","-ac","1","-sample_fmt","s16",str(raw)],
                   capture_output=True, text=True)
    tmp.unlink(missing_ok=True)
    print(f"  raw: {dur(raw):.2f}s")

    trimmed = AUD / "seg-01-intro-candidate.wav"
    fg = ("silenceremove=start_periods=1:start_silence=0.05:start_threshold=-50dB,areverse,"
          "silenceremove=start_periods=1:start_silence=0.15:start_threshold=-50dB,areverse")
    subprocess.run(["ffmpeg","-y","-i",str(raw),"-af",fg,"-ar","48000","-ac","1","-sample_fmt","s16",str(trimmed)],
                   capture_output=True, text=True)
    raw.unlink(missing_ok=True)
    td = dur(trimmed)

    # atempo 1.06 -> listen at final-mix pace
    mp3 = AUD / "seg-01-intro-candidate.mp3"
    subprocess.run(["ffmpeg","-y","-i",str(trimmed),"-af",f"atempo={ATEMPO}","-codec:a","libmp3lame","-q:a","2",str(mp3)],
                   capture_output=True, text=True)
    md = dur(mp3)
    print(f"  trimmed WAV: {td:.2f}s  ->  candidate MP3 (atempo {ATEMPO}): {md:.2f}s")
    print(f"  (current seg-01 for comparison: 56.74s pre-atempo / 53.53s post)")
    print(f"  wrote: {trimmed.name}  +  {mp3.name}  (originals untouched)")


if __name__ == "__main__":
    main()
