# Cage Match — Origin Story, CEO Vision, and Overnight Build

**Date:** 2026-04-08
**Session type:** mixed (strategy + execution)
**Agents involved:** Office Hours (GStack), CEO Review (GStack), Eng Review (GStack), Software Project agents (background)

## Summary

Massive session that started with Nick writing the Sand Hill Vending origin story and ended with three deliverables built overnight for the Jetson hardware arriving Apr 9. The session established the full product vision for Cage Match across 4 phases, made key architectural decisions, and prepared everything needed for the first real hardware test.

## Key Findings

- **Eureka moment validated across two AI models:** Every batting cage tech company (HitTrax, Rapsodo, BatFast) builds for the individual batter (analytics/training). Cage Match builds for the GROUP (competition/entertainment). Same hardware, opposite product thesis.
- **"Coins stacked on the table"** is the core demand signal — a behavioral pattern Nick observed across 40 years in two contexts (pinball bars and batting cages). This is not market research; it's lived experience.
- **Cage Match is the direct evolution of Sand Hill Vending** — father tracked revenue per machine per location with TRS-80 software. Nick is adding intelligence to the machine itself with Jetson + CV.
- **35-year career bridge:** "I went on to study Electrical Engineering at Northeastern and spent the next 35 years deploying complex technology into real-world operations at some of the world's largest companies. Every one of those years reinforced the same lessons I learned in that garage: systems have to work, uptime matters, and technology only has value when it's running."

## Decisions Made

- **Origin story saved to memory** as standalone narrative piece for pitches, LinkedIn, YC app
- **Office Hours v2:** Design doc updated with origin story, eureka moment, Match Mode designed, unified CV accuracy decision tree
- **CEO Review (Scope Expansion mode):** 7 features accepted, 1 deferred
  - ACCEPTED: Themed backglasses, AI theme generator, tournament mode, sponsor overlays, player profiles + QR codes, seasonal events, Match Mode (Phase 1.5)
  - DEFERRED: MLB/Little League licensing partnerships
- **Architectural decisions locked:**
  - Database-driven theme engine (not config folders)
  - Docker on everything (Jetson fleet + Pi hub)
  - Dedicated Raspberry Pi hub for tournaments/leaderboard/entrance display
  - Wired Ethernet between cages (NOT WiFi — metal cages degrade signal)
  - CV-only scoring (no physical sensors — "CV or die")
  - Multi-camera fallback if single camera insufficient
- **Eng Review:** Clean, 0 critical gaps, 1 issue deferred (server globals → DI refactor in Phase 2)
- **Codex outside voice (CEO review):** Challenged CV feasibility, phase sequencing, network reliability. All resolved. CV-or-die confirmed. Wired Ethernet adopted. Phase sequencing kept.
- **Match Mode deferred from MVP to Phase 1.5** — validate hardware before multiplayer UX investment
- **Career bridge blurb** approved for all docs (2 sentences, no jargon)
- **LinkedIn profile refresh** written with origin story woven throughout

## Artifacts Created

### In cage-match repo (github.com/nickdnj/cage-match)
- `README.md` — comprehensive GitHub README with origin story, architecture, screenshots, roadmap
- `Dockerfile` + `Dockerfile.hub` + `docker-compose.yml` + `.dockerignore` — Docker deployment
- `docs/jetson-setup.md` — 10-section Jetson setup guide (flash to production)
- `cv-test/live_accuracy_test.py` — live camera accuracy test with manual/headless modes
- `docs/linkedin-profile.md` + `.pdf` — full LinkedIn profile refresh
- `docs/screenshots/` — attract, in-game, game over screenshots added to README

### In gstack projects
- `~/.gstack/projects/nickdnj-AgentArchitect/nickd-main-design-20260408-151304.md` — design doc v2 (APPROVED, 9/10)
- `~/.gstack/projects/nickdnj-AgentArchitect/ceo-plans/2026-04-08-cage-match-vision.md` — CEO plan with full product vision

### Memory files updated
- `user_family_business.md` — Sand Hill Vending origin story + 35-year bridge
- `user_career.md` — NEW: full career timeline
- `project_cage_match.md` — updated with CEO decisions, eng review, patent landscape, hardware status
- `MEMORY.md` — index updated

### Emails sent
- Morning brief with Jetson punch list (to nickd@demarconet.com)
- Jetson setup guide PDF attachment
- LinkedIn profile refresh PDF attachment

## Open Items

- [ ] Flash JetPack on Jetson (hardware arrived, needs setup)
- [ ] IMX477 camera arriving Apr 9 evening — connect and test
- [ ] Run CV accuracy test (tennis ball toss, target >85%)
- [ ] Inspect token machine at Batter Up + photograph flood lights
- [ ] Build Match Mode in emulator
- [ ] Talk to brother about pilot cage conversion
- [ ] Update LinkedIn profile with new copy
- [ ] Post origin story as first LinkedIn post
- [ ] Apply to YC after hardware validation ("once I test this thing to know if it is real")

## Context for Next Session

Jetson Orin Nano Super is powered on and connected to the network but needs JetPack flash. IMX477 camera arriving tonight. The full setup guide, Docker config, and CV test script are all in the repo ready to go. The morning brief email has the punch list. The next session should be hands-on hardware: flash Jetson, connect camera, run the accuracy test. If CV works at >85%, the path to the cage is clear. All design docs, CEO plans, and architectural decisions are locked and documented.
