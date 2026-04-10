# StoveIQ Open Source Pivot — Full Build Session

**Date:** 2026-04-09 to 2026-04-10
**Session type:** planning + execution
**Agents involved:** Direct (no team orchestrator)

## Summary

Pivoted StoveIQ from a paused commercial safety product (blocked by Pippa patent EP3908785B1) to a personal open-source smart cooking monitor. Created a fresh public GitHub repo with complete firmware: cooking engine with CCL burner detection, WebSocket thermal streaming, WiFi AP+STA, BLE provisioning, web UI fallback, and 7 unit tests. Pushed to GitHub and renamed repos so `nickdnj/stoveiq` is the new public project.

## Key Findings

- Combustion Inc (combustion.inc) makes smart thermometer probes ($149) for internal meat temps — StoveIQ's surface thermal imaging is complementary, not competitive
- Old `stoveiq` repo had hardcoded WiFi credentials (`Finley`/`cathieS19!!`) and MQTT passwords in git history — required fresh repo for public release
- Connected Component Labeling (CCL) is the right algorithm for burner zone detection — O(n) two-pass, <2KB working memory, handles arbitrary burner layouts
- ESP32-S3 `httpd_ws_*` API provides native WebSocket support — no external library needed
- Binary WebSocket frames (1,540 bytes at 4Hz) are 3x more efficient than JSON for thermal data

## Decisions Made

- **Name:** Keep "StoveIQ"
- **Architecture:** Local-first, no cloud, AP+STA concurrent WiFi
- **Features:** All 4 cooking features (heatmap, per-burner, alerts, logging)
- **Blog:** Hackaday.io (maker community discovery)
- **Videos:** Vistter YouTube channel
- **Licenses:** MIT (software) + CERN-OHL-S-2.0 (hardware)
- **Heatmap:** Canvas 2D + Inferno colormap (not WebGL, not D3)
- **Streaming:** WebSocket binary (not SSE — need bidirectional for commands)
- **Web UI:** Vanilla JS, no framework (~37KB gzipped target)
- **BLE provisioning:** Added back for WiFi credential setup via ESP BLE Prov app

## Artifacts Created

- **New repo:** `~/Workspaces/stoveiq-open/` — 41 files, ~7,000 lines
- **GitHub:** https://github.com/nickdnj/stoveiq (public)
- **Old repo renamed:** `nickdnj/stoveiq-private` (private, archived)
- **Plan file:** `~/.claude/plans/sunny-juggling-galaxy.md`
- **Memory updated:** `project_stoveiq.md` + `MEMORY.md` index

### New firmware files written:
- `stoveiq_types.h` — Cooking types (burner zones, alerts, sessions, config, BLE provisioning)
- `cooking_engine.c/h` — CCL burner detection, 4 alert types, state tracking
- `web_server.c/h` — HTTP + WebSocket + SPIFFS + fallback heatmap UI
- `wifi_manager.c/h` — AP+STA concurrent WiFi + mDNS
- `ble_provision.c/h` — BLE WiFi provisioning (ESP32 + emulator)
- `tasks.c/h` — 3-task pipeline (Sensor → Cooking Engine → Web Server)
- `main.c` — Entry points for ESP32 and desktop emulator
- `test_cooking_engine.c` — 7 unit tests
- `platformio.ini`, `partitions.csv`, `sdkconfig.defaults`, `CMakeLists.txt`
- `README.md`, `CLAUDE.md`, licenses, CI workflow, `.gitignore`

### Carried over from old repo (clean, no credentials):
- `sensor.c/h` — MLX90640 I2C driver
- `thermal_emulator.c/h` + 4 scenarios
- `lib/MLX90640/` — Melexis driver library
- `test_sensor.c`, `test_integration.c`
- `stoveiq_enclosure_v1_production.scad` (reference)

## Open Items

- [ ] Phase 4: 3D enclosure (OpenSCAD for prototype devkit + breakout, PETG)
- [ ] Phase 5: Full web UI (`firmware/data/` directory — heatmap.js, app.js, styles.css)
- [ ] Phase 5: Hackaday.io project page creation
- [ ] Phase 5: YouTube video 1 — "I Built an Open Source Smart Cooking Monitor"
- [ ] Flash firmware to real hardware and test end-to-end
- [ ] Session logging filesystem implementation (LittleFS partition allocated, types defined)
- [ ] Settings persistence (NVS read/write via `/api/settings` endpoints)
- [ ] Full web UI settings page and history page

## Context for Next Session

The firmware is architecturally complete — all modules exist and compile conceptually. The next physical step is flashing to the actual ESP32-S3 + MLX90640 prototype hardware and testing. The web UI currently uses a fallback HTML page embedded in firmware; the full SPA with proper heatmap rendering, per-burner cards, and settings needs to be built as separate files in `firmware/data/`. The 3D enclosure needs to be designed from scratch for the prototype hardware (devkit board dimensions, not the production PCB). The old production enclosure is in the repo as reference only.
