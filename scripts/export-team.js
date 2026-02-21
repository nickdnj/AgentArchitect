#!/usr/bin/env node

/**
 * Team Export Script
 *
 * Exports a team as a standalone, portable package that can be shared
 * without needing the full Agent Architect repository.
 *
 * Usage: node scripts/export-team.js <team-id> [options]
 *   --output <path>    Output directory (default: exports/<team-id>/)
 *   --no-docs          Skip context bucket file contents
 *   --dry-run          Show what would be exported without writing
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Root of the Agent Architect repo
const ROOT = path.join(__dirname, '..');

// ============================================================================
// Sanitization
// ============================================================================

const SANITIZE_RULES = [
  // Personal emails
  { pattern: /nickd@wharfsidemb\.com/g, replacement: 'YOUR_BOARD_EMAIL' },
  { pattern: /nickd@demarconet\.com/g, replacement: 'YOUR_PERSONAL_EMAIL' },
  // Absolute paths - specific patterns first
  { pattern: /\/Users\/nickd\/Workspaces\/pdfscribe_cli/g, replacement: '${PDFSCRIBE_CLI_PATH}' },
  { pattern: /\/Users\/nickd\/Workspaces\/AgentArchitect/g, replacement: '.' },
  { pattern: /\/Users\/nickd\/Workspaces\/mcp_servers\/[^\s"']*/g, replacement: '${MCP_SERVERS_PATH}' },
  { pattern: /\/Users\/nickd\/Workspaces\/Contactbook\/[^\s"']*/g, replacement: '${CONTACTBOOK_PATH}' },
  { pattern: /\/Users\/nickd\/AppFolio-Sync/g, replacement: '${APPFOLIO_SYNC_PATH}' },
  { pattern: /\/Users\/nickd\/[^\s"']*/g, replacement: '${HOME_PATH}' },
  // Google Drive sync paths
  { pattern: /~\/Library\/CloudStorage\/GoogleDrive-[^\s"']*/g, replacement: '${GOOGLE_DRIVE_PATH}' },
];

function sanitizeString(str) {
  let result = str;
  for (const rule of SANITIZE_RULES) {
    result = result.replace(rule.pattern, rule.replacement);
  }
  return result;
}

function sanitizeJson(obj) {
  const str = JSON.stringify(obj, null, 2);
  return JSON.parse(sanitizeString(str));
}

// ============================================================================
// Phase 1: Resolve Dependencies
// ============================================================================

function resolveDependencies(teamId) {
  const teamDir = path.join(ROOT, 'teams', teamId);
  const teamJsonPath = path.join(teamDir, 'team.json');

  if (!fs.existsSync(teamJsonPath)) {
    console.error(`Error: Team not found: ${teamId}`);
    console.error(`Expected: ${teamJsonPath}`);
    process.exit(1);
  }

  const teamConfig = JSON.parse(fs.readFileSync(teamJsonPath, 'utf-8'));
  const members = teamConfig.members || [];

  // Collect agent IDs
  const agentIds = members.map(m => m.agent_id);

  // Collect dependencies from each agent
  const mcpServers = new Set();
  const contextBuckets = new Set();
  const agentConfigs = {};
  const infraDeps = new Set();

  // Add team-level shared buckets
  if (teamConfig.shared_context?.buckets) {
    for (const bucket of teamConfig.shared_context.buckets) {
      contextBuckets.add(bucket);
    }
  }

  // Add session-logs if session_summary is enabled
  if (teamConfig.orchestration?.session_summary?.enabled) {
    contextBuckets.add('session-logs');
  }

  for (const agentId of agentIds) {
    const configPath = path.join(ROOT, 'agents', agentId, 'config.json');
    if (!fs.existsSync(configPath)) {
      console.warn(`  Warning: Agent config not found: ${agentId}`);
      continue;
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    agentConfigs[agentId] = config;

    // Collect MCP servers
    if (config.mcp_servers) {
      for (const server of config.mcp_servers) {
        mcpServers.add(server);
      }
    }

    // Collect context buckets
    if (config.context_buckets?.assigned) {
      for (const bucket of config.context_buckets.assigned) {
        contextBuckets.add(bucket);
      }
    }

    // Detect infrastructure dependencies
    if (config.rag_integration?.database || config.rag_config?.database) {
      infraDeps.add('sqlite-vec');
    }
  }

  // Filter context buckets: remove Altium-only buckets for cross-team agents
  const filteredBuckets = new Set();
  for (const bucket of contextBuckets) {
    // Skip Altium-specific buckets
    if (bucket === 'altium-playbook' || bucket === 'altium-presentation-guide') {
      continue;
    }
    filteredBuckets.add(bucket);
  }

  return {
    teamConfig,
    agentIds,
    agentConfigs,
    mcpServers: Array.from(mcpServers),
    contextBuckets: Array.from(filteredBuckets),
    infraDeps: Array.from(infraDeps),
  };
}

// ============================================================================
// Phase 2: Create Directory Structure
// ============================================================================

function createDirectoryStructure(exportDir) {
  const dirs = [
    exportDir,
    path.join(exportDir, 'agents'),
    path.join(exportDir, 'teams'),
    path.join(exportDir, 'context-buckets'),
    path.join(exportDir, 'registry'),
    path.join(exportDir, 'mcp-servers'),
    path.join(exportDir, 'scripts'),
    path.join(exportDir, '.claude', 'agents'),
    path.join(exportDir, '.claude', 'skills'),
    path.join(exportDir, 'outputs'),
    path.join(exportDir, 'data'),
  ];

  for (const dir of dirs) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// ============================================================================
// Phase 3: Copy Agent Sources
// ============================================================================

function copyAgentSources(exportDir, deps) {
  const results = [];

  for (const agentId of deps.agentIds) {
    const srcDir = path.join(ROOT, 'agents', agentId);
    const destDir = path.join(exportDir, 'agents', agentId);

    if (!fs.existsSync(srcDir)) {
      results.push({ agentId, error: 'source not found' });
      continue;
    }

    fs.mkdirSync(destDir, { recursive: true });

    // Copy SKILL.md (sanitize)
    const skillPath = path.join(srcDir, 'SKILL.md');
    if (fs.existsSync(skillPath)) {
      const content = fs.readFileSync(skillPath, 'utf-8');
      fs.writeFileSync(path.join(destDir, 'SKILL.md'), sanitizeString(content), 'utf-8');
    }

    // Copy and sanitize config.json
    const configPath = path.join(srcDir, 'config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

      // Filter presentation agent: remove Altium-only context buckets and templates
      if (agentId === 'presentation') {
        if (config.context_buckets?.assigned) {
          config.context_buckets.assigned = config.context_buckets.assigned.filter(
            b => !b.startsWith('altium-')
          );
        }
        if (config.templates?.available) {
          config.templates.available = config.templates.available.filter(
            t => t.id !== 'altium'
          );
        }
        // Remove Altium collaboration references
        if (config.collaboration?.can_request_from) {
          const altiumAgents = ['account-researcher', 'solution-architect', 'value-engineer', 'competitive-intel'];
          config.collaboration.can_request_from = config.collaboration.can_request_from.filter(
            a => !altiumAgents.includes(a)
          );
        }
        if (config.collaboration?.provides_to) {
          const altiumAgents = ['proposal-writer', 'deal-strategist', 'customer-support'];
          config.collaboration.provides_to = config.collaboration.provides_to.filter(
            a => !altiumAgents.includes(a)
          );
        }
        // Remove Altium defaults
        if (config.defaults?.altium_output_directory) {
          delete config.defaults.altium_output_directory;
        }
      }

      const sanitized = sanitizeJson(config);
      fs.writeFileSync(
        path.join(destDir, 'config.json'),
        JSON.stringify(sanitized, null, 2) + '\n',
        'utf-8'
      );
    }

    results.push({ agentId, success: true });
  }

  return results;
}

// ============================================================================
// Phase 3.5: Generate MCP Server Configs (CLI-only, no Docker)
// ============================================================================

/**
 * MCP server CLI configurations for npx/uvx invocation.
 * Maps server IDs to their stdio command configs.
 */
const MCP_CLI_CONFIGS = {
  'gmail': {
    command: 'npx',
    args: ['-y', '@gongrzhe/server-gmail-autoauth-mcp'],
    env: {},
    platform_notes: {
      windows: 'Requires Node.js 18+. OAuth token auto-generated on first use.',
    },
  },
  'gmail-personal': {
    command: 'npx',
    args: ['-y', '@gongrzhe/server-gmail-autoauth-mcp'],
    env: {},
    platform_notes: {
      windows: 'Uses separate credential directory for personal account.',
    },
  },
  'google-docs': {
    command: 'npx',
    args: ['-y', 'google-docs-mcp'],
    env: {
      GOOGLE_DOCS_CLIENT_ID: '{{GOOGLE_DOCS_CLIENT_ID}}',
      GOOGLE_DOCS_CLIENT_SECRET: '{{GOOGLE_DOCS_CLIENT_SECRET}}',
      GOOGLE_DOCS_REFRESH_TOKEN: '{{GOOGLE_DOCS_REFRESH_TOKEN}}',
    },
  },
  'pdfscribe': {
    command: 'python',
    args: ['mcp-servers/images/pdfscribe/pdfscribe_server.py'],
    env: {
      PDFSCRIBE_CLI_PATH: '{{PROJECT_DIR}}/pdfscribe_cli',
    },
  },
  'powerpoint': {
    command: 'python',
    args: ['mcp-servers/images/powerpoint/ppt_server.py'],
    env: {
      POWERPOINT_TEMPLATES_PATH: '{{PROJECT_DIR}}/templates',
      POWERPOINT_WORKSPACE_PATH: '{{PROJECT_DIR}}/workspace',
    },
  },
  'openai-image': {
    command: 'npx',
    args: ['-y', '@lpenguin/openai-image-mcp'],
    env: {
      OPENAI_API_KEY: '{{OPENAI_API_KEY}}',
    },
  },
  'voicemode': {
    command: 'uvx',
    args: ['voice-mode'],
    env: {},
  },
};

function generateMcpConfigs(exportDir, deps, platform) {
  const configs = {};

  for (const serverId of deps.mcpServers) {
    const cliConfig = MCP_CLI_CONFIGS[serverId];
    if (!cliConfig) {
      console.warn(`  Warning: No CLI config for MCP server: ${serverId}`);
      continue;
    }

    configs[serverId] = {
      type: 'stdio',
      command: cliConfig.command,
      args: [...cliConfig.args],
      env: { ...cliConfig.env },
    };
  }

  // Write the config for reference
  fs.writeFileSync(
    path.join(exportDir, 'mcp-servers', 'cli-configs.json'),
    JSON.stringify(configs, null, 2) + '\n',
    'utf-8'
  );

  return configs;
}

// ============================================================================
// Phase 4: Copy Team Definition
// ============================================================================

function copyTeamDefinition(exportDir, deps) {
  const teamId = deps.teamConfig.id;
  const srcDir = path.join(ROOT, 'teams', teamId);
  const destDir = path.join(exportDir, 'teams', teamId);

  fs.mkdirSync(destDir, { recursive: true });
  fs.mkdirSync(path.join(destDir, 'outputs'), { recursive: true });
  fs.mkdirSync(path.join(destDir, 'workspace'), { recursive: true });

  // Sanitize and write team.json
  const sanitized = sanitizeJson(deps.teamConfig);
  fs.writeFileSync(
    path.join(destDir, 'team.json'),
    JSON.stringify(sanitized, null, 2) + '\n',
    'utf-8'
  );
}

// ============================================================================
// Phase 5: Copy Context Buckets
// ============================================================================

function copyContextBuckets(exportDir, deps, includeDocs) {
  const results = [];

  for (const bucketId of deps.contextBuckets) {
    const srcDir = path.join(ROOT, 'context-buckets', bucketId);
    const destDir = path.join(exportDir, 'context-buckets', bucketId);

    fs.mkdirSync(destDir, { recursive: true });

    // Copy and sanitize bucket.json
    const bucketJsonPath = path.join(srcDir, 'bucket.json');
    if (fs.existsSync(bucketJsonPath)) {
      const config = JSON.parse(fs.readFileSync(bucketJsonPath, 'utf-8'));
      const sanitized = sanitizeJson(config);
      fs.writeFileSync(
        path.join(destDir, 'bucket.json'),
        JSON.stringify(sanitized, null, 2) + '\n',
        'utf-8'
      );
    }

    // Copy files/ directory contents
    const filesDir = path.join(srcDir, 'files');
    const destFilesDir = path.join(destDir, 'files');
    fs.mkdirSync(destFilesDir, { recursive: true });

    if (includeDocs && fs.existsSync(filesDir)) {
      // Filter session-logs: only include files relevant to this team
      if (bucketId === 'session-logs') {
        const teamId = deps.teamConfig.id;
        const teamAlias = deps.teamConfig.skill_alias || teamId;
        copyDirRecursiveFiltered(filesDir, destFilesDir, (filename) => {
          const lower = filename.toLowerCase();
          return lower.includes('wharfside') || lower.includes(teamAlias) || lower.includes(teamId);
        });
      } else {
        copyDirRecursive(filesDir, destFilesDir);
      }
      results.push({ bucketId, success: true, filesCopied: true });
    } else {
      // Create .gitkeep for empty dirs
      fs.writeFileSync(path.join(destFilesDir, '.gitkeep'), '', 'utf-8');
      results.push({ bucketId, success: true, filesCopied: false });
    }
  }

  return results;
}

const TEXT_EXTENSIONS = new Set(['.md', '.txt', '.json', '.html', '.htm', '.yml', '.yaml', '.csv', '.xml', '.sh', '.ps1']);

/**
 * Copy directory recursively with a filename filter function.
 * Only copies files where filterFn(filename) returns true.
 */
function copyDirRecursiveFiltered(src, dest, filterFn) {
  if (!fs.existsSync(src)) return;

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDirRecursiveFiltered(srcPath, destPath, filterFn);
    } else {
      if (!filterFn(entry.name)) continue;

      const ext = path.extname(entry.name).toLowerCase();
      if (TEXT_EXTENSIONS.has(ext)) {
        const content = fs.readFileSync(srcPath, 'utf-8');
        fs.writeFileSync(destPath, sanitizeString(content), 'utf-8');
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDirRecursive(srcPath, destPath);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (TEXT_EXTENSIONS.has(ext)) {
        // Sanitize text files
        const content = fs.readFileSync(srcPath, 'utf-8');
        fs.writeFileSync(destPath, sanitizeString(content), 'utf-8');
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

// ============================================================================
// Phase 6: Generate Filtered Registries
// ============================================================================

function generateFilteredRegistries(exportDir, deps) {
  const today = new Date().toISOString().split('T')[0];

  // Read source registries
  const srcAgents = JSON.parse(fs.readFileSync(path.join(ROOT, 'registry', 'agents.json'), 'utf-8'));
  const srcTeams = JSON.parse(fs.readFileSync(path.join(ROOT, 'registry', 'teams.json'), 'utf-8'));
  const srcBuckets = JSON.parse(fs.readFileSync(path.join(ROOT, 'registry', 'buckets.json'), 'utf-8'));

  // Filter agents
  const filteredAgents = {
    version: '1.0',
    last_updated: today,
    agents: srcAgents.agents.filter(a => deps.agentIds.includes(a.id)).map(a => ({
      ...a,
      teams: [deps.teamConfig.id],
    })),
  };

  // Filter teams
  const filteredTeams = {
    version: '1.0',
    last_updated: today,
    teams: srcTeams.teams.filter(t => t.id === deps.teamConfig.id),
  };

  // Filter buckets
  const filteredBuckets = {
    version: '1.0',
    last_updated: today,
    buckets: srcBuckets.buckets
      .filter(b => deps.contextBuckets.includes(b.id))
      .map(b => ({
        ...b,
        assigned_to: [deps.teamConfig.id],
      })),
  };

  fs.writeFileSync(
    path.join(exportDir, 'registry', 'agents.json'),
    JSON.stringify(filteredAgents, null, 2) + '\n',
    'utf-8'
  );
  fs.writeFileSync(
    path.join(exportDir, 'registry', 'teams.json'),
    JSON.stringify(filteredTeams, null, 2) + '\n',
    'utf-8'
  );
  fs.writeFileSync(
    path.join(exportDir, 'registry', 'buckets.json'),
    JSON.stringify(filteredBuckets, null, 2) + '\n',
    'utf-8'
  );
}

// ============================================================================
// Phase 7: Generate Claude Code Native Files
// ============================================================================

function generateNativeFiles(exportDir, deps) {
  const { generateForExport } = require('./generate-agents');

  const result = generateForExport({
    agentsDir: path.join(exportDir, 'agents'),
    teamsDir: path.join(exportDir, 'teams'),
    outputAgentsDir: path.join(exportDir, '.claude', 'agents'),
    outputSkillsDir: path.join(exportDir, '.claude', 'skills'),
    agentFilter: deps.agentIds,
    teamFilter: [deps.teamConfig.id],
  });

  return result;
}

// ============================================================================
// Phase 7.5: Export RAG Database
// ============================================================================

function exportRagDatabase(exportDir, deps) {
  // Look for SQLite RAG database
  const homeDir = process.env.HOME || process.env.USERPROFILE;
  const defaultDbPath = path.join(homeDir, '.wharfside', 'rag.db');
  const envDbPath = process.env.RAG_DB_PATH;
  const dbPath = envDbPath || defaultDbPath;

  if (!fs.existsSync(dbPath)) {
    return { skipped: true, reason: `RAG database not found at ${dbPath}` };
  }

  try {
    const destPath = path.join(exportDir, 'data', 'rag.db');
    fs.copyFileSync(dbPath, destPath);

    // Also copy WAL and SHM files if they exist (for consistency)
    const walPath = dbPath + '-wal';
    const shmPath = dbPath + '-shm';
    if (fs.existsSync(walPath)) {
      fs.copyFileSync(walPath, destPath + '-wal');
    }
    if (fs.existsSync(shmPath)) {
      fs.copyFileSync(shmPath, destPath + '-shm');
    }

    const stats = fs.statSync(destPath);
    const sizeMb = (stats.size / (1024 * 1024)).toFixed(1);
    return { success: true, destPath, sizeMb };
  } catch (err) {
    return { skipped: true, reason: `SQLite copy failed: ${err.message}` };
  }
}

// ============================================================================
// Phase 7.6: Generate Claude Code Settings
// ============================================================================

function generateClaudeSettings(exportDir, deps, mcpConfigs, platform) {
  // Build permission allow list from MCP servers
  const allowPatterns = [];
  for (const serverId of deps.mcpServers) {
    // Map server IDs to Claude Code MCP tool patterns
    const patterns = {
      'gmail': 'mcp__gmail__*',
      'gmail-personal': 'mcp__gmail-personal__*',
      'google-docs': 'mcp__google-docs-mcp__*',
      'pdfscribe': 'mcp__pdfscribe__*',
      'powerpoint': 'mcp__powerpoint__*',
      'openai-image': 'mcp__openai-image__*',
      'voicemode': 'mcp__voicemode__*',
    };
    if (patterns[serverId]) {
      allowPatterns.push(patterns[serverId]);
    }
  }

  // Build mcpServers config block
  const mcpServers = {};
  for (const [serverId, config] of Object.entries(mcpConfigs)) {
    // Map server IDs to Claude Code MCP server names
    const serverNames = {
      'gmail': 'gmail',
      'gmail-personal': 'gmail-personal',
      'google-docs': 'google-docs-mcp',
      'pdfscribe': 'pdfscribe',
      'powerpoint': 'powerpoint',
      'openai-image': 'openai-image',
      'voicemode': 'voicemode',
    };
    const name = serverNames[serverId] || serverId;
    mcpServers[name] = {
      type: config.type,
      command: config.command,
      args: config.args,
    };
    if (config.env && Object.keys(config.env).length > 0) {
      mcpServers[name].env = config.env;
    }
  }

  const settings = {
    permissions: {
      allow: allowPatterns,
    },
    mcpServers,
  };

  // Write settings.local.json (user-specific, not committed)
  const settingsDir = path.join(exportDir, '.claude');
  fs.mkdirSync(settingsDir, { recursive: true });
  fs.writeFileSync(
    path.join(settingsDir, 'settings.local.json'),
    JSON.stringify(settings, null, 2) + '\n',
    'utf-8'
  );

  return settings;
}

// ============================================================================
// Phase 8: Generate Documentation
// ============================================================================

function generateDocumentation(exportDir, deps, options = {}) {
  const teamId = deps.teamConfig.id;
  const teamName = deps.teamConfig.name;
  const skillAlias = deps.teamConfig.skill_alias || teamId;
  const { platform = 'auto', noDocker = true } = options;

  // --- CLAUDE.md ---
  const claudeMd = generateClaudeMd(deps, skillAlias);
  fs.writeFileSync(path.join(exportDir, 'CLAUDE.md'), claudeMd, 'utf-8');

  // --- README.md ---
  const readme = generateReadme(deps, skillAlias, platform);
  fs.writeFileSync(path.join(exportDir, 'README.md'), readme, 'utf-8');

  // --- .env.example ---
  const envExample = generateEnvExample(deps);
  fs.writeFileSync(path.join(exportDir, '.env.example'), envExample, 'utf-8');

  // --- mcp-servers/SETUP.md ---
  const mcpSetup = generateMcpSetup(deps, noDocker);
  fs.writeFileSync(path.join(exportDir, 'mcp-servers', 'SETUP.md'), mcpSetup, 'utf-8');

  // --- setup.sh (Mac/Linux) ---
  const setupSh = generateSetupSh(deps, skillAlias);
  fs.writeFileSync(path.join(exportDir, 'setup.sh'), setupSh, 'utf-8');
  fs.chmodSync(path.join(exportDir, 'setup.sh'), '755');

  // --- install.ps1 (Windows) ---
  if (platform === 'windows' || platform === 'auto') {
    const installPs1 = generateInstallPs1(deps, skillAlias);
    fs.writeFileSync(path.join(exportDir, 'install.ps1'), installPs1, 'utf-8');
  }

  // --- docs/GOOGLE-OAUTH-SETUP.md ---
  fs.mkdirSync(path.join(exportDir, 'docs'), { recursive: true });
  const oauthGuide = generateCredentialGuide(deps);
  fs.writeFileSync(path.join(exportDir, 'docs', 'GOOGLE-OAUTH-SETUP.md'), oauthGuide, 'utf-8');

  // --- .gitignore ---
  const gitignore = generateGitignore();
  fs.writeFileSync(path.join(exportDir, '.gitignore'), gitignore, 'utf-8');

  // --- Copy voice skills if voicemode is a dependency ---
  if (deps.mcpServers.includes('voicemode')) {
    copyVoiceSkills(exportDir);
  }

  // --- Copy generate-agents.js (sanitized) ---
  const genScript = fs.readFileSync(path.join(ROOT, 'scripts', 'generate-agents.js'), 'utf-8');
  fs.writeFileSync(
    path.join(exportDir, 'scripts', 'generate-agents.js'),
    sanitizeString(genScript),
    'utf-8'
  );

  // --- Copy MCP server source files ---
  copyMcpServerSources(exportDir, deps);
}

function copyVoiceSkills(exportDir) {
  const skillsToCopy = [
    { src: '.claude/skills/voice/SKILL.md', dest: '.claude/skills/voice/SKILL.md' },
    { src: '.claude/skills/end-voice/SKILL.md', dest: '.claude/skills/end-voice/SKILL.md' },
  ];
  const commandsToCopy = [
    { src: '.claude/commands/voice.md', dest: '.claude/commands/voice.md' },
  ];

  for (const item of [...skillsToCopy, ...commandsToCopy]) {
    const srcPath = path.join(ROOT, item.src);
    if (fs.existsSync(srcPath)) {
      const destPath = path.join(exportDir, item.dest);
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      const content = fs.readFileSync(srcPath, 'utf-8');
      fs.writeFileSync(destPath, sanitizeString(content), 'utf-8');
    }
  }
}

function generateClaudeMd(deps, skillAlias) {
  const teamName = deps.teamConfig.name;
  const lines = [
    '# CLAUDE.md',
    '',
    `This is the **${teamName}** — a portable agent team exported from Agent Architect.`,
    '',
    '## User Configuration',
    '',
    'Update these with your own contact details:',
    '- **Board Email:** Set `YOUR_BOARD_EMAIL` in agent configs',
    '- **Personal Email:** Set `YOUR_PERSONAL_EMAIL` in agent configs',
    '',
    '## Smart Routing',
    '',
    `All requests are routed through the team orchestrator. Invoke it with \`/${skillAlias}\`.`,
    '',
    `| Topic | Invoke |`,
    `|---|---|`,
    `| Any request for this team | \`/${skillAlias}\` |`,
    '',
    '## Setup',
    '',
    'See `README.md` for full setup instructions.',
    '',
    '## Architecture',
    '',
    '```',
    'agents/<agent-id>/          Source agent definitions',
    '  SKILL.md                  Behavioral instructions',
    '  config.json               Configuration',
    '',
    'teams/<team-id>/            Team definition',
    '  team.json                 Members, routing, orchestration',
    '',
    '.claude/agents/             Generated Claude Code agents',
    '.claude/skills/             Generated skills (specialists + orchestrator)',
    '```',
    '',
    '## Regenerating Native Files',
    '',
    'After modifying agent configs or skills:',
    '```bash',
    'node scripts/generate-agents.js',
    '```',
    '',
  ];

  return lines.join('\n');
}

function generateReadme(deps, skillAlias, platform) {
  const teamName = deps.teamConfig.name;

  const lines = [
    `# ${teamName}`,
    '',
    'AI assistant for Wharfside Manor condo management.',
    '',
    '## What It Can Do',
    '',
    '- **Search emails** - Find board emails by topic, person, or date',
    '- **Governing documents** - Look up and explain rules, bylaws, and policies',
    '- **Monthly bulletins** - Generate community newsletters from recent activity',
    '- **Vendor proposals** - Review, compare, and summarize contractor proposals',
    '- **Presentations** - Create PowerPoint decks for board meetings',
    '- **PDF transcription** - Convert scanned PDFs into searchable text',
    '- **Voice interaction** - Talk to it using your microphone',
    '- **Official communications** - Draft board notices, policy explainers, and owner letters',
    '',
    '## Requirements',
    '',
  ];

  if (platform === 'windows') {
    lines.push(
      '- Windows 10 or 11',
      '- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) subscription',
      '- [Node.js 18+](https://nodejs.org/) (LTS recommended)',
      '- [Python 3.10+](https://www.python.org/downloads/)',
      '- Google account for email access',
      '- Internet connection',
      '- Microphone and speakers (for voice mode)',
    );
  } else {
    lines.push(
      '- macOS 12+ or Linux',
      '- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) subscription',
      '- Node.js 18+ and Python 3.10+',
      '- Google account for email access',
    );
  }

  lines.push(
    '',
    '## Setup',
    '',
  );

  if (platform === 'windows') {
    lines.push(
      '### Windows',
      '',
      '1. **Install Claude Code** - Follow the signup guide at [claude.ai](https://claude.ai)',
      '2. **Open PowerShell** in this folder',
      '3. **Run the installer:**',
      '   ```powershell',
      '   .\\install.ps1',
      '   ```',
      '4. **Follow the prompts** - the installer will walk you through everything',
      '',
    );
  }

  lines.push(
    '### Mac / Linux',
    '',
    '1. Install Claude Code: `npm install -g @anthropic-ai/claude-code`',
    '2. Run the setup script: `./setup.sh`',
    '3. Follow the prompts',
    '',
    '## Daily Usage',
    '',
    'Open a terminal in this folder and start Claude:',
    '',
    '```',
    'claude',
    '```',
    '',
    'Then try any of these:',
    '',
    `- **Voice mode:** Type \`/voice\` to start talking`,
    `- **Search email:** \`/${skillAlias} search email for insurance renewal\``,
    `- **Find a rule:** \`/${skillAlias} what does the governing docs say about parking?\``,
    `- **Generate bulletin:** \`/${skillAlias} generate this month\'s bulletin\``,
    `- **Review proposal:** \`/${skillAlias} review the attached vendor proposal\``,
    '',
    '## Team Members',
    '',
    '| Assistant | What It Does |',
    '|---|---|',
  );

  // Clean up role descriptions for non-technical audience
  const friendlyRoles = {
    'rag-search': 'Searches across all indexed governing documents by meaning, not just keywords',
    'pdf-scribe': 'Converts scanned PDFs into searchable text',
  };

  for (const member of deps.teamConfig.members) {
    const config = deps.agentConfigs[member.agent_id];
    const name = member.agent_id === 'rag-search' ? 'Document Search' : (config?.name || member.agent_id);
    const role = friendlyRoles[member.agent_id] || member.role;
    lines.push(`| ${name} | ${role} |`);
  }

  lines.push(
    '',
    '## Troubleshooting',
    '',
    '### "Server not connected" or tools not working',
    'Run the install script again - it will check all connections and fix common issues.',
    '',
    '### Search returns no results',
    'The document index may need to be rebuilt. Ask Claude:',
    `\`/${skillAlias} re-index the governing documents\``,
    '',
    '### Voice mode not working',
    'Make sure your microphone is enabled and you have speakers or headphones connected.',
    'Try running `uvx voice-mode` in a terminal to test if the voice system is installed.',
    '',
    '### Need help?',
    'Contact the board technology contact for assistance.',
    '',
  );

  return lines.join('\n');
}

function generateEnvExample(deps) {
  const lines = [
    '# Environment variables for the Wharfside Board Assistant',
    '# Copy this file to .env and fill in your values',
    '# The install script will help you set these up',
    '',
    '# === Required API Keys ===',
    '',
    '# Anthropic API Key (comes with Claude Code subscription)',
    '# Get it at: https://console.anthropic.com/settings/keys',
    'ANTHROPIC_API_KEY=sk-ant-...',
    '',
    '# OpenAI API Key (for document search embeddings and image generation)',
    '# Get it at: https://platform.openai.com/api-keys',
    '# Expected cost: $5-20/month depending on usage',
    'OPENAI_API_KEY=sk-...',
    '',
  ];

  if (deps.mcpServers.includes('google-docs')) {
    lines.push(
      '# === Google Docs API ===',
      '# Set up via docs/GOOGLE-OAUTH-SETUP.md',
      'GOOGLE_DOCS_CLIENT_ID=',
      'GOOGLE_DOCS_CLIENT_SECRET=',
      'GOOGLE_DOCS_REFRESH_TOKEN=',
      '',
    );
  }

  lines.push(
    '# === Auto-configured by install script ===',
    '',
    '# Gmail OAuth credentials path',
    '# GMAIL_CREDS_PATH=~/.config/mcp-gmail',
    '',
    '# RAG database location (SQLite)',
    'RAG_DB_PATH=./data/rag.db',
    '',
    '# PowerPoint templates',
    'POWERPOINT_TEMPLATES_PATH=./templates',
    '',
  );

  return lines.join('\n');
}

function generateMcpSetup(deps, noDocker = true) {
  // Load server registry
  const registryPath = path.join(ROOT, 'mcp-servers', 'registry', 'servers.json');
  let serverRegistry = {};
  if (fs.existsSync(registryPath)) {
    serverRegistry = JSON.parse(fs.readFileSync(registryPath, 'utf-8')).servers || {};
  }

  const lines = [
    '# MCP Server Setup',
    '',
    'This team requires the following MCP servers. Install and configure each one before using the team.',
    '',
  ];

  for (const serverId of deps.mcpServers) {
    const server = serverRegistry[serverId];
    if (!server) {
      lines.push(`## ${serverId}`, '', 'No registry entry found. Configure manually.', '');
      continue;
    }

    lines.push(`## ${server.name}`, '');

    if (server.package) {
      lines.push(`**Package:** \`${server.package}\``);
    }
    if (server.type) {
      lines.push(`**Type:** ${server.type}`);
    }
    if (server.status === 'deprecated') {
      lines.push(`**Status:** DEPRECATED - ${server.deprecated_reason || ''}`);
    }
    lines.push('');

    // Auth instructions
    if (server.auth === 'oauth') {
      lines.push(
        '### Authentication (OAuth)',
        '',
        '1. Create a Google Cloud project (or reuse an existing one)',
        '2. Enable the relevant API (Gmail, Google Docs, etc.)',
        '3. Create OAuth 2.0 credentials (Desktop application type)',
        '4. Download the credentials JSON',
      );
      if (server.credentials?.pattern) {
        lines.push(`5. Place credentials in: \`${server.credentials.pattern}\``);
      }
      if (server.credentials?.required) {
        lines.push(`6. Required files: ${server.credentials.required.join(', ')}`);
      }
      if (server.credentials?.notes) {
        lines.push(`7. Notes: ${server.credentials.notes}`);
      }
      lines.push('');
    } else if (server.auth === 'api_key') {
      lines.push('### Authentication (API Key)', '');
      if (server.credentials?.required) {
        lines.push(`Set these environment variables: ${server.credentials.required.join(', ')}`);
      }
      if (server.credentials?.required_one_of) {
        lines.push(`Set at least one of: ${server.credentials.required_one_of.join(', ')}`);
      }
      if (server.credentials?.notes) {
        lines.push(`Notes: ${server.credentials.notes}`);
      }
      lines.push('');
    } else if (server.auth === 'none') {
      lines.push('### Authentication', '', 'No authentication required.', '');
      if (server.credentials?.notes) {
        lines.push(`Notes: ${server.credentials.notes}`, '');
      }
    }

    // Claude Code config
    if (server.claude_code_config) {
      lines.push('### Claude Code Configuration', '', 'Add to your Claude Code MCP settings:', '', '```json');
      lines.push(JSON.stringify(server.claude_code_config, null, 2));
      lines.push('```', '');
    }

    lines.push('---', '');
  }

  return lines.join('\n');
}

function generateSetupSh(deps, skillAlias) {
  const teamName = deps.teamConfig.name;

  const lines = [
    '#!/bin/bash',
    `# Setup script for ${teamName}`,
    '# Run this after cloning the repository',
    '',
    'set -e',
    '',
    'echo "======================================"',
    `echo "  ${teamName} Setup"`,
    'echo "======================================"',
    'echo ""',
    '',
    '# ---- Step 1: Check prerequisites ----',
    'echo "Step 1: Checking prerequisites..."',
    'MISSING=0',
    '',
    'if ! command -v node &> /dev/null; then',
    '  echo "  [MISSING] Node.js - Install from https://nodejs.org/"',
    '  MISSING=1',
    'else',
    '  echo "  [OK] Node.js $(node --version)"',
    'fi',
    '',
    'if ! command -v python3 &> /dev/null; then',
    '  echo "  [MISSING] Python 3 - Install from https://www.python.org/"',
    '  MISSING=1',
    'else',
    '  echo "  [OK] Python $(python3 --version 2>&1 | cut -d\\" \\" -f2)"',
    'fi',
    '',
    'if ! command -v uv &> /dev/null; then',
    '  echo "  [MISSING] uv (Python package manager)"',
    '  echo "  Install: curl -LsSf https://astral.sh/uv/install.sh | sh"',
    '  MISSING=1',
    'else',
    '  echo "  [OK] uv $(uv --version 2>&1 | head -1)"',
    'fi',
    '',
    'if ! command -v claude &> /dev/null; then',
    '  echo "  [MISSING] Claude Code CLI"',
    '  echo "  Install: npm install -g @anthropic-ai/claude-code"',
    '  MISSING=1',
    'else',
    '  echo "  [OK] Claude Code installed"',
    'fi',
    '',
    'if [ $MISSING -eq 1 ]; then',
    '  echo ""',
    '  echo "Please install the missing dependencies and re-run this script."',
    '  exit 1',
    'fi',
    '',
    '# ---- Step 2: Environment file ----',
    'echo ""',
    'echo "Step 2: Setting up environment..."',
    'if [ ! -f .env ]; then',
    '  cp .env.example .env',
    '  echo "  Created .env from template."',
    '  echo "  Please edit .env with your API keys, then re-run this script."',
    '  echo "  See docs/GOOGLE-OAUTH-SETUP.md for Google credential setup."',
    '  exit 0',
    'fi',
    'echo "  [OK] .env file exists"',
    '',
    '# ---- Step 3: Test voice mode ----',
    'echo ""',
    'echo "Step 3: Testing voice mode..."',
    'if uvx voice-mode --help &> /dev/null; then',
    '  echo "  [OK] Voice mode available"',
    'else',
    '  echo "  [WARN] Voice mode test failed. You can still use text mode."',
    'fi',
    '',
    '# ---- Step 4: Test MCP servers ----',
    'echo ""',
    'echo "Step 4: Checking MCP server dependencies..."',
    'npx -y @gongrzhe/server-gmail-autoauth-mcp --version &>/dev/null && echo "  [OK] Gmail MCP" || echo "  [WARN] Gmail MCP needs setup"',
    'npx -y google-docs-mcp --version &>/dev/null && echo "  [OK] Google Docs MCP" || echo "  [WARN] Google Docs MCP needs setup"',
    '',
    '# ---- Step 5: Generate Claude Code files ----',
    'echo ""',
    'echo "Step 5: Generating Claude Code native agent files..."',
    'node scripts/generate-agents.js',
    '',
    '# ---- Step 6: Check RAG database ----',
    'echo ""',
    'echo "Step 6: Checking document database..."',
    'if [ -f data/rag.db ]; then',
    '  echo "  [OK] RAG database found (data/rag.db)"',
    'else',
    '  echo "  [INFO] No RAG database found. One will be created when documents are indexed."',
    'fi',
    '',
    'echo ""',
    'echo "======================================"',
    'echo "  Setup Complete!"',
    'echo "======================================"',
    'echo ""',
    'echo "To start: open a terminal here and type: claude"',
    `echo "Then try: /voice"`,
    `echo "Or type:  /${skillAlias} search email for insurance renewal"`,
    'echo ""',
  ];

  return lines.join('\n');
}

function generateInstallPs1(deps, skillAlias) {
  const teamName = deps.teamConfig.name;

  return `# ${teamName} - Windows Installer
# Run this script in PowerShell: .\\install.ps1

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  ${teamName}" -ForegroundColor Cyan
Write-Host "  Windows Setup" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Resume support - picks up where we left off if interrupted
$progressFile = ".setup-progress"
$lastStep = 0
if (Test-Path $progressFile) {
    $lastStep = [int](Get-Content $progressFile)
    if ($lastStep -gt 0) {
        Write-Host "Previous setup found (completed through step $lastStep)." -ForegroundColor Gray
        $resume = Read-Host "  Resume from step $($lastStep + 1), or start fresh? (r/f)"
        if ($resume -ne 'r') {
            $lastStep = 0
            Remove-Item $progressFile
            Write-Host "  Starting fresh." -ForegroundColor Gray
        } else {
            Write-Host "  Resuming from step $($lastStep + 1)..." -ForegroundColor Gray
        }
        Write-Host ""
    }
}

# ============================================================
# Step 1: Prerequisites Check
# ============================================================
if ($lastStep -lt 1) {
Write-Host "Step 1: Checking prerequisites..." -ForegroundColor Yellow

function Install-Dependency {
    param(
        [string]$Name,
        [string]$CheckCmd,
        [string]$WingetId,
        [string]$ManualUrl,
        [string]$NpmInstall,
        [string]$PsInstall
    )

    # Check if already installed
    try {
        $ver = Invoke-Expression $CheckCmd 2>&1 | Select-Object -First 1
        Write-Host "  [OK] $Name - $ver" -ForegroundColor Green
        return $true
    } catch {}

    Write-Host "  [MISSING] $Name" -ForegroundColor Red

    # Attempt auto-install
    if ($PsInstall) {
        $answer = Read-Host "  Install $Name now? (y/n)"
        if ($answer -eq 'y') {
            Write-Host "  Installing $Name..." -ForegroundColor Gray
            Invoke-Expression $PsInstall
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        }
    } elseif ($NpmInstall) {
        $answer = Read-Host "  Install $Name now? (y/n)"
        if ($answer -eq 'y') {
            Write-Host "  Installing $Name..." -ForegroundColor Gray
            Invoke-Expression $NpmInstall
        }
    } elseif ($WingetId) {
        $hasWinget = Get-Command winget -ErrorAction SilentlyContinue
        if ($hasWinget) {
            $answer = Read-Host "  Install $Name using winget? (y/n)"
            if ($answer -eq 'y') {
                winget install --id $WingetId --accept-package-agreements --accept-source-agreements
                $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
            }
        } else {
            Write-Host "  Download from: $ManualUrl" -ForegroundColor Gray
            $answer = Read-Host "  Open download page in browser? (y/n)"
            if ($answer -eq 'y') { Start-Process $ManualUrl }
            Read-Host "  Press Enter after installing $Name..."
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        }
    }

    # Re-verify after install attempt
    try {
        $ver = Invoke-Expression $CheckCmd 2>&1 | Select-Object -First 1
        Write-Host "  [OK] $Name - $ver" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "  [FAILED] $Name still not found after install attempt" -ForegroundColor Red
        return $false
    }
}

$ok = $true
$ok = (Install-Dependency -Name "Node.js" -CheckCmd "node --version" -WingetId "OpenJS.NodeJS.LTS" -ManualUrl "https://nodejs.org/") -and $ok
$ok = (Install-Dependency -Name "Python" -CheckCmd "python --version" -WingetId "Python.Python.3.13" -ManualUrl "https://www.python.org/downloads/") -and $ok
$ok = (Install-Dependency -Name "uv" -CheckCmd "uv --version" -PsInstall "irm https://astral.sh/uv/install.ps1 | iex") -and $ok
$ok = (Install-Dependency -Name "Claude Code" -CheckCmd "claude --version" -NpmInstall "npm install -g @anthropic-ai/claude-code") -and $ok

if (-not $ok) {
    Write-Host ""
    Write-Host "Some dependencies could not be installed." -ForegroundColor Red
    Write-Host "Please install them manually and re-run this script." -ForegroundColor Red
    exit 1
}

Set-Content $progressFile "1"
}

# ============================================================
# Step 2: Voice Mode Setup (PRIORITY)
# ============================================================
if ($lastStep -lt 2) {
Write-Host ""
Write-Host "Step 2: Setting up Voice Mode..." -ForegroundColor Yellow
try {
    uvx voice-mode --help 2>&1 | Out-Null
    Write-Host "  [OK] Voice mode ready!" -ForegroundColor Green
    Write-Host "  Use /voice after starting Claude to talk to your assistant." -ForegroundColor Gray
} catch {
    Write-Host "  [WARN] Voice mode test failed." -ForegroundColor DarkYellow
    Write-Host "  Windows may need PortAudio: https://www.portaudio.com/" -ForegroundColor Gray
    Write-Host "  You can still use text mode." -ForegroundColor Gray
}

Set-Content $progressFile "2"
}

# ============================================================
# Step 3: Google OAuth Setup (Interactive)
# ============================================================
if ($lastStep -lt 3) {
Write-Host ""
Write-Host "Step 3: Google Account Setup" -ForegroundColor Yellow
Write-Host ""
Write-Host "  To access Gmail and Google Docs, you need Google OAuth credentials." -ForegroundColor Gray
Write-Host "  See docs\\GOOGLE-OAUTH-SETUP.md for step-by-step instructions." -ForegroundColor Gray
Write-Host ""

$setupGoogle = Read-Host "  Have you already set up Google OAuth? (y/n)"
if ($setupGoogle -eq "y") {
    # Gmail credentials
    $credsPath = Read-Host "  Enter path to your downloaded gcp-oauth.keys.json"
    if (Test-Path $credsPath) {
        $gmailDir = "$env:USERPROFILE\\.config\\mcp-gmail"
        New-Item -ItemType Directory -Path $gmailDir -Force | Out-Null
        Copy-Item $credsPath "$gmailDir\\gcp-oauth.keys.json"
        Write-Host "  [OK] Gmail credentials installed" -ForegroundColor Green
        Write-Host "  Note: On first use, a browser window will open for Gmail authorization." -ForegroundColor Gray
    } else {
        Write-Host "  [SKIP] File not found. Set up later per docs/GOOGLE-OAUTH-SETUP.md" -ForegroundColor DarkYellow
    }
} else {
    Write-Host "  [SKIP] Set up Google OAuth later using docs\\GOOGLE-OAUTH-SETUP.md" -ForegroundColor DarkYellow
}

Set-Content $progressFile "3"
}

# ============================================================
# Step 4: API Keys
# ============================================================
if ($lastStep -lt 4) {
Write-Host ""
Write-Host "Step 4: API Keys" -ForegroundColor Yellow

# Check for .env file
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "  Created .env from template." -ForegroundColor Gray
}

# Anthropic API Key
$anthropicKey = [System.Environment]::GetEnvironmentVariable("ANTHROPIC_API_KEY", "User")
if ($anthropicKey) {
    Write-Host "  [OK] ANTHROPIC_API_KEY already set" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "  Anthropic API Key is needed for Claude." -ForegroundColor Gray
    Write-Host "  This usually comes with your Claude Code subscription." -ForegroundColor Gray
    Write-Host "  Get it at: https://console.anthropic.com/settings/keys" -ForegroundColor Gray
    $key = Read-Host "  Enter your ANTHROPIC_API_KEY (or press Enter to skip)"
    if ($key) {
        [System.Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY", $key, "User")
        $env:ANTHROPIC_API_KEY = $key
        (Get-Content .env) -replace "ANTHROPIC_API_KEY=.*", "ANTHROPIC_API_KEY=$key" | Set-Content .env
        Write-Host "  [OK] ANTHROPIC_API_KEY saved" -ForegroundColor Green
    }
}

# OpenAI API Key
Write-Host ""
Write-Host "  OpenAI API Key is used for document search and image generation." -ForegroundColor Gray
Write-Host "  Expected cost: ~\\$5-20/month depending on usage." -ForegroundColor Gray
Write-Host "  Get it at: https://platform.openai.com/api-keys" -ForegroundColor Gray
$openaiKey = Read-Host "  Enter your OPENAI_API_KEY (or press Enter to skip)"
if ($openaiKey) {
    [System.Environment]::SetEnvironmentVariable("OPENAI_API_KEY", $openaiKey, "User")
    $env:OPENAI_API_KEY = $openaiKey
    (Get-Content .env) -replace "OPENAI_API_KEY=.*", "OPENAI_API_KEY=$openaiKey" | Set-Content .env
    Write-Host "  [OK] OPENAI_API_KEY saved" -ForegroundColor Green
}

Set-Content $progressFile "4"
}

# ============================================================
# Step 5: Checking Tools
# ============================================================
if ($lastStep -lt 5) {
Write-Host ""
Write-Host "Step 5: Checking tools..." -ForegroundColor Yellow

$npxOk = Get-Command npx -ErrorAction SilentlyContinue
$uvxOk = Get-Command uvx -ErrorAction SilentlyContinue

if ($npxOk) {
    Write-Host "  [OK] npx available" -ForegroundColor Green
    Write-Host "  Pre-downloading tools (one time)..." -ForegroundColor Gray
    $npmPkgs = @(
        "@gongrzhe/server-gmail-autoauth-mcp",
        "google-docs-mcp",
        "@lpenguin/openai-image-mcp"
    )
    foreach ($pkg in $npmPkgs) {
        Write-Host "    Caching $pkg..." -ForegroundColor Gray
        npm cache add $pkg 2>&1 | Out-Null
    }
    Write-Host "  [OK] Gmail, Google Docs, Image Generation ready" -ForegroundColor Green
} else {
    Write-Host "  [WARN] npx not found - Gmail, Google Docs, Image Generation need Node.js" -ForegroundColor DarkYellow
}

if ($uvxOk) {
    Write-Host "  [OK] Voice, PDF Transcription, PowerPoint (via uvx)" -ForegroundColor Green
} else {
    Write-Host "  [WARN] uvx not found - Voice, PDF, PowerPoint need uv" -ForegroundColor DarkYellow
}

Set-Content $progressFile "5"
}

# ============================================================
# Step 6: Document Database
# ============================================================
if ($lastStep -lt 6) {
Write-Host ""
Write-Host "Step 6: Checking document database..." -ForegroundColor Yellow
if (Test-Path "data\\rag.db") {
    $dbSize = (Get-Item "data\\rag.db").Length / 1MB
    Write-Host "  [OK] Document database found ($([math]::Round($dbSize, 1)) MB)" -ForegroundColor Green
} else {
    Write-Host "  [INFO] No document database yet. One will be created when documents are indexed." -ForegroundColor Gray
}

Set-Content $progressFile "6"
}

# ============================================================
# Step 7: Generate Claude Code files
# ============================================================
if ($lastStep -lt 7) {
Write-Host ""
Write-Host "Step 7: Generating Claude Code agent files..." -ForegroundColor Yellow

# Resolve placeholders in settings
$settingsPath = ".claude\\settings.local.json"
if (Test-Path $settingsPath) {
    $settings = Get-Content $settingsPath -Raw

    # Project directory (forward slashes for JSON)
    $projectDir = (Get-Location).Path -replace '\\\\', '/'
    $settings = $settings -replace '\\{\\{PROJECT_DIR\\}\\}', $projectDir

    # API keys from environment (set in Step 4)
    if ($env:OPENAI_API_KEY) {
        $settings = $settings -replace '\\{\\{OPENAI_API_KEY\\}\\}', $env:OPENAI_API_KEY
    }
    if ($env:GOOGLE_DOCS_CLIENT_ID) {
        $settings = $settings -replace '\\{\\{GOOGLE_DOCS_CLIENT_ID\\}\\}', $env:GOOGLE_DOCS_CLIENT_ID
    }
    if ($env:GOOGLE_DOCS_CLIENT_SECRET) {
        $settings = $settings -replace '\\{\\{GOOGLE_DOCS_CLIENT_SECRET\\}\\}', $env:GOOGLE_DOCS_CLIENT_SECRET
    }
    if ($env:GOOGLE_DOCS_REFRESH_TOKEN) {
        $settings = $settings -replace '\\{\\{GOOGLE_DOCS_REFRESH_TOKEN\\}\\}', $env:GOOGLE_DOCS_REFRESH_TOKEN
    }

    Set-Content $settingsPath $settings -NoNewline
    Write-Host "  [OK] Settings configured" -ForegroundColor Green
}

node scripts/generate-agents.js
Write-Host "  [OK] Agent files generated" -ForegroundColor Green

Set-Content $progressFile "7"
}

# ============================================================
# Tool Readiness Summary
# ============================================================
Write-Host ""
Write-Host "Tool Status:" -ForegroundColor Yellow
$gmailCreds = Test-Path "$env:USERPROFILE\\.config\\mcp-gmail\\gcp-oauth.keys.json"
if ($gmailCreds) {
    Write-Host "  [OK] Gmail - credentials found" -ForegroundColor Green
} else {
    Write-Host "  [--] Gmail - needs Google OAuth setup (see docs\\GOOGLE-OAUTH-SETUP.md)" -ForegroundColor DarkYellow
}

if ($env:OPENAI_API_KEY -and $env:OPENAI_API_KEY -ne '{{OPENAI_API_KEY}}') {
    Write-Host "  [OK] Image Generation - API key set" -ForegroundColor Green
} else {
    Write-Host "  [--] Image Generation - needs OpenAI API key" -ForegroundColor DarkYellow
}

Write-Host "  [OK] Voice Mode - no credentials needed" -ForegroundColor Green
Write-Host "  [OK] PDF Transcription - no credentials needed" -ForegroundColor Green

# ============================================================
# Step 8: Complete!
# ============================================================
Remove-Item $progressFile -ErrorAction SilentlyContinue
Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "  To start:" -ForegroundColor White
Write-Host "    Open a terminal in this folder" -ForegroundColor Gray
Write-Host "    Type: claude" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Then try:" -ForegroundColor White
Write-Host "    /voice                          (talk to your assistant)" -ForegroundColor Cyan
Write-Host "    /${skillAlias} search email for insurance  (search board email)" -ForegroundColor Cyan
Write-Host "    /${skillAlias} generate this month's bulletin" -ForegroundColor Cyan
Write-Host ""
`;
}

function generateCredentialGuide(deps) {
  return `# Google OAuth Setup Guide

This guide walks you through setting up Google OAuth credentials so the assistant
can access Gmail and Google Docs on your behalf.

**Time needed:** About 15 minutes

---

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with the Google account you want the assistant to access
3. Click **Select a project** (top bar) > **New Project**
4. Name it something like "Wharfside Assistant"
5. Click **Create**
6. Make sure your new project is selected in the top bar

## Step 2: Enable APIs

Enable these two APIs for your project:

1. **Gmail API:**
   - Go to [Gmail API page](https://console.cloud.google.com/apis/library/gmail.googleapis.com)
   - Click **Enable**

2. **Google Docs API:**
   - Go to [Google Docs API page](https://console.cloud.google.com/apis/library/docs.googleapis.com)
   - Click **Enable**

## Step 3: Configure OAuth Consent Screen

1. Go to [OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent)
2. Choose **External** (or Internal if you have Google Workspace)
3. Fill in:
   - **App name:** Wharfside Assistant
   - **User support email:** Your email
   - **Developer contact:** Your email
4. Click **Save and Continue**
5. On the **Scopes** page, click **Add or Remove Scopes**
   - Add: \`https://mail.google.com/\`
   - Add: \`https://www.googleapis.com/auth/documents\`
   - Add: \`https://www.googleapis.com/auth/drive.file\`
6. Click **Save and Continue**
7. On the **Test Users** page, add your email address
8. Click **Save and Continue**

## Step 4: Create OAuth Credentials

1. Go to [Credentials page](https://console.cloud.google.com/apis/credentials)
2. Click **+ Create Credentials** > **OAuth client ID**
3. Application type: **Desktop app**
4. Name: "Wharfside Assistant Desktop"
5. Click **Create**
6. Click **Download JSON** to download the credentials file
7. Save the file - you'll need it in the next step

## Step 5: Install Credentials

### For Gmail:

**Windows:**
\`\`\`
mkdir %USERPROFILE%\\.config\\mcp-gmail
copy <path-to-downloaded-file> %USERPROFILE%\\.config\\mcp-gmail\\gcp-oauth.keys.json
\`\`\`

**Mac/Linux:**
\`\`\`bash
mkdir -p ~/.config/mcp-gmail
cp <path-to-downloaded-file> ~/.config/mcp-gmail/gcp-oauth.keys.json
\`\`\`

The first time you use the Gmail tool, a browser window will automatically open
asking you to authorize access. After you approve, a \`token.json\` file will be
created automatically.

### For Google Docs:

The Google Docs MCP server needs the client ID, client secret, and a refresh token
from the same OAuth credentials.

1. Open the downloaded JSON file in a text editor
2. Find \`client_id\` and \`client_secret\` values
3. Add them to your \`.env\` file:
   \`\`\`
   GOOGLE_DOCS_CLIENT_ID=your-client-id-here
   GOOGLE_DOCS_CLIENT_SECRET=your-client-secret-here
   \`\`\`
4. To get the refresh token, run the install script or follow the
   [Google OAuth2 Playground](https://developers.google.com/oauthplayground/)
   to exchange the client credentials for a refresh token

## Troubleshooting

### "Access blocked: This app's request is invalid"
- Make sure you added your email as a test user (Step 3.7)
- Make sure the OAuth consent screen is configured

### "Token has been expired or revoked"
- Delete the \`token.json\` file and re-authorize
- Windows: \`del %USERPROFILE%\\.config\\mcp-gmail\\token.json\`
- Mac: \`rm ~/.config/mcp-gmail/token.json\`

### "API not enabled"
- Go back to Step 2 and make sure both APIs are enabled
- Make sure you're in the correct Google Cloud project
`;
}

function copyMcpServerSources(exportDir, deps) {
  // Copy MCP server Python files needed for the export
  const serversToCopy = {
    'pdfscribe': 'mcp-servers/images/pdfscribe/pdfscribe_server.py',
    'powerpoint': 'mcp-servers/images/powerpoint/ppt_server.py',
  };

  for (const [serverId, relPath] of Object.entries(serversToCopy)) {
    if (!deps.mcpServers.includes(serverId)) continue;

    const srcPath = path.join(ROOT, relPath);
    if (fs.existsSync(srcPath)) {
      const destPath = path.join(exportDir, relPath);
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      const content = fs.readFileSync(srcPath, 'utf-8');
      fs.writeFileSync(destPath, sanitizeString(content), 'utf-8');
    }
  }
}

function generateGitignore() {
  return [
    '# Environment',
    '.env',
    '',
    '# Node',
    'node_modules/',
    '',
    '# Python',
    '__pycache__/',
    '*.pyc',
    '.venv/',
    '',
    '# OS',
    '.DS_Store',
    'Thumbs.db',
    '',
    '# Outputs',
    'outputs/',
    'workspace/',
    '',
    '# Claude Code local settings',
    '.claude/settings.local.json',
    '',
    '# OAuth tokens (auto-generated, sensitive)',
    'token.json',
    '',
  ].join('\n');
}

// ============================================================================
// Phase 9: Build Manifest
// ============================================================================

function buildManifest(exportDir, deps, options) {
  const teamId = deps.teamConfig.id;
  const today = new Date().toISOString();

  // Build file inventory
  const files = [];
  function walkDir(dir, prefix = '') {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        walkDir(path.join(dir, entry.name), relPath);
      } else {
        files.push(relPath);
      }
    }
  }
  walkDir(exportDir);

  const manifest = {
    export_version: '1.0',
    exported_at: today,
    source: 'Agent Architect',
    team: {
      id: teamId,
      name: deps.teamConfig.name,
      description: deps.teamConfig.description,
      version: deps.teamConfig.version,
    },
    agents: deps.agentIds.map(id => ({
      id,
      name: deps.agentConfigs[id]?.name || id,
      type: deps.agentConfigs[id]?.agent_type || 'specialist',
    })),
    mcp_servers: deps.mcpServers,
    infrastructure: deps.infraDeps,
    context_buckets: deps.contextBuckets,
    env_vars: collectEnvVars(deps),
    options: {
      include_docs: options.includeDocs,
    },
    file_count: files.length,
    files,
  };

  fs.writeFileSync(
    path.join(exportDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n',
    'utf-8'
  );

  return manifest;
}

function collectEnvVars(deps) {
  const vars = [
    'ANTHROPIC_API_KEY',
    'OPENAI_API_KEY',
  ];

  if (deps.mcpServers.includes('google-docs')) {
    vars.push('GOOGLE_DOCS_CLIENT_ID', 'GOOGLE_DOCS_CLIENT_SECRET', 'GOOGLE_DOCS_REFRESH_TOKEN');
  }

  vars.push('RAG_DB_PATH');

  return vars;
}

// ============================================================================
// Phase 10: Git Initialization
// ============================================================================

function initGitRepo(exportDir) {
  try {
    execSync('git init', { cwd: exportDir, stdio: 'pipe' });
    execSync('git add -A', { cwd: exportDir, stdio: 'pipe' });
    execSync('git commit -m "Initial export: Wharfside Board Assistant Team"', {
      cwd: exportDir,
      stdio: 'pipe',
    });
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}

// ============================================================================
// Dry Run
// ============================================================================

function printDryRun(deps) {
  const teamName = deps.teamConfig.name;
  console.log(`\nDry Run: Export "${teamName}"\n`);
  console.log('='.repeat(55));

  console.log(`\nTeam: ${deps.teamConfig.id} (${teamName})`);
  console.log(`Version: ${deps.teamConfig.version}`);
  console.log(`Skill alias: ${deps.teamConfig.skill_alias || deps.teamConfig.id}`);

  console.log(`\nAgents (${deps.agentIds.length}):`);
  for (const agentId of deps.agentIds) {
    const config = deps.agentConfigs[agentId];
    if (config) {
      console.log(`  - ${config.name} (${agentId}) [${config.agent_type}, ${config.execution?.model || 'sonnet'}]`);
    } else {
      console.log(`  - ${agentId} [NOT FOUND]`);
    }
  }

  console.log(`\nMCP Servers (${deps.mcpServers.length}):`);
  for (const server of deps.mcpServers) {
    console.log(`  - ${server}`);
  }

  console.log(`\nContext Buckets (${deps.contextBuckets.length}):`);
  for (const bucket of deps.contextBuckets) {
    console.log(`  - ${bucket}`);
  }

  console.log(`\nInfrastructure Dependencies:`);
  if (deps.infraDeps.length > 0) {
    for (const dep of deps.infraDeps) {
      console.log(`  - ${dep}`);
    }
  } else {
    console.log('  (none)');
  }

  console.log(`\nEnvironment Variables:`);
  const vars = collectEnvVars(deps);
  for (const v of vars) {
    console.log(`  - ${v}`);
  }

  console.log(`\nExport would create:`);
  console.log(`  - ${deps.agentIds.length} agent directories (SKILL.md + config.json)`);
  console.log(`  - 1 team directory (team.json)`);
  console.log(`  - ${deps.contextBuckets.length} context bucket(s)`);
  console.log(`  - ${deps.agentIds.length} .claude/agents/*.md files`);
  console.log(`  - ${deps.agentIds.length + 1} .claude/skills/ directories`);
  console.log(`  - .claude/settings.local.json (MCP server configs)`);
  console.log(`  - MCP CLI configs (npx/uvx, no Docker)`);
  console.log(`  - Filtered registries (agents.json, teams.json, buckets.json)`);
  console.log(`  - Documentation (CLAUDE.md, README.md, install.ps1, setup.sh, OAuth guide)`);
  console.log(`  - data/rag.db (SQLite RAG database, if available)`);

  console.log('\n' + '='.repeat(55));
  console.log('Dry run complete. No files written.\n');
}

// ============================================================================
// Main
// ============================================================================

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node scripts/export-team.js <team-id> [options]

Options:
  --output <path>        Output directory (default: exports/<team-id>/)
  --platform <platform>  Target platform: windows, mac, linux, auto (default: auto)
  --no-docs              Skip context bucket file contents
  --no-docker            Use npx/uvx CLI for all MCP servers (default)
  --init-git             Initialize export as a git repository
  --dry-run              Show what would be exported without writing
  --help                 Show this help message

Examples:
  node scripts/export-team.js wharfside-board-assistant
  node scripts/export-team.js wharfside-board-assistant --platform windows --init-git
  node scripts/export-team.js wharfside-board-assistant --dry-run
  node scripts/export-team.js wharfside-board-assistant --no-docs
  node scripts/export-team.js wharfside-board-assistant --output ~/Desktop/wharfside-export
`);
    process.exit(0);
  }

  // Parse arguments
  const teamId = args[0];
  let outputDir = null;
  let includeDocs = true;
  let dryRun = false;
  let platform = 'auto';
  let initGit = false;
  let noDocker = true; // CLI-only by default

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--output' && args[i + 1]) {
      outputDir = args[i + 1];
      i++;
    } else if (args[i] === '--platform' && args[i + 1]) {
      platform = args[i + 1];
      i++;
    } else if (args[i] === '--no-docs') {
      includeDocs = false;
    } else if (args[i] === '--no-docker') {
      noDocker = true;
    } else if (args[i] === '--init-git') {
      initGit = true;
    } else if (args[i] === '--dry-run') {
      dryRun = true;
    }
  }

  // Resolve platform
  if (platform === 'auto') {
    platform = process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'mac' : 'linux';
  }

  const exportDir = outputDir
    ? path.resolve(outputDir)
    : path.join(ROOT, 'exports', teamId);

  console.log(`\nTeam Export v1.0`);
  console.log('='.repeat(55));

  // Phase 1: Resolve dependencies
  console.log('\nPhase 1: Resolving dependencies...');
  const deps = resolveDependencies(teamId);
  console.log(`  Team: ${deps.teamConfig.name}`);
  console.log(`  Agents: ${deps.agentIds.length}`);
  console.log(`  MCP Servers: ${deps.mcpServers.length}`);
  console.log(`  Context Buckets: ${deps.contextBuckets.length}`);
  console.log(`  Infrastructure: ${deps.infraDeps.length > 0 ? deps.infraDeps.join(', ') : 'none'}`);

  if (dryRun) {
    printDryRun(deps);
    return;
  }

  // Check if export dir exists
  if (fs.existsSync(exportDir)) {
    console.log(`\n  Warning: Export directory already exists: ${exportDir}`);
    console.log('  Overwriting...');
    fs.rmSync(exportDir, { recursive: true });
  }

  // Phase 2: Create directory structure
  console.log('\nPhase 2: Creating directory structure...');
  createDirectoryStructure(exportDir);
  console.log('  [OK] Directory tree created');

  // Phase 3: Copy agent sources
  console.log('\nPhase 3: Copying agent sources...');
  const agentResults = copyAgentSources(exportDir, deps);
  for (const r of agentResults) {
    if (r.success) {
      console.log(`  [OK] ${r.agentId}`);
    } else {
      console.log(`  [ERROR] ${r.agentId}: ${r.error}`);
    }
  }

  // Phase 3.5: Generate MCP server configs (CLI-only)
  let mcpConfigs = {};
  if (noDocker) {
    console.log('\nPhase 3.5: Generating MCP server configs (CLI-only)...');
    mcpConfigs = generateMcpConfigs(exportDir, deps, platform);
    console.log(`  [OK] ${Object.keys(mcpConfigs).length} server configs`);
  }

  // Phase 4: Copy team definition
  console.log('\nPhase 4: Copying team definition...');
  copyTeamDefinition(exportDir, deps);
  console.log(`  [OK] ${deps.teamConfig.id}`);

  // Phase 5: Copy context buckets
  console.log(`\nPhase 5: Copying context buckets${includeDocs ? '' : ' (no-docs mode)'}...`);
  const bucketResults = copyContextBuckets(exportDir, deps, includeDocs);
  for (const r of bucketResults) {
    const docLabel = r.filesCopied ? ' (with files)' : ' (empty)';
    console.log(`  [OK] ${r.bucketId}${docLabel}`);
  }

  // Phase 6: Generate filtered registries
  console.log('\nPhase 6: Generating filtered registries...');
  generateFilteredRegistries(exportDir, deps);
  console.log('  [OK] agents.json, teams.json, buckets.json');

  // Phase 7: Generate Claude Code native files
  console.log('\nPhase 7: Generating Claude Code native files...');
  const genResult = generateNativeFiles(exportDir, deps);
  console.log(`  [OK] ${genResult.agentResults.success.length} agents, ${genResult.teamResults.success.length} team orchestrator(s)`);
  if (genResult.agentResults.errors.length > 0) {
    for (const e of genResult.agentResults.errors) {
      console.log(`  [ERROR] ${e.agentId}: ${e.error}`);
    }
  }

  // Phase 7.5: Export RAG database (SQLite)
  if (includeDocs) {
    console.log('\nPhase 7.5: Exporting RAG database (SQLite)...');
    const ragResult = exportRagDatabase(exportDir, deps);
    if (ragResult.success) {
      console.log(`  [OK] RAG database copied to data/rag.db (${ragResult.sizeMb} MB)`);
    } else if (ragResult.skipped) {
      console.log(`  [SKIP] ${ragResult.reason}`);
    }
  } else {
    console.log('\nPhase 7.5: Skipping RAG export (--no-docs)');
  }

  // Phase 7.6: Generate Claude Code settings
  console.log('\nPhase 7.6: Generating Claude Code settings...');
  const claudeSettings = generateClaudeSettings(exportDir, deps, mcpConfigs, platform);
  console.log(`  [OK] .claude/settings.local.json (${Object.keys(claudeSettings.mcpServers).length} servers)`);


  // Phase 8: Generate documentation
  console.log('\nPhase 8: Generating documentation...');
  generateDocumentation(exportDir, deps, { platform, noDocker });
  const docFiles = ['CLAUDE.md', 'README.md', '.env.example', 'SETUP.md', '.gitignore'];
  if (platform === 'windows') docFiles.push('install.ps1');
  docFiles.push('setup.sh');
  docFiles.push('docs/GOOGLE-OAUTH-SETUP.md');
  console.log(`  [OK] ${docFiles.join(', ')}`);

  // Phase 9: Build manifest
  console.log('\nPhase 9: Building manifest...');
  const manifest = buildManifest(exportDir, deps, { includeDocs });
  console.log(`  [OK] manifest.json (${manifest.file_count} files)`);

  // Phase 10: Git initialization (optional)
  if (initGit) {
    console.log('\nPhase 10: Initializing git repository...');
    const gitResult = initGitRepo(exportDir);
    if (gitResult.success) {
      console.log('  [OK] Git repo initialized with initial commit');
    } else {
      console.log(`  [ERROR] ${gitResult.error}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(55));
  console.log('Export complete!');
  console.log(`  Directory: ${exportDir}`);
  console.log(`  Files: ${manifest.file_count}`);
  console.log(`  Agents: ${deps.agentIds.length}`);
  console.log(`  MCP Servers: ${deps.mcpServers.length}`);
  console.log(`  Context Buckets: ${deps.contextBuckets.length}`);
  console.log(`  Platform: ${platform}`);
  if (initGit) {
    console.log('  Git: initialized');
  }
  console.log('');
}

main();
