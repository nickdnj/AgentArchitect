# TODOS

## Week 2: User Correction Capture
**What:** Add `user_edits` field capture — when the user manually fixes agent output, detect and log what changed.
**Why:** The design doc identifies this as "a more reliable signal than orchestrator self-assessment." The orchestrator evaluates its own delegate, which is a single point of bias. Capturing what the user actually corrected gives the Improver a ground-truth signal.
**Pros:** Strongest feedback signal, reduces orchestrator-as-evaluator bias.
**Cons:** Requires instrumenting the edit detection — non-trivial to detect which changes were "corrections" vs. unrelated edits.
**Context:** Design doc Phase 1 Week 2. The feedback schema already has the `user_edits` field defined (optional). The mechanism for populating it is TBD.
**Depends on:** Feedback loop validated on real tasks (minimum 10 feedback entries accumulated).

## Future: TagSmart query skill (read-only)
**What:** Build a `tagsmart` skill so agents (wharfside, max) can look up assets/fobs/incidents in the TagSmart asset DB — e.g., "what assets/fobs are assigned to unit 174?", "is unit X's fob active or disabled?". Recommended shape: **skill wrapping the existing TagSmart REST API** (`GET /api/assets?...`, `/api/assets/search`, JWT auth) — zero or minimal new code. Only build a dedicated read-only CLI in `tagsmart-v2` if the API is insufficient. MCP server only if heavy agent use justifies it.
**Why:** Twice in one session (2026-05-25 Wharfside triage) the answer lived in a system the agent couldn't query — the ECI/AppFolio portal and TagSmart. The Tom #174 thread needed a fob-status lookup that only Nick could do manually. A skill closes that gap and fits the "every recurring task gets tooled" philosophy.
**Pros:** Agents answer fob/asset/incident questions directly; reusable by humans (CLI) too.
**Cons:** Auth handling (JWT/secrets via env, not plaintext — creds in Apple Passwords). Must decide source-of-truth for the fob enabled/disabled flag (TagSmart DB vs. eMerge E3 access controller at 192.168.12.250).
**Design decisions (Nick to confirm):** (1) Does the TagSmart API already return fob/asset status by unit, or need a new endpoint? (2) Is the enabled/disabled flag in TagSmart or eMerge E3? (3) Read-only to start — toggling building access stays manual/confirmation-gated.
**Context:** TagSmart v2 = Express + Drizzle + SQLite + JWT, Docker on N100 mini PC, Cloudflare Tunnel at tagsmart.vistter.com. Repo: `~/Workspaces/tagsmart-v2`. Asset routes: `server/src/routes/assets.ts`. Logged 2026-05-25.
**Depends on:** Nick's answers to the 3 design questions above.

## Future: Expand Feedback Loop to Other Teams
**What:** Add `feedback_loop` config to hardware-dev (firmware-engineer, pcb-designer) and other high-activity teams.
**Why:** Once the learning loop proves itself on software-developer, the same pattern benefits any agent with repeated task types. The generator already supports any team opting in via `team.json`.
**Pros:** Every team's agents get smarter over time. Zero additional infrastructure needed.
**Cons:** More feedback files to manage. Rubrics need to be designed per agent type.
**Context:** The generator in `generate-agents.js` (and soon `generate-cowork.js`) already handles arbitrary teams with `feedback_loop.enabled`. Just needs rubric design per agent.
**Depends on:** Learning Loop validated on software-project team. At least one successful Improver proposal approved.
