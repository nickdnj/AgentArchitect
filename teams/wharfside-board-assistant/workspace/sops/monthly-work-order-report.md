# SOP — Monthly Work Order Report for the Wharfside Bulletin

**Purpose:** Produce a consistent, comparable "Maintenance at a Glance" snapshot in each month's bulletin so residents see a running narrative of work-order activity and ECI/vendor completion rates.

**Owner:** Nick DeMarco (Secretary) — runs the report each month before bulletin assembly.
**Frequency:** Monthly, on or after the last day of the reporting month.
**Source system:** AppFolio (managed by ECI).

---

## Window — Use Year-to-Date, NOT Last 90 Days

For monthly bulletins, **always run the report from January 1 of the current year through the last day of the reporting month** (e.g., `01/01/2026 → 05/31/2026` for the June bulletin).

**Why YTD instead of 90 days:**
- Builds a running narrative residents can follow month over month.
- No overlap with the prior bulletin — each month simply extends the same YTD picture.
- Captures completion rate, not just open backlog (90-day open-only reports drop closed tickets and understate ECI's work).
- Same denominator across months → clean month-over-month comparisons.

90-day or trailing-30-day windows can be useful for internal board operations, but they are **not** the right framing for a community bulletin.

---

## Filters — Run the Report Exactly Like This

In AppFolio Resident Portal / Manager view → **Maintenance → Work Orders → Reports** (or the Work Orders list view → Export):

| Filter | Value |
|---|---|
| Property | Wharfside Manor Condominium Association — Wharfside Dr, Monmouth Beach, NJ 07750 |
| Created At — From | `01/01/<current year>` |
| Created At — To | last day of the reporting month |
| **Status** | **ALL** — do NOT filter to Open / Assigned / Scheduled. The bulletin must include Completed work to show closure rate. |
| Work Order Type | All (Resident + Internal) |
| Vendor | All |
| Priority | All |

**Critical:** the "Last 90 Days" preset on AppFolio appears to filter to open statuses only. Confirmed example: a 90-day pull on May 29, 2026 returned 59 work orders, all open, zero completed — for a window that fully overlapped 169 closed tickets reported in the May bulletin. The closed work was silently filtered out. **Always set Status = ALL explicitly.**

---

## Save & Hand Off

1. Export to CSV.
2. Save to `~/Downloads/work_order-YYYYMMDD.csv` (AppFolio's default naming convention).
3. Drop the path into the Wharfside conversation with the bulletin rev request — e.g., *"June bulletin rev — WO CSV at `~/Downloads/work_order-20260531.csv`."*
4. The bulletin assistant will:
   - Categorize tickets into the same bucket scheme used in the May bulletin (Heat & boilers, Plumbing & drains, Roof/siding/exterior, Doors/locks/fobs, Hallway/common, Grounds/landscaping, plus an "Other" rollup as needed).
   - Compute requests/completed per category and totals.
   - Generate the "Maintenance at a Glance" block in the same visual format as the prior month.

---

## Category Mapping (carry forward each month)

The May bulletin used 6 named buckets + total. Apply the same mapping to AppFolio's more granular `Work Order Issue` field so month-over-month comparison stays clean:

| Bulletin Bucket | AppFolio `Work Order Issue` values that roll up to it |
|---|---|
| Heat & boilers | Heater, Boiler, Thermostat, Radiator |
| Plumbing & drains | Plumbing, Drain, Toilet, Sink, Water Hose Outside, Leak |
| Roof, siding & exterior | Roof, Siding, Rain Gutters, Outdoor Deck/Patio, Wall Damage (exterior) |
| Doors, locks & fobs | Door, Lock, FOB, Window |
| Hallway & common area | Hallway, Lighting (common), Hard Floors, Mold/Mildew, Fire |
| Grounds & landscaping | Landscaping, Grounds, Parking Issues (lot) |
| Other / Misc | "Other Maintenance — Not Listed", blanks, Not Maintenance Related |

If a new `Work Order Issue` value appears that doesn't fit, fold it into the closest bucket and note the addition in that month's bulletin briefing.

---

## Open vs Closed — Status Mapping

AppFolio's actual status vocabulary (observed in the May 29, 2026 YTD export):

| Bulletin Status | AppFolio `Status` values |
|---|---|
| Closed / Completed | `Completed`, **`Completed No Need To Bill`** (large bucket — do not omit), `Closed`, `Invoiced`, `Work Done`, `Canceled` |
| Open | `Assigned`, `New`, `Scheduled`, `In Progress` |

**Important:** `Completed No Need To Bill` was 127 of 222 closed tickets in the May 29 export — leaving it out understates closure rate by more than half. Always include it.

Report both: `X requests · Y completed` per category and `Total · Closed · Open` overall.

---

## Categorization — Use Job Description as Fallback

**Roughly half of AppFolio work orders have a blank `Work Order Issue` field.** In the May 29 export, 174 of 352 tickets (49%) had no Issue value — and most of those were the highest-volume category (Heat: "No heat", "Temperatures dropping", "Furnace leaking", "frozen pipes", "flame rod replacement", etc.).

**Do NOT categorize by `Work Order Issue` alone.** Concatenate `Work Order Issue + Job Description` and match keywords against the combined text. Bucket assignment regexes (in priority order — first match wins):

1. **Administrative (exclude from resident snapshot):** `vendor payment | payment | invoice only | reimburs | not maintenance`
2. **Heat & boilers:** `no heat | not heat | hot water | water heater | boiler | thermostat | radiator | furnace | temperature | temp drop | cold apt | cold apartment | degrees | baseboard | zone valve | flame rod | heating loop | frozen pipe | heater | heat`
3. **Plumbing & drains:** `plumb | drain | piping | pipe | leak | toilet | sink | faucet | no water | water pressure | sewer | backup | clog | sump | shower | sprinkler | water main | running water`
4. **Doors, locks & fobs:** `door | lock | fob | key | locked out | window | buzzer | doorbell | intercom`
5. **Roof, siding & exterior:** `roof | siding | gutter | deck | patio | exterior | soffit | fascia | shingle | stucco | brick | chimney | balcony | crawl space | crawlspace`
6. **Hallway & common area:** `hallway | hall floor | hard floor | sagging floor | carpet | wall damage | paint | mold | mildew | fire | smoke | alarm | laundry | dryer | washer | common area | lighting | electric | outlet | ceiling`
7. **Grounds & landscaping:** `landscap | tree | grass | lawn | grounds | parking | pavement | pothole | pool | outdoor | snow | salt | dumpster | trash | recycl | bird | pest | garden | fence | gate`
8. **Other / Misc** — fallback (generators, signage, AC sleeves, stair rails, light bulbs, etc.)

Priority order matters: a "leak from the heater" should match Heat first, not Plumbing.

---

## Quality Check Before Including in Bulletin

Before the categorized snapshot goes into a bulletin draft, sanity-check the totals:

- **Total work orders YTD** — should always increase month over month. If it dropped vs the prior bulletin, the filter is wrong (almost certainly Status filter excluding closed tickets).
- **Closed count** — should also increase month over month. A flat or dropping closed count is the same signal.
- **Heat & boilers** — should decline through spring/summer and rise again in fall/winter.
- **Plumbing & drains** — generally steady; spikes flag building events worth investigating.

If any of these look wrong, re-pull the report with Status = ALL confirmed and try again before drafting.

---

## Reference Snapshots

**May 2026 bulletin (Jan 1 – Apr 28, 2026):**

| Category | Requests | Completed |
|---|---|---|
| Heat & boilers | 102 | 71 |
| Plumbing & drains | 66 | 40 |
| Roof, siding & exterior | 16 | 10 |
| Doors, locks & fobs | 15 | 5 |
| Hallway & common area | 7 | 2 |
| Grounds & landscaping | 6 | 3 |
| **All categories** | **249 total** | **169 closed · 80 open · 68% closure** |

**June 2026 bulletin (Jan 1 – May 27, 2026):**

| Category | Requests | Completed |
|---|---|---|
| Heat & boilers | 136 | 124 |
| Plumbing & drains | 69 | 46 |
| Doors, locks & fobs | 55 | 26 |
| Hallway & common area | 24 | 10 |
| Roof, siding & exterior | 21 | 10 |
| Grounds & landscaping | 19 | 11 |
| Other / Misc | 24 | 16 |
| **All categories** | **348 total** | **243 closed · 105 open · 70% closure** |

Use these as the baseline format for July and beyond.
