# Concurrent Computer 3280 — Research Report
*Compiled for InfoAge / VCF Museum wiki contribution — May 6, 2026*

---

## Part 1 — The Machine: Architecture, History, Lineage, Specs

### Lineage

The 3280 sits at the end of a clean evolutionary chain:

1. **Interdata 7/32 (1972)** — First 32-bit minicomputer, proprietary ISA. Interdata was founded 1966 in Oceanport, NJ.
2. **Interdata 8/32 (March 1975)** — Acquired by Perkin-Elmer in 1973; 8/32 added writable control store, FPU, interleaved memory, 300 ns effective cycle time.
3. **Perkin-Elmer 3200 series (late 1970s–mid 1980s)** — Direct 8/32 descendants. Based on AMD Am2900 bit-slice chipset; 8 register sets. Models 3210, 3230, 3240 documented at Bitsavers.
4. **Concurrent Computer 3280 MPS (1986–1988)** — The 3200 series successor. Concurrent Computer Corporation spun out of Perkin-Elmer's Data Systems Group in November 1985. Design began under Perkin-Elmer, released as Concurrent. Single-processor 3280SP announced January 26, 1988; multiprocessor 3280E MPS announced November 29, 1988.
5. **Concurrent 8000 Series (early 1990s)** — Broke from proprietary ISA; used MIPS R3000. Distinct product line.

The 3280 is the last and most powerful member of the original Interdata-descended proprietary architecture before Concurrent pivoted to MIPS.

### Architecture Overview

The 3280 uses a **four-stage scalar pipeline** executing one instruction every 400 ns (for a base throughput of ~2.5 MIPS scalar; single-processor announced at 6+ MIPS with the full implementation). Nick recalls **FETCH** and **ALU** as two of the four boards. A standard four-stage pipeline of this era would be: **FETCH → DECODE → EXECUTE (ALU) → WRITE-BACK**. The four physical boards in the CPU chassis likely mapped to these stages, with FETCH and ALU being the most distinctive. Confirmation of the exact board names (the DECODE and WRITE-BACK equivalents) is a question worth asking Ken Yeager or Mike Martone directly.

Key architectural specs:
- **ISA**: Proprietary, Interdata 8/32-compatible instruction set (not MIPS, not 370 — though shares IBM 370 heritage via Interdata lineage)
- **Logic technology**: Schottky TTL, MSI and LSI (discrete, not a single-chip design — unusual by late 1980s standards)
- **Registers**: 8 sets of 16 general-purpose 32-bit registers; 8 × 32-bit FP registers; 8 × 64-bit FP registers
- **Cache**: 16 KB, 45 ns per processor
- **Writable control store**: 8K words per processor
- **Integrated FPU**: Yes, per processor
- **Full 32-bit address space**: Yes
- **OS support**: Concurrent's **OS/32** (real-time RTOS) and **XELOS** (Unix V variant)
- **Pipeline depth**: 4 stages, 400 ns per stage
- **Bus**: Synchronous S-Bus at 10 MHz (two independent 32-bit data paths: F-PATH and T-PATH); later 3280E added 256 Mbps ECL memory bus

### Multiprocessor Configuration (3280E MPS)

- Min: 2 processors (1 CPU + 1 APU)
- Max: 12 processors (3280E variant)
- Aggregate performance: 12–76.8 MIPS across full 12-processor config
- Memory: up to 256 MB
- I/O: up to 120 MB/s total via DMA channels
- Price range: $360K (2-proc, 16 MB) to $1.8M (256 MB, max config)

### Single-Processor (3280SP) — January 26, 1988 Announcement

- Performance: 6+ MIPS (6.4 MIPS)
- Memory: 8 MB standard, 32 MB max
- Storage: up to 1 GB disk
- DMA: 10 MB/s
- Price: £200,000 (UK announcement)
- OS: OS/32 and Unix V

### Release / Provenance

Designed starting approximately 1982–1986 under Perkin-Elmer, completed and released as **Concurrent Computer Corporation** (spun off November 1985). The machine carries both identities in its history — "Perkin-Elmer" appears in early datasheets, "Concurrent" on the product announcement. Bitsavers and Tech Monitor both document it under Concurrent.

