# MCP Server Setup

This team requires the following MCP servers. Install and configure each one before using the team.

## Gmail MCP Server

**Package:** `@gongrzhe/server-gmail-autoauth-mcp@1.1.11`
**Type:** nodejs

### Authentication (OAuth)

1. Create a Google Cloud project (or reuse an existing one)
2. Enable the relevant API (Gmail, Google Docs, etc.)
3. Create OAuth 2.0 credentials (Desktop application type)
4. Download the credentials JSON
5. Place credentials in: `~/.config/mcp-gmail-{account}/`
6. Required files: gcp-oauth.keys.json

---

## PowerPoint MCP Server

**Package:** `custom (python-pptx)`
**Type:** python

### Authentication

No authentication required.

### Claude Code Configuration

Add to your Claude Code MCP settings:

```json
{
  "type": "streamable-http",
  "url": "http://localhost:8001/mcp"
}
```

---

## OpenAI Image Generation MCP Server

**Package:** `@lpenguin/openai-image-mcp`
**Type:** nodejs

### Authentication (API Key)

Set these environment variables: OPENAI_API_KEY
Notes: Uses OPENAI_API_KEY environment variable. Nick's Pro plan key is already in the shell environment.

### Claude Code Configuration

Add to your Claude Code MCP settings:

```json
{
  "type": "stdio",
  "command": "npx",
  "args": [
    "-y",
    "@lpenguin/openai-image-mcp"
  ]
}
```

---

## gmail-personal

No registry entry found. Configure manually.

## voicemode

No registry entry found. Configure manually.

## PDFScribe MCP Server

**Package:** `custom (pdfscribe_cli)`
**Type:** python

### Authentication (API Key)

Set at least one of: ANTHROPIC_API_KEY, OPENAI_API_KEY
Notes: Supports both Anthropic (Claude Sonnet 4) and OpenAI (GPT-4o) for vision. Set AI_PROVIDER=openai to switch.

---

## Google Docs MCP Server

**Package:** `google-docs-mcp@1.0.0`
**Type:** nodejs

### Authentication (OAuth)

1. Create a Google Cloud project (or reuse an existing one)
2. Enable the relevant API (Gmail, Google Docs, etc.)
3. Create OAuth 2.0 credentials (Desktop application type)
4. Download the credentials JSON
5. Place credentials in: `~/.config/mcp-google-docs/`
6. Required files: credentials.json
7. Notes: Requires client_id, client_secret, refresh_token in JSON

---
