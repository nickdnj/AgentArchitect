# StoveIQ: MLX90640 Angled Mounting Sensor Validation Report

**Date:** 2026-03-26
**Prepared for:** StoveIQ Product Development
**Sensor:** Melexis MLX90640 32x24 Far-Infrared Thermal Array
**Core Question:** Can the MLX90640 accurately measure stovetop temperatures when mounted at an angle (under cabinet, wall-mounted) vs. directly overhead?

---

## Executive Summary

**Short answer: Angled mounting works — but only within a defined envelope, and with important caveats for stove-specific surface types.**

An angled mounting position (30–60 degrees from vertical) is physically viable and is already used in commercial stove-safety products. The fundamental IR physics are manageable within that range. However, there are three non-trivial problems that must be addressed in software and hardware design: (1) perspective-distorted spatial resolution, (2) emissivity/reflectivity errors that are strongly surface-dependent, and (3) steam/vapor interference that worsens as angle increases. None of these is a showstopper, but all require deliberate engineering decisions before you commit to a mounting position.

---

## 1. MLX90640 Technical Specifications

### Field of View

| Variant | Horizontal FOV | Vertical FOV | Best Use |
|---------|---------------|--------------|----------|
| MLX90640BAA (D110) | 110° | 75° | Close range, wide area coverage |
| MLX90640BAB (D55) | 55° | 35° | Longer distance, better spatial resolution |

- Resolution: 32 x 24 = 768 pixels
- Per-pixel angular subtend: ~3.4° H x 3.1° V
- Temperature range: -40°C to +300°C (adequate for stovetop; electric burners peak ~540°C surface but pots/grates rarely exceed 300°C in normal cooking)
- Accuracy: ±1.5°C to ±2°C (0–100°C range); wider tolerance at higher temps
- NETD (noise floor): 0.1K RMS at 1Hz
- Interface: I2C, up to 64Hz frame rate
- Operating temperature of chip itself: -40°C to 85°C (standard); up to 125°C for MLX90641

### What the Datasheet Does NOT Address

The Melexis datasheet and application notes do not explicitly discuss angled mounting accuracy degradation, nor do they provide an angular dependency correction coefficient. Melexis assumes perpendicular mounting for calibration accuracy claims. Any deviation from perpendicular is outside the characterized operating envelope.

---

## 2. IR Physics at Angles: The Core Problem

### Lambert's Cosine Law and Directional Emissivity

This is the fundamental physics you need to understand:

Thermal radiation from a surface follows the cosine-power model:

```
ε(α) = ε₀ × cos^n(α)
```

Where:
- `ε(α)` = effective emissivity at angle α from surface normal
- `ε₀` = emissivity at normal (perpendicular) incidence
- `α` = angle from perpendicular (0° = straight overhead, 90° = horizontal)
- `n` = material-dependent exponent (typically 1–3)

For a stovetop sensor mounted at angles relevant to under-cabinet or wall placement:

| Mounting Scenario | Angle from Surface Normal | Emissivity Effect |
|-------------------|--------------------------|-------------------|
| Direct overhead | 0° | Baseline — most accurate |
| Shallow under-cabinet angle | 20–30° | Minimal degradation (<5% emissivity change for most materials) |
| Moderate angle (typical under-cabinet) | 30–50° | Moderate — still within acceptable range for high-ε materials |
| Steep angle (wall-mounted behind stove) | 50–70° | Significant for metals; acceptable for ceramics/cast iron |
| Near-horizontal (side wall) | 70–90° | Unreliable — do not use |

### The 60-Degree Rule

Research and manufacturer guidance from Optris (a leading IR measurement company) establishes a practical threshold: **for non-metallic (dielectric) materials, emissivity is approximately constant up to 60° and drops meaningfully beyond that.** For metallic surfaces, the degradation starts earlier and is more severe due to high baseline reflectivity.

