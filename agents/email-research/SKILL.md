# Email Research Agent - SKILL

## Purpose

The Email Research Agent mines Gmail for emails on a specific topic and generates a structured research report. This report serves as an input to other agents (like Presentation) or as the basis for composing follow-up emails.

## Context Management Strategy

Email research can generate significant context load due to full email content, PDF transcriptions, and iterative report versions. This agent uses a **three-phase approach** to keep conversation context minimal while producing comprehensive reports.

### Principles
1. **Discovery before extraction** - Show counts and metadata first, let user control scope
2. **Working files over inline content** - Extract analysis to files, keep only summaries in conversation
3. **PDF processing is opt-in** - Default to metadata only; user explicitly requests transcription
4. **Iterate via files** - Update working files, summarize changes in conversation (not full content)

### Context Boundaries
- Never load full email content into conversation without user approval
- PDF transcriptions go directly to working files
- Report versions are file updates, not inline rebuilds
- "Dig deeper" iterations write to files, report summary counts only

## Core Workflow (Three Phases)

### Phase 1: Discovery
Search and count WITHOUT extracting full content:
1. **Receive Research Topic** - User specifies what to research
2. **Run Discovery Search** - Search Gmail with topic keywords
3. **Present Discovery Summary** - Show counts, date ranges, participants, PDF counts
4. **User Decision Point** - Continue full analysis? Narrow scope? Include PDFs?

### Phase 2: Extraction
Extract content to working file, not conversation:
1. **Extract to Working File** - Write analysis to `reports/{topic}_{date}_working.md`
2. **Summarize in Conversation** - Keep only executive summary inline
3. **PDF Processing (if requested)** - Transcribe to working file, not conversation

### Phase 3: Report Delivery
Iterate via files, deliver summaries:
1. **Generate Report** - Create draft HTML email report (v0.1) for user review
2. **Iterate via Files** - Update working file, summarize changes in conversation
3. **Finalize** - Final report to file; email draft contains summary only

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

### Discovery Phase (Context-Efficient)

Before extracting full content, run a **discovery search** to assess scope:

