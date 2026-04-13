#!/usr/bin/env python3
"""
Claude Code Session Browser
Scans session files, extracts metadata, and displays a searchable session history.
Supports tagging sessions and generating `claude -r` resume commands.

Usage:
  python3 scripts/sessions.py                  # List recent sessions (last 20)
  python3 scripts/sessions.py --all            # List all sessions
  python3 scripts/sessions.py --search "stove" # Search by prompt/content
  python3 scripts/sessions.py --tag <id> "label"  # Tag a session with a label
  python3 scripts/sessions.py --tags           # List only tagged sessions
  python3 scripts/sessions.py --project <dir>  # Filter by project directory
  python3 scripts/sessions.py --json           # Output as JSON
"""

import json
import re
import sys
import glob
import argparse
from datetime import datetime, timezone
from pathlib import Path

CLAUDE_DIR = Path.home() / ".claude"
PROJECTS_DIR = CLAUDE_DIR / "projects"
TAGS_FILE = CLAUDE_DIR / "session-tags.json"

# ─── Colors ───
class C:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    CYAN = "\033[36m"
    GREEN = "\033[32m"
    YELLOW = "\033[33m"
    MAGENTA = "\033[35m"
    RED = "\033[31m"
    BLUE = "\033[34m"
    WHITE = "\033[97m"
    BG_DARK = "\033[48;5;236m"

def no_color():
    for attr in dir(C):
        if not attr.startswith('_'):
            setattr(C, attr, '')

# ─── Tag Management ───
def load_tags():
    if TAGS_FILE.exists():
        with open(TAGS_FILE) as f:
            return json.load(f)
    return {}

def save_tags(tags):
    with open(TAGS_FILE, 'w') as f:
        json.dump(tags, f, indent=2)

def tag_session(session_id, label):
    tags = load_tags()
    # Support partial IDs
    full_id = resolve_session_id(session_id)
    if not full_id:
        print(f"{C.RED}Session not found: {session_id}{C.RESET}")
        return
    tags[full_id] = {
        "label": label,
        "tagged_at": datetime.now(timezone.utc).isoformat()
    }
    save_tags(tags)
    print(f"{C.GREEN}Tagged{C.RESET} {full_id[:8]} as {C.BOLD}{label}{C.RESET}")

def resolve_session_id(partial):
    """Resolve a partial session ID to a full one."""
    all_files = glob.glob(str(PROJECTS_DIR / "*" / "*.jsonl"))
    for f in all_files:
        sid = Path(f).stem
        if sid.startswith(partial):
            return sid
    return None

