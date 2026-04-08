# Cage Match — Full Build Session (Concept to Prototype)

**Date:** 2026-04-07 through 2026-04-08
**Session type:** execution
**Agents involved:** Voice Mode, Web Research, GStack Office Hours, Chrome Browser, GPT Image, Gmail

## Summary

Built the Cage Match gamified batting cage system from initial concept through a fully playable emulated prototype in a single marathon session. Started with voice brainstorming about vintage baseball pinball machines, produced a complete business plan with competitive analysis and BOM, ran it through GStack Office Hours (startup mode), then built the entire emulated software stack, iteratively designed the UI using Chrome tools for real-time QA, and pushed to a private GitHub repo.

## Key Findings

- Long Island has zero gamified batting cage experiences — complete market gap
- Batbox raised $7.3M for "TopGolf of baseball" but no East Coast locations
- TopGolf lost nearly $1B in value (Mar 2026) due to high fixed costs — validates low-cost approach
- HitTrax costs $10-20K per cage; Cage Match MVP is $1,600 — 10x cheaper
- Customers at Batter Up already compete informally (counting hits, trash-talking) — game formalizes existing behavior
- The Jetson Orin Nano Super ($249) + Arducam IMX477 ($65) can do ball tracking at 120fps
- Simple blob detection (OpenCV background subtraction) is sufficient — no deep learning needed
- Outdoor display needs bright parchment background with dark text, not dark/neon

## Decisions Made

- Build custom hardware from ground up (no HitTrax partnership)
- MVP approach: $1,600, zero disruption to existing operations, same token price
- Target user: casual adult groups (20-30s) — the TopGolf demographic
- Hardware: Jetson Orin Nano Super, Arducam IMX477, ESP32 + WS2812B LEDs
- CV approach: background subtraction + centroid tracking (not deep learning)
- Vintage 1940s pinball machine aesthetic for UI
- Zone names: Home Run (1000), Triple (500), Double (300), Single (200), Bunt (100)
- Auto-pitch every 5 seconds (matches real pitching machine cycle)
- Outdoor-friendly bright parchment panels with dark text
- ElevenLabs for umpire voice calls (Kirt voice)
- Approach A (Narrowest Wedge) selected via GStack Office Hours

## Research Sources

- Baseball pinball research: `teams/youtube-content/projects/batter-up-history/output/baseball_pinball_research.md`
- Competitive analysis: `teams/youtube-content/projects/batter-up-history/output/batting_cage_competitive_analysis.md`
- BOM: `teams/youtube-content/projects/batter-up-history/output/cage_game_bom.md`
- GStack design doc: `~/.gstack/projects/nickdnj-AgentArchitect/nickd-main-design-20260407-141451.md`
- D Magazine TopGolf article (Mar 2026): TopGolf lost ~$1B in value
- Batbox Series A ($7.3M): PR Newswire
- HitTrax pricing: Brooklyn Sluggers $60/30min, $85/hr

## Artifacts Created

- **GitHub repo**: github.com/nickdnj/cage-match (private, 6 commits)
- **Software**: Full emulated game stack at ~/Workspaces/cage-match/
  - Game engine (Python/FastAPI/WebSocket)
  - Hardware abstraction layer (camera, targets, token)
  - Emulators for all hardware
  - Vintage pinball web UI with canvas rendering
  - Sound engine (Web Audio API + MP3 clips)
  - SQLite leaderboard
- **Business plan**: Word doc emailed to nickd@demarconet.com
- **Business plan markdown**: `teams/youtube-content/projects/batter-up-history/output/cage_match_business_plan.md`
- **AI images**: Stadium background, attract screen backglass, mockups (5+)
- **Sound files**: ElevenLabs umpire calls (strike, play_ball, youre_out), Mixkit crowd/organ
- **GStack design doc**: APPROVED, 2 rounds adversarial review, 8/10 quality score
- **Memory**: `~/.claude/projects/.../memory/project_cage_match.md`

## Open Items

- [ ] Download better sound effects (crowd cheer, bat crack, home run crowd) from Pixabay/Freesound
- [ ] Order Jetson Orin Nano Super ($249) + Arducam IMX477 ($65) for CV prototyping
- [ ] Inspect token machine at Batter Up — confirm signal type for optocoupler
- [ ] Write real OpenCV camera driver (swap for emulator)
- [ ] Write ESP32 firmware for LED targets (MQTT listener, WS2812B animations)
- [ ] Polish game over / name entry screens
- [ ] Test CV ball tracking with real footage (tennis ball at home first)
- [ ] Talk to brother about cage conversion pilot

## Context for Next Session

Cage Match is a fully playable emulated prototype at ~/Workspaces/cage-match (GitHub: nickdnj/cage-match). Run with `CAGE_MATCH_MODE=emulated python3 main.py` and open localhost:8080. The UI has a vintage pinball aesthetic with an AI-generated attract screen and stadium background. All game logic, scoring, multipliers, foul balls, and leaderboard are working. Sound has ElevenLabs umpire calls and synthesized pinball effects. The next engineering step is ordering the Jetson + camera and testing real CV ball tracking. The next business step is talking to the brother about the pilot cage.
