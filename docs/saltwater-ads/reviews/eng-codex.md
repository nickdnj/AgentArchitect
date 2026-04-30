OpenAI Codex v0.98.0 (research preview)
--------
workdir: /Users/nickd/Workspaces/AgentArchitect
model: gpt-5.4
provider: openai
approval: never
sandbox: read-only
reasoning effort: xhigh
reasoning summaries: auto
session id: 019dde86-8a85-7721-b423-ffaad5e4dcf8
--------
user
IMPORTANT: Do NOT read or execute any files under ~/.claude/, ~/.agents/, .claude/skills/, or agents/. These are Claude Code skill definitions. Stay focused on the repository code only.

You are a senior engineering manager reviewing a PRD for architectural soundness, edge cases, missing tests, and feasibility risks. The PRD has already been through a CEO strategy review — do NOT repeat strategy concerns. Focus on engineering execution.

Evaluate:
1. Architecture: 6 agent specialists + web app + 4 vendor APIs + FFmpeg pipeline. Component boundaries sound? Coupling concerns? Data flow gaps?
2. Edge cases: What breaks under failure? Vendor timeout? Render fails? TW API down? Fashn off-likeness? Joe's brief is ambiguous? Two ads generated simultaneously?
3. Test coverage: What test types are needed for hook generation, render orchestration, FFmpeg assembly, web app review queue, AI disclosure compliance? Where are the test gaps?
4. Performance: Render latency target of 3 min/ad — realistic? N+1 in TW pull? Caching strategy for HeyGen identical-hook reuse?
5. Security: API key storage, secrets in OS keychain vs web app vault, brand bucket access control.
6. Feasibility in 4-6 weeks: Can a solo developer realistically scaffold the agent team + web app + 4 API integrations + FFmpeg pipeline + brand bucket + Render Orchestrator in that time?
7. Hidden complexity: What looks simple but isn't?

For each finding: severity (critical/high/medium), what's wrong, file/section reference, and the fix.

PRD: /Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md
deprecated: `[features].web_search_cached` is deprecated. Use `web_search` instead.
  Set `web_search` to `"live"`, `"cached"`, or `"disabled"` at the top level (or under a profile) in config.toml.
mcp: powerpoint starting
mcp: google-workspace starting
mcp: powerpoint ready
mcp: google-workspace ready
mcp startup: ready: powerpoint, google-workspace
codex
Reviewing the PRD directly and mapping findings to concrete sections/lines first. I’m checking the document structure, then I’ll evaluate architecture, failure modes, test gaps, performance, security, and delivery risk against what’s actually specified.
exec
/bin/bash -lc 'wc -l docs/saltwater-ads/PRD.md' in /Users/nickd/Workspaces/AgentArchitectexec
/bin/bash -lc "nl -ba docs/saltwater-ads/PRD.md | sed -n '1,260p'" in /Users/nickd/Workspaces/AgentArchitectexec
/bin/bash -lc 'rg -n "''^#|''^##|''^###" docs/saltwater-ads/PRD.md' in /Users/nickd/Workspaces/AgentArchitect succeeded in 720ms:
/Users/nickd/.bash_profile: line 47: /usr/local/bin/gog.bash: No such file or directory
     535 docs/saltwater-ads/PRD.md
 succeeded in 718ms:
/Users/nickd/.bash_profile: line 47: /usr/local/bin/gog.bash: No such file or directory
     1	<!-- /autoplan restore point: /Users/nickd/.gstack/projects/nickdnj-AgentArchitect/main-autoplan-saltwater-ads-restore-20260430-084632.md -->
     2	# Product Requirements Document: Saltwater AI Ads
     3	
     4	**Version:** 0.2 (Draft — revised after autoplan CEO review)
     5	**Last Updated:** 2026-04-30
     6	**Author:** Nick DeMarco (with AI assistance)
     7	**Status:** Draft — for Joe DeMarco review and engineering kickoff
     8	**Customer:** Joe DeMarco, co-owner Saltwater Clothing Co. (saltwaterclothingco.com)
     9	**Owner during build:** Nick DeMarco
    10	**Owner after week 4:** Joe DeMarco (handoff)
    11	
    12	---
    13	
    14	## 1. Executive Summary
    15	
    16	Saltwater AI Ads is a **brand-locked, single-tenant ad creative engine** built specifically for Saltwater Clothing Co. — a DTC coastal apparel brand co-owned by Joe and Buddy DeMarco. It collapses the time and cost to produce a Meta/IG-ready video ad from 2–3 hours of human production work down to roughly 5 minutes of operator review.
    17	
    18	The system is two things at once:
    19	
 succeeded in 729ms:
