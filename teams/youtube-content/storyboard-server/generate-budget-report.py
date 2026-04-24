#!/usr/bin/env python3
"""Generate a budget report markdown for a storyboard project.

Usage:
    python3 generate-budget-report.py <slug> [--output PATH] [--server URL]

Reads from the running storyboard server (default http://127.0.0.1:8500)
so the report reflects live ffprobe measurements. Writes a markdown table
of per-scene pacing — narration length, video length, scene duration, max
image slots, actual attached count, and status.

Default output: ../projects/<slug>/script/budget-report.md
"""
import argparse
import json
import sys
import urllib.error
import urllib.request
from datetime import datetime
from pathlib import Path


STATUS_EMOJI = {
    "ok": "—",           # no slots (video-driven or empty)
    "under": "○",        # room for more
    "at_capacity": "✓",  # optimal
    "over": "⚠",         # assembler will drop
}


def fetch_budget(server: str, slug: str) -> dict:
    url = f"{server.rstrip('/')}/p/{slug}/budget"
    try:
        with urllib.request.urlopen(url, timeout=30) as r:
            return json.loads(r.read())
    except urllib.error.URLError as e:
        print(f"ERROR fetching {url}: {e}", file=sys.stderr)
        print("Is the storyboard server running? `python3 server.py` in storyboard-server/", file=sys.stderr)
        sys.exit(2)


def fetch_storyboard(server: str, slug: str) -> dict:
    url = f"{server.rstrip('/')}/p/{slug}/storyboard-data.json"
    try:
        with urllib.request.urlopen(url, timeout=30) as r:
            return json.loads(r.read())
    except urllib.error.URLError as e:
        print(f"ERROR fetching {url}: {e}", file=sys.stderr)
        sys.exit(2)


def build_report(slug: str, data: dict, budgets: dict) -> str:
    scenes = data.get("scenes", [])
    title = data.get("project") or slug
    now = datetime.now().isoformat(timespec="seconds")

    total_scene = sum(b.get("scene_seconds", 0) for b in budgets.values())
    total_narr = sum(b.get("narration_seconds", 0) for b in budgets.values())
    total_video = sum(b.get("video_seconds", 0) for b in budgets.values())
    over = sum(1 for b in budgets.values() if b.get("status") == "over")
    at_cap = sum(1 for b in budgets.values() if b.get("status") == "at_capacity")
    under = sum(1 for b in budgets.values() if b.get("status") == "under")

    lines = []
    lines.append(f"# Budget Report — {title}")
    lines.append("")
    lines.append(f"Generated: `{now}`  ·  Slug: `{slug}`  ·  10s image floor · video plays native")
    lines.append("")
    lines.append("## Summary")
    lines.append("")
    m, s = divmod(total_scene, 60)
    lines.append(f"- Total runtime (video): **{int(m)}m {s:04.1f}s**")
    lines.append(f"- Total narration: {total_narr:.1f}s")
    lines.append(f"- Total video: {total_video:.1f}s")
    lines.append(f"- Scenes over capacity: **{over}** (assembler will drop trailing images)")
    lines.append(f"- Scenes at optimal fill: {at_cap}")
    lines.append(f"- Scenes under capacity (room for more): {under}")
    lines.append("")
    lines.append("## Per-scene budget")
    lines.append("")
    lines.append("| # | Title | Narr (s) | Video (s) | Scene (s) | Max img | Attached | Status | Mode |")
    lines.append("|---|---|---:|---:|---:|---:|---:|:---:|:---|")
    for s in scenes:
        sid = s.get("id")
        if sid is None:
            continue
        b = budgets.get(str(sid), {})
        status = b.get("status", "?")
        emoji = STATUS_EMOJI.get(status, "?")
        mode = b.get("mode", "?")
        lines.append(
            f"| {sid} | {s.get('title','')} "
            f"| {b.get('narration_seconds',0):.1f} "
            f"| {b.get('video_seconds',0):.1f} "
            f"| {b.get('scene_seconds',0):.1f} "
            f"| {b.get('max_images',0)} "
            f"| {b.get('attached_images',0)} "
            f"| {emoji} {status} "
            f"| {mode} |"
        )
    lines.append("")

    overs = [(s.get("id"), s.get("title","")) for s in scenes
             if budgets.get(str(s.get("id")), {}).get("status") == "over"]
    if overs:
        lines.append("## Scenes over capacity")
        lines.append("")
        for sid, title_s in overs:
            b = budgets.get(str(sid), {})
            dropped = b.get("attached_images", 0) - b.get("max_images", 0)
            lines.append(f"- **Scene {sid}** — {title_s}: attached {b.get('attached_images')} images, "
                         f"max {b.get('max_images')} — assembler will drop {dropped}")
        lines.append("")

    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug", help="project slug (must match projects/<slug>/)")
    ap.add_argument("--server", default="http://127.0.0.1:8500")
    ap.add_argument("--output", default=None,
                    help="output path (default: ../projects/<slug>/script/budget-report.md)")
    args = ap.parse_args()

    budgets = fetch_budget(args.server, args.slug)
    data = fetch_storyboard(args.server, args.slug)
    report = build_report(args.slug, data, budgets)

    if args.output:
        out = Path(args.output)
    else:
        here = Path(__file__).resolve().parent
        out = here.parent / "projects" / args.slug / "script" / "budget-report.md"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(report, encoding="utf-8")
    print(f"Wrote {out}  ({len(report)} bytes, {len(budgets)} scenes)")


if __name__ == "__main__":
    main()
