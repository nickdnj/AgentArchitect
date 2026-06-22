# Operator Setup Card — GP‑6 Projectile Demo

**Laminate this and keep it with the exhibit.** It gets the demo running and recovers it
if a knob or cord gets bumped.

> ⚠ **Authority:** The museum's **tan schematic handout** photographed with the exhibit is
> the master wiring diagram for this specific patch. If anything here disagrees with the
> physical panel or that sheet, trust the sheet. The jack list below reconstructs that
> schematic block‑for‑block; verify against the panel before re‑patching.

---

## A. Power‑up & display (do this first)

1. **Power on** the GP‑6 and the **HP 1200B oscilloscope**. Let both warm up ~1 min.
2. On the scope: you want the computed signal on **vertical (Y)** and **time on horizontal
   (X)**. Set the channel feeding from the computer to roughly **1 V/div** and the sweep so
   one full flight fills the screen. Adjust intensity/focus for a clean green trace.
3. Confirm the red **OVLD** lamp is **off**. If it's lit, an amplifier is railed — a pot is
   too high or a cord is wrong; back off the GRAVITY/INIT‑VEL pots and recheck patching.

---

## B. Front‑panel settings (the photographed configuration)

| Control | Setting | Why |
|---|---|---|
| **MODE SELECTOR** knob | **OPR** (operate) | Lets the run modes / repetitive operation drive the solution. |
| **Run mode** | **RO** (Repetitive Operation) | Auto‑cycles IC→OP many times/sec → live, stable scope trace. |
| **COMPUTE TIME** knob | mid‑range (≈ **20–50**) | Sets the repeat rate / run length. Tune so the arc is steady and fills the screen. Turn toward OFF = slower/longer runs. |
| **GRAVITY** (Coefficient Pot **#2**) | start ~**0.16** (≈ −0.160 on DVM) | The value of `g`. This is the "hero" knob you turn during the demo. |
| **INITIAL VELOCITY** (Coefficient Pot **#5**) | start ~**0.66** (≈ −0.660 on DVM) | Launch speed v₀. Second demo knob. |

### DVM (red readout) addressing — as labeled on the panel tape
The readout is an addressable voltmeter; the knobs pick what it shows. It reads **percent
of 10 V** (e.g. **−0.588 = −5.88 V = −59% of full scale**).

| Selector | Setting | Reads / means |
|---|---|---|
| **X ADDRESS** | **TIME** | Horizontal = time base (drives the scope sweep). |
| **Y / POT ADDRESS** | **7 = GRAVITY**, **5 = G×V** | Point the meter at the gravity term / the gravity‑times‑velocity node. |
| **Solution address** | **3 = VELOCITY**, **2 = POSITION** | Amp #3 output = velocity (line); Amp #2 output = position (parabola). |

> To switch the scope between the **parabola (position, Amp #2)** and the **falling line
> (velocity, via Amp #3)**, move the **Y display selector** to that amplifier — the
> schematic note calls this **"Select 4 on the Y switch"** to view Op Amp #2's descending
> velocity line. Use whichever Y‑address your scope patch is wired to; confirm once and mark it.

---

## C. The patch list (block‑for‑block from the schematic)

Each line is one signal hop = one (or one pair of) patch cords. Trace each against the tan
sheet. Jack groups on the GP‑6: each amplifier has **SJ** (summing junction / input),
**IC** (initial‑condition input), and **output**; pots have an **input** and **wiper/output**;
references are the **+REF / −REF (±10 V)** jacks.

| # | From | To | Represents |
|---|---|---|---|
| 1 | **+10 V REF** | **Pot #2** input (GRAVITY) | provides the constant to scale into `g` |
| 2 | **Pot #2** output | **Amp #7** input (inverter) | makes **−g** (gravity pulls down) |
| 3 | **Amp #7** output | **Amp #1** SJ input (integrator) | feed −g into 1st integrator → **velocity** |
| 4 | **−10 V REF** | **Pot #5** input (INIT VELOCITY) | provides the constant to scale into v₀ |
| 5 | **Pot #5** output | **Amp #8** input (inverter) | makes **+v₀** (upward launch) |
| 6 | **Amp #8** output | **Amp #1** **IC** input | preload integrator #1 → start velocity = v₀ |
| 7 | **Amp #1** output | **Amp #2** SJ input (integrator) | feed velocity into 2nd integrator → **position** |
| 8 | **Amp #2** output | **Scope vertical (Y)** | display **height vs time = the parabola** |
| 9 | **Amp #1** output | **Amp #3** input (inverter) | sign‑flip velocity for display |
| 10 | **Amp #3** output | **Scope vertical (Y), alt.** | display **velocity = falling straight line** |
| — | **Time base / ramp** | **Scope horizontal (X)** | sweep = time axis |

**Grounds:** common/ground jacks (black) tie the scope and computer references together as
shown on the sheet. Don't remove black cords thinking they're spares.

---

## D. Run sequence (each demo)

1. **MODE SELECTOR → POT SET (PS).** Dial/confirm **GRAVITY (#2)** and **INIT VEL (#5)** on
   the DVM. Return **MODE SELECTOR → OPR**.
2. Ensure run mode is **RO** (repetitive). The scope should show a steady arc.
3. **Demo the GRAVITY knob** (slow turns): arc stretches (weaker g, "Moon") / collapses
   (stronger g).
4. **Demo the INITIAL VELOCITY knob:** bigger/smaller arc.
5. To freeze a moment for discussion: tap **HD (Hold)**. Tap **OP/RO** to resume.

---

## E. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| **OVLD lamp lit**, trace pinned to edge | a pot too high / amp saturated / mis‑patch | Lower GRAVITY & INIT‑VEL pots; verify cords 1–7 against the sheet. |
| **Flat line, no arc** | machine in IC/HOLD, or pot at zero, or scope not on the position node | Set **RO/OPR**; raise pots off zero; confirm scope Y is on **Amp #2**. |
| **Arc drifts / won't sit still** | COMPUTE TIME too fast/slow, or scope sweep mismatched | Re‑tune COMPUTE TIME and scope time/div until one flight fills the screen. |
| **Curve frozen, won't respond to knobs** | stuck in **HOLD**, or MODE in **POT SET** | Return to **OPR + RO**. |
| **Velocity line instead of parabola (or vice‑versa)** | scope Y addressed to the wrong amp | Move Y display selector: **Amp #2 = parabola**, **Amp #3 = velocity line**. |
| **Readout reads near zero for a live signal** | DVM addressed to an idle node | Re‑address **Y/POT** or **Solution** selector to the node you want (2=position, 3=velocity). |

---

## F. Numbers cheat‑sheet (for visitor questions)

- **Full scale:** ±10 V represents ±100% of a quantity. DVM shows **percent of 10 V**
  (−0.160 → −16% → −1.60 V).
- **Integrator law:** output = −(1/RC) × (running total of input) + initial condition.
  The **minus sign** is why inverter amps (#7, #8, #3) exist — to keep the physics signs right.
- **Apogee:** where the **velocity line crosses zero** = the top of the flight.
