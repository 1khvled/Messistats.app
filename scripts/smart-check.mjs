// Node mirror of worker/smart-check.js (same detection algorithm, file store).
// Lets the whole pipeline dry-run on localhost with zero Cloudflare bindings.
// Usage:
//   node scripts/smart-check.mjs --dry-run   (default: print what WOULD be staged)
//   node scripts/smart-check.mjs --write      (persist to public/data/pending.json)
//   node scripts/smart-check.mjs --help
// Dependency-free: Node 24 global fetch only. Never touches messi-data.json.
// Exit codes: 0 ok (partial source failure still 0, with warnings), 1 when ALL
// sources fail or args are invalid.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pendingPath = resolve(root, "public", "data", "pending.json");

const ESPN_MLS = "https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/scoreboard";
const ESPN_WC = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";
const WC_JSON = "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";
const SEASON_QS = "?dates=2026&limit=1000";
const MAX_SUMMARIES_PER_RUN = 5;
const MESSI_RE = /messi/i;
const VERIFIED_THROUGH = "2026-09-09"; // UTC date (inclusive). Only stage matches AFTER this day; everything earlier is already folded into messi-data.json. Bump when folding confirmed rows in.

const args = new Set(process.argv.slice(2));
if (args.has("--help") || args.has("-h")) {
  console.log("smart-check: detect newly completed Inter Miami / Argentina matches.");
  console.log("  --dry-run   print what WOULD be staged (default)");
  console.log("  --write     persist staged rows to public/data/pending.json");
  console.log("Rules: provisional only when ESPN + openfootball agree on score AND");
  console.log("scorer data names Messi; else needs_review. MLS is always needs_review");
  console.log("(openfootball has no MLS coverage). Never touches messi-data.json.");
  process.exit(0);
}
if (args.has("--bogus")) { console.error("unknown flag"); process.exit(1); }
const doWrite = args.has("--write");
for (const a of args) {
  if (a !== "--dry-run" && a !== "--write") { console.error("unknown flag: " + a + " (try --help)"); process.exit(1); }
}

