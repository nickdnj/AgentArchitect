# Gatekeeper Mac Mini — Full Deployment Guide

**Target machine:** Mac Mini (Gatekeeper)
**Source machine:** Development MacBook (where everything was built)
**Date:** 2026-03-04

---

## Prerequisites

Run these on the Gatekeeper Mac Mini:

```bash
# Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Core tools
brew install python@3.12 poppler node git

# Cloud SQL Auth Proxy (for direct Postgres access)
brew install cloud-sql-proxy

# Google Cloud SDK (for gcloud auth)
brew install --cask google-cloud-sdk

# Ollama (local LLM for Gatekeeper classifier)
brew install ollama
```

### Claude Code CLI

```bash
npm install -g @anthropic-ai/claude-code
```

### Authenticate gcloud

```bash
gcloud auth login
gcloud auth application-default login
gcloud config set project pdfscribe-prod
```

---

## 1. Clone Repositories

All three repos must be sibling directories under `~/Workspaces/`:

```bash
mkdir -p ~/Workspaces && cd ~/Workspaces

# Agent Architect (agent definitions, context buckets, skills)
git clone git@github.com:nickdnj/AgentArchitect.git

# PDFScribe CLI (RAG engine, ingestion, API client)
git clone git@github.com:nickdnj/pdfscribe_cli.git

# Local AI Gatekeeper (Telegram bot, delegation handler)
git clone git@github.com:nickdnj/local-ai-gatekeeper.git
```

---

## 2. Set Up Python Environments

### PDFScribe CLI

```bash
cd ~/Workspaces/pdfscribe_cli
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
deactivate
```

### Local AI Gatekeeper

```bash
cd ~/Workspaces/local-ai-gatekeeper
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
deactivate
```

---

## 3. Cloud SQL Auth Proxy (launchd Service)

The proxy connects to the cloud Postgres database and exposes it on `localhost:5433`.

### Create the launchd plist

```bash
cat > ~/Library/LaunchAgents/com.pdfscribe.cloud-sql-proxy.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.pdfscribe.cloud-sql-proxy</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/cloud-sql-proxy</string>
        <string>pdfscribe-prod:us-central1:pdfscribe-db</string>
        <string>--port=5433</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/cloud-sql-proxy.stdout.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/cloud-sql-proxy.stderr.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
    </dict>
</dict>
</plist>
EOF
```

### Load and verify

```bash
launchctl load ~/Library/LaunchAgents/com.pdfscribe.cloud-sql-proxy.plist

# Verify it's running
launchctl list | grep cloud-sql-proxy
# Should show PID and "0" exit status

# Test the connection
psql "host=127.0.0.1 port=5433 dbname=rag user=rag" -c "SELECT count(*) FROM embeddings;"
# Password: see Step 4 below
```

### Troubleshooting

```bash
# Check logs
cat /tmp/cloud-sql-proxy.stderr.log

# If gcloud auth expired:
gcloud auth application-default login
launchctl kickstart -k gui/$(id -u)/com.pdfscribe.cloud-sql-proxy
```

---

## 4. Environment Variables

### Get secrets from GCP Secret Manager

```bash
# RAG database password
gcloud secrets versions access latest --secret=rag-db-password --project=pdfscribe-prod

# RAG API key (for REST API access)
gcloud secrets versions access latest --secret=rag-api-keys --project=pdfscribe-prod

# OpenAI API key
gcloud secrets versions access latest --secret=openai-api-key --project=pdfscribe-prod
```

### Gatekeeper `.env`

Edit `~/Workspaces/local-ai-gatekeeper/config/.env`:

```bash
# === Core (already present) ===
TELEGRAM_BOT_TOKEN=<your-telegram-bot-token>
AUTHORIZED_CHAT_ID=8663651658
OPENAI_API_KEY=<from-gcp-secret-manager>

# === RAG Shared Brain (Cloud Postgres via Cloud SQL Auth Proxy) ===
RAG_BACKEND=postgres
RAG_DB_HOST=127.0.0.1
RAG_DB_PORT=5433
RAG_DB_USER=rag
RAG_DB_PASSWORD=<from-gcp-secret-manager: rag-db-password>
RAG_DB_NAME=rag

# === Anthropic (for PDF transcription + Claude delegation) ===
ANTHROPIC_API_KEY=<your-anthropic-api-key>
```

### Shell profile (for interactive Claude Code sessions)

