# Apple Contacts MCP Server Integration

**Date:** 2026-02-06
**Session type:** execution
**Agents involved:** Architect, Max

## Summary

Built, fixed, and integrated the Contactbook MCP server for Apple Contacts access. Discovered and fixed a critical bug where the MCP server exited immediately after startup (missing `waitUntilCompleted()` call). Registered the server with Claude Code and updated Max's configuration to use it via CLI subagent pattern due to inconsistent MCP tool loading in Claude Code sessions.

## Key Findings

- **Contactbook** (`RyanLisse/Contactbook`) is a Swift-based Apple Contacts CLI + MCP server
- The MCP server had a bug: `server.start()` spawns a background task but returns immediately, causing the process to exit before clients can connect
- Fix: Add `await server.waitUntilCompleted()` after `server.start()` to keep the process alive until stdin closes
- Claude Code's MCP tool enumeration is inconsistent - servers show "Connected" but tools don't always load into sessions
- **Workaround:** Use CLI binary via Bash subagent instead of MCP tools - more reliable and keeps large contact output out of main context
- Nick has ~3000+ contacts with significant duplication across iCloud/Google accounts

## Decisions Made

- Keep the MCP server registered (may work in future Claude Code versions) but use CLI as primary access method
- Document CLI-based workflow in Max's SKILL.md with Task subagent pattern
- Fork Contactbook and submit PR for the fix upstream

## Research Sources

- Contactbook repo: https://github.com/RyanLisse/Contactbook
- MCP Swift SDK source: `${CONTACTBOOK_PATH}
- iMCP (alternative): https://github.com/mattt/iMCP - heavier but more polished, requires macOS 15.3+

## Artifacts Created

- **AgentArchitect commit:** `7043d94` - Add Apple Contacts integration via Contactbook CLI
- **Contactbook commit:** `6bf8148` - Fix MCP server exiting immediately after start
- **PR submitted:** https://github.com/RyanLisse/Contactbook/pull/3
- **Binary built:** `${CONTACTBOOK_PATH}
- **MCP server registered:** `apple-contacts` (user-level via `claude mcp add`)

## Files Modified

- `mcp-servers/registry/servers.json` - Added apple-contacts server entry
- `scripts/generate-agents.js` - Added apple-contacts MCP tool mapping
- `agents/personal-assistant/config.json` - Added apple-contacts to Max's servers
- `agents/personal-assistant/SKILL.md` - CLI-based contacts workflow documentation
- `.claude/settings.local.json` - Added `mcp__apple-contacts__*` permission
- `~/.claude/projects/.../memory/MEMORY.md` - Added apple-contacts setup notes

## Open Items

- [ ] Monitor PR for upstream merge: https://github.com/RyanLisse/Contactbook/pull/3
- [ ] Test contacts integration in fresh Claude Code session with CLI subagent approach
- [ ] Nick's contacts could use dedup cleanup (rainy day project)

## Context for Next Session

Apple Contacts integration is complete. The Contactbook CLI binary is built at `${CONTACTBOOK_PATH} Max should use it via Task subagent with Bash type, not MCP tools directly. The MCP server is registered and the fix is committed, but Claude Code has inconsistent tool loading so CLI is more reliable. The fix PR is pending upstream review.
