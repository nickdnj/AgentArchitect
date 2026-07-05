#!/bin/bash
# Double-clickable launcher for the Clip Editor server.
# Starts the stdlib http server on port 8770 and prints the base URL.
cd "$(dirname "$0")" || exit 1
echo "Starting Clip Editor…"
exec python3 server.py
