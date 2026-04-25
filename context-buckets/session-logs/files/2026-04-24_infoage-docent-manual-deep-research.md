# InfoAge Computer Museum Docent Manual — Deep Research Pass

**Date:** 2026-04-24 (extended into 2026-04-25 UTC)
**Session type:** research / planning
**Agents involved:** Max (personal assistant — informal routing), Architect (implicit — new context bucket created)

## Summary

Multi-hour deep-research pass on the InfoAge Computer Museum docent manual project. Started with the blocker from Apr 24's kickoff (Drive access was broken), extracted the 7.6 GB Drive folder from 4-part zips, did a comprehensive pass through every artifact, xlsx, docx, PDF, 28 representative images, 18 video transcripts via Whisper, and — the game-changer — pulled the vcfed.org/wiki, which turned out to be a skeletal docent manual already published and actively maintained. The strategy shifted from "write a parallel PDF manual" to "contribute upstream to the wiki."

## Key Findings

### From the Drive folder (7.6 GB source mirror)
- 24 artifact folders, 9 polished exhibit signs (ENIAC ×2, COSMAC 1802, UNIVAC 1, Wang 4000, Tubes-to-ICs trio), Radio Tech Museum handbook (structural template, ends at Section 5 — even *it* is partial)
- Meeting-minutes archive 2023-07 through 2026-04 (monthly biweekly cadence), active cast: Jeff Brace, Doug Crawford, Tom Gesell, Bill Inderrieden, Rick Lewis, Joe Giliberti, Steve Anderson, Ian Litchfield ("Ian P." is a separate repair expert)
- Wang 4000 has full 1967 instruction manual + handwritten operator cheat sheets — and one of the "cheat sheets" is actually Frank DeLorenzo's father's hand-written heat-exchanger calculation card from his NJ chemical company (primary-source industrial-use authentication)
- The Wang 4000's arithmetic unit has built-in eˣ, logₑx, √x, x² — logarithms and exponentials in 1967
- Full 7-part Museum Tour video (~40 min total) narrated by Doug Crawford — existed all along, undocumented
- Warehouse has an unrestored DEC PDP-11/23 + 2× RL02 drives (visible in one photo, not catalogued)
- Wang Writer 5503 has SEALED original software from Dec 1987 — Usagi Electric (David Lovett) was looking for these

### From vcfed.org/wiki (the big discovery)
- **18 topical pages**, last edited 2025-06-19, structured almost exactly like the planned manual (opening, closing, layout, tour decisions, visitor Q&A, welcoming, safety, demo list, the artifacts)
- `the_artifacts` page is 120 KB, 2,684 lines, ~80 machines with placard text + narrative + often repair history
- **Interdata 4 (1967) and Interdata 74 (1972) are both documented** — the direct ancestors of Nick's Concurrent 3280 lineage (Interdata → Perkin-Elmer 1973 → Concurrent 1985). Nick's 3280 expertise is a perfect wedge.
- **Lockbox combo is `1864` (USS Reliant reference)**, NOT `1984` as the xlsx Opening Checklist said. The xlsx is wrong.
- **Bendix G-15 is NOT gone** (wiki says we have it, "believed to be #3" of ~400 built, original desk); the Sept 2023 minutes that said "Bendix is gone" were wrong or pre-restoration
- **The Novachord (Hammond, 1939) in the museum was personally owned by J. Presper Eckert** — ENIAC co-designer
- **Mauchly himself told Smithsonian historians his ENIAC inspiration came from a radar project at Camp Evans** — primary-source Camp Evans → ENIAC link
- Docent-area locker combo `22-24-2`; PC password `640Kisenoughforanyone` (Bill Gates joke)

