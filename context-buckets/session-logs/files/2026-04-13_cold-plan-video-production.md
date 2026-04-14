# Cold Plan YouTube Video — Full Production Session

**Date:** 2026-04-13 to 2026-04-14
**Session type:** execution
**Agents involved:** YouTube Content Team (orchestrator), Video Script Writer, Video Asset Generator, Video Assembler, Video Publisher, Short-Form Video Strategy, Chrome Browser (YouTube Studio)

## Summary

Full end-to-end YouTube video production for Cold Plan — from creative brief through published video with end screen cards and 5 trailer-style shorts. The video "NyQuil Costs $12. These 3 Pills Cost $0.47." is a consumer advocacy exposé in Falore-style illustrated art.

## Key Findings

- Wife's feedback ("felt she was being taught without understanding why") led to adding a "cold open" — relatable sick-in-a-hotel scene before the price reveal
- DALL-E images were noticeably worse than gpt-image-1 — user could immediately tell (saved as permanent feedback)
- Subagent forked contexts cannot access MCP image generation tools — had to generate all 23 images directly from main context
- Brand breakdown recipe card images already contained text — text overlays were redundant and removed from 5 scenes
- The "$0.47" title hook is rounded up from actual bulk cost of ~$0.12/dose — both defensible

## Decisions Made

- Angle: Price reveal hook (not founder story as frame) — founder story woven in mid-video
- Style: Falore-style (warm illustrated, karaoke text, faceless) inspired by a cat video channel
- Voice: Onyx (OpenAI tts-1-hd)
- Image model: gpt-image-1 only — DALL-E permanently banned
- Cold open: Hampton Inn, Kokomo, Indiana (not Hyderabad — US audience, relatable mundanity)
- Founder story: "30-year idea finally built" (not sick-day epiphany)
- CTA: Values-driven ("free, no ads, no tracking — use Amazon links to keep it that way")
- End screen: "I Recovered My Dad's Voice" + "Batter Up: Jolly Roger"
- Shorts: Trailer-style (not sequential clips) — 5 built

## Artifacts Created

- `teams/youtube-content/projects/cold-plan-video/script/outline.md`
- `teams/youtube-content/projects/cold-plan-video/script/script.md`
- `teams/youtube-content/projects/cold-plan-video/script/storyboard.md`
- `teams/youtube-content/projects/cold-plan-video/script/storyboard.pptx`
- `teams/youtube-content/projects/cold-plan-video/project.json`
- `teams/youtube-content/projects/cold-plan-video/assets/images/scene_*.png` (23 scenes + cold open)
- `teams/youtube-content/projects/cold-plan-video/assets/audio/narration/scene_*.mp3` (21 narration + 3 v2 replacements)
- `teams/youtube-content/projects/cold-plan-video/assets/thumbnails/thumbnail.png`
- `teams/youtube-content/projects/cold-plan-video/output/cold-plan-final-v3.mp4` (7:03, 232 MB)
- `teams/youtube-content/projects/cold-plan-video/shorts/` (5 shorts with metadata)
- YouTube: public v1 (ZxknYxKfDMg), unlisted v3 (nrFaDb8CSF0)

## Open Items

- [ ] Make v3 (nrFaDb8CSF0) public, unlist/delete v1 (ZxknYxKfDMg)
- [ ] Upload 5 shorts to YouTube/TikTok/Instagram (stagger over 14 days)
- [ ] Add Whisper subtitles to shorts
- [ ] Monitor Amazon affiliate conversions (deadline ~Oct 10, 2026)
- [ ] Social distribution campaign
- [ ] Consider Whisper subtitles on main video too

## Context for Next Session

The main video is live (unlisted) with end screen cards configured. 5 trailer-style shorts are built locally but not uploaded. Next priority is making v3 public, cleaning up v1, and starting the shorts posting cadence to drive traffic. The Amazon 180-day clock is ticking — need 3 qualifying sales by ~Oct 10, 2026.
