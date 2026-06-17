# Passive Phone-Based Presence Detection for InfoAge — Research Report

**Date:** 2026-06-17
**Scope:** A *passive* (no app, no QR, no visitor action) system to (1) count visitors / measure traffic and (2) support live occupancy & safety headcount, on a shoestring volunteer-run-nonprofit budget (Raspberry Pi / ESP32 class hardware).
**Method:** 5 parallel web-research agents, claims cross-checked across multiple independent sources.

> **Disclaimer:** The legal section is informational only, not legal advice. Before deploying anything that captures phone signals, have an NJ-licensed attorney review it.

---

## TL;DR — The honest answer

**Passive phone detection is the wrong tool for the job you actually have.** It *was* a reasonable way to count people ~2014–2018, but **MAC-address randomization** on every modern phone has broken it. Today, naive phone counting **wildly overcounts** (one phone shows up as dozens of "devices"), and the sophisticated correction techniques that academics use reach only ~75% accuracy in the field — and are collapsing further as Apple/Android tighten their privacy defenses each year. None of those correction pipelines are something a volunteer can install and forget.

**For a volunteer-run museum, the right answer is a small anonymous door sensor, not phone sniffing:**

- **Best value: a bi-directional thermopile (heat-array) people counter** at the main entrance — e.g. **Milesight VS351, ~$200**. ~95% accurate, **100% anonymous** (reads heat blobs, no images, no MACs), battery-powered (~1.5 yr), gives true in/out counts → feeds both attendance analytics *and* a live occupancy number for safety/closing.
- **Rock-bottom alternative: a wireless dual-beam IR door counter (~$150)** — ~90–95% accurate at a single standard door, directional, no privacy concerns.
- **Calibrate** either one for a week against a **$10 manual clicker** to establish your correction factor.

Phone/Wi-Fi counting should be **avoided**; RGB cameras should be avoided too (privacy optics + maintenance burden). Details and the full reasoning follow.

---

## 1. How passive phone detection works (and what it needs)

There are three passive channels. Only one is even technically plausible, and it's the one randomization has broken.

