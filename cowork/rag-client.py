#!/usr/bin/env python3
"""
RAG API Client for Cowork

Lightweight client that calls the Cloud Run RAG API for semantic search.
Used by Cowork agent specialists to query the shared vector database.

Usage:
  python AgentArchitect/cowork/rag-client.py search "parking rules" --bucket wharfside-docs
  python AgentArchitect/cowork/rag-client.py search "board meeting" --bucket wharfside-docs --limit 5
  python AgentArchitect/cowork/rag-client.py buckets
  python AgentArchitect/cowork/rag-client.py health

Config: reads from AgentArchitect/cowork/.env (RAG_API_URL and RAG_API_KEY)
"""

import json
import os
import sys
import urllib.request
import urllib.error
import urllib.parse

# ============================================================================
# Configuration
# ============================================================================

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_FILE = os.path.join(SCRIPT_DIR, '.env')

DEFAULT_API_URL = 'https://rag-api-934267405367.us-central1.run.app'
DEFAULT_LIMIT = 10
DEFAULT_THRESHOLD = 0.35


def load_env():
    """Load environment variables from .env file."""
    config = {}
    if os.path.exists(ENV_FILE):
        with open(ENV_FILE) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    config[key.strip()] = value.strip().strip('"').strip("'")
    return config


def get_config():
    """Get API URL and key from env file or environment variables."""
    env = load_env()
    api_url = os.environ.get('RAG_API_URL') or env.get('RAG_API_URL') or DEFAULT_API_URL
    api_key = os.environ.get('RAG_API_KEY') or env.get('RAG_API_KEY')

    if not api_key:
        print("ERROR: RAG_API_KEY not found.", file=sys.stderr)
        print(f"Set it in {ENV_FILE} or as an environment variable.", file=sys.stderr)
        print("\nTo get the key, run on your Mac:", file=sys.stderr)
        print("  gcloud secrets versions access latest --secret=rag-api-keys --project=pdfscribe-prod", file=sys.stderr)
        sys.exit(1)

    return api_url.rstrip('/'), api_key


# ============================================================================
# API Calls
# ============================================================================

def api_request(url, api_key, method='GET', data=None):
    """Make an authenticated API request."""
    headers = {
        'X-API-Key': api_key,
        'Content-Type': 'application/json',
    }

    body = json.dumps(data).encode('utf-8') if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8') if e.fp else ''
        print(f"ERROR: HTTP {e.code} - {e.reason}", file=sys.stderr)
        if error_body:
            try:
                detail = json.loads(error_body).get('detail', error_body)
                print(f"  {detail}", file=sys.stderr)
            except json.JSONDecodeError:
                print(f"  {error_body[:500]}", file=sys.stderr)
        sys.exit(1)
    except urllib.error.URLError as e:
        print(f"ERROR: Connection failed - {e.reason}", file=sys.stderr)
        print("  Is the RAG API running? Check: " + url, file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)


def search(query, bucket=None, limit=DEFAULT_LIMIT, threshold=DEFAULT_THRESHOLD):
    """Search the RAG database."""
    api_url, api_key = get_config()

    data = {
        'query': query,
        'limit': limit,
        'similarity_threshold': threshold,
    }
    if bucket:
        data['bucket_id'] = bucket

    url = f"{api_url}/v1/search"

    results = api_request(url, api_key, method='POST', data=data)

    if not results or (isinstance(results, list) and len(results) == 0):
        print(f"No results found for: {query}")
        if bucket:
            print(f"  (bucket: {bucket})")
        return

    # Handle both list and dict response formats
    items = results if isinstance(results, list) else results.get('results', [])

    print(f"## RAG Search Results: \"{query}\"")
    if bucket:
        print(f"**Bucket:** {bucket}")
    print(f"**Results:** {len(items)}\n")

    for i, item in enumerate(items, 1):
        similarity = item.get('similarity', item.get('score', 0))
        source = item.get('source_file', item.get('source', 'unknown'))
        text = item.get('chunk_text', item.get('text', item.get('content', '')))
        bucket_id = item.get('bucket_id', bucket or 'unknown')

        print(f"### Result {i} [{similarity:.3f}]")
        print(f"**Source:** {source}")
        print(f"**Bucket:** {bucket_id}")
        print(f"\n{text[:800]}")
        if len(text) > 800:
            print(f"\n... ({len(text)} chars total)")
        print()


