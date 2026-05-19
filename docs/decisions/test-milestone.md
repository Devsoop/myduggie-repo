# Reviews System — Milestone 1 Architecture Decisions

**Milestone:** Paid test ($250) — §5.6 Buyer Review Card + §5.9 Aggregate Rating Block  
**Branch:** `usman/reviews-test`  
**Date:** May 2026

---

## What was built

Two standalone Horizon theme sections render from sample data shaped for the production Review metaobject: **Buyer review cards** (§5.6) and an **Aggregate rating block** (§5.9). A test page template (`page.reviews-test`) stacks both for acceptance review.

**M1 data source:** Shop JSON metafield `shop.metafields.custom.reviews` — same structure as `data/reviews-sample.json` (committed for review). The section loops `reviews_data.reviews` in Liquid; no per-review `{% case %}` blocks in theme files.

**M2 data source:** One `Review` metaobject per submission (unchanged from May architecture). Only the section’s assign/loop line changes; `snippets/review-card-buyer.liquid` markup stays the same.

---

## Key decisions

### Storage: metaobject, not order metafield

**Chosen:** One `Review` metaobject per order submission.

**Why:** Order metafields suit within-order reads (e.g. skincare build). This system filters across reviews by product (`owns`), color, rating, and reviewer type on every PDP. That requires a queryable collection. Metaobjects expose Storefront API filters; order metafields do not scale to cross-record queries.

**M1:** Shop JSON metafield (`custom.reviews`) + Liquid `for review in reviews_data.reviews`. **M2:** Metaobject definition + queries replace the metafield assign; snippet markup unchanged.

### `owns`: typed `list.product_reference`

**Chosen:** Typed product references on the metaobject, populated at submit from order line items.

**Why:** Inline resolution in one Storefront API call. Owns-row icons use each product’s `outline_image` metafield in reviewer-picked colors. Raw product ID strings would force a second-pass query per PDP.

**M1:** Sample `owns[]` includes denormalized `icon_type`, `color_hex`, and placeholder outline SVGs. Same payload shape as resolved references in production.

### Render split: Liquid first, JS for filters (deferred)

**Chosen:**

- **Liquid** — Initial HTML for first page of reviews (unfiltered), crawlable, fast first paint.
- **Client JS** — Filter, sort, load-more re-query Storefront API without reload (§5.10, post–M1).

**M1:** Liquid-only. Section settings expose labels and aggregate numbers (§4.7 admin-configurable principle).

### Moderation & sample flag (deferred)

**Chosen:**

- Auto-publish on submit; reactive hide / edit / flag via **Shopify Admin UI Extension** (M4+).
- **Customer** metafield `is_sample_reviewer` (boolean) copied to `review.is_sample` at App Proxy submit (M3).

**M1:** `is_sample` boolean on sample rows drives Sample pill overlay.

### Returns badge

**Production:** Display-time check on order fulfillment status (not snapshot-at-write).  
**M1:** `order_returned` boolean in sample data (`r02` = returned).

---

## Sample data → metaobject mapping

| Sample JSON field | Future metaobject field | Type |
|-------------------|-------------------------|------|
| `id` | `id` | uuid |
| `order_id` | `order_id` | single line / order ref |
| `reviewer_type` | `reviewer_type` | enum |
| `reviewer_name` | `reviewer_name` | json / composite |
| `rating` | `rating` | integer 1–5 |
| `answers` | `answers` | json |
| `photos` | `photos` | list.file_reference |
| `owns` | `owns` | **list.product_reference** |
| `owns[].color_hex` | `owns_colors` | list.variant_reference or json |
| `gave` | `gave` | list (gifter only) |
| `status` | `status` | enum |
| `submitted_at` | `submitted_at` | date_time |
| `order_returned` | *(display)* | derived from order at render |
| `is_sample` | `is_sample` | boolean |

**Swapping datasets in M1:**

| Step | Action |
|------|--------|
| 1 | Edit `data/reviews-sample.json` (repo source of truth for reviewers) |
| 2 | Paste updated JSON into **Shop → custom.reviews** metafield in admin |
| 3 | Edit `buyer_display_ids` array in metafield JSON to change which buyer cards show |

No theme code deploy required for content or display-list changes. **M2:** replace metafield read with metaobject query; sections unchanged.

---

## §5.10 reviews page integration (future)

1. Product template includes `reviews-section.liquid` (aggregate + list + filters).
2. Liquid pre-fetches first 10 approved reviews where `owns` contains current product GID.
3. Embed same JSON shape in `<script type="application/json" id="reviews-data">` for JS.
4. Filter drawer / sidebar applies Storefront API filters; sort and load-more append without reload.

**Open item:** Verify `owns` list-field filter syntax on current Storefront API before M2 lock.

---

## §5.7 / §5.8 card inheritance

Shared snippet tree from buyer card:

| Element | Buyer §5.6 | Recipient §5.7 | Gifter §5.8 |
|---------|------------|----------------|-------------|
| Header / stars / date | Shared | Shared | Shared |
| Tag pill | Verified buyer | Gift recipient | Gift giver |
| Returns badge | Shared | Shared | Shared |
| Owns / Gave row | Owns | Owns | **Gave** |
| Usage qualifier | Yes | Yes | **No** |
| Photos / prose | Buyer prompts | Recipient prompts | Gifter prompts |

New card variants = new thin snippets composing existing primitives, not rewrites.

---

## Trade-offs

| Decision | Upside | Downside |
|----------|--------|----------|
| Liquid assign sync with JSON | Pure Liquid HTML, no fetch delay | Dual maintenance until M2 single source |
| Placeholder outline SVGs | Works without product catalog on dev store | Replace with `outline_image` metafield URLs in production |
| Lightbox stub | Meets M1 scope | Full library in later milestone |
| Section settings for aggregate | Admin-tunable without deploy | Not computed from live reviews until M2 |

---

## File map

```
data/reviews-sample.json          # Canonical JSON — paste into shop metafield custom.reviews
data/aggregate-sample.json        # Aggregate fixture (4.3 avg)
data/README.md                    # Metafield setup instructions
assets/reviews-components.css
snippets/review-card-buyer.liquid # §5.6 markup only (params in)
snippets/review-*.liquid          # Stars, date, owns icons, aggregate, etc.
sections/review-card-buyer.liquid # Loops shop.metafields.custom.reviews.value
sections/aggregate-rating-block.liquid
templates/page.reviews-test.json
```

---

## Test page setup

1. Shopify Admin → **Pages** → Add page, handle `reviews-test`, title “Reviews test”.
2. Theme template: **page.reviews-test**.
3. URL: `/pages/reviews-test`

---

## Revisit if scope expands

- Storefront API filter syntax for `owns` contains product
- Whether to denormalize `product_review_ids` on product metafield for faster Liquid-only themes
- Photo CDN / resize pipeline on App Proxy submit
- Full lightbox library selection
