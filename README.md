# MyDuggie — Shopify Theme (Horizon)

Custom Shopify Online Store 2.0 theme based on **Horizon 3.5.1**, including the **Reviews System** (buyer review cards, aggregate block, M2 data layer, **M3 submission forms**).

| | |
|--|--|
| **Dev store** | `myduggie-test.myshopify.com` (see `shopify.theme.toml`) |
| **Milestone branch** | `usman/reviews-test` |
| **Architecture docs** | [`docs/decisions/reviews-milestones.md`](docs/decisions/reviews-milestones.md) · [`docs/decisions/reviews-milestone-3.md`](docs/decisions/reviews-milestone-3.md) |
| **Submission app** | Separate repo: `myduggie-app` (App Proxy backend) |

---

## Prerequisites

- [Shopify CLI](https://shopify.dev/docs/api/shopify-cli) 3.x
- Access to the **myduggie-test** dev store
- Git
- **M3 E2E:** `myduggie-app` deployed with App Proxy registered (see app README)

No `npm install` in theme repo.

---

## Quick start

```bash
git clone <your-repo-url>
cd myduggie
git checkout usman/reviews-test
shopify auth login
shopify theme dev -e store
```

---

## Reviews test page (M1–M2)

**Handle:** `reviews-test` · **Template:** `page.reviews-test` · **URL:** `/pages/reviews-test`

Seed metaobjects per [`docs/decisions/reviews-metaobject-seed.md`](docs/decisions/reviews-metaobject-seed.md).

---

## Review submission (M3)

### Admin pages to create

| Handle | Template |
|--------|----------|
| `review-buyer` | `page.review-buyer` |
| `review-recipient` | `page.review-recipient` |
| `review-gifter` | `page.review-gifter` |
| `review-accessory` | `page.review-accessory` |
| `review-thank-you` | `page.review-thank-you` |
| `review-link-inactive` | `page.review-link-inactive` |

### E2E test flow

1. Deploy `myduggie-app` + confirm App Proxy (`/apps/reviews/*`)
2. Generate link: `POST /generate-token` on app (see [`reviews-milestone-3.md`](docs/decisions/reviews-milestone-3.md))
3. Open entry URL → lands on form with order context
4. Submit → thank-you page → Review metaobject in Admin

**Klaviyo links must use:** `/apps/reviews/enter?order=…&token=…&type=…` — not theme page URLs with query params.

---

## Link inactive (§5.5b)

- **URL:** `/pages/review-link-inactive`
- **Live:** App Proxy sets `reviews_link_state` cookie before redirect
- **Theme editor QA:** Preview state (design mode only)

---

## Key files

```
docs/decisions/reviews-milestones.md
docs/decisions/reviews-milestone-3.md
docs/decisions/reviews-metaobject-seed.md

sections/review-form-*.liquid
sections/review-thank-you.liquid
sections/review-link-inactive.liquid
sections/review-card-buyer.liquid
sections/aggregate-rating-block.liquid

assets/reviews-form.js
assets/reviews-components.css

templates/page.review-*.json
templates/page.reviews-test.json
```

---

## Notes

- Display layer reads **Review metaobjects only** (shop JSON sample path removed in M2).
- Token signing: app env `REVIEWS_TOKEN_SECRET` — not a shop metafield.
- M4+: PDP reviews surface, rollup webhook — see milestones doc.
