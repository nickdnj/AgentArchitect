# The Factory Model

AgentArchitect (AA) is a **factory**: it builds and maintains agent/team definitions, and provisions standalone sibling repos where the actual work happens. No project or team work products live inside AA.

```
~/Workspaces/
├── AgentArchitect/          ← the factory (this repo)
│   ├── agents/              source of truth: SKILL.md + config.json
│   ├── teams/               team definitions (team.json) — no work products
│   ├── templates/           scaffolds for spawned repos
│   ├── scripts/             generation + provisioning + sync
│   ├── bin/aa               global launcher CLI
│   └── registry/            agents.json, teams.json, workspaces.json
│
├── wharfside/               ← workspace repo (team: wharfside-board-assistant)
├── altium/                  ← workspace repo (team: altium-solutions)
├── max/                     ← workspace repo (team: personal-assistant)
│
├── jersey-stack-ep1/        ← project repo (type: youtube, team: content-studio)
├── donkey-kong-infoage/     ← project repo (type: podcast, team: content-studio)
└── <any-new-deliverable>/   ← project repo (aa new <type> "<title>")
```

## Two kinds of spawned repo

| Kind | For | Lifetime | Examples |
|---|---|---|---|
| **workspace** | A team doing ongoing, account-backed work (email, research, board comms) | Permanent | wharfside, altium, max |
| **project** | One deliverable, owned by a producing team | Until shipped | a YouTube episode, a podcast episode, an app |

Project types and their default owning team:

| Type | Team | Scaffold |
|---|---|---|
| `youtube` | `content-studio` | `assets/`, `storyboard/`, `research/`, `output/`, `scripts/` |
| `podcast` | `content-studio` | `assets/audio/`, `publish/`, `research/`, `scripts/` |
| `software` | `software-project` | `docs/`, `src/`, `tests/` |

`content-studio` is **project-based**: it is summoned into each project repo and has no standing workspace dir. Only account-backed recurring teams get workspaces.

## Where do I start? (the front door)

**Default: start in a team workspace, not in AgentArchitect.** Open Claude in the team whose domain you're working in (`~/Workspaces/wharfside`, `max`, `content-studio`, `vcf`, `Altium`, `hardware-dev`) and just talk. When the conversation produces a distinct deliverable, the team spawns a project repo with `aa new` and hands you off. Come to AgentArchitect only to create a new team, change an agent, or make an architectural change.

The `aa` launcher works from **any** directory:

```bash
aa new youtube "Jersey Stack Ep2 — the 6502"   # → creates ~/Workspaces/jersey-stack-ep2-the-6502
aa new podcast "Concurrent 3280 story"
aa new software "Fob reader dashboard"
aa workspace wharfside-board-assistant          # → creates/refreshes a team workspace
aa adopt ~/Workspaces/stoveiq --teams software-project,hardware-dev --type software --name "StoveIQ"
aa list                                         # → everything the factory has spawned
aa sync --all                                   # → push latest agents/skills into every spawned repo
```

Every command ends by printing the handoff:

```
✔ Created ~/Workspaces/<slug>
▶ Next:  cd ~/Workspaces/<slug> && claude
```

The conversational route is equivalent: open Claude in AA and say "new YouTube video about X" — the Architect runs the same script and prints the same handoff.

**Install the launcher once:** `ln -s ~/Workspaces/AgentArchitect/bin/aa /usr/local/bin/aa` (or add `~/Workspaces/AgentArchitect/bin` to PATH).

## The sync relationship

AA is the single source of truth. Spawned repos hold **generated** copies:

```
AA agents/ + teams/  ──generate──▶  <repo>/.claude/agents/*.md
                                    <repo>/.claude/skills/*/SKILL.md
                                    <repo>/CLAUDE.md   (routing block between markers)
                                    <repo>/.mcp.json   (project-scoped servers only)
```

Never edit generated files in a spawned repo; edit the source in AA and re-run sync.

### Provenance manifest — `.agentarchitect.json`

Written into every spawned repo:

```json
{
  "provisionedFrom": "/Users/nickd/Workspaces/AgentArchitect",
  "kind": "workspace | project",
  "team": "wharfside-board-assistant",
  "teams": ["wharfside-board-assistant"],
  "projectType": "youtube | software | podcast | null",
  "agents": ["monthly-bulletin", "archivist", "..."],
  "skills": ["wharfside"],
  "mcp": ["openai-image"],
  "provisionedAt": "2026-07-05",
  "aaCommit": "<AA HEAD sha at provision/sync time>"
}
```

`agents` defaults to the team roster at provision time; edit the list to trim or extend what a repo receives, then re-run sync.

### Repos served by more than one team

Most repos have one owning team. A product that genuinely spans disciplines — an app plus firmware plus a PCB — has two, and the manifest's `teams` array is what carries that. Sync generates **one orchestrator skill per team** into the repo, so each discipline is invoked by its own name:

```json
{ "kind": "project", "projectType": "software",
  "team": "software-project",
  "teams": ["software-project", "hardware-dev"],
  "skills": ["software-project", "hardware-dev"] }
```

`team` remains the **primary** team (first in the array) and is what the registry and `aa list` key on; `teams` is authoritative for generation. Manifests written before this field existed still work — `team` is read as a one-element list.

