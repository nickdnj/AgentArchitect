# Altium Solutions Team

Load the Altium Solutions Team for end-to-end customer lifecycle management.

Read `teams/altium-solutions/team.json` to load the team configuration.

## Team Purpose

End-to-end customer lifecycle team for Altium sales and solutions, accelerating every phase: Lead → Qualification → Technical Sales → Business Sales → Deployment → Support → Expansion.

## Available Agents

Delegate to these agents based on the task:

| Agent | Role | When to Use |
|-------|------|-------------|
| **account-researcher** | Account intelligence | Research prospects, build account briefs |
| **qualification-analyst** | Qualification | Assess fit, create MEDDPICC scorecards |
| **solution-architect** | Technical sales | Design solutions, demo scripts, competitive differentiation |
| **value-engineer** | Business value | ROI models, TCO analyses, business cases |
| **competitive-intel** | Competitive positioning | Battle cards, objection handling, win/loss analysis |
| **proposal-writer** | Proposals | RFP responses, proposals, executive summaries |
| **deal-strategist** | Deal navigation | Strategy memos, stakeholder mapping, negotiation playbooks |
| **presentation** | Presentations | Altium-branded decks, internal briefings, customer presentations |
| **deployment-manager** | Deployment orchestration | Coordinate specialists, customer communication, go-lives |
| **ecad-specialist** | ECAD deployment | Altium Designer, Enterprise Server, workspace management |
| **migration-specialist** | Data migration | Legacy EDA conversion (Cadence, Mentor, EAGLE, KiCad) |
| **mcad-specialist** | MCAD integration | CoDesigner for SolidWorks, Creo, Inventor, Fusion 360, NX |
| **plm-specialist** | PLM integration | Windchill, Teamcenter, Arena, Oracle Agile |
| **erp-supplychain-specialist** | ERP/Supply chain | SAP, Oracle, Octopart, SiliconExpert |
| **infrastructure-specialist** | IT infrastructure | Windows Server, LDAP/SSO, network security |
| **customer-support** | Ongoing support | Training, health monitoring, expansion opportunities |

## Workflow Stages

The customer lifecycle flow:

1. **Discovery** - Account Researcher creates comprehensive account brief
2. **Qualification** - Qualification Analyst produces MEDDPICC scorecard
3. **Technical & Business Sales** (parallel) - Solution Architect + Value Engineer
4. **Proposal** - Proposal Writer with Competitive Intel support
5. **Close** - Deal Strategist navigates through contract signature
6. **Deployment** - Deployment Manager coordinates domain specialists
7. **Domain Integration** (parallel) - ECAD, Migration, MCAD, PLM, ERP, Infrastructure specialists
8. **Ongoing Support** - Customer Support handles training and expansion (loops back to Discovery)

**Support agents** (available on-demand at any stage):
- **competitive-intel** - Competitive situations, RFPs with competitor mentions, objection handling
- **presentation** - Internal briefings, customer decks, deal review presentations

## How to Delegate

Use the Task tool with the appropriate `subagent_type`:
- `Account Researcher` - for prospect/account research
- `Qualification Analyst` - for MEDDPICC qualification
- `Solution Architect` - for technical solution design
- `Value Engineer` - for ROI and business case
- `Competitive Intelligence` - for battle cards and objection handling
- `Proposal Writer` - for proposals and RFP responses
- `Deal Strategist` - for deal strategy and negotiation
- `Presentation` - for Altium-branded presentations (see Presentation section below)
- `Deployment Manager` - for deployment orchestration
- `ECAD Specialist` - for Altium Designer/Server setup
- `Migration Specialist` - for legacy tool data conversion
- `MCAD Specialist` - for CoDesigner integration
- `PLM Specialist` - for PLM system integration
- `ERP & Supply Chain Specialist` - for ERP/supply chain integration
- `Infrastructure Specialist` - for IT/network setup
- `Customer Support` - for ongoing support and training

## Presentation Agent - Altium Usage

The Presentation agent creates professional Altium-branded PowerPoint presentations using the `Altium_TEMPLATE.pptx` (42 layouts). It runs against the PowerPoint MCP server in Docker.

### PowerPoint MCP Server

- **Docker container**: `powerpoint-mcp-server` on port 8001
- **Transport**: Streamable HTTP at `http://localhost:8001/mcp`
- **Templates**: `/app/templates/Altium_TEMPLATE.pptx` (container path)
- **Workspace**: `/app/workspace/` (save here, then copy to deal folder)
- **Host template path**: `/Users/nickd/Workspaces/mcp_servers/Office-PowerPoint-MCP-Server/templates/`
- **Host workspace path**: `/Users/nickd/Workspaces/mcp_servers/Office-PowerPoint-MCP-Server/workspace/`

### CRITICAL: Correct MCP API Pattern

The PowerPoint MCP server has a known quirk: `create_presentation_from_template` does NOT set the active presentation. You MUST call `switch_presentation` immediately after.

```
1. create_presentation_from_template(template_path="/app/templates/Altium_TEMPLATE.pptx")
   → Returns presentation_id (e.g., "presentation_1")

2. switch_presentation(presentation_id="presentation_1")    ← MANDATORY
   → Without this, all subsequent operations silently do nothing

3. Content operations (no file_path or presentation_id needed):
   add_slide(layout_index=4)
   populate_placeholder(slide_index=N, placeholder_idx=0, text="Title")
   add_bullet_points(slide_index=N, placeholder_idx=1, bullet_points=[...])

4. save_presentation(file_path="/app/workspace/Output.pptx")
```

### Key Altium Layouts

| Layout | Name | Placeholders | Use For |
|--------|------|-------------|---------|
| 0 | Title Slide | ph 1, 2, 3 | Opening slide |
| 4 | Medium Text | ph 0=title, 1=body | 60% of content slides |
| 8 | Agenda | ph 0=title, 1=body | Table of contents |
| 12 | Dual Content Large | ph 0=title, 1=RIGHT, 2=LEFT | Two columns, comparisons |
| 21 | Section Header | ph 0=main, 1=subtitle | Topic transitions |
| 30 | Takeaway Large | ph 0=title, 1=content, 2=callout | Key messages |
| 36 | Quote 01 | ph 0=quote, 1=attribution | Testimonials |
| 38 | Summary | ph 0=title, 1=content | Closing slides |

### Content Principles
- Use audience-focused language (YOU/YOUR)
- Impact-driven titles (not topic-only)
- 3-5 bullets per slide, 1-2 lines each
- Always use `populate_placeholder` and `add_bullet_points` (never `manage_text`)

### Template Guide Reference
For detailed layout documentation, read: `context-buckets/altium-presentation-guide/files/ALTIUM_TEMPLATE_GUIDE.md`

## Project Output
- **Base Path**: ~/Workspaces/Altium/Deals
- **Structure**: {company_name}/ with subfolders for research, qualification, solution, proposal, close, deployment, support, presentation
- **Presentation output**: Save to `/app/workspace/` first, then `cp` to `~/Workspaces/Altium/Deals/{company}/presentation/`

Ask the user what they need help with (account research, qualification, proposal, presentation, deployment, etc.), then delegate to the appropriate agent.
