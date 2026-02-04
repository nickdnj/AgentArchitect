# Goodbye - Session Persistence

Save the current session's context to memory before closing out.

## What This Does

When invoked, this command analyzes the current conversation and persists key information as markdown files in the appropriate context buckets. This ensures continuity between sessions and prevents redundant research.

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

If any new context buckets were created (like `session-logs`), update `registry/buckets.json`.

### Step 5: Confirm and Summarize

Present a summary to the user showing:
- How many memory files were written
- Which context buckets received updates
- Key open items that need attention next time
- Any files or artifacts that were created during the session

### Special Cases

**If the session was trivial** (just a quick question, no meaningful research or work):
- Skip writing memory files
- Just confirm: "This session didn't produce anything worth persisting. Goodbye!"

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
- If in voice mode, announce the summary verbally before closing