### Wi-Fi probe-request sniffing — the "primary" method
- Phones that aren't connected to Wi-Fi periodically broadcast unencrypted **802.11 probe-request** frames advertising their presence (~every 1–5 min when idle; more often when the screen is on). Any Wi-Fi card in **monitor mode** on the right channel can hear them. [arxiv.org/pdf/1905.06809](https://arxiv.org/pdf/1905.06809), [CMU writeup](https://ems.andrew.cmu.edu/2016/kevin/04/07/karol_invisible_beacons/index.html)
- **Captured:** source MAC, signal strength (RSSI, a coarse distance proxy), sequence numbers, sometimes preferred-network names. Indoor range is tens of meters — easily building-wide.
- **Hardware:** Raspberry Pi + a monitor-mode-capable USB Wi-Fi adapter (Atheros AR9271 chipsets like the Alfa AWUS036NHA are the reliable choice, ~$15–40). **Software:** Kismet, airodump-ng, or Python/Scapy. [null-byte guide](https://null-byte.wonderhowto.com/how-to/enable-monitor-mode-packet-injection-raspberry-pi-0189378/)

### ESP32 as a ~$10 sniffer
- An ESP32 in **promiscuous mode** can capture probe requests standalone for ~$5–10. But it hears **one channel at a time** (must channel-hop, missing frames), has a small buffer, and suffers the exact same randomization problem. Good only for cheap *relative* trends. [Espressif docs](https://docs.espressif.com/projects/esp-idf/en/v5.0.4/esp32/api-guides/wifi.html), [ESP32-Paxcounter](https://github.com/datacake/ESP32-Paxcounter)

### Passive BLE scanning — not usable for counting strangers
- A passive BLE scanner reads advertising packets without connecting, but **idle/locked phones don't broadcast a usable, stable identifier.** Apple uses Resolvable Private Addresses that rotate ~every 15 min and are unresolvable without the device's secret key; Android often doesn't advertise at all by default. BLE presence tools (ESPresense, ESPHome, Bermuda) are built to track **known, enrolled** devices ("is *Nick* here?"), **not** to count anonymous visitors. [Mist BLE randomization](https://www.mist.com/documentation/ble-mac-randomization/), [ESPresense](https://espresense.com/)

### Cellular detection — illegal, skip it
- The only way to passively detect phones via the cellular network is a rogue base station / IMSI-catcher ("Stingray"), which is **illegal for a private party to operate** (see §3). Not an option. [EFF](https://sls.eff.org/technologies/cell-site-simulators-imsi-catchers)

---

## 2. The dealbreaker: MAC-address randomization

This is why passive phone counting no longer works.

- **Probe-request randomization** has been on by default since **iOS 8 (2014)** and **Android 6 (2015)**: while scanning, phones emit a *fake, random* MAC (identifiable by the "locally-administered" bit). [macaddress.io](https://macaddress.io/faq/mac-address-randomization-in-wifi-probe-requests)
- **Per-network "private address"** is the bigger break: **Android 10 (2019)** and **iOS 14 (2020)** default every Wi-Fi connection to a unique random MAC. **iOS 18 (2024)** added *rotating* addresses that re-randomize periodically. [Apple](https://support.apple.com/en-us/102509), [Android](https://source.android.com/docs/core/connect/wifi-mac-randomization-behavior), [CUJO on iOS 18](https://cujo.com/blog/assessing-apples-update-to-rotating-mac-addresses/)
- **Effect:** one phone emits *many* different MACs over a visit, so counting unique MACs **massively overcounts** — a single visitor can look like dozens of devices.
- **The old "<3% of probes are randomized" statistic is obsolete** — it predates the iOS 14 / Android 10 defaults. Today the large majority of modern phones randomize. (Don't trust any single current percentage; it's environment- and OS-mix-dependent.) [Five Years Later study](https://link.springer.com/chapter/10.1007/978-3-030-33110-8_5)
- **Correction techniques** (sequence-number clustering, information-element fingerprinting, burst-timing, statistical estimators) exist, but: best published results are **~96% in a controlled lab but only ~75% in the real world**, and a deep-learning fingerprinter that scored >99% **dropped below 30% once OS privacy defenses were applied.** Fingerprint diversity is shrinking every year by design. [Computer Networks 2022](https://dl.acm.org/doi/10.1016/j.comnet.2022.109393), [Robyns et al.](https://onlinelibrary.wiley.com/doi/10.1155/2017/6235484), [arXiv 2206.10927](https://arxiv.org/pdf/2206.10927)

**Bottom line:** raw counts are meaningless without correction; corrected counts are ~75% at best and degrading; and the pipelines are research-grade, not volunteer-maintainable. Treat any DIY Wi-Fi count as a *relative* "busier Saturday vs. Tuesday" indicator only — never a defensible attendance number, and never reliable live occupancy.

---

## 3. Legal & privacy constraints (US / NJ) — *informational, not legal advice*

- **Cell-phone jammers: flatly illegal.** No exceptions for businesses, schools, or nonprofits. Operating one risks large FCC forfeitures and criminal penalties — and it blocks 911. Irrelevant to passive *detection* anyway, but flagged because it came up. [FCC jammer enforcement](https://www.fcc.gov/general/jammer-enforcement)
- **IMSI-catchers / Stingrays: illegal for private parties.** Operating an unauthorized radio transmitter / fake cell tower violates §301 of the Communications Act. Rules out any cellular approach. [ACLU/EFF FCC filing](https://www.aclu.org/sites/default/files/field_document/aclu-eff_fcc_cell_site_simulator_filing.pdf)
- **Wi-Fi sniffing — the bright line is headers vs. content.** The federal Wiretap Act (and NJ's wiretap statute, N.J.S.A. 2A:156A) target the **contents** of communications. Capturing only openly-broadcast management-frame **headers/MACs** (no payload) is the basis of the commercial analytics industry and is generally viewed as lower-risk — but **no statute or case squarely blesses it**, and *Joffe v. Google* (9th Cir. 2013) held that capturing **payload** from unencrypted Wi-Fi *can* violate the Wiretap Act. **Never capture, store, or decode payload/content.** [EPIC ECPA](https://epic.org/ecpa/), [Joffe v. Google](https://en.wikipedia.org/wiki/Joffe_v._Google,_Inc.), [NJ 2A:156A-3](https://law.justia.com/codes/new-jersey/title-2a/section-2a-156a-3/)
- **If you ever do collect MACs, privacy best practices (and FTC precedent) require:**
  - **Salt + hash** MACs immediately; rotate the salt. (Note: hashing alone is *not* full anonymization — EFF.)
  - Store **aggregate counts only**, no PII; **short retention**; data minimization.
  - **Post clear signage** at entrances and offer an opt-out.
  - **Your posted policy must exactly match actual practice** — the FTC's first retail-tracking action (*Nomi Technologies*, 2015) was a deception charge for promising an opt-out that didn't exist. [FTC Nomi](https://www.ftc.gov/news-events/news/press-releases/2015/04/retail-tracking-firm-settles-ftc-charges-it-misled-consumers-about-opt-out-choices), [FPF MLA Code](https://fpf.org/wp-content/uploads/10.22.13-FINAL-MLA-Code.pdf), [EFF](https://www.eff.org/deeplinks/2013/10/mobile-tracking-code-conduct-falls-short-protecting-consumers)

**Net:** the legal-cleanest, simplest posture is to **not touch phones at all** — which conveniently is also the most accurate choice.

---

## 4. Realistic options compared

| Method | Hardware cost | Accuracy | Directional (live occupancy)? | Privacy | Maintenance |
|---|---|---|---|---|---|
| **Thermopile array counter** (Milesight VS351; DIY AMG8833+Pi) | **~$200 commercial** / ~$50 DIY | **~95%** | **Yes** | **Excellent** — heat blobs, no images | Low (commercial) |
| **Dual-beam IR door counter** | **~$150** | ~90–95% single door; 80–85% wide/double doors | Yes (dual-beam) | Excellent | Very low |
| Single-beam IR / PIR | $20–$300 | ~93–95% single door (total only) | No | Excellent | Very low |
| Overhead ToF / stereo / AI camera | $400–$2,000+/sensor | 98–99%+ | Yes | Good (ToF anon.) / poor (RGB) | Low commercial / high DIY |
| DIY OpenCV Pi camera | ~$80–150 | unvalidated | Yes | RGB = privacy concern | High (coding/tuning) |
| **Passive Wi-Fi/BLE phone counting** | ~$50–115 (Pi) / ~$10 (ESP32) | **relative trend only**, ~75% corrected & falling | No | Legal/privacy gray area | High (research-grade) |
| Manual clicker / sign-in | ~$0–10 | error-prone, staff-dependent | Only if staff log direction | Excellent | High labor |

Key open-source phone-counting projects, for reference: [howmanypeoplearearound](https://github.com/schollz/howmanypeoplearearound), [ESP32-Paxcounter](https://github.com/datacake/ESP32-Paxcounter). Counter vendors: [Milesight VS351](https://www.milesight.com/iot/product/lorawan-sensor/vs351), [AccuraCounter IR](https://wecountpeople.com/accuracounter/), [Adafruit AMG8833](https://www.adafruit.com/product/3538).

---

## 5. Recommendation & phased plan for InfoAge

**Recommended system: one bi-directional thermopile counter at the main public entrance**, feeding both an attendance log and a live "people inside" number.

**Why:** anonymous by design (sidesteps the entire legal/privacy section), ~95% accurate, battery-powered and low-maintenance (good for a volunteer crew), and directional so the *same* sensor serves both goals — analytics *and* safety/closing headcount. It costs about the same as a DIY Pi sniffer rig but actually produces trustworthy numbers.

**Phase 1 — Validate cheaply (1–2 weeks, ~$10).** Run manual clicker counts at the main door during open hours to get a true baseline. This is your ground truth for calibration and tells you real daily/weekly volume.

**Phase 2 — Deploy the sensor (~$200).** Mount a Milesight VS351 (or equivalent bi-directional thermopile) over the main entrance. If InfoAge has a technical volunteer who enjoys the build, a DIY AMG8833 + Raspberry Pi (~$50) is viable but needs coding and tuning — only choose it if maintenance ownership is clear.

**Phase 3 — Calibrate & dashboard.** Run the sensor alongside clicker counts for a week, compute a correction factor, then surface the running in-minus-out count on a cheap display or a simple **Home Assistant** dashboard for live occupancy. Set a capacity threshold alert for safety/closing.

**Phase 4 — Expand only if needed.** If you later want *per-room* traffic, add one thermopile/IR counter per gallery doorway. (Avoid trying to do room-level work with phones — same randomization problem, worse indoors.)

**Explicitly avoid:** Wi-Fi/BLE phone sniffing (unreliable + legal gray area) and RGB cameras inside the museum (privacy optics + DIY burden).

---

## Method note
WebFetch was broadly blocked (HTTP 403) in the research sandbox, so figures were drawn from search-engine extracts of the cited sources rather than full-page reads. Core claims (probe-request mechanics, MAC randomization timeline and impact, jammer/IMSI illegality, counter accuracy/price ranges) were corroborated across multiple independent sources and are high-confidence. **Reconfirm exact vendor prices on the live product pages before purchasing**, and have counsel review before any phone-signal capture.
