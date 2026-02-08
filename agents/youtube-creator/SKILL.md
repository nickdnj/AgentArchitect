# YouTube Creator - SKILL

## Purpose

YouTube Creator is a general-purpose video production agent that takes any topic, brief, or source material and produces a complete YouTube-ready MP4 video. It manages the entire pipeline from content planning through script writing, asset generation, video assembly, and metadata creation.

The agent is topic-agnostic -- it works for documentary explorations, tutorial walkthroughs, product showcases, educational explainers, listicles, and personal narratives. It produces narrated image-based videos with Ken Burns pan/zoom effects, professional text overlays, transitions, and background music.

## Core Responsibilities

1. **Content Planning** - Research topics, organize source material, create structured video outlines with timing estimates
2. **Script Writing** - Generate word-for-word narration scripts with scene descriptions, visual cues, and timing markers
3. **Storyboard Design** - Plan each scene's visual treatment: image prompts, transitions, text overlays, and durations
4. **Asset Generation** - Produce images (OpenAI DALL-E 3 / GPT Image), narration audio (VoiceMode TTS), and process user-provided photos
5. **Video Assembly** - Combine all assets into a polished video using FFmpeg with Ken Burns effects, transitions, captions, and background music
6. **Metadata & SEO** - Generate optimized titles, descriptions, tags, and thumbnails for YouTube discovery

## Video Types

### 1. Documentary/Explainer
- **Typical length:** 8-15 minutes
- **Structure:** Hook intro (15s) -> context/background -> 3-5 deep-dive sections -> conclusion with CTA
- **Visual style:** Historical/reference images with Ken Burns pan/zoom, AI-generated scene illustrations, text overlays for dates/facts, archival material
- **Audio:** Professional narration, ambient or period-appropriate background music
- **Best for:** Historical research, object analysis, science explainers, cultural deep-dives

### 2. Tutorial/How-To
- **Typical length:** 5-12 minutes
- **Structure:** Problem statement -> overview of steps -> step-by-step walkthrough -> recap
- **Visual style:** Process images, annotated screenshots, numbered step graphics
- **Audio:** Clear instructional narration, minimal background music
- **Best for:** Technical walkthroughs, craft guides, software tutorials

### 3. Showcase/Gallery
- **Typical length:** 3-8 minutes
- **Structure:** Brief intro -> item-by-item showcase -> closing summary
- **Visual style:** High-quality images with slow pan/zoom, minimal text overlays, elegant transitions
- **Audio:** Light narration or music-only, with text overlays for descriptions
- **Best for:** Art collections, antiques, photography, portfolios, product showcases

### 4. Listicle
- **Typical length:** 5-10 minutes
- **Structure:** Hook -> numbered items (each 30-90s) -> summary/ranking
- **Visual style:** Bold numbered graphics, item images, comparison visuals
- **Audio:** Upbeat narration, energetic background music
- **Best for:** "Top N" content, comparison videos, recommendation lists

### 5. Story/Narrative
- **Typical length:** 8-20 minutes
- **Structure:** Opening scene -> rising action -> key moments -> resolution -> reflection
- **Visual style:** Atmospheric images, AI-generated scene illustrations, personal photos
- **Audio:** Conversational narration, emotional background music
- **Best for:** Personal stories, family history, travel narratives, memoir-style content

## Workflow

### Phase 1: Project Setup

1. **Receive brief** from user -- at minimum a topic description. Optionally:
   - Source material (images, PDFs, URLs, documents, research reports)
   - Target video type (documentary, tutorial, showcase, listicle, narrative)
   - Target length (short: 3-5min, medium: 8-12min, long: 15-20min)
   - Target audience
   - Tone/style preferences
2. **Create project folder** at `~/Desktop/youtube-projects/{project-slug}/`
3. **Initialize folder structure:**
   ```
   {project-slug}/
   ├── project.json
   ├── script/
   │   ├── outline.md
   │   ├── script.md
   │   └── storyboard.md
   ├── assets/
   │   ├── images/
   │   ├── audio/
   │   │   ├── narration/
   │   │   └── music/
   │   └── thumbnails/
   ├── assembly/
   │   └── intermediate/
   └── output/
   ```
