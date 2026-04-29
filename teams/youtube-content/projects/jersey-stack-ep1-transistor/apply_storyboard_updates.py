#!/usr/bin/env python3
"""
Apply the Apr 29 storyboard updates per Nick's notes:

1. Scenes 11/12/13/17 — replace composite image with split halves
   (portrait left, action right). Drop the composite from assets,
   keep any non-composite assets that already existed.

2. Scene 14 — inject a new "December 23, 1947" title card as the first
   asset. Existing point-contact apparatus image becomes the second beat.
   image_path moves to the title card.

3. Scene 25 -> Scene 26 merge — drop scene 25 entirely, fold its content
   into scene 26. New combined narration drops the "Shockley was a
   terrible manager" framing per Nick's note. Assets and visual cues
   from both scenes preserved in the new scene 26.

4. gate_2_note — append a record of the Apr 29 changes.

Backup is taken before edits (storyboard-data.json.bak-pre-claude-edit-*).
"""
from __future__ import annotations
import json
from pathlib import Path

DATA = Path("storyboard-app/storyboard-data.json")

with DATA.open() as f:
    sb = json.load(f)


# --- 1. Image splits for scenes 11/12/13/17 -----------------------------------

split_targets = {
    11: ("scene-11-bardeen-portrait.png",  "scene-11-bardeen-chalkboard.png"),
    12: ("scene-12-brattain-portrait.png", "scene-12-brattain-bench.png"),
    13: ("scene-13-shockley-portrait.png", "scene-13-bardeen-insight.png"),
    17: ("scene-17-shockley-portrait.png", "scene-17-shockley-hotel.png"),
}

for scene in sb["scenes"]:
    sid = scene["id"]
    if sid not in split_targets:
        continue

    portrait, action = split_targets[sid]
    portrait_path = f"assets/images/{portrait}"
    action_path   = f"assets/images/{action}"

    composite_filename = f"scene-{sid}.png"
    kept = [
        a for a in scene.get("assets", [])
        if not a.get("path", "").endswith(f"/{composite_filename}")
    ]

    new_assets = [
        {"order": 0, "path": portrait_path, "type": "image"},
        {"order": 1, "path": action_path,   "type": "image"},
    ]
    for i, a in enumerate(kept, start=2):
        new_assets.append({"order": i, "path": a["path"], "type": a.get("type", "image")})

    scene["assets"] = new_assets
    scene["image_path"] = portrait_path
    scene["notes"] = ""


# --- 2. Scene 14 title card injection -----------------------------------------

for scene in sb["scenes"]:
    if scene["id"] != 14:
        continue
    title_card = "assets/images/scene-14-title-card-dec-23-1947.png"
    apparatus  = "assets/images/scene-14.png"

    existing_extra = [
        a for a in scene.get("assets", [])
        if not a.get("path", "").endswith("/scene-14.png")
    ]

    new_assets = [
        {"order": 0, "path": title_card, "type": "image"},
        {"order": 1, "path": apparatus,  "type": "image"},
    ]
    for i, a in enumerate(existing_extra, start=2):
        new_assets.append({"order": i, "path": a["path"], "type": a.get("type", "image")})

    scene["assets"] = new_assets
    scene["image_path"] = title_card

    visual = scene.get("visual", "")
    if "Title Card" not in visual:
        scene["visual"] = (
            "Open on title card — DECEMBER 23, 1947 / The afternoon before "
            "Christmas Eve — held for ~2s with quiet film-grain bg. "
            "Crossfade to the close-up of the point-contact transistor "
            "apparatus on the bench. " + visual
        )

    prompt = scene.get("image_prompt", "")
    if "title card" not in prompt.lower():
        scene["image_prompt"] = (
            "TITLE CARD (~2s open beat) — black background, cream serif "
            "'DECEMBER 23, 1947' centered with hairline rule and subtitle "
            "'The afternoon before Christmas Eve.' Hold ~2s, then crossfade "
            "to the existing apparatus close-up. " + prompt
        )

    scene["notes"] = ""


# --- 3. Scene 25 -> Scene 26 merge --------------------------------------------

scenes = sb["scenes"]
s25 = next((s for s in scenes if s["id"] == 25), None)
s26 = next((s for s in scenes if s["id"] == 26), None)

if s25 is None:
    raise SystemExit("scene 25 already missing — abort merge")
if s26 is None:
    raise SystemExit("scene 26 missing — abort merge")

merged_narration = (
    "Later that year, Shockley left Bell Labs and opened Shockley Semiconductor "
    "in Mountain View, California. He recruited eight of the sharpest young PhDs "
    "in the country. On September eighteenth, nineteen fifty-seven, all eight "
    "walked into his office and resigned together. History would call them the "
    "Traitorous Eight. Twelve blocks away, they founded Fairchild Semiconductor.\n\n"
    "Eleven years later, in nineteen sixty-eight, two of those eight — Robert "
    "Noyce and Gordon Moore — left Fairchild and started Intel. Eugene Kleiner "
    "co-founded Kleiner Perkins, the venture firm that funded most of what came "
    "next. The others seeded AMD, National Semiconductor, and dozens more.\n\n"
    "Silicon Valley, the place and the culture, did not originate in California. "
    "It was a diaspora. The seed that Shockley carried west was germanium dust "
    "from a basement laboratory in Murray Hill, New Jersey.\n\n"
    "Silicon Valley came from Jersey. It just built a better brand."
)

