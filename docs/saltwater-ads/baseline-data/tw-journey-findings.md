# Triple Whale Journey Attribution — Probe Findings

**Probe date:** 2026-04-30
**Endpoint:** `POST /api/v2/attribution/get-orders-with-journeys-v2`
**Auth:** `x-api-key` (scope: `attribution:read`)
**Window:** 2026-03-31 → 2026-04-29 (30 days)
**Raw response:** `tw-journey-30day-2026-03-31_2026-04-29.json` (902 KB, 68 attributed orders)
**Reason:** SAD §6.1.3 assumed "incremental sync via watermark + materialized snapshots" gives per-ad ROAS. Probe to confirm what's actually exposed.

---

## What's actually returned per order

Each order row has:

```json
{
  "order_id": "7493903319285",
  "order_name": "#62278",
  "total_price": 91.55,
  "currency": "USD",
  "created_at": "2026-04-29T11:48:36-0400",
  "customer_id": 9490227626229,
  "attribution": {
    "firstClick": [],
    "lastClick": [],
    "fullFirstClick": [
      {
        "source": "facebook-ads",
        "campaignId": "120235321134000697",
        "adsetId": "120239573787300697",
        "adId": "120239575929810697",
        "clickDate": "2026-03-05T09:32:00-0500"
      }
    ],
    "fullLastClick": [...],
    "lastPlatformClick": [...],
    "linear": [],
    "linearAll": [...]
  },
  "journey": []
}
```

Six attribution models per order (firstClick / lastClick / fullFirstClick / fullLastClick / lastPlatformClick / linearAll) — TW exposes them all and we pick which one to use for analysis.

**Key fields per click:** `source`, `campaignId`, `adsetId`, `adId`, `clickDate`. The presence of `adId` means **per-ad post-processing IS feasible** — we can group orders by Meta ad ID and sum revenue / order count.

## What's NOT returned

**Per-ad spend.** No `spend`, `cost`, `cpm`, `impressions`, `clicks` fields anywhere. To compute true ROAS or CPA per ad we need:
1. Meta Ads Manager API directly (separate auth, Sprint 2 territory), OR
2. Whatever TW does internally that surfaces in the dashboard but not the public API

Without spend, we can rank ads by **revenue + order count + AOV**, which is a good-enough winner signal at small N.

## 30-day reality check (the surprise)

The 30-day attribution-by-last-click distribution is the most important finding from this probe:

| Source (`fullLastClick`) | Orders | Revenue | Share of attributed |
|---|---:|---:|---:|
| organic_and_social | 31 | $4,107.00 | 42% |
| klaviyo (email) | 27 | $4,089.55 | 42% |
| Direct | 5 | $890.81 | 9% |
| **facebook-ads** | **3** | **$488.29** | **5%** |
| google-ads | 2 | $137.00 | 1% |
| **Total attributed** | **68** | **$9,712.65** | — |

For comparison: 90-day Order Revenue per `summary-page` was **$68,038 across 732 orders**. 30-day extrapolation → ~$22,679 / ~244 orders. So this 68-order attributed-orders set is ~28% of all 30-day orders; the other 72% have no fullLastClick attribution recorded (likely walk-ins from saved carts, repeat customers via direct nav, etc.).

**Only 3 of 244 estimated 30-day orders are attributed to Meta ads via last-click. That's 1.2% of all orders, $488 in revenue.**

## What this means for the AI Ads project thesis

The PRD's working assumption is "AI hooks → better Meta creative → more Meta revenue." This 30-day data tests that assumption against reality:

1. **Meta is a small last-click channel for Saltwater.** Email + organic dwarf it ~16:1 by both order count and revenue.
2. **Only 2 unique Meta ad IDs got multiple orders in 30 days.** Not enough sample to seed `hooks-winners.jsonl` from data alone — Joe's gut-call top 5 is confirmed as the primary winner-seed source.
3. **There may be a brand-build assist case for Meta** that doesn't show in last-click. We did not pull `fullFirstClick` distribution in this probe (TODO before the eng review). If Meta drives many *first* touches that later convert via email/organic, the project has different value than pure direct-response.
4. **Saltwater's $3K/mo Meta ad spend** vs $488/30 days last-click revenue = **0.16x last-click ROAS on Meta**. Either the attribution model under-credits Meta (likely — common with social channels) or the ads aren't working as direct-response (possible). Either way the AI Ads project either lifts this number or proves Meta deserves to be a smaller line item.

**Recommended PRD/SAD revisions** (handled in Task #8):

- §6.1.3 (TW Connector): change "incremental sync via watermark + materialized snapshots" to reflect what's available — account-level summary metrics + per-order journey post-processing. Per-ad spend acknowledged as Sprint 2+ via Meta Ads API.
- §10 (Success metrics): add an explicit sub-gate around "what attribution model are we measuring?" The PRD currently assumes blended ROAS as the gate; we should also track Meta-specific revenue under at least two attribution models (fullLastClick + fullFirstClick) to avoid over-crediting OR over-discounting.
- §3 (Goals): add an honest "what success looks like at this Meta scale" — at $488/30d last-click baseline, a 2x lift is +$500/month. The project's value is in compounding-brand-bucket and operator-time-savings more than direct revenue uplift; the 1% equity case is reinforced, the build-vs-buy economics get *worse* (less revenue lift to justify $200-250/mo in vendor cost).

## Probe is sufficient — moving on

Probe confirmed: per-ad attribution available, per-ad spend not available, and the surprise that Meta is a smaller last-click channel than expected.

Next: revise PRD §6.1.3 + SAD's TW section to lock the actual API surface, then run `/plan-eng-review` with these findings as input.
