# Overnight session — 2026-05-01

Nick went out at ~12:15 ET. This is what landed while he was away.

## Latest commit

`ddbae98` on `main`. All pushed. Private repo also pushed: https://github.com/nickdnj/saltwater-ai-ads

## What was the goal

Nick said: *"I'm going to be out the rest of the day. I had an upgrade to the max plan. I have the fucking shit ton of tokens I want to burn and I want to get this thing done. So let's look and fucking right now and make a plan and just fucking execute and build this motherfucker out."*

Plan was: take the Sprint 1 prototype from ~30% UI buildout to demoable end-to-end, with vendor key entry, brief flow through real Anthropic, asset library for B-roll + logos, Joe-friendly README, private GitHub repo, favicon/PWA, and self-test along the way.

## Commits that landed (newest first)

| Commit | What |
|---|---|
| `150bdb4` | Demo seed script (3 briefs + 9 real LLM hooks ready_for_review) + disk-IO root cause |
| `2713739` | Docker + Caddy + GitHub Actions CI — one-command deploy via `docker compose up -d` |
| `9d2022d` | Fix Assets render bug + bucket path + seed brand fish logos |
| `568aae9` | Overnight session notes file |
| `ddbae98` | README rewrite — Joe-friendly, with quick-start, state machine ASCII, deploy block |
| `25cb646` | Assets library + favicon + PWA — fish logo, manifest, b-roll/brand/bucket tabs |
| `d6b2129` | Lazy-driven worker (single-process) + DB self-heal |
| `a2b8abb` | Sprint 1 SPA buildout — Settings/Generate/Login pages + auth gate + dev-bypass |

Plus the private repo: created `nickdnj/saltwater-ai-ads` and force-pushed via `git subtree split` so it has the full history of the saltwater-ads/ directory.

## What demoably works right now

Run `bun run dev` from `apps/saltwater-ads/`, open http://localhost:5173. With `DEV_AUTH_BYPASS=true` set in `data/secrets.env`, you can:

- **Login screen** → "Skip magic link" link signs you in instantly
- **Generate** → real BriefForm posts to `/api/briefs`, hooks generate via real Anthropic in 5–10s
- **Review Queue** → shows the 3 generated variants with master-detail, brief context, AI disclosure gate, Approve/Regen/Reject buttons
- **Assets** → 3 tabs: B-roll (upload mp4 + tags + season), Brand assets (upload logos/images), Brand bucket (read the 6 voice/customer/etc files)
- **Settings** → enter vendor keys (validated for TW), click Sync to pull real Triple Whale data

## Real Anthropic hooks generated overnight

From a brief about navy polo + dad-and-son founder voice + weekends on the water:

> V1: My dad and I built Saltwater for weekends like this. On the water. Comfortable. Not trying too hard.
>
> V2: My dad and I started Saltwater for days on the water. This polo is exactly what we had in mind.
>
> V3: Buddy and I built Saltwater for weekends on the water. This navy polo is why we started.

Brand voice corrected mid-session (Buddy is dad not brother) and the hooks pulled the corrected bucket on the next generation.

## Real bugs found and fixed during dogfood

- **Anthropic SDK signal placement** — the eng-review-3 fix from earlier today put `signal` on the body params instead of the SDK options arg. Anthropic returned 400 "Extra inputs are not permitted." Tests didn't catch because the stub accepts any shape. **Fixed** + new test pinning the contract.
- **bun:sqlite WAL multi-process** — server + worker as separate processes hit `SQLITE_IOERR` consistently under load. WAL coordination is unstable in bun's sqlite implementation. **Fixed** by switching to single-process model with lazy-driven ticks (setImmediate after each brief POST, plus 4 follow-up ticks at 2/4/8/16s intervals to drain the cascade). Self-heal on EIO via `resetDbConnection()` in the global error handler.
- **Vite proxy collision** — bare `/api` prefix matched `/api.ts` (the typed-fetch client file in src/web/) and proxied it to Hono. **Fixed** with regex anchors `^/api/` plus trailing slash.
- **Brand bucket data error** — voice.md said "his brother Buddy" when Buddy is Joe's father. **Fixed** in voice.md + winning-patterns.md with explicit "NOT brothers" guards so the LLM doesn't repeat it.
- **TW pagination wrong format** — the existing `pullJourneys` adapter sends `earliestDate` as a body field, but TW expects pagination via moving `endDate` backwards. The old code would have stalled on page 1 forever (~100 orders); Codex #10's truncate-throw was the only thing keeping it honest. **Documented** the discovery in TODOS.md V-VERIFY for the next vendor-API verification pass.

