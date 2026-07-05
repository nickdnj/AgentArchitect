#!/usr/bin/env python3
"""
FULL RE-RENDER — "The Message in the Machine" v24 (script rev v21)
Voice: Nick's "Nick 2" ElevenLabs clone — 6SxuwKUiBpZjFTc06v9Y — at 1.12x speed.

WHY: v15 mixed fresh v23 takes (seg-01/02/03/05/07) with older v22 takes
(seg-04/06). Params are identical across all versions, but ElevenLabs generates the
cloned voice non-deterministically (stability 0.5, no seed) and the voice model's
state can differ between sessions — so the reused older takes had a subtly different
timbre/quality than the new ones. Per Nick, re-render ALL SEVEN in ONE pass so the
whole narration is one consistent generation session. No reuse.

Params (locked, identical to v11–v23):
  Model eleven_multilingual_v2  ·  stability 0.5  similarity 0.75  style 0.4  speed 1.12
  Silence trim: leading strip + ~150ms trailing tail  ·  Final atempo 1.06x (pitch-preserved)

Run via:
  zsh -ic 'VOICE_ID=6SxuwKUiBpZjFTc06v9Y SPEED=1.12 python3 /Users/nickd/Workspaces/AgentArchitect/teams/podcast-studio/projects/donkey-kong-infoage/assets/audio/generate_narration_nick2_v24_full.py'
"""
import os, sys, subprocess, urllib.request, json, time, shutil
from pathlib import Path

KEY = os.environ.get("ELEVENLABS_API_KEY", "")
VOICE_ID = os.environ.get("VOICE_ID", "")
MODEL_ID = "eleven_multilingual_v2"
VS = {
    "stability": 0.5,
    "similarity_boost": 0.75,
    "style": 0.4,
    "speed": float(os.environ.get("SPEED", "1.12")),
}
NICK2_VOICE_ID = "6SxuwKUiBpZjFTc06v9Y"
ATEMPO = 1.06
BACKUP_TAG = "v23-backup"

PROJ = Path("/Users/nickd/Workspaces/AgentArchitect/teams/podcast-studio/projects/donkey-kong-infoage")
AUD = PROJ / "assets" / "audio"

# ─── Spoken NICK lines only (DIRECTION stripped), verbatim from script.md rev v21 ───

SEG_01_INTRO = """\
Hi, my name is Nick. I'm a docent here at the Vintage Computer Museum at InfoAge, in Wall Township, New Jersey. Let me show you around. The whole museum is laid out by decade.

You walk in, and you're standing in the 1940s, back when a computer filled a whole room, all relays and vacuum tubes. Then the 1950s, magnetic core memory, the first machines that could really remember.

The 1960s, transistors, and the mainframes that ran the world.

The 1970s, when it all shrank down onto little chips, and for the first time a computer could sit on your desk.

And then you reach the 1980s. And this is the decade I want to stop on.

Because sitting right here is a TRS-80, the old Radio Shack computer. The exact kind of machine my dad had down in our basement, in 1981. And that machine is where my story starts.\
"""

SEG_02_SANDHILL = """\
In the 80's, arcade games filled the bars, the bowling alleys, the pizza joints, everywhere people went to have fun. And where I grew up, on Long Island, my family owned and operated them. That was our business. Which meant the best arcade I knew was my own house. Free play, all day, friends always over.

Here's the strange part, though. I was rarely the one playing. When games are your work, you stop being a player. I loved the machines, what made them tick, what was hiding inside. Playing them? That was never really my thing.

My dad fixed everything. If something broke, he didn't replace it. He figured out how it worked... and then he fixed it himself. But he didn't stop at fixing. He taught himself to program on that TRS-80, and wrote the whole system that ran the business. From scratch. Self-taught. All of it. The same machine I'd eventually take to college a few years later. He had the kind of mind that had to know exactly how a thing worked. All the way down.

And that same machine, the one running the business, is the one he'd turn on the games themselves. Which brings me to the chips.\
"""