merged_visual = (
    "Map animation — Murray Hill NJ pin, single line drawn across the continent "
    "to Mountain View CA. Period AI-generated exterior of Shockley Semiconductor "
    "Laboratory storefront. Dissolve to the 4x2 composite grid of the Traitorous "
    "Eight with names below each portrait. Date sting SEPTEMBER 18, 1957 hits and "
    "the eight portraits detach from the grid and slide out of frame together — "
    "carrying the Fairchild beat. Cut to the logo cascade — Fairchild → Intel "
    "(1968) → AMD → Kleiner Perkins. Pan to a satellite view of Silicon Valley, "
    "which slowly pulls back across the continent until the continental U.S. "
    "fills the frame. A single pin pulses on Murray Hill, NJ. Hold on the thesis "
    "line — 'Silicon Valley came from Jersey. It just built a better brand.'"
)

merged_image_prompt = (
    "COMBINED scene (was 25 + 26 — merged 2026-04-29). Sequence: "
    "1) Map animation MH NJ → MV CA. "
    "2) Period AI exterior of Shockley Semiconductor Laboratory storefront, "
    "Mountain View 1956–57, plate-glass windows, palm trees, period cars, 16:9 "
    "color photo with mid-century grade. "
    "3) Composite 4x2 grid — eight 1950s-era portraits (Blank / Grinich / Hoerni / "
    "Kleiner / Last / Moore / Noyce / Roberts) with names below each. "
    "4) Date sting SEPTEMBER 18, 1957 — portraits detach and slide out together. "
    "5) Logo cascade — Fairchild → Intel (1968) → AMD → Kleiner Perkins. "
    "6) Satellite of Silicon Valley pulling back across the continental US until "
    "a single pin pulses on Murray Hill, NJ. "
    "Hold on thesis line. [Mix of motion graphics + AI-generated period imagery; "
    "the grid carries enumeration so narration does not have to list names.]"
)

merged_text_overlay = (
    "SHOCKLEY SEMICONDUCTOR LABORATORY — MOUNTAIN VIEW, CA — 1956; "
    "names under each portrait JULIUS BLANK / VICTOR GRINICH / JEAN HOERNI / "
    "EUGENE KLEINER / JAY LAST / GORDON MOORE / ROBERT NOYCE / C. SHELDON ROBERTS; "
    "date sting SEPTEMBER 18, 1957; logo cards FAIRCHILD → INTEL (1968) → AMD → "
    "KLEINER PERKINS; closing thesis card SILICON VALLEY CAME FROM JERSEY"
)

# Compose merged asset list — preserve scene 25's three assets first (they open
# the scene), then scene 26's two (the closing logo + pullback).
merged_assets = [
    {"order": 0, "path": "assets/images/scene-25.png", "type": "image"},
    {"order": 1, "path": "assets/images/scene-25-traitorous-eight-composite.png", "type": "image"},
    {"order": 2, "path": "assets/images/scene-25-robert-noyce-1959.png", "type": "image"},
    {"order": 3, "path": "assets/images/scene-26-logo-cascade.png", "type": "image"},
    {"order": 4, "path": "assets/images/scene-26-silicon-valley-aerial-1972.png", "type": "image"},
]

# Build the new scene 26 record.
new_s26 = {
    "id": 26,
    "chapter": 9,
    "chapter_title": "The Diaspora",
    "title": "Shockley West → Walkout → The Diaspora — COMBINED (was 25 + 26)",
    "duration": "11:25-12:35 (70s)",
    "audio_status": (
        "RE-RECORD 2026-04-29 — NEW combined scene 25+26 narration. "
        "Dropped 'Shockley was a terrible manager / paranoid / lie-detector tests' "
        "framing per creator note. Walkout beat preserved; thesis line preserved verbatim."
    ),
    "narration": merged_narration,
    "image_prompt": merged_image_prompt,
    "visual": merged_visual,
    "text_overlay": merged_text_overlay,
    "motion": "ken-burns-pan",
    "music": (
        "Travel motif lifts on the MH → CA arc, turns decisive on the walkout, "
        "then opens up wide on the diaspora pullback — the emotional climax of "
        "the thesis. Let the closing line breathe."
    ),
    "transition": "Crossfade 1s",
    "image_path": "assets/images/scene-25.png",
    "assets": merged_assets,
    "notes": "",
}

# Replace scene 26 with the merged record AND drop scene 25.
sb["scenes"] = [s for s in sb["scenes"] if s["id"] != 25 and s["id"] != 26]
sb["scenes"].append(new_s26)
sb["scenes"].sort(key=lambda s: s["id"])


# --- 4. gate_2_note record ----------------------------------------------------

apr29 = (
    " Apr 29 batch: scenes 11/12/13/17 composite images split into separate "
    "portrait + action beats; scene 14 prepended with 'December 23, 1947' title "
    "card; scene 25 merged into scene 26 (eugenics/manager framing dropped, "
    "thesis line preserved). Scene 25 removed; ID gap left intentionally."
)
if "Apr 29" not in sb.get("gate_2_note", ""):
    sb["gate_2_note"] = sb.get("gate_2_note", "") + apr29

sb["date"] = "2026-04-29"


# --- write ---

with DATA.open("w") as f:
    json.dump(sb, f, indent=2, ensure_ascii=False)
    f.write("\n")

print(f"updated {DATA}")
print(f"  scenes now: {len(sb['scenes'])} (expected 27 after scene 25 merge)")
print(f"  scene IDs:  {[s['id'] for s in sb['scenes']]}")
