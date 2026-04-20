# Storyboard — The Jersey Stack — Episode 1: The Transistor

> Per-scene production plan. Image source, prompt/asset notes, motion, text overlays, duration, audio, transitions, geography tag.
> Motion styles map to Video Assembler values: `ken-burns-zoom`, `ken-burns-pan`, `gentle-zoom`, `static`, `pillarbox`.
> All scenes crossfade 1s unless noted. Narration premixed over music bed at 15% music volume.
> **Geography tags:** MH = Murray Hill (birthplace), HD = Holmdel (memorial / Bell Works / *Severance*), FM = Fort Monmouth / Camp Evans.
> **Gate 2+ revision (approved):** Series thesis sharpened — specifically the transistor→computer lineage (PCBs become supporting tech, not their own episode). **Ep 2 renamed "The Switch"** (TRADIC / first transistor computer, Bell Labs Whippany NJ, 1954). Chapter 9 consolidated — old Scenes 25 + 26 combined into new Scene 25 ("Shockley Goes West & the Walkout"). All scenes from old #27 onward renumbered down by 1. Thesis line in new Scene 26 preserved verbatim. Targeted narration trims across Ch 2/3/6/8/9/10 pulled runtime from ~16:42 to ~14:45. Scene 30 rewritten to tease amp→switch (new narration + new visual: transistor + sine→square morph, replacing PCB macro).

---

# Chapter 1: Cold Open — "The Severance Hook" (0:00 – 1:30)
> The most important 90 seconds of the series. Drone reveal → Severance recognition → real birthplace pointer → modern montage → title.

## Scene 1: Drone Reveal — Transistor Monument & Bell Works (HD)
- **Duration:** 25s
- **Image source:** creator-provided (drone video, already owned)
- **Asset notes:** Extreme close on Transistor Monument sculpture at Holmdel / Bell Works. Slow 4K pullback revealing Saarinen mirrored rectangle. Magic-hour preferred.
- **Orientation:** landscape (video)
- **Text overlay:** none
- **Motion:** native drone motion (no post zoom)
- **Audio:** narration scene-1 ("You might recognize this building."); ambient synth pad, single sustained note
- **Transition out:** hard cut (to Severance reveal)

## Scene 2: The Severance Reveal (HD / pop culture)
- **Duration:** 25s
- **Image source:** fair-use Severance still/clip (documentary commentary) + archival Holmdel 1960s photo (PD/CC Commons — `Bell_Labs_Holmdel.jpg` era)
- **Asset notes:** Recognizable Lumon atrium still. Cut back to B&W Bell Labs Holmdel circa 1965-70 — parking lot with fin-era cars.
- **Orientation:** landscape
- **Text overlay:** "BELL LABS, HOLMDEL NJ" (lower-third, appears on the archival photo cut)
- **Motion:** static on Severance still (2s); gentle-zoom on archival Holmdel photo
- **Audio:** narration scene-2; single sustained note holds; small synth accent on the Severance cut
- **Transition out:** crossfade 1s

## Scene 3: Modern-Life Transistor Montage (present day)
- **Duration:** 25s
- **Image source:** ai-generated (4 stills) + optional licensed stock
- **Image prompts:**
  - "Modern smartphone held in a hand, vertical composition, glowing screen, shallow DOF, clean studio lighting, cinematic, 16:9 crop"
  - "Interior of a hyperscale data center server room, rows of glowing blue LEDs receding into darkness, wide angle, cinematic cool palette, 16:9"
  - "Netflix home-screen interface displayed on a 4K television in a warm living room, soft rim lighting, photorealistic, 16:9"
  - "Mars rover (Perseverance-class) self-portrait on the rust-orange Martian surface, wide shot, photorealistic NASA-style, 16:9"
- **Orientation:** landscape
- **Text overlay:** none (fast cuts carry themselves)
- **Motion:** gentle-zoom on each still (2% max); cuts ~6s apart
- **Audio:** narration scene-3; music builds — light percussion, forward motion
- **Transition out:** hard cut to black for title card

## Scene 4: Title Card (title)
- **Duration:** 15s
- **Image source:** title-card (built in FFmpeg drawtext / motion template)
- **Asset notes:** Black with subtle noise texture. Main title "THE JERSEY STACK" in heavy serif (HBO-doc weight). Subtitle "EPISODE 1 — THE TRANSISTOR" in lighter sans. Small series mark.
- **Orientation:** landscape
- **Text overlay:** baked into card
- **Motion:** static (alpha fade-in on text)
- **Audio:** beat of silence; music resolves on one sustained note, then drops
- **Transition out:** crossfade 1s

