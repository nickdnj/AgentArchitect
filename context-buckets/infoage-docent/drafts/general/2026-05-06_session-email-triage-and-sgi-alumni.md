# Session Log — InfoAge Docent Email Triage + Concurrent→SGI Alumni Outreach

**Date:** 2026-05-06
**Session type:** mixed (research, triage, outreach drafting)
**Mode:** voice-local (Whisper + Kokoro)
**Agents involved:** voice-local skill, Web Research agent (×2 background runs)

---

## Summary

Full triage of 14+ docent group threads from the last 90 days. Two threads with strategic project relevance surfaced: Rick Lewis is actively maintaining the VCF wiki and added a new "Hands-On Activities" page; Doug shared the Radio Museum's new Docent Guidance .docx (a 90%-shorter rewrite of the 2019 handbook). Identified that Marc Natanagara is the only AI-aligned voice on the docent list and is stepping down — making him the urgent target for camp-curriculum and OS/32-wedge conversations. Researched and drafted outreach to two ex-Concurrent / SGI colleagues (Marty Deneroff confirmed reachable, Joe Gagliardo confirmed at D.E. Shaw with high-confidence email).

## Key Findings

### Email triage (15 threads)
- **Cumberland Regional HS visit is TODAY (May 6)** — bus arrives main lot 10:30 AM, rotations through CHM/EW/RTM/MTM start 11:25. Marc updated the schedule May 4 to put all three groups together at the Space Exploration Center (2300 Marconi) for the first slot. Nick is NOT on the schedule but Doug Crawford has a standing "any Wednesday" invite from Apr 23. John Cervini is requesting a swap (he has to leave at 1:20 for the airport); Jules wants Marc to publish a revised schedule.
- **Nick's docent badge** was found by Tom Gesell on April 25 (left next to the Mac during VCF East). It was placed in the docent office on top of the microwave. Nick has since picked it up.
- **Doug Crawford and Jeff Brace are openly recruiting hardware help** — multiple machines down: Mac SE, DEC VT180 (no display), Silicon Graphics workstation (computer side dead, monitor confirmed working), Xerox Star (likely monitor PSU), Comdyna analog (parts ordered), PET 4032 (3 IEEE-488 buffers needed). Cully Richard fixed the Data General Eclipse S/140 by changing BASIC's serial baud from 9600→4800 (BASIC was written for a 1969 Nova).
- **Saturday May 9 is busy** — Toms River HS (6 groups, 40-min blocks, problem-solving/communications focus, 11AM-3PM, free pizza for volunteers after 1:15) plus a town-wide scavenger hunt on the InfoAge property (10 AM–noon, selfies at Fire Museum). Marc personally running an AI challenge in the Collaboratory all six tour blocks.
- **Sunday docent coverage is thin** — Joseph Giliberti showed up alone Apr 26 at 12:05 wondering if anyone else was coming. Resolved on the day, but a recurring gap.
- **Marc Natanagara is stepping down** as Education Chair — he refers to "my replacement" twice in May 4 emails. He has a Vermont AI initiative called **aiVT**.
- **CRT/LCD handling memo from Doug (May 1)** — house rules: no CRTs face-down, LCDs covered with stiff cardboard. Doug found damaged inventory after VCF East teardown. Mindset shift for all docents going forward.

### VCF Wiki strategy validation
- Rick Lewis (CHM lead, also doing Cumberland today) cleaned up the wiki Apr 25 — updated Artifacts section to reflect what's actually in the museum (last 3 years), created a brand-new **"Hands-On Activities"** page. The Apr 24 wiki snapshot in the bucket is therefore slightly stale.
- Rick is the right contact for Nick's wiki contribution work: Concurrent 3280, Interdata 4/74 enhancements, MicroVAX II wiki page fill, Mice exhibit port.
- The new Hands-On Activities page is exactly the surface area where the OS/32-on-Pi wedge fits.
- Nick already has wiki edit credentials (Jeff Brace sent them direct on Apr 23 7:55 PM): username `docents` / password `sistaglev%19`.

