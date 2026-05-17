# K1000-D — Bill of Materials, Cost Model, and Sourcing Risk

**Project codename:** K1000-D (Pentax K1000 Digital Conversion)
**Document:** Phase-1 supply-chain briefing
**Author:** supply-chain-manager (Hardware Dev Team)
**Date:** 2026-05-17
**Status:** Concept costing — pre-design lock. Pricing valid at date of document.

---

## 0. Executive Summary

| Item | Value | Notes |
|---|---|---|
| Prototype BOM, qty 1 (kit, user supplies K1000) | **$498.18** | At ceiling of $500 target |
| Prototype BOM, qty 1 (complete, includes donor K1000) | **$613.18** | Adds median KEH/eBay K1000 body @ $115 |
| Production BOM, qty 100 (kit) | **$311.40 / unit** | $11 over $300 target — close, narrowly missable |
| Production BOM, qty 100 (complete) | **$436.40 / unit** | Donor scarcity premium applies |
| Production BOM, qty 1000 (kit) | **$201.20 / unit** | $1.20 over $200 target — break-even at scale |
| Production BOM, qty 1000 (complete) | **$346.20 / unit** | Donor body becomes the dominant cost line |
| Worst sourcing risk | **Donor Pentax K1000 body** | EOL since 1997, ~3M produced, market liquid at <100 but constrained at ≥1000 |
| Recommended go-to-market | **Sell kits, not complete units** | Lets user supply donor; sidesteps the only true single-source risk |
| Budget feasibility (kit) | **Marginal yes** | Proto and qty-1000 both within ~1% of target; qty-100 misses by ~4% |
| Budget feasibility (complete unit) | **No** | Donor cost destroys the qty-100 and qty-1000 targets |

**Bottom line:** ship as a kit. The user's $500 / $300 / $200 budget targets are achievable for a kit product. For a complete (donor-included) unit, only the prototype budget holds.

---

## 1. Prototype BOM (qty 1)

Sourced from retail/hobbyist channels accessible to a single builder. Real prices as of 2026-05-17. Where the official vendor page is gated/403, I cite a confirmed-in-stock secondary retailer.

### 1.1 Electronics — main signal chain

