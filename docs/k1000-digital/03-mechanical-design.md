# K1000-D Mechanical Design Briefing

**Project:** K1000-D — Pentax K1000 → digital conversion
**Author:** mcad-engineer (Hardware Dev Team)
**Date:** 2026-05-17
**Status:** Concept / feasibility — Phase 1 deliverable
**Inputs:** `k1000_digital_conops.md`

---

## 0. TL;DR

The K1000 film bay is approximately **35 mm × 70 mm × 28 mm deep** behind the
film plane — usable but tight. The Arducam Pivariety IMX283 sensor PCB (≈38 mm
square per Arducam Pivistation reference) is **width-compatible** with the bay
but the Pi 5 (85 × 56 mm) **will not fit inside the body**. A rear hump enclosure
behind a modified back door is the only viable path. The tightest tolerance in
the whole system is the flange-to-sensor distance: **45.46 mm ± 0.05 mm**, with a
realistic stack-up of ~±0.12 mm if we naively bolt the sensor board to a printed
fixture. Hard requirement: ground-flat machined alignment plate + shim pack.

---

## 1. K1000 Cavity Dimensional Analysis

### 1.1 External envelope (well-documented)

| Dimension | Value | Source |
|---|---|---|
| Body width | 143 mm | Wikipedia / Pentax-Forums |
| Body height | 91.4 mm | Wikipedia |
| Body depth (front-of-mount to back-door rear) | 48 mm | Wikipedia |
| Weight (body, no lens) | 620 g | Wikipedia (525 g cited elsewhere is without prism/strap) |

### 1.2 K-mount geometry (well-documented)

| Dimension | Value | Source |
|---|---|---|
| Flange focal distance (mount face → film plane) | **45.46 mm** | K-mount spec |
| Throat diameter (smallest aperture) | 44.0 mm | K-mount spec |
| Inner mount diameter (bayonet ID) | 48.0 mm | K-mount spec |
| Mount fastening | 3 bayonet tabs, ~60° lock rotation | K-mount spec |

### 1.3 Film plane / gate (35 mm standard)

| Dimension | Value | Source |
|---|---|---|
| Exposed frame | 24.00 × 36.00 mm | ISO 1007 / 135 film |
| Gate aperture (cut in casting, slightly larger than frame) | ~24.5 × 36.5 mm | typical SLR practice — **needs measurement on physical sample** |
| Inter-rail width (where film slides) | ~36.5 mm | typical 35 mm SLR |
| Film rail-to-film-plane offset (rails sit slightly proud of casting) | ~0.1 mm | typical SLR practice — **needs measurement** |

### 1.4 Internal film cavity (the volume we get to use)

These numbers are **not in any datasheet** — they require measurement on a
physical K1000 with calipers. Best estimates from disassembly photos, the K1000
service manual (linked but paywalled / scan-only), and comparison to known K2/KX
internals (which share the chassis):

| Region | Estimate | Confidence | Notes |
|---|---|---|---|
| Width inside body shell, side-to-side, at film-spool plane | ~125 mm | medium | 143 mm OD − 2 × ~9 mm sidewall castings |
| Vertical height of film bay (sprocket roller to take-up base) | ~38 mm | medium | film is 35 mm wide + ~1.5 mm rail margin each side |
| Depth from **film plane to inside face of back door** (door closed) | **~6 mm** | medium-high | this is where the pressure plate lives; back door is thin pressed steel ~0.8 mm |
| Depth from **film plane to inside face of back of body casting** (where back door seals against) | ~6 mm | medium | same plane as above — back door is a flat cover |
| Cartridge well (left side, looking from back) ID | ~26 mm dia × 38 mm tall | medium | sized for 135 cassette |
| Take-up spool well (right side) ID | ~22 mm dia × 38 mm tall | medium | wraps stripped film, smaller than cartridge well |
| Center span between cartridge & take-up wells (across film gate) | ~75 mm wide × 24 mm tall | medium | this is the actual "behind the film gate" volume |

**Critical observation:** The K1000 (and every 35 mm SLR) has only ~5–7 mm of
depth between the film plane and the back door. The pressure plate occupies most
of that. **There is no meaningful Z-axis volume directly behind the gate inside
the closed body.** The volume that exists is in the left/right wells (cartridge
and take-up), and those wells are cylindrical and too narrow for a Pi 5.

> **Action item for prototype phase:** First task on receiving a donor body is a
> full dimensional teardown — calipers on every interior surface, photographed
> against a scale, written up as a measurement sheet.

