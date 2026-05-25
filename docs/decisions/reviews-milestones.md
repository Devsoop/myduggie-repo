# Reviews System — Milestones (architecture decisions)

**Governing spec:** Build Guide §3–§5 — [`docs/client docs/ReviewsSystemBuildGuide.md`](../client%20docs/ReviewsSystemBuildGuide.md)  
**Scope rule:** [`.cursor/rules/reviews-build-guide-scope.mdc`](../../.cursor/rules/reviews-build-guide-scope.mdc)  
**Branch:** `usman/reviews-test` (M1 + M2)

**Related:** [`reviews-sample.json`](./reviews-sample.json) (M1 shop JSON) · [`reviews-metaobject-seed.md`](./reviews-metaobject-seed.md) (M2 Admin seeding)

---

## Milestone 1 — Buyer card + aggregate (test)

**Scope:** Paid test ($250) — §5.6 Buyer Review Card + §5.9 Aggregate Rating Block

### What was built

1. **§5.6 Buyer Review Card** — `sections/review-card-buyer.liquid` → `snippets/review-card-buyer.liquid`
2. **§5.9 Aggregate Rating Block** — `sections/aggregate-rating-block.liquid` computes average, stars, and distribution from the **same filtered buyer reviews** as the cards (no separate `aggregate_rating` in JSON)
3. **Fractional stars** — `snippets/review-stars-aggregate.liquid` (`linearGradient` partial fill on the next star)
4. **Sample data** — [`reviews-sample.json`](./reviews-sample.json) (8 reviews, §4.1 shape) pasted into shop metafield at runtime
5. **Test page** — `templates/page.reviews-test.json` → `/pages/reviews-test`

**Runtime data (M1 default):** `shop.metafields.custom.reviews` (JSON). The theme does not load JSON from `assets/`.

### Shop metafield setup

| | |
|--|--|
| **Owner** | Shop |
| **Namespace & key** | `custom.reviews` |
| **Type** | JSON |
| **Value** | Copy entire [`reviews-sample.json`](./reviews-sample.json) |

```liquid
{% assign reviews_data = shop.metafields.custom.reviews.value %}
{% for review in reviews_data.reviews %}
```

**Test page buyer filter:** `buyer_display_ids` in that JSON (`r01`, `r02`, `r03`, `r04`, `r08`).

### §5.9 Aggregate (M1)

Same filters as buyer cards:

1. `reviewer_type == 'buyer'`
2. `review.id` in `buyer_display_ids` (or all buyers if empty)

| Output | Source |
|--------|--------|
| Average | Sum of `rating` ÷ count (sample → **3.6**) |
| “From N reviews” | Same count (**5** on sample) |
| Distribution | 5★–1★ counts, bars max-normalized |

**Theme editor:** `average_override` (e.g. `4.3`) overrides displayed average/stars for acceptance; bars still use computed counts. Leave blank in production.

### Fractional stars (acceptance)

| Average | Stars |
|---------|--------|
| **4.3** | 4 full + 5th at **30%** |
| **3.6** (live test page) | 3 full + 4th at **60%** + 5th empty |
| **4.0** | 4 full + 1 empty |

Verify 4.3: Theme editor → **Aggregate rating block** → **Average override** → `4.3`.

### M1 key decisions

- **Shop JSON metafield** — one shape, looped in Liquid; repo JSON is reference only
- **`owns` + `owns_colors`** — parallel arrays in sample JSON (`color_hex`); card pairs by index
- **Returns badge** — `order_returned` in sample JSON; production = fulfillment check (M3+)
- **Sample pill** — `is_sample` on review; production copies from `custom.is_sample_reviewer` at submit (§4.4)
- **Outline icons** — inline SVG + product `custom.outline_image` + variant swatch color (wired in M2 theme path)

### M1 test page setup

1. Paste `reviews-sample.json` into shop metafield `custom.reviews`
2. Page handle `reviews-test`, template **page.reviews-test**
3. Open `/pages/reviews-test`

---

## Milestone 2 — Data layer + §5.5b

**Scope:** Review metaobject schema, seed guide, link inactive page, optional metaobject data source on test sections

### What was built

1. **Production schema documentation** — Review metaobject (§4.1), `custom.outline_image`, `custom.is_sample_reviewer` (Admin manual setup)
2. **Seed guide** — [`reviews-metaobject-seed.md`](./reviews-metaobject-seed.md)
3. **§5.5b** — `/pages/review-link-inactive` (expired / already submitted copy; theme-only, no App Proxy)
4. **Data source setting** — Buyer cards + aggregate: `metafield_json` (default), `metaobjects`, or `auto`

