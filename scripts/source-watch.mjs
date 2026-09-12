// Permanent scheduled source-watcher: auto-scrape our stat sources on every run.
//
// Compares free sources against public/data/messi-data.json and stages
// findings to public/data/pending.json (needs_review bucket) for human review.
// Article change-notes UPSERT under one stable row per slug
// (watch:article:<slug>); structured findings stage one row per new state.
// Queue is capped (100) with 90-day expiry so it can't grow without bound.
// NEVER writes messi-data.json totals — it stages for human review only.
// Exit 0 always (it is a watcher, not a gate).
//
// Usage:
//   node scripts/source-watch.mjs          quick mode (cheap exit when quiet)
//   node scripts/source-watch.mjs --full   fetch everything regardless of age
//   node scripts/source-watch.mjs --help
//
// Quick mode always runs the two light ESPN scoreboard fetches (matchday pulse
// + one-sided staleness gates) and skips the heavy fetches when there is no
// match today AND the last full run is fresh. --full forces everything.
// Plain Node, no dependencies (global fetch + node:crypto only).
//
// Row shape matches what scripts/confirm-provisional.mjs --list expects
// (match_id, match_date, home, away, messi_goals/messi_assists, note,
// sources[]). Watcher rows always use status "needs_review".
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const jsonPath = resolve(root, "public", "data", "messi-data.json");
const pendingPath = resolve(root, "public", "data", "pending.json");
const statePath = resolve(root, "public", "data", "source-watch.json");

// NOTE: keep the literal token "bot" OUT of this UA — ESPN's edge mitigation
// answers any UA containing it with 403 "Access Denied" (observed 2026-09-10;
// same request with a bot-free UA returns 200). Name still identifies the script.
const UA = "messi-stats-source-watch/0.1";
const HASH_TTL_MS = 24 * 3600 * 1000; // article hashes re-checked daily at most
const FULL_TTL_MS = 7 * 24 * 3600 * 1000; // heavy structured re-check weekly
const MAX_NEEDS_REVIEW = 100; // queue cap: oldest non-internal rows drop first
const RETENTION_MS = 90 * 24 * 3600 * 1000; // rows older than this expire (internal self-checks exempt)
const MESSI_RE = /messi/i;
const MIN_ARTICLE_CHARS = 800; // shorter readable bodies are bot-walls, not content

const ESPN_MLS = "https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/scoreboard?dates=2026&limit=1000";
const ESPN_WC = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=2026&limit=1000";
const OF_WC2022 = "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2022/worldcup.json";
const OF_WC2026 = "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";
const WIKI_API = "https://en.wikipedia.org/w/api.php?format=json&formatversion=2&action=parse&prop=wikitext&page=";
// TODO(KEY): football-data.org free tier needs an X-Auth-Token header, so it is
// recorded as skipped below. If a key is ever provisioned at deploy time, add a
// structured check here (v4/competitions/PL-style endpoints) following the
// one-sided-gate pattern used for the ESPN checks.
const FOOTBALL_DATA_SKIPPED = "requires X-Auth-Token key; no key provisioned";

// Pre-2022 World Cup baseline (2006: 1, 2010: 0, 2014: 4, 2018: 1). Fixed
// history; the live part comes from the two openfootball feeds below.
const WC_GOALS_PRE2022 = 6;

// Article watch-list: change-detection ONLY. These pages rot and their prose is
// copyrighted — never parse numbers from them, never copy text. A changed hash
// stages a "re-check by hand" note and nothing else.
// TODO(URL): two named sources still need hand-verified URLs before they can be
// watched: (1) the beIN Sports Mbappé-record story, (2) the PlanetFootball
// finals page. Web search returned no stable URL; add {slug,url,label} rows
// below once a human confirms the canonical links.
const ARTICLES = [
  { slug: "fox-wc21", label: "FOX Sports all-21 WC goals", url: "https://www.foxsports.com/stories/soccer/messi-2026-world-cup-goals-ranked" },
  { slug: "sportstar-400", label: "Sportstar 400 assists", url: "https://sportstar.thehindu.com/football/messi-reaches-400-assists-career-stats-record-inter-miami-barcelona-psg-argentina-breakdown-football-news/article70258674.ece" },
  { slug: "planet-elclasico", label: "PlanetFootball El Clasico", url: "https://www.planetfootball.com/la-liga/lionel-messi-cristiano-ronaldo-el-clasico-records-compared-real-madrid-barcelona-goals-assists" },
  { slug: "mvrapp-detailed", label: "messivsronaldo.app detailed stats", url: "https://www.messivsronaldo.app/detailed-stats/" },
  { slug: "mvrapp-elclasico", label: "messivsronaldo.app El Clasico", url: "https://www.messivsronaldo.app/club-stats/el-clasico/" },
  { slug: "messicom-46", label: "messi.com 46th trophy", url: "https://messi.com/en/leo-lifts-46th-career-trophy/" },
  { slug: "espn-tracker", label: "ESPN 2026 tracker story", url: "https://www.espn.com/soccer/story/_/id/47978642" },
  { slug: "gulfnews-400", label: "Gulf News 400 assists", url: "https://gulfnews.com/sport/football/messi-hits-400-assists-top-5-assist-makers-of-all-time-and-ronaldo-isnt-there-1.500342241" },
];

