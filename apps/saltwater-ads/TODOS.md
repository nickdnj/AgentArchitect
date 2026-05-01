# Saltwater AI Ads — Deferred Items

Captured by `/plan-eng-review` (eng-review-2) on 2026-04-30 after the critical-path
fixes (C-1, C-2, C-3, H-1, H-2, H-3, H-4, H-6, A1, T-3, CQ1, CQ2, CQ3, CQ5, CQ6) landed.

Order of operations for the rest: pipeline implementation pass (Lane C in `/plan-eng-review`
parallelization map) will close A2, A3, T-7-followup, and partially A4. The rest are
either pre-ship hardening or Sprint 2+ scope.

---

## A1-followup: Operator-action sweep for `failed_recoverable` → `failed_terminal`

**What:** Background job (cron or worker tick on a slower interval) that finds
`render_attempt` rows in `failed_recoverable` for >24h with no operator retry and
transitions them to `failed_terminal`. PRD §6.5 promises this; the A1 fix only
covers the immediate transition, not the timeout.

**Why:** Without the sweep, failed jobs accumulate forever in `failed_recoverable`
and clutter the Review Queue's "needs attention" count. Joe sees a stale 3-day-old
HeyGen failure and thinks something's still trying.

**Pros:** Closes the state-machine loop. Surfaces dead jobs for Nick to grep.
**Cons:** Adds a new scheduled task surface. Could be implemented as part of the
worker's idle-tick instead of a separate cron — keep the surface tight.
**Context:** A1 fix lives in `src/worker/tick.ts` `markFailed()`. The sweep would
go in `src/worker/sweep.ts` (new) or as an idle branch in `tick.ts`. Trigger is
"on every tick where `claimJobs` returned 0, also run a sweep query."
**Depends on:** Pipeline implementation (so the failed states are real, not theoretical).

---

## A2: FFmpeg subprocess kill discipline

**What:** When `lib/services/assembly.ts` is implemented, `Bun.spawn` must use
`killSignal: 'SIGKILL'` instead of the default SIGTERM. FFmpeg's filter graph
children may not honor SIGTERM during a transcoding loop. Also pipe stderr to
pino so failure modes are visible.

**Why:** A hung FFmpeg subprocess holds a render slot forever and the AbortController
timeout fires but the process keeps eating CPU. Worst-case: 4 hung FFmpegs = saturated
worker.

**Pros:** Bounded resource usage even on FFmpeg pathological input.
**Cons:** SIGKILL means no graceful cleanup of partial output files. Need a
finally-block that rm's the partial file under `media/renders/.../partial/`.
**Context:** SAD §4 deadline section is the right place to document this. Implementation
lands with assembly.ts. See `src/worker/deadlines.ts:11` for the AbortSignal pattern.
**Depends on:** Pipeline implementation (Lane C).

---

## A3: Total-job 15-minute hard ceiling enforcement

**What:** `src/worker/deadlines.ts:8` exports `totalJob: 15 * 60 * 1000` but no
caller composes it. PRD §7.2 promises a 15-minute hard ceiling; without enforcement
a flaky network during sequential HeyGen→Fashn could blow past 30 minutes.

**Why:** Joe's expectation is "submit, wait ~10min, check back." A job stuck for
30 minutes blows past the wait-UX budget and Joe assumes something's broken.

**Pros:** Honest UX. Failure is faster, recoverable.
**Cons:** Aborting at 15min may kill a legitimate 14-minute render. Tradeoff
already accepted by PRD.
**Context:** The pattern is `pipeline.ts` wraps the entire `runPipeline(job)` in
its own `withDeadline(VENDOR_TIMEOUTS_MS.totalJob)` that races against the inner
per-vendor signals. On total-job-deadline timeout, call `markFailed` from A1.
**Depends on:** Pipeline implementation (Lane C).

---

## A4: Bucket cache cleanup sweep

**What:** Weekly job that drops `data/bucket-cache/<sha>.<ext>` files older than
90 days AND not referenced by any non-archived `brand_bucket_version` row.

**Why:** At ~22 briefs/year × 6 files = ~132 cache entries/year. Files are KBs to
a few MB. Unbounded growth, slow. Will matter at year 3 more than year 1.

