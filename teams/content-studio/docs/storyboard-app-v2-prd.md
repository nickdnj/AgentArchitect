# PRD: Storyboard Review App v2 — Multi-Asset + Per-Scene Narration Playback

**Version:** 0.1 (draft)
**Date:** 2026-04-23
**Author:** Nick D. (with Product Requirements agent)
**Status:** Draft — for Software Architecture + Dev review

---

## 1. Problem Statement

The storyboard review web app currently supports one image per scene and has no way to attach/delete assets or audition narration from the browser. Nick reviews every YouTube project in this app (per locked workflow feedback) but still has to open Finder to swap images, has no video support at all, and has no way to listen to per-scene narration WAVs while reviewing. This upgrade turns the app into the single review surface: attach any number of images or videos per scene, delete them, and play the scene's narration WAV with one click.

## 2. Users

- **Nick** — single local user. Runs the app at `localhost:8502`, reviews a storyboard, leaves notes, swaps/deletes assets, auditions audio. No collaborators, no auth, no remote access.

## 3. User Stories

1. As Nick, I want each scene to show ALL attached images and videos (not just one) so I can review multiple takes side-by-side.
2. As Nick, I want to drag-and-drop (or click-browse) new images or videos onto a scene so I can attach fresh assets without leaving the app.
3. As Nick, I want to delete any attached image or video from a scene with a confirm prompt so I can prune bad takes.
4. As Nick, I want a play button on each scene that plays that scene's narration WAV so I can hear the voice-over inline with the visual.
5. As Nick, I want the play button to gracefully show "not generated yet" when the WAV is missing so I'm not confused by silent failures.
6. As Nick, I want existing projects (single `image_path`) to still open and render correctly so I don't have to migrate old projects by hand.
7. As Nick, I want videos to play inline (with standard controls) in the same slot where images render so I can review motion assets in context.
8. As Nick, I want the canonical template of this app to live somewhere reusable so every new YouTube project inherits it without copy-paste.
9. As Nick, I want stats to reflect the new multi-asset reality (e.g. "X scenes have assets" rather than "images generated").
10. As Nick, I want all asset changes to persist to `storyboard-data.json` automatically so nothing is lost on reload.

## 4. Functional Requirements

### 4.1 Multi-asset display
- **FR1.** Each scene card SHALL render a list of all attached assets in order.
- **FR2.** Images SHALL render as `<img>`; videos SHALL render as `<video controls preload="metadata">`.
- **FR3.** If a scene has zero assets, the card SHALL show the existing placeholder ("Image not generated yet").
- **FR4.** Multi-asset rendering SHALL preserve the 16:9 aspect-ratio container style already used.

### 4.2 Upload
- **FR5.** Each scene card SHALL expose an upload control supporting both click-to-browse and drag-drop.
- **FR6.** Accepted types: `.png`, `.jpg`, `.jpeg` (image); `.mp4`, `.mov`, `.webm` (video). Anything else SHALL be rejected client-side with an inline error.
- **FR7.** Uploaded files SHALL be written to `assets/images/` or `assets/videos/` (server creates `assets/videos/` if missing) with filename pattern `scene-NN-<slug>-<shortid>.<ext>` where `<shortid>` is a 6-char random suffix to avoid collisions.
- **FR8.** On successful upload, the scene's asset list in `storyboard-data.json` SHALL be updated and the UI re-rendered.
- **FR9.** Upload failures (type rejected, disk write error, file too large) SHALL display an inline error next to the scene and NOT mutate the JSON.
- **FR10.** Upload size cap: **200 MB per file** (configurable server-side constant). Larger files rejected with a clear message.

### 4.3 Delete
- **FR11.** Each attached asset SHALL have a delete control (small "×" button on hover).
- **FR12.** Delete SHALL require a `confirm()` prompt before proceeding.
- **FR13.** Delete SHALL remove the file from disk AND remove the entry from `storyboard-data.json` atomically (if file delete fails, JSON is not updated).
- **FR14.** Deleting the last asset in a scene SHALL return the card to the placeholder state.

### 4.4 Per-scene narration playback
- **FR15.** Each scene card SHALL have a "Play Narration" button in the scene header.
- **FR16.** Clicking SHALL play `assets/audio/narration/scene-NN.wav` inline via an HTML5 `<audio>` element (hidden or minimal controls — Nick wants "click and it plays").
- **FR17.** If the WAV doesn't exist, the button SHALL be visually disabled with tooltip/label "Not yet generated".
- **FR18.** The app SHALL detect WAV presence on load (single `HEAD` request or server-provided manifest) without 404-spamming the console.
- **FR19.** Playing one scene's narration SHALL pause any other scene currently playing (only one narration at a time).

