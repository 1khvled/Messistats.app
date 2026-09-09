// messi-stats smart-check worker (Cloudflare Workers, free tier, no deps).
// CRON: one trigger, every 2h at minute 0, see [triggers] in wrangler.toml.
// SMART SCHEDULING DESIGN (see README "Smart scheduling" for the full story):
// - ONE cron trigger every 2h = 12 runs/day. Free tier allows 1-minute cron
//   intervals; the binding limits are 100,000 requests/day and max 5 cron
//   triggers per account, so 12 gated runs/day is far inside budget.
// - The trigger does NOT escalate by itself (cron cannot do conditional
//   schedules). Escalation is WORKER-SIDE gating: every run first does the
//   cheap check (3 scoreboard fetches + 1 D1 read). If no Inter Miami or
//   Argentina match is scheduled today AND no unseen completed match exists,
//   the run exits without fetching any summary detail. Full detail fetches
//   (ESPN summary per unseen completed match, capped at 5 per run) happen
//   ONLY on or after matchdays. That is the "daily light, 2h on matchdays"
//   behavior inside a single free-tier-safe trigger.
// - Fallback: src/matchday.js is a disabled-by-default client-side matchday
//   check (clearly labeled provisional) for cron outages. Default off, so the
//   site still makes zero third-party requests.
// PIPELINE (never touches verified totals in messi-data.json):
// 1. Fetch ESPN usa.1 scoreboard (MLS) + ESPN fifa.world scoreboard + the
//    openfootball 2026 worldcup.json (all free, no keys).
// 2. Find newly COMPLETED Inter Miami / Argentina matches not in seen_matches.
// 3. For each (max 5 per run), fetch the ESPN summary and read keyEvents:
//    goal events carry participants[0] as scorer, participants[1] as assister.
//    Count events naming Messi as scorer or assister.
// 4. AUTO-PUBLISH RULE (honest, conservative):
//    status provisional ONLY when ESPN and openfootball BOTH cover the match
//    AND agree on the final score AND scorer data names Messi explicitly.
//    Everything else (disagreement, missing scorer detail, single-source
//    matches) is staged as needs_review and changes nothing public.
//    Documented consequence: openfootball football.json has NO MLS coverage
//    (probed 2026-09-09, MLS paths 404), so Inter Miami league matches ALWAYS
//    land in needs_review with full ESPN provenance for one-click manual
//    confirm. Argentina World Cup matches CAN reach provisional because
//    worldcup.json carries scores plus goals1 and goals2 scorer names.
// Local dry-run mirror: scripts/smart-check.mjs (same algorithm, file store).
const ESPN_MLS = "https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/scoreboard";
const ESPN_WC = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";
const WC_JSON = "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";
const SEASON_QS = "?dates=2026&limit=1000";
const MAX_SUMMARIES_PER_RUN = 5;
const MESSI_RE = /messi/i;
const VERIFIED_THROUGH = "2026-09-09"; // UTC date (inclusive). Only stage matches AFTER this day; everything earlier is already folded into messi-data.json. Bump when folding confirmed rows in.