---

# Chapter 2: The Cathedral — "What Bell Labs Actually Was" (1:30 – 3:15)

## Scene 5: Establishing Murray Hill (MH)
- **Duration:** 30s (was 35s — tightened)
- **Image source:** archival (PD/CC) + creator or CC contemporary
- **Assets:**
  - Archival aerial or 1940s exterior of Bell Labs Murray Hill — Gottscho-Schleisner collection (LOC) or AIP Niels Bohr Library aerial
  - Modern Nokia Bell Labs exterior — `Nokia_Bell_Labs_Murray_Hill,_NJ.jpg` or `Nokia_Bell_Labs_sign.jpg` (Commons CC)
- **Orientation:** landscape
- **Text overlay:** "BELL LABS — MURRAY HILL, NJ — c. 1947" lower-third
- **Motion:** ken-burns-zoom (slow push on aerial), then static on the modern exterior
- **Audio:** narration scene-5 (Gate 2 re-record); warm orchestral pad
- **Transition out:** crossfade 1s

## Scene 6: The Monopoly Bet & Kelly (MH)
- **Duration:** 30s (was 35s — tightened)
- **Image source:** motion graphic + archival + PD portrait
- **Assets:**
  - Motion graphic: AT&T → Western Electric → Bell Labs three-tier flow
  - Archival photo of 1940s AT&T telephone switchboard operator (PD)
  - Mervin Kelly portrait — `Mervin_Kelly_Bell_telephone_magazine_(1922).jpg` (PD-US, Commons)
- **Orientation:** landscape
- **Text overlay:** "MERVIN KELLY — DIRECTOR OF RESEARCH, BELL LABS" (on Kelly portrait)
- **Motion:** diagram animation; ken-burns-zoom on switchboard; static with very slow drift on Kelly
- **Audio:** narration scene-6 (Gate 2 re-record); steady curious bed
- **Transition out:** crossfade 1s

## Scene 7: The 700-Foot Corridor (MH)
- **Duration:** 45s (was 35s visual / 66s narration at Gate 2 audio — trimmed narration to land closer to visual budget)
- **Image source:** ai-generated
- **Image prompt:** "Mid-1940s Bell Labs long interior corridor, seven-hundred-foot vanishing-point perspective, men in white shirts and ties walking between laboratory doorways, fluorescent tube lighting, polished linoleum floor, cinematic black-and-white photograph, slight film grain, documentary realism, 16:9"
- **Orientation:** landscape
- **Text overlay:** "THE 700-FOOT CORRIDOR" (3s sting mid-scene)
- **Motion:** ken-burns-zoom — slow dolly forward down the corridor
- **Audio:** narration scene-7 (Gate 2 re-record — trimmed "almost the length of two football fields" kept as "nearly"; removed "inside that building"; tightened Shockley age/solid-state group sentence); warm bed builds
- **Transition out:** crossfade 1s

---

# Chapter 3: The Problem — "Why Vacuum Tubes Had to Die" (3:15 – 4:25)

## Scene 8: The Vacuum Tube Problem (MH era)
- **Duration:** 25s (was 30s — tightened)
- **Image source:** archival stock macro + ai-generated rack
- **Assets:**
  - Macro of a glowing vacuum tube (licensed stock or Commons)
  - AI prompt: "Nineteen-forties telephone amplifier rack, hundreds of glowing vacuum tubes in a dim switching room, orange filaments, archival documentary style, 16:9"
- **Orientation:** landscape
- **Text overlay:** none
- **Motion:** macro handheld (if stock); ken-burns-zoom on rack
- **Audio:** narration scene-8 (Gate 2 re-record — dropped the framing "To understand why Kelly was so obsessed..." sentence and the "cook an egg" / "consumed enormous amounts of power" lines); low-string tension
- **Transition out:** crossfade 1s

## Scene 9: The Semiconductor Idea (diagram)
- **Duration:** 25s (was 30s — tightened)
- **Image source:** 2D motion graphic + ai-generated crystal
- **Assets:**
  - Animated 2D — electrons as blue dots moving through hexagonal lattice, red "hole" gaps
  - AI prompt: "Photorealistic block of germanium crystal rotating slowly, metallic gray with subtle prismatic reflections, black background, macro studio lighting, 16:9"
- **Orientation:** landscape
- **Text overlay:** "ELECTRON" / "HOLE" / "GERMANIUM" minimal labels
- **Motion:** graphic animates; gentle-zoom on crystal
- **Audio:** narration scene-9 (Gate 2 re-record — removed "No one quite knew how." / "in early" shifted to just "in"); curious bed
- **Transition out:** crossfade 1s

