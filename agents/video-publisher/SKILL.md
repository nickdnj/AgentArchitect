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

Upload directly via the YouTube Data API v3 using a Python script. This is more reliable than browser automation.

```python
import os
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

YOUTUBE_SCOPES = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube.readonly'
]

# Credentials from environment or config
credentials = Credentials(
    token=None,
    refresh_token=os.environ.get('YOUTUBE_REFRESH_TOKEN'),
    token_uri="https://oauth2.googleapis.com/token",
    client_id=os.environ.get('YOUTUBE_CLIENT_ID'),
    client_secret=os.environ.get('YOUTUBE_CLIENT_SECRET'),
    scopes=YOUTUBE_SCOPES
)

youtube = build('youtube', 'v3', credentials=credentials)

body = {
    'snippet': {
        'title': title[:100],
        'description': description[:5000],
        'tags': tags[:500],
        'categoryId': category_id  # '27' = Education, '22' = People & Blogs, '28' = Science & Technology
    },
    'status': {
        'privacyStatus': visibility,  # 'public', 'unlisted', or 'private'
        'selfDeclaredMadeForKids': False
    }
}

media = MediaFileUpload(video_path, mimetype='video/mp4', resumable=True)

request = youtube.videos().insert(part='snippet,status', body=body, media_body=media)

response = None
while response is None:
    status, response = request.next_chunk()
    if status:
        print(f"Upload progress: {int(status.progress() * 100)}%")

video_id = response['id']
video_url = f"https://youtu.be/{video_id}"
print(f"Upload complete: {video_url}")

# Upload thumbnail (separate API call)
youtube.thumbnails().set(videoId=video_id, media_body=MediaFileUpload(thumbnail_path)).execute()
```

**Prerequisites:**
- `pip install google-api-python-client google-auth-oauthlib`
- Environment variables: `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN`
- OAuth app must have YouTube Data API v3 enabled in Google Cloud Console
- First-time setup requires a one-time OAuth consent flow to get the refresh token

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
