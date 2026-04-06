#!/usr/bin/env python3
"""Generate narration audio for Batter Up history video using OpenAI TTS API."""

import os
import subprocess
from pathlib import Path
from openai import OpenAI

client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

OUTPUT_DIR = Path("/Users/nickd/Workspaces/AgentArchitect/teams/youtube-content/projects/batter-up-history/audio/narration")

SCENES = {
    2: "Listen. You can hear it from the parking lot. The whir of a pitching machine winding up. The crack of an aluminum bat. Kids laughing, parents coaching from behind the fence. It's a summer evening on Hicksville Road in Bethpage, and Batter Up is doing what it's done for over forty years.",

    3: "But here's the thing most people don't know. This little batting cage -- right here at 130 Hicksville Road -- is the last surviving piece of one of the most legendary amusement parks Long Island has ever seen. A place called Jolly Roger's. And if you grew up on the Island, that name just hit you right in the chest.",

    4: "Our story starts in 1951, with a man named William Nunley. He was a third-generation amusement park entrepreneur -- his family already ran parks in Baldwin, Rockaway Beach, and Yonkers. But William had a bigger vision. He wanted to build the largest Nunley's yet, right here at the corner of Hempstead Turnpike and Hicksville Road. Critics called the location 'virtually deserted.' But Nunley saw what was coming -- Levittown was just down the road, and suburbs were spreading across Long Island like wildfire.",

    5: "Tragically, William Nunley died in April of 1951 -- six months before his dream was finished. His widow Miriam made a decision that would shape Long Island childhoods for a generation. She would open Happyland herself. On October twelfth, nineteen fifty-one, the gates swung open.",

    6: "And what a park it was. A Schiff Ferris wheel and roller coaster. A forty-eight-horse carousel. Bumper cars, hand cars, a miniature railway. Over a hundred arcade games inside a heated indoor pavilion -- this place ran year-round. On a summer Saturday, four thousand kids would pour through those gates.",

    7: "And presiding over it all was a one-of-a-kind treasure: a nineteen-ten German mechanical organ, built by A. Ruth and Sohn of Waldkirch, with elaborately carved musicians that moved in time with the music. There was nothing else like it in America.",

    8: "In nineteen fifty-two, a fast-food restaurant called the Jolly Roger opened right next door, connected to the park by a glass-walled passageway. And here's the thing about names -- the official name was Nunley's Happyland, but nobody called it that. To every kid on Long Island, it was Jolly Roger's. That was the name that stuck for a generation.",

    9: "By the nineteen sixties, new owners -- the Tarnow and Giddens families -- expanded the whole complex. They added a Wild Mouse roller coaster, a dedicated bumper car building, and right across Hicksville Road, they built batting cages and a miniature golf course. That spot, directly across the street -- remember it. That's where our story is heading.",

    10: "For nearly three decades, Jolly Roger's was the place. Birthday parties, first dates, Little League celebrations. If you grew up on Long Island in the fifties, sixties, or seventies, you were there. Everybody was there.",

    11: "But nothing lasts forever. In nineteen seventy-four, the Jolly Roger restaurant changed its name to Robin Hood. By nineteen seventy-six, the restaurant had closed. And in nineteen seventy-eight, nearly three decades after Miriam Nunley first opened those gates, the park shut down for good.",

    12: "In March of nineteen seventy-nine, a photographer named Robert Berkowitz walked through the empty park one last time, capturing haunting images of the rides sitting silent, the buildings waiting for the wrecking ball. Those photographs are some of the only visual records we have of the park's final days.",

    13: "Today, a strip mall stands where Happyland used to be. Not a plaque, not a marker, not a trace. It's gone.",

    14: "But across the street? Across the street, the bats never stopped swinging.",

    15: "In nineteen seventy-nine, just one year after the park closed, the batting cage facility at 130 Hicksville Road was rebuilt and expanded. It was like the place refused to die. And then, in nineteen eighty-four, Nick DeMarco took the reins and named it Batter Up. He built it from the ground up with his family. And they've been running it ever since.",

    16: "Today, Batter Up has eleven fully automatic batting cages throwing baseball and softball at speeds from thirty-five to eighty miles per hour. There's an eighteen-hole mini golf course right alongside. It's not fancy. It's not a chain. It's a family business on a piece of land that's been making families happy since the nineteen sixties. Forty-plus years of DeMarco family ownership, and they're still going strong.",

    17: "Think about that for a second. Three generations of Long Islanders have stepped up to those cages. Grandparents who rode the Ferris wheel at Jolly Roger's bring their grandkids here to hit. The corner of Hicksville Road and Hempstead Turnpike has been in the business of making families smile since nineteen fifty-one. Seventy-five years and counting.",

    18: "Now, there is one other piece of the Nunley's story that survived. The family's famous carousel from their Baldwin location was rescued and restored -- you can ride it today at the Long Island Children's Museum in Garden City. But that carousel was moved. It was saved and relocated. Batter Up? Batter Up never left. It's been right here, on its original ground, since the beginning.",

    19: "Online, thousands of Long Islanders keep the memory alive. The Facebook group 'Remembering Nunley's and Jolly Roger's' is packed with stories, old photos, and that one question that comes up again and again: 'Remember Jolly Roger's?' Yeah. We remember.",

    20: "So next time you're driving down Hicksville Road in Bethpage, pull over. Grab a helmet. Step into one of those cages at Batter Up, and take a swing. Because you won't just be hitting a baseball. You'll be standing on seventy-five years of Long Island history. And that history? It's still alive.",
}


def get_duration(wav_path: Path) -> float:
    """Get duration of a wav file in seconds using ffprobe."""
    result = subprocess.run(
        [
            "ffprobe", "-v", "quiet",
            "-show_entries", "format=duration",
            "-of", "csv=p=0",
            str(wav_path),
        ],
        capture_output=True,
        text=True,
    )
    return float(result.stdout.strip())


def main():
    durations = {}
    total = 0.0

    for scene_num in sorted(SCENES.keys()):
        text = SCENES[scene_num]
        output_path = OUTPUT_DIR / f"scene-{scene_num:02d}.wav"

        print(f"Generating scene {scene_num:02d}...", flush=True)

        response = client.audio.speech.create(
            model="tts-1-hd",
            voice="onyx",
            input=text,
            response_format="wav",
            speed=1.0,
        )

        response.stream_to_file(str(output_path))

        duration = get_duration(output_path)
        durations[scene_num] = duration
        total += duration
        print(f"  scene-{scene_num:02d}.wav -> {duration:.2f}s", flush=True)

    print("\n--- Summary ---")
    for scene_num in sorted(durations.keys()):
        print(f"  scene-{scene_num:02d}.wav: {durations[scene_num]:.2f}s")
    print(f"\nTotal narration duration: {total:.2f}s ({total/60:.1f} min)")


if __name__ == "__main__":
    main()
