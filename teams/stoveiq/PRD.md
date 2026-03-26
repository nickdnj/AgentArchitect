# Product Requirements Document: StoveIQ

**Version:** 1.0
**Last Updated:** 2026-03-26
**Author:** Nick DeMarco with AI Assistance
**Status:** Draft

---

## 1. Executive Summary

StoveIQ is a retrofit smart stove monitor that brings thermal intelligence and safety monitoring to any existing stovetop -- gas or electric -- without requiring appliance replacement. The device mounts under a cabinet or on the wall behind/above the stove and uses an infrared thermal array camera to create a real-time heat map of the cooking surface, enabling per-burner temperature tracking, boil detection, unattended stove alerts, and cooking timers through a companion mobile app.

The product targets safety-conscious homeowners, cooking enthusiasts, caregivers of elderly relatives, and renters who cannot replace their appliances. StoveIQ will launch via Kickstarter crowdfunding at $99 (early bird) / $129 (retail), with a provisional patent filed before campaign launch.

The MVP delivers core thermal monitoring, safety alerts, and a polished mobile app experience. Post-launch releases will add AI-powered cooking intelligence, gas leak detection, human presence detection, recipe integration, and smart home integrations.

**Key differentiator:** StoveIQ is the only retrofit device that provides a real-time thermal heat map with per-burner temperature monitoring and algorithmic boil detection. Competing products either require full appliance replacement (Samsung Smart Range) or offer only binary on/off detection without thermal intelligence (FireAvert).

---

## 2. Problem Statement

### 2.1 The Safety Problem

Cooking fires are the leading cause of home fires in the United States, responsible for approximately 49% of all residential fires according to the NFPA. Unattended cooking is the leading contributing factor. Elderly adults are at disproportionate risk, with adults aged 65+ having a cooking fire death rate more than double the overall population average.

Existing solutions are inadequate:

- **Smoke detectors** alert only after a fire has started -- they are reactive, not preventive.
- **Smart stoves** (Samsung, LG) cost $2,000+ and require full appliance replacement, making them inaccessible to renters and cost-prohibitive for most homeowners.
- **FireAvert** plugs into the stove outlet and cuts power when the smoke detector goes off -- still reactive, no thermal intelligence.
- **No existing product** provides real-time thermal monitoring of an existing stovetop.

### 2.2 The Cooking Intelligence Gap

Home cooks lack accessible tools for precise stovetop temperature monitoring. Professional kitchens use IR thermometers and thermal cameras, but these are handheld, expensive, and require manual operation. There is no consumer product that provides continuous, passive thermal monitoring of a stovetop with per-burner granularity.

### 2.3 The Retrofit Gap

Approximately 80% of US households cook on stoves that are not "smart." Renters (36% of US households) have no option to replace their appliance. Even homeowners are reluctant to spend $2,000+ to replace a functioning stove for smart features. The market needs a sub-$150 retrofit solution.

---

## 3. Target Users and Personas

### 3.1 Persona: Safety-Conscious Parent (Primary)

- **Name:** Sarah, 42
- **Situation:** Mother of two young children (ages 4 and 7). Worries about the kids approaching the stove when she steps away. Her elderly mother (68) lives alone and has left the stove on twice in the past year.
- **Needs:** Alerts when stove is left on and unattended. Remote monitoring of her mother's stove usage. Peace of mind.
- **Technical comfort:** Moderate. Uses iPhone, familiar with smart home devices (Ring doorbell, Nest thermostat).
- **Willingness to pay:** $100-150 for peace of mind. Would buy a second unit for her mother.
- **Quote:** "I just want to know if I left the stove on after I left the house."

### 3.2 Persona: Cooking Enthusiast (Secondary)

- **Name:** Marcus, 35
- **Situation:** Avid home cook who watches cooking videos and tries complex recipes. Frustrated by inconsistent results because he cannot accurately gauge stovetop temperatures. Rents an apartment with a basic electric stove.
- **Needs:** Real-time temperature monitoring per burner. Boil detection so he can walk away while waiting. Precise heat management for sauces and reductions.
- **Technical comfort:** High. Android user, early adopter, backs Kickstarter projects regularly.
- **Willingness to pay:** $99-129 at early bird pricing. Values the "geek factor" of a thermal camera on his stove.
- **Quote:** "I want to know the actual temperature of my pan, not just that the dial is on 'medium.'"

### 3.3 Persona: Remote Caregiver (Secondary)

- **Name:** Linda, 55
- **Situation:** Her 82-year-old father lives alone 45 minutes away. He still cooks daily but has early-stage cognitive decline. She worries constantly about stove safety but does not want to take away his independence.
- **Needs:** Remote notifications when the stove is on. Alerts if the stove has been on for an unusual duration. Usage history to share with his doctor. Easy installation (she will set it up during a visit).
- **Technical comfort:** Moderate. iPhone user.
- **Willingness to pay:** $129 retail without hesitation. "Whatever it costs."
- **Quote:** "I need to know he's safe without moving him into a facility."

### 3.4 Persona: Renter Who Wants Smart Features (Tertiary)

- **Name:** Alex, 28
- **Situation:** Lives in a rental apartment with a 15-year-old gas stove. Cannot modify the appliance per the lease. Wants smart home features but is limited by the rental situation.
- **Needs:** Non-invasive installation. Smart features without appliance replacement. Works with existing stove.
- **Technical comfort:** High. Uses smart plugs, smart lights, voice assistants.
- **Willingness to pay:** $99 early bird. Price-sensitive but will pay for the right product.
- **Quote:** "I want a smart kitchen without buying a smart stove."

---

## 4. User Stories and Use Cases

### 4.1 Setup and Calibration

| ID | User Story | Priority |
|----|-----------|----------|
| US-001 | As a new user, I want to mount the StoveIQ device under my cabinet or on the wall so that it has a clear view of my stovetop. | P0 |
| US-002 | As a new user, I want to connect the device to my home WiFi through the app so that it can communicate with my phone. | P0 |
| US-003 | As a new user, I want to aim the device at my stovetop using the tilt/swivel mechanism and see a live thermal preview in the app so that I can verify the device sees all burners. | P0 |
| US-004 | As a new user, I want to turn on all my burners and have the app show me the thermal image so I can map each burner's position by dragging circles over them. | P0 |
| US-005 | As a new user, I want the software to apply perspective correction to the angled thermal image so the burner mapping is accurate despite the non-overhead mounting angle. | P0 |
| US-006 | As a user who has moved the device, I want to re-run the calibration process to update the burner mapping. | P1 |
| US-007 | As a new user, I want the app to guide me through setup step-by-step with clear visual instructions so that I can complete installation without reading a manual. | P0 |

### 4.2 Real-Time Monitoring

| ID | User Story | Priority |
|----|-----------|----------|
| US-010 | As a user, I want to see a real-time heat map of my stovetop in the app so that I can visualize which areas are hot. | P0 |
| US-011 | As a user, I want to see the current temperature of each mapped burner individually so I can monitor multiple pots simultaneously. | P0 |
| US-012 | As a user, I want the heat map to update at least once per second so the display feels responsive and real-time. | P0 |
| US-013 | As a user, I want to see a color-coded temperature scale on the heat map so I can quickly assess hot vs. cool areas. | P1 |
| US-014 | As a user, I want to tap a burner on the heat map to see its detailed temperature history over the current cooking session. | P1 |

