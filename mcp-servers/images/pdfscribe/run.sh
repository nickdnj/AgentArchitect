#!/bin/bash
# Run the PDFScribe MCP Server in Docker (for testing)

set -e

# Ensure directories exist
mkdir -p /tmp/pdfscribe/outputs

# Check for ANTHROPIC_API_KEY
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "Warning: ANTHROPIC_API_KEY not set"
    echo "Set it with: export ANTHROPIC_API_KEY=your-key"
    echo "Get your key at: https://console.anthropic.com/"
fi

echo "Starting PDFScribe MCP Server..."
echo "Workspace: /tmp/pdfscribe"
echo "Outputs: /tmp/pdfscribe/outputs"
echo ""

docker run -i --rm \
    -e ANTHROPIC_API_KEY \
    -v /tmp/pdfscribe:/workspace \
    -v /tmp/pdfscribe/outputs:/outputs \
    mcp-pdfscribe:latest
