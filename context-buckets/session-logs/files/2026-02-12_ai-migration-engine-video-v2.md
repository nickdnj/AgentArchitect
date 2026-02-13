# AI Migration Engine - YouTube Video V2 (Rebuild)

**Date:** 2026-02-12
**Session type:** execution
**Agents involved:** Max (Personal Assistant), YouTube Creator (subagent), Chrome Browser (YouTube upload)

## Summary

Rebuilt the AI Migration Engine pitch video from scratch as a shorter 3-5 minute executive highlight targeting Altium leadership. The YouTube Creator agent produced the initial build, then two rounds of manual fixes addressed audio dropouts at scene transitions and over-zoomed Ken Burns effects on infographic images, plus significantly boosted narration volume.

## Key Findings

- The YouTube Creator agent successfully produced a complete 4:52 video in ~12 minutes (10 scenes, 9 narration clips, background music, full assembly)
- FFmpeg's `afade` on individual segments causes audio dropouts at concatenation boundaries — the fix is building a single continuous audio track with `adelay` positioning, then combining with video-only faded segments
- `amix` with many inputs (10) divides volume by the input count — must re-normalize after mixing with `loudnorm`
- Original Ken Burns zoom at 8-12% was too aggressive for infographic diagrams; 2-3% provides subtle motion without cropping content
- YouTube-standard narration loudness is -16 LUFS; the original TTS output was around -38 dB mean, far too quiet

## Decisions Made

- **Audience:** Altium leadership (internal pitch)
- **Length:** 3-5 min highlight (punchy executive summary)
- **Narration:** AI voice (Kokoro TTS am_onyx), upbeat and professional
- **Zoom:** Reduced to max 3% Ken Burns (from 8-12%)
- **Volume:** Normalized to -16 LUFS, final mean -14.2 dB
- **Music:** Background ambient pad at 8% volume (reduced from 12% to stay behind louder narration)

## Artifacts Created

- `outputs/video/ai-migration-engine/output/ai-migration-engine.mp4` — Final v2 video (52MB, 4:52, 1080p)
- `outputs/video/ai-migration-engine/output/ai-migration-engine-thumbnail.jpg` — Thumbnail
- `outputs/video/ai-migration-engine/output/metadata.md` — YouTube metadata
- `outputs/video/ai-migration-engine/script/script.md` — Full 10-scene script
- `outputs/video/ai-migration-engine/script/outline.md` — Scene outline
- `outputs/video/ai-migration-engine/project.json` — Project config
- `outputs/video/ai-migration-engine/assembly/v2/` — All rebuilt segments, normalized audio, and intermediate files

## Scene Breakdown (10 scenes, 4:52 total)

| # | Scene | Duration | Visual |
|---|-------|----------|--------|
| 1 | Title Card | 8s | Cover image + text overlays |
| 2 | The Problem | 29s | Cover image, subtle zoom |
| 3 | The Cost | 26s | Migration crisis diagram, slow pan |
| 4 | The Transformation | 29s | Before/after comparison, subtle zoom |
| 5 | The Opportunity | 35s | Market opportunity diagram, subtle zoom |
| 6 | The Weapon | 39s | System architecture, slow pan |
| 7 | How It Works | 40s | Migration pipeline, subtle zoom |
| 8 | The Journey | 28s | Customer journey, slow pan |
| 9 | The Roadmap | 26s | Roadmap diagram, subtle zoom |
| 10 | The Ask + Closing | 31s | Cover image + text overlays |

## Version History (This Session)

| Version | Issue | Fix |
|---------|-------|-----|
| v1 (YouTube Creator) | Audio dropouts at transitions, over-zoomed, quiet narration | Initial automated build |
| v1-fix1 | Audio dropouts | Rebuilt continuous audio track with adelay positioning, stripped audio from faded segments |
| v2 (final) | Over-zoom + quiet narration | Rebuilt all 10 segments with 2-3% zoom; normalized narration to -16 LUFS; re-normalized after amix; final mean -14.2 dB |

## YouTube Upload

- **Video URL:** https://youtu.be/uWhmBCJkRsY
- **Studio URL:** https://studio.youtube.com/video/uWhmBCJkRsY/edit
- **Visibility:** Unlisted
- **Upload method:** Chrome Browser agent via YouTube Data API v3 (OAuth + Python script)
- **Metadata applied:** Title, full description with chapter timestamps, 14 tags, custom thumbnail, Science & Technology category

## Open Items

- [x] ~~Video ready for review~~ — Nick approved
- [x] ~~Upload to YouTube~~ — Uploaded as unlisted: https://youtu.be/uWhmBCJkRsY
- [ ] Video files are gitignored (52MB MP4) — stored locally only
- [ ] Share unlisted link with intended Altium leadership audience

## Context for Next Session

The AI Migration Engine pitch video v2 is complete and uploaded to YouTube (unlisted) at https://youtu.be/uWhmBCJkRsY. It's a 4:52 punchy executive highlight targeting Altium leadership with fixed zoom (2-3%), normalized audio (-14.2 dB), and continuous narration. The full project workspace with all intermediate assets is at `outputs/video/ai-migration-engine/`. Video files are gitignored so they exist only on the local machine. This is a separate, shorter video from the earlier 8:49 v6 version built in a previous session at `~/Desktop/youtube-projects/ai-migration-engine/`.
