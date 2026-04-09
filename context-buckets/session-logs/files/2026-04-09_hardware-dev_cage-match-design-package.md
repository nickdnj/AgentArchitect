# Session: Cage Match Hardware Design Package

**Date:** 2026-04-09
**Team:** hardware-dev
**Specialists Invoked:** PCB Designer, MCAD Engineer

## Request
Create schematic, PCB, and MCAD designs for the Cage Match gamified batting cage system. Target: 50 production units. Supply chain team running landed cost analysis in parallel session.

## Actions
- **PCB Designer** — Created full KiCad project for ESP32 LED Controller + Token Interface board:
  - 3,892-line schematic with all circuit blocks (ESP32-WROOM-32, CH340C USB-UART, 2x 74AHCT125 level shifters, PC817 optocoupler, AMS1117-3.3 LDO, reverse polarity protection)
  - All components have LCSC part numbers for JLCPCB PCBA
  - PCB layout skeleton: 100mm×80mm board, mounting holes, GND zones, WiFi antenna keepout, placement guide
  - Component placement and routing requires KiCad GUI (Update PCB from Schematic)

- **MCAD Engineer** — Designed 4 mechanical assemblies in FreeCAD:
  - CM-TGT-001: LED Target Frame (parametric, 24"/20"/16" variants, impact-rated polycarbonate)
  - CM-JET-001: Jetson Enclosure internal mounting layout (Altelix 14×11×5")
  - CM-ESP-001 + CM-PWR-001: Split architecture — ESP32 controller separate from Mean Well PSU (thermal/service reasons)
  - CM-CAM-001: Camera mount bracket (4-part, 3 fixed tilt angles, quick-disconnect)
  - Full dimensioned drawings, assembly instructions, and SendCutSend quote estimates

- **Orchestrator** — Generated production BOM (JLCPCB format), hardware README, and per-cage cost summary

## Artifacts
- `cage-match/hardware/pcb/esp32-led-controller/` — KiCad project (.kicad_pro, .kicad_sch, .kicad_pcb)
- `cage-match/hardware/pcb/esp32-led-controller/bom/jlcpcb_bom.csv` — SMT BOM for JLCPCB PCBA
- `cage-match/hardware/pcb/esp32-led-controller/bom/manual_assembly_bom.csv` — Through-hole components
- `cage-match/hardware/pcb/esp32-led-controller/README.md` — Circuit description + ordering guide
- `cage-match/hardware/mechanical/led-target-frame/` — FreeCAD script + design notes + drawing
- `cage-match/hardware/mechanical/jetson-enclosure/` — FreeCAD script + drawing
- `cage-match/hardware/mechanical/esp32-enclosure/` — FreeCAD script + design recommendation
- `cage-match/hardware/mechanical/camera-mount/` — FreeCAD script + drawing
- `cage-match/hardware/mechanical/README.md` — Assembly index, mfg quotes, mechanical BOM
- `cage-match/hardware/README.md` — Top-level hardware package overview

## Key Findings
- **1 custom PCB** needed: ESP32 LED Controller (~$13/board assembled at JLCPCB)
- **Mechanical cost**: $523/cage (target frames $240, enclosures $240, camera mount $43)
- **Total per-cage hardware**: ~$3,061
- **50-cage production**: ~$153,050
- **Key design decision**: Split ESP32 controller and Mean Well PSU into separate enclosures (CM-ESP-001 + CM-PWR-001) for thermal management, serviceability, and code compliance

## Schematic Wiring (continued session)
- KiCad S-expression format does NOT support `;;` comments — caused parse error, stripped all comments
- Built `wire_schematic.py` script that computes all pin positions from component placement + symbol definitions
- Generates 360 wiring elements: power symbols, net labels, wire stubs (7.62mm), no-connect markers
- Uses net labels for inter-block connections (e.g., GPIO16 ↔ U4 ch1, TOKEN_IN ↔ GPIO34, EN ↔ auto-reset)
- Power symbols (+5V, +3V3, GND) placed at all power pins with wire stubs
- Script is re-runnable: restore schematic from git, strip comments, run script
- **Next step**: Open schematic in KiCad, run ERC, fix any unconnected pins, then Update PCB from Schematic
