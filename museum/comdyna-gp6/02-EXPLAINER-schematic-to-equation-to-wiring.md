# From Schematic to Equation to Wiring
### How the Comdyna GP‑6 Computes a Projectile's Flight

This is the core teaching piece of the exhibit. It walks the **same path an engineer
walked in 1965** to make an analog computer solve a problem:

> **1. Write the physics as an equation → 2. Re‑draw the equation as a block diagram (the schematic) → 3. Translate each block into a patch‑cord connection on the machine.**

When you finish reading this, the tangle of red and black wires on the front panel
will read like a sentence.

---

## Part 1 — The Physics: what is a projectile actually doing?

Throw a ball straight up. Ignore air resistance. Only one force acts on it: **gravity**,
pulling down with a constant acceleration **g** (about 9.8 m/s² on Earth).

Three quantities describe the flight, and they're linked like a chain:

| Quantity | Symbol | In plain words |
|---|---|---|
| **Acceleration** | a | How fast the velocity is changing. Here it's constant: `a = −g` (negative = downward). |
| **Velocity** | v | How fast and which way the ball is moving. Starts at the launch speed, drops steadily. |
| **Position (height)** | y | How high the ball is right now. |

The key relationships are the definitions of velocity and acceleration:

```
velocity is the running total (integral) of acceleration over time
position is the running total (integral) of velocity over time
```

Written as calculus, the whole problem is **one second‑order differential equation**:

```
        d²y
        ───  =  −g            with starting conditions:
        dt²                      y(0)  = y₀   (launch height)
                                 y'(0) = v₀   (launch velocity)
```

If you solve it on paper you get the familiar high‑school formulas:

```
   v(t) = v₀ − g·t            →  a straight line sloping down
   y(t) = y₀ + v₀·t − ½·g·t²  →  a parabola (the flight arc)
```

**The analog computer never uses those solved formulas.** It works straight from
`d²y/dt² = −g` and builds the answer by integrating, the same way nature does.

---

## Part 2 — The Big Trick: "integrate twice"

Look at the chain again, but read it *backwards* — this is the engineer's insight that
makes the whole machine possible:

```
   START:   acceleration  =  −g        (a constant — just a steady voltage)
              │  integrate (add up over time)
              ▼
            velocity      =  v₀ − g·t   (a falling straight line)
              │  integrate (add up over time)
              ▼
            position      =  y₀ + v₀·t − ½g·t²   (a parabola — the flight)
```

So if we had a machine block that could **integrate** (continuously add up its input
over time), we could:

1. Feed a constant "−g" into integrator #1 → out comes **velocity**.
2. Feed that velocity into integrator #2 → out comes **position**.
3. Display position on a scope → watch the projectile fly.

That machine block exists. It's an **op‑amp integrator**, and the GP‑6 has four of them.

---

## Part 3 — The Building Blocks (what each block *does*)

An analog computer is a small kit of electronic blocks. Each one performs **one math
operation on voltages**. A voltage stands in for a number (on the GP‑6, ±10 V = ±full
scale; the red readout shows "percent of 10 V," so −0.588 means −5.88 V).

### Block A — The Coefficient Potentiometer (a "knob" = multiply by a constant)
A potentiometer is a voltage divider. Feed it the +10 V reference and it hands back
any fraction from 0 to 1. That fraction **is a number in your equation** — like the
value of `g`. On this exhibit:
- **Pot #2 = GRAVITY** (sets the value of g)
- **Pot #5 = INITIAL VELOCITY** (sets the launch speed v₀)

Turning these knobs changes the numbers in the equation *while it runs*.

### Block B — The Inverter (multiply by −1)
An op‑amp with equal input and feedback resistors flips the sign of a voltage:
`out = −in`. Sounds trivial, but sign‑juggling is half the job of patching an analog
computer (see the warning below). On this exhibit, **Amps #7 and #8** are inverters.

### Block C — The Integrator (the star of the show)
An op‑amp with a **capacitor** in its feedback loop performs calculus: its output is
the **running total of its input over time**.

