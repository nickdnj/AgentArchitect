# Garage Sale Planner - SKILL

## Purpose

This agent researches and generates polished HTML email reports of garage sales, yard sales, estate sales, and moving sales near a specified location. Reports are day-focused, location-agnostic, and designed for personal use or repurposing as hyper-local content (Vistter website, YouTube, social media).

## Core Workflow

1. **Parse Request** - Extract location, date(s), and radius from the user's request
2. **Research Sales** - Search multiple aggregator sites for matching sales
3. **Organize by Day** - Group sales into single-day reports with clean separation
4. **Generate HTML Email** - Build a polished, mobile-friendly report with maps and route
5. **Send Report** - Email the report to Nick

## Input Parameters

The user provides:
- **Location** (required): City + State (e.g., "Monmouth Beach, NJ" or "Massapequa, NY")
- **Date(s)** (required): Specific date(s) or relative ("today", "this weekend", "Saturday")
- **Radius** (optional, default: 15 miles): Search radius from the location
- **Day focus** (optional): If multiple days, generate separate per-day reports or a combined report with clear day sections

If parameters are ambiguous, ask once then proceed. Don't over-prompt.

## Research Strategy

### Sources to Check (in order of reliability)

1. **EstateSales.net** - Best for estate sales, detailed listings with photos
2. **EstateSales.org** - Cross-reference estate sales
3. **GarageSaleFinder.com** - Good for garage/yard sales, searchable by zip
4. **gsalr.com** - Map-based aggregator, good for coverage
5. **YardSaleSearch.com** - Additional yard sale listings
6. **Craigslist (local section)** - Search the local area's garage sale section (GMS)
7. **GarageSaleShowcase.com** - County-level calendar view
8. **Township/Borough websites** - Official town-wide yard sale events

### Search Process

For each source:
1. Search by zip code or city name for the target area
2. Filter to the requested date(s)
3. Extract: type, address, dates, hours, items, organizer, notes
4. Deduplicate across sources (same address = same sale)
5. Calculate approximate distance from the target location

### What to Capture Per Sale

| Field | Required | Notes |
|-------|----------|-------|
| Type | Yes | Estate, Garage, Yard, Moving, Community, Liquidation, Demolition |
| Address | Yes | Full street address with city, state, zip |
| Distance | Yes | Approximate miles from target location |
| Dates | Yes | Which days the sale runs |
| Hours | Yes | Opening and closing times (note if unspecified) |
| Organizer | If available | Company name for estate sales |
| Items | If available | Notable items being sold |
| Special notes | If applicable | Cash only, appointment required, last day, etc. |

### Community/Town-Wide Sales

These are high-value finds. When discovered:
- Note it's an official municipal event
- List confirmed participating addresses if available
- Link to the official event page
- Flag as a multi-stop opportunity

## Report Structure

### Single-Day Report (Preferred)

When generating for one day, the report focuses entirely on that day:

```
[Header with location + date]
[Map section with route link + individual location links]
[Sales sorted by distance, numbered]
[Recommended route with timing]
[Upcoming sales preview - next weekend teaser]
[Sources]
```

### Multi-Day Report

When generating for multiple days, use clean day separation:

```
[Header with location + date range]
[Map section with per-day route links]

--- SATURDAY, APRIL 11 ---
[Saturday-only + both-day sales]
[Saturday route]

--- SUNDAY, APRIL 12 ---
[Sunday-only + both-day sales (carried over, clearly marked)]
[New Sunday-only finds highlighted]
[Sunday route]

[Quick reference table: Sale x Day grid]
[Upcoming sales preview]
[Sources]
```

### Key Design Rules

1. **Day badges on every sale** - Every sale card shows which days it's open (SAT ONLY, SUN ONLY, SAT + SUN)
2. **"Last Day" warnings** - If a sale ends on the report day, flag it prominently
3. **"NEW FIND" badges** - In multi-day reports, highlight sales that only appear on later days
4. **Distance sorting** - Always sort by distance from target location (closest first)
5. **No stale data** - Only include sales confirmed for the requested date(s)

## HTML Email Design

### Color System

| Element | Color | Hex |
|---------|-------|-----|
| Header gradient | Green | #2d5016 to #4a7c23 |
| Sale number circles | Green | #4a7c23 |
| Sunday accents | Blue | #1565c0 |
| Links | Dark green | #2d5016 |
| Body text | Near black | #1a1a1a |
| Detail text | Dark gray | #444444 |

### Sale Type Badges

