# Admin A-to-Z Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Command-grid admin layout with share bars + SVG vault, then demo mode + health panel so the page is visible anywhere.

**Architecture:** `renderAdmin()` recompose + additive CSS; demo branches BEFORE `fetchStats` with a fenced mock; health computed from loaded dataset. Backend/auth/fetch lines frozen.

**Tech Stack:** Static Vite, vanilla JS, plain CSS.

## Global Constraints
- Auth/fetch/noindex/no-links/tab-key behavior identical; demo branch fenced BEFORE fetch, mock object named `DEMO_PAGES`, banner always rendered with it.
- `messi-data.json` untouched; 927×3; zero third-party; light theme; reduced-motion inherited.
- `api/count.js` untouched. Reuse classes + motion system. No new keyframes.

---

### Task 1: Command layout overhaul

**Files:**
- Modify: `admin.html` (main mounts: add `#admin-grid` composition — check current mounts first, restructure minimally)
- Modify: `src/app.js` (`renderAdmin()` unlocked layout, rank table, vault mark; REMOVE `sortable(tbl…)` call on admin table)
- Modify: `src/styles.css` (append: grid, sharebar, medals keep, vault SVG size, lock footer)
- Test: build, verify, dist grep

**Interfaces:**
- Consumes: `rows/top/total` computation, `sparkSVG`, `kpiA`, `armEntrance`, status pills.
- Produces: grid mounts + sharebar convention Task 2 reuses.

- [ ] **Step 1: Inspect mounts + medal CSS**

Record current `#kpis/#page-card/#page-table` composition and existing `.medal` rules (avoid duplication).

- [ ] **Step 2: Grid + share bars + vault SVG**

Unlocked layout: `<div class="admin-grid"><div class="admin-main">status+KPIs+chart</div><div class="admin-rail">table+health-mount+lock</div></div>` (health mount `#health-card` EMPTY in this task — Task 2 fills it; render nothing if empty via `:empty{display:none}`). Table: add Share-visual column with `<div class="sharebar"><i style="width:NN%"></i></div>` (gold for rank 1), caption notes fixed most-read order. DELETE the `sortable(tbl.querySelector("table"))` line + its comment. Vault: replace 🛡️ `<p>` with inline SVG shield (copy rail-badge shield paths, 44px, gold stroke), keep all ids/classes/copy.

- [ ] **Step 3: CSS append (grep first, add only missing)**

`.admin-grid` (2col → 1col ≤900px), `.sharebar` + fill, `.admin-rail .card` spacing, `.vault-mark svg` sizing, `#a-lock-wrap` footer style. No keyframes.

- [ ] **Step 4: Build + verify + commit**

`npm run build` clean + `dist/admin.html`; `npm run verify` exit 0.

```bash
git add admin.html src/app.js src/styles.css
git commit -m "feat(admin): command-grid layout, share bars, SVG vault"
```

### Task 2: Demo mode + health panel

**Files:**
- Modify: `src/app.js` (`renderAdmin()` demo branch + `renderHealth()` from dataset)
- Modify: `src/styles.css` (append: demo banner, health list)
- Modify: `docs/VERCEL_ADMIN_SETUP.md` (appendix: demo mode)
- Test: build, verify, localhost `?demo=1` full-dashboard proof

**Interfaces:**
- Consumes: Task 1 mounts (`#health-card`, grid), `ANALYTICS_PAGES`, normalized `d`.
- Produces: visible-anywhere admin; final state.

- [ ] **Step 1: Demo branch (fenced, before fetch)**

At top of `renderAdmin(d)`, AFTER `setHead` (keep head/explore/method rendering):

```js
const DEMO_PAGES = { home: 128, byyear: 96, dashboard: 74, timeline: 61, byseason: 44, achievements: 31, admin: 12 };
const demoMode = new URLSearchParams(location.search).has("demo");
```

If `demoMode`: set status pill `DEMO` (grey/gold), render the FULL unlocked layout with `pages = DEMO_PAGES`, prepend DEMO banner (`This is sample data for preview — connect the backend for real numbers.` + `Exit demo` link to `admin.html` without query), fill `#health-card` per Step 2 (with demo-marked backend row), return BEFORE any `fetchStats`/key logic. Real path 100% untouched below.

- [ ] **Step 2: Health card (real data, no backend)**

`renderHealth(d, demoMode)` fills `#health-card`: dataset sums computed live (`calendarYears` reduce vs 927 ✓/✗, `byCompetition` vs 927 ✓/✗ — use the SAME field paths the app normalizes, record them), `meta.status`, page stamp (`document.lastModified`), backend row (LIVE/LOCKED/OFFLINE/DEMO mirroring the status pill). Plain list markup, `.health-ok`/`.health-bad` dots. In demo mode the backend row reads DEMO.

- [ ] **Step 3: CSS + guide appendix**

Demo banner (gold dashed, unmissable), health list rows. Guide appendix (5 lines): `?demo=1` preview utility, sample data, never touches real counter, remove nothing.

- [ ] **Step 4: Build + verify + commit**

Build clean, verify exit 0, data untouched.

```bash
git add src/app.js src/styles.css docs/VERCEL_ADMIN_SETUP.md
git commit -m "feat(admin): demo mode plus health panel"
```
