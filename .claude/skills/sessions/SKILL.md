---
name: sessions
description: Browse, search, and tag Claude Code sessions. Find past sessions to resume with `claude -r`.
allowed-tools: Bash, Read
---

# Session Browser

When this skill is invoked, run the session browser script and present the results to the user.

## Behavior

1. Run `python3 scripts/sessions.py` with appropriate flags based on user input
2. Present the output directly — it's already formatted for terminal display

## Flag Mapping

| User says | Command |
|---|---|
| `/sessions` (no args) | `python3 scripts/sessions.py -n 20` |
| `/sessions all` | `python3 scripts/sessions.py --all` |
| `/sessions stove` or any search term | `python3 scripts/sessions.py -s "stove"` |
| `/sessions tags` | `python3 scripts/sessions.py --tags` |
| `/sessions tag <id> "label"` | `python3 scripts/sessions.py --tag <id> "label"` |

## After Display

- If the user asks to resume a session, tell them to run: `claude -r <session-id>`
- If they want to tag the current session, use the --tag command
- The session ID can be a partial prefix (first 8 chars is enough)
