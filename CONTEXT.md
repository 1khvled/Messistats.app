# CONTEXT.md — messi-stats (for AI agents)

Read this before touching anything. Last updated 2026-09-12 (admin/analytics removal reconciled).

## What this is

A static Lionel Messi career-statistics website, deliberately modeled on
**https://ronaldostats.app/** (structure, sections, and data depth — NOT its
code or visual identity). 6 static pages, one JSON data file, no backend, no
API keys, zero third-party requests by default.

Live numbers: **927 goals / 1,172 apps** (802 club + 125 Argentina),
46 team trophies, 8 Ballons d'Or. Updated 10 September 2026.

## Stack & commands

- Vite 6 multi-page (`vite.config.js` entries: main/index, goalsbyyear,
  goalsbyseason, dashboard, timeline, achievements). `base: './'`, outDir `dist`.
- `npm run dev` / `npm run build` (build output verified 2026-09-09, ~258ms).
- `npm run verify` = `node scripts/verify.mjs` (free public feeds → writes
  `public/data/last-check.json` ONLY) + `node scripts/source-watch.mjs`
  (fetch-and-stage-only watcher: stages feed mismatches into `pending.json`,
  NEVER writes totals) + `smart-check.mjs --dry-run`
  (matchday-gated staging; cheap exit when nothing new).