SEG_03_WHATTHEYWEREHIDING = """\
Here's the thing about my dad. Every machine that came through, he studied it. Not just to fix it, to understand it. What could he do with this thing?

If a board died out on location, could he make a backup, so the game didn't just disappear? Could he take the program off one board, move it onto another, and turn a machine nobody played into the one everybody wanted? Was there an opportunity hiding in there?

And every one of those questions started the same way. You had to get the data off the chips. Arcade games lived on little memory chips, and everything the game was lived in there. Just pulling that data out, reading the raw code off a chip in 1981, on a Radio Shack computer, that was, to me, an incredible thing to watch.

And it didn't always come off clean. A game stored itself the way the hardware needed to read it, not the way you or I would. So sometimes it came back jumbled, out of order, nonsense. The real work wasn't pulling the data. It was figuring out the order, sitting there working it out, sometimes a bit at a time with little jumper wires, until it snapped into place and made sense.

That was the part he loved. Not the copying, the puzzle. Back then, when people did it for money, they had a word for it: bootlegging. Today we call it reverse engineering. ROM preservation. The MAME project, a whole community that pulls the code off the original arcade machines and saves it before the hardware's gone for good. Same chips, same puzzle. The world just gave it better names.\
"""

SEG_04_HEXDUMP = """\
So one day, my dad calls me over.

And I come down the stairs into his office. The whole room sat in a haze of cigarette smoke, the glow of the screen cutting right through it. I lean in over his shoulder. We're staring at the screen of his TRS-80 with a PROM programmer wired into it, one of those Donkey Kong chips sitting in the socket. And on that screen is the dump from the chip. An early Donkey Kong board. Donkey Kong was the new hot game that year, the one with the big ape and the little guy in the red hat they hadn't even named Mario yet.

He'd pulled the whole program right off the chip. That part, getting the raw data out, that was the feat, and by now he'd gotten good at it. This one came off clean and readable, the raw guts of the game right there on the screen.

And what you're looking at is a hex dump. A listing, laid out in columns. Down the left, and through the middle, it's all hexadecimal numbers. Row after row of them. The raw guts of the program, meaning nothing to me.

And then there's a column on the right. That's the text view. It takes those same raw bytes and shows them to you as readable characters, if there's anything readable in there to find. And mostly there isn't. Mostly it's little fragments. A stray character here. The occasional half of a word there. Nothing that means anything.

And then scrolling down, in that right-hand column...

English. Broken English.

An actual sentence.

The game... was talking.

It said something like: "Congratulations. If you're reading this, call this number in Tokyo, Japan."

And I lost my mind. I'm sixteen years old, standing in my dad's office, looking at a secret message that almost nobody on Earth was ever supposed to find.\
"""

SEG_05_IKEGAMI = """\
Now, for forty years, that was just a story I carried around. A thing my dad and I saw on a screen one night.

But it never really let me go. So I went home, and I started researching. And for the first time, I learned the real story behind that message.

Donkey Kong is a Nintendo game. But Nintendo didn't write the code. They quietly brought in a Japanese engineering firm called Ikegami Tsushinki to actually build it and then never gave them public credit. They were the shadow developer. And buried inside the program, the Ikegami engineers had left a message. For anyone who ever cracked the chip and got in deep enough to read it.

The real message read: "Congratulation! If you analyse difficult this program, we would teach you." And then a phone number, in Tokyo, Japan. And the words: "System Design, Ikegami."

It was a note to a stranger. If you got this far, you're one of us. Congratulation. You found it. Here's our number. Call us.

And somebody actually called that number. A bootlegger, mid-copy, picked up the phone and dialed Tokyo for help.\
"""

SEG_06_LAWSUIT = """\
But there's one more piece of the story.

When Donkey Kong became a monster hit, Nintendo wanted to keep making it, but they'd fallen out with Ikegami. So they had the code reverse-engineered. Copied. So they could keep cranking out the game without the people who actually built it.

Ikegami took them to court for copyright infringement. It dragged on for years. A court sided with Ikegami, that Nintendo didn't own the code, and in the end, the two sides settled out of court.

The battle over who really created Donkey Kong came down to what was hidden inside those ROM chips. The message my father had uncovered turned out to be one of the most important clues in the entire case.\
"""

