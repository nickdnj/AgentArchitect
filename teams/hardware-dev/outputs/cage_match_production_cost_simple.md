# Cage Match — Production System Cost

**Assumption:** Dev hardware is validated. We're designing for production.

---

## The Two Custom Boards

Everything else is off-the-shelf. These are the only PCBs we design.

### Board 1: CM-TC-01 — Target Controller

**What it does:** Controls the 5 LED target zones. Lives at the machine end of the cage.

**What's on it:**
- ESP32-S3 module — runs target animations, receives commands from Jetson
- W5500 Ethernet controller — wired connection to Jetson (no WiFi)
- 5x level-shifted LED data outputs — drives WS2812B strips
- Power regulation — takes 12V in, generates 3.3V for ESP32
- Connectors: RJ45 (Ethernet), 5x JST (LED zones), screw terminal (power), UART header (debug)

**Size:** 60x80mm, 2-layer, ~50 components

| | |
|---|---|
| **Board cost (50 qty, JLCPCB assembled, shipped to US)** | **$29** |

---

### Board 2: CM-BI-01 — Batter Interface

**What it does:** Connects the Jetson to the cage. Plugs onto the Jetson's GPIO header like a HAT.

**What's on it:**
- Optocouplers — senses token machine coin drop (isolated from Jetson)
- Audio DAC (PCM5102A) — drives speakers, replaces the dangling USB audio dongle
- TVS diodes — ESD protection on all external inputs (metal cage = static)
- 40-pin header — mates with Jetson carrier board GPIO

**Size:** 65x56mm, 2-layer, ~35 components

| | |
|---|---|
| **Board cost (50 qty, JLCPCB assembled, shipped to US)** | **$22** |

---

## The Two Boxes

Each cage has two weatherproof enclosures.

### Box 1: Batter End Box

Mounted outside the cage, next to the door. This is the brain.

| Item | Cost |
|---|---|
| NEMA 4X enclosure (14x11x5, IP65) | $44 |
| Jetson Orin Nano Super (dev kit) | $249 |
| CM-BI-01 (custom board) | $22 |
| NVMe SSD 500GB | $42 |
| 19V power supply | $14 |
| Cooling fan (80mm, IP54) | $9 |
| **Box 1 subtotal** | **$380** |

**Also mounted at batter end (outside the box):**

| Item | Cost |
|---|---|
| Camera (Arducam IMX477 + lens + housing + CSI cable + mount) | $131 |
| Speakers (outdoor pair, powered) | $68 |
| Token signal cable (shielded, to token machine) | $10 |
| Display — tablet | $120 |
| Display — OR outdoor TV + mount | $950 |
| **Batter end peripherals (with tablet)** | **$329** |
| **Batter end peripherals (with TV)** | **$1,159** |

---

### Box 2: Machine End Box

Mounted near the pitching machine house. Controls the LED targets.

| Item | Cost |
|---|---|
| NEMA 4X enclosure (small, IP65) | $30 |
| CM-TC-01 (custom board) | $29 |
| Mean Well 5V 20A PSU x2 | $34 |
| **Box 2 subtotal** | **$93** |

**Also at machine end (outside the box):**

| Item | Cost |
|---|---|
| 5x LED target zones (WS2812B strips + polycarbonate + aluminum extrusion + JST connectors) | $272 |
| **Machine end peripherals** | **$272** |

---

### Cable Run Between Boxes (~70ft)

| Item | Cost |
|---|---|
| Cat5e outdoor-rated cable (100ft) | $14 |
| RJ45 keystone jacks (2x) | $3 |
| Conduit + cable glands | $26 |
| Mounting hardware (brackets, U-bolts, zip ties) | $54 |
| Surge protector (outdoor, GFCI) | $28 |
| **Cable run + infrastructure** | **$125** |

---

## One Cage — Total

| Component | Tablet Display | Outdoor TV |
|---|---|---|
| Box 1 (Batter End — Jetson + CM-BI-01) | $380 | $380 |
| Batter end peripherals | $329 | $1,159 |
| Box 2 (Machine End — CM-TC-01 + PSUs) | $93 | $93 |
| Machine end peripherals (LED targets) | $272 | $272 |
| Cable run + infrastructure | $125 | $125 |
| Assembly labor (10 hrs) | $305 | $305 |
| **ONE CAGE TOTAL** | **$1,504** | **$2,334** |