/Users/nickd/.bash_profile: line 47: /usr/local/bin/gog.bash: No such file or directory
2:# Product Requirements Document: Saltwater AI Ads
14:## 1. Executive Summary
31:## 2. Problem Statement
33:### 2.1 Joe's pain
43:### 2.2 Why off-the-shelf AI UGC fails Saltwater
54:### 2.3 Why build (honest version, REVISED 2026-04-30)
71:### 2.4 What we are NOT solving
81:## 3. Goals & Non-Goals
83:### 3.1 Goals
92:### 3.2 Non-Goals
104:## 4. Users & Personas
106:### 4.1 Joe DeMarco — Primary Operator
114:### 4.2 Buddy DeMarco — Co-Owner Stakeholder
121:### 4.3 Nick DeMarco — Builder + Light Maintainer (REVISED 2026-04-30)
129:### 4.4 Veronica — Founder-Couple Talent
135:### 4.5 The "Older Joe DeMarco" — AI Catalog Model (REVISED 2026-04-30)
146:## 5. User Stories / Use Cases
148:### US-1: Weekly ad refresh
158:### US-2: New product launch
codex
I have the first half of the PRD and the section map. Next I’m pulling the architecture, milestones, risks, and review report sections so I can anchor findings to the implementation assumptions and stated mitigations.
exec
/bin/bash -lc "nl -ba docs/saltwater-ads/PRD.md | sed -n '260,420p'" in /Users/nickd/Workspaces/AgentArchitectexec
/bin/bash -lc "nl -ba docs/saltwater-ads/PRD.md | sed -n '420,535p'" in /Users/nickd/Workspaces/AgentArchitect succeeded in 424ms:
/Users/nickd/.bash_profile: line 47: /usr/local/bin/gog.bash: No such file or directory
   260	#### 6.1.5 Assembly
   261	- **F-AS-1:** FFmpeg pipeline that concatenates rendered layers in order (Hook → Showcase → B-roll → CTA) into single 15–30s 9:16 1080p MP4.
   262	- **F-AS-2:** Burn-in captions (Whisper-generated or HeyGen-provided), Saltwater brand font, white-on-black-strip lower-third style.
   263	- **F-AS-3:** Brand overlay: Saltwater logo in corner, optional CTA card last frame ("Coastal Comfort™ · Shop Now" + CTA button graphic).
   264	- **F-AS-4:** Output in 9:16 1080p MP4 (Meta/IG primary), with optional 1:1 1080×1080 and 16:9 1920×1080 secondaries.
   265	- **F-AS-5:** Embedded metadata: ad_id, hooks used, layers used, AI-disclosure flag.
   266	- **F-AS-6:** Output saved to `context-buckets/saltwater-cache/renders/YYYY-MM-DD/<ad_id>/`.
   267	
   268	#### 6.1.6 Meta Pusher (Sprint 2)
   269	- **F-MP-1:** Push approved ad to Saltwater's Meta Ads Manager as a draft ad in a pre-configured campaign/ad-set hierarchy.
   270	- **F-MP-2:** Set ad creative fields: video file, primary text (from Hook Generator), CTA button, destination URL.
   271	- **F-MP-3:** Set AI-generated content flag where any AI layer was used.
   272	- **F-MP-4:** Return Meta ad ID to system; log into ad-history bucket.
   273	- **F-MP-5:** Never auto-publish without explicit operator approval click.
   274	
   275	### 6.2 By web-app screen (Sprint 1, REVISED 2026-04-30)
   276	
   277	**Brutal narrowing applied** — original v0.1 had 6 screens. v1 ships only 3:
   278	
 succeeded in 394ms:
