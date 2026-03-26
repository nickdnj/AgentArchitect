# StoveIQ — Provisional Patent Application Technical Disclosure Document

---

> **IMPORTANT DISCLAIMER**
>
> This document is a **technical disclosure prepared for review by a qualified patent attorney**. It is NOT a formal patent application and does NOT constitute legal advice. It has not been prepared by a licensed patent practitioner. All claims, drawings, and formal language must be reviewed and revised by a registered patent attorney or patent agent before filing with the United States Patent and Trademark Office (USPTO) or any other patent authority. Filing a provisional patent application establishes a priority date but does NOT constitute a patent grant. This document is intended solely to capture the inventor's technical disclosure in sufficient detail to support formal claim drafting.

---

**Prepared By:** Nick DeMarco (Inventor)
**Date Prepared:** 2026-03-26
**Document Version:** 0.1 (Pre-Attorney Review)
**Status:** Technical Disclosure — Draft

---

## Prior Art Note for Patent Attorney

The following known patent is directly relevant to claims in this application and must be reviewed before filing:

- **US Patent 11,506,540** — Assigned to Midea Group. Covers automatic thermal calibration of infrared arrays for stovetop monitoring. The StoveIQ invention intentionally departs from this patent by requiring **user-guided, manually confirmed** burner region mapping rather than automatic calibration. This design-around decision is central to patentability and should inform independent claim drafting. The attorney should conduct a freedom-to-operate analysis and confirm that the user-guided approach is outside the scope of Midea's claims before filing.

---

## 1. Title of Invention

**Retrofit Stovetop Safety Monitor Using Angled Infrared Thermal Array With User-Guided Perspective Correction, Manual Burner Mapping Calibration, and Integrated Human Presence Detection**

---

## 2. Cross-Reference to Related Applications

*[Placeholder — No related applications at time of this disclosure. To be completed by patent attorney at time of filing if applicable.]*

---

## 3. Field of the Invention

The present invention relates to home safety monitoring systems, and more particularly to a retrofit device that uses an infrared (IR) thermal array sensor mounted at an oblique angle relative to a stovetop to monitor burner activity, detect unsafe cooking conditions, and provide real-time alerts without modification to the stove or cooking appliance. The invention includes novel methods for perspective-correcting thermal imagery from an angled sensor, user-guided interactive burner region mapping, per-burner thermal state machine monitoring, boil detection by thermal rate-of-change analysis, human presence detection using the same thermal sensor as used for stovetop monitoring, and gas-state-aware alert severity modulation when a supplementary gas sensor is present.

---

## 4. Background of the Invention

### 4.1 The Unattended Cooking Problem

Cooking fires are the leading cause of residential structure fires in the United States. According to the National Fire Protection Association (NFPA), cooking equipment is involved in approximately 49% of all reported home fires. Unattended cooking — leaving active burners without a person present in the kitchen — is the single leading contributing factor to cooking-related fires. Elderly adults, individuals with cognitive decline, and households with young children are at disproportionate risk.

### 4.2 Inadequacy of Existing Solutions

Existing approaches to this problem have significant limitations:

**Smoke and Carbon Monoxide Detectors:** These devices are reactive, alerting only after combustion byproducts are already present in the air. They provide no advance warning, cannot distinguish between a normal cooking event and an unsafe one, and cannot indicate which burner or appliance is the source.

**Smart Replacement Stoves:** Products from major appliance manufacturers (e.g., Samsung, LG) incorporate connectivity and monitoring features but require complete replacement of the existing stove, at costs typically exceeding $2,000 USD. This solution is unavailable to renters (approximately 36% of U.S. households) who cannot modify their appliances, and cost-prohibitive for the majority of homeowners with functioning existing stoves.

**Binary Stove Outlet Interrupters:** Products such as outlet-interrupting devices (e.g., FireAvert) cut electrical power to the stove when a smoke alarm activates. These are still reactive (responding to smoke, not thermal conditions), are limited to electric stoves, and provide no thermal intelligence or per-burner granularity.

**Overhead Thermal Camera Systems:** Fixed overhead thermal cameras with automatic calibration methods (see, e.g., US Patent 11,506,540 assigned to Midea Group) address stovetop monitoring but require direct overhead mounting, which is impractical in most kitchen installations where cabinetry exists directly above the stove. Additionally, automatic calibration approaches introduce patent thicket concerns. No commercially available retrofit product using this approach has reached the consumer market at sub-$150 price points.

**Motion Sensors (PIR):** Passive infrared motion detectors are used in some home security applications to detect human presence, but require a separate dedicated sensor, cannot distinguish cooking-related heat from human presence, and cannot provide per-burner thermal data.

### 4.3 The Gap in the Prior Art

There exists no commercially available retrofit device that: (a) mounts non-invasively under a kitchen cabinet or on a kitchen wall at an oblique angle; (b) corrects for the angular mounting perspective using user-guided homographic transformation; (c) uses an interactive, user-confirmed burner mapping process that does not rely on automatic calibration; (d) provides per-burner independent thermal state monitoring; (e) uses the same thermal sensor for both stovetop monitoring and human presence detection; (f) combines thermal-derived stove state with optional gas sensing to modulate alert severity; and (g) operates all safety-critical logic locally on an embedded microcontroller without cloud connectivity.

---

## 5. Summary of the Invention

The present invention is a retrofit stovetop monitoring device ("StoveIQ" or "the Device") comprising a compact enclosure housing an infrared thermal array sensor, a wireless microcontroller, local alert hardware, and an optional gas sensing module. The Device mounts under a kitchen cabinet or on a wall behind the stove at an oblique angle of approximately 30 to 60 degrees from horizontal, requires no modification to the stove or kitchen structure, and is powered by a standard USB-C connection.

The Device and its companion mobile application ("the App") implement the following novel methods and systems:

1. **Angled-Mount Perspective Correction Method:** A homographic transformation computed from four user-supplied corner points of the stovetop boundary transforms thermal frames from the angled sensor perspective into a rectified top-down coordinate space.

