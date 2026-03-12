# VistterStream: Streaming Fixes, GPU Encoding & Hardware Migration

**Date:** 2026-03-12
**Session type:** execution
**Agents involved:** Direct development (no orchestrator), Voice mode

## Summary

Fixed multiple VistterStream issues: SQLAlchemy connection pool exhaustion, camera connectivity, stale YouTube broadcasts, and overlay editor toggle. Enabled Intel VA-API GPU hardware encoding and verified it in production. Updated the README to replace Raspberry Pi 5 with the Beelink Mini S12 (Intel N95) as the reference hardware platform, including cost comparison and "Why not Raspberry Pi?" explainer.

## Key Findings

- **Connection pool exhaustion:** Default QueuePool (5+10) was too small for 5+ concurrent background services (scheduler, watchdog, reelforge, RTMP relay). All connections leaked under load causing backend unresponsiveness.
- **Camera WiFi isolation:** Reolink camera on WiFi couldn't be reached from wired mini PC due to WiFi/wired isolation on UniFi network. Reolink app worked because it uses P2P cloud (UID) connectivity. Switching camera to ethernet fixed it but IP changed from 192.168.12.19 to 192.168.12.37.
- **Stale broadcast reuse:** Code checked for existing `youtube_broadcast_id` and reused it, but old broadcasts in "complete" status can't receive new streams. Stream appeared to start but YouTube showed an old recording.
- **Overlay aspect ratio fix verified:** The frontend aspect ratio lock from the previous session is working correctly on YouTube. Both overlays render properly.
- **Transient network errors:** YouTube API broadcast creation occasionally fails with "[Errno 101] Network is unreachable" even though container has connectivity. Retry works.
- **Intel GPU VA-API encoding:** Mini PC has Intel GPU at `/dev/dri/renderD128`. Required Docker device passthrough, render group (993), libva runtime libraries in Docker image, and FFmpeg filter chain: CPU overlay compositing → `format=nv12,hwupload` → `h264_vaapi` encoding. Verified working inside container with test encode.

## Decisions Made

- Increased SQLAlchemy pool to 20 connections with 30 overflow, 5-minute recycle, pre-ping enabled
- Added pool checkout monitoring that warns when >10 connections checked out
- Always create fresh YouTube broadcast per stream start (never reuse)
- Disable DVR mode by default for live-only streams
- Clear broadcast IDs on stream stop so next start gets fresh broadcast
- Use full Monmouth Beach Live Cam title and description for auto-created broadcasts
- Added toggle button in YouTube links bar to switch between embed and overlay editor while streaming
- Enabled Intel VA-API hardware encoding — Docker GPU passthrough, libva libraries, FFmpeg VAAPI encoder support with CPU→GPU upload chain
- Migrated reference hardware from Raspberry Pi 5 to Beelink Mini S12 (Intel N95) in README — comparable cost (~$130-170 vs Pi 5 fully equipped at $185-235) with significantly better performance and hardware video encoding

## Artifacts Created

- `backend/models/database.py` — Pool size increase + monitoring (commits 76fbe44, 912f3c3)
- `backend/routers/timeline_execution.py` — Fresh broadcasts, DVR off, metadata, stop cleanup (commits 1aa5778, f2b6ad2)
- `frontend/src/components/TimelineEditor.tsx` — YouTube/Editor toggle button (commit 93b2765)
- `docs/youtube-stream-metadata.md` — Saved YouTube stream title/description for reference
- Sunba PTZ camera re-added via API (ID 11, address 192.168.86.250, ONVIF port 8899)
- Mini PC hostname fixed: visttertream -> vistterstream
- `backend/services/ffmpeg_manager.py` — Added h264_vaapi and h264_qsv encoder cases with VAAPI pixel format upload (commit 5e978ff)
- `docker/docker-compose.rpi.yml` — GPU device passthrough `/dev/dri:/dev/dri` and render group 993 (commit 5e978ff)
- `backend/Dockerfile` — Added libva-drm2, libva2, intel-media-va-driver for VA-API runtime (commit 7caece8)
- `README.md` — Replaced Raspberry Pi with Beelink Mini S12 as reference hardware, updated status to March 2026, added Claude Code to acknowledgments (commit a40df68)

## Open Items

- [ ] Set DHCP reservation for Reolink camera (192.168.12.37) in UniFi controller
- [ ] Recapture Sunba PTZ presets when mini PC is on the other network
- [ ] Update Sunba camera IP address after discovering it on the new network
- [ ] Investigate transient "[Errno 101] Network is unreachable" on YouTube API calls
- [ ] Consider publishing Google OAuth app (still in testing mode)
- [ ] Preview container showing "unhealthy" (up 28h) — may need investigation
- [x] ~~Verify VA-API hardware encoding in production~~ — confirmed `h264_vaapi on intel` active, 183% CPU (overlay compositing is CPU-bound, encoding on GPU)
- [ ] Stress test multi-camera + multi-platform streaming (5 concurrent VAAPI streams supported)

## Context for Next Session

VistterStream is fully deployed and streaming to YouTube with correct overlays and GPU-accelerated encoding. VA-API hardware encoding confirmed working in production — hardware detector selects `h264_vaapi on intel` with support for 5 concurrent streams. CPU at ~183% is expected since overlay compositing (scale + blend) remains CPU-bound; only H.264 encoding is GPU-offloaded. Multi-platform streaming (YouTube + Facebook + Twitch simultaneously) is now feasible. README updated to reflect the Beelink Mini S12 as the reference platform with full cost comparison. The mini PC is at 192.168.12.136 (Tailscale: 100.108.181.24). All 8 commits pushed (7 code + 1 README). Next priorities: set DHCP reservations, stress test multi-camera/multi-platform when Sunba PTZ is available, recapture Sunba presets on the other network.
