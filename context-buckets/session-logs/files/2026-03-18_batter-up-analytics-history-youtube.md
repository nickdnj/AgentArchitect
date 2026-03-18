# Batter Up LI — GA4 Analytics, History Page, YouTube Video Project

**Date:** 2026-03-18
**Session type:** mixed (execution + production)
**Agents involved:** Voice Local, YouTube Content Team (Video Script Writer, Video Asset Generator), Max (research)

## Summary

Full voice session covering three major workstreams for the Batter Up LI website (batterupli): added Google Analytics 4 tracking to all pages, built a heritage history page connecting Batter Up to Jolly Roger's / Nunley's Happyland, and launched a YouTube documentary video project that produced a complete script, storyboard, PowerPoint review deck, and all 20 AI-generated scene images.

## Key Findings

- **Batter Up LI** had NO analytics before this session — Firebase config had no `measurementId`
- **GA4 Property created:** "Batter Up LI" — Measurement ID: `G-CG1Y1F9J62`, web stream for `batterup-li.web.app`
- **Jolly Roger's history**: Batting cages at 130 Hicksville Road appear on Wikimapia as "built 1979" — one year after Happyland closed (1978). M&M Batter Up Inc. incorporated ~1986 with Nickolas DeMarco as CEO.
- **1984 acquisition**: Partnership between Nick's dad (day-to-day operations) and **John Simons** (silent partner). Note: spelling uncertain — user said "I think it's Simons" but may be "Simonsick."
- **"DeMarco"** is one word, capital D and capital M — corrected throughout all scripts
- **History page** built but NOT linked in nav — user wants to edit before publishing
- **20 scene images generated** (1792x1024, ~68 MB total) covering all chapters of the video

## Decisions Made

- GA4 tracking code added to all 5 HTML pages: index, pricing, contact, attractions, hours
- History page (`history.html`) exists at direct URL but excluded from nav until user approves
- YouTube video: 5-8 min, upbeat local news documentary tone, Ken Burns visual style
- Pipeline stopped at PowerPoint storyboard per user request (review before proceeding)
- Narration to use TTS after image review and approval
- Video to stop at finished file (not auto-upload to YouTube)

## Research Sources

- Wikimapia entry for 130 Hicksville Road — confirmed batting cages "built 1979"
- Long Island history sites re: Nunley's Happyland opening date (Columbus Day 1951), German mechanical organ, William and Miriam Nunley
- Nassau County records / M&M Batter Up Inc. incorporation documents confirming Nickolas DeMarco

## Artifacts Created

- `/Users/nickd/Workspaces/batterupli/public/history.html` — Heritage timeline page (unpublished from nav)
- GA4 snippet added to: `index.html`, `pricing.html`, `contact.html`, `attractions.html`, `hours.html`
- `teams/youtube-content/projects/batter-up-history/script/script.md` — Full 20-scene narration (~980 words, 6:32 runtime)
- `teams/youtube-content/projects/batter-up-history/script/storyboard.md` — 20-scene visual descriptions and production notes
- `teams/youtube-content/projects/batter-up-history/script/storyboard.pptx` — 29-slide PowerPoint review deck
- `teams/youtube-content/projects/batter-up-history/images/scene-01.png` through `scene-20.png` — All 20 AI-generated scene images

## Updates — 2026-03-18 (continuation session)

**Additional work completed:**
- PPTX regenerated with actual scene images embedded (69 MB, 29 slides, each shows real image + narration text)
- Audio narration generated: 19 clips, voice "onyx" (OpenAI TTS-1-HD), total ~5:58 runtime
- Background music generated: `audio/music/ambient-background.wav`, 7:11, warm Americana style
- **Bug**: Scenes 10-20 initially contained wrong narration (Massapequa video content mixed in by the generator agent). Scenes 10-20 were individually regenerated with correct Batter Up narration text.
- **Video assembled**: `output/batter-up-history-v1.mp4` — 6:15, 141 MB, 1920x1080 H.264, 24fps
- **Known issue in v1**: Scene 18 text overlay reads "Nunleys Carousel — Long Island Childrens Museum" (apostrophes stripped by FFmpeg filter). Easy fix in v2.
- **AI images are placeholders**: Nick confirmed the AI images are a straw man — real family photos will replace them in a future revision.

## Open Items

- [ ] **Confirm partner's last name**: "John Simons" or "John Simonsick" — user was unsure. Verify before finalizing script.
- [ ] **Review and edit history.html** — page exists at direct URL, needs edits before linking in nav
- [ ] **History page nav link** — Add to nav.js once user approves edits
- [ ] **Replace AI placeholder images** with real family photos (to be gathered by Nick/family)
- [ ] **Fix Scene 18 apostrophes** in text overlay ("Nunley's Carousel", "Children's Museum") — render as image composite or use FFmpeg drawtext workaround file
- [ ] **Video v2** — Assemble after image replacements and any other edits
- [ ] **YouTube publish** — when v2 is ready

## Context for Next Session

The Batter Up YouTube documentary video is complete as a v1 draft: `teams/youtube-content/projects/batter-up-history/output/batter-up-history-v1.mp4` (6:15, 141 MB). All AI-generated images are considered placeholders — Nick plans to gather real family photos to swap in for a v2. The script and storyboard live at `script/script.md` and `script/storyboard.md`. The updated PPTX (with real images) is at `script/storyboard.pptx`. The Batter Up website history page (`history.html`) exists but is not linked in nav — Nick wants to edit it first. Partner name "John Simons" in Scene 15 narration is still unconfirmed spelling.
