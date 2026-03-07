#!/usr/bin/env node

/**
 * Cowork Project Deployment Script v2.0
 *
 * Deploys standalone Cowork project folders with native MCP tools.
 * Orchestrators use Cowork delegation pattern: Agent(subagent_type="general-purpose")
 * with specialist SKILL.md content embedded in the prompt.
 *
 * Source: agents/, teams/, context-buckets/ (from Agent Architect)
 * Output: Standalone project folders on ~/Desktop/ (or custom path)
 *
 * Usage:
 *   node scripts/deploy-cowork.js                      # Deploy both projects
 *   node scripts/deploy-cowork.js --project max         # Max + YouTube only
 *   node scripts/deploy-cowork.js --project wharfside   # Wharfside only
 *   node scripts/deploy-cowork.js --output ~/Documents  # Custom output directory
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Import generateForExport from generate-agents.js (for agent .md files only)
const { generateForExport } = require('./generate-agents');

// ============================================================================
// Section 1: Project Definitions
// ============================================================================

const PROJECTS = {
  'max-assistant': {
    name: 'Max Personal Assistant',
    dir: 'max-assistant',
    teams: ['personal-assistant', 'youtube-content'],
    primaryTeam: 'personal-assistant',
    additionalAgents: ['web-research', 'chrome-browser', 'rag-search', 'pdf-scribe'],
    contextBuckets: ['research-cache', 'personal-notes', 'ai-journey', 'session-logs'],
    routing: [
      { signals: 'Email, calendar, tasks, research, personal, reminders, notes, contacts', skill: 'max' },
      { signals: 'YouTube, video, shorts, content, channel, upload, script, publish', skill: 'youtube-content' },
    ],
    defaultSkill: 'max',
    contactInfo: { personal: 'nickd@demarconet.com' },
  },
  'wharfside-assistant': {
    name: 'Wharfside Board Assistant',
    dir: 'wharfside-assistant',
    teams: ['wharfside-board-assistant'],
    primaryTeam: 'wharfside-board-assistant',
    additionalAgents: [],
    contextBuckets: ['wharfside-docs', 'session-logs'],
    routing: [],
    defaultSkill: 'wharfside',
    contactInfo: { board: 'nickd@wharfsidemb.com', personal: 'nickd@demarconet.com' },
  },
};

// ============================================================================
// Section 2: MCP Tool Documentation
// ============================================================================

const MCP_TOOL_DOCS = {
  'gmail': `## Gmail (Board Email)
Use native MCP tools for all email operations on the board account.
- **Search:** \`mcp__gmail__search_emails\` — query with Gmail search syntax, returns message list
- **Read:** \`mcp__gmail__read_email\` — read a specific message by ID
- **Draft:** \`mcp__gmail__draft_email\` — create an email draft
- **Send:** \`mcp__gmail__send_email\` — send an email directly
- **Labels:** \`mcp__gmail__list_email_labels\` — list all Gmail labels
- **Download:** \`mcp__gmail__download_attachment\` — download attachment by message ID
- **Modify:** \`mcp__gmail__modify_email\` — add/remove labels on a message
- **Filters:** \`mcp__gmail__create_filter\`, \`mcp__gmail__list_filters\`, \`mcp__gmail__delete_filter\`
- **Labels CRUD:** \`mcp__gmail__create_label\`, \`mcp__gmail__update_label\`, \`mcp__gmail__delete_label\`
- **Batch:** \`mcp__gmail__batch_modify_emails\`, \`mcp__gmail__batch_delete_emails\`
`,

  'gmail-personal': `## Gmail (Personal Email)
Use native MCP tools for personal email operations.
- **Search:** \`mcp__gmail-personal__search_emails\` — query with Gmail search syntax
- **Read:** \`mcp__gmail-personal__read_email\` — read a specific message by ID
- **Draft:** \`mcp__gmail-personal__draft_email\` — create an email draft
- **Send:** \`mcp__gmail-personal__send_email\` — send an email directly
- **Labels:** \`mcp__gmail-personal__list_email_labels\` — list all Gmail labels
- **Download:** \`mcp__gmail-personal__download_attachment\` — download attachment by message ID
- **Modify:** \`mcp__gmail-personal__modify_email\` — add/remove labels on a message
- **Filters:** \`mcp__gmail-personal__create_filter\`, \`mcp__gmail-personal__list_filters\`
- **Batch:** \`mcp__gmail-personal__batch_modify_emails\`, \`mcp__gmail-personal__batch_delete_emails\`
`,

  'google-docs': `## Google Docs
Use native MCP tools for document operations.
- **Create:** \`mcp__google-docs-mcp__google_docs_create\` — create a new document
- **Update:** \`mcp__google-docs-mcp__google_docs_update\` — update document content
- **Append:** \`mcp__google-docs-mcp__google_docs_append\` — append content to a document
- **Export:** \`mcp__google-docs-mcp__google_docs_export\` — export as PDF, DOCX, etc.
- **To Markdown:** \`mcp__google-docs-mcp__google_docs_to_markdown\` — convert doc to markdown
- **List:** \`mcp__google-docs-mcp__google_docs_list\` — list recent documents
- **Search:** \`mcp__google-docs-mcp__google_docs_search\` — search documents by query
- **Share:** \`mcp__google-docs-mcp__google_docs_share\` — share a document
- **Delete:** \`mcp__google-docs-mcp__google_docs_delete\` — delete a document
`,

  'gdrive': `## Google Drive
Use native MCP tools for Drive operations.
- **Search:** \`mcp__google-drive__gdrive_search\` — search files in Google Drive
- **Read:** \`mcp__google-drive__gdrive_read_file\` — read file contents
- **Sheets Read:** \`mcp__google-drive__gsheets_read\` — read spreadsheet data
- **Sheets Update:** \`mcp__google-drive__gsheets_update_cell\` — update a cell value
`,

  'google-drive': `## Google Drive
Use native MCP tools for Drive operations.
- **Search:** \`mcp__google-drive__gdrive_search\` — search files in Google Drive
- **Read:** \`mcp__google-drive__gdrive_read_file\` — read file contents
- **Sheets Read:** \`mcp__google-drive__gsheets_read\` — read spreadsheet data
- **Sheets Update:** \`mcp__google-drive__gsheets_update_cell\` — update a cell value
`,

  'chrome': `## Chrome Browser
Use native MCP tools for browser automation.
- **Navigate:** \`mcp__chrome__navigate_page\` — go to a URL
- **New Page:** \`mcp__chrome__new_page\` — open a new browser tab
- **Close:** \`mcp__chrome__close_page\` — close a browser tab
- **Click:** \`mcp__chrome__click\` — click an element on the page
- **Fill:** \`mcp__chrome__fill\` — fill a form field
- **Fill Form:** \`mcp__chrome__fill_form\` — fill multiple form fields at once
- **Type:** \`mcp__chrome__type_text\` — type text into focused element
- **Press Key:** \`mcp__chrome__press_key\` — press a keyboard key
- **Screenshot:** \`mcp__chrome__take_screenshot\` — capture a screenshot
- **Snapshot:** \`mcp__chrome__take_snapshot\` — get page accessibility tree
- **Wait:** \`mcp__chrome__wait_for\` — wait for an element or condition
- **JS:** \`mcp__chrome__evaluate_script\` — execute JavaScript in page
- **Upload:** \`mcp__chrome__upload_file\` — upload a file via file input
- **Hover:** \`mcp__chrome__hover\` — hover over an element
- **List Pages:** \`mcp__chrome__list_pages\` — list open browser tabs
- **Select Page:** \`mcp__chrome__select_page\` — switch to a different tab
`,

  'openai-image': `## Image Generation (OpenAI)
Use native MCP tools for AI image generation.
- **GPT Image (best):** \`mcp__openai-image__generate_image_gpt\` — GPT Image model (highest quality)
- **GPT Mini:** \`mcp__openai-image__generate_image_gpt_mini\` — GPT Image mini (faster, cheaper)
- **DALL-E 3:** \`mcp__openai-image__generate_image_dalle3\` — DALL-E 3 model
- **DALL-E 2:** \`mcp__openai-image__generate_image_dalle2\` — DALL-E 2 model (fastest)
`,

  'voicemode': `## Voice Mode (TTS)
Use native MCP tools for text-to-speech.
- **Converse:** \`mcp__voicemode__converse\` — speak text aloud with TTS
- **Service Info:** \`mcp__voicemode__service\` — get service status
`,

  'pdfscribe': `## PDF Processing (PDFScribe)
Use native MCP tools for PDF operations.
- **Transcribe:** \`mcp__pdfscribe__transcribe_pdf\` — extract text/content from a PDF
- **Split:** \`mcp__pdfscribe__split_pdf\` — split a large PDF into chunks
- **List:** \`mcp__pdfscribe__list_transcriptions\` — list previous transcriptions
- **To Website:** \`mcp__pdfscribe__pdf_to_website\` — convert PDF to web page
`,

  'gtasks': `## Google Tasks
Use native MCP tools for task management.
- **List Task Lists:** \`mcp__gtasks__listTaskLists\` — list all task lists
- **Get Tasks:** \`mcp__gtasks__getTasks\` — get tasks from a list
- **Create:** \`mcp__gtasks__createTask\` — create a new task
- **Update:** \`mcp__gtasks__updateTask\` — update a task
- **Complete:** \`mcp__gtasks__completeTask\` — mark a task complete
- **Delete:** \`mcp__gtasks__deleteTask\` — delete a task
- **Search:** \`mcp__gtasks__searchTasks\` — search across tasks
- **Sync:** \`mcp__gtasks__syncAllTasks\` — sync all tasks
`,

  'apple-mcp': `## Apple Reminders & Calendar
Use native MCP tools for Apple Reminders and Calendar.
- **Reminders - Tasks:** \`mcp__apple-mcp__reminders_tasks\` — CRUD operations on reminder items
- **Reminders - Lists:** \`mcp__apple-mcp__reminders_lists\` — manage reminder lists
- **Calendar - Events:** \`mcp__apple-mcp__calendar_events\` — CRUD operations on calendar events
- **Calendar - Calendars:** \`mcp__apple-mcp__calendar_calendars\` — list calendars

**Reminder List Usage:** Nick uses Reminders as recurring grocery/shopping lists. Items get completed when purchased. When adding an item, always search completed items first and uncheck rather than creating duplicates.
`,

  'apple-contacts': `## Apple Contacts (CLI)
Apple Contacts MCP is unreliable. Use the CLI via Bash instead:
\`\`\`bash
/Users/nickd/Workspaces/Contactbook/.build/release/contactbook contacts search "query" --json
/Users/nickd/Workspaces/Contactbook/.build/release/contactbook contacts list --limit 10 --json
/Users/nickd/Workspaces/Contactbook/.build/release/contactbook groups list --json
/Users/nickd/Workspaces/Contactbook/.build/release/contactbook lookup "phone" --json
\`\`\`
`,

  'video-editor': `## Video Editor
Use native MCP tools for video editing operations.
- **Execute:** \`mcp__video-editor__execute_command\` — run a video editing command
- **Export Path:** \`mcp__video-editor__export_path\` — get the export file path
`,

  'powerpoint': `## PowerPoint (python-pptx)
Write and execute Python scripts using python-pptx for presentation creation:
\`\`\`python
from pptx import Presentation
from pptx.util import Inches, Pt
prs = Presentation('templates/Wharfside_TEMPLATE.pptx')
slide = prs.slides.add_slide(prs.slide_layouts[1])
slide.placeholders[0].text = "Title"
prs.save('output.pptx')
\`\`\`
`,
};

// ============================================================================
// Section 3: MCP Permission Map
// ============================================================================

const MCP_PERMISSION_MAP = {
  'gmail':          ['mcp__gmail__*'],
  'gmail-personal': ['mcp__gmail-personal__*'],
  'google-docs':    ['mcp__google-docs-mcp__*'],
  'gdrive':         ['mcp__google-drive__*'],
  'google-drive':   ['mcp__google-drive__*'],
  'chrome':         ['mcp__chrome__*'],
  'openai-image':   ['mcp__openai-image__*'],
  'voicemode':      ['mcp__voicemode__*'],
  'pdfscribe':      ['mcp__pdfscribe__*'],
  'gtasks':         ['mcp__gtasks__*'],
  'apple-mcp':      ['mcp__apple-mcp__*'],
  'apple-contacts': ['mcp__apple-contacts__*'],
  'video-editor':   ['mcp__video-editor__*'],
  'powerpoint':     [],  // No MCP, uses Bash
};

// ============================================================================
// Section 4: Paths
// ============================================================================

const SCRIPT_DIR = __dirname;
const AA_ROOT = path.join(SCRIPT_DIR, '..');
const AGENTS_DIR = path.join(AA_ROOT, 'agents');
const TEAMS_DIR = path.join(AA_ROOT, 'teams');
const BUCKETS_DIR = path.join(AA_ROOT, 'context-buckets');
const DEFAULT_OUTPUT_BASE = path.join(require('os').homedir(), 'Desktop');

// ============================================================================
// Section 5: Helper Functions
// ============================================================================

function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    const srcPath = path.join(src, entry);
    const destPath = path.join(dest, entry);
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function resolveAgentIds(project) {
  const ids = new Set(project.additionalAgents || []);
  for (const teamId of project.teams) {
    const teamPath = path.join(TEAMS_DIR, teamId, 'team.json');
    if (!fs.existsSync(teamPath)) continue;
    const teamConfig = JSON.parse(fs.readFileSync(teamPath, 'utf-8'));
    for (const member of (teamConfig.members || [])) {
      ids.add(member.agent_id);
    }
  }
  return Array.from(ids);
}

function collectMcpServers(agentIds) {
  const servers = new Set();
  for (const id of agentIds) {
    const configPath = path.join(AGENTS_DIR, id, 'config.json');
    if (!fs.existsSync(configPath)) continue;
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    for (const s of (config.mcp_servers || [])) {
      servers.add(s);
    }
  }
  return Array.from(servers);
}

function countFiles(dir) {
  if (!fs.existsSync(dir)) return 0;
  let count = 0;
  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      count += countFiles(fullPath);
    } else {
      count++;
    }
  }
  return count;
}

function readAgentConfig(agentDir) {
  const configPath = path.join(agentDir, 'config.json');
  if (!fs.existsSync(configPath)) return null;
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

function readTeamConfig(teamDir) {
  const configPath = path.join(teamDir, 'team.json');
  if (!fs.existsSync(configPath)) return null;
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

// ============================================================================
// Section 6: Cowork Orchestrator Skill Generation
// ============================================================================

/**
 * Generate a Cowork-native orchestrator skill for a team.
 * Uses Agent(subagent_type="general-purpose") delegation pattern.
 * All paths are project-relative (no AgentArchitect/ prefix).
 */
