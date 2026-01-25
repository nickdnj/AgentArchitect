# Monthly Bulletin Agent - SKILL

## Purpose

This agent generates the monthly community bulletin for Wharfside Manor Condominium Association. The bulletin keeps residents informed about community projects, governance updates, seasonal reminders, and important announcements.

## Core Workflow

1. **Ask About Input Request** - Ask Nick: "Do you need me to send out a request for bulletin input to the board?"
   - If yes: Generate the input request email and save to drafts
   - If no: Proceed to content mining
2. **Mine Gmail for Content** (past 30 days)
3. **Organize by Category**
4. **Draft Bulletin** following established structure
5. **Reference Past Examples** for consistency
6. **Generate HTML Email** with professional formatting and embedded logo

## Board Input Request Template

When starting a new bulletin, optionally send this email to Nick for forwarding to the board. Replace `{Month}` with the bulletin month and `{Deadline}` with a date ~5 days out.

```html
<p>Hi everyone,</p>

<p>I'm working on the <strong>{Month} Monthly Bulletin</strong> and wanted to check if anyone has items to include.</p>

<p>Please reply by <strong>{Deadline}</strong> with:</p>
<ul>
  <li>Project updates or status changes</li>
  <li>Community announcements or reminders</li>
  <li>Upcoming events or important dates</li>
  <li>Policy reminders or clarifications</li>
  <li>Anything else residents should know</li>
</ul>

<p>Thanks!</p>

<p>Nick</p>
```

**Usage:**
- Save as draft to `nickd@wharfsidemb.com` using `draft_email` tool
- Subject: "Request for {Month} Bulletin Input"
- To: board@wharfsidemb.com
- Set deadline ~5 days out from current date
- Nick will review and send to board

## Content Mining Strategy

### Email Account to Monitor
- Gmail account: `nickd@wharfsidemb.com`
- Lookback period: 30 days from draft generation date
- All emails in this account are Wharfside Board-related

### Content Categories to Identify

Look for information related to:

**Major Projects & Infrastructure**
- Boiler and plumbing work
- Marina permits and dock issues
- Building maintenance and repairs
- Engineering reports and assessments

**Governance & Administration**
- Board elections and voting
- Budget approvals and financial updates
- Policy resolutions (parking, pets, etc.)
- Board meeting schedules and outcomes

**Seasonal & Timely Information**
- Weather preparation (winter, summer)
- Holiday-related notices
- Seasonal facility closures (pool, etc.)
- Snow removal procedures

**Operational Updates**
- Landscaping and grounds maintenance
- Facility status (pool house, common areas)
- Parking enforcement and changes
- Management company updates

**Safety & Compliance**
- Fire safety reminders
- Emergency procedures
- Pet policy enforcement
- Unit owner responsibilities

**Community Events**
- Scheduled gatherings or activities
- Document shredding events
- Census or survey reminders
- Volunteer opportunities

### What to Include
- Concrete updates with status or next steps
- Action items for residents (deadlines, requirements)
- Changes to policies or procedures
- Upcoming events or important dates
- Reminders about ongoing responsibilities

### What to Exclude
- Routine administrative correspondence
- Individual unit issues
- Confidential legal matters
- Personal disputes or complaints

## Bulletin Structure

### Header Section (Clean Masthead)
The header uses a clean, professional masthead with the logo integrated:
- **White background** - no dark banner
- **Two-column table layout:**
  - **Left column (200px):** Cropped logo at 180px width, vertically centered
  - **Right column:** Title and tagline text, **RIGHT-ALIGNED** - this is critical!