---

## The Hub (1 per venue)

Sits at the entrance or central location. Runs tournament brackets, cross-cage leaderboard, entrance display.

| Item | Cost |
|---|---|
| Raspberry Pi 5 (4GB) | $90 |
| microSD 64GB | $12 |
| Pi case + active cooling | $18 |
| 27" LED display (entrance) | $185 |
| VESA wall mount | $25 |
| HDMI cable | $8 |
| USB-C power supply | $14 |
| **Hub subtotal** | **$352** |

**Venue networking (shared across all cages):**

| Item | Cost |
|---|---|
| 16-port managed gigabit switch | $180 |
| Patch cables (10x) | $80 |
| Switch housing / patch panel | $45 |
| Cable management | $75 |
| **Networking subtotal** | **$380** |

**Hub setup labor (8 hrs @ $35):** $280

| | |
|---|---|
| **TOTAL HUB + VENUE INFRASTRUCTURE** | **$1,012** |

---

## N Cages + Hub — The Formula

```
Total = (N × per-cage cost) + $1,012 hub
```

### Tablet Display

| Cages | Cage Cost | Hub | Total | Per-Cage Effective |
|---|---|---|---|---|
| 1 | $1,504 | $1,012 | **$2,516** | $2,516 |
| 3 | $4,512 | $1,012 | **$5,524** | $1,841 |
| 9 (one venue) | $13,536 | $1,012 | **$14,548** | $1,616 |
| 18 (two venues) | $27,072 | $2,024 | **$29,096** | $1,616 |
| 50 | $75,200 | $6,067 | **$81,267** | $1,625 |

### Outdoor TV

| Cages | Cage Cost | Hub | Total | Per-Cage Effective |
|---|---|---|---|---|
| 1 | $2,334 | $1,012 | **$3,346** | $3,346 |
| 3 | $7,002 | $1,012 | **$8,014** | $2,671 |
| 9 (one venue) | $21,006 | $1,012 | **$22,018** | $2,446 |
| 18 (two venues) | $42,012 | $2,024 | **$44,036** | $2,446 |
| 50 | $116,700 | $6,067 | **$122,767** | $2,455 |

---

## One-Time Costs (before first production unit)

| Item | Cost | Notes |
|---|---|---|
| Prototype PCB runs (2 spins each board) | $672 | 5 boards each, JLCPCB |
| Test fixtures (3D printed jigs + pogo pins) | $225 | For production testing |
| 2 pilot cage builds (dev/validation) | $3,600 | These become your first real cages |
| FCC + ETL certification | $10,000–$18,000 | Required before selling to external venues |
| **Total NRE** | **$14,500–$22,500** | |

*Pilot at Batter Up does not require full certification.*

---

## Summary

| What We Build | Tablet Config | Outdoor TV Config | Our Product Cost |
|---|---|---|---|
| **CM-TC-01** (Target Controller board) | $29 | $29 | **$29** |
| **CM-BI-01** (Batter Interface board) | $22 | $22 | **$22** |
| **Box 1** (Batter End — Jetson + CM-BI-01 + SSD + PSU + enclosure) | $380 | $380 | **$380** |
| **Box 2** (Machine End — CM-TC-01 + PSUs + enclosure) | $93 | $93 | **$93** |
| **Our product per cage** (Box 1 + Box 2) | **$473** | **$473** | **$473** |
| Peripherals + install (camera, LEDs, speakers, display, cabling, labor) | $1,031 | $1,861 | — |
| **One cage total** | **$1,504** | **$2,334** | — |
| **One venue (9 cages + hub)** | **$14,548** | **$22,018** | — |
| **NRE (one-time)** | $14,500–$22,500 | $14,500–$22,500 | — |

The "product" — what we actually design, manufacture, and own the IP for — is **$473 per cage**. Two boxes, two custom boards, plus off-the-shelf compute. Everything else is installation materials and peripherals.
