# StoveIQ Implementation Plan

**Version:** 1.0
**Last Updated:** 2026-03-26
**Status:** Draft

---

## Table of Contents

1. [Overview & Timeline](#1-overview--timeline)
2. [Phase 1: Proof of Concept (Weeks 1-4)](#2-phase-1-proof-of-concept-weeks-1-4)
3. [Phase 2: Core Firmware (Weeks 5-10)](#3-phase-2-core-firmware-weeks-5-10)
4. [Phase 3: Mobile App MVP (Weeks 8-14)](#4-phase-3-mobile-app-mvp-weeks-8-14)
5. [Phase 4: Cloud Backend (Weeks 10-16)](#5-phase-4-cloud-backend-weeks-10-16)
6. [Phase 5: Integration & Testing (Weeks 14-18)](#6-phase-5-integration--testing-weeks-14-18)
7. [Phase 6: Hardware Design (Weeks 12-20)](#7-phase-6-hardware-design-weeks-12-20)
8. [Phase 7: Pre-Launch (Weeks 18-24)](#8-phase-7-pre-launch-weeks-18-24)
9. [Phase 8: Kickstarter Campaign (Weeks 24-28)](#9-phase-8-kickstarter-campaign-weeks-24-28)
10. [Phase 9: Manufacturing & Fulfillment (Weeks 28-40+)](#10-phase-9-manufacturing--fulfillment-weeks-28-40)
11. [Shopping List: Phase 1 Starter Kit](#11-shopping-list-phase-1-starter-kit)
12. [Critical Path Analysis](#12-critical-path-analysis)
13. [Risk Register](#13-risk-register)

---

## 1. Overview & Timeline

### 1.1 Master Schedule

```
Week:  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 39 40
Ph 1:  ████████████████
Ph 2:                  ████████████████████████████████████████
Ph 3:                           ████████████████████████████████████████████████████████████████
Ph 4:                                          ████████████████████████████████████████████████
Ph 5:                                                              ████████████████████████████████████████
Ph 6:                                    ████████████████████████████████████████████████████████████████████
Ph 7:                                                                          ████████████████████████████████
Ph 8:                                                                                              ████████████████
Ph 9:                                                                                                          ████████████████████████████
```

### 1.2 Major Milestones

| Milestone | Target Week | Description |
|-----------|-------------|-------------|
| M1: Sensor Validated | Week 4 | MLX90640 produces usable per-burner data at angle |
| M2: Firmware Alpha | Week 10 | All 8 tasks running, alerts firing on local device |
| M3: App MVP | Week 14 | Heat map visible, provisioning works, alerts push to phone |
| M4: Cloud Connected | Week 16 | Remote alerts, OTA, full end-to-end data flow |
| M5: Integration Complete | Week 18 | Passes all integration and reliability tests |
| M6: PCB Prototype | Week 20 | Custom PCB assembled and booted |
| M7: Certifications Filed | Week 22 | FCC pre-scan passed, submission package filed |
| M8: Campaign Ready | Week 24 | Video done, page live, press kit distributed |
| M9: Campaign Funded | Week 28 | Kickstarter campaign completes successfully |
| M10: Units Shipped | Week 40+ | Backers receive product |

### 1.3 Total Estimated Effort

| Phase | Duration | Estimated Person-Days | Parallel? |
|-------|----------|-----------------------|-----------|
| Phase 1 | 4 weeks | 15 days | No — serial |
| Phase 2 | 6 weeks | 25 days | No — serial |
| Phase 3 | 7 weeks | 28 days | Yes — overlaps Ph 2 |
| Phase 4 | 7 weeks | 22 days | Yes — overlaps Ph 3 |
| Phase 5 | 5 weeks | 18 days | Yes — follows Ph 2-4 |
| Phase 6 | 9 weeks | 30 days | Yes — overlaps Ph 2-5 |
| Phase 7 | 7 weeks | 20 days | Yes — overlaps Ph 5-6 |
| Phase 8 | 4 weeks | 12 days | Yes — overlaps Ph 6-7 |
| Phase 9 | 12 weeks | 40 days | Sequential — post campaign |
| **Total** | **~40 weeks** | **~210 days** | Solo: ~10 months |

---

## 2. Phase 1: Proof of Concept (Weeks 1-4)

### Goal

Validate that the MLX90640 mounted at an angle produces per-burner-discriminable thermal data on a real stovetop. This is the highest-risk assumption in the entire project.

### 2.1 Task Breakdown

#### 2.1.1 Hardware Procurement (Week 1, Days 1-2)
- **Task:** Order all Phase 1 hardware (see Shopping List section)
- **Dependencies:** None
- **Effort:** 0.5 days (ordering), 1.5 days waiting for delivery
- **Skills:** None
- **Definition of Done:** All components received and verified against order

#### 2.1.2 Development Environment Setup (Week 1, Days 2-3)
- **Task:** Install ESP-IDF v5.x toolchain, Python environment, VS Code with ESP-IDF extension
- **Dependencies:** Computer with macOS/Linux
- **Effort:** 1 day
- **Skills:** Basic firmware dev setup
- **Steps:**
  - Install ESP-IDF via `install.sh` (official Espressif script)
  - Install Python 3.11+, pip, virtualenv
  - Install VS Code + ESP-IDF extension + C/C++ IntelliSense
  - Flash ESP32-S3 DevKit "Hello World" to confirm toolchain works
  - Install Arduino IDE as fallback (for rapid prototyping if ESP-IDF setup is slow)
- **Definition of Done:** "Hello World" running on ESP32-S3, serial output visible

#### 2.1.3 MLX90640 Basic Read (Week 1-2, Days 3-5)
- **Task:** Wire MLX90640 breakout to ESP32-S3 DevKit and read raw thermal frames
- **Dependencies:** Hardware received, dev environment up
- **Effort:** 2 days
- **Skills:** Basic I2C wiring, ESP-IDF I2C API
- **Steps:**
  - Wire SDA/SCL/VCC/GND between breakout and DevKit (I2C at 3.3V)
  - Set I2C clock to 400kHz (MLX90640 fast mode)
  - Port or adapt Melexis Arduino library to ESP-IDF (or use existing ESP-IDF component)
  - Read 768-pixel frame (32x24) and print to serial as CSV
  - Confirm frame rate achievable at 4Hz and 8Hz
- **Definition of Done:** 768 temperature values printing to serial at 4+ FPS, values are physically plausible (room temp ~22C)

#### 2.1.4 Python Thermal Visualizer (Week 2, Days 5-7)
- **Task:** Write a Python script to receive serial data and render a real-time heat map
- **Dependencies:** MLX90640 basic read working
- **Effort:** 1.5 days
- **Skills:** Python, matplotlib or pyqtgraph
- **Steps:**
  - Serial listener that reads CSV frames from USB COM port
  - Render 32x24 grid as color-mapped image (matplotlib imshow with 'hot' or 'inferno' colormap)
  - Apply bilinear interpolation to upscale display to 256x192 for visual quality
  - Overlay temperature values at cursor position
  - Add frame rate counter
  - Optional: Save frame sequences to disk for later analysis
- **Definition of Done:** Real-time heat map rendering at 4+ FPS with temperature values visible

#### 2.1.5 Mounting Angle Testing (Week 2-3, Days 7-12)
- **Task:** Test MLX90640 at 30°, 45°, and 60° mounting angles and document results
- **Dependencies:** Python visualizer working
- **Effort:** 3 days
- **Skills:** Observation, documentation
- **Steps:**
  - Build simple test rig: cardboard/wood mount that holds sensor at each angle above stove
  - Test with stove OFF: confirm room-temp baseline, check for thermal artifacts from appliance body
  - Test with ONE burner ON (gas and electric separately if available):
    - Can you visually distinguish the active burner in the heat map?
    - How does the blob shape change with mounting angle?
    - Measure apparent temperature vs IR thermometer ground truth
  - Test with TWO ADJACENT burners ON:
    - Can you discriminate two adjacent burners at each angle?
    - What is the minimum detectable separation?
  - Test with ALL FOUR burners ON at different heat levels
  - Test steam interference: boil a pot of water and observe steam artifacts
  - Test at different mounting heights: 18 inches, 24 inches, 30 inches above stovetop
  - Photograph the physical setup and annotate raw heat map images
- **Definition of Done:** Documented matrix of angle vs. burner discrimination, recommendation for optimal mounting angle

#### 2.1.6 Gas vs. Electric Stove Characterization (Week 3, Days 10-12)
- **Task:** Document thermal signature differences between gas and electric stoves
- **Dependencies:** Mounting angle testing
- **Effort:** 1.5 days
- **Skills:** Observation
- **Steps:**
  - Gas stove: IR signature of flame ring, thermal gradient from center to edge, pilot light artifacts
  - Electric stove: Coil heat distribution, glass-top heat conduction patterns
  - Induction stove (if accessible): Pan-only heating, nearly zero stovetop thermal signature — document as known limitation
  - Note: Does the sensor detect the gas flame directly, or only the heated grate/burner cap?
  - Document minimum "on" temperature threshold that reliably distinguishes ON from OFF for each stove type
- **Definition of Done:** Written characterization of each stove type with annotated heat map screenshots

#### 2.1.7 Perspective Correction Prototype (Week 3-4, Days 12-15)
- **Task:** Implement basic perspective correction in Python to transform angled view to top-down
- **Dependencies:** Mounting angle data collected
- **Effort:** 2 days
- **Skills:** Python, OpenCV (or NumPy homography)
- **Steps:**
  - Install OpenCV (`pip install opencv-python`)
  - Manual 4-point calibration: user clicks 4 corners of stovetop in heat map image
  - Compute homography matrix from 4-point correspondence
  - Apply `cv2.warpPerspective()` to transform heat map to top-down view
  - Verify burner positions are where expected after correction
  - Test with multiple stored frame captures
- **Definition of Done:** Python script produces top-down-view heat map from angled sensor data with correct burner positions

#### 2.1.8 Phase 1 Documentation (Week 4, Days 14-15)
- **Task:** Write up findings and go/no-go recommendation
- **Dependencies:** All testing complete
- **Effort:** 1 day
- **Skills:** Technical writing
- **Deliverable:** `docs/poc-report.md` with:
  - Recommended mounting angle
  - Recommended mounting height
  - Known limitations by stove type
  - Perspective correction approach validated
  - Go/no-go decision and rationale

### 2.2 Phase 1 Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| MLX90640 cannot discriminate adjacent burners at any angle | Medium | Critical | Test all angles before concluding; if needed, use two sensors at different angles; consider MLX90641 (higher resolution variant) |
| Steam completely overwhelms the thermal signal | Medium | High | Steam is transient; implement temporal averaging; alert can pause during boiling |
| Induction stoves produce no detectable signal | High | Low | Document as unsupported v1 use case; the 50M+ non-induction US stoves are the market |
| Component delivery takes >2 weeks | Low | Medium | Order from Adafruit/DigiKey (fast ship), not AliExpress |
| Gas flame creates sensor-saturating hot spots | Low | Medium | MLX90640 max measurable temp is 300C; gas burner grates reach ~250C; should be within range |

### 2.3 Phase 1 Definition of Done (Phase Level)

- [ ] MLX90640 reads 768-pixel thermal frames at 4+ Hz
- [ ] Python visualizer displays real-time heat map with temperature values
- [ ] Tested on at least one real stovetop (gas or electric)
- [ ] All four burners are individually discriminable at recommended mounting angle
- [ ] Perspective correction prototype produces usable top-down view
- [ ] Phase 1 report written with go/no-go recommendation
- [ ] **Critical gate:** Per-burner discrimination validated before proceeding to Phase 2

---

## 3. Phase 2: Core Firmware (Weeks 5-10)

### Goal

Build production-quality ESP32-S3 firmware with all eight FreeRTOS tasks, perspective correction, burner state machines, alert logic, WiFi provisioning, WebSocket server, and MQTT client.

### 3.1 Task Breakdown

#### 3.1.1 ESP-IDF Project Structure (Week 5, Day 1)
- **Task:** Set up the ESP-IDF project skeleton, CMakeLists, component structure, and CI
- **Dependencies:** Phase 1 complete
- **Effort:** 1 day
- **Skills:** ESP-IDF, CMake, Git
- **Steps:**
  - Create `stoveiq-firmware` repo with proper `.gitignore` for ESP-IDF
  - Set up component directory structure: `components/sensor`, `components/processing`, `components/network`, `components/alerts`, `components/storage`
  - Configure `sdkconfig.defaults` with baseline settings (PSRAM enabled, stack sizes, log levels)
  - Set up GitHub Actions CI: build check on every push (no hardware required)
  - Set up `idf.py menuconfig` baseline for I2C, WiFi, BLE, PSRAM, OTA
- **Definition of Done:** `idf.py build` succeeds from clean checkout; CI pipeline green

#### 3.1.2 Sensor Acquisition Task (Week 5, Days 1-3)
- **Task:** Implement `sensor_task` — reads MLX90640 at 8Hz into a ring buffer
- **Dependencies:** Project structure
- **Effort:** 2 days
- **Skills:** ESP-IDF I2C, FreeRTOS queues
- **Steps:**
  - Port MLX90640 driver to ESP-IDF component (wrap Melexis reference library in ESP-IDF I2C calls)
  - Create FreeRTOS task pinned to Core 0
  - Allocate frame buffer in PSRAM (32x24 floats = 3KB per frame)
  - Implement ring buffer of 8 frames for temporal averaging
  - Publish frames to `raw_frame_queue` (FreeRTOS queue, depth 4)
  - Implement I2C error recovery (NACK retry with exponential backoff)
  - Log frame rate counter; assert >= 7.5 Hz
- **Definition of Done:** Sensor task runs 1000 frames without I2C errors; frame rate >= 7.5 Hz verified

#### 3.1.3 Noise Reduction & Frame Processing Task (Week 5-6, Days 3-6)
- **Task:** Implement `processing_task` — temporal averaging, dead pixel correction, NUC
- **Dependencies:** Sensor task
- **Effort:** 2 days
- **Skills:** DSP basics, C
- **Steps:**
  - Temporal average: running average of 4 frames (reduces noise significantly on 32x24 array)
  - Dead pixel detection: pixels with value > 3 sigma from neighbors interpolated from 4-neighbors
  - Non-Uniformity Correction (NUC): apply per-pixel gain/offset calibration constants stored in NVS (factory calibration on first boot)
  - Publish processed frame to `processed_frame_queue`
  - Unit test: inject synthetic noisy frames, verify output is smoothed
- **Definition of Done:** Noise test passes; dead pixel injection and correction verified

#### 3.1.4 Perspective Correction Task (Week 6, Days 5-8)
- **Task:** Implement homography-based perspective correction in C on ESP32-S3
- **Dependencies:** Frame processing task; Python prototype from Phase 1
- **Effort:** 3 days
- **Skills:** Linear algebra (3x3 homography), C, fixed-point math
- **Steps:**
  - Port Python homography to C (3x3 float matrix, bilinear interpolation)
  - Store homography matrix in NVS (set during calibration)
  - Output: 32x24 top-down-corrected float array
  - Performance target: < 5ms on 240MHz ESP32-S3
  - Unit test: generate synthetic angled grid, verify correction produces aligned grid
  - Calibration protocol: 4-point tap in app → compute H matrix → store in NVS
- **Definition of Done:** Perspective correction runs in < 5ms; unit test passes; calibration round-trips correctly through NVS

#### 3.1.5 Burner Mapper (Week 6-7, Days 8-10)
- **Task:** Implement burner region storage and per-burner temperature extraction
- **Dependencies:** Perspective correction
- **Effort:** 2 days
- **Skills:** C, computational geometry
- **Steps:**
  - Data structure: array of `burner_region_t` structs (center_x, center_y, radius, label)
  - Storage: 4-6 burner definitions in NVS, set during calibration
  - Extraction: for each burner region, compute max, mean, and 90th-percentile temp within circular mask
  - Publish `per_burner_temps[]` array to downstream queue
  - Unit test: synthetic heat map with known burner positions, verify extraction
- **Definition of Done:** Correctly extracts per-burner statistics from test heat maps; round-trips through NVS

#### 3.1.6 Burner State Machine (Week 7, Days 10-13)
- **Task:** Implement per-burner state machine: OFF → WARMING → ACTIVE → BOILING → COOLING
- **Dependencies:** Burner mapper
- **Effort:** 3 days
- **Skills:** State machine design, C
- **State Definitions:**
  - `OFF`: burner temp < 40C, duration > 10s
  - `WARMING`: burner temp 40-100C, rising
  - `ACTIVE`: burner temp > 100C (or > 40C for > 60s without reaching 100C)
  - `BOILING`: boil detection algorithm triggering (see 3.1.7)
  - `COOLING`: burner was ACTIVE/BOILING, now < 80C and falling, last active < 5 min ago
- **Steps:**
  - Implement state machine per burner with hysteresis (debounce transitions with 3-frame confirmation)
  - Timestamps: record state transition times in RTC memory (survives deep sleep if ever implemented)
  - Publish state changes to `state_change_queue`
  - Unit test: inject temperature sequences, verify correct state transitions
- **Definition of Done:** All state transitions verified by unit test with 100% branch coverage; hysteresis prevents flapping on noisy data

#### 3.1.7 Boil Detection Algorithm (Week 7, Days 12-14)
- **Task:** Implement boil detection based on temperature variance and rate-of-change
- **Dependencies:** Burner state machine
- **Effort:** 2 days
- **Skills:** Signal processing, C
- **Algorithm:**
  - Primary: temporal variance of burner max temp > threshold (boiling creates thermal turbulence visible as pixel variance)
  - Secondary: temperature plateau detection (temp stabilizes near 100C — boiling point)
  - Tertiary: if BME688 present — humidity spike detection
  - Confirmation: 3 of last 5 frames must trigger before BOILING state is entered
- **Steps:**
  - Implement variance computation over rolling 16-frame window using PSRAM buffer
  - Tune thresholds against Phase 1 recordings (replay stored frame sequences)
  - Unit test: replay known boiling sequences, verify detection
  - False positive test: rapid temperature increase (pan preheating) should NOT trigger boiling
- **Definition of Done:** Detects boiling in > 90% of test sequences; false positive rate < 5% on non-boiling high-heat sequences

#### 3.1.8 Alert Logic Task (Week 7-8, Days 14-17)
- **Task:** Implement local alert generation, deduplication, and rate limiting
- **Dependencies:** Burner state machine, boil detection
- **Effort:** 2.5 days
- **Skills:** C, FreeRTOS
- **Alert Types:**
  - `BURNER_LEFT_ON`: any burner in ACTIVE state for > N minutes (user-configurable: 15/30/60 min)
  - `HIGH_TEMP`: any burner exceeds 280C (near sensor saturation)
  - `BOILING_DETECTED`: burner enters BOILING state
  - `BURNER_ON_UNATTENDED`: motion sensor absent (future: PIR sensor) or time-of-day rule
  - `GAS_DETECTED`: BME688 VOC spike above threshold (if sensor present)
  - `DEVICE_OFFLINE`: lost WiFi / MQTT for > 5 min (generated by watchdog, not alert task)
- **Steps:**
  - Alert struct: type, burner_id, timestamp, severity (INFO/WARN/CRITICAL)
  - Deduplication: same alert type + burner_id suppressed for cooldown period (prevents spam)
  - Local alert delivery: piezo buzzer pattern per severity; RGB LED color coding
  - Publish to `alert_queue` for network delivery
  - Unit test: inject state sequences, verify correct alerts fire and deduplication works
- **Definition of Done:** All alert types fire correctly; deduplication prevents repeated identical alerts; piezo and LED respond correctly

#### 3.1.9 WiFi Provisioning via BLE (Week 8, Days 17-19)
- **Task:** Implement BLE-based WiFi credential provisioning using ESP-IDF Provisioning component
- **Dependencies:** Project structure
- **Effort:** 2 days
- **Skills:** ESP-IDF BLE Provisioning API
- **Steps:**
  - Use ESP-IDF `wifi_provisioning` component (Bluedroid or NimBLE transport)
  - Generate per-device BLE advertisement name: `StoveIQ-XXXX` (last 4 of MAC)
  - Implement provisioning state: device starts in AP mode if no credentials stored in NVS
  - On successful provisioning: store SSID/password to NVS, reboot to WiFi mode
  - Implement "reset to factory" button sequence (hold boot button 5 seconds clears NVS)
  - Compatible with ESP SoftAP Provisioning app (for testing); custom Flutter flow for production
- **Definition of Done:** Device provisions via Espressif test app; credentials survive reboot; factory reset works

#### 3.1.10 WebSocket Server (Week 8, Days 19-21)
- **Task:** Implement local WebSocket server for real-time frame streaming to mobile app
- **Dependencies:** WiFi provisioning
- **Effort:** 2 days
- **Skills:** ESP-IDF HTTP server, WebSocket, mDNS
- **Steps:**
  - Use ESP-IDF `esp_http_server` WebSocket support
  - Register mDNS service: `_stoveiq._tcp.local` with device name and IP
  - WebSocket endpoint: `ws://<device_ip>/stream`
  - Frame message format (binary): `[frame_type:1][timestamp:8][burner_states:N][thermal_data:3072]`
  - Streaming: push processed + perspective-corrected frame at 4Hz when client connected
  - REST endpoint: `GET /config` returns device info, calibration status, firmware version
  - REST endpoint: `POST /calibration` accepts homography matrix and burner regions
  - Limit to 2 concurrent WebSocket clients
- **Definition of Done:** Flutter test client (or `wscat`) receives frames at 4Hz; mDNS discovery works from phone on same network

#### 3.1.11 MQTT Client (Week 9, Days 21-23)
- **Task:** Implement MQTT client connecting to AWS IoT Core
- **Dependencies:** WebSocket server, AWS IoT Core setup (can use local Mosquitto for dev)
- **Effort:** 2.5 days
- **Skills:** ESP-IDF MQTT component, TLS certificates, AWS IoT
- **Steps:**
  - Use ESP-IDF `mqtt` component (ESP-MQTT)
  - TLS configuration: device certificate + private key provisioned at factory (stored in NVS encrypted partition)
  - Topic structure:
    - Publish: `stoveiq/{device_id}/telemetry` — frame summary at 1-minute intervals
    - Publish: `stoveiq/{device_id}/alerts` — alert events immediately (QoS 1)
    - Publish: `stoveiq/{device_id}/status` — heartbeat every 5 min
    - Subscribe: `stoveiq/{device_id}/config` — receive config updates from cloud
    - Subscribe: `stoveiq/{device_id}/commands` — receive OTA trigger, reboot, etc.
  - Device shadow: report current state (burner_states, firmware_version, uptime) every 5 min
  - Reconnect logic: exponential backoff, max 5 min between retries
  - Offline queue: buffer last 50 alerts in NVS; replay on reconnect
- **Definition of Done:** Device connects to local Mosquitto; publishes telemetry and alerts; receives config updates; reconnects after 60s WiFi interruption

#### 3.1.12 OTA Update Client (Week 9-10, Days 23-25)
- **Task:** Implement OTA firmware update via HTTPS from AWS S3
- **Dependencies:** MQTT client
- **Effort:** 2 days
- **Skills:** ESP-IDF OTA API, HTTPS
- **Steps:**
  - Use ESP-IDF `esp_https_ota` component
  - Trigger: MQTT command `{"action": "ota_update", "url": "https://...", "sha256": "..."}` or IoT Job
  - Verify SHA-256 of downloaded binary before applying
  - Use ESP32 dual OTA partitions (A/B rollback): if new firmware crashes before first successful boot, rollback to previous
  - Post-OTA: report new firmware version to device shadow
  - Safety: do not OTA while any burner is in ACTIVE/BOILING state
- **Definition of Done:** OTA completes successfully from S3 URL; rollback triggers on simulated crash; blocked during active cooking

#### 3.1.13 NVS Configuration Management (Week 9-10, Days 24-25)
- **Task:** Implement structured NVS read/write for all persistent config
- **Dependencies:** All task implementations that use NVS
- **Effort:** 1 day
- **Skills:** ESP-IDF NVS API
- **Config Namespaces:**
  - `wifi`: SSID, password, provisioning state
  - `device`: device_id, cloud_endpoint, certificates blob
  - `calibration`: homography_matrix (9 floats), burner_regions (6 structs), calibration_version
  - `alerts`: per-alert enable/disable, timeout thresholds
  - `user`: timezone, user_id (for cloud association)
- **Definition of Done:** All config round-trips correctly; encrypted NVS partition protects certificates

#### 3.1.14 Firmware Unit Tests (Week 10, Days 25-28)
- **Task:** Write and run unit tests for all algorithmic components
- **Dependencies:** All firmware tasks complete
- **Effort:** 3 days
- **Skills:** ESP-IDF Unity test framework
- **Test Suites:**
  - `test_perspective_correction.c`: 10 test cases with known inputs/outputs
  - `test_burner_state_machine.c`: all state transitions, edge cases, hysteresis
  - `test_boil_detection.c`: replay 5 known-boiling sequences, 5 non-boiling sequences
  - `test_alert_logic.c`: all alert types, deduplication, rate limiting
  - `test_nvs_config.c`: write/read round-trips for all config namespaces
- **Definition of Done:** All unit tests pass; > 80% line coverage on algorithmic components

### 3.2 Phase 2 Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Homography computation too slow on ESP32-S3 | Low | Medium | Use fixed-point math; SIMD via vector extensions; 240MHz is plenty |
| PSRAM latency causes frame drops at 8Hz | Low | High | Profile early; reduce frame rate to 4Hz if needed (acceptable) |
| BLE + WiFi simultaneously causes interference | Medium | Medium | Use BLE only during provisioning, then disable BLE stack; ESP32-S3 handles this well |
| AWS IoT Core TLS handshake time causes lag | Medium | Low | TLS session resumption after first connection; latency is one-time |
| Boil detection threshold too sensitive / insensitive | High | Medium | Tune against Phase 1 recordings; add user sensitivity preference setting |

### 3.3 Phase 2 Definition of Done

- [ ] All 8 FreeRTOS tasks running without watchdog triggers for 24h
- [ ] Sensor reads 7.5+ Hz, no I2C errors over 1000 frames
- [ ] Perspective correction: < 5ms execution time, unit test passing
- [ ] Burner state machine: all transitions verified, 100% branch coverage
- [ ] Boil detection: 90%+ detection rate on test sequences
- [ ] Alert logic: all types fire correctly, no false positives in 2h test run
- [ ] WiFi provisioning: credentials stored and survive reboot
- [ ] WebSocket: streams at 4Hz to connected client
- [ ] MQTT: connects to broker, publishes telemetry, survives reconnect
- [ ] OTA: completes successfully, rollback verified
- [ ] All unit tests passing

---

## 4. Phase 3: Mobile App MVP (Weeks 8-14)

### Goal

Build the Flutter app to the point where a real user can provision a device, complete calibration, view the live heat map, and receive push notifications.

### 4.1 Task Breakdown

#### 4.1.1 Flutter Project Setup (Week 8, Days 1-2)
- **Task:** Initialize Flutter project, configure Riverpod, set up CI/CD, configure iOS and Android targets
- **Dependencies:** None (can start in parallel with Phase 2)
- **Effort:** 1.5 days
- **Skills:** Flutter, Dart, Riverpod
- **Steps:**
  - `flutter create stoveiq_app --platforms ios,android`
  - Add dependencies: `flutter_riverpod`, `web_socket_channel`, `mqtt_client`, `flutter_blue_plus`, `shared_preferences`, `go_router`, `flutter_local_notifications`, `firebase_messaging`
  - Set up Riverpod `ProviderScope` at root
  - Configure iOS deployment target: iOS 16.0+
  - Configure Android min SDK: API 26 (Android 8.0+)
  - Set up GitHub Actions: `flutter analyze`, `flutter test` on PR
  - Set up app signing (development certs for now)
- **Definition of Done:** App builds and runs on iOS Simulator and Android Emulator; CI green

#### 4.1.2 BLE Provisioning Flow (Week 8-9, Days 2-5)
- **Task:** Implement the in-app BLE WiFi provisioning wizard
- **Dependencies:** Flutter setup; ESP-IDF provisioning implemented (or use Espressif test firmware)
- **Effort:** 3 days
- **Skills:** Flutter, flutter_blue_plus, BLE
- **Steps:**
  - Scan for BLE devices advertising `StoveIQ-XXXX` service UUID
  - UI: "Looking for your StoveIQ..." with animated scan indicator
  - Connect and authenticate via ESP32 provisioning protocol (SoftAP or BLE transport)
  - Show WiFi network picker (scan available networks, or manual SSID entry)
  - Transmit credentials to device over BLE encrypted channel
  - Poll for success: device connects to WiFi and reports back
  - Handle errors: wrong password, network not found, device out of range
- **Definition of Done:** Provisioning flow completes end-to-end with real ESP32-S3 device; error states handled

#### 4.1.3 Device Discovery & Connection (Week 9, Days 5-7)
- **Task:** Implement mDNS device discovery and WebSocket connection management
- **Dependencies:** BLE provisioning flow
- **Effort:** 2 days
- **Skills:** Flutter, mDNS, WebSocket
- **Steps:**
  - Use `multicast_dns` package to discover `_stoveiq._tcp.local` services
  - Fallback: manual IP entry if mDNS fails (common on some router configurations)
  - Establish WebSocket connection to `ws://<ip>/stream`
  - Implement connection state machine: DISCOVERING → CONNECTING → CONNECTED → RECONNECTING → OFFLINE
  - Riverpod `StreamProvider` wrapping WebSocket frame stream
  - Reconnect automatically after 30s if connection drops (device reboots, network hiccup)
- **Definition of Done:** App discovers device on LAN and maintains WebSocket connection through simulated disconnects

#### 4.1.4 Thermal Heat Map Renderer (Week 9-10, Days 7-11)
- **Task:** Implement the real-time heat map display widget
- **Dependencies:** WebSocket connection working
- **Effort:** 4 days (this is the hardest UI component)
- **Skills:** Flutter, custom painting, color mapping, interpolation
- **Steps:**
  - Parse binary WebSocket frame: extract 32x24 float array and burner state data
  - Color mapping: implement 'inferno' colormap (precomputed 256-entry LUT)
  - Bilinear interpolation: upscale 32x24 → 256x192 in Dart (isolate for performance)
  - Render via Flutter `CustomPainter` using `Canvas.drawImage()`
  - Temperature range: auto-scale to min/max in current frame; option for fixed scale
  - Overlay: burner region outlines, burner labels, temperature readouts
  - Frame rate: target 4fps rendering; use `RepaintBoundary` to isolate repaints
  - Performance test: heat map rendering must not drop below 30fps overall app frame rate
- **Definition of Done:** Real-time heat map renders at 4fps with burner overlays; no jank on mid-range Android device

#### 4.1.5 Calibration Wizard (Week 10-11, Days 11-15)
- **Task:** Implement the two-step calibration UI (perspective correction + burner mapping)
- **Dependencies:** Heat map renderer
- **Effort:** 4 days
- **Skills:** Flutter, gesture detection, computational geometry
- **Step 1 — Perspective Correction:**
  - Display frozen heat map from device
  - Instruct user: "Tap the four corners of your stovetop in order"
  - Draw draggable corner markers; show connecting trapezoid outline
  - "Looks good" → compute homography H from 4 screen-point → stove-point correspondences
  - Send H matrix to device via REST `POST /calibration`
  - Display corrected (top-down) preview for confirmation
- **Step 2 — Burner Mapping:**
  - Display top-down corrected heat map
  - Instruct user: "Tap the center of each burner"
  - Confirm burner count (2, 4, 5, or 6 burners)
  - Draw circle overlays for each tapped burner; user adjusts radius via pinch gesture
  - Label burners: Front-Left, Front-Right, Back-Left, Back-Right (+ Center/Rear for 5/6 burner)
  - Send burner regions to device
- **Recalibration:** accessible from Settings → "Recalibrate Burners"
- **Definition of Done:** Calibration wizard completes end-to-end; calibration data sent to device; top-down view renders correctly post-calibration

#### 4.1.6 Per-Burner Status Dashboard (Week 11, Days 15-18)
- **Task:** Implement the main dashboard screen showing per-burner status cards
- **Dependencies:** Heat map renderer; burner state machine data from WebSocket
- **Effort:** 3 days
- **Skills:** Flutter, Riverpod, UI design
- **Components:**
  - Heat map (top half of screen, or full screen with burner overlay)
  - Per-burner cards (bottom half): burner name, state badge (OFF/WARMING/ACTIVE/BOILING), current max temp, elapsed time since state change
  - State badge colors: OFF=gray, WARMING=orange, ACTIVE=red, BOILING=blue, COOLING=purple
  - Timer control: tap ACTIVE card to start/stop cooking timer; timer visible on card
  - "All clear" indicator: green banner when all burners are OFF
- **Definition of Done:** Dashboard reflects real device state within 1 second of state changes

#### 4.1.7 Timer Management (Week 11-12, Days 18-20)
- **Task:** Implement per-burner cooking timers with local and push notifications
- **Dependencies:** Per-burner dashboard
- **Effort:** 2 days
- **Skills:** Flutter, local notifications
- **Steps:**
  - Tap a burner card → "Set Timer" dialog (preset buttons: 5/10/15/20/30 min + custom)
  - Timer persists while app is backgrounded (use Flutter local notifications as timer engine)
  - Timer completion: local notification even when app is closed
  - Timer auto-clears when burner goes to OFF state
  - Multiple timers: one per active burner
- **Definition of Done:** Timer fires local notification while app is backgrounded; auto-clears on burner off

#### 4.1.8 Alert Display & Push Notifications (Week 12, Days 20-22)
- **Task:** Implement alert display in-app and push notification receipt from cloud
- **Dependencies:** Per-burner dashboard; Phase 4 SNS/FCM setup (can stub with local test)
- **Effort:** 2 days
- **Skills:** Flutter, firebase_messaging, flutter_local_notifications
- **Steps:**
  - In-app alerts: banner at top of screen with alert type, burner, severity; tap to dismiss
  - Alert history screen: scrollable list of past 30 alerts with timestamps
  - Push notification: configure `firebase_messaging` for FCM (Android + iOS via APNs)
  - Notification payload: `{ "alert_type": "BURNER_LEFT_ON", "burner": "Front-Left", "duration_min": 25 }`
  - Background notification handler: shows OS-level notification
  - Deep link: tapping notification opens app to alert detail screen
- **Definition of Done:** Push notification received and displayed while app is backgrounded; deep link works

#### 4.1.9 Settings Screen (Week 12-13, Days 22-25)
- **Task:** Implement Settings screen with user-configurable alert preferences
- **Dependencies:** Core screens complete
- **Effort:** 3 days
- **Skills:** Flutter, Riverpod
- **Settings Items:**
  - Alert thresholds: "Alert me if stove is on for more than: [15/30/60/custom] minutes"
  - Per-alert enable/disable toggles (Boil Detection, High Temp, Unattended, Gas Leak)
  - Notification preferences: push only / in-app only / both / vibrate
  - Device info: firmware version, device ID, WiFi signal strength, last seen
  - Recalibration shortcut
  - WiFi re-provisioning (forget and re-pair)
  - "Report a problem" (opens email with device diagnostic dump)
- **Definition of Done:** Settings persist across app restarts; changes sync to device via WebSocket config message

#### 4.1.10 iOS and Android Builds (Week 13-14, Days 25-28)
- **Task:** Validate production builds on real devices, not just simulators
- **Dependencies:** All screens complete
- **Effort:** 3 days
- **Skills:** Xcode, Android Studio, app signing
- **Steps:**
  - iOS: TestFlight build; test on iPhone 14 (iOS 17) and iPhone SE (iOS 16)
  - Android: Internal track APK; test on Pixel 7 (Android 14) and a mid-range Samsung (Android 12)
  - Verify: BLE permissions (iOS 13+ requires CBCentralManager usage description)
  - Verify: Local network permission (iOS 14+ mDNS requires explicit permission)
  - Verify: Notification permissions flow (iOS requires explicit request)
  - Performance: profile with Flutter DevTools; verify no memory leaks over 10-minute session
  - Dark mode: verify heat map and status colors work in both light and dark modes
- **Definition of Done:** App runs on 4 real devices (2 iOS, 2 Android) without crashes; all permissions granted correctly

### 4.2 Phase 3 Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| iOS local network permission blocks mDNS | High | High | Required since iOS 14; add `NSLocalNetworkUsageDescription` + `NSBonjourServices`; fallback to manual IP |
| Heat map rendering causes jank | Medium | High | Move interpolation to Dart Isolate; use `ui.Image` double buffering |
| flutter_blue_plus BLE unstable on some Android OEMs | Medium | Medium | Test on Samsung specifically; implement retry logic; document known-working devices |
| Perspective calibration feels too technical for average user | High | Medium | UX option: "auto-detect" mode that uses thermal blobs to guess burner positions; wizard as fallback |

### 4.3 Phase 3 Definition of Done

- [ ] App builds for iOS 16+ and Android 8+
- [ ] BLE provisioning completes end-to-end
- [ ] mDNS discovery finds device on LAN
- [ ] Heat map renders at 4fps without jank
- [ ] Calibration wizard produces correct top-down view
- [ ] Per-burner dashboard reflects real device state
- [ ] Push notifications received while app is backgrounded
- [ ] Tested on 2 real iOS devices and 2 real Android devices

---

## 5. Phase 4: Cloud Backend (Weeks 10-16)

### Goal

Build the AWS cloud infrastructure for device management, push notifications, telemetry storage, and OTA updates.

### 5.1 Task Breakdown

#### 5.1.1 AWS Account & Infrastructure Setup (Week 10, Days 1-2)
- **Task:** Set up AWS account structure, IAM roles, and Terraform/CDK baseline
- **Dependencies:** None (can start in parallel with Phase 2)
- **Effort:** 1.5 days
- **Skills:** AWS, Terraform or AWS CDK
- **Steps:**
  - Create dedicated AWS account (or use existing with separate billing alert at $50/month)
  - Set up IAM: admin role, CI/CD role (limited), device certificate provisioning role
  - Set up Terraform (or CDK) project for infrastructure-as-code
  - Choose region: `us-east-1` (lowest latency for US launch; add `eu-west-1` post-launch)
  - Set up S3 bucket for Terraform state; DynamoDB table for state locking
  - Set up AWS CLI and credentials locally
- **Definition of Done:** `terraform plan` shows no errors; infrastructure baseline committed to repo

#### 5.1.2 AWS IoT Core Setup (Week 10-11, Days 2-5)
- **Task:** Configure IoT Core: thing types, policies, certificate provisioning
- **Dependencies:** AWS setup
- **Effort:** 2.5 days
- **Skills:** AWS IoT Core, X.509 certificates, MQTT
- **Steps:**
  - Create Thing Type: `StoveIQ-v1`
  - Create IoT Policy: allow publish to `stoveiq/{thing_name}/*` and subscribe to `stoveiq/{thing_name}/config`
  - Set up Just-In-Time Registration (JITR): device certificates signed by CA generated during manufacturing
  - Configure MQTT message broker (IoT Core is the broker; no additional setup needed)
  - Set up IoT Rules Engine:
    - Alert rule: `stoveiq/+/alerts` → Lambda → SNS
    - Telemetry rule: `stoveiq/+/telemetry` → Timestream (direct integration)
    - Status rule: `stoveiq/+/status` → DynamoDB (update device shadow)
  - Set up IoT Device Defender: detect anomalous MQTT behavior (optional, defer if time-constrained)
  - Local dev: set up Mosquitto broker with same topic structure for offline firmware testing
- **Definition of Done:** Test device (ESP32-S3 with dev certificate) connects to IoT Core; rules engine routes messages correctly

#### 5.1.3 Cognito User Pool (Week 11, Days 5-7)
- **Task:** Configure Cognito for user authentication and device-user association
- **Dependencies:** AWS setup
- **Effort:** 2 days
- **Skills:** AWS Cognito, OAuth 2.0
- **Steps:**
  - Create User Pool with email/password auth; enable SRP authentication
  - User Pool attributes: email (required), `custom:device_ids` (StringSet, list of associated devices)
  - App Client: Flutter mobile app client (no secret, PKCE flow)
  - Identity Pool: federate Cognito User Pool; assign IAM role to authenticated users (limited IoT permissions)
  - Post-confirmation Lambda trigger: create user record in DynamoDB
  - Password policy: min 8 chars, require number
  - MFA: optional TOTP (defer for v1, add in v1.1)
- **Definition of Done:** Flutter app can sign up, sign in, and receive JWT; post-confirmation Lambda fires

#### 5.1.4 DynamoDB Tables (Week 11, Days 6-8)
- **Task:** Design and create DynamoDB tables for device and user data
- **Dependencies:** AWS setup
- **Effort:** 1.5 days
- **Skills:** DynamoDB data modeling
- **Tables:**
  - `stoveiq-devices`: PK=`device_id`, attributes: `user_id`, `firmware_version`, `calibration`, `alert_config`, `last_seen`, `status`
  - `stoveiq-users`: PK=`user_id`, attributes: `email`, `device_ids`, `notification_token`, `alert_preferences`, `created_at`
  - `stoveiq-alerts`: PK=`device_id`, SK=`timestamp#alert_id`, attributes: `alert_type`, `burner_id`, `severity`, `resolved_at`
  - Global Secondary Indexes: `user_id-index` on devices table (lookup user's devices)
- **Definition of Done:** Tables created; CloudFormation/Terraform definitions committed; access patterns validated with test data

#### 5.1.5 Lambda Functions (Week 11-12, Days 8-13)
- **Task:** Implement Lambda functions for device registration, alert routing, and API handlers
- **Dependencies:** DynamoDB, Cognito, IoT Core
- **Effort:** 5 days
- **Skills:** Node.js or Python, AWS Lambda, AWS SDK
- **Functions:**
  - `device-register`: called on first MQTT connect (JITR Lambda); creates DynamoDB record, associates with user if token provided
  - `alert-router`: triggered by IoT Rule on `stoveiq/+/alerts`; looks up user's FCM/APNs tokens from DynamoDB; calls SNS
  - `device-api`: API Gateway handler for app ↔ cloud REST calls:
    - `GET /devices/{id}` — device status
    - `POST /devices/{id}/config` — update alert thresholds
    - `GET /devices/{id}/alerts` — alert history (last 30 days from DynamoDB)
    - `POST /devices/{id}/ota` — trigger OTA update (admin only)
  - `notification-token-register`: called by app on launch to register/update FCM/APNs token in DynamoDB
  - `ota-check`: periodically checks for pending OTA jobs and dispatches via IoT Jobs
- **Definition of Done:** Each Lambda function has unit tests; integration tested against dev IoT Core + DynamoDB

#### 5.1.6 API Gateway (Week 12, Days 12-14)
- **Task:** Configure API Gateway REST API with Cognito authorizer
- **Dependencies:** Lambda functions, Cognito
- **Effort:** 1.5 days
- **Skills:** AWS API Gateway
- **Steps:**
  - REST API with `{proxy+}` integration to `device-api` Lambda
  - Cognito JWT authorizer on all endpoints
  - CORS configured for mobile app (allow all origins in dev; lock down in prod)
  - Rate limiting: 100 requests/second per API key
  - Custom domain (optional for v1): `api.stoveiq.com`
- **Definition of Done:** Flutter app can call API endpoints with Cognito JWT; unauthorized requests return 401

#### 5.1.7 SNS Push Notifications (Week 12, Days 14-16)
- **Task:** Configure SNS for cross-platform push notifications (FCM + APNs)
- **Dependencies:** Lambda alert-router
- **Effort:** 2 days
- **Skills:** AWS SNS, Firebase Cloud Messaging, Apple Push Notification Service
- **Steps:**
  - Create SNS platform applications: `StoveIQ-FCM` (Android) and `StoveIQ-APNs` (iOS)
  - FCM: upload Firebase server key to SNS
  - APNs: upload Apple Push certificate or key to SNS (production + sandbox)
  - `notification-token-register` Lambda creates/updates SNS endpoint per device token
  - `alert-router` Lambda: look up SNS endpoint ARN from DynamoDB; call `sns.publish()` with alert payload
  - Test: trigger test alert, verify notification received on test devices
- **Definition of Done:** Push notification received on iOS and Android test devices when alert Lambda fires

#### 5.1.8 Timestream Telemetry (Week 13, Days 16-18)
- **Task:** Configure Timestream for telemetry storage and querying
- **Dependencies:** IoT Rules Engine
- **Effort:** 2 days
- **Skills:** AWS Timestream, IoT Rules
- **Steps:**
  - Create Timestream database `stoveiq` and table `telemetry`
  - IoT Rule: direct integration to Timestream (no Lambda needed for writes)
  - Dimensions: `device_id`, `burner_id`
  - Measures: `max_temp`, `mean_temp`, `state`, `variance`
  - Retention: 7 days in memory store, 365 days in magnetic store
  - Query via Athena for ad-hoc analysis (connect to Timestream via federation)
  - App query: `GET /devices/{id}/history?burner=FL&hours=24` — Lambda queries Timestream, returns JSON
- **Definition of Done:** 24h of test telemetry stored; query returns correct burner temperature history

#### 5.1.9 OTA Pipeline (Week 13-14, Days 18-21)
- **Task:** Set up firmware OTA distribution via S3, IoT Jobs, and HTTPS download
- **Dependencies:** IoT Core, S3
- **Effort:** 3 days
- **Skills:** AWS IoT Jobs, S3, CI/CD
- **Steps:**
  - S3 bucket `stoveiq-firmware`: versioned, private, signed URL generation
  - OTA trigger flow: CI/CD pushes new firmware `.bin` to S3 → create IoT Job targeting thing group → device polls IoT Jobs API → receives signed S3 URL → downloads + verifies SHA-256 → applies OTA
  - Implement GitHub Actions workflow: on release tag → `idf.py build` → upload to S3 → create IoT Job (optional: target specific device for staged rollout)
  - Staged rollout: start with 1 device, then 10%, then 100% via IoT dynamic thing groups
  - Rollback: if device reports error after OTA, IoT Job marks as failed; ESP32 A/B OTA partitions auto-rollback
- **Definition of Done:** Full OTA cycle: GitHub tag → S3 → IoT Job → device update → version confirmed in device shadow

### 5.2 Phase 4 Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| AWS IoT Core costs spike unexpectedly | Low | Medium | Set billing alert at $50/month; 1M MQTT messages free tier is sufficient for dev |
| Apple APNs certificate expires mid-campaign | Low | High | Use APNs authentication key (does not expire) instead of certificate |
| FCM token refresh breaks push to existing users | Medium | Low | `notification-token-register` called on every app launch; stale tokens auto-cleaned |
| Timestream query latency too slow for app | Low | Low | App only queries Timestream for history view; real-time state from WebSocket |

### 5.3 Phase 4 Definition of Done

- [ ] Device connects to AWS IoT Core with device certificate
- [ ] Telemetry flows from device → IoT Rule → Timestream
- [ ] Alerts flow device → IoT Rule → Lambda → SNS → FCM/APNs → app
- [ ] Flutter app authenticates with Cognito; calls API Gateway endpoints
- [ ] OTA pipeline tested end-to-end from GitHub tag to device update
- [ ] All Lambda functions have unit tests
- [ ] Monthly AWS cost estimated and documented (target: < $5/month for 100 devices)

---

## 6. Phase 5: Integration & Testing (Weeks 14-18)

### Goal

Validate the entire system end-to-end under real kitchen conditions, including long-duration reliability, network failure scenarios, and alert accuracy.

### 6.1 Task Breakdown

#### 6.1.1 End-to-End Integration Testing (Week 14-15, Days 1-5)
- **Task:** Test complete flow from stove event to app notification
- **Dependencies:** Phases 2-4 all complete to MVP level
- **Effort:** 4 days
- **Skills:** System testing, documentation
- **Test Scenarios:**
  - Turn burner on → app shows state change within 3 seconds
  - Burner on for 30 minutes → BURNER_LEFT_ON push notification received
  - Boil water → BOILING_DETECTED in-app alert within 30 seconds of visible boil
  - Multiple burners simultaneously → each tracked independently
  - App closed → WiFi drops → app reopens → reconnects and shows current state
  - Cloud offline (disable Lambda) → local alerts still fire via piezo/LED
  - New firmware available → OTA triggers → device updates and reconnects
- **Definition of Done:** All scenarios pass; document any failures as bugs with priority tags

#### 6.1.2 Multi-Device Testing (Week 15, Days 5-8)
- **Task:** Test 2-3 devices simultaneously under same user account
- **Dependencies:** E2E test passing
- **Effort:** 3 days
- **Skills:** System testing
- **Steps:**
  - Register 2 devices under same Cognito account
  - App: switch between devices; verify heat maps are independent
  - Alert routing: both devices send alerts to same user's push notification tokens
  - OTA: trigger update on one device only; verify other device not affected
- **Definition of Done:** Multi-device scenarios pass without cross-device interference

#### 6.1.3 Long-Duration Reliability Testing (Week 15-16, Days 7-12)
- **Task:** Run device for 72+ hours continuously in a real kitchen environment
- **Dependencies:** E2E test passing
- **Effort:** 5 days elapsed (mostly observation, not hands-on)
- **Skills:** Monitoring, log analysis
- **Monitoring:**
  - Log firmware task stack high-water marks every 15 minutes
  - Log heap usage (PSRAM + DRAM) trends
  - Log I2C error counts
  - Log MQTT reconnect events
  - Alert rate vs. expected rate (should be zero if stove is not in use overnight)
- **Pass Criteria:**
  - Zero firmware crashes (watchdog triggers = fail)
  - No I2C errors after first 30 minutes
  - MQTT reconnects < 3 per 24h (WiFi dropout tolerance)
  - Heap usage stable (no memory leak trend)
- **Definition of Done:** 72h run completed with pass criteria met; any failures documented and fixed

#### 6.1.4 Alert Accuracy Testing (Week 16, Days 11-14)
- **Task:** Measure false positive and false negative rates for each alert type
- **Dependencies:** Long-duration test complete
- **Effort:** 3 days
- **Skills:** Testing, data analysis
- **Test Protocol:**
  - 20 trial runs of each alert type
  - Record: triggered / not triggered / triggered late
  - Measure: time from event to local alert, time to push notification
- **Target Metrics:**
  - BURNER_LEFT_ON: 100% true positive rate; 0% false positive rate
  - BOILING_DETECTED: > 90% true positive; < 5% false positive (non-boiling high heat)
  - HIGH_TEMP: 100% true positive; 0% false positive
  - Local alert latency: < 1 second from event
  - Push notification latency: < 10 seconds end-to-end
- **Definition of Done:** All alert types meet target metrics; results documented

#### 6.1.5 Network Failure Testing (Week 16-17, Days 14-17)
- **Task:** Test behavior under various network degradation scenarios
- **Dependencies:** E2E test passing
- **Effort:** 3 days
- **Test Scenarios:**
  - WiFi drops while cooking: local alerts continue; reconnects within 5 minutes
  - AWS IoT Core unreachable (block at firewall): device operates locally; alerts queue
  - Firewall re-opens: queued alerts replay within 30 seconds
  - Router DHCP assigns new IP: device reconnects; app re-discovers via mDNS
  - App on cellular (not local WiFi): push notifications still work via cloud
- **Definition of Done:** All scenarios pass; no data loss, no missed alerts

#### 6.1.6 Power Consumption Validation (Week 17, Days 17-19)
- **Task:** Measure actual power draw vs. BOM assumptions
- **Dependencies:** Hardware at final firmware state
- **Effort:** 2 days
- **Skills:** Power measurement (multimeter with USB current meter)
- **Target:** Average < 1W over 1h cooking session
- **Measurements:**
  - Idle (WiFi connected, sensor polling, no clients): target < 0.8W
  - Active streaming (WebSocket client connected): target < 1.2W
  - During WiFi provisioning (BLE active): target < 1.5W
  - Peak (all peripherals active, ML inference if any): document peak
- **Definition of Done:** Power draw within 20% of BOM assumptions; USB-C 5V/1A adapter confirmed sufficient

#### 6.1.7 Performance Optimization (Week 17-18, Days 19-22)
- **Task:** Profile and optimize based on test results
- **Dependencies:** All test results
- **Effort:** 3 days
- **Skills:** Embedded profiling, Dart profiling
- **Areas to Address:**
  - Firmware: reduce frame processing latency if > 100ms; reduce stack sizes if headroom > 30%
  - App: fix any jank identified in heat map rendering; reduce initial load time
  - Cloud: optimize Lambda cold starts (if > 1s, add provisioned concurrency for alert-router)
- **Definition of Done:** Known performance issues from testing resolved; re-run relevant tests to confirm

### 6.2 Phase 5 Definition of Done

- [ ] All E2E integration test scenarios pass
- [ ] 72h continuous reliability test passed
- [ ] Alert accuracy meets target metrics
- [ ] Network failure scenarios all handled gracefully
- [ ] Power consumption within spec
- [ ] Zero open Critical or High severity bugs
- [ ] Performance optimizations applied

---

## 7. Phase 6: Hardware Design (Weeks 12-20)

### Goal

Design and build a custom PCB and enclosure that integrates all components into a production-quality form factor, ready for Kickstarter prototype demonstration and manufacturing quoting.

### 7.1 Task Breakdown

#### 7.1.1 Schematic Design (Week 12-13, Days 1-4)
- **Task:** Create complete schematic for StoveIQ PCB in KiCad
- **Dependencies:** Phase 1 and 2 informing component choices
- **Effort:** 4 days
- **Skills:** KiCad, electronics design, ESP32-S3 hardware design
- **Key Sections:**
  - ESP32-S3-WROOM-1-N8R8 module footprint (use module, not bare chip)
  - USB-C connector (USB 2.0 data + power): CC resistors, ESD protection (PRTR5V0U2X), TVS diode
  - 5V → 3.3V LDO: AP2112K-3.3 (600mA, low dropout, low noise) — do NOT use AMS1117 (poor noise)
  - MLX90640 I2C interface: 4.7kΩ pull-ups to 3.3V; 100nF decoupling on DVDD and VDD
  - BME688 footprint (optional, DNP — Do Not Populate for v1): separate I2C with jumper to same bus
  - Piezo buzzer: NPN transistor drive (BC817) + 100Ω series; active buzzer preferred
  - RGB LED: WS2812B or 3x discrete LEDs with 33Ω series resistors
  - Boot/Reset buttons (for programming + factory reset)
  - UART test pads (TX/RX accessible for debugging)
  - Optional header for future expansion (PIR sensor, additional I2C)
  - Power LED (green, 1mA via 3.3kΩ)
- **Definition of Done:** Schematic reviewed by ERC (KiCad ERC zero errors); schematic PDF exported and peer-reviewed

#### 7.1.2 PCB Layout (Week 13-15, Days 4-10)
- **Task:** PCB layout in KiCad, targeting 2-layer 50x50mm form factor
- **Dependencies:** Schematic complete
- **Effort:** 6 days
- **Skills:** PCB layout, RF design basics
- **Key Constraints:**
  - Keep copper fill away from ESP32-S3 module antenna area (last 15mm of module — check datasheet)
  - MLX90640: place on front of board centered in the enclosure's viewing aperture
  - USB-C connector: edge of board for easy access
  - Test pads: accessible when board is installed in enclosure
  - Minimum trace width: 0.2mm signal, 0.8mm power rails
  - Thermal relief on power pads
  - Ground pour on both layers; stitching vias around power domain boundaries
- **Definition of Done:** DRC zero errors; Gerber files exported; reviewed with PCB house design rules (JLCPCB 2-layer rules)

#### 7.1.3 PCB Prototype Order (Week 15, Days 10-11)
- **Task:** Order 5 PCBs and stencil from JLCPCB
- **Dependencies:** PCB layout complete
- **Effort:** 0.5 days ordering; ~10 days waiting
- **Cost:** ~$30 for 5 boards + stencil via JLCPCB
- **Definition of Done:** PCBs received and visually inspected for defects

#### 7.1.4 PCB Assembly (Week 16-17, Days 20-22, after delivery)
- **Task:** Solder components onto 3-5 prototype PCBs
- **Dependencies:** PCBs received; components in hand
- **Effort:** 2 days
- **Skills:** SMD soldering, paste stenciling, reflow (hot plate or oven)
- **Steps:**
  - Apply solder paste via stencil
  - Place SMD components with tweezers
  - Reflow in oven or on hot plate
  - Hand solder through-hole components (USB-C, buttons, buzzer)
  - Hand solder ESP32-S3 module (castellation joints)
  - Visual inspection; touch-up with soldering iron
  - Continuity tests before powering
- **Definition of Done:** 3 of 5 boards powered up and booted without damage

#### 7.1.5 PCB Bring-Up (Week 17, Days 22-24)
- **Task:** Flash firmware to custom PCB and validate all peripherals
- **Dependencies:** PCB assembled; firmware from Phase 2
- **Effort:** 2 days
- **Skills:** Embedded debugging, oscilloscope/multimeter
- **Test Checklist:**
  - 3.3V rail stable under load (measure with multimeter)
  - ESP32-S3 boots (observe LED blink / serial output)
  - MLX90640 I2C ACKs at correct address (0x33)
  - WebSocket streams frames at 4Hz
  - Piezo buzzer audible
  - RGB LED cycles colors
  - USB-C data (can connect as serial device)
- **Definition of Done:** All peripherals verified on custom PCB; firmware functional

#### 7.1.6 Enclosure Design (Week 14-16, overlapping PCB layout)
- **Task:** Design enclosure in Fusion 360 (or Onshape) for 3D printing
- **Dependencies:** PCB dimensions finalized
- **Effort:** 5 days
- **Skills:** CAD (Fusion 360 or Onshape), 3D printing
- **Design Requirements:**
  - Form factor: roughly 80x55x22mm (hockey puck sized, thin)
  - MLX90640 viewing aperture: clear opening for IR sensor (no plastic in front — IR does not penetrate most plastics)
  - USB-C access slot
  - LED window: light pipe or translucent window for RGB LED
  - Mounting: integrated ball joint mount (15mm ball, standard action camera size)
  - Snap-fit assembly: no screws visible from outside
  - Ventilation: small slots for heat dissipation (esp. near ESP32)
  - Cable management: internal groove to route USB-C cable
- **Definition of Done:** 3D model printed on FDM printer; PCB fits with tolerance; IR sensor has unobstructed aperture

#### 7.1.7 Mounting System Design (Week 15-16, Days 10-14)
- **Task:** Design and prototype the mounting mechanism
- **Dependencies:** Enclosure design
- **Effort:** 4 days
- **Skills:** Mechanical design, 3D printing
- **Mounting Options (design all three):**
  - Adhesive: 3M VHB adhesive pad on back of base bracket; removable version (Command strip compatible)
  - Magnetic: N42 neodymium magnets in base; steel plate adheres to cabinet; 500g pull force minimum
  - Screw: VESA-style 4-hole pattern, M3 screws; for wall/cabinet mounting
- **Ball Joint:** 15mm ball + socket with friction lock; 180-degree articulation; tighten by hand
- **Target mounting angle:** 30-45 degrees below horizontal, 18-30 inches above stovetop
- **Definition of Done:** All three mounting types prototyped; ball joint holds angle under vibration; adhesive holds 500g weight

#### 7.1.8 Thermal Management (Week 17, Days 22-24)
- **Task:** Validate that device does not overheat in kitchen environment and that heat from above stove does not affect sensor
- **Dependencies:** PCB assembled; enclosure designed
- **Effort:** 2 days
- **Skills:** Thermal testing
- **Tests:**
  - Run device above active stove (all 4 burners, 30 minutes): measure ESP32 internal temp sensor
  - ESP32-S3 max operating temp: 105C; target < 70C in enclosure
  - MLX90640 max ambient temp: 85C; measure ambient temp inside enclosure above stove
  - If overheating occurs: add vents to enclosure, add thermal pad between ESP32 and enclosure lid
  - Test rising hot air interference on IR sensor: compare readings with and without cardboard baffle blocking direct hot air
- **Definition of Done:** Device operates within thermal limits; IR readings stable despite kitchen convection

#### 7.1.9 Antenna Optimization (Week 18, Days 25-27)
- **Task:** Measure WiFi RSSI in a real kitchen and validate connectivity
- **Dependencies:** PCB bring-up
- **Effort:** 2 days
- **Skills:** RF testing basics
- **Steps:**
  - Measure RSSI from under a metal cabinet (worst case) using ESP32 WiFi scan
  - Target: RSSI > -70 dBm at 20ft from router
  - If signal weak: ensure antenna area on PCB has no copper pour; use PCB antenna keepout zone
  - ESP32-S3-WROOM-1 has built-in PCB antenna — optimize enclosure material (ABS/PLA ok; metal enclosure fails)
  - Document: "place router within X feet for reliable connection"
- **Definition of Done:** RSSI > -70 dBm in typical under-cabinet mounting; WiFi stable during 1h reliability test

#### 7.1.10 FCC Pre-Compliance Testing (Week 19-20, Days 27-30)
- **Task:** Conduct pre-compliance testing to identify and fix emissions issues before formal submission
- **Dependencies:** Final PCB + enclosure assembled
- **Effort:** 3 days
- **Skills:** FCC process knowledge; hire pre-compliance test engineer or use lab
- **Steps:**
  - Research: ESP32-S3-WROOM-1 module is FCC certified (FCC ID: 2AC7Z-ESPWROOMS3); product using it as a "modular transmitter" may be able to use module's grant — confirm with FCC counsel
  - Pre-scan options: hire RF lab for 1-day pre-scan ($500-1500); or use SDR + GTEM cell (DIY, less accurate)
  - Test: radiated emissions with device in operating state (WiFi connected, sensor reading)
  - If using certified module with no external antenna: may qualify for modular grant (greatly simplifies FCC process, reduces cost from ~$15K to ~$3K)
  - Fix any emissions issues (common: switching power supply EMI; add ferrite bead on USB input)
- **Definition of Done:** Pre-scan report; clear determination of FCC pathway (modular grant vs. full certification); any identified fixes applied

### 7.2 Phase 6 Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| PCB layout error requires re-spin | Medium | Medium | Order only 5 prototypes first; allow 2 weeks for respin before schedule impact |
| Enclosure design requires 3+ iterations | High | Low | Expected; plastic 3D printing is fast and cheap; budget 3 design iterations |
| FCC full certification required (no modular grant) | Medium | High | ESP32-S3 module has FCC ID; consult RF attorney early (week 18) to confirm pathway |
| Kitchen heat causes sensor drift | Medium | Medium | MLX90640 has built-in ambient compensation; test and tune NUC calibration |
| Antenna in metal-surrounded enclosure causes dead spots | Medium | High | Test early; ESP32-S3's PCB antenna is compact; use ABS enclosure |

### 7.3 Phase 6 Definition of Done

- [ ] Schematic ERC clean; PCB DRC clean
- [ ] 3 PCBs assembled and booted
- [ ] All peripherals verified on custom PCB
- [ ] Enclosure 3D printed; PCB fits
- [ ] Ball-joint mount holds position
- [ ] Thermal limits not exceeded in kitchen test
- [ ] WiFi RSSI meets spec under cabinet
- [ ] FCC certification pathway determined; pre-scan completed

---

## 8. Phase 7: Pre-Launch (Weeks 18-24)

### Goal

Complete all regulatory, legal, marketing, and manufacturing preparation needed to launch the Kickstarter campaign with confidence.

### 8.1 Task Breakdown

#### 8.1.1 FCC Certification Submission (Week 19-21)
- **Task:** Submit FCC certification application based on pre-compliance results
- **Dependencies:** Phase 6 hardware final; pre-compliance test complete
- **Effort:** 3 days (paperwork); 6-10 weeks lead time at lab
- **Cost:** $3,000-5,000 (modular grant pathway); $15,000-25,000 (full certification)
- **Steps:**
  - Engage FCC Trusted Agent (TCB — Telecommunications Certification Body)
  - Submit: test report, FCC form 731, product photos, user manual draft, block diagram
  - Receive FCC ID; display on product label and in app
  - Note: can launch Kickstarter while FCC is in process; cannot ship units until certified
- **Definition of Done:** FCC application submitted; FCC ID received or application number for tracking

#### 8.1.2 Provisional Patent Filing (Week 19-20)
- **Task:** File provisional patent application covering key innovations
- **Dependencies:** Product design final enough to describe
- **Effort:** 5 days (drafting); engage patent attorney
- **Cost:** $1,500-3,000 attorney fees + $320 USPTO filing fee (micro entity rate)
- **Key Claims to Cover:**
  - Method for perspective-correcting thermal array data from angled mounting position to produce top-down stovetop view
  - Method for per-burner state detection using thermal array data and spatial region mapping
  - System for retrofit stovetop monitoring using calibrated IR thermal array with user-guided burner mapping
  - Boil detection via temporal variance analysis of thermal array pixels
- **Steps:**
  - Brief patent attorney; provide PRD, Architecture doc, Phase 1 characterization data
  - Draft specification with attorney; 12-month clock starts on filing
  - File provisional; receive confirmation number
- **Definition of Done:** Provisional patent application filed; confirmation number received; 12-month window started

#### 8.1.3 Kickstarter Campaign Page (Week 20-22)
- **Task:** Write and design the Kickstarter campaign page
- **Dependencies:** Product finalized; prototype photography possible
- **Effort:** 8 days
- **Skills:** Copywriting, graphic design, Kickstarter platform
- **Sections:**
  - Hero section: product photo + tagline ("Know your stove. Stay safe.")
  - Problem/solution: 30-second narrative on cooking fires + current inadequate solutions
  - Product demo: embedded video (campaign video)
  - Feature breakdown: heat map, per-burner tracking, boil detection, safety alerts, app screenshots
  - How it works: 3-step graphic (mount → connect → protect)
  - Technical specs: sensor resolution, app platforms, connectivity, power
  - Reward tiers (see below)
  - Manufacturing plan and timeline
  - Team section
  - FAQ
  - Stretch goals
- **Reward Tiers:**
  - $79: Super Early Bird (first 100 backers) — 1x StoveIQ
  - $99: Early Bird (next 400 backers) — 1x StoveIQ
  - $129: Standard — 1x StoveIQ
  - $189: Two-Pack — 2x StoveIQ
  - $249: Family Pack + 1 year premium cloud (when launched)
  - $499: Caregiver Bundle — 3x StoveIQ + priority support
- **Stretch Goals:**
  - $200K: Gas Leak Sensor (BME688) included in all units
  - $400K: Smart Home Integration (Alexa, Google Home)
  - $750K: Professional monitoring plan partnership
- **Definition of Done:** Campaign page reviewed by 5 external readers (not involved in project); all questions they have are answered in the page

#### 8.1.4 Campaign Video Production (Week 20-23)
- **Task:** Produce a 2-3 minute Kickstarter campaign video
- **Dependencies:** Product prototype; enclosure final
- **Effort:** 8 days total (scripting, shooting, editing)
- **Skills:** Video production, scriptwriting; hire videographer if needed
- **Video Structure:**
  - Hook (0:00-0:20): Family cooking scenario; parent leaves kitchen; stove left on
  - Problem (0:20-0:45): Cooking fire statistics; existing solutions are inadequate
  - Product reveal (0:45-1:15): StoveIQ unboxing → mounting → app → heat map demo
  - Features showcase (1:15-1:50): Live heat map, boil alert notification, historical view
  - Safety story (1:50-2:10): Caregiver use case; remote monitoring
  - Call to action (2:10-2:30): Back on Kickstarter; early bird pricing
- **Shots to get:**
  - Product hero shot (clean white background; motion: slow rotate)
  - App screen recordings (iOS and Android)
  - Real cooking demo showing heat map updating in real time
  - Boil alert notification arriving on phone
  - Mounting process in 30 seconds
  - Family kitchen B-roll
- **Definition of Done:** Final video reviewed and approved; uploaded to Vimeo/YouTube unlisted; embedded on Kickstarter draft

#### 8.1.5 Pre-Launch Email List Building (Week 20-24, ongoing)
- **Task:** Build email list of potential backers before launch
- **Dependencies:** Landing page live
- **Effort:** 3 days setup; ongoing throughout
- **Steps:**
  - Build landing page at `stoveiq.com` (Webflow or Carrd): email capture + "Notify me at launch"
  - Facebook/Instagram ads targeting: homeowners 30-60, safety/cooking interest ($500 test budget)
  - Reddit engagement: post in r/homeautomation, r/smarthome, r/cookingforbeginners (no spam — provide genuine value)
  - Kitchen safety angle: reach caregiver communities (r/AgingParents, elder care Facebook groups)
  - Goal: 2,000 email signups before launch (industry benchmark: 1,000 signups → ~$30K raised)
- **Definition of Done:** 2,000+ email signups; open rate on test email > 40%

#### 8.1.6 Social Media Setup (Week 20-21)
- **Task:** Create and populate social media accounts for StoveIQ
- **Dependencies:** Product photography; logo/branding
- **Effort:** 2 days
- **Platforms:**
  - Instagram: @stoveiq — product photos, heat map videos, kitchen safety tips
  - TikTok: @stoveiq — "watch water boil in IR" is inherently viral; heat map time-lapses
  - Twitter/X: @stoveiq — tech audience, press engagement
  - YouTube: StoveIQ channel — long-form demos, safety content
- **Pre-populate:** 6-10 posts before "going live" so profile looks established
- **Definition of Done:** All accounts created; 10+ posts published; 100+ followers each before campaign launch

#### 8.1.7 Press Kit & Influencer Outreach (Week 21-23)
- **Task:** Create press kit and reach out to tech/kitchen/safety journalists and YouTube influencers
- **Dependencies:** Video complete; product photos ready
- **Effort:** 4 days
- **Press Kit Contents:**
  - 1-page product overview (PDF)
  - High-resolution product photos (10+ angles)
  - Campaign video (downloadable)
  - Founder bio
  - Statistics sheet (cooking fire data, market size)
  - "As Seen In" placeholder (update as coverage comes in)
- **Outreach Targets:**
  - Tech: The Verge, Engadget, TechCrunch (IoT/smart home beat)
  - Kitchen/food: Serious Eats, Food52, Wirecutter
  - Safety: AARP (caregiver angle), senior care publications
  - YouTube: Smart home channels (100K-1M subscribers); cooking channels; home safety channels
  - Target: 5+ media placements before campaign launch day
- **Definition of Done:** Press kit complete; outreach sent to 50+ journalists/influencers; at least 2 committed to coverage

#### 8.1.8 Manufacturing Partner Selection (Week 21-23)
- **Task:** Get quotes from 3+ manufacturers and select preferred partner
- **Dependencies:** PCB design and BOM finalized
- **Effort:** 5 days
- **Steps:**
  - Prepare manufacturing package: Gerber files, BOM, 3D enclosure STEP file, assembly drawings
  - Request quotes from: Seeed Studio (Fusion), MacroFab (US-based), JLCPCB (PCBA), a Shenzhen contract manufacturer via Alibaba/Sourcing Nova
  - Quote for: 500 units, 1000 units, 2000 units (likely Kickstarter volumes)
  - Evaluate: unit cost at volume, MOQ, lead time, quality certifications (ISO 9001?), NDA willingness
  - Visit preferred partner or request sample build if budget allows
  - Negotiate: net payment terms, escrow options for Kickstarter funds
- **Cost Benchmark:** BOM ~$30; target fully-manufactured cost (PCB + assembly + enclosure + packaging) < $45 at 1000 units
- **Definition of Done:** Quotes received from 3+ manufacturers; preferred partner selected; letter of intent signed

### 8.2 Phase 7 Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| FCC certification delayed past campaign launch | Medium | Medium | Launch campaign while FCC is in process (legal); note "pending certification" in campaign |
| Video production overruns timeline | Medium | Medium | Hire professional videographer for 1 day shoot if DIY taking too long |
| Pre-launch email list under 1,000 | Medium | High | Increase ad spend; reach out to personal networks; consider Product Hunt early access |
| Manufacturing quotes exceed $45/unit COGS | Medium | High | Revisit BOM; identify substitutions; adjust retail price if necessary |

### 8.3 Phase 7 Definition of Done

- [ ] FCC application submitted (ID received or application in progress)
- [ ] Provisional patent filed
- [ ] Kickstarter campaign page reviewed and ready to submit
- [ ] Campaign video final and embedded
- [ ] 2,000+ email list subscribers
- [ ] Social media presence established (100+ followers)
- [ ] Manufacturing partner selected and quoted
- [ ] Press kit distributed to 50+ contacts; at least 2 coverage commitments

---

## 9. Phase 8: Kickstarter Campaign (Weeks 24-28)

### Goal

Launch and successfully fund the Kickstarter campaign. Target: $150,000 (enough to manufacture 1,500-2,000 units with margin for tooling, certification, and fulfillment overhead).

### 9.1 Task Breakdown

#### 9.1.1 Campaign Launch Preparation (Week 24, Days 1-2)
- **Task:** Final review and submit campaign for Kickstarter approval; prepare launch-day sequence
- **Dependencies:** All Phase 7 complete
- **Effort:** 2 days
- **Steps:**
  - Submit campaign to Kickstarter for review (allow 2-3 days for approval)
  - Finalize launch day: Tuesday or Wednesday (data shows highest backer conversion)
  - Prepare launch-day email to full list (subject: "It's live! Your early bird reward is waiting")
  - Prepare social posts (schedule 5 posts across platforms for launch day)
  - Brief any influencers on launch date for coordinated coverage
  - Prepare Kickstarter campaign URL (available before launch; share selectively)
- **Definition of Done:** Campaign approved by Kickstarter; launch email drafted and scheduled

#### 9.1.2 Campaign Launch & First 48 Hours (Week 24, Days 3-4)
- **Task:** Execute launch and monitor first 48 hours intensively
- **Dependencies:** Campaign approved
- **Effort:** 2 days intensive
- **Actions:**
  - 8 AM launch: send email blast to full list
  - Post across all social channels
  - Personally message 50 friends/family/professional contacts
  - Post in relevant communities (r/homeautomation, relevant Facebook groups — with permission)
  - Respond to every comment within 2 hours
  - Monitor: goal is 30% of funding target within 48 hours (typical successful campaign pattern)
  - Track: backer count, pledged amount, conversion rate by referral source
- **Definition of Done:** 30%+ of goal achieved in first 48 hours

#### 9.1.3 Backer Communication (Weeks 24-28, ongoing)
- **Task:** Regular updates to backers throughout campaign
- **Dependencies:** Campaign live
- **Effort:** 1 day/week
- **Schedule:**
  - Day 1: Welcome update (thank you, team intro, why we built this)
  - Day 7: First week wrap-up; milestone achievement; stretch goal teaser
  - Day 14: Stretch goal announcement; behind-the-scenes hardware content
  - Day 21: Late-campaign push; urgency; "last chance for early bird" messaging
  - Day 28: Final day countdown; thank you; manufacturing timeline
- **Definition of Done:** All updates published on schedule; backer comment response time < 4 hours

#### 9.1.4 Stretch Goal Activation (Week 25-26)
- **Task:** Activate stretch goals as funding milestones are reached
- **Dependencies:** Campaign live; reaching milestones
- **Stretch Goal Readiness:**
  - $200K (BME688 gas sensor): PCB already has DNP footprint; confirm BME688 BOM cost impact ($2-3/unit); update manufacturing quote
  - $400K (Smart Home integration): Alexa skill + Google Home action can be built post-campaign; confirm development timeline
- **Definition of Done:** Stretch goal activation announced immediately upon reaching threshold; manufacturing implications re-quoted

#### 9.1.5 Manufacturing Order Placement (Week 27-28)
- **Task:** Place production manufacturing order as campaign nears end
- **Dependencies:** Campaign funded; manufacturing partner selected
- **Effort:** 2 days
- **Steps:**
  - Confirm final unit count (add 10% buffer for replacements/QA failures)
  - Finalize BOM based on stretch goals achieved
  - Place deposit (typically 30% upfront)
  - Confirm lead time and delivery schedule
  - Set up escrow or direct wire (coordinate with Kickstarter funds disbursement timeline)
- **Definition of Done:** PO placed; deposit wired; production slot confirmed

### 9.2 Phase 8 Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Campaign does not hit 30% in first 48 hours | Medium | High | Increase ad spend ($2K emergency budget); reach out to tech press for immediate coverage |
| Kickstarter takes too long to approve | Low | Medium | Submit 5 days early; have alternate launch date ready |
| Backer questions expose unknown product weaknesses | Medium | Medium | Prepare FAQ doc before launch; monitor comments continuously in first week |

### 9.3 Phase 8 Definition of Done

- [ ] Campaign funded (reached $150K goal)
- [ ] Manufacturing order placed
- [ ] Backer expectation set on delivery timeline
- [ ] Stretch goals activated as applicable

---

## 10. Phase 9: Manufacturing & Fulfillment (Weeks 28-40+)

### Goal

Manufacture, QA test, package, and ship units to backers on the promised timeline.

### 10.1 Task Breakdown

#### 10.1.1 Manufacturing Oversight (Weeks 28-35)
- **Task:** Monitor production run; review engineering validation test (EVT) samples before full run
- **Dependencies:** Manufacturing order placed
- **Effort:** 5 days distributed
- **Steps:**
  - Request EVT samples (10 units): test all peripherals, flash firmware, complete provisioning flow
  - Approve EVT or provide feedback for corrections before full production run
  - Review production test jig design (manufacturer should provide; verify it tests all critical paths)
  - Monitor production milestones via weekly check-in calls
- **Definition of Done:** EVT samples pass all acceptance criteria; production run approved

#### 10.1.2 Firmware Factory Build (Week 28)
- **Task:** Prepare factory firmware image with provisioning and test modes
- **Dependencies:** Phase 2 firmware complete
- **Effort:** 2 days
- **Steps:**
  - Factory mode firmware: runs on first boot to test all peripherals (LED cycles, buzzer test, WiFi scan, MLX90640 frame read)
  - Flash sequence: factory test firmware → pass → overwrite with production firmware → set device_id in NVS → generate device certificate (sign with CA, store in encrypted NVS partition)
  - Provide manufacturer with: firmware binary, flash script, test pass/fail criteria, certificate generation script
  - Test on 3 EVT units with full factory flash sequence
- **Definition of Done:** Full factory flash + test sequence completes in < 60 seconds on 3 EVT units

#### 10.1.3 QA Testing Plan (Week 30-34)
- **Task:** Define and execute incoming QA sample testing
- **Dependencies:** Units produced
- **Effort:** 4 days
- **Sampling:** AQL 2.5 Level II (standard consumer electronics) — for 1000 units, inspect ~80 units
- **QA Checklist per Unit:**
  - Visual: no scratches, enclosure properly assembled, USB-C accessible
  - Power on: green LED illuminates
  - Firmware: connects to test WiFi; streams thermal frames at 4Hz
  - Sensor: thermal frame shows room-temperature values (plausible 20-25C range)
  - Buzzer: plays startup tone
  - RGB LED: cycles R → G → B
  - Provisioning: completes BLE provisioning successfully
- **Definition of Done:** AQL sample passes; defect rate < 1%; fail units returned to manufacturer

#### 10.1.4 Packaging Design (Week 20-28, overlapping)
- **Task:** Design retail-ready packaging
- **Dependencies:** Product final dimensions
- **Effort:** 4 days
- **Package Contents:**
  - StoveIQ device (in EVA foam insert)
  - USB-C cable (1.5m, braided)
  - Mounting hardware: VHB adhesive pad, magnetic base plate, M3 screws
  - Quick start guide (4-page foldout; QR code to full manual)
  - "Thank you, Backer #XXXX" personalized card (Kickstarter units)
- **Box:** Custom printed tuck-end box, white + orange brand colors
- **Definition of Done:** Packaging design final; manufacturer can print and assemble; 10 test boxes assembled

#### 10.1.5 Fulfillment Logistics (Week 34-38)
- **Task:** Ship units from factory to backers
- **Dependencies:** QA passed; backer addresses collected
- **Effort:** 5 days
- **Steps:**
  - Collect backer addresses via Kickstarter's address manager (opens ~6 weeks before ship)
  - Choose fulfillment approach: self-fulfillment (< 500 units, manageable), 3PL (> 500 units, recommended)
  - 3PL options: ShipBob, Whiplash, or a Kickstarter-specialist (Floship, Quartermaster)
  - Freight: manufacturer ships to 3PL warehouse; 3PL packs and labels individual boxes
  - International: use 3PL with international capabilities; budget 2x domestic cost per unit
  - Track and communicate shipping updates to backers
- **Definition of Done:** All units shipped; tracking provided to backers; < 2% lost-in-transit rate

### 10.2 Phase 9 Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Manufacturing defect rate > 1% | Medium | High | Negotiate with manufacturer for replacement unit provision in contract |
| FCC certification not received before ship date | Low | Critical | Do not ship uncertified units in US; escalate FCC review if delayed; ship international first |
| Backer address collection delayed | Low | Medium | Open Kickstarter address manager as early as allowed |
| 3PL delays at holiday season | Medium | Medium | Ship before October 15 or after January 10 to avoid holiday backup |

---

## 11. Shopping List: Phase 1 Starter Kit

Everything needed to begin Phase 1 today. All prices approximate as of early 2026.

### 11.1 Core Hardware

| Item | Purpose | Source | Approx. Price |
|------|---------|--------|---------------|
| ESP32-S3-DevKitC-1 (N8R8 variant, 8MB Flash + 8MB PSRAM) | Main microcontroller dev board | DigiKey, Adafruit, or Amazon | $15-20 |
| Adafruit MLX90640 IR Thermal Camera Breakout (110-degree FOV) | IR thermal array sensor | adafruit.com (Product #4469) | $40 |
| Breadboard, full-size (830 points) | Prototyping connections | Amazon, DigiKey | $8 |
| Jumper wires, male-male + male-female assorted | Wiring sensor to DevKit | Amazon | $8 |
| USB-C cable (USB 2.0, data capable) | Power + programming | Amazon | $8 |
| Micro USB cable | Some DevKits use micro USB for UART | Already owned or Amazon | $5 |

**Subtotal — Core Hardware: ~$85**

### 11.2 Test & Measurement

| Item | Purpose | Source | Approx. Price |
|------|---------|--------|---------------|
| Infrared thermometer gun (non-contact) | Ground-truth temperature calibration | Amazon (Etekcity Lasergrip) | $20 |
| USB power meter (inline current/voltage monitor) | Measure power consumption | Amazon (e.g., SATECHI) | $15 |
| Multimeter (basic, if not already owned) | Voltage and continuity checks | Amazon (AstroAI) | $18 |

**Subtotal — Test & Measurement: ~$53**

### 11.3 Mounting Test Rig Materials

| Item | Purpose | Source | Approx. Price |
|------|---------|--------|---------------|
| Adjustable desk arm / camera mount | Holds sensor at different angles above stove | Amazon (generic magic arm) | $20 |
| Protractor or angle gauge | Measure mounting angles precisely | Amazon | $8 |
| Small 3D-printed bracket (OR craft foam + hot glue) | Secure sensor at exact angle | Print at home or FedEx Office | $5-15 |
| Masking tape, cardboard, foam board | Test rig construction | Craft store or already owned | $10 |

**Subtotal — Mounting Rig: ~$50**

### 11.4 Software & Accounts

| Item | Purpose | Cost |
|------|---------|------|
| ESP-IDF v5.x toolchain | Firmware development | Free |
| Python 3.11+ | Visualization scripts | Free |
| PyPI packages: pyserial, matplotlib, numpy, opencv-python | Serial + visualization | Free |
| VS Code + ESP-IDF extension | IDE | Free |
| Git / GitHub repo (private) | Version control | Free |
| CP210x or CH340 USB-UART driver | Serial communication with DevKit | Free |

### 11.5 Optional Phase 1 Additions

| Item | Purpose | Source | Approx. Price | Priority |
|------|---------|--------|---------------|----------|
| BME688 breakout (Adafruit #5046) | Gas sensor evaluation in parallel | adafruit.com | $10 | Low |
| 5V active buzzer module | Early alert audio testing | Amazon | $5 | Low |
| WS2812B RGB LED strip (1m) | Early LED indicator testing | Amazon | $8 | Low |
| Logic analyzer (8-channel, $15 entry level) | Debug I2C communication issues | Amazon (Saleae clone) | $15 | Medium |

### 11.6 Phase 1 Total Budget

| Category | Cost |
|----------|------|
| Core Hardware | $85 |
| Test & Measurement | $53 |
| Mounting Rig | $50 |
| Software | Free |
| Optional (recommended) | $38 |
| **Total** | **~$226** |

### 11.7 Order Recommendations

- **Order first (longest lead time):** MLX90640 breakout from Adafruit (usually in stock; ships in 1-2 days). If Adafruit is out of stock, check Mouser (Melexis distributor) or SparkFun.
- **Order same day:** ESP32-S3 DevKit from DigiKey or Adafruit. Avoid no-name Amazon ESP32-S3 boards — they often have firmware/pinout issues.
- **Logic analyzer:** If you don't own one, the $15 Saleae-clone from Amazon is adequate for I2C debugging at 400kHz.
- **DO NOT order:** MLX90641 (12x16, 55-degree FOV) — wrong FOV for this application; or MLX90640 BAA variant (55-degree) — use the BAB (110-degree) variant.

---

## 12. Critical Path Analysis

### 12.1 Critical Path Definition

The critical path is the longest sequential chain of dependent tasks that determines the minimum total project duration. Any delay on the critical path delays the entire project.

### 12.2 Critical Path Through the Project

```
[Phase 1: POC]
Sensor Validation (4 weeks)
    ↓
[Phase 2: Firmware]
Sensor Acquisition Task (1 week)
    → Frame Processing Task (1 week)
        → Perspective Correction (1.5 weeks)
            → Burner Mapper (1 week)
                → State Machine (1.5 weeks)
                    → Boil Detection (1 week)
                        → Alert Logic (1.5 weeks)
                            → MQTT Client (1 week)
                                → OTA Update Client (1 week)
                                    ↓
[Phase 5: Integration]
E2E Integration Testing (2 weeks)
    → Long-Duration Reliability Test (1.5 weeks)
        → Alert Accuracy Testing (1.5 weeks)
            ↓
[Phase 6: Hardware (partially parallel but gate at end)]
PCB Bring-Up must precede Thermal Testing (Week 17)
    → FCC Pre-Compliance (Week 19-20)
        ↓
[Phase 7: Pre-Launch]
FCC Certification Submission (Week 19-21; 6-10 week lab lead time)
    ↓
[Phase 8: Campaign]
Campaign Launch (Week 24)
    → Campaign Ends (Week 28)
        ↓
[Phase 9: Manufacturing]
EVT Sample Review (2 weeks)
    → Production Run (4-6 weeks)
        → QA + Packaging (2 weeks)
            → Fulfillment (2 weeks)
```

### 12.3 Critical Path Items (Must Not Slip)

| # | Task | Why Critical |
|---|------|--------------|
| 1 | Phase 1 sensor validation | Go/no-go gate for entire project |
| 2 | Perspective correction firmware | Every downstream feature depends on it |
| 3 | Burner state machine + alerts | Core value proposition |
| 4 | 72-hour reliability test | Must pass before hardware can be finalized |
| 5 | PCB bring-up | Must work before FCC pre-compliance |
| 6 | FCC certification submission | 6-10 week external lead time; latest submission is Week 21 to receive before campaign ends |
| 7 | Campaign launch (Week 24) | Kickstarter campaigns have time sensitivity; launch timing relative to holidays matters |
| 8 | Manufacturing order (Week 28) | Must place during campaign to meet delivery timeline |

### 12.4 Parallel Workstreams That Must Stay On Schedule

These are NOT on the critical path but feed into it; if they fall too far behind, they join the critical path:

| Workstream | Latest Start | Joins Critical Path If Delayed Past |
|------------|--------------|--------------------------------------|
| Mobile App MVP | Week 8 | Week 12 — must be demo-ready for campaign video |
| Cloud Backend | Week 10 | Week 14 — must work for E2E integration testing |
| PCB Layout | Week 12 | Week 14 — must be ordered early enough for bring-up before Phase 5 |
| Enclosure Design | Week 14 | Week 17 — must be 3D printed before campaign video shoot |
| Campaign Video | Week 20 | Week 22 — must be final for campaign page submission |
| Email List Building | Week 20 | Must reach 1,000 before launch or early-bird tiers sell too slowly |

### 12.5 Schedule Buffers

| Phase Boundary | Buffer Built In | Risk If Used |
|----------------|-----------------|--------------|
| After Phase 1 | 0 days (none — Phase 2 starts immediately) | Phase 2 must plan for scope reduction if Phase 1 takes extra time |
| After Phase 2 | 4 days (partial overlap with Phase 5 allows catch-up) | App MVP could be delayed by up to 1 week |
| After Phase 6 | 1 week (Phase 7 pre-launch has some flexibility in ordering tasks) | Campaign launch could shift to Week 25 |
| After Phase 8 | None built in — manufacturing lead time is fixed | Late campaign end directly delays ship date |

---

## 13. Risk Register

### 13.1 Top 10 Project Risks

| # | Risk | Probability | Impact | Phase | Mitigation |
|---|------|-------------|--------|-------|------------|
| R1 | MLX90640 cannot discriminate adjacent burners on 4-burner stove | Medium | Critical | Phase 1 | Test at multiple angles; consider 2-sensor array; evaluate MLX90641 |
| R2 | FCC certification delayed; units cannot ship on time | Medium | High | Phase 7-9 | Submit by Week 21; confirm modular grant pathway (ESP32 module already certified) |
| R3 | Kickstarter campaign fails to fund ($150K goal not reached) | Medium | Critical | Phase 8 | Build email list to 2K+; secure press coverage; target conservative $100K as inner goal |
| R4 | Manufacturing COGS > $45 makes $99 price unprofitable | Medium | High | Phase 6-7 | Optimize BOM early; get competitive quotes; adjust retail price if needed |
| R5 | Boil detection false positive rate > 10% causes backer frustration | High | High | Phase 2, 5 | Tune thresholds aggressively; add sensitivity slider in app; user-reportable false positives |
| R6 | iOS local network permission blocks mDNS; app cannot find device | High | High | Phase 3 | Add `NSLocalNetworkUsageDescription` + `NSBonjourServices` info.plist keys; test on iOS 16/17/18 |
| R7 | Solo developer scope overrun — 40 weeks is aggressive alone | High | High | All | Prioritize Phase 1-3 ruthlessly; defer Phase 4 cloud to post-campaign; use cloud for v1.1 |
| R8 | PCB layout error requires re-spin (adds 3 weeks) | Medium | Medium | Phase 6 | Order small lot (5 boards); have EE peer-review schematic before ordering |
| R9 | AWS costs escalate as device fleet grows post-Kickstarter | Low | Medium | Phase 4 | IoT Core pricing is per-message; model cost at 1K devices; set billing alarm at $100/month |
| R10 | Patent not filed before campaign; idea copied post-launch | Medium | Medium | Phase 7 | File provisional before launch (cheap, 12-month priority date); full patent post-funding |

### 13.2 Solo Developer Risk Mitigation (Most Important)

Given this is likely a solo or very small team project, the most important risk mitigation strategies are:

1. **Phase 1 is a true gate** — do not start Phase 2 without validating the sensor. Do not spend money on PCB design if the core sensor approach does not work.

2. **Defer cloud (Phase 4) if needed** — the device works fully locally. For the Kickstarter campaign and v1 product, the cloud backend provides push notifications and remote monitoring, but is not required for core safety functionality. Phase 4 can slip 4-6 weeks without affecting campaign readiness if the app uses only local WebSocket communication for demo.

3. **Use off-the-shelf modules** — ESP32-S3-WROOM-1 module (not bare chip), MLX90640 breakout board (not bare chip), pre-made USB-C connector modules. This trades some PCB real estate for dramatically reduced BOM risk.

4. **Outsource video production** — the campaign video is the single highest-leverage asset for Kickstarter success. If video production is not a personal strength, hire a local videographer for 1 day ($500-1500). The ROI on a professional video is 10x.

5. **FCC modular grant research early** — schedule a 1-hour call with an FCC attorney in Week 16-17 to confirm whether the ESP32-S3-WROOM-1 module grant covers the StoveIQ product. If it does, FCC cost drops from ~$20K to ~$3K.

---

*Plan created 2026-03-26. References: PRD v1.0, Architecture v0.1.*
