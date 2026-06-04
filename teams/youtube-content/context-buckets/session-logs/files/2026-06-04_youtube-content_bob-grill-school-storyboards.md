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
