#!/bin/bash
# Build the PDFScribe MCP Server Docker image

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Path to pdfscribe_cli
PDFSCRIBE_CLI="${PDFSCRIBE_CLI_PATH:-/Users/nickd/Workspaces/pdfscribe_cli}"

if [ ! -d "$PDFSCRIBE_CLI" ]; then
    echo "Error: pdfscribe_cli not found at $PDFSCRIBE_CLI"
    echo "Set PDFSCRIBE_CLI_PATH environment variable to the correct path"
    exit 1
fi

echo "Copying pdfscribe_cli files into build context..."
cp "$PDFSCRIBE_CLI/pdfscribe_cli.py" .
cp "$PDFSCRIBE_CLI/pdf2website.py" .

echo "Building mcp-pdfscribe:latest..."
docker build -t mcp-pdfscribe:latest .

echo "Cleaning up..."
rm -f pdfscribe_cli.py pdf2website.py

echo ""
echo "✓ Build complete: mcp-pdfscribe:latest"
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
