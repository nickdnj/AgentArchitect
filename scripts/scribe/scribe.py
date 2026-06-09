#!/usr/bin/env python3
"""
Offline Scribe — a fully-local capture & staging tool for the wiki + autobiography.

Runs entirely against local services (Ollama + whisper.cpp). No internet required.
The local model NEVER writes files directly: it emits a structured proposal and
deterministic Python applies it after you approve. Substantive work is staged into
the wiki's append-only raw/ layer for the real Claude `wiki-ingest` to compile on
reconnection. Only trivial fixes (with your approval) touch curated pages.

Commands:
    scribe doctor                 Health-check every local dependency
    scribe story  [--voice]       Capture/dictate an autobiography story (light cleanup)
    scribe correct "<what's wrong>"   Locate a wiki page and fix a fact
    scribe note <project> [--voice]   Free-form project capture -> raw/
    scribe queue                  Show everything staged offline, awaiting wiki-ingest
    scribe handoff                Summarize all offline captures + the reconnect command

Env overrides:
    WIKI_REPO        default ~/Workspaces/wiki
    AA_REPO          default ~/Workspaces/AgentArchitect
    SCRIBE_MODEL     default qwen2.5:14b   (fallback: glm4:latest)
    OLLAMA_URL       default http://localhost:11434
    WHISPER_URL      default http://localhost:2022/v1/audio/transcriptions
    SCRIBE_MIC       default 2   (ffmpeg avfoundation audio device index)
"""

import argparse
import datetime as _dt
import difflib
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

import requests

# ----------------------------------------------------------------------------- config
HOME = Path.home()
WIKI_REPO = Path(os.environ.get("WIKI_REPO", HOME / "Workspaces" / "wiki"))
AA_REPO = Path(os.environ.get("AA_REPO", HOME / "Workspaces" / "AgentArchitect"))
AUTOBIO_DIR = AA_REPO / "context-buckets" / "autobiography" / "files"
RAW_DIR = WIKI_REPO / "raw"
MANIFEST = RAW_DIR / ".scribe-manifest.json"

PRIMARY_MODEL = os.environ.get("SCRIBE_MODEL", "qwen2.5:14b")
FALLBACK_MODEL = "glm4:latest"
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434")
WHISPER_URL = os.environ.get("WHISPER_URL", "http://localhost:2022/v1/audio/transcriptions")
MIC_INDEX = os.environ.get("SCRIBE_MIC", "2")

# ----------------------------------------------------------------------------- tty helpers
def c(text, color):
    if not sys.stdout.isatty():
        return text
    codes = {"red": 31, "green": 32, "yellow": 33, "blue": 34, "cyan": 36, "dim": 90, "bold": 1}
    return f"\033[{codes[color]}m{text}\033[0m"


def info(msg):
    print(c("•", "cyan"), msg)


def ok(msg):
    print(c("✓", "green"), msg)


def warn(msg):
    print(c("!", "yellow"), msg)


def err(msg):
    print(c("✗", "red"), msg)


def today():
    return _dt.date.today().isoformat()


def now_stamp():
    return _dt.datetime.now().strftime("%Y-%m-%d %H:%M")


def ask(prompt, default=None):
    suffix = f" [{default}]" if default else ""
    try:
        resp = input(c(f"? {prompt}{suffix}: ", "bold")).strip()
    except EOFError:
        return default or ""
    return resp or (default or "")


def confirm(prompt, default=True):
    d = "Y/n" if default else "y/N"
    resp = ask(f"{prompt} ({d})").lower()
    if not resp:
        return default
    return resp.startswith("y")


# ----------------------------------------------------------------------------- ollama
def ollama_generate(prompt, system="", json_mode=False, temperature=0.2, model=None):
    """Call the local Ollama model. Falls back to glm4 if the primary errors."""
    models = [model] if model else [PRIMARY_MODEL, FALLBACK_MODEL]
    last_err = None
    for m in models:
        payload = {
            "model": m,
            "prompt": prompt,
            "system": system,
            "stream": False,
            "options": {"temperature": temperature},
        }
        if json_mode:
            payload["format"] = "json"
        try:
            r = requests.post(f"{OLLAMA_URL}/api/generate", json=payload, timeout=300)
            r.raise_for_status()
            return r.json()["response"].strip(), m
        except Exception as e:  # noqa: BLE001
            last_err = e
            warn(f"model '{m}' failed ({e}); trying fallback…" if m != models[-1] else f"model '{m}' failed")
    raise RuntimeError(f"All local models failed. Last error: {last_err}")