const args = new Set(process.argv.slice(2));
if (args.has("--help") || args.has("-h")) {
  console.log("source-watch: compare free stat sources vs messi-data.json, stage findings.");
  console.log("  (default)  quick mode: ESPN pulse + freshness-gated heavy fetches");
  console.log("  --full     fetch everything regardless of freshness");
  console.log("Stages to public/data/pending.json (needs_review). Never writes totals. Exit 0 always.");
  process.exit(0);
}
const forceFull = args.has("--full");
for (const a of args) {
  if (a !== "--full") { console.error("unknown flag: " + a + " (try --help)"); process.exit(1); }
}

const nowIso = () => new Date().toISOString();
const src = (url) => ({ url: url, at: nowIso() });

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// One retry after 2s: ESPN's edge mitigation flaps 403s that clear on
// immediate retry (observed 2026-09-10). Still fast, far fewer false alarms.
async function getJson(url, timeoutMs) {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), timeoutMs || 15000);
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA }, signal: ctl.signal });
      if (r.ok) return { ok: true, status: r.status, url: url, data: await r.json() };
      if (attempt === 2) return { ok: false, status: r.status, url: url };
    } catch (e) {
      if (attempt === 2) return { ok: false, error: String((e && e.message) || e), url: url };
    } finally {
      clearTimeout(t);
    }
    await sleep(2000);
  }
}

async function getText(url, timeoutMs) {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), timeoutMs || 15000);
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA }, signal: ctl.signal });
      if (r.ok) {
        const ct = r.headers.get("content-type") || "";
        if (!/html|text|json/i.test(ct)) {
          if (attempt === 2) return { ok: false, status: r.status, url: url, error: "non-text content-type: " + ct };
        } else return { ok: true, status: r.status, url: url, data: await r.text() };
      } else if (attempt === 2) return { ok: false, status: r.status, url: url };
    } catch (e) {
      if (attempt === 2) return { ok: false, error: String((e && e.message) || e), url: url };
    } finally {
      clearTimeout(t);
    }
    await sleep(2000);
  }
}

// Normalise page text for hashing: strip tags/scripts, collapse whitespace.
// Hashes detect CHANGE; the text itself is never stored or copied anywhere.
function normalise(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}
const sha1 = (s) => createHash("sha1").update(s, "utf8").digest("hex");

// Team-identity matching on ESPN competitor objects (same rule as
// scripts/smart-check.mjs: never whole-JSON substring, venue names lie).
function competitorTeams(e) {
  const c = (e && e.competitions && e.competitions[0]) || {};
  return ((c.competitors || []).map((x) => x && x.team).filter(Boolean));
}
const mentionsMiami = (e) => competitorTeams(e).some((t) => /miami/i.test(t.displayName || "") || /miami/i.test(t.shortDisplayName || "") || /miami/i.test(t.name || ""));
const mentionsArgentina = (e) => competitorTeams(e).some((t) => /argentina/i.test(t.displayName || "") || /argentina/i.test(t.shortDisplayName || "") || String(t.abbreviation || "").toUpperCase() === "ARG");
function isCompleted(e) {
  const t = e && e.status && e.status.type;
  return Boolean(t && (t.completed === true || t.state === "post"));
}
function messiGoalsInOfMatch(m) {
  const all = [].concat((m && m.goals1) || [], (m && m.goals2) || []);
  return all.filter((g) => g && g.name && MESSI_RE.test(g.name)).length;
}

