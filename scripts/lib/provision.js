/**
 * Shared provisioning + sync library for the Factory Model.
 *
 * Used by: scripts/new-workspace.js, scripts/new-project.js,
 *          scripts/sync-workspace.js, bin/aa
 *
 * Generation of .claude/agents + .claude/skills reuses generateForExport()
 * from scripts/generate-agents.js — single code path with /sync-agents.
 *
 * See docs/factory-model.md for the architecture and contracts.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const AA_ROOT = path.resolve(__dirname, '..', '..');
const TEMPLATES_DIR = path.join(AA_ROOT, 'templates');
const TEAMS_DIR = path.join(AA_ROOT, 'teams');
const WORKSPACES_ROOT = path.join(os.homedir(), 'Workspaces');
const REGISTRY_PATH = path.join(AA_ROOT, 'registry', 'workspaces.json');
const MANIFEST_NAME = '.agentarchitect.json';

const { generateForExport, loadAllAgentConfigs } = require('../generate-agents.js');

/** Default owning team per project type. */
const PROJECT_TYPE_TEAMS = {
  youtube: 'content-studio',
  podcast: 'content-studio',
  software: 'software-project',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(title) {
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function aaHeadCommit() {
  try {
    return execSync('git rev-parse HEAD', { cwd: AA_ROOT, encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf-8');
}

function loadTeam(teamId) {
  const p = path.join(TEAMS_DIR, teamId, 'team.json');
  if (!fs.existsSync(p)) throw new Error(`Team not found: ${teamId} (${p})`);
  return readJson(p);
}

/**
 * All agent ids a team's repo should receive: roster members plus any agent
 * referenced in orchestration.routing that actually exists in agents/.
 */
function teamAgentIds(teamConfig, allAgents) {
  const ids = new Set((teamConfig.members || []).map(m => m.agent_id));
  const routing = teamConfig.orchestration?.routing || {};
  for (const agentIds of Object.values(routing)) {
    for (const id of agentIds) {
      if (allAgents[id]) ids.add(id);
    }
  }
  return Array.from(ids).filter(id => allAgents[id]);
}

// ---------------------------------------------------------------------------
// Template rendering
// ---------------------------------------------------------------------------

/**
 * Recursively copy a template directory into dest, applying {{TOKEN}}
 * replacement to text files and renaming `gitignore` → `.gitignore`.
 * Never overwrites an existing file unless opts.overwrite is true.
 */
function renderTemplate(srcDir, destDir, tokens, opts = {}) {
  const written = [];
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  fs.mkdirSync(destDir, { recursive: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    let destName = entry.name === 'gitignore' ? '.gitignore' : entry.name;

    if (entry.isDirectory()) {
      written.push(...renderTemplate(srcPath, path.join(destDir, destName), tokens, opts));
      continue;
    }

    const destPath = path.join(destDir, destName);
    if (fs.existsSync(destPath) && !opts.overwrite) continue;

    let content = fs.readFileSync(srcPath, 'utf-8');
    for (const [key, value] of Object.entries(tokens)) {
      content = content.split(`{{${key}}}`).join(value);
    }
    fs.writeFileSync(destPath, content, 'utf-8');
    written.push(destPath);
  }
  return written;
}

function buildTokens({ teamConfig, projectName, projectType, targetPath }) {
  return {
    TEAM_ID: teamConfig.id,
    TEAM_NAME: teamConfig.name,
    TEAM_SKILL: teamConfig.skill_alias || teamConfig.id,
    PROJECT_NAME: projectName || '',
    PROJECT_TYPE: projectType || '',
    SLUG: path.basename(targetPath),
    AA_PATH: AA_ROOT,
    TARGET_PATH: targetPath,
    DATE: today(),
  };
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

function loadRegistry() {
  if (!fs.existsSync(REGISTRY_PATH)) return { version: '1.0', workspaces: [] };
  return readJson(REGISTRY_PATH);
}

function registerRepo(entry) {
  const reg = loadRegistry();
  reg.workspaces = reg.workspaces.filter(w => w.path !== entry.path);
  reg.workspaces.push(entry);
  reg.workspaces.sort((a, b) => a.path.localeCompare(b.path));
  writeJson(REGISTRY_PATH, reg);
}

// ---------------------------------------------------------------------------
// Sync — regenerate a spawned repo's generated surface from AA
// ---------------------------------------------------------------------------

const ROUTING_BEGIN = '<!-- AA:ROUTING:BEGIN';
const ROUTING_END = '<!-- AA:ROUTING:END -->';

/**
 * Replace the routing block in a spawned repo's CLAUDE.md with freshly
 * rendered content from the current template for its kind/type.
 * Content outside the markers is preserved untouched.
 */
function refreshRoutingBlock(repoPath, manifest, tokens) {
  const claudeMdPath = path.join(repoPath, 'CLAUDE.md');
  if (!fs.existsSync(claudeMdPath)) return false;

  const templateDir = manifest.kind === 'workspace'
    ? path.join(TEMPLATES_DIR, 'workspace')
    : path.join(TEMPLATES_DIR, 'project', manifest.projectType);
  const templatePath = path.join(templateDir, 'CLAUDE.md');
  if (!fs.existsSync(templatePath)) return false;

  let template = fs.readFileSync(templatePath, 'utf-8');
  for (const [key, value] of Object.entries(tokens)) {
    template = template.split(`{{${key}}}`).join(value);
  }

  const extractBlock = (text) => {
    const start = text.indexOf(ROUTING_BEGIN);
    const end = text.indexOf(ROUTING_END);
    if (start === -1 || end === -1) return null;
    return text.slice(start, end + ROUTING_END.length);
  };

  const freshBlock = extractBlock(template);
  const current = fs.readFileSync(claudeMdPath, 'utf-8');
  const currentBlock = extractBlock(current);
  if (!freshBlock || !currentBlock) return false;
  if (freshBlock === currentBlock) return false;

  fs.writeFileSync(claudeMdPath, current.replace(currentBlock, freshBlock), 'utf-8');
  return true;
}

/**
 * Sync one spawned repo from AA. Reads its manifest, regenerates
 * .claude/agents + .claude/skills, refreshes the CLAUDE.md routing block,
 * bumps aaCommit. Idempotent. Returns a summary object.
 */
function syncRepo(repoPath) {
  const abs = path.resolve(repoPath);
  const manifestPath = path.join(abs, MANIFEST_NAME);
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Not an AgentArchitect-provisioned repo (no ${MANIFEST_NAME}): ${abs}`);
  }
  const manifest = readJson(manifestPath);
  const teamConfig = loadTeam(manifest.team);
  const allAgents = loadAllAgentConfigs();

  // Regenerate agents + skills through the same code path as /sync-agents.
  const { agentResults, teamResults } = generateForExport({
    agentsDir: path.join(AA_ROOT, 'agents'),
    teamsDir: TEAMS_DIR,
    outputAgentsDir: path.join(abs, '.claude', 'agents'),
    outputSkillsDir: path.join(abs, '.claude', 'skills'),
    agentFilter: manifest.agents,
    teamFilter: [manifest.team],
  });

  const tokens = buildTokens({
    teamConfig,
    projectName: manifest.projectName || '',
    projectType: manifest.projectType || '',
    targetPath: abs,
  });
  const routingChanged = refreshRoutingBlock(abs, manifest, tokens);

  // Bump provenance.
  manifest.skills = [teamConfig.skill_alias || teamConfig.id];
  manifest.aaCommit = aaHeadCommit();
  manifest.syncedAt = today();
  writeJson(manifestPath, manifest);

  return {
    path: abs,
    agents: agentResults.success.length,
    agentErrors: agentResults.errors,
    teams: teamResults.success.length,
    teamErrors: teamResults.errors,
    routingChanged,
  };
}

// ---------------------------------------------------------------------------
// Provision — create a new spawned repo
// ---------------------------------------------------------------------------

function gitInitAndCommit(repoPath, message) {
  const run = (cmd) => execSync(cmd, { cwd: repoPath, stdio: 'pipe' });
  if (!fs.existsSync(path.join(repoPath, '.git'))) {
    run('git init -b main');
  }
  // Scaffold commit: the repo is brand-new and entirely factory-written,
  // so a full add is safe here (and only here).
  run('git add -A');
  try {
    run(`git commit -m ${JSON.stringify(message)}`);
  } catch (e) {
    // Nothing to commit (idempotent re-run) is fine.
    const out = String(e.stdout || '') + String(e.stderr || '');
    if (!/nothing to commit/.test(out)) throw e;
  }
}

/**
 * Provision a workspace repo for a team.
 */
function provisionWorkspace({ teamId, targetPath, noCommit = false }) {
  const teamConfig = loadTeam(teamId);
  const allAgents = loadAllAgentConfigs();
  const dest = path.resolve(
    targetPath || path.join(WORKSPACES_ROOT, teamConfig.skill_alias || teamId)
  );
  if (dest === AA_ROOT) throw new Error('Refusing to provision into AgentArchitect itself');

  const tokens = buildTokens({ teamConfig, targetPath: dest });
  renderTemplate(path.join(TEMPLATES_DIR, 'workspace'), dest, tokens);

  const manifest = {
    provisionedFrom: AA_ROOT,
    kind: 'workspace',
    team: teamId,
    projectType: null,
    agents: teamAgentIds(teamConfig, allAgents),
    skills: [teamConfig.skill_alias || teamId],
    mcp: [],
    provisionedAt: today(),
    aaCommit: aaHeadCommit(),
  };
  writeJson(path.join(dest, MANIFEST_NAME), manifest);

  const sync = syncRepo(dest);
  if (!noCommit) {
    gitInitAndCommit(dest, `scaffold: ${teamConfig.name} workspace (provisioned by AgentArchitect)`);
  }

  registerRepo({
    kind: 'workspace',
    team: teamId,
    projectType: null,
    path: dest,
    provisionedAt: manifest.provisionedAt,
    aaCommit: manifest.aaCommit,
  });

  return { dest, teamConfig, sync };
}

/**
 * Provision a project repo of a given type.
 */
function provisionProject({ type, name, teamId, targetPath, noCommit = false }) {
  if (!PROJECT_TYPE_TEAMS[type]) {
    throw new Error(`Unknown project type "${type}". Known: ${Object.keys(PROJECT_TYPE_TEAMS).join(', ')}`);
  }
  const resolvedTeamId = teamId || PROJECT_TYPE_TEAMS[type];
  const teamConfig = loadTeam(resolvedTeamId);
  const allAgents = loadAllAgentConfigs();
  const slug = slugify(name);
  if (!slug) throw new Error(`Could not derive a slug from title: ${name}`);
  const dest = path.resolve(targetPath || path.join(WORKSPACES_ROOT, slug));
  if (dest === AA_ROOT) throw new Error('Refusing to provision into AgentArchitect itself');

  const tokens = buildTokens({ teamConfig, projectName: name, projectType: type, targetPath: dest });
  renderTemplate(path.join(TEMPLATES_DIR, 'project', type), dest, tokens);

  // Project-scoped MCP servers come from the template's .mcp.json.
  let mcp = [];
  const mcpPath = path.join(dest, '.mcp.json');
  if (fs.existsSync(mcpPath)) {
    try { mcp = Object.keys(readJson(mcpPath).mcpServers || {}); } catch { /* leave [] */ }
  }

  const manifest = {
    provisionedFrom: AA_ROOT,
    kind: 'project',
    team: resolvedTeamId,
    projectType: type,
    projectName: name,
    agents: teamAgentIds(teamConfig, allAgents),
    skills: [teamConfig.skill_alias || resolvedTeamId],
    mcp,
    provisionedAt: today(),
    aaCommit: aaHeadCommit(),
  };
  writeJson(path.join(dest, MANIFEST_NAME), manifest);

  const sync = syncRepo(dest);
  if (!noCommit) {
    gitInitAndCommit(dest, `scaffold: ${name} (${type} project, provisioned by AgentArchitect)`);
  }

  registerRepo({
    kind: 'project',
    team: resolvedTeamId,
    projectType: type,
    name,
    path: dest,
    provisionedAt: manifest.provisionedAt,
    aaCommit: manifest.aaCommit,
  });

  return { dest, teamConfig, sync };
}

function handoff(dest) {
  return [
    `✔ Created ${dest}`,
    `▶ Next:  cd ${dest} && claude`,
    `   Then say: "let's start"`,
  ].join('\n');
}

module.exports = {
  AA_ROOT,
  MANIFEST_NAME,
  PROJECT_TYPE_TEAMS,
  slugify,
  loadTeam,
  loadRegistry,
  registerRepo,
  renderTemplate,
  provisionWorkspace,
  provisionProject,
  syncRepo,
  handoff,
};
