import { describe, it, expect, vi, beforeEach } from 'vitest';

// The generator is CommonJS, so we require it
const { generateTeamOrchestratorSkill } = require('../scripts/generate-agents.js');

// Minimal agent configs for testing
const mockAgents = {
  'software-developer': {
    name: 'Software Developer',
    description: 'Full-stack developer',
    expertise: { domains: ['software'] },
    agent_type: 'specialist',
    execution: { context: 'fork' },
  },
  'improver': {
    name: 'Agent Improver',
    description: 'Meta-agent that improves other agents',
    agent_type: 'utility',
    execution: { context: 'fork' },
  },
};

// Base team config without feedback loop
function makeTeamConfig(overrides = {}) {
  return {
    id: 'test-team',
    name: 'Test Team',
    members: [
      { agent_id: 'software-developer', role: 'Developer' },
    ],
    workflow: { stages: [] },
    shared_context: { buckets: [] },
    orchestration: {
      mode: 'thin-orchestrator',
      execution: { model: 'opus', max_turns: 50 },
      routing: { implementation: ['software-developer'] },
      delegation_strategy: 'Delegate to specialists.',
    },
    collaboration_rules: { coordination_mode: 'orchestrated' },
    mcp_servers: [],
    ...overrides,
  };
}

describe('Feedback loop generation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('generates feedback capture section when enabled with agents', () => {
    const config = makeTeamConfig({
      feedback_loop: {
        enabled: true,
        agents: ['software-developer'],
        feedback_path: 'agents/{agent_id}/feedback.jsonl',
        improver_agent: 'improver',
        min_entries_before_improve: 3,
        rubric: {
          'software-developer': [
            'Did the code require user corrections?',
            'Were there linting/type errors?',
          ],
        },
      },
    });

    const output = generateTeamOrchestratorSkill(config, mockAgents);

    expect(output).toContain('## Post-Task Feedback Capture (MANDATORY for software-developer)');
    expect(output).toContain('agents/software-developer/feedback.jsonl');
    expect(output).toContain('"schema_v": 1');
    expect(output).toContain('Did the code require user corrections?');
    expect(output).toContain('Were there linting/type errors?');
  });

  it('does not generate feedback section when disabled', () => {
    const config = makeTeamConfig({
      feedback_loop: {
        enabled: false,
        agents: ['software-developer'],
      },
    });

    const output = generateTeamOrchestratorSkill(config, mockAgents);

    expect(output).not.toContain('Post-Task Feedback Capture');
  });

  it('does not generate feedback section when feedback_loop is missing', () => {
    const config = makeTeamConfig();

    const output = generateTeamOrchestratorSkill(config, mockAgents);

    expect(output).not.toContain('Post-Task Feedback Capture');
  });

  it('does not generate feedback section when agents array is empty', () => {
    const config = makeTeamConfig({
      feedback_loop: {
        enabled: true,
        agents: [],
      },
    });

    const output = generateTeamOrchestratorSkill(config, mockAgents);

    expect(output).not.toContain('Post-Task Feedback Capture');
  });

  it('warns when agent has no rubric', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const config = makeTeamConfig({
      feedback_loop: {
        enabled: true,
        agents: ['software-developer'],
        improver_agent: 'improver',
        min_entries_before_improve: 3,
        rubric: {},
      },
    });

    generateTeamOrchestratorSkill(config, mockAgents);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('software-developer')
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('no rubric defined')
    );
  });

  it('still generates feedback section without rubric (degraded)', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    const config = makeTeamConfig({
      feedback_loop: {
        enabled: true,
        agents: ['software-developer'],
        improver_agent: 'improver',
        rubric: {},
      },
    });

    const output = generateTeamOrchestratorSkill(config, mockAgents);

    expect(output).toContain('Post-Task Feedback Capture');
    expect(output).not.toContain('Evaluation rubric');
  });

  it('uses custom feedback_path template', () => {
    const config = makeTeamConfig({
      feedback_loop: {
        enabled: true,
        agents: ['software-developer'],
        feedback_path: 'custom/{agent_id}/log.jsonl',
        improver_agent: 'improver',
        rubric: { 'software-developer': ['Test question'] },
      },
    });

    const output = generateTeamOrchestratorSkill(config, mockAgents);

    expect(output).toContain('custom/software-developer/log.jsonl');
  });

  it('generates explicit trigger logic with entry counting', () => {
    const config = makeTeamConfig({
      feedback_loop: {
        enabled: true,
        agents: ['software-developer'],
        feedback_path: 'agents/{agent_id}/feedback.jsonl',
        improver_agent: 'improver',
        min_entries_before_improve: 5,
        rubric: { 'software-developer': ['Test'] },
      },
    });

    const output = generateTeamOrchestratorSkill(config, mockAgents);

    // Should have explicit bash for counting entries after last improve
    expect(output).toContain('LAST_IMPROVE=');
    expect(output).toContain('SINCE_IMPROVE');
    expect(output).toContain('improver-approved');
    expect(output).toContain('improver-rejected');
    expect(output).toContain('SINCE_IMPROVE >= 5');
  });

  it('references shared schema file', () => {
    const config = makeTeamConfig({
      feedback_loop: {
        enabled: true,
        agents: ['software-developer'],
        improver_agent: 'improver',
        rubric: { 'software-developer': ['Test'] },
      },
    });

    const output = generateTeamOrchestratorSkill(config, mockAgents);

    expect(output).toContain('agents/_templates/feedback-schema.json');
  });

  it('generates sections for multiple agents', () => {
    const multiAgents = {
      ...mockAgents,
      'pcb-designer': {
        name: 'PCB Designer',
        description: 'PCB layout engineer',
        agent_type: 'specialist',
        execution: { context: 'fork' },
      },
    };

    const config = makeTeamConfig({
      members: [
        { agent_id: 'software-developer', role: 'Developer' },
        { agent_id: 'pcb-designer', role: 'PCB Engineer' },
      ],
      feedback_loop: {
        enabled: true,
        agents: ['software-developer', 'pcb-designer'],
        improver_agent: 'improver',
        rubric: {
          'software-developer': ['Code quality?'],
          'pcb-designer': ['DRC violations?'],
        },
      },
    });

    const output = generateTeamOrchestratorSkill(config, multiAgents);

    expect(output).toContain('MANDATORY for software-developer');
    expect(output).toContain('MANDATORY for pcb-designer');
    expect(output).toContain('Code quality?');
    expect(output).toContain('DRC violations?');
  });

  it('uses correct min_entries_before_improve default', () => {
    const config = makeTeamConfig({
      feedback_loop: {
        enabled: true,
        agents: ['software-developer'],
        improver_agent: 'improver',
        rubric: { 'software-developer': ['Test'] },
        // No min_entries_before_improve — should default to 3
      },
    });

    const output = generateTeamOrchestratorSkill(config, mockAgents);

    expect(output).toContain('SINCE_IMPROVE >= 3');
  });
});
