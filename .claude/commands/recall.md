# Recall - Session Memory Retrieval

Load previous session memory files into context for continuity.

**Usage:**
- `/recall` — Search the current agent/team's context buckets
- `/recall [topic]` — Search all context buckets for a specific topic

## Procedure

### Step 1: Determine Search Scope

**If a topic/keyword was provided** (e.g., `/recall garage doors`):
- Search ALL context buckets for matching files
- Match against filenames and file contents

**If no topic was provided:**
- Detect which agent or team is currently active by checking the conversation for recent skill invocations (`/architect`, `/altium`, `/wharfside`, `/max`, `/software-project`, `/web-research`, etc.)
- Map to the appropriate context bucket(s):

| Active Agent/Team | Context Buckets to Search |
|-------------------|--------------------------|
| Max / Personal Assistant | `research-cache`, `personal-notes` |
| Wharfside Board Assistant | `wharfside-docs` |
| Altium Solutions | `altium-playbook` |
| Architect | `session-logs` |
| None detected / General | `session-logs` |

- List all memory files in those buckets

### Step 2: Find Matching Files

Search the target context bucket `files/` directories:

1. **List all `.md` files** in the bucket's `files/` directory
2. **If a topic was provided**, filter by:
   - Filename match (case-insensitive, partial match on the slug portion)
   - Content match (grep the first 10 lines / title + summary for the search term)
3. **Sort by date** (newest first, using the `YYYY-MM-DD` filename prefix)

### Step 3: Present Results

Show a numbered list of matching memory files:

```
Found [N] memory files in [bucket-name]:

1. 2026-02-04 - Goodbye Command Creation (session-logs)
   Session type: execution | Agents: Architect
   Summary: Designed and implemented the /save session persistence command...

2. 2026-02-01 - Garage Door Opener Research (research-cache)
   Session type: research | Agents: Max
   Summary: Researched garage door opener options for The Villages FL...

Which files would you like to load? (numbers, "all", or "none")
```

For each file, show:
- Date and title (from the `#` heading)
- Bucket it came from
- Session type and agents involved (from frontmatter)
- First 1-2 sentences of the Summary section

### Step 4: Load Selected Files

When the user selects files:
- Read the full content of each selected file
- Present the content so it's in the conversation context
- Briefly note: "Loaded N memory files. This context is now available for the rest of the session."

### Special Cases

**If no memory files are found:**
- Report: "No memory files found in [bucket]. This is either a fresh topic or nothing has been persisted with /save yet."

**If searching across all buckets returns many results (>10):**
- Show only the 10 most recent
- Note: "Showing 10 most recent of [N] total. Provide a more specific search term to narrow results."

**If in voice mode:**
- Read out the list of files with titles and dates
- Ask which to load verbally
- After loading, briefly summarize what was loaded rather than reading full contents

## Important Notes

- This command is read-only — it never modifies memory files
- Loading files adds them to the current conversation context, which uses up context window
- For large memory files, consider loading just the Summary and Open Items sections
- Memory files are created by `/save` — if none exist, suggest running `/save` at the end of future sessions
