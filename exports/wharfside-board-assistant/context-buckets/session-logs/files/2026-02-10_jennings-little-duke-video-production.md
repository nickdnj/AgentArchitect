# Jennings Little Duke - Video Production & YouTube Upload

**Date:** 2026-02-10
**Session type:** execution
**Agents involved:** Max (Personal Assistant), YouTube Creator

## Summary

Continued from the research+scripting session. Fixed critical video issues (photo framing and audio), then uploaded to YouTube. The uploaded version lacks audio and needs to be replaced.

## Key Findings

- **Photo framing issue:** The original ffmpeg pipeline used `crop=iw:iw*9/16` to force 4:3 photos into 16:9, which cut off the top (lever) and bottom (base) of the machine. Even at zoom=1.0, the machine wasn't fully visible.
- **Fix:** Replaced crop with `pad` -- `scale=-2:2700,pad=4800:2700:(ow-iw)/2:0:0x111111` -- which fits the full 4:3 image into a 16:9 frame with narrow dark bars on the sides.
- **Audio issue:** `seg-01-title.mp4` and `seg-16-outro.mp4` had no audio tracks. The ffmpeg concat demuxer uses the first file's stream layout as template -- since the first file (title) had no audio, ALL audio was dropped from the output.
- **Audio format mismatch:** Narration segments were 24000Hz mono, while silence segments were 44100Hz stereo. Concat with `-c copy` can't handle mixed formats.
- **Final fix:** Built audio and video as completely separate tracks, then muxed: (1) all narration WAVs concatenated into one AAC file at 44100Hz stereo, (2) all video segments concatenated video-only, (3) muxed together with `-shortest`.

## Decisions Made

- Used `pad` instead of `crop` for 4:3→16:9 conversion (dark side bars, full machine visible)
- Used dark gray (`0x111111`) for padding bars
- Zoom levels kept very subtle: 1.0-1.06 range for gentle Ken Burns motion
- Published to YouTube as Unlisted initially
- Marked "altered content = yes" for AI-generated images
- Category set to Education

## Artifacts Created

- **Video (final with audio):** `${HOME_PATH} (7:36, 179MB)
- **Fix script:** `${HOME_PATH}
- **Audio concat list:** `${HOME_PATH}
- **YouTube upload (NO AUDIO - needs replacement):** https://youtu.be/4_plMAMMqgI

## YouTube Metadata Applied

- **Title:** This 1932 Penny Slot Machine Has Mob Ties | The Jennings Little Duke
- **Description:** Full write-up with timestamps, machine details, hashtags
- **Tags:** 15 tags (Jennings Little Duke, penny slot machine, antique slot machine, trade stimulator, Art Deco, 1930s history, Depression era, Frank Costello, LaGuardia sledgehammer, slot machine history, vintage gambling, collectible antiques, family heirloom, O.D. Jennings, one armed bandit)
- **Category:** Education
- **Audience:** Not made for kids
- **Altered content:** Yes (AI-generated images)

## Open Items

- [ ] **CRITICAL: Re-upload video to YouTube** - Current upload at https://youtu.be/4_plMAMMqgI has NO AUDIO. Need to delete and re-upload the fixed file from `${HOME_PATH}
- [ ] Change visibility from Unlisted to Public when ready
- [ ] Chrome MCP disconnected mid-session - may need Claude Code restart to reconnect
- [ ] Consider adding a custom thumbnail (currently using auto-generated)

## Context for Next Session

The Jennings Little Duke video is fully produced locally with correct framing and audio. The version currently on YouTube (https://youtu.be/4_plMAMMqgI) is broken -- it was uploaded before the audio fix. Nick needs to either: (1) delete the broken upload and re-upload the fixed file manually via YouTube Studio, or (2) restart Claude Code to reconnect Chrome MCP and have Max handle the re-upload. The local file at `jennings-little-duke.mp4` is the correct final version. All metadata (title, description, tags, category) was already configured on the first upload and can be reused.
