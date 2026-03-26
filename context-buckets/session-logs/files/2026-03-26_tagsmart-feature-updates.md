# TagSmart v2: Post-Migration Feature Updates

**Date:** 2026-03-26
**Session type:** execution
**Agents involved:** Direct work (no team orchestrator)

## Summary

After migrating TagSmart to the mini PC, field testing revealed several issues and UX improvements needed. Fixed vision scan API key configuration, unified the vision scan + incident reporting into a single workflow, fixed the broken static map, added admin-only incident deletion, and added tag/asset info capture on incidents from the scan flow.

## Key Findings

- Vision scan failed because `OPENAI_API_KEY` env var was empty — service only checked env var, not the `vision_api_key` setting in DB
- The `vision_api_key` field existed in the settings table but the service code explicitly excluded it (`HIDDEN_KEYS`)
- `staticmap.openstreetmap.de` is dead (DNS not resolving) — was the static map provider for incident locations
- The `untagged_vehicles` table was missing `status` and `updated_at` columns after Turso migration (added post-migration in initial schema)
- Scan → Report Incident flow didn't pass `tag_number` or `asset_type` to the incident — the incidents table didn't even have those columns

## Decisions Made

- **API key as admin setting** — Vision service now checks `config.vision_api_key` (settings DB) first, falls back to `OPENAI_API_KEY` env var. Enables "deliver the box, admin adds their own key" model.
- **Unified vision scan workflow** — Single page: Camera → AI Analyze → editable vehicle data + incident type selector + notes → Submit as incident. Eliminated the two-step flow.
- **Incident type required** — Every vision scan creates an incident (no more untagged vehicle staging table)
- **OpenStreetMap iframe embed** — Replaced dead static map with OSM export embed (no API key needed)
- **Tag info on incidents** — Added `tag_number` and `asset_type` columns to incidents table, passed from scan flow

## Artifacts Created

### TagSmart v2 changes (6 commits, all pushed to `nickdnj/tagsmart-v2`)
- `server/src/services/visionService.ts` — API key from settings DB first, then env var
- `server/src/services/settingsService.ts` — Changed from HIDDEN_KEYS (delete) to MASKED_KEYS (show last 4 chars), allow saving API key
- `server/src/schemas.ts` — Added `vision_api_key` to settings schema, `tag_number`/`asset_type` to incident schema
- `client/src/pages/Settings.tsx` — Added OpenAI API Key password field at top of settings page
- `client/src/types/settings.ts` — Added `vision_api_key` to Settings types
- `client/src/pages/VisionScan.tsx` — Rewritten: unified flow with incident type selector + notes
- `client/src/pages/Incidents.tsx` — OSM iframe map, admin delete button with confirm dialog, tag info display
- `client/src/pages/ReportIncident.tsx` — Passes tag_number and asset_type to incident creation
- `client/src/api/incidents.ts` — Added delete() method
- `client/src/types/incident.ts` — Added tag_number, asset_type to Incident and IncidentCreateInput
- `server/src/routes/incidents.ts` — Added DELETE /:id (admin only), tag_number/asset_type in create
- `server/src/repositories/incidentRepository.ts` — Added deleteById(), tag_number/asset_type in select

### Database migrations (applied to live DB on mini PC)
- `untagged_vehicles`: Added `status TEXT NOT NULL DEFAULT 'new'`, `updated_at TEXT`
- `incidents`: Added `tag_number TEXT`, `asset_type TEXT`

## Open Items

- [ ] Decommission Cloud Run service + Turso DB
- [ ] Change admin password from `admin123`
- [ ] Test full scan → incident flow with tag info end-to-end
- [ ] Consider adding tag_number to the vision scan flow too (currently only scan flow captures it)
- [ ] rclone backup email instructions sent — user to complete setup when convenient

## Context for Next Session

TagSmart is fully operational at `https://tagsmart.vistter.com` with all features working. The OpenAI API key is configured via the Settings page (admin). Vision scan is a unified single-page flow that creates incidents directly. The scan (QR) → incident flow now captures tag_number and asset_type. Incidents can be deleted by admins. Maps use OSM iframe embeds. All changes committed and deployed.
