# Agent Architect

> *"Every great team starts with a blueprint."*

**Agent Architect** is a master AI agent that designs, builds, and orchestrates teams of specialized AI agents. Think of it as an architect for your AI workforce - it doesn't just create individual agents, it crafts entire teams with clear roles, shared workspaces, and intelligent collaboration patterns.

---

## Meet Archie

<img src="docs/archie.png" alt="Archie the Agent Architect" width="200" align="right" />

**Archie** is the persona behind Agent Architect. A thoughtful, methodical builder who asks the right questions before laying the first brick. Archie believes that:

- **Context is everything** - An agent drowning in irrelevant information is an agent that can't focus
- **Collaboration requires structure** - Great teams don't just happen; they're designed
- **Simplicity scales** - Complex problems need simple, composable solutions

When you work with Archie, you're not just configuring JSON files. You're having a conversation about what you need, who will use it, and how the pieces fit together.

---

## What Does Agent Architect Do?

### Build Individual Agents

Create specialized AI agents with:
- **Skills** - Detailed behavioral instructions (SKILL.md)
- **Tools** - MCP server integrations (Gmail, Google Drive, Google Docs, Chrome, PowerPoint)
- **Context** - Assigned knowledge bases that keep agents focused
- **Collaboration rules** - How they share work with others

### Assemble Agent Teams

Bring agents together into teams with:
- **Clear roles** - Each member has a defined responsibility
- **Shared workspaces** - Team output folders and collaboration spaces
- **Human-reviewed coordination** - You stay in control of the workflow
- **Context isolation** - Members see only what they need

### Manage Context Buckets

Organize your knowledge into reusable containers:
- **Documents** - PDFs, Word docs, markdown files
- **Google Drive folders** - On-access sync keeps content current
- **Codebases** - Source code and technical documentation
- **Custom sources** - Whatever your agents need to do their jobs

---

## Key Concepts

### Context Isolation

The secret to effective AI agents? **Give them less, not more.**

Agent Architect enforces context isolation by default. Each agent receives only its assigned context buckets - no more, no less. This prevents:

- **Distraction** - Agents stay focused on their specific domain
- **Confusion** - No mixing up information from unrelated sources
- **Token waste** - Smaller, relevant context means better performance

### The Briefing Pattern

How do agents collaborate without sharing everything?

**Briefings.** When an agent completes work, it produces:
1. **Full output** - The complete work product in its output folder
2. **Briefing** - A condensed summary that goes to the team workspace

Other agents read the briefing - the conclusions, recommendations, and action items - without inheriting the full context. Information flows. Context doesn't bleed.

### Thin Orchestrator Pattern (v2.0)

Teams use a **thin orchestrator** that routes requests to specialist subagents:

1. **You invoke a team** (e.g., `/wharfside`, `/altium`, `/max`)
2. The **orchestrator parses** your request and selects specialist(s)
3. Specialists run in **forked contexts** (isolated context windows)
4. Only **concise results** return to the orchestrator
5. The orchestrator **synthesizes** and responds

This prevents context blowout by keeping heavy work isolated in subagents. The orchestrator stays lean — it routes, delegates, and synthesizes, but never does deep analysis itself.

### Agent Types

| Type | Context | Purpose |
|------|---------|---------|
| **Specialist** | Forked (isolated) | Deep, focused work in own context window |
| **Orchestrator** | Inline (shared) | Routes requests, delegates to specialists |
| **Utility** | Forked (isolated) | Service agents called by others (Chrome, RAG) |

---

## Real-World Example: Wharfside Board Assistant

Here's an actual team built with Agent Architect for a condominium association board:

### The Archivist Agent

The **Archivist** is the knowledge keeper for the association. It:

- **Retrieves documents** from Google Drive archives
- **Syncs documents** from the AppFolio management portal
- **Provides context** to other agents when they need historical information
- **Cites sources** for every piece of information it provides

**Key capabilities:**
- Portal sync with Chrome MCP for browser automation
- Organized local storage with folder structure mirroring the portal
- Google Drive integration for document search and retrieval

```
agents/archivist/
├── SKILL.md       # 350+ lines of behavioral instructions
└── config.json    # MCP servers, context buckets, sync settings
```

**Portal Sync Workflow:**
1. Navigate to AppFolio portal using Chrome MCP
2. Expand folders to reveal document contents
3. Download documents to local sync folder
4. Organize into structured subfolders
5. User uploads to Google Drive for archival

### The Team Structure

```
teams/wharfside-board-assistant/
├── team.json          # Team configuration
├── outputs/           # Final deliverables
└── workspace/         # Briefings and collaboration

context-buckets/wharfside-docs/
├── bucket.json        # Bucket configuration
└── files/             # Local document cache
```