SEG_07_CLOSE = """\
So that's the story I wanted to show you, standing here in an old radar building, surrounded by machines.

And these days, when I walk through this place, I don't just see cabinets and circuit boards. I see the engineers who built them. The operators who ran them. The kids who played them.

Remember that TRS-80 I showed you on the way in? The same kind of machine my dad used to uncover the hidden message inside the Donkey Kong PROMs. Every time I walk past it, I don't just see an old computer. I see my father, hunched over his desk through a haze of cigarette smoke, patiently pulling the raw code off a chip, until a message surfaced that no one was ever meant to find.

That's what we keep here, at the Vintage Computer Museum at InfoAge. Not just old machines, the lives that ran through them.

So come visit. Find the computer from your childhood. The one from your first job. The one your dad brought home.

Because every one of these machines has a story hiding inside it. Come find yours.\
"""

# ALL SEVEN re-rendered — no reuse
CONCAT_ORDER = [
    "seg-01-intro", "seg-02-sandhill", "seg-03-whattheywerehiding", "seg-04-hexdump",
    "seg-05-ikegami", "seg-06-lawsuit", "seg-07-close",
]
RERENDER_SEGS = {
    "seg-01-intro": SEG_01_INTRO,
    "seg-02-sandhill": SEG_02_SANDHILL,
    "seg-03-whattheywerehiding": SEG_03_WHATTHEYWEREHIDING,
    "seg-04-hexdump": SEG_04_HEXDUMP,
    "seg-05-ikegami": SEG_05_IKEGAMI,
    "seg-06-lawsuit": SEG_06_LAWSUIT,
    "seg-07-close": SEG_07_CLOSE,
}
MIN_FLOORS = {
    "seg-01-intro": 30.0, "seg-02-sandhill": 45.0, "seg-03-whattheywerehiding": 80.0,
    "seg-04-hexdump": 100.0, "seg-05-ikegami": 50.0, "seg-06-lawsuit": 30.0, "seg-07-close": 42.0,
}


def dur(p):
    r = subprocess.run(["ffprobe","-v","quiet","-show_entries","format=duration","-of","csv=p=0",str(p)],
                       capture_output=True, text=True)
    try: return float(r.stdout.strip())
    except Exception: return None


def call_elevenlabs(text):
    payload = json.dumps({"text": text, "model_id": MODEL_ID, "voice_settings": VS}).encode("utf-8")
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}", data=payload,
        headers={"xi-api-key": KEY, "Content-Type": "application/json", "Accept": "audio/mpeg"},
        method="POST")
    with urllib.request.urlopen(req, timeout=180) as resp:
        return resp.read()


def trim_silence(raw_wav, trimmed_wav):
    fg = ("silenceremove=start_periods=1:start_silence=0.05:start_threshold=-50dB,areverse,"
          "silenceremove=start_periods=1:start_silence=0.15:start_threshold=-50dB,areverse")
    r = subprocess.run(["ffmpeg","-y","-i",str(raw_wav),"-af",fg,"-ar","48000","-ac","1","-sample_fmt","s16",str(trimmed_wav)],
                       capture_output=True, text=True)
    if r.returncode != 0: print(f"      WARN silence-trim: {r.stderr[-300:]}")
    return r.returncode == 0


def render_segment(slug, text, attempt=1):
    wav_raw = AUD / f"{slug}_raw.wav"; wav_trimmed = AUD / f"{slug}.wav"; tmp_mp3 = AUD / f"{slug}.tmp.mp3"
    print(f"      [attempt {attempt}] Calling ElevenLabs...", flush=True)
    tmp_mp3.write_bytes(call_elevenlabs(text))
    subprocess.run(["ffmpeg","-y","-i",str(tmp_mp3),"-ar","48000","-ac","1","-sample_fmt","s16",str(wav_raw)],
                   capture_output=True, text=True)
    tmp_mp3.unlink(missing_ok=True)
    raw_d = dur(wav_raw)
    print(f"      raw WAV: {raw_d:.2f}s" if raw_d else "      raw WAV: unreadable")
    trim_silence(wav_raw, wav_trimmed); wav_raw.unlink(missing_ok=True)
    return raw_d, dur(wav_trimmed)


