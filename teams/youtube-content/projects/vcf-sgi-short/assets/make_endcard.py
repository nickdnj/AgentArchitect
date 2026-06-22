#!/usr/bin/env python3
"""
Generate the full-frame end card: 1080x1920 PNG.
Charcoal background, bold headline, lockup text.
Style: clean tech-museum aesthetic — charcoal/teal.
"""
from PIL import Image, ImageDraw, ImageFont
import os

W, H = 1080, 1920
img = Image.new("RGB", (W, H), (18, 22, 28))  # near-black charcoal
draw = ImageDraw.Draw(img)

# --- Subtle texture / vignette suggestion via gradient overlay ---
# Draw concentric fading ellipses from center to edge (subtle depth)
for i in range(30, 0, -1):
    alpha_val = int(15 * (30 - i) / 30)
    rx = int(W * 0.5 * i / 30)
    ry = int(H * 0.5 * i / 30)
    cx, cy = W // 2, H // 2
    # Use a dark overlay on edges
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=(0, 0, 0, 0))
    # vignette is already charcoal — skip complex blending, keep flat

# Teal top accent bar
TEAL = (0, 200, 180)
draw.rectangle([0, 0, W, 8], fill=TEAL)
# Teal bottom accent bar
draw.rectangle([0, H - 8, W, H], fill=TEAL)

# Thin horizontal rule above headline area
RULE_Y = 480
draw.rectangle([80, RULE_Y, W - 80, RULE_Y + 2], fill=(0, 200, 180, 255))

# --- Font setup ---
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

font_headline = find_font(["Impact.ttf", "ArialBold.ttf", "Arial Bold.ttf", "HelveticaNeue-Bold.ttf", "SFProDisplay-Bold.otf"], 148)
font_brand    = find_font(["Arial Bold.ttf", "ArialBold.ttf", "HelveticaNeue-Bold.ttf", "SFProDisplay-Bold.otf"], 62)
font_location = find_font(["Helvetica.ttf", "Arial.ttf", "ArialMT.ttf", "SFProDisplay-Regular.otf"], 42)
font_cta      = find_font(["Helvetica.ttf", "Arial.ttf", "ArialMT.ttf", "SFProDisplay-Regular.otf"], 48)

WHITE = (255, 255, 255)
TEAL_TEXT = (0, 210, 185)
GRAY_TEXT = (180, 188, 198)

def centered_text(draw, y, text, font, color, shadow=True):
    """Draw horizontally centered text with optional shadow."""
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    x = (W - tw) // 2
    if shadow:
        draw.text((x + 3, y + 3), text, font=font, fill=(0, 0, 0))
    draw.text((x, y), text, font=font, fill=color)

# --- "COME WATCH IT RUN." headline ---
# Break into two lines for large size
line1 = "COME WATCH"
line2 = "IT RUN."

# Measure and place
y_headline = 530
centered_text(draw, y_headline,       line1, font_headline, WHITE)
centered_text(draw, y_headline + 165, line2, font_headline, TEAL_TEXT)

# --- Horizontal rule below headline ---
RULE2_Y = y_headline + 165 + 160
draw.rectangle([80, RULE2_Y, W - 80, RULE2_Y + 2], fill=(0, 200, 180, 255))

# --- Brand lockup ---
Y_BRAND = RULE2_Y + 60
centered_text(draw, Y_BRAND, "VCF Museum @ InfoAge", font_brand, WHITE)

# --- Location line (two lines) ---
Y_LOC1 = Y_BRAND + 90
centered_text(draw, Y_LOC1, "Wall, New Jersey", font_location, GRAY_TEXT, shadow=False)
Y_LOC2 = Y_LOC1 + 58
centered_text(draw, Y_LOC2, "former Camp Evans / Fort Monmouth", font_location, GRAY_TEXT, shadow=False)

# --- Horizontal rule before CTA ---
RULE3_Y = Y_LOC2 + 80
draw.rectangle([160, RULE3_Y, W - 160, RULE3_Y + 1], fill=(60, 70, 80))

# --- CTA line ---
Y_CTA = RULE3_Y + 40
centered_text(draw, Y_CTA, "Hours + directions in bio", font_cta, TEAL_TEXT, shadow=False)

# --- Bottom wordmark area: "VCF" large, subtle ---
Y_WORDMARK = H - 220
# Draw a subtle teal "VCF" watermark
font_watermark = find_font(["Impact.ttf", "ArialBold.ttf", "Arial Bold.ttf"], 96)
bbox = draw.textbbox((0, 0), "VCF", font=font_watermark)
tw = bbox[2] - bbox[0]
wx = (W - tw) // 2
draw.text((wx, Y_WORDMARK), "VCF", font=font_watermark, fill=(0, 200, 180, 60))

out_path = "/Users/nickd/Workspaces/AgentArchitect/teams/youtube-content/projects/vcf-sgi-short/assets/endcard.png"
img.save(out_path, "PNG")
print(f"Saved: {out_path}  ({W}x{H})")