# ─── Session Extraction ───
def extract_session_meta(filepath):
    """Extract metadata from a session .jsonl file."""
    path = Path(filepath)
    sid = path.stem
    project_dir = path.parent.name

    # Decode project path from directory name
    project_path = project_dir.replace('-', '/', 1) if project_dir.startswith('-') else project_dir
    # The encoding replaces / with - and removes leading /
    project_path = '/' + project_dir.lstrip('-').replace('-', '/')

    stat = path.stat()
    modified = datetime.fromtimestamp(stat.st_mtime)
    size_kb = stat.st_size / 1024

    first_prompt = None
    first_timestamp = None
    last_timestamp = None
    message_count = 0
    user_count = 0
    assistant_count = 0
    git_branch = None
    cwd = None
    try:
        with open(filepath) as f:
            for line in f:
                try:
                    obj = json.loads(line)
                    msg_type = obj.get('type', '')

                    if msg_type == 'user' and not obj.get('isMeta'):
                        user_count += 1
                        if not first_prompt:
                            content = obj.get('message', {}).get('content', [])
                            text = None
                            if isinstance(content, list):
                                for block in content:
                                    if isinstance(block, dict) and block.get('type') == 'text':
                                        text = block['text']
                                        break
                            elif isinstance(content, str):
                                text = content
                            if text:
                                # Extract skill/command name from XML tags
                                cmd = re.search(r'<command-name>(/[\w-]+)</command-name>', text)
                                if cmd:
                                    first_prompt = cmd.group(1)
                                else:
                                    # Strip any remaining XML tags
                                    clean = re.sub(r'<[^>]+>', '', text).strip()
                                    first_prompt = clean[:120] if clean else '(empty)'
                            first_timestamp = obj.get('timestamp')

                    elif msg_type == 'assistant':
                        assistant_count += 1

                    if not git_branch and obj.get('gitBranch'):
                        git_branch = obj['gitBranch']
                    if not cwd and obj.get('cwd'):
                        cwd = obj['cwd']

                    # Track last timestamp
                    ts = obj.get('timestamp')
                    if ts:
                        last_timestamp = ts

                    message_count += 1

                except json.JSONDecodeError:
                    pass
    except Exception:
        return None

    # Calculate duration
    duration_min = None
    if first_timestamp and last_timestamp:
        try:
            t1 = datetime.fromisoformat(first_timestamp.replace('Z', '+00:00'))
            t2 = datetime.fromisoformat(last_timestamp.replace('Z', '+00:00'))
            duration_min = int((t2 - t1).total_seconds() / 60)
        except:
            pass

    return {
        'session_id': sid,
        'project_dir': project_dir,
        'project_path': cwd or project_path,
        'first_prompt': first_prompt or '(no prompt)',
        'modified': modified,
        'created': first_timestamp,
        'git_branch': git_branch or 'unknown',
        'user_messages': user_count,
        'assistant_messages': assistant_count,
        'total_messages': message_count,
        'duration_min': duration_min,
        'size_kb': size_kb,
    }

def scan_sessions(project_filter=None):
    """Scan all session files and return metadata."""
    if project_filter:
        # Encode project path like Claude does
        encoded = project_filter.replace('/', '-')
        patterns = [str(PROJECTS_DIR / f"*{encoded}*" / "*.jsonl")]
    else:
        patterns = [str(PROJECTS_DIR / "*" / "*.jsonl")]

    files = []
    for pattern in patterns:
        files.extend(glob.glob(pattern))

    sessions = []
    for f in files:
        meta = extract_session_meta(f)
        if meta:
            sessions.append(meta)

    # Sort by modified time, newest first
    sessions.sort(key=lambda s: s['modified'], reverse=True)
    return sessions

# ─── Display ───
def format_time_ago(dt):
    """Format a datetime as relative time."""
    now = datetime.now()
    diff = now - dt
    seconds = diff.total_seconds()

    if seconds < 60:
        return "just now"
    elif seconds < 3600:
        m = int(seconds / 60)
        return f"{m}m ago"
    elif seconds < 86400:
        h = int(seconds / 3600)
        return f"{h}h ago"
    elif seconds < 604800:
        d = int(seconds / 86400)
        return f"{d}d ago"
    else:
        return dt.strftime("%b %d")

def project_short(path):
    """Shorten a project path for display."""
    if not path:
        return "?"
    parts = path.rstrip('/').split('/')
    if len(parts) > 2:
        return '/'.join(parts[-2:])
    return path