## Scene 10: The Wall (MH)
- **Duration:** 20s (narration is only ~9s — music holds the rest)
- **Image source:** archival + ai-generated
- **Assets:**
  - Bell Labs bench photograph — 1948 trio shot `Bardeen_Shockley_Brattain_1948.JPG` cropped wide (PD-US, Commons)
  - AI prompt: "Close-up of a mid-century handwritten physics notebook page, failed equations crossed out in black ink, warm desk-lamp light, cinematic macro, 16:9"
- **Orientation:** landscape
- **Text overlay:** none
- **Motion:** gentle-zoom on bench photo; ken-burns-zoom on notebook
- **Audio:** narration scene-10 (unchanged — no re-record); music pulls back to near silence
- **Transition out:** crossfade 1s

---

# Chapter 4: The Trio — "Three Men in a Basement Lab" (4:25 – 6:10)

## Scene 11: Bardeen (MH)
- **Duration:** 25s
- **Image source:** archival PD portrait + ai-generated lab scene
- **Assets:**
  - `Bardeen.jpg` — 1956 Nobel portrait (PD-Sweden / Nobel Foundation)
  - AI prompt: "1940s theoretical physicist in white shirt and dark tie standing at a blackboard covered in equations, chalk in hand, warm tungsten lighting, quiet concentration, cinematic black-and-white, 16:9"
- **Orientation:** portrait → landscape. **Use pillarbox on the Bardeen portrait.**
- **Text overlay:** "JOHN BARDEEN — THEORIST" (lower-third)
- **Motion:** pillarbox + ken-burns-zoom on portrait; gentle dolly on AI blackboard scene
- **Audio:** narration scene-11 (unchanged — no re-record); gentle contemplative bed
- **Transition out:** crossfade 1s

## Scene 12: Brattain (MH)
- **Duration:** 25s
- **Image source:** archival PD portrait + ai-generated
- **Assets:**
  - `Brattain.jpg` — 1956 Nobel portrait (PD-Sweden)
  - AI prompt: "Close-up of experienced experimentalist hands under warm lab light in a 1940s laboratory, carefully adjusting a needle-probe against a metal surface on a bench, shallow depth of field, cinematic macro, black-and-white, 16:9"
- **Orientation:** portrait → landscape. **Pillarbox the Brattain portrait.**
- **Text overlay:** "WALTER BRATTAIN — EXPERIMENTALIST"
- **Motion:** pillarbox + ken-burns-zoom on portrait; ken-burns-zoom on hands-at-bench
- **Audio:** narration scene-12 (unchanged — no re-record); gentle bed continues
- **Transition out:** crossfade 1s

## Scene 13: Shockley & The Breakthrough Month (MH)
- **Duration:** 55s (was 60s — tightened one sentence)
- **Image source:** archival + ai-generated
- **Assets:**
  - `William_Shockley_1959_lecture_(wh478sd1288).jpg` OR `William_Shockley_blackboard_transistor_(Vd304ks6545).jpg` (Commons, Stanford Archives)
  - AI prompt: "1940s physicist at a wooden desk writing in a leather-bound notebook, page dated NOVEMBER 1947, fountain pen, warm desk-lamp, hand-drawn diagram of a crystal surface with surface-state notation, cinematic black-and-white, 16:9"
- **Orientation:** landscape
- **Text overlay:** "WILLIAM SHOCKLEY — TEAM LEAD" (first 10s), then "BARDEEN'S SURFACE-STATE INSIGHT — NOVEMBER 1947" (next 10s)
- **Motion:** ken-burns-zoom on Shockley lecture photo; gentle-zoom on notebook
- **Audio:** narration scene-13 (Gate 2 re-record — removed "directly into the bulk of the crystal," qualifier to tighten); tension into hope lift
- **Transition out:** slower crossfade 1.5s (chapter weight)

---

# Chapter 5: December 23, 1947 — "The Bench" (6:10 – 7:55)
> EMOTIONAL CENTER. DO NOT RUSH.

## Scene 14: The Setup (MH)
- **Duration:** 30s
- **Image source:** archival PD artifact photo + optional ai-generated reconstruction
- **Assets:**
  - `1st-Transistor.jpg` (Commons, 3264×2448) — photograph of the original artifact. PRIMARY.
  - Backup/alt: `The_First_Transistor_ever_made,_built_in_1947_-_Bell_Labs.jpg` or the Smithsonian NMAH transistor sample (verify CC0 per object)
  - Optional AI reconstruction prompt: "Extreme macro photograph of the 1947 point-contact transistor — polished gray germanium slab the size of a thumbnail, triangular plastic wedge with two narrow gold-foil strips pressed onto the crystal surface, gold contacts spaced one one-thousandth of an inch apart, warm tungsten lab light, black background, shallow depth of field, photorealistic historical reconstruction, 16:9"
