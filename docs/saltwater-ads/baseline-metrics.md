# Saltwater AI Ads — Baseline Metrics

**Pull date:** 2026-04-30
**Source:** `POST https://api.triplewhale.com/api/v2/summary-page/get-data`
**Shop:** `saltwater-longisland.myshopify.com` (Shopify shop ID 19062163, TW workspace `saltwaterlongisland`)
**Window:** 2026-01-31 → 2026-04-30 (90 days, "current") vs 2025-11-02 → 2026-01-30 (90 days, "previous")
**Raw response:** `docs/saltwater-ads/baseline-data/tw-summary-90day-2026-01-31_2026-04-30.json` (660 KB, 699 metrics)
**Reason:** PRD §10.1 month-1 spend-efficiency gate requires a baseline. Capture this snapshot **before** any AI-generated ads ship so the post-Sprint-1 comparison is honest.

---

## Headline numbers

| Metric (TW id) | 90d current | 90d prior | Δ% | What it tells us |
|---|---:|---:|---:|---|
| `sales` (Order Revenue) | $68,038.88 | $70,864.84 | **-3%** | Top line basically flat |
| `newCustomerSales` | $42,976.47 | $26,654.79 | **+61%** | Acquisition is working hard |
| `rcRevenue` (Returning Customer Revenue) | $25,062.41 | $44,210.05 | **-43%** | Return-purchase base is softening |
| `netSales` | $63,251.35 | $64,768.42 | -2% | (after refunds + adjustments) |
| `grossProfit` | $38,837.28 | $42,150.40 | -7% | Margin compression |
| `cogs` | $17,772.92 | $16,655.43 | +6% | Costs creeping |
| `shopifyAov` | $85.82 | $126.77 | **-32%** | Basket size collapsing |
| `orders` | 732 | 527 | **+38%** | More transactions, smaller baskets |
| `roas` (blended) | 3.98 | 4.20 | -5% | Marketing efficiency slipping |
| `mer` (Marketing Efficiency Ratio) | 25.11 | 23.78 | +5% | Better return per ad dollar at the blended level |
| `googleRoas` | 1.84 | 1.85 | 0% | Google flat |

## What this baseline says about the business

**Two stories at once.**

1. **Acquisition is winning.** New Customer Revenue is up +61% on +38% more orders. Whatever creative is running for cold audiences is working — Saltwater is finding new buyers at scale.

2. **Retention and unit economics are bleeding.** Returning Customer Revenue down -43%. AOV down -32%. Gross profit down -7%. New customers are spending less per order than the older returning cohort did, and the brand isn't bringing them back.

**The implication for Sprint 1 ads.** Hit-rate isn't the only thing to track. The PRD's month-1 gate (qualitative + spend efficiency, ±20% of baseline) needs to attend to *which* lever moved. If we ship 40-60 AI ads and acquisition stays hot but AOV keeps falling, we look efficient on hit-rate while the business gets worse. Three lenses on the post-launch comparison:

| Lens | Baseline (90d trailing) | Month-1 sanity check |
|---|---:|---|
| Blended ROAS | 3.98 | Stay within ±20% (3.18 – 4.78) |
| AOV (`shopifyAov`) | $85.82 | Don't accelerate decline (no worse than -10% additional drop) |
| New Customer Revenue share | 63% of order revenue | Acquisition mix shouldn't deteriorate |
| Order volume | ~243/month avg | Maintain or grow |

**Honest framing of what's driving this.** This baseline reflects the existing creative team's output (Joe shipping ~22 concepts in 10 months per the 2025 ad library). The AI Ads system inherits these conditions; it doesn't cause them. Month-1 success = AI ads do not make any of these worse and ideally start nudging AOV or RC Revenue back.

## What's NOT in this snapshot

The 90-day pull returned 699 metrics, but several ad-platform-specific metrics we expected were absent:

- `totalAdSpend`, `metaAdSpend`, `googleAdSpend`
- `metaRoas`, `metaCac`, `ncpa`, `ncroas`
- `metaImpressions`, `metaClicks`, `metaCpm`, `metaCtr`, `metaHookRate`

Three plausible reasons (need to confirm in TW Connector dev):

1. The TW account has ad-platform integrations connected at one level but the `summary-page/get-data` endpoint only exposes a subset to API-key auth (vs the dashboard).
2. The metric IDs in TW's 2026 API version differ from what we expected based on prior docs.
3. The Saltwater account has Meta + Google connected in some modes but not others (e.g., spend reads from Triple Whale's pixel/attribution layer, not direct platform pulls).

Decision until resolved: **per-platform spend + per-creative ROAS will not be available via this endpoint alone.** For Sprint 1, the system uses blended ROAS + MER as the spend-efficiency gate. Per-creative attribution comes from `/attribution/get-orders-with-journeys-v2` post-processing or from Joe's gut-call top-5 list (still pending).

## Method note: how to re-pull this baseline

```bash
TW_KEY=$(security find-generic-password -s tw-api-key -a saltwater -w)
curl -s -X POST "https://api.triplewhale.com/api/v2/summary-page/get-data" \
  -H "x-api-key: $TW_KEY" \
  -H "content-type: application/json" \
  -d '{
    "shopDomain":"saltwater-longisland.myshopify.com",
    "period":{
      "start":"2026-01-31T00:00:00.000Z",
      "end":"2026-04-30T23:59:59.999Z"
    },
    "todayHour":null
  }' \
  -o tw-summary-90day-$(date +%Y-%m-%d).json
```

Re-pull weekly during Sprint 1; the worker eventually does this on a schedule (PRD §6.1.3 F-TW-3 — Sprint 2).

## Cross-references

- **PRD:** §10.1 (primary success metrics gate), §10.2 (secondary), §10.4 (brand bucket earn-it gate)
- **TW Connector:** `apps/saltwater-ads/lib/services/tw-connector.ts` (Sprint 1 implementation)
- **TW API discovery:** confirmed via `GET /api/v2/users/api-keys/me` 2026-04-30 — key scoped `summary-page:read, attribution:read` for user `nickd@demarconet.com` on workspace `saltwaterlongisland`
