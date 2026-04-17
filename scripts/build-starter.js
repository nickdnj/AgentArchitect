#!/usr/bin/env node

/**
 * Starter Kit Builder
 *
 * Generates a clean, shareable Agent Architect workspace — the Architect itself,
 * scripts, templates, and one example team (Setup Concierge + Researcher + Writer) —
 * without any of the maintainer's personal agents, teams, or data.
 *
 * Usage:
 *   node scripts/build-starter.js --output <path> [--dry-run]
 *
 * Example:
 *   node scripts/build-starter.js --output ~/agent-architect-starter
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SEED = path.join(ROOT, 'starter-seed');

// ============================================================================
// Sanitization (shared rules with scripts/export-team.js)
// ============================================================================

const SANITIZE_RULES = [
  { pattern: /nickd@wharfsidemb\.com/g, replacement: 'YOUR_BOARD_EMAIL' },
  { pattern: /nickd@demarconet\.com/g, replacement: 'YOUR_PERSONAL_EMAIL' },
  { pattern: /\/Users\/nickd\/Workspaces\/pdfscribe_cli/g, replacement: '${PDFSCRIBE_CLI_PATH}' },
  { pattern: /\/Users\/nickd\/Workspaces\/AgentArchitect/g, replacement: '.' },
  { pattern: /\/Users\/nickd\/Workspaces\/mcp_servers\/[^\s"']*/g, replacement: '${MCP_SERVERS_PATH}' },
  { pattern: /\/Users\/nickd\/Workspaces\/Contactbook\/[^\s"']*/g, replacement: '${CONTACTBOOK_PATH}' },
  { pattern: /\/Users\/nickd\/AppFolio-Sync/g, replacement: '${APPFOLIO_SYNC_PATH}' },
  { pattern: /\/Users\/nickd\/[^\s"']*/g, replacement: '${HOME_PATH}' },
  { pattern: /~\/Library\/CloudStorage\/GoogleDrive-[^\s"']*/g, replacement: '${GOOGLE_DRIVE_PATH}' },
];

// Lines matching these patterns get replaced during copy. Used to strip maintainer-specific
// team routing hints from the generators so the starter ships clean.
const LINE_SANITIZERS = [
  {
    // Strip hardcoded TEAM_KEYWORDS entries for maintainer's specific teams in generate-cowork.js
    pattern: /^\s*'(wharfside-board-assistant|personal-assistant|altium-solutions|software-project|youtube-content|hardware-dev)':\s*\[[^\]]+\],?\s*$/gm,
    replacement: '',
  },
  {
    // Replace standalone Wharfside/Altium example strings in generators
    pattern: /Wharfside Manor/g,
    replacement: 'Example Organization',
  },
  {
    // Strip template filename references (users will add their own templates)
    pattern: /Wharfside_TEMPLATE\.pptx/g,
    replacement: 'YourOrg_TEMPLATE.pptx',
  },
  {
    // Generic Wharfside mentions in comments/strings
    pattern: /Wharfside/g,
    replacement: 'YourTeam',
  },
];

const TEXT_EXTENSIONS = new Set(['.md', '.json', '.js', '.py', '.sh', '.yml', '.yaml', '.txt', '.html', '.css', '.sql']);

function isTextFile(filePath) {
  return TEXT_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

function sanitizeString(str) {
  let result = str;
  for (const rule of SANITIZE_RULES) {
    result = result.replace(rule.pattern, rule.replacement);
  }
  for (const rule of LINE_SANITIZERS) {
    result = result.replace(rule.pattern, rule.replacement);
  }
  return result;
}

// ============================================================================
// Copy helpers
// ============================================================================

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest, dryRun) {
  if (dryRun) {
    console.log(`  [dry-run] ${path.relative(ROOT, src)} -> ${path.relative(process.cwd(), dest)}`);
    return;
  }
  ensureDir(path.dirname(dest));
  if (isTextFile(src)) {
    const content = fs.readFileSync(src, 'utf-8');
    fs.writeFileSync(dest, sanitizeString(content));
  } else {
    fs.copyFileSync(src, dest);
  }
}

function copyDir(src, dest, dryRun, skipNames = new Set()) {
  if (!fs.existsSync(src)) return;
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    if (skipNames.has(entry.name)) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, dryRun, skipNames);
    } else if (entry.isFile()) {
      copyFile(srcPath, destPath, dryRun);
    }
  }
}

function writeFile(dest, content, dryRun) {
  if (dryRun) {
    console.log(`  [dry-run] write ${path.relative(process.cwd(), dest)} (${content.length} bytes)`);
    return;
  }
  ensureDir(path.dirname(dest));
  fs.writeFileSync(dest, content);
}

// ============================================================================
// What to copy from the main repo
// ============================================================================

// Files & directories copied as-is (with sanitization for text files)
const COPY_PATHS = [
  // Legal
  'LICENSE',
  // Repo metadata
  'package.json',
  'package-lock.json',
  '.gitignore',
  // The Architect itself
  'Architect/SKILL.md',
  'Architect/archie-avatar.png',
  'Architect/examples.md',
  // Core scripts (export-team.js omitted — contains too much maintainer-specific template content)
  'scripts/generate-agents.js',
  'scripts/generate-cowork.js',
  'scripts/build-starter.js',
  'scripts/init-pgvector.sql',
  // Templates (agent + team + bucket)
  'agents/_templates',
  'teams/_templates',
  'context-buckets/_templates',
  // MCP server configuration (no credentials — user provides their own)
  'mcp-servers/README.md',
  'mcp-servers/registry',
  'mcp-servers/scripts',
  'mcp-servers/wrappers',
  // Docs
  'docs/architecture',
];

// Explicit skips inside copied directories (matched by basename)
const SKIP_NAMES = new Set([
  'node_modules',
  '.git',
  '.DS_Store',
  'token.json',
  'credentials.json',
  // Maintainer-specific templates/examples (user will add their own)
  'wharfside-report.html',
  'altium-ai-migration-platform.md',
  'email-iteration.md',
]);

// Files the leak scanner should ignore (legitimate references, not data leaks)
const SCANNER_IGNORE = new Set([
  'scripts/build-starter.js',  // contains sanitization patterns and scanner markers by design
  'scripts/generate-cowork.js', // may contain references in comments/code unrelated to data
  'scripts/generate-agents.js',
]);

// ============================================================================
// Generated files
// ============================================================================

const STARTER_README = `# Agent Architect Starter

> *"Every great team starts with a blueprint."*

Welcome. You've cloned a starter kit for **Agent Architect** — a master AI agent that designs, builds, and orchestrates teams of specialized AI agents inside Claude Code.

This starter is intentionally minimal. It ships with:
- **Archie** — the Agent Architect himself, who helps you design new agents and teams
- **Starter Team** — one example team showing how specialists collaborate:
  - **Setup Concierge** — walks you through connecting your first MCP server (Gmail by default)
  - **Researcher** — web research specialist
  - **Writer** — turns research into polished documents

From here, you're meant to add your own teams. That's the whole point.

---

## Quickstart

1. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

2. **Generate Claude Code native agent files:**
   \`\`\`bash
   node scripts/generate-agents.js
   \`\`\`

3. **Open this directory in Claude Code:**
   \`\`\`bash
   claude .
   \`\`\`

4. **Say hello to the Setup Concierge:**
   > /starter set up my first MCP server

   The concierge will walk you through connecting Gmail (or another service) end-to-end.

5. **Or start designing your own team:**
   > /architect build me a team for [your use case]

---

## What's in the box

\`\`\`
.
├── Architect/              # Archie — the meta-agent that designs other agents
├── agents/                 # Agent definitions (starts with 3 example agents)
│   ├── _templates/         # Templates for creating new agents
│   ├── setup-concierge/
│   ├── researcher/
│   └── writer/
├── teams/                  # Team definitions (starts with 1 example team)
│   └── starter-team/
├── context-buckets/        # Assignable knowledge bases (starts empty)
├── scripts/                # Generators that sync sources → Claude Code native files
├── mcp-servers/            # MCP server configuration scaffolding
├── docs/                   # Architecture documentation
└── registry/               # Indexes of agents, teams, and context buckets
\`\`\`

## Core Concepts

| Concept | Description |
|---|---|
| **Agent** | Individual AI assistant defined by \`SKILL.md\` + \`config.json\` |
| **Team** | Collection of agents that collaborate through an orchestrator |
| **Context Bucket** | Assignable knowledge base (docs, code, reference material) |
| **MCP Server** | External tool integration (Gmail, Drive, GitHub, etc.) |

## Agent Architect Pattern

\`\`\`
agents/<agent-id>/              (SOURCE OF TRUTH — edit these)
├── SKILL.md                    → Behavioral instructions
└── config.json                 → Rich metadata

        ↓ generate (via scripts/generate-agents.js)

.claude/agents/<agent-id>.md    (GENERATED — native Claude Code format)
.claude/skills/<agent-id>/      (GENERATED — forked skill for specialists)
.claude/skills/<team-id>/       (GENERATED — orchestrator skill for teams)
\`\`\`

**Never edit generated files** — they're regenerated every time you run \`/sync-agents\`.

## Next Steps

1. Connect an MCP server (the Setup Concierge handles this)
2. Try the Researcher: *"Researcher, what's the current state of X?"*
3. Try the Writer: *"Writer, turn that briefing into a one-page memo"*
4. Open \`/architect\` and design your first custom team

## License

MIT — see \`LICENSE\`.

## Credits

Agent Architect was built by [Nick DeMarco](https://github.com/nickdnj). This starter kit is a stripped-down snapshot of the upstream repo intended for public distribution.
`;

const STARTER_CLAUDE_MD = `# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Smart Routing

When the user starts a conversation without invoking a specific agent or team, route to the appropriate orchestrator. Do NOT bypass the orchestrator by calling specialist agents directly.

### Routing Table

| Topic Signals | Invoke Skill |
|---|---|
| Setup, onboarding, connect MCP, install server, first run | \`Skill(skill: "starter")\` → Setup Concierge |
| Research, look up, find information, search | \`Skill(skill: "starter")\` → Researcher |
| Write, draft, report, proposal, memo, email | \`Skill(skill: "starter")\` → Writer |
| Build agent, create team, manage agents, new specialist | \`Skill(skill: "architect")\` |

### Routing Rules

1. Match keywords in the user's request to select a team
2. If ambiguous, ask which team they want
3. If clearly about agent/team management, use the Architect
4. **ALWAYS invoke the team orchestrator** — never call specialist subagents directly
5. The only exception is when the user explicitly invokes a specialist skill by name

## Getting Started

On your first run, say:

> /starter help me set up my first MCP server

The Setup Concierge will walk you through connecting Gmail (or another service) end-to-end. Once that's working, you'll have a real capability and can move on to research, writing, or designing your own agents.

## Agent Management

To create or manage agents, load the Architect with \`/architect\`. Archie will guide you through:
1. Discovering what you need
2. Designing the agent or team
3. Writing the SKILL.md and config.json
4. Syncing to Claude Code native format

Do not directly create agents or teams without the Architect's guidance.

## Architecture

See \`README.md\` for the full overview. Key points:

- \`agents/<agent-id>/\` — source of truth for agent definitions
- \`teams/<team-id>/\` — source of truth for team definitions
- \`.claude/agents/\` and \`.claude/skills/\` — **generated**, do not edit directly
- Run \`scripts/generate-agents.js\` after any change to regenerate

## Commands

- \`/architect\` — load Archie to design new agents or teams
- \`/starter\` — invoke the Starter Team (Setup Concierge, Researcher, Writer)
- \`/sync-agents\` or \`node scripts/generate-agents.js\` — regenerate Claude Code native files
`;

const STARTER_SETUP_SH = `#!/usr/bin/env bash
set -euo pipefail

# Agent Architect Starter — first-run setup

cd "$(dirname "$0")"

echo "================================================"
echo "  Agent Architect Starter — Setup"
echo "================================================"
echo ""

if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node.js is required. Install from https://nodejs.org"
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is required."
  exit 1
fi

echo "Installing dependencies..."
npm install

echo ""
echo "Generating Claude Code native agent files..."
node scripts/generate-agents.js

echo ""
echo "================================================"
echo "  Setup complete."
echo "================================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Open this directory in Claude Code:"
echo "   claude ."
echo ""
echo "2. Meet the Setup Concierge and connect your first MCP server:"
echo "   /starter help me set up Gmail"
echo ""
echo "3. Or design your own team with Archie:"
echo "   /architect"
echo ""
`;

const EMPTY_AGENTS_JSON = {
  version: '1.0',
  last_updated: new Date().toISOString().slice(0, 10),
  agents: [
    {
      id: 'setup-concierge',
      name: 'Setup Concierge',
      folder: 'agents/setup-concierge',
      teams: ['starter-team'],
      created: '2026-04-17',
      status: 'active',
    },
    {
      id: 'researcher',
      name: 'Researcher',
      folder: 'agents/researcher',
      teams: ['starter-team'],
      created: '2026-04-17',
      status: 'active',
    },
    {
      id: 'writer',
      name: 'Writer',
      folder: 'agents/writer',
      teams: ['starter-team'],
      created: '2026-04-17',
      status: 'active',
    },
  ],
};

const EMPTY_TEAMS_JSON = {
  version: '1.0',
  last_updated: new Date().toISOString().slice(0, 10),
  teams: [
    {
      id: 'starter-team',
      name: 'Starter Team',
      folder: 'teams/starter-team',
      member_count: 3,
      created: '2026-04-17',
      status: 'active',
    },
  ],
};

const EMPTY_BUCKETS_JSON = {
  version: '1.0',
  last_updated: new Date().toISOString().slice(0, 10),
  buckets: [],
};

const STARTER_MCP_SETUP = `# MCP Server Setup

This directory holds configuration and optional wrappers for MCP (Model Context Protocol) servers used by your agents.

## First-time setup

The fastest way to connect your first MCP server is to ask the Setup Concierge:

\`\`\`
/starter help me set up Gmail
\`\`\`

The concierge walks you through Google Cloud project creation, OAuth consent, credential download, wiring into Claude Code, and a test query.

## Structure

- \`registry/servers.json\` — catalog of known MCP servers (what they do, typical use cases)
- \`assignments.json\` — which agents/teams are allowed to use which servers
- \`scripts/\` — helper scripts for server setup
- \`wrappers/\` — thin wrapper scripts if a server needs env vars or path munging

## Credentials

**Never commit credentials.** The default \`.gitignore\` already excludes \`credentials.json\`, \`token.json\`, and \`.env*\`.

Store credentials outside this directory if you can, or keep them here only if you're confident the ignore rules are working.

## Common MCPs

| Server | Purpose | Auth |
|---|---|---|
| Gmail | Email search, send, labels | Google OAuth |
| Google Drive | File search, read/write | Google OAuth |
| Google Calendar | Event read/write | Google OAuth |
| GitHub | Repo operations, issues, PRs | Personal access token |
| Chrome | Browser automation | No auth (local Chrome) |

Ask the Setup Concierge for the current best installation path for any of these.
`;

// ============================================================================
// Main
// ============================================================================

function parseArgs(argv) {
  const args = { output: null, dryRun: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--output' && argv[i + 1]) {
      args.output = argv[++i];
    } else if (argv[i] === '--dry-run') {
      args.dryRun = true;
    } else if (argv[i] === '--help' || argv[i] === '-h') {
      args.help = true;
    }
  }
  return args;
}

