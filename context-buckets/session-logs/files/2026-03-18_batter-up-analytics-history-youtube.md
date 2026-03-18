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

## Open Items

- [ ] **Confirm partner's last name**: "John Simons" or "John Simonsick" — user was unsure. Verify before finalizing script.
- [ ] **Review and edit history.html** — page exists at direct URL, needs edits before linking in nav
- [ ] **Image approval** — user was reviewing images in Finder at end of session; provide feedback before moving to audio
- [ ] **Audio production (Gate 2)** — Generate narration .wav files for scenes 2-20 + background music (Video Asset Generator, audio-only mode)
- [ ] **Update storyboard PPTX with actual images** — deck currently has text descriptions; regenerate with embedded scene images
- [ ] **Video assembly** — After audio approval, delegate to Video Assembler
- [ ] **History page nav link** — Add to nav.js once user approves edits

## Context for Next Session

The YouTube documentary project is mid-pipeline: storyboard approved (PowerPoint reviewed), 20 images generated. Nick was reviewing images when session ended. Next step is image feedback → audio production via Video Asset Generator in audio-only mode (19 narration clips, 1 background music track) → audio review → final assembly. The script is at `teams/youtube-content/projects/batter-up-history/script/script.md` and storyboard at `.../storyboard.md`. Partner name "John Simons" may need verification — appears in Scene 15 narration. The Batter Up website has a new history page that needs editing + approval before it goes into the nav.
