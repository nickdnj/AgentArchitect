#!/usr/bin/env python3
"""Retime manifest page durations to the v23 (script rev v21) Nick-2 audio.

Only the 5 re-recorded segments are rescaled (proportional scale preserves the
deliberate per-page pacing — intro rhythm, Seg-7 montage cuts, closing-card hold).
Seg-4 and Seg-6 audio was reused bit-identical, so those pages are left untouched.
Each changed segment's pages are scaled to its durations.json `_post_atempo` length,
with the rounding residual absorbed by that segment's longest page so the sum is EXACT.
"""
import json
from pathlib import Path

PROJ = Path("/Users/nickd/Workspaces/AgentArchitect/teams/youtube-content/projects/message-in-the-machine")
MAN = PROJ / "assembly-manifest-v4.json"
DUR = Path("/Users/nickd/Workspaces/AgentArchitect/teams/podcast-studio/projects/donkey-kong-infoage/assets/audio/durations.json")

man = json.load(open(MAN))
dur = json.load(open(DUR))
P = man["pages"]

# manifest page-index ranges per segment (0-based, inclusive) + durations.json key
SEGMENTS = [
    ("seg-01-intro",             0, 5,  True),
    ("seg-02-sandhill",          6, 10, True),
    ("seg-03-whattheywerehiding", 11, 16, True),
    ("seg-04-hexdump",           17, 25, True),   # v24: all 7 re-rendered — retime this too
    ("seg-05-ikegami",           26, 30, True),
    ("seg-06-lawsuit",           31, 33, True),   # v24: all 7 re-rendered — retime this too
    ("seg-07-close",             34, 40, True),
]

print(f"{'segment':<28} {'pages':>7} {'old':>8} {'target':>8} {'new':>8}  action")
print("-" * 78)
for key, a, b, rescale in SEGMENTS:
    idxs = list(range(a, b + 1))
    old_sum = round(sum(float(P[i]["dur"]) for i in idxs), 2)
    target = round(float(dur[f"{key}_post_atempo"]), 2)
    if not rescale:
        print(f"{key:<28} {a}-{b:>3} {old_sum:>8.2f} {target:>8.2f} {old_sum:>8.2f}  KEEP (reused audio)")
        continue
    factor = target / old_sum
    scaled = [round(float(P[i]["dur"]) * factor, 2) for i in idxs]
    # fix residual on the longest page so the segment sums EXACTLY to target
    resid = round(target - sum(scaled), 2)
    jmax = max(range(len(idxs)), key=lambda k: scaled[k])
    scaled[jmax] = round(scaled[jmax] + resid, 2)
    for k, i in enumerate(idxs):
        P[i]["dur"] = scaled[k]
    new_sum = round(sum(scaled), 2)
    print(f"{key:<28} {a}-{b:>3} {old_sum:>8.2f} {target:>8.2f} {new_sum:>8.2f}  x{factor:.4f}")

total = round(sum(float(p["dur"]) for p in P), 2)
man["audio_runtime_s"] = round(float(dur["_total"]), 2)
man["version"] = "v17 (retimed to v25 cleaner-flowed audio; Nick's comma/line edits on seg-01/02/03/05)"
json.dump(man, open(MAN, "w"), indent=2)
print("-" * 78)
mm = int(total // 60)
print(f"manifest retimed: {len(P)} pages, video total {total:.2f}s ({mm}:{total-60*mm:05.2f})  | audio {dur['_total']:.2f}s")
