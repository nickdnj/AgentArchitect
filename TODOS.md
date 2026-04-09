# TODOS

## Week 2: User Correction Capture
**What:** Add `user_edits` field capture — when the user manually fixes agent output, detect and log what changed.
**Why:** The design doc identifies this as "a more reliable signal than orchestrator self-assessment." The orchestrator evaluates its own delegate, which is a single point of bias. Capturing what the user actually corrected gives the Improver a ground-truth signal.
**Pros:** Strongest feedback signal, reduces orchestrator-as-evaluator bias.
**Cons:** Requires instrumenting the edit detection — non-trivial to detect which changes were "corrections" vs. unrelated edits.
**Context:** Design doc Phase 1 Week 2. The feedback schema already has the `user_edits` field defined (optional). The mechanism for populating it is TBD.
**Depends on:** Feedback loop validated on real tasks (minimum 10 feedback entries accumulated).

## Future: Expand Feedback Loop to Other Teams
**What:** Add `feedback_loop` config to hardware-dev (firmware-engineer, pcb-designer) and other high-activity teams.
**Why:** Once the learning loop proves itself on software-developer, the same pattern benefits any agent with repeated task types. The generator already supports any team opting in via `team.json`.
**Pros:** Every team's agents get smarter over time. Zero additional infrastructure needed.
**Cons:** More feedback files to manage. Rubrics need to be designed per agent type.
**Context:** The generator in `generate-agents.js` (and soon `generate-cowork.js`) already handles arbitrary teams with `feedback_loop.enabled`. Just needs rubric design per agent.
**Depends on:** Learning Loop validated on software-project team. At least one successful Improver proposal approved.