/Users/nickd/.bash_profile: line 47: /usr/local/bin/gog.bash: No such file or directory
   420	- **End of month 1 (after first 4 weeks of ads):** **Hard kill criterion (REVISED 2026-04-30).** Three signals; any one of them flags concerns, two flag kill:
   421	  1. **Qualitative gate:** <70% of ads pass Joe's "yeah that sounds like Saltwater" gut test.
   422	  2. **Spend efficiency:** 4-week trailing CPA significantly worse than baseline (>20%).
   423	  3. **Operator load:** Joe spending >30 min/week on system ops.
   424	
   425	  Hit-rate is **NOT** the month-1 gate (sample too small to be statistically meaningful at $3K/mo spend). Track it for context; judge it at month 3 when sample size is real.
   426	
   427	---
   428	
   429	## 10. Success Metrics
   430	
   431	### 10.1 Primary gate: Qualitative + spend efficiency (REVISED 2026-04-30)
   432	
   433	**Honesty about statistics first:** at $3K/mo Meta spend, 4 weeks produces ~10-20 ad variants live. Detecting a 7%→10.5% hit-rate lift at that volume is below the statistical-significance floor. The original PRD treated hit-rate as a hard pass/fail gate; that was numerology. Revised below.
   434	
   435	**Hard gate (end of month 1):**
   436	- **Qualitative — Joe's gut:** Does Joe say "yeah, that sounds like Saltwater" on every ad shipped? If <70% pass that test, kill.
   437	- **Spend efficiency trend:** Has the 4-week trailing CPA stayed within ±20% of baseline (i.e., the system is at minimum NOT making ad performance worse)? If significantly worse, kill.
   438	- **Operator-load reality:** Is Joe's actual time-per-ad ≤ 5 min? If he's spending >30 min/week on ops, system is broken regardless of output quality.







thinking
**Reviewing PRD for architecture**

I'm focused on reviewing the PRD for architectural soundness, prioritizing engineering execution rather than repeating strategy concerns. I need to identify around 8-15 findings and order them by severity. It’s important to reference specific lines, particularly from sections 6, 7, 8, and 9. There’s a critical contradiction between Sprint 1 describing the web app and the CLI approach, which affects feasibility, so I’ll note specific lines to highlight this. Additionally, the boundaries involving agent specialists and APIs seem unclear.
thinking
**Addressing concurrency issues**

I'm noticing concurrency and idempotency issues due to the lack of a canonical job model or ad artifact. Simultaneous ads create race conditions on shared JSON/JSONL and render directories. I think we definitely need a "job" or "run" database to address this. It’s critical to reference various lines for context, including shared buckets and brand bucket writes. To fix this, we should separate immutable brand configuration from per-run state in the database, versioned with snapshots, using a queue and lock to manage it effectively.
thinking
**Analyzing vendor rendering issues**

I'm noticing issues with vendor timeouts and render failures due to an ambiguous brief. It seems the Product Requirements Document (PRD) is missing elements like an end-to-end state machine and a retry budget for multi-vendor async rendering. We've got critical items to address, particularly around defining orchestration states and setting vendor deadlines. The performance goal of 3 minutes per ad could be unrealistic for multiple variants. I need to clarify missing concurrency and rate limits elsewhere as well.
thinking
**Addressing test coverage and security**

I need to fix the SLA definition by focusing on jobs rather than ads, and also add a concurrency budget and fallback options. There are gaps in test coverage, especially for prompt validation and render orchestration, which might require listing specific issues. It's concerning that there's no contract-test strategy for the four vendor APIs or a simulator in the PRD. I also need to address security, particularly regarding API key storage and the inconsistency of the dual-secret model. This definitely raises some critical points!
thinking
**Considering brand bucket security**

I'm recognizing that the brand bucket and output assets include proprietary brand materials, which means I need to establish access controls for them in a shared drive. It's also important to define how storage and separation will work. Another security concern is that even though TW may not have PII, the ads could contain licensed footage or family likeness, so signed URLs with expiry are necessary. The user focused on brand bucket access control, so I should definitely make a note of that.
thinking
**Evaluating project approach**

I'm thinking we should focus on a straightforward, happy-path vertical slice first, like a manual brand bucket with one vendor path, avoiding TW feedback or complex secret management for now. The user mentioned not to repeat strategy concerns, yet I do have to consider engineering feasibility. There are critical path dependencies leading to open questions that could block Sprint 1, especially regarding TW, domain, and tagging decisions. I'm noticing contradictions that need clarification before proceeding.
thinking
**Considering review gating issues**

