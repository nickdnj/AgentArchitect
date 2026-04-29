#!/usr/bin/env python3
"""
Generate Scene 14 title card — "December 23, 1947 — The afternoon before Christmas Eve"

Cinematic black-on-black with a hairline rule. Matches the documentary style of
the rest of the storyboard. 1792x1024 to match other scene-14 assets.
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

W, H = 1792, 1024
out = Path("assets/images/scene-14-title-card-dec-23-1947.png")

bg = Image.new("RGB", (W, H), (8, 8, 10))
draw = ImageDraw.Draw(bg)

candidate_fonts = [
    "/System/Library/Fonts/Supplemental/Times New Roman.ttf",
    "/System/Library/Fonts/Supplemental/Times New Roman Bold.ttf",
    "/System/Library/Fonts/Supplemental/Georgia.ttf",
    "/System/Library/Fonts/Supplemental/Georgia Bold.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
]

def load_font(size, prefer_bold=False):
    for f in candidate_fonts:
        if prefer_bold and "Bold" not in f:
            continue
        try:
            return ImageFont.truetype(f, size)
        except OSError:
            continue
    for f in candidate_fonts:
        try:
            return ImageFont.truetype(f, size)
        except OSError:
            continue
    return ImageFont.load_default()

main_font = load_font(120, prefer_bold=True)
sub_font  = load_font(48)

main_text = "DECEMBER 23, 1947"
sub_text  = "The afternoon before Christmas Eve."

mb = draw.textbbox((0, 0), main_text, font=main_font)
mw, mh = mb[2] - mb[0], mb[3] - mb[1]
sb = draw.textbbox((0, 0), sub_text, font=sub_font)
sw, sh = sb[2] - sb[0], sb[3] - sb[1]

gap = 60
total_h = mh + gap + sh
top = (H - total_h) // 2

main_x = (W - mw) // 2
main_y = top - mb[1]
draw.text((main_x, main_y), main_text, font=main_font, fill=(232, 226, 210))

sub_x = (W - sw) // 2
sub_y = top + mh + gap - sb[1]
draw.text((sub_x, sub_y), sub_text, font=sub_font, fill=(180, 174, 160))

rule_y = top + mh + (gap // 2)
rule_w = 240
rule_x0 = (W - rule_w) // 2
draw.line([(rule_x0, rule_y), (rule_x0 + rule_w, rule_y)], fill=(140, 134, 120), width=2)

bg.save(out)
print(f"wrote {out} ({W}x{H})")