**Pros:** Stays clean as a long-running deployment.
**Cons:** Risk of dropping an entry that's still referenced — the SQL must check
ALL tables that reference brand_bucket_version_id (currently just hook_set, but
that may grow).
**Context:** Cron job calling `bun run scripts/cleanup-bucket-cache.ts` (new).
Reference detection: `SELECT DISTINCT version_id FROM (...)` then list cache_dir,
diff, rm.
**Depends on:** Sprint 1.5 deployment (no point in cleanup until prod runs >90 days).

---

## A5: Multi-tenant `SHOP_DOMAIN` configurability

**What:** `lib/services/tw-connector.ts:19` hardcodes `'saltwater-longisland.myshopify.com'`.
If this scaffold gets reused for another Shopify brand (the architecture is generic),
that line needs to come from the brand bucket or Settings table.

**Why:** Single-tenant Sprint 1 = correct. Multi-tenant = Sprint 2+ if a second
operator engages.

**Pros:** Reusable architecture without copy-paste fork.
**Cons:** Adds a settings surface; over-engineering until there's a 2nd tenant.
**Context:** Best home is `context-buckets/saltwater-brand/files/products.json` —
add a top-level `"shop_domain": "..."` key. Or a new `brand-config.json` that
holds operator-level settings. tw-connector reads via brand-bucket-manager.

---

## CQ4: Confirm Veronica wedding date with Joe

**What:** `lib/services/validation.ts:23` uses `2026-11-01T00:00:00Z` as the
wife-rule gate. Memory says "Nov 2026" — exact date TBC.

**Why:** Validation rejects "wife" + "Veronica" co-occurrence until the gate.
If actual wedding is Nov 15 and we set Nov 1, hooks unblock too early. If actual
is Nov 1 and we set Nov 15, hooks stay blocked too long.

**Pros:** Calibrated brand rule. Avoids embarrassment either direction.
**Cons:** Nick has to ask Joe directly. 30-second conversation.
**Context:** Update the constant in validation.ts. Add a note in the brand bucket
`voice.md` so future-Nick knows where the date lives.

---

## P1: Stale `bun --hot` worker contention

**What:** If a stale worker process from a previous `bun --hot` run lingers,
multiple workers contend on the SQLite write path. CAS pattern in tick.ts:45
makes claims correct but adds 5s busy-timeout retries to dev.

**Why:** Slows iteration during development. Doesn't affect prod where systemd
ensures one process.

**Pros:** Faster dev experience.
**Cons:** Minor — most devs notice and pkill manually.
**Context:** A `scripts/dev.sh` enhancement that `pkill -f 'bun.*poll-jobs'` before
relaunching, or a lockfile pattern in `data/worker.pid`.

---

## P2: Prepared-statement cache for hot-path queries

**What:** `db().query(SQL).get/all()` re-parses SQL on each call. Bun caches
internally for identical strings, but per-call `query()` allocates parser state.
For tick.ts's 2s poll loop running for hours, a global prepared-statement table
shaves 5-15ms per tick.

**Why:** Free perf. Worker uptime tracks against power consumption on the VPS.

**Pros:** Cleaner query call sites (pre-prepared).
**Cons:** Changes test setup — prepared statements bind to a connection, so the
:memory: connection swap in tests needs care.
**Context:** Pattern: `const CLAIM_SQL = db().prepare(\`UPDATE ... WHERE id=? AND state=?\`)`
at module level. Then `CLAIM_SQL.run([next, id, expected])`. Sites: `tick.ts:45`,
`tick.ts:35`, `audit.ts:13`, `brand-bucket-manager.ts:118`.

---

## P3: TW response caching

**What:** `pullSummary` and `pullJourneys` re-fetch identical period data on
every call. If operator hits "Sync Now" twice in a day, we re-bill TW request
quota and re-process ~same response.

**Why:** Operator courtesy. Free perf at higher journey counts.

