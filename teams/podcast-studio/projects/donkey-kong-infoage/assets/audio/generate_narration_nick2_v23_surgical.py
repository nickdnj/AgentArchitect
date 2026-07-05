#!/usr/bin/env python3
"""
SURGICAL RE-RENDER — "The Message in the Machine" v23 (script rev v21)
Voice: Nick's "Nick 2" ElevenLabs clone — 6SxuwKUiBpZjFTc06v9Y — at 1.12x speed.

What this script does:
  1. Re-renders FIVE segments for script rev v21 (NEW decade-walk intro + TRS-80
     continuity + visitor-orphan fixes + family-business setup):
       - seg-01-intro           ALL-NEW decade-walk intro (retires the MAME-visitor cold open)
       - seg-02-sandhill        family-business setup added; "that TRS-80" (drop re-intro)
       - seg-03-whattheywerehiding  MAME name-drop now carries its explanation inline
       - seg-05-ikegami         "after that visitor left the museum..." -> "But it never really let me go"
       - seg-07-close           "the story I told that visitor" -> "the story I wanted to show you";
                                "Remember that TRS-80 I showed you on the way in?"; "pulling the raw code" close
  2. Reuses seg-04-hexdump.wav and seg-06-lawsuit.wav UNTOUCHED (bit-identical from v22).
  3. Backs up the CURRENT (v22-render) take of every file it overwrites first.
  4. Re-concatenates all 7 segments in order (no gap).
  5. Applies atempo=1.06 -> episode-vo.mp3 (overwrites v22 render).
  6. Writes durations.json with BOTH pre- and post-atempo values per segment.

Voice settings (match v20/v21/v22 exactly):
  stability: 0.5  similarity_boost: 0.75  style: 0.4  speed: 1.12
  Model: eleven_multilingual_v2
  Silence trim: leading strip + ~150ms trailing tail (same as v20/v21/v22)
  Final atempo: 1.06x on concatenated mix (pitch-preserved)
  Net effective pace: ~1.19x

Run via:
  zsh -ic 'VOICE_ID=6SxuwKUiBpZjFTc06v9Y SPEED=1.12 python3 /Users/nickd/Workspaces/AgentArchitect/teams/podcast-studio/projects/donkey-kong-infoage/assets/audio/generate_narration_nick2_v23_surgical.py'
"""
import os, sys, subprocess, urllib.request, json, time, shutil
from pathlib import Path

KEY = os.environ.get("ELEVENLABS_API_KEY", "")
VOICE_ID = os.environ.get("VOICE_ID", "")       # Nick 2 clone — must be supplied; no default
MODEL_ID = "eleven_multilingual_v2"
VS = {
    "stability": 0.5,
    "similarity_boost": 0.75,
    "style": 0.4,
    "speed": float(os.environ.get("SPEED", "1.12")),
}

NICK2_VOICE_ID = "6SxuwKUiBpZjFTc06v9Y"
ATEMPO = 1.06
BACKUP_TAG = "v22-backup"   # the take being overwritten is the v22 render

PROJ = Path("/Users/nickd/Workspaces/AgentArchitect/teams/podcast-studio/projects/donkey-kong-infoage")
AUD = PROJ / "assets" / "audio"

# ─────────────────────────────────────────────────────────────────────────────
# Segments to re-render — spoken NICK lines only; DIRECTION lines stripped.
# Text pulled verbatim from script.md rev v21.
# ─────────────────────────────────────────────────────────────────────────────

SEG_01_INTRO_V23 = """\
Hi, my name is Nick. I'm a docent here at the Vintage Computer Museum at InfoAge, in Wall Township, New Jersey. Let me show you around. The whole museum is laid out by decade.

You walk in, and you're standing in the 1940s, back when a computer filled a whole room, all relays and vacuum tubes. Then the 1950s, magnetic core memory, the first machines that could really remember.

The 1960s, transistors, and the mainframes that ran the world.

The 1970s, when it all shrank down onto little chips, and for the first time a computer could sit on your desk.

And then you reach the 1980s. And this is the decade I want to stop on.

Because sitting right here is a TRS-80, the old Radio Shack computer. The exact kind of machine my dad had down in our basement, in 1981. And that machine is where my story starts.\
"""

