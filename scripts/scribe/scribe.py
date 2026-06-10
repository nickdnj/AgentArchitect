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
    scribe index                  Build/refresh the local semantic index of the wiki
    scribe ask "<question>"        One-shot grounded question over your wiki (cited)
    scribe chat                   Conversational second-brain REPL (ask, remember, correct)
    scribe reflect [tool|wiki]    Propose (not make) improvements for Claude to act on later
    scribe story  [--voice]       Capture/dictate an autobiography story (light cleanup)
    scribe correct "<what's wrong>"   Locate a wiki page and fix a fact
    scribe note <project> [--voice]   Free-form project capture -> raw/
    scribe queue                  Show everything staged offline, awaiting wiki-ingest
    scribe handoff                Summarize all offline captures + the reconnect command

Env overrides:
    WIKI_REPO        default ~/Workspaces/wiki
    AA_REPO          default ~/Workspaces/AgentArchitect
    SCRIBE_MODEL     default qwen2.5:14b   (fallback: glm4:latest)
    EMBED_MODEL      default nomic-embed-text
    OLLAMA_URL       default http://localhost:11434
    WHISPER_URL      default http://localhost:2022/v1/audio/transcriptions
    SCRIBE_MIC       default 2   (ffmpeg avfoundation audio device index)
    SCRIBE_INDEX     default ~/.scribe/wiki-index.json
