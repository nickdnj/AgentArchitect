#!/usr/bin/env node

/**
 * Agent Generation Script
 *
 * Generates Claude Code native agent files from Agent Architect definitions.
 * Source: agents/<agent-id>/SKILL.md + config.json
 * Output: .claude/agents/<agent-id>.md
 *
 * Usage: node scripts/generate-agents.js [--agent <agent-id>]
 */

const fs = require('fs');
const path = require('path');

// Configuration
const AGENTS_DIR = path.join(__dirname, '..', 'agents');
const OUTPUT_DIR = path.join(__dirname, '..', '.claude', 'agents');

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
      for (const [category, path] of Object.entries(storage.document_categories)) {
        lines.push(`  - ${category}: \`${path}\``);
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
      // Convert agent ID to subagent_type format (capitalize first letter of each word)
      const subagentType = agent.name.split(/[-\s]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      lines.push(`- **${agent.name}** (\`${agentId}\`): \`Task(prompt="...", subagent_type="${subagentType}")\``);
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
    '<!-- GENERATED BY AGENT ARCHITECT - DO NOT EDIT DIRECTLY -->',
    `<!-- Source: agents/${config.id}/ -->`,
    '<!-- To modify: Edit SKILL.md and config.json, then run /sync-agents -->',
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

/**
 * Process a single agent
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

  // Generate agent file with operational appendix
  const agentContent = generateAgentFile(config, skillContent, allAgents);

  // Write output
  const outputPath = path.join(OUTPUT_DIR, `${agentId}.md`);
  fs.writeFileSync(outputPath, agentContent, 'utf-8');

  return {
    success: true,
    agentId,
    name: config.name,
    outputPath,
    toolCount: mapMcpServersToTools(config.mcp_servers).length,
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

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--agent' && args[i + 1]) {
      targetAgent = args[i + 1];
      i++;
    }
  }

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Get agents to process
  const agentIds = targetAgent ? [targetAgent] : getAllAgentIds();

  if (agentIds.length === 0) {
    console.log('No agents found to process.');
    process.exit(0);
  }

  // Load all agent configs for collaboration name resolution
  const allAgents = loadAllAgentConfigs();

  console.log(`\nAgent Architect -> Claude Code Agent Generation`);
  console.log('='.repeat(50));
  console.log(`Processing ${agentIds.length} agent(s)...\n`);

  const results = {
    success: [],
    skipped: [],
    errors: [],
  };

  for (const agentId of agentIds) {
    const result = processAgent(agentId, allAgents);

    if (result.success) {
      results.success.push(result);
      console.log(`  [OK] ${result.name} (${result.agentId})`);
      console.log(`       -> .claude/agents/${result.agentId}.md`);
    } else if (result.skipped) {
      results.skipped.push({ agentId, ...result });
    } else {
      results.errors.push({ agentId, ...result });
      console.log(`  [ERROR] ${agentId}: ${result.error}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`Summary:`);
  console.log(`  Generated: ${results.success.length}`);
  if (results.skipped.length > 0) {
    console.log(`  Skipped: ${results.skipped.length}`);
  }
  if (results.errors.length > 0) {
    console.log(`  Errors: ${results.errors.length}`);
  }
  console.log('\nGenerated agents are available at: .claude/agents/');
  console.log('Use Claude Code /agents to see them.\n');

  // Exit with error code if there were errors
  if (results.errors.length > 0) {
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
  getAllAgentIds,
  mapMcpServersToTools,
  generateAgentFile,
  generateOperationalAppendix,
  loadAllAgentConfigs,
};
