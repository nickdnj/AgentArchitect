# Storyboard Review Server — multi-tenant

One shared Flask app serving every YouTube project's storyboard review UI.

## Run (Docker — recommended)

```bash
cd teams/youtube-content/storyboard-server
docker compose up -d         # build + start in background, restart unless-stopped
docker compose logs -f       # tail logs
docker compose down          # stop
```

URLs:
- Local: http://localhost:8500
- Tailscale (this Mac): http://100.100.193.125:8500 (or http://macbook-air:8500)

The container binds `0.0.0.0:8500` so any Tailnet device can reach it. The
host's `teams/youtube-content/projects/` directory is bind-mounted into the
container as `/projects`, so edits made via the UI land directly on disk.

## Run (bare Python — dev only)

```bash
cd teams/youtube-content/storyboard-server
pip install -r requirements.txt
python3 server.py            # binds 127.0.0.1:8500 by default
BIND_HOST=0.0.0.0 python3 server.py   # bind all interfaces
```

## URLs

- `/` — picker (list of all discovered projects, "+ New Project" button, archive button per card, file:// link to project folder)
- `/p/<slug>/` — per-project storyboard review UI
- `/api/projects` — JSON list of discovered projects (includes `host_path`)
- `/api/projects/new` — POST `{slug, title}` to create a new project skeleton
- `/api/projects/<slug>/delete` — POST to soft-delete (moves to `_archive/<slug>-<timestamp>/`)
- `/api/host-info` — debug: shows host vs container projects dir

## Discovery

On every request, the server globs
`<PROJECTS_DIR>/*/storyboard-app/storyboard-data.json`.
New projects appear on page refresh — no restart needed. The `_archive/`
folder is one level deeper so archived projects don't show up.

## Soft-delete

The "Archive" button on each project card moves the project folder to
`<PROJECTS_DIR>/_archive/<slug>-<YYYYMMDD-HHMMSS>/`. Nothing is recursively
deleted. To restore, `mv` the folder back to `<PROJECTS_DIR>/<slug>/`.

## Config (env vars)

| Var | Default | Purpose |
|---|---|---|
| `PROJECTS_DIR` | `../projects` | Where storyboard projects live |
| `HOST_PROJECTS_DIR` | same as `PROJECTS_DIR` | Host-side path shown in picker UI (so you can copy/click into Finder) |
| `BIND_HOST` | `127.0.0.1` (bare) / `0.0.0.0` (Docker) | Bind address |
| `PORT` | `8500` | Listen port |

Upload cap is **500 MB** per file (hard-coded).

## Files

- `Dockerfile` — python:3.12-slim + ffmpeg + gunicorn
- `docker-compose.yml` — bind-mount projects/, publish 8500
- `requirements.txt` — flask + gunicorn
- `server.py` — Flask app (all routes)
- `picker.html` — home page / project list + create + archive modals
- `index.html` — per-project review UI (reads slug from URL)
- `generate-budget-report.py` — CLI for per-project pacing reports
