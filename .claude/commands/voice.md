# Voice Mode

Start a voice conversation using the VoiceMode MCP server.

## Quick Start

Use the `mcp__voicemode__converse` tool to speak and listen:

```
mcp__voicemode__converse(message="Hello! How can I help you today?", wait_for_response=true)
```

## How It Works

1. **Speak** - Your message is converted to speech using TTS (Kokoro or OpenAI)
2. **Listen** - After speaking, automatically listen for the user's response via microphone
3. **Respond** - Process their response and continue the conversation

## Key Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `message` | required | What to say to the user |
| `wait_for_response` | true | Listen for response after speaking |
| `listen_duration_max` | 120 | Max seconds to listen |
| `listen_duration_min` | 2.0 | Min seconds before silence detection |
| `voice` | auto | TTS voice (auto-selected unless specified) |
| `speed` | 1.0 | Speech rate (0.25-4.0) |
| `chime_enabled` | true | Play audio chime before listening |

## Common Patterns

**Start a conversation:**
```
mcp__voicemode__converse(message="Hi! What would you like to work on?")
```

**Announce without waiting for response:**
```
mcp__voicemode__converse(message="Task complete!", wait_for_response=false)
```

**Extended listening (for longer answers):**
```
mcp__voicemode__converse(message="Tell me about your project.", listen_duration_min=5.0)
```

**Faster speech:**
```
mcp__voicemode__converse(message="Here's a quick update.", speed=1.5)
```

## Service Management

Check service status:
```
mcp__voicemode__service(service_name="whisper", action="status")
mcp__voicemode__service(service_name="kokoro", action="status")
```

Start services if needed:
```
mcp__voicemode__service(service_name="whisper", action="start")
mcp__voicemode__service(service_name="kokoro", action="start")
```

## Tips

- Voice mode works best in quiet environments
- Speak clearly after hearing the chime
- The system auto-detects silence to know when you're done speaking
- Use `disable_silence_detection=true` for continuous recording

## Documentation

For detailed docs, read the MCP resources:
- `voicemode://docs/quickstart`
- `voicemode://docs/parameters`
- `voicemode://docs/patterns`
