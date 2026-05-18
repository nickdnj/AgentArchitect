#!/usr/bin/env bash
# AgentArchitect cloud / iOS Claude Code bootstrap.
#
# Brings up the wiki knowledge base and regenerates Claude Code native agent
# definitions so a fresh sandbox (e.g. claude.ai/code on iOS) can run the
# Agent Architect teams without Mac filesystem access.
#
# Idempotent: safe to run repeatedly. Only clones the wiki when missing; does
# not pull or modify an existing wiki checkout (the user's Obsidian session
# owns that on a real workstation).
#
# Env overrides:
#   WIKI_REPO       Where the wiki lives (default: $HOME/Workspaces/wiki)
#   WIKI_REPO_URL   Where to clone from  (default: https://github.com/nickdnj/wiki.git)
#   SKIP_GENERATE   Set to 1 to skip the generate-agents step (for tests)
#
# Exit codes:
#   0  success
#   1  missing prerequisites
#   2  wiki path collision (path exists but is not a git repo)
#   3  git clone failed (likely auth — run `gh auth login`)

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WIKI_REPO_URL="${WIKI_REPO_URL:-https://github.com/nickdnj/wiki.git}"
WIKI_REPO_PATH="${WIKI_REPO:-$HOME/Workspaces/wiki}"

echo "==> AgentArchitect cloud bootstrap"
echo "    Repo root:    $REPO_ROOT"
echo "    Wiki path:    $WIKI_REPO_PATH"
echo "    Wiki source:  $WIKI_REPO_URL"
echo

# -----------------------------------------------------------------------------
# 1. Prerequisites
# -----------------------------------------------------------------------------
missing=()
for tool in git node; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    missing+=("$tool")
  fi
done
if [[ ${#missing[@]} -gt 0 ]]; then
  echo "ERROR: missing required tools: ${missing[*]}" >&2
  echo "       Install them and re-run." >&2
  exit 1
fi

# -----------------------------------------------------------------------------
# 2. Ensure wiki is present
# -----------------------------------------------------------------------------
if [[ -d "$WIKI_REPO_PATH/.git" ]]; then
  echo "==> Wiki already cloned (leaving as-is — user owns local state)"
elif [[ -e "$WIKI_REPO_PATH" ]]; then
  echo "ERROR: $WIKI_REPO_PATH exists but is not a git repo." >&2
  echo "       Move it aside or set WIKI_REPO to a different path." >&2
  exit 2
else
  echo "==> Cloning wiki -> $WIKI_REPO_PATH"
  mkdir -p "$(dirname "$WIKI_REPO_PATH")"
  if ! git clone --depth 1 "$WIKI_REPO_URL" "$WIKI_REPO_PATH"; then
    echo >&2
    echo "ERROR: git clone failed. The wiki is a private repo." >&2
    if command -v gh >/dev/null 2>&1; then
      echo "       Authenticate first:  gh auth login" >&2
    else
      echo "       Install gh CLI (or configure git credentials) and retry." >&2
    fi
    exit 3
  fi
fi

# -----------------------------------------------------------------------------
# 3. Regenerate Claude Code native agents with always_load inlined
# -----------------------------------------------------------------------------
export WIKI_REPO="$WIKI_REPO_PATH"

if [[ "${SKIP_GENERATE:-0}" == "1" ]]; then
  echo
  echo "==> SKIP_GENERATE=1 — skipping generate-agents step"
else
  echo
  echo "==> Regenerating .claude/agents and .claude/skills"
  echo "    (inlining always_load wiki pages into each agent's system prompt)"
  cd "$REPO_ROOT"
  node scripts/generate-agents.js
fi

# -----------------------------------------------------------------------------
# 4. Final report
# -----------------------------------------------------------------------------
agent_count=$(find "$REPO_ROOT/.claude/agents" -maxdepth 1 -name '*.md' \
  -not -name '.gitkeep' 2>/dev/null | wc -l | tr -d ' ')
skill_count=$(find "$REPO_ROOT/.claude/skills" -mindepth 2 -name 'SKILL.md' \
  2>/dev/null | wc -l | tr -d ' ')

echo
echo "==> Bootstrap complete"
echo "    WIKI_REPO:  $WIKI_REPO"
echo "    Agents:     $agent_count in .claude/agents/"
echo "    Skills:     $skill_count in .claude/skills/"
echo
echo "Persist WIKI_REPO across shells:"
echo "    echo 'export WIKI_REPO=\"$WIKI_REPO\"' >> ~/.bashrc"
echo
echo "Next:"
echo "    • Invoke a team skill: /max, /wharfside, /architect, etc."
echo "    • Refresh wiki later: cd \"$WIKI_REPO\" && git pull"
