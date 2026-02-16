# Max Image Analysis Crash - Diagnosis and Fix

**Date:** 2026-02-06
**Session type:** debugging / execution
**Agents involved:** Architect, Max (Personal Assistant)

## Summary

Max repeatedly crashed when trying to read iPhone photos (`.png` extension but actually HEIC format) of printing plates from Nick's aunt's estate. The Architect diagnosed the root cause, converted the images, and hardened Max's SKILL.md with an image analysis safety workflow.

## Key Findings

- iPhone photos saved/AirDropped with `.png` extension are often actually HEIC format internally
- The Anthropic API returns `400: Could not process image` when file content doesn't match the extension
- When using `claude -c` to continue a crashed session, the context replay includes the failed image reads, causing an unrecoverable crash loop
- `sips -g format` on macOS reliably detects the actual image format regardless of file extension
- Converting with `sips -s format jpeg -Z 1500` produces API-compatible images at ~400-500KB each

## Decisions Made

- Added "Image Analysis" section to Max's SKILL.md with a safety workflow: check format with sips, convert if needed, read one at a time
- Images converted to JPEG at 1500px max dimension (from 3024x4032 originals)
- Also committed the previously-unstaged Apple Contacts integration section in the same SKILL.md update

## Artifacts Created

- `agents/personal-assistant/SKILL.md` - Updated with Image Analysis and Apple Contacts sections
- `context-buckets/research-cache/files/printing-plates-project/` - Original HEIC-in-PNG files (9 images)
- `context-buckets/research-cache/files/printing-plates-project/converted/` - API-safe JPEG versions (9 images: IMG_0471-0478, IMG_0480)
- Git commit `d705a1e` - "Update Max SKILL.md: add image analysis safety workflow and Apple Contacts integration"
- Synced all 33 agents to Claude Code native format via `/sync-agents`

## The Printing Plates

- 9 photos of printing plates from Nick's aunt's estate
- Aunt worked for Harcourt Brace publishing company
- At least one plate identified: title page for **Ivanhoe by Sir Walter Scott** (Harcourt, Brace & World, Inc.)
- Nick wants to research their potential value (historical/collectible)
- Analysis not yet performed - images are now ready for Max to examine

## Open Items

- [ ] Max needs to analyze all 9 converted printing plate images
- [ ] Research value of Harcourt Brace printing plates (historical/collectible market)
- [ ] 3 other files still have uncommitted changes: `config.json`, `servers.json`, `generate-agents.js` (pre-existing from earlier sessions)
- [ ] IMG_0478 and IMG_0480 still on Desktop (originals copied to project, could be cleaned up)

## Context for Next Session

The printing plates project is set up and ready. All 9 images are converted to API-safe JPEG in `context-buckets/research-cache/files/printing-plates-project/converted/`. Start a fresh `/max` session (do NOT continue the crashed session) and tell Max the images are ready for analysis. The first plate (IMG_0471) is the Ivanhoe title page. Max now knows to check image formats before reading thanks to the updated SKILL.md.