### 4.3 Safety Alerts

| ID | User Story | Priority |
|----|-----------|----------|
| US-020 | As a user, I want to receive a push notification if a burner has been on for longer than a configurable threshold (default: 30 minutes) with no thermal change detected, so I know I may have forgotten about it. | P0 |
| US-021 | As a user, I want to receive a push notification if a burner is on and I leave the house (based on phone location), so I can take action. | P1 |
| US-022 | As a user, I want to configure per-burner alert thresholds (e.g., alert if burner exceeds 500F), so I can customize safety monitoring. | P1 |
| US-023 | As a caregiver, I want to receive alerts on my phone when the stove at my parent's house is turned on or off, so I can monitor their usage remotely. | P0 |
| US-024 | As a user, I want the device to emit an audible alarm (buzzer) if a critical alert is unacknowledged for 5 minutes, so there is a local alert even if I do not see my phone. | P0 |
| US-025 | As a user, I want to see a stove usage log showing when each burner was on and for how long, so I can review cooking patterns. | P1 |

### 4.4 Boil Detection

| ID | User Story | Priority |
|----|-----------|----------|
| US-030 | As a user, I want the app to detect when water is boiling on a burner (via thermal rate-of-change analysis) and send me a notification so I can reduce heat or add ingredients. | P0 |
| US-031 | As a user, I want to set a "notify me when boiling" alert for a specific burner so I can walk away while waiting. | P0 |
| US-032 | As a user, I want to see a "boiling" indicator on the heat map when boil is detected for a burner. | P1 |

### 4.5 Cooking Timers

| ID | User Story | Priority |
|----|-----------|----------|
| US-040 | As a user, I want to set a countdown timer for a specific burner so I can track cooking duration per pot. | P0 |
| US-041 | As a user, I want to receive a push notification and optional audible alert when a burner timer expires. | P0 |
| US-042 | As a user, I want to see active timers displayed on the heat map view so I have a single dashboard for my cooking. | P1 |
| US-043 | As a user, I want the app to suggest timer durations based on detected thermal patterns (e.g., "Boiling detected -- set a 10-minute timer for pasta?"). | P2 (stretch) |

### 4.6 Multi-User and Remote Access

| ID | User Story | Priority |
|----|-----------|----------|
| US-050 | As a household member, I want to create an account and be invited to share access to the StoveIQ device so multiple people can monitor the stove. | P1 |
| US-051 | As a caregiver, I want to be added as a remote user on my parent's StoveIQ so I can receive their alerts. | P0 |
| US-052 | As the device owner, I want to manage who has access (add/remove users) and what alerts they receive. | P1 |

### 4.7 Use Case: Forgotten Stove Scenario

1. User puts a pot of soup on the stove at medium heat.
2. User walks to another room to work.
3. After 30 minutes of no thermal change at the burner, StoveIQ sends a push notification: "Burner 2 has been on for 30 minutes with no activity. Still cooking?"
4. User taps the notification, opens the app, sees the thermal view.
5. User acknowledges the alert ("Yes, still cooking" or "Thanks, I forgot!").
6. If unacknowledged for 5 more minutes, the device emits an audible alarm.

### 4.8 Use Case: Boil-and-Walk-Away Scenario

1. User puts a pot of water on the stove to boil.
2. User opens the app, taps Burner 1, selects "Notify when boiling."
3. User goes to the living room.
4. StoveIQ detects the thermal plateau characteristic of boiling (temperature stabilizes at ~212F with high-frequency oscillation in the IR signal).
5. User receives push notification: "Burner 1: Water is boiling!"
6. User returns to kitchen, adds pasta, sets a 10-minute timer on Burner 1.
7. Timer expires, user gets notification and audible alert.

### 4.9 Use Case: Caregiver Remote Monitoring

1. Linda installs StoveIQ at her father's house during a weekend visit.
2. She creates his account, adds herself as a caregiver with full alert access.
3. On Monday, Linda receives a notification: "Dad's stove -- Burner 3 turned on at 11:42 AM."
4. At 12:30 PM, she receives: "Dad's stove -- Burner 3 has been on for 48 minutes."
5. Linda calls her father to check in. He forgot he was heating soup. He turns it off.
6. Linda checks the usage log weekly and shares it with his doctor at the next appointment.

---

## 5. Functional Requirements

### 5.1 Thermal Monitoring

| ID | Requirement | Priority |
|----|------------|----------|
| FR-100 | The device SHALL capture thermal data from the IR array at a minimum rate of 4 frames per second. | P0 |
| FR-101 | The device SHALL transmit thermal frame data to the mobile app with end-to-end latency of less than 500ms over local WiFi. | P0 |
| FR-102 | The mobile app SHALL render a color-coded heat map visualization of the stovetop surface, updating at a minimum of 1 frame per second. | P0 |
| FR-103 | The system SHALL display per-burner temperature readings in Fahrenheit or Celsius (user-configurable). | P0 |
| FR-104 | The system SHALL support temperature measurement range of 32F to 932F (0C to 500C), covering all stovetop cooking scenarios. | P0 |
| FR-105 | The system SHALL provide temperature accuracy of +/- 5F (3C) in the cooking range of 150F-500F (65C-260C). | P0 |
| FR-106 | The system SHALL apply perspective correction to the thermal image to compensate for the angled mounting position. | P0 |
| FR-107 | The heat map SHALL use a configurable color gradient (default: blue-green-yellow-red) to represent temperature ranges. | P1 |
| FR-108 | The system SHALL support stovetops with 2, 4, 5, or 6 burners. | P0 |
| FR-109 | The system SHALL log per-burner temperature data at 10-second intervals for the duration of each cooking session. | P1 |
| FR-110 | The system SHALL detect burner on/off state transitions based on thermal thresholds (configurable, default: 120F/50C above ambient). | P0 |

### 5.2 Calibration and Burner Mapping

| ID | Requirement | Priority |
|----|------------|----------|
| FR-200 | The app SHALL display a live thermal preview during calibration so the user can aim the device. | P0 |
| FR-201 | The app SHALL allow the user to drag and resize circular overlays on the thermal image to map each burner's position. | P0 |
| FR-202 | The system SHALL apply perspective correction using a software algorithm that accounts for the device's mounting angle relative to the stovetop. | P0 |
| FR-203 | The calibration process SHALL require the user to turn on all burners so that heat sources are visible in the thermal image. | P0 |
| FR-204 | The system SHALL store calibration data (burner positions, perspective correction parameters) persistently on the device. | P0 |
| FR-205 | The user SHALL be able to re-run calibration at any time from the app settings. | P0 |
| FR-206 | The app SHALL validate that mapped burner circles do not overlap and that at least 2 burners are mapped. | P1 |
| FR-207 | The app SHALL allow the user to label each burner (e.g., "Front Left," "Back Right," or custom names). | P1 |
| FR-208 | The calibration SHALL NOT use automatic burner detection algorithms. Burner positions are defined exclusively by the user's manual circle placement. (Patent design-around requirement.) | P0 |

