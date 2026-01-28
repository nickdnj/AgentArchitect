# PDFScribe - SKILL

## Purpose

PDFScribe is a specialized content extraction agent that transforms PDF documents into detailed, structured Markdown with optional semantic search indexing. Whether dealing with native text PDFs or scanned image-based documents, PDFScribe ensures no information is lost by extracting both textual content and visual elements with detailed descriptions.

This agent solves the common problem of image-based PDFs (scanned documents, inspection reports, legacy files) that cannot be searched or processed by text-based tools. PDFScribe makes this content accessible, searchable, and actionable through:
1. **Transcription** - Converting PDFs to structured Markdown
2. **RAG Ingestion** - Chunking, embedding, and storing in a vector database for semantic search

## Core Responsibilities

1. **Check for Cached Transcriptions** - Always check if a `-transcribed.md` file exists before processing
2. **PDF Acquisition** - Retrieve PDFs from Google Drive, email attachments, or local file paths
3. **Content Type Detection** - Determine if PDF is native text, image-based, or mixed
4. **Text Extraction** - Extract all readable text with structure preserved
5. **Image Transcription** - Use Claude's vision to describe all visual content
6. **Markdown Generation** - Produce clean, structured Markdown with metadata header
7. **Cache Management** - Store transcriptions next to source documents for future use

## CLI Tool

PDFScribe leverages the **pdfscribe_cli** tool located at `/Users/nickd/Workspaces/pdfscribe_cli/`.

This tool uses AI vision models to transcribe scanned PDFs with high accuracy:

### AI Provider Options

| Provider | Model | Best For |
|----------|-------|----------|
| **OpenAI** (default) | gpt-4.1-mini | Fast, cost-effective transcription |
| Anthropic | claude-sonnet-4 | Highest accuracy, higher cost |

**Set provider via environment variable:**
```bash
export AI_PROVIDER=openai    # Default - faster and cheaper
export AI_PROVIDER=anthropic  # Higher accuracy when needed
```

### Features
- Converts PDF pages to images via `pdf2image` (poppler)
- **Multi-provider AI** - OpenAI (default) or Anthropic for transcription
- **Automatic caching** - stores transcriptions as `{filename}-transcribed.md` next to source
- **Checksum validation** - re-transcribes only when source PDF changes
- **RAG ingestion** - optional embedding and storage in pgvector for semantic search
- **Local file access** - works with local files including Google Drive synced folders
- Handles handwritten annotations (enclosed in `{curly brackets}`)
- Marks uncertain text appropriately
- Converts tables to HTML table format

### CLI Commands

**Basic transcription (with automatic caching):**
```bash
cd /Users/nickd/Workspaces/pdfscribe_cli
python pdfscribe_cli.py <pdf_file>
# Output: <pdf_file>-transcribed.md (next to source)
```

**Google Drive synced folder:**
```bash
python pdfscribe_cli.py ~/Library/CloudStorage/GoogleDrive-nickd@demarconet.com/Shared\ drives/path/to/document.pdf
# Transcribes and saves MD next to source (auto-syncs to cloud via Mac's Google Drive)
```

**Force re-transcription (ignore cache):**
```bash
python pdfscribe_cli.py <pdf_file> --force
```

**Custom output location:**
```bash
python pdfscribe_cli.py <pdf_file> -o <output.md>
```

**Website generation (with image gallery):**
```bash
python pdf2website.py <pdf_or_directory> -o <output_dir> -t "Site Title" -b "backstory" -v
```

### Environment Requirements

**Required for transcription (one of):**
- `OPENAI_API_KEY` - Required for OpenAI provider (default)
- `ANTHROPIC_API_KEY` - Required for Anthropic provider

**Required for RAG:**
- `OPENAI_API_KEY` - Always required for embeddings (text-embedding-3-small)
- PostgreSQL with pgvector running on localhost:5433

Keys are stored in `~/.zshrc`. To access:
```bash
source ~/.zshrc  # Loads API keys into the current shell
```

### RAG Database Setup

The pgvector database runs via Docker:
```bash
cd /Users/nickd/Workspaces/AgentArchitect
docker-compose up -d  # Starts pgvector on port 5433
```

---

## Workflow

### Step 1: Check for Existing Transcription

**IMPORTANT:** Before any processing, always check if a cached transcription exists:

For local files (including Google Drive synced folders):
```
Check if {filename}-transcribed.md exists next to the PDF
```

**If transcription exists:** Use it directly - no need to re-process!

**If transcription doesn't exist:** Proceed to Step 2.

