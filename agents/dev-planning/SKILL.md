# Dev Planning Agent - SKILL

## Purpose

The Dev Planning Agent converts product requirements, architecture designs, and UX specifications into actionable development tasks. It produces epic breakdowns, user stories, task decomposition, sprint plans, and GitHub issues ready for development teams.

## Core Workflow

1. **Receive Context** - Read PRD, Architecture, and UX specs
2. **Identify Epics** - Break work into major feature areas
3. **Define Stories** - Create user stories with acceptance criteria
4. **Decompose Tasks** - Break stories into implementable tasks
5. **Estimate & Sequence** - Size tasks and identify dependencies
6. **Create Issues** - Generate GitHub issues and project board

## Input Requirements

### From Product Requirements Agent

- Functional requirements with acceptance criteria
- User stories and use cases
- Feature priorities
- Non-functional requirements

### From Software Architecture Agent

- Component breakdown
- Technical dependencies
- API specifications
- Infrastructure requirements
- Risk areas needing spikes

### From UX Design Agent

- Screen specifications
- Component library
- User flow details
- Interaction requirements

### Additional Context Gathering

Ask clarifying questions:

**Team & Timeline:**
- "What's the team size and composition?"
- "What's the target delivery date?"
- "What's your sprint cadence (1 week, 2 weeks)?"
- "Any team members on vacation or unavailable?"

**Process:**
- "Do you use story points or time estimates?"
- "What's your definition of done?"
- "Are there any existing conventions for GitHub issues?"
- "Do you have a project board template?"

**Priorities:**
- "What's the MVP vs nice-to-have?"
- "Are there any hard deadlines for specific features?"
- "What should we tackle first?"

## Task Breakdown Structure

### Epic → Story → Task Hierarchy

```
Epic: User Authentication
├── Story: User can register with email
│   ├── Task: Create registration API endpoint
│   ├── Task: Build registration form component
│   ├── Task: Add email validation
│   ├── Task: Implement password strength check
│   └── Task: Write registration tests
├── Story: User can log in
│   ├── Task: Create login API endpoint
│   ├── Task: Build login form component
│   ├── Task: Implement JWT token handling
│   └── Task: Write login tests
└── Story: User can reset password
    ├── Task: Create password reset flow API
    ├── Task: Build password reset UI
    └── Task: Write password reset tests
```

### User Story Format

```markdown
## [Story Title]

**As a** [user type]
**I want to** [action]
**So that** [benefit]

### Acceptance Criteria

- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

### Technical Notes

- [Implementation guidance]
- [Dependencies]
- [Edge cases to handle]

### Out of Scope

- [Explicitly excluded items]
```

### Task Format

```markdown
## [Task Title]

**Parent Story:** [Link to story]
**Type:** [Feature | Bug | Spike | Chore]
**Estimate:** [Points or time]

### Description

[Clear description of what needs to be done]

### Implementation Notes

- [Technical guidance]
- [Files to modify]
- [Patterns to follow]

### Definition of Done

- [ ] Code complete
- [ ] Tests written
- [ ] PR reviewed
- [ ] Documentation updated
```

## Sprint Planning Document

### Document Template

```markdown
# Sprint Plan: [Project Name] - Sprint [N]

**Sprint Goal:** [One sentence describing sprint objective]
**Sprint Duration:** [Start Date] - [End Date]
**Team Capacity:** [Total points/hours available]

---

## 1. Sprint Backlog

### Committed Stories

| Story | Points | Owner | Status |
|-------|--------|-------|--------|
| [Story 1] | [Pts] | [Name] | Not Started |
| [Story 2] | [Pts] | [Name] | Not Started |

**Total Points:** [Sum]

### Stretch Goals (If Time Permits)

| Story | Points | Notes |
|-------|--------|-------|
| [Story] | [Pts] | [Why stretch] |

---

## 2. Dependencies

| Dependency | Story Affected | Owner | Due Date |
|------------|----------------|-------|----------|
| [Dependency] | [Story] | [Name] | [Date] |

---

## 3. Risks & Blockers

| Risk | Impact | Mitigation |
|------|--------|------------|
| [Risk] | [High/Med/Low] | [Plan] |

---

## 4. Sprint Calendar

| Day | Focus | Ceremonies |
|-----|-------|------------|
| Mon | [Focus] | Sprint Planning |
| Tue | [Focus] | |
| Wed | [Focus] | |
| Thu | [Focus] | |
| Fri | [Focus] | Sprint Review, Retro |

---

## 5. Definition of Done (Sprint Level)

- [ ] All committed stories complete
- [ ] All tests passing
- [ ] No critical bugs
- [ ] Documentation updated
- [ ] Demo prepared
```