function src(url) { return { url: url, at: new Date().toISOString() }; }
async function getJson(url, timeoutMs) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs || 15000);
  try {
    const r = await fetch(url, { headers: { "User-Agent": "messi-stats-smart-check/0.1" }, signal: ctl.signal });
    if (!r.ok) return { ok: false, status: r.status, url: url };
    return { ok: true, status: r.status, url: url, data: await r.json() };
  } catch (e) {
    return { ok: false, error: String((e && e.message) || e), url: url };
  } finally {
    clearTimeout(t);
  }
}
function teamsOf(e) {
  const c = (e && e.competitions && e.competitions[0]) || {};
  const parts = c.competitors || [];
  const home = parts.find((x) => x.homeAway === "home");
  const away = parts.find((x) => x.homeAway === "away");
  const nm = (x) => (x && x.team && (x.team.displayName || x.team.name)) || "?";
  const sc = (x) => (x && x.score != null ? String(x.score) : "?");
  return { home: nm(home), away: nm(away), score: nm(home) + " " + sc(home) + "-" + sc(away) + " " + nm(away) };
}
function isCompleted(e) {
  const t = e && e.status && e.status.type;
  return Boolean(t && (t.completed === true || t.state === "post"));
}
function isScheduled(e) {
  const t = e && e.status && e.status.type;
  return Boolean(t && t.state === "pre");
}
function competitorTeams(e) {
  const c = (e && e.competitions && e.competitions[0]) || {};
  return ((c.competitors || []).map((x) => x && x.team).filter(Boolean));
}
// Team-identity matching ONLY (never whole-JSON substring: venue cities like
// "Miami Gardens" and recap text caused false positives on every WC game
// played in Miami).
function mentionsMiami(e) {
  return competitorTeams(e).some((t) => /miami/i.test(t.displayName || "") || /miami/i.test(t.shortDisplayName || "") || /miami/i.test(t.name || ""));
}
function mentionsArgentina(e) {
  return competitorTeams(e).some((t) => /argentina/i.test(t.displayName || "") || /argentina/i.test(t.shortDisplayName || "") || String(t.abbreviation || "").toUpperCase() === "ARG");
}
function sameUtcDay(a, b) { return String(a).slice(0, 10) === String(b).slice(0, 10); }
function summaryUrl(league, id) {
  return "https://site.api.espn.com/apis/site/v2/sports/soccer/" + league + "/summary?event=" + id;
}
function messiFromKeyEvents(keyEvents) {
  let goals = 0; let assists = 0; let named = false;
  for (const k of keyEvents || []) {
    const typeText = (k && k.type && k.type.text) || "";
    if (!(k && (k.scoringPlay === true || /goal/i.test(typeText)))) continue;
    const ps = k.participants || [];
    const scorer = ps[0] && ps[0].athlete && ps[0].athlete.displayName;
    const assister = ps[1] && ps[1].athlete && ps[1].athlete.displayName;
    if (scorer && MESSI_RE.test(scorer)) { goals += 1; named = true; }
    if (assister && MESSI_RE.test(assister)) { assists += 1; named = true; }
    if (k.text && MESSI_RE.test(k.text)) named = true;
  }
  return { goals: goals, assists: assists, named: named };
}
function messiFromWorldCupMatch(m) {
  if (!m) return { goals: 0, named: false };
  const all = [].concat(m.goals1 || [], m.goals2 || []);
  const n = all.filter((g) => g && g.name && MESSI_RE.test(g.name)).length;
  return { goals: n, named: n > 0 };
}
function ftString(m) {
  if (!m || !m.score || !m.score.ft) return null;
  return String(m.score.ft[0]) + "-" + String(m.score.ft[1]);
}
function withinOneDay(a, b) { const pa = Date.parse(String(a || "").slice(0, 10)); const pb = Date.parse(String(b || "").slice(0, 10)); if (isNaN(pa) || isNaN(pb)) return true; return Math.abs(pa - pb) <= 86400000; }
function findWorldCupMatch(matches, home, away, dateIso) {
  const day = String(dateIso || "").slice(0, 10);
  return (matches || []).find((m) => {
    const argSide = /argentina/i.test(home) || /argentina/i.test(away);
    if (argSide && !(/argentina/i.test(m.team1) || /argentina/i.test(m.team2))) return false;
    if (!argSide && [m.team1, m.team2].indexOf(home) === -1 && [m.team1, m.team2].indexOf(away) === -1) return false;
    return !day || withinOneDay(m.date, day);
  }) || null;
}
function loadPending() {
  if (!existsSync(pendingPath)) return { updated: null, provisional: [], needs_review: [] };
  try {
    const p = JSON.parse(readFileSync(pendingPath, "utf8"));
    if (!Array.isArray(p.provisional)) p.provisional = [];
    if (!Array.isArray(p.needs_review)) p.needs_review = [];
    return p;
  } catch { return { updated: null, provisional: [], needs_review: [] }; }
}

const [mls, wc, of] = await Promise.all([getJson(ESPN_MLS + SEASON_QS), getJson(ESPN_WC + SEASON_QS), getJson(WC_JSON)]);
console.log("sources: espn-mls ok=" + mls.ok + " espn-fifa.world ok=" + wc.ok + " openfootball-wc ok=" + of.ok);
if (!mls.ok && !wc.ok && !of.ok) { console.error("ALL sources failed; nothing to do."); process.exit(1); }
if (!mls.ok) console.log("warn: " + (mls.status || mls.error) + " " + ESPN_MLS);
if (!wc.ok) console.log("warn: " + (wc.status || wc.error) + " " + ESPN_WC);
if (!of.ok) console.log("warn: " + (of.status || of.error) + " " + WC_JSON);

const events = []
  .concat((mls.ok ? mls.data.events || [] : []).map((e) => ({ e: e, league: "usa.1" })))
  .concat((wc.ok ? wc.data.events || [] : []).map((e) => ({ e: e, league: "fifa.world" })));
const tracked = events.filter((x) => mentionsMiami(x.e) || mentionsArgentina(x.e));
const today = new Date().toISOString().slice(0, 10);
const matchdayToday = tracked.some((x) => x.e.date && String(x.e.date).slice(0, 10) === today && (isScheduled(x.e) || isCompleted(x.e)));
console.log("today=" + today + " matchdayToday=" + matchdayToday + " trackedEvents=" + tracked.length);

