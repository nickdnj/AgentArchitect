# Offline Scribe

A fully-local capture & staging tool for your wiki and autobiography. Runs entirely
against **Ollama** (`qwen2.5:14b`) and the local **whisper.cpp** server — **no internet**.

## The one rule that keeps a small model safe

The local model **never writes files**. It emits a *structured proposal*; deterministic
Python applies it after **you** approve. Substantive work is staged into the wiki's
append-only `raw/` layer for the real Claude `wiki-ingest` to compile when you reconnect.
Only **trivial, unique-match** fixes (a typo, name, or date) ever touch a curated page,
and only after you approve the diff.

## Quick start

```bash
cd ~/Workspaces/AgentArchitect/scripts/scribe
./scribe doctor          # verify every local dependency is up
```

Optional — put it on your PATH:

```bash
ln -sf "$PWD/scribe" /usr/local/bin/scribe
```

## Commands

| Command | What it does |
|---|---|
| `scribe doctor` | Health-check Ollama, the model, whisper, ffmpeg, paths, and git. Run this first. |
| `scribe story [--voice] [--title "..."]` | Capture or **dictate** an autobiography story. Light cleanup (fixes filler/transcription, preserves your voice and every fact). You approve, then it's saved to the autobiography bucket + a pointer in `raw/`. |
| `scribe correct "<what's wrong>"` | Locate the wiki page and fix a fact. Trivial unique fix → proposes a diff you approve → edits the page. Anything substantive or ambiguous → staged as a note in `raw/`. |
| `scribe note <project> [--voice]` | Free-form capture about any project, appended verbatim to `raw/notes-<project>-<date>.md`. |
| `scribe queue` | Show everything staged offline, awaiting `wiki-ingest`. |
| `scribe handoff` | Write a summary of all captures + the exact reconnect command. |

`--voice` records from the mic (press ENTER to stop) and transcribes locally. If the mic
or whisper is unavailable, it falls back to typing automatically.
Without `--text`, typed input opens `$EDITOR` (default `nano`).

## When you reconnect

Run `scribe handoff` to see the list, then feed the staged `raw/` files to the real
curator:

```bash
# in Claude Code
/architect wiki-ingest ingest --source raw/<file>.md
```

Scribe's job ends at the `raw/` boundary; Claude's disciplined `wiki-ingest` begins there.

## Configuration (env vars)

| Var | Default |
|---|---|
| `SCRIBE_MODEL` | `qwen2.5:14b` (fallback `glm4:latest`) |
| `WIKI_REPO` | `~/Workspaces/wiki` |
| `AA_REPO` | `~/Workspaces/AgentArchitect` |
| `OLLAMA_URL` | `http://localhost:11434` |
| `WHISPER_URL` | `http://localhost:2022/v1/audio/transcriptions` |
| `SCRIBE_MIC` | `2` (ffmpeg avfoundation device index = MacBook Air Microphone) |

Every write is auto-committed locally (only the files Scribe touched). Use `--no-commit`
to skip. Nothing is pushed — you sync when you're back online.

## Notes & limits

- Designed for a 24 GB M-series Mac; `qwen2.5:14b` (~9 GB) is the quality/footprint sweet spot.
- The model does capture + light cleanup + page-location. It does **not** synthesize new
  wiki pages or do multi-page reasoning — that waits for Claude on reconnect.
- Voice quality depends on the local whisper model; review transcriptions before accepting.