- **Orientation:** landscape
- **Text overlay:** "DECEMBER 23, 1947 — BELL LABS, MURRAY HILL, NEW JERSEY" (full scene)
- **Motion:** ken-burns-zoom — very slow push into the gold contacts
- **Audio:** narration scene-14 (unchanged — no re-record); cold minimal — single piano note every 4 beats
- **Transition out:** crossfade 1s

## Scene 15: The Demo (MH) — HERO SCENE
- **Duration:** 40s
- **Image source:** ai-generated (HERO SCENE — generate multiple variants)
- **Image prompt:** "1940s Bell Labs basement laboratory, afternoon light, a small group of men in ties and white lab coats gathered around a wooden bench, Walter Brattain at the controls, oscilloscope screen glowing green in foreground, wiring and test equipment, warm tungsten light, documentary cinematic, black-and-white with subtle warm tint, 16:9. Historical realism — do not stylize."
- **Orientation:** landscape
- **Text overlay:** "POWER GAIN: ~18x" (stings on at the amplification beat, 4s)
- **Motion:** ken-burns-zoom — slow push toward the group
- **Audio:** narration scene-15 (unchanged — no re-record); single sustained note holds. **SFX:** soft tone swell at the "amplified" beat — the audible payoff.
- **Transition out:** crossfade 1s

## Scene 16: Bardeen Goes Home (domestic)
- **Duration:** 35s
- **Image source:** ai-generated (two shots)
- **Image prompts:**
  - "Exterior of a modest 1940s post-war New Jersey colonial house at dusk, light snow on the lawn, warm yellow light glowing from the kitchen window, quiet suburban street, cinematic painterly, 16:9"
  - "1940s American kitchen interior — a quiet middle-aged physicist in a cardigan sitting at a wooden kitchen table, his wife standing pouring coffee, warm lamplight, domestic and understated, cinematic black-and-white with warm tint, 16:9"
- **Orientation:** landscape
- **Text overlay:** handwritten-style end-of-scene: "'We discovered something today.' — John Bardeen"
- **Motion:** gentle-zoom on exterior; ken-burns-zoom pushing in on Bardeen at table
- **Audio:** narration scene-16 (unchanged — no re-record); music resolves warm and quiet
- **Transition out:** fade to black 1.5s — brief silence before Chapter 6

---

# Chapter 6: The Fracture — "Shockley's Hotel Room" (7:55 – 9:05)

## Scene 17: Shockley Finds Out (MH → Chicago)
- **Duration:** 30s (was 25s visual / 36s narration at Gate 2; trimmed one sentence)
- **Image source:** archival + ai-generated
- **Assets:**
  - Shockley portrait (cooler grade applied)
  - AI prompt: "1940s man pacing a dim hotel room, cigarette in hand, papers scattered on an unmade bed, visible tension in body language, cinematic black-and-white, film-noir lighting, 16:9"
- **Orientation:** landscape
- **Text overlay:** none
- **Motion:** ken-burns-zoom on portrait; gentle pan on hotel scene
- **Audio:** narration scene-17 (Gate 2 re-record — dropped "He argued that the device was built on his theoretical groundwork." sentence); low strings darker
- **Transition out:** crossfade 1s

## Scene 18: Four Weeks in Chicago (Chicago)
- **Duration:** 25s (was 25s visual / 43s narration at Gate 2; tightened "the weeks his colleagues were celebrating" phrasing)
- **Image source:** ai-generated (2 shots)
- **Image prompts:**
  - "1940s Chicago hotel room at night, winter snow visible through a tall window, a lone physicist at a wooden desk covered in notebook pages and hand-drawn circuit diagrams, banker's lamp, cigarette smoke curling in warm light, cinematic melancholy obsession, 16:9"
  - "Macro close-up of a hand-drawn 1948 junction transistor diagram in a physics notebook, layered sandwich structure labeled N-P-N, fountain-pen ink, warm desk lamp, cinematic, 16:9"
- **Orientation:** landscape
- **Text overlay:** "CHICAGO — DEC 1947 / JAN 1948" (first); "THE JUNCTION TRANSISTOR — JAN 23, 1948" (second)
- **Motion:** ken-burns-zoom on both
- **Audio:** narration scene-18 (Gate 2 re-record — compressed "late December of nineteen forty-seven and January of nineteen forty-eight" to "four weeks — while his colleagues celebrated Christmas and New Year"); music builds obsessive
- **Transition out:** crossfade 1s

