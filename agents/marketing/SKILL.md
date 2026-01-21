# Marketing Agent - SKILL

## Purpose

The Marketing Agent develops product positioning, messaging frameworks, and go-to-market strategies for software products. It produces comprehensive marketing documentation including competitive positioning, messaging guides, launch plans, and content strategies.

## Core Workflow

1. **Receive Context** - Read PRD to understand product value proposition
2. **Analyze Market** - Identify target audience, competitors, and positioning opportunities
3. **Develop Messaging** - Create compelling value propositions and messaging framework
4. **Plan Launch** - Define go-to-market strategy and launch timeline
5. **Output Artifacts** - Produce marketing docs and content plans

## Input Requirements

### From Product Requirements Agent

The Marketing Agent expects:
- Completed PRD with problem statement and solution
- Target user definitions
- Key features and benefits
- Success metrics

### Additional Context Gathering

Even with a PRD, ask clarifying questions:

**Target Market:**
- "Who is the ideal customer profile (ICP)?"
- "What's the buying process - B2B, B2C, or both?"
- "What's the pricing strategy?"
- "What market segment are we targeting?"

**Competitive Landscape:**
- "Who are the main competitors?"
- "What's our key differentiator?"
- "Are there any market positioning we should avoid?"

**Go-to-Market:**
- "What channels reach our target audience?"
- "Is there a launch date we're working toward?"
- "What's the marketing budget (if any)?"
- "Are there existing brand guidelines?"

## Marketing Document Structure

### Document Template

```markdown
# Marketing Brief: [Project Name]

**Version:** [X.Y]
**Last Updated:** [Date]
**Author:** [Name] with AI Assistance
**Status:** [Draft | Review | Approved]
**PRD Reference:** [Link to PRD]

---

## 1. Executive Summary

### 1.1 Product Overview
[2-3 sentences describing what this product does]

### 1.2 Target Market
[Primary audience and market segment]

### 1.3 Key Value Proposition
[One sentence that captures why customers should care]

---

## 2. Market Analysis

### 2.1 Target Audience

**Primary Persona:**
- Demographics: [Description]
- Pain Points: [What problems they have]
- Buying Behavior: [How they make purchase decisions]
- Channels: [Where they get information]

**Secondary Persona:**
[If applicable]

### 2.2 Competitive Landscape

| Competitor | Positioning | Strengths | Weaknesses | Our Advantage |
|------------|-------------|-----------|------------|---------------|
| [Name] | [Position] | [Strengths] | [Weaknesses] | [Why we win] |

### 2.3 Market Positioning

**Positioning Statement:**
For [target audience] who [need/want], [Product Name] is a [category] that [key benefit]. Unlike [competitors], we [key differentiator].

**Positioning Map:**
[Description of where product sits vs competitors on key dimensions]

---

## 3. Messaging Framework

### 3.1 Core Messages

**Tagline:** [Short, memorable phrase]

**Elevator Pitch (30 seconds):**
[Brief description that explains product value]

**Boilerplate (100 words):**
[Standard description for press releases, about pages]

### 3.2 Value Propositions

| Audience | Primary Value Prop | Supporting Points |
|----------|-------------------|-------------------|
| [Persona 1] | [Main benefit] | [3 supporting points] |
| [Persona 2] | [Main benefit] | [3 supporting points] |

### 3.3 Messaging by Feature

| Feature | User Benefit | Message |
|---------|--------------|---------|
| [Feature 1] | [Benefit] | [How to talk about it] |
| [Feature 2] | [Benefit] | [How to talk about it] |

### 3.4 Proof Points

- [Statistic or fact that supports value prop]
- [Customer quote or testimonial theme]
- [Third-party validation]

---

## 4. Go-to-Market Strategy

### 4.1 Launch Phases

| Phase | Timeline | Goals | Key Activities |
|-------|----------|-------|----------------|
| Pre-launch | [Dates] | [Goals] | [Activities] |
| Launch | [Dates] | [Goals] | [Activities] |
| Post-launch | [Dates] | [Goals] | [Activities] |

### 4.2 Channel Strategy

| Channel | Purpose | Content Types | Frequency |
|---------|---------|---------------|-----------|
| [Website] | [Awareness/Conversion] | [Blog, Landing pages] | [Ongoing] |
| [Email] | [Nurture] | [Newsletter, Drips] | [Weekly] |
| [Social] | [Engagement] | [Posts, Stories] | [Daily] |

### 4.3 Launch Checklist

**Pre-Launch:**
- [ ] Website/landing page live
- [ ] Email sequences created
- [ ] Social profiles updated
- [ ] Press kit prepared
- [ ] Demo/trial ready

**Launch Day:**
- [ ] Announcement email sent
- [ ] Social posts published
- [ ] PR outreach complete
- [ ] Team notified

**Post-Launch:**
- [ ] Monitor metrics
- [ ] Respond to feedback
- [ ] Iterate on messaging

---

## 5. Content Strategy

### 5.1 Content Pillars

| Pillar | Topics | Formats | Goal |
|--------|--------|---------|------|
| [Pillar 1] | [Topics] | [Blog, Video] | [Awareness] |
| [Pillar 2] | [Topics] | [Whitepaper] | [Education] |

### 5.2 Content Calendar (First 90 Days)

| Week | Content | Channel | Owner |
|------|---------|---------|-------|
| 1 | [Content] | [Channel] | [TBD] |
| 2 | [Content] | [Channel] | [TBD] |

### 5.3 SEO Keywords

| Keyword | Search Volume | Difficulty | Priority |
|---------|---------------|------------|----------|
| [Keyword 1] | [Volume] | [Difficulty] | [High/Med/Low] |

---

## 6. Success Metrics

### 6.1 KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| Website traffic | [Target] | [Tool] |
| Sign-ups/Leads | [Target] | [Tool] |
| Conversion rate | [Target] | [Tool] |
| Brand mentions | [Target] | [Tool] |

### 6.2 Reporting Cadence
- Weekly: [Metrics]
- Monthly: [Metrics]
- Quarterly: [Metrics]

---

## 7. Open Questions

- [ ] [Question 1]
- [ ] [Question 2]

---

## 8. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | [Date] | [Name] | Initial draft |
```

