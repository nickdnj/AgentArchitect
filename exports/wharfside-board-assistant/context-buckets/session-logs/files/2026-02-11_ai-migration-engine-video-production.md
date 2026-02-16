# AI Migration Engine - YouTube Video Production

**Date:** 2026-02-11
**Session type:** execution
**Agents involved:** YouTube Creator, manual audio debugging

## Summary

Built a full YouTube video (8:49) presenting "The AI Migration Engine" vision for internal Altium/Renesas leadership. Went through multiple iterations fixing audio dropout issues and a major narrative reframe from "migration as a product" to "migration as a vehicle for A365 platform dominance."

## Key Findings

- FFmpeg's `amix` filter causes audio dropouts/pumping when mixing narration with background music, especially at segment concatenation boundaries
- The correct approach for reliable audio mixing: extract both tracks as clean WAVs, mix sample-by-sample in Python (narration 100% + music 20%), then mux the result back with the video
- Dark background "stat card" segments look bad on video — better to show actual infographic images flat (no Ken Burns) so viewers can read the data
- Aggressive Ken Burns pan/zoom makes infographic diagrams unreadable; gentle (max 3%) works better
- Kokoro TTS (am_onyx voice) produces good narration but has inconsistent inter-phrase volumes — background music helps fill the gaps

## Decisions Made

- Narrative reframe: Migration is NOT the product. It's the vehicle for A365 platform dominance and making Altium the dominant PCB design platform globally
- 6 scenes rewritten for the platform growth narrative (scenes 5, 9, 11, 12, 14, 15)
- Dark stat cards (segments 4 and 11) replaced with actual whitepaper images shown flat
- All diagrams shown with gentle or flat presentation for readability
- Python WAV mixing is the reliable approach — never use ffmpeg amix for this use case

## Artifacts Created

- `outputs/whitepaper/ai-migration-engine-video.mp4` — Final v6 video (84MB, 8:49, 1080p)
- `outputs/whitepaper/ai-migration-engine-thumbnail.jpg` — YouTube thumbnail (199KB)
- `~/Desktop/youtube-projects/ai-migration-engine/` — Full project workspace with all intermediates
- `~/Desktop/youtube-projects/ai-migration-engine/script/script-v6.md` — Final v6 script with all narrative changes
- `~/Desktop/youtube-projects/ai-migration-engine/output/metadata.md` — YouTube metadata (title, description, tags, timestamps)

## Version History

| Version | Issue | Fix |
|---------|-------|-----|
| v1 | Initial build | Complete video with all 8 images, TTS narration, ambient music |
| v2-v4 | Audio dropout at ~1:30 | Various ffmpeg amix attempts — all failed or made it worse |
| v5 | Audio dropout | Fixed by extracting WAVs and mixing in Python — clean audio throughout |
| v6 | Dark screens at 1:20 and 5:30; wrong narrative framing | Replaced dark cards with flat images; rewrote 6 scenes for platform dominance narrative |

## Key Narrative Points (v6)

- "The migration is not the product. Migration is the vehicle."
- "Every enterprise we migrate becomes a permanent A365 platform customer"
- "The AI Migration Engine is not a services business — it's a platform growth engine"
- "More users → more data → better platform → more users"
- "Migration is the gateway. A365 dominance is the destination."
- The Ask: measure as platform growth (A365 activations, usage, LTV), not migration revenue

## Open Items

- [ ] Final review of v6 video by Nick
- [ ] Potential further tweaks based on review feedback
- [ ] Video not yet uploaded to YouTube (marked as pending in project.json)
- [ ] Consider updating the white paper HTML to reflect the platform dominance narrative reframe

## Context for Next Session

The AI Migration Engine YouTube video (v6) is complete and ready for review. It presents the vision to internal Altium/Renesas leadership with the correct strategic framing: migration is the vehicle for A365 platform dominance, not a services product. The video uses all 8 whitepaper images, TTS narration, and ambient background music. Audio issues from earlier versions were resolved by mixing audio in Python rather than using ffmpeg's amix filter. The full project workspace is at `~/Desktop/youtube-projects/ai-migration-engine/` with all intermediate assets preserved.
