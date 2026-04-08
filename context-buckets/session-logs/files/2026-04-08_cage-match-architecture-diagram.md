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

## Context for Next Session

Hardware architecture diagram is DONE and saved as the official reference. The Jetson and camera are ordered and arriving Apr 8-9. The next engineering milestone is plugging the IMX477 into the Jetson, running OpenCV, and proving ball zone detection with a real ball. The proof of concept only needs camera + Jetson — no LED targets, no ESP32, no cage modifications. The user wants to prove CV ball tracking works before talking to his brother about converting a cage.
