# Demo Script — Comdyna GP‑6 Projectile Demonstration

**Runtime:** ~5–7 minutes (with a 90‑second short version below)
**Audience:** general museum visitors, all ages
**Presenter needs:** GP‑6 powered on, patched per `04-OPERATOR-SETUP-CARD.md`, HP 1200B
oscilloscope on and showing the trace, machine in **Repetitive Operation (RO)**.

**Stage directions are in [brackets]. Spoken lines are in plain text.
Key payoff lines are in bold — land them.**

---

## ⏱ 90‑Second Short Version (high‑traffic / walk‑up)

> [Point at the scope's parabola.] "See that curve? That's a ball flying through the air —
> being calculated **right now** by this machine. But here's the thing: there's **no
> computer chip in here, and no software.** No ones and zeros.
>
> This is an **analog** computer. Instead of counting, it uses **electricity to act out
> the physics.** Gravity is just a steady voltage — set by *this* knob. The machine adds
> that up over time to get the ball's speed, adds *that* up to get its height, and paints
> the height on the scope. That's the flight.
>
> Watch what happens when I change gravity. [Slowly turn the GRAVITY knob.] **The whole
> trajectory reshapes — instantly.** Less gravity, the ball sails — that's the Moon. More
> gravity, it slams down. I didn't re‑run any program. The wires just *are* the new
> equation the moment I turn the knob.
>
> **That's the charm of analog computing — math you can feel with your fingertips.**"

---

## Full Demo

### 1. The Hook (30 sec)
[Stand beside the scope. Wait for the parabola to be visible.]

"Take a look at this green curve on the screen. It's an arc — like a ball thrown across a
field, going up, peaking, and coming back down. **And this machine is drawing it because
it's computing the ball's flight in real time.**

Now, here's what surprises people: **this is a computer with no chip, no code, and no
software.** It's from a world *before* the kind of computer you carry in your pocket. It's
called an **analog computer**."

### 2. Digital vs. Analog — the core idea (60 sec)
"Your phone is a **digital** computer. It solves problems by **counting** — billions of tiny
yes/no steps a second, ones and zeros. To draw this arc, it would chop the flight into
thousands of slices and calculate each one.

This machine is **analog**. It doesn't count anything. It uses **voltages — electricity —
to physically stand in for real quantities.** A voltage here *is* gravity. Another voltage
*is* the ball's speed. Another *is* its height. And instead of running a program, the
machine is **wired** so the electricity flows through exactly the same relationships the
real physics obeys. **It doesn't calculate the motion — it *becomes* the motion.**"

[Gesture to the patch cords.] "Those wires? That's the 'program.' Re‑plug the cords, and
you've changed the equation."

### 3. The physics, in three steps (75 sec)
[Use your hand to mime a ball going up and arcing down.]

"Let's build the flight the way the machine does. Only one thing acts on a thrown ball:
**gravity**, pulling down, steadily. So:

- **One:** gravity is a constant pull. In here, that's a **steady voltage**, set by this
  knob labeled **GRAVITY.** [Tap Pot #2.]
- **Two:** if you add up that downward pull over time, you get the ball's **speed.** It
  starts out fast going up, slows, stops at the top, then speeds up coming down. The block
  that 'adds up over time' is called an **integrator** — and this machine has four of them.
  [Point to amps 1–4.]
- **Three:** add up the *speed* over time and you get the ball's **height.** That takes a
  *second* integrator. Its output is the arc you see on the screen."

"So the recipe is: **gravity → integrate → speed → integrate → height → draw it.** Two
integrations. That's the entire machine."

### 4. Read the wiring like a sentence (60 sec)
[Hold up or point to the tan schematic handout.]

"This diagram is the equation drawn as a wiring plan, and the wires on the panel match it
exactly. Follow my finger:

- Start at the **GRAVITY knob** — that sets *how strong* gravity is.
- Into the **first integrator** — out comes **speed.**
- This other knob, **INITIAL VELOCITY**, sets *how hard we throw it* — it's the
  starting push loaded into that integrator. [Tap Pot #5.]
- Into the **second integrator** — out comes **height.**
- And height goes to the **scope**, which plots it against time. That's your arc."

[Optional, if comfortable:] "You'll notice a couple of extra amplifiers in the diagram
labeled 'invert.' Those don't do physics — they just **flip plus and minus signs** so
gravity pulls *down* and the throw goes *up.* Sign‑keeping is half the art of wiring one
of these."

### 5. The Payoff — make it live (90 sec)
"Here's the part that makes analog computing magical. This machine is **re‑flying the ball
dozens of times a second**, redrawing the arc every time. So I can reach in and change the
world **while the ball is in flight.**"

[Slowly turn the GRAVITY knob down.] "Watch the curve as I **weaken gravity**… the arc
**stretches out** — the ball sails farther and hangs longer. **That's what a throw looks
like on the Moon.**"

[Turn GRAVITY back up, past normal.] "Now **crank gravity up** — the arc **collapses**, the
ball drops fast. Heavy planet."

[Now turn the INITIAL VELOCITY knob up.] "And if I **throw it harder** — bigger arc, higher
flight."

[Pause. Let them watch it move.]

"Notice I never typed anything, never re‑ran a program, never waited. **The trajectory
changes the instant I turn the knob — smoothly, continuously — because the wiring *is* the
equation, and I just changed a number in it.**

[If showing the velocity trace — switch the scope to the straight descending line:]
"And here's a neat bonus. Switch the view and you see this **straight line falling through
zero.** That's the ball's **speed.** Where it crosses zero — [point] — the ball has stopped
rising. **That instant is the very top of the flight. The apogee.** After that, it falls."

### 6. The Close (30 sec)
"For about thirty years — through the Apollo program, aircraft design, missile guidance —
**this** is how engineers solved the hardest equations: not by counting, but by building a
little electrical model of the problem and watching it run.

Digital computers eventually won on precision and flexibility. But for *feeling* how a
system behaves — turning a knob and watching the whole answer breathe — nothing beats it.

**That's the charm of analog computing.**"

---

## Presenter notes & recovery lines

- **If the trace is flat / off‑screen:** the machine may be in **IC/HOLD** or a pot is at
  zero. Confirm **RO/Operate** mode and that GRAVITY and INIT VEL aren't fully down. See
  `04-OPERATOR-SETUP-CARD.md`.
- **If a kid asks "is it broken, where's the screen/keyboard?"** — "Great question — there
  isn't one. You program it with **wires**, and the answer comes out as a **picture** on the
  scope. The wires are the keyboard."
- **"Why does the readout say −0.588?"** — "The red number is a voltmeter you can point at
  any wire. It reads in *percent of full scale* — so −0.588 means about −59%. It's how the
  operator checks the numbers inside the equation."
- **"Could I build one?"** — "Absolutely — the heart of it is an op‑amp and a capacitor,
  parts you can buy for a few dollars. People still build these for fun." 
- **Keep hands slow on the knobs.** The magic is *watching* the curve morph; fast twists
  just look like noise.
- **Don't re‑patch cords during a tour** unless you're confident — the setup card has the
  exact map to restore it.

---

## The one line to never skip
> **"It doesn't calculate the motion — it *becomes* the motion. That's the charm of analog computing."**