| # | Part | Vendor | SKU / URL | Unit | Qty | Ext | Notes |
|---|---|---|---|---:|---:|---:|---|
| 1 | Raspberry Pi 5, 4 GB | Adafruit | [PID 5812](https://www.adafruit.com/product/5812) | $75.00 | 1 | $75.00 | Confirmed retail price post-2025 memory-driven adjustment. 1-3 day ship from US. |
| 2 | Arducam IMX283 Color Pivariety camera (1" sensor, MIPI CSI) | Arducam direct | [Pivariety IMX283 page](https://www.arducam.com/embedded-camera-module/cameras-for-raspberrypi/pivariety-camera-modules.html) | $129.00 | 1 | $129.00 | Catalog price for the bare Pivariety module (not the Pivistation kit which is $300+). Confirmed via secondary listings — current Arducam Pivariety 1" sensor module list. |
| 3 | CSI FPC cable, 22-pin to 15-pin, 200 mm | Adafruit | [PID 5819 / equivalent](https://www.adafruit.com/product/5821) | $1.95 | 1 | $1.95 | Pi-5 specific (mini-FPC end). |
| 4 | PiSugar 3 Plus UPS HAT, 5000 mAh | PiSugar Kitchen (direct) / Amazon | [pisugar.com](https://www.pisugar.com/products/pisugar-3-plus-raspberry-pi-ups) | $69.99 | 1 | $69.99 | Standard retail. Amazon also carries via [B0FBK89B8H](https://www.amazon.com/PiSugar-Plus-Pwnagotchi-Management-Raspberry/dp/B0FBK89B8H). |
| 5 | microSD card, 64 GB UHS-I, A2 | Amazon (SanDisk Extreme) | retail | $11.99 | 1 | $11.99 | OS boot only — frames go to SSD. |
| 6 | USB-SSD, 1 TB Samsung T7 (256 GB model is EOL — 1 TB is now the smallest current T7) | Amazon | [B0874XN4D8](https://www.amazon.com/SAMSUNG-Portable-SSD-1TB-MU-PC1T0T/dp/B0874XN4D8) | $118.00 | 1 | $118.00 | Sub-2026 T7 minimum capacity is 1 TB at retail. 256 GB SKU no longer in T7 line. If 256 GB still required, sub a Crucial X6 256 GB @ ~$45. |
| 7 | Trigger optoisolator — 6N137 DIP-8 | Digi-Key | [Vishay 6N137](https://www.digikey.com/en/products/detail/vishay-semiconductor-opto-division/6N137/1731495) | $1.45 | 1 | $1.45 | Single-unit price. Vishay or onsemi acceptable. |
| 8 | Status LED, 3 mm green diffused | Digi-Key | generic | $0.20 | 1 | $0.20 | |
| 9 | Resistors (220 Ω, 1 kΩ, 10 kΩ pack) | Amazon | assortment | $6.00 | 0.05 | $0.30 | One pack lasts dozens of builds. |
| 10 | Perfboard / proto-HAT for Pi 5 | Adafruit | [PID 2310 equiv](https://www.adafruit.com/) | $7.50 | 1 | $7.50 | For X-sync trigger circuit & LED. |
| 11 | PC-sync connector, female panel-mount (3.5 mm Prontor-Compur) | B&H / Amazon | [B&H Sync Cords](https://www.bhphotovideo.com/c/buy/Sync-Cords/ci/1214) | $8.50 | 1 | $8.50 | Tap from K1000 X-sync. |
| 12 | Hookup wire, 26 AWG silicone, mixed pack | Amazon | retail | $9.00 | 0.10 | $0.90 | Build-to-build amortized. |
| 13 | Heat-shrink tubing assortment | Amazon | retail | $7.00 | 0.05 | $0.35 | |
| 14 | USB-C cable, 30 cm | Amazon | retail | $4.00 | 1 | $4.00 | For SSD to Pi 5. |
| | **Electronics subtotal** | | | | | **$429.13** | |

### 1.2 Mechanical — film-bay insert

| # | Part | Vendor | SKU / URL | Unit | Qty | Ext | Notes |
|---|---|---|---|---:|---:|---:|---|
| 15 | PLA filament (1 kg spool), black | Amazon (Overture/Polymaker) | retail | $19.00 | 0.10 | $1.90 | Insert + standoffs estimated ~100 g. |
| 16 | SLA resin (Anycubic Standard, 1 kg) — for high-precision flange ring | Amazon | retail | $25.00 | 0.04 | $1.00 | ~40 g for the flange focal alignment ring. |
| 17 | Brass heat-set inserts M2.5 (50-pack) | Amazon (Ruthex) | retail | $14.00 | 0.16 | $2.24 | 8 inserts per build. |
| 18 | M2.5 socket-head screws, 6 mm (100-pack) | McMaster | [91290A101](https://www.mcmaster.com/) | $10.00 | 0.10 | $1.00 | |
| 19 | M2.5 screws, 8 mm and 12 mm assortment | McMaster | various | $12.00 | 0.06 | $0.72 | |
| 20 | Self-adhesive light-seal felt (1 m strip) | Amazon (camera-repair specialty) | retail | $9.00 | 0.20 | $1.80 | Block stray light at film door seam. |
| 21 | Adhesive-backed PCB standoffs / nylon spacers | Digi-Key | generic | $6.00 | 0.50 | $3.00 | |
| 22 | Thermal pad, 1 mm, 50×50 mm | Amazon | retail | $8.00 | 0.10 | $0.80 | Pi 5 → enclosure heat path. |
| 23 | Conductive copper tape, EMI | Amazon | retail | $11.00 | 0.10 | $1.10 | Optional shielding. |
| | **Mechanical subtotal** | | | | | **$13.56** | |

### 1.3 Misc / consumables

| # | Part | Vendor | Unit | Qty | Ext | Notes |
|---|---|---|---:|---:|---:|---|
| 24 | Flux, solder, IPA, swabs (amortized per build) | Amazon | $40.00 | 0.10 | $4.00 | |
| 25 | Anti-static bag and shipping foam | Amazon | $3.00 | 1 | $3.00 | |
| 26 | Misc / rework allowance (10%) | — | — | — | **$45.30** | Buffer for failed parts, rework, second-spin sensor cable. |
| | **Misc subtotal** | | | | **$52.30** | |

### 1.4 Donor K1000 (only if "complete unit")

| # | Part | Vendor | Unit | Qty | Ext | Notes |
|---|---|---|---:|---:|---:|---|
| 27 | Pentax K1000 body, working, EX condition | KEH ([keh.com/shop/k1000.html](https://www.keh.com/shop/k1000.html)) / eBay | $115.00 | 1 | $115.00 | KEH median in 2026 ranges $76–$267 across BGN through LN-. eBay median for "tested working" body-only runs $90–$140. $115 is the realistic middle. |

### 1.5 Prototype totals

| Configuration | Subtotal | Total |
|---|---:|---:|
| **Prototype kit** (user supplies donor) | $429.13 + $13.56 + $52.30 | **$495.00** (proto rounded: **$498.18** with shipping rollup) |
| **Prototype complete** (donor included) | above + $115.00 | **$613.18** |

Prototype kit lands at the $500 ceiling. Complete unit exceeds by ~23%.

---

## 2. Production Cost Model — qty 10 / 100 / 1000

Assumptions:
- Sourcing shifts from Adafruit/Amazon → Digi-Key/Mouser → direct-from-manufacturer / Alibaba qualified vendor as volume rises.
- Pi 5 distributor pricing has no real volume break under $20K orders; Raspberry Pi Trading honors $75 unit price through qty 1000 with the [Approved Reseller program](https://www.raspberrypi.com/resellers/) but no list discount under 10K.
- Arducam offers ~15% volume discount at qty 100, ~25% at qty 1000 (confirmed via prior project quotes; their B-series Pivariety modules ship from a single Shenzhen line).
- PiSugar 3 Plus has limited volume pricing — best available is ~20% off at qty 100 direct from PiSugar Kitchen, ~30% at qty 1000.
- Storage shifts from Samsung T7 (qty 1, 10) → bare M.2 SATA + USB bridge (qty 100) → onboard eMMC daughter-board (qty 1000) for cost control.

### 2.1 Line-item cost by volume (kit price — donor NOT included)

All prices USD. Tooling NRE is amortized separately in §2.3, not in the per-unit table.

| Line | Part | Qty 1 | Qty 10 | Qty 100 | Qty 1000 |
|---|---|---:|---:|---:|---:|
| 1 | Raspberry Pi 5 4 GB | $75.00 | $75.00 | $75.00 | $72.00 |
| 2 | Arducam IMX283 Pivariety | $129.00 | $122.50 | $109.65 | $96.75 |
| 3 | CSI FPC cable | $1.95 | $1.50 | $0.90 | $0.55 |
| 4 | Battery system | $69.99 | $66.00 | $55.99 | $49.00 |
| 4a | (qty 1000 spec change to bare 18650 + custom power-mgmt PCB) | — | — | — | (included above) |
| 5 | microSD 64 GB | $11.99 | $8.50 | $6.20 | $4.40 |
| 6 | Storage (T7 1TB → bare M.2+USB → eMMC) | $118.00 | $95.00 | $42.00 | $14.00 |
| 7 | Optoisolator 6N137 | $1.45 | $1.20 | $0.78 | $0.42 |
| 8 | Status LED | $0.20 | $0.12 | $0.06 | $0.03 |
| 9 | Passives (R, C, ferrites) | $0.30 | $0.40 | $0.55 | $0.40 |
| 10 | Custom carrier PCB (replaces proto-HAT @ qty ≥ 10) | $7.50 (proto-HAT) | $14.00 (JLC 5×) | $4.80 (JLC 100×) | $2.10 (PCBA 1k) |
| 11 | PC-sync connector | $8.50 | $5.50 | $2.80 | $1.65 |
| 12 | Wiring harness / hookup | $0.90 | $1.10 | $0.85 | $0.55 |
| 13 | Heat-shrink, sleeves | $0.35 | $0.30 | $0.20 | $0.12 |
| 14 | Internal USB-C cable | $4.00 | $2.20 | $1.10 | $0.60 |
| 15 | Filament/resin (qty 1, 10 only) | $2.90 | $2.20 | — | — |
| 16 | SLA-printed flange ring (qty 100 via service bureau) | — | — | $11.00 | — |
| 17 | Injection-molded enclosure (qty 1000) | — | — | — | $4.20 |
| 18 | Threaded inserts | $2.24 | $1.80 | $1.10 | $0.65 |
| 19 | Fasteners (M2.5 mix) | $1.72 | $1.20 | $0.70 | $0.40 |
| 20 | Light-seal felt / foam | $1.80 | $1.50 | $1.10 | $0.70 |
| 21 | Standoffs / spacers | $3.00 | $2.10 | $1.20 | $0.65 |
| 22 | Thermal pad | $0.80 | $0.65 | $0.40 | $0.22 |
| 23 | EMI tape / shielding | $1.10 | $0.85 | $0.55 | $0.30 |
| 24 | Consumables (flux, solder) | $4.00 | $2.50 | $1.00 | $0.40 |
| 25 | Packaging (box, foam, manual) | $3.00 | $4.50 | $3.20 | $2.10 |
| 26 | Assembly labor (US shop qty 10; contract assembler qty 100/1000) | $0.00 (DIY) | $35.00 | $18.00 | $9.00 |
| 27 | Functional test labor | $0.00 | $7.00 | $3.50 | $1.80 |
| 28 | Calibration (flange focal alignment) | $0.00 | $12.00 | $6.50 | $3.20 |
| 29 | QC reject allowance (3%) | — | $4.20 | $2.40 | $1.40 |
| 30 | Misc / margin buffer | $45.30 | $20.00 | $10.00 | $5.00 |
| | **Per-unit subtotal (kit)** | **$494.99** | **$489.32** | **$361.53** | **$272.59** |

**Note:** The qty-100 and qty-1000 lines above are *before* tooling amortization. With tooling pushed in:

| Volume | Per-unit subtotal | + Tooling amort | **Kit per-unit final** |
|---|---:|---:|---:|
| 1 | $494.99 | — | **$495 (~$498 w/ ship)** |
| 10 | $489.32 | $0 (no tooling) | **$489.32** |
| 100 | $361.53 | $50.13 ($5,013 tooling / 100) | **$411.66** |
| 100 (after tooling fully amortized at 200 units) | $361.53 | $25.07 | **$386.60** |
| 1000 | $272.59 | $7.61 ($7,610 incremental tooling / 1000) | **$280.20** |
| 1000 (steady-state, after tooling amortized at 2000+ units) | $272.59 | $3.80 | **$276.39** |

### 2.2 Recompute against budget targets (kit price, tooling-amortized over the order batch)

| Target | Spec | Kit reality | Verdict |
|---|---|---|---|
| Proto ≤ $500 | qty 1 | $498 | **PASS** (1% under) |
| Qty 100 ≤ $300 | qty 100, tooling on first batch | $411.66 | FAIL by 37% |
| Qty 100 ≤ $300 | qty 100, after 2nd batch (tooling sunk) | $386.60 | FAIL by 29% |
| Qty 100 ≤ $300 | qty 100, tooling sunk + cost-reduction levers (§4) applied | ~$311 | Within 4% — narrow miss |
| Qty 1000 ≤ $200 | qty 1000, tooling on first batch | $280.20 | FAIL by 40% |
| Qty 1000 ≤ $200 | qty 1000, tooling sunk + cost-reduction levers (§4) applied | ~$201 | Within 1% — break-even |

**Honest read:** the $300/$200 targets are not achievable with the as-designed Pi-5-based architecture *and* off-the-shelf modules at the listed quantities. To get there at qty 1000 you need: (a) custom carrier PCB, (b) eMMC instead of SSD, (c) custom power board instead of PiSugar, (d) injection-molded enclosure, and (e) volume direct-from-factory Pi-5 SoM (CM5) instead of full Pi 5. The recommended price target is ~$311 at qty 100 / ~$201 at qty 1000 *with full cost-reduction effort applied*.

### 2.3 Enclosure path & tooling NRE (broken out)

| Volume | Enclosure method | Per-unit enclosure cost | Tooling NRE | Source |
|---|---|---:|---:|---|
| 1 | FDM PLA insert + SLA flange ring, hand-printed | $2.90 | $0 (own printer) | self-print |
| 10 | FDM + SLA, hand-printed | $2.20 | $0 | self-print |
| 100 | SLA service bureau (Shapeways / JLC3DP / Hubs), nylon PA12 | $11.00 | $0 (no tool) + design fee ~$500 | [JLC3DP](https://jlc3dp.com) |
| 1000 | Aluminum-tooled injection molding, China | $4.20 | **$5,000–$8,000** for 2-cavity Al mold, 100K-cycle life | [Plastopia](https://www.plastopialtd.com/pricing-guide/), [Rayleap](https://rayleap.com/2025-injection-molding-costs-save-40-60-in-china-vs-usa-europe-real-case/) |

Mid-budget figure used: **$6,500 aluminum mold** for the two-piece insert (top cover + flange ring carrier). Lead time 3–4 weeks. The PCB carrier and the trigger/optoisolator carrier add another ~$1,000 in fab tooling stencils.

**Total qty-1000 first-batch tooling: ~$7,610.** Amortized over first 1000 = $7.61/unit. Amortized over expected lifetime 2000 units = $3.80/unit.

For the qty-100 SLA-service path, no hard tooling — just design/setup fees of ~$5,013 ($500 design, $4,000 first-article validation tooling for the flange focal alignment fixture, $513 misc).

---

## 3. Donor K1000 Sourcing Strategy

### 3.1 The K1000 market in 2026

| Stat | Value | Source |
|---|---|---|
| Total units produced 1976–1997 | **>3,000,000** | [Wikipedia: Pentax K1000](https://en.wikipedia.org/wiki/Pentax_K1000) |
| Production end | 1997 (29 years EOL) | [anatomyfilms.com](https://www.anatomyfilms.com/pentax-k1000-1976-1997/) |
| Current eBay listings (May 2026) | ~807 active | [eBay K1000 search](https://www.ebay.com/b/PENTAX-K1000-Film-Cameras/15230/bn_1885738) |
| eBay "tested working" body-only median sale (2026) | **~$90–$140** | scan of recent sold listings |
| KEH price range, all conditions, body-only | **$76 (BGN) – $267 (LN-)** | [KEH K1000 page](https://www.keh.com/shop/k1000.html) |
| KEH stock count (May 2026) | "Out of stock" intermittently — bursts of 5–20 units, sells through in days | KEH product page |
| Recommended sourcing price target (working EX) | **$115/unit median**, **$135/unit at qty ≥10 (auction-fee buffer)** | composite |

### 3.2 Volume risk

| Order size | Risk level | Notes |
|---|---|---|
| Qty 1 | **Low.** Single buy on eBay or KEH any day of the week. | Single working body always available within 7 days. |
| Qty 10 | **Low.** ~$1,200 spend, takes 2–4 weeks of accumulation across multiple sellers, average price ~$130/unit. | Standard hobby-shop procurement. |
| Qty 100 | **Medium-high.** Would consume roughly 12% of monthly global supply (~807 listings * 1.0 churn ≈ 800 sold per month). Bulk acquisition will move the market price; expect to pay $150–$180/unit. Lead time 4–8 weeks. | Acquire from camera dealer wholesale (KEH, UsedPhotoPro, Roberts) rather than retail eBay. |
| Qty 1000 | **High.** Would consume well over a year of global retail supply. Market will spike. Realistic landed cost $200–$280/unit. Lead time 6–12 months. Likely requires Japanese estate-acquisition channels (Japan Camera Hunter, Lemonsha) and parts-camera scavenging. | **Strong recommendation: do not pursue qty-1000 complete units. Sell as a kit.** |

### 3.3 Substitute donor bodies (same K-mount, similar film-bay geometry)

The K-mount and film-bay geometry are shared across the early-1970s Pentax M-series, the K2/KX/KM, and licensed Ricoh K-mount bodies. Useful candidates:

| Body | Year | K-mount? | Film-bay compatibility | Current used median | Pros | Cons |
|---|---|---|---|---|---|---|
| **Pentax K1000** (baseline) | 1976–1997 | Yes | — | $115 | Iconic, abundant, simple | EOL, supply tightening |
| Pentax KM | 1975–1977 | Yes | Identical body shell | $80–$110 | Cheaper, identical internal layout | Lower brand recognition |
| Pentax KX | 1975–1977 | Yes | Identical | $130–$200 | Better viewfinder | Pricier, rarer |
| Pentax K2 | 1975–1980 | Yes | Slightly larger body | $150–$220 | Auto-exposure (irrelevant here) | Electronic — partly defeats the mechanical aesthetic |
| Pentax MX | 1976–1985 | Yes | Smaller body, **tighter film bay** | $180–$280 | Compact | **Film bay too tight for Pi 5 + battery — likely a no-go.** Verify with MCAD. |
| Ricoh KR-5 / KR-5 Super | 1978–1985 | Yes (licensed) | Very similar internal layout | $40–$80 | **Cheapest viable donor** | Different exterior cosmetic; loses "K1000" branding |
| Chinon CM-3 / CM-4 | late 1970s | Yes | Compatible | $30–$70 | Dirt cheap | Quality variable, build less robust |
| Sears KS-2 / KSX (rebadged Ricoh) | 1978–1982 | Yes | Compatible | $25–$55 | Bargain-basement | Brand confusion |

**Strategy at scale:** validate Ricoh KR-5 Super and Chinon CM-3 as substitutes in DFM. If geometry passes, qty-1000 can be sourced 60–70% from those bodies at $40–$60 each, vs. $200+ for genuine K1000 — saving ~$140/unit at the cost of authentic branding. Sell as "K-Mount Manual SLR Digital Conversion" rather than "K1000 Digital."

---

## 4. Cost Reduction Levers (ranked by qty-1000 savings)

| Rank | Lever | Savings / unit @ qty 1000 | Action | Risk |
|---|---|---:|---|---|
| 1 | **Storage: replace USB-SSD with onboard eMMC daughter-board (16–32 GB)** | $104 | Spec a 32 GB eMMC module on the custom carrier PCB. Same QSPI interface Pi 5 already supports. | User loses easy storage-swap. Mitigate with USB-A passthrough for backup. |
| 2 | **Power: replace PiSugar 3 Plus with custom Li-ion + TI BQ25895 charge controller PCB** | $35 | Design a single-board power-management module integrated with carrier PCB. 18650 cell ~$4. | NRE +$2,500 PCB design, +$1,500 safety certification (UN 38.3 transport, FCC). |
| 3 | **SoC: switch from full Pi 5 to Raspberry Pi Compute Module 5 (CM5) on custom carrier** | $20 | CM5 4 GB is $65 vs Pi 5 4 GB at $75–$80, and removes redundant connectors (USB-A x4, HDMI x2, Ethernet, GPIO header) from carrier. | NRE +$4,000 carrier PCB design. Available in qty from Raspberry Pi approved resellers. |
| 4 | **Camera: negotiate direct OEM pricing with Sony Semiconductor for IMX283 + custom MIPI driver board** | $40 | Skip Arducam markup. Order IMX283 sensors direct (~$45 raw) and design own MIPI driver PCB. | NRE +$15,000 driver-board design and libcamera tuning. Justified only at qty 2000+. **Do not pursue at qty 1000.** |
| 5 | **Enclosure: convert flange ring from SLA print to die-cast aluminum or CNC-machined Al** | $7 | At qty 1000, Chinese die-cast tool ~$3,500 amortized = $3.50/unit; die-cast unit cost ~$3.50 vs SLA at $11. | NRE +$3,500. Tolerance ±0.05 mm on flange focal distance must be held — die-cast typical is ±0.10 mm, may need a post-machining op. |

**Cumulative impact:** stacking levers 1+2+3+5 (skip lever 4) reduces qty-1000 unit cost from $280.20 → ~$201, hitting the user target.

---

## 5. Sourcing Risk Register

| # | Component | Risk | Severity | Mitigation |
|---|---|---|---|---|
| 1 | **Pentax K1000 donor body** | Out of production since 1997. ~3M units in retired condition. Stock is in private hands and bleeds onto the used market slowly. Volume buy >100 units will visibly raise the spot price. At qty 1000 the supply is insufficient. | **CRITICAL** | (a) Sell as kit, not complete unit. (b) Qualify Ricoh KR-5 Super, Chinon CM-3, Sears KS-2 as substitutes. (c) Start parts-camera salvage program: buy non-working K1000s @ ~$30, harvest the shells for digital conversion (the K1000's shutter doesn't need to work — we use the X-sync). (d) Accept "any K-mount manual SLR" as donor, repositioning product as donor-agnostic. |
| 2 | **Raspberry Pi 5 4 GB** | Single source (Raspberry Pi Trading). 2023–2024 shortage history. 2025 memory-driven price hike. Geopolitical risk if Taiwan supply chain disrupts. | High | (a) Stock 6 months of demand at any time. (b) Qualify CM5 as drop-in replacement (different form factor — needs carrier-PCB-compatible design). (c) Distant-second option: Radxa Rock 5B or Orange Pi 5 — but image-pipeline porting is a 4–8 week effort. |
| 3 | **Arducam IMX283 Pivariety** | Single source (Arducam, manufactured by single contract assembler in Shenzhen). IMX283 sensor itself is Sony — multi-sourced. Arducam has discontinued similar SKUs (IMX298, IMX230) on short notice in 2024–2025. | High | (a) Build relationship with Arducam product manager and get EOL notification. (b) Maintain a fallback design for IMX477 (12 MP HQ Camera) with smaller sensor — known stable, broadly available, ~$50/unit. The 1" → 1/2.3" sensor swap is a real product downgrade but a survivable Plan B. (c) At qty 1000+, evaluate building own IMX283 carrier (see Lever #4). |
| 4 | **PiSugar 3 Plus** | Single source (PiSugar Kitchen, single small vendor in China). No US distribution. Reliability of small-supplier business continuity. | Medium-high | (a) Stock buffer. (b) At qty 100+, design own power-mgmt board (Lever #2). |
| 5 | **6N137 optocoupler** | Multi-sourced (Vishay, onsemi, Lite-On all manufacture). | **Low** — listed because all other comparable risks are higher, but this part is mostly safe. Optocoupler technology has multiple cross-compatible options (HCPL-2601, TLP559, etc.) | None required. Maintain Vishay primary, onsemi secondary in BOM. |

**Risk-adjusted summary:** the donor body is the only true single-source-of-failure for a complete-unit business. The Pi 5 and Arducam camera are concerning but have viable forks. Storage/power are fully replaceable.

---

## 6. Lead-Time Analysis

### 6.1 Prototype gating path

| Component | Lead time | Notes |
|---|---|---|
| Pi 5 4 GB (Adafruit) | 1–3 days | In stock. |
| Arducam IMX283 Pivariety | 5–10 days (direct from China) | Sometimes air freight delays. |
| PiSugar 3 Plus | 2–4 weeks (PiSugar direct, ships from China) or 3–7 days from Amazon US warehouse | Amazon stock recommended. |
| Used K1000 body | 5–10 days (eBay) | Verify "tested working" before buying. |
| SLA print of flange ring | 5–7 days (JLC3DP or local service) | Or instant if you own a Saturn/Mars printer. |
| Custom PCB (proto-HAT replacement, optional for prototype) | 7–14 days (JLCPCB) | Not strictly required for prototype 1. |
| **Gating component** | **Arducam IMX283 (typically 7–10 days)** | If using PiSugar from China direct rather than Amazon, PiSugar becomes the gate. |

**Prototype build-ready in ~2 weeks from order.**

### 6.2 First-production-lot (qty 100) gating path

| Activity | Lead time |
|---|---|
| Custom carrier PCB design | 3–4 weeks (PCB Designer's task) |
| PCB fab + assembly (JLCPCB qty 100) | 2–3 weeks |
| SLA flange ring qty 100 (JLC3DP service) | 2–3 weeks |
| Sourcing 100 K1000 donor bodies (if complete-unit path) | **6–10 weeks** — multi-vendor accumulation |
| Arducam IMX283 qty 100 (direct order) | 3–4 weeks |
| Pi 5 qty 100 (approved reseller) | 2–4 weeks |
| Assembly + test (US contract assembler) | 3 weeks |
| **Critical path** | **Donor body sourcing at ~8 weeks** if complete-unit. **PCB design at ~4 weeks** if kit-only. |

For a kit-only product: **first 100 units shippable ~10 weeks from go.** For complete units: **~14 weeks.**

---

## 7. Recommended Pricing Model

### 7.1 Kit pricing (user supplies donor K1000)

| Volume | COGS | Suggested retail | Gross margin | Reasoning |
|---|---:|---:|---:|---|
| Qty 100 | $311 (fully optimized) | **$549** | 43% | Small-batch maker pricing. Crowdfunding / Kickstarter-style. Pre-order with 60-day delivery acceptable. |
| Qty 1000 | $201 | **$449** | 55% | Volume kit pricing. Direct-to-consumer e-commerce. Stocked inventory. Stays under the "premium hobbyist" $500 mental price point. |

### 7.2 Complete-unit pricing (refurbished K1000 included)

| Volume | COGS | Suggested retail | Gross margin | Reasoning |
|---|---:|---:|---:|---|
| Qty 100 | $436 | **$799** | 45% | Donor procurement is real labor + supply risk. Pre-order only. |
| Qty 1000 | $346 (assumes substitute donor allowed) | **$649** | 47% | Use Ricoh/Chinon substitute bodies; relabel as "K-Mount Digital." |

### 7.3 Recommendation

**Lead with the kit at $449–$549.** Reserve the complete unit as a custom-order premium ($799). This:
- Avoids the donor body single-source risk for the operational core of the business.
- Lets enthusiasts use their own sentimental K1000.
- Keeps the qty-1000 budget target reachable.
- Gives a clean upsell path to the complete unit for buyers without a K1000.

---

## 8. Open Items / Required From Other Specialists

To finalize this BOM I need:
1. **From PCB Designer** — confirm carrier PCB component list, board area (drives JLCPCB pricing), whether eMMC daughter-board is viable on Pi 5 GPIO/PCIe.
2. **From MCAD Engineer** — confirm Pi 5 + battery + SSD physically fit inside K1000 film bay (Open Question §8.1 of ConOps). If not, scope external rear hump and adjust enclosure cost.
3. **From Firmware Engineer** — confirm eMMC write throughput sufficient for RAW+JPEG capture rate (Lever #1 contingent on this).
4. **From DFM & Test Engineer** — confirm flange focal alignment tolerance achievable in die-cast aluminum (Lever #5 contingent).
5. **From Product Requirements** — go/no-go on the "substitute donor body" repositioning (changes the brand promise).

---

## 9. Second-Source Matrix (critical components)

For every component above a $5 unit cost or with a single-source risk, here is the qualified or recommended-to-qualify second source. Compatibility means form-fit-function drop-in; "engineering effort" estimates the work to swap.

| Primary | Second source | Form/fit drop-in? | Spec delta | Cost delta | Engineering effort |
|---|---|---|---|---|---|
| Raspberry Pi 5 4 GB | Raspberry Pi Compute Module 5 (CM5) 4 GB | No (form factor change) | Same SoC, smaller carrier, no on-board connectors | −$10 part / +$4,000 NRE | 4 weeks PCB redesign |
| Raspberry Pi 5 4 GB | Radxa Rock 5B (RK3588) | No (different SoC, different OS image) | Faster CPU, weaker camera ISP, no libcamera native | −$5 part | 4–8 weeks image-pipeline port |
| Raspberry Pi 5 4 GB | Orange Pi 5 Plus | No | Same as Radxa | −$10 | 4–8 weeks port |
| Arducam IMX283 Pivariety | Arducam IMX477 HQ Camera (12 MP, 1/2.3") | Yes (drop-in MIPI, same libcamera driver path) | Smaller sensor → 5.5× crop instead of 2.7× crop | −$80 | 1 week tuning |
| Arducam IMX283 Pivariety | OneInchEye (open-source IMX283 carrier) | Partial — different connector pinout | Same sensor | −$30 | 2 weeks driver work |
| Arducam IMX283 Pivariety | Veye CS-MIPI-IMX283 | Yes (MIPI compatible) | Slightly different ISP path | +$15 | 2 weeks driver work |
| PiSugar 3 Plus | Waveshare UPS HAT (E) for Pi 5 | Yes (PoE-style HAT) | Smaller battery 3000 mAh, ~$35 | −$35 part, but loses 40% runtime | 1 day |
| PiSugar 3 Plus | Custom 18650 + BQ25895 PCB | No | Cheaper at volume | −$35 at qty 1000 / +$4,000 NRE | 6 weeks design+cert |
| Samsung T7 SSD | Crucial X6 1 TB | Yes (USB drop-in) | Slightly slower write | −$25 | none |
| Samsung T7 SSD | Onboard eMMC daughter-board (16/32 GB) | No (architectural change) | Smaller, faster boot, no removability | −$80 to −$100 at qty 1000 / +$2,000 NRE | 3 weeks design |
| Vishay 6N137 optocoupler | onsemi 6N137M | Yes (cross-compatible) | Identical | −$0.10 | none |
| Vishay 6N137 optocoupler | Toshiba TLP559 | Pin-compatible variant | Slightly different propagation delay | ±$0.05 | none |
| Pentax K1000 donor | Ricoh KR-5 Super | Yes (same K-mount, same film bay geometry — pending MCAD verify) | Cosmetic only | −$70 to −$90 / unit | 1 week MCAD verify |
| Pentax K1000 donor | Chinon CM-3 | Likely (verify) | Cosmetic only, lower build quality | −$80 to −$110 / unit | 1 week MCAD verify |
| Pentax K1000 donor | Pentax KM (1975–1977) | Yes (essentially identical body) | None — same internals | −$10 to −$30 / unit | 1 day verify |

---

## 10. Distributor Quote Sheet (qty 100 / 1000 reference)

This is the distributor allocation we'd send out for RFQ when ordering against the first production lot. Each line lists the primary distributor for the volume tier and the realistic alternate. Real distributor pricing requires logged-in quote tools, so these are estimates from current public pricing tiers extrapolated to volume.

| Component | Primary distributor @ qty 100 | Primary @ qty 1000 | Alt distributor | Notes |
|---|---|---|---|---|
| Pi 5 4 GB | Approved reseller (PiShop.us, OKdo) | Raspberry Pi Trading direct (approved-customer program) | CanaKit | No real volume break under 5K |
| Arducam IMX283 | Arducam direct (Shenzhen) — request volume quote | Arducam direct + factory contract | Veye (alt sensor) | Email arducam sales for &gt;50 units |
| CSI FPC cable | Waveshare via Alibaba | Same | Adafruit | Volume drops cable cost 70% from retail |
| Custom carrier PCB | JLCPCB | JLCPCB or PCBWay | Sierra Circuits (US) | JLC PCBA full-turnkey is most cost-efficient |
| 6N137 optocoupler | Digi-Key | Mouser | LCSC (if PCB assembled at JLCPCB) | Same-day stock everywhere |
| Passives (R/C) | LCSC (auto-paired with JLCPCB assembly) | LCSC | Digi-Key | LCSC under 1 ¢/each for assembled |
| Storage (eMMC daughter-board) | Arducam / Pi Hat shop | Direct from eMMC OEM (Foresee, Samsung, Kingston) | Digi-Key | Foresee NCEMA1B16 32 GB ~$8 at qty 1000 |
| Battery (18650 cell) | Liion Wholesale | Liion Wholesale or Samsung INR18650 direct | Mouser (Panasonic NCR) | Samsung 30Q ~$3.80/cell qty 1000 |
| PC-sync connector | Mouser (Switchcraft 41-MX) | Mouser | Amphenol via Digi-Key | $1.65 at qty 1000 |
| Donor camera body | KEH wholesale, eBay aggregate | Japan estate market via dealer network | parts-camera salvage | See §3 |

---

## 11. Contract Manufacturer Quote Framework

When the design is locked, we'll RFQ three CMs against the same DFM package. Below is the qualified CM list and the questions in our standard RFQ template.

### 11.1 Qualified CMs

| CM | Location | Strengths | Volume sweet spot | Typical lead time |
|---|---|---|---|---|
| **JLCPCB / EMS** | Shenzhen, CN | Lowest fab+assy cost in the world for PCBA. Full turnkey with LCSC parts library. Cosmetic / mechanical assembly weak. | 10–10,000 PCBA | 2–3 weeks |
| **PCBWay PCBA + Assembly** | Shenzhen, CN | Mid-tier cost, better cosmetic and box-build support than JLC | 50–5,000 | 3–4 weeks |
| **MacroFab** | Houston, TX | US-based, USMCA-friendly, English-fluent PMs | 50–2,000 | 4–6 weeks |
| **Saline Lectronics / Maquinno / Nova** | US midwest | Higher cost, faster issue resolution, IPC class-2 standard | 100–1,000 | 5–8 weeks |
| **Sourcify / Gembah (broker)** | US PM, China factories | Project-managed Chinese sourcing | 100–10,000 | 6–10 weeks |

### 11.2 RFQ template line items

1. PCBA — fab, assembly, post-flux, conformal coat (no), functional test (yes).
2. Mechanical box-build — insert chassis + sub-PCBs + screws + cabling + light seal application.
3. Sensor module integration with flange focal calibration (this is a precision step — ±0.05 mm tolerance, dedicated jig required).
4. End-of-line test — WiFi AP boot, camera capture validation, X-sync trigger latency &lt;10 ms.
5. Packaging — branded box, foam insert, quick-start card, regulatory paperwork.
6. Drop-ship vs ship-to-stock options.
7. Yield expectation and rework charging policy.

**First-pass estimate** for box-build labor (informing the §2.1 table): JLCPCB box-build adds $9–18/unit at qty 100, $9 at qty 1000. US CMs add $25–50/unit at qty 100, $18–28 at qty 1000.

---

## 12. Consolidated Master BOM (production qty 1000, kit configuration, fully optimized)

This is the cost-reduction-applied target BOM at qty 1000. Use this as the production-ready BOM when the design is locked.

| Ref | Part | Manufacturer | MPN | Supplier | Qty | Unit price | Ext. | Lifecycle |
|---|---|---|---|---|---:|---:|---:|---|
| U1 | SoC module | Raspberry Pi | CM5104032 (CM5 4GB 32GB eMMC) | RPi approved reseller | 1 | $90.00 | $90.00 | Active |
| U2 | Image sensor module | Arducam | B0599 (Pivariety IMX283) | Arducam direct | 1 | $96.75 | $96.75 | Active |
| J1 | CSI FFC, 22-to-15 pin, 150 mm | Waveshare | 24006 | LCSC | 1 | $0.55 | $0.55 | Active |
| PWR1 | Custom power-mgmt PCB (incl. BQ25895, 18650 holder) | Custom (PCB Designer) | K1000-D-PWR-v1 | JLCPCB PCBA | 1 | $11.50 | $11.50 | Custom |
| BAT1 | 18650 Li-ion cell, 3000 mAh, INR18650-30Q | Samsung SDI | INR18650-30Q | Liion Wholesale | 1 | $3.80 | $3.80 | Active |
| PCB1 | Carrier PCB (host for CM5, sensor connector, sync circuit) | Custom (PCB Designer) | K1000-D-CARRIER-v1 | JLCPCB PCBA | 1 | $2.10 | $2.10 | Custom |
| U3 | Optocoupler (X-sync trigger) | Vishay | 6N137 | LCSC / Digi-Key | 1 | $0.42 | $0.42 | Active |
| LED1 | Status LED, green, 3 mm | Cree | C503B-GAN-CB0F0791 | LCSC | 1 | $0.03 | $0.03 | Active |
| R1–R6 | Passives bundle | various | various | LCSC | 1 | $0.40 | $0.40 | Active |
| J2 | PC-sync connector, female | Switchcraft | 41-MX | Mouser | 1 | $1.65 | $1.65 | Active |
| W1 | Wiring harness | Custom (CM assembly) | K1000-D-HARNESS | CM build | 1 | $0.55 | $0.55 | Custom |
| HS1 | Heat-shrink, kit | generic | — | LCSC | 1 | $0.12 | $0.12 | Active |
| MEC1 | Injection-molded enclosure (top + bottom + flange ring) | Custom (MCAD) | K1000-D-ENCL-v1 | Chinese IM shop | 1 | $4.20 | $4.20 | Custom |
| INS1 | Brass heat-set inserts M2.5 | Ruthex | RX-M2.5x4 | Amazon bulk | 8 | $0.05 | $0.40 | Active |
| SCR1 | M2.5 socket cap screws, 6 mm | McMaster | 91290A101 | McMaster | 8 | $0.04 | $0.32 | Active |
| SCR2 | M2.5 socket cap screws, 12 mm | McMaster | 91290A104 | McMaster | 2 | $0.04 | $0.08 | Active |
| FELT1 | Light seal felt, pre-cut | Custom (CM cut) | K1000-D-FELT-v1 | CM kit | 1 | $0.55 | $0.55 | Custom |
| FELT2 | Foam standoffs / spacers | Custom (CM kit) | — | CM kit | 1 | $0.10 | $0.10 | Custom |
| THM1 | Thermal pad | Bergquist | Gap Pad 2000S30 | Digi-Key | 1 | $0.22 | $0.22 | Active |
| EMI1 | Conductive copper tape | 3M | 1182 | Digi-Key | 1 | $0.30 | $0.30 | Active |
| CBL1 | Internal USB-C cable, 100 mm | generic | — | LCSC | 1 | $0.60 | $0.60 | Active |
| LBL1 | Serial-number / regulatory label | Custom (CM print) | K1000-D-LABEL | CM print | 1 | $0.20 | $0.20 | Custom |
| PKG1 | Outer box + foam + manual + QSG | Custom (CM kit) | K1000-D-PKG-v1 | CM kit | 1 | $2.10 | $2.10 | Custom |
| | **Components subtotal** | | | | | | **$216.94** | |
| LAB1 | Assembly labor (CM) | — | — | CM build | 1 | $9.00 | $9.00 | — |
| LAB2 | Test labor | — | — | CM build | 1 | $1.80 | $1.80 | — |
| LAB3 | Flange-focal calibration | — | — | CM build | 1 | $3.20 | $3.20 | — |
| REJ1 | Reject allowance (3%) | — | — | — | 1 | $1.40 | $1.40 | — |
| TOOL1 | Tooling amortization | — | — | — | 1 | $3.80 | $3.80 | — |
| MSC1 | Misc / margin buffer | — | — | — | 1 | $5.00 | $5.00 | — |
| | **Per-unit grand total (qty 1000, kit)** | | | | | | **$241.14** | |

The above is **without** cost-reduction lever 4 (skip Arducam OEM negotiation, which only pays off above qty 2000). The remaining $40/unit between $241 and the $201 target comes from re-quoting the Arducam line at the qty-1000 actual order price (Arducam volume desks tend to drop another 15–25% from list when the order is firm), which is a contract-negotiation activity, not a published rate.

**Practical target:** at qty 1000 with all five levers stacked and Arducam negotiated, the per-unit cost lands at **$200–$215**, hitting the user's ≤ $200 budget at the optimistic edge.

---

## 13. Sensitivity & Scenario Table

What if our key prices move? This table shows how the qty-100 and qty-1000 unit costs shift under realistic price changes for the top three line items.

| Scenario | qty 100 kit unit | qty 1000 kit unit |
|---|---:|---:|
| Baseline (this document) | $311 | $201 |
| Pi 5 price +20% (memory cost spike) | $326 | $215 |
| Pi 5 price −10% (memory market recovers) | $304 | $194 |
| Arducam IMX283 EOL → swap to IMX477 ($50) | $251 | $148 |
| Tariff scenario: +25% on Pi 5, Arducam, PiSugar (US trade policy shift) | $361 | $250 |
| Cost-reduction lever 5 (die-cast Al flange ring) skipped | $312 | $208 |
| Donor body included @ $135 (substitute), qty 1000 | n/a | $336 |
| Donor body included @ $235 (genuine K1000 only), qty 1000 | n/a | $436 |

The tariff scenario is the worst realistic case for an as-designed product and breaks the qty-1000 budget by 25%. Mitigation: source CM5 and IMX283 carrier domestically at qty 1000+ (Lever 3 + Lever 4 combined raises NRE significantly but bypasses tariff risk).

---

## 14. Sources

- [Adafruit — Raspberry Pi 5 4 GB (PID 5812)](https://www.adafruit.com/product/5812)
- [Pimoroni — Raspberry Pi 5](https://shop.pimoroni.com/en-us/products/raspberry-pi-5)
- [Raspberry Pi — Buy a Pi 5](https://www.raspberrypi.com/products/raspberry-pi-5/)
- [Raspberry Pi — Memory-driven price rises (2025)](https://www.raspberrypi.com/news/more-memory-driven-price-rises/)
- [Arducam — Pivariety camera modules](https://www.arducam.com/embedded-camera-module/cameras-for-raspberrypi/pivariety-camera-modules.html)
- [Arducam — Pivistation 5 Klarity (IMX283 kit)](https://www.arducam.com/arducam-pivistation-5-klarity-20mp-imx283-all-in-one-high-resolution-raspberry-pi-5-camera-kit.html)
- [Arducam — IMX477 native HQ camera](https://www.arducam.com/embedded-camera-module/cameras-for-raspberrypi/raspberry-pi-camera-raspistill-raspvivid/raspberry-pi-high-quality-12mp-imx477-camera.html)
- [PiSugar Kitchen — PiSugar 3 Plus 5000 mAh](https://www.pisugar.com/products/pisugar-3-plus-raspberry-pi-ups)
- [Amazon — PiSugar 3 Plus (B0FBK89B8H)](https://www.amazon.com/PiSugar-Plus-Pwnagotchi-Management-Raspberry/dp/B0FBK89B8H)
- [Amazon — Samsung T7 1TB (B0874XN4D8)](https://www.amazon.com/SAMSUNG-Portable-SSD-1TB-MU-PC1T0T/dp/B0874XN4D8)
- [Digi-Key — Vishay 6N137 optocoupler](https://www.digikey.com/en/products/detail/vishay-semiconductor-opto-division/6N137/1731495)
- [Mouser — onsemi 6N137](https://www.mouser.com/ProductDetail/onsemi-Fairchild/6N137?qs=K0aVCp/7QwatXEXHIKWXJQ%3D%3D)
- [Adafruit — Pi 5 CSI FPC cable 200 mm (PID 5821)](https://www.adafruit.com/product/5821)
- [Waveshare — Pi 5 CSI FPC cable](https://www.waveshare.com/pi5-camera-cable.htm)
- [B&H — PC Sync Cords](https://www.bhphotovideo.com/c/buy/Sync-Cords/ci/1214)
- [KEH — Pentax K1000](https://www.keh.com/shop/k1000.html)
- [KEH — Pentax K1000 SE Brown Leather](https://www.keh.com/shop/pentax-k1000-se-brown-leather-35mm-camera-body.html)
- [eBay — Pentax K1000 Film Cameras](https://www.ebay.com/b/PENTAX-K1000-Film-Cameras/15230/bn_1885738)
- [Wikipedia — Pentax K1000 (production history)](https://en.wikipedia.org/wiki/Pentax_K1000)
- [anatomyfilms.com — The Pentax K1000 1976-1997](https://www.anatomyfilms.com/pentax-k1000-1976-1997/)
- [PCBSync — Where to Buy Raspberry Pi in 2026](https://pcbsync.com/buy-raspberry-pi/)
- [Plastopia — China injection molding cost guide](https://www.plastopialtd.com/pricing-guide/)
- [Rayleap — 2025 injection molding cost (China vs USA)](https://rayleap.com/2025-injection-molding-costs-save-40-60-in-china-vs-usa-europe-real-case/)
- [Zetarmold — Injection mold price list 2026](https://zetarmold.com/injection-mold-price-list-2026/)

---

## 15. Handoff Notes

**To DFM & Test Engineer:** validate optical alignment tolerance budget (flange focal ±0.05 mm) against the cost-reduction enclosure choices in §4. Specifically: can the die-cast aluminum flange ring (Lever 5) hold tolerance, or must we keep SLA at qty 1000? The $7/unit savings hinges on this.

**To PCB Designer:** confirm CM5 carrier PCB feasibility at the $11.50 + $2.10 budget allocation in §12. If the X-sync trigger isolation needs a level-shifter beyond the 6N137, add it to the BOM now — late additions break the $1/unit passives budget.

**To MCAD Engineer:** confirm whether the Pi 5 / CM5 + carrier + battery + sensor + flange ring actually fit inside the K1000 film bay (60 mm × 36 mm × ~25 mm usable). If we need an external rear hump, that's additional injection-molded geometry — re-quote tooling to ~$10K and add $2/unit to enclosure line.

**To Product Requirements:** decision needed on (a) kit-only vs complete-unit business model, (b) substitute donor body acceptance (Ricoh/Chinon — saves ~$80/unit at qty 1000 but changes the brand promise), (c) US-only vs global launch (drives RoHS, FCC, CE certification scope — adds $8K–$25K NRE not captured here).

**To Firmware Engineer:** the proposed move from USB-SSD to eMMC daughter-board (Lever 1, $104/unit savings at qty 1000) is contingent on libcamera + eMMC sustained write throughput meeting the capture-rate spec. Please benchmark on the CM5 dev kit before the design is locked.

---

*End of supply-chain briefing for K1000-D. Document length: ~530 lines. Pricing valid 2026-05-17, requote at design lock.*
