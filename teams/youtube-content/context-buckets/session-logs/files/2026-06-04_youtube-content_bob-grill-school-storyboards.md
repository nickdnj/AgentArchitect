# Session: Bob's Grill School — Storyboards + Master Shot List + new storyboard app

**Date:** 2026-06-04
**Team:** youtube-content
**Specialists Invoked:** Video Script Writer

## Request
Nick + Bob are shooting Bob's Grill School episodes 1–5 TODAY. Needed: (1) five
storyboards (one per episode), (2) ONE printable master shot list covering all
five videos to hand Bob in the field, and (3) a NEW storyboard web app enhanced to
support shot lists with a one-asset-per-page model (one image OR one video per
page — no galleries, unlike past videos).

## Actions
- **Video Script Writer** — produced the live-action shot-planning content for the
  canonical 5 episodes (1 Light Your First Charcoal Fire / chimney, 2 Is It Ready?
  Reading Your Coals, 3 Burgers & Dogs, 4 Lighter Fluid the Safe Way, 5 Beat the
  Wind). 38 pages total (Ep1=9, Ep2=7, Ep3=8, Ep4=7, Ep5=7), one asset per page.
  Master shot list = 35 shots in 6 blocks (A unlit / B lighting / C ready-gray /
  D cooking / E to-camera wraparounds / F b-roll+end cards). Key field insight:
  **3 fires, ~2 relights** — Fire 1 (chimney) rides through Ep1→2→3 + Ep5 re-spin
  beat; Fire 2 fresh unlit for Ep4 lighter fluid; Fire 3 fresh unlit for Ep5 wind.
  Tip: light Fire 2 & 3 at adjacent grills back-to-back to parallelize 15-min dead
  time. Five vertical 9:16 grabs flagged (gray-ash reveal, hand test, the flip,
  "never add fluid to lit coals", the 360° spin).
- **Orchestrator (inline)** — built the storyboard app + PDF generator in parallel
  (non-overlapping with the writer). Validated JSON against app schema, generated
  + visually QA'd the PDF (qlmanage), started the app, opened both.

## Artifacts
- `teams/youtube-content/projects/bob-grill-school/storyboard-data.json` — source of truth (5 episodes × pages + shotList)
- `teams/youtube-content/projects/bob-grill-school/shot-list.md` — printable call sheet (markdown, by Script Writer)
- `teams/youtube-content/projects/bob-grill-school/shot-list.pdf` — Letter-landscape print-ready PDF (5pp, by generator)
- `teams/youtube-content/projects/bob-grill-school/generate-shot-list-pdf.py` — standalone PDF generator (reads JSON → Chrome headless)
- `teams/youtube-content/projects/bob-grill-school/storyboard-app/{index.html,server.py,README.md}` — new one-asset-per-page multi-episode app, runs at localhost:8510

## Key Findings
New reusable storyboard-app pattern established for live-action series:
**one-asset-per-page** model (page.type video|image, single page.asset) + per-episode
tabs + a Master Shot List tab grouped by shooting block with Done checkboxes and a
print/PDF path. This differs from the jersey-stack app (scenes[] with multi-asset
assets[] arrays). Captured footage uploads back onto pages via /upload (episode+page).

## Wiki-ingest candidates
- The bbqblog/Bob's Grill School video series now has a dedicated youtube-content
  project (`bob-grill-school`) with storyboards + a reusable one-asset-per-page
  storyboard app. Worth a project page under `wiki/projects/` or a note on the
  existing Wharfside Picnic Guide project page.
- Field rule of thumb for charcoal how-to shoots: plan around fire lifecycle —
  one chimney fire covers light→ready→cook; lighter-fluid and wind demos each need
  their own fresh unlit grill (≈3 fires for a 5-episode beginner series).

---

## Follow-up: drone shots added (separate call sheet)

