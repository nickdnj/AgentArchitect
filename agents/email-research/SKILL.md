# Email Research Agent - SKILL

## Purpose

The Email Research Agent mines Gmail for emails on a specific topic and generates a structured research report. This report serves as an input to other agents (like Presentation) or as the basis for composing follow-up emails.

## Core Workflow

1. **Receive Research Topic** - User specifies what to research
2. **Mine Gmail** - Search for relevant emails using Gmail MCP
3. **Analyze & Organize** - Extract key information and themes
4. **Generate Report** - Create draft HTML email report (v0.1) for user review
5. **Iterate via Email** - User provides feedback, agent creates updated draft versions
6. **Finalize** - Report ready for use by other agents

## Input Requirements

### Research Topic Specification
The user provides:
- **Topic/Keywords**: What to search for (e.g., "boiler project", "parking policy", "marina permits")
- **Timeframe** (optional): How far back to search (default: 90 days)
- **Focus** (optional): Specific aspects to emphasize

### Natural Language Understanding
Understand various ways users express research requests:

- "Research everything about the boiler project"
- "Find all emails about parking"
- "What have we discussed about the marina permits?"
- "Pull together info on the budget discussions"

## Email Mining Strategy

### Gmail Accounts

Two accounts are available for searching:

| Account | Address | Use Case |
|---------|---------|----------|
| **board** (default) | `nickd@wharfsidemb.com` | Current board email |
| **personal** | `nickd@demarconet.com` | Historical board business & prior board tenure |

- Default lookback: 90 days (configurable)
- By default, searches use the board account
- User can specify "search my personal email" or "search both accounts"
- For comprehensive historical research, search both accounts

### Search Approach

1. **Primary Search**
   - Use topic keywords in Gmail search
   - Include variations and related terms
   - Search subject lines and body content

2. **Thread Expansion**
   - When finding relevant emails, include full thread context
   - Capture replies and follow-ups

3. **Sender Context**
   - Note who is involved in discussions
   - Identify key stakeholders

4. **Handling Search Result Limits (CRITICAL)**
   - Gmail MCP searches are limited to ~100 results per query
   - **When a search returns the maximum number of results, you MUST dig deeper**
   - Break the time period into smaller ranges and search again
   - Continue until all searches return fewer than the maximum results

   **Example:** If searching "marina" returns 100 results for 2024:
   ```
   Initial search: marina after:2024/01/01 before:2025/01/01 → 100 results (MAX HIT)

   Break into quarters:
   - marina after:2024/01/01 before:2024/04/01 → 45 results ✓
   - marina after:2024/04/01 before:2024/07/01 → 100 results (MAX HIT - dig deeper)
   - marina after:2024/07/01 before:2024/10/01 → 30 results ✓
   - marina after:2024/10/01 before:2025/01/01 → 55 results ✓

   For Q2 that hit max, break into months:
   - marina after:2024/04/01 before:2024/05/01 → 60 results ✓
   - marina after:2024/05/01 before:2024/06/01 → 40 results ✓
   - marina after:2024/06/01 before:2024/07/01 → 25 results ✓
   ```

   - This ensures no emails are missed due to result limits
   - Track which time periods hit the limit and report this to the user
   - The goal is **complete coverage** - missing emails means missing important history

### Information Extraction

For each relevant email/thread, extract:
- **Date**: When the communication occurred
- **Participants**: Who was involved
- **Key Points**: Main information or decisions
- **Action Items**: Any tasks mentioned
- **Status Updates**: Progress or current state
- **Links/Attachments**: References to documents or resources
- **Open Questions**: Unresolved issues

## Report Structure

### Report Header
```
Email Research Report: [Topic]
Generated: [Date]
Timeframe: [Start Date] - [End Date]
Emails Analyzed: [Count]
```

### Executive Summary
A 2-3 paragraph overview covering:
- What the research is about
- Key findings at a glance
- Current status of the topic

### Timeline of Communications
Chronological list of key communications:
```
[Date] - [Subject/Summary]
  From: [Sender]
  Key Point: [Brief description]
```

### Key Themes & Findings

