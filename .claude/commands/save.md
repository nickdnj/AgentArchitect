# Save - Session Persistence

Save the current session's context to memory, commit all changes, and push to remote. Use this as a save point any time — mid-session when context is getting large, or at the end of a session.

## What This Does

When invoked, this command:
1. Analyzes the conversation and persists key information as markdown files in the appropriate context buckets
2. Stages and commits all uncommitted changes in the repo
3. Pushes to the remote

This ensures continuity between sessions and prevents losing any work.

## Procedure

Follow these steps carefully:

### Step 1: Analyze the Session

Review the full conversation history and identify:

1. **Which agents/teams were active** - Look for skill invocations (`/architect`, `/altium`, `/wharfside`, `/max`, `/software-project`, `/web-research`, etc.) and any agent Task delegations
2. **Key topics discussed** - What subjects, problems, or questions were explored
3. **Research conducted** - Any web searches, email searches, document reads, or investigations
4. **Decisions made** - Conclusions, choices, or determinations reached
5. **Open items** - Unfinished work, pending questions, or next steps identified
6. **Artifacts created** - Files written, emails sent/drafted, documents created

### Step 2: Determine Storage Locations

Map each piece of information to the correct context bucket based on which agent/team owns it:

| Agent/Team | Context Bucket | Path |
|-----------|---------------|------|
| Max / Personal Assistant | `research-cache` | `context-buckets/research-cache/files/` |
| Max / Personal Assistant | `personal-notes` | `context-buckets/personal-notes/files/` |
| Wharfside Board Assistant | `wharfside-docs` | `context-buckets/wharfside-docs/files/` |
| Altium Solutions | `altium-playbook` | `context-buckets/altium-playbook/files/` |
| Architect (system-level) | `session-logs` | `context-buckets/session-logs/files/` |
| General / unaffiliated | `session-logs` | `context-buckets/session-logs/files/` |

If a context bucket directory doesn't exist yet, create it (including `files/` subdirectory) and register it in `registry/buckets.json`.

### Step 3: Write Memory Files

For each relevant context bucket, write a markdown file following this pattern:

**Filename:** `YYYY-MM-DD_topic-slug.md` (using today's date)

If multiple distinct topics were covered for the same bucket, write separate files for each topic.

**File structure:**

```markdown
# [Topic Title]

**Date:** YYYY-MM-DD
**Session type:** [research | planning | execution | review | mixed]
**Agents involved:** [list of agents/teams active]

## Summary

[2-3 sentence overview of what was accomplished on this topic]

## Key Findings

- [Bullet points of important discoveries, facts, or data gathered]

## Decisions Made

- [Bullet points of choices or conclusions reached]

## Research Sources

- [URLs, documents, emails referenced - with brief description of each]

## Artifacts Created

- [Files, emails, documents produced - with paths or IDs]

## Open Items

- [ ] [Uncompleted tasks or follow-ups needed]
- [ ] [Questions still unanswered]

## Context for Next Session

[Brief paragraph describing where things stand and what someone picking this up next would need to know to continue effectively]
```

### Step 4: Update Bucket Registries

If any new context buckets were created, update `registry/buckets.json`.

### Step 5: Stage & Commit All Changes

1. Run `git status` to see all uncommitted changes (staged, unstaged, and untracked)
2. Stage all changes — memory files, SKILL.md edits, config.json updates, and any other repo modifications made during the session
3. Compose a descriptive commit message based on the session analysis:
   - Summarize what was accomplished (e.g., "Add web-research agent and persist garage door research")
   - Reference which agents/teams were involved if relevant
   - Keep it concise (1-2 lines)
4. Commit with the standard Co-Authored-By trailer
5. If there are no changes to commit, skip this step

### Step 6: Push to Remote

1. Push to the current branch's remote tracking branch
2. If push fails (auth issues, conflicts, etc.), note the error in the summary but don't block the rest of the save

### Step 7: Confirm and Summarize

Present a summary to the user showing:
- How many memory files were written and to which context buckets
- Git commit hash and summary of what was committed (or "No changes to commit")
- Push status (success, failed with reason, or skipped)
- Key open items that need attention next time
- Any files or artifacts that were created during the session

### Special Cases

**If the session was trivial** (just a quick question, no meaningful research or work):
- Skip writing memory files
- Still run the git commit/push steps (there may be uncommitted changes from earlier work)
- Confirm: "No session context to persist, but checked for uncommitted changes."

**If research was conducted that duplicates an existing cache file:**
- Update the existing file rather than creating a duplicate
- Add a `## Updates` section with the new date and findings

**If the session involved the Architect:**
- Don't persist Architect menu interactions or routine management
- DO persist any new agents, teams, or buckets that were created (these are already saved in their own config files)
- DO persist any architectural decisions or design discussions

## Important Notes

- Use today's date for filenames
- Keep summaries concise but complete enough to be useful months later
- Include enough context that a future session can pick up without re-reading the full conversation
- Don't persist sensitive information (API keys, passwords) in memory files
- If in voice mode, announce the summary verbally
- This command can be used mid-session as a save point — it does not end the conversation
