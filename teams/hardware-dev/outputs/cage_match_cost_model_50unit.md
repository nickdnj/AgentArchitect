# Cage Match — 50-Unit Production Cost Model

**Date:** April 9, 2026
**Prepared by:** Supply Chain Manager
**Program:** Cage Match Gamified Batting Cage System
**Scope:** 50-unit production run (~5-6 venue deployments, 9 cages per venue)

---

## Executive Summary

| Metric | MVP Config (Tablet) | Full Config (Outdoor TV) |
|--------|--------------------|-----------------------|
| Per-cage landed cost | **$1,178** | **$2,095** |
| Per-venue landed cost (9 cages + infra) | **$11,825** | **$19,755** |
| 50-unit program total (hardware only) | **$58,900** | **$104,750** |
| NRE (one-time, amortized over 50 units) | **$4,600** | **$4,600** |
| Per-unit NRE adder | **$92** | **$92** |
| Total landed cost per cage (with NRE) | **$1,270** | **$2,187** |

**Retail pricing baseline:** Single-unit BOM at retail was $2,665 (full display). Production landed cost at 50 units drops this to $2,187 fully loaded. Gross margin at $3,500/cage pricing = **$1,313 (38%)**.

---

## Section 1 — Custom PCB Cost Estimates

### PCB Fabrication and Assembly Notes

JLCPCB PCBA pricing at 50 units comprises:
- **PCB bare board:** ~$2/board (2-layer, under 100x100mm at quantity, promotional pricing)
- **SMT setup fee:** $8–$25 per order (one-time)
- **Stencil:** ~$15 one-time
- **Assembly (per joint):** ~$0.0017/joint (economic PCBA)
- **Extended component fee:** $1.50/component type (feeder loading)
- **DDP shipping to US:** ~$0.80–$1.50/board when amortized in bulk shipment
- **US tariff (Section 301 + provisional):** ~35% on assembled PCB value

The tariff situation is material. As of March 2026, JLCPCB's DDP rate bundles approximately 35% total tariff (10% provisional + 25% Section 301) into the quoted price for PCBAs shipped to the US. All pricing below is DDP (no surprise customs bill).

---

### CM-TC-01 — Target Controller Board

**Function:** Replaces ESP32 dev board + level shifter module + breadboard wiring per cage  
**Specs:** 2-layer, 60x80mm, ~50 components (ESP32-S3-MINI, W5500 Ethernet, level shifters, power, connectors)

| Cost Element | Calculation | Unit Cost |
|---|---|---|
| Bare PCB | JLCPCB 2-layer, 60x80mm, 50 qty | $3.50 |
| SMT assembly labor | 50 components x 1.5 joints avg x $0.0017 | $1.28 |
| Extended component fees | ~8 extended types x $1.50 / 50 boards | $0.24 |
| Component BOM (LCSC) | ESP32-S3-MINI $3.50, W5500 $2.10, passives, connectors | $14.20 |
| Stencil amortized | $15 / 50 | $0.30 |
| Setup fee amortized | $25 / 50 | $0.50 |
| Sub-total pre-tariff | | $20.02 |
| DDP tariff (~35%) | $20.02 x 0.35 | $7.01 |
| DHL shipping (amortized) | Bulk shipment, ~$1.50/board | $1.50 |
| **CM-TC-01 landed cost** | | **$28.53** |

*Rounds to $29/board. Compared to: ESP32 dev board ($7) + level shifter ($4) + breadboard/wiring ($5) = $16 retail. At production scale the custom PCB is $13 more but eliminates hand-wiring time, improves reliability, and enables proper enclosure fit.*

---

### CM-BI-01 — Batter Interface Board

**Function:** Replaces optocoupler breadboard + USB audio dongle  
**Specs:** 2-layer, 65x56mm, ~35 components (PC817 optocouplers, PCM5102A audio DAC, TVS protection, Jetson HAT connector)

| Cost Element | Calculation | Unit Cost |
|---|---|---|
| Bare PCB | JLCPCB 2-layer, 65x56mm, 50 qty | $3.50 |
| SMT assembly labor | 35 components x 1.5 joints x $0.0017 | $0.89 |
| Extended component fees | ~6 extended types x $1.50 / 50 boards | $0.18 |
| Component BOM (LCSC) | PCM5102A $1.80, PC817 x4 $0.40, TVS, passives, connector | $9.60 |
| Stencil amortized | $15 / 50 | $0.30 |
| Setup fee amortized | $25 / 50 | $0.50 |
| Sub-total pre-tariff | | $14.97 |
| DDP tariff (~35%) | $14.97 x 0.35 | $5.24 |
| DHL shipping (amortized) | | $1.50 |
| **CM-BI-01 landed cost** | | **$21.71** |

