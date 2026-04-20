#!/usr/bin/env python3
"""
Scene 9a: Animated hexagonal lattice with electrons and holes
Duration: 15 seconds at 30fps = 450 frames
Output: 1920x1080, H.264, yuv420p
"""

import math
import os
import shutil
import struct
import zlib

OUTPUT_DIR = "/tmp/scene09a_frames"
OUTPUT_MP4 = "/Users/nickd/Workspaces/AgentArchitect/teams/youtube-content/projects/jersey-stack-ep1-transistor/assets/images/scene-09a.mp4"

W, H = 1920, 1080
FPS = 30
DURATION = 15
TOTAL_FRAMES = FPS * DURATION  # 450

# Colors
BG_COLOR = (15, 17, 23)       # #0f1117 dark navy
HEX_COLOR = (80, 90, 110)     # thin light-grey hex outlines
ELECTRON_COLOR = (80, 160, 255)  # blue electrons
HOLE_COLOR = (220, 60, 60)    # red holes
TEXT_COLOR = (200, 200, 210)

# Hexagonal lattice params
HEX_RADIUS = 52   # radius of each hexagon (center to vertex)
HEX_GAP = 4       # gap between hexagons

def hex_center(col, row, r, gap):
    """Compute pixel center of hexagon at grid (col, row)."""
    w = r * math.sqrt(3) + gap
    h_step = r * 1.5 + gap * 0.5
    x = col * w + (row % 2) * (w / 2) + r + gap
    y = row * h_step + r + gap
    return (x, y)

def hex_vertices(cx, cy, r):
    """Return list of (x,y) for hexagon vertices (flat-top)."""
    pts = []
    for i in range(6):
        angle = math.pi / 180 * (60 * i - 30)
        pts.append((cx + r * math.cos(angle), cy + r * math.sin(angle)))
    return pts

# Pre-compute lattice centers
ROWS = 9
COLS = 12
lattice = []
for row in range(ROWS):
    for col in range(COLS):
        cx, cy = hex_center(col, row, HEX_RADIUS, HEX_GAP)
        # Keep if visible in frame (with some margin)
        if -HEX_RADIUS <= cx <= W + HEX_RADIUS and -HEX_RADIUS <= cy <= H + HEX_RADIUS:
            lattice.append((cx, cy))

# Fixed hole positions — 4 lattice nodes that are "holes" (red gaps)
# Pick specific indices from the lattice list, spread across the frame
hole_count = 4
total_nodes = len(lattice)
hole_indices = set([
    int(total_nodes * 0.15),
    int(total_nodes * 0.38),
    int(total_nodes * 0.62),
    int(total_nodes * 0.82),
])

# Electron paths — 13 electrons with organic drift
import random
random.seed(42)

class Electron:
    def __init__(self, idx):
        # Start spread across the lattice
        node_idx = int(total_nodes * (idx / 13.0))
        base_x, base_y = lattice[node_idx % total_nodes]
        self.x = base_x + random.uniform(-HEX_RADIUS * 2, HEX_RADIUS * 2)
        self.y = base_y + random.uniform(-HEX_RADIUS * 2, HEX_RADIUS * 2)
        # Drift velocity: mostly left-to-right
        self.vx = random.uniform(1.2, 2.8)
        self.vy = random.uniform(-0.4, 0.4)
        # Organic wander phase
        self.phase = random.uniform(0, math.pi * 2)
        self.wander_amp = random.uniform(0.3, 0.7)
        self.wander_freq = random.uniform(0.05, 0.12)

    def pos(self, t):
        """Position at time t (seconds). Wraps around screen."""
        x = self.x + self.vx * t * 45  # scale speed to pixels/sec
        y = self.y + self.vy * t * 45 + math.sin(self.phase + t * self.wander_freq * 2 * math.pi) * self.wander_amp * 30
        # Wrap horizontally
        x = ((x + 100) % (W + 200)) - 100
        # Clamp vertically with soft bounce
        if y < 60:
            y = 60 + abs(y - 60) * 0.3
        if y > H - 60:
            y = H - 60 - abs(y - (H - 60)) * 0.3
        return (x, y)

electrons = [Electron(i) for i in range(13)]

# ---- PNG writing helpers (no Pillow dependency) ----

