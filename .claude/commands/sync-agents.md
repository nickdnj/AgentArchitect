# Sync Agent Architect agents to Claude Code native format

Generate Claude Code native agent files from Agent Architect definitions.

## What This Does

This command synchronizes agents from the Agent Architect format (`agents/<agent-id>/SKILL.md` + `config.json`) to Claude Code's native agent format (`.claude/agents/<agent-id>.md`).

**Source of Truth:** `agents/` directory (Agent Architect format)
**Generated Output:** `.claude/agents/` directory (Claude Code native format)

## Usage

Run the generation script:

```bash
node scripts/generate-agents.js
```

For a specific agent only:

```bash
node scripts/generate-agents.js --agent <agent-id>
```

## What Gets Mapped

| Agent Architect (`config.json`) | Claude Code (frontmatter) |
|--------------------------------|---------------------------|
| `name` | `name` |
| `description` | `description` |
| `mcp_servers` | `tools` (mapped to MCP patterns) |

### MCP Server to Tools Mapping

| config.json | Claude Code tools |
|-------------|-------------------|
| `gdrive` | `mcp__google-drive__*` |
| `gmail` | `mcp__gmail__*` |
| `gmail-personal` | `mcp__gmail-personal__*` |
| `google-docs` | `mcp__google-docs-mcp__*` |
| `chrome` | `mcp__chrome__*` |
| `github` | `Bash` (for gh commands) |

### Preserved Metadata

The following Agent Architect data is preserved as HTML comments in generated files:
- `collaboration` rules (can_request_from, provides_to)
- `workflow_position` (stage, order, parallel_with)
- `expertise` (domains, capabilities)
- `context_buckets` (assigned buckets, access level)

## After Running

1. Generated agents appear in `.claude/agents/`
2. Use `/agents` in Claude Code to see available agents
3. Claude Code can now delegate to these agents natively

## Important Notes

- **Never edit files in `.claude/agents/` directly** - they will be overwritten
- **Edit source files** in `agents/<agent-id>/SKILL.md` and `config.json`
- **Re-run /sync-agents** after any changes to agent definitions
- Generated files are excluded from git (see `.gitignore`)