**Pros:** Lower TW bill, faster Settings → Sync Now feedback.
**Cons:** Cache invalidation = "nuke on date-range change," easy to get wrong.
**Context:** Cache key = SHA-256 of `{shopDomain, startISO, endISO, todayHour}`.
Store in a `tw_response_cache` table with TTL 6h. Check before fetching.

---

## T-1: Audit middleware DB-write-failure log path

**What:** `src/server/middleware/audit.ts` has a try/catch around the audit_log
INSERT. The catch path calls `log.error` with the failure details, but no test
exercises that path.

**Why:** Defense-in-depth for an already-defensive code path. If audit_log writes
fail in prod (disk full, schema mismatch on a partial migration), Nick needs the
pino line to debug.

**Pros:** ★★★ → ★★★ test quality on audit.ts.
**Cons:** Hard to trigger — requires either a migration mismatch or a mocked DB.
**Context:** Use `mock.module('@db/client.ts', () => ({ db: () => ({ run: () => { throw new Error('disk full'); } }) }))` inside the test.

---

## T-2: errorHandler emits 500 with request_id

**What:** Integration test that registers a route which throws, sends a request
with a known request_id header, asserts the 500 response body includes that ID.

**Why:** request_id correlation is the entire pino debugging story. If the
errorHandler ever drops the field on a refactor, Joe-in-NJ can't paste a clean
ID to Nick-debugging-at-night.

**Pros:** Pins the contract.
**Cons:** ~15 min including Hono setup.
**Context:** New file `test/integration/error-handler.test.ts`. Use
`app.get('/_test/throw', () => { throw new Error('synthetic'); })` registered
on a test-only sub-app, fire request, parse JSON.

---

## T-4: appendWinner / appendLoser path tests

**What:** Test that `appendWinner({...})` actually writes a JSONL line to
`hooks-winners.jsonl` in the bucket dir. Same for loser.

**Why:** When the analytics flow ships ("operator marks variant as winner →
sync to bucket"), this is the on-disk side effect. A test that uses
SALTWATER_BUCKET_DIR to a tmp dir + reads back the file is straightforward.

**Pros:** Pins the on-disk format.
**Cons:** ~15 min.
**Context:** New file `test/integration/bucket-jsonl-append.test.ts`. Use the
same `SALTWATER_BUCKET_DIR` env-override pattern as bucket-snapshot.test.ts.

---

## T-5: Concurrent snapshotBucket from two routes

**What:** Test that two simultaneous `snapshotBucket()` calls produce two
distinct `brand_bucket_version` rows (with possibly identical hashes if the
bucket didn't change between them) without corrupting the cache.

**Why:** Concurrency is implicit in the architecture (operator can trigger two
brief generations from different tabs). The cache writes must not race-corrupt
each other.

**Pros:** Documents and verifies an implicit safety property.
**Cons:** Bun's test runner doesn't directly support concurrent invocation, but
`Promise.all([snapshotBucket(), snapshotBucket()])` works.
**Context:** Add to `bucket-snapshot.test.ts` as a new describe block.

---

## T-6: AiDisclosureGate React component test

**What:** RTL + happy-dom render-and-click test asserting:
1. checkbox unchecked on initial render
2. clicking the checkbox toggles the parent state
3. Approve button is `disabled` + `aria-disabled` while unchecked
4. clicking Approve while disabled does NOT fire a network request

**Why:** Internal eng review v0.4 H-2 explicitly asked for this test. The
api.ts + can-approve.ts + canApprove pure-function tests cover the regression
risk indirectly, but a render test would prove the wiring once-and-for-all.

**Pros:** Closes the H-2 fix completely.
**Cons:** Adds RTL + happy-dom + jsdom transitively to devDeps. Setup overhead.
**Context:** New file `test/unit/ai-disclosure-gate.test.tsx`. Add deps:
`@testing-library/react`, `@testing-library/user-event`, `happy-dom`. Update
`bunfig.toml` test preload to set up DOM.

---

## TODOS hygiene

- This file lives at `apps/saltwater-ads/TODOS.md` — repo-level `TODOS.md` is
  unrelated (Architect framework).
- When implementing an item, remove its section from this file in the same commit.
- New items added by future review passes should follow the same structure:
  What / Why / Pros / Cons / Context / Depends on.
