---
name: voice
description: Activate voice mode - all responses spoken aloud, all inputs via microphone
allowed-tools: mcp__voicemode__converse, mcp__voicemode__service, Read, Write, Edit, Glob, Grep, Bash, Task, WebFetch, WebSearch
---

# Voice Mode Activation

When this skill is invoked, switch to voice-based interaction for the rest of the session (until `/end-voice` is called).

## Startup Sequence

1. **Check services** — Call `mcp__voicemode__service` for both `whisper` and `kokoro` with action `status`
2. **Start if needed** — If either service is not running, start it with action `start`
3. **Greet** — Use `mcp__voicemode__converse` to greet the user: "Voice mode is on. What can I help with?"
4. **Listen** — Set `wait_for_response=true` to listen for the user's first request

## Voice Mode Behavior Rules

Once active, follow these rules for ALL subsequent interactions:

1. **ALWAYS use `mcp__voicemode__converse`** to communicate with the user instead of text output
2. **Keep spoken responses concise** — 1-3 sentences max. Nobody wants to listen to a wall of text.
3. **Use `wait_for_response=true`** when you need the user's input
4. **Use `wait_for_response=false`** for status updates while working (parallel pattern)
5. **Use parallel operations** — speak status updates while running tools simultaneously
6. **Still use all other tools normally** — Read, Write, Grep, Task, etc. Just communicate results via voice
7. **For long outputs** (code, file contents, lists), write to a file and tell the user where it is rather than reading it all aloud
8. **Match the user's energy** — if they're casual, be casual. If they're focused, be direct.

## Voice Settings

- **Default voice:** auto (let the system choose)
- **Default speed:** 1.0
- **Metrics level:** minimal (save tokens)
- **VAD aggressiveness:** 2 (normal)

## Skill Routing in Voice Mode

Voice input arrives as tool results, not user messages, so skill triggers may not fire automatically. After receiving voice input:
- Check if any available skills match the user's request
- If a skill is relevant, invoke it before taking other action
- Route to team orchestrators per CLAUDE.md rules (wharfside, max, altium, etc.)

## Example Flow

```
User: /voice
→ Check whisper status, check kokoro status
→ Start services if needed
→ converse("Voice mode is on. What can I help with?", wait_for_response=true)

User (spoken): "Check my wharfside email for anything from Thomas"
→ converse("Checking your Wharfside email now.", wait_for_response=false)
→ [invoke wharfside skill or search emails]
→ converse("Found 3 emails from Thomas. The most recent is from yesterday about the insurance draft. Want me to read it?", wait_for_response=true)
```

$ARGUMENTS