const d = JSON.parse(readFileSync(jsonPath, "utf8"));
const comp = (name) => (d.byCompetition.find((r) => r.competition === name) || {}).goals;
const cy2026 = d.countryYears.find((r) => r.year === 2026) || {};
const mia2026 = d.clubSeasons.find((r) => r.club === "Inter Miami" && r.season === "2026") || {};

function loadState() {
  if (!existsSync(statePath)) return { updated: null, lastFull: null, hashes: {}, checks: [], skipped: [] };
  try {
    const s = JSON.parse(readFileSync(statePath, "utf8"));
    if (!s.hashes || typeof s.hashes !== "object") s.hashes = {};
    return s;
  } catch { return { updated: null, lastFull: null, hashes: {}, checks: [], skipped: [] }; }
}
function loadPending() {
  if (!existsSync(pendingPath)) return { updated: null, provisional: [], needs_review: [], confirmed: [] };
  try {
    const p = JSON.parse(readFileSync(pendingPath, "utf8"));
    for (const b of ["provisional", "needs_review", "confirmed"]) if (!Array.isArray(p[b])) p[b] = [];
    return p;
  } catch { return { updated: null, provisional: [], needs_review: [], confirmed: [] }; }
}

// Watcher row in the exact shape confirm-provisional.mjs --list prints.
// home = source label, away = our file, values live in note (both sides + URL).
function watchRow(matchId, label, note, urls) {
  return {
    match_id: matchId, competition: "source-watch", match_date: null,
    home: label, away: "messi-data.json",
    score_espn: null, score_openfootball: null, sources_agree: false,
    messi_goals: null, messi_assists: null, messi_named: false,
    status: "needs_review", sources: (urls || []).map(src),
    fetched_at: nowIso(), note: note,
  };
}

const state = loadState();
const store = loadPending();
const seen = new Set([].concat(store.provisional, store.needs_review, store.confirmed || []).map((r) => String(r.match_id)));
const staged = [];
const checks = [];
let touched = false; // set when an upsert rewrites a staged row in place
function stage(row) {
  if (seen.has(String(row.match_id))) { console.log("dedupe: already staged " + row.match_id); return; }
  seen.add(String(row.match_id));
  staged.push(row);
  console.log("STAGE [" + row.match_id + "] " + row.note);
}
function check(slug, kind, ok, detail) {
  checks.push({ slug: slug, kind: kind, ok: ok, at: nowIso(), detail: detail });
  console.log((ok ? "ok   " : "FAIL ") + kind + " " + slug + " — " + detail);
}
// Article rows upsert in place under a STABLE match_id (watch:article:<slug>).
// Live-updating pages (e.g. ESPN's 2026 tracker story) change hash on nearly
// every fetch; staging a new row per hash grew needs_review without bound
// (29 rows by 2026-09-12, 14 from one slug). Updating the single per-slug row
// keeps the signal (latest change + hash transition) without the spam.
function upsertArticle(a, h, prev) {
  const id = "watch:article:" + a.slug;
  const sameSlug = (r) => { const m = String((r && r.match_id) || ""); return m === id || m.startsWith(id + ":"); };
  const existing = store.needs_review.find(sameSlug) || staged.find(sameSlug);
  const note = "Page changed since last check (" + (prev ? prev.slice(0, 12) : "new") + " -> " + h.slice(0, 12) +
    ") — re-read by hand and re-verify any numbers we cite from it. Do NOT copy prose (facts/numbers only). " + a.url;
  if (existing) {
    existing.match_id = id; // collapse any legacy :hash suffix
    existing.note = note;
    existing.fetched_at = nowIso();
    existing.sources = [src(a.url)];
    touched = true;
    check("article:" + a.slug, "article", false, "CHANGED " + (prev ? prev.slice(0, 12) : "?") + " -> " + h.slice(0, 12) + " (row updated in place)");
  } else {
    check("article:" + a.slug, "article", false, "CHANGED " + (prev ? prev.slice(0, 12) : "?") + " -> " + h.slice(0, 12));
    stage(watchRow(id, a.label, note, [a.url]));
  }
}

