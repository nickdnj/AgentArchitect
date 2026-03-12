# VistterStream: Overlay Distortion Fix

**Date:** 2026-03-12
**Session type:** execution
**Agents involved:** Direct development (no orchestrator)

## Summary

Diagnosed and partially fixed an overlay distortion issue in the VistterStream FFmpeg streaming pipeline. The second overlay ("Weather & Tides - Atlantic Ocean") appeared stretched/distorted on YouTube while the first overlay ("Shrewsbury River") looked correct. Root cause: frontend uses CSS `object-contain` (preserves aspect ratio) while FFmpeg `scale=w:h` stretches to exact dimensions.

## Key Findings

- Both overlay source images are identical dimensions: 1168x237 (ratio 4.928)
- Overlay 1 bounding box: 1839x385 (ratio 4.78) — close to source, so stretching was barely visible
- Overlay 2 bounding box: 1876x656 (ratio 2.86) — way off, causing obvious vertical stretching
- FFmpeg 5.1.8 on Pi: `force_original_aspect_ratio=decrease` flag did NOT take effect
- Solution: compute object-contain dimensions in Python (PIL) before passing to FFmpeg
- Debug log confirmed fix working: overlay 2 went from scale=1250:437 to scale=1166:236 (correct ratio)
- Running FFmpeg process confirmed using correct filter with new dimensions

## Decisions Made

- Compute aspect-ratio-preserving dimensions in Python (`_prefetch_all_overlays`) rather than relying on FFmpeg flags
- Center the overlay within the bounding box (matching frontend `object-contain` centering)
- Reverted `force_original_aspect_ratio=decrease` from FFmpeg since Python handles it

## Artifacts Created

- `backend/services/timeline_executor.py` — Added PIL-based object-contain dimension computation in `_prefetch_all_overlays`
- `backend/services/ffmpeg_manager.py` — Reverted force_original_aspect_ratio flag
- Commit `1d3ae94` — force_original_aspect_ratio attempt (deployed but ineffective)
- Commit `bab44a0` — Python-based object-contain computation (deployed and confirmed in logs)

## Open Items

- [ ] User still reports second overlay "looks wrong" despite confirmed correct dimensions in running FFmpeg process — may be YouTube stream delay/caching, or a different visual issue (position, size) rather than stretching
- [ ] Need to verify with fresh screenshot after stream fully cycles
- [ ] Toggle button for YouTube embed vs overlay editor (deferred from previous session)
- [ ] Consider publishing Google OAuth app (currently testing mode)

## Context for Next Session

Two commits were deployed to the Pi server (192.168.86.38). The debug log confirms the Python object-contain computation is working correctly — both overlays now have ~4.94 aspect ratio in the FFmpeg filter. However, the user reported the stream still looked wrong. This could be: (1) YouTube caching/delay showing the old stream, (2) the overlay being at a different position than expected due to centering calculation, or (3) a different issue entirely. Next step: get a fresh screenshot from YouTube after a full stream cycle to confirm whether the dimensions are actually correct on-screen.