### 5.3 Boil Detection

| ID | Requirement | Priority |
|----|------------|----------|
| FR-300 | The system SHALL detect boiling state on a per-burner basis using thermal rate-of-change analysis. | P0 |
| FR-301 | Boil detection SHALL trigger when the burner temperature stabilizes within a defined range (configurable, default: 200F-215F / 93C-102C) for a sustained period (configurable, default: 30 seconds) with characteristic thermal oscillation patterns. | P0 |
| FR-302 | Boil detection accuracy SHALL be at least 90% (true positive rate) with a false positive rate below 10% across gas and electric stoves. | P0 |
| FR-303 | The user SHALL be able to enable "Notify when boiling" per burner. | P0 |
| FR-304 | Boil detection SHALL work for both gas and electric (coil and glass-top) stoves. | P0 |
| FR-305 | The system SHALL distinguish between boiling and simmering states. | P2 |

### 5.4 Safety Alerts

| ID | Requirement | Priority |
|----|------------|----------|
| FR-400 | The system SHALL send a push notification when a burner has been continuously on beyond a configurable threshold (default: 30 minutes) with no significant thermal change detected. | P0 |
| FR-401 | The system SHALL allow users to configure alert thresholds per burner: duration, temperature, and change sensitivity. | P1 |
| FR-402 | The system SHALL send a push notification when any burner is on and the user's phone leaves a configurable geofence around the home (default: 500 feet). | P1 |
| FR-403 | The device SHALL emit an audible alarm (minimum 70dB at 1 meter) when a critical alert goes unacknowledged for a configurable period (default: 5 minutes). | P0 |
| FR-404 | The user SHALL be able to acknowledge alerts via push notification action, in-app button, or by pressing a physical button on the device. | P0 |
| FR-405 | The system SHALL support caregiver alerts: designated secondary users receive all or selected alerts from the device. | P0 |
| FR-406 | The system SHALL maintain an alert history log accessible in the app. | P1 |
| FR-407 | The system SHALL detect "all burners off" state and send a confirmation notification when the stove is turned off after an active session. | P1 |
| FR-408 | The system SHALL support Do Not Disturb scheduling (e.g., suppress alerts between 11 PM and 6 AM except critical/high-temp alerts). | P2 |

### 5.5 Cooking Timers

| ID | Requirement | Priority |
|----|------------|----------|
| FR-500 | The user SHALL be able to set a countdown timer for any mapped burner. | P0 |
| FR-501 | Multiple timers SHALL be able to run simultaneously (one per burner). | P0 |
| FR-502 | Timer expiration SHALL trigger a push notification and an optional audible alert on the device. | P0 |
| FR-503 | Active timers SHALL be displayed on the heat map view with remaining time. | P1 |
| FR-504 | The system SHALL auto-cancel a burner timer if the burner is turned off before the timer expires (with a notification). | P1 |

### 5.6 Cooking Session Management

| ID | Requirement | Priority |
|----|------------|----------|
| FR-600 | The system SHALL automatically start a "cooking session" when any burner turns on and end it when all burners have been off for 5 minutes. | P1 |
| FR-601 | Each cooking session SHALL log: start time, end time, burners used, peak temperatures, alerts triggered, and timers set. | P1 |
| FR-602 | The app SHALL display a history of cooking sessions with summary statistics. | P2 |

### 5.7 User and Account Management

| ID | Requirement | Priority |
|----|------------|----------|
| FR-700 | The system SHALL support user registration via email/password or OAuth (Google, Apple Sign-In). | P0 |
| FR-701 | The system SHALL support linking one device to one primary user account. | P0 |
| FR-702 | The primary user SHALL be able to invite up to 5 additional users (household members or caregivers) to share device access. | P1 |
| FR-703 | The primary user SHALL be able to assign roles: "Household" (full access) or "Caregiver" (alerts and view-only). | P1 |
| FR-704 | The system SHALL support one device per account in MVP. Multi-device support is a post-MVP feature. | P0 |

---

## 6. Non-Functional Requirements

### 6.1 Performance

| ID | Requirement | Priority |
|----|------------|----------|
| NFR-100 | Thermal frame capture rate: minimum 4 FPS at the sensor, minimum 1 FPS rendered in app. | P0 |
| NFR-101 | End-to-end latency from sensor capture to app display: less than 500ms on local WiFi (same network). | P0 |
| NFR-102 | End-to-end latency for remote monitoring (via cloud relay): less than 3 seconds. | P1 |
| NFR-103 | Push notification delivery: within 10 seconds of alert trigger. | P0 |
| NFR-104 | App launch to live heat map display: less than 5 seconds (cold start), less than 2 seconds (warm start). | P1 |
| NFR-105 | Device boot time (power-on to operational): less than 30 seconds. | P1 |

### 6.2 Reliability

| ID | Requirement | Priority |
|----|------------|----------|
| NFR-200 | The device SHALL operate continuously (24/7) without requiring restarts. Target uptime: 99.9% (less than 8.7 hours downtime per year). | P0 |
| NFR-201 | The device SHALL automatically reconnect to WiFi after network interruptions within 60 seconds. | P0 |
| NFR-202 | The device SHALL buffer up to 30 minutes of thermal data locally during WiFi outages and sync when connectivity is restored. | P1 |
| NFR-203 | The device SHALL continue local audible alerting during WiFi outages. Safety alerts must not depend on cloud connectivity. | P0 |
| NFR-204 | The device firmware SHALL support over-the-air (OTA) updates. | P0 |
| NFR-205 | OTA updates SHALL NOT interrupt active safety monitoring. Updates shall be applied during idle periods or deferred until all burners are off. | P0 |
| NFR-206 | The device SHALL include a hardware watchdog timer to recover from firmware crashes automatically. | P0 |

### 6.3 Safety

| ID | Requirement | Priority |
|----|------------|----------|
| NFR-300 | The device enclosure SHALL NOT exceed 60C (140F) surface temperature during normal operation, even when exposed to radiant heat from the stove below. | P0 |
| NFR-301 | The device SHALL have no exposed conductive surfaces that could create electrical hazards. | P0 |
| NFR-302 | The device SHALL not emit any gases, odors, or particulates during normal operation or when exposed to elevated ambient temperatures up to 80C (176F). | P0 |
| NFR-303 | The USB-C power cable SHALL be heat-rated for continuous operation at 80C ambient temperature. | P0 |
| NFR-304 | The mounting mechanism SHALL support a minimum of 10 lbs of static load to prevent the device from falling onto the stove. | P0 |
| NFR-305 | All safety-critical alert logic SHALL execute on the device firmware, not in the cloud or mobile app. | P0 |
| NFR-306 | The device SHALL fail safe: if a sensor failure is detected, the device shall emit a distinct audible tone and send a notification indicating a malfunction. | P0 |

### 6.4 Security