// Read-only sanity: the three 927 sums (iron rule). Staging, never gating.
{
  const s1 = d.calendarYears.reduce((a, r) => a + r.goals, 0);
  const s2 = d.byCompetition.reduce((a, r) => a + r.goals, 0);
  const s3 = d.byBodyPart.reduce((a, r) => a + r.goals, 0);
  console.log("sums: calendarYears=" + s1 + " byCompetition=" + s2 + " byBodyPart=" + s3);
  if (s1 === 927 && s2 === 927 && s3 === 927) check("internal-927", "structured", true, "all three sums reconcile to 927");
  else {
    check("internal-927", "structured", false, "sums=" + s1 + "/" + s2 + "/" + s3);
    stage(watchRow("watch:internal:sums", "messi-data.json self-check",
      "Internal sums broke 927 (" + s1 + "/" + s2 + "/" + s3 + ") — hand-fix before anything else.", []));
  }
}

// Always-on light pulse: both ESPN scoreboards (matchday signal + staleness gates).
// Sequential, NOT parallel: ESPN's edge mitigation answers concurrent bursts
// from one IP with 403s (observed 2026-09-10; sequential with the same UA gets 200).
const mls = await getJson(ESPN_MLS);
const fwc = await getJson(ESPN_WC);
const today = nowIso().slice(0, 10);
const tracked = [].concat(mls.ok ? mls.data.events || [] : [], fwc.ok ? fwc.data.events || [] : [])
  .filter((e) => mentionsMiami(e) || mentionsArgentina(e));
const matchdayToday = tracked.some((e) => e.date && String(e.date).slice(0, 10) === today);
console.log("today=" + today + " matchdayToday=" + matchdayToday + " trackedEvents=" + tracked.length +
  " (espn-mls ok=" + mls.ok + " espn-fifa.world ok=" + fwc.ok + ")");
if (!mls.ok) { check("espn-mls", "structured", false, mls.status || mls.error); stage(watchRow("watch:fail:espn-mls", "ESPN usa.1 scoreboard", "Fetch failed (" + (mls.status || mls.error) + ") — source unreachable this run, hand-check if it persists. " + ESPN_MLS, [ESPN_MLS])); }
if (!fwc.ok) { check("espn-fifa", "structured", false, fwc.status || fwc.error); stage(watchRow("watch:fail:espn-fifa", "ESPN fifa.world scoreboard", "Fetch failed (" + (fwc.status || fwc.error) + ") — source unreachable this run, hand-check if it persists. " + ESPN_WC, [ESPN_WC])); }

// One-sided staleness gates: ESPN undercounts when truncated or cup-blind, so
// only ESPN-knows-MORE-than-JSON stages a row (JSON may be stale). Never the reverse.
if (mls.ok) {
  const n = (mls.data.events || []).filter((e) => mentionsMiami(e) && isCompleted(e)).length;
  const jsonLeagueApps = (mia2026.league || [])[0];
  if (n > jsonLeagueApps) {
    check("espn-mls-count", "structured", false, "espn=" + n + " json=" + jsonLeagueApps);
    stage(watchRow("watch:espn-mls-stale:espn" + n, "ESPN usa.1 scoreboard",
      "ESPN lists " + n + " completed 2026 Miami games vs JSON league apps " + jsonLeagueApps + " — data may be stale, hand-check. " + ESPN_MLS, [ESPN_MLS]));
  } else check("espn-mls-count", "structured", true, "espn completed=" + n + " <= json league apps=" + jsonLeagueApps);
}
if (fwc.ok) {
  const n = (fwc.data.events || []).filter((e) => mentionsArgentina(e) && isCompleted(e)).length;
  const jsonApps = cy2026.apps;
  if (typeof jsonApps === "number" && n > jsonApps) {
    check("espn-arg-count", "structured", false, "espn=" + n + " json=" + jsonApps);
    stage(watchRow("watch:espn-arg-stale:espn" + n, "ESPN fifa.world scoreboard",
      "ESPN lists " + n + " completed 2026 Argentina games vs JSON apps " + jsonApps + " — data may be stale, hand-check. " + ESPN_WC, [ESPN_WC]));
  } else check("espn-arg-count", "structured", true, "espn completed=" + n + " vs json apps=" + jsonApps);
}

