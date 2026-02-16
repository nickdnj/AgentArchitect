# Session: Jennings Little Duke Documentary — Full Pipeline

**Date:** 2026-02-14
**Team:** youtube-content
**Specialists Invoked:** Video Script Writer, Video Asset Generator, Video Assembler (x2), Video Publisher (x2)

## Request
Create a YouTube documentary video based on 5 portrait photos of a Jennings "Little Duke" penny slot machine. Full pipeline from script to YouTube upload.

## Creative Brief
- **Topic:** History of the Jennings Little Duke — collector's piece & slot machine history
- **Audience:** General YouTube viewers
- **Tone:** Documentary/narrator style
- **Source:** 5 portrait photos (EXIF orientation tag 6, effective 1125x1500)
- **AI Images:** Yes — 8 period-appropriate supplementary images
- **Target Length:** 4-7 minutes
- **Narration Voice:** Nova (OpenAI TTS)
- **Publish:** Initially stop at review, then approved for YouTube upload

## Actions
- **Video Script Writer** (opus) — Researched Jennings history, O.D. Jennings biography, Little Duke model details, Art Deco context, collector market. Produced outline.md, script.md (810 words, 16 scenes), storyboard.md, project.json
- **Video Asset Generator** (sonnet, 2 attempts) — First attempt failed to load MCP tools. Second attempt successfully generated 8 AI images (DALL-E 3, 1792x1024), 15 narration segments (Nova voice), background music (FFmpeg synthesis, 361s)
- **Video Assembler** (sonnet, 2 builds) — First build had squished portrait photos (EXIF orientation not handled) and missing text overlays. Second build fixed both: pre-rotated photos via PIL exif_transpose, added pillarbox treatment, added all text overlays (title, lower-thirds, end card)
- **Video Publisher** (sonnet, 2 attempts) — First attempt stopped (saw publish_to_youtube: false). Second attempt generated AI thumbnail and uploaded via YouTube Data API v3 with existing OAuth token

## Artifacts
- Project folder: `${HOME_PATH}
- Script: `script/script.md`, `script/outline.md`, `script/storyboard.md`
- AI Images: `assets/images/scene-*.png` (8 files)
- Narration: `assets/audio/narration/scene-*.mp3` (15 files)
- Music: `assets/audio/music/background.mp3`
- Final Video: `output/jennings-little-duke-v3.mp4` (92 MB, 5:46, 1080p)
- Thumbnail: `output/thumbnail.png` (1280x720)
- Metadata: `output/metadata.json`
- Upload result: `output/upload-result.json`
- Upload script: `output/upload_youtube.py` (reusable)

## Key Findings
- EXIF orientation tag 6 on iPhone photos requires explicit transpose before FFmpeg processing — FFmpeg autorotate doesn't always handle this correctly
- MCP tools in subagents must be loaded via ToolSearch before use (deferred loading)
- YouTube Data API upload works with existing OAuth token from `~/.config/youtube-upload/token.pickle`
- Full pipeline from creative brief to published video completed in one session

## YouTube URL
https://www.youtube.com/watch?v=ZiqteFYxmOY
