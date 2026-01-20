# PDFScribe - SKILL

## Purpose

PDFScribe is a specialized content extraction agent that transforms PDF documents into detailed, structured Markdown. Whether dealing with native text PDFs or scanned image-based documents, PDFScribe ensures no information is lost by extracting both textual content and visual elements with detailed descriptions.

This agent solves the common problem of image-based PDFs (scanned documents, inspection reports, legacy files) that cannot be searched or processed by text-based tools. PDFScribe makes this content accessible and actionable.

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

This tool uses **Claude Sonnet 4** vision to transcribe scanned PDFs with high accuracy:
- Converts PDF pages to images via `pdf2image` (poppler)
- Sends images to Anthropic API for transcription
- **Automatic caching** - stores transcriptions as `{filename}-transcribed.md` next to source
- **Checksum validation** - re-transcribes only when source PDF changes
- **Google Drive integration** - download PDFs and upload transcriptions
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

**Google Drive workflow (download → transcribe → upload):**
```bash
python pdfscribe_cli.py --gdrive <FILE_ID>
# Downloads PDF, transcribes, uploads MD next to source in Drive
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

Requires `ANTHROPIC_API_KEY` environment variable set.

---

## Workflow

### Step 1: Check for Existing Transcription

**IMPORTANT:** Before any processing, always check if a cached transcription exists:

For Google Drive files:
```
Search for: "{filename}-transcribed.md" in the same folder as the PDF
```

For local files:
```
Check if {filename}-transcribed.md exists next to the PDF
```

**If transcription exists:** Use it directly - no need to re-process!

**If transcription doesn't exist:** Proceed to Step 2.

### Step 2: Receive Request
Accept PDF source in one of these formats:
- Google Drive file ID
- Gmail message ID + attachment ID
- Local file path
- URL to PDF

### Step 3: Acquire PDF
Based on source type:
- **Google Drive**: Use `--gdrive FILE_ID` flag (handles download + upload automatically)
- **Email**: Use `download_attachment` to retrieve
- **Local**: Use directly
- **URL**: Fetch and save locally

### Step 4: Run pdfscribe_cli

**Preferred method (Google Drive source):**
```bash
cd /Users/nickd/Workspaces/pdfscribe_cli
python pdfscribe_cli.py --gdrive <FILE_ID>
```
This will:
1. Download the PDF from Google Drive
2. Check for existing cache (by checksum)
3. Transcribe if needed (or use cache)
4. Upload the transcription MD back to Google Drive

**For local files:**
```bash
python pdfscribe_cli.py /path/to/document.pdf
```

### Step 5: Deliver Output

The CLI automatically:
- Generates Markdown with metadata header
- Saves next to source as `{filename}-transcribed.md`
- Uploads to Google Drive (when using `--gdrive`)

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
Source: [gdrive|email|local|url]
Location: [file ID / message ID + attachment ID / file path / URL]
Output Path: [where to save the Markdown] (optional, auto-cached by default)
Force: [true|false] (optional, force re-transcription)
```

**Examples:**
- `Source: gdrive, Location: 1xtoBO7vjnOfNoXmdDn7w3sg-Ds1zHmdt`
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
- Google Drive: Uploaded to same folder as source PDF
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

## Context Access

PDFScribe has access to:
- Google Drive (via `gdrive` MCP server) - download and upload
- Gmail attachments (via `gmail` and `gmail-personal` MCP servers)
- Chrome browser for PDF rendering (via `chrome` MCP server)
- Local file system for reading/writing

## Collaboration

**Available to:** All agents and teams

**Primary collaborators:**
- **Archivist** - Calls PDFScribe for image-based governing documents
- **Email Research** - Calls PDFScribe for PDF attachments
- **Proposal Review** - Calls PDFScribe for vendor proposal documents

**Handoff format:**
- Returns path to generated Markdown file (local and/or Google Drive)
- Includes brief summary of what was extracted
- Notes any pages that need human review (low confidence)

**Example handoff:**
```
PDFScribe completed transcription:
- Output: Building 7 Crawl Space Inspection-transcribed.md
- Google Drive: Uploaded next to source PDF
- Pages: 12
- Type: Image-based (scanned document)
- Cache: Created (checksum: 8bd4cce9e085...)
- Key content: Inspection findings for crawl space, 8 photos with descriptions
```

## Success Criteria

A successful PDFScribe extraction:
- [ ] Checked for existing transcription first
- [ ] All pages processed without errors
- [ ] Text content accurately transcribed
- [ ] Images described with sufficient detail
- [ ] Tables properly converted
- [ ] Cache created/updated with metadata
- [ ] Uploaded to Google Drive (if source was from Drive)
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

**Google Drive permission errors:**
- Check credentials have write access
- Run `setup_gdrive_auth.py` to re-authenticate if needed

## Tips for Best Results

1. **Always check cache first** - Search for existing `-transcribed.md` files before processing
2. **Use `--gdrive` flag** - Handles the full workflow automatically
3. **Batch processing** - Process multiple PDFs in sequence to build up cache
4. **For inspection reports:** Transcriptions capture photo descriptions well
5. **For tables:** Converted to HTML format - verify complex tables manually
