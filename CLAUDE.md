# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## User Preferences

### Contact Information
- **Personal Email:** nickd@demarconet.com
- **Wharfside Board Email:** nickd@wharfsidemb.com

When sending emails or reports:
- Use `nickd@demarconet.com` for personal matters and general research reports
- Use `nickd@wharfsidemb.com` for Wharfside Manor board-related communications

## Smart Routing (MANDATORY)

When the user starts a conversation without invoking a specific agent or team, you MUST route to the appropriate orchestrator. Do NOT bypass the orchestrator by calling specialist agents directly. The orchestrator handles routing and delegation.

### Claude Code Environment
If you have access to the `Task` tool with named subagent types, use skill invocation:

| Topic Signals | Invoke Skill |
|---|---|
| Wharfside, board, condo, HOA, marina, bulletin, governing docs, amendment, assessment | `Skill(skill: "wharfside")` |
| Email, calendar, tasks, research, personal, reminders, notes | `Skill(skill: "max")` |
| Altium, PCB, EDA, sales, deployment, customer, Cadence, Mentor, KiCad | `Skill(skill: "altium")` |
| Hardware, PCB, schematic, KiCad, enclosure, firmware, ESP32, Jetson, BOM, DFM, manufacturing | `Skill(skill: "hardware-dev")` |
| Software, code, app, feature, architecture, requirements, development, testing | `Skill(skill: "software-project")` |
| YouTube, video, shorts, content, channel, upload | `Skill(skill: "youtube-content")` |
| Build agent, create team, manage agents, modify agent, bucket | `Skill(skill: "architect")` |

### Cowork Environment
If you have access to the `Agent` tool (with subagent_type="general-purpose"), read the orchestrator file and follow its instructions:

| Topic Signals | Action |
|---|---|
| Wharfside, board, condo, HOA, marina, bulletin, governing docs, amendment, assessment | Read `AgentArchitect/cowork/skills/wharfside/SKILL.md` and follow its orchestration instructions |
| Email, calendar, tasks, research, personal, reminders, notes | Read `AgentArchitect/cowork/skills/max/SKILL.md` and follow its orchestration instructions |
| Altium, PCB, EDA, sales, deployment, customer, Cadence, Mentor, KiCad | Read `AgentArchitect/cowork/skills/altium/SKILL.md` and follow its orchestration instructions |
| Hardware, PCB, schematic, KiCad, enclosure, firmware, ESP32, Jetson, BOM, DFM, manufacturing | Read `AgentArchitect/cowork/skills/hardware-dev/SKILL.md` and follow its orchestration instructions |
| Software, code, app, feature, architecture, requirements, development, testing | Read `AgentArchitect/cowork/skills/software-project/SKILL.md` and follow its orchestration instructions |
| YouTube, video, shorts, content, channel, upload | Read `AgentArchitect/cowork/skills/youtube-content/SKILL.md` and follow its orchestration instructions |
| Build agent, create team, manage agents, modify agent, bucket, sync | Read `AgentArchitect/cowork/skills/architect/SKILL.md` and follow its instructions |

### Project Context Detection (runs BEFORE team routing)

When the user's request mentions a specific project, product, or ongoing initiative — automatically load its context from memory before routing to a team. This ensures continuity across sessions.

**Step 1: Scan MEMORY.md** (already loaded in conversation context)
- Check if the user's request keyword-matches any `## Section` heading or key terms (project names, repo names, product names)
- Common matches: "StoveIQ", "TagSmart", "Batter Up", "Bahr's", "Monmouth Beach", "Seven Presidents", "Vistter", "gatekeeper", etc.

**Step 2: If match found**
- Read the detail memory file (the linked `.md` file from MEMORY.md) at `~/.claude/projects/-Users-nickd-Workspaces-AgentArchitect/memory/<file>.md`
- Briefly confirm: "Loading context for [Project Name]..." (one line, not a wall of text)
- Then proceed to team routing as normal

**Step 3: If no match**
- The request is either a new initiative or a quick question — proceed directly to team routing
- Quick questions (lookups, emails, one-off tasks) don't need project context

**Do NOT:**
- Ask "is this a new project?" for every request — only when it's clearly a substantial new initiative that should be tracked
- Load project context for general questions like "check my email" or "what's the weather"
- Load multiple project contexts at once — pick the best match

### Routing Rules
1. **Run Project Context Detection** (above) to load relevant project memory
2. Match on keywords in the user's request to select a team
3. If ambiguous, ask which team they want
4. If clearly about agent/team management, use the Architect
5. **ALWAYS invoke the team orchestrator** — never call specialist subagents directly. The orchestrator will delegate to the right specialist(s) in their own forked context
6. The only exception is when the user explicitly invokes a specialist skill by name (e.g., `/archivist`)

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
- `node AgentArchitect/scripts/generate-cowork.js` - Generate Cowork orchestrator skills

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

## Cowork Integration (v2.0)

Agent Architect also generates orchestrator files for Cowork mode. Since Cowork's `.skills/` directory is read-only, orchestrators are stored in `cowork/skills/` and loaded via CLAUDE.md routing.

### Architecture

```
agents/<agent-id>/              (SOURCE OF TRUTH - edit these)
├── SKILL.md                    → Behavioral instructions
└── config.json                 → Rich metadata

teams/<team-id>/
└── team.json                   → Members, orchestration config

        ↓ generate (via generate-cowork.js)

cowork/skills/<team-alias>/SKILL.md  (GENERATED - orchestrator for Cowork)
cowork/skills/architect/SKILL.md     (GENERATED - management for Cowork)
cowork/ROUTING.md                    (GENERATED - routing reference)
```

### How Cowork Delegation Works

1. CLAUDE.md routing matches the user's request to a team
2. Claude reads the orchestrator SKILL.md from `cowork/skills/<team>/`
3. Orchestrator instructions tell Claude to read specialist SKILL.md files from `agents/<id>/`
4. Claude delegates via `Agent(subagent_type="general-purpose", prompt="[specialist SKILL.md + task]")`
5. Each specialist runs in its own isolated context via the Agent tool
6. Results come back; orchestrator synthesizes and responds

### Key Differences from Claude Code

- **No named subagent types** — specialists are invoked as `general-purpose` agents with SKILL.md content in the prompt
- **MCP tools are global** — Gmail, GDrive, GCal, Chrome are available to all agents natively (no CLI wrappers)
- **No tool isolation** — tool access is advisory (via prompt instructions) rather than enforced
- **Never edit `cowork/` files directly** — regenerate with `node scripts/generate-cowork.js`