| ID | Requirement | Priority |
|----|------------|----------|
| NFR-400 | All communication between device and cloud SHALL use TLS 1.2 or later. | P0 |
| NFR-401 | All communication between device and mobile app on local network SHALL use encrypted channels (TLS or equivalent). | P0 |
| NFR-402 | User credentials SHALL be stored using industry-standard hashing (bcrypt or argon2). | P0 |
| NFR-403 | The device SHALL not expose any open network ports beyond those required for operation. | P0 |
| NFR-404 | OTA firmware updates SHALL be cryptographically signed and verified before installation. | P0 |
| NFR-405 | Thermal data and usage logs SHALL be associated with user accounts and not accessible without authentication. | P0 |

### 6.5 Scalability

| ID | Requirement | Priority |
|----|------------|----------|
| NFR-500 | The cloud backend SHALL support at least 10,000 concurrent connected devices for post-Kickstarter scale. | P1 |
| NFR-501 | The cloud backend SHALL be designed for horizontal scaling to support 100,000+ devices at retail launch. | P2 |

### 6.6 Usability

| ID | Requirement | Priority |
|----|------------|----------|
| NFR-600 | A first-time user SHALL be able to complete physical installation, app setup, WiFi pairing, and calibration in under 15 minutes. | P0 |
| NFR-601 | The app SHALL be usable by adults aged 65+ (minimum 16pt font for critical information, high-contrast UI, simple navigation). | P0 |
| NFR-602 | The app SHALL support English at launch. Localization framework shall be in place for future language support. | P0 |

---

## 7. Hardware Requirements

### 7.1 IR Thermal Sensor

| Parameter | Specification |
|-----------|--------------|
| Sensor | MLX90640 or equivalent IR thermal array |
| Resolution | 32x24 pixels minimum |
| Field of View | 110 degrees (wide) preferred for under-cabinet mounting |
| Temperature range | -40C to 300C (-40F to 572F) sensor range; cooking surface up to 500C (932F) |
| Frame rate | 4 Hz minimum (8 Hz preferred) |
| Accuracy | +/- 1C in 0-100C range per sensor spec; system accuracy +/- 3C after calibration |
| Interface | I2C to MCU |

**Note:** The MLX90640 has a maximum object temperature measurement of 300C. For burners that exceed this (e.g., gas flames), the sensor will report at its maximum and the system will indicate "above range." This is acceptable because the primary use case is monitoring cookware surface temperature, not direct flame temperature. An alternative sensor (e.g., MLX90641 with 200C-1000C range) should be evaluated during prototyping.

### 7.2 Microcontroller

| Parameter | Specification |
|-----------|--------------|
| MCU | ESP32-S3 or ESP32-C3 (WiFi + BLE capable) |
| WiFi | 802.11 b/g/n, 2.4 GHz |
| BLE | Bluetooth 5.0 LE (for initial setup/pairing) |
| Flash | 8 MB minimum (for firmware + OTA partition) |
| RAM | 512 KB SRAM minimum |
| Processing | Dual-core 240 MHz (ESP32-S3) for concurrent thermal processing and WiFi |
| GPIO | I2C for sensor, UART for debug, GPIO for buzzer and LED |

### 7.3 Audio and Visual Indicators

| Component | Specification |
|-----------|--------------|
| Buzzer | Piezoelectric, minimum 70 dB at 1 meter, capable of distinct tones for different alert types |
| Status LED | RGB LED for device status (blue=connected, green=monitoring, red=alert, amber=setup mode) |
| Physical button | Single multi-function button: short press=acknowledge alert, long press (5s)=factory reset |

### 7.4 Power

| Parameter | Specification |
|-----------|--------------|
| Input | USB-C, 5V 1A minimum |
| Power consumption | Less than 3W typical, less than 5W peak |
| Cable | Heat-rated USB-C cable included (silicone jacket, rated for 80C continuous) |
| Power adapter | 5V/2A USB-C adapter included in box |
| No battery | Device is mains-powered only. Battery backup is a post-MVP consideration. |

### 7.5 Enclosure

| Parameter | Specification |
|-----------|--------------|
| Material | High-temperature ABS or polycarbonate (UL94 V-0 flame rated) |
| Dimensions | Target: 80mm x 60mm x 40mm (approximately credit card width) |
| Weight | Less than 150g (device only, excluding mount) |
| IP rating | IP40 minimum (dust protection; not water-resistant -- installed above stove, not near water) |
| Color | Matte white or matte black (two SKUs) |
| IR window | Germanium or silicon lens window, anti-reflective coated, mounted flush |

### 7.6 Mounting System

| Parameter | Specification |
|-----------|--------------|
| Tilt/swivel | Ball joint or two-axis hinge, lockable, with at least 45 degrees of tilt and 30 degrees of swivel |
| Mounting options (included) | (a) 3M VHB adhesive pad for under-cabinet, (b) magnetic mount plate for metal surfaces, (c) two-screw bracket for wall mount |
| Mounting plate | Detachable -- device clicks into the mount for easy removal/repositioning |
| Cable management | Adhesive cable clips included (x4) for routing USB-C cable along cabinet |

### 7.7 Environmental

| Parameter | Specification |
|-----------|--------------|
| Operating temperature | 0C to 80C (32F to 176F) ambient |
| Storage temperature | -20C to 85C (-4F to 185F) |
| Operating humidity | 10% to 90% non-condensing |

---

## 8. Software and Firmware Requirements

### 8.1 Firmware (On-Device)

| ID | Requirement | Priority |
|----|------------|----------|
| FW-100 | The firmware SHALL capture IR thermal frames at the configured rate (4-8 FPS) and process them into temperature arrays. | P0 |
| FW-101 | The firmware SHALL apply the stored calibration data (burner positions, perspective correction) to each frame. | P0 |
| FW-102 | The firmware SHALL compute per-burner aggregate temperatures (average, peak) for each frame. | P0 |
| FW-103 | The firmware SHALL run boil detection algorithms locally on the device. | P0 |
| FW-104 | The firmware SHALL run unattended/left-on detection algorithms locally on the device. | P0 |
| FW-105 | The firmware SHALL manage the audible alarm independently of WiFi or app connectivity. | P0 |
| FW-106 | The firmware SHALL transmit thermal frame data and alert events over WiFi to the cloud backend and/or directly to the mobile app on the local network. | P0 |
| FW-107 | The firmware SHALL support OTA updates with dual-partition A/B scheme for rollback safety. | P0 |
| FW-108 | The firmware SHALL implement a hardware watchdog timer with a 30-second timeout. | P0 |
| FW-109 | The firmware SHALL buffer thermal data and alert events locally during WiFi outages (minimum 30 minutes of data at 10-second intervals). | P1 |
| FW-110 | The firmware SHALL expose a BLE GATT service for initial WiFi provisioning and device pairing. | P0 |
| FW-111 | The firmware SHALL log diagnostic data (uptime, WiFi signal strength, sensor health, reboot count) and report it to the cloud. | P1 |
| FW-112 | The firmware SHALL detect IR sensor malfunction (e.g., all pixels reporting same value, sensor I2C timeout) and enter a fault state with audible and visual indication. | P0 |

### 8.2 Firmware Architecture

