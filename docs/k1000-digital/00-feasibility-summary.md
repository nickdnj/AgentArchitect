# K1000-D — Feasibility & Cost Summary

**Project:** Pentax K1000 Digital Conversion
**Date:** 2026-05-17
**Phase:** Concept (P0) — exit gate to Engineering Validation (P1/EVT)
**Status:** **GO recommended**, conditional on one pre-EVT decision and adoption of the kit business model.

---

## 1. The Verdict

| Question | Answer |
|---|---|
| Is it technically buildable? | **Yes.** Every subsystem has a credible design path. |
| Will it hit the prototype budget (≤ $500)? | **Yes — $498 kit / $613 with donor body.** |
| Will it hit the qty-100 budget (≤ $300/unit)? | **Within 4% — $311 kit.** Achievable at target with one more lever. |
| Will it hit the qty-1000 budget (≤ $200/unit)? | **Within 9–15% — $217–$230 fully loaded.** BOM is $201; compliance loading lifts it. Reach number, not a guarantee. |
| Will the viewfinder feel responsive? | **Yes — 90 ms tuned, target was < 120 ms.** Tight margin, must be re-measured on sealed prototype. |
| Can it be manufactured at qty 100 with positive yield? | **Yes — 82–88% first-pass, 17 min/unit calibration, $3.12/unit labor against a $6.50 budget.** |
| Should it be sold as a complete camera or as a kit? | **Kit.** Donor-body sourcing collapses at qty 100+; only kit pricing holds. |

**Recommendation: proceed to P1/EVT** after locking the one open product decision below.

---

## 2. The One Pre-EVT Decision

DFM and firmware both surfaced the same blocker: the interpretation of **REQ-006 ("capture latency < 50 ms from X-sync to frame committed to storage")** drives storage architecture, EOL test design, the BOM, and ~$104/unit of qty-1000 cost. Three options:

| Option | Capture Latency | Storage | Image Quality | Unit Cost Impact (qty 1000) | Risk |
|---|---|---|---|---|---|
| **A. In-RAM queue, 5-sec safe-shutdown** | < 50 ms ✓ | Onboard **eMMC** | JPEG fine, RAW deferred | **–$104** (kills USB-SSD) | Power-cut data loss inside 5-sec window |
| **B. JPEG fsync'd** | ~15 ms ✓ | Onboard eMMC | JPEG only | –$104 | No DNG/RAW workflow |
| **C. DNG fsync'd** | ~150 ms ✗ | USB-SSD retained | Full RAW | $0 | Misses REQ-006 latency target |

Option (A) is the team's working assumption — best cost and latency, RAW captured asynchronously after the shot, manageable power-loss risk via a supercap or graceful-shutdown PMIC. **Confirm with the user before EVT kickoff.**

---

## 3. Headline Cost Stack

### Prototype (qty 1)

| Path | Cost |
|---|---|
| Kit (user supplies a working K1000) | **$498** |
| Complete unit (KEH/eBay K1000 @ ~$115 median) | $613 |

### Production unit cost — kit model

| Qty | BOM (kit) | + Compliance load | Fully loaded | Target | Delta |
|---|---|---|---|---|---|
| 10 | ~$415 | n/a | $415 | — | — |
| **100** | **$311** | minimal | **$311** | $300 | **+4%** |
| **1000** | **$201** | +$16 (FCC SDoC, RoHS, UN 38.3, CE) | **$217–$230** | $200 | **+9–15%** |

Cost-reduction levers already applied to hit qty-100 / qty-1000 BOM: Compute Module 5 instead of full Pi 5, custom power PCB to retire the PiSugar, onboard eMMC instead of USB-SSD (depends on REQ-006 decision), injection-molded enclosure at qty 1000, negotiated Arducam volume pricing on the IMX283 module.

### Retail pricing model (kit, channel-neutral, 2× markup)

| Qty | Cost | Suggested retail |
|---|---|---|
| 100 | $311 | **~$650–750** |
| 1000 | $217–$230 | **~$450–550** |

---

## 4. System At A Glance

