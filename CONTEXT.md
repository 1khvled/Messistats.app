# CONTEXT.md — messi-stats (for AI agents)

Read this before touching anything. Last updated 2026-09-09.

## What this is

A static Lionel Messi career-statistics website, deliberately modeled on
**https://ronaldostats.app/** (structure, sections, and data depth — NOT its
code or visual identity). 6 static pages, one JSON data file, no backend, no
API keys, zero third-party requests by default.

Live numbers: **927 goals / 1,172 apps** (802 club + 125 Argentina),
44 team trophies, 8 Ballons d'Or. Updated 9 September 2026.

## Stack & commands

- Vite 6 multi-page (`vite.config.js` entries: main/index, goalsbyyear,
  goalsbyseason, dashboard, timeline, achievements). `base: './'`, outDir `dist`.
- `npm run dev` / `npm run build` (build output verified 2026-09-09, ~258ms).
- `npm run verify` = `node scripts/verify.mjs` (free public feeds → writes
  `public/data/last-check.json` ONLY) + `smart-check.mjs --dry-run`
  (matchday-gated staging; cheap exit when nothing new). NEVER writes totals.
- `npm run verify:smart:write` persists staged rows to `public/data/pending.json`.
- `scripts/confirm-provisional.mjs` = human confirms a pending row by hand.

## File map

| File | Role |
|---|---|
| `public/data/messi-data.json` | THE source of truth. Everything renders from this. |
| `public/data/last-check.json` | Machine-written check log (verify script). Not rendered as stats. |
| `public/data/pending.json` | Staged unverified rows awaiting human review. |
| `src/app.js` | Only renderer. Branches on `body[data-page]`: home/byyear/byseason/dashboard/timeline/achievements. |
| `src/styles.css` | Editorial light theme (paper/navy/sky/gold, serif display). Tables carry the design — no gradients/glass. |
| `src/ads.js`, `src/matchday.js` | Ads + DISABLED-by-default client matchday check. Leave off. |
| `index.html`, `goalsbyyear.html`, `goalsbyseason.html`, `dashboard.html`, `timeline.html`, `achievements.html` | Thin shells: topline, nav, empty mount divs, footer. Content injected by app.js. |
| `scripts/deepen-data.py` | One-shot deepener (already ran). Keep for reference; re-running overwrites JSON sections. |
| `worker/smart-check.js`, `worker/schema.sql`, `wrangler.toml` | Cloudflare cron design (2h, worker-side gating, D1 `pending_checks`). `wrangler.toml` still has REPLACE-WITH-D1-ID — NOT deployed. |

## Data model (`messi-data.json`)

- `meta`: status CROSS_CHECKED, `methodNote`, `verification[]` (8 bullets incl. PROVISIONAL caveat), `sources[]`.
- `profile`: includes age 39, role Forward, current Inter Miami.
- `totals`: `{apps:1172, goals:927, assists:400}`, `clubs:{965/802}`, `country:{207/125}`, `goalsPerGame:"0.79"`.
- `clubSeasons[]` (23 rows, 2004/05–2026): each has `apps/goals` + `league/cup/continental/other` `{apps,goals}` pairs. PRESERVE EXACTLY — competition splits derive from these.
- `countryYears[]` (22 rows, 2005–2026): Argentina calendar years.
- `calendarYears[]` (23 rows, 2004–2026): MUST sum to 927. 2026 row has `provisional:true`.
- `byCompetition[]` (12 rows): MUST sum to 927. Derived from season rows (Barca continental=UCL 120, other=22; PSG UCL 9; Miami MLS 68/Concacaf 8/other 22) + country recounts (WC 21, Copa 14, other intl 90). Recompute from `clubSeasons` if editing.
- `byFinish{openPlay:752, penalties:109, freeKicks:66}` + `hatTricks:57` + `byBodyPart[]` (740/150/27/10): widely published compiled tallies, PROVISIONAL until match-by-match hand count. Always show the caveat next to them (pages do).
- `trophies[]` (20 rows, team-by-team with counts+seasons = 44 total), `individual[]` (8 awards), `timeline[]` (18 entries, dated).

## Iron rules

1. Totals change BY HAND with a named source + review. No automation writes `messi-data.json` totals. Ever.
2. After ANY data edit: calendarYears sum == 927, byCompetition sum == 927, byBodyPart sum == 927. Assert before saving.
3. Provisional fields (penalties/FK/hat-tricks/body/assists) always ship with the "provisional until hand count" caveat in UI copy.
4. Site makes zero third-party requests by default. Keep `matchday.js` disabled unless asked.
5. Free sources only: ESPN public score feed (usa.1 = MLS code), openfootball CC0 data, football-data.org free tier (EU backup). No paid APIs, no keys.
6. Design language: light editorial paper theme. The user explicitly rejected generic dark "AI slop" — do NOT revert to dark gradients/glassmorphism.
7. Reference for IA/depth: ronaldostats.app (hero+bio, snapshot cards, Q&A, club grid, year chart+table, season division tables, team-filter dashboard, timeline, trophy lists). Structure inspiration only.

