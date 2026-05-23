# Reviews System — Milestone 1 Architecture Decisions

**Milestone:** Paid test ($250) — §5.6 Buyer Review Card + §5.9 Aggregate Rating Block  
**Branch:** `usman/reviews-test`

---

## What was built

1. **§5.6 Buyer Review Card** — `sections/review-card-buyer.liquid` loops sample reviews and renders `snippets/review-card-buyer.liquid`.
2. **§5.9 Aggregate Rating Block** — `sections/aggregate-rating-block.liquid` computes average, star row, and distribution **only** from the same filtered buyer reviews as the cards (not from a separate `aggregate_rating` object in JSON). Fractional stars: `snippets/review-stars-aggregate.liquid` (see below).
3. **Sample data** — `docs/decisions/reviews-sample.json` (8 reviews, §4.1 shape). Same JSON is pasted into the shop metafield the theme reads at runtime.
4. **Test page** — `templates/page.reviews-test.json` → `/pages/reviews-test`.

**Runtime data:** `shop.metafields.custom.reviews` (JSON). The theme does not read JSON from `assets/` or duplicate files in the repo.

**M2 (unchanged from May architecture):** One `Review` metaobject per order; typed `list.product_reference` for `owns`; Liquid first paint, JS for filters later. Only the section’s data assign changes — card markup stays the same.

---

## Shop metafield setup

| | |
|--|--|
| **Owner** | Shop |
| **Namespace & key** | `custom.reviews` |
| **Type** | JSON |
| **Value** | Copy entire contents of [`reviews-sample.json`](./reviews-sample.json) |

```liquid
{% assign reviews_data = shop.metafields.custom.reviews.value %}
{% for review in reviews_data.reviews %}
```

**Which buyer cards show on the test page:** IDs in `buyer_display_ids` inside that JSON (`r01`, `r02`, `r03`, `r04`, `r08`).

---

## §5.9 Aggregate block (M1 — matches code)

`sections/aggregate-rating-block.liquid` reads `shop.metafields.custom.reviews` and applies the **same filters** as the buyer card section:

1. `reviewer_type == 'buyer'`
2. `review.id` in `buyer_display_ids` (or all buyers if that list is empty)

From those reviews only it computes:

| Output | Source |
|--------|--------|
| **Average** | Sum of `rating` ÷ count (e.g. sample → **3.6**) |
| **“From N reviews”** | That same count (e.g. **5**) |
| **Distribution bars** | Count of 5★–1★ within that set, bars max-normalized |

**Not in M1:** No `aggregate_rating` field in the metafield JSON, no catalog-wide totals (e.g. booklet’s 4.3 / 47), no product-scoped metaobject query yet.

**Theme editor only:** `average_override` (e.g. `4.3`) overrides the **displayed average and stars** for fractional-gradient acceptance; distribution bars still use the computed counts above. Leave blank in production.

---

## §5.9 Fractional stars (linearGradient)

**Booklet acceptance:** For an average like **4.3**, render **four full stars** and a **partial fill on the fifth star at 30%** (fractional part × 100, not a fixed 50% “half star”).

**Implementation:** `snippets/review-stars-aggregate.liquid`

| Step | Logic |
|------|--------|
| Full stars | `floor(average)` |
| Partial % | `(average − floor(average)) × 100` → `linearGradient` stop on the next star |
| Empty stars | Remaining outline stars up to 5 |

**Examples**

| Average | Stars |
|---------|--------|
| **4.3** | 4 full + 5th at **30%** + none empty |
| **3.6** (live test page) | 3 full + 4th at **60%** + 5th empty |
| **4.0** | 4 full + 1 empty outline |

**Verify 4.3 on the test page:** Theme editor → **Aggregate rating block** → **Average override** → `4.3`. Score and stars use the override; distribution bars still reflect the five visible reviews. Clear the field to return to computed **3.6**.

---

## Key decisions

### Why shop JSON metafield for M1 (not case blocks in Liquid)

