---
artifact: MicroVAX II
status: draft v0.1
author: Nick DeMarco
last_updated: 2026-04-24
sources:
  - files/Docent Shared Resources/Artifacts/MicroVax II/Startup, shtudown and operating instructions.docx
  - Wikipedia: VAX, MicroVAX, OpenVMS
  - HECnet — global hobbyist DECnet VPN
display_status: TBD — verify on-site whether this is on the floor or in the warehouse
photo_status: NEEDED — no photo of our specific unit exists in the Drive folder; reshoot front, rear, and the Andy Goldstein note taped inside the rear cover
---

# MicroVAX II

> A small DEC machine with an outsized story: this one was *internal DEC property*, used by the VMS development team, and lived in DEC's own internal museum before that museum was dismantled.

## What it is

The MicroVAX II is a desktop-pedestal VAX from 1985. It's the machine that put a real 32-bit VAX on a single board (the KA630 CPU) and made VMS — DEC's flagship operating system — affordable for individual engineers and small workgroups. Where the original VAX-11/780 was a refrigerator-sized minicomputer, the MicroVAX II fits beside a desk and runs essentially the same software.

It uses the Q-Bus, the same I/O bus as the PDP-11, which made it cheap to build and easy to populate with peripherals from DEC's existing catalog. A typical MicroVAX II had 1–16 MB of RAM, an MFM hard disk, an RX50 dual floppy, and a TK50 cartridge tape — and ran VMS, Ultrix, or BSD.

It was DEC's commercial answer to the workstation wave from Sun and Apollo, and it sold by the tens of thousands. Many engineering shops in New Jersey ran their CAD, EDA, and software builds on a roomful of these.

## Why our unit matters

What sits in the museum is not a generic MicroVAX II. According to the donor's note (Brian Schenkenberger), this specific machine was **internal DEC property**, one of the systems used by the **VMS development group** — the group that wrote the operating system itself. It was originally under the care of **Andy Goldstein**, a long-tenured VMS engineer well known in the DEC and OpenVMS community. There is a note taped inside the rear cover that documents that provenance.

When DEC dismantled its **internal corporate museum**, the machine survived because Brian rescued it. So this is, in a small way, a piece of DEC's own historical memory.

## Talking points for visitors

Pick the angle that matches the visitor:

- **General visitor** — "This is a real desktop computer from 1985 that ran the same operating system as the room-sized minicomputers next to it. It cost about as much as a new car." (A loaded MicroVAX II was ~$15K–$30K in 1985.)
- **Software person** — "VMS — the OS this machine runs — is the direct ancestor of Windows NT. Dave Cutler led VMS development at DEC, then went to Microsoft and led NT." Worth pointing out that VMS is still alive today as OpenVMS, now run by VMS Software Inc.
- **Hardware person** — "Single-chip 32-bit VAX. Same Q-Bus as a PDP-11 — pull the cover and you'll see the same connector spec." A MicroVAX II CPU is the **MicroVAX 78032 (KA630)**, ~120,000 transistors, ~1 VUP (one VAX unit of performance, the standard benchmark of the era).
- **DEC nostalgia** — point to the Andy Goldstein note. Mention the internal DEC museum. Mention HECnet (below).
- **Network kids** — DECnet was the protocol DEC machines spoke to each other before TCP/IP took over. There's a global hobbyist VPN called **HECnet** that links real and emulated DEC machines worldwide. When properly configured, this MicroVAX II can join HECnet and talk to other VAXen and PDPs around the world.

## Operational notes (summary — full procedure in operational binder)

**Starting up:**
1. Power on. Wait for power-on diagnostics. You'll get a `>>>` prompt on the console.
2. Type `b dua0` and press return. ("DU" = device class, "A" = first controller, "0" = first unit.)
3. VMS boots, asks for the date and time. Enter both.
4. Wait for `SYSTEM job terminated at [date/time]`, then press return for the login prompt.

**Logging in:**
- System account: username `system`, password `vcfmavms`
- Guest account: username `guest`, password `guest`
- To log out: type `logout` (or `lo`).

**Shutting down:** *Don't just power it off — VMS is a real multiuser OS.*
1. Log in as `system`.
2. Type `@sys$system:shutdown`.
3. Press return seven times to accept defaults.
4. Wait for `SYSTEM SHUTDOWN COMPLETE`.
5. Power off.

**What's installed:** VMS v4.7 (intentionally — the last release before VMS 5.0 slowed everything down on this class of hardware). Languages: BASIC, COBOL, FORTRAN, PASCAL, C, plus MMS (DEC's `make` equivalent).

**Console terminal options:** A DEC VT180 "Robin" can be used as both a CP/M machine *and* a VT100 terminal for the MicroVAX, switching modes via an on-boot menu — no cable swap needed. Useful trivia for visitors who recognize the VT100 family.

## What to do if it won't boot

- `>>>` prompt with no response: try `b dua0` again. If `dua0` is missing, try `b dua1` or check the disk.
- Hangs after VMS banner: hit return — it's probably waiting on date/time.
- Login fails: passwords above are correct; check caps lock.
- Anything weirder: stop, don't fight it, leave a note in the repair tracking sheet. *There is a clean snapshot backup of the boot disk on file with Brian.*

## Common visitor questions

> **"What's a VAX?"**
> Virtual Address eXtension — DEC's flagship 32-bit minicomputer line, 1977–2005. The first VAX (11/780) was a milestone because it could address 4 GB of virtual memory at a time when most computers couldn't address 64 KB.

> **"Is VMS still used?"**
> Yes. As OpenVMS. Stock exchanges, hospitals, and railroads ran (and some still run) on it because of its uptime — 17-year uptime records exist. It's now maintained by VMS Software Inc., ported to x86-64.

> **"Why does it matter?"**
> Three reasons: (1) it democratized 32-bit computing by getting it onto a desk; (2) the team that built its OS later built Windows NT, so you've used VMS's grandchild; (3) this specific machine was inside DEC, used by the people who wrote VMS — a small piece of DEC's own history.

## References & further reading

- VMS Software Inc.: https://vmssoftware.com/
- OpenVMS Wiki — KA630 / MicroVAX II details
- HECnet hobbyist DECnet VPN: https://hecnet.eu/
- Andy Goldstein — search OpenVMS engineering interviews; mentioned in DEC oral history archives at Computer History Museum
- "Showstopper!" by G. Pascal Zachary — the story of Dave Cutler taking VMS lessons to Microsoft for NT

## TODOs before publishing

- [ ] Photograph our specific unit (front, rear with Andy Goldstein note, console screen during boot, the BA23 enclosure interior if accessible)
- [ ] Confirm VMS v4.7 is still what's installed (instructions doc may be stale)
- [ ] Verify HECnet bridge status — is it actually running on the museum network or aspirational?
- [ ] Confirm with Brian Schenkenberger: any additional history on the Andy Goldstein note? Is there a copy of the original DEC museum tag?
- [ ] Cross-reference repair tracking — any open issues on this unit?
- [ ] Decide which Section number this gets in the assembled manual (likely "Section 12 — Mini & Workstation Era")
