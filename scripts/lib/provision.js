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

/** The skill alias a team's orchestrator is invoked by. */
function skillAlias(teamConfig) {
  return teamConfig.skill_alias || teamConfig.id;
}

/**
 * Team ids a repo is served by. A repo may be owned by more than one team when
 * it spans disciplines (e.g. a connected product with app + firmware + PCB).
 * `teams` is authoritative; `team` is the legacy single-team field, still
 * written as the primary team so the registry and `aa list` keep working.
 */
function manifestTeamIds(manifest) {
  if (Array.isArray(manifest.teams) && manifest.teams.length) return manifest.teams;
  if (manifest.team) return [manifest.team];
  throw new Error('Manifest declares no team (expected "teams" array or legacy "team")');
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

/** Union of the agent ids every owning team contributes, de-duplicated. */
function allTeamAgentIds(teamConfigs, allAgents) {
  const ids = new Set();
  for (const tc of teamConfigs) {
    for (const id of teamAgentIds(tc, allAgents)) ids.add(id);
  }
  return Array.from(ids).sort();
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

/**
 * The "## Routing" prose for a repo's CLAUDE.md, rendered from its owning
 * team(s). One team reads as a sentence; several read as a routing table so
 * the reader can tell which discipline goes where.
 */
function renderTeamRouting(teamConfigs) {
  if (teamConfigs.length === 1) {
    const tc = teamConfigs[0];
    const desc = tc.description.charAt(0).toLowerCase() + tc.description.slice(1);
    return `Invoke \`Skill(skill: "${skillAlias(tc)}")\` for team work — ${desc}. Direct requests on an established codebase can be handled inline; use the team for anything needing requirements, design, or planning first.`;
  }
  const rows = teamConfigs
    .map(tc => `| \`Skill(skill: "${skillAlias(tc)}")\` | ${tc.description} |`)
    .join('\n');
  return [
    `This repo spans more than one discipline and is served by ${teamConfigs.length} teams. Route by what the work actually is:`,
    '',
    '| Invoke | Covers |',
    '|---|---|',
    rows,
    '',
    'Pick the team that owns the tree you are editing. Work that crosses the boundary (an interface change, a protocol revision, a spec that binds both sides) starts with the team that owns the contract, which then hands off a briefing.',
  ].join('\n');
}

function buildTokens({ teamConfigs, projectName, projectType, targetPath }) {
  const primary = teamConfigs[0];
  return {
    TEAM_ID: primary.id,
    TEAM_NAME: teamConfigs.map(tc => tc.name).join(' + '),
    TEAM_SKILL: skillAlias(primary),
    TEAM_SKILLS: teamConfigs.map(skillAlias).join(', '),
    TEAM_ROUTING: renderTeamRouting(teamConfigs),
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
 * Copy the portable utility skills (wrap, voice-local, …) from
 * templates/portable/skills/ into a spawned repo's .claude/skills/.
 * Factory-managed: always overwrites. Returns the skill names copied.
 */
function syncPortableSkills(repoPath) {
  const srcRoot = path.join(TEMPLATES_DIR, 'portable', 'skills');
  if (!fs.existsSync(srcRoot)) return [];
  const copied = [];
  for (const name of fs.readdirSync(srcRoot)) {
    const src = path.join(srcRoot, name, 'SKILL.md');
    if (!fs.existsSync(src)) continue;
    const destDir = path.join(repoPath, '.claude', 'skills', name);
    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(src, path.join(destDir, 'SKILL.md'));
    copied.push(name);
  }
  return copied;
}

/**
 * Copy the portable helper scripts (bootstrap-cloud.sh, …) from
 * templates/portable/scripts/ into a spawned repo's scripts/.
 * Factory-managed: always overwrites, and marks them executable.
 *
 * These live in templates/portable/ rather than templates/workspace/ on
 * purpose: renderTemplate() only runs at provision time and never overwrites,
 * so an already-provisioned repo would never receive them. Going through
 * syncRepo() means all existing repos pick them up on the next `aa sync`.
 *
 * Returns the script filenames copied.
 */
function syncRepoScripts(repoPath) {
  const srcRoot = path.join(TEMPLATES_DIR, 'portable', 'scripts');
  if (!fs.existsSync(srcRoot)) return [];
  const destDir = path.join(repoPath, 'scripts');
  const copied = [];
  for (const name of fs.readdirSync(srcRoot)) {
    const src = path.join(srcRoot, name);
    if (!fs.statSync(src).isFile()) continue;
    fs.mkdirSync(destDir, { recursive: true });
    const dest = path.join(destDir, name);
    fs.copyFileSync(src, dest);
    if (name.endsWith('.sh')) fs.chmodSync(dest, 0o755);
    copied.push(name);
  }
  return copied;
}

/**
 * Sync one spawned repo from AA. Reads its manifest, regenerates
 * .claude/agents + .claude/skills, copies the portable utility skills and
 * helper scripts, refreshes the CLAUDE.md routing block, bumps aaCommit.
 * Idempotent. Returns a summary object.
 */
function syncRepo(repoPath) {
  const abs = path.resolve(repoPath);
  const manifestPath = path.join(abs, MANIFEST_NAME);
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Not an AgentArchitect-provisioned repo (no ${MANIFEST_NAME}): ${abs}`);
  }
  const manifest = readJson(manifestPath);
  const teamIds = manifestTeamIds(manifest);
  const teamConfigs = teamIds.map(loadTeam);

  // Regenerate agents + skills through the same code path as /sync-agents.
  const { agentResults, teamResults } = generateForExport({
    agentsDir: path.join(AA_ROOT, 'agents'),
    teamsDir: TEAMS_DIR,
    outputAgentsDir: path.join(abs, '.claude', 'agents'),
    outputSkillsDir: path.join(abs, '.claude', 'skills'),
    agentFilter: manifest.agents,
    teamFilter: teamIds,
  });

  const portable = syncPortableSkills(abs);
  const portableScripts = syncRepoScripts(abs);

  const tokens = buildTokens({
    teamConfigs,
    projectName: manifest.projectName || '',
    projectType: manifest.projectType || '',
    targetPath: abs,
  });
  const routingChanged = refreshRoutingBlock(abs, manifest, tokens);

  // Bump provenance.
  manifest.skills = teamConfigs.map(skillAlias);
  manifest.aaCommit = aaHeadCommit();
  manifest.syncedAt = today();
  writeJson(manifestPath, manifest);

  return {
    path: abs,
    agents: agentResults.success.length,
    agentErrors: agentResults.errors,
    teams: teamResults.success.length,
    teamErrors: teamResults.errors,
    portable,
    portableScripts,
    wikiWarnings: agentResults.success.flatMap(r => r.wikiWarnings || []),
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

  const tokens = buildTokens({ teamConfigs: [teamConfig], targetPath: dest });
  renderTemplate(path.join(TEMPLATES_DIR, 'workspace'), dest, tokens);

  const manifest = {
    provisionedFrom: AA_ROOT,
    kind: 'workspace',
    team: teamId,
    teams: [teamId],
    projectType: null,
    agents: teamAgentIds(teamConfig, allAgents),
    skills: [skillAlias(teamConfig)],
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
function provisionProject({ type, name, teamId, teamIds, targetPath, noCommit = false }) {
  if (!PROJECT_TYPE_TEAMS[type]) {
    throw new Error(`Unknown project type "${type}". Known: ${Object.keys(PROJECT_TYPE_TEAMS).join(', ')}`);
  }
  const resolvedTeamIds = (teamIds && teamIds.length)
    ? teamIds
    : [teamId || PROJECT_TYPE_TEAMS[type]];
  const teamConfigs = resolvedTeamIds.map(loadTeam);
  const teamConfig = teamConfigs[0];
  const resolvedTeamId = teamConfig.id;
  const allAgents = loadAllAgentConfigs();
  const slug = slugify(name);
  if (!slug) throw new Error(`Could not derive a slug from title: ${name}`);
  const dest = path.resolve(targetPath || path.join(WORKSPACES_ROOT, slug));
  if (dest === AA_ROOT) throw new Error('Refusing to provision into AgentArchitect itself');

  const tokens = buildTokens({ teamConfigs, projectName: name, projectType: type, targetPath: dest });
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
    teams: resolvedTeamIds,
    projectType: type,
    projectName: name,
    agents: allTeamAgentIds(teamConfigs, allAgents),
    skills: teamConfigs.map(skillAlias),
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

// ---------------------------------------------------------------------------
// Adopt — bring a repo that predates the factory under management
// ---------------------------------------------------------------------------

/** Pull a named `## ` section out of a rendered template, heading included. */
function extractSection(text, heading) {
  const start = text.indexOf(`## ${heading}`);
  if (start === -1) return null;
  const next = text.indexOf('\n## ', start + 1);
  return (next === -1 ? text.slice(start) : text.slice(start, next)).trimEnd();
}

/**
 * Add the factory-managed blocks to a CLAUDE.md that a human wrote, without
 * disturbing a byte of what is already there. The routing block goes in ahead
 * of the first `## ` section so it is the first thing an agent reads; the git
 * rules go at the end. Both are skipped if already present.
 */
function injectClaudeMdBlocks(repoPath, templateDir, tokens) {
  const claudeMdPath = path.join(repoPath, 'CLAUDE.md');
  const templatePath = path.join(templateDir, 'CLAUDE.md');
  if (!fs.existsSync(templatePath)) throw new Error(`Template CLAUDE.md missing: ${templatePath}`);

  let template = fs.readFileSync(templatePath, 'utf-8');
  for (const [key, value] of Object.entries(tokens)) {
    template = template.split(`{{${key}}}`).join(value);
  }

  // Brand-new repo: take the template wholesale.
  if (!fs.existsSync(claudeMdPath)) {
    fs.writeFileSync(claudeMdPath, template, 'utf-8');
    return { created: true, routingAdded: true, gitRulesAdded: true };
  }

  let content = fs.readFileSync(claudeMdPath, 'utf-8');
  const added = { created: false, routingAdded: false, gitRulesAdded: false };

  if (!content.includes(ROUTING_BEGIN)) {
    const start = template.indexOf(ROUTING_BEGIN);
    const end = template.indexOf(ROUTING_END);
    if (start === -1 || end === -1) throw new Error(`Template has no AA:ROUTING block: ${templatePath}`);
    const block = template.slice(start, end + ROUTING_END.length);

    const firstSection = content.indexOf('\n## ');
    if (firstSection === -1) {
      content = `${content.trimEnd()}\n\n${block}\n`;
    } else {
      content = `${content.slice(0, firstSection + 1)}${block}\n\n${content.slice(firstSection + 1)}`;
    }
    added.routingAdded = true;
  }

  if (!/^## Parallel Agent Git Rules/m.test(content)) {
    const gitRules = extractSection(template, 'Parallel Agent Git Rules (CRITICAL)');
    if (gitRules) {
      content = `${content.trimEnd()}\n\n${gitRules}\n`;
      added.gitRulesAdded = true;
    }
  }

  fs.writeFileSync(claudeMdPath, content, 'utf-8');
  return added;
}

const GITIGNORE_MARKER = '# Generated by AgentArchitect sync';

/**
 * Append the factory's ignore rules to a repo's existing .gitignore so the
 * generated `.claude/` surface stays untracked (the manifest itself is meant to
 * be committed). Existing rules are never reordered or removed.
 */
function mergeGitignore(repoPath, templateDir) {
  const templatePath = path.join(templateDir, 'gitignore');
  if (!fs.existsSync(templatePath)) return false;
  const template = fs.readFileSync(templatePath, 'utf-8');
  const markerAt = template.indexOf(GITIGNORE_MARKER);
  if (markerAt === -1) return false;
  const block = template.slice(markerAt).trimEnd();

  const destPath = path.join(repoPath, '.gitignore');
  if (!fs.existsSync(destPath)) {
    fs.writeFileSync(destPath, block + '\n', 'utf-8');
    return true;
  }
  const current = fs.readFileSync(destPath, 'utf-8');
  if (current.includes(GITIGNORE_MARKER) || current.includes('.claude/agents/*.md')) return false;
  fs.writeFileSync(destPath, `${current.trimEnd()}\n\n${block}\n`, 'utf-8');
  return true;
}

/**
 * Adopt an existing repo into the factory. Unlike provisionProject this never
 * scaffolds template directories, never touches git, and never overwrites the
 * repo's own CLAUDE.md content — it only writes the manifest, injects the
 * factory-managed CLAUDE.md blocks, and generates `.claude/`.
 */
function adoptRepo({ repoPath, teamIds, projectType, projectName, kind = 'project' }) {
  const abs = path.resolve(repoPath);
  if (abs === AA_ROOT) throw new Error('Refusing to adopt AgentArchitect itself');
  if (!fs.existsSync(abs)) throw new Error(`No such directory: ${abs}`);
  if (!teamIds || !teamIds.length) throw new Error('adoptRepo requires at least one team id');
  if (kind === 'project' && !projectType) throw new Error('adoptRepo requires --type for a project');

  const teamConfigs = teamIds.map(loadTeam);
  const allAgents = loadAllAgentConfigs();
  const manifestPath = path.join(abs, MANIFEST_NAME);
  const existing = fs.existsSync(manifestPath) ? readJson(manifestPath) : {};

  const manifest = {
    ...existing,
    provisionedFrom: AA_ROOT,
    kind,
    team: teamConfigs[0].id,
    teams: teamIds,
    projectType: kind === 'project' ? projectType : null,
    ...(projectName ? { projectName } : {}),
    agents: allTeamAgentIds(teamConfigs, allAgents),
    skills: teamConfigs.map(skillAlias),
    mcp: existing.mcp || [],
    adopted: true,
    provisionedAt: existing.provisionedAt || today(),
    aaCommit: aaHeadCommit(),
  };
  writeJson(manifestPath, manifest);

  const templateDir = kind === 'workspace'
    ? path.join(TEMPLATES_DIR, 'workspace')
    : path.join(TEMPLATES_DIR, 'project', projectType);
  const tokens = buildTokens({
    teamConfigs,
    projectName: projectName || '',
    projectType: manifest.projectType || '',
    targetPath: abs,
  });
  const claudeMd = injectClaudeMdBlocks(abs, templateDir, tokens);
  const gitignoreUpdated = mergeGitignore(abs, templateDir);

  const sync = syncRepo(abs);

  registerRepo({
    kind,
    team: manifest.team,
    teams: teamIds,
    projectType: manifest.projectType,
    ...(projectName ? { name: projectName } : {}),
    path: abs,
    adopted: true,
    provisionedAt: manifest.provisionedAt,
    aaCommit: manifest.aaCommit,
    syncedAt: today(),
  });

  return { dest: abs, teamConfigs, claudeMd, gitignoreUpdated, sync };
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
  skillAlias,
  manifestTeamIds,
  loadRegistry,
  registerRepo,
  renderTemplate,
  provisionWorkspace,
  provisionProject,
  adoptRepo,
  syncRepo,
  handoff,
};
