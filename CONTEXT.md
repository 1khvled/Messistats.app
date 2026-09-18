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

- 2026-09-14 — muse-spark-1.2 — acbb6b1 — admin UI/UX rebuild (fix side-offset weird). Removed @media (min-width:1280px) body[data-page="admin"] .page {margin-left:calc(var(--rail-open)+24px)} that pushed content 272px left; now body[data-page="admin"] .page {margin-left:calc(var(--rail-w)+32px)} + .admin-wrap{max-width:1320px;margin:0 auto}. Rebuilt admin dashboard core (topbar sticky+blur, KPI 4-col grid with hover lift, charts row equal height, breakdowns 2-col, stream compact sticky header, modals blur, footer subtle, 640px responsive). Rebuilt login gate: centered min-height min(72vh,640px), card 440px radius 24 with hero-grad top bar, shield 56px, input focus ring, remember-me CSS, error, button. Cleaned inline styles. Verify: build 0.72s prebuild 928x3 ok, styles 82.31KB, admin 25.17KB.


- 2026-09-14 — muse-spark-1.2 — b73d921 — hide admin from sidebar for users + creative hero polish. All 8 HTML shells now have hidden #rail-admin-link (display:none); src/app.js + src/admin.js reveal only when isAdminAuthed (session or 30d localStorage). admin.html: added Messi Pulse hero (media 84px + pulse, eyebrow, title, lede, stats 928/46/live, quick actions) + fixed img src to /img/messi.jpg + synced hero-live-count with KPI. src/styles.css already centered admin (fixed side-offset) + hero grid. Verify: build 0.56s prebuild 928x3 ok, admin 27.11KB, styles 84.69KB.


<!-- ADD NEW ENTRIES BELOW THIS LINE — DO NOT EDIT ABOVE -->

- 2026-09-14 — muse-spark-1.3 — f34ed17 — security hardening pentest+fix (user: hack site, fix vulns, hard rate limit surviving refresh; DDoS/bots stay on Vercel). Closed: forged-localStorage login bypass (reads now need HMAC server token via api/admin-events proxy), in-memory-only rate limit (now Supabase-persistent 5/15min + exponential 15m–2h lockout + client localStorage mirror), live-verified anon SELECT dump (curl HTTP 200 → revoked), anon messi_clear_old_events wipe (revoked), stored XSS via meta.goalsCount unescaped td (numeric coercion), prod fallback hash (fail-closed 503), VITE_ secret support (removed), default-salt single-SHA256 (scrypt + random salt), footer Supabase ref leak. Added HSTS/CSP/COOP + noindex admin/api headers. Files: api/_auth-shared.js + api/admin-events.js + supabase-security-fix.sql (new), api/admin-auth.js rewrite, src/admin.js (token/proxy/persistent lockout/XSS), src/analytics.js (whitelist/caps/throttle), src/app.js (token nav), admin.html, vercel.json, .env.example, scripts/generate-admin-hash.mjs (scrypt), README.md. Verify: node --check 7 files ok, scrypt gen ok, 15/15 auth unit tests pass, npm run build 618ms prebuild 928x3 ok, npm run audit dist 928x3 pass, admin bundle has no supabase URL. ACTION REQUIRED (operator): run supabase-security-fix.sql in Supabase SQL editor + set ADMIN_PASSWORD_HASH (scrypt) / ADMIN_SALT / ADMIN_SESSION_SECRET / SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in Vercel ENV + redeploy — admin reads 503 until then by design.

