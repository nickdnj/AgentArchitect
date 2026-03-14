# VistterStream Overlay Refresh & Editor Fixes

**Date:** 2026-03-14
**Session type:** execution
**Agents involved:** Direct implementation (no team orchestrator)

## Summary

Reviewed overnight stream logs (303 loops, ~10+ hours continuous), implemented overlay image refresh at timeline loop boundaries so weather data stays current, and fixed the overlay editor to properly display API images via backend proxy with correct auto-sizing.

## Key Findings

- Stream ran overnight without crashes — 303 loops, watchdog confirmed healthy
- H.264 decode errors persist at 1080p, correlate with PTZ camera movements and unstable network
- Memory grew from ~315MB to 527MB over 300+ loops — possible slow leak
- CPU stable at 235-390% (59-97% of 4 cores) depending on overlay compositing phase
- Overlay images were downloaded once at stream start and never refreshed — `api_refresh_interval` field exists in DB but was never implemented
- FFmpeg `-loop 1` caches images in memory; overwriting temp files has no effect
- Overlay editor was using raw HTTP api_url for images, blocked by HTTPS mixed-content via Cloudflare tunnel
- API image assets had no width/height in DB, falling back to 200px default — nearly invisible in editor
- Network I/O: 10.7GB in / 18.1GB out overnight

## Decisions Made

- Refresh overlays at loop boundary (every 2 minutes) — simplest and most robust approach
- Re-download all API images, stop FFmpeg, let next segment restart with fresh overlays
- Route all API image URLs through backend proxy (`/api/assets/{id}/proxy`) for HTTPS compatibility
- Auto-size overlay images to natural dimensions (capped to stream resolution) on first load

## Artifacts Created

- VistterStream commit ee2a09a: Add overlay image refresh at timeline loop boundary
- VistterStream commit b3f2c79: Fix overlay editor mixed-content (use backend proxy)
- VistterStream commit 19a4a6d: Fix overlay auto-sizing to use natural image dimensions
- All three deployed to production server

## Open Items

- [ ] Memory growth over 300+ loops (315MB to 527MB) — monitor for leak
- [ ] H.264 decode errors at 1080p during PTZ moves — likely network related
- [ ] Network still unstable — can't judge stream quality yet
- [ ] User mentioned minor additional fixes needed (deferred to next session)

## Context for Next Session

Overlay refresh is working in production — all 5 weather overlays re-download every 2 minutes at the loop boundary. The overlay editor now renders full-size weather graphics via the backend proxy. The stream has been running continuously with these changes. The user mentioned having more minor fixes to do in a follow-up session.
