# Video Assembler - SKILL

## Purpose

Video Assembler takes generated assets (images, narration audio, music) and a storyboard, then produces a polished YouTube-ready MP4 video using FFmpeg. It supports multiple visual styles — Ken Burns pan/zoom, gentle zoom, static display, and pillarboxed portrait images — plus text overlays, transitions, audio mixing, and final encoding with YouTube-optimized settings.

## Core Responsibilities

1. **Image-to-Video Segments** - Convert static images into video clips with the appropriate visual style per scene
2. **Image Orientation Detection** - Detect portrait vs landscape images and apply correct treatment
3. **Text Overlays** - Add title cards, captions, and timed text overlays
4. **Narration Sync** - Attach per-scene narration audio to video segments
5. **Background Music Mix** - Mix background music under narration at proper levels
6. **Concatenation** - Join all segments into a continuous video
7. **Transitions** - Add crossfade transitions between scenes (optional)
8. **Final Encode** - Produce YouTube-optimized H.264 MP4

## Workflow

### Input

The orchestrator provides:
- **Project folder path** (e.g., `~/Desktop/youtube-projects/{slug}/`)
- **Storyboard path** (`script/storyboard.md`)
- **Asset manifest** (from Video Asset Generator briefing)
- **Narration durations** per scene (critical for timing)

Read the storyboard and verify all assets exist before starting assembly.

### Step 1: Detect Image Orientation & Select Visual Style

**BEFORE generating any segment**, check each image's dimensions:
```bash
ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 image.png
```

**Orientation rules:**
- **Landscape** (width > height): Use the style specified in storyboard (ken-burns, gentle-zoom, static, or pan)
- **Portrait** (height > width): ALWAYS use **pillarbox** mode regardless of storyboard style — show the full image with black bars on left and right
- **Square** (width ≈ height): Use the storyboard style, centering in 1920x1080 frame

### Step 1a: Visual Styles Reference

The storyboard specifies a `motion` style for each scene. Use the matching FFmpeg filter:

**Style: ken-burns-zoom** (cinematic photos, personal narratives)
Slow zoom-in from 1.0x to 1.15x, centered:
```bash
ffmpeg -loop 1 -i scene.png -vf "scale=8000:-1,zoompan=z='min(zoom+0.0005,1.15)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={fps*duration}:s=1920x1080:fps={fps}" -t {duration} -c:v libx264 -pix_fmt yuv420p segment.mp4
```

**Style: ken-burns-pan** (wide landscape photos, panoramic shots)
Slow pan-right across a zoomed image:
```bash
ffmpeg -loop 1 -i scene.png -vf "scale=8000:-1,zoompan=z='1.1':x='if(eq(on,1),0,x+2)':y='ih/2-(ih/zoom/2)':d={fps*duration}:s=1920x1080:fps={fps}" -t {duration} -c:v libx264 -pix_fmt yuv420p segment.mp4
```

**Style: gentle-zoom** (infographics, diagrams, charts — content must stay readable)
Very subtle zoom, max 2-3% over the full duration:
```bash
ffmpeg -loop 1 -i scene.png -vf "scale=8000:-1,zoompan=z='min(zoom+0.0001,1.03)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={fps*duration}:s=1920x1080:fps={fps}" -t {duration} -c:v libx264 -pix_fmt yuv420p segment.mp4
```

**Style: static** (text-heavy content, screenshots, data tables)
No motion at all — scale to fit 1920x1080 and hold:
```bash
ffmpeg -loop 1 -i scene.png -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black" -t {duration} -c:v libx264 -pix_fmt yuv420p -r {fps} segment.mp4
```

**Style: pillarbox** (portrait/vertical images — MANDATORY for any image where height > width)
Show the full portrait image centered with black bars on left and right:
```bash
ffmpeg -loop 1 -i portrait.png -vf "scale=-1:1080,pad=1920:1080:(ow-iw)/2:0:black" -t {duration} -c:v libx264 -pix_fmt yuv420p -r {fps} segment.mp4
```

Optional: pillarbox with gentle zoom (subtle motion while keeping portrait framing):
```bash
ffmpeg -loop 1 -i portrait.png -vf "scale=-1:4320,zoompan=z='min(zoom+0.0001,1.03)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={fps*duration}:s=608x1080:fps={fps},pad=1920:1080:(ow-iw)/2:0:black" -t {duration} -c:v libx264 -pix_fmt yuv420p segment.mp4
```