function generateCoworkOrchestratorSkill(teamConfig, allAgents, project) {
  const orch = teamConfig.orchestration || {};
  const routing = orch.routing || {};
  const members = teamConfig.members || [];
  const skillName = teamConfig.skill_alias || teamConfig.id;

  const lines = [
    '---',
    `name: ${skillName}`,
    `description: ${teamConfig.description}`,
    '---',
    '',
    `<!-- GENERATED BY deploy-cowork.js v2.0 - DO NOT EDIT DIRECTLY -->`,
    `<!-- Source: teams/${teamConfig.id}/ -->`,
    '',
    `# ${teamConfig.name} - Orchestrator`,
    '',
    teamConfig.description,
    '',
    '## Orchestration Strategy',
    '',
    orch.delegation_strategy || 'Delegate work to specialist subagents. Keep this context lean.',
    '',
  ];

  // Custom orchestrator instructions (e.g., YouTube Creative Brief)
  if (orch.orchestrator_instructions) {
    lines.push(orch.orchestrator_instructions);
    lines.push('');
  }

  // Delegation rules — Cowork Agent tool pattern
  const hasCustomInstructions = !!orch.orchestrator_instructions;
  lines.push('## CRITICAL: Delegation Rules');
  lines.push('');

  let ruleNum = 1;
  if (hasCustomInstructions) {
    lines.push(`${ruleNum}. **Run any pre-delegation phases first** (see above) — do NOT jump straight to specialists`);
    ruleNum++;
  }
  lines.push(`${ruleNum}. **NEVER do deep analysis yourself** — always delegate to a specialist subagent`);
  ruleNum++;
  lines.push(`${ruleNum}. **Parse the request** — understand what type of work is needed`);
  ruleNum++;
  lines.push(`${ruleNum}. **Select specialist(s)** — choose the right agent(s) from the roster below`);
  ruleNum++;
  lines.push(`${ruleNum}. **For each specialist, use the Agent tool:**`);
  lines.push(`   a. Read the specialist's SKILL.md from the path shown in their roster entry`);
  lines.push(`   b. Construct an Agent tool call with subagent_type="general-purpose"`);
  lines.push(`   c. Include the SKILL.md content, context bucket paths, and the task in the prompt`);
  lines.push(`   d. Set the model parameter to match the specialist's preferred model`);
  ruleNum++;
  lines.push(`${ruleNum}. **Run multiple Agent calls in parallel** when specialists are independent — use a single message with multiple Agent tool calls`);
  ruleNum++;
  lines.push(`${ruleNum}. **Synthesize results** — combine specialist outputs into a coherent response for the user`);
  ruleNum++;
  if (orch.session_summary?.enabled) {
    lines.push(`${ruleNum}. **Write session log** — ALWAYS log the interaction (see Session Summary below)`);
    ruleNum++;
  }
  lines.push('');

  // Delegation template
  lines.push('## How to Invoke a Specialist');
  lines.push('');
  lines.push('For each specialist delegation, follow this pattern:');
  lines.push('');
  lines.push('```');
  lines.push('1. Read the specialist\'s SKILL.md file using the Read tool');
  lines.push('2. Call the Agent tool:');
  lines.push('   Agent(');
  lines.push('     subagent_type="general-purpose",');
  lines.push('     model="<specialist model>",');
  lines.push('     description="<3-5 word task summary>",');
  lines.push('     prompt="You are the <Name> specialist.\\n\\n<SKILL.md content>\\n\\n');
  lines.push('       ## Context Buckets\\n<paths from roster>\\n\\n');
  lines.push('       ## Task\\n<YOUR TASK HERE>\\n\\n');
  lines.push('       Return a concise briefing with:\\n');
  lines.push('       - Key Findings\\n- Artifacts created\\n- Recommendations"');
  lines.push('   )');
  lines.push('```');
  lines.push('');

  // Available specialists roster
  lines.push('## Available Specialists');
  lines.push('');

  for (const member of members) {
    const agentConfig = allAgents[member.agent_id];
    if (!agentConfig) continue;

    const model = agentConfig.execution?.model || 'sonnet';

    lines.push(`### ${agentConfig.name}`);
    lines.push(`- **Role:** ${member.role}`);
    lines.push(`- **SKILL.md:** \`agents/${member.agent_id}/SKILL.md\``);
    lines.push(`- **Model:** ${model}`);

    // Context buckets (project-relative paths)
    if (agentConfig.context_buckets?.assigned?.length > 0) {
      const bucketList = agentConfig.context_buckets.assigned
        .filter(b => {
          const id = typeof b === 'string' ? b : b.id;
          return project.contextBuckets.includes(id);
        })
        .map(b => {
          const id = typeof b === 'string' ? b : b.id;
          return `\`context-buckets/${id}/\``;
        }).join(', ');
      if (bucketList) {
        lines.push(`- **Context Buckets:** ${bucketList}`);
      }
    }

    if (agentConfig.description) {
      lines.push(`- **Capabilities:** ${agentConfig.description}`);
    }

    lines.push('');
  }

  // Routing table
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

  // Workflow stages
  if (teamConfig.workflow?.stages) {
    lines.push('## Workflow Stages');
    lines.push('');
    for (const stage of teamConfig.workflow.stages) {
      const stageAgents = stage.agents.map(id => allAgents[id]?.name || id).join(', ') || 'Orchestrator';
      const parallel = stage.parallel ? ' (parallel)' : '';
      lines.push(`**${stage.name}**${parallel}: ${stageAgents}`);
      if (stage.inputs) {
        lines.push(`  - Inputs: ${stage.inputs.join(', ')}`);
      }
      if (stage.outputs) {
        lines.push(`  - Outputs: ${stage.outputs.join(', ')}`);
      }
      if (stage.notes) {
        lines.push(`  - Notes: ${stage.notes}`);
      }
    }
    lines.push('');
  }

  // Session summary
  if (orch.session_summary?.enabled) {
    const logPath = orch.session_summary.output_path || 'context-buckets/session-logs/files/';
    lines.push('## Session Summary (MANDATORY)');
    lines.push('');
    lines.push('**ALWAYS write a session log after EVERY interaction**, not just complex ones.');
    lines.push('Do this as your FINAL step before responding to the user.');
    lines.push('');
    lines.push(`**Path:** \`${logPath}\``);
    lines.push(`**Filename:** \`YYYY-MM-DD_${teamConfig.id}_topic-slug.md\``);
    lines.push('');
    lines.push('**Template:**');
    lines.push('````markdown');
    lines.push('# Session: [Brief Title]');
    lines.push('');
    lines.push('**Date:** YYYY-MM-DD');
    lines.push(`**Team:** ${teamConfig.id}`);
    lines.push('**Specialists Invoked:** [list]');
    lines.push('');
    lines.push('## Request');
    lines.push('[What the user asked]');
    lines.push('');
    lines.push('## Actions');
    lines.push('- [Specialist] — [what it did, key findings]');
    lines.push('');
    lines.push('## Artifacts');
    lines.push('- [paths to any files created, or "None"]');
    lines.push('');
    lines.push('## Key Findings');
    lines.push('[Summary of results delivered to user]');
    lines.push('````');
    lines.push('');
  }

  // Email accounts
  if (teamConfig.gmail_accounts) {
    lines.push('## Email Accounts');
    lines.push('');
    for (const [key, value] of Object.entries(teamConfig.gmail_accounts)) {
      lines.push(`- **${key}:** ${value}`);
    }
    lines.push('');
  }

  // Branding
  if (teamConfig.branding) {
    lines.push('## Branding');
    lines.push('');
    if (teamConfig.branding.logo_url) {
      lines.push(`- **Logo:** ${teamConfig.branding.logo_url}`);
    }
    if (teamConfig.branding.colors) {
      for (const [name, hex] of Object.entries(teamConfig.branding.colors)) {
        lines.push(`- **${name}:** ${hex}`);
      }
    }
    if (teamConfig.branding.location) {
      lines.push(`- **Location:** ${teamConfig.branding.location}`);
    }
    lines.push('');
  }

  // MCP tools reference for the team
  const teamMcpServers = new Set();
  for (const member of members) {
    const config = allAgents[member.agent_id];
    if (config?.mcp_servers) {
      for (const s of config.mcp_servers) teamMcpServers.add(s);
    }
  }
  const mcpSections = [];
  const seen = new Set();
  for (const server of teamMcpServers) {
    if (seen.has(server)) continue;
    seen.add(server);
    const doc = MCP_TOOL_DOCS[server];
    if (doc) mcpSections.push(doc);
  }
  if (mcpSections.length > 0) {
    lines.push('## MCP Tools Reference');
    lines.push('');
    lines.push('MCP tools are available natively. Use them directly in specialist prompts.');
    lines.push('');
    lines.push(mcpSections.join('\n'));
  }

  // RAG FTS5 section
  const defaultBucket = getTeamDefaultBucket(teamConfig, project);
  if (defaultBucket) {
    lines.push('## RAG Full-Text Search (Offline FTS5)');
    lines.push('');
    lines.push('Search indexed documents via the local FTS5 database.');
    lines.push('');
    lines.push('```bash');
    lines.push(`python cowork/rag-client-fts.py search "YOUR QUERY" --bucket ${defaultBucket} --limit 10`);
    lines.push('```');
    lines.push('');
    lines.push('Available buckets:');
    for (const b of project.contextBuckets) {
      lines.push(`- \`${b}\``);
    }
    lines.push('');
    lines.push('Tips: Use specific keywords. OR for alternatives. * for prefix matching.');
    lines.push('');
  }

  // Shared context
  if (teamConfig.shared_context?.buckets?.length > 0) {
    lines.push('## Shared Context');
    lines.push('');
    for (const bucketId of teamConfig.shared_context.buckets) {
      if (project.contextBuckets.includes(bucketId)) {
        lines.push(`- \`context-buckets/${bucketId}/\``);
      }
    }
    if (teamConfig.shared_context.outputs_folder) {
      lines.push(`- **Outputs:** \`${teamConfig.shared_context.outputs_folder}/\``);
    }
    lines.push('');
  }

  lines.push('## User Request');
  lines.push('');
  lines.push('$ARGUMENTS');

  return lines.join('\n');
}