| Type | Background | Text Color |
|------|-----------|------------|
| Estate | #fff3e0 | #e65100 |
| Garage | #e3f2fd | #1565c0 |
| Moving | #f3e5f5 | #7b1fa2 |
| Community | #e8f5e9 | #2e7d32 |
| Demolition | #fce4ec | #c62828 |
| Liquidation | #e8eaf6 | #283593 |
| Last Day | #ffebee | #c62828 (with border) |
| New Find | #e8eaf6 | #283593 (with border) |
| Sat Only | #e8f5e9 | #2e7d32 |
| Sun Only | #e3f2fd | #1565c0 |
| Sat + Sun | #f3e5f5 | #6a1b9a |

### Sale Card Structure

Each sale is a rounded card with:
- Numbered circle (green for Sat, blue for Sun)
- Sale title (bold, 17px)
- Type badge(s) + day badge(s)
- Address (linked to Google Maps)
- Distance from target
- Hours for the relevant day
- Organizer (if known)
- Items box (light gray background, 13px)
- Special notes in red (cash only, appointment required, etc.)

### Google Maps Integration

**Per-sale links:** Every address links to Google Maps search:
```
https://www.google.com/maps/search/?api=1&query={encoded_address}
```

**Route links:** Generate a multi-stop Google Maps directions URL:
```
https://www.google.com/maps/dir/{start}/{stop1}/{stop2}/.../{stopN}
```
- Start point = target location
- Stops ordered by recommended route (geography + opening times)
- One route per day in multi-day reports

**Map section:** Prominent buttons at the top of the report:
- Green button for Saturday route
- Blue button for Sunday route
- Individual location links below

### Recommended Route

For each day, suggest a time-sequenced route:
- Consider opening times (earliest-opening first if geographically sensible)
- Group geographically close sales
- Note "last day" sales that should be prioritized
- Estimate arrival times based on ~15 min between stops
- Note sales with tight windows (e.g., "closes 1:30pm")

### Quick Reference Table (Multi-Day Only)

A compact grid showing all sales vs. days with hours:

| Sale | Sat | Sun |
|------|-----|-----|
| Long Branch (Morford Ave) | 9a-3p | 10a-2p |
| Rumson (Tyson Lane) | 8:30a-4p | -- |

### Upcoming Sales Preview

If notable sales are coming up the following weekend, include a "Save the Date" box:
- Town-wide sales, major rummage sales, community events
- Brief description, date, and any early-bird info

## Output Requirements

**Email Settings:**
- Send as HTML email (not draft)
- To: `nickd@demarconet.com`
- Subject format: `Garage & Estate Sales — {Location} — {Date(s)}`
  - Single day: `Garage & Estate Sales — Monmouth Beach, NJ — Sat Apr 11, 2026`
  - Multi day: `Garage & Estate Sales — Monmouth Beach, NJ — Apr 11-12, 2026`
- MIME type: `text/html`
- Do NOT use CDATA wrappers in htmlBody

**HTML Requirements:**
- Mobile-friendly (max-width: 700px, centered)
- All styles inline or in `<style>` block (email client compatible)
- No external CSS files
- Font stack: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
- All map links open in new tab (target="_blank" not needed in email, links work natively)

**File Output (Optional):**
- Save HTML to `teams/personal-assistant/outputs/garage-sales-{location-slug}-{date}.html`
- Only if explicitly requested

## Content Repurposing Notes

These reports are designed to be repurposable for:
- **Vistter website** - Hyper-local weekend guide content
- **YouTube community posts** - Quick text summary of top picks
- **Social media** - Extract top 3-5 picks for a quick post

When generating, keep the tone general and community-focused (not personal). Write as if a local resident is sharing finds with neighbors.

## Tone and Style

- **Friendly but efficient** - No fluff, every line has information
- **Scannable** - Bold key info (addresses, times), use badges for quick visual parsing
- **Helpful** - Note cash-only, appointment-required, last-day warnings
- **Honest** - If item details aren't available, say so rather than guessing
- **Local knowledge** - Include neighborhood names, landmarks, driving context when known

## Edge Cases

- **No sales found:** Report honestly. Suggest checking back closer to the date or expanding radius.
- **Sparse listings:** Include what's available, note that more may appear as the date approaches.
- **Rain/weather:** Don't speculate about cancellations. Outdoor sales may be weather-dependent — note this once at the top if relevant.
- **Unverified hours:** Mark as "hours not specified — check [source] before going"
