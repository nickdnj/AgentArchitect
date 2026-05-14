#!/usr/bin/env python3
"""
Appends a "Session Log (MANDATORY)" section to each team's
orchestrator_instructions. Idempotent — skips teams that already have it.

Usage:
    python scripts/spikes/add-session-log-instructions.py
"""

import json
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
TEAMS = REPO / "teams"

# Map AgentArchitect team_id → wiki team-slug
WIKI_SLUG = {
    "altium-solutions": "altium",
    "hardware-dev": "hardware-dev",
    "personal-assistant": "personal-assistant",
    "saltwater-ads": "saltwater-ads",
    "software-project": "software-project",
    "wharfside-board-assistant": "wharfside",
    "youtube-content": "youtube-content",
}

MARKER = "## Wiki Session Log (MANDATORY)"

TEMPLATE = """

{marker}

After every substantive interaction with Nick (anything that lasted more than a quick yes/no exchange OR produced an artifact, decision, or specialist briefing), append a one-paragraph summary to:

`~/Workspaces/wiki/teams/{wiki_slug}/_sessions/YYYY-MM-DD.md`

(Create the file if it does not exist. Append in chronological order — newest at the bottom of the day's file. Use today's date in YYYY-MM-DD format.)

The summary should cover:
- **Asked:** one line — what Nick requested
- **Specialists:** which agents invoked (if any)
- **Output:** key artifacts produced, paths to files created, decisions made
- **Wiki-ingest candidates:** any facts surfaced that should become permanent wiki pages (flag explicitly for next ingest pass)

This is the continuous session-logging surface that the `wiki-ingest` agent reads during the nightly lint to promote wiki-worthy content to permanent pages. **The wiki replaces the `/save` slash command for session continuity — but only if you write to it.**

Skip the session log for trivial exchanges: pure yes/no answers, single-fact lookups, conversational meta-questions with no work product.
"""


def main():
    for team_dir, wiki_slug in WIKI_SLUG.items():
        path = TEAMS / team_dir / "team.json"
        if not path.exists():
            print(f"SKIP {team_dir}: team.json not found")
            continue
        with path.open() as f:
            cfg = json.load(f)
        orch = cfg.get("orchestration") or {}
        existing = orch.get("orchestrator_instructions", "")
        if MARKER in existing:
            print(f"SKIP {team_dir}: session-log section already present")
            continue
        section = TEMPLATE.format(marker=MARKER, wiki_slug=wiki_slug)
        orch["orchestrator_instructions"] = existing + section
        cfg["orchestration"] = orch
        with path.open("w") as f:
            json.dump(cfg, f, indent=2)
            f.write("\n")
        print(f"OK   {team_dir}: appended (wiki_slug={wiki_slug})")


if __name__ == "__main__":
    main()
