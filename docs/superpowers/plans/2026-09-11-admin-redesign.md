# Admin Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a mission-control admin dashboard frontend and a committed Vercel setup guide; backend logic untouched.

**Architecture:** Rewrite `admin.html` shell mounts, recompose `renderAdmin()` states with existing classes + motion system, append admin CSS, add `docs/VERCEL_ADMIN_SETUP.md`. No backend, data, or security-logic changes.

**Tech Stack:** Static Vite + vanilla JS + plain CSS + Vercel serverless (`api/count.js` as-is) + Blob store.

## Global Constraints
- Security behavior byte-identical: Bearer gate, fail-closed 503/401, noindex, no rail links, tab-scoped sessionStorage key. Copy/layout only.
- `public/data/messi-data.json` untouched; 927×3 via verify.
- Reuse existing classes (`.a-label/.a-input/.btn-primary/.caveat/.kpi/.pill/.table-hint/.updated-badge`) + motion system (`.in` IO, reduced-motion). No second design system.
- `api/count.js` LOGIC untouched (read it; do not edit behavior). Docs may quote it.
- Adopt in-flight user hunks (`admin.html` untracked shell, `vite.config.js` admin input) — verify admin builds to `dist/`, don't fight them.

---

### Task 1: Admin mission-control UI

**Files:**
- Rewrite: `admin.html` (adopt untracked file; keep head/SEO/noindex/rail-minus-admin-link/JSON-LD, recompose body mounts)
- Modify: `src/app.js` (`renderAdmin()`, login/error/status-copy only — no fetch logic changes)
- Modify: `src/styles.css` (append admin section only)
- Test: build, verify, localhost locked-state check

**Interfaces:**
- Consumes: `fetchStats(key)`, `getAKey/setAKey`, `ANALYTICS_PAGES`, existing classes + motion.
- Produces: vault login, status strip states, command KPIs, ranked table, lock control.

- [ ] **Step 1: Inspect current admin code**

Read `renderAdmin()` + `showAdminLogin()` + `fetchStats()` fully. Record: mount ids, error branches (401/503/network), KPI/table builders, lock handler. Do not change fetch/auth logic.

- [ ] **Step 2: Rewrite `admin.html` body mounts**

Keep: doctype/head/SEO/noindex/rail/JSON-LD/scripts. Recompose `<main>`: eyebrow `Owner only`, H1 `Admin`, lede, `#a-login` mount (server-render the form skeleton in HTML instead of JS-inject — progressive enhancement), `#status-strip` mount, `#kpis`, `#page-card`, `#page-table-head` + `#page-table`, caveat, lock control mount `#a-lock-wrap`, footer. No link TO admin anywhere else (super-hide kept).

- [ ] **Step 3: Recompose `renderAdmin()` states**

Locked → vault card (shield mark reuse rail SVG, password field, unlock button, session note). Errors: 401 → "Wrong password" inline `.caveat.err`; 503 → "Analytics not configured" + pointer to `docs/VERCEL_ADMIN_SETUP.md`; network/no-api → OFFLINE PREVIEW note (existing fallback copy kept). Unlocked → status pill LIVE + command KPIs (tick via motion system) + spark chart (gold peak) + sortable ranked table (top-3 medals, most-read first) + lock button. Exact fetch/auth lines unchanged.

- [ ] **Step 4: CSS append (verify classes exist first; only add missing)**

Vault card (centered, gold keyline), status pills (reuse `.updated-badge .dot` colors: green LIVE / red LOCKED / amber NOT CONFIGURED / grey OFFLINE), rank medals, danger-ghost lock button. Reduced-motion: inherit (no new animation).

- [ ] **Step 5: Build + verify + commit**

Run: `npm run build` → clean + `dist/admin.html` present (if missing, adopt/fix `vite.config.js` admin input and record it). Run: `npm run verify` → exit 0.

```bash
git add admin.html src/app.js src/styles.css
git commit -m "feat(admin): mission-control redesign, backend untouched"
```

### Task 2: Vercel setup guide (committed doc)

**Files:**
- Create: `docs/VERCEL_ADMIN_SETUP.md`
- Test: every command/URL in it re-checked against repo (`vercel.json`, `api/count.js`, `vite.config.js`)

**Interfaces:**
- Consumes: Task 1 admin routes/copy (page slug `admin`, error strings).
- Produces: owner-runnable deploy guide; no code changes.

- [ ] **Step 1: Verify facts against repo**

Confirm: build command + output dir from `vercel.json`; env var names from `api/count.js` (`ANALYTICS_PASSWORD`, `BLOB_READ_WRITE_TOKEN`); PAGES whitelist incl. `admin`; cleanUrls routing (`/admin` dry, no `.html`); noindex on admin shell.

- [ ] **Step 2: Write `docs/VERCEL_ADMIN_SETUP.md`**

Sections (concise, copy-pasteable): 1. Import (Vercel dashboard → Add New → Import repo; Framework Vite; build `npm run build`, output `dist`; no env needed to deploy). 2. Blob (Storage tab → Connect `messistats-app-blob` (CDG1, exists) → `BLOB_READ_WRITE_TOKEN` auto). 3. Password (Settings → Environment Variables → `ANALYTICS_PASSWORD` = strong random, all environments → Redeploy). 4. Verify (`curl YOUR-APP.vercel.app/api/count?page=home` → `{"page":"home","views":N}`; `…/api/count?stats=1` → 401; with `Authorization: Bearer …` → 200 rollup). 5. Unlock (open `/admin`, enter password, tab-scoped, lock when done). 6. Troubleshooting (503 = password unset → step 3 + redeploy; counter silent locally = expected; same-instant overwrite ±1 = by design). 7. What it costs (free-tier headroom per README table — quote, don't recompute).

- [ ] **Step 3: Commit**

```bash
git add docs/VERCEL_ADMIN_SETUP.md
git commit -m "docs: Vercel setup guide for admin analytics"
```