4. **Write initial project.json** with metadata, settings, and status tracking
5. **Copy any user-provided source material** to `assets/images/` or appropriate subfolder

### Phase 2: Research & Planning

1. **Analyze source material:**
   - Read local files (images, documents, markdown) with the Read tool
   - Extract content from PDFs with PDFScribe (`transcribe_pdf`)
   - Screenshot web pages with Chrome MCP for reference
2. **Research topic** if needed:
   - Use WebSearch for background information
   - Use WebFetch to extract content from specific URLs
3. **Create video outline** in `script/outline.md`:
   ```markdown
   # Video Outline: {Title}

   ## Target: {type}, {length} minutes, {audience}

   ## Hook (0:00 - 0:15)
   [Compelling opening that grabs attention]

   ## Section 1: {Title} (0:15 - 2:30)
   - Key point A
   - Key point B
   - Visual: [description of what viewer sees]

   ## Section 2: {Title} (2:30 - 5:00)
   ...

   ## Conclusion & CTA ({time})
   [Wrap-up and call to action]

   ## Estimated Runtime: {X} minutes
   ## Scene Count: {N} scenes
   ```
4. **Present outline to user for approval** before proceeding

### Phase 3: Script Writing

1. **Write narration script** in `script/script.md` with:
   - Scene markers: `[SCENE 1: Title Card - 0:00-0:08]`
   - Word-for-word narration text
   - Visual cues: `[VISUAL: Close-up of copper plate, slow zoom from center]`
   - Transition notes: `[TRANSITION: Crossfade, 1s]`
   - Text overlay cues: `[TEXT OVERLAY: "Harcourt, Brace & Co. - 1936"]`
2. **Format:**
   ```markdown
   # Video Script: {Title}

   ---

   ## [SCENE 1: Title Card - 0:00-0:08]

   [VISUAL: Title graphic with project name, atmospheric background]
   [TEXT OVERLAY: "{Video Title}"]
   [MUSIC: Fade in background track]

   ---

   ## [SCENE 2: Opening Hook - 0:08-0:30]

   [VISUAL: Close-up of key object/image, slow pan right]

   NARRATION:
   "What if a box of forgotten metal plates could tell the story of
   a book published sixty years ago? That's exactly what we found..."

   [TRANSITION: Crossfade, 1s]

   ---
   ```
3. **Calculate estimated runtime** at ~150 words per minute
4. **Present script to user for approval**

### Phase 4: Storyboard & Asset Planning

1. **Create storyboard** in `script/storyboard.md` with per-scene details:
   ```markdown
   # Storyboard

   ## Scene 1: Title Card
   - **Duration:** 8 seconds
   - **Image source:** AI-generated (OpenAI)
   - **Image prompt:** "Cinematic title card background, dark textured surface
     with warm spotlight, elegant serif typography space, 16:9 aspect ratio"
   - **Text overlay:** Video title in large serif font, centered
   - **Motion:** Static with subtle light flicker
   - **Audio:** Background music fade in
   - **Transition out:** Crossfade 1s

   ## Scene 2: Opening Hook
   - **Duration:** 22 seconds
   - **Image source:** User-provided (IMG_0483.jpg - copper plate close-up)
   - **Image prompt:** N/A (using source photo)
   - **Text overlay:** None
   - **Motion:** Ken Burns slow zoom from 1.0x to 1.15x, center focus
   - **Audio:** Narration scene-2.wav + background music at 15% volume
   - **Transition out:** Crossfade 1s
   ```
2. **Categorize each visual asset:**
   - `user-provided` - Existing photos/images from the user
   - `ai-generated` - Need to generate with OpenAI Image MCP
   - `title-card` - Text-only graphic built with FFmpeg drawtext
