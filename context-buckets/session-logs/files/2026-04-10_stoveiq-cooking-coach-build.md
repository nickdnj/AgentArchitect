# StoveIQ: From Breadboard to Cooking Coach in One Session

**Date:** 2026-04-10
**Session type:** execution
**Agents involved:** hardware-dev (orchestrator), Firmware Engineer, MCAD Engineer, YouTube Content Team (Script Writer, Asset Generator, Video Assembler)

## Summary

Took StoveIQ from bare components to a fully functional open-source cooking coach running on the home network. Started with breadboard education, wired ESP32-S3 + MLX90640, fixed 3 firmware boot crashes, got BLE WiFi provisioning working, built a full cooking coach web dashboard with thermal-aware recipes, burner calibration UI, simulation mode, and a PWA manifest. Also designed the PVC pipe enclosure, created the recipe JSON schema and community repo structure, planned the Hackaday.io project page, and produced a complete YouTube video draft (script, storyboard, 13 voiceover files, 7 AI images, assembled 7:38 draft).

## Key Findings

- ESP-IDF 5.5.3 moved `mdns` to a managed component — needs `idf_component.yml`
- Event loop + netif + WiFi must be initialized in `main.c` BEFORE BLE provisioning starts
- `wifi_manager.c` was double-initializing the event loop — needed idempotent init calls
- BLE provisioning stores creds in NVS namespace `wifi_creds` (keys: `ssid`, `pass`) — wifi_manager was reading from different namespace `stoveiq`
- MLX90640 I2C address confirmed at 0x33 on the Adafruit breakout
- 1.5" Schedule 40 PVC pipe is the right size for the enclosure (40.9mm ID, 7.7mm clearance)
- Actual BOM cost: $102.71 from Adafruit (not $50 — updated all materials to say $100)

## Decisions Made

- **Safety product ABANDONED** — Pippa patent (EP3908785B1) kills commercial safety claims
- **Pivoted to open-source personal cooking coach** — no commercial, no Kickstarter
- **Web app served from ESP32 is the app** — no Flutter, no native app, no app store
- **Recipe JSON state machines** as the core format — community-contributed via GitHub PRs
- **PVC pipe enclosure** — split lengthwise, drill sensor window, zip-tie closure, under-cabinet bracket
- **Video title: "I Built a $100 Thermal Cooking Coach (and it actually works)"**
- **Honest pricing** — $100 from Adafruit, cheaper from AliExpress mentioned as footnote

## Artifacts Created

### Firmware Changes (~/Workspaces/stoveiq-open/firmware/)
- `src/idf_component.yml` — mdns managed component dependency
- `src/main.c` — added netif/event loop/WiFi init before BLE provisioning
- `src/wifi_manager.c` — idempotent init, fixed NVS namespace to match BLE provisioning
- `src/sensor.c` — added I2C bus scan diagnostic
- `src/cooking_engine.c` — calibrated zone extraction, recipe library (6 recipes), recipe state machine, simulation temp injection
- `src/cooking_engine.h` — calibration, recipe, sim API
- `src/web_server.c` — full cooking coach dashboard HTML, calibration UI, recipe UI, simulation controls, PWA manifest endpoint, favicon embedded
- `src/web_server.h` — updated broadcast signature with recipe state
- `include/stoveiq_types.h` — calibration_t, recipe types, trigger types, new command types

### Recipe System (~/Workspaces/stoveiq-open/recipes/)
- `schema.json` — JSON Schema for recipe format
- `README.md` — contribution guide
- `PULL_REQUEST_TEMPLATE.md` — PR template for recipe submissions
- `basics/white-rice.json`, `basics/pasta.json`, `basics/fried-eggs.json`, `basics/boiled-potatoes.json`
- `proteins/seared-steak.json`
- `vegetables/caramelized-onions.json`

### Enclosure (~/Workspaces/stoveiq-open/hardware/enclosure/)
- `stoveiq_pvc_enclosure.scad` — parametric OpenSCAD model
- `stoveiq_pvc_enclosure.FCMacro` — FreeCAD macro with STEP export

### Documentation (~/Workspaces/stoveiq-open/docs/)
- `enclosure-build.md` — assembly instructions
- `hackaday-project-page.md` — Hackaday.io page draft

### Video Production (~/Workspaces/stoveiq-open/video/)
- `scripts/outline.md`, `script.md`, `storyboard.md`, `project.json`, `storyboard.pptx`
- `audio/narration/scene_01.wav` through `scene_23.wav` (13 files)
- `audio/music/ambient-pad.wav` (9:01)
- `assets/images/` — 6 AI-generated images
- `assets/thumbnails/thumbnail.jpg`
- `output/stoveiq-draft-v1.mp4` (7:38, 38MB)

### Logo
- `firmware/stoveiq-icon-1024.png` — burner grate icon
- `firmware/stoveiq-favicon-32.png` — 32px favicon
- `firmware/stoveiq-apple-touch-icon.png` — 180px touch icon

## Open Items

- [ ] Film 14 live footage segments (see shot list in storyboard)
- [ ] Record 5 screen captures (PlatformIO, VS Code, GitHub, dashboard, sim mode)
- [ ] Swap real footage into video draft and re-assemble
- [ ] Create Hackaday.io project page (draft ready)
- [ ] Create GitHub repo for stoveiq-open (currently local only)
- [ ] Push recipe repo structure
- [ ] Test recipes on real stove with real cooking
- [ ] Build PVC pipe enclosure and mount under cabinet
- [ ] PCB design (KiCad, open source) — teased in video

## Context for Next Session

StoveIQ is fully functional on the breadboard at 192.168.1.183 / stoveiq.local on the Finley WiFi network. The cooking coach web app has 6 thermal-aware recipes with confirm steps, burner calibration, simulation mode, and a PWA manifest. The video draft is assembled with AI placeholders — Nick needs to film the live segments and screen captures to complete it. The recipe JSON schema is defined and ready for a community GitHub repo. The PVC enclosure is designed but not yet built physically. All firmware changes are in ~/Workspaces/stoveiq-open/ but not yet committed or pushed to GitHub.
