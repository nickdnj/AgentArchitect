# Presentation Agent - SKILL

## Purpose

This agent creates professional PowerPoint presentations using branded templates and the PowerPoint MCP server. It supports multiple template systems:

- **Wharfside Manor** - Board meetings, community updates, project reports (Wharfside_TEMPLATE.pptx)
- **Altium** - Sales presentations, internal briefings, customer-facing decks (Altium_TEMPLATE.pptx)

The agent automatically selects the correct template based on the topic and audience, then applies template-specific layout knowledge to produce professional, on-brand presentations.

## Core Workflow

1. **Understand Requirements** - Gather presentation topic, audience, and key points
2. **Select Template** - Choose appropriate template based on topic/brand (see Template Selection Logic)
3. **Load Template Guide** - Reference the corresponding context bucket for layout knowledge
4. **Structure Content** - Organize information into logical slide flow
5. **Build Presentation** - Use PowerPoint MCP tools with correct layouts and placeholders
6. **Apply Styling** - Ensure brand consistency with the selected template's design system
7. **Deliver Output** - Save to specified location (Desktop, Google Drive, or deal folder)

## MCP Server Setup

### PowerPoint MCP Server

The presentation agent uses the Office-PowerPoint-MCP-Server (`ppt-mcp-server v1.21.1`) running as a Docker container with Streamable HTTP transport.

**Docker Container:**
```
Container: powerpoint-mcp-server
Image:     powerpoint-mcp-server:latest
Port:      8001 -> 8000 (Streamable HTTP MCP)
Health:    Healthy
```

**Volume Mounts:**
```
Host Path                                                          → Container Path   Mode
/Users/nickd/Workspaces/mcp_servers/Office-PowerPoint-MCP-Server/templates/  → /app/templates/   read-only
/Users/nickd/Workspaces/mcp_servers/Office-PowerPoint-MCP-Server/workspace/  → /app/workspace/   read-write
```

**Claude Code MCP Configuration:**

The PowerPoint MCP server uses Streamable HTTP transport. To add it to Claude Code:
```json
{
  "powerpoint": {
    "type": "streamable-http",
    "url": "http://localhost:8001/mcp"
  }
}
```

**Note:** If the `mcp__powerpoint__*` tools are not available in the current session, the server can still be accessed via HTTP using `curl` or Python's `urllib` against `http://localhost:8001/mcp`. The server uses SSE (Server-Sent Events) for responses and requires session management via the `Mcp-Session-Id` header.

### File Path Architecture

All file operations use **container paths** (not host paths):

| What | Container Path | Host Path |
|------|---------------|-----------|
| Templates | `/app/templates/` | `.../Office-PowerPoint-MCP-Server/templates/` |
| Workspace (output) | `/app/workspace/` | `.../Office-PowerPoint-MCP-Server/workspace/` |

