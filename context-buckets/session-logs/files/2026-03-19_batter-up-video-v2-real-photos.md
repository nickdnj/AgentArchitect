# Batter Up History Video — V2 Assembly with Real Archival Photos

**Date:** 2026-03-19
**Session type:** execution
**Agents involved:** Voice Local, Video Assembler

## Summary

Continued the Batter Up history YouTube video project. Reviewed 26 real archival photos Nick provided (18 Jolly Roger's/Happyland and 8 Batter Up), mapped each to the appropriate video scenes, and assembled v2 replacing AI placeholder images with real photos wherever available. Fixed the Scene 18 apostrophe issue and added blurred pillarbox treatment for portrait/square photos.

## Key Findings

**Real photos provided and their scene mappings:**
- **jr1.jpg** — Wide street shot: Smiley's Happyland sign, Ferris wheel, rides, Jolly Roger sign → Scene 6 (Park in Its Glory)
- **jr2.jpg** — Indoor carousel and bumper boats, people having fun → Scene 6 alt
- **jr3.jpg** — Four-panel collage of rides and families with Jolly Roger sign → Scene 10 (Peak Jolly Roger's)
- **jr4.jpg** — Kids on carousel, older photo → Scene 6 alt
- **jr5.jpg** — Jolly Roger restaurant postcard "On Hempstead Turnpike, Bethpage L.I., N.Y." → Scene 8 (Restaurant Opens)
- **jr6.jpg** — Jolly Roger matchbook cover (upside down in scan) → not used in v2
- **jr7.jpg** — Kid on carousel horse reaching for brass ring, B&W → not used in v2
- **jr8.jpg** — Nunley's Happyland at night, neon signs glowing, B&W → Scene 5 (Park Opens)
- **jr9.jpg** — Nunley's Happyland entrance daytime in color → not used in v2 (jr8 preferred)
- **jr10.jpg** — Jolly Roger restaurant interior soda fountain, B&W → not used in v2 (jr5 postcard preferred)
- **jr11.jpg** — ACTUAL Robin Hood sign (renamed from Jolly Roger) → Scene 11 (Decline) — perfect
- **jr12.jpg** — Fortune teller arcade machine → not used
- **jr13.jpg** — Vintage aerial B&W of undeveloped suburban Long Island with Grumman racetrack visible → Scene 4 (Nunley's Vision)
- **jr14.jpg** — Annotated aerial map of full complex with colored markers showing park, restaurant, batting cages → Scene 9 (Expansion)
- **jr15.jpg** — 1965 COLOR photo of Ruth organ at Nunley's Happyland (Photo: Robert A. Miller) → Scene 7 (Mechanical Organ)
- **jr16.jpg** — B&W photo of families crowded around the Ruth organ → not used (jr15 preferred)
- **jr17.jpg** — Colored Ruth organ "A. Ruth & Sohn Waldkirch" with musician figures → Scene 7 alt
- **jr18.jpg** — Close-up of organ musician carved figures → not used

- **bu1.jpg** — Batter Up logo (Batting Cage & Bethpage Mini Golf) → not used as scene image
- **bu2.jpg** — Mini golf course with batting cages in background, blue sky → Scene 16 (Batter Up Today)
- **bu3.jpg** — Batting cages exterior daytime → Scene 14 (The Survivor)
- **bu4.jpg** — Mini golf with picnic tables, overcast → not used (bu2 preferred)
- **bu5.jpg** — People at batting cages with "Batter Up Home of..." sign → Scene 17 (Family Legacy)
- **bu6.jpg** — Beautifully landscaped mini golf, flowers, sunny → Scene 20 (Closing)
- **bu8.jpg** — Families at batting cages at sunset/dusk → Scene 2 (Modern Batter Up)
- **bu9.jpg** — Batter Up parking lot and entrance with colorful tent structures → Scene 3 (The Reveal)

**Technical notes:**
- Real photos are square/portrait; pillarbox with blurred background applied for all non-landscape images
- Video went from 141MB (v1 AI images) to 78MB (v2 real photos) due to smaller source image resolution
- Scene 18 apostrophes fixed using Pillow-rendered PNG overlay instead of FFmpeg drawtext

## Decisions Made

- Keep AI images for: Scene 1 (title card), Scene 12 (demolition), Scene 13 (strip mall), Scene 15 (rebuild), Scene 18 (carousel), Scene 19 (community memory)
- Use real photos for: Scenes 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 14, 16, 17, 20
- Blurred pillarbox (not hard black bars) for all square/portrait photos
- Git: added `.gitignore` in `projects/` to exclude all audio/video files from git tracking (GitHub 100MB limit)

## Artifacts Created

- `output/batter-up-history-v2.mp4` — 6:15, 78MB, 1920x1080 H.264, 14 real photos + 6 AI scenes
- `images/bu1.jpg` through `bu9.jpg` (8 Batter Up real photos, committed)
- `projects/.gitignore` — excludes *.mp4, *.wav, *.mov, assembly/ from git
- v1 preserved at `output/batter-up-history-v1.mp4` (local only, not in git)

## Open Items

- [ ] **Nick to review v2** and give feedback — was watching at end of session
- [ ] **Confirm partner's last name**: "John Simons" or "John Simonsick" in Scene 15 narration
- [ ] **History page editing** — `batterupli/public/history.html` exists but not linked in nav yet
- [ ] **Potential improvements**: jr2 (indoor carousel), jr4 (kids on carousel), jr7 (kid on horse), jr10 (restaurant interior), jr17/jr18 (organ close-ups) are great photos not yet in the video — could use for variations
- [ ] **YouTube publish** — when v2 is approved (or v3 after any final tweaks)

## Context for Next Session

V2 of the Batter Up history documentary is assembled at `teams/youtube-content/projects/batter-up-history/output/batter-up-history-v2.mp4` (78MB, 6:15). Nick was watching it at the end of the session. If he approves, the next step is YouTube metadata and upload via the Video Publisher agent. If he wants changes, identify specific scenes and either swap images or regenerate narration. The real photo collection (jr1-jr18 + bu1-bu9) is in the `images/` folder — many quality photos weren't used in v2 that could be added (jr2, jr4, jr16, jr17, jr18, bu4). The history page for the Batter Up website (`batterupli/public/history.html`) still needs editing before being linked in nav.