### Agents Working Together

| Agent | Role | Context |
|-------|------|---------|
| **Archivist** | Knowledge retrieval & document sync | All association documents |
| **Monthly Bulletin** | Community communications | Past bulletins, calendar |
| **Proposal Review** | Vendor proposal analysis | Historical costs, contracts |
| **Email Research** | Email analysis & response | Board email archives |
| **Presentation** | Board meeting presentations | Meeting agendas, data |

Each agent sees only its assigned context. The Archivist provides briefings when other agents need historical information.

### Software Project Team

A second team demonstrates Agent Architect's flexibility for software development:

| Agent | Role | Workflow Stage |
|-------|------|----------------|
| **Product Requirements** | PRD generation | Discovery |
| **Software Architecture** | System design | Design |
| **UX Design** | User experience docs | Design (parallel) |
| **Dev Planning** | Sprint breakdown | Planning |
| **QA Strategy** | Test planning | Planning |
| **Marketing** | Go-to-market content | Launch |
| **Sales** | Sales enablement | Launch |
| **Legal** | Compliance review | Throughout |

This team follows a structured workflow with defined handoffs between stages.

---

## Claude Code Native Integration (v2.0)

Agent Architect integrates deeply with Claude Code's native agent and skill systems, generating **three types of outputs**:

### Architecture

```
agents/<agent-id>/              (SOURCE OF TRUTH - edit these)
├── SKILL.md                    → Behavioral instructions
└── config.json                 → Rich metadata (agent_type, execution, delegation)

teams/<team-id>/
└── team.json                   → Members, orchestration config, routing tables

        ↓ generate (via /sync-agents)

.claude/agents/<agent-id>.md         (Native agent definitions)
.claude/skills/<agent-id>/SKILL.md   (Forked skills for specialists)
.claude/skills/<team-id>/SKILL.md    (Orchestrator skills for teams)
```

### Using `/sync-agents`

After creating or modifying agents, run the sync command:

```bash
# In Claude Code
/sync-agents

# Or directly
node scripts/generate-agents.js
```

This generates:
- **Agent files** (`.claude/agents/`) - Full agent definitions with SKILL.md content
- **Specialist skills** (`.claude/skills/<agent-id>/`) - Forked execution wrappers for specialists
- **Team orchestrators** (`.claude/skills/<team-id>/`) - Routing and delegation logic for teams

### How It Works

| Component | What It Does | Context |
|-----------|-------------|---------|
| **Team command** (`/wharfside`) | Entry point - routes to orchestrator | Shared with user |
| **Orchestrator skill** | Routes request, selects specialists | Shared with user |
| **Specialist skill** | Wraps agent for forked execution | **Own context window** |
| **Agent definition** | Full SKILL.md + operational config | Loaded by specialist |

### Config.json Schema (v2.0)

```json
{
  "agent_type": "specialist",
  "execution": {
    "context": "fork",
    "max_turns": 20,
    "model": "sonnet"
  },
  "delegation": {
    "available_specialists": ["agent-1", "agent-2"],
    "parallel_allowed": true
  }
}
```

### Key Points

- **Never edit `.claude/agents/*.md` or `.claude/skills/` directly** - they're regenerated
- **Source of truth is `agents/` and `teams/` directories**
- **Generated files are git-ignored** - each user regenerates locally after clone
- **Specialists run in forked contexts** - prevents context blowout
- **Orchestrators delegate everything** - they route, don't do deep work

---

## Getting Started

### Prerequisites