Nick has his DJI Mini 4K (TRUST-certified, Aloft/LAANC, recreational) and wanted
aerials. Added (via the same Video Script Writer agent):
- **`droneShotList`** in storyboard-data.json — 11 aerials in 5 blocks (establishers/
  reveals, top-downs, orbits/moving hero, Ep5 wind-context, beauty/end-card backdrops).
  D-4 & D-5 (top-downs) flagged vertical. Pre-flight `gearReminder` covers Aloft/LAANC
  airspace + TFR check (coastal), TRUST cert, sub-250g wind sensitivity (with the Ep5
  irony: shoot aerials on a CALMER pass, not the gusty ground-shoot day), VLOS, no
  flying over people, batteries, no low-over-water, 4K + hold time.
- **Drone pages inserted** into Ep1 (9→11) and Ep5 (7→10), `type:video drone:true`.
- **Separate `drone-shot-list.pdf`** (kept out of the already-printed ground shot list).
  Refactored generate-shot-list-pdf.py to a MODES dict: `python3 generate-shot-list-pdf.py
  [ground|drone|all]`. Ground output unchanged.
- App: added **🚁 Drone Shots tab** + a 🚁 badge on drone pages.

Commits: f294e35 (storyboards + ground shot list + app), then drone follow-up commit.

---

## Follow-up: audio + multi-cam rig finalized

- **Audio decision:** iPhone-in-pocket → Voice Memos (Lossless, Airplane Mode) as
  primary voice track; pocket fabric = windscreen (no lav/deadcat). Camera onboard =
  scratch. Clap at head of every take to sync. (Earlier options weighed: bare lav
  w/o deadcat, DIY faux-fur deadcat, AirPods Pro 3 as iOS-26 studio mic.)
- **3-camera rig added:** A-cam iPhone tripod (landscape 16:9 master) · B-cam Meta
  Ray-Ban glasses POV on Bob (portrait → crop-to-16:9/PiP for the master, native for
  9:16 Shorts; glasses double as the vertical-grab machine) · audio = pocket iPhone.
- **Flagged 18 hand-work/critical-move shots + 18 storyboard pages** with `pov:true`
  (📷); NOT the to-camera hooks/CTAs or wide beauty/B-roll. Added `shotList.rigNote`,
  CAMERA A/B gear items. PDF generator + app show 📷 POV chips/badges + rig banner.
- Commits: 096d283 (audio switch), b43e9fe (glasses POV rig). shot-list.pdf,
  drone-shot-list.pdf, shot-list.md, app all current.

---

## Follow-up: ingested Jun-4 test footage + recovered clobbered drone data

- **Test shots reviewed** (in ~/Downloads): 1 iPhone clip `IMG_0802.MOV` (1080p landscape HEVC, on-cam mic mean −46 dB = distant → confirms pocket-mic plan) + 6 DJI clips (1 free-flight + 5 QuickShots, all 1080p h264). Confirmed location = real Kay Park SF163.5 grills in the Wharfside complex; drone shows grills + pool + parking + condos + marina/water. Harsh midday sun → golden hour. Drone tests were 1080p (Mini 4K can do 4K → shoot finals in 4K). QuickShots are complex-wide; still need grill-centric orbit/flyover/reveal.
- **Ingested into storyboard app:** copied all 7 to `assets/videos/` (gitignored, local-only) with clean names; wired 5 onto pages (Ep1 1A iPhone; Ep1 D-2 + Ep5 D-3 drone establisher; Ep1/Ep5 D-11 end-card backdrop), `test:true` + reference notes. Unused (topdown-picnic, topdown-2, reveal-1, reveal-pool) sit in assets ready to drag.
- **DATA-LOSS RECOVERY:** drone pages (Ep1 D-2/D-11, Ep5 D-3/D-9/D-11) and the entire `droneShotList` (11 shots) had been wiped from storyboard-data.json — cause: storyboard app autosave from a stale browser tab (left open from before the drone work) POSTing its old DATA over the file. Restored from commit 8f283f2 and merged with current rig/POV/audio edits. **Hardened `server.py` /save:** timestamped rolling backups (keep 15) before every write + reject empty-episodes payloads. Added project `.gitignore` (assets/videos, assets/images, storyboard-app/backups). **Lesson: always reload the app tab after editing storyboard-data.json out-of-band.**
- Commits: def4bc5 (ingest + recovery + server hardening). PDFs regenerated; both current.
