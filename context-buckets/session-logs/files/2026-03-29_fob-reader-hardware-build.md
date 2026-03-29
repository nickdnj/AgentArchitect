# Fob Reader — Hardware Build & TagSmart Scanner Mode

**Date:** 2026-03-29
**Session type:** execution
**Agents involved:** None (direct hardware/software collaboration)

## Summary

Built the Wiegand fob reader hardware from scratch — Arduino Pro Micro + Mircom TX3-P200-HA proximity reader. Flashed the Arduino sketch, soldered 4 connections, tested successfully. Fob numbers matched TagSmart's eMERGE export directly with no encoding conversion needed. Updated TagSmart's Scanner Mode to clear input between scans and replace the input field with a "Ready to scan" status display that blocks manual entry.

## Key Findings

- USB-C cable gotcha: first cable was power-only (red LED on but no `/dev/cu.usbmodem*` port). Swapped cable and Mac detected the Pro Micro immediately.
- "Yet Another Arduino Wiegand Library" by Paulo Costa was already installed — different API from MonkeyBoard library in original build spec. Rewrote sketch for callback-based API with interrupt support.
- Fob numbers from 16-bit Wiegand card number match TagSmart's eMERGE Linear numbers exactly — no facility code inclusion or encoding formula needed.
- Reader runs fine on 5V USB power (label says 5-14VDC).
- Nick's solder: Sn60/Pb40 (leaded, 60/40) at 315°C.
- Nick built 3 scanners total (one per Mircom reader he had retired).

## Decisions Made

- Adapted sketch for installed Paulo Costa Wiegand library instead of swapping to MonkeyBoard — better parity verification and error handling
- Scanner Mode redesigned: hidden input with `inputMode="none"` to suppress mobile soft keyboard, green status display replaces text input, auto-focus recovery on page tap
- No encoding conversion needed — `code & 0xFFFF` (16-bit card number) matches TagSmart directly

## Artifacts Created

- **Arduino sketch:** `~/Workspaces/fob-reader/arduino/wiegand_fob_reader/wiegand_fob_reader.ino`
- **Wiring guide (MD):** `~/Workspaces/fob-reader/docs/wiring-guide.md`
- **Wiring guide (HTML):** `~/Workspaces/fob-reader/docs/wiring-guide.html`
- **Email:** Wiring & Assembly Guide sent to nickd@demarconet.com (Gmail ID: 19d3992d01401cde)
- **TagSmart commits:** 2 commits pushed to `nickdnj/tagsmart-v2` main branch, deployed to mini PC
  - `4c67e09` — Fix scanner mode: clear input after fob lookup for consecutive scans
  - `d76b13e` — Scanner mode: replace input with status display, block manual entry

## Open Items

- [ ] Third scanner still to be built (same process — flash, solder, test)
- [ ] Box up all three scanners (drill enclosures, hot glue strain relief)
- [ ] Test with TagSmart Scanner Mode on production (tagsmart.vistter.com/fob-lookup)

## Context for Next Session

All three Mircom readers are being converted to portable USB fob scanners. Two are fully built and working. The third just needs the same flash-and-solder process. TagSmart's Scanner Mode has been updated and deployed — the input field is now hidden in scanner mode with a "Ready to scan" status display. The fob numbers match the database directly, so no software adjustments are needed. Nick should box up the completed units and do a final end-to-end test on the production TagSmart instance.
