# Reviews sample data

## Canonical file

**`reviews-sample.json`** — full §4.1-shaped catalog (8 reviews: buyer, recipient, gifter, accessory).

This file is committed so reviewers can see the exact JSON shape. **Paste the entire file** into the shop metafield:

| Setting | Value |
|---------|--------|
| Owner | Shop |
| Namespace & key | `custom.reviews` |
| Type | JSON |

In Liquid:

```liquid
{% assign reviews_data = shop.metafields.custom.reviews.value %}
{% for review in reviews_data.reviews %}
```

## What renders on the test page

- Section loops `reviews_data.reviews`
- Only `reviewer_type == 'buyer'`
- Only IDs listed in `buyer_display_ids` inside the JSON (r01, r02, r03, r04, r08) unless overridden in section settings

## M2

Replace `shop.metafields.custom.reviews` with **Review metaobject** queries. Same `review-card-buyer` snippet; only the section assign line changes.