### Radio Museum Manual diff (2019 PDF vs 2026 .docx)
- 2019 "Handbook" v4.0 (Partial) Spring 2018 = 739 lines, 1.2 MB. Sections 1-5 only; promised Sections 6-18 never existed.
- 2026 "Guidelines for RTM Docents" / "Docent Guidance" = 75 lines, 662 KB. **90% reduction.**
- 2026 keeps only: General docent guidelines + Open/Close procedures. Drops history, display areas, references entirely.
- Title shift: "Handbook" → "Guidelines."
- **The Radio Museum team walked away from the comprehensive-handbook model.** Validates Nick's wiki-contribution strategy hard. Computer Museum manual should follow the same split: tight operational crib-sheet + per-artifact wiki entries.

### Concurrent → SGI Alumni research
- **Marty Deneroff (CONFIRMED):** MIT BSEE, Monmouth MSCS 1989-91 (NJ during Cruncher I), VP Server & Microprocessor Engineering at SGI 1991-2003 (ran Challenge/Origin/Altix + MIPS ASICs), then D.E. Shaw Research as Anton 1 architect, then EMU/Lucata as COO/CEO until Feb 2024 shutdown, now Director of Hardware Engineering at Tactical Computing Labs. LinkedIn active: https://www.linkedin.com/in/marty-deneroff-2a554/ — networking openly post-Lucata. Personal context: Marty hired Nick onto the Cruncher I team after Nick's co-op; Nick reads him as autistic-spectrum, direct/factual style, will remember Nick.
- **Joe Gagliardo (CONFIRMED at D.E. Shaw, Nick verified SGI tenure):** Rutgers BSEE, Concurrent → SGI Bay Area → D.E. Shaw Research (current, Manager Engineering NYC). Anton co-author 2007/2014/2021, ACM Gordon Bell Prize 2014. **No public LinkedIn.** Best email (high confidence): `joseph.gagliardo@deshawresearch.com` (DESR uses `firstname.lastname@deshawresearch.com` 98% per RocketReach). Personal context: Nick used to drink with Joe at bars in Belmar; haven't connected in ~30 years except for one chance ~20-year-old NYC encounter at a deli across from D.E. Shaw.

### AI sentiment in docent group
- 180-day inbox search: only **Marc Natanagara** mentions AI on the docent list (one liner about the Toms River AI challenge + reference to his "aiVT thing" in Vermont).
- **Zero discussion of AI/ML/ChatGPT/Claude/LLMs** from any other docent in 6 months.
- The "looks" Nick got when he mentioned AI to other docents reflect culture (tube-radio preservation crowd), not personal hostility — they aren't having that conversation at all.
- Marc is the sole AI ally and is stepping down. Camp-curriculum and OS/32 conversations should run through Marc *before* he leaves.

## Decisions Made

- **Sent flat-tire email to Doug + Rick** at 9:50ish AM letting them know Nick planned to come in today but is delayed.
- **Marty's outreach channel: LinkedIn DM.** Final draft uses casual "back from Concurrent / hope LinkedIn helps you figure out who I am" backbone, lists InfoAge Concurrent (3280, no Micro-5) + SGI hardware (Indigo2 Extreme, IRIS Indigo, Personal IRISes, Onyx 10000), no ask, no mention of broken machine.
- **Joe's outreach channel: email** (no public LinkedIn). Drafted to `joseph.gagliardo@deshawresearch.com` with subject "Catching up — Nick DeMarco from Concurrent." Same backbone as Marty's DM. Belmar / NYC deli stories held in reserve for after Joe replies.
- Both DMs/emails: Nick will send himself.
- **Strategic frame for Computer Museum manual:** abandon the comprehensive-handbook model (validated by RTM team walking away from it). Build a tight operational crib-sheet + per-artifact wiki entries.

## Research Sources

- Gmail searches via `gmail-personal` MCP across the docent group `docents_group@vcfed.org` (Apr 24 onward + 180-day AI sentiment scan).
- Two background `Web Research` agent runs:
  - Initial Marty + Joe research: `teams/personal-assistant/workspace/concurrent-sgi-alumni-research.md`
  - Joe redo (after Nick rejected first LinkedIn match): `teams/personal-assistant/workspace/joe-gagliardo-redo.md`
