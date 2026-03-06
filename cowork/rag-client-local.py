#!/usr/bin/env python3
"""
Local RAG Client for Cowork

Queries the local SQLite RAG database directly — no cloud API needed.
Same CLI interface as rag-client.py but uses ~/.wharfside/rag.db with sqlite-vec.

Usage:
  python AgentArchitect/cowork/rag-client-local.py search "parking rules" --bucket wharfside-docs
  python AgentArchitect/cowork/rag-client-local.py search "board meeting" --limit 5
  python AgentArchitect/cowork/rag-client-local.py buckets
  python AgentArchitect/cowork/rag-client-local.py stats

Requirements: sqlite-vec, openai (for embeddings)
"""

import json
import os
import sqlite3
import struct
import sys

import requests
import sqlite_vec

# ============================================================================
# Configuration
# ============================================================================

DB_PATH = os.getenv("RAG_DB_PATH", os.path.join(os.path.expanduser("~"), ".wharfside", "rag.db"))
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
EMBEDDING_DIMENSION = 1536

DEFAULT_LIMIT = 10
DEFAULT_THRESHOLD = 0.35


# ============================================================================
# Helpers
# ============================================================================

def get_connection():
    """Get a SQLite connection with sqlite-vec loaded."""
    if not os.path.exists(DB_PATH):
        print(f"ERROR: RAG database not found at {DB_PATH}", file=sys.stderr)
        print("Run ingestion first: cd ~/Workspaces/pdfscribe_cli && RAG_BACKEND=sqlite python ingest_all_buckets.py", file=sys.stderr)
        sys.exit(1)
    conn = sqlite3.connect(DB_PATH)
    conn.enable_load_extension(True)
    sqlite_vec.load(conn)
    conn.enable_load_extension(False)
    return conn