- **RTOS:** FreeRTOS (via ESP-IDF) with separate tasks for sensor acquisition, data processing, WiFi communication, alert management, and OTA.
- **Communication protocol:** MQTT over TLS for device-to-cloud telemetry and commands. WebSocket for local real-time streaming to the app.
- **Data format:** Compressed thermal frames (delta encoding) to minimize bandwidth. JSON for alert events and commands.
- **Storage:** LittleFS on flash for calibration data, alert buffer, and configuration.

---

## 9. Mobile App Requirements

### 9.1 Platform and Technology

| Parameter | Decision |
|-----------|----------|
| Platforms | iOS 15+ and Android 10+ |
| Framework | React Native or Flutter (TBD during prototyping) |
| Minimum device | iPhone 8 / equivalent Android (2 GB RAM, 2017-era) |

### 9.2 App Screens and Features

#### 9.2.1 Onboarding and Setup

| ID | Requirement | Priority |
|----|------------|----------|
| APP-100 | The app SHALL provide a step-by-step guided setup flow: (1) Create account, (2) Scan device QR code, (3) Connect device via BLE, (4) Configure WiFi, (5) Aim device, (6) Calibrate burners. | P0 |
| APP-101 | During WiFi setup, the app SHALL scan for available networks and allow the user to select and enter credentials. | P0 |
| APP-102 | During calibration, the app SHALL display the live thermal image and provide interactive circle overlays for burner mapping. | P0 |
| APP-103 | The app SHALL provide a "test your setup" step after calibration where the user turns on one burner and verifies the correct burner highlights in the app. | P1 |
| APP-104 | The app SHALL support the perspective correction preview, showing the user before/after correction so they understand the transformation. | P1 |

#### 9.2.2 Dashboard (Main Screen)

| ID | Requirement | Priority |
|----|------------|----------|
| APP-200 | The main screen SHALL display the real-time heat map of the stovetop with labeled burners. | P0 |
| APP-201 | Each burner SHALL display its current temperature, on/off state, and any active timer. | P0 |
| APP-202 | The dashboard SHALL display a stove status summary: "All Off," "1 Burner Active," "Alert: Burner 2 Unattended," etc. | P0 |
| APP-203 | The dashboard SHALL use a dark theme by default (heat map is more readable on dark backgrounds) with optional light theme. | P1 |
| APP-204 | The dashboard SHALL display the device connection status (Connected / Reconnecting / Offline). | P0 |

#### 9.2.3 Burner Detail View

| ID | Requirement | Priority |
|----|------------|----------|
| APP-300 | Tapping a burner SHALL open a detail view showing: current temperature, temperature graph (last 30 minutes), on-duration, active timer, and alert settings. | P1 |
| APP-301 | The temperature graph SHALL update in real time and support pinch-to-zoom for time axis. | P2 |
| APP-302 | The detail view SHALL provide buttons to: set timer, enable boil notification, adjust alert threshold. | P0 |

#### 9.2.4 Alerts Screen

| ID | Requirement | Priority |
|----|------------|----------|
| APP-400 | The app SHALL display a chronological list of all alerts with type, time, burner, and acknowledgment status. | P1 |
| APP-401 | Tapping an alert SHALL show alert details and the thermal snapshot at the time of the alert. | P2 |
| APP-402 | The user SHALL be able to acknowledge unacknowledged alerts from this screen. | P0 |

#### 9.2.5 Settings

| ID | Requirement | Priority |
|----|------------|----------|
| APP-500 | The settings screen SHALL include: alert thresholds, timer defaults, temperature units (F/C), notification preferences, device management, account management, share access/invite users, re-run calibration, and support/feedback. | P0 |
| APP-501 | The settings screen SHALL include a "Device Health" section showing WiFi signal strength, firmware version, sensor status, and uptime. | P1 |

#### 9.2.6 Notifications

| ID | Requirement | Priority |
|----|------------|----------|
| APP-600 | The app SHALL use native push notifications (APNs for iOS, FCM for Android). | P0 |
| APP-601 | Critical safety alerts (unattended stove, high temperature) SHALL use high-priority/critical notification channels that bypass Do Not Disturb on the phone (with user opt-in per OS requirements). | P0 |
| APP-602 | Non-critical notifications (boil detected, timer expired) SHALL use standard notification priority. | P0 |
| APP-603 | Notification actions: "Acknowledge" (dismiss alert), "View" (open app to dashboard), "Snooze 10 min" (delay re-alert). | P1 |

---

## 10. Cloud and Backend Requirements

### 10.1 Architecture

| Parameter | Decision |
|-----------|----------|
| Cloud provider | AWS or GCP (TBD; evaluate based on IoT service maturity) |
| IoT protocol | MQTT via AWS IoT Core or GCP IoT (device-to-cloud) |
| API | REST API (for mobile app) over HTTPS |
| Real-time | WebSocket relay for remote live heat map viewing |
| Database | Time-series DB (InfluxDB or TimescaleDB) for thermal data; PostgreSQL for user/device/session data |
| Auth | Firebase Auth or AWS Cognito (OAuth + email/password) |
| Push notifications | Firebase Cloud Messaging (FCM) for Android; Apple Push Notification Service (APNs) for iOS |

### 10.2 Backend Requirements

| ID | Requirement | Priority |
|----|------------|----------|
| BE-100 | The backend SHALL receive and store MQTT telemetry from devices (thermal summaries at 10-second intervals, not raw frames). | P0 |
| BE-101 | The backend SHALL relay alert events from devices to push notification services within 5 seconds. | P0 |
| BE-102 | The backend SHALL provide REST APIs for: user auth, device registration, device sharing, alert history, cooking session history, and settings sync. | P0 |
| BE-103 | The backend SHALL support WebSocket connections for remote real-time heat map relay (device -> cloud -> app). | P1 |
| BE-104 | The backend SHALL retain thermal summary data for 90 days and alert history for 1 year. | P1 |
| BE-105 | The backend SHALL support geofence-based alerts by receiving device location from the mobile app and comparing against the registered home location. | P1 |
| BE-106 | The backend SHALL provide OTA firmware distribution: firmware binary hosting, version management, staged rollouts (canary -> 10% -> 50% -> 100%). | P0 |
| BE-107 | The backend SHALL enforce rate limiting and authentication on all API endpoints. | P0 |
| BE-108 | The backend SHALL support GDPR-compliant data export and account deletion. | P1 |

### 10.3 Local-First Architecture

| ID | Requirement | Priority |
|----|------------|----------|
| BE-200 | The mobile app SHALL connect directly to the device over local WiFi (WebSocket) for real-time heat map viewing when on the same network. Cloud relay is used only for remote access. | P0 |
| BE-201 | All safety-critical functions (alert detection, audible alarm) SHALL operate without cloud connectivity. | P0 |
| BE-202 | The system SHALL gracefully degrade when cloud is unavailable: local monitoring continues, push notifications are queued, remote access is unavailable. | P0 |

---

## 11. Setup and Onboarding Flow

### 11.1 Unboxing Contents

