#!/usr/bin/env python3
"""Render the Bob's Grill School master shot list to a print-ready PDF.

Reads storyboard-data.json (the `shotList` block) and emits:
  - shot-list-print.html  (intermediate, styled for print)
  - shot-list.pdf         (Letter landscape, via Chrome headless)

This is the field call sheet Nick prints and hands to Bob. Standalone — does not
depend on the storyboard web app running.
"""
import html
import json
import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA = HERE / "storyboard-data.json"
OUT_HTML = HERE / "shot-list-print.html"
OUT_PDF = HERE / "shot-list.pdf"

GS = {"unlit": "Unlit", "lighting": "Lighting", "cooking": "Cooking",
      "ready-gray": "Ready·gray", "cooldown": "Cool-down", "n/a": "—"}

CHROME_CANDIDATES = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
]


def e(s):
    return html.escape(str("" if s is None else s))


def build_html(d, sl, heading, count_noun, extra_meta):
    sl = sl or {}
    blocks = sl.get("blocks", []) or []
    total = sum(len(b.get("shots", []) or []) for b in blocks)

    gear = sl.get("gearReminder", []) or []
    order = sl.get("shootingOrderNote", "")

    sections = []
    for blk in blocks:
        shots = blk.get("shots", []) or []
        title = f"BLOCK {e(blk.get('id',''))} — {e(blk.get('title',''))}"
        gs = blk.get("grillState", "")
        if gs and gs != "n/a":
            title += f" · {e(GS.get(gs, gs))}"
        cards = []
        for sh in shots:
            eps = sh.get("episodes", sh.get("episode", ""))
            if isinstance(eps, list):
                eps = ", ".join(str(x) for x in eps)
            dep = sh.get("dependsOn", "")
            vert = sh.get("vertical")

            chips = [f'<span class="chip ep">Ep {e(eps)}</span>']
            if sh.get("shotType"):
                chips.append(f'<span class="chip ty">{e(sh.get("shotType"))}</span>')
            if sh.get("duration"):
                chips.append(f'<span class="chip len">{e(sh.get("duration"))}</span>')
            if sh.get("pov"):
                chips.append('<span class="chip pov">📷 GLASSES POV</span>')
            if vert:
                chips.append('<span class="chip vrt">★ VERTICAL 9:16</span>')

            lines = []
            if sh.get("framing"):
                lines.append(f'<div class="ln"><span class="lbl">Frame</span>{e(sh.get("framing"))}</div>')
            if sh.get("action"):
                lines.append(f'<div class="ln"><span class="lbl">Do</span>{e(sh.get("action"))}</div>')
            if sh.get("line"):
                lines.append(f'<div class="ln say"><span class="lbl">Bob</span>&ldquo;{e(sh.get("line"))}&rdquo;</div>')
            if dep:
                lines.append(f'<div class="dep">⚠ {e(dep)}</div>')

            cards.append(
                f'<div class="card{" vcard" if vert else (" povcard" if sh.get("pov") else "")}">'
                '<div class="chk">☐</div>'
                '<div class="body">'
                f'<div class="cardhead"><span class="sid">{e(sh.get("shotId",""))}</span>'
                f'<span class="chips">{"".join(chips)}</span></div>'
                f'{"".join(lines)}'
                '</div></div>'
            )
        sections.append(
            f'<section class="block"><h2 class="blockhd">{title}'
            f'<span class="bc">{len(shots)} shots</span></h2>{"".join(cards)}</section>'
        )

    gear_html = ""
    if gear:
        gear_html = ('<div class="callout"><h3>✅ Before you roll</h3><ul>'
                     + "".join(f"<li>{e(g)}</li>" for g in gear) + "</ul></div>")
    order_html = ""
    if order:
        order_html = f'<div class="callout order"><h3>🔥 Shooting order</h3><p>{e(order)}</p></div>'
    rig_html = ""
    if sl.get("rigNote"):
        rig_html = f'<div class="callout rig"><h3>🎥 Camera rig</h3><p>{e(sl.get("rigNote"))}</p></div>'
    legend = "★ = grab a vertical 9:16"
    if any(s.get("pov") for b in blocks for s in (b.get("shots") or [])):
        legend += " &nbsp;·&nbsp; 📷 = roll the glasses (POV)"

    return f"""<!doctype html><html><head><meta charset="utf-8"><style>
@page {{ size: letter portrait; margin: 0.5in 0.55in; }}
* {{ box-sizing:border-box; -webkit-print-color-adjust:exact; print-color-adjust:exact; }}
body {{ font-family:-apple-system,"Segoe UI",Helvetica,Arial,sans-serif; color:#16222c; margin:0; font-size:14pt; line-height:1.4; }}
.head {{ border-bottom:4px solid #0b2c42; padding-bottom:10px; margin-bottom:16px; }}
.head h1 {{ font-size:26pt; color:#0b2c42; margin:0; }}
.head .sub {{ color:#5f7386; font-size:13pt; margin-top:4px; }}
.head .meta {{ color:#0b2c42; font-size:13pt; margin-top:6px; font-weight:600; }}
.head .meta .star {{ color:#1f9d6b; }}

.callout {{ background:#f4ede3; border:1px solid #e6dccd; border-radius:10px; padding:14px 18px; margin-bottom:14px; }}
.callout li {{ break-inside:avoid; }}
.callout.order {{ background:#fff3ec; border-color:#f3d6c4; }}
.callout h3 {{ font-size:14pt; color:#0b2c42; margin:0 0 8px; }}
.callout ul {{ margin:0; padding-left:24px; }} .callout li {{ margin-bottom:5px; }}
.callout p {{ margin:0; }}

.block {{ margin-bottom:22px; break-inside:auto; }}
.blockhd {{ font-size:16pt; color:#fff; background:#123c5b; border-radius:9px; padding:11px 16px; margin:0 0 12px; display:flex; align-items:center; justify-content:space-between; break-after:avoid; }}
.blockhd .bc {{ font-size:12pt; font-weight:500; color:#7bdac4; }}

.card {{ display:flex; gap:14px; border:1px solid #dfe5ec; border-radius:11px; padding:14px 16px; margin-bottom:12px; background:#fff; break-inside:avoid; }}
.card.vcard {{ border-left:7px solid #1f9d6b; background:#f4fbf8; }}
.chk {{ font-size:30pt; line-height:1; color:#0b2c42; flex:0 0 auto; }}
.body {{ flex:1; }}
.cardhead {{ display:flex; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:8px; }}
.sid {{ font-size:18pt; font-weight:800; color:#0b2c42; }}
.chips {{ display:flex; flex-wrap:wrap; gap:6px; }}
.chip {{ font-size:11pt; font-weight:700; padding:3px 10px; border-radius:999px; }}
.chip.ep {{ background:#e7eef4; color:#274b63; }}
.chip.ty {{ background:#eef1f4; color:#46586a; }}
.chip.len {{ background:#eef1f4; color:#46586a; }}
.chip.vrt {{ background:#1f9d6b; color:#fff; }}
.chip.pov {{ background:#6a3fb0; color:#fff; }}
.callout.rig {{ background:#eef3fb; border-color:#cdddf0; }}
.card.povcard {{ border-left:7px solid #6a3fb0; }}
.ln {{ margin-bottom:5px; }}
.ln .lbl {{ display:inline-block; min-width:50px; padding-right:14px; font-size:11pt; font-weight:800; text-transform:uppercase; letter-spacing:.04em; color:#8a98a6; vertical-align:top; }}
.ln.say {{ color:#0b2c42; font-style:italic; font-size:14.5pt; }}
.ln.say .lbl {{ color:#2bb597; font-style:normal; }}
.dep {{ margin-top:6px; color:#c0492b; font-weight:700; font-size:12.5pt; }}

.foot {{ margin-top:18px; text-align:center; color:#5f7386; font-size:11pt; border-top:1px solid #e3e8ee; padding-top:10px; }}
</style></head><body>
<div class="head">
  <h1>{heading}</h1>
  <div class="sub">{e(d.get('location',''))}</div>
  <div class="meta">{e(d.get('host',''))} &nbsp;·&nbsp; {e(d.get('date',''))} &nbsp;·&nbsp; {total} {count_noun} &nbsp;·&nbsp; {extra_meta} &nbsp;·&nbsp; <span class="star">{legend}</span></div>
</div>
{rig_html}{gear_html}{order_html}
{''.join(sections)}
<div class="foot">Wharfside Picnic Guide · picnic.vistter.com — leave the grill better than you found it.</div>
</body></html>"""