"""

import argparse
import datetime as _dt
import difflib
import math
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

try:
    import termios
    import tty
except ImportError:  # non-POSIX; spacebar push-to-talk falls back to ENTER
    termios = None
    tty = None

import requests

# ----------------------------------------------------------------------------- config
HOME = Path.home()
WIKI_REPO = Path(os.environ.get("WIKI_REPO", HOME / "Workspaces" / "wiki"))
AA_REPO = Path(os.environ.get("AA_REPO", HOME / "Workspaces" / "AgentArchitect"))
AUTOBIO_DIR = AA_REPO / "context-buckets" / "autobiography" / "files"  # legacy raw source
WIKI_STORIES = WIKI_REPO / "projects" / "autobiography" / "stories"     # current home (searchable)
RAW_DIR = WIKI_REPO / "raw"
MANIFEST = RAW_DIR / ".scribe-manifest.json"

PRIMARY_MODEL = os.environ.get("SCRIBE_MODEL", "qwen2.5:14b")
FALLBACK_MODEL = "glm4:latest"
EMBED_MODEL = os.environ.get("EMBED_MODEL", "nomic-embed-text")
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434")
WHISPER_URL = os.environ.get("WHISPER_URL", "http://localhost:2022/v1/audio/transcriptions")
MIC_INDEX = os.environ.get("SCRIBE_MIC", "2")
INDEX_PATH = Path(os.environ.get("SCRIBE_INDEX", HOME / ".scribe" / "wiki-index.json"))
# wiki subdirs/files we never index
INDEX_SKIP = (".git", ".obsidian", "_archive", "_lint", "_changelog", "raw/")

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
def _start_recording():
    wav = Path(tempfile.gettempdir()) / "scribe_rec.wav"
    if wav.exists():
        wav.unlink()
    proc = subprocess.Popen(
        ["ffmpeg", "-nostdin", "-y", "-f", "avfoundation", "-i", f":{MIC_INDEX}",
         "-ar", "16000", "-ac", "1", str(wav)],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, stdin=subprocess.DEVNULL,
    )
    return proc, wav


def _stop_recording(proc):
    proc.terminate()
    try:
        proc.wait(timeout=5)
    except subprocess.TimeoutExpired:
        proc.kill()


def transcribe_wav(wav):
    if not wav.exists() or wav.stat().st_size < 1000:
        err("No audio captured. Check mic permission for your terminal in "
            "System Settings → Privacy → Microphone.")
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


def _wait_for_key(stop_keys):
    """Block until one of stop_keys is pressed (raw tty); ENTER fallback if not a tty."""
    if not sys.stdin.isatty() or termios is None:
        try:
            input()
        except (EOFError, KeyboardInterrupt):
            pass
        return
    fd = sys.stdin.fileno()
    old = termios.tcgetattr(fd)
    try:
        tty.setcbreak(fd)
        while True:
            ch = sys.stdin.read(1)
            if ch in stop_keys:
                return
            if ch == "\x03":  # Ctrl-C
                raise KeyboardInterrupt
    finally:
        termios.tcsetattr(fd, termios.TCSADRAIN, old)


def record_and_transcribe(stop_hint="ENTER", stop_keys=("\n", "\r")):
    """Record from the mic until a stop key, then transcribe via local whisper.cpp."""
    print(c(f"🎙  Recording… speak now. Tap {stop_hint} to stop.", "red"))
    proc, wav = _start_recording()
    try:
        _wait_for_key(stop_keys)
    except KeyboardInterrupt:
        _stop_recording(proc)
        return None
    _stop_recording(proc)
    return transcribe_wav(wav)


def push_to_talk():
    """Tap SPACE to start was already done; record until SPACE/ENTER tapped again."""
    return record_and_transcribe(stop_hint="SPACE", stop_keys=(" ", "\n", "\r"))


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


# ----------------------------------------------------------------------------- semantic index
def embed(text):
    """Return a local embedding vector for text via nomic-embed-text."""
    r = requests.post(f"{OLLAMA_URL}/api/embeddings",
                      json={"model": EMBED_MODEL, "prompt": text}, timeout=120)
    r.raise_for_status()
    return r.json()["embedding"]


def cosine(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    return dot / (na * nb) if na and nb else 0.0


def index_files():
    """Wiki .md files eligible for indexing."""
    out = []
    for p in WIKI_REPO.rglob("*.md"):
        rel = str(p.relative_to(WIKI_REPO))
        if any(rel.startswith(s) or f"/{s}" in f"/{rel}" for s in INDEX_SKIP):
            continue
        out.append(p)
    return out


def chunk_page(path):
    """Split a page into heading-scoped chunks (~250 words max)."""
    text = path.read_text(errors="ignore")
    text = re.sub(r"<!--.*?-->", "", text, flags=re.DOTALL)  # don't index embedded raw transcripts
    rel = str(path.relative_to(WIKI_REPO))
    chunks, heading, buf = [], "", []

    def flush():
        body = "\n".join(buf).strip()
        if body:
            words = body.split()
            for i in range(0, len(words), 250):
                chunks.append({"path": rel, "heading": heading,
                               "text": " ".join(words[i:i + 250])})

    for line in text.splitlines():
        if line.startswith("#"):
            flush()
            buf = []
            heading = line.lstrip("# ").strip()
        else:
            buf.append(line)
    flush()
    return chunks


def load_index():
    if INDEX_PATH.exists():
        try:
            return json.loads(INDEX_PATH.read_text())
        except json.JSONDecodeError:
            return {"files": {}, "chunks": []}
    return {"files": {}, "chunks": []}


def save_index(idx):
    INDEX_PATH.parent.mkdir(parents=True, exist_ok=True)
    INDEX_PATH.write_text(json.dumps(idx))


def build_index(force=False, quiet=False):
    """Incrementally (re)embed changed wiki pages. Returns the index dict."""
    idx = load_index()
    files_meta = {} if force else idx.get("files", {})
    chunks = [] if force else [c for c in idx.get("chunks", [])]
    current = index_files()
    current_rel = {str(p.relative_to(WIKI_REPO)) for p in current}
    # drop chunks/meta for deleted files
    chunks = [c for c in chunks if c["path"] in current_rel]
    files_meta = {k: v for k, v in files_meta.items() if k in current_rel}
    changed = 0
    for p in current:
        rel = str(p.relative_to(WIKI_REPO))
        mtime = p.stat().st_mtime
        if not force and files_meta.get(rel) == mtime:
            continue
        # re-embed this file: drop its old chunks, add fresh
        chunks = [c for c in chunks if c["path"] != rel]
        for ch in chunk_page(p):
            label = f"{rel} :: {ch['heading']}" if ch["heading"] else rel
            ch["embedding"] = embed(f"{label}\n{ch['text']}")
            chunks.append(ch)
        files_meta[rel] = mtime
        changed += 1
        if not quiet:
            print(c(f"  embedded {rel}", "dim"))
    idx = {"files": files_meta, "chunks": chunks, "built": now_stamp()}
    save_index(idx)
    if not quiet:
        ok(f"index ready — {len(chunks)} chunks from {len(files_meta)} pages "
           f"({changed} re-embedded this run)")
    return idx


def retrieve(query, k=8):
    """Return top-k (chunk, score) for a query from the local index."""
    idx = load_index()
    if not idx.get("chunks"):
        idx = build_index(quiet=True)
    qv = embed(query)
    scored = [(c, cosine(qv, c["embedding"])) for c in idx["chunks"]]
    scored.sort(key=lambda x: x[1], reverse=True)
    return scored[:k]


CHAT_SYSTEM = (
    "You are Nick's second brain — a precise assistant grounded in HIS personal wiki. "
    "Answer the question using ONLY the WIKI EXCERPTS provided. "
    "DIRECTLY answer by extracting and presenting the actual information from the excerpts. "
    "Do NOT tell Nick to 'see', 'check', or 'refer to' another page — HE is asking YOU, so "
    "synthesize the answer yourself. If the excerpts contain a list (e.g. projects, people, "
    "tasks), reproduce the relevant items with their key details, don't just name the page. "
    "Cite supporting pages inline in brackets like [projects.md]; the program also prints the "
    "sources afterward. "
    "If the excerpts truly do not contain the answer, say plainly: 'That's not in the wiki.' "
    "You may then add general knowledge ONLY if clearly prefixed with 'OUTSIDE THE WIKI:'. "
    "Never invent personal facts, dates, names, or events that aren't in the excerpts."
)


def answer_question(question, history=None):
    hits = retrieve(question)
    ctx = "\n\n".join(f"### [{c['path']}]"
                      + (f" — {c['heading']}" if c["heading"] else "")
                      + f"\n{c['text']}" for c, _ in hits)
    convo = ""
    if history:
        convo = "RECENT CONVERSATION:\n" + "\n".join(history[-4:]) + "\n\n"
    prompt = f"{convo}WIKI EXCERPTS:\n\n{ctx}\n\nQUESTION: {question}"
    resp, _ = ollama_generate(prompt, system=CHAT_SYSTEM, temperature=0.2)
    sources = []
    for c, s in hits:
        if c["path"] not in [x[0] for x in sources]:
            sources.append((c["path"], s))
    return resp, sources, hits


def stage_memory(text):
    """Stage a proposed memory into raw/ for wiki-ingest."""
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    mf = RAW_DIR / f"proposed-memories-{today()}.md"
    with open(mf, "a") as f:
        f.write(f"\n## {now_stamp()}\n\n{text}\n")
    add_manifest({"type": "proposed-memory", "ts": now_stamp(),
                  "summary": text[:160], "path": str(mf)})
    ok(f"staged proposed memory → {mf}")
    return mf


def stage_task(text):
    """Stage a to-do for Claude to do properly when back online."""
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    tf = RAW_DIR / f"tasks-for-claude-{today()}.md"
    with open(tf, "a") as f:
        f.write(f"\n## {now_stamp()}\n\n{text}\n")
    add_manifest({"type": "task-for-claude", "ts": now_stamp(),
                  "summary": text[:160], "path": str(tf)})
    ok(f"staged task for Claude → {tf}")
    return tf


# ----------------------------------------------------------------------------- intent router
INTENT_SYSTEM = (
    "You are the intent router for Nick's offline second-brain chat. Classify his message "
    "into EXACTLY one intent and reply with STRICT JSON: {\"intent\": \"...\"}. Intents:\n"
    "- chitchat: greetings, thanks, mic/voice tests ('can you hear me'), small talk, or "
    "meta questions about the tool itself. No knowledge lookup needed.\n"
    "- question: he wants information or recall FROM his wiki/knowledge (who/what/when/why, "
    "'tell me about', 'what do I know about').\n"
    "- remember: he wants to SAVE a new fact/memory ('remember that…', 'note that…', 'add a memory').\n"
    "- correct: he wants to FIX or change something already in the wiki ('that's wrong', "
    "'change X to Y', 'it should say…').\n"
    "- task: he wants something DONE or CREATED — draft, write, plan, build, research, "
    "summarize-into-a-doc, an action with a deliverable.\n"
    "- story: he is RECORDING or ADDING an autobiography / memoir story about his own life. "
    "This includes BOTH a short trigger ('add a story', 'I want to tell a story') AND a long "
    "first-person narrative where he is actually telling the story (even if it opens with "
    "chatter like 'ok I'm going to tell a story…'). Any extended personal anecdote about his "
    "past = story.\n"
    "- help: he wants to know what he can do, what the commands are, or HOW to use Scribe "
    "('what can I do', 'how do I…', 'help', 'what are my options', 'how does this work').\n"
    "Default to 'question' only if it is clearly an information request. A LONG first-person "
    "narrative is 'story', never 'chitchat'. Reply with JSON only."
)

_INTENTS = ("chitchat", "question", "remember", "correct", "task", "story", "help")

_GREETING_RE = re.compile(
    r"^(hi|hey|hello|yo|sup|thanks|thank you|thx|ok|okay|cool|nice|test|testing|"
    r"can you hear me|are you there|you there|good (morning|night|evening))\b", re.I)
_HELP_RE = re.compile(
    r"\b(what can (i|you) do|how do i|how does this work|what are my (options|commands)|"
    r"what commands|help me use|^help\b|capabilities)\b", re.I)
# announcements that he's telling/recording a memoir story
_STORY_RE = re.compile(
    r"\b(tell|telling|record|capture|add|share)\b[^.]{0,40}\bstory\b|"
    r"for my (auto)?bio(graphy)?|for my memoir|here'?s a story|a (new|another) story", re.I)
# references to what was JUST said in conversation (not the wiki)
_RECAP_RE = re.compile(
    r"(summari[sz]e|recap|repeat|read back)\b.{0,25}(what i (just )?(said|told)|that|this|my story|it)|"
    r"what did i just (say|tell)", re.I)
_SAVE_THAT_RE = re.compile(
    r"\b(save|make|turn|keep|add)\b.{0,25}(that|this|what i (just )?said|it)\b.{0,20}"
    r"(as |into )?(a )?(story|memoir|autobiography)|save (that|this|it) as a story", re.I)


def classify_intent(msg):
    """Return one of: chitchat, question, remember, correct, task, story, help."""
    low = msg.strip().lower()
    words = low.split()
    if low.startswith("remember ") or low.startswith("note that "):
        return "remember"
    if _STORY_RE.search(low):
        return "story"
    if _HELP_RE.search(low):
        return "help"
    if _GREETING_RE.search(low) or len(words) <= 2:
        return "chitchat"
    try:
        resp, _ = ollama_generate(msg, system=INTENT_SYSTEM, json_mode=True, temperature=0)
        intent = json.loads(resp).get("intent", "question").strip().lower()
        intent = intent if intent in _INTENTS else "question"
    except Exception:  # noqa: BLE001
        intent = "question"
    # a long first-person narrative is never chitchat — it's a story he's telling
    if intent == "chitchat" and len(words) > 40:
        return "story"
    return intent


# Canonical, authoritative capability reference (NOT model-generated — so it's always accurate).
CAPABILITIES = """Here's everything you can do — just talk or type, I'll route it:

