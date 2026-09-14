# CONTEXT.md — messi-stats (for AI agents)

> **MANDATORY — READ THIS FILE BEFORE ANY EDIT. UPDATE IT AFTER EVERY EDIT.**
> Last updated 2026-09-14 — lean A-to-Z for agents. Previous 178-line verbose history truncated per user order 2026-09-14.

## Agent Protocol — LAW

1. **Before ANY edit** (code, env, DB, deploy, worker, docs, config): read this file fully. Do not re-discover what is documented here.
2. **After EVERY modification you commit/push**: append to `## Timeline` below. **Never rewrite history — append only, strictly chronological, no gaps.**
   - Required format: `YYYY-MM-DD — <your name/model> — <commit SHA> (<deploy id> if Vercel) — what/why — files changed — verification (build / verify / audit / curl / tests)`
   - Example: `2026-09-14 — muse-spark-1.2 — 2ba8e26 — AdSense re-insert & BOM fix — 8 HTML + public/ads.txt — build 1.36s prebuild 928x3 ok`
3. **Agent Log**: also add a row to `## Agent Log` with the same data.
4. **File edits**: use Node `fs.readFileSync`/`writeFileSync utf8` (never PowerShell `Set-Content` — it writes BOM and mangles UTF-8 em dash to mojibake). Always verify with Node: `t.includes('—') && t.charCodeAt(0) !== 0xFEFF`.
5. **Build gate**: `npm run build` must pass (`prebuild-check` asserts 928x3 sums vs `totals.combined.goals`). `npm run verify` / `npm run audit` when touching data or assets.

This file is the A-to-Z. If you skip updating it, you violate the project rule and break the next agent.

## What this is

Static Lionel Messi career-statistics site, modeled on https://ronaldostats.app structure/depth (not code or visual identity). One JSON source of truth, no backend, no API keys, no third-party requests by default (exception: user-ordered AdSense + Vercel Analytics).

Live: **928 goals / 1,173 apps** (803 club + 125 Argentina), 46 team trophies, 8 Ballons d'Or. Data as of 2026 in `public/data/messi-data.json`.

## Stack & commands

- Vite 6 multi-page (`vite.config.js` 8 inputs: index, achievements, dashboard, birthday, goalsbyseason, goalsbyyear, timeline, admin) — `base:'/'`, outDir `dist`, mirrored to `dist/en/` via `scripts/copy-en.mjs`.
- `npm run dev` (5173) / `npm run build` (+ prebuild gate) / `npm run preview` (4173)
- `npm run verify` = `verify.mjs` (writes `last-check.json` only) + `source-watch.mjs` (stages to `pending.json`, never writes totals) + `smart-check --dry-run`
- `npm run verify:watch` / `verify:smart:write` / `triage` (+ `--prune`) / `audit` (`dist-audit.cjs`) / `sync:daily`
- `scripts/confirm-provisional.mjs` — human confirms staged rows.

## File map

| File | Role |
|---|---|
| `public/data/messi-data.json` | THE source of truth. Everything renders from this. |
| `public/data/last-check.json` | Machine-written check log. Not rendered. |
| `public/data/pending.json` | Staged unverified rows (needs_review) awaiting human. |
| `public/ads.txt` | AdSense: `google.com, pub-8397501846754760, DIRECT, f08c47fec0942fa0` |
| `src/app.js` | Only renderer. Branches on `body[data-page]`. Includes `inject()` (Vercel Analytics) + `injectSpeedInsights()`. |
| `src/styles.css` | Editorial light theme (paper/navy/sky/gold). Tables carry design. |
| `src/ads.js`, `src/matchday.js` | Ads (lazy, max 3) + disabled-by-default matchday check. |
| `index.html`, `achievements.html`, `dashboard.html`, `birthday.html`, `goalsbyseason.html`, `goalsbyyear.html`, `timeline.html`, `admin.html` | Thin shells — AdSense script before `<title>`, mounts injected by app.js. |
| `scripts/prebuild-check.mjs`, `copy-en.mjs`, `verify.mjs`, `source-watch.mjs`, `smart-check.mjs`, `triage.mjs`, `dist-audit.cjs` | Build/verify/audit helpers. Never write totals. |
| `worker/smart-check.js`, `worker/schema.sql`, `wrangler.toml` | Cloudflare cron (2h, D1 pending_checks). NOT deployed (`REPLACE-WITH-D1-ID`). |
| `vercel.json`, `.vercelignore` | Vercel: build `npm run build`, output `dist`, cleanUrls, immutable fonts/img. |

## Data model (`messi-data.json`) — current checksums 928

