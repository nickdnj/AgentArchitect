# Storyboard — "The Message in the Machine"

**A first-person docent story from the Vintage Computer Museum at InfoAge (Wall Township, NJ)**

- **Total runtime:** HeyGen live-intro (**Segment 1 only**) + the animated story body (**Segments 2–7**). The animated body reuses the existing Nick-2 audio for Segments 2–7 (former pages 4–35); only **Segment 1** audio is fronted by the live HeyGen intro. Body in/out times below re-time once Segment 1 is lifted out of the timeline (everything shifts ~0:38 earlier) and once the HeyGen length + museum footage land.
- **Pages:** **1 live Docent intro** (Segment 1 — museum / visitor / "the Donkey Kong story" + the hand-off to 1981) **+ animated story body P4–P35** (Segments 2 → close). Former pages 1–3 ARE the live intro; **pages 4–12 are storybook animation** (not cut).
- **HARD per-page rule:** every page is on screen **between 10.0s and 15.0s** — no page under 10s, no page over 15s. Adjacent narration beats are merged onto one image to reach ≥10s and split before 15s. Where a clean sentence break and the 10–15s window conflicted, the window won (a few pages carry a partial sentence).
- **Narration source of truth:** `teams/podcast-studio/projects/donkey-kong-infoage/` (script.md + assets/audio/episode-vo.mp3 + durations.json). This video reuses that finished VO — no new narration.
- **Visual style:** warm, personal, nostalgic documentary. Two worlds: **1981 smoky Massapequa basement** (tungsten, grain, cigarette haze, TRS-80 + CRT glow + PROM programmer + jumper wires) and **present-day InfoAge** (old radar-building interior, rows of vintage computers, docent POV). No baked-in clickbait text.

> **Timing note (v17):** Page durations come directly from the `_post_atempo` keys in `durations.json` — the real as-heard durations on `episode-vo.mp3` (no 1.06x rescaling). Segment 5 gained a sixth spoken line and was re-rendered (post-atempo **62.01s**, was 60.32s); Segments 1–4, 6, 7 audio is unchanged and reused. Pages **P1–P22 are frozen** from the prior cut; **P23–P35** were re-paged for the new Seg 5 and the new total. New total = 424.77s (7:04.8).

**Legend:** Each page = one image · **Time** = in–out (duration) on the final audio · **image:** stable asset filename hint for the assembler (`assets/images/generated/` or `assets/images/real/`) · **Motion** = camera move · **On-screen text** = burned-in text (only where noted) · pages marked **(transition)** carry narration that crosses a script-segment boundary.

---

## v2 Production Direction (2026-06-30) — READ FIRST

Moving from the v1 photoreal cut to a **v2 animated cut**:

- **Style: WARM STORYBOOK** (locked 2026-06-30). Soft gouache/watercolor, tender, hand-illustrated. The whole animated body gets re-generated in this style (replacing v1 photoreal images). Character designs locked from Nick's real photos — see `style-test.md` (Dad + Teen Nick sheets). Keep a touch more contrast on the reveal/lawsuit beats so they don't go soft.
- **Live / HeyGen INTRO** (NEW — see Page 1 below) = **Segment 1 only**, the docent framing. It **opens on Nick on camera**, then **his face fades out while his voice keeps going** (he becomes VO), opening onto real InfoAge/TRS-80 B-roll and then the painted 1981 world. The voice runs **unbroken** across the fade — best achieved by feeding HeyGen the existing Nick-2 `seg-01-intro.wav` so the whole film is one continuous Nick-2 voice. The intro ends on **"…take you back to a smoky basement in Massapequa, in 1981,"** by which point the picture is already animation and the voice flows straight into **Segment 2** ("In the 80's…", Page 4). **The entire story Nick tells — Segments 2–7, former pages 4–35 — is storybook animation.** So: Nick-the-docent frames it on camera, then the story itself is animation.
- **NO live outro.** The close stays fully animated (no cut back to Nick on camera).
- **Audience: VCF / InfoAge museum. The TRS-80 is the real star** — feature it throughout, especially in the close.
- **Real footage to weave in (Nick shooting ~2026-07-01):** real shots of the **TRS-80 in place at the InfoAge museum** + walk-around → weave into the close (Pages 33–34) and possibly live-intro B-roll. Plus **new InfoAge images from Doug's just-published handout** for the museum/present-day beats — these replace/augment the AI museum shots. → **SAVED** to `assets/images/real/infoage-handout/` (9 photos extracted from the rack-card PDF; standouts: `infoage-computer-history-exhibit.png` ⭐, `infoage-univac-navy-missile-computer.png`, `infoage-apollo-guidance-computer.png`, `infoage-space-exhibit-docent-visitor.png`). Wired into the close — see Pages 32–35. Native res ~1000–1370px wide (good with motion / as montage inserts; Nick's on-site shoot remains the full-res hero for the TRS-80). **Closing card (P35) = InfoAge's signature antenna shot + the pamphlet location map + a scan-for-directions QR (Google Maps → 2201 Marconi Rd)** as a "come visit" CTA, per Nick.
- **Timing:** the live-intro duration is now HeyGen-dependent (not the Nick-2 Segment-1 audio), and real footage is pending — so the Page 5+ timings below still reflect the v1 Nick-2 audio and will be re-timed once the HeyGen intro length + museum footage land.

---

## Summary table

