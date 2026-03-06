# RAG Chrome Bridge — Cowork Integration Guide

## Overview

In Cowork, the VM's egress proxy blocks direct HTTP calls to external APIs.
The Chrome browser (running on the user's Mac) **can** reach the Cloud Run RAG API.
This document describes how Cowork agents perform RAG searches via Chrome.

## Prerequisites

Chrome must have a tab open on the RAG API domain. The agent should:
1. Call `tabs_context_mcp` to get available tabs
2. Look for a tab on `rag-api-934267405367.us-central1.run.app`
3. If none exists, create one with `tabs_create_mcp` then navigate to `https://rag-api-934267405367.us-central1.run.app/docs`

## RAG Search via Chrome JavaScript

Use the `javascript_tool` on a tab that's on the RAG API domain:

```javascript
(async () => {
  const resp = await fetch('/v1/search', {
    method: 'POST',
    headers: {
      'X-API-Key': 'YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: 'YOUR SEARCH QUERY',
      bucket_id: 'BUCKET_NAME',  // optional
      limit: 10,                  // optional, default 10
      similarity_threshold: 0.35  // optional, default 0.35
    })
  });
  const data = await resp.json();
  return JSON.stringify(data, null, 2);
})();
```

## Available Buckets

- `wharfside-docs` — Wharfside Manor governing documents, letters, policies
- `research-cache` — Research reports and cached findings
- `session-logs` — Agent session logs and interaction history
- `altium-playbook` — Altium sales and deployment playbook
- `personal-notes` — Personal notes and journal entries
- `ai-journey` — AI learning journey documentation
- `altium-presentation-guide` — Presentation templates and guidelines

## Other Endpoints

### Health Check (no auth required)
```javascript
(async () => {
  const resp = await fetch('/v1/health');
  return JSON.stringify(await resp.json(), null, 2);
})();
```

### Stats
```javascript
(async () => {
  const resp = await fetch('/v1/stats', {
    headers: { 'X-API-Key': 'YOUR_API_KEY' }
  });
  return JSON.stringify(await resp.json(), null, 2);
})();
```

### List Documents
```javascript
(async () => {
  const resp = await fetch('/v1/documents?bucket_id=wharfside-docs', {
    headers: { 'X-API-Key': 'YOUR_API_KEY' }
  });
  return JSON.stringify(await resp.json(), null, 2);
})();
```

## API Configuration

- **URL:** https://rag-api-934267405367.us-central1.run.app
- **Auth:** X-API-Key header
- **Key location:** `AgentArchitect/cowork/.env` (RAG_API_KEY)

## Response Format

Search results return:
```json
{
  "results": [
    {
      "chunk_text": "...",
      "source_file": "document-name.md",
      "bucket_id": "wharfside-docs",
      "similarity": 0.85,
      "chunk_index": 3,
      "metadata": {}
    }
  ],
  "query": "parking rules",
  "total_results": 5
}
```