def ollama_models():
    r = requests.get(f"{OLLAMA_URL}/api/tags", timeout=10)
    r.raise_for_status()
    return [m["name"] for m in r.json().get("models", [])]


# ----------------------------------------------------------------------------- whisper / voice
def record_and_transcribe():
    """Record from the mic with ffmpeg until ENTER, transcribe via local whisper.cpp."""
    wav = Path(tempfile.gettempdir()) / "scribe_rec.wav"
    if wav.exists():
        wav.unlink()
    info("Recording… speak now. Press ENTER to stop.")
    proc = subprocess.Popen(
        ["ffmpeg", "-nostdin", "-y", "-f", "avfoundation", "-i", f":{MIC_INDEX}",
         "-ar", "16000", "-ac", "1", str(wav)],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, stdin=subprocess.DEVNULL,
    )
    try:
        input()
    except (EOFError, KeyboardInterrupt):
        pass
    proc.terminate()
    try:
        proc.wait(timeout=5)
    except subprocess.TimeoutExpired:
        proc.kill()
    if not wav.exists() or wav.stat().st_size < 1000:
        err("No audio captured. Check mic permission for your terminal in System Settings → Privacy → Microphone.")
        return None
    info("Transcribing locally…")
    try:
        with open(wav, "rb") as f:
            r = requests.post(WHISPER_URL, files={"file": f},
                              data={"response_format": "json"}, timeout=300)
        r.raise_for_status()
        text = r.json().get("text", "").strip()
        text = re.sub(r"\[(BLANK_AUDIO|MUSIC|SOUND)\]", "", text).strip()
        return text or None
    except Exception as e:  # noqa: BLE001
        err(f"Whisper transcription failed: {e}")
        return None


def get_text_input(use_voice, label="text", inline=None):
    """Resolve input from: inline arg, voice, piped stdin, or an editor."""
    if inline:
        return inline.strip()
    if use_voice:
        text = record_and_transcribe()
        if text:
            ok("Transcribed.")
            return text
        warn("Falling back to typed input.")
    if not sys.stdin.isatty():
        return sys.stdin.read().strip()
    # open an editor
    editor = os.environ.get("EDITOR", "nano")
    tf = Path(tempfile.gettempdir()) / f"scribe_{label}.md"
    tf.write_text(f"\n# Type your {label} above this line, then save & exit ({editor}).\n")
    subprocess.call([editor, str(tf)])
    raw = tf.read_text()
    raw = "\n".join(l for l in raw.splitlines() if not l.startswith("#")).strip()
    return raw


# ----------------------------------------------------------------------------- git
def git_root(path: Path):
    try:
        d = path.parent if (path.exists() and path.is_file()) else path
        out = subprocess.check_output(
            ["git", "-C", str(d), "rev-parse", "--show-toplevel"],
            stderr=subprocess.DEVNULL)
        # resolve() so symlinked roots (e.g. macOS /tmp -> /private/tmp) match
        return Path(out.decode().strip()).resolve()
    except subprocess.CalledProcessError:
        return None


