# Story-Driven Numbers — Design (2026-09-12)

Goal: make the numbers feel alive to explore, with zero AI slop. Direction:
annotate what's there; add no widgets, no frameworks, no new deps.

User decisions (2026-09-12): focus = data-experience depth; approach = A
(story-driven numbers) per standing "use your imagination" delegation.
Sections 1–3 presented in chat; proceeding under that delegation.

## Architecture (unchanged)

Static Vite multi-page. `src/app.js` sole renderer, `src/styles.css` plain
CSS, thin HTML shells. `public/data/messi-data.json` is the ONLY source of
truth; no automation writes totals. Admin/analytics already removed.

## Section 1 — Chart milestone markers (additive, SVG text only)

Verified `sparkSVG` already renders: peak-value label, cumulative polyline,
baseline, per-bar `<title>` tips, `linkPrefix` anchors, year labels. Add
only what's missing:

- Road-to-1,000 reference marker on cumulative charts (static line + label,
  computed from data: 1000 − career total).
- Value label on the provisional (2026) bar; `prov` bars currently get none.
- Min/max axis ticks so the eye calibrates without the table.
- Static SVG text; reduced-motion safe; screen readers keep the table.

## Section 2 — Record callouts in tables (plain spans, zero JS)

`YEAR_NOTES` + `.yr-note` spans exist on the by-year table only. Extend:

- `SEASON_NOTES`-style note for the best club season on the season table.
- Record-holder tags on the competition table (La Liga all-time record;
  UCL tally), derived from `byCompetition` values already rendered.
- One shared record-chip style so notes read as a family.
- Every note backed by data on the page; never new claims. Sorting,
  filtering, pinned totals untouched.

## Section 3 — Methodology folds away (native disclosure, zero JS)

- Wrap method + provisional detail in native `details/summary`
  ("How these numbers are checked"); first paragraph always visible.
- One-line provisional flag stays inline next to each figure.
- Keyboard and print safe by default (browser-native).

## Error handling

Missing data rows → markers/notes skip silently (guard on values, never
assume shapes). No-JS → tables + SVG text + disclosure all render (no
JS-built essentials). Sticky headers, sort, filter unchanged.

## Verification (throwaway, never committed tests)

`npm run build` clean; `npm run verify` exit 0 (927×3 checksums, staged
rows flagged not applied); preview sweep of all 6 pages (markers visible,
notes present, disclosure toggles, 390px no overflow, 0 page errors);
screenshots of year chart + comp table before/after.

## Non-goals

No cross-filtering, no hover-toy tooltips, no new pages, no data edits
(totals by hand with citations only), no exact visual copy of any
reference site, no dark/glass revert.
