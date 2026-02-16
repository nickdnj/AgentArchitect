# Apple Reminders MCP Server Integration

**Date:** 2026-02-04
**Session type:** execution
**Agents involved:** Architect (Archie)

## Summary

Integrated the `dbmcco/apple-reminders-mcp` MCP server into the Agent Architect system and wired it into the Max personal assistant agent. This gives Max the ability to manage Apple Reminders natively on macOS alongside the existing Google Tasks integration.

## Key Findings

- Multiple existing Apple Reminders MCP servers are available on GitHub; no need to build custom
- `dbmcco/apple-reminders-mcp` was selected as the best option: TypeScript + AppleScript, full CRUD, active maintenance
- Apple Reminders MCP requires no OAuth (uses native macOS system permissions via AppleScript/osascript)
- No Docker containerization needed (requires direct host macOS access)
- The server exposes 6 tools: `list_reminder_lists`, `get_reminders`, `create_reminder`, `update_reminder`, `delete_reminder`, `search_reminders`
- Other viable options researched: `karlhepler/apple-mcp` (combined Notes+Reminders), `shadowfax92/apple-reminders-mcp`, `FradSer/mcp-server-apple-reminders`

## Decisions Made

- Use existing package (`dbmcco/apple-reminders-mcp`) rather than building custom
- Add to Max agent only (not create a dedicated Reminders agent)
- Position Apple Reminders as complementary to Google Tasks, not a replacement
- Install from source (not npm) since the package isn't published to npm registry
- Run natively (no Docker wrapper) due to AppleScript requirement

## Artifacts Created

- **Cloned repo:** `${MCP_SERVERS_PATH} (built with `npm run build`)
- **Claude Code registration:** `claude mcp add -s user apple-reminders` in `~/.claude.json`
- **Modified files:**
  - `mcp-servers/registry/servers.json` - new `apple-reminders` server entry
  - `mcp-servers/assignments.json` - new access assignment (unrestricted)
  - `scripts/generate-agents.js` - added `'apple-reminders': 'mcp__apple-reminders__*'` tool mapping
  - `agents/personal-assistant/config.json` - added `apple-reminders` to Max's MCP servers
  - `agents/personal-assistant/SKILL.md` - new "Apple Reminders Integration" section with usage guidance
  - `.claude/settings.local.json` - pre-approved all 6 tool permissions
- **Regenerated:** All 33 Claude Code native agent files via `generate-agents.js`

## Open Items

- [ ] Restart Claude Code to pick up the new MCP server
- [ ] Grant macOS Reminders permissions on first use (system prompt will appear)
- [ ] Test the integration end-to-end (list, create, complete, delete a reminder)
- [ ] Consider committing the config changes to git

## Context for Next Session

The Apple Reminders MCP server is fully installed, configured, and wired into the Agent Architect system. Max now has `mcp__apple-reminders__*` in his tool list. The only remaining steps are restarting Claude Code to activate the server, granting macOS permissions when prompted, and testing. The SKILL.md includes guidance on when to use Apple Reminders vs Google Tasks.
