# Wrap — End-of-Session Cleanup

Ensures all in-flight work is captured before the terminal closes. Run this before exiting Claude Code at the end of a substantive session. Works in any AgentArchitect-provisioned repo (workspace or project) and in AgentArchitect itself.

**Usage:**
- `/wrap` — full cleanup: check git in this repo (+ wiki), write session log, commit, push if a remote exists, confirm safe to exit.
- `/wrap --no-push` — same but don't push (useful when offline).
- `/wrap --skip-log` — same but skip the session log (useful when the team orchestrator already logged the session).

## Procedure

### Step 1: Inventory uncommitted work

Run in parallel:
```bash
git status --short          # current repo
cd ~/Workspaces/wiki && git status --short   # wiki (if present)
```

For each modified/added/untracked file, classify:
- **Mine** — files I wrote or edited this session (track these explicitly during the session)
- **Other agents'** — files modified by background work or other Claude sessions
- **Generated** — `.claude/agents/*.md`, `.claude/skills/*/SKILL.md`, dashboard/registry bumps (allowed alongside my changes)

**CRITICAL:** per the Parallel Agent Git Rules in CLAUDE.md, only stage files YOU wrote this session. Never `git add -A` or `git add .`. If unsure whose a file is, ask Nick before staging.

### Step 2: Session log

If this session's work was substantive, append a milestone summary to the right wiki sessions file:
- Team/workspace repo work → `~/Workspaces/wiki/teams/<team>/_sessions/YYYY-MM-DD.md` (team id is in `.agentarchitect.json`)
- Architect-level work in AgentArchitect → `~/Workspaces/wiki/_sessions/architect/YYYY-MM-DD.md`

Pattern per milestone: **Asked** (one line) / **Output** (artifacts, paths, decisions) / **Commits** (SHAs + repo). Create the file with date/team frontmatter if missing; append, never rewrite existing entries. Skip if `--skip-log` or the session was trivial.

### Step 3: Commit my files

```bash
git add <specific-paths>
git commit -m "<descriptive message>"
```

Same for the wiki if I touched it. Use HEREDOC multi-line messages for substantive commits, with the standard `Co-Authored-By` footer.

### Step 4: Push (unless `--no-push`)

Push each repo that has a remote (`git remote -v`). A freshly provisioned repo may have no remote yet — report that ("local only, no remote configured") rather than failing. If push fails, report exactly what failed and the recovery path. Do NOT force-push.

### Step 5: Confirm safe to exit

```
Wrap complete.
- <repo>: <SHA> pushed (or "nothing to commit" / "local only, no remote")
- wiki: <SHA> pushed (or "untouched")
- Session log: <path> (or "not written — session was trivial")

Safe to exit: ⌃D or `exit`.
```

In voice mode, speak a one-line confirmation.

## What this skill does NOT do

- Does not stop voice mode (use `/end-voice-local`)
- Does not touch any file that isn't yours
- Does not amend or rewrite existing commits

## When to invoke

- **Always:** before exiting at the end of a session with substantive work
- **Optional:** mid-session for a clean savepoint
- **Skip:** purely conversational sessions with no file changes