### Market / Intended Use

Real-time and embedded computing, scientific/industrial multiprocessing, military (DoD real-time contracts), and general supermini markets. OS/32 is a real-time interrupt-driven RTOS; XELOS provided Unix compatibility for commercial customers.

### Surviving Units

- **InfoAge Science Center (Wall, NJ)** — at least one confirmed unit; this is the VCF-affiliated museum where Nick is volunteering.
- **Rhode Island Computer Museum** — holds a Perkin-Elmer 3210 and 3230; no confirmed 3280 documented online but likely has related 3200-series units.
- No other confirmed surviving 3280 units found in public collection databases. The Facebook alumni group (see Part 3) is the best current lead for private-hands units.

### Patents

One confirmed patent mapped to the 3280:

- **DE3722458A1** — "Computer-Bus" (S-Bus for the 3280MPS). Inventor: **Kenneth C. Yeager**. Assignee: Concurrent Computer Corp. (original: Perkin-Elmer Corp.). Priority: July 7, 1986. Filing: July 7, 1987. Covers the dual-path synchronous bus architecture (F-PATH + T-PATH) connecting CPUs, memory, and I/O in the 3280MPS.

Yeager's obituary confirms he held **4 sole patents and 10 team patents** during his SGI/MIPS years (1990–2003); Concurrent-era patents likely exist under Perkin-Elmer assignment and may not all surface under a Concurrent search. A USPTO full-text search for "Yeager" + assignee "Perkin-Elmer" in the 1984–1988 window would likely surface additional 3280-related patents. The specific engineers on the ALU and fetch boards (Bush, Cholumbolo) may also appear as co-inventors.

---

## Part 2 — Six Engineers

### 1. Kenneth C. Yeager — Architect of the 3280

**Status: Deceased (August 10, 2017)**

**Confirmed career arc:**
- MIT B.S. 1972 (dual EE + ME), MIT staff engineer 1972–1977
- Xitan Inc., Princeton, NJ, 1977–1979 (S-100 memory/peripheral boards)
- **Concurrent Computer Corp. / Perkin-Elmer, Tinton Falls, NJ, 1979–1990** — micro-architect and principal designer of the 3280MPS Superminicomputer; taught in-house logic and computer design courses
- Silicon Graphics / MIPS Computer Systems, Sunnyvale, CA, 1990–2003 — principal engineer, micro-architect of the **MIPS R10000, R12000, R18000** (the R10000 paper is published and available at cs.nju.edu.cn); 4 sole + 10 team patents
- Cray Inc., 2003 (vector processor architecture)
- Broadcom Inc., Santa Clara, 2004–2016 — senior technical director, MIPS/ARM embedded processor architect
- Huawei, Santa Clara, 2016–2017

**Publications:** "The MIPS R10000 Superscalar Microprocessor" (IEEE Micro, 1996) — available as PDF. This is Yeager's most-cited technical work.

**Contact path:** Ken Yeager is deceased. His ACM author page (profile/81100252388) is his lasting academic footprint. For the wiki, cite his ACM profile and the R10000 paper. Former colleagues at SGI and Broadcom who worked under him are potential living sources (e.g., other MIPS architects from the 1990 intake cohort). The obituary appeared in the Jacksonville (IL) Journal-Courier (Legacy.com, obit ID 17922839).

**Outreach hook (for wiki attribution):** His surviving family, or his former SGI colleagues who contributed to his memorial, may be reachable. The ACM Digital Library profile is the cleanest authoritative citation.

---

### 2. Rich Cholumbolo — FETCH Board

**Status: Not found in public records under any spelling variant tested.**

**What is known:** Nick recalls the surname as Cholumbolo (Italian-American), with likely variants: Ciumbolo, Cilumbo, Cholumbo, Colombo, Columbo. After Concurrent, went to Cypress Semiconductor; later started a garage door installation business.

**Patent search results:** No patents found under any of the tested spellings in the Concurrent Computer or Perkin-Elmer assignee pool via web-accessible searches. USPTO direct search (full-text at patents.google.com with Perkin-Elmer assignee) is the next step.