- One JSON shape, looped in Liquid — matches how Brian expects to “swap data without rewriting sections.”
- Repo file `reviews-sample.json` is for **review only** (what’s inside the metafield); not loaded by the theme.

### Storage: metaobject for M2, not order metafield

Order metafields suit within-order reads. Cross-product filtering needs a queryable collection → **Review metaobject** per submission.

### `owns` and `owns_colors` (§4.1)

Per the Build Guide, these are **separate fields** on each review:

- **`owns`** — product reference data (`product_reference`, `handle`, `title`, `icon_type` for M1 placeholders).
- **`owns_colors`** — parallel array, same order: `{ product_reference, color_hex }`.

The buyer card section pairs them by index (two loops). M2 uses typed `list.product_reference` on the metaobject; colors stay queryable as `owns_colors`.

### Render split

- **M1:** Liquid HTML from metafield loop.
- **Later:** JS for filter/sort/load-more on same shape; metaobject query replaces metafield assign.

### Returns badge

M1: `order_returned` in sample JSON. Production: display-time fulfillment check.

### §4.4 Sample reviewer (`is_sample_reviewer`)

Per §4.4, production sets the review’s `is_sample` from the customer’s `is_sample_reviewer` flag at submit time; M1 sample JSON sets `is_sample` directly on each review (e.g. r03 `true` for the Sample pill).

---

## Sample data → metaobject mapping

| JSON field | Future metaobject field |
|------------|-------------------------|
| `id` | `id` |
| `order_id` | `order_id` |
| `reviewer_type` | `reviewer_type` |
| `reviewer_name` | `reviewer_name` |
| `rating` | `rating` |
| `answers` | `answers` |
| `photos` | `photos` |
| `owns` | `owns` (`list.product_reference`) |
| `owns_colors` | `owns_colors` (parallel color per product) |
| `gave` | `gave` (gifter) |
| `status` | `status` |
| `submitted_at` | `submitted_at` |
| `order_returned` | derived at render |
| `is_sample` | `is_sample` (from customer `is_sample_reviewer` at submit, §4.4) |

Sample set: 8 reviews (buyer / recipient / gifter / accessory); edge cases for returned order, photos, Sample tag, 1★ and 5★.

---

## §5.10 integration (future)

Product template includes aggregate + review list + filters. Aggregate there is **product-scoped** (all approved reviews for that product), not the M1 test-page subset. Liquid renders first page; JS re-queries Storefront API. Same card snippets.

---

## §5.7 / §5.8 inheritance

Shared primitives (`review-stars-whole`, `review-date`, owns row, prose blocks). Recipient/Gifter cards swap tag pill, owns vs gave, usage line, prompt labels — no rewrite of buyer markup.

---

## Trade-offs

| Decision | Note |
|----------|------|
| Shop metafield vs metaobject in M1 | Metafield is sample transport only; M2 swaps source |
| Outline SVGs vs product images | Placeholders until catalog `outline_image` wired |
| Lightbox | Stub only per test scope |
| Aggregate computed in Liquid | Same `buyer_display_ids` filter as cards; no JSON `aggregate_rating`; M2 product PDP queries metaobjects by product |

---

## Theme files (reviews milestone only)

```
docs/decisions/
  test-milestone.md          ← this document
  reviews-sample.json        ← paste into shop metafield custom.reviews

sections/
  review-card-buyer.liquid
  aggregate-rating-block.liquid

snippets/
  review-card-buyer.liquid
  review-stars-*.liquid, review-date.liquid, review-product-icon.liquid, …

assets/
  reviews-components.css

templates/
  page.reviews-test.json
```

---

## Test page

1. Paste `reviews-sample.json` into shop metafield `custom.reviews`.
2. Create page handle `reviews-test`, template **page.reviews-test**.
3. Open `/pages/reviews-test`.

---

## Revisit in later milestones

- Storefront API filter syntax for `owns contains product`
- Metaobject definition + App Proxy submit (M2–M3)
- Full photo lightbox
