# Milestone 3 — Backend submission infrastructure

**Branch:** `usman/reviews-test`  
**Governing spec:** Build Guide §4.4, §5.1–5.5, §5.5b

## What was built

Custom Shopify app (`reviews-app/`) with App Proxy routes for token validation, session-based form context, and Review metaobject creation on submit. Theme adds all four submission forms, thank-you page, and §5.5b cookie-driven inactive state.

## Key decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Token signing secret | `REVIEWS_TOKEN_SECRET` env var | Single-store custom app; no Admin metafield bootstrap |
| Single-use enforcement | Review metaobject lookup by `order_id` | Build Guide §4.2 — gate on review storage backend |
| Order owns/colors | Lookup at `/enter`; persist from session at `/submit` | §5.1 data-in at form load; never trust browser POST for product refs |
| §5.5b state | `reviews_link_state` cookie + JS | Liquid cannot read URL query params on storefront |
| Session | HMAC-signed HttpOnly cookie, 30 min TTL | Bridge between proxy entry and theme form pages |
| Photos | Client resize (2400px / 1.5MB) → Shopify Files via staged upload | Build Guide §5.1 acceptance |
| Admin notification | Optional `REVIEWS_NOTIFY_WEBHOOK_URL` (Slack-compatible JSON) | §4.4 informational; simplest mechanism |
| Gifter `gave` | Empty array stub at M3 | Gift Flow Closing-Loop data not wired on dev store yet |
| App host | Node + Hono (not full Remix) | Proxy-only backend; minimal deploy surface |

## App Proxy routes

| Storefront | App handler |
|------------|-------------|
| `GET /apps/reviews/enter` | Validate token → session cookie → redirect form or inactive |
| `GET /apps/reviews/context` | JSON prefill for active session |
| `POST /apps/reviews/submit` | Create metaobject `status=approved` |
| `POST {APP_URL}/generate-token` | Gate QA URL minting (API key optional) |

## Env vars (`reviews-app/.env.example`)

```
SHOPIFY_SHOP_DOMAIN=myduggie-test.myshopify.com
SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_...
SHOPIFY_API_SECRET=...
REVIEWS_TOKEN_SECRET=...
GENERATE_TOKEN_API_KEY=dev-gate-key
APP_URL=https://your-app-host
REVIEWS_NOTIFY_WEBHOOK_URL=   # optional
PORT=3000
```

## Klaviyo URL contract

```
https://{{ shop.domain }}/apps/reviews/enter?order={{ order_gid_or_id }}&token={{ signed_token }}&type={{ reviewer_type }}
```

Tokens are stateless HMAC payloads — not stored server-side. Mint via `/generate-token` or CLI:

```bash
cd reviews-app && npm run generate-link -- --order 1234567890 --type buyer
```

## Theme pages (create in Admin)

| Handle | Template |
|--------|----------|
| `review-buyer` | `page.review-buyer` |
| `review-recipient` | `page.review-recipient` |
| `review-gifter` | `page.review-gifter` |
| `review-accessory` | `page.review-accessory` |
| `review-thank-you` | `page.review-thank-you` |
| `review-link-inactive` | `page.review-link-inactive` (existing) |

## Gate QA checklist

| Test | Expected |
|------|----------|
| Tamper App Proxy `signature` | 401 |
| Valid buyer token via `/enter` | Lands on buyer form; context shows order owns |
| Submit buyer review | Metaobject `approved`, correct `owns`/`owns_colors`, `is_sample` from customer metafield |
| Replay same link | §5.5b "already submitted" |
| Token with `iat` > 60 days | §5.5b "expired" |
| Recipient / gifter / accessory | Correct form + `reviewer_type` on metaobject |
| Missing required fields | Inline validation, no write |
| 5th photo | Client rejection |
| Thank-you | Verbatim §5.5 copy |

## Trade-offs

- **No Remix/OAuth app shell** — custom app uses static Admin token; fine for single merchant, revisit for public app.
- **Photo upload requires `write_files`** — fails gracefully if scope missing; document in deploy checklist.
- **Returns badge** still TEMP-DEV (`answers.order_returned`) — live fulfillment lookup deferred.

## Revisit if scope expands

- Gift Flow `gave` population for gifter submissions
- Product rollup webhook for `review_count` / `average_rating`
- Klaviyo production flow wiring
- Remove TEMP-DEBUG attrs on Owns icons
