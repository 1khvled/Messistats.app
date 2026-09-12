# Story-Driven Numbers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Annotate charts and tables with data-backed milestones and fold methodology into native disclosure.

**Architecture:** In-place edits in `src/app.js` (sparkSVG, season/comp tables, methodHTML) plus additive CSS in `src/styles.css`. No new files, deps, pages, or data edits.

**Tech Stack:** Vite 6 static multi-page, vanilla JS + SVG, plain CSS.

## Global Constraints

- `public/data/messi-data.json` is the ONLY source of truth; no automation writes totals, no data edits in this plan.
- calendarYears sum == 927, byCompetition sum == 927 after any touch.
- Provisional fields (109/66/57/400) always ship with the hand-count caveat; one-line flags stay inline, never behind disclosure.
- Zero third-party requests by default; `matchday.js` + `ads.js` stay disabled.
- Light editorial paper kept; gold for records/honours only; no dark/glass.
- Every note backed by data on the page; never new claims.

---

### Task 1: Chart milestone markers in sparkSVG

**Files:**
- Modify: `src/app.js:180-191` (cumulative block)
- Modify: `src/app.js:196` (peak label line)
- Modify: `src/app.js:191` (baseline line, append ticks after it)
- Modify: `src/styles.css` (append 4 rules after the `svg.spark text.yr` rule)
- Test: preview sweep + screenshot (Task 4)

**Interfaces:**
- Consumes: `sparkSVG(rows, opts)` with `opts.cumulative`, row `{value, peak, provisional, year, label, tip}` — unchanged signatures.
- Produces: `.thousand` line + `.thousand-label`, `.prov-label`, `.axis` SVG elements consumed by Task 4 screenshots only.

- [ ] **Step 1: Road-to-1,000 marker inside the cumulative branch**

```js
// BEFORE (src/app.js:189-190)
    s += `<polyline class="cum" points="${pts.join(" ")}" fill="none"/>`;
  }
// AFTER
    s += `<polyline class="cum" points="${pts.join(" ")}" fill="none"/>`;
    if (tot < 1000) {
      const my = (base - 8 - (1000 / tot) * (maxH - 10)).toFixed(1);
      s += `<line class="thousand" x1="0" y1="${my}" x2="${W}" y2="${my}"/><text class="thousand-label" x="${W}" y="${(+my - 5).toFixed(1)}">1,000</text>`;
    }
  }
```

- [ ] **Step 2: Provisional-year value label next to the peak label**

```js
// BEFORE (src/app.js:196)
    if (r.peak) s += `<text class="peak-label" x="${(i * step + step / 2).toFixed(0)}" y="20">${r.value}</text>`;
// AFTER
    if (r.peak) s += `<text class="peak-label" x="${(i * step + step / 2).toFixed(0)}" y="20">${r.value}</text>`;
    if (r.provisional && !r.peak) s += `<text class="prov-label" x="${(i * step + step / 2).toFixed(0)}" y="20">${r.value}</text>`;
```

- [ ] **Step 3: Min/max axis ticks after the baseline**

```js
// BEFORE (src/app.js:191)
  s += `<line class="baseline" x1="0" y1="${base}" x2="${W}" y2="${base}"></line>`;
// AFTER
  s += `<line class="baseline" x1="0" y1="${base}" x2="${W}" y2="${base}"></line>`;
  s += `<text class="axis" x="2" y="${(base - maxH - 6).toFixed(1)}">${max}</text><text class="axis" x="2" y="${(base - 2).toFixed(1)}">0</text>`;
```

- [ ] **Step 4: Marker styles next to the spark rules**

```css
/* Append after the `svg.spark text.yr` rule in src/styles.css */
svg.spark text.prov-label { font-size: 15px; fill: var(--muted); text-anchor: middle; font-family: var(--font-body); font-weight: 700; }
svg.spark text.axis { font-size: 12px; fill: var(--faint); font-family: var(--font-body); }
svg.spark line.thousand { stroke: var(--gold); stroke-width: 1.5; stroke-dasharray: 6 5; }
svg.spark text.thousand-label { font-size: 13px; font-weight: 800; fill: var(--gold); text-anchor: end; font-family: var(--font-head); }
```

- [ ] **Step 5: Commit**

```bash
git add src/app.js src/styles.css
git commit -m "feat(charts): road-to-1000 marker, provisional labels, axis ticks"
```

### Task 2: Record callouts in season and competition tables

**Files:**
- Modify: `src/app.js:433` (season row header cell)
- Modify: `src/app.js:566` (competition row header cell)
- Test: preview sweep + screenshot (Task 4)

**Interfaces:**
- Consumes: `best` (line 419, highest-goals club season) and `T` (team filter, `"all"` default); `.yr-note` class already used by YEAR_NOTES.
- Produces: annotated rows, no interface change.

- [ ] **Step 1: Best-season note on the season row**

```js
// BEFORE (src/app.js:433, inside ss.map)
    ss.map((s) => `<tr id="s${s.season.slice(0, 4)}"${s.provisional ? ' class="total"' : ""}><th scope="row">${esc(s.season)}${s.provisional ? " *" : ""}</th>` +
// AFTER
    ss.map((s) => `<tr id="s${s.season.slice(0, 4)}"${s.provisional ? ' class="total"' : ""}><th scope="row">${esc(s.season)}${s.provisional ? " *" : ""}` +
      (s.season === best.season ? `<span class="yr-note">Best club season</span>` : "") + `</th>` +
```