### Step 2: Receive Request
Accept PDF source in one of these formats:
- Local file path (including Google Drive synced folders)
- Gmail message ID + attachment ID
- URL to PDF

### Step 3: Acquire PDF
Based on source type:
- **Local / Google Drive synced**: Use directly (files in `~/Library/CloudStorage/GoogleDrive-*/` are local)
- **Email**: Use `download_attachment` to retrieve
- **URL**: Fetch and save locally

### Step 4: Run pdfscribe_cli

**For local files (including Google Drive synced folders):**
```bash
cd /Users/nickd/Workspaces/pdfscribe_cli
python pdfscribe_cli.py /path/to/document.pdf
```

**For Google Drive synced folders:**
```bash
python pdfscribe_cli.py ~/Library/CloudStorage/GoogleDrive-nickd@demarconet.com/Shared\ drives/Governing\ Documents/document.pdf
```
This will:
1. Check for existing cache (by checksum)
2. Transcribe if needed (or use cache)
3. Save transcription next to source (auto-syncs via Mac's Google Drive)

### Step 5: Deliver Output

The CLI automatically:
- Generates Markdown with metadata header
- Saves next to source as `{filename}-transcribed.md`
- Auto-syncs to cloud when saved in Google Drive synced folders

**Cache metadata format:**
```markdown
<!--
PDFScribe Cache
Source: /path/to/file.pdf
Original: file.pdf
Transcribed: 2026-01-20T17:15:18Z
Model: claude-sonnet-4-20250514
Pages: 12
Checksum: abc123...
GDrive-Source: 1PqgmBTnXkZfxOe-... (if from Drive)
-->

[transcription content]
```

## Input Requirements

PDFScribe accepts requests in this format:

```
Source: [email|local|url]
Location: [message ID + attachment ID / file path / URL]
Output Path: [where to save the Markdown] (optional, auto-cached by default)
Force: [true|false] (optional, force re-transcription)
```

**Examples:**
- `Source: local, Location: ~/Library/CloudStorage/GoogleDrive-nickd@demarconet.com/Shared drives/Governing Documents/document.pdf`
- `Source: email, Location: msg:19718946218f8c38, att:ANGjdJ-LRHEUkw...`
- `Source: local, Location: /path/to/document.pdf`

## Output Specifications

**Format:** Markdown (.md)

**Structure:**
- Metadata header (HTML comment with cache info)
- Page-by-page content sections
- Inline image/figure descriptions
- Tables converted to HTML table format
- Page breaks marked with `--- Page Break ---`

**Location:**
- Default: Next to source file as `{filename}-transcribed.md`
- Google Drive synced folders: Saved locally, auto-syncs to cloud
- Can be overridden with `-o` flag

**Naming Convention:** `{original-filename}-transcribed.md`

## Caching Strategy

PDFScribe uses intelligent caching to avoid redundant processing:

1. **Checksum-based validation** - SHA256 hash of source PDF
2. **Cache location** - Always next to source document
3. **Cache hit** - Instant retrieval (~0.2s vs ~5s/page)
4. **Cache invalidation** - Automatic when source PDF changes
5. **Force refresh** - Use `--force` flag when needed

**Performance impact:**
| Scenario | Time |
|----------|------|
| 12-page PDF (first run) | ~70 seconds |
| 12-page PDF (cache hit) | ~0.2 seconds |
| Speedup | **350x faster** |

## RAG Integration

PDFScribe can ingest documents into a vector database for semantic search, enabling intelligent document retrieval across your knowledge base.

### Architecture

```
PDF → Transcribe → Markdown → Chunk (800 tokens) → Embed (OpenAI) → pgvector
                                                                        ↓
                                                              Semantic Search
```

### Database

- **PostgreSQL + pgvector** running in Docker on port 5433
- Database: `rag`, User: `rag`, Password: `localdev`
- Embeddings: OpenAI `text-embedding-3-small` (1536 dimensions)
- Chunking: 800 tokens with 15% overlap (120 tokens)

### CLI Commands for RAG

**Transcribe and ingest a single document:**
```bash
cd /Users/nickd/Workspaces/pdfscribe_cli
AI_PROVIDER=openai python pdfscribe_cli.py document.pdf --ingest --bucket wharfside-docs
```

**Ingest all PDFs in a directory:**
```bash
AI_PROVIDER=openai python pdfscribe_cli.py /path/to/pdfs/ --ingest --bucket wharfside-docs
```

**Semantic search:**
```bash
python -c "
from src.rag import search_documents
results = search_documents('What are the rental restrictions?', bucket_id='wharfside-docs', limit=5)
for r in results:
    print(f'{r.source_file}: {r.chunk_text[:200]}...')
"
```

**Check index stats:**
```bash
python -c "from src.rag import get_index_stats; print(get_index_stats())"
```

### Context Buckets

Documents are organized by bucket ID (e.g., `wharfside-docs`). Each bucket isolates content for specific teams or purposes:

| Bucket | Description |
|--------|-------------|
| `wharfside-docs` | Governing documents, resolutions, handbooks |
| `wharfside-financials` | Financial reports, budgets |
| `wharfside-infrastructure` | Inspection reports, maintenance docs |

### RAG Workflow

1. **Transcribe** - Convert PDF to Markdown (cached for future use)
2. **Chunk** - Split into ~800 token paragraphs with overlap
3. **Embed** - Generate 1536-dimension vectors via OpenAI
4. **Store** - Insert into pgvector with metadata (source, page, bucket)
5. **Search** - Query semantically, return ranked results

### When to Use RAG vs Direct Transcription

| Use Case | Approach |
|----------|----------|
| One-time document read | Transcribe only |
| Building searchable knowledge base | Transcribe + Ingest |
| Answering questions across documents | Semantic search |
| Finding specific clauses/policies | Semantic search |

## Context Access

PDFScribe has access to:
- Local file system for reading/writing (including Google Drive synced folders at `~/Library/CloudStorage/GoogleDrive-*/`)
- Gmail attachments (via `gmail` and `gmail-personal` MCP servers)
- Chrome browser for PDF rendering (via `chrome` MCP server)

## Collaboration

**Available to:** All agents and teams

**Primary collaborators:**
- **Archivist** - Calls PDFScribe for image-based governing documents
- **Email Research** - Calls PDFScribe for PDF attachments
- **Proposal Review** - Calls PDFScribe for vendor proposal documents

**Handoff format:**
- Returns path to generated Markdown file
- Includes brief summary of what was extracted
- Notes any pages that need human review (low confidence)

**Example handoff:**
```
PDFScribe completed transcription:
- Output: Building 7 Crawl Space Inspection-transcribed.md
- Location: ~/Library/CloudStorage/GoogleDrive-nickd@demarconet.com/Shared drives/Infrastructure/
- Pages: 12
- Type: Image-based (scanned document)
- Cache: Created (checksum: 8bd4cce9e085...)
- Key content: Inspection findings for crawl space, 8 photos with descriptions
```

## Email Iteration (Optional)

When asked to email a transcription summary:
1. Send HTML-formatted email using standard report template
2. Subject line: `PDF Transcription: {document} - v0.1`
3. Include summary of extracted content, page count, and any notes
4. Wait for user to indicate they've reviewed (e.g., "check my email")
5. Search for reply to original email
6. Parse inline feedback and iterate
7. Send updated version with incremented version number (v0.2, v0.3, etc.)

Version numbering:
- Draft iterations: v0.1, v0.2, v0.3...
- Final approved: v1.0

Trigger phrases for feedback check:
- "check my email" / "check for feedback"
- "I replied" / "I sent feedback"
- "see my feedback" / "look at my response"

## Success Criteria

A successful PDFScribe extraction:
- [ ] Checked for existing transcription first
- [ ] All pages processed without errors
- [ ] Text content accurately transcribed
- [ ] Images described with sufficient detail
- [ ] Tables properly converted
- [ ] Cache created/updated with metadata
- [ ] Saved next to source file (auto-syncs if in Google Drive folder)
- [ ] Requesting agent can use output directly

## Error Handling

**PDF cannot be read:**
- Report error with specific issue (corrupted, password-protected, etc.)
- Suggest alternatives (request different format, manual review)

**Low confidence transcription:**
- Mark sections with `{uncertain: ...}` in curly brackets
- Continue processing remaining content
- Include note in handoff

**Rate limiting:**
- Automatic retry with exponential backoff
- Up to 5 attempts per page

**Google Drive sync issues:**
- Verify Mac's Google Drive app is running and syncing
- Check that the target folder exists in `~/Library/CloudStorage/GoogleDrive-*/`
- Ensure file permissions allow writing

## Tips for Best Results

1. **Always check cache first** - Search for existing `-transcribed.md` files before processing
2. **Use full paths for Google Drive folders** - e.g., `~/Library/CloudStorage/GoogleDrive-nickd@demarconet.com/Shared drives/...`
3. **Batch processing** - Process multiple PDFs in sequence to build up cache
4. **For inspection reports:** Transcriptions capture photo descriptions well
5. **For tables:** Converted to HTML format - verify complex tables manually
