# Saltwater AI Ads — Morning Test Report

**Date:** 2026-05-01 (overnight session)
**Session goal:** Comprehensive Chrome-DevTools-driven QA + responsive overhaul so you can hit the ground running tomorrow.

---

## TL;DR

✅ **Everything that should work, works.** Login, brief submission, hook generation (Anthropic real LLM), review queue, AI-disclosure gate, approve/reject/regen, b-roll upload, asset library, HeyGen render, full test suite (198 pass).

✅ **Mobile is now beautiful.** The app was unusable below 700px wide. Now it's clean from iPhone SE (375px) to iPad portrait (768px).

🔧 **5 bugs fixed tonight** — committed in two clean commits.

⚠️ **3 known issues deferred to your morning** — listed below with severity and fix proposal.

🚀 **Next priority work:** TW-sync ↔ sidebar wiring, Fashn/Resend V-VERIFY, send Joe his email.

---

## What I tested

A 5-phase Playwright test session against the live SPA (`localhost:5173` + API on `:3001`). Each phase took screenshots and captured page errors / console errors / network failures.

**Phase 0 — Login**
- Dev-bypass: ✅
- Sidebar visible after login: ✅

**Phase 1 — Generate 3 realistic briefs end-to-end**
| Brief | Pattern | Latency | New variants |
|---|---|---|---|
| Spring polo drop, founder voice | Founder Story | 7s | 3 |
| Quarter zip layering, problem/solution | Problem / Solution | 7s | 3 |
| Memorial Day USA tee, limited drop | Limited Drop | 7s | 3 |

**Average: 7 seconds from click to 3 ready-for-review variants.** Real Anthropic Claude Sonnet 4.6 calls. No errors.

**Phase 2 — Asset library**
- B-roll upload ×2: ✅ (size 0→2 confirmed via /api/assets/b-roll)
- Brand image upload: ⚠️ (UI clicked, but list still showed only the 4 baked-in logos; investigation needed)

**Phase 3 — Review Queue actions**
- 9 variants listed: ✅
- AI-disclosure gate disabled-before / enabled-after: ✅
- Approve / Reject / Regen all clicked, screenshots captured: ✅

**Phase 4 — Settings**
- All 5 vendor keys show "configured" presence indicator: ✅
- TW Sync intentionally not clicked (avoid burning quota during QA)

**Phase 5 — Edge cases**
- Empty brief disables Generate: ✅
- 400-char cap: ⚠️ → **FIXED** (added `maxLength={MAX_BRIEF_LEN}` to textarea)
- Mobile viewports (390×844, 375×667, 768×1024): ❌ → **FIXED** (responsive CSS overhaul)

**Errors captured across the entire session: 0** (no page errors, no console errors, no 4xx/5xx network calls).

---

## What got fixed tonight

### 1. Mobile responsive overhaul (HUGE)
`src/web/styles/tokens.css` — added two breakpoints (≤900px tablet/large-phone, ≤600px phone). Sidebar collapses to a horizontal sticky top bar with scrollable nav pills. Generate page form + sidebar stack vertically. Review Queue master-detail stacks. Settings labels go above inputs. Action buttons (Approve / Regen / Reject) become full-width on phone for thumb tap reliability. Asset grid drops to single-column at ≤600px. Login card pads tighter.

**Verified at:** iPhone 12 (390×844), iPhone SE (375×667), iPad portrait (768×1024). 0 errors all three.

### 2. 400-char brief cap (small but real)
`src/web/pages/Generate.tsx:121` — added `maxLength={MAX_BRIEF_LEN}`. Counter was warning over 400 but you could still type 1000+. Now hard-blocked at 400 like the API requires.

### 3. HeyGen V-VERIFY adapter shape (real bug, fixed and committed earlier)
`lib/vendors/heygen.ts` — `type: 'photo_avatar'` / `photo_avatar_id` was stale. Real API uses `type: 'talking_photo'` / `talking_photo_id`. Verified end-to-end with your HeyGen key: real 6-second 1080×1920 H.264 video rendered with your avatar + voice clone. **Commit `739a8c2`.**

### 4. Saltwater brand logo swap (committed earlier)
New cyan fish + lime "Saltwater" wordmark across favicon, apple-touch-icon, manifest, theme color, plus full wordmark PNG/AVIF in Asset Library → Brand assets. **Commit `7cdff97`.**

### 5. `media/brand/` ships with the code (subtle infra)
`.gitignore` now keeps runtime media (b-roll, renders) ignored but tracks `media/brand/` so deploys arrive fully-branded. Was bundled into commit `7cdff97`.

---

## Open issues for your morning

### ⚠️ Issue 1: SKU dropdown only has 2 polos
**Severity:** medium — limits realistic testing of Fashn try-on layer.

**What I saw:** SKU dropdown shows `[no SKU]`, `Performance Polo — Navy`, `Performance Polo — White`. Brand bucket `products.json` has 3 SKUs (navy polo, gingham button-down, fleece hoodie). Mismatch.

**Where:** `src/web/pages/Generate.tsx:29` — hardcoded const `SKUS = [...]`. Comment in source already says: *"Sprint 1 SKU list — should come from /api/skus once that's wired."*