I'm noticing that the operational definition of how review gating is enforced in the system isn't clear. This could present a medium to high risk. I think we should either remove the hard gate in the system for version 1 or disable the founder-voice without the associated review artifacts. But wait, the user mentioned not to repeat strategy concerns. I may need to cite specifics, like the references in the Hook Generator at line 233.
codex
The main problems are already emerging from inconsistencies in the PRD itself rather than missing detail alone: shared file-state as the system backbone, no canonical job/data model, and conflicting decisions about CLI vs hosted web app. I’m turning those into a severity-ordered review now and checking for additional coupling, compliance, and feasibility gaps before I finalize.
Plan update
Reviewed the PRD structure and extracted the sections that define scope, architecture, reliability, security, and milestones. Now consolidating findings into a severity-ordered engineering review with concrete fixes.
  ✓ Read PRD and identify architecture, runtime, and delivery assumptions
  → Map execution risks to specific sections and line references
  • Produce severity-ordered engineering review with fixes, test gaps, and feasibility assessment









thinking
**Organizing findings for clarity**

I'm thinking about how to integrate categories for my findings or provide direct answers regarding test coverage, performance, and feasibility afterward. The list of findings might not cover all test types directly. I need to ensure my answer addresses the requested items 1-7. After the findings, I might add sections on "Test gaps" and "Feasibility." However, I need to focus on the findings first. I also want to avoid nested bullets, maybe using a numbered list for findings and flat bullets for open questions.
thinking
**Evaluating project scope and assumptions**

I’m considering aspects like b-roll lookup, caption generation, and FFmpeg assembly. There are promised three variants in five minutes and nine in thirty, but the SLA feels speculative without certain vendor assumptions. I think I need to redefine the SLA to be more precise, especially about concurrency, latency budgets, and handling slow layers. Also, the Sprint 1 plan appears too large for a single developer within 4-6 weeks, given its complexity with both platform and media tasks.
thinking
**Refining project delivery and structure**

I need to adjust the project plan by delivering a vertical slice first. This means starting with one operator, one vendor render path, and local object storage, without involving the TW feedback loop or Buddy flow. I'll only introduce TW and a second render provider after the first five ads render smoothly. I also noticed that mixing "specialist agents" with deterministic adapters complicates orchestration without adding real intelligence. I should keep the Hook Generator as the LLM-driven component and treat the other parts as backend services for simpler management.
thinking
**Addressing media processing issues**

I’ve noticed that while concatenation, captions, brand overlay, metadata, and multi-format output are mentioned, there’s no normalization contract in place for key specifications like resolution, frame rate, and audio loudness. These are classic "looks simple" problems that can complicate things. To fix this, I should define a clear media contract for all inputs and outputs, including guidelines for test fixtures and deterministic assembly profiles before setting up the pipeline. I also need to describe the Triple Whale ingestion as an incremental sync model instead of just daily JSONL dumps.
thinking
**Mentioning brief validation issues**

I might need to clarify an edge case about the brief being ambiguous. It could be worthwhile to mention that without proper validation or fallback options, like asking for clarification, we might miss important details. For instance, if a user asks about an ambiguous brief, it could arise from underspecified input or a missing SKU. I should also consider adding a brief validator or normalizer to improve clarity. Maybe I should suggest swapping out too many items if necessary and focus on concise 12 findings with a section for test coverage.
thinking
**Listing test categories**

I’m thinking of breaking down several important test categories. 

First, I need contract tests for each vendor adapter, focusing on timeout, rate limits, malformed payloads, and version drift. Next, I should include deterministic tests for hook validation, checking vocabulary inputs and outputs, trademark compliance, and other rules. 

I also want to outline orchestration tests, media golden tests, E2E tests for the web app, and compliance checks, all while noting any gaps from the PRD that may not be explicitly mentioned.
thinking
**Organizing findings and documentation**

I could create a brief list covering things like vendor async media rendering, caption timing, b-roll tagging, and authentication management. I might consider using sections for clarity, like findings, test gaps, and feasibility. However, I don’t want to include anything about executing forbidden files. 

