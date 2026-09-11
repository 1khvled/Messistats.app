# Charts Come Alive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bars grow on scroll, donuts sweep in, KPIs tick on visibility, peak bar pulses — all CSS + existing IO pattern.

**Architecture:** Additive CSS section + few lines in `sparkSVG()`/`donutSVG()` + IO `.in` wiring copied from the timeline `.tl-reveal` pattern. No new deps, loops, or pages.

**Tech Stack:** Static Vite, vanilla JS, inline SVG, CSS transitions/keyframes.

## Global Constraints
- `public/data/messi-data.json` untouched; sums 927×3 via `npm run verify`.
- Transform-only motion (no layout shift); `prefers-reduced-motion: reduce` renders final state instantly (extend existing reduced-motion blocks).
- Numbers stay final in markup (progressive enhancement); count-up is enhancement only.
- Zero third-party; light theme; no visual restyle beyond motion.
- Reuse the timeline IO helper if one exists (`tl-reveal` wiring) — do not write a second observer utility.

---

### Task 1: Bar grow-in + stagger

**Files:**
- Modify: `src/styles.css` (append motion section)
- Modify: `src/app.js` (`sparkSVG()` — set `--i` per bar, IO `.in` on svg root reusing timeline pattern)
- Test: build, verify, localhost scroll check

**Interfaces:**
- Consumes: existing `sparkSVG(rows, opts)`, timeline IO helper.
- Produces: `.chart-in` IO pattern + `--i` convention Task 2 reuses for donuts.

- [ ] **Step 1: Baseline build**

Run: `npm run build`
Expected: clean.

- [ ] **Step 2: CSS (append only)**

```css
/* Chart entrance (additive) */
.spark { transform-box: view-box; }
.spark .bar { transform: scaleY(0); transform-box: fill-box; transform-origin: bottom; transition: transform 0.5s ease; transition-delay: min(calc(var(--i, 0) * 24ms), 480ms); }
.spark.in .bar { transform: scaleY(1); }
.ybar.peak { animation: peakpulse 1.6s ease 2; }
@keyframes peakpulse { 0%,100% { opacity: 1; } 50% { opacity: 0.55; } }
```

Verify the real svg root class first (`spark`? check code — adapt selector to the actual class, record it). If bars are `<rect>` inside `<a>`, transform on rect is fine.

- [ ] **Step 3: JS — `--i` + IO wiring**

Set inline `style="--i:${index}"` on each bar emit; add the shared IO observer call for chart svgs (copy the `.tl-reveal` wiring exactly — same helper, `.in` class). Record exact lines.

- [ ] **Step 4: Reduced motion**

Extend the existing `@media (prefers-reduced-motion: reduce)` block:

```css
.spark .bar { transform: none; transition: none; }
.ybar.peak { animation: none; }
```

- [ ] **Step 5: Build + verify + commit**

Run: `npm run build` → clean. Run: `npm run verify` → exit 0.

```bash
git add src/styles.css src/app.js
git commit -m "feat(ui): chart bar grow-in with stagger plus peak pulse"
```

### Task 2: Donut sweep + KPI on-visibility tick

**Files:**
- Modify: `src/styles.css` (append to motion section)
- Modify: `src/app.js` (`donutSVG()` initial offset + `.in`, count-up trigger on IO)
- Test: build, verify, localhost + reduced-motion emulation

**Interfaces:**
- Consumes: `.chart-in` IO pattern + `--i` convention from Task 1.
- Produces: final shippable motion; no downstream tasks.

- [ ] **Step 1: Inspect donut + count-up internals**

Read `donutSVG()` slice emit (stroke-dasharray circles, rotating offsets) and the count-up helper (what triggers it now — load event? immediate call?). Record: circumference expression, offset attribute, current trigger lines.

- [ ] **Step 2: Sweep CSS + initial state (append only)**

```css
.donut.in circle { transition: stroke-dashoffset 0.8s ease; }
```

JS: emit slices with initial `stroke-dashoffset` = full circumference (empty ring), then set to target value when `.in` lands (same IO call as Task 1 on the svg root). Adapt to the real attribute names from Step 1; record lines. Numbers/legend untouched.

- [ ] **Step 3: KPI tick on visibility**

Change the count-up trigger from load to the shared IO observer (fire once when the KPI grid scrolls into view). Markup numbers stay final (no-JS safe). Record lines.

- [ ] **Step 4: Reduced motion + verify**

Reduced-motion block: donut slices render target offsets immediately (no transition), count-up sets final numbers instantly.

Run: `npm run build` → clean. Run: `npm run verify` → exit 0, data untouched.

- [ ] **Step 5: Commit**

```bash
git add src/styles.css src/app.js
git commit -m "feat(ui): donut sweep-in plus KPI tick on visibility"
```
