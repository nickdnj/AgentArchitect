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
- **Tools** - MCP server integrations (Gmail, Google Drive, Google Docs, PowerPoint)
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

### Human-Reviewed Coordination

By default, Agent Architect uses **human-reviewed coordination**:

1. Agent completes a task
2. Output goes to team workspace
3. **You review** before triggering the next step
4. Explicit handoff to the next agent

You're the orchestrator. The agents are your team.

---

## Getting Started

### Prerequisites

- [Claude Code](https://claude.ai/code) (CLI)
- Docker (for MCP servers)
- Google Cloud credentials (for Gmail, Drive, Docs integrations)

### Installation

```bash
git clone https://github.com/yourusername/AgentArchitect.git
cd AgentArchitect
```

### First Run

Open the repository in Claude Code:

```bash
claude
```

The `/architect` command will load Archie, who will guide you through:

1. Checking for updates
2. Loading your registries
3. Presenting the main menu

```
Agent Architect - Main Menu

Teams: 0 registered
Agents: 0 registered
Context Buckets: 0 registered

What would you like to do?
1. Create a new team
2. Create a new agent
3. Create a context bucket
...
```

---

## Example: Building a Board Advisory Team

Let's say you're on a condo association board and want AI assistance with documents, communications, and compliance.

**You:** "I need a team to help with board operations"

**Archie:** "I'll help you build that. Let's start with the basics..."

After a guided conversation, Archie creates:

```
teams/
  condo-board-team/
    team.json              # Team configuration
    outputs/               # Team outputs
    workspace/             # Shared briefings

agents/
  legal-advisor/           # Reviews governing documents
    SKILL.md
    config.json
  communications-specialist/  # Drafts community updates
    SKILL.md
    config.json
  financial-analyst/       # Budget analysis
    SKILL.md
    config.json

context-buckets/
  governing-documents/     # Bylaws, rules, amendments
    bucket.json
    files/
  financial-records/       # Budgets, statements
    bucket.json
```

Each agent gets only what it needs:
- **Legal Advisor** sees governing documents, not financial records
- **Financial Analyst** sees financial records, not legal documents
- **Communications Specialist** sees past bulletins and community calendar

They collaborate through briefings in the team workspace.

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
├── agents/                      # Individual agents
│   ├── _templates/              # Agent templates
│   │   ├── researcher/
│   │   ├── analyst/
│   │   ├── writer/
│   │   └── reviewer/
│   └── <agent-id>/              # Created agents
│
├── teams/                       # Agent teams
│   ├── _templates/
│   │   ├── advisory-team/
│   │   └── project-team/
│   └── <team-id>/               # Created teams
│
├── context-buckets/             # Knowledge bases
│   ├── _templates/
│   │   ├── document-collection/
│   │   └── codebase/
│   └── <bucket-id>/             # Created buckets
│
├── mcp-servers/                 # MCP integrations
│   ├── registry/servers.json    # Available servers
│   ├── assignments.json         # Access control
│   ├── wrappers/                # Docker wrappers
│   └── images/                  # Dockerfiles
│
├── registry/                    # Global registries
│   ├── agents.json
│   ├── teams.json
│   └── buckets.json
│
└── .claude/                     # Claude Code config
    ├── settings.local.json
    └── commands/
        └── architect.md         # /architect command
```

---

## Available MCP Servers

| Server | Purpose | Accounts |
|--------|---------|----------|
| **Gmail** | Email search, read, send | board, personal |
| **Google Drive** | Document storage & search | board, personal |
| **Google Docs** | Document creation & editing | default |
| **PowerPoint** | Presentation creation | default |

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

## Philosophy

Agent Architect is built on these principles:

1. **Agents should be specialists** - One agent, one domain, one purpose
2. **Context should be minimal** - Give agents only what they need
3. **Collaboration should be structured** - Briefings, not brain dumps
4. **Humans should stay in control** - Review before handoff
5. **Configuration should be conversation** - Archie asks, you answer

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
