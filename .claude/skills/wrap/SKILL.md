# Wrap — End-of-Session Cleanup

Ensures all in-flight work is captured before the terminal closes. Run this before exiting Claude Code at the end of a substantive session.

**Usage:**
- `/wrap` — full cleanup: check git in both repos, write architect session log, commit, push, confirm safe to exit.
- `/wrap --no-push` — same but don't push (useful when offline; pushes deferred to next session).
- `/wrap --skip-log` — same but skip writing the architect session log (useful when the orchestrator already logged the session).

## Procedure

### Step 1: Inventory uncommitted work in both repos

Run in parallel:
```bash
cd /Users/nickd/Workspaces/AgentArchitect && git status --short
cd /Users/nickd/Workspaces/wiki && git status --short
```

For each modified/added/untracked file, mentally classify:
- **Mine** — files I wrote or edited this session (track these explicitly during the session)
- **Other agents'** — files modified by background work, scheduled triggers, or other Claude sessions (`.obsidian/*.json`, jersey-stack assets, etc.)
- **Generated** — dashboard files, .claude/agents/*.md (allowed alongside my changes)

**CRITICAL:** per the Parallel Agent Git Rules in CLAUDE.md, only stage files YOU wrote this session. Never `git add -A` or `git add .` — that sweeps up other agents' work.

If you're not sure whose a file is, ask Nick before staging it.

### Step 2: Write or append the architect session log

If today's architect work was substantive (multi-step migrations, schema changes, new agents/teams, wiki structure changes), the work belongs in:

```
~/Workspaces/wiki/_sessions/architect/YYYY-MM-DD.md
```

**If the file does not exist:** create it with a header and write a milestone summary for each significant block of work today. Use the pattern:

```markdown
---
date: YYYY-MM-DD
team: architect
operator: nick + claude (architect role)
---

# Architect Session — YYYY-MM-DD

## HH:MM — <milestone title>

**Asked:** <one line — what Nick requested>
**Output:** <key artifacts, paths, decisions>
**Commits:** <SHAs and which repo>
```

**If the file exists:** append new milestones from this session (don't rewrite existing entries).

Skip this step if `--skip-log` is passed OR the session was trivial (single quick task, no architectural changes).

### Step 3: Commit my files in each repo

For each repo with mine-flagged files:

```bash
# AgentArchitect
cd /Users/nickd/Workspaces/AgentArchitect
git add <specific-paths>
git commit -m "<descriptive message>"

# wiki
cd /Users/nickd/Workspaces/wiki
git add <specific-paths>
git commit -m "<descriptive message>"
```

Use multi-line commit messages via HEREDOC for substantive commits. Always include the standard `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` footer.

### Step 4: Push (unless `--no-push`)

```bash
cd /Users/nickd/Workspaces/AgentArchitect && git push
cd /Users/nickd/Workspaces/wiki && git push
```

If push fails (network, auth, conflict), report exactly what failed and what the recovery path is. Do NOT force-push.

### Step 5: Confirm safe to exit

Print a concise summary:

```
Wrap complete.
- AgentArchitect: <SHA> pushed (or "nothing to commit")
- wiki: <SHA> pushed
- Architect session log: <path> (or "not written — session was trivial")

Safe to exit: ⌃D or `exit`.
```

In voice mode, speak: "Wrap complete. Both repos pushed. Safe to exit."

## What this skill does NOT do

- Does not stop voice mode (use `/end-voice-local` for that)
- Does not stop whisper/kokoro services
- Does not run the nightly lint manually
- Does not touch any file that isn't yours
- Does not amend or rewrite existing commits

## When to invoke

- **Always:** before exiting Claude Code at the end of a session with substantive work
- **Optional:** mid-session if you want a clean savepoint and aren't ready to exit
- **Skip:** for purely conversational sessions that produced no file changes

## Relationship to other persistence mechanisms

- **Team orchestrator session-log step (MANDATORY):** each team's orchestrator writes `wiki/teams/<team>/_sessions/<date>.md` after substantive interactions. Covers Wharfside, Max, hardware-dev, etc. work.
- **`/wrap` (this skill):** covers architect-level work that doesn't go through a team orchestrator, plus catches any uncommitted/unpushed changes from any source.
- **`/save` (legacy):** the older session-state command. Still useful for capturing in-conversation context that isn't going into the wiki. Largely superseded by team session logs + this wrap skill.
