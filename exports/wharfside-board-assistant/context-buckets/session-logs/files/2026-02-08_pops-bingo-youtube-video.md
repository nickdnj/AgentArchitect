# Pop's Bingo YouTube Video - Full Production & Publication

**Date:** 2026-02-08
**Session type:** execution
**Agents involved:** YouTube Creator (crashed multiple times), direct CLI work for V4/V5 builds

## Summary

Produced and published a 4:28 YouTube video titled "I Recovered My Dad's Voice from a 1980s Hard Drive" telling the story of recovering Nick DeMarco Sr.'s voice from a dead 1980s DOS hard drive and building a modern PWA (pops-bingo.web.app). Iterated through V4 (nova voice) and V5 (echo voice) builds, then published to YouTube via Chrome MCP browser automation.

## Key Findings

- **OpenAI TTS API** (`gpt-4o-mini-tts` model) supports `instructions` parameter for emotional tone guidance per narration segment
- **echo** voice (warm, natural male) selected as best fit for personal family storytelling - not too deep like onyx, clearly masculine
- **nova** voice (female, upbeat) was "near fucking perfect" per user but wrong gender
- YouTube Studio thumbnail upload requires images under 2MB; resize with `ffmpeg -vf "scale=1280:720" -q:v 2`
- Chrome MCP can successfully navigate YouTube Studio's full upload wizard (upload, details, elements, checks, visibility, publish)
- YouTube Creator agent crashes with "classifyHandoffIfNeeded is not defined" error every time - work is better done directly

## Decisions Made

- Voice: **echo** (OpenAI) at speed 1.0 with per-scene emotional tts_instructions
- Script fix: "twenty-pound Luggable" (was incorrect weight before)
- Cold open image: 2001_pop (Pop at bingo table)
- End card: QR code + URL text for pops-bingo.web.app
- Thumbnail: ChatGPT-generated image using Pop's actual photo
- Published as **Public** on YouTube

## Video Structure (16 Segments)

1. Cold Open (8s) - Pop's voice clips over 2001_pop image
2. Title Card (6s) - unchanged from V3
3. Nana Mae (16s) - nana-mae photo + narration
4. Pop the Builder (28s) - pop-portrait crossfade to family-bingo-1
5. The Machine (15s) - halikan luggable + dir listing + G46 clip
6. Christmas 2025 (22s) - 2019_pop + O75 clip
7. Dead Hard Drive (17s) - AI image
8. Data Recovery (22s) - AI image
9. Breakthrough (28s) - waveform + static effect + B7 emerging + narration
10. Next Christmas (14s) - mom photo + B12 clip
11. App Reveal (19s) - PopsBingoCaller screenshot + G57
12. QR Code (16s) - Caller crossfade to Card + B3 + N42
13. Easter Egg (15s) - app screenshot + O68
14. Tail Numbers (15s) - pop-portrait + N739SF + N704VB
15. Closing (13s) - 2019_pop + fade to black
16. End Card (14s) - dark bg + QR code + URL text + B1

## FFmpeg Patterns Used

- Ken Burns: `scale=8000:-1,zoompan=z='min(zoom+0.0005,1.15)':d=frames:s=1920x1080:fps=30`
- Crossfade: `xfade=transition=fade:duration=1:offset=N`
- Audio mixing: `amix=inputs=N:duration=first:normalize=0`
- Music mix: `volume=0.08,afade` on ambient-pad-normalized.wav
- Final encode: `libx264 -preset slow -crf 18 -movflags +faststart`

## Artifacts Created

- `${HOME_PATH} (50MB, nova voice)
- `${HOME_PATH} (48MB, echo voice) - PUBLISHED
- `${HOME_PATH} (215KB, ChatGPT-generated with Pop's face)
- 14 narration WAV files in `assets/audio/narration/` (echo voice)
- 16 rebuilt segment MP4s in `assets/segments/`
- YouTube video: https://youtu.be/2suTnFSxPaQ

## TTS Generation Pattern

```bash
curl -s -X POST https://api.openai.com/v1/audio/speech \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o-mini-tts",
    "input": "narration text",
    "voice": "echo",
    "speed": 1.0,
    "response_format": "wav",
    "instructions": "per-scene emotional guidance"
  }' --output scene-NN.wav
```

## Open Items

- [ ] Timestamp accuracy - timestamps in description may drift slightly from actual V5 segment boundaries (were based on V2 timing)
- [ ] Thumbnail quality - ChatGPT image was resized to 1280x720 JPEG; could regenerate at native 1280x720 for sharper result
- [ ] YouTube channel link verification needed to make description URLs clickable
- [ ] Consider adding end screen elements (subscribe button, related video cards)

## Context for Next Session

The video is live and public at https://youtu.be/2suTnFSxPaQ. The full project directory is at `~/Desktop/youtube-projects/pops-bingo/` with all assets, narration, segments, and output files. The YouTube Creator agent (`agents/youtube-creator/`) exists but crashes consistently due to a Claude Code internal bug - direct CLI work with FFmpeg and OpenAI TTS API calls is more reliable for video production. The ChatGPT thumbnail prompt and workflow (generate in ChatGPT with reference photo, download, resize, upload via Chrome MCP) worked well.