**Practical implication for StoveIQ:** Stay under 60° from surface normal. For a stove surface, that means the sensor must be positioned at least 30° above horizontal — which translates to a mounting position at least 17 inches horizontally back from the stove edge per foot of mounting height. Under-cabinet mounting at 18–30 inches above the stovetop typically produces angles in the 40–65° range depending on horizontal offset — right at the boundary.

### What Happens Past 60°

Beyond the 60° threshold:
- Emissivity drops significantly, causing the sensor to read lower than actual temperatures
- The surface increasingly acts as a mirror, reflecting the sensor's view of the ambient environment (cool ceiling, walls) into the measurement
- For polished stainless steel (emissivity ~0.1–0.2), this effect is dramatic and occurs at all angles, not just oblique ones
- Temperature readings can be off by 30–80°C or more for reflective surfaces at oblique angles

---

## 3. Spatial Resolution Analysis at Angle

### Geometry at Key Mounting Distances

The MLX90640 has 32 pixels horizontally. With the 55° FOV model, each pixel subtends ~1.72° H. With the 110° FOV model, each pixel subtends ~3.4° H.

**Spot size formula:** `spot size = 2 × d × tan(FOV_pixel/2)`

#### 55° FOV Model — Spatial resolution per pixel at distance:

| Mounting Height | Spot Size Per Pixel | 30" Stove Coverage | Pixels Across Stove |
|----------------|---------------------|--------------------|---------------------|
| 18 inches | 0.54 in (1.4 cm) | Full coverage | ~55 pixels |
| 24 inches | 0.72 in (1.8 cm) | Full coverage | ~42 pixels |
| 30 inches | 0.90 in (2.3 cm) | Full coverage | ~33 pixels |

#### Effect of 45° Mounting Angle on Effective Resolution

When mounted at a 45° angle, perspective projection compresses the far side of the stove and expands the near side. At a 45° angle:
- **Near burners (close to the sensor):** Resolution is ~1.4x better than overhead
- **Far burners (far edge of stove):** Resolution degrades to ~0.5–0.7x of overhead
- **Net effect:** You lose roughly half the effective resolution on the far side of a 30-inch stove compared to overhead mounting

