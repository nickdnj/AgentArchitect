#!/usr/bin/env node

/**
 * Agent Generation Script v2.0
 *
 * Generates Claude Code native agent files AND skill files from Agent Architect definitions.
 *
 * Source: agents/<agent-id>/SKILL.md + config.json, teams/<team-id>/team.json
 * Output:
 *   .claude/agents/<agent-id>.md       (native agent definitions)
 *   .claude/skills/<agent-id>/SKILL.md  (forked skill definitions for specialists)
 *   .claude/skills/<team-id>/SKILL.md   (orchestrator skill definitions for teams)
 *
 * Usage: node scripts/generate-agents.js [--agent <agent-id>] [--team <team-id>]
 */

const fs = require('fs');
const path = require('path');

// Configuration
const AGENTS_DIR = path.join(__dirname, '..', 'agents');
const TEAMS_DIR = path.join(__dirname, '..', 'teams');
const OUTPUT_AGENTS_DIR = path.join(__dirname, '..', '.claude', 'agents');
const OUTPUT_SKILLS_DIR = path.join(__dirname, '..', '.claude', 'skills');

// MCP Server mapping: Agent Architect config -> Claude Code tools
const MCP_SERVER_MAPPING = {
  'gdrive': 'mcp__google-drive__*',
  'gdrive-personal': 'mcp__google-drive__*',
  'gmail': 'mcp__gmail__*',
  'gmail-personal': 'mcp__gmail-personal__*',
  'google-docs': 'mcp__google-docs-mcp__*',
  'chrome': 'mcp__chrome__*',
  'github': 'Bash',  // GitHub CLI via bash
  'firebase': 'Bash',  // Firebase CLI via bash
  'google-cloud': 'Bash',  // gcloud CLI via bash
  'powerpoint': 'mcp__powerpoint__*',
  'voicemode': 'mcp__voicemode__*',
  'pdfscribe': 'mcp__pdfscribe__*',
  'gtasks': 'mcp__gtasks__*',
  'apple-mcp': 'mcp__apple-mcp__*',
  'apple-contacts': 'mcp__apple-contacts__*',
  'video-editor': 'mcp__video-editor__*',
  'openai-image': 'mcp__openai-image__*',
};

// Base tools that all agents should have access to
const BASE_TOOLS = [
  'Read',
  'Write',
  'Edit',
  'Glob',
  'Grep',
  'Bash',
  'Task',
  'WebFetch',
  'WebSearch',
];

/**
 * Read and parse an agent's config.json
 */
