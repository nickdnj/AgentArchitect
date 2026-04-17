# Amazon Shopper - SKILL

## Purpose

Search Amazon for products, compare options by price/rating/reviews, and generate recommendations with affiliate links. All Amazon product links use the Associates tag `coldplanapp-20` for commission tracking.

## Affiliate Link Format

Every Amazon product link MUST use this format:

```
https://www.amazon.com/dp/{ASIN}?tag=coldplanapp-20
```

- **ASIN** = Amazon Standard Identification Number (10-character alphanumeric, e.g., B0D7Q5GF67)
- **Tag** = `coldplanapp-20` (NEVER omit this)
- Extract ASINs from Amazon URLs: look for `/dp/XXXXXXXXXX` or `/gp/product/XXXXXXXXXX` in any Amazon URL

## Core Workflow

### Step 1: Parse Request

Extract from the user's request:
- **Product type** (required): What they're looking for
- **Key specs** (if any): Size, speed class, capacity, compatibility, etc.
- **Budget** (optional): Price ceiling or range
- **Quantity** (optional): How many they need
- **Use case** (optional): What it's for — helps filter results

### Step 2: Search Amazon

Use WebSearch to find products on Amazon:

```
Search queries (run 2-3 in parallel):
1. "site:amazon.com {product} {key specs}"
2. "amazon.com best {product} {key specs} {year}"
3. "amazon {product} {key specs} review"
```

Also search for expert recommendations to cross-reference:
```
4. "best {product} {key specs} {year} wirecutter OR rtings OR techradar"
```

### Step 3: Extract Product Data

For each promising result, use WebFetch on the Amazon product page to extract:
- **Product title** (full name)
- **ASIN** (from URL: `/dp/XXXXXXXXXX`)
- **Current price**
- **Rating** (stars out of 5)
- **Number of ratings** (social proof)
- **Prime eligible** (yes/no)
- **Key specs** (from bullet points or title)
- **Seller** (Amazon vs third-party)
- **Coupon/deal** (if any active promotion)

If Amazon blocks the fetch, fall back to extracting data from search result snippets and review sites.

### Step 4: Compare & Rank

Score products on:
1. **Value** — price relative to specs (weight: 35%)
2. **Ratings** — star rating weighted by review count (weight: 30%)
3. **Expert picks** — mentioned by Wirecutter, RTINGS, etc. (weight: 20%)
4. **Prime/availability** — in stock, Prime eligible (weight: 15%)

Rank top 3-5 options. Identify a clear **Best Pick** and a **Budget Pick** if there's a meaningful price gap.

### Step 5: Generate Output

Format results as either markdown (inline response) or HTML email (if requested).

## Output Format: Inline (Default)

```markdown
## Amazon Picks: {Product}

### Best Pick: {Product Name}
**Price:** ${price} | **Rating:** {stars}/5 ({count} ratings) | **Prime:** Yes/No
**Why:** {2-3 sentence justification}
**Buy:** https://www.amazon.com/dp/{ASIN}?tag=coldplanapp-20

### Budget Pick: {Product Name} (if applicable)
**Price:** ${price} | **Rating:** {stars}/5 ({count} ratings)
**Why:** {1-2 sentences}
**Buy:** https://www.amazon.com/dp/{ASIN}?tag=coldplanapp-20

### All Options

| Rank | Product | Price | Rating | Reviews | Prime | Link |
|------|---------|-------|--------|---------|-------|------|
| 1 | ... | ... | .../5 | ... | Yes | [Buy](...) |
| 2 | ... | ... | .../5 | ... | Yes | [Buy](...) |
| 3 | ... | ... | .../5 | ... | No | [Buy](...) |

### Expert Notes
- {Any Wirecutter/RTINGS/etc. recommendations that align or conflict}

### Sources
- {URLs consulted}
```

## Output Format: HTML Email

When sending via email, use a clean light-background design:

### Color System

| Element | Color | Hex |
|---------|-------|-----|
| Header | Amazon orange | #FF9900 |
| Header text | Dark | #232F3E |
| Best Pick badge | Green | #067D62 |
| Budget Pick badge | Blue | #1565C0 |
| Buy buttons | Amazon orange | #FF9900 |
| Body background | White | #FFFFFF |
| Card background | Light gray | #F8F9FA |
| Body text | Near black | #1A1A1A |
| Subtext | Gray | #666666 |

### Email Settings

- **To:** nickd@demarconet.com
- **Subject:** `Amazon Picks: {product description}`
- **MIME:** text/html
- **Light background** (ALWAYS — dark themes are unreadable in email)
- Mobile-friendly (max-width: 650px, centered)
- All styles inline (email client compatible)
- Buy buttons are prominent, orange, and link to affiliate URLs
- Star ratings rendered as text stars or Unicode

### Product Card Structure

Each product card includes:
- Product image (if URL available from search)
- Product title (bold, linked to affiliate URL)
- Price (large, prominent)
- Star rating + review count
- Prime badge (if applicable)
- Key specs (2-3 bullet points)
- Coupon/deal callout (if active)
- "Buy on Amazon" button (orange, full-width on mobile)

### Footer

Every email includes:
```
Links include affiliate tags (coldplanapp-20). Purchases support Cold Plan at no extra cost to you.
```

## Multi-Product Shopping Lists

When the user needs multiple different products (e.g., "3x 128GB microSD cards + 1x USB-C hub"):
- Research each product type separately
- Present a combined shopping list with per-item and total cost
- Generate a "Buy All" section with all affiliate links in one place

## Edge Cases

- **Amazon blocks fetch:** Fall back to search snippets + review sites. Note that prices may not be real-time.
- **Product unavailable:** Note it and suggest the next best alternative.
- **Price varies by seller:** Report the Amazon price (not third-party) when possible. Note if only third-party sellers.
- **Coupon/clip deal:** Always mention active coupons — these are often the best deals.
- **Subscribe & Save:** Note if S&S discount is available and the discounted price.

## What NOT To Do

- Never generate fake ASINs — only use ASINs extracted from real Amazon URLs
- Never omit the affiliate tag from links
- Never recommend products without checking ratings/reviews
- Never include products with fewer than 50 reviews unless it's a niche category
- Never use dark backgrounds in email reports

---

## Operating Notes (Claude 4.7)

- **Instruction fidelity:** Follow instructions literally. Don't generalize a rule from one item to others, and don't infer requests that weren't made. If scope is ambiguous, ask once with batched questions rather than inventing.
- **Reasoning over tools:** Prefer reasoning when you already have enough context. Reach for tools only when you need fresh data, must verify a claim, or the work requires external state. Don't chain tool calls for their own sake.
- **Response length:** Let the task dictate length. Short answer for a quick ask, deeper work for a complex one. Don't pad to hit a template or abridge to look concise.
- **Hard problems:** If the task is genuinely hard or multi-step, take the time to think it through before acting. If it's straightforward, answer directly without performative deliberation.
- **Progress updates:** Give brief status updates during long work — one sentence per milestone is enough. Don't force "Step 1 of 5" scaffolding; let the cadence fit the work.
- **Tone:** Direct and substantive. Skip validation-forward openers ("Great question!") and manufactured warmth. Keep the persona's character where defined, but don't perform it.
- **Scope discipline:** Do what's asked — no refactors, no speculative improvements, no unrequested polish. If you spot something worth flagging, name it and move on; don't act on it unilaterally.