- **Title:** "Monthly Bulletin" in 28px Georgia, navy (#1a3a5c)
- **Subtitle:** Month/Year in gold (#c9a227), uppercase, letterspaced
- **Location:** "Wharfside Manor • Monmouth Beach, NJ" in italic gray
- **Bottom border:** 3px solid navy (#1a3a5c) separating header from content

**IMPORTANT - Right Column Styling:**
The right column `<td>` MUST have `style="text-align: right;"` to right-justify all masthead text.
```html
<td valign="middle" style="text-align: right;">
  <div class="masthead-title">Monthly Bulletin</div>
  <div class="masthead-subtitle">February 2026</div>
  <div class="masthead-location">Wharfside Manor • Monmouth Beach, NJ</div>
</td>
```

### Community Message (Opening)
Always include:
- Warm greeting appropriate to the season
- Brief context-setting for the month

### Know Who to Call (Contacts Box)
Use a visually distinct, professional contact card layout:
- **Container:** Rounded box with light warm background (#fdf6e3), subtle navy left border (4px solid #1a3a5c)
- **Title:** "📞 Important Contacts" centered, bold navy, with subtle bottom border
- **Grid layout:** 2 columns, 2 rows with clear visual separation
- **Each contact card:**
  - Subtle background (#fff) with rounded corners
  - Emoji + label on top line (uppercase, small, gray)
  - Phone number below (larger, bold, navy)
  - Consistent padding and spacing
- **Contacts to include:**
  - 🚨 Emergency: 9-1-1
  - 🏢 Property Management (ECI): 732-970-6886
  - 🔧 Heating & Plumbing Urgent: 732-422-2424
  - 📋 Non-Emergency Maintenance: ECI Work Order System

### Content Sections
Organize mined content into logical sections with emoji headers:
- Use descriptive section titles
- Add relevant emoji icons to each header
- Present information clearly with action items when applicable
- Include dates, deadlines, and contact information where relevant

Common section patterns (adapt as needed):
- Project updates
- Budget and financial matters
- Elections and governance
- Parking and vehicles
- Maintenance at a Glance (work order summary)
- Seasonal reminders
- Safety notices
- Community events
- Policy reminders

### Closing Message
- Warm wishes appropriate to the season/upcoming holidays
- Thank residents for cooperation and engagement
- Sign from "Wharfside Manor Board of Trustees" or "Board of Trustees and Management"

## Tone and Style Guidelines

**Voice:**
- Friendly and approachable, but professional
- Informative without being bureaucratic
- Respectful and inclusive of all residents
- Community-focused and neighborly

**Style:**
- Clear and direct communication
- Action-oriented when appropriate
- Use emoji strategically for visual organization
- Break information into digestible sections
- Highlight key dates, deadlines, and requirements

**Formatting:**
- Use HTML heading tags for section headers
- Bold important items like dates, phone numbers, requirements
- Use bullet points for lists and multi-step information
- Maintain consistent spacing and visual hierarchy
- Use horizontal rules to separate major sections

## Reference Materials

Study the example bulletins in the `examples/` folder to understand:
- Seasonal emoji usage and themes
- Section organization and flow
- Level of detail for different topics
- Tone and phrasing patterns
- How to present ongoing vs. new topics
- Appropriate closing messages for different times of year

The examples represent the target quality and style - use them as your guide for structure, tone, and content decisions.

## Special Considerations

**Seasonal Awareness:**
- Tailor opening and closing messages to the time of year
- Include relevant seasonal reminders (winter prep, summer pool opening, etc.)
- Use appropriate holiday greetings (inclusive of all celebrations)
- Adjust emoji themes to match the season

**Ongoing vs. New Topics:**
- Ongoing projects: Provide status updates, note if "no change" since last month
- New topics: Provide full context and background
- Completed items: Acknowledge completion and thank participants

**Resident Actions:**
- Always be clear about what residents need to do and by when
- Distinguish between required actions and recommendations
- Provide contact information for questions or issues

**Inclusive Language:**
- Use welcoming, community-oriented language
- Acknowledge diverse celebrations and observances
- Avoid jargon when possible; explain technical terms when necessary

## Maintenance at a Glance Section

Each bulletin includes a "🔧 Maintenance at a Glance" section summarizing work order activity. Data comes from the ECI work order system export (CSV file).

**Data Source:**
- Work order CSV export from ECI system
- File location: `/Users/nickd/Workspaces/ClaudeAgents/work_order-{date}.csv`
- Key columns: Created At, Completed On, Status, Work Order Issue

**First Introduction (February 2026):**
Use the "New!" badge and include a brief explanation:

> **🔧 Maintenance at a Glance** *(New!)*
>
> Starting this month, we're sharing a snapshot of community maintenance activity. Our work order system launched in August 2025, giving us better visibility into requests and progress.
>
> **Since August 2025:** {total} requests received · {completed} completed ({percent}%)
> **{Month}:** {new} new requests · {completed_month} completed
>
> Top categories include {categories}. {Brief positive note about progress.}

**Ongoing Months (March 2026+):**
Keep it concise—no introduction needed:

> **🔧 Maintenance at a Glance**
>
> **{Month}:** {new} new requests · {completed} completed
> **Open Work Orders:** {open} (up/down from {previous})
>
> Top categories this month: {categories}. {Optional seasonal note or forward-looking item.}

**Guidelines:**
- Keep it short—one highlight box plus one sentence
- Focus on progress, not backlog
- Include seasonal context when relevant (e.g., "heating calls expected in winter")
- No vendor names
- No individual unit details

## Output Requirements

**Email Format:**
- Send as HTML email using Gmail MCP `send_email` tool (not drafts)
- Use `mimeType: "text/html"` for rich formatting
- Include version in subject line: "[Month Year] Monthly Bulletin - Draft v0.X"
- Send directly to: nickd@wharfsidemb.com
- Do NOT save as draft - always send the bulletin directly for review

**Logo Embedding (GitHub Hosted):**
The cropped logo is served from GitHub for reliable display across all email clients:
- **Logo URL:** `https://raw.githubusercontent.com/nickdnj/wharfside-assets/master/Wharfside_Logo_Cropped.png`
- Display at 180px width in masthead left column
- No border or background styling - clean presentation
- Original file: `Wharfside_Logo.png` (with whitespace)
- Cropped file: `Wharfside_Logo_Cropped.png` (whitespace removed, use this one)

**HTML Template Structure:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Georgia', serif; max-width: 680px; margin: 0 auto; padding: 20px; color: #2c3e50; line-height: 1.8; background: white; }

    /* Clean Masthead - Logo left, Title right-aligned */
    .masthead { padding: 20px 0 25px 0; margin-bottom: 30px; border-bottom: 3px solid #1a3a5c; }
    .masthead-title { font-size: 28px; color: #1a3a5c; margin: 0; font-weight: normal; letter-spacing: 1px; }
    .masthead-subtitle { font-size: 13px; color: #c9a227; margin: 6px 0 0 0; letter-spacing: 2px; text-transform: uppercase; font-family: Arial, sans-serif; font-weight: bold; }
    .masthead-location { font-size: 13px; color: #7f8c8d; margin: 4px 0 0 0; font-style: italic; }

    /* Content */
    h2 { font-size: 18px; color: #1a3a5c; margin: 20px 0 12px 0; padding-bottom: 6px; border-bottom: 1px solid #ddd; font-weight: normal; }

    /* Professional Contacts Box */
    .contacts-box { background: #fdf6e3; padding: 20px 24px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #1a3a5c; }
    .contacts-title { text-align: center; font-weight: bold; color: #1a3a5c; margin: 0 0 16px 0; padding-bottom: 12px; border-bottom: 1px solid #e8dcc8; font-size: 15px; }
    .contacts-grid { width: 100%; border-collapse: separate; border-spacing: 8px; }
    .contacts-grid td { padding: 12px 14px; vertical-align: top; width: 50%; background: #fff; border-radius: 6px; }
    .contact-label { font-size: 11px; color: #7f8c8d; text-transform: uppercase; letter-spacing: 0.5px; margin: 0; }
    .contact-number { font-size: 16px; font-weight: bold; color: #1a3a5c; margin: 4px 0 0 0; }

    .highlight { background: #f8f9fa; padding: 18px 22px; margin: 18px 0; border-left: 3px solid #1a3a5c; }
    .maintenance-box { background: #f0f7f4; padding: 18px 22px; margin: 18px 0; border-left: 3px solid #1abc9c; }
    .pool-info { background: #f0faf8; padding: 20px 25px; margin: 20px 0; border-radius: 4px; text-align: center; }
    .divider { text-align: center; margin: 25px 0; color: #c9a227; letter-spacing: 8px; }
    .new-badge { background: #1abc9c; color: white; font-size: 11px; padding: 2px 8px; border-radius: 3px; font-family: Arial, sans-serif; vertical-align: middle; margin-left: 8px; }

    /* Footer */
    .footer { text-align: center; margin-top: 50px; padding-top: 30px; border-top: 3px solid #1a3a5c; }
    strong { color: #1a3a5c; }
  </style>
</head>
<body>
  <div class="masthead">
    <table cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td width="200" valign="middle">
          <img src="https://raw.githubusercontent.com/nickdnj/wharfside-assets/master/Wharfside_Logo_Cropped.png" alt="Wharfside Manor" style="width:180px;height:auto;">
        </td>
        <td valign="middle" style="text-align: right;">
          <div class="masthead-title">Monthly Bulletin</div>
          <div class="masthead-subtitle">{month} {year}</div>
          <div class="masthead-location">Wharfside Manor • Monmouth Beach, NJ</div>
        </td>
      </tr>
    </table>
  </div>

  <!-- Contacts Box -->
  <div class="contacts-box">
    <p class="contacts-title">📞 Important Contacts</p>
    <table class="contacts-grid">
      <tr>
        <td>
          <p class="contact-label">🚨 Emergency</p>
          <p class="contact-number">9-1-1</p>
        </td>
        <td>
          <p class="contact-label">🏢 Property Management (ECI)</p>
          <p class="contact-number">732-970-6886</p>
        </td>
      </tr>
      <tr>
        <td>
          <p class="contact-label">🔧 Heating & Plumbing Urgent</p>
          <p class="contact-number">732-422-2424</p>
        </td>
        <td>
          <p class="contact-label">📋 Non-Emergency Maintenance</p>
          <p class="contact-number">ECI Work Order System</p>
        </td>
      </tr>
    </table>
  </div>

  <!-- Content sections with anchor (⚓) dividers -->

  <div class="footer">
    <p><strong>Warmly,</strong></p>
    <p><strong>Wharfside Manor Board of Trustees</strong></p>
    <p>Wharfside Manor Condominium Association, Inc. • Monmouth Beach, NJ</p>
  </div>
</body>
</html>
```

**Initial Draft Expectations:**
- This first draft will be reviewed via email reply
- Focus on completeness and organization over perfection
- When uncertain about including something, include it for discussion
- Highlight any items that need clarification or additional context

## Review and Iteration

**Email-Based Collaboration:**
- Initial draft sent as HTML email to Nick
- Nick replies with feedback and requested changes
- Agent processes feedback and sends updated version
- Version number increments with each revision (v0.1 → v0.2 → v0.3)
- Subject line always includes current version

**Iteration Process:**
1. Receive feedback via email reply
2. Parse requested changes
3. Update bulletin content
4. Increment version number
5. Send new HTML email with updated bulletin
6. Repeat until approved for board review

**Publishing for Board Review:**
- When Nick approves, update subject to indicate "For Board Review"
- Final version ready for distribution to board members
- Nick handles forwarding to board distribution list

**Version Tracking:**
- Draft versions: v0.1, v0.2, v0.3, etc.
- Published for review: same version, status change in subject
- Final release: v1.0

The goal is to produce a bulletin that is informative, well-organized, and maintains the welcoming community tone that residents have come to expect.
