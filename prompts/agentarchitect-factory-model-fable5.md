# Build Prompt — AgentArchitect "Factory Model" Refactor (for Fable 5)

> Paste this whole file as the opening message of a fresh Claude Code session running **Fable 5**, from inside `~/Workspaces/AgentArchitect`. It is a build-and-migrate task, not a design exercise — produce working scaffolding and perform the migration.

---

## Your role

You are refactoring **AgentArchitect** in place. Today AA is a monolith: it holds agent/team definitions AND all the actual work products (team outputs, YouTube projects with gigabytes of assets, podcast files, etc.) under one repo. You are turning AA into a **factory**: a pure *builder* that provisions and keeps-in-sync two kinds of standalone sibling repos.

Preserve git history where you can (use `git mv` for in-repo moves; `git subtree split` when extracting a subtree that has real history into its own repo). This is an **in-place refactor** of `~/Workspaces/AgentArchitect` — do not create an "AgentArchitect-v2" repo.

---

## The target model

### 1. AgentArchitect — the factory (stays at `~/Workspaces/AgentArchitect/`)

Keeps ONLY builder concerns:
- `agents/` — agent definitions (`SKILL.md` + `config.json`) — **source of truth**
- `teams/` — team **definitions** (`team.json`, orchestration/routing) — but NOT the work products anymore
- `context-buckets/`, `registry/`, `mcp-servers/`, `Architect/`, `scripts/`, `.claude/`, `cowork/`
- **NEW** `templates/` — scaffolding templates for spawned repos (see below)
- **NEW** provisioning + sync scripts under `scripts/`

Moves OUT (into sibling repos): every actual work product currently living under `teams/<team>/projects/*`, `teams/<team>/outputs/*`, and similar. After the refactor, cloning AA should be small and about *building agents*, not about hosting a YouTube video's raw footage.

### 2. Workspace repos — persistent team homes (siblings of AA)

One per team that does ongoing, account-backed work. Seed instances to create:
- `~/Workspaces/wharfside/` — board comms, bulletins, archivist, research (Gmail/GDrive/GDocs, wiki)
- `~/Workspaces/altium/` — sales/deployment/EDA specialist work, research, customer email
- `~/Workspaces/max/` — Nick's personal assistant: email triage, research cache, tasks, calendar

