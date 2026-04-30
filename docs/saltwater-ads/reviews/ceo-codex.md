# CEO Review — Codex (Outside Voice)

**Date:** 2026-04-30
**Plan reviewed:** `/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md`
**Source:** Codex CLI v0.98.0, GPT-5.4, read-only
**Phase:** /autoplan Phase 1 (CEO)

---

## Findings

### 1. CRITICAL — Creative throughput is unproven as the bottleneck
The PRD never proves that creative throughput is the actual bottleneck. It assumes 22 concepts/year means Saltwater is production-constrained, but at a $3K/mo baseline that may simply be the right amount of testing for the current spend. If offer quality, SKU selection, landing-page congruence, or media buying discipline are the real constraints, this entire build is solving the wrong problem. (PRD lines 37, 77, 415)

### 2. CRITICAL — The success metric is statistically weak
A 4-week "hit rate lift" on a low-volume account with a baseline guessed from Joe's memory is not a reliable decision system. You're proposing to greenlight or kill a product based on tiny samples, seasonality, product mix, and spend noise. That is not strategy; that is numerology. (PRD lines 27, 75, 396, 416)

### 3. CRITICAL — The build-vs-buy case is financially dishonest
This is a custom stack spanning multiple vendors, FFmpeg assembly, a TW connector, a web app, approvals, and maintenance, while also claiming Nick exits in week 4. The economics only work because the builder is subsidizing them. The moment you price maintenance honestly, the "cheap custom system" story gets shaky fast. (PRD lines 25, 60, 79, 398)

### 4. HIGH — The "compounding brand bucket" moat is probably an illusion
A brand with roughly dozens of meaningful ad observations per year does not have enough signal to justify a "learning engine" narrative. You are dressing a small prompt library and a few outcome logs up as proprietary intelligence. Six months from now this could look like a lot of architecture built around very little data. (PRD lines 38, 58, 230, 431)

### 5. HIGH — Doubling down on AI to fix AI slop
The document says the market rejected generic AI avatars, then responds by adding more AI layers: HeyGen founder avatar, Fashn virtual customer, Higgsfield virtual hero. That is not a rebuttal to "AI slop"; it is a more elaborate form of it. For a founder-led apparel brand, the durable edge may be real founder footage plus better editing and testing, not synthetic founder proxies. (PRD lines 41, 50, 66, 248)

### 6. HIGH — Handoff premise is not credible
Joe is explicitly not a CLI user and won't invest much time learning new tools, yet Sprint 1 is on Nick's machine and the core workflow depends on local developer tooling. That makes the system a key-man dependency disguised as software. If Nick truly exits in week 4, who owns prompt drift, vendor API breakage, failed renders, and quality control? (PRD lines 98, 111, 281, 398)

### 7. HIGH — Scope is bloated for a one-operator internal tool
Google Search copy, PMAX assets, Buddy review flows, audit logs, dashboard screens, weekly digests, Meta push, TikTok later, brand-health screens: this is internal SaaS cosplay. The six-month embarrassment is obvious: a complex ad platform for one family business when a narrower workflow could have produced the same business result with far less fragility. (PRD lines 139, 175, 183, 272, 399)

### 8. MEDIUM — Competitive risk = vendor convergence, not vendor shutdown
If Arcads, HeyGen, Creatify, or the next entrant closes the brand-kit and performance-feedback gap in the next 3-6 months, this custom stack loses most of its strategic value and becomes maintenance debt. The PRD assumes today's product gaps are durable. They probably aren't. (PRD lines 41, 52, 443)

---

## Reframes The PRD Ignores

1. **"Founder-content operating system" not a "synthetic ad factory":** monthly real shoot, AI-assisted hook generation, automated clipping/captioning/assembly, rapid testing around real footage.
2. **Optimize spend confidence on winning SKUs, not variant volume:** use data first to decide what deserves creative, then generate against the highest-leverage offers only.
3. **Treat this as ops design, not product design:** if a prompt pack, asset library, one part-time editor, and two vendor tools can get 80% of the upside, the custom multi-agent platform is strategic overbuild.
