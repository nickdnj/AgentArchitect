# YouTube Creator Agent - Creation, Setup & First Test

**Date:** 2026-02-07
**Session type:** planning | execution
**Agents involved:** Architect, Explore agents (x3), Plan agent, YouTube Creator agent

## Summary

Created a new general-purpose YouTube Creator agent that produces YouTube-ready MP4 videos from any topic or source material. The agent handles the full pipeline: content planning, script writing, storyboard design, AI image generation, TTS narration, FFmpeg video assembly, and metadata/SEO. Set up the FFmpeg Video Editor MCP server as new infrastructure. Successfully ran a 10-second pipeline test video. Began preparation for the Ivanhoe printing plates documentary video but paused to save state.

## Key Findings

- **Video generation landscape (2026):** Runway Gen-4.5, Pika 2.5, and Google Veo 3.1 all have production APIs for AI video clips. ElevenLabs has an official MCP server for professional TTS.
- **MCP servers available for video:** Video Editor (FFmpeg), ElevenLabs TTS, Runway AI Video, YouTube Uploader, Short Video Maker
- **PyPI `video-editor` package conflict:** The PyPI package named `video-editor` is a different tool (`video-cut`). The MCP server from Kush36Agrawal must be installed from GitHub: `uv pip install 'git+https://github.com/Kush36Agrawal/Video_Editor_MCP.git'`
- **Entry point bug:** The video-editor package's CLI entry point calls `server.main()` which doesn't exist. Workaround: `python -c "from video_editor.server import mcp; mcp.run(transport='stdio')"`
- **FFmpeg 8.0.1** already installed via Homebrew with all needed codecs (libx264, aac, etc.)
- **OpenAI Image MCP not connected in agent sessions** -- the test video agent used curl to the OpenAI REST API directly as a fallback. When delegating to the YouTube Creator agent, may need to pass OPENAI_API_KEY or ensure the MCP is available.
- **Pipeline test successful:** 10-second test video produced at ~/Desktop/youtube-projects/test-clip/output/test-clip.mp4 (2.67 MB, 1080p H.264)

## Decisions Made

- **MVP scope:** VoiceMode for narration (existing), OpenAI images with Ken Burns effects, FFmpeg assembly, MP4 output only (no YouTube upload)
- **No Runway/ElevenLabs in MVP** -- will be added in future phases
- **No YouTube upload in MVP** -- manual upload, avoiding Google OAuth setup
- **Agent is standalone** (not part of a team) -- can collaborate with web-research and pdf-scribe agents
- **5 video types supported:** Documentary/Explainer, Tutorial, Showcase/Gallery, Listicle, Story/Narrative
- **Project folder structure:** `~/Desktop/youtube-projects/{slug}/` with script/, assets/, assembly/, output/ subdirectories
- **Session resumption via project.json** state tracking

## Artifacts Created

### Session 1 (Agent Creation)
- `agents/youtube-creator/SKILL.md` - Full behavioral instructions (~450 lines)
- `agents/youtube-creator/config.json` - Agent configuration with 7 MCP servers
- `agents/youtube-creator/examples/` - Empty directory for future examples
- `.claude/agents/youtube-creator.md` - Generated Claude Code native agent file
- Updated `registry/agents.json` - Added youtube-creator (agent #33)
- Updated `mcp-servers/registry/servers.json` - Added video-editor server entry
- Updated `mcp-servers/assignments.json` - Added video-editor access
- Updated `scripts/generate-agents.js` - Added video-editor and openai-image to MCP_SERVER_MAPPING

### Session 2 (MCP Setup & Testing)
- **video-editor MCP server** installed and connected to Claude Code
- `~/Desktop/youtube-projects/test-clip/` - Pipeline test project folder
- `~/Desktop/youtube-projects/test-clip/output/test-clip.mp4` - 10-second test video (2.67 MB, 1080p, H.264, 30fps)
  - Scene 1 (3s): Title card with drawtext
  - Scene 2 (5s): DALL-E 3 sunset image with Ken Burns zoom
  - Scene 3 (2s): Closing card
  - Background ambient tone, fade transitions

## Infrastructure Changes

- **New MCP server:** `video-editor` - FFmpeg Video Editor, installed from GitHub, connected via stdio
- **MCP mapping fix:** Added `openai-image` to `MCP_SERVER_MAPPING` in generate-agents.js (was missing, pre-existing gap)

## Pipeline Test Results

All pipeline steps verified working:
- DALL-E 3 image generation (via curl fallback)
- FFmpeg drawtext title/closing cards
- FFmpeg zoompan Ken Burns effect on static images
- FFmpeg sine audio generator for background tone
- Fade transitions (video + audio)
- Concat demuxer for joining segments
- YouTube-optimized H.264 encoding (CRF 18, AAC 192k, movflags +faststart)

## Open Items

- [x] ~~Restart Claude Code to activate video-editor MCP~~ (done)
- [x] ~~Test YouTube Creator agent pipeline~~ (10-sec test passed)
- [ ] Build the Ivanhoe printing plates documentary video (next priority -- research loaded, source images identified, was about to launch when session ended)
- [ ] Future Phase 2: Add ElevenLabs MCP for higher-quality narration
- [ ] Future Phase 2: Add Runway API for AI video clip generation
- [ ] Future Phase 3: Add YouTube Uploader MCP for automated publishing
- [ ] Commit the new agent files to git

## Context for Next Session

The YouTube Creator agent is fully built, tested, and ready. The pipeline test video at `~/Desktop/youtube-projects/test-clip/output/test-clip.mp4` proves the full FFmpeg workflow works. The next step is building the **Ivanhoe printing plates documentary video**.

All source material is ready in `context-buckets/research-cache/files/printing-plates-project/`:
- 9 plate photos (JPG, higher quality set: IMG_0483-IMG_0491)
- Rendered versions (flipped, print-simulated, ChatGPT AI renders)
- Full text transcriptions in `rendered/plate-transcriptions.md`
- Reference images (Goodreads cover, Decie Merwin book cover)
- Research reports with provenance, Decie Merwin bio, Eileen Holton connection, market value

The video should be a **Documentary/Explainer** type, ~8-12 minutes, covering the discovery of the plates, what they are, the book they came from, the illustrator (Decie Merwin), the owner (Eileen Holton), and what to do with them. Use the actual plate photos with Ken Burns effects, AI-generated atmospheric images for transitions, and VoiceMode narration.

To resume: invoke the YouTube Creator agent with this brief and the source material paths.