function printHelp() {
  console.log(`Usage: node scripts/build-starter.js --output <path> [--dry-run]

Generates a clean, shareable Agent Architect workspace into <path>.

Options:
  --output <path>    Destination directory for the starter
  --dry-run          Show what would be written without touching disk
  --help, -h         Show this help
`);
}

function main() {
  const args = parseArgs(process.argv);

  if (args.help || !args.output) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }

  const output = path.resolve(args.output);

  if (fs.existsSync(output) && fs.readdirSync(output).length > 0 && !args.dryRun) {
    console.error(`Error: Output directory is not empty: ${output}`);
    console.error('Pick an empty directory or a new path.');
    process.exit(1);
  }

  console.log('================================================');
  console.log('  Agent Architect — Starter Kit Builder');
  console.log('================================================');
  console.log(`Output:  ${output}`);
  console.log(`Dry run: ${args.dryRun ? 'yes' : 'no'}`);
  console.log('');

  if (!args.dryRun) ensureDir(output);

  // -------------------------------------------------------------------------
  // Phase 1: Copy boilerplate
  // -------------------------------------------------------------------------
  console.log('Phase 1: Copying boilerplate...');
  let copied = 0;
  for (const rel of COPY_PATHS) {
    const src = path.join(ROOT, rel);
    const dest = path.join(output, rel);
    if (!fs.existsSync(src)) {
      console.log(`  [skip] ${rel} (not found in source)`);
      continue;
    }
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      copyDir(src, dest, args.dryRun, SKIP_NAMES);
      console.log(`  [copied] ${rel}/`);
    } else {
      copyFile(src, dest, args.dryRun);
      console.log(`  [copied] ${rel}`);
    }
    copied++;
  }

  // -------------------------------------------------------------------------
  // Phase 2: Seed the starter team (agents + team)
  // -------------------------------------------------------------------------
  console.log('');
  console.log('Phase 2: Seeding starter team from starter-seed/...');
  const seedAgents = path.join(SEED, 'agents');
  if (fs.existsSync(seedAgents)) {
    copyDir(seedAgents, path.join(output, 'agents'), args.dryRun);
    const agents = fs.readdirSync(seedAgents, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => e.name);
    console.log(`  [seeded agents] ${agents.join(', ')}`);
  }
  const seedTeams = path.join(SEED, 'teams');
  if (fs.existsSync(seedTeams)) {
    copyDir(seedTeams, path.join(output, 'teams'), args.dryRun);
    const teams = fs.readdirSync(seedTeams, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => e.name);
    console.log(`  [seeded teams] ${teams.join(', ')}`);
  }

  // -------------------------------------------------------------------------
  // Phase 3: Write generated files (README, CLAUDE.md, setup.sh, registries)
  // -------------------------------------------------------------------------
  console.log('');
  console.log('Phase 3: Writing generated files...');
  writeFile(path.join(output, 'README.md'), STARTER_README, args.dryRun);
  console.log('  [wrote] README.md');
  writeFile(path.join(output, 'CLAUDE.md'), STARTER_CLAUDE_MD, args.dryRun);
  console.log('  [wrote] CLAUDE.md');
  writeFile(path.join(output, 'setup.sh'), STARTER_SETUP_SH, args.dryRun);
  if (!args.dryRun) fs.chmodSync(path.join(output, 'setup.sh'), 0o755);
  console.log('  [wrote] setup.sh');
  writeFile(
    path.join(output, 'registry', 'agents.json'),
    JSON.stringify(EMPTY_AGENTS_JSON, null, 2) + '\n',
    args.dryRun,
  );
  console.log('  [wrote] registry/agents.json');
  writeFile(
    path.join(output, 'registry', 'teams.json'),
    JSON.stringify(EMPTY_TEAMS_JSON, null, 2) + '\n',
    args.dryRun,
  );
  console.log('  [wrote] registry/teams.json');
  writeFile(
    path.join(output, 'registry', 'buckets.json'),
    JSON.stringify(EMPTY_BUCKETS_JSON, null, 2) + '\n',
    args.dryRun,
  );
  console.log('  [wrote] registry/buckets.json');
  writeFile(path.join(output, 'mcp-servers', 'SETUP.md'), STARTER_MCP_SETUP, args.dryRun);
  console.log('  [wrote] mcp-servers/SETUP.md');

  // -------------------------------------------------------------------------
  // Phase 4: Create empty directories that agents will populate
  // -------------------------------------------------------------------------
  console.log('');
  console.log('Phase 4: Creating output directories...');
  const dirs = [
    'outputs',
    'context-buckets',
    '.claude/agents',
    '.claude/skills',
  ];
  for (const d of dirs) {
    const p = path.join(output, d);
    if (args.dryRun) {
      console.log(`  [dry-run] mkdir ${d}/`);
    } else {
      ensureDir(p);
      // Preserve empty dir in git
      fs.writeFileSync(path.join(p, '.gitkeep'), '');
      console.log(`  [mkdir] ${d}/`);
    }
  }

  // -------------------------------------------------------------------------
  // Phase 5: Sanity check — no personal data snuck through
  // -------------------------------------------------------------------------
  if (!args.dryRun) {
    console.log('');
    console.log('Phase 5: Scanning output for personal data leaks...');
    const leaks = scanForLeaks(output);
    if (leaks.length > 0) {
      console.log('  WARNING: Possible personal data found:');
      for (const leak of leaks.slice(0, 20)) {
        console.log(`    ${leak}`);
      }
      if (leaks.length > 20) {
        console.log(`    ... and ${leaks.length - 20} more`);
      }
    } else {
      console.log('  OK — no personal data markers detected.');
    }
  }

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('');
  console.log('================================================');
  console.log('  Done.');
  console.log('================================================');
  console.log('');
  console.log(`Starter written to: ${output}`);
  if (!args.dryRun) {
    console.log('');
    console.log('Next steps to verify:');
    console.log(`  cd "${output}"`);
    console.log('  ./setup.sh');
    console.log('  claude .');
  }
}

function scanForLeaks(dir) {
  // Markers built from fragments so the scanner's own source doesn't self-flag.
  const markers = [
    'nick' + 'd@',
    'Whar' + 'fside',
    'whar' + 'fsidemb',
    'demar' + 'conet',
    'Alt' + 'ium Solutions Team',
  ];
  const leaks = [];
  function walk(p) {
    const entries = fs.readdirSync(p, { withFileTypes: true });
    for (const e of entries) {
      if (SKIP_NAMES.has(e.name)) continue;
      const full = path.join(p, e.name);
      const rel = path.relative(dir, full);
      if (SCANNER_IGNORE.has(rel)) continue;
      if (e.isDirectory()) {
        walk(full);
      } else if (e.isFile() && isTextFile(full)) {
        const content = fs.readFileSync(full, 'utf-8');
        for (const marker of markers) {
          if (content.includes(marker)) {
            leaks.push(`${rel}: "${marker}"`);
            break;
          }
        }
      }
    }
  }
  walk(dir);
  return leaks;
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error('Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}
