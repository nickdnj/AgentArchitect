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

### Important Facts (Do Not Contradict)
- **No waste stations:** There are NO pet waste stations at the property. Do not mention "waste stations located throughout the property."
- **Snow removal:** Owners are NOT responsible for shoveling snow on walkways. Do not tell residents to keep walkways clear of snow.

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
- **Container:** Rounded box with light warm background (#fdf6e3)
- **Title:** "Know Who to Call" - bold navy, no emoji
- **Grid layout:** 2 columns, 2 rows
- **Each contact:**
  - Label on top (uppercase, small, gray)
  - Phone number below (larger, bold, navy)
- **Contacts to include:**
  - Emergency: 9-1-1
  - Property Management (ECI): 732-970-6886
  - Alexander Plumbing (Urgent): 732-422-2424
  - Non-Emergency Maintenance: ECI Work Order System

**Template:**
```html
<div class="contacts-box">
  <p style="margin: 0 0 10px 0; font-weight: bold; color: #1a3a5c; font-size: 15px;">Know Who to Call</p>
  <table class="contacts-grid">
    <tr>
      <td>
        <p class="contact-label">Emergency</p>
        <p class="contact-number">9-1-1</p>
      </td>
      <td>
        <p class="contact-label">Property Management (ECI)</p>
        <p class="contact-number">732-970-6886</p>
      </td>
    </tr>
    <tr>
      <td>
        <p class="contact-label">Alexander Plumbing (Urgent)</p>
        <p class="contact-number">732-422-2424</p>
      </td>
      <td>
        <p class="contact-label">Non-Emergency Maintenance</p>
        <p class="contact-number">ECI Work Order System</p>
      </td>
    </tr>
  </table>
</div>
```

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

## Pool Season Section

The Pool Season section appears in every bulletin. Use the Archivist agent to verify dates from the pool contract if needed.

**2026 Pool Schedule:**
- **Opens:** May 23 (Saturday before Memorial Day)
- **Closes:** September 8 (day after Labor Day)
- **Hours:** 10:00 AM – 7:00 PM daily
- **Weekends only:** May 23 – June 19 (until Monmouth Beach school ends)
- **Open daily:** June 20 – September 8

**Important:** Do NOT include "Lifeguard on duty weekends & holidays" - this is internal operational info.

**Template:**
```html
<div class="pool-info">
  <p style="margin: 0; font-size: 15px; color: #1a3a5c;"><strong>Mark Your Calendars!</strong></p>
  <p style="margin: 8px 0 4px 0; font-size: 17px;"><strong>Opens:</strong> May 23 &nbsp;&nbsp;|&nbsp;&nbsp; <strong>Closes:</strong> September 8</p>
  <p style="margin: 0; color: #7f8c8d;"><strong>Daily Hours:</strong> 10:00 AM – 7:00 PM</p>
  <p style="margin: 8px 0 0 0; font-size: 13px; color: #1a3a5c;"><strong>Weekends only:</strong> May 23 – June 19<br><strong>Open daily:</strong> June 20 – September 8</p>
</div>
```

## Board of Trustees Section

Include a "Your Board of Trustees" section with current officers and trustees:

**Current Board (as of January 2026):**
- President: Giuseppe Gencarelli
- Vice President: Thomas Bopp
- Secretary: Nick DeMarco
- Treasurer: Taryn Frost
- Trustees: Roberta Attanasi, Anthony D'Anna, Timmy Mucaj, Gary Passenti, Mike Serhat

**Template:**
```html
<h2>Your Board of Trustees</h2>
<table class="board-grid">
  <tr>
    <td width="50%">
      <span class="board-role">President</span><br>
      <span class="board-name">Giuseppe Gencarelli</span>
    </td>
    <td width="50%">
      <span class="board-role">Vice President</span><br>
      <span class="board-name">Thomas Bopp</span>
    </td>
  </tr>
  <tr>
    <td>
      <span class="board-role">Secretary</span><br>
      <span class="board-name">Nick DeMarco</span>
    </td>
    <td>
      <span class="board-role">Treasurer</span><br>
      <span class="board-name">Taryn Frost</span>
    </td>
  </tr>
</table>
<p style="margin-top: 10px;"><strong>Trustees:</strong> Roberta Attanasi, Anthony D'Anna, Timmy Mucaj, Gary Passenti, Mike Serhat</p>
```

## February Dates Section

For February bulletins, include a "February Dates to Remember" section:
- National Freedom Day (Feb 1)
- Groundhog Day (Feb 2)
- Super Bowl Sunday & Board Meeting date
- Valentine's Day (Feb 14)
- Presidents Day / Lunar New Year / Mardi Gras (typically mid-Feb)

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
- **IMPORTANT:** Do NOT use CDATA wrappers (`<![CDATA[...]]>`) in htmlBody - they leak through and appear as `]]>` at the end of the email

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
    body { font-family: 'Georgia', serif; max-width: 680px; margin: 0 auto; padding: 20px; color: #2c3e50; line-height: 1.7; background: white; }

    /* Clean Masthead - Logo left, Title RIGHT-ALIGNED */
    .masthead { padding: 15px 0 20px 0; margin-bottom: 25px; border-bottom: 3px solid #1a3a5c; }
    .masthead-title { font-size: 28px; color: #1a3a5c; margin: 0; font-weight: normal; letter-spacing: 1px; }
    .masthead-subtitle { font-size: 13px; color: #c9a227; margin: 6px 0 0 0; letter-spacing: 2px; text-transform: uppercase; font-family: Arial, sans-serif; font-weight: bold; }
    .masthead-location { font-size: 13px; color: #7f8c8d; margin: 4px 0 0 0; font-style: italic; }

    /* Content - compact spacing */
    h2 { font-size: 18px; color: #1a3a5c; margin: 20px 0 12px 0; padding-bottom: 6px; border-bottom: 1px solid #ddd; font-weight: normal; }
    p { margin: 0 0 12px 0; }

    /* Contacts Box */
    .contacts-box { background: #fdf6e3; padding: 16px 18px; margin: 18px 0; border-radius: 6px; }
    .contacts-grid { width: 100%; border-collapse: collapse; }
    .contacts-grid td { padding: 6px 10px; vertical-align: top; width: 50%; }
    .contact-label { font-size: 12px; color: #7f8c8d; text-transform: uppercase; letter-spacing: 0.5px; margin: 0; }
    .contact-number { font-size: 15px; font-weight: bold; color: #1a3a5c; margin: 2px 0 0 0; }

    /* Content Boxes */
    .highlight { background: #f8f9fa; padding: 14px 18px; margin: 14px 0; border-left: 3px solid #1a3a5c; }
    .maintenance-box { background: #f0f7f4; padding: 14px 18px; margin: 14px 0; border-left: 3px solid #1abc9c; }
    .alert-box { background: #fff5f5; padding: 14px 18px; margin: 14px 0; border-left: 3px solid #c53030; }
    .info-box { background: #f0f4f8; padding: 14px 18px; margin: 14px 0; border-left: 3px solid #3182ce; }
    .success-box { background: #f0fff4; padding: 14px 18px; margin: 14px 0; border-left: 3px solid #38a169; }
    .pool-info { background: #e8f4f8; padding: 16px 20px; margin: 16px 0; border-radius: 6px; text-align: center; }
    .divider { text-align: center; margin: 25px 0; color: #c9a227; letter-spacing: 8px; }
    .new-badge { background: #1abc9c; color: white; font-size: 11px; padding: 2px 8px; border-radius: 3px; font-family: Arial, sans-serif; vertical-align: middle; margin-left: 8px; }

    /* Board Members Grid */
    .board-grid { width: 100%; border-collapse: collapse; margin: 12px 0; }
    .board-grid td { padding: 4px 8px; vertical-align: top; }
    .board-role { font-size: 12px; color: #7f8c8d; text-transform: uppercase; }
    .board-name { font-weight: bold; color: #1a3a5c; }

    /* Footer */
    .footer { text-align: center; margin-top: 35px; padding-top: 25px; border-top: 3px solid #1a3a5c; }
    strong { color: #1a3a5c; }
    ul { margin: 8px 0; padding-left: 20px; }
    li { margin-bottom: 6px; }
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
          <div class="masthead-location">Wharfside Manor &bull; Monmouth Beach, NJ</div>
        </td>
      </tr>
    </table>
  </div>

  <!-- Opening -->
  <p>Dear Neighbors,</p>
  <p>{seasonal greeting and context}</p>

  <!-- Contacts Box -->
  <div class="contacts-box">
    <p style="margin: 0 0 10px 0; font-weight: bold; color: #1a3a5c; font-size: 15px;">Know Who to Call</p>
    <table class="contacts-grid">
      <tr>
        <td><p class="contact-label">Emergency</p><p class="contact-number">9-1-1</p></td>
        <td><p class="contact-label">Property Management (ECI)</p><p class="contact-number">732-970-6886</p></td>
      </tr>
      <tr>
        <td><p class="contact-label">Alexander Plumbing (Urgent)</p><p class="contact-number">732-422-2424</p></td>
        <td><p class="contact-label">Non-Emergency Maintenance</p><p class="contact-number">ECI Work Order System</p></td>
      </tr>
    </table>
  </div>

  <p class="divider">&bull; &bull; &bull;</p>

  <!-- Content sections here -->

  <div class="footer">
    <p style="margin: 0;"><strong>Warmly,</strong></p>
    <p style="margin: 5px 0;"><strong>Wharfside Manor Board of Trustees</strong></p>
    <p style="font-size: 13px; color: #7f8c8d; margin: 8px 0 0 0;">Wharfside Manor Condominium Association, Inc. &bull; Monmouth Beach, NJ</p>
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
