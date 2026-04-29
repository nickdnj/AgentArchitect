#!/usr/bin/env bash
# Retry the v7 YouTube upload after re-authenticating.
# Run AFTER:  python3 /Users/nickd/Workspaces/AgentArchitect/scripts/youtube-reauth.py
set -u
PROJ="/Users/nickd/Workspaces/AgentArchitect/teams/youtube-content/projects/jersey-stack-ep1-transistor"
REPO="/Users/nickd/Workspaces/AgentArchitect"
UP_LOG="$PROJ/output/upload-v7.log"

VIDEO="$PROJ/output/jersey-stack-ep1-v7.mp4"
META="$PROJ/output/metadata-v7-upload.json"
THUMB="$PROJ/output/jersey-stack-ep1-v4-thumb.jpg"

echo "[$(date)] Retrying v7 upload…" | tee -a "$UP_LOG"
python3 "$REPO/scripts/youtube-upload.py" \
  --metadata "$META" \
  --video "$VIDEO" \
  --thumbnail "$THUMB" 2>&1 | tee -a "$UP_LOG"