ASK & RECALL (your second brain)
  • Ask anything in plain words → I answer from your wiki, with sources.
  • "/sources"  → show the exact excerpts behind my last answer.

TALK
  • Tap SPACE at the prompt → push-to-talk (tap SPACE again to stop).
  • "/voice"  → dictate (press ENTER to stop instead).

CAPTURE (saved now, finalized by Claude when you're back online)
  • "remember <fact>"  or "/remember"   → save a new memory.
  • "/correct <what's wrong>"           → fix a fact in the wiki.
  • "add a story" / "/story"            → record an autobiography story (voice-first).
        Saved into your wiki right away (flagged unvalidated) so you can ask about it,
        and queued for Claude to polish.
  • "/task <do this>"                   → park an action for Claude to do online.

MANAGE
  • "/reindex"  → rebuild search after edits.   "/help" → this list.   "/quit" → exit.

You don't need to remember the slash-commands — just say what you want in normal words."""


def help_reply(msg, history=None):
    """Answer 'what can I do / how do I…' grounded in the accurate CAPABILITIES text."""
    low = msg.strip().lower()
    # exact help asks just get the full canonical list
    if low in ("/help", "help", "what can i do", "what can i do?"):
        return CAPABILITIES
    prompt = (f"SCRIBE CAPABILITIES (authoritative):\n{CAPABILITIES}\n\n"
              f"Nick asks: {msg}\n\nAnswer his specific question using ONLY the capabilities "
              "above. Be concrete: tell him exactly what to say or which command to use. "
              "If unsure, show the full list.")
    resp, _ = ollama_generate(prompt, temperature=0.2,
                              system="You explain how to use Scribe. Accurate, brief, concrete.")
    return resp


CHITCHAT_SYSTEM = (
    "You are Nick's friendly offline assistant (a local model with no internet, called Scribe). "
    "Reply briefly and naturally to this small-talk or meta message — 1-2 sentences. "
    "Do NOT pretend to search a knowledge base or cite pages. If he's testing voice, just "
    "confirm you heard him. If he asks what you can do, tell him to say 'help'."
)


def chitchat_reply(msg, history=None):
    convo = ("Recent conversation:\n" + "\n".join(history[-4:]) + "\n\n") if history else ""
    resp, _ = ollama_generate(convo + msg, system=CHITCHAT_SYSTEM, temperature=0.5)
    return resp


REFLECT_SYSTEM = (
    "You are the reflective, self-improving layer of Nick's offline 'second brain' tool "
    "(called Scribe). You are running on a small LOCAL model with no internet. "
    "Your job is NOT to make changes — you cannot be trusted to act, and Claude (a far more "
    "capable agent) will do the actual work when Nick is back online. "
    "Your job is to PLAN and DOCUMENT: produce concrete, prioritized improvement proposals "
    "that Claude can pick up and execute later. "
    "For each proposal give: a short title, WHAT to improve, WHY it matters, and a concrete "
    "NEXT STEP a capable agent should take. Mark each priority High/Medium/Low. "
    "Be specific and honest about gaps. Do not invent facts about Nick. "
    "Output clean markdown with '## ' headings per proposal, grouped under the given scope."
)


def gather_usage_summary():
    data = load_manifest()
    if not data:
        return "No captures recorded yet this offline session."
    by_type = {}
    for e in data:
        by_type.setdefault(e["type"], 0)
        by_type[e["type"]] += 1
    lines = [f"- {n}× {t}" for t, n in by_type.items()]
    recent = [f"  • {e['ts']} [{e['type']}] {e.get('summary','')[:80]}" for e in data[-8:]]
    return "Activity so far:\n" + "\n".join(lines) + "\nRecent items:\n" + "\n".join(recent)


def gather_wiki_overview():
    rows = []
    for p in index_files():
        rel = str(p.relative_to(WIKI_REPO))
        words = len(p.read_text(errors="ignore").split())
        rows.append((rel, words))
    rows.sort()
    thin = [f"  - {r} ({w} words)" for r, w in rows if w < 40]
    overview = "\n".join(f"  - {r} ({w} words)" for r, w in rows)
    return overview, thin


def cmd_reflect(args):
    scope = (args.scope or "all").lower()
    tool_help = ""
    try:
        tool_help = (Path(__file__).parent / "README.md").read_text()[:3000]
    except OSError:
        pass
    blocks = []
    if scope in ("tool", "all"):
        blocks.append("SCOPE: SCRIBE TOOL\n\nWhat Scribe does (README excerpt):\n"
                      + tool_help + "\n\n" + gather_usage_summary())
    if scope in ("wiki", "all"):
        overview, thin = gather_wiki_overview()
        thin_txt = ("\nPages that look thin (<40 words) — possible stubs:\n" + "\n".join(thin)) if thin else ""
        blocks.append("SCOPE: WIKI / SECOND BRAIN\n\nAll pages with word counts:\n"
                      + overview + thin_txt)
    prompt = ("Produce improvement proposals for the following. Group your output under a "
              f"'# {scope.upper()} improvement proposals' heading.\n\n" + "\n\n---\n\n".join(blocks))
    info(f"Reflecting on '{scope}' (local model, proposing only — no changes)…")
    resp, _ = ollama_generate(prompt, system=REFLECT_SYSTEM, temperature=0.4)

    RAW_DIR.mkdir(parents=True, exist_ok=True)
    rf = RAW_DIR / f"improvement-proposals-{today()}.md"
    header = (f"\n# Improvement proposals — scope: {scope} — {now_stamp()}\n"
              f"_Generated offline by Scribe ({PRIMARY_MODEL}). For Claude to review & act on when back online._\n\n")
    with open(rf, "a") as f:
        f.write(header + resp + "\n")
    print(c("\n" + resp + "\n", "bold"))
    add_manifest({"type": "improvement-proposal", "ts": now_stamp(),
                  "summary": f"{scope} improvement proposals", "path": str(rf)})
    git_commit([rf], f"scribe(reflect): {scope} improvement proposals", no_commit=args.no_commit)
    return 0


# ----------------------------------------------------------------------------- commands
def cmd_index(args):
    info(f"Indexing wiki at {WIKI_REPO} (embed model: {EMBED_MODEL})…")
    build_index(force=args.rebuild)
    return 0


def cmd_ask(args):
    question = args.question or get_text_input(False, label="question")
    if not question:
        err("No question.")
        return 1
    info("Thinking (local, grounded in your wiki)…")
    resp, sources, _ = answer_question(question)
    print(c("\n" + resp + "\n", "bold"))
    if sources:
        print(c("sources:", "dim"))
        for path, score in sources:
            print(c(f"  [{score:.2f}] {path}", "dim"))
    return 0


_VOICE_SENTINEL = "\x00__VOICE__"


def chat_read(prompt="you> "):
    """Read a chat line. Tapping SPACE first triggers push-to-talk; else normal typing.
    Returns the text, the _VOICE_SENTINEL, or None on EOF (quit)."""
    if not sys.stdin.isatty() or termios is None:
        try:
            return input(c(prompt, "cyan"))
        except EOFError:
            return None
    sys.stdout.write(c(prompt, "cyan"))
    sys.stdout.flush()
    fd = sys.stdin.fileno()
    old = termios.tcgetattr(fd)
    try:
        tty.setcbreak(fd)
        ch = sys.stdin.read(1)
    finally:
        termios.tcsetattr(fd, termios.TCSADRAIN, old)
    if ch == " ":                      # spacebar → talk
        sys.stdout.write("\n")
        return _VOICE_SENTINEL
    if ch in ("\n", "\r"):             # empty line
        sys.stdout.write("\n")
        return ""
    if ch == "\x03":                   # Ctrl-C
        raise KeyboardInterrupt
    if ch == "\x04":                   # Ctrl-D
        return None
    # typed character (already echoed by cbreak) — read the rest of the line cooked
    rest = sys.stdin.readline()
    return ch + rest.rstrip("\n")


def cmd_chat(args):
    print(c("\n🧠 Scribe — your offline second brain", "bold"))
    print(c("Type to ask · tap SPACE to talk · say \"help\" anytime · "
            "/story /remember /correct /task /voice /sources /reindex /quit\n", "dim"))
    build_index(quiet=True)
    history = []
    last_hits = []
    last_user_text = ""
    while True:
        try:
            msg = chat_read()
        except KeyboardInterrupt:
            print()
            break
        if msg is None:
            print()
            break
        if msg == _VOICE_SENTINEL:
            v = push_to_talk()
            if not v:
                warn("Didn't catch that — tap SPACE to try again, or type.")
                continue
            msg = v
            print(c(f"you> {msg}", "cyan"))
        msg = msg.strip()
        if not msg:
            continue
        low = msg.lower()
        if low in ("/quit", "/q", "/exit"):
            break
        if low == "/reindex":
            build_index(force=True)
            continue
        if low == "/voice":
            v = record_and_transcribe()
            if not v:
                warn("Didn't catch that — try again or type.")
                continue
            msg = v
            print(c(f"you> {msg}", "cyan"))
            low = msg.lower()
        if low == "/sources":
            if not last_hits:
                info("No previous answer yet.")
            else:
                for ch, s in last_hits:
                    print(c(f"\n[{s:.2f}] {ch['path']}"
                            + (f" — {ch['heading']}" if ch['heading'] else ""), "cyan"))
                    print(ch["text"])
            continue
        if low.startswith("/remember"):
            mem = msg.split(" ", 1)[1].strip() if " " in msg else ask("What should I remember")
            _do_remember(mem, args.no_commit)
            continue
        if low.startswith("/correct"):
            desc = msg.split(" ", 1)[1].strip() if " " in msg else ask("What's wrong")
            if desc:
                _run_correct(desc, no_commit=args.no_commit)
            continue
        if low.startswith("/task"):
            t = msg.split(" ", 1)[1].strip() if " " in msg else ask("What should Claude do")
            _do_task(t, args.no_commit)
            continue
        if low in ("/help", "/?", "/h"):
            print(c("\n" + CAPABILITIES + "\n", "bold"))
            continue
        if low == "/story":
            _do_story(args.no_commit)
            continue

        # ---- conversation self-reference (about what was just said, not the wiki) ----
        if _SAVE_THAT_RE.search(low) and last_user_text:
            print(c("(Saving what you just told me as a story.)", "dim"))
            save_story(last_user_text, no_commit=args.no_commit)
            continue
        if _RECAP_RE.search(low) and last_user_text:
            info("…")
            summary, _ = ollama_generate(
                f"Summarize what Nick just said, in his voice:\n\n{last_user_text}",
                system="Summarize the user's own words concisely. Do not cite or look anything up.")
            print(c("\n" + summary + "\n", "bold"))
            history.append(f"Nick: {msg}")
            history.append(f"Brain: {summary}")
            if confirm("Want to save what you told me as an autobiography story?", default=False):
                save_story(last_user_text, no_commit=args.no_commit)
            continue

        # ---- intent routing for non-command input ----
        intent = classify_intent(msg)
        history.append(f"Nick: {msg}")
        if len(msg.split()) >= 12:   # remember his last substantial utterance
            last_user_text = msg

        if intent == "chitchat":
            reply = chitchat_reply(msg, history)
            print(c("\n" + reply + "\n", "bold"))
            history.append(f"Brain: {reply}")
            continue
        if intent == "help":
            reply = help_reply(msg, history)
            print(c("\n" + reply + "\n", "bold"))
            history.append(f"Brain: {reply}")
            continue
        if intent == "story":
            # if he already SPOKE/typed the story (long), capture THAT — don't re-record
            if len(msg.split()) >= 20:
                print(c("(That sounded like a memoir story — let me capture it.)", "dim"))
                save_story(msg, no_commit=args.no_commit)
            else:
                _do_story(args.no_commit)
            continue
        if intent == "remember":
            _do_remember(msg, args.no_commit)
            continue
        if intent == "correct":
            _run_correct(msg, no_commit=args.no_commit)
            continue
        if intent == "task":
            print(c("(That's an action — I'll stage it for Claude to do properly when you're online.)", "dim"))
            _do_task(msg, args.no_commit)
            continue

        # intent == question -> grounded RAG answer
        info("…")
        resp, sources, hits = answer_question(msg, history)
        last_hits = hits
        print(c("\n" + resp + "\n", "bold"))
        if sources:
            print(c("sources: " + "  ".join(f"[{p}]" for p, _ in sources[:4]), "dim"))
        history.append(f"Brain: {resp}")
        # offer to remember ONLY when a genuine question found nothing in the wiki
        if "not in the wiki" in resp.lower():
            if confirm("That wasn't in your wiki. Add it as a proposed memory?", default=False):
                mem = ask("Phrase the memory to save")
                _do_remember(mem, args.no_commit)
    info("Bye. Run `scribe handoff` to see what you staged.")
    return 0


def _do_remember(mem, no_commit):
    mem = re.sub(r"^(remember|note)\s+(that\s+)?", "", (mem or "").strip(), flags=re.I).strip()
    if mem and confirm(f"Stage this as a proposed memory?\n  “{mem}”", default=True):
        mf = stage_memory(mem)
        git_commit([mf], f"scribe(memory): {mem[:50]}", no_commit=no_commit)


def _do_task(t, no_commit):
    if t and confirm(f"Stage this task for Claude?\n  “{t}”", default=True):
        tf = stage_task(t)
        git_commit([tf], f"scribe(task): {t[:50]}", no_commit=no_commit)


def _do_story(no_commit):
    """Voice-first autobiography capture from inside chat."""
    print(c("Let's record a story. Speak it (or type it).", "bold"))
    if sys.stdin.isatty():
        raw = push_to_talk() if confirm("Use voice?", default=True) else get_text_input(False, label="story")
    else:
        raw = get_text_input(False, label="story")
    if not raw:
        warn("Didn't catch a story — nothing saved.")
        return
    save_story(raw, no_commit=no_commit)


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
    # embedding model + index
    try:
        if EMBED_MODEL in ollama_models() or any(m.startswith(EMBED_MODEL.split(':')[0]) for m in ollama_models()):
            ok(f"embedding model '{EMBED_MODEL}' present (powers ask/chat)")
        else:
            warn(f"embedding model '{EMBED_MODEL}' NOT pulled — ask/chat won't work")
            okall = False
    except Exception:  # noqa: BLE001
        pass
    idx = load_index()
    if idx.get("chunks"):
        ok(f"wiki index: {len(idx['chunks'])} chunks from {len(idx.get('files',{}))} pages (built {idx.get('built','?')})")
    else:
        warn("wiki index not built yet — run `scribe index` (do this before going offline)")
    # paths
    for label, p in [("wiki repo", WIKI_REPO), ("raw/ dir", RAW_DIR),
                     ("autobiography stories (wiki)", WIKI_STORIES)]:
        if p.exists():
            ok(f"{label}: {p}")
        else:
            warn(f"{label} not found yet: {p} (created on first story)")
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
    "You are a light transcription cleaner for a personal memoir. You will receive a spoken "
    "transcript. Make ONLY these changes: fix punctuation and capitalization, add paragraph "
    "breaks, remove filler words (um, uh, you know, like, I mean), and drop META-PREAMBLE where "
    "the speaker announces he's telling a story or addresses the assistant ('okay I'm going to "
    "tell a story', 'I turned off the wifi', 'now I'm talking to you scribe'). "
    "Do NOT condense, merge, summarize, rephrase, reorder, or 'improve' anything. Keep his exact "
    "sentences, wording, repetition, and asides. This is his memoir voice — preserve it verbatim "
    "apart from the mechanical fixes above. Never invent or omit content. Do not add a title or "
    "commentary. Return ONLY the cleaned story text."
)