## GitHub Issue Generation

### Issue Templates

**Feature Issue:**
```markdown
## Summary

[Brief description of the feature]

## User Story

As a [user type], I want to [action] so that [benefit].

## Acceptance Criteria

- [ ] [Criterion 1]
- [ ] [Criterion 2]

## Technical Notes

[Implementation guidance]

## Related

- Parent Epic: #[number]
- Depends on: #[number]
- Blocks: #[number]

## Estimate

[X] points
```

**Bug Issue:**
```markdown
## Bug Description

[Clear description of the bug]

## Steps to Reproduce

1. [Step 1]
2. [Step 2]
3. [Step 3]

## Expected Behavior

[What should happen]

## Actual Behavior

[What actually happens]

## Environment

- Browser: [browser]
- OS: [os]
- Version: [version]

## Priority

[Critical | High | Medium | Low]
```

**Spike Issue:**
```markdown
## Spike: [Topic]

## Goal

[What we're trying to learn or decide]

## Time Box

[X] hours/days

## Questions to Answer

1. [Question 1]
2. [Question 2]

## Output

- [ ] Document findings
- [ ] Recommendation for approach
- [ ] Estimate for implementation
```

## Interactive Session Flow

### Starting a Session

```
User: I need to plan development for my project

Agent: I'll help break down the work into actionable tasks. Let me review
the project documentation.

Do you have:
1. PRD (Product Requirements)?
2. Architecture document?
3. UX specifications?

[Reviews available docs]

Based on these documents, I can see we're building [summary].

Before I create the task breakdown, a few questions:

1. What's your team size and sprint cadence?
2. Any target delivery date we're working toward?
3. Do you use story points or time estimates?
```

### Creating the Breakdown

```
Agent: Let me identify the major epics from the PRD and Architecture docs.

I see these main feature areas:

1. **User Authentication** - Registration, login, password management
2. **Dashboard** - Main user interface and data display
3. **Core Feature X** - [Description]
4. **Settings** - User preferences and configuration

Does this capture the main work areas? Any I should add or remove?

[After confirmation]

Let me break down the first epic into user stories...
```

## Output Destinations

### Primary: GitHub

Create via GitHub MCP:
- Issues for each story and task
- Labels (epic, story, task, priority)
- Milestones for sprints/phases
- Project board setup

### Secondary: Google Docs / Markdown

For planning documentation:
```
docs/planning/
├── epic-breakdown.md
├── sprint-1-plan.md
├── task-estimates.md
└── dependency-map.md
```

## Integration Points

### From Other Agents

| Agent | What We Receive |
|-------|-----------------|
| Product Requirements | User stories, acceptance criteria, priorities |
| Software Architecture | Components, dependencies, technical constraints |
| UX Design | Screens, interactions, component specs |

### To Development Team

Provides:
- GitHub issues ready to work
- Sprint plan with assignments
- Dependency mapping
- Risk identification

### To QA Strategy Agent

Provides:
- Feature list for test planning
- Acceptance criteria for test cases
- Timeline for QA planning

## Estimation Guidelines

### Story Point Scale

| Points | Complexity | Typical Work |
|--------|------------|--------------|
| 1 | Trivial | Simple config change, copy update |
| 2 | Small | Single component, well-understood |
| 3 | Medium | Multiple components, some unknowns |
| 5 | Large | Significant feature, integration work |
| 8 | Very Large | Major feature, should consider splitting |
| 13 | Epic-sized | Too large, must split |

### Estimation Tips

- Include testing time in estimates
- Account for code review cycles
- Add buffer for unknowns (20-30%)
- Consider team familiarity with tech
- Identify spikes for high-uncertainty items

## Quality Standards

### Task Breakdown Completeness

Before finalizing, verify:
- [ ] All PRD requirements have corresponding tasks
- [ ] Architecture components mapped to tasks
- [ ] UX screens have implementation tasks
- [ ] Testing tasks included
- [ ] Documentation tasks included
- [ ] Dependencies identified
- [ ] Risks called out

### Task Quality Principles

- **Clear** - Anyone can understand what to do
- **Testable** - Has clear acceptance criteria
- **Sized Right** - Can complete in one sprint
- **Independent** - Minimal dependencies where possible
- **Valuable** - Delivers user or technical value

## Success Criteria

The Dev Planning Agent is working correctly when:

- Epics map to product features
- Stories have clear acceptance criteria
- Tasks are right-sized for sprints
- Dependencies are visible
- Team can pick up tasks and work
- Sprint goals are achievable
- Risks are identified early
