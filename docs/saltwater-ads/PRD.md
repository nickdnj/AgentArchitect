<!-- /autoplan restore point: /Users/nickd/.gstack/projects/nickdnj-AgentArchitect/main-autoplan-saltwater-ads-restore-20260430-084632.md -->
# Product Requirements Document: Saltwater AI Ads

**Version:** 0.3 (Draft — revised after eng review)
**Last Updated:** 2026-04-30
**Author:** Nick DeMarco (with AI assistance)
**Status:** Draft — for Joe DeMarco review and engineering kickoff
**Customer:** Joe DeMarco, co-owner Saltwater Clothing Co. (saltwaterclothingco.com)
**Owner during build:** Nick DeMarco
**Owner after week 4:** Joe DeMarco (handoff)

---

## 1. Executive Summary

Saltwater AI Ads is a **brand-locked, single-tenant ad creative engine** built specifically for Saltwater Clothing Co. — a DTC coastal apparel brand co-owned by Joe and Buddy DeMarco. It collapses the time and cost to produce a Meta/IG-ready video ad from 2–3 hours of human production work down to roughly 5 minutes of operator review.

The system is two things at once:

1. **An AgentArchitect agent team** (Brand Bucket Manager, Hook Generator, Triple Whale Connector, Render Orchestrator, Assembly, Meta Pusher) running against shared Saltwater context buckets that hold the brand voice, customer archetype, and (over time) a log of which hooks won and lost. The bucket starts as a prompt context library; whether it becomes a true compounding moat depends on data volume — see §10.4.
2. **A web app and/or local CLI** (Sprint 1.5) that lets Joe operate the team — type a brief, get 3 finished 9:16 video ad variants back, approve, push to Meta.

Why now: Joe explicitly named Facebook/TikTok ad content as the #1 problem AI could solve for Saltwater today. The off-the-shelf AI UGC tools he evaluated (MakeUGC, Creatify, Arcads) produce generic "AI slop" that doesn't sound like Saltwater. The unlock is a 4-layer hybrid stack — HeyGen for the founder, Fashn.ai for a defined customer archetype, real Saltwater footage for outdoor b-roll, and Higgsfield for the occasional virtual hero shot — orchestrated by an agent team that learns from Triple Whale performance data weekly. All-in new spend: **$203–253/mo**, less than 10% of Saltwater's $3K/mo ad floor.

Nick is the builder. Nick is **not** the recurring operator. By end of week 4, Joe owns and runs the system. The agent team and brand buckets are the durable artifacts; the web app or CLI bundle is the surface Joe drives them through.

The success metric is **hit rate** — the percentage of generated ads that scale (>2× ROAS in test budget) — not creative volume. If the hit rate doesn't improve over baseline by end of month 1, the project is killed cleanly without committing to Sprints 2/3.

---

## 2. Problem Statement

### 2.1 Joe's pain

Joe runs Saltwater's paid social himself. The current state:

- **$3K/mo Meta baseline**, scaling to $10–15K/mo when a creative wins.
- **22 ad concepts shipped in 2025** (Jan–Nov), each with 3–6 A/B variants (V1–V6). That's ~2 concepts/month — disciplined, but bottlenecked on production capacity, not ideas.
- **Each ad concept = 2–3 hours of work** for Joe and Veronica, plus shoot scheduling for outdoor location footage.
- **Burned by paid human UGC creators** in the past — inconsistent quality, off-brand voice, slow turnaround.
- **Zero usable AI options today** that respect Saltwater's voice. The platforms Joe evaluated (MakeUGC, Creatify, Arcads) all default to stock AI avatars reading generic DTC scripts. Every other DTC brand using those tools sounds the same. The avatars look like avatars.

### 2.2 Why off-the-shelf AI UGC fails Saltwater

| Tool | Why it fails for Saltwater |
|---|---|
| MakeUGC | Stock avatars only. No founder presence. No brand-voice control beyond "write the script yourself." |
| Creatify | Lip-sync inconsistency, AI detection flags on TikTok, generic URL-to-video output that doesn't sound like the brand. |
| Arcads | Best of the three for hook iteration, but renders are talking-head only — no product showcase, no outdoor lifestyle, no founder authenticity. |
| HeyGen alone | Solves founder hook problem cleanly with a custom Photo Avatar of Joe, but doesn't render full-body lifestyle product shots and doesn't render outdoor coastal scenes that match what Saltwater actually shoots. |

**The gap:** No single tool produces a complete Meta-ready 15–30s ad in Saltwater's voice, with Saltwater's founder, on Saltwater's products, in Saltwater's coastal aesthetic. There is also no tool that **learns from Saltwater's own performance data** over time and tightens the creative loop.

### 2.3 Why build (honest version, REVISED 2026-04-30)

The original PRD claimed build wins on cost economics. That was dishonest because it priced Nick's 4 weeks of build time at $0. Honest accounting:

- Nick's 4 weeks ≈ 80 hours × ~$200/hr opportunity cost = **~$16K equivalent**
- A $500/mo freelance video editor + Arcads with brand-bucket prompting plausibly delivers ~80% of the value with ~10% of the build risk and zero handoff cliff
- $500/mo × 12 months = $6K/yr — Joe's first-year alternative cost

**So why build anyway?** Three honest reasons:

1. **Family-business contribution.** Saltwater is co-owned by Buddy DeMarco (Nick's brother) and Joe DeMarco (Nick's nephew). Nick's time on this is a gift to family. He'd spend it building anyway. The "cost" is real but it's not a market transaction.
2. **AgentArchitect framework investment.** This is the first real customer build for the AgentArchitect framework. Patterns, agents, and tooling that work here become reusable for future clients. Treat it as R&D + reference deployment.
3. **Compounding brand bucket as a real product feature, IF the data justifies it.** The "compounding moat" claim from v0.1 was overstated — at ~22 concepts/year, Saltwater doesn't have enough volume to justify a "learning engine" narrative on day 1. But if month 6 logs 80+ winners and 30+ losers with measurable TW performance attached, the compounding story earns itself.
4. **Potential equity upside.** Buddy has offered Nick 1% equity + CTO title in Saltwater. If the system works and contributes meaningfully to growth, that 1% has direct value. (Nick is undecided on the CTO title; the equity is on the table regardless.)

**Multi-surface output (Meta + Google + PMAX) and single-tenant control are real differentiators**, but they don't justify the build alone — they're nice-to-haves on top of the family + framework + equity case. If those four motivations weren't all present, the right answer would be a $500/mo freelancer + Arcads.

### 2.4 What we are NOT solving

- **We are not building a multi-tenant SaaS.** This is single-tenant for Saltwater. Future customers, if any, get a starter-kit fork.
- **We are not replacing Triple Whale.** TW has a real moat (5-year, $50M pixel and attribution stack across Meta/Google/TikTok/Klaviyo/Shopify). We integrate with it via API; we do not duplicate it.
- **We are not replacing real photo shoot days.** For flagship brand-anchor creative — Joe in five outfits on a dock at golden hour — a real 2-hour shoot with the existing talent ensemble (Joe, Veronica, Nick, Gina, Erin) still wins. AI handles volume and iteration; real footage handles brand anchors.
- **We are not solving cross-tool likeness consistency.** HeyGen renders Joe (real likeness, founder voice). Fashn renders an AI catalog model (a stylized rendering for per-SKU showcase, same role a stock fit model plays in catalog photography). These are **different jobs by design** — Joe talks ABOUT the brand, the catalog model wears the products. We don't pretend either is a real customer or a real founder proxy.
- **We are not adding multiple AI talent layers.** Original v0.1 had three synthetic talents (HeyGen + Fashn + Higgsfield). Revised stack uses Fashn for AI catalog photography only and treats Higgsfield as deferred experimental scope (see §9). HeyGen renders the real Joe; everything else is either AI catalog photography or real Saltwater footage.

---

## 3. Goals & Non-Goals

### 3.1 Goals

1. **Hit-rate lift over baseline.** Within 4 weeks of first ads going live, demonstrate measurable improvement in % of ads that scale (>2× ROAS in test budget) vs. Saltwater's 2025 baseline.
2. **Operator time-per-ad ≤ 5 minutes.** From "Joe types a brief" to "Joe approves a finished video variant," the active-attention time is no more than 5 minutes per ad. (Render latency is separate; see §7.)
3. **Volume: 40–60 ad variants/month** at production quality, vs. the 2025 baseline of ~2 concepts × 3–6 variants ≈ 6–12 variants/month.
4. **Cost per ad: ≤ $10 compute** all-in (HeyGen + Fashn + Higgsfield API credits + Claude tokens + assembly).
5. **Joe owns the system end-to-end by end of week 4.** Nick exits as the operator. The build is the durable handoff.
6. **Brand-locked output.** Every generated ad passes the gut test: Joe reads/watches it and says "yeah, that's Saltwater," not "that's AI."

