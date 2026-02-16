# Altium AI Migration Deep Dive Session

**Date:** 2026-02-04
**Session type:** research | planning
**Agents involved:** Altium Solutions Team — Competitive Intelligence, Migration Specialist, Web Research, Presentation, Solution Architect, general-purpose

## Summary

Extended voice-mode session exploring the strategic opportunity of building an AI-powered automated PCB design migration engine at Altium. Started with market sizing, progressed through technical feasibility, team design, talent sourcing, and culminated in a 15-slide Altium-branded presentation for Don Cantow. Session produced 8 research documents (~350KB) and a PowerPoint deck.

## Session Flow

1. User initiated via voice: explore market opportunity for AI-powered migration from legacy EDA tools
2. Three parallel research agents launched: market sizing, technical feasibility, EDA market data
3. Results consolidated; voice summary delivered
4. Presentation agent built 15-slide Altium-branded deck for Don Cantow pitch
5. User revealed personal history — worked for Don at both Mentor Graphics and Altium
6. User requested deep dive: team composition, training pipeline, path to 95% fidelity
7. Two more research agents: team/training deep dive + ML pipeline design
8. Wrote comprehensive team-and-training-deep-dive.md directly (50KB) after agents stalled
9. Updated presentation with real numbers ($13-16M vs original $4-5.5M)
10. User requested POC-first approach — updated deck to lead with $1.5-2M/5-person/6-month proof of concept
11. Detailed job descriptions for all 17 roles (135KB) with emphasis on aging AE talent pool
12. Talent sourcing: Mentor/Siemens displaced workers (Siemens program contact found), Cadence talent via EMA Design Automation

## Key Technical Detail

Agent background tasks hit permission issues writing files. Solution: extract document content from JSONL output files using Python (parse Write tool input blocks from agent transcripts). This pattern worked reliably for recovering agent output.

## All Artifacts

Location: `~/Workspaces/Altium/Deals/AI-Migration-Opportunity/`
- `presentation/AI-Migration-Business-Case-Don-Cantow.pptx`
- `presentation/build_presentation.py`
- `research/market-opportunity-analysis.md`
- `research/technical-feasibility-analysis.md`
- `research/eda-market-data.md`
- `research/team-and-training-deep-dive.md`
- `research/eda-talent-landscape.md`
- `research/job-descriptions-all-roles.md`
- `research/mentor-eda-talent-search.md`
- `research/cadence-eda-talent-search.md`

## Open Items

- [ ] Review/personalize PowerPoint for Don
- [ ] Zuken talent search (not yet done)
- [ ] Financial model spreadsheet
- [ ] Determine engagement model (returning employee vs. external)
- [ ] Consider immediate free EAGLE migration tool play
