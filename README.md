# messi-stats (localhost first)

Clone of ronaldostats.app structure for Lionel Messi. Static site, 100% free data only.

## Run locally

```powershell
cd "$env:USERPROFILE\Desktop\Projects\messi-stats"
npm install
npm run dev
# open http://localhost:5173/
```

Build check: `npm run build` then `npm run preview` (http://localhost:4173/).

## Data rule (no mistakes)

- `public/data/messi-data.json` is the ONLY source of truth the pages render.
- Status: `CROSS_CHECKED` (2026-09-09) - club splits from Wikipedia/BDFutbol tables,
  Argentina years confirmed against ESPN milestones, World Cup goals recounted
  from openfootball JSON. See `meta.verification` in the JSON for the full trail.
- Penalties (109), free kicks (66), hat-tricks (57), foot split and assists are
  widely published compiled tallies, shown as PROVISIONAL until a true
  match-by-match hand count is finished. The JSON's `meta.verification`
  says so explicitly; the pages repeat the caveat next to those tables.
- `npm run verify` only READS free public scoreboards (ESPN's public
  score feed for US soccer, openfootball's free public data) and writes
  `public/data/last-check.json`. It never overwrites totals.

## Where the numbers come from (plain English)

No paid data feeds, no API keys, no logins. Three free sources:

- **ESPN's public score feed** — the same data behind scoreboard pages, e.g.
  `https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/scoreboard`
  ("usa.1" is just ESPN's code for MLS). Free, no key needed.
- **openfootball data** — free public-domain match data
  (via raw.githubusercontent.com). Used to recount World Cup goals.
- **football-data.org free tier** — backup for European competitions only.
  Delayed scores, no MLS, no player stats — that is why it is only a backup.

Plus human cross-checks: intermiamicf.com, ESPN's Messi tracker, Wikipedia
season tables (which cite BDFutbol match logs).

**What `npm run verify` actually does:** it downloads the latest scores from
the free feeds above and saves a timestamped note
(`public/data/last-check.json`) saying "checked at this time, X new matches
seen". If a new Inter Miami or Argentina game finished, it flags it for a
human to review. It NEVER changes the goal totals — totals change by hand,
with a named source, after review. That is the whole "free live check".

## Deploy (Cloudflare, not deployed yet)

The site builds to `dist/` and deploys as Workers Static Assets
(`_headers` and `404.html` included); the smart-check cron runs from the
same worker (`worker/smart-check.js`, every 2h). No secrets involved:
every source is keyless. `wrangler.toml` ships with `REPLACE-WITH-D1-ID`
until the database is created. First `npm run build`, then these 3 commands:

```powershell
wrangler d1 create messi-stats-pending
wrangler d1 execute messi-stats-pending --file=worker/schema.sql
# paste the database_id from the create step into wrangler.toml, then:
wrangler deploy
```

## Deploy on Vercel (static, not deployed yet)

Same `dist/` build, no code changes. `vercel.json` pins the settings below,
so importing the repo works with defaults; nothing from `worker/` or
`wrangler.toml` is used (both are Cloudflare-only and excluded via
`.vercelignore`).

1. Vercel dashboard -> Add New -> Project -> Import this repo.
2. Framework preset: Vite (or Other — the explicit `buildCommand` /
   `outputDirectory` in `vercel.json` win either way).
3. Build command `npm run build`, output directory `dist`. No env vars needed.
4. Deploy, then check (replace `YOUR-APP` with the real host):
   `YOUR-APP.vercel.app/` (home), `/goalsbyyear`, `/goalsbyseason`,
   `/dashboard`, `/timeline`, `/achievements`, plus
   `/data/messi-data.json` (must stay 927 combined goals).

Notes: no functions/rewrites — every route is a real static `.html` file, so
`cleanUrls: true` + `trailingSlash: false` is the whole routing story (no SPA
fallback; unknown paths fall through to `404.html`, which Vercel serves
automatically). Cache headers live in `vercel.json` (`public/_headers` is
Cloudflare-only and ignored by Vercel): immutable for `/fonts/*`, `/img/*`,
`/assets/*` (hashed build output), no-cache for `/data/*.json`. `base: './'`
is kept on purpose — the production build rewrites bundles to `./assets/*`
and fonts to `../fonts/*`, so pages also work from any subpath or plain file
host. `src/ads.js` and `src/matchday.js` ship disabled-by-default (early
return unless their `window.*` switch is set), so the deployed site still
makes zero third-party requests.
## Smart scheduling (how it works)

One cron trigger, every 2h at minute 0 (`0 */2 * * *`, 12 runs/day). The
trigger itself never changes: escalation is WORKER-SIDE gating inside
`worker/smart-check.js`. Each run:

1. Cheap check: fetch ESPN usa.1 scoreboard + ESPN fifa.world scoreboard +
   openfootball worldcup.json (3 requests), read D1 `seen_matches` (1 query).
2. If no Inter Miami / Argentina match is dated today AND no unseen completed
   match exists -> exit. No summary fetches, almost no cost.
3. Else (matchday or backlog): fetch the ESPN summary for each newly completed
   tracked match (cap 5 per run), extract Messi goals/assists from `keyEvents`
   (participants[0] = scorer, participants[1] = assister), stage rows in D1
   `pending_checks` with source URLs + fetched timestamps. Verified totals in
   `messi-data.json` are never written by any automation.

Matchdays are detected from ESPN scoreboard dates (MLS + fifa.world) plus
openfootball fixture dates, so the 2h cadence only does real work when a
scheduled Inter Miami or Argentina match exists.

Fallback: `src/matchday.js` is a DISABLED-by-default client-side matchday
check (one direct ESPN fetch, banner clearly labeled PROVISIONAL). It exists
for cron outages or pre-deploy use. Default off = the site still makes zero
third-party requests. Tradeoff: enabling it costs one third-party request per
page view and surfaces unverified data, so keep it off unless you accept that.

## Free-tier limits (verified 2026-09-09, developers.cloudflare.com)

| Resource | Free limit | Our usage | Source |
| --- | --- | --- | --- |
| Workers requests | 100,000 / day | ~12 cron runs/day + status hits | workers/platform/limits |
| Cron triggers per account | 5 max | 1 used | workers/platform/limits |
| Cron min interval | none (1-min syntax allowed) | every 2h, worker-gated | workers/configuration/cron-triggers |
| Cron wall duration | 15 min per run | seconds (few fetches) | workers/platform/limits |
| Subrequests per run | 50 | max ~8 (3 boards + 5 summaries) | workers/platform/limits |
| D1 rows read | 5,000,000 / day | tens per run | workers/platform/pricing |
| D1 rows written | 100,000 / day | a few per matchday | workers/platform/pricing |
| D1 storage | 5 GB total | kilobytes | workers/platform/pricing |
| KV (not used, D1 preferred) | 100K reads / 1K writes / day | n/a | workers/platform/pricing |

D1 daily limits reset at 00:00 UTC and have been enforced with errors since
2026-09-01. Our usage is ~4 orders of magnitude below every cap, so the free
tier fits with large headroom. D1 was preferred over KV because staged rows
need querying by status (provisional vs needs_review) and KV free writes are
capped at 1,000/day.

## Auto-publish vs review rule

- `provisional`: ONLY when ESPN and openfootball BOTH cover the match AND
  agree on the final score AND scorer data names Messi explicitly. The row is
  published nowhere automatically; it is flagged provisional:true-equivalent
  in `pending.json` / D1 with sources attached, awaiting confirm.
- `needs_review`: everything else - source disagreement, missing scorer
  detail, summary fetch failure, or single-source matches. Changes nothing
  public.
- Honest consequence: openfootball football.json has NO MLS coverage (probed
  2026-09-09: `2026/mls.json`, `2026/usa.1.json`, `2026/us.json` all 404), so
  Inter Miami league matches ALWAYS land in needs_review with full ESPN
  provenance for one-click manual confirm. Argentina World Cup matches CAN
  reach provisional (worldcup.json carries `score.ft` + `goals1`/`goals2`
  with Messi named; verified on 2026-06-16 Argentina 3-0 Algeria, 3x Messi).

## Test locally

```powershell
cd "$env:USERPROFILE\Desktop\Projects\messi-stats"
npm run verify              # raw check (last-check.json) + smart dry-run
npm run verify:smart        # detection dry-run only (default, changes nothing)
npm run verify:smart:write  # persist staged rows to public/data/pending.json
npm run pending             # list staged rows with provenance
npm run triage              # grouped queue summary (needs_review by family)
npm run triage -- --prune   # collapse dupes + expire 90d+ rows + cap at 100
node scripts/confirm-provisional.mjs --confirm <match_id>  # clear one flag
npm run build               # prebuild gate (927x3 + caveat check) + vite bundle
npm run audit               # verify dist/ has every page, asset, skip link, print CSS
```

`--dry-run` is the default: without `--write`, no file is changed and the run
only prints what WOULD be staged. Exit 1 only when ALL sources fail or flags
are invalid; partial failure prints warnings and exits 0 so `npm run verify`
still reports the healthy sources.

Article change-notes upsert under one stable row per slug
(`watch:article:<slug>`, newest change wins), so live-updating pages like
ESPN's tracker story can't flood the queue; `needs_review` is capped at 100
rows with 90-day expiry (internal self-check rows exempt). Run `npm run triage`
when the queue looks noisy — it groups rows by family so one glance shows
whether anything is real.

`npm run build` runs `scripts/prebuild-check.mjs` first: it fails the build
if the three 927 sums (calendarYears / byCompetition / byBodyPart vs
totals.combined.goals) disagree or if the provisional-caveat wording ever
leaves `src/app.js`. Totals are still bumped by hand; the gate just makes a
bad edit unshippable.

## Confirming provisional updates

1. `npm run pending` (or GET `/smart-check-status` on the worker) to list rows.
2. Open every `sources[]` URL yourself; verify score + Messi goals/assists.
3. `node scripts/confirm-provisional.mjs --confirm <match_id>` clears the flag
   locally and prints the D1 equivalent
   (`UPDATE pending_checks SET status = 'confirmed' WHERE match_id = '...';`).
4. Fold numbers into `public/data/messi-data.json` BY HAND with a
   primary-source citation. Assists stay null until a full match-by-match
   tally exists. Confirming never edits totals automatically, by design.

## Worker deploy (later)

Same 3 commands as the Deploy section above (create D1, load
`worker/schema.sql`, paste the id into `wrangler.toml`, deploy). Nothing
extra lives here on purpose, so the steps can't drift out of sync.

## Ads (foundation only, no network yet)

`src/ads.js` injects at most 3 responsive slots (in-content on index,
in-content on dashboard, bottom slot on index) ONLY when the single master
switch `window.adsConfig.enabled` is true (default false, set it in one
place before the script tag). `public/ads.txt` is a placeholder authorizing
nobody until AdSense approval. Added weight: ads.js + matchday.js + CSS stay
under ~5KB total.

Guardrails (enforced in code + policy):
- Slots collapse to zero height when disabled/unfilled: no layout shift. Space
  (250px desktop / 100px mobile) is reserved ONLY while enabled and near the
  viewport (lazy IntersectionObserver).
- Max 3 slots per page, never inside tables, never above the hero on mobile.
- No interstitials, no auto-refresh, no layout-shifting formats. CLS budget:
  0 when disabled (byte-identical layout), near-0 when enabled.
- Activation checklist: 1) AdSense approval, 2) real publisher id in
  `public/ads.txt`, 3) add the AdSense script tag, 4) wire
  `window.adsReady.fill(slotId)` in the ad callbacks, 5) set
  `window.adsConfig.enabled = true`, 6) re-check CLS + ad density (max 30%
  of viewport, max 3 per page) on mobile and desktop before calling it done.

## Deliberately left out (and why)

- Auto-editing `messi-data.json`: refused by design; verified totals only
  change by hand with citations.
- A second free source for MLS scores/scores agreement: none exists
  (openfootball has no MLS; probing documented above), so MLS stays
  single-source needs_review rather than inventing agreement.
- KV binding: D1 fits better (status queries) and its free limits are larger
  for this workload.
- More than one cron trigger: unnecessary; worker-side gating gives the same
  matchday escalation inside a single trigger and preserves the 5-trigger cap.
- Client-side auto-refresh of stats: would break the zero-third-party runtime
  property; the matchday check is opt-in only.