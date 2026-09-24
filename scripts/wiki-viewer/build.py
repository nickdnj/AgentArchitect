#!/usr/bin/env python3
"""Build a single-file, Obsidian-style browser viewer for the wiki ($WIKI_REPO, default ~/Workspaces/wiki).

    python3 scripts/wiki-viewer/build.py              # everything -> ~/.cache/wiki-viewer/index.html
    python3 scripts/wiki-viewer/build.py --shareable  # drops private/ops folders -> wiki-viewer-share.html
    python3 scripts/wiki-viewer/build.py --out DIR    # write somewhere else

The output embeds the wiki's content, so it defaults to a cache dir outside every repo. Re-run to refresh.
Used by the wiki-viewer agent (agents/wiki-viewer/).
"""
import argparse
import json
import os
import re
from pathlib import Path

import yaml

WIKI = Path(os.environ.get("WIKI_REPO") or Path.home() / "Workspaces" / "wiki").expanduser()
OUT_DIR = Path.home() / ".cache" / "wiki-viewer"
SKIP_ALWAYS = {".git", ".obsidian", ".trash", "Untitled"}
# Folders left out of the shareable build: private material and machine-generated noise.
SKIP_SHAREABLE = {"_altium-private", "raw", "_lint", "_changelog"}
FM_RE = re.compile(r"\A---\s*\n(.*?)\n---\s*\n?", re.S)


def load_pages(skip):
    pages = []
    for p in sorted(WIKI.rglob("*.md")):
        rel = p.relative_to(WIKI)
        if any(part in skip for part in rel.parts):
            continue
        text = p.read_text(encoding="utf-8", errors="replace")
        fm, body = {}, text
        m = FM_RE.match(text)
        if m:
            try:
                fm = yaml.safe_load(m.group(1)) or {}
                if not isinstance(fm, dict):
                    fm = {}
            except yaml.YAMLError:
                fm = {}
            body = text[m.end():]
        path = str(rel)[:-3]
        title = fm.get("title") or rel.stem
        if rel.stem in ("_index", "_team") and not fm.get("title"):
            title = f"{rel.parent.name} ({rel.stem})"
        pages.append({
            "p": path,
            "t": str(title),
            "fm": json.loads(json.dumps(fm, default=str)),
            "b": body,
            "m": int(p.stat().st_mtime),
        })
    return pages


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--shareable", action="store_true")
    ap.add_argument("--out", type=Path, default=OUT_DIR, help=f"output directory (default {OUT_DIR})")
    args = ap.parse_args()
    skip = SKIP_ALWAYS | (SKIP_SHAREABLE if args.shareable else set())
    pages = load_pages(skip)
    data = json.dumps(pages, ensure_ascii=False).replace("</", "<\\/")
    tpl = (Path(__file__).parent / "template.html").read_text(encoding="utf-8")
    html = tpl.replace("/*__WIKI_DATA__*/[]", data)
    out_dir = args.out.expanduser()
    out_dir.mkdir(parents=True, exist_ok=True)
    out = out_dir / ("wiki-viewer-share.html" if args.shareable else "index.html")
    out.write_text(html, encoding="utf-8")
    print(f"{len(pages)} pages -> {out} ({out.stat().st_size / 1e6:.1f} MB)")


if __name__ == "__main__":
    main()
