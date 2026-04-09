# Hardware Development Team Creation

**Date:** 2026-04-09
**Session type:** execution
**Agents involved:** Architect, Hardware Dev (created)

## Summary

Created the Hardware Development Team with 5 specialist agents: PCB Designer (KiCad), MCAD Engineer (FreeCAD), Firmware Engineer (PlatformIO/JetPack), Supply Chain Manager, and DFM & Test Engineer. Established cross-team collaboration with the Software Project team via a shared `hardware-projects` context bucket. All open-source tools chosen for import compatibility with Altium.

## Key Findings

- Cage Match hardware stack is all dev boards today (Jetson, ESP32 dev boards, breadboarded optocoupler) — fine for prototype but not for 50-unit production
- Custom PCBs needed at scale for reliability, cost, assembly, enclosure fit, and FCC certification
- Likely boards: Target Controller (ESP32+LED drivers), Token Interface (optocoupler), possibly Hub Board (Phase 2)
- Jetson stays as off-the-shelf module at 50 units — custom carrier only at much higher volumes
- User does NOT currently have Altium Designer access — all tools must be open source but Altium-importable

## Decisions Made

- **Open source tool stack**: KiCad 8 (PCB), FreeCAD (MCAD), PlatformIO (firmware)
- **Firmware lives in hardware team**, not software — it's inherently a hardware concern
- **Teams linked** via shared `hardware-projects` context bucket (both hardware-dev and software-project can access)
- **Compliance bundled into DFM agent** — not a standalone agent at current scale
- **Cross-team interfaces defined**: Firmware↔Software Developer (API contracts), PCB Designer↔Software Architecture (HW requirements), Supply Chain↔Product Requirements (cost data)
- **Model assignments**: PCB Designer and Firmware Engineer get opus (complex reasoning), others get sonnet

## Artifacts Created

- `agents/pcb-designer/` — SKILL.md + config.json
- `agents/mcad-engineer/` — SKILL.md + config.json
- `agents/firmware-engineer/` — SKILL.md + config.json
- `agents/supply-chain-manager/` — SKILL.md + config.json
- `agents/dfm-test-engineer/` — SKILL.md + config.json
- `teams/hardware-dev/team.json` — team config with workflow stages and cross-team collaboration
- `context-buckets/hardware-projects/bucket.json` — shared context bucket
- `registry/agents.json` — updated with 5 new agents
- `registry/teams.json` — updated with hardware-dev team
- `registry/buckets.json` — updated with hardware-projects bucket
- `CLAUDE.md` — updated routing tables for Claude Code and Cowork environments
- `.claude/agents/` and `.claude/skills/` — generated via /sync-agents

## Open Items

- [ ] Restart session to pick up new agent types (PCB Designer, MCAD Engineer, etc.)
- [ ] Run Cage Match PCB assessment: "Review the Cage Match hardware stack and tell me what custom PCBs we'd need for a 50-unit production run"
- [ ] Seed `hardware-projects` context bucket with Cage Match BOM, architecture diagram, and hardware specs
- [ ] Generate Cowork orchestrator for hardware-dev (`node scripts/generate-cowork.js`)
- [ ] Clean up stale `stoveiq` team reference that errored during /sync-agents

## Context for Next Session

The hardware-dev team is fully built and synced but the new agents aren't available as named subagent types until a fresh session. Start a new session, invoke `/hardware-dev`, and run the Cage Match PCB assessment. The user's immediate question is: what custom PCBs are needed for 50-unit production? Delegate to PCB Designer and Supply Chain Manager in parallel.