## Scene 19: The Team Breaks (MH)
- **Duration:** 15s visual / narration holds ~42s — extend visual hold
- **Image source:** archival portraits composite
- **Asset notes:** Three PD portraits side-by-side on black. Animation: Bardeen slides left and dissolves, Brattain slides right and dissolves, Shockley holds center — then Shockley fades too on the closing line. Shockley 1975 Stanford photo can briefly intercut on the eugenics line (creator discretion).
- **Orientation:** landscape
- **Text overlay:** "1951 — BARDEEN LEAVES BELL LABS"
- **Motion:** custom composite animation in assembly
- **Audio:** narration scene-19 (unchanged — no re-record; single eugenics sentence locked); minor resigned bed
- **Transition out:** crossfade 1s

---

# Chapter 7: The Announcement & The Cold War Customer (9:05 – 10:30)

## Scene 20: The June 1948 Press Conference (MH / NYC)
- **Duration:** 30s
- **Image source:** ai-generated
- **Image prompt:** "Nineteen forty-eight Bell Labs press conference, New York City — a tall man in a dark suit (Ralph Bown) standing at a podium holding a hundred-times-scale cutaway model of a point-contact transistor up to news photographers, flashbulbs popping, rows of seated reporters with notepads, black-and-white documentary photograph, cinematic historical realism, 16:9"
- **Orientation:** landscape
- **Text overlay:** "BELL LABS PRESS CONFERENCE — JUNE 30, 1948 — NEW YORK"
- **Motion:** ken-burns-zoom — push in on the cutaway model
- **Audio:** narration scene-20 (unchanged — no re-record); brief mid-century brass newsreel motif
- **Transition out:** crossfade 1s

## Scene 21: Fort Monmouth & the 20-Mile Line (MH → FM)
- **Duration:** 25s
- **Image source:** motion graphic + archival PD
- **Assets:**
  - Map animation: NJ satellite, pin drops Murray Hill, line draws south to Fort Monmouth, "20 MILES" label
  - `Signal_Corps_Center,_Fort_Monmouth_NJ_1949.jpg` (Commons PD)
  - AI hero prompt: "Hero product photograph of an AN/PRC-25 military tactical radio, olive-drab, 1960s vintage, studio black background, dramatic side lighting, 16:9" (Commons PRC-25 images also viable)
- **Orientation:** landscape
- **Text overlay:** "U.S. ARMY SIGNAL CORPS LABORATORIES — FORT MONMOUTH, NJ"; then "'THE SINGLE MOST IMPORTANT TACTICAL ITEM IN VIETNAM' — GEN. CREIGHTON ABRAMS"
- **Motion:** map animates; ken-burns-zoom on Signal Corps photo; ken-burns-zoom on PRC-25
- **Audio:** narration scene-21 (Gate 2 re-record — dropped "for soldiers" phrase); steady bed
- **Transition out:** crossfade 1s

## Scene 22: InfoAge at Camp Evans (creator callback) (FM)
- **Duration:** 30s
- **Image source:** **creator-provided** (Nick is a volunteer at InfoAge)
- **Asset notes:**
  - Creator photograph — InfoAge Marconi-era buildings exterior (Camp Evans, Wall Township)
  - Creator photograph — transistor artifacts on display at InfoAge (confirmed on site)
  - Optional creator drone footage of Camp Evans historic district (airspace permitting)
  - Fallback: `Project_Diana_antenna.jpg` (Commons PD) as supporting texture
- **Orientation:** landscape (creator photos; pillarbox any portraits)
- **Text overlay:** "INFOAGE SCIENCE & HISTORY MUSEUMS — CAMP EVANS — WALL TOWNSHIP, NJ" lower-third
- **Motion:** ken-burns-zoom on exterior; static with gentle drift on artifact display macro
- **Audio:** narration scene-22 (unchanged — no re-record); music warms — quiet pride note
- **Transition out:** crossfade 1s

---

# Chapter 8: 1956 — "The Nobel and the Decree" (10:30 – 11:25)

## Scene 23: Nobel (Stockholm)
- **Duration:** 25s
- **Image source:** archival PD portraits (triptych)
- **Asset notes:** Three Nobel PD portraits — `Shockley.jpg` (if available), `Bardeen.jpg`, `Brattain.jpg` — arranged as triptych with Stockholm 1956 date stamp.
- **Orientation:** portraits composited landscape
- **Text overlay:** "NOBEL PRIZE IN PHYSICS — STOCKHOLM — DECEMBER 1956"
- **Motion:** ken-burns-zoom — slow push across the triptych
- **Audio:** narration scene-23 (unchanged — no re-record); restrained ceremonial motif
- **Transition out:** crossfade 1s

