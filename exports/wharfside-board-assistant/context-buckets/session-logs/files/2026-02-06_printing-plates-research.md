# Printing Plates Research — Eileen Holton's Estate / Harcourt Brace

**Date:** 2026-02-06
**Session type:** research + execution
**Agents involved:** Max (Personal Assistant), Software Developer (report building)

## Summary

Continued work on the printing plates project across three sessions. Session 3 focused on: (1) saving the build script permanently, (2) updating the research cache with Eileen Holton info, (3) cleaning up unused AI-generated images, (4) reordering all plates by book order, (5) extensive web search for images from the actual book, (6) adding new findings (book cover photo, Kit Carson JHS info, Merwin style reference) to the report, and (7) generating a Word document version. Both HTML and DOCX reports were emailed to Nick.

## Key Findings

### From Session 1
- **Illustrator is Decie Merwin** (1894-1961) — 68+ books, niche following
- **Edition:** Copyright 1936, "Harcourt, Brace & World, Inc." imprint = 1960-1970 printing
- **Editors:** Lucile Waldo (Kit Carson Junior High, Sacramento) and Hal Waldo (author)
- **The set:** 1 title page, 4 illustration plates, 4 text page plates
- **Market value:** $75-250 total; illustration plates $15-75 each, text plates $5-15 each
- **Everbrite clear coat** recommended for preservation

### From Session 2
- **Estate owner: Eileen B. Holton** (nee Eileen Bender), passed away 2025
- Nick is the **executor of her will and trust**
- Eileen went by Eileen Bender during her Harcourt Brace years, married Donald Holton
- She resided in The Villages, FL
- **Archives for further research:** Harry Ransom Center (UT Austin) and Columbia University hold Harcourt Brace records
- **Book copies available:** AbeBooks/ThriftBooks, $8.98 + free shipping, 2 copies
- **Plate 8 corrected:** Renamed from "The Pilgrim's Arrival" to "The Tournament at Ashby"
- **IMG_0480 rotated** 90° clockwise to portrait orientation
- **AI image rendering attempted 3 times** — all rejected as not accurate enough

### From Session 3
- **Build script saved permanently** to `printing-plates-project/build_report.py` (was in temp scratchpad)
- **Research cache markdown updated** with Eileen Holton info, book availability, plate reordering, AI attempt notes, open items
- **AI-generated images cleaned up** — deleted 18 files (9 PNG + 9 JPG) from `ai-generated/` directory
- **Plates reordered by book sequence:**
  1. Title Page (IMG_0471) — front of book
  2. The Forest Journey (IMG_0477) — page 20
  3. Lady Rowena's Entrance (IMG_0472) — page 50
  4. The Tournament at Ashby (IMG_0478) — ~pages 60-80
  5. Rebecca and Lady Rowena (IMG_0474) — page 89
  6. The Saxon Cavalcade (IMG_0480) — ~pages 90-110
  7. The Black Knight in Battle (IMG_0473) — page 117
  8. The Siege of Torquilstone (IMG_0475) — ~pages 120-140
  9. The Assault, Chapter XXIII (IMG_0476) — page 145
- **Book cover image found** on Goodreads — burgundy/red hardcover with gold lettering, decorative crest, "EDITED BY LUCILE AND HAL WALDO" on spine. Saved to `found-images/goodreads-cover.jpg`
- **Decie Merwin style reference found** — "Holiday Summer" (1958) cover from Jane Badger Books. Saved to `found-images/merwin-holiday-summer.jpg`
- **Kit Carson Junior High School:** Located at 54th & N Streets, Sacramento. Has been demolished and replaced with Kit Carson International Academy. Center for Sacramento History (551 Sequoia Pacific Blvd, Sacramento, CA 95811) holds demolition photographs and yearbooks.
- **This edition is NOT digitized anywhere** — not on Internet Archive, HathiTrust, Google Books, Open Library, or Project Gutenberg. No scans of Merwin's Ivanhoe illustrations exist online. The copper plates are the only surviving production artifacts.
- **Extensive search conducted** across: Amazon, AbeBooks, eBay, Etsy, Goodreads, Google Books, HathiTrust, Internet Archive, Open Library, WorldCat, Sacramento Public Library, Calisphere, Jane Badger Books, Pony Mad Book Lovers — no interior illustrations found
- **Word document version generated** — `The-Ivanhoe-Plates-Report.docx` (1.4 MB)
- **Both reports emailed** to YOUR_PERSONAL_EMAIL via work Gmail (personal Gmail auth still expired)

## Decisions Made

- Plates reordered by narrative/page sequence in the book (was previously ordered by image filename)
- Build script saved permanently alongside project files (no longer in temp scratchpad)
- AI-generated images directory deleted (all 18 files)
- Book cover and Merwin style reference added to the report
- Kit Carson JHS info and "not digitized" note added to provenance section
- Center for Sacramento History, Calisphere, and Jane Badger Books added to sources
- Word document version created for broader sharing
- Report intro updated to note plates are "presented in the order they would have appeared in the printed book"

## Artifacts Created

### Permanent Project Files
- **Build script (HTML):** `printing-plates-project/build_report.py` — source of truth for HTML report
- **Build script (DOCX):** `printing-plates-project/build_docx.py` — generates Word document
- **HTML report:** `printing-plates-project/printing-plates-report.html` — 2.0 MB, 13 sections, book cover + Merwin style ref added
- **Word report:** `printing-plates-project/The-Ivanhoe-Plates-Report.docx` — 1.4 MB
- **Book cover photo:** `printing-plates-project/found-images/goodreads-cover.jpg` (500x359)
- **Merwin style reference:** `printing-plates-project/found-images/merwin-holiday-summer.jpg` (293x448)
- **Research cache:** `context-buckets/research-cache/files/2026-02-06_printing-plates-ivanhoe-harcourt-brace.md` — fully updated

### Emails Sent
- **HTML report email:** Gmail ID `19c34a6219ce168c` — HTML-formatted summary + attachment to YOUR_PERSONAL_EMAIL
- **Word report email:** Gmail ID `19c34ab69f2a58f3` — plain text summary + .docx attachment to YOUR_PERSONAL_EMAIL

### Deleted
- `printing-plates-project/ai-generated/` — entire directory (18 files: 9 PNG + 9 JPG from 3 rounds of AI generation attempts)

## Open Items

- [ ] Personal Gmail (gmail-personal) auth token expired — needs re-authentication
- [ ] Order a copy of the book from AbeBooks ($8.98) to see actual printed pages
- [ ] Find a letterpress studio near Nick to pull actual prints from the illustration plates
- [ ] Purchase Everbrite Starter Kit for plate preservation
- [ ] Consider drafting eBay/Etsy listings for text plates
- [ ] Center for Sacramento History may have Kit Carson JHS yearbooks with Lucile Waldo info

## Context for Next Session

The project is in a strong state. Two reports (HTML 2.0 MB, DOCX 1.4 MB) have been emailed to Nick. Both include all 9 plates in book order, book cover photo, Merwin style reference, and complete research across 13 sections. The build scripts (`build_report.py` and `build_docx.py`) are saved permanently in the project directory for future regeneration. The research cache markdown is fully up to date.

The most impactful next step would be ordering the $8.98 book from AbeBooks — that would let Nick see the actual printed illustrations and compare them to the plates. Finding a local letterpress studio is the second priority for creating prints. The personal Gmail auth needs fixing for future email operations.

All project files are under: `context-buckets/research-cache/files/printing-plates-project/`
