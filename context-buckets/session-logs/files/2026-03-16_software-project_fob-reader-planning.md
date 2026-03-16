# Session: Fob Reader — Full Build (Planning + Implementation + Docker)

**Date:** 2026-03-16
**Session type:** execution
**Team:** software-project
**Specialists Invoked:** Web Research, Product Requirements, Software Architecture, UX Design, Dev Planning, Software Developer, Chrome Browser
**Mode:** Voice mode throughout

## Summary

Built a complete Raspberry Pi + USB RFID fob reader system with a PWA phone interface from scratch in a single session. Went from concept → research → planning docs → full implementation → Docker deployment with mock mode for testing. User tested the PWA on both Mac browser and phone.

## Key Findings

- USB HID RFID reader is the simplest path — plug-and-play, no GPIO wiring, ~$10
- WebSocket over WiFi beats BLE for this use case (simpler, lower latency, works on all phones)
- WiFi hotspot mode (hostapd + dnsmasq) chosen as PRIMARY connection — works anywhere without existing WiFi
- Phone retains cellular data while on Pi's hotspot, enabling simultaneous TagSmart API access
- PWA served from the Pi itself means zero app installation
- Total hardware cost ~$50
- Pydantic 2.12+ on Python 3.11 requires `typing_extensions.TypedDict` (not `typing.TypedDict`)
- CSS `min-height` overrides `max-height: 0` for hiding elements — must set both to 0
- FastAPI `receive_json()` is too strict for WebSocket keep-alive; `receive_text()` is more forgiving

## Decisions Made

- Pi creates WiFi hotspot ("FobReader", password "fobreader123") as primary connection mode
- Pi static IP: 192.168.4.1 in hotspot mode
- PWA URL: http://192.168.4.1:8080/
- Mock mode with manual-only simulate (no auto-scanning) — triggered by Simulate Scan button or POST /api/scan
- Docker for local testing on Mac (skips evdev since no /dev/input)
- TagSmart integration designed as additive v2 (hooks in v1 data structures, DOM slots reserved)

## Artifacts Created

### Planning docs (~/Workspaces/fob-reader/docs/)
- RESEARCH.md — Hardware options, wiring diagrams, software libraries, cost analysis
- PRD.md — 6 functional requirements, user stories, acceptance criteria
- ARCHITECTURE.md — Component diagram, module design, WebSocket protocol, error handling, security
- UX-SPEC.md — 6 screen states, 72px fob display, banners, history, accessibility
- IMPLEMENTATION-PLAN.md — 23 tasks across 9 epics + hotspot config task

### Server code (~/Workspaces/fob-reader/server/)
- config.py — Settings dataclass from env vars
- models.py — TypedDict message types
- rfid.py — RFIDReader (evdev) + MockRFIDReader classes
- main.py — FastAPI app with WebSocket broadcast, heartbeat, health, static files, mock scan endpoint

### PWA client (~/Workspaces/fob-reader/client/)
- index.html — Semantic HTML with ARIA attributes
- style.css — Responsive design, animations, dark-mode-aware
- app.js — WebSocket, scan display, history, clipboard, install prompt, mock simulate
- manifest.json, sw.js, icons/

### Deployment config
- Dockerfile, docker-compose.yml — Mock mode Docker setup
- fob-reader.service — systemd unit file
- config/hostapd.conf, dnsmasq.conf, dhcpcd.conf.append — WiFi hotspot
- scripts/install.sh, find-reader.py — Pi setup automation

### Tests
- 37 tests passing (12 rfid, 14 server, 11 mock)

### Memory
- ~/.claude/projects/.../memory/fob-reader.md — Project memory
- ~/.claude/projects/.../memory/MEMORY.md — Index updated

## Open Items

- [ ] Get Pi connected to home network (had power/network issues during session)
- [ ] Order USB RFID reader hardware (125kHz for EM4100 fobs)
- [ ] Confirm Wharfside fob frequency (125kHz vs 13.56MHz)
- [ ] Initialize git repo in ~/Workspaces/fob-reader/ and push to GitHub
- [ ] Deploy to Pi and test with real hardware
- [ ] Add export button for scan history (user requested)
- [ ] Test clipboard copy on real iOS Safari over HTTP

## Context for Next Session

The fob-reader project is fully built and running in Docker on the Mac with mock mode. User verified the PWA works on both desktop browser and phone (192.168.1.165:8080). The simulate scan button works, scan history with tap-to-copy works. Two bugs were found and fixed during testing: (1) CSS min-height override preventing banner hiding, (2) WebSocket receive_json causing disconnects. The Pi 5 (VistterStream server) couldn't connect due to it being configured for the Wharfside 192.168.12.x network, not the home 192.168.1.x network. Next step is getting a Pi connected (either reflash the VistterStream Pi's SD card or use a different one) and ordering an RFID reader.
