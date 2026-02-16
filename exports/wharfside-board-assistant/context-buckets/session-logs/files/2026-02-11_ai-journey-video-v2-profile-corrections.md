# AI Journey Video v2 - Profile Corrections and Re-production

**Date:** 2026-02-11
**Session type:** execution
**Agents involved:** Max (Personal Assistant), YouTube Creator (delegated for video production)

## Summary

Updated the AI Journey YouTube full movie video with corrected profile information for Nick DeMarco. All source narrative files, production scripts, and narration text files were updated with correct ages (61 current, 58 at ChatGPT discovery, 59 at career break). The competitor recruiting line was removed. Video was fully re-produced as v2 with regenerated narration audio for 4 affected scenes, rebuilt segments, and re-assembled final cut. Old YouTube video was deleted; v2 uploaded and live at https://youtu.be/TrunXQaJb2Q

## Key Findings

- Nick's correct ages based on DOB 9/9/1964: current = 61, ChatGPT era (2022-2023) = 58, career break start = 59
- Weight corrected to 250 lbs (was 245)
- The competitor recruiting line ("Competitors were recruiting me to recreate what we'd built.") was removed from Scene 2
- The v1 finale segment (seg-39) had been accidentally truncated by FFmpeg's `-shortest` flag -- v2 fixes this with proper audio padding, adding the intended 8-second hold on Nick's photo with "My AI Journey" text overlay and fade to black
- v2 duration: 11:40 (700.6s) vs v1: 11:35 (695.4s) -- net +5.2s due to Scene 02 being 2.9s shorter and Scene 32 being 8.1s longer

## Decisions Made

- Old YouTube video (https://youtu.be/12EKCPWADkE) was deleted and new v2 will be uploaded as a fresh video (YouTube does not support in-place file replacement)
- Video will be set to Public visibility on the nickdnj (YOUR_PERSONAL_EMAIL) YouTube account
- User rejected delegating YouTube upload to a subagent (twice) -- upload should be done directly from main conversation via Chrome MCP

## Artifacts Created

- Updated source files in repo:
  - `context-buckets/ai-journey/files/research/nick-backstory.md` - profile corrections
  - `context-buckets/ai-journey/files/narrative/story-draft-v1.md` - age corrections (3 edits)
  - `context-buckets/ai-journey/files/production/all-scripts-draft.md` - age corrections (3 edits)
- Updated production files on Desktop:
  - `~/Desktop/youtube-projects/ai-journey-full/script/full-movie-script.md` - 4 edits
  - `~/Desktop/youtube-projects/ai-journey-full/assets/audio/narration/scene-01.txt` - sixty-one
  - `~/Desktop/youtube-projects/ai-journey-full/assets/audio/narration/scene-02.txt` - removed competitor line
  - `~/Desktop/youtube-projects/ai-journey-full/assets/audio/narration/scene-07.txt` - fifty-eight
  - `~/Desktop/youtube-projects/ai-journey-full/assets/audio/narration/scene-32.txt` - fifty-nine
  - `~/Desktop/youtube-projects/ai-journey-full/assets/audio/narration/scene-01.wav` - regenerated
  - `~/Desktop/youtube-projects/ai-journey-full/assets/audio/narration/scene-02.wav` - regenerated
  - `~/Desktop/youtube-projects/ai-journey-full/assets/audio/narration/scene-07.wav` - regenerated
  - `~/Desktop/youtube-projects/ai-journey-full/assets/audio/narration/scene-32.wav` - regenerated
  - 4 rebuilt video segments (seg-03, seg-04, seg-10, seg-39)
  - `~/Desktop/youtube-projects/ai-journey-full/output/my-ai-journey-full-v2.mp4` - final video (342MB, 11:40)
  - `~/Desktop/youtube-projects/ai-journey-full/output/metadata.md` - updated description (61-year-old, Public)

## Chapter Timestamp Corrections

The original chapter timestamps in the YouTube description were script estimates, never measured from the actual video. Calculated correct timestamps from v2 segment durations and updated both the local metadata file and the live YouTube description via Chrome MCP:

| Chapter | Old | Corrected |
|---|---|---|
| Cold Open | 0:00 | 0:00 |
| Title Card | 0:22 | 0:18 |
| Chapter 1: The Before | 0:26 | 0:22 |
| Chapter 2: The Discovery | 2:38 | 2:08 |
| Chapter 3: The Cursor Revolution | 4:30 | 3:44 |
| Chapter 4: The Vibe Era | 6:18 | 5:36 |
| Chapter 5: The Terminal Strikes Back | 7:52 | 7:13 |
| Chapter 6: Building AI That Builds | 9:55 | 9:01 |
| Finale | 12:08 | 11:04 |

## Thumbnail

Generated custom thumbnail using GPT Image (gpt-image-1) at 1536x1024, resized to 1280x720 for YouTube spec. Design: bald man with white goatee and glasses, laptop with ChatGPT on left, grid of 36 glowing AI agent icons on right, bold arrow showing transformation. Text: "MY AI JOURNEY / Zero to 36 AI Agents / 3 YEARS". Navy blue and cyan color scheme. Uploaded to YouTube Studio via Chrome MCP.

Files:
- `~/Desktop/youtube-projects/ai-journey-full/output/thumbnail-v1.png` — original 1536x1024
- `~/Desktop/youtube-projects/ai-journey-full/output/thumbnail.png` — resized 1280x720 (uploaded to YouTube)

## Open Items

- [x] Upload v2 video to YouTube — live at https://youtu.be/TrunXQaJb2Q
- [x] Verify and correct chapter timestamps (were 30-60s off from script estimates)
- [x] Generate and upload custom thumbnail

## Context for Next Session

Video v2 is fully complete and live at https://youtu.be/TrunXQaJb2Q (Public, nickdnj account). All items resolved: corrected profile ages, removed competitor line, accurate chapter timestamps, custom thumbnail uploaded. No remaining open items for this video.