- Document conversion: `textutil` (.docx→.txt), `pdftotext` (.pdf→.txt) for Radio Museum manual diff.
- Existing bucket research-report at `context-buckets/infoage-docent/drafts/general/research-report.md` (referenced for SGI artifact list).
- VCF wiki snapshot at `context-buckets/infoage-docent/files/vcf_wiki_snapshot/` (referenced for Indigo2/IRIS Indigo/Personal IRIS/Onyx 10000 hardware list — Apr 24 snapshot).

## Artifacts Created

- **Email sent:** "Running late today — flat tire" → Douglas Crawford + Rick Lewis. Gmail message ID `19dfd95cedd8bf71` (sent ~9:50 AM May 6).
- **Email drafted (not sent):** "Catching up — Nick DeMarco from Concurrent" → `joseph.gagliardo@deshawresearch.com`. Gmail draft ID `r-5027270072493453023`.
- **LinkedIn DM (final draft, in conversation only):** Marty Deneroff at https://www.linkedin.com/in/marty-deneroff-2a554/ — Nick will send himself.
- **File:** `context-buckets/infoage-docent/files/Docent Shared Resources/Manuals/Radio History Museum/RTM_Radio_Museum_Docent_Guidance_2026-04-25.docx` (downloaded from Jeff Brace's Apr 25 email).
- **Files:** `teams/personal-assistant/workspace/infoage-cumberland-2026-05-06/cumberland-schedule-original-2026-04-24.png` and `cumberland-bus-arrival-2026-05-04.png` (downloaded schedule screenshots, both versions).
- **Files (background agent output):** `teams/personal-assistant/workspace/concurrent-sgi-alumni-research.md` and `teams/personal-assistant/workspace/joe-gagliardo-redo.md`.
- **Memory:** new file `user_concurrent_sgi_alumni.md` in `~/.claude/projects/.../memory/` capturing Marty + Joe + personal-style outreach notes; MEMORY.md index updated.

## Open Items

- [ ] **Send Marty's LinkedIn DM** (final draft in hand)
- [ ] **Send Joe's email** (gmail draft `r-5027270072493453023` queued)
- [ ] **MicroVAX II draft → Jeff + Doug** — original starting question of this session, still queued in `context-buckets/infoage-docent/drafts/artifacts/microvax-ii.md`. Not sent.
- [ ] **Conversation with Marc Natanagara** about (1) the camp curriculum (ENIAC-to-ChatGPT pilot week summer 2026), (2) the OS/32-on-Pi wedge for the Hands-On Activities wiki page. Run before Marc steps down as Education Chair.
- [ ] **May 9 Saturday volunteer decision** — TR HS + scavenger hunt + free pizza after 1:15. Not on schedule, FYI cc.
- [ ] **Today's Cumberland visit** — head in once tire is fixed; Rick Lewis is the CHM lead, rotations start 11:25.
- [ ] **Re-pull VCF wiki snapshot** to capture Rick's Apr 25 updates (Artifacts section + new Hands-On Activities page) — current snapshot is Apr 24, slightly stale.
- [ ] **SGI repair angle** — once Marty / Joe respond, decide whether to bridge them to Thomas Gilinsky (currently holding the broken SGI) for help.

## Context for Next Session

Today is May 6, 2026 — the day Nick was planning to be on-site at InfoAge for Cumberland. He had a flat tire, sent the late-arrival email to Doug + Rick, and triaged the docent inbox while waiting on the tire fix. The Concurrent → SGI alumni research was a side thread that emerged from the broken Silicon Graphics workstation discussion (Doug's May 2 repair report). Nick is now armed with vetted outreach drafts for Marty (LinkedIn) and Joe (email) and will send them himself. The three big strategic moves to follow up on, in order of urgency: (1) Marc conversation before he steps down, (2) MicroVAX II draft hand-off to Jeff + Doug for format validation (still the right wedge per the original session premise), (3) refresh the wiki snapshot. The Computer Museum manual approach has been validated: ship it as a tight operational crib-sheet plus per-artifact wiki entries, not a comprehensive handbook — RTM team's own pivot away from "Handbook" to "Guidelines" is the precedent.