PROOFREAD_SYSTEM = (
    "You proofread a speech-to-text transcript of a personal memoir. Return STRICT JSON: "
    "{\"title\": \"a short 3-6 word title for this story\", "
    "\"suspects\": [{\"heard\": \"<exact text as transcribed>\", \"guess\": \"<best correction, "
    "or '?' if unsure>\", \"kind\": \"name|place|company|term\"}]}. "
    "Flag ONLY likely speech-to-text errors: proper nouns (people, places, companies) and "
    "technical terms that sound phonetically off or inconsistent. Do NOT flag ordinary words. "
    "Be conservative: at most 8 suspects. 'heard' MUST be the exact substring from the text so "
    "it can be found and replaced. JSON only."
)


def proofread_story(text):
    """Suggest a title + flag likely mistranscribed names/places/terms."""
    try:
        resp, _ = ollama_generate(text, system=PROOFREAD_SYSTEM, json_mode=True, temperature=0)
        d = json.loads(resp)
        return (d.get("title", "") or "").strip(), (d.get("suspects") or [])[:8]
    except Exception:  # noqa: BLE001
        return "", []


def _apply_fixes(fixes_str, *texts):
    """Apply 'wrong=>right; wrong=>right' replacements across all given texts."""
    out, n = list(texts), 0
    for pair in fixes_str.split(";"):
        if "=>" in pair:
            w, r = (x.strip() for x in pair.split("=>", 1))
            if w:
                out = [t.replace(w, r) for t in out]
                n += 1
    return out, n


