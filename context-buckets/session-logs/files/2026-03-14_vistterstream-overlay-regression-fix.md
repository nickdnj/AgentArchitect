# VistterStream Overlay Resolution Regression Fix & Security Review

**Date:** 2026-03-14
**Session type:** execution + review
**Agents involved:** Voice mode, direct development

## Summary

Fixed two regressions caused by the security hardening deployment: (1) overlay images rendered at wrong resolution because VAAPI GPU encoding fell back to 720p software mode when the non-root Docker user lost GPU access, and (2) overlays with no stored dimensions were composited at native image resolution (1700x500) instead of being scaled. Also conducted a comprehensive security and architecture review, grading the project and creating 9 GitHub issues for Phase 2 hardening.

## Key Findings

- TempestWeather overlay images are natively 1700x500 pixels
- Without render group (GID 993), VAAPI falls back to software encoding at 1280x720
- At 720p, 1700px-wide overlays overflow the 1280px canvas — root cause of the visual regression
- The PIL backend workaround (removed in commit 1065aa2) was the only thing auto-sizing overlays when no width/height stored
- ONVIF library needs a writable home directory (`--create-home` flag)
- Security review: Architecture C+, Security C (up from D+), Dependencies A

## Decisions Made

- Added backend auto-sizing fallback in `_prefetch_all_overlays` using PIL — reads native image dimensions and caps to stream resolution
- Added render group to Docker non-root user for GPU access
- Created `--create-home` for appuser to fix ONVIF permission denied
- Created GitHub issues for Phase 2 hardening rather than fixing inline

## Artifacts Created

- Commit `f7dba78`: Backend overlay auto-sizing fix
- Commit `98cfb3d`: Dockerfile render group + home directory fix
- GitHub milestone: "Security Hardening Phase 2" (#2)
- GitHub issues #33-#41 (preview auth, OAuth CSRF, PTZ bug, timeouts, Docker multi-stage, structured logging, audit logging, SSRF prevention, test coverage)

## Open Items

- [ ] PTZ thumbnail capture bug: `'Camera' object has no attribute 'password'` (#35)
- [ ] Verify stream stability once site bandwidth improves from ~130 kbps
- [ ] Preview endpoints still lack auth enforcement (#33 — most critical)
- [ ] OAuth state parameter needs CSRF token (#34)
- [ ] Stress test multi-camera + multi-platform streaming

## Context for Next Session

Both overlay fixes are deployed and verified working in production. VAAPI is back at 1920x1080, overlays render correctly at 1700x500 with proper scaling. The stream is running but may intermittently drop due to low upload bandwidth at the site. Nine security issues are filed under Phase 2 milestone — #33 (preview auth) is the most critical and simplest to fix. The PTZ thumbnail bug (#35) is a quick fix too — Camera model needs the credential lookup updated.
