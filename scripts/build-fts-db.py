#!/usr/bin/env python3
"""
FTS5 Database Builder for Offline RAG Search

Builds a SQLite FTS5 full-text search database from context bucket files.
Zero external dependencies — uses only Python stdlib.

Output: AgentArchitect/data/rag-fts.db

Usage:
    python scripts/build-fts-db.py                     # Build all buckets
    python scripts/build-fts-db.py --bucket wharfside-docs  # Single bucket
    python scripts/build-fts-db.py --force             # Re-index everything
    python scripts/build-fts-db.py --dry-run           # Preview only
"""

import hashlib
import json
import re
import sqlite3
import subprocess
import sys
import xml.etree.ElementTree as ET
import zipfile
from html.parser import HTMLParser
from pathlib import Path

# ============================================================================
# Configuration
# ============================================================================

SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
BUCKETS_DIR = PROJECT_DIR / "context-buckets"
DATA_DIR = PROJECT_DIR / "data"
DB_PATH = DATA_DIR / "rag-fts.db"

CHUNK_SIZE = 800  # tokens (approximate)
CHUNK_OVERLAP = 120  # ~15% overlap

SKIP_FILES = {"home.html", "index.html", ".DS_Store"}
INGESTABLE_EXTENSIONS = {".html", ".md", ".txt", ".pdf", ".docx"}


# ============================================================================
# HTML Text Extraction (from ingest_all_buckets.py)
# ============================================================================

class HTMLTextExtractor(HTMLParser):
    """Extract plain text from HTML, preserving paragraph breaks."""
    def __init__(self):
        super().__init__()
        self.result = []
        self.skip_tags = {"script", "style", "head"}
        self._skip_depth = 0

    def handle_starttag(self, tag, attrs):
        if tag in self.skip_tags:
            self._skip_depth += 1
        if tag in ("p", "br", "div", "h1", "h2", "h3", "h4", "h5", "h6", "li", "tr"):
            self.result.append("\n\n")

    def handle_endtag(self, tag):
        if tag in self.skip_tags:
            self._skip_depth -= 1

    def handle_data(self, data):
        if self._skip_depth == 0:
            self.result.append(data)

    def get_text(self):
        text = "".join(self.result)
        text = re.sub(r'\n{3,}', '\n\n', text)
        text = re.sub(r'[ \t]+', ' ', text)
        return text.strip()


def extract_html_text(filepath):
    """Extract text content from an HTML file."""
    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
        html = f.read()
    parser = HTMLTextExtractor()
    parser.feed(html)
    return parser.get_text()


# ============================================================================
# Text Chunking (adapted from pdfscribe_cli/src/rag.py)
# ============================================================================

def estimate_tokens(text):
    """Estimate token count (~4 chars per token)."""
    return len(text) // 4


def chunk_text(text, chunk_size=CHUNK_SIZE, overlap=CHUNK_OVERLAP):
    """
    Split text into overlapping chunks of approximately chunk_size tokens.
    Tries to split on paragraph or sentence boundaries when possible.
    Returns list of dicts with 'text' and 'chunk_index'.
    """
    chunks = []

    # Split by page breaks if present
    pages = text.split("--- Page Break ---")

    chunk_index = 0
    for page_text in pages:
        page_text = page_text.strip()
        if not page_text:
            continue

        paragraphs = re.split(r'\n\s*\n', page_text)

        current_chunk = []
        current_tokens = 0

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue

            para_tokens = estimate_tokens(para)

            if para_tokens > chunk_size:
                sentences = re.split(r'(?<=[.!?])\s+', para)
                for sent in sentences:
                    sent_tokens = estimate_tokens(sent)
                    if current_tokens + sent_tokens > chunk_size and current_chunk:
                        chunk_text_content = ' '.join(current_chunk)
                        chunks.append({"text": chunk_text_content, "chunk_index": chunk_index})
                        chunk_index += 1

                        overlap_tokens = 0
                        overlap_content = []
                        for item in reversed(current_chunk):
                            item_tokens = estimate_tokens(item)
                            if overlap_tokens + item_tokens <= overlap:
                                overlap_content.insert(0, item)
                                overlap_tokens += item_tokens
                            else:
                                break
                        current_chunk = overlap_content
                        current_tokens = overlap_tokens

                    current_chunk.append(sent)
                    current_tokens += sent_tokens
            else:
                if current_tokens + para_tokens > chunk_size and current_chunk:
                    chunk_text_content = '\n\n'.join(current_chunk)
                    chunks.append({"text": chunk_text_content, "chunk_index": chunk_index})
                    chunk_index += 1

                    overlap_tokens = 0
                    overlap_content = []
                    for item in reversed(current_chunk):
                        item_tokens = estimate_tokens(item)
                        if overlap_tokens + item_tokens <= overlap:
                            overlap_content.insert(0, item)
                            overlap_tokens += item_tokens
                        else:
                            break
                    current_chunk = overlap_content
                    current_tokens = overlap_tokens

                current_chunk.append(para)
                current_tokens += para_tokens

        if current_chunk:
            chunk_text_content = '\n\n'.join(current_chunk)
            chunks.append({"text": chunk_text_content, "chunk_index": chunk_index})
            chunk_index += 1

    return chunks