def main():
    if not KEY: print("ERROR: ELEVENLABS_API_KEY not set."); sys.exit(1)
    if VOICE_ID != NICK2_VOICE_ID:
        print(f"ERROR: VOICE_ID must be Nick 2 ({NICK2_VOICE_ID}). Got {VOICE_ID!r}. Aborting."); sys.exit(1)

    print("=" * 70)
    print("  The Message in the Machine — v24 FULL re-render (ALL 7, one consistent pass)")
    print("=" * 70)
    print(f"  Voice: Nick 2 / {VOICE_ID}  Model: {MODEL_ID}  speed: {VS['speed']}x  atempo: {ATEMPO}x")
    print()

    # Back up current (v23) take of everything we overwrite
    print("  Step 0: Backing up current (v23) take...")
    for slug in CONCAT_ORDER:
        src = AUD / f"{slug}.wav"; bak = AUD / f"{slug}.{BACKUP_TAG}.wav"
        if src.exists() and not bak.exists():
            shutil.copy2(src, bak); print(f"    backed up {slug}.wav -> {bak.name}")
    for name in ("episode-vo.mp3", "durations.json"):
        src = AUD / name; bak = AUD / name.replace(".", f".{BACKUP_TAG}.", 1)
        if src.exists() and not bak.exists():
            shutil.copy2(src, bak); print(f"    backed up {name} -> {bak.name}")
    print()

    # Render all 7
    for slug in CONCAT_ORDER:
        text = RERENDER_SEGS[slug]; floor = MIN_FLOORS[slug]
        print(f"  Rendering {slug}.wav ...")
        try:
            raw_d, trimmed_d = render_segment(slug, text, 1)
            if trimmed_d is None or trimmed_d < floor:
                print(f"    WARN {trimmed_d}s < floor {floor}s — retry once"); time.sleep(4)
                raw_d, trimmed_d = render_segment(slug, text, 2)
            if not trimmed_d or trimmed_d <= 0:
                print("    FAILED zero/unreadable"); sys.exit(1)
            print(f"    OK  {slug}.wav  {trimmed_d:.2f}s")
        except Exception as e:
            print(f"    FAILED: {e}"); sys.exit(1)
        print()

    # Verify + concat
    print("  Verifying + concatenating all 7...")
    durs = {}
    for slug in CONCAT_ORDER:
        d = dur(AUD / f"{slug}.wav")
        if not d or d <= 0: print(f"    MISSING/ZERO {slug}"); sys.exit(1)
        durs[slug] = round(d, 2); print(f"    OK  {slug}.wav  {d:.2f}s")
    cl = AUD / "_concat_nick2_v24.txt"
    cl.write_text("".join(f"file '{AUD/slug}.wav'\n" for slug in CONCAT_ORDER))
    craw = AUD / "episode-vo-concat-raw-v24.mp3"
    subprocess.run(["ffmpeg","-y","-f","concat","-safe","0","-i",str(cl),"-codec:a","libmp3lame","-q:a","2",str(craw)],
                   capture_output=True, text=True)
    cl.unlink(missing_ok=True)
    raw_total = dur(craw)

    final = AUD / "episode-vo.mp3"
    subprocess.run(["ffmpeg","-y","-i",str(craw),"-af",f"atempo={ATEMPO}","-codec:a","libmp3lame","-q:a","2",str(final)],
                   capture_output=True, text=True)
    craw.unlink(missing_ok=True)
    final_d = dur(final)

    out = {}
    for slug in CONCAT_ORDER:
        out[slug] = durs[slug]; out[f"{slug}_post_atempo"] = round(durs[slug]/ATEMPO, 2)
    out["_total"] = round(final_d or 0, 2); out["_total_pre_atempo"] = round(raw_total or 0, 2)
    out["_atempo"] = ATEMPO; out["_tts_speed"] = VS["speed"]; out["_voice"] = f"Nick 2 / {VOICE_ID}"
    out["_script_rev"] = "v21"
    out["_surgical"] = "FULL re-render — all 7 segments in one consistent generation session (fixes v15 old/new take mismatch)"
    out["_silence_trim_tail_ms"] = 150
    (AUD / "durations.json").write_text(json.dumps(out, indent=2))

    t = final_d or 0; mm = int(t//60)
    print("\n" + "=" * 70)
    print(f"  DONE — v24 full re-render.  episode-vo.mp3 {t:.2f}s ({mm}:{t-60*mm:05.2f})")
    print("=" * 70)
    print(f"  {'segment':<30}{'pre':>9}{'post':>9}")
    for slug in CONCAT_ORDER:
        print(f"  {slug:<30}{durs[slug]:>8.2f}s{round(durs[slug]/ATEMPO,2):>8.2f}s")


if __name__ == "__main__":
    main()
