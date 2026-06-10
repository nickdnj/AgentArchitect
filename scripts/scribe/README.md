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

## Your offline second brain

The wiki *is* the second brain; Scribe is how you talk to it offline. Build the index
once (before you go offline), then ask it anything — answers are grounded **only** in your
own pages and cite the source, so when something's wrong you know exactly where to fix it.

```bash
./scribe index                       # embed all wiki pages locally (do this before offline)
./scribe ask "what do I know about the Concurrent 3280?"
./scribe chat                        # conversational REPL (below)
```

In `scribe chat`, plain text asks a question; **tap the SPACEBAR to talk** instead of
typing (push-to-talk: tap space to start recording, tap space again to stop — then it
transcribes locally and sends). These slash-commands do more:

**You don't have to remember any of this** — say **"help"** anytime and the chat tells you
exactly what you can do and how. Every capability is reachable from the chat in plain words.

| In-chat command | Effect |
|---|---|
| *(tap SPACE)* | Push-to-talk — speak your message; tap SPACE again to stop |
| `help` / `/help` | Show everything you can do (authoritative, always accurate) |
| `/story` (or "add a story") | Record an autobiography story, voice-first |
| `/remember <text>` (or "remember…") | Stage a **proposed memory** to `raw/` for `wiki-ingest` |
| `/correct <what's wrong>` | Fix a fact inline (same flow as `scribe correct`) |
| `/task <what to do>` | Stage an action for Claude to do when you're back online |
| `/voice` | Dictate your next message (ENTER to stop) |
| `/sources` | Show the raw excerpts behind the last answer (to spot errors) |
| `/reindex` | Rebuild the index (after you've made edits) |
| `/quit` | Exit |

### Intent routing

You don't have to use slash-commands — chat figures out what you mean. Each message routes to:

- **help** ("what can I do?", "how do I…") → an accurate answer from the built-in capability list
- **chit-chat / meta** ("can you hear me?", "thanks") → natural reply, no lookup, nothing saved
- **question** → grounded, cited answer from your wiki
- **story** ("add a story", "record a memory of when…") → voice-first autobiography capture
- **remember** → stages a proposed memory
- **correct** → runs the fact-fix flow
- **task** ("draft me…", "plan…", "write a summary of…") → staged to `raw/tasks-for-claude-<date>.md`

### Where new stories go

A story you dictate offline is saved straight into `wiki/projects/autobiography/stories/`
(so you can **ask about it immediately**), flagged `validated_by_claude: false` in its
frontmatter, **and** a full draft is staged to `raw/autobio-story-*.md`. When you reconnect,
Claude reviews the flagged story, fixes any transcription/formatting, and sets the flag true.

The **task** intent turns the offline chat into a **capture queue for Claude**: anything beyond
a local model's reach is parked for Claude to do properly on reconnect. `scribe handoff` lists
your tasks, staged stories, and any self-improvement proposals.

## Commands

| Command | What it does |
|---|---|
| `scribe doctor` | Health-check Ollama, both models, whisper, ffmpeg, paths, git, and the index. Run first. |
| `scribe index [--rebuild]` | Build/refresh the local semantic index. Incremental — only re-embeds changed pages. |
| `scribe ask "<question>"` | One-shot grounded question → cited answer from your wiki. |
| `scribe chat` | Conversational second-brain REPL (see slash-commands above). |
| `scribe reflect [tool\|wiki\|all]` | **Self-improvement.** The local model proposes (never makes) improvements and stages a Claude-ready brief to `raw/improvement-proposals-<date>.md`. |
| `scribe story [--voice] [--title "..."]` | Capture or **dictate** an autobiography story. Light cleanup (fixes filler/transcription, preserves your voice and every fact). Saved to the autobiography bucket + a pointer in `raw/`. |
| `scribe correct "<what's wrong>"` | Locate the wiki page and fix a fact. Trivial unique fix → diff you approve → edits the page. Substantive or ambiguous → staged as a note in `raw/`. |
| `scribe note <project> [--voice]` | Free-form capture about any project → `raw/notes-<project>-<date>.md`. |
| `scribe queue` | Show everything staged offline, awaiting `wiki-ingest`. |
| `scribe handoff` | Summary of all captures + the exact reconnect commands. |

`--voice` records from the mic (press ENTER to stop) and transcribes locally. If the mic
or whisper is unavailable, it falls back to typing automatically.
Without `--text`, typed input opens `$EDITOR` (default `nano`).

## Self-improvement loop

`scribe reflect` is the "get better over time" mechanism, designed for the local model's
limits: **it plans and documents, it does not act.** It reviews how you've used Scribe and
the shape of your wiki, then writes prioritized proposals (what / why / next step) for Claude
to execute when you're back online. `scribe handoff` routes those to the Architect / `improver`
agent. Nothing is changed without Claude in the loop.

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