```
                K-mount lens
                     │
                     ▼  optical path through original camera
              ┌──────────────────────┐
              │  K1000 body (stock)  │
              │   shutter · mirror   │
              │     viewfinder       │
              └──────────┬───────────┘
                         │ light to film plane (45.46 mm from flange)
                         ▼
┌────────────────────────────────────────────────────┐
│   CNC aluminum alignment plate + brass shim pack   │  ← ±0.05 mm tol.
│   ─────────────────────────────────                │
│   Arducam IMX283 Pivariety module  (Type 1", 20MP) │
└─────────────┬──────────────────────────────────────┘
              │  MIPI-CSI (short FFC, < 100 mm)
              ▼
┌────────────────────────────────────────────────────┐
│             Rear-hump enclosure                    │
│   ─────────────────────────────────                │
│   Raspberry Pi 5 4 GB                              │
│   Custom 2-layer carrier PCB                       │
│     • H11AA1 opto + SMAJ100CA TVS  (X-sync in)     │
│     • Power conditioning, status LED               │
│   PiSugar 3 Plus 5000 mAh  (proto)                 │
│     → custom power PCB at qty 1000                 │
│   eMMC (production)  /  USB-SSD (proto)            │
└─────┬──────────────────────────┬───────────────────┘
      │ WiFi AP (5 GHz)          │ X-sync ◄── PC-sync terminal on K1000
      ▼                          │
┌──────────────┐                 │
│   iPhone     │                 │
│   PWA UI     │   ◄──  WebRTC viewfinder (~90 ms)
│   (Safari)   │
└──────────────┘
```

---

## 5. The Seven Risks That Matter

Consolidated and de-duplicated across all six specialist registers. Severity × Likelihood scored on the systems-engineer's 1–5 scale.

| # | Risk | Score | Owner | Mitigation |
|---|---|---|---|---|
| 1 | **Flange tolerance ±0.05 mm** — naive stack-up is ±0.18 mm, shimming mandatory per unit | 20 | MCAD + DFM | CNC + surface-ground aluminum plate; brass/Mylar shim pack tuned at calibration step; jig + go/no-go gauge |
| 2 | **Donor K1000 sourcing collapses at qty 100+** — EOL 1997, used market thin | 20 | Supply Chain | **Kit business model adopted.** Qualify Ricoh KR-5 Super / Chinon CM-3 as substitute K-mount donors |
| 3 | **Pi 5 too large for original envelope** — rear hump mandatory | 16 | MCAD | Original back door preserved (reversibility); hump shapes around Pi 5 + battery + cable strain relief |
| 4 | **iOS Safari WebRTC in installed-PWA mode** — known WebKit regressions | 16 | Firmware | LL-HLS fallback path (~300 ms); explicit test matrix iOS 16.4 / 17 / 18 |
| 5 | **WebRTC latency margin only ~30 ms** — any WiFi retransmit or thermal throttle blows budget | 15 | Firmware + MCAD | 5 GHz only, WMM-enabled hostapd, thermal pad to Pi 5 SoC, sealed-prototype benchmark before tape-out |
| 6 | **PiSugar 3 Plus 3 A rating vs Pi 5 capture-burst peaks** (~3.15 A) | 12 | PCB + Supply Chain | 220 µF polymer bulk cap on carrier PCB (proto); custom Pi-5-rated PMIC at qty 1000 |
| 7 | **Vintage strobe over-voltage on PC-sync** (some legacy units > 250 V) | 10 | PCB | H11AA1 bidirectional opto + 2.7 kΩ/1 W series + SMAJ100CA TVS clamp + RC snubber. Solved, but field-verify |

Risks 1 and 2 are the gating items. Both have a concrete mitigation path. Everything else is normal engineering.

---

## 6. Performance Summary