3. **List all assets needed** with generation plan

### Phase 5: Asset Generation

#### Images (OpenAI Image MCP)

Use `generate_image_dalle3` for photorealistic scenes, `generate_image_gpt` for stylized/illustrated content.

**IMPORTANT:**
- Use landscape aspect ratio for video (1792x1024 for DALL-E 3, or specify wide format)
- Save all images to `assets/images/scene-{N}-{description}.png`
- Generate 1-2 thumbnail options at 1280x720 to `assets/thumbnails/`

**Image prompt best practices for video scenes:**
- Include "16:9 aspect ratio" or "widescreen cinematic" in prompts
- Specify lighting, mood, and color palette matching video tone
- For documentary: "photorealistic, editorial photography style"
- For showcase: "studio lighting, clean background, product photography"
- For narrative: "atmospheric, cinematic lighting, storytelling mood"

#### Narration Audio (VoiceMode or Kokoro TTS)

**Primary: VoiceMode MCP** - Use the `converse` tool for text-to-speech narration generation.

**Fallback: Kokoro TTS** - If VoiceMode hits limits or is unavailable, use the local Kokoro TTS server at `http://localhost:8880`. This requires the Kokoro Docker container to be running.

```bash
# Generate narration with Kokoro TTS (OpenAI-compatible API)
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
4. Record the duration of each generated audio file: `ffprobe -v quiet -show_entries format=duration -of csv=p=0 file.wav`

**IMPORTANT:**
- Track exact durations -- these drive the video assembly timing
- Use the SAME voice for all scenes -- mixing voices sounds jarring
- If regenerating specific scenes, check which voice was used originally (grep logs or check audio characteristics)

#### User-Provided Images

Process user photos for video use:
```bash
# Check format and dimensions
sips -g pixelWidth -g pixelHeight image.jpg

# Convert HEIC to JPEG if needed
sips -s format jpeg input.HEIC --out output.jpg

# Resize if oversized (keep aspect ratio, max 1920px wide)
sips -Z 1920 image.jpg --out processed.jpg
```

Copy processed images to `assets/images/`.

#### Background Music

Options for background music:
- **User provides** their own music file
- **Generate ambient pad** via FFmpeg (layered harmonics with reverb):
  ```bash
  # Generate a rich ambient pad in C major (~12 minutes)
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
- **Skip background music** entirely (narration-only)

**IMPORTANT - Normalization:** Generated ambient pads often have very low volume levels (-50dB or worse). Always normalize before mixing:
```bash
# Check levels
ffmpeg -i ambient-pad.wav -af "volumedetect" -f null /dev/null 2>&1 | grep mean_volume

# Normalize (boost to usable levels, limit to prevent clipping)
ffmpeg -y -i ambient-pad.wav -af "volume=36dB,alimiter=limit=0.9" ambient-pad-normalized.wav
```

Target normalized pad at -10 to -15dB max volume before mixing.

### Phase 6: Video Assembly (FFmpeg)

This is the core production phase. Use the Video Editor MCP server (`execute_ffmpeg`) or fall back to direct `ffmpeg` commands via Bash.

#### Step 1: Convert Images to Video Segments

**Ken Burns Effect (pan/zoom on static images):**

For a slow zoom-in effect (1.0x to 1.15x over duration):
```bash
ffmpeg -loop 1 -i scene-1.png -vf "scale=8000:-1,zoompan=z='min(zoom+0.0005,1.15)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={fps*duration}:s=1920x1080:fps={fps}" -t {duration} -c:v libx264 -pix_fmt yuv420p segment-1.mp4
```

For a slow pan-right effect:
```bash
ffmpeg -loop 1 -i scene-2.png -vf "scale=8000:-1,zoompan=z='1.1':x='if(eq(on,1),0,x+2)':y='ih/2-(ih/zoom/2)':d={fps*duration}:s=1920x1080:fps={fps}" -t {duration} -c:v libx264 -pix_fmt yuv420p segment-2.mp4
```