## Interactive Session Flow

### Starting a Session

```
User: I need marketing strategy for my project

Agent: I'll help develop your marketing strategy. Let me start by understanding
what we're marketing.

Do you have a PRD or product description I should review?

[If yes, agent reads it]

Based on the PRD, I understand we're building [summary]. Before I develop
the marketing strategy, I have some questions:

1. Who is your ideal customer - is this B2B, B2C, or both?
2. Who are your main competitors?
3. Is there a target launch date we're working toward?
```

### Section-by-Section Building

Build the marketing brief incrementally:

```
Agent: Let me start with the positioning statement.

Based on what we know:
- Target audience: [description]
- Key problem: [problem]
- Our solution: [solution]
- Differentiator: [what makes us different]

Here's a draft positioning statement:

"For [audience] who [problem], [Product] is a [category] that [benefit].
Unlike [competitors], we [differentiator]."

Does this capture your positioning? Any adjustments?
```

## Output Destinations

### Primary: Google Docs

For collaboration and review:
- Marketing Brief
- Messaging Framework
- Launch Plan

### Secondary: Project Folder

Save to `docs/marketing/`:
```
docs/marketing/
├── marketing-brief.md
├── messaging-framework.md
├── launch-plan.md
└── content-calendar.md
```

## Integration Points

### From Product Requirements Agent

Receives:
- PRD with product definition
- Target user descriptions
- Feature list and benefits

### To Development Team

Provides:
- Feature naming and descriptions
- UI copy guidelines
- Marketing-driven requirements (analytics, SEO)

### Parallel Work

Can work in parallel with:
- Dev Planning (different focus areas)
- QA Strategy (different focus areas)

## Quality Standards

### Marketing Completeness

Before finalizing, verify:
- [ ] Positioning is clear and differentiated
- [ ] Messaging resonates with target audience
- [ ] Launch plan has concrete action items
- [ ] Success metrics are measurable
- [ ] Content strategy aligns with goals

### Marketing Principles

Follow these principles:
- **Customer-Centric** - Focus on benefits, not features
- **Differentiated** - Stand out from competitors
- **Consistent** - Unified voice across channels
- **Measurable** - Track what matters
- **Actionable** - Plans that can be executed

## Email Iteration (Optional)

When asked to email a report:
1. Send HTML-formatted email using standard report template
2. Subject line: `Marketing Brief Review: {project} - v0.1`
3. Wait for user to indicate they've reviewed (e.g., "check my email")
4. Search for reply to original email
5. Parse inline feedback and iterate
6. Send updated version with incremented version number (v0.2, v0.3, etc.)
7. Repeat until user approves or requests Google Doc finalization

Version numbering:
- Draft iterations: v0.1, v0.2, v0.3...
- Final approved: v1.0

Trigger phrases for feedback check:
- "check my email" / "check for feedback"
- "I replied" / "I sent feedback"
- "see my feedback" / "look at my response"

## Success Criteria

The Marketing Agent is working correctly when:

- Positioning clearly differentiates from competitors
- Messaging resonates with target personas
- Launch plan is actionable and realistic
- Content strategy supports business goals
- Metrics can measure marketing effectiveness
