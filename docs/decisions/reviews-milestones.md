# Reviews System — Milestones (architecture decisions)

**Governing spec:** Build Guide §3–§5 — [`docs/client docs/ReviewsSystemBuildGuide.md`](../client%20docs/ReviewsSystemBuildGuide.md)  
**Branch:** `usman/reviews-test` (M1 UI + M2 data layer)

**Related:** [`reviews-metaobject-seed.md`](./reviews-metaobject-seed.md) (Admin seeding)

---

## Milestone 1 — Buyer card + aggregate (UI)

**Scope:** §5.6 Buyer Review Card + §5.9 Aggregate Rating Block (presentation only).

### What was built

1. **§5.6 Buyer Review Card** — `sections/review-card-buyer.liquid` → `snippets/review-card-buyer.liquid`
2. **§5.9 Aggregate Rating Block** — `sections/aggregate-rating-block.liquid` → `snippets/aggregate-rating-block.liquid`
3. **Fractional stars** — `snippets/review-stars-aggregate.liquid`
4. **Test page** — `templates/page.reviews-test.json` → `/pages/reviews-test`
5. **Post-M1 tweak** — distribution bar fill `#B0B0AD` (`--reviews-bar-fill` in `reviews-components.css`)

### M1 data (removed)

M1 used a temporary **shop JSON metafield** (`custom.reviews`) and `reviews-sample.json` to demo the UI. That path has been **removed**; the theme now reads **Review metaobjects only** (M2).

### §5.9 Aggregate behavior

Computes from all **approved buyer** Review metaobjects (same filter as cards):

| Output | Source |
|--------|--------|
| Average | Sum of `rating` ÷ count |
| “From N reviews” | Same count |
| Distribution | 5★–1★ counts, bars max-normalized |

**Theme editor:** `average_override` (e.g. `4.3`) overrides displayed average/stars for acceptance; bars still use computed counts.

### Fractional stars (acceptance)

| Average | Stars |
|---------|--------|
| **4.3** | 4 full + 5th at **30%** |
| **4.0** | 4 full + 1 empty |

Verify: Theme editor → **Aggregate rating block** → **Average override** → `4.3`.

**Distribution bars (Brian M2 pivot):** fill-only `#B0B0AD` bars normalized to max star count; zero-count rows show label + `0` with no bar. No grey track.

---

## Milestone 2 — Data layer + §5.5b

**Scope:** Production Review metaobject schema, seed guide, link inactive page, metaobject-only theme data path.

### M2 deliverables checklist

| Deliverable | Status | Notes |
|-------------|--------|-------|
| Review metaobject §4.1 (15 fields, `owns` list product ref, `owns_colors` list variant ref) | Done | Admin + theme |
| `status` enum `approved` / `hidden` / `flagged` | Done | Test page filters `approved` |
| `hide_reason` values | Done | spam, content violation, reviewer requested removal, other |
| `is_sample` boolean | Done | Sample pill on card |
| Product `custom.outline_image` | Done | Theme reads for Owns shape |
| Product `custom.review_count`, `custom.average_rating` | **Admin schema** (M2) | Define in Custom data; theme read/sync on PDP in M3+ |
| Customer `custom.is_sample_reviewer` §4.4 | Done (Admin) | Copied to `review.is_sample` on submit in M3 |
| §5.5b `/pages/review-link-inactive` | Done | Conditional copy + Thank-You layout |
| Token-driven URL state | **M3** | M2: section **Preview state** for QA |

### What was built (theme + docs)

1. **Schema docs + seed guide** — [`reviews-metaobject-seed.md`](./reviews-metaobject-seed.md)
2. **§5.5b** — `page.review-link-inactive`, `review-link-inactive.liquid`, `review-status-card.liquid`
3. **Metaobject adapter** — `review-buyer-card-from-metaobject.liquid` (+ color/outline helpers)
4. **Removed** — shop `custom.reviews` JSON path, `reviews-sample.json`, section **Data source** dropdown

### Shopify Admin checklist

Complete in **Settings → Custom data** on dev (Brian repeats on production).

#### Metaobject: `review`

