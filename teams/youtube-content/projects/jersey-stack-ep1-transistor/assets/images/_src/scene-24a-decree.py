#!/usr/bin/env python3
"""
Scene 24a: Animated legal document title card — Consent Decree
Duration: 18 seconds at 30fps = 540 frames
Output: 1920x1080, H.264, yuv420p
"""

import math
import os
import shutil
import struct
import zlib
import subprocess

OUTPUT_DIR = "/tmp/scene24a_frames"
OUTPUT_MP4 = "/Users/nickd/Workspaces/AgentArchitect/teams/youtube-content/projects/jersey-stack-ep1-transistor/assets/images/scene-24a.mp4"

W, H = 1920, 1080
FPS = 30
DURATION = 18
TOTAL_FRAMES = FPS * DURATION  # 540

# Colors — parchment/cream palette
BG_COLOR = (244, 239, 228)     # #f4efe4 cream parchment
TEXT_DARK = (30, 25, 20)       # near-black ink
TEXT_MID = (80, 70, 55)        # mid ink for subtext
WATERMARK_COLOR = (200, 190, 175)  # faint watermark
RULE_COLOR = (150, 135, 110)   # horizontal rule lines
ACCENT_COLOR = (100, 60, 30)   # dark seal brown for header

# Animation schedule (in seconds):
# 0.0-1.0:  background fade in
# 1.0-3.0:  header fades in: "UNITED STATES v. WESTERN ELECTRIC"
# 3.0-5.0:  subheader: "CONSENT DECREE — JANUARY 24, 1956"
# 5.0-8.0:  "7,820 PATENTS"  (large, centered)
# 8.0-11.0: "ALL AMERICAN COMPANIES"
# 11.0-14.0: "NOMINAL LICENSE FEE"
# 14.0-17.0: full hold
# 17.0-18.0: slight zoom (handled in FFmpeg post; here just hold)


def ease_in_out(t):
    """Smooth step ease."""
    t = max(0, min(1, t))
    return t * t * (3 - 2 * t)


def fade_alpha(t, start, end):
    """Return 0-1 alpha for a fade between start and end seconds."""
    if t < start:
        return 0.0
    if t > end:
        return 1.0
    return ease_in_out((t - start) / (end - start))


def blend_color(color, bg, alpha):
    """Blend color onto bg with alpha."""
    return tuple(int(c * alpha + b * (1 - alpha)) for c, b in zip(color, bg))


def write_png(filepath, pixels, w, h):
    """Write raw RGB pixel data as PNG."""
    raw = bytearray()
    for row in range(h):
        raw.append(0)
        raw.extend(pixels[row * w * 3:(row + 1) * w * 3])
    compressed = zlib.compress(bytes(raw), 6)

    def chunk(name, data):
        c = name + data
        crc = zlib.crc32(c) & 0xffffffff
        return struct.pack('>I', len(data)) + c + struct.pack('>I', crc)

    sig = b'\x89PNG\r\n\x1a\n'
    ihdr_data = struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)
    ihdr = chunk(b'IHDR', ihdr_data)
    idat = chunk(b'IDAT', compressed)
    iend = chunk(b'IEND', b'')

    with open(filepath, 'wb') as f:
        f.write(sig + ihdr + idat + iend)


def fill_bg(pixels, w, h, color):
    for i in range(w * h):
        pixels[i*3] = color[0]
        pixels[i*3+1] = color[1]
        pixels[i*3+2] = color[2]


