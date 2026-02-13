#!/usr/bin/env node
/**
 * Phase 1: Add agent_type, execution, and delegation fields to all agent configs.
 * This is a one-time migration script.
 */

const fs = require('fs');
const path = require('path');

const AGENTS_DIR = path.join(__dirname, '..', 'agents');

// Classification of all agents
const AGENT_CLASSIFICATIONS = {
  // Orchestrators - team leads that delegate to specialists
  'personal-assistant': {
    agent_type: 'orchestrator',
    execution: { context: 'inline', max_turns: 50, model: 'opus' },
    delegation: {
      available_specialists: ['web-research', 'chrome-browser', 'rag-search', 'pdf-scribe'],
      parallel_allowed: true,
      briefing_required: false
    }
  },

  // Specialists - do focused work in forked contexts
  'archivist': {
    agent_type: 'specialist',
    execution: { context: 'fork', max_turns: 20, model: 'sonnet' }
  },
  'monthly-bulletin': {
    agent_type: 'specialist',
    execution: { context: 'fork', max_turns: 25, model: 'sonnet' }
  },
  'proposal-review': {
    agent_type: 'specialist',
    execution: { context: 'fork', max_turns: 20, model: 'sonnet' }
  },
  'presentation': {
    agent_type: 'specialist',
    execution: { context: 'fork', max_turns: 25, model: 'sonnet' }
  },
  'email-research': {
    agent_type: 'specialist',
    execution: { context: 'fork', max_turns: 20, model: 'sonnet' }
  },
  'pdf-scribe': {
    agent_type: 'specialist',
    execution: { context: 'fork', max_turns: 15, model: 'haiku' }
  },
  'product-requirements': {
    agent_type: 'specialist',
    execution: { context: 'fork', max_turns: 30, model: 'opus' }
  },
  'software-architecture': {
    agent_type: 'specialist',
    execution: { context: 'fork', max_turns: 30, model: 'opus' }
  },
  'ux-design': {
    agent_type: 'specialist',
    execution: { context: 'fork', max_turns: 25, model: 'sonnet' }
  },
  'dev-planning': {
    agent_type: 'specialist',
    execution: { context: 'fork', max_turns: 25, model: 'sonnet' }
  },
  'qa-strategy': {
    agent_type: 'specialist',
    execution: { context: 'fork', max_turns: 20, model: 'sonnet' }
  },
  'marketing': {
    agent_type: 'specialist',
    execution: { context: 'fork', max_turns: 25, model: 'sonnet' }
  },
  'sales': {
    agent_type: 'specialist',
    execution: { context: 'fork', max_turns: 25, model: 'sonnet' }
  },
  'legal': {
    agent_type: 'specialist',
    execution: { context: 'fork', max_turns: 20, model: 'sonnet' }
  },
  'software-developer': {
    agent_type: 'specialist',
    execution: { context: 'fork', max_turns: 50, model: 'opus' }
  },
  'account-researcher': {
    agent_type: 'specialist',
    execution: { context: 'fork', max_turns: 20, model: 'sonnet' }
  },
  'qualification-analyst': {
    agent_type: 'specialist',
    execution: { context: 'fork', max_turns: 20, model: 'sonnet' }
  },
  'solution-architect': {
    agent_type: 'specialist',
    execution: { context: 'fork', max_turns: 30, model: 'opus' }
  },
  'value-engineer': {
    agent_type: 'specialist',
    execution: { context: 'fork', max_turns: 25, model: 'sonnet' }
  },
  'competitive-intel': {
    agent_type: 'specialist',
    execution: { context: 'fork', max_turns: 20, model: 'sonnet' }
  },
  'proposal-writer': {
    agent_type: 'specialist',
    execution: { context: 'fork', max_turns: 30, model: 'opus' }
  },
  'deal-strategist': {
    agent_type: 'specialist',
    execution: { context: 'fork', max_turns: 25, model: 'sonnet' }
  },
  'deployment-manager': {
    agent_type: 'specialist',
    execution: { context: 'fork', max_turns: 25, model: 'sonnet' }
  },
  'ecad-specialist': {
    agent_type: 'specialist',
    execution: { context: 'fork', max_turns: 20, model: 'sonnet' }
  },
  'migration-specialist': {
    agent_type: 'specialist',
    execution: { context: 'fork', max_turns: 20, model: 'sonnet' }
  },
  'mcad-specialist': {
    agent_type: 'specialist',
    execution: { context: 'fork', max_turns: 20, model: 'sonnet' }
  },
  'plm-specialist': {
    agent_type: 'specialist',
    execution: { context: 'fork', max_turns: 20, model: 'sonnet' }
  },
  'erp-supplychain-specialist': {
    agent_type: 'specialist',
    execution: { context: 'fork', max_turns: 20, model: 'sonnet' }
  },
  'infrastructure-specialist': {
    agent_type: 'specialist',
    execution: { context: 'fork', max_turns: 20, model: 'sonnet' }
  },
  'customer-support': {
    agent_type: 'specialist',
    execution: { context: 'fork', max_turns: 25, model: 'sonnet' }
  },
  'youtube-creator': {
    agent_type: 'specialist',
    execution: { context: 'fork', max_turns: 50, model: 'opus' }
  },
  'short-form-video': {
    agent_type: 'specialist',
    execution: { context: 'fork', max_turns: 30, model: 'sonnet' }
  },
  'web-research': {
    agent_type: 'specialist',
    execution: { context: 'fork', max_turns: 15, model: 'sonnet' }
  },

  // Utilities - service agents called by others
  'rag-search': {
    agent_type: 'utility',
    execution: { context: 'fork', max_turns: 10, model: 'haiku' }
  },
  'chrome-browser': {
    agent_type: 'utility',
    execution: { context: 'fork', max_turns: 15, model: 'sonnet' }
  }
};

let updated = 0;
let skipped = 0;
let errors = 0;

// Process each agent
const agentDirs = fs.readdirSync(AGENTS_DIR).filter(d => {
  const fullPath = path.join(AGENTS_DIR, d);
  return fs.statSync(fullPath).isDirectory() && d !== '_templates';
});

for (const agentId of agentDirs) {
  const configPath = path.join(AGENTS_DIR, agentId, 'config.json');

  if (!fs.existsSync(configPath)) {
    console.log(`  SKIP: ${agentId} (no config.json)`);
    skipped++;
    continue;
  }

  const classification = AGENT_CLASSIFICATIONS[agentId];
  if (!classification) {
    console.log(`  WARN: ${agentId} not in classification map, skipping`);
    skipped++;
    continue;
  }

  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    // Add new fields after 'version' field
    config.agent_type = classification.agent_type;
    config.execution = classification.execution;

    if (classification.delegation) {
      config.delegation = classification.delegation;
    }

    // Write back with consistent formatting
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
    console.log(`  OK: ${agentId} → ${classification.agent_type} (${classification.execution.context}, ${classification.execution.model})`);
    updated++;
  } catch (err) {
    console.error(`  ERR: ${agentId}: ${err.message}`);
    errors++;
  }
}

console.log(`\nDone: ${updated} updated, ${skipped} skipped, ${errors} errors`);