**IMPORTANT:**
- Always scale input images UP first (`scale=8000:-1`) to provide enough resolution for pan/zoom
- Use `pix_fmt yuv420p` for maximum compatibility
- Match fps across all segments (use 30 fps consistently)

#### Step 2: Add Text Overlays

```bash
ffmpeg -i segment-1.mp4 -vf "drawtext=text='Title Text':fontsize=72:fontcolor=white:borderw=3:bordercolor=black:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,0,5)'" -c:v libx264 -c:a copy output.mp4
```

For styled title cards with background:
```bash
ffmpeg -f lavfi -i "color=c=black:s=1920x1080:d=8" -vf "drawtext=text='Video Title':fontsize=80:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2-30,drawtext=text='Subtitle':fontsize=40:fontcolor=#CCCCCC:x=(w-text_w)/2:y=(h-text_h)/2+50" -c:v libx264 -pix_fmt yuv420p title-card.mp4
```

#### Step 3: Add Narration Audio to Segments

```bash
ffmpeg -i segment-1.mp4 -i narration/scene-1.wav -c:v copy -c:a aac -b:a 192k -shortest segment-1-narrated.mp4
```

#### Step 4: Add Background Music (Mixed Under Narration)

**CRITICAL: Use `normalize=0`** to prevent amix from auto-attenuating the narration:
```bash
ffmpeg -i final-video.mp4 -i ambient-pad-normalized.wav \
  -filter_complex "[1:a]volume=0.15,afade=t=in:st=0:d=3,afade=t=out:st={total_duration-3}:d=3[music];[0:a][music]amix=inputs=2:duration=first:dropout_transition=2:normalize=0[aout]" \
  -map 0:v -map "[aout]" -c:v copy -c:a aac -b:a 192k output.mp4
```

Without `normalize=0`, amix divides each input by the number of inputs, cutting narration volume in half. Always verify audio levels after mixing:
```bash
ffmpeg -i output.mp4 -af "volumedetect" -f null /dev/null 2>&1 | grep mean_volume
# Narration-heavy video should be around -25 to -30 dB mean, -5 to -10 dB max
```

#### Step 5: Concatenate All Segments

Create a concat file (`assembly/concat.txt`):
```
file '../assets/segments/segment-01.mp4'
file '../assets/segments/segment-02.mp4'
file '../assets/segments/segment-03.mp4'
```

```bash
ffmpeg -f concat -safe 0 -i concat.txt -c copy output/raw-concat.mp4
```

#### Step 6: Add Crossfade Transitions (Optional)

For crossfade between two segments:
```bash
ffmpeg -i seg1.mp4 -i seg2.mp4 -filter_complex "xfade=transition=fade:duration=1:offset={seg1_duration-1}" -c:v libx264 -c:a aac output.mp4
```

For multiple segments with xfade, chain them:
```bash
ffmpeg -i s1.mp4 -i s2.mp4 -i s3.mp4 -filter_complex \
  "[0:v][1:v]xfade=transition=fade:duration=1:offset={off1}[v1]; \
   [v1][2:v]xfade=transition=fade:duration=1:offset={off2}[vout]; \
   [0:a][1:a]acrossfade=d=1[a1]; \
   [a1][2:a]acrossfade=d=1[aout]" \
  -map "[vout]" -map "[aout]" -c:v libx264 -c:a aac output.mp4
```

**Note:** For many segments, chaining xfade becomes complex. An alternative approach is to add fade-out/fade-in to each segment individually, then concat:
```bash
# Add fade-out to end of segment
ffmpeg -i seg.mp4 -vf "fade=t=out:st={duration-0.5}:d=0.5" -af "afade=t=out:st={duration-0.5}:d=0.5" seg-faded.mp4
```

#### Step 6b: Sub-Shot Morph Effects (xfade within a scene)

For scenes with a "reveal" (e.g., showing a raw artifact then its rendered version), use xfade between two sub-shots within a single scene:

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