### 3.2 Non-Goals

- Replacing Triple Whale or building any attribution layer.
- Replacing flagship real-shoot days for brand-anchor creative.
- Multi-tenant SaaS architecture, billing, auth-as-a-service, etc.
- TikTok platform support in Sprint 1 (Sprint 2 territory).
- Likeness training that puts Joe's actual face on a specific Saltwater garment in true outdoor video — this remains an unsolved problem in 2026 and we do not pretend to solve it.
- Print/embroidery/complex-pattern fidelity. Saltwater's catalog is solid colors, simple stripes, fleece, cotton, denim — well within the AI tools' competence. If Saltwater adds intricate prints, that's a re-evaluation, not a v1 requirement.
- Real-time collaborative editing for multiple operators. Joe is the only operator. Buddy reviews via shared link.

---

## 4. Users & Personas

### 4.1 Joe DeMarco — Primary Operator

- **Role:** Co-owner, Saltwater Clothing Co. Day-to-day media buyer.
- **Tech comfort:** Comfortable with web apps, Meta Ads Manager, Triple Whale dashboards, Shopify admin. Not a CLI user. Not a developer.
- **Time budget:** Wants ≤ 5 min/ad of active attention. Will not invest 30+ min/day learning new tools.
- **Goal:** Ship more winning ads with less production overhead, without giving up the Saltwater voice.
- **Failure mode for him:** Tool produces "AI slop" — generic copy, off-brand customer, off-likeness hero shots, broken on-mobile renders. He sees one bad output and stops trusting the system.

### 4.2 Buddy DeMarco — Co-Owner Stakeholder

- **Role:** Co-owner. Reviews ads before they push live, especially when family/founder content is involved.
- **Tech comfort:** Lower than Joe. Reviews via shared link or email preview, not by logging in.
- **Goal:** Make sure ads represent the family business well. Veto power on founder-voice content.
- **Failure mode:** Ad ships with off-tone founder copy, or implies something about the family business that isn't true.

### 4.3 Nick DeMarco — Builder + Light Maintainer (REVISED 2026-04-30)

- **Role:** Architect, builder, ongoing maintainer at low effort. The "exit clean week 4" framing from v0.1 was unrealistic given (a) the family dynamic, (b) the 1% equity offer from Buddy, and (c) the 4 vendor APIs that will have breaking changes within 6 months. Honest version below.
- **Build commitment:** 4-6 weeks of full-time-equivalent effort (concentrated nights/weekends).
- **Post-handoff commitment:** **5-10 hr/month maintenance retainer through month 6** (vendor API breakage, prompt drift, occasional regen). May flex up early as system stabilizes. Drops to as-needed by month 6 if Joe is comfortable operating alone.
- **What Nick still won't do:** Run weekly ad ops. Monitor rendering errors at 11pm. Be the human in the creative-approval loop. Joe owns the operational layer.
- **CTO title (separate decision):** Buddy has offered Nick the CTO title + 1% equity. Nick is undecided on the title (operational responsibility weight); the 1% is on the table regardless. Decision to accept the title pending observed value of the system through month 3.

### 4.4 Veronica — Founder-Couple Talent

- **Role:** Joe's fiancée. Recurring talent in founder-couple ads (e.g., JD013 "Joe + Veronica Irish Flag Push").
- **System touchpoint:** Brand bucket includes her as a known on-camera personality. Founder-couple hook templates exist as a pattern.
- **Constraint:** She is not married to Joe yet (wedding Nov 2026). Copy must not call her his wife.

### 4.5 The "Older Joe DeMarco" — AI Catalog Model (REVISED 2026-04-30)

**Reframed from "synthetic customer archetype" → "AI catalog model".** This is the same role a stock model plays in standard DTC catalog photography (e.g., Banana Republic on-model product shots) — a face for the per-SKU showcase that isn't the founder. Fashn.ai is the same category as Glam.ai or VModel — fashion-specific AI photography for catalog work, not a synthetic founder proxy.

- **NOT a person.** A defined catalog-model identity used across all men's product showcase clips (see `customer.md` in brand bucket).
- **Demographics matched to Saltwater's actual customer:** 32–48, male, coastal/Long Island/Florida/NJ/CT, business owner or sales/finance/trades. Confident, family-oriented, values quality over hype.
- **The job:** AI catalog photography. Render the SKU on a consistent body across the catalog. Same role a freelance fit model would play in a real shoot.
- **NOT pretending to be:** A real customer testimonial. A real brand ambassador. Joe. The PRD treats this transparently as a stylized catalog rendering. Meta AI-disclosure flag is set on every ad using the layer.

---

## 5. User Stories / Use Cases

### US-1: Weekly ad refresh
*As Joe, I want to generate 3 fresh ad variants in 10 minutes for this week's ad rotation, so I can keep creative fresh without blocking on production.*

**Acceptance criteria:**
- Joe types a one-line brief ("New variants for navy quarter-zip, problem/solution angle, fall refresh").
- Within 5 minutes of brief, system returns 3 finished 9:16 1080p MP4 variants, each 15–30s, with HeyGen founder hook + Fashn customer showcase + b-roll + CTA card stitched.
- Each variant includes matching Google Search ad copy block (3 headlines + 1 description, character-limit aware).
- Joe reviews, picks 1–2, optionally tweaks captions, approves.
- Approved variants land in Meta Ads Manager as draft ads (Sprint 2) or download to disk for manual upload (Sprint 1/1.5).

### US-2: New product launch
*As Joe, I want to launch a new SKU with a full ad set on day 1 of the drop, so I can test which hook angle wins before scaling spend.*

**Acceptance criteria:**
- Joe adds the SKU to `products.json` (or equivalent web-app form) with photo, name, price, key claims.
- Joe runs the launch flow: pick SKU, pick "launch capsule" template.
- System generates 3 variants per pattern across the 3 winning patterns (Founder Story, Problem/Solution, Limited Drop) = 9 video variants + matching Google copy blocks.
- Each variant uses the new SKU's product photos for the Fashn.ai try-on layer.
- Output ready for Meta Ads Manager upload within 30 minutes total system runtime.

### US-3: Capsule / holiday drop
*As Joe, I want to spin up a Memorial Day / Valentines / July 4 capsule ad set that ties to the actual seasonal moment, so urgency feels real, not fake.*

**Acceptance criteria:**
- Joe picks a holiday template (system maintains a calendar of confirmed holiday/capsule moments — Memorial Day, July 4, Labor Day, Valentines, holiday gifting, Spring Refresh, Fall Layering).
- Generated copy uses real seasonal hooks ("Memorial Day weekend," "summer's last weekend"), never generic "limited time offer."
- Visual assembly pulls existing real Saltwater b-roll tagged for the relevant season (system reads b-roll metadata).
- Coastal Comfort™ trademark appears verbatim where applicable (e.g., JD006 "Coastal Comfort™ Valentines BOGO" pattern).

### US-4: Reactive refresh from Triple Whale data
*As Joe, I want the system to flag when an ad's hook rate is decaying and proactively suggest 3 refreshed hooks to test against it, so I'm not refreshing creative on a fixed schedule when performance dictates otherwise.*

**Acceptance criteria:**
- Triple Whale Connector pulls Creative Cockpit data daily (or on-demand in Sprint 1).
- When an active ad's 3-day rolling hook rate drops below the per-account median by ≥X% (X tunable, default 25%), system flags it.
- Hook Generator produces 3 fresh variants in the same pattern as the decaying ad, primed with the brand bucket and the fact that this hook is decaying.
- Joe reviews, approves, ships replacement.

### US-5: Brand bucket health check
*As Joe (or Nick during build), I want to inspect what's in the brand bucket and confirm it still reflects Saltwater, so the system doesn't drift over months of compounding.*

**Acceptance criteria:**
- Web app (or CLI) has a "Brand Bucket" view showing current `voice.md`, `customer.md`, recent winning hooks, recent losing hooks.
- Operator can flag/edit/remove entries that no longer feel right.
- System logs every edit with timestamp + author + reason field (free text).

### US-6: Performance review
*As Joe, I want a weekly digest of which ads scaled vs. which flopped, with the hooks attributed back to the brand-bucket patterns that produced them, so I can see what's actually winning.*

