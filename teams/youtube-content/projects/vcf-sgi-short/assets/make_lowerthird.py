#!/usr/bin/env python3
"""
Generate a transparent lower-third overlay: map-pin + "WALL, NEW JERSEY" + subtitle.
Output: 1080 x 220px PNG, transparent background.
Style: tech-museum — charcoal/teal with bold Impact-adjacent type.
"""
from PIL import Image, ImageDraw, ImageFont
import os

W, H = 1080, 220
img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# --- Background pill / bar ---
# Charcoal semi-transparent bar
BAR_X1, BAR_Y1 = 0, 30
BAR_X2, BAR_Y2 = W, H
# Gradient-ish: draw two rects, slightly different alpha
draw.rectangle([BAR_X1, BAR_Y1, BAR_X2, BAR_Y2], fill=(20, 25, 30, 215))
# Teal accent stripe on top
draw.rectangle([BAR_X1, BAR_Y1, BAR_X2, BAR_Y1 + 5], fill=(0, 200, 180, 255))

# --- Font setup ---
# Prefer system fonts in order of preference
def find_font(names, size):
    search_dirs = [
        "/System/Library/Fonts/",
        "/Library/Fonts/",
        os.path.expanduser("~/Library/Fonts/"),
        "/usr/share/fonts/truetype/",
    ]
    for name in names:
        for d in search_dirs:
            for root, dirs, files in os.walk(d):
                for f in files:
                    if f.lower() == name.lower() or f.lower().startswith(name.lower().split(".")[0].lower()):
                        try:
                            return ImageFont.truetype(os.path.join(root, f), size)
                        except:
                            pass
    return ImageFont.load_default()

font_bold = find_font(["Impact.ttf", "Arial Bold.ttf", "ArialBold.ttf", "Helvetica Bold.ttf", "HelveticaNeue-Bold.ttf", "SFProDisplay-Bold.otf"], 72)
font_sub  = find_font(["Helvetica.ttf", "Arial.ttf", "ArialMT.ttf", "SFProDisplay-Regular.otf", "HelveticaNeue.ttf"], 34)

# --- Map pin icon (drawn, no external asset) ---
PIN_CX, PIN_CY_TOP = 68, 80   # center x, top of pin head
PIN_R = 28                      # circle radius
TEAL = (0, 210, 185, 255)
WHITE = (255, 255, 255, 255)

# Pin circle
draw.ellipse([PIN_CX - PIN_R, PIN_CY_TOP, PIN_CX + PIN_R, PIN_CY_TOP + PIN_R*2], fill=TEAL, outline=WHITE, width=3)
# Pin tail (triangle pointing down)
tail_points = [
    (PIN_CX - 10, PIN_CY_TOP + PIN_R*2 - 8),
    (PIN_CX + 10, PIN_CY_TOP + PIN_R*2 - 8),
    (PIN_CX,      PIN_CY_TOP + PIN_R*2 + 22),
]
draw.polygon(tail_points, fill=TEAL)
# Inner dot on pin
draw.ellipse([PIN_CX - 9, PIN_CY_TOP + PIN_R - 9, PIN_CX + 9, PIN_CY_TOP + PIN_R + 9], fill=(20, 25, 30, 255))

# --- Primary text: WALL, NEW JERSEY ---
TEXT_X = PIN_CX + PIN_R + 22
TEXT_Y = BAR_Y1 + 22

# Shadow for readability
draw.text((TEXT_X + 2, TEXT_Y + 2), "WALL, NEW JERSEY", font=font_bold, fill=(0, 0, 0, 180))
draw.text((TEXT_X, TEXT_Y), "WALL, NEW JERSEY", font=font_bold, fill=(255, 255, 255, 255))

# --- Subtitle ---
SUB_Y = TEXT_Y + 82
draw.text((TEXT_X + 1, SUB_Y + 1), "minutes from the Jersey Shore", font=font_sub, fill=(0, 0, 0, 160))
draw.text((TEXT_X, SUB_Y), "minutes from the Jersey Shore", font=font_sub, fill=(0, 210, 185, 255))

out_path = "/Users/nickd/Workspaces/AgentArchitect/teams/youtube-content/projects/vcf-sgi-short/assets/lowerthird-wallnj.png"
img.save(out_path, "PNG")
print(f"Saved: {out_path}  ({W}x{H})")