Add to `~/.zshrc` or `~/.bash_profile`:

```bash
# RAG Shared Brain
export RAG_BACKEND=postgres
export RAG_DB_HOST=127.0.0.1
export RAG_DB_PORT=5433
export RAG_DB_USER=rag
export RAG_DB_PASSWORD="<from-gcp-secret-manager>"
export RAG_DB_NAME=rag
export OPENAI_API_KEY="<from-gcp-secret-manager>"
```

This ensures that when the Gatekeeper delegates to Claude Code (`claude -p`), the spawned subprocess inherits the RAG env vars through `os.environ`.

---

## 5. Configure Gatekeeper for Team Deployment

Edit `~/Workspaces/local-ai-gatekeeper/config/config.yaml`:

```yaml
delegation:
  max_concurrent: 2
  timeout: 300
  progress_interval: 30
  summary_threshold: 2000
  working_directory: /Users/<username>/Workspaces/AgentArchitect
  tool_profiles:
    general: ["Read", "Write", "Bash", "WebSearch", "WebFetch"]
```

Replace `<username>` with the Mac Mini's username.

**What `working_directory` does:** When set, Claude Code subprocess runs with `cwd` pointed at AgentArchitect. This means it picks up the `CLAUDE.md`, agent definitions, and skill routing. The delegation handler also omits `--allowedTools` in this mode so Claude has full agent access (Task tool for delegating to specialists).

---

## 6. Generate Claude Code Native Agents

```bash
cd ~/Workspaces/AgentArchitect
node scripts/generate-agents.js
```

This generates:
- `.claude/agents/*.md` — Native agent definitions
- `.claude/skills/*/SKILL.md` — Forked skills for specialists and orchestrators

Verify RAG integration in generated skills:

```bash
grep -r "RAG_BACKEND=postgres" .claude/skills/ | head -5
```

---

## 7. Verify RAG Database Connection

```bash
cd ~/Workspaces/pdfscribe_cli
source .venv/bin/activate

# Check connection and index stats
RAG_BACKEND=postgres python src/rag.py stats

# Expected output:
#   Total documents: 109
#   Total chunks: 816
#   Buckets: wharfside-docs, research-cache, session-logs, ...

# Test a search
RAG_BACKEND=postgres python src/rag.py search "parking rules" --bucket wharfside-docs

# Cross-bucket search
RAG_BACKEND=postgres python src/rag.py search "assessment schedule"

deactivate
```

---

## 8. Start the Gatekeeper

```bash
cd ~/Workspaces/local-ai-gatekeeper
source .venv/bin/activate
python -m src.main
```

### Test via Telegram

1. Send `/status` — should show all green (OpenAI, Ollama, Claude CLI)
2. Send "What is the Wharfside pet policy?" — should delegate to Claude Code, which uses RAG search
3. Send "Search the board documents for parking rules" — should return results from cloud RAG

---

## 9. Gatekeeper as launchd Service (Auto-Start on Boot)

```bash
cat > ~/Library/LaunchAgents/com.gatekeeper.ai.plist << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.gatekeeper.ai</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Users/USERNAME/Workspaces/local-ai-gatekeeper/.venv/bin/python</string>
        <string>-m</string>
        <string>src.main</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/USERNAME/Workspaces/local-ai-gatekeeper</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/gatekeeper.stdout.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/gatekeeper.stderr.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/Users/USERNAME/.local/bin:/Users/USERNAME/.npm-global/bin</string>
        <key>HOME</key>
        <string>/Users/USERNAME</string>
        <key>RAG_BACKEND</key>
        <string>postgres</string>
        <key>RAG_DB_HOST</key>
        <string>127.0.0.1</string>
        <key>RAG_DB_PORT</key>
        <string>5433</string>
        <key>RAG_DB_USER</key>
        <string>rag</string>
        <key>RAG_DB_PASSWORD</key>
        <string>REPLACE_WITH_ACTUAL_PASSWORD</string>
        <key>RAG_DB_NAME</key>
        <string>rag</string>
    </dict>
</dict>
</plist>
PLIST

# Replace USERNAME with actual username
sed -i '' "s/USERNAME/$(whoami)/g" ~/Library/LaunchAgents/com.gatekeeper.ai.plist

# Load it
launchctl load ~/Library/LaunchAgents/com.gatekeeper.ai.plist
```