M1 test page still works on `custom.reviews` JSON by default.

### Shopify Admin checklist

Complete in **Settings → Custom data** on dev (Brian repeats on production).

#### Metaobject: `review` (handle `review`, display name Review)

Matches **15 fields** in Admin → Metaobjects → Review → Fields:

| Admin label | Field key | Shopify type | Cardinality | Required | Notes |
|-------------|-----------|--------------|-------------|----------|-------|
| Order ID | `order_id` | Single line text | One | Yes | Order GID e.g. `gid://shopify/Order/1001` |
| Reviewer type | `reviewer_type` | Choice list | One | Yes | `buyer`, `recipient`, `gifter`, `accessory` |
| Reviewer Name | `reviewer_name` | Single line text | One | Yes | e.g. `Alex Rivera`; card shows first + last initial |
| Rating | `rating` | Integer | One | Yes | 1–5 |
| Answers | `answers` | JSON | One | Yes | M1 `answers` shape (dropdowns + `prose[]`) |
| Photos | `photos` | JSON | One | No | `{ url, alt }[]`, max 4 |
| Owns | `owns` | Product | **List** | No | Product references |
| Owns colors | `owns_colors` | Product variant | **List** | No | Parallel to `owns` by index |
| gave | `gave` | JSON | One | No | Gifter only |
| Status | `status` | Choice list | One | Yes | `approved`, `hidden`, `flagged` |
| Hide reason | `hide_reason` | Choice list | One | No | spam, content violation, etc. |
| is_sample | `is_sample` | True or false | One | Yes | From customer at submit (§4.4) |
| submitted_at | `submitted_at` | Date and time | One | Yes | |
| hidden_at | `hidden_at` | Date and time | One | No | |
| flagged_at | `flagged_at` | Date and time | One | No | |

**Storefront access:** Enable metaobject entries for Liquid. JSON fields need storefront access (Admin may show a developer note — expected).

**Not in M2:** `token_issued_at`, `admin_notes`, `custom.review_count`, `custom.average_rating`

#### Product metafield (custom)

| Namespace.key | Type | Purpose |
|---------------|------|---------|
| `custom.outline_image` | File reference | Owns/Gave outline SVG (see `assets/review-outline-*.svg`) — **shape** on card |

#### Product / Variant standard metafield (Shopify category taxonomy)

| Namespace.key | Type | Purpose |
|---------------|------|---------|
| `shopify.color-pattern` | List of color-pattern (Shopify standard) | Tints the Owns icon. Define at Product **or** Variant level. No custom variant metafield is created. |

#### Customer metafield

| Namespace.key | Type | Purpose |
|---------------|------|---------|
| `custom.is_sample_reviewer` | True/false | Copied to `review.is_sample` on submit |

#### Shop metafield (M1 fallback — keep)

| Namespace.key | Type | Purpose |
|---------------|------|---------|
| `custom.reviews` | JSON | M1 test data + `buyer_display_ids` |

### JSON → metaobject mapping

| M1 JSON | Metaobject | Admin seed |
|---------|------------|------------|
| `id` | Entry **handle** (`r01`, …) | Matches `buyer_display_ids` for test page |
| `order_id` | `order_id` | GID |
| `reviewer_type` | `reviewer_type` | Choice |
| `reviewer_name.first` + `.last` | `reviewer_name` | One line: `Alex Rivera` |
| `rating` | `rating` | |
| `answers` | `answers` | Paste JSON |
| `photos` | `photos` | Paste JSON |
| `owns[]` | `owns` | Product list |
| `owns_colors[]` | `owns_colors` | Variant list (same order as `owns`) |
| `gave` | `gave` | Paste JSON (gifter) |
| `status` | `status` | `approved` for test |
| `is_sample` | `is_sample` | |
| `submitted_at` | `submitted_at` | |
| `order_returned` | **Not stored** | M3+ order lookup for returns badge |

**Theme (Build Guide §4.1 / §5.6):** Each Owns icon = that product’s **`custom.outline_image`** outline, tinted with the **recipient-picked color** from the parallel **`owns_colors` variant**. See `snippets/review-product-icon.liquid` + `snippets/review-variant-color-hex.liquid`.

**Variant color resolution order (read in `review-variant-color-hex.liquid`):**

1. Variant `shopify.color-pattern` (Shopify standard category taxonomy at variant level)
2. Product `shopify.color-pattern` matched by the variant's Color option label (current dev setup)
3. Product `shopify.color-pattern` first entry (single-color products)
4. Product Color option swatch matched by variant id
5. Product Color option swatch matched by variant option name
6. M1 shop JSON `color_hex` fallback
7. `#1F1F1E` default

