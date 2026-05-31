# Comdyna GP‑6 — Projectile Demonstration Exhibit Kit

A complete docent/demo package for the **Comdyna GP‑6 analog computer** exhibit,
paired with the HP 1200B oscilloscope. The demo shows a projectile's flight being
*computed in real time* by op‑amps, integrators, and patch cords — and re‑drawn
live on the scope as you turn the GRAVITY and INITIAL VELOCITY knobs.

The throughline of the whole exhibit is one idea:

> **Schematic → Equation → Wiring.** The picture of the circuit *is* the math, and the
> wired‑up machine *is* the solution being drawn in front of you.

---

## What's in this kit

| File | Audience | Use it for |
|---|---|---|
| **`01-DEMO-SCRIPT.md`** | Docent / presenter | The spoken, timed walkthrough. Hook → physics → wiring → the live "turn‑the‑knob" payoff. |
| **`02-EXPLAINER-schematic-to-equation-to-wiring.md`** | Curious visitor / docent prep | The core teaching piece. Walks the full path: physics → differential equation → block diagram → actual patch‑cord wiring on this machine. |
| **`03-EXHIBIT-PLACARD.md`** | Walk‑up visitor | Print‑and‑mount placard text. Short, self‑contained, readable in 60 seconds. |
| **`04-OPERATOR-SETUP-CARD.md`** | Docent / operator | The "how do I actually run this thing" card: knob settings, patch list, mode sequence, troubleshooting. |
| **`05-VISITOR-FAQ.md`** | Docent | Quick answers to the questions visitors actually ask. |

---

## The 20‑second version (for the docent)

This machine does **not** have a CPU and runs **no software**. It solves the
projectile equation **a = −g** by *being* the equation:

- **Gravity** is a steady voltage (set by a knob).
- An **integrator** adds that up over time to get **velocity** (a straight, falling line).
- A **second integrator** adds *velocity* up over time to get **height** (a parabola — the flight arc).
- The **oscilloscope** plots height vs. time, so you literally watch the projectile fly.

Turn the GRAVITY knob and the arc changes *instantly* — because the wires are
doing the calculus continuously, not step‑by‑step. **That is the charm of analog computing.**

---

## The exhibit hardware

- **Comdyna GP‑6** general‑purpose analog computer (≈1970s–80s, a classroom/teaching machine).
  - 4 integrator/summer amplifiers (top, labeled **1–4**), 2 inverter amplifiers (**7–8**), 2 multipliers, 8 coefficient potentiometers, ±10 V & ±15 V references, built‑in addressable digital voltmeter (the red readout).
- **HP 1200B oscilloscope** — the display. X axis = time, Y axis = the computed quantity (position or velocity).
- **Patch cords** — the "program." Re‑patching the cords changes the equation being solved.

> Note: the museum's printed schematic (the tan handout photographed with the exhibit)
> is the authoritative wiring diagram for *this* setup. This kit is written to match it:
> Pot #2 = Gravity, Pot #5 = Initial Velocity, Amp #1 = Gravity Integrator,
> Amp #2 = Velocity Integrator (position output), Amp #3 = Velocity inverter for display,
> Amps #7/#8 = sign inverters.

---

## Sources & further reading

- [Comdyna GP‑6 — Carleton University School of Computer Science, Vintage Computing](https://carleton.ca/scs/vintage-computing/item/vin99/)
- [GP‑6 Analog Computer Operator's Manual (VTDA archive, PDF)](https://vtda.org/docs/computing/Comdyna/Comdyna_GP6AnalogComputerOperatorsManual.pdf)
- [Comdyna GP‑6 Operator's Manual (bitsavers, PDF)](http://www.bitsavers.org/pdf/comdyna/Comdyna-GP6-AnalogComputer.pdf)
- [Comdyna GP‑6 — Old Computer Museum](https://oldcomputermuseum.com/comdyna_gp6.html)
- [JonDent — Comdyna GP‑6: introduction to the patch bay](https://djjondent.blogspot.com/2022/05/comdyna-gp-6-introduction-to-patch-bay.html)
- [WA6PZB — Projectile Motion with Analog Computers](http://wa6pzb.blogspot.com/2018/08/projectile-motion-with-analog-computers.html)
- [All About Circuits — Op‑Amp Integrator lab](https://www.allaboutcircuits.com/textbook/experiments/chpt-6/integrator/)
