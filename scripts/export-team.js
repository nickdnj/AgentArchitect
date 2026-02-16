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
      infraDeps.add('pgvector');
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
      copyDirRecursive(filesDir, destFilesDir);
      results.push({ bucketId, success: true, filesCopied: true });
    } else {
      // Create .gitkeep for empty dirs
      fs.writeFileSync(path.join(destFilesDir, '.gitkeep'), '', 'utf-8');
      results.push({ bucketId, success: true, filesCopied: false });
    }
  }

  return results;
}

const TEXT_EXTENSIONS = new Set(['.md', '.txt', '.json', '.html', '.htm', '.yml', '.yaml', '.csv', '.xml', '.sh']);

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
  if (!deps.infraDeps.includes('pgvector')) {
    return { skipped: true, reason: 'no pgvector dependency' };
  }

  // Build list of bucket IDs to filter
  const bucketIds = deps.contextBuckets;

  try {
    // Check if pg_dump is available
    execSync('which pg_dump', { stdio: 'pipe' });
  } catch {
    return { skipped: true, reason: 'pg_dump not found in PATH' };
  }

  try {
    // Check if the database is accessible
    execSync('pg_isready -h localhost -p 5433 -U rag', { stdio: 'pipe' });
  } catch {
    return { skipped: true, reason: 'pgvector database not running on localhost:5433' };
  }

  try {
    // Dump the schema first
    const schemaDump = execSync(
      'pg_dump -h localhost -p 5433 -U rag -d rag --schema-only --no-owner --no-privileges 2>/dev/null',
      { env: { ...process.env, PGPASSWORD: 'localdev' }, encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 }
    );

    // Dump data filtered by bucket_id
    const whereClause = bucketIds.map(id => `'${id}'`).join(', ');
    let dataDump = '';
    try {
      dataDump = execSync(
        `psql -h localhost -p 5433 -U rag -d rag -c "COPY (SELECT * FROM documents WHERE bucket_id IN (${whereClause})) TO STDOUT WITH CSV HEADER" 2>/dev/null`,
        { env: { ...process.env, PGPASSWORD: 'localdev' }, encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 }
      );
    } catch {
      // Table might not exist or be empty - that's OK
      dataDump = '-- No document data found for specified buckets\n';
    }

    // Write combined dump
    const dumpPath = path.join(exportDir, 'data', 'rag-dump.sql');
    const header = [
      '-- RAG Database Dump',
      `-- Exported: ${new Date().toISOString()}`,
      `-- Buckets: ${bucketIds.join(', ')}`,
      '-- Restore: psql -h localhost -p 5433 -U rag -d rag < data/rag-dump.sql',
      '',
      '-- Schema',
      schemaDump,
      '',
      '-- Data (filtered by bucket)',
      `-- Use: COPY documents FROM STDIN WITH CSV HEADER`,
      `-- Bucket filter: ${whereClause}`,
      '',
    ].join('\n');

    fs.writeFileSync(dumpPath, header, 'utf-8');
    if (dataDump && !dataDump.startsWith('--')) {
      fs.appendFileSync(dumpPath, `\n-- Document data CSV\n-- ${dataDump.split('\n')[0]}\n`, 'utf-8');
    }

    return { success: true, dumpPath };
  } catch (err) {
    return { skipped: true, reason: `pg_dump failed: ${err.message}` };
  }
}

// ============================================================================
// Phase 8: Generate Documentation
// ============================================================================

