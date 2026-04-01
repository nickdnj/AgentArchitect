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

### Placement Optimizer (added late session)
- Built custom simulated annealing placement optimizer: `pcb/optimize_placement.py`
- Uses `kiutils` (pip, pure Python) to parse/write KiCad PCB files
- Netlist defined manually from schematic (board has no net assignments since it was created from scratch)
- Cost function: wirelength (HPWL) + boundary + keep-out + overlap + zone + thermal penalties
- Results on 10K iterations: total cost 8,792 → 1,750 (80% reduction), overlaps 7→1, keep-out violations 4→0
- Tunable: `python3 optimize_placement.py --iterations 20000 --temp 200 --cooling 0.9990`
- Full pipeline: optimize_placement.py → replace_and_reroute.py → kicad-cli pcb drc

### Design Review Document
- Generated Word doc with embedded images via python-docx
- Script: `hardware/generate_design_review.py` → `StoveIQ_Design_Review_v0.1.docx` (945KB)
- 8 embedded images: schematic, PCB fab drawing, PCB layout, 3× 3D board renders, 2× enclosure renders
- Also created Google Doc version (less formatted): https://docs.google.com/document/d/14NDAa_LedX2d8CG7FUVb4PVQ-w-uPTl2rSIBOR2cvEY/edit

### Real MLX90640 Firmware (2026-04-01)
- Implemented real I2C sensor driver in `sensor.c` (replaced TODO stubs)
- I2C on GPIO1 (SDA) / GPIO2 (SCL) at 400kHz, MLX90640 at 0x33
- Full init: EEPROM dump → parameter extraction → refresh rate → ADC resolution → prime read
- Full read: GetFrameData → Vdd compensation → Ta compensation → CalculateTo (768 pixels)
- Created ESP-IDF I2C bridge: `lib/MLX90640/MLX90640_I2C_Driver.c/.h`
- Created MLX90640 API header: `lib/MLX90640/MLX90640_API.h` (implementation via PlatformIO lib_deps)
- Created standalone validation test: `src/sensor_validation.c`
  - 4Hz continuous read, CSV output on serial
  - ON/OFF state machine with debounce (50°C on, 30°C off, 6 frame debounce)
  - ASCII thermal heatmap every 30 seconds
  - Transition counter toward 100-cycle target
  - Summary with pass/fail statistics
- New PlatformIO env: `[env:validate]` — flash with `pio run -e validate -t upload`
- Updated buzzer GPIO from 18 to 39 (matching schematic pin assignment)
- USPS tracking: hardware left Metro NY hub 4:56 AM Apr 1, expected delivery Apr 3

## Open Items

- [ ] Hardware delivery — USPS tracking 9400140106246009252735, expected Friday April 3
- [ ] Sensor validation — gate decision for the whole project
- [ ] Complete schematic wiring (nets need F8 sync to PCB)
- [ ] Full autoroute with net connectivity
- [ ] Tune placement optimizer (increase overlap penalty to eliminate last overlap)
- [ ] Iterate enclosure model after physical PCB validation
- [ ] 3D print prototype enclosure
- [ ] Order silicon IR windows for testing

## Context for Next Session

Hardware is ordered and en route. The full EDA toolchain is installed and working: KiCad 10 for schematic/PCB, Freerouting for autorouting, OpenSCAD for enclosure. All 26 components are placed on the PCB via Python scripting with simulated annealing optimization. The placement optimizer reduced total cost by 80% and eliminated all keep-out violations. The design review Word document is generated programmatically with `python3 generate_design_review.py`. The next real-world step is receiving the hardware and running the sensor validation protocol — that's the gate decision. After validation passes, the custom PCB goes to JLCPCB and the enclosure gets 3D printed.
