# VistterStream Asset Studio — Comprehensive QA Pass

**Date:** 2026-03-15
**Session type:** execution
**Agents involved:** Software Developer (direct), Chrome Browser (MCP)

## Summary

Executed a comprehensive QA test plan against the VistterStream Asset Studio Phase 1 build. Started local dev environment, created test assets of every type (static_image, api_image, canvas_composite, template instances), tested all UI interactions via Chrome browser automation, found and fixed 9 bugs, and deployed all fixes to production.

## Key Findings

- Asset Studio UI renders well across all component areas (grid, filters, search, edit slide-over, template catalog, canvas editor, export)
- AVIF uploads were rejected when browser/curl sends `application/octet-stream` MIME type
- Template "Test Connection" button created real duplicate assets (no dry-run mode)
- SlideOver component had no slide-in animation (instant open)
- Canvas Editor undo/redo crashed with Fabric.js v6 `clearRect` / `ctx` undefined errors
- `/editor/new` route never created projects — `useParams` returns `undefined` for literal route match, not `'new'`
- CanvasHistoryManager held stale canvas references after React StrictMode remounts
- Upload handler wrote to relative `uploads/assets/` path instead of `UPLOADS_DIR` env var (`/data/uploads/`)
- QuickChart.io URLs with unencoded curly braces caused 502 on the proxy endpoint

## Bugs Fixed (9 total)

| # | Bug | Files Changed |
|---|-----|--------------|
| 1 | Test Connection creates duplicate asset | `templates.py` (new endpoint), `TemplateCatalog.tsx` |
| 2 | AVIF upload rejected (octet-stream MIME) | `assets.py` (extension-based fallback) |
| 3 | SSRF blocks template-generated internal URLs | `assets.py` (allow_internal for template assets) |
| 4 | SlideOver no animation | `SlideOver.tsx` (visible/animateIn state machine) |
| 5 | Fabric.js v6 undo/redo crash | `CanvasHistoryManager.ts` (manual object reconstruction via classRegistry) |
| 6 | Sponsor template no upload guidance | `template_service.py` (description text) |
| 7 | /editor/new doesn't create projects | `CanvasEditorPage.tsx` (handle undefined id) |
| 8 | CanvasHistoryManager stale canvas ref | `CanvasHistoryManager.ts` (getter function pattern) |
| 9 | UPLOAD_DIR not respected in Docker | `assets.py` (use UPLOADS_DIR env var) |

## Commits

- `6b1c909` — Fix 6 bugs from comprehensive Asset Studio QA pass
- `dcf73c3` — Fix canvas editor /new project creation and undo/redo
- `98cf6c8` — Fix upload path to respect UPLOADS_DIR env var

## Test Assets Created on Production

| # | Asset Name | Type | Status |
|---|-----------|------|--------|
| 26 | Test Overlay Image | static_image | Working |
| 27 | QR Code - Saltwater LI | api_image | Working |
| 28 | MLB Scores Chart | api_image | Working (URL-encoded) |
| 29 | Stock Ticker AAPL | api_image | Working (URL-encoded) |
| 30 | Saltwater LI Sponsor | static_image (AVIF->PNG) | Working |
| 31 | Live Host Lower Third | canvas_composite + template | Working (PIL preview) |
| 32 | Acme Corp Sponsor | static_image + template | Working (PIL preview) |

## Screenshots

13 QA screenshots saved to `/tmp/qa_screenshots/` on local dev machine (not persisted).

## Open Items

- [ ] Canvas Editor: layer drag-to-reorder not tested
- [ ] Canvas Editor: keyboard shortcuts (Ctrl+Z, R/C/T/L/V hotkeys) not tested
- [ ] Canvas Editor: autosave timer (60s) not tested
- [ ] Canvas Editor: reload persistence not tested
- [ ] Canvas composites from templates need server-side PNG rendering (currently requires manual export or PIL-generated preview)
- [ ] Old asset #25 (Saltwater Long Island Sponsor) has missing file_path — needs re-upload or cleanup

## Context for Next Session

Asset Studio Phase 1 QA is complete. All major features work in production. The Canvas Editor's undo/redo was the most complex fix — Fabric.js v6 has a bug where `loadFromJSON` crashes on `clearRect`/`getContext`, solved by bypassing `loadFromJSON` and manually reconstructing objects via `classRegistry.getClass()`. React StrictMode caused additional issues with stale canvas references, solved by using a getter function pattern in the CanvasHistoryManager.

The upload path bug (`UPLOADS_DIR` not respected) was a production-only issue where Docker's `/data/uploads` volume mount didn't match the hardcoded relative `uploads/assets` path. Fixed and deployed.
