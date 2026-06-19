---
artifact: SGI Indigo² (Silicon Graphics)
status: draft v0.1
author: Nick DeMarco
last_updated: 2026-06-17
sources:
  - drafts/transcripts/SGI Inidigo 2 with Thomas Gilinsky.txt  (docent demo walkthrough)
  - SGI press release, June 9 1993 (sgistuff.net/funstuff/hollywood/jpark.html)
  - Industrial Light & Magic; Computer Graphics World "The Jurassic Age"; fxguide
  - Wikipedia: SGI Crimson, SGI Indigo, File System Navigator (fsn), Silicon Graphics
  - Exhibit assets: jurassic-unix-loop.mp4 (1:27 loop) + sgi-jurassic-park-card.html (display card)
display_status: ON FLOOR — confirm exact location and that the demo unit boots to IRIX
photo_status: NEEDED — photograph our actual Indigo² (front w/ logo, screen showing the Demos catalog, the cube logo on the case)
related: concurrent-3280-engineers.md (NJ mini lineage), spine/network/concurrent-sgi-alumni.md
---

# SGI Indigo² — "It's a UNIX System! I Know This!"

> The most famous computer in movie history is a Silicon Graphics machine — and this is its family. The SGI in front of you is the same kind of workstation that *appeared in* Jurassic Park **and** the same kind of workstation that *made* the dinosaurs. SGI starred on both sides of the camera. That's the hook; everything else hangs off it.

## What it is

The Indigo² (1993) is a Silicon Graphics workstation from the era when SGI was, for roughly a decade, **the only company on earth selling computers that could do real-time 3-D graphics at all.** That single capability is why these machines ended up everywhere that needed to *see* data move: Hollywood CGI, NASA scientific visualization, oil-and-gas, medical imaging, flight simulators, engineering CAD — and, famously, a movie about dinosaurs.

It runs **IRIX**, SGI's flavor of UNIX, and boots to a slick graphical desktop at a time when most PCs were still staring at a DOS `C:\>` prompt. Under the hood it's a MIPS RISC processor with dedicated graphics hardware — the architectural ancestor of the GPU in every phone and game console today.

This is the machine that made 3-D graphics a *product* instead of a research project.

## Why this machine matters — the meta angle (lead with this)

Two true things, and the magic is that they're the **same company**:

1. **SGI on screen.** In *Jurassic Park* (1993), when young Lex restores the park's door locks, she's flying through a glowing 3-D landscape of pedestals and wireframes and says the immortal line, *"It's a UNIX system — I know this!"* That interface is **real SGI software** (see below). The control-room hero machine in the film is an **SGI Crimson**; the whole control room was dressed with real Silicon Graphics workstations — the same Indigo²-era IRIX family as our machine.

2. **SGI behind the camera.** The dinosaurs that chase Lex through that room were built at **Industrial Light & Magic on roughly 70 Silicon Graphics workstations** — desktop Indigos up to the Onyx graphics supercomputer. When ILM staff were asked what they used, the answer was "everything SGI makes."

**The punchline to give visitors:** *the computer in the movie helped make the movie.* The same hardware was a prop in the story and the tool that created the story's groundbreaking visuals.

## The "It's a UNIX system" scene — the exhibit centerpiece

Next to this machine there's a screen playing a **1:27 looping clip** of the scene. Use it. Let a visitor watch ten seconds, then drop the reveal:

- **The myth:** for thirty years people mocked that scene as "fake Hollywood computer nonsense — no real system looks like that."
- **The truth:** it was **100% real software.** The 3-D file browser is **`fsn`** — "File System Navigator," pronounced *"fusion"* — an actual experimental tool Silicon Graphics shipped as a demo on IRIX. Directories were pedestals; files were boxes you could fly between. The height of each pedestal showed how much data was inside.
- **The honest caveat (have this ready):** the *software* was real, but the *use* of it was pure cinema. `fsn` was a viewer — you couldn't actually re-lock a building's doors with it. So: real tool, dramatized scene.

