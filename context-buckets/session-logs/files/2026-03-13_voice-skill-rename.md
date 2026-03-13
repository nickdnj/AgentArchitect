# Voice Skill Rename: /voice → /voice-local

**Date:** 2026-03-13
**Session type:** execution
**Agents involved:** claude-code-guide (research), direct conversation

## Summary

Renamed the custom MCP-based voice skill from `/voice` to `/voice-local` to free up the `/voice` command for Claude Code's native built-in voice mode (rolled out March 3, 2026). The local Whisper + Kokoro setup is preserved as a privacy-first fallback.

## Key Findings

- Claude Code has a native `/voice` command using cloud-based STT/TTS via Anthropic servers
- Native voice supports 20+ languages, push-to-talk via spacebar, hands-free mode
- Our custom skill was overriding the built-in command
- Native voice is cloud-based; our local setup (Whisper + Kokoro) keeps audio on-device

## Decisions Made

- Rename custom voice skill to `/voice-local` (not remove it) — keeps local option as fallback
- Rename `/end-voice` to `/end-voice-local` correspondingly
- User's preference: align with Anthropic native features rather than maintaining custom alternatives

## Artifacts Created

- `.claude/skills/voice-local/SKILL.md` (renamed from voice)
- `.claude/skills/end-voice-local/SKILL.md` (renamed from end-voice)
- `.claude/commands/voice-local.md` (renamed from voice.md)
- Updated `scripts/export-team.js` — skill copy paths and README text
- Updated `scripts/generate-agents.js` — voicemode documentation snippet
- Updated `.gitignore` — updated exclusion paths for hand-crafted skills

## Open Items

- [ ] Test native Claude Code `/voice` in next session
- [ ] Verify spacebar push-to-talk works without custom skill conflict
