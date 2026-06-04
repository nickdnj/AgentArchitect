# Bob's Grill School — Storyboard App

Multi-episode storyboard review tool with the **one-asset-per-page** model: each
page holds exactly ONE image OR ONE video (never a gallery). Includes a **Master
Shot List** tab — the printable field call sheet.

## Run

```bash
cd teams/youtube-content/projects/bob-grill-school/storyboard-app
python3 server.py            # http://localhost:8510
```

- **Episode tabs** (Ep 1–5): each is a vertical stack of pages. Per page: pick
  Video or Image/Slide, drop the one asset, edit shot metadata (timecode, shot
  type, framing, action, Bob's line, on-screen text, grill state, ⭐ vertical
  grab, notes). Reorder ↑/↓, add/delete pages. **Auto-saves** to
  `../storyboard-data.json`.
- **📋 Master Shot List tab**: gear reminder + shooting order + every shot grouped
  by shooting block, with Done checkboxes. **🖨 Print / Save PDF** button uses the
  browser print dialog.

## Printable shot list (standalone, no server needed)

```bash
cd teams/youtube-content/projects/bob-grill-school
python3 generate-shot-list-pdf.py     # → shot-list.pdf (Letter landscape)
```

This is the file Nick prints and hands to Bob in the field.

## Data

`../storyboard-data.json` is the single source of truth (written by the Video
Script Writer, edited live by this app). Schema: `episodes[].pages[]` (one asset
each) + `shotList.blocks[].shots[]`. Captured footage uploads to `../assets/`.
