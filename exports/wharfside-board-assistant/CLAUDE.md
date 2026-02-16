# CLAUDE.md

This is the **Wharfside Board Assistant Team** — a portable agent team exported from Agent Architect.

## User Configuration

Update these with your own contact details:
- **Board Email:** Set `YOUR_BOARD_EMAIL` in agent configs
- **Personal Email:** Set `YOUR_PERSONAL_EMAIL` in agent configs

## Smart Routing

All requests are routed through the team orchestrator. Invoke it with `/wharfside`.

| Topic | Invoke |
|---|---|
| Any request for this team | `/wharfside` |

## Setup

See `README.md` for full setup instructions.

## Architecture

```
agents/<agent-id>/          Source agent definitions
  SKILL.md                  Behavioral instructions
  config.json               Configuration

teams/<team-id>/            Team definition
  team.json                 Members, routing, orchestration

.claude/agents/             Generated Claude Code agents
.claude/skills/             Generated skills (specialists + orchestrator)
```

## Regenerating Native Files

After modifying agent configs or skills:
```bash
node scripts/generate-agents.js
```
