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

## CRITICAL: Document/Policy Questions - Run RAG Directly

**For ANY question about policies, rules, bylaws, resolutions, or documents:**

**DO NOT delegate to any agent.** Run RAG search commands yourself using Bash.

### Step 1: Map User Language to Document Language

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
| "insurance" / "deductible" | `insurance deductible HO6 policy` |
| "board president" / "officers" | `president secretary treasurer board resolution` |

### Step 2: Run RAG Search (MANDATORY)

Run these Bash commands DIRECTLY (do not delegate):

**Query 1 - Main topic:**
```bash
cd /Users/nickd/Workspaces/pdfscribe_cli && python -c "from src.rag import search_documents; results = search_documents('[MAPPED_QUERY]', bucket_id='wharfside-docs', limit=10, similarity_threshold=0.35); [print(f'[{r.similarity:.3f}] {r.source_file}\n{r.chunk_text[:300]}\n') for r in results]"
```

**Query 2 - Amendments/Resolutions (REQUIRED):**
```bash
cd /Users/nickd/Workspaces/pdfscribe_cli && python -c "from src.rag import search_documents; results = search_documents('[TOPIC] resolution amendment', bucket_id='wharfside-docs', limit=5, similarity_threshold=0.35); [print(f'[{r.similarity:.3f}] {r.source_file}') for r in results]"
```

### Step 3: Read Source Documents

Based on RAG results, use the Read tool to get full content from the most relevant files.
- Files are located in `~/AppFolio-Sync/` or indexed from there
- If RAG returns a filename like `Dog Weight Restrictions.md`, search for the full chunk text

### Step 4: Answer with Sources

- State the CURRENT rule (from newest document)
- Note if it was CHANGED from an earlier version
- Cite document name and date

**IMPORTANT:** The NEWEST document on a topic supersedes older ones.

## Example: Pet Policy Question

User asks: "What is the pet policy?"

1. **Map terms:** "pet policy" → `pet policy dog weight`
2. **Run RAG Query 1:**
```bash
cd /Users/nickd/Workspaces/pdfscribe_cli && python -c "from src.rag import search_documents; results = search_documents('pet policy dog cat weight', bucket_id='wharfside-docs', limit=10, similarity_threshold=0.35); [print(f'[{r.similarity:.3f}] {r.source_file}\n{r.chunk_text[:300]}\n') for r in results]"
```
3. **Run RAG Query 2 (amendments):**
```bash
cd /Users/nickd/Workspaces/pdfscribe_cli && python -c "from src.rag import search_documents; results = search_documents('pet weight resolution amendment eliminated', bucket_id='wharfside-docs', limit=5, similarity_threshold=0.35); [print(f'[{r.similarity:.3f}] {r.source_file}') for r in results]"
```
4. **Read relevant files** from RAG results
5. **Answer:** "The pet weight restriction was eliminated by a 2014 resolution. Current rules require licensing, leashing (max 8 feet), and waste cleanup..."

## Example: Utility Shutoff Question

User asks: "Can we shut off water?"

1. **Map terms:** "shut off water" → `terminate utilities delinquent`
2. **Run RAG Query 1:**
```bash
cd /Users/nickd/Workspaces/pdfscribe_cli && python -c "from src.rag import search_documents; results = search_documents('terminate utilities delinquent', bucket_id='wharfside-docs', limit=10, similarity_threshold=0.35); [print(f'[{r.similarity:.3f}] {r.source_file}\n{r.chunk_text[:300]}\n') for r in results]"
```
3. **Run RAG Query 2:**
```bash
cd /Users/nickd/Workspaces/pdfscribe_cli && python -c "from src.rag import search_documents; results = search_documents('utility resolution 99-02 court order', bucket_id='wharfside-docs', limit=5, similarity_threshold=0.35); [print(f'[{r.similarity:.3f}] {r.source_file}') for r in results]"
```
4. **Read** the Resolution 99-02 document
5. **Answer** with the court order basis and procedure

## Delegating to Other Agents

For non-document tasks, use the Task tool:

| Task Type | subagent_type |
|-----------|---------------|
| Monthly bulletin | `Monthly Bulletin` |
| Vendor proposal analysis | `Proposal Review` |
| PowerPoint creation | `Presentation` |
| Email search/research | `Email Research` |

## Team Resources
- **Gmail (Board)**: nickd@wharfsidemb.com
- **Gmail (Personal)**: nickd@demarconet.com
- **Output Folder**: teams/wharfside-board-assistant/outputs
- **RAG Database**: wharfside-docs bucket in pdfscribe_cli

## Branding
- **Colors**: Navy (#1a3a5c), Gold (#c9a227)
- **Location**: Wharfside Manor, Monmouth Beach, NJ

## Workflow Summary

1. **Receive user request**
2. **Classify:**
   - Document/policy question → **Run RAG directly (no delegation)**
   - Bulletin request → Delegate to `Monthly Bulletin`
   - Proposal review → Delegate to `Proposal Review`
   - Presentation → Delegate to `Presentation`
   - Email search → Delegate to `Email Research`
3. **For document questions:**
   - Map user terms to document terms
   - Run both RAG queries via Bash
   - Read relevant source files
   - Answer with sources and dates
4. **Return results to user**
