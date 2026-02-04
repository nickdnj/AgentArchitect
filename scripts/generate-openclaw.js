#!/usr/bin/env node

/**
 * OpenClaw Generation Script
 *
 * Generates OpenClaw workspace structure from Agent Architect definitions.
 * Source: agents/<agent-id>/SKILL.md + config.json, teams/<team-id>/team.json
 * Output: openclaw-output/ with workspace directories and openclaw.json
 *
 * Usage: node scripts/generate-openclaw.js [--agent <agent-id>] [--output <dir>]
 */

const fs = require('fs');
const path = require('path');

// Configuration
const ROOT_DIR = path.join(__dirname, '..');
const AGENTS_DIR = path.join(ROOT_DIR, 'agents');
const TEAMS_DIR = path.join(ROOT_DIR, 'teams');
const BUCKETS_DIR = path.join(ROOT_DIR, 'context-buckets');
const DEFAULT_OUTPUT_DIR = path.join(ROOT_DIR, 'openclaw-output');

// User profile extracted from CLAUDE.md
const USER_PROFILE = {
  name: 'Nick',
  personalEmail: 'nickd@demarconet.com',
  boardEmail: 'nickd@wharfsidemb.com',
};

// ============================================================================
// File Readers
// ============================================================================

function readJSON(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function readText(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf-8');
}

function getAllIds(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(name => {
    const fullPath = path.join(dir, name);
    return fs.statSync(fullPath).isDirectory() && !name.startsWith('_');
  });
}

// ============================================================================
// SKILL.md Parsing - Split into SOUL.md and AGENTS.md
// ============================================================================

/**
 * Parse a SKILL.md file and split content into persona vs operational sections.
 *
 * Persona sections (-> SOUL.md): Persona, personality, communication style, philosophy
 * Operational sections (-> AGENTS.md): Everything else (responsibilities, workflow, etc.)
 */
function parseSkillMd(skillContent) {
  const lines = skillContent.split('\n');
  const soulLines = [];
  const agentsLines = [];

  // Persona-related heading patterns (case insensitive)
  const personaPatterns = [
    /^#+\s*persona/i,
    /^#+\s*personality/i,
    /^#+\s*communication\s+style/i,
    /^#+\s*philosophy/i,
    /^#+\s*tone/i,
    /^#+\s*voice/i,
  ];

  // Operational heading patterns
  const operationalPatterns = [
    /^#+\s*purpose/i,
    /^#+\s*core\s+responsibilities/i,
    /^#+\s*responsibilities/i,
    /^#+\s*workflow/i,
    /^#+\s*input/i,
    /^#+\s*output/i,
    /^#+\s*support\s+domains/i,
    /^#+\s*integration/i,
    /^#+\s*collaboration/i,
    /^#+\s*success\s+criteria/i,
    /^#+\s*mcp\s+server/i,
    /^#+\s*context/i,
    /^#+\s*error/i,
    /^#+\s*commands/i,
    /^#+\s*research/i,
    /^#+\s*email/i,
    /^#+\s*tools/i,
  ];

  let currentTarget = 'agents'; // default target
  let inTitle = true; // first line is usually the title

  for (const line of lines) {
    // Skip the top-level title (# Agent Name - SKILL)
    if (inTitle && /^#\s+.+SKILL/.test(line)) {
      inTitle = false;
      continue;
    }
    if (inTitle && /^#\s+/.test(line)) {
      inTitle = false;
      // Keep the title for agents if it's not a "SKILL" title
      agentsLines.push(line);
      continue;
    }
    inTitle = false;

    // Check if this line is a heading that changes the target
    const isHeading = /^#+\s+/.test(line);
    if (isHeading) {
      const isPersona = personaPatterns.some(p => p.test(line));
      const isOperational = operationalPatterns.some(p => p.test(line));

      if (isPersona) {
        currentTarget = 'soul';
      } else if (isOperational) {
        currentTarget = 'agents';
      }
      // If neither matches, keep current target
    }

    if (currentTarget === 'soul') {
      soulLines.push(line);
    } else {
      agentsLines.push(line);
    }
  }

  return {
    soul: soulLines.join('\n').trim(),
    agents: agentsLines.join('\n').trim(),
  };
}

// ============================================================================
// OpenClaw File Generators
// ============================================================================

/**
 * Generate IDENTITY.md from config.json
 */
function generateIdentity(config) {
  const lines = [];
  const emoji = config.persona?.emoji || getDefaultEmoji(config.id);

  lines.push(`# ${emoji} ${config.name}`);
  lines.push('');
  lines.push(`> ${config.description}`);
  lines.push('');

  if (config.expertise) {
    lines.push('## Expertise');
    lines.push('');
    if (config.expertise.domains) {
      lines.push(`**Domains:** ${config.expertise.domains.join(', ')}`);
    }
    if (config.expertise.capabilities) {
      lines.push(`**Capabilities:** ${config.expertise.capabilities.join(', ')}`);
    }
    lines.push('');
  }

  if (config.persona?.name) {
    lines.push(`**Agent Name:** ${config.persona.name}`);
    if (config.persona.style) {
      lines.push(`**Style:** ${config.persona.style}`);
    }
    lines.push('');
  }

  return lines.join('\n').trim() + '\n';
}

/**
 * Pick a default emoji based on agent ID keywords
 */
function getDefaultEmoji(agentId) {
  const emojiMap = {
    'researcher': '🔍', 'research': '🔍',
    'architect': '🏗️', 'architecture': '🏗️',
    'developer': '💻', 'dev': '💻',
    'designer': '🎨', 'design': '🎨', 'ux': '🎨',
    'writer': '✍️', 'proposal': '📝',
    'analyst': '📊', 'qualification': '📊',
    'strategist': '♟️', 'deal': '🤝',
    'engineer': '⚙️', 'value': '💰',
    'support': '🛟', 'customer': '🛟',
    'marketing': '📣',
    'sales': '💼',
    'legal': '⚖️',
    'qa': '🧪',
    'email': '📧',
    'presentation': '📊',
    'bulletin': '📰',
    'archivist': '🗄️',
    'pdf': '📄',
    'migration': '🔄',
    'deployment': '🚀',
    'infrastructure': '🏢',
    'plm': '🔗', 'erp': '🔗', 'ecad': '🔌', 'mcad': '🔧',
    'competitive': '🏆',
    'personal': '🤖', 'assistant': '🤖',
    'dispatcher': '📡',
    'web': '🌐',
    'rag': '🔎',
    'solution': '🎯',
  };

  const idLower = agentId.toLowerCase();
  for (const [keyword, emoji] of Object.entries(emojiMap)) {
    if (idLower.includes(keyword)) return emoji;
  }
  return '🤖';
}

/**
 * Generate SOUL.md from parsed persona content
 */
function generateSoul(config, soulContent) {
  const lines = [];
  lines.push(`# Soul of ${config.name}`);
  lines.push('');

  if (soulContent) {
    lines.push(soulContent);
  } else {
    // Generate minimal soul from config
    lines.push(`You are ${config.name}, a specialist in ${config.description.toLowerCase()}.`);
    lines.push('');
    lines.push('## Personality');
    lines.push('');
    lines.push('- Professional and focused');
    lines.push('- Clear and concise in communication');
    lines.push('- Thorough in your domain of expertise');
  }

  lines.push('');
  return lines.join('\n').trim() + '\n';
}

/**
 * Generate AGENTS.md from parsed operational content
 */
function generateAgentsMd(config, agentsContent) {
  const lines = [];
  lines.push(`# ${config.name} - Agent Instructions`);
  lines.push('');

  if (agentsContent) {
    lines.push(agentsContent);
  }

  // Add collaboration rules if present
  if (config.collaboration) {
    const collab = config.collaboration;
    if ((collab.can_request_from && collab.can_request_from.length > 0) ||
        (collab.provides_to && collab.provides_to.length > 0)) {
      lines.push('');
      lines.push('## Agent Collaboration');
      lines.push('');
      if (collab.can_request_from && collab.can_request_from.length > 0) {
        lines.push(`**Can request from:** ${collab.can_request_from.join(', ')}`);
      }
      if (collab.provides_to && collab.provides_to.length > 0) {
        lines.push(`**Provides to:** ${collab.provides_to.join(', ')}`);
      }
      if (collab.handoff_format) {
        lines.push(`**Handoff format:** ${collab.handoff_format}`);
      }
    }
  }

  lines.push('');
  return lines.join('\n').trim() + '\n';
}

/**
 * MCP server to mcporter server name mapping.
 * Maps Agent Architect config names to the mcporter-discoverable server names.
 */
const MCPORTER_SERVER_MAP = {
  'gmail': 'gmail',
  'gmail-personal': 'gmail-personal',
  'google-docs': 'google-docs-mcp',
  'gdrive': 'google-drive',
  'chrome': 'chrome',
  'powerpoint': 'powerpoint',
  'voicemode': 'voicemode',
  'pdfscribe': 'pdfscribe',
  'gtasks': 'gtasks',
  'github': 'github',
};

/**
 * MCP server tool documentation with mcporter call examples
 */
const MCP_TOOL_DOCS = {
  'gmail': {
    name: 'Gmail (Work)',
    desc: 'Send, search, and manage work emails (nickd@wharfsidemb.com)',
    examples: [
      'mcporter call gmail.search_emails query="from:vendor subject:proposal"',
      'mcporter call gmail.read_email messageId=<id>',
      'mcporter call gmail.send_email to=user@example.com subject="Hello" body="..."',
      'mcporter call gmail.draft_email to=user@example.com subject="Draft" body="..."',
    ],
  },
  'gmail-personal': {
    name: 'Gmail (Personal)',
    desc: 'Send, search, and manage personal emails (nickd@demarconet.com)',
    examples: [
      'mcporter call gmail-personal.search_emails query="subject:important"',
      'mcporter call gmail-personal.read_email messageId=<id>',
      'mcporter call gmail-personal.send_email to=user@example.com subject="Hi" body="..."',
    ],
  },
  'google-docs': {
    name: 'Google Docs',
    desc: 'Create, edit, search, and share Google Docs',
    examples: [
      'mcporter call google-docs-mcp.google_docs_create title="New Document" content="..."',
      'mcporter call google-docs-mcp.google_docs_search query="meeting notes"',
      'mcporter call google-docs-mcp.google_docs_to_markdown documentId=<id>',
      'mcporter call google-docs-mcp.google_docs_append documentId=<id> content="..."',
    ],
  },
  'gdrive': {
    name: 'Google Drive',
    desc: 'Search and read files from Google Drive',
    examples: [
      'mcporter call google-drive.gdrive_search query="quarterly report"',
      'mcporter call google-drive.gdrive_read_file fileId=<id>',
      'mcporter call google-drive.gsheets_read spreadsheetId=<id>',
    ],
  },
  'chrome': {
    name: 'Chrome Browser',
    desc: 'Browse the web, take screenshots, fill forms, and automate browser tasks',
    examples: [
      'mcporter call chrome.navigate_page url="https://example.com"',
      'mcporter call chrome.take_screenshot',
      'mcporter call chrome.take_snapshot',
      'mcporter call chrome.click uid=<element_uid>',
    ],
  },
  'powerpoint': {
    name: 'PowerPoint',
    desc: 'Create and edit PowerPoint presentations',
    examples: [
      'mcporter call powerpoint.create_presentation title="My Deck"',
      'mcporter call powerpoint.add_slide presentationId=<id> layout="Title Slide"',
    ],
  },
  'voicemode': {
    name: 'Voice Mode',
    desc: 'Voice conversation with speech-to-text and text-to-speech',
    examples: [
      'mcporter call voicemode.converse message="Hello" wait_for_response=true',
    ],
  },
  'pdfscribe': {
    name: 'PDF Scribe',
    desc: 'Transcribe PDFs to markdown using vision AI',
    examples: [
      'mcporter call pdfscribe.transcribe_pdf pdf_path="/path/to/file.pdf"',
      'mcporter call pdfscribe.list_transcriptions',
    ],
  },
  'gtasks': {
    name: 'Google Tasks',
    desc: 'Create, update, and manage tasks and task lists',
    examples: [
      'mcporter call gtasks.listTaskLists',
      'mcporter call gtasks.getTasks listId=<id>',
      'mcporter call gtasks.createTask listId=<id> task.title="New task"',
      'mcporter call gtasks.completeTask listId=<id> taskId=<id>',
    ],
  },
  'github': {
    name: 'GitHub',
    desc: 'Repository operations - issues, PRs, and code search',
    examples: [
      'mcporter call github.list_issues owner=<owner> repo=<repo>',
      'mcporter call github.create_issue owner=<owner> repo=<repo> title="Bug"',
    ],
  },
};

/**
 * Generate TOOLS.md from MCP server assignments using mcporter commands
 */
function generateTools(config) {
  const lines = [];
  lines.push('# Tool Usage — mcporter MCP Bridge');
  lines.push('');
  lines.push('Use the `mcporter` CLI to access external tools via MCP servers.');
  lines.push('Each tool is called with: `mcporter call <server>.<tool> [args]`');
  lines.push('');

  const mcpServers = config.mcp_servers || [];
  if (mcpServers.length === 0) {
    lines.push('No MCP tools configured for this agent.');
    return lines.join('\n').trim() + '\n';
  }

  lines.push('## Available MCP Servers');
  lines.push('');

  for (const server of mcpServers) {
    const doc = MCP_TOOL_DOCS[server];
    const mcporterName = MCPORTER_SERVER_MAP[server] || server;

    if (doc) {
      lines.push(`### ${doc.name} (\`${mcporterName}\`)`);
      lines.push(`${doc.desc}`);
      lines.push('');
      lines.push('**Example commands:**');
      lines.push('```bash');
      for (const ex of doc.examples) {
        lines.push(ex);
      }
      lines.push('```');
      lines.push('');
    } else {
      lines.push(`### ${server} (\`${mcporterName}\`)`);
      lines.push(`MCP server: ${server}`);
      lines.push('');
      lines.push('```bash');
      lines.push(`mcporter call ${mcporterName}.<tool_name> [args]`);
      lines.push('```');
      lines.push('');
    }
  }

  // Add gmail account info if present
  if (config.gmail_accounts) {
    lines.push('## Email Accounts');
    lines.push('');
    for (const [key, account] of Object.entries(config.gmail_accounts)) {
      const mcpName = MCPORTER_SERVER_MAP[account.mcp_server] || account.mcp_server;
      lines.push(`- **${key}:** ${account.address} (mcporter server: \`${mcpName}\`)`);
    }
    lines.push('');
  }

  lines.push('## Discovering Tools');
  lines.push('');
  lines.push('To list all available tools on a server:');
  lines.push('```bash');
  lines.push('mcporter list <server-name>');
  lines.push('```');
  lines.push('');

  return lines.join('\n').trim() + '\n';
}

/**
 * Generate USER.md from global user profile
 */
function generateUser() {
  const lines = [];
  lines.push('# User Profile');
  lines.push('');
  lines.push(`**Name:** ${USER_PROFILE.name}`);
  lines.push(`**Personal Email:** ${USER_PROFILE.personalEmail}`);
  lines.push(`**Board Email:** ${USER_PROFILE.boardEmail}`);
  lines.push('');
  lines.push('## Email Routing');
  lines.push('');
  lines.push(`- Use \`${USER_PROFILE.personalEmail}\` for personal matters and general research`);
  lines.push(`- Use \`${USER_PROFILE.boardEmail}\` for Wharfside Manor board communications`);
  lines.push('');
  return lines.join('\n').trim() + '\n';
}

/**
 * Generate MEMORY.md from context bucket assignments
 */
function generateMemory(config) {
  const lines = [];
  lines.push('# Memory & Knowledge');
  lines.push('');

  const buckets = config.context_buckets?.assigned || [];
  if (buckets.length === 0) {
    lines.push('No persistent memory or knowledge bases assigned.');
    return lines.join('\n').trim() + '\n';
  }

  lines.push('## Assigned Knowledge Bases');
  lines.push('');

  for (const bucketId of buckets) {
    const bucketPath = path.join(BUCKETS_DIR, bucketId, 'bucket.json');
    const bucket = readJSON(bucketPath);
    if (bucket) {
      lines.push(`### ${bucket.name}`);
      lines.push(`- **ID:** ${bucket.id}`);
      lines.push(`- **Description:** ${bucket.description}`);
      lines.push(`- **Content type:** ${bucket.content_type || 'mixed'}`);
      if (bucket.structure?.categories) {
        lines.push('- **Categories:**');
        for (const cat of bucket.structure.categories) {
          lines.push(`  - ${cat.name}: ${cat.description}`);
        }
      }
      lines.push('');
    } else {
      lines.push(`### ${bucketId}`);
      lines.push(`- Knowledge base: ${bucketId}`);
      lines.push('');
    }
  }

  const accessLevel = config.context_buckets?.access_level || 'read-only';
  lines.push(`**Access level:** ${accessLevel}`);
  lines.push('');

  return lines.join('\n').trim() + '\n';
}

// ============================================================================
// Dispatcher Agent Generation
// ============================================================================

/**
 * Generate the dispatcher agent that routes to all specialist agents
 */
function generateDispatcher(allAgents, allTeams) {
  const dispatcherSoul = `# Soul of the Dispatcher

You are **Archie**, the Agent Dispatcher. You are the central coordinator for a team of specialized AI agents. Your role is to receive requests, understand what's needed, and route them to the right specialist.

## Personality

- Warm but efficient - you're the helpful front desk of a brilliant team
- Quick to understand intent and match it to the right specialist
- Transparent about what each specialist can do
- You know the strengths of every agent on your team
- You summarize and present specialist work clearly

## Philosophy

- **Right agent, right task** - Every specialist has a sweet spot
- **Context matters** - Pass relevant context to specialists, not noise
- **Orchestrate, don't micromanage** - Let specialists do their thing
- **Teams are greater than individuals** - Complex tasks benefit from multi-agent workflows
`;

  // Build the agents MD with team registry and routing
  const agentsLines = [];
  agentsLines.push('# Dispatcher - Agent Instructions');
  agentsLines.push('');
  agentsLines.push('## Purpose');
  agentsLines.push('');
  agentsLines.push('You are the central dispatcher for all inbound requests. You:');
  agentsLines.push('1. Receive messages from all channels');
  agentsLines.push('2. Understand the intent and required expertise');
  agentsLines.push('3. Route to the appropriate specialist agent via skills');
  agentsLines.push('4. Aggregate and present results back to the user');
  agentsLines.push('5. Can orchestrate multi-agent team workflows');
  agentsLines.push('');

  // Agent registry
  agentsLines.push('## Available Specialists');
  agentsLines.push('');
  agentsLines.push('| Skill | Agent | Expertise |');
  agentsLines.push('|-------|-------|-----------|');

  const agentIds = Object.keys(allAgents).sort();
  for (const id of agentIds) {
    const agent = allAgents[id];
    const domains = agent.expertise?.domains?.slice(0, 3).join(', ') || agent.description;
    agentsLines.push(`| \`${id}\` | ${agent.name} | ${domains} |`);
  }
  agentsLines.push('');

  // Team workflows
  if (Object.keys(allTeams).length > 0) {
    agentsLines.push('## Team Workflows');
    agentsLines.push('');

    for (const [teamId, team] of Object.entries(allTeams)) {
      agentsLines.push(`### ${team.name} (\`team-${teamId}\`)`);
      agentsLines.push(`${team.description}`);
      agentsLines.push('');

      if (team.workflow?.stages) {
        agentsLines.push('**Stages:**');
        for (const stage of team.workflow.stages) {
          const parallel = stage.parallel ? ' (parallel)' : '';
          agentsLines.push(`1. **${stage.name}**${parallel}: ${stage.agents.join(', ')}`);
        }
        agentsLines.push('');
      }

      agentsLines.push(`**Members:** ${team.members.map(m => m.agent_id).join(', ')}`);
      agentsLines.push('');
    }
  }

  // Routing rules
  agentsLines.push('## Routing Guidelines');
  agentsLines.push('');
  agentsLines.push('When a request arrives:');
  agentsLines.push('1. **Identify the domain** - What expertise is needed?');
  agentsLines.push('2. **Check for team fit** - Does this match a team workflow?');
  agentsLines.push('3. **Route to specialist** - Invoke the appropriate skill');
  agentsLines.push('4. **For multi-step tasks** - Use team workflow skills');
  agentsLines.push('5. **For ambiguous requests** - Ask the user for clarification');
  agentsLines.push('');

  const identity = [
    '# 📡 Agent Dispatcher',
    '',
    '> Central coordinator that routes requests to the right specialist agent or team workflow.',
    '',
    '## Expertise',
    '',
    '**Domains:** agent orchestration, task routing, team coordination',
    '**Capabilities:** intent classification, multi-agent workflows, result aggregation',
    '',
  ].join('\n');

  return {
    soul: dispatcherSoul.trim() + '\n',
    agents: agentsLines.join('\n').trim() + '\n',
    identity: identity.trim() + '\n',
    tools: generateDispatcherTools(),
    user: generateUser(),
  };
}

function generateDispatcherTools() {
  return [
    '# Tool Usage — Dispatcher',
    '',
    '## Skill Invocation',
    '',
    'The dispatcher invokes specialist agents as OpenClaw skills.',
    'Each agent is available as a skill that can be called by name.',
    '',
    '## MCP Tools via mcporter',
    '',
    'External tools (Gmail, Google Docs, Drive, etc.) are accessed via the `mcporter` CLI bridge.',
    'Each specialist agent knows which mcporter servers it can use.',
    'When routing to a specialist, their TOOLS.md contains the specific mcporter commands available.',
    '',
    'To list all available MCP servers: `mcporter list`',
    'To call a specific tool: `mcporter call <server>.<tool> [args]`',
    '',
    '## Available Tool Categories',
    '',
    '- **Agent Skills** - Invoke any specialist agent by ID',
    '- **Team Workflows** - Run multi-stage team pipelines',
    '- **MCP Tools** - Gmail, Google Docs, Drive, Tasks, Chrome, PowerPoint, etc. via mcporter',
    '',
  ].join('\n');
}

// ============================================================================
// Skill Generation (wrapping agents as OpenClaw skills)
// ============================================================================

/**
 * Generate an OpenClaw skill SKILL.md that wraps an Agent Architect agent
 */
function generateAgentSkill(config, skillContent) {
  const lines = [];
  lines.push('---');
  lines.push(`name: ${config.id}`);
  lines.push(`description: ${config.description}`);
  lines.push('metadata:');
  lines.push('  openclaw:');
  lines.push(`    emoji: "${getDefaultEmoji(config.id)}"`);
  lines.push('    source: agent-architect');
  lines.push(`    agent_id: ${config.id}`);
  lines.push('---');
  lines.push('');
  lines.push(skillContent);
  return lines.join('\n').trim() + '\n';
}

/**
 * Generate a team workflow skill that orchestrates multiple agents
 */
function generateTeamSkill(team) {
  const lines = [];
  lines.push('---');
  lines.push(`name: team-${team.id}`);
  lines.push(`description: "${team.name} workflow - ${team.description}"`);
  lines.push('metadata:');
  lines.push('  openclaw:');
  lines.push('    emoji: "👥"');
  lines.push('    source: agent-architect');
  lines.push(`    team_id: ${team.id}`);
  lines.push('---');
  lines.push('');
  lines.push(`# ${team.name} Workflow`);
  lines.push('');
  lines.push(team.description);
  lines.push('');

  if (team.workflow?.stages) {
    lines.push('## Workflow Stages');
    lines.push('');
    for (const stage of team.workflow.stages) {
      const parallel = stage.parallel ? ' *(parallel)*' : '';
      lines.push(`### ${stage.name}${parallel}`);
      lines.push(`**Agents:** ${stage.agents.join(', ')}`);
      if (stage.inputs) {
        lines.push(`**Inputs:** ${stage.inputs.join(', ')}`);
      }
      if (stage.outputs) {
        lines.push(`**Outputs:** ${stage.outputs.join(', ')}`);
      }
      lines.push('');
    }
  }

  lines.push('## Members');
  lines.push('');
  for (const member of team.members) {
    lines.push(`- **${member.agent_id}**: ${member.role}`);
  }
  lines.push('');

  if (team.collaboration_rules) {
    lines.push('## Collaboration Rules');
    lines.push('');
    lines.push(`- **Coordination:** ${team.collaboration_rules.coordination_mode}`);
    lines.push(`- **Handoff:** ${team.collaboration_rules.handoff_protocol}`);
    lines.push(`- **Output sharing:** ${team.collaboration_rules.output_sharing}`);
    lines.push('');
  }

  return lines.join('\n').trim() + '\n';
}

// ============================================================================
// openclaw.json Generation
// ============================================================================

/**
 * Generate the main openclaw.json configuration
 */
function generateOpenClawConfig(allAgents, allTeams, outputDir) {
  const agentsList = [
    {
      id: 'dispatcher',
      workspace: path.join(outputDir, 'workspace-dispatcher'),
      description: 'Central dispatcher that routes to specialist agents',
    },
  ];

  // Default binding: dispatcher handles everything
  const bindings = [
    {
      agentId: 'dispatcher',
      match: { channel: '*' },
      description: 'Default: all channels route to dispatcher',
    },
  ];

  const config = {
    $schema: 'https://openclaw.dev/schema/openclaw.json',
    version: '1.0',
    generated: {
      by: 'Agent Architect',
      at: new Date().toISOString(),
      script: 'scripts/generate-openclaw.js',
    },
    model: {
      provider: 'anthropic',
      model: 'claude-opus-4-5-20251101',
    },
    agents: {
      list: agentsList,
    },
    bindings: bindings,
    skills: {
      description: 'Agent skills are located in workspace-dispatcher/skills/',
      path: path.join(outputDir, 'workspace-dispatcher', 'skills'),
    },
  };

  return JSON.stringify(config, null, 2) + '\n';
}

// ============================================================================
// Main Processing
// ============================================================================

/**
 * Process a single agent into an OpenClaw workspace
 */
function processAgent(agentId, outputDir) {
  const agentDir = path.join(AGENTS_DIR, agentId);
  const config = readJSON(path.join(agentDir, 'config.json'));
  if (!config) return { error: `config.json not found for ${agentId}` };

  const skillContent = readText(path.join(agentDir, 'SKILL.md'));
  if (!skillContent) return { error: `SKILL.md not found for ${agentId}` };

  const workspaceDir = path.join(outputDir, `workspace-${agentId}`);
  const skillsDir = path.join(workspaceDir, 'skills');

  // Parse SKILL.md into soul and operational content
  const parsed = parseSkillMd(skillContent);

  // Create workspace directory
  fs.mkdirSync(workspaceDir, { recursive: true });
  fs.mkdirSync(skillsDir, { recursive: true });

  // Generate and write all workspace files
  fs.writeFileSync(path.join(workspaceDir, 'SOUL.md'), generateSoul(config, parsed.soul));
  fs.writeFileSync(path.join(workspaceDir, 'AGENTS.md'), generateAgentsMd(config, parsed.agents));
  fs.writeFileSync(path.join(workspaceDir, 'IDENTITY.md'), generateIdentity(config));
  fs.writeFileSync(path.join(workspaceDir, 'TOOLS.md'), generateTools(config));
  fs.writeFileSync(path.join(workspaceDir, 'USER.md'), generateUser());
  fs.writeFileSync(path.join(workspaceDir, 'MEMORY.md'), generateMemory(config));

  return {
    success: true,
    agentId,
    name: config.name,
    workspaceDir,
    files: ['SOUL.md', 'AGENTS.md', 'IDENTITY.md', 'TOOLS.md', 'USER.md', 'MEMORY.md'],
  };
}

/**
 * Load all agent configs
 */
function loadAllAgents() {
  const agents = {};
  for (const id of getAllIds(AGENTS_DIR)) {
    const config = readJSON(path.join(AGENTS_DIR, id, 'config.json'));
    if (config) agents[id] = config;
  }
  return agents;
}

/**
 * Load all team configs
 */
function loadAllTeams() {
  const teams = {};
  for (const id of getAllIds(TEAMS_DIR)) {
    const config = readJSON(path.join(TEAMS_DIR, id, 'team.json'));
    if (config) teams[id] = config;
  }
  return teams;
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  let targetAgent = null;
  let outputDir = DEFAULT_OUTPUT_DIR;

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--agent' && args[i + 1]) {
      targetAgent = args[i + 1];
      i++;
    } else if (args[i] === '--output' && args[i + 1]) {
      outputDir = path.resolve(args[i + 1]);
      i++;
    }
  }

  console.log('\nAgent Architect -> OpenClaw Generation');
  console.log('='.repeat(50));

  // Load all data
  const allAgents = loadAllAgents();
  const allTeams = loadAllTeams();

  const agentIds = targetAgent ? [targetAgent] : Object.keys(allAgents).sort();

  if (agentIds.length === 0) {
    console.log('No agents found to process.');
    process.exit(0);
  }

  console.log(`Processing ${agentIds.length} agent(s) and ${Object.keys(allTeams).length} team(s)...\n`);

  // Clean and create output directory
  if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true });
  }
  fs.mkdirSync(outputDir, { recursive: true });

  // Process each agent into its own workspace
  const results = { success: [], errors: [] };

  for (const agentId of agentIds) {
    const result = processAgent(agentId, outputDir);
    if (result.success) {
      results.success.push(result);
      console.log(`  [OK] ${result.name} -> workspace-${result.agentId}/`);
    } else {
      results.errors.push(result);
      console.log(`  [ERROR] ${agentId}: ${result.error}`);
    }
  }

  // Generate dispatcher agent
  console.log('\nGenerating dispatcher agent...');
  const dispatcher = generateDispatcher(allAgents, allTeams);
  const dispatcherDir = path.join(outputDir, 'workspace-dispatcher');
  const dispatcherSkillsDir = path.join(dispatcherDir, 'skills');
  fs.mkdirSync(dispatcherDir, { recursive: true });
  fs.mkdirSync(dispatcherSkillsDir, { recursive: true });

  fs.writeFileSync(path.join(dispatcherDir, 'SOUL.md'), dispatcher.soul);
  fs.writeFileSync(path.join(dispatcherDir, 'AGENTS.md'), dispatcher.agents);
  fs.writeFileSync(path.join(dispatcherDir, 'IDENTITY.md'), dispatcher.identity);
  fs.writeFileSync(path.join(dispatcherDir, 'TOOLS.md'), dispatcher.tools);
  fs.writeFileSync(path.join(dispatcherDir, 'USER.md'), dispatcher.user);

  console.log('  [OK] Dispatcher -> workspace-dispatcher/');

  // Generate agent skills (each AA agent becomes a dispatcher skill)
  console.log('\nGenerating dispatcher skills...');
  let skillCount = 0;

  for (const agentId of agentIds) {
    const config = allAgents[agentId];
    const skillContent = readText(path.join(AGENTS_DIR, agentId, 'SKILL.md'));
    if (!config || !skillContent) continue;

    const skillDir = path.join(dispatcherSkillsDir, agentId);
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(
      path.join(skillDir, 'SKILL.md'),
      generateAgentSkill(config, skillContent)
    );
    skillCount++;
  }
  console.log(`  [OK] ${skillCount} agent skill(s)`);

  // Generate team workflow skills
  let teamSkillCount = 0;
  for (const [teamId, team] of Object.entries(allTeams)) {
    const skillDir = path.join(dispatcherSkillsDir, `team-${teamId}`);
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(
      path.join(skillDir, 'SKILL.md'),
      generateTeamSkill(team)
    );
    teamSkillCount++;
  }
  console.log(`  [OK] ${teamSkillCount} team workflow skill(s)`);

  // Generate openclaw.json
  console.log('\nGenerating openclaw.json...');
  fs.writeFileSync(
    path.join(outputDir, 'openclaw.json'),
    generateOpenClawConfig(allAgents, allTeams, outputDir)
  );
  console.log('  [OK] openclaw.json');

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('Summary:');
  console.log(`  Agent workspaces: ${results.success.length}`);
  console.log(`  Dispatcher skills: ${skillCount} agents + ${teamSkillCount} teams`);
  console.log(`  Errors: ${results.errors.length}`);
  console.log(`\nOutput: ${outputDir}/`);
  console.log('');

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
  parseSkillMd,
  generateIdentity,
  generateSoul,
  generateAgentsMd,
  generateTools,
  generateUser,
  generateMemory,
  generateDispatcher,
  generateAgentSkill,
  generateTeamSkill,
  generateOpenClawConfig,
  processAgent,
  loadAllAgents,
  loadAllTeams,
};