def write_png(filepath, pixels, w, h):
    """Write raw RGB pixel data as PNG file."""
    def adler32(data):
        a, b = 1, 0
        for byte in data:
            a = (a + byte) % 65521
            b = (b + a) % 65521
        return (b << 16) | a

    # Build raw image data (scanlines with filter byte 0)
    raw = bytearray()
    for row in range(h):
        raw.append(0)  # filter type None
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

def draw_line(pixels, w, h, x0, y0, x1, y1, color, alpha=1.0):
    """Draw an anti-aliased line using Xiaolin Wu's algorithm."""
    r, g, b = color

    def plot(x, y, c):
        xi, yi = int(x), int(y)
        if 0 <= xi < w and 0 <= yi < h:
            idx = (yi * w + xi) * 3
            # Blend
            fr = int(r * c * alpha + pixels[idx] * (1 - c * alpha))
            fg = int(g * c * alpha + pixels[idx + 1] * (1 - c * alpha))
            fb = int(b * c * alpha + pixels[idx + 2] * (1 - c * alpha))
            pixels[idx] = max(0, min(255, fr))
            pixels[idx + 1] = max(0, min(255, fg))
            pixels[idx + 2] = max(0, min(255, fb))

    dx = x1 - x0
    dy = y1 - y0
    if abs(dx) < 0.001 and abs(dy) < 0.001:
        return
    if abs(dx) > abs(dy):
        if x0 > x1:
            x0, x1 = x1, x0
            y0, y1 = y1, y0
        gradient = dy / dx
        y = y0
        for x in range(int(x0), int(x1) + 1):
            plot(x, int(y), 1 - (y - int(y)))
            plot(x, int(y) + 1, y - int(y))
            y += gradient
    else:
        if y0 > y1:
            x0, x1 = x1, x0
            y0, y1 = y1, y0
        gradient = dx / dy
        x = x0
        for y in range(int(y0), int(y1) + 1):
            plot(int(x), y, 1 - (x - int(x)))
            plot(int(x) + 1, y, x - int(x))
            x += gradient

def draw_circle(pixels, w, h, cx, cy, r, color, fill=True, alpha=1.0):
    """Draw a filled or outlined circle."""
    col_r, col_g, col_b = color
    ix, iy = int(cx), int(cy)
    ir = int(r) + 2
    for dy in range(-ir, ir + 1):
        for dx in range(-ir, ir + 1):
            dist = math.sqrt(dx * dx + dy * dy)
            px, py = ix + dx, iy + dy
            if 0 <= px < w and 0 <= py < h:
                idx = (py * w + px) * 3
                if fill:
                    if dist < r - 0.5:
                        a = alpha
                    elif dist < r + 0.5:
                        a = alpha * (r + 0.5 - dist)
                    else:
                        continue
                else:
                    # outline only
                    if abs(dist - r) < 1.0:
                        a = alpha * max(0, 1 - abs(dist - r))
                    else:
                        continue
                pixels[idx] = max(0, min(255, int(col_r * a + pixels[idx] * (1 - a))))
                pixels[idx+1] = max(0, min(255, int(col_g * a + pixels[idx+1] * (1 - a))))
                pixels[idx+2] = max(0, min(255, int(col_b * a + pixels[idx+2] * (1 - a))))

def draw_hex_outline(pixels, w, h, cx, cy, r, color):
    """Draw hexagon outline."""
    verts = hex_vertices(cx, cy, r - 3)
    for i in range(6):
        x0, y0 = verts[i]
        x1, y1 = verts[(i + 1) % 6]
        draw_line(pixels, w, h, x0, y0, x1, y1, color, alpha=0.6)

