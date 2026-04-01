"""
Generate a printable US Letter sheet of actual-size WMCA Bike Tag stickers
with real QR codes. Each tag gets a unique QR encoding WM-BK-NNNN.

Sticker size: 33mm x 42mm
QR code size: 25mm x 25mm
"""

import qrcode
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
import tempfile
import os

OUTPUT = "/Users/nickd/Workspaces/AgentArchitect/teams/wharfside-board-assistant/outputs/WMCA-Bike-Tag-Test-Sheet.pdf"

# Sticker dimensions
# QR is 25mm, need ~7mm above (WMCA) + ~10mm below (number + footer) + 2mm padding
STICKER_W = 35 * mm
STICKER_H = 48 * mm
QR_SIZE = 25 * mm

# Page layout
PAGE_W, PAGE_H = letter
MARGIN_X = 15 * mm
MARGIN_Y = 15 * mm
HEADER_H = 20 * mm  # space for print instructions + ruler

# Grid spacing (gap between stickers)
GAP_X = 4 * mm
GAP_Y = 4 * mm

# Calculate grid (account for header)
usable_h = PAGE_H - MARGIN_Y - (MARGIN_Y + HEADER_H)
cols = int((PAGE_W - 2 * MARGIN_X + GAP_X) / (STICKER_W + GAP_X))
rows = int((usable_h + GAP_Y) / (STICKER_H + GAP_Y))

# Center the grid horizontally, start below header
total_grid_w = cols * STICKER_W + (cols - 1) * GAP_X
total_grid_h = rows * STICKER_H + (rows - 1) * GAP_Y
start_x = (PAGE_W - total_grid_w) / 2
start_y = PAGE_H - MARGIN_Y - HEADER_H  # top of grid area

PURPLE = HexColor("#7B2D8E")
WHITE = HexColor("#FFFFFF")


def make_qr_image(data: str) -> str:
    """Generate a QR code image and return temp file path."""
    qr = qrcode.QRCode(
        version=2,
        error_correction=qrcode.ERROR_CORRECT_H,
        box_size=10,
        border=0,
    )
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    fd, path = tempfile.mkstemp(suffix=".png")
    os.close(fd)
    img.save(path)
    return path


def draw_sticker(c: canvas.Canvas, x: float, y: float, tag_num: int):
    """Draw a single bike tag sticker at (x, y) bottom-left corner."""
    # Purple rounded rectangle background
    c.setFillColor(PURPLE)
    c.setStrokeColor(HexColor("#6A2579"))
    c.setLineWidth(0.5)
    c.roundRect(x, y, STICKER_W, STICKER_H, radius=2 * mm, fill=1, stroke=1)

    # WMCA header — top of sticker
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(x + STICKER_W / 2, y + STICKER_H - 7 * mm, "WMCA")

    # QR code — 25mm x 25mm, centered
    qr_data = f"WM-BK-{tag_num:04d}"
    qr_path = make_qr_image(qr_data)
    qr_x = x + (STICKER_W - QR_SIZE) / 2
    qr_y = y + STICKER_H - 9 * mm - QR_SIZE  # 9mm from top = below WMCA + gap
    c.drawImage(
        qr_path, qr_x, qr_y, width=QR_SIZE, height=QR_SIZE,
        preserveAspectRatio=True,
    )
    os.unlink(qr_path)

    # Tag number — below QR
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(x + STICKER_W / 2, y + 5 * mm, f"{tag_num:04d}")

    # Footer
    c.setFont("Helvetica", 3)
    c.saveState()
    c.setFillAlpha(0.5)
    c.setFillColor(WHITE)
    c.drawCentredString(x + STICKER_W / 2, y + 1.5 * mm, "REGISTERED BICYCLE")
    c.restoreState()


def main():
    c = canvas.Canvas(OUTPUT, pagesize=letter)
    c.setTitle("WMCA Bike Tag Test Sheet")

    tag_num = 1
    stickers_per_page = cols * rows

    # Generate 2 pages (enough to test)
    for page in range(2):
        if page > 0:
            c.showPage()

        # Print instructions and verification ruler
        c.setFont("Helvetica-Bold", 8)
        c.setFillColor(HexColor("#CC0000"))
        c.drawString(MARGIN_X, PAGE_H - 7 * mm,
                     "PRINT AT 100% / ACTUAL SIZE — Do NOT scale to fit")
        c.setFont("Helvetica", 7)
        c.setFillColor(HexColor("#999999"))
        c.drawString(MARGIN_X, PAGE_H - 11 * mm,
                     f"Page {page + 1} — "
                     f"Tags BK-{tag_num:04d} to BK-{tag_num + stickers_per_page - 1:04d}")

        # Verification ruler — 25mm line to check print scale
        ruler_y = PAGE_H - 16 * mm
        c.setStrokeColor(HexColor("#333333"))
        c.setLineWidth(0.5)
        c.line(MARGIN_X, ruler_y, MARGIN_X + 25 * mm, ruler_y)
        # Tick marks at ends
        c.line(MARGIN_X, ruler_y - 1.5 * mm, MARGIN_X, ruler_y + 1.5 * mm)
        c.line(MARGIN_X + 25 * mm, ruler_y - 1.5 * mm, MARGIN_X + 25 * mm, ruler_y + 1.5 * mm)
        c.setFont("Helvetica", 6)
        c.setFillColor(HexColor("#333333"))
        c.drawString(MARGIN_X + 26 * mm, ruler_y - 1.5 * mm,
                     "← This line = 25mm. Measure to verify 1:1 scale.")

        for row in range(rows):
            for col in range(cols):
                sx = start_x + col * (STICKER_W + GAP_X)
                sy = start_y - (row + 1) * STICKER_H - row * GAP_Y

                # Draw light cut guide
                c.setStrokeColor(HexColor("#DDDDDD"))
                c.setLineWidth(0.25)
                c.rect(sx, sy, STICKER_W, STICKER_H, fill=0, stroke=1)

                draw_sticker(c, sx, sy, tag_num)
                tag_num += 1

    c.save()
    print(f"Generated: {OUTPUT}")
    print(f"Grid: {cols} cols x {rows} rows = {stickers_per_page} per page")
    print(f"Tags: BK-0001 to BK-{tag_num - 1:04d} ({tag_num - 1} total)")


if __name__ == "__main__":
    main()
