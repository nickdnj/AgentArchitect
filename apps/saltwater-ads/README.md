# Saltwater AI Ads

**A brand-locked AI ad generator for Saltwater Clothing Co.**

Joe types a one-line brief ("spring drop teaser, navy polo, weekends on the water") and the system produces three Meta-ready 9:16 video ads — narrated by an AI Joe avatar (HeyGen), with a try-on showcase clip (Fashn), real Saltwater b-roll layered in, and disclosure metadata baked into the master MP4. Joe reviews three variants, checks the AI-disclosure box, clicks Approve, and gets a downloadable file ready to upload to Meta Ads Manager.

Single-tenant. Single-operator (Joe). Built by Nick.

---

## Quick start (for Joe)

You don't run this app — Nick does. But once it's deployed and you have your sign-in link, here's the flow:

1. **Sign in.** Open the app URL, type your email (joe@saltwaterlongisland.com), click "Send sign-in link", check your inbox, click the link. You're in for 30 days.
2. **Generate an ad.** Generate tab → type a brief → pick a pattern (Founder Story / Problem-Solution / Limited Drop) → pick a SKU → click Generate. Comes back in ~5–10 minutes.
3. **Review.** Review Queue tab → click a variant → check the "AI-generated content" disclosure box → Approve → download the MP4 → upload to Meta.
4. **Settings.** Update API keys here when something rotates. Click "Sync now" to refresh Triple Whale data.
5. **Assets.** B-roll videos and brand logos live here. Upload your coastal footage with tags like "beach, sunset, summer" so the system picks the right clip for the right brief.

That's the whole app. Three screens you'll use, one screen for keys.

---

## What this is

The system has **one AI agent** and **five deterministic services** (per PRD §6.1):

| Component | What it does | Where to look |
|---|---|---|
| **Hook Generator** (the LLM) | Takes your brief + the brand bucket → returns 3 hook variants | `lib/services/hook-generator.ts` |
| **Brand Bucket Manager** | Reads your brand voice/customer/products files; snapshots them per generation so mid-flight edits don't leak into running jobs | `lib/services/brand-bucket-manager.ts` |
| **Triple Whale Connector** | Pulls last-30-day attributed orders, computes per-ad revenue rollup | `lib/services/tw-connector.ts` |
| **Render Orchestrator** | Calls HeyGen + Fashn in parallel with per-vendor timeouts | `lib/services/render-orchestrator.ts` |
| **Assembly** | FFmpeg concat + caption burn + loudnorm + AI disclosure metadata | `lib/services/assembly.ts` |
| **Meta Pusher** *(Sprint 2)* | Push approved ad as a draft to Meta Ads Manager | not built yet |

The Hook Generator is the only LLM call. Everything else is plain code with tests.

---

## Stack