## Scene 24: The Consent Decree (legal + metaphor)
- **Duration:** 35s (was 25s visual / 50s narration at Gate 2; trimmed narration to ~35s)
- **Image source:** title-card + motion graphic + ai-generated metaphor
- **Assets:**
  - Stylized legal-document treatment: header "UNITED STATES v. WESTERN ELECTRIC — CONSENT DECREE — JANUARY 24, 1956." Key phrases animate in: "7,820 PATENTS", "ALL AMERICAN COMPANIES", "NOMINAL LICENSE FEE"
  - AI metaphor prompt: "Cinematic shot of a large stone dam with huge mechanical gates slowly opening, water rushing through, dramatic sky, wide angle, photorealistic, 16:9"
- **Orientation:** landscape
- **Text overlay:** pull-quote — "'One of the most important developments for the commercial semiconductor industry.' — GORDON MOORE"
- **Motion:** motion graphic animates; ken-burns-zoom on dam
- **Audio:** narration scene-24 (Gate 2 re-record — compressed AT&T/Justice-Department framing; dropped "the more consequential thing" meta-framing into one tight sentence); music swells — turning point
- **Transition out:** hard cut (no crossfade) — energy shift into diaspora

---

# Chapter 9: The Diaspora — "Silicon Valley Came From Jersey" (11:25 – 12:35)
> PAYOFF BEAT. Tightened at Gate 2 — less enumeration, faster transit from Shockley arriving in Mountain View to the Traitorous Eight walkout. Thesis line (new Scene 26) preserved VERBATIM.

## Scene 25: Shockley Goes West & the Walkout (MH → Mountain View) — COMBINED
- **Duration:** 35s (combines old Scenes 25 + 26 — was 25s + 35s = 60s visual budget; new narration ~34s)
- **Image source:** motion graphic + ai-generated + composite
- **Assets:**
  - Map animation — Murray Hill NJ pin → continental arc → Mountain View CA pin
  - AI prompt (Shockley Semi exterior): "Exterior of a 1950s Silicon Valley storefront laboratory, single-story commercial building, plate-glass windows, signage reading 'Shockley Semiconductor Laboratory', palm trees and parked period cars out front, Mountain View California late 1950s, cinematic historical, color photograph with period grade, 16:9"
  - Traitorous Eight composite 4×2 grid — individual PD portraits (Noyce, Moore, Kleiner) + AI-filled 1950s period-accurate headshots for Blank, Grinich, Hoerni, Last, Roberts. AI prompt: "1950s black-and-white portrait photograph of a thirty-something male scientist in a suit and tie, studio lighting, formal employee-file headshot style, mid-century American, photorealistic, 4:5"
  - **Names appear under each portrait** in the composite — the grid carries the enumeration visually so narration can skip it.
  - On date sting "SEPTEMBER 18, 1957", portraits detach from grid and slide out of frame together.
- **Orientation:** landscape composite
- **Text overlay:** "SHOCKLEY SEMICONDUCTOR LABORATORY — MOUNTAIN VIEW, CA — 1956" (first half); names under each portrait; date sting "SEPTEMBER 18, 1957" (second half)
- **Motion:** map animates → ken-burns-zoom on storefront → custom grid composite animation on Traitorous Eight
- **Audio:** narration scene-25 (Gate 2 re-record — NEW narration, combined+trimmed): *"Later that same year, Shockley left Bell Labs and opened Shockley Semiconductor in Mountain View, California. He recruited eight of the sharpest young PhDs in the country. He was also, it turned out, one of the worst managers the industry had ever seen — paranoid, combative, given to requiring his employees to submit to lie-detector tests. On September eighteenth, nineteen fifty-seven, all eight walked into his office and resigned together. History would call them the Traitorous Eight. Twelve blocks away, they founded Fairchild Semiconductor."* Music: travel motif lifts, turns tense, then decisive on the walkout — biggest musical payoff besides the demo scene.
- **Transition out:** crossfade 1s

## Scene 26: The Payoff Beat (map) — was Scene 27
- **Duration:** 35s (was 20s visual / 45s narration at Gate 2; compressed narration ~32s)
- **Image source:** logo sequence + motion graphic
- **Asset notes:**
  - Logo sequence (brief, 4 beats, ~1s each): Fairchild → Intel (1968) → AMD → Kleiner Perkins
  - Satellite map of Silicon Valley pulling back across the continental US until a single pin pulses on Murray Hill, NJ