*Rounds to $22/board. Compared to: optocoupler module ($8) + USB audio dongle ($15) = $23 retail. Nearly cost-neutral at 50 units — and that's before counting assembly labor saved.*

---

## Section 2 — Per-Cage Production BOM (50 Units)

All pricing reflects 50-unit purchasing. Items noted as "no break" hold at or near retail pricing.

### Category 1 — Compute

| Component | Retail (1x) | 50-unit price | Notes |
|---|---|---|---|
| NVIDIA Jetson Orin Nano Super (dev kit) | $249 | $249 | No volume break. MSRP fixed. |
| 19V 6.32A power supply (for Jetson) | $18 | $14 | Amazon bulk / generic brand |
| NVMe SSD 500GB (M.2 2230 or 2242) | $55 | $42 | Crucial BX500 or equivalent, 50-pack |
| NEMA 4X enclosure 14x11x5 | $55 | $44 | Polycase or Hammond, 10+ qty discount |
| 80mm cooling fan (IP54, 12V) | $12 | $9 | SUNON or Delta, bulk pack |
| **Category 1 Subtotal** | **$389** | **$358** | |

### Category 2 — Camera

| Component | Retail (1x) | 50-unit price | Notes |
|---|---|---|---|
| Arducam Day/Night IMX477 for Jetson | $65 | $58 | ~10% at volume; contact Arducam for OEM pricing |
| 2.8mm CS-mount lens | $22 | $18 | Bulk from LCSC/Aliexpress OEM |
| IP66 camera housing (aluminum, M12 lens port) | $32 | $26 | Alibaba OEM at 50 qty |
| CSI extension cable (200mm, 22-pin flex) | $12 | $9 | JLCPCB-sourced flex cable |
| Camera pole mount (aluminum L-bracket) | $25 | $20 | Custom laser-cut or bought bracket |
| **Category 2 Subtotal** | **$156** | **$131** | |

### Category 3A — Display (MVP: Tablet)

| Component | Retail (1x) | 50-unit price | Notes |
|---|---|---|---|
| 10" Android tablet (IPS, 1200x1920) | $150 | $120 | Amazon commercial, Fire HD 10 or equiv. |
| Rugged tablet wall mount (VESA) | $20 | $16 | Amazon bulk |
| Micro-USB power cable (outdoor-rated) | $6 | $4 | Included |
| **Category 3A Subtotal (MVP)** | **$176** | **$140** | |

### Category 3B — Display (Full: Outdoor TV)

| Component | Retail (1x) | 50-unit price | Notes |
|---|---|---|---|
| SunBrite Veranda 55" outdoor TV | $999 | $875 | Commercial reseller discount ~12% at 9+ units |
| Outdoor TV mount (heavy-duty VESA) | $89 | $75 | Amazon commercial |
| Surge protector (outdoor, NEMA 4) | $28 | $24 | |
| **Category 3B Subtotal (Full)** | **$1,116** | **$974** | |

### Category 4 — LED Targets

| Component | Retail (1x) | 50-unit price | Notes |
|---|---|---|---|
| CM-TC-01 Target Controller PCB | (replaces $22 in dev parts) | $29 | Custom PCB, landed cost incl. tariff |
| WS2812B IP67 LED strip 5m x6 rolls | $108 | $82 | BTF-Lighting bulk; ~24% off at 300 rolls |
| Mean Well LRS-100-5 5V/20A PSU x2 | $44 | $34 | Mouser 50-unit pricing ~$17ea |
| Polycarbonate sheet 12"x48" x5 | $132 | $105 | eStreetPlastics, 15% off at 50+ qty |
| Aluminum extrusion 20x40mm, 1m x6 | $96 | $76 | MISUMI or Alibaba OEM, 300 pcs |
| JST connectors assortment (20-pack) | $12 | $9 | LCSC bulk |
| **Category 4 Subtotal** | **$392** | **$335** | *Dev board + level shifter replaced by CM-TC-01* |

*Note: Retail BOM showed $414 but included $22 in items now replaced by CM-TC-01. Net effective retail was $392 for apples-to-apples comparison.*

