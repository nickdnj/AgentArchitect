# Project: Agent Architect Starter Kit

**Status:** SHIPPED 2026-04-17 — wiki migration 2026-05-14
**Opened:** 2026-04-17
**Owner:** Nick + Archie
**Approach:** Option B — build-starter script inside this repo

## Decisions made (2026-04-17)

- **License:** MIT (shipped as `LICENSE` at repo root)
- **Sample team:** Three agents in one team, not hello-world. Setup Concierge (first-run MCP onboarding), Researcher (web research), Writer (turns research into polished prose). Demonstrates real capability on day one plus specialist-to-specialist delegation.
- **MCP credential story:** The Setup Concierge handles it interactively — walks user through Google Cloud project, OAuth consent, credentials download, MCP config, and test query. Starter ships with no credentials (as expected); user gets guided through installing their first MCP from inside the starter itself.

## Wiki migration (2026-05-14)

The upstream repo migrated to a Karpathy-style wiki knowledge layer (Phases 1-4 LIVE per [Wiki Knowledge Base Migration](../../wiki/projects/wiki-knowledge-base/_index.md) — replaces the old `context_buckets` + `MEMORY.md` pattern). The starter was on the OLD architecture and is now migrated:

- **Wiki seed shipped at `starter-seed/wiki/`** — Home.md, CLAUDE.md (conventions), README.md, `_templates/` (page/person/team/daily), `spine/preferences/seven-habits-of-effective-agents.md` (universal philosophy, every agent loads it), placeholders for `spine/network`, `spine/infrastructure`, `teams/starter/_team.md`, `projects/`, `raw/`, `_changelog/`, `_lint/`, `_sessions/`.
- **Wiki Ingest seed agent added** — `starter-seed/agents/wiki-ingest/` with the three operations (ingest, query-as-write, lint), changelog audit trail, 10-session sharpen-the-saw audit. Sanitized version of the upstream agent (no Nick/Wharfside specifics).
- **All four starter agents migrated to `wiki_access` schema** — setup-concierge, researcher, writer, migration-openclaw. Each one's `always_load` inlines the seven-habits page at generation time.
- **STARTER_CLAUDE_MD rewritten** with a wiki-first preamble + wiki routing + `WIKI_REPO` env-var instructions.
- **STARTER_README + setup.sh updated** — `export WIKI_REPO="$(pwd)/wiki"` is now step 1 of the quickstart.
- **EMPTY_AGENTS_JSON / EMPTY_TEAMS_JSON / team.json** all updated for 5-agent roster (added `wiki-ingest`, also fixed a prior gap where `migration-openclaw` wasn't in the registry).
- **Coexistence:** `context-buckets/` still copied as an optional RAG/FTS layer per the upstream design — the wiki is for curated stable knowledge, RAG buckets are for ephemeral working memory.

## What shipped (post-migration)

- `LICENSE` — MIT, copyright 2026 Nick DeMarco
- `starter-seed/` — source files for the starter
  - `agents/setup-concierge/` (SKILL teaches wiki bootstrap + MCP setup; `wiki_access` config)
  - `agents/researcher/` (`wiki_access` config)
  - `agents/writer/` (`wiki_access` config)
  - `agents/wiki-ingest/` (NEW — sole writer to the wiki)
  - `agents/migration-openclaw/` (`wiki_access` config)
  - `teams/starter-team/team.json` (5-agent roster, wiki routing keywords added)
  - `wiki/` (NEW — full seed of the knowledge layer)
- `scripts/build-starter.js` — the generator (now ~470 lines)
  - Phase 1: copies allowlisted boilerplate (Architect, templates, scripts, MCP scaffolding, docs)
  - Phase 2: seeds from `starter-seed/` into `agents/`, `teams/`, **and `wiki/`**
  - Phase 3: writes generated files (README.md, CLAUDE.md with wiki-first preamble, setup.sh with WIKI_REPO export, empty registries, mcp-servers/SETUP.md)
  - Phase 4: creates empty output dirs
  - Phase 5: leak scanner

## Tested end to end

```bash
node scripts/build-starter.js --output /tmp/aa-starter-wiki-test
cd /tmp/aa-starter-wiki-test
export WIKI_REPO="$(pwd)/wiki"
node scripts/generate-agents.js
# → 5 agents generated, 1 orchestrator (/starter) generated, scanner clean
# → wiki/ seeded with Home + CLAUDE + templates + seven-habits
```

## Usage

```bash
node scripts/build-starter.js --output ~/my-agent-architect
cd ~/my-agent-architect
./setup.sh
export WIKI_REPO="$(pwd)/wiki"   # also printed by setup.sh
claude .
# then: /starter help me get set up
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
