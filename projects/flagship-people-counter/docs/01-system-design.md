# System Design — Flagship 3D People Counter

**Goal:** count patrons entering/exiting a *wide, busy* flagship entrance at **≥95% accuracy**, anonymously, with per-hour conversion-ready output.

---

## 1. Requirements

### Functional
| ID | Requirement |
|----|-------------|
| F1 | Count people crossing the entrance, separating **inbound** from **outbound**. |
| F2 | Maintain live **occupancy** (inbound − outbound). |
| F3 | Cover a doorway up to **6 m wide** with no blind spot. |
| F4 | Handle **side-by-side** entry and dense flow without merging/splitting people. |
| F5 | Exclude non-patrons: carts, strollers, bags; optionally **staff**. |
| F6 | Emit per-minute/hour counts to a backend; join with POS for **conversion rate**. |

### Non-functional
| ID | Requirement | Target |
|----|-------------|--------|
| N1 | Counting accuracy (vs. hand-counted ground truth) | **≥95%** net, **≥97%** directional at typical flow |
| N2 | Latency (frame → count event) | < 200 ms |
| N3 | Throughput | ≥ 15 FPS per camera, sustained |
| N4 | Privacy | No identifiable imagery leaves the device; counts only |
| N5 | Availability | ≥ 99% uptime; graceful degradation on a single-camera fault |
| N6 | Lighting independence | Works in direct sun at the door and after-hours |

### Out of scope (v1)
Demographics, facial recognition, in-aisle journey/heatmaps (separate sensors), loss prevention.

---

## 2. Why overhead 3D (the core decision)

The two accuracy killers at a busy wide door are **occlusion** and **width**.

- **Occlusion → depth + top-down.** From directly overhead, the head is the closest surface to the sensor, so in a *height map* (`mount_height − depth`) each head is a separable local maximum even when bodies touch. A purely 2D camera loses people who walk behind one another; depth from an angle still suffers parallax occlusion. **Top-down depth is the design's keystone.**
- **Width → multiple cameras + fusion.** One sensor's floor footprint is finite. A 6 m door needs 2–3 overlapping cameras whose detections are fused so a person in the overlap is counted **once**.

This is why the target is "3D stereo" specifically: the depth channel is what buys the last several points of accuracy that beam/thermal/2D give up.

---

## 3. Coordinate frame & coverage geometry

A single **site frame** (metres) is shared by all cameras:

- **X** = across the doorway (0 → door width)
- **Y** = into the store (negative = outside, `Y=0` = the counting line)
- Origin on the floor at one door jamb.

Each camera maps its pixels to this frame via its mount position + floor footprint (calibration). Detections, fusion, tracking, and counting **all happen in site coordinates**, which is what makes multi-camera fusion and a single counting line possible.

### Sizing the camera array
A camera at height `H` with a horizontal field of view `θ` sees a floor footprint of width `W ≈ 2·H·tan(θ/2)`. To guarantee no gap and enough overlap for fusion:

```
cameras_needed = ceil( (door_width − overlap) / (W − overlap) )
```

