# StoveIQ — Hardware Design & Industrial Design Session

**Date:** 2026-03-30
**Session type:** execution
**Agents involved:** Direct (no team orchestrator — hands-on hardware design work)

## Summary

Major hardware design session for StoveIQ. Ordered development hardware from Adafruit ($102.71), installed KiCad 10 and OpenSCAD, created full schematic and PCB layout with automated placement/routing pipeline, designed parametric wedge enclosure, and produced a comprehensive Word-format design review package with embedded images.

## Key Findings

- KiCad 10 installed via Homebrew on macOS (needs sudo for `/Library/Application Support`)
- KiCad's pcbnew Python API (bundled Python 3.9) can programmatically load footprints, place components, export Specctra DSN, and import routed SES files
- Freerouting v2.1.0 autorouter works via CLI: `java -jar freerouting.jar -de input.dsn -do output.ses -mp 30`
- Full automated pipeline: Python placement → DSN export → Freerouting → SES import, all scriptable
- `FOOTPRINT.Flip()` causes segfault on boards created from scratch via pcbnew API (needs full layer stackup)
- KiCad S-expression files don't support `;;` comments — parser rejects them
- `kicad-cli pcb render` produces tight 3D views; `kicad-cli sch export pdf` preserves landscape orientation better than SVG
- OpenSCAD renders via CLI: `openscad -o output.png --camera=x,y,z,rx,ry,rz,dist --imgsize=W,H file.scad`
- Nick no longer works at Altium (left by March 2026), but has contacts there for PCB help

## Decisions Made

- **KiCad** chosen for schematic capture (free, Altium-importable via native import)
- **Freerouting** chosen as autorouter (open source, Java CLI, Specctra DSN/SES format)
- **OpenSCAD** chosen for enclosure modeling (parametric, code-based, scriptable)
- **Wedge enclosure** design: flat top mounts to cabinet, angled bottom (35°) points IR window at stove
- **Silicon** recommended for IR window material ($3-5, 50-70% LWIR transmission)
- **Magnetic mount** with steel plate (primary) + 3M VHB tape (renter option)
- **PC/ABS blend** for enclosure material (115°C rated, matte white)
- All components placed on F.Cu for prototype (Flip API crash prevents back-side placement via script)
- Board size confirmed: 45×35mm, 2-layer FR4

## Artifacts Created

### Hardware Design Files (~/Workspaces/stoveiq/hardware/)
- `pcb/stoveiq.kicad_pro` — KiCad 10 project
- `pcb/stoveiq.kicad_sch` — Full schematic, 26 components, embedded lib_symbols, wired
- `pcb/stoveiq.kicad_pcb` — PCB with 26 footprints from KiCad standard libraries
- `pcb/symbols/stoveiq.kicad_sym` — Custom symbols (MLX90640, buzzer)
- `pcb/sym-lib-table`, `pcb/fp-lib-table` — Library tables
- `pcb/new_board.py` — Creates fresh board with all 26 footprints placed from library
- `pcb/replace_and_reroute.py` — Clears tracks, re-places, exports DSN, runs Freerouting, imports SES
- `pcb/autoplace_and_route.py` — Original full pipeline script
- `pcb/board_3d_top.png`, `board_3d_iso.png`, `board_3d_right.png` — KiCad 3D renders
- `pcb/schematic.png` — Schematic export (landscape PDF→PNG)
- `pcb/pcb_fab.png` — Fabrication drawing (cropped)
- `pcb/pcb_layout.png` — 3D top-down layout render
- `enclosure/stoveiq_enclosure.scad` — Parametric wedge enclosure (OpenSCAD)
- `enclosure/enclosure_iso.png`, `enclosure_bottom.png`, `enclosure_front.png` — Enclosure renders
- `tools/freerouting.jar` — Freerouting autorouter v2.1.0
- `README.md` — Hardware design overview
- `generate_design_review.py` — Python script to generate Word design review
- `StoveIQ_Design_Review_v0.1.docx` — Comprehensive design review package (945KB, 8 images)

### Tools Installed
- KiCad 10.0.0 (`/Applications/KiCad/`)
- OpenSCAD 2021.01 (`/Applications/OpenSCAD-2021.01.app/`)
- Freerouting v2.1.0 (JAR in repo)

## Open Items

- [ ] Hardware delivery from Adafruit (MLX90640 + ESP32-S3, USPS Ground ~5 days)
- [ ] Sensor validation — gate decision for the whole project
- [ ] Complete schematic wiring (nets need F8 sync to PCB)
- [ ] Full autoroute with net connectivity
- [ ] Iterate enclosure model after physical PCB validation
- [ ] 3D print prototype enclosure
- [ ] Order silicon IR windows for testing
- [ ] Word doc: further refinements to images/formatting as needed

## Context for Next Session

Hardware is ordered and en route. The full EDA toolchain is installed and working: KiCad 10 for schematic/PCB, Freerouting for autorouting, OpenSCAD for enclosure. All 26 components are placed on the PCB via Python scripting. The design review Word document is generated programmatically and can be regenerated with `python3 generate_design_review.py`. The next real-world step is receiving the hardware and running the sensor validation protocol — that's the gate decision. After validation passes, the custom PCB goes to JLCPCB and the enclosure gets 3D printed.