### Category 5 — Audio

| Component | Retail (1x) | 50-unit price | Notes |
|---|---|---|---|
| Outdoor speakers, 2-way, pair | $85 | $68 | Pyle PDWR50B or equiv, Amazon bulk |
| Audio amplifier output (via CM-BI-01) | (replaces $15 USB dongle) | $0 | Integrated in CM-BI-01 |
| Speaker cable, 20ft outdoor | $8 | $6 | Included in CM-BI-01 scope |
| **Category 5 Subtotal** | **$93** | **$74** | *USB audio dongle replaced by CM-BI-01* |

### Category 6 — Token Interface

| Component | Retail (1x) | 50-unit price | Notes |
|---|---|---|---|
| CM-BI-01 Batter Interface PCB | (replaces $26 in discrete parts) | $22 | Custom PCB, landed cost incl. tariff |
| Shielded cable (token machine, 6ft) | $14 | $10 | Belden bulk |
| Terminal block enclosure (IP65) | $18 | $14 | Polycase N-22 |
| **Category 6 Subtotal** | **$46** | **$46** | *Optocoupler module + USB audio replaced by CM-BI-01; cost-neutral* |

### Category 7 — Networking (WIRED ETHERNET)

*CEO decision: wired Ethernet replaces 4G router. Removes $89 router + $10/mo/cage recurring.*

| Component | Retail (1x) | 50-unit price | Notes |
|---|---|---|---|
| Cat5e outdoor-rated cable (100ft spool per cage) | $18 | $14 | Monoprice bulk; ~70ft run typical |
| RJ45 keystone jacks (2x per cage) | $4 | $3 | Bulk pack |
| Conduit fittings for cable entry | $6 | $4 | |
| **Category 7 Subtotal** | **$28** | **$21** | *Per-cage share. Venue switch is in per-venue section.* |

*Note: Original BOM showed $95 including $89 4G router + $10 SIM. Wired Ethernet drops per-cage networking to $21.*

### Category 8 — Power & Infrastructure

| Component | Retail (1x) | 50-unit price | Notes |
|---|---|---|---|
| NEMA 4X enclosure, 14x11x7 (DIN rail) | $175 | $140 | Hammond 1554N2 or Polycase; 10+ qty |
| Outdoor surge protector (DIN mount) | $35 | $28 | |
| Mean Well DDR-60D-12 12V DIN PSU | $22 | $18 | Mouser bulk |
| Liquid-tight conduit kit (10ft + fittings) | $28 | $22 | Hubbell bulk pack |
| Cable glands M20 (10-pack) | $10 | $8 | LCSC bulk |
| Heat shrink + zip ties assortment | $16 | $12 | Amazon bulk |
| **Category 8 Subtotal** | **$286** | **$228** | |

### Category 9 — Mounting Hardware

| Component | Retail (1x) | 50-unit price | Notes |
|---|---|---|---|
| Stainless L-brackets (4-pack) | $18 | $14 | McMaster bulk |
| Camera/enclosure mount arm | $25 | $20 | |
| U-bolts (10-pack, for fence attachment) | $14 | $11 | |
| Hardware assortment (bolts, nuts, washers) | $12 | $9 | McMaster assortment pack |
| **Category 9 Subtotal** | **$69** | **$54** | |

---

### Per-Cage BOM Summary

| Category | MVP Config | Full Display Config |
|---|---|---|
| 1 — Compute | $358 | $358 |
| 2 — Camera | $131 | $131 |
| 3 — Display | $140 (tablet) | $974 (outdoor TV) |
| 4 — LED Targets | $335 | $335 |
| 5 — Audio | $74 | $74 |
| 6 — Token Interface | $46 | $46 |
| 7 — Networking (per-cage share) | $21 | $21 |
| 8 — Power & Infrastructure | $228 | $228 |
| 9 — Mounting | $54 | $54 |
| **Component subtotal** | **$1,387** | **$2,221** |

---

## Section 3 — Assembly Labor

A trained technician assembles one cage kit from pre-kitted components. Custom PCBs arrive assembled from JLCPCB; this covers mechanical build-out, wiring, enclosure mounting, and testing.

### Per-Cage Assembly Tasks