def git_commit(paths, message, no_commit=False):
    """Commit ONLY the given paths, grouped by repo. Never `git add -A`."""
    if no_commit:
        return
    groups = {}
    for p in paths:
        p = Path(p).resolve()
        root = git_root(p)
        if root:
            groups.setdefault(root, []).append(p)
    for root, ps in groups.items():
        rels = [str(p.relative_to(root)) for p in ps]
        try:
            subprocess.check_call(["git", "-C", str(root), "add", *rels],
                                  stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            subprocess.check_call(["git", "-C", str(root), "commit", "-m", message],
                                  stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            ok(f"committed to {root.name}: {', '.join(rels)}")
        except subprocess.CalledProcessError:
            warn(f"git commit skipped for {root.name} (nothing to commit or hook blocked)")


# ----------------------------------------------------------------------------- manifest
def load_manifest():
    if MANIFEST.exists():
        try:
            return json.loads(MANIFEST.read_text())
        except json.JSONDecodeError:
            return []
    return []


def add_manifest(entry):
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    data = load_manifest()
    data.append(entry)
    MANIFEST.write_text(json.dumps(data, indent=2))


def show_diff(old, new, fromfile="current", tofile="proposed"):
    diff = difflib.unified_diff(old.splitlines(), new.splitlines(),
                                fromfile=fromfile, tofile=tofile, lineterm="")
    for line in diff:
        if line.startswith("+") and not line.startswith("+++"):
            print(c(line, "green"))
        elif line.startswith("-") and not line.startswith("---"):
            print(c(line, "red"))
        elif line.startswith("@@"):
            print(c(line, "cyan"))
        else:
            print(c(line, "dim"))


# ----------------------------------------------------------------------------- commands
def cmd_doctor(args):
    print(c("\nScribe health check\n", "bold"))
    okall = True
    # ollama
    try:
        models = ollama_models()
        if PRIMARY_MODEL in models:
            ok(f"Ollama up — primary model '{PRIMARY_MODEL}' present")
        elif any(m.startswith(PRIMARY_MODEL.split(':')[0]) for m in models):
            ok(f"Ollama up — '{PRIMARY_MODEL}' family present")
        else:
            warn(f"Ollama up but '{PRIMARY_MODEL}' NOT pulled. Have: {', '.join(models)}")
            okall = False
        if FALLBACK_MODEL in models:
            ok(f"fallback model '{FALLBACK_MODEL}' present")
    except Exception as e:  # noqa: BLE001
        err(f"Ollama unreachable at {OLLAMA_URL}: {e}")
        okall = False
    # live generate
    try:
        resp, m = ollama_generate("Reply with exactly the word READY.", temperature=0)
        if "READY" in resp.upper():
            ok(f"model generates correctly ({m})")
        else:
            warn(f"model responded oddly: {resp[:60]!r}")
    except Exception as e:  # noqa: BLE001
        err(f"generation failed: {e}")
        okall = False
    # whisper
    try:
        r = requests.get(WHISPER_URL.replace("/v1/audio/transcriptions", "/"), timeout=3)
        ok(f"Whisper server reachable on {WHISPER_URL.split('/v1')[0]}") if r.ok else warn("whisper responded non-200")
    except Exception as e:  # noqa: BLE001
        warn(f"Whisper not reachable ({e}) — voice will fall back to typing")
    # ffmpeg + mic
    if subprocess.call(["which", "ffmpeg"], stdout=subprocess.DEVNULL) == 0:
        ok(f"ffmpeg present (mic device index SCRIBE_MIC={MIC_INDEX})")
    else:
        warn("ffmpeg missing — voice capture unavailable")
    # paths
    for label, p in [("wiki repo", WIKI_REPO), ("raw/ dir", RAW_DIR),
                     ("autobiography dir", AUTOBIO_DIR)]:
        if p.exists():
            ok(f"{label}: {p}")
        else:
            err(f"{label} MISSING: {p}")
            okall = False
    # git
    for label, p in [("wiki", WIKI_REPO), ("AgentArchitect", AA_REPO)]:
        if (p / ".git").exists():
            ok(f"git repo OK: {label}")
        else:
            warn(f"{label} is not a git repo — auto-commit disabled there")
    print()
    if okall:
        ok("All critical checks passed. You're ready to work offline.")
    else:
        err("Some critical checks failed — fix before going offline (see above).")
    return 0 if okall else 1


STORY_SYSTEM = (
    "You are a careful transcription cleaner for a personal memoir. "
    "You will receive a spoken or typed story. Your ONLY job is to: fix obvious "
    "transcription errors, add sensible paragraph breaks and punctuation, and remove "
    "filler words (um, uh, like). You MUST preserve the speaker's voice, word choices, "
    "and ALL facts and details exactly. NEVER invent, embellish, summarize, or omit "
    "any content. Do not add a title or commentary. Return ONLY the cleaned story text."
)


def cmd_story(args):
    AUTOBIO_DIR.mkdir(parents=True, exist_ok=True)
    raw = get_text_input(args.voice, label="story", inline=args.text)
    if not raw:
        err("No story captured.")
        return 1
    print(c("\n--- raw input ---", "dim"))
    print(raw)
    info("Cleaning up (light touch, preserving your voice)…")
    cleaned, model = ollama_generate(raw, system=STORY_SYSTEM, temperature=0.3)
    print(c("\n--- cleaned ---", "bold"))
    print(cleaned)
    print()
    choice = ask("Use [c]leaned, keep [r]aw, or [a]bort?", default="c").lower()
    if choice.startswith("a"):
        warn("Aborted; nothing written.")
        return 1
    text = raw if choice.startswith("r") else cleaned

    title = (args.title or ask("Short title for this story")).strip()
    if not title:
        title = f"untitled story {now_stamp()}"
    slug = re.sub(r"[^a-z0-9]+", "_", title.lower()).strip("_")[:50]
    # next number
    nums = [int(m.group(1)) for f in AUTOBIO_DIR.glob("*.md")
            if (m := re.match(r"(\d+)_", f.name))]
    n = (max(nums) + 1) if nums else 1
    dest = AUTOBIO_DIR / f"{n:02d}_{slug}.md"
    dest.write_text(f"# {title}\n\n_Captured offline via Scribe on {now_stamp()}_\n\n{text}\n")
    ok(f"wrote story → {dest}")

    # pointer into raw/ so wiki-ingest knows new memoir material exists
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    ptr = RAW_DIR / f"autobio-additions-{today()}.md"
    with open(ptr, "a") as f:
        f.write(f"- {now_stamp()} — new story **{title}** at "
                f"`context-buckets/autobiography/files/{dest.name}`\n")
    add_manifest({"type": "story", "ts": now_stamp(), "title": title,
                  "path": str(dest), "summary": cleaned[:160]})
    git_commit([dest, ptr], f"scribe(story): {title}", no_commit=args.no_commit)
    return 0


CORRECT_SYSTEM = (
    "You are a precise wiki fact-corrector working OFFLINE. You receive a correction "
    "request and candidate file excerpts. Decide if this is a TRIVIAL fix (a misspelling, "
    "wrong name, wrong date/number — Tier A) or a SUBSTANTIVE change (Tier B). "
    "Respond with STRICT JSON only, no prose, with keys: "
    "located (bool), tier ('A'|'B'), file (repo-relative path from the candidates, or ''), "
    "old_string (the EXACT text to replace, copied verbatim from the excerpt, long enough "
    "to be unique — or '' ), new_string (the replacement — or ''), "
    "note (for Tier B: a one-paragraph correction instruction for a human curator), "
    "reason (short). For Tier A, old_string MUST appear verbatim in the shown excerpt. "
    "If you cannot confidently locate the text, set located=false."
)


def search_wiki(query):
    """Keyword search across the wiki via ripgrep/grep; return candidate files."""
    terms = [t for t in re.findall(r"[A-Za-z0-9]{4,}", query)]
    terms = sorted(set(terms), key=len, reverse=True)[:6]
    if not terms:
        return []
    pattern = "|".join(re.escape(t) for t in terms)
    files = {}
    tool = "rg" if subprocess.call(["which", "rg"], stdout=subprocess.DEVNULL) == 0 else "grep"
    try:
        if tool == "rg":
            out = subprocess.check_output(
                ["rg", "-il", "-e", pattern, str(WIKI_REPO)],
                stderr=subprocess.DEVNULL).decode()
        else:
            out = subprocess.check_output(
                ["grep", "-rilE", pattern, str(WIKI_REPO)],
                stderr=subprocess.DEVNULL).decode()
    except subprocess.CalledProcessError:
        return []
    for line in out.splitlines():
        p = Path(line)
        if p.suffix == ".md" and "/.git/" not in line:
            # score by how many terms appear
            try:
                content = p.read_text(errors="ignore").lower()
            except OSError:
                continue
            score = sum(content.count(t.lower()) for t in terms)
            files[p] = score
    return [p for p, _ in sorted(files.items(), key=lambda kv: kv[1], reverse=True)[:5]]


def excerpt_around(path, query, span=12):
    """Return labeled excerpts from a file near query terms."""
    terms = [t.lower() for t in re.findall(r"[A-Za-z0-9]{4,}", query)]
    lines = path.read_text(errors="ignore").splitlines()
    hits = [i for i, l in enumerate(lines) if any(t in l.lower() for t in terms)]
    chunks = []
    for h in hits[:4]:
        lo, hi = max(0, h - span // 2), min(len(lines), h + span // 2)
        chunks.append("\n".join(lines[lo:hi]))
    return "\n…\n".join(chunks) if chunks else "\n".join(lines[:span])


def write_correction_note(description, proposal=None):
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    note_file = RAW_DIR / f"corrections-{today()}.md"
    body = f"\n## {now_stamp()}\n\n**Correction requested:** {description}\n"
    if proposal:
        body += (f"\n- Likely page: `{proposal.get('file','?')}`\n"
                 f"- Suggested change: {proposal.get('note') or proposal.get('reason','')}\n")
    body += "\n_Stage for `wiki-ingest` to apply on reconnection._\n"
    with open(note_file, "a") as f:
        f.write(body)
    add_manifest({"type": "correction-note", "ts": now_stamp(),
                  "summary": description[:160], "path": str(note_file)})
    ok(f"staged correction note → {note_file}")
    return note_file


def cmd_correct(args):
    description = args.description or get_text_input(False, label="correction")
    if not description:
        err("No correction described.")
        return 1
    info("Searching the wiki for the relevant page…")
    candidates = search_wiki(description)
    if not candidates:
        warn("No matching page found by keyword. Staging a correction note for wiki-ingest.")
        nf = write_correction_note(description)
        git_commit([nf], f"scribe(correction-note): {description[:50]}", no_commit=args.no_commit)
        return 0
    print(c("Candidate pages:", "dim"))
    for p in candidates:
        print("   ", p.relative_to(WIKI_REPO))
    # build context for the model
    blocks = []
    for p in candidates:
        rel = p.relative_to(WIKI_REPO)
        blocks.append(f"### FILE: {rel}\n{excerpt_around(p, description)}")
    ctx = "\n\n".join(blocks)
    prompt = (f"CORRECTION REQUEST:\n{description}\n\n"
              f"CANDIDATE FILE EXCERPTS (file paths are repo-relative):\n\n{ctx}")
    info("Asking the local model to locate the exact text…")
    resp, model = ollama_generate(prompt, system=CORRECT_SYSTEM, json_mode=True, temperature=0)
    try:
        prop = json.loads(resp)
    except json.JSONDecodeError:
        warn("Model did not return valid JSON; staging a correction note instead.")
        nf = write_correction_note(description)
        git_commit([nf], f"scribe(correction-note): {description[:50]}", no_commit=args.no_commit)
        return 0

    # Tier B or not located -> stage a note
    if not prop.get("located") or prop.get("tier") != "A":
        info(f"Treated as Tier B (substantive) — reason: {prop.get('reason','')}")
        nf = write_correction_note(description, prop)
        git_commit([nf], f"scribe(correction-note): {description[:50]}", no_commit=args.no_commit)
        return 0

    # Tier A: deterministic, verified exact replace
    rel = prop.get("file", "")
    target = (WIKI_REPO / rel)
    old = prop.get("old_string", "")
    new = prop.get("new_string", "")
    if not target.exists() or not old:
        warn("Proposed target/text invalid; staging a correction note instead.")
        nf = write_correction_note(description, prop)
        git_commit([nf], f"scribe(correction-note): {description[:50]}", no_commit=args.no_commit)
        return 0
    content = target.read_text()
    count = content.count(old)
    if count != 1:
        warn(f"old_string occurs {count} times in {rel} (need exactly 1) — staging a note for safety.")
        nf = write_correction_note(description, prop)
        git_commit([nf], f"scribe(correction-note): {description[:50]}", no_commit=args.no_commit)
        return 0

    new_content = content.replace(old, new, 1)
    print(c(f"\nProposed Tier-A edit to {rel}:", "bold"))
    show_diff(old, new, fromfile="current", tofile="proposed")
    print(c(f"reason: {prop.get('reason','')}", "dim"))
    if not confirm("\nApply this edit to the curated page?", default=False):
        if confirm("Stage it as a correction note instead?", default=True):
            nf = write_correction_note(description, prop)
            git_commit([nf], f"scribe(correction-note): {description[:50]}", no_commit=args.no_commit)
        else:
            warn("Discarded.")
        return 0
    target.write_text(new_content)
    ok(f"applied edit → {rel}")
    add_manifest({"type": "correction-applied", "ts": now_stamp(),
                  "summary": f"{rel}: '{old[:40]}' → '{new[:40]}'", "path": str(target)})
    git_commit([target], f"scribe(correct): {rel} — {prop.get('reason','fix')[:50]}",
               no_commit=args.no_commit)
    return 0


def cmd_note(args):
    project = args.project.lower().strip()
    text = get_text_input(args.voice, label=f"note-{project}", inline=args.text)
    if not text:
        err("No note captured.")
        return 1
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    nf = RAW_DIR / f"notes-{project}-{today()}.md"
    with open(nf, "a") as f:
        f.write(f"\n## {now_stamp()}\n\n{text}\n")
    ok(f"appended note → {nf}")
    add_manifest({"type": "note", "ts": now_stamp(), "project": project,
                  "summary": text[:160], "path": str(nf)})
    git_commit([nf], f"scribe(note:{project}): {text[:50]}", no_commit=args.no_commit)
    return 0


def cmd_queue(args):
    data = load_manifest()
    if not data:
        info("Nothing staged yet. The queue is empty.")
        return 0
    print(c(f"\n{len(data)} item(s) staged offline:\n", "bold"))
    for i, e in enumerate(data, 1):
        tag = c(e["type"], "cyan")
        extra = e.get("title") or e.get("project") or ""
        print(f"{i:>2}. [{tag}] {e['ts']}  {extra}")
        print(c(f"     {e.get('summary','')}", "dim"))
        print(c(f"     → {e.get('path','')}", "dim"))
    return 0


def cmd_handoff(args):
    data = load_manifest()
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    hf = RAW_DIR / f"_handoff-{today()}.md"
    lines = [f"# Scribe offline handoff — {today()}", "",
             f"{len(data)} item(s) captured while offline. "
             "Run the reconnect command below to fold these into the curated wiki.", ""]
    by_type = {}
    for e in data:
        by_type.setdefault(e["type"], []).append(e)
    for t, items in by_type.items():
        lines.append(f"## {t} ({len(items)})")
        for e in items:
            label = e.get("title") or e.get("project") or e.get("summary", "")[:60]
            lines.append(f"- {e['ts']} — {label}  \n  `{e.get('path','')}`")
        lines.append("")
    lines += ["## Reconnect — run when back online", "", "```bash",
              "# Compile every staged raw file into curated wiki pages:",
              "for f in raw/corrections-*.md raw/notes-*.md raw/autobio-additions-*.md; do",
              "  node scripts/run-agent.js wiki-ingest --operation ingest --source \"$f\"",
              "done",
              "# Then lint the touched subtrees:",
              "node scripts/run-agent.js wiki-ingest --operation lint --scope spine/",
              "```",
              "",
              "Or in Claude Code: `/architect wiki-ingest ingest --source raw/<file>.md`"]
    hf.write_text("\n".join(lines))
    ok(f"handoff summary → {hf}")
    print()
    print(hf.read_text())
    return 0


# ----------------------------------------------------------------------------- main
def main():
    p = argparse.ArgumentParser(prog="scribe", description="Offline capture & staging for wiki + autobiography")
    p.add_argument("--no-commit", action="store_true", help="do not auto git-commit")
    sub = p.add_subparsers(dest="cmd", required=True)

    sub.add_parser("doctor", help="health-check local dependencies").set_defaults(func=cmd_doctor)

    sp = sub.add_parser("story", help="capture/dictate an autobiography story")
    sp.add_argument("--voice", action="store_true", help="dictate via microphone")
    sp.add_argument("--title", help="story title")
    sp.add_argument("--text", help="provide story text inline (skips editor)")
    sp.set_defaults(func=cmd_story)

    cp = sub.add_parser("correct", help="locate a wiki page and fix a fact")
    cp.add_argument("description", nargs="?", help="what's wrong (quoted)")
    cp.set_defaults(func=cmd_correct)

    npr = sub.add_parser("note", help="free-form project capture to raw/")
    npr.add_argument("project", help="project name (used in filename)")
    npr.add_argument("--voice", action="store_true", help="dictate via microphone")
    npr.add_argument("--text", help="provide note text inline (skips editor)")
    npr.set_defaults(func=cmd_note)

    sub.add_parser("queue", help="show everything staged offline").set_defaults(func=cmd_queue)
    sub.add_parser("handoff", help="summarize captures + reconnect command").set_defaults(func=cmd_handoff)

    args = p.parse_args()
    try:
        sys.exit(args.func(args))
    except KeyboardInterrupt:
        print()
        warn("interrupted")
        sys.exit(130)


if __name__ == "__main__":
    main()