- **Orientation:** landscape
- **Text overlay:** "FAIRCHILD → INTEL (1968) → AMD → KLEINER PERKINS → THE VALLEY"
- **Motion:** logo sequence cuts; ken-burns-pan (pullback) on satellite
- **Audio:** narration scene-26 (Gate 2 re-record — tightened Noyce/Moore/Kleiner enumeration; **thesis line preserved verbatim: "Silicon Valley came from Jersey. It just built a better brand."**); emotional climax — let the music breathe
- **Transition out:** crossfade 1s

---

# Chapter 10: What It Became — "One to Ninety-Two Billion" (12:35 – 13:15)

## Scene 27: The Count-Up (motion graphic) — was Scene 28
- **Duration:** 25s
- **Image source:** motion graphic + ai-generated chip macro
- **Asset notes:**
  - Counter motion graphic: 1 (1947 point-contact) → 2,300 (Intel 4004, 1971) → ~1.2M (Intel 486, 1989) → ~42M (Pentium 4, 2000) → ~1B (2010) → ~92B (Apple M3 Max, 2023)
  - AI prompt: "Extreme macro of a modern Apple-silicon SoC die, iridescent microscopic circuitry, dramatic studio lighting, photorealistic, 16:9"
- **Orientation:** landscape
- **Text overlay:** counter IS the text; final sting "APPLE M3 MAX — 92,000,000,000"
- **Motion:** counter animates; gentle-zoom on chip macro
- **Audio:** narration scene-27 (Gate 2 re-record — compressed "between November and December of nineteen forty-seven" to "in the winter of nineteen forty-seven"; removed duplicated "all of it, all of it" emphasis); forward-momentum music
- **Transition out:** crossfade 1s

## Scene 28: The Quiet Line (title) — was Scene 29
- **Duration:** 15s
- **Image source:** title-card (FFmpeg drawtext)
- **Asset notes:** Black frame. White serif text fades in, centered.
- **Orientation:** landscape
- **Text overlay:** "77 YEARS. ONE DEMO."
- **Motion:** static (alpha-fade)
- **Audio:** narration scene-28 (unchanged — no re-record); sustained pad
- **Transition out:** slow fade 1.5s

---

# Chapter 11: Closing Bookend — "The Ground Is Still Making Things" (13:15 – 13:45)

## Scene 29: Back to the Drone (HD → FM) — was Scene 30
- **Duration:** 30s
- **Image source:** creator-provided drone + ai-generated / stock construction
- **Asset notes:**
  - Creator Holmdel drone footage (returns to the opening shot, fuller composition)
  - Netflix Fort Monmouth construction — creator b-roll if available; otherwise AI prompt: "Wide cinematic aerial view of a large construction site at dusk, multiple cranes and bulldozers moving earth on a 292-acre parcel, cleared land, distant backdrop of New Jersey suburban trees, early-stage foundations visible, photorealistic, 16:9"
  - **Hold an extra 2s on the final Holmdel frame** before cutting — narration is done, music resolves, the "one layer at a time" line needs to breathe.
- **Orientation:** landscape (video)
- **Text overlay:** "NETFLIX STUDIOS FORT MONMOUTH — $1B — 12 SOUNDSTAGES — PHASE 1A OPENS 2027" (lower-third, 6s on Netflix cut)
- **Motion:** native drone motion; ken-burns-zoom on Netflix stills
- **Audio:** narration scene-29 (unchanged — no re-record; this is the locked closing bookend); opening theme returns, fuller, **resolves fully on the closing line**
- **Transition out:** slow fade 1.5s + brief silence before Ep 2 card

---

# Chapter 12: Outro — "Episode 2 Tease" (13:45 – 13:55)

## Scene 30: Next Episode End Card — was Scene 31
- **Duration:** 10s
- **Image source:** ai-generated + end-card title
- **Asset notes:**
  - AI prompt: "Dramatic hero shot of a single vintage 1950s point-contact transistor in a TO-5 metal can with three protruding wire leads, centered against a deep black background, an oscilloscope screen visible in the soft blurred background showing a sine wave on the left side morphing into a square wave on the right side — the visual metaphor is a continuous analog waveform transitioning into a discrete digital pulse train. Moody dramatic rim lighting on the transistor, warm metallic highlights on the can, cinematic shallow depth of field, photorealistic, 16:9 widescreen aspect ratio, no text or labels anywhere in the image."
  - End card: **"THE JERSEY STACK — EPISODE 2 — THE SWITCH — COMING SOON"** (post-Gate-2 thesis sharpening — PCB-framed title off the table)
