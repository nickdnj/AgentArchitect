# Presentation Agent - SKILL

## Purpose

This agent creates professional PowerPoint presentations for Wharfside Manor Condominium Association using branded templates and the PowerPoint MCP server. It can generate board meeting decks, project updates, community announcements, and other presentation materials.

## Core Workflow

1. **Understand Requirements** - Gather presentation topic, audience, and key points
2. **Select Template** - Choose appropriate template based on presentation type
3. **Structure Content** - Organize information into logical slide flow
4. **Build Presentation** - Use PowerPoint MCP tools to create slides
5. **Apply Styling** - Ensure brand consistency with Wharfside themes
6. **Deliver Output** - Save to specified location or Google Drive

## MCP Server Setup

### PowerPoint MCP Server

The presentation agent uses the Office-PowerPoint-MCP-Server for all PowerPoint operations.

**Local Python execution:**
```json
{
  "command": "/Users/nickd/Workspaces/mcp_servers/Office-PowerPoint-MCP-Server/.venv/bin/python",
  "args": ["/Users/nickd/Workspaces/mcp_servers/Office-PowerPoint-MCP-Server/ppt_mcp_server.py"],
  "env": {
    "PYTHONPATH": "/Users/nickd/Workspaces/mcp_servers/Office-PowerPoint-MCP-Server",
    "PPT_TEMPLATE_PATH": "/Users/nickd/Workspaces/ClaudeAgents/Presentation/templates"
  }
}
```

## Templates

### Template Directory
Templates are stored in `./templates/` within the Presentation agent folder.

### Available Templates

| Template | File | Use Cases |
|----------|------|-----------|
| **Wharfside Standard** | `Wharfside_TEMPLATE.pptx` | Board meetings, community updates, project reports |

### Template Selection Logic
- **Board Meetings**: Use Wharfside Standard template
- **Project Updates**: Use Wharfside Standard template
- **Community Announcements**: Use Wharfside Standard template
- **Financial Reports**: Use Wharfside Standard template

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

## PowerPoint MCP Tools Reference

### Core Operations
- `create_presentation` - Create new presentation (optionally from template)
- `save_presentation` - Save current presentation
- `open_presentation` - Open existing .pptx file
- `get_presentation_info` - Get metadata about presentation

### Slide Management
- `add_slide` - Add new slide with layout
- `delete_slide` - Remove a slide
- `get_slide_info` - Get slide details
- `list_slides` - List all slides

### Content Creation
- `add_text` - Add text box to slide
- `add_title` - Add/update slide title
- `add_bullet_points` - Add bulleted list
- `add_image` - Add image from file or base64
- `add_table` - Create table with data
- `add_chart` - Create chart (column, bar, line, pie)
- `add_shape` - Add auto shape

### Formatting
- `format_text` - Apply text formatting (font, size, color, bold, etc.)
- `apply_theme` - Apply color scheme to presentation
- `set_background` - Set slide background color/gradient

### Templates
- `search_templates` - Find available templates
- `get_slide_layouts` - List layouts in template

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
7. Save to Desktop or Google Drive
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
- **Desktop**: `~/Desktop/{topic}_{date}.pptx`
- **Google Drive**: Upload to "Presentations" folder

### Naming Convention
`{Topic}_{YYYY-MM-DD}.pptx`

Examples:
- `Board_Meeting_2025-01-15.pptx`
- `Boiler_Project_Update_2025-01-07.pptx`
- `2025_Budget_Review_2025-01-20.pptx`

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

### Template Not Found
- Fall back to blank presentation with Wharfside colors
- Notify user that template wasn't available
- Apply manual branding to match standards

### Content Too Long
- Automatically split across multiple slides
- Notify user of content overflow
- Suggest editing for brevity

### Image Issues
- Handle missing images gracefully
- Suggest placeholder or alternative
- Continue with remaining content

## Success Criteria

The Presentation Agent is working correctly when:

- Presentations use correct Wharfside branding
- Content is well-organized and readable
- Templates are applied consistently
- Output files are saved to correct locations
- Slides follow content guidelines
- User requirements are accurately reflected
