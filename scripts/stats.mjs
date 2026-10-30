#!/usr/bin/env node
/**
 * scripts/stats.mjs — THE variables file for messistat.com.
 *
 * Every number the site displays lives here as a named variable, read from
 * the JSON source files (the database) with all derived values computed —
 * never hand-typed. Update a JSON (or let the auto-syncs do it after a
 * match) and every consumer picks it up:
 *
 *   build time : generators (build-messi-vs-ronaldo, build-sitemap,
 *                sync-latest-goal-html, ...) + scripts/sync-totals-everywhere.mjs
 *                (last prebuild step — reconciles every tracked HTML page)
 *   runtime    : src/app.js LIVE object (populated from the same JSONs via
 *                fetch; same names, same derivation — see normalize())
 *
 * Two variable classes, by design:
 *   LIVE TOTALS (change often — goals, apps, G+A, gap/fewer/road, Miami
 *     tally, trophy counts): always read from S / LIVE, never literals.
 *   FROZEN HISTORY (past match facts — dates, minutes, opponents, video URLs,
 *     trophy ordinals of won events): literals filled from JSON card data by
 *     templates. A bare "932" in prose is a bug; "Goal #932 vs Benin" is history.
 *
 * Usage (build scripts):
 *   import { S } from "./stats.mjs";
 *   console.log(S.goals); // 934
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const readJson = (p, fallback = null) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
  } catch {
    return fallback;
  }
};

const messi = readJson("public/data/messi-data.json", {});
const latest = readJson("public/data/latest-goal.json", {});
const ronaldo = readJson("public/data/ronaldo.json", null);
const bday = readJson("public/data/birthday-goals.json", {});

// ---- base totals (Messi) ----------------------------------------------------
const goals = messi.totals?.combined?.goals ?? 934;
const apps = messi.totals?.combined?.appearances ?? 1179;
const clubGoals = messi.totals?.club?.goals ?? 808;
const clubApps = messi.totals?.club?.appearances ?? 971;
const argGoals = messi.totals?.country?.goals ?? 126;
const argCaps = messi.totals?.country?.appearances ?? 208;
const assists = messi.totals?.assists?.official ?? 407;
const tmAssists = messi.totals?.assists?.transfermarkt ?? 449;
const ga = messi.totals?.goalContributions?.official ?? 1341;
const tmGa = messi.totals?.goalContributions?.transfermarkt ?? 1383;
const gpg = messi.totals?.goalsPerGame ?? 0.79;
const gaPerGame = messi.totals?.goalContributions?.perGameOfficial ?? 1.14;
const assistsByTeam = messi.totals?.assists?.byTeam ?? {};
const miamiGoals = latest.totals?.miamiGoals ?? 104;
const miamiApps = assistsByTeam.inter_miami?.appearances ?? 118;
const season2026Goals = latest.totals?.season2026Goals ?? 28;

// ---- breakdowns -------------------------------------------------------------
const fin = {};
(messi.byFinish || []).forEach((r) => { fin[r.finish] = r.goals; });
const byFinish = { openPlay: fin["Open play"] ?? 748, penalties: fin["Penalties"] ?? 110, freeKicks: fin["Free kicks"] ?? 76 };
const bp = {};
(messi.byBodyPart || []).forEach((r) => { bp[r.part] = r.goals; });
const byBody = { left: bp["Left foot"] ?? 746, right: bp["Right foot"] ?? 150, head: bp["Head"] ?? 28, other: bp["Other (chest etc.)"] ?? 10 };
const hatTricks = messi.hatTricks ?? 62;
const cal2026 = (messi.calendarYears || []).find((r) => r.year === 2026) || { goals: 38, careerTotal: goals };
// Trophy count per team, derived from the itemized list (years.length) —
const trophiesByTeam = {};
(messi.trophies || []).forEach((x) => {
  if (x.team === "Individual") return;
  trophiesByTeam[x.team] = (trophiesByTeam[x.team] || 0) + (x.years?.length ?? 0);
});
const trophies = messi.splits?.trophies?.messi ?? 47;
const rTrophies = messi.splits?.trophies?.ronaldo ?? 37;
const wc = messi.splits?.worldCup || { messi: { goals: 21, assists: 12, games: 34 }, ronaldo: { goals: 11, assists: 2 } };
const finals = messi.splits?.finals || { messi: { goals: 36, apps: 52 }, ronaldo: { goals: 23, apps: 40 } };
const continental = messi.splits?.continental || { messi: 3, ronaldo: 3 };

// ---- Ronaldo baseline -------------------------------------------------------
const rGoals = ronaldo?.goals ?? 980;
const rApps = ronaldo?.appearances ?? 1339;
const rAssists = ronaldo?.assists ?? 261;
const rHatTricks = ronaldo?.hatTricks ?? 66;

// ---- latest goal ------------------------------------------------------------
const latestGoal = latest.latestGoal || {};
const recentGoals = latest.recentGoals || [];

// ---- derived (computed, never stored) ---------------------------------------
const gap = rGoals - goals;
const fewer = rApps - apps;
const road = 1000 - goals;
const rGpg = rApps ? +(rGoals / rApps).toFixed(2) : 0.73;
const rGa = rGoals + rAssists;
const astLead = assists - rAssists;
const htLead = rHatTricks - hatTricks;
// Non-penalty: site convention (open play + free kicks). NOTE: the pages'
// long-standing "822" was the 932-era value (932-110); both D.C. goals were
// open play, so current truth is 824. ronaldo.json penalties feed rNPG.
const penMessi = (messi.byFinish || []).find((f) => f.finish === "Penalties")?.goals ?? 110;
const penRon = ronaldo?.penalties ?? 184;
const npg = goals - penMessi;
const npgR = rGoals - penRon;
const npgLead = npg - npgR;

export const S = {
  goals, apps, clubGoals, clubApps, argGoals, argCaps,
  assists, tmAssists, ga, tmGa, gpg, gaPerGame, assistsByTeam,
  miamiGoals, miamiApps, season2026Goals,
  byFinish, byBody, hatTricks, cal2026, trophiesByTeam,
  trophies, rTrophies, wc, finals, continental,
  rGoals, rApps, rAssists, rHatTricks, gap, fewer, road, rGpg, rGa, astLead, htLead,
  npg, npgR, npgLead,
  latestGoal, recentGoals,
  bdayTotalGoals: bday.meta?.totalGoals ?? 934,
  byCompetition: messi.byCompetition || [],
};

export default S;
