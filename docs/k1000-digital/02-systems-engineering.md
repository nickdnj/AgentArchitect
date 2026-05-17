# K1000 Digital — Systems Engineering Briefing

**Project codename:** K1000-D
**Date:** 2026-05-17
**Author:** Systems Engineer (Hardware Dev Team)
**Status:** Phase 1 — concept & feasibility
**References:** [`k1000_digital_conops.md`](./k1000_digital_conops.md)

---

## 1. System Requirements

Requirements decomposed from the ConOps. Priority: **M**ust / **S**hould / **C**ould. Verification: **A**nalysis / **I**nspection / **D**emonstration / **T**est.

### 1.1 Functional Requirements

| ID | Requirement | Pri | Verif |
|---|---|---|---|
| REQ-001 | The system shall capture a still image when the K1000 mechanical shutter is fired. | M | T |
| REQ-002 | The system shall use the original K1000 optical path, K-mount, shutter, viewfinder, focus, and aperture controls without modification. | M | I |
| REQ-003 | The system shall deliver a live preview from the IMX283 sensor to a paired iPhone PWA. | M | D |
| REQ-004 | The system shall host a local WiFi access point ("K1000-D") to which an iPhone PWA connects. | M | T |
| REQ-005 | The PWA shall display histogram, focus peaking, level indicator, exposure metadata, and gallery thumbnails. | M | D |
| REQ-006 | The system shall save each captured frame as JPEG (M) and DNG/RAW (S) to onboard storage. | M | T |
| REQ-007 | The system shall trigger sensor capture from the K1000 X-sync PC contact via Pi GPIO. | M | T |
| REQ-008 | The system shall sustain continuous preview during normal operation and resume preview within 1 s after capture. | M | T |
| REQ-009 | The system shall allow the user to browse, download, and delete captured frames via the PWA. | M | D |
| REQ-010 | The system should auto-upload captured frames to a configured cloud destination when internet is available. | S | D |
| REQ-011 | The system could expose camera settings (ISO, white balance, RAW/JPEG mode, exposure compensation offset) via the PWA. | C | D |
| REQ-012 | The system shall provide a user-visible power state indicator (LED or PWA status). | M | I |

### 1.2 Performance Requirements

| ID | Requirement | Pri | Verif |
|---|---|---|---|
| REQ-020 | Glass-to-iPhone preview latency shall be ≤ 120 ms (95th percentile) at 1080p30. | M | T |
| REQ-021 | The system shall capture full-resolution stills at ≥ 20 MP from the IMX283. | M | T |
| REQ-022 | Capture-to-thumbnail-on-PWA latency shall be ≤ 1.5 s. | S | T |
| REQ-023 | The system shall sustain ≥ 1 capture per 2 s burst rate for 5 consecutive frames. | S | T |
| REQ-024 | The X-sync to sensor exposure-window trigger jitter shall be ≤ 2 ms. | M | T |
| REQ-025 | The system shall operate for ≥ 4 hours continuous viewfinder use on a single battery charge. | M | T |
| REQ-026 | The system shall be capable of ≥ 200 captures per battery charge under mixed use (preview + capture). | S | T |

### 1.3 Optical / Mechanical Requirements

| ID | Requirement | Pri | Verif |
|---|---|---|---|
| REQ-030 | The sensor image plane shall sit at the K-mount flange focal distance of 45.46 mm ± 0.05 mm. | M | I |
| REQ-031 | The sensor image plane shall be parallel to the K-mount flange to within ± 0.02° (tilt). | M | I |
| REQ-032 | The sensor optical center shall be aligned to the lens axis within ± 0.10 mm (decenter). | M | I |
| REQ-033 | The digital insert shall fit entirely within the K1000 film-cavity envelope (between film door and shutter rail). | M | I |
| REQ-034 | The K1000 film door shall close and latch with the insert installed. | M | I |
| REQ-035 | The conversion should be reversible — original film capability restorable by removing the insert. | S | I |
| REQ-036 | No permanent modification (drilling, milling) of the K1000 chassis is permitted without explicit user approval. | M | I |
| REQ-037 | The sensor cover-glass thickness shall be optically compensated relative to 35mm film thickness (~0.13 mm). | M | A |

