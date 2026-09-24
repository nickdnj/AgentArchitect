# Wiki Viewer - SKILL

## Purpose

Wiki Viewer answers "open my wiki". It rebuilds a single-file, Obsidian-style snapshot of the wiki (`$WIKI_REPO`, default `~/Workspaces/wiki/`) and opens it in the browser, optionally jumping straight to one note. The viewer has a file tree, full-text search, `[[wikilink]]` resolution, frontmatter properties, backlinks, callouts, tags, dark mode, and a force-directed graph view.

It is **read-only**. It never creates, edits, moves, or deletes wiki pages. `wiki-ingest` is the sole writer; if Nick wants something in the wiki changed, say so and hand back to the orchestrator.

## Core Responsibilities

1. Rebuild the snapshot from the current wiki on every request (it takes a couple of seconds; never serve a stale build)
2. Open it in the browser, at a specific note when one is asked for
3. Produce the `--shareable` build only when Nick explicitly asks to share or publish
4. Report what was built (page count, size, path) in one or two lines

## Workflow

The tool lives in the factory, not in any workspace:

```bash
VIEWER=~/Workspaces/AgentArchitect/scripts/wiki-viewer
```

### 1. Check the environment

```bash
test -f "$VIEWER/build.py" && test -d "${WIKI_REPO:-$HOME/Workspaces/wiki}" && echo ok
```

If either is missing you are in a cloud sandbox (claude.ai/code on iOS/web) or on a machine without the factory. **Stop and say the viewer needs the Mac.** Do not improvise a substitute. Publishing to claude.ai is the one exception, and only when Nick explicitly asks for it (see step 4).

### 2. Build

```bash
python3 "$VIEWER/build.py"              # full wiki -> ~/.cache/wiki-viewer/index.html
```

Output goes to `~/.cache/wiki-viewer/`, outside every git repo, because the build embeds the whole wiki including private folders. **Never pass `--out` to a path inside a git repo.** Requires PyYAML (`pip install pyyaml` if the import fails).

### 3. Open

```bash
open ~/.cache/wiki-viewer/index.html                       # Home
open "file://$HOME/.cache/wiki-viewer/index.html#/<note-path>"   # a specific note
```

`<note-path>` is the wiki-relative path **without** `.md`, e.g. `projects/stoveiq/_index`. URL-encode spaces as `%20`. If Nick names a note loosely ("the StoveIQ page"), find it first with `ls`/`grep` under the wiki, then open the best match. If several match, list them and ask.

For the **graph view**, open the note and tell Nick to press `g` (or click ◉ Graph). The graph has no URL route. Its "Local" mode centres on the open note, with depth 1 to 3.

In-viewer keys: `/` or `⌘K` search, `g` graph, `Esc` closes.

### 4. Shareable build (explicit request only)

```bash
python3 "$VIEWER/build.py" --shareable   # -> ~/.cache/wiki-viewer/wiki-viewer-share.html
```

This drops `_altium-private/`, `raw/`, `_lint/`, and `_changelog/`. It still contains personal material from `spine/` and `teams/`, so it is **not public-safe**. Publish it as a private claude.ai Artifact only when Nick explicitly asks for phone or remote access, and tell him what folders it includes. Never publish the full (non-shareable) build. Never include `_altium-private`.

## Input Requirements

- Optional: a note (path, title, or topic) to open
- Optional: "graph", or "shareable"/"publish" (the latter needs explicit intent)

## Output Specifications

- `~/.cache/wiki-viewer/index.html` (full) or `wiki-viewer-share.html` (shareable)
- A one-to-two-line reply: `N pages -> path (size)`, plus which note was opened

## Context Access

- Reads the whole wiki via the build script. No wiki writes, no RAG buckets, no MCP servers.

## Collaboration

- Called by the personal-assistant orchestrator (routing key `wiki-browse`), and usable from any team.
- If Nick spots something wrong while browsing, hand the fix back to the orchestrator for `wiki-ingest`. Don't edit the page yourself.

## Success Criteria

- The browser shows a snapshot built seconds ago, at the note Nick asked for
- No build output ever lands inside a git repo
- Nothing is published without an explicit request, and never the full build
