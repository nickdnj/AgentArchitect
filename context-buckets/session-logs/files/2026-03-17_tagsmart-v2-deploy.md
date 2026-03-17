# TagSmart v2 — Phone Testing, Data Import & Production Deploy

**Date:** 2026-03-17
**Session type:** execution
**Agents involved:** software-project (direct)

## Summary

Continued TagSmart v2 development with live phone testing, fixed camera/QR issues, expanded the data model with real Wharfside data, and deployed to Google Cloud Run production.

## Key Findings

- Camera access requires HTTPS even on Tailscale IPs — added self-signed cert to Vite dev server
- html5-qrcode cleanup throws synchronous errors, not promise rejections — need try/catch wrapper
- QR codes on physical tags are zero-padded 4-digit (0001) but spreadsheet stores as plain numbers (1) — strip leading zeros
- Same tag number can exist across different colored tag types — composite unique index needed
- Marina slips are separate from condo units — slip renters (non-owners) get marina tags
- Kathy Vanecek at East Coast/Ideal Management handles fob activation/deactivation requests

## Decisions Made

- Asset types expanded: reserved (red), non-reserved (green), visitor (yellow), marina (blue), bike, fob
- Type selector added to QR scan flow: scan → pick color/type → lookup
- Use Turso (cloud libSQL) for production database — drop-in replacement for local SQLite
- Deploy to Cloud Run on pdfscribe-prod project
- Marina tags only for slip renters, not unit owners (business rule)
- Allocations page added for admin unit management

## Research Sources

- Parking tag spreadsheet: `1cpIvLoMTM9DqOBM-F2LvllOpFQZTo_2eAXh1jieOMEA`
- Fob export spreadsheet: `1ILj52XDAkRZHrXP9GVpTko5gF4_DA3R872jd7Kcj8C4`
- Kathy's fob emails: Feb 20, Mar 7, Mar 16 2026

## Artifacts Created

- `/Users/nickd/Workspaces/tagsmart-v2/` — Updated codebase (21 files changed)
- Production deploy: https://tagsmart-934267405367.us-central1.run.app
- Turso database: tagsmart-nickdnj.aws-us-east-1.turso.io

## Open Items

- [ ] GitHub remote setup for tagsmart-v2
- [ ] Sortable columns on all data tables
- [ ] Marina slips as separate allocation type
- [ ] Marina tag business rule enforcement
- [ ] Import marina slip data
- [ ] GCS for production image storage
- [ ] Custom domain

## Context for Next Session

TagSmart v2 is live in production on Cloud Run with Turso database. All parking tags (832) and fobs (217+) are seeded. The user tested QR scanning on their phone successfully. Key outstanding work: sortable table columns, marina slip management, and GitHub remote setup. The user (Nick DeMarco, unit 146) has test tags numbered 1 (red, green, yellow) registered to his unit.
