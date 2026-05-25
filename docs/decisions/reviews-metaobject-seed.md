# Review metaobject — seed guide (M2)

Map [`reviews-sample.json`](./reviews-sample.json) into **Review** metaobject entries on the dev store. Run after completing the Admin checklist in [`reviews-milestones.md`](./reviews-milestones.md) (Milestone 2).

---

## Prerequisites

1. Metaobject type `review` exists with all §4.1 fields.
2. Dev store has products whose **handles** match sample data (or adjust `owns` picks in Admin):
   - `the-lil-duggie`
   - `the-none-better-keychain`
   - (others per your catalog)
3. Keep shop metafield `custom.reviews` populated with the same JSON for M1 fallback / `buyer_display_ids`.

---

## Per-entry checklist

For each row in `reviews-sample.json` → **Content → Metaobjects → Review → Add entry**.

| Sample id | order_id | reviewer_type | Seed on test page? |
|-----------|----------|---------------|-------------------|
| r01 | gid://shopify/Order/1001 | buyer | Yes (`buyer_display_ids`) |
| r02 | gid://shopify/Order/1002 | buyer | Yes |
| r03 | gid://shopify/Order/1003 | buyer | Yes |
| r04 | gid://shopify/Order/1004 | buyer | Yes |
| r05 | gid://shopify/Order/1005 | recipient | Optional (§5.7 later) |
| r06 | gid://shopify/Order/1006 | gifter | Optional (§5.8 later) |
| r07 | gid://shopify/Order/1007 | accessory | Optional |
| r08 | gid://shopify/Order/1008 | buyer | Yes |

**Minimum for M2 acceptance:** Seed at least **r01–r04 + r08** (five buyers in `buyer_display_ids`).

---

## Field mapping (example: r01)

| Metaobject field | Value |
|------------------|-------|
| Handle | `r01` (recommended — matches sample id) |
| `order_id` | `gid://shopify/Order/1001` |
| `reviewer_type` | `buyer` |
| `reviewer_name` | `Alex Rivera` (single field; theme splits to "Alex R." on the card) |
| `rating` | `5` |
| `answers` | Copy entire `answers` object from JSON |
| `photos` | Copy `photos` array from JSON |
| `owns` | Multi-select products (Lil' Duggie + Keychain) |
| `owns_colors` | Multi-select **variants** — one variant per `owns` product, same order |
| `gave` | Leave empty for buyers |
| `status` | `approved` |
| `is_sample` | `false` |
| `submitted_at` | `2026-05-10T14:00:00Z` |

Repeat for r02–r08 using the JSON file.

---

## `owns` + `owns_colors` setup

Per Build Guide §4.1 — `owns` is a list of **product references**; `owns_colors` is a list of **variant references** in the same order (the recipient-picked color for each owned product).

1. In the metaobject entry, **`owns`** → multi-select the products (Lil' Duggie, Keychain, …).
2. **`owns_colors`** → multi-select **one variant per product**, same index order.
3. Per product in `owns`: set the **`custom.outline_image`** file metafield (filled silhouette SVG — see `assets/review-outline-*.svg` as reference).
4. Per product: assign Shopify's standard **`shopify.color-pattern`** (Category → Color) so each variant's Color option value (e.g. `Red`, `Black`) matches a label in that list. The theme reads the matching color's hex automatically.
   - **Or** configure **Color option swatches** under the product's Color option (Admin → Products → Color option → Edit swatches).

---

## Verify metaobject wire-up

1. Theme editor → **Buyer review cards** + **Aggregate rating block** → **Data source** → `Metaobjects` or `Auto` (use the same on both sections).
2. Open `/pages/reviews-test` — cards should match seeded entries.
3. Inspect any Owns icon → `data-color-hex` attribute (temporary QA attr) should show the resolved variant hex (e.g. `#cc0000` for Red).
4. Open `/pages/review-link-inactive?order=gid://shopify/Order/1001` — should show **already submitted** after r01 exists *(note: `?order=` requires App Proxy in M3; use theme editor Preview state for QA today)*.

---

## `buyer_display_ids` with metaobjects

Leave `buyer_display_ids` in shop metafield `custom.reviews`:

```json
"buyer_display_ids": ["r01", "r02", "r03", "r04", "r08"]
```

Sections filter metaobject entries by **handle** when it equals `r01`, etc. Set entry handles to match sample ids.

**Note:** If aggregate shows zero but cards render, set the same **Data source** on both sections (e.g. both `Metaobjects` or both `Auto`).
