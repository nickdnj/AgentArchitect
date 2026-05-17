# K1000-D — DFM, Test, and Compliance Readiness Briefing

**Project codename:** K1000-D (Pentax K1000 → digital conversion)
**Author:** dfm-test-engineer (Hardware Dev Team)
**Date:** 2026-05-17
**Status:** Phase 1 — feasibility & costing
**Inputs:** ConOps, Systems Engineering (REQ-001…REQ-065), Mechanical Design (§3 alignment plate, §12 tolerance stack), Electrical Design (H11AA1 + SMAJ100CA carrier PCB), Firmware/Software (libcamera + gstreamer/WebRTC, ~90 ms latency), BOM & Costing (kit at $311 qty 100 / $201 qty 1000)
**Audience:** systems-engineer (sign-off), mcad-engineer, pcb-designer, firmware-engineer, supply-chain-manager

---

## 0. Executive Summary

The K1000-D is **manufacturable at qty 100 with a defensible 82–88 % first-pass yield** if and only if three things hold:

1. The flange-focal calibration step is performed against a **live image-plane MTF check** (not a depth gauge alone), with the alignment plate + shim pack as designed. This is a ~14-minute-per-unit skilled-tech operation.
2. The carrier PCB is built at JLCPCB econ SMT, panelized 4-up, with the H11AA1 + SMAJ100CA front-end **tested against a real 300 V trigger flash** (REQ-044, RISK-01 from electrical brief) on every panel.
3. The kit-business model is adopted (per supply-chain recommendation §7.3 of BOM brief), which **collapses most of the compliance burden** onto the end-user assembly and lets us ship the carrier PCB alone as an FCC-declared module.

**Single biggest manufacturability risk:** the **±0.05 mm flange-focal tolerance (REQ-030)** does not close with the as-designed mechanical stack-up (RSS = ±0.18 mm per §12 of mech brief). Shimming is **mandatory and per-unit**. This is the dominant yield, labor, and cycle-time driver. We recommend keeping the CNC + brass shim pack process for qty 100 and only switching to an automated optical-alignment fixture if we commit to qty ≥ 500 / year.

**Top pre-EVT decision for systems-engineer:** lock the **interpretation of REQ-006** ("the system shall save each captured frame as JPEG (M) and DNG/RAW (S) to onboard storage"). The capture-latency budget, the storage choice (USB-SSD vs eMMC, Lever 1 of BOM §4), the calibration acceptance test, and the production yield model all swing on whether the M-priority commit is "JPEG in RAM queue with 5 s safe-shutdown window" or "DNG fully fsync'd". Per firmware §2.2, the former is achievable in <50 ms and the latter is ~150 ms.

---

## 1. DFM Review — Mechanical Design

### 1.1 Findings against the mechanical brief

The mechanical brief (`k1000_digital_mechanical_design.md`) calls out three classes of parts. I review each for manufacturability at qty 100 and qty 1000.

| Spec | Mech brief reference | DFM verdict | Comment |
|---|---|---|---|
| Alignment plate, 6061-T6, 2 mm, surface-ground both faces, ±0.01 mm flatness, ±0.02 mm thickness | §3.3 | **OK at qty 100. Marginal at qty 1000.** | The surface-grind operation is the chokepoint. At qty 100 a US machine shop can grind 100 plates in a single setup over ~2 days (≈$25/plate). At qty 1000 the grind throughput becomes the gating cost — see §1.3. |
| Body adapter ring, SLA resin (proto) / CNC aluminum (production), ±0.05 mm overall | §3.3 | **OK at qty 100 in SLA. OK at qty 1000 in IM with post-machining.** | The proto SLA path is fine at qty 100 ($11/unit, JLC3DP). At qty 1000 the mech brief calls for injection molding ($12k tooling, ~$1.50/part) — but the bosses that register against the alignment plate need a secondary CNC op to hit ±0.05 mm (typical IM tolerance is ±0.10 mm). Budget ~$1.50 extra per unit for the post-op. |
| Rear hump shell, PETG (proto) / injection-molded PC (production) | §5.3 | **OK at both volumes.** | Standard plastic part. PETG print at qty 100 is mechanically adequate. PC injection at qty 1000 is mainstream. |
| Brass shim pack, 0.025 / 0.050 / 0.100 mm | §3.3 | **OK.** | Hand-selected at assembly. McMaster off-shelf. |
| M2 × 4 stainless screws + heat-set inserts | §3.3 | **OK.** | Standard. |
| Light-seal foam channel (replicates original) | §5.3 | **OK at qty 100 (die-cut). OK at qty 1000 (compression-molded).** | Aki-Asahi camera-repair foam supplier sells 1 m strips; pre-cut at qty 100 is acceptable manual operation (~30 s/unit). |
| Hinge / latch geometry adapter spanning K1000 production-year variants | §9 R4 | **HIGH-RISK ITEM.** | The mech brief itself flags this. Production runs need a hinge geometry survey across 5+ donor bodies. If we ship as a kit, this risk **partially transfers to the user** — they supply the donor and we provide the hump with two adapter inserts (early vs late K1000) plus instructions. **Recommend two-SKU adapter kit.** |

### 1.2 The ±0.05 mm flange tolerance — the actual question

The mech brief's §12 tolerance stack-up worksheet shows **±0.18 mm RSS** before shimming. Shimming is non-optional. Per §12, the production labor budget needs ~15 minutes per unit for shim calibration. I think 15 minutes is **optimistic by ~30%** for a process that includes:

- Flange depth gauging (1 min)
- Shim pack selection from 4 corners (2 min)
- Assemble sensor PCB to plate (1 min)
- Mount alignment plate + ring into body (1 min)
- Power up Pi, attach reference K-mount lens, mount on optical bench (2 min)
- Acquire image of collimated infinity target (1 min)
- Run automated MTF50 corner-and-center analysis (Python script, ~30 s)
- If out-of-spec: disassemble, adjust shims, re-test (probable 30–50 % of units need one iteration, 10–15 % need two iterations)

Realistic per-unit time at qty 100: **first pass ~12 min, iteration adds ~6 min per pass. Weighted average ≈ 17 min** at qty 100, dropping to **~12 min** at qty 1000 as tech proficiency builds.

#### Labor cost translation

Skilled-tech rate at a US contract assembler: $48/hr loaded. At a Chinese assembler (per BOM §11.1, JLCPCB EMS or PCBWay PCBA+box-build): ~$11/hr loaded for an IPC-A-610 class-2 tech.

| Volume | Path | Per-unit calibration time | Labor cost / unit |
|---|---|---:|---:|
| Qty 10 (proto) | DIY / engineering bench | 25 min (first units) | $20 (internal cost) |
| Qty 100 (kit, US assembly) | US CM (Saline, MacroFab) | 17 min weighted | **$13.60** |
| Qty 100 (kit, Shenzhen) | JLCPCB / PCBWay PCBA + box-build | 17 min weighted | **$3.12** |
| Qty 1000 (kit, Shenzhen) | PCBWay box-build at volume | 12 min weighted | **$2.20** |

Per BOM §2.1 line 28, supply chain budgeted **$6.50 calibration / unit at qty 100** and **$3.20 / unit at qty 1000**. My estimate for Shenzhen assembly **fits within the BOM budget at qty 100** ($3.12 < $6.50, giving $3.38 headroom for fixture amortization) and is **tight but achievable at qty 1000** ($2.20 < $3.20).

**This validates the BOM cost model on the calibration line.** It does NOT validate a US assembly path at the qty-100 budget; US labor adds $10/unit and would force a price rise.

### 1.3 Is CNC + shim pack sustainable, or should we automate?

This is the key open question from the prompt. Three production processes considered:

#### Option A — CNC plate + manual brass shim pack (mech brief baseline)

