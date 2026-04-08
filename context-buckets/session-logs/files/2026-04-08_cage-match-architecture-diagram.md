# Cage Match — Hardware Architecture Diagram Session

**Date:** 2026-04-08
**Session type:** execution
**Agents involved:** Voice Mode, Chrome Browser

## Summary

Ordered the Jetson Orin Nano Super ($249, arrives Apr 9) and Arducam Day/Night IMX477 for Jetson ($64.99, same-day delivery). Then built an interactive isometric hardware architecture diagram from scratch using HTML Canvas, iterating through ~15 revisions via voice mode + Chrome screenshots. The diagram accurately reflects the real Batter Up cage geometry (pie-slice/radial layout from Google Maps aerial view) with all hardware placed in correct physical positions.

## Key Findings

- Batter Up cages are arranged in a radial/pie-slice pattern from a central pitching machine house (9 cages), NOT parallel rectangles as originally assumed
- Each cage is a trapezoid: narrow (~8ft) at machine house, wide (~14ft) at batter end, ~70ft long
- Chain-link fence only wraps around the batter enclosure area (last ~10ft), rest is open lane
- Door is on the back wall of the batter enclosure (facing away from pitcher)
- Camera position on back wall above door gives FOV covering both batter AND all target zones in one frame
- The Arducam Day/Night IMX477 was chosen over the autofocus version: fixed focus is correct for a fixed-mount camera, and IR-cut switching handles day/night outdoor operation

## Decisions Made

- **Camera:** Arducam Day/Night Vision IMX477 for Jetson Orin NX ($64.99) — Jetson-native 22-pin CSI, automatic IR-cut for outdoor day/night
- **Physical layout:** Token machine + Jetson stacked outside door, display above door, camera above display, speaker on fence rail, ESP32 near machine house
- **Camera FOV:** Single camera covers full cage (batter + ball trajectory + all 5 target zones)
- **Proof of concept:** Just camera + Jetson needed — no LED targets required for initial demo
- **Patent:** Provisional patent ($320) noted as future to-do — specific system combination may be novel, individual components are prior art
- **Batter stick figure:** Attempted, removed — didn't look good enough

## Artifacts Created

- `cage-match/static/cage_diagram.html` — Interactive isometric diagram (HTML Canvas, ~350 lines)
- `cage-match/static/cage_architecture.png` — Exported PNG of the official hardware architecture
- `teams/youtube-content/projects/batter-up-history/output/mockup_architecture.png` — Replaced old AI-generated diagram with new one
- Updated `~/.gstack/projects/nickdnj-AgentArchitect/nickd-main-design-20260407-141451.md` — Physical layout section rewritten
- Updated `~/.claude/projects/.../memory/project_cage_match.md` — Physical layout + hardware order details

## Open Items

- [ ] Hardware arrives: camera today (Apr 8), Jetson tomorrow (Apr 9)
- [ ] Flash JetPack on Jetson Orin Nano Super
- [ ] Write real OpenCV camera driver (replace emulator)
- [ ] Test ball detection with tennis ball at home
- [ ] Walk into Batter Up with Jetson+camera and prove CV in 10 minutes
- [ ] File provisional patent ($320) before showing the system publicly
- [ ] Talk to brother once proof of concept works
- [ ] Write ESP32 firmware for LED targets (Phase 2, after CV proven)

## Updates — Apr 8 (continued session)

### Production Code Build (all 6 tasks completed)
1. **CV Pipeline** (`cage-match/src/camera/cv_pipeline.py`) — BallDetector + TrajectoryAnalyzer with CUDA/CPU MOG2 fallback
2. **Jetson Camera Driver** (`cage-match/src/camera/jetson_tracker.py`) — Production BallTracker with GStreamer CSI pipeline for IMX477
3. **Calibration UI** (`cage-match/static/calibrate.html`) — Click-to-define target zones, saves to config/zones.json
4. **Production Mode** wired in main.py — `CAGE_MATCH_MODE=production` imports JetsonBallTracker
5. **Game Over Polish** — Stats breakdown (zones hit, max streak, best pitch), score recap on name entry
6. **Sound Effects** — 3 Mixkit (bat_crack, crowd_roar, crowd_ooh) + 9 ElevenLabs Kirt voice clips (home_run, triple, double, foul_ball, perfect_game, new_high_score, game_over, batter_up, step_up)

### Business Plan Updates
- Regenerated Word doc with: new architecture diagram, new dusk exterior render, real game screenshots (attract + in-game), new batter POV render
- All committed to cage-match repo (8ae944a) and AgentArchitect repo (f2ebec1)

### CV Ball Detection Prototype
- Tested 3 versions (v1-v3) on YouTube batting cage video
- Background subtraction works but 30fps side-angle video is too different from our 120fps behind-batter setup
- Saved as starting point for real camera testing

### GStack
- Upgraded to v0.16.0.0, auto-upgrade enabled

## Context for Next Session

All production code is built and committed. Hardware architecture diagram is the official reference. Business plan has real screenshots. The cage-match repo has everything ready for plug-and-play when the Jetson arrives (Apr 9).

**Immediate next steps when hardware arrives:**
1. Flash JetPack on Jetson Orin Nano Super
2. Run `CAGE_MATCH_MODE=production python3 main.py` — camera driver should connect
3. Test ball detection with tennis ball at home
4. Use `/calibrate` page to define real target zones from camera feed

**Reviews to run in next session (fresh context):**
- `/plan-eng-review` on cage-match codebase (architecture review)
- `/qa http://localhost:8080` (browser QA of game app)
- `/review` (code review of recent commits)

**Other open items:**
- File provisional patent ($320) before showing system publicly
- Talk to brother once proof of concept works
- Write ESP32 firmware for LED targets (Phase 2)
- Download better sound effects from Pixabay/Freesound if current ones aren't good enough
