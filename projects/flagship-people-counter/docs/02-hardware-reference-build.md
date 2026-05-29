# Hardware Reference Build — One Flagship Entrance

A concrete, buildable spec for a **6 m wide** entrance, **3.0–3.5 m ceiling**, targeting **≥95%** accuracy. Scale the camera count per §"Coverage" for other widths.

---

## 1. Sensor selection

| Option | Tech | Range | Why / when |
|---|---|---|---|
| **Stereolabs ZED 2 / ZED X** | Passive stereo + neural depth | up to ~20 m | High ceilings / very wide spans; first-class Jetson SDK. Needs decent light or its own IR. |
| **Luxonis OAK-D Pro** ✅ *reference pick* | Active IR stereo + on-camera AI | ~0.8–12 m, <2% err @ 4 m | Robust to lighting (active IR), runs head detection **on-camera** (offloads host), strong value. |
| **Orbbec (Gemini/Femto)** | Active/structured + stereo | varies | Practical RealSense successor for new designs. |
| ~~Intel RealSense D455~~ | Active IR stereo | 0.1–6 m | Was the standard, **Intel is winding RealSense down** — sourcing risk; avoid for new builds. |

**Reference pick: 2× OAK-D Pro** — active IR handles door-side sun/after-hours, on-device AI lets a smaller host drive both cameras, and the depth error at our ~3.2 m working distance is well within budget.

### Mounting
- **Directly overhead**, lens pointing straight down, at the doorway threshold.
- Mount height **3.0–3.5 m** (this build: 3.2 m). Higher = wider footprint, fewer cameras, but lower pixel density on heads — re-validate detection if you exceed ~4 m.
- Rigid mount (no sway); cameras **frame-synchronised** (genlock or software time-sync) so fusion sees the same instant.

### Coverage (this build)
2 cameras, footprints ~4.0 m each, optical axes at x = 1.75 m and 4.25 m, **~1 m overlap** across x≈2.25–3.75 m. No gap; overlap large enough to fuse, fusion radius (0.30 m) smaller than min head separation. (Geometry math: `01-system-design.md` §3.)

---

## 2. Edge compute

| Part | Reference | Notes |
|---|---|---|
| **Compute** | NVIDIA **Jetson Orin NX 16 GB** (or Orin Nano 8 GB for 2 cams) | Runs detection+tracking+counting at ≥15 FPS/cam; CUDA-accelerated; ZED & DepthAI both have Jetson builds. |
| Storage | 128 GB NVMe | OS + buffers; counts are tiny, no video retained. |
| OS | JetPack (Ubuntu) | Vendor-supported. |

Orin NX gives headroom for the neural head-confirmer and a future heatmap workload; Orin Nano is fine for a 2-camera, depth-peak-only build.

---

## 3. Power, network, enclosure

| Item | Reference | Notes |
|---|---|---|
| Camera connection | USB3 (OAK/ZED) → host; or **PoE** variants | PoE simplifies overhead runs; else USB3 active cable ≤ the spec length. |
| Power | DC for Jetson (~25–40 W) + cameras | UPS recommended for uptime (N5). |
| Network | Wired Ethernet preferred; Wi-Fi acceptable for counts | Only aggregates egress — low bandwidth. |
| Enclosure | Vented ABS/aluminum, ceiling/soffit mount | Hide cabling; maintain airflow for the Jetson. |
| Cabling | USB3 active cables / Cat6, strain-relieved | Keep within USB3 length limits or use PoE cameras. |

---

## 4. Bill of materials (per 6 m entrance)

| Qty | Item | Unit (USD, approx.) | Subtotal |
|----:|------|--------------------:|---------:|
| 2 | OAK-D Pro depth camera | $300–$400 | $600–$800 |
| 1 | Jetson Orin NX 16 GB dev/production module + carrier | $400–$700 | $400–$700 |
| 1 | 128 GB NVMe | $25 | $25 |
| 2 | Overhead mount + bracket | $40 | $80 |
| 1 | Enclosure | $60 | $60 |
| — | USB3 active cables / PoE + Cat6, power, UPS | $150–$300 | $150–$300 |
| — | Install + calibration labour | varies | — |
| | **Hardware total per door** | | **≈ $1,300 – $2,000** |

Wider doors (3 cameras) or ZED-class sensors push the top end toward **$3k–$4k/door** (matches the earlier estimate). No per-sensor SaaS fee — contrast with vendor pricing in `03-build-vs-buy-roadmap.md`.

---

## 5. Install & calibration procedure

1. **Mount** cameras overhead at the threshold, lenses plumb (use a level), at the planned height/positions.
2. **Measure** each camera's mount height and its optical-axis position in the site frame (tape/laser); record footprint. Enter into the site YAML (`configs/`).
3. **Sync** the cameras (genlock or NTP/PTP software sync); verify timestamps align.
4. **Place the counting line** at the threshold in site coordinates; set `inbound_normal` toward the store interior.
5. **Verify footprints overlap** ~1 m and there's no floor gap across the doorway.
6. **Set the head band** (`min/max_head_height_m`) to the local population; set `fusion_radius_m` below observed min head separation.
7. **Calibrate-validate:** walk known patterns (single, side-by-side, in+out, loiter-at-line) and confirm counts; adjust line/band/radius.
8. **Ground-truth pass:** record an hour at peak, hand-count, compare; iterate until net error < 5% (see `01-system-design.md` §7).

---

## 6. Software bring-up on the box

1. Flash JetPack; install the camera SDK (`depthai` for OAK, ZED SDK for ZED).
2. Deploy this `counter/` package; `pip install numpy pyyaml`.
3. Implement the matching `DepthSource` adapter (`OAKDepthSource` / `ZEDDepthSource` in `counter/depth_source.py`) to emit metric depth frames in the site orientation.
4. `python -m counter.cli --config configs/<site>.yaml --backend oak`.
5. Wire `TrafficAggregator` output to the backend (MQTT/HTTP) and the POS join for conversion.

> The counting logic is hardware-agnostic and already tested against the mock world — bring-up is "implement the depth adapter + point it at the backend."