| Task | Time (hrs) | Notes |
|---|---|---|
| Unbox and stage all components | 0.25 | From kit bags |
| Install and wire main NEMA enclosure (DIN PSU, surge, terminal strips) | 0.75 | Pre-labeled wiring |
| Mount Jetson + SSD + fan in compute enclosure | 0.50 | |
| Install CM-BI-01 in token interface enclosure | 0.25 | Board drops into enclosure |
| Install CM-TC-01 in LED controller box | 0.25 | |
| Build 5 LED target panels (extrusion + polycarbonate + LED strip + seal) | 2.00 | Most labor-intensive task |
| Wire LED strips to CM-TC-01 | 0.50 | JST pre-crimped |
| Mount camera in housing + lens install | 0.25 | |
| Test power-on, LED function, token trigger | 0.50 | Bench test before site |
| Pack for shipping | 0.25 | Labeled kit box |
| **Total bench assembly per cage** | **5.50 hrs** | |

**On-site installation (per cage at venue):**

| Task | Time (hrs) |
|---|---|
| Mount compute and interface enclosures on fence post | 0.50 |
| Run Cat5e cable, terminate RJ45s | 0.50 |
| Mount LED target frames on cage netting supports | 1.50 |
| Mount display (tablet or TV) | 0.50 |
| Mount camera, aim, focus | 0.25 |
| Connect speakers, route cables in conduit | 0.50 |
| Final power-on, software configuration, CV calibration | 1.00 |
| **Total on-site per cage** | **4.75 hrs** | |

**Total labor per cage: 10.25 hours**

| Labor Item | Hours | Rate | Cost |
|---|---|---|---|
| Bench assembly (warehouse/shop) | 5.50 | $25/hr | $137.50 |
| On-site installation | 4.75 | $35/hr (travel labor) | $166.25 |
| **Total assembly labor per cage** | **10.25 hrs** | | **$303.75** |

Round to **$305/cage**.

*Note: On-site rate is higher ($35/hr) due to travel and equipment-on-ladder work. These rates assume technician-level labor (not engineer). First few installs will be slower; estimate improves with practice.*

---

## Section 4 — Per-Venue Infrastructure

Shared costs across a 9-cage venue. These are charged once per venue, not per cage.

### Networking Infrastructure

| Item | Qty | Unit Cost | Total |
|---|---|---|---|
| Managed gigabit Ethernet switch (16-port, DIN or rack mount) | 1 | $180 | $180 |
| Cat5e patch cables (cage-to-switch, pre-made) | 10 | $8 | $80 |
| Network patch panel or switch housing | 1 | $45 | $45 |
| Conduit tray / cable management (venue-wide) | 1 | $75 | $75 |
| **Networking subtotal** | | | **$380** |

*Non-PoE managed switch is sufficient since Jetson has its own PSU. A Netgear GS316 or TP-Link TL-SG1016D at 16-port gigabit runs $70–$90; managed variant with VLAN support runs $150–$200.*

### Hub System (Raspberry Pi 5 Hub Node)

The venue hub runs tournament brackets, cross-cage leaderboard, and entrance display.

| Item | Qty | Unit Cost | Total |
|---|---|---|---|
| Raspberry Pi 5 (4GB) | 1 | $90 | $90 |
| microSD 64GB (OS) | 1 | $12 | $12 |
| Pi 5 case with active cooling | 1 | $18 | $18 |
| 27" LED display (entrance/waiting area) | 1 | $185 | $185 |
| VESA wall mount for entrance display | 1 | $25 | $25 |
| HDMI cable (6ft) | 1 | $8 | $8 |
| USB power supply for Pi (27W) | 1 | $14 | $14 |
| **Hub system subtotal** | | | **$352** |

*Note: Raspberry Pi 5 is currently at $90 due to LPDDR4 shortage-driven price increases (up from $60 MSRP). Budget at current market price.*

### Venue Infrastructure Labor

| Task | Hours | Rate | Cost |
|---|---|---|---|
| Network switch installation + cabling | 2.0 | $35 | $70 |
| Hub Pi setup, software install, network config | 3.0 | $35 | $105 |
| Entrance display mount + Pi connection | 1.0 | $35 | $35 |
| Cross-cage system integration test | 2.0 | $35 | $70 |
| **Venue infrastructure labor** | **8.0 hrs** | | **$280** |

### Per-Venue Infrastructure Summary

| Item | Cost |
|---|---|
| Networking hardware | $380 |
| Hub system | $352 |
| Infrastructure labor | $280 |
| **Total per-venue infrastructure** | **$1,012** |

---

## Section 5 — NRE (Non-Recurring Engineering)

