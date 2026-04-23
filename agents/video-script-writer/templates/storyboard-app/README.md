# Storyboard Review App (v2 template)

Single-user localhost web app for reviewing a YouTube storyboard: scene cards with
multi-asset attach/delete, per-scene narration WAV playback, auto-saving notes.

## Bootstrap into a new project

```bash
cp -r agents/video-script-writer/templates/storyboard-app \
      teams/youtube-content/projects/<project-slug>/storyboard-app
mv teams/youtube-content/projects/<project-slug>/storyboard-app/storyboard-data.json.tpl \
   teams/youtube-content/projects/<project-slug>/storyboard-app/storyboard-data.json
```

Edit `storyboard-data.json` to fill in `project`, `date`, `total_runtime`, `scenes[]`,
and `thumbnails[]`. Leave `image_path` pointing at the expected scene image path even
if the image doesn't exist yet — the app shows a placeholder until upload.

## Run locally

```bash
pip install flask   # one-time
cd teams/youtube-content/projects/<project-slug>/storyboard-app
python3 server.py
# open http://localhost:8501
```

## Port convention

Assign each project the next free port starting at 8501 (ocean-vs-space-dc = 8501,
jersey-stack-ep1 = 8502, etc.). Edit the `PORT` constant at the top of `server.py`
for that project. Record the chosen port in the project's `project.json` under
`storyboard_app.port`.

## Directory layout assumed by the server

```
<project>/
├── assets/
│   ├── images/
│   ├── videos/               (created on first upload)
│   └── audio/narration/scene-NN.wav
└── storyboard-app/
    ├── server.py
    ├── index.html
    └── storyboard-data.json
```

## Data schema

Each scene has an `assets: [{path, type, order}]` array (v2). Legacy `image_path`
strings are auto-migrated to the new schema on first save. `thumbnails[]` use the
same shape as scenes.

Uploads, deletes, and note edits all POST back to the server — nothing is stored
only in the browser.
