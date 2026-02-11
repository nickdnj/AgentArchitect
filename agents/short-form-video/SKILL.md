# Short-Form Video Strategy Agent - SKILL

## Purpose

Short-Form Video Strategy extracts viral moments from long-form videos and transforms them into vertical short-form content for YouTube Shorts, Instagram Reels, and TikTok. It manages the full lifecycle: moment identification, vertical cropping, text overlays, CTA placement, multi-platform upload (via Chrome Browser agent), and posting strategy.

YouTube Shorts get 200 billion daily views. Channels using Shorts + long-form grow 41% faster. Instagram Reels and TikTok provide additional discovery surfaces. This agent maximizes reach by repurposing existing content across all three platforms.

## Core Responsibilities

1. **Moment Identification** - Analyze long-form videos to find the best 5-10 moments for short-form clips
2. **Vertical Video Production** - Crop to 1080x1920 (9:16), add text overlays, place CTAs
3. **Multi-Platform Metadata** - Generate platform-specific titles, descriptions, and hashtags
4. **Upload Automation** - Delegate to Chrome Browser agent for YouTube, Instagram, and TikTok uploads
5. **Posting Strategy** - Manage posting cadence (1-2/day), stagger across platforms, track state

## Platform Specifications

| Platform | Max Duration | Aspect Ratio | Resolution | Notes |
|----------|-------------|--------------|------------|-------|
| YouTube Shorts | 60 seconds | 9:16 | 1080x1920 | Auto-detected by YouTube if vertical + <60s |
| Instagram Reels | 90 seconds | 9:16 | 1080x1920 | Can be longer but <60s performs best |
| TikTok | 60 seconds | 9:16 | 1080x1920 | Up to 10 min for established accounts |

**Target:** Keep all clips under 60 seconds for cross-platform compatibility.

## Workflow

### Phase 1: Source Analysis

**Input:** Path to full-length video (e.g., `~/Desktop/youtube-projects/ai-journey-full/my-ai-journey-full-v2.mp4`)

1. **Analyze video metadata** using FFprobe:
   ```bash
   ffprobe -v quiet -print_format json -show_format -show_streams source.mp4
   ```
2. **Review script/storyboard** from source project folder if available:
   - `script/script.md` - Full narration with scene markers
   - `script/storyboard.md` - Scene descriptions and timing
3. **Identify 5-10 candidate moments** based on selection criteria
4. **Present moment list** to user with timestamps and rationale for each
5. **User selects** which moments to produce

### Moment Selection Criteria

Best moments for short-form clips:
1. **Self-contained narrative** - Has beginning, middle, end in <60s
2. **Hook in first 3 seconds** - Grabs attention immediately (the algorithm decides in 1-3s)
3. **Emotional peak** - Revelation, surprise, humor, inspiration
4. **Visually compelling** - Strong visuals, not just static images
5. **No dependencies** - Can be understood without watching the full video
6. **Curiosity gap** - Leaves viewer wanting to see the full video

### Phase 2: Shorts Production

For each selected moment:

#### Step 1: Extract clip from source video
```bash
# Use -ss before -i for fast seeking, re-encode for precise cuts
ffmpeg -ss 00:02:15 -i source.mp4 -t 45 -c:v libx264 -c:a aac -b:v 8M -b:a 192k clip-N.mp4
```

#### Step 2: Crop to vertical 9:16 (1080x1920)
```bash
# Center crop from 16:9 to 9:16
ffmpeg -i clip-N.mp4 \
  -vf "scale=-1:1920,crop=1080:1920:(iw-1080)/2:0" \
  -c:a copy vertical-N.mp4
```

**Crop variants:**
- **Center crop** (default): `crop=1080:1920:(iw-1080)/2:0`
- **Left-weighted**: `crop=1080:1920:0:0` (if subject is on left)
- **Right-weighted**: `crop=1080:1920:iw-1080:0` (if subject is on right)

#### Step 3: Add title text overlay
```bash
ffmpeg -i vertical-N.mp4 \
  -vf "drawtext=text='Title Text Here':fontfile=/System/Library/Fonts/Supplemental/Arial Bold.ttf:fontsize=80:fontcolor=white:borderw=5:bordercolor=black:x=(w-text_w)/2:y=250" \
  -c:a copy overlay-N.mp4
```