**LinkedIn:** No confirmed match found. Cypress Semiconductor had ~1,500 engineers in its late-1980s/1990s growth phase; without a first name confirmation this is a needle-in-haystack search.

**Best path forward:** Ask Mike Martone in the Facebook group (Part 3) — Martone is active and posts 3280 content; he is far more likely to know Rich's current contact info or correct surname spelling than any web search.

---

### 3. Rocco Brescia — Senior Engineer

**Status: Not found in public records.**

**What is known:** Italian-American surname. Senior engineer on the 3280, possibly in a cross-board or consulting capacity. Specific board ownership unknown.

**Patent search results:** No results under "Rocco Brescia" in any combination with Concurrent Computer, Perkin-Elmer, or 3280.

**Best path forward:** Same as Cholumbolo — Mike Martone via Facebook is the highest-probability lead. Alternatively, the Facebook group itself may have posts where Brescia is tagged or mentioned.

---

### 4. Brent Bush — ALU Board

**Status: Not found in public records.**

**What is known:** Worked on the 3280 ALU board. After Concurrent, moved to Cypress Semiconductor (same destination as Cholumbolo, suggesting a group of Concurrent engineers moved there together circa 1990). Status after Cypress unknown.

**Patent search results:** No results found for "Brent Bush" in connection with Concurrent, Perkin-Elmer, or Cypress in web-accessible patent searches. If he is a co-inventor on any Cypress CPU/ALU patents from the early 1990s, those would confirm his career trajectory. A direct Google Patents search for inventor "Brent Bush" with assignee "Cypress Semiconductor" would be the follow-up action.

**Best path forward:** Google Patents direct search + Mike Martone via Facebook.

---

### 5. Ron Smith — "On Loan" Engineer

**Status: Not found — name too common for disambiguation without additional identifiers.**

**What is known:** Was "on loan" to the 3280 team — possibly from another Perkin-Elmer division, a contractor, or a partner company. The "on loan" description suggests he may not appear in Concurrent's formal employee records.

**Patent search results:** "Ron Smith" returns thousands of results; without a middle initial or specific technical domain, no disambiguation is possible from web search.

**Best path forward:** This is the hardest engineer to track without inside information. The Facebook alumni group is again the best lead — if Ron Smith was well-known on the team, other alumni will know who he is. A post asking "does anyone remember the engineer who was on loan to the 3280 team?" in the group would be effective.

---

### 6. Mike Martone — Technician

**Status: Active and reachable via Facebook alumni group.**

**What is known:** Technician described by Nick as "really instrumental" to the 3280. Actively posts 3280 content to the Concurrent Computer Corp alumni Facebook group.

**LinkedIn:** There are several Mike Martone profiles on LinkedIn (Technical Supervisor at LJT and Associates; Principal Software Dev Engineer at Parsons; others). None are definitively connected to Concurrent Computer from available public data, but the active Facebook presence is the confirmed channel.

**Contact path:** **Facebook group: "Concurrent Computer Corp Employees Past and Present"** (facebook.com/groups/316610718571) — he is an active member posting 3280 content. This is the most direct and warmest contact channel of all six engineers.

**Outreach hook:** "Mike, I'm Nick DeMarco — I was a co-op at Concurrent in the late 1980s and worked alongside the 3280 team. I'm writing the InfoAge/VCF museum wiki entry on the 3280 and want to make sure the team gets proper attribution. Can we connect?"

---

## Part 3 — The Ex-Concurrent Facebook Group

