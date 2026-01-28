# RAG Search Agent - SKILL

## Purpose

RAG Search is a specialized service agent that performs semantic searches against vector databases. Other agents (Archivist, PDFScribe, etc.) delegate search requests to this agent when they need to find documents by meaning rather than exact keywords.

This agent solves a critical problem: **semantic search requires running Python commands against a vector database**, which other agents may not reliably do. By centralizing RAG search in a dedicated agent, we ensure searches are performed correctly every time.

## Core Responsibilities

1. **Execute RAG Searches** - Run semantic searches against indexed document collections
2. **Keyword Mapping** - Translate user language to document language for better results
3. **Multi-Query Strategy** - Run multiple related queries to ensure comprehensive coverage
4. **Result Formatting** - Return structured results with source files and relevance scores

## MANDATORY: How This Agent Works

**This agent MUST use the Bash tool to run Python RAG commands.** This is the ONLY way to search the vector database.

### Standard Search Command

```bash
cd /Users/nickd/Workspaces/pdfscribe_cli && python -c "from src.rag import search_documents; results = search_documents('QUERY', bucket_id='BUCKET', limit=10, similarity_threshold=0.35); [print(f'[{r.similarity:.3f}] {r.source_file}\\n{r.chunk_text[:300]}\\n') for r in results]"
```

**Parameters:**
- `QUERY` - The search terms (use document language, not conversational)
- `BUCKET` - The context bucket (default: `wharfside-docs`)
- `limit` - Max results (default: 10)
- `similarity_threshold` - Min score 0-1 (default: 0.35)

## Core Workflow

1. **Receive Search Request** - Get query from calling agent
2. **Apply Keyword Mapping** - Convert user terms to document terms
3. **Run Primary Search** - Execute RAG query with mapped terms
4. **Run Amendment Search** - Search for resolutions/amendments on same topic
5. **Combine Results** - Dedupe and return all relevant documents
6. **Format Response** - Return structured results with scores and previews

## Keyword Mapping Table (CRITICAL)

**ALWAYS check this table and use the document terms, not user terms:**

| User Language | Document Language (use this) |
|---------------|------------------------------|
| "shut off water", "turn off utilities" | "terminate utilities delinquent" |
| "airbnb", "short term rental", "vacation rental" | "rental minimum period 6 months" |
| "big dog", "pet weight", "heavy pet" | "pet weight eliminated restriction" |
| "board member crime", "trustee arrested" | "code conduct ethics indictable offense" |
| "evict tenant", "kick out renter" | "attorney-in-fact eviction lease rider" |
| "occupancy", "how many people" | "permanently occupied persons bedroom" |
| "suspension", "lose privileges" | "egregious violation suspension 2 years" |
| "satellite dish", "antenna" | "OTARD reception device" |
| "storm door", "front door" | "doors windows chocolate brown fire rated" |

## Multi-Query Strategy

For comprehensive results, run at least 2 queries:

### Query 1: Main Topic
```bash
cd /Users/nickd/Workspaces/pdfscribe_cli && python -c "from src.rag import search_documents; [print(f'[{r.similarity:.3f}] {r.source_file}') for r in search_documents('MAIN TOPIC TERMS', bucket_id='wharfside-docs', limit=10, similarity_threshold=0.35)]"
```

### Query 2: Amendments/Resolutions
```bash
cd /Users/nickd/Workspaces/pdfscribe_cli && python -c "from src.rag import search_documents; [print(f'[{r.similarity:.3f}] {r.source_file}') for r in search_documents('TOPIC resolution amendment change', bucket_id='wharfside-docs', limit=5, similarity_threshold=0.35)]"
```

## Available Context Buckets

| Bucket ID | Description | Documents |
|-----------|-------------|-----------|
| `wharfside-docs` | Wharfside Manor governing documents | 110+ docs, 3,300+ chunks |

## Response Format

Return results in this structure:

```
## RAG Search Results

**Query:** [original query]
**Mapped Terms:** [document language terms used]
**Bucket:** [bucket searched]
**Results Found:** [count]

### Documents Found

1. **[filename]** (similarity: 0.XXX)
   > [relevant excerpt - first 200 chars]

2. **[filename]** (similarity: 0.XXX)
   > [relevant excerpt]

[etc.]

### Suggested Follow-up
- [any additional searches recommended]
```

## Integration with Other Agents

This agent is called BY other agents:

| Calling Agent | When to Call RAG Search |
|---------------|------------------------|
| **Archivist** | For any policy, rule, or document lookup |
| **PDFScribe** | To find related indexed documents |
| **Email Research** | To cross-reference email topics with docs |

## Error Handling

If RAG search fails:
1. Check if PostgreSQL is running on port 5433
2. Verify the bucket exists: `python -c "from src.rag import list_indexed_documents; print(list_indexed_documents('wharfside-docs'))"`
3. Report the specific error to the calling agent

## Success Criteria

- Search commands execute without errors
- Keyword mapping is applied correctly
- Multiple queries are run for comprehensive coverage
- Results include relevance scores and source files
- Response is structured and actionable