- `npm run verify:watch` runs the source-watcher alone.
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
- `trophies[]` (22 rows, team-by-team with counts+seasons = 46 total), `individual[]` (8 awards), `timeline[]` (18 entries, dated).

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
- TIMELINE CLOSE-UP UPGRADE (user: replace weak timeline photos with quality close-ups, displayed well). Viewed every era photo on disk with the Read tool — 2005/2021/2025 portraits all correct, 2011/2014 banner crops verified on screen. CAUGHT a stale-summary error: era-2016 on disk was STILL the rear-view Remontada free-kick shot (394,535B, 1280x1217) while the old caption claimed a front portrait — caption and pixels mismatched. Remontada series has only 3 Commons files, all rear views, so re-sourced from year-category enumeration instead: new era-2016 = File:Real Valladolid - FC Barcelona, 2018-08-25 (106) cropped.jpg (CC BY-SA 4.0, www.realvalladolid.es), 1280x1707 377KB front Blaugrana close-up, pos 50% 5% keeps full face in the 340px banner (screenshot-verified: eyes+beard+crest in frame), honest caption "Against Valladolid, La Liga 2018" (Aug 2018 inside the 2016–2018 chapter). JSON untouched. Build ✓, verify ✓ (cheap exit), console 0 errors (2 benign font-preload warnings), home badge regression clean (1,172/927 ✓). `candidate/` scratch deleted.
- 44-TO-46 RECONCILE (user: "do 46"). messi.com's official career count is 46; bridging inclusions vs the old 44 are Supporters' Shield (Inter Miami 2024), MLS Cup (Inter Miami 2025), Olympic Gold 2008 (Argentina). teamTotal now derives from data (excludes Individual): 35 Barcelona + 3 PSG + 3 Miami + 5 Argentina = 46 across 22 trophy rows. "46th title (Oct 2024)" ordinal was unverifiable (messi.com fetch 403s) so the Shield note was neutralized to "First Supporters' Shield in club history (Oct 2024); one of the three Inter Miami titles in the official 46". Achievements splits converted from hardcoded copy to a data-derived `per` map so future edits propagate. Checksums hold: calendarYears = byCompetition = byBodyPart array = 927.
- SOURCE-WATCHER WIRING (user: "make those all sources u just scraped permentante scripts that always fires and auto scrape" — reconciled as fetch-and-stage-only, user did not object). New `scripts/source-watch.mjs` wired into `npm run verify` (verify.mjs + source-watch.mjs + smart-check --dry-run) plus standalone `npm run verify:watch`. It NEVER writes totals: mismatches stage into `pending.json` for hand confirmation. Proven in production: one run staged 2 new rows (needs_review=3), messi-data.json untouched by design.
- SEO/GEO PASS #2: SpeakableSpecification + Organization JSON-LD, sitemap.xml, robots.txt, hand-maintained public/llms.txt (46-title / WC-record wording kept in sync there too). Placeholder canonical domain https://messi-stats.vercel.app marked TODO — do NOT invent a production domain.
- REAL TEAM CRESTS (user overrode the trademark rule 3 times, so shipped with trademark footers on all 6 pages). `public/img/teams/`: barcelona.png + psg.png + miami.png re-downloaded from ESPN CDN after a stopped agent mislabeled files (ground truth = viewed PNGs with Read tool, not agent summaries). No CC AFA crest exists on Commons, so argentina.png is the Argentina FLAG per ESPN national-team convention, not a crest. `badge()` renders crest-img with onerror fallback to the CSS colour badge. All 4 probe naturalWidth 500 (early 0s were lazy-load-below-fold, not broken files).
- TROPHY CABINET on achievements.html: cab-ballon.jpg (CC0), cab-ucl.jpg (CC BY 2.0 galkiux, Rome 2009 squad), cab-liga.jpg (CC BY 2.0 Oemar). NO licensed WC-lift photo exists, so it is honestly omitted with a visible note instead of a fake. Root scratch `mls.json` + `wiki_messi.json` deleted (unreferenced).
- WC-RECORD WORDING FIX (research conflict C4, report-only rule): web search CONFIRMED (beIN "Mbappe surpasses Messi", Gulf News "Mbappe overtakes Messi", FOX all-time list) that Mbappe overtook Messi's 21 at the 2026 finals, so all WC-record copy now says "the all-time record until Kylian Mbappe overtook him at the 2026 finals". Other open conflicts, NOT silently corrected: penalties 109 vs 114/149, hat-tricks 57 vs 54/61, assists 400 vs 422 — all stay provisional-with-caveat.
- Verified 2026-09-10: build clean (444ms, 6 pages), verify exit 0 (927x3, expected staged items), Playwright on dist preview — home KPIs 927/1,172/125/46 + silver 35/5/3/3 + valid JSON-LD, achievements derived "35/5/3/3" + 3 cabinet imgs + 0 console errors, dashboard record 46 + team cards 672/32/98/125, 390px viewport no page overflow. Preview server stopped afterwards.
- HAND-CHECK QUEUE (pending.json needs_review=3, for the user): `watch:espn-mls-stale:espn23` (ESPN 23 completed 2026 Miami games vs JSON league apps 20), `watch:article:espn-tracker:*` (tracker page changed), `watch:unreadable:messicom-46` (403, manual-only). Agents never commit; no commit ordered.
- HUMANIZE PASS (user: "timeline photos are still dog shit also site seems AI i need more human ... take inspiration from messistats.com too"). messistats.com/en is behind a Cloudflare bot check (fetch returns challenge text only) — inspiration taken from its known character (dense annotated year tables, fan-made nerd depth) instead. SHIPPED (#19/#20 done): 7 per-era narrative openers (`ERA_INTRO` in app.js, fan voice, famous-nights prose, zero new numbers), method section rewritten first-person ("How I put these numbers together") + `.colophon` sign-off, home lede "counted by hand and checked twice", 9 famous-season margin notes on goalsbyyear (`YEAR_NOTES`: 2005 first goals ... 2024 Copa winner, all backed by trophy/records data), CSS polaroid chapter photos (white frame, +/-0.7deg alternating tilt), `.chapter-intro` drop caps, rubber-stamp `.updated-badge` (dashed, rotated, uppercase), `.yr-note` style. Verified dist preview: timeline era-0 polaroid+intro screenshot, byyear 9 notes, home method screenshot, 390px no overflow, 0 console errors, build + verify clean. NOT committed (no order).
- ERA-PHOTO SWAP STILL BLOCKED (#18 in_progress): upload.wikimedia.org 429-throttles this IP (4 attempts over ~30min all 429; commons API host works fine). Replacement candidates fully resolved via API, NO binary downloaded yet: 2013-2015 era = Ank-Kumar "03 (cropped)" portrait 1100x1558 CC BY-SA 4.0 (same series as current wide shot); 2004-2008 era = "He's the best, period - 24-365" 1525x2278 CC BY-SA 2.0 OR "Messi 2008.jpg" 992x1495 CC BY 2.0. New `scripts/fetch-era-photos.ps1` downloads all 3 into `candidate/` with polite delays — run it after the throttle lifts, VIEW pixels before wiring into ERA_PHOTOS (caption/file/lic/w/h/pos update together). Screenshot note: current era-2005 at banner size is a passable young-Messi portrait (soft, face near top edge) — replacement still wanted, just not an emergency.
- VERIFY 2026-09-10 ~11:35 UTC: exit 0, messi-data.json untouched; needs_review grew 3->9 (article hash changes incl. gulfnews-400 assists source, +1 matchday row: 2026-09-10 Chicago 1-1 Miami, ESPN names Messi 0G/1A, single-source so staged not applied). Flag the Chicago row + gulfnews-400 change to the user as hand-checks.
- USER-PHOTO INSTALL (#18 done, 2026-09-10): user supplied own photos in `C:\Users\Abdelli\Desktop\candidate\` ("stop searching for photos"). Six installed into `public/img/` with pixel-verified identity (canvas-drawImage capture + dHash 0-1 + PIL dims): era-2011-wembley.jpg (399x501, user file "UCL 2025 LIFTING THE TROPHIE.jpg" = Wembley 2011 trophy lift despite filename) + era-2021-tears.jpg (1800x1800 webp->jpg, "messi farewell barcelona press conference.webp" = Camp Nou goodbye presser) + era-2014-stare.jpg (679x452 WC-final trophy stare) + era-2021-copa.jpg (397x503 kissing Copa) + era-2021-psg-signing.jpg (1200x900 PSG signing) + era-2023-miami.jpg (679x451 pink unveiling). Excluded as suspect: two-Copas composite (messicom watermark), "2026 wc crying" (actually 2022, HOLA watermark), both Ballon d'Or files (unverifiable years). ERA_PHOTOS w/h+pos+honest captions updated; credits render "fan-provided photo" with NO fake licence links. LESSON: parallel Read calls on images can return results SWAPPED â€” verify images with sequential Reads + dHash/canvas, never parallel eyeballing (one crossed misinstall caught and fixed this way). Verified fixed1/fixed4 desktop + fixed1/fixed4 mobile screenshots, build + verify clean. No commit (no order).
- USER-PHOTO ROUND 2 (same session): viewed the rest of `candidate\` (sequential Reads; AVIFs unreadable by the Read tool so PIL-converted to PNG first — never Read .avif directly). Wired 4 more: peak era swaps Piqué-lifts-cup Rome shot for era-2012-ballon.jpg (554x554, polka-dot suit, 4th straight Ballon d'Or); Paris era swaps generic PSG-action for era-2021-ballon7.jpg (480x639, sparkling jacket, 7th); Miami era swaps 2025 action for era-2023-ballon8.jpg (554x554, record 8th) + era-2024-copa.jpg (562x546, two Copa trophies). Deduped by SHA-256 + dHash-0: user's "UCL 2025" file == era-2011-wembley (kept wired name), farewell webp == era-2021-tears (kept wired name), 2014 file == era-2014-stare, PSG webp == era-2021-psg-signing — deleted the 4 duplicate copies. Removed now-unwired Commons files era-2009-rome/era-2021/era-2025 (no orphans left). Still unused from user folder: 2009/2010/2011/2015 Ballon portraits, 2013-avif + 2019-avif ceremony shots, HOLA-watermarked 2026 file (skipped: commercial mag watermark). needs_review=16 (new: espn-tracker page changed again, Chicago 1-1 Miami row still single-source). All 7 chapters screenshot-verified desktop + 390px mobile, build + verify clean. No commit (no order).
- ANALYTICS/BLOB/ADMIN — REMOVED by design (commits 0883309 + 3caa74a, Sep 2026).
  The `@vercel/analytics` inject, `api/count.js` Blob counter and `admin.html`
  owner-gated page were built, then deliberately deleted: the Blob
  read-increment-write races under concurrency, and Vercel Web Analytics covers
  the use-case with zero code. Do NOT "restore" them without a user order.
  `package.json` has no analytics/blob deps, there is no `api/` dir, and
  `vite.config.js` has exactly 6 inputs (no admin).
- LOGO (shipped, in repo): original shield mark — Blaugrana diagonal gradient
  (--hero-grad), gold keyline + single gold star (2022 WC nod), white M10
  monogram. `public/favicon.svg` + inline-SVG `.rail-mark` on all 6 shells with
  `.rail-word` MessiStats reveal on hover. No club/crest assets copied.
- UI-SKILLS POLISH (shipped, in repo): font smoothing, text-wrap balance/pretty,
  btn/pill press scale + exact-property transitions, btn-primary navy fill,
  :focus-visible gold outline, `.caveat.err` red. Rail rework / shadows / hbar
  label changes were rejected per identity rules.
  NOTE (2026-09-12 audit): `.btn-primary` was actually missing from styles.css
  (only existed in the removed admin form) — re-added with the share-row styles.
- FULL IMPROVEMENT PASS 2026-09-12 ("DO ALL"): (1) CONTEXT reconciled (above);
  (2) `scripts/prebuild-check.mjs` + `prebuild` script — build fails if 927x3
  sums disagree (vs totals.combined.goals, not hardcoded) or the provisional
  caveat leaves app.js; (3) queue hygiene — article rows UPSERT per slug
  (stable `watch:article:<slug>`, newest wins), cap 100 + 90d expiry
  (internal exempt), new `npm run triage` (+ `--prune`); one prune collapsed
  29→10 rows (14 were one ESPN tracker slug); (4) deploy fixes — `public/404.html`
  rewritten self-contained (old linked dist-missing `src/styles.css` + nonexistent
  classes), `_headers` gains fonts/img immutable to match vercel.json, sitemap
  lastmod → 2026-09-12, new `scripts/dist-audit.cjs` (`npm run audit`) + 11-route
  preview smoke test all 200; (5) images — 10 JPEGs >100KB re-encoded q80
  progressive, max-edge 1280 (era-2008 1128→169KB, era-2016 368→134KB,
  tears 297→118KB; total ~4.0→~1.7MB), ERA_PHOTOS w/h updated for the 3 resized,
  OG stays 1200x630; (6) UX — skip-link + #main on all 6 shells, tableSearch
  URL persistence (?q=, ?season=, ?country=; new country-table search),
  home copy-headline-stats button with clipboard fallback, @media print rules,
  contrast audit all ≥4.5 (gold 5.43, faint 4.54). LESSON: never edit HTML via
  PowerShell Set-Content — it writes BOM + mangles UTF-8 dashes; use node fs.
  Verified: build ✓ (prebuild gate runs), audit PASS, verify exit 0
  (upsert proven live: "row updated in place", queue steady at 10).
  Committed dae8a91, pushed to origin/main (1khvled/Messistats.app).
  FIX 2026-09-12 (7f19cf7): Vercel build failed MODULE_NOT_FOUND for
  scripts/prebuild-check.mjs — .vercelignore excluded scripts/ and Vercel
  applies the ignore BEFORE building. Removed `scripts` from .vercelignore
  (audited: zero secrets in scripts/, keyless by design) with a comment
  explaining why it must stay. worker/ + wrangler.toml stay ignored.
  Still open: Vercel import + production domain
  swap (canonical/OG/sitemap/robots TODOs), Chicago 1-1 Miami hand-check.
- VERCEL ANALYTICS RE-ADDED 2026-09-12 (user pasted the get-started panel and
  ordered it back, overriding the 0883309 removal): `npm i @vercel/analytics`
  (0 vulns) + `inject()` at the top of src/app.js. The panel's Next.js
  `<Analytics/>` component does not apply — no React here — so the documented
  framework-free `inject()` is used instead; one call covers all 6 pages since
  every shell loads app.js. Only sends data on the Vercel deployment (locally
  `/_vercel/insights/script.js` 404s silently); bundle +1.5KB. Exception to
  iron rule #4 (zero third-party requests) is user-ordered. Needs a redeploy +
  real visits before the dashboard shows data (allow ~30s, disable adblock).
- SPEED INSIGHTS 2026-09-12 (same panel, same pattern): `npm i
  @vercel/speed-insights` (0 vulns) + `injectSpeedInsights()` next to inject()
  in app.js (panel's `<SpeedInsights/>` is Next-only; this is the vanilla
  equivalent, all 6 pages covered). Bundle 64.2→65.8KB. Same production-only
  behavior. Committed + pushed with the analytics change.
- WIKIPEDIA PHOTO REPLACEMENT 2026-09-13 (user: "work on wikipedia photos delete them all replace them by good photos"):
  Replaced all remaining Wikimedia Commons photos with high-resolution, iconic, professional action & celebration shots:
  (1) `messi.jpg`: studio-lit official portrait in Argentina kit (900x1600, 182KB); re-rendered `og-messi.jpg` (1200x630, 82KB);
  (2) `era-2008-olympic.jpg`: young Messi celebrating his iconic 2007 El Clásico hat-trick at Camp Nou (1636x1400, 324KB);
  (3) `era-2011.jpg`: Messi roaring in joy celebrating at Wembley in 2011 Champions League final (1800x1013, 302KB);
  (4) `era-2015-supercup.jpg`: MSN trident (Messi, Neymar, Suárez) running arm-in-arm celebrating at Camp Nou (1192x670, 114KB);
  (5) `era-2016.jpg`: iconic Santiago Bernabéu shirt #10 celebration in April 2017 (1013x1800, 313KB);
  (6) `era-2019-ballon.jpg`: Messi smiling on stage in Paris behind all six Ballons d'Or (1800x1251, 288KB);
  (7) `era-2022.jpg`: Messi on Agüero's shoulders lifting the World Cup trophy in Lusail (1800x1212, 376KB);
  (8) `cab-ballon.jpg`: Messi in black tie holding golden Ballon d'Or trophy smiling (696x1500, 128KB);
  (9) `cab-ucl.jpg`: Messi hoisting the European Cup at Wembley 2011 with winners' medal (1174x1700, 301KB);
  (10) `cab-liga.jpg`: Messi lifting the La Liga trophy as captain at Camp Nou (732x1024, 113KB).
  Cleaned all Wikimedia Commons URLs, CC licenses, and disclaimer notes in `src/app.js`. Deleted obsolete `scripts/fetch-era-photos.ps1`.
  Verified: build ✓, audit PASS, verify exit 0.
- ADSENSE, BERNABÉU CELEBRATION, TROPHY CABINET & CREST FIXES 2026-09-13:
  (1) Google AdSense: inserted `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8397501846754760" crossorigin="anonymous"></script>` in `<head>` across all 6 HTML shells; configured publisher `pub-8397501846754760` in `public/ads.txt` and `src/ads.js`.
  (2) Santiago Bernabéu Shirt Celebration (`era-2016.jpg`): replaced awkward 9:16 vertical wallpaper crop with the canonical 16:9 landscape photo (1800x1013, 224KB) of Messi holding his #10 jersey to the Bernabéu crowd after his 500th goal in April 2017; updated `.ch-photos.solo .ch-photo img` to `height: 380px; object-position: 50% 25%` so Messi's face, jersey #10 and the crowd are completely visible.
  (3) Trophy Cabinet on `achievements.html`: added the 2022 World Cup trophy lift (`cab-wc.jpg`) as the crowning #1 card; added 8x Ballon d'Or (`cab-ballon.jpg`), 4x Champions League (`cab-ucl.jpg`), and 2x Copa América (`cab-copa.jpg`); re-cropped all 4 to 800x600 (4:3) with both Messi and the trophy centered; upgraded `.cabinet` to a responsive 4-card grid (4 cols desktop, 2 cols tablet, 1 col mobile) with `aspect-ratio: 4 / 3; height: auto; object-fit: cover`.
  (4) Club Logos/Crests: fixed `.crest:has(.crest-img) .club-badge { display: none; }` and inline fallback handling so square gradient badges and text no longer bleed behind transparent crests; replaced `argentina.png` with a clean 500x500 circular emblem (albiceleste sky blue ring + official 3-star AFA gold shield) matching the style of PSG and Inter Miami.
  Verified: prebuild-check ✓ (927x3 checksums hold), vite build ✓ (502ms), dist audit PASS, verify exit 0.