> **Docent honesty note — a sharp visitor will catch this:** the exact machine in the film's control room is an SGI **Crimson**, not an Indigo². If someone says "that's not the same model," you say: *"Exactly right — the movie's hero unit was a Crimson. Ours is an Indigo², the desktop machine from the same family, same year, same IRIX operating system, same `fsn` software. Same studio, same era, smaller box."* Owning that nuance makes you more credible, not less.

## Talking points by visitor type

Pick the angle that matches who's standing in front of you:

- **General visitor / kids** — "This is the computer from Jurassic Park. The thing the girl uses to lock the doors? Real program. And the dinosaurs in the movie were drawn on machines exactly like this one." (Almost everyone has seen the movie; this lands every time.)
- **The 'that scene was fake' skeptic** — walk them to the loop, then the `fsn` reveal above. This is the single most satisfying turn in the whole museum.
- **Software person** — "It runs IRIX — real UNIX — with a full graphical desktop in 1993. SGI's `fsn` was an early experiment in 3-D data visualization, decades before anybody else cared." Mention that SGI's OpenGL graphics standard, born here, is still in everything.
- **Hardware person** — "MIPS RISC plus dedicated graphics silicon. This architecture — CPU offloading geometry to a specialized graphics processor — is the direct ancestor of the GPU. Every game console and phone owes this machine a debt." SGI alumni later seeded NVIDIA and 3dfx.
- **Movie buff** — the CGI-vs-animatronics reveal: of ~15 minutes of on-screen dinosaurs, **most are Stan Winston's animatronics — only about 4–6 minutes are computer-generated** (~50 shots). That handful of minutes is what changed the industry forever. When stop-motion legend Phil Tippett saw ILM's digital test, he said *"I feel extinct"* — Spielberg put the line in the movie as Dr. Grant's.
- **NJ / local-history angle** — tie it to our own mini-computer story: SGI grew out of the same RISC-workstation wave that machines like the Interdata/Concurrent line (down the aisle) were part of. New Jersey was building real computers in this exact era. *(See the Concurrent 3280 entry.)*

## Operating the demo (from Thomas Gilinsky's docent walkthrough)

*Summary — full procedure and passwords live in the operational binder; verify on-site before relying on these.*