Each workspace repo contains:
- `.claude/agents/*.md` + `.claude/skills/*/SKILL.md` — the team's agents/skills, **generated from AA**
- `CLAUDE.md` — routing scoped to that team, plus the Parallel-Agent Git Rules and the Cloud/iOS bootstrap block (copy the patterns from AA's current `CLAUDE.md`)
- `.mcp.json` — only the MCP servers that team needs
- `outputs/`, `workspace/` — where the team's real work lands
- `.agentarchitect.json` — provenance manifest (schema below)
- Its own git repo, its own `.gitignore`

### 3. Project repos — per-deliverable (siblings of AA)

One per creative/build deliverable, owned by a producing team. Types: `software`, `youtube`, `podcast` (extensible). Examples:
- a YouTube episode → `~/Workspaces/<slug>/` scaffolded from the `youtube` project template, carrying the `content-studio` team's skills/agents
- a software app → `~/Workspaces/<slug>/` from the `software` template, carrying the `software-project` team
- a podcast episode → from the `podcast` template, also carrying `content-studio`

A project repo is a **proper git repo** that "knows all the tools AA provides" for its type: generated `.claude/` agents+skills, `CLAUDE.md` routing, `.mcp.json`, and type-specific starter structure (e.g. youtube: `assets/`, `storyboard/`, `scripts/`; software: app scaffold + `docs/`; podcast: `episodes/`, `audio/`).

**Owning-team mapping (defaults the `aa` CLI uses):**
- `youtube` → `content-studio`
- `podcast` → `content-studio`
- `software` → `software-project`

Note the first two share one team. See the team-consolidation deliverable below.

---

## The sync relationship (this is the core requirement)

AA stays the **single source of truth** for agent/skill/team definitions. Spawned repos receive *generated* copies and can refresh them. Implement this explicitly:

**Provenance manifest** `.agentarchitect.json` written into every spawned repo:
```json
{
  "provisionedFrom": "/Users/nickd/Workspaces/AgentArchitect",
  "kind": "workspace | project",
  "team": "wharfside",
  "projectType": "youtube | software | podcast | null",
  "agents": ["board-communications", "archivist", "monthly-bulletin"],
  "skills": ["wharfside"],
  "mcp": ["gmail", "gdrive", "google-docs"],
  "provisionedAt": "2026-07-05",
  "aaCommit": "<git sha of AA at provision time>"
}
```

**Provisioning scripts** in AA:
- `scripts/new-workspace.js --team <id> --path <dir>` — git init the target, render the workspace template, resolve the team's roster + MCP needs from `teams/<id>/team.json` and `registry/`, write the manifest, then run sync.
- `scripts/new-project.js --type <software|youtube|podcast> --team <id> --name <slug> --path <dir>` — git init, render the project template for that type, write the manifest, run sync.

**Sync script** in AA:
- `scripts/sync-workspace.js <path>` — reads the target's `.agentarchitect.json`, regenerates its `.claude/agents/*.md` + `.claude/skills/*/SKILL.md` from the listed agents/skills (reuse the existing generation logic behind `/sync-agents` and `generate-cowork.js` — do not duplicate it, factor out a shared module if needed), refreshes `.mcp.json` and the team routing block in its `CLAUDE.md`, and bumps `aaCommit`. Idempotent.

This is how tools "flow" from the factory to every spawned repo: AA → generate → sync into the repo. A user working in `~/Workspaces/wharfside/` gets the current Wharfside agents without ever touching AA internals.

---

## The entry point (solve the "where do I start?" problem)

There is a chicken-and-egg: to create a project repo you need the factory, but you are not "in" the project yet. Resolve it with **one front door and one launcher command** so the user never has to guess a directory.

**Mental model to encode in docs + CLAUDE.md:**
- **AgentArchitect = the front door / launcher.** You start anything new here (new project, new workspace, new/edited agent). No project work happens in AA.
- **Workspace dir = where a team lives** (recurring work).
- **Project dir = where a deliverable lives** (one video/app/episode).

**Build a global `aa` CLI** (a small Node bin in AA, symlinked onto PATH — document `npm link` or a `ln -s` install step). It works from any directory:
- `aa new <software|youtube|podcast> "<title>"` — thin wrapper over `new-project.js`. Slugifies the title, picks the default owning team for that type, creates `~/Workspaces/<slug>/`, syncs tools in, then **prints the exact handoff**:
  ```
  ✔ Created ~/Workspaces/<slug>
  ▶ Next:  cd ~/Workspaces/<slug> && claude
     Then say: "let's start"
  ```
- `aa workspace <team>` — wrapper over `new-workspace.js`, same handoff print.
- `aa list` — reads the spawned-repo registry and prints every workspace/project, its kind/team/type, and path.
- `aa sync [--all | <path>]` — refresh one repo, or push the latest generated agents/skills into every spawned repo at once.

**Also support the conversational route:** opening Claude in AA and saying "new YouTube video about X" should make the Architect run the same `new-project.js` and end with the identical `cd … && claude` handoff. Both routes call one shared code path — do not implement provisioning twice.

**Spawned-repo registry** `registry/workspaces.json` in AA — the factory records every repo it mints (kind, team, type, path, aaCommit, provisionedAt). This is what powers `aa list` and `aa sync --all`. Update it on every provision.

The end state the user asked for: *"I'm starting a new YouTube video today — where do I start?"* → run `aa new youtube "…"` from anywhere (or ask the Architect in AA), and it tells you the one `cd … && claude` command to begin. You then work entirely inside the self-contained project repo.

---

## Deliverables (build these)

1. `templates/workspace/` — CLAUDE.md template, `.mcp.json` template, `.gitignore`, `README.md`, empty `outputs/` + `workspace/`, manifest stub. Use a simple, obvious templating approach (token replacement is fine — no heavy deps).
2. `templates/project/software/`, `templates/project/youtube/`, `templates/project/podcast/` — type-specific scaffolds.
3. `scripts/new-workspace.js`, `scripts/new-project.js`, `scripts/sync-workspace.js` — working Node scripts, runnable, with `--help`.
4. The global **`aa` CLI** (`bin/aa`, wired for `npm link`/symlink install) exposing `aa new`, `aa workspace`, `aa list`, `aa sync` — thin wrappers over the scripts above, each printing the `cd … && claude` handoff. Plus `registry/workspaces.json` recording every spawned repo.
5. A shared generation module so provisioning/sync and the existing `/sync-agents` path don't drift.
6. **Team consolidation — merge `youtube-content` + `podcast-studio` into one `content-studio` team.** Both are content-production pipelines with the same shape (script → voice/assets → assemble/master → publish → distribute) and overlapping roles. Create `teams/content-studio/team.json` as the union of the two rosters (dedupe overlapping roles; keep both the video pipeline and the podcast pipeline as branches its orchestrator routes to based on the deliverable/project type). Update `registry/teams.json` and the generated skills; retire the two old team skills (leave a redirect/alias so `/youtube-content` and `/podcast-studio` still resolve to `content-studio`). This team is **project-based** (summoned per project repo) — it does NOT get a persistent workspace dir like Wharfside/Altium/Max.
7. **Migration, actually performed:**
   - Provision `~/Workspaces/wharfside/`, `~/Workspaces/altium/`, `~/Workspaces/max/` and move each team's existing work products out of AA into them. Where a subtree has real commit history worth keeping (e.g. a project folder), extract it with `git subtree split` before removing it from AA; otherwise `git mv`/copy.
   - Provision one real project repo per type as proof, starting with the flagship YouTube project `teams/youtube-content/projects/jersey-stack-ep1-transistor/` → `~/Workspaces/jersey-stack-ep1/` (preserve its history via subtree split). Stub a `software` and a `podcast` demo project so all three templates are exercised.
   - Leave a repeatable one-command path (documented) for migrating the remaining projects/teams later.
8. `docs/factory-model.md` — the architecture, the manifest schema, the `aa` CLI reference, and how to run each script. Update AA's root `CLAUDE.md` to describe the new factory model and the workspace/project split, replacing the parts that assumed work lived inside AA.

---

## Guardrails (do not skip)

- **Git safety (from AA's CLAUDE.md — CRITICAL):** Only stage files YOU changed with explicit `git add <paths>`. NEVER `git add -A`/`.`, `git reset --hard`, `git checkout .`, `git clean -fd`, `git stash`, or `--no-verify`. The working tree currently has many uncommitted changes and untracked dirs from other work — do not touch or sweep them up.
- Do this on a dedicated branch: `refactor/factory-model`. Because this is a big-bang restructure that moves shared files, it must NOT run concurrently with other agents — **before starting, tell the user to quiesce other agents / scheduled tasks and confirm.**
- Preserve history: prefer `git mv` for in-AA moves; `git subtree split` when extracting a folder into its own repo. Note in the docs that reclaiming AA repo *size* (blobs stay in history) would need `git filter-repo` and is explicitly out of scope.
- Keep everything runnable at each step. After migration, verify: (a) AA's `/sync-agents` still works, (b) each new workspace repo opens with correct `.claude/` + `CLAUDE.md` routing, (c) `sync-workspace.js` re-run is a no-op diff, (d) nothing in AA references moved paths (grep for the old `teams/*/projects/*` paths and fix or remove).
- Don't invent new team rosters — read `teams/<id>/team.json` and `registry/agents.json`/`teams.json` for who belongs where and which MCPs they need.
- Cloud/iOS: workspace/project `CLAUDE.md` files must carry the bootstrap + wiki-first patterns so the spawned repos work in cloud mode too, where applicable.

---

## How to proceed

1. Confirm branch + that other agents are quiesced.
2. Write `docs/factory-model.md` first (short — the layout, manifest, script contracts) so the target is explicit, then build against it. Commit it.
3. Build templates → scripts → shared generation module. Commit in logical chunks (only your files).
4. Run the migration (workspaces first, then the flagship YouTube project, then the two demo projects). Verify after each.
5. Update root `CLAUDE.md`. Final verification pass. Summarize what moved where and what's left for later migration.

Ask the user before anything destructive or ambiguous. Optimize for a clean, obvious, repeatable factory — not cleverness.
