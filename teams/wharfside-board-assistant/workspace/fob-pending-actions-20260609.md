# Fob Pending Actions — 2026-06-09

Working list of fob changes to apply to eMerge + points to raise with Kathy/ECI.
Source diff: `fob-coverage-diff-20260609.md`

## eMerge — to add / verify

### Tom Jordon (Unit 174) — add BOTH fobs
- eMerge currently has: `11804971` (card 4971, 118-mircom) — ACTIVE
- ECI list shows: `11834971`
- **Action:** make sure **both** `11804971` AND `11834971` are in eMerge (multi-fob per unit is OK). Don't assume the one-digit difference is a typo — treat as two real fobs and sync.

### Angelo Diorio (Unit 151) — add BOTH fobs (same pattern as Jordon)
- eMerge currently has: `59441` (254-59x) — ACTIVE
- ECI list shows: `59444`
- **Action:** add `59444` so both are in eMerge; sync with ECI. Mention to Kathy like Jordon.

### Other 9 ECI-listed fobs not in eMerge — add (err toward access), verify owner after
- `09549788` Delgado, Samuel
- `12128019` D'Anna, Anthony
- `07500620` Benedetto, Anita
- `11835033` Benedetto, Anita
- `07517312` Ettore, Erica
- `09549947` Ettore, Erica
- `12128013` Irving, Robert
- `12128015` Fiscella Sr., Vincent
- `12128016` Lichtenstein, Steven

### Un-matchable ECI rows (no action / FYI)
- "mircom / no visible number" — **Brady, Donald**: ECI couldn't read the number; Donald Brady IS active in eMerge, so he has access. Unreadable ECI record only.
- "Unreadable" blank row, 0 checked out — junk, ignore.

## Placeholder crosswalk (import CSV uses "Need name from Management")
The 5 unverified people are imported as placeholders; reconcile by card number:

| Import Id | Card # | Format | ECI name (per keys list) | Full fob # |
|---|---|---|---|---|
| 50034 | 620 | 75-mircom | Benedetto, Anita | 07500620 |
| 50035 | 35033 | 118-mircom | Benedetto, Anita | 11835033 |
| 50036 | 17312 | 75-mircom | Ettore, Erica | 07517312 |
| 50037 | 49947 | 95-mircom | Ettore, Erica | 09549947 |
| 50038 | 28013 | 121-mircon | Irving, Robert | 12128013 |
| 50039 | 28015 | 121-mircon | Fiscella Sr., Vincent | 12128015 |
| 50040 | 28016 | 121-mircon | Lichtenstein, Steven | 12128016 |

Once ECI confirms current ownership, update the eMerge name + unit fields from this table.

## Note on the full PDF
ECI keys PDF is **12 pages** (not 10). Pages 11-12 hold the 59xxx family + the unreadable rows. Always extract all pages.

## Email to Kathy — talking points
- **Tom Jordon:** "In eMerge I had Tom with fob **11804971**; your data shows **11834971**. I'm adding **both** to be safe so our records stay in sync."
- The 47 eMerge-only fobs (recent adds, vendors, spares) ECI should add to their master list.
- The ECI report's Unit column shows the association name on every row instead of unit numbers ("1 Wharfside Drive" issue) — blocks unit-level audit.
