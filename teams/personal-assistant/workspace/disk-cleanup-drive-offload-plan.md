# Disk Cleanup — Tier 5 Google Drive Offload Plan

**Date:** 2026-06-04
**Author:** Max (personal-assistant)
**Status:** Plan — execute as a deliberate second pass (NOT yet executed)

## Context
MacBook is space-constrained (460 GB drive). Tiers 1–3 already reclaimed ~20 GB live (caches, ~/Library/Developer, redundant Downloads). Decision made: **no iOS/Xcode dev on this machine** — all Xcode work moves to a dedicated machine. This plan offloads **cold media** to Google Drive to reclaim another 20–40 GB.

## Drive environment (verified)
- Drive for Desktop **installed and running**, streaming mode.
- Primary mount: `~/Library/CloudStorage/GoogleDrive-nickd@demarconet.com/My Drive/`
- (Secondary mounts exist for `nick.demarco@altium.com` and stale demarconet snapshots — ignore those.)

## Two strategies — pick per target

### Strategy A — Stream-stub (for standalone, non-repo folders)
1. **Move** the folder into `…/My Drive/_Archive/` (create that folder).
2. Wait for Drive to fully upload — confirm green ✓ checkmarks in Finder, or verify in drive.google.com. **Never proceed until upload is 100% confirmed.**
3. Right-click the folder → **"Free up space"** (turns off "Available offline"). Local copies become online-only stubs (~0 bytes on disk); they re-download on open.
4. *(Optional)* symlink back to the original path if any script references it:
   `ln -s "…/My Drive/_Archive/<folder>" ~/Workspaces/<folder>`

### Strategy B — Archive-and-remove (for media INSIDE the git repo)
⚠️ **Do NOT move a git repo or its contents into a Drive stream folder** — constant sync churn corrupts `.git`.
Instead, reuse the existing **project-vault archive workflow** (precedent: "phase 3 — 6 videos to Drive, ~17 GB reclaimed"):
1. Upload finished project assets to `…/My Drive/_Archive/youtube/<project>/`.
2. Verify upload.
3. Delete the local assets; leave a small `ARCHIVED.md` pointer/manifest in the repo noting the Drive location.

## Targets (priority order)

| # | Target | Size | Last touched | Strategy | Notes |
|---|---|---|---|---|---|
| 1 | `AgentArchitect/teams/youtube-content` | **22 GB** | active repo | **B** | Biggest win. Archive *finished* episodes' raw assets (images, narration WAVs, renders). Keep storyboard JSON + scripts in repo. Per-project triage needed. |
| 2 | `~/Workspaces/timelaps` | 6.7 GB | Jul 2025 | A | Cold ~11 mo. Standalone. Easy stub. |
| 3 | `context-buckets/infoage-docent` | 7.6 GB | Apr 2026 | B | The "Docent Shared Resources" videos (in-repo bucket). Big videos rarely need to be local — archive, keep docs. |
| 4 | `~/Workspaces/Apple Health` | 3.8 GB | May 2025 | A | Cold export. Standalone. Easy stub. |
| 5 | `~/Workspaces/monmouth-beach-documentary` | 3.4 GB | Mar 2026 | A | Project LIVE/published. Archive source media. |
| 6 | `~/Movies/iMovie Library.imovielibrary` | 7.1 GB | Apr 2026 | A — **with care** | ⚠️ iMovie expects it in `~/Movies`. Either leave it, or in iMovie consolidate media first, then move + relink. Don't blind-move. |

**Estimated reclaim:** ~20 GB (targets 2,4,5 — easy stubs) up to ~50 GB (with 1 & 3 archived).

## Recommended execution order
1. **Easy stubs first** (targets 2, 4) — lowest risk, ~10.5 GB, validates the workflow.
2. **monmouth-beach** (target 5) — confirm published version is safe in Drive/YouTube before archiving source.
3. **youtube-content + infoage-docent** (targets 1, 3) — per-project triage session; biggest payoff, most care.
4. **iMovie** (target 6) — only if more space needed; requires relink.

## Hard rules
- ✅ Verify 100% upload (green ✓ / web check) **before** freeing local space.
- 🚫 Never put a `.git` repo inside the Drive stream folder.
- 🚫 Never delete-then-upload — always upload-verify-then-free.
- 📝 Leave an `ARCHIVED.md` pointer in any repo location whose media was moved.

## Also worth a look (not media, deferred)
- `~/Library/Messages` (5.8 GB) + Messages container (2.2 GB) — iMessage attachment history. Offloadable but risky; skip unless desperate.
- Chrome HTTP cache (3 GB) — still present; quit Chrome and clear (`rm -rf ~/Library/Caches/Google`).
- `docker system prune -a` — ~3.5 GB more (re-pulls unused images).
- `/Applications/Xcode.app` (5.1 GB) — root-owned; remove with `sudo rm -rf /Applications/Xcode.app`.
