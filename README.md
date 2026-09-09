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
- Assists / free kicks / penalties stay null until a true match-by-match hand
  tally is compiled. Do not publish those fields before that.
- `npm run verify` only fetches FREE endpoints (ESPN hidden API scoreboard
  for MLS usa.1, openfootball raw JSON) and writes
  `public/data/last-check.json`. It never overwrites totals.

## Free sources used

- ESPN hidden API: https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/scoreboard (no key)
- openfootball football.json / worldcup.json via raw.githubusercontent.com (public domain CC0, no key)
- football-data.org free tier: backup for EU comps only (delayed, no MLS, no player data)
- Cross-checks: intermiamicf.com, ESPN Messi tracker, Wikipedia

## Deploy later (Cloudflare)

`npm run build` -> `dist/` -> `wrangler deploy` (Workers Static Assets; `_headers` and `404.html` included).
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
node scripts/confirm-provisional.mjs --confirm <match_id>  # clear one flag
npm run build               # must pass; vite bundles src/ads.js + matchday.js
```

`--dry-run` is the default: without `--write`, no file is changed and the run
only prints what WOULD be staged. Exit 1 only when ALL sources fail or flags
are invalid; partial failure prints warnings and exits 0 so `npm run verify`
still reports the healthy sources.

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

```powershell
wrangler d1 create messi-stats-pending
wrangler d1 execute messi-stats-pending --file=worker/schema.sql
# paste the database_id into wrangler.toml, then:
wrangler deploy
```

No secrets involved: every source is keyless. `wrangler.toml` ships with
`REPLACE-WITH-D1-ID` until the DB is created.

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