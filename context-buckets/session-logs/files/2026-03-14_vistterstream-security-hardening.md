# VistterStream Architecture Review & Security Hardening

**Date:** 2026-03-14
**Session type:** review + execution
**Agents involved:** Voice mode, Explore agents (architecture review, security audit)

## Summary

Conducted a full architecture and security audit of VistterStream, grading it C+ on architecture and D+ on security. Fixed three critical security issues immediately (unprotected preview endpoints, overly permissive CORS, plaintext stream keys), plus two maintenance items (mediamtx healthcheck, FFmpeg memory leak). Created 10 GitHub issues under a "Security Hardening" milestone for remaining work.

## Key Findings

### Architecture (C+ overall)
- Code organization B- (modular but services bloated)
- API design B (RESTful, auth present, inconsistent responses)
- Database design C+ (no migration framework, ad-hoc start.py migrations)
- Error handling C (silent failures, no custom exceptions)
- Dependency management D+ (almost no version pinning in requirements.txt)
- Docker architecture B (solid composition, missing health checks)
- State management C+ (multiple unprotected dicts, no locking)

### Security (D+ overall)
- Preview endpoints had NO authentication (CRITICAL)
- CORS allowed all methods/headers with credentials (CRITICAL)
- stream_key and youtube_api_key stored in plaintext (CRITICAL)
- Default admin/admin reset script exists (CRITICAL)
- No rate limiting on login endpoint (HIGH)
- RTMP relay allows publish from all (HIGH)
- API docs publicly accessible via Cloudflare Tunnel (HIGH)
- Docker runs as root (HIGH)

## Decisions Made

- Reolink DHCP reservation removed from open items (camera not in use)
- OAuth app publishing not needed (100 test users sufficient)
- Keep critical fixes on main branch for immediate deploy
- Architecture refactoring (Alembic, dependency pinning, etc.) can go on separate branches later

## Artifacts Created

- `docs/architecture-review-2026-03-14.md` — Full review with action plan
- GitHub issues #22-31 under "Security Hardening" milestone (milestone #1)
- GitHub labels: `security`, `architecture`

## Fixes Deployed

1. **Mediamtx healthcheck removed** — distroless image has no wget/curl/shell
2. **FFmpeg memory leak fixed** — process objects now released after shutdown (`stream_process.process = None`)
3. **Preview auth added** — `dependencies=[Depends(get_current_user)]` on preview router
4. **CORS tightened** — methods restricted to GET/POST/PUT/DELETE/OPTIONS, headers to Content-Type/Authorization, origin regex narrowed to `stream.vistter.com`
5. **Stream keys encrypted** — Fernet encryption for stream_key and youtube_api_key, startup migration encrypts existing values, API masks secrets as dots
6. **mediamtx deprecation warning fixed** — `hlsAllowOrigin` → `hlsAllowOrigins`

## Open GitHub Issues (Security Hardening milestone)

ALL CLOSED — see Phase 2 below.

## Phase 2: Issues #25-31 (same day, second session)

**Branch:** `security-hardening-25-31` → merged via PR #32
**Two follow-up commits** pushed directly to master (gosu entrypoint fix, Alembic stamp fix)

### Fixes Deployed (Phase 2)

7. **Rate limiting (#25)** — SlowAPI: 10 login attempts/15min, 5 register/min per IP
8. **RTMP relay locked down (#26)** — nginx-rtmp publish/play restricted to 172.16.0.0/12 + 127.0.0.1
9. **API docs disabled (#27)** — `docs_url=None, redoc_url=None` unless `ENABLE_DOCS=true` env var
10. **Non-root Docker (#28)** — `appuser:1000` via gosu entrypoint (chown /data then drop privileges)
11. **Dependencies pinned (#29)** — All packages in requirements.txt pinned to exact versions
12. **asyncio.Lock (#30)** — Added to FFmpegProcessManager, RTMPRelayService, SeamlessTimelineExecutor
13. **Alembic initialized (#31)** — Baseline migration created, start.py runs `alembic upgrade head` on boot; stamps existing DBs at head

### Deploy Notes

- gosu package added to Dockerfile (Debian `gosu`, not Alpine `su-exec`)
- Entrypoint script runs as root to `chown -R appuser:appuser /data`, then `exec gosu appuser` to drop privileges
- Alembic detects existing databases (no version table) and stamps at head rather than trying to create existing tables
- `ensure_tempest_url_port_fix()` SQL fixed — `:8085` literal was being parsed as a bind parameter

## Context for Next Session

Security hardening milestone is **fully complete** — all 10 issues (#22-31) closed and deployed. The site network is still transitioning (~130 kbps upload) so live stream testing remains blocked. Two open items: (1) verify stream works when network stabilizes, (2) stress test multi-camera + multi-platform streaming.