NRE covers one-time costs to develop and validate the custom PCBs and production tooling. Nick is doing PCB design himself (no external EE design fees), so NRE is prototype fabrication and testing cost only.

### CM-TC-01 NRE

| Item | Cost | Notes |
|---|---|---|
| Proto run 1: 5 bare PCBs, 2-layer | $25 | JLCPCB 5-pack |
| Proto run 1: components for 5 boards (hand-solder) | $150 | LCSC order |
| Proto run 1: DHL shipping | $18 | |
| Rev 2 spin: 5 bare PCBs | $25 | Expected one revision |
| Rev 2 spin: components for 5 boards | $150 | |
| Rev 2 DHL shipping | $18 | |
| Total CM-TC-01 NRE | **$386** | |

### CM-BI-01 NRE

| Item | Cost | Notes |
|---|---|---|
| Proto run 1: 5 bare PCBs, 2-layer | $25 | JLCPCB 5-pack |
| Proto run 1: components for 5 boards | $100 | Fewer components than TC-01 |
| Proto run 1: DHL shipping | $18 | |
| Rev 2 spin: 5 bare PCBs | $25 | |
| Rev 2 spin: components for 5 boards | $100 | |
| Rev 2 DHL shipping | $18 | |
| Total CM-BI-01 NRE | **$286** | |

### Production Test & Tooling

| Item | Cost | Notes |
|---|---|---|
| Production test fixture (CM-TC-01, 3D printed jig + pogo pins) | $85 | Pogo pin kit + filament |
| Production test fixture (CM-BI-01) | $65 | |
| LED target frame jig (cut template + bending guide) | $40 | |
| Assembly documentation (BOM, wiring diagrams, photos) | $0 | Owner does this |
| Enclosure drill template (NEMA box, standardized hole pattern) | $35 | 3D-printed drill guide |
| **Test & tooling subtotal** | **$225** | |

### Shipping / Import Testing

| Item | Cost | Notes |
|---|---|---|
| Proto units (2 complete cage systems for dev/test) | $2,800 | ~2x BOM cost at proto pricing |
| Tariff and shipping on proto units | $800 | PCB + components from JLCPCB |
| **Proto unit cost subtotal** | **$3,600** | *Separate from per-unit NRE above* |

### NRE Summary (Excluding Proto Units)

| Item | Cost |
|---|---|
| CM-TC-01 NRE (2 fab runs) | $386 |
| CM-BI-01 NRE (2 fab runs) | $286 |
| Test fixtures and tooling | $225 |
| Contingency (15%) | $135 |
| **Total NRE** | **$1,032** |

**Amortized over 50 units: $21/unit** (rounding $1,032 / 50 = $20.64)

*Proto unit cost ($3,600) is a real cash expense but is development capital, not per-unit NRE. It produces 2 working cage systems that can be used for pilot deployment at Batter Up to prove the concept before production run.*

---

## Section 6 — Shipping & Logistics

### JLCPCB to US (PCB Orders)

| Item | Qty | Unit | Total |
|---|---|---|---|
| CM-TC-01 production order (50 boards) | 1 shipment | DHL DDP, ~$85 total | $85 |
| CM-BI-01 production order (50 boards) | 1 shipment | DHL DDP, ~$70 total | $70 |
| Spare CM-TC-01 (10 extra boards) | 1 shipment | Bundled with main order | $0 |
| Spare CM-BI-01 (10 extra boards) | 1 shipment | Bundled with main order | $0 |
| **JLCPCB shipping subtotal** | | | **$155** |

*Amortized per cage: $155 / 50 = $3.10/cage*

### Component Procurement Shipping

| Item | Qty | Unit | Total |
|---|---|---|---|
| Digikey/Mouser consolidated order (all categories) | 1 order | Ground shipping, ~$45 | $45 |
| Amazon bulk items (cables, hardware, PSUs) | ~5 orders | Free shipping on $25+ | $0 |
| Specialty items (Arducam, MISUMI extrusion) | 2 orders | ~$30 total | $30 |
| **Component shipping subtotal** | | | **$75** |

*Amortized per cage: $75 / 50 = $1.50/cage*

### Kit Freight to Venue

One venue = 9 cages = 9 kit boxes + 1 infrastructure box. Each kit box estimated 18"x18"x14", ~30 lbs assembled.

| Item | Cost | Notes |
|---|---|---|
| Freight: 10 boxes, 300 lbs total, ~500 miles avg | $185 | UPS Ground commercial |
| Packaging materials (custom-fit foam, boxes) | $120 | 10 kit boxes with foam |
| **Per-venue freight subtotal** | **$305** | |

