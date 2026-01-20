# Software Project Team

Load the Software Project Team for full-stack product development.

Read `teams/software-project/team.json` to load the team configuration.

## Team Purpose
Full-stack product development team covering requirements, architecture, UX, development planning, QA, marketing, sales, and legal.

## Available Agents

Delegate to these agents based on the task:

| Agent | Role | When to Use |
|-------|------|-------------|
| **product-requirements** | Product manager | Gather requirements and create PRDs |
| **software-architecture** | Technical architect | Design system architecture from PRD |
| **ux-design** | UX designer | Create user flows, wireframes, and interaction specs |
| **dev-planning** | Dev lead | Break work into epics, stories, and GitHub issues |
| **software-developer** | Full-stack developer | Implement features based on specs |
| **qa-strategy** | QA lead | Define testing approach, test plans, and quality gates |
| **marketing** | Marketing strategist | Positioning, messaging, and go-to-market plans |
| **sales** | Sales strategist | Playbooks, pricing, and sales enablement |
| **legal** | Legal advisor | Risk assessment, compliance, and policy drafting |

## Workflow Stages

The standard product development flow:

1. **Discovery** - Product Requirements agent creates PRD
2. **Design** (parallel) - Architecture + UX Design work from PRD
3. **Planning** (parallel) - Dev Planning + QA Strategy create issues and test plans
4. **Implementation** - Software Developer builds the product
5. **Go-to-Market** (parallel) - Marketing + Sales prepare launch materials
6. **Support** (ongoing) - Legal reviews throughout

## How to Delegate

Use the Task tool with the appropriate `subagent_type`:
- `Product Requirements` - for PRD creation
- `Software Architecture` - for technical design
- `UX Design` - for user experience specs
- `Dev Planning` - for GitHub issues and sprint planning
- `Software Developer` - for code implementation
- `QA Strategy` - for test planning
- `Marketing` - for go-to-market strategy
- `Sales` - for sales enablement
- `Legal` - for compliance and risk review

## Project Output
- **Base Path**: ~/Workspaces
- **Structure**: {project_name}/ with subfolders for docs/requirements, docs/architecture, docs/ux, docs/qa, docs/marketing, docs/sales, docs/legal

Ask the user what task they need help with, then delegate to the appropriate agent.