function getTeamDefaultBucket(teamConfig, project) {
  const buckets = teamConfig.shared_context?.buckets || [];
  for (const b of buckets) {
    if (project.contextBuckets.includes(b)) return b;
  }
  return project.contextBuckets[0] || null;
}

// ============================================================================
// Section 7: Post-Processing — Replace CLI docs with MCP docs in agent files
// ============================================================================

function postProcessMcpDocs(projectDir, agentIds) {
  const agentsOutputDir = path.join(projectDir, '.claude', 'agents');

  for (const agentId of agentIds) {
    const agentFile = path.join(agentsOutputDir, `${agentId}.md`);
    if (!fs.existsSync(agentFile)) continue;

    let content = fs.readFileSync(agentFile, 'utf-8');

    // Strip the CLI Tools Reference section
    const cliMarker = '\n---\n\n# CLI Tools Reference';
    const cliIdx = content.indexOf(cliMarker);
    if (cliIdx !== -1) {
      content = content.substring(0, cliIdx);
    }

    // Read agent's config for mcp_servers
    const configPath = path.join(projectDir, 'agents', agentId, 'config.json');
    if (!fs.existsSync(configPath)) {
      fs.writeFileSync(agentFile, content, 'utf-8');
      continue;
    }
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const mcpServers = config.mcp_servers || [];

    // Append MCP tools reference
    const sections = [];
    const seen = new Set();
    for (const server of mcpServers) {
      if (seen.has(server)) continue;
      seen.add(server);
      const doc = MCP_TOOL_DOCS[server];
      if (doc) sections.push(doc);
    }

    if (sections.length > 0) {
      content += '\n\n---\n\n# MCP Tools Reference\n\n<!-- Generated by deploy-cowork.js -->\n\n' + sections.join('\n');
    }

    // Patch RAG commands
    content = patchRagCommands(content);

    fs.writeFileSync(agentFile, content, 'utf-8');
  }
}

