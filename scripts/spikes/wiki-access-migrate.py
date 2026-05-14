#!/usr/bin/env python3
"""
Bulk-add wiki_access blocks to agent config.json files and inject a
"Wiki Knowledge Base" section near the top of each SKILL.md.

Usage:
    python scripts/spikes/wiki-access-migrate.py <agent-id> <team-id> [--light-email]
    python scripts/spikes/wiki-access-migrate.py <agent-id> --utility

Idempotent: skips agents that already have wiki_access.

--utility mode: service agent that serves multiple teams. Skips
team-specific paths; only loads seven-habits + spine/preferences read.
"""

import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
AGENTS = REPO / "agents"


def build_wiki_access(team_id: str, agent_id: str, light_email: bool, utility: bool = False) -> dict:
    if utility:
        return {
            "repo_root": "${WIKI_REPO}",
            "read": [
                "spine/preferences/",
            ],
            "write_via_ingest": [],
            "session_log": f"_sessions/utilities/{agent_id}/",
            "always_load": [
                "spine/preferences/seven-habits-of-effective-agents.md",
            ],
        }
    always_load = [
        "spine/preferences/seven-habits-of-effective-agents.md",
        f"teams/{team_id}/_team.md",
    ]
    if light_email:
        always_load.append("spine/preferences/light-theme-emails.md")
    return {
        "repo_root": "${WIKI_REPO}",
        "read": [
            "spine/preferences/",
            f"teams/{team_id}/",
        ],
        "write_via_ingest": [],
        "session_log": f"teams/{team_id}/_sessions/{agent_id}/",
        "always_load": always_load,
    }


def patch_config(agent_id: str, team_id: str, light_email: bool, utility: bool = False) -> str:
    path = AGENTS / agent_id / "config.json"
    if not path.exists():
        return f"SKIP {agent_id}: config.json not found"
    with path.open() as f:
        cfg = json.load(f)
    if "wiki_access" in cfg:
        return f"SKIP {agent_id}: wiki_access already present"

    cfg["wiki_access"] = build_wiki_access(team_id, agent_id, light_email, utility)

    # Add an _note to context_buckets if it exists with assigned items
    cb = cfg.get("context_buckets")
    if cb and cb.get("assigned") and "_note" not in cb:
        cb["_note"] = "Kept alongside wiki_access by design. RAG/context bucket bytes do not duplicate into the wiki."

    with path.open("w") as f:
        json.dump(cfg, f, indent=2)
        f.write("\n")
    return f"OK   {agent_id}: wiki_access added"


WIKI_SECTION_TEMPLATE = """\

## Wiki Knowledge Base (read at startup)

You have wiki access at `~/Workspaces/wiki/`. Two pages auto-load into your prompt (see "Wiki Knowledge Base Access" appendix at the bottom):

1. **`spine/preferences/seven-habits-of-effective-agents.md`** — operating philosophy.
2. **`teams/{team_id}/_team.md`** — your team page. Read this first for team operating context, active projects, and tone rules.{light_email_line}

You also have read access to all of `spine/preferences/` and `teams/{team_id}/`. Pull additional pages on demand. You do NOT write to the wiki — if a session surfaces stable new knowledge worth keeping, flag it for the orchestrator as a `wiki-ingest` candidate.

### Session logging

After a non-trivial session, append a one-paragraph summary to `~/Workspaces/wiki/teams/{team_id}/_sessions/{agent_id}/YYYY-MM-DD.md`.
"""

UTILITY_SECTION_TEMPLATE = """\

## Wiki Knowledge Base (read at startup)

You are a **service utility** called by multiple teams. One page auto-loads (see "Wiki Knowledge Base Access" appendix at the bottom):

1. **`spine/preferences/seven-habits-of-effective-agents.md`** — operating philosophy. As a service agent, Habit 3 (Put First Things First) is load-bearing — do exactly what the calling agent asked, return the result, do not freelance.

You have read access to `spine/preferences/`. You are **team-agnostic** — when called, you operate purely on the inputs the calling agent gives you. You do NOT auto-load any team context; if the caller needs team-specific behavior, they pass it in the request.

You do NOT write to the wiki. If a session produces output a calling agent might want to file, return it to them — they decide whether to surface it as a `wiki-ingest` candidate.
"""


def patch_skill(agent_id: str, team_id: str, light_email: bool, utility: bool = False) -> str:
    path = AGENTS / agent_id / "SKILL.md"
    if not path.exists():
        return f"SKIP {agent_id}: SKILL.md not found"
    body = path.read_text()
    if "## Wiki Knowledge Base" in body:
        return f"SKIP {agent_id}: SKILL.md already has Wiki Knowledge Base section"

    if utility:
        section = UTILITY_SECTION_TEMPLATE
    else:
        light_email_line = ""
        if light_email:
            light_email_line = "\n3. **`spine/preferences/light-theme-emails.md`** — load-bearing for your HTML output. White backgrounds, dark text, never dark themes."

        section = WIKI_SECTION_TEMPLATE.format(
            team_id=team_id,
            agent_id=agent_id,
            light_email_line=light_email_line,
        )

    # Inject after the first H2 section (## Purpose / ## Persona / etc.).
    # Find first H2, then the next H2, and insert just before the second one.
    headings = list(re.finditer(r"^## ", body, re.MULTILINE))
    if len(headings) < 2:
        # Fall back: append after first H1 + first paragraph
        match = re.search(r"^# .*?\n\n.*?\n", body, re.MULTILINE | re.DOTALL)
        if match:
            insert_at = match.end()
        else:
            insert_at = len(body)
    else:
        insert_at = headings[1].start()

    new_body = body[:insert_at] + section + "\n" + body[insert_at:]
    path.write_text(new_body)
    return f"OK   {agent_id}: SKILL.md patched"


def main():
    args = sys.argv[1:]
    if len(args) < 1:
        print(__doc__)
        sys.exit(2)
    agent_id = args[0]
    utility = "--utility" in args
    if utility:
        print(patch_config(agent_id, "_utility_", False, utility=True))
        print(patch_skill(agent_id, "_utility_", False, utility=True))
        return
    if len(args) < 2:
        print(__doc__)
        sys.exit(2)
    team_id = args[1]
    light_email = "--light-email" in args
    print(patch_config(agent_id, team_id, light_email))
    print(patch_skill(agent_id, team_id, light_email))


if __name__ == "__main__":
    main()