# ============================================================================
# File Discovery
# ============================================================================

def compute_file_checksum(filepath):
    """Compute SHA256 checksum of a file."""
    h = hashlib.sha256()
    with open(filepath, 'rb') as f:
        for block in iter(lambda: f.read(8192), b''):
            h.update(block)
    return h.hexdigest()


def discover_buckets(target_bucket=None):
    """Discover all context buckets with bucket.json."""
    buckets = []
    if not BUCKETS_DIR.exists():
        print(f"ERROR: Buckets directory not found: {BUCKETS_DIR}", file=sys.stderr)
        return buckets

    for entry in sorted(BUCKETS_DIR.iterdir()):
        if not entry.is_dir() or entry.name.startswith('_'):
            continue
        if target_bucket and entry.name != target_bucket:
            continue
        bucket_json = entry / "bucket.json"
        if bucket_json.exists():
            with open(bucket_json) as f:
                config = json.load(f)
            buckets.append({
                "id": config.get("id", entry.name),
                "name": config.get("name", entry.name),
                "path": entry,
                "files_dir": entry / "files",
            })
    return buckets


def collect_files(files_dir):
    """Recursively collect ingestable files from a directory."""
    files = []
    if not files_dir.exists():
        return files
    for filepath in sorted(files_dir.rglob("*")):
        if not filepath.is_file():
            continue
        if filepath.name in SKIP_FILES:
            continue
        if filepath.suffix.lower() in INGESTABLE_EXTENSIONS:
            files.append(filepath)
    return files


def extract_pdf_text(filepath):
    """Extract text from a PDF using pdftotext (poppler)."""
    try:
        result = subprocess.run(
            ["pdftotext", "-layout", str(filepath), "-"],
            capture_output=True, text=True, timeout=30
        )
        if result.returncode == 0:
            return result.stdout
        print(f"    [WARN] pdftotext failed for {filepath.name}: {result.stderr.strip()}", file=sys.stderr)
        return None
    except FileNotFoundError:
        print("    [WARN] pdftotext not found — install poppler: brew install poppler", file=sys.stderr)
        return None


def extract_docx_text(filepath):
    """Extract text from a DOCX file using stdlib zipfile + xml parsing."""
    WORD_NS = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
    try:
        with zipfile.ZipFile(filepath) as zf:
            xml_content = zf.read("word/document.xml")
        root = ET.fromstring(xml_content)
        paragraphs = []
        for para in root.iter(f"{WORD_NS}p"):
            texts = [t.text for t in para.iter(f"{WORD_NS}t") if t.text]
            if texts:
                paragraphs.append("".join(texts))
        return "\n\n".join(paragraphs)
    except (zipfile.BadZipFile, KeyError, ET.ParseError) as e:
        print(f"    [WARN] Failed to extract DOCX {filepath.name}: {e}", file=sys.stderr)
        return None