1. StoveIQ device with ball-joint mount
2. Adhesive mounting pad (pre-applied to mount plate)
3. Magnetic mount plate (alternative)
4. Screw mount bracket + 2 screws + anchors (alternative)
5. USB-C cable (6 ft, heat-rated silicone)
6. USB-C power adapter (5V/2A)
7. 4x adhesive cable clips
8. Quick start card (QR code to app + 6-step visual guide)

### 11.2 Setup Flow (In-App)

**Step 1: Download and Create Account**
- User scans QR code on the quick start card or searches "StoveIQ" in app store.
- User creates account (email/password or Google/Apple OAuth).

**Step 2: Add Device**
- App instructs user to plug in the StoveIQ device and wait for the LED to blink blue (setup mode).
- App scans for the device via BLE.
- User confirms the device serial number displayed in the app matches the sticker on the device.

**Step 3: Connect to WiFi**
- App displays available WiFi networks detected by the device.
- User selects network and enters password.
- App confirms connection (LED turns solid blue, then green).

**Step 4: Mount the Device**
- App shows a video/animation of mounting options (under-cabinet adhesive, magnetic, screw).
- User selects their mounting method.
- App provides positioning guidance: "Mount 12-24 inches above and 6-12 inches behind the center of your stovetop. The device should have a clear downward view of all burners."

**Step 5: Aim the Device**
- App displays the live thermal view from the IR camera.
- User adjusts the ball joint until all burner areas are visible in the frame.
- App shows a "coverage zone" overlay to help the user confirm the entire stovetop is in view.
- User locks the ball joint.

**Step 6: Calibrate Burners**
- App instructs: "Turn on all burners to their highest setting. Wait 60 seconds for them to heat up."
- App displays the thermal image with heat sources visible.
- Software applies perspective correction automatically (the user sees the corrected view).
- User drags a circle over each visible heat source and sizes it to match the burner.
- User labels each burner (pre-filled suggestions: "Front Left," "Front Right," "Back Left," "Back Right"; user can rename).
- User taps "Done."
- App instructs: "Turn off all burners. Setup is complete!"

**Step 7: Verification (Optional but Recommended)**
- App suggests: "Let's test! Turn on just one burner."
- User turns on a single burner.
- App highlights the corresponding mapped burner and shows its temperature rising.
- User confirms: "Yes, that's correct" or "No, let me re-calibrate."

**Step 8: Configure Alerts**
- App presents default alert settings and lets user customize:
  - Unattended alert threshold (default: 30 min)
  - Audible alarm delay (default: 5 min after push notification)
  - Caregiver invitations (optional)

### 11.3 Time Target

The entire setup process (unboxing through verification) should take less than 15 minutes for a non-technical user.

---

## 12. Safety and Regulatory Considerations

### 12.1 Regulatory Certifications Required

| Certification | Market | Description | Timeline Impact |
|--------------|--------|-------------|-----------------|
| FCC Part 15 | USA | Unintentional radiator (IR sensor) + intentional radiator (WiFi/BLE). Requires testing at accredited lab. | 6-8 weeks for testing. Must be complete before commercial sale. Kickstarter units can ship as "pre-production" with FCC ID pending in some cases, but best practice is to have certification before shipping. |
| UL/ETL | USA | Product safety certification. UL 60730 (automatic electrical controls) or UL 61010 (measurement equipment) may apply. Consult with UL early. | 8-12 weeks. Strongly recommended but not legally required for Kickstarter. Essential for retail (Amazon, Best Buy). |
| CE | EU/UK | Electromagnetic compatibility (EMC) + low voltage directive (LVD) + RoHS. Required for any EU sales. | 6-10 weeks. Required before shipping to EU backers. |
| IC | Canada | Industry Canada certification for radio-frequency devices. Similar to FCC. | Can often be done concurrently with FCC. |
| RoHS | EU | Restriction of hazardous substances. Compliance required at component and assembly level. | Ensure components are RoHS-compliant during BOM selection. |

### 12.2 Safety Design Considerations

| Area | Consideration |
|------|--------------|
| Enclosure materials | Must be UL94 V-0 flame-rated. No materials that drip or produce toxic fumes when exposed to heat. |
| Thermal isolation | The IR sensor window and enclosure must withstand radiant heat from the stove below. Thermal modeling required during prototyping. |
| Mounting failure | If the device falls, it should not land on an active burner. Weight limit and adhesive strength testing required. |
| Power safety | USB-C cable must be heat-rated. The power adapter must be UL-listed. No exposed high-voltage connections. |
| Software safety | Alert logic must be deterministic and tested. False negatives (missing a real left-on condition) are more dangerous than false positives. |
| User instructions | Include safety warnings in documentation: "This device does not replace smoke detectors. This device cannot turn off your stove. Do not rely on this device as your sole safety measure." |

### 12.3 Liability Considerations

- The product is a **monitoring and alerting device**, not a control device. It does not and cannot turn off the stove. This is an important legal distinction.
- Product liability insurance is recommended before shipping.
- Terms of service should include appropriate disclaimers.
- The product should prominently state: "StoveIQ is a supplementary safety monitoring device. It does not replace smoke detectors, fire extinguishers, or safe cooking practices."
- Consult with a product liability attorney before the Kickstarter launch.

### 12.4 Patent Considerations

- **Provisional patent** should be filed before the Kickstarter campaign launches (public disclosure starts the 12-month clock for full patent filing).
- The manual calibration approach (user draws circles to map burners) is a deliberate design-around of Midea patent US11,506,540, which covers automatic burner detection using thermal imaging.
- Patent claims should focus on: (a) the perspective-corrected manual mapping method, (b) the boil detection algorithm using rate-of-change analysis from an angled IR array, and (c) the caregiver remote monitoring system.

---

## 13. Success Metrics and KPIs

### 13.1 Kickstarter Campaign Metrics

| Metric | Target |
|--------|--------|
| Funding goal | $50,000 |
| Stretch goal | $150,000 (unlocks gas leak sensor add-on development) |
| Backers | 500+ at early bird ($99), 300+ at retail ($129) |
| Campaign duration | 30 days |
| Funding within first 48 hours | 30% of goal (signals strong demand to press and later backers) |
| Email list pre-launch | 2,000+ subscribers |

### 13.2 Product Metrics (Post-Ship)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Setup completion rate | >90% of devices shipped result in completed setup | Backend telemetry |
| Daily active usage | >70% of devices reporting thermal data daily after 30 days | Backend telemetry |
| Alert acknowledgment rate | >80% of push alerts acknowledged within 10 minutes | Backend telemetry |
| Boil detection accuracy | >90% true positive rate, <10% false positive rate | User feedback + telemetry |
| App store rating | 4.0+ stars | App Store / Google Play |
| Net Promoter Score | >40 | In-app survey at day 30 |
| Return/refund rate | <5% | Fulfillment records |
| Customer support tickets | <0.5 tickets per device in first 30 days | Support system |

### 13.3 Business Metrics (12-Month Post-Launch)

| Metric | Target |
|--------|--------|
| Units sold (total) | 5,000 |
| Revenue | $500,000+ |
| Gross margin | >50% at retail pricing |
| Repeat purchase (second device/gift) | >10% of customers |
| Retail partnership | At least 1 retail channel (Amazon, Home Depot, etc.) |

