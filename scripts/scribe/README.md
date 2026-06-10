# Otto — your offline second-brain agent

**Otto is the agent; your wiki is the brain.** Otto is how you reach and tend your
knowledge while offline — fully local, no internet. He runs on **Ollama** (`qwen2.5:14b`)
with the local **whisper.cpp** server for voice, and `nomic-embed-text` for search.

The everyday command is just:

```bash
otto            # drops you straight into the chat (talk or type)
```

`otto doctor`, `otto ask "…"`, `otto index`, `otto handoff`, etc. still work as subcommands.

## The one rule that keeps a small model safe

The local model **never writes files**. It emits a *structured proposal*; deterministic
Python applies it after **you** approve. Substantive work is staged into the wiki's
append-only `raw/` layer for the real Claude `wiki-ingest` to compile when you reconnect.
Only **trivial, unique-match** fixes (a typo, name, or date) ever touch a curated page,
and only after you approve the diff.

## Install

```bash
cd ~/Workspaces/AgentArchitect/scripts/scribe
ln -sf "$PWD/otto" /opt/homebrew/bin/otto   # put `otto` on your PATH
otto doctor                                  # verify every local dependency is up
otto index                                   # embed all wiki pages (do this before going offline)
```

## Talking to Otto

Just run `otto`. Plain text asks a question; **tap the SPACEBAR to talk** instead of
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
| `/correct <what's wrong>` | Fix a fact inline (same flow as `otto correct`) |
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

### Recording a story (what happens)

When you dictate/type a story, Otto:
1. **Lightly cleans** the transcript (punctuation, paragraphs, filler removed) — it does *not*
   condense or rephrase; pick **`r`** at the prompt to keep your exact words instead.
2. **Proofreads** it and flags likely speech-to-text errors — names, places, companies — so you
   can fix them inline: enter `wrong=>right; wrong=>right` (e.g. `Sue Fong=>Sufeng`).
3. **Suggests a title** you can accept (Enter) or edit.
4. **Saves both versions**: the cleaned text becomes your searchable wiki story (your offline
   "short-term memory"); the **verbatim raw transcription** is preserved with it (and in the
   `raw/` draft) so Claude can faithfully reconcile on reconnect.

The story lands in `wiki/projects/autobiography/stories/` flagged `validated_by_claude: false`
and is **immediately searchable**. A side-by-side cleaned/raw draft goes to `raw/autobio-story-*.md`.
On reconnect, Claude compares the two, fixes anything off, and sets the flag true.

The **task** intent turns the offline chat into a **capture queue for Claude**: anything beyond
a local model's reach is parked for Claude to do properly on reconnect. `otto handoff` lists
your tasks, staged stories, and any self-improvement proposals.

## Commands

| Command | What it does |
|---|---|
| `otto doctor` | Health-check Ollama, both models, whisper, ffmpeg, paths, git, and the index. Run first. |
| `otto index [--rebuild]` | Build/refresh the local semantic index. Incremental — only re-embeds changed pages. |
| `otto ask "<question>"` | One-shot grounded question → cited answer from your wiki. |
| `otto chat` | Conversational second-brain REPL (see slash-commands above). |
| `otto reflect [tool\|wiki\|all]` | **Self-improvement.** The local model proposes (never makes) improvements and stages a Claude-ready brief to `raw/improvement-proposals-<date>.md`. |
| `otto story [--voice] [--title "..."]` | Capture or **dictate** an autobiography story. Light cleanup preserves your voice; proofread flags mistranscriptions. Saved to `wiki/projects/autobiography/stories/` (flagged unvalidated) + raw draft. |
| `otto correct "<what's wrong>"` | Locate the wiki page and fix a fact. Trivial unique fix → diff you approve → edits the page. Substantive or ambiguous → staged as a note in `raw/`. |
| `otto note <project> [--voice]` | Free-form capture about any project → `raw/notes-<project>-<date>.md`. |
| `otto queue` | Show everything staged offline, awaiting `wiki-ingest`. |
| `otto handoff` | Summary of all captures + the exact reconnect commands. |

`--voice` records from the mic (press ENTER to stop) and transcribes locally. If the mic
or whisper is unavailable, it falls back to typing automatically.
Without `--text`, typed input opens `$EDITOR` (default `nano`).

## Self-improvement loop

`otto reflect` is the "get better over time" mechanism, designed for the local model's
limits: **it plans and documents, it does not act.** It reviews how you've used Otto and
the shape of your wiki, then writes prioritized proposals (what / why / next step) for Claude
to execute when you're back online. `otto handoff` routes those to the Architect / `improver`
agent. Nothing is changed without Claude in the loop.

## When you reconnect

Run `otto handoff` to see the list, then feed the staged `raw/` files to the real
curator:

```bash
# in Claude Code
/architect wiki-ingest ingest --source raw/<file>.md
```

Otto's job ends at the `raw/` boundary; Claude's disciplined `wiki-ingest` begins there.

## Configuration (env vars)

| Var | Default |
|---|---|
| `SCRIBE_MODEL` | `qwen2.5:14b` (fallback `glm4:latest`) |
| `WIKI_REPO` | `~/Workspaces/wiki` |
| `AA_REPO` | `~/Workspaces/AgentArchitect` |
| `OLLAMA_URL` | `http://localhost:11434` |
| `WHISPER_URL` | `http://localhost:2022/v1/audio/transcriptions` |
| `SCRIBE_MIC` | `2` (ffmpeg avfoundation device index = MacBook Air Microphone) |

Every write is auto-committed locally (only the files Otto touched). Use `--no-commit`
to skip. Nothing is pushed — you sync when you're back online.

## Notes & limits

- Designed for a 24 GB M-series Mac; `qwen2.5:14b` (~9 GB) is the quality/footprint sweet spot.
- The model does capture + light cleanup + page-location. It does **not** synthesize new
  wiki pages or do multi-page reasoning — that waits for Claude on reconnect.
- Voice quality depends on the local whisper model; review transcriptions before accepting.