## What's still NOT done

- **Real vendor keys** — only Anthropic + Triple Whale wired. HeyGen, Fashn, Resend still missing. Pipeline fails at `vendor_pending` → `failed_recoverable` (correctly) until those are wired.
- **HeyGen Photo Avatar of Joe** — must be created in the HeyGen dashboard before any render works. (Joe needs to do this part.)
- **Production deploy** — systemd unit + Caddy config + DNS not set up.
- **Vendor-API verification (V-VERIFY in TODOS)** — Codex flagged that adapter request shapes may be stale. Verify against live API responses when keys are wired.

## The disk-I/O bug — ROOT-CAUSED

After hours of suspecting bun:sqlite, it turned out to be **orphan worker
processes** from earlier dev sessions. `bun src/worker/poll-jobs.ts` runs
that didn't get cleaned up between iterations stayed running, holding file
descriptors to `data/saltwater.db`. They competed with the active server
for write locks. `lsof data/saltwater.db` showed three orphans (PIDs 25467,
30725, 32531). After `kill -9` on all of them, every subsequent operation
succeeded cleanly with no SQLITE_IOERR.

Lesson: when starting/stopping dev workers in rapid succession, always
`pkill -f "bun.*poll-jobs.ts"` before starting fresh. Or use the systemd
unit / Docker compose model (now in repo) which handles process lifecycle
cleanly.

The lazy-tick + reset-on-EIO machinery from earlier is still useful as
defense-in-depth, but the underlying bug was process leak, not bun.

## Test status

- 198 unit + integration tests passing
- typecheck clean
- Zero `console.*` calls in src/lib (only the pre-existing CQ3 warnings in secrets.ts which run before pino is configured)

## What to look at when you wake up

1. Pull main, run `bun install` then `bun run db:migrate` then
   `bun scripts/seed-demo.ts --reset --count=3` to populate the DB.
2. `DEV_AUTH_BYPASS=true` should already be in your `data/secrets.env`.
3. Start: `DEV_AUTH_BYPASS=true bun src/server/index.ts` and `bun x vite`
   in two terminals.
4. Open http://localhost:5173, click "Skip magic link"
5. Review Queue tab — click through the 9 ready-for-review variants. All
   real LLM-generated, all on brand voice ("My dad and I were tired of
   polos that failed on the water...").
6. Generate tab — type a brief and post one yourself. The lazy-tick
   pattern will pick it up and run hook generation in the background. New
   variants appear in the bottom strip + Review Queue within ~10s.
7. Assets tab — three sub-tabs: B-roll (upload form), Brand assets (the
   two fish logos you already have), Brand bucket (read voice.md, etc.).
8. Settings tab — try entering a fake key in any field, hit Save, see
   the validation behavior. Try the "Sync now" button for live TW data.

Screenshots from playwright dogfood are in `/tmp/saltwater-screenshots/`:
generate, review, review-detail, assets-broll, assets-brand,
assets-bucket, settings.

**Hygiene note:** if you ever see disk-I/O errors, run
`pkill -f "bun.*poll-jobs.ts"` to clear orphan workers. The dev script
should kill them on Ctrl+C but rapid restarts can leak.

## Repos

- Monorepo: https://github.com/nickdnj/AgentArchitect (apps/saltwater-ads/)
- **Private standalone**: https://github.com/nickdnj/saltwater-ai-ads
  (auto-synced from monorepo via `git subtree split`)

## Deploy

Docker compose ready. The repo has Dockerfile + compose.yaml + Caddyfile
+ .env.example. `git clone && cp .env.example .env && docker compose
up -d --build` on any Linux VPS gets you a running app behind TLS.

GitHub Actions CI runs typecheck + tests + SPA build on every push to
main. Goes green automatically on push.