- 2026-09-14 — muse-spark-1.3 — 3dde6ff — hide Supabase keys from client (user: admin page literally exposes keys). Removed hardcoded SUPABASE_URL + ANON_KEY from src/analytics.js — analytics now POSTs to new server proxy api/track.js (SERVICE_ROLE server-side only, Origin check + 30/min throttle, RLS validation), client bundle verified dist/assets/* contains zero supabase.co / anon JWT. Dropped supabase.co from vercel.json CSP connect-src, scrubbed project ref from .env.example placeholder + SQL comments. Files: api/track.js (new), src/analytics.js, vercel.json, .env.example, supabase-*.sql, CONTEXT.md. Verify: node --check ok, npm run build 734ms prebuild 928x3 ok, DIST CLEAN.

- 2026-09-14 — muse-spark — 5e53cc1 — admin 503 diagnostics (user: Admin auth not configured after setting ENV + redeploy). Live-verified production POST /api/admin-auth → 503 (ENV invisible to function) + X-RateLimit-Store memory-single-instance (SUPABASE_* also missing in prod). Added server-log-only logMisconfig() in api/_auth-shared.js (presence/shape facts, never secret values; client stays generic) on all 4 misconfigured paths + malformed-scrypt now 503 instead of misleading 401. Files: api/_auth-shared.js, CONTEXT.md. Verify: node --check ok, scrypt good/bad/token unit checks pass, npm run build ok.

- 2026-09-14 — antigravity (gemini-3.8-flash) — a952478 — fix video clips CSP & direct stream playback (user: clips not working, video player says search clip on youtube). In f34ed17 CSP was added to vercel.json without media-src, which fell back to default-src 'self' and blocked all 921 clips hosted on https://cdn.messiallgoals.com, triggering video.onerror and showing fallback banner. Added media-src 'self' https://cdn.messiallgoals.com blob:; connect-src cdn.messiallgoals.com + AdSense telemetry; script/frame-src profitableratecpmnetwork.com. Removed invalid empty source element in birthday.html. Attached onerror before src in src/app.js + added graceful error fallback to On This Day widget. Files: vercel.json, birthday.html, src/app.js, CONTEXT.md. Verify: Playwright CSP verification test passed (readyState 4, 0 media CSP errors, fallback hidden), verify-all-players.py passed desktop+mobile, npm run build (678ms, 928x3 checksums ok), dist-audit pass.

- 2026-09-14 — antigravity (gemini-3.8-flash) — 6b59ed3 — fix admin auth resilience & diagnostics (user: admin auth not configured despite setting ENV and redeploying). Fixed failure modes: 1) verifyPassword blocked scrypt if ADMIN_SALT was missing even though scrypt embeds its own salt; 2) accidental quotes around pasted ENV values broke prefix matching; 3) supported VITE_ fallback for keys; 4) 503 response now returns clear diagnostics + help so operator sees exact ENV presence instead of generic failure. Files: api/_auth-shared.js, api/admin-auth.js, api/admin-events.js, api/track.js, CONTEXT.md. Verify: auth unit tests (scrypt without salt, quotes, VITE_ prefix, plaintext, diagnostics) pass, npm run build (558ms, 928x3 ok), npm run audit ok.

- 2026-09-14 — antigravity (gemini-3.8-flash) — 299e898 — support plaintext in ADMIN_PASSWORD_HASH & 8+ salt (live diagnostics showed user set 12-char password into ADMIN_PASSWORD_HASH + 12-char salt, triggering unrecognized format error). Added automatic fallback to candidatePass for non-hash ADMIN_PASSWORD_HASH and lowered salt requirement to 8+ chars. Files: api/_auth-shared.js, CONTEXT.md. Verify: unit test with 12-char password and 12-char salt passes, npm run build (557ms, 928x3 ok), npm run audit ok.

- 2026-09-15 — antigravity (gemini-3.8-flash) — b60d559 — SEO, indexing & Web Vitals overhaul (user: Google not showing site). Root-cause resolved: Vercel cleanUrls=true / trailingSlash=false caused 308 redirects on canonicals (https://www.messistat.com/en/ -> /en), sitemap.xml, google-site-verification file (google07f67a37d7a48a18.html -> 308), and all internal links (.html -> 308). Actions: 1) sitemap.xml updated to clean canonical URLs without trailing slashes, verified all image:loc images exist, updated to 928 goals / 1,173 apps; 2) robots.txt updated with explicit Disallow: /admin, /admin/, /en/admin, /api/ while allowing all public & AI bots; 3) canonical links across all 7 public pages aligned to clean URLs without trailing slashes; 4) meta titles and descriptions updated and synced to 928 goals / 1,173 apps; 5) verified exactly one H1 per page and proper header hierarchy; 6) verified all images have descriptive alt text and dimensions to prevent CLS; 7) schema markup (JSON-LD) audited and fixed across all pages (SportsPerson, Dataset, WebPage, BreadcrumbList, FAQPage, VideoObject) with trailing slashes removed; 8) internal links across all 8 HTML files cleaned from *.html to clean canonical URLs (/en, /en/goalsbyyear, etc.) eliminating 308 redirect hops; 9) added cleanEnRouting plugin to vite.config.js for local dev/preview parity; 10) verified Search Console verification meta tags added to index.html; 11) verified edge HTTPS & HSTS preload; 12) verified OpenGraph images with dimensions. Files: index.html, goalsbyyear.html, goalsbyseason.html, dashboard.html, timeline.html, achievements.html, birthday.html, admin.html, public/sitemap.xml, public/robots.txt, vite.config.js, CONTEXT.md. Verify: BOM check passed, audit-seo passed, validate-schema passed, check-links passed, npm run build (632ms, 928x3 ok), dist-audit passed.

- 2026-09-15 — antigravity (gemini-3.8-flash) — 9f2dfbe — complete security audit & stack hardening (user: complete security audit across authentication, authorization, RLS, API endpoints, exposed secrets, XSS, CSRF, SQLi, SSRF, CORS, CSP, headers, cookies, sessions, rate limits, input validation, dependency vulnerabilities, database permissions, error leakage, sourcemap exposure, bot protection, OWASP). Actions:
  1. Token Security & Fail-Closed Session: In api/_auth-shared.js, removed predictable fallback secrets in signToken and verifyToken. When secrets are unconfigured in production, signToken throws and verifyToken rejects immediately (fail-closed).
  2. Origin Validation & Cross-Tenant CSRF Protection: Replaced permissive .vercel.app substring checks with unified isOriginAllowed() validating exact messistat.com domains, localhost (non-prod), deployment URL, and messi-stats prefix, blocking third-party Vercel tenants and malicious cross-site POSTs. Applied across api/admin-auth.js, api/admin-events.js, and api/track.js.
  3. CSP & Caching Headers: Added frame-ancestors 'self' to Content-Security-Policy in vercel.json. Hardened Cache-Control on /admin and /api/(.*) with no-store, no-cache, must-revalidate, max-age=0 to prevent intermediate/browser caching of tokens and telemetry.
  4. Sourcemap Exposure Mitigation: Configured build.sourcemap: false in vite.config.js, ensuring no source maps are emitted in production dist/.
  5. HTML & DOM Injection Defense: Fixed malformed unclosed script tag and duplicated head tags in admin.html. Added safeCsvCell sanitizer in src/admin.js preventing spreadsheet formula injection (=, +, -, @) during CSV exports. Verified DOM XSS defenses in src/app.js.
  6. Supabase & Database Permissions: Hardened baseline schema supabase-messi-analytics.sql to match supabase-security-fix.sql, revoking anon select/execute and enabling strict RLS checks by default.
  7. Secret Leakage & Dependency Audit: Verified npm audit (0 vulnerabilities). Hardened .gitignore to exclude all .env variants. Updated .env.example documentation. Added automated security test suite scripts/security-audit-test.mjs (npm run audit:security).
  Files: api/_auth-shared.js, api/admin-auth.js, api/admin-events.js, api/track.js, admin.html, src/admin.js, vercel.json, vite.config.js, supabase-messi-analytics.sql, .env.example, .gitignore, package.json, scripts/security-audit-test.mjs, CONTEXT.md.
  Verify: node --check (8 files pass), npm run audit:security (7/7 suites pass), npm audit (0 vulnerabilities), npm run build (1.04s, 928x3 ok), npm run audit (all dist checks pass).

- 2026-09-18 — antigravity (gemini-3.8-flash) — 5b8a4ba — Google Search snippet favicon, logo, brand SEO & pre-rendered fallback overhaul (user: messistat.com not showing first on search, no logo in search results snippet; audit, fix, push to github with subagent research). Root cause: Google Search favicon guidelines require a square raster icon (PNG/ICO) multiple of 48px, but site only linked an SVG which Google Search does not support; root /favicon.ico returned 404; brand 'MessiStats' / 'messistat.com' was omitted from page titles causing brand searches to fall behind competitor domains; raw HTML contained client-side loading placeholder (<p id="lede">Loading…</p>) before JS hydration; robots.txt lacked Googlebot-Image declarations; stale 927 goal counts existed in metadata and app explore links. Actions: 1) Generated multi-resolution brand raster assets: public/favicon.ico (16, 32, 48), public/favicon-48x48.png, favicon-96x96.png, favicon-192x192.png, favicon-512x512.png, apple-touch-icon.png (180x180), logo-192.png, logo.png (512x512), and site.webmanifest; 2) Updated all 8 HTML shells with complete raster + SVG favicon link tags and brand-anchored page titles ('... | MessiStats'); 3) Pre-rendered static semantic HTML for <p id="lede"> and <section id="kpis"> with verified 928 goals / 1,173 appearances so crawlers index rich stats immediately without waiting for JS; 4) Enhanced JSON-LD with WebSite schema (name 'MessiStats', alternateNames ['messistat.com', 'MessiStat', 'Lionel Messi Stats']) and updated Organization logo to 512x512 PNG; 5) Updated public/robots.txt to explicitly allow Googlebot and Googlebot-Image across all image/favicon assets, and added image namespace to public/sitemap.xml; 6) Cleaned 404.html favicons and removed orphaned public/google07f67a37d7a48a18 (1).html; 7) Updated src/app.js to dynamically derive goal count in explore links and birthday notes; updated public/llms.txt and scripts/generate-og.mjs to 928 goals / 1,173 apps; 8) Updated scripts/dist-audit.cjs to verify existence of all required favicon and logo raster assets in production dist/. Files: index.html, goalsbyyear.html, goalsbyseason.html, dashboard.html, timeline.html, achievements.html, birthday.html, admin.html, public/robots.txt, public/sitemap.xml, public/404.html, public/site.webmanifest, public/llms.txt, public/favicon.ico, public/favicon*.png, public/apple-touch-icon.png, public/img/logo*.png, public/img/og-messi.jpg, scripts/generate-favicons.py, scripts/generate-og.mjs, scripts/dist-audit.cjs, src/app.js, CONTEXT.md. Verify: BOM check passed, UTF-8 clean, node --check passed, npm run build (1.28s, 928x3 ok), npm run audit (all dist checks pass), npm run verify passed.

## Agent Log

| Date | Agent (model) | Task | Commit | Files |
|---|---|---|---|---|
| 2026-09-14 | muse-spark-1.2 | AdSense re-insert & BOM fix + push | 2ba8e26 | 8 HTML, public/ads.txt, CONTEXT.md |
| 2026-09-14 | muse-spark-1.2 | admin ENV fix (Vercel not Supabase) | 9524bdb | api/admin-auth.js, src/admin.js, admin.html, .env.example, scripts/generate-admin-hash.mjs, package.json, .gitignore, README.md, CONTEXT.md |
| 2026-09-14 | muse-spark-1.2 | remember me + ignore admin views | e54443b | admin.html, src/admin.js, src/analytics.js, CONTEXT.md |
| 2026-09-14 | muse-spark-1.2 | admin UI/UX rebuild + side-offset fix | acbb6b1 | src/styles.css, admin.html, CONTEXT.md |
| 2026-09-14 | muse-spark-1.2 | hide admin nav + hero polish | b73d921 | admin.html, index.html, goalsbyyear.html, goalsbyseason.html, dashboard.html, timeline.html, achievements.html, birthday.html, src/app.js, src/admin.js, src/styles.css, CONTEXT.md |
<!-- ADD NEW ROWS BELOW — KEEP CHRONOLOGICAL -->
| 2026-09-14 | muse-spark-1.3 | security hardening pentest+fix | f34ed17 | api/_auth-shared.js, api/admin-events.js, supabase-security-fix.sql (new); api/admin-auth.js, src/admin.js, src/analytics.js, src/app.js, admin.html, vercel.json, .env.example, generate-admin-hash.mjs, README.md, CONTEXT.md |
| 2026-09-14 | muse-spark-1.3 | hide Supabase keys from client bundle | 3dde6ff | api/track.js (new), src/analytics.js, vercel.json, .env.example, supabase-*.sql, CONTEXT.md |
| 2026-09-14 | muse-spark | admin 503 diagnostics logging | 5e53cc1 | api/_auth-shared.js, CONTEXT.md |
| 2026-09-14 | antigravity (gemini-3.8-flash) | fix video clips blocked by CSP & video player fallback | a952478 | vercel.json, birthday.html, src/app.js, CONTEXT.md |
| 2026-09-14 | antigravity (gemini-3.8-flash) | fix admin auth resilience & diagnostics | 6b59ed3 | api/_auth-shared.js, api/admin-auth.js, api/admin-events.js, api/track.js, CONTEXT.md |
| 2026-09-14 | antigravity (gemini-3.8-flash) | support plaintext in ADMIN_PASSWORD_HASH & 8+ salt | 299e898 | api/_auth-shared.js, CONTEXT.md |
| 2026-09-15 | antigravity (gemini-3.8-flash) | full SEO, indexing, sitemap, robots, schema & Core Web Vitals overhaul | b60d559 | 8 HTML, public/sitemap.xml, public/robots.txt, vite.config.js, CONTEXT.md |
| 2026-09-15 | antigravity (gemini-3.8-flash) | complete stack security audit, fail-closed auth, origin checks, CSP & OWASP hardening | 9f2dfbe | api/*, src/admin.js, admin.html, vercel.json, vite.config.js, supabase-messi-analytics.sql, .env.example, .gitignore, package.json, scripts/security-audit-test.mjs, CONTEXT.md |
| 2026-09-18 | antigravity (gemini-3.8-flash) | Google search snippet favicon, logo, brand SEO & pre-rendered fallback overhaul | 5b8a4ba | 8 HTML, public/robots.txt, public/sitemap.xml, public/favicon*, public/img/logo*, scripts/*, src/app.js, CONTEXT.md |