```
                 ┌──────────┐ capacitor (C)
                 │          │
   input ──[ R ]──┤−    op   ├──── output  =  −(1/RC) · ∫ input dt  +  (initial value)
                  │     amp  │
            ┌─────┤+         │
        IC ─┘     └──────────┘
```

Three things to know about it, because they explain the whole front panel:

- **It accumulates.** A steady input makes the output ramp; that ramp *is* an integral.
- **It starts from an Initial Condition (IC).** Before the run, you preload the
  capacitor to a starting voltage through the **IC input**. *This is how the launch
  velocity and launch height get into the problem.*
- **It inverts as it integrates** (note the minus sign: `−(1/RC)∫…`). Every integrator
  flips the sign of what it computes. **This is why the schematic has extra inverters
  scattered around** — they exist purely to put the signs back the way physics wants them.

> ### ⚠ The single most important idea for understanding the wiring
> An op‑amp integrator computes the **negative** integral. So a chain of two
> integrators flips the sign twice. The "extra" amplifiers on the schematic
> (the inverters, Amps #7/#8/#3) are **not** doing physics — they're **bookkeeping for
> the minus signs** so the velocity falls and the arc points the right way. Once you
> see that, the patch panel stops looking like spaghetti.

---

## Part 4 — The Schematic: the equation re‑drawn as a wiring plan

Now we redraw `d²y/dt² = −g` as a diagram of those blocks. This is exactly the museum's
tan handout. Read it left to right, following the signal:

```
  ┌──────────┐     ┌──────────┐     ┌─────────────┐     ┌─────────────┐
  │ Pot #2   │     │ Amp #7   │     │ Amp #1      │     │ Amp #2      │
  │ GRAVITY  │────▶│ invert   │────▶│ INTEGRATOR  │────▶│ INTEGRATOR  │────▶ to SCOPE (Y)
  │ (= g)    │     │ (= −g)   │     │ "gravity"   │     │ "velocity"  │     = POSITION (parabola)
  └──────────┘     └──────────┘     │  → velocity │     │  → position │
   from +10V ref                    └─────▲───────┘     └─────────────┘
                                          │ IC input
                                    ┌─────┴──────┐    ┌──────────┐
                                    │ Pot #5     │───▶│ Amp #8   │
                                    │ INIT VEL   │    │ invert   │
                                    │ (= v₀)     │    │ (= +v₀)  │
                                    └────────────┘    └──────────┘
                                     from −10V ref

                         ┌──────────┐
        velocity ───────▶│ Amp #3   │────▶ to SCOPE (Y, alt.)
        (from Amp #1)    │ invert   │     = VELOCITY (falling straight line)
                         └──────────┘
```

**Reading the diagram as the equation:**

| Schematic block | What it represents in `d²y/dt² = −g` |
|---|---|
| Pot #2 (GRAVITY) from +10 V | the constant **g** |
| Amp #7 (inverter) | makes it **−g** (gravity pulls *down*) |
| Amp #1 (integrator) | first integral: turns −g into **velocity**, `v = v₀ − g·t` |
| Pot #5 (INIT VEL) → Amp #1's IC input | the starting condition **v₀** (launch speed) |
| Amp #8 (inverter) | fixes the sign of v₀ so the launch is upward (positive) |
| Amp #2 (integrator) | second integral: turns velocity into **position** `y` |
| Amp #2 output → scope | the **flight arc** (parabola), height vs. time |
| Amp #3 (inverter) | display helper: flips velocity so it reads as a falling line |

Every term in the equation has become a block. Every arrow is a wire. **The schematic
*is* the equation.**

---

## Part 5 — The Wiring: turning the diagram into patch cords

This is the final translation. On the GP‑6, every block has its connection points
brought out to color‑coded jacks on the patch panel. "Programming" the machine means
plugging cords between those jacks to make the diagram real. Each arrow in Part 4
becomes one patch cord.

Walking the same signal path, here is what gets physically wired (see
`04-OPERATOR-SETUP-CARD.md` for the exact jack‑by‑jack list):

1. **Reference → Gravity pot.** Patch the **+10 V reference** jack to **Pot #2**'s input.
   Dialing Pot #2 now sets the number `g`.
2. **Gravity pot → inverter (Amp #7).** Patch Pot #2's wiper (output) to Amp #7's input.
   Now you have a steady **−g** voltage — a constant "downward pull."
3. **−g → Integrator #1's summing junction.** Patch Amp #7 out into Amp #1's input. Amp #1
   begins accumulating −g over time → its output ramps. **That ramp is velocity.**
4. **Set the launch speed (initial condition).** Patch the **−10 V reference → Pot #5
   (INIT VEL) → Amp #8 (inverter) → Amp #1's IC jack.** This preloads integrator #1 so
   that at "launch" (t=0) its output already equals **v₀**. Turning Pot #5 changes how
   hard the projectile is thrown.
5. **Velocity → Integrator #2.** Patch Amp #1's output into Amp #2's input. Amp #2
   accumulates velocity over time → its output is **position (height)**.
6. **Position → Oscilloscope Y.** Patch Amp #2's output to the scope's vertical input.
   The scope's horizontal axis is driven by **time**, so it draws **height vs. time —
   the parabola, the flight arc.**
7. **Velocity → display inverter (Amp #3) → scope (optional view).** Patch Amp #1 → Amp #3
   → scope so you can flip the display to show the **velocity** as a straight line that
   falls through zero. *Zero velocity = the top of the flight (apogee).*

Then you run it (Part 6).

> **Why color‑coded cords?** Red jacks/cords carry signals; black are grounds/references;
> the layout groups each amplifier's inputs, summing junction (SJ), and output together.
> Once patched, the "program" is literally visible — you can trace the equation with
> your finger.

---

## Part 6 — Running it: IC, OP, and why the curve is *alive*

A digital computer would solve this in steps: pick a tiny `Δt`, compute the next
velocity, the next height, loop thousands of times. The GP‑6 doesn't step. The capacitors
integrate **continuously**, at the speed of electricity. The whole flight is solved
*all at once, all the time.*

The **MODE** controls run the show:

| Mode | What happens | Projectile meaning |
|---|---|---|
| **PS** (Pot Set) | Reference is applied so you can dial the pots and read them on the DVM. | Set `g` and `v₀`. |
| **IC** (Initial Condition / Reset) | Integrators are forced to their starting values. | Load the launch — ball is in your hand. |
| **OP** (Operate) | Integrators integrate. The solution runs. | **Launch!** The ball flies. |
| **HD** (Hold) | Integration freezes. | Pause the ball in mid‑air. |
| **RO** (Repetitive Operation) | The machine auto‑cycles IC→OP many times per second (rate set by COMPUTE TIME). | Re‑launches the ball continuously so the scope shows a **stable, live** trace. |

Because of **Repetitive Operation**, the machine re‑flies the projectile dozens of times
a second and re‑draws the arc each time. So when you **turn the GRAVITY knob, the whole
parabola changes shape in real time** — flatter on the "Moon," steeper with more gravity.
Turn **INITIAL VELOCITY** and the arc grows or shrinks. Nothing is recomputed in steps;
the wires simply *are* the new equation the instant you turn the knob.

That live, continuous response — math you can feel under your fingertips — is the whole
point of the exhibit:

> **THIS is the charm of analog computing.**

---

## One‑paragraph summary (for memorizing)

A projectile obeys `d²y/dt² = −g`. Read that backward and it says: integrate a constant
(gravity) once to get velocity, integrate again to get height. The schematic redraws
that as blocks — a knob for gravity, an integrator for velocity, a second integrator for
position, plus inverters to keep the minus signs honest. The wiring makes each block real
with patch cords: reference → gravity pot → inverter → integrator #1 (velocity) →
integrator #2 (position) → oscilloscope. Set the launch speed by preloading integrator
#1's initial condition. Run it in repetitive mode and the scope draws the flight arc
live — change gravity or launch speed by hand and watch the trajectory respond instantly,
because the circuit isn't *calculating* the motion, it *is* the motion.