**Showing it off:**
1. When it's logged in, you get the IRIX graphical desktop. Look for the **Demos catalog** on screen.
   - *(The demo program's exact on-screen name needs verifying on-site — the docent video's audio transcribes it ambiguously. If you don't see it, open the **Toolchest** menu at top-left → **Find** / **Demos** to launch the demos catalog.)*
2. The catalog has tabs of programs grouped by type — "vaguely like Program Manager in Windows 3." There are roughly **30–50 demos** preloaded.
3. Double-click a demo to open it, just like Windows — the window resizes and you get **full real-time 3-D graphics.** That real-time interactivity is the whole point; a 1993 PC could not do this.
4. Crowd-pleaser demos: **Insect** (a CGI bug walking around) and a **music visualizer**. Pick something that *moves* — motion is what makes a jaw drop.
5. **To rotate a 3-D object, hold the MIDDLE mouse button** and drag. (SGI machines shipped with a real 3-button mouse — point that out; PC mice didn't have three buttons yet.)

**The teaching beat:** start a spinning 3-D demo, *then* say "this is 1993, while everyone else's computer is showing a blinking text cursor." The contrast does the work.

## What to do if it won't behave

- **No Demos catalog visible:** open the Toolchest (top-left of screen) and look under Find/Demos. Don't panic-reboot a UNIX box in front of a crowd.
- **A demo hangs or won't close:** leave it; start a different one. Note it in the repair tracking sheet afterward.
- **Won't boot / no graphical login:** stop, don't fight it — IRIX is a real multiuser UNIX and a hard power-cycle can corrupt the disk. Flag it in the repair tracker and fall back to the looping Jurassic Park clip on the side screen, which carries the story on its own.

## Common visitor questions

> **"Wait — that file-browser scene was *real*?"**
> Yes. The program is `fsn`, a genuine SGI demo tool for IRIX. People assumed it was fake because nothing else looked like it — but that's exactly because SGI was years ahead. The only fake part was using it to lock doors; it was really just a viewer.

> **"Is *this* the actual computer from the movie?"**
> Not this exact unit, and not this exact model — the film's control-room machine was an SGI Crimson. But ours is the same family, same year, same IRIX operating system, and runs the same software. Same studio of computers, smaller box.

> **"What's SGI / Silicon Graphics? I've never heard of them."**
> For about a decade they owned 3-D graphics — Hollywood, NASA, science, engineering all ran on these. They invented OpenGL, which is still used today, and their engineers went on to start companies like NVIDIA. They faded when cheap PC graphics cards caught up in the late '90s, and went bankrupt in 2009. This machine is from their peak.

> **"Why does a dinosaur movie matter to computer history?"**
> Because *Jurassic Park* (1993) is the moment computer graphics crossed into photorealism — the first time audiences believed a computer-generated creature was really there. It redirected the entire film industry from physical/optical effects to digital, and it was done on machines like this one.

## The four numbers (for the quick version)

- **~70** — SGI workstations in ILM's dinosaur pipeline
- **~$1 million** — SGI hardware loaned to the production (SGI was a real partner, not a coincidence)
- **~4–6 minutes** — of fully computer-generated dinosaur footage in the whole film (~50 shots); the rest is animatronics
- **1993** — the year CGI crossed into photorealism, on machines like this

## References & further reading

- SGI's own 1993 press release on the partnership: sgistuff.net/funstuff/hollywood/jpark.html
- File System Navigator (`fsn`): en.wikipedia.org/wiki/File_System_Visualizer · handwiki.org/wiki/Software:Fsn_(file_manager)
- ILM on making the dinosaurs: ilm.com/vfx/jurassic-park/ · fxguide "Welcome Back to Jurassic Park"
- "The Jurassic Age," Computer Graphics World (period production deep-dive)
- Our companion display card: `sgi-jurassic-park-card.html`; the looping scene: `jurassic-unix-loop.mp4`

## Accuracy caveats (do NOT overstate these on the floor)

- The **CGI runtime** (~4–6 min) genuinely varies by source (Business Insider says ~4; ILM/Wikipedia ~6). State it as a range. The "~15 min total dinosaur" figure is a long-circulating round estimate, not a primary document.
- **"fusion" pronunciation** of `fsn` is well-attested but comes from community/secondary sources, not a primary SGI doc. Fine to say; don't stake your life on it.
- Don't claim the dinosaurs were "rendered on SGI." SGI dominated *interactive* graphics (modeling/animation); final frames were rendered with **Pixar's RenderMan**. The SGIs are where the dinosaurs were *built and animated*.
- Don't claim our unit was *used in* the film. It wasn't — it's a representative of the same family.

## TODOs before publishing / next on-site visit

- [ ] Photograph our actual Indigo² (front with SGI cube logo, the screen mid-demo, the 3-button mouse)
- [ ] Verify the exact on-screen name of the demos catalog (the "iPhone catalog" in the transcript is a mis-hearing — likely "Demos catalog")
- [ ] Confirm IRIX login procedure + any guest password for the operational binder (get from Thomas Gilinsky)
- [ ] Confirm the looping-clip side screen is installed next to the unit; mount the display card nearby
- [ ] Decide section placement in the assembled manual (likely "Section 12 — Mini & Workstation Era," alongside MicroVAX II)
- [ ] Cross-check with Jeff/Doug whether the VCFed wiki already has an SGI entry to enhance vs. create