**Acceptance criteria:**
- Weekly digest delivered every Monday morning (email or web-app dashboard).
- Includes: ads run last week, hook rate, ROAS, MER, attribution back to the brand pattern (Founder Story / Problem-Solution / Limited Drop) and the source winner-hook (if applicable).
- Hit rate metric prominently displayed: % of last week's ads that scaled (>2× ROAS in test budget).
- Tracks 4-week and 12-week trailing hit rate.

### US-7: AI disclosure compliance (in v1)
*As Joe, I want every ad that uses AI-generated talent (Fashn catalog model) to ship with appropriate AI disclosure, so we don't get flagged or rejected by Meta.*

**Acceptance criteria:**
- Every ad ships with metadata flag indicating which layers are AI-generated.
- Joe sets the "AI-generated content" flag in Meta Ads Manager during manual upload (v1) — auto-set in Sprint 2.
- Optional: subtle on-creative disclosure overlay (toggleable per ad).

### DEFERRED user stories (REVISED 2026-04-30 — scope narrowed)
- **US-DEF-1: Buddy preview-link approval flow** (was US-7 in v0.1). For v1, Joe forwards approved MP4 to Buddy via text/email. Build the preview-link flow only if Buddy explicitly asks for it.
- **US-DEF-2: Manual hook override mode** (was US-8). For v1, Joe edits the hook in the Review Queue's caption-edit field. Full bypass mode deferred.
- **US-DEF-3: Performance digest** (was US-6). For v1, Joe reads TW Creative Cockpit directly. In-app digest deferred.
- **US-DEF-4: Brand bucket UI editor** (was US-5). For v1, edit files via uploader in Settings or directly in the repo. UI editor deferred.

---

## 6. Functional Requirements

### 6.1 Components — 1 agent + 5 services (REVISED 2026-04-30 per eng review)

**Agent vs service distinction:**
- **Agent (LLM-driven):** Hook Generator only. Makes decisions via Claude Sonnet 4.6, takes a brief and brand bucket as input, returns hooks. Real autonomous reasoning.
- **Services (deterministic):** Brand Bucket Manager, TW Connector, Render Orchestrator, Assembly, Meta Pusher. These are CRUD + adapter layers, not agents. Treating them as "agents" added orchestration overhead without functional gain.

**Why the change:** v0.1 framed all 6 as "agents" for AgentArchitect consistency. The eng review flagged that orchestration/retry/permission complexity for deterministic services is wasted overhead. Cleaner: one agent, five services it uses.

The agent + 5 services together still scaffold inside `agents/saltwater-ads/` and `teams/saltwater-ads/` for AgentArchitect framework consistency, but service implementations are plain TypeScript modules in `lib/services/`, NOT Claude-driven specialists.

#### 6.1.1 Brand Bucket Manager
**Owns:** `context-buckets/saltwater-brand/files/`
- **F-BBM-1:** CRUD operations on `voice.md` (Voice IS / IS NOT, vocabulary IN / OUT, tone rules, anti-patterns, founder-voice rules).
- **F-BBM-2:** CRUD operations on `customer.md` ("Older Joe DeMarco" archetype: demographics, personality, lifestyle, buying triggers, hooks that resonate, hooks that fall flat).
- **F-BBM-3:** CRUD operations on `products.json` (SKU catalog: name, price, photos, key claims, season tag).
- **F-BBM-4:** Append-only writes to `hooks-winners.jsonl` and `hooks-losers.jsonl`. Each entry: `{ad_id, hook_text, pattern, sku, hook_rate, roas, source: "tw" | "manual", logged_at}`.
- **F-BBM-5:** Trademark enforcement table: maintains a list of verbatim-only strings. Coastal Comfort™ is the seed entry. Any generated copy violating verbatim must fail validation.
- **F-BBM-6:** Audit log for all edits.

#### 6.1.2 Hook Generator (the only true agent in the system)
**Powered by:** Claude Sonnet 4.6 via repo-owned LLM provider abstraction at `lib/llm/anthropic.ts` (NOT `~/.claude/skills/claude-api/`). Repo-owned for portability and handoff. Provider abstraction supports prompt caching (cache key = brand bucket version + brief shape) and is replaceable with another LLM provider via a single interface change.
- **F-HG-1:** Accept brief input: `{angle, sku_id?, season?, audience_tag?, free_text}`.
- **F-HG-2:** Prime context with cached brand-bucket prompt: `voice.md` + `customer.md` + last 20 entries from `hooks-winners.jsonl` + last 5 from `hooks-losers.jsonl`.
- **F-HG-3:** Output **3 hook variants per request**, each with **3 sub-variants (V1/V2/V3)**.
- **F-HG-4:** Each hook script: ≤140 chars, written for spoken delivery (HeyGen lip-sync), with implicit comfortable pause/breath markers.
- **F-HG-5:** Each hook tagged with the winning pattern it draws from (Founder Story / Problem-Solution / Limited Drop) and any SKU reference.
- **F-HG-6:** Validation pass: vocabulary OUT words trigger rejection and regeneration. Coastal Comfort™ verbatim enforced. Anti-pattern phrases ("elevate your wardrobe", "discover the difference", etc.) blocked.

**DEFERRED to Sprint 3+ (REVISED 2026-04-30):** Google Search copy and Performance Max asset generation. Original v0.1 included these (F-HG-7, F-HG-8) but scope was bloated for one operator and one channel. Meta video is the only proven Saltwater channel today. Add back only when Joe explicitly asks for cross-channel coverage.

#### 6.1.3 Triple Whale Connector (REVISED 2026-04-30 per eng review)

**Service (not agent).** Adapter layer over TW Enterprise REST API.

- **F-TW-1:** Read-only API access using API key from server-side secret store.
- **F-TW-2:** **Incremental sync, not daily JSONL dumps.** Sync model:
  - Every TW pull is keyed by **TW ad ID + watermark timestamp** (last successful sync).
  - New / updated rows since watermark → upserted into `performance_snapshot` table (see §6.6 schema).
  - Watermark advances on successful sync; on failure, retry from last good watermark.
  - Eliminates the N+1 / re-parse-everything problem of day-stamped JSONL caches.
- **F-TW-3:** **On-demand sync (v1).** Operator clicks "Refresh TW data" in Settings; system pulls deltas. **Sprint 2:** add hourly scheduled sync.
- **F-TW-4:** Performance-classification helper: SQL view over `performance_snapshot` tags ads as `winner` (>2× ROAS), `neutral`, or `loser` (<0.5× ROAS).
- **F-TW-5:** Decay detector (US-4 — Sprint 2): SQL query flags ads whose 3-day rolling hook rate drops below per-account 7-day median by ≥X% (X tunable, default 25%).
- **F-TW-6:** Graceful degradation: if TW API is down, system generates ads from brand bucket alone (without performance priming). Hook Generator caches indicate "TW data stale as of [timestamp]" in generation logs.
- **F-TW-7:** All TW responses logged to `audit_log` for compliance + debugging.

#### 6.1.4 Render Orchestrator
- **F-RO-1:** Accept hook script + SKU reference + variant config, return rendered MP4 stitched from layers.
- **F-RO-2:** Layer 1 — HeyGen Team API: render founder hook clip (Joe Photo Avatar talking, 5–10s, 9:16, 1080p). Cache identical hook+avatar pairs to avoid re-billing.
- **F-RO-3:** Layer 2 — Fashn.ai Pro API: try-on of SKU on "Older Joe DeMarco" archetype reference, then animate to 5–10s clip. Coastal background prompt or reference image.
- **F-RO-4:** Layer 3 — B-roll selector: picks from real Saltwater outdoor footage tagged in `b-roll-index.json`. Falls back to nothing (skip layer) if no matching tag.
- **F-RO-5:** Layer 4 (occasional, 2–4×/month) — Higgsfield Creator API: virtual character walking dock in specified Saltwater piece. Manual trigger only in Sprint 1; auto-trigger by template type in Sprint 2.
- **F-RO-6:** Per-render cost tracking: log credit/token usage per call to per-ad cost ledger.
- **F-RO-7:** Likeness regen handling: detect Fashn off-likeness (operator flag in Sprint 1, automated similarity check in Sprint 3); regenerate up to 3× before failing.

#### 6.1.5 Assembly
- **F-AS-1:** FFmpeg pipeline that concatenates rendered layers in order (Hook → Showcase → B-roll → CTA) into single 15–30s 9:16 1080p MP4.
- **F-AS-2:** Burn-in captions (Whisper-generated or HeyGen-provided), Saltwater brand font, white-on-black-strip lower-third style.
- **F-AS-3:** Brand overlay: Saltwater logo in corner, optional CTA card last frame ("Coastal Comfort™ · Shop Now" + CTA button graphic).
- **F-AS-4:** Output in 9:16 1080p MP4 (Meta/IG primary), with optional 1:1 1080×1080 and 16:9 1920×1080 secondaries.
- **F-AS-5:** Embedded metadata: ad_id, hooks used, layers used, AI-disclosure flag.
- **F-AS-6:** Output saved to `context-buckets/saltwater-cache/renders/YYYY-MM-DD/<ad_id>/`.

