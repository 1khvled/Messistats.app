# Chart Hover + Drill-Down — Design (2026-09-11)

Goal: every chart bar/slice hoverable with exact values and clickable into detail. Direction A: native SVG `<title>` + anchor links. No new deps, no new pages, no JS tooltip layer.

## Hover content (`sparkSVG()`, `donutSVG()` in `src/app.js`)
- Year/season bars: `<title>2012: 91 goals · 69 apps · 1.32/game</title>` — goals, apps, GPG from existing row fields only. Never new numbers.
- Donut slices: `<title>Left foot: 740 of 927 (79.8%)</title>` — value, total, share. Provisional slices keep values, no fresh claims.
- Values reuse the same accessors as legends/tables on the same card (no divergent sources; cf. hardcoded-740 lesson).

## Drill targets (existing pages only)
- Year bars → `goalsbyyear.html#y2012` (additive `id="yYYYY"` per year row in `renderByYear`).
- Season bars → `goalsbyseason.html#s2012` (additive `id="sYYYY"` per season row in `renderBySeason`).
- Dashboard team pills/cards keep existing links. No new pages, no router, no copy changes.

## A11y + invariants
- Anchors keyboard-focusable with existing global `:focus-visible`; `<title>` doubles as accessible names; touch = native tooltip + navigation.
- `messi-data.json` untouched (totals by hand only); calendarYears = byCompetition = 927 via `npm run verify`.
- Change surface: a few lines inside `sparkSVG()`/`donutSVG()` + row `id`s. Zero third-party, light theme kept.

## Verification (throwaway)
- `npm run build` clean; `npm run verify` exit 0.
- Spot-check `dist/`: `<title>` strings + `#y2012`/`#s2012` anchors in JS bundle; click-through on localhost:5173.

## Non-goals
- No custom floating tooltip (option B, later if native feels plain).
- No per-year detail views (option C — data has no sub-season granularity).
