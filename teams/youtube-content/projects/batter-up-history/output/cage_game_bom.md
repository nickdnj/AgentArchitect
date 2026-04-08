# Gamified Batting Cage System — Bill of Materials
**Project:** Batter Up LI — Interactive Cage Game  
**Date:** April 7, 2026  
**Version:** 1.0  
**Status:** Draft for Review

> Prices are researched retail estimates as of April 2026. Amazon links are provided; prices fluctuate. Verify before purchasing.

---

## Category 1: Compute Unit

| # | Component | Specific Product | Qty | Unit Price | Extended | Source | Notes |
|---|-----------|-----------------|-----|-----------|----------|--------|-------|
| 1.1 | Main compute board | NVIDIA Jetson Orin Nano Super Developer Kit (8GB) | 1 | $249.00 | $249.00 | [Amazon](https://www.amazon.com/dp/B0BZCTJKBG) | Confirmed $249. Includes carrier board, heatsink, fan. M.2 Key M slot for NVMe. |
| 1.2 | Power supply | DC 19V / 4A+ Power Supply for Jetson Orin Nano Super — 5.5mm x 2.5mm barrel jack | 1 | $18.00 | $18.00 | [Amazon](https://www.amazon.com/Power-Supply-Jetson-Monitor-Electronics/dp/B0DNMRCX7C) | Jetson Orin Nano Super requires 19V DC, ~45W max. Barrel jack 5.5mm OD x 2.5mm ID. Use 19V/3A+ (57W). |
| 1.3 | NVMe SSD storage | Samsung 970 EVO Plus 500GB M.2 NVMe PCIe 3.0 (MZ-V7S500B) | 1 | $55.00 | $55.00 | [Amazon](https://www.amazon.com/Samsung-970-EVO-Plus-MZ-V7S500B/dp/B07M7Q21N7) | M.2 2280 Key M, PCIe only (SATA does not work on Orin Nano). Install on underside of carrier board. Boot OS + AI models from SSD for best performance. |
| 1.4 | Compute enclosure | Altelix 14x11x5 NEMA 4X Polycarbonate + ABS Weatherproof Enclosure with aluminum mounting plate | 1 | $55.00 | $55.00 | [Amazon](https://www.amazon.com/Altelix-Enclosure-Polycarbonate-Weatherproof-Resistant/dp/B076ZV1MQJ) | Fits Jetson carrier board + power supply + misc electronics. NEMA 4X rated (rain, dust, hose-down). Internal: 12"x8"x4" usable space. RF-transparent for WiFi. |
| 1.5 | Enclosure cooling | 80mm 12V brushless fan + finger guard | 1 | $12.00 | $12.00 | [Amazon](https://www.amazon.com/s?k=80mm+12v+fan+weatherproof) | Mount on enclosure side wall with gasket seal. Jetson runs warm under load; enclosure ventilation is critical. |

**Category 1 Subtotal: $389.00**

---

## Category 2: Camera System

| # | Component | Specific Product | Qty | Unit Price | Extended | Source | Notes |
|---|-----------|-----------------|-----|-----------|----------|--------|-------|
| 2.1 | Primary camera sensor | Arducam 12.3MP IMX477 HQ Camera Module for Jetson Orin Nano/NX — CS-Mount | 1 | $65.00 | $65.00 | [Amazon](https://www.amazon.com/Arducam-12-3MP-IMX477-Camera-Module/dp/B08DKDRB5W) | Sony IMX477, 1/2.3" sensor. Verified Jetson Orin Nano native driver support (4-lane MIPI CSI-2). Capable of 1080p@120fps and 1080p@240fps with 4-lane MIPI. Best ball-tracking option in this price range. |
| 2.2 | Primary camera lens | Arducam 2.8mm CS-Mount Wide Angle Lens for IMX477 | 1 | $22.00 | $22.00 | [Amazon](https://www.amazon.com/stores/Arducam/page/2F8C611B-1F96-4203-A119-C95D4F7DD205) | At 30+ feet distance, 2.8mm covers ~120° horizontal FOV — enough to cover full cage width. CS-mount matches IMX477 camera. Manual focus + adjustable aperture. The included 6mm lens is too narrow for this use case. |
| 2.3 | Camera weatherproof housing | IP66 Aluminum Outdoor CCTV Box Camera Housing — 240x135x100mm with sun visor | 1 | $32.00 | $32.00 | [Amazon](https://www.amazon.com/Waterproof-Surveillance-240x135x100mm-Aluminum-Enclosure/dp/B09FQF27GD) | CSI ribbon cable exits through rear gland. Ventilation holes sealed with silicone. Protects camera + lens from rain, UV, bird impact in cage environment. |
| 2.4 | CSI extension cable | Arducam 1m/3ft 15-pin to 22-pin MIPI CSI Ribbon Extension Cable for Jetson | 1 | $12.00 | $12.00 | [Amazon](https://www.amazon.com/s?k=arducam+15pin+22pin+mipi+csi+extension+jetson) | Routes camera cable from housing to Jetson enclosure. Jetson Orin Nano uses 22-pin CSI connector. |
| 2.5 | Camera pole/bracket | Heavy-duty adjustable pole camera mount — 2" pipe clamp style | 1 | $25.00 | $25.00 | [Amazon](https://www.amazon.com/s?k=outdoor+security+camera+pole+mount+2+inch+pipe) | Mount camera at top of cage structure, angled down toward plate. Aim for 25-35 foot standoff distance above/behind the batter. |

**Category 2 Subtotal: $156.00**

> **Note on frame rate:** The IMX477 achieves 1080p@120fps and up to 240fps in cropped/binned modes using all 4 MIPI lanes. Arducam's Jetson driver exposes all 4 lanes, unlike the Raspberry Pi version. Ball-tracking at 120fps is achievable. The IMX708 (alternative) is 12MP but has less community support on Jetson; IMX477 is the safer choice.

> **Note on second camera:** A second camera can be added for triangulation (3D ball position) in Phase 2. Single-camera tracking with known geometry (flat cage, known pitcher distance) is sufficient for Phase 1 scoring.

---

## Category 3: Spectator Display

| # | Component | Specific Product | Qty | Unit Price | Extended | Source | Notes |
|---|-----------|-----------------|-----|-----------|----------|--------|-------|
| 3.1 | Outdoor display | SunBrite Veranda 3 Series 55" Full-Shade Smart Outdoor TV — Model SB-V3-55-4KHDR-BL | 1 | $999.00 | $999.00 | [Amazon](https://www.amazon.com/SunBrite-Veranda-55-inch-Weatherproof-Television/dp/B0B11MY57Z) | 1000 nit QLED, 4K HDR, IPX5 rated, -22°F to 122°F operating range. Smart TV (Android) with HDMI. Full-shade rated (covered cage setting). Retail $1,659; regularly found on sale ~$999-$1,100. **Best value pick for this use case.** |
| 3.2 | TV pole/post mount | ZeboZap ZZTVT2064 No-Drill Outdoor Post TV Mount — holds 120 lbs, weatherproof, stainless screws | 1 | $89.00 | $89.00 | [Amazon](https://www.amazon.com/ZeboZap-ZZTVT2064-Outdoor-Stainless-Weatherproof/dp/B0C49JVWTT) | Clamps to square or round pole/post without drilling. Tilt-adjustable. Up to 120 lb capacity. Ideal if TV mounts to cage structural post or dedicated pipe. |
| 3.3 | Outdoor surge protector | 15A Outdoor GFCI Surge Protector — weather resistant, UL listed | 1 | $28.00 | $28.00 | [Amazon](https://www.amazon.com/s?k=outdoor+GFCI+surge+protector+weatherproof) | Protect TV and display electronics. Run from cage's existing 20A circuit. |

**Category 3 Subtotal: $1,116.00**

> **Budget alternative:** A standard 55" 4K smart TV (e.g., TCL 55S555, ~$320) inside a weatherproof TV enclosure (~$180) can substitute for ~$500 total, saving ~$500. Tradeoff: less bright (600 nits vs 1000), less thermal management, voided TV warranty. Fine for partially-covered cage; not ideal for full outdoor exposure.

---

## Category 4: LED Target System

| # | Component | Specific Product | Qty | Unit Price | Extended | Source | Notes |
|---|-----------|-----------------|-----|-----------|----------|--------|-------|
| 4.1 | ESP32 microcontroller | ESP32-WROOM-32 38-pin Development Board (CP2102, USB-C, WiFi+BT) — 2-pack | 1 | $14.00 | $14.00 | [Amazon](https://www.amazon.com/Development-Microcontroller-Integrated-ESP-WROOM-32-NodeMCU-32S/dp/B09WXZ9441) | One ESP32 drives all 5-6 LED target zones via GPIO + WLED or custom firmware. Receives scoring commands from Jetson over WiFi/MQTT. 2-pack gives a spare. |
| 4.2 | IP67 addressable LED strips | ALITOVE WS2812B 5V Individually Addressable IP67 Waterproof LED Strip — 16.4ft/300 LED (5m) | 6 | $18.00 | $108.00 | [Amazon](https://www.amazon.com/ALITOVE-Individually-Addressable-Flexible-Waterproof/dp/B018X04ES2) | One 5m roll per target zone. IP67 silicone-sheathed tube. WS2812B protocol (NeoPixel compatible). Cut to shape per zone. Each zone ~0.5-1m of strip at 60 LED/m density = 30-60 LEDs/zone. |
| 4.3 | 5V power supply for LEDs | Mean Well 5V 20A 100W DC Switching Power Supply — LRS-100-5 | 2 | $22.00 | $44.00 | [Amazon](https://www.amazon.com/s?k=meanwell+LRS-100-5+5v+20A) | 5V LEDs draw ~60mA/LED at full white. 6 zones x 60 LEDs = 360 LEDs max = 22A at full brightness. Two 20A supplies (one per 3 zones) with power injection at both ends of each strip segment. |
| 4.4 | Polycarbonate target covers | Clear 1/4" polycarbonate sheet, 24"x24" — impact-resistant, UV-stable | 6 | $22.00 | $132.00 | [Amazon](https://www.amazon.com/Polycarbonate-Resistant-Plexiglass-Robotics-Industrial/dp/B07VWLPJ4Z) | Cut to size for each target zone face. Protects LED strips from ball impacts. Polycarbonate is ~250x more impact resistant than glass; does not shatter. UV-stabilized for outdoor use. |
| 4.5 | LED target frame | 1" x 1" aluminum channel extrusion — 8ft lengths | 6 | $16.00 | $96.00 | [Amazon](https://www.amazon.com/s?k=1+inch+aluminum+channel+extrusion+8ft) | Fabricate target zone frames from aluminum channel. Mount polycarbonate cover to front. LED strip mounts inside channel facing forward. Attach to cage net/frame with zip ties or U-bolts. |
| 4.6 | LED data level shifter | 74AHCT125 3.3V to 5V level shifter breakout — 2-pack | 1 | $8.00 | $8.00 | [Amazon](https://www.amazon.com/s?k=74AHCT125+level+shifter) | ESP32 GPIO is 3.3V logic; WS2812B expects 5V data signal. Level shifter prevents signal errors, especially at long cable runs to remote targets. |
| 4.7 | Wiring and connectors | 3-pin JST-SM waterproof LED connectors — 20-pair pack | 1 | $12.00 | $12.00 | [Amazon](https://www.amazon.com/s?k=3+pin+JST+SM+waterproof+LED+connector+WS2812B) | Connects LED strip segments to power injection wires. Allows segments to be disconnected for service. |

**Category 4 Subtotal: $414.00**

---

## Category 5: Audio System

| # | Component | Specific Product | Qty | Unit Price | Extended | Source | Notes |
|---|-----------|-----------------|-----|-----------|----------|--------|-------|
| 5.1 | Outdoor speakers | Pyle PDWR62BTBK 6.5" Wall Mount Waterproof Bluetooth Outdoor Speaker Pair — 60W, built-in amp | 1 set | $85.00 | $85.00 | [Amazon](https://www.amazon.com/Pyle-Waterproof-Bluetooth-Outdoor-PDWR62BTBK/dp/B01954Q5BO) | Marine-grade waterproof, polymer dome tweeter, includes built-in amplifier in the active speaker. Bluetooth OR 3.5mm AUX input. Pair (active + passive). Jetson outputs audio via HDMI to TV or 3.5mm to active speaker. |
| 5.2 | USB audio adapter | UGREEN USB to 3.5mm Audio Adapter — USB-A stereo sound card | 1 | $15.00 | $15.00 | [Amazon](https://www.amazon.com/s?k=UGREEN+USB+audio+adapter+3.5mm) | Jetson Orin Nano Dev Kit has no onboard 3.5mm audio out. USB sound card adds stereo output for speaker connection. HDMI audio also works if routing through TV. |

**Category 5 Subtotal: $100.00**

---

## Category 6: Token Machine Interface

| # | Component | Specific Product | Qty | Unit Price | Extended | Source | Notes |
|---|-----------|-----------------|-----|-----------|----------|--------|-------|
| 6.1 | Optocoupler isolator module | PC817 4-Channel Optocoupler Isolation Module — 3.3V/5V compatible | 1 | $8.00 | $8.00 | [Amazon](https://www.amazon.com/s?k=PC817+4+channel+optocoupler+isolation+module) | Electrically isolates token machine signal from Jetson/ESP32 GPIO. Token machine outputs a pulse per token. Wire token signal → optocoupler input; optocoupler output → ESP32 interrupt pin. Counts tokens inserted. |
| 6.2 | Signal wire | 22AWG 4-conductor shielded cable — 25ft | 1 | $14.00 | $14.00 | [Amazon](https://www.amazon.com/s?k=22awg+4+conductor+shielded+cable+25ft) | Run from token machine to main electronics enclosure. Shielded to resist electrical noise from pitching machine motor. |
| 6.3 | Weatherproof terminal block | DIN Rail Terminal Block + enclosure for field wiring connections | 1 | $18.00 | $18.00 | [Amazon](https://www.amazon.com/s?k=weatherproof+terminal+block+enclosure) | Clean junction point for token wire, power feeds, and sensor cables entering the main enclosure. |

**Category 6 Subtotal: $40.00**

---

## Category 7: Networking

| # | Component | Specific Product | Qty | Unit Price | Extended | Source | Notes |
|---|-----------|-----------------|-----|-----------|----------|--------|-------|
| 7.1 | 4G LTE cellular router | GL.iNet GL-X750V2 (Spitz) 4G LTE VPN Router — AC750 dual-band WiFi, OpenWrt, MicroSD | 1 | $89.00 | $89.00 | [Amazon](https://www.amazon.com/GL-X750V2-Certified-EC25-AFFA-Installed-Dual-Band/dp/B08TRCSSZ4) | Provides internet connectivity for leaderboard upload, remote monitoring, OTA updates. Insert T-Mobile or AT&T IoT SIM. WiFi AP also serves as local network for Jetson ↔ ESP32 MQTT communication. If cage has existing WiFi coverage, skip this item. |
| 7.2 | SIM card data plan | T-Mobile IoT/Connected Device SIM — prepaid or IoT plan | 1 | $10.00/mo | — | T-Mobile | ~$10-15/month for IoT data plan. Leaderboard sync is low-bandwidth. |
| 7.3 | Ethernet patch cable | Cat6 0.5ft patch cable — for Jetson to router LAN port | 1 | $6.00 | $6.00 | [Amazon](https://www.amazon.com/s?k=cat6+short+patch+cable+0.5ft) | Wired connection from Jetson to router (more reliable than WiFi for local network). |

**Category 7 Subtotal: $95.00** *(plus ongoing SIM cost)*

---

## Category 8: Power & Infrastructure

| # | Component | Specific Product | Qty | Unit Price | Extended | Source | Notes |
|---|-----------|-----------------|-----|-----------|----------|--------|-------|
| 8.1 | Main electronics enclosure | Altelix 14x11x7 NEMA 4X Polycarbonate + ABS DIN Rail Enclosure with 120VAC outlets + power cord | 1 | $175.00 | $175.00 | [Altelix](https://altelix.com/altelix-14x11x7-polycarbonate-abs-nema-4x-din-rail-enclosure-with-120-vac-outlets-power-cord/) | Second, larger enclosure for power distribution components (surge protector, LED power supplies, router). DIN rail inside makes wiring clean. Pre-wired 120VAC outlets. NEMA 4X outdoor-rated. |
| 8.2 | Outdoor power strip / surge protector | Tripp Lite 6-outlet outdoor-rated GFCI surge protector — 15A, UL Listed | 1 | $35.00 | $35.00 | [Amazon](https://www.amazon.com/s?k=tripp+lite+outdoor+GFCI+surge+protector+6+outlet) | Protect all 120V electronics. Feeds: Jetson PSU, LED PSUs, router, display. Use inside the NEMA enclosure. |
| 8.3 | 12V DIN power supply | Mean Well DR-30-12 DIN Rail 12V 2.5A Power Supply | 1 | $22.00 | $22.00 | [Amazon](https://www.amazon.com/s?k=meanwell+DR-30-12+DIN+rail) | Powers enclosure cooling fan and any 12V accessories. DIN rail mount keeps wiring clean. |
| 8.4 | Liquid-tight conduit kit | 1/2" flexible liquid-tight conduit — 25ft with fittings | 1 | $28.00 | $28.00 | [Amazon](https://www.amazon.com/s?k=1%2F2+inch+liquid+tight+flexible+conduit+25ft+kit) | Route all inter-box wiring: power to LED zones, camera cable tray, token signal wire. UL listed for outdoor wet locations. |
| 8.5 | Cable glands | PG9/PG11 waterproof cable glands — assortment pack (20pc) | 1 | $10.00 | $10.00 | [Amazon](https://www.amazon.com/s?k=PG9+PG11+waterproof+cable+glands+20+pack) | Seal conduit entry points on NEMA enclosures. Prevent moisture ingress. |
| 8.6 | Heat shrink + zip ties | Heat shrink tubing assortment + UV-resistant outdoor zip ties | 1 | $16.00 | $16.00 | [Amazon](https://www.amazon.com/s?k=heat+shrink+tubing+zip+ties+outdoor+UV) | Cable management and weatherproof wire terminations throughout. |

**Category 8 Subtotal: $286.00**

---

## Category 9: Mounting Hardware

| # | Component | Specific Product | Qty | Unit Price | Extended | Source | Notes |
|---|-----------|-----------------|-----|-----------|----------|--------|-------|
| 9.1 | TV post mount | ZeboZap ZZTVT2064 (see Category 3, item 3.2) | — | — | — | — | Already counted in Category 3 |
| 9.2 | Enclosure mounting bracket | Heavy-duty stainless steel L-bracket / wall plate — 4-pack | 1 | $18.00 | $18.00 | [Amazon](https://www.amazon.com/s?k=heavy+duty+stainless+steel+L+bracket+outdoor) | Mount Jetson enclosure + power enclosure to cage wall/structure. Stainless for outdoor corrosion resistance. |
| 9.3 | Camera mounting arm | Adjustable security camera mount — 2" pipe clamp, 12" extension arm | 1 | $25.00 | $25.00 | [Amazon](https://www.amazon.com/s?k=security+camera+wall+mount+pipe+clamp+adjustable+arm) | Mount camera housing to cage overhead pipe/beam. 12" extension arm allows aiming adjustment. |
| 9.4 | Target zone mounting — U-bolts | 1" U-bolts stainless steel — 10-pack (for clamping target frames to cage netting rail) | 1 | $14.00 | $14.00 | [Amazon](https://www.amazon.com/s?k=1+inch+stainless+steel+U-bolt+10+pack) | Attach aluminum target frames to cage's structural pipe/frame. No drilling required on cage. |
| 9.5 | Lag screws + anchor hardware | M6 stainless steel hardware assortment (bolts, nuts, washers, anchors) | 1 | $12.00 | $12.00 | [Amazon](https://www.amazon.com/s?k=M6+stainless+steel+hardware+assortment) | General-purpose mounting hardware for enclosures and brackets. |

**Category 9 Subtotal: $69.00**

---

## Grand Total Summary

| Category | Subtotal |
|----------|---------|
| 1 — Compute Unit | $389.00 |
| 2 — Camera System | $156.00 |
| 3 — Spectator Display | $1,116.00 |
| 4 — LED Target System | $414.00 |
| 5 — Audio System | $100.00 |
| 6 — Token Machine Interface | $40.00 |
| 7 — Networking | $95.00 |
| 8 — Power & Infrastructure | $286.00 |
| 9 — Mounting Hardware | $69.00 |
| **GRAND TOTAL** | **$2,665.00** |

> **Contingency Buffer (+15%):** ~$400  
> **Total with contingency:** ~$3,065

---

## Phase 2 / Nice to Have Upgrades

| Item | Description | Est. Cost | Priority | Notes |
|------|-------------|----------|----------|-------|
| Second camera (IMX477) | Add second CSI camera for triangulated 3D ball tracking — better spin rate and trajectory data | $130 | High | Requires USB3 camera or second CSI port via multiplexer. Arducam makes a dual-camera adapter for Jetson. |
| Arducam dual CSI multiplexer | Arducam Multi Camera Adapter for Jetson — switch between 2 CSI cameras on single port | $45 | High | Use with Phase 2 second camera. |
| Radar speed sensor | OmniPreSense OPS243 or Stalker Sport 2 doppler radar — integrates with Jetson serial port | $250–$800 | Medium | Measures ball velocity directly. Currently velocity can be estimated from camera frames but radar is more accurate. |
| LED score display (external) | P10 full-color outdoor LED matrix panel (320x160mm) — bright, daylight readable score bug | $60/panel | Medium | Replace TV bottom-third overlay with dedicated scorebug panel visible from bleachers. 2-4 panels tiled. |
| Sound effects board | DFPlayer Mini MP3 module + microSD card — dedicated audio playback offloaded from Jetson | $8 | Low | Frees Jetson CPU. Pre-load hit sounds, crowd cheers, strike sounds on microSD. ESP32 triggers playback. |
| Wireless leaderboard sync | Cloud leaderboard with real-time web UI — players scan QR code to see live scores | $0 software | Medium | Backend work only (no hardware cost). Cloud Run or Firebase. Add to Jetson WiFi connectivity. |
| UPS battery backup | CyberPower CP1000PFCLCD 1000VA pure-sine UPS | $180 | Low | Protects against power blips from pitching machine motor starting. Provides ~10 min runtime during outages. |
| Coin/token acceptor | CH-926 programmable coin acceptor (if no existing token machine interface) | $25 | Depends | If building token input from scratch rather than tapping existing machine signal. |
| Weatherproof keyboard/trackpad | IP65-rated mini keyboard with touchpad — for on-site configuration without remote access | $45 | Low | Useful during setup/debug. Not needed for production. |
| Thermal camera (MLX90640) | Thermal overlay for ball tracking in low-light / night games | $55 | Low | Good crossover with StoveIQ sensor stack. Night game capability. |

---

## Key Design Notes

### Power Architecture
- Cage likely has 20A 120VAC service for pitching machine. Request dedicated 20A circuit for game electronics.
- Total 120VAC loads: Jetson PSU (45W) + LED PSUs (2x100W = 200W) + TV (150W typ) + Router (15W) + Audio (60W) ≈ 470W peak. Well within 20A/2400W circuit.

### Networking Architecture
```
Internet (4G SIM)
     │
GL.iNet Router (WiFi AP + LAN)
     ├─── Jetson Orin Nano (LAN/WiFi) — AI processing, game logic, HDMI to TV
     └─── ESP32 (WiFi / MQTT) — LED targets, token detection
```

### Camera Placement
- Mount camera above and slightly behind the pitcher's mound, angled toward home plate.
- At 35ft standoff, a 2.8mm CS lens on 1/2.3" sensor gives ~120° horizontal FOV — covers full cage width with margin.
- Aim camera axis down at ~25-30° angle to keep batter, ball, and target zones all in frame.

### Ball Tracking Approach
- Camera at 120fps captures ball in ~3 frames across cage (90mph pitch = 132ft/s → ball moves ~1.1ft per frame).
- Use OpenCV background subtraction + centroid tracking on Jetson GPU (CUDA).
- Zone detection: if tracked ball centroid overlaps with known target pixel boundaries, trigger hit event on that zone.
- Send MQTT message to ESP32: `{"zone": 3, "event": "hit"}` → ESP32 triggers LED celebration pattern on zone 3.

### LED Target Zones (suggested layout)
- 5 zones arranged in an X pattern (4 corners + center)
- Zone point values: Corner = 1000, Center = 2000 (bullseye)
- WS2812B allows zone to flash on hit, return to standby color between pitches

---

*Sources consulted:*
- [Arducam IMX477 Jetson Cameras](https://blog.arducam.com/arducam-imx477-jetson-cameras/)
- [Arducam IMX477 Frame Rate Documentation](https://docs.arducam.com/Nvidia-Jetson-Camera/Native-Camera/imx477/)
- [Jetson Orin Nano Power Requirements — NVIDIA Forums](https://forums.developer.nvidia.com/t/orin-dev-kit-power-requirements/273637)
- [SunBrite Veranda 3 — Amazon](https://www.amazon.com/SunBrite-Veranda-55-inch-Weatherproof-Television/dp/B0B11MY57Z)
- [SunBrite Pro 2 55" — Amazon](https://www.amazon.com/SunBrite-55-inch-Outdoor-Television-SB-P2-55-4K-BL/dp/B089PXD1QG)
- [ALITOVE WS2812B IP67 — Amazon](https://www.amazon.com/ALITOVE-Individually-Addressable-Flexible-Waterproof/dp/B018X04ES2)
- [Pyle PDWR62BTBK Outdoor Speaker — Amazon](https://www.amazon.com/Pyle-Waterproof-Bluetooth-Outdoor-PDWR62BTBK/dp/B01954Q5BO)
- [ZeboZap ZZTVT2064 Outdoor TV Mount — Amazon](https://www.amazon.com/ZeboZap-ZZTVT2064-Outdoor-Stainless-Weatherproof/dp/B0C49JVWTT)
- [GL.iNet GL-X750V2 Spitz — Amazon](https://www.amazon.com/GL-X750V2-Certified-EC25-AFFA-Installed-Dual-Band/dp/B08TRCSSZ4)
- [Altelix NEMA 4X 14x11 Enclosure — Amazon](https://www.amazon.com/Altelix-Enclosure-Polycarbonate-Weatherproof-Resistant/dp/B076ZV1MQJ)
- [Altelix 14x11x7 DIN Rail Enclosure with Outlets](https://altelix.com/altelix-14x11x7-polycarbonate-abs-nema-4x-din-rail-enclosure-with-120-vac-outlets-power-cord/)
- [Samsung 970 EVO Plus 500GB — Amazon](https://www.amazon.com/Samsung-970-EVO-Plus-MZ-V7S500B/dp/B07M7Q21N7)
- [NVMe SSD compatibility for Jetson Orin Nano — NVIDIA Forums](https://forums.developer.nvidia.com/t/compatible-ssd-for-jetson-orin-nano/319643)