2. **User-Guided Burner Calibration Method:** An interactive calibration wizard guides the user to manually confirm, drag, resize, and label circular burner regions overlaid on the perspective-corrected thermal image. Validation is performed by the user turning burners off one at a time and confirming correct detection. No automatic burner detection or calibration is performed without user confirmation at each step.

3. **Per-Burner Independent State Machine Monitoring:** Each user-defined burner region is independently monitored by a finite state machine with states including OFF, WARMING, ACTIVE, BOILING, and COOLING, with transitions governed by absolute temperature thresholds, temporal patterns, and rate-of-change analysis.

4. **Boil Detection by Thermal Rate-of-Change Analysis:** Boiling is detected through characteristic thermal signatures: a temperature plateau approaching 100°C (or calibrated equivalent), followed by thermal oscillation patterns consistent with convective bubble-induced surface temperature variation.

5. **Thermal-Signature Human Presence Detection:** The thermal array sensor, while primarily monitoring the stovetop, simultaneously analyzes the peripheral image area outside the mapped stovetop region for thermal signatures in the range of 30°C to 37°C corresponding to human body heat. A moving thermal object of appropriate temperature range in the peripheral zone is classified as human presence. Absence of such a signature while one or more burners are in an ACTIVE state triggers an "unattended" alert condition.

6. **Gas-State-Aware Alert Severity Modulation:** When the optional gas sensor module is present, detected gas levels are evaluated in combination with the thermal-derived stove operating state to assign alert severity. Detection of combustible gas when all burners are in an OFF state results in a HIGH severity alert; detection when burners are ACTIVE results in a NORMAL monitoring state; detection when burners have recently transitioned from ACTIVE to OFF results in a MODERATE alert.

7. **Local-First Safety Architecture:** All safety-critical monitoring and alerting logic executes on the embedded microcontroller, independent of cloud connectivity, mobile application state, or internet availability. Local audible and visual alerts are the primary safety response; cloud and mobile push notifications are supplementary.

---

## 6. Brief Description of Drawings

The following figures would accompany a formal application. The inventor or attorney should commission formal patent drawings based on these descriptions:

**Figure 1 — System Overview Diagram:** Perspective view of a kitchen showing the StoveIQ Device mounted under a kitchen cabinet at an oblique angle, viewing the stovetop below. Shows the device mounting position, the angular field-of-view cone, the stove below, and a smartphone displaying the companion app. Labels indicate the device, the USB-C power cable, the mounting bracket with ball joint, and the WiFi/BLE wireless connections.

**Figure 2 — Device Hardware Block Diagram:** Block diagram of the Device's internal electronics, showing: USB-C power input; LDO voltage regulator; ESP32-S3 microcontroller; MLX90640 IR thermal array sensor connected via I2C bus; optional BME688 gas sensor connected via I2C bus and JST connector; WS2812B RGB LED; piezo buzzer; and PCB trace antenna for WiFi/BLE. Arrows indicate power and data flows.

**Figure 3 — Device Physical Form Factor (Isometric View):** Isometric drawing of the Device enclosure showing the compact rectangular housing, the ball-joint mounting bracket attached to the bottom rear, the USB-C port, the IR sensor window aperture on the front face, the ventilation slots, and the optional gas sensor module port.

**Figure 4 — Mounting Geometry Diagram:** Side-elevation diagram showing the Device mounted under a cabinet at angle θ (30–60 degrees from horizontal), the field-of-view cone from the sensor, the distance d from the device to the stovetop, and the resulting coverage area on the stovetop surface.

**Figure 5 — Perspective Correction Method Diagram:** Two side-by-side representations: (a) the raw angled thermal image as received from the sensor, showing the trapezoidal distortion of a rectangular stovetop, with four labeled corner point markers (P1, P2, P3, P4); and (b) the rectified top-down thermal image after homographic transformation, showing the stovetop as a proper rectangle. Arrows and the label "3x3 Homography Matrix H" connect the two images.

**Figure 6 — User-Guided Calibration Wizard Flow:** Flowchart of the mobile application calibration process, showing sequential screens: (Step 1) Live thermal preview with corner-tap instructions; (Step 2) Confirmation of four corner points; (Step 3) Instruction to turn on all burners; (Step 4) Perspective-corrected thermal image with auto-suggested circle overlays; (Step 5) User drag-to-adjust and confirm each circle; (Step 6) User labels each burner; (Step 7) Validation — user turns off one burner at a time and confirms detection. Arrows connect each step with decision points for retry.

**Figure 7 — Burner Region Map Representation:** Top-down view of the rectified stovetop coordinate space showing four circular burner regions (B1 through B4), each defined by a center coordinate (x, y) and radius r in the corrected coordinate space. Shows label positions and example temperature readouts inside each circle.

**Figure 8 — Per-Burner State Machine Diagram:** Finite state machine diagram with five states: OFF, WARMING, ACTIVE, BOILING, COOLING. Labeled directed transitions between each state showing the trigger conditions (e.g., "T > threshold_warm → WARMING", "T > threshold_active → ACTIVE", "boil pattern detected → BOILING", "T decreasing below threshold → COOLING", "T < threshold_off → OFF").

**Figure 9 — Boil Detection Method Diagram:** Time-series graph showing temperature (°C) on the vertical axis and time on the horizontal axis for a representative cooking event. Labeled phases: (a) room temperature start; (b) rising temperature as burner heats liquid; (c) temperature plateau approaching 100°C; (d) thermal oscillation band indicating active boiling. Annotations call out the plateau detection threshold and the oscillation amplitude/frequency parameters used for boil confirmation.

**Figure 10 — Human Presence Detection Diagram:** Top-down representation of the rectified thermal image divided into two zones: (a) the stovetop monitoring zone (defined by the calibrated burner map boundary); (b) the peripheral human presence detection zone (all pixels outside the stovetop boundary). Shows example thermal signatures — a burner heat spot in zone (a) and a human-temperature thermal blob in zone (b). Arrows indicate the separate analysis paths for each zone.

