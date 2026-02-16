# Wharfside Board Assistant Team

Assists Wharfside Manor Condominium Association board members with bulletins, proposals, presentations, research, document management, and official community communications

## Prerequisites

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed and authenticated
- Node.js 18+
- Docker Desktop (for pgvector database)
- MCP server dependencies (see `mcp-servers/SETUP.md`)

## Quick Setup

```bash
# 1. Clone or unzip this directory

# 2. Run the setup script
./setup.sh

# 3. Start using the team
# In Claude Code, type: /wharfside
```

## Manual Setup

```bash
# 1. Copy environment file and fill in your values
cp .env.example .env
# Edit .env with your credentials

# 2. Start the pgvector database
docker compose up -d

# 3. Restore the RAG database (if data/rag-dump.sql exists)
psql -h localhost -p 5433 -U rag -d rag < data/rag-dump.sql

# 4. Set up MCP servers (see mcp-servers/SETUP.md)

# 5. (Optional) Regenerate Claude Code native files
node scripts/generate-agents.js
```

## Team Members

| Agent | Role |
|---|---|
| Monthly Bulletin | Newsletter creator - mines board email and generates monthly community bulletin |
| Proposal Review | Vendor analyst - reviews and compares proposals from vendors |
| Presentation | Presentation creator - builds PowerPoint decks for board meetings |
| Email Research | Research specialist - searches email archives for topic information |
| Archivist | Document keeper - maintains and retrieves governing documents |
| PDFScribe | PDF specialist - extracts and transcribes PDF content into searchable Markdown |
| RAG Search | Semantic search service - queries vector databases for governing document retrieval |
| Board Communications | Communications drafter - writes official board notices, policy explainers, crisis updates, and owner letters |

## MCP Server Dependencies

- `gmail`
- `powerpoint`
- `openai-image`
- `gmail-personal`
- `voicemode`
- `pdfscribe`
- `google-docs`

See `mcp-servers/SETUP.md` for installation and configuration instructions.

## Usage

Once set up, invoke the team in Claude Code by typing `/wharfside` followed by your request.

Examples:
- `/wharfside search governing documents for pet policy`
- `/wharfside generate this month's bulletin`
- `/wharfside review the attached vendor proposal`

## Troubleshooting

### MCP servers not connecting
Ensure all required MCP servers are installed and configured. Check `mcp-servers/SETUP.md`.

### RAG search returns no results
Ensure the pgvector database is running (`docker compose up -d`) and the dump has been restored.

### Agents not found
Run `node scripts/generate-agents.js` to regenerate Claude Code native files.