> **Note:** The EnvironmentVariables in the plist are needed because launchd services don't inherit shell profile env vars. The RAG vars must be explicitly set here.

---

## 10. File Watcher Daemon (Auto-Ingestion)

This watches the context buckets for new or changed files and auto-ingests them into the cloud RAG database.

### Install watchdog

```bash
cd ~/Workspaces/pdfscribe_cli
source .venv/bin/activate
pip install watchdog
```

### Create the watcher script

Save as `~/Workspaces/pdfscribe_cli/scripts/rag-file-watcher.py`:

```python
#!/usr/bin/env python3
"""Watch context bucket files/ directories and auto-ingest on change."""

import os
import sys
import time
import json
import logging
from pathlib import Path

from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Add parent for rag imports
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger("rag-watcher")

BUCKETS_ROOT = Path.home() / "Workspaces" / "AgentArchitect" / "context-buckets"
SUPPORTED_EXTENSIONS = {".md", ".txt", ".html"}
SKIP_FILES = {"home.html", "index.html", ".DS_Store"}
DEBOUNCE_SECONDS = 5


class BucketIngestHandler(FileSystemEventHandler):
    """Handles file create/modify events in context bucket files/ dirs."""

    def __init__(self):
        self._pending = {}  # path -> timestamp (debounce)

    def _should_process(self, path: str) -> bool:
        p = Path(path)
        if p.name in SKIP_FILES:
            return False
        if p.suffix.lower() not in SUPPORTED_EXTENSIONS:
            return False
        if "/files/" not in str(p):
            return False
        return True

    def _get_bucket_id(self, path: str) -> str | None:
        """Extract bucket_id from path like .../context-buckets/<bucket-id>/files/..."""
        parts = Path(path).parts
        try:
            idx = parts.index("context-buckets")
            return parts[idx + 1]
        except (ValueError, IndexError):
            return None

    def _ingest_file(self, path: str):
        from rag import ingest_document

        p = Path(path)
        bucket_id = self._get_bucket_id(path)
        if not bucket_id:
            log.warning(f"Could not determine bucket_id for {path}")
            return

        try:
            text = p.read_text(encoding="utf-8", errors="replace")
            if len(text.strip()) < 50:
                log.info(f"Skipping {p.name} (too short)")
                return

            result = ingest_document(
                text=text,
                bucket_id=bucket_id,
                source_file=p.name,
                force=True,
            )
            log.info(
                f"Ingested {p.name} into {bucket_id}: "
                f"{result.get('chunk_count', 0)} chunks, "
                f"{result.get('total_tokens', 0)} tokens"
            )
        except Exception:
            log.exception(f"Failed to ingest {path}")

    def on_created(self, event):
        if event.is_directory or not self._should_process(event.src_path):
            return
        self._pending[event.src_path] = time.time()

    def on_modified(self, event):
        if event.is_directory or not self._should_process(event.src_path):
            return
        self._pending[event.src_path] = time.time()

    def process_pending(self):
        """Process files that have been stable for DEBOUNCE_SECONDS."""
        now = time.time()
        ready = [
            p for p, t in self._pending.items()
            if now - t >= DEBOUNCE_SECONDS
        ]
        for path in ready:
            del self._pending[path]
            if Path(path).exists():
                log.info(f"Auto-ingesting: {path}")
                self._ingest_file(path)


def main():
    os.environ.setdefault("RAG_BACKEND", "postgres")

    if not BUCKETS_ROOT.exists():
        log.error(f"Buckets root not found: {BUCKETS_ROOT}")
        sys.exit(1)

    # Discover all bucket files/ directories
    watch_dirs = []
    for bucket_dir in BUCKETS_ROOT.iterdir():
        files_dir = bucket_dir / "files"
        if files_dir.is_dir():
            watch_dirs.append(str(files_dir))

    if not watch_dirs:
        log.error("No bucket files/ directories found")
        sys.exit(1)

    handler = BucketIngestHandler()
    observer = Observer()

    for d in watch_dirs:
        observer.schedule(handler, d, recursive=True)
        log.info(f"Watching: {d}")

    log.info(f"RAG File Watcher started — monitoring {len(watch_dirs)} buckets")
    observer.start()

    try:
        while True:
            time.sleep(1)
            handler.process_pending()
    except KeyboardInterrupt:
        observer.stop()
    observer.join()


if __name__ == "__main__":
    main()
```

