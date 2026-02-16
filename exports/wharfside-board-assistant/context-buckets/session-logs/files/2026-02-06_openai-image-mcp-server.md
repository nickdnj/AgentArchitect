# OpenAI Image Generation MCP Server Added

**Date:** 2026-02-06
**Session type:** execution
**Agents involved:** Architect

## Summary

Added the `@lpenguin/openai-image-mcp` server to the Agent Architect system, giving agents the ability to generate and edit images using OpenAI's API. The server was registered, configured in Claude Code, and assigned to Max and Presentation agents. Nick's existing OpenAI Pro plan API key is used.

## Key Findings

- Researched 7+ community MCP servers for OpenAI image generation
- `@lpenguin/openai-image-mcp` was the most comprehensive: supports gpt-image-1, gpt-image-1-mini, DALL-E 3, DALL-E 2
- Features include transparency support, multiple output formats (PNG/JPEG/WebP), quality controls, and various size options
- Other notable options: `spartanz51/imagegen-mcp` (32 stars, simpler), `PierrunoYT/gpt-image-1-mcp-server` (gpt-image-1 only)
- Uses native server pattern (npx, no Docker) since it only needs an API key

## Decisions Made

- Selected `@lpenguin/openai-image-mcp` as the image generation server (most comprehensive model and feature support)
- Used native server pattern (like apple-mcp) - no Docker container needed
- Made available to all agents/teams (empty allowed_agents/allowed_teams)
- Explicitly added to Max and Presentation agent configs

## Artifacts Created

- Modified `mcp-servers/registry/servers.json` - added openai-image entry
- Modified `mcp-servers/assignments.json` - added access control entry
- Modified `mcp-servers/README.md` - added Native MCP Servers section with OpenAI Image docs
- Modified `agents/personal-assistant/config.json` - added openai-image to mcp_servers
- Modified `agents/presentation/config.json` - added openai-image to mcp_servers
- Claude Code MCP config updated via `claude mcp add`
- All 33 agents re-synced to Claude Code native format
- Commit: `dce2892` on main (not pushed)

## Open Items

- [ ] Push commit to remote (`git push`)
- [ ] Restart Claude Code to pick up the new MCP server
- [ ] Test image generation end-to-end with Max or Presentation agent
- [ ] Consider adding openai-image to other agents that might benefit (e.g., marketing, proposal-writer)

## Context for Next Session

The OpenAI image generation MCP server is fully configured but requires a Claude Code restart to become active. The commit is on main but not pushed to remote. After restart, test with a simple image generation prompt through Max to verify everything works end-to-end.
