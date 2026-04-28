#!/usr/bin/env python3
"""
Wharfside bulletin build pipeline.

One source HTML in, three outputs:
  - <name>.html         (source, unchanged)
  - <name>-email.html   (CSS inlined for email clients that strip <style> blocks)
  - <name>.pdf          (rendered via Chrome headless for AppFolio distribution)

Usage:
    python scripts/bulletin-build.py <input.html>
    python scripts/bulletin-build.py teams/wharfside-board-assistant/outputs/may-2026-bulletin-v0.2.html
"""

import sys
import subprocess
import shutil
from pathlib import Path
from premailer import transform


CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

PRINT_CSS = """
<style media="print">
  @page { size: letter; margin: 0.6in 0.55in 0.7in 0.55in; }
  body { max-width: none !important; padding: 0 !important; font-size: 11pt; }
  h2 { page-break-after: avoid; break-after: avoid; }
  h2 + p, h2 + div, h2 + ul { page-break-before: avoid; break-before: avoid; }
  .highlight, .info-box, .alert-box, .success-box, .pool-info, .maintenance-box, .contacts-box {
    page-break-inside: avoid; break-inside: avoid;
  }
  ul, ol, li { page-break-inside: avoid; break-inside: avoid; }
  .footer { page-break-inside: avoid; break-inside: avoid; }
  .divider { margin: 12px 0; }
</style>
"""


def build_email_html(src: Path, dst: Path) -> None:
    """Inline all CSS into element style attributes for email."""
    html = src.read_text(encoding="utf-8")
    inlined = transform(
        html,
        keep_style_tags=False,
        remove_classes=False,
        strip_important=False,
        cssutils_logging_level="ERROR",
    )
    dst.write_text(inlined, encoding="utf-8")
    print(f"  email HTML  -> {dst}")


def build_pdf(src: Path, dst: Path) -> None:
    """Render PDF with print stylesheet via Chrome headless."""
    html = src.read_text(encoding="utf-8")
    if "</head>" in html and "@page" not in html:
        html = html.replace("</head>", f"{PRINT_CSS}</head>", 1)

    tmp_html = src.with_suffix(".print.html")
    tmp_html.write_text(html, encoding="utf-8")
    try:
        subprocess.run(
            [
                CHROME,
                "--headless=new",
                "--disable-gpu",
                "--no-pdf-header-footer",
                "--print-to-pdf-no-header",
                f"--print-to-pdf={dst}",
                f"file://{tmp_html.resolve()}",
            ],
            check=True,
            capture_output=True,
        )
        print(f"  PDF         -> {dst}")
    finally:
        tmp_html.unlink(missing_ok=True)


def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__)
        return 1

    src = Path(sys.argv[1]).resolve()
    if not src.exists():
        print(f"error: input not found: {src}")
        return 1
    if not shutil.which(CHROME) and not Path(CHROME).exists():
        print(f"error: Chrome not found at {CHROME}")
        return 1

    stem = src.stem
    out_dir = src.parent
    email_html = out_dir / f"{stem}-email.html"
    pdf = out_dir / f"{stem}.pdf"

    print(f"source        <- {src}")
    build_email_html(src, email_html)
    build_pdf(src, pdf)
    print("done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
