# Admin Shopify-Overview — Design (2026-09-11)

Goal: admin unlocked view reads like a Shopify store analytics overview — metric cards, traffic breakdown, grouped settings sections. Honesty first: counters are cumulative totals with NO history, so NO deltas, trends, or sparklines-over-time (would be invented data). Everything shown is a snapshot total.

## Sections (unlocked layout, demo + real share the path)
1. **Metric cards (4)**: Total visits (sub: `X pages counted`), Most-read page (sub: `N visits · S% of traffic`), Pages with traffic (sub: `N of 7 · least: <page>`), Avg visits/page (sub: `total ÷ 7`, computed live). Reuse `.kpi` + tick system (extend tick to the 4th card automatically — same helper).
2. **Traffic card**: existing spark chart (gold peak) + NEW per-page horizontal bars: label + `.sharebar` + visits, most-read first. Reuses sharebar CSS; rows link to pages.
3. **Pages table**: keep rank medals + share columns (drop the visual sharebar column? No — keep; table stays the detailed view, traffic bars are the glanceable one. Hmm, duplication... decision: table KEEPS Share % text, DROPS its sharebar visual column (traffic card owns visuals now). Cleaner, no double-ink.)
4. **Settings groups** (Shopify-settings feel): `Data health` card (existing checks), `Access` card (lock button + session note + backend row + demo exit when in demo). Section heads (`Traffic`, `Pages`, `Data`, `Access`) via existing `.shead` language.
5. Grid: main = metrics + traffic + table; rail = health + access. Vault login, demo fence, banner, security — all unchanged.

## Invariants
- Auth/fetch/noindex/no-links/tab-key identical; demo fenced mock + banner; data untouched; 927×3; zero third-party; light theme; reduced-motion; api/count.js untouched. No invented history — every number from `pages` rollup or dataset.