function patchRagCommands(content) {
  // Pattern 1: Fenced code blocks with cd ... python -c "from src.rag import search_documents;..."
  content = content.replace(
    /```bash\ncd [^\n]+python[^\n]+"from src\.rag import search_documents;[^`]*```/g,
    '```bash\npython cowork/rag-client-fts.py search "YOUR_QUERY" --bucket BUCKET_ID --limit 10\n```'
  );

  // Pattern 2: Inline backticked cd ... python -c "from src.rag import search_documents;..."
  content = content.replace(
    /`cd \/Users\/\S+\/pdfscribe_cli && [^`]*python[^`]*"from src\.rag import search_documents;[^`]*`/g,
    (match) => {
      const bucketMatch = match.match(/bucket_id='([^']+)'/);
      const queryMatch = match.match(/search_documents\('([^']+)'/);
      const bucket = bucketMatch ? bucketMatch[1] : 'BUCKET_ID';
      const query = queryMatch ? queryMatch[1] : 'YOUR_QUERY';
      return `\`python cowork/rag-client-fts.py search "${query}" --bucket ${bucket} --limit 10\``;
    }
  );

  // Pattern 3: Bare cd commands (single-line search)
  content = content.replace(
    /cd \/Users\/\S+\/pdfscribe_cli && [^\n]*python[^\n]*"from src\.rag import search_documents;[^\n]*"/g,
    (match) => {
      const bucketMatch = match.match(/bucket_id='([^']+)'/);
      const queryMatch = match.match(/search_documents\('([^']+)'/);
      const bucket = bucketMatch ? bucketMatch[1] : 'BUCKET_ID';
      const query = queryMatch ? queryMatch[1] : 'YOUR_QUERY';
      return `python cowork/rag-client-fts.py search "${query}" --bucket ${bucket} --limit 10`;
    }
  );

  // Pattern 4: Multi-line code blocks with from src.rag import search_documents
  content = content.replace(
    /```bash\ncd \/Users\/\S+\/pdfscribe_cli[^`]*from src\.rag import search_documents[^`]*```/g,
    (match) => {
      const bucketMatch = match.match(/bucket_id='([^']+)'/);
      const queryMatch = match.match(/search_documents\('([^']+)'/);
      const bucket = bucketMatch ? bucketMatch[1] : 'BUCKET_ID';
      const query = queryMatch ? queryMatch[1] : 'YOUR_QUERY';
      return '```bash\npython cowork/rag-client-fts.py search "' + query + '" --bucket ' + bucket + ' --limit 10\n```';
    }
  );

  // Pattern 5: Ingestion commands
  content = content.replace(
    /```bash\ncd \/Users\/\S+\/pdfscribe_cli[^`]*from src\.rag import ingest_document[^`]*```/g,
    '```bash\n# Ingestion: rebuild the FTS5 database after adding new files to context-buckets/\npython scripts/build-fts-db.py --force\n```'
  );

  return content;
}