**Figure 11 — Gas-State-Aware Alert Severity Decision Logic:** Flowchart taking two inputs: (a) gas sensor reading (above threshold or below threshold); (b) thermal-derived stove state (OFF, ACTIVE, RECENTLY OFF). Output branches to three alert severity levels: HIGH (gas detected, burners OFF), MODERATE (gas detected, burners recently turned off), and NORMAL monitoring (gas detected, burners active). Each branch shows the resulting user notification type.

**Figure 12 — Local-First Safety Architecture Diagram:** Layered architecture diagram showing: (bottom layer) ESP32 firmware safety tasks executing on-device; (middle layer) local network communication via WebSocket to the mobile app on LAN; (top layer) cloud MQTT communication for remote notifications. Arrows indicate that on-device safety monitoring is independent and does not require the middle or top layers to function. The local buzzer and LED alert path is highlighted as the primary safety response.

**Figure 13 — Mobile App Heat Map UI Screen:** Screenshot-style mockup of the App's main monitoring screen showing: the perspective-corrected thermal image with color-coded temperature overlays (cool = blue through hot = red/white); circular burner overlays labeled with names and current temperatures; status indicators for each burner (OFF, ACTIVE, BOILING); a legend for the temperature color scale; and notification icons.

**Figure 14 — Firmware Task Architecture Diagram:** Layered task diagram showing the FreeRTOS task hierarchy: Safety Monitor Task (highest priority), Sensor Acquisition Task, Processing Pipeline Task, Burner State Machine Task, MQTT Client Task, HTTP/WebSocket Server Task, OTA Task, and LED/Buzzer Task (lowest priority). Shared data structures (thermal frame buffer, burner state array) are shown between tasks with thread-safety annotations.

---

## 7. Detailed Description of Preferred Embodiments

### 7.1 Hardware Embodiment

#### 7.1.1 Overview

The Device comprises a compact enclosure (approximately 80mm × 55mm × 35mm in the preferred embodiment) housing a printed circuit board (PCB) with the following integrated components. The enclosure is fabricated from heat-resistant ABS thermoplastic rated to 105°C continuous, with ventilation slots on the top and side faces for convective cooling and a solid rear panel. A recessed aperture on the front face accommodates the IR sensor window, which is a germanium or silicon window transparent to the 8–14 μm thermal infrared spectrum.

The Device is designed to be powered continuously via USB-C (5V input, approximately 0.15A average draw, 0.5A maximum during WiFi transmission bursts), using any standard USB-C power adapter of 5W or greater. No battery is required or provided; the Device is intended for permanent always-on installation.

A ball-joint mounting bracket is attached to the rear of the enclosure, accommodating mounting angles from approximately 0 to 90 degrees from horizontal. The bracket is designed for attachment to the underside of a kitchen cabinet or to a wall surface behind or beside the stove using screws or adhesive mounting hardware.

#### 7.1.2 Microcontroller

The preferred embodiment uses the ESP32-S3-WROOM-1 module (Espressif Systems), specifically the N8R8 variant providing 8 MB Flash and 8 MB PSRAM. The ESP32-S3 includes dual Xtensa LX7 cores running at up to 240 MHz, an integrated 2.4 GHz 802.11 b/g/n WiFi transceiver, Bluetooth 5.0 / BLE radio, and vector processing extensions suitable for digital signal processing operations including matrix arithmetic.

The processor executes firmware based on the ESP-IDF v5.x framework with FreeRTOS, running multiple concurrent tasks at defined priority levels. The use of dual cores and PSRAM is important: the 768-element (32×24) floating-point thermal frame requires approximately 3 KB per frame for raw values and additional buffer space for double-buffering and intermediate processing; the PSRAM enables this without exhausting internal SRAM.

One skilled in the art will recognize that equivalent microcontrollers with comparable processing capability, wireless connectivity, and memory capacity may be substituted without departing from the spirit of the invention.

#### 7.1.3 Infrared Thermal Array Sensor

The preferred embodiment uses the Melexis MLX90640ESF-BAB (110-degree field of view variant). This sensor produces a 32-column by 24-row array of temperature measurements, each representing the radiated thermal energy from the corresponding area of the scene within the sensor's field of view. The sensor communicates via I²C at up to 1 MHz and produces calibrated temperature values in degrees Celsius at frame rates of up to 16 frames per second in single-page readout mode (64 frames per second in interleaved mode, though at reduced accuracy).

The 110-degree field of view is selected to maximize stovetop coverage from the angled mounting position. At a mounting height of 18–24 inches (45–60 cm) above the cooktop and an angle of 35–50 degrees from horizontal, the 110-degree FOV provides coverage of approximately 40 × 30 inches of surface area, sufficient for standard 30-inch and 36-inch residential cooktops.

In the preferred embodiment, the IR sensor is thermally isolated from the PCB using a 2 mm standoff and thermal pad (e.g., Bergquist SIL-PAD or equivalent) to minimize the effect of PCB-conducted heat on the sensor's internal temperature compensation circuit.

The sensor operates over an ambient temperature range of -40°C to 85°C (sensor package) and can measure scene temperatures from -40°C to +300°C. This range encompasses all normal and unsafe stovetop conditions.

#### 7.1.4 Optional Gas Sensor Module

An optional plug-in module connects to the main PCB via a 4-pin JST connector (VCC, GND, SDA, SCL) carrying a 3.3V I²C bus. The preferred embodiment of this module uses the Bosch BME688 multi-gas sensor, which detects volatile organic compounds (VOCs), combustible gases, and provides auxiliary temperature, humidity, and barometric pressure readings. The BME688 module is positioned to sample ambient kitchen air rather than being placed directly in the path of stove exhaust, to provide representative room-air gas concentration measurements.