def draw_text_simple(pixels, w, h, x, y, text, color, scale=1):
    """Blit simple 5x7 bitmap text."""
    FONT = {
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
        '-': [0b00000,0b00000,0b11111,0b00000,0b00000,0b00000,0b00000],
        '/': [0b00001,0b00010,0b00100,0b01000,0b10000,0b00000,0b00000],
        '(': [0b00010,0b00100,0b01000,0b01000,0b00100,0b00010,0b00000],
        ')': [0b01000,0b00100,0b00010,0b00010,0b00100,0b01000,0b00000],
        '0': [0b01110,0b10001,0b10011,0b10101,0b11001,0b01110,0b00000],
        '1': [0b00100,0b01100,0b00100,0b00100,0b00100,0b01110,0b00000],
        '2': [0b01110,0b10001,0b00001,0b00110,0b01000,0b11111,0b00000],
        '3': [0b01110,0b10001,0b00110,0b00001,0b10001,0b01110,0b00000],
        '●': [0b01110,0b11111,0b11111,0b11111,0b01110,0b00000,0b00000],
        '○': [0b01110,0b10001,0b10001,0b10001,0b01110,0b00000,0b00000],
    }

    col_r, col_g, col_b = color
    px = x
    for ch in text.upper():
        bitmap = FONT.get(ch, FONT.get(' '))
        for row_idx, row_bits in enumerate(bitmap):
            for bit_idx in range(5):
                if row_bits & (1 << (4 - bit_idx)):
                    for sy in range(scale):
                        for sx in range(scale):
                            bx = px + bit_idx * scale + sx
                            by = y + row_idx * scale + sy
                            if 0 <= bx < w and 0 <= by < h:
                                idx = (by * w + bx) * 3
                                pixels[idx] = col_r
                                pixels[idx+1] = col_g
                                pixels[idx+2] = col_b
        px += 6 * scale  # advance cursor


def render_frame(frame_idx):
    t = frame_idx / FPS

    # Background
    pixels = bytearray(BG_COLOR[0:1] * 1 + BG_COLOR[1:2] * 1 + BG_COLOR[2:3] * 1) * (W * H)
    # Actually build properly
    pixels = bytearray(W * H * 3)
    for i in range(W * H):
        pixels[i*3] = BG_COLOR[0]
        pixels[i*3+1] = BG_COLOR[1]
        pixels[i*3+2] = BG_COLOR[2]

    # Draw hexagonal lattice
    for idx, (cx, cy) in enumerate(lattice):
        if idx in hole_indices:
            # Holes: red ring outline only
            draw_hex_outline(pixels, W, H, cx, cy, HEX_RADIUS, (60, 20, 20))
            draw_circle(pixels, W, H, cx, cy, 10, HOLE_COLOR, fill=False, alpha=0.8)
        else:
            draw_hex_outline(pixels, W, H, cx, cy, HEX_RADIUS, HEX_COLOR)

    # Draw electrons (blue dots)
    for e in electrons:
        ex, ey = e.pos(t)
        # Skip if too close to a hole node (electrons flow around them)
        too_close = False
        for hi in hole_indices:
            hx, hy = lattice[hi]
            if math.sqrt((ex - hx)**2 + (ey - hy)**2) < HEX_RADIUS * 0.8:
                # Deflect slightly upward
                ey -= 12
                too_close = True
                break
        draw_circle(pixels, W, H, ex, ey, 12, ELECTRON_COLOR, fill=True, alpha=0.9)
        # Glow halo
        draw_circle(pixels, W, H, ex, ey, 20, ELECTRON_COLOR, fill=False, alpha=0.25)

    # Legend fade-in: starts at t=1s, fully visible at t=2s
    legend_alpha = max(0, min(1.0, (t - 1.0)))

    if legend_alpha > 0:
        leg_x = 60
        leg_y = H - 120
        scale = 3

        # Electron legend
        draw_circle(pixels, W, H, leg_x + 10, leg_y + 10, 10, ELECTRON_COLOR, fill=True, alpha=legend_alpha)
        draw_text_simple(pixels, W, H, leg_x + 28, leg_y + 3, "ELECTRON", (120, 180, 255), scale=scale)

        # Hole legend
        draw_circle(pixels, W, H, leg_x + 10, leg_y + 50, 10, HOLE_COLOR, fill=False, alpha=legend_alpha)
        draw_text_simple(pixels, W, H, leg_x + 28, leg_y + 43, "HOLE", (220, 100, 100), scale=scale)

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

    print("Encoding MP4 with FFmpeg...")
    import subprocess
    cmd = [
        "ffmpeg", "-y",
        "-framerate", str(FPS),
        "-i", os.path.join(OUTPUT_DIR, "frame_%04d.png"),
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-crf", "18",
        "-preset", "medium",
        OUTPUT_MP4
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print("FFmpeg error:", result.stderr)
    else:
        print(f"Done: {OUTPUT_MP4}")
        # Cleanup frames
        shutil.rmtree(OUTPUT_DIR)

if __name__ == "__main__":
    main()