I’m aiming for around 65 lines total, with each finding being concise—about 2-3 lines each—resulting in a numbered list. I’ll ensure there are no nested bullets for simplicity. Sounds manageable!
thinking
**Structuring the findings**

I want to make sure I clarify my findings effectively. For instance, I could note that shared file buckets are simultaneously acting as both a config store and a runtime database. Each entry might include a paragraph summarizing what's wrong, references, and suggested fixes.

I need to avoid nested bullets and incorporate clickable file links. Referring to sections by line along with section names inline sounds useful, like saying "Refs: §8.1/§6.1.1." I think this will keep everything concise and easy to follow!
thinking
**Considering architecture boundaries**

I need to think about the overall architecture boundaries. Six specialists seem like a reasonable amount. I should say that the "LLM specialist boundary" is alright, but deterministic adapters shouldn't act as agents. I might also want to mention the vendor APIs — the user noted four, but I actually have five in mind: HeyGen, Fashn, Higgsfield, TW, and Meta. Maybe they're counting without Meta? But does it really matter?
codex
I’ve got the final set of engineering findings. The biggest risks are state management, orchestration semantics, and an over-ambitious Sprint 1 that mixes hosted-app concerns with media-pipeline concerns before the data model is even defined.

thinking
**Planning the draft layout**

Alright, I'm looking at a structured approach with 13 numbered items, which could fill about 26-39 lines depending on line wrapping. I'll add 5 bullets for testing gaps and another 3 for feasibility, which might bring me to around 50 lines total. I need to be careful, though, since long URLs in markdown can make things messy. No nested bullets—keeping it simple is key. Let's get started on the composition!
codex
**Findings**
1. `Critical` Shared context buckets are being used as both durable config and live runtime state. What’s wrong: `voice.md`, `customer.md`, `products.json`, daily TW caches, render outputs, and winners/losers JSONL all sit in shared filesystem state, while the PRD also expects concurrent web app/CLI usage and idempotent reruns; two simultaneous generations will race on appends, cache keys, and asset paths. Refs: §8.1 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:382), §6.1.1 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:228), §6.1.5 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:266). Fix: introduce a canonical backend store for jobs/runs/assets/performance, keep the brand bucket versioned and read-only per run, and use object storage only for media.

2. `Critical` There is no end-to-end job state machine for the multi-vendor render pipeline. What’s wrong: HeyGen, Fashn, optional Higgsfield, b-roll selection, captioning, and FFmpeg are described as one orchestration step, but there are no defined states, deadlines, retries, resume semantics, or partial-failure behaviors; vendor timeout or FFmpeg failure leaves the system in an undefined state. Refs: §6.1.4 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:251), §7.6 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:331), §7.8 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:341). Fix: define explicit job states like `queued`, `vendor_pending`, `partial`, `assembled`, `ready_for_review`, `failed`, with per-vendor timeout budgets, retry caps, and operator-visible recovery actions.

3. `Critical` The runtime/deployment plan is internally contradictory. What’s wrong: §6.3 says Sprint 1 is CLI-first before the web app, Sprint 1 milestones say “web app from day 1” and “Path B locked,” and open questions still say Path A vs Path B is undecided; that blocks clean design for auth, secrets, storage, and support. Refs: §6.3 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:292), §9 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:410), §12 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:502). Fix: pick one runtime for Sprint 1 and delete the alternative from the PRD.

4. `High` There is no canonical entity model tying together briefs, hooks, variants, render attempts, approvals, Meta drafts, and TW performance. What’s wrong: `ad_id` appears in logs and metadata, but its lifecycle and relationship to variant IDs and external IDs are undefined, so the feedback loop and review queue will drift or duplicate. Refs: §6.1.1 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:228), §6.1.5 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:265), §6.1.6 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:272), §10.4 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:463). Fix: add schemas for `brief`, `hook_set`, `variant`, `render_attempt`, `asset`, `approval`, `publish_event`, and `performance_snapshot`, all versioned.

