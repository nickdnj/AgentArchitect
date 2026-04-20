#!/usr/bin/env python3
"""
Generate per-scene narration WAVs for The Jersey Stack — Episode 1: The Transistor.
ElevenLabs Josh voice. 48kHz 16-bit mono WAV output.
Rate limit: max 3 concurrent — runs sequentially.
"""

import os
import sys
import time
import subprocess
import json
from pathlib import Path

ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY", "")
VOICE_ID = "TxGEqnHWrfWFTfGW9XjX"  # Josh
MODEL_ID = "eleven_multilingual_v2"
VOICE_SETTINGS = {
    "stability": 0.5,
    "similarity_boost": 0.75,
    "style": 0.4
}

PROJECT_DIR = Path("/Users/nickd/Workspaces/AgentArchitect/teams/youtube-content/projects/jersey-stack-ep1-transistor")
NARRATION_DIR = PROJECT_DIR / "assets" / "audio" / "narration"

# Scene narration texts (31 scenes, scene 04 is silent title card)
SCENES = {
    1: "You might recognize this building.",
    2: "That's the Lumon Industries headquarters from Severance. What you probably don't know is what it used to be. This was Bell Labs Holmdel. And the monument out front — the one shaped like a transistor — marks something that was invented twenty miles north of here, on December twenty-third, nineteen forty-seven.",
    3: "Every one of these exists because of what three men did in a single room in New Jersey, in about ten minutes, seventy-nine years ago. The twentieth century pivoted on a bench in a basement. This is where it started.",
    4: None,  # Beat of silence — title card
    5: "Twenty miles north of Holmdel is the building where it actually happened. Bell Laboratories, Murray Hill, New Jersey. Ten miles west of Manhattan, set back from a quiet suburban road. It looked like a small college campus. It wasn't. It was the research arm of AT&T, the American telephone monopoly, and inside it was arguably the densest concentration of scientific talent on Earth.",
    6: "AT&T was a regulated monopoly. That meant stable, enormous, predictable profits — and a portion of those profits was, by design, funneled into research with no deadline. No quarterly targets. The man who decided what to do with that money was Mervin Kelly, the Director of Research. Kelly was an engineer's engineer, but he thought like a gambler. And in nineteen forty-five he made a very specific bet.",
    7: "Kelly believed the next revolution in communications would be solid-state — no moving parts, no glowing filaments. And he built the building to produce it. There was a corridor on the first floor of Murray Hill that ran seven hundred feet — almost the length of two football fields. Kelly designed it that way on purpose. Physicists had offices on that corridor. So did chemists. So did metallurgists and engineers. You could not walk from your office to the cafeteria without colliding with someone who was thinking about your problem from a completely different angle. In the fall of nineteen forty-five, Kelly created a new solid-state physics group inside that building. He put a thirty-five-year-old physicist named William Shockley in charge of it. Shockley recruited a quiet theorist from the Midwest named John Bardeen, and an experimentalist from the Pacific Northwest named Walter Brattain. Two years later, those three names would go on the most important patent of the century.",
    8: "To understand why Kelly was so obsessed with solid state, you have to understand what AT&T's engineers were fighting. Every long-distance phone call in America in nineteen forty-five traveled along a copper line, and every few dozen miles that signal got weaker and needed to be amplified. The device that did the amplifying was the vacuum tube. Vacuum tubes worked — but barely. They were the size of a light bulb. They ran hot enough to cook an egg. They burned out constantly. They consumed enormous amounts of power. Scale up the American phone network, and the math broke. The tubes alone would have needed their own power plants.",
    9: "Kelly's bet was this: somewhere inside a class of materials called semiconductors — germanium, silicon — there was a way to move electrons around a tiny crystal that would do the same job as a vacuum tube, with none of the heat, the size, or the fragility. No one quite knew how. Shockley had an idea in early nineteen forty-five — a thing he called a field-effect amplifier. He was convinced it would work. He spent two years on it. It did not work.",
    10: "By the summer of nineteen forty-seven, Shockley's group had been chasing the solid-state amplifier for two years. They had almost nothing to show for it.",
    11: "John Bardeen was thirty-eight years old, born in Madison, Wisconsin, the son of a university dean. He was famously quiet — so quiet that colleagues sometimes forgot he was in the room. He did his best thinking in equations, and he did not like to be rushed. Bardeen would, much later, become the only person in history to win the Nobel Prize in Physics twice. He was the theorist on the team.",
    12: 'Walter Brattain was Bardeen\'s opposite — loud, funny, raised on a ranch in Washington State. Brattain had what Bell Labs people called "the best pair of hands in the building." He could assemble an experiment that no one else could get to work. While Bardeen reasoned about it on a chalkboard, Brattain built it on a bench. The two of them, it turned out, were perfectly paired. They shared an office.',
    13: "Their boss, William Shockley, was thirty-seven, a brilliant theoretical physicist, already ambitious, already difficult. He led the group, but he traveled often, and he spent less and less time at the bench. In the fall of nineteen forty-seven, with Shockley mostly out of the building, Bardeen had the insight that unlocked everything. He realized that electrons were getting trapped on the surface of the germanium crystal — that the surface itself was acting as a shield, blocking the effect Shockley had been chasing. If they could get underneath that surface, directly into the bulk of the crystal, with the right kind of contact — they might have an amplifier. Through November and into December of nineteen forty-seven, Bardeen and Brattain, in Lab One-E-four-fifty-five at Murray Hill, worked their way toward the device. They were within days of it. They just didn't know yet.",
    14: "December twenty-third, nineteen forty-seven. The afternoon before Christmas Eve. In a basement room at Murray Hill, Walter Brattain laid out the final version of the device. It was absurdly small. A slab of germanium about the size of a thumbnail. A triangular plastic wedge, with two narrow strips of gold foil glued to its edges, pressed down onto the germanium's surface — the two gold contacts spaced a thousandth of an inch apart. A paper clip would have dwarfed it.",
    15: "Bardeen and Brattain invited a small group of colleagues and managers down to the lab. They connected the device into an audio circuit — a microphone on one end, a loudspeaker on the other. Brattain spoke into the microphone. And the room heard his voice come back out of the speaker, louder. Amplified by a factor of about eighteen. No glass, no filament, no heat. A piece of metal-on-crystal, the size of a paper clip, doing what vacuum tubes had needed the better part of a century to do. They called it a transfer resistor. Within months, they would shorten that to transistor.",
    16: 'Bardeen drove home that evening. He did not make a speech, he did not call a press conference. When his wife Jane asked him how his day had been, he is reported to have said, quote — "we discovered something today." Then he went to bed. The twentieth century had just pivoted in a basement in New Jersey, and the man who did it closed his eyes and went to sleep.',
    17: "William Shockley had not been in the lab on December twenty-third. He had been traveling. When he got back and learned what Bardeen and Brattain had done without him, he was, by every account, furious. He tried to get his name added to the patent application — alone. He argued that the device was built on his theoretical groundwork. Bell Labs' lawyers looked at Shockley's own writings, found them uncomfortably close to a nineteen-twenty-five patent by a German physicist named Julius Lilienfeld, and quietly left Shockley's name off the document entirely.",
    18: "So Shockley got on a train to Chicago, checked into a hotel room, and for four weeks in late December of nineteen forty-seven and January of nineteen forty-eight — the weeks his colleagues were celebrating Christmas and New Year — he filled notebook after notebook, alone, out of pure competitive rage, and designed a completely different kind of transistor. A better one. On January twenty-third, nineteen forty-eight — exactly one month after the basement demo — Shockley had the junction transistor. Layered, like a sandwich. More reliable. Easier to manufacture. The version that would actually power the next fifty years.",
    19: "The team never recovered. Shockley blocked Bardeen and Brattain from the junction work. Brattain asked to be transferred. In nineteen fifty-one, Bardeen quietly left Bell Labs for the University of Illinois — where, twenty-one years later, he would win a second Nobel Prize, this time for superconductivity. The three men who invented the transistor together did not really speak again. Shockley's own story gets darker from here. He'd end his career at Stanford advocating for eugenics — a brilliant physicist who chose, in the end, to be remembered for something ugly. But the device he helped launch was already loose in the world.",
    20: "On June thirtieth, nineteen forty-eight, Bell Labs held a press conference in New York and unveiled the transistor to the world. A Bell spokesman named Ralph Bown held up a hundred-times-scale cutaway model and explained what it did. Most of the press yawned. Newspapers buried it on inside pages. The consumer market had no use for a delicate lab curiosity that cost more than a television set. But there was one customer in the room who understood immediately what it meant. And that customer was also in New Jersey.",
    21: 'Twenty miles down the road, at the U.S. Army Signal Corps Laboratories at Fort Monmouth, the Cold War was already on. The Army needed smaller, lighter, tougher field radios for soldiers — and vacuum tubes couldn\'t cut it. Fort Monmouth became one of the earliest serious customers for the transistor, pouring defense money into Bell Labs and its licensees and, in doing so, de-risking the entire technology. A generation later, the transistorized field radio that came out of that pipeline — the AN/PRC-25 — would be called, by General Creighton Abrams, quote, "the single most important tactical item in Vietnam."',
    22: "You can still walk onto a piece of that story today. The old Signal Corps radar base at Camp Evans, in Wall Township, is now called InfoAge — a volunteer-run museum on the original ground where the Army tracked enemy aircraft and bounced radar off the moon. Inside one of those buildings, under glass, sit some of the earliest transistors the Signal Corps ever bought. Same soil. Same story. Different century. Fort Monmouth didn't just buy the first transistors. Fort Monmouth is about to invent something of its own. But that is the story of episode two.",
    23: "In December of nineteen fifty-six, in Stockholm, William Shockley, John Bardeen, and Walter Brattain shared the Nobel Prize in Physics. It was the first time in years the three of them had stood on the same stage. By most accounts, they did not quite look at each other.",
    24: 'But the more consequential thing that happened to the transistor in nineteen fifty-six was not the Nobel. It was a federal courtroom. AT&T had been fighting a seven-year antitrust case with the Justice Department. To settle it, the company signed a consent decree. That decree forced AT&T to license every patent in its vault — more than seven thousand of them, including the transistor — to any American company that asked, for a nominal fee. Intel co-founder Gordon Moore would later call it, quote, "one of the most important developments for the commercial semiconductor industry." In one signature, the moat around the invention dissolved. Anyone could build a transistor now. And a lot of people were about to.',
    25: "Later in nineteen fifty-six, William Shockley left Bell Labs and moved back to Palo Alto, California — where he had grown up — and founded a company called Shockley Semiconductor Laboratory in Mountain View. His plan was to mass-produce the silicon transistor and get rich. He recruited eight of the sharpest young PhDs in the country to come work for him.",
    26: "He was also, it turned out, one of the worst managers the industry had ever seen — paranoid, combative, given to requiring his employees to submit to lie-detector tests. On September eighteenth, nineteen fifty-seven, eight of them walked into Shockley's office and resigned together. History would call them the Traitorous Eight. Their names: Julius Blank. Victor Grinich. Jean Hoerni. Eugene Kleiner. Jay Last. Gordon Moore. Robert Noyce. Sheldon Roberts. Twelve blocks away, they founded a new company called Fairchild Semiconductor.",
    27: "Eleven years later, in nineteen sixty-eight, two of those eight men — Robert Noyce and Gordon Moore — left Fairchild and started another company. They called it Intel. Eugene Kleiner would later co-found Kleiner Perkins — the venture firm that funded most of what came next. The others seeded AMD, National Semiconductor, and dozens more. Silicon Valley, the place and the culture, did not originate in California. It was a diaspora. The seed that Shockley carried west was germanium dust from a basement laboratory in Murray Hill, New Jersey. Silicon Valley came from Jersey. It just built a better brand.",
    28: "One transistor on a bench in nineteen forty-seven. Today, Apple's M-three Max processor packs about ninety-two billion transistors onto a single chip the size of a postage stamp. The descendants of that device have shrunk by a factor of about a hundred million and gotten roughly a trillion times cheaper. Every phone, every server, every car, every pacemaker, every pixel on every streaming screen on Earth — all of it, all of it, rides on the thing those three men built between November and December of nineteen forty-seven.",
    29: "Moore's Law is, in the end, a seventy-seven-year story of one demonstration compounding.",
    30: "So come back to the ground. The sculpture in Holmdel is still there. The mirrored Bell Works building, once Bell Labs' palace on a hill, is still standing, because a developer named Somerset bought it in twenty-thirteen for twenty-seven million dollars and filled it with startups. And twenty miles south of it, on the same Fort Monmouth soil where the Signal Corps laboratories once bought the first transistors, Netflix is now pouring concrete. A one-billion-dollar, twelve-soundstage East Coast production hub. Phase one opens in twenty-twenty-seven. The ground that made the thing that makes the shows is now making the studio where the shows get made. That is not coincidence. That is how this place works. Every layer of the computer age was built inside a twenty-mile strip of New Jersey — and we are going to walk through all of them, one layer at a time.",
    31: "But a transistor alone is just a switch. It needs something to live on. Next time on The Jersey Stack — the board.",
}

