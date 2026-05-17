# K1000 Digital — Concept of Operations (ConOps)

**Project codename:** K1000-D
**Date:** 2026-05-17
**Author:** Hardware Dev Team (per user direction)
**Status:** Concept — feasibility & costing phase

---

## 1. Mission

Convert a vintage Pentax K1000 (1976–1997, all-mechanical 35mm SLR) into a digital
camera by replacing the film with a sensor module at the film plane. The K-mount
lens system, mechanical shutter, viewfinder, focus, and aperture controls all
remain stock. The camera shoots digital frames through the original optics.

The user pairs an iPhone over WiFi to act as the digital viewfinder and control
surface — no rear screen on the camera body.

## 2. Stakeholders & Use Cases

- **Primary user:** Hobbyist photographer who wants the tactile experience of a
  mechanical SLR with digital convenience.
- **Secondary use cases:** Educational (film-to-digital bridge), creative
  (vintage rendering with digital workflow), modding community kit.

## 3. Operational Concept

1. User mounts a K-mount lens, frames through the optical viewfinder.
2. iPhone joins the camera's WiFi AP ("K1000-D") and opens a PWA.
3. PWA shows live preview from the sensor (sub-120 ms latency target),
   histogram, focus peaking, level, and shooting controls.
4. User cocks the film advance lever (still required — drives the shutter).
5. User presses the mechanical shutter release.
6. The shutter opens; the X-sync contact closes; Pi GPIO fires capture.
7. Frame saved to onboard storage; thumbnail pushed to PWA gallery.
8. User can download / AirDrop / auto-upload frames from the PWA.

## 4. Key Design Decisions (from conversation)

| Decision | Choice | Rationale |
|---|---|---|
| Image sensor | Arducam IMX283 (Type 1", 13.2×8.8 mm, 20 MP) | Best price/quality. 2.7× crop is the smallest sensor crop achievable on Pi without jumping to $800+ industrial cams. |
| SoC | Raspberry Pi 5 (4 GB) | Bandwidth and CPU needed to run IMX283 + WebRTC at <120 ms latency. |
| Shutter sync | PC-sync X-flash terminal → Pi GPIO | K1000 is purely mechanical, no electrical shutter trigger. X-sync contact closes when curtain fully open. Max sync speed 1/60s. |
| User interface | iPhone PWA over Pi-hosted WiFi AP | No screen on body. Phone is the UI. PWA avoids App Store. Works in the field with no internet. |
| Video transport | WebRTC (gstreamer `webrtcbin`) | Sub-120 ms latency required for usable viewfinder. MJPEG (~250–400 ms) too slow. |
| Power | PiSugar 3 Plus (5000 mAh) + USB-C charging | Field operation, all-day shooting target. |
| Storage | 256 GB USB-SSD (prototype); onboard eMMC TBD for production | Fast write for RAW+JPEG. |

## 5. Constraints

- **Optical:** Sensor must sit at exactly the K-mount flange focal distance
  (45.46 mm). Mechanical tolerance ±0.05 mm or focus is wrong at infinity.
- **Mechanical:** Must preserve K-mount geometry. Film door must close.
  No external modification to the camera body — all electronics live in the
  cavity vacated by the film cartridge + take-up spool + pressure plate.
- **Electrical:** No power draw from camera body (it has none). Pi runs on
  internal battery. X-sync wire taps the PC terminal non-destructively.
- **Reversibility (preferred):** Original film capability should be restorable
  by removing the digital insert.
- **Budget:**
  - Prototype: target ≤ $500 BOM (qty 1).
  - Production: target ≤ $300 BOM at qty 100, ≤ $200 at qty 1000.
- **Latency:** Viewfinder end-to-end glass-to-iPhone < 120 ms.
- **Crop factor:** ~2.7× accepted. User's 50 mm lens = ~135 mm EFL.

## 6. Out of Scope (Phase 1)

- Mechanical autofocus assist
- Aperture readout (no electrical contacts on K-mount lenses)
- Light metering integration with the camera's CdS meter
- Native iOS app (PWA only)
- Multi-camera sync / tethering protocols beyond local WiFi

## 7. Phase 1 Deliverables (this engagement)

1. System requirements doc + architecture + V&V plan (systems-engineer)
2. Mechanical concept: film-bay insert, sensor alignment fixture,
   dimensional analysis, STEP/CAD plan (mcad-engineer)
3. Electrical concept: X-sync trigger circuit, power tree, FFC interconnect
   to sensor, GPIO map (pcb-designer)
4. Firmware/software architecture: libcamera + gstreamer WebRTC pipeline,
   FastAPI control plane, PWA stack, hostapd/dnsmasq AP config,
   power management (firmware-engineer)
5. Prototype BOM at qty 1, vendor links (supply-chain-manager)
6. Production BOM modeling at qty 10 / 100 / 1000, sourcing risk,
   cost drivers and reduction levers (supply-chain-manager)
7. DFM & test readiness assessment: optical alignment tolerance budget,
   calibration procedure, test fixture concept, compliance gaps
   (dfm-test-engineer, after others)

## 8. Open Questions (for downstream specialists to address)

- Mechanical: Is the K1000 back-cavity volume sufficient for Pi 5 + battery +
  storage? Or do we need to externalize the Pi onto a small rear hump?
- Optical: How is the IMX283 sensor cover glass thickness compensated relative
  to film thickness for accurate flange focus?
- Electrical: Does the PC-sync terminal provide a clean rising edge into
  3.3 V GPIO, or do we need optoisolation / level shifting?
- Firmware: Can Pi 5 + IMX283 sustain 30 fps at 1080p preview + 20 MP capture
  on the same MIPI link, or do we need staged exposure?
- Production: Is there a feasible enclosure path that doesn't require donor
  K1000 bodies (sourcing risk, value destruction)?

---

*This ConOps is the input brief for downstream specialists. All design work in
Phase 1 traces back to these requirements.*
