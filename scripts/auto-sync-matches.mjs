/**
 * Auto-Sync Matches Pipeline (scripts/auto-sync-matches.mjs)
 * 
 * Automatically detects newly completed Inter Miami and Argentina matches across ALL
 * competitions (MLS, Campeones Cup, Concacaf Champions Cup, Leagues Cup, FIFA World Cup,
 * and Friendlies) via ESPN APIs, parses Lionel Messi's appearances, goals, and assists,
 * updates public/data/messi-data.json, reconciles all 4 checksums to the exact total,
 * and logs audit details to public/data/last-check.json.
 * 
 * Usage:
 *   node scripts/auto-sync-matches.mjs           (detect and sync)
 *   node scripts/auto-sync-matches.mjs --dry-run (inspect without saving)
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { autoPullLatestGoal } from "./auto-sync-latest-goal.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = resolve(root, "public", "data", "messi-data.json");
const lastCheckPath = resolve(root, "public", "data", "last-check.json");

const ESPN_ATHLETE_OVERVIEW = "https://site.web.api.espn.com/apis/common/v3/sports/soccer/athletes/45843/overview";
const ESPN_MLS_SCOREBOARD = "https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/scoreboard?dates=2026&limit=1000";
const ESPN_SUMMARY_BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer/all/summary?event=";

const isDryRun = process.argv.includes("--dry-run");

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  "Accept": "application/json"
};

async function fetchJson(url) {
  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.error(`Fetch error for ${url}:`, err.message);
    return null;
  }
}

function getScorerDetails(summary) {
  let messiApps = 0;
  let messiGoals = 0;
  let messiAssists = 0;
  let goalDetails = [];

  // Check rosters for Messi appearance and stats
  const rosters = summary.rosters || [];
  for (const team of rosters) {
    const roster = team.roster || [];
    for (const player of roster) {
      if (/messi/i.test(player.athlete?.displayName || "")) {
        const stats = player.stats || [];
        for (const s of stats) {
          if (s.name === "appearances" || s.name === "subIns") {
            if (Number(s.value) > 0) messiApps = 1;
          }
          if (s.name === "totalGoals") {
            messiGoals = Number(s.value) || 0;
          }
          if (s.name === "goalAssists") {
            messiAssists = Number(s.value) || 0;
          }
        }
      }
    }
  }

  // Parse keyEvents for goal mechanics (foot, open play, free kick, penalty)
  const keyEvents = summary.keyEvents || [];
  for (const ev of keyEvents) {
    const isGoalType = /goal/i.test(ev.type?.text || "") && !/own\s*goal/i.test(ev.type?.text || "");
    const primaryParticipant = ev.participants?.[0]?.athlete?.displayName || "";
    const isMessiScorer = /messi/i.test(primaryParticipant) || 
      /messi goal/i.test(ev.shortText || "") || 
      /\.\s*Lionel Messi\s*\(/i.test(ev.text || "");

    if (isGoalType && isMessiScorer) {
      const text = ev.text || "";
      const isPenalty = /penalty/i.test(text);
      const isFreeKick = /free\s*kick/i.test(text);
      const isHeader = /header|head/i.test(text);
      const isRightFoot = /right\s*footed/i.test(text);
      const isLeftFoot = /left\s*footed/i.test(text) || (!isRightFoot && !isHeader);

      goalDetails.push({
        text,
        clock: ev.clock?.displayValue || "",
        finish: isPenalty ? "Penalties" : (isFreeKick ? "Free kicks" : "Open play"),
        part: isHeader ? "Head" : (isRightFoot ? "Right foot" : "Left foot")
      });
    }
  }

  // Safety safeguard: only accept up to messiGoals details
  if (goalDetails.length > messiGoals) {
    goalDetails = goalDetails.slice(0, messiGoals);
  }

  return { messiApps, messiGoals, messiAssists, goalDetails };
}

export async function runAutoSync() {
  console.log(`[${new Date().toISOString()}] Starting Messi stats auto-sync pipeline...`);

  if (!existsSync(dataPath)) {
    console.error("messi-data.json not found at:", dataPath);
    process.exit(1);
  }

  const d = JSON.parse(readFileSync(dataPath, "utf8"));
  const initialGoals = d.totals.combined.goals;
  const initialApps = d.totals.combined.appearances;

  console.log(`Current Database: ${initialGoals} goals across ${initialApps} appearances.`);

  if (!d.meta.syncedMatches) {
    d.meta.syncedMatches = [];
  }

  // Fetch athlete overview (tracks all competitions) and MLS scoreboard
  const [athleteData, mlsData] = await Promise.all([
    fetchJson(ESPN_ATHLETE_OVERVIEW),
    fetchJson(ESPN_MLS_SCOREBOARD)
  ]);

  const candidateMatches = new Map();

  // 1. Ingest from Athlete gameLog
  if (athleteData?.gameLog?.events) {
    const glEvents = athleteData.gameLog.events;
    for (const [id, ev] of Object.entries(glEvents)) {
      candidateMatches.set(String(id), {
        id: String(id),
        date: ev.gameDate,
        name: `Inter Miami vs ${ev.opponent?.displayName || "Opponent"}`,
        leagueName: ev.leagueName || "Other",
        competitionSlug: ev.leagueAbbreviation || ""
      });
    }
  }

  // 2. Ingest from MLS Scoreboard
  const mlsEvents = mlsData?.events || [];
  for (const ev of mlsEvents) {
    const isCompleted = ev.status?.type?.completed === true;
    const isMiami = ev.competitions?.[0]?.competitors?.some(c => /miami/i.test(c.team?.displayName || ""));
    if (isCompleted && isMiami) {
      const matchId = String(ev.id);
      if (!candidateMatches.has(matchId)) {
        candidateMatches.set(matchId, {
          id: matchId,
          date: ev.date,
          name: ev.name,
          leagueName: "Major League Soccer",
          competitionSlug: "MLS"
        });
      }
    }
  }

  console.log(`Discovered ${candidateMatches.size} candidate fixtures across all competitions.`);

  let totalNewGoals = 0;
  let totalNewApps = 0;
  const processedMatches = [];

  // Evaluate candidate matches
  for (const [matchId, match] of candidateMatches.entries()) {
    const matchDate = match.date;
    const matchName = match.name;

    // Skip historical matches or already synced
    if (new Date(matchDate) < new Date("2026-09-10T00:00:00Z")) {
      continue;
    }
    if (d.meta.syncedMatches.includes(matchId)) {
      continue;
    }

    console.log(`\nEvaluating fixture: ${matchDate} — ${matchName} (League: ${match.leagueName}, ID: ${matchId})`);
    const summaryUrl = `${ESPN_SUMMARY_BASE}${matchId}`;
    const summary = await fetchJson(summaryUrl);
    if (!summary) continue;

    const { messiApps, messiGoals, messiAssists, goalDetails } = getScorerDetails(summary);
    console.log(`  Result: Messi featured: ${messiApps}, goals: ${messiGoals}, assists: ${messiAssists}`);

    if (messiApps > 0 || messiGoals > 0) {
      totalNewApps += messiApps;
      totalNewGoals += messiGoals;

      const miami2026 = d.clubSeasons.find(s => s.club === "Inter Miami" && s.season === "2026");
      const isMlsLeague = /major league soccer|mls/i.test(match.leagueName) || match.competitionSlug === "MLS";
      const isChampionsCup = /concacaf champions/i.test(match.leagueName);
      const isCupOrOther = /campeones|leagues|open cup|playoffs/i.test(match.leagueName);

      if (miami2026) {
        if (isMlsLeague) {
          miami2026.league[0] += messiApps;
          miami2026.league[1] += messiGoals;
        } else if (isChampionsCup) {
          miami2026.continental[0] += messiApps;
          miami2026.continental[1] += messiGoals;
        } else {
          miami2026.other[0] += messiApps;
          miami2026.other[1] += messiGoals;
        }
        miami2026.apps += messiApps;
        miami2026.goals += messiGoals;
      }

      // Update byCompetition
      if (isMlsLeague) {
        const mlsComp = d.byCompetition.find(c => /MLS\s*\(regular/i.test(c.competition));
        if (mlsComp) mlsComp.goals += messiGoals;
      } else if (isChampionsCup) {
        const cccComp = d.byCompetition.find(c => /Concacaf Champions/i.test(c.competition));
        if (cccComp) cccComp.goals += messiGoals;
      } else {
        const cupComp = d.byCompetition.find(c => /other cups|leagues cup/i.test(c.competition));
        if (cupComp) cupComp.goals += messiGoals;
      }

      // Update byBodyPart and byFinish
      for (const gd of goalDetails) {
        const bp = d.byBodyPart.find(b => b.part.toLowerCase() === gd.part.toLowerCase());
        if (bp) bp.goals += 1;
        const bf = d.byFinish.find(f => f.finish.toLowerCase() === gd.finish.toLowerCase());
        if (bf) bf.goals += 1;
        console.log(`  Goal logged: ${gd.finish} (${gd.part}) — "${gd.text}"`);
      }

      // Safeguard for goals without full keyEvents
      if (messiGoals > goalDetails.length) {
        const missing = messiGoals - goalDetails.length;
        const bp = d.byBodyPart.find(b => b.part === "Left foot");
        if (bp) bp.goals += missing;
        const bf = d.byFinish.find(f => f.finish === "Open play");
        if (bf) bf.goals += missing;
      }

      d.meta.syncedMatches.push(matchId);
      processedMatches.push({
        id: matchId,
        date: matchDate,
        name: matchName,
        league: match.leagueName,
        goals: messiGoals,
        apps: messiApps
      });
    } else {
      d.meta.syncedMatches.push(matchId);
      console.log(`  Messi did not feature in this match.`);
    }
  }

  if (totalNewGoals > 0 || totalNewApps > 0) {
    console.log(`\n========================================`);
    console.log(`SYNCHRONIZING: +${totalNewGoals} goals, +${totalNewApps} appearances!`);
    console.log(`========================================`);

    // Update Totals
    d.totals.club.goals += totalNewGoals;
    d.totals.club.appearances += totalNewApps;
    d.totals.club.goalsPerGame = Number((d.totals.club.goals / d.totals.club.appearances).toFixed(2));

    d.totals.combined.goals += totalNewGoals;
    d.totals.combined.appearances += totalNewApps;
    d.totals.goalsPerGame = Number((d.totals.combined.goals / d.totals.combined.appearances).toFixed(2));

    // Update 2026 Calendar Year
    const year2026 = d.calendarYears.find(y => y.year === 2026);
    if (year2026) {
      year2026.goals += totalNewGoals;
      year2026.careerTotal = d.totals.combined.goals;
    }

    // Verify Checksums across all 4 breakdowns
    const sum = (arr) => arr.reduce((acc, r) => acc + (r.goals || 0), 0);
    const sCal = sum(d.calendarYears);
    const sComp = sum(d.byCompetition);
    const sBody = sum(d.byBodyPart);
    const sFin = sum(d.byFinish);
    const finalTotal = d.totals.combined.goals;

    console.log(`Reconciliation checksums:`);
    console.log(`  calendarYears: ${sCal}`);
    console.log(`  byCompetition: ${sComp}`);
    console.log(`  byBodyPart:    ${sBody}`);
    console.log(`  byFinish:      ${sFin}`);
    console.log(`  totals.goals:  ${finalTotal}`);

    if (sCal !== finalTotal || sComp !== finalTotal || sBody !== finalTotal || sFin !== finalTotal) {
      throw new Error(`CHECKSUM FAILURE: sums do not reconcile to ${finalTotal}`);
    }

    d.meta.updated = new Date().toISOString().split("T")[0];
    d.meta.verification.push(`Auto-synced on ${d.meta.updated}: ${processedMatches.map(m => `${m.name} (+${m.goals}G)`).join(", ")}.`);

    if (!isDryRun) {
      writeFileSync(dataPath, JSON.stringify(d, null, 2), "utf8");
      console.log(`\nSUCCESS: messi-data.json updated to ${finalTotal} goals!`);
      syncIndexHtmlFiles(finalTotal, d.totals.combined.appearances);

      const lastCheck = {
        checkedAt: new Date().toISOString(),
        status: "AUTO_SYNCED",
        newGoals: totalNewGoals,
        newApps: totalNewApps,
        finalGoals: finalTotal,
        finalApps: d.totals.combined.appearances,
        matches: processedMatches
      };
      writeFileSync(lastCheckPath, JSON.stringify(lastCheck, null, 2), "utf8");
    } else {
      console.log(`\n[DRY RUN]: Re-run without --dry-run to save changes.`);
    }
  } else {
    console.log("\nNo new goals or appearances to sync. Database is up to date.");
    const lastCheck = {
      checkedAt: new Date().toISOString(),
      status: "UP_TO_DATE",
      currentGoals: initialGoals,
      currentApps: initialApps
    };
    if (!isDryRun) {
      writeFileSync(lastCheckPath, JSON.stringify(lastCheck, null, 2), "utf8");
    }
  }

  try {
    await autoPullLatestGoal();
  } catch (err) {
    console.warn("autoPullLatestGoal warning inside auto-sync-matches:", err.message);
  }

  return { newGoals: totalNewGoals, newApps: totalNewApps, finalGoals: d.totals.combined.goals };
}

function syncIndexHtmlFiles(newTotalGoals, newTotalApps) {
  const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  const bnGoals = String(newTotalGoals).split("").map((c) => bnDigits[c] || c).join("");
  const indexFiles = [
    resolve(root, "index.html"),
    resolve(root, "es", "index.html"),
    resolve(root, "pt", "index.html"),
    resolve(root, "fr", "index.html"),
    resolve(root, "ar", "index.html"),
    resolve(root, "bn", "index.html"),
    resolve(root, "hi", "index.html"),
    resolve(root, "ro", "index.html"),
    resolve(root, "uz", "index.html"),
  ];
  for (const f of indexFiles) {
    if (!existsSync(f)) continue;
    let html = readFileSync(f, "utf8");
    const gtCardRegex = /(<section[^>]*id="messi-total-goals"[^>]*>[\s\S]*?<\/section>)/;
    html = html.replace(gtCardRegex, (match) => {
      let updated = match.replace(/\b9\d{2}\b/g, String(newTotalGoals));
      if (f.includes("bn")) {
        updated = updated.replace(/৯\d{2}/g, bnGoals);
      }
      return updated;
    });
    writeFileSync(f, html, "utf8");
  }
}

if (process.argv[1] && process.argv[1].endsWith("auto-sync-matches.mjs")) {
  runAutoSync().catch(err => {
    console.error("Auto-sync failed:", err);
    process.exit(1);
  });
}
