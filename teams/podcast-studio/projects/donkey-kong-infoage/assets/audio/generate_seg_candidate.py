#!/usr/bin/env python3
"""CANDIDATE-ONLY re-render of a flagged segment for a cleaner, less-pausey take.
Usage: python3 generate_seg_candidate.py <seg-slug>
Writes <slug>-candidate.wav + <slug>-candidate.mp3 (atempo 1.06 = final pace). Originals untouched.

Fix vs current take: each segment's beats are flowed as ONE continuous paragraph
(no blank-line breaks) so ElevenLabs doesn't insert exaggerated inter-paragraph pauses.
Same locked voice params.
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

# Flowed (continuous-prose) versions — same words as script.md rev v21, blank-line breaks removed.
FLOWED = {
    "seg-02-sandhill": (
        "In the 80's, arcade games filled the bars, the bowling alleys, the pizza joints, everywhere people went to have fun. "
        "And where I grew up, on Long Island, my family owned and operated them. That was our business. Which meant the best arcade I knew was my own house. Free play all day, friends always over. "
        "Here's the strange part, though. I was rarely the one playing. When games are your work, you stop being a player. I loved the machines, what made them tick, what was hiding inside. Playing them? That was never really my thing. "
        "My dad fixed everything. If something broke, he didn't replace it. He figured out how it worked, and then he fixed it himself. But he didn't stop at fixing. He taught himself to program on that TRS-80, and wrote the whole system that ran the business. From scratch, self-taught. The same machine I'd eventually take to college a few years later. "
        "And that same machine, the one running the business, is the one he'd turn on the games themselves."
    ),
    "seg-03-whattheywerehiding": (
        "Here's the thing about my dad. Every machine that came through, he studied it. Not just to fix it, to understand it. What could he do with this thing? "
        "If a board died out on location, could he make a backup, so the game didn't just disappear? Could he take the program off one board move it onto another and turn a machine nobody played into the one everybody wanted? Was there an opportunity hiding in there? "
        "And every one of those questions started the same way. You had to get the data off the chips. Arcade games lived on little memory chips and everything the game was, lived in there. Just pulling that data out reading the raw code off a chip in 1981 on a Radio Shack computer, that was an incredible thing to watch. "
        "And it didn't always come off clean. A game stored itself the way the hardware needed to read it not the way you or I would. So sometimes it came back jumbled out of order nonsense. The real work wasn't pulling the data. It was figuring out the order, sitting there working it out sometimes a bit at a time with little jumper wires until it snapped into place and made sense. "
        "That was the part he loved. Not the copying, the puzzle. Back then, when people did it for money, they had a word for it: bootlegging. Today we call it reverse engineering. ROM preservation. The MAME project, a whole community that pulls the code off the original arcade machines and saves it before the hardware's gone for good. Same chips same puzzle. The world just gave it better names."
    ),
    "seg-05-ikegami": (
        "Now, for forty years, that was just a story I carried around. A thing my dad and I saw on a screen one night. "
        "But it never really let me go. So I went home, and I started researching. And for the first time, I learned the real story behind that message. "
        "Donkey Kong is a Nintendo game. But Nintendo didn't write the code. They quietly brought in a Japanese engineering firm called Ikegami Tsushinki to actually build it and then never gave them public credit. They were the shadow developer. And buried inside the program, the Ikegami engineers had left a message. For anyone who ever cracked the chip and got in deep enough to read it. "
        "The real message read: \"Congratulation! If you analyse difficult this program, we would teach you.\" And then a phone number in Tokyo, Japan. And the words: \"System Design, Ikegami.\" "
        "It was a note to a stranger. If you got this far, you're one of us. Congratulation, you found it. Here's our number. Call us. "
        "And somebody actually called that number. A bootlegger, mid-copy, picked up the phone and dialed Tokyo for help."
    ),
}

# current v24 post-atempo lengths for comparison
CUR_POST = {"seg-02-sandhill": 63.70, "seg-03-whattheywerehiding": 91.04, "seg-05-ikegami": 69.17}


def dur(p):
    r = subprocess.run(["ffprobe","-v","quiet","-show_entries","format=duration","-of","csv=p=0",str(p)],
                       capture_output=True, text=True)
    try: return float(r.stdout.strip())
    except Exception: return None


def main():
    if len(sys.argv) < 2 or sys.argv[1] not in FLOWED:
        print(f"Usage: python3 generate_seg_candidate.py <{'|'.join(FLOWED)}>"); sys.exit(1)
    slug = sys.argv[1]; text = FLOWED[slug]
    if not KEY: print("ERROR: ELEVENLABS_API_KEY not set."); sys.exit(1)
    if VOICE_ID != NICK2: print(f"ERROR: VOICE_ID must be Nick 2 ({NICK2}); got {VOICE_ID!r}."); sys.exit(1)

    print(f"Rendering {slug} CANDIDATE (flowed, cleaner take)...", flush=True)
    payload = json.dumps({"text": text, "model_id": MODEL_ID, "voice_settings": VS}).encode()
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}", data=payload,
        headers={"xi-api-key": KEY, "Content-Type": "application/json", "Accept": "audio/mpeg"}, method="POST")
    tmp = AUD / f"{slug}-candidate.tmp.mp3"
    with urllib.request.urlopen(req, timeout=180) as r:
        tmp.write_bytes(r.read())

    raw = AUD / f"{slug}-candidate_raw.wav"
    subprocess.run(["ffmpeg","-y","-i",str(tmp),"-ar","48000","-ac","1","-sample_fmt","s16",str(raw)],
                   capture_output=True, text=True)
    tmp.unlink(missing_ok=True)
    print(f"  raw: {dur(raw):.2f}s")

    trimmed = AUD / f"{slug}-candidate.wav"
    fg = ("silenceremove=start_periods=1:start_silence=0.05:start_threshold=-50dB,areverse,"
          "silenceremove=start_periods=1:start_silence=0.15:start_threshold=-50dB,areverse")
    subprocess.run(["ffmpeg","-y","-i",str(raw),"-af",fg,"-ar","48000","-ac","1","-sample_fmt","s16",str(trimmed)],
                   capture_output=True, text=True)
    raw.unlink(missing_ok=True)
    td = dur(trimmed)

    mp3 = AUD / f"{slug}-candidate.mp3"
    subprocess.run(["ffmpeg","-y","-i",str(trimmed),"-af",f"atempo={ATEMPO}","-codec:a","libmp3lame","-q:a","2",str(mp3)],
                   capture_output=True, text=True)
    md = dur(mp3)
    cur = CUR_POST.get(slug)
    print(f"  trimmed WAV: {td:.2f}s  ->  candidate MP3 (atempo {ATEMPO}): {md:.2f}s"
          + (f"   (current: {cur:.2f}s post)" if cur else ""))
    print(f"  wrote: {trimmed.name} + {mp3.name}  (originals untouched)")


if __name__ == "__main__":
    main()
