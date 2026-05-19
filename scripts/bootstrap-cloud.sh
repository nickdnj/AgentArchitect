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
#   WIKI_REPO         Where the wiki lives (default: $HOME/Workspaces/wiki)
#   WIKI_REPO_URL     Where to clone from  (default: https://github.com/nickdnj/wiki.git)
#   WIKI_GH_TOKEN     Fine-grained PAT with Contents:read+write on nickdnj/wiki.
#                     Required in cloud sandboxes (no `gh` CLI). Used only via a
#                     git credential helper — never written to .git/config.
#   WIKI_GIT_USER_NAME / WIKI_GIT_USER_EMAIL
#                     Commit identity for wiki commits. Falls back to
#                     GIT_AUTHOR_NAME / GIT_AUTHOR_EMAIL, then to the global
#                     git config.
#   SKIP_GENERATE     Set to 1 to skip the generate-agents step (for tests)
#
# Exit codes:
#   0  success
#   1  missing prerequisites
#   2  wiki path collision (path exists but is not a git repo)
#   3  git clone failed (likely auth — set WIKI_GH_TOKEN)

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WIKI_REPO_URL="${WIKI_REPO_URL:-https://github.com/nickdnj/wiki.git}"
WIKI_REPO_PATH="${WIKI_REPO:-$HOME/Workspaces/wiki}"

# Credential helper string. Reads $WIKI_GH_TOKEN from the environment at the
# moment git invokes it, so the token never lands in .git/config on disk.
# IMPORTANT: must be single-quoted everywhere it's passed to git so that
# $WIKI_GH_TOKEN is expanded by the helper subshell, not at config-set time.
WIKI_CRED_HELPER='!f() { test -n "$WIKI_GH_TOKEN" || { echo "bootstrap-cloud: WIKI_GH_TOKEN not set" >&2; exit 1; }; echo username=x-access-token; echo "password=$WIKI_GH_TOKEN"; }; f'

echo "==> AgentArchitect cloud bootstrap"
echo "    Repo root:    $REPO_ROOT"
echo "    Wiki path:    $WIKI_REPO_PATH"
echo "    Wiki source:  $WIKI_REPO_URL"
if [[ -n "${WIKI_GH_TOKEN:-}" ]]; then
  echo "    Auth:         WIKI_GH_TOKEN (fine-grained PAT, via credential helper)"
else
  echo "    Auth:         none (set WIKI_GH_TOKEN to enable clone/push)"
fi
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
configure_wiki_repo() {
  # Idempotent: install/refresh the per-repo credential helper and commit
  # identity. Safe to run on every bootstrap.
  local repo_path="$1"

  if [[ -n "${WIKI_GH_TOKEN:-}" ]]; then
    git -C "$repo_path" config --local credential.helper "$WIKI_CRED_HELPER"
  fi

  local name="${WIKI_GIT_USER_NAME:-${GIT_AUTHOR_NAME:-}}"
  local email="${WIKI_GIT_USER_EMAIL:-${GIT_AUTHOR_EMAIL:-}}"
  if [[ -n "$name" ]]; then
    git -C "$repo_path" config --local user.name "$name"
  fi
  if [[ -n "$email" ]]; then
    git -C "$repo_path" config --local user.email "$email"
  fi
}

if [[ -d "$WIKI_REPO_PATH/.git" ]]; then
  echo "==> Wiki already cloned (leaving working tree as-is — user owns local state)"
  configure_wiki_repo "$WIKI_REPO_PATH"
elif [[ -e "$WIKI_REPO_PATH" ]]; then
  echo "ERROR: $WIKI_REPO_PATH exists but is not a git repo." >&2
  echo "       Move it aside or set WIKI_REPO to a different path." >&2
  exit 2
else
  echo "==> Cloning wiki -> $WIKI_REPO_PATH"
  mkdir -p "$(dirname "$WIKI_REPO_PATH")"

  clone_args=(clone --depth 1 "$WIKI_REPO_URL" "$WIKI_REPO_PATH")
  if [[ -n "${WIKI_GH_TOKEN:-}" ]]; then
    # Inject the credential helper just for this clone. The helper string is
    # also persisted into the cloned repo's config below for future pushes.
    clone_args=(-c "credential.helper=$WIKI_CRED_HELPER" "${clone_args[@]}")
  fi

  if ! git "${clone_args[@]}"; then
    echo >&2
    if [[ -z "${WIKI_GH_TOKEN:-}" ]]; then
      echo "ERROR: git clone failed and no WIKI_GH_TOKEN is set." >&2
      echo "       The wiki is a private repo. In claude.ai → Code →" >&2
      echo "       AgentArchitect environment, add a fine-grained PAT" >&2
      echo "       (Contents: Read and write on nickdnj/wiki) as the secret" >&2
      echo "       WIKI_GH_TOKEN, then restart this session." >&2
    else
      echo "ERROR: git clone failed even though WIKI_GH_TOKEN is set." >&2
      echo "       Check that the token is valid, not expired, and scoped" >&2
      echo "       to nickdnj/wiki with Contents: Read and write." >&2
    fi
    exit 3
  fi

  configure_wiki_repo "$WIKI_REPO_PATH"
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
if [[ -n "${WIKI_GH_TOKEN:-}" ]]; then
  echo "    • Push wiki edits:    cd \"$WIKI_REPO\" && git add . && git commit && git push"
fi
