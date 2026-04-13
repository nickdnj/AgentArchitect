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

### Docker Deployment
- `Dockerfile.dashboard` - nginx:alpine image
- Running as `agent-architect-dashboard` container on port 8787 with `--restart always`
- Volume-mounted to repo files (not baked in) so changes are live
- URL: http://localhost:8787

### Auto-Refresh Pipeline
- `scripts/refresh-dashboard.py` - Regenerates dashboard-data.json + dashboard-skills-compact.json from source agents/teams
- Hooked into `scripts/generate-agents.js` — runs automatically after `/sync-agents`
- Flow: `/sync-agents` -> generate-agents.js -> refresh-dashboard.py -> Docker serves updated files

### Projects Page (in progress)
- Top-level Projects view added to sidebar navigation
- 26 projects with full agent attribution (which agents built each project)
- Searchable/filterable by status (live/wip/complete/draft)
- Each project card shows: description, contributing agents as clickable chips, team, start date, URL, tags
- **Bug**: Projects page rendering has a browser cache issue — DATA object not loading on hard refresh. Needs debugging in next session.

## Technical Notes

- Dashboard loads SKILL.md data from external JSON file (too large to inline at 523KB)
- Docker container at http://localhost:8787 with volume mounts to live repo files
- MCP tool inventory is built from a static mapping of server -> operations, combined with each agent's configured MCP servers
- Agent detail shows: purpose, domains, capabilities, full tool inventory (core + MCP grouped by server), and collapsible SKILL.md viewer

## Open Items

- [ ] Debug Projects page rendering — DATA object not available on hard cache refresh, works on soft navigate
- [ ] Consider session history view in the dashboard
- [ ] Add a `/refresh-dashboard` skill for manual regeneration

## Context for Next Session

The dashboard is running in Docker at http://localhost:8787 with auto-restart. The Projects page HTML, CSS, JS, and data are all in place (26 projects with agent attribution), but there's a rendering bug where the page sometimes shows empty on a hard browser refresh — likely nginx caching or a JS load order issue. The auto-refresh pipeline works: `/sync-agents` regenerates the data files, and the Docker volume mounts serve them live. The session browser (`scripts/sessions.py`, `/sessions`) is fully working.