- **Plate:** CNC 6061-T6, both faces surface-ground. Source: SendCutSend + local grind shop at qty 100; batch CNC + grind at offshore mill at qty 1000.
- **Shim selection:** tech selects 1–4 brass / Mylar shims per corner from a kitted shim pack to hit MTF50 acceptance on collimated infinity target.
- **Plate cost:** $25/unit at qty 100, $15/unit at qty 1000.
- **Cycle time:** 17 min (qty 100) / 12 min (qty 1000) including iteration.
- **Per-unit labor:** $3.12 (CN) / $13.60 (US) at qty 100; $2.20 at qty 1000.
- **Fixture cost:** ~$4,000 for the optical-bench MTF jig (Newport breadboard + collimator + reference lens + Pi/camera readout) — one-time, amortized over the program.
- **Yield estimate:** 88–92 % first-pass acceptance at qty 100 (10–15 % need rework). Plate is reusable; shim swap is free; only labor and time lost.

#### Option B — Automated optical alignment + adhesive cure fixture

- **Process:** sensor PCB placed in a 5-axis motorized fixture against the body adapter ring. Camera captures collimated test pattern; closed-loop PID drives sensor to MTF50 peak across center + 4 corners; UV adhesive is dispensed and cured to lock the sensor in position (no shims).
- **Capex:** ~$45–65k for a turnkey fixture (Newport / Aerotech 5-axis stage + machine vision + UV dispense head + PLC). Custom-built equivalents at $25–35k from Asian integrators but with long lead and tuning risk.
- **Plate cost:** plate becomes a printed/cast carrier (no grinding needed since the adhesive replaces the precision shim). **Saves ~$10/unit at qty 1000** in plate cost.
- **Cycle time:** ~3 minutes/unit, almost fully automated (load, cycle, unload). One operator can run 2 fixtures in parallel → ~1.5 min effective.
- **Per-unit labor:** $0.30 at qty 1000 (operator load/unload only).
- **Yield estimate:** 96–98 % first-pass at steady state after 50-unit tuning curve. Reject path is harsher: UV adhesive cure is one-shot; misalignment after cure = scrap sensor PCB (≈$97 lost).
- **Throughput:** 1 fixture = ~320 units/shift. Single fixture supports up to ~12,000 units/year.

#### Option C — Hybrid: CNC plate but motorized shim selection

- Motorized fixture measures depth at 4 corners with capacitive probes; a robotic shim-picker places exact-thickness shims from a feeder before sensor screw-down.
- **Capex:** ~$18–25k.
- **Cycle time:** ~6 min/unit including the live MTF verification.
- **Yield estimate:** 92–94 %.
- **Per-unit labor:** $1.20 at qty 1000.
- Useful only if labor cost in target geography exceeds $20/hr and Option A is no longer viable.

#### Recommendation

| Annual volume | Recommended process | Per-unit cost (calibration+plate) | Breakeven note |
|---|---|---:|---|
| Up to ~300 units / yr | **Option A** (CNC + manual shim) | $25 + $3 = ~$28 | Capex < $5k. Easy to start, easy to stop. |
| 300 – 1,500 units / yr | **Option A**, optionally Option C if labor geography forces it | $15 + $2 = ~$17 | Option B's $45k capex doesn't recover in <2 years at this volume. |
| 1,500 – 12,000 units / yr | **Option B** (automated optical + UV adhesive) | $5 + $0.30 = ~$5.30 | $45k capex pays back in ~9 months at 5,000 units/yr. |
| > 12,000 units / yr | **Option B** with second fixture | $5 + $0.20 = ~$5.20 | Second fixture for redundancy + throughput. |

**Bottom line:** at the BOM's stated qty 1000 target (which the supply-chain brief models as a multi-quarter campaign, not annual recurring), **Option A is correct**. Option B is the recommended upgrade if K1000-D becomes a recurring product line in P6 (per systems §7).

This is consistent with the BOM brief §4 Lever 5 (die-cast Al flange ring at qty 1000), which we'd flag as **not yet recommended** — die-cast tolerance is ±0.10 mm typical, would require post-machining ($1.50–$2.00/unit extra), and saves only $7/unit. The CNC + shim path is the safer engineering choice.

---

## 2. DFM Review — Electrical Design

### 2.1 Carrier PCB review against electrical brief

The electrical brief specifies a 2-layer, 30 × 40 mm, 14-placement carrier PCB with H11AA1 + SMAJ100CA front-end. Walking it for DFM:

| Concern | Status | Note |
|---|---|---|
| Layer count | **OK.** | 2-layer is correct for this density. No high-speed signals (X-sync is sub-MHz, WS2812B is 800 kHz). 4-layer would be NRE for nothing. |
| Trace widths | **Need check.** | The 5 V rail must carry up to 80 mA peak (WS2812B + opto pull-up + bulk cap charge). 0.3 mm trace on 1 oz copper handles 1 A; specify ≥ 0.3 mm. The 250 V worst-case PC-sync trace needs **≥ 1 mm creepage** to the 3.3 V net. Pcb-designer to confirm IPC-A-2221 spacing on layout. |
| Component spacing | **OK.** | 14 placements on 1200 mm² is loose. JLCPCB minimum is 0.2 mm component edge-to-edge; we have ~2 mm. |
| Panelization | **Recommend 4-up.** | Per electrical §7.4. Panel = 100 × 100 mm with V-groove or mouse-bite tabs. JLCPCB and PCBWay both auto-panelize this geometry. **Specify mouse-bite tabs** (V-groove can crack the SMAJ100CA SMA package on depanel; mouse-bite breakaway is gentler). |
| Solder bridging risk | **Low.** | Largest fine-pitch part is the 0603 passives. Standard reflow. |
| Tombstoning risk | **Low for 0603.** | Specify thermal-balanced pads on R2, R3 (10 kΩ 0603, lowest mass parts). |
| H11AA1 package | **DIP-6 or SMD H11AA1S.** | Electrical brief lists DIP-6. For full SMT assembly **specify H11AA1S (SOIC-6)** to avoid mixed wave + reflow. Cost delta < $0.10. Pcb-designer to update. |
| SMAJ100CA | **OK in SMA.** | Standard part. |
| C1 (10 nF X1Y2 safety cap, 1812) | **OK.** | Safety-rated cap is correct for the line-voltage front-end. |
| R1 (2.7 kΩ 1 W 2512) | **OK but mind the heat.** | At a 250 V worst-case event clamped to 100 V by the TVS, R1 dissipates ~3.7 W for the duration of the TVS conduction (microseconds). Pulse rating dominates. 2512 thick-film rated for 1 W steady + significant pulse energy. Spec the part as 1 W min pulse 5 J — verify with Vishay PR series datasheet. |
| Test points | **GOOD — already specified.** | TP1–4 on UART + 3.3 V + GND. Add TP5 on X-sync conditioned line (post-opto, pre-Pi) so test fixture can probe without de-soldering. **Action: pcb-designer to add TP5.** |
| Mounting | **GOOD.** | 2× M2.5 to Pi GPIO standoff + 2× M2 to bracket. Standard. |
| 220 µF / 6.3 V polymer bulk cap | **OK.** | Specified in §7.2 of electrical brief. D-case package. Sufficient ripple capacity. |
| JST-XH 6-pin to Pi GPIO | **OK.** | Standard. Second source Molex 22-23-2061 already qualified per BOM §9. |
| Tag-Connect TC2030 footprint | **OK if added.** | Electrical §6.2 mentions "solder pad / Tag-Connect TC2030 for in-field debug". Confirm the layout includes the actual 6-pin TC2030 footprint, not just bare pads. Cost: $0 in BOM (no part fitted, just pads). Big win for field debug. **Action: pcb-designer to confirm.** |

### 2.2 Assembly path at qty 100 / 1000

| Step | Qty 100 (JLCPCB econ SMT) | Qty 1000 (JLCPCB or PCBWay) |
|---|---|---|
| Fab | $70 / 25 panels (4-up) = $0.70/board | $0.41/board (per electrical §7.5) |
| Stencil | $7 one-time | $7 one-time |
| Setup (PnP nozzle teach + first article) | $30 | $30 (same NRE; amortizes to $0.03/board) |
| BOM (LCSC econ tier) | $1.30/board | $0.95/board (LCSC volume) |
| Assembly fee | $0.66/board (econ SMT, 14 placements at $0.0017 each + handling) | $0.45/board |
| Test labor (functional, 30 s/board) | $0.13 (CN tech) | $0.10 |
| Reject allowance 2 % | $0.06 | $0.04 |
| **Per-board total** | **~$2.85** | **~$1.99** |

