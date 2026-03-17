# TagSmart v2 — Feature Sprint & Production Deployment

**Date:** 2026-03-17
**Session type:** execution
**Agents involved:** software-project (direct), email-research (Kathy fob emails)

## Summary

Extended TagSmart v2 session: fixed camera/QR bugs from phone testing, expanded asset types to match physical tag colors, imported real Wharfside data (192 units, 832 parking tags, 217+ fobs), deployed to Cloud Run with Turso, then iterated on features based on live testing — sortable tables, help system, eMERGE bidirectional sync, settings encryption, and contextual help links.

## Key Findings

- Camera access requires HTTPS even on Tailscale IPs — self-signed cert added to Vite dev
- html5-qrcode scanner cleanup throws synchronous errors — needs try/catch wrapper, not just .catch()
- Scanner object must only be tracked AFTER qr.start() succeeds, not before
- QR codes on physical tags are zero-padded 4-digit (0001) but DB stores plain numbers (1)
- Same tag number exists across different tag types — composite unique index (tag_number, asset_type)
- PWA service worker aggressively caches old versions — skipWaiting + clientsClaim fixes it
- Marina slips are separate from condo units — slip renters are non-owners who get marina tags
- Kathy Vanecek (Kathy.Vanecek@idealmgt.com) at East Coast/Ideal Management handles fob activations
- eMERGE Linear export format: 38 columns starting with #EXPORT_FORMAT_VERSION=1 header

## Decisions Made

- Asset types: reserved (red), non-reserved (green), visitor (yellow), marina (blue), bike, fob
- OpenAI API key stored as Cloud Run env var, never in database or UI
- Settings changes logged to audit history table
- Turso (cloud libSQL) for production database
- Service worker skipWaiting for instant updates on deploy
- Login redirects to home page, not scan page
- Contextual "Need help?" links on every feature page deep-linking to Help page sections

## Research Sources

- Parking tag spreadsheet: Google Sheet 1cpIvLoMTM9DqOBM-F2LvllOpFQZTo_2eAXh1jieOMEA
- Fob export spreadsheet: Google Sheet 1ILj52XDAkRZHrXP9GVpTko5gF4_DA3R872jd7Kcj8C4
- Kathy's fob activation emails: Feb 20, Mar 7, Mar 16 2026
- Django TagSmart help pages: about.html, install.html, scan.html, rt_user_guide.html

## Artifacts Created

- Production: https://tagsmart-934267405367.us-central1.run.app (12 revisions deployed)
- Turso DB: libsql://tagsmart-nickdnj.aws-us-east-1.turso.io
- 5 git commits in tagsmart-v2 repo (d424e4c through 5f609fa)

## Open Items

- [ ] GitHub remote for tagsmart-v2 repo
- [ ] Marina slips as separate allocation type with business rule enforcement
- [ ] Import marina slip data
- [ ] GCS for production image storage (vision scan photos currently not persisted)
- [ ] Custom domain for production URL
- [ ] More component/page tests to match QA plan

## Context for Next Session

TagSmart v2 is live in production at revision 12 on Cloud Run. All core features working: QR scan with type selector, fob lookup with inline registration, vision scan with GPT-4.1-mini, asset CRUD, eMERGE bidirectional sync, sortable tables, help system with contextual links. 1,043+ assets seeded. Key remaining work: marina slip management, GitHub remote setup, and custom domain. The OpenAI API key from the Django app is set on Cloud Run and confirmed working.
