# Internal Engineering Review — Saltwater AI Ads Sprint 1 (PRD v0.4 + SAD + UXD + scaffold)

**Date:** 2026-04-30
**Reviewer:** Software Architecture agent (challenge mode, internal pre-Codex pass)
**Scope:** PRD v0.4, SAD v0.1, UXD v1.0, `apps/saltwater-ads/` scaffold (60 files), AA registration (`agents/saltwater-ads/hook-generator/`, `teams/saltwater-ads/team.json`), brand bucket (`context-buckets/saltwater-brand/files/`), TW baseline data
**Disposition:** **NEEDS-REVISION** — three blockers and a cluster of high-severity drift between v0.4 spec and the scaffold. Day-1 boot will fail (auth never wired, schema is wrong). None of the issues are architectural — they're spec-coherence and integration plumbing the scaffold author skipped under the v0.3→v0.4 spec churn. Should be fixable in 2–3 days before `/plan-eng-review` (Codex) runs.

---

## Findings — by severity

### Critical (blockers; ship-stoppers)

#### C-1. Schema is wrong: scaffold ships PRD v0.3's `performance_snapshot` instead of v0.4's `account_metric_snapshot` + `order_journey` + `ad_performance`

**Severity:** Critical
**Files:**
- `apps/saltwater-ads/db/migrations/0001_init.sql:131–146` (the deprecated `performance_snapshot` table)
- `apps/saltwater-ads/db/migrations/0002_indexes.sql:11–13` (`idx_perf_meta_ad_date` indexes the dead table)
- `apps/saltwater-ads/lib/services/tw-connector.ts:60` (`syncIncremental` TODO references `performance_snapshot`)
- `docs/saltwater-ads/PRD.md:533–544` (PRD §6.6 itself **still** has the old table — this is the upstream root cause)
- `docs/saltwater-ads/SAD.md:152, 504, 616, 630` (SAD has mixed references — §7 mentions `account_metric_snapshot` + `order_journey`, §2 + §9.2 still claim "all 9 PRD §6.6 tables")

**Why it's a problem:** PRD v0.4 §6.1.3 explicitly deprecates `performance_snapshot` for Sprint 1 ("the `performance_snapshot` table from §6.6 (with spend, ROAS, CPA, hook_rate columns) is deprecated for Sprint 1 since none of those fields are available") and replaces it with three new tables. None of the new tables exist in `0001_init.sql`. When TW connector sync ships in week 2, it has nowhere to write summary data or journey rows. The `ad_performance` rollup that §10.1's gates depend on (Meta first-touch share, revenue rank by attribution model) cannot be computed.

The PRD itself is also internally inconsistent: §6.1.3 (v0.4) says "deprecated, use these 3 instead" but §6.6 (v0.3, never updated in v0.4) still defines the dead schema as canonical. Whoever wrote the scaffold read §6.6 and stopped.

**Fix (concrete):**
1. **Update PRD §6.6** — append a note "DEPRECATED for Sprint 1, see §6.1.3" above `performance_snapshot`, and copy the three v0.4 schemas (`account_metric_snapshot`, `order_journey`, `ad_performance`) into §6.6 so the section is single-source-of-truth again.
2. **Drop `performance_snapshot` from `0001_init.sql`.** Replace with:
```sql
CREATE TABLE account_metric_snapshot (
  id INTEGER PRIMARY KEY,
  pulled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  window_start DATE NOT NULL,
  window_end DATE NOT NULL,
  metric_id TEXT NOT NULL,
  current_value REAL,
  previous_value REAL,
  delta_pct REAL,
  UNIQUE(window_start, window_end, metric_id)
);
CREATE TABLE order_journey (
  id INTEGER PRIMARY KEY,
  pulled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  order_id TEXT NOT NULL,
  order_name TEXT,
  total_price REAL,
  currency TEXT,
  created_at TIMESTAMP,
  customer_id TEXT,
  attribution_json TEXT NOT NULL,
  UNIQUE(order_id)
);
CREATE TABLE ad_performance (
  id INTEGER PRIMARY KEY,
  computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  attribution_model TEXT NOT NULL,
  source TEXT NOT NULL,
  ad_id TEXT,
  campaign_id TEXT,
  adset_id TEXT,
  window_start DATE NOT NULL,
  window_end DATE NOT NULL,
  order_count INTEGER NOT NULL,
  revenue REAL NOT NULL,
  computed_aov REAL,
  UNIQUE(attribution_model, source, ad_id, window_start, window_end)
);
```
3. **Update `0002_indexes.sql`** — drop `idx_perf_meta_ad_date`; add `idx_order_journey_created ON order_journey(created_at DESC)` and `idx_ad_perf_lookup ON ad_performance(attribution_model, source, window_end DESC)`.
4. **Update `tw-connector.ts:60` watermark comment** — read latest `pulled_at` or `created_at` from `order_journey`, not `performance_snapshot`.
5. **Update SAD §2 module-map line 152 and §9.2 line 616 / 630** to say "all PRD §6.6 tables (per v0.4 — `account_metric_snapshot` + `order_journey` + `ad_performance`, not the deprecated `performance_snapshot`)."

**Effort:** S (~2h — schema rewrite + 4 file touches)

---

#### C-2. Authentication is never wired into the route tree — every API endpoint is currently public

**Severity:** Critical
**Files:**
- `apps/saltwater-ads/src/server/middleware/auth.ts` — `requireAuth()` exported, never imported anywhere
- `apps/saltwater-ads/src/server/app.ts:13–28` — only `logger`, `secureHeaders`, `requestId`, `errorHandler` middleware registered; no auth gate
- `apps/saltwater-ads/src/server/routes/briefs.ts`, `variants.ts`, `settings.ts`, `media.ts` — none use `requireAuth()`
- `apps/saltwater-ads/src/server/middleware/audit.ts` — `audit()` exported, never imported anywhere