## What was done 2026-09-09 (this session)

- Studied ronaldostats.app (homepage, dashboard, goals-by-year/season, timeline, achievements, sitemap) via fetch+search — no Playwright MCP is connected in this environment, so mapping was done at section/column granularity without screenshots.
- Deepened `messi-data.json`: +calendarYears (23), +byCompetition (12), +byFinish/+hatTricks/+byBodyPart, trophies 8→20 rows, timeline 8→18, profile age/role/current, totals.goalsPerGame. clubSeasons/countryYears untouched.
- Rewrote `src/styles.css` (editorial light theme), all 6 HTML shells (ronaldostats IA: hero+bio+snap+QA+club grid+year bars+milestones+method+trophies+cross-links), `src/app.js` (6 page renderers).
- Rewrote README "free sources" section in plain English (the "what is this??" complaint) + fixed stale assists-null rule.
- `npm run build` ✓, `npm run verify` ✓ (espn/worldcup ok, cheap exit, 0 unseen).
- UI 10x pass: fixed unstyled JS-injected markup (`.ybar` vertical charts, `.pill` filters, `details/summary` accordions, `.tl-item` timeline rail, `.trow` trophy badges all had zero CSS); added sticky blurred nav + scroll shadow, fluid `clamp()` type, stat count-up + scroll reveal (reduced-motion safe), table row-hover + tabular numerals, link cards with arrow affordance, gold h1 accent bar, avatar ring. `src/ads.js` untouched — collapse-to-zero + max-3-slots + lazy-observer guardrails already correct for future AdSense.
- Spawned 2 background subagents: (1) Cloudflare smart auto-updates (worker cron + D1 staging, deploy-ready, no auto-write to totals); (2) mobile/tablet responsive pass (runs on final CSS, styles.css only). Results pending — log them here when they land.
- Cloudflare subagent DONE: `worker/smart-check.js` already met spec (left untouched); added `idx_pending_match_date` to `worker/schema.sql`; consolidated README into one canonical `## Deploy` section (build → `d1 create` → `d1 execute --file=worker/schema.sql` → paste id → `wrangler deploy`). Grep-confirmed no automation writes totals. Build ✓ + verify ✓ (cheap exit, 0 unseen). NOT deployed — needs your `wrangler` login + the 3 commands.
- Mobile subagent DONE: additive-only responsive section in `src/styles.css` (desktop pixel-identical); ≤640px nav becomes a swipeable single row with 44px targets + `scroll-padding-top:96px`; tables/charts scroll inside cards with edge-fade affordance; single-column stacking ≤560px; safe-area insets + `viewport-fit=cover` (only HTML change, all 6 pages); sticky first column deliberately skipped (misaligns with card padding); ad CSS byte-identical. Build ✓, preview-server fetch ✓. Final `npm run build` ✓ + `npm run verify` ✓ re-run by main agent after both landed.
- VISUAL REBUILD (user demanded pixel-parity with ronaldostats.app, verified with Playwright screenshots): rewrote all 6 HTML shells (sidebar `.rail` 76px→248px hover, LM10 badge, 6 SVG nav links, eyebrow/H1/lede, page mounts, app+ads+matchday scripts), rewrote `src/styles.css` (~400 lines, own code: DM Sans + Plus Jakarta Sans self-hosted woff2 in `public/fonts/`, `--ink:#16243a`/`--brand:#2f56cf` glass tokens, kpi/qa/table/spark/hbar/donut/record/trophy/split/chapter/pill/explore/method styles, reveal animation, 1080/900/640 breakpoints incl. bottom icon bar), rewrote `src/app.js` (normalize() bridges REAL json shapes — byFinish/byBodyPart are ARRAYS, totals has no apps key at top level, trophies count=years.length, clubSeasons use [a,g] arrays, Miami seasons are single-year; sparkSVG 1000×196 bars+cumulative line; donutSVG; 6 page renderers + ?team= dashboard filter with UCL-120/9 split caveat). Layout/sections recreated, NO copied code/images/logos (CSS initial-disc badges + LM medallion).
- Visual-compare fixes: timeline chapters needed `.ch-head`/`.tl-events` CSS (years jammed into titles); achievements `teamTotal` was summing all 20 trophy rows = 79 (data embeds 7 team:"Individual" rows worth 35 honours) — now excludes Individual → 44, renders new "Individual honours — 35 awards" group, added `.tpill` flex + count-badge CSS. All 6 pages screenshot-verified on localhost:5173, 0 console errors, build ✓, verify ✓ (cheap exit).
- PHOTO + FUNCTIONALITY PASS (user: "add messi photo like ronaldo stats did, more functionality and stats"): reference hero uses a small photo in the identity card (56px img, alt "Cristiano Ronaldo kissing the Ballon d'Or trophy"). Added `public/img/messi.jpg` (440px Commons thumbnail of File:Lionel Messi 20180626.jpg, CC BY-SA 3.0 Kirill Venediktov, 116KB, self-hosted per zero-request rule) rendered in home `.identity-photo` figure with visible attribution caption (artist + license links). New shared helpers `sortable()` (click/Enter on any th, numeric-aware incl. "apps/goals" pairs sorts by goals, `tr.total` pinned, aria-sorted + arrow CSS) and `tableSearch()` (live filter, total rows stay visible) wired to home club+silver, byyear, byseason club+country, dashboard comp+finish tables. Goalsbyyear gained "Goals by decade" kpis-3 strip (106/579/242 = 927 ✓, new `#decades` mount in goalsbyyear.html). Dashboard gained "Goals at every age" hbar card from calendarYears (23 rows, peak callout, career-only with honest filter caveat; new `#age-card` mount in dashboard.html) + share-% in both donut legends + missing "Other (chest etc.) 10" row in finish table. Home road-to-1000 KPI now projects (~35/yr 2023–25 pace → ~2028, labeled rough projection) + 7th record "goals since turning 30" computed from calendarYears (397, ~43%). CSS: photo/credit rules, `.hbar-name`/`.hbar-val` aliases (renderer used different class names than the stylesheet), sort arrows, search-pill input. Verified: home/byyear/dashboard(/+?team=barcelona)/byseason on localhost:5173, 0 console errors (2 benign pre-existing font-preload warnings), sort/filter/age-bars probed via evaluate, build ✓, verify ✓ (cheap exit).
- TIMELINE UPGRADE + VERCEL-READY (user: "timeline is not an exact copy" + "make the website vercel ready"; exact-copy refused — reference is copyrighted, so same depth with original code only). Timeline subagent: sticky 7-era jump-nav (`nav#era-nav`, smooth-scroll reduced-motion safe, IntersectionObserver `aria-current` highlight), live milestone search (`input#tl-filter` + `aria-live` count, hides emptied chapters, no-results note), per-era CSS goal bars + share-of-927 notes, date badges/marker rail/"in progress" chip, reveal-on-scroll, ≤640px pass — all CSS scoped under `body[data-page="timeline"]`, mounts intact. ERA-MATH FIX: old eraOf ranges overlapped 2021+2023 (spans summed 1012); eras now non-overlapping spans 68/248/155/164/120/77/95 = 927 ✓, method note documents partitioning, JSON untouched. Verified Playwright: 0 console errors, "18 milestones across 7 eras · 927 goals", "World Cup"→6/18, 390px zero horizontal overflow, index regression clean. Vercel subagent: new `vercel.json` (build `npm run build`, output `dist`, cleanUrls, immutable fonts/img/assets, no-cache data; no functions/rewrites — every route is a real .html file) + minimal `.vercelignore` (worker, wrangler.toml, scripts) + README "Deploy on Vercel" section (import repo, Vite preset, build `npm run build`, output `dist`, no env vars; check all 6 clean URLs + /data/messi-data.json = 927). Verified dist preview: all 6 pages + JSON + fonts + photo 200, public/dist JSON SHA identical, base './' kept (build rebases /fonts/→../fonts/). Build ✓ (409ms), verify ✓ (cheap exit). NOT deployed — needs your Vercel import.
- TEAM BADGES + TIMELINE ERA PHOTOS (user: "real barcelona icons, real team icons, real photos of messi on the timeline"). Official crests are trademarked — declined, shipped ORIGINAL club-colour badges instead: `.club-badge` now 30px rounded-square with per-team designs via `data-team` (barcelona=Blaugrana split, psg=navy+red band, miami=pink gradient, argentina=sky/white stripes; `badge()` in app.js drops inline styles). Real photos must be freely licensed: 7 CC action shots from Wikimedia Commons self-hosted in `public/img/` (era-2005/2011/2014/2016-Barca, era-2021-PSG, era-2022-Argentina WC, era-2025-Miami; ~600KB total, all lazy + explicit dimensions; era-2016 resized PNG→JPEG q82 730KB→71KB), wired into timeline chapters via `ERA_PHOTOS`+`eraPhotos()` with visible Commons-file + licence-deed credit captions (2019–2021 farewell era has no verified photo → renders no figure). Crests visible on shirts inside photos = documentary use, not reproduced assets. Verified dist preview: 7/7 imgs naturalWidth>0, Paris chapter screenshot (PSG+WC photos side by side), home club-grid badges screenshot (778+75+112+207=1172 ✓), 0 console errors, build ✓, verify ✓ (cheap exit).
