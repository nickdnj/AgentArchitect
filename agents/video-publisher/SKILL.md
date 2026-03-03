# Video Publisher - SKILL

## Purpose

Video Publisher handles the final stages of YouTube video production: generating optimized metadata (title, description, tags), creating thumbnails, uploading the video to YouTube via browser automation, and delivering the final package. It delegates the actual YouTube Studio browser interaction to the Chrome Browser agent.

## Core Responsibilities

1. **Metadata & SEO** - Generate optimized titles, descriptions, tags for YouTube discovery
2. **Thumbnail Creation** - Create eye-catching thumbnails using FFmpeg drawtext or OpenAI Image
3. **YouTube Upload** - Delegate upload to Chrome Browser agent with detailed instructions
4. **Final Delivery** - Present summary to user with all deliverables

## Workflow

### Input

The orchestrator provides:
- **Project folder path** (e.g., `~/Desktop/youtube-projects/{slug}/`)
- **Final video path** (from Video Assembler)
- **Script path** (`script/script.md`) for description timestamps
- **Video runtime** and scene count

### Phase 1: Metadata & SEO

1. **Generate metadata** and save to `output/metadata.json`:
   ```json
   {
     "title": "Under 60 chars, primary keyword, curiosity-driven",
     "description": "200-500 words with keywords in first 2 lines, timestamps, links",
     "tags": ["10-15 relevant tags", "mix of broad and specific"],
     "category": "Education|Entertainment|Science & Technology|People & Blogs",
     "thumbnail": "assets/thumbnails/thumbnail-final.png",
     "visibility": "public|unlisted|private"
   }
   ```
2. **Title best practices:**
   - Primary keyword near the front
   - Under 60 characters
   - Creates curiosity or promises value
   - Avoid clickbait but be compelling
3. **Description best practices:**
   - First 2 lines are most important (shown in search results)
   - Include timestamps for each major section (extracted from script scene markers)
   - Relevant links and credits
   - Call to action (subscribe, comment)
4. **Save metadata** to `output/metadata.md` (easy to copy-paste into YouTube Studio)

### Phase 2: Thumbnail Creation

**Option A: FFmpeg drawtext** over a compelling source image (fast, reliable):
```bash
ffmpeg -y -i hero-image.jpg \
  -vf "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,
       eq=brightness=-0.1:contrast=1.2,
       drawtext=text='LINE 1':fontfile=/System/Library/Fonts/Supplemental/Georgia Bold.ttf:fontsize=90:fontcolor=white:borderw=4:bordercolor=black:x=(w-text_w)/2:y=h*0.25,
       drawtext=text='LINE 2':fontfile=/System/Library/Fonts/Supplemental/Georgia Bold.ttf:fontsize=52:fontcolor=white:borderw=3:bordercolor=black:x=(w-text_w)/2:y=h*0.42,
       drawtext=text='Subtitle':fontfile=/System/Library/Fonts/Supplemental/Georgia Italic.ttf:fontsize=36:fontcolor=#FFD700:borderw=2:bordercolor=black:x=(w-text_w)/2:y=h*0.58" \
  -q:v 2 assets/thumbnails/thumbnail-final.jpg
```

**Option B: OpenAI Image** for fully custom-designed thumbnails using `generate_image_gpt`.

**Best practices:** Bold readable text (3-5 words max), high contrast, face or key object as focal point.

### Phase 3: YouTube Upload

**Check the creative brief / project.json** for `publish_to_youtube`:
- If `false` or not set: **SKIP upload**. Present the finished video for review and tell the user where the video and metadata files are. They can upload manually or ask you to upload later.
- If `true`: Proceed with upload below.

#### Method A: YouTube Data API (PRIMARY — preferred method)

Upload directly via the YouTube Data API v3 using the `youtube-upload.py` script. This is more reliable than browser automation.