- **Runtime:** [Bun](https://bun.sh) (single-process server + inline worker)
- **HTTP:** [Hono](https://hono.dev)
- **Frontend:** Vite + React 18 (SPA, magic-link auth, PWA)
- **DB:** [bun:sqlite](https://bun.sh/docs/api/sqlite) at `data/saltwater.db`
- **LLM:** Claude Sonnet 4.6 via Anthropic SDK (`@anthropic-ai/sdk`)
- **Media:** [FFmpeg](https://ffmpeg.org) (system binary)
- **Email:** [Resend](https://resend.com) for magic-link sign-in
- **Vendors:** HeyGen Photo Avatar v2, Fashn.ai try-on + animate

Specs:
- **PRD:** `../../docs/saltwater-ads/PRD.md`
- **SAD:** `../../docs/saltwater-ads/SAD.md`
- **UXD:** `../../docs/saltwater-ads/UXD.md`

---

## Setup (for Nick or anyone deploying)

### Prerequisites

- macOS or Linux (deploy target = Linux VPS)
- Bun ≥ 1.3 (`curl -fsSL https://bun.sh/install | bash`)
- FFmpeg (`brew install ffmpeg` / `apt install ffmpeg`)
- Vendor accounts + API keys:
  - **Anthropic** (`sk-ant-...`) — required, $20/mo at expected volume
  - **HeyGen** (Team plan, $89/mo) — needs Joe's Photo Avatar created in their dashboard first
  - **Fashn.ai** (Pro, $99/mo)
  - **Triple Whale** (Joe's existing key) — $379/mo Premium, switch to Annual ($232/mo) before renewal
  - **Resend** (free tier, 3000 emails/mo) — for magic-link delivery

### Install

```bash
git clone <repo-url>
cd saltwater-ads
bun install
```

### Configure secrets

```bash
# Generate session/signing keys
SESSION_SECRET=$(openssl rand -hex 32)
SIGNING_KEY=$(openssl rand -hex 32)

cat > data/secrets.env <<EOF
ANTHROPIC_API_KEY=sk-ant-...
HEYGEN_API_KEY=...
HEYGEN_AVATAR_ID=<Joe's photo avatar id from HeyGen dashboard>
HEYGEN_VOICE_ID=<Joe's voice id, optional>
FASHN_API_KEY=...
FASHN_ARCHETYPE_REF_URL=https://saltwater-ads.example.com/archetype.jpg
TRIPLEWHALE_API_KEY=...
RESEND_API_KEY=re_...
MAGIC_LINK_FROM=Saltwater Ads <noreply@saltwater-ads.example.com>
NICK_PAGE_TO=nickd@demarconet.com
SESSION_SECRET=$SESSION_SECRET
SIGNING_KEY=$SIGNING_KEY
ALLOWED_OPERATORS=joe@saltwaterlongisland.com,nickd@demarconet.com
PORT=3001
PUBLIC_BASE_URL=https://saltwater-ads.example.com
EOF
chmod 600 data/secrets.env
```

You can also set most of these via the **Settings** tab in the running app once you've signed in once.

### Initialize the DB

```bash
bun run db:migrate
```

### Run dev

```bash
# Server + Vite together (recommended)
bun run dev

# Or split:
bun run dev:server   # http://localhost:3001
bun run dev:web      # http://localhost:5173 (proxies /api → :3001)
```

Then open http://localhost:5173, sign in via the magic-link form (or use the dev-bypass link below the form if `DEV_AUTH_BYPASS=true`).

### Run tests

```bash
bun test                # all 198 tests
bun test:integration    # integration only
bun run typecheck       # tsc --noEmit
```

---

## How a brief becomes an ad (the state machine)

```
queued
  ↓ tick claims, lock CAS
hooks_generating         ← only ONE attempt per hook_set runs the LLM
  ↓ Anthropic returns 3×3 hooks, validation passes
hooks_ready              ← all 3 sub-variants populated with hook_text
  ↓ tick claims
vendor_pending           ← HeyGen + Fashn in parallel
  ↓ both return (or one fails → partial, both fail → failed_recoverable)
partial
  ↓ tick claims
assembling               ← FFmpeg concat + drawtext + loudnorm + metadata
  ↓
ready_for_review         ← Joe sees it in the Review Queue
  ↓ approve
approved → download URL signed (24h TTL)
```

State changes happen inside `BEGIN IMMEDIATE` transactions with compare-and-swap so two workers never claim the same row.

A single brief produces 3 variants (V1/V2/V3 of one main pattern angle) per Sprint 1. The LLM actually returns 9 hooks (3 main × 3 sub) but Sprint 1 surfaces only 3. Sprint 2 may surface all 9 — TBD on Joe's feedback.

---

## Brand bucket — the source of truth

Hook generation reads from `../../context-buckets/saltwater-brand/files/`:

| File | What's in it |
|---|---|
| `voice.md` | Voice IS / IS NOT, vocab IN / OUT, anti-patterns, founder details (Joe + dad Buddy, NOT brother) |
| `customer.md` | "Older Joe DeMarco" customer archetype |
| `winning-patterns.md` | Founder Story / Problem-Solution / Limited Drop templates |
| `products.json` | SKU catalog (id, name, image) |
| `hooks-winners.jsonl` | Append-only log of past winning hooks |
| `hooks-losers.jsonl` | Append-only log of past losers |

The bucket is **snapshotted** (SHA-256 per file) at brief-create time. Even if Joe edits the bucket while a brief is mid-render, the running job uses the frozen content. Each brief carries a `brand_bucket_version_id` so the audit trail shows exactly which bucket version produced the ad.

---

## Deployment (Sprint 1.5 — Docker on a single VPS)

Per SAD §12.1, but containerized:

- **Host:** any Linux VPS, 2 vCPU / 4 GB RAM, 40 GB disk (Hetzner CX22, Linode shared 4 GB, etc.)
- **Stack:** docker compose with three services
  - `web` — Hono app (port 3001, internal)
  - `worker` — separate worker process polling the same DB
  - `caddy` — reverse proxy + auto-HTTPS + rate limit on `/auth/magic`
- **Volumes:** `saltwater-data` (DB), `saltwater-media` (renders + b-roll)
- **DNS:** point your subdomain at the VPS, Caddy handles TLS.

### One-time setup on the VPS

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Clone + configure
git clone https://github.com/nickdnj/saltwater-ai-ads.git /srv/saltwater
cd /srv/saltwater
cp .env.example .env
# Edit .env to fill in vendor keys + secrets

# Build + start
docker compose up -d --build

# Verify
docker compose ps
docker compose logs -f web
```

### Subsequent deploys

```bash
git pull
docker compose up -d --build
```

The Caddyfile, Dockerfile, and compose.yaml are all in this repo. The
SAD §12.1 systemd-unit alternative is still valid for non-Docker hosts;
see git history for that variant.

Backups: `docker compose exec web bun run db:backup` runs on demand. Wire
to a cron job on the host that mounts the volume + uploads to S3/rclone
for offsite.

### CI

GitHub Actions runs typecheck + tests + SPA build on every push to `main`. See `.github/workflows/ci.yml`.

---

## Operations

| Task | Command |
|---|---|
| Tail logs | `journalctl -u saltwater-ads -f` |
| Restart server | `systemctl restart saltwater-ads` |
| Run TW sync manually | Settings → "Sync now" button (or POST `/api/settings/tw-sync`) |
| See pending failures | Review Queue, status pill = `failed_recoverable` |
| Inspect DB | `sqlite3 data/saltwater.db` |
| Backup now | `bun run db:backup` |
| Update a vendor key | Settings tab → enter new value → Save (validates against vendor where possible) |

---

## Troubleshooting

**"Variants endpoint not implemented yet (501)" in Review Queue**
Old build. Pull latest, restart.

**Hook generation fails with "401 invalid x-api-key"**
Anthropic key wrong or rotated. Settings → re-enter ANTHROPIC_API_KEY.

**Brief POST returns 500 "internal_error"**
Most often: `data/secrets.env` missing or unreadable. Check `journalctl` for the full error, look for `disk I/O error` (DB self-heals; next request usually works) or `missing required secret: X`.

**Pipeline stuck at "vendor_pending" forever**
HeyGen or Fashn key invalid, or the vendor is down. Worker logs the actual vendor 4xx. Either fix the key (Settings) or wait. The 15-min totalJob ceiling auto-fails wedged jobs to `failed_recoverable` — Joe will see them in the queue with a red pill.

**Joe sees "Buddy and I started Saltwater" in a hook**
Buddy is Joe's DAD, not his brother. The brand bucket has the correct relationship documented but the LLM occasionally references Buddy by name. If hooks come out wrong, edit `voice.md` to reinforce the rule and re-generate.

---

## Project status

**Sprint 1 — feature-complete scaffold.** All four implementation lanes (B+D+A+C) landed:
- Brief → hook generation (with prompt caching)
- Triple Whale journey sync + per-ad rollup
- Magic-link auth + dev bypass
- Pipeline state machine (HeyGen + Fashn + FFmpeg)

198 tests pass, typecheck clean. Two engineering reviews + one Codex outside-voice pass have shipped, all critical findings closed.

**Pending before public Joe-launch:**
- Vendor-API verification against live HeyGen / Fashn / Resend responses (TODO V-VERIFY)
- HeyGen Photo Avatar of Joe created in their dashboard
- Production deploy on a VPS
- README walkthrough with Joe to confirm the workflow makes sense

See `apps/saltwater-ads/TODOS.md` for the full deferred-items list.

---

## Contact

- **Builder + maintainer:** Nick DeMarco — nickd@demarconet.com
- **Operator:** Joe DeMarco — joe@saltwaterlongisland.com
- **Issues:** GitHub issues on this repo (private — Joe + Nick only)
