# Cage Match — Compliance Cost and Timeline Estimate

**Date:** April 9, 2026
**Prepared by:** DFM & Test Engineer
**Scope:** Regulatory compliance path for 50-unit commercial product

---

## Executive Summary

At 50 units sold commercially to venues, Cage Match is a commercial amusement device with 120VAC mains input and RF emissions. The minimum viable compliance path requires FCC Part 15 Subpart B (unintentional radiator) for the system as a whole, a UL safety evaluation against UL 62368-1, and consideration of state amusement device laws in NY and other target markets. Full CE marking is optional until EU sales. Budget $8,000–$18,000 and 10–20 weeks from board tape-out to compliant product, depending on how much you do yourself.

The good news: your off-the-shelf modules carry substantial certification credit. The custom work is on two PCBs, the system integration, and the safety review of the 120VAC input. None of this is insurmountable for a 50-unit run.

---

## 1. Required Certifications and Why

### FCC Part 15 Subpart B — Unintentional Radiator (MANDATORY)
**Applies because:** Any digital device sold or imported in the US that is not intentionally radiating but generates RF energy above specific thresholds must comply. Your switching PSUs, Ethernet PHY (W5500), high-speed SPI bus, and CSI camera interface all generate conducted and radiated emissions. This is not optional. Selling even one unit without FCC authorization is a federal violation.

**Scope:** The system-level product (complete Cage Match unit) needs a compliance declaration. The ESP32-S3 module's FCC ID covers its intentional radiator functions. Your custom PCBs need to not violate the emissions limits at the system level.

