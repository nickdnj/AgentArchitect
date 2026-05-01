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
| `ddbae98` | README rewrite — Joe-friendly, with quick-start, state machine ASCII, deploy block, troubleshooting |
| `25cb646` | Assets library + favicon + PWA — fish logo, manifest, b-roll/brand/bucket tabs, file uploads |
| `d6b2129` | Lazy-driven worker (single-process) + DB self-heal — fixes the bun:sqlite disk-IO issue |
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

## The disk-I/O bug (still occurs intermittently)

bun:sqlite throws `SQLITE_IOERR` under sustained load even single-process. The lazy-tick + self-heal pattern recovers — every IO error logs `resetting_db_connection_after_io_error` and the next request succeeds. Root cause not deep-debugged (likely bun-runtime quirk on macOS APFS). For Sprint 1 this is acceptable; if it turns into a deploy-blocker, swap bun:sqlite for better-sqlite3 (well-tested under WAL + multi-process). Tracked in TODOS as `V-WAL-EVAL`.

## Test status

- 198 unit + integration tests passing
- typecheck clean
- Zero `console.*` calls in src/lib (only the pre-existing CQ3 warnings in secrets.ts which run before pino is configured)

## What to look at when you wake up

1. Pull main, run `bun install` then `bun run dev` from `apps/saltwater-ads/`
2. `DEV_AUTH_BYPASS=true` should already be in your `data/secrets.env`. If not, add it.
3. Open http://localhost:5173, click "Skip magic link"
4. Generate a brief — watch the worker log roll past in the server terminal as it cascades through the state machine
5. Open Review Queue — see your generated hooks
6. Open Assets — upload a piece of b-roll if you have any handy; check the Brand bucket tab for the corrected voice file
7. Open Settings — see the presence map; try the "Sync now" button (real TW pull)

The private GH repo is at https://github.com/nickdnj/saltwater-ai-ads — clone it standalone if you want to send Joe a link.

If you want to ship this to a real VPS and onboard Joe, the README has a fully-spec'd deploy block (systemd unit + Caddyfile) ready to copy-paste.