def get_embedding(text):
    """Get embedding vector from OpenAI API."""
    if not OPENAI_API_KEY:
        print("ERROR: OPENAI_API_KEY not set.", file=sys.stderr)
        sys.exit(1)

    resp = requests.post(
        "https://api.openai.com/v1/embeddings",
        headers={"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"},
        json={"model": EMBEDDING_MODEL, "input": text},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()["data"][0]["embedding"]


def serialize_float32(vec):
    """Serialize a float list to bytes for sqlite-vec."""
    return struct.pack(f"{len(vec)}f", *vec)


# ============================================================================
# Commands
# ============================================================================

def search(query, bucket=None, limit=DEFAULT_LIMIT, threshold=DEFAULT_THRESHOLD):
    """Search the local RAG database."""
    conn = get_connection()
    query_embedding = get_embedding(query)
    query_bytes = serialize_float32(query_embedding)

    # sqlite-vec cosine distance: 0 = identical, 2 = opposite
    sql = """
        SELECT
            e.id,
            e.bucket_id,
            e.source_file,
            e.chunk_index,
            e.chunk_text,
            v.distance
        FROM vec_embeddings v
        JOIN embeddings e ON e.id = v.rowid
        WHERE v.embedding MATCH ?
          AND k = ?
    """
    params = [query_bytes, limit * 3]  # fetch extra to filter

    rows = conn.execute(sql, params).fetchall()

    # Filter by bucket and threshold, then limit
    results = []
    for row in rows:
        _, bucket_id, source_file, chunk_index, chunk_text, distance = row
        similarity = 1 - (distance / 2)
        if similarity < threshold:
            continue
        if bucket and bucket_id != bucket:
            continue
        results.append({
            "bucket_id": bucket_id,
            "source_file": source_file,
            "chunk_index": chunk_index,
            "chunk_text": chunk_text,
            "similarity": similarity,
        })
        if len(results) >= limit:
            break

    conn.close()

    if not results:
        print(f"No results found for: {query}")
        if bucket:
            print(f"  (bucket: {bucket})")
        return

    print(f"## RAG Search Results: \"{query}\"")
    if bucket:
        print(f"**Bucket:** {bucket}")
    print(f"**Results:** {len(results)}\n")

    for i, item in enumerate(results, 1):
        print(f"### Result {i} [{item['similarity']:.3f}]")
        print(f"**Source:** {item['source_file']}")
        print(f"**Bucket:** {item['bucket_id']}")
        text = item["chunk_text"]
        print(f"\n{text[:800]}")
        if len(text) > 800:
            print(f"\n... ({len(text)} chars total)")
        print()


def list_buckets():
    """List available RAG buckets."""
    conn = get_connection()
    rows = conn.execute("""
        SELECT bucket_id, COUNT(*) as doc_count,
               (SELECT COUNT(*) FROM embeddings e2 WHERE e2.bucket_id = d.bucket_id) as chunk_count
        FROM indexed_documents d
        GROUP BY bucket_id
        ORDER BY bucket_id
    """).fetchall()
    conn.close()

    print("## Available RAG Buckets\n")
    for bucket_id, doc_count, chunk_count in rows:
        print(f"- **{bucket_id}** -- {doc_count} documents, {chunk_count} chunks")


def stats():
    """Get RAG database statistics."""
    conn = get_connection()
    docs = conn.execute("SELECT COUNT(*) FROM indexed_documents").fetchone()[0]
    chunks = conn.execute("SELECT COUNT(*) FROM embeddings").fetchone()[0]
    tokens = conn.execute("SELECT COALESCE(SUM(total_tokens), 0) FROM indexed_documents").fetchone()[0]

    rows = conn.execute("""
        SELECT bucket_id, COUNT(*) FROM indexed_documents GROUP BY bucket_id ORDER BY bucket_id
    """).fetchall()
    conn.close()

    by_bucket = {r[0]: r[1] for r in rows}

    print("## RAG Database Statistics\n")
    print(f"**Backend:** sqlite (local)")
    print(f"**Database:** {DB_PATH}")
    print(f"**Documents:** {docs}")
    print(f"**Chunks:** {chunks}")
    print(f"**Tokens:** {tokens}")
    print(f"**Buckets:** {json.dumps(by_bucket, indent=2)}")


# ============================================================================
# CLI
# ============================================================================

def print_usage():
    print("""
Local RAG Client for Cowork

Usage:
  python rag-client-local.py search <query> [--bucket <id>] [--limit <n>] [--threshold <t>]
  python rag-client-local.py buckets
  python rag-client-local.py stats

Examples:
  python rag-client-local.py search "parking rules" --bucket wharfside-docs
  python rag-client-local.py search "board meeting minutes" --limit 5
  python rag-client-local.py search "Altium deployment checklist" --bucket altium-playbook
  python rag-client-local.py buckets
""")


def main():
    if len(sys.argv) < 2:
        print_usage()
        sys.exit(1)

    command = sys.argv[1]

    if command == "search":
        if len(sys.argv) < 3:
            print("ERROR: search requires a query string", file=sys.stderr)
            sys.exit(1)

        query = sys.argv[2]
        bucket = None
        limit = DEFAULT_LIMIT
        threshold = DEFAULT_THRESHOLD

        i = 3
        while i < len(sys.argv):
            if sys.argv[i] == "--bucket" and i + 1 < len(sys.argv):
                bucket = sys.argv[i + 1]
                i += 2
            elif sys.argv[i] == "--limit" and i + 1 < len(sys.argv):
                limit = int(sys.argv[i + 1])
                i += 2
            elif sys.argv[i] == "--threshold" and i + 1 < len(sys.argv):
                threshold = float(sys.argv[i + 1])
                i += 2
            else:
                query += " " + sys.argv[i]
                i += 1

        search(query, bucket=bucket, limit=limit, threshold=threshold)

    elif command == "buckets":
        list_buckets()

    elif command == "stats":
        stats()

    else:
        print(f"Unknown command: {command}", file=sys.stderr)
        print_usage()
        sys.exit(1)


if __name__ == "__main__":
    main()