// ============================================================================
// Section 8: CLAUDE.md Generation (Cowork routing pattern)
// ============================================================================

function generateClaudeMd(projectKey, teamSkills) {
  const project = PROJECTS[projectKey];
  const lines = [];

  lines.push(`# ${project.name}`);
  lines.push('');

  // Contact info
  lines.push('## Contact Information');
  if (project.contactInfo.board) {
    lines.push(`- **Board Email:** ${project.contactInfo.board}`);
  }
  if (project.contactInfo.personal) {
    lines.push(`- **Personal Email:** ${project.contactInfo.personal}`);
  }
  lines.push('');

  // Smart routing — Cowork pattern (Read SKILL.md and follow instructions)
  lines.push('## Smart Routing (MANDATORY)');
  lines.push('');
  lines.push('When the user makes a request, route to the appropriate orchestrator by');
  lines.push('**reading its SKILL.md file** and following its instructions.');
  lines.push('The orchestrator handles routing and delegation to specialist subagents.');
  lines.push('');

  if (project.routing.length > 0) {
    lines.push('| Topic Signals | Action |');
    lines.push('|---|---|');
    for (const route of project.routing) {
      lines.push(`| ${route.signals} | Read \`cowork/skills/${route.skill}/SKILL.md\` and follow its orchestration instructions |`);
    }
    lines.push('');
    lines.push(`### Default: If unclear, read \`cowork/skills/${project.defaultSkill}/SKILL.md\``);
  } else {
    lines.push(`All requests: Read \`cowork/skills/${project.defaultSkill}/SKILL.md\` and follow its orchestration instructions.`);
  }
  lines.push('');

  lines.push('### Routing Rules');
  lines.push('');
  lines.push('1. Match on keywords in the user\'s request');
  lines.push('2. If ambiguous, ask which team they want');
  lines.push('3. **ALWAYS read the orchestrator SKILL.md** — never call specialist agents directly');
  lines.push('4. The orchestrator will delegate to the right specialist(s) via the Agent tool');
  lines.push('');

  // Branding (Wharfside only)
  if (projectKey === 'wharfside-assistant') {
    lines.push('## Branding');
    lines.push('');
    lines.push('- **Navy:** #1a3a5c');
    lines.push('- **Gold:** #c9a227');
    lines.push('- **Logo:** https://raw.githubusercontent.com/nickdnj/wharfside-assets/master/Wharfside_Logo_Cropped.png');
    lines.push('- **Location:** Wharfside Manor, Monmouth Beach, NJ');
    lines.push('');
  }

  // RAG search
  lines.push('## RAG Search (Offline FTS5)');
  lines.push('');
  lines.push('Search indexed documents using the local FTS5 database:');
  lines.push('');
  lines.push('```bash');
  const defaultBucket = project.contextBuckets[0];
  lines.push(`python cowork/rag-client-fts.py search "query" --bucket ${defaultBucket} --limit 10`);
  lines.push('```');
  lines.push('');
  lines.push('Available buckets:');
  for (const bucket of project.contextBuckets) {
    lines.push(`- \`${bucket}\``);
  }
  lines.push('');
  lines.push('Other commands:');
  lines.push('```bash');
  lines.push('python cowork/rag-client-fts.py buckets   # List indexed buckets');
  lines.push('python cowork/rag-client-fts.py stats     # Database statistics');
  lines.push('```');
  lines.push('');

  return lines.join('\n');
}