const store = loadPending();
const seen = new Set([].concat(store.provisional, store.needs_review, store.confirmed || []).map((r) => String(r.match_id)));
const fresh = tracked.filter((x) => isCompleted(x.e) && !seen.has(String(x.e.id)) && String(x.e.date || "").slice(0, 10) > VERIFIED_THROUGH);
console.log("unseenCompleted=" + fresh.length);
if (!matchdayToday && fresh.length === 0) {
  console.log("cheap exit: no match today and nothing new completed. No summary fetches, no writes.");
  process.exit(0);
}
const wcMatches = of.ok ? of.data.matches || [] : [];
const plan = [];
let n = 0;
for (const x of fresh) {
  if (n >= MAX_SUMMARIES_PER_RUN) { console.log("summary cap reached (5 per run); rest deferred to next run."); break; }
  n += 1;
  const e = x.e;
  const id = String(e.id);
  const t = teamsOf(e);
  const isArg = mentionsArgentina(e);
  console.log("fetch summary " + x.league + "/" + id + " " + t.home + " vs " + t.away);
  const sum = await getJson(summaryUrl(x.league, id));
  const fetchedAt = new Date().toISOString();
  const prov = [src(ESPN_MLS + SEASON_QS), src(WC_JSON)];
  if (!sum.ok) {
    plan.push({ match_id: id, competition: x.league, match_date: e.date || null, home: t.home, away: t.away, score_espn: t.score, score_openfootball: null, sources_agree: false, messi_goals: null, messi_assists: null, messi_named: false, status: "needs_review", sources: prov, fetched_at: fetchedAt, note: "summary fetch failed (" + (sum.status || sum.error) + "): scorer detail missing" });
    continue;
  }
  const mk = messiFromKeyEvents(sum.data.keyEvents);
  prov.push(src(summaryUrl(x.league, id)));
  let status = "needs_review"; let agree = false; let ofScore = null;
  let note = "single-source (ESPN only): openfootball has no MLS coverage, so auto-publish is impossible";
  if (isArg && of.ok) {
    const m = findWorldCupMatch(wcMatches, t.home, t.away, e.date);
    if (m) {
      ofScore = ftString(m);
      const om = messiFromWorldCupMatch(m);
      const mm = /(\d+-\d+)/.exec(t.score || "");
      const espnScore = mm ? mm[1] : t.score;
      if (ofScore && espnScore === ofScore && mk.named && om.named && mk.goals === om.goals) {
        agree = true; status = "provisional";
        note = "ESPN + openfootball agree on score (" + ofScore + ") and Messi goals (" + mk.goals + ")";
      } else {
        note = "Argentina match but sources differ (espn=" + espnScore + " wc=" + ofScore + " espnMessi=" + mk.goals + " wcMessi=" + om.goals + ")";
      }
    } else {
      note = "Argentina match not found in worldcup.json (friendly or qualifier?): single-source, needs review";
    }
  } else if (mk.named) {
    note = "ESPN names Messi (" + mk.goals + "G/" + mk.assists + "A) but no second free source covers MLS: needs review";
  }
  plan.push({ match_id: id, competition: x.league, match_date: e.date || null, home: t.home, away: t.away, score_espn: t.score, score_openfootball: ofScore, sources_agree: agree, messi_goals: mk.goals, messi_assists: mk.assists, messi_named: mk.named, status: status, sources: prov, fetched_at: fetchedAt, note: note });
}
if (plan.length === 0) { console.log("nothing to stage."); process.exit(0); }
for (const r of plan) {
  console.log("WOULD stage [" + r.status + "] " + r.match_date + " " + r.home + " vs " + r.away + " (" + r.score_espn + ") messi=" + r.messi_goals + "G/" + r.messi_assists + "A | " + r.note);
}
if (!doWrite) { console.log("dry-run: no files changed. Re-run with --write to persist."); process.exit(0); }
for (const r of plan) {
  (r.status === "provisional" ? store.provisional : store.needs_review).push(r);
}
store.updated = new Date().toISOString();
mkdirSync(dirname(pendingPath), { recursive: true });
writeFileSync(pendingPath, JSON.stringify(store, null, 2));
console.log("wrote " + pendingPath + " (provisional=" + store.provisional.length + " needs_review=" + store.needs_review.length + ")");
console.log("messi-data.json untouched by design.");