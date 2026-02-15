---
name: end-voice
description: Deactivate voice mode and return to text-only interaction
allowed-tools: mcp__voicemode__converse
---

# End Voice Mode

When this skill is invoked, exit voice mode and return to normal text-based interaction.

## Shutdown Sequence

1. **Say goodbye** — Use `mcp__voicemode__converse` with `wait_for_response=false`: "Voice mode off. Switching back to text."
2. **Resume text mode** — All subsequent responses should be normal text output. Do NOT use `mcp__voicemode__converse` after this point.

Note: This does NOT stop the whisper/kokoro services (they can stay running for next time). It only changes the interaction mode.

$ARGUMENTS