function readAgentConfig(agentDir) {
  const configPath = path.join(agentDir, 'config.json');
  if (!fs.existsSync(configPath)) {
    return null;
  }
  const content = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Read an agent's SKILL.md content
 */
function readAgentSkill(agentDir) {
  const skillPath = path.join(agentDir, 'SKILL.md');
  if (!fs.existsSync(skillPath)) {
    return null;
  }
  return fs.readFileSync(skillPath, 'utf-8');
}

/**
 * Read a team's team.json
 */
function readTeamConfig(teamDir) {
  const configPath = path.join(teamDir, 'team.json');
  if (!fs.existsSync(configPath)) {
    return null;
  }
  const content = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Map MCP servers from config to Claude Code tool patterns
 */
function mapMcpServersToTools(mcpServers) {
  const tools = new Set(BASE_TOOLS);

  if (!mcpServers || !Array.isArray(mcpServers)) {
    return Array.from(tools);
  }

  for (const server of mcpServers) {
    const mappedTool = MCP_SERVER_MAPPING[server];
    if (mappedTool) {
      tools.add(mappedTool);
    }
  }

  return Array.from(tools);
}

// ============================================================================
// Config Extractors - Generate actionable instructions from config.json
// ============================================================================

/**
 * Extract RAG configuration and generate search command section
 */
function extractRagConfig(config) {
  const rag = config.rag_integration;
  if (!rag || !rag.enabled === false) return null;

  const lines = ['### RAG Search Commands', ''];

  if (config.search_behavior?.primary_method === 'rag_semantic') {
    lines.push('**Primary method:** Semantic search via vector database');
    lines.push('');
  }

  // Generate the search command
  if (rag.cli_path && rag.default_bucket) {
    lines.push('**Search command:**');
    lines.push('```bash');
    lines.push(`cd ${rag.cli_path} && python -c "from src.rag import search_documents; results = search_documents('YOUR_QUERY', bucket_id='${rag.default_bucket}', limit=10, similarity_threshold=0.35); [print(f'[{r.similarity:.3f}] {r.source_file}\\\\n{r.chunk_text[:300]}\\\\n') for r in results]"`);
    lines.push('```');
    lines.push('');
    lines.push(`**Bucket ID:** \`${rag.default_bucket}\``);
  }

  // Add tools if available (from pdf-scribe style config)
  if (rag.tools) {
    lines.push('');
    lines.push('**RAG CLI Commands:**');
    for (const [name, cmd] of Object.entries(rag.tools)) {
      lines.push(`- **${name}:** \`${cmd}\``);
    }
  }

  if (config.search_behavior?.fallback_methods) {
    lines.push('');
    lines.push(`**Fallback methods:** ${config.search_behavior.fallback_methods.join(', ')}`);
  }

  lines.push('');
  lines.push('**Always run RAG search before Glob/Grep for policy queries.**');

  return lines.join('\n');
}

/**
 * Extract Gmail account configuration
 */
function extractGmailConfig(config) {
  const accounts = config.gmail_accounts;
  if (!accounts) return null;

  const lines = ['### Email Accounts', ''];

  for (const [key, account] of Object.entries(accounts)) {
    const label = key.charAt(0).toUpperCase() + key.slice(1);
    lines.push(`**${label} Email:** ${account.address}`);
    lines.push(`- MCP Server: \`${account.mcp_server}\``);
    lines.push(`- Tools: \`mcp__${account.mcp_server === 'gmail' ? 'gmail' : 'gmail-personal'}__*\``);
    if (account.default) {
      lines.push('- **Default account**');
    }
    lines.push('');
  }

  lines.push('**Selection Rule:** Use board account for Wharfside matters, personal for general.');

  return lines.join('\n');
}

/**
 * Extract behavioral defaults
 */
function extractBehavioralDefaults(config) {
  const defaults = config.defaults;
  if (!defaults) return null;

  const lines = ['### Behavioral Defaults', ''];

  if (defaults.draft_only !== undefined) {
    lines.push(`- **Draft only:** ${defaults.draft_only ? 'Yes - create drafts, do not send' : 'No - can send emails'}`);
  }
  if (defaults.lookback_days !== undefined) {
    lines.push(`- **Email lookback:** ${defaults.lookback_days} days`);
  }
  if (defaults.max_emails_before_prompt !== undefined) {
    lines.push(`- **Max emails before prompt:** ${defaults.max_emails_before_prompt}`);
  }
  if (defaults.discovery_first !== undefined) {
    lines.push(`- **Discovery first:** ${defaults.discovery_first ? 'Always count before extracting' : 'Extract directly'}`);
  }
  if (defaults.pdf_processing !== undefined) {
    lines.push(`- **PDF processing:** ${defaults.pdf_processing}`);
  }
  if (defaults.working_file_path !== undefined) {
    lines.push(`- **Working files:** \`${defaults.working_file_path}\``);
  }

  return lines.join('\n');
}

/**
 * Extract storage paths configuration
 */
function extractStoragePaths(config) {
  const hasStorage = config.local_storage || config.output?.folder || config.portal_sync;
  if (!hasStorage) return null;

  const lines = ['### Storage Paths', ''];

  if (config.output?.folder) {
    lines.push(`- **Output folder:** \`${config.output.folder}\``);
  }

  if (config.local_storage) {
    const storage = config.local_storage;
    if (storage.base_path) {
      lines.push(`- **Google Drive:** \`${storage.base_path}\``);
    }
    if (storage.document_categories) {
      lines.push('- **Document categories:**');
      for (const [category, catPath] of Object.entries(storage.document_categories)) {
        lines.push(`  - ${category}: \`${catPath}\``);
      }
    }
  }

  if (config.portal_sync?.appfolio) {
    const appfolio = config.portal_sync.appfolio;
    lines.push(`- **AppFolio sync folder:** \`${appfolio.download_folder}\``);
    lines.push(`- **AppFolio URL:** ${appfolio.url}`);
    if (appfolio.notes && appfolio.notes.length > 0) {
      lines.push('- **AppFolio notes:**');
      for (const note of appfolio.notes) {
        lines.push(`  - ${note}`);
      }
    }
  }

  if (config.cli_tool?.path) {
    lines.push(`- **CLI tool path:** \`${config.cli_tool.path}\``);
  }

  return lines.join('\n');
}

/**
 * Extract collaboration configuration and generate Task() examples
 */
function extractCollaboration(config, allAgents) {
  const collab = config.collaboration;
  if (!collab) return null;

  const hasRequestFrom = collab.can_request_from && collab.can_request_from.length > 0;
  const hasProvidesTo = collab.provides_to && collab.provides_to.length > 0;

  if (!hasRequestFrom && !hasProvidesTo) return null;

  const lines = ['### Agent Delegation', ''];

  // Resolve agent IDs to names
  const resolveAgent = (agentId) => {
    if (agentId === 'all') return { id: agentId, name: 'All Agents' };
    const agent = allAgents[agentId];
    return agent ? { id: agentId, name: agent.name } : { id: agentId, name: agentId };
  };

  if (hasRequestFrom) {
    lines.push('**Can request from:**');
    for (const agentId of collab.can_request_from) {
      const agent = resolveAgent(agentId);
      const subagentType = agent.name.split(/[-\s]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      const model = allAgents[agentId]?.execution?.model || 'sonnet';
      lines.push(`- **${agent.name}** (\`${agentId}\`): \`Task(prompt="...", subagent_type="${subagentType}", model="${model}")\``);
    }
    lines.push('');
  }

  if (hasProvidesTo) {
    lines.push('**This agent provides to:**');
    const names = collab.provides_to.map(id => resolveAgent(id).name);
    lines.push(`- ${names.join(', ')}`);
    lines.push('');
  }

  if (collab.handoff_format) {
    lines.push(`**Handoff format:** ${collab.handoff_format}`);
  }

  return lines.join('\n');
}

/**
 * Extract CLI tool configuration
 */
function extractCliTool(config) {
  const cli = config.cli_tool;
  if (!cli) return null;

  const lines = ['### CLI Tool Commands', ''];

  if (cli.path) {
    lines.push(`**Working directory:** \`${cli.path}\``);
    lines.push('');
  }

  if (cli.transcribe_command) {
    lines.push(`- **Transcribe:** \`${cli.transcribe_command}\``);
  }
  if (cli.website_command) {
    lines.push(`- **PDF to Website:** \`${cli.website_command}\``);
  }
  if (cli.split_command) {
    lines.push(`- **Split PDF:** \`${cli.split_command}\``);
  }
  if (cli.rag_command) {
    lines.push(`- **RAG operations:** \`${cli.rag_command}\``);
  }

  if (cli.requires_one_of) {
    lines.push('');
    lines.push(`**Requires one of:** ${cli.requires_one_of.join(' or ')}`);
  }
  if (cli.rag_requires) {
    lines.push(`**RAG requires:** ${cli.rag_requires.join(', ')}`);
  }

  return lines.join('\n');
}

/**
 * Extract email output configuration
 */
function extractEmailConfig(config) {
  const email = config.email;
  const gmail = config.gmail;
  if (!email && !gmail) return null;

  const lines = ['### Email Configuration', ''];

  if (gmail) {
    lines.push(`- **Gmail account:** ${gmail.account}`);
    if (gmail.lookback_days) {
      lines.push(`- **Lookback days:** ${gmail.lookback_days}`);
    }
  }

  if (email) {
    if (email.to) {
      lines.push(`- **Default recipient:** ${email.to}`);
    }
    if (email.subject_format) {
      lines.push(`- **Subject format:** ${email.subject_format}`);
    }
    if (email.mime_type) {
      lines.push(`- **MIME type:** ${email.mime_type}`);
    }
  }

  if (config.output?.email_iteration?.enabled) {
    lines.push('- **Email iteration:** Enabled');
    if (config.output.email_iteration.template) {
      lines.push(`- **Template:** ${config.output.email_iteration.template}`);
    }
  }

  return lines.join('\n');
}

/**
 * Generate the complete Operational Configuration appendix
 */
function generateOperationalAppendix(config, allAgents) {
  const sections = [
    extractRagConfig(config),
    extractGmailConfig(config),
    extractBehavioralDefaults(config),
    extractStoragePaths(config),
    extractCliTool(config),
    extractEmailConfig(config),
    extractCollaboration(config, allAgents),
  ].filter(Boolean);

  if (sections.length === 0) {
    return '';
  }

  return '\n\n---\n\n## Operational Configuration\n\n<!-- Generated from config.json - DO NOT EDIT -->\n\n' + sections.join('\n\n');
}

/**
 * Generate YAML frontmatter for the agent
 */
function generateFrontmatter(config, tools) {
  const lines = ['---'];
  lines.push(`name: ${config.name}`);
  lines.push(`description: ${config.description}`);

  // Add model preference if specified
  if (config.execution?.model) {
    lines.push(`model: ${config.execution.model}`);
  }

  lines.push('tools:');
  for (const tool of tools) {
    lines.push(`  - ${tool}`);
  }
  lines.push('---');
  return lines.join('\n');
}

/**
 * Generate metadata comments to preserve Agent Architect data
 */
function generateMetadataComments(config) {
  const lines = [
    '',
    '<!-- GENERATED BY AGENT ARCHITECT v2.0 - DO NOT EDIT DIRECTLY -->',
    `<!-- Source: agents/${config.id}/ -->`,
    '<!-- To modify: Edit SKILL.md and config.json, then run /sync-agents -->',
    `<!-- agent_type: ${config.agent_type || 'specialist'} -->`,
    `<!-- execution: ${JSON.stringify(config.execution || {})} -->`,
  ];

  // Preserve collaboration data
  if (config.collaboration) {
    lines.push(`<!-- collaboration: ${JSON.stringify(config.collaboration)} -->`);
  }

  // Preserve workflow position data
  if (config.workflow_position) {
    lines.push(`<!-- workflow: ${JSON.stringify(config.workflow_position)} -->`);
  }

  // Preserve expertise data
  if (config.expertise) {
    lines.push(`<!-- expertise: ${JSON.stringify(config.expertise)} -->`);
  }

  // Preserve context bucket assignments
  if (config.context_buckets) {
    lines.push(`<!-- context_buckets: ${JSON.stringify(config.context_buckets)} -->`);
  }

  // Preserve delegation config (for orchestrators)
  if (config.delegation) {
    lines.push(`<!-- delegation: ${JSON.stringify(config.delegation)} -->`);
  }

  lines.push('');
  return lines.join('\n');
}

/**
 * Generate a complete Claude Code agent file
 */
function generateAgentFile(config, skillContent, allAgents = {}) {
  const tools = mapMcpServersToTools(config.mcp_servers);
  const frontmatter = generateFrontmatter(config, tools);
  const metadata = generateMetadataComments(config);
  const appendix = generateOperationalAppendix(config, allAgents);

  return `${frontmatter}${metadata}${skillContent}${appendix}`;
}

// ============================================================================
// Skill Generation - Create .claude/skills/ entries for forked execution
// ============================================================================

/**
 * Generate a Claude Code skill file for a specialist agent.
 * Skills enable forked execution so specialists run in their own context window.
 */
function generateSpecialistSkill(config, allAgents) {
  const tools = mapMcpServersToTools(config.mcp_servers);
  const toolsList = tools.join(', ');

  const lines = [
    '---',
    `name: ${config.id}`,
    `description: ${config.description}`,
    'context: fork',
    `agent: ${config.name}`,
    `allowed-tools: ${toolsList}`,
    'user-invocable: false',
    '---',
    '',
    `<!-- GENERATED BY AGENT ARCHITECT v2.0 - DO NOT EDIT DIRECTLY -->`,
    `<!-- Source: agents/${config.id}/ -->`,
    '',
    `Perform the following task as the ${config.name} specialist:`,
    '',
    '$ARGUMENTS',
    '',
    'Return a concise briefing with:',
    '- **Key Findings** - What you discovered or produced',
    '- **Artifacts** - Paths to any files created',
    '- **Recommendations** - Next steps if applicable',
  ];

  return lines.join('\n');
}

/**
 * Generate a Claude Code skill file for a team orchestrator.
 * This is the team's entry point that routes to specialist subagents.
 */
function generateTeamOrchestratorSkill(teamConfig, allAgents) {
  const orch = teamConfig.orchestration || {};
  const routing = orch.routing || {};
  const members = teamConfig.members || [];

  // Collect all MCP tools from all member agents
  const allTools = new Set(BASE_TOOLS);
  for (const member of members) {
    const agentConfig = allAgents[member.agent_id];
    if (agentConfig?.mcp_servers) {
      for (const server of agentConfig.mcp_servers) {
        const mapped = MCP_SERVER_MAPPING[server];
        if (mapped) allTools.add(mapped);
      }
    }
  }

  const lines = [
    '---',
    `name: ${teamConfig.id}`,
    `description: ${teamConfig.description}`,
    `model: ${orch.execution?.model || 'opus'}`,
    `allowed-tools: ${Array.from(allTools).join(', ')}`,
    '---',
    '',
    `<!-- GENERATED BY AGENT ARCHITECT v2.0 - DO NOT EDIT DIRECTLY -->`,
    `<!-- Source: teams/${teamConfig.id}/ -->`,
    '',
    `# ${teamConfig.name} - Orchestrator`,
    '',
    `${teamConfig.description}`,
    '',
    '## Orchestration Strategy',
    '',
    orch.delegation_strategy || 'Delegate work to specialist subagents. Keep this context lean.',
    '',
    '## CRITICAL: Delegation Rules',
    '',
    '1. **NEVER do deep analysis yourself** - always delegate to a specialist subagent',
    '2. **Parse the request** - understand what type of work is needed',
    '3. **Select specialist(s)** - choose the right agent(s) from the roster below',
    '4. **Craft a focused prompt** - give the specialist exactly what they need',
    '5. **Run in parallel** when multiple specialists are needed simultaneously',
    '6. **Synthesize results** - combine specialist outputs into a coherent response',
    '',
    '## Available Specialists',
    '',
  ];

  // Add each member agent with Task() invocation syntax
  for (const member of members) {
    const agentConfig = allAgents[member.agent_id];
    if (!agentConfig) continue;

    const model = agentConfig.execution?.model || 'sonnet';
    lines.push(`### ${agentConfig.name}`);
    lines.push(`- **Role:** ${member.role}`);
    lines.push(`- **Invoke:** \`Task(subagent_type="${agentConfig.name}", prompt="YOUR TASK HERE", model="${model}")\``);

    // Add description if available
    if (agentConfig.description) {
      lines.push(`- **Capabilities:** ${agentConfig.description}`);
    }
    lines.push('');
  }

  // Add routing table
  if (Object.keys(routing).length > 0) {
    lines.push('## Routing Table');
    lines.push('');
    lines.push('| Request Type | Route To |');
    lines.push('|---|---|');
    for (const [taskType, agentIds] of Object.entries(routing)) {
      const names = agentIds.map(id => allAgents[id]?.name || id).join(', ');
      lines.push(`| ${taskType} | ${names} |`);
    }
    lines.push('');
  }

  // Add workflow stages if defined
  if (teamConfig.workflow?.stages) {
    lines.push('## Workflow Stages');
    lines.push('');
    for (const stage of teamConfig.workflow.stages) {
      const stageAgents = stage.agents.map(id => allAgents[id]?.name || id).join(', ');
      const parallel = stage.parallel ? ' (parallel)' : '';
      lines.push(`${stage.name}${parallel}: ${stageAgents}`);
      if (stage.inputs) {
        lines.push(`  - Inputs: ${stage.inputs.join(', ')}`);
      }
      if (stage.outputs) {
        lines.push(`  - Outputs: ${stage.outputs.join(', ')}`);
      }
    }
    lines.push('');
  }

  // Add session summary instructions
  if (orch.session_summary?.enabled) {
    lines.push('## Session Summary');
    lines.push('');
    lines.push('After completing a complex interaction, write a brief session summary:');
    lines.push(`- **Path:** \`${orch.session_summary.output_path || 'context-buckets/session-logs/files/'}\``);
    lines.push('- **Format:** `YYYY-MM-DD_team-id_topic.md`');
    lines.push('- **Include:** What was requested, what was done, key decisions, artifacts produced');
    lines.push('');
  }

  // Add team-specific context
  if (teamConfig.gmail_accounts) {
    lines.push('## Email Accounts');
    lines.push('');
    for (const [key, value] of Object.entries(teamConfig.gmail_accounts)) {
      lines.push(`- **${key}:** ${value}`);
    }
    lines.push('');
  }

  lines.push('## User Request');
  lines.push('');
  lines.push('$ARGUMENTS');

  return lines.join('\n');
}

/**
 * Process a single agent - generate both agent file and skill file
 */
function processAgent(agentId, allAgents = {}) {
  const agentDir = path.join(AGENTS_DIR, agentId);

  // Skip template directories
  if (agentId.startsWith('_')) {
    return { skipped: true, reason: 'template directory' };
  }

  // Check if directory exists
  if (!fs.existsSync(agentDir) || !fs.statSync(agentDir).isDirectory()) {
    return { error: `Agent directory not found: ${agentDir}` };
  }

  // Read config
  const config = readAgentConfig(agentDir);
  if (!config) {
    return { error: `config.json not found for agent: ${agentId}` };
  }

  // Read SKILL.md
  const skillContent = readAgentSkill(agentDir);
  if (!skillContent) {
    return { error: `SKILL.md not found for agent: ${agentId}` };
  }

  // Generate agent file (.claude/agents/)
  const agentContent = generateAgentFile(config, skillContent, allAgents);
  const agentOutputPath = path.join(OUTPUT_AGENTS_DIR, `${agentId}.md`);
  fs.writeFileSync(agentOutputPath, agentContent, 'utf-8');

  // Generate skill file (.claude/skills/) for specialist and utility agents
  let skillGenerated = false;
  if (config.agent_type === 'specialist' || config.agent_type === 'utility') {
    const skillDir = path.join(OUTPUT_SKILLS_DIR, agentId);
    if (!fs.existsSync(skillDir)) {
      fs.mkdirSync(skillDir, { recursive: true });
    }
    const skillContent2 = generateSpecialistSkill(config, allAgents);
    const skillOutputPath = path.join(skillDir, 'SKILL.md');
    fs.writeFileSync(skillOutputPath, skillContent2, 'utf-8');
    skillGenerated = true;
  }

  return {
    success: true,
    agentId,
    name: config.name,
    agentType: config.agent_type || 'specialist',
    model: config.execution?.model || 'sonnet',
    agentOutputPath,
    skillGenerated,
    toolCount: mapMcpServersToTools(config.mcp_servers).length,
  };
}

/**
 * Process a team - generate orchestrator skill file
 */
function processTeam(teamId, allAgents = {}) {
  const teamDir = path.join(TEAMS_DIR, teamId);

  if (!fs.existsSync(teamDir) || !fs.statSync(teamDir).isDirectory()) {
    return { error: `Team directory not found: ${teamDir}` };
  }

  const teamConfig = readTeamConfig(teamDir);
  if (!teamConfig) {
    return { error: `team.json not found for team: ${teamId}` };
  }

  // Generate orchestrator skill file
  const skillDir = path.join(OUTPUT_SKILLS_DIR, teamId);
  if (!fs.existsSync(skillDir)) {
    fs.mkdirSync(skillDir, { recursive: true });
  }

  const skillContent = generateTeamOrchestratorSkill(teamConfig, allAgents);
  const skillOutputPath = path.join(skillDir, 'SKILL.md');
  fs.writeFileSync(skillOutputPath, skillContent, 'utf-8');

  return {
    success: true,
    teamId,
    name: teamConfig.name,
    memberCount: teamConfig.members?.length || 0,
    skillOutputPath,
  };
}

/**
 * Get list of all agent directories
 */
function getAllAgentIds() {
  if (!fs.existsSync(AGENTS_DIR)) {
    return [];
  }

  return fs.readdirSync(AGENTS_DIR)
    .filter(name => {
      const fullPath = path.join(AGENTS_DIR, name);
      return fs.statSync(fullPath).isDirectory() && !name.startsWith('_');
    });
}

/**
 * Get list of all team directories
 */
function getAllTeamIds() {
  if (!fs.existsSync(TEAMS_DIR)) {
    return [];
  }

  return fs.readdirSync(TEAMS_DIR)
    .filter(name => {
      const fullPath = path.join(TEAMS_DIR, name);
      return fs.statSync(fullPath).isDirectory() && !name.startsWith('_');
    });
}

/**
 * Load all agent configs for collaboration resolution
 */
function loadAllAgentConfigs() {
  const allAgents = {};
  const agentIds = getAllAgentIds();

  for (const agentId of agentIds) {
    const agentDir = path.join(AGENTS_DIR, agentId);
    const config = readAgentConfig(agentDir);
    if (config) {
      allAgents[agentId] = config;
    }
  }

  return allAgents;
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  let targetAgent = null;
  let targetTeam = null;

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--agent' && args[i + 1]) {
      targetAgent = args[i + 1];
      i++;
    }
    if (args[i] === '--team' && args[i + 1]) {
      targetTeam = args[i + 1];
      i++;
    }
  }

  // Ensure output directories exist
  for (const dir of [OUTPUT_AGENTS_DIR, OUTPUT_SKILLS_DIR]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // Load all agent configs for collaboration name resolution
  const allAgents = loadAllAgentConfigs();

  console.log(`\nAgent Architect v2.0 -> Claude Code Generation`);
  console.log('='.repeat(55));

  // ---- Process Agents ----
  const agentIds = targetAgent ? [targetAgent] : getAllAgentIds();

  const agentResults = { success: [], skipped: [], errors: [] };

  if (agentIds.length > 0) {
    console.log(`\nProcessing ${agentIds.length} agent(s)...\n`);

    for (const agentId of agentIds) {
      const result = processAgent(agentId, allAgents);

      if (result.success) {
        agentResults.success.push(result);
        const skillLabel = result.skillGenerated ? ' + skill' : '';
        console.log(`  [OK] ${result.name} (${result.agentType}, ${result.model})${skillLabel}`);
      } else if (result.skipped) {
        agentResults.skipped.push({ agentId, ...result });
      } else {
        agentResults.errors.push({ agentId, ...result });
        console.log(`  [ERROR] ${agentId}: ${result.error}`);
      }
    }
  }

  // ---- Process Teams ----
  const teamIds = targetTeam ? [targetTeam] : getAllTeamIds();

  const teamResults = { success: [], errors: [] };

  if (teamIds.length > 0 && !targetAgent) {
    console.log(`\nProcessing ${teamIds.length} team(s)...\n`);

    for (const teamId of teamIds) {
      const result = processTeam(teamId, allAgents);

      if (result.success) {
        teamResults.success.push(result);
        console.log(`  [OK] ${result.name} (orchestrator, ${result.memberCount} members)`);
      } else {
        teamResults.errors.push({ teamId, ...result });
        console.log(`  [ERROR] ${teamId}: ${result.error}`);
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(55));
  console.log(`Summary:`);
  console.log(`  Agents generated: ${agentResults.success.length}`);
  const skillCount = agentResults.success.filter(r => r.skillGenerated).length;
  console.log(`  Skills generated: ${skillCount} (specialists/utilities)`);
  console.log(`  Team orchestrators: ${teamResults.success.length}`);
  if (agentResults.errors.length + teamResults.errors.length > 0) {
    console.log(`  Errors: ${agentResults.errors.length + teamResults.errors.length}`);
  }
  console.log('\nGenerated files:');
  console.log('  Agents: .claude/agents/');
  console.log('  Skills: .claude/skills/');
  console.log('');

  // Exit with error code if there were errors
  if (agentResults.errors.length + teamResults.errors.length > 0) {
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

// Export for testing
module.exports = {
  processAgent,
  processTeam,
  getAllAgentIds,
  getAllTeamIds,
  mapMcpServersToTools,
  generateAgentFile,
  generateSpecialistSkill,
  generateTeamOrchestratorSkill,
  generateOperationalAppendix,
  loadAllAgentConfigs,
};