### Style Selection Guidelines

| Image Type | Recommended Style | Why |
|-----------|------------------|-----|
| Personal photos (landscape) | ken-burns-zoom | Cinematic, emotional, draws viewer in |
| Wide panoramic photos | ken-burns-pan | Reveals the full scene naturally |
| Infographics / diagrams | gentle-zoom | Subtle motion keeps it alive without losing readability |
| Screenshots / data / text | static | Must be fully readable, no cropping |
| Portrait photos / vertical images | pillarbox | Shows the full image, no awkward cropping |
| AI-generated images | ken-burns-zoom or gentle-zoom | Depends on content density |

**IMPORTANT:**
- Always scale input images UP first (`scale=8000:-1`) for ken-burns styles to provide enough resolution for pan/zoom
- Use `pix_fmt yuv420p` for maximum compatibility
- Match fps across all segments (use 30 fps consistently)
- NEVER crop or zoom into portrait images to fill the frame — always pillarbox them

### Step 2: Add Text Overlays

Basic text overlay:
```bash
ffmpeg -i segment-1.mp4 -vf "drawtext=text='Title Text':fontsize=72:fontcolor=white:borderw=3:bordercolor=black:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,0,5)'" -c:v libx264 -c:a copy output.mp4
```

Styled title card with background:
```bash
ffmpeg -f lavfi -i "color=c=black:s=1920x1080:d=8" -vf "drawtext=text='Video Title':fontsize=80:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2-30,drawtext=text='Subtitle':fontsize=40:fontcolor=#CCCCCC:x=(w-text_w)/2:y=(h-text_h)/2+50" -c:v libx264 -pix_fmt yuv420p title-card.mp4
```

### Step 3: Audio Assembly (CRITICAL — Read Carefully)

**KNOWN ISSUE:** Adding narration per-segment and then concatenating causes audio dropouts at segment boundaries, especially with crossfade transitions. The `amix` filter is also unreliable for mixing narration with background music — it auto-attenuates and causes pumping.

**RECOMMENDED APPROACH: Build a single continuous audio track, then mux with video.**

#### Step 3a: Build Continuous Narration Track

Calculate the start time (in seconds) for each scene's narration based on segment durations, then combine all narration clips into one continuous WAV using `adelay`:

```bash
# First, normalize all narration to -16 LUFS (YouTube standard loudness)
for f in narration/scene-*.wav; do
  ffmpeg -y -i "$f" -af "loudnorm=I=-16:TP=-1.5:LRA=11" "${f%.wav}-norm.wav"
done

# Build continuous track with adelay positioning
# Scene 1 starts at 0ms, Scene 2 at {scene1_duration}ms, etc.
ffmpeg -y \
  -i narration/scene-01-norm.wav \
  -i narration/scene-02-norm.wav \
  -i narration/scene-03-norm.wav \
  -filter_complex \
  "[0:a]adelay=0|0[a0]; \
   [1:a]adelay={scene1_end_ms}|{scene1_end_ms}[a1]; \
   [2:a]adelay={scene2_end_ms}|{scene2_end_ms}[a2]; \
   [a0][a1][a2]amix=inputs=3:duration=longest:normalize=0[out]" \
  -map "[out]" assembly/narration-continuous.wav
```

**Note:** The `adelay` values are in milliseconds. Calculate from cumulative segment durations. Use `normalize=0` on amix to prevent volume reduction.

#### Step 3b: Mix Narration + Background Music (Python method — most reliable)

```python
import numpy as np
import soundfile as sf

# Load audio files
narration, sr = sf.read('assembly/narration-continuous.wav')
music, sr_m = sf.read('audio/music/ambient-pad.wav')

# Resample if needed, then trim/pad music to match narration length
if len(music) < len(narration):
    music = np.tile(music, (len(narration) // len(music) + 1, 1))[:len(narration)]
else:
    music = music[:len(narration)]

# Mix: narration at 100%, music at 12-15%
mixed = narration + music * 0.12

# Normalize to prevent clipping
peak = np.max(np.abs(mixed))
if peak > 0.95:
    mixed = mixed * (0.95 / peak)

sf.write('assembly/final-audio.wav', mixed, sr)
```

