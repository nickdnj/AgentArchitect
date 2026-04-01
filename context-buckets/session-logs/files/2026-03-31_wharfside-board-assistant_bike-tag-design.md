# Session: Bike Tag Sticker Design for Wharfside Manor

**Date:** 2026-03-31
**Session type:** execution
**Agents involved:** wharfside-board-assistant, Explore, Web Research, Email Research

## Summary

Designed a purple bike registration sticker for WMCA with QR code integration for TagSmart. Created vendor spec sheet, SVG mockup, and printable test sheet with real QR codes. Replied to existing board email thread (Thom/Giuseppe) with design summary and PDF attachment.

## Key Findings

- **Color: Purple (#7B2D8E, PMS 2685 C)** — distinct from parking tags (Red, Green, Yellow, Blue). Fobs have no physical color so purple was available.
- **Size: 35mm x 48mm** (~1.4" x 1.9") — enlarged from initial 33x42mm to fit 25mm QR code with proper spacing
- **QR Format: `WM-BK-NNNN`** — encodes community (WM), type (BK=bike), 4-digit tag number. Level H error correction (30% recovery for outdoor durability)
- **Placement:** Seat tube upper third — universal across diamond (men's) and step-through (women's) frames
- **Material:** Cast vinyl 2mil + matte polyester overlaminate (anti-glare for scanning) + removable acrylic adhesive (won't damage bike frames). 3-5yr coastal outdoor rated.
- **Quantity:** 500 per Giuseppe (covers 1BR=2 bikes, 2BR=3 bikes allocation)
- **Existing email thread:** Giuseppe started it 3/24, Thom forwarded to Nick + Kathy asking for help with sticker design

## Decisions Made

- Purple over orange (user preference — fobs don't have a physical color)
- QR encodes `WM-BK-NNNN` format (auto-identifies type in TagSmart, no manual selection needed)
- Matte laminate mandatory (gloss causes sun glare blocking QR scans)
- Removable adhesive (not permanent — protects bike paint/carbon fiber)
- 500 sticker initial run (per Giuseppe's board discussion)
- Mike Serhat is VP (not Thom) — noted for future board communications

## Research Sources

- FTS5 search: Parking Tag Distribution Letter 2025, WMCA Handbook bike storage rules
- TagSmart v2 codebase: asset types, QR encoding (SN prefix), badge colors
- Web research: Avery MPI 1005 / 3M 180C cast vinyl, DOL 1080 matte laminate, removable adhesive specs
- Email thread: `19d202348aaa52c0` — "Wharfside - Bike Stickers" (Giuseppe → Thom → Nick)

## Artifacts Created

- `teams/wharfside-board-assistant/outputs/bike-tag-design-spec.md` — Full vendor design specification
- `teams/wharfside-board-assistant/outputs/bike-tag-mockup.svg` — SVG vendor spec sheet with mockup, dimensions, material table, notes
- `teams/wharfside-board-assistant/outputs/WMCA-Bike-Tag-Vendor-Spec.pdf` — PDF of vendor spec sheet
- `teams/wharfside-board-assistant/outputs/generate-bike-tag-sheet.py` — Python script to generate printable test sheets
- `teams/wharfside-board-assistant/outputs/WMCA-Bike-Tag-Test-Sheet.pdf` — 2-page test sheet, 16 tags/page, real QR codes (BK-0001 to BK-0032)
- **Emails sent:** Design summary + PDF attachment to Thom (CC Kathy) on bike stickers thread

## Open Items

- [ ] Board feedback on design (color, size, layout)
- [ ] Giuseppe response — he flagged removing board-sensitive material from email (sent to wrong session per Nick)
- [ ] Get vendor quotes (StickerMule, StickerGiant, etc.) once design approved
- [ ] TagSmart scanner update — parse `WM-XX-NNNN` format alongside legacy `SN` prefix
- [ ] Test QR scannability from printed test sheet
- [ ] Update TagSmart badge color for bike from emerald to purple to match physical sticker
- [ ] Draft community letter re: bike sticker program (Thom mentioned he'd draft)

## Context for Next Session

Bike tag design is at first draft stage. Emailed to Thom and Kathy with vendor spec PDF. Design is purple, 35x48mm, 25mm QR encoding WM-BK-NNNN. Test sheet printed at 1:1 — QR measured ~25mm on tape measure. Waiting on board feedback. Giuseppe email about "board sensitive materials" was sent to wrong chat session (not related to our emails). Next steps: board approval → vendor quotes → production run of 500. TagSmart needs a scanner update to parse the new QR format.
