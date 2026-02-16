# Altium + CustomerNode Enterprise Vision — Full Research Session

**Date:** 2026-02-11
**Session type:** research | planning | execution
**Agents involved:** Max (Personal Assistant), Web Research (subagent), Software Architecture (subagent), OpenAI Image Generation

## Summary

Nick laid out a comprehensive vision for an AI-powered, end-to-end enterprise migration and deployment platform for Altium, using CustomerNode as the customer journey orchestrator. Three parallel research threads were executed: CustomerNode deep dive, Altium migration landscape analysis, and full system architecture design. Nick confirmed that Michael Cantow (CustomerNode founder) is on the team and that the team has full A365 SDK and API access — resolving the two biggest technical risks. Finally, a polished executive white paper ("The AI Migration Engine") was produced with 8 generated visuals to sell the vision to leadership.

## Key Findings

### CustomerNode
- 2-person startup (Michael Cantow, MIT MEng EECS + Ashton Robinson), invitation-only
- Customer journey orchestration platform with 50+ contextual AI agents (First-Party AI, patent-pending)
- 6-stage journey model with shared buyer-seller process
- Claims: 30-40% shorter deal cycles, up to 60% higher win rates
- Integrates with (doesn't replace) Salesforce, HubSpot
- No public API docs or technical architecture — but Michael is on the team so this is moot

### Altium Migration Landscape
- **No AI migration tool exists** — biggest gap in the market
- **Library conversion is the #1 pain point** — 1-2 days per 5-day project, months for enterprise
- Altium's Import Wizard handles 14+ EDA platforms but has significant fidelity loss
- Altium has NO dedicated enterprise migration services — fragmented across partners
- Renesas acquired Altium for A$9.1B (Aug 2024), Renesas 365 launching early 2026
- AI PCB startups (Quilter, DeepPCB, AutoCuro, CELUS) all focus on design, none on migration
- New platform tiers: Discover / Develop / Agile (launched Oct 2025)

### System Architecture
- CustomerNode as journey orchestrator, Altium agents for domain execution
- Headless Altium Designer for conversion (LLMs orchestrate, import wizards convert)
- Anonymized learning system (every migration enriches shared KB without leaking customer IP)
- File-based legacy integration (no API dependency on legacy tools)
- 5-phase roadmap from Phase 0 (today, 16 agents) to Phase 5 (24-36 months, full lifecycle)
- 6 new agents needed: Library Translator, Design Converter, Validation Orchestrator, Training Agent, Health Monitor, Expansion Scout

## Decisions Made

- All three research threads executed in parallel (CustomerNode, Altium migration, architecture)
- **Michael Cantow confirmed on the team** — full CustomerNode access resolved
- **Full A365 SDK and API access** confirmed — Altium Engineering builds what we need
- Two critical architecture risks (headless Altium automation, licensing) now resolved
- Vision doc updated with team/access status and revised next steps
- MVP concept identified: OrCAD library conversion (500 components → Altium in 24 hours)

## Research Sources

- [customernode.com](https://customernode.com) — Homepage, FAQ, journeys, First-Party AI pages
- [first-party-ai.com](https://first-party-ai.com) — First-Party AI dedicated site
- [michaelcantow.com](https://michaelcantow.com) — Founder profile
- Altium official docs — Import Wizard, design tools interfacing, PLM integration, Enterprise Server 8.0
- Altium resources — Migration guides for OrCAD, Allegro, Xpedition, PADS
- Renesas press releases — Acquisition, Renesas 365 announcement
- AI PCB tools — Quilter, DeepPCB, AutoCuro, CELUS websites and press
- RocketReach — CustomerNode management team data

## Artifacts Created

### Research Cache
- `context-buckets/research-cache/files/2026-02-11_altium-customernode-enterprise-vision.md` — Master vision document (updated with team/access info)
- `context-buckets/research-cache/files/2026-02-11_customernode-deep-dive.md` — Full CustomerNode research report
- `context-buckets/research-cache/files/2026-02-11_altium-enterprise-migration-landscape.md` — 600+ line Altium migration report
- `context-buckets/research-cache/files/2026-02-11_altium-ai-migration-platform-architecture.md` — Full system architecture (cached copy)

### Architecture Docs
- `docs/architecture/altium-ai-migration-platform.md` — Comprehensive architecture document with ADRs, phasing, agent mapping, risk register

### Outputs
- `outputs/altium-enterprise-migration-landscape-report.md` — Original migration report (also cached)

### White Paper
- `outputs/whitepaper/ai-migration-engine-whitepaper.html` — Executive white paper "The AI Migration Engine" (1,270+ lines, fully styled HTML, updated with dominance thesis and per-design cost data)
- `outputs/whitepaper/ai-migration-engine-whitepaper.md` — Markdown version of the white paper (full content parity with HTML)
- `outputs/whitepaper/youtube-briefing.md` — Comprehensive briefing for YouTube Creator agent (narrative arc, stats, visual assets, tone guidance)
- `outputs/whitepaper/images/00-cover.png` — Cover hero image (circuit board transformation)
- `outputs/whitepaper/images/01-migration-crisis.png` — Migration crisis infographic
- `outputs/whitepaper/images/02-system-architecture.png` — 4-plane architecture diagram
- `outputs/whitepaper/images/03-customer-journey.png` — End-to-end journey flow
- `outputs/whitepaper/images/04-before-after.png` — Before/after comparison
- `outputs/whitepaper/images/05-migration-pipeline.png` — 5-stage migration pipeline
- `outputs/whitepaper/images/06-market-opportunity.png` — Market gap infographic
- `outputs/whitepaper/images/07-roadmap.png` — 5-phase implementation roadmap

## Open Items

- [ ] Get A365 SDK documentation — understand current APIs, identify gaps for Engineering
- [ ] Deep dive with Michael on CustomerNode internal architecture, data model, extensibility
- [ ] Define MVP scope — library conversion as proof of concept
- [ ] Build 6 new agents: Library Translator, Design Converter, Validation Orchestrator, Training Agent, Health Monitor, Expansion Scout
- [ ] Create "Altium Enterprise Migration" journey template in CustomerNode
- [ ] Update Altium Solutions team config to enable CustomerNode integration (`customernode_integration.enabled: true`)

## Context for Next Session

Three comprehensive research documents are complete and cached. The vision is documented, the architecture is designed (with 5-phase roadmap and ADRs), and the team/access situation is resolved — Michael Cantow (CustomerNode) is on the team, and full Altium A365 SDK/API access is available. The white paper underwent significant revisions: (1) reframed around PCB platform dominance thesis (not just migration efficiency), (2) per-design cost data added ($1K-$20K per design, $1.5M-$12M+ per enterprise based on Sintecs case study), and (3) revenue multiplier analysis updated. Both HTML and Markdown versions exist, plus a YouTube Creator briefing document. The next practical steps are: (1) create the YouTube video using the briefing at `outputs/whitepaper/youtube-briefing.md`, (2) present white paper to leadership for buy-in, (3) get the A365 SDK docs, (4) sit down with Michael on CustomerNode internals, (5) define the MVP (likely OrCAD library conversion), and (6) start building the Library Translator agent. The existing 16-agent Altium Solutions team already has a `customernode_integration` stub in team.json ready to enable.