SEG_02_SANDHILL_V23 = """\
In the 80's, arcade games filled the bars, the bowling alleys, the pizza joints, everywhere people went to have fun. And where I grew up, on Long Island, my family owned and operated them. That was our business. Which meant the best arcade I knew was my own house. Free play, all day, friends always over.

Here's the strange part, though. I was rarely the one playing. When games are your work, you stop being a player. I loved the machines, what made them tick, what was hiding inside. Playing them? That was never really my thing.

My dad fixed everything. If something broke, he didn't replace it. He figured out how it worked... and then he fixed it himself. But he didn't stop at fixing. He taught himself to program on that TRS-80, and wrote the whole system that ran the business. From scratch. Self-taught. All of it. The same machine I'd eventually take to college a few years later. He had the kind of mind that had to know exactly how a thing worked. All the way down.

And that same machine, the one running the business, is the one he'd turn on the games themselves. Which brings me to the chips.\
"""

SEG_03_WHATTHEYWEREHIDING_V23 = """\
Here's the thing about my dad. Every machine that came through, he studied it. Not just to fix it, to understand it. What could he do with this thing?

If a board died out on location, could he make a backup, so the game didn't just disappear? Could he take the program off one board, move it onto another, and turn a machine nobody played into the one everybody wanted? Was there an opportunity hiding in there?

And every one of those questions started the same way. You had to get the data off the chips. Arcade games lived on little memory chips, and everything the game was lived in there. Just pulling that data out, reading the raw code off a chip in 1981, on a Radio Shack computer, that was, to me, an incredible thing to watch.

And it didn't always come off clean. A game stored itself the way the hardware needed to read it, not the way you or I would. So sometimes it came back jumbled, out of order, nonsense. The real work wasn't pulling the data. It was figuring out the order, sitting there working it out, sometimes a bit at a time with little jumper wires, until it snapped into place and made sense.

That was the part he loved. Not the copying, the puzzle. Back then, when people did it for money, they had a word for it: bootlegging. Today we call it reverse engineering. ROM preservation. The MAME project, a whole community that pulls the code off the original arcade machines and saves it before the hardware's gone for good. Same chips, same puzzle. The world just gave it better names.\
"""

SEG_05_IKEGAMI_V23 = """\
Now, for forty years, that was just a story I carried around. A thing my dad and I saw on a screen one night.

But it never really let me go. So I went home, and I started researching. And for the first time, I learned the real story behind that message.

Donkey Kong is a Nintendo game. But Nintendo didn't write the code. They quietly brought in a Japanese engineering firm called Ikegami Tsushinki to actually build it and then never gave them public credit. They were the shadow developer. And buried inside the program, the Ikegami engineers had left a message. For anyone who ever cracked the chip and got in deep enough to read it.

The real message read: "Congratulation! If you analyse difficult this program, we would teach you." And then a phone number, in Tokyo, Japan. And the words: "System Design, Ikegami."

It was a note to a stranger. If you got this far, you're one of us. Congratulation. You found it. Here's our number. Call us.

And somebody actually called that number. A bootlegger, mid-copy, picked up the phone and dialed Tokyo for help.\
"""

SEG_07_CLOSE_V23 = """\
So that's the story I wanted to show you, standing here in an old radar building, surrounded by machines.

And these days, when I walk through this place, I don't just see cabinets and circuit boards. I see the engineers who built them. The operators who ran them. The kids who played them.

Remember that TRS-80 I showed you on the way in? The same kind of machine my dad used to uncover the hidden message inside the Donkey Kong PROMs. Every time I walk past it, I don't just see an old computer. I see my father, hunched over his desk through a haze of cigarette smoke, patiently pulling the raw code off a chip, until a message surfaced that no one was ever meant to find.

That's what we keep here, at the Vintage Computer Museum at InfoAge. Not just old machines, the lives that ran through them.

So come visit. Find the computer from your childhood. The one from your first job. The one your dad brought home.

Because every one of these machines has a story hiding inside it. Come find yours.\
"""

