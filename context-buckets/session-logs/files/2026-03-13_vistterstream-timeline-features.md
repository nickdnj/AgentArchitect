# VistterStream Timeline Features & Bug Fixes

**Date:** 2026-03-13
**Session type:** execution
**Agents involved:** Direct implementation (no team orchestrator)

## Summary

Fixed a Pydantic v2 validation bug that prevented saving timelines (422 error), added copy timeline and edit settings features to the UI, updated broadcast metadata for YouTube, and investigated server CPU usage confirming VA-API hardware encoding is active with acceptable 63% CPU utilization from overlay compositing.

## Key Findings

- Pydantic v2 rejects `null` for fields typed as `str = None` — must use `Optional[str] = None`
- The 422 was triggered by `broadcast_tags` and `broadcast_category_id` being null in the GET response and sent back unchanged via PUT
- FFmpeg overlay compositing (5 overlays with `between()` time-gating) runs on CPU even with VA-API encoding
- N100 at ~255% CPU (63% of 4 cores) with 5 overlays + VA-API encoding — acceptable headroom
- YouTube embed ads are normal for non-Premium accounts (vistter2@gmail.com)

## Decisions Made

- Use `Optional[type] = None` for all nullable fields in TimelineUpdate and TimelineCreate schemas
- Added 15fps option to the edit settings modal (matches camera output)
- Category ID 19 (Travel & Events) for YouTube broadcast
- 5 overlay CPU usage is acceptable — no optimization needed unless quality degrades

## Artifacts Created

- VistterStream commit 2ee6414: Fix timeline save 422 error
- VistterStream commit 1a59392: Add copy timeline and edit settings features
- Both deployed to production server

## Open Items

- [ ] Network still unstable — can't judge stream quality yet
- [ ] YouTube ads in dashboard embed (vistter2 is non-Premium account)

## Context for Next Session

Timeline editor now has copy and settings buttons. Copy duplicates a timeline with all tracks/cues. Settings gear opens a modal for editing name, duration, resolution, fps, loop, and all broadcast metadata. The 422 bug that prevented saving timelines is fixed. Stream is running on production with 5 weather overlays and VA-API hardware encoding. Network instability is the remaining blocker for quality assessment.