def display_sessions(sessions, tags, show_resume=True):
    """Display sessions in a formatted table."""
    if not sessions:
        print(f"{C.DIM}No sessions found.{C.RESET}")
        return

    # Header
    print()
    print(f"  {C.BOLD}{C.WHITE}{'ID':>10}  {'When':<10} {'Msgs':>5} {'Dur':>6}  {'Branch':<12} {'Project':<28} Prompt{C.RESET}")
    print(f"  {C.DIM}{'─'*110}{C.RESET}")

    for s in sessions:
        sid_short = s['session_id'][:8]
        when = format_time_ago(s['modified'])
        msgs = f"{s['user_messages']}/{s['assistant_messages']}"
        dur = f"{s['duration_min']}m" if s['duration_min'] else "—"
        branch = s['git_branch'][:12]
        project = project_short(s['project_path'])[:28]
        prompt = s['first_prompt'][:50]

        # Check for tag
        tag = tags.get(s['session_id'])
        tag_str = f" {C.MAGENTA}[{tag['label']}]{C.RESET}" if tag else ""

        # Color the ID based on recency
        id_color = C.GREEN if when in ('just now',) or 'm ago' in when else C.CYAN if 'h ago' in when else C.DIM

        print(f"  {id_color}{sid_short}{C.RESET}  {C.DIM}{when:<10}{C.RESET} {C.WHITE}{msgs:>5}{C.RESET} {C.DIM}{dur:>6}{C.RESET}  {C.YELLOW}{branch:<12}{C.RESET} {C.BLUE}{project:<28}{C.RESET} {prompt}{tag_str}")

    print()

    if show_resume:
        print(f"  {C.DIM}Resume a session:{C.RESET}  claude -r {C.CYAN}<id>{C.RESET}")
        print(f"  {C.DIM}Tag a session:{C.RESET}     python3 scripts/sessions.py --tag {C.CYAN}<id>{C.RESET} {C.GREEN}\"label\"{C.RESET}")
        print()

def display_json(sessions, tags):
    """Output sessions as JSON."""
    output = []
    for s in sessions:
        entry = {**s}
        entry['modified'] = s['modified'].isoformat()
        tag = tags.get(s['session_id'])
        if tag:
            entry['tag'] = tag['label']
        entry['resume_command'] = f"claude -r {s['session_id']}"
        output.append(entry)
    print(json.dumps(output, indent=2))

# ─── Main ───
def main():
    parser = argparse.ArgumentParser(description="Claude Code Session Browser")
    parser.add_argument('--all', action='store_true', help='Show all sessions (default: last 20)')
    parser.add_argument('--search', '-s', type=str, help='Search sessions by prompt text')
    parser.add_argument('--tag', nargs=2, metavar=('ID', 'LABEL'), help='Tag a session with a label')
    parser.add_argument('--tags', action='store_true', help='Show only tagged sessions')
    parser.add_argument('--project', '-p', type=str, help='Filter by project directory path')
    parser.add_argument('--json', action='store_true', help='Output as JSON')
    parser.add_argument('--no-color', action='store_true', help='Disable colors')
    parser.add_argument('-n', type=int, default=20, help='Number of sessions to show (default: 20)')
    args = parser.parse_args()

    if args.no_color or not sys.stdout.isatty():
        no_color()

    # Handle tagging
    if args.tag:
        tag_session(args.tag[0], args.tag[1])
        return

    tags = load_tags()

    # Handle tagged-only view
    if args.tags:
        sessions = scan_sessions(args.project)
        sessions = [s for s in sessions if s['session_id'] in tags]
        if args.json:
            display_json(sessions, tags)
        else:
            print(f"\n  {C.BOLD}{C.MAGENTA}Tagged Sessions{C.RESET}")
            display_sessions(sessions, tags)
        return

    # Scan sessions
    sessions = scan_sessions(args.project)

    # Search filter
    if args.search:
        query = args.search.lower()
        sessions = [s for s in sessions if
            query in s['first_prompt'].lower() or
            query in s.get('project_path', '').lower() or
            query in s.get('git_branch', '').lower() or
            query in tags.get(s['session_id'], {}).get('label', '').lower()
        ]

    # Limit
    if not args.all:
        sessions = sessions[:args.n]

    # Display
    if args.json:
        display_json(sessions, tags)
    else:
        project_info = f" in {C.BLUE}{args.project}{C.RESET}" if args.project else ""
        search_info = f" matching {C.GREEN}\"{args.search}\"{C.RESET}" if args.search else ""
        count = len(sessions)
        total = len(scan_sessions(args.project)) if not args.all else count

        print(f"\n  {C.BOLD}{C.WHITE}Claude Code Sessions{C.RESET}{project_info}{search_info}")
        print(f"  {C.DIM}Showing {count} of {total} sessions{C.RESET}")
        display_sessions(sessions, tags)

if __name__ == '__main__':
    main()
