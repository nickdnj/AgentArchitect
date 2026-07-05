#!/usr/bin/env node
/**
 * Provision a standing workspace repo for a team.
 * See docs/factory-model.md.
 */
const { provisionWorkspace, handoff } = require('./lib/provision.js');

const HELP = `Usage: node scripts/new-workspace.js --team <team-id> [--path <dir>] [--no-commit]

Provisions a standalone git repo where the team does its ongoing work.
Default path: ~/Workspaces/<team skill alias>.

Options:
  --team <id>    Team id from teams/ (e.g. wharfside-board-assistant)  [required]
  --path <dir>   Target directory (default ~/Workspaces/<alias>)
  --no-commit    Skip the scaffold git commit in the new repo
  --help         Show this help
`;

function main() {
  const args = process.argv.slice(2);
  const opts = { teamId: null, targetPath: null, noCommit: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--team') opts.teamId = args[++i];
    else if (args[i] === '--path') opts.targetPath = args[++i];
    else if (args[i] === '--no-commit') opts.noCommit = true;
    else if (args[i] === '--help' || args[i] === '-h') { console.log(HELP); process.exit(0); }
    else { console.error(`Unknown argument: ${args[i]}\n\n${HELP}`); process.exit(1); }
  }
  if (!opts.teamId) { console.error(`--team is required\n\n${HELP}`); process.exit(1); }

  const { dest, teamConfig, sync } = provisionWorkspace(opts);
  console.log(`Provisioned workspace for ${teamConfig.name}`);
  console.log(`  agents synced: ${sync.agents}, orchestrator skills: ${sync.teams}`);
  for (const e of [...sync.agentErrors, ...sync.teamErrors]) {
    console.warn(`  [WARN] ${e.agentId || e.teamId}: ${e.error}`);
  }
  console.log('');
  console.log(handoff(dest));
}

main();
