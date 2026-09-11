# Chart Hover + Drill-Down Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every chart bar/slice shows exact values on hover and clicks through to detail via native SVG titles and anchors.

**Architecture:** Few-line changes inside `sparkSVG()`/`donutSVG()` in `src/app.js` plus additive row `id`s in year/season renderers. No new deps, pages, router, or copy.

**Tech Stack:** Static Vite, vanilla JS, inline SVG, existing `messi-data.json`.

## Global Constraints
- `public/data/messi-data.json` is the ONLY source of truth; totals change BY HAND only, never by automation.
- After ANY data-adjacent touch: calendarYears sum == 927, byCompetition sum == 927 (assert via `npm run verify`).
- Title values reuse the SAME accessors as the legend/table on the same card (never a parallel literal — cf. hardcoded-740 lesson).
- Provisional slices keep existing values, no fresh claims; provisional caveats stay where they are.
- Zero third-party requests by default; `src/matchday.js` + `src/ads.js` stay disabled.
- Light theme kept; no visual restyle in this plan (titles/anchors are invisible until hovered/focused).

---

### Task 1: Bar titles + row anchors (byyear, byseason, home, dashboard)

**Files:**
- Modify: `src/app.js` (`sparkSVG()` bar builder, `renderByYear()`, `renderBySeason()`)
- Test: `npm run build`, `npm run verify`, bundle grep + localhost click-through

**Interfaces:**
- Consumes: existing `sparkSVG(rows, opts)`, row fields (`year`, `goals`, `apps`, `provisional`), existing `gpg()`/`n()` helpers.
- Produces: `<title>` in every bar, `id="yYYYY"` / `id="sYYYY"` row anchors, `<a>`-wrapped bars that Task 2 mirrors for donuts.

- [ ] **Step 1: Confirm baseline builds**

Run: `npm run build`
Expected: clean build.

- [ ] **Step 2: Add `<title>` + link to bars in `sparkSVG()`**

In the bar-building code (bars currently carry `class="bar ybar…"`), emit each bar as an anchor-wrapped rect with a title child. Exact value format (use the row's own fields via the same accessors the table uses):

```js
`<a href="${link}"><rect …><title>${r.year}: ${r.goals} goals · ${r.apps} apps · ${gpg(r.goals, r.apps)}/game</title></rect></a>`
```

Where `link` resolves per caller via opts (byyear → `goalsbyyear.html#y${r.year}`, byseason → `goalsbyseason.html#s${r.year}`, others → no link, title only): pass `linkPrefix` in the existing `opts` object (extend, never replace — callers already pass `peakYear`, `provisionalYear`, `cumulative`, `label`). If a caller passes no `linkPrefix`, render the title with no anchor. Keep every existing attribute/class on the rect; add nothing else. Record exact lines.

- [ ] **Step 3: Add row `id`s in `renderByYear()` / `renderBySeason()`**

Year table rows: additive `id="yYYYY"` (e.g. `<tr id="y2012">`); season rows: `id="sYYYY"`. Keep all existing attributes/classes. These are the drill targets from Step 2.

- [ ] **Step 4: Rebuild + verify + spot-check**

Run: `npm run build` → clean.
Run: `npm run verify` → exit 0, 927×3 hold.
Spot-check `dist/` bundle: `<title>2012: 91 goals` present, `#y2012` / `#s2012` present. Click-through on localhost:5173 (year bar → year row).

- [ ] **Step 5: Commit**

```bash
git add src/app.js
git commit -m "feat(ui): chart bar hover titles plus drill-down anchors"
```

### Task 2: Donut slice titles (+ links where sensible)

**Files:**
- Modify: `src/app.js` (`donutSVG()` slice builder, dashboard/achievement call sites if link targets exist)
- Test: `npm run build`, `npm run verify`, bundle grep + hover check

**Interfaces:**
- Consumes: `donutSVG(parts, total, centerTop, centerSub)` + the SAME part accessors the card legend/table use.
- Produces: titled (and where meaningful, linked) slices; final shippable state.

- [ ] **Step 1: Add `<title>` to slices in `donutSVG()`**

Exact format per slice (value, total, one-decimal share — compute share inline, no new helper unless the file already has one):

```js
`<title>${p.label}: ${p.value} of ${total} (${(100 * p.value / total).toFixed(1)}%)</title>`
```

Use the part's real field names (record them); reuse the legend's accessor expression verbatim. Slices whose card links somewhere meaningful (e.g. finish split → dashboard detail) get an anchor wrap like Task 1; purely decorative slices get title only. Record which got links and why (one line each).

- [ ] **Step 2: Rebuild + verify + spot-check**

Run: `npm run build` → clean.
Run: `npm run verify` → exit 0, `messi-data.json` untouched (`git status --short -- public/data/messi-data.json` prints nothing).
Spot-check bundle: `Left foot: 740 of 927 (79.8%)` (or the true computed string) present.

- [ ] **Step 3: Commit**

```bash
git add src/app.js
git commit -m "feat(ui): donut slice hover titles"
```
