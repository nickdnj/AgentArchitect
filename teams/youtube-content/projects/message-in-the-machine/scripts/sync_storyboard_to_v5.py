#!/usr/bin/env python3
"""Reconcile the wiki storyboard to the v5 assembly manifest: image paths, per-page
durations + absolute (draft) timings, and the total runtime. Preserves embeds/prose."""
import json, re

SB  = "/Users/nickd/Workspaces/wiki/teams/youtube-content/message-in-the-machine/storyboard.md"
MAN = "/Users/nickd/Workspaces/AgentArchitect/teams/youtube-content/projects/message-in-the-machine/assembly-manifest-v4.json"
m = json.load(open(MAN))

intro = 0.0; montage = 0.0; pdur = {}
for p in m["pages"]:
    n, d = p["n"], float(p["dur"])
    if n in (1, 2, 3):            intro += d
    elif isinstance(n, str):      montage += d          # 33a-d
    else:                         pdur[int(n)] = d
pdur[33] = round(montage, 2)

def fmt(t):
    mm = int(t // 60); return f"{mm:02d}:{t - mm*60:04.1f}"

times = {}; t = round(intro, 2)
for pg in range(4, 36):
    d = pdur[pg]; times[pg] = (fmt(t), fmt(t + d), d); t = round(t + d, 2)
total = t

sb = open(SB).read()

# 1) image path prefixes generated/ -> generated-storybook/ for the actual storybook assets
bases = {p["img"].split("/")[-1] for p in m["pages"] if p["img"].startswith("generated-storybook/")}
for b in bases:
    sb = sb.replace(f"generated/{b}", f"generated-storybook/{b}")

# 2) summary-table rows for pages 4-35: rewrite In-Out (col3) and Dur (col4)
def row(mm):
    n = int(mm.group(1))
    if n not in times: return mm.group(0)
    i, o, d = times[n]
    return f"| {n} |{mm.group(2)}| {i}–{o} | {d:.1f} |{mm.group(5)}"
sb = re.sub(r"^\| (\d+) \|([^|]*)\|([^|]*)\|([^|]*)\|(.*)$", row, sb, flags=re.M)

# 3) per-page **Time:** lines inside each detail block
lines = sb.split("\n"); cur = None; out = []
for ln in lines:
    h = re.match(r"^### Page 0?(\d+)\b", ln)
    if h: cur = int(h.group(1))
    if cur in times and re.match(r"^- \*\*Time:\*\*", ln):
        i, o, d = times[cur]
        ln = f"- **Time:** {i}–{o}  ({d:.1f}s)  *(draft — live intro is a placeholder)*"
    out.append(ln)
sb = "\n".join(out)

# 4) total-runtime strings
for a, b in [("424.77s (7:04.8)", f"{total:.2f}s (7:09.5)"), ("424.77s", f"{total:.2f}s"),
             ("424.77", f"{total:.2f}"), ("07:04.8", "07:09.5"), ("7:04.8", "7:09.5"),
             ("424.8s", f"{total:.1f}s")]:
    sb = sb.replace(a, b)

open(SB, "w").write(sb)
print(f"synced: intro={intro:.2f}s body-start={intro:.2f}s total={total:.2f}s ({len(times)} body pages re-timed, {len(bases)} storybook paths fixed)")
