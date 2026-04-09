# Self-Improving Agents — Office Hours + Build

**Date:** 2026-04-09
**Session type:** mixed (design + execution)
**Agents involved:** gstack office-hours, Architect (implicit), Codex (second opinion)

## Summary

Ran gstack /office-hours on Agent Architect itself (builder mode). Designed the self-improving agent system: agents that read their own task feedback and propose edits to their own SKILL.md. Then built the MVP in the same session — Improver agent, feedback capture in software-project orchestrator, and updated the sync-agents generator.

## Key Findings

- **Eureka insight:** If agent definitions are markdown (not code), self-improvement is just file editing. No retraining, no RL, no weight updates. Radically simpler than every other approach in the space.
- **Landscape:** CrewAI (45.9K stars), Microsoft Agent Framework (1.0), Paperclip (44.9K stars) — all code-first. No one doing file-first/markdown-native agent definitions.
- **Codex second opinion:** Proposed "Agent Genome Lab" (versioned genomes, tournament selection). Suggested building on AutoGen — we disagreed (contradicts file-first thesis). Recommended weekend MVP: `aa improve --team <team> --task <task>`.
- **Core differentiators identified:** (1) File-first, not code-first. (2) Context isolation via buckets/briefings/forked execution.

## Decisions Made

- **Builder mode** — primarily personal infrastructure, open to monetization
- **Approach A→B:** Learning Loop (weekend MVP) first, then iterate toward Genome Lab (full evolution)
- **Pilot team:** software-project, specifically the software-developer agent
- **All 5 premises agreed:** agents-as-documents defensible, self-improvement via editing simpler than RL, Nick is the bottleneck, connect existing pieces first, distribution can wait
- **Design doc approved** (8/10 after 2 adversarial review rounds, 18 issues caught and fixed)

## Artifacts Created

- **Design doc:** `~/.gstack/projects/nickdnj-AgentArchitect/nickd-main-design-20260409-181240.md` (APPROVED)
- **Improver agent:** `agents/improver/SKILL.md` + `agents/improver/config.json`
- **Feedback file:** `agents/software-developer/feedback.jsonl` (empty, ready to receive)
- **Native agent:** `.claude/agents/improver.md` (generated, gitignored)
- **Team config:** Updated `teams/software-project/team.json` with `feedback_loop` block
- **Registry:** Updated `registry/agents.json` with improver entry
- **Generator:** Updated `scripts/generate-agents.js` with feedback_loop support
- **Commits:** `43024f1` (Improver agent MVP), `edcf33c` (generator update)

## Open Items

- [ ] Test the feedback loop by using `/software-project` for a real implementation task
- [ ] After 3+ feedback entries accumulate, run the Improver and evaluate the first diff
- [ ] Iterate on feedback quality — tune orchestrator's feedback generation
- [ ] Add user correction tracking (Week 2 per design doc)
- [ ] If loop works, design evaluation framework for Genome Lab (Week 3+)
- [ ] Consider adding feedback_loop to other teams (hardware-dev, youtube-content)

## Context for Next Session

The Learning Loop MVP is committed and live. The software-project team orchestrator now captures structured feedback after each software-developer task. When 3+ entries accumulate, it offers to run the Improver, which reads the feedback + SKILL.md and proposes a diff. The generator script also supports this — any team can opt in via team.json. The next milestone is getting that first real diff and seeing if it's any good. The design doc at ~/.gstack has the full spec including risks, failure modes, and Phase 2 plans.
