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
  /* Compact, paginated print layout for AppFolio distribution.
     Goal: minimize page count without crowding; keep section headers with bodies. */
  @page { size: letter; margin: 0.45in 0.5in 0.5in 0.5in; }

  body {
    max-width: none !important;
    margin: 0 !important;
    padding: 0 !important;
    font-size: 10pt;
    line-height: 1.45;
  }

  h2 {
    font-size: 13pt;
    margin: 11pt 0 5pt 0;
    padding-bottom: 3pt;
    page-break-after: avoid; break-after: avoid;
    -webkit-column-break-inside: avoid; page-break-inside: avoid; break-inside: avoid;
  }
  h2 + p, h2 + div, h2 + ul, h2 + ol, h2 + table {
    page-break-before: avoid; break-before: avoid;
  }

  p { margin: 0 0 6pt 0; orphans: 3; widows: 3; }
  ul, ol { margin: 5pt 0; padding-left: 18pt; }
  li { margin-bottom: 2.5pt; orphans: 3; widows: 3; }

  /* Masthead — keep prominent but recover vertical space */
  .masthead { padding: 4pt 0 8pt 0 !important; margin-bottom: 10pt !important; }
  .masthead-title { font-size: 22pt !important; }
  .masthead-subtitle { font-size: 11pt !important; margin-top: 3pt !important; }
  .masthead-location { font-size: 10pt !important; margin-top: 2pt !important; }

  /* Content boxes — keep together on a page */
  .contacts-box, .highlight, .info-box, .alert-box, .success-box, .pool-info, .maintenance-box {
    padding: 9pt 12pt !important;
    margin: 8pt 0 !important;
    -webkit-column-break-inside: avoid; page-break-inside: avoid; break-inside: avoid;
  }

  /* Tables (board grid, contacts grid, maintenance table) — keep intact */
  table { page-break-inside: avoid; break-inside: avoid; }
  .board-grid td, .contacts-grid td { padding: 3pt 8pt !important; }

  /* Dividers — recover space and stay with the next section header to prevent orphan H2s */
  .divider { margin: 7pt 0 !important;
             page-break-after: avoid; break-after: avoid; }
  .divider + h2 { page-break-before: avoid; break-before: avoid; }

  /* Footer */
  .footer { margin-top: 14pt !important; padding-top: 10pt !important;
            -webkit-column-break-inside: avoid; page-break-inside: avoid; break-inside: avoid; }

  /* Always hide reviewer scaffolding in print, even if the source forgot to strip it */
  .reviewer-banner, .reviewer-note { display: none !important; }
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