| Spec | Target | Designed | Notes |
|---|---|---|---|
| Viewfinder latency (glass → iPhone) | < 120 ms | **~90 ms** | Tuned config: H.264 baseline, zerolatency, playoutDelayHint=0.02, 5 GHz WMM |
| Capture latency (X-sync → committed) | < 50 ms | ~5 ms hw + firmware budget | Depends on REQ-006 storage decision (§2) |
| Sensor | — | Sony IMX283, Type 1″, 20 MP, 13.2 × 8.8 mm | |
| Crop factor (vs film) | n/a | **2.7×** | 50 mm K-mount → ~135 mm EFL |
| Battery life (active) | — | **~2.1 h** | 5000 mAh PiSugar 3 Plus; ~5.4 h standby |
| Wireless | — | Pi-hosted 5 GHz AP, mDNS `k1000-d.local` | iOS captive-portal handled |
| Storage (proto / prod) | — | USB-SSD 256 GB / onboard eMMC 64 GB | Production path pending REQ-006 |
| Calibration time per unit | — | ~17 min weighted | Within $6.50 BOM labor budget |
| First-pass yield (qty 100) | — | **82–88%** | Calibration step dominates |

---

## 7. Business Model Recommendation

**Sell as a kit.** Donor K1000 bodies are an EOL component with a thin used market; sourcing 100 units stresses the market, and 1000 destroys it. Kit model also dodges the value-destruction PR issue ("you turned a vintage camera into a sensor mount") because the buyer brings their own.

A complete-unit SKU can exist as a low-volume premium offering using KEH-graded refurb K1000 bodies at +$135–$235/unit over the kit price.

A second body alternative — qualifying Ricoh KR-5 Super or Chinon CM-3 as substitute K-mount donors with similar internal geometry — opens a "K-Mount Manual SLR Digital Conversion Kit" positioning that decouples the product from K1000 supply entirely.

---

## 8. Phase Plan & Exit Criteria

| Phase | Duration | Exit gate |
|---|---|---|
| **P0 Concept** *(this doc)* | — | Feasibility approved, REQ-006 decision locked. **GATE OPEN.** |
| **P1 EVT** (Engineering Validation) | 8–10 weeks | 3 units built, optical alignment validated on bench, viewfinder latency measured < 120 ms on sealed unit, X-sync trigger verified across 5 representative K1000 bodies |
| **P2 DVT** (Design Validation) | 6–8 weeks | 10 units, real-world field test, thermal soak, drop test, FCC pre-scan |
| **P3 PVT** (Production Validation) | 4–6 weeks | Pilot run of 25 units off the production process; yield ≥ 80%; EOL test fixture proven |
| **P4 MP** (Mass Production) | — | Sustained qty-100 batches; yield ≥ 85%; cost ≤ $311/unit; CSAT ≥ 4.5/5 |

---

## 9. Open Questions for the Product Owner

1. **REQ-006 storage architecture** — pick A, B, or C from §2. (Team recommends A.)
2. **Rear-hump aesthetics** — is replacing the original back door acceptable to the target buyer? It's required by physics.
3. **Reversibility scope** — is "original back door preserved, body unmodified" sufficient, or does the buyer expect to be able to load film with the digital insert installed? (Latter is not possible.)
4. **Donor-body strategy** — kit-only, kit + premium complete-unit SKU, or kit + complete + multi-body-platform (KR-5 / CM-3)?
5. **Compliance scope at qty 1000** — FCC SDoC vs full FCC certification; CE self-declaration vs notified-body; do we ship internationally? Decision drives the $16/unit loading.
6. **Target retail price** — drives the markup model and channel strategy. Team's defensible band: $650–750 at qty 100, $450–550 at qty 1000.

---

## 10. Appendix — Full Specialist Briefings

- [01 — Concept of Operations](01-conops.md)
- [02 — Systems Engineering](02-systems-engineering.md) (65 REQs, allocation matrix, V&V plan)
- [03 — Mechanical Design](03-mechanical-design.md) (cavity analysis, alignment fixture, rear hump)
- [04 — Electrical Design](04-electrical-design.md) (carrier PCB, X-sync protection, power tree)
- [05 — Firmware & Software](05-firmware-software.md) (libcamera, WebRTC, FastAPI, PWA, WiFi AP)
- [06 — BOM & Costing](06-bom-and-costing.md) (live prices, qty 1/10/100/1000, sourcing risk)
- [07 — DFM & Test Readiness](07-dfm-and-test.md) (calibration procedure, EOL fixture, EVT→MP gates)

---

*Synthesis produced by the Hardware Dev team via the Agent Architect orchestration pattern. Each specialist briefing was authored in an isolated context window and consolidated here.*