### 4.5 Backwards compatibility
- **FR20.** On load, if a scene has the legacy string field `image_path` AND no `assets` array, the app SHALL treat it as `assets: [{path: <image_path>, type: "image", order: 0}]` for rendering purposes.
- **FR21.** Migration SHALL be lazy: the JSON is only rewritten with the new schema when the user makes a change (upload/delete/note edit triggering save). Read-only sessions don't mutate old files.
- **FR22.** Once migrated, the `image_path` field MAY be retained alongside `assets` (write-through) so older tooling doesn't break, but the `assets` array is authoritative.

### 4.6 Template extraction
- **FR23.** The storyboard-app source SHALL be relocated to a canonical template path: `teams/youtube-content/_templates/storyboard-app/` containing `server.py`, `index.html`, and a `README.md` with setup instructions.
- **FR24.** A bootstrap helper (shell script or a couple of lines in the video-script-writer SKILL.md) SHALL copy the template into new project directories. Existing projects are NOT force-migrated — they keep working off their current copy.
- **FR25.** The `agents/video-script-writer/SKILL.md` SHALL be updated to remove the PowerPoint storyboard instruction and point at the template instead. *(Out of scope for this PRD's dev work — flag to architect to sequence.)*

### 4.7 Stats & UI polish
- **FR26.** The stats bar "X images generated" metric SHALL be replaced with "X scenes with assets" (count of scenes where `assets.length > 0`).
- **FR27.** No change to sidebar, notes, chapter headers, or thumbnail section behavior.

## 5. Data Model Changes

### Before (current schema per scene)
```json
{
  "id": 1,
  "chapter": 1,
  "chapter_title": "...",
  "title": "...",
  "duration": "0:00-0:25 (25s)",
  "narration": "...",
  "visual": "...",
  "image_prompt": "...",
  "text_overlay": "...",
  "motion": "static",
  "music": "...",
  "transition": "...",
  "image_path": "assets/images/scene-01.png",
  "audio_status": "Gate 1 WAV OK — no re-record",
  "notes": ""
}
```

### After (v2 schema per scene)
```json
{
  "id": 1,
  "chapter": 1,
  "chapter_title": "...",
  "title": "...",
  "duration": "0:00-0:25 (25s)",
  "narration": "...",
  "visual": "...",
  "image_prompt": "...",
  "text_overlay": "...",
  "motion": "static",
  "music": "...",
  "transition": "...",
  "assets": [
    { "path": "assets/images/scene-01.png", "type": "image", "order": 0 },
    { "path": "assets/videos/scene-01-drone-take2-a1b2c3.mp4", "type": "video", "order": 1 }
  ],
  "image_path": "assets/images/scene-01.png",  // optional legacy mirror (first image)
  "narration_audio": "assets/audio/narration/scene-01.wav",  // optional, convention-based if omitted
  "audio_status": "Gate 1 WAV OK — no re-record",
  "notes": ""
}
```

### Backwards-compat rules (read path)
- If `assets` is present → use it verbatim.
- Else if `image_path` is a non-empty string → synthesize `assets = [{path: image_path, type: "image", order: 0}]` in memory.
- Else `assets = []` (placeholder shown).

### Write path
- On any save triggered by upload/delete/note edit, write the full v2 schema with `assets` populated. Legacy `image_path` is set to the first image in `assets` (or omitted if no images) for transitional compatibility. The app never deletes existing keys it doesn't understand — unknown fields round-trip untouched.

## 6. API Endpoints (Python server)

Current endpoints:
- `GET /` → serves `index.html`
- `GET /assets/*` → streams files from `<project>/assets/`
- `POST /save` → writes full JSON body to `storyboard-data.json`

### New / changed endpoints

| Method | Path | Purpose | Request | Response |
|---|---|---|---|---|
| `POST` | `/upload` | Upload an image or video for a scene | `multipart/form-data`: `scene_id` (int), `file` (binary), `type` ("image" \| "video") | `200 {"status":"ok", "asset": {"path":"assets/images/scene-01-xxx.png", "type":"image", "order":2}}` or `4xx/5xx {"error":"..."}` |
| `POST` | `/delete-asset` | Remove a file from disk and return confirmation (JSON update stays client-side → `/save`) | `application/json`: `{"path": "assets/images/scene-01-xxx.png"}` | `200 {"status":"deleted"}` or `404/500 {"error":"..."}` |
| `GET` | `/audio-manifest` | Returns which scene narration WAVs exist on disk, so the UI can pre-disable missing play buttons | — | `200 {"1": true, "2": true, "3": false, ...}` |
| `GET` | `/assets/audio/narration/scene-NN.wav` | Already works via existing `/assets/*` passthrough, but the handler needs to add `Content-Type: audio/wav` for WAVs | — | WAV stream |

### Security/validation notes (keep simple)
- `/upload`: verify `type` is `image` or `video`, verify extension is in allowlist, enforce size cap, sanitize filename (no path separators, no `..`).
- `/delete-asset`: path MUST start with `assets/` after normalization. Reject anything that resolves outside the project root. No deleting `storyboard-data.json`, `index.html`, `server.py`, etc.
- `/save`: unchanged.
- No auth (localhost only, consistent with current design).

### Dependencies
- Python stdlib `http.server` supports `multipart/form-data` only awkwardly. Recommend using `cgi.FieldStorage` (stdlib, deprecated but functional in 3.11/3.12) OR upgrading to `python-multipart` (tiny dep). **Flag to architect** — see open questions.

## 7. Open Questions for Architect / Developer

1. **Multipart handling.** Stick with stdlib-only (`cgi.FieldStorage`, works but deprecated in 3.12+) or add `python-multipart` / switch server to `Flask` or `Starlette`? Nick's preference is "stay simple" — current app is 484 lines and should stay in that ballpark. Recommend stdlib unless stdlib path becomes noticeably uglier than a tiny dep.
2. **Template bootstrap mechanism.** Shell script (`bin/new-youtube-project.sh`), a line in video-script-writer's SKILL, or a one-shot `python -m` script? Depends on how new YouTube projects get spun up today (manual, I think).
3. **Thumbnail section.** Thumbnails currently have `image_path` too (see `storyData.thumbnails`). Do we apply the same multi-asset treatment to thumbnails in v2, or keep them single-image for now? **Recommend: v2 scope = scenes only.** Thumbnails stay single-image; revisit in v2.1 if needed.
4. **Reordering.** FR1 says "in order" — should v2 ship with drag-to-reorder in the UI, or is display-order-by-upload-order good enough for v1? **Recommend: v1 = order-by-upload (no reorder UI). Add reorder in v2.1 only if Nick actually wants it.**
5. **Video thumbnails/posters.** Do videos need a poster frame generated (via ffmpeg) for the preview, or is the browser's native "frame 0" preview fine? **Recommend: native preview, no ffmpeg dependency.**
6. **Narration playback UI.** Inline `<audio controls>` element that appears when play is clicked, or a button that silently plays via JS `Audio()` with a stop control? **Recommend: minimal `<audio>` element shown inline when play is clicked, with standard controls so Nick can scrub. Collapses when stopped.**
7. **File cleanup on reload.** If a file exists on disk but isn't in any scene's `assets` (orphaned from a crash mid-delete), do we clean it up? **Recommend: no — leave orphans alone. Adding a cleanup pass risks deleting creator-owned files.**
8. **Retention of `image_path` legacy field.** Keep writing it alongside `assets` forever, or drop it after migration? **Recommend: keep writing it (mirrored to first image) for at least the v2 release — removes the risk that any downstream tooling chokes.**

## 8. Non-Goals

- No multi-user collab, no auth, no WebSocket sync — single local user, localhost only.
- No cloud upload — files land in the local project folder.
- No video editing, trimming, or thumbnail-frame extraction — just attach/delete/display.
- No AI asset generation from inside the app — that's a separate agent's job.
- No reorder UI (v2.1 at earliest, per open question #4).
- No multi-asset treatment for the thumbnails section (v2.1 at earliest, per open question #3).
- No force-migration of existing projects' `storyboard-app/` directories — they keep their old copy and can be upgraded manually if needed.

## 9. Acceptance / Test Plan (sketch for QA)

- Load existing `jersey-stack-ep1-transistor` project → all 30 scenes render from legacy `image_path` field → confirmed placeholder logic works.
- Upload a PNG to scene 1 → appears alongside existing image → JSON updated → reload → still there.
- Upload an MP4 to scene 5 → renders as `<video controls>` → plays inline.
- Upload a `.gif` or `.txt` → rejected with clear error, JSON unchanged.
- Upload a 250 MB file → rejected (size cap), JSON unchanged.
- Delete the second asset on scene 1 → confirm prompt → file gone from disk → JSON has one asset left.
- Click Play Narration on scene 1 → WAV plays. Click Play on scene 2 → scene 1 stops, scene 2 plays.
- Click Play Narration on a scene whose WAV doesn't exist → button is disabled, tooltip explains why.
- Delete all assets from a scene → card shows placeholder again.
- Copy the template folder into a new empty project → run server → app boots clean, empty asset list.

---

## 10. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-04-23 | Nick D. (via Product Requirements agent) | Initial draft |