function generateDocumentation(exportDir, deps) {
  const teamId = deps.teamConfig.id;
  const teamName = deps.teamConfig.name;
  const skillAlias = deps.teamConfig.skill_alias || teamId;

  // --- CLAUDE.md ---
  const claudeMd = generateClaudeMd(deps, skillAlias);
  fs.writeFileSync(path.join(exportDir, 'CLAUDE.md'), claudeMd, 'utf-8');

  // --- README.md ---
  const readme = generateReadme(deps, skillAlias);
  fs.writeFileSync(path.join(exportDir, 'README.md'), readme, 'utf-8');

  // --- .env.example ---
  const envExample = generateEnvExample(deps);
  fs.writeFileSync(path.join(exportDir, '.env.example'), envExample, 'utf-8');

  // --- mcp-servers/SETUP.md ---
  const mcpSetup = generateMcpSetup(deps);
  fs.writeFileSync(path.join(exportDir, 'mcp-servers', 'SETUP.md'), mcpSetup, 'utf-8');

  // --- setup.sh ---
  const setupSh = generateSetupSh(deps, skillAlias);
  fs.writeFileSync(path.join(exportDir, 'setup.sh'), setupSh, 'utf-8');
  fs.chmodSync(path.join(exportDir, 'setup.sh'), '755');

  // --- docker-compose.yml ---
  const dockerSrc = path.join(ROOT, 'docker-compose.yml');
  if (fs.existsSync(dockerSrc)) {
    const content = fs.readFileSync(dockerSrc, 'utf-8');
    fs.writeFileSync(path.join(exportDir, 'docker-compose.yml'), sanitizeString(content), 'utf-8');
  }

  // --- .gitignore ---
  const gitignore = generateGitignore();
  fs.writeFileSync(path.join(exportDir, '.gitignore'), gitignore, 'utf-8');

  // --- Copy generate-agents.js (sanitized) ---
  const genScript = fs.readFileSync(path.join(ROOT, 'scripts', 'generate-agents.js'), 'utf-8');
  fs.writeFileSync(
    path.join(exportDir, 'scripts', 'generate-agents.js'),
    sanitizeString(genScript),
    'utf-8'
  );
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

function generateReadme(deps, skillAlias) {
  const teamName = deps.teamConfig.name;
  const teamId = deps.teamConfig.id;

  const lines = [
    `# ${teamName}`,
    '',
    deps.teamConfig.description,
    '',
    '## Prerequisites',
    '',
    '- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed and authenticated',
    '- Node.js 18+',
  ];

  if (deps.infraDeps.includes('pgvector')) {
    lines.push('- Docker Desktop (for pgvector database)');
  }

  if (deps.mcpServers.length > 0) {
    lines.push('- MCP server dependencies (see `mcp-servers/SETUP.md`)');
  }

  lines.push(
    '',
    '## Quick Setup',
    '',
    '```bash',
    '# 1. Clone or unzip this directory',
    '',
    '# 2. Run the setup script',
    './setup.sh',
    '',
    `# 3. Start using the team`,
    `# In Claude Code, type: /${skillAlias}`,
    '```',
    '',
    '## Manual Setup',
    '',
    '```bash',
    '# 1. Copy environment file and fill in your values',
    'cp .env.example .env',
    '# Edit .env with your credentials',
    '',
  );

  if (deps.infraDeps.includes('pgvector')) {
    lines.push(
      '# 2. Start the pgvector database',
      'docker compose up -d',
      '',
      '# 3. Restore the RAG database (if data/rag-dump.sql exists)',
      'psql -h localhost -p 5433 -U rag -d rag < data/rag-dump.sql',
      '',
    );
  }

  lines.push(
    '# 4. Set up MCP servers (see mcp-servers/SETUP.md)',
    '',
    '# 5. (Optional) Regenerate Claude Code native files',
    'node scripts/generate-agents.js',
    '```',
    '',
    '## Team Members',
    '',
    '| Agent | Role |',
    '|---|---|',
  );

  for (const member of deps.teamConfig.members) {
    const config = deps.agentConfigs[member.agent_id];
    const name = config?.name || member.agent_id;
    lines.push(`| ${name} | ${member.role} |`);
  }

  lines.push(
    '',
    '## MCP Server Dependencies',
    '',
  );

  if (deps.mcpServers.length > 0) {
    for (const server of deps.mcpServers) {
      lines.push(`- \`${server}\``);
    }
    lines.push('', 'See `mcp-servers/SETUP.md` for installation and configuration instructions.');
  } else {
    lines.push('No MCP servers required.');
  }

  lines.push(
    '',
    '## Usage',
    '',
    `Once set up, invoke the team in Claude Code by typing \`/${skillAlias}\` followed by your request.`,
    '',
    'Examples:',
    `- \`/${skillAlias} search governing documents for pet policy\``,
    `- \`/${skillAlias} generate this month\'s bulletin\``,
    `- \`/${skillAlias} review the attached vendor proposal\``,
    '',
    '## Troubleshooting',
    '',
    '### MCP servers not connecting',
    'Ensure all required MCP servers are installed and configured. Check `mcp-servers/SETUP.md`.',
    '',
    '### RAG search returns no results',
    'Ensure the pgvector database is running (`docker compose up -d`) and the dump has been restored.',
    '',
    '### Agents not found',
    'Run `node scripts/generate-agents.js` to regenerate Claude Code native files.',
    '',
  );

  return lines.join('\n');
}

function generateEnvExample(deps) {
  const lines = [
    '# Environment variables for the exported team',
    '# Copy this file to .env and fill in your values',
    '',
    '# === Email Configuration ===',
    '# Your board/organization email address',
    'BOARD_EMAIL=your-board-email@example.com',
    '',
    '# Your personal email address',
    'PERSONAL_EMAIL=your-personal-email@example.com',
    '',
  ];

  // Add MCP server specific env vars
  if (deps.mcpServers.includes('gmail') || deps.mcpServers.includes('gmail-personal')) {
    lines.push(
      '# === Gmail MCP Server ===',
      '# OAuth credentials for Gmail access',
      '# See mcp-servers/SETUP.md for setup instructions',
      '# GMAIL_OAUTH_CLIENT_ID=',
      '# GMAIL_OAUTH_CLIENT_SECRET=',
      '',
    );
  }

  if (deps.mcpServers.includes('google-docs')) {
    lines.push(
      '# === Google Docs MCP Server ===',
      '# GOOGLE_DOCS_CLIENT_ID=',
      '# GOOGLE_DOCS_CLIENT_SECRET=',
      '# GOOGLE_DOCS_REFRESH_TOKEN=',
      '',
    );
  }

  if (deps.mcpServers.includes('pdfscribe')) {
    lines.push(
      '# === PDFScribe / RAG ===',
      '# At least one AI provider key is required',
      'ANTHROPIC_API_KEY=',
      'OPENAI_API_KEY=',
      '',
      '# RAG database (default: local Docker pgvector)',
      'RAG_DB_HOST=localhost',
      'RAG_DB_PORT=5433',
      'RAG_DB_USER=rag',
      'RAG_DB_PASSWORD=localdev',
      '',
    );
  }

  if (deps.mcpServers.includes('openai-image')) {
    lines.push(
      '# === OpenAI Image Generation ===',
      'OPENAI_API_KEY=  # Same key as above if already set',
      '',
    );
  }

  if (deps.mcpServers.includes('powerpoint')) {
    lines.push(
      '# === PowerPoint MCP Server ===',
      '# Runs as a local Docker container, no credentials needed',
      '# Templates directory path (update if moved)',
      'POWERPOINT_TEMPLATES_DIR=./templates',
      '',
    );
  }

  if (deps.mcpServers.includes('voicemode')) {
    lines.push(
      '# === Voice Mode ===',
      '# VOICEMODE_API_KEY=',
      '',
    );
  }

  if (deps.infraDeps.includes('pgvector')) {
    lines.push(
      '# === Infrastructure ===',
      '# pgvector database (Docker Compose)',
      'POSTGRES_USER=rag',
      'POSTGRES_PASSWORD=localdev',
      'POSTGRES_DB=rag',
      '',
    );
  }

  return lines.join('\n');
}

function generateMcpSetup(deps) {
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
  const hasPgvector = deps.infraDeps.includes('pgvector');

  const lines = [
    '#!/bin/bash',
    `# Setup script for ${teamName}`,
    '# Run this after cloning/unzipping the export',
    '',
    'set -e',
    '',
    'echo "=================================="',
    `echo "  ${teamName} Setup"`,
    'echo "=================================="',
    'echo ""',
    '',
    '# Check prerequisites',
    'echo "Checking prerequisites..."',
    '',
    'if ! command -v node &> /dev/null; then',
    '  echo "ERROR: Node.js is not installed. Please install Node.js 18+."',
    '  exit 1',
    'fi',
    'echo "  [OK] Node.js $(node --version)"',
    '',
    'if ! command -v claude &> /dev/null; then',
    '  echo "WARNING: Claude Code CLI not found. Install it from https://docs.anthropic.com/en/docs/claude-code"',
    'fi',
    '',
  ];

  if (hasPgvector) {
    lines.push(
      'if ! command -v docker &> /dev/null; then',
      '  echo "WARNING: Docker not found. Required for pgvector database."',
      '  echo "  Install Docker Desktop: https://www.docker.com/products/docker-desktop"',
      'fi',
      '',
    );
  }

  lines.push(
    '# Set up environment file',
    'if [ ! -f .env ]; then',
    '  echo ""',
    '  echo "Creating .env from .env.example..."',
    '  cp .env.example .env',
    '  echo "  Please edit .env with your credentials before proceeding."',
    '  echo "  Then re-run this script."',
    '  exit 0',
    'fi',
    'echo "  [OK] .env file exists"',
    '',
  );

  if (hasPgvector) {
    lines.push(
      '# Start pgvector database',
      'if command -v docker &> /dev/null; then',
      '  echo ""',
      '  echo "Starting pgvector database..."',
      '  docker compose up -d',
      '  echo "  Waiting for database to be ready..."',
      '  sleep 5',
      '',
      '  # Restore RAG dump if available',
      '  if [ -f data/rag-dump.sql ]; then',
      '    echo "  Restoring RAG database..."',
      '    PGPASSWORD=localdev psql -h localhost -p 5433 -U rag -d rag < data/rag-dump.sql 2>/dev/null || echo "  (Some restore warnings are normal)"',
      '    echo "  [OK] RAG database restored"',
      '  fi',
      'fi',
      '',
    );
  }

  lines.push(
    '# Generate Claude Code native files',
    'echo ""',
    'echo "Generating Claude Code native agent files..."',
    'node scripts/generate-agents.js',
    '',
    'echo ""',
    'echo "=================================="',
    'echo "  Setup Complete!"',
    'echo "=================================="',
    'echo ""',
    'echo "Next steps:"',
    'echo "  1. Set up MCP servers (see mcp-servers/SETUP.md)"',
    `echo "  2. In Claude Code, type: /${skillAlias}"`,
    'echo ""',
  );

  return lines.join('\n');
}

function generateGitignore() {
  return [
    '# Environment',
    '.env',
    '',
    '# Node',
    'node_modules/',
    '',
    '# OS',
    '.DS_Store',
    'Thumbs.db',
    '',
    '# Outputs',
    'outputs/',
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
    'BOARD_EMAIL',
    'PERSONAL_EMAIL',
  ];

  if (deps.mcpServers.includes('pdfscribe') || deps.mcpServers.includes('openai-image')) {
    vars.push('OPENAI_API_KEY');
  }
  if (deps.mcpServers.includes('pdfscribe')) {
    vars.push('ANTHROPIC_API_KEY');
  }
  if (deps.mcpServers.includes('gmail') || deps.mcpServers.includes('gmail-personal')) {
    vars.push('GMAIL_OAUTH_CLIENT_ID', 'GMAIL_OAUTH_CLIENT_SECRET');
  }
  if (deps.mcpServers.includes('google-docs')) {
    vars.push('GOOGLE_DOCS_CLIENT_ID', 'GOOGLE_DOCS_CLIENT_SECRET', 'GOOGLE_DOCS_REFRESH_TOKEN');
  }
  if (deps.infraDeps.includes('pgvector')) {
    vars.push('POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_DB');
  }

  return vars;
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
  console.log(`  - Filtered registries (agents.json, teams.json, buckets.json)`);
  console.log(`  - Documentation (CLAUDE.md, README.md, .env.example, setup.sh)`);
  if (deps.infraDeps.includes('pgvector')) {
    console.log(`  - docker-compose.yml + data/rag-dump.sql`);
  }

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
  --output <path>    Output directory (default: exports/<team-id>/)
  --no-docs          Skip context bucket file contents
  --dry-run          Show what would be exported without writing
  --help             Show this help message

Examples:
  node scripts/export-team.js wharfside-board-assistant
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

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--output' && args[i + 1]) {
      outputDir = args[i + 1];
      i++;
    } else if (args[i] === '--no-docs') {
      includeDocs = false;
    } else if (args[i] === '--dry-run') {
      dryRun = true;
    }
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

  // Phase 7.5: Export RAG database
  if (includeDocs) {
    console.log('\nPhase 7.5: Exporting RAG database...');
    const ragResult = exportRagDatabase(exportDir, deps);
    if (ragResult.success) {
      console.log('  [OK] RAG dump saved to data/rag-dump.sql');
    } else if (ragResult.skipped) {
      console.log(`  [SKIP] ${ragResult.reason}`);
    }
  } else {
    console.log('\nPhase 7.5: Skipping RAG export (--no-docs)');
  }

  // Phase 8: Generate documentation
  console.log('\nPhase 8: Generating documentation...');
  generateDocumentation(exportDir, deps);
  console.log('  [OK] CLAUDE.md, README.md, .env.example, setup.sh, SETUP.md, .gitignore');

  // Phase 9: Build manifest
  console.log('\nPhase 9: Building manifest...');
  const manifest = buildManifest(exportDir, deps, { includeDocs });
  console.log(`  [OK] manifest.json (${manifest.file_count} files)`);

  // Summary
  console.log('\n' + '='.repeat(55));
  console.log('Export complete!');
  console.log(`  Directory: ${exportDir}`);
  console.log(`  Files: ${manifest.file_count}`);
  console.log(`  Agents: ${deps.agentIds.length}`);
  console.log(`  MCP Servers: ${deps.mcpServers.length}`);
  console.log(`  Context Buckets: ${deps.contextBuckets.length}`);
  console.log('');
}

main();
