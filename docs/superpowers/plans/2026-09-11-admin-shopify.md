# Admin Shopify-Overview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Shopify-analytics-style admin overview: 4 metric cards, traffic bars, grouped sections.

**Architecture:** Recompose `renderAdmin()` unlocked path + additive CSS. Demo/real share the path (Task 1-2 changes flow to both). No backend/data changes.

**Tech Stack:** Static Vite, vanilla JS, plain CSS.

## Global Constraints
- Security identical (frozen fetch/auth/noindex/no-links/tab-key). Demo fence + banner intact.
- No invented history: no deltas/trends/sparklines; every number from `pages` rollup or dataset `d`.
- Data untouched; 927×3; zero third-party; light theme; reduced-motion; api/count.js untouched.
- Reuse `.kpi/.sharebar/.medal/.shead/.card` + tick/IO systems; grep-first CSS.

---

### Task 1: Metric cards + section grouping

**Files:** Modify `src/app.js` (`renderAdmin()` unlocked: 4 KPIs, `.shead` section heads, grid order), `src/styles.css` (append: 4-up KPI grid if missing, section spacing).
**Interfaces:** Consumes `rows/top/total`, `kpiA`, tick helper. Produces KPI-4 + section convention Task 2 follows.

- [ ] **Step 1: Inspect current unlocked composition + KPI grid classes**
- [ ] **Step 2: 4 metric cards** — Total visits (`N pages counted`), Most-read (`N visits · S%`, S = top/total rounded), Pages with traffic (`N of 7`, sub `least-read: <name>`), Avg/page (`(total/7)` 1 decimal, sub `total ÷ 7 pages`). Compute inline from `rows/total`; tick helper covers the 4th card (verify selector covers `.kpi-value` generally — if it targets specific grids, extend minimally, record).
- [ ] **Step 3: Section heads** — `Traffic` (chart card), `Pages` (table), `Data` (health), `Access` (lock card) via `.shead` + h2. Grid: main = KPIs + Traffic + Pages table; rail = Data health + Access card (move lock button into Access card with session note + backend row mirror).
- [ ] **Step 4: Build + verify + commit** (`feat(admin): Shopify-style overview metrics plus sections`)

### Task 2: Traffic bars + table slim + polish

**Files:** Modify `src/app.js` (traffic bars block, table sharebar-column drop), `src/styles.css` (traffic rows).
**Interfaces:** Consumes Task 1 layout. Produces final state.

- [ ] **Step 1: Traffic bars block** — under spark chart in Traffic card: per-page rows (most-read first): linked name + `.sharebar` fill + visits count. Reuse sharebar CSS (extend with `.traffic-row` layout only).
- [ ] **Step 2: Slim table** — DROP the visual sharebar column (keep Rank/Page/Visits/Share-% text); caption notes fixed order + points to Traffic card for bars. (Removes the double-ink duplication.)
- [ ] **Step 3: Polish pass** — empty-state honesty preserved; reduced-motion inherited; 390px stacking check mentally (grid collapses at 900px already).
- [ ] **Step 4: Build + verify + commit** (`feat(admin): traffic bars plus table slim-down`)