*Amortized per cage: $305 / 9 = $34/cage*

### Total Shipping Per Cage

| Shipping Item | Per-Cage Cost |
|---|---|
| JLCPCB PCB shipment | $3 |
| Component procurement | $2 |
| Kit freight to venue | $34 |
| **Total shipping per cage** | **$39** |

---

## Section 7 — Spares & Warranty Reserve

### Spare PCBs (20% overage)

| Item | Qty | Unit Cost | Total |
|---|---|---|---|
| CM-TC-01 spare boards (10 extra) | 10 | $29 | $290 |
| CM-BI-01 spare boards (10 extra) | 10 | $22 | $220 |
| **PCB spares subtotal** | | | **$510** |

*Per-unit adder: $510 / 50 = $10.20/cage*

### Consumable Spares (per 50-unit program)

| Item | Qty | Unit | Total |
|---|---|---|---|
| WS2812B IP67 LED strips, 5m | 10 rolls | $14 | $140 |
| JST connectors (assorted, bulk) | 200 sets | $0.20 | $40 |
| Cat5e patch cables (spare) | 20 | $6 | $120 |
| Fuses and terminal block spares | 1 kit | $35 | $35 |
| **Consumables subtotal** | | | **$335** |

*Per-unit adder: $335 / 50 = $6.70/cage*

### Warranty Reserve (Year 1)

Budget for field failures, return shipping, and replacement parts.

| Assumption | Value |
|---|---|
| Expected field failure rate (Year 1) | 8% of cages |
| Expected failures | ~4 cages |
| Avg repair cost per failure (parts + labor) | $175 |
| **Warranty reserve** | **$700** |

*Per-unit adder: $700 / 50 = $14/cage*

### Total Spares & Warranty Per Cage

| Item | Per-Cage Cost |
|---|---|
| PCB spares (20% overage) | $10 |
| Consumables reserve | $7 |
| Warranty reserve | $14 |
| **Total spares & warranty per cage** | **$31** |

---

## Section 8 — Fully Loaded Per-Cage Cost Summary

### MVP Configuration (Tablet Display)

| Cost Category | Per-Cage Cost |
|---|---|
| Components (Category 1–9) | $1,387 |
| Assembly labor | $305 |
| NRE amortized | $21 |
| Shipping & logistics | $39 |
| Spares & warranty reserve | $31 |
| **Total landed cost per cage (MVP)** | **$1,783** |

### Full Configuration (Outdoor TV)

| Cost Category | Per-Cage Cost |
|---|---|
| Components (Category 1–9) | $2,221 |
| Assembly labor | $305 |
| NRE amortized | $21 |
| Shipping & logistics | $39 |
| Spares & warranty reserve | $31 |
| **Total landed cost per cage (Full)** | **$2,617** |

---

## Section 9 — Per-Venue Landed Cost (9 Cages)

### MVP Configuration

| Item | Cost |
|---|---|
| 9 cages x $1,783 | $16,047 |
| Per-venue infrastructure | $1,012 |
| **Total per-venue (MVP)** | **$17,059** |

### Full Configuration

| Item | Cost |
|---|---|
| 9 cages x $2,617 | $23,553 |
| Per-venue infrastructure | $1,012 |
| **Total per-venue (Full)** | **$24,565** |

---

## Section 10 — Total 50-Unit Program Cost

| Item | MVP | Full |
|---|---|---|
| 50 cage units (components + assembly + shipping) | $87,650 | $133,050 |
| NRE (one-time, not amortized) | $1,032 | $1,032 |
| Spares & warranty (program-level) | $1,545 | $1,545 |
| Proto development units (2 cage systems) | $3,600 | $3,600 |
| **Total 50-unit program cost** | **$93,827** | **$139,227** |

*The proto development cost ($3,600) is incurred before production begins and should be treated as R&D capital, not COGS. Production COGS per cage is $1,783 (MVP) or $2,617 (full).*

---

## Section 11 — Cost Breakdown by Category (Proportional)

MVP configuration ($1,783/cage):

