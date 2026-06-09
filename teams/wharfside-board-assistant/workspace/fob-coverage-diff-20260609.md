# Fob Coverage Diff — ECI Keys List vs eMerge

**Date:** 2026-06-09
**Sources:**
- ECI/Kathy list: `wharfside keys_detail-20260608.pdf` (emailed Jun 8) — **207 fobs**
- eMerge export: `~/Downloads/export_20260608153920.csv` (Jun 8, 3:39 PM) — **246 cards**

## Normalization applied
- eMerge stores **bare Card Number + Card Format**; ECI list stores the **full number with facility-code prefix**.
- Mapping: full number = format prefix + zero-padded card number
  - `75-mircom` → `075…`  · `95-mircom` → `095…`  · `118-mircom` → `118…`  · `121-mircon` → `121…`
  - `254-59x` → bare `59xxx` numbers (no concatenated prefix) — these are the "starts with 59" cards
- Both sides reduced to a canonical 8-digit form (handles the dropped-leading-zero case `075`↔`75`, `095`↔`95`).

## Headline
- **197 fobs match cleanly** across both systems.
- **10 fobs** are in ECI's list but **not active in eMerge** (access-risk / stale-record side).
- **47 fobs** are **active in eMerge but not on ECI's list** (eMerge is ahead — mostly recent adds, vendors, spares).

---

## A) In ECI list, NOT active in eMerge (10) — verify these

| ECI fob # | ECI name | eMerge status | Read |
|---|---|---|---|
| 11834971 | Jordan, Tom | Active as **11804971** (card `4971`, u174, "Tom Jordon") | **Number mismatch** — ECI `…34971` vs eMerge `…04971`. His physical fob may not match what's programmed. Reconcile. |
| 09549788 | Delgado, Samuel | Has 2 active fobs (09549785 u186, 07509876 u186) | Not locked out — ECI carries an extra/old number. |
| 12128019 | Danna, Anthony | Active as 07500759 (u99) | Not locked out (board member, gets in). ECI extra number. |
| 07500620 | Benedetto, Anita | **No eMerge record** | Former owner (stale ECI entry) OR lockout — needs ownership check. |
| 11835033 | Benedetto, Anita | **No eMerge record** | Same person, 2nd ECI fob — same verify. |
| 07517312 | Ettore, Erica | **No eMerge record** | Verify current owner. |
| 09549947 | Ettore, Erica | **No eMerge record** | Same person, 2nd ECI fob. |
| 12128013 | Irving, Robert | **No eMerge record** | Verify. Part of a 121-block (13–19) where only Salimbene/14 is programmed. |
| 12128015 | Fiscella Sr., Vincent | **No eMerge record** | Verify. |
| 12128016 | Lichtenstein, Steven | **No eMerge record** | Verify. |

**Interpretation:** the "no eMerge record" rows are most likely **former owners ECI never purged**, not active lockouts — but I can't prove that without a current ownership/census list (the very list with the "1 Wharfside Drive" defect). Per our *err-toward-access* rule, none of these should be revoked; they should be **verified against ownership**, and any current resident gets a working fob.

## B) Active in eMerge, NOT on ECI list (47) — eMerge is ahead
Breaks into explainable buckets:
- **17 × `254-59x` (59xxx) cards** — vendors/spares/recent adds: Kathy(ECI), Alta Aquatics, Sebco, Bob McAuliffe, Timmy Mucaj (×2), Angelo Diorio, Norm Ogilvie, plus several "Need"/Spare.
- **~20 recent resident adds** labeled "From Email-8-11", "From Form-8-8", "Need name from ECI", "Resident-Spare" — fobs activated faster than ECI updated their master list.
- **Building/staff:** Pool, Maintenance, Management, McDaughters LLC.
- **Nick's own:** 07500726, 11835143, 12128515 (all unit 146).

These represent **access ECI isn't tracking** — low security risk, but ECI's master list should be updated to match.

## C) Trigger fob 12128014 (Unit 138 renter)
- **Active in eMerge:** card `28014`, fmt `121-mircon`, **UserDefine1 = unit 138** (correct), name field = placeholder **"unit128"**.
- **ECI list:** attributed to **Salimbene, Nick** (presumably the owner of 138).
- ✅ Working now (matches in both) — that's why access was restored. Minor cleanup: the eMerge **name should be the owner/renter**, and the **128 vs 138** discrepancy in the name field should be fixed.

---

## Recommended next steps
1. **Reconcile Tom Jordon's number** — confirm whether his fob is `11834971` or `11804971` and align both systems.
2. **Verify ownership** for Benedetto, Ettore, Irving, Fiscella, Lichtenstein — current owners get a working fob; if they sold, ECI purges the stale entry. Never revoke on uncertainty.
3. **Send ECI the 47 eMerge-only fobs** so their master list catches up (especially names for the "From Email"/"Need name" adds).
4. **Fix the unit field** in ECI's report — every row shows the association name instead of a unit number, which blocks any unit-level audit.
