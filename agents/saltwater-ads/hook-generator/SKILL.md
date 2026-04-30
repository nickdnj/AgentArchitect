# Hook Generator — Saltwater AI Ads

The single LLM-driven agent in the Saltwater AI Ads system. Takes a brief and a snapshot of the brand bucket; returns 3 hook variants × 3 sub-variants. Validates each output against vocabulary, anti-pattern, and trademark rules before persisting.

The five companion services (Brand Bucket Manager, Triple Whale Connector, Render Orchestrator, Assembly, Meta Pusher) are deterministic TypeScript modules — not agents. See PRD §6.1 for the agent-vs-service split.

**Source of truth:** `docs/saltwater-ads/PRD.md` §6.1.2 (functional requirements), `docs/saltwater-ads/SAD.md` §3 + §4 (data flow and state machine).

## What this agent does

Given a brief like:

```json
{
  "free_text": "Memorial Day weekend launch — performance polo bundle",
  "sku_id": "performance-polo-navy",
  "pattern": "limited_drop",
  "audience_tag": "coastal-business-owner",
  "season": "summer"
}
```

…and the current brand bucket snapshot (versioned by SHA-256 hash), produce:

```json
{
  "hook_set_id": 42,
  "brand_bucket_version_id": 17,
  "variants": [
    { "label": "V1", "pattern": "limited_drop", "hook_text": "..." },
    { "label": "V2", "pattern": "limited_drop", "hook_text": "..." },
    { "label": "V3", "pattern": "limited_drop", "hook_text": "..." }
  ]
}
```

Three hook variants, each with three sub-variants (V1/V2/V3) — the system actually produces 3 × 3 = 9 candidate hooks per brief, but the model is asked to organize them into 3 main angles with 3 phrasings each. The web app surfaces the 3 main variants by default; Compare mode shows all 9.

## How it works

1. **Read brand bucket snapshot** — `voice.md` + `customer.md` + `winning-patterns.md` + `products.json` + last 20 winners from `hooks-winners.jsonl` + last 5 losers from `hooks-losers.jsonl`. Files at `context-buckets/saltwater-brand/files/`.
2. **Compute bucket version hash** — SHA-256 of each file, captured into `brand_bucket_version` table. This is the prompt-cache key.
3. **Build prompt** — system message primes voice/customer/patterns; user message is the brief shape. Prompts live at `apps/saltwater-ads/lib/llm/prompts/{hook-system.md,hook-user.md}`.
4. **Call Claude Sonnet 4.6** — via `apps/saltwater-ads/lib/llm/anthropic.ts`. Use `cache_control: ephemeral` on the system message keyed by bucket version hash.
5. **Validate output** — `apps/saltwater-ads/lib/services/validation.ts`:
   - Reject any hook containing OUT vocabulary ("cheap", "tacky", "hypebeast", "fratty", "stuffy", etc.)
   - Reject any hook containing anti-patterns ("elevate your wardrobe", "discover the difference", "crafted for the modern man")
   - Enforce **Coastal Comfort™** verbatim — must include the ™ symbol when used; lowercase or paraphrased = reject
   - Date-gated rule: "Veronica" referred to as "wife" only on or after 2026-11-01 (wedding date TBD)
6. **Regen up to 3× per failed validation** — if regen still fails, mark `hook_set.status='failed'`.
7. **Persist** — write rows to `variant` table with `status='queued'`, return IDs to the caller (`render-orchestrator.ts`).

## Constraints

- **Hook length:** ≤140 chars, written for spoken delivery (HeyGen lip-sync). Implicit comfortable pause/breath markers.
- **Pattern fidelity:** the brief specifies one of `founder | problem_solution | limited_drop`. All 3 variants stay in that pattern; V1/V2/V3 sub-variants vary phrasing only.
- **Trademark:** Coastal Comfort™ verbatim or absent — never paraphrased to "the comfort of the coast" or similar.
- **Anti-AI-slop:** no generic DTC copy. The validation layer is the safety net; the prompt itself should not produce these.

## Inputs

- **Brand bucket files** at `context-buckets/saltwater-brand/files/` (read-only per run, snapshotted)
- **Brief** from `brief` table (created by web app on form submit)
- **Performance priming** (when TW data is fresh): last 20 winners + last 5 losers from JSONL files. When TW is unreachable, hooks generate without priming and prompt-cache key reflects that to avoid serving stale priming.

## Outputs

- 3 main hook variants (each with 3 sub-variants V1/V2/V3) written to `variant` table
- `hook_set` row with `prompt_hash` and `model` recorded
- All output text passes the validation layer before persist

## What this agent does NOT do

- Render video (that's `render-orchestrator.ts` calling HeyGen + Fashn)
- Pull TW performance data (that's `tw-connector.ts`)
- Push to Meta Ads Manager (deferred to Sprint 2 — `meta-pusher.ts`)
- Generate Google Search copy or PMAX assets (deferred to Sprint 3 per PRD §6.1.2)

## Observability

Every generation logs:
- `request_id` (correlation ID)
- `brief_id` + `hook_set_id`
- `brand_bucket_version_id`
- `prompt_hash`
- `model_id` (e.g., `claude-sonnet-4-6`)
- token usage (input/output/cache_read/cache_write)
- validation result (pass/fail per variant)
- regen count

Logs go to stdout (pino-style JSON) and the `audit_log` table records the high-level event for compliance.

## Failure modes

| Failure | Behavior |
|---|---|
| Anthropic 429 | Backoff 30s, retry up to 3×; then `hook_set.status='failed'`, transition `render_attempt → failed_recoverable` |
| Anthropic 5xx | Backoff 10s, retry 2×; then `failed_recoverable` |
| Validation fail (all variants reject) | Regen up to 3×; if still failing, `hook_set.status='failed'` |
| Context overflow | Should never happen (bucket is small + cached). If it does → `failed_terminal`, page Nick |
| Bucket file missing or malformed | Web app rejects brief at submit; this agent never sees a bad bucket |

## Cross-references

- **PRD:** `docs/saltwater-ads/PRD.md` §6.1.2 (F-HG-1..6) and §6.1.6 deferred
- **SAD:** `docs/saltwater-ads/SAD.md` §3 (happy path), §4 (state machine), §8 (bucket versioning + prompt caching)
- **UXD:** `docs/saltwater-ads/UXD.md` (Generate screen interaction model)
- **Implementation:** `apps/saltwater-ads/lib/services/hook-generator.ts` + `apps/saltwater-ads/lib/llm/anthropic.ts` + `apps/saltwater-ads/lib/llm/prompts/`
- **Brand bucket:** `context-buckets/saltwater-brand/files/`