def add_paper_texture(pixels, w, h, frame_idx, strength=0.03):
    """Add subtle paper grain using a deterministic pattern."""
    import random
    rng = random.Random(frame_idx // 3)  # changes every 3 frames for subtle flicker
    for _ in range(w * h // 8):
        px = rng.randint(0, w - 1)
        py = rng.randint(0, h - 1)
        delta = rng.randint(-8, 8)
        idx = (py * w + px) * 3
        for c in range(3):
            pixels[idx+c] = max(0, min(255, pixels[idx+c] + delta))


def draw_hline(pixels, w, h, y, x0, x1, color, alpha=1.0):
    """Draw a horizontal line."""
    r, g, b = color
    for x in range(max(0, int(x0)), min(w, int(x1))):
        idx = (y * w + x) * 3
        pixels[idx]   = int(r * alpha + pixels[idx]   * (1 - alpha))
        pixels[idx+1] = int(g * alpha + pixels[idx+1] * (1 - alpha))
        pixels[idx+2] = int(b * alpha + pixels[idx+2] * (1 - alpha))


# ---- Bitmap font renderer (larger 7x9 chars for legibility) ----
# Using a stretched version of the 5x7 font

FONT5x7 = {
    'A': [0b01110,0b10001,0b10001,0b11111,0b10001,0b10001,0b00000],
    'B': [0b11110,0b10001,0b10001,0b11110,0b10001,0b11110,0b00000],
    'C': [0b01110,0b10001,0b10000,0b10000,0b10001,0b01110,0b00000],
    'D': [0b11110,0b10001,0b10001,0b10001,0b10001,0b11110,0b00000],
    'E': [0b11111,0b10000,0b10000,0b11110,0b10000,0b11111,0b00000],
    'F': [0b11111,0b10000,0b10000,0b11110,0b10000,0b10000,0b00000],
    'G': [0b01110,0b10001,0b10000,0b10111,0b10001,0b01111,0b00000],
    'H': [0b10001,0b10001,0b10001,0b11111,0b10001,0b10001,0b00000],
    'I': [0b11111,0b00100,0b00100,0b00100,0b00100,0b11111,0b00000],
    'J': [0b00111,0b00010,0b00010,0b00010,0b10010,0b01100,0b00000],
    'K': [0b10001,0b10010,0b10100,0b11000,0b10100,0b10010,0b10001],
    'L': [0b10000,0b10000,0b10000,0b10000,0b10000,0b11111,0b00000],
    'M': [0b10001,0b11011,0b10101,0b10001,0b10001,0b10001,0b00000],
    'N': [0b10001,0b11001,0b10101,0b10011,0b10001,0b10001,0b00000],
    'O': [0b01110,0b10001,0b10001,0b10001,0b10001,0b01110,0b00000],
    'P': [0b11110,0b10001,0b10001,0b11110,0b10000,0b10000,0b00000],
    'Q': [0b01110,0b10001,0b10001,0b10101,0b10010,0b01101,0b00000],
    'R': [0b11110,0b10001,0b10001,0b11110,0b10010,0b10001,0b00000],
    'S': [0b01111,0b10000,0b10000,0b01110,0b00001,0b11110,0b00000],
    'T': [0b11111,0b00100,0b00100,0b00100,0b00100,0b00100,0b00000],
    'U': [0b10001,0b10001,0b10001,0b10001,0b10001,0b01110,0b00000],
    'V': [0b10001,0b10001,0b10001,0b10001,0b01010,0b00100,0b00000],
    'W': [0b10001,0b10001,0b10101,0b10101,0b11011,0b10001,0b00000],
    'X': [0b10001,0b01010,0b00100,0b00100,0b01010,0b10001,0b00000],
    'Y': [0b10001,0b01010,0b00100,0b00100,0b00100,0b00100,0b00000],
    'Z': [0b11111,0b00010,0b00100,0b01000,0b10000,0b11111,0b00000],
    ' ': [0b00000,0b00000,0b00000,0b00000,0b00000,0b00000,0b00000],
    '.': [0b00000,0b00000,0b00000,0b00000,0b00000,0b00100,0b00000],
    ',': [0b00000,0b00000,0b00000,0b00000,0b00100,0b00100,0b01000],
    '-': [0b00000,0b00000,0b11111,0b00000,0b00000,0b00000,0b00000],
    ':': [0b00000,0b00100,0b00000,0b00000,0b00100,0b00000,0b00000],
    'v': [0b00000,0b00000,0b10001,0b10001,0b01010,0b00100,0b00000],
    '0': [0b01110,0b10001,0b10011,0b10101,0b11001,0b01110,0b00000],
    '1': [0b00100,0b01100,0b00100,0b00100,0b00100,0b01110,0b00000],
    '2': [0b01110,0b10001,0b00001,0b00110,0b01000,0b11111,0b00000],
    '3': [0b11110,0b00001,0b00001,0b01110,0b00001,0b11110,0b00000],
    '4': [0b10001,0b10001,0b11111,0b00001,0b00001,0b00001,0b00000],
    '5': [0b11111,0b10000,0b10000,0b01110,0b00001,0b11110,0b00000],
    '6': [0b01110,0b10000,0b10000,0b11110,0b10001,0b01110,0b00000],
    '7': [0b11111,0b00001,0b00010,0b00100,0b01000,0b01000,0b00000],
    '8': [0b01110,0b10001,0b10001,0b01110,0b10001,0b01110,0b00000],
    '9': [0b01110,0b10001,0b10001,0b01111,0b00001,0b01110,0b00000],
    ',': [0b00000,0b00000,0b00000,0b00100,0b00100,0b01000,0b00000],
}


def text_width(text, scale):
    return len(text) * 6 * scale


def draw_text(pixels, w, h, cx, cy, text, color, scale, alpha=1.0, bg=BG_COLOR):
    """Draw centered text at (cx, cy)."""
    tw = text_width(text, scale)
    x_start = cx - tw // 2
    col_r, col_g, col_b = blend_color(color, bg, alpha)

    px = x_start
    for ch in text:
        bitmap = FONT5x7.get(ch.upper(), FONT5x7.get(' '))
        for row_idx, row_bits in enumerate(bitmap):
            for bit_idx in range(5):
                if row_bits & (1 << (4 - bit_idx)):
                    for sy in range(scale):
                        for sx in range(scale):
                            bx = px + bit_idx * scale + sx
                            by = cy + row_idx * scale + sy
                            if 0 <= bx < w and 0 <= by < h:
                                idx = (by * w + bx) * 3
                                pixels[idx]   = col_r
                                pixels[idx+1] = col_g
                                pixels[idx+2] = col_b
        px += 6 * scale


def render_frame(frame_idx):
    t = frame_idx / FPS

    # Background alpha (fades in 0-1s)
    bg_alpha = fade_alpha(t, 0, 1.0)

    # Create pixels: interpolate from black to parchment
    pixels = bytearray(W * H * 3)
    bg = tuple(int(c * bg_alpha) for c in BG_COLOR)
    fill_bg(pixels, W, H, bg)

    # Add paper texture
    add_paper_texture(pixels, W, H, frame_idx, strength=0.03)

    # --- Watermark / decorative letterhead (faint, appears at t=0.5) ---
    wm_alpha = fade_alpha(t, 0.5, 2.0) * 0.45
    if wm_alpha > 0.01:
        # Thin double-rule at top
        for dy in range(3):
            draw_hline(pixels, W, H, 80 + dy, 80, W - 80, RULE_COLOR, wm_alpha * 0.8)
        for dy in range(2):
            draw_hline(pixels, W, H, 88 + dy, 80, W - 80, RULE_COLOR, wm_alpha * 0.5)
        # Thin double-rule at bottom
        for dy in range(3):
            draw_hline(pixels, W, H, H - 80 + dy, 80, W - 80, RULE_COLOR, wm_alpha * 0.8)
        for dy in range(2):
            draw_hline(pixels, W, H, H - 88 + dy, 80, W - 80, RULE_COLOR, wm_alpha * 0.5)

        # Faint "IN THE UNITED STATES DISTRICT COURT" watermark
        draw_text(pixels, W, H, W//2, 110, "IN THE UNITED STATES DISTRICT COURT",
                  WATERMARK_COLOR, scale=2, alpha=wm_alpha * 0.7, bg=bg)
        draw_text(pixels, W, H, W//2, 140, "FOR THE DISTRICT OF NEW JERSEY",
                  WATERMARK_COLOR, scale=2, alpha=wm_alpha * 0.6, bg=bg)

    # --- Main header: "UNITED STATES v. WESTERN ELECTRIC" ---
    h1_alpha = fade_alpha(t, 1.0, 3.0)
    if h1_alpha > 0.01:
        draw_text(pixels, W, H, W//2, 320, "UNITED STATES",
                  TEXT_DARK, scale=7, alpha=h1_alpha * bg_alpha, bg=bg)
        draw_text(pixels, W, H, W//2, 390, "v. WESTERN ELECTRIC",
                  TEXT_DARK, scale=5, alpha=h1_alpha * bg_alpha, bg=bg)
        # Rule under header
        rule_y = 460
        draw_hline(pixels, W, H, rule_y, 200, W - 200, RULE_COLOR, h1_alpha * bg_alpha * 0.9)
        draw_hline(pixels, W, H, rule_y + 4, 200, W - 200, RULE_COLOR, h1_alpha * bg_alpha * 0.5)

    # --- Subheader: "CONSENT DECREE — JANUARY 24, 1956" ---
    h2_alpha = fade_alpha(t, 3.0, 5.0)
    if h2_alpha > 0.01:
        draw_text(pixels, W, H, W//2, 490, "CONSENT DECREE",
                  ACCENT_COLOR, scale=4, alpha=h2_alpha * bg_alpha, bg=bg)
        draw_text(pixels, W, H, W//2, 540, "JANUARY 24, 1956",
                  TEXT_MID, scale=3, alpha=h2_alpha * bg_alpha, bg=bg)

    # --- Key phrase 1: "7,820 PATENTS" ---
    kp1_alpha = fade_alpha(t, 5.0, 8.0)
    if kp1_alpha > 0.01:
        # Large centered, slightly lower
        draw_text(pixels, W, H, W//2, 650, "7,820 PATENTS",
                  TEXT_DARK, scale=8, alpha=kp1_alpha * bg_alpha, bg=bg)

    # --- Key phrase 2: "ALL AMERICAN COMPANIES" ---
    kp2_alpha = fade_alpha(t, 8.0, 11.0)
    if kp2_alpha > 0.01:
        draw_text(pixels, W, H, W//2, 750, "ALL AMERICAN COMPANIES",
                  TEXT_DARK, scale=5, alpha=kp2_alpha * bg_alpha, bg=bg)

    # --- Key phrase 3: "NOMINAL LICENSE FEE" ---
    kp3_alpha = fade_alpha(t, 11.0, 14.0)
    if kp3_alpha > 0.01:
        draw_text(pixels, W, H, W//2, 840, "NOMINAL LICENSE FEE",
                  TEXT_DARK, scale=5, alpha=kp3_alpha * bg_alpha, bg=bg)

    # Hold from 14s-18s — all elements visible, no change
    # (Ken-burns zoom at 17-18s will be applied in FFmpeg)

    return pixels


def main():
    if os.path.exists(OUTPUT_DIR):
        shutil.rmtree(OUTPUT_DIR)
    os.makedirs(OUTPUT_DIR)

    print(f"Rendering {TOTAL_FRAMES} frames...")
    for f in range(TOTAL_FRAMES):
        if f % 30 == 0:
            print(f"  Frame {f}/{TOTAL_FRAMES}")
        frame_data = render_frame(f)
        frame_path = os.path.join(OUTPUT_DIR, f"frame_{f:04d}.png")
        write_png(frame_path, frame_data, W, H)

    print("Encoding MP4 with FFmpeg (with subtle zoom at end)...")

    # Two-pass: render frames then add Ken-burns zoom on last second
    cmd = [
        "ffmpeg", "-y",
        "-framerate", str(FPS),
        "-i", os.path.join(OUTPUT_DIR, "frame_%04d.png"),
        "-vf", (
            # Subtle zoom: 1.0x at t=14s → 1.04x at t=18s
            "zoompan=z='if(gte(in,14*30),min(zoom+0.001,1.04),1.0)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=30"
        ),
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-crf", "18",
        "-preset", "medium",
        OUTPUT_MP4
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print("FFmpeg error:", result.stderr[-2000:])
        # Fallback: simple encode without zoom
        cmd_simple = [
            "ffmpeg", "-y",
            "-framerate", str(FPS),
            "-i", os.path.join(OUTPUT_DIR, "frame_%04d.png"),
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            "-crf", "18",
            "-preset", "medium",
            OUTPUT_MP4
        ]
        result2 = subprocess.run(cmd_simple, capture_output=True, text=True)
        if result2.returncode != 0:
            print("Fallback FFmpeg error:", result2.stderr[-1000:])
        else:
            print(f"Done (no zoom): {OUTPUT_MP4}")
    else:
        print(f"Done: {OUTPUT_MP4}")

    shutil.rmtree(OUTPUT_DIR)


if __name__ == "__main__":
    main()