| Pg | Seg | In–Out | Dur | Image (one) | Narration first words |
|----|-----|--------|-----|-------------|----------------------|
| **1** | **1** | **LIVE (HeyGen)** | **TBD** | 🎬 **LIVE DOCENT INTRO** — Nick on camera, fading to VO over InfoAge/TRS-80 B-roll *(replaces former pages 1–3)* | "Hi, my name is Nick…" → docent setup + "…take you back to 1981" (Segment 1; script on Page 1) |
| 4 | 2 | *(re-time)* | 13.0 | 🖌 Early-80s arcades — bar / bowling alley | "In the 80's, arcade games filled the bars…" |
| 5 | 2 | *(re-time)* | 12.5 | 🖌 Home basement arcade, Nick standing aside | "But the best arcade I knew…" |
| 6 | 2 | *(re-time)* | 14.5 | 🖌 Dad repairing a machine, its guts exposed | "I loved the machines…" |
| 7 | 2 | *(re-time)* | 11.0 | 🖌 Dad at the TRS-80 writing the business system | "But he didn't stop at fixing…" |
| 8 | 2 | *(re-time)* | 12.5 | 🖌 Dad's focused face lit by the TRS-80 | "The same machine I'd eventually take…" |
| 9 | 2→3 | *(re-time)* | 13.0 | 🖌 TRS-80 wired to a PROM programmer + chips | "is the one he'd turn on the games…" |
| 10 | 3 | *(re-time)* | 14.5 | 🖌 Monochrome screen of scrambled nonsense | "So they protected them…" |
| 11 | 3 | *(re-time)* | 14.0 | 🖌 Moody back-room of copied boards (bootlegging) | "Sure, there was a business reason…" |
| 12 | 3→4 | *(re-time)* | 11.0 | 🖌 Present-day ROM-preservation / MAME montage | "Today, we call it reverse engineering…" |
| 13 | 4 | *(re-time)* | 10.5 | 🖌 Smoky 1981 basement office, CRT glow through haze | "And I come down the stairs…" |
| 14 | 4 | 02:45.0–02:58.0 | 13.0 | Over-the-shoulder: TRS-80 + programmer + DK chip | "We're staring at the screen…" |
| 15 | 4 | 02:58.0–03:08.5 | 10.5 | Donkey Kong cabinet, 1981 (ape + red-hat guy) | "Donkey Kong was the new hot game…" |
| 16 | 4 | 03:08.5–03:20.0 | 11.5 | Programmer reading the chip / scrambled addresses | "Pulling the raw data off the chip…" |
| 17 | 4 | 03:20.0–03:32.5 | 12.5 | Hands placing jumper wires, notebook of attempts | "So he'd done it by hand…" |
| 18 | 4 | 03:32.5–03:42.5 | 10.0 | Scramble resolves into orderly hex columns | "And then, finally, it revealed…" |
| 19 | 4 | 03:42.5–03:55.5 | 13.0 | Full hex dump, hex columns + right column hinted | "Down the left, and through the middle…" |
| 20 | 4 | 03:55.5–04:06.0 | 10.5 | Hex dump, right ASCII column highlighted, fragments | "It takes those same raw bytes…" |
| 21 | 4 | 04:06.0–04:16.5 | 10.5 | ASCII column scrolling, broken English emerging | "A stray character here…" |
| 22 | 4 | 04:16.5–04:27.0 | 10.5 | THE REMEMBERED MESSAGE on screen | "An actual sentence…" |
| 23 | 4→5 | 04:27.0–04:41.0 | 14.0 | 16-year-old Nick lit by the CRT → "forty years" | "I'm sixteen years old…" |
| 24 | 5 | 04:41.0–04:51.5 | 10.5 | Nick researching at home, late night | "But after that visitor left…" |
| 25 | 5 | 04:51.5–05:02.5 | 11.0 | Ikegami Tsushinki engineers, 1981 Tokyo | "Donkey Kong is a Nintendo game…" |
| 26 | 5 | 05:02.5–05:13.5 | 11.0 | Hidden note buried in the program code | "They were the shadow developer…" |
| 27 | 5 | 05:13.5–05:23.5 | 10.0 | THE REAL IKEGAMI ROM MESSAGE on screen | "The real message read…" |
| 28 | 5 | 05:23.5–05:37.0 | 13.5 | Bootlegger mid-copy reaches for the phone to call Tokyo | "It was a note to a stranger…" |
| 29 | 6 | 05:37.0–05:48.0 | 11.0 | Nintendo copying the code without Ikegami | "But there's one more piece…" |
| 30 | 6 | 05:48.0–06:01.0 | 13.0 | Japanese courtroom + ROM chips as evidence | "So they could keep cranking out…" |
| 31 | 6 | 06:01.0–06:12.5 | 11.5 | ROM chips — the hidden message as the key clue | "The battle over who really created…" |
| 32 | 6→7 | 06:12.5–06:24.0 | 11.5 | Docent + visitor in the radar building | "So that's the story I told that visitor…" |
| 33 | 7 | 06:24.0–06:36.5 | 12.5 | The actual TRS-80 in the InfoAge collection | "I see the engineers who built them…" |
| 34 | 7 | 06:36.5–06:51.0 | 14.5 | Father at the desk in smoke → museum overlay | "Every time I walk past it…" |
| 35 | 7 | 06:51.0–07:04.8 | 13.8 | Closing card — InfoAge, "come find yours" | "Not just old machines…" |

---

## Detailed pages

### Page 1 — LIVE / HeyGen DOCENT INTRO  *(on-camera → VO; Segment 1 only; REPLACES former pages 1–3)*

> **Page numbering:** the deck jumps **Page 1 → Page 4** on purpose. Page 1 is the live docent intro (Segment 1). The animated story body keeps its original IDs **P4–P35** so they still match the image asset filenames (`p04-…`–`p35-…`) and the assembly manifest. There is no separate page 2 or 3 — that narration lives in the live intro.

