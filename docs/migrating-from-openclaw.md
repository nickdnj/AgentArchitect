# Migrating from OpenClaw to Agent Architect

If you're coming to Agent Architect from OpenClaw, you don't have to rewrite your AgentSkills from scratch. The **OpenClaw Migration** specialist reads your existing skill directory, proposes a mapping to Agent Architect's native format, and — with your approval on each — writes valid AA agents into your workspace.

This is **one-way**. Agent Architect runs inside Claude Code sessions, not as a long-running service. If you still need OpenClaw's runtime (WhatsApp, Discord bridges, scheduled behavior), keep OpenClaw running alongside.

---

## How to run the migration

### From the Starter Team (recommended for new users)

```
/starter migrate my OpenClaw skills
```

The Starter Team orchestrator routes the request to the OpenClaw Migration specialist.

### From Archie (the Architect)

```
/architect migrate-from-openclaw
```

Archie dispatches the same specialist with context about your current workspace.

### Directly

```
/migration-openclaw
```

Useful if you've already picked the specialist and want to skip the orchestrator.

---

## What the specialist does

1. **Asks where your OpenClaw install lives.** Default is `~/.openclaw/skills/`. It will verify the path before reading anything.
2. **Inventories your skills.** Lists each one with its name and description so you can choose which to migrate.
3. **Proposes each mapping before writing.** You see the proposed `config.json`, a preview of the `SKILL.md`, and the tool permission mapping. Nothing is written until you approve.
4. **Writes the new agents** to `agents/<id>/` and registers them in `registry/agents.json`.
5. **Optionally groups them into a team.** If your OpenClaw skills were used together as a workflow, the specialist will suggest creating an AA team that routes between them.
6. **Regenerates Claude Code native files** via `node scripts/generate-agents.js` so the new agents are immediately usable.
7. **Produces a migration report** showing what was migrated, what was skipped, and what needs your attention.

---

## What gets mapped

### OpenClaw frontmatter → Agent Architect `config.json`

| OpenClaw | Agent Architect |
|---|---|
| `name` | `id` (kebab-case) and `name` (Title Case) |
| `description` | `description` (verbatim) |
| `user-invocable: true` | `agent_type: "specialist"` |
| `permissions` | `mcp_servers` (best-effort mapping — see table below) |
| `triggers` | `trigger.description` (paraphrased to one sentence) |

Defaults filled in by the migrator: `version: "1.0"`, `execution.context: "fork"`, `execution.model: "sonnet"`, `max_turns: 20`.

### OpenClaw body → Agent Architect `SKILL.md`

The markdown body is **preserved verbatim**. The migrator doesn't rewrite, restructure, or "improve" it — if your skill's instructions worked in OpenClaw, they should still work in AA. Two additions:

1. A `# <Name> - SKILL` header if the body doesn't already have one
2. The standard `## Operating Notes (Claude 4.7)` block appended at the end (consistent with every AA agent)

### Tool permission mapping

| OpenClaw permission | AA MCP server | Notes |
|---|---|---|
| `web-browser`, `web-automation`, `browser` | `chrome` | Auto-mapped |
| `email`, `gmail`, `mail` | `gmail` | Auto-mapped |
| `calendar`, `gcal`, `google-calendar` | `google-calendar` | Auto-mapped |
| `drive`, `gdrive`, `files-cloud`, `google-drive` | `gdrive` | Auto-mapped |
| `docs`, `google-docs` | `google-docs` | Auto-mapped |
| `github` | `github` | Auto-mapped if installed |
| `shell`, `bash`, `filesystem`, `files` | Built-in Bash/Read/Write/Edit | No MCP needed — AA handles natively |
| `slack` | (none yet) | Surfaced in report for your review |
| `discord`, `whatsapp`, `telegram` | (not in AA scope) | Messaging bridges stay in OpenClaw |
| `custom:<anything>` | Unknown | Listed in the report — you decide how to replicate |

---

## What doesn't come over

Be explicit with yourself about what you're losing:

1. **Messaging platform bridges.** OpenClaw responds on WhatsApp, Discord, and similar. AA runs inside Claude Code. If you need the bridge, keep OpenClaw running.

2. **Long-running / scheduled behavior.** OpenClaw is always-on. AA runs per-session. For scheduled behavior, consider Claude Code's `/schedule` skill or an external cron job calling `claude -p '...'`.

3. **Bundled code files.** AA agents don't execute skill-local Python/TypeScript files the way OpenClaw does. If your OpenClaw skill directory has code alongside `SKILL.md`, the migrator will flag it. You'll need to either re-express the logic as instructions, or put the code in the repo and have the agent call it via Bash.

4. **Custom tools.** `custom:*` permissions that don't match a known MCP server can't auto-map. The migration report lists every one with the suggestion to either build an MCP server or write a script the agent calls directly.

---

## After the migration

Once your agents are migrated:

1. **Review each SKILL.md.** The body is preserved from OpenClaw — it may or may not match AA's typical structure (Purpose / Core Responsibilities / Workflow / Output Specifications / Success Criteria). Feel free to restructure.

2. **Install any MCPs you need.** If the migration report flagged missing MCP servers, ask the Setup Concierge:
   ```
   /starter help me install the <server> MCP server
   ```

3. **Test each agent.** Open Claude Code, invoke the agent via its `/` slash command, and check that the behavior matches what it did in OpenClaw.

4. **Refine with Archie.** If a migrated agent feels off — too generic, missing context, wrong scope — run `/architect` and ask Archie to help you tighten the SKILL.md or config.json.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| "Couldn't find OpenClaw skills at `~/.openclaw/skills/`" | Confirm the path; some installs use a custom location. Give the full path when the specialist asks. |
| "Agent ID collision" | You already have an agent with the same id. The specialist will offer to rename, overwrite, or skip. |
| Migrated agent doesn't show up as a `/` slash command | Run `node scripts/generate-agents.js` to regenerate `.claude/agents/*.md` and `.claude/skills/*/SKILL.md`. |
| Migrated agent refuses to use a tool | Check its `config.json` `mcp_servers` array — the mapping may have missed a required server. Add it manually and re-sync. |

---

## Scope of this migration (for the record)

- **One-way only.** No export back to OpenClaw.
- **OpenClaw-specific.** Not a generic agent-framework import tool.
- **Starter + Architect entry points.** `/starter migrate...`, `/architect migrate-from-openclaw`, or `/migration-openclaw` directly.
- **Best-effort tool mapping.** High-confidence mappings auto-apply; unknowns are surfaced for you to decide.
