# Saltwater AI Ads — Sprint 1

Brand-locked AI ad generator for Saltwater Clothing Co. Single-tenant web app. Joe DeMarco is the operator; Nick DeMarco is the builder + 5–10 hr/month maintainer through month 6.

## Specs (locked)

- **PRD:** `../../docs/saltwater-ads/PRD.md` (v0.4)
- **SAD:** `../../docs/saltwater-ads/SAD.md` (architecture)
- **UXD:** `../../docs/saltwater-ads/UXD.md` (UX spec)
- **Reviews:** `../../docs/saltwater-ads/reviews/`
- **Prototype reference:** `../../docs/saltwater-ads/prototype/index.html` → https://saltwater-ads-mockup.web.app

## Stack

- **Runtime:** Bun (server + worker + bun:sqlite)
- **HTTP:** Hono (web server)
- **Frontend:** Vite + React (SPA, magic-link auth)
- **DB:** SQLite at `data/saltwater.db` (WAL mode, single-writer pattern)
- **LLM:** Claude Sonnet 4.6 via `lib/llm/anthropic.ts` (repo-owned provider)
- **Media:** FFmpeg (system binary), media in `media/renders/YYYY-MM-DD/<variant_id>/`
- **Email:** Resend (magic-link auth + on-call paging)

## Architecture summary

Two Bun processes:

1. **Web server** (`src/server/index.ts`) — Hono routes, magic-link auth, signed media URLs, SQLite reads + transactional writes.
2. **Worker** (`src/worker/poll-jobs.ts`) — polls SQLite every 2s for queued render attempts; runs Hook Generator → HeyGen + Fashn parallel → FFmpeg assembly through the state machine (PRD §6.5).

One SQLite database. One `media/` volume. No broker, no queue service. Single VPS deployment target (NOT serverless — FFmpeg + persistent disk required).

## Components — 1 agent + 5 services

Per PRD §6.1:

- **Hook Generator** (the only LLM agent) → `lib/services/hook-generator.ts` + `lib/llm/anthropic.ts` + `lib/llm/prompts/`
- **Brand Bucket Manager** → `lib/services/brand-bucket-manager.ts`
- **Triple Whale Connector** → `lib/services/tw-connector.ts`
- **Render Orchestrator** → `lib/services/render-orchestrator.ts`
- **Assembly** → `lib/services/assembly.ts`
- **Meta Pusher** → DEFERRED to Sprint 2

## Setup (development)

```bash
# 1. Install deps
bun install

# 2. Initialize DB
bun run db:migrate

# 3. Configure secrets — see lib/services/secrets.ts for the required keys
cat > data/secrets.env <<'EOF'
ANTHROPIC_API_KEY=sk-ant-...
HEYGEN_API_KEY=...
FASHN_API_KEY=...
TRIPLEWHALE_API_KEY=...
RESEND_API_KEY=re_...
SESSION_SECRET=<32+ random bytes — openssl rand -base64 32>
SIGNING_KEY=<32+ random bytes — openssl rand -base64 32>
ALLOWED_OPERATORS=joe@saltwaterclothingco.com,nickd@demarconet.com
EOF
chmod 600 data/secrets.env

# 4. Start dev (web + worker + Vite together)
bun run dev
# OR each in its own terminal
bun run dev:server  # http://localhost:3001
bun run dev:worker
bun run dev:web     # http://localhost:5173 (proxied to :3001 for /api, /auth, /media)
```

## Brand bucket location

The Hook Generator reads from `../../context-buckets/saltwater-brand/files/`:
- `voice.md` — Voice IS / IS NOT, vocab IN / OUT, anti-patterns
- `customer.md` — "Older Joe DeMarco" archetype
- `winning-patterns.md` — Founder Story / Problem-Solution / Limited Drop
- `products.json` — SKU catalog
- `hooks-winners.jsonl` — append-only winner log
- `hooks-losers.jsonl` — append-only loser log

Bucket is snapshotted (SHA-256) per generation. Mid-flight edits don't affect running jobs.

## Testing

```bash
bun test                  # all unit tests
bun test:integration      # full pipeline with mocked vendors + real ffmpeg
bun typecheck             # tsc --noEmit
```

## Deployment

Sprint 1: local + Tailscale.
Sprint 1.5: TBD per PRD §12 Q6 — single VPS / Fly.io / Railway.

## Status

**Sprint 1 scaffolding** — directory structure + key entrypoints + locked schema. Implementation in flight.