def extract_text(filepath):
    """Extract text from a file based on its extension."""
    ext = filepath.suffix.lower()
    if ext == '.html':
        return extract_html_text(filepath)
    elif ext in ('.md', '.txt'):
        return filepath.read_text(encoding='utf-8', errors='replace')
    elif ext == '.pdf':
        return extract_pdf_text(filepath)
    elif ext == '.docx':
        return extract_docx_text(filepath)
    return None


def friendly_name(filepath, files_dir):
    """Create a friendly source name relative to the files directory."""
    try:
        return str(filepath.relative_to(files_dir))
    except ValueError:
        return filepath.name


# ============================================================================
# Database Schema
# ============================================================================

def init_db(conn):
    """Initialize the FTS5 database schema."""
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bucket_id TEXT NOT NULL,
            source_file TEXT NOT NULL,
            file_checksum TEXT NOT NULL,
            chunk_count INTEGER DEFAULT 0,
            total_tokens INTEGER DEFAULT 0,
            indexed_at TEXT NOT NULL,
            UNIQUE(bucket_id, source_file)
        );

        CREATE TABLE IF NOT EXISTS chunks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bucket_id TEXT NOT NULL,
            source_file TEXT NOT NULL,
            chunk_index INTEGER NOT NULL,
            chunk_text TEXT NOT NULL
        );

        CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
            chunk_text,
            content='chunks',
            content_rowid='id',
            tokenize='porter unicode61'
        );

        -- Triggers to keep FTS5 in sync
        CREATE TRIGGER IF NOT EXISTS chunks_ai AFTER INSERT ON chunks BEGIN
            INSERT INTO chunks_fts(rowid, chunk_text) VALUES (new.id, new.chunk_text);
        END;

        CREATE TRIGGER IF NOT EXISTS chunks_ad AFTER DELETE ON chunks BEGIN
            INSERT INTO chunks_fts(chunks_fts, rowid, chunk_text)
                VALUES('delete', old.id, old.chunk_text);
        END;

        CREATE TRIGGER IF NOT EXISTS chunks_au AFTER UPDATE ON chunks BEGIN
            INSERT INTO chunks_fts(chunks_fts, rowid, chunk_text)
                VALUES('delete', old.id, old.chunk_text);
            INSERT INTO chunks_fts(rowid, chunk_text) VALUES (new.id, new.chunk_text);
        END;

        CREATE INDEX IF NOT EXISTS idx_chunks_bucket ON chunks(bucket_id);
        CREATE INDEX IF NOT EXISTS idx_chunks_source ON chunks(bucket_id, source_file);
        CREATE INDEX IF NOT EXISTS idx_documents_bucket ON documents(bucket_id);
    """)


# ============================================================================
# Ingestion
# ============================================================================

def remove_document(conn, bucket_id, source_file):
    """Remove a document and its chunks from the database."""
    conn.execute("DELETE FROM chunks WHERE bucket_id = ? AND source_file = ?",
                 (bucket_id, source_file))
    conn.execute("DELETE FROM documents WHERE bucket_id = ? AND source_file = ?",
                 (bucket_id, source_file))


def ingest_file(conn, bucket_id, filepath, files_dir, force=False):
    """Ingest a single file into the FTS5 database. Returns status string."""
    source_file = friendly_name(filepath, files_dir)
    checksum = compute_file_checksum(filepath)

    # Check if already indexed with same checksum
    if not force:
        row = conn.execute(
            "SELECT file_checksum FROM documents WHERE bucket_id = ? AND source_file = ?",
            (bucket_id, source_file)
        ).fetchone()
        if row and row[0] == checksum:
            return "skipped"

    # Extract text
    text = extract_text(filepath)
    if not text or len(text.strip()) < 50:
        return "too_short"

    # Remove old data if re-indexing
    remove_document(conn, bucket_id, source_file)

    # Chunk the text
    chunks = chunk_text(text)
    if not chunks:
        return "no_chunks"

    total_tokens = estimate_tokens(text)

    # Insert document record
    conn.execute(
        "INSERT INTO documents (bucket_id, source_file, file_checksum, chunk_count, total_tokens, indexed_at) "
        "VALUES (?, ?, ?, ?, ?, datetime('now'))",
        (bucket_id, source_file, checksum, len(chunks), total_tokens)
    )

    # Insert chunks (triggers will update FTS5)
    for chunk in chunks:
        conn.execute(
            "INSERT INTO chunks (bucket_id, source_file, chunk_index, chunk_text) VALUES (?, ?, ?, ?)",
            (bucket_id, source_file, chunk["chunk_index"], chunk["text"])
        )

    return "ok"


def ingest_bucket(conn, bucket, force=False, dry_run=False):
    """Ingest all files from a single bucket."""
    bucket_id = bucket["id"]
    files_dir = bucket["files_dir"]
    files = collect_files(files_dir)

    if not files:
        print(f"  No ingestable files found")
        return {"ok": 0, "skipped": 0, "errors": 0}

    print(f"  Found {len(files)} files")
    stats = {"ok": 0, "skipped": 0, "errors": 0}

    for filepath in files:
        source = friendly_name(filepath, files_dir)
        if dry_run:
            print(f"    [DRY] {source} ({filepath.suffix})")
            continue

        try:
            status = ingest_file(conn, bucket_id, filepath, files_dir, force=force)
            if status == "ok":
                stats["ok"] += 1
                print(f"    [OK] {source}")
            elif status == "skipped":
                stats["skipped"] += 1
                print(f"    [SKIP] {source} (unchanged)")
            elif status == "too_short":
                stats["skipped"] += 1
                print(f"    [SKIP] {source} (too short)")
            else:
                stats["skipped"] += 1
                print(f"    [SKIP] {source} ({status})")
        except Exception as e:
            stats["errors"] += 1
            print(f"    [ERR] {source}: {e}", file=sys.stderr)

    return stats


# ============================================================================
# CLI
# ============================================================================

def main():
    target_bucket = None
    force = False
    dry_run = False

    i = 1
    while i < len(sys.argv):
        arg = sys.argv[i]
        if arg == "--bucket" and i + 1 < len(sys.argv):
            target_bucket = sys.argv[i + 1]
            i += 2
        elif arg == "--force":
            force = True
            i += 1
        elif arg == "--dry-run":
            dry_run = True
            i += 1
        elif arg in ("-h", "--help"):
            print(__doc__)
            sys.exit(0)
        else:
            print(f"Unknown argument: {arg}", file=sys.stderr)
            sys.exit(1)

    # Discover buckets
    buckets = discover_buckets(target_bucket)
    if not buckets:
        if target_bucket:
            print(f"ERROR: Bucket '{target_bucket}' not found in {BUCKETS_DIR}", file=sys.stderr)
        else:
            print(f"ERROR: No buckets found in {BUCKETS_DIR}", file=sys.stderr)
        sys.exit(1)

    print(f"\nFTS5 Database Builder")
    print("=" * 50)
    print(f"Output: {DB_PATH}")
    print(f"Buckets: {len(buckets)}")
    if force:
        print("Mode: FORCE (re-index all)")
    if dry_run:
        print("Mode: DRY RUN (no changes)")
    print()

    # Ensure data directory exists
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    # Open database
    conn = sqlite3.connect(str(DB_PATH))
    init_db(conn)

    total_ok = 0
    total_skipped = 0
    total_errors = 0

    for bucket in buckets:
        print(f"[{bucket['id']}] {bucket['name']}")
        stats = ingest_bucket(conn, bucket, force=force, dry_run=dry_run)
        total_ok += stats["ok"]
        total_skipped += stats["skipped"]
        total_errors += stats["errors"]
        if not dry_run:
            conn.commit()
        print()

    conn.close()

    # Summary
    print("=" * 50)
    print(f"Summary: {total_ok} indexed, {total_skipped} skipped, {total_errors} errors")
    print(f"Database: {DB_PATH}")

    if total_errors > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
