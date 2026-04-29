#!/usr/bin/env python3
"""
Split side-by-side composite scene images into two separate files.

Per Nick's storyboard notes: scenes 11, 12, 13, 17 each have a composite where the
left half is a portrait and the right half is an action/context shot. Split at
x=896 (the natural midpoint of these 1792x1024 composites).
"""
from PIL import Image
from pathlib import Path

ASSETS = Path("assets/images")

splits = [
    {
        "scene": 11,
        "source": "scene-11.png",
        "left_name":  "scene-11-bardeen-portrait.png",
        "right_name": "scene-11-bardeen-chalkboard.png",
    },
    {
        "scene": 12,
        "source": "scene-12.png",
        "left_name":  "scene-12-brattain-portrait.png",
        "right_name": "scene-12-brattain-bench.png",
    },
    {
        "scene": 13,
        "source": "scene-13.png",
        "left_name":  "scene-13-shockley-portrait.png",
        "right_name": "scene-13-bardeen-insight.png",
    },
    {
        "scene": 17,
        "source": "scene-17.png",
        "left_name":  "scene-17-shockley-portrait.png",
        "right_name": "scene-17-shockley-hotel.png",
    },
]

for s in splits:
    src = ASSETS / s["source"]
    img = Image.open(src)
    w, h = img.size
    mid = w // 2
    left  = img.crop((0,   0, mid, h))
    right = img.crop((mid, 0, w,   h))
    left_path  = ASSETS / s["left_name"]
    right_path = ASSETS / s["right_name"]
    left.save(left_path)
    right.save(right_path)
    print(f"scene {s['scene']}: {src.name} ({w}x{h}) -> "
          f"{left_path.name} ({left.size[0]}x{left.size[1]}), "
          f"{right_path.name} ({right.size[0]}x{right.size[1]})")
