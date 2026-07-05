#!/usr/bin/env node
/**
 * Provision a project repo for one deliverable (video, podcast, app).
 * See docs/factory-model.md.
 */
const { provisionProject, handoff, PROJECT_TYPE_TEAMS } = require('./lib/provision.js');

const HELP = `Usage: node scripts/new-project.js --type <type> --name "<title>" [--team <id>] [--path <dir>] [--no-commit]

Provisions a standalone git repo for one deliverable, scaffolded from
templates/project/<type>/ and carrying the owning team's agents/skills.

Types and default owning teams:
${Object.entries(PROJECT_TYPE_TEAMS).map(([t, team]) => `  ${t.padEnd(10)} → ${team}`).join('\n')}

Options:
  --type <type>    Project type: ${Object.keys(PROJECT_TYPE_TEAMS).join(' | ')}  [required]
  --name <title>   Human title; slugified for the directory name       [required]
  --team <id>      Override the owning team
  --path <dir>     Target directory (default ~/Workspaces/<slug>)
  --no-commit      Skip the scaffold git commit in the new repo
  --help           Show this help
`;

function main() {
  const args = process.argv.slice(2);
  const opts = { type: null, name: null, teamId: null, targetPath: null, noCommit: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--type') opts.type = args[++i];
    else if (args[i] === '--name') opts.name = args[++i];
    else if (args[i] === '--team') opts.teamId = args[++i];
    else if (args[i] === '--path') opts.targetPath = args[++i];
    else if (args[i] === '--no-commit') opts.noCommit = true;
    else if (args[i] === '--help' || args[i] === '-h') { console.log(HELP); process.exit(0); }
    else { console.error(`Unknown argument: ${args[i]}\n\n${HELP}`); process.exit(1); }
  }
  if (!opts.type || !opts.name) { console.error(`--type and --name are required\n\n${HELP}`); process.exit(1); }

  const { dest, teamConfig, sync } = provisionProject(opts);
  console.log(`Provisioned ${opts.type} project "${opts.name}" (team: ${teamConfig.name})`);
  console.log(`  agents synced: ${sync.agents}, orchestrator skills: ${sync.teams}`);
  for (const e of [...sync.agentErrors, ...sync.teamErrors]) {
    console.warn(`  [WARN] ${e.agentId || e.teamId}: ${e.error}`);
  }
  console.log('');
  console.log(handoff(dest));
}

main();