// ============================================================================
// Section 9: settings.local.json Generation
// ============================================================================

function generateSettingsLocal(agentIds) {
  const mcpServers = collectMcpServers(agentIds);
  const permissions = new Set();

  for (const server of mcpServers) {
    const perms = MCP_PERMISSION_MAP[server];
    if (perms) {
      for (const p of perms) permissions.add(p);
    }
  }

  const bashPerms = [
    'Bash(python:*)',
    'Bash(python3:*)',
    'Bash(ls:*)',
    'Bash(mkdir:*)',
    'Bash(git status:*)',
    'Bash(git diff:*)',
    'Bash(git log:*)',
    'Bash(git add:*)',
    'Bash(git commit:*)',
    'Bash(node:*)',
    'Bash(ffmpeg:*)',
    'Bash(ffprobe:*)',
    'Bash(curl:*)',
    'Bash(open:*)',
    'Bash(/Users/nickd/Workspaces/Contactbook/.build/release/contactbook:*)',
    'WebSearch',
  ];
  for (const p of bashPerms) permissions.add(p);

  return {
    permissions: {
      allow: Array.from(permissions).sort(),
    },
  };
}

// ============================================================================
// Section 10: Core Deploy Function
// ============================================================================

function deployProject(projectKey, outputBase) {
  const project = PROJECTS[projectKey];
  const projectDir = path.join(outputBase, project.dir);

  console.log(`\n  Deploying: ${project.name}`);
  console.log(`  Output:    ${projectDir}`);

  // 1. Create directory structure
  const dirs = [
    '.claude/agents',
    '.claude/skills',
    'agents',
    'teams',
    'context-buckets',
    'cowork/skills',
    'data',
    'scripts',
  ];
  for (const d of dirs) {
    fs.mkdirSync(path.join(projectDir, d), { recursive: true });
  }

  // 2. Resolve all agent IDs
  const agentIds = resolveAgentIds(project);
  console.log(`  Agents:    ${agentIds.length} (${agentIds.join(', ')})`);

  // 3. Copy source agent definitions
  for (const agentId of agentIds) {
    const srcDir = path.join(AGENTS_DIR, agentId);
    const destDir = path.join(projectDir, 'agents', agentId);
    if (fs.existsSync(srcDir)) {
      copyDirSync(srcDir, destDir);
    } else {
      console.log(`    [WARN] Agent source not found: ${agentId}`);
    }
  }

  // 4. Copy team definitions
  for (const teamId of project.teams) {
    const srcDir = path.join(TEAMS_DIR, teamId);
    const destDir = path.join(projectDir, 'teams', teamId);
    if (fs.existsSync(srcDir)) {
      copyDirSync(srcDir, destDir);
    } else {
      console.log(`    [WARN] Team source not found: ${teamId}`);
    }
  }

  // 5. Copy context bucket files
  for (const bucketId of project.contextBuckets) {
    const srcDir = path.join(BUCKETS_DIR, bucketId);
    const destDir = path.join(projectDir, 'context-buckets', bucketId);
    if (fs.existsSync(srcDir)) {
      copyDirSync(srcDir, destDir);
      const fileCount = countFiles(path.join(destDir, 'files'));
      console.log(`    [OK] Bucket: ${bucketId} (${fileCount} files)`);
    } else {
      console.log(`    [WARN] Bucket not found: ${bucketId}`);
    }
  }

  // 6. Copy RAG client and FTS5 builder
  const ragClientSrc = path.join(AA_ROOT, 'cowork', 'rag-client-fts.py');
  const ragClientDest = path.join(projectDir, 'cowork', 'rag-client-fts.py');
  if (fs.existsSync(ragClientSrc)) {
    fs.copyFileSync(ragClientSrc, ragClientDest);
  }
  const buildDbSrc = path.join(AA_ROOT, 'scripts', 'build-fts-db.py');
  const buildDbDest = path.join(projectDir, 'scripts', 'build-fts-db.py');
  if (fs.existsSync(buildDbSrc)) {
    fs.copyFileSync(buildDbSrc, buildDbDest);
  }

  // 7. Generate agent .md files via generateForExport (for reference/specialist definitions)
  console.log(`  Generating agent definitions...`);
  const exportResult = generateForExport({
    agentsDir: path.join(projectDir, 'agents'),
    teamsDir: path.join(projectDir, 'teams'),
    outputAgentsDir: path.join(projectDir, '.claude', 'agents'),
    outputSkillsDir: path.join(projectDir, '.claude', 'skills'),
    agentFilter: agentIds,
    teamFilter: project.teams,
  });

  const agentOk = exportResult.agentResults.success.length;
  const agentErr = exportResult.agentResults.errors.length;
  console.log(`    Agents: ${agentOk} ok, ${agentErr} errors`);

  // 8. Post-process: Replace CLI tool docs with MCP tool docs in agent files
  console.log(`  Post-processing MCP tool docs...`);
  postProcessMcpDocs(projectDir, agentIds);

  // 9. Generate Cowork-native orchestrator skills (Agent tool delegation pattern)
  console.log(`  Generating Cowork orchestrator skills...`);
  const allAgents = {};
  for (const agentId of agentIds) {
    const config = readAgentConfig(path.join(projectDir, 'agents', agentId));
    if (config) allAgents[agentId] = config;
  }

  const teamSkills = [];
  for (const teamId of project.teams) {
    const teamConfig = readTeamConfig(path.join(projectDir, 'teams', teamId));
    if (!teamConfig) continue;

    const skillName = teamConfig.skill_alias || teamId;
    const skillContent = generateCoworkOrchestratorSkill(teamConfig, allAgents, project);

    // Write to cowork/skills/<skill-name>/SKILL.md
    const skillDir = path.join(projectDir, 'cowork', 'skills', skillName);
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), skillContent, 'utf-8');

    teamSkills.push({ skillName, teamId, name: teamConfig.name });
    console.log(`    [OK] cowork/skills/${skillName}/SKILL.md`);
  }

  // 10. Generate CLAUDE.md (Cowork routing pattern)
  const claudeMd = generateClaudeMd(projectKey, teamSkills);
  fs.writeFileSync(path.join(projectDir, 'CLAUDE.md'), claudeMd, 'utf-8');
  console.log(`    [OK] CLAUDE.md`);

  // 11. Generate settings.local.json
  const settings = generateSettingsLocal(agentIds);
  const settingsDir = path.join(projectDir, '.claude');
  fs.writeFileSync(
    path.join(settingsDir, 'settings.local.json'),
    JSON.stringify(settings, null, 2) + '\n',
    'utf-8'
  );
  console.log(`    [OK] .claude/settings.local.json (${settings.permissions.allow.length} permissions)`);

  // 12. Build FTS5 database
  console.log(`  Building FTS5 database...`);
  try {
    const buildCmd = `python3 "${buildDbDest}"`;
    const buildOutput = execSync(buildCmd, {
      cwd: projectDir,
      encoding: 'utf-8',
      timeout: 120000,
    });
    const summaryMatch = buildOutput.match(/Summary: (.+)/);
    if (summaryMatch) {
      console.log(`    [OK] FTS5: ${summaryMatch[1]}`);
    } else {
      console.log(`    [OK] FTS5 database built`);
    }
  } catch (err) {
    console.log(`    [WARN] FTS5 build failed: ${err.message.split('\n')[0]}`);
  }

  // 13. Write manifest.json
  const manifest = {
    project: projectKey,
    name: project.name,
    generated: new Date().toISOString(),
    generator: 'scripts/deploy-cowork.js',
    source: 'AgentArchitect',
    format: 'cowork',
    agents: agentIds,
    teams: project.teams,
    contextBuckets: project.contextBuckets,
    defaultSkill: project.defaultSkill,
    orchestrators: teamSkills.map(s => `cowork/skills/${s.skillName}/SKILL.md`),
  };
  fs.writeFileSync(
    path.join(projectDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n',
    'utf-8'
  );
  console.log(`    [OK] manifest.json`);

  if (agentErr > 0) {
    for (const e of exportResult.agentResults.errors) {
      console.log(`    [ERROR] Agent ${e.agentId}: ${e.error}`);
    }
  }

  return { agentOk, agentErr, teamOk: teamSkills.length, teamErr: 0 };
}

