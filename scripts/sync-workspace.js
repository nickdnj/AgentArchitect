#!/usr/bin/env node
/**
 * Refresh a spawned repo's generated surface (.claude/agents, .claude/skills,
 * CLAUDE.md routing block, manifest provenance) from AgentArchitect.
 * Idempotent: re-running with no AA changes is a no-op diff.
 * See docs/factory-model.md.
 */
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');
const { syncRepo, loadRegistry, registerRepo, AA_ROOT } = require('./lib/provision.js');

const HELP = `Usage: node scripts/sync-workspace.js <path>
       node scripts/sync-workspace.js --all

Options:
  <path>   Sync one provisioned repo (must contain .agentarchitect.json)
  --all    Sync every repo in registry/workspaces.json (prunes missing paths with a warning)
  --help   Show this help
`;

function syncOne(p) {
  const result = syncRepo(p);
  console.log(`  [OK] ${result.path} — agents: ${result.agents}, orchestrators: ${result.teams}${result.routingChanged ? ', routing block updated' : ''}`);
  for (const e of [...result.agentErrors, ...result.teamErrors]) {
    console.warn(`       [WARN] ${e.agentId || e.teamId}: ${e.error}`);
  }
  return result;
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    console.log(HELP);
    process.exit(args.length === 0 ? 1 : 0);
  }

  if (args[0] === '--all') {
    const reg = loadRegistry();
    if (reg.workspaces.length === 0) {
      console.log('No spawned repos in registry/workspaces.json yet.');
      return;
    }
    console.log(`Syncing ${reg.workspaces.length} spawned repo(s)...`);
    for (const entry of reg.workspaces) {
      if (!fs.existsSync(entry.path)) {
        console.warn(`  [MISSING] ${entry.path} — repo not on disk; remove its entry from registry/workspaces.json if it was deleted intentionally`);
        continue;
      }
      try {
        syncOne(entry.path);
        const aaCommit = execSync('git rev-parse HEAD', { cwd: AA_ROOT, encoding: 'utf-8' }).trim();
        registerRepo({ ...entry, aaCommit, syncedAt: new Date().toISOString().slice(0, 10) });
      } catch (e) {
        console.error(`  [ERROR] ${entry.path}: ${e.message}`);
      }
    }
    return;
  }

  syncOne(args[0]);
}

main();
