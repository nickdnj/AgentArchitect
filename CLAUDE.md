# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Getting Started

**Always start by loading the Architect agent.** Read `Architect/SKILL.md` and follow its startup sequence. The Architect will:
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

## Claude Code Native Agent Integration

Agent Architect is the **source of truth** for agent definitions. Claude Code native agents are **generated** from `SKILL.md` + `config.json` files.

### Architecture

```
agents/<agent-id>/              (SOURCE OF TRUTH - edit these)
├── SKILL.md                    → Behavioral instructions
└── config.json                 → Rich metadata

        ↓ generate (via /sync-agents)

.claude/agents/<agent-id>.md    (GENERATED - do not edit)
```

### Workflow

1. **Create/Edit agents** in `agents/<agent-id>/` using `/architect`
2. **Run `/sync-agents`** to generate Claude Code native format
3. **Use agents** via Claude Code's native delegation or team orchestration

### Key Points

- **Never edit `.claude/agents/*.md` directly** - changes will be overwritten
- **Generated files are git-ignored** - each user regenerates locally
- **Rich metadata preserved** - collaboration rules, workflow position stored as HTML comments
- **Team orchestration unchanged** - Architect still coordinates multi-agent workflows