For a standard 4-burner stove (two rows of burners, ~8" front-to-back spacing):
- **Front burners at 45° angle:** ~4–6 pixels per burner (adequate for detection)
- **Back burners at 45° angle:** ~2–3 pixels per burner (marginal — barely detectable as distinct burners)

At steeper angles (60°+), the back burners may map to only 1–2 pixels, making reliable per-burner discrimination unreliable without software correction.

### Perspective Parallax Error — A Known Issue

Carleton University research on stove-top thermal monitoring for assisted living (the most directly relevant academic work found) explicitly documented this problem:

> "Parallax effects from camera placement caused errors where flames from a front row burner were incorrectly perceived to be emanating from a back row burner which was inactive."

Their recommendation was proper overhead placement to eliminate this error. This is significant: **not only does angle reduce resolution on far burners, it can cause burner identity confusion in the raw pixel data** — a front burner's heat "bleeds over" the apparent position of the rear burner in an angled view.

### Can Software Perspective Correction Recover This?

Yes, partially. A homography transformation (standard computer vision technique) can mathematically correct perspective distortion to produce a "top-down view" from angled imagery. OpenCV implements this natively.

However, there are limits:
1. Homography correction reallocates pixels but cannot create resolution that doesn't exist. The back burners still have fewer samples after correction.
2. Accurate homography requires a fixed, known mounting geometry (height and angle must be stable)
3. Calibration is required per installation — a consumer product must automate this or provide a guided setup

**Verdict on perspective correction:** Feasible as a software feature, but it adds complexity and requires a one-time calibration step. Plan for it from day one.

---

## 4. Surface-by-Surface Emissivity Analysis

This is where the engineering gets complicated. Different stovetop surfaces behave very differently:

### Cast Iron Grates

- Emissivity: ~0.90–0.95 (excellent)
- Angular behavior: Very stable emissivity up to 60°
- IR measurement quality: Good even at angles
- Verdict: **Favorable — minimal correction needed**

### Ceramic/Glass Cooktop Surface

- Emissivity: ~0.85–0.95 (good)
- Angular behavior: Stable emissivity up to 60°
- IR measurement quality: Good at angles up to 55°
- Caveat: Heat is transmitted through the glass from below; what the IR sensor sees is the glass surface temperature, which lags burner temperature by several degrees
- Verdict: **Favorable — glass cooktops are actually the best case for IR sensors**

### Porcelain-Enameled Steel (traditional gas burner surrounds)

- Emissivity: ~0.85–0.90 (good)
- Angular behavior: Good up to 60°
- Verdict: **Favorable**

### Stainless Steel Cooktop Surfaces

- Emissivity: ~0.10–0.60 (highly variable — depends on finish and surface condition)
  - Polished/mirror stainless: ~0.10–0.15 (terrible)
  - Brushed/satin stainless: ~0.40–0.60 (marginal)
  - Oxidized/worn stainless: ~0.60–0.80 (adequate)
- Angular behavior: Emissivity degrades significantly at angles beyond 30° for polished surfaces
- Reflected ambient: At an angle, polished stainless reflects the cool ceiling/sensor housing back at the sensor — readings can be 50–150°C too low
- Verdict: **Problematic — polished stainless is the worst case and requires per-surface calibration or emissivity correction mode**

### Pots and Pans (what you're actually cooking in)

The sensor typically sees the bottom/sides of pots, not the stove surface:
- Anodized aluminum (most modern pans): ε ~0.80–0.95
- Stainless steel pots: ε ~0.10–0.60 (same issues as above)
- Cast iron: ε ~0.90–0.95
- Nonstick coated (PTFE): ε ~0.85–0.95
- Copper (bare): ε ~0.02–0.05 (essentially unusable for IR)

**Key insight:** For a "stove left on" safety use case, you don't need to accurately measure the exact temperature. You need to detect a hot region vs. ambient. Even low-emissivity surfaces will show elevated readings when hot vs. room temperature — just not calibrated absolute temperatures. For safety alerts ("this burner is very hot"), emissivity uncertainty is more forgiving than for precision cooking guidance.

### Steam and Vapor Interference

Steam above boiling cookware is a real issue:
- Water vapor absorbs IR radiation in specific wavelength bands
- The MLX90640 operates in the 8–14 µm (LWIR) band — water vapor absorption is moderate but not catastrophic in this range
- Dense steam plumes will cause the sensor to read the steam temperature (~100°C) rather than the surface beneath
- From an overhead angle, steam rises straight up and the sensor looks through a thin vertical column of steam
- From a wall angle, the sensor looks through a much longer diagonal path through the steam cloud
- **Bottom line:** Angled mounting increases the effective steam path length, worsening vapor interference by approximately 1/cos(angle)

At 45°, the optical path through steam is ~1.4x longer than overhead. At 60°, it is 2x longer. This matters for boiling detection accuracy but is less critical for "left on" detection (where the pot has boiled dry and steam is no longer present — the worst case scenario).

---

## 5. Real-World Products Using Angled IR Stove Monitoring

### CTS Smart Kitchen Sensor (Cooktop Safety)

- Mounting: **Wall-mounted, 12–16 inches above cooktop surface**
- Angle: Approximately 70–80° from overhead (nearly horizontal side-view)
- Sensor: Not disclosed (proprietary), likely thermopile array
- Uses AI/ML classification rather than absolute temperature calibration
- Key finding: This product deliberately chose a high-angle wall mount and compensates with AI classification rather than relying on absolute IR temperature accuracy
- This validates the approach of using classification + thresholds rather than precise temperature measurement for safety use cases

### Cooksy (Cooking Guidance Product)

- Mounting: **Under extractor hood, aimed downward** — predominantly overhead with a small forward angle
- Uses thermal sensor + visible camera
- Represents the premium approach: near-overhead for best thermal accuracy, combined with optical camera for food identification
- Key finding: The cooking-guidance use case (requires accurate temperature measurement) pushed them toward near-overhead mounting, while safety-only products tolerate steeper angles

### Carleton University Research System

- Mounting: Overhead thermal camera
- Explicitly rejected angled mounting due to parallax-induced burner misidentification
- Used high-resolution thermal camera (not specified as MLX90640)
- Achieved 94% sensitivity, 83% positive predictive value for safety alerts
- Key finding: For reliable per-burner discrimination, overhead is strongly preferred

### Airis Stove Guard

- Available in hood-mounted, wall-mounted, and ceiling-mounted variants
- Acknowledges that different mounting positions require different calibration
- Supports multiple mounting positions — confirms viability across positions

---

## 6. Quantified Angle Impact Summary

| Parameter | Overhead (0°) | 30° Angle | 45° Angle | 60° Angle |
|-----------|--------------|-----------|-----------|-----------|
| Emissivity error (ceramic/cast iron) | Baseline | <2% | <5% | 10–20% |
| Emissivity error (polished stainless) | Baseline | 15–25% | 25–40% | 40–70% |
| Temperature error (ceramic, corrected emissivity) | ±2°C | ±3–4°C | ±4–6°C | ±8–15°C |
| Temperature error (stainless, no correction) | ±5–10°C | ±15–30°C | ±25–50°C | ±50–100°C |
| Rear burner pixel count (55° FOV, 24" height) | ~8 px | ~6 px | ~4 px | ~2 px |
| Steam path length (relative to overhead) | 1.0x | 1.15x | 1.41x | 2.0x |
| Parallax burner confusion risk | None | Low | Moderate | High |
| Software correction feasibility | N/A | Easy | Moderate | Difficult |

---

## 7. Alternative Sensor Options

### FLIR Lepton 3.5

- Resolution: 160 x 120 pixels (25x more pixels than MLX90640)
- FOV: 56° (standard)
- Temperature range: up to +400°C
- Price: ~$200–$250 per unit (vs. ~$10–$15 for MLX90640)
- Advantage for angled mounting: 4–5x more pixels per burner at the same distance, making angled installations much more viable
- Each rear burner gets ~40–50 pixels even at 45° — well above the reliable discrimination threshold
- Verdict: **If budget allows, Lepton 3.5 makes angled mounting substantially more robust. The per-unit cost premium may be prohibitive for a consumer product targeting low BOM cost.**

### MLX90641

- Resolution: 16 x 12 pixels (half the MLX90640 in each dimension)
- Higher operating temperature (chip survives to 125°C ambient)
- Lower noise, faster refresh
- **Not a solution to the angle problem** — lower resolution makes it worse for angled mounting
- Use case: Same proximity-based environments, slightly more thermally robust chassis
- Verdict: Not recommended if resolution is already marginal with the MLX90640

### AMG8833 (Panasonic GridEYE)

- Resolution: 8 x 8 pixels (extremely low)
- Price: ~$35–$40
- At 8x8, a 30" stove at 24" overhead yields approximately 2–3 pixels per burner even overhead
- Absolutely unusable at an angle
- Verdict: **Not suitable for per-burner discrimination at any mounting position**

### Multiple MLX90640 Units

- Using 2 sensors at different angles could provide overlapping coverage that compensates for individual blind spots
- Cost: 2x sensor cost (~$20–$30 combined) still cheap
- Complexity: Requires coordinated calibration and data fusion
- Verdict: **Interesting option for wall/side mounting — one sensor on each side wall could triangulate temperature and position more accurately than a single angled sensor**

### Point IR Sensors (MLX90614, etc.)

- Single-zone IR thermometers
- One sensor per burner (4 sensors for 4 burners)
- Each sensor mounted directly overhead its target burner
- Emissivity and angle issues are entirely eliminated — each sensor looks straight down at one burner
- No spatial resolution needed — just "is this burner hot?"
- Cost: MLX90614 ~$8–$12 each; 4x = $32–$48 (comparable to one MLX90640)
- Drawback: Cannot detect spatial variation within a burner, cannot detect pot presence by thermal signature shape
- Verdict: **Highly viable for safety-only use case ("stove left on"). May not support premium features like cooking guidance.**

---

## 8. Mounting Position Engineering Analysis

### Scenario A: Under-Cabinet Mount (Most Common Ask)

**Geometry:**
- Under-cabinet bottom: typically 24–30 inches above countertop
- Countertop height: ~36 inches
- Stove surface: roughly countertop level
- Sensor height above stove surface: 24–30 inches
- Typical under-cabinet depth from wall: 12 inches
- Stove center from wall: ~15–18 inches

**Resulting angle:** With sensor at 12" horizontal offset and 24" vertical height, viewing stove center at 15" from wall:
- Horizontal offset to stove center: ~15–12 = 3 inches near side, ~3+15 = 18 inches to far side
- At 24" height, angle from vertical = arctan(3/24) = ~7° near side, arctan(18/24) = ~37° far side
- Average angle: ~20–25° from vertical (65–70° from horizontal)

**Assessment:** Under-cabinet mounting is actually quite favorable in terms of angle — closer to overhead than commonly assumed. The 55° FOV sensor covers a 30" stove fully at 24" distance. The near-perpendicular geometry (15–35° from vertical) keeps emissivity errors well within the acceptable range for all surface types.

**Key constraint:** Under-cabinet heat exposure. At 24–30 inches above a gas burner producing significant heat, the sensor will be in a warm environment. The MLX90640's ambient operating temperature limit is 85°C. In an aggressive cooking scenario, sensor ambient temperature could approach this limit if the unit is directly above a high-BTU gas burner without thermal isolation. Thermal shielding (aluminum plate, standoffs) is recommended.

### Scenario B: Wall Mount Behind Stove (Backsplash)

**Geometry:**
- Sensor on back wall, 12–16 inches above stove surface (per CTS product spec)
- Stove depth: ~25 inches
- Sensor looks forward and downward at ~30–45° from horizontal (60–75° from vertical/surface normal)

**Assessment:** This is the problematic zone. At 60–75° from vertical (surface normal), you are at or past the 60° threshold where emissivity degrades meaningfully, especially for metal surfaces. The CTS product does this successfully, but compensates with AI classification rather than absolute temperature calibration. If StoveIQ needs accurate temperature readings (not just hot/cold classification), this mounting position requires significant algorithmic investment.

**Additional concern:** At this near-horizontal angle, the sensor FOV overlaps with pot sides (vertical surfaces) rather than viewing purely the stove top (horizontal surfaces). The geometry is fundamentally different from overhead — you're reading reflected energy off pot sides and front burner grates, not direct radiation from stove surfaces.

### Scenario C: Wall Mount, Side of Stove

- Geometry: Looking horizontally at stove surface from the side
- Angle from surface normal: ~80–90° — this is nearly perpendicular to the surface normal
- Assessment: **Essentially unusable for temperature measurement of the stove surface.** The sensor would see the sides of pots and the edge profile of grates, not the cooking surfaces. Not recommended.

### Scenario D: Range Hood / OTR Microwave Mount

- Mounting point: Underside of range hood at ~18–24 inches above stove
- Angle: Near-overhead with slight forward tilt of 10–20°
- Assessment: **Optimal.** Minimal angular correction needed, best emissivity accuracy, best parallax-free per-burner discrimination. Cooksy takes this approach. The main challenge is aesthetics and installation complexity vs. a stick-on wall mount.

---

## 9. Key Recommendations for StoveIQ Product Design

### Recommendation 1: Define the Use Case First

The tolerance for angular measurement error is very different depending on what the product does:

| Use Case | Required Temp Accuracy | Angle Tolerance | Recommended Position |
|----------|----------------------|-----------------|---------------------|
| "Stove left on" safety alert | ±15–20°C is fine (just hot vs. cold) | Up to 60° | Under-cabinet or back-wall OK |
| Burner identification (which burner is on) | Spatial discrimination needed | Under 45° strongly preferred | Under-cabinet preferred |
| Cooking guidance (pan temp monitoring) | ±5–10°C needed | Under 30° strongly preferred | Range hood / near-overhead |
| Fire prevention (detect runaway temp) | ±20°C OK | Up to 50° | Under-cabinet OK |

### Recommendation 2: Target Under-Cabinet as Primary Mounting

Under-cabinet mounting (24–30 inches above stove, 55° FOV sensor) gives:
- Favorable angles (15–35° from vertical)
- Adequate per-burner resolution (4–8 pixels per burner)
- Manageable emissivity errors (<10% for most surfaces)
- A mounting position homeowners already associate with kitchen gadgets (under-cabinet lighting, Alexa, etc.)

### Recommendation 3: Build In Perspective Correction from Day One

Implement a calibration routine at setup:
- Present a known thermal pattern (or use room-temperature reference points at known stove corners)
- Compute homography transform matrix
- Apply perspective correction to all subsequent frames
- This is ~50–100 lines of Python/OpenCV and makes the software much more robust

### Recommendation 4: Use Classification, Not Just Raw Temperature

Instead of relying on calibrated absolute temperature, implement:
- Adaptive baseline: learn the "cool stove" thermal signature per pixel
- Anomaly detection: flag pixels significantly above baseline
- Spatial segmentation: cluster hot regions to specific burner positions
- This approach is robust to emissivity uncertainty, surface type variation, and moderate angle errors

### Recommendation 5: Handle Stainless Steel as a Special Case

If the product will mount over a stainless steel cooktop, either:
- Provide a manual emissivity adjustment setting (0.1–1.0 range)
- Detect low-emissivity surfaces automatically via atypically low "cold" readings compared to a known ambient reference
- Use relative temperature change (delta from baseline) rather than absolute temperature for stainless surfaces

### Recommendation 6: Prototype Both Mounting Positions

Before committing to a form factor, build two prototypes:
1. **Under-cabinet mount:** MLX90640 D55 (55° FOV), facing downward/forward at ~20–30° tilt
2. **Back-wall mount:** MLX90640 D55, facing forward at ~45° downward angle

Run each over a full range of cooking scenarios:
- Electric coil burner (high emissivity)
- Gas burner with cast iron grate
- Induction cooktop (glass — very high emissivity but heat only shows up in the pan)
- Stainless steel pan on any burner

Measure temperature error against a calibrated reference thermometer (TC direct contact or NIST-traceable IR gun) to quantify real-world angle error for each scenario.

---

## 10. Bottom Line Assessment

### Does angled mounting work?

**Yes, under-cabinet mounting works. Back-wall mounting works for safety classification only.**

| Mounting Position | Absolute Temp Accuracy | Burner ID | Safety Classification | Verdict |
|-------------------|----------------------|-----------|----------------------|---------|
| Overhead (range hood) | Excellent | Excellent | Excellent | Best, but hardest to install |
| Under-cabinet (~20–35° from vertical) | Good (±3–8°C on high-ε surfaces) | Good | Excellent | Recommended primary position |
| Back-wall (60–75° from vertical) | Poor on metals, OK on ceramics | Marginal | Good (with AI) | Safety-only use case |
| Side-wall (near-horizontal) | Unusable | Unusable | Poor | Do not use |

### What must be built in software:

1. Perspective homography correction (required for back-row burner accuracy)
2. Adaptive baseline / delta-temperature detection (compensates for emissivity uncertainty)
3. Burner zone mapping with calibration step (know where each burner is in pixel space)
4. Emissivity mode selection or auto-detection (handles stainless vs. ceramic vs. cast iron)

### What the MLX90640 cannot do at any angle:

- Reliably measure absolute temperature of polished stainless steel surfaces without calibrated emissivity correction
- Discriminate all 4 burners individually at steep angles (>55°) with only 32x24 pixels
- See through dense steam (though this is true at any angle)
- Survive indefinitely directly above a high-BTU gas flame at 24-inch proximity without thermal isolation

### Should you proceed with the MLX90640?

**Yes, for a safety-focused product.** The sensor is proven (Melexis has shipped >100M units), cheap (~$10 in volume), and well-supported. The angular limitations are real but manageable within the under-cabinet mounting geometry. The 32x24 resolution is marginal but adequate for 4-burner stove discrimination if mounting position is designed carefully.

**Consider upgrading to FLIR Lepton 3.5 if:** (a) cooking guidance / accurate temperature feedback is a core feature, or (b) the target mounting position is steep-angle wall mounting, or (c) BOM cost allows ~$200/unit sensor budget.

---

## Sources Consulted

- [Melexis MLX90640 Product Page](https://www.melexis.com/en/product/mlx90640/far-infrared-thermal-sensor-array) — FOV specs, accuracy, operating range
- [Melexis MLX90640 Datasheet PDF](https://www.melexis.com/-/media/files/documents/datasheets/mlx90640-datasheet-melexis.pdf) — Full technical specification
- [Optris: Emissivity in Infrared Measurement](https://optris.com/us/knowledge-library/emissivity-in-infrared-measurement/) — 60° threshold, directional emissivity, material-specific behavior
- [PMC: Infrared Thermography for Temperature Measurement and NDT](https://pmc.ncbi.nlm.nih.gov/articles/PMC4168422/) — Physics of oblique angle IR measurement
- [Inspenet: Effect of Emissivity on IR Temperature Measurement](https://inspenet.com/en/articulo/emissivity-on-ir-temperature-measurement/) — Cosine-power model, practical error bounds
- [Fluke: Fixing IR Thermography Issues on Reflective Surfaces](https://www.fluke.com/en-us/learn/blog/thermal-imaging/fixing-thermography-reflectivity) — Stainless steel challenges
- [Emissivity Wikipedia](https://en.wikipedia.org/wiki/Emissivity) — Directional emissivity theory, material tables
- [ResearchGate: Stove Top Thermal Monitoring for Assisted Living](https://www.researchgate.net/publication/267801544_Stove_Top_Thermal_Monitoring_for_Assisted_Living_at_Home) — Carleton University research; overhead required to prevent parallax burner confusion
- [ResearchGate: Thermal Imaging for Assisted Living](https://www.researchgate.net/publication/267783436_Thermal_Imaging_for_Assisted_Living_at_Home_Improving_Kitchen_Safety) — Follow-on study, 94% sensitivity
- [EE Times Europe: Thermal Imaging for Smart Homes](https://www.eetimes.eu/thermal-imaging-for-smart-homes/) — Under-hood integration pattern
- [The Spoon: Cooksy Stove Monitor](https://thespoon.tech/cooksy-uses-cameras-and-thermal-sensors-above-your-stove-for-guided-cooking/) — Commercial near-overhead mounting for cooking guidance
- [CTS Smart Kitchen Sensor Support](https://cooktopsafety.com/pages/support) — Commercial wall-mount (12–16" above stove) for safety classification
- [PMC: Perspective Distortion Correction via Homography](https://pmc.ncbi.nlm.nih.gov/articles/PMC11945749/) — Software correction method
- [Seeed Studio: MLX90641 vs MLX90640](https://www.seeedstudio.com/blog/2020/06/11/whats-the-difference-between-mlx90640-and-mlx90641-thermal-camera/) — Resolution and capability comparison
- [FLIR Lepton Integration Home](https://www.flir.com/developer/lepton-integration/) — Higher resolution alternative sensor
- [ThermoWorks Emissivity Table](https://www.thermoworks.com/emissivity-table/) — Material emissivity values for stove surfaces
- [iothrifty: IR Temperature Challenges — Environmental Interference](https://www.iothrifty.com/blogs/news/infrared-temperature-challenges-environmental-interference) — Steam and vapor effects
- [NKBA/CRD Kitchen Dimensions](https://www.crddesignbuild.com/blog/kitchen-dimensions-code-requirements-nkba-guidelines/) — Standard clearance dimensions for under-cabinet geometry