5. `High` AI disclosure compliance is framed as a system requirement but implemented as a manual human step in v1. What’s wrong: Joe is expected to manually set the Meta AI-generated flag during upload, which means compliance is not enforceable or testable end to end. Refs: §5 US-7 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:203), §5 US-7 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:208), §7.5 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:326). Fix: emit a mandatory compliance manifest per asset, block “ready for upload” until disclosure is acknowledged, and move platform flag setting earlier if compliance is hard-gated.

6. `High` The web app security model is underspecified. What’s wrong: there is a Settings screen for API keys, but the PRD only says “OS keychain or web-app secrets store”; there is no authN/authZ model for Joe/Nick/Buddy, no guarantee that keys remain server-side, and no access-control plan for the brand bucket or render assets. Refs: §6.2 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:279), §7.7 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:337), §8.2 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:399). Fix: define backend-only secret storage, operator auth, expiring read-only review links, and per-role access to config vs media.

7. `High` The latency target is not supported by the specified pipeline. What’s wrong: the PRD promises three finished variants in five minutes and nine in thirty, while each variant requires multiple external renders plus assembly; no concurrency limits, vendor rate limits, or cache-hit assumptions are defined. Refs: §5 US-1 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:153), §5 US-2 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:164), §7.2 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:309). Fix: define job-level SLAs with explicit parallelism assumptions, vendor quotas, and degraded-mode behavior when a layer is slow.

8. `High` Sprint 1 is still too large for a solo developer in 4-6 weeks. What’s wrong: the plan includes hosted app, review queue, brand bucket management, TW connector, two render vendors, FFmpeg assembly, and live ad delivery while core dependencies like TW access, b-roll tagging, avatar setup, and hosting are still open. Refs: §9 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:410), §12 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:498), [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:503), [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:506), [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:507). Fix: ship one vertical slice first: single operator, one render path, one review flow, manual compliance checklist, no TW feedback loop.

9. `High` Prompt/runtime behavior is coupled to a personal local tool path. What’s wrong: the Hook Generator is specified via `~/.claude/skills/claude-api/SKILL.md`, which is not a product dependency and will not survive handoff or hosted deployment. Refs: §6.1.2 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:233), §8.2 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:401). Fix: define a repo-owned LLM provider abstraction and documented caching contract.

10. `Medium` Deterministic infrastructure is over-modeled as “agents.” What’s wrong: Brand Bucket Manager, TW Connector, Assembly, and Meta Pusher behave like services/adapters, not autonomous specialists; treating them as agents adds orchestration, retry, and permission complexity without functional gain. Refs: §6.1 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:221), §8.1 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:368). Fix: keep the LLM-driven Hook Generator as the real agent and implement the rest as deterministic backend modules.

11. `Medium` FFmpeg assembly is underspecified relative to the quality bar. What’s wrong: captions, overlays, metadata, and multi-format output are required, but there is no contract for frame rate normalization, audio loudness, padding/cropping, caption timing source, or font packaging; this is where “simple stitching” projects usually break. Refs: §6.1.5 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:261), [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:262), §7.4 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:321). Fix: write a media spec first and back it with golden-media tests.

12. `Medium` Triple Whale ingestion is likely to become an N+1/duplication problem. What’s wrong: “on-demand pulls” plus day-stamped JSONL caches are fine for a POC, but not for decays, medians, or attribution joins across many ads; recomputation will be slow and error-prone. Refs: §6.1.3 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:245), [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:246), [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:248). Fix: use incremental sync keyed by TW IDs plus a watermark, and materialize normalized snapshots for analytics.

13. `Medium` Brief intake is too loose for reliable automation. What’s wrong: a one-line brief with mostly optional fields will fail on ambiguous SKU/season/pattern combinations and produce low-confidence outputs or unnecessary regens. Refs: §5 US-1 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:152), §6.1.2 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:234), §6.2 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:279). Fix: add a brief normalizer with required fields, defaults, validation errors, and a clarification path before generation starts.

**Test Gaps**
- Hook generation needs unit/property tests for trademark verbatim enforcement, vocabulary blocklists, date-gated rules, prompt-version caching, and ambiguity rejection.
- Orchestration needs contract tests against mocked vendor adapters for timeout, retry, rate-limit, duplicate-submit, and two-simultaneous-job cases.
- FFmpeg needs golden-media tests for mixed aspect ratios, missing audio, corrupt clips, caption drift, metadata embedding, and file-size limits.
- The web app needs E2E tests for generate, regen, approve, reject, partial-failure recovery, and optimistic locking in the review queue.
- Compliance needs integration tests proving AI-layer metadata survives from render selection through export/Meta push; the PRD currently names only one synthetic failure test in Sprint 1.5 and no broader test strategy. Refs: [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:411), [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:531).

