# Cage Match — Eng Review + Patent Landscape

**Date:** 2026-04-08
**Session type:** review + research
**Agents involved:** GStack /plan-eng-review, Codex (outside voice), Web Research (patent search)

## Summary

Ran a full GStack engineering review on the Cage Match codebase (~/Workspaces/cage-match). Found 12 issues (2 P0, 4 P1, 6 P2), all accepted and implemented. Wrote a 52-test pytest suite from zero coverage. Simultaneously ran a patent landscape search which returned MEDIUM risk — no hard blocks, proceed with awareness.

## Key Findings

### Eng Review
- **P0: Pitch queue race condition** — JetsonBallTracker had two consumers on the same asyncio.Queue. Capture loop and wait_for_pitch() both consumed pitch triggers.
- **P0: trigger_pitch() async/sync mismatch** — JetsonBallTracker's trigger_pitch was async, but engine called it without await. Coroutine silently dropped in production mode.
- **P0: NAME_ENTRY no timeout** — Game stuck forever if batter walks away without entering name. Added 30-second auto-submit.
- **P1: CV direction filter missing** — Any moving object (birds, bugs, arm swings) could score points. Added machine→batter direction requirement.
- **P1: Countdown mismatch** — Code had 2 seconds, design doc specified 5. Fixed.
- **P1: Token debounce** — From Codex outside voice review. Token machines can chatter. Added 5-second cooldown.
- **P2: DRY violation** — zones.json path computed in 4 places. Extracted to single constant.
- **P2: No /api/health endpoint** — Added for remote monitoring.
- **P2: No graceful shutdown** — Added SIGTERM/SIGINT handlers.
- **P2: No WebSocket validation** — Added JSON parse + action field checks.
- **Codex disagreement on ABCs** — Codex said abstract base classes were over-engineered. User and I agreed to keep them — they enable the emulated development workflow.

### Patent Landscape
- **Overall risk: MEDIUM** — Not a StoveIQ-style hard block.
- **Abandoned 2006 Chu patent (US20060287137)** — Closest conceptual match to Cage Match. Never granted. Now prior art that works in Cage Match's favor.
- **HitTrax (US10398957B2)** — Active. Camera-based ball tracking + gaming. But tracks pitched ball to predict statistical outcomes, not batted ball trajectory. Architecturally distinct.
- **Home Run Dugout (US11083953B2)** — Active. Tracking + scoring in batting bays. But requires vertical soft-toss mechanism, not horizontal pitching machine.
- **Kawasaki (US5639084A)** — Expired 2015. Original concept of zone-mapped scoring. Fully public domain.
- **Recommendation:** $2-4k FTO opinion before commercial launch. Pilot at Batter Up is fine.

## Decisions Made

- Fix all 12 issues from eng review (all "recommended" options accepted)
- Keep abstract base classes (rejected Codex's over-engineering concern)
- Add token debounce (accepted from Codex outside voice)
- Full test suite, not partial (52 tests covering engine, database, CV pipeline, server)
- Patent risk acceptable for pilot, defer FTO opinion until commercialization

## Artifacts Created

- **Commit 40052f4** — cage-match repo, pushed to origin/master
  - 14 files changed, 1,220 insertions
  - Bug fixes, health endpoint, graceful shutdown, test suite, patent report
- **Patent landscape report:** `cage-match/docs/patent_landscape.md` (22KB, covers 8 patents)
- **GStack review artifacts:**
  - Design doc: `~/.gstack/projects/nickdnj-AgentArchitect/nickd-main-design-20260407-141451.md`
  - Test plan: `~/.gstack/projects/nickdnj-AgentArchitect/nickd-main-eng-review-test-plan-20260408-141756.md`
  - Review log entries for plan-eng-review and codex-plan-review
- **Plan file:** `~/.claude/plans/agile-sniffing-wirth.md` (full eng review with architecture diagrams)

## Open Items

- [ ] Flash JetPack on Jetson Orin Nano (powered on, on network, camera arriving tonight)
- [ ] Test CV ball tracking with real camera (tennis ball toss at home)
- [ ] Inspect token machine at Batter Up (confirm optocoupler signal type)
- [ ] Run /qa on http://localhost:8080 (browser QA of emulated game)
- [ ] /plan-eng-review on expanded architecture (theme engine, hub, Docker from CEO review)
- [ ] Build Match Mode in emulator
- [ ] Talk to brother about pilot cage conversion
- [ ] $2-4k patent FTO opinion before commercial launch

## Context for Next Session

Jetson Orin Nano is powered on and connected to the network. Camera (Arducam IMX477 day/night) arriving tonight. Next session should focus on flashing JetPack SDK onto the Jetson and getting the camera working. The cage-match repo has a Jetson setup guide and CV test scripts ready. The eng review fixes are committed and pushed (52 tests all passing). The CEO review from the prior session expanded the roadmap significantly (Match Mode, Docker, Pi hub, theme engine) but all of that is gated on proving the camera can see the ball — that's the technical bet.
