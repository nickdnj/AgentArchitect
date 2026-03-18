# TagSmart v2 — Incident Reporting System

**Date:** 2026-03-18
**Session type:** execution
**Agents involved:** software-project (direct, voice mode)

## Summary

Built a complete incident reporting system for TagSmart v2 from scratch — database schema, API routes, GCS image storage, and full React UI. Implemented inline camera capture with AI vehicle analysis, GPS geolocation, interactive maps, and a management dashboard with status workflow. Deployed to production as revisions 13-19 (fixing multiple bugs along the way).

## Key Findings

- GCS upload can be done without any SDK — use Cloud Run's metadata server to get ADC token, then POST to GCS REST API directly. Zero new dependencies.
- `Buffer` is not assignable to `BodyInit` in TypeScript strict mode — must wrap with `new Uint8Array(buffer)` for fetch body
- State variable named `location` conflicts with browser's global `window.location` (type `Location`) — causes TS build error; renamed to `geoLocation`
- `express-rate-limit` logs X-Forwarded-For warnings behind Cloud Run load balancer — requires `app.set('trust proxy', 1)`
- `command | tail -N` changes exit code to tail's (always 0), masking build failures in Cloud Build pipelines
- Drizzle left join with computed column: define a column selection object, pass to `.select()`, use `.leftJoin()` — avoids N+1 for reporter names
- OpenStreetMap has a free iframe embed (`/export/embed.html`) that works without any API key, perfect for displaying incident locations

## Decisions Made

- 6 incident types: parking_violation, notice, security, abandoned, found_fob, lost_fob
- 3 status states: new → acknowledged → resolved (with Reopen for resolved)
- Image stored to GCS bucket `pdfscribe-prod-uploads` under `tagsmart/vision-scans/{date}/{uuid}.jpg`
- Reporter identity: left join with users table, `coalesce(display_name, username)`
- Geolocation: captured on form mount via `navigator.geolocation.getCurrentPosition()`, stored as lat/lng columns
- Map display: OpenStreetMap iframe + Google Maps deep link when lat/lng present
- Incident row design: accordion (summary always visible, click to expand full detail)
- `DetailField` component always renders — shows `—` for null values (not hidden)

## Artifacts Created

- `server/db/schema.ts` — Added `incidents` table with 3 indexes (type, status, created_at)
- `server/db/migrations/add-incidents.sql` — Migration applied to Turso production via @libsql/client script
- `server/src/services/storageService.ts` — Rewrote with real GCS upload using metadata server ADC
- `server/src/repositories/incidentRepository.ts` — CRUD + left join for reporter name
- `server/src/routes/incidents.ts` — GET list (paginated+filtered), GET by ID, POST create, PATCH status
- `server/src/schemas.ts` — Added createIncidentSchema, incidentFiltersSchema, updateIncidentStatusSchema
- `server/src/app.ts` — trust proxy, incidentRouter registration, PATCH in CORS methods
- `client/src/types/incident.ts` — IncidentType, IncidentStatus, Incident interface, label maps
- `client/src/api/incidents.ts` — API client: list, getById, create, updateStatus
- `client/src/pages/ReportIncident.tsx` — Full form: inline camera + GPT-4.1-mini analysis, geolocation, vehicle fields, type/notes
- `client/src/pages/Incidents.tsx` — Dashboard: accordion rows, type/status filters, pagination, status workflow controls, map
- `client/src/pages/Scan.tsx` — Added Report Incident button in found-asset card
- `client/src/pages/FobLookup.tsx` — Added Report Incident button in fob result card
- `client/src/pages/VisionScan.tsx` — Added Report Incident button after save (alongside Scan Another)
- `client/src/components/Navbar.tsx` — Added Incidents nav item (AlertTriangle icon)
- `client/src/App.tsx` — Added /report-incident and /incidents routes (both ProtectedRoute)
- Production: revision tagsmart-00019-544 deployed

## Open Items

- [ ] GitHub remote for tagsmart-v2 repo
- [ ] Marina slips as separate allocation type
- [ ] Custom domain for production URL
- [ ] Email notifications for new incidents (configurable frequency from dashboard)
- [ ] More component/page tests

## Context for Next Session

TagSmart v2 is live at revision 19 with full incident reporting. The system supports logging parking violations, notices, security concerns, abandoned vehicles, and found/lost fobs. Each incident can have a photo (stored in GCS), GPS location (displayed on OpenStreetMap), reporter identity, and vehicle details auto-filled via GPT-4.1-mini camera analysis. The management dashboard (/incidents) shows all incidents with expandable detail rows, filter controls, and status workflow (Acknowledge/Resolve/Reopen).

Report Incident buttons exist in all three scan flows (QR scan, fob lookup, vision scan). The form pre-fills vehicle data from the scan result when navigated to via React Router state.

GCS upload uses Cloud Run's metadata server for ADC token — no SDK needed. The bucket is `pdfscribe-prod-uploads`, path prefix `tagsmart/`.
