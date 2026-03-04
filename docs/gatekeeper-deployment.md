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

# Ollama (local LLM for Gatekeeper classifier)
brew install ollama

# OPTIONAL: Only needed if using RAG_BACKEND=postgres (direct DB access)
# For RAG_BACKEND=api (recommended), these are NOT required
# brew install cloud-sql-proxy
# brew install --cask google-cloud-sdk
```

### Claude Code CLI

```bash
npm install -g @anthropic-ai/claude-code
```

### Authenticate gcloud (only for `RAG_BACKEND=postgres`)

> **Skip this section if using `RAG_BACKEND=api`** — the API backend doesn't need gcloud.

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

## 3. Cloud SQL Auth Proxy (launchd Service) — OPTIONAL

> **Skip this section if using `RAG_BACKEND=api`** — the API backend communicates via HTTPS and doesn't need a local proxy.

The proxy connects to the cloud Postgres database and exposes it on `localhost:5433`. Only needed for `RAG_BACKEND=postgres`.

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
# RAG API key (for REST API access — needed for both api and postgres backends)
gcloud secrets versions access latest --secret=rag-api-keys --project=pdfscribe-prod

# ONLY for RAG_BACKEND=postgres:
# gcloud secrets versions access latest --secret=rag-db-password --project=pdfscribe-prod
# gcloud secrets versions access latest --secret=openai-api-key --project=pdfscribe-prod
```

### Gatekeeper `.env`

Edit `~/Workspaces/local-ai-gatekeeper/config/.env`:

#### Option A: API Backend (Recommended)

No proxy, no gcloud, no OpenAI key needed — just the API URL and key.

```bash
# === Core ===
TELEGRAM_BOT_TOKEN=<your-telegram-bot-token>
AUTHORIZED_CHAT_ID=8663651658

# === RAG Shared Brain (via REST API) ===
RAG_BACKEND=api
RAG_API_URL=https://rag-api-934267405367.us-central1.run.app
RAG_API_KEY=<from-gcp-secret-manager: rag-api-keys>

# === Anthropic (for PDF transcription + Claude delegation) ===
ANTHROPIC_API_KEY=<your-anthropic-api-key>
```

#### Option B: Direct Postgres (requires Cloud SQL Auth Proxy + gcloud + OpenAI key)

```bash
# === Core ===
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
# RAG Shared Brain (API backend — recommended)
export RAG_BACKEND=api
export RAG_API_URL="https://rag-api-934267405367.us-central1.run.app"
export RAG_API_KEY="<from-gcp-secret-manager: rag-api-keys>"

# Alternative: Direct Postgres (requires Cloud SQL Auth Proxy + OpenAI key)
# export RAG_BACKEND=postgres
# export RAG_DB_HOST=127.0.0.1
# export RAG_DB_PORT=5433
# export RAG_DB_USER=rag
# export RAG_DB_PASSWORD="<from-gcp-secret-manager>"
# export RAG_DB_NAME=rag
# export OPENAI_API_KEY="<from-gcp-secret-manager>"
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
grep -r "RAG_BACKEND=" .claude/skills/ | head -5
```

---

## 7. Verify RAG Connection

```bash
cd ~/Workspaces/pdfscribe_cli
source .venv/bin/activate

# === API backend (recommended) ===
RAG_BACKEND=api RAG_API_URL=https://rag-api-934267405367.us-central1.run.app \
  RAG_API_KEY=<key> python src/rag.py stats

# Test a search
RAG_BACKEND=api RAG_API_URL=https://rag-api-934267405367.us-central1.run.app \
  RAG_API_KEY=<key> python src/rag.py search "parking rules" --bucket wharfside-docs

# === Direct Postgres (alternative) ===
# RAG_BACKEND=postgres python src/rag.py stats
# RAG_BACKEND=postgres python src/rag.py search "parking rules" --bucket wharfside-docs

# Expected output (either backend):
#   Total documents: 109
#   Total chunks: 816
#   Buckets: wharfside-docs, research-cache, session-logs, ...

deactivate
```

---

## 7b. PDF Transcription Workflow

When new PDFs need to be added to the RAG database (e.g., new Wharfside governing documents, scanned board minutes), they must be transcribed to markdown first. The file watcher and RAG ingestion only handle `.md`, `.txt`, and `.html` files — not PDFs directly.

### Transcribe a local PDF

```bash
cd ~/Workspaces/pdfscribe_cli
source .venv/bin/activate

# Transcribe a PDF to markdown (output saved next to source as .md)
python pdfscribe_cli.py /path/to/document.pdf

# Transcribe and ingest into RAG in one step
python pdfscribe_cli.py /path/to/document.pdf
RAG_BACKEND=postgres python src/rag.py ingest-text \
  --bucket wharfside-docs \
  --source "document-name" \
  < /path/to/document.md
```