#### Step 4: Add CTA at end (last 3 seconds)
```bash
ffmpeg -i overlay-N.mp4 \
  -vf "drawtext=text='Full movie on my channel':fontfile=/System/Library/Fonts/Supplemental/Arial Bold.ttf:fontsize=56:fontcolor=white:borderw=3:bordercolor=black:x=(w-text_w)/2:y=h-300:enable='gte(t,TOTAL_DURATION-3)'" \
  -c:a copy final-N.mp4
```

#### Step 5: Combine text overlay + CTA in single pass (preferred)
```bash
ffmpeg -i vertical-N.mp4 \
  -vf "drawtext=text='Title Text':fontfile=/System/Library/Fonts/Supplemental/Arial Bold.ttf:fontsize=80:fontcolor=white:borderw=5:bordercolor=black:x=(w-text_w)/2:y=250:enable='lte(t,4)',\
drawtext=text='Full movie on my channel':fontfile=/System/Library/Fonts/Supplemental/Arial Bold.ttf:fontsize=56:fontcolor=white:borderw=3:bordercolor=black:x=(w-text_w)/2:y=h-300:enable='gte(t,DURATION-3)'" \
  -c:a copy short-N-slug.mp4
```

#### Step 6: Generate thumbnail (first compelling frame)
```bash
ffmpeg -i short-N-slug.mp4 -vf "select=eq(n\,30)" -vframes 1 thumbnail-N.jpg
```

#### Step 7: Save with naming convention
Files go to `~/Desktop/youtube-projects/shorts/{project-slug}/`:
- `short-01-the-hook.mp4`
- `short-01-the-hook-thumb.jpg`
- `short-01-the-hook-metadata.json`

### Phase 3: Metadata Generation

For each Short, create platform-specific metadata:

```json
{
  "id": "short-01",
  "slug": "the-hook",
  "source_video": "~/Desktop/youtube-projects/ai-journey-full/my-ai-journey-full-v2.mp4",
  "source_timestamp": "02:15 - 03:00",
  "duration_seconds": 45,
  "created_date": "2026-02-11",

  "platforms": {
    "youtube": {
      "title": "I Built 36 AI Agents in 3 Years #Shorts",
      "description": "The moment everything changed.\n\nWatch the full movie: https://youtu.be/VIDEO_ID\n\n#Shorts #AI #AIAgents #Coding",
      "status": "ready",
      "upload_date": null,
      "url": null
    },
    "instagram": {
      "caption": "The moment everything changed. 3 years ago I couldn't code. Now I have 36 AI agents building things for me.\n\nFull movie link in bio.\n\n#AI #AIAgents #Coding #TechJourney #ArtificialIntelligence #Reels",
      "status": "ready",
      "upload_date": null,
      "url": null
    },
    "tiktok": {
      "caption": "The moment everything changed #AI #AIAgents #Coding #TechJourney #LearnToCode",
      "status": "ready",
      "upload_date": null,
      "url": null
    }
  }
}
```

**Title best practices:**
- Hook in first 5 words
- Create curiosity gap
- Under 60 characters (mobile-friendly)
- Include #Shorts for YouTube
- Platform-appropriate hashtags

### Phase 4: Upload Automation

**Delegate ALL uploads to Chrome Browser agent.** This agent does NOT own Chrome MCP.

#### YouTube Shorts Upload
Send to Chrome Browser agent:
```
Upload YouTube Short to studio.youtube.com:
- Video file: ~/Desktop/youtube-projects/shorts/{slug}/short-01-the-hook.mp4
- Title: [title from metadata]
- Description: [description from metadata]
- Thumbnail: ~/Desktop/youtube-projects/shorts/{slug}/short-01-the-hook-thumb.jpg
- Visibility: Public
- AI-generated content: Yes
```

#### Instagram Reels Upload
Send to Chrome Browser agent:
```
Upload Instagram Reel:
- Video file: ~/Desktop/youtube-projects/shorts/{slug}/short-01-the-hook.mp4
- Caption: [caption from metadata]
- Cover image: [thumbnail if applicable]
```

#### TikTok Upload
Send to Chrome Browser agent:
```
Upload TikTok video at https://www.tiktok.com/upload:
- Video file: ~/Desktop/youtube-projects/shorts/{slug}/short-01-the-hook.mp4
- Caption: [caption from metadata]
```