**Feasibility**
As written, no: a solo developer is unlikely to deliver the full hosted web app, secure secret handling, two vendor render integrations, TW ingestion, FFmpeg pipeline, review queue, and reliable handoff in 4-6 weeks. A realistic 4-6 week outcome is a narrow vertical slice that renders ads end to end for one operator with strong manual fallbacks; the rest should follow only after the data model, orchestration state machine, and security model are fixed.
tokens used
54,669
**Findings**
1. `Critical` Shared context buckets are being used as both durable config and live runtime state. What’s wrong: `voice.md`, `customer.md`, `products.json`, daily TW caches, render outputs, and winners/losers JSONL all sit in shared filesystem state, while the PRD also expects concurrent web app/CLI usage and idempotent reruns; two simultaneous generations will race on appends, cache keys, and asset paths. Refs: §8.1 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:382), §6.1.1 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:228), §6.1.5 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:266). Fix: introduce a canonical backend store for jobs/runs/assets/performance, keep the brand bucket versioned and read-only per run, and use object storage only for media.

2. `Critical` There is no end-to-end job state machine for the multi-vendor render pipeline. What’s wrong: HeyGen, Fashn, optional Higgsfield, b-roll selection, captioning, and FFmpeg are described as one orchestration step, but there are no defined states, deadlines, retries, resume semantics, or partial-failure behaviors; vendor timeout or FFmpeg failure leaves the system in an undefined state. Refs: §6.1.4 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:251), §7.6 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:331), §7.8 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:341). Fix: define explicit job states like `queued`, `vendor_pending`, `partial`, `assembled`, `ready_for_review`, `failed`, with per-vendor timeout budgets, retry caps, and operator-visible recovery actions.

3. `Critical` The runtime/deployment plan is internally contradictory. What’s wrong: §6.3 says Sprint 1 is CLI-first before the web app, Sprint 1 milestones say “web app from day 1” and “Path B locked,” and open questions still say Path A vs Path B is undecided; that blocks clean design for auth, secrets, storage, and support. Refs: §6.3 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:292), §9 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:410), §12 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:502). Fix: pick one runtime for Sprint 1 and delete the alternative from the PRD.

4. `High` There is no canonical entity model tying together briefs, hooks, variants, render attempts, approvals, Meta drafts, and TW performance. What’s wrong: `ad_id` appears in logs and metadata, but its lifecycle and relationship to variant IDs and external IDs are undefined, so the feedback loop and review queue will drift or duplicate. Refs: §6.1.1 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:228), §6.1.5 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:265), §6.1.6 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:272), §10.4 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:463). Fix: add schemas for `brief`, `hook_set`, `variant`, `render_attempt`, `asset`, `approval`, `publish_event`, and `performance_snapshot`, all versioned.

5. `High` AI disclosure compliance is framed as a system requirement but implemented as a manual human step in v1. What’s wrong: Joe is expected to manually set the Meta AI-generated flag during upload, which means compliance is not enforceable or testable end to end. Refs: §5 US-7 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:203), §5 US-7 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:208), §7.5 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:326). Fix: emit a mandatory compliance manifest per asset, block “ready for upload” until disclosure is acknowledged, and move platform flag setting earlier if compliance is hard-gated.

6. `High` The web app security model is underspecified. What’s wrong: there is a Settings screen for API keys, but the PRD only says “OS keychain or web-app secrets store”; there is no authN/authZ model for Joe/Nick/Buddy, no guarantee that keys remain server-side, and no access-control plan for the brand bucket or render assets. Refs: §6.2 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:279), §7.7 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:337), §8.2 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:399). Fix: define backend-only secret storage, operator auth, expiring read-only review links, and per-role access to config vs media.