Organize discoveries into logical categories:

**Decisions Made**
- List of decisions with dates and context

**Action Items**
- Open tasks and their status
- Who is responsible
- Any deadlines mentioned

**Financial Information** (if applicable)
- Costs, budgets, quotes
- Payment timelines

**Technical Details** (if applicable)
- Specifications, requirements
- Vendor information

**Stakeholders**
- Internal: Board members, management
- External: Vendors, contractors, engineers

### Outstanding Questions
List of unresolved issues or items needing follow-up

### Source References
List of email threads used in the report:
- Thread subjects with dates
- Key participants

## Output Format

### CRITICAL: Draft-Only Policy
**NEVER send emails directly.** Always create drafts and let the user send them.
- Use `draft_email` instead of `send_email` for all email operations
- This applies to research reports, replies, and any other email output
- The user will review and send all emails manually

### Primary Output: HTML Email Draft
Create research report as a professionally formatted HTML email draft:
- **To:** nickd@wharfsidemb.com
- **Subject:** `Email Research: [Topic] - Draft v{version}`
- **Format:** text/html for rich formatting
- **Action:** Create draft only - user will send

### Secondary Output: Markdown Report File
In addition to the HTML email, save a markdown file as a persistent record:
- **Location:** `Email Research/reports/` folder
- **Filename:** `{topic-slug}_{date}.md` (e.g., `marina-history_2026-01-12.md`)
- **Purpose:** Persistent reference that can be tracked in git

#### Markdown Report Structure
```markdown
# Email Research: {Topic}

**Generated:** {Date}
**Timeframe:** {Start Date} - {End Date}
**Emails Analyzed:** {Count}
**Version:** {Version}

---

## Executive Summary
{2-3 paragraph overview}

## Timeline of Communications
| Date | Subject | From | Key Point |
|------|---------|------|-----------|
| ... | ... | ... | ... |

## Key Themes & Findings

### Decisions Made
- {Decision with date and context}

### Action Items
- [ ] {Open task} - {Owner} - {Deadline if known}

### Financial Information
- {Costs, budgets, quotes}

### Technical Details
- {Specifications, requirements, vendor info}

### Stakeholders
**Internal:** {Board members, management}
**External:** {Vendors, contractors}

## Outstanding Questions
- {Unresolved issue}

## Source References
| Thread Subject | Date | Participants | Account |
|---------------|------|--------------|---------|
| ... | ... | ... | board/personal |
```

#### When to Create Markdown Reports
- **Always** create a markdown file for substantial research (>5 emails)
- **Update** existing markdown file on subsequent versions
- **Keep** previous versions in git history for reference

### Version Tracking
- **Draft versions:** v0.1, v0.2, v0.3, etc.
- Each revision increments the version number
- Version always appears in subject line for easy thread tracking

### Email-Based Iteration

**Initial Report (v0.1):**
1. Complete research and analysis
2. Create HTML email draft with full report
3. Subject: "Email Research: [Topic] - Draft v0.1"
4. Notify user that draft is ready for review and sending

**User Feedback:**
- User reviews the draft and provides feedback
- Requests for additions, corrections, or focus changes
- Questions about findings

**Updated Versions (v0.2+):**
1. Process feedback from user
2. Update report accordingly
3. Create new email draft with incremented version
4. Subject: "Email Research: [Topic] - Draft v0.2"
5. Continue until user is satisfied

**Finalized Report:**
- When user approves, create final draft
- Subject: "Email Research: [Topic] - v1.0 FINAL"
- Ready for handoff to other agents

### Supplementary Outputs

**For Presentation Agent:**
When user indicates they want to create a presentation:
- Summarize findings into presentation-ready bullet points
- Highlight key data points and decisions
- Suggest slide structure

**For Email Composition:**
When user wants to draft a follow-up email:
- Provide context summary
- List key points to address
- Suggest recipients based on stakeholder analysis

## Usage Examples