**Why it's a problem:** SAD §5 specifies magic-link auth with signed-cookie session as a hard requirement. PRD §7.7 is explicit that vendor keys are server-side only and the Settings screen must require authenticated access. Today, `POST /api/briefs`, `POST /api/variants/:id/approve`, `POST /api/settings/secrets`, even `GET /api/settings` (which returns secret-presence booleans) accept anonymous requests. If this scaffold gets pushed to a public IP for a Sprint 1.5 demo before auth lands, anyone on the internet can submit briefs that burn HeyGen credits at $0.50–$1/clip.

The audit middleware is similarly orphaned. SAD §11.3 enumerates events that must be audit-logged (login, magic-link request, brief submit, approve/reject/regen, secret update, TW manual sync). Today, none of those write to `audit_log`. The compliance posture documented in SAD §5.3 is fictional.

**Fix (concrete):**
1. **Wire `requireAuth()` into `src/server/app.ts`** between `requestId()` and the route mounts — exempt `/healthz` and `/auth/*`. Pattern:
```ts
app.use('*', requestId());
app.use('/api/*', requireAuth());
app.use('/media/*', requireAuth());
app.onError(errorHandler);
```
2. **Wire `audit('action_name', 'target_type')` into the four mutating routes** (`briefs.create`, `variants.approve`, `variants.reject`, `variants.regen`, `settings.secrets`, `settings.tw-sync`). The middleware already runs `await next()` before writing, so it captures the right outcome; routes just need to `c.set('auditTargetId', String(briefId))` before returning.
3. **Add a route-level test** in `test/integration/auth.test.ts`: `POST /api/briefs` with no cookie → expect 401. `GET /api/settings` with no cookie → 401. `GET /healthz` with no cookie → 200.

**Effort:** M (~3h — wiring + writing the test)

---

#### C-3. Job-claim transaction is not atomic — the comment lies

**Severity:** Critical
**Files:**
- `apps/saltwater-ads/src/worker/tick.ts:19–35` (the `claimJobs` function and its lying header comment)

**Why it's a problem:** The header comment says "Claims jobs atomically via BEGIN IMMEDIATE + state precondition." The code does no such thing. It runs a `SELECT id, variant_id, state FROM render_attempt WHERE state IN (...)` inside `transaction(...).immediate()`, then loops over results and pushes to a JS array — but the `// TODO: transition to next state per state machine, mark started_at` line means **no UPDATE happens inside the transaction.** The transaction commits with no writes; `state` stays at `'queued'`. The next 2-second tick re-selects the same rows. If `bun --hot` restarts the worker, or someone runs `bun run dev:worker` in a second terminal during dev, both workers will pick the same row and both will run the pipeline against the same `render_attempt.id`. That's HeyGen + Fashn double-billing.

`BEGIN IMMEDIATE` only guarantees the lock is held during the transaction. Without an UPDATE inside, claim → release happens with no state change, so concurrent claims are not serialized in any meaningful way.

This is also why `runPipeline` throwing `not_implemented` doesn't stop the bug — even when pipeline is real, the SELECT-without-UPDATE pattern means the next tick will re-claim a row whose pipeline is mid-flight.

**Fix (concrete):** Inside the transaction loop, do an `UPDATE render_attempt SET state = ?, started_at = CURRENT_TIMESTAMP WHERE id = ? AND state = ?` (the trailing `AND state = ?` is the precondition that makes this a true compare-and-swap). Only push to `claimed[]` if the UPDATE returned `changes > 0`. Map: `'queued' → 'hooks_generating'`, `'hooks_ready' → 'vendor_pending'`, `'partial' → 'assembling'`. Patch:

```ts
function claimJobs(limit: number): ClaimedJob[] {
  const conn = db();
  const NEXT_STATE: Record<string, string> = {
    queued: 'hooks_generating',
    hooks_ready: 'vendor_pending',
    partial: 'assembling',
  };
  return conn.transaction(() => {
    const candidates = conn.query(
      `SELECT id, variant_id, state FROM render_attempt
       WHERE state IN (${CLAIMABLE_STATES.map(() => '?').join(',')})
       ORDER BY id ASC LIMIT ?`
    ).all(...CLAIMABLE_STATES, limit) as { id: number; variant_id: number; state: string }[];
    const claimed: ClaimedJob[] = [];
    for (const c of candidates) {
      const next = NEXT_STATE[c.state];
      if (!next) continue;
      const res = conn.run(
        `UPDATE render_attempt
         SET state = ?, started_at = COALESCE(started_at, CURRENT_TIMESTAMP)
         WHERE id = ? AND state = ?`,
        [next, c.id, c.state]
      );
      if (res.changes === 1) claimed.push({ renderAttemptId: c.id, variantId: c.variant_id, state: next });
    }
    return claimed;
  }).immediate();
}
```

Add `test/unit/state-machine.test.ts` with a "claim is idempotent under double-call" case before this is considered fixed.

**Effort:** S (~1h fix + 1h test)

---

### High (real risk if shipped as-is)

#### H-1. Bucket "snapshot semantics" are aspirational, not implemented — mid-flight edits WILL affect running jobs

**Severity:** High
**Files:**
- `apps/saltwater-ads/lib/services/brand-bucket-manager.ts:33–61` (`snapshotBucket`)
- `docs/saltwater-ads/SAD.md:519–586` (SAD §8 promises a `data/bucket-cache/<sha>.md` content-addressed cache)
- `docs/saltwater-ads/PRD.md:394` ("A bucket edit during a running generation does NOT affect that generation (snapshot semantics).")

**Why it's a problem:** SAD §8.1 is explicit: "the worker reads from a content-addressed cache (`data/bucket-cache/<sha>.txt`) that's written eagerly during snapshot." The scaffold's `snapshotBucket()` only computes hashes and inserts a `brand_bucket_version` row — it doesn't write any cache files. SAD §8.3 is even more explicit: "the upload writes the new file ... and writes the **previous** version's content to `data/bucket-cache/<old-sha>.md`." None of that exists either.