---

## 14. MVP Scope vs. Future Releases

### 14.1 MVP (Kickstarter v1.0)

Everything required to deliver a complete, polished product to Kickstarter backers:

| Category | Included |
|----------|---------|
| Hardware | Device with MLX90640 sensor, ESP32, buzzer, LED, USB-C power, ball-joint mount, 3 mounting options |
| Firmware | Thermal capture, perspective correction, burner mapping, boil detection, left-on detection, audible alarm, WiFi/BLE, OTA updates, watchdog |
| Mobile App | Onboarding/setup, live heat map, per-burner temps, boil notifications, unattended alerts, cooking timers, alert history, settings, caregiver sharing |
| Backend | Device registration, MQTT telemetry, push notifications, user auth, device sharing, OTA distribution |

### 14.2 v1.1 (3 Months Post-Ship)

Bug fixes and refinements based on real-world backer feedback:

| Feature | Description |
|---------|-------------|
| Improved boil detection | Refine algorithm based on real-world data from diverse stove types |
| Temperature accuracy tuning | Calibration improvements based on field data |
| Cooking session history | Browse past sessions with temperature graphs |
| Widget support | iOS/Android home screen widget showing stove status |
| Apple Watch / Wear OS | Companion app for wrist notifications |

### 14.3 v2.0 (6-9 Months Post-Ship)

Major feature expansion:

| Feature | Description |
|---------|-------------|
| Cooking intelligence (AI) | Cloud-based ML model analyzes thermal patterns to provide cooking suggestions ("Your oil is at smoking point, reduce heat") |
| Human presence detection | Use the IR array to detect if a person is standing near the stove; adjust "unattended" logic accordingly |
| Multi-stove support | Multiple StoveIQ devices on a single account with unified dashboard |
| Voice assistant integration | Alexa and Google Home: "Alexa, is the stove on?" / proactive announcements |
| Recipe mode | User selects a recipe; app guides them through cooking steps linked to burner states and temperatures |
| Auto-shutoff integration | Partner with smart plug manufacturers; if critical alert goes unacknowledged for 10 minutes, cut power via smart plug |

### 14.4 v3.0 (12+ Months Post-Ship)

Platform expansion:

| Feature | Description |
|---------|-------------|
| Gas leak sensor add-on | Optional plug-in module with a methane/propane sensor |
| Oven monitoring | Variant product or add-on for oven temperature monitoring |
| Commercial/restaurant version | Higher-resolution sensor, multi-station monitoring, compliance logging |
| API/ecosystem | Public API for smart home integrations (HomeKit, SmartThings, IFTTT) |
| Insurance partnerships | Provide usage data to home insurance companies for premium discounts |

---

## 15. Risks and Mitigations

### 15.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **MLX90640 resolution insufficient** for accurate per-burner monitoring at the mounting distance/angle | Medium | High | Prototype testing with multiple stove configurations in Phase 1. Evaluate MLX90641 (higher temp range) or Lepton 3.5 (160x120) as alternatives. Higher-resolution sensors increase BOM cost. |
| **Perspective correction accuracy** is poor at extreme mounting angles | Medium | High | Define a supported mounting angle range (15-60 degrees from horizontal). Include in setup guidance. Test extensively during prototyping. |
| **Boil detection false positives/negatives** too high for reliable use | Medium | Medium | Ship with conservative thresholds (prefer false positives over false negatives). Collect field data from backers for algorithm refinement. Allow users to disable/adjust sensitivity. |
| **WiFi reliability** in kitchen environment (interference from microwaves, distance from router) | Medium | Medium | Support 2.4 GHz only (better range than 5 GHz). Implement aggressive reconnection logic. Local alerting (buzzer) works without WiFi. Consider WiFi signal strength check during setup. |
| **Heat exposure** causes sensor drift or hardware degradation over time | Low | High | Thermal simulation during design. Accelerated life testing (ALT) at 80C continuous for 1,000 hours. Include thermal shielding in enclosure design. |
| **ESP32 processing power** insufficient for real-time thermal processing + WiFi + BLE | Low | Medium | Profile firmware during prototyping. Offload non-critical processing to cloud. ESP32-S3 dual-core provides headroom. |

### 15.2 Business Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Kickstarter campaign fails to fund** | Medium | High | Build email list of 2,000+ before launch. Create compelling demo video showing real thermal footage. Target food/cooking and smart home communities. Have a prototype, not just renders. |
| **Manufacturing delays** push delivery past promised date | High | High | Pad timeline by 2-3 months. Use experienced contract manufacturer. Order long-lead components (MLX90640, ESP32) early. Communicate proactively with backers. |
| **BOM cost exceeds target** at production volume | Medium | High | Target BOM cost of $35-40 at 1,000 units. Get quotes from 3+ manufacturers. Identify cost-reduction opportunities (e.g., custom PCB vs. dev board, injection molding vs. 3D printing). |
| **Patent challenge from Midea** or similar | Low | High | Provisional patent before launch. Manual calibration approach is a deliberate design-around. Consult patent attorney to review claims against Midea US11,506,540 before campaign. |
| **Competitor launches similar product** during campaign or development | Low | Medium | Speed to market is key. First-mover advantage in "retrofit thermal stove monitor" category. Build community and brand loyalty. |

### 15.3 Regulatory Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **FCC certification delayed** or fails | Low | High | Engage testing lab early (during prototyping). Use pre-certified ESP32 module to simplify RF testing. Budget $10K-15K for FCC testing. |
| **Product liability claim** from a kitchen fire where StoveIQ was installed | Low | High | Product liability insurance ($1M+ coverage). Clear disclaimers in marketing, packaging, and app. The device monitors and alerts only -- it cannot prevent fires. Legal review of all safety claims before campaign. |
| **UL certification required by retail partners** before StoveIQ has it | Medium | Medium | Plan UL certification for post-Kickstarter retail phase. Budget $15K-25K. This does not block Kickstarter fulfillment. |