| Category | Cost | % of Total |
|---|---|---|
| Compute (Jetson + SSD + enclosure) | $358 | 20.1% |
| Display (tablet) | $140 | 7.9% |
| LED Targets | $335 | 18.8% |
| Camera system | $131 | 7.4% |
| Power & infrastructure | $228 | 12.8% |
| Audio | $74 | 4.2% |
| Custom PCBs (TC-01 + BI-01) | $51 | 2.9% |
| Token interface | $46 | 2.6% |
| Networking | $21 | 1.2% |
| Mounting | $54 | 3.0% |
| Assembly labor | $305 | 17.1% |
| NRE amortized + shipping + warranty | $91 | 5.1% |
| **Total** | **$1,783** | **100%** |

Key observation: Compute (Jetson, non-negotiable at $249) + Assembly Labor together = 37% of total unit cost. These are the two hardest levers to pull.

---

## Section 12 — Margin Analysis

### Per-Cage Sale Pricing — Gross Margin Table

COGS used: $1,783 (MVP), $2,617 (Full). Does not include SG&A or overhead.

**MVP Configuration:**

| Sale Price/Cage | Revenue | COGS | Gross Profit | Gross Margin |
|---|---|---|---|---|
| $2,000 | $2,000 | $1,783 | $217 | 10.9% |
| $2,500 | $2,500 | $1,783 | $717 | 28.7% |
| $3,000 | $3,000 | $1,783 | $1,217 | 40.6% |
| $3,500 | $3,500 | $1,783 | $1,717 | 49.1% |
| $4,000 | $4,000 | $1,783 | $2,217 | 55.4% |

**Full Configuration (Outdoor TV):**

| Sale Price/Cage | Revenue | COGS | Gross Profit | Gross Margin |
|---|---|---|---|---|
| $2,500 | $2,500 | $2,617 | -$117 | -4.7% (loss) |
| $3,000 | $3,000 | $2,617 | $383 | 12.8% |
| $3,500 | $3,500 | $2,617 | $883 | 25.2% |
| $4,000 | $4,000 | $2,617 | $1,383 | 34.6% |
| $4,500 | $4,500 | $2,617 | $1,883 | 41.8% |
| $5,000 | $5,000 | $2,617 | $2,383 | 47.7% |

### Per-Venue Bundle Margin

9-cage venue + infrastructure. COGS: $17,059 (MVP), $24,565 (Full).

**MVP venue bundle:**

| Bundle Price | Gross Profit | Gross Margin |
|---|---|---|
| $25,000 | $7,941 | 31.8% |
| $27,500 | $10,441 | 38.0% |
| $30,000 | $12,941 | 43.1% |
| $35,000 | $17,941 | 51.3% |

**Full venue bundle:**

| Bundle Price | Gross Profit | Gross Margin |
|---|---|---|
| $30,000 | $5,435 | 18.1% |
| $35,000 | $10,435 | 29.8% |
| $40,000 | $15,435 | 38.6% |
| $45,000 | $20,435 | 45.4% |

### Recurring Revenue Model (SaaS/Licensing)

If hardware is sold at or near cost and revenue is recurring:

**Scenario: Hardware at cost, software license per-venue**

The game software (CV engine, leaderboard, theme engine) is the differentiator. A venue with 9 cages running 8+ hours/day could realistically justify:

| Monthly License Fee | Annual Revenue/Venue | Break-even (5 venues) |
|---|---|---|
| $200/mo | $2,400/yr | $12,000/yr |
| $500/mo | $6,000/yr | $30,000/yr |
| $1,000/mo | $12,000/yr | $60,000/yr |

**Scenario: Revenue share per token/game session**

If a game session is 1 token ($2 face value), and Cage Match takes $0.15/session:
- A busy cage: 40 sessions/day x $0.15 = $6/day/cage
- 9 cages x $6 x 365 days = **$19,710/venue/year** at full utilization
- At 30% utilization: ~$5,900/venue/year

**Recommended hybrid:** Sell hardware at $2,500/cage (MVP, ~$30/cage gross profit — essentially at cost) + $299/month venue license. This gets hardware deployed fast and builds recurring revenue.

At 5 venues (45 cages): $299 x 5 x 12 = **$17,940/year ARR** within 12 months, growing with each venue.

---

## Section 13 — Risk Register

