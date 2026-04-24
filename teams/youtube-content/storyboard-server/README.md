# Storyboard Review Server — multi-tenant

One shared Flask app serving every YouTube project's storyboard review UI.

## Run

```bash
cd teams/youtube-content/storyboard-server
python3 server.py
```

Then open http://localhost:8500 to see the project picker.

## URLs

- `/` — picker (list of all discovered projects, "+ New Project" button)
- `/p/<slug>/` — per-project storyboard review UI
- `/api/projects` — JSON list of discovered projects
- `/api/projects/new` — POST `{slug, title}` to create a new project skeleton

## Discovery

On every request, the server globs
`teams/youtube-content/projects/*/storyboard-app/storyboard-data.json`.
New projects appear on page refresh — no restart needed.

## Config

- Port: **8500** (hard-coded)
- Upload cap: **500 MB** per file
- Projects dir: defaults to `teams/youtube-content/projects/`; override with
  `PROJECTS_DIR=/abs/path python3 server.py`.

## Files

- `server.py` — Flask app (all routes)
- `picker.html` — home page / project list + create modal
- `index.html` — per-project review UI (reads slug from URL)

## Phase 1 notes

The old per-project `storyboard-app/server.py` copies are still in place as a
safety net. Once this server is verified, they can be deleted.
