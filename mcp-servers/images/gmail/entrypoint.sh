#!/bin/sh
# Gmail MCP Server Entrypoint
# Validates credentials and starts the MCP server

set -e

# The Gmail MCP package expects gcp-oauth.keys.json
OAUTH_KEYS="/mcp/credentials/gcp-oauth.keys.json"

# Verify OAuth keys are mounted
if [ ! -f "$OAUTH_KEYS" ]; then
    echo "ERROR: gcp-oauth.keys.json not found at $OAUTH_KEYS" >&2
    echo "Mount your OAuth keys using: -v /path/to/gcp-oauth.keys.json:$OAUTH_KEYS" >&2
    exit 1
fi

# Run the Gmail MCP server from the credentials directory
cd /mcp/credentials
exec gmail-mcp