#### Step 3c: Alternative — FFmpeg-only mixing (simpler, less reliable)

If Python is not available, use FFmpeg but be aware of potential dropout issues:

```bash
# Per-segment approach (FALLBACK ONLY)
ffmpeg -i segment-1.mp4 -i narration/scene-1.wav -c:v copy -c:a aac -b:a 192k -shortest segment-1-narrated.mp4
```

#### Step 3d: Verify Audio Levels

**ALWAYS check audio levels after mixing:**
```bash
ffmpeg -i assembly/final-audio.wav -af "volumedetect" -f null /dev/null 2>&1 | grep -E "mean_volume|max_volume"
# Target: mean around -16 to -20 dB, max around -3 to -6 dB
```

If narration is too quiet (mean below -25 dB), re-normalize:
```bash
ffmpeg -y -i assembly/final-audio.wav -af "loudnorm=I=-16:TP=-1.5:LRA=11" assembly/final-audio-loud.wav
```

### Step 4: Sub-Shot Morph Effects (optional)

For scenes with a "reveal" (e.g., showing a raw artifact then its rendered version):
```bash
# Sub-shot A: raw plate with Ken Burns pan
ffmpeg -y -loop 1 -i plate.png -t 14 \
  -vf "scale=8000:-1,zoompan=z='1.1':x='iw/2-(iw/zoom/2)':y='...':d=420:s=1920x1080:fps=30" \
  -c:v libx264 -crf 18 -pix_fmt yuv420p tmp-a.mp4

# Sub-shot B: rendered reveal with gentle zoom
ffmpeg -y -loop 1 -i reveal.png -t 12 \
  -vf "scale=8000:-1,zoompan=z='1.0+0.05*on/360':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=360:s=1920x1080:fps=30" \
  -c:v libx264 -crf 18 -pix_fmt yuv420p tmp-b.mp4

# Combine with fade morph + narration audio
ffmpeg -y -i tmp-a.mp4 -i tmp-b.mp4 -i narration.wav \
  -filter_complex "[0:v][1:v]xfade=transition=fade:duration=1:offset=13[v]" \
  -map "[v]" -map 2:a -c:v libx264 -crf 18 -c:a aac -b:a 192k -shortest \
  -movflags +faststart seg-combined.mp4
```

### Step 5: Rendered Text Pages (for book/document content)

For text-heavy source material, render readable "book pages" using Python/Pillow:
```python
from PIL import Image, ImageDraw, ImageFont, ImageFilter

PAGE_HEIGHT = 980
PAGE_WIDTH = int(PAGE_HEIGHT * 4 / 7)  # ~560px
PAGE_COLOR = (245, 240, 232)  # cream
FRAME_BG = (30, 28, 26)      # dark background

page = Image.new('RGB', (PAGE_WIDTH, PAGE_HEIGHT), PAGE_COLOR)
# Draw header, text, page number with Georgia serif font
frame = Image.new('RGB', (1920, 1080), FRAME_BG)
frame.paste(page, ((1920 - PAGE_WIDTH) // 2, (1080 - PAGE_HEIGHT) // 2))
```

Scale rendered pages for Ken Burns zoom headroom:
```bash
ffmpeg -y -i bookpage.png -vf "scale=3840:2160:flags=lanczos" bookpage_video.png
```

### Step 6: Concatenate All Segments

Create a concat file (`assembly/concat.txt`):
```
file '../assets/segments/segment-01.mp4'
file '../assets/segments/segment-02.mp4'
file '../assets/segments/segment-03.mp4'
```

```bash
ffmpeg -f concat -safe 0 -i concat.txt -c copy output/raw-concat.mp4
```

### Step 7: Add Crossfade Transitions (optional)

For simple fade-out/fade-in approach (reliable for many segments):
```bash
# Add fade-out to end of each segment
ffmpeg -i seg.mp4 -vf "fade=t=out:st={duration-0.5}:d=0.5" -af "afade=t=out:st={duration-0.5}:d=0.5" seg-faded.mp4
```

For xfade between two segments:
```bash
ffmpeg -i seg1.mp4 -i seg2.mp4 -filter_complex "xfade=transition=fade:duration=1:offset={seg1_duration-1}" -c:v libx264 -c:a aac output.mp4
```