The 4-pin JST connector is designed such that the module can be added by the user post-purchase without soldering (plug-in installation). The firmware automatically detects the presence of the gas sensor at I²C address 0x76 or 0x77 during initialization and enables gas-state-aware alerting logic if the module is detected.

#### 7.1.5 Local Alert Hardware

The Device includes an addressable RGB LED (WS2812B or equivalent) visible through a diffuse window on the front face, driven by a single-wire protocol from the microcontroller. The LED provides visual status indication using a defined color vocabulary: green for normal/idle, amber for active monitoring, red for alert, and blue for connectivity/pairing operations.

A piezo buzzer (preferred: PKLCS1212E4001 or equivalent, approximately 85 dB at 10 cm, 4 kHz resonant frequency) is driven by the microcontroller via a GPIO pin. The buzzer provides audible alerts for safety-critical conditions and acknowledges user interactions. The buzzer operates independently of WiFi and mobile app connectivity.

---

### 7.2 Mounting and Perspective Correction Method

#### 7.2.1 Physical Mounting

Referring to Figure 4, the Device is mounted on the underside of a kitchen cabinet or on a wall surface such that the IR sensor has an unobstructed line of sight to the entire stovetop surface at an oblique angle θ, where θ is between approximately 30 and 60 degrees from horizontal in the preferred embodiment, though the method is applicable to any non-perpendicular angle. The ball-joint mounting bracket allows the user to aim the Device toward the stovetop during installation and lock the ball joint at the desired angle. The preferred mounting distance from Device to cooktop surface is 18 to 24 inches (45–60 cm).

Because the sensor views the stovetop at an oblique angle rather than directly overhead, the raw thermal image produced by the sensor exhibits perspective distortion: the stovetop appears trapezoidal rather than rectangular, and features of equal physical size appear smaller in the image as they are further from the sensor. This distortion must be corrected before burner positions can be accurately identified or mapped.

#### 7.2.2 Perspective Correction via Homographic Transformation

The perspective correction method proceeds as follows, referring to Figure 5 and Figure 6 (Steps 1–2):

**Step 1 — Live Thermal Preview:** During the initial setup wizard, the mobile application displays a live thermal image as received from the Device sensor, rendered as a false-color heat map. The user is instructed to identify and tap the four corners of the stovetop cooking surface boundary within this image.

**Step 2 — Corner Point Collection:** The user taps four points on the displayed thermal image, corresponding to the four corners of the stovetop boundary in the raw (distorted) sensor image. These four source points are: P1 (top-left corner of stovetop in sensor view), P2 (top-right), P3 (bottom-right), and P4 (bottom-left). The App displays draggable markers at each tapped location to allow fine adjustment. The App transmits these four (x, y) pixel coordinates in the raw sensor image to the Device firmware.

**Step 3 — Homography Matrix Computation:** Given the four source corner points {P1, P2, P3, P4} in the raw 32×24 sensor coordinate space, and four corresponding destination points {P1', P2', P3', P4'} representing the corners of a rectified output rectangle (e.g., a 32×24 or upscaled 128×96 grid representing a top-down view), the firmware computes a 3×3 homography matrix H using the Direct Linear Transform (DLT) algorithm. The matrix H satisfies:

```
[x']     [h11  h12  h13] [x]
[y']  ≡  [h21  h22  h23] [y]
[w']     [h31  h32  h33] [1]
```

where (x, y) are source coordinates and (x', y') = (x'/w', y'/w') are the corresponding rectified destination coordinates. The matrix H is computed via singular value decomposition (SVD) of the 8×8 linear system derived from the four point correspondences.

**Step 4 — Real-Time Frame Transformation:** The computed homography matrix H is stored in firmware non-volatile storage (NVS). For every subsequent thermal frame received from the sensor (nominally 4 frames per second in the preferred embodiment), the firmware applies the transformation by computing, for each pixel in the rectified output grid, the corresponding source location in the raw frame using the inverse homography H⁻¹. Bilinear interpolation is used to produce sub-pixel temperature estimates for rectified grid locations that fall between raw sensor pixel centers. The result is a rectified thermal image representing a synthesized top-down view of the stovetop, regardless of the actual physical mounting angle.

In the preferred embodiment, the homography computation is performed once during calibration and stored persistently; the real-time per-frame transformation uses only the stored matrix H and its precomputed inverse H⁻¹, making the operation computationally efficient.

