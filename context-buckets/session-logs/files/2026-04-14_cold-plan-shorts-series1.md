# Cold Plan YouTube Shorts — Series 1 Production & Publishing

**Date:** 2026-04-14
**Session type:** execution
**Agents involved:** YouTube Content (voice mode), Chrome Browser (MCP), GPT-image-1, ElevenLabs TTS

## Summary

Planned, produced, and published 6 YouTube Shorts for Cold Plan's "What's REALLY In..." series. Each short deconstructs a brand-name cold medicine into its generic pill equivalents with price comparison. All 6 uploaded to YouTube and scheduled to publish every other day from Apr 15-25, 2026 at 10 AM ET.

## Key Findings

- Falore art style (warm editorial illustration) is the locked visual style — iterated from photorealistic to this
- ElevenLabs Josh voice (ID: TxGEqnHWrfWFTfGW9XjX) selected after testing Kokoro, OpenAI Ash, and ElevenLabs Adam
- Brand names (Tylenol, Benadryl, Robitussin) in narration tested better than generic names (acetaminophen, diphenhydramine, dextromethorphan)
- Impact font for TikTok-style narration captions, Futura for info labels
- CTA narration captions must move to y=h*0.30 during CTA scene to avoid overlapping URL/tagline block at y=h*0.78
- ElevenLabs free tier has 3 concurrent request limit — generate sequentially or in batches of 3

## Decisions Made

- Staggered publishing (every other day) instead of big bang — each short gets its own algorithmic test window
- Lead with NyQuil (most recognizable), close with Theraflu ("Fancy? Not really." mic drop)
- Production style LOCKED — saved to memory as reusable template for all future shorts
- CTA includes trust line: "Free. No login. No ads. No data collected."
- All descriptions include cold-plan-app.web.app link and hashtags

## Artifacts Created

- 6 final shorts: `shorts/s1-{1-6}-*/output/*-final.mp4`
- Reusable assembly script: `shorts/assemble-short.sh`
- Full scripts: `shorts/scripts-all.md`
- Commercial plan: `shorts-commercial-plan.md`
- Metadata JSON: `shorts/metadata-all.json`
- Overlay files for each short: `shorts/s1-*/overlay.txt`
- CTA phone frame: `shorts/cta-phone-frame.png`
- Falore-style images: 4 per short (24 total) in `shorts/s1-*/images/`
- ElevenLabs audio: 4 clips per short (24 total) in `shorts/s1-*/audio/`

## YouTube URLs

| Short | Schedule | URL |
|-------|----------|-----|
| NyQuil | Apr 15, 10 AM | https://youtube.com/shorts/0On1BogU5sc |
| Tylenol PM | Apr 17, 10 AM | https://youtube.com/shorts/wjqhkAJwLKk |
| Mucinex DM | Apr 19, 10 AM | https://youtube.com/shorts/yWQSNTrz1TY |
| Advil PM | Apr 21, 10 AM | https://youtube.com/shorts/x4g_KA3Lw-Y |
| DayQuil | Apr 23, 10 AM | https://youtube.com/shorts/_w1nCEl1jCM |
| Theraflu | Apr 25, 10 AM | https://youtube.com/shorts/cTAawoG_Tu4 |

## Channel Updates

- Cold Plan link added to channel bio (Customization > Links)
- ElevenLabs API key (XI_API_KEY) saved to ~/.zshrc

## Open Items

- [ ] Series 2: "Sick Day Math" (4 shorts) — scripts written, not yet produced
- [ ] Series 3: "Kit Check" (4 shorts) — scripts written, not yet produced
- [ ] Series 4: "Pharmacy Doesn't Want You to Know" (4 shorts) — scripts written, not yet produced
- [ ] Add Batter Up (batterupli.com) and TagSmart (tagsmart.vistter.com) links to channel bio
- [ ] Monitor analytics on Series 1 to inform Series 2-4 priority

## Context for Next Session

Series 1 is fully shipped and on autopilot. The production pipeline is locked and repeatable: Falore images via GPT-image-1, ElevenLabs Josh TTS, FFmpeg assembly with 3-layer text overlays (Impact captions + Futura labels + Futura CTA). The reusable assembly script (`assemble-short.sh`) handles video/audio concat and the overlay.txt files handle text. Scripts for all 17 shorts are written in `scripts-all.md`. Next step is producing Series 2-4 using the same pipeline. The Amazon Associates 180-day clock is ticking (deadline ~Oct 10) so traffic generation is time-sensitive.
