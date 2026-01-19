#!/bin/sh
# Google Docs MCP Server Entrypoint
# Validates OAuth credentials and starts the MCP server

set -e

# Check required environment variables
if [ -z "$client_id" ] || [ -z "$client_secret" ] || [ -z "$refresh_token" ]; then
    echo "ERROR: Missing required OAuth credentials" >&2
    echo "Required environment variables: client_id, client_secret, refresh_token" >&2
    exit 1
fi

# Run the Google Docs MCP server
exec google-docs-mcp
