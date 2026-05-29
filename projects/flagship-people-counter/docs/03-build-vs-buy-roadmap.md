# Build vs. Buy + Roadmap

## 1. The honest framing

3D stereo people counting is a **mature, commoditized** product category. Vendors (V-Count, Dor, SenSource, FootfallCam, RetailSensing, Milesight) sell turnkey overhead 3D counters quoting **95–98%+** accuracy with dashboards, POS integration, and install support — they've already absorbed years of edge-case tuning.

So the default answer for "I just need accurate flagship numbers" is **buy**. Build only when one of the build triggers below applies.

| Buy if… | Build if… |
|---|---|
| You need accurate traffic + conversion, fast | Counting is core IP / a product you'll sell |
| You want a vendor SLA + support | You need custom on-prem behavior / data sovereignty |
| Few doors, no eng team | Many doors where per-sensor SaaS dominates cost |
| Standard dashboards suffice | Deep integration into your own platform/analytics |

A common **middle path** (what this repo enables): buy the depth cameras, use the SDK's built-in person detection/tracking for the heavy CV, and build only the **counting + analytics layer** on top — most of the value, a fraction of the from-scratch effort.

---

## 2. Cost model

### Build (this design)
- **Hardware:** ~$1.3k–$2k per door (2-cam); up to ~$3–4k for wide/long-range (`02-hardware-reference-build.md`).
- **One-time engineering:** MVP a few weeks (1 CV eng); production-grade 95%+ on a wide busy door **3–6+ months** incl. validation/tuning, plus a backend.
- **Per-door marginal cost after platform exists:** ≈ hardware + install only. **No recurring per-sensor license.**
- **Ongoing:** maintenance, recalibration on store changes, model refresh.

### Buy (vendor)
- **Hardware/sensor:** comparable per door, often bundled.
- **Recurring SaaS:** typically a per-sensor/per-site annual fee for the analytics platform — this is the line item that compounds across many stores and years.
- **Eng cost:** ~0; faster to live.

### Break-even logic
Build wins when `(N_doors × years × SaaS_per_door)` exceeds `(one-time eng + platform maintenance)`. Few doors → **buy**. Large fleet, long horizon, or counting-as-product → **build** (or middle path).

---

## 3. Roadmap

### Phase 0 — Algorithm proof *(done — this repo)*
Pure-numpy pipeline + mock world; unit + end-to-end tests green; the side-by-side-in-overlap hard case counts correctly. De-risks the logic before any hardware spend.

### Phase 1 — Single-door MVP (≈ weeks)
- Implement the OAK/ZED `DepthSource` adapter; one camera, one clean door.
- Live counts + basic backend sink. Validate vs. hand count.
- **Exit:** directional counting working on real depth at ≥15 FPS.

### Phase 2 — Wide-entrance pilot (≈ 1–2 months)
- Multi-camera sync + fusion on the real flagship door; calibration procedure.
- Neural head-confirmer (cart/bag rejection) + optional staff exclusion.
- Run **A/B against the incumbent counter**; ground-truth to < 5% net error.
- **Exit:** ≥95% validated on the target door; conversion (POS join) live.

### Phase 3 — Hardening & ops (≈ 1 month)
- Health monitoring, single-camera-fault degradation, alerting (N5).
- Sun/IR robustness, after-hours handling; config-as-code per site.
- Dashboards: traffic, occupancy, conversion by hour.
- **Exit:** unattended operation with SLA-grade uptime.

### Phase 4 — Multi-store rollout
- Repeatable install/calibration kit; fleet config management; central time series.
- Per-door cost down to hardware + install. Optional: heatmaps/dwell as add-on sensors.

---

## 4. Key risks

| Risk | Mitigation |
|---|---|
| Build effort underestimated | Phase gates with validation exit criteria; reuse SDK CV (middle path) |
| Accuracy stalls < 95% | Ground-truth loop drives tuning; FMEA-guided fixes (`01-system-design.md` §6) |
| Sensor supply (RealSense EOL) | Standardize on OAK/ZED/Orbbec; abstract behind `DepthSource` |
| Lighting at the door | Active-IR sensor + shroud; HDR; validate in worst light |
| Privacy/regulatory | Anonymous counts only, no imagery egress; document data flow |
| Maintenance drag at scale | Config-as-code, health monitoring, remote recalibration |

---

## 5. Recommendation

- **1–3 doors, need numbers now:** buy a turnkey 3D counter.
- **Counting is strategic / large fleet / custom platform:** build on this design, or take the middle path (vendor cameras + this counting/analytics layer). Phase 0 is already done and de-risked here; Phase 1 is a depth-adapter away.
