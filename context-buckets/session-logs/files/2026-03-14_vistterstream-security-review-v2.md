# VistterStream & TempestWeather — Security Review v2 & Fixes

**Date:** 2026-03-14
**Session type:** review + execution
**Agents involved:** Explore (architecture review x2), Software Developer (fixes x2), Voice Mode

## Summary

Deep architectural and security review of both VistterStream and TempestWeather, followed by implementation of all critical and high-severity fixes, deployed to production. This was the second security pass — the first (issues #22-31, #33-40) was completed earlier on 2026-03-14.

## Key Findings

### VistterStream (C+ overall)
- Secrets (.env) in git history — JWT_SECRET_KEY, ENCRYPTION_KEY, CLOUDFLARE_TUNNEL_TOKEN exposed
- XSS in OAuth callback — YouTube channel names rendered unescaped
- SSRF via asset API URLs — no validation on internal IP targets
- Encryption fallback to base64 defeats Fernet encryption purpose
- Missing security headers (nosniff, framing, referrer)
- Auth rate limiting too generous (was 10/15min)
- Missing CSRF protection (not fixed this session — needs careful implementation)
- JWT has no refresh tokens or revocation (not fixed this session)

### TempestWeather (C- overall)
- Secrets (.env) in git history — TEMPEST_API_KEY, STATION_ID exposed
- Path traversal in icon loading — filenames from API used directly in os.path.join
- Unbounded image/icon caches — memory exhaustion on RPi
- UDP socket resource leak — no try/finally
- No input validation on station IDs or location parameter
- No rate limiting on CPU-intensive image generation endpoints
- Zero tests
- Dependencies not pinned

## Fixes Deployed

### VistterStream (commit 4aad0a2)
- [x] XSS fix: `html_escape()` on OAuth callback HTML (channel name + error message)
- [x] SSRF fix: `_validate_url()` blocks localhost, link-local, 10.x — allows 192.168.x and .local for TempestWeather
- [x] Encryption: removed base64 fallback in crypto.py
- [x] Security headers middleware: nosniff, deny framing, referrer policy, X-XSS-Protection
- [x] Rate limiting: login 5/5min (was 10/15min), register 3/5min (was 5/min)

### TempestWeather (commit 35d868e)
- [x] Path traversal: `_validate_icon_name()` with regex + path containment check
- [x] Bounded cache: `LRUCache(OrderedDict)` — 50 images, 100 icons max
- [x] Socket leak: try/finally + 30s timeout on UDP listener
- [x] Station ID validation: numeric-only regex on /overlay/tides
- [x] Location validation: 100 char max, reject HTML tags
- [x] Dependencies pinned to exact versions
- [x] Flask debug=False explicit

## Artifacts Created

- `VistterStream/docs/architecture-review-2026-03-14-v2.md` — full review report with all findings, scorecards, and prioritized action plan

## Open Items

- [ ] Rotate ALL secrets in both .env files (manual — requires generating new keys and updating production)
- [ ] Scrub .env from git history on both repos (bfg-repo-cleaner)
- [ ] Add CSRF protection to VistterStream
- [ ] Implement JWT refresh token mechanism
- [ ] Add rate limiting to TempestWeather endpoints (Flask-Limiter)
- [ ] Write TempestWeather test suite (currently zero tests)
- [ ] Run pip-audit on both projects
- [ ] Verify stream works once site network stabilizes (still ~130 kbps upload)
- [ ] Stress test multi-camera + multi-platform streaming

## Context for Next Session

Both projects have had two security passes now. The most critical remaining manual tasks are secret rotation and git history scrubbing — these can't be automated safely. The CSRF and JWT refresh token items are medium-priority architectural changes that need careful design. TempestWeather still has no tests and no rate limiting. All fixes from this session are deployed and running in production on the Beelink N100 server at Tailscale IP 100.108.181.24.