// Freshness gating for the heavy fetches (cheap-exit pattern).
const lastFullAge = state.lastFull ? Date.now() - Date.parse(state.lastFull) : Infinity;
const runHeavy = forceFull || matchdayToday || !(lastFullAge < FULL_TTL_MS);
console.log("mode=" + (forceFull ? "full(flag)" : runHeavy ? "full(stale/matchday)" : "quick") +
  " lastFull=" + (state.lastFull || "never"));
let didFull = false;

if (runHeavy) {
  didFull = true;
  // --- openfootball: 2022 + 2026 World Cups (CC0, same feeds as verify.mjs) ---
  const [of22, of26] = await Promise.all([getJson(OF_WC2022), getJson(OF_WC2026)]);
  let g22 = null, g26 = null;
  if (of22.ok) {
    g22 = (of22.data.matches || []).reduce((a, m) => a + messiGoalsInOfMatch(m), 0);
    if (g22 === 7) check("of-wc2022", "structured", true, "Messi 2022 WC goals=7");
    else {
      check("of-wc2022", "structured", false, "Messi 2022 WC goals=" + g22 + " (expected 7)");
      stage(watchRow("watch:of-wc2022:src" + g22, "openfootball worldcup 2022",
        "openfootball counts " + g22 + " Messi goals at WC 2022 vs long-standing 7 (byCompetition WC total 21 assumes 7) — hand-check. " + OF_WC2022, [OF_WC2022]));
    }
  } else { check("of-wc2022", "structured", false, of22.status || of22.error); stage(watchRow("watch:fail:of-wc2022", "openfootball worldcup 2022", "Fetch failed (" + (of22.status || of22.error) + ") — hand-check if it persists. " + OF_WC2022, [OF_WC2022])); }
  if (of26.ok) {
    const ms = (of26.data.matches || []).filter((m) => m.team1 === "Argentina" || m.team2 === "Argentina");
    g26 = ms.reduce((a, m) => a + messiGoalsInOfMatch(m), 0);
    const jsonG = (cy2026.competitive || [])[1], jsonA = (cy2026.competitive || [])[0];
    if (g26 === 8 && ms.length === 8) check("of-wc2026", "structured", true, "8 Argentina games, Messi 8 goals (matches JSON 2026 note)");
    else {
      check("of-wc2026", "structured", false, "games=" + ms.length + " messiGoals=" + g26 + " vs json 8/8");
      stage(watchRow("watch:of-wc2026:src" + g26 + "g" + ms.length, "openfootball worldcup 2026",
        "openfootball shows " + ms.length + " Argentina games / " + g26 + " Messi goals vs JSON 2026 competitive " + jsonA + "/" + jsonG + " — hand-check. " + OF_WC2026, [OF_WC2026]));
    }
  } else { check("of-wc2026", "structured", false, of26.status || of26.error); stage(watchRow("watch:fail:of-wc2026", "openfootball worldcup 2026", "Fetch failed (" + (of26.status || of26.error) + ") — hand-check if it persists. " + OF_WC2026, [OF_WC2026])); }
  if (g22 !== null && g26 !== null) {
    const total = WC_GOALS_PRE2022 + g22 + g26, jsonWc = comp("FIFA World Cup");
    if (total === jsonWc) check("of-wc-alltime", "structured", true, "WC all-time " + total + " (6 pre-2022 + " + g22 + " + " + g26 + ")");
    else {
      check("of-wc-alltime", "structured", false, "src=" + total + " json=" + jsonWc);
      stage(watchRow("watch:of-wc-alltime:src" + total, "openfootball WC all-time",
        "WC all-time recomputed " + total + " (6 pre-2022 + " + g22 + " 2022 + " + g26 + " 2026) vs JSON " + jsonWc + " — hand-check. " + OF_WC2026, [OF_WC2022, OF_WC2026]));
    }
  }

  // --- Wikipedia Action API: achievements page (presence checks only — the page
  // uses a different trophy composition, so no numeric trophy compare) ---
  {
    const r = await getText(WIKI_API + encodeURIComponent("List of career achievements by Lionel Messi"));
    const url = WIKI_API + "List_of_career_achievements_by_Lionel_Messi";
    let wt = null;
    try { wt = r.ok ? JSON.parse(r.data).parse.wikitext : null; } catch { wt = null; }
    if (wt) {
      for (const needle of ["Supporters' Shield", "Leagues Cup", "MLS Cup", "Olympic"]) {
        if (wt.includes(needle)) check("wiki-ach:" + needle, "structured", true, "present");
        else {
          check("wiki-ach:" + needle, "structured", false, "missing");
          stage(watchRow("watch:wiki-ach-missing:" + sha1(needle).slice(0, 8), "Wikipedia achievements list",
            "“" + needle + "” no longer found on the achievements page — wording may have changed, re-check by hand. " + url, [url]));
        }
      }
    } else { check("wiki-achievements", "structured", false, r.status || r.error || "unparseable"); stage(watchRow("watch:fail:wiki-achievements", "Wikipedia achievements list", "Fetch/parse failed (" + (r.status || r.error || "unparseable") + ") — hand-check if it persists. " + url, [url])); }
  }

  // --- Wikipedia Messi infobox: LEAGUE goals only (infobox caps/goals are
  // league-only; national-team cells are links, not numbers, so they are
  // skipped, not guessed). Compares against our byCompetition league rows. ---
  {
    const r = await getText(WIKI_API + encodeURIComponent("Lionel Messi"));
    const url = WIKI_API + "Lionel_Messi";
    let wt = null;
    try { wt = r.ok ? JSON.parse(r.data).parse.wikitext : null; } catch { wt = null; }
    if (wt) {
      const clubs = {}, goals = {};
      for (const m of wt.matchAll(/\|\s*clubs(\d+)\s*=\s*\[\[([^\n\]]+)/g)) clubs[m[1]] = m[2];
      for (const m of wt.matchAll(/\|\s*goals(\d+)\s*=\s*(\d+)/g)) goals[m[1]] = +m[2];
      // Match on the canonical link target only (text before the first pipe):
      // "FC Barcelona Atlètic|Barcelona B" must NOT match a Barcelona check
      // via its display alias.
      const base = (s) => String(s || "").split("|")[0];
      const want = [
        { re: /Barcelona(?!\s*(C|Atl\w*))/, row: "La Liga", slug: "laliga" },
        { re: /Paris Saint-Germain/, row: "Ligue 1", slug: "ligue1" },
        { re: /Inter Miami/, row: "MLS (regular season)", slug: "mls" },
      ];
      let parsed = 0;
      for (const w of want) {
        const n = Object.keys(clubs).find((k) => w.re.test(base(clubs[k])) && typeof goals[k] === "number");
        if (!n) { check("wiki-info:" + w.slug, "structured", false, "unparseable, skipped (no garbage written)"); continue; }
        parsed += 1;
        const jsonG = comp(w.row);
        if (goals[n] === jsonG) check("wiki-info:" + w.slug, "structured", true, "league goals=" + goals[n]);
        else {
          check("wiki-info:" + w.slug, "structured", false, "src=" + goals[n] + " json=" + jsonG);
          stage(watchRow("watch:wiki-info:" + w.slug + ":src" + goals[n], "Wikipedia Messi infobox (" + w.row + ")",
            "Infobox league goals " + goals[n] + " vs JSON byCompetition “" + w.row + "” " + jsonG + " — hand-check (infobox may lag the season). " + url, [url]));
        }
      }
      if (!parsed) { check("wiki-infobox", "structured", false, "no club pairs parsed"); stage(watchRow("watch:fail:wiki-infobox", "Wikipedia Messi infobox", "No club goals pairs parsed from infobox wikitext — layout may have changed, hand-check. " + url, [url])); }
    } else { check("wiki-messi", "structured", false, r.status || r.error || "unparseable"); stage(watchRow("watch:fail:wiki-messi", "Wikipedia Messi page", "Fetch/parse failed (" + (r.status || r.error || "unparseable") + ") — hand-check if it persists. " + url, [url])); }
  }

  // --- Article hash-watch (change detection only; prose never parsed/copied) ---
  for (const a of ARTICLES) {
    const prev = state.hashes[a.slug];
    const fresh = prev && state["hashAt:" + a.slug] && (Date.now() - Date.parse(state["hashAt:" + a.slug]) < HASH_TTL_MS);
    if (!forceFull && fresh && !matchdayToday) { check("article:" + a.slug, "article", true, "hash fresh, skipped"); continue; }
    const r = await getText(a.url);
    const body = r.ok ? normalise(r.data) : "";
    if (!r.ok || body.length < MIN_ARTICLE_CHARS) {
      const why = r.ok ? "unreadable body (" + body.length + " chars, likely bot-wall)" : "fetch failed (" + (r.status || r.error) + ")";
      check("article:" + a.slug, "article", false, why + " — manual-only");
      stage(watchRow("watch:unreadable:" + a.slug, a.label, "Article unreadable by bot (" + why + ") — keep as hand-check-only source. " + a.url, [a.url]));
      continue;
    }
    const h = sha1(body);
    state.hashes[a.slug] = h;
    state["hashAt:" + a.slug] = nowIso();
    if (!prev) { check("article:" + a.slug, "article", true, "baselined " + h.slice(0, 12)); continue; }
    if (h === prev) check("article:" + a.slug, "article", true, "unchanged");
    else upsertArticle(a, h, prev);
  }
} else {
  console.log("cheap exit: no match today and last full run fresh — heavy fetches skipped, hashes kept.");
  for (const a of ARTICLES) check("article:" + a.slug, "article", true, "deferred (hash fresh)");
  check("of-wc2022", "structured", true, "deferred (full fresh)");
  check("of-wc2026", "structured", true, "deferred (full fresh)");
  check("wiki-achievements", "structured", true, "deferred (full fresh)");
  check("wiki-messi", "structured", true, "deferred (full fresh)");
}

// football-data.org: keyless tier unreachable by design (see TODO(KEY) above).
checks.push({ slug: "football-data.org", kind: "skip", ok: true, at: nowIso(), detail: FOOTBALL_DATA_SKIPPED });

// Persist staged rows (append to needs_review, dedupe identical match_ids),
// then enforce retention + cap so the queue can't grow without bound.
const isInternal = (r) => String((r && r.match_id) || "").startsWith("watch:internal:");
let expired = 0;
{
  const cutoff = Date.now() - RETENTION_MS;
  const before = store.needs_review.length;
  store.needs_review = store.needs_review.filter((r) => {
    if (isInternal(r)) return true;
    const t = Date.parse(r.fetched_at || "");
    return isNaN(t) || t >= cutoff;
  });
  expired = before - store.needs_review.length;
  if (expired) console.log("expired " + expired + " row(s) older than 90 days.");
}
if (staged.length) {
  for (const row of staged) store.needs_review.push(row);
  store.updated = nowIso();
  console.log("staged " + staged.length + " row(s) to pending.json (needs_review=" + store.needs_review.length + ")");
} else if (!expired && !touched) console.log("clean: nothing to stage.");
else store.updated = nowIso();
if (store.needs_review.length > MAX_NEEDS_REVIEW) {
  store.needs_review.sort((a, b) => String(a.fetched_at || "") < String(b.fetched_at || "") ? -1 : 1);
  const drop = [];
  while (store.needs_review.length > MAX_NEEDS_REVIEW) {
    const i = store.needs_review.findIndex((r) => !isInternal(r));
    if (i === -1) break; // only internal rows left: never drop those
    drop.push(store.needs_review.splice(i, 1)[0].match_id);
  }
  if (drop.length) { console.log("capped queue at " + MAX_NEEDS_REVIEW + ": dropped oldest " + drop.length + " (" + drop.join(", ") + ")."); store.updated = nowIso(); expired += drop.length; }
}
if (staged.length || expired || touched) {
  mkdirSync(dirname(pendingPath), { recursive: true });
  writeFileSync(pendingPath, JSON.stringify(store, null, 2));
  console.log("wrote pending.json (needs_review=" + store.needs_review.length + ").");
} else console.log("clean: nothing changed.");
console.log("messi-data.json untouched by design.");

// Persist watcher state (hashes + check log only).
{
  const next = { updated: nowIso(), generator: "scripts/source-watch.mjs; never messi-data.json", lastFull: didFull ? nowIso() : (state.lastFull || null), matchdayToday: matchdayToday, hashes: state.hashes, checks: checks, skipped: [{ source: "football-data.org", reason: FOOTBALL_DATA_SKIPPED }] };
  for (const k of Object.keys(state)) if (k.startsWith("hashAt:")) next[k] = state[k];
  mkdirSync(dirname(statePath), { recursive: true });
  writeFileSync(statePath, JSON.stringify(next, null, 2));
  console.log("wrote " + statePath);
}
process.exit(0); // watcher, not a gate — always green
