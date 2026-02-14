# Video Asset Generator - SKILL

## Purpose

Video Asset Generator produces all visual and audio assets needed for YouTube video assembly. Working from a storyboard document, it generates AI images, narration audio via TTS, and background music. Each asset is saved to the project folder with consistent naming for the Video Assembler to consume.

## Core Responsibilities

1. **AI Image Generation** - Generate scene images using DALL-E 3 or GPT Image
2. **Narration Audio** - Generate per-scene narration via VoiceMode TTS (or Kokoro fallback)
3. **Background Music** - Generate ambient music pads via FFmpeg synthesis
4. **User Photo Processing** - Convert and resize user-provided images for video use
5. **Thumbnail Options** - Generate 1-2 thumbnail candidates

## Workflow

### Input

The orchestrator provides:
- **Project folder path** (e.g., `~/Desktop/youtube-projects/{slug}/`)
- **Storyboard path** (`script/storyboard.md`)
- **Script path** (`script/script.md`) for narration text extraction

Read these files to understand what assets are needed.

### Step 1: Parse Storyboard

Read `script/storyboard.md` and build an asset manifest:
- Which scenes need AI-generated images (with prompts)
- Which scenes use user-provided images (with file paths)
- Which scenes need title cards (FFmpeg drawtext)
- Which scenes have narration (extract text from script)
- Whether background music is needed

### Step 2: Generate AI Images (OpenAI Image MCP)

Use `generate_image_dalle3` for photorealistic scenes, `generate_image_gpt` for stylized/illustrated content.

**Settings:**
- Use landscape aspect ratio for video (1792x1024 for DALL-E 3, or specify wide format)
- Save all images to `assets/images/scene-{N}-{description}.png`

**Image prompt best practices:**
- Include "16:9 aspect ratio" or "widescreen cinematic" in prompts
- Specify lighting, mood, and color palette matching video tone
- For documentary: "photorealistic, editorial photography style"
- For showcase: "studio lighting, clean background, product photography"
- For narrative: "atmospheric, cinematic lighting, storytelling mood"

**Error handling:**
- Retry once with a rephrased prompt on failure
- If repeated failure, note the scene for manual resolution and continue

### Step 3: Process User-Provided Images

```bash
# Check format and dimensions
sips -g pixelWidth -g pixelHeight image.jpg

# Convert HEIC to JPEG if needed
sips -s format jpeg input.HEIC --out output.jpg

# Resize if oversized (keep aspect ratio, max 1920px wide)
sips -Z 1920 image.jpg --out processed.jpg
```

Copy processed images to `assets/images/`.

### Step 4: Generate Narration Audio

**Primary: VoiceMode MCP** - Use the `converse` tool for text-to-speech narration generation.

**Fallback: Kokoro TTS** - If VoiceMode hits limits or is unavailable, use the local Kokoro TTS server at `http://localhost:8880`:

```bash
TEXT="Your narration text here"
curl -s -X POST http://localhost:8880/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg input "$TEXT" '{"input": $input, "voice": "am_onyx", "model": "kokoro", "response_format": "wav"}')" \
  -o assets/audio/narration/scene-N.wav
```

**Available Kokoro voices:**
- `am_onyx` - Male, warm, authoritative (good for documentaries)
- `af_heart` - Female, clear, natural
- `am_echo` - Male, calm, neutral

**Process:**
1. Split script into per-scene narration segments (save text to `assets/audio/narration/scene-{N}.txt`)
2. For each scene with narration, generate audio via VoiceMode or Kokoro
3. Save to `assets/audio/narration/scene-{N}.wav`
4. Record the duration of each generated audio file:
   ```bash
   ffprobe -v quiet -show_entries format=duration -of csv=p=0 file.wav
   ```

**IMPORTANT:**
- Track exact durations -- these drive the video assembly timing
- Use the SAME voice for all scenes -- mixing voices sounds jarring
- If regenerating specific scenes, check which voice was used originally

### Step 5: Generate Background Music (Optional)

Generate ambient pad via FFmpeg (layered harmonics with reverb):
```bash
ffmpeg -y \
  -f lavfi -i "sine=frequency=65.41:duration=720" \
  -f lavfi -i "sine=frequency=196:duration=720" \
  -f lavfi -i "sine=frequency=261.63:duration=720" \
  -f lavfi -i "sine=frequency=329.63:duration=720" \
  -f lavfi -i "sine=frequency=32.7:duration=720" \
  -filter_complex \
  "[0:a]volume=0.3,lowpass=f=200[c2];
   [1:a]volume=0.2,lowpass=f=600[g3];
   [2:a]volume=0.25,lowpass=f=800[c4];
   [3:a]volume=0.15,lowpass=f=1000[e4];
   [4:a]volume=0.1,lowpass=f=100[bass];
   [c2][g3][c4][e4][bass]amix=inputs=5:duration=longest,
   aecho=0.8:0.7:500|1000:0.3|0.2,
   lowpass=f=2000,
   afade=t=in:st=0:d=5,afade=t=out:st=715:d=5" \
  assets/audio/music/ambient-pad.wav
```

**Normalize before mixing** (generated pads often have very low volume):
```bash
# Check levels
ffmpeg -i ambient-pad.wav -af "volumedetect" -f null /dev/null 2>&1 | grep mean_volume

# Normalize (boost to usable levels, limit to prevent clipping)
ffmpeg -y -i ambient-pad.wav -af "volume=36dB,alimiter=limit=0.9" ambient-pad-normalized.wav
```

Target normalized pad at -10 to -15dB max volume before mixing.

### Step 6: Generate Thumbnail Options

Generate 1-2 thumbnail candidates at 1280x720 to `assets/thumbnails/`:
- Use a compelling source image or generate one with OpenAI Image
- These are preliminary; the Video Publisher will finalize thumbnails

### Step 7: Update Project State

Update `project.json`:
- Set `phases.assets.status` to "complete"
- Populate `assets.images[]` with all generated/processed images
- Populate `assets.narration[]` with audio files and durations

## Output

Return a briefing to the orchestrator with:
- **Images generated** - Count and list (AI-generated vs user-provided)
- **Narration files** - Count, total duration, voice used
- **Background music** - Generated or skipped, duration
- **Thumbnail options** - Paths to candidates
- **Any failures** - Scenes that need manual resolution
- **Asset manifest** - Complete list with paths for the Video Assembler
- **Narration durations** - Per-scene durations (critical for assembly timing)

## Tool Reference

| MCP Server | Key Tools | Purpose |
|-----------|-----------|---------|
| `openai-image` | `generate_image_dalle3`, `generate_image_gpt`, `generate_image_gpt_mini` | Scene images, illustrations, thumbnails |
| `voicemode` | `converse`, `service` | Text-to-speech narration generation |
| `video-editor` | `execute_command` | Background music generation, audio processing |

**Fallback:** If `voicemode` hits limits, use Kokoro TTS at `http://localhost:8880/v1/audio/speech` (requires Docker container running).

## Success Criteria

- All storyboard-specified images exist in `assets/images/`
- All narration audio files exist with correct durations tracked
- Same voice used consistently across all narration
- Background music generated and normalized (if requested)
- Thumbnail options generated
- project.json updated with complete asset manifest
- Failed generations documented for manual resolution