- `meta`: CROSS_CHECKED, methodNote, verification[] (8), sources[].
- `profile`: age 39, Forward, Inter Miami.
- `totals`: `combined:{apps:1173, goals:928}`, `club:{966/803}`, `country:{207/125}`, `goalsPerGame:0.79`.
- `clubSeasons[]` 23 rows (2004/05–2026) with `league/cup/continental/other {apps,goals}` — PRESERVE EXACTLY.
- `countryYears[]` 22 rows (2005–2026).
- `calendarYears[]` 23 rows (2004–2026) — MUST sum to 928 (2026 provisional:true).
- `byCompetition[]` 12 rows — MUST sum to 928.
- `byFinish{openPlay:752, penalties:109, freeKicks:66}` + `hatTricks:57` + `byBodyPart[740,150,27,10]` — PROVISIONAL (caveat required in UI).
- `trophies[]` 22 rows = 46, `individual[]` 8, `timeline[]` 18.

## Iron rules

1. Totals change BY HAND with named source + review. Automation never writes `messi-data.json` totals.
2. After data edit: `calendarYears sum == byCompetition sum == byBodyPart sum == totals.combined.goals (928)`. Assert before save.
3. Provisional fields always ship with “provisional until hand count” caveat.
4. Zero third-party requests by default (only user-ordered AdSense/Analytics).
5. Free sources only: ESPN (usa.1), openfootball CC0, football-data.org free tier. No paid APIs/keys.
6. Light editorial paper theme — never dark gradients/glassmorphism.
7. Reference IA: ronaldostats.app. Structure inspiration only. Never copy code/images.

## Timeline — append only, no rewrite

> Full verbose history 2026-09-09 → 2026-09-13 (178 lines, 17 sessions: visual rebuild, photo passes, Vercel, AdSense) was truncated per user order 2026-09-14 to keep this file lean for agents. Git log retains it. Resume here.

- 2026-09-14 — muse-spark-1.2 — 2ba8e26 — AdSense re-insert & BOM/mojibake fix (user: insert ca-pub-8397501846754760 then push). Restored 8 HTML shells from HEAD and re-inserted via Node fs utf8 no BOM before <title>; wrote public/ads.txt. Files: index, achievements, dashboard, birthday, goalsbyseason, goalsbyyear, timeline, admin, public/ads.txt, CONTEXT.md. Verify: Node — emdash true, mojibake false, BOM false, ads 8/8; npm run build 1.36s prebuild 928x3 ok, dist+dist/en verified; git push origin/main.

- 2026-09-14 — muse-spark-1.2 — 9524bdb — admin password logic → Vercel ENV (not Supabase). Created api/admin-auth.js (serverless, sha256(salt+password), timingSafeEqual, 5/15min rate limit, supports ADMIN_PASSWORD_HASH/ADMIN_PASSWORD + ADMIN_SALT, fallback dev hash). Patched src/admin.js (remove ADMIN_SALT/DEFAULT_HASH/computeSha256/localStorage, now fetch POST /api/admin-auth, disabled change-pass modal → ENV instructions). Patched admin.html modal subtitle to Vercel ENV. Added .env.example, scripts/generate-admin-hash.mjs, npm run admin:hash, .gitignore .env. Verify: hash gen ok, api 200/401/429 tests pass, npm run build 1.05s prebuild 928x3 ok, dist/admin.html 25KB.

- 2026-09-14 — muse-spark-1.2 — e54443b — remember me (30d) + ignore admin views. admin.html: added checkbox #admin-remember-me (Remember me for 30 days) before error div. src/admin.js: new isAuthenticated (session + localStorage with expiry), setAuthenticated(remember)/clearAuthenticated helpers, login success reads checkbox and persists 30d localStorage + session, lock clears both. src/analytics.js: added isAdminAuthenticated() (checks same keys), trackEvent and initAnalytics now early-return if admin (pathname or admin auth) so admin traffic not counted. Verify: build 0.70s prebuild 928x3 ok, admin 25.34KB, app 91.85KB, dist verified.

<!-- ADD NEW ENTRIES BELOW THIS LINE — DO NOT EDIT ABOVE -->

## Agent Log

| Date | Agent (model) | Task | Commit | Files |
|---|---|---|---|---|
| 2026-09-14 | muse-spark-1.2 | AdSense re-insert & BOM fix + push | 2ba8e26 | 8 HTML, public/ads.txt, CONTEXT.md |

| 2026-09-14 | muse-spark-1.2 | admin ENV fix (Vercel not Supabase) | 9524bdb | api/admin-auth.js, src/admin.js, admin.html, .env.example, scripts/generate-admin-hash.mjs, package.json, .gitignore, README.md, CONTEXT.md |
| 2026-09-14 | muse-spark-1.2 | remember me + ignore admin views | e54443b | admin.html, src/admin.js, src/analytics.js, CONTEXT.md |
<!-- ADD NEW ROWS BELOW — KEEP CHRONOLOGICAL -->
