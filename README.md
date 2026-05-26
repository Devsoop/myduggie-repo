# MyDuggie — Shopify Theme (Horizon)

Custom Shopify Online Store 2.0 theme based on **Horizon 3.5.1**, including the **Reviews System** (buyer review cards, aggregate block, M2 data layer).

| | |
|--|--|
| **Dev store** | `myduggie-test.myshopify.com` (see `shopify.theme.toml`) |
| **Milestone branch** | `usman/reviews-test` |
| **Architecture doc** | [`docs/decisions/reviews-milestones.md`](docs/decisions/reviews-milestones.md) |

---

## Prerequisites

- [Shopify CLI](https://shopify.dev/docs/api/shopify-cli) 3.x
- Access to the **myduggie-test** dev store
- Git

No `npm install` — theme repo only.

---

## Quick start

```bash
git clone <your-repo-url>
cd myduggie-repo
git checkout usman/reviews-test
shopify auth login
shopify theme dev -e store
```

Store is pinned in `shopify.theme.toml` → `myduggie-test.myshopify.com`.

---

## Reviews test page

### 1. Admin setup

Follow [`docs/decisions/reviews-milestones.md`](docs/decisions/reviews-milestones.md) (M2 checklist) and seed entries per [`docs/decisions/reviews-metaobject-seed.md`](docs/decisions/reviews-metaobject-seed.md):

- Metaobject type **Review** (§4.1 fields, storefront access ON)
- Product `custom.outline_image`, `custom.review_count`, `custom.average_rating`
- Customer `custom.is_sample_reviewer`
- At least one **approved buyer** metaobject entry

### 2. Create the page

**Online Store → Pages**

- **Handle:** `reviews-test`
- **Theme template:** `page.reviews-test`

### 3. Preview

```
/pages/reviews-test
```

Shows all **approved buyer** Review metaobjects + aggregate computed from the same set.

**Optional:** Theme editor → **Aggregate rating block** → **Average override** → `4.3` (fractional star QA).

---

## Link inactive page (§5.5b)

- **Handle:** `review-link-inactive`
- **Template:** `page.review-link-inactive`
- **QA:** Theme editor → **Review link inactive** → **Preview state** → Expired or Already submitted → Save
- **URL:** `/pages/review-link-inactive` (query params do not reach theme Liquid)

---

## Key files

```
docs/decisions/reviews-milestones.md
docs/decisions/reviews-metaobject-seed.md

sections/review-card-buyer.liquid
sections/aggregate-rating-block.liquid
sections/review-link-inactive.liquid

snippets/review-buyer-card-from-metaobject.liquid
snippets/review-card-buyer.liquid
…

templates/page.reviews-test.json
templates/page.review-link-inactive.json
```

---

## Documentation

- **Reviews milestones:** [`docs/decisions/reviews-milestones.md`](docs/decisions/reviews-milestones.md)
- **Shopify theme docs:** https://shopify.dev/docs/storefronts/themes

---

## Notes

- M3+: forms, App Proxy submit, PDP surface — see milestones doc.
- Keep credentials out of git; use Shopify CLI auth only.