### 1.4 Electrical / Power Requirements

| ID | Requirement | Pri | Verif |
|---|---|---|---|
| REQ-040 | The system shall draw no power from the K1000 body. | M | I |
| REQ-041 | The system shall be powered by an internal Li-ion battery (PiSugar 3 Plus or equivalent, ≥ 5000 mAh). | M | I |
| REQ-042 | The system shall recharge via USB-C at ≥ 1.5 A. | M | T |
| REQ-043 | The X-sync input shall accept the K1000 PC-terminal contact closure without damaging Pi GPIO. | M | T |
| REQ-044 | The X-sync input shall be optoisolated or otherwise galvanically protected from the Pi 3.3 V rail. | S | I |
| REQ-045 | The system shall provide brown-out-safe shutdown when battery falls below threshold. | M | T |

### 1.5 Software / Interface Requirements

| ID | Requirement | Pri | Verif |
|---|---|---|---|
| REQ-050 | The PWA shall be served from the Pi over HTTP/HTTPS on the local AP. | M | D |
| REQ-051 | The PWA shall require no app-store install and shall run on iOS 17+ Safari. | M | D |
| REQ-052 | Live preview shall be transported via WebRTC. | M | I |
| REQ-053 | Control plane (capture trigger, settings, gallery) shall use a REST/WebSocket API over HTTPS. | M | I |
| REQ-054 | The system shall boot to operational state (AP up, preview ready when PWA connects) in ≤ 30 s from cold. | S | T |
| REQ-055 | The system shall expose a software shutdown via PWA. | M | D |

### 1.6 Non-Functional Requirements

| ID | Requirement | Pri | Verif |
|---|---|---|---|
| REQ-060 | Prototype BOM (qty 1) shall be ≤ $500. | M | A |
| REQ-061 | Production BOM shall be ≤ $300 at qty 100 and ≤ $200 at qty 1000. | S | A |
| REQ-062 | The integrated camera weight shall be ≤ 1.3 kg (stock K1000 + lens reference ~1.0 kg). | S | I |
| REQ-063 | The system shall operate from 0 °C to +40 °C ambient. | S | T |
| REQ-064 | The system shall survive non-operating storage from -10 °C to +60 °C. | C | T |
| REQ-065 | The conversion shall be performable by a moderately-skilled hobbyist with documented procedure. | S | D |

---

## 2. Allocation Matrix

Each requirement is allocated to one or more subsystems: **MECH**anical, **ELEC**tronics, **FW** (firmware on Pi), **APP** (PWA), **SC** (Supply Chain), **SYS** (cross-cutting).