### Step 8: Add Background Music

**PREFERRED: Mix music in Step 3b (Python method) — this is the most reliable approach.**

If you already mixed narration + music in Step 3b, skip this step entirely. The final audio track already has music.

**FALLBACK ONLY** — If using FFmpeg for music mixing (less reliable, known to cause dropouts):
```bash
ffmpeg -i final-video.mp4 -i ambient-pad-normalized.wav \
  -filter_complex "[1:a]volume=0.12,afade=t=in:st=0:d=3,afade=t=out:st={total_duration-3}:d=3[music];[0:a][music]amix=inputs=2:duration=first:dropout_transition=2:normalize=0[aout]" \
  -map 0:v -map "[aout]" -c:v copy -c:a aac -b:a 192k output.mp4
```

**WARNING:** FFmpeg `amix` with many inputs divides volume by input count. Always use `normalize=0` and verify levels afterward.

Always verify audio levels after mixing:
```bash
ffmpeg -i output.mp4 -af "volumedetect" -f null /dev/null 2>&1 | grep -E "mean_volume|max_volume"
# Target: mean -16 to -20 dB, max -3 to -6 dB
# If mean is below -25 dB, narration is too quiet — re-normalize with loudnorm
```

### Step 9: Final Encode (YouTube-Optimized)

```bash
ffmpeg -i raw-concat.mp4 -c:v libx264 -preset slow -crf 18 -c:a aac -b:a 192k -movflags +faststart -pix_fmt yuv420p output/{project-slug}.mp4
```

**YouTube-recommended settings:**
- Codec: H.264 (libx264)
- Container: MP4
- Frame rate: 30fps
- Resolution: 1920x1080 (1080p)
- Pixel format: yuv420p
- Audio: AAC at 192kbps
- `-movflags +faststart` for web streaming
- CRF 18 for high quality

### Assembly Strategy (Recommended Order)

For videos with many scenes, use this phased approach:
1. **Detect orientation** of all images (ffprobe width/height)
2. **Generate all video segments** (image → MP4, VIDEO ONLY, no audio) using the correct visual style per scene
3. **Add text overlays** where needed
4. **Concat all video-only segments** (simple concat, no crossfade for reliability)
5. **Build continuous narration track** using adelay positioning (Step 3a)
6. **Mix narration + background music** using Python (Step 3b) or FFmpeg fallback
7. **Mux final audio with video**: `ffmpeg -i video-only.mp4 -i final-audio.wav -c:v copy -c:a aac -b:a 192k -shortest final.mp4`
8. **Final encode** with YouTube settings
9. **Verify audio levels** (volumedetect)

**Key principle:** Keep video and audio pipelines separate until the final mux. This prevents audio dropouts at segment boundaries.

### Step 10: Update Project State

Update `project.json`:
- Set `phases.assembly.status` to "complete"
- Record `assets.segments[]` with file paths and durations
- Record final video path and runtime

## Output

Return a briefing to the orchestrator with:
- **Final video path** and file size
- **Runtime** and scene count
- **Encoding settings** used
- **Any issues** encountered during assembly (segment failures, audio sync problems)
- **Quality notes** (audio levels, visual quality observations)

## Tool Reference

| MCP Server | Key Tools | Purpose |
|-----------|-----------|---------|
| `video-editor` | `execute_command` | All FFmpeg operations (segments, overlays, concat, encode) |

**Fallback:** If `video-editor` MCP is not available, execute FFmpeg commands directly via Bash. FFmpeg must be installed (`brew install ffmpeg`).

## Error Handling

- **FFmpeg failures:** Log full stderr, check for common issues (missing file, invalid filter), attempt with simplified settings
- **Large projects (15+ scenes):** Process in batches, save intermediate results, use simple concat (no xfade) initially
- **Audio sync issues:** Verify narration durations match segment durations before concatenation

## Success Criteria

- Video plays smoothly with synchronized audio and visuals
- Narration is clear and well-paced, matching the visual content
- Transitions between scenes are smooth (no jarring cuts)
- Text overlays are readable and properly timed
- Total video length is within 20% of target
- Video renders successfully to H.264 MP4 at 1080p
- All segments assembled in correct order
- Background music mixed at appropriate level under narration