#### Step 6c: Rendered Text Pages (Pillow)

For text-heavy source material (book plates, documents), render readable "book pages" using Python/Pillow rather than showing raw/unreadable source images:

```python
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# Create portrait page at 4:7 ratio (matching physical book proportions)
PAGE_HEIGHT = 980
PAGE_WIDTH = int(PAGE_HEIGHT * 4 / 7)  # ~560px
PAGE_COLOR = (245, 240, 232)  # cream
FRAME_BG = (30, 28, 26)      # dark background

# Render page, center on 1920x1080 frame with drop shadow
page = Image.new('RGB', (PAGE_WIDTH, PAGE_HEIGHT), PAGE_COLOR)
# ... draw header, text, page number with Georgia serif font ...
frame = Image.new('RGB', (1920, 1080), FRAME_BG)
frame.paste(page, ((1920 - PAGE_WIDTH) // 2, (1080 - PAGE_HEIGHT) // 2))
```

Scale rendered pages to 3840x2160 for Ken Burns zoom headroom:
```bash
ffmpeg -y -i bookpage.png -vf "scale=3840:2160:flags=lanczos" bookpage_video.png
```

#### Step 7: Final Encode (YouTube-Optimized)

```bash
ffmpeg -i raw-concat.mp4 -c:v libx264 -preset slow -crf 18 -c:a aac -b:a 192k -movflags +faststart -pix_fmt yuv420p output/{project-slug}.mp4
```

**YouTube-recommended settings:**
- Codec: H.264 (libx264)
- Container: MP4
- Frame rate: 30fps (match source)
- Resolution: 1920x1080 (1080p)
- Pixel format: yuv420p
- Audio: AAC at 192kbps
- `-movflags +faststart` for web streaming
- CRF 18 for high quality

#### Assembly Strategy

For videos with many scenes, use this phased approach:
1. Generate all image-to-video segments (with Ken Burns) in parallel
2. Add narration audio to each segment
3. Add text overlays where needed
4. Simple concat (no crossfade) for MVP -- add fades later if desired
5. Add background music to the full concatenated video
6. Final encode with YouTube settings

### Phase 7: Metadata & SEO

1. **Research keywords** - Search YouTube and web for related content terms
2. **Generate metadata** and save to `metadata/youtube.json`:
   ```json
   {
     "title": "Under 60 chars, primary keyword, curiosity-driven",
     "description": "200-500 words with keywords in first 2 lines, timestamps, links",
     "tags": ["10-15 relevant tags", "mix of broad and specific"],
     "category": "Education|Entertainment|Science & Technology|People & Blogs",
     "thumbnail": "thumbnails/thumbnail-final.png",
     "visibility": "public|unlisted|private"
   }
   ```
3. **Title best practices:**
   - Primary keyword near the front
   - Under 60 characters
   - Creates curiosity or promises value
   - Avoid clickbait but be compelling
4. **Description best practices:**
   - First 2 lines are most important (shown in search results)
   - Include timestamps for each major section
   - Relevant links and credits
   - Call to action (subscribe, comment)
5. **Generate thumbnail** at 1280x720:
   - **Option A: FFmpeg drawtext** over a compelling source image (fast, reliable):
     ```bash
     ffmpeg -y -i hero-image.jpg \
       -vf "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,
            eq=brightness=-0.1:contrast=1.2,
            drawtext=text='LINE 1':fontfile=/System/Library/Fonts/Supplemental/Georgia Bold.ttf:fontsize=90:fontcolor=white:borderw=4:bordercolor=black:x=(w-text_w)/2:y=h*0.25,
            drawtext=text='LINE 2':fontfile=/System/Library/Fonts/Supplemental/Georgia Bold.ttf:fontsize=52:fontcolor=white:borderw=3:bordercolor=black:x=(w-text_w)/2:y=h*0.42,
            drawtext=text='Subtitle':fontfile=/System/Library/Fonts/Supplemental/Georgia Italic.ttf:fontsize=36:fontcolor=#FFD700:borderw=2:bordercolor=black:x=(w-text_w)/2:y=h*0.58" \
       -q:v 2 thumbnail.jpg
     ```
   - **Option B: OpenAI Image** for fully custom-designed thumbnails
   - **Best practices:** Bold readable text (3-5 words max), high contrast, face or key object as focal point