// ============================================================================
// Section 11: CLI
// ============================================================================

function main() {
  const args = process.argv.slice(2);
  let targetProject = null;
  let outputBase = DEFAULT_OUTPUT_BASE;

  for (let i = 0; i < args.length; i++) {
    if ((args[i] === '--project' || args[i] === '-p') && args[i + 1]) {
      targetProject = args[i + 1];
      i++;
    } else if ((args[i] === '--output' || args[i] === '-o') && args[i + 1]) {
      outputBase = args[i + 1].replace(/^~/, require('os').homedir());
      i++;
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
Cowork Project Deployment

Usage:
  node scripts/deploy-cowork.js                      # Deploy both projects
  node scripts/deploy-cowork.js --project max         # Max + YouTube only
  node scripts/deploy-cowork.js --project wharfside   # Wharfside only
  node scripts/deploy-cowork.js --output ~/Documents  # Custom output directory

Projects:
  max        - Max Personal Assistant (personal-assistant + youtube-content teams)
  wharfside  - Wharfside Board Assistant (wharfside-board-assistant team)
`);
      process.exit(0);
    }
  }

  let projectKeys;
  if (targetProject) {
    const key = targetProject === 'max' ? 'max-assistant'
      : targetProject === 'wharfside' ? 'wharfside-assistant'
      : targetProject;
    if (!PROJECTS[key]) {
      console.error(`ERROR: Unknown project '${targetProject}'. Use 'max' or 'wharfside'.`);
      process.exit(1);
    }
    projectKeys = [key];
  } else {
    projectKeys = Object.keys(PROJECTS);
  }

  console.log(`\nCowork Project Deployment v2.0`);
  console.log('='.repeat(55));
  console.log(`Output base: ${outputBase}`);
  console.log(`Projects:    ${projectKeys.length}`);

  let totalErrors = 0;

  for (const key of projectKeys) {
    const result = deployProject(key, outputBase);
    totalErrors += result.agentErr;
  }

  console.log('\n' + '='.repeat(55));
  console.log('Deployment complete!');
  console.log('');
  for (const key of projectKeys) {
    const project = PROJECTS[key];
    console.log(`  ${project.name}: ${path.join(outputBase, project.dir)}/`);
  }
  console.log('');
  if (totalErrors > 0) {
    console.log(`Errors: ${totalErrors} (check output above)`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { deployProject, PROJECTS, MCP_TOOL_DOCS, MCP_PERMISSION_MAP };
