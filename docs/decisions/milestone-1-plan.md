# None Better Reviews — Milestone 1 Plan (Reference)

See **`test-milestone.md`** for architecture decisions delivered with this milestone.

## Scope summary

- §5.6 Buyer Review Card (Liquid section + snippets)
- §5.9 Aggregate Rating Block (Liquid section + snippets)
- Sample data (`data/reviews-sample.json`, synced assigns)
- Test template `page.reviews-test`
- Architecture doc at `docs/decisions/test-milestone.md`

## Out of scope

Forms, metaobjects, App Proxy, other card types, filters, Klaviyo, admin UI, lightbox library.

## Locked architecture (May 2026 client alignment)

- Metaobject per review; typed `list.product_reference` for `owns`
- Liquid initial render; JS filters later
- Customer `is_sample_reviewer` → review `is_sample` at submit
- Admin UI Extension for moderation (later)

## 7-day schedule (reference)

| Day | Work |
|-----|------|
| 1 | Branch, JSON schema, tokens, stubs |
| 2 | Buyer card core |
| 3 | Usage, prose, photos, responsive |
| 4 | Aggregate block + half-star |
| 5 | Test page + section settings |
| 6 | Architecture doc + QA checklist |
| 7 | Submit URL + repo |

## Acceptance highlights

- All §5.6 / §5.9 elements on test page without devtools
- 4.3 average with half-star SVG gradient
- Distribution bars normalized to **max** count; zero rows visible
- Owns icons use **data** `color_hex`, not theme defaults
- Swap sample data without editing section Liquid