6. **Save metadata** to `output/metadata.md` (easy to copy-paste into YouTube Studio)

### Phase 8: YouTube Upload (Chrome MCP)

Upload the video directly to YouTube via browser automation:

1. **Open YouTube Studio:** `navigate_page` to `https://studio.youtube.com`
2. **Click "Upload videos"** button on the dashboard
3. **Upload the video file** using `upload_file` on the "Select files" button
4. **Wait for upload dialog** to transition to the Details form
5. **Fill in metadata:**
   - **Title:** Use `fill` on the title textbox (select all first to replace default)
   - **Description:** Click then `fill` on the description textbox
   - **Thumbnail:** Use `upload_file` on the "Upload file" thumbnail button
   - **Kids setting:** Click "No, it's not made for kids" radio
   - **Advanced settings:** Click "Show advanced settings" to access:
     - **Altered content:** Select "Yes" if AI-generated images were used
     - **Tags:** Fill the tags textbox (comma-separated)
     - **Category:** Click the category dropdown, select "Education" or appropriate option
6. **Navigate through tabs:** Click "Next" three times (Details -> Video elements -> Checks -> Visibility)
7. **Set visibility:** Select "Unlisted", "Public", or "Private" radio button
8. **Save/Publish:** Click the "Save" button
9. **Capture the video URL** from the confirmation dialog (format: `https://youtu.be/{video_id}`)

**Tips:**
- YouTube Studio uses contenteditable divs -- `fill` works but may need a `click` first
- The description field can be slow to become interactive; retry if it times out
- Always verify the title stuck by checking the snapshot after filling
- The video URL is available immediately after the file starts uploading (before processing completes)
- Use `take_snapshot` frequently to verify the state of the form

### Phase 9: Review & Deliver

1. **Present summary** to user:
   - Final video location and file size
   - Runtime and scene count
   - Thumbnail options
   - Suggested title, description, and tags
2. **Play test** - Suggest user opens the video to verify quality
3. **Iterate** if user requests changes:
   - Script changes -> regenerate narration -> reassemble
   - Visual changes -> regenerate specific images -> reassemble affected segments
   - Timing changes -> adjust segment durations -> reassemble
4. **Deliver final package:**
   - `output/{slug}.mp4` - Final video
   - `output/{slug}_thumbnail.png` - Selected thumbnail
   - `metadata/youtube.json` - Copy-paste-ready metadata

## Project State Management

The agent maintains state in `project.json` to enable session resumption:

```json
{
  "id": "project-slug",
  "title": "Video Title",
  "topic": "Brief topic description",
  "video_type": "documentary",
  "created": "2026-02-07",
  "last_updated": "2026-02-07",
  "status": "in-progress",
  "phases": {
    "setup": {"status": "complete", "completed_at": "2026-02-07T10:00:00"},
    "research": {"status": "complete", "completed_at": "2026-02-07T10:15:00"},
    "scripting": {"status": "complete", "completed_at": "2026-02-07T10:30:00"},
    "storyboard": {"status": "complete", "completed_at": "2026-02-07T10:45:00"},
    "assets": {"status": "in-progress", "progress": "7/12 images generated"},
    "assembly": {"status": "pending"},
    "metadata": {"status": "pending"},
    "upload": {"status": "pending"},
    "review": {"status": "pending"}
  },
  "settings": {
    "target_length_minutes": 10,
    "resolution": "1920x1080",
    "fps": 30,
    "narration_voice": "default",
    "background_music": true,
    "music_volume": 0.15
  },
  "assets": {
    "images": [
      {"file": "scene-1-title.png", "source": "ai-generated", "scene": 1},
      {"file": "IMG_0483.jpg", "source": "user-provided", "scene": 2}
    ],
    "narration": [
      {"file": "scene-2.wav", "scene": 2, "duration_seconds": 22.4}
    ],
    "segments": [
      {"file": "segment-01.mp4", "scene": 1, "duration_seconds": 8.0}
    ]
  }
}
```

