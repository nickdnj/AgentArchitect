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
  const scriptNote = result.portableScripts?.length ? `, scripts: ${result.portableScripts.length}` : '';
  console.log(`  [OK] ${result.path} — agents: ${result.agents}, orchestrators: ${result.teams}${scriptNote}${result.routingChanged ? ', routing block updated' : ''}`);
  if (result.addedAgents?.length) {
    console.log(`       [NEW] roster gained: ${result.addedAgents.join(', ')}`);
  }
  for (const e of [...result.agentErrors, ...result.teamErrors]) {
    console.warn(`       [WARN] ${e.agentId || e.teamId}: ${e.error}`);
  }
  for (const w of result.wikiWarnings || []) {
    console.warn(`       [WARN] always_load missing — ${w}`);
  }
  return result;
}

/** Stamp the registry with the factory commit this repo was just synced to. */
function recordProvenance(entry) {
  const aaCommit = execSync('git rev-parse HEAD', { cwd: AA_ROOT, encoding: 'utf-8' }).trim();
  registerRepo({ ...entry, aaCommit, syncedAt: new Date().toISOString().slice(0, 10) });
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
      if (entry.status === 'archived') {
        console.log(`  [SKIP] ${entry.path} — archived; sync it explicitly by path to override`);
        continue;
      }
      if (!fs.existsSync(entry.path)) {
        console.warn(`  [MISSING] ${entry.path} — repo not on disk; remove its entry from registry/workspaces.json if it was deleted intentionally`);
        continue;
      }
      try {
        syncOne(entry.path);
        recordProvenance(entry);
      } catch (e) {
        console.error(`  [ERROR] ${entry.path}: ${e.message}`);
      }
    }
    return;
  }

  syncOne(args[0]);
  // Single-path sync used to update the repo manifest but not the registry,
  // so the two records of "which factory commit is this repo on" drifted apart.
  const abs = path.resolve(args[0]);
  const entry = loadRegistry().workspaces.find(w => path.resolve(w.path) === abs);
  if (entry) recordProvenance(entry);
  else console.warn(`  [WARN] ${abs} is not in registry/workspaces.json — provenance not recorded`);
}

main();
