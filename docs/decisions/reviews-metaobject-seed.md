# Review metaobject — seed guide

Create **Review** metaobject entries in Admin. Schema: [`reviews-milestones.md`](./reviews-milestones.md) (M2 checklist).

**Show on `/pages/reviews-test` when:** `reviewer_type` = `buyer`, `status` = `approved`.

---

## Field quick reference

| Field | Notes |
|-------|--------|
| Handle | Any unique id (e.g. `r01`, `444`) |
| `reviewer_name` | One line → card shows first + last initial |
| `answers` | JSON below |
| `owns` / `owns_colors` | Same length, same index order |
| `is_sample` | `true` → Sample pill; `false` → Verified only |
| `photos` | `[{ "url": "…", "alt": "…" }]` or `[]` |

### `answers` JSON

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
      "body": "…"
    }
  ]
}
```

Blank `prose[].body` → that block hidden. Optional keys: `wish_different` / `anything_else` prose objects with `"body": ""`.

**Returns badge (TEMP-DEV until M3):** add `"order_returned": true` in `answers` (not a §4.1 metaobject field). Theme: `review-buyer-card-from-metaobject.liquid`.

---

## Dev store QA (what we seeded)

| Handle | Purpose | `is_sample` | `answers` notes |
|--------|---------|-------------|-----------------|
| `444` | Sparse prose (1 block) + **Order returned** | `false` | `order_returned: true`, one prose `body` filled |
| `987` | Sparse prose (2 blocks) + Sample pill | `true` | Two prose `body` filled, third empty/omitted |
| `r03222` | Full prose, no Sample | `false` | Three prose blocks filled |
| `r01` | Full card / Sample contrast | `true` | Normal full review |

**Combined JSON used on `444`** (sparse + returns in one entry):

```json
{
  "how_often": "Daily",
  "where_it_lives": "Pocket carry",
  "dugout_experience": "Dugout veteran",
  "order_returned": true,
  "prose": [
    {
      "prompt_key": "surprised",
      "label": "What surprised you?",
      "display_label": "What surprised you?",
      "body": "Only one prose block — others must not render."
    },
    {
      "prompt_key": "wish_different",
      "label": "Anything you wish were different?",
      "display_label": "Anything you wish were different?",
      "body": ""
    },
    {
      "prompt_key": "anything_else",
      "label": "Anything else?",
      "display_label": "Anything else?",
      "body": ""
    }
  ]
}
```

---

## `owns` + `owns_colors`

Two products → two variants, same order. Per product: `custom.outline_image` + variant color (swatches or `shopify.color-pattern`).

---

## Verify

`/pages/reviews-test` — all approved buyers render; aggregate uses the same set.
