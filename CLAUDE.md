# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## User Preferences

### Contact Information
- **Personal Email:** nickd@demarconet.com
- **Wharfside Board Email:** nickd@wharfsidemb.com

When sending emails or reports:
- Use `nickd@demarconet.com` for personal matters and general research reports
- Use `nickd@wharfsidemb.com` for Wharfside Manor board-related communications

## Smart Routing

When the user starts a conversation without invoking a specific agent or team, automatically route to the appropriate orchestrator based on the topic:

| Topic Signals | Route To | Skill |
|---|---|---|
| Wharfside, board, condo, HOA, marina, bulletin, governing docs, amendment, assessment | Wharfside Board Assistant | `/wharfside` |
| Email, calendar, tasks, research, personal, reminders, notes | Max - Personal Assistant | `/max` |
| Altium, PCB, EDA, sales, deployment, customer, Cadence, Mentor, KiCad | Altium Solutions Team | `/altium` |
| Software, code, app, feature, architecture, requirements, development, testing | Software Project Team | `/software-project` |
| YouTube, video, shorts, content, channel, upload | YouTube Content Team | (invoke youtube-content skill) |
| Build agent, create team, manage agents, modify agent, bucket | Agent Architect | `/architect` |

**Routing Rules:**
1. Match on keywords in the user's request
2. If ambiguous, ask which team they want
3. If clearly about agent/team management, use the Architect
4. The routed team orchestrator will handle delegation to specialist subagents

## Getting Started (Agent Management)

To create or manage agents, load the Architect with `/architect`. The Architect will:
1. Check GitHub for updates and pull if approved
2. Load registries (agents, teams, context buckets)
3. Present the main menu for agent/team management
4. Guide you through creating or managing agents and teams

Do not directly create agents or teams without the Architect's guidance.

## Repository Overview

This repository contains the **Agent Architect** system - a master agent for building and managing agent teams. Each agent is defined by a `SKILL.md` file (instructions) and a `config.json` file (configuration). Teams are defined by `team.json` files that specify members and collaboration rules.

## Architecture

### Directory Structure

```
AgentArchitect/
├── Architect/              # The Architect agent itself
├── agents/                 # Individual agent definitions
│   ├── _templates/         # Agent templates
│   └── <agent-id>/         # Created agents
├── teams/                  # Team definitions
│   ├── _templates/         # Team templates
│   └── <team-id>/          # Created teams
├── context-buckets/        # Knowledge bases
│   ├── _templates/         # Bucket templates
│   └── <bucket-id>/        # Created buckets
├── mcp-servers/            # MCP server configuration
├── registry/               # Global registries
└── .claude/                # Claude Code configuration
```

### Core Concepts

| Concept | Description |
|---------|-------------|
| **Agent** | Individual AI assistant with SKILL.md + config.json |
| **Team** | Collection of agents working together |
| **Context Bucket** | Assignable knowledge base (docs, code, etc.) |
| **MCP Server** | External tool integration (Gmail, GDrive, etc.) |

### Agent Definition Pattern

Each agent has two required files:
- `SKILL.md` - Detailed behavioral instructions
- `config.json` - Configuration including MCP servers, context buckets, and collaboration rules

### Team Definition Pattern

Each team has:
- `team.json` - Members, shared context, and collaboration rules
- `outputs/` - Team output folder
- `workspace/` - Shared workspace for briefings

### Context Isolation

Agents receive only their assigned context buckets. This prevents context bleed and keeps agents focused. Teams can have shared buckets for collaboration.

### Collaboration Pattern

Agents share work via "briefings" - condensed summaries that go to the team workspace. This allows collaboration without sharing raw context.

## MCP Server Dependencies

Available MCP servers (configured in `mcp-servers/`):
- `gmail` / `gmail-personal` - Email operations
- `gdrive` / `gdrive-personal` - Google Drive access
- `google-docs` - Document creation and editing
- `chrome` - Browser automation
- `powerpoint` - Presentation creation
- `github` - Repository operations

## Commands

- `/architect` - Load the Architect agent for team/agent management
- `/sync-agents` - Generate Claude Code native agents from Agent Architect definitions

## Claude Code Native Agent Integration (v2.0)

Agent Architect is the **source of truth** for agent definitions. Claude Code native agents AND skills are **generated** from source definitions.

### Architecture

```
agents/<agent-id>/              (SOURCE OF TRUTH - edit these)
├── SKILL.md                    → Behavioral instructions
└── config.json                 → Rich metadata (includes agent_type, execution, delegation)

teams/<team-id>/
└── team.json                   → Members, orchestration config, routing

        ↓ generate (via /sync-agents)

.claude/agents/<agent-id>.md    (GENERATED - native agent definitions)
.claude/skills/<agent-id>/SKILL.md  (GENERATED - forked skill for specialists)
.claude/skills/<team-id>/SKILL.md   (GENERATED - orchestrator skill for teams)
```

### Agent Types

| Type | Context | Purpose |
|------|---------|---------|
| **specialist** | `fork` | Does focused work in isolated context window |
| **orchestrator** | `inline` | Routes requests, delegates to specialists |
| **utility** | `fork` | Service agent called by others (Chrome, RAG) |

### Orchestrator Pattern

Team orchestrators are **thin routers** that:
1. Parse the user's request
2. Select the right specialist(s) from the team roster
3. Delegate via `Task(subagent_type="Agent Name", prompt="...")`
4. Each specialist runs in its **own context window** (forked)
5. Only the result comes back to the orchestrator
6. Orchestrator synthesizes and responds

This prevents context blowout by keeping heavy work isolated in subagents.

### Workflow

1. **Create/Edit agents** in `agents/<agent-id>/` using `/architect`
2. **Run `/sync-agents`** to generate Claude Code native format (agents + skills + orchestrators)
3. **Use teams** via skill invocation — orchestrators auto-delegate to specialists

### Key Points

- **Never edit `.claude/agents/*.md` or `.claude/skills/*/SKILL.md` directly** - changes will be overwritten
- **Generated files are git-ignored** - each user regenerates locally
- **Rich metadata preserved** - agent_type, execution config, collaboration rules stored as HTML comments
- **Skills enable forked execution** - specialists get their own context window via `context: fork`
- **Team skills are orchestrators** - they route and delegate, never do deep work themselves