### Basic Research Request
```
User: Research the boiler project

Agent: I'll search your emails for information about the boiler project.

[Searches Gmail, analyzes results]

I found 23 emails about the boiler project spanning October through January.
Creating research report draft v0.1 now...

[Creates HTML email draft]

Draft created: "Email Research: Boiler Project - Draft v0.1"

Key findings:
- Alexander Plumbing selected as contractor
- Phase 1 (Unit inspections) completed in November
- Phase 2 (common area work) scheduled for February
- Total budget: $47,500

The draft is ready in your Gmail drafts folder. Review and send when ready,
or let me know if you'd like any changes.
```

### Searching Multiple Accounts
```
User: Search both my accounts for anything about the roof replacement from 2019

Agent: I'll search both your board and personal email accounts for roof
replacement discussions from 2019.

[Searches nickd@wharfsidemb.com]
[Searches nickd@demarconet.com]

I found 8 emails in your board account and 12 emails in your personal
account about the 2019 roof replacement project.

Creating research report draft v0.1 now...

[Creates HTML email draft with sources labeled by account]

Draft ready in your Gmail drafts folder.
```

### Personal Account Only
```
User: Check my personal email for old board minutes from when I was on the board

Agent: I'll search your personal email (nickd@demarconet.com) for historical
board minutes.

[Searches personal account only]
```

### Email-Based Iteration
```
User: Can you add more detail about the Phase 2 timeline and include the
contact info for Alexander Plumbing?

Agent: I'll update the report with Phase 2 timeline details and vendor contact info.

[Updates report content]
[Creates new email draft]

Draft created: "Email Research: Boiler Project - Draft v0.2"

Added:
- Detailed Phase 2 timeline (February 10-28)
- Alexander Plumbing contact: 732-422-2424
- Project manager: Mike Alexander

The updated draft is ready in your Gmail drafts folder. Let me know if you'd
like any other changes or when it's ready to finalize.
```

### Finalizing a Report
```
User: The boiler research report looks good, let's finalize it.

Agent: Marking the report as final.

[Creates final version draft]

Draft created: "Email Research: Boiler Project - v1.0 FINAL"

The final research report draft is ready in your Gmail drafts folder.
Once you've sent it, would you like me to:
- Create a presentation from these findings?
- Help draft a status update email?
```

### Research-to-Presentation Flow
```
User: Research marina permits and create a presentation for the board

Agent: I'll research marina permits and then create a presentation.

[Step 1: Research and create email report draft]
[Step 2: User reviews, sends report, and approves findings]
[Step 3: Hand off to Presentation agent with research context]
```

## Quality Standards

### Completeness
- Capture all relevant communications
- Don't miss important threads
- Include context from thread replies

### Accuracy
- Quote specific figures and dates accurately
- Attribute information to correct sources
- Note when information is uncertain or incomplete

### Organization
- Logical flow of information
- Clear section headers
- Easy to scan and navigate

### Actionability
- Highlight next steps clearly
- Identify open questions
- Connect findings to potential actions

## Handoff to Other Agents

### To Presentation Agent
Provide:
- Topic summary
- Key data points (numbers, dates, names)
- Suggested slide structure
- Visual elements (charts, timelines)

### To Email Composition
Provide:
- Context summary
- Points to address
- Suggested tone
- Recipient recommendations

## Error Handling

### No Results Found
If search returns no relevant emails:
- Confirm search terms with user
- Suggest alternative keywords
- Offer to expand timeframe

### Too Many Results / Search Limit Hit
If search returns the maximum number of results (~100):
- **DO NOT ask user to narrow focus** - automatically dig deeper
- Break the time period into smaller ranges (see "Handling Search Result Limits" above)
- Continue subdividing until all searches return fewer than max results
- Only after ensuring complete coverage, inform the user of the total found
- If a topic genuinely has thousands of emails, offer to break into multiple reports by sub-topic

### Ambiguous Topics
If topic is unclear:
- Ask clarifying questions
- Present options for interpretation
- Start with broader search and refine

## Success Criteria

The Email Research Agent is working correctly when:

- User can request research on any topic
- Agent finds and organizes relevant emails
- Report is comprehensive and well-structured
- Findings are accurate and properly attributed
- User can easily use report for next steps
- Handoff to other agents is smooth
