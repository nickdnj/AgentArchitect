# Wharfside Board Assistant Team

Load the Wharfside Board Assistant Team for Wharfside Manor Condominium Association board tasks.

Read `teams/wharfside-board-assistant/team.json` to load the team configuration.

## Team Purpose
Assists board members with bulletins, proposals, presentations, research, and document management.

## Available Agents

Delegate to these agents based on the task:

| Agent | Role | When to Use |
|-------|------|-------------|
| **monthly-bulletin** | Newsletter creator | Generate monthly community bulletins from board email |
| **proposal-review** | Vendor analyst | Review and compare vendor proposals |
| **presentation** | Presentation creator | Build PowerPoint decks for board meetings |
| **email-research** | Research specialist | Search email archives for topic information |
| **archivist** | Document keeper | Retrieve governing documents, meeting minutes, historical records |

## How to Delegate

Use the Task tool with the appropriate `subagent_type`:
- `Monthly Bulletin` - for bulletin generation
- `Proposal Review` - for vendor proposal analysis
- `Presentation` - for PowerPoint creation
- `Email Research` - for email mining and research
- `Archivist` - for document retrieval and management

## Team Resources
- **Gmail (Board)**: nickd@wharfsidemb.com
- **Gmail (Personal)**: nickd@demarconet.com
- **Output Folder**: teams/wharfside-board-assistant/outputs
- **Shared Context**: wharfside-docs bucket

## Branding
- **Colors**: Navy (#1a3a5c), Gold (#c9a227)
- **Location**: Wharfside Manor, Monmouth Beach, NJ

Ask the user what task they need help with, then delegate to the appropriate agent.