### 15.4 User Experience Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Setup too complex** for non-technical users | Medium | High | Extensive user testing during prototyping with target demographics (especially 65+ users). In-app video guides. Phone support line for first 90 days. |
| **Mounting position varies widely** leading to poor thermal coverage | Medium | Medium | Provide clear mounting guidelines with visual examples. In-app coverage verification during setup. Support multiple mounting accessories. |
| **Alert fatigue** from too many notifications | Medium | Medium | Ship with conservative defaults. Allow extensive customization. Implement smart alert suppression (don't re-alert every 5 minutes for the same condition). |

---

## 16. Assumptions and Constraints

### 16.1 Assumptions

| ID | Assumption |
|----|-----------|
| A-1 | The MLX90640 (32x24 pixel) IR array provides sufficient resolution to distinguish individual burners on a standard residential stovetop at a distance of 12-24 inches. This must be validated during prototyping. |
| A-2 | Users have a cabinet, wall, or shelf surface above/behind their stove suitable for mounting the device within the supported angle range. |
| A-3 | Users have a USB power outlet (wall outlet or power strip) within 6 feet of the mounting location. |
| A-4 | Users have 2.4 GHz WiFi coverage in their kitchen with sufficient signal strength for reliable device communication. |
| A-5 | The thermal signature of boiling water is sufficiently distinct from other cooking states (simmering, heating oil, etc.) for algorithmic detection via IR. Must be validated. |
| A-6 | Users are willing to perform a one-time manual calibration (turning on all burners and mapping circles). The process must take less than 5 minutes. |
| A-7 | Glass-top, coil, and gas stoves all produce sufficient IR radiation for the sensor to measure cookware surface temperature from the device's mounting position. |
| A-8 | The retail BOM cost can be maintained at or below $40 at volumes of 1,000+ units, supporting the $99/$129 price points with >50% gross margin. |
| A-9 | A provisional patent can be filed and the Kickstarter campaign can launch before any public disclosure that would jeopardize patent rights. |
| A-10 | React Native or Flutter will provide sufficient performance for real-time heat map rendering at 1+ FPS on mid-range mobile devices. |

### 16.2 Constraints

| ID | Constraint | Impact |
|----|-----------|--------|
| C-1 | **Manual calibration only.** The system must NOT use automatic burner detection to avoid infringing Midea patent US11,506,540. All burner position mapping is performed by the user placing circles on the thermal image. | Core design constraint affecting setup flow and all burner-related features. |
| C-2 | **Kickstarter price ceiling: $129 retail.** BOM, manufacturing, packaging, and shipping must support this price point with sustainable margins. | Limits component choices (e.g., cannot use a $100+ thermal camera module). |
| C-3 | **No stove control capability.** The device monitors and alerts only. It does not interface with the stove's power or controls in any way. | Simplifies safety/liability but limits auto-shutoff to third-party smart plug integration (post-MVP). |
| C-4 | **USB-C powered only.** No battery. The device requires continuous mains power. | Simplifies design but means the device is non-functional during power outages. |
| C-5 | **2.4 GHz WiFi only.** The ESP32 supports 2.4 GHz. Most home routers support this, but some newer mesh systems default to 5 GHz. | May require user to enable 2.4 GHz band. Include in troubleshooting guide. |
| C-6 | **Single device per account (MVP).** Multi-device support is deferred to v2.0. | Caregivers who want to monitor and also have their own StoveIQ will need two accounts in v1. |
| C-7 | **No cloud dependency for safety.** All alert detection and audible alarm logic must execute on the device firmware. Cloud is used for push notifications and remote access, not safety-critical logic. | Firmware must be robust and independently testable. |
| C-8 | **Timeline: Kickstarter launch within 6 months.** Hardware prototyping, firmware development, app MVP, and regulatory prep must fit within this window. | Aggressive but achievable if scope is held to MVP. |

---

## Appendix A: Glossary

| Term | Definition |
|------|-----------|
| BLE | Bluetooth Low Energy -- used for initial device pairing and WiFi provisioning |
| Boil detection | Algorithmic detection of water boiling based on thermal rate-of-change patterns observed by the IR sensor |
| BOM | Bill of Materials -- the list of components and their costs |
| Calibration | The one-time setup process where the user maps burner positions on the thermal image |
| Caregiver mode | A secondary user role that receives alerts and can view stove status but cannot change device settings |
| FPS | Frames per second -- the rate at which the IR sensor captures thermal images |
| Heat map | A color-coded visual representation of the stovetop surface temperature |
| IR array | Infrared thermal sensor array (e.g., MLX90640) that measures temperature across a grid of pixels |
| MQTT | Message Queuing Telemetry Transport -- a lightweight IoT messaging protocol used for device-to-cloud communication |
| OTA | Over-the-air -- firmware updates delivered wirelessly to the device |
| Perspective correction | Software transformation applied to the thermal image to account for the device's angled mounting position |
| Thermal frame | A single capture from the IR sensor containing temperature data for all pixels (e.g., 32x24 = 768 data points) |
| Unattended alert | A safety notification triggered when a burner is on with no thermal change detected for a configured period |

---

## Appendix B: Competitive Analysis Detail

### FireAvert (fireavert.com)
- **What it does:** Plugs into the stove's electrical outlet. Listens for the smoke detector alarm. When the smoke detector goes off, it cuts power to the stove.
- **Price:** $149-$249 depending on model (gas or electric).
- **Limitations:** Reactive only (waits for smoke detector). No thermal monitoring. No app. No intelligence. Does not work with hardwired electric stoves without an electrician.
- **StoveIQ advantage:** Proactive monitoring, thermal intelligence, app-based alerts, works with any stove without electrical modification.

### Meater (meater.com)
- **What it does:** Wireless meat thermometer probe. Monitors internal meat temperature. Primarily for grilling/oven use.
- **Price:** $50-$100.
- **Limitations:** Measures internal food temperature only. Must be inserted into food. Not a stovetop monitor. No safety features.
- **StoveIQ advantage:** Monitors the stovetop surface passively (no physical contact with food). Safety alerts. Per-burner tracking.

### Samsung Smart Range
- **What it does:** Full smart stove with WiFi, app control, some temperature monitoring.
- **Price:** $2,000-$4,000.
- **Limitations:** Requires full appliance replacement. Not available to renters. Samsung-only ecosystem.
- **StoveIQ advantage:** Retrofits any existing stove. 1/20th the price. Works with any stove brand.

### Inirv React (discontinued)
- **What it does:** Was a smart stove knob cover that could turn off gas burners. Discontinued in 2020.
- **Relevance:** Validates market demand for retrofit stove safety but failed commercially (execution issues, not market issues). StoveIQ is monitoring-only, which simplifies safety/liability compared to a device that physically controls the stove.

---

## Appendix C: Open Questions

| ID | Question | Owner | Status |
|----|---------|-------|--------|
| OQ-1 | What is the maximum effective mounting distance for the MLX90640 to distinguish individual burners? Need prototyping data. | Engineering | Open |
| OQ-2 | React Native vs. Flutter for mobile app -- which provides better real-time rendering performance for the heat map? | Engineering | Open |
| OQ-3 | Should the Kickstarter campaign offer a "Caregiver Bundle" (2 devices at a discount)? | Business | Open |
| OQ-4 | What is the optimal default unattended alert threshold? 30 minutes may be too aggressive for slow-cooking scenarios. | Product/UX | Open |
| OQ-5 | Does the device need a battery backup to maintain safety alerts during brief power outages? | Engineering | Open |
| OQ-6 | Should the app support landscape orientation for the heat map view? | UX | Open |
| OQ-7 | Is there a need for a web dashboard (browser-based) in addition to the mobile app? | Product | Open |
| OQ-8 | What contract manufacturer(s) in Shenzhen have experience with IR sensor products? | Operations | Open |
| OQ-9 | Should the buzzer volume be user-adjustable, or fixed at a minimum safety level? | Product/Safety | Open |
| OQ-10 | What is the expected annual cloud hosting cost per device, and should there be a subscription fee for premium features? | Business | Open |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-26 | Nick DeMarco with AI Assistance | Initial comprehensive draft |