One skilled in the art will recognize that the rectified output can be computed to any desired resolution by upsampling, and that alternative perspective correction methods such as Radial Basis Function (RBF) warping, polynomial distortion correction, or camera calibration models (e.g., Zhang's planar calibration method) could be substituted without departing from the spirit of the invention.

---

### 7.3 User-Guided Burner Calibration Method

This section describes the user-guided burner mapping method, which is a central novel aspect of the invention. This method is intentionally designed as a user-interactive process in which all burner region assignments require explicit user confirmation; no burner region is automatically assigned or finalized without user approval at each step.

#### 7.3.1 Purpose and Design Philosophy

The user-guided calibration method allows the system to learn the spatial layout of burner positions on any stovetop — including 2-burner, 4-burner, 5-burner, and commercial-style stovetops — without requiring prior knowledge of stove models or configurations. The method relies on the user's own knowledge of which burner is which, supplemented by visual heat signatures during calibration. This approach is explicitly distinguished from automatic calibration methods that attempt to algorithmically identify burner positions without user involvement at each step.

#### 7.3.2 Calibration Procedure

Referring to Figure 6 (Steps 3–7):

**Step 3 — Activate All Burners:** The App instructs the user to turn on all burners on the stovetop to their medium-high setting and wait approximately 60 seconds for thermal signatures to become visible in the IR array.

**Step 4 — Display Perspective-Corrected Image with Suggested Regions:** The App displays the perspective-corrected thermal image (output of the homography transform described in Section 7.2). The App may optionally analyze the rectified thermal image for local thermal maxima (connected regions with temperatures exceeding a threshold above ambient, for example, 80°C above ambient) and render suggested circular overlay regions at each detected hot spot. These suggested regions are presented as visual aids only. No burner assignment or calibration data is stored based on this automatic suggestion step alone.

**Step 5 — User Confirms, Adjusts, and Creates Regions:** The user interacts with the App UI to:
- Accept a suggested circular region by tapping a checkmark, OR
- Drag a suggested circular region to correct its position, OR
- Resize a suggested circular region by pinch-to-resize, OR
- Delete a suggested circular region if incorrectly detected, OR
- Add a new circular region from scratch by tapping an empty area.

This step ensures that all burner regions are explicitly approved by the user. The system does not finalize any burner region unless the user takes an affirmative action to accept or create it.

**Step 6 — User Labels Each Region:** For each confirmed circular region, the user assigns a label identifying the burner's position (e.g., "Front Left," "Front Right," "Rear Left," "Rear Right," "Center"). These labels are stored as metadata for each burner region and are displayed in the App during normal monitoring.

**Step 7 — Validation by Sequential Deactivation:** The App prompts the user to turn off each burner one at a time while watching the App display. As each burner is turned off, the corresponding thermal region in the corrected image should cool, and the App should transition that burner's displayed state toward its cooling or off state. The user confirms that the correct on-screen burner region responds when each physical burner is turned off. If a mismatch is detected, the user can reassign labels or re-drag regions to correct the mapping. The calibration is not marked complete until the user taps a final confirmation button.

#### 7.3.3 Stored Calibration Data

Upon completion of calibration, the Device firmware stores the following calibration data in non-volatile storage (NVS):
- The 3×3 homography matrix H (9 floating-point values)
- For each burner region: center coordinates (cx, cy) in the rectified coordinate space, radius r in pixels of the rectified space, and label string (UTF-8, max 32 characters)
- The count of defined burner regions (minimum 1, maximum 6 in the preferred embodiment)

This calibration data persists across power cycles and firmware updates (unless the user explicitly re-runs calibration).

---

### 7.4 Per-Burner Monitoring and State Machine

#### 7.4.1 Burner Temperature Sampling

For each defined burner region (center cx, cy, radius r in the rectified coordinate space), the firmware computes a representative temperature value for each thermal frame by averaging the temperature values of all rectified pixels whose centers fall within the circular region. In the preferred embodiment, pixels within the circle are identified by the condition (px − cx)² + (py − cy)² ≤ r², and the representative temperature is the arithmetic mean of all qualifying pixel temperature values. Optionally, a weighted mean using a Gaussian kernel (higher weight at the center, lower at the periphery) may be used to reduce sensitivity to edge artifacts.

The representative temperature is computed at the sensor frame rate (4 Hz in the preferred embodiment) and stored in a circular buffer of the most recent N samples (preferred N = 120, representing 30 seconds of history) for each burner region.

#### 7.4.2 State Machine Definition

Referring to Figure 8, each burner region independently maintains a finite state machine with the following states:

- **OFF:** The burner's representative temperature is at or near ambient room temperature (e.g., within 15°C of the ambient reference temperature, where ambient is estimated from the coolest region of the rectified image outside all mapped burner regions).
- **WARMING:** The burner's temperature is above the OFF threshold but below the ACTIVE threshold, and is increasing at a rate indicating recent activation (e.g., rate-of-change > 2°C per second sustained over at least 5 consecutive frames).
- **ACTIVE:** The burner's temperature has exceeded the ACTIVE threshold (preferred: ambient + 80°C) or has stabilized at an elevated temperature consistent with ongoing cooking.
- **BOILING:** The burner's thermal signature meets the boil detection criteria described in Section 7.5.
- **COOLING:** The burner's temperature is decreasing from an elevated state toward ambient, at a rate consistent with passive cooling after burner deactivation (negative rate-of-change, temperature above OFF threshold). The COOLING state distinguishes a recently-used burner (still warm) from a cold burner in the OFF state.

#### 7.4.3 State Transition Logic

State transitions are governed by the following conditions, evaluated on each new thermal frame:

| From State | To State  | Condition |
|------------|-----------|-----------|
| OFF        | WARMING   | Temperature > (ambient + 15°C) AND rate-of-change > 2°C/s |
| WARMING    | ACTIVE    | Temperature > (ambient + 80°C) |
| WARMING    | OFF       | Temperature returns to ≤ (ambient + 15°C) |
| ACTIVE     | BOILING   | Boil detection criteria met (see Section 7.5) |
| ACTIVE     | COOLING   | Rate-of-change < −0.5°C/s for 10 consecutive frames AND temperature declining |
| BOILING    | ACTIVE    | Boil detection criteria no longer met (e.g., heat reduced, liquid removed) |
| BOILING    | COOLING   | Rate-of-change < −0.5°C/s for 10 consecutive frames |
| COOLING    | OFF       | Temperature ≤ (ambient + 15°C) |
| COOLING    | WARMING   | Rate-of-change > 2°C/s (burner re-activated while still warm) |

Thresholds are configurable in firmware and may be adjusted via OTA update. One skilled in the art will recognize that the specific threshold values may be tuned based on empirical data from different stove types without departing from the scope of the invention.

#### 7.4.4 Unattended Burner Alert Logic

The Safety Monitor Task maintains a per-burner timer that resets whenever a human presence is detected in the peripheral zone (see Section 7.6) or when the burner transitions through a state change consistent with user interaction (e.g., heat level change). If any burner remains in ACTIVE or BOILING state and no human presence has been detected for a configurable duration (default: 30 minutes), the Safety Monitor Task triggers an UNATTENDED BURNER alert, activating both the local buzzer/LED and a cloud push notification to the mobile app.

---

### 7.5 Boil Detection Method

#### 7.5.1 Physical Basis

When a liquid in a cooking vessel reaches its boiling point, convective bubble formation causes characteristic fluctuations in the thermal emission at the vessel's surface. Specifically: (a) the surface temperature plateaus at the liquid's boiling point (approximately 100°C for water at standard atmospheric pressure, lower at altitude, higher with dissolved solutes); and (b) the local temperature at the vessel surface exhibits periodic oscillations as cooler liquid from below rises, vapor bubbles form and burst, and heat transfer temporarily increases. This produces a characteristic pattern in the time-series thermal data that is distinguishable from non-boiling elevated-temperature cooking states (e.g., frying, sautéing).

#### 7.5.2 Detection Algorithm

Referring to Figure 9, boil detection for a given burner region proceeds as follows:

**Phase 1 — Plateau Detection:** The firmware computes the rolling mean temperature of the burner region over the most recent 15-second window (60 frames at 4 Hz). When this rolling mean exceeds a plateau threshold (preferred: 85°C as a proxy for approaching-boil state, adjustable for altitude), Phase 2 analysis is activated.

**Phase 2 — Oscillation Analysis:** Within the burner region, the firmware computes the per-frame variance of temperature values across the region's pixels (spatial variance within the circle). As boiling begins, vapor bubble formation causes local hot spots that increase spatial variance. Simultaneously, the temporal standard deviation of the rolling mean temperature is computed over a 5-second window. Boiling is confirmed when:
- Rolling mean temperature > plateau threshold (85°C preferred), AND
- Temporal standard deviation of rolling mean > oscillation threshold (preferred: 1.5°C std dev over 20 frames), AND
- Spatial pixel variance within the region > spatial variance threshold (preferred: 4°C² variance)

These three conditions together must be sustained for a minimum of 10 consecutive frames (2.5 seconds at 4 Hz) before the state machine transitions to BOILING, to avoid false positives from transient thermal events.

**Boil Notification:** Upon entering the BOILING state, the Device sends a push notification to the mobile app ("Your front-left burner is boiling") and optionally plays a distinct audio tone on the local buzzer. This allows the user to reduce heat, add ingredients, or start a timer.

One skilled in the art will recognize that the boil detection algorithm can be adapted to detect other cooking milestones (e.g., simmer state, caramelization temperature ranges) by adjusting thresholds and oscillation parameters.

---

### 7.6 Human Presence Detection Method

#### 7.6.1 Dual-Purpose Use of the Thermal Array

A key novel aspect of this invention is the use of the single infrared thermal array sensor — which is primarily installed and calibrated for stovetop monitoring — as a simultaneous sensor for detecting human presence in the vicinity of the stove. No additional sensor (e.g., passive infrared motion sensor, ultrasonic sensor, camera) is required for human presence detection.

#### 7.6.2 Zone Definition

Referring to Figure 10, the rectified top-down thermal image is divided into two analysis zones:

**Zone A — Stovetop Monitoring Zone:** The rectangular region in the rectified image corresponding to the stovetop cooking surface, as defined by the four corner points provided during perspective correction setup.

**Zone B — Peripheral Human Presence Zone:** All pixels in the rectified thermal image that fall outside Zone A. This zone includes the surrounding kitchen area visible in the sensor's field of view, including the space in front of and to the sides of the stove where a person would stand while cooking or walking nearby.

#### 7.6.3 Human Presence Detection Algorithm

For each thermal frame, the firmware analyzes Zone B as follows:

**Step 1 — Human Temperature Threshold Filter:** Pixels in Zone B with temperatures within the human body surface temperature range (preferred: 28°C to 38°C, encompassing skin surface temperature of hands, face, and arms as typically seen through clothing at kitchen distances) are identified as "candidate human pixels."

**Step 2 — Connected Component Analysis:** Adjacent candidate human pixels are grouped into connected blobs. Blobs with fewer than a minimum pixel count (preferred: 3 pixels, representing a minimum physical size of approximately 6–8 inches at 20-inch mounting distance) are discarded as noise.

**Step 3 — Motion Confirmation:** The firmware compares the positions of qualifying blobs between consecutive frames. A blob that moves between frames (centroid displacement > 1 pixel between frames) is classified as a "moving human-temperature object." Static blobs (e.g., a warm cup on a counter that happens to be in Zone B) are treated with lower confidence.

**Step 4 — Presence State Update:** If one or more qualifying blobs are detected in Zone B in the current frame, the Human Presence state is set to PRESENT and the unattended burner timer is reset. If no qualifying blobs have been detected for a sliding window of 60 consecutive frames (15 seconds at 4 Hz), the Human Presence state transitions to ABSENT. The 15-second hysteresis prevents rapid toggling due to momentary occlusion.

#### 7.6.4 Differentiation from PIR-Based Approaches

This approach is distinguished from conventional Passive Infrared (PIR) motion detectors in that: (a) the same sensor array is used for both stovetop monitoring and presence detection, requiring no additional hardware; (b) presence detection uses actual temperature-calibrated thermal imagery rather than simple motion-induced pyroelectric signal changes; (c) the method can distinguish between a human (30°–38°C moving object) and other heat sources (a hot pot moved to a back burner, a steam plume, etc.) based on temperature signature rather than motion alone; and (d) the method is spatially precise, identifying not just that something moved but what its thermal characteristics are and where in the field of view it appeared.

---

### 7.7 Gas-State-Aware Alert Severity Modulation

#### 7.7.1 The Problem with Standalone Gas Alerting

A standalone gas sensor, when installed in a kitchen, will detect combustible gas present during normal stove operation (particularly when gas stove burners are lit, as trace uncombusted gas is always present). This results in frequent false positive alerts if the gas sensor threshold is set low enough to detect actual leaks. Conversely, setting the threshold high enough to avoid false positives during cooking reduces sensitivity to actual leaks when the stove is off.

#### 7.7.2 Stove-State Modulated Gas Alert Logic

The present invention addresses this problem by combining the output of the optional gas sensor with the thermal-derived stove operating state from the burner state machines to assign alert severity. Referring to Figure 11:

**Input 1 — Gas Concentration:** The BME688 gas sensor reports a gas resistance value or derived gas concentration index. When this value crosses a configurable detection threshold (indicating presence of combustible gas, VOC, or smoke above ambient baseline), a gas detection event is flagged.

**Input 2 — Thermal-Derived Stove State:** The Safety Monitor Task aggregates the individual burner states as follows:
- **ALL_OFF:** All burner regions are in OFF state.
- **RECENTLY_OFF:** One or more burners transitioned from ACTIVE or BOILING to COOLING or OFF within the past configurable window (preferred: 5 minutes).
- **ACTIVE:** One or more burners are in ACTIVE or BOILING state.

**Alert Severity Logic:**

| Gas Detection | Stove State    | Alert Severity | Rationale |
|---------------|----------------|----------------|-----------|
| Detected      | ALL_OFF        | HIGH           | Gas present with no active burners — potential unintentional gas leak |
| Detected      | RECENTLY_OFF   | MODERATE        | Gas may be residual from recently extinguished burners; monitor and clear |
| Detected      | ACTIVE         | NORMAL monitoring | Gas consistent with active burner operation; elevated baseline monitoring only |
| Not detected  | Any            | No alert        | Normal operation |

**HIGH severity** triggers: immediate local buzzer alert at maximum volume, red LED flashing, push notification with "URGENT: Gas detected — all stove burners appear off" message, and a secondary notification if not acknowledged within 60 seconds.

**MODERATE severity** triggers: local LED amber flash, push notification with "Gas detected after recent stove use — please ventilate" message, no repeat notification if the stove state transitions to ALL_OFF for more than 5 minutes without continued detection.

**NORMAL monitoring** triggers: no alert to user; internal logging of gas detection events for analytics; background monitoring continues.

#### 7.7.3 Novelty of Combined Approach

The novel aspect of this method is the use of the thermal-derived stove state (obtained from the IR thermal array) as a contextual modifier for gas sensor alert classification. Neither sensor alone can provide this level of context-aware alerting: the thermal sensor alone cannot detect gas; the gas sensor alone cannot determine whether the stove is in use. Their combination enables a new class of intelligent alert logic.

---

### 7.8 Local-First Safety Architecture

#### 7.8.1 Design Principle

The safety architecture of the Device is designed around the principle that network connectivity must never be required for the Device to fulfill its primary safety function. A device that requires a cloud connection to trigger a safety alert is not an adequate safety device: home internet connections fail, routers reboot, cloud services have outages, and WiFi signals may be degraded in certain kitchen configurations.

#### 7.8.2 On-Device Safety Processing

Referring to Figure 12, all of the following safety monitoring and alerting logic executes entirely within the ESP32-S3 firmware, requiring no network connectivity:

- Thermal frame acquisition from the IR sensor
- Homography transformation (perspective correction) of each frame
- Per-burner temperature sampling and state machine updates
- Boil detection algorithm
- Human presence detection in Zone B
- Unattended burner timer management and alert triggering
- Gas concentration threshold comparison and severity classification
- Local buzzer activation and LED state control

The Safety Monitor Task runs at the highest FreeRTOS task priority (priority 24 in the preferred embodiment) and cannot be preempted by network communication tasks, OTA update tasks, or any lower-priority operations.

#### 7.8.3 Connectivity Layer as Supplementary

WiFi connectivity, MQTT communication to the cloud backend, and push notifications to the mobile app are handled by lower-priority tasks (MQTT Client Task, HTTP/WebSocket Server Task). These tasks are designed to degrade gracefully: if WiFi connectivity is lost, the affected tasks enter a reconnection retry loop and the Device continues all local safety monitoring without interruption. Push notifications will be delivered when connectivity is restored if buffered in the MQTT client's offline queue.

#### 7.8.4 Local Network Communication

When the mobile app is on the same local network as the Device, the Device operates as an HTTP and WebSocket server discoverable via mDNS. The App connects directly to this local endpoint for real-time thermal frame streaming (up to the full sensor frame rate), which provides lower latency than cloud-routed communication. This local communication path is also available when internet connectivity is absent.

#### 7.8.5 Graceful Degradation Summary

| Failure Scenario | Device Behavior |
|-----------------|-----------------|
| WiFi disconnected | All on-device monitoring continues; local alerts work; push notifications deferred |
| Cloud service outage | Same as WiFi disconnected scenario |
| Mobile app closed | On-device monitoring continues; local alerts work |
| Power interruption + restore | Device reboots, loads stored calibration data from NVS, resumes monitoring within 15 seconds |
| Firmware OTA in progress | Safety Monitor Task continues running during OTA download; OTA write occurs on lower-priority tasks |

---

### 7.9 Mobile Application Embodiment

#### 7.9.1 Overview

The companion mobile application (the "App") is a cross-platform application targeting iOS and Android, implemented in the Flutter framework (Dart language) in the preferred embodiment. The App provides: real-time heat map visualization; calibration wizard; alert management; cooking history; and remote monitoring for caregivers.

#### 7.9.2 Real-Time Heat Map Display

Referring to Figure 13, the App's primary screen renders the perspective-corrected thermal image as a false-color overlay using a continuous color gradient mapping temperature values to visible colors (preferred: blue = cool, through green, yellow, orange, to red and white = hottest). The thermal image is updated at the sensor's frame rate (up to 4 Hz on local network, typically 1 Hz over cloud). Circular overlays corresponding to defined burner regions are rendered on top of the thermal image at the calibrated positions, labeled with the user-assigned burner names and current representative temperatures. Burner state indicators (icons or text) reflect the current state machine state for each burner.

The heat map visualization provides immediate visual feedback: a user can glance at the App and within one second determine which burners are on, their approximate temperatures, and whether any are boiling or approaching an unsafe condition.

#### 7.9.3 Calibration Wizard

The App implements the calibration wizard described in Section 7.3, providing step-by-step visual instructions with interactive UI elements for corner tapping, circle dragging, and burner labeling. The wizard communicates with the Device over the local network WebSocket connection during calibration to transmit corner points and receive perspective-corrected frames in real time.

#### 7.9.4 Remote Monitoring (Caregiver Feature)

A caregiver (e.g., an adult child monitoring an elderly parent's stove) may be added as a secondary user on the device's account. The caregiver receives push notifications for all alert events and can view the live heat map and stove usage history from any location via the cloud backend. The caregiver does not have access to device configuration or calibration; this access level is a read-only monitoring role.

#### 7.9.5 Cooking Session History

The App presents a history view showing cooking sessions aggregated by day, with per-session start time, end time, which burners were used, approximate peak temperatures reached, and whether any alert events occurred. This data is stored in the cloud backend and is useful for caregiver monitoring, behavioral pattern analysis, and troubleshooting.

---

## 8. Abstract of the Invention

A retrofit stovetop monitoring device comprises an infrared thermal array sensor and wireless microcontroller housed in a compact enclosure mountable under a kitchen cabinet or on a wall at an oblique angle to the stovetop, requiring no modification to the stove. A user-guided calibration process uses four user-supplied corner points to compute a homographic perspective transformation that rectifies the angled thermal view into a top-down coordinate space; the user then manually confirms, adjusts, and labels circular burner regions overlaid on the corrected thermal image, with validation by sequential burner deactivation. Each burner region is independently monitored by a per-burner finite state machine with states for OFF, WARMING, ACTIVE, BOILING, and COOLING, with boil detection using thermal rate-of-change and spatial variance analysis. The same thermal array simultaneously performs human presence detection by analyzing peripheral image regions outside the stovetop zone for moving thermal objects in the human body temperature range. An optional plug-in gas sensor module provides combustible gas detection whose alert severity is modulated by the thermal-derived stove operating state: gas detected when all burners are off triggers a high-severity alert, while gas detected during active burner operation triggers only background monitoring. All safety-critical logic, including alert generation and local audible and visual notification, executes on the embedded microcontroller independent of network connectivity.

---

## Appendix A: Inventor's Claims Sketch (For Attorney Reference Only)

*The following is the inventor's informal description of what they believe to be patentable. This is NOT formal claim language. The patent attorney should draft formal independent and dependent claims based on these concepts, the Detailed Description above, and freedom-to-operate analysis.*

**Concept 1 — Independent Claim Candidate (Core System):**
A stove monitoring system comprising: a retrofit device housing an infrared thermal array sensor and a processor; a mounting system enabling oblique-angle installation relative to a stovetop; a first method of computing a homographic transformation from user-supplied corner points that corrects perspective distortion from the oblique mounting angle; a second method of user-guided interactive burner region mapping that requires explicit user confirmation for each burner region; a per-burner state machine monitoring each region independently; and an alert system that operates without network connectivity.

**Concept 2 — Independent Claim Candidate (User-Guided Calibration Method):**
A method of calibrating a stovetop monitoring device comprising: displaying a thermal image of a stovetop to a user; receiving user input identifying boundary corners of the stovetop; computing a perspective transformation from the user-supplied corners; displaying the perspective-corrected thermal image; displaying one or more suggested burner region candidates as draggable, resizable interactive overlays; requiring user confirmation of each burner region before storing it; receiving user-assigned labels for each region; and validating the mapping by having the user deactivate burners one at a time and confirm correct detection.

**Concept 3 — Independent Claim Candidate (Dual-Use Thermal Presence Detection):**
A method of detecting human presence in a kitchen environment using a single infrared thermal array sensor that also monitors a stovetop, comprising: defining a first image zone corresponding to the stovetop area; defining a second image zone corresponding to pixels outside the stovetop area; analyzing the second zone for thermal signatures consistent with human body surface temperature; classifying moving thermal objects in the second zone above a minimum size and in the human temperature range as human presence; and using the presence classification to modulate safety alerts related to unattended stove operation.

**Concept 4 — Independent Claim Candidate (Gas-State-Aware Alert Modulation):**
A method of generating safety alerts in a kitchen monitoring system comprising: obtaining a gas concentration measurement from a gas sensor; obtaining a stove operating state derived from infrared thermal imaging of the stovetop, the stove operating state classified as one of: all burners off, one or more burners recently turned off, or one or more burners actively operating; and assigning alert severity based on the combination of gas concentration and stove operating state, wherein the same gas concentration level produces different alert severities depending on the stove operating state.

**Concept 5 — Dependent Claim Candidate (Boil Detection):**
The system of Concept 1, further comprising a boil detection method that identifies boiling by: detecting a temperature plateau in a burner region's time-series data exceeding a plateau threshold; confirming temporal oscillation of the rolling mean temperature exceeds an oscillation threshold; and confirming spatial pixel variance within the burner region exceeds a spatial variance threshold; wherein all three conditions must be sustained for a minimum time period before the boil state is assigned.

**Concept 6 — Dependent Claim Candidate (Local-First Architecture):**
The system of Concept 1, wherein safety-critical monitoring and alert generation executes on the embedded processor at a task priority higher than any network communication task, such that loss of network connectivity does not interrupt stove monitoring or local alerting.

---

## Appendix B: Suggested Prior Art Search Terms (For Attorney Reference)

The following search terms are suggested for prior art searches prior to filing. This list is not exhaustive:

- Infrared thermal array stove monitor
- Stovetop safety monitoring retrofit
- Homographic perspective correction thermal camera
- IR array human presence detection kitchen
- Gas sensor thermal context aware alert
- MLX90640 burner detection
- Boil detection infrared
- Unattended cooking detection
- US 11,506,540 (Midea — closest known prior art)
- Smart stove retrofit monitoring
- Thermal camera appliance monitoring

---

*End of Technical Disclosure Document*
*For review by qualified patent attorney prior to filing.*
*Prepared: 2026-03-26*
