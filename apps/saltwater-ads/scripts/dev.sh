#!/usr/bin/env bash
# Saltwater AI Ads — dev launcher.
# Runs Hono server + Bun worker + Vite dev server in parallel.
# Ctrl+C kills all three.

set -euo pipefail

cd "$(dirname "$0")/.."

if [[ ! -f data/secrets.env ]]; then
  echo "WARNING: data/secrets.env not found — see README.md §Setup"
fi

if [[ ! -f data/saltwater.db ]]; then
  echo "Initializing DB..."
  bun run db:migrate
fi

trap 'kill 0' EXIT

bun --hot src/server/index.ts &
bun --hot src/worker/poll-jobs.ts &
bun x vite &

wait