| Admin label | Field key | Shopify type | Cardinality | Notes |
|-------------|-----------|--------------|-------------|-------|
| Order ID | `order_id` | Single line text | One | Order GID |
| Reviewer type | `reviewer_type` | Choice list | One | buyer, recipient, gifter, accessory |
| Reviewer Name | `reviewer_name` | Single line text | One | e.g. `Alex Rivera` → "Alex R." on card |
| Rating | `rating` | Integer | One | 1–5 |
| Answers | `answers` | JSON | One | dropdowns + `prose[]` |
| Photos | `photos` | JSON | One | `{ url, alt }[]`, max 4 |
| Owns | `owns` | Product | **List** | Product references |
| Owns colors | `owns_colors` | Product variant | **List** | Parallel to `owns` by index |
| gave | `gave` | JSON | One | Gifter |
| Status | `status` | Choice list | One | approved, hidden, flagged |
| Hide reason | `hide_reason` | Choice list | One | spam, content violation, etc. |
| is_sample | `is_sample` | True or false | One | From customer at submit (M3) |
| submitted_at | `submitted_at` | Date and time | One | |
| hidden_at | `hidden_at` | Date and time | One | |
| flagged_at | `flagged_at` | Date and time | One | |

**Storefront access:** ON for metaobject + JSON fields.

**Not on metaobject in M2:** `token_issued_at`, `admin_notes`

#### Product metafields (custom)

| Namespace.key | Type | Theme M2 |
|---------------|------|----------|
| `custom.outline_image` | File reference | **Reads** — Owns icon shape |
| `custom.review_count` | Integer | Admin only; PDP in M3+ |
| `custom.average_rating` | Number | Admin only; PDP in M3+ |

#### Customer metafield

| Namespace.key | Type | Purpose |
|---------------|------|---------|
| `custom.is_sample_reviewer` | True/false | → `review.is_sample` on submit (M3) |

### Owns icon (§4.1 / §5.6)

Shape: `custom.outline_image` (CSS mask). Color: parallel `owns_colors` variant → `review-variant-color-hex.liquid` (`shopify.color-pattern` or swatches).

**TEMP-DEBUG:** `data-color-hex` on Owns icons — remove before M3 prod.

### §5.5b Link inactive page

**Page:** `/pages/review-link-inactive`

**M2 state selection:** Theme editor → **Review link inactive** → **Preview state** (Expired / Already submitted). URL `?state=` / `?order=` do **not** reach theme Liquid.

**M3:** App Proxy + token validation → redirect with server-side state.

**Copy (verbatim):** Expired + Used headings/bodies per Build Guide §5.5b; `mailto:support@myduggie.com`.

### Test URLs (dev store)

| Page | URL |
|------|-----|
| Reviews test | `/pages/reviews-test` |
| Link inactive | `/pages/review-link-inactive` (set Preview state in theme editor) |

---

## Milestone 3+ (deferred)

| Item | Notes |
|------|--------|
| App Proxy + `custom.reviews_token_secret` | Submit, validate tokens |
| §5.1–5.4 forms, §5.5 thank-you | Form milestone |
| `is_sample_reviewer` → `is_sample` on submit | |
| Theme read `review_count` / `average_rating` on PDP | + rollup webhook |
| §5.7 / §5.8 recipient & gifter cards | |
| §5.10–5.12 PDP reviews surface | Product-scoped queries |
| Photo lightbox | |
| Aggregate empty state (0 reviews) | M6 — hide block + “Be the first to review” (not in Build Guide yet) |

---

## Theme files (reviews)

```
docs/decisions/
  reviews-milestones.md
  reviews-metaobject-seed.md

sections/
  review-card-buyer.liquid
  aggregate-rating-block.liquid
  review-link-inactive.liquid

snippets/
  review-card-buyer.liquid
  review-buyer-card-from-metaobject.liquid
  review-status-card.liquid
  aggregate-rating-block.liquid
  review-product-icon.liquid
  review-variant-color-hex.liquid
  review-product-outline-url.liquid
  review-reviewer-name-parts.liquid
  review-icon-type-from-handle.liquid
  review-stars-aggregate.liquid
  …

assets/
  reviews-components.css
  review-outline-*.svg

templates/
  page.reviews-test.json
  page.review-link-inactive.json
```
