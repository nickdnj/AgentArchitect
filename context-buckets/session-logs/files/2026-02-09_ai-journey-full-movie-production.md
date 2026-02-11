# AI Journey Full Movie - Production & YouTube Upload

**Date:** 2026-02-09
**Session type:** execution
**Agents involved:** YouTube Creator, Max (Personal Assistant), Chrome MCP

## Summary

Produced and published "My AI Journey: Three Years from Zero to 36 Agents" as a single continuous 11:36 video on YouTube. This is the culmination of the 6-episode micro-series, now assembled into one unified documentary with an enhanced intro incorporating Nick's deeper backstory (Altium departure, career break, dream job narrative).

## Key Findings

- The full movie approach works better than 6 separate episodes for this story
- Synthesized music (Python-generated) was too loud and aggressive; the original ambient/cinematic music at 12% volume worked much better
- YouTube Studio requires SD processing to complete before visibility can be changed to Public
- Chrome MCP can handle the full YouTube upload workflow: file upload, metadata entry, thumbnail upload, visibility settings

## Decisions Made

- Combined all 6 episodes into one continuous video with chapter cards instead of repeated series intros
- Enhanced Chapter 1 intro with Altium departure story: dream job, career break, "why AI matters" context
- Used original ambient music at 12% volume (lower than the standard 18%) after the upbeat remix was rejected as too loud
- Published as Public on YouTube immediately

## Artifacts Created

- `/Users/nickd/Desktop/youtube-projects/ai-journey-full/script/full-movie-script.md` - Unified 32-scene script
- `/Users/nickd/Desktop/youtube-projects/ai-journey-full/output/my-ai-journey-full.mp4` - Final video (11:36, ~328MB)
- `/Users/nickd/Desktop/youtube-projects/ai-journey-full/assets/images/` - 34 images (30 DALL-E 3 + 4 real photos)
- `/Users/nickd/Desktop/youtube-projects/ai-journey-full/assets/audio/narration/` - 33 Kokoro TTS narration clips
- `/Users/nickd/Desktop/youtube-projects/ai-journey-full/assets/thumbnails/thumbnail.png` - YouTube thumbnail
- `/Users/nickd/Desktop/youtube-projects/ai-journey-full/output/metadata.md` - YouTube metadata
- **YouTube URL:** https://youtu.be/12EKCPWADkE (Public, HD processed)

## Production Specs

- Voice: Kokoro TTS, am_onyx at 1.1x speed
- Music: Original ambient electronic at 12% volume, ducked to ~8% for Pop's Bingo, ~15% for finale
- Video: 1920x1080, 30fps, H.264/AAC, CRF 18, MP4 with faststart
- Images: DALL-E 3 (1792x1024) + real photos (LinkedIn, Pop's Bingo screenshots, Nick's outdoor photo)
- Ken Burns effects on all images, 0.3-0.5s crossfades

## Chapter Structure

| Chapter | Timestamp | Content |
|---------|-----------|---------|
| Cold Open | 0:00 | Series hook |
| Title Card | 0:22 | "Three Years from Zero to 36 Agents" |
| Ch 1: The Before | 0:26 | Career, Altium, career break, ChatGPT arrives |
| Ch 2: The Discovery | 2:38 | Copy-paste era, pdfScribe, d3marco |
| Ch 3: The Cursor Revolution | 4:30 | 252 commits, .cursorrules, pdf2website |
| Ch 4: The Vibe Era | 6:18 | VibeText/Kit/Shell, VistterStream, PRD evolution |
| Ch 5: The Terminal Strikes Back | 7:52 | Pop's Bingo, Claude Code, ClaudeAgents |
| Ch 6: Building AI That Builds | 9:55 | Agent Architect, Max, recursive moment, punchline |
| Finale | 12:08 | "What do you want to build?" + Nick's photo |

## Open Items

- [ ] Consider adding real screen recordings or project demos for a v2
- [ ] Music could be upgraded with a licensed track for better energy
- [ ] Individual episode versions (Eps 1-6) still exist if Nick wants to publish those separately later

## Context for Next Session

The full AI Journey video is published and public on YouTube at https://youtu.be/12EKCPWADkE. All 6 individual episode versions also exist in ~/Desktop/youtube-projects/ai-journey-ep{1-6}/ directories. The project assets (images, narration, music, segments) are preserved in the ai-journey-full directory for future re-edits. Nick's backstory file has been updated with accurate physical description and positive Altium departure framing.
