# Saltwater AI Ads — production container.
#
# Multi-stage build:
#   1. base — bun + ffmpeg + system fonts (DejaVu, used by drawtext caption)
#   2. deps — bun install (cached separately from app code)
#   3. build — bun build:web (dist/web/ for the SPA)
#   4. runtime — copy minimal artifacts + run as non-root
#
# Final image: ~250 MB. Single process (web + inline worker per index.ts).
# Mount /app/data + /app/media as a persistent volume.

# ---- 1. base ----
FROM oven/bun:1.3.8 AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
       ffmpeg \
       fonts-dejavu-core \
       ca-certificates \
       sqlite3 \
       tini \
  && rm -rf /var/lib/apt/lists/*

# ---- 2. deps ----
FROM base AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ---- 3. build (SPA bundle) ----
FROM deps AS build
COPY src/ src/
COPY lib/ lib/
COPY db/ db/
COPY assets/ assets/
COPY tsconfig.json vite.config.ts bunfig.toml ./
RUN bun run build:web

# ---- 4. runtime ----
FROM base AS runtime
WORKDIR /app

# Non-root user for the app. UID 1001 matches Bun's default `bun` user but
# we make our own to keep ownership predictable on the mounted volume.
RUN groupadd -r saltwater && useradd -r -g saltwater -u 1001 -m saltwater

# Copy node_modules, built SPA, app source, db migrations.
COPY --from=deps  --chown=saltwater:saltwater /app/node_modules ./node_modules
COPY --from=build --chown=saltwater:saltwater /app/dist ./dist
COPY --chown=saltwater:saltwater src/ src/
COPY --chown=saltwater:saltwater lib/ lib/
COPY --chown=saltwater:saltwater db/ db/
COPY --chown=saltwater:saltwater assets/ assets/
COPY --chown=saltwater:saltwater scripts/ scripts/
COPY --chown=saltwater:saltwater package.json bun.lock tsconfig.json bunfig.toml ./

# Persistent data + media live on a host-mounted volume.
RUN mkdir -p /app/data /app/media \
  && chown -R saltwater:saltwater /app/data /app/media

USER saltwater

ENV NODE_ENV=production \
    PROC_NAME=web \
    PORT=3001 \
    HOST=0.0.0.0 \
    # Inline worker stays disabled in container — we run a separate worker
    # service via docker-compose. See compose.yaml.
    INLINE_WORKER=false \
    # FFmpeg caption font — bundled DejaVu satisfies our cross-platform lookup.
    CAPTION_FONT_PATH=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf

EXPOSE 3001

# tini is PID 1 so SIGTERM flows to bun cleanly + reaps zombies.
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["bun", "run", "start:server"]

# Health check probes /healthz/ready every 30s. Three failures → unhealthy.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:3001/healthz/ready || exit 1