**Admin setup (one of):**

- Assign products to a category that exposes `shopify.color-pattern`, then either (a) set the list at the **product** level and ensure each variant's Color option value matches a label, or (b) define `shopify.color-pattern` at the **variant** level and assign per variant.
- Or configure native **Color option swatches** under the product's Color option.

No custom `custom.color_hex` metafield is created or required.

**TEMP-DEBUG:** `snippets/review-product-icon.liquid` writes the resolved hex to `data-color-hex` on each Owns icon `<span>` for QA. Remove before M3 production.

### §5.5b Link inactive page

| URL / param | Behavior |
|-------------|----------|
| `/pages/review-link-inactive` | Template `page.review-link-inactive` |
| `?state=expired` | Expired copy (QA) |
| `?state=used` | Already submitted (QA) |
| `?order={order_id}` | Metaobject with that `order_id` → **used**; else **expired** |

**M3 deferred:** HMAC tokens, 60-day expiry, App Proxy + `custom.reviews_token_secret`

**Copy (verbatim):**

- Expired — `This link has expired.` / `Email support@myduggie.com and we'll send a fresh one.`
- Used — `This review has already been submitted.` / `Thank you for taking the time. Email support@myduggie.com if you need to make a change.`

### M2 key decisions

- **Metaobject vs order metafield** — cross-product / one-review-per-order queries (§4.1)
- **`owns` + `owns_colors`** — product + variant lists in Admin; M1 JSON keeps `color_hex` for metafield fallback only
- **`reviewer_name`** — single Admin field (e.g. `Alex Rivera`); theme splits to "Alex R." via `snippets/review-reviewer-name-parts.liquid`. M1 JSON keeps `{ first, last }`.
- **Variant color source** — Shopify standard `shopify.color-pattern` (no custom metafield)
- **§5.5b theme-only** — full token flow in M3
- **Data source** — same setting on aggregate + buyer cards (`Metaobjects` or `Auto` together)

### M2 trade-offs

| Decision | Trade-off |
|----------|-----------|
| Manual Admin schema | No scope creep vs auto-script |
| No product aggregate metafields | Liquid compute on PDP until approved |
| `order_returned` not on metaobject | Returns badge missing on metaobject cards until M3 |
| `?state=` for inactive QA | Not production token flow until M3 |

### Test URLs (dev store)

| Page | URL |
|------|-----|
| M1 test | `/pages/reviews-test` |
| Link inactive (expired) | `/pages/review-link-inactive?state=expired` |
| Link inactive (used) | `/pages/review-link-inactive?state=used` |
| Link inactive (data) | `/pages/review-link-inactive?order=gid://shopify/Order/1001` (after r01 seeded) |

---

## Milestone 3+ (deferred)

| Item | Why deferred |
|------|----------------|
| `custom.reviews_token_secret` + App Proxy | Submit + validate tokens |
| §5.1–5.4 forms, §5.5 thank-you | Form milestone |
| Klaviyo Day 14 / 28 | Email milestone |
| Admin moderation UI | Separate milestone |
| §5.10–5.12 PDP reviews surface | After cards + data layer |
| `custom.review_count`, `custom.average_rating` | Until Brian approves |
| Product aggregate rollup automation | With submit webhook |

### M3 handoff

1. App Proxy: validate token, POST review, `is_sample_reviewer` → `is_sample`
2. Four form page templates + shared sections
3. Redirect invalid/expired/used tokens to `page.review-link-inactive`
4. Optional: product aggregate metafields + sync
5. PDP: metaobject queries + Storefront API filters

### Revisit later

- Storefront API filter syntax for `owns contains product`
- Full photo lightbox
- §5.10 product-scoped aggregate (not test-page `buyer_display_ids` subset)
- §5.7 / §5.8 recipient & gifter cards (inherit buyer primitives)

---

## Theme files (reviews)

```
docs/decisions/
  reviews-milestones.md       ← this document
  reviews-sample.json
  reviews-metaobject-seed.md
  aggregate-rating-block.liquid
  review-link-inactive.liquid

snippets/
  review-card-buyer.liquid
  review-buyer-card-from-metaobject.liquid
  review-status-card.liquid
  review-product-icon.liquid
  review-variant-color-hex.liquid
  review-icon-type-from-handle.liquid
  review-stars-aggregate.liquid
  review-stars-whole.liquid
  review-date.liquid
  review-card-pill.liquid
  review-pill-icon.liquid
  …

assets/
  reviews-components.css
  review-outline-duggie.svg
  review-outline-keychain.svg
  review-outline-pipe.svg

templates/
  page.reviews-test.json
  page.review-link-inactive.json
```