def save_story(raw, title=None, no_commit=False):
    """Clean a captured story, save it to the wiki (flagged unvalidated), stage a raw
    draft for Claude, and re-index so it's immediately searchable. Shared by CLI + chat."""
    if not raw:
        err("No story captured.")
        return 1
    print(c("\n--- raw input ---", "dim"))
    print(raw)
    info("Cleaning up (light touch, preserving your voice)…")
    cleaned, _ = ollama_generate(raw, system=STORY_SYSTEM, temperature=0.2)
    print(c("\n--- cleaned ---", "bold"))
    print(cleaned)

    # proofread pass: suggest a title + flag likely mistranscribed names/places/terms
    info("Proofreading for likely mistranscriptions…")
    title_sugg, suspects = proofread_story(cleaned)
    if suspects:
        print(c("\n⚠ Check these — speech-to-text often mangles names/places:", "yellow"))
        for s in suspects:
            g = s.get("guess", "?")
            print(c(f"   • \"{s.get('heard','')}\"  →  maybe \"{g}\"  ({s.get('kind','')})", "yellow"))
        fixes = ask("Fixes? e.g.  Sue Fong=>Sufeng; Mototola=>Motorola   (Enter to skip)")
        if fixes.strip():
            (raw, cleaned), n = _apply_fixes(fixes, raw, cleaned)
            ok(f"applied {n} fix(es).")
            print(c("\n--- corrected ---", "bold"))
            print(cleaned)
    print()
    choice = ask("Use [c]leaned, keep [r]aw, or [a]bort?", default="c").lower()
    if choice.startswith("a"):
        warn("Aborted; nothing written.")
        return 1
    body = raw if choice.startswith("r") else cleaned

    title = (title or ask("Short title for this story", default=title_sugg)).strip()
    if not title:
        title = f"untitled story {now_stamp()}"
    slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")[:50]
    WIKI_STORIES.mkdir(parents=True, exist_ok=True)
    nums = [int(m.group(1)) for f in WIKI_STORIES.glob("*.md")
            if (m := re.match(r"(\d+)[-_]", f.name))]
    n = (max(nums) + 1) if nums else 1
    dest = WIKI_STORIES / f"{n:02d}-{slug}.md"
    # save into the wiki: the readable body is your offline "short-term memory";
    # the verbatim raw transcription rides along (HTML comment) so Claude can
    # faithfully reconcile on reconnect even if the raw/ draft is gone.
    raw_block = ("" if body.strip() == raw.strip() else
                 "\n\n<!-- RAW TRANSCRIPTION (verbatim, unedited — for Claude to validate against; "
                 f"not rendered):\n{raw}\n-->\n")
    dest.write_text(
        "---\n"
        f"title: {title}\n"
        "type: autobiography-story\n"
        "status: draft\n"
        "validated_by_claude: false\n"
        f"captured: offline via Scribe ({PRIMARY_MODEL}) on {now_stamp()}\n"
        "---\n\n"
        f"# {title}\n\n"
        "> ⚠️ Captured offline by Scribe — **not yet reviewed by Claude.** "
        "Validate & polish on reconnect.\n\n"
        f"{body}\n"
        f"{raw_block}")
    ok(f"saved to wiki → {dest.relative_to(WIKI_REPO)}  (flagged unvalidated)")

    # stage a full draft in raw/ for Claude — BOTH cleaned and raw, side by side
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    draft = RAW_DIR / f"autobio-story-{slug}-{today()}.md"
    draft.write_text(
        f"# NEW STORY (offline) — {title}\n\n"
        f"Placed UNVALIDATED at `projects/autobiography/stories/{dest.name}` on {now_stamp()}.\n"
        "Claude: reconcile CLEANED against RAW below, fix transcription (esp. names/places), "
        "restore Nick's voice where over-edited, then set `validated_by_claude: true`.\n\n"
        "## Cleaned (placed in wiki)\n\n"
        f"{cleaned}\n\n"
        "## Raw transcription (verbatim — source of truth)\n\n"
        f"{raw}\n")
    add_manifest({"type": "story", "ts": now_stamp(), "title": title,
                  "path": str(dest), "summary": cleaned[:160]})
    git_commit([dest, draft], f"scribe(story): {title} [unvalidated]", no_commit=no_commit)
    # re-index so the new story is immediately searchable in ask/chat
    try:
        build_index(quiet=True)
        ok("indexed — you can ask about this story now.")
    except Exception:  # noqa: BLE001
        warn("saved, but re-index failed; run /reindex or `scribe index`.")
    return 0