**Validates electrical brief §7.5 ($2.16/board qty 100, $1.99/board qty 1000).** My $2.85 is slightly higher because I included a 30 s functional test step (continuity, 3.3 V rail present, opto continuity from one of the JST pins) — this is a small departure and arguably worth the cost.

### 2.3 Domestic CM vs JLCPCB vs PCBWay

| Factor | JLCPCB | PCBWay | Domestic (MacroFab / Saline) |
|---|---|---|---|
| Per-board cost qty 100 | $2.16 | ~$3.50 | ~$8–12 |
| Per-board cost qty 1000 | $1.99 | ~$2.50 | ~$5–7 |
| Lead time | 2–3 wk | 3–4 wk | 4–6 wk |
| LCSC parts library coupling | Native (zero markup) | Decent | None — parts shipped separately |
| Component shortage tolerance | Strong (LCSC inventory deep) | Strong | Weak (we self-source) |
| Quality (IPC class) | Class 2 default, class 3 available with premium | Class 2/3 | Class 2/3 standard |
| Box-build / cosmetic assembly | Weak | Mid | Strong |
| English-fluent PMs | Variable | Good | Excellent |
| ITAR / data-residency | Not applicable | Not applicable | US-based |
| Tariff exposure (2026 baseline) | China → US 25 % HTS subject to current schedule | Same | None |

