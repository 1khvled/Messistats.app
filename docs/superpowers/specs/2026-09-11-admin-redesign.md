# Admin Full Redesign — Design (2026-09-11)

Goal: turn the plain admin page into an owner mission-control dashboard worthy of the rest of the site, plus a committed Vercel setup guide. Backend (`api/count.js` Bearer gate + Blob counter) stays exactly as-is — redesign is frontend + docs only.

## Current state (verified)
- `admin.html` exists but is UNTRACKED (old `analytics.html` deleted, never committed); `api/count.js`, `vite.config.js` carry uncommitted user hunks. Redesign adopts these files as its base — rewrite the shell wholesale, touch backend logic never.
- Shell today: eyebrow + H1 + lede + 3-KPI grid + chart card + table + caveat + explore + method. Login form (`#a-login`) is JS-injected by `renderAdmin()`; locked state hides KPIs/table.
- Security posture (UNCHANGED): no rail link to admin anywhere, `noindex,nofollow`, Bearer `ANALYTICS_PASSWORD` rollup, fail-closed 503, sessionStorage tab-scoped key.

## Redesign: mission control
1. **Vault login hero** — locked state becomes a designed moment: shield mark, "Owner only" eyebrow, password field + unlock button (existing `.a-label/.a-input/.btn-primary` classes, now composed into a centered card with gold keyline), wrong-password + not-configured (503) states as distinct designed notes. No layout shift between locked/unlocked (same shell, swapped mounts).
2. **Status strip** — unlocked header shows backend state pill: `LIVE` (rollup 200), `LOCKED` (401), `NOT CONFIGURED` (503, with pointer to the setup guide), `OFFLINE PREVIEW` (no /api route — local/file). Reuses `.updated-badge .dot` language.
3. **Command KPIs** — total visits / most-read page / pages counted in `.kpi--hero` cards with tick-on-visibility (motion system from prior work), gold peak bar in the spark chart.
4. **Ranked table upgrade** — Page/Visits/Share table gets `sortable()` + rank medals (gold/silver/bronze top 3 via existing `.tp-count` language), most-read first, caption admits reloads/own-visits count.
5. **Session controls** — lock button (existing `a-lock` behavior) styled as danger-ghost; session expiry note (tab-scoped key dies with tab).

## Vercel setup guide (committed doc)
- New `docs/VERCEL_ADMIN_SETUP.md`: import repo (Vite preset, `npm run build`, `dist`), connect Blob store (`messistats-app-blob` exists in CDG1 — Storage tab → Connect), env vars (`BLOB_READ_WRITE_TOKEN` auto on connect; set `ANALYTICS_PASSWORD` manually in Project → Settings → Environment Variables, all environments), deploy, verify (`/api/count?page=home` → `{page,views}`; `/api/count?stats=1` → 401 without key), open `/admin`, unlock with password (stored tab-scoped only), lock when done. Troubleshooting: 503 = password unset; counter silent locally = expected (no /api in static preview).

## Invariants
- Obscurity is NOT security: gate logic, noindex, and Bearer checks byte-identical in behavior; redesign changes copy/layout only.
- `messi-data.json` untouched; 927×3 via verify; zero third-party by default; light theme; reduced-motion respected (reuse motion system).
- Change surface: `admin.html` (rewrite, then `git add` the new file), `renderAdmin()` + login/error copy in `src/app.js`, additive CSS. `api/count.js` logic untouched.

## Verification
- Build clean, verify exit 0, admin shell in `dist/` (confirm `vite.config.js` admin input — adopt user's uncommitted hunk, don't fight it).
- Localhost: locked vault renders (no backend → OFFLINE PREVIEW note), wrong-password path shows inline error copy (unit-grep, since no backend locally), unlocked layout reviewed via mocked `?stats` only if cheap — else code review.
- Authed rollup is deployment-verified by the OWNER following the guide (cannot test without Vercel env — stated in guide).
