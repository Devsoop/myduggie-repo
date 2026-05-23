# MyDuggie — Shopify Theme (Horizon)

Custom Shopify Online Store 2.0 theme based on **Horizon 3.5.1**, including the **Reviews System Milestone 1** work (buyer review cards + aggregate rating block).

| | |
|--|--|
| **Dev store** | `myduggie-test.myshopify.com` (see `shopify.theme.toml`) |
| **Milestone branch** | `usman/reviews-test` |
| **Architecture doc** | [`docs/decisions/test-milestone.md`](docs/decisions/test-milestone.md) |

---

## Prerequisites

- [Shopify CLI](https://shopify.dev/docs/api/shopify-cli) 3.x (`shopify version`)
- Access to the **myduggie-test** dev store (collaborator or staff account)
- Git

No `npm install` — this is a theme repo, not a Node app.

---

## Quick start

### 1. Clone and open the theme

```bash
git clone <your-repo-url>
cd myduggie-repo
git checkout usman/reviews-test   # reviews milestone work
```

### 2. Log in to Shopify

```bash
shopify auth login
```

### 3. Start local theme dev

The repo pins the store in `shopify.theme.toml`:

```toml
[environments.store]
store = "myduggie-test.myshopify.com"
```

Run:

```bash
shopify theme dev -e store
```

CLI uploads changes to a **development theme** and prints a preview URL. Edit Liquid/CSS; the browser hot-reloads.

**Other useful commands:**

```bash
shopify theme push -e store          # push to dev theme
shopify theme push -e store --live   # publish (use with care)
shopify theme check                  # Theme Check lint
```

---

## Reviews test page (Milestone 1)

### 1. Shop metafield

In **Shopify Admin → Settings → Custom data → Shop**, create (or edit):

| Setting | Value |
|---------|--------|
| Namespace & key | `custom.reviews` |
| Type | **JSON** |
| Value | Paste full contents of [`docs/decisions/reviews-sample.json`](docs/decisions/reviews-sample.json) |

The theme reads runtime data only from this metafield — not from files in the repo.

### 2. Create the page

**Online Store → Pages → Add page**

- **Title:** Reviews test (or any title)
- **Handle:** `reviews-test`
- **Theme template:** `page.reviews-test`

### 3. Open the preview

While `shopify theme dev` is running, visit:

```
https://myduggie-test.myshopify.com/pages/reviews-test
```

You should see:

- **Aggregate block** — average + distribution from the five buyer reviews in `buyer_display_ids` (sample → 3.6 avg, 5 reviews)
- **Buyer review cards** — r01, r02, r03, r04, r08

### 4. Optional: verify 4.3 fractional stars

Theme editor → **Aggregate rating block** section → **Average override** → `4.3`  
(Four full stars + 30% fill on the fifth; see `docs/decisions/test-milestone.md`.)

---

## Reviews milestone — key files

```
docs/decisions/
  test-milestone.md           # Architecture & acceptance notes
  reviews-sample.json         # Sample JSON → paste into shop metafield

sections/
  review-card-buyer.liquid
  aggregate-rating-block.liquid

snippets/
  review-card-buyer.liquid
  review-stars-aggregate.liquid
  review-stars-whole.liquid
  review-date.liquid
  review-product-icon.liquid
  …

assets/
  reviews-components.css

templates/
  page.reviews-test.json
```

---

## Repo layout (theme)

Standard Shopify theme directories:

| Directory | Purpose |
|-----------|---------|
| `assets/` | CSS, JS, images |
| `blocks/` | Theme blocks |
| `config/` | `settings_schema.json`, `settings_data.json` |
| `layout/` | Theme layouts |
| `locales/` | Translations |
| `sections/` | Sections |
| `snippets/` | Reusable Liquid snippets |
| `templates/` | JSON templates |

---

## Documentation

- **Milestone 1 decisions:** [`docs/decisions/test-milestone.md`](docs/decisions/test-milestone.md)
- **Shopify theme docs:** https://shopify.dev/docs/storefronts/themes

---

## Notes

- **M2+ (not in this milestone):** Review metaobjects, submit flow, App Proxy, product-page filters — see architecture doc.
- Keep store credentials and `.env` files out of git; use Shopify CLI auth only.
