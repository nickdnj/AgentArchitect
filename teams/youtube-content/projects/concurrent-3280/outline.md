# The Concurrent 3280 — Jersey's Last Great Pre-RISC Mini

**Status:** Outline v0.1, May 6, 2026
**Format:** Jersey Stack candidate (~10-15 min YouTube)
**Companion deliverable:** Museum-grade report for InfoAge VCF wiki

---

## Premise

Edison NJ, 1966. A handful of ex-Electronic Associates engineers found Interdata and start building 32-bit minicomputers. By 1988 — after acquisitions, a Perkin-Elmer era, and a corporate spinoff — that lineage culminates in the **Concurrent 3280**, a 76.8 MIPS, 12-CPU, $1.8 million machine built from Schottky TTL discrete logic in the dying days of the pre-RISC scalar mini. Nick is a co-op there during Christmas 1985, sharing an office with two of the engineers who designed it. The machine's architect, Ken Yeager, leaves Concurrent for SGI/MIPS and goes on to architect the R10000 — one of the landmark RISC processors of the 1990s. By 2017 Yeager is dead. By 2026 Nick is a docent at InfoAge, staring at one of the few surviving 3280s, with a chance to write its history before it disappears.

This is not just a computer. It's the **last gasp of an entire engineering culture** before everything went RISC, and a personal reckoning with the people Nick worked with at the start of his career.

---

## Five Beats

### Beat 1 — The Lineage (1966 → 1985)
- Edison NJ, 1966: Interdata founded by ex-Electronic Associates engineers
- 7/32 (1966) — pioneering 32-bit minicomputer
- 8/32 (1975) — refined for industrial / real-time
- 1973 — Perkin-Elmer acquires Interdata for $73M, renames it Perkin-Elmer Data Systems
- Nov 1985 — Perkin-Elmer spins off the data systems division as **Concurrent Computer Corporation**
- The 3280 is in development at the moment of the spinoff

### Beat 2 — The Machine (1986 → 1988)
- Designed under Perkin-Elmer's last days
- Released as Concurrent's first major machine
- **Jan 26, 1988** — 3280SP single-processor (6 MIPS)
- **Nov 29, 1988** — 3280E MPS, up to 12 processors (76.8 MIPS, 256 MB RAM, $1.8M)
- Schottky TTL discrete logic — anachronistic by 1988 but proven for real-time
- 4-stage scalar pipeline, 16 KB cache, 8K-word writable control store, integrated FPU, 8 register sets
- Two OSes: **OS/32** (Interdata-derived RTOS, the "real" Concurrent product) + **XELOS** (Unix V port)
- The pinnacle of the Interdata line

### Beat 3 — The People (1979 → 1990)
The four-board CPU design, what we know:
- **FETCH board:** Rich Chirumbolo (Nick's 1st-degree LinkedIn connection — https://www.linkedin.com/in/richjc/)
- **ALU board:** Brent Bush — "really cool guy," went to Cypress
- **Architect:** Ken Yeager — MIT '72, came over to Concurrent in 1979, the brain
- **Senior cross-team:** Rocco Brescia — consulted across boards
- **Loaned:** Ron Smith — "amazing engineer"
- **Built it:** Mike Martone — the technician, "really instrumental"
- Two other boards (likely DECODE and WRITE-BACK) — owners not yet recovered
- **Nick the co-op** — shared an office with Cholumbolo and Brescia, took photos in the lab Christmas 1985

### Beat 4 — The Legacy (1991 → 2017)
- Yeager leaves Concurrent for SGI/MIPS in the early '90s
- Architects the **R10000** — one of the landmark RISC processors of the 1990s, 4-issue out-of-order superscalar, the textbook example
- Marty Deneroff is at SGI 1991-2003 as VP of Server & Microprocessor Engineering — Yeager would have been on his team
- Concurrent itself pivots to streaming/media, eventually acquired in 2017
- Cholumbolo and Bush both go to Cypress Semiconductor — a small Concurrent → Cypress alumni cluster
- **Ken Yeager dies August 2017** — the architect is gone before this story gets told
- The 3280's IP and patents (S-Bus, etc.) live on in MIPS

### Beat 5 — The Personal Frame (2026)
- Nick volunteers as docent at InfoAge / VCF Computer Museum, Wall NJ
- One of the few surviving 3280s sits in the museum
- Most of the team has no public web footprint anymore
- Mike Martone is the only one alive, reachable, and **actively keeping the 3280 alive** in the ex-Concurrent Facebook group
- Nick has photos from the lab. Nick has memory. Nick has Mike Martone as a bridge.
- This is a "write the history before it disappears" moment.

---

## Visual / Storyboard Anchors (rough)

- Vintage Interdata 7/32 marketing photos (1966 NJ)
- 8/32 in industrial applications (oil rigs, missile defense)
- Perkin-Elmer corporate-era photos / logo evolution
- Nick's Christmas 1985 lab photos — *the artifact*. These are the rarest content in the entire video.
- Tech Monitor Jan/Nov 1988 announcement headlines
- Schottky TTL board macro shots (modern reshoots of the InfoAge 3280?)
- Ken Yeager portrait + R10000 die shot
- The Cypress Semiconductor era for Cholumbolo and Bush
- InfoAge present-day footage of the 3280
- Mike Martone on the Facebook group sharing memories
- Closing: Nick (or Nick's hands) on the actual 3280 cabinet

## Tone Anchors
- Jersey Stack signature — direct, technical-but-personal, NJ-pride undercurrent
- Avoid sentimentality on Yeager's death — state it factually, let the silence carry
- Lean into the Christmas 1985 lab photos as the emotional centerpiece
- The R10000 connection is the "and then what happened" payoff — earn it

## Open Production Questions
- Length target — 10 min tight, 15 min if Mike Martone interview lands
- Interview Mike Martone over Zoom? — that's the unlock for ~3-4 min of primary-source video
- Animate the four-board pipeline? — adds production cost, but is a teaching moment
- Episode 2 of Jersey Stack vs standalone? — ties to ep 1 "The Transistor" thematically (NJ semiconductor heritage)