| REQ | MECH | ELEC | FW | APP | SC | SYS |
|---|---|---|---|---|---|---|
| REQ-001 |  | X | X |  |  |  |
| REQ-002 | X |  |  |  |  |  |
| REQ-003 |  | X | X | X |  |  |
| REQ-004 |  |  | X | X |  |  |
| REQ-005 |  |  | X | X |  |  |
| REQ-006 |  |  | X |  | X |  |
| REQ-007 | X | X | X |  |  |  |
| REQ-008 |  |  | X | X |  |  |
| REQ-009 |  |  | X | X |  |  |
| REQ-010 |  |  | X | X |  |  |
| REQ-011 |  |  | X | X |  |  |
| REQ-012 | X | X | X | X |  |  |
| REQ-020 |  | X | X | X |  | X |
| REQ-021 |  | X | X |  |  |  |
| REQ-022 |  |  | X | X |  |  |
| REQ-023 |  | X | X |  |  |  |
| REQ-024 |  | X | X |  |  |  |
| REQ-025 |  | X | X |  | X |  |
| REQ-026 |  | X | X |  | X |  |
| REQ-030 | X |  |  |  |  | X |
| REQ-031 | X |  |  |  |  | X |
| REQ-032 | X |  |  |  |  | X |
| REQ-033 | X |  |  |  |  |  |
| REQ-034 | X |  |  |  |  |  |
| REQ-035 | X | X |  |  |  |  |
| REQ-036 | X |  |  |  |  |  |
| REQ-037 | X |  |  |  |  | X |
| REQ-040 |  | X |  |  |  |  |
| REQ-041 |  | X |  |  | X |  |
| REQ-042 |  | X | X |  |  |  |
| REQ-043 |  | X |  |  |  |  |
| REQ-044 |  | X |  |  |  |  |
| REQ-045 |  | X | X |  |  |  |
| REQ-050 |  |  | X | X |  |  |
| REQ-051 |  |  |  | X |  |  |
| REQ-052 |  |  | X | X |  |  |
| REQ-053 |  |  | X | X |  |  |
| REQ-054 |  |  | X |  |  |  |
| REQ-055 |  |  | X | X |  |  |
| REQ-060 |  |  |  |  | X |  |
| REQ-061 |  |  |  |  | X |  |
| REQ-062 | X |  |  |  | X |  |
| REQ-063 | X | X |  |  |  |  |
| REQ-064 | X | X |  |  |  |  |
| REQ-065 | X |  |  |  |  | X |

---

## 3. System Architecture

### 3.1 Block Diagram

```mermaid
flowchart LR
    subgraph OPTICS["K1000 Body (unmodified)"]
        LENS["K-mount lens<br/>(50mm, etc.)"]
        SHUT["Focal-plane<br/>shutter"]
        VF["Pentaprism<br/>viewfinder"]
        PC["PC-sync<br/>X-flash terminal"]
        LENS --> SHUT
        LENS -.-> VF
        SHUT -.-> PC
    end

    subgraph INSERT["Digital Insert (film cavity)"]
        SENS["Arducam IMX283<br/>sensor module<br/>(at flange = 45.46 mm)"]
        FFC["MIPI CSI-2<br/>FFC ribbon"]
        TRIG["X-sync conditioning<br/>(opto / level shift)"]
    end

    subgraph CORE["Compute & Power (rear hump or cavity)"]
        PI["Raspberry Pi 5 (4 GB)"]
        BATT["PiSugar 3 Plus<br/>5000 mAh + PMIC"]
        SSD["USB-SSD 256 GB<br/>(prototype)"]
        WIFI["Pi 5 WiFi radio<br/>(AP mode)"]
        PI --- BATT
        PI --- SSD
        PI --- WIFI
    end

    subgraph USER["User Device"]
        IOS["iPhone<br/>iOS 17+ Safari PWA"]
    end

    SHUT --> SENS
    SENS --> FFC
    FFC --> PI
    PC --> TRIG
    TRIG --> PI
    WIFI <-.WiFi 802.11 AP.-> IOS
```

### 3.2 Logical Architecture

| Layer | Responsibility | Realized by |
|---|---|---|
| Optics | Form image at film plane | K-mount lens + K1000 mirror/shutter |
| Sense | Convert image to digital | IMX283 + cover glass + ribbon |
| Capture trigger | Detect shutter event | PC-sync → opto → GPIO ISR |
| Image pipeline | ISP, encode, store | libcamera + Pi 5 ISP + gstreamer |
| Transport | Deliver preview + control | WebRTC (preview) + REST/WS (control) |
| Presentation | Viewfinder + gallery + controls | iOS Safari PWA |
| Power | Run camera 4+ hr | PiSugar PMIC + Li-ion + USB-C charger |
| Storage | Persist frames | USB-SSD (proto) → eMMC/µSD (production TBD) |

### 3.3 Physical Architecture

- **Film cavity (LHS, donor area):** sensor PCB + alignment shim + FFC strain relief
- **Film cavity (RHS, take-up spool area):** Pi 5 or candidate rear-hump enclosure decision (see open question OQ-1)
- **Bottom plate or rear hump:** PiSugar battery, PMIC, USB-C port
- **Internal harness:** MIPI FFC (sensor→Pi), 2-wire trigger (PC-sync→opto board), USB-C power
- **External I/O:** USB-C charge port; status LED