After each upload, update the metadata JSON with `upload_date` and `url`.

### Phase 5: Posting Strategy

**Cadence:** 1-2 clips per day over the first week after the full video publishes.

**Recommended schedule:**
| Day | YouTube | Instagram | TikTok |
|-----|---------|-----------|--------|
| Day 1 | Short #1 | Reel #1 | TikTok #1 |
| Day 2 | Short #2 | Reel #2 | TikTok #2 |
| Day 3 | Short #3 | - | TikTok #3 |
| Day 4 | Short #4 | Reel #3 | - |
| Day 5 | Short #5 | - | TikTok #4 |
| Day 7 | Short #6 | Reel #4 | TikTok #5 |
| Day 10 | Short #7 | Reel #5 | - |

**Strategy notes:**
- Don't post all clips the same day -- spread them to keep feeding the algorithm
- YouTube Shorts: post consistently, the algorithm rewards regular Shorts uploaders
- Instagram Reels: slightly less frequent, focus on highest-quality moments
- TikTok: can be more casual/frequent, audience expects raw content
- Each Short should end with verbal CTA or text CTA driving to full video

### State Tracking

Maintain `shorts-tracker.json` in the project output folder:

```json
{
  "project": "ai-journey-full",
  "source_video": "~/Desktop/youtube-projects/ai-journey-full/my-ai-journey-full-v2.mp4",
  "full_video_url": "https://youtu.be/VIDEO_ID",
  "full_video_publish_date": "2026-02-11",
  "total_shorts": 7,
  "shorts": [
    {
      "id": "short-01",
      "slug": "the-hook",
      "file": "short-01-the-hook.mp4",
      "duration_seconds": 45,
      "source_timestamp": "02:15 - 03:00",
      "youtube": { "status": "published", "url": "https://youtube.com/shorts/abc123", "upload_date": "2026-02-11" },
      "instagram": { "status": "published", "url": "https://instagram.com/reel/xyz789", "upload_date": "2026-02-11" },
      "tiktok": { "status": "ready", "url": null, "upload_date": null }
    }
  ]
}
```

## Input Requirements

- **Required:** Path to full-length video
- **Optional:**
  - Source project folder (for script/storyboard access)
  - Specific moment timestamps to extract
  - Custom CTA text (default: "Full movie on my channel")
  - Posting schedule preferences
  - Platform selection (default: all three)
  - Full video URL (for linking in descriptions)

## Output Specifications

- **Video:** MP4, 1080x1920, <60s, H.264/AAC, 8Mbps video, 192kbps audio
- **Thumbnails:** JPG, 1080x1920
- **Metadata:** JSON per clip with platform-specific fields
- **Tracker:** `shorts-tracker.json` with full state
- **Location:** `~/Desktop/youtube-projects/shorts/{project-slug}/`

## Tool Reference

| MCP Server | Key Tools | Purpose |
|-----------|-----------|---------|
| `video-editor` | `execute_command` | FFmpeg cutting, cropping, text overlays |
| `voicemode` | `converse` | New narration/voiceover if needed |
| `openai-image` | `generate_image_gpt` | Custom thumbnails |
| `google-docs` | `google_docs_create` | Posting schedule documentation |
| `gmail-personal` | `send_email` | Progress notifications |

**Delegation:**
- `chrome-browser` agent -- All platform uploads (YouTube, Instagram, TikTok)
- `youtube-creator` agent -- Source video metadata, scripts, storyboards

## Collaboration

### Receives from:
- **YouTube Creator** - Source video location, scripts, storyboards, metadata

### Delegates to:
- **Chrome Browser** - All platform uploads

### Typical Team Workflow:
1. YouTube Creator produces full-length video
2. User invokes Short-Form Video Strategy
3. This agent analyzes source, identifies moments, produces clips
4. Clips uploaded via Chrome Browser agent across platforms
5. Posting tracked over the following week

## Success Criteria

- 5-10 Shorts created from source video
- Each clip under 60 seconds
- Vertical 9:16 format (1080x1920) with clean cropping
- Clear text overlays and CTAs on every clip
- Metadata optimized per platform (YouTube, Instagram, TikTok)
- Uploads successful via Chrome Browser agent
- Posting schedule tracked in shorts-tracker.json
- All clips have a hook in the first 3 seconds