#### 6.1.6 Meta Pusher (Sprint 2)
- **F-MP-1:** Push approved ad to Saltwater's Meta Ads Manager as a draft ad in a pre-configured campaign/ad-set hierarchy.
- **F-MP-2:** Set ad creative fields: video file, primary text (from Hook Generator), CTA button, destination URL.
- **F-MP-3:** Set AI-generated content flag where any AI layer was used.
- **F-MP-4:** Return Meta ad ID to system; log into ad-history bucket.
- **F-MP-5:** Never auto-publish without explicit operator approval click.

### 6.2 By web-app screen (Sprint 1, REVISED 2026-04-30)

**Brutal narrowing applied** — original v0.1 had 6 screens. v1 ships only 3.

**Design language (LOCKED 2026-04-30 via /plan-design-review):** "A + C-strip" — minimal Linear/Notion-inspired base layer with a status-pill queue strip at the bottom. Reference mockup: `~/.gstack/projects/nickdnj-AgentArchitect/designs/saltwater-ads-generate-screen-20260430/variant-A-minimal.png` plus the bottom-strip pattern from `variant-C-command-center.png`. See `approved.json` in same directory for full rationale. White background, deep navy primary (#1a3a5c), USA red accent (#c8102e), warm sand neutrals. Clean sans-serif headlines (Inter/Söhne family), JetBrains Mono for the brief input. Generous whitespace. NO purple gradients, NO 3-column card grids, NO decorative blobs.

- **S-1: Generate** — brief textarea ("What ad do you want to make?"), SKU picker, pattern chips (Founder Story / Problem-Solution / Limited Drop), audience tag input, big primary "Generate 3 Variants →" button. Right sidebar: "Top hooks this week" with 3 entries from TW (informational, not interactive). Bottom strip: recent variants thumbnail row with status pills (READY FOR REVIEW / RENDERING / APPROVED / FAILED). The primary screen Joe lives in.
- **S-2: Review Queue** — **Master-detail inbox pattern (LOCKED 2026-04-30 via /plan-design-review).** Reference mockup: `~/.gstack/projects/nickdnj-AgentArchitect/designs/saltwater-ads-review-screen-20260430/variant-C-master-detail.png`. Layout: left list of pending variants (Gmail/Linear-style — small thumbnail, hook text first ~40 chars in JetBrains Mono, brief context, age, status pill READY/RENDERING/APPROVED). Right detail pane: selected variant's 9:16 video preview (~360px tall), full hook text, inline-editable caption, pattern + SKU labels. Below: AI-disclosure checkbox ("I will set the AI-generated content flag in Meta") gates the primary CTA "Approve → Download for Meta" (navy filled). Secondary actions: "Regen with feedback" (outline), "Reject" (subtle). **Compare mode (borrowed from variant A):** toggle in detail pane swaps the single-variant view for a side-by-side trio of all 3 variants of the selected brief. Sidebar nav badge shows count of pending variants ("3 pending"). See `approved.json` in same directory for full rationale.
- **S-3: Settings** — API keys (TW, HeyGen, Fashn — server-side only, see §7.7), brand bucket file uploads, default config.

**DEFERRED — add back only if Joe asks:**
- Dashboard with hit-rate trend (S-1 in v0.1) → Joe gets hit-rate from TW directly until system has earned an in-app version
- Buddy preview-link sharing (was in S-3) → Joe forwards approved MP4 to Buddy via text/email until preview-link flow proves needed
- Brand Bucket UI editor (S-4) → edit files directly in repo or via web-app file uploader in S-3 until UI is justified
- Performance Digest (S-5) → use Triple Whale's existing dashboards
- Higgsfield API key (was in S-6) → Higgsfield deferred to Sprint 2+, no settings entry needed in v1

**Why this matters:** every screen is maintenance burden Nick or Joe owns. Default to less. Add only when there's a real user request, not because the original PRD listed it.

### 6.3 Sprint 1 runtime — web app from day 1 (REVISED 2026-04-30)

Path B is locked. Sprint 1 ships a hosted web app. Nick may also expose a `/saltwater-ads` Claude Code skill internally as a developer convenience, but Joe never uses CLI. There is no "CLI mode" delivery target — the original v0.1 §6.3 framing of "Claude Code / CLI mode, before web app" was internally inconsistent with §9 (web app from day 1) and is replaced by this section.

- **Joe's only interface:** the web app (Generate / Review / Settings).
- **Nick's developer surface:** Claude Code skill that calls the same backend services. Nice to have, not required for Sprint 1.
- **Meta upload:** Joe downloads the approved MP4 + caption text from the web app and uploads to Meta Ads Manager manually in v1. Sprint 2 adds the Meta Pusher service for auto-draft.

### 6.4 Backend storage (NEW 2026-04-30, from eng review)

Single-tenant single-file SQLite database is the runtime data store. Brand bucket files stay on filesystem but are **versioned and read-only per run**.

**Database location:** `data/saltwater.db` (web app server filesystem; ignored by git; backed up nightly).

**Tables:** `brief`, `hook_set`, `variant`, `render_attempt`, `asset`, `approval`, `publish_event`, `performance_snapshot`, `brand_bucket_version`. See §6.6 for schemas.

**Brand bucket versioning:**
- Each generation captures the current `voice.md`, `customer.md`, `products.json`, `hooks-winners.jsonl`, `hooks-losers.jsonl` SHA-256 hashes into the `brand_bucket_version` table.
- Hook generation prompt cache key includes the bucket version hash → identical bucket + identical brief → cache hit.
- A bucket edit during a running generation does NOT affect that generation (snapshot semantics).

**Why SQLite, not Postgres:** single tenant, single operator, single hosted process. SQLite handles concurrent reads + serialized writes natively. If the system ever scales to multi-tenant or high concurrency, migrate to Postgres — but YAGNI in v1.

**Concurrent write safety:** Web app uses SQLite WAL mode + a single writer connection (or BEGIN IMMEDIATE for short transactions). No more append races on JSONL files for ad-history data. The brand-bucket JSONLs are the only filesystem append targets remaining; gated behind the Brand Bucket Manager service which serializes writes.

### 6.5 Job state machine (NEW 2026-04-30, from eng review)

Every generation is a `job` row in the database. Jobs follow this state machine:

```
                 ┌──────────┐
                 │  queued  │
                 └────┬─────┘
                      ▼
              ┌──────────────────┐
              │ hooks_generating │  ─── error ──> failed_recoverable
              └────────┬─────────┘                       │
                       ▼                                 ▼
              ┌──────────────────┐                ┌─────────────────┐
              │   hooks_ready    │                │ failed_terminal │
              └────────┬─────────┘                └─────────────────┘
                       ▼
              ┌──────────────────┐
              │  vendor_pending  │  ─── all-fail ──> failed_recoverable
              └────────┬─────────┘
                       ▼
                ┌─────────────┐
                │   partial   │  ─── deadline ──> assemble_with_skips
                └─────┬───────┘
                      ▼
              ┌──────────────────┐
              │    assembling    │  ─── error ──> failed_recoverable
              └────────┬─────────┘
                       ▼
              ┌─────────────────────┐
              │  ready_for_review   │ ── operator approves ──> approved
              └─────────────────────┘ ── operator rejects ──> rejected
                                      ── operator regen ──> queued (new job, links back)
                                      ── operator cancels ──> cancelled
```

**Per-vendor timeout budgets:**
- HeyGen: 5 min
- Fashn: 8 min
- Higgsfield (Sprint 2+): 10 min
- FFmpeg assembly: 2 min
- **Total job deadline:** 15 min hard ceiling (matches §7.2 SLA target with headroom)

**Retry budget:** 2 retries per vendor with exponential backoff (10s, 30s). Then job either degrades (skip optional layer like Higgsfield) or transitions `failed_recoverable`. Operator can manually retry from `failed_recoverable`; auto-transitions to `failed_terminal` after 24 hours.

**Idempotency:** Render Orchestrator caches identical (hook_text + avatar_id) pairs in `render_attempt` table — same hook + same Joe avatar = no double-billing on HeyGen.

### 6.6 Data schemas (NEW 2026-04-30, from eng review)

```sql
CREATE TABLE brand_bucket_version (
  id INTEGER PRIMARY KEY,
  captured_at TIMESTAMP,
  voice_sha256 TEXT,
  customer_sha256 TEXT,
  products_sha256 TEXT,
  hooks_winners_sha256 TEXT,
  hooks_losers_sha256 TEXT
);

CREATE TABLE brief (
  id INTEGER PRIMARY KEY,
  created_at TIMESTAMP,
  operator TEXT,        -- 'joe' | 'nick'
  free_text TEXT,
  sku_id TEXT,          -- nullable
  pattern TEXT,         -- 'founder' | 'problem_solution' | 'limited_drop' | null
  audience_tag TEXT,    -- nullable
  season TEXT           -- nullable
);

CREATE TABLE hook_set (
  id INTEGER PRIMARY KEY,
  brief_id INTEGER REFERENCES brief(id),
  brand_bucket_version_id INTEGER REFERENCES brand_bucket_version(id),
  created_at TIMESTAMP,
  model TEXT,           -- 'claude-sonnet-4-6' etc
  prompt_hash TEXT,     -- sha256 of full prompt for caching
  status TEXT           -- 'generating' | 'ready' | 'failed'
);

CREATE TABLE variant (
  id INTEGER PRIMARY KEY,
  hook_set_id INTEGER REFERENCES hook_set(id),
  hook_text TEXT,       -- ≤140 chars
  sub_variant_label TEXT, -- 'V1' | 'V2' | 'V3'
  sku_id TEXT,
  pattern TEXT,
  status TEXT           -- 'queued' | 'rendering' | 'ready_for_review' | 'approved' | 'rejected' | 'failed'
);

CREATE TABLE render_attempt (
  id INTEGER PRIMARY KEY,
  variant_id INTEGER REFERENCES variant(id),
  attempt_number INTEGER,
  state TEXT,           -- job state machine state
  started_at TIMESTAMP,
  finished_at TIMESTAMP,
  heygen_clip_id TEXT,
  fashn_clip_id TEXT,
  broll_id TEXT,
  higgsfield_clip_id TEXT,
  cost_credits_total REAL,
  error_message TEXT
);

CREATE TABLE asset (
  id INTEGER PRIMARY KEY,
  render_attempt_id INTEGER REFERENCES render_attempt(id),
  type TEXT,            -- 'mp4' | 'jpg' | 'srt'
  path TEXT,            -- relative to media root
  size_bytes INTEGER,
  ai_disclosure_layers TEXT  -- JSON array: ['heygen', 'fashn', 'higgsfield']
);

CREATE TABLE approval (
  id INTEGER PRIMARY KEY,
  variant_id INTEGER REFERENCES variant(id),
  approved_by TEXT,
  approved_at TIMESTAMP,
  decision TEXT,        -- 'approve' | 'regen' | 'reject'
  notes TEXT
);

CREATE TABLE publish_event (
  id INTEGER PRIMARY KEY,
  variant_id INTEGER REFERENCES variant(id),
  published_at TIMESTAMP,
  meta_ad_id TEXT,
  campaign_id TEXT,
  ad_set_id TEXT
);

CREATE TABLE performance_snapshot (
  id INTEGER PRIMARY KEY,
  meta_ad_id TEXT,
  snapshot_date DATE,
  spend REAL,
  impressions INTEGER,
  clicks INTEGER,
  ctr REAL,
  hook_rate REAL,
  roas REAL,
  mer REAL
);
```

Schema migrations: simple numbered `.sql` files in `db/migrations/`. SQLite has no schema-version primitives, so a `schema_version` table tracks applied migrations.

---

## 7. Non-Functional Requirements

### 7.1 Cost
- **Floor:** $203/mo (HeyGen Team $89 + Fashn Pro $99 + Higgsfield Creator $15) plus ~$10/mo Claude tokens = **~$213/mo**.
- **Stretch ceiling:** $300/mo all-in including occasional Higgsfield credit overages, Fashn volume burst, Claude long-context calls.
- **Per-ad compute target:** ≤ $10 (HeyGen credits + Fashn credits + Higgsfield credits + Claude tokens + assembly compute amortized).

### 7.2 Latency (REVISED 2026-04-30 — honest SLA per eng review)

**Hook generation:** ≤ 15 seconds (Claude Sonnet 4.6 with cache hit on brand bucket).

**Per-variant render latency (HeyGen + Fashn parallel):**
- HeyGen founder hook clip: 1–3 min (90s p50, 3 min p95)
- Fashn customer showcase clip: 1–2 min (parallel with HeyGen)
- FFmpeg assembly: 30–60s (sequential after both vendor renders)
- **Per-variant total: 3–5 min** (parallel vendor calls + assembly)

**Multi-variant SLA (3 variants per brief, default):**
- 3 vendor calls × 2 vendors per variant = 6 parallel API calls. HeyGen + Fashn rate limits assumed: 3-5 concurrent calls each (verify in Sprint 1).
- Realistic: **3 variants ready in 8–12 minutes** (one parallel batch + assembly).
- Stretch: **3 variants in 5–7 minutes** if both vendors return at p50 and rate limits don't throttle.
- Hard ceiling: **15 minutes per job** (state machine deadline, see §6.5).

**Operator active time per ad:** ≤ 5 minutes (brief input → review → approve → download). Render time is async — Joe submits the brief, comes back when notified.

**The original PRD claim of "3 variants in 5 min, 9 in 30 min" was unsupported by the pipeline architecture. Revised numbers above assume parallel vendor calls per variant + sequential job execution.** Multi-variant parallelism (multiple jobs concurrently) is Sprint 2 territory.

### 7.3 Brand compliance
- **Trademark verbatim enforcement:** Coastal Comfort™ never paraphrased. Hard validation gate; copy fails generation if violated.
- **Vocabulary IN / OUT enforced** at hook-generation validation step (see F-HG-6).
- **Anti-pattern blocklist:** Generic DTC phrases ("elevate your wardrobe," "discover the difference," "crafted for the modern man") blocked.
- **Founder-voice gate:** Founder Story pattern requires Buddy review (US-7) before push to Meta.
- **Veronica reference rule:** Copy may not refer to Veronica as Joe's wife until after wedding (Nov 2026). System holds a date-gated rule.

### 7.4 Output formats + Media Spec (REVISED 2026-04-30 per eng review)

**Primary output:** 9:16 1080×1920 MP4, H.264 baseline profile (Meta-compatible), ≤ 30s duration, < 100 MB.

**Media normalization contract (NEW — eng review):**
- **Frame rate:** All vendor outputs normalized to **30 fps** during assembly. HeyGen exports 30fps native, Fashn outputs vary (re-encode if not 30fps), real footage interpolated/decimated as needed.
- **Audio:** Stereo AAC, 48 kHz, **loudness target -16 LUFS** (Meta/IG spec), peak ≤ -1 dBTP. Loudnorm filter applied during FFmpeg assembly.
- **Color space:** sRGB / Rec.709, 8-bit. No HDR.
- **Padding/cropping:** All vendor outputs centered to 1080×1920 with smart crop (no letterbox bars); pad with blurred-extension fill if vendor output is < 9:16.
- **Bitrate:** Target 6-8 Mbps for video, 192 kbps for audio.

**Captions:**
- Source: HeyGen API provides word-timed transcript for the founder hook layer; Fashn output has no audio (silent), no captions needed; CTA card uses static overlay.
- Burned-in captions: Saltwater brand sans-serif font (bundled in repo at `assets/fonts/`), white text + black drop shadow, lower-third positioning.
- Separate `.srt` sidecar generated alongside MP4 for accessibility.

**Fonts:**
- Bundled in repo at `assets/fonts/saltwater-display.ttf` (whatever font Saltwater's brand uses — TBD with Joe). NOT system fonts (rendering inconsistency).
- Fonts loaded via FFmpeg `drawtext` filter or pre-rasterized PNG overlay (TBD by Sprint 1 implementation).

**Golden-media test fixtures:**
- Sprint 1 deliverable: a `test/fixtures/` directory with reference inputs (HeyGen-style talking-head, Fashn-style product showcase, b-roll, CTA card) and the expected stitched output.
- Assembly tests compare new outputs to fixture outputs frame-by-frame (or perceptual-hash-based for tolerance) to catch regressions.

**Secondary outputs (Sprint 2+):** 1:1 1080×1080 (Meta feed), 16:9 1920×1080 (YouTube PMAX). Generated from primary 9:16 master via re-crop pipeline.

### 7.5 Meta-policy compliance
- All ads using Fashn.ai or Higgsfield AI talent ship with the AI-generated content flag set when pushed via Meta API (F-MP-3).
- Optional subtle on-creative AI disclosure overlay (toggleable).
- Generated copy avoids Meta's known restricted categories (health claims, prohibited financial language, etc.).

### 7.6 Reliability
- **Render success rate:** ≥ 80% first-pass success across HeyGen + Fashn pipeline. Off-likeness Fashn outputs (~15–20% baseline rate) trigger automatic regen up to 3 attempts.
- **TW API resilience:** System works offline of TW (graceful degradation; F-TW-6).
- **Idempotency:** Re-running a generation with the same brief + same brand-bucket version produces stable (cached) hooks; renders may differ due to upstream randomness but cost is not duplicated for identical hook+avatar pairs (F-RO-2).

### 7.7 Security (REVISED 2026-04-30 per eng review)

**Auth:**
- **Operator auth:** magic-link email auth (Joe + Nick whitelisted). No password storage. Sessions: 7-day rolling refresh.
- **No public access.** All routes require valid session.
- **Buddy review (when added in Sprint 2+):** signed expiring URLs (24-hour TTL), no account needed.

**Secrets:**
- All vendor API keys (TW, HeyGen, Fashn, Higgsfield, Meta) stored **server-side only** in hosted secret manager (Cloud Run Secret Manager / Fly.io secrets / equivalent). **Never** in client bundle, never in localStorage, never in browser.
- Settings screen reads secret existence (boolean: "TW key configured? yes/no") but never returns secret values to the browser.
- Operator updates secrets via dedicated upload endpoint — POST-only, encrypted at rest, rotated annually.

**Access control:**
- Brand bucket and render assets: server-side filesystem, accessed only via authenticated API endpoints. No direct file URLs.
- Variant preview (rendered MP4): served via signed URL with 1-hour TTL, generated per-request.
- Download for Meta upload: signed URL with 24-hour TTL, generated on operator approval click.

**Single-tenancy:**
- Saltwater brand bucket and renders never shared across customers.
- No customer PII processed (Saltwater has no first-party customer data flowing through the system; Triple Whale aggregates anonymously).

**Audit logging:**
- All operator actions (login, generate, approve, reject, secret update) logged to `audit_log` table with timestamp + operator + action + target_id.

### 7.5 Meta-policy compliance (REVISED 2026-04-30 — AI disclosure enforceable)

**AI disclosure is now a hard gate, not a guideline:**

- Every variant in `asset` table tracks `ai_disclosure_layers` (JSON array of which layers were AI-generated, see §6.6).
- **Web app gate:** the "Download for Meta upload" button is **disabled** until operator clicks an "I will set Meta's AI-generated content flag during upload" acknowledgment checkbox.
- Acknowledgment is logged to `audit_log` with timestamp + variant_id + operator.
- **Sprint 2 (Meta Pusher):** auto-sets the Meta AI-generated content flag during draft creation; the manual gate becomes auto-enforced.
- Optional subtle on-creative AI disclosure overlay (toggleable per ad).
- Generated copy avoids Meta's known restricted categories (health claims, prohibited financial language, etc.).

### 7.8 Observability
- Per-ad cost ledger (F-RO-6).
- Generation log: brief → hooks → renders → assembly → push, with timestamps and tool versions.
- Error log surfaces in web-app dashboard (Sprint 1.5).

---

## 8. Architecture Reference

### 8.1 High-level diagram (text)

```
                 ┌──────────────────────────────┐
                 │  Joe (operator)              │
                 │  Buddy (reviewer)            │
                 └──────────────┬───────────────┘
                                │ brief / approve
                ┌───────────────┴───────────────┐
                │                               │
       ┌────────▼─────────┐         ┌──────────▼──────────┐
       │  Web App (1.5+)  │         │  Claude Code (1.0)  │
       │  React/Next.js   │         │  /saltwater-ads     │
       └────────┬─────────┘         └──────────┬──────────┘
                │                              │
                └───────────────┬──────────────┘
                                │
              ┌─────────────────▼─────────────────┐
              │   AgentArchitect Team:            │
              │   teams/saltwater-ads/team.json   │
              └─────────────────┬─────────────────┘
                                │
   ┌───────────┬────────────────┼────────────────┬──────────────┐
   │           │                │                │              │
┌──▼───┐  ┌────▼────┐  ┌────────▼─────┐  ┌──────▼─────┐  ┌─────▼──────┐
│Brand │  │Hook     │  │TW Connector  │  │Render      │  │Assembly    │
│Bucket│  │Generator│  │              │  │Orchestrator│  │(FFmpeg)    │
│Mgr   │  │(Claude) │  │(TW API)      │  │            │  │            │
└──┬───┘  └────┬────┘  └────────┬─────┘  └──────┬─────┘  └─────┬──────┘
   │           │                │                │              │
   ▼           │                ▼                ▼              ▼
┌────────────────────────────────────────────────────────────────────┐
│ Context Buckets (shared state)                                     │
│  saltwater-brand/  voice.md, customer.md, products.json,           │
│                    hooks-winners.jsonl, hooks-losers.jsonl         │
│  saltwater-cache/  tw-YYYY-MM-DD.jsonl, renders/, b-roll-index     │
└────────────────────────────────────────────────────────────────────┘
                                │
   ┌────────────────────────────┼────────────────────────────┐
   │                            │                            │
┌──▼──────┐  ┌──────────┐  ┌────▼─────┐  ┌────────┐  ┌──────▼──────┐
│HeyGen   │  │Fashn.ai  │  │Higgsfield│  │Real    │  │Meta Pusher  │
│Team API │  │Pro API   │  │Creator   │  │B-roll  │  │(Sprint 2)   │
│($89/mo) │  │($99-149) │  │($15/mo)  │  │(Drive) │  │             │
└─────────┘  └──────────┘  └──────────┘  └────────┘  └─────────────┘
```

### 8.2 Brief description

The agent team is the durable logic. Two clients drive it: Claude Code (Sprint 1, Nick's machine) and the web app (Sprint 1.5+, Joe's surface). Specialists communicate via shared context buckets (`saltwater-brand/` for brand state, `saltwater-cache/` for ephemeral data). External tools sit at the edges: HeyGen for founder, Fashn for customer, Higgsfield for occasional virtual hero, Triple Whale for performance data, Meta Ads Manager for distribution.

A separate Software Architecture Document (SAD) will detail data schemas, API contracts, deployment topology (Path A: AA bundle on Joe's laptop vs. Path B: hosted web app at saltwater-ads.[domain]), CI/CD, and rollback plan. The SAD is the next document in this series.

---

## 9. Sprint Plan & Milestones

| Sprint | Window | Deliverable | Success criterion |
|---|---|---|---|
| **POC** | Week 1 (this week) | Brand bucket draft promoted from `teams/personal-assistant/workspace/saltwater-ads-poc/brand-draft/` to `context-buckets/saltwater-brand/files/`. 5–10 sample hooks generated by hand-running the Hook Generator prompt against the bucket. Sent to Joe via email. | Joe's gut: "feels like Saltwater." Yes → continue. No → adjust or kill. |
| **Sprint 1** | Week 2–4 (extended from 2-3 per eng review feasibility) | **Vertical-slice MVP with multi-variant parallelism (REVISED 2026-04-30).** Web app from day 1 (Path B locked). Backend: SQLite + job state machine (§6.4–6.6). Specialists: Hook Generator (Claude Sonnet 4.6 + prompt cache), Brand Bucket Manager (versioned reads), TW Connector (read-only API), Render Orchestrator (HeyGen + Fashn parallel — Higgsfield, Meta Pusher, decay detector ALL deferred to Sprint 2+). Assembly via FFmpeg with media spec (§7.4). Manual Meta upload by Joe. **First 5 production ads ship to Meta.** | First 5 ads live in Saltwater's Meta Ads Manager. Joe approves quality. Joe runs web app end-to-end alone, including a synthetic vendor failure recovery via runbook. |
| **Sprint 1.5** | Week 4 | Polish + runbook. Vendor-failure runbook for Joe (what to do if HeyGen/Fashn API errors occur — auto-retry with exponential backoff, escalate to Nick if 3 retries fail). On-call rotation: Nick is on-call for the first 6 months at 5-10 hr/month. | Joe operates the system alone for one full week. Vendor failure runbook tested with at least one synthetic failure. |
| **Sprint 2** | Month 2 | Higgsfield (occasional virtual hero shot) added if month-1 results justify it. Meta Pusher (auto-publish drafts). Daily TW pull. Decay detector (US-4). | Zero-click ads from brief to Meta draft. Higgsfield only if there's a real use case the team is asking for. |
| **Sprint 3** | Month 3+ | TW feedback loop: nightly job classifies last week's ads, appends to `hooks-winners.jsonl` / `hooks-losers.jsonl`. Hit-rate dashboard. Automated similarity check on Fashn off-likeness. TikTok format support if Saltwater has launched on TikTok by then. | Hit rate measurably improving (real measurement window now). Brand bucket has 30+ winners, 10+ losers logged. |

### 9.1 Decision gates

- **End of POC (week 1):** Go/no-go on Sprint 1. Killed if hooks feel generic to Joe.
- **End of Sprint 1 (week 3):** Go/no-go on web app build. Killed if first 5 ads don't perform plausibly.
- **End of Sprint 1.5 (week 4):** Nick exits regardless. If system isn't operator-ready, Joe and Nick decide whether to scope a small extension or shut it down.
- **End of month 1 (after first 4 weeks of ads):** **Hard kill criterion (REVISED 2026-04-30).** Three signals; any one of them flags concerns, two flag kill:
  1. **Qualitative gate:** <70% of ads pass Joe's "yeah that sounds like Saltwater" gut test.
  2. **Spend efficiency:** 4-week trailing CPA significantly worse than baseline (>20%).
  3. **Operator load:** Joe spending >30 min/week on system ops.

  Hit-rate is **NOT** the month-1 gate (sample too small to be statistically meaningful at $3K/mo spend). Track it for context; judge it at month 3 when sample size is real.

---

## 10. Success Metrics

### 10.1 Primary gate: Qualitative + spend efficiency (REVISED 2026-04-30)

**Honesty about statistics first:** at $3K/mo Meta spend, 4 weeks produces ~10-20 ad variants live. Detecting a 7%→10.5% hit-rate lift at that volume is below the statistical-significance floor. The original PRD treated hit-rate as a hard pass/fail gate; that was numerology. Revised below.

**Hard gate (end of month 1):**
- **Qualitative — Joe's gut:** Does Joe say "yeah, that sounds like Saltwater" on every ad shipped? If <70% pass that test, kill.
- **Spend efficiency trend:** Has the 4-week trailing CPA stayed within ±20% of baseline (i.e., the system is at minimum NOT making ad performance worse)? If significantly worse, kill.
- **Operator-load reality:** Is Joe's actual time-per-ad ≤ 5 min? If he's spending >30 min/week on ops, system is broken regardless of output quality.

**Directional metric (tracked but NOT pass/fail at month 1):**
- **Hit rate** = % of ads scaling to >2× ROAS in their test budget.
- **Baseline:** confirmed from 2025 TW data (estimated ~7% from Joe's "5-10%" verbal).
- **Track for month-3 retrospective**, when sample size is meaningful (~80-100 variants run).

**Month-3 hit-rate target (real measurement window):**
- **Stretch:** 2× baseline (7%→14%).
- **Floor:** measurably above baseline (not statistical floor at 4 weeks).

**Why this matters:** 4-week hit-rate gates produce false confidence either way — either we kill a working system because 4 weeks of noise looked bad, or we greenlight a broken one because 4 weeks of noise looked good. The qualitative + spend-efficiency gate at month 1 is harder to fool. The hit-rate metric earns trust at month 3 with real volume.

### 10.2 Secondary metrics

- **Joe's time-per-ad:** target ≤ 5 min vs. ~2–3 hr baseline.
- **Variant volume:** target 40–60/month vs. ~6–12/month baseline.
- **Per-ad compute cost:** target ≤ $10/ad.
- **Render success rate:** target ≥ 80% first-pass, ≥ 95% within 3 regen attempts.
- **Operator NPS-equivalent (qualitative):** Joe answers "would you pay for this if Nick disappeared?" Yes = system has value. No = re-evaluate.

### 10.4 Brand bucket — "earn-it" gate (REVISED 2026-04-30)

The original PRD claimed the brand bucket was a compounding moat from day 1. Both CEO-review voices flagged this as overstated. Honest version:

- **Day 1 → month 3:** The bucket is a **prompt context library** for Hook Generator. Useful, but not a moat. ~10-30 entries.
- **Month 6 earn-it gate:** If `hooks-winners.jsonl` has **≥30 winners with measurable TW performance attribution** AND `hooks-losers.jsonl` has **≥10 losers** with reasons, AND the Hook Generator demonstrably produces better output when primed with bucket data than without, **then** the compounding-moat claim is earned. Until then, drop the framing.
- **Month 12 review:** If the moat is real, brand bucket becomes a documented IP asset of Saltwater. If not, accept the bucket as a useful prompt library and stop the moat narrative.

This avoids dressing up small data as proprietary intelligence on day 1 while leaving room for the bucket to earn the title with real evidence later.

### 10.3 What "win" looks like

- **End of week 4:** Joe is running the system alone. Hit rate has not regressed. Joe is shipping at least 10 variants/week and feels they sound like Saltwater. Nick has stepped out cleanly.
- **End of month 3:** Hit rate is measurably improved over baseline. Brand bucket has compounded with at least 30 logged winners and 10 logged losers. Joe is running the system without thinking about Nick. Buddy has approved at least one founder-voice ad through the preview-link flow.

---

## 11. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Likeness drift** — Fashn customer archetype renders inconsistently across SKUs | High | Medium | Maintain a tight reference photo set for the archetype. Operator flag + auto-regen up to 3×. Plan for ~15–20% off-likeness baseline; budget includes regen credit headroom. |
| **Meta AI detection** flags content, reduces reach or rejects ads | Medium | High | Build AI disclosure into ad creative from day one. Set Meta API AI-content flag (Sprint 2). Track per-ad rejection rate; if >10%, escalate to creative-format change. |
| **Triple Whale API changes** break TW Connector | Low | Medium | Wrap TW API calls in adapter layer. System functions without TW (graceful degradation, F-TW-6). Subscribe to TW changelog. |
| **Joe operator-load drift** — system needs more attention than promised, Joe drops it | Medium | Critical | 5-min/ad ceiling is a hard requirement. Sprint 1.5 web app prioritizes Joe's workflow over engineering completeness. Weekly check-in cadence in month 1; if Joe is spending >30 min/week on ops, system is broken regardless of output quality. |
| **Zombie outcome — subscriptions running, system unused (REVISED 2026-04-30)** | Medium-High | High | The Claude CEO review flagged this: most likely 6-month outcome isn't a clean kill, it's a zombie — Saltwater silently paying $200+/mo for HeyGen + Fashn while Joe's gone back to his old workflow, nobody comfortable with the relationship cost of officially killing it. **Mitigation: explicit zombie kill-switch.** End of month 2: if Joe shipped <10 ads via the system in the prior 4 weeks, Nick proactively pauses the subscriptions and emails Buddy + Joe: "system is parked; resume when ready or shut down formally." No silent burn. |
| **Vendor convergence — Arcads/HeyGen/Creatify or new entrant closes the brand-kit + performance-feedback gap (REVISED 2026-04-30)** | Medium-High | High | The real risk is not vendor shutdown — it's vendor convergence making the custom build redundant. **Quarterly kill-switch checkpoint:** end of each quarter, evaluate "does Arcads/HeyGen/equivalent now offer brand-bucket-style context priming + performance feedback loop at parity with our custom stack?" If yes, sunset custom stack and migrate to the vendor. The 1% equity + family commitment doesn't justify burning Nick's time on a redundant system. |
| **AI tool shutdown / pricing change** — individual vendor death | Medium | Medium | Render Orchestrator is the abstraction boundary. If Fashn dies, swap to VModel.ai or EzUGC. If HeyGen pricing 5×, fall back to real Joe footage. Each layer is replaceable. |
| **Brand bucket drift** — voice.md and customer.md decay over months without curation | Medium | Medium | Brand-bucket health-check screen (S-4, US-5) surfaces stale entries. Quarterly review reminder built into the weekly digest. |
| **Cross-tool likeness expectations** — Joe expects HeyGen Joe and Fashn customer to look like the same person and is disappointed | Medium | Medium | Already addressed in design: "Older Joe DeMarco" customer is a distinct archetype, not Joe. Communicate clearly in PRD review and again at handoff. JD005 already established non-founder talent. |
| **POC "feels generic" signal** — Joe reads sample hooks and isn't moved | Medium | Critical | This is the kill gate. If POC fails, abandon cleanly. No money spent beyond Nick's evening. Brand bucket draft remains as a useful artifact regardless. |
| **Cost overrun** — actual all-in cost exceeds $300/mo stretch ceiling | Low | Medium | Per-ad cost ledger (F-RO-6) and weekly cost report. Higgsfield is the variable layer; clamp at 4 calls/month default. |
| **Buddy veto on founder-voice ads** slows iteration | Low | Low | Buddy review applies to founder-voice ads only. Non-founder ads auto-approve. Preview-link flow (US-7) makes review fast. |
| **TW Enterprise auto-renewal cost shock** | Low | Low (separate budget) | Joe was advised to switch to annual billing pre-renewal. Out of scope for this project budget; this is Saltwater's existing TW spend. |

---

## 12. Open Questions

1. **TW Enterprise API key delivery** — still pending from Joe as of Apr 28. Without it, Sprint 1 runs without performance priming (degraded mode).
2. **Joe's gut-call top 5 winners** from JD001–JD021 — pending. Will inform `hooks-winners.jsonl` seed entries. Optional but high value.
3. **Optional flop nomination** from Joe (negative training signal for `hooks-losers.jsonl`).
4. **Saltwater baseline hit rate** — actual number from 2025 TW data. Currently estimated at ~7% based on Joe's verbal "5–10% of ads scale" comment. Confirm in Sprint 1 with TW data.
5. ~~Path A vs. Path B for handoff~~ — **RESOLVED 2026-04-30 (eng review):** Path B locked. Web app from day 1, no CLI handoff path. See §6.3.
6. **Hosting domain for web app (Path B)** — `saltwater-ads.<domain>` — which domain? Saltwaterclothingco.com subdomain? A new Vistter-controlled domain? Joe to decide before Sprint 1.5.
7. **Meta Ads Manager API access** — Sprint 2. Joe's Meta Business Manager permissions need to grant access to Saltwater AI Ads as a "system user." Not blocking Sprint 1.
8. **Buddy approval workflow detail** — does Buddy want email previews, SMS links, web app account, or Slack? Default assumption: shareable web link via SMS or email, no account required.
9. **B-roll metadata curation** — who tags Saltwater's existing real footage by season/SKU/scene type for Render Orchestrator's B-roll selector (F-RO-4)? Likely a one-time tagging job in Sprint 1, then ongoing as new footage is shot.
10. **Custom avatar decision** — train HeyGen Photo Avatar from Joe's existing footage, or schedule a 5-minute fresh shoot? 2026 Avatar V works from photos; existing footage likely sufficient.
11. **Founder-couple format (Joe + Veronica)** — handled by HeyGen with two avatars, or treated as a real-shoot-only category? Recommendation: real-shoot only for couple format (founder-couple authenticity is a brand anchor).
12. **TikTok timing** — Sprint 2 deliverable, but Joe hasn't started TikTok yet. Confirm in month 2 whether to actually build TikTok format support or defer.
13. **Veronica wedding date** — November 2026, exact date TBD. Affects the date-gated "wife" copy rule (§7.3).
14. **Catalog ingest from Shopify** — `products.json` currently manual. Sprint 3 candidate: pull SKU catalog from Shopify Admin API automatically.
15. **2nd customer / starter-kit fork** — out of scope for v1. If a 2nd Saltwater-equivalent customer materializes, fork via existing `scripts/build-starter.js`. Not a v1 requirement.

---

## 13. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-04-28 | Nick DeMarco (with AI assistance) | Initial draft. |
| 0.2 | 2026-04-30 | Nick DeMarco (with autoplan CEO review — Codex + Claude subagent) | Major revision after CEO-phase dual-voice review surfaced 7 critical/high/medium concerns. Changes: (1) hit-rate moved from hard pass/fail gate to directional metric with month-3 measurement; month-1 gate is qualitative + spend efficiency. (2) Build-vs-buy reframed honestly — priced Nick's time at opportunity cost, acknowledged $500/mo freelance alternative was viable, justified build by family + framework + 1% equity offer (Buddy's offer disclosed). (3) "Exit clean week 4" replaced with "5-10 hr/month maintenance retainer through month 6"; web app from day 1 (no CLI handoff path). (4) Brand bucket "compounding moat" claim dropped on day 1; replaced with month-6 earn-it gate. (5) "Older Joe DeMarco customer archetype" reframed as "AI catalog model" (Glam/VModel-style fashion photography role); positioned transparently — not a synthetic founder proxy. (6) Higgsfield deferred to Sprint 2 conditional. (7) Scope brutally narrowed for v1: Meta video only (Google Search + PMAX deferred); 3 web-app screens (Generate / Review / Settings) instead of 6; deferred Buddy preview-link, manual override, performance digest, brand-bucket UI editor. (8) Risk section: vendor convergence added as primary competitive risk with quarterly kill-switch checkpoint. (9) Risk section: zombie-outcome added (silent subscription burn) with month-2 kill-switch. |
| 0.3 | 2026-04-30 | Nick DeMarco (with plan-eng-review — Codex eng challenge) | Engineering-phase revision after Codex eng review surfaced 12 findings (4 critical, 5 high, 3 medium). Changes: (1) §6.3 cleaned up — runtime contradiction resolved, Path B locked, no CLI handoff path. (2) §6.4 NEW — backend storage spec: SQLite at `data/saltwater.db`, brand bucket versioned + read-only per run, WAL concurrency. (3) §6.5 NEW — explicit job state machine with states (queued → hooks_generating → hooks_ready → vendor_pending → partial → assembling → ready_for_review), per-vendor timeout budgets, retry budget, idempotency. (4) §6.6 NEW — full SQL data schemas for brief/hook_set/variant/render_attempt/asset/approval/publish_event/performance_snapshot/brand_bucket_version. (5) §7.2 latency rewritten with honest SLA: 3 variants in 8-12 min realistic, 15 min hard ceiling. (6) §7.7 security spec'd: magic-link auth, server-side-only secrets, signed URL access, audit log table. (7) §7.5 AI disclosure made enforceable — "Download for Meta" button gated behind acknowledgment checkbox, Sprint 2 auto-enforces via Meta API. (8) §6.1 reframed — 1 LLM agent (Hook Generator) + 5 deterministic services (NOT 6 agents); v0.1 over-modeled deterministic CRUD as agents. (9) §6.1.2 Hook Generator decoupled from `~/.claude/skills/claude-api/` → repo-owned `lib/llm/anthropic.ts` provider abstraction. (10) §6.1.3 TW Connector switched from daily JSONL dumps to incremental sync with watermark + materialized snapshots; eliminates N+1 risk. (11) §7.4 media spec added: 30fps frame rate, -16 LUFS audio, bundled fonts, golden-media test fixtures. (12) Sprint 1 timeline extended from week 2-3 to week 2-4 acknowledging realistic feasibility for solo dev. (13) §12 question 5 (Path A vs B) resolved. |

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/autoplan` (Codex + Claude subagent dual voices) | Scope & strategy | 1 | RESOLVED | 7 findings (3 critical, 3 high, 1 medium). All addressed in v0.2. |
| Codex Review | `/autoplan` Phase 1 | Independent strategic 2nd opinion | 1 | RESOLVED | Saved at `docs/saltwater-ads/reviews/ceo-codex.md` |
| Eng Review | `/plan-eng-review` (Codex eng challenge) | Architecture & tests (required) | 1 | RESOLVED | 12 findings (4 critical, 5 high, 3 medium). All addressed in v0.3. Saved at `docs/saltwater-ads/reviews/eng-codex.md`. |
| Design Review | `/plan-design-review` (gpt-image-1 mockup variants) | UI/UX direction locked | 1 | RESOLVED | Generate screen: A+C-strip locked. Review Queue: C+A-compare-mode locked. Settings: skip mockups (CRUD form). Mockups + approved.json saved in `~/.gstack/projects/nickdnj-AgentArchitect/designs/`. |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | SKIPPED | Single-tenant single-operator scope — DX review not applicable. |

**VERDICT:** CEO + ENG + DESIGN CLEARED — ready to scaffold. v0.3 PRD + locked design language across both web-app screens.

**Approved Mockups:**

| Screen | Mockup Path | Direction |
|---|---|---|
| Generate (S-1) | `~/.gstack/projects/nickdnj-AgentArchitect/designs/saltwater-ads-generate-screen-20260430/variant-A-minimal.png` | A (Minimal) base + queue-strip pattern from C |
| Review Queue (S-2) | `~/.gstack/projects/nickdnj-AgentArchitect/designs/saltwater-ads-review-screen-20260430/variant-C-master-detail.png` | C (Master-Detail Inbox) base + compare-mode toggle from A |
| Settings (S-3) | (no mockup — trivial CRUD form) | Standard settings layout, navy primary, server-side secret existence boolean |

**Total findings resolved: 19** (7 strategy + 12 engineering) plus 2 design directions locked.
