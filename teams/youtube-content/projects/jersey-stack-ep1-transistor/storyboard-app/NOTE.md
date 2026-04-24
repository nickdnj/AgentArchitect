# ⚠ Per-project storyboard server is deprecated

The canonical storyboard app is now the **multi-tenant** server at:

```
teams/youtube-content/storyboard-server/
```

Start it once, and it auto-discovers every project under `teams/youtube-content/projects/*/storyboard-app/storyboard-data.json`:

```bash
cd teams/youtube-content/storyboard-server
python3 server.py
# → http://127.0.0.1:8500/
# → this project lives at http://127.0.0.1:8500/p/jersey-stack-ep1-transistor/
```

## What's still here

| File | Status |
|---|---|
| `storyboard-data.json` | **active** — the source of truth, read by the multi-tenant server |
| `storyboard-data.json.bak*` | Nick's local backups — harmless |
| `server.py` | **deprecated** — do not run; identical logic now lives in the multi-tenant server |
| `index.html` | **deprecated** — identical logic now lives in the multi-tenant server |

## Why the move

- One server for all YouTube projects (no per-project dance)
- Adds narration-budget enforcement (10s image floor, per-scene capacity badges)
- Drag-drop upload, reorder, delete, per-scene narration playback — all same
- New: `GET /p/<slug>/budget` exposes pacing data for the assembler and for budget reports
