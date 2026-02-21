# Windows Export & Deployment Overhaul

**Date:** 2026-02-21
**Session type:** execution
**Agents involved:** Architect (direct), Software Developer (subagents for RAG rewrite + PowerPoint conversion)

## Summary

Implemented a comprehensive overhaul of the team export system to support deploying the Wharfside Board Assistant to a non-technical Windows user (the management company). Eliminated all Docker dependencies, replaced pgvector with SQLite-vec for zero-infrastructure RAG, converted PowerPoint MCP to stdio transport, added VoiceMode to the MCP registry, and created a full Windows installer (install.ps1) with interactive Google OAuth setup. Ingested governing documents into the new SQLite-vec database and pushed the final package to a private GitHub repo.

## Key Findings

- sqlite-vec's `vec0` virtual table defaults to L2 (Euclidean) distance — must explicitly set `distance_metric=cosine` for OpenAI embeddings to produce meaningful similarity scores
- The wharfside-docs context bucket contains 145 MB of scanned page images — too large for a git repo, solved via GitHub Release asset
- Session-logs bucket had 32 files from all teams (Altium, YouTube, personal, etc.) — added filtering to only export wharfside-related logs
- 12 governing documents were successfully ingested (186 chunks, 137K tokens, 7.8 MB database)
- 3 PDFs were skipped (Animal Control, Census Form, Parking Resolution) as they need transcription first

## Decisions Made

- **No Docker anywhere** — all MCP servers run via npx/uvx CLI commands
- **SQLite-vec replaces pgvector** — zero infrastructure, portable .db file
- **PowerPoint MCP uses stdio** — runs via `python ppt_server.py`, Docker config preserved as `docker_config` fallback
- **VoiceMode is priority #1** in install flow — step 2 of install.ps1
- **Distribution via private GitHub repo** — `nickdnj/wharfside-board-assistant`
- **Images excluded from git** — uploaded as GitHub Release v1.0 asset (144 MB zip)
- **Management company uses their own Gmail** — not the board email

## Artifacts Created

- `mcp-servers/registry/servers.json` — Added VoiceMode entry, updated PowerPoint to stdio
- `mcp-servers/images/powerpoint/ppt_server.py` — Converted to stdio with CLI argparse
- `scripts/export-team.js` — Major rewrite (1293→1873 lines): new phases 3.5, 7.6, 10; Windows installer; OAuth guide; session-log filtering; voice skill copying
- `/Users/nickd/Workspaces/pdfscribe_cli/src/rag.py` — Full rewrite from pgvector to SQLite-vec
- `/Users/nickd/Workspaces/pdfscribe_cli/requirements.txt` — Replaced psycopg2 with sqlite-vec
- `/Users/nickd/Workspaces/pdfscribe_cli/ingest_wharfside.py` — One-time ingestion script for governing docs
- `~/.wharfside/rag.db` — SQLite-vec RAG database (7.8 MB, 186 chunks)
- `~/Desktop/wharfside-board-assistant/` — Full export package
- GitHub: `nickdnj/wharfside-board-assistant` (private repo, pushed)
- GitHub Release v1.0 with doc images zip

## Open Items

- [ ] Transcribe 3 remaining PDFs (Animal Control, Census Form, Parking Resolution) and ingest into RAG
- [ ] Test `install.ps1` on an actual Windows machine
- [ ] Share repo access with management company + provide Claude Code signup instructions
- [ ] The `{{PLACEHOLDER}}` values in `.claude/settings.local.json` need to be resolved by the install script — verify this works end-to-end on Windows
- [ ] Consider adding the WMCA_Handbook_2025.docx to RAG (needs python-docx text extraction)

## Context for Next Session

The Wharfside Board Assistant is fully packaged at `nickdnj/wharfside-board-assistant` on GitHub (private). The management company needs to: (1) get a Claude Code subscription, (2) clone the repo, (3) run `.\install.ps1`. The RAG database ships with the repo but 3 PDFs still need transcription. The pdfscribe_cli repo now uses SQLite-vec instead of pgvector — this is a breaking change for any existing pgvector data (the old data would need to be re-ingested). The export script in AgentArchitect is backward-compatible and defaults to CLI-only mode.
