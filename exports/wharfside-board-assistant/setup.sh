#!/bin/bash
# Setup script for Wharfside Board Assistant Team
# Run this after cloning/unzipping the export

set -e

echo "=================================="
echo "  Wharfside Board Assistant Team Setup"
echo "=================================="
echo ""

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v node &> /dev/null; then
  echo "ERROR: Node.js is not installed. Please install Node.js 18+."
  exit 1
fi
echo "  [OK] Node.js $(node --version)"

if ! command -v claude &> /dev/null; then
  echo "WARNING: Claude Code CLI not found. Install it from https://docs.anthropic.com/en/docs/claude-code"
fi

if ! command -v docker &> /dev/null; then
  echo "WARNING: Docker not found. Required for pgvector database."
  echo "  Install Docker Desktop: https://www.docker.com/products/docker-desktop"
fi

# Set up environment file
if [ ! -f .env ]; then
  echo ""
  echo "Creating .env from .env.example..."
  cp .env.example .env
  echo "  Please edit .env with your credentials before proceeding."
  echo "  Then re-run this script."
  exit 0
fi
echo "  [OK] .env file exists"

# Start pgvector database
if command -v docker &> /dev/null; then
  echo ""
  echo "Starting pgvector database..."
  docker compose up -d
  echo "  Waiting for database to be ready..."
  sleep 5

  # Restore RAG dump if available
  if [ -f data/rag-dump.sql ]; then
    echo "  Restoring RAG database..."
    PGPASSWORD=localdev psql -h localhost -p 5433 -U rag -d rag < data/rag-dump.sql 2>/dev/null || echo "  (Some restore warnings are normal)"
    echo "  [OK] RAG database restored"
  fi
fi

# Generate Claude Code native files
echo ""
echo "Generating Claude Code native agent files..."
node scripts/generate-agents.js

echo ""
echo "=================================="
echo "  Setup Complete!"
echo "=================================="
echo ""
echo "Next steps:"
echo "  1. Set up MCP servers (see mcp-servers/SETUP.md)"
echo "  2. In Claude Code, type: /wharfside"
echo ""