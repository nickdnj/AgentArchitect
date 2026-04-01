# Projects — Active Work Index

List active projects and load context for a selected one.

**Usage:**
- `/projects` — Show all active projects
- `/projects [name]` — Jump directly to a project by keyword match

## Procedure

### Step 1: Read MEMORY.md

Read the memory index at:
```
~/.claude/projects/-Users-nickd-Workspaces-AgentArchitect/memory/MEMORY.md
```

### Step 2: Parse & Categorize

Scan each `## Section` heading in MEMORY.md. For each entry, extract:
- **Title** — the heading text (strip the date)
- **Date** — the parenthetical date
- **Status** — look for `**Status:**` line in the bullets
- **Next** — look for `**Next:**`, `**TODO:**`, `**Open:**`, or `**Phase ... NEXT:**` lines
- **Detail file** — the `[file.md](file.md)` link if present
- **Team** — assign based on the team signal map below
- **Category** — classify based on signals below

**Team signal map** — match against project title, description, and content keywords:

| Signals | Team | Skill |
|---------|------|-------|
| video, documentary, YouTube, shorts, trailer, narration, upload, premiere | YouTube Content | `/youtube-content` |
| website, app, code, API, firmware, software, PWA, React, Docker | Software Project | `/software-project` |
| Wharfside, condo, board, HOA, marina, access control | Wharfside | `/wharfside` |
| Altium, PCB, EDA, schematic, layout | Altium Solutions | `/altium` |
| tax, estate, financial, insurance, personal, research, calendar | Max | `/max` |
| agent, team, architect, bucket, skill | Architect | `/architect` |

- A project can belong to **multiple teams** — apply ALL matching signal rows, not just the first match
- Examples: "TagSmart" and "Fob Reader" match both Wharfside (built for condo) AND Software Project (code/hardware); "Batter Up Website" = Software Project only; "Batter Up History Video" = YouTube Content only
- If no team matches, label as "General"

**Known multi-team projects** (override signal map when these appear):

| Project | Teams | Why |
|---------|-------|-----|
| TagSmart | Wharfside + Software Project | Asset management PWA built for Wharfside community |
| Fob Reader | Wharfside + Software Project | Arduino hardware + firmware built for Wharfside access control |
| StoveIQ | Software Project | Full-stack IoT product (firmware + app + cloud) |
| VistterStream | Software Project | Docker-based streaming server |

**Project** (any entry that represents buildable/shippable work):
- Includes projects at ANY stage: active development, shipped/live, waiting on someone, complete
- Shipped projects remain full projects — they need ECOs, maintenance, updates, and context recall
- Use the Status column to show current state (active dev, live, waiting, etc.)

**Reference** (informational, not a project):
- Entries under "User Background", "User Financial", "MCP Server Patterns", "Network Infrastructure", "GStack Integration"
- Memory type is `user`, `feedback`, or `reference` (not `project`)
- MCP server setup notes, Apple integrations, Cloud RAG infrastructure

### Step 3: Present Menu

**If a keyword was provided** (e.g., `/projects stove`):
- Find the matching project(s) by keyword against title and status
- If exactly one match, skip the menu and go straight to Step 4
- If multiple matches, show the filtered list

**If no keyword:**
Show a single numbered list of ALL projects (no active/shipped split). Every project stays selectable regardless of status.

```
Projects (N)
━━━━━━━━━━━━

 #  Project                      Team(s)                    Status                          Next / Notes
 1  StoveIQ                      Software Project           HW ordered, stack built         PCB assembly + firmware flash
 2  TagSmart v2                  Wharfside + Software       LIVE (tagsmart.vistter.com)     rclone backup, decommission old infra
 3  Bahr's Landing Video         YouTube Content            Draft v2 ready                  Re-record narration, review
 4  Batter Up Website            Software Project           LIVE (batterupli.com)           —
 5  Fob Reader                   Wharfside + Software       Deployed                        —
 ...

Enter a number to load project context, or 0 to cancel:
```

Keep it compact — one line per project. Use the status and next action from MEMORY.md bullets. Projects with no open work show "—" in the Next column.

### Step 4: Load Context

When the user selects a project:

1. **Read the detail memory file** — follow the `See detailed notes: [file.md]` link from MEMORY.md. The file is at `~/.claude/projects/-Users-nickd-Workspaces-AgentArchitect/memory/<file.md>`. Read the full file into context.

2. **Show the summary** — after loading, display:
   ```
   Loaded: [Project Name]
   Team: [team name(s)] — invoke with [/skill-name]
   Status: [current status]
   Next: [next action items]
   Detail file: [path]
   Repo: [if applicable]
   ```

3. **Route to team** — suggest the matching team skill:
   - "Invoke `/youtube-content` to work on this" (for video projects)
   - "Invoke `/software-project` to work on this" (for software projects)
   - "Invoke `/wharfside` to work on this" (for Wharfside projects)
   - "Invoke `/max` to work on this" (for personal/financial projects)
   - If multiple teams apply, list all with a note on which handles what aspect

### Voice Mode

If voice mode is active (mcp__voicemode__converse has been used):
- Read out the project list with numbers
- Ask which project to load
- After loading, speak a brief summary instead of showing the table
- Keep it to 2-3 sentences

### Important Notes

- This command is **read-only** — it never modifies memory files
- Loading a detail file consumes context window; for very large files, summarize key sections
- Projects that have no detail file still show in the list — just load the MEMORY.md section
- If MEMORY.md is truncated (>200 lines), note that some projects may not be listed