**Recommendation:** JLCPCB for the carrier PCB through qty 1000. PCBWay if the carrier needs box-build integration with the rear-hump enclosure (PCBWay's mechanical-assembly tier is stronger). Domestic CM only if a US-Buy-American or government-customer angle emerges that justifies the 3× cost premium.

**Tariff watch (BOM §13 sensitivity table):** the +25 % tariff scenario raises the qty 1000 unit cost by $50 to $250. If that comes to pass, the savings from moving carrier-PCB assembly to a tariff-exempt geography (Mexico via MacroFab USMCA, or Vietnam via emerging EMS) outweighs the assembly cost premium. Maintain a contingency CM in Mexico (Saline-affiliated Mexico City facility) as a paper qualification for tariff insurance.

### 2.4 Second-source landscape — flag-only items beyond what supply chain caught

The BOM §9 second-source matrix is solid. The dfm-test review surfaces **two additional concerns** the supply-chain brief does not explicitly call out:

1. **Vishay SMAJ100CA TVS.** Multi-sourced (Littelfuse SMAJ100CA, Bourns equivalent), but **the pulse rating differs slightly across manufacturers**. Vishay PAR series: 400 W / 1 ms. Littelfuse SMAJ: 400 W typ, some lots tested to 600 W. Bourns: 400 W. **Spec the Vishay PAR series specifically** for the pulse profile of a 300 V flash trigger event. Don't let a sourcing substitution silently change the protection envelope. **Action: pcb-designer to add a footnote in the BOM.**

2. **WS2812B-2020 status LED.** Worldsemi part. The 2020 SMD package has had documented quality variability (some lots ship with reversed red/green channels, requiring firmware to compensate). **Recommend qualifying APA102-2020 as a second source.** APA102 uses SPI (2-wire clock + data) instead of WS2812B's bit-banged timing — slightly different firmware path but more robust against Pi 5 GPIO scheduling jitter. Both parts are ~$0.12. **Action: firmware-engineer to keep both code paths.**

Single-source parts the supply-chain brief flags adequately: Pi 5 / CM5, Arducam IMX283 Pivariety, PiSugar 3 Plus (or replacement custom power board), donor K1000 body.

**One more flag**: the IMX283 sensor itself is Sony. Sony has an active 7-year EOL announcement cadence; IMX283 was introduced 2017. **At qty 1000 we should request the Sony last-time-buy notification list status** through Arducam's product manager (per BOM §5 risk #3). If IMX283 is within 2 years of LTB, the IMX477 fallback (BOM §9 row 4) gets activated proactively. **Action: supply-chain to query Arducam at design lock.**

---

## 3. Per-Unit Flange-Focal Calibration Procedure

For both tech-built (qty 100/1000) and end-user-built (kit) flows. The kit flow is the harder problem; we'll cover both.

### 3.1 Tech-built calibration (CM floor)

**Equipment per station:**
- Optical bench: Newport breadboard 600 × 600 mm (1 per station, ~$650)
- Reference K-mount lens: Pentax SMC-A 50 mm f/1.4 (known sharp), bench-fitted to lens-only Pentax-K mount stand (~$200)
- Collimator: Edmund Optics 50 mm achromat focused at infinity onto an illuminated USAF 1951 chart at the focal plane (~$450)
- Pi-side acquisition: dedicated test Pi 5 + reference Arducam IMX283 (built once, used as production tooling), wired to laptop via Ethernet
- Calibration software: Python script implementing MTF50 measurement per ISO 12233 sfrmat3 (open source) plus 4-corner reporter (~50 lines of code, on top of OpenCV)
- Depth gauge: Mitutoyo digital depth micrometer 547-217S (±0.01 mm), $185
- Shim pack: 0.025 / 0.050 / 0.100 / 0.200 mm brass shims, 4-corner kit (McMaster 91975A130 series), ~$0.45/unit consumed
- Torque driver: Wiha 28503 (0.2 Nm preset), $48
- UV curing pen + Loctite 425 thread-locker, $15/unit consumed (~5 µL)

**Total station capex: ~$4,000.** One station supports ~50 units / 8 hr shift.

**Step-by-step:**

1. **Pre-assembly check (30 s):** verify alignment plate flatness with depth gauge against a granite reference block. Reject any plate >±0.02 mm from spec. (CM provides plates already inspected; this is incoming QC, not per-unit.)

2. **Mount body adapter ring + alignment plate into donor K1000 body (60 s):** torque screws to 0.2 Nm, no shims yet.

3. **Depth-gauge measurement (90 s):** measure distance from K-mount flange face to alignment plate front face at 4 corners and center. Target: **41.36 mm ± 0.05 mm** (per mech §3.4 step 3, accounting for cover glass + airgap + PCB at known nominal values; refine after first article).

4. **Initial shim selection (90 s):** based on the 5 measurements, select shims to bring all 4 corners within ±0.02 mm of target. Software prompt outputs exact shim combo.

5. **Install sensor PCB (60 s):** drop shims on the 4 mounting bosses, place PCB, hand-tighten M2 screws, then torque to 0.2 Nm.

6. **Mount body to test bench (30 s):** body slides into a kinematic mount on the optical bench; K-mount engages the reference 50 mm lens already aligned to the collimator.

7. **Boot Pi and connect (45 s):** Pi 5 boots from calibration SD card image (different from production image — boots straight into the calibration script). Laptop connects via Ethernet (avoid WiFi/AP delays during cal). Live preview comes up.

8. **Live MTF acquisition (60 s):** software captures 20 frames, averages, runs MTF50 measurement at 9 zones (center + 8 around). **Acceptance: MTF50 ≥ 0.35 cy/px at center, ≥ 0.28 cy/px at all 8 outer zones**, with no zone-pair delta > 0.10. (These numbers come from a calibrated 50 mm f/1.4 lens at f/4 — the lens's own MTF caps the achievable result; the test catches sensor-plane errors, not lens errors.)

9. **Decision branch:**
   - **Pass:** apply thread-locker, final-torque to 0.25 Nm, advance to functional test. **Average path time: ~7 min.**
   - **Marginal (1–3 zones below threshold but > 0.20):** software identifies which corner(s) need adjustment, returns to step 4 with new shim recommendation. **Iteration adds ~5 min.**
   - **Fail (multiple zones < 0.20):** flag for rework station — likely PCB tilt due to a damaged shim or contaminated mounting surface. **~5 % of units. Rework path ~15 min.**

**Per-unit time at qty 100 (target proficiency):** 17 min weighted average (12 min first-pass + iteration tax).
**Per-unit time at qty 1000 (steady state):** 12 min weighted average.

**Acceptance criterion summary:**
- Mechanical: flange-plate distance 41.36 ± 0.05 mm at all 4 corners.
- Optical: MTF50 ≥ 0.35 / 0.28 / 0.28 (center / 8 outer / no pair-delta > 0.10).
- No artifacts in the 20-frame average (no debris on sensor cover glass).

### 3.2 End-user kit calibration (the harder problem)

Per the BOM brief §7.3, the recommended go-to-market is a **kit**. The user supplies the donor K1000 and is responsible for the final assembly and shim selection. This is a non-trivial UX problem because the user does not have a Newport optical bench.

**Proposed kit-calibration approach:**

1. **The kit ships the alignment plate already lapped + pre-shimmed to nominal** based on a measured K1000 body distribution. Per mech §12, the nominal shim stack is 0.175 mm. We ship plates with 0.175 mm spacer pre-installed in 3 of 4 corners; the 4th corner has a removable Mylar pack with finer granularity (5 × 0.025 mm shims) for user adjustment.

2. **The PWA includes a "Calibration" mode.** User does the following:
   - Mount the supplied IMX283 module to the pre-shimmed plate, assemble per instructions, install in their K1000 body.
   - Attach a 50 mm K-mount lens (their own — must be one the user owns; instructions specify "any 50 mm f/1.7 or f/2 K-mount lens, stopped to f/4").
   - Aim camera at a printed calibration chart (included in kit — a USAF 1951 chart at known distance, or a tape-measure-pinned poster the user makes; instructions provide).
   - Open PWA → Settings → Calibrate Focus. PWA captures a frame, runs simplified MTF analysis (downsampled, fewer zones), shows a 4-quadrant color map: green = sharp, yellow = marginal, red = needs adjustment + which direction (forward/backward).
   - User adds/removes shims at the indicated corner per a printed shim chart in the manual. Each adjustment + recheck takes ~3 min.
   - **PWA acceptance:** all 4 quadrants green for 5 consecutive seconds. PWA writes a serialized calibration timestamp + measured MTF data to the Pi for warranty/support purposes.

3. **Acceptance criterion (kit):** less strict than CM floor. MTF50 ≥ 0.25 cy/px at all 4 quadrants. This is the threshold where infinity focus is visibly sharp on a fast K-mount lens; the CM-floor threshold (0.28–0.35) targets "indistinguishable from optimum" and isn't necessary for kit acceptance.

4. **Per-unit time for a moderately-skilled hobbyist** (REQ-065 says exactly this): **30–60 min for first-time builders**, **15–20 min for a second build**. We back this number with a P3 prototype + early-access user test (see §5 field test plan).

**Risks of the kit approach:**
- User damages sensor cover glass during shim swap → support nightmare. Mitigate: kit includes a sensor protection cap that snaps over the PCB, only removed after final shim screw-down.
- User over-torques screws → board warps → MTF fails irretrievably. Mitigate: kit includes a $5 pre-set torque screwdriver (Wiha 28301 0.2 Nm), or the screws are nylon-tipped M2 that snap before they over-torque.
- User cannot find a 50 mm K-mount lens → cannot calibrate. Mitigate: kit calibration mode also accepts a 35 mm, 28 mm, or 100 mm lens; PWA prompt selects appropriate test pattern distance.

---

## 4. End-of-Line Test Fixture Concept

### 4.1 What the EOL fixture measures (and what it does not)

For every unit shipped from the CM (qty 100 / 1000), the EOL fixture validates:

| Test | Measures | Pass criterion | Tied to REQ |
|---|---|---|---|
| **T-01 Boot & AP up** | Time from power-on to hostapd serving SSID "K1000-D" | ≤ 30 s | REQ-054 |
| **T-02 WiFi RF radiation** | TX power on 5 GHz channel 36, scalar level at 0.5 m | -10 to +5 dBm (sanity, not regulatory) | IF-NET-01, REQ-004 |
| **T-03 PWA reachable** | PWA loads on a tethered iPhone proxy (USB Ethernet → Pi → injected iPhone simulator running webrtc-test agent), full HTML+JS round-trip | < 1 s page load, 200 OK on all assets | REQ-050, REQ-051 |
| **T-04 Capture trigger via signal generator** | Inject simulated PC-sync edge (0 → 200 V via test fixture's high-side switch), measure GPIO ISR latency on the Pi + verify capture frame written | ISR latency 50 µs – 5 ms; frame committed | REQ-007, REQ-024 |
| **T-05 Capture-to-thumbnail latency** | Time from injected trigger to thumbnail visible in test client | ≤ 1.5 s | REQ-022 |
| **T-06 Glass-to-PWA preview latency** | LED timestamp method: pulse LED at known time t0 through reference lens onto sensor; iPhone proxy detects pulse arrival via photodiode on screen at t1; report Δt | ≤ 120 ms p95 | REQ-020 |
| **T-07 Sharpness vs depth (sensor flange)** | Capture USAF chart through reference lens, compute MTF50 at 9 zones | MTF50 ≥ 0.32 cy/px center, ≥ 0.25 cy/px corners | REQ-030, REQ-031, REQ-032 |
| **T-08 Power draw (idle, preview, capture)** | Inline current shunt on the 5 V rail (Pi battery side), 3 measurements averaged | Idle 0.5–0.8 A; preview 1.5–2.0 A; capture peak < 3.2 A | Battery model (electrical §2.2) |
| **T-09 X-sync over-voltage immunity** | One-shot: inject 250 V DC pulse through the PC-sync input, hold 100 ms, release; verify Pi still alive + GPIO ISR fires | Pi survives; ISR fires; no Pi reboot | REQ-043, REQ-044 |
| **T-10 USB-SSD write integrity** | Capture 10 consecutive frames, read back via test client, MD5-compare to in-Pi originals | All 10 match | REQ-006 |
| **T-11 Status LED + button** | Software toggles WS2812B through R/G/B/off cycle; test fixture photodiode confirms colors; software triggers button event via GPIO loopback | All four states detected; button event registers | REQ-012 |
| **T-12 Battery state report** | I2C query to PiSugar / power-mgmt board for battery percentage and charging state | Returns plausible value; charging state correct given fixture supply | REQ-041, REQ-042 |

**What the EOL fixture does NOT measure:**
- Long-term battery runtime (REQ-025/026): tested at REL sample only, not every unit.
- Thermal performance at 40 °C (REQ-063): REL sample only, every unit takes too long.
- Drop survival (mech §9 honorable mention): REL sample only.
- iOS PWA real-device install flow: cannot fully automate at EOL; sampled at PVT gate.
- Cosmetic inspection: visual op (separate from electrical fixture), 30 s.

### 4.2 Fixture hardware BOM

| Item | Qty | Cost | Note |
|---|---|---|---|
| Aluminum extrusion frame, 500 × 500 × 800 mm | 1 | $180 | 80/20 series |
| K-mount lens holder bracket + reference 50 mm f/1.4 lens | 1 | $220 | Already on the calibration bench at §3.1; can share |
| Reference iPhone proxy (Pi-based, runs webrtc-test) | 1 | $120 | Single board for the line; standardizes "what is a phone" |
| Signal generator (PC-sync injector) — custom: Arduino + relay + 250 V supply | 1 | $85 | Built in-house |
| 250 V DC bench supply (for T-09) | 1 | $180 | Riden RD6018 or similar |
| LED + photodiode latency pair (T-06) | 1 | $30 | Vishay BPW34 + IR LED + comparator |
| Current shunt + INA226 + Pi-Pico ADC (T-08) | 1 | $35 | |
| RF probe + RTL-SDR for WiFi RF level (T-02) | 1 | $50 | Coarse but adequate |
| Test PC (mini PC running pytest harness) | 1 | $300 | One per line |
| 7" touchscreen for operator pass/fail prompts | 1 | $90 | Raspberry Pi touch display |
| USB hub, cabling, kinematic camera-body holder, ESD mat | 1 | $250 | |
| **Total per fixture** | | **~$1,540** | |
| **Software development (one-time, ~3 weeks)** | | **~$15,000** | Python pytest harness, OpenCV MTF, GUI wrapper, traceability database |

**Total fixture investment: ~$17,000 capex + $1,500 per parallel station.**

### 4.3 Cycle time and throughput

Per-unit EOL test time:

| Step | Time |
|---|---:|
| Mount unit in fixture | 15 s |
| T-01 boot to AP up | 30 s (parallel with operator action) |
| T-02 / T-03 / T-04 (parallel) | 10 s |
| T-05 / T-06 latency tests | 20 s |
| T-07 MTF (uses calibration data from §3 — re-verify only) | 30 s |
| T-08 power tests (3 conditions, 5 s each) | 15 s |
| T-09 over-voltage immunity (single-shot) | 5 s |
| T-10 SSD write integrity (10-shot burst) | 25 s |
| T-11 LED/button cycle | 10 s |
| T-12 battery query | 5 s |
| Operator removes, prints SN label, packs | 30 s |
| **Total per unit (single fixture, single operator)** | **~3.5 min** |

One fixture: ~120 units / 8 hr shift. For qty 100 production: 1 fixture, ~1 day. For qty 1000: 1 fixture supports the entire campaign with margin. **Test labor cost per unit at Shenzhen rates: $0.65; per BOM §2.1 line 27 budget of $3.50 (qty 100), $1.80 (qty 1000), we are well inside.** The EOL test is **not** a cost driver.

### 4.4 Production data capture

Every test result writes to a manufacturing traceability database (SQLite, synced daily to a cloud bucket). Each unit gets a serial number tied to:
- Carrier PCB lot + barcode
- Sensor module S/N (Arducam prints one)
- Pi 5 / CM5 S/N
- Donor K1000 body S/N (if complete unit) — for kits, this stays blank, filled at user registration
- MTF measurement vector at acceptance
- Capture latency p95 / WiFi RF level / battery state at test
- Operator ID, test station ID, timestamp

This enables field-defect root cause: when a returned unit shows "soft corner focus", we can trace back to its as-shipped MTF map and see if it has shifted (thermal, drop) or was marginal at ship.

---

## 5. Field-Test Plan (EVT → DVT → PVT → MP)

### 5.1 First 5–10 prototype units after EVT

Five units, two builds (3 + 2), four-week field test window. Each unit goes to a distinct user persona representing a use case from ConOps §2:

| Unit | User | Scenarios | Data captured |
|---|---|---|---|
| #1 | Project author / hardware-dev team | Daily-driver, mixed indoor/outdoor, 50–100 shots/day | Full session logs (per-shot MTF samples via lens-cap-on dark-frame test, latency telemetry, battery cycle counts, error logs) |
| #2 | Hobbyist photographer (recruited) | Weekend nature walks, varied light, slow shooting cadence | Same telemetry + survey: UX rating, install difficulty, "would you buy" |
| #3 | Camera-modding community member | Stress: hot car (40 °C in-cabin), cold morning (5 °C), pocket carry, dropped onto soft ground 2× | Same telemetry + survival report |
| #4 | Educational user (photography instructor) | Classroom: 10 students each take 5 shots; demonstrate film-to-digital workflow | UX feedback re: clarity of PWA UI, how many students could pair phone unaided |
| #5 | Travel scenario (if available) | Airport / different countries / WiFi-saturated environments | RF-environment survival; 2.4/5 GHz interference; battery on flight |

**Optional units 6–10:** held in reserve. If a defect emerges in units 1–5, fix-and-rebuild path uses the spares for a regression cohort.

### 5.2 Data collected (every unit, every week)

- Capture count, capture success rate
- MTF dark-frame samples (cap-on shots reveal dust + cover-glass contamination over time)
- Capture latency p95 from telemetry (REQ-022)
- Preview latency p95 (REQ-020) — when user reports it; can't always measure passively
- Battery cycle count, runtime per charge, charge time
- Error log (kernel panics, libcamera crashes, hostapd hangs, etc.)
- iOS device + version, # of pair attempts, PWA install success
- Free-text user feedback: top 3 frustrations, top 3 delights
- Image samples (5/week from each user, JPEG only, with consent)

### 5.3 EVT → DVT exit criteria

To pass EVT and authorize DVT:

| Criterion | Threshold | REQ tie |
|---|---|---|
| Capture success rate over 4-week field test | ≥ 95 % (frames successfully captured + stored) | REQ-001, REQ-006 |
| Capture latency p95 | ≤ 1.5 s | REQ-022 |
| Preview latency p95 (verified at least 1×/unit on bench during field period) | ≤ 120 ms | REQ-020 |
| Battery life under realistic mixed use | ≥ 3 hr (relaxed from REQ-025's 4 hr; we'll fix in DVT) | REQ-025 |
| Defect rate (returns + serious complaints) | ≤ 1 per 5 units | informal |
| No safety incidents | 0 thermal events, 0 light leaks resulting in damaged shots, 0 X-sync over-voltage failures | REQ-044 |
| Reversibility verified | ≥ 1 unit successfully reverted to film-shooting condition | REQ-035 |

**Decision:** if criteria met, freeze DVT BOM and authorize a 25-unit DVT build. If 1–2 criteria miss, narrow root-cause and re-spin affected subsystem before DVT. If > 2 miss, return to P2/P3 (per systems §7 phase plan).

### 5.4 DVT → PVT exit criteria

DVT is 25 units, 8-week field test, broader user population including 5 of the qty-100 production CM (qty 100 first-batch using DVT firmware). Adds:

| Criterion | Threshold |
|---|---|
| First-pass MTF yield | ≥ 85 % (units passing T-07 without rework) |
| First-pass overall EOL yield | ≥ 80 % |
| Mean time between user-reported defects | ≥ 200 captures |
| Battery life | ≥ 4 hr (REQ-025 hard) |
| Documentation: install guide validated by 3 unaffiliated hobbyists at REQ-065 standard | Pass |
| Compliance pre-scan (FCC Part 15 unintentional radiator pre-scan at ~$2k lab) | Pass margin ≥ 6 dB |

### 5.5 PVT → MP exit criteria

PVT is qty 100, full production CM, full process under-jig. Adds:

| Criterion | Threshold |
|---|---|
| EOL yield | ≥ 90 % |
| Calibration yield | ≥ 88 % first-pass |
| Per-unit cost actual | ≤ 110 % of BOM model ($311 × 1.10 = $342) |
| Field defect rate (first 50 shipped, 30-day window) | ≤ 8 % |
| Returns RMA process exercised end-to-end | ≥ 3 units returned + processed |
| Full FCC Part 15 SDoC documentation complete | Pass |
| RoHS declaration package complete | Pass |
| EU/UK/CE declaration package complete (if international sale included) | Pass |
| User-installable kit instructions validated against ≥ 5 first-time builders | Pass |

**MP gate:** all of above + 60-day field defect rate ≤ 5 %. Volume ramp authorized.

---

## 6. Compliance Readiness — Gap Analysis (Kit Business Model)

### 6.1 The compliance question, plainly

The K1000-D as a complete assembled unit emits intentional RF (WiFi AP, 5 GHz) and contains a Li-ion battery — both are regulated everywhere. As a **kit** where the user does final assembly into their own K1000 chassis, the regulatory question is **what was placed in commerce**: a complete radio-emitting device, or a set of components plus a precertified RF module?

| Regulator / regime | Applies to complete unit | Applies to kit | Estimated cost / unit (qty 100) | Estimated cost / unit (qty 1000) |
|---|---|---|---|---|
| **FCC Part 15 Subpart C (intentional radiator, the WiFi)** | YES — full SDoC + FCC ID required | **NO if the WiFi module is pre-certified.** Pi 5's WiFi modules carry an FCC ID (BCM43455 module's FCC ID 2ABCB-BCM43455 or successor). As long as the user does not modify the antenna and the integrator (us) limits the surrounding metalwork below the integration thresholds in KDB 996369 D03, the certification carries through. | **$0** if we keep Pi 5 stock + use internal antenna OR a pre-certified U.FL → external dipole module. **$8k–$15k** if we exceed integration thresholds and need a full Part 15C device-level test. | **$0** (kit) or amortized $1.50/unit (complete unit, after 1000) |
| **FCC Part 15 Subpart B (unintentional radiator — everything else in the digital insert that isn't the radio)** | YES — SDoC at minimum | **YES even for the kit** if we put a board in commerce that has clocks ≥ 9 kHz. Our carrier PCB is a digital device; SDoC required. | **$2,000–$4,000** pre-scan + paperwork. Single test for both qty tiers. | Same |
| **CE / UKCA (EU + UK market)** | RED (Radio Equipment Directive), EMC, LVD, RoHS, WEEE | **YES even for kit** if sold into EU. Same arguments as FCC apply to RED inheritance from Pi 5 modules — Pi 5 carries CE marking from RPi Trading. | **$3,000–$8,000** for first article testing. | Same (one-time) |
| **RoHS** | YES, all electronics | **YES** (kit components must each be RoHS-compliant) | $0 incremental — all chosen parts are RoHS-grade. Declaration paperwork only. | $0 |
| **CA Prop 65** | YES (any consumer good sold into CA) | **YES** (kit) | $0 incremental cost — comply by labeling unless we exempt via Prop 65 safe-harbor analysis. Label cost ~$0.05/unit. | Same |
| **Lithium battery shipping (UN3481 / IATA PI 967)** | YES (assembled with battery) — battery + watt-hour ≥ thresholds determine tier | **Splits:** if the kit ships WITH the battery installed in the carrier (or PiSugar HAT), full UN3481 applies. If the battery ships SEPARATELY (user installs), it falls to UN3480 standalone-cell which has different (and slightly more relaxed) rules. | UN 38.3 cell certification: **$1,500–$3,000 one-time per cell SKU**. Shipping (with battery) adds ~$8/shipment for HAZMAT documentation; bulk DG-trained CM handles this in <$1/unit at qty 1000. | One-time test, scales freely |
| **UL/ETL 62368-1 (audio/video/IT equipment safety)** | Optionally required by retailers (Amazon, Best Buy) but not legally required for a self-shipped consumer good in US. Required for commercial/industrial sale. | **NO** — kit is not a complete electrical device. | **$0** if direct-to-consumer (Kickstarter, own website). **$8k–$15k** if we want UL listing for retail distribution. | One-time |
| **WEEE registration (EU electronics take-back)** | YES — required to sell into each EU country | **YES (kit)** — even kits with PCBs. | $200–$800 per country + ~$0.50/unit recycling fee. | Same |

### 6.2 Net cost burden, by business model

**Kit-only, US-only sale, direct-to-consumer:**

| Item | One-time | Per-unit |
|---|---|---|
| FCC Part 15 Subpart B SDoC (carrier PCB + insert) | $3,000 | — |
| RoHS compliance documentation | $500 (paperwork) | — |
| CA Prop 65 labeling | $200 (label design) | $0.05 |
| UN 38.3 battery cell certification (if we ship cells with kit) | $2,500 | — |
| Lithium-battery shipping prep | — | $0.40 |
| **Subtotal** | **$6,200** | **$0.45** |

**Kit-only, US + EU sale:**

| Item | One-time | Per-unit |
|---|---|---|
| Above subtotal | $6,200 | $0.45 |
| CE / UKCA assessment (RED + EMC + LVD) | $7,000 | — |
| WEEE per-country registration (assume 5 markets) | $2,500 | $0.50 |
| EU REACH SVHC declaration | $400 | — |
| **Subtotal** | **$16,100** | **$0.95** |

**Complete unit, US + EU sale:**

| Item | One-time | Per-unit |
|---|---|---|
| Above subtotal | $16,100 | $0.95 |
| Full FCC Part 15 Subpart C device-level (intentional radiator) — only if we exceed Pi 5 integration limits | $12,000 | — |
| UL/ETL 62368-1 listing for retail | $11,000 | — |
| Donor body serial-number registry + provenance documentation | $1,500 | $0.20 |
| **Subtotal** | **$40,600** | **$1.15** |

**Strong recommendation:** the kit-only US+EU model at $16,100 fixed compliance cost is a tractable burden. Spread across 1000 units that is **$16.10/unit**. The complete-unit model adds $24,500 fixed + a recurring per-unit increment — meaningful but not fatal.

The BOM brief §2 puts qty 1000 at $201/unit. Compliance loading at $16/unit (US+EU kit) raises that to $217. Still inside the ≤$200 target only if Lever 4 (Arducam direct OEM, BOM §4) is invoked, which the supply-chain brief says is not yet recommended. **Practical guidance to product owner:** plan for $220–$230/unit at qty 1000 fully-loaded kit price, accepting that the $200 BOM target slips slightly when compliance is rolled in.

### 6.3 The FCC Part 15 Subpart C exposure path

This is the single most ambiguous question for a kit. Per FCC KDB 996369 D03 (modular transmitter integration), an integrator (us) can use a pre-certified module's FCC ID **only if**:

1. The module is used unmodified (we don't change the antenna trace, we don't replace the antenna, we don't strap the module to large metal grounds at less than the certified distance).
2. No more than three modular devices are integrated (we have one: the WiFi/BT module inside Pi 5).
3. The integrator labels the host with the module's FCC ID via "Contains FCC ID: XXX" on the host product.
4. No host-level features create RF emissions outside the module's certification envelope.

**The risk:** the K1000-D mounts the Pi 5 inside a metal SLR body. The Pi 5's certified WiFi performance assumes free-space radiation from the chip antenna. A grounded metal shell within centimeters of the antenna **may** detune or shadow the antenna enough that integration is considered to have modified the certification envelope.

**Mitigation paths:**
- **A. External antenna (kit-supplied).** Replace Pi 5's chip antenna with a U.FL pigtail to an external dipole (the firmware brief §11 also recommends this for RF reach). Antenna lives in the rear hump's plastic top section, away from metal. This is closer to the module's certified envelope.
- **B. Test in worst-case install configuration as part of FCC SDoC test.** $5–8k more in test lab time. Validates the module's certification holds in our host.
- **C. Drop frequency band of operation to 2.4 GHz only.** 2.4 GHz tolerates more attenuation; integration headroom is larger. Cost: latency suffers (electrical brief and firmware brief both prefer 5 GHz).

**Recommendation:** Path A (external dipole) + Path B (validate in host). $5k one-time, no per-unit penalty, lowest regulatory risk.

### 6.4 Who actually cares, at what volume

| Volume | Real-world regulatory pressure |
|---|---|
| Qty 10 (proto, beta) | Effectively none. Don't sell into retail; ship to known beta users. |
| Qty 100 (first PVT) | FCC SDoC paperwork should be done. Realistically, ~80 % of Kickstarter hardware projects ship without it and FCC enforcement is reactive. Still: do it. Cost is small. |
| Qty 1000 (commercial) | FCC SDoC + RoHS + UN 38.3 are not optional. CA Prop 65 must be addressed. EU CE if selling EU. |
| Qty 10,000 | All of above + retailer audits + active periodic re-test obligations. Significantly different commercial reality. |

For K1000-D's modeled qty-100/1000 trajectory, plan for full FCC Part 15 B SDoC + UN 38.3 + RoHS + (if EU) CE at qty 1000. Anticipated NRE: **$16k–$22k** including pre-scan failures and a re-spin. Recommend retaining a small product-compliance consultant ($5k–$8k engagement) to manage the documentation, rather than the engineering team doing it ad-hoc.

---

## 7. Production Process Flow — qty 100 Reference

Step-by-step assumed production path at qty 100 using JLCPCB / PCBWay box-build, kit configuration (user supplies donor):

### 7.1 Process flow

```
[1] Incoming inspection
        ↓
[2] Carrier-PCB SMT + post-flux + electrical test
        ↓
[3] Sub-PCB to bracket subassembly + harness terminate
        ↓
[4] Mech parts incoming: alignment plate + adapter ring + rear hump
        ↓
[5] Sensor module incoming inspection (Arducam IMX283 Pivariety)
        ↓
[6] Pre-stage: sensor mounted to alignment plate WITHOUT shims, plate to adapter ring
        ↓
[7] FLANGE CALIBRATION STATION  ←  *** BOTTLENECK *** (per §1.2, ~17 min/unit)
        ↓
[8] Lock-down: thread-locker, final torque
        ↓
[9] Insert Pi 5 / CM5 + battery + carrier PCB into rear hump
        ↓
[10] Cable-route: MIPI FFC, X-sync 2-wire, USB-C, power
        ↓
[11] Close rear hump shell + light-seal application
        ↓
[12] FIRMWARE FLASH + COLD BOOT TEST
        ↓
[13] EOL FUNCTIONAL TEST (per §4, ~3.5 min/unit)
        ↓
[14] Cosmetic inspection
        ↓
[15] Serialize, label, kit-box assembly (insert + adapter + plates + shim pack + cables + lens cap)
        ↓
[16] Final packaging: outer box, foam, QSG, regulatory paperwork
        ↓
[17] Lot QC sample (every 10th unit: re-run T-07 MTF + T-09 over-voltage)
        ↓
[18] Ship-to-stock or drop-ship
```

### 7.2 Bottleneck

**Step 7 (flange calibration)** is the bottleneck. At 17 min/unit single-station, throughput is ~28 units / 8 hr shift. Steps 1, 2, 3, 4, 5 are external supplier ops (parallel, non-blocking). Steps 8–16 take ~12 min/unit cumulative. EOL test (step 13) is 3.5 min, far inside the bottleneck.

To clear qty 100 in a 1-week build:
- **Single station: ~5 working days.** Tight if any rework iteration hits.
- **Two parallel stations: ~3 working days.** Recommended.

Capex for the second station = $4,000 (per §3.1). For a qty-100 build it's debatable whether two stations are justified; for the planned qty-1000 follow-on it's a clear yes.

### 7.3 Highest-defect-risk step

**Step 7 + Step 8 (calibration + lock-down) together.** Specifically:

- The thread-locker step (8) is where techs can over-torque and warp the PCB after calibration was passing. This invalidates the MTF acceptance from step 7. We've seen this on similar precision-optics assemblies: 3–5 % of units that passed initial cal fail re-test after lock-down. Mitigation:
  - **Re-verify MTF after lock-down on every unit** (adds 60 s to step 7 sequence).
  - Use Loctite 425 (lower torque required) instead of Loctite 222.
  - Calibrated torque drivers, not "tighten to feel".

- The light-seal application at step 11 is the second-most-frequent defect source on this class of assembly. Misaligned foam → light leaks → ghost streaks on captured images. Mitigation:
  - Die-cut foam channel inserts (vs. cut-to-fit by tech) eliminate variability.
  - Lot QC at step 17 explicitly tests for light leaks with a 1000 lux side-illumination shot.

Together: **estimate 7–12 % rework rate at step 7+8+11 in early qty-100 builds**, dropping to **4–6 %** by end-of-lot as tech proficiency builds.

---

## 8. Top 5 Manufacturability / Test Risks

Ranked by impact on yield or cost. Severity 1–5, likelihood 1–5, score = S×L.

| # | Risk | S | L | Score | Tie-to | Mitigation |
|---|---|---|---|---|---|---|
| **M1** | **Flange-focal calibration yield drops below 85 %** due to alignment-plate flatness variance, sensor PCB warp under torque, or thermal drift after assembly. Per mech §12, the stack RSS is ±0.18 mm and shimming must close ±0.05 mm — a 3.6× compression. | 5 | 4 | 20 | REQ-030, REQ-031, mech §3.4, mech §12 | (a) Incoming QC every alignment plate against granite reference. (b) Torque-controlled lock-down + re-verify MTF after lock-down. (c) Source plates from ONE machine shop (no mixed lots). (d) Track per-lot MTF distribution — if mean shifts > 0.02 cy/px, investigate. (e) Budget 17-min calibration with 1.4× iteration allowance. |
| **M2** | **Pi 5 + WiFi RF integration in metal SLR body fails FCC Part 15 retest in host configuration.** Pi 5's modular FCC ID applies only if integration doesn't exceed thresholds; the K1000 chassis is metal. | 4 | 4 | 16 | REQ-004, REQ-051, compliance §6.3 | (a) External U.FL antenna in rear hump plastic (firmware §11 already recommends). (b) FCC pre-scan in host at $2k before formal SDoC. (c) Have 2.4 GHz fallback config validated as a Plan B. |
| **M3** | **Donor K1000 hinge/latch geometry varies enough across production years that the rear hump latches inconsistently.** Per mech §9 R4. | 4 | 4 | 16 | REQ-034, mech §9 R4 | (a) Survey 5+ donor bodies across vintage range (covered in EVT). (b) Ship two latch adapter variants in kit (early vs. late K1000) with selection chart. (c) Document supported K1000 vintage range explicitly — exclude pre-1978 "Asahi Pentax K1000" if geometry is too divergent (lose ~15 % of donor population, gain consistency). |
| **M4** | **PiSugar 3 Plus boost converter under-volts Pi 5 during simultaneous SSD-write + WebRTC + WiFi-TX bursts**, causing intermittent capture failure or filesystem corruption. Per electrical §8 Risk 2 and firmware §7.2. | 4 | 3 | 12 | REQ-006, REQ-021, electrical §8 | (a) Polymer bulk cap (220 µF on 5 V rail) per electrical §3.4. (b) Firmware serialization of SSD write vs. WebRTC encode (firmware §2.2 already plans). (c) At qty 1000 transition to custom 18650+BQ25895 power board (BOM §4 Lever 2 / electrical §10 OQ 5). (d) EOL test T-08 measures peak rail under fixture-simulated worst-case. |
| **M5** | **iOS PWA WebRTC regression on a future iOS release breaks viewfinder for fielded units.** Per firmware §9.1. | 4 | 3 | 12 | REQ-020, REQ-051, firmware §9.1 | (a) HLS/LL-HLS fallback path (firmware already plans MediaMTX). (b) Quarterly compatibility test on each iOS major release. (c) PWA detects WebRTC failure within 3 s, auto-falls-back, shows banner. (d) Have a v2 firmware OTA pipeline (RAUC) ready to push fixes. (e) Document min iOS 16.4 explicitly. |

**Honorable mentions (high-score watch list but not top 5):**

- Light leaks at rear-hump-to-body seal — 7–12 % first-build rework rate per §7.3.
- MIPI FFC fatigue at the rear-hump split line — per mech §9 R5.
- Arducam IMX283 EOL announcement — per BOM §5 risk 3.
- Donor body sourcing at qty 1000 — per BOM §3. We sidestep this by selling kits.
- Thermal throttling of Pi 5 in sealed K1000 + rear hump — per firmware §9.2. EVT thermal-chamber test (REQ-063) is the gate.

---

## 9. EVT / DVT / PVT / MP Exit Criteria

Short, gated, specific.

### 9.1 EVT exit (P3 in systems §7)

**Build:** 5 units, in-house assembly, engineering-team supervised.
**What ships:** prototype units to controlled beta users (§5.1).
**Mandatory:**
- All "Must" REQs verified per systems §5.2 V&V matrix.
- Calibration procedure (§3.1) executed on all 5 units; all pass MTF50 ≥ 0.32 cy/px center, ≥ 0.25 corners.
- Capture latency p95 ≤ 1.5 s on all 5 units.
- Preview latency p95 ≤ 120 ms on all 5 units (verified at least once each on bench).
- Per-unit BOM cost actual ≤ 115 % of model ($498 × 1.15 = $573).
- Reversibility (REQ-035) verified on ≥ 1 unit.
- One full revision of installation/user documentation.
- FCC Part 15 pre-scan booked (does not need to pass at EVT — needs to be booked).

**Gating signoff:** systems-engineer.

### 9.2 DVT exit (P5 in systems §7)

**Build:** 25 units, first contract-assembled batch.
**What ships:** units to expanded beta + early adopters (controlled). All units field-test ≥ 4 weeks.
**Mandatory:**
- EOL test fixture (§4) operational, all 25 units passed.
- First-pass MTF yield ≥ 85 %, EOL yield ≥ 80 %.
- BOM cost actual ≤ 115 % of qty-100 model ($311 × 1.15 = $358).
- All EVT exit criteria still holding under repeat measurement.
- Battery life REQ-025 (≥ 4 hr) verified on ≥ 5 units.
- Thermal REQ-063 verified on ≥ 3 units (40 °C chamber).
- iOS PWA install/use validated on ≥ 5 distinct iPhone models, iOS 17 and 18.
- FCC Part 15 pre-scan passed with ≥ 6 dB margin.
- Compliance documentation drafted (FCC SDoC, RoHS, UN 38.3).
- Calibration procedure validated by 3 unaffiliated builders for the kit case (REQ-065).

**Gating signoff:** systems-engineer + product owner.

### 9.3 PVT exit (P6 in systems §7)

**Build:** qty 100, production CM, full process under jig.
**What ships:** retail units to first paying customers (Kickstarter backers, direct site).
**Mandatory:**
- EOL yield ≥ 90 % across the full 100.
- First-pass calibration yield ≥ 88 %.
- BOM cost actual ≤ 110 % of model.
- Field defect rate ≤ 8 % at 30 days post-ship across first 50 customers.
- FCC Part 15 SDoC complete and on file.
- RoHS declaration complete.
- CA Prop 65 labeling in place (US sale).
- CE/UKCA complete if EU launch.
- UN 38.3 cell certification on file.
- Installation documentation polished, validated by 5+ first-time builders.
- OTA update channel operational (RAUC bundle pipeline, firmware §8).
- Customer-support process operational (RMA, first 3 returns processed).

**Gating signoff:** systems-engineer + product owner + supply-chain-manager.

### 9.4 MP entry (volume production)

**What ships:** unconstrained customer orders.
**Mandatory:**
- All PVT criteria still met.
- 60-day field defect rate ≤ 5 % across PVT cohort.
- Per-unit cost actual within 5 % of qty-1000 model.
- ≥ 2 lots of 100 units built consecutively without process change.
- CM has signed off on the production process documentation.
- Tooling (carrier PCB stencils, mech tooling, calibration jig fleet) fully amortized into per-unit cost OR funded for next 1000-unit campaign.

**Gating signoff:** full team (systems, mech, pcb, fw, supply-chain, dfm).

---

## 10. Open Questions for Other Specialists

### 10.1 For systems-engineer

1. **Define "captured frame committed to storage" for REQ-006 acceptance.** Is it in-RAM queue (firmware §2.2's < 50 ms path), fsync'd JPEG (~15 ms after capture), or fsync'd DNG (~150 ms)? This dictates whether the EOL test fixture (T-04, T-10) passes/fails the same units differently — and whether the storage line of the BOM can use eMMC (BOM Lever 1, saves $104/unit at qty 1000) or must keep the USB-SSD.
2. **Acceptance criterion for REQ-030** — do we accept the kit-tier ±0.15 mm at the user's home, or do we hold every kit to the CM-tier ±0.05 mm via PWA-assisted calibration? The latter is more honest to the requirement; the former is more honest to the kit business model.
3. **Donor body vintage support range** (per M3) — do we exclude pre-1978 Asahi Pentax K1000 to simplify the hinge adapter? (Loses ~15 % of donor population, gains process consistency.)

### 10.2 For mcad-engineer

1. Can the alignment plate's mounting boss thread depth (REQ-030/031 critical surface) be molded into the adapter ring in production, or must it stay machined? Affects qty-1000 cost more than qty-100.
2. Can the rear hump's light-seal channel be sized for die-cut foam rather than continuous roll? Per §7.3 this is the second-highest-defect step; die-cut would eliminate it.
3. Drop-test result on PETG hump at 1 m onto carpet — when is this scheduled? Affects PVT exit criteria.

### 10.3 For pcb-designer

1. Confirm H11AA1**S** (SOIC-6) replaces DIP-6 in the production BOM — pure SMT, avoids mixed reflow + wave.
2. Add TP5 (X-sync conditioned line post-opto) to the carrier PCB layout.
3. Confirm TC2030 footprint is on the board (not just bare pads).
4. Vishay PAR-series-specific TVS callout (M2 mitigation depends on it).
5. Trace clearance: PC-sync net (250 V worst-case) to nearest 3.3 V net — confirm ≥ 1 mm per IPC-A-2221.
6. Lever 1 (eMMC daughter-board): does the Pi 5 / CM5 carrier PCB carry the eMMC, or does it sit on a sub-board? Affects calibration-jig design.

### 10.4 For firmware-engineer

1. **REQ-006 commit semantics** — same question as to systems-engineer (item 10.1.1), framed for firmware: what does "frame written" mean in the WS push event?
2. EOL fixture needs a `/test/` REST endpoint set (T-01..T-12 from §4) accessible only via Ethernet boot mode. Cost is a few hundred lines; please scope.
3. PWA Calibration mode (§3.2) — 9-zone MTF estimator on iOS Safari at < 5 s/iteration. Confirm computationally feasible on iPhone 12-class hardware (the oldest we'd support).
4. RAUC OTA channel for compliance updates — confirm production path from EVT through MP. Required for PVT exit.
5. Production telemetry (§5.2) — logging schema, opt-in vs always-on, privacy posture.

### 10.5 For supply-chain-manager

1. Query Arducam on Sony IMX283 EOL/LTB status at design lock (M5 risk in §8 + BOM §5 risk 3).
2. Source a second mech-parts machine shop (qualified backup) for alignment plates — currently single-sourcing the most critical mechanical part.
3. Confirm calibration jig consumables (brass shim packs, Loctite 425) flow as line items in the BOM at qty 1000, not "miscellaneous."
4. Compliance budget — fold the $16k–$22k one-time + ~$1/unit recurring into the cost model for the full kit-US+EU SKU (per §6.2).
5. RoHS declarations from Arducam + Raspberry Pi Trading + PiSugar Kitchen on file before PVT exit.

---

## 11. Summary of DFM/Test Position

The design as briefed by mechanical, electrical, and firmware is **manufacturable at qty 100 with 82–88 % first-pass yield and 88–92 % calibration yield**, hitting the BOM's modeled $311/unit at the supply-chain-recommended kit business model. The dominant risks are:

1. Flange-focal calibration cycle time + yield (calibration-jig design and per-unit labor budget already addressed by supply-chain at $6.50/$3.20 — my analysis validates).
2. FCC Part 15 integration in metal SLR body (external antenna mitigates).
3. Donor body hinge variance (kit's two-adapter approach mitigates).

At qty 1000 the same design holds, but cost-reduction levers from BOM §4 (eMMC, custom power board, CM5) become **mandatory** to fit the $200 target. None of those are DFM blockers, but they each add ~3 weeks of NRE and a re-spin gate. Plan accordingly.

The single pre-EVT decision still owed by systems-engineer is **the commit-semantics interpretation of REQ-006**. Everything downstream of it — storage architecture, EOL test definition, calibration jig acceptance threshold, BOM cost model — pivots on that answer.

---

## 12. References

- ConOps: `teams/hardware-dev/outputs/k1000_digital_conops.md`
- Systems Engineering: `teams/hardware-dev/outputs/k1000_digital_systems_engineering.md`
- Mechanical Design: `teams/hardware-dev/outputs/k1000_digital_mechanical_design.md`
- Electrical Design: `teams/hardware-dev/outputs/k1000_digital_electrical_design.md`
- Firmware & Software: `teams/hardware-dev/outputs/k1000_digital_firmware_software.md`
- BOM & Costing: `teams/hardware-dev/outputs/k1000_digital_bom_costing.md`
- IPC-A-610 workmanship standards (class 2 default, class 3 for the carrier PCB calibration loopback if we field-upgrade)
- IPC-A-2221 generic standard on PCB design (creepage / clearance for the 250 V PC-sync front-end)
- FCC KDB 996369 D03 v04 — modular transmitter integration guidance
- FCC Part 15 Subpart B (47 CFR § 15.101) — unintentional radiator SDoC
- FCC Part 15 Subpart C (47 CFR § 15.247) — intentional radiator (WiFi)
- IEC 62368-1 — audio/video/IT equipment safety (UL 62368-1 / EN 62368-1 harmonized)
- UN 38.3 / IATA Packing Instruction 967 — lithium battery transport
- ISO 12233 / sfrmat3 — slanted-edge MTF measurement methodology
- CA Prop 65 (Proposition 65, Safe Drinking Water and Toxic Enforcement Act of 1986)

---

*End of DFM & Test readiness briefing. All recommendations trace to REQs in `k1000_digital_systems_engineering.md` §1 and design decisions in the four upstream specialist briefings. Hand back to hardware-dev orchestrator for integration.*
