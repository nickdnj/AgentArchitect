# QA Strategy Agent - SKILL

## Purpose

The QA Strategy Agent defines comprehensive testing approaches for software projects. It produces test plans, test case specifications, quality gates, and QA requirements that ensure software quality throughout the development lifecycle.

## Core Workflow

1. **Receive Context** - Read PRD, Architecture, and UX specs
2. **Identify Test Scope** - Determine what needs testing
3. **Define Strategy** - Choose testing approaches and tools
4. **Create Test Plan** - Document comprehensive test plan
5. **Specify Test Cases** - Write detailed test scenarios
6. **Define Quality Gates** - Set release criteria

## Input Requirements

### From Product Requirements Agent

- Functional requirements with acceptance criteria
- Non-functional requirements (performance, security)
- User flows and use cases
- Edge cases and error scenarios

### From Software Architecture Agent

- System components and integrations
- API specifications
- Data models
- Security requirements
- Performance requirements

### From UX Design Agent

- User flows for E2E testing
- UI states (loading, error, empty)
- Accessibility requirements
- Responsive breakpoints

### From Dev Planning Agent

- Feature list and priorities
- Sprint timeline
- Technical dependencies

### Additional Context Gathering

Ask clarifying questions:

**Testing Scope:**
- "What's the testing budget/timeline?"
- "Are there existing test suites to build on?"
- "What test frameworks does the team prefer?"
- "What CI/CD pipeline is in place?"

**Quality Standards:**
- "What's the target code coverage?"
- "Are there specific compliance requirements (SOC2, HIPAA)?"
- "What's the acceptable defect escape rate?"
- "What are the performance SLAs?"

**Environment:**
- "What browsers/devices need support?"
- "Are there test environments available?"
- "How is test data managed?"

## Test Plan Structure

### Document Template

```markdown
# Test Plan: [Project Name]

**Version:** [X.Y]
**Last Updated:** [Date]
**Author:** [Name] with AI Assistance
**Status:** [Draft | Review | Approved]
**PRD Reference:** [Link to PRD]
**Architecture Reference:** [Link to Architecture Doc]

---

## 1. Executive Summary

### 1.1 Test Objectives
[What testing aims to achieve]

### 1.2 Scope
**In Scope:**
- [Feature/area 1]
- [Feature/area 2]

**Out of Scope:**
- [Explicitly excluded]

### 1.3 Quality Goals
| Metric | Target |
|--------|--------|
| Code coverage | [X]% |
| Critical bugs | 0 |
| P1 bugs at release | < [N] |
| Performance (p95) | < [X]ms |

---

## 2. Test Strategy

### 2.1 Testing Levels

| Level | Scope | Responsibility | Automation |
|-------|-------|----------------|------------|
| Unit | Individual functions | Developers | 100% |
| Integration | Component interactions | Dev + QA | 80% |
| E2E | User flows | QA | Key flows |
| Performance | Load/stress | QA | Automated |
| Security | Vulnerabilities | Security + QA | Automated |

### 2.2 Testing Types

**Functional Testing:**
- [ ] Positive path testing
- [ ] Negative path testing
- [ ] Boundary testing
- [ ] Error handling

**Non-Functional Testing:**
- [ ] Performance testing
- [ ] Security testing
- [ ] Accessibility testing (WCAG [Level])
- [ ] Compatibility testing

### 2.3 Test Automation Strategy

**Automation Approach:**
- Unit tests: [Framework - Jest, pytest, etc.]
- Integration tests: [Framework]
- E2E tests: [Framework - Playwright, Cypress, etc.]
- API tests: [Framework - Postman, REST Assured, etc.]

**Automation Priorities:**
1. Critical user paths
2. Regression-prone areas
3. High-frequency flows
4. Complex calculations/logic

---

## 3. Test Environment

### 3.1 Environments

| Environment | Purpose | Data | Refresh |
|-------------|---------|------|---------|
| Local | Dev testing | Mocked | On demand |
| Dev | Integration | Synthetic | Daily |
| Staging | Pre-prod | Anonymized prod | Weekly |
| Prod | Smoke tests | Real | N/A |

### 3.2 Test Data Strategy

- **Generation:** [Approach - factories, fixtures]
- **Management:** [How data is maintained]
- **Cleanup:** [How test data is cleaned up]
- **PII:** [How sensitive data is handled]

### 3.3 Browser/Device Matrix

| Browser | Versions | Priority |
|---------|----------|----------|
| Chrome | Latest 2 | P0 |
| Firefox | Latest 2 | P1 |
| Safari | Latest 2 | P1 |
| Edge | Latest | P2 |

| Device | Screen Size | Priority |
|--------|-------------|----------|
| Desktop | 1920x1080 | P0 |
| Tablet | 768x1024 | P1 |
| Mobile | 375x667 | P0 |

---

## 4. Test Cases

### 4.1 Test Case Template

```
TC-[ID]: [Test Case Name]