- [ ] **Step 2: Record tags on all-teams competition rows**

```js
// BEFORE (src/app.js:566)
    compRows.map((r) => `<tr><th scope="row">${esc(r.competition)}${r.team ? `<small class="comp-team">${esc(r.team)}</small>` : ""}</th><td><b>${r.goals}</b></td><td>${((r.goals / goals) * 100).toFixed(1)}%</td></tr>`).join("") +
// AFTER
    compRows.map((r) => `<tr><th scope="row">${esc(r.competition)}${r.team ? `<small class="comp-team">${esc(r.team)}</small>` : ""}` +
      (T === "all" && r.competition === "La Liga" ? `<span class="yr-note">All-time competition record</span>` : "") +
      (T === "all" && r.competition === "UEFA Champions League" ? `<span class="yr-note">120 Barcelona · 9 PSG</span>` : "") +
      `</th><td><b>${r.goals}</b></td><td>${((r.goals / goals) * 100).toFixed(1)}%</td></tr>`).join("") +
```

- [ ] **Step 3: Commit**

```bash
git add src/app.js
git commit -m "feat(tables): best-season and competition record callouts"
```

### Task 3: Methodology in native disclosure

**Files:**
- Modify: `src/app.js:154-164` (`methodHTML`)
- Modify: `src/styles.css` (append 2 rules after the `.colophon` rules)
- Test: preview sweep, toggle check (Task 4)

**Interfaces:**
- Consumes: `methodColophon(inner)` (unchanged) — wraps the returned markup with the always-visible intro line plus the provisional note.
- Produces: `details.method-more` markup; `renderMethod` callers unchanged.

- [ ] **Step 1: Fold paragraphs 2+ into details**

```js
// BEFORE (src/app.js:154-164)
function methodHTML(d, extra) {
  const teams = "Barcelona, Paris Saint-Germain, Inter Miami and Argentina";
  return methodColophon(`<h2>How I put these numbers together</h2>` +
    `<p>I count one thing: official senior first-team matches for ${teams} — ` +
    `every league game, domestic cup, continental night and international, and nothing else. No youth football, no reserves, no friendlies dressed up as history.</p>` +
    `<p>Season and calendar-year goals are tallied from full match records and checked against club ` +
    `and competition records plus free match-data feeds (ESPN, openfootball, football-data.org) after every game. The free-kick, penalty and hat-trick splits are a widely published tally, marked ` +
    `provisional until my match-by-match hand count is finished. ${extra || ""}</p>` +
    `<p class="colophon">This is a one-person site, kept by hand. Totals only ever change when I have a named source and have checked it twice — ` +
    `never by a script, never on a rumour. If you spot something wrong, that date stamp at the top tells you exactly when I last looked.</p>`);
}
// AFTER
function methodHTML(d, extra) {
  const teams = "Barcelona, Paris Saint-Germain, Inter Miami and Argentina";
  return methodColophon(`<h2>How I put these numbers together</h2>` +
    `<p>I count one thing: official senior first-team matches for ${teams} — ` +
    `every league game, domestic cup, continental night and international, and nothing else. No youth football, no reserves, no friendlies dressed up as history.</p>` +
    `<details class="method-more"><summary>How these numbers are checked</summary>` +
    `<p>Season and calendar-year goals are tallied from full match records and checked against club ` +
    `and competition records plus free match-data feeds (ESPN, openfootball, football-data.org) after every game. The free-kick, penalty and hat-trick splits are a widely published tally, marked ` +
    `provisional until my match-by-match hand count is finished. ${extra || ""}</p>` +
    `<p class="colophon">This is a one-person site, kept by hand. Totals only ever change when I have a named source and have checked it twice — ` +
    `never by a script, never on a rumour. If you spot something wrong, that date stamp at the top tells you exactly when I last looked.</p></details>`);
}
```

- [ ] **Step 2: Disclosure affordance styles**

```css
/* Append after the `.colophon` rules in src/styles.css */
.method-more { margin-top: 10px; }
.method-more summary { cursor: pointer; color: var(--brand); font-weight: 700; font-size: 0.92rem; }
```

- [ ] **Step 3: Commit**

```bash
git add src/app.js src/styles.css
git commit -m "feat(method): fold methodology into native disclosure"
```

### Task 4: Prove it (throwaway checks, never committed)

- [ ] **Step 1: Build + verify**

```bash
npm run build
npm run verify
```

Expected: build clean (6 pages, no admin); verify exit 0, 927×3 checksums, staged rows flagged not applied.

- [ ] **Step 2: Preview sweep on the dist build**

Start: `node node_modules/vite/bin/vite.js preview --port 4173 --strictPort`.
Check: "1,000" marker + provisional value + axis ticks on by-year chart; "Best club season" note on season table; La Liga/UCL tags on dashboard comp table; `details.method-more` closed by default and toggles on home; all 6 pages render; 390px no page overflow; 0 page errors. Screenshot year chart + comp table before/after. Stop the server after.