Worked example (this repo's reference): `H = 3.2 m`, `W ≈ 4.0 m`, desired overlap `≈ 1.0 m`, door `= 6 m` → **2 cameras**, optical axes at `x = 1.75 m` and `x = 4.25 m`, overlapping across `x ≈ 2.25–3.75 m`. The fusion radius (0.30 m) is set **below** the minimum head-to-head separation (~0.45 m) so two people in the overlap stay two people while the same person seen twice is merged.

---

## 4. Pipeline architecture

```
 [cam_left]  [cam_right] ... overhead depth, frame-synced
      │           │
      ▼           ▼
  HeadDetector (per camera)         depth→height map, threshold to head band,
      │           │                 connected components → head centroids in
      └─────┬─────┘                 SITE coordinates  (counter/detection.py)
            ▼
     DetectionFuser                 collapse overlapping detections so a person
            │                       seen by 2 cams = 1   (counter/fusion.py)
            ▼
   MultiObjectTracker               constant-velocity Kalman + greedy assoc;
            │                       stable IDs, survives dropped frames,
            │                       gives direction      (counter/tracking.py)
            ▼
      LineCounter                   signed-distance line crossing + segment
            │                       check + jitter cooldown (counter/line_counter.py)
            ▼
   TrafficAggregator                hourly buckets, occupancy, conversion
                                    (counter/analytics.py)
```

Each stage is a small, independently testable unit. `CountingPipeline.step()` processes one synchronised frame-set, making the whole thing drivable from either the mock world or live sensors.

### Stage responsibilities
- **Detection** — depth-peak head finding is cheap, lighting-independent, occlusion-robust. A neural confirmer (`nn_confirm` hook) rejects cart/bag/reflection blobs and is where staff-classification can attach.
- **Fusion** — greedy, highest-confidence-first clustering; merges with independent-evidence confidence combination.
- **Tracking** — identity is what guarantees "count once". The Kalman predict step bridges momentary detection drop-outs (a head briefly lost under a hat/occlusion), preventing both under- and over-counting.
- **Line counting** — direction comes from the sign flip of the signed distance to the line; the segment check ignores crossings beyond the doorway; the cooldown defeats jitter on the line.
- **Analytics** — the business layer: traffic → conversion when joined with POS counts.

---

## 5. Accuracy strategy (how we actually reach 95%+)

Accuracy is *engineered in the edge cases*, not bought with a sensor:

1. **Top-down depth** to defeat occlusion (§2).
2. **Overlapping multi-camera fusion** sized so min separation > fusion radius (§3).
3. **Tracking through drop-outs** so a flicker doesn't create/destroy a count.
4. **Direction + segment + cooldown** logic so loiterers on the line and door-frame reflections don't count.
5. **Neural head confirmation** to reject non-people (carts, bags) and, optionally, staff.
6. **Per-site calibration** — line placement, mount height, footprint, fusion radius tuned per door.
7. **Ground-truth validation loop** (§7) driving iteration until error < 5%.

---

## 6. Failure modes & mitigations (FMEA, abridged)

| Failure mode | Cause | Effect | Mitigation |
|---|---|---|---|
| Two people merged | Fusion radius ≥ separation | Undercount | Radius < min head separation; per-site tune (§3) |
| One person double-counted | Overlap dedup miss; line jitter | Overcount | Fusion before tracking; per-track cooldown |
| Head lost mid-frame | Occlusion, hat, hair, sensor noise | Track drop → miscount | Kalman predict bridges `max_age` frames |
| Cart/stroller counted | Tall load in head band | Overcount | Height band + neural confirmer |
| Staff counted as patron | No classification | Conversion skew | Staff classifier / staff door / re-ID exclusion |
| Sunlight / IR washout at door | Passive stereo glare | Detection gaps | Active-IR sensor or sun shroud; HDR; auto-exposure |
| Single camera offline | Power/network/hardware | Coverage gap | Health monitor; degrade to remaining cams + alert |
| Clock skew between cameras | Unsynced rig | Bad fusion | Hardware genlock or software time-sync |

---

## 7. Test & validation methodology

- **Unit tests** (this repo, `tests/`) — detection separates adjacent heads, fusion merges/keeps correctly, tracker survives a dropped frame, line counter direction/segment/cooldown, end-to-end demo counts a known synthetic crowd exactly (6 in / 2 out incl. a side-by-side overlap pair).
- **Synthetic stress** — drive `MockWorld` with crowding, varied speeds, sensor noise to find break points before hardware.
- **Field ground truth** — record depth + count, **hand-count the same footage**, compute directional + net error per hour-of-day; target < 5% net.
- **A/B vs. incumbent** — run alongside the existing beam/thermal counter during pilot; reconcile differences.
- **Regression gate** — every code change must keep the unit suite green; the demo count is the canary.

---

## 8. Deployment view

Edge box per entrance runs the pipeline; only **count events / aggregates** leave the device (privacy N4). Backend stores time series and joins POS for conversion. See `02-hardware-reference-build.md` for the physical build and `03-build-vs-buy-roadmap.md` for cost and phasing.
