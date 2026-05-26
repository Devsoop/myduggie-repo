# Review metaobject — seed guide

Create **Review** metaobject entries in Admin for dev/testing. Complete the Admin checklist in [`reviews-milestones.md`](./reviews-milestones.md) first.

---

## Prerequisites

1. Metaobject type `review` exists with all §4.1 fields (storefront access enabled).
2. Catalog products exist for `owns` picks (e.g. Lil' Duggie, Keychain).
3. Per product: `custom.outline_image` and color setup (`shopify.color-pattern` or Color swatches).

---

## Create entries

**Content → Metaobjects → Review → Add entry**

Show on `/pages/reviews-test` when:

- `reviewer_type` = `buyer`
- `status` = `approved`

Recipient / gifter / accessory entries are stored but hidden until §5.7 / §5.8 cards exist.

**Minimum for testing:** At least one approved buyer entry (handle can be anything).

---

## Example buyer entry

| Metaobject field | Example |
|------------------|---------|
| Handle | `r01` (optional; any unique handle) |
| `order_id` | `gid://shopify/Order/1001` |
| `reviewer_type` | `buyer` |
| `reviewer_name` | `Alex Rivera` |
| `rating` | `5` |
| `answers` | JSON — see shape below |
| `photos` | JSON array `[{ "url": "https://…", "alt": "…" }]` or empty |
| `owns` | Multi-select products |
| `owns_colors` | Multi-select **variants** — one per `owns` product, **same order** |
| `gave` | `[]` for buyers |
| `status` | `approved` |
| `is_sample` | `false` (or `true` to test Sample pill) |
| `submitted_at` | e.g. `2026-05-10T14:00:00Z` |

### `answers` JSON shape

```json
{
  "how_often": "Daily",
  "where_it_lives": "Pocket carry",
  "dugout_experience": "Dugout veteran",
  "prose": [
    {
      "prompt_key": "surprised",
      "label": "What surprised you?",
      "display_label": "What surprised you?",
      "body": "Slate Blue reads warmer in person."
    },
    {
      "prompt_key": "anything_else",
      "label": "Anything else? (Optional)",
      "display_label": "Anything else?",
      "body": ""
    }
  ]
}
```

Blank `prose[].body` hides that block on the card (M1 revision #6).

---

## `owns` + `owns_colors`

Per Build Guide §4.1 — parallel lists by **index**:

1. **`owns`** → products the reviewer owns.
2. **`owns_colors`** → one **variant** per product (recipient-picked color).
3. Counts must match (2 products → 2 variants).

---

## Verify on storefront

1. Open `/pages/reviews-test` — all **approved buyer** metaobjects render; aggregate matches the same set.
2. Owns icons: filled `outline_image` + variant color (inspect `data-color-hex` if TEMP-DEBUG attrs still present).
3. Link inactive: theme editor → **Preview state** on `review-link-inactive` section → `/pages/review-link-inactive`.

---

## Removed: shop JSON metafield

The theme no longer reads `shop.metafields.custom.reviews`. All test/production card data comes from **Review metaobjects** only.
