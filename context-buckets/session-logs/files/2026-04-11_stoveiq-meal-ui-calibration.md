# StoveIQ Meal-Focused UI + Calibration Session

**Date:** 2026-04-11
**Session type:** execution
**Agents involved:** Direct (no team orchestrator), voice mode

## Summary

Major UI refactor: replaced the thermal heatmap-centered view with a meal-focused cooking interface. Burner cards are now the primary UI. Heatmap moved to calibration-only overlay. Stripped all flip/mirror transform code. Debugged and fixed calibration coordinate issues, stale calibration persistence, and temperature calibration with IR heat gun. Emissivity calibrated to 0.54 for the user's stove.

## Key Findings

- **Calibration coordinate bug**: Flip/mirror transforms in the browser caused calibration circles to map to wrong raw sensor positions. Fixed by removing all transforms — calibration now works on raw sensor data directly.
- **Stale calibration persistence**: Browser localStorage auto-sent old (pre-flip/mirror) calibration to firmware on every reconnect, overriding manual clears. Fixed by removing auto-send, then re-adding it after flip/mirror was removed.
- **Emissivity 0.54 is the sweet spot** for the user's stove burners. Default 0.95 was too high (reading 85°F low). At 0.54, StoveIQ tracks within ~25°F of IR heat gun at 300°F range.
- **CCL auto-detect noise**: With calibration off, CCL detected 4-5 pixel noise zones as "burners". Fixed by making calibrated mode exclusive — when calibration is active, only calibrated burners show.
- **Position-based burner sort**: Changed CCL from heat-ranked to position-sorted (top-to-bottom, left-to-right) for consistent spatial mapping.

## Decisions Made

- **Heatmap is calibration-only** — not shown in main cooking view
- **No flip/mirror** — raw sensor data shown as-is in calibration
- **Meal-focused UI** — large burner cards with heat bars, recipe tags, temperature glows
- **Custom burner names** — user can name burners (Front Left, Big Burner, etc.)
- **Calibration persists** via localStorage → auto-send to firmware on WebSocket connect
- **Alerts disabled** during development (beeps + banner popups)
- **Emissivity 0.54** as calibrated baseline for this stove

## Artifacts Created

- Multiple commits to `nickdnj/stoveiq` (GitHub public repo)
- Key commits: position-based burner sort, meal-focused UI, custom burner names, calibration fixes, temp calibration
- `/api/clear-cal` HTTP endpoint for debugging

## Open Items

- [ ] Calibrate remaining 3 burners (user was about to do this)
- [ ] Test emissivity 0.54 accuracy across wider temp range (200-500°F)
- [ ] Decide if emissivity should persist in NVS (currently resets on reboot)
- [ ] Redesign alert UX for meal-focused view (currently disabled)
- [ ] Recipe-to-burner assignment UI (picker should let user choose which burner)
- [ ] Save emissivity/offset to NVS so they survive reboots
- [ ] Phase 4: 3D enclosure (OpenSCAD)
- [ ] Phase 5: Hackaday.io + YouTube content

## Context for Next Session

The main UI refactor is done — burner cards are the primary interface, heatmap is calibration-only, flip/mirror is gone. The user has one burner calibrated at emissivity 0.54 and was about to add the other 3 burners. The emissivity and temp offset currently don't persist across reboots (they're runtime-only in the sensor driver). The alert system is disabled during development. The recipe system works but the burner assignment UX could be improved (currently defaults to burner 0). The device is at 192.168.1.183 / stoveiq.local on the home network.