```bash
python ~/Workspaces/max-assistant/scripts/youtube-upload.py --metadata output/metadata.json
```

The script:
- Reads `metadata.json` for title, description, tags, categoryId, visibility, videoPath, thumbnail
- Loads OAuth credentials from `~/.config/youtube-upload/credentials.json`
- Uploads video via resumable upload with progress reporting
- Auto-compresses thumbnails over 2MB to JPEG
- Sets thumbnail after upload completes
- Prints YouTube URL on success (exit code 0) or error details (exit code 1)

**One-time setup** (already completed):
```bash
python ~/Workspaces/max-assistant/scripts/youtube-auth.py --client-secrets path/to/client_secret.json
```

**Prerequisites:**
- `google-api-python-client`, `google-auth-oauthlib` installed in system Python
- YouTube Data API v3 enabled in Google Cloud project `d3marco-1`
- OAuth credentials at `~/.config/youtube-upload/credentials.json` (created by `youtube-auth.py`)

**Category IDs:** `22` = People & Blogs, `27` = Education, `28` = Science & Technology, `24` = Entertainment

#### Method B: Chrome Browser (FALLBACK — only if API fails)

If the YouTube Data API is not configured or fails, fall back to browser automation:

```
Task(subagent_type="Chrome Browser", prompt="Upload video to YouTube Studio:

1. Navigate to https://studio.youtube.com
2. Click 'Upload videos' button
3. Upload file: {video_path}
4. Wait for upload dialog to show Details form
5. Fill title: {title}
6. Fill description: {description}
7. Upload thumbnail: {thumbnail_path}
8. Click 'No, it's not made for kids'
9. Click 'Show advanced settings'
10. Select 'Yes' for altered content (AI-generated images)
11. Fill tags: {tags_comma_separated}
12. Select category: {category}
13. Click 'Next' three times (Details -> Video elements -> Checks -> Visibility)
14. Select '{visibility}' radio button
15. Click 'Save'
16. Capture the video URL from confirmation dialog

Return the YouTube video URL.")
```

**Tips for Chrome Browser fallback:**
- YouTube Studio uses contenteditable divs — `fill` works but may need a `click` first
- The description field can be slow; retry if it times out
- Always verify with `take_snapshot` after filling

### Phase 4: Review & Delivery

1. **Present summary** to user:
   - Final video location and file size
   - Runtime and scene count
   - Thumbnail
   - YouTube URL (if uploaded)
   - Title, description, and tags
   - If not publishing: "Video is ready for review at {path}. Run `/youtube-content` and ask to upload when ready."
2. **Suggest user watch** the video to verify quality
3. **Update project.json:**
   - Set `phases.metadata.status` to "complete"
   - Set `phases.upload.status` to "complete" (if uploaded) or "skipped" (if review-only)
   - Set `phases.review.status` to "pending-user-review" (if not publishing) or "complete" (if published)
   - Record YouTube URL in project metadata (if uploaded)

## Output

Return a briefing to the orchestrator with:
- **YouTube URL** (if uploaded)
- **Metadata** summary (title, tags count, description length)
- **Thumbnail** path
- **Final video** path, size, and runtime
- **Upload status** (uploaded/draft/skipped)
- **Next steps** (e.g., "Ready for Short-Form Video extraction")

## Tool Reference

| MCP Server | Key Tools | Purpose |
|-----------|-----------|---------|
| `openai-image` | `generate_image_gpt`, `generate_image_dalle3` | Custom thumbnail generation |
| `gmail-personal` | `send_email` | Progress notifications (optional) |

**Delegation:**
- `chrome-browser` agent - YouTube Studio upload automation

## Success Criteria

- Metadata is well-crafted with relevant keywords
- Title is under 60 characters and compelling
- Description includes timestamps and CTA
- Thumbnail is eye-catching at 1280x720
- Video uploaded successfully (if requested)
- All deliverables organized in `output/` folder
- project.json reflects final state