### 1.5 Sources cited
- [Pentax K1000 — Wikipedia](https://en.wikipedia.org/wiki/Pentax_K1000)
- [Pentax K1000 — Camera-wiki.org](https://camera-wiki.org/wiki/Pentax_K1000)
- [Pentax K-mount — Wikipedia](https://en.wikipedia.org/wiki/Pentax_K-mount)
- [Pentax K1000 service manual (archive.org)](https://archive.org/details/central-manuals-camera_pentax_K1000_rsm_ENG.pdf)
- [Pentax K1000 service manual mirror (Mark Roberts)](https://www.pentax-manuals.com/markroberts/k1000_man.pdf)
- [Pentax K1000 review (Ken Rockwell)](https://www.kenrockwell.com/pentax/k1000.htm)

---

## 2. Volumetric Budget

### 2.1 Component dimensional pack-list

| Component | Outline (mm) | Total height (mm) | Notes |
|---|---|---|---|
| Arducam Pivariety IMX283 PCB | ~38 × 38 (assumed square; **needs verification on physical sample**) | Board 1.6 + sensor stack 4.5 ≈ **6.1 mm** above front face | Sensor active area 13.2 × 8.8 mm centered on board |
| IMX283 sensor active area | 13.2 × 8.8 (1" Type, 2.4 µm pitch, 5496 × 3672 px) | n/a | Optical center on board geometric center |
| Sensor cover glass | n/a | ~0.4 mm (typical Sony 1" ceramic package) | Sits 1.5–2.0 mm above PCB top surface |
| Raspberry Pi 5 (4 GB) | 85 × 56 | Board 1.6 + tallest connector ~16 (HDMI/USB block) | Active cooler adds another ~10 mm = ~27 mm total |
| PiSugar 3 Plus (5000 mAh) | ~85 × 56 (matches Pi footprint by design) | ~12 mm including cells + PCB | Stacks under or over Pi 5 |
| USB-SSD (NVMe HAT or USB-stick form) | NVMe HAT ~70 × 56 × 5; USB stick ~50 × 18 × 8 | varies | USB stick is more cavity-friendly |
| 22-pin FFC sensor cable | width 11.5 mm, length 100–200 mm, flexible | < 0.3 mm thick | Routes from sensor board to Pi MIPI-CSI |
| X-sync interface PCB (small) | ~25 × 15 × 5 | 5 | Optoisolator + filter |
| Internal wiring + connectors | varies | ~5–8 mm clearance budget | |

### 2.2 The fundamental problem (stated bluntly)

The **Pi 5 (85 × 56 mm) is larger than any single contiguous interior region of
the K1000 body**. The longest unobstructed interior dimension is ~75 mm
(behind the gate, left-to-right). The Pi 5 is 85 mm long. It does not fit. Even
rotated to vertical, the Pi 5 (56 mm wide) exceeds the ~38 mm vertical bay
height behind the gate.

This is the same wall that **I'm Back** hit. Their solution was an APS-C sensor
with everything (sensor + ARM SoC + battery + screen) crammed into a
film-cartridge-shaped puck — purpose-built silicon, not a Pi. We are not
building purpose silicon. **Therefore a rear hump is required.**

### 2.3 Volumetric strategy — two-zone layout

```
              FRONT (lens) ───────────────────────────►  REAR (user)

   ┌─────────────────────────────────────────────┐
   │       K1000 BODY (original, modified)       │
   │ ┌──────────────────────────────────────┐   │
   │ │  K-mount + mirror box + shutter      │   │
   │ │  (UNTOUCHED)                         │   │
   │ │                                      │   │
   │ │            FILM PLANE ───────────►   │   │      45.46 mm from
   │ │                                  ▲   │   │      mount flange
   │ │  ┌─────────┐ ┌─────────┐ ┌────┐ │   │   │
   │ │  │CARTRIDGE│ │ ZONE A  │ │TAKE│ │   │   │  Zone A = sensor PCB
   │ │  │  WELL   │ │ sensor  │ │ UP │ │   │   │           + alignment
   │ │  │         │ │  PCB +  │ │WELL│ │   │   │           plate
   │ │  │ (FFC    │ │alignment│ │    │ │   │   │  Wells = used for
   │ │  │  cable  │ │  plate  │ │    │ │   │   │          cable routing
   │ │  │  routing│ │         │ │    │ │   │   │          and tiny PCBs
   │ │  │  here)  │ │         │ │    │ │   │   │
   │ │  └─────────┘ └─────────┘ └────┘ │   │   │
   │ │            ~6 mm depth          │   │   │
   │ └──────────────────────────────────┘   │   │
   │                                         │   │
   │     ──── ORIGINAL BACK DOOR REMOVED ──── │
   │                                         │
   │   ┌─────────────────────────────────┐  │
   │   │       ZONE B — REAR HUMP        │  │  Zone B (NEW) houses:
   │   │   (NEW 3D-printed enclosure,    │  │   - Pi 5 (vertical or flat)
   │   │    bonded/screwed to body)      │  │   - PiSugar 3 Plus
   │   │   ~90 × 80 × 22 mm              │  │   - USB-SSD
   │   │                                 │  │   - WiFi antenna
   │   │   [Pi 5 stacked w/ PiSugar +   │  │   - USB-C charge port
   │   │    SSD on top, cooler facing   │  │   - Power button
   │   │    rearward for venting]        │  │   - Status LED
   │   └─────────────────────────────────┘  │
   │                                         │
   └─────────────────────────────────────────┘
```

### 2.4 Zone A (in-body insert) volume budget

Item | XY footprint | Z depth used | Z budget remaining
---|---|---|---
Sensor PCB (38 × 38) | within 75 × 38 mm gate-back area | 1.6 mm PCB | OK
Sensor + cover glass stack | 13.2 × 8.8 active, ~16 × 12 package | +4.5 mm forward of PCB | toward lens
Alignment plate (aluminum, 2 mm) | 75 × 38 mm | 2.0 mm rear of PCB | OK
FFC cable folded | runs left into cartridge well | <1 mm thick | OK
**Total in-body Z (sensor front-face to rear of plate)** | | **~7.5 mm** | exceeds the ~6 mm "behind film plane to back door" budget by ~1.5 mm

**Therefore:** Even the *sensor module alone* slightly exceeds the original
back-door clearance. The original back door **cannot close flush**. This is the
direct mechanical justification for the rear hump.

### 2.5 Zone B (rear hump) volume budget

Stacked sandwich, top to bottom (looking from above):

```
   ┌───────────────────────────────────────┐  ← rear hump top cover (PETG/ASA)
   │  WiFi antenna + status LED area       │
   ├───────────────────────────────────────┤  ← 1.5 mm wall
   │  USB-SSD (50 × 18 × 8) — slotted in   │  layer 1 (top), 10 mm
   │  alongside PiSugar PCB top side       │
   ├───────────────────────────────────────┤  ← spacer 2 mm
   │  Raspberry Pi 5 (85 × 56 × 16)        │  layer 2 (middle), 20 mm
   │  cooler exhaust port faces back wall  │
   ├───────────────────────────────────────┤  ← spacer 2 mm
   │  PiSugar 3 Plus (85 × 56 × 12)        │  layer 3 (bottom), 14 mm
   ├───────────────────────────────────────┤  ← 1.5 mm bottom wall
   └───────────────────────────────────────┘
   Total stack: ~48 mm thick

   Outline: ~90 mm wide × 75 mm tall (matches K1000 back-door cutout +
   small overhang to anchor mounting screws)
```

A 48 mm thick rear hump is **substantial** — roughly doubles the depth of the
camera (48 + 48 = 96 mm overall instead of 48 mm). User-acceptable? Probably,
because the K1000 had no winder/grip on the rear and the hump can be contoured.
If aesthetics matter, we could thin to ~30 mm by externalizing the SSD (USB
stick exits through a hatch and gets carried separately), but then the user
loses storage when un-plugged. Recommend: prototype at 48 mm, iterate.

---

## 3. Sensor Alignment Fixture Concept

### 3.1 The requirement

The IMX283 active surface must sit at **45.46 mm ± 0.05 mm** behind the K-mount
flange face, and **parallel to the flange face within ±0.02 mm across the
13.2 × 8.8 mm active area** (≈ 0.001 rad / 0.06°). This is the tightest
tolerance in the whole project. Industry rule of thumb for flange-focal
tolerance on 35 mm SLR is ±0.02 mm at the body, ±0.02 mm at the lens, so ±0.05
mm at the sensor is on the loose end of acceptable for sharp infinity focus,
particularly on fast lenses (f/1.4 and below).

### 3.2 Reference / datum chain

```
   K-MOUNT FLANGE FACE (machined into camera body casting)
            │
            │  45.46 mm (precision dimension)
            ▼
   IMX283 SILICON ACTIVE SURFACE
            ▲
            │  ~0.5 mm (cover glass + airgap)
            │  ~2.0 mm (cover glass to top of ceramic package)
            │  ~1.6 mm (PCB thickness)
            ▼
   IMX283 PCB REAR FACE
            ▲
            │  shim stack (variable, 0.05–0.5 mm Mylar/brass)
            ▼
   ALIGNMENT PLATE FRONT FACE
            ▲
            │  2.0 mm (plate thickness, ground flat)
            ▼
   ALIGNMENT PLATE REAR FACE
            ▲
            │  bolted to bosses molded/printed into body adapter ring
            ▼
   BODY ADAPTER RING (registers against K1000 body interior datum surfaces)
```

### 3.3 Manufacturing recommendation

| Layer | Material | Method | Tolerance | Rationale |
|---|---|---|---|---|
| **Alignment plate** | 6061-T6 aluminum, 2 mm | CNC mill, then surface-ground both faces | ±0.01 mm flatness, ±0.02 mm thickness | This is the critical surface. Must be flat and parallel. Resin and FDM cannot achieve this without post-machining. |
| **Body adapter ring** | SLA resin (Formlabs Tough 2000) or aluminum | Resin for proto, CNC alu for production | ±0.05 mm overall, mounting bosses lapped to plate | Holds the alignment plate to the body. Less critical than the plate itself. |
| **Sensor PCB mounting** | M2 × 4 stainless, threaded through plate into PCB stand-offs | Heat-set inserts (proto) / tapped holes (production) | Tighten to spec torque (~0.2 Nm) | Avoid over-torque warping the PCB |
| **Shim pack** | 0.025 / 0.050 / 0.100 mm brass + Mylar | Hand-selected at assembly | ±0.005 mm per shim | Trim-up to compensate for accumulated stack-up |

### 3.4 Assembly-time calibration procedure (proposed)

1. Pre-assemble body adapter ring + alignment plate into K1000 body (no sensor).
2. Place a precision depth gauge or autocollimator at the K-mount flange.
3. Measure distance from flange to alignment plate front face. Target = 45.46 mm
   − (cover glass + airgap + PCB) = approximately 41.36 mm (with assumed stack;
   refined once sensor module is in hand).
4. Add/remove shims at the four corners until measurement is within ±0.02 mm
   AND parallel-to-flange within ±0.02 mm.
5. Install sensor PCB.
6. Verify focus on a collimated target (lens at infinity, sharp aerial image
   plane) using the live feed from the Pi. Iterate shims as needed.
7. Lock down with screws at final spec torque + thread-locker.

### 3.5 Why we cannot just 3D-print this

FDM dimensional tolerance is typically ±0.1–0.3 mm and surfaces are not flat.
Even SLA resin warps under cure and over time (thermal cycling, humidity).
**The flange-to-sensor surface MUST be metallic and ground.** Printed parts are
fine for the surrounding adapter ring but not for the critical surface.

---

## 4. Optical Stack Compensation (Film vs Sensor)

### 4.1 What the film plane "actually means"

The K-mount flange focal distance of 45.46 mm is specified to the **emulsion
surface** of the film, not the back surface. The film is held against the rails
by the pressure plate; the rails are the actual datum surface inside the camera.
Film base + emulsion total thickness is ~0.13 mm (Kodak/Ilford typical 35 mm).

So: when a film camera is in spec, the **rail surface (which the film emulsion
contacts)** sits exactly 45.46 mm from the mount flange. The film emulsion is
*on top of* the rail surface, so the emulsion sits at 45.46 mm — and the back
of the film sits at 45.46 + 0.13 = 45.59 mm.

### 4.2 What the sensor "looks like" optically

The IMX283 silicon active surface is what counts for focus. Above the silicon
is the cover glass (Sony 1" ceramic package, cover glass thickness ~0.4 mm,
index ~1.51). A cover glass shifts the apparent focal plane backward by
`t × (1 − 1/n) ≈ 0.4 × 0.337 ≈ 0.135 mm`.

So the "effective" focal plane (from the lens's perspective) is approximately
**0.135 mm behind the cover-glass top surface**. To put the silicon at the
right place, we want:

```
   distance(flange → cover-glass top surface) = 45.46 mm − 0.135 mm = 45.325 mm
```

Equivalently, distance(flange → silicon active surface) = 45.46 mm + (cover
glass thickness − cover glass optical shift) = 45.46 + 0.265 = **45.725 mm**.

### 4.3 Compensation strategy

Two ways to express the same target:
- **Direct method:** measure from flange to cover-glass top; aim for 45.325 mm.
  Easy to gauge with a depth probe.
- **Indirect method:** put the silicon nominal position at 45.725 mm and trust
  the cover glass shift; tune with shims on first light.

**Recommendation:** Use the direct method for the gauge target. Use a sharp
real-world test (collimated infinity target through a 50 mm f/1.4 K-mount lens,
center frame, MTF50 scoring) for final acceptance, because cover glass tilt
and index variation can blow the calculation by ±0.02 mm.

### 4.4 Film thickness — do we care?

The film base (0.13 mm) is *behind* the emulsion (toward the back of the
camera), not in front of it. The emulsion sat at 45.46 mm. The IMX283 silicon
should also sit at the "emulsion equivalent" plane. Cover glass shift is the
only optical-thickness compensation needed. Film base thickness affects nothing
because we're not putting any film in.

> If the original K1000 was calibrated to a slightly-different effective film
> position (some service techs adjust the rails for popular film stocks), the
> body itself may carry a small offset. **First-light calibration handles this**
> via the shim pack.

---

## 5. Back-Door Modification

### 5.1 Will the original back door close?

**No.** Per Section 2.4, the sensor module + alignment plate stack is ~7.5 mm
deep, which exceeds the ~6 mm cavity behind the film plane. Even if it fit, the
original back door has a pressure plate and a film-pressure spring leaf riveted
to it. That hardware would crush the sensor PCB.

### 5.2 Options considered

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| **A. Keep original door, remove pressure plate, route FFC out the side seam** | Looks stock | FFC abrasion at door hinge, no room for electronics behind, still need external Pi | rejected |
| **B. Hollow out original door, bond electronics inside** | Looks mostly stock | Original door is 0.8 mm pressed steel — can't hold electronics, no rigidity | rejected |
| **C. Replace door with custom 3D-printed rear hump that latches to original hinge + lock pin** | Reversible (original door can be re-installed), adds room for full Pi 5 stack | Adds rear bulge to camera profile | **RECOMMENDED** |
| **D. Cut through back of body casting itself** | Maximum interior room | Permanent damage, kills reversibility, violates ConOps | rejected |

### 5.3 Recommended back-door replacement design

- Mounts to the **original hinge pin and latch catch** on the body — no
  permanent modification to the body
- Front face (against body) has a captive light-seal gasket replicating the
  original foam channel
- Inner cavity is the Zone B volume (Section 2.5)
- Rear face slopes/contours rearward to a rounded hump (ergonomic — like the
  grip-side of a Nikon F100 but on the back)
- USB-C charge port, power button, status LED, and SSD access hatch on rear
- WiFi antenna routed inside top edge (away from photographer's hand)
- Material: PETG or ASA (UV-stable, impact-tolerant). PLA banned for thermal
  stability.

### 5.4 The original door is **kept**

User stores the original back door in a small foam-lined pouch with the
purchase. Re-installing it (and pulling the digital insert) returns the body
to film-shooting condition. Reversibility preserved. See Section 6.

---

## 6. Reversibility Analysis

### 6.1 What gets touched, what doesn't

| Component | Status | Reversibility |
|---|---|---|
| K-mount flange + mirror box + shutter | **Untouched** | Full |
| Body casting (top/bottom plates, sidewalls) | **Untouched** | Full |
| Viewfinder + meter | Untouched (meter optionally tapped for shutter sync from CdS contacts — TBD by pcb-designer) | Full unless meter tap is destructive |
| Film-advance lever + film-rewind crank | Untouched (advance still cocks the shutter) | Full |
| Sprocket gear / take-up spool | **Removed** (lives in the digital insert's volume) | Re-installable if parts kept |
| Pressure plate (on door) | Removed with original door | Re-installable (it stays on the original door) |
| X-sync PC terminal | Tapped with a soldered or push-on lead | Full if push-on; light surgery if soldered |
| Back door | **Removed** (kept in storage pouch) | Full — original door re-mounts on original hinge |
| Body interior | Digital insert held in place by friction + 2 captive screws against existing tripod-bushing area or strap-lug bosses (no new holes) | Full |

### 6.2 The one risk: sprocket / take-up

If we remove the sprocket roller and take-up spool to make Zone A clearance for
the FFC cable routing, those are reinstallable but **fiddly**. The sprocket
shaft engages a gear chain that drives the frame counter and the shutter cock
lockout. Removing the sprocket entirely will break the frame counter and may
allow the shutter to fire without a "frame" being advanced (which is fine for
digital but breaks the film mechanism). Recommend: leave the sprocket roller
in place, route the FFC under or alongside it.

### 6.3 The X-sync tap

The PC-sync terminal on the K1000 front-left is a passive contact pair. The
clean way: a PC-sync **plug** (the same one you'd plug a flash into) carries
the signal out of the camera to the digital insert. Zero modification to the
camera. Insert plugs into the PC-sync socket. Removable. ConOps-preferred path.

### 6.4 Verdict: **Fully reversible** if X-sync tap uses a PC-sync plug (not a
solder) and the sprocket roller is preserved.

---

## 7. Prototype Manufacturing Path

### 7.1 Quantity 1–5 (engineering prototypes)

| Part | Method | Vendor | Lead time | Unit cost |
|---|---|---|---|---|
| Alignment plate | CNC 6061-T6, then surface-grind both faces | SendCutSend (CNC) + local machine shop (grind) OR Protolabs full service | 10–15 days | $80–150 |
| Body adapter ring | SLA resin (Formlabs Tough 2000) | Local Formlabs print farm OR Shapeways | 3–5 days | $30–60 |
| Rear hump enclosure (top + bottom shells) | FDM PETG, 0.2 mm layer, 50% infill OR SLA for surface quality | Prusa MK4 in-house OR Shapeways | 2–7 days | $20–60 |
| Sensor mounting hardware (M2 screws, heat-set inserts, shim pack) | Off-shelf | McMaster-Carr | 1–2 days | $25 |
| Light seals / foam gaskets | Adhesive-back foam cut to size | Aki-Asahi or Micro-Tools (camera repair suppliers) | 5–7 days | $15 |
| Donor K1000 body | eBay / KEH "as is" or "bargain" grade | KEH.com, eBay | 3–14 days | $50–120 |
| **Prototype mech BOM (excl. sensor + Pi)** | | | | **~$220–430 per unit** |

### 7.2 Recommended prototype workflow

1. **Buy 2 donor K1000 bodies.** One for measurement / sacrificial disassembly,
   one for the actual prototype.
2. **Disassemble the sacrificial body.** Measure every interior surface.
   Photograph against scale. Produce a measured drawing in FreeCAD or
   parametric sketch.
3. **Design the alignment plate first** — it's the most critical part. Model
   in FreeCAD parametrically (key parameters: plate thickness, shim
   compensation, sensor PCB hole pattern as soon as we get the physical PCB
   in-hand or a verified Arducam mechanical drawing).
4. **CNC the alignment plate** in parallel with prototype-printing the body
   adapter ring + rear hump. Multiple iteration cycles expected on the printed
   parts.
5. **Stack-up dry assembly** in body #2 with NO sensor — verify clearances with
   a dummy PCB cut from FR4 stock.
6. **First-light assembly** with real sensor and shim pack tuning.

### 7.3 Why not full-CNC the rear hump for proto?

Cost: a CNC'd two-piece hump shell in alu would be ~$300–500 per unit and
require 4-axis work. PETG print at ~$30 lets us iterate 5 design revisions for
the cost of one CNC. Save the CNC for production tooling.

---

## 8. Production Manufacturing Path

### 8.1 Volume break-even analysis

| Volume | Alignment plate | Body adapter | Rear hump shell | Total mech BOM | Notes |
|---|---|---|---|---|---|
| 10 | CNC alu, surface-ground (~$60 ea at qty 10) | SLS nylon (~$25) | FDM/SLA (~$40) | **~$125** | Hand-finish, hand-shimmed |
| 100 | CNC alu, surface-ground (~$25 ea at qty 100) | SLS nylon or low-volume injection (~$8) | Vacuum-cast urethane or SLA tooling-board mold (~$12) | **~$45** | Calibration partially automated |
| 1000 | CNC alu, surface-ground in batch (~$15) OR sintered MIM steel (~$8) | Injection mold ABS/PC ($12k tooling, ~$1.50 per part) | Injection mold PC ($18k tooling, ~$3 per part) | **~$13–18 per unit** | Tooling amortizes |
| 10000 | MIM steel or die-cast zinc (~$4) | Injection mold (~$1) | Injection mold (~$2) | **~$7–10 per unit** | Full mass production |

### 8.2 Tooling cost breakeven

- **Injection mold (rear hump)**: 2-cavity aluminum or P20 steel mold ≈ $15–25k
  → breakeven vs. SLA at ~600–800 units (SLA shell at $20 vs molded at $2.50,
  ∆$17.50, recover $20k at ~1150 units; aggressive use of aluminum tooling
  shortens this)
- **Injection mold (body adapter ring)**: 4-cavity ≈ $10–15k → breakeven at
  ~700 units
- **CNC alignment plate**: no tooling, scales linearly; CNC remains cost-effective
  even at 10k units due to the grinding requirement (injection molding cannot
  hit the flatness tolerance)

**Recommendation:** At 100 units use SLS + SLA for soft tooling and hand-CNC the
plate. At 1000+ units, invest in injection mold tooling for the plastic parts.
The alignment plate stays CNC + ground forever — there is no economical molding
path that hits ±0.01 mm flatness.

### 8.3 Long-term sourcing risk

The single biggest risk is **donor K1000 bodies**. K1000s are vintage; eBay
supply is finite and prices rising. At 1000 units/year we'd buy out the
secondary market. **Production cannot rely on donor bodies indefinitely.**
Options:
- Switch to other K-mount bodies (KX, MX, K2 — similar interior geometry,
  cheaper supply)
- Switch product to "K-mount adapter" form-factor (no body at all — sensor +
  Pi in a small enclosure that mounts to any K-mount lens directly, viewfinder
  becomes an LCD or AR module). This is a different product.
- Commission a clone K1000 body chassis at high volume — likely uneconomical
  at <10k units/year.

This is a strategic decision for supply-chain-manager and product owner. From
mechanical perspective: the design is portable across K1000/KX/KM/MX with
minimal changes (same K-mount, same flange distance, similar interior).

---

## 9. Top Mechanical Risks (Five)

| # | Risk | Probability | Severity | Mitigation |
|---|---|---|---|---|
| **R1** | Flange-to-sensor distance drifts out of ±0.05 mm over thermal cycle, vibration, or aging | Medium | High (out-of-focus images at infinity) | Use aluminum alignment plate (low CTE mismatch with body casting), lock screws with thread-locker, design test fixture to re-verify after thermal cycling, document refocus procedure for service |
| **R2** | Sensor PCB not parallel to flange (tilt error) — corner-to-corner focus mismatch | Medium | High (one corner sharp, opposite corner blurred) | Surface-grind alignment plate, use three-point kinematic mount instead of four-screw clamp, individual corner shimming at assembly, MTF50 corner test in acceptance procedure |
| **R3** | Rear hump enclosure not stiff enough → Pi 5 + battery mass torques the camera body around the back-door hinge → flexion changes flange distance | Low-Medium | Medium | Bond the hump to the body around the back-door perimeter (light-seal channel doubles as adhesive bond line), add internal ribs to hump, route the FFC strain relief so battery weight doesn't transfer to sensor |
| **R4** | Original back-door hinge / latch geometry varies across K1000 production years (early "Asahi Pentax K1000" vs late "Pentax K1000" Chinon-built) | High | Medium (mounts don't fit some donors) | Survey hinge/latch geometry across at least 5 donor bodies of different vintages; design adapter with adjustable hinge boss OR commit to a single production-era subset |
| **R5** | FFC cable kinks or fatigues at the body / hump interface (cable crosses the back-door split line) | Medium | Medium (intermittent or dead sensor) | Use a flexible-rated 22-pin FFC (not the cheap stiff ones), provide a service loop with a defined bend radius (≥ 5 mm), route through a strain-relief slot molded into both the body adapter and the hump |

### Honorable mentions (not in top 5 but worth flagging)

- **Light leaks** — the back-door light seal must be perfect; the original
  foam channel must be replicated or replaced with EPDM gasketing
- **Heat from Pi 5** — the active cooler must vent to outside air; if the hump
  seals the cooler in, the Pi will thermally throttle. **Vent slot on the rear
  face of the hump is mandatory.**
- **Tripod bushing** — the original 1/4-20 bushing is in the body's bottom
  plate, unaffected; but if the rear hump's center of mass shifts the camera
  significantly, the tripod balance changes
- **Drop survivability** — a 90 × 80 × 22 mm PETG hump bolted to a 50-year-old
  zinc-alloy body casting is the most fragile part of the system. Recommend a
  drop test at 1 m onto carpet (representative consumer-use abuse) before
  production sign-off

---

## 10. Open Questions for Other Specialists

### For pcb-designer
1. What is the **exact verified board outline** of the chosen IMX283 Pivariety
   module? Arducam doesn't publish a clean dimensioned drawing publicly. We
   need a STEP model or at minimum a calibrated photograph of a physical unit
   with calipers in frame. **This blocks the alignment plate hole pattern.**
2. Where exactly is the FFC connector on the sensor board (which edge, what
   keep-out for the cable bend)?
3. What is the cover-glass thickness of the chosen Arducam variant (Sony spec
   is ~0.4 mm but Arducam may add an IR-cut filter or additional protective
   glass)?
4. Does the sensor board have any components on the **front face** (between
   the silicon and the lens) that protrude into the optical path or mount
   interference zone? If yes, mounting orientation must be inverted.

### For firmware-engineer
1. Can the FFC cable run **120 mm or longer** from sensor to Pi 5 MIPI-CSI
   connector without signal-integrity issues? Standard FFCs over ~150 mm start
   to drop frames on MIPI 4-lane at full IMX283 throughput. If 100 mm is the
   ceiling, the Pi 5 MUST sit close to the rear of the body (hump can't be
   externalized to a remote pouch).
2. What is the heat dissipation budget — does the Pi 5 need to run the active
   cooler continuously during preview, or only during capture? This determines
   the rear hump vent area.

### For systems-engineer
1. Is the **rear hump aesthetic acceptable** to the user, or should we
   investigate the "lose the SSD, thinner hump" tradeoff? Need a product-owner
   decision before we lock the enclosure geometry.

---

## 11. Next Mechanical Deliverables (after this brief)

1. **Donor body teardown** — acquire 2 K1000s, dimensional survey, signed-off
   measurement drawing
2. **Sensor module verification** — acquire 1 Arducam Pivariety IMX283, verify
   board outline + cover glass against assumed numbers
3. **FreeCAD master assembly** — body + adapter ring + alignment plate + sensor
   + hump, parametric, exported as STEP for the rest of the team
4. **First prototype iteration** — printed adapter + machined plate + printed
   hump, dry-fit (no sensor)
5. **First-light prototype** — full assembly, shim calibration, MTF acceptance
   test on a 50 mm f/1.4 K-mount lens

---

## 12. Appendix — Tolerance Stack-up Worksheet (preliminary)

Stack from K-mount flange face to IMX283 silicon, with worst-case bounds.
All in mm.

| Element | Nominal | Tolerance (±) | Notes |
|---|---|---|---|
| K-mount flange to body adapter ring datum surface | 35.00 | 0.05 | Body casting OEM tolerance |
| Body adapter ring thickness (datum-to-plate seat) | 8.00 | 0.05 | SLA proto / CNC prod |
| Alignment plate thickness | 2.00 | 0.02 | CNC + surface ground |
| Plate to PCB rear face (shim stack) | 0.25 (variable) | 0.01 | Brass shims, hand-selected |
| Sensor PCB thickness | 1.60 | 0.10 | Standard FR4 tolerance |
| PCB top face to ceramic package base | 0.30 | 0.10 | Solder + paste height |
| Ceramic package base to silicon active surface | -2.00 | 0.05 | Sony package spec (silicon is INSIDE the package, below its top face) |
| **Subtotal: flange → silicon, nominal** | **45.15** | | |
| **Add cover-glass optical shift compensation** | +0.135 | | Effective target shifts 0.135 mm |
| **Effective focal-plane position vs nominal 45.46 mm target** | -0.175 | | Off by 0.175 mm before shimming |
| **Required shim adjustment to hit 45.46 ±0.05** | +0.175 nominal, ±0.05 trim | | Within shim pack range |
| **Stack-up worst-case (RSS)** | | **±0.18 mm** | Exceeds ±0.05 budget by ~3.6× without shimming |

**Conclusion:** Shimming is non-optional. The tolerance stack does not close
without trim-up at assembly. This drives the assembly-time calibration step
(Section 3.4). Production cost MUST budget ~15 minutes of skilled labor per
unit for shim calibration.

---

## 13. Sources & References

### Pentax K1000 / K-mount
- [Pentax K1000 — Wikipedia](https://en.wikipedia.org/wiki/Pentax_K1000)
- [Pentax K1000 — Camera-wiki](https://camera-wiki.org/wiki/Pentax_K1000)
- [Pentax K1000 service manual (archive.org)](https://archive.org/details/central-manuals-camera_pentax_K1000_rsm_ENG.pdf)
- [Pentax K-mount — Wikipedia](https://en.wikipedia.org/wiki/Pentax_K-mount)
- [Features and Operation of the Original K-Mount — kmp.pentaxians.eu](http://kmp.pentaxians.eu/technology/k-mount/k/)
- [Flange-to-Film-Plane Focal Distance TOLERANCES — PentaxForums](https://www.pentaxforums.com/forums/8-pentax-film-slr-discussion/362855-flange-film-plane-focal-distance-tolerances.html)
- [Flange Focal Distance Guide — Brian Smith](https://briansmith.com/flange-focal-distance-guide/)
- [Pentax K1000 review — Ken Rockwell](https://www.kenrockwell.com/pentax/k1000.htm)

### IMX283 Sensor
- [Sony IMX283CQJ Flyer](https://www.sony-semicon.com/files/62/pdf/p-13_IMX283CQJ_Flyer.pdf)
- [FRAMOS IMX283 product page](https://framos.com/products/sensors/area-sensors/imx283cqj-c-21902/)
- [Arducam Pivistation 5 Klarity IMX283 product page](https://www.arducam.com/arducam-pivistation-5-klarity-20mp-imx283-all-in-one-high-resolution-raspberry-pi-5-camera-kit.html)
- [Arducam B0477 IMX283 USB Datasheet](https://blog.arducam.com/downloads/datasheet/B0477_20MP_IMX283_USB3.0_Camera_Datasheet.pdf)
- [Arducam Pivistation 5 IMX283 B0502 Datasheet (mirror)](https://doc.switch-science.com/media/files/00bbe642-b19c-4496-a199-38b50ce1dc74.pdf)
- [Kurokesu 20M IMX283 1" CSI-2 Camera Module](https://www.kurokesu.com/main/2025/08/05/new-20m-imx283-1-csi-2-camera-module/)

### Raspberry Pi 5
- [Raspberry Pi 5 mechanical drawing](https://datasheets.raspberrypi.com/rpi5/raspberry-pi-5-mechanical-drawing.pdf)
- [Raspberry Pi 5 product brief](https://datasheets.raspberrypi.com/rpi5/raspberry-pi-5-product-brief.pdf)
- [Element14: Raspberry Pi 5 specs & drawings](https://community.element14.com/products/raspberry-pi/b/blog/posts/raspberry-pi-5-technical-specifications-and-mechanical-drawings)

### PiSugar
- [PiSugar 3 Plus product page](https://www.pisugar.com/products/pisugar-3-plus-raspberry-pi-ups)
- [PiSugar 3 series wiki](https://github.com/PiSugar/PiSugar/wiki/PiSugar-3-Series)

### Film / Pressure Plate
- [135 film — Wikipedia](https://en.wikipedia.org/wiki/135_film)
- [Film base — Wikipedia](https://en.wikipedia.org/wiki/Film_base)
- [Thickness of film support — Photrio](https://www.photrio.com/forum/threads/thickness-of-film-support.26050/)

### Prior Art (I'm Back)
- [Can This Gadget Really Turn Your Old Film Camera Digital? — Fstoppers](https://fstoppers.com/reviews/can-gadget-really-turn-your-old-film-camera-digital-707047)
- [I'm Back digital retrofit — Rust Magazine](https://www.rustmag.com/gear/im-back-a-digital-retrofit-for-film-cameras)
- [Over 20 years later, I'm Back realizes one of photography's greatest 'What ifs' — DPReview](https://www.dpreview.com/articles/6675278346/over-20-years-later-i-m-back-realises-one-of-photography-s-greatest-what-ifs)
- [I'm Back Roll APS-C — PetaPixel](https://petapixel.com/2026/04/27/im-back-roll-aps-c-has-raised-nearly-850000-on-kickstarter/)

---

*End of mechanical briefing. Hand back to orchestrator (hardware-dev team) for
integration with electrical, firmware, supply-chain, and DFM concurrent
deliverables.*
