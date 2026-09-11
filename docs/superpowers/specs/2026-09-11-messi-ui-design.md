# Messi-Stats UI Improvements — Design (2026-09-11)

Goal: keep ronaldostats.app depth/structure inspiration, ship a better Messi UI. Direction A: incremental polish in place, order home → dashboard → identity.

## Architecture
- No new deps, no framework change. Static Vite multi-page, `src/app.js` sole renderer branching on `body[data-page]`, `src/styles.css` plain CSS, thin HTML shells with empty mounts.
- `public/data/messi-data.json` is the ONLY source of truth. No automation writes totals.

## Section 1 — Homepage hero + readability
- Files: `index.html` mounts (`#profile`, `#kpis`, `#qa`, `#club-card`, `#year-widget`, `#records`, `#silver`, `#split`, `#faq`), `renderHome()` in `src/app.js`, CSS `.identity/.kpi/.qa/.data-table/.chart-card`.
- Tighter identity card (148px photo + credit), 4-up KPIs (927/1,172/400/46 + GPG), 3-up Q&A density, club table with existing `sortable()` + `tableSearch()` (`tr.total` pinned, aria-sorted), year bars via `sparkSVG()` with peak/provisional states.
- Mobile: in-card horizontal scroll + edge fade, 44px targets, single-column ≤560px (existing responsive pattern).

## Section 2 — Charts + dashboard interactivity
- Files: `renderByYear()`, `renderBySeason()`, `renderDashboard()` in `src/app.js`; `.hbar/.donut/.pill` styles.
- Year chart: 2012 peak gold bar (91), 2026 provisional faded bar, cumulative line to 927, `YEAR_NOTES` margin notes stay.
- Dashboard: team filter pills, `donutSVG()` finish (752/109/66) + body (740/150/27/10) with provisional caveat inline, competition table (12 rows, sums 927).
- States: sort arrows + `aria-sorted`, live-filter empty note, reduced-motion safe reveal/count-up.

## Section 3 — Messi identity + trust
- Tokens in `src/styles.css`: `--hero-grad` Blaugrana diagonal, albiceleste sky primary, `--gold` records/honours only. Light editorial paper kept; no dark/glass revert.
- Timeline `ERA_INTRO` fan openers + `ERA_PHOTOS` (user-installed) stay; method colophon first-person stays; provisional caveat next to 109/66/57/400 everywhere.
- Structure inspiration only from ronaldostats.app; no copied code, images, or text.

## Error handling
- Missing crest/img → `onerror` CSS-badge fallback; no broken images.
- No backend (local/file/ad-block) → counters/charts degrade to lede + fallback caveat, tables hidden, zero console errors.
- `taste`-style scraping: out of scope; `matchday.js` + `ads.js` stay disabled (zero third-party default).

## Verification (throwaway, not committed tests)
- `npm run build` clean; `npm run verify` exit 0 (927×3 checksums, staged rows flagged not applied).
- Playwright spot-checks: home KPIs 927/1,172/125/46, achievements 46, dashboard team cards, 390px no page overflow, 0 console errors.

## Non-goals
- No data edits (totals by hand with citations only).
- No second CSS system, no Tailwind/shadcn import.
- No exact visual copy of ronaldostats.app (copyrighted); same depth, original code.