### Transcribe from Google Drive

```bash
# By Drive file ID
python pdfscribe_cli.py --drive-id 1ABC123...

# By Drive folder (transcribes all PDFs)
python pdfscribe_cli.py --drive-folder-id 1XYZ789...
```

### Ingest transcribed markdown into RAG

If the file watcher (Step 10) is running, simply copy the `.md` file into the appropriate context bucket:

```bash
# Example: new board document
cp /path/to/transcribed-document.md \
   ~/Workspaces/AgentArchitect/context-buckets/wharfside-docs/files/

# The file watcher will auto-detect and ingest it within ~5 seconds
```

Or ingest manually:

```bash
RAG_BACKEND=postgres python src/rag.py ingest-text \
  --bucket wharfside-docs \
  --source "new-document-name" \
  < ~/Workspaces/AgentArchitect/context-buckets/wharfside-docs/files/new-document.md
```

### Bulk re-ingestion (all buckets)

```bash
# Preview what would be ingested
python ingest_all_buckets.py --dry-run

# Ingest all (skips unchanged files via checksum)
RAG_BACKEND=postgres python ingest_all_buckets.py

# Force re-ingest everything
RAG_BACKEND=postgres python ingest_all_buckets.py --force

# Single bucket only
RAG_BACKEND=postgres python ingest_all_buckets.py --bucket wharfside-docs
```

### Requirements for PDF transcription

- `ANTHROPIC_API_KEY` env var (uses Claude vision for OCR)
- `poppler` installed via Homebrew (for `pdf2image`)
- For Google Drive: OAuth credentials at `~/.config/mcp-gdrive/gcp-oauth.keys.json`

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
        <string>api</string>
        <key>RAG_API_URL</key>
        <string>https://rag-api-934267405367.us-central1.run.app</string>
        <key>RAG_API_KEY</key>
        <string>REPLACE_WITH_ACTUAL_API_KEY</string>
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

### Watcher script

The watcher script is already in the pdfscribe_cli repo at `scripts/rag-file-watcher.py`. It watches all `context-buckets/*/files/` directories for `.md`, `.txt`, and `.html` changes, debounces for 5 seconds, then auto-ingests into the cloud RAG database.

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
        <string>api</string>
        <key>RAG_API_URL</key>
        <string>https://rag-api-934267405367.us-central1.run.app</string>
        <key>RAG_API_KEY</key>
        <string>REPLACE_WITH_ACTUAL_API_KEY</string>
    </dict>
</dict>
</plist>
PLIST

sed -i '' "s/USERNAME/$(whoami)/g" ~/Library/LaunchAgents/com.pdfscribe.rag-watcher.plist

launchctl load ~/Library/LaunchAgents/com.pdfscribe.rag-watcher.plist
```

---

## Quick Reference — Services on Gatekeeper

| Service | launchd Label | Port | Logs | Required |
|---------|--------------|------|------|----------|
| Cloud SQL Auth Proxy | `com.pdfscribe.cloud-sql-proxy` | 5433 | `/tmp/cloud-sql-proxy.stderr.log` | Only for `RAG_BACKEND=postgres` |
| Gatekeeper Bot | `com.gatekeeper.ai` | — | `/tmp/gatekeeper.stderr.log` | Yes |
| RAG File Watcher | `com.pdfscribe.rag-watcher` | — | `/tmp/rag-watcher.stderr.log` | Yes |
| Ollama | `com.ollama.server` (auto) | 11434 | — | Yes |

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
- [ ] Claude Code CLI installed (`claude --version`)
- [ ] Ollama installed and model pulled (`ollama pull glm4`)
- [ ] Repos cloned: AgentArchitect, pdfscribe_cli, local-ai-gatekeeper
- [ ] Python venvs created for pdfscribe_cli and gatekeeper
- [ ] `.env` file populated with RAG_BACKEND + secrets (api or postgres)
- [ ] Shell profile exports RAG env vars (for interactive Claude sessions)
- [ ] *(postgres only)* `cloud-sql-proxy` installed and gcloud authenticated
- [ ] *(postgres only)* Cloud SQL Auth Proxy running as launchd service (port 5433)
- [ ] Gatekeeper `config.yaml` has `working_directory` set to AgentArchitect path
- [ ] `node scripts/generate-agents.js` run in AgentArchitect
- [ ] RAG stats verified: `python src/rag.py stats`
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