function summaryUrl(league, eventId) {
  return "https://site.api.espn.com/apis/site/v2/sports/soccer/" + league + "/summary?event=" + eventId;
}
function src(url) {
  return { url: url, at: new Date().toISOString() };
}
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
function compOf(e) {
  return (e && e.competitions && e.competitions[0]) || {};
}
function teamsOf(e) {
  const c = compOf(e);
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
function sameUtcDay(a, b) {
  return String(a).slice(0, 10) === String(b).slice(0, 10);
}
// Count Messi goals and assists from an ESPN summary keyEvents array.
function messiFromKeyEvents(keyEvents) {
  let goals = 0;
  let assists = 0;
  let named = false;
  for (const k of keyEvents || []) {
    const typeText = (k && k.type && k.type.text) || "";
    const isGoal = k && (k.scoringPlay === true || /goal/i.test(typeText));
    if (!isGoal) continue;
    const ps = k.participants || [];
    const scorer = ps[0] && ps[0].athlete && ps[0].athlete.displayName;
    const assister = ps[1] && ps[1].athlete && ps[1].athlete.displayName;
    if (scorer && MESSI_RE.test(scorer)) { goals += 1; named = true; }
    if (assister && MESSI_RE.test(assister)) { assists += 1; named = true; }
    if (k.text && MESSI_RE.test(k.text)) named = true;
  }
  return { goals: goals, assists: assists, named: named };
}
// Count Messi goals in an openfootball worldcup.json match (goals1, goals2).
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
  const hit = (matches || []).find((m) => {
    const argSide = /argentina/i.test(home) || /argentina/i.test(away);
    if (argSide && !(/argentina/i.test(m.team1) || /argentina/i.test(m.team2))) return false;
    if (!argSide && [m.team1, m.team2].indexOf(home) === -1 && [m.team1, m.team2].indexOf(away) === -1) return false;
    return !day || withinOneDay(m.date, day);
  });
  return hit || null;
}
function espnScoreShort(t) {
  const m = /(\d+-\d+)/.exec(t.score || "");
  return m ? m[1] : t.score;
}
async function runCheck(env) {
  const out = { checkedAt: new Date().toISOString(), staged: [], skipped: [], errors: [] };
  const db = env && env.DB;
  if (!db) { out.errors.push("no D1 binding (env.DB missing)"); return out; }
  const results = await Promise.all([getJson(ESPN_MLS + SEASON_QS), getJson(ESPN_WC + SEASON_QS), getJson(WC_JSON)]);
  const mls = results[0];
  const wc = results[1];
  const of = results[2];
  if (!mls.ok) out.errors.push("espn mls fetch failed: " + (mls.status || mls.error));
  if (!wc.ok) out.errors.push("espn fifa.world fetch failed: " + (wc.status || wc.error));
  if (!of.ok) out.errors.push("openfootball fetch failed: " + (of.status || of.error));
  const events = []
    .concat((mls.ok ? mls.data.events || [] : []).map((e) => ({ e: e, league: "usa.1" })))
    .concat((wc.ok ? wc.data.events || [] : []).map((e) => ({ e: e, league: "fifa.world" })));
  const tracked = events.filter((x) => mentionsMiami(x.e) || mentionsArgentina(x.e));
  const today = new Date().toISOString();
  const matchdayToday = tracked.some((x) => x.e.date && sameUtcDay(x.e.date, today) && (isScheduled(x.e) || isCompleted(x.e)));
  out.matchdayToday = matchdayToday;
  let seenRows = [];
  try {
    const r = await db.prepare("SELECT match_id FROM seen_matches").all();
    seenRows = (r.results || []).map((row) => row.match_id);
  } catch (e) {
    out.errors.push("d1 read seen_matches failed: " + String((e && e.message) || e));
    return out;
  }
  const seen = new Set(seenRows);
  const fresh = tracked.filter((x) => isCompleted(x.e) && !seen.has(String(x.e.id)) && String(x.e.date || "").slice(0, 10) > VERIFIED_THROUGH);
  out.unseenCompleted = fresh.length;
  if (!matchdayToday && fresh.length === 0) {
    out.skipped.push("no match today and no unseen completed matches: cheap exit, no summary fetches");
    return out;
  }
  const wcMatches = of.ok ? of.data.matches || [] : [];
  let n = 0;
  for (const x of fresh) {
    if (n >= MAX_SUMMARIES_PER_RUN) { out.skipped.push("summary cap reached (5 per run)"); break; }
    n += 1;
    const e = x.e;
    const id = String(e.id);
    const t = teamsOf(e);
    const isArg = mentionsArgentina(e);
    const sum = await getJson(summaryUrl(x.league, id));
    const fetchedAt = new Date().toISOString();
    const prov = [src(ESPN_MLS + SEASON_QS), src(WC_JSON)];
    if (!sum.ok) {
      await db.prepare(
        "INSERT OR IGNORE INTO pending_checks (match_id, competition, match_date, home, away, status, sources, fetched_at, note) VALUES (?, ?, ?, ?, ?, 'needs_review', ?, ?, ?)"
      ).bind(id, x.league, e.date || null, t.home, t.away, JSON.stringify(prov), fetchedAt, "summary fetch failed (" + (sum.status || sum.error) + "): scorer detail missing").run();
      out.staged.push({ match_id: id, status: "needs_review", reason: "summary fetch failed" });
    } else {
      const mk = messiFromKeyEvents(sum.data.keyEvents);
      prov.push(src(summaryUrl(x.league, id)));
      let status = "needs_review";
      let agree = 0;
      let ofScore = null;
      let note = "single-source (ESPN only): openfootball has no MLS coverage, so auto-publish is impossible";
      if (isArg && of.ok) {
        const m = findWorldCupMatch(wcMatches, t.home, t.away, e.date);
        if (m) {
          ofScore = ftString(m);
          const om = messiFromWorldCupMatch(m);
          const espnScore = espnScoreShort(t);
          if (ofScore && espnScore === ofScore && mk.named && om.named && mk.goals === om.goals) {
            agree = 1;
            status = "provisional";
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
      await db.prepare(
        "INSERT OR IGNORE INTO pending_checks (match_id, competition, match_date, home, away, score_espn, score_openfootball, sources_agree, messi_goals, messi_assists, messi_named, status, sources, fetched_at, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      ).bind(id, x.league, e.date || null, t.home, t.away, t.score, ofScore, agree, mk.goals, mk.assists, mk.named ? 1 : 0, status, JSON.stringify(prov), fetchedAt, note).run();
      out.staged.push({ match_id: id, status: status, messi_goals: mk.goals, messi_assists: mk.assists });
    }
    await db.prepare(
      "INSERT OR IGNORE INTO seen_matches (match_id, competition, match_date, home, away, score, seen_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).bind(id, x.league, e.date || null, t.home, t.away, t.score, fetchedAt).run();
  }
  return out;
}
export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil((async () => {
      try { await runCheck(env); } catch (e) { console.error("smart-check failed: " + String((e && e.message) || e)); }
    })());
  },
  // Debug and status endpoint (read-only). Exposes no secrets; there are none.
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/smart-check-status") {
      try {
        const p = await env.DB.prepare("SELECT match_id, competition, match_date, home, away, status, messi_goals, messi_assists FROM pending_checks ORDER BY match_date DESC LIMIT 50").all();
        const s = await env.DB.prepare("SELECT COUNT(*) AS n FROM seen_matches").first();
        return Response.json({ ok: true, seen: s ? s.n : 0, pending: p.results || [] });
      } catch (e) {
        return Response.json({ ok: false, error: String((e && e.message) || e) }, { status: 500 });
      }
    }
    if (env && env.ASSETS) return env.ASSETS.fetch(request);
    return Response.json({ ok: true, usage: "cron worker: GET /smart-check-status for staged rows" });
  },
};