def get_duration(filepath):
    result = subprocess.run(
        ["ffprobe", "-v", "quiet", "-show_entries", "format=duration",
         "-of", "csv=p=0", str(filepath)],
        capture_output=True, text=True
    )
    try:
        return float(result.stdout.strip())
    except:
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
        "voice_settings": VOICE_SETTINGS
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
                    "Accept": "audio/mpeg"
                },
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=60) as resp:
                mp3_data = resp.read()

            # Write temp mp3
            mp3_tmp.write_bytes(mp3_data)

            # Convert to 48kHz 16-bit mono WAV
            result = subprocess.run([
                "ffmpeg", "-y", "-i", str(mp3_tmp),
                "-ar", "48000", "-ac", "1", "-sample_fmt", "s16",
                str(wav_path)
            ], capture_output=True, text=True)

            mp3_tmp.unlink(missing_ok=True)

            if result.returncode != 0:
                print(f" FFMPEG ERROR")
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


def main():
    if not ELEVENLABS_API_KEY:
        print("ERROR: ELEVENLABS_API_KEY not set")
        sys.exit(1)

    NARRATION_DIR.mkdir(parents=True, exist_ok=True)

    results = {}
    failed = []

    print(f"\nGenerating {len([s for s in SCENES.values() if s])} narration WAVs (31 scenes, scene-04 is silent title card)...\n")

    for scene_num in range(1, 32):
        text = SCENES.get(scene_num)

        if text is None:
            # Scene 04: title card beat of silence — generate 0.8s silence WAV
            padded = f"{scene_num:02d}"
            wav_path = NARRATION_DIR / f"scene-{padded}.wav"
            if not wav_path.exists():
                print(f"  Creating: scene-{padded}.wav  (0.8s silence — title card beat)", end="", flush=True)
                result = subprocess.run([
                    "ffmpeg", "-y", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono",
                    "-t", "0.8", "-ar", "48000", "-ac", "1", "-sample_fmt", "s16",
                    str(wav_path)
                ], capture_output=True, text=True)
                if result.returncode == 0:
                    print(" done (silence)")
                    results[scene_num] = 0.8
                else:
                    print(" ERROR")
            else:
                dur = get_duration(wav_path)
                print(f"  SKIP (exists): scene-{padded}.wav  (silence)")
                results[scene_num] = dur or 0.8
            continue

        ok, dur = generate_scene(scene_num, text)
        if ok:
            results[scene_num] = dur
        else:
            failed.append(scene_num)
            results[scene_num] = None

        # Rate limit: small pause between requests
        time.sleep(0.5)

    # Write results JSON for concat step
    results_path = NARRATION_DIR / "generation_results.json"
    results_path.write_text(json.dumps(results, indent=2))

    print(f"\n--- Generation complete ---")
    print(f"Success: {len([v for v in results.values() if v is not None])}/31")
    if failed:
        print(f"FAILED scenes: {failed}")
    total_dur = sum(v for v in results.values() if v)
    print(f"Total narration duration: {total_dur:.1f}s ({total_dur/60:.1f} min)")

    return failed

if __name__ == "__main__":
    main()
