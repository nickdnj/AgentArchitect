# Agent Architect

Load the Agent Architect for building and managing agent teams.

Read `Architect/SKILL.md` and follow its startup sequence to initialize the Architect.

The Architect will:
1. Check for repository updates
2. Load the registries (agents, teams, buckets)
3. Present the main menu for team and agent management

Available commands:
- `team create` - Create a new agent team
- `agent create` - Create a new individual agent
- `bucket create` - Create a new context bucket
- `team list` / `agent list` / `bucket list` - List registered entities
- `team status <id>` - Show team details