RERENDER_SEGS = {
    "seg-01-intro": SEG_01_INTRO_V23,
    "seg-02-sandhill": SEG_02_SANDHILL_V23,
    "seg-03-whattheywerehiding": SEG_03_WHATTHEYWEREHIDING_V23,
    "seg-05-ikegami": SEG_05_IKEGAMI_V23,
    "seg-07-close": SEG_07_CLOSE_V23,
}

CONCAT_ORDER = [
    "seg-01-intro",
    "seg-02-sandhill",
    "seg-03-whattheywerehiding",
    "seg-04-hexdump",
    "seg-05-ikegami",
    "seg-06-lawsuit",
    "seg-07-close",
]

REUSED_SEGS = [s for s in CONCAT_ORDER if s not in RERENDER_SEGS]

# Floors to catch obviously-truncated/failed renders (well under prior pre-atempo values)
MIN_FLOORS = {
    "seg-01-intro": 30.0,               # all-new decade text
    "seg-02-sandhill": 45.0,            # was 62.41s pre-atempo, slightly longer now
    "seg-03-whattheywerehiding": 80.0,  # was 93.19s pre-atempo, MAME clause added
    "seg-05-ikegami": 50.0,             # was 65.73s pre-atempo, one line swapped ~same length
    "seg-07-close": 42.0,               # was 55.21s pre-atempo, open line reworded
}


def dur(p):
    r = subprocess.run(
        ["ffprobe", "-v", "quiet", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)],
        capture_output=True, text=True,
    )
    try:
        return float(r.stdout.strip())
    except Exception:
        return None


def call_elevenlabs(text):
    """POST to ElevenLabs and return raw mp3 bytes. Raises on HTTP error."""
    payload = json.dumps({
        "text": text,
        "model_id": MODEL_ID,
        "voice_settings": VS,
    }).encode("utf-8")
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}",
        data=payload,
        headers={
            "xi-api-key": KEY,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=180) as resp:
        return resp.read()


