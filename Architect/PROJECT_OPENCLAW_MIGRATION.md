# Project: OpenClaw Migration for Agent Architect Starter

**Status:** Scoped — ready to build
**Opened:** 2026-04-17
**Owner:** Nick + Archie
**Target users:** Any OpenClaw user who discovers Agent Architect via the starter (friend of Nick is first real user)

---

## Why this exists

OpenClaw is a popular self-hosted AI agent runtime (247K GitHub stars as of March 2026). Its capability primitive, **AgentSkills**, is structurally identical to Agent Architect's `SKILL.md` pattern — both store each skill in its own directory as markdown with YAML frontmatter. That means a migration path isn't a reimplementation; it's a mapping exercise.

Nick's friend just switched from OpenClaw to Claude. He's the first user we'll put through the migration, but we're building the tool for any OpenClaw user who lands on AA's GitHub page and wants to bring their skills over.

## What OpenClaw looks like (for context)

- **Skills live at:** `~/.openclaw/skills/<skill-name>/SKILL.md`
- **Format:** YAML frontmatter + markdown body
- **Frontmatter fields:** `name`, `description`, `user-invocable`, `permissions` (tool allowlist), `triggers`
- **Body:** freeform markdown the model reads when the skill is selected
- **Tools:** OpenClaw has its own tool system; roughly 100 preconfigured tools (shell, filesystem, web automation, platform integrations)
- **Platforms:** OpenClaw is message-platform-driven (WhatsApp, Discord) vs. AA's Claude Code / terminal flow — this is outside the migration scope

## Scope decisions (answered 2026-04-17)

| Question | Answer |
|---|---|
| Who is this for? | **Both** — general tool, friend is first user |
| What gets migrated? | **AgentSkills + best-effort tool config mapping** (OpenClaw tools → MCP servers where possible) |
| Where does it live? | **Both** — new specialist in the Starter Team, plus `/architect migrate-from-openclaw` command |
| Direction | **One-way only** (OpenClaw → AA). No export back |
| Future-proofing | **Narrow and OpenClaw-specific** — no generic import framework |
| Friend's scale | Unknown — design should handle 1 to many skills gracefully |

---

## What gets built

### 1. A new specialist agent: `migration-openclaw`

Lives in `starter-seed/agents/migration-openclaw/` so it ships in every starter install.

**Role:** Walks the user through migrating their OpenClaw skills to Agent Architect, one at a time or in batch. Reads their `~/.openclaw/skills/` directory, parses each AgentSkill, maps it to AA's format, asks the user to confirm / refine, and writes the result.

**Core flow:**
1. Locate the user's OpenClaw install (default `~/.openclaw/skills/`, but ask)
2. Scan for AgentSkills, present a list to the user with brief descriptions
3. For each selected skill:
   - Parse YAML frontmatter + markdown body
   - Propose the AA mapping:
     - `SKILL.md` — markdown body restructured lightly to match AA conventions (Purpose / Core Responsibilities / Workflow / Output / Success Criteria)
     - `config.json` — frontmatter fields mapped to AA schema
     - MCP server suggestions — best-effort match from the permissions list
   - Show the user the proposed files, let them approve / edit
   - Write to `agents/<agent-id>/` and register in `registry/agents.json`
4. Offer to group the migrated agents into a team
5. Append "Operating Notes (Claude 4.7)" block to every migrated SKILL.md (consistent with the rest of AA)
6. Run `node scripts/generate-agents.js` at the end to materialize `.claude/` files

### 2. An Architect command: `/architect migrate-from-openclaw`

Archie's entry point. Archie hands off to `migration-openclaw` specialist with appropriate context (user's repo root, preferences), then synthesizes the summary at the end.

### 3. A supporting script (optional): `scripts/parse-openclaw-skill.js`

Pure parser that reads an OpenClaw `SKILL.md` and outputs the AA mapping as JSON. Makes the migration specialist's job deterministic rather than freeform. If the LLM can do this reliably inline, we may skip building this as a separate script.

### 4. Documentation: `docs/migrating-from-openclaw.md`

Human-readable companion doc for users who want to understand what the migration does before running it. Links from the starter `README.md`.

---

## The mapping

### Frontmatter → config.json

| OpenClaw field | AA `config.json` location | Notes |
|---|---|---|
| `name` | `id` (kebab-case) and `name` | AA uses kebab-case for `id`, Title Case for `name` |
| `description` | `description` | direct copy |
| `user-invocable: true` | implies `agent_type: "specialist"` | |
| `permissions` | `mcp_servers` (best-effort map) | see tool mapping table below |
| `triggers` | `trigger.description` | paraphrase into one sentence |
| (not present) | `version: "1.0"`, `execution.context: "fork"`, `execution.model: "sonnet"` | defaults |