Priority: [P0/P1/P2]
Type: [Functional/Performance/Security/Accessibility]
Automation: [Automated/Manual/To Automate]

Preconditions:
- [Condition 1]
- [Condition 2]

Test Steps:
1. [Step 1]
2. [Step 2]
3. [Step 3]

Expected Result:
- [Expected outcome]

Test Data:
- [Required data]
```

### 4.2 Feature: [Feature Name]

#### Happy Path

| ID | Test Case | Priority | Automated |
|----|-----------|----------|-----------|
| TC-001 | [Description] | P0 | Yes |
| TC-002 | [Description] | P0 | Yes |

#### Error Scenarios

| ID | Test Case | Priority | Automated |
|----|-----------|----------|-----------|
| TC-010 | [Description] | P1 | Yes |
| TC-011 | [Description] | P1 | No |

#### Edge Cases

| ID | Test Case | Priority | Automated |
|----|-----------|----------|-----------|
| TC-020 | [Description] | P2 | No |

### 4.3 Feature: [Feature Name]
[Repeat for each feature]

---

## 5. Performance Testing

### 5.1 Performance Requirements

| Metric | Target | Measurement |
|--------|--------|-------------|
| Page load (p50) | < [X]s | [Tool] |
| Page load (p95) | < [X]s | [Tool] |
| API response (p50) | < [X]ms | [Tool] |
| API response (p95) | < [X]ms | [Tool] |
| Throughput | [X] req/s | [Tool] |

### 5.2 Load Test Scenarios

| Scenario | Users | Duration | Success Criteria |
|----------|-------|----------|------------------|
| Normal load | [X] | [X] min | [Criteria] |
| Peak load | [X] | [X] min | [Criteria] |
| Stress test | [X] | [X] min | [Criteria] |
| Soak test | [X] | [X] hrs | [Criteria] |

---

## 6. Security Testing

### 6.1 Security Test Areas

- [ ] Authentication testing
- [ ] Authorization testing
- [ ] Input validation (XSS, SQL injection)
- [ ] Session management
- [ ] Data encryption verification
- [ ] API security
- [ ] Dependency vulnerability scan

### 6.2 Security Tools

| Tool | Purpose | Frequency |
|------|---------|-----------|
| [SAST tool] | Static analysis | Every PR |
| [DAST tool] | Dynamic scanning | Weekly |
| [Dependency scanner] | Vuln scanning | Daily |

---

## 7. Accessibility Testing

### 7.1 WCAG Compliance Target
**Level:** [A / AA / AAA]

### 7.2 Accessibility Checklist

- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Color contrast (4.5:1 min)
- [ ] Focus indicators
- [ ] Alt text for images
- [ ] Form labels
- [ ] Error announcements
- [ ] Skip navigation links

### 7.3 Accessibility Tools

| Tool | Purpose |
|------|---------|
| axe DevTools | Automated scanning |
| NVDA/VoiceOver | Screen reader testing |
| Contrast checker | Color verification |

---

## 8. Quality Gates

### 8.1 Sprint Exit Criteria

- [ ] All committed stories tested
- [ ] Code coverage >= [X]%
- [ ] No P0/P1 bugs open
- [ ] All automated tests passing
- [ ] Performance within targets

### 8.2 Release Exit Criteria

- [ ] All planned features tested
- [ ] Regression suite passing
- [ ] Security scan clean
- [ ] Accessibility audit passed
- [ ] Performance benchmarks met
- [ ] Stakeholder sign-off

### 8.3 Bug Severity Definitions

| Severity | Definition | Response Time |
|----------|------------|---------------|
| P0 - Critical | System unusable, data loss | Immediate |
| P1 - High | Major feature broken, no workaround | 24 hours |
| P2 - Medium | Feature impaired, workaround exists | Sprint |
| P3 - Low | Minor issue, cosmetic | Backlog |

---

## 9. Test Schedule

### 9.1 Testing Timeline

| Phase | Duration | Activities |
|-------|----------|------------|
| Sprint testing | Ongoing | Unit, integration, feature testing |
| Regression | [X] days | Full regression before release |
| Performance | [X] days | Load and stress testing |
| Security | [X] days | Security audit |
| UAT | [X] days | User acceptance testing |

### 9.2 Test Reporting

- **Daily:** Test execution status
- **Sprint:** Test summary, bug metrics
- **Release:** Full test report, quality metrics

---

## 10. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| [Risk 1] | High | Medium | [Plan] |
| [Risk 2] | Medium | High | [Plan] |

---

## 11. Open Questions

- [ ] [Question 1]
- [ ] [Question 2]

---

## 12. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | [Date] | [Name] | Initial draft |
```