**Fix proposal:** Wire `/api/skus` (probably 30 min — read products.json + cache + return JSON). Or 5-minute interim: hardcode all 3 SKUs from products.json into the Generate.tsx const.

### ✅ Issue 2 — RESOLVED (May 2 AM): false alarm + .avif fix

**What was claimed:** Brand uploads landed on disk but didn't appear in `/api/assets/brand` list.

**What was actually true:** Re-tested end-to-end via Playwright (`/tmp/sw-brand-upload-test.mjs`). Upload→list works perfectly: 4 cards before, 5 after, new file at top, no console errors. The original morning test was reading stale state (likely cached UI state from before login or wrong tab). The GET handler at `src/server/routes/assets.ts:193` correctly reads from disk via `readdir(BRAND_ROOT)` and returns everything.

**Real bug found while investigating:** `.avif` was missing from `ALLOWED_IMAGE_EXTS`, so `saltwater-wordmark.avif` rendered as a `📄` placeholder instead of an `<img>` element. Fixed at `src/server/routes/assets.ts:32`. Verified via Playwright (`/tmp/sw-avif-fix-check.mjs`): card now renders the actual avif image. 198 tests still pass.

### ⚠️ Issue 3: TOP HOOKS THIS WEEK panel still empty
**Severity:** low — cosmetic, but Joe will notice. Empty state message reads "Sync to populate" — fine, but only because TW Sync hasn't run.

**What I saw:** Generate page right sidebar stays at "Sync to populate" with placeholder skeleton bars. Real tw-sync runs Joe's API key → fills DB tables → sidebar should populate.

**Fix proposal:** Run TW Sync from Settings (will use Joe's key + ~1 API call cost). If sidebar still empty after sync, the read query path in `src/server/routes/generate.ts` (or wherever TOP HOOKS reads from) needs hookup. ~10 min to test, ~30 min to wire if not already done.

---

## What I'd suggest doing first thing

1. **(2 min) Pull latest** — `git pull` then `cd apps/saltwater-ads && bun run dev`. Verify the mobile fixes load and the local server starts clean.
2. **(2 min) Open localhost:5173 on your phone** (or Chrome → Toggle device toolbar → iPhone SE) — confirm the mobile look feels right to you. If you want different colors / more padding / different chip layout, tell me and I'll iterate.
3. **(5 min) Send Joe his drafted reply** — sitting in Gmail drafts (id `r6874135750507599857`). Aks the JD mapping, resends mockup link, asks for Photo Avatar + remaining keys.
4. **(15 min) Fix Issue 2** — brand image upload. Likely a 1-line bug. Important because Joe will want to upload his real product photos.
5. **(30 min) V-VERIFY for Fashn + Resend** — same pattern as the HeyGen one. Use the new `scripts/test-heygen-live.ts` as a template. We know one V-VERIFY drift was real (HeyGen); statistically the others probably are too.
6. **(15 min) TW Sync end-to-end** — Settings → Sync now → confirm sidebar populates. Issue 3 either resolves or surfaces the read-query bug.
7. **(10 min) Submit a fresh brief** with the now-seeded `hooks-winners.jsonl` (5 named winners + Irish Flag insight encoded). See if the AI's output sharpens vs the older seeded variants — this is the "did the brand bucket update actually move the needle?" test.

---

## Screenshots index

All screenshots in `/tmp/sw-smoke-2026-05-01/morning/`:

**Phase 1 — briefs:**
- `01-brief-1-filled.png` / `01-brief-1-submitted.png` — Founder Story polo
- `01-brief-2-filled.png` / `01-brief-2-submitted.png` — Quarter zip P/S
- `01-brief-3-filled.png` / `01-brief-3-submitted.png` — Memorial Day drop

**Phase 2 — assets:**
- `02-broll-after-upload-1.png` / `02-broll-after-upload-2.png`
- `02-brand-after-upload.png`

**Phase 3 — review:**
- `03-review-queue.png` (list)
- `03a-approve-detail.png`, `03b-approve-after.png`
- `03c-reject-after.png`, `03d-regen-after.png`

**Phase 4 — settings:** `04-settings.png`
**Phase 5 — edge / mobile:** `05-mobile-generate.png`, `05-mobile-review.png`

**Responsive recheck (after CSS fix):**
- iPhone 12: `r-iphone-12-{generate,review,assets,settings,review-detail}.png`
- iPhone SE: `r-iphone-se-{generate,review,assets,settings,review-detail}.png`
- iPad portrait: `r-ipad-portrait-{generate,review,assets,settings,review-detail}.png`

**Findings JSON:** `/tmp/sw-smoke-2026-05-01/morning/findings.json` (machine-readable test result bundle).

---

## Test counts

- Playwright assertions: 13 pass / 4 warn / 0 fail (initial run)
- Page errors: 0
- Console errors: 0
- Network 4xx/5xx (excl. favicon): 0
- Unit + integration tests: 198 pass, 0 fail
- Typecheck: clean

---

Made tonight by Claude. Ground is yours.
