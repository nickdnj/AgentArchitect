# Email Iteration Pattern

This document defines the standard workflow for iterative email-based report delivery and feedback.

## Overview

When producing reports, agents can use email as the delivery and feedback mechanism. This pattern enables:
- Version tracking through subject lines
- Inline feedback via email replies
- Iterative refinement until approval
- Optional finalization to Google Docs

## Workflow

### 1. Initial Delivery

When the user requests an email report:

1. Generate report content using appropriate template
2. Send HTML-formatted email with version in subject line
3. Subject format: `{Report Title} - v0.1`
4. Inform user the report has been sent

### 2. Feedback Collection

Wait for user to indicate they've reviewed the report. Trigger phrases include:
- "check my email"
- "I replied"
- "see my feedback"
- "check for feedback"
- "I sent feedback"
- "look at my response"

### 3. Processing Feedback

When triggered to check for feedback:

1. Search for replies to the original email thread
2. Parse inline feedback from the reply
3. Identify requested changes, additions, or removals
4. Address each piece of feedback

### 4. Iteration

1. Update report content based on feedback
2. Increment version number (v0.1 → v0.2 → v0.3, etc.)
3. Send updated HTML email
4. Subject: `{Report Title} - v0.2`
5. Repeat until user approves

### 5. Finalization

When user approves or requests finalization:
- Final version marked as v1.0
- Optionally save to Google Docs if requested

## Version Numbering

| Stage | Version | Example Subject |
|-------|---------|-----------------|
| First draft | v0.1 | "Q1 Analysis - v0.1" |
| Revision 2 | v0.2 | "Q1 Analysis - v0.2" |
| Revision 3 | v0.3 | "Q1 Analysis - v0.3" |
| Final approved | v1.0 | "Q1 Analysis - v1.0" |

## Email Search Strategy

To find feedback replies:

```
# Gmail search query pattern
subject:"{Report Title}" in:inbox newer_than:7d
```

Look for:
- Replies in the same thread (using threadId)
- Most recent message in thread
- Parse quoted reply content vs new feedback

## Templates

Two HTML templates are available:

### Standard Report (`standard-report.html`)
- Clean, professional styling
- Sans-serif fonts (system defaults)
- Blue accent color (#2563eb)
- Suitable for general reports

### Wharfside Report (`wharfside-report.html`)
- Navy (#1a3a5c) and gold (#c9a227) branding
- Georgia serif fonts
- Wharfside Manor logo in masthead
- Suitable for all Wharfside board communications

## Integration in SKILL.md

Add this section to agent SKILL.md files:

```markdown
## Email Iteration (Optional)

When asked to email a report:
1. Send HTML-formatted email using appropriate template
2. Subject line: "{Report Title} - v0.1"
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
```

## Integration in config.json

Add this to agent config.json files:

```json
"output": {
  "folder": "outputs/",
  "formats": ["markdown", "html-email"],
  "email_iteration": {
    "enabled": true,
    "template": "standard-report",
    "subject_format": "{title} - v{version}",
    "google_doc_finalize": true
  }
}
```

For Wharfside team agents, use `"template": "wharfside-report"`.

## Best Practices

1. **Always send** (not draft) so user gets notification
2. **Version every send** - never send without version number
3. **Parse carefully** - inline feedback may be interspersed with quoted content
4. **Acknowledge changes** - briefly note what was changed in each iteration
5. **Preserve history** - each version should be complete, not incremental