| Risk | Severity | Likelihood | Mitigation |
|---|---|---|---|
| Jetson Orin Nano availability | High | Medium | NVIDIA supply has been tight. Order 60 units for 50-unit run. No substitute exists for this CV performance tier. |
| US tariffs on JLCPCB orders | Medium | High | Currently ~35% DDP rate. Priced in. Consider domestic PCB assembly (Advanced Circuits, MacroFab) at 2x cost but no tariff risk. |
| Arducam IMX477 single-source | High | Medium | No exact substitute with same CSI pinout for Jetson. Contact Arducam for volume agreement. Seeed Studio carries same board. |
| Raspberry Pi 5 price volatility | Low | High | Pi 5 is $90 now vs $60 MSRP. Already priced at $90. Not on critical path — Pi 4 (cheaper) also works for hub. |
| SunBrite TV lead time | Medium | Low | Commercial resellers stock these. 2-week typical lead. |
| WS2812B LED strip IP67 quality variance | Medium | Medium | BTF-Lighting is reliable. Avoid no-name Amazon strips for production. |
| Mean Well PSU supply | Low | Low | Widely stocked at Mouser, Digikey. 2-4 week lead at 50-unit quantities. |
| Custom PCB revision risk | Medium | Medium | Budget for 2 spins (priced into NRE). Board complexity is low (2-layer, standard components). |

---

## Section 14 — Ordering Roadmap

### Phase 1 — Proto Development (Now)

| Action | Cost | Timing |
|---|---|---|
| Design and fab CM-TC-01 v1 (5 boards) | $193 | After schematic complete |
| Design and fab CM-BI-01 v1 (5 boards) | $143 | After schematic complete |
| Validate on bench, spin rev 2 if needed | $336 | 3-4 weeks post-v1 |
| Pilot installation at Batter Up (1 cage) | ~$1,800 | After PCB validation |

### Phase 2 — Production Order (50 Units)

| Action | Cost | Timing |
|---|---|---|
| JLCPCB PCBA orders (CM-TC-01 x60, CM-BI-01 x60) | ~$3,060 | 2 weeks lead |
| Component procurement (Mouser/Digikey/Amazon) | ~$38,000 | 2-4 week lead |
| Jetson Orin Nano Super x55 | ~$13,695 | Order early — demand risk |
| Production assembly (50 cage kits) | ~$15,250 | 3-4 weeks in shop |
| Venue installations (waves of 9 cages) | ~$2,520/venue | Schedule with operator |

### Cash Flow Summary

| Phase | Cash Out | Timing |
|---|---|---|
| Proto PCBs + components | $3,600 | Month 1 |
| Production components (deposit) | $25,000 | Month 2 |
| Production components (balance + Jetsons) | $30,000 | Month 3 |
| Assembly labor | $15,250 | Month 3–4 |
| Installation labor | $12,600 (5 venues) | Month 4–6 |
| **Total program cash** | **~$86,450** | | 

---

## Appendix A — Comparison: Custom PCB vs Dev Board (Per Cage, 50 Units)

| Approach | Component Cost | Assembly Labor | Reliability | Notes |
|---|---|---|---|---|
| Dev board + breadboard (retail) | $22 (TC + BI parts) | +1.5 hrs/cage wiring | Lower | Retail pricing, hand-wired |
| Custom PCB (CM-TC-01 + CM-BI-01) | $51 (both PCBs landed) | -1.5 hrs/cage | Higher | Tariff included, JLCPCB assembled |

Net: Custom PCBs cost $29 more in parts but save ~$53 in wiring labor (1.5 hrs x $35/hr). **Net savings of ~$24/cage at 50 units, plus meaningfully better reliability and enclosure-fit.** Custom PCBs are the right call.

---

## Appendix B — Volume Sensitivity (Key Components)

What happens to per-cage cost at different volumes:

| Volume | Per-Cage COGS (MVP) | Delta vs 50-unit |
|---|---|---|
| 1 unit (retail parts) | ~$2,450 | +$667 (37% more) |
| 10 units | ~$2,100 | +$317 (18% more) |
| 50 units | $1,783 | baseline |
| 100 units | ~$1,600 | -$183 (10% less) |
| 250 units | ~$1,420 | -$363 (20% less) |

The largest breaks are between 1 and 10 (assembly labor efficiency + LED strip volume) and between 50 and 100 (PCB tooling amortization, Jetson potential volume pricing). At 100+ units, consider negotiating a direct NVIDIA Jetson module-only price (the dev kit carrier board is not needed for production).

---

*All pricing is April 2026. Tariff situation is fluid — JLCPCB DDP rates reflect 35% total rate as of March 17, 2026. Re-verify tariff rate at order time. Component prices subject to market conditions — Jetson, Raspberry Pi, and memory-heavy components most volatile.*
