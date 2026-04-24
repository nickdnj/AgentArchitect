# Storyboard Review App (v3 template)

Localhost web app for reviewing a YouTube storyboard: scene cards with multi-asset
attach/delete/reorder, per-scene narration WAV playback, auto-saving notes, and
**10-second image floor budget enforcement** (v3).

> **Note — as of v3 the preferred workflow is the multi-tenant server.** This
> template is kept for reference and backwards compatibility. For new YouTube
> projects, just create the `storyboard-data.json` and point the multi-tenant
> server at the project's slug.

## Preferred workflow (multi-tenant — v3)

1. Create the project directory and a minimal storyboard skeleton:

   ```bash
   PROJECT=<your-project-slug>
   mkdir -p teams/youtube-content/projects/$PROJECT/storyboard-app
   cp agents/video-script-writer/templates/storyboard-app/storyboard-data.json.tpl \
      teams/youtube-content/projects/$PROJECT/storyboard-app/storyboard-data.json
   mkdir -p teams/youtube-content/projects/$PROJECT/assets/{images,videos,audio/narration}
   ```

2. Start the multi-tenant server (one time, serves every project):

   ```bash
   cd teams/youtube-content/storyboard-server
   python3 server.py
   # → http://127.0.0.1:8500/
   # → your project at http://127.0.0.1:8500/p/$PROJECT/
   ```

3. Edit `storyboard-data.json` to fill in `project`, `total_runtime`, `scenes[]`,
   and `thumbnails[]`. The server re-reads on every request.

## Features (v3)

- Multi-asset per scene (images + videos), drag-drop upload, delete, reorder arrows
- Per-scene narration WAV playback button (reads from `assets/audio/narration/scene-NN.wav`)
- **Per-scene budget badge** — narration length, video length, scene length, max image
  slots, attached count, status (ok/at-capacity/over)
- Image upload guard — disabled at capacity; videos always allowed
- Auto-save on edit, atomic JSON writes on the server
- `GET /p/<slug>/budget` endpoint exposes pacing data for the assembler

## Budget rule

```
scene_duration = max(narration_duration, sum(video_native_durations))
image_time     = scene_duration - video_time
max_images     = floor(image_time / 10)   # safety floor: >= 1 when scene has images and no video
```

Scenes with more images than `max_images` are flagged `over`. The assembler
(`assemble_v4.py` in the project's `assembly/` dir) drops trailing images by
storyboard `order` and logs drops to `output/render-manifest-v4.json`.

## Legacy per-project files (deprecated)

`server.py` and `index.html` in this template directory are the old per-project
single-tenant variants. They still work but are no longer maintained. Use the
multi-tenant server at `teams/youtube-content/storyboard-server/` for new work.

## Data schema

Each scene has an `assets: [{path, type, order}]` array. Legacy `image_path`
strings are auto-migrated to the new schema on first save. Thumbnails use the
same shape as scenes. Narration WAVs live at
`<project>/assets/audio/narration/scene-NN.wav`.
