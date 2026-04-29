# Jersey Stack Ep 1 — Storyboard Revision Plan (v3)

**Date:** 2026-04-23
**Trigger:** Nick reviewed 30 scenes in the multi-tenant storyboard app at `localhost:8500/p/jersey-stack-ep1-transistor/`, left 15 scene notes, and uploaded drone footage to Scenes 1 and 29. This plan captures every change required before the next Video Assembler pass.
**Supersedes:** Gate 2 thesis-sharpening pass (Apr 19). Does not change series thesis or scene order.

---

## Executive Summary

Three classes of change need to happen before the next full assembly:

1. **Timing reconcile** — 2 scenes have hard video-vs-narration mismatches (S1, S29), 1 chapter has ambiguous duration (S19 has no duration set), and the overall narration currently overruns the visual budget by ~50 seconds.
2. **Cadence upgrade** — Nick's moving to a ~10-second-per-image rhythm across Chapters 3–9 (the Murray Hill invention story). Current state: 1 image per scene across 22 scenes. Target state: 2–4 images per scene depending on duration. Net need: ~30 more images.
3. **Asset fulfillment** — Pass A (Wikimedia + LOC archival + 2 motion graphics) staged 12 images/videos earlier today, but they were wiped by a client/server save race and need to be re-applied. Pass B (AI fill for noted gaps) has ~9 images to generate.

Estimated episode runtime after all changes: **15:00–15:30** (was 14:10 visual budget / 14:45 narration in Gate 2). Growth is from Scene 29 timing reconcile + narration-to-cadence alignment, not scope creep.

---

## Section 1 — Timing Reconcile (3 scenes)

### Scene 1 — Drone Reveal (current 25s / drone clip 7s / narration "You might recognize this building" ~2s)

**Problem:** Scene budget is 25s but Nick's drone clip is only 7 seconds and narration is essentially a single sentence. Gap of ~18s with no visual or narrative content.

**Nick's note:** *"The narration on this slide and the next needs to be refactored to match the video's length."*

**Recommended fix:** Shorten Scene 1 to **7–10s** (drone only, minimal narration). Move the current Scene 2 narration earlier so the Severance reveal lands immediately after the drone pullback. Effective result:
- S1 (0:00–0:07) — drone footage, no narration (or just the 2s "You might recognize this building" laid over the final second)
- S2 (0:07–0:27, was 0:25–0:50) — Severance reveal, full current narration, 20s budget = 20s narration (matched)

This shaves 18s off the pre-title-card runtime, tightens the cold open, and gives the drone clip room to breathe without padding.

**Owner:** Video Script Writer (narration retime) + Video Assembler (scene duration update).

### Scene 29 — Back to the Drone (current 30s / combined video 12s / narration 30s)

**Nick's note (just added):** *"This is a 12-second video, and the narration is 30."*

**State:** 2 videos attached — transistor monument drone (`scene-29-tranistor-8ee04a.mp4`) and trimmed Fort Monmouth Netflix construction (`scene-29-fortmonmouth-nexflix-1-mp4-1ecbe6.mp4`). Combined they are 12s. Narration is 30s of voiceover.

**Problem:** 18 seconds of narration has no primary video to sit on.

**Options:**
- **A. Shoot more.** Get additional drone passes of the transistor monument from different angles, plus interior/exterior Bell Works cutaways. Nick may have more footage on the DJI SD card that wasn't imported.
- **B. Cutaway montage.** Pad the middle of the scene with still images during the narration spill: reuse S2 Bell Works interiors (atrium, walkways) + archival Bell Labs aerials from the research cache. This is a "montage on narration" pattern — perfectly valid for closing bookends.
- **C. Cut narration.** Reduce the 30s voiceover to ~12–15s. Loses the "three layers deep" payoff (monument → Severance → Netflix Studios).

**Recommended:** **Option B.** Nick's closing narrative is the thesis landing — don't cut it. Build a cutaway montage using:
- `research/severance-refs/BellWorks1-4.png` (already downloaded, unused — 4 large Bell Works reference shots)
- `assets/images/_src/bell_works_atrium.jpg` + `bell_works_walkways.jpg` (Saarinen interiors, already on disk)
- Any usable archival Bell Labs aerial from `research/archival-photos.md` (LOC / Wikimedia categories)
- Scene 2's 3 images as callbacks if the narrative supports it

Suggested shape: drone monument (4s) → narration over montage of 4–5 Bell Works stills (18s) → Netflix FM drone (8s) = 30s. The monument drone opens and the Netflix drone closes; the spill fills the middle.