1. **Count emails** - Get total count per account without reading content
2. **Identify date range** - Earliest and latest email dates
3. **Extract participants** - Sender names/counts from search results metadata
4. **Count PDF attachments** - Note how many PDFs exist (don't transcribe yet)
5. **Check result limits** - Note if any search hit the 100-result cap

**Discovery Summary Format:**
```
**Discovery: {Topic}**
- Board account: {N} emails ({date range})
- Personal account: {N} emails ({date range}) [if searched]
- Key participants: {name} ({count}), {name} ({count}), ...
- PDFs detected: {count}
- Search limits: {hit/not hit}

Proceed with full analysis, or narrow scope?
Options:
- Full analysis (all {total} emails)
- Narrow by date range
- Narrow by participant
- Include PDF transcription (adds significant content)
```

**User must confirm** before proceeding to Phase 2 extraction.

### Scope Boundaries

To prevent unbounded context growth:

1. **Default email threshold**: 50 emails
   - If discovery finds >50 emails, prompt user before extraction
   - User can approve full analysis or narrow scope

2. **PDF transcription**: Opt-in only
   - Default: Metadata only (filename, source email)
   - User explicitly requests: "Include PDFs" or "Transcribe the proposals"
   - When enabled: Transcribe to working file, summarize in conversation

3. **"Dig deeper" writes to files**
   - When breaking time ranges to find all emails, write results to working file
   - Report counts to user, not full content
   - Conversation sees: "Found 45 more emails in Q2, added to working file"

4. **User override**
   - User can always say "show me everything" to bypass boundaries
   - Agent warns about context impact before proceeding

### Information Extraction

For each relevant email/thread, extract:
- **Date**: When the communication occurred
- **Participants**: Who was involved
- **Key Points**: Main information or decisions
- **Action Items**: Any tasks mentioned
- **Status Updates**: Progress or current state
- **Links/Attachments**: References to documents or resources
- **Open Questions**: Unresolved issues

#### Working File Strategy

**All extraction goes to a working file, not conversation:**

1. **Create working file** at start of Phase 2:
   - Path: `reports/{topic-slug}_{date}_working.md`
   - Example: `reports/marina-permits_2026-01-21_working.md`

2. **Write extraction results to file:**
   ```markdown
   # Working Analysis: {Topic}
   Generated: {Date}
   Status: In Progress

   ## Email Summaries
   ### {Date} - {Subject}
   From: {Sender}
   Key Points:
   - {point}
   - {point}

   ## Emerging Themes
   - {theme}: {summary}

   ## PDF Content (if requested)
   ### {filename} (from {date} email)
   {transcribed content}
   ```

3. **Conversation receives summary only:**
   ```
   **Extraction Complete** ({N} emails analyzed)
   Key themes: {theme}, {theme}, {theme}
   Working file: reports/{filename}

   Ready to generate report?
   ```

### PDF Attachment Handling (Opt-In)

**PDF transcription is OFF by default** to prevent context overload. PDFs are noted as metadata only unless user explicitly requests transcription.

#### Default Behavior (Metadata Only)
During discovery, report PDF attachments without transcribing:
```
**PDFs Detected:** 6
- Boiler_Proposal.pdf (from ABC Plumbing, 2026-01-15)
- Inspection_Report.pdf (from Engineer, 2026-01-10)
- Quote_v2.pdf (from XYZ Contractors, 2026-01-08)
...
```

#### User Triggers PDF Transcription
User must explicitly request transcription:
- "Include the PDFs"
- "Transcribe the proposals"
- "I need the PDF content"
- "Yes, process PDFs"

#### Transcription Workflow (When Requested)

1. **Download and transcribe to working file:**
   ```
   # Download the attachment
   mcp__gmail__download_attachment(messageId, attachmentId, savePath="/tmp/pdfscribe")

   # Transcribe using PDFScribe
   mcp__pdfscribe__transcribe_pdf(pdf_path="/tmp/pdfscribe/{filename}")
   ```

2. **Write transcription to working file (NOT conversation):**
   - Add PDF content to `## PDF Content` section of working file
   - Include source email reference and date

3. **Report summary in conversation:**
   ```
   **PDF Transcription Complete**
   - Boiler_Proposal.pdf: 3 pages, proposal details and pricing
   - Inspection_Report.pdf: 5 pages, unit-by-unit findings

   Key figures extracted to working file.
   ```

#### Common PDF Types
- Vendor proposals and quotes
- Inspection reports
- Engineering assessments
- Financial statements
- Meeting minutes (scanned)
- Contracts and agreements

#### Example (Opt-In Flow)
```
Discovery shows: "PDFs detected: 3"

User: Include the PDF proposals

Agent: Transcribing 3 PDFs to working file...

**PDF Transcription Complete**
- Boiler_Proposal.pdf: Cost $47,500, timeline 6-8 weeks
- Alt_Quote.pdf: Cost $52,000, timeline 4-6 weeks

Details added to working file.
```

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

### Attachments Analyzed
List of PDF attachments that were transcribed and analyzed:
- Filename and source email
- Key information extracted
- [Note if attachment was scanned/image-based]

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

### Email-Based Iteration (File-Based)

**Key Principle:** Update files, summarize changes in conversation. Never rebuild full report inline.

**Initial Report (v0.1):**
1. Generate report from working file analysis
2. Save report to `reports/{topic}_{date}.md`
3. Create HTML email draft with **summary only** (not full report)
4. Email body: Executive summary + link/reference to full report
5. Subject: "Email Research: [Topic] - Draft v0.1"

**User Feedback:**
- User reviews the draft and provides feedback
- Requests for additions, corrections, or focus changes
- Questions about findings

**Updated Versions (v0.2+):**
1. Process feedback from user
2. **Update the markdown report file** (not conversation)
3. Create new email draft with **change summary:**
   ```
   Updated: Email Research: {Topic} - v0.2

   Changes in this version:
   - Added Phase 2 timeline details
   - Included vendor contact information
   - Expanded budget breakdown

   Full report: reports/{topic}_{date}.md
   ```
4. Continue until user is satisfied

**Finalized Report:**
- When user approves, create final draft
- Subject: "Email Research: [Topic] - v1.0 FINAL"
- Email contains summary; full report in markdown file
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

### Context-Efficient Flow (Recommended)

This example demonstrates the three-phase workflow that minimizes context usage:

```
User: Research marina permits

Agent: Running discovery search...

**Discovery: Marina Permits**
- Board account: 73 emails (Mar 2024 - Jan 2026)
- Personal account: 12 emails (2019 - 2022)
- Key participants: DEP (12), Harbor Master (8), Engineering (15), Marina Committee (22)
- PDFs detected: 6
- Search limits: Not hit

Total: 85 emails across both accounts

Proceed with full analysis, or narrow scope?
Options:
- Full analysis (all 85 emails)
- Board account only (73 emails, recent)
- Narrow by date range
- Include PDF transcription

User: Board account only, skip PDFs for now

Agent: Extracting 73 emails to working file...

**Extraction Complete** (73 emails)
Key themes: DEP permit process, dock configuration, marina rules compliance
Working file: reports/marina-permits_2026-01-21_working.md

Ready to generate report?

User: Yes

Agent: Report generated.

**Email Research: Marina Permits - Draft v0.1**
Saved to: reports/marina-permits_2026-01-21.md
Email draft created with summary.

Key findings:
- DEP permit approved October 2025
- Dock reconfiguration planned for spring 2026
- Marina rules update pending board vote

Review the draft in your Gmail. Let me know if you'd like changes.

User: Add the timeline details and include the DEP permit PDF

Agent: Updating report and transcribing PDF...

**Updates Complete**
- Added detailed timeline to report
- Transcribed DEP_Permit_2025.pdf (3 pages)

Changes in v0.2:
- Timeline section expanded with key dates
- DEP permit conditions summarized

Report updated: reports/marina-permits_2026-01-21.md
New draft created: "Email Research: Marina Permits - Draft v0.2"
```

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
- PDF attachments are transcribed and included in research
- Report is comprehensive and well-structured
- Findings are accurate and properly attributed
- User can easily use report for next steps
- Handoff to other agents is smooth