7. `High` The latency target is not supported by the specified pipeline. What’s wrong: the PRD promises three finished variants in five minutes and nine in thirty, while each variant requires multiple external renders plus assembly; no concurrency limits, vendor rate limits, or cache-hit assumptions are defined. Refs: §5 US-1 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:153), §5 US-2 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:164), §7.2 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:309). Fix: define job-level SLAs with explicit parallelism assumptions, vendor quotas, and degraded-mode behavior when a layer is slow.

8. `High` Sprint 1 is still too large for a solo developer in 4-6 weeks. What’s wrong: the plan includes hosted app, review queue, brand bucket management, TW connector, two render vendors, FFmpeg assembly, and live ad delivery while core dependencies like TW access, b-roll tagging, avatar setup, and hosting are still open. Refs: §9 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:410), §12 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:498), [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:503), [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:506), [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:507). Fix: ship one vertical slice first: single operator, one render path, one review flow, manual compliance checklist, no TW feedback loop.

9. `High` Prompt/runtime behavior is coupled to a personal local tool path. What’s wrong: the Hook Generator is specified via `~/.claude/skills/claude-api/SKILL.md`, which is not a product dependency and will not survive handoff or hosted deployment. Refs: §6.1.2 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:233), §8.2 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:401). Fix: define a repo-owned LLM provider abstraction and documented caching contract.

10. `Medium` Deterministic infrastructure is over-modeled as “agents.” What’s wrong: Brand Bucket Manager, TW Connector, Assembly, and Meta Pusher behave like services/adapters, not autonomous specialists; treating them as agents adds orchestration, retry, and permission complexity without functional gain. Refs: §6.1 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:221), §8.1 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:368). Fix: keep the LLM-driven Hook Generator as the real agent and implement the rest as deterministic backend modules.

11. `Medium` FFmpeg assembly is underspecified relative to the quality bar. What’s wrong: captions, overlays, metadata, and multi-format output are required, but there is no contract for frame rate normalization, audio loudness, padding/cropping, caption timing source, or font packaging; this is where “simple stitching” projects usually break. Refs: §6.1.5 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:261), [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:262), §7.4 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:321). Fix: write a media spec first and back it with golden-media tests.

12. `Medium` Triple Whale ingestion is likely to become an N+1/duplication problem. What’s wrong: “on-demand pulls” plus day-stamped JSONL caches are fine for a POC, but not for decays, medians, or attribution joins across many ads; recomputation will be slow and error-prone. Refs: §6.1.3 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:245), [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:246), [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:248). Fix: use incremental sync keyed by TW IDs plus a watermark, and materialize normalized snapshots for analytics.

13. `Medium` Brief intake is too loose for reliable automation. What’s wrong: a one-line brief with mostly optional fields will fail on ambiguous SKU/season/pattern combinations and produce low-confidence outputs or unnecessary regens. Refs: §5 US-1 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:152), §6.1.2 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:234), §6.2 [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:279). Fix: add a brief normalizer with required fields, defaults, validation errors, and a clarification path before generation starts.

**Test Gaps**
- Hook generation needs unit/property tests for trademark verbatim enforcement, vocabulary blocklists, date-gated rules, prompt-version caching, and ambiguity rejection.
- Orchestration needs contract tests against mocked vendor adapters for timeout, retry, rate-limit, duplicate-submit, and two-simultaneous-job cases.
- FFmpeg needs golden-media tests for mixed aspect ratios, missing audio, corrupt clips, caption drift, metadata embedding, and file-size limits.
- The web app needs E2E tests for generate, regen, approve, reject, partial-failure recovery, and optimistic locking in the review queue.
- Compliance needs integration tests proving AI-layer metadata survives from render selection through export/Meta push; the PRD currently names only one synthetic failure test in Sprint 1.5 and no broader test strategy. Refs: [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:411), [PRD.md](/Users/nickd/Workspaces/AgentArchitect/docs/saltwater-ads/PRD.md:531).

**Feasibility**
As written, no: a solo developer is unlikely to deliver the full hosted web app, secure secret handling, two vendor render integrations, TW ingestion, FFmpeg pipeline, review queue, and reliable handoff in 4-6 weeks. A realistic 4-6 week outcome is a narrow vertical slice that renders ads end to end for one operator with strong manual fallbacks; the rest should follow only after the data model, orchestration state machine, and security model are fixed.
