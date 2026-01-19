#!/bin/sh
# PowerPoint MCP Server Entrypoint
# Starts the MCP server with template and workspace access

set -e

# Verify template directory exists (may be empty)
if [ ! -d "$PPT_TEMPLATE_PATH" ]; then
    echo "WARNING: Template directory not found at $PPT_TEMPLATE_PATH, creating..." >&2
    mkdir -p "$PPT_TEMPLATE_PATH"
fi

# Verify workspace directory exists
if [ ! -d "$PPT_WORKSPACE_PATH" ]; then
    echo "WARNING: Workspace directory not found at $PPT_WORKSPACE_PATH, creating..." >&2
    mkdir -p "$PPT_WORKSPACE_PATH"
fi

# Change to workspace directory
cd "$PPT_WORKSPACE_PATH"

# Run the PowerPoint MCP server
exec python /mcp/ppt_server.py
