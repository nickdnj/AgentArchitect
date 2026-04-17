# Project: Agent Architect Starter Kit

**Status:** BUILT — shipped 2026-04-17
**Opened:** 2026-04-17
**Owner:** Nick + Archie
**Approach:** Option B — build-starter script inside this repo

## Decisions made (2026-04-17)

- **License:** MIT (shipped as `LICENSE` at repo root)
- **Sample team:** Three agents in one team, not hello-world. Setup Concierge (first-run MCP onboarding), Researcher (web research), Writer (turns research into polished prose). Demonstrates real capability on day one plus specialist-to-specialist delegation.
- **MCP credential story:** The Setup Concierge handles it interactively — walks user through Google Cloud project, OAuth consent, credentials download, MCP config, and test query. Starter ships with no credentials (as expected); user gets guided through installing their first MCP from inside the starter itself.

## What shipped

- `LICENSE` — MIT, copyright 2026 Nick DeMarco
- `starter-seed/` — source files for the starter's example team
  - `agents/setup-concierge/` (SKILL + config)
  - `agents/researcher/` (SKILL + config)
  - `agents/writer/` (SKILL + config)
  - `teams/starter-team/team.json` (orchestrator with 4.7 delegation note)
- `scripts/build-starter.js` — the generator (~450 lines)
  - Copies allowlisted boilerplate (Architect, templates, scripts, MCP scaffolding, docs)
  - Applies sanitization (emails, absolute paths, maintainer-specific team keywords)
  - Seeds from `starter-seed/` into `agents/` and `teams/`
  - Writes clean generated files: README.md, CLAUDE.md, setup.sh, empty registries, mcp-servers/SETUP.md
  - Runs a leak scanner and reports before finishing

## Tested end to end (2026-04-17)

```bash
node scripts/build-starter.js --output /tmp/aa-starter-test
cd /tmp/aa-starter-test
node scripts/generate-agents.js
# → 3 agents generated, 1 orchestrator (/starter) generated, scanner clean
```

Result: clean starter workspace that generates working Claude Code native agents from the seeded team.

## Usage

```bash
node scripts/build-starter.js --output ~/my-agent-architect
cd ~/my-agent-architect
./setup.sh
claude .
# then: /starter help me set up Gmail
```

## Future enhancements (v2)

- Package as `npx create-agent-architect <dir>` so users don't need to clone the full maintainer repo first
- Interactive wizard on first run: "What kinds of teams are you planning?"
- Recipe templates for common team archetypes (CRM, research team, coding team, personal assistant)
- Auto-publish to a separate `agent-architect-starter` GitHub repo on each main branch update

---

## Goal

Let anyone clone Agent Architect, run one command, and get a clean blank workspace — Archie, scripts, templates, docs, but none of Nick's teams, agents, or personal data. From there they can say "hi Archie, I want to build a team for..." and bootstrap their own teams.

## Why Option B

- **One repo to maintain.** No parallel "starter" mirror to keep in sync with the main repo.
- **Always current.** The starter is generated from the live repo at runtime, so it inherits every upgrade (like the 4.7 tuning work we just shipped).
- **Discoverable.** Someone who clones the full repo and wants to use it for their own purposes just runs the init command — no hunt for a separate starter repo.

## Deliverable

A new script: `scripts/build-starter.js`.

Invocation (one of):
```bash
node scripts/build-starter.js --output ~/my-agent-architect
# or via Archie:
architect starter init ~/my-agent-architect
```

## What the starter should contain

### Keep (boilerplate)
- `Architect/SKILL.md` + `Architect/archie-avatar.png`
- `scripts/` — all generator scripts (generate-agents, generate-cowork, export-team, build-starter itself)
- `agents/_templates/` — agent templates including the 4.7 operating notes
- `teams/_templates/` — team templates
- `context-buckets/_templates/` — bucket templates
- `mcp-servers/` — MCP server configuration directory (with a sample stub, no credentials)
- `docs/` — architecture and design docs
- `.claude/` directory with skeleton settings
- `CLAUDE.md` — generic routing rules (no Wharfside/Max-specific keywords)
- `README.md` — starter-focused, not Nick-specific
- `package.json`, `.gitignore`
- `registry/` — empty `agents.json`, `teams.json`, `buckets.json` with valid shape

### One example (seed)
- ONE tiny example agent (e.g., `hello-world` or `example-researcher`) so users see the file shape
- ONE example team referencing the example agent
- ONE example context bucket

### Strip completely
- All of Nick's agents (50 specialists)
- All of Nick's teams (6 orchestrators)
- All of Nick's context buckets (wharfside-docs, altium-playbook, personal-notes, etc.)
- Generated files (`.claude/agents/*.md`, `.claude/skills/*/SKILL.md`, `cowork/skills/*/SKILL.md`)
- All personal data: emails, paths, Google Drive folders, project-specific code
- Nick's memory directory — not in repo anyway
- Exports, outputs, reports, data dumps, PDFs, video assets, etc.

### Sanitize
- Re-use the sanitization rules from `scripts/export-team.js` (emails, absolute paths, etc.)
- Generic `CLAUDE.md` with placeholder routing table

## Starter README content

The starter's README should lead with:
1. What Agent Architect is, in 3 sentences
2. Quickstart: install deps, run `/architect`, say "build me a team for X"
3. A diagram of the source-of-truth → generated-file flow
4. Pointers to templates and docs

## Setup script inside the starter

Include a `setup.sh` (or equivalent) in the starter that:
1. Runs `npm install`
2. Creates the user's Claude Code `.claude/` directory if missing
3. Runs `/sync-agents` to materialize the one example team
4. Prints a welcome message: "Run /architect to start building"

## Nice-to-haves (v2)

- Package it as an `npx` command: `npx create-agent-architect my-workspace`
- Interactive wizard on first run: "What kinds of teams are you planning? (email assistant, research, coding, custom)"
- Pre-made recipe templates for common team archetypes

## Open questions

1. **License?** Current repo has no LICENSE file. Need one before public distribution — MIT or Apache 2.0 are the usual options.
2. **Sample team choice?** Pick something universally useful (e.g., a simple personal assistant with one research agent) vs. trivial hello-world.
3. **MCP server story?** Starter can't ship credentials. Options: (a) no MCP servers pre-wired, user adds their own; (b) stub configs with TODO markers; (c) include a `mcp-setup.md` guide for common servers (Gmail, Drive, GitHub).

## Definition of done

- [ ] `scripts/build-starter.js` produces a working directory
- [ ] A cold clone of the starter into a new directory and running the setup script gives a functional `/architect` command
- [ ] No personal data (grep for `nickd`, `Wharfside`, `Altium`, `demarconet` → zero hits)
- [ ] Starter README explains the lifecycle clearly
- [ ] Worked example: build a new team from the starter in under 10 minutes

## Related

- Existing `team export` is for sharing a finished team; starter is for sharing the empty workshop
- Future Managed Agents integration (`Architect/FUTURE_MANAGED_AGENTS.md`) is orthogonal — starter kit works regardless of runtime target
- 4.7 tuning work (`Architect/TUNING_4_7_PLAN.md`) is already baked into the Architect skill, so starter will inherit it