### 3.4 Architecture Trade-Off Notes

These choices were made up-front in the ConOps; recording the rationale for traceability rather than re-running formal trade studies:

| Decision | Chosen | Considered alternatives | Why chosen |
|---|---|---|---|
| Compute | Raspberry Pi 5 (4 GB) | Pi CM4 + custom carrier, Jetson Orin Nano, industrial cam SoC | Pi 5 has the bandwidth + ISP + community for libcamera/gstreamer. CM4 + carrier is a P5/P6 cost-reduction path, not a P1 risk to take. |
| Sensor | IMX283 (Type 1") | IMX477 (smaller crop, smaller MP), Sony IMX571 APS-C industrial (~$800+) | IMX283 is the best price/crop available on Pi without crossing $800. 2.7× crop is the accepted user constraint. |
| Preview transport | WebRTC | MJPEG, HLS, native UDP-RTP | Only WebRTC meets the 120 ms target on Safari without an app. MJPEG retained as a fallback test path. |
| UI surface | iOS Safari PWA | Native iOS app, dedicated rear screen on body | No rear-screen modification of the K1000. PWA avoids App Store. |
| Shutter sync | PC-sync → opto → GPIO | Optical pickup on shutter curtain, mirror-up microswitch | PC-sync is the only intended-for-this electrical signal on a K1000. Other paths would require body modification. |
| Power | PiSugar 3 Plus (5000 mAh) | Custom Li-ion + PMIC design | PiSugar is off-the-shelf and meets the 4 hr runtime target. Custom PMIC is a P5/P6 cost-down move. |

---

## 4. Interface Specifications

| Name | Endpoints | Type | Spec | Criticality |
|---|---|---|---|---|
| IF-OPT-01 | K-mount lens ↔ Sensor plane | Optical | 45.46 mm flange distance, parallel within 0.02°, decenter ≤ 0.10 mm. Cover glass thickness compensated to film stack (~0.13 mm equiv.). | Critical |
| IF-MIPI-01 | IMX283 module ↔ Pi 5 CSI | Electrical / digital | MIPI CSI-2, 4-lane, 22-pin 0.5 mm FFC (Arducam pinout); ≤ 200 mm cable; ribbon flat, no kinks. | Critical |
| IF-TRG-01 | K1000 PC-sync ↔ Trigger conditioner | Electrical | Floating mechanical contact closure, no defined voltage. Trigger conditioner provides pull-up + opto-isolator + debounce; output to Pi GPIO 3.3 V CMOS, rising edge < 50 µs, jitter ≤ 2 ms (REQ-024). | Critical |
| IF-GPIO-01 | Trigger conditioner ↔ Pi 5 GPIO | Electrical / digital | 3.3 V CMOS, single GPIO line + GND. Falling-edge interrupt enabled. ESD-protected at Pi input. | High |
| IF-PWR-01 | PiSugar PMIC ↔ Pi 5 | Electrical | 5 V / ≥ 3 A regulated via Pi 5 power input pads or USB-C PD. Brown-out flag to GPIO for graceful shutdown. | Critical |
| IF-PWR-02 | USB-C port ↔ PiSugar | Electrical | USB-C PD 5 V / 1.5 A minimum charge input. Charge LED. Hot-plug while operating must not disturb image pipeline. | High |
| IF-STG-01 | Pi 5 ↔ Storage device | USB 3.0 | Prototype: USB-A or USB-C SSD, 256 GB, ≥ 200 MB/s sustained write. ext4 filesystem. Production: eMMC or µSD TBD. | High |
| IF-NET-01 | Pi 5 WiFi ↔ iPhone | RF / 802.11 | 802.11ac (or ax) AP on 5 GHz, channel auto, WPA2-PSK; SSID `K1000-D`; subnet 192.168.50.0/24; Pi at .1, DHCP for iPhone. | Critical |
| IF-API-01 | Pi 5 (FastAPI) ↔ PWA | Application | HTTPS REST + WebSocket. Endpoints: `POST /capture`, `GET /frames`, `GET /frames/{id}`, `DELETE /frames/{id}`, `GET /settings`, `PUT /settings`, `WS /events`. JSON payloads. Self-signed TLS cert acceptable for Phase 1. | High |
| IF-RTC-01 | Pi 5 (gstreamer) ↔ PWA | Media transport | WebRTC, H.264 baseline, 1080p30, target bitrate 4 Mbps, signaling over WS via `/webrtc/offer`. STUN not needed on local AP. | Critical |
| IF-MNT-01 | Insert chassis ↔ K1000 body | Mechanical | Three-point registration to K-mount flange + film rail; no permanent fasteners. Hand-removable. | High |
| IF-HMI-01 | User ↔ Status LED | Visual | RGB LED on rear or top of insert: green=ready, blue=capturing, amber=charging, red=fault/low-batt. Visible with film door closed. | Medium |

### 4.1 Interface Failure-Mode Notes

These are the highest-risk interface behaviors that the specialists need to design defensively against:

- **IF-OPT-01:** focus error scales with `Δd × f / (f - d)²`. At 45.46 mm with f = 50 mm, a 0.1 mm shim error throws infinity focus off by visible amounts on a 20 MP sensor. The tolerance budget (ANL-01) is not optional.
- **IF-TRG-01:** PC-sync is a mechanical contact, not a logic signal. Expect contact bounce on the order of 100s of µs and inductive ringing if there is any cable inductance. Trigger conditioner must debounce in hardware (RC + Schmitt) *and* the firmware ISR must mask re-entries for ~10 ms after the first edge.
- **IF-MIPI-01:** MIPI CSI-2 FFC routing inside a metal camera body raises EMC concerns; keep the ribbon as short as physically possible and shield the underside if practical.
- **IF-NET-01:** iPhones aggressively drop WiFi networks with no internet route. Pi 5 must either provide a captive portal page or respond to the iOS network probe URL to keep the iPhone associated.
- **IF-RTC-01:** Safari WebRTC defaults can renegotiate codec mid-stream; pin the offer to a single H.264 profile to avoid glitches.

---

## 5. V&V Plan

### 5.1 Pre-Prototype Analyses

| Analysis | Purpose | Owner | Drives |
|---|---|---|---|
| ANL-01: Optical alignment tolerance budget | Stack tolerances of sensor PCB flatness + shim + insert frame + K-mount flange. Confirm ± 0.05 mm achievable. | MCAD + Systems | REQ-030, REQ-031, REQ-032 |
| ANL-02: Cover-glass / film-stack optical compensation | Compute focus-plane shift caused by sensor cover glass vs. 0.13 mm film stack; confirm acceptable defocus at infinity. | MCAD + Systems | REQ-037 |
| ANL-03: Cavity volumetric study | CAD-measure film cavity vs. Pi 5 + battery footprint. Decide internal vs. rear-hump packaging. | MCAD | REQ-033, REQ-034, OQ-1 |
| ANL-04: Thermal budget | Pi 5 + IMX283 worst-case dissipation in closed cavity, 40 °C ambient. | MCAD + ELEC | REQ-063 |
| ANL-05: Power budget | Average + peak current under preview, capture, idle; derive battery hours. | ELEC | REQ-025, REQ-026 |
| ANL-06: BOM cost rollup | Qty 1, 10, 100, 1000 BOM with sourcing risk. | Supply Chain | REQ-060, REQ-061 |
| ANL-07: PC-sync electrical characterization | Scope-capture rise time, bounce, voltage range of K1000 PC contact. | ELEC | REQ-043, REQ-044, IF-TRG-01 |

### 5.2 Verification per Requirement

| REQ | Verification Method | Test/Analysis Description | Stage |
|---|---|---|---|
| REQ-001 | T | Trigger shutter at all available speeds; confirm captured frame written. | System integration |
| REQ-002 | I | Visual inspection + before/after photo of unmodified body. | Subsystem (mech) |
| REQ-003 | D | Live preview demo on paired iPhone. | System integration |
| REQ-004 | T | Wireshark / iOS network panel: confirm AP up, DHCP, connectivity. | Subsystem (FW) |
| REQ-005 | D | PWA UI walkthrough. | App acceptance |
| REQ-006 | T | Capture, pull files, verify JPEG header, DNG validity. | Subsystem (FW) |
| REQ-007 | T | Bench fixture: simulate PC contact closure, scope GPIO + verify capture. | Subsystem (ELEC/FW) |
| REQ-008 | T | Continuous-shoot script; measure resume-to-preview interval. | System integration |
| REQ-009 | D | PWA gallery + delete + download. | App acceptance |
| REQ-010 | D | Configure cloud target, verify upload when WAN present. | App acceptance |
| REQ-011 | D | Toggle each setting via PWA, confirm effect. | App acceptance |
| REQ-012 | I | LED + PWA status banner visible during all power states. | Subsystem (FW) |
| REQ-020 | T | Measure glass-to-iPhone latency with high-fps camera or LED timestamp method; 95th pct ≤ 120 ms. | System integration |
| REQ-021 | T | Pull RAW file, verify 5472×3648 (or equivalent) pixel count. | Subsystem (FW) |
| REQ-022 | T | Stopwatch (logged): capture event → thumbnail visible. | System integration |
| REQ-023 | T | 5-frame burst, all captured and stored. | System integration |
| REQ-024 | T | Scope: time from PC closure to sensor exposure window. | Subsystem (ELEC/FW) |
| REQ-025 | T | Field run with continuous preview; log runtime to brown-out. | System integration |
| REQ-026 | T | Mixed-use script; count captures to brown-out. | System integration |
| REQ-030 | I | CMM or jig measurement of sensor-to-flange distance on assembled insert. | Subsystem (mech) |
| REQ-031 | I | Autocollimator or laser-tilt measurement on jig. | Subsystem (mech) |
| REQ-032 | I | Optical centering target image vs. lens axis on jig. | Subsystem (mech) |
| REQ-033 | I | Trial fit in donor K1000; close door. | Subsystem (mech) |
| REQ-034 | I | Close + latch test. | Subsystem (mech) |
| REQ-035 | I | Remove insert; reinstall film back; trial-load film. | Subsystem (mech) |
| REQ-036 | I | Photo audit of donor body before/after. | Subsystem (mech) |
| REQ-037 | A | Optical analysis (ANL-02). Verified at REQ-030 with real lens at infinity. | Analysis + system |
| REQ-040 | I | Confirm no wiring penetrates camera electronics (camera has none). | Subsystem (mech/elec) |
| REQ-041 | I | BOM + assembly inspection. | Subsystem (elec) |
| REQ-042 | T | Charge from depleted to 80% on USB-C PD source; log current. | Subsystem (elec) |
| REQ-043 | T | Repeated trigger cycles → confirm Pi GPIO still alive. | Subsystem (elec) |
| REQ-044 | I | Schematic + part inspection for opto / TVS. | Subsystem (elec) |
| REQ-045 | T | Run to brown-out; confirm filesystem clean on next boot. | Subsystem (FW) |
| REQ-050 | D | Open `https://k1000-d.local/` on iPhone Safari. | App acceptance |
| REQ-051 | D | Install-to-home-screen flow on iOS 17+ Safari; no app store. | App acceptance |
| REQ-052 | I | gstreamer pipeline config inspection. | Subsystem (FW) |
| REQ-053 | I | API spec review + endpoint smoke test. | Subsystem (FW/app) |
| REQ-054 | T | Cold boot timer to AP-ready + PWA-connectable. | Subsystem (FW) |
| REQ-055 | D | PWA shutdown → Pi halts cleanly. | App acceptance |
| REQ-060 | A | BOM cost report at qty 1. | Analysis |
| REQ-061 | A | BOM cost report at qty 100 / 1000. | Analysis |
| REQ-062 | I | Scale weigh-in of integrated camera. | System integration |
| REQ-063 | T | Thermal chamber: 0 / 25 / 40 °C, run continuous preview 1 hr. | System acceptance |
| REQ-064 | T | Storage at -10 / +60 °C, 4 hr, then power-on test. | System acceptance |
| REQ-065 | D | Independent hobbyist installs the insert using only the docs. | System acceptance |

### 5.3 Verification Stage Gates

1. **Bench** — sensor + Pi imaging pipeline working on the desk, no K1000.
2. **Optical fixture** — alignment jig proves IF-OPT-01 budget achievable.
3. **Prototype-1 integration** — insert in donor K1000, full system test.
4. **Field test** — 2-week real-use trial by user.
5. **Acceptance** — full V&V matrix passes; sign-off against ConOps.

### 5.4 Traceability Summary

| Source (ConOps §) | REQs derived |
|---|---|
| §1 Mission, §3 Operational Concept | REQ-001, REQ-002, REQ-007 |
| §3 Operational Concept (PWA / preview) | REQ-003, REQ-004, REQ-005, REQ-008, REQ-009, REQ-050–055, REQ-020, REQ-022 |
| §4 Decision: IMX283 | REQ-021 |
| §4 Decision: PiSugar / power | REQ-025, REQ-026, REQ-040–045 |
| §4 Decision: WebRTC | REQ-020, REQ-052 |
| §5 Constraints: optical | REQ-030, REQ-031, REQ-032, REQ-037 |
| §5 Constraints: mechanical | REQ-033, REQ-034, REQ-035, REQ-036 |
| §5 Constraints: budget | REQ-060, REQ-061, REQ-062 |
| §5 Constraints: latency | REQ-020 |
| §5 Constraints: crop factor | (informational, no derived REQ) |
| §7 Phase 1 deliverables | drives this document set |

---

## 6. Key Risks (Top 5)

Severity (S) and Likelihood (L): 1 = low, 5 = high. Risk score = S × L.

| ID | Risk | S | L | Score | Mitigation |
|---|---|---|---|---|---|
| RISK-01 | Sensor cannot be aligned to 45.46 mm ± 0.05 mm with affordable mechanical hardware. Infinity focus fails. | 5 | 4 | 20 | Build alignment jig early (ANL-01). Use shim-pack adjustment, not single-pour part. Validate with collimator and known-infinity lens before locking insert geometry. |
| RISK-02 | Pi 5 + battery + SSD do not fit inside the K1000 film cavity; require external rear hump that compromises aesthetic and reversibility (REQ-035). | 4 | 4 | 16 | ANL-03 first. If hump unavoidable, design it as a clip-on attachment with a single FFC pass-through so the body itself stays unmodified. Get user sign-off on cosmetic trade. |
| RISK-03 | WebRTC latency on Pi 5 over self-hosted AP exceeds 120 ms in practice (REQ-020). Viewfinder feels laggy → product unusable. | 5 | 3 | 15 | Stand up a non-K1000 bench pipeline in week 1; measure real latency. If marginal, fall back to a lower-resolution preview (720p) or hardware-encoded H.264. Have a UDP-RTP fallback path designed. |
| RISK-04 | PC-sync timing on K1000 is too inconsistent (bounce, late edge, mechanical wear) to capture cleanly synced with sensor exposure window (REQ-024). | 4 | 3 | 12 | ANL-07 first — scope-characterize the PC contact on the actual donor body. Trigger conditioner with debounce + opto. Firmware-side: pre-arm sensor for "next frame" rather than expecting precise sync. |
| RISK-05 | Production BOM at qty 100/1000 does not hit ≤ $300 / ≤ $200 (REQ-061) — Pi 5 alone is $60–$80 and IMX283 module is $50+. | 3 | 4 | 12 | Supply Chain to model alternates (CM4 + custom carrier, direct IMX283 sourcing, eMMC over SSD). Acknowledge prototype is cost-uncapped; production cost target is a separate gate, not a blocker for proto-1. |

Additional watch-items (lower score but track): donor K1000 sourcing risk, iOS Safari WebRTC quirks across iOS versions, thermal throttling of Pi 5 in closed cavity.

---

## 7. Phase Plan

| Phase | Goal | Entry criteria | Exit / gating criteria |
|---|---|---|---|
| **P0 — Concept** (this engagement) | ConOps, requirements, architecture, V&V plan, BOM model | User brief | This briefing + downstream specialist deliverables (mech, elec, fw, sc, dfm) all complete and reviewed |
| **P1 — Bench prototype** | Pi 5 + IMX283 + PWA working on the bench, no K1000. Validate REQ-020, REQ-021, IF-NET-01, IF-RTC-01, IF-API-01. | P0 sign-off; parts on hand | Live PWA preview ≤ 120 ms; capture works from a button (proxy for X-sync); RAW + JPEG saved |
| **P2 — Optical fixture** | Alignment jig + tolerance-budget proof. Validate ANL-01, ANL-02, REQ-030/031/032/037. | P1 done | Sharp infinity focus through a real K-mount lens onto the IMX283 at 45.46 mm |
| **P3 — Prototype-1 (donor K1000)** | Full insert in a real K1000. Validate REQ-001, REQ-007, REQ-024, IF-TRG-01, IF-MNT-01, REQ-033/034. | P2 done; donor body acquired; mech parts printed/machined | End-to-end shot: shutter press → frame on PWA. All "Must" reqs pass on bench. |
| **P4 — Field test** | User shoots for 2+ weeks in real conditions. Validate REQ-025, REQ-026, REQ-063, REQ-065. | P3 done | User signs off on UX, reliability, and battery life. Defect list scoped to "fix in P5 or descope." |
| **P5 — Small batch (qty ~10)** | Repeatable build. Validate REQ-061 trajectory, manufacturing procedure, DFM gaps. | P4 sign-off; supply chain releases v1 BOM | 10 units built by documented procedure; yield ≥ 80%; per-unit cost within 20% of model |
| **P6 — Production (qty 100+)** | Production tooling, jig-built units, support docs. | P5 sign-off; production design freeze; cost target met | Qty 100 built; field defect rate < 5%; cost ≤ $300/unit at qty 100 |

Gate reviews are owned by Systems Engineer with sign-off from affected specialists.

---

## 8. Open Questions to Specialists

Carried from the ConOps and surfaced by this analysis. Each needs an owning specialist response before P1 exit.

| ID | Owner | Question |
|---|---|---|
| OQ-1 | MCAD | Does Pi 5 + 5000 mAh battery fit inside the film cavity, or do we need a rear hump? (drives REQ-033, IF-MNT-01, RISK-02) |
| OQ-2 | MCAD / Systems | Cover-glass compensation for the IMX283 module — what shim adjustment vs. nominal 45.46 mm is required? (drives REQ-037, ANL-02) |
| OQ-3 | PCB Designer | PC-sync electrical behavior: clean enough for direct GPIO, or required opto/level-shift design? (drives REQ-043/044, ANL-07) |
| OQ-4 | Firmware | Can Pi 5 + IMX283 run 1080p30 preview while also handling 20 MP capture on the same MIPI link, or do we have to drop preview during capture? (drives REQ-008, REQ-023) |
| OQ-5 | Supply Chain | Donor K1000 sourcing path at qty 100 — viable, or do we need a clean-sheet body? (drives RISK-02 long-term and REQ-061) |
| OQ-6 | Firmware / App | iOS Safari WebRTC compatibility across iOS 17 / 18 — any device-class gotchas worth knowing? (drives REQ-020, REQ-051) |

---

*End of briefing. All P1 work traces to the REQ-IDs in §1.*