- [Claude Code](https://claude.ai/code) (CLI)
- Docker (for MCP servers)
- Google Cloud credentials (for Gmail, Drive, Docs integrations)

### Installation

```bash
git clone https://github.com/nickdnj/AgentArchitect.git
cd AgentArchitect
```

### First Run

Open the repository in Claude Code:

```bash
claude
```

**Generate native agents** (recommended after clone):

```
/sync-agents
```

This creates Claude Code native agent files in `.claude/agents/` that enable native delegation.

**Load the Architect** for team/agent management:

```
/architect
```

Archie will guide you through:

1. Checking for updates
2. Loading your registries
3. Presenting the main menu

```
Agent Architect - Main Menu

Teams: 5 registered
Agents: 36 registered
Context Buckets: 6 registered

What would you like to do?
1. Create a new team
2. Create a new agent
3. Create a context bucket
4. Manage existing teams
5. Manage existing agents
...
```

### Available Commands

| Command | Purpose |
|---------|---------|
| `/architect` | Load Archie for team/agent management |
| `/sync-agents` | Generate Claude Code native agents, skills, and orchestrators |
| `/wharfside` | Wharfside Board Assistant (thin orchestrator) |
| `/altium` | Altium Solutions Team (thin orchestrator) |
| `/software-project` | Software Project Team (thin orchestrator) |
| `/max` | Max - Personal Assistant (orchestrator) |
| `/save` | Manual session memory snapshot |
| `/recall` | Retrieve past session context |

---

## Repository Structure

```
AgentArchitect/
├── CLAUDE.md                    # Claude Code entry point
├── README.md                    # You are here
│
├── Architect/                   # The Architect agent itself
│   ├── SKILL.md                 # Archie's behavioral instructions
│   └── config.json              # Architect configuration
│
├── agents/                      # Individual agents (SOURCE OF TRUTH)
│   ├── _templates/              # Agent templates
│   │   ├── researcher/
│   │   ├── analyst/
│   │   ├── writer/
│   │   └── reviewer/
│   ├── archivist/               # Document archivist
│   ├── monthly-bulletin/        # Community communications
│   ├── proposal-review/         # Vendor proposal analysis
│   ├── email-research/          # Email analysis
│   ├── presentation/            # Meeting presentations
│   ├── product-requirements/    # PRD generation
│   ├── software-architecture/   # System design
│   ├── ux-design/               # UX documentation
│   ├── dev-planning/            # Sprint planning
│   ├── qa-strategy/             # Test planning
│   ├── marketing/               # Marketing content
│   ├── sales/                   # Sales materials
│   ├── legal/                   # Legal review
│   └── pdf-scribe/              # PDF transcription (custom MCP server)
│
├── teams/                       # Agent teams
│   ├── _templates/
│   │   ├── advisory-team/
│   │   └── project-team/
│   ├── wharfside-board-assistant/  # Condo board team
│   └── software-project/           # Software dev team
│
├── context-buckets/             # Knowledge bases
│   ├── _templates/
│   │   ├── document-collection/
│   │   └── codebase/
│   └── wharfside-docs/          # Example bucket
│       ├── bucket.json
│       └── files/
│
├── scripts/                     # Utility scripts
│   └── generate-agents.js       # Generates agents, skills, and orchestrators (v2.0)
│
├── mcp-servers/                 # MCP integrations
│   ├── registry/servers.json    # Available servers
│   └── assignments.json         # Access control
│
├── registry/                    # Global registries
│   ├── agents.json              # All registered agents
│   ├── teams.json               # All registered teams
│   └── buckets.json             # All registered buckets
│
└── .claude/                     # Claude Code config
    ├── settings.local.json
    ├── agents/                  # Generated native agents (git-ignored)
    │   └── *.md                 # Run /sync-agents to regenerate
    ├── skills/                  # Generated skills (git-ignored)
    │   ├── <agent-id>/SKILL.md  # Forked specialist skills
    │   └── <team-id>/SKILL.md   # Team orchestrator skills
    └── commands/
        ├── architect.md         # /architect - Team/agent management
        ├── wharfside.md         # /wharfside - Board assistant orchestrator
        ├── altium.md            # /altium - Sales team orchestrator
        ├── software-project.md  # /software-project - Dev team orchestrator
        ├── max.md               # /max - Personal assistant orchestrator
        └── sync-agents.md       # /sync-agents - Generate all outputs
```

---

## Available MCP Servers

| Server | Purpose | Use Case |
|--------|---------|----------|
| **Gmail** | Email search, read, send | Board communications, research |
| **Gmail Personal** | Personal email account | Separate account access |
| **Google Drive** | Document storage & search | Archive access, file management |
| **Google Docs** | Document creation & editing | Reports, meeting minutes |
| **Chrome** | Browser automation | Portal sync, web scraping |
| **PowerPoint** | Presentation creation | Board meeting presentations |
| **PDFScribe** | PDF transcription | Scanned document extraction |

### PDFScribe - Our First Custom MCP Server

**PDFScribe** is our first homegrown MCP server, built to solve a real problem: making scanned PDFs searchable and accessible to AI agents.

**The Problem:** Many critical documents (inspection reports, legacy contracts, handwritten notes) exist only as scanned images. Standard text extraction fails. AI agents can't read them.

**The Solution:** PDFScribe uses Claude Sonnet 4's vision capabilities to transcribe image-based PDFs into structured Markdown. It's not OCR - it's AI-powered document understanding.

**Key Features:**
- **Vision-based transcription** - Reads scanned documents like a human would
- **Intelligent caching** - Stores transcriptions next to source files, validates by checksum
- **Google Drive integration** - Download PDFs, upload transcriptions automatically
- **350x faster** on cache hits (~0.2s vs ~70s for a 12-page document)

**Example:**
```bash
# Process a Google Drive PDF - downloads, transcribes, uploads MD next to source
python pdfscribe_cli.py --gdrive 1xtoBO7vjnOfNoXmdDn7w3sg-Ds1zHmdt
```

**Production Use:** PDFScribe has transcribed 89 pages across 7 building inspection reports, making previously inaccessible information available to all agents.

See [pdfscribe_cli](https://github.com/nickdnj/pdfscribe_cli) for the full documentation.

### MCP Server Assignment

Agents are assigned only the MCP servers they need:

```json
{
  "mcp_servers": [
    "google-drive",
    "google-docs",
    "chrome"
  ]
}
```

The Architect manages these assignments based on agent requirements.

---

## Agent Configuration

Each agent has two files:

### SKILL.md - Behavioral Instructions

Detailed instructions that define:
- Purpose and responsibilities
- Workflow steps
- Response formats
- Collaboration patterns
- Error handling

### config.json - Technical Configuration

```json
{
  "name": "Archivist",
  "description": "Knowledge keeper and document retrieval specialist",
  "agent_type": "specialist",
  "execution": {
    "context": "fork",
    "max_turns": 20,
    "model": "sonnet"
  },
  "mcp_servers": ["google-docs", "pdfscribe"],
  "context_buckets": {
    "assigned": ["wharfside-docs"],
    "access_level": "read-write"
  },
  "collaboration": {
    "can_request_from": ["chrome-browser"],
    "provides_to": ["monthly-bulletin", "proposal-review"],
    "handoff_format": "structured-summary"
  }
}
```

---

## Agent Templates

Agent Architect includes templates for common agent types:

| Template | Purpose | Best For |
|----------|---------|----------|
| **Researcher** | Information gathering and synthesis | Finding and summarizing information |
| **Analyst** | Evaluation and recommendations | Assessing situations, risk analysis |
| **Writer** | Content creation and editing | Communications, reports, documentation |
| **Reviewer** | Quality and compliance checking | Document review, feedback generation |

---

## Team Templates

| Template | Purpose | Workflow |
|----------|---------|----------|
| **Advisory Team** | Guidance and recommendations | Research → Analyze → Recommend → Communicate |
| **Project Team** | Deliverable execution | Requirements → Planning → Execution → Review → Delivery |

---

## Lessons Learned

Building real agents taught us valuable lessons:

### Portal Sync Challenges

- **iCloud folders cause issues** - Use non-synced local folders for downloads
- **Folders need expansion** - Portal folders appear collapsed; must click to reveal contents
- **Browser limitations** - Chrome MCP can't change download location; post-download organization needed
- **"Recent" sections are duplicates** - Skip them during sync to avoid redundancy

### Context Management

- **Less is more** - Agents perform better with focused, relevant context
- **Briefings beat raw context** - Sharing summaries prevents context bleed
- **Structure enables collaboration** - Clear folder organization makes handoffs smooth

### Agent Design

- **Detailed SKILL.md pays off** - The more specific the instructions, the better the results
- **Error handling matters** - Agents need clear guidance for edge cases
- **Cite everything** - Agents should always reference their sources

---

## Philosophy

Agent Architect is built on these principles:

1. **Agents should be specialists** - One agent, one domain, one purpose
2. **Context should be minimal** - Give agents only what they need
3. **Collaboration should be structured** - Briefings, not brain dumps
4. **Humans should stay in control** - Review before handoff
5. **Configuration should be conversation** - Archie asks, you answer

---

## Roadmap

- [x] Claude Code native agent integration (`/sync-agents`)
- [x] **PDFScribe MCP Server** - Custom PDF transcription with Claude vision
- [x] Google Drive integration for PDFScribe (download + upload)
- [x] Intelligent caching with checksum validation
- [x] **Architecture v2.0** - Thin orchestrator pattern with forked subagents
- [x] **Forked skill generation** - Specialists run in isolated context windows
- [x] **Team orchestrator skills** - Auto-generated routing and delegation
- [x] **Smart routing** - Auto-dispatch bare conversations to correct team
- [x] **Session summaries** - Auto-generated session logs from orchestrators
- [x] **Agent type classification** - Specialist, orchestrator, utility with model preferences
- [ ] Automated portal sync scheduling
- [ ] Context bucket versioning
- [ ] Team performance analytics
- [ ] Additional custom MCP server integrations
- [ ] Watch mode for auto-regeneration on file changes
- [ ] PDFScribe as a service (commercial offering)

---

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

---

## License

MIT License - See [LICENSE](LICENSE) for details.

---

<p align="center">
  <em>Built with care by humans and AI, working together.</em>
</p>