What this means concretely: `POST /briefs` runs, snapshot returns version_id 42 with hash `abc123`. Two minutes later, Joe uploads a new `voice.md` via Settings. The worker, still mid-job for version_id 42, calls `runHookGenerator()` which (per `hook-generator.ts:22`) re-calls `snapshotBucket()` — which now reads the NEW `voice.md`, hashes it, inserts a SECOND `brand_bucket_version` row with hash `def456`, and primes the LLM with the new file. The hook_set's recorded `brand_bucket_version_id = 42` is now a lie about what actually generated the hooks.

This isn't theoretical at Saltwater's volume — Joe will absolutely upload a new `voice.md` while a generation is in flight. The PRD promises he can; SAD §8.3 promises the system handles it.

**Fix (concrete):** Two parts.

1. **Materialize the cache during snapshot.** In `snapshotBucket()`, after computing each hash, write the file content to `data/bucket-cache/<sha>.<ext>` if it doesn't exist (use `Bun.file().exists()`):
```ts
async function cacheFile(content: string, sha: string, ext: string): Promise<void> {
  const path = resolve(CACHE_DIR, `${sha}.${ext}`);
  if (!(await Bun.file(path).exists())) {
    await Bun.write(path, content);
  }
}
```
2. **Snapshot at brief-creation time, not at hook-generation time.** Move the `snapshotBucket()` call from `hook-generator.ts` (which is called by the worker mid-job) to `routes/briefs.ts` (which runs synchronously inside the brief's create transaction). Pass the `versionId` through the `brief` row → `hook_set.brand_bucket_version_id`. The hook generator should then **read from cache by sha, not from the live filesystem**, given a `BrandBucketVersion` lookup.

The current implementation re-snapshots inside the agent, which defeats the entire purpose. The snapshot must happen once, at brief creation.

**Effort:** M (~4h — refactor snapshot site + cache writer + read-from-cache helper)

---

#### H-2. AI disclosure gate enforced server-side, missing client-side — Approve button never disables in UI

**Severity:** High
**Files:**
- `apps/saltwater-ads/src/server/routes/variants.ts:18–30` (server validates `ai_disclosure_acknowledged: true`)
- `apps/saltwater-ads/src/web/api.ts:39–43` (the client **always** sends `ai_disclosure_acknowledged: true` regardless of UI state)
- `apps/saltwater-ads/src/web/pages/ReviewQueue.tsx` (placeholder, no checkbox or disabled-button logic)
- `docs/saltwater-ads/UXD.md:280–285` (UXD specifies the disclosure checkbox is checked-on-load=false, must persist per variant, must disable Approve via `aria-disabled + disabled` attributes)

**Why it's a problem:** The PRD §7.5 hard gate is enforced at one layer — the API. The frontend client at `api.ts:42` hardcodes `ai_disclosure_acknowledged: true` in every approve request. The Review Queue page is a placeholder TODO with no checkbox component at all. UXD §4.3 details exactly what the gate looks like (amber background, specific microcopy, must be unchecked on every variant load) and that doesn't exist in code.

The server check is good defense-in-depth, but the disclosure gate's actual purpose — making Joe consciously acknowledge AI-content compliance before each download — is unenforced. He'll click Approve, the client auto-sends `true`, the server accepts, and Meta compliance becomes a thing he forgot. PRD §7.5 calls this enforceable; today it's theatrical.

There's also a soft Trust on Server (TOS) issue: the `z.literal(true)` zod validator returns 400 if the body doesn't have the field, but the client always sends it. So in practice the server check fires only against a hand-crafted curl, not against the actual product.

**Fix (concrete):**
1. **Add `<AiDisclosureGate>` component** at `src/web/components/AiDisclosureGate.tsx` per UXD §4.3. State: `checked: boolean`, default `false` on every variant select.
2. **Wire `ReviewQueue.tsx` detail pane** so the Approve button's `disabled` prop is `!aiDisclosureChecked || variantStatus !== 'ready_for_review'`.
3. **Refactor `api.ts:39–43`** to take the checkbox state as a parameter — never hardcode `true`. Signature: `approve: (id: number, ackd: boolean) => ...`. Caller in `ReviewQueue.tsx` reads from local state, sends actual value.
4. **Add UI test** (`test/unit/ai-disclosure.test.ts` or playwright/integration) that simulates click-Approve-without-checkbox → expect button is disabled, no network call fires.

**Effort:** M (~4h once Review Queue page is being built; trivial if done as part of that work)

---

#### H-3. Brand bucket file count drift — scaffold reads 6 files, PRD spec lists 5

**Severity:** High
**Files:**
- `apps/saltwater-ads/lib/services/brand-bucket-manager.ts:12–19` (FILES dict has 6 entries including `winning-patterns.md`)
- `apps/saltwater-ads/db/migrations/0001_init.sql:23–32` (schema has 6 sha256 columns including `winning_patterns_sha256`)
- `apps/saltwater-ads/lib/llm/types.ts:23–31` (BrandBucketSnapshot type has `winning_patterns: string` field)
- `apps/saltwater-ads/lib/llm/prompts/hook-system.md:15–17` (template has `{{WINNING_PATTERNS_MD}}` placeholder)
- `docs/saltwater-ads/PRD.md:392` (PRD §6.4 says "voice.md, customer.md, products.json, hooks-winners.jsonl, hooks-losers.jsonl SHA-256 hashes" — 5 files, no `winning-patterns.md`)
- `docs/saltwater-ads/PRD.md:456–457` (PRD §6.6 schema has 5 sha256 columns, no `winning_patterns_sha256`)
- `docs/saltwater-ads/SAD.md:528–529` (SAD §8.1 lists 5 files)
- `context-buckets/saltwater-brand/files/` (filesystem has 6 files including `winning-patterns.md`)

**Why it's a problem:** The actual bucket on disk has 6 files (someone already created `winning-patterns.md`); the scaffold correctly reads all 6. But the PRD and SAD both claim there are 5. This means:
- The PRD §6.6 schema definition for `brand_bucket_version` doesn't match what `0001_init.sql` ships (PRD has 5 sha columns, SQL has 6).
- The PRD §6.1.1 F-BBM-1..3 enumerate `voice.md / customer.md / products.json` but make no mention of `winning-patterns.md` — the file's existence and purpose are undocumented in the PRD.
- The bucket fingerprint hash is computed over 6 files, but if a future operator reads the PRD and adds a 7th file, they'll silently break the snapshot version logic.

The scaffold author correctly observed reality (the file exists on disk) and incorporated it. The PRD was just never updated when `winning-patterns.md` was added.

**Fix (concrete):**
1. **Update PRD §6.1.1 F-BBM-1..3** — add F-BBM-3.5 (or renumber): `winning-patterns.md` (Founder Story / Problem-Solution / Limited Drop pattern catalog with examples and structural rules).
2. **Update PRD §6.4** bullet 1 — add `winning-patterns.md` to the snapshot file list.
3. **Update PRD §6.6** `brand_bucket_version` schema — add `winning_patterns_sha256 TEXT NOT NULL`.
4. **Update SAD §8.1 line 528** — add `'winning-patterns.md'` to the `files` array in the snapshot example.

Alternative: if Nick actually wants 5 files (e.g., the current `winning-patterns.md` content should fold into `voice.md`), then the scaffold + bucket are wrong and need to drop the file. Decide direction; `customer.md` review suggests the 6-file shape is the intended state. Recommendation: **update specs to match reality, keep 6 files.**

**Effort:** S (~30 min spec updates)

---

#### H-4. Vite proxy port mismatch — `/api` proxies to :3001 but server defaults to PORT env or 3001

**Severity:** High
**Files:**
- `apps/saltwater-ads/vite.config.ts:21–25` (proxy targets `http://localhost:3001`)
- `apps/saltwater-ads/src/server/index.ts:7` (`const PORT = Number(process.env.PORT ?? 3001)`)
- `apps/saltwater-ads/scripts/dev.sh:21–23` (launches server with no `PORT=` env, so 3001 by default)
- `apps/saltwater-ads/README.md:68–70` (docs say `http://localhost:3001`)
- `docs/saltwater-ads/SAD.md:806` (`/etc/systemd/system/saltwater-ads-web.service` says `Environment=PROC_NAME=web PORT=3000` — port 3000, not 3001)

**Why it's a problem:** The whole stack agrees on 3001 — except the SAD's deployment unit, which says 3000. In dev this is fine. In production, when Caddy fronts the systemd service, it'll talk to :3000 (per the systemd unit) but the app spec assumes 3001. Either Caddy's `reverse_proxy 127.0.0.1:3000` is correct (and the dev port should change) or vice versa, but both can't be right.

Also worth flagging: Vite dev server runs on 5173, hits :3001 via proxy. In production, Vite is gone — Hono serves the SPA from `dist/web/`. The scaffold's `app.ts` doesn't have static-asset serving wired up at all. The `dist/web/` build output is unrouted.

**Fix (concrete):**
1. **Pick one port. Recommend 3001** (consistent with what the scaffold + README say). Update SAD §12.1's systemd unit to `Environment=PROC_NAME=web PORT=3001` and `reverse_proxy 127.0.0.1:3001` in the Caddyfile.
2. **Add static-asset serving** to `app.ts`. After all API routes:
```ts
import { serveStatic } from 'hono/bun';
app.get('/assets/*', serveStatic({ root: './dist/web' }));
app.get('*', serveStatic({ root: './dist/web', path: 'index.html' }));
```
This needs to come last so API routes win.

**Effort:** S (~1h)

---

#### H-5. `package.json` is missing two declared imports

**Severity:** High
**Files:**
- `apps/saltwater-ads/package.json:22–28` (deps list)
- `apps/saltwater-ads/src/server/app.ts:2–3` (imports `hono/logger` + `hono/secure-headers` — these are subpaths of `hono` so OK, but...)
- `apps/saltwater-ads/lib/services/secrets.ts` (no missing imports)
- `apps/saltwater-ads/db/migrate.ts:1` (imports `node:fs/promises`)
- `apps/saltwater-ads/db/backup.ts:18` (uses `await import('node:fs/promises')` — odd dynamic import but works)

I audited every TS import. Final result: **all top-level imports resolve.** The deps that actually show up in code:
- `@anthropic-ai/sdk` ✓
- `hono` (with subpaths `hono/logger`, `hono/secure-headers`, `hono/cookie`, `hono/bun`) — `hono/bun` is currently NOT imported but will be needed for static serving (H-4 fix). All current imports are valid hono subpaths.
- `react`, `react-dom`, `react-dom/client` ✓
- `resend` ✓
- `zod` ✓
- `bun:sqlite`, `bun` ✓ (Bun built-ins)
- `node:crypto`, `node:fs`, `node:path`, `node:fs/promises` ✓ (Node std)

**However:**
- `msw` is in devDeps — **declared but never imported** in any test file. The `setup.ts` file is empty of MSW setup. The SAD §10.2 promises MSW-mocked vendor calls. Either drop the dep or write the integration tests; current state ships the dep without using it.
- **No `@types/node` declared.** Bun ships with `bun-types` (declared as `@types/bun: latest`), and tsconfig types includes `bun-types`, so node:* imports may resolve via Bun's bundled typings. Verify with `bun run typecheck` before claiming this works. If `tsc --noEmit` complains about `node:crypto`, add `@types/node` to devDeps.

**Why it's a problem:** Nothing currently broken at boot, but the spec promises MSW-based integration tests (SAD §10.2) and they don't exist. When Codex re-runs CI in a week and sees no integration tests, it'll land a finding.

**Fix (concrete):**
1. Either land at least one MSW integration test (`test/integration/brief-to-review.test.ts` per SAD §10.2) before Codex review, OR drop `msw` from devDeps and explicitly list it as a Sprint-2 add.
2. Run `bun run typecheck` once and resolve any node-type complaints by adding `@types/node` if needed.

**Effort:** L if writing the MSW integration test (4–8h); S if deferring MSW to Sprint 2 (15 min).

---

#### H-6. Pino logger declared in SAD §11, completely absent from scaffold; logging is `console.log(JSON.stringify(...))`

**Severity:** High
**Files:**
- `docs/saltwater-ads/SAD.md:706–718` (SAD §11.1 specifies `pino` with structured fields, level configuration, timestamp formatter)
- `apps/saltwater-ads/package.json` (no `pino` declared)
- `apps/saltwater-ads/src/server/middleware/error.ts:5–10` (uses `console.error(JSON.stringify(...))` ad hoc)
- `apps/saltwater-ads/src/worker/tick.ts:42–48` (same pattern)
- `apps/saltwater-ads/src/worker/poll-jobs.ts:22` (same)

**Why it's a problem:** The SAD's observability story rests on structured pino logs with `proc`, `request_id`, `attempt_id`, `vendor`, `cost_credits` fields. The scaffold has none of that — it has 4 different ad-hoc `console.error(JSON.stringify({...}))` calls with inconsistent field names (`source` vs no source, `error` vs `message`). The README, SAD, and audit-log table all assume pino-style correlation; neither systemd's `journalctl` filtering nor any future log-aggregation step works without consistent field names.

This is not a "polish item" — when a HeyGen call fails at 11pm and Nick needs to grep `journalctl -u saltwater-ads-worker` for the failing variant, inconsistent JSON shape is exactly what burns 30 minutes.

**Fix (concrete):**
1. **Add pino** to deps: `"pino": "^9.5.0"`.
2. **Create `lib/log.ts`** per SAD §11.1 verbatim.
3. **Replace every `console.error(JSON.stringify(...))`** with `log.error({ field: value }, 'message')`.
4. **Wire `request_id` into the logger** via Hono's context: in `app.ts`, after `requestId()` middleware, do `c.set('log', log.child({ request_id: c.get('requestId') }))`. Routes use `c.get('log').info(...)` for correlated lines.

**Effort:** M (~3h)

---

### Medium (worth fixing, not ship-stoppers)

#### M-1. Per-vendor timeout enforcement is exported but unwired

**Severity:** Medium
**Files:**
- `apps/saltwater-ads/src/worker/deadlines.ts:1–16` (exports `withDeadline()`)
- `apps/saltwater-ads/src/worker/pipeline.ts:12–21` (entire pipeline is `throw new Error('not_implemented')`)
- `apps/saltwater-ads/lib/services/render-orchestrator.ts:22–31` (also TODO)

**Why it's a problem:** Nothing's wired because the pipeline isn't built. SAD §4.3 specifies HeyGen 5min, Fashn 8min, FFmpeg 2min, total 15min. The deadlines module exposes the right constants but no caller uses them. Acceptable for scaffold; flagging because the integration is non-trivial (each vendor SDK has its own AbortSignal handling and the FFmpeg subprocess needs `Bun.spawn` with explicit timer + SIGKILL) and is the most likely place a "scaffold becomes implementation" handoff goes wrong.

**Fix (concrete):** When pipeline.ts is implemented, every external call must take an AbortSignal. Pattern:
```ts
const { signal: heygenSig, cancel: heygenCancel } = withDeadline(VENDOR_TIMEOUTS_MS.heygen);
try {
  const heygen = await heygenClient.generate({ ...args, signal: heygenSig });
} finally {
  heygenCancel();
}
```
Add a unit test that times out a fake fetch in <100ms to prove the wiring. No fix needed today; flag for the implementation pass.

**Effort:** M (4–6h when pipeline lands)

---

#### M-2. Statistical concern with the §10.1 "Meta first-touch share" gate at N≈16 orders/30d

**Severity:** Medium (gate-design issue, not code)
**Files:**
- `docs/saltwater-ads/PRD.md:762` (§10.1 signal #3: "Has Meta's share of `fullFirstClick`-attributed orders held or grown vs the 30-day pre-launch baseline (24% / ~16 orders / ~$1,898)")
- `docs/saltwater-ads/baseline-data/tw-journey-findings.md:60–72` (raw 30-day journey data)

**Why it's a problem:** At ~16 first-touch orders/30d, a single order moving in or out is ±6.25% on share. The 24% baseline isn't statistically meaningful at month-1 measurement — random variance can swing it from 18% to 30% with no creative change. PRD §10.1 already acknowledges "at $3K/mo Meta spend, 4 weeks produces ~10-20 ad variants live. Detecting a 7%→10.5% hit-rate lift at that volume is below the statistical-significance floor" — so the doc has the right disclaimer for hit-rate but applies the gate to a similarly tiny sample.

The gate's two-of-three framing ("two of three financial signals worse") softens this — the gate doesn't trigger on signal #3 alone. But in the spirit of v0.4's honesty-about-noise pivot, signal #3 needs either (a) a wider window (60d) or (b) a more forgiving threshold ("dropped >40% relative" instead of "dropped materially"), or (c) explicit downgrade from gate-input to "directional-only."

**Fix (concrete):** PRD §10.1 signal #3 — soften to: "Meta first-touch share **trend over 60 days**, not 30. Concern fires only if the trailing 60-day share drops more than 30% relative to the pre-launch 60-day baseline. At N≈16 orders/30d, anything tighter is noise." Or: relabel signal #3 as "directional only — does not trigger the kill gate at month 1; promoted to gate-input at month 3 once N is real." Either is honest; the current threshold isn't.

**Effort:** S (PRD edit, ~15 min)

---

#### M-3. Operator-load arithmetic doesn't add up to the 30 min/week ceiling — at 40–60 variants/month, Joe is over

**Severity:** Medium (PRD-level math issue)
**Files:**
- `docs/saltwater-ads/PRD.md:763` (§10.1 signal #4: "If he's spending >30 min/week on ops, system is broken")
- `docs/saltwater-ads/PRD.md:86, 110` (target ≤5 min active attention per ad)
- `docs/saltwater-ads/PRD.md:87` (volume target 40–60 variants/month)

**Why it's a problem:** Spec is internally inconsistent. Per-ad ceiling is 5 min × 40 variants/month = 200 min = ~50 min/week minimum. At 60 variants = 75 min/week. The 30 min/week kill criterion is met just by hitting the volume target. Either:
- The 5-min-per-ad ceiling is wrong (and Joe is actually spending less per ad once the system is humming — but the UXD then spec'd 5 min based on the same number)
- The 30-min/week kill criterion is wrong (and 60 min/week is acceptable at 40–60 variants/month)
- The volume target is unrealistic at 5 min/ad budget

The UXD §1.1 doubles down on the 5-min number ("Joe ... will not invest more than 5 minutes of active attention per ad"). UXD §4.3 then specifies the review flow: watch the video (≥18s for 30s ad with rewatch), read hook, edit caption (autosaves but Joe still reads it), check disclosure box, click Approve, download MP4, switch tabs to Meta Ads Manager, paste, attach. That's not 5 minutes — that's closer to 7–10 minutes of actual attention per ad once Meta upload is in the loop (Sprint 2 auto-pushes; Sprint 1.5 is manual).

**Fix (concrete):** Pick one of three:
1. **(Recommended) Raise the kill criterion** to 60 min/week. Phrase: "If Joe spends >60 min/week on ops at sustained 40–60 variants/month volume, system is broken." Tied to volume, not absolute.
2. **Add a batch approval flow.** UXD §4 currently makes Joe approve one variant at a time; add a "Approve all 3 variants of this brief" button on the Compare-mode card grid. That collapses 3× check-disclosure-and-click to 1× check-disclosure-and-click. Saves ~2 min per brief at 40 variants/month = 30 min/week saved. Spec change in UXD §4.4 + frontend work in Sprint 1.5.
3. **Lower the volume target** to 20–30 variants/month for Sprint 1, with the 40–60 number reframed as a Sprint 2+ goal (post-Meta-Pusher when manual-upload friction is gone).

I'd ship #1 + #2 together — honest math + the batch flow that earns it back.

**Effort:** S for PRD edit; M (3–4h) for batch-approve UI in Sprint 1.5

---

#### M-4. Hosting domain decision still open — recommend a default with a one-line decision tree

**Severity:** Medium
**Files:**
- `docs/saltwater-ads/PRD.md:832` (§12 Q6 still open)
- `docs/saltwater-ads/SAD.md:777, 891` (SAD §12 says "TBD per PRD §12 Q6", §13.2 #5 "Decision needed before Sprint 1.5 deploy")

**Why it's a problem:** Sprint 1.5 deployment is week-4 territory. The hosting domain decision blocks: (a) Caddy auto-HTTPS DNS validation (needs the actual domain), (b) magic-link email URLs in `auth-email.ts` (needs the host), (c) SAML/OAuth callback URLs if any vendor needs them, (d) Resend domain DKIM setup. Three weeks of build is 21 days of saying "TBD" before someone has to pick.

**Fix (concrete):** Default decision tree in PRD §12 Q6: **`saltwater-ads.demarconet.com`** unless Joe says otherwise by end of week 2. Rationale:
1. `demarconet.com` is Nick's, DNS already configured (Cloudflare or wherever), Caddy ACME ready.
2. The system is single-tenant for Saltwater but legally Nick's tooling — billing, vendor contracts, and infra ownership all rest with Nick during the 5–10 hr/month maintenance window.
3. If Saltwater eventually wants the system on their own domain, DNS CNAME swap is 10 minutes + a Caddy reconfig.
4. If Vistter rebrands the framework as a productized offering, `saltwater-ads.demarconet.com` doesn't bake in the wrong identity.

Alternative if Joe strongly prefers Saltwater-owned: `ads.saltwaterclothingco.com` — clean ownership, but Joe has to add a DNS record on the Saltwater Cloudflare account, and key rotation involves him every time. Higher friction = less likely to happen.

**Effort:** S (decision + 30 min PRD edit)

---

#### M-5. `validation.ts` regex for OUT_VOCAB is double-applied (`new RegExp(\`\\b${word}\\b\`)` after `.toLowerCase()` is wasted work)

**Severity:** Medium (minor correctness/perf)
**Files:**
- `apps/saltwater-ads/lib/services/validation.ts:28–33`

**Why it's a problem:** Code does `const lower = hookText.toLowerCase()` then loops `OUT_VOCAB` with `new RegExp(\`\\b${word}\\b\`, 'i').test(lower)`. The `'i'` flag is redundant after `.toLowerCase()`. More importantly, **`new RegExp` inside a loop is allocated per call** and the regex is identical each invocation — for a hot validation path called per-hook-per-regen, this is dumb. Functionally correct, but wasteful.

**Fix (concrete):**
```ts
const OUT_VOCAB_RX = new RegExp(
  `\\b(${[...OUT_VOCAB].map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
  'i'
);
// then in validateHook:
const m = OUT_VOCAB_RX.exec(hookText);
if (m) return { rule: 'out_vocab', detail: m[1] };
```
Single regex, single test, returns the matched word in `detail`. Faster and cleaner.

**Effort:** S (~15 min)

---

#### M-6. Tests don't cover the actual Hook Generator, brand bucket versioning, or state machine

**Severity:** Medium (acceptable for Sprint 1 scaffold; flag for must-add list)
**Files:**
- `apps/saltwater-ads/test/unit/validation.test.ts` (only real test)
- `apps/saltwater-ads/test/unit/state-machine.test.ts` (does not exist; SAD §10.1 promises it)
- `apps/saltwater-ads/test/unit/brand-bucket-manager.test.ts` (does not exist)
- `apps/saltwater-ads/test/integration/brief-to-review.test.ts` (does not exist)

**Why it's a problem:** SAD §10 is specific about which tests gate Sprint 1 ship. The validation suite Sprint 1 has is thorough for what it covers, but doesn't exercise: the state-machine atomicity (C-3), the snapshot semantics (H-1), or the FFmpeg golden-media regression. None of those are in the scaffold; all of those are SAD-required.

**Fix (concrete):** Before first ship (week 4), add at minimum:
1. `state-machine.test.ts` — every transition pair from PRD §6.5; illegal transition rejected; double-claim rejected (proves C-3 fix).
2. `brand-bucket-manager.test.ts` — identical 6-file bucket → identical version_id; mid-flight edit → cache-read returns OLD content (proves H-1 fix).
3. `integration/brief-to-review.test.ts` — full pipeline with HeyGen+Fashn mocked via MSW (or H-5 alternative: vendored fake HTTP responses), real `bun:sqlite`, real `ffmpeg`. Output hash compared to `expected-master.mp4` per SAD §10.2.

Acceptable for current scaffold state; flag for must-add before first ship.

**Effort:** M+ (8–12h to write all three properly with fixtures)

---

### Low (notes / tidy-up)

#### L-1. `BUCKET_DIR` path traversal is brittle

**File:** `apps/saltwater-ads/lib/services/brand-bucket-manager.ts:10`
**Issue:** `resolve(import.meta.dir, '../../../../context-buckets/saltwater-brand/files')` — four levels up. Depends on the file being at exactly `apps/saltwater-ads/lib/services/`. If the scaffold is ever extracted via `scripts/build-starter.js` to a different repo root, this breaks silently.
**Fix:** Make `BUCKET_DIR` an env var (`SALTWATER_BRAND_BUCKET_PATH`) with the current path as default. Also prevents test pollution — tests can point at a fixture bucket.
**Effort:** S (~10 min)

#### L-2. `seed.ts` writes `'seed'` literal as 6 sha256 hashes — fails NOT NULL check on `winning_patterns_sha256` column once that's there

**File:** `apps/saltwater-ads/scripts/seed.ts:9–12`
**Issue:** Insert hardcodes 6 string literals; works today because the column exists. If H-3 fix renames or removes the column, seed fails. If C-1 fix replaces `performance_snapshot`, no impact (seed doesn't touch perf).
**Fix:** Replace literals with computed `sha256('seed')` values via `lib/services/brand-bucket-manager.ts`. Or accept the literal-string approach but document it.
**Effort:** S (~10 min)

#### L-3. README references PRD v0.3, not v0.4

**File:** `apps/saltwater-ads/README.md:7`
**Issue:** "PRD: ../../docs/saltwater-ads/PRD.md (v0.3)" — should be v0.4.
**Effort:** S (one-line edit)

#### L-4. SAD references PRD v0.3 in header

**File:** `docs/saltwater-ads/SAD.md:7`
**Issue:** Same — "PRD Reference: docs/saltwater-ads/PRD.md v0.3". Outdated after v0.4 published same day.
**Effort:** S (one-line edit)

#### L-5. SAD §13.1 "Hourly TW sync" says "On-demand sync (account summary + journey) ships in v1" but TW connector code only stubs `pullSummary`; `pullJourneys` and `syncIncremental` are TODO

**Files:**
- `docs/saltwater-ads/SAD.md:867`
- `apps/saltwater-ads/lib/services/tw-connector.ts:54–62`

**Issue:** Spec promises v1 ships on-demand sync; code has 1 of 3 functions implemented. Tracking issue, not blocker.
**Fix:** Implement `pullJourneys` per the verified API surface (`POST /attribution/get-orders-with-journeys-v2` with `{shop, startDate, endDate}` per `baseline-data/tw-journey-findings.md`). Implement `syncIncremental` against `order_journey` table (after C-1 fix lands).
**Effort:** M (~4h once C-1 schema is in place)

#### L-6. `data/secrets.env` parser doesn't handle quoted values with `=` inside

**File:** `apps/saltwater-ads/lib/services/secrets.ts:18–22`
**Issue:** Regex `^([A-Z_]+)=(.*)$` is fine for normal values, but the post-match `.replace(/^"(.*)"$/, '$1')` is greedy on `.*` — if a key contains `="hello"="world"`, you get `hello"="world` not `hello"="world"`. Edge case; vendor keys are typically base64 URL-safe so this won't bite, but worth noting.
**Fix:** Use a real .env parser (`dotenv` is 5KB) or document the constraint that values must not contain `"=` substring.
**Effort:** S (5 min — add comment, not deps)

#### L-7. `bunfig.toml` test preload sets `DB_PATH=:memory:` but `db/client.ts` opens it via `new Database(DB_PATH, { create: true })` — works, but `:memory:` and `create: true` are an odd pairing

**Files:**
- `apps/saltwater-ads/test/setup.ts:5`
- `apps/saltwater-ads/db/client.ts:10`

**Issue:** Probably fine — Bun's sqlite handles `:memory:` correctly with `create: true`. Worth a unit test that asserts a fresh in-memory DB has the schema applied. Currently no test runs migrations — they assume the schema exists.
**Fix:** In `test/setup.ts`, run `migrate()` against the in-memory DB before tests start. Without this, integration tests have an empty DB.
**Effort:** S (~30 min — add migrate call to setup)

#### L-8. UXD spec'd a "compose mode 3-up" Compare view with per-card AI disclosure but `<VariantCard>` component has no compare-mode prop

**Files:**
- `docs/saltwater-ads/UXD.md:304–318` (compare mode spec)
- `apps/saltwater-ads/src/web/components/VariantCard.tsx:6–30` (no compare prop)

**Issue:** Implementation gap. Acceptable today (Review Queue page is placeholder); flag for the build pass.
**Effort:** M (~3h when ReviewQueue.tsx is built)

#### L-9. Anthropic model id `'claude-sonnet-4-6'` — verify exact model name with the SDK

**File:** `apps/saltwater-ads/lib/llm/anthropic.ts:8` (and `agents/saltwater-ads/hook-generator/config.json:68`)
**Issue:** As of April 2026, model identifiers vary (`claude-sonnet-4-6`, `claude-sonnet-4.6`, `claude-sonnet-4-6-20260415`-style). Wrong identifier returns 404 from Anthropic API. Sanity-check before first generation call.
**Fix:** Run a one-shot `anthropic.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 10, ... })` against the real API and confirm 200. Update the const if the API expects a different string.
**Effort:** S (15 min validation)

---

## Recommended order of fixes

Before `/plan-eng-review` (Codex) fires, fix in this order. Each unblocks the next.

| # | Finding | Effort | Why first |
|---|---|---|---|
| 1 | **C-1** schema (drop `performance_snapshot`, add 3 v0.4 tables) | S | Everything TW-related is wrong until this lands. PRD §6.6 update is also a 5-minute spec coherence fix. |
| 2 | **H-3** brand bucket file count drift (5 vs 6 files) | S | Tiny; lands together with C-1 spec edits. |
| 3 | **L-3 + L-4** README + SAD version pointers | S | One-line edits; ride along with #1–2. |
| 4 | **C-3** state-machine atomicity (claim is now actually atomic) | S | Foundation for everything the worker does. Test for it = also addresses M-6 partially. |
| 5 | **C-2** wire `requireAuth()` and `audit()` middleware | M | Blocks any production deploy or even Tailscale-exposed dev. |
| 6 | **H-1** brand bucket snapshot semantics (cache materialization + snapshot-at-brief-time) | M | Without this, every PRD §6.4 promise about mid-flight edit safety is a lie. |
| 7 | **H-4** vite/systemd port mismatch + static-asset serving | S | Required before Sprint 1.5 deploy. |
| 8 | **H-2** AI disclosure UI gate | M | Falls naturally into ReviewQueue.tsx build pass. Block first ship until done. |
| 9 | **H-6** pino logging | M | Before pipeline implementation lands; correlation IDs save Nick hours later. |
| 10 | **M-2 + M-3** PRD §10.1 signal #3 softening + operator-load math reconciliation | S | Spec edits, no code; do before Codex review reads PRD v0.4 and lands its own findings on top. |
| 11 | **M-4** hosting domain decision tree | S | Same — small spec edit, big downstream impact. |
| 12 | **M-1** wire timeouts when pipeline.ts is implemented | M | Belongs to the pipeline implementation pass, not scaffold review. |
| 13 | **L-** items as tidy-up. | S each | Batch in one cleanup PR. |

**Critical-path estimate:** items 1–9 = roughly 16–22 hours of focused work. Should be doable in 2–3 calendar days before Codex `/plan-eng-review` runs.

---

## Carry-forward for /plan-eng-review

Items I'm **not** challenging in this pass — Codex outside-voice is better suited:

1. **Single-process vs two-process for web + worker (SAD §13.2 #2).** SAD recommends two-process; I haven't pressure-tested it against Bun's native worker thread option. Worth a Codex pass on whether `Bun.spawn` worker as child of web process collapses the deployment story without losing the fault-isolation argument.

2. **WebSocket vs polling for live status pills (SAD §13.2 #1).** SAD recommends polling. With Hono + Bun WS native support landed in 2025, the case for polling is weaker than it was. Worth Codex weighing in.

3. **HeyGen rate-limit reality check (SAD §13.2 #6).** Documented as "first integration spike confirms the real number." Codex could spike the actual TW + HeyGen + Fashn calls in parallel and report back the actual concurrency ceiling, which drives `WORKER_PARALLELISM`.

4. **FFmpeg static binary vs system (SAD §13.2 #7).** SAD picks system. If Sprint 1.5 deploys to a managed PaaS (Fly.io, Railway), system binary management is a pain. Codex could weigh the deploy target tradeoff.

5. **Worker liveness — what happens if worker crashes mid-attempt and the row stays in `hooks_generating` forever?** SAD §7's daily cleanup runs at 02:00 and sweeps `failed_recoverable → failed_terminal` after 24h, but there's no equivalent sweep for "stuck in transit" states (`hooks_generating`, `vendor_pending`, `assembling`). After C-3 fix lands, an attempt could be claim-transitioned to `hooks_generating` and stuck there if the worker dies between claim and `runPipeline()`. Codex should design the recovery sweep — recommend a `started_at < now - max_state_duration` query that resets stuck rows to a recoverable state.

6. **Migration rollback story.** SAD §12.2 says "DB migrations are forward-only — rollback past a destructive migration requires the last backup." Codex might want to challenge whether at least non-destructive migrations should ship a `down.sql`. C-1's schema change is destructive (drops `performance_snapshot`); Sprint 2 reintroduction of the same name with different columns is going to be confusing. Naming convention: kill `performance_snapshot` permanently; new Sprint 2 table is `meta_ad_performance_v2` (or similar).

7. **Fashn off-likeness handling** (SAD §7 + PRD §6.1.4 F-RO-7). Manual operator flag is the Sprint 1 plan. Worth Codex weighing whether Sprint 2's automated similarity threshold belongs to Render Orchestrator or a separate Validation service — the agent-vs-service decomposition lens from §6.1 might apply here too.

8. **Cost-overrun pager.** SAD §11.4 has a weekly cost report. There's no real-time spend ceiling enforcement. If a Fashn regen storm hits at 2am, weekly catches it on Monday — by then the credit card is already $300 in the hole. Codex should design a per-day cost ceiling per vendor with auto-pause when crossed.

9. **Per-attempt vs per-variant cost tracking.** `render_attempt.cost_credits_total` aggregates across the attempt. For variants that hit `failed_recoverable` and are retried, the second attempt creates a new row — fine — but the variant's total cost is `SUM(cost_credits_total) GROUP BY variant_id`. SAD §11.4 doesn't make that explicit and the cost report SQL isn't written. Codex should land the actual `bun run report:cost` query.

10. **Single-writer pattern enforcement.** SAD §9.3 says writes go through `BEGIN IMMEDIATE`, but the scaffold doesn't have a write-helper that wraps every UPDATE/INSERT. Today, anyone can write `db().run('UPDATE ...')` without `.immediate()` and bypass the pattern. Codex should propose either a typed `write()` helper or a code-review checklist item.

---

**End of internal review.** Three Critical findings (schema drift, missing auth wiring, broken claim atomicity) are the must-fix-before-Codex set. Six High findings are the next-tier fix. The PRD itself has internal inconsistencies (§6.6 schema vs §6.1.3 v0.4 rewrite; bucket file count) that the scaffold author followed mechanically rather than challenging — that's the dominant pattern in this review. Spec hygiene before code hygiene.
