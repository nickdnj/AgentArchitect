#!/bin/sh
# Google Tasks MCP Server Entrypoint
# Validates credentials and starts the MCP server

set -e

# The Google Tasks MCP package expects credentials via environment variables
# These are loaded from a .env file mounted at /mcp/credentials/.env
ENV_FILE="/mcp/credentials/.env"

if [ -f "$ENV_FILE" ]; then
    # Source the env file to set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
    set -a
    . "$ENV_FILE"
    set +a
fi

# Verify required environment variables
if [ -z "$GOOGLE_CLIENT_ID" ] || [ -z "$GOOGLE_CLIENT_SECRET" ] || [ -z "$GOOGLE_REFRESH_TOKEN" ]; then
    echo "ERROR: Missing required Google OAuth credentials" >&2
    echo "Required: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN" >&2
    echo "Mount a .env file at /mcp/credentials/.env or pass environment variables" >&2
    exit 1
fi

# Run the Google Tasks MCP server
exec google-tasks-mcp