The routing block in a multi-team repo's `CLAUDE.md` renders as a table of `Skill(...)` invocations, one row per team, generated from each `team.json` description. `~/Workspaces/stoveiq` is the reference example: `software-project` owns `app/` and `cloud/`, `hardware-dev` owns `firmware/` and `hardware/`.

### Adopting a repo the factory did not create

`aa adopt` brings an existing repo under management **in place**. It is deliberately more conservative than provisioning:

| | `aa new` / `aa workspace` | `aa adopt` |
|---|---|---|
| Scaffolds template dirs | yes | **no** |
| Overwrites `CLAUDE.md` | writes it fresh | **never** — injects the routing block ahead of the first `## ` section and appends the git rules, leaving existing prose byte-for-byte intact |
| `.gitignore` | written from template | AA ignore rules appended if absent |
| Touches git | `git init` + scaffold commit | **nothing is committed** |

Re-running is idempotent: blocks already present are detected and skipped. Use it for repos that predate the factory, or any repo built by hand that should now receive agents.

### Script contracts

All in `scripts/`, all support `--help`:

- **`new-workspace.js --team <id> [--path <dir>]`** — git-init the target (default `~/Workspaces/<skill_alias || id>`), render `templates/workspace/`, write the manifest from the team roster, run sync, register in `registry/workspaces.json`, commit the scaffold in the new repo.
- **`new-project.js --type <software|youtube|podcast> --name <title> [--team <id>] [--path <dir>]`** — same, from `templates/project/<type>/`, slugifying the title.
- **`adopt-repo.js <path> --teams <id[,id...]> [--type <type>] [--name <title>] [--kind project|workspace]`** — bring an existing repo under management without scaffolding, committing, or overwriting its `CLAUDE.md` prose. See "Adopting a repo the factory did not create" above.
- **`sync-workspace.js <path> [--all]`** — read the target's manifest, regenerate `.claude/agents` + `.claude/skills` via the shared generation module (`generateForExport`), refresh the routing block in its `CLAUDE.md` (between `<!-- AA:ROUTING:BEGIN -->` / `<!-- AA:ROUTING:END -->` markers — user content outside the markers is preserved), refresh `.mcp.json`, bump `aaCommit`. **Idempotent**: re-running with no AA changes is a no-op diff.

`bin/aa` is a thin dispatcher over these three plus `list`.

### MCP servers

Most MCPs (gmail, gmail-personal, gdrive, google-docs, chrome, gtasks, apple-mcp, pdfscribe, voicemode) are configured **globally** in `~/.claude.json` and follow the user into every repo — no per-repo config needed. Only AA-project-scoped servers must be replicated: `openai-image` and `video-editor` go into the `.mcp.json` of youtube/podcast repos. The manifest's `mcp` list records which project-scoped servers a repo gets.

### Registry — `registry/workspaces.json`

The factory records every repo it mints:

```json
{ "workspaces": [ { "kind": "project", "team": "content-studio", "projectType": "youtube",
    "path": "/Users/nickd/Workspaces/jersey-stack-ep1", "provisionedAt": "...", "aaCommit": "..." } ] }
```

Powers `aa list` and `aa sync --all`. If a repo is deleted from disk, `aa list` flags it; remove the entry manually or with `aa sync --all` (which prunes missing paths with a warning).

## Templates

`templates/workspace/` and `templates/project/<type>/`. Plain files with `{{TOKEN}}` replacement — no templating engine. Tokens: `{{TEAM_ID}}`, `{{TEAM_NAME}}`, `{{TEAM_SKILL}}`, `{{TEAM_SKILLS}}`, `{{TEAM_ROUTING}}`, `{{PROJECT_NAME}}`, `{{PROJECT_TYPE}}`, `{{SLUG}}`, `{{AA_PATH}}`, `{{TARGET_PATH}}`, `{{DATE}}`.

`{{TEAM_ROUTING}}` is generated rather than hand-written: it renders the "invoke this skill" prose from the owning teams' `team.json` descriptions — a sentence for one team, a table for several. Prefer it over hardcoding a team's specialties into template prose, which goes stale when a roster changes. Each template carries: `CLAUDE.md` (routing markers + Parallel-Agent Git Rules + cloud bootstrap pointer), `.gitignore`, `README.md`, dir skeleton with `.gitkeep`s.

## Migration notes (performed 2026-07)

- Workspaces provisioned for wharfside / altium / max; each team's `workspace/` content moved out of AA into the new repo (fresh commits there — most was untracked in AA anyway; `outputs/` was gitignored).
- `jersey-stack-ep1-transistor` extracted with `git subtree split` (tracked history preserved) into `~/Workspaces/jersey-stack-ep1`; the ~21 GB of untracked working assets were `mv`'d.
- `donkey-kong-infoage` (untracked in AA) moved into `~/Workspaces/donkey-kong-infoage` and committed fresh there.
- Remaining `teams/youtube-content/projects/*` migrate the same way, one command each: `node scripts/migrate-project.js --from teams/youtube-content/projects/<name> --type youtube` (wraps split + mv + provision).
- **Repo size:** subtree split preserves history but AA's old blobs remain in AA history. Reclaiming AA clone size would require `git filter-repo` — explicitly out of scope; do it later if AA's 1.8 GB `.git` becomes a problem.
- Teams `youtube-content` + `podcast-studio` merged into `content-studio` (union roster, orchestrator routes video vs podcast pipeline by project type). Old skill names alias to the new one.
