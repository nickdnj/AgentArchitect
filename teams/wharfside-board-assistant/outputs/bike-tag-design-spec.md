# Wharfside Manor Bike Tag — Design Specification

**Date:** 2026-03-31
**Status:** Draft for Board Review
**Author:** Nick DeMarco / Board Assistant

---

## 1. Overview

A weather-resistant adhesive sticker for registering bicycles stored on Wharfside Manor property. Each sticker contains a QR code that encodes both the asset type (bike) and tag number, enabling instant identification via TagSmart scanning.

## 2. Color Selection

| Tag Type | Physical Color | Status |
|----------|---------------|--------|
| Reserved Parking | **Red** | Existing |
| Non-Reserved Parking | **Green** | Existing |
| Visitor Parking | **Yellow** | Existing |
| Marina Parking | **Blue** | Existing |
| **Bike** | **Purple** | **NEW** |
| Fob | *(none — chip only)* | Existing |

**Why Purple:**
- Distinct from all 4 existing parking tag colors (red, green, yellow, blue)
- Fobs have no physical color (they're numbered chips), so purple is available
- High visibility against most bike frame colors (black, silver, white)
- Professional, distinctive appearance

**Pantone:** PMS 2685 C (vivid purple) — `#7B2D8E`
**Background:** `#7B2D8E` (purple)
**Text/borders:** `#FFFFFF` (white)
**QR code:** Black on white square (for scan reliability)

## 3. Physical Dimensions

```
┌───────────┐
│   WMCA    │  ← 35mm wide
│   BIKE    │
│ ┌───────┐ │
│ │  QR   │ │  ← 25mm x 25mm QR code
│ │ 25x25 │ │
│ └───────┘ │
│   0001    │
│           │  ← 50mm tall
└───────────┘

Portrait orientation (taller than wide)
```

**Size:** 35mm wide × 50mm tall (~1.4" × 2.0")
**Shape:** Rounded rectangle (3mm corner radius)
**Material:** Vinyl with UV-resistant laminate (outdoor-rated, waterproof)
**Adhesive:** Permanent acrylic (bonds to metal, carbon fiber, painted surfaces)
**Tamper-evident:** Yes — destructible/eggshell vinyl that fragments on removal (non-transferable)

**Why this size:**
- 25mm QR code is the centerpiece — large enough for reliable scanning even with wear
- 35mm width provides ~5mm padding on each side of the QR (quiet zone + border)
- 50mm height accommodates WMCA header + QR + tag number vertically
- Portrait orientation fits naturally on a bike tube
- Compact enough not to obstruct or look ugly

## 4. Sticker Layout

```
┌───────────────┐
│     WMCA      │  ← White bold text on purple
│     BIKE      │  ← Smaller, lighter
│  ┌─────────┐  │
│  │ ▓▓▓▓▓▓▓ │  │
│  │ ▓ QR  ▓ │  │  ← 25mm x 25mm, black on white
│  │ ▓▓▓▓▓▓▓ │  │
│  └─────────┘  │
│     0001      │  ← Large white bold tag number
└───────────────┘
   Purple bg (#7B2D8E)
```

### Layout Zones (top to bottom):

**Header zone:**
- "WMCA" (bold, 10pt, white, letter-spaced)
- "BIKE" (regular, 6pt, white, 50% opacity)

**QR zone (center):**
- 25mm × 25mm QR code on white square
- ~3mm quiet zone on each side
- Black modules on white background (maximum contrast)
- Error correction Level H (30% recovery)

**Footer zone:**
- Tag number "0001" (bold, 14pt, white, letter-spaced)
- Tiny "Registered Bicycle" text (4pt, white, 50% opacity)

## 5. Placement Guide

### Diamond Frame (Men's / Traditional)

```
    Saddle
      │
      │ ← Seat post
    ┌─┤
    │ │ ← SEAT TUBE ★ Primary placement
    │ │
    ├─┘
   / \
Chainstay  Down tube
```

**Primary:** Seat tube, upper third (just below where the seat post enters)
**Why:** Visible when bike is in rack, accessible for scanning, protected from chain/tire splatter

### Step-Through Frame (Women's / Dutch / Comfort)

```
    Saddle
      │
      │ ← Seat post
    ┌─┤
    │ │ ← SEAT TUBE ★ Primary placement
    │ │
    ├─┘
    │
    curved down tube
```

**Primary:** Seat tube, upper third (same position as diamond frame)
**Why:** The seat tube exists on ALL frame types — it's the universal mounting point

### Alternative Placement (if seat tube is obstructed)

**Secondary:** Down tube, upper section near head tube
**Tertiary:** Seat post (if metal, not carbon fiber)

### Placement Rules
1. Clean surface with isopropyl alcohol before applying
2. Apply to a FLAT section of tube (avoid curves/welds)
3. Press firmly for 30 seconds, especially edges
4. Allow 24 hours for full adhesive cure
5. QR code must face outward (away from frame center) for scanning access
6. Do NOT apply over cable housings, bolt holes, or water bottle mounts

## 6. QR Code Encoding

### Format

```
WM-BK-0001
```

| Field | Value | Purpose |
|-------|-------|---------|
| `WM` | Wharfside Manor | Identifies the community (prevents confusion with other tags) |
| `BK` | Bike | Asset type identifier |
| `0001` | Zero-padded 4-digit | Tag number (0001-9999) |

**Separator:** Hyphen (`-`)
**Full example values:** `WM-BK-0001`, `WM-BK-0042`, `WM-BK-0150`

### QR Code Parameters
- **Version:** 2 (25×25 modules) — sufficient for 10-character payload
- **Error correction:** Level H (30% recovery) — critical for outdoor use with scratches/dirt
- **Module size:** ~0.7mm at 18mm code size
- **Quiet zone:** 4 modules (standard) = ~2.8mm white border

### TagSmart Integration

**Current behavior:** TagSmart scanner strips "SN" prefix → looks up tag number → user selects type.

**Required update for bike tags:** Parse the `WM-XX-NNNN` format:
1. Scanner reads QR → gets `WM-BK-0042`
2. Parse prefix: `WM` = Wharfside tag (valid)
3. Parse type: `BK` = bike → `asset_type = 'bike'`
4. Parse number: `0042` → `tag_number = 42`
5. Auto-lookup: skip type selector, go directly to asset detail

**Type prefix mapping (extensible):**
| Prefix | Asset Type |
|--------|-----------|
| `SN` | Legacy (requires manual type selection) |
| `RD` | reserved |
| `GN` | non-reserved |
| `YL` | visitor |
| `BL` | marina |
| `BK` | bike |
| `FB` | fob |

> **Note:** Existing parking tags still use "SN" prefix. The `WM-XX-NNNN` format is for new tags going forward. TagSmart should support both formats.

## 7. Tag Numbering

**Range:** BK-0001 through BK-9999
**Starting number:** 0001
**Allocation per handbook:**
- 1-bedroom units: up to 2 bikes
- 2-bedroom units: up to 3 bikes

**Estimated initial run:** 500 stickers (BK-0001 through BK-0500)
- 116 units × ~2 bikes average = ~230 potential bikes
- 500 provides ample supply for initial registration + replacements over time
- Per Thomas Bopp's recommendation (April 2026)

## 8. Production Specifications

### Material
- **Substrate:** White **destructible / tamper-evident vinyl** (eggshell type, 3.4 mil / 86 micron)
- **Finish:** Matte UV laminate overlay (prevents glare that could interfere with QR scanning)
- **Adhesive:** Permanent acrylic, rated for outdoor use
- **Tamper-evident:** Sticker must fragment on removal — cannot be peeled off intact and transferred to another bike. This is a **mandatory** requirement.
- **Expected life:** 3-5 years outdoor exposure

### Print Method
- **Recommended:** Digital die-cut vinyl stickers
- **Color:** CMYK process (orange + black + white)
- **QR codes:** Must be printed at minimum 300 DPI for reliable scanning

### Vendor Options
- StickerMule, StickerGiant, or similar custom sticker vendor
- Quantity pricing typically drops significantly at 250+ units
- Request a proof sheet before full run

## 9. Registration Workflow

1. Owner requests bike tag at board/management office
2. Staff assigns next available tag number in TagSmart
3. Staff records: unit number, owner name, bike description (make, model, color)
4. Owner receives sticker + placement instructions
5. Owner applies sticker to seat tube
6. Staff/security can scan QR with TagSmart to verify registration

## 10. Enforcement Integration

Per the 2025 Handbook:
> "Excess or unmarked bikes will be removed and donated to charity."

**With bike tags:**
- Security walks bike rooms/racks periodically
- Scan each bike's QR tag → TagSmart confirms registration
- Untagged bikes get a warning notice (zip-tied to handlebars)
- After notice period → removal per handbook policy
- TagSmart incident type: could add `untagged_bike` or use existing `notice` type

## 11. Visual Mockup

See companion file: `bike-tag-mockup.svg`

---

## Appendix: Comparison with Parking Tags

| Attribute | Parking Tags | Bike Tag |
|-----------|-------------|----------|
| Form factor | Hang tag (rearview mirror) | Adhesive sticker |
| Size | ~3" × 5" | 35mm × 50mm (1.4" × 2") |
| QR code size | varies | 25mm × 25mm |
| QR format | SN + number | WM-BK-number |
| Color coding | Red/Green/Yellow/Blue | Purple |
| Placement | Vehicle mirror | Bike seat tube |
| Material | Cardstock/plastic | Vinyl sticker |
| Auto-type ID | No (manual select) | Yes (encoded in QR) |