**Owner:** Video Assembler (montage assembly) + possibly Web Research (if more archival aerials needed).

### Scene 19 — The Team Breaks (duration UNSET in data JSON)

**Problem:** The `duration` field in `storyboard-data.json` for Scene 19 is blank/missing. Narration word count suggests ~41s of voiceover.

**Action:** Set duration to **40s** (matches narration). Update JSON.

**Owner:** Quick JSON fix (me, next pass).

### Global narration overflow

Total narration estimate across all 30 scenes: **~14:45** (per Gate 2 note, confirmed by word-count math at 150 wpm).
Total budgeted visual runtime: **13:40** (sum of current `duration` fields, with S19 unset).
After Scene 1 tightening (–18s) and Scene 29 expansion (no change — narration stays, video fills): runtime trends to **~15:00**.

No action needed beyond the Scene 1 and Scene 29 fixes — the rest of the episode's overflow is absorbed by the per-scene image cadence adds in Section 2.

---

## Section 2 — Per-Scene Asset Plan (30 scenes)

Columns:
- **Dur** — current scene duration in seconds
- **Now** — assets currently on the scene
- **Target** — total assets needed @ ~10s/image cadence (Nick's rule, applied to Ch 2–9)
- **Pass A (staged, needs re-apply)** — what I downloaded earlier today that got wiped
- **Pass B (AI gen)** — what still needs AI-generated fill
- **Notes** — anything else

| S# | Ch | Dur | Now | Target | Pass A — STAGED | Pass B — AI GEN | Notes |
|---:|---:|---:|---:|---:|---|---|---|
| 1 | 1 | 25→7 | 1 video | 1 | — | — | Retime to 7s, drone only |
| 2 | 1 | 25 | 3 img | 3 | — | — | Nick already populated |
| 3 | 1 | 25 | 1 img | 3 | — | — | AI fill optional — fast cuts can carry |
| 4 | 1 | 15 | 1 title | 1 | — | — | Title card, unchanged |
| 5 | 2 | 30 | 1 img | 3 | +2: MH exterior + entrance | — | DONE, re-apply |
| 6 | 2 | 30 | 1 img | 3 | — | +2: Kelly in Bell Labs corridor (lean on Nokia archive outreach OR AI), "monopoly bet" visual metaphor | Nick's note |
| 7 | 2 | 45 | 1 img | 4–5 | +2: 2 LOC Gottscho-Schleisner corridor candidates (low-res, need visual QC) | +2: period Bell Labs corridor (AI), Kelly Memo illustrated | Still effectively an image gap |
| 8 | 3 | 25 | 1 img | 3 | +2: ENIAC classic + ENIAC tubes closeup | — | DONE, re-apply |
| 9 | 3 | 25 | 1 img | 2–3 | +1: scene-09a.mp4 (15s hex lattice motion graphic, already rendered) | — | Motion graphic probably replaces or dominates — decide at assembly |
| 10 | 3 | 20 | 1 img | 2 | — | +1: diagram of amplification / "the wall" metaphor | Not in Nick's notes but fits cadence |
| 11 | 4 | 25 | 1 img | 2–3 | — | — | Bardeen portrait — can stand alone at 25s, or add 1 AI of young Bardeen |
| 12 | 4 | 25 | 1 img | 2–3 | — | — | Brattain portrait — same |
| 13 | 4 | 55 | 1 img | 5–6 | — | +2: "Bardeen thinking" (Nick asked for this) + Shockley during breakthrough month | Nick's note |
| 14 | 5 | 30 | 1 img | 3 | +1: LOC 1942 drafting room (low-res preview) | +1–2: period lab bench / point-contact apparatus | Nick's note; LOC image is proxy, not literal |
| 15 | 5 | 40 | 1 img | 4 | — | +2: Dec 23 1947 demo moment (AI), oscilloscope trace showing gain | HERO scene, Nick's note — demo photo is a known GAP in archival doc |
| 16 | 5 | 35 | 1 img | 3–4 | — | +2: Bardeen at home telling wife, domestic kitchen scene 1947 | Nick's note — no archival exists |
| 17 | 6 | 30 | 1 img | 3 | — | +1: Shockley in Chicago phone booth / hotel (AI) | Not in Nick's notes but fits cadence |
| 18 | 6 | 25 | 1 img | 2–3 | — | +1: Shockley alone in hotel with notepads (AI) | Nick's note |
| 19 | 6 | **40** | 1 img | 4 | — | +1–2: tense Bell Labs team meeting (AI) | **Duration was unset; setting to 40s** |
| 20 | 7 | 30 | 1 img | 3 | — | +2: Bown at June 1948 press conference with oversized transistor model | Nick's note — known archival GAP |
| 21 | 7 | 25 | 1 img | 2–3 | — | — | Fort Monmouth transition — one strong image holds |
| 22 | 7 | 30 | 1 img | 3 | — | — | InfoAge / Camp Evans — Nick's own photos if he has them; otherwise hold |
| 23 | 8 | 20 | 1 img | 2 | — | — | Nobel ceremony — 3 portraits in archival doc can fill |
| 24 | 8 | 35 | 1 img | 3–4 | +1: scene-24a.mp4 (18s parchment decree motion graphic) | +1–2: gavel / legal metaphor (AI) | Nick's note |
| 25 | 9 | 35 | 1 img | 3–4 | +3: Shockley Semi Lab + 391 San Antonio + Noyce 1959 | +1: Traitorous Eight substitute (composite/AI since Magnum licensing is blocker) | Nick's note |
| 26 | 9 | 35 | 1 img | 3–4 | — | +2: logo cascade Fairchild→Intel→AMD, Silicon Valley aerial | Not in Nick's notes but storyboard visual says "fast logo sequence" which needs graphics |
| 27 | 10 | 25 | 1 img | motion | — | — | Motion graphic to be rendered at assembly time (FFmpeg drawtext counter) |
| 28 | 10 | 15 | 1 img | 1 | — | — | Title-card quiet line, unchanged |
| 29 | 11 | 30 | 2 vid | 30s filled | — | Cutaway montage (not AI — use existing Bell Works stills + archival) | See Section 1 fix |
| 30 | 12 | 10 | 1 img | 1 | — | — | End card, unchanged |

### Pass A re-apply — total assets to reinstate
**7 scenes, 12 assets.** Files already on disk at the paths listed; JSON just needs the `assets[]` entries re-added. ~30 seconds of work after Nick reloads.

### Pass B — AI generation list (final count)
**9 scenes, ~14 AI images:**
- S6 × 2 (Kelly + monopoly bet)
- S7 × 2 (period corridor fill)
- S10 × 1 (optional cadence add)
- S13 × 2 (Bardeen thinking + Shockley)
- S14 × 1–2 (physics bench)
- S15 × 2 (demo moment HERO + oscilloscope)
- S16 × 2 (Bardeen domestic)
- S17 × 1 (Chicago phone booth)
- S18 × 1 (Chicago hotel)
- S19 × 1–2 (tense team meeting)
- S20 × 2 (press conference with oversized model)
- S24 × 1–2 (legal metaphor)
- S25 × 1 (Traitorous Eight composite)
- S26 × 2 (logo sequence, Silicon Valley aerial)

Budget depends on image model. At gpt-image-2 quality, expect ~$0.40/image × 14 = ~$5.60. Generation time ~20–30 minutes.

---

## Section 3 — Pass A Re-apply Coordination

**The race that wiped Pass A:**
- Client-side `storyData` in Nick's browser was pre-edit when his notes triggered auto-save
- The save sent his full in-memory JSON back to the server, overwriting my 12 additions
- Scene 29 survived only because uploads/deletes hit server-side endpoints that mutated the JSON atomically (separate code path)

**Recovery steps (strict order):**
1. **Nick stops typing in the browser.**
2. Nick hard-reloads `localhost:8500/p/jersey-stack-ep1-transistor/` (Cmd+Shift+R) — this pulls fresh JSON from disk.
3. Re-run the Pass A Python script (I have it — same 12 additions, skips anything already present).
4. Nick reloads again to see the re-applied assets.

**v2.1 fix (future):** Server should implement optimistic concurrency — accept saves only if the client's JSON includes a version counter / mtime that matches the server's current state. Reject with 409 on conflict. This is the right long-term fix and goes on the v2.1 list alongside trim markers and reorder-drag.

---

## Section 4 — Pass B AI Generation Prompts

Each prompt is written in the Nick-canonical style (photographic, period-accurate, 16:9, not AI-slop-flat). Handoff target: Video Asset Generator agent.

### Scene 6 × 2 — Monopoly Bet & Kelly

**6a.** "Black-and-white documentary photograph, 1945, Bell Telephone Laboratories Murray Hill. Mervin Kelly, mid-40s, director of research, standing in shirtsleeves at a conference-room table with blueprints and circuit diagrams spread out. Warm overhead tungsten light, mid-century office architecture visible. Photojournalistic, shallow depth of field. Not a headshot — him mid-thought, caught between sentences. 16:9."

**6b.** "Visual metaphor still. A Monopoly board game photographed at dramatic angle, deep blacks and warm spotlight, with the center properties replaced by hand-lettered cards reading 'TELEPHONE' and 'TELEGRAPH'. The hotel token is replaced by a tiny brass vacuum tube. Cinematic product photography. 16:9."

### Scene 7 × 2 — 700-Foot Corridor

**7a.** "Black-and-white photograph, 1948, interior of Bell Telephone Laboratories Murray Hill. An extremely long fluorescent-lit research corridor with numbered office doors on both sides stretching to a vanishing point. A lone scientist in white shirt walks away from camera down the middle of the hallway. Institutional mid-century modernism. Photojournalistic, natural fluorescent lighting. 16:9."

**7b.** "Black-and-white photograph, 1948. A floor plan of Bell Labs Murray Hill pinned to a bulletin board, with the 700-foot research wing marked with red engineer's pencil. Desk lamp light from the lower-right corner. Shallow DOF. 16:9."

### Scene 13 × 2 — Bardeen & Shockley

**13a.** "Atmospheric photograph, late 1947, interior Bell Labs Murray Hill. John Bardeen, wearing a rumpled white shirt and tie, sitting alone at his desk at 2am. A single desk lamp, a half-drunk cup of coffee, notebooks full of equations. He is staring at a chalkboard covered in quantum mechanics notation. His face is partially shadowed, eyes unfocused, mid-thought. 'What he was thinking' — introspective, solitary genius. Warm tungsten light. 16:9."

**13b.** "Black-and-white photograph, Murray Hill, November 1947. William Shockley, mid-30s, intense dark hair and piercing gaze, leaning over a laboratory bench with point-contact apparatus. Fluorescent overhead light, metal shelving with vacuum tubes behind him. Tight framing, photojournalistic. Not a posed portrait. 16:9."

### Scene 14 × 1–2 — The Setup

**14a.** "Black-and-white photograph, Bell Labs Murray Hill, December 1947. A laboratory workbench close-up: a germanium crystal clamped in a small vise, two delicate gold wire contacts descending toward it from a manipulator apparatus. An oscilloscope screen glowing faintly in the background. Overhead fluorescent light casting specular highlights on brass instrumentation. Macro photography, extreme shallow DOF. No people visible. 16:9."

### Scene 15 × 2 — The Demo (HERO)

**15a.** "Photograph, Bell Labs Murray Hill, December 23, 1947. Three men — Bardeen (older, calm, tie), Brattain (energetic, glasses), Shockley (intense, dark-haired) — crowded around a small laboratory bench. One man's hand holds a headphone to his ear, mouth slightly open in surprise. Another reaches toward an amplifier dial. The third watches the oscilloscope. Dramatic overhead fluorescent light. Photojournalistic documentary framing, black and white, high contrast. This is the moment of discovery. 16:9."

**15b.** "Extreme close-up of a 1940s oscilloscope screen. A sine-wave input is shown on one channel; on the output channel, the same sine wave appears eighteen times taller. Green phosphor glow on black. Text overlay across the bottom: 'GAIN: 18×'. Film grain, cinematic. 16:9."

### Scene 16 × 2 — Bardeen Goes Home

**16a.** "Black-and-white photograph, December 23 1947, ~6pm. John Bardeen walking up a snowy suburban sidewalk in Summit NJ toward a modest two-story colonial house with warm windows glowing yellow. Overcoat, hat, briefcase. Christmas tree visible through the front window. Quiet, intimate. Photojournalistic. 16:9."

**16b.** "Black-and-white photograph, 1947. A middle-aged woman at a 1940s kitchen stove stirring a pot, her husband (John Bardeen, wearing his overcoat, briefcase still in hand) stands in the doorway. His face is flushed. She hasn't turned around yet. The moment just before he tells her. Domestic, intimate, photojournalistic. 16:9."

### Scene 18 × 1 — Four Weeks in Chicago

**18a.** "Black-and-white photograph, Chicago, January 1948. William Shockley alone at a desk in a hotel room — not a suite, a working room. Yellow legal pads covered in equations spread across the desk and floor. A window behind him shows a snowy Chicago street and the Palmolive building. Desk lamp. He is writing, not posed. Photojournalistic. 16:9."

### Scene 19 × 1 — The Team Breaks

**19a.** "Black-and-white photograph, Bell Labs Murray Hill, January 1948. An office meeting — Bardeen, Brattain, Shockley seated around a small table, plus two other scientists. Body language cold: Shockley is leaning forward aggressively, Bardeen is looking at the table, Brattain's eyes flick between them. Papers in disarray. Fluorescent overhead. Tense. Photojournalistic. 16:9."

### Scene 20 × 2 — Press Conference

**20a.** "Black-and-white photograph, June 30 1948, Bell Labs conference room, New York. Ralph Bown — suit, grey hair — standing at a podium beside an oversized plywood-and-brass model of a point-contact transistor (roughly 18 inches long, clearly a teaching prop). Flashbulbs going off. Rows of reporters with notebooks visible. Period-accurate press photography. 16:9."

**20b.** "Newspaper front page, late June 1948. Grainy halftone photo of the transistor model at center. Headline (large serif): 'NEW RADIO DEVICE MAY REVOLUTIONIZE ELECTRONICS'. Subhead: 'Bell Labs unveils vacuum-tube successor'. Period newsprint texture, yellowed. Close enough to read the headline. 16:9."

### Scene 24 × 1 — Consent Decree (already has motion graphic; add metaphor)

**24a.** "Photograph, Washington DC 1956. A Justice Department conference room with an oversized blueprint of the Bell System laid out on the table. A man's hand holds a ceremonial gavel about to strike — motion blur. Around the edges of the blueprint, scattered documents marked 'FINAL JUDGMENT.' Symbolic, cinematic. Warm tungsten light. 16:9."

### Scene 25 × 1 — Traitorous Eight Composite

**25a.** "Documentary-style composite photograph, 1957. Eight young men (ages 28–38) in suits standing outside a low-slung Mountain View California industrial building, blue California sky. Identifiable from period photographs: Robert Noyce center-left, Gordon Moore next to him, Gene Kleiner, Jean Hoerni, Sheldon Roberts, Jay Last, Vic Grinich, Julius Blank. Not a posed formal group — conversational, one is laughing, one is lighting a cigarette. Documentary realism, natural golden-hour light. 16:9."

### Scene 26 × 2 — Silicon Valley Payoff

**26a.** "Motion-graphic-style logo sequence. Four logos on black: 1957 Fairchild (vintage mid-century lettering) → 1968 Intel (early logo, serif) → 1969 AMD (red triangle era) → 1972 Kleiner Perkins (text-only lockup). Crisp, cinematic. Each logo occupies center frame in sequence with subtle forward zoom. 16:9."

**26b.** "Aerial photograph, Santa Clara Valley California, 1972. The valley still half-orchards, half-industrial. Hills visible in distance. Wide establishing. Natural golden hour. 16:9."

---

## Section 5 — Additional Issues

- **Scene 19 duration field is empty in `storyboard-data.json`.** Setting to 40s to match narration. Fix applied in next JSON pass.
- **Scene 7 LOC candidates are 15KB / 27KB previews.** When Nick visually confirms which one is actually the corridor, we pull the full-res TIFF from LOC. Until then, they're placeholders for triage — don't ship.
- **Scene 14 LOC preview is 14KB.** Same caveat. Visual QC needed.
- **Scene 29 cutaway montage images not yet added.** Need to pick from `research/severance-refs/` + `_src/` + potentially more archival. This is a separate ~15-minute task after Nick confirms the montage plan.
- **Duration fields across the storyboard use mixed formats.** Most scenes have `"duration": "0:00-0:25 (25s)"` but some may be inconsistent. Worth a one-time cleanup pass.
- **Thumbnails section is empty** (`thumbnails: []`). Thumbnail development was deferred and is out of scope for this revision plan.

---

## Section 6 — Next Steps (ordered)

1. **Nick** hard-reloads the storyboard app.
2. **Me** re-applies Pass A (12 assets across 7 scenes) + sets Scene 19 duration to 40s.
3. **Nick** visually QCs Scene 7 and Scene 14 LOC preview candidates in the app; pick or discard.
4. **Nick** confirms Scene 1 retime (25s → 7s) and Scene 29 cutaway plan (Option B montage using existing Bell Works stills).
5. **Me** kicks off Video Script Writer to reconcile narration for S1 → S2 flow and generate the Scene 29 cutaway list.
6. **Me** kicks off Video Asset Generator for Pass B (~14 AI images with the prompts in Section 4).
7. **Video Assembler** re-renders a new draft once Pass B images land. Target runtime: ~15:00.
8. **Nick** reviews draft v8 in the storyboard app + the assembled MP4.

Estimated elapsed: 1–2 hours for steps 2–6, depending on AI gen queue. Step 7 renders in ~15 min.

---

## Deferred to v2.1 of the storyboard app

- Optimistic concurrency (server rejects stale client saves)
- Trim in/out markers per video
- Zoom/pan markers per asset
- Drag-to-reorder assets within a scene
- Port allocation registry (if we ever run multiple instances)
