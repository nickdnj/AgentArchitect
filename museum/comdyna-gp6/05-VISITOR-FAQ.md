# Visitor FAQ — quick answers for docents

Short, accurate answers to the questions visitors actually ask at this exhibit. Keep them
conversational; the goal is a spark of understanding, not a lecture.

---

**Q: Where's the screen and keyboard? Is it broken?**
Nothing's broken — there isn't one. You "program" this computer with **patch cords**, and
the answer comes out as a **picture on the oscilloscope**. The wires are the keyboard; the
scope is the screen.

**Q: So is there a computer chip in here?**
No. No chip, no memory, no software, no ones and zeros. The "brains" are **operational
amplifiers and capacitors** wired to act out the physics directly. It's an *analog* computer.

**Q: What's the difference between analog and digital, really?**
A **digital** computer **counts** — it breaks a problem into billions of tiny yes/no steps.
An **analog** computer **measures** — it uses a smoothly varying voltage to stand in for a
real quantity. Here, a voltage *is* gravity, a voltage *is* speed, a voltage *is* height.
Digital approximates by counting fast; analog mirrors the real thing continuously.

**Q: What is it actually computing?**
The flight of a projectile — a cannonball or thrown ball — under gravity. The green arc is
its **height over time.** Switch the view and you can also see its **speed.**

**Q: How does it "do the math" without code?**
By **integrating** — continuously adding up. Gravity (a steady voltage) gets added up over
time to make **speed.** Speed gets added up over time to make **height.** Two integrations,
done by two op‑amp‑and‑capacitor blocks called **integrators.** That's the whole trick.

**Q: Why does turning the knob change the curve instantly?**
Because the machine isn't running a program it has to restart — the **wiring itself is the
equation.** It's actually re‑flying the projectile dozens of times a second. Change a knob
and you've changed a number in the live equation, so the arc reshapes immediately and
smoothly. **That's the charm of analog computing.**

**Q: What do the two knobs do?**
**GRAVITY** sets how strong gravity is — turn it down and the arc stretches out like on the
Moon; up, and the ball drops fast. **INITIAL VELOCITY** sets how hard you throw it — bigger
throw, bigger arc.

**Q: What's the red number on the front?**
A built‑in voltmeter you can aim at any wire in the circuit. It reads in **percent of full
scale** (full scale is 10 volts), so −0.588 means about −59%. Operators use it to check the
numbers inside the equation, like setting gravity precisely.

**Q: What are all the extra triangles on the diagram labeled "invert"?**
Sign‑flippers. Each integrator naturally flips plus and minus as a side effect, so the
engineer adds little **inverter** amplifiers to put the signs back — to make gravity pull
*down* and the throw go *up*. Keeping the minus signs straight is half the art of wiring an
analog computer.

**Q: Where's the top of the flight on the screen?**
Switch to the **velocity** view — the straight line that falls and crosses zero. **The
zero‑crossing is the apogee:** the instant the ball stops rising and begins to fall.

**Q: Was this ever used for real work, or is it just a teaching toy?**
Both. This particular model (Comdyna GP‑6) was a **teaching** machine, but big analog
computers were serious engineering tools for ~30 years — used in the **Apollo program,
aircraft and spacecraft design, missile guidance, and control systems** — because they
solve differential equations instantly and let you *feel* how a system responds.

**Q: Why did digital computers win?**
Precision, repeatability, memory, and flexibility. A digital computer gives the same exact
answer every time and can be reprogrammed in software in seconds. Analog answers are limited
by the accuracy of the parts and drift with temperature. But for **intuition** — watching a
whole system breathe as you turn a knob — analog is still wonderful, which is why people
build them today for fun and for education.

**Q: Could I build one of these at home?**
The core is just an **op‑amp and a capacitor** — a few dollars of parts. Hobbyists build
small analog computers all the time. This one simply packages eight amplifiers, multipliers,
and a tidy patch panel into one box.

**Q: How accurate is it?**
Roughly a percent or so — good enough to see the physics clearly, not good enough for, say,
banking. Accuracy is set by the quality of the resistors, capacitors, and amplifiers, and it
can drift a little with heat. Trading some precision for **speed and insight** was exactly
the point.

---

### The line to leave them with
> "It doesn't *calculate* the motion — it *becomes* the motion. That's the charm of analog computing."