def find_chrome():
    for c in CHROME_CANDIDATES:
        if Path(c).exists():
            return c
    for name in ("google-chrome", "chromium", "chromium-browser"):
        p = shutil.which(name)
        if p:
            return p
    return None


# mode -> (data key, out html, out pdf, heading, count noun, extra meta)
MODES = {
    "ground": ("shotList", HERE / "shot-list-print.html", HERE / "shot-list.pdf",
               "🔥 Bob's Grill School — Shot List", "shots", "5 episodes"),
    "drone": ("droneShotList", HERE / "drone-shot-list-print.html", HERE / "drone-shot-list.pdf",
              "🚁 Bob's Grill School — Drone Shot List", "aerials", "DJI Mini 4K · recreational"),
}


def render(mode, d, chrome):
    key, out_html, out_pdf, heading, noun, extra = MODES[mode]
    sl = d.get(key, {}) or {}
    if not sl.get("blocks"):
        print(f"(skip {mode}: no '{key}' in data)")
        return
    out_html.write_text(build_html(d, sl, heading, noun, extra), encoding="utf-8")
    print(f"wrote {out_html}")
    cmd = [chrome, "--headless", "--disable-gpu", "--no-pdf-header-footer",
           f"--print-to-pdf={out_pdf}", "--no-margins", out_html.as_uri()]
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=90)
    if not out_pdf.exists():
        sys.exit(f"ERROR: PDF not produced for {mode}.\n{r.stderr}")
    print(f"wrote {out_pdf}  ({out_pdf.stat().st_size//1024} KB)")


def main():
    if not DATA.exists():
        sys.exit(f"ERROR: {DATA} not found. Run the Script Writer first.")
    d = json.loads(DATA.read_text(encoding="utf-8"))

    arg = sys.argv[1].lower() if len(sys.argv) > 1 else "ground"
    modes = ["ground", "drone"] if arg == "all" else [arg]
    for m in modes:
        if m not in MODES:
            sys.exit(f"ERROR: unknown mode '{m}'. Use: ground | drone | all")

    chrome = find_chrome()
    if not chrome:
        sys.exit("ERROR: no Chrome/Chromium found to render PDF. HTML written; open and print manually.")
    for m in modes:
        render(m, d, chrome)


if __name__ == "__main__":
    main()
