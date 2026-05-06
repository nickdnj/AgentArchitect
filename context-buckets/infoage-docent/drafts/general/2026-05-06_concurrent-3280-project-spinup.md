# Session Log — Concurrent 3280 Project Spinup

**Date:** 2026-05-06 (continuation of `2026-05-06_session-email-triage-and-sgi-alumni.md`)
**Session type:** planning + research
**Mode:** voice-local → text (voicemode MCP disconnected mid-session, then reconnected; resumed in text)
**Agents involved:** voice-local skill, Web Research agent (3rd background run on 3280 + 6 engineers)

---

## Summary

Spun up a new full project: **Concurrent 3280** — museum-grade research report (InfoAge wiki) + Jersey Stack-style YouTube video. Three things drove it: (1) the 3280 wiki entry was already a wedge in the InfoAge docent project, (2) Nick has Christmas 1985 lab photos he took as a co-op, and (3) Mike Martone is alive and active in the ex-Concurrent Facebook group as a primary-source bridge. Background research dropped the killer detail — Ken Yeager (3280 architect, MIT '72) went to SGI/MIPS and architected the R10000, and InfoAge has an **Onyx 10000 with R10000 @ 195 MHz** sitting roughly 30 feet from the 3280. Closed-loop exhibit story.

## Key Findings

### The 3280 (machine facts)
- **Lineage:** Interdata 7/32 (Edison NJ 1966) → 8/32 (1975) → Perkin-Elmer Data Systems (1973 acquisition for $73M) → Concurrent Computer (Nov 1985 P-E spinoff) → 3280
- **3280SP:** Jan 26, 1988, single CPU, 6 MIPS
- **3280E MPS:** Nov 29, 1988, up to 12 CPUs, 76.8 MIPS, 256 MB RAM, $1.8M
- Built from Schottky TTL discrete logic, 4-stage scalar pipeline
- Per CPU: 16 KB cache, 8K-word writable control store, integrated FPU, 8 register sets
- Two OSes: OS/32 (RTOS) + XELOS (Unix V port)
- Four pipeline boards: FETCH (Chirumbolo), ALU (Bush), + likely DECODE and WRITE-BACK (agent inference, needs primary-source verification)
- Single confirmed patent: **DE3722458A1** (S-Bus, Yeager, priority 1986)

### Engineers (six named, Nick worked with them)
| Name | Role | Status | Reach |
|---|---|---|---|
| **Ken Yeager** | Architect, MIT '72 | **Deceased Aug 2017** — story but no outreach |
| **Rich Chirumbolo** | FETCH | After Concurrent: Cypress Semi → garage door biz | **Nick's 1st-degree LinkedIn connection** at https://www.linkedin.com/in/richjc/ — direct DM access |
| **Brent Bush** | ALU | Cypress Semi → unknown | No public web — via Martone |
| **Rocco Brescia** | Senior cross-team | unknown | No public web — via Martone |
| **Ron Smith** | On loan | unknown | No public web — via Martone |
| **Mike Martone** | Technician | **Alive, active in Facebook alumni group** | https://www.facebook.com/groups/316610718571/ — primary outreach target |

### The R10000 closed-loop story (the winner)
- After Concurrent, Yeager went to SGI/MIPS and **architected the R10000** — landmark 4-issue out-of-order superscalar RISC chip (1996)
- InfoAge owns an **Onyx 10000** with "MIPS R10000 @ 195 MHz" per their own wiki
- Other SGI machines at InfoAge use older MIPS (Indigo² R4400, IRIS Indigo R3000/R4000, Personal IRIS R3000) — none of those are R10000
- **The 3280's architect designed the chip that powers another machine in this same museum.** That's the closer.

### Marty Deneroff bridge
- Yeager almost certainly worked under Marty Deneroff at SGI (Marty was VP Server & Microprocessor Engineering 1991-2003)
- When Nick DMs Marty (separate Concurrent → SGI alumni outreach drafted earlier this session), Marty likely has Yeager stories
- The 3280 video and the Marty outreach are linked threads

### Museum sign style (extracted from existing 9-sign InfoAge portfolio)
- Format: single page, big blue sans-serif title, hero photo, bullet list (6-15 facts), photo captions, QR code lower-right, optional "The backstory:" sub-header, fun closer line
- Bold key terms inline in bullets
- Educational + personable tone
- Each sign ~2-min scannable; QR points to in-depth content
- Validated against ENIAC, UNIVAC, Wang 4000 signs

## Decisions Made

- **Project scope: Option B** — full museum report + Jersey Stack-style YouTube video (not just wiki entry)
- **Project location:** `teams/youtube-content/projects/concurrent-3280/` with subdirs for research/script/museum-report and three image folders (Nick's 1985 photos, Martone Facebook archive, AI-generated)
- **Five-beat narrative locked in:** Lineage → Machine → People → Legacy → Personal Frame
- **Sign draft style:** match existing InfoAge ENIAC/UNIVAC/Wang signs (single page, blue title, bullets, photo grid, QR, closer)
- **Sign content (per Nick):** Keep Ken Yeager prominently, **remove other engineer names** from the sign body (they live in the in-depth report behind the QR instead)
- **Sign closer:** *"Designed in NJ. Built in NJ. The architect who built it shaped the chip that replaced it. And both machines now sit retired in this museum — about thirty feet apart."*
- **Primary outreach order:** (1) Rich Chirumbolo via LinkedIn (1st-degree, easiest), (2) Mike Martone via Facebook group (highest content yield)

## Research Sources

- Background `Web Research` agent #3 — 3280 machine + 6 engineers + Facebook group: `teams/personal-assistant/workspace/concurrent-3280-research.md`
- Tech Monitor 1988 announcements (3280SP Jan, 3280E MPS Nov)
- Patent DE3722458A1 (S-Bus, Yeager 1986)
- Ken Yeager obituary, Legacy.com (Aug 2017)
- Yeager R10000 paper (1996)
- Wikipedia: Interdata 7/32 and 8/32, Concurrent Computer Corporation
- InfoAge VCF wiki snapshot: artifact entries for Indigo², Onyx 10000, IRIS Indigo, Personal IRIS at `context-buckets/infoage-docent/files/vcf_wiki_snapshot/the_artifacts.txt`
- InfoAge existing museum signs (ENIAC, UNIVAC, Wang 4000) at `context-buckets/infoage-docent/files/Docent Shared Resources/Signs/`

## Artifacts Created

- **New project memory:** `~/.claude/projects/.../memory/project_concurrent_3280.md` + MEMORY.md index entry
- **Project scaffold:** `teams/youtube-content/projects/concurrent-3280/` with `project.json`, `outline.md`, and subdirectories
- **Engineer roster:** `context-buckets/infoage-docent/drafts/artifacts/concurrent-3280-engineers.md` (Chirumbolo spelling corrected + LinkedIn URL added)
- **Research report:** `teams/personal-assistant/workspace/concurrent-3280-research.md` (background agent output)
- **Sign draft v1:** `teams/youtube-content/projects/concurrent-3280/museum-report/sign-draft-v1.md` (Yeager-only per Nick's edit, with R10000 / Onyx 10000 closed-loop story)

## Open Items

- [ ] **DM Rich Chirumbolo via LinkedIn** (1st-degree connection — easiest unlock)
- [ ] **Reach Mike Martone via Facebook alumni group** (highest content yield — the bridge to the rest of the team)
- [ ] **Drop Nick's Christmas 1985 lab photos** into `teams/youtube-content/projects/concurrent-3280/assets/images/nick-1985-lab-photos/`
- [ ] **Pull Mike Martone's Facebook archive content** into `teams/youtube-content/projects/concurrent-3280/assets/images/facebook-archive-martone/`
- [ ] **Refine sign-draft-v1.md** — bullet polish, photo slot images, QR target URL
- [ ] **Storyboard the YouTube video** (Jersey Stack-style scene-by-scene)
- [ ] **Thumbnail concept** for early creative inspiration (Nick's pattern)
- [ ] **Draft the wiki/in-depth report TOC** — what the QR resolves to
- [ ] **Verify the other 2 of the 4 boards** (likely DECODE and WRITE-BACK) — primary source needed (Martone, Chirumbolo, or Marty Deneroff)
- [ ] **Confirm Ken Yeager → SGI MIPS R10000 chain** with a primary source — the agent's inference is high-confidence but not bulletproof; worth one more search or asking Marty Deneroff

## Context for Next Session

Voicemode dropped mid-session (then reconnected). The 3280 project is fully scaffolded and the sign-draft v1 is ready. Two outreach actions are queued: Rich Chirumbolo via LinkedIn (Nick is 1st-degree, easiest) and Mike Martone via Facebook (highest content yield). The primary-source ingest queue is waiting on Nick to drop in his Christmas 1985 lab photos and pull Mike's Facebook content. The closed-loop R10000 / Onyx 10000 story is the strongest narrative hook — both machines sit ~30 feet apart in the same museum. Next session, the highest-leverage path is: send the two outreach messages, get the photos in, then choose between (a) finalizing the sign for production print, (b) writing the wiki/report draft, or (c) building the video storyboard. Nick's instinct is to use a thumbnail concept as inspiration — that's also a viable starting point.
