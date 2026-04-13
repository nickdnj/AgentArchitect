# Agent Architect Dashboard & Session Browser

**Date:** 2026-04-11 to 2026-04-13
**Session type:** execution
**Agents involved:** Architect, data extraction agents

## Summary

Built a comprehensive single-page dashboard for the Agent Architect system that showcases all 6 teams, 48 agents, org charts, agent bios, tools, SKILL.md viewer, project participation, and analytics. Also built a session browser utility (`scripts/sessions.py`) with search, tagging, and a `/sessions` slash command.

## Key Artifacts Created

### Dashboard (`dashboard.html`)
- **Overview** - Stats cards (48 agents, 6 teams, 7 buckets, 10+ MCP integrations), team cards with avatars, "How It Works" explainer
- **Analytics** - Donut charts (agent types, model distribution), team size bars, MCP server usage, project status across all teams (16 live, 4 WIP, 1 draft, 4 complete), creation timeline
- **Team Detail** - Org chart (orchestrator -> specialists with model badges), project list with status pills, member cards
- **Agent Profile** - Full bio/purpose, expertise domains, capabilities, allowed tools (core + MCP operations grouped by server), collapsible SKILL.md viewer with rendered markdown
- **Agent Directory** - All 48 agents searchable/filterable by name, domain, capability, or type

### Data Files
- `dashboard-data.json` (~85KB) - Full team/agent metadata extracted from all config.json and SKILL.md files
- `dashboard-skills-compact.json` (~523KB) - Full SKILL.md content for all 48 agents (loaded async by dashboard)
- `dashboard-skills.json` (~525KB) - Detailed extraction with tools lists

### Session Browser (`scripts/sessions.py`)
- Scans all `~/.claude/projects/*/\*.jsonl` session files and extracts metadata
- Shows session ID, timestamp, duration, message count, branch, project, first prompt
- Search by keyword: `python3 scripts/sessions.py -s "stove"`
- Tag sessions: `python3 scripts/sessions.py --tag <id> "label"`
- View tagged: `python3 scripts/sessions.py --tags`
- Tags stored in `~/.claude/session-tags.json`
- Slash command: `/sessions` skill at `.claude/skills/sessions/SKILL.md`

## Technical Notes

- Dashboard loads SKILL.md data from external JSON file (too large to inline at 523KB)
- Requires local HTTP server for SKILL.md viewer: `python3 -m http.server 8787` then visit `localhost:8787/dashboard.html`
- Without server, dashboard still works for overview/analytics/teams/cards — just SKILL.md panel shows placeholder
- MCP tool inventory is built from a static mapping of server -> operations, combined with each agent's configured MCP servers

## Open Items

- [ ] Consider deploying dashboard to a persistent URL (Firebase, Vercel, etc.)
- [ ] Add session history view to the dashboard itself
- [ ] Dashboard data files need regeneration when agents are added/modified
- [ ] Could add a `/refresh-dashboard` skill to auto-regenerate data files

## Context for Next Session

The dashboard is complete and functional at `dashboard.html`. It reads `dashboard-data.json` for team/agent metadata and `dashboard-skills-compact.json` for SKILL.md content. The session browser is a standalone Python script at `scripts/sessions.py` with a `/sessions` skill. Both are tested and working.