**Group name:** Concurrent Computer Corp Employees Past and Present
**URL:** [https://www.facebook.com/groups/316610718571/](https://www.facebook.com/groups/316610718571/)
**Type:** Facebook Group (appears to be a closed/private group requiring membership approval; posts are visible via direct links but browsing requires membership)
**Activity:** Active — posts visible as recently as 2023–2024 based on indexed URLs, including a 2012 reunion post and memory-sharing threads
**Content visible from indexed posts:** Members share equipment photos, career reminisences, reunion coordination, and hardware-specific content. One indexed post is specifically about "sharing memories of Concurrent Computer Corp." The 3280 hardware content Mike Martone shares likely falls into the equipment-photo category common to these groups.
**Mike Martone:** Active member posting 3280 content; his Facebook profile is not public-indexable from web search but he is findable within the group.
**Companion Facebook Page:** A separate Facebook Page also exists at facebook.com/concurrent-computer-corporation-363950103720540 (a public informational page, distinct from the alumni group).

---

## Part 4 — Recommended First Contacts

### Contact #1: Mike Martone (via Facebook group) — HIGHEST PRIORITY

Mike is alive, active in the community, already posting 3280 content, and is the most likely person to know where the other five engineers are now. A single message to him could unlock contact info for Cholumbolo, Brescia, Bush, and Smith that no web search will find. Join the group first (request membership), then message him directly with Nick's co-op background as the icebreaker. He is also the best source for the four board names (FETCH, ALU, + 2 others) from firsthand technician-level knowledge.

### Contact #2: Facebook Group Post (general appeal) — SECOND PRIORITY

After joining, post a brief "I'm writing the InfoAge wiki entry on the 3280 — can anyone help me with team attribution?" message to the group. This surfaces people who don't know Nick personally but may respond to the museum/wiki mission. The Concurrent alumni community has a clear interest in preserving this history — the wiki is a compelling ask.

Ken Yeager is the most technically authoritative source on the architecture, but he passed away in 2017. His published R10000 paper and ACM profile are the citation anchors for the wiki's architect credit. Everything needed to attribute him authoritatively is already in the public record.

---

## Sources

- [Concurrent Computer Corporation (NPAC survey)](http://www.new-npac.org/projects/cdroms/cewes-1999-06-vol1/nhse/hpccsurvey/orgs/concurrent/concurrent.html) — 3280E MPS specs, register sets, ECL bus
- [Tech Monitor: "Concurrent Introduces 6 MIPS Single Processor 3280"](https://www.techmonitor.ai/technology/concurrent_introduces_6_mips_single_processor_3280/) — Jan 26, 1988 announcement, SP specs
- [Tech Monitor: "New High-Speed ECL Bus for Concurrent's 3280 MPS Supermini"](https://techmonitor.ai/technology/new_high_speed_ecl_bus_for_concurrents_3280_mps_supermini) — Nov 29, 1988 ECL announcement, multiprocessor config + pricing
- [Interdata 7/32 and 8/32 — Wikipedia](https://en.wikipedia.org/wiki/Interdata_7/32_and_8/32) — Lineage from Interdata through Perkin-Elmer
- [Concurrent Computer Corporation — Wikipedia](https://en.wikipedia.org/wiki/Concurrent_Computer_Corporation) — Corporate history, 3200 series context
- [Kenneth Yeager Obituary — Legacy.com](https://www.legacy.com/us/obituaries/myjournalcourier/name/kenneth-yeager-obituary?id=17922839) — Full career arc, MIT credentials, Concurrent tenure 1979–1990
- [Kenneth C. Yeager — ACM Digital Library](https://dl.acm.org/profile/81100252388) — Academic profile
- ["The MIPS R10000 Superscalar Microprocessor" — Yeager, 1996 (PDF)](https://cs.nju.edu.cn/swang/CA_16S/R10k.pdf) — Yeager's landmark published paper
- [DE3722458A1 — Computer-Bus Patent, Google Patents](https://patents.google.com/patent/DE3722458A1/en) — Yeager inventor, Concurrent/Perkin-Elmer assignee, 3280MPS S-Bus, priority July 7, 1986
- [Concurrent Computer Corp Employees Past and Present — Facebook Group](https://www.facebook.com/groups/316610718571/) — Alumni group, Mike Martone active member
- [Perkin-Elmer 3210 — Rhode Island Computer Museum](https://www.ricomputermuseum.org/collections-gallery/equipment/perkin-elmer-3210) — 3200-series surviving units
- [GitHub: modula-3200 (Perkin-Elmer 3200 XELOS compiler)](https://github.com/afborchert/modula-3200) — XELOS OS context
- [SGI Chief Engineers HPC article — HPCwire, 2003](https://www.hpcwire.com/2003/04/18/sgi-chief-engineers-drive-future-hpc-innovation/) — Yeager at SGI