**Path options:**
- If WiFi stays disabled permanently: Unintentional radiator only. FCC SDoC (Supplier's Declaration of Conformity) is available if you can demonstrate compliance through testing. No FCC filing fee, no FCC ID required. You retain a test report.
- If WiFi is ever enabled: The ESP32-S3 module FCC ID covers the intentional radiator portion, but you still need system-level SDoC for the unintentional emissions from the rest of the system. The module's FCC ID does not automatically cover the host product.

**Recommendation:** Since WiFi is deprioritized in favor of wired Ethernet, file as an unintentional radiator under SDoC. This is the cheapest path.

### UL 62368-1 (Audio/Video/IT Equipment Safety) — STRONGLY RECOMMENDED
**Applies because:** Your product takes 120VAC mains input and is used by members of the public, including children, in a commercial setting. UL 62368-1 is the applicable safety standard for equipment with AC mains that includes AV and IT functions.

**Critical distinction:** UL listing is not federally mandated, but:
- Many commercial venues (and their insurers) will require it before allowing equipment on premises
- OSHA's NRTL program means UL/ETL/CSA marks carry legal weight in commercial settings
- New York State and most states require third-party safety certification for permanently installed commercial electrical equipment
- Liability exposure without a safety mark, if a child is injured, is severe

**Practical reality:** A 50-unit commercial product in a public venue that takes 120VAC and is touched by children will face insurance and venue requirements that effectively mandate safety certification. Treat this as required.

### NEC (National Electrical Code) — PERMITTING CONSIDERATION
**Your responsibility:** Ensure product documentation specifies installation by a licensed electrician, include a GFCI requirement, and specify accessible disconnect. This is documentation work, not certification work.

### New York Amusement Device Law — POSSIBLE
NY Agriculture and Markets Law Article 4-C regulates amusement devices. Whether Cage Match classifies as an "amusement device" depends on interpretation. At the single-cage pilot at Batter Up, you are operating it (not selling). The venue already operates under permits covering the pitching machines. Consult a NY attorney before selling systems to other venues. This is a $500 legal opinion.

### ADA Compliance
Primarily the venue operator's responsibility, not the equipment manufacturer's. Minimal direct obligation for initial product.

### RoHS — Administrative Only
If using standard commercial components (ESP32, Mean Well, WS2812B, W5500), you are almost certainly already RoHS compliant. Obtain supplier declarations. $0–$500.

### CE Marking — EU Sales Only
Not required for US sales. Budget €5,000–€15,000 when/if EU expansion is considered.

---

## 2. What Off-the-Shelf Modules Already Cover

| Module | FCC | UL/Safety | Implication |
|---|---|---|---|
| Jetson Orin Nano Super | FCC ID covered (NVIDIA) | Covered | Does NOT auto-cover host system, but removes Jetson as uncertified emissions source |
| ESP32-S3 module (pre-certified) | FCC ID covers WiFi/BLE | Module-level only | WiFi use requires host product not violate grant terms |
| Mean Well PSUs | Component safety covered | UL listed as components | Reduces system-level safety evaluation scope significantly |
| Arducam IMX477 | Camera module certified | Module-level | Reduces emissions testing burden |

**What's left to certify:**
1. System-level unintentional radiated emissions (your PCBs, cables, and chassis)
2. System-level safety (proper isolation from mains, accessible disconnect, overtemperature protection)
3. Conducted emissions on AC line (switching PSU combination)

---

## 3. Testing Required for Custom PCBs

**CM-TC-01 (Target Controller):**
- Radiated emissions from Ethernet lines, SPI bus, power traces
- If ESP32 WiFi is active: must not violate module grant conditions
- Conducted emissions at AC inlet level (not per-board)

**CM-BI-01 (Batter Interface):**
- Creepage/clearance review if near 120VAC mains (optocoupler isolation barrier)
- Optocoupler isolation rating must be documented, PCB layout must maintain required separation
- Audio DAC clock harmonics (minor concern)

**System integration:**
- Full product radiated emissions sweep (OATS or semi-anechoic chamber)
- Conducted emissions on AC inlet
- Safety review: mains terminal markings, grounding, creepage distances, strain relief, thermal

---

## 4. Cost Estimates

### Pre-Compliance EMI Scan (DIY)
- Near-field probe set (Tekbox TBFC2): $150–$400
- TinySA Ultra spectrum analyzer: $120
- Total DIY setup: $300–$500
- **Value:** Identify problem areas before paying $2,500/day for a test chamber

### FCC Part 15 Subpart B SDoC
| Step | Cost | Timeline |
|---|---|---|
| Pre-compliance scan (DIY or lab) | $0–$3,000 | 1–2 weeks |
| Full OATS/SAC test + report | $2,500–$5,000 | 1 day + 2 weeks report |
| SDoC documentation | $500–$1,500 | Included |
| **Total FCC path** | **$3,000–$7,000** | **4–8 weeks** |
| Re-test if first test fails | $2,000–$3,500 additional | +2–4 weeks |

### UL Safety Evaluation (UL 62368-1)
| Path | Cost | Timeline |
|---|---|---|
| UL field labeling (low-volume) | $3,000–$8,000 | 4–8 weeks |
| Full UL listing | $8,000–$20,000 | 12–20 weeks |
| ETL listing (Intertek — recommended) | $5,000–$8,000 | 8–14 weeks |

### Combined Total
| Item | Low | High |
|---|---|---|
| FCC SDoC | $3,000 | $7,000 |
| Safety (ETL listing) | $5,000 | $12,000 |
| RoHS documentation | $0 | $500 |
| Legal opinion (NY amusement device) | $500 | $1,500 |
| Contingency (one re-test) | $2,000 | $3,500 |
| **Total** | **$10,500** | **$24,500** |

**Realistic target:** $12,000–$16,000 for a well-prepared product.

---

## 5. Testing Strategy

### DIY Pre-Compliance
1. Buy near-field probe set + TinySA Ultra (~$300–$500)
2. Probe custom PCBs in-circuit at worst-case operating condition
3. Identify largest emitters (traces, ICs, cables)
4. Fix before formal testing

### Most Cost-Effective Path
1. DIY near-field scan during hardware bring-up — free to fix issues early
2. Clean up EMI at PCB level — ferrite beads, decoupling caps, ground pour
3. One pre-compliance chamber session ($1,500–$3,000) before formal submission
4. Combine FCC and safety testing at the same lab — package discount
5. ETL over UL — Intertek is cheaper and faster, legally equivalent

### Can You Skip UL at 50 Units?
**Pilot (family business, not sold):** No federal law requires UL for equipment you build and operate yourself. Inform insurer. Get field labeling if they ask ($3,000–$5,000).

**50 units sold commercially:** No. Venue insurance requires listed equipment. Liability exposure without safety mark is severe. Get ETL listing before shipping unit 2 to an external customer.

---

## 6. Risk Assessment by Stage

**Stage 1: Pilot at Batter Up (family business)**
- FCC risk: Low (experimental device, not sold)
- Safety risk: Medium (have electrician do AC wiring, use listed PSUs)
- Amusement device risk: Low (overlay on existing permitted equipment)

**Stage 2: Selling to external venues**
- FCC risk: High without SDoC (federal violation, $16K/violation)
- Safety risk: Very high without ETL (one injury lawsuit exceeds entire cert budget 100x)
- State amusement device risk: Medium-high (varies by state)

---

## 7. Timeline: Board Design to Fully Certified

```
Week 1–2:   PCB design finalization (add EMI mitigation footprints)
Week 3–4:   PCB fabrication + assembly (JLCPCB 5–7 day turnaround)
Week 4–6:   Hardware bring-up + DIY near-field pre-compliance scan
Week 5–6:   Book pre-compliance chamber session (2–3 week lead)
Week 6–8:   Safety documentation package (parallel with EMI work)
Week 7–10:  Formal FCC testing (OATS/SAC) + SDoC
Week 8–14:  Safety evaluation (ETL/Intertek) — runs in parallel with FCC
Week 14–20: First production run — certified product
```

**Total: 14–20 weeks from board design complete to certified.**
**Compressed: 12–14 weeks if aggressive and pass FCC first attempt.**

---

## 8. Immediate Design Actions (Zero Cost, High Value)

Add to PCB design BEFORE fabrication:

1. **WS2812B data line series resistor footprint** (33 ohm, 0402) on CM-TC-01. Leave 0 ohm default; populate during EMI testing if needed.
2. **Common-mode choke footprint** on Ethernet data lines (WURTH 7427422, 0805 differential). $0.50 component that eliminates most common FCC failure.
3. **Ferrite bead footprints** (0805) on every DC power rail input on both boards.
4. **Test points** on every power rail and key signals (production test + certification lab).
5. **Optocoupler isolation barrier** documented in silkscreen/fab notes on CM-BI-01 for UL reviewer.
