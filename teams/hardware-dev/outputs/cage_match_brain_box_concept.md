# Cage Match Brain Box — Enclosure Concept Document

**Rev 0.1 — 2026-04-09**
**Author: MCAD Engineer**

---

## Overview

The Brain Box is the primary per-cage unit. Single weatherproof enclosure housing Jetson Orin Nano + CM-BI-01 HAT + Arducam IMX477 camera. Mounts at the batter end, aims down the 70ft cage.

---

## Layout

Horizontal enclosure, split into two internal bays:

```
┌──────────────────────────────────────────────┐
│                                              │
│  ┌──────────────────┐ │ ┌─────────────────┐  │
│  │  COMPUTE BAY      │ │ │  CAMERA BAY      │  │
│  │                   │ │ │                  │  │
│  │  Jetson (face-up) │ │ │  IMX477 module   │  │
│  │  CM-BI-01 on top  │ │ │  CS-mount lens   │  │
│  │  NVMe under       │ │ │  facing forward  │  │
│  │  80mm fan above   │ │ │                  │  │
│  │  heatsink         │ │ │  [Optical window] │  │
│  └──────────────────┘ │ └─────────────────┘  │
│               THERMAL BAFFLE                  │
│  Cable glands (bottom edge, compute side)     │
└──────────────────────────────────────────────┘
```

- **Left:** Compute bay (Jetson + HAT + fan + cooling)
- **Right:** Camera bay (sealed, desiccant, optical window)
- **Thermal baffle** separates bays — 4mm HDPE or aluminum sheet with foam gasket

## Dimensions

- **Internal:** ~220 x 95 x 145mm
- **External (without mount):** ~230 x 105 x 160mm (9" x 4" x 6.5")
- **With mount assembly:** ~230 x 185 x 200mm
- **Weight:** ~2.5 kg total

## Camera Integration

- 50mm diameter optical-grade polycarbonate window (AR-coated, 4mm thick)
- Silicone O-ring seal (AS568-214) for IP65
- Camera bay hermetically sealed — no vents, no cable glands
- 5g silica gel desiccant pack (replace annually)
- CSI ribbon cable passes through routed slot in baffle, sealed with RTV

**Anti-fog:** Sealed dead zone + desiccant. No heater needed for Long Island temps (-10°C min).

**Thermal isolation:** Baffle blocks compute heat. Fan exhausts upward, away from camera. Camera sensor draws <500mW — tracks ambient temp. Will not exceed 50°C even on 95°F summer day.

## Thermal Management

Filtered forced-air through compute bay only:

1. **Inlet:** IP65 filtered vent panel, bottom-right (80x80mm)
2. **Fan:** 80mm axial (Noctua NF-A8 PWM, 16 dB(A)) — pulls air up through Jetson heatsink
3. **Exhaust:** IP65 filtered vent, top wall

Chimney effect: cool air enters bottom → heatsink → fan → exits top. Filter panel snap-removable for quarterly cleaning without opening enclosure.

At 25W Jetson load + 50°C ambient → heatsink peak ~85°C (throttle at 95°C — within spec but tight with clean filter).

## Mounting System

Two-stage adjustable mount:

1. **Structure plate:** Universal — U-bolt clamp for 1.5-2.5" pipe, or through-bolt for wall
2. **Tilt/pan gimbal:** Friction-lock, two 10mm hex bolts
   - Tilt: +20° to -45° (primary aim: 25-30° down)
   - Pan: ±30°

Camera aimed while powered on — installer watches live feed on phone browser.

## Cable Glands (all bottom-exit)

| Position | Gland | Cable |
|---|---|---|
| 1 | M16 IP68 | 19V DC power input |
| 2 | M16 IP68 | Ethernet RJ45 to Target Controller |
| 3 | M12 IP68 | Token signal to CM-BI-01 |
| 4 | M16 IP68 | Speaker output |

Power brick stays external (in weather-rated junction box near wall).

## Materials

| Part | Prototype | Production |
|---|---|---|
| Enclosure body | White/light gray ASA (FDM print) | ABS+PC injection mold |
| Optical window | Optical-grade PC (Lexan OQ), AR-coated | Same |
| Lid gasket | EPDM 3x5mm cord | Same |
| Window O-ring | Silicone | Same |
| Thermal baffle | 4mm HDPE sheet | Same |
| Fasteners | M3/M4 316 stainless steel | Same |

**Do not use regular polycarbonate** for window — hazes in UV within 18 months. AR-coated optical PC holds 5+ years.

**Print enclosure in white/light gray** — stays 10-15°C cooler than black in direct sun.

## Manufacturing Path

| Phase | Method | Est. Cost/Unit |
|---|---|---|
| Prototype (1-3 units) | ASA FDM print | ~$30 enclosure |
| Pilot (4-50 units) | Machined aluminum (Hammond/Bud) + window bore | ~$80-100 |
| Production (50+ units) | Injection mold ABS+PC | ~$18-22 (tooling: $8-15K) |

Injection mold tooling not worth it until 200+ units. Use machined aluminum for 50-unit run.

## Mechanical BOM (50-unit pricing)

| Category | Cost |
|---|---|
| Enclosure + sealing (machined aluminum + window + gaskets) | ~$110 |
| Thermal (Noctua fan + IP65 filter panels) | ~$35 |
| Cable glands (4x) | ~$8 |
| Mount hardware (gimbal + plate + U-bolt) | ~$35 |
| **Total mechanical** | **~$188** |

Note: This is the enclosure/mechanical cost only. Electronics (Jetson, CM-BI-01, camera, SSD, PSU) are separate line items.

## Open Questions

1. CSI ribbon cable length — 100mm may be marginal with baffle routing. May need 150mm.
2. CM-BI-01 populated height — verify electrolytic caps don't exceed 20mm above GPIO header.
3. Fan noise — budget for Noctua NF-A8 ($20), not generic ($5). PWM from Jetson fan header.
4. IP65 filter clog rate in batting cage environment — quarterly cleaning, add to ops manual.
5. Camera aim calibration — software must show live feed during installation for aiming.

## Next Steps

1. FreeCAD parametric model — enclosure shell first
2. Place Jetson + camera STEP models to verify fit
3. Detail gasket grooves, vent panels, cable gland bore
4. 3D print prototype in white ASA
5. Fit check with real Jetson + camera hardware
