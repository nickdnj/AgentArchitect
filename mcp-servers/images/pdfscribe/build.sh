#!/bin/bash
# Build the PDFScribe MCP Server Docker image

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Copy pdfscribe_cli into build context (temporarily)
PDFSCRIBE_CLI="${PDFSCRIBE_CLI_PATH:-/Users/nickd/Workspaces/pdfscribe_cli}"

if [ ! -d "$PDFSCRIBE_CLI" ]; then
    echo "Error: pdfscribe_cli not found at $PDFSCRIBE_CLI"
    echo "Set PDFSCRIBE_CLI_PATH environment variable to the correct path"
    exit 1
fi

echo "Copying pdfscribe_cli into build context..."
rm -rf pdfscribe_cli
cp -r "$PDFSCRIBE_CLI" pdfscribe_cli

echo "Building mcp-pdfscribe:latest..."
docker build -t mcp-pdfscribe:latest .

echo "Cleaning up..."
rm -rf pdfscribe_cli

echo ""
echo "Build complete!"
echo ""
echo "To run with Claude Code, update ~/.claude.json:"
echo '  "pdfscribe": {'
echo '    "type": "stdio",'
echo '    "command": "docker",'
echo '    "args": ['
echo '      "run", "-i", "--rm",'
echo '      "-e", "ANTHROPIC_API_KEY",'
echo '      "-v", "/tmp/pdfscribe:/workspace",'
echo '      "-v", "/tmp/pdfscribe/outputs:/outputs",'
echo '      "mcp-pdfscribe:latest"'
echo '    ]'
echo '  }'
