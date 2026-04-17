# Claude Opus 4.7 Tuning Plan for Agent Architect

**Date:** 2026-04-17
**Author:** Archie (Agent Architect)
**Status:** Draft — awaiting Nick's review

---

## What changed in 4.7 (that matters for our SKILLs)

### Behavior changes
1. **More literal instruction following** — 4.7 will not silently generalize instructions or infer requests you didn't make. Ambiguous SKILLs produce narrower results.
2. **Response length auto-calibrates** to task complexity — fixed verbosity mandates fight the model.
3. **Fewer tool calls by default, more reasoning** — tool-heavy scaffolding ("always search before answering") is now counter-productive.
4. **Fewer subagents spawned by default** — orchestrators need explicit delegation guidance.
5. **More direct, opinionated tone** — less validation-forward phrasing, fewer emoji. 4.7 has this natively.
6. **Regular progress updates by default** — we can drop "always narrate status" scaffolding.
7. **"Double-check before returning" scaffolding is now redundant** — Anthropic explicitly recommends removing it.

### New knobs
- **Adaptive thinking** (replaces extended thinking budgets). Off by default. Prompt with "think carefully step-by-step" to increase reasoning.
- **Effort levels** — `xhigh` recommended for coding/agentic; `high` for knowledge work.
- **Task budgets (beta)** — advisory token ceiling for agentic loops; useful for bounded jobs.
- **High-res vision** — 2576px / 3.75MP, 1:1 pixel coordinates (relevant to Chrome/Presentation/Video agents).
- **Better file-system memory** — agents maintaining scratchpads should lean on this.

### Breaking changes (API level — not SKILLs)
- `temperature`, `top_p`, `top_k` removed.
- Thinking budgets removed (`thinking: {type: "adaptive"}` only).
- New tokenizer uses ~1–1.35× more tokens → bump `max_turns`/`max_tokens` headroom.

---

## Current state of our SKILLs

- **50 active agent SKILL.md files** under `agents/`
- **6 team orchestrators** (wharfside-board-assistant, software-project, altium-solutions, personal-assistant, youtube-content, hardware-dev)
- **1 Architect SKILL** (this one)
- Most SKILLs were written between Jan–Apr 2026 before 4.7 launched (Apr 16).

### Common patterns that need tuning
| Pattern | Found in | 4.7 Issue |
|---|---|---|
| "Double-check your work before returning" | many specialists | 4.7 explicitly recommends removing this |
| "Ask one question at a time" | Architect, product-requirements | Costs turns 4.7 doesn't need; batch questions |
| Fixed response formats ("always start with X, then Y, then Z") | most specialists | Fights auto-calibrated length |
| "Warm, friendly, celebrates wins" personas | Archie, Max, several | 4.7 is more direct by default — soften, don't remove |
| Heavy "always call tool X" scripting | presentation, chrome-browser, rag-search | 4.7 uses tools less; make tool triggers conditional |
| No adaptive thinking guidance | all | No prompt-level "think carefully" hooks for hard tasks |
| Orchestrators don't explicitly instruct subagent delegation | all 6 teams | 4.7 spawns fewer subagents; orchestrators must be explicit |
| Emoji/emoji-heavy examples | a handful | 4.7 uses fewer emoji; Nick already prefers none |

---

## Proposed tuning approach (two-phase)

### Phase 1 — Add a shared "4.7 Operating Notes" block (~30 min)

Create `agents/_templates/4_7_operating_notes.md` — a short, reusable section that gets appended/referenced from every SKILL.md. Contents:

```markdown
## Operating Notes (Claude 4.7)

- **Instruction fidelity:** Follow instructions literally. Don't infer requests beyond what's asked. If scope is ambiguous, ask once with batched questions — don't invent.
- **Reasoning over tools:** Prefer reasoning when you already have enough context. Use tools when you need fresh data, must verify a claim, or the work requires external state. Don't chain tool calls for their own sake.
- **Response length:** Let the task dictate length. Short answers for simple asks, detailed work for complex ones. Don't pad or abridge to hit a fixed template.
- **Harder tasks:** If the problem is genuinely hard or multi-step, say "think carefully step-by-step before responding" in your own internal framing. If it's straightforward, answer directly.
- **Progress updates:** Give brief status updates during long work naturally — one sentence per milestone. No need for forced "Step 1 of 5" scaffolding.
- **Tone:** Direct and substantive. No validation-forward openers ("Great question!"), no unnecessary emoji. Warmth is fine where the persona calls for it, but don't manufacture it.
```

Each SKILL.md either inlines this block or references it (`See agents/_templates/4_7_operating_notes.md`).

### Phase 2 — Per-SKILL surgical edits (~2–3 hrs)

For each of the 50 SKILLs, make targeted edits:

**Delete:**
- Redundant "double-check before returning" scaffolding
- Fixed verbosity mandates ("always write 3 paragraphs", "use exactly 5 bullets")
- Forced emoji usage
- "Ask one question at a time" (replace with "batch questions when gathering requirements")

**Add:**
- Scope boundary statements ("What this agent does NOT do") — helps literal instruction following
- For agents that run long/complex tasks: conditional `think carefully` hook
- For orchestrators: explicit delegation criteria ("delegate when X; handle inline when Y")
- For vision-using agents (Chrome, Presentation, Video): note high-res image capability

**Refine:**
- Tool-call guidance: move from "always" to "when needed because..."
- Persona tone blocks: keep personality, trim performative warmth

### Phase 3 — config.json updates

- Model IDs: verify each agent's `execution.model` maps to the latest family member (`opus-4-7`, `sonnet-4-6`, `haiku-4-5-20251001`)
- `max_turns`: increase by ~20% to account for new tokenizer overhead
- Orchestrators: confirm `context: inline`, specialists `context: fork`

### Phase 4 — Team orchestrator refresh

For the 6 team orchestrators, add explicit delegation logic:
- "Delegate to [specialist] when the request involves [signals]"
- "Handle inline (without delegation) when the request is [lookup/quick question]"
- "For multi-specialist work, spawn in parallel where outputs are independent"

This counters 4.7's default fewer-subagents behavior.

### Phase 5 — Sync

Run `/sync-agents` + `node scripts/generate-cowork.js` to regenerate:
- `.claude/agents/*.md`
- `.claude/skills/*/SKILL.md`
- `cowork/skills/*/SKILL.md`

---

## Estimated effort

| Phase | Time | Risk |
|---|---|---|
| 1. Shared operating notes block | 15 min | Low |
| 2. Per-SKILL edits (50 files) | 2–3 hrs | Medium — want spot checks |
| 3. config.json model bumps | 30 min | Low |
| 4. Orchestrator delegation refresh | 45 min | Medium — affects routing |
| 5. Sync + validate | 15 min | Low |
| **Total** | **~4 hrs** | |

## Recommended order

1. **You approve this plan** (or ask for changes)
2. I start with Phase 1 (shared block) + Phase 3 (config bumps) — low-risk, fast
3. Phase 2 in batches by team (Wharfside → Max → Altium → Software → YouTube → Hardware) so you can sanity-check one team's outputs before I touch the next
4. Phase 4 after Phase 2
5. Phase 5 at the end

## Open questions for you

1. **Keep personas warm?** Max and Archie both have "friendly, celebrates wins" framing. 4.7 is more direct by default. Keep the warmth, tone it down, or drop it entirely?
2. **Task budgets?** Want me to add `task_budget` advisory caps to any agents for cost control? (Useful for research-heavy agents like account-researcher, web-research, email-research.)
3. **Effort levels?** Should I bake `xhigh` default recommendations into the coding agents (software-developer, firmware-engineer, pcb-designer)? This is a Claude Code / API setting, not something in SKILL.md — but we could document the recommendation.
4. **Scope of edits?** Go for all 50 SKILLs, or prioritize the ones you actually use weekly (Max, Wharfside, YouTube, Altium sales)?