### launchd service for the watcher

```bash
cat > ~/Library/LaunchAgents/com.pdfscribe.rag-watcher.plist << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.pdfscribe.rag-watcher</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Users/USERNAME/Workspaces/pdfscribe_cli/.venv/bin/python</string>
        <string>/Users/USERNAME/Workspaces/pdfscribe_cli/scripts/rag-file-watcher.py</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/USERNAME/Workspaces/pdfscribe_cli</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/rag-watcher.stdout.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/rag-watcher.stderr.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>RAG_BACKEND</key>
        <string>postgres</string>
        <key>RAG_DB_HOST</key>
        <string>127.0.0.1</string>
        <key>RAG_DB_PORT</key>
        <string>5433</string>
        <key>RAG_DB_USER</key>
        <string>rag</string>
        <key>RAG_DB_PASSWORD</key>
        <string>REPLACE_WITH_ACTUAL_PASSWORD</string>
        <key>RAG_DB_NAME</key>
        <string>rag</string>
        <key>OPENAI_API_KEY</key>
        <string>REPLACE_WITH_ACTUAL_KEY</string>
    </dict>
</dict>
</plist>
PLIST

sed -i '' "s/USERNAME/$(whoami)/g" ~/Library/LaunchAgents/com.pdfscribe.rag-watcher.plist

launchctl load ~/Library/LaunchAgents/com.pdfscribe.rag-watcher.plist
```

---

## Quick Reference — Services on Gatekeeper

| Service | launchd Label | Port | Logs |
|---------|--------------|------|------|
| Cloud SQL Auth Proxy | `com.pdfscribe.cloud-sql-proxy` | 5433 | `/tmp/cloud-sql-proxy.stderr.log` |
| Gatekeeper Bot | `com.gatekeeper.ai` | — | `/tmp/gatekeeper.stderr.log` |
| RAG File Watcher | `com.pdfscribe.rag-watcher` | — | `/tmp/rag-watcher.stderr.log` |
| Ollama | `com.ollama.server` (auto) | 11434 | — |

### Common Commands

```bash
# Check all services
launchctl list | grep -E "cloud-sql|gatekeeper|rag-watcher"

# Restart a service
launchctl kickstart -k gui/$(id -u)/com.gatekeeper.ai

# Stop a service
launchctl unload ~/Library/LaunchAgents/com.gatekeeper.ai.plist

# View logs
tail -f /tmp/gatekeeper.stderr.log
tail -f /tmp/rag-watcher.stderr.log
tail -f /tmp/cloud-sql-proxy.stderr.log
```

---

## Deployment Checklist

- [ ] Homebrew + core tools installed (python3, node, git, poppler)
- [ ] `cloud-sql-proxy` installed and gcloud authenticated
- [ ] Claude Code CLI installed (`claude --version`)
- [ ] Ollama installed and model pulled (`ollama pull glm4`)
- [ ] Repos cloned: AgentArchitect, pdfscribe_cli, local-ai-gatekeeper
- [ ] Python venvs created for pdfscribe_cli and gatekeeper
- [ ] Cloud SQL Auth Proxy running as launchd service (port 5433)
- [ ] `.env` file populated with all secrets
- [ ] Shell profile exports RAG env vars (for interactive Claude sessions)
- [ ] Gatekeeper `config.yaml` has `working_directory` set to AgentArchitect path
- [ ] `node scripts/generate-agents.js` run in AgentArchitect
- [ ] RAG stats verified: `RAG_BACKEND=postgres python src/rag.py stats`
- [ ] RAG search verified: found results across buckets
- [ ] Telegram bot responding to messages
- [ ] Gatekeeper launchd service loaded (auto-start on boot)
- [ ] File watcher daemon running (auto-ingestion)
- [ ] `watchdog` pip package installed in pdfscribe_cli venv

---

## Roadmap / Future Items

- [ ] **Home Assistant integration** (Gatekeeper Phase 0.3) — smart home control via Telegram
- [ ] **Ingestion post-save hook** — auto-ingest when `/save` skill writes new context files
- [ ] **Dedup cleanup** — investigate and resolve duplicate chunks in search results
- [ ] **Voice mode services** — deploy Whisper + Kokoro TTS on Gatekeeper for voice interaction
- [ ] **Health monitoring** — Telegram alert if Cloud SQL Proxy or RAG watcher goes down