### Body → SKILL.md

Preserve the body mostly as-is. Light restructuring:
- If body doesn't start with `# <Name> - SKILL`, rewrite the first line
- If body lacks `## Purpose`, infer from description
- If body lacks `## Workflow`, leave a `<!-- TODO: structure as workflow steps -->` marker for the user
- Append the standard `## Operating Notes (Claude 4.7)` block from `agents/_templates/4_7_operating_notes.md`

### Tool permissions → MCP servers (best-effort)

| OpenClaw permission | AA MCP server | Confidence |
|---|---|---|
| `web-browser`, `web-automation` | `chrome` | High |
| `email`, `gmail`, `mail` | `gmail` | High |
| `calendar`, `gcal` | `google-calendar` | High |
| `drive`, `gdrive`, `files-cloud` | `gdrive` | High |
| `slack` | (no AA equivalent yet) | Flag for user |
| `discord`, `whatsapp`, `telegram` | (no AA equivalent yet) | Flag for user |
| `shell`, `filesystem` | built-in tools (not MCP) | Note: "AA has this natively" |
| Unknown permissions | (none) | List in migration report for user review |

Confidence column: high-confidence maps happen automatically; low/unknown get surfaced in the migration report so the user can decide.

---

## Known gaps (to discuss with friend during first real migration)

1. **Messaging-platform bridges.** OpenClaw runs long-lived and responds on WhatsApp/Discord. AA runs inside Claude Code sessions. We are NOT migrating this integration. The migration specialist should be explicit: "Your agents' behavior carries over, but they'll run in Claude Code sessions instead of responding on Discord. If you need the bridge, keep OpenClaw running alongside."

2. **Custom tool code.** If an OpenClaw AgentSkill includes bundled Python/TS code, we preserve the body verbatim but note that AA agents don't execute skill-local code the same way. Flag for review.

3. **Multi-agent coordination.** If the OpenClaw user had routing / handoff between skills, they'll likely want to recreate as an AA team. The specialist should ask: "Were these skills used together? If so, I can suggest grouping them into an AA team after the migration."

4. **Cross-platform runtime.** OpenClaw on macOS/iOS/Android — AA is Claude Code only. Explicit in the handoff message.

---

## Deliverables

- [ ] `starter-seed/agents/migration-openclaw/SKILL.md`
- [ ] `starter-seed/agents/migration-openclaw/config.json`
- [ ] Update `starter-seed/teams/starter-team/team.json` — add `migration-openclaw` as a 4th member, add routing for "migrate", "openclaw", "import from openclaw"
- [ ] Update `Architect/SKILL.md` — add `/architect migrate-from-openclaw` as a documented command that delegates to the specialist
- [ ] `docs/migrating-from-openclaw.md` — user-facing explanation
- [ ] Update starter `README.md` (generated by `build-starter.js`) to mention the migration path
- [ ] Optional: `scripts/parse-openclaw-skill.js` if we decide deterministic parsing is better than inline

## Testing

- Build a fake `~/.openclaw-test/skills/` tree with 2–3 synthetic AgentSkills covering: simple single-skill, skill with tools, skill with unknown permissions
- Run the migration specialist against it, verify:
  - All 3 skills produce valid AA `agents/<id>/` directories
  - Unknown permissions are surfaced, not silently dropped
  - `registry/agents.json` is updated correctly
  - Running `node scripts/generate-agents.js` afterwards produces valid `.claude/agents/<id>.md` files

## Definition of done

- [ ] Fresh starter install → `/starter migrate my OpenClaw skills` triggers a working conversational flow
- [ ] Synthetic OpenClaw skills produce valid AA agents on disk
- [ ] Unknown permissions generate a visible report, not silent drops
- [ ] `README.md` surfaces the migration option
- [ ] Nick's friend runs it against his real skills and reports what worked / what didn't

## Open questions before the build

1. **Output location for the specialist.** Inside `starter-seed/agents/migration-openclaw/` so it ships in every starter — confirmed. Do we also add it to the main repo's `agents/` so you can test it in your own workspace? Probably yes (same pattern as the other starter-seed agents, but they currently only live in starter-seed/).

2. **Naming.** `migration-openclaw` or `openclaw-importer` or something else? Current favorite: `migration-openclaw` (reads "migration (of) OpenClaw" in the agent list).

3. **Inline conversion vs. script.** Do we trust the model to do the frontmatter+body mapping well enough inline, or do we build the deterministic parser first and have the specialist call it? Leaning inline-first for v1, add the parser only if quality drifts.

4. **Your friend as QA.** Want me to draft a short note you can text him inviting him to be the first real migration test?
