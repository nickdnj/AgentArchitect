# VistterStream Stream Optimization & Troubleshooting

**Date:** 2026-03-13
**Session type:** execution
**Agents involved:** Voice mode, direct SSH/CLI work

## Summary

Diagnosed and fixed multiple streaming issues on VistterStream's production YouTube live stream. Stripped camera audio from RTMP relay, changed camera from 4K to 1080p via ONVIF API, and reduced output bitrate from 4500k to 2500k. Discovered site network is in transition with only ~130 kbps upload available (needs 2500+ kbps).

## Key Findings

- Camera was streaming at 4K (4096x2160) at 10fps, causing massive H.264 decode errors (13K-29K corrupted macroblocks per frame)
- RTMP relay was re-encoding camera audio to AAC, causing non-monotonous DTS timestamp warnings — but this audio was never used (FFmpeg manager generates silent `anullsrc` audio)
- YouTube `enableAutoStop: True` means any stream interruption (e.g. deploy restart) ends the broadcast; FFmpeg then sends to a dead broadcast that YouTube ignores
- Site upload bandwidth only ~130 kbps during network transition — fundamental bottleneck preventing stream from reaching YouTube
- Camera supports 1080p via ONVIF `SetVideoEncoderConfiguration`, max framerate 16fps
- 1080p stream eliminates all H.264 decode errors; memory drops from 503MB to 185MB, CPU from 183% to ~60%

## Decisions Made

- Strip audio from RTMP relay (`-an`) since downstream FFmpeg manager already generates silent audio
- Change camera main stream to 1920x1080@15fps via ONVIF (was 4096x2160@10fps)
- Reduce output bitrate from 4500k to 2500k and framerate from 30 to 15fps
- Keep `enableAutoStop: True` for now but noted as future improvement

## Artifacts Created

- Commit `a91f6db`: Strip audio from RTMP relay (`rtmp_relay_service.py`)
- Commit `07bf7b0`: Reduce bitrate to 2500k, framerate to 15fps (`ffmpeg_manager.py`)
- Both deployed to production server via SSH + docker compose rebuild
- Camera ONVIF settings changed in-place (persistent, survives camera reboot)
- Updated memory file: `vistterstream.md`

## Open Items

- [ ] Verify stream works once site network stabilizes (currently ~130 kbps upload)
- [ ] Consider disabling `enableAutoStop` on YouTube broadcasts to survive deploy interruptions
- [ ] Fix CI: SQLAlchemy pool args (`max_overflow`, `pool_timeout`) fail with SQLite
- [ ] Recapture Sunba PTZ presets at 1080p resolution

## Context for Next Session

Three changes were deployed: audio stripping, 1080p camera, and lower bitrate. All are working correctly per server logs — zero H.264 errors, clean audio, reduced resource usage. The only blocker is the site's WAN upload bandwidth (~130 kbps vs 2500+ kbps needed). Nick said the network is "in transition" and will sort it out. Once bandwidth is available, the stream should come up cleanly. To verify: start the timeline, wait 30s, check YouTube broadcast lifecycle status via API — should show "live".