def cmd_story(args):
    raw = get_text_input(args.voice, label="story", inline=args.text)
    return save_story(raw, title=args.title, no_commit=args.no_commit)


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


def _run_correct(description, no_commit=False):
    """Shared correction logic, used by `scribe correct` and the chat REPL."""
    info("Searching the wiki for the relevant page…")
    candidates = search_wiki(description)
    if not candidates:
        warn("No matching page found by keyword. Staging a correction note for wiki-ingest.")
        nf = write_correction_note(description)
        git_commit([nf], f"scribe(correction-note): {description[:50]}", no_commit=no_commit)
        return 0
    print(c("Candidate pages:", "dim"))
    for p in candidates:
        print("   ", p.relative_to(WIKI_REPO))
    blocks = []
    for p in candidates:
        rel = p.relative_to(WIKI_REPO)
        blocks.append(f"### FILE: {rel}\n{excerpt_around(p, description)}")
    ctx = "\n\n".join(blocks)
    prompt = (f"CORRECTION REQUEST:\n{description}\n\n"
              f"CANDIDATE FILE EXCERPTS (file paths are repo-relative):\n\n{ctx}")
    info("Asking the local model to locate the exact text…")
    resp, _ = ollama_generate(prompt, system=CORRECT_SYSTEM, json_mode=True, temperature=0)
    try:
        prop = json.loads(resp)
    except json.JSONDecodeError:
        warn("Model did not return valid JSON; staging a correction note instead.")
        nf = write_correction_note(description)
        git_commit([nf], f"scribe(correction-note): {description[:50]}", no_commit=no_commit)
        return 0

    # Tier B or not located -> stage a note
    if not prop.get("located") or prop.get("tier") != "A":
        info(f"Treated as Tier B (substantive) — reason: {prop.get('reason','')}")
        nf = write_correction_note(description, prop)
        git_commit([nf], f"scribe(correction-note): {description[:50]}", no_commit=no_commit)
        return 0

    # Tier A: deterministic, verified exact replace
    rel = prop.get("file", "")
    target = (WIKI_REPO / rel)
    old = prop.get("old_string", "")
    new = prop.get("new_string", "")
    if not target.exists() or not old:
        warn("Proposed target/text invalid; staging a correction note instead.")
        nf = write_correction_note(description, prop)
        git_commit([nf], f"scribe(correction-note): {description[:50]}", no_commit=no_commit)
        return 0
    content = target.read_text()
    count = content.count(old)
    if count != 1:
        warn(f"old_string occurs {count} times in {rel} (need exactly 1) — staging a note for safety.")
        nf = write_correction_note(description, prop)
        git_commit([nf], f"scribe(correction-note): {description[:50]}", no_commit=no_commit)
        return 0

    new_content = content.replace(old, new, 1)
    print(c(f"\nProposed Tier-A edit to {rel}:", "bold"))
    show_diff(old, new, fromfile="current", tofile="proposed")
    print(c(f"reason: {prop.get('reason','')}", "dim"))
    if not confirm("\nApply this edit to the curated page?", default=False):
        if confirm("Stage it as a correction note instead?", default=True):
            nf = write_correction_note(description, prop)
            git_commit([nf], f"scribe(correction-note): {description[:50]}", no_commit=no_commit)
        else:
            warn("Discarded.")
        return 0
    target.write_text(new_content)
    ok(f"applied edit → {rel}")
    add_manifest({"type": "correction-applied", "ts": now_stamp(),
                  "summary": f"{rel}: '{old[:40]}' → '{new[:40]}'", "path": str(target)})
    git_commit([target], f"scribe(correct): {rel} — {prop.get('reason','fix')[:50]}",
               no_commit=no_commit)
    # the edited page changed -> refresh its index entry next query (mtime-based, automatic)
    return 0


