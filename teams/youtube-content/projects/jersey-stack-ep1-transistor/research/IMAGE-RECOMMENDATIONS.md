# Scene 7 & 8 Image Research — Recommendations

**Date:** 2026-04-29
**Episode:** Jersey Stack Ep 1 "The Transistor"
**Need:** PD-licensed photos of AT&T/Bell System operators at tube-era switchboards (Scene 7) and Bell System vacuum-tube telephone amplifier racks (Scene 8).

Detailed research files:
- `research/scene-07-att-operators.md`
- `research/scene-08-telephone-tubes.md`

Staged candidates: `research/candidates/`

---

## Scene 7 — AT&T Operator (Ch 2, ~2:30–3:15)

Storyboard slot: dissolve from AT&T → Western Electric → Bell Labs flow diagram, into a 1940s switchboard operator photo, into Mervin Kelly portrait. ~3 seconds on screen, slow Ken Burns.

### TOP PICK — `scene-07-bell-system-switchboard-1943.jpg`
- **Source:** NARA RG 86 (Women's Bureau), via Wikimedia Commons / U.S. National Archives Flickr
- **Title:** "Photograph of Women Working at a Bell System Telephone Switchboard"
- **Date:** December 22, 1943
- **Resolution:** 2930×2400 (1MB JPG)
- **License:** Public Domain (U.S. Federal Government work)
- **Visual:** Hero shot — long row of women at a Bell System international switchboard, "NORTH AND SOUTH AMERICA" header visible, Argentina/Bahamas/Bermuda/Brazil/Canada placards, dozens of cord pairs, perfect period authenticity. Strong leading-line composition for Ken Burns.
- **Why it wins:** Only candidate explicitly labeled "Bell System" in the federal record. Period-perfect (1943), unambiguous PD, hero composition, exceeds 2000px floor.
- **Direct URL:** https://upload.wikimedia.org/wikipedia/commons/8/8e/Photograph_of_Women_Working_at_a_Bell_System_Telephone_Switchboard_%283660047829%29.jpg

### BACKUP — `scene-07-seattle-citylight-1945.jpg`
- **Source:** Seattle Municipal Archives via Wikimedia Commons
- **Date:** February 5, 1945
- **Resolution:** 3101×2400
- **License:** CC BY 2.0 — requires credit in YouTube description
- **Visual:** Two operators at a smaller cord switchboard, intimate composition.
- **Caveat:** Not Bell System — Seattle City Light internal exchange. Visually indistinguishable from any 1940s telephone exchange, but if anyone scrutinizes the credit, it's a municipal utility, not AT&T.
- **Use case:** Cutaway insert if you want a tighter human moment alongside the wide hero.

### NOT YET STAGED — Esther Bubley (LOC FSA-OWI, June 1943)
- **Source:** Library of Congress
- **Title:** "Washington, D.C. Telephone operators at the telegraph office"
- **License:** PD (FSA-OWI federal commission)
- **Item page:** https://www.loc.gov/item/2017857433
- **Why look:** Bubley was one of the FSA's best documentary photographers — cinematic depth, candid quality. TIFF master available from item page (likely 4000+ px).
- **Action:** Browse the LOC page manually if you want a more cinematic alternative; download the highest TIFF.

---

## Scene 8 — Vacuum Tube Telephone Amplifier (Ch 3, ~3:15–3:40)

Storyboard slot: archival rack photo + macro tube close-up. Currently filled by AI-generated `scene-08.png` (tube wall) and ENIAC photos that are off-context (ENIAC is a computer, not a telephone repeater).

### TOP PICK — WIDE RACK SHOT — `scene-08-early-audion-repeaters-1919.jpg`
- **Source:** Wikimedia Commons (1919 Bell System publication)
- **Title:** "Early Audion telephone repeaters" — Princeton, NJ repeater station
- **Date:** ca. 1919
- **Resolution:** 968×740 — **BELOW 2000px target**
- **License:** Public Domain (pre-1928 US publication)
- **Visual:** Authentic Bell System Audion repeater rack — rows of mounted amplifier units, exactly the visual the narration describes.
- **Caveat:** Resolution limits this to short cutaway use or partial crop. Will show grain at full 1080p.
- **Recommendation:** Stage as B-roll insert. Use AI-generated `scene-08.png` (the existing tube-wall image) as the dominant visual; use this as a 1.5-2 second authenticity cut.

### BEST POSSIBLE WIDE SHOT — REQUIRES MANUAL ACTION
- **Source:** Bell Laboratories Record, February 1949 (worldradiohistory.com PDF)
- **Caption:** "ten V3 amplifier units as mounted on a relay rack"
- **License:** Almost certainly PD (Bell Labs Record pre-1964, no renewal evidence)
- **Visual:** Exactly the hero shot the script describes — relay rack of V3 carrier amplifiers, hundreds of tubes.
- **URL:** https://www.worldradiohistory.com/Archive-Bell-Laboratories-Record/40s/Bell-Laboratories-Record-1949-02.pdf
- **Why not staged:** worldradiohistory.com 403s automated downloads. Open the PDF in your browser, find the V3 amplifier plate, screenshot or extract.
- **Action:** Worth 5 min of your time — this is the actual photo the script was written for.

### TOP PICK — TUBE CLOSE-UP — `scene-08-we-vt1-triode.jpg`
- **Source:** National Electronics Museum, via Wikimedia Commons
- **Title:** "VT-1 Detector-Amplifier Triode, Western Electric, c. 1917"
- **Resolution:** 2287×4071 (4MB)
- **License:** CC0 — public domain dedication, no attribution required
- **Visual:** Clean museum photo of an authentic Western Electric tube — visible filament structure, brass base, glass envelope. Vertical orientation works well for portrait insert or rotated/cropped horizontal.
- **Why it wins:** Authentic Western Electric (the AT&T manufacturing arm), correct era (1917 design, used through the 1940s), clean lighting, exceeds resolution target, zero rights friction.

### BACKUP — TUBE CLOSE-UP — Smithsonian NMAH Western Electric 205D
- **Source:** Smithsonian National Museum of American History
- **Object:** Western Electric 205D tube — explicitly a telephone carrier amplifier tube
- **URL:** https://americanhistory.si.edu/collections/object/nmah_892003
- **License:** Likely CC0 under Smithsonian Open Access — verify badge on object page before downloading
- **Why look:** The 205D is *literally* the carrier-amplifier tube the script is talking about (vs. VT-1 which is a more general triode). If CC0, this is the more accurate pick.
- **Action:** Open the link, confirm CC0 badge, download highest-res master.

---

## Recommendation Summary

| Scene | Slot | Primary Pick | Status |
|-------|------|--------------|--------|
| 7 | Switchboard operator | NARA Bell System 1943 | ✅ Staged |
| 8 | Wide tube rack | 1919 Audion repeaters (low-res cutaway) + 1949 V3 from BSTJ | ⚠️ Partial — manual PDF extract recommended |
| 8 | Tube close-up | WE VT-1 Triode (Wikimedia, CC0) | ✅ Staged |

**Decisions needed from Nick:**
1. Approve NARA Bell System 1943 for Scene 7 hero, or do you want me to also pull the LOC Bubley TIFF?
2. Want me to take 5 min and pull the Bell Labs Record Feb 1949 V3 amplifier image manually via browser? It's the strongest possible match for the Scene 8 hero rack shot.
3. Verify Smithsonian 205D CC0 status, or is the WE VT-1 close-up sufficient?

Once you decide, I'll move the chosen files into `assets/images/` with the standard `scene-07-*.jpg` / `scene-08-*.jpg` naming and re-attach to the storyboard via the multi-tenant server.