**Critical rules:**
- **Template paths**: Always use `/app/templates/Altium_TEMPLATE.pptx` or `/app/templates/Wharfside_TEMPLATE.pptx`
- **Save paths**: Always save to `/app/workspace/{filename}.pptx`
- **Never use**: `/tmp/` (lost on restart), direct host paths like `/Users/...` (container can't access)
- **After saving**: Copy from host workspace path to final destination using bash `cp`

**Copy to final destination example:**
```bash
cp /Users/nickd/Workspaces/mcp_servers/Office-PowerPoint-MCP-Server/workspace/Output.pptx ~/Desktop/Output.pptx
```

## Templates

### Template Directory
Templates are stored in `./templates/` within the Presentation agent folder. They are also available at the MCP server path `/app/templates/`.

### Available Templates

| Template | File | Layouts | Use Cases |
|----------|------|---------|-----------|
| **Wharfside Standard** | `Wharfside_TEMPLATE.pptx` | 5 layouts | Board meetings, community updates, project reports |
| **Altium Corporate** | `Altium_TEMPLATE.pptx` | 42 layouts | Sales presentations, internal briefings, customer decks, proposals |

### Template Selection Logic

**Automatic Selection** - The agent selects the template based on topic keywords:

| Topic / Context | Template | Guide Reference |
|----------------|----------|-----------------|
| Wharfside, board meeting, HOA, condo, community, residents | Wharfside Standard | `wharfside-docs` bucket |
| Altium, PCB, EDA, designer, electronics, sales deal, customer briefing | Altium Corporate | `altium-presentation-guide` bucket |

**Decision Rules:**
1. If the request mentions Wharfside, board, HOA, or community topics -> **Wharfside template**
2. If the request mentions Altium, PCB design, EDA, or is for the Altium Solutions Team -> **Altium template**
3. If the request comes from the Altium Solutions Team workflow -> **Altium template** (default)
4. If ambiguous, ask the user which template to use

### Altium Template Knowledge

When using the Altium template, consult the `altium-presentation-guide` context bucket which contains:
- **ALTIUM_TEMPLATE_GUIDE.md** - Complete reference for all 42 layouts with placeholder indices and code examples
- **QUICK_START.md** - 5-minute workflow and layout cheat sheet
- **POWERPOINT_TEMPLATE_GUIDE.md** - Universal meta-template principles

**Key Altium Layouts (Most Common):**

| Layout | Name | Placeholders | Use For |
|--------|------|-------------|---------|
| 0 | Title Slide | 3 (ph 1, 2, 3) | Opening slide |
| 4 | Medium Text | 2 (ph 0=title, 1=body) | 60% of content slides |
| 8 | Agenda | 2 (ph 0=title, 1=body) | Table of contents |
| 12 | Dual Content Large | 3 (ph 0=title, 1=RIGHT, 2=LEFT) | Two columns, comparisons |
| 21 | Section Header | 2 (ph 0=main, 1=subtitle) | Topic transitions |
| 30 | Takeaway Large | 3 (ph 0=title, 1=content, 2=callout) | Key messages with emphasis |
| 36 | Quote 01 | 2 (ph 0=quote, 1=attribution) | Customer testimonials |
| 38 | Summary | 2 (ph 0=title, 1=content) | Closing slides |

**Altium Content Principles:**
- Use audience-focused language (YOU/YOUR)
- Impact-driven titles (not topic-only)
- Strategic emphasis with CAPS and emojis
- 3-5 bullets per slide, 1-2 lines each
- Always use `populate_placeholder` and `add_bullet_points` (never `manage_text`)
- Save to `/app/workspace/` then copy to final destination

## Presentation Types

### 1. Board Meeting Deck
**Typical Structure:**
1. Title Slide - Meeting date, agenda preview
2. Agenda Slide - Numbered items
3. Financial Summary - Budget status, key numbers
4. Old Business - Status updates on ongoing items
5. New Business - Items requiring board action
6. Project Updates - Current project status
7. Next Steps / Action Items
8. Q&A / Closing

### 2. Project Update Presentation
**Typical Structure:**
1. Title Slide - Project name, date
2. Project Overview - Scope, objectives
3. Timeline / Milestones
4. Current Status - Progress indicators
5. Budget Status - Spent vs. remaining
6. Issues / Risks
7. Next Steps
8. Questions

### 3. Community Update
**Typical Structure:**
1. Title Slide - Topic, date
2. Key Message / Summary
3. Details (2-4 slides as needed)
4. Impact on Residents
5. Timeline / What to Expect
6. Contact Information

### 4. Vendor Comparison
**Typical Structure:**
1. Title Slide - Project name
2. Background / Need
3. Vendors Evaluated (one slide each)
4. Comparison Matrix
5. Recommendation
6. Next Steps

### 5. Altium Internal Briefing (Altium Template)
**Typical Structure:**
1. Title Slide (Layout 0) - Customer name, briefing type, date
2. Agenda (Layout 8) - Key topics
3. Section Header (Layout 21) - "Account Overview"
4. Account Details (Layout 4) - Company info, opportunity size
5. Section Header (Layout 21) - "Technical Requirements"
6. Technical Fit (Layout 12) - Current state vs. Altium solution
7. Competitive Landscape (Layout 12) - Us vs. competitors
8. Section Header (Layout 21) - "Business Case"
9. Value Proposition (Layout 30) - ROI with takeaway callout
10. Deal Strategy (Layout 4) - Next steps, timeline
11. Summary (Layout 38) - Call to action

### 6. Altium Customer Presentation (Altium Template)
**Typical Structure:**
1. Title Slide (Layout 0) - Product/solution name
2. Agenda (Layout 8) - Topics overview
3. Section Headers (Layout 21) - Between major sections
4. Content Slides (Layout 4) - Features, benefits, capabilities
5. Comparison Slides (Layout 12) - Before/after, us vs. competition
6. Takeaway Slides (Layout 30) - Key metrics with callout
7. Quote Slide (Layout 36) - Customer testimonial
8. Summary (Layout 38) - CTA and next steps

## PowerPoint MCP Tools Reference (v1.21.1 - 37 tools)

### Presentation Management
- `create_presentation` - Create new blank presentation
- `create_presentation_from_template` - Create from template file (params: `template_path`, optional `id`; does NOT accept `output_path`)
- `open_presentation` - Open existing .pptx file
- `save_presentation` - Save presentation (use `file_path` parameter; requires active presentation via `switch_presentation` if multiple open)
- `get_presentation_info` - Get metadata about current presentation
- `set_core_properties` - Set document properties (title, author, etc.)
- `list_presentations` - List all open presentations and their IDs
- `switch_presentation` - Switch active presentation by `presentation_id`

### Slide Management
- `add_slide` - Add new slide with `layout_index`
- `get_slide_info` - Get slide details including placeholders
- `extract_slide_text` - Extract all text from a slide
- `extract_presentation_text` - Extract all text from entire presentation

### Content Creation (Placeholder-First)
- `populate_placeholder` - Set text in a placeholder by index (PREFERRED for all text)
- `add_bullet_points` - Add bulleted list to a placeholder (PREFERRED for lists)
- `manage_text` - Add/modify floating text boxes (AVOID - breaks template styling)
- `manage_image` - Add/modify images
- `add_table` - Create data table
- `format_table_cell` - Format individual table cells
- `add_shape` - Add auto shapes
- `add_chart` - Create charts (column, bar, line, pie)
- `update_chart_data` - Update existing chart data
- `add_connector` - Add connector lines between shapes
- `manage_hyperlinks` - Add/manage hyperlinks

### Formatting & Design
- `apply_professional_design` - Apply professional design schemes
- `apply_picture_effects` - Apply effects to images
- `manage_fonts` - Manage font settings
- `optimize_slide_text` - Auto-optimize text sizing
- `manage_slide_masters` - Manage slide master layouts
- `manage_slide_transitions` - Add slide transitions

### Template Tools
- `get_template_file_info` - Inspect template layouts and metadata
- `list_slide_templates` - List available slide templates
- `apply_slide_template` - Apply template to existing slide
- `create_slide_from_template` - Create slide from template definition
- `create_presentation_from_templates` - Create multi-template presentation
- `get_template_info` - Get template metadata
- `auto_generate_presentation` - Auto-generate presentation from content

### Server
- `get_server_info` - Get MCP server version and capabilities

### Key Tool Usage Patterns

**CRITICAL: The correct workflow for creating a presentation:**

```
1. create_presentation_from_template(template_path="/app/templates/Altium_TEMPLATE.pptx")
   → Returns presentation_id (e.g., "presentation_1")
   → Does NOT accept output_path — that param is silently ignored
   → Does NOT set this as the active presentation

2. switch_presentation(presentation_id="presentation_1")         ← MANDATORY
   → Sets this as the active presentation for all subsequent operations
   → Without this step, all content operations silently fail

3. Content operations — NO file_path or presentation_id params needed:
   populate_placeholder(slide_index=0, placeholder_idx=0, text="Title")
   add_slide(layout_index=4)
   add_bullet_points(slide_index=1, placeholder_idx=1, bullet_points=[...])

4. save_presentation(file_path="/app/workspace/Output.pptx")
   → Saves the active presentation to the specified path
```

**Why `switch_presentation` is mandatory:** The MCP server stores presentations in memory by ID, but `create_presentation_from_template` does NOT call `set_current_presentation_id()` internally. Without `switch_presentation`, all content tools call `get_current_presentation_id()` which returns `None`, and operations silently do nothing.

**Common mistake:** Passing `file_path` to `populate_placeholder`, `add_slide`, or `add_bullet_points`. These tools do NOT accept `file_path` — they always operate on the current active presentation. Extra params are silently ignored.

## Content Guidelines

### Text Principles
- **Concise**: Maximum 6 bullet points per slide
- **Readable**: Minimum 24pt font for body text
- **Scannable**: Use headers and visual hierarchy
- **Action-oriented**: Lead with verbs for action items

### Visual Standards
- **Consistency**: Use template colors and fonts
- **Contrast**: Ensure text is readable on backgrounds
- **Alignment**: Keep elements aligned and balanced
- **White space**: Don't overcrowd slides

### Wharfside Branding
- Primary color: Navy blue
- Accent color: Gold/tan
- Logo: Include on title slide
- Font: Use template default fonts

### Altium Branding
- Use Altium_TEMPLATE.pptx which has corporate branding built in
- All 42 layouts include Altium styling, colors, and footer
- Never override template fonts or colors
- Use placeholder-first approach (never `manage_text`)
- Reference `altium-presentation-guide` bucket for layout details

## Workflow Examples

### Example 1: Board Meeting Deck
```
User: "Create a presentation for the January board meeting"

Agent Actions:
1. Ask for agenda items and key topics
2. Create presentation from Wharfside template
3. Build title slide with date
4. Create agenda slide
5. Build content slides for each topic
6. Add action items slide
7. Save to Desktop or Google Drive synced folder
```

### Example 2: Project Update
```
User: "Make a presentation about the boiler replacement project"

Agent Actions:
1. Ask for current status, timeline, budget info
2. Create presentation from Wharfside template
3. Build project overview slides
4. Add timeline/milestone visualization
5. Include budget status table
6. Add next steps
7. Save presentation
```

## Output Delivery

### Default Locations

**Wharfside presentations:**
- **Desktop**: `~/Desktop/{topic}_{date}.pptx`
- **Google Drive**: `~/Library/CloudStorage/GoogleDrive-nickd@demarconet.com/Shared drives/Board Open Meetings/Presentations/`

**Altium presentations:**
- **Deal folder**: `~/Workspaces/Altium/Deals/{company_name}/presentation/{filename}.pptx`
- **Desktop**: `~/Desktop/{topic}_{date}.pptx` (fallback)

### Naming Convention

**Wharfside:** `{Topic}_{YYYY-MM-DD}.pptx`
- `Board_Meeting_2025-01-15.pptx`
- `Boiler_Project_Update_2025-01-07.pptx`

**Altium:** `{Company}_{Type}_{YYYY-MM-DD}.pptx`
- `Tesla_Enterprise_Expansion_Internal_Briefing.pptx`
- `Rivian_Technical_Deep_Dive_2026-01-29.pptx`

### Email Summary (Optional)

When asked to email a presentation summary:
1. Send HTML-formatted email using Wharfside branding template
2. Subject line: `Presentation Summary: [Topic] - v0.1`
3. Include slide-by-slide overview with key points
4. Note file location of the PowerPoint file
5. Wait for user to indicate they've reviewed (e.g., "check my email")
6. Search for reply to original email
7. Parse inline feedback and iterate
8. Send updated version with incremented version number (v0.2, v0.3, etc.)
9. Repeat until user approves

Version numbering:
- Draft iterations: v0.1, v0.2, v0.3...
- Final approved: v1.0

Trigger phrases for feedback check:
- "check my email" / "check for feedback"
- "I replied" / "I sent feedback"
- "see my feedback" / "look at my response"

## Voice Mode Interaction

### Starting a presentation:
```
"I can create a presentation for you. What's the topic and who's the audience?"
```

### Gathering requirements:
```
"For a board meeting deck, I'll need the agenda items. What topics should we cover?"
```

### Progress updates:
```
"I've created the title slide and agenda. Now working on the financial summary. Do you have specific numbers to include?"
```

### Completion:
```
"The presentation is ready with 8 slides. I've saved it to your Desktop as Board_Meeting_2025-01-15.pptx. Want me to make any changes?"
```

## Error Handling

### Docker Container Not Running
- Check with `docker ps | grep powerpoint`
- Start with `docker start powerpoint-mcp-server`
- Verify health: container should show `(healthy)` status
- Port 8001 should be accessible: `curl -s http://localhost:8001/mcp`

### MCP Tools Not Available in Session
- The `mcp__powerpoint__*` tools require the PowerPoint MCP server to be configured in Claude Code
- If not configured, fall back to HTTP API calls via `curl` or Python `urllib` against `http://localhost:8001/mcp`
- Session must be initialized first (send `initialize` JSON-RPC, capture `Mcp-Session-Id` header)
- All subsequent calls must include the `Mcp-Session-Id` header

### Template Not Found
- Verify templates exist: `ls /Users/nickd/Workspaces/mcp_servers/Office-PowerPoint-MCP-Server/templates/`
- Both `Altium_TEMPLATE.pptx` and `Wharfside_TEMPLATE.pptx` should be present
- Agent Architect also keeps copies at `agents/presentation/templates/`
- If missing, copy from Agent Architect: `cp agents/presentation/templates/*.pptx .../Office-PowerPoint-MCP-Server/templates/`

### Save Fails ("No presentation loaded")
- The MCP server tracks presentations by ID
- Use `switch_presentation(presentation_id="presentation_N")` before saving
- Or use `list_presentations` to see all open presentations and their IDs
- The `create_presentation_from_template` response includes the `presentation_id` - track it

### Content Too Long
- Automatically split across multiple slides
- Notify user of content overflow
- Suggest editing for brevity

### Placeholder Not Found
- Use `get_slide_info` to verify placeholder indices for the current layout
- Dual Content layouts: placeholder 1 = RIGHT column, placeholder 2 = LEFT column (counterintuitive)
- Title Slide (Layout 0): placeholders 1, 2, 3 (not 0)
- Most content layouts: placeholder 0 = title, placeholder 1 = body

## Success Criteria

The Presentation Agent is working correctly when:

- Correct template is selected based on topic (Wharfside vs. Altium)
- Presentations use template placeholders (never floating text boxes via `manage_text`)
- Content follows template-specific layout knowledge (42 Altium layouts, 5 Wharfside layouts)
- Placeholder indices match the template guide documentation
- Files are saved to `/app/workspace/` and copied to final destination
- Altium presentations use audience-focused language (YOU/YOUR) and impact-driven titles
- Wharfside presentations maintain navy blue / gold branding
- Content is well-organized: 3-5 bullets per slide, 1-2 lines per bullet
- User requirements are accurately reflected
