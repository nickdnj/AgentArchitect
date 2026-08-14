#!/usr/bin/env node
/**
 * Bring an existing repo — one that predates the factory, or was created by
 * hand — under AgentArchitect management.
 *
 * Unlike new-project.js this never scaffolds template directories, never
 * touches git, and never overwrites the repo's own CLAUDE.md prose. It writes
 * the provenance manifest, injects the factory-managed CLAUDE.md blocks
 * (routing + parallel-agent git rules), generates .claude/, and registers the
 * repo so `aa sync --all` keeps it current.
 *
 * See docs/factory-model.md.
 */
const { adoptRepo, PROJECT_TYPE_TEAMS } = require('./lib/provision.js');

const HELP = `Usage: node scripts/adopt-repo.js <path> --teams <id[,id...]> [--type <type>] [--name "<title>"] [--kind project|workspace]

Adopts an existing repo into the Factory Model in place.

Options:
  <path>            Repo directory to adopt                              [required]
  --teams <ids>     Comma-separated owning team ids. More than one is
                    allowed for repos that span disciplines — each team's
                    orchestrator skill is generated into the repo.        [required]
  --type <type>     Project type: ${Object.keys(PROJECT_TYPE_TEAMS).join(' | ')}
                    (required unless --kind workspace)
  --name <title>    Human-readable project name for the manifest
  --kind <kind>     project (default) | workspace
  --help            Show this help

Example — a connected product with app, firmware and PCB trees:
  node scripts/adopt-repo.js ~/Workspaces/stoveiq \\
    --teams software-project,hardware-dev --type software --name "StoveIQ"
`;

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    console.log(HELP);
    process.exit(args.length === 0 ? 1 : 0);
  }

  const opts = { repoPath: null, teamIds: null, projectType: null, projectName: null, kind: 'project' };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--teams') opts.teamIds = args[++i].split(',').map(s => s.trim()).filter(Boolean);
    else if (args[i] === '--type') opts.projectType = args[++i];
    else if (args[i] === '--name') opts.projectName = args[++i];
    else if (args[i] === '--kind') opts.kind = args[++i];
    else if (!opts.repoPath && !args[i].startsWith('--')) opts.repoPath = args[i];
    else { console.error(`Unknown argument: ${args[i]}\n\n${HELP}`); process.exit(1); }
  }
  if (!opts.repoPath) { console.error(`A repo path is required\n\n${HELP}`); process.exit(1); }
  if (!opts.teamIds) { console.error(`--teams is required\n\n${HELP}`); process.exit(1); }

  const { dest, teamConfigs, claudeMd, gitignoreUpdated, sync } = adoptRepo(opts);

  console.log(`Adopted ${dest}`);
  console.log(`  teams:        ${teamConfigs.map(t => t.name).join(', ')}`);
  console.log(`  agents:       ${sync.agents}`);
  console.log(`  orchestrators:${' '}${sync.teams} (${sync.portable.length} portable skills)`);
  console.log(`  CLAUDE.md:    ${claudeMd.created ? 'created from template' : [
    claudeMd.routingAdded ? 'routing block added' : 'routing block already present',
    claudeMd.gitRulesAdded ? 'git rules added' : 'git rules already present',
  ].join(', ')}`);
  console.log(`  .gitignore:   ${gitignoreUpdated ? 'AA ignore rules appended' : 'already covers generated files'}`);
  for (const e of [...sync.agentErrors, ...sync.teamErrors]) {
    console.warn(`  [WARN] ${e.agentId || e.teamId}: ${e.error}`);
  }
  console.log('');
  console.log('Nothing was committed. Review with `git status`, then commit the');
  console.log('factory files you want tracked.');
}

main();
