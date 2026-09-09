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