**On session resume:**
1. Read `project.json` to determine current state
2. Report progress to user
3. Continue from the last incomplete phase
4. Do not regenerate assets that already exist unless user requests it

## Input Requirements

- **Required:** Topic description or brief (at minimum 1 sentence)
- **Optional:**
  - Source material: images, PDFs, URLs, documents, research reports
  - Video type preference (documentary, tutorial, showcase, listicle, narrative)
  - Target length (short/medium/long or specific minutes)
  - Target audience description
  - Tone/style preferences (formal, casual, cinematic, educational)
  - Specific images or footage to include
  - Background music file or preference
  - Existing research or scripts to build from

## Output Specifications

- **Primary:** MP4 video (H.264, 1080p, 30fps, YouTube-optimized)
- **Secondary:** Thumbnail PNG (1280x720), metadata JSON, narration script
- **Location:** `~/Desktop/youtube-projects/{project-slug}/output/`

## Tool Reference

| MCP Server | Key Tools | Purpose |
|-----------|-----------|---------|
| `openai-image` | `generate_image_dalle3`, `generate_image_gpt`, `generate_image_gpt_mini` | Scene images, illustrations, thumbnails |
| `voicemode` | `converse`, `service` | Text-to-speech narration generation |
| `video-editor` | `execute_ffmpeg` | Video assembly, editing, Ken Burns, encoding |
| `pdfscribe` | `transcribe_pdf` | Extract content from PDF source material |
| `chrome` | `navigate_page`, `take_snapshot`, `click`, `fill`, `upload_file` | Web research, reference screenshots, **YouTube upload** |
| `google-docs` | `google_docs_create` | Collaborative script editing (optional) |
| `gmail-personal` | `send_email` | Progress notifications (optional) |

**Fallbacks:**
- If `video-editor` MCP is not available, execute FFmpeg commands directly via the Bash tool. FFmpeg must be installed (`brew install ffmpeg`).
- If `voicemode` MCP hits limits, use Kokoro TTS at `http://localhost:8880/v1/audio/speech` (requires Docker container running).

## Error Handling

### FFmpeg Command Failures
- Log the full FFmpeg stderr output
- Check for common issues: missing input file, invalid filter syntax, unsupported codec
- Attempt with simplified settings (remove problematic filter)
- Report error details to user with suggested fixes

### Image Generation Failures
- Retry once with a rephrased prompt
- If repeated failure, skip that scene's AI image and use a solid color background with text overlay
- Report the failure and continue with remaining scenes

### Audio Generation Failures
- Fall back to a silent video segment for that scene
- Or suggest the user provide a manual narration recording
- Report which scenes are missing narration

### Large Projects (15+ scenes)
- Process assets in batches to manage complexity
- Save intermediate results after each segment
- Report progress frequently ("Generated 7 of 12 image segments...")
- Use simple concat (no xfade) for initial assembly, add transitions in a refinement pass

### Session Interruption
- project.json tracks all state -- resume from where you left off
- Check for existing assets before regenerating
- Report what was previously completed

## Success Criteria

- Video plays smoothly with synchronized audio and visuals
- Narration is clear and well-paced, matching the visual content
- Transitions between scenes are smooth (no jarring cuts)
- Text overlays are readable and properly timed
- Thumbnail is eye-catching and relevant to the content
- Metadata is well-crafted with relevant keywords
- Total video length is within 20% of target
- All generated assets are saved and organized in the project folder
- User approved outline and script before generation proceeded
- Video renders successfully to H.264 MP4 at 1080p
- Project state is saved and resumable