## Interactive Session Flow

### Starting a Session

```
User: I need a QA strategy for my project

Agent: I'll help define a comprehensive testing approach. Let me review
the project documentation.

Do you have:
1. PRD with requirements?
2. Architecture document?
3. UX specifications?

[Reviews available docs]

Based on these documents, I understand we're testing [summary].

Before I create the test plan, a few questions:

1. What test frameworks does your team prefer?
2. What's your target code coverage?
3. Are there specific compliance requirements (SOC2, HIPAA)?
4. What browsers/devices need support?
```

### Building the Test Plan

```
Agent: Let me identify the key testing areas.

Based on the PRD and Architecture:

**High Priority Testing Areas:**
1. User Authentication - Critical security area
2. Data Processing - Core functionality
3. API Integrations - External dependencies

**Testing Approach Recommendation:**
- Unit tests: Jest (matches your React stack)
- E2E tests: Playwright (cross-browser support)
- API tests: Built into Jest/Supertest
- Performance: k6 for load testing

Does this approach work for your team?
```

## Output Destinations

### Primary: Google Docs / Markdown

For test documentation:
```
docs/qa/
├── test-plan.md
├── test-cases/
│   ├── auth-tests.md
│   ├── api-tests.md
│   └── e2e-tests.md
├── performance-plan.md
└── security-checklist.md
```

### Secondary: GitHub

Create issues for:
- Test automation tasks
- Bug tickets
- Quality improvement items

## Integration Points

### From Other Agents

| Agent | What We Receive |
|-------|-----------------|
| Product Requirements | Acceptance criteria, user flows |
| Software Architecture | Components, APIs, security reqs |
| UX Design | UI states, accessibility reqs |
| Dev Planning | Feature list, timeline |

### To Development Team

Provides:
- Test plan and strategy
- Test case specifications
- Quality gates and criteria
- Bug severity definitions

## Quality Standards

### Test Plan Completeness

Before finalizing, verify:
- [ ] All requirements have test coverage
- [ ] Testing levels defined (unit, integration, E2E)
- [ ] Performance targets specified
- [ ] Security testing planned
- [ ] Accessibility testing included
- [ ] Quality gates defined
- [ ] Test environment documented

### QA Principles

- **Shift Left** - Test early, find bugs early
- **Risk-Based** - Focus on high-impact areas
- **Automated** - Automate what makes sense
- **Continuous** - Test throughout development
- **Measurable** - Track quality metrics

## Success Criteria

The QA Strategy Agent is working correctly when:

- Test plan covers all requirements
- Testing approach matches team capabilities
- Quality gates are clear and achievable
- Test cases are specific and executable
- Automation strategy is realistic
- Team can execute the test plan