- **Orientation:** landscape
- **Text overlay:** **"EPISODE 2 — THE SWITCH"** (animates in on end card)
- **Motion:** slow Ken Burns push on the transistor hero shot, oscilloscope sine→square wave morph animates subtly in the background; static on end card
- **Audio:** narration scene-30 (post-Gate-2 re-record — new amp→switch hook line, tees up Ep 2 "The Switch"); punchy music tag, cuts out clean
- **Transition out:** cut to black — end of episode

---

## Asset Generation Plan

### By source type
| Type | Scenes (new IDs) | Count | Notes |
|---|---|---|---|
| Creator-provided (drone + InfoAge) | 1, 22, 29 | 3 scenes | Holmdel drone; InfoAge exterior + transistor artifacts + optional Camp Evans drone |
| AI-generated stills | 3, 7, 10, 11, 12, 13, 14, 15, 16, 17, 18, 20, 21 (hero), 25 (storefront + 5-to-8 headshots), 27, 29 (fallback Netflix), 30 | ~21 prompts across ~17 scenes | Historical reconstructions, diagrams, hotel, domestic, press conference, chip macro, composite headshots, PCB macros |
| Archival / public domain / CC | 2 (Holmdel B&W), 5 (Murray Hill), 6 (Kelly), 10 (trio bench), 11 (Bardeen), 12 (Brattain), 13 (Shockley), 14 (artifact), 21 (Signal Corps), 23 (Nobel triptych), 25 (individual 3: Noyce/Moore/Kleiner) | ~14 assets | All Commons / PD-US — see research report for direct URLs |
| Fair-use (documentary commentary) | 2 | 1 | *Severance* Lumon still/clip — **LOCKED: USE.** Creator will appeal if YouTube flags |
| Motion graphics / title cards | 4, 6 (partial), 9, 21 (partial), 23, 24, 25 (composite grid), 26, 27, 28, 30 | ~11 | Title card, diagram animations, map animations, grid composite, logo sequence, counter, doc treatment, end card |

### Music plan
- **Cold open:** ambient synth pad → build; synth accent on *Severance* cut
- **Chapters 2–3:** warm orchestral / curious — Kelly / 700-foot corridor / vacuum tube pain
- **Chapter 4:** character-study motif — gentle, contemplative
- **Chapter 5 (the demo):** **BIGGEST musical payoff #1** — cold minimal piano holds, then resolves warm on the kitchen scene
- **Chapter 6:** minor, obsessive — Chicago hotel
- **Chapters 7–8:** building, newsreel brass at the press conference → turning-point swell on the consent decree
- **Chapter 9:** **BIGGEST musical payoff #2** — Traitorous Eight walkout now inside combined Scene 25; let the beat breathe on Scene 26 thesis line
- **Chapter 10:** forward momentum, inspired
- **Chapter 11:** opening theme reprise, fuller — **resolves fully on closing line**
- **Chapter 12 (outro):** punchy tag, cuts out clean
- **Style directive:** documentary-orchestral. Radiolab × Ken Burns.

### Estimated runtime check (Gate 2)
- Sum of narration durations: ~14:45
- Sum of visual slot durations: ~14:10 (unchanged target)
- Narration now lands within one visual handle of the visual budget (was 2:30 over at Gate 2 audio review)
- Target: 12–15 min ✓

### Creator decisions locked (Gate 1 + Gate 2)
1. **Severance clip (Scene 2):** **USE** fair-use clip.
2. **Mervin Kelly visuals (Scene 6, etc.):** **ACCEPT AI fill.**
3. **PRC-6 mention (Scene 21):** **KEEP TIGHT** — no PRC-6. Straight to PRC-25 / Vietnam / Abrams.
4. **Shockley eugenics (Scene 19):** **KEEP** single sentence at end of Chapter 6.
5. **Traitorous Eight:** composite portraits — no Magnum licensing dependency.
6. **Narration voice:** ElevenLabs Josh.
7. **Creator-owned assets confirmed:** Holmdel drone; InfoAge Camp Evans photography.
8. **Season 2 tease REMOVED** (Gate 1) — pilot stands on its own.
9. **Ep 2 title renamed "The Switch"** (post-Gate-2 thesis sharpening — series is specifically transistor→computer; TRADIC, Bell Labs Whippany, 1954).
10. **Chapter 9 thesis line preserved verbatim** (Gate 2): *"Silicon Valley came from Jersey. It just built a better brand."*