def trim_silence(raw_wav, trimmed_wav):
    """Strip leading silence; trim trailing silence to ~150ms tail. Matches v20/v21/v22 exactly."""
    filtergraph = (
        "silenceremove=start_periods=1:start_silence=0.05:start_threshold=-50dB,"
        "areverse,"
        "silenceremove=start_periods=1:start_silence=0.15:start_threshold=-50dB,"
        "areverse"
    )
    result = subprocess.run(
        ["ffmpeg", "-y", "-i", str(raw_wav), "-af", filtergraph,
         "-ar", "48000", "-ac", "1", "-sample_fmt", "s16", str(trimmed_wav)],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        print(f"      WARN: silence-trim ffmpeg issue: {result.stderr[-300:]}")
    return result.returncode == 0


def render_segment(slug, text, min_seconds, attempt=1):
    """Render one segment: ElevenLabs -> raw 48k/16-bit mono WAV -> silence-trim -> slug.wav."""
    wav_raw = AUD / f"{slug}_raw.wav"
    wav_trimmed = AUD / f"{slug}.wav"
    tmp_mp3 = AUD / f"{slug}.tmp.mp3"

    print(f"      [attempt {attempt}] Calling ElevenLabs...", flush=True)
    mp3_bytes = call_elevenlabs(text)
    tmp_mp3.write_bytes(mp3_bytes)

    result = subprocess.run(
        ["ffmpeg", "-y", "-i", str(tmp_mp3),
         "-ar", "48000", "-ac", "1", "-sample_fmt", "s16", str(wav_raw)],
        capture_output=True, text=True,
    )
    tmp_mp3.unlink(missing_ok=True)
    if result.returncode != 0:
        print(f"      WARN: WAV conversion issue: {result.stderr[-300:]}")

    raw_d = dur(wav_raw)
    print(f"      raw WAV: {raw_d:.2f}s" if raw_d else "      raw WAV: duration unreadable")

    ok = trim_silence(wav_raw, wav_trimmed)
    wav_raw.unlink(missing_ok=True)
    if not ok:
        print("      WARN: silence-trim failed — final WAV may have uncut tail")

    trimmed_d = dur(wav_trimmed)
    return raw_d, trimmed_d


def main():
    if not KEY:
        print("ERROR: ELEVENLABS_API_KEY not set.")
        print("Run via: zsh -ic 'VOICE_ID=6SxuwKUiBpZjFTc06v9Y SPEED=1.12 python3 <path>/generate_narration_nick2_v23_surgical.py'")
        sys.exit(1)
    if not VOICE_ID:
        print("ERROR: VOICE_ID not set — this is Nick's 'Nick 2' cloned voice. No silent fallback.")
        sys.exit(1)
    if VOICE_ID != NICK2_VOICE_ID:
        print(f"ERROR: VOICE_ID={VOICE_ID} does not match Nick 2 ({NICK2_VOICE_ID}). Aborting.")
        sys.exit(1)

    print("=" * 70)
    print("  The Message in the Machine — v23 SURGICAL re-render (script rev v21)")
    print("=" * 70)
    print(f"  Voice: Nick 2 / {VOICE_ID}  Model: {MODEL_ID}  speed: {VS['speed']}x  atempo: {ATEMPO}x")
    print(f"  RE-RENDER: {', '.join(RERENDER_SEGS.keys())}")
    print(f"  REUSE (bit-identical from v22): {', '.join(REUSED_SEGS)}")
    print()

    # Step 0a: Back up the current (v22-render) take of everything we overwrite
    print("  Step 0a: Backing up current take before overwrite...")
    for slug in RERENDER_SEGS:
        src = AUD / f"{slug}.wav"
        bak = AUD / f"{slug}.{BACKUP_TAG}.wav"
        if src.exists() and not bak.exists():
            shutil.copy2(src, bak); print(f"    backed up {slug}.wav -> {bak.name}")
    for name in ("episode-vo.mp3", "durations.json"):
        src = AUD / name
        bak = AUD / name.replace(".", f".{BACKUP_TAG}.", 1)
        if src.exists() and not bak.exists():
            shutil.copy2(src, bak); print(f"    backed up {name} -> {bak.name}")
    print()

    # Step 0b: Confirm reused WAVs exist
    print("  Step 0b: Verifying reused WAVs (seg-04, seg-06)...")
    all_ok = True
    for slug in REUSED_SEGS:
        wav = AUD / f"{slug}.wav"
        d = dur(wav) if wav.exists() else None
        if not d or d <= 0:
            print(f"    MISSING/ZERO: {slug}.wav"); all_ok = False
        else:
            print(f"    OK  {slug}.wav  {d:.2f}s  (reused as-is)")
    if not all_ok:
        print("\nERROR: reused WAV missing/zero. Aborting."); sys.exit(1)
    print()

    # Step 1: Re-render the five changed segments
    for slug, text in RERENDER_SEGS.items():
        print(f"  Step 1: Rendering {slug}.wav (script v21 text)...")
        min_floor = MIN_FLOORS[slug]
        try:
            raw_d, trimmed_d = render_segment(slug, text, min_floor, attempt=1)
            if trimmed_d is None or trimmed_d < min_floor:
                print(f"    WARN: trimmed {trimmed_d}s < floor {min_floor}s — retrying once...")
                time.sleep(4)
                raw_d, trimmed_d = render_segment(slug, text, min_floor, attempt=2)
            if not trimmed_d or trimmed_d <= 0:
                print("    FAILED: zero/unreadable duration after retry"); sys.exit(1)
            print(f"    OK  {slug}.wav  trimmed={trimmed_d:.2f}s")
        except Exception as e:
            print(f"    FAILED: {e}"); sys.exit(1)
        print()

    # Step 2: Verify all 7 WAVs before concat
    print("  Step 2: Verifying all 7 WAVs before concat...")
    all_segment_durations = {}
    verify_ok = True
    for slug in CONCAT_ORDER:
        wav = AUD / f"{slug}.wav"
        d = dur(wav) if wav.exists() else None
        if not d or d <= 0:
            print(f"    MISSING/ZERO: {slug}.wav"); verify_ok = False
        else:
            all_segment_durations[slug] = round(d, 2)
            tag = "(new v23 fresh take)" if slug in RERENDER_SEGS else "(reused from v22)"
            print(f"    OK  {slug}.wav  {d:.2f}s  {tag}")
    if not verify_ok:
        print("\nERROR: WAV missing/zero. Aborting concat."); sys.exit(1)
    print()

    # Step 3: Concatenate all 7 trimmed WAVs (no gap)
    print("  Step 3: Concatenating 7 segments (no gap)...")
    concat_list = AUD / "_concat_nick2_v23.txt"
    concat_list.write_text("".join(f"file '{AUD / slug}.wav'\n" for slug in CONCAT_ORDER))
    concat_raw = AUD / "episode-vo-concat-raw-v23.mp3"
    result = subprocess.run(
        ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(concat_list),
         "-codec:a", "libmp3lame", "-q:a", "2", str(concat_raw)],
        capture_output=True, text=True,
    )
    concat_list.unlink(missing_ok=True)
    if result.returncode != 0:
        print(f"  WARN: concat issue: {result.stderr[-500:]}")
    raw_concat_dur = dur(concat_raw)
    print(f"  Raw concat (pre-atempo): {raw_concat_dur:.2f}s")
    print()

    # Step 4: atempo -> episode-vo.mp3
    print(f"  Step 4: atempo={ATEMPO} -> episode-vo.mp3...")
    final_mp3 = AUD / "episode-vo.mp3"
    result = subprocess.run(
        ["ffmpeg", "-y", "-i", str(concat_raw), "-af", f"atempo={ATEMPO}",
         "-codec:a", "libmp3lame", "-q:a", "2", str(final_mp3)],
        capture_output=True, text=True,
    )
    concat_raw.unlink(missing_ok=True)
    if result.returncode != 0:
        print(f"  WARN: atempo issue: {result.stderr[-500:]}")
    final_dur = dur(final_mp3)
    print(f"  Final episode-vo.mp3: {final_dur:.2f}s")
    print()

    # Step 5: durations.json
    output = {}
    for slug in CONCAT_ORDER:
        pre = all_segment_durations[slug]
        output[slug] = pre
        output[f"{slug}_post_atempo"] = round(pre / ATEMPO, 2)
    output["_total"] = round(final_dur or 0, 2)
    output["_total_pre_atempo"] = round(raw_concat_dur or 0, 2)
    output["_atempo"] = ATEMPO
    output["_tts_speed"] = VS["speed"]
    output["_voice"] = f"Nick 2 / {VOICE_ID}"
    output["_script_rev"] = "v21"
    output["_surgical"] = ("seg-01-intro (all-new decade walk), seg-02-sandhill (family business + 'that TRS-80'), "
                           "seg-03-whattheywerehiding (MAME explained inline), seg-05-ikegami ('never really let me go'), "
                           "seg-07-close (direct-address open + 'Remember that TRS-80' callback + 'pulling the raw code') "
                           "fresh-take re-render; seg-04-hexdump + seg-06-lawsuit reused from v22")
    output["_silence_trim_tail_ms"] = 150
    (AUD / "durations.json").write_text(json.dumps(output, indent=2))

    # Step 6: Report
    t = final_dur or 0
    mins = int(t // 60); secs_rem = t - mins * 60
    print("=" * 70)
    print("  DONE — Nick 2 v23 surgical re-render complete (script rev v21)")
    print("=" * 70)
    print(f"\n  episode-vo.mp3  {t:.2f}s  ({mins}:{secs_rem:05.2f})")
    print(f"\n  {'Segment':<30}  {'pre':>9}  {'post':>9}")
    print(f"  {'-'*30}  {'-'*9}  {'-'*9}")
    for slug in CONCAT_ORDER:
        pre = all_segment_durations[slug]; post = round(pre / ATEMPO, 2)
        tag = " <-- NEW" if slug in RERENDER_SEGS else " (reused)"
        print(f"  {slug:<30}  {pre:>8.2f}s  {post:>8.2f}s{tag}")
    print(f"\n  Post-atempo total: {t:.2f}s")


if __name__ == "__main__":
    main()
