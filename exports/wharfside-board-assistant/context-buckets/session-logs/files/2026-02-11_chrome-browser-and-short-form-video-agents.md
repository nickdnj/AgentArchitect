# Chrome Browser & Short-Form Video Agents Created

**Date:** 2026-02-11
**Session type:** execution
**Agents involved:** Architect

## Summary

Created two new agents and a new team to solve two problems: Chrome MCP context bleed (25+ tools polluting other agents' context windows) and lack of short-form video tooling. The Chrome Browser service agent now exclusively owns Chrome MCP, and the Short-Form Video Strategy agent handles YouTube Shorts, Instagram Reels, and TikTok content from existing long-form videos.

## Key Findings

- 14 agents had Chrome MCP loaded in their mcp_servers, most with no documented Chrome workflows
- Max (personal-assistant) had Chrome loaded but zero Chrome usage in SKILL.md - this was the primary context bleed issue
- YouTube Shorts get 200B daily views; channels using Shorts + long-form grow 41% faster
- Same vertical 9:16 format works across YouTube Shorts (<60s), Instagram Reels (<90s), and TikTok (<60s)

## Decisions Made

- Chrome Browser agent follows the RAG Search service-agent pattern (called by other agents, not directly by users)
- Short-Form Video agent delegates ALL uploads to Chrome Browser agent (does not own Chrome MCP)
- All 14 agents that had Chrome MCP were updated: chrome removed from mcp_servers, chrome-browser added to can_request_from
- Created YouTube Content team (youtube-creator + short-form-video) with sequential workflow
- Short-Form Video agent supports all three platforms (YouTube, Instagram, TikTok) rather than YouTube-only

## Artifacts Created

- `agents/chrome-browser/config.json` + `SKILL.md` - Chrome Browser service agent
- `agents/short-form-video/config.json` + `SKILL.md` - Short-Form Video Strategy agent
- `teams/youtube-content/team.json` - YouTube Content team
- Updated 15 agent config.json files (14 chrome removal + web-research collaboration)
- Updated `registry/agents.json` (36 agents) and `registry/teams.json` (5 teams)
- Generated all 36 `.claude/agents/*.md` native agent files via /sync-agents

## Open Items

- [ ] Test Chrome Browser agent with a real browser automation task
- [ ] Test Short-Form Video agent on the existing ai-journey-full-v2.mp4 (~20 min, 358MB)
- [ ] Verify Archivist's AppFolio portal sync still works via Chrome Browser delegation
- [ ] Update Archivist and YouTube Creator SKILL.md files to reference Chrome Browser agent delegation (currently still reference direct Chrome MCP usage in their workflow docs)

## Context for Next Session

Both agents are created and registered. The Chrome Browser agent is ready to use as a service agent. The Short-Form Video agent is ready to extract clips from the existing AI Journey full movie at `~/Desktop/youtube-projects/ai-journey-full/my-ai-journey-full-v2.mp4`. The SKILL.md files for Archivist and YouTube Creator still contain workflow steps that reference direct Chrome MCP tool usage - these should be updated to describe delegating to the Chrome Browser agent instead, but this is cosmetic (the config.json changes already enforce the new pattern).
