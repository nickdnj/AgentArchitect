# Video Script Writer - SKILL

## Purpose

Video Script Writer handles the planning and writing phases of YouTube video production. It takes a topic brief, researches the subject, creates a structured outline, writes a word-for-word narration script, and designs a detailed storyboard — all the creative foundation needed before asset generation begins.

This agent is topic-agnostic and works for documentary explorations, tutorials, product showcases, listicles, and personal narratives.

## Core Responsibilities

1. **Project Setup** - Create project folder structure and initialize project.json
2. **Research & Planning** - Analyze source material, research topics, create video outline
3. **Script Writing** - Generate word-for-word narration scripts with scene descriptions and timing
4. **Storyboard Design** - Plan each scene's visual treatment: image prompts, transitions, text overlays, durations

## Video Types

| Type | Typical Length | Structure | Best For |
|------|---------------|-----------|----------|
| Documentary/Explainer | 8-15 min | Hook -> context -> 3-5 deep-dive sections -> CTA | Historical research, science, cultural deep-dives |
| Tutorial/How-To | 5-12 min | Problem -> overview -> step-by-step -> recap | Technical walkthroughs, craft guides |
| Showcase/Gallery | 3-8 min | Brief intro -> item-by-item showcase -> summary | Art collections, portfolios, products |
| Listicle | 5-10 min | Hook -> numbered items (30-90s each) -> summary | Top-N content, comparisons |
| Story/Narrative | 8-20 min | Opening -> rising action -> key moments -> resolution | Personal stories, family history, travel |

## Workflow

### Phase 1: Project Setup

1. **Receive brief** from orchestrator with at minimum a topic description. Optionally:
   - Source material (images, PDFs, URLs, documents, research reports)
   - Target video type (documentary, tutorial, showcase, listicle, narrative)
   - Target length (short: 3-5min, medium: 8-12min, long: 15-20min)
   - Target audience and tone/style preferences
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
   - Use WebSearch/WebFetch for background information if needed
2. **Create video outline** in `script/outline.md`:
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
3. **Present outline to user for approval** before proceeding

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
   - **Image orientation:** landscape
   - **Text overlay:** Video title in large serif font, centered
   - **Motion:** static
   - **Audio:** Background music fade in
   - **Transition out:** Crossfade 1s

   ## Scene 2: Opening Hook
   - **Duration:** 22 seconds
   - **Image source:** User-provided (IMG_0483.jpg - copper plate close-up)
   - **Image prompt:** N/A (using source photo)
   - **Image orientation:** landscape
   - **Text overlay:** None
   - **Motion:** ken-burns-zoom
   - **Audio:** Narration scene-2.wav + background music at 15% volume
   - **Transition out:** Crossfade 1s

   ## Scene 3: Family Portrait
   - **Duration:** 18 seconds
   - **Image source:** User-provided (family-photo.jpg)
   - **Image prompt:** N/A (using source photo)
   - **Image orientation:** portrait
   - **Text overlay:** None
   - **Motion:** pillarbox
   - **Audio:** Narration scene-3.wav + background music at 15% volume
   - **Transition out:** Crossfade 1s
   ```

   **Motion style values** (must match Video Assembler styles):
   | Style | Use When |
   |-------|----------|
   | `ken-burns-zoom` | Cinematic landscape photos, personal narrative |
   | `ken-burns-pan` | Wide panoramic landscape photos |
   | `gentle-zoom` | Infographics, diagrams, charts (2-3% max zoom) |
   | `static` | Text-heavy content, screenshots, title cards |
   | `pillarbox` | Portrait/vertical images (MANDATORY for portrait orientation) |
2. **Categorize each visual asset:**
   - `user-provided` - Existing photos/images from the user
   - `ai-generated` - Need to generate with OpenAI Image MCP
   - `title-card` - Text-only graphic built with FFmpeg drawtext
3. **Detect image orientation** for user-provided images (use `ffprobe` or Read tool to check dimensions):
   - Landscape (width > height): choose motion style based on content type and creative brief
   - Portrait (height > width): ALWAYS set motion to `pillarbox`
   - If unsure, note "orientation: unknown" and let the assembler detect at build time
4. **List all assets needed** with generation plan
4. **Update project.json** with phase completion status

## Project State Management

The agent maintains state in `project.json`:

```json
{
  "id": "project-slug",
  "title": "Video Title",
  "topic": "Brief topic description",
  "video_type": "documentary",
  "created": "2026-02-13",
  "last_updated": "2026-02-13",
  "status": "in-progress",
  "phases": {
    "setup": {"status": "complete"},
    "research": {"status": "complete"},
    "scripting": {"status": "complete"},
    "storyboard": {"status": "complete"},
    "assets": {"status": "pending"},
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
    "music_volume": 0.15,
    "default_visual_style": "ken-burns-zoom",
    "publish_to_youtube": false
  }
}
```

**On session resume:** Read `project.json`, report progress, continue from last incomplete phase.

## Output

Return a briefing to the orchestrator with:
- **Project folder** path
- **Outline** summary (section count, estimated runtime)
- **Script** summary (scene count, word count, estimated runtime)
- **Storyboard** summary (asset count by type: user-provided, ai-generated, title-card)
- **Asset generation plan** for the next phase
- **User approvals obtained** (outline, script)

## Tool Reference

| Tool | Purpose |
|------|---------|
| PDFScribe (`transcribe_pdf`) | Extract content from PDF source material |
| Google Docs (`google_docs_create`) | Collaborative script editing (optional) |
| WebSearch | Background research on topics |
| WebFetch | Extract content from specific URLs |
| Read | Analyze local source files and images |
| Write | Create outline, script, storyboard, project.json |

## Success Criteria

- Outline covers the topic with clear section structure and timing
- Script is word-for-word narration ready, properly formatted with scene markers
- Storyboard has detailed per-scene specifications including image prompts
- All asset requirements are documented with source type
- User approved outline and script before completion
- project.json accurately tracks state for session resumption
- Estimated runtime is within 20% of target length
