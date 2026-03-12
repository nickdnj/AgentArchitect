# VistterStream: Streaming Fixes & YouTube Toggle

**Date:** 2026-03-12
**Session type:** execution
**Agents involved:** Direct development (no orchestrator), Voice mode

## Summary

Fixed multiple VistterStream issues: SQLAlchemy connection pool exhaustion crashing the backend, camera unreachable after WiFi-to-ethernet switch, stale YouTube broadcast reuse preventing live streams, and added a YouTube embed / overlay editor toggle button. Also added proper stream metadata, re-added the Sunba PTZ camera, fixed the mini PC hostname typo, and enabled Intel GPU hardware encoding (VA-API) to replace software libx264.

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

## Open Items

- [ ] Set DHCP reservation for Reolink camera (192.168.12.37) in UniFi controller
- [ ] Recapture Sunba PTZ presets when mini PC is on the other network
- [ ] Update Sunba camera IP address after discovering it on the new network
- [ ] Investigate transient "[Errno 101] Network is unreachable" on YouTube API calls
- [ ] Consider publishing Google OAuth app (still in testing mode)
- [ ] Preview container showing "unhealthy" (up 28h) — may need investigation
- [ ] Verify VA-API hardware encoding in production — start a stream and check logs for `h264_vaapi` instead of `libx264`, monitor CPU usage drop

## Context for Next Session

VistterStream is fully deployed and streaming to YouTube with correct overlays. The mini PC is at 192.168.12.136 (Tailscale: 100.108.181.24). Intel VA-API hardware encoding has been added to the Docker image and FFmpeg manager — the container was rebuilt and VAAPI encoding verified inside the container with a test encode, but needs a production stream test to confirm the hardware detector picks up `h264_vaapi` over `libx264` and CPU usage drops. The YouTube embed toggle is working. Stream metadata auto-populates from hardcoded values in timeline_execution.py. All 7 commits pushed and deployed. Next priorities: verify GPU encoding in production, set DHCP reservations, recapture Sunba PTZ presets on the other network.
