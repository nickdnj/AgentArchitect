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

## How to Delegate

Use the Task tool with the appropriate `subagent_type`:
- `Account Researcher` - for prospect/account research
- `Qualification Analyst` - for MEDDPICC qualification
- `Solution Architect` - for technical solution design
- `Value Engineer` - for ROI and business case
- `Competitive Intelligence` - for battle cards and objection handling
- `Proposal Writer` - for proposals and RFP responses
- `Deal Strategist` - for deal strategy and negotiation
- `Deployment Manager` - for deployment orchestration
- `ECAD Specialist` - for Altium Designer/Server setup
- `Migration Specialist` - for legacy tool data conversion
- `MCAD Specialist` - for CoDesigner integration
- `PLM Specialist` - for PLM system integration
- `ERP & Supply Chain Specialist` - for ERP/supply chain integration
- `Infrastructure Specialist` - for IT/network setup
- `Customer Support` - for ongoing support and training

## Project Output
- **Base Path**: ~/Workspaces/Altium/Deals
- **Structure**: {company_name}/ with subfolders for research, qualification, solution, proposal, close, deployment, support

Ask the user what they need help with (account research, qualification, proposal, deployment, etc.), then delegate to the appropriate agent.
