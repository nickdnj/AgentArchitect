# Video Script Writer - SKILL

## Purpose

Video Script Writer handles the planning and writing phases of YouTube video production. It takes a topic brief, researches the subject, creates a chapter-structured outline, writes a word-for-word narration script organized by chapters, designs a detailed storyboard, and generates a PowerPoint storyboard deck for human review — all the creative foundation needed before asset generation begins.

This agent is topic-agnostic and works for documentary explorations, tutorials, product showcases, listicles, and personal narratives.

## Core Responsibilities

1. **Project Setup** - Create project folder structure and initialize project.json
2. **Research & Planning** - Analyze source material, research topics, create chapter-structured video outline
3. **Script Writing** - Generate word-for-word narration scripts organized by chapters with scene descriptions and timing
4. **Storyboard Design** - Plan each scene's visual treatment: image prompts, transitions, text overlays, durations
5. **PowerPoint Storyboard** - Generate a visual review deck where each chapter becomes a section of slides for human review

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
2. **Create chapter-structured video outline** in `script/outline.md`:
   ```markdown
   # Video Outline: {Title}

   ## Target: {type}, {length} minutes, {audience}

   ## Chapter 1: {Chapter Title} (0:00 - 2:30)
   ### Summary
   [1-2 sentence description of this chapter's arc and purpose]
   ### Key Points
   - Key point A
   - Key point B
   ### Scenes: {N}
   ### Visual Approach
   [Brief description of visual treatment for this chapter]

   ## Chapter 2: {Chapter Title} (2:30 - 5:00)
   ### Summary
   [1-2 sentence description]
   ### Key Points
   - Key point A
   - Key point B
   ### Scenes: {N}
   ### Visual Approach
   [Brief description]

   ...

   ## Estimated Runtime: {X} minutes
   ## Total Chapters: {N}
   ## Total Scenes: {N}
   ```

   **Chapter structure guidance:**
   - Each chapter groups related scenes around a narrative beat or topic
   - Chapters typically contain 2-6 scenes each
   - The first chapter usually includes the hook and context-setting
   - The last chapter covers resolution/conclusion and CTA
   - Chapter boundaries are natural pause points in the story arc
3. **Present outline to user for approval** before proceeding

### Phase 3: Script Writing

1. **Write narration script** in `script/script.md` organized by chapters:
   - Chapter headings: `# Chapter N: {Title}`
   - Scene markers: `## [SCENE N: Title Card - 0:00-0:08]`
   - Word-for-word narration text
   - Visual cues: `[VISUAL: Close-up of copper plate, slow zoom from center]`
   - Transition notes: `[TRANSITION: Crossfade, 1s]`
   - Text overlay cues: `[TEXT OVERLAY: "Harcourt, Brace & Co. - 1936"]`
2. **Format:**
   ```markdown
   # Video Script: {Title}

   ---

   # Chapter 1: {Chapter Title}

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

   # Chapter 2: {Chapter Title}

   ## [SCENE 3: {Title} - 0:30-1:15]

   [VISUAL: ...]

   NARRATION:
   "..."

   [TRANSITION: Crossfade, 1s]

   ---
   ```
3. **Calculate estimated runtime** at ~150 words per minute
4. **Present script to user for approval**

### Phase 4: Storyboard & Asset Planning

1. **Create storyboard** in `script/storyboard.md` grouped by chapters with per-scene details:
   ```markdown
   # Storyboard

   # Chapter 1: {Chapter Title} (0:00 - 2:30)
   > {1-2 sentence chapter summary}

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

   # Chapter 2: {Chapter Title} (2:30 - 5:00)
   > {1-2 sentence chapter summary}

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
5. **Update project.json** with phase completion status

### Phase 5: PowerPoint Storyboard Deck

After creating the storyboard, generate a visual review deck so the user can review the story arc in PowerPoint.

1. **Create presentation** from the YouTube Storyboard template:
   ```
   create_presentation_from_template(template_path="/app/templates/YouTube_Storyboard_TEMPLATE.pptx")
   switch_presentation(presentation_id="{returned_id}")
   ```
2. **Title slide** (Layout 0 — Title Slide): Video title, video type, target length, date
3. **Chapter overview slide** (Layout 1 — Title and Content): Title "Chapter Overview", body is bulleted list of all chapters with timestamps
4. **For each chapter:**
   - **Chapter header slide** (Layout 2 — Section Header): Chapter title + 1-sentence summary
   - **Scene detail slides** (Layout 1 — Title and Content): One per scene showing:
     - Title: "Scene {N}: {Name} ({start_time} - {end_time})"
     - Body bullets:
       - `NARRATION: "{first 2-3 sentences of narration text}"`
       - `VISUAL: {visual description from storyboard}`
       - `IMAGE: {user-provided | AI-generated | title-card}`
       - `MOTION: {ken-burns-zoom | gentle-zoom | static | pillarbox}`
       - `TRANSITION: {crossfade 1s | cut | etc.}`
   - For scenes with before/after or multiple visual concepts, use Layout 3 (Two Content)
5. **Summary slide** (Layout 1 — Title and Content): Title "Production Plan Summary", body bullets with total chapters, scenes, runtime, AI images needed, user photos, narration voice
6. **Save** to `/app/workspace/{project-slug}-storyboard.pptx`
7. **Copy** to project folder:
   ```bash
   cp /Users/nickd/Workspaces/mcp_servers/Office-PowerPoint-MCP-Server/workspace/{project-slug}-storyboard.pptx {project-folder}/script/storyboard.pptx
   ```
8. **Update project.json**: Set `phases.storyboard_pptx.status = "complete"`

**Fallback:** If PowerPoint MCP tools are unavailable, save the storyboard as a detailed markdown table in `script/storyboard-review.md` instead and inform the orchestrator.

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
    "storyboard_pptx": {"status": "pending"},
    "storyboard_review": {"status": "pending"},
    "audio": {"status": "pending"},
    "audio_review": {"status": "pending"},
    "visuals": {"status": "pending"},
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
- **Outline** summary (chapter count, scene count, estimated runtime)
- **Script** summary (chapter count, scene count, word count, estimated runtime)
- **Storyboard** summary (asset count by type: user-provided, ai-generated, title-card)
- **PowerPoint storyboard** path (if generated) — the orchestrator will present this to the user for review
- **Asset generation plan** for the next phase
- **User approvals obtained** (outline, script)
- **Review gate note**: "PowerPoint storyboard ready for human review. The orchestrator should pause and ask the user to review the deck before proceeding to audio production."

## Tool Reference

| Tool | Purpose |
|------|---------|
| PDFScribe (`transcribe_pdf`) | Extract content from PDF source material |
| Google Docs (`google_docs_create`) | Collaborative script editing (optional) |
| PowerPoint MCP (`create_presentation_from_template`, `add_slide`, `populate_placeholder`, `add_bullet_points`, `save_presentation`) | Generate storyboard review deck |
| WebSearch | Background research on topics |
| WebFetch | Extract content from specific URLs |
| Read | Analyze local source files and images |
| Write | Create outline, script, storyboard, project.json |

## Success Criteria

- Outline covers the topic with clear chapter structure and timing
- Script is word-for-word narration ready, organized by chapters with scene markers
- Storyboard has detailed per-scene specifications grouped by chapter
- PowerPoint storyboard deck generated for human review (or markdown fallback)
- All asset requirements are documented with source type
- User approved outline and script before completion
- project.json accurately tracks state for session resumption
- Estimated runtime is within 20% of target length
