# StoveIQ MVP Pipeline — End-to-End Integration

**Date:** 2026-04-04
**Session type:** execution
**Agents involved:** Software Project (orchestrator), Software Developer, Explore

## Summary

Integrated the full StoveIQ MVP pipeline from ESP32 thermal sensor through MQTT/EMQX Cloud to Firebase/Firestore to the Flutter web app. Production firmware now runs on the ESP32-S3 with WiFi (Google Nest), MQTT (EMQX Cloud TLS), sensor reading (MLX90640 at 4Hz), safety monitoring, and a local web dashboard. The Flutter app at stoveiq.web.app shows live device status from Firestore.

## Key Findings

- Production firmware had stack overflow in `sensor_init()` — the MLX90640 calibration requires ~10KB+ stack, but `app_main` only has 3.5KB. Fixed by moving `sensor_init()` into the sensor task (32KB stack)
- Google Nest WiFi requires WPA3 compatibility: `sae_pwe_h2e = WPA3_SAE_PWE_BOTH`, `pmf_cfg.capable = true`, `WIFI_BW_HT20`, protocol b/g/n only, power save disabled
- MQTT TLS to EMQX Cloud requires `esp_crt_bundle_attach` — without it, TLS handshake fails
- Flash partition needed expanding from 1MB to 2MB to fit the cert bundle (board has 8MB flash)
- EMQX webhook connector test initially failed due to TLS verify requiring CA cert — disabled TLS verify since auth is via Bearer token
- Cloud Function (Cloud Run Gen2) required `allUsers` invoker permission — was blocking EMQX webhook with 401
- Flutter web release build tree-shakes extension methods on enums — moved `isOn`, `isAlert`, `isCritical` from `StoveStateX` extension to direct enum methods
- OFF state transition not propagating to Firestore — firmware detects OFF locally but alert not reaching Cloud Function. Root cause TBD.

## Decisions Made

- Used `DEV_WIFI_SSID`/`DEV_WIFI_PASS` compile flags for dev builds, bypassing BLE provisioning
- BLE provisioning excluded from dev builds via `#ifdef DEV_WIFI_SSID` guard in ble_provision.c
- Web dashboard added to production firmware (not just validation) for testing convenience
- EMQX webhook TLS verify disabled (Bearer token auth sufficient for MVP)
- Cloud Function made publicly invocable for EMQX webhook access
- Firestore security rules updated to allow device claiming (owner_uid update)
- Dev-mode onboarding button added to Flutter welcome screen

## Artifacts Created

- **Firmware changes:** wifi_mqtt.c (WPA3+TLS+dev WiFi), tasks.c (sensor_init moved, web dashboard integrated), main.c (dev build bypass), ble_provision.c (dev stubs), sensor.c (static ee_data + NaN fix), stoveiq_types.h (real MQTT creds), platformio.ini (partition table, dev WiFi flags)
- **New files:** partitions.csv (2MB app partition), sdkconfig.defaults
- **Cloud changes:** firestore.rules (device claiming), Cloud Run IAM (allUsers invoker)
- **Flutter changes:** stove_state.dart (enum methods vs extension), welcome_screen.dart (dev-mode bypass), firestore_service.dart (claimDevice method)
- **EMQX config:** HTTP Server connector + SQL rule (stoveiq/+/alert, heartbeat, telemetry)
- **Firestore docs:** devices/SIQ-DEV001, users/dev-user-001

## Open Items

- [ ] OFF state alert not propagating to Firestore — need to debug alert publishing path in firmware
- [ ] Web dashboard hardcodes "OFF" state — needs to read actual safety monitor state
- [ ] Push notifications (FCM) — Cloud Function sends them but app needs FCM token registration
- [ ] Tailscale on UCG Ultra disabled (was blocking WAN) — remote dashboard access not available
- [ ] 100-cycle sensor validation test not completed (MVP pivot took priority)
- [ ] Find patent attorney
- [ ] Get 3 CM quotes before Kickstarter

## Context for Next Session

The full MVP pipeline is proven working: ESP32 → MQTT → EMQX → Firebase → Firestore → Flutter app. The ON detection works end-to-end (user confirmed stove ON showed in app within ~1 minute). The main bug is OFF transitions not reaching Firestore — likely the safety monitor's ALERT_STOVE_OFF isn't being published via MQTT, or the Cloud Function isn't processing it. The web dashboard at 192.168.1.183 shows the local thermal heatmap. WiFi credentials are hardcoded for dev (Finley/cathieS19!!). MQTT credentials are in firmware .env files. The user has a dinner meeting with a potential partner tonight and wants to demo the product.