- **Format:** Live-action Nick via a **HeyGen** avatar. **Opens ON Nick** in the gallery (establish the docent), then **his face fades out while his voice keeps going** — he becomes voiceover — and we **open onto imagery**: real **InfoAge / TRS-80 B-roll** under the museum lines, settling into the painted **storybook** world as he hands off to 1981. The on-camera face is only the opening; the rest of the intro is VO over visuals.
- **Voice continuity (IMPORTANT — per Nick):** the voice must run **unbroken** across the face-to-image fade and on into the animation. Cleanest way to guarantee it: **feed HeyGen the existing Nick-2 `seg-01-intro.wav`** and let HeyGen lip-sync the avatar to that audio — then the ENTIRE film is one continuous Nick-2 voice (intro + animation), and the fade only changes the picture, never the voice. (Alternative: HeyGen's own TTS for the intro — but then the intro voice ≠ the Segment-2+ Nick-2 voice. Avoid.)
- **Fade-to-animation:** the live intro carries **all of Segment 1**, ending on **"…take you back to a smoky basement in Massapequa, on Long Island in 1981."** His face fades off earlier (over the B-roll); by **"…in 1981"** the picture is already the painted basement and the voice flows straight into **Segment 2** (Page 4) with no seam. Ending Segment 1 here lands the voice hand-off on the `seg-01`/`seg-02` audio boundary — no WAV splitting.
- **On-screen text:** none (live open). Lower-third name/title optional.

> **RAW NARRATION SCRIPT — feed this to HeyGen** (Segment 1; ideally upload `seg-01-intro.wav` as the lip-sync audio. Clean, no stage directions):
>
> Hi, my name is Nick. I'm a docent here at the Vintage Computer Museum at InfoAge, in Wall Township, New Jersey.
>
> The other day, a visitor came in. Turns out he was a big gamer, involved with the MAME project, preserving arcade games by pulling the code off the original machines before the hardware's gone for good.
>
> And I said, oh, that's interesting. I grew up in that world. My family owned and operated arcade games.
>
> And he says, oh, that's really cool. I bet you've got some great stories.
>
> And that's where I stopped for a second. Out of all the memories I could've reached for, one came rushing back almost right away. The Donkey Kong story.
>
> But to tell it right, I have to take you back to a smokey basement in Massapequa, on Long Island in 1981.

*(On "…in 1981," the picture is already the painted 1981 basement and Nick's voice continues unbroken into the animation. His face has faded out earlier, over the museum B-roll. **The animated story body — Segments 2–7 — begins on Page 4.**)*

---

## Animated story body — Segments 2–7 (storybook)

> All pages below are **storybook animation** (re-styled from the v1 photoreal images — see `style-test.md`). In/out times are pending a re-time (Segment 1 is now the live intro, so the whole body shifts earlier).

### Page 04 — [Segment 2: Sand Hill Vending]  *(animation opens here)*
- **Time:** *(re-time — body shifts earlier once Segment 1 leaves the timeline)*
- **image:** generated/p04-80s-arcade-bar.png  *(restyle → storybook)*
- **Narration:** "In the 80's, arcade games filled the bars, the bowling alleys, the pizza joints, everywhere people went to have fun." *(The opening line — "But to tell it right… in 1981" — is delivered in the live intro as the fade-to-animation hand-off, not here.)*
- **Image (one):** A lively early-80s public space (bar / bowling alley / pizzeria) with arcade cabinets along the wall, people playing — the games-everywhere era.
- **AI image prompt:** "Grainy early-1980s photograph of a bowling alley snack bar with a row of arcade cabinets along the wall, neon beer signs, people in period clothing playing games, warm tungsten and neon light, nostalgic Americana, film grain, 16:9, no text."
- **Motion:** Slow pan L→R
- **On-screen text:** none
- **Source/asset note:** AI-generated.

### Page 05 — [Segment 2: Sand Hill Vending]
- **Time:** 00:51.5 – 01:04.0  (12.5s)
- **image:** generated/p05-home-arcade-basement.png  *(existing)*
- **Narration:** "But the best arcade I knew was my own house. Free play, all day, friends always over. Here's the strange part, though. I was rarely the one playing. When games are your work, you stop being a player."
- **Image (one):** A home basement full of arcade machines, friends playing — and one boy (Nick) standing slightly apart, watching rather than playing.
- **AI image prompt:** "1980s suburban basement converted into a private arcade, several cabinets glowing, teenage friends gathered playing, one boy standing apart near a machine watching thoughtfully, warm tungsten light, wood paneling, film grain, nostalgic documentary, 16:9, no text."
- **Motion:** Slow push-in
- **On-screen text:** none
- **Source/asset note:** PREFER REAL PHOTO — a genuine Sand Hill Vending / family arcade photo would be far stronger than AI.

### Page 06 — [Segment 2: Sand Hill Vending]
- **Time:** 01:04.0 – 01:18.5  (14.5s)
- **image:** generated/p06-dad-repair-bench-guts.png
- **Narration:** "I loved the machines, what made them tick, what was hiding inside. Playing them? That was never really my thing. My dad fixed everything. If something broke, he didn't replace it. He figured out how it worked... and then he fixed it himself."
- **Image (one):** Nick's father at a cluttered workbench repairing an arcade machine with its back panel off and guts exposed, a young Nick peering at the boards inside.
- **AI image prompt:** "Early 1980s electronics workbench, a focused middle-aged man repairing an arcade machine with the back panel removed to reveal circuit boards and wiring, a curious teenage boy leaning in to look at the internals, soldering iron with a wisp of smoke, warm work-lamp light, film grain, intimate documentary, 16:9, no text."
- **Motion:** Slow pan across the bench
- **On-screen text:** none
- **Source/asset note:** AI-generated.

### Page 07 — [Segment 2: Sand Hill Vending]
- **Time:** 01:18.5 – 01:29.5  (11.0s)
- **image:** generated/p07-dad-trs80-business.png
- **Narration:** "But he didn't stop at fixing. He taught himself to program on a TRS-80, the old Radio Shack computer, and wrote the whole system that ran the business. From scratch. Self-taught. All of it."
- **Image (one):** Nick's father seated at a TRS-80, typing, business ledgers beside the keyboard.
- **AI image prompt:** "Early 1980s home office, a man seated at a TRS-80 microcomputer (Radio Shack, beige/silver case, chunky keyboard, small CRT), typing code, monochrome text on screen, business ledgers and invoices stacked beside it, warm tungsten desk lamp, cigarette in ashtray, film grain, period-accurate, 16:9, no text."
- **Motion:** Slow push-in toward the screen
- **On-screen text:** none
- **Source/asset note:** PREFER REAL PHOTO — a genuine family photo of Nick's dad at the TRS-80 would be the emotional anchor of this segment.

### Page 08 — [Segment 2: Sand Hill Vending]
- **Time:** 01:29.5 – 01:42.0  (12.5s)
- **image:** generated/p08-dad-face-trs80-glow.png
- **Narration:** "The same machine I'd eventually take to college a few years later. He had the kind of mind that had to know exactly how a thing worked. All the way down. And that same machine, the one running the business,"
- **Image (one):** A close, intent portrait of Nick's father lit by the TRS-80's glow — the mind that had to know how everything worked.
- **AI image prompt:** "Intimate close portrait of a focused middle-aged man in the early 1980s, deep concentration, face lit by the glow of a TRS-80 monitor, wisp of cigarette smoke, warm shadows, film grain, documentary character study, 16:9, no text."
- **Motion:** Slow push-in
- **On-screen text:** none
- **Source/asset note:** AI-generated; a real photo of his father would be stronger.

### Page 09 — [Segment 2→3: Sand Hill → What They Were Hiding]  *(transition)*
- **Time:** 01:42.0 – 01:55.0  (13.0s)
- **image:** generated/p09-trs80-programmer-chips.png
- **Narration:** "is the one he'd turn on the games themselves. Which brings me to the chips. Arcade games lived on memory chips. And those chips were the crown jewels. Manufacturers didn't want anyone copying them."
- **Image (one):** The TRS-80 connected by ribbon cable to a PROM programmer, with memory chips laid out on the bench like crown jewels.
- **AI image prompt:** "Early 1980s workbench: a TRS-80 connected via ribbon cable to a PROM/EPROM programmer, several vintage memory chips with gold pins laid out beside it lit like precious jewels, warm focused work light, shallow depth of field on the chips, film grain, documentary, 16:9, no text."
- **Motion:** Slow pan ending on the chips
- **On-screen text:** none
- **Source/asset note:** AI-generated.

### Page 10 — [Segment 3: What They Were Hiding]
- **Time:** 01:55.0 – 02:09.5  (14.5s)
- **image:** generated/p10-scrambled-nonsense-screen.png
- **Narration:** "So they protected them. One trick was to scramble the data before it was burned into the chip. Read it with a programmer, and what came back looked like nonsense. Unless you could figure out how to put it back together. And that's what fascinated my father."
- **Image (one):** A monochrome screen of scrambled, meaningless data beside a chip in a programmer socket; faint reflection of an intrigued face.
- **AI image prompt:** "A vintage monochrome monitor displaying scrambled, meaningless rows of hexadecimal and random characters, an EPROM chip in a programmer's ZIF socket in the foreground, a faint reflection of an intrigued man's face in the glass, green/amber phosphor glow, dark room, film grain, technical documentary, 16:9, no readable words."
- **Motion:** Slow push-in
- **On-screen text:** none (screen content is deliberately illegible nonsense)
- **Source/asset note:** AI-generated.

### Page 11 — [Segment 3: What They Were Hiding]
- **Time:** 02:09.5 – 02:23.5  (14.0s)
- **image:** generated/p11-bootleg-backroom-boards.png
- **Narration:** "Sure, there was a business reason. He'd copy a board, sell it, turn one machine into the game everybody wanted. That's just how the business worked. But solving the puzzle. That was the part he loved. Back then, they had a word for it: bootlegging."
- **Image (one):** A moody, slightly clandestine back room with copied arcade boards stacked under a single hanging work lamp.
- **AI image prompt:** "Moody early-1980s back-room workbench with copied arcade circuit boards stacked, a single hanging work lamp, slightly clandestine underground atmosphere, deep shadows, cigarette smoke, film grain, cinematic documentary, 16:9, no text."
- **Motion:** Slow pan
- **On-screen text:** "BOOTLEGGING" — small, period typewriter style, lower third (optional)
- **Source/asset note:** AI-generated.

### Page 12 — [Segment 3→4: What They Were Hiding → The Hex Dump]  *(transition)*
- **Time:** 02:23.5 – 02:34.5  (11.0s)
- **image:** generated/p12-modern-rom-preservation.png
- **Narration:** "Today, we call it reverse engineering. We call it ROM preservation. We call it the MAME project. Same chips. Same puzzle. The world just gave it better names. So one day, my dad calls me over."
- **Image (one):** A present-day ROM-preservation / MAME montage — a modern chip reader dumping a vintage chip, screens of clean hex.
- **AI image prompt:** "Present-day clean technical workspace preserving vintage game ROMs: a modern chip reader connected to a laptop, a vintage arcade board, screens showing organized hexadecimal data, cool modern lighting contrasted with old hardware, crisp documentary photography, 16:9, no text."
- **Motion:** Slow pan L→R
- **On-screen text:** "reverse engineering · ROM preservation · MAME" — clean modern caption (optional)
- **Source/asset note:** AI-generated.

### Page 13 — [Segment 4: The Hex Dump]
- **Time:** 02:34.5 – 02:45.0  (10.5s)
- **image:** generated/p13-smoky-basement-office.png  *(existing)*
- **Narration:** "And I come down the stairs into his office. The whole room sat in a haze of cigarette smoke, the glow of the screen cutting right through it. I lean in over his shoulder."
- **Image (one):** Wide of the 1981 basement office — smoke-filled, a desk with the glowing CRT cutting through the haze, father seated.
- **AI image prompt:** "Wide cinematic shot of a 1981 suburban basement home-office at night, thick cigarette smoke filling the room, a single CRT monitor glowing and cutting a beam of light through the haze, a man seated at the desk silhouetted, wood paneling, warm tungsten and screen glow, heavy film grain, atmospheric documentary, 16:9, no text."
- **Motion:** Slow push-in
- **On-screen text:** none
- **Source/asset note:** AI-generated.

### Page 14 — [Segment 4: The Hex Dump]
- **Time:** 02:45.0 – 02:58.0  (13.0s)
- **image:** real/REAL-trs80-donkeykong-promdump-notebook.png  *(existing real photo)*
- **Narration:** "We're staring at the screen of his TRS-80 with a PROM programmer wired into it, one of those Donkey Kong chips sitting in the socket. And on that screen is the dump from the chip. An early Donkey Kong board."
- **Image (one):** Over-the-shoulder: the TRS-80 screen showing the raw dump, a PROM programmer wired in, a Donkey Kong ROM chip in the socket.
- **AI image prompt:** "Over-the-shoulder view of a teenager and his father looking at a TRS-80 monitor filled with a raw memory dump, a PROM programmer device wired to the computer, an EPROM chip seated in the programmer's ZIF socket, monochrome data on screen, cigarette smoke haze, warm tungsten plus phosphor glow, film grain, intimate 1981 documentary, 16:9, no readable English."
- **Motion:** Slow push-in over the shoulder
- **On-screen text:** none
- **Source/asset note:** REAL PHOTO supplied (TRS-80 + programmer + Donkey Kong PROM dump + notebook).

### Page 15 — [Segment 4: The Hex Dump]
- **Time:** 02:58.0 – 03:08.5  (10.5s)
- **image:** generated/p15-donkeykong-cabinet-1981.png
- **Narration:** "Donkey Kong was the new hot game that year, the one with the big ape and the little guy in the red hat they hadn't even named Mario yet. And he tells me how he got there."
- **Image (one):** A 1981 Donkey Kong arcade cabinet, kids gathered, glowing marquee and screen.
- **AI image prompt:** "A 1981 Donkey Kong upright arcade cabinet photographed in a period arcade, glowing marquee and screen, kids gathered nearby, warm arcade neon and tungsten light, nostalgic film grain, documentary, 16:9, no added text."
- **Motion:** Ken Burns slow zoom-in on the cabinet
- **On-screen text:** none
- **Source/asset note:** PREFER REAL PHOTO — a real Donkey Kong cabinet, ideally one in the InfoAge / VCF collection. Avoid reproducing copyrighted character art too literally if generating.

### Page 16 — [Segment 4: The Hex Dump]
- **Time:** 03:08.5 – 03:20.0  (11.5s)
- **image:** generated/p16-programmer-reading-scramble.png
- **Narration:** "Pulling the raw data off the chip, that part was easy. That's what the programmer was for. The hard part was reading it. Actually making sense of it. Because those addresses were scrambled."
- **Image (one):** Close on the PROM programmer reading the chip, with a conceptual hint of tangled/crossed address lines.
- **AI image prompt:** "Close-up of an early-1980s PROM/EPROM programmer with a chip in its ZIF socket, status LEDs lit, ribbon cable to a computer, faint overlay suggestion of tangled crossed address lines and disordered numbers, warm work light, shallow depth of field, film grain, technical documentary, 16:9, no readable English."
- **Motion:** Slow push-in
- **On-screen text:** none
- **Source/asset note:** AI-generated.

### Page 17 — [Segment 4: The Hex Dump]
- **Time:** 03:20.0 – 03:32.5  (12.5s)
- **image:** real/REAL-trs80-programmer-copyprotection-notebook.png  *(existing real photo)*
- **Narration:** "So he'd done it by hand. One bit at a time, with little jumper wires, right there on the programmer's socket. Trial and error. One combination didn't work, so he'd try another. Then another. Then another."
- **Image (one):** Macro of hands placing tiny jumper wires on the programmer socket pins, a handwritten notebook of crossed-out attempts beside it.
- **AI image prompt:** "Extreme macro of a man's hands carefully placing small colored jumper wires onto the pins of a chip programmer socket, a handwritten notebook full of crossed-out attempts and pin diagrams beside it, an ashtray with a cigarette, intense precision, warm lamp light, shallow depth of field, film grain, documentary, 16:9, no readable text."
- **Motion:** Slow pan over the hands
- **On-screen text:** none
- **Source/asset note:** REAL PHOTO supplied (TRS-80 programmer, copy-protection work, notebook of attempts).

### Page 18 — [Segment 4: The Hex Dump]
- **Time:** 03:32.5 – 03:42.5  (10.0s)
- **image:** generated/p18-scramble-resolves-hex.png
- **Narration:** "And then, finally, it revealed the message. The scramble resolved. And the data made sense. And what you're looking at is a hex dump. A listing, laid out in columns."
- **Image (one):** The monitor where scrambled data snaps into orderly rows — order emerging, resolving into a clean hex dump in columns.
- **AI image prompt:** "A vintage monochrome monitor where chaotic scrambled characters resolve into clean orderly columns of a hex dump (address column left, hex bytes in the middle), a visual sense of order emerging from chaos, phosphor glow, scanlines, dark room, film grain, dramatic technical documentary, 16:9, no English words yet."
- **Motion:** Slow push-in
- **On-screen text:** none
- **Source/asset note:** AI-generated.

### Page 19 — [Segment 4: The Hex Dump]
- **Time:** 03:42.5 – 03:55.5  (13.0s)
- **image:** generated/p19-hexdump-columns.png
- **Narration:** "Down the left, and through the middle, it's all hexadecimal numbers. Row after row of them. The raw guts of the program, meaning nothing to me. And then there's a column on the right. That's the text view."
- **Image (one):** Full-frame hex dump — left address column, middle hex columns, the right-hand text column just coming into view.
- **AI image prompt:** "Full-frame classic hex-dump listing on a monochrome terminal: address column on the left, columns of hexadecimal byte values in the middle, a text/ASCII column appearing at the right edge, monospaced phosphor text, neat grid, scanlines, film grain, technical documentary, 16:9."
- **Motion:** Slow scroll/pan downward through rows
- **On-screen text:** hex columns are the image itself (no overlay)
- **Source/asset note:** AI-generated.

### Page 20 — [Segment 4: The Hex Dump]
- **Time:** 03:55.5 – 04:06.0  (10.5s)
- **image:** generated/p20-ascii-column-fragments.png
- **Narration:** "It takes those same raw bytes and shows them to you as readable characters, if there's anything readable in there to find. And mostly there isn't. Mostly it's little fragments."
- **Image (one):** The hex dump with the right-hand ASCII column highlighted — mostly dots and stray characters.
- **AI image prompt:** "A hex-dump terminal view with the right-hand ASCII text column visually emphasized and slightly brighter, hex columns to the left, the ASCII column mostly periods and stray characters, monospaced phosphor text, scanlines, film grain, technical documentary, 16:9, no coherent words."
- **Motion:** Static with a slow brighten/highlight on the right column
- **On-screen text:** fragmentary stray characters (deliberately meaningless)
- **Source/asset note:** AI-generated.

### Page 21 — [Segment 4: The Hex Dump]  *(CLIMAX BUILD)*
- **Time:** 04:06.0 – 04:16.5  (10.5s)
- **image:** generated/p21-broken-english-emerging.png
- **Narration:** "A stray character here. The occasional half of a word there. Nothing that means anything. And then scrolling down, in that right-hand column... English. Broken English."
- **Image (one):** The ASCII column mid-scroll, where amid the fragments a few broken-English words begin to emerge and stand out.
- **AI image prompt:** "The right-hand ASCII column of a hex dump mid-scroll, where amid dots and fragments a few broken English words begin to appear and glow, phosphor intensifying around them, scanlines, film grain, suspenseful technical documentary, 16:9."
- **Motion:** Scroll + slow push-in toward the emerging text
- **On-screen text:** faint broken-English fragments resolving in the ASCII column
- **Source/asset note:** AI-generated. Start of the visual climax — treat as a real hex-dump screen.

### Page 22 — [Segment 4: The Hex Dump]  *(CLIMAX — THE REVEAL)*
- **Time:** 04:16.5 – 04:27.0  (10.5s)
- **image:** generated/p22-remembered-message-reveal.png
- **Narration:** "An actual sentence. The game... was talking. It said something like: \"Congratulations. If you're reading this, call this number in Tokyo, Japan.\" And I lost my mind."
- **Image (one):** The hex dump's ASCII column displaying the message *as Nick remembered it* — the dramatic reveal, surrounding hex dimmed.
- **AI image prompt:** "A hex-dump terminal screen, right-hand ASCII column clearly showing a readable English message glowing in phosphor, surrounding hex dimmed to spotlight the text, scanlines, film grain, climactic reveal, dark room, 16:9."
- **Motion:** Slow push-in, then hold on the message
- **On-screen text:** **"CONGRATULATIONS. IF YOU'RE READING THIS, CALL THIS NUMBER IN TOKYO, JAPAN."** — rendered in the terminal's monospaced ASCII column (Nick's *remembered* version; the documented real text appears on Page 27).
- **Source/asset note:** AI-generated. On-screen text is essential here.

### Page 23 — [Segment 4→5: The Hex Dump → Who Left the Message]  *(transition)*
- **Time:** 04:27.0 – 04:41.0  (14.0s)
- **image:** generated/p23-nick-sixteen-crt.png
- **Narration:** "I'm sixteen years old, standing in my dad's office, looking at a secret message that almost nobody on Earth was ever supposed to find. Now, for forty years, that was just a story I carried around. A thing my dad and I saw on a screen one night."
- **Image (one):** 16-year-old Nick's face lit by the CRT glow — wonder and disbelief, softly settling toward present-day reflection.
- **AI image prompt:** "Close portrait of a sixteen-year-old boy in 1981 standing in a smoky basement office, his face lit blue-green by a CRT monitor's glow, eyes wide with awe and disbelief, cigarette smoke haze, warm shadows behind, film grain, intimate cinematic documentary, 16:9, no text."
- **Motion:** Slow push-in
- **On-screen text:** none
- **Source/asset note:** PREFER REAL PHOTO — a period family photo of Nick around 16 would make this land harder; AI fallback.

### Page 24 — [Segment 5: Who Left the Message]
- **Time:** 04:41.0 – 04:51.5  (10.5s)
- **image:** generated/p24-nick-researching-home.png
- **Narration:** "But after that visitor left the museum, I couldn't stop thinking about it. So I went home, and I started researching. And for the first time, I learned the real story behind that message."
- **Image (one):** Present-day Nick at a desk late at night, researching on a laptop — the glow of discovery.
- **AI image prompt:** "Present-day man at a desk late at night researching on a laptop, screen glow on his face, scattered notes and a coffee mug, an old photograph propped nearby, warm lamp light, focused and curious mood, documentary, 16:9, no text."
- **Motion:** Slow push-in
- **On-screen text:** none
- **Source/asset note:** AI-generated.

### Page 25 — [Segment 5: Who Left the Message]
- **Time:** 04:51.5 – 05:02.5  (11.0s)
- **image:** generated/p25-ikegami-tokyo-office.png  *(existing)*
- **Narration:** "Donkey Kong is a Nintendo game. But Nintendo didn't write the code. They quietly brought in a Japanese engineering firm called Ikegami Tsushinki to actually build it and then never gave them public credit."
- **Image (one):** A 1981 Japanese engineering office — Ikegami Tsushinki engineers at work building the game.
- **AI image prompt:** "Early 1980s Japanese electronics engineering office in Tokyo, engineers in shirtsleeves working at terminals and benches developing a game on development hardware, fluorescent and tungsten light, period-accurate, documentary photograph, film grain, 16:9, no text."
- **Motion:** Slow pan across the office
- **On-screen text:** "Ikegami Tsushinki — uncredited developer" (small, lower third; optional)
- **Source/asset note:** AI-generated.

### Page 26 — [Segment 5: Who Left the Message]
- **Time:** 05:02.5 – 05:13.5  (11.0s)
- **image:** generated/p26-hidden-message-in-code.png
- **Narration:** "They were the shadow developer. And buried inside the program, the Ikegami engineers had left a message. For anyone who ever cracked the chip and got in deep enough to read it."
- **Image (one):** A hidden message buried deep inside glowing program code / a chip — a secret left for a future reader.
- **AI image prompt:** "Conceptual image of a hidden message buried deep within glowing lines of code inside a memory chip's data, a single highlighted line standing out among many, dark technical aesthetic with a warm glow on the secret, film grain, cinematic documentary, 16:9, no readable English."
- **Motion:** Slow push-in toward the buried line
- **On-screen text:** none
- **Source/asset note:** AI-generated.

### Page 27 — [Segment 5: Who Left the Message]  *(DOCUMENTED MESSAGE — v17 verified text)*
- **Time:** 05:13.5 – 05:23.5  (10.0s)
- **image:** generated/p27-ikegami-message-congratulation.png  *(existing)*
- **Narration:** "The real message read: \"Congratulation! If you analyse difficult this program, we would teach you.\" And then a phone number, in Tokyo, Japan. And the words: \"System Design, Ikegami.\""
- **Image (one):** The hex dump's ASCII column showing the *documented, real* Ikegami ROM message, opening with CONGRATULATION.
- **AI image prompt:** "A hex-dump terminal screen, right-hand ASCII column clearly displaying the real embedded ROM message in glowing monospaced phosphor text, surrounding hex slightly dimmed, scanlines, film grain, authentic technical documentary reveal, dark room, 16:9."
- **Motion:** Static hold (let the viewer read it)
- **On-screen text:** **"CONGRATULATION ! IF YOU ANALYSE DIFFICULT THIS PROGRAM, WE WOULD TEACH YOU. ***** TEL.TOKYO-JAPAN 044(244)2151 EXTENTION 304 SYSTEM DESIGN IKEGAMI CO. LIM."** — rendered in the terminal ASCII column, verbatim verified ROM text.
- **Source/asset note:** AI-generated. Keep the text exact (note the opening "CONGRATULATION !").

### Page 28 — [Segment 5: Who Left the Message]  *(NEW v17 BEAT — somebody called)*
- **Time:** 05:23.5 – 05:37.0  (13.5s)
- **image:** generated/p28b-bootlegger-calls-tokyo.png  *(NEW — to be generated)*
- **Narration:** "It was a note to a stranger. If you got this far, you're one of us. Congratulation. You found it. Here's our number. Call us. And somebody actually called that number. A bootlegger, mid-copy, picked up the phone and dialed Tokyo for help."
- **Image (one):** A 1981 bootlegger at a cluttered workbench, mid-copy, reaching for a rotary/desk telephone — actually dialing Tokyo.
- **AI image prompt:** "1981 dimly lit back-room workbench mid-bootleg: copied arcade boards and a chip programmer in progress, a man reaching for a beige rotary desk telephone, receiver in hand, a scrap of paper with a Tokyo phone number under the lamp, cigarette smoke, warm tungsten light, film grain, cinematic documentary, 16:9, no text."
- **Motion:** Slow push-in toward the phone
- **On-screen text:** "Congratulation. You found it." (optional, warm, brief)
- **Source/asset note:** AI-generated (image does not exist yet; will be generated to filename above).

### Page 29 — [Segment 6: The Lawsuit]
- **Time:** 05:37.0 – 05:48.0  (11.0s)
- **image:** generated/p29-code-copied.png
- **Narration:** "But there's one more piece of the story. When Donkey Kong became a monster hit, Nintendo wanted to keep making it, but they'd fallen out with Ikegami. So they had the code reverse-engineered. Copied."
- **Image (one):** The code being copied / reverse-engineered without its creators — duplicated boards, data cloned side by side.
- **AI image prompt:** "Conceptual early-1980s image of a game's code being copied: arcade boards being duplicated on a workbench, screens of data cloned side by side, a slightly cold and transactional mood, practical lighting, film grain, documentary, 16:9, no text."
- **Motion:** Slow push-in
- **On-screen text:** none
- **Source/asset note:** AI-generated.

### Page 30 — [Segment 6: The Lawsuit]
- **Time:** 05:48.0 – 06:01.0  (13.0s)
- **image:** generated/p31-courtroom-rom-evidence.png  *(existing — filename retains old "p31" number; now page 30)*
- **Narration:** "So they could keep cranking out the game without the people who actually built it. Ikegami took them to court for copyright infringement. It dragged on for years. And in the end, Ikegami won. A court found Nintendo didn't own the code."
- **Image (one):** A dignified Japanese courtroom with ROM chips presented as evidence on the table.
- **AI image prompt:** "A dignified Japanese courtroom interior, scales-of-justice mood, legal documents and folders on a table with vintage ROM chips laid out as if evidence, formal serious lighting, editorial documentary style, film grain, 16:9, no text."
- **Motion:** Slow push-in
- **On-screen text:** "Ikegami v. Nintendo — Ikegami won" (small, lower third; optional)
- **Source/asset note:** AI-generated.

### Page 31 — [Segment 6: The Lawsuit]
- **Time:** 06:01.0 – 06:12.5  (11.5s)
- **image:** generated/p31-message-key-clue.png
- **Narration:** "The battle over who really created Donkey Kong came down to what was hidden inside those ROM chips. The message my father had uncovered turned out to be one of the most important clues in the entire case."
- **Image (one):** ROM chips lit as the crux of the case — the hidden message bridging the 1981 basement discovery to the courtroom.
- **AI image prompt:** "Macro of vintage ROM chips lit dramatically as pivotal evidence, a faint overlay connecting a smoky 1981 basement CRT showing a hidden message to a formal courtroom, the message as the key clue, warm-to-cool contrast, film grain, editorial documentary, 16:9, no text."
- **Motion:** Slow push-in
- **On-screen text:** none
- **Source/asset note:** AI-generated.

### Page 32 — [Segment 6→7: The Lawsuit → Close]  *(transition)*
- **Time:** 06:12.5 – 06:24.0  (11.5s)
- **image:** generated/p32-docent-visitor-radar.png
- **Narration:** "So that's the story I told that visitor, the two of us standing in an old radar building, surrounded by machines. And these days, when I walk through this place, I don't just see cabinets and circuit boards."
- **Image (one):** Nick (docent) and the visitor standing together among the machines in the InfoAge radar building.
- **AI image prompt:** "Two men standing and talking among rows of vintage computers inside a historic brick radar building, warm gallery light through tall windows, a sense of shared wonder, documentary photograph, 16:9, no text."
- **Motion:** Slow pan across the gallery
- **On-screen text:** none
- **Source/asset note:** **REAL PHOTO AVAILABLE** → `assets/images/real/infoage-handout/infoage-space-exhibit-docent-visitor.png` (Doug's pamphlet — an actual docent talking with a visitor among the machines; near-perfect match for this exact beat). Higher-res alt: a frame from Nick's own museum shoot.

### Page 33 — [Segment 7: Payoff / Close]
- **Time:** 06:24.0 – 06:36.5  (12.5s)
- **image:** real/infoage-handout/infoage-computer-history-exhibit.png  *(real stand-in until Nick's TRS-80 shoot; montage members in the layout note below)*
- **Narration:** "I see the engineers who built them. The operators who ran them. The kids who played them. There's even a TRS-80 in the collection, the same kind of machine my dad used to uncover the hidden message inside the Donkey Kong PROMs."
- **Image (one):** The actual TRS-80 on display in the InfoAge collection, with a small placard.
- **AI image prompt:** "A vintage TRS-80 microcomputer on display in a museum exhibit with a small placard, warm gallery spotlight, reverent framing, documentary photograph, 16:9, no text."
- **Motion:** Slow push-in toward the machine
- **On-screen text:** none
- **Source/asset note:** **REAL PHOTO — primary = Nick's museum shoot** (the actual TRS-80; hero, highest res). The "engineers / operators / kids who played them" lines are the spot for a quick **real-exhibit montage** from Doug's pamphlet: `infoage-handout/infoage-computer-history-exhibit.png` ⭐ (the very room the museum's TRS-80 lives in), `infoage-univac-navy-missile-computer.png` (UNIVAC + reel-to-reel), `infoage-apollo-guidance-computer.png`, `infoage-army-electronics.png`. Handout photos are ~1000–1370px wide — fine with gentle Ken Burns; Nick's shoot is the full-res hero.
- **Review thumbnails — close-montage members (with the Computer-History hero above):**
  ![[infoage-univac-navy-missile-computer.png]]
  ![[infoage-apollo-guidance-computer.png]]
  ![[infoage-army-electronics.png]]

### Page 34 — [Segment 7: Payoff / Close]
- **Time:** 06:36.5 – 06:51.0  (14.5s)
- **image:** real/infoage-handout/infoage-radio-gallery-hallway.png  *(present-day gallery base for the Dad-at-desk memory overlay)*
- **Narration:** "Every time I walk past it, I don't just see an old computer. I see my father, hunched over his desk through a haze of cigarette smoke, patiently swapping bits until the nonsense became a message. That's what we keep here, at the Vintage Computer Museum at InfoAge."
- **Image (one):** Memory-overlay: Nick's father hunched at his 1981 desk in the smoke, softly blending into the present-day museum gallery.
- **AI image prompt:** "Double-exposure / memory-overlay image: a 1981 scene of a man hunched over his desk in cigarette smoke working a chip programmer, softly blending into a warm present-day vintage computer museum gallery, nostalgic glow, film grain, emotional cinematic documentary, 16:9, no text."
- **Motion:** Slow push-in / gentle crossfade feel
- **On-screen text:** none
- **Source/asset note:** AI-generated overlay; use a **real InfoAge gallery photo** as the present-day layer — `infoage-handout/infoage-computer-history-exhibit.png` or `infoage-radio-gallery-hallway.png` — softly blended with the painted 1981 Dad-at-desk.

### Page 35 — [Segment 7: Payoff / Close]  *(CLOSING CARD)*
- **Time:** 06:51.0 – 07:04.8  (13.8s)
- **image:** real/infoage-handout/infoage-antenna-dishes-signature.png  *(hero) + map + QR composited in assembly*
- **Narration:** "Not just old machines, the lives that ran through them. So come visit. Find the computer from your childhood. The one from your first job. The one your dad brought home. Because every one of these machines has a story hiding inside it. Come find yours."
- **Image (one):** CTA closing card built on **InfoAge's signature antenna shot** (the dramatic Camp Evans dishes — the image InfoAge always leads with), with a **location map** inset and a **scan-for-directions QR** — turning the close into a real "come visit" call to action.
- **Layout (composite in assembly):**
  - **Hero / background:** `infoage-handout/infoage-antenna-dishes-signature.png`, warm-graded, gentle slow push-in, subtle dark gradient lower-third for text legibility.
  - **Lockup:** "**Vintage Computer Museum at InfoAge**" · "Wall Township, NJ" · "**2201 Marconi Road**" · "**Come find yours.**"
  - **Map inset:** `infoage-handout/infoage-location-map.png` (the pamphlet's NJ-coast location map).
  - **QR (primary):** `infoage-handout/infoage-qr-directions-googlemaps.png` → Google Maps directions to 2201 Marconi Rd, with a small "**Scan for directions**" label. (Alt: `infoage-qr-website-marconi.png` → infoage.org.) Hold ~13.8s; render the QR large/crisp enough to scan.
- **Motion:** Slow push-in on the antenna, settling to a static final CTA card (map + QR fade up over the hold).
- **On-screen text:** the lockup above + "Scan for directions" by the QR.
- **Source/asset note:** REAL assets in `assets/images/real/infoage-handout/` — antenna `infoage-antenna-dishes-signature.png` (640×515; graded hero behind the lockup), map `infoage-location-map.png` (896×1294), directions QR `infoage-qr-directions-googlemaps.png` (decoded → Google Maps, 2201 Marconi Rd). A real InfoAge **building exterior** from Nick's shoot can swap in as the hero if preferred over the antenna.
- **Review thumbnails — map + directions QR (composite onto the antenna card):**
  ![[infoage-location-map.png]]
  ![[infoage-qr-directions-googlemaps.png]]

---

## Continuity check
- 35 pages, contiguous in/out times, no gaps or overlaps; final page ends at **07:04.8** (≈424.77s).
- **Every page duration is within [10.0, 15.0]s.** min = 10.0s (P18, P27) · max = 14.5s (P6, P10, P34) · avg ≈ 12.1s.
- **v17 re-time:** P1–P22 frozen (Segments 1–4, unchanged audio). P23–P35 re-paged for the corrected Segment 5 (now 6 lines, post-atempo 62.01s) and the new 424.77s total; Segment 6–7 re-flowed.
- New Seg 5 line 6 ("And somebody actually called that number…") shares the closing Seg 5 page (P28) with line 5, carried by the new bootlegger-calls-Tokyo image.
- Per-segment page distribution (by the segment a page opens in; transition pages cross a boundary): S1 = 4 · S2 = 5 · S3 = 3 · S4 = 11 · S5 = 5 · S6 = 3 · S7 = 4.
- Climax preserved: P21 (broken English emerges) → P22 (remembered "Congratulations…" reveal, on-screen text) are their own pages; the verified Ikegami ROM message (opening "CONGRATULATION !") is its own page, P27.
- Image-filename notes for the assembler: existing assets kept where content is unchanged — P25 `p25-ikegami-tokyo-office.png`, P27 `p27-ikegami-message-congratulation.png`. Two existing files now live on renumbered pages: **P30 uses `p31-courtroom-rom-evidence.png`**, **P35 uses `p36-infoage-exterior-closing.png`**. New for v17: **P28 `p28b-bootlegger-calls-tokyo.png`** (to be generated). Real photos: P14 `REAL-trs80-donkeykong-promdump-notebook.png`, P17 `REAL-trs80-programmer-copyprotection-notebook.png`.