### Gaps Nick can fill
- Concurrent 3280 (not in wiki; Nick's primary-source specialty)
- Mice exhibit (Drive has 11-page catalog; wiki has nothing)
- Triad mini + 9427H disk (Drive has 38 photos including core-memory boards; wiki has nothing)
- Wang Writer 5503 (Drive has donor thread + sealed software photos; wiki has nothing)
- Core Memory Exhibit (Drive has panel; wiki doesn't)
- Empty wiki pages: `docent_onboarding`, `whats_off-limits`
- DEC MicroVAX entry is just "Arriving soon - currently being restored" — Nick's draft fills it

## Decisions Made

1. **Strategy pivot:** Drop the parallel PDF-manual plan. Contribute upstream to vcfed.org/wiki via the Docents login (edit access confirmed).
2. **Wedge priority order:**
   1. New wiki entry: `===== Concurrent 3280 =====` — Nick's primary-source contribution
   2. Enhance `Interdata 4` and `Interdata 74` wiki entries with NJ-local lineage + operator experience
   3. Port Mice exhibit from Drive into a new wiki entry
   4. Reformat MicroVAX II draft (already written) to wiki format and upload
3. **Format pattern to adopt:** Narrative → `=== Artifact History ===` → `=== Repair History: ===` → `=== Placard Text: ===` → spec bullets. Matches the Xerox 8010 wiki entry (the most detailed example).
4. **Floor plan + smart-plug map is still a legitimate standalone deliverable** (PDF/image companion) — doesn't need to be wiki content. Doug himself doesn't have one per the Tour Part 1 transcript.
5. **No DEC MicroVAX II draft upload yet** — reformat first, validate format with Jeff/Doug before scaling.

## Research Sources

### Files extracted/read
- 4-part zip → `context-buckets/infoage-docent/files/Docent Shared Resources/` (7.6 GB mirror of Drive folder `1UeWnuDr5Iocb8RKokfobnmPjBu8k01Tr`)
- 16 of 27 PDFs read visually (all 9 exhibit signs, Radio handbook 25pp, Univac-1219 brochure 12pp, Mice exhibit doc 11pp, HP TechData 5pp, HP Journal Mar 1977 partial, Wang 4000 manual partial, Wang card layout, TheUnivac duplicate)
- All 6 xlsx files (reference websites, repair tracking, repairs needed, attendance, opening/closing checklists, to-do, Amiga disks)
- All 11 narrative docx files
- ~28 representative artifact photos (100% coverage of orphan folders)
- 18 Whisper transcripts (~46 min audio → 850 lines text) incl. full 7-part Museum Tour

### External resources fetched
- vcfed.org/wiki all 18 pages (via basic auth, saved to `files/vcf_wiki_snapshot/`, 212 KB)

### Referenced but NOT yet fetched
- Ian's Repair Logs Drive folder at `drive.google.com/drive/folders/1xLUw0F4PSjrhaZDCqEbCS14PVA5tKpIZ`
- Usagi Electric YouTube (Wang Writer 5503)
- ricapar.net/wang-writer-5503/ (donor's documentation)
- Mauchly 1977 TCF YouTube talks (2 parts, linked in references xlsx)
- bitsavers / hpmuseum / pdp8online referenced PDFs

## Artifacts Created

### Context bucket (new)
- `context-buckets/infoage-docent/bucket.json`
- `context-buckets/infoage-docent/README.md`

### Drafts
- `context-buckets/infoage-docent/drafts/artifacts/microvax-ii.md` (99 lines — wedge sample, written before wiki discovery; needs reformat to wiki pattern)
- `context-buckets/infoage-docent/drafts/general/research-report.md` (~1,200 lines, now v1.2 — main synthesis, 11 parts + appendices)
- `context-buckets/infoage-docent/drafts/transcripts/*.txt` (18 Whisper transcripts)

### Snapshot
- `context-buckets/infoage-docent/files/vcf_wiki_snapshot/*.txt` (18 wiki pages, 212 KB)

### Memory
- `~/.claude/projects/.../memory/project_infoage_docent_manual.md` updated to v1.2 reflecting wiki pivot

### Registry
- `registry/buckets.json` — new `infoage-docent` bucket registered

## Open Items

- [ ] **Next on-site visit:** document Concurrent 3280 (photos, nameplate, condition), sketch floor plan, number all smart plugs + Alexa commands, verify lockbox combo (`1864` vs xlsx's `1984`), photograph missing-from-Drive machines (MicroVAX II with Andy Goldstein note, IBM 1130, Univac unit, HP 1000, Cray, Calcomp, Linotype, Bendix G-15)
- [ ] Draft `===== Concurrent 3280 =====` wiki entry (primary wedge)
- [ ] Enhance Interdata 4 + 74 entries with NJ-local history + operator experience
- [ ] Port Mice exhibit Drive PDF → wiki entry
- [ ] Reformat MicroVAX II draft to wiki pattern (Artifact History + Repair History + Placard Text)
- [ ] Fetch Ian's Repair Logs Drive folder (separate URL, may need auth to that specific folder)
- [ ] Resolve 18 open questions listed in research report Part 8
- [ ] Fill empty wiki pages: `docent_onboarding`, `whats_off-limits`
- [ ] Confirm write access to the wiki by making a small test edit before doing any big contribution
- [ ] Send one of the first wiki edits to Jeff/Doug as validation before scaling
- [ ] Find out what "Tower of Power PC Demo", "Slot 1 priority", and "Donations go to 9010-B" mean (meeting-minute mysteries)

## Context for Next Session

The research phase is essentially complete. Everything needed to start contributing is in `context-buckets/infoage-docent/`:
- Read `drafts/general/research-report.md` first (1,200 lines, 11 parts + appendices) — it's the single briefing document
- The memory file `project_infoage_docent_manual.md` at v1.2 has the one-paragraph status summary
- The wiki snapshot is in `files/vcf_wiki_snapshot/` for reference without re-fetching

**Start next session with:** Either (a) draft the Concurrent 3280 wiki entry now and have it ready for the next on-site visit, or (b) do the on-site visit first to get photos+nameplate and then draft with primary-source material. The Interdata lineage angle is the centerpiece — Nick's Concurrent Computer co-op experience from 1985 (the exact year Concurrent was spun off from Perkin-Elmer) combined with Interdata 4 (1967) and Interdata 74 (1972) already on display tells the complete NJ mini-computer story. That story thread is what makes this project genuinely unique-value vs. anyone else who could write a docent manual.
