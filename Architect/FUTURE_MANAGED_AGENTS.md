# Future Initiative: Managed Agents Integration

**Status:** Parked — revisit when Managed Agents matures out of beta
**Last updated:** 2026-04-17

## Context

Anthropic launched **Claude Managed Agents** on April 8, 2026 — a hosted runtime that lets you define an agent once (model + system prompt + tools + MCP servers + **skills**) and run it in Anthropic's managed sandboxed infrastructure. Sessions have persistent state, built-in caching/compaction, and full tool execution.

The "skills" primitive in the Managed Agents agent definition maps directly to Agent Architect's `SKILL.md` + `config.json` pattern.

## Nick's strategic framing

Different teams have different runtime requirements:

### Stays in Claude Code (local machine required)
- **Software Project** — needs local repo access, git, dev servers, IDE integration
- **Hardware Dev** — needs KiCad, FreeCAD, local file system, firmware tooling
- **YouTube Content** — heavy FFmpeg/local asset pipelines
- **Altium** — needs local PCB file access during demos

### Candidate for Managed Agents (pure information work)
- **Wharfside Board Assistant** — email, docs, research, bulletins — all web-accessible
- **Personal Assistant (Max)** — email, calendar, research — all web-accessible
- Pure **research agents** (account-researcher, competitive-intel, web-research)
- **Document processing** agents (pdf-scribe, archivist with RAG)

## What a future integration would look like

### Architecture (fourth sync target)

```
agents/<agent-id>/              (SOURCE OF TRUTH)
├── SKILL.md
└── config.json

        ↓ generate (multiple targets)

.claude/agents/<agent-id>.md    (Claude Code native — exists today)
.claude/skills/<agent-id>/      (Forked skill — exists today)
cowork/skills/<team>/           (Cowork orchestrator — exists today)
<managed-agent-id>              (Managed Agents API — FUTURE)
```

### Proposed script

`scripts/sync-to-managed-agents.js`:
1. Read `agents/<id>/config.json` + `SKILL.md`
2. POST to Managed Agents create-agent endpoint
3. Store returned managed agent ID in `registry/agents.json` under `managed_agent_id`
4. Configure an Environment per team (with appropriate MCP servers and network allowlists)
5. Provide helper: `architect managed-agent run <id> "task"` to start a session

### Team strategy

| Team | Target | Rationale |
|---|---|---|
| Wharfside | Managed Agents | All web — email, Google Docs, Drive, web research |
| Personal Assistant (Max) | Managed Agents | Same — pure information work |
| Research-only agents | Managed Agents | Long-running, async, benefits from sandboxed code execution |
| Software Project | Claude Code | Needs local repo, git, dev servers |
| Hardware Dev | Claude Code | Needs KiCad, FreeCAD, local CAD files |
| YouTube Content | Claude Code | FFmpeg, local asset pipelines |
| Altium | Hybrid | Research in managed, deployment specialists local |

## Blockers / open questions

1. **Multi-agent coordination is research preview.** Our orchestrator/team pattern won't port cleanly until that GAs. For now, managed agents work well individually but team delegation would need to stay in Claude Code.
2. **Vendor lock-in.** Managed Agent IDs only work on Anthropic's platform. Our source-of-truth pattern (config + SKILL) mitigates this — we can always re-sync to another target.
3. **Cost model.** $0.08/session-hour plus standard token pricing. Cheap for bursty research, potentially expensive for always-on. Need cost modeling before pulling the trigger on any specific agent.
4. **MCP server availability.** Managed Agents needs network-accessible MCP servers. Our local Gmail / GDrive / GCal MCPs may need to be deployed to a service (Cloud Run, Fly, etc.) first.
5. **Beta risk.** Behaviors may shift between releases. Don't migrate production workflows until GA.

## Trigger to revisit

Revisit this when any of the following happen:
- [ ] Managed Agents exits beta / GA announcement
- [ ] Multi-agent coordination exits research preview
- [ ] Anthropic publishes official best practices for migrating Claude Code agents to Managed Agents
- [ ] A specific Wharfside or Max workflow gets painful to run from the Mac (needs to run on a schedule when laptop is closed, etc.)

## Related notes

- Current sync pipeline: `scripts/generate-agents.js`, `scripts/generate-cowork.js`
- The 4.7 tuning work (see `Architect/TUNING_4_7_PLAN.md`) is compatible with both targets — good SKILL authoring helps either way.
