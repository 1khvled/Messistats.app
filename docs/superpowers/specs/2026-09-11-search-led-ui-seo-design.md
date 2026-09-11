# Search-led UI + SEO pass — Design (2026-09-11)

Goal: the best UI this site can get that brings views, works, and ranks — with
zero AI slop. Direction: search-led polish in place (approach A).

User decisions (2026-09-11): WORK = fix all interactions; views = Google
search first; scope = home + goals-by-year + dashboard.

## Architecture (unchanged)

Static Vite multi-page. `src/app.js` sole renderer branching on
`body[data-page]`; `src/styles.css` plain CSS, no second system, no new deps.
`public/data/messi-data.json` is the ONLY source of truth; no automation
writes totals. Admin page untouched except staying hidden + working.

## Section 1 — WORK: every interaction on home / year / dashboard functions

- Sort on all tables (`sortable()`, `aria-sorted`, `tr.total` pinned); live
  filters with honest empty-states (`tableSearch()`).
- Dashboard team pills re-cut every chart; `?team=` deep-links resolve on boot.
- Charts render peak (2012, gold) + provisional (2026, faded) states intact.
- Counter + admin degrade silently with zero console errors sans backend.
- Keyboard operable (Enter on headers, `:focus-visible` gold outline); 390px
  with no page overflow; crest/img `onerror` fallbacks; reduced-motion safe.

## Section 2 — SEO: one query per page

- Home: "how many goals has Messi scored" (927 / 1,172 / 46 / 8).
- Year: "Messi goals 2012 / by year" (91, running totals, ages, YEAR_NOTES).
- Dashboard: "Messi goals by competition / free kicks / left foot".
- H1 kept as the query; H2s phrased as real questions; FAQ answers quotable
  with the number first. JSON-LD kept truthful; `dateModified` bumped only on
  real data changes. Internal link mesh: every section links to the page that
  answers the follow-up question. OG tags verified against the real
  `public/img/og-messi.jpg`. Sitemap stays 6 public pages; admin stays out.
  Placeholder canonical host flagged, never silently shipped.

## Section 3 — UI polish, hard no-slop rule

- De-glass `styles.css`: flat editorial paper, solid surfaces, hairline
  borders, no backdrop-blur, no page-wide gradients. Gold reserved for
  records/honours; Blaugrana/albiceleste sparing (badges, peak bars,
  keylines). Typography carries the design: balanced headings, tightened
  measure, tabular numerals in tables/KPIs. Existing count-up + reveal kept,
  reduced-motion safe; no new animation systems.

## Error handling

Missing crest/img → CSS-badge fallback, never a broken image. No backend →
lede + fallback caveat, tables hidden, zero console errors. `matchday.js` +
`ads.js` stay disabled (zero third-party default).

## Verification (throwaway, never committed tests)

`npm run build` clean; `npm run verify` exit 0 (927×3 checksums, staged rows
flagged not applied); Playwright sweep of the 3 pages (KPIs, sort, filter,
pills, 390px overflow, 0 console errors).

## Non-goals

No data edits (totals by hand with citations only). No exact visual copy of
any reference site (copyrighted); same depth, original code. No dark/glass
revert. No committed tests for static rendering.
