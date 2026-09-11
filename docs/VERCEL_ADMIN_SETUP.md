# Vercel setup guide — admin analytics (messi-stats)

Static Vite site + one serverless route (`api/count.js`, Blob-backed counter).
Build settings live in `vercel.json` (`npm run build` → `dist`); they win over dashboard presets.

## 1. Import the repo

1. Vercel dashboard → **Add New → Project → Import** the repo.
2. Framework preset: **Vite**. (`vercel.json` already pins Build `npm run build`, Output `dist`.)
3. No env vars needed to deploy — add them after (steps 2–3).

## 2. Connect the Blob store

1. Project → **Storage** tab → **Connect** store `messistats-app-blob` (already exists, region CDG1, private).
2. `BLOB_READ_WRITE_TOKEN` is auto-provisioned on connect — never copy it into the repo.

## 3. Set the owner password

1. Project → **Settings → Environment Variables** → add `ANALYTICS_PASSWORD` = a strong random value, all environments.
2. **Redeploy** (env changes need a fresh deployment).

## 4. Verify the API

```bash
curl https://YOUR-APP.vercel.app/api/count?page=home
# → {"page":"home","views":N}

curl https://YOUR-APP.vercel.app/api/count?stats=1
# → 401 {"error":"owner only"}

curl -H "Authorization: Bearer <password>" https://YOUR-APP.vercel.app/api/count?stats=1
# → 200 {"pages":{…}}
```

## 5. Unlock /admin

Open `https://YOUR-APP.vercel.app/admin` (unlisted, `noindex` — bookmark it; no public link exists by design), enter the password → KPIs, chart, table. The key lives tab-scoped (`sessionStorage ms-analytics-key`) and dies with the tab; **Lock** ends the session.

## 6. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `503 {"error":"analytics not configured"}` on `?stats=1` | `ANALYTICS_PASSWORD` unset → step 3 + redeploy |
| `401 {"error":"owner only"}` | Wrong password / missing `Authorization: Bearer` header |
| Counter silent on localhost / `file://` | Expected — no `/api` route in static preview; frontend stays silent |
| Same-instant visits off by ±1 | By design (read-increment-write can overwrite; see caveat on the page) |
| Counts include owner visits + reloads | By design — read as mood, not census |

Statuses (`api/count.js`): `?stats=1` → 503 unready / 401 wrong / 200 rollup; `?page=<slug>` (whitelist: `home byyear byseason dashboard timeline achievements admin`) → 200 `{page,views}`, else 400. `cleanUrls` makes `/admin` work without `.html`.

## 7. Cost — free-tier headroom

Quoted from the README limits table (verified 2026-09-09); Blob counters are pennies-scale:

| Resource | Free limit | Our usage |
|---|---|---|
| Workers requests | 100,000 / day | ~12 cron runs/day + status hits |
| Cron triggers per account | 5 max | 1 used |
| Subrequests per run | 50 | max ~8 |
| D1 rows read / written | 5,000,000 / 100,000 / day | tens / a few per run |
| D1 storage | 5 GB | kilobytes |
| KV (n/a here) | 100K reads / 1K writes / day | n/a |

## 8. Demo preview (no backend needed)
Open `http://localhost:5173/admin.html?demo=1` (or `/admin?demo=1` deployed) to see the full dashboard with sample data. Labeled DEMO everywhere; never touches the real counter; `Exit demo` returns to the locked page.