def list_buckets():
    """List available RAG buckets."""
    api_url, api_key = get_config()
    url = f"{api_url}/v1/buckets"

    results = api_request(url, api_key)

    if isinstance(results, list):
        buckets = results
    else:
        buckets = results.get('buckets', [])

    print("## Available RAG Buckets\n")
    for bucket in buckets:
        if isinstance(bucket, dict):
            bid = bucket.get('bucket_id', bucket.get('id', 'unknown'))
            count = bucket.get('document_count', bucket.get('count', '?'))
            chunks = bucket.get('chunk_count', '?')
            print(f"- **{bid}** — {count} documents, {chunks} chunks")
        else:
            print(f"- **{bucket}**")


def health_check():
    """Check API health."""
    api_url, api_key = get_config()
    url = f"{api_url}/v1/health"

    result = api_request(url, api_key)
    print("## RAG API Health\n")
    print(f"**Status:** {result.get('status', 'unknown')}")
    if 'database' in result:
        print(f"**Database:** {result['database']}")
    if 'version' in result:
        print(f"**Version:** {result['version']}")
    print(f"**URL:** {api_url}")
    print(json.dumps(result, indent=2))


def stats():
    """Get RAG database statistics."""
    api_url, api_key = get_config()
    url = f"{api_url}/v1/stats"

    result = api_request(url, api_key)
    print("## RAG Database Statistics\n")
    print(json.dumps(result, indent=2))


# ============================================================================
# CLI
# ============================================================================

def print_usage():
    print("""
RAG API Client for Cowork

Usage:
  python rag-client.py search <query> [--bucket <id>] [--limit <n>] [--threshold <t>]
  python rag-client.py buckets
  python rag-client.py health
  python rag-client.py stats

Examples:
  python rag-client.py search "parking rules" --bucket wharfside-docs
  python rag-client.py search "board meeting minutes" --limit 5
  python rag-client.py search "Altium deployment checklist" --bucket altium-playbook
  python rag-client.py buckets

Available buckets:
  wharfside-docs, research-cache, session-logs, altium-playbook,
  personal-notes, ai-journey, altium-presentation-guide
""")


def main():
    if len(sys.argv) < 2:
        print_usage()
        sys.exit(1)

    command = sys.argv[1]

    if command == 'search':
        if len(sys.argv) < 3:
            print("ERROR: search requires a query string", file=sys.stderr)
            sys.exit(1)

        query = sys.argv[2]
        bucket = None
        limit = DEFAULT_LIMIT
        threshold = DEFAULT_THRESHOLD

        i = 3
        while i < len(sys.argv):
            if sys.argv[i] == '--bucket' and i + 1 < len(sys.argv):
                bucket = sys.argv[i + 1]
                i += 2
            elif sys.argv[i] == '--limit' and i + 1 < len(sys.argv):
                limit = int(sys.argv[i + 1])
                i += 2
            elif sys.argv[i] == '--threshold' and i + 1 < len(sys.argv):
                threshold = float(sys.argv[i + 1])
                i += 2
            else:
                # Treat as part of query if not a flag
                query += ' ' + sys.argv[i]
                i += 1

        search(query, bucket=bucket, limit=limit, threshold=threshold)

    elif command == 'buckets':
        list_buckets()

    elif command == 'health':
        health_check()

    elif command == 'stats':
        stats()

    else:
        print(f"Unknown command: {command}", file=sys.stderr)
        print_usage()
        sys.exit(1)


if __name__ == '__main__':
    main()
