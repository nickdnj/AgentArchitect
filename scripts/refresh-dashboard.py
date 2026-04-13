#!/usr/bin/env python3
"""
Regenerates dashboard data files from the Agent Architect source of truth.
Run this after creating/modifying agents or teams, or hook it into /sync-agents.

Outputs:
  dashboard-data.json          - Team/agent metadata, stats
  dashboard-skills-compact.json - Full SKILL.md content for every agent
"""

import json
import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AGENTS_DIR = ROOT / "agents"
TEAMS_DIR = ROOT / "teams"
REGISTRY_DIR = ROOT / "registry"
OUTPUT_DATA = ROOT / "dashboard-data.json"
OUTPUT_SKILLS = ROOT / "dashboard-skills-compact.json"


def read_json(path):
    with open(path) as f:
        return json.load(f)


def read_text(path):
    with open(path) as f:
        return f.read()


def extract_purpose(skill_md):
    """Extract the Purpose section from a SKILL.md file."""
    lines = skill_md.split('\n')
    in_purpose = False
    purpose_lines = []
    for line in lines:
        if re.match(r'^##\s+Purpose', line, re.IGNORECASE):
            in_purpose = True
            continue
        if in_purpose:
            if re.match(r'^##\s+', line):
                break
            purpose_lines.append(line)
    text = '\n'.join(purpose_lines).strip()
    # If no Purpose section, use first paragraph after title
    if not text:
        in_body = False
        for line in lines:
            if line.startswith('# ') and not in_body:
                in_body = True
                continue
            if in_body and line.strip():
                purpose_lines.append(line)
            elif in_body and not line.strip() and purpose_lines:
                break
        text = '\n'.join(purpose_lines).strip()
    return text or '(No purpose description available)'


def main():
    print("Refreshing dashboard data...")

    # Load registries
    agents_reg = read_json(REGISTRY_DIR / "agents.json")
    teams_reg = read_json(REGISTRY_DIR / "teams.json")
    buckets_reg = read_json(REGISTRY_DIR / "buckets.json")

    # Build agent lookup from registry
    agent_teams = {}
    for entry in agents_reg.get("agents", []):
        agent_teams[entry["id"]] = entry.get("teams", [])

    # Process teams
    teams = []
    for team_entry in teams_reg.get("teams", []):
        team_dir = ROOT / team_entry["folder"]
        team_json_path = team_dir / "team.json"
        if not team_json_path.exists():
            continue
        team_data = read_json(team_json_path)
        teams.append({
            "id": team_data["id"],
            "name": team_data["name"],
            "description": team_data.get("description", ""),
            "skill_alias": team_data.get("skill_alias", team_data["id"]),
            "created": team_data.get("created", team_entry.get("created", "")),
            "status": team_entry.get("status", "active"),
            "members": team_data.get("members", []),
            "orchestration": team_data.get("orchestration", {}),
            "collaboration_rules": team_data.get("collaboration_rules", {})
        })

    # Process agents
    agents = []
    skills_data = {}
    active_count = 0
    archived_count = 0
    type_counts = {"specialist": 0, "orchestrator": 0, "utility": 0}
    model_counts = {}

    for entry in agents_reg.get("agents", []):
        if entry.get("status") == "archived":
            archived_count += 1
            continue

        agent_dir = ROOT / entry["folder"]
        config_path = agent_dir / "config.json"
        skill_path = agent_dir / "SKILL.md"

        if not config_path.exists():
            continue

        config = read_json(config_path)
        skill_md = read_text(skill_path) if skill_path.exists() else ""
        purpose = extract_purpose(skill_md)

        agent_type = config.get("agent_type", "specialist")
        execution = config.get("execution", {})
        model = execution.get("model", "sonnet")
        expertise = config.get("expertise", {})

        agent = {
            "id": config["id"],
            "name": config["name"],
            "description": config.get("description", ""),
            "agent_type": agent_type,
            "execution": execution,
            "expertise": expertise,
            "mcp_servers": config.get("mcp_servers", []),
            "teams": entry.get("teams", []),
            "purpose": purpose,
            "status": "active",
            "created": entry.get("created", "")
        }
        agents.append(agent)
        skills_data[config["id"]] = {"skill_md": skill_md}

        active_count += 1
        type_counts[agent_type] = type_counts.get(agent_type, 0) + 1
        model_counts[model] = model_counts.get(model, 0) + 1

    # Build stats
    team_agent_counts = {}
    for t in teams:
        team_agent_counts[t["id"]] = len(t["members"])
    unaffiliated = sum(1 for a in agents if not a["teams"])
    if unaffiliated:
        team_agent_counts["unaffiliated"] = unaffiliated

    stats = {
        "total_agents": active_count + archived_count,
        "active_agents": active_count,
        "archived_agents": archived_count,
        "total_teams": len(teams),
        "total_buckets": len(buckets_reg.get("buckets", [])),
        "agents_by_type": type_counts,
        "agents_by_model": model_counts,
        "agents_by_team": team_agent_counts
    }

    # Write dashboard-data.json
    output = {
        "generated_at": str(Path(os.popen("date -u +%Y-%m-%dT%H:%M:%SZ").read().strip())),
        "version": "1.0",
        "teams": teams,
        "agents": agents,
        "buckets": buckets_reg.get("buckets", []),
        "stats": stats
    }
    with open(OUTPUT_DATA, 'w') as f:
        json.dump(output, f, indent=2)
    print(f"  Wrote {OUTPUT_DATA.name}: {len(teams)} teams, {active_count} agents, {stats['total_buckets']} buckets")

    # Write dashboard-skills-compact.json
    with open(OUTPUT_SKILLS, 'w') as f:
        json.dump(skills_data, f, separators=(',', ':'))
    size_kb = OUTPUT_SKILLS.stat().st_size / 1024
    print(f"  Wrote {OUTPUT_SKILLS.name}: {len(skills_data)} agents ({size_kb:.0f} KB)")

    print("Done.")


if __name__ == "__main__":
    main()
