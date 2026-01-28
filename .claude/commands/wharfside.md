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

### CRITICAL: Document/Policy Questions - Use RAG Wrapper

**For ANY question about policies, rules, bylaws, resolutions, or documents, DO NOT use `subagent_type: "Archivist"`.**

Instead, use `subagent_type: "general-purpose"` with embedded RAG commands:

```
Task(
  subagent_type="general-purpose",
  prompt="""You are the Archivist for Wharfside Manor. Answer this question: "[USER QUESTION]"

## MANDATORY: Run these Bash commands FIRST

**Query 1 - Main topic:**
```bash
cd /Users/nickd/Workspaces/pdfscribe_cli && python -c "from src.rag import search_documents; results = search_documents('[MAPPED_QUERY]', bucket_id='wharfside-docs', limit=10, similarity_threshold=0.35); [print(f'[{r.similarity:.3f}] {r.source_file}\\n{r.chunk_text[:300]}\\n') for r in results]"
```

**Query 2 - Amendments/Resolutions:**
```bash
cd /Users/nickd/Workspaces/pdfscribe_cli && python -c "from src.rag import search_documents; results = search_documents('[TOPIC] resolution amendment', bucket_id='wharfside-docs', limit=5, similarity_threshold=0.35); [print(f'[{r.similarity:.3f}] {r.source_file}') for r in results]"
```

Run BOTH commands, then read the most relevant files, and provide the answer with sources.
Always note if a rule was CHANGED from its original version.
The NEWEST document on a topic supersedes older ones."""
)
```

### Keyword Mapping (CRITICAL)

When constructing RAG queries, map user language to document language:

| User Says | Use in Query |
|-----------|--------------|
| "shut off water" / "utilities" | `terminate utilities delinquent` |
| "pet policy" / "dogs" / "cats" | `pet policy dog weight` |
| "airbnb" / "short term rental" | `rental minimum period 6 months` |
| "fines" / "violations" | `fine violation schedule enforcement` |
| "evict tenant" | `eviction attorney-in-fact tenant` |
| "board member conduct" | `code conduct ethics indictable offense` |
| "parking" | `parking rules towing delinquent` |
| "satellite dish" / "antenna" | `OTARD reception device` |
| "storm door" / "front door" | `doors windows chocolate brown fire rated` |
| "occupancy" / "how many people" | `occupancy persons bedroom` |
| "suspension" / "privileges" | `egregious violation suspension` |

### Example: Pet Policy Question

User asks: "What is the pet policy?"

Construct prompt:
```
subagent_type="general-purpose"
prompt="""You are the Archivist for Wharfside Manor. Answer: "What is the pet policy?"

## MANDATORY: Run these Bash commands FIRST

**Query 1:**
```bash
cd /Users/nickd/Workspaces/pdfscribe_cli && python -c "from src.rag import search_documents; results = search_documents('pet policy dog cat weight', bucket_id='wharfside-docs', limit=10, similarity_threshold=0.35); [print(f'[{r.similarity:.3f}] {r.source_file}\\n{r.chunk_text[:300]}\\n') for r in results]"
```

**Query 2:**
```bash
cd /Users/nickd/Workspaces/pdfscribe_cli && python -c "from src.rag import search_documents; results = search_documents('pet weight resolution amendment eliminated', bucket_id='wharfside-docs', limit=5, similarity_threshold=0.35); [print(f'[{r.similarity:.3f}] {r.source_file}') for r in results]"
```

Run BOTH, read relevant files, answer with sources."""
```

### Example: Utility Shutoff Question

User asks: "Can we shut off water?"

Construct prompt:
```
subagent_type="general-purpose"
prompt="""You are the Archivist for Wharfside Manor. Answer: "Can we shut off water if someone doesn't pay?"

## MANDATORY: Run these Bash commands FIRST

**Query 1:**
```bash
cd /Users/nickd/Workspaces/pdfscribe_cli && python -c "from src.rag import search_documents; results = search_documents('terminate utilities delinquent', bucket_id='wharfside-docs', limit=10, similarity_threshold=0.35); [print(f'[{r.similarity:.3f}] {r.source_file}\\n{r.chunk_text[:300]}\\n') for r in results]"
```

**Query 2:**
```bash
cd /Users/nickd/Workspaces/pdfscribe_cli && python -c "from src.rag import search_documents; results = search_documents('utility resolution 99-02 court order', bucket_id='wharfside-docs', limit=5, similarity_threshold=0.35); [print(f'[{r.similarity:.3f}] {r.source_file}') for r in results]"
```

Run BOTH, read relevant files, answer with sources."""
```

## Team Resources
- **Gmail (Board)**: nickd@wharfsidemb.com
- **Gmail (Personal)**: nickd@demarconet.com
- **Output Folder**: teams/wharfside-board-assistant/outputs
- **Shared Context**: wharfside-docs bucket

## Branding
- **Colors**: Navy (#1a3a5c), Gold (#c9a227)
- **Location**: Wharfside Manor, Monmouth Beach, NJ

## Workflow

1. **Receive user request**
2. **Classify the request type:**
   - Document/policy question → Use RAG wrapper pattern above
   - Bulletin request → Delegate to `Monthly Bulletin`
   - Proposal review → Delegate to `Proposal Review`
   - Presentation → Delegate to `Presentation`
   - Email search → Delegate to `Email Research`
3. **For document questions:** Construct the RAG prompt with mapped keywords
4. **Execute the appropriate Task**
5. **Return results to user**