def cmd_correct(args):
    description = args.description or get_text_input(False, label="correction")
    if not description:
        err("No correction described.")
        return 1
    return _run_correct(description, no_commit=args.no_commit)


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
              "# 1. Compile captured knowledge into curated wiki pages:",
              "for f in raw/corrections-*.md raw/notes-*.md raw/autobio-additions-*.md "
              "raw/proposed-memories-*.md; do",
              "  node scripts/run-agent.js wiki-ingest --operation ingest --source \"$f\"",
              "done",
              "# 2. Lint the touched subtrees:",
              "node scripts/run-agent.js wiki-ingest --operation lint --scope spine/",
              "```",
              "",
              "In Claude Code: `/architect wiki-ingest ingest --source raw/<file>.md`",
              "",
              "**Tasks for Claude** (if any `raw/tasks-for-claude-*.md` exist): these are "
              "actions you asked for offline — open them and have Claude do them properly. "
              "They are NOT knowledge to ingest.",
              "",
              "**Self-improvement proposals** (if any `raw/improvement-proposals-*.md` exist): "
              "review them with the `improver` agent / Architect — they are plans for Claude to "
              "act on, not changes already made:",
              "```",
              "/architect            # then discuss raw/improvement-proposals-*.md + tasks-for-claude-*.md",
              "```"]
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

    ip = sub.add_parser("index", help="build/refresh the local semantic index of the wiki")
    ip.add_argument("--rebuild", action="store_true", help="re-embed every page from scratch")
    ip.set_defaults(func=cmd_index)

    ap = sub.add_parser("ask", help="one-shot grounded question over your wiki")
    ap.add_argument("question", nargs="?", help="your question (quoted)")
    ap.set_defaults(func=cmd_ask)

    sub.add_parser("chat", help="conversational second-brain REPL").set_defaults(func=cmd_chat)

    rp = sub.add_parser("reflect", help="propose improvements (tool/wiki) for Claude to act on later")
    rp.add_argument("scope", nargs="?", choices=["tool", "wiki", "all"], default="all",
                    help="what to reflect on (default: all)")
    rp.set_defaults(func=cmd_reflect)

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
