# Clip Editor

A lightweight, on-demand web video clip editor for the storyboard-review workflow.
You open it from an **Edit** link in an Obsidian storyboard doc, visually edit a
scene clip (trim / remove / crop-to-9:16 / split), and save the result back into
the scene — clip overwritten in place, thumbnail regenerated, and a one-line entry
appended to the storyboard's **Revision history**.

- **Server:** Python standard library only (`http.server`). No `pip install`.
- **UI:** one self-contained `index.html` (vanilla JS, no framework, works offline).
- **Needs:** `ffmpeg` + `ffprobe` on `PATH` (already installed on this Mac).
- **Output spec:** vertical 9:16, 1080×1920, H.264 + AAC, 30 fps (re-encoded clean cuts).

It is **generic / config-driven** — nothing about any project is hardcoded. Every
path (clip, thumbnail, scene id, storyboard doc) arrives as a URL query param, so
the same tool serves any storyboard project.

---

## Start it

Double-click **`start-editor.command`** in Finder, or from a terminal:

```bash
cd /Users/nickd/Workspaces/AgentArchitect/teams/youtube-content/tools/clip-editor
python3 server.py
```

It listens on **http://localhost:8770** and prints the base URL. Leave it running
while you edit; `Ctrl-C` to stop. The server only needs to be up during editing.

---

## How you use it

1. Click an **Edit** link for a scene (see link format below). The editor opens
   in your browser with that scene's clip loaded.
2. Pick a **mode**:
   - **Trim** — drag the blue **IN** and green **OUT** handles (or use the
     "Set IN / Set OUT at playhead" buttons) to keep just that range.
   - **Remove section** — drag the two red handles to mark a span to delete; the
     parts before and after are joined.
   - **Crop 9:16** — drag/resize the blue box over the video to pick a 9:16
     region; it's scaled to 1080×1920 on save. The box label shows the live
     source-pixel mapping.
   - **Split** — position the playhead, click "Add split at playhead" for each
     cut point, then save. Exports one new sibling clip per segment.
3. Click **Save** (or **Save as new snippet(s)** in Split mode). A spinner shows
   while ffmpeg runs; the server's result message appears below.

### What Save does
- **Trim / Remove / Crop:** overwrites the scene clip **in place** (same filename,
  so the storyboard's existing `▶ Play` link still resolves). The original is
  copied once to an `originals/` subfolder next to the clip, so edits are
  reversible. The thumbnail is regenerated (frame at ~40 % of the new duration),
  and a dated bullet is appended to the doc's **Revision history**.
- **Split:** creates **new sibling files** (`…-a.mp4`, `…-b.mp4`, …) in the same
  media folder plus a thumbnail for each, and appends a revision line listing the
  new files. The original clip is left untouched. (The tool does **not** rewrite
  scene blocks — it just reports the new files so you can slot them in.)

---

## Edit link format

```
http://localhost:8770/edit?clip=<abs .mp4>&thumb=<abs .jpg>&scene=<id>&doc=<abs .md>
```

All four path values must be **URL-encoded** absolute paths:

| param | what |
|-------|------|
| `clip`  | absolute path to the scene `.mp4` in the project store |
| `thumb` | absolute path to the scene thumbnail `.jpg` (in the wiki) |
| `scene` | scene id/number, used in the revision-history line |
| `doc`   | absolute path to the storyboard markdown doc to append to |

You'd put this as a normal markdown link under each scene, e.g.
`[✂️ Edit clip ↗](http://localhost:8770/edit?clip=…&thumb=…&scene=…&doc=…)`.

### Ready-to-use example — Scene 3 of `vcf-sgi-short`

```
http://localhost:8770/edit?clip=%2FUsers%2Fnickd%2FWorkspaces%2FAgentArchitect%2Fteams%2Fyoutube-content%2Fprojects%2Fvcf-sgi-short%2Fmedia%2Fvcf-sgi-s03.mp4&thumb=%2FUsers%2Fnickd%2FWorkspaces%2Fwiki%2Fraw%2Fvcf-sgi-short%2Fmedia%2Fvcf-sgi-s03.jpg&scene=3&doc=%2FUsers%2Fnickd%2FWorkspaces%2Fwiki%2Fraw%2Fvcf-sgi-short%2Fstoryboard-review.md
```

Decoded, that points at:
- clip  `…/projects/vcf-sgi-short/media/vcf-sgi-s03.mp4`
- thumb `…/wiki/raw/vcf-sgi-short/media/vcf-sgi-s03.jpg`
- scene `3`
- doc   `…/wiki/raw/vcf-sgi-short/storyboard-review.md`

---

## Endpoints (for reference)

| method | path | purpose |
|--------|------|---------|
| GET | `/edit?clip=&thumb=&scene=&doc=` | serves the editor page |
| GET | `/info?path=` | JSON ffprobe info `{width,height,duration,fps}` |
| GET | `/media?path=` | streams the video with HTTP **Range / 206** support (so the `<video>` element can scrub/seek) |
| POST | `/save` | runs the ffmpeg op, writes outputs, returns `{ok,message,newDuration}` |

**Path safety:** `/media`, `/info`, and `/save` only read/write under configured
roots (`teams/youtube-content`, the `wiki`, and temp dirs). Requests for files
outside those roots return `invalid path`. If you use this for a project stored
elsewhere, add its root to `ALLOWED_ROOTS` at the top of `server.py`.

---

## Notes & limitations

- **Port** is fixed at `8770` (one editor at a time). Change `PORT` in `server.py`
  if it clashes.
- Cuts are **re-encoded** (libx264 CRF 18 + AAC) for clean, frame-accurate edits —
  not stream-copied. Saves take a few seconds per clip; that's expected.
- **Split does not rewrite the storyboard scene blocks.** It creates the new files
  and logs them; you slot them into the doc manually (by design).
- The crop box is constrained to **9:16**; resizing keeps that aspect. The
  displayed-to-source pixel mapping accounts for any letterboxing of the `<video>`
  element, so the crop lands on the right source pixels.
- Backups accumulate in `originals/` (one copy per clip, written only the first
  time a clip is edited). Re-editing an already-edited clip won't re-back-up, so
  `originals/` always holds the pristine pre-editor version.
- Local-only tool: binds to `127.0.0.1`, no auth, no external CDNs.

## Verified

On build, all four operations were run against
`projects/vcf-sgi-short/media/vcf-sgi-s06.mp4` (the 6.0 s insect-demo scene) to
temporary outputs and confirmed to produce valid **1080×1920 H.264 + AAC** files;
`/media` Range requests were confirmed to return **206 Partial Content**; and the
revision-history append was confirmed against a temp copy of the storyboard doc
(inserted at the end of the list, newest at bottom). No real clips or docs were
modified during verification.
