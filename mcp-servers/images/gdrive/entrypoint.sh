#!/bin/sh
# Google Drive MCP Server Entrypoint
# Validates OAuth keys and starts the MCP server

set -e

# Verify OAuth keys are mounted
if [ ! -f "$GDRIVE_CREDS_DIR/gcp-oauth.keys.json" ]; then
    echo "ERROR: gcp-oauth.keys.json not found in $GDRIVE_CREDS_DIR" >&2
    echo "Mount your credentials directory using: -v /path/to/creds:$GDRIVE_CREDS_DIR" >&2
    exit 1
fi

# Run the GDrive MCP server
exec mcp-gdrive
