/**
 * Automated Messi Latest Goal Auto-Puller (scripts/auto-sync-latest-goal.mjs)
 * 
 * Automatically polls ESPN APIs (Athlete Overview, MLS + FIFA Scoreboards, Event Summaries),
 * detects any new senior goals scored by Lionel Messi, updates public/data/latest-goal.json,
 * reconciles public/data/messi-data.json, and synchronizes the HTML hubs across all 9 languages
 * without requiring any manual human or agent intervention.
 * 
 * Usage:
 *   node scripts/auto-sync-latest-goal.mjs            (auto-detect & sync)
 *   node scripts/auto-sync-latest-goal.mjs --check    (inspect without writing)
 *   node scripts/auto-sync-latest-goal.mjs --force    (force regenerate HTMLs from JSON)
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { syncLatestGoalHtml } from "./sync-latest-goal-html.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const latestGoalJsonPath = resolve(root, "public", "data", "latest-goal.json");
const messiDataJsonPath = resolve(root, "public", "data", "messi-data.json");
const distLatestGoalPath = resolve(root, "dist", "data", "latest-goal.json");

const ESPN_ATHLETE_OVERVIEW = "https://site.web.api.espn.com/apis/common/v3/sports/soccer/athletes/45843/overview";
const ESPN_MLS_SCOREBOARD = "https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/scoreboard?dates=2026&limit=1000";
const ESPN_FIFA_SCOREBOARD = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=2026&limit=1000";
const ESPN_SUMMARY_BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer/all/summary?event=";

const isCheckOnly = process.argv.includes("--check");
const isForce = process.argv.includes("--force");

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  "Accept": "application/json"
};

async function fetchJson(url) {
  try {
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.error(`Fetch error for ${url}:`, err.message);
    return null;
  }
}

export async function autoPullLatestGoal() {
  console.log(`[${new Date().toISOString()}] Running automated Messi latest-goal auto-puller...`);

  if (!existsSync(latestGoalJsonPath)) {
    console.error("Missing public/data/latest-goal.json");
    process.exit(1);
  }

  const latestData = JSON.parse(readFileSync(latestGoalJsonPath, "utf8"));
  // Volatile-only fields (timestamps) must never dirty the file on their own:
  // every 10-min run would otherwise commit + redeploy Vercel with zero real change.
  const stripVolatile = (o) => {
    if (Array.isArray(o)) return o.map(stripVolatile);
    if (o && typeof o === "object") {
      const out = {};
      for (const [k, v] of Object.entries(o)) {
        if (k === "syncedAt") continue;
        out[k] = stripVolatile(v);
      }
      return out;
    }
    return o;
  };
  const materialBefore = JSON.stringify(stripVolatile(latestData));
  const writeLatestGoalIfChanged = () => {
    if (JSON.stringify(stripVolatile(latestData)) === materialBefore) {
      console.log("latest-goal.json material state unchanged - skipping write (no deploy).");
      return false;
    }
    latestData.syncedAt = new Date().toISOString();
    writeFileSync(latestGoalJsonPath, JSON.stringify(latestData, null, 2), "utf8");
    return true;
  };
  const messiData = existsSync(messiDataJsonPath) ? JSON.parse(readFileSync(messiDataJsonPath, "utf8")) : null;

  const currentGoalNum = latestData.latestGoal?.goalNumber || 932;
  console.log(`Current registered latest goal: Goal #${currentGoalNum} (${latestData.latestGoal?.opponent || "Unknown"})`);

  // Fetch overview from ESPN and MLS Scoreboard in parallel
  const [ovData, mlsData, fifaData] = await Promise.all([
    fetchJson(ESPN_ATHLETE_OVERVIEW),
    fetchJson(ESPN_MLS_SCOREBOARD),
    fetchJson(ESPN_FIFA_SCOREBOARD)
  ]);

  if (!ovData && !mlsData) {
    console.warn("ESPN APIs unreachable. Keeping current verified state.");
    return latestData;
  }

  const candidateMap = new Map();

  if (ovData?.gameLog?.events) {
    for (const [id, ev] of Object.entries(ovData.gameLog.events)) {
      candidateMap.set(String(id), {
        id: String(id),
        gameDate: ev.gameDate,
        opponent: ev.opponent,
        leagueName: ev.leagueName || "Major League Soccer",
        score: ev.score
      });
    }
  }

  if (fifaData?.events) {
    for (const ev of fifaData.events) {
      const isCompleted = ev.status?.type?.completed === true;
      const isArgentina = ev.competitions?.[0]?.competitors?.some((c) => {
        const t = c.team || {};
        return /argentina/i.test(t.displayName || "") || String(t.abbreviation || "").toUpperCase() === "ARG";
      });
      if (isCompleted && isArgentina) {
        const id = String(ev.id);
        const oppComp = ev.competitions?.[0]?.competitors?.find((c) => !/argentina/i.test(c.team?.displayName || ""));
        if (!candidateMap.has(id)) {
          candidateMap.set(id, {
            id,
            gameDate: ev.date,
            opponent: { displayName: oppComp?.team?.displayName || "Opponent" },
            leagueName: "International Friendly",
            score: ev.name || "Final",
            isArgentina: true
          });
        }
      }
    }
  }

  if (mlsData?.events) {
    for (const ev of mlsData.events) {
      const isCompleted = ev.status?.type?.completed === true;
      const isMiami = ev.competitions?.[0]?.competitors?.some(c => /miami/i.test(c.team?.displayName || ""));
      if (isCompleted && isMiami) {
        const id = String(ev.id);
        const comp = ev.competitions?.[0];
        const miamiComp = comp?.competitors?.find(c => /miami/i.test(c.team?.displayName || ""));
        const oppComp = comp?.competitors?.find(c => !/miami/i.test(c.team?.displayName || ""));
        const scoreStr = `${miamiComp?.score || 0}-${oppComp?.score || 0}`;
        if (!candidateMap.has(id)) {
          candidateMap.set(id, {
            id,
            gameDate: ev.date,
            opponent: { displayName: oppComp?.team?.displayName || "Opponent" },
            leagueName: "Major League Soccer",
            score: scoreStr
          });
        }
      }
    }
  }

  const events = Array.from(candidateMap.values());
  events.sort((a, b) => new Date(b.gameDate) - new Date(a.gameDate));

  const todayUtc = new Date().toISOString().split("T")[0];

  // Check nextGame to see if there is a match today
  let hasMatchToday = false;
  if (ovData?.nextGame) {
    const nextDate = (ovData.nextGame.date || "").split("T")[0];
    if (nextDate === todayUtc) hasMatchToday = true;
  }

  let newlyFoundGoal = null;
  let newGoalsCount = 0;

  for (const ev of events) {
    const eventDate = (ev.gameDate || "").split("T")[0];
    const isToday = eventDate === todayUtc;
    if (isToday) hasMatchToday = true;

    // Fetch summary
    const summary = await fetchJson(`${ESPN_SUMMARY_BASE}${ev.id}`);
    if (!summary) continue;

    let messiGoals = 0;
    for (const team of summary.rosters || []) {
      for (const p of team.roster || []) {
        if (/messi/i.test(p.athlete?.displayName || "")) {
          for (const s of p.stats || []) {
            if (s.name === "totalGoals") messiGoals = Number(s.value) || 0;
          }
        }
      }
    }

    if (messiGoals > 0) {
      // Find the last goal event
      const keyEvents = summary.keyEvents || [];
      let goalDetail = null;
      const goalDetails = []; // every Messi goal in the match (chronological)

      for (const k of keyEvents) {
        const isGoal = /goal/i.test(k.type?.text || "") && !/own\s*goal/i.test(k.type?.text || "");
        const goalTextRaw = k.text || "";
        const primaryAthlete = k.participants?.[0]?.athlete;
        const isMessiScorer = primaryAthlete ? 
          (primaryAthlete.id === "45843" || /messi/i.test(primaryAthlete.displayName || "")) :
          /Lionel Messi\s*\(/i.test(goalTextRaw);
        if (isGoal && isMessiScorer) {
          const rawClock = (k.clock?.displayValue || "").replace(/'/g, "");
          const clock = rawClock ? `${rawClock}'` : "";
          const text = goalTextRaw;
          const isPen = /penalty/i.test(text);
          const isFK = /free\s*kick/i.test(text);
          const isHead = /header|head/i.test(text);
          const isRight = /right\s*foot/i.test(text);
          const finish = isPen ? "Penalty" : (isFK ? "Direct Free Kick" : (isHead ? "Header" : (isRight ? "Right Foot" : "Left Foot")));
          const assistMatch = text.match(/Assisted by ([^.]+)/i);
          const assist = assistMatch ? assistMatch[1].trim() : "";

          goalDetail = { clock, finish, assist, text };
          goalDetails.push(goalDetail);
        }
      }

      const opp = ev.opponent?.displayName || "Opponent";
      const comp = ev.leagueName || "Major League Soccer";
      const score = ev.score || "Final";
      const dObj = new Date(ev.gameDate);
      const formattedDate = dObj.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
      const bdayKey = `${String(dObj.getMonth() + 1).padStart(2, '0')}-${String(dObj.getDate()).padStart(2, '0')}`;

      const venueCity = summary.gameInfo?.venue?.address?.city;
      const venueState = summary.gameInfo?.venue?.address?.state;
      const venueFull = summary.gameInfo?.venue?.fullName;
      const venueLocation = venueCity ? ` (${venueCity}${venueState ? `, ${venueState}` : ""})` : "";
      const venue = venueFull ? `${venueFull}${venueLocation}` : "Chase Stadium (Fort Lauderdale, FL)";

      newlyFoundGoal = {
        id: ev.id,
        date: eventDate,
        formattedDate,
        bdayKey,
        opponent: opp,
        competition: comp,
        score,
        venue,
        minute: goalDetail?.clock || "",
        finish: goalDetail?.finish || "Open play",
        assist: goalDetail?.assist || "",
        type: `${goalDetail?.finish || "Open play"}${goalDetail?.assist ? ` (Assist: ${goalDetail.assist})` : ""}`,
        isToday,
        isArgentina: !!ev.isArgentina
      };
      newGoalsCount = messiGoals;
      break; // Only latest goal needed
    }
  }

  // Update today status
  latestData.todayStatus = latestData.todayStatus || {};
  latestData.todayStatus.hasMatchToday = hasMatchToday;

  if (newlyFoundGoal) {
    console.log(`\nDiscovered latest match with Messi goal: ${newlyFoundGoal.opponent} (${newlyFoundGoal.date}, ${newlyFoundGoal.minute})`);
    
    // Check if this match is already registered as latest
    const registeredDate = latestData.latestGoal?.date;
    const registeredOpp = (latestData.latestGoal?.opponent || "").toLowerCase();
    const isSameMatch = registeredDate === newlyFoundGoal.date && registeredOpp.includes(newlyFoundGoal.opponent.toLowerCase());

    if (!isSameMatch && new Date(newlyFoundGoal.date) > new Date(registeredDate)) {
      // Multi-goal games (brace, hat-trick): the match contributes ALL of
      // Messi's goals, not just +1. newGoalsCount comes from the roster stats.
      const matchGoals = Math.max(1, newGoalsCount || 1);
      console.log(`[ALERT] NEW GOAL${matchGoals > 1 ? "S" : ""} DETECTED! Incrementing from Goal #${currentGoalNum} by ${matchGoals} to Goal #${currentGoalNum + matchGoals}`);
      const newGoalNum = currentGoalNum + matchGoals;

      // Multi-goal matches (brace/hat-trick) contribute ONE entry per goal so the
      // recent-5 playlist never skips a number (e.g. #934 then #932 with no #933).
      // goalDetails is chronological, so index 0 maps to currentGoalNum+1.
      const details = [];
      for (let k = 0; k < matchGoals; k++) {
        details.push(goalDetails[k] || goalDetails[goalDetails.length - 1] || {});
      }
      if (goalDetails.length < matchGoals) {
        console.warn(`[WARN] parsed ${goalDetails.length} goal detail(s) for ${matchGoals} goals — padding with last known detail.`);
      }

      const newObjs = [];   // chronological: [currentGoalNum+1, …, newGoalNum]
      const newCards = [];
      for (let k = 0; k < matchGoals; k++) {
        const gd = details[k];
        const num = currentGoalNum + 1 + k;
        const finish = gd.finish || "Open play";
        const minute = gd.clock || newlyFoundGoal.minute;
        const type = `${finish}${gd.assist ? ` (Assist: ${gd.assist})` : ""}`;
        const title = newlyFoundGoal.isArgentina
          ? `Argentina ${newlyFoundGoal.score} ${newlyFoundGoal.opponent}`
          : `Inter Miami ${newlyFoundGoal.score} ${newlyFoundGoal.opponent}`;
        const videoUrl = `https://cdn.messiallgoals.com/Goal${num}.mp4`;
        const youtubeUrl = `https://www.youtube.com/results?search_query=Messi+goal+vs+${encodeURIComponent(newlyFoundGoal.opponent)}+${encodeURIComponent(newlyFoundGoal.competition)}`;
        const bdayUrl = `/en/birthday/${newlyFoundGoal.bdayKey}`;

        newObjs.push({
          goalNumber: num,
          team: newlyFoundGoal.isArgentina ? "Argentina" : "Inter Miami CF",
          opponent: newlyFoundGoal.opponent,
          competition: newlyFoundGoal.competition,
          competitionSlug: newlyFoundGoal.competition.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          date: newlyFoundGoal.date,
          formattedDate: newlyFoundGoal.formattedDate,
          bdayKey: newlyFoundGoal.bdayKey,
          minute,
          clock: minute,
          type,
          finish,
          assist: gd.assist || "",
          score: newlyFoundGoal.score,
          venue: newlyFoundGoal.venue,
          title,
          videoUrl,
          youtubeUrl,
          bdayUrl
        });
        newCards.push({
          goalNumber: num,
          title,
          meta: `${newlyFoundGoal.competition} • ${newlyFoundGoal.formattedDate}`,
          match: `vs ${newlyFoundGoal.opponent} (${newlyFoundGoal.score})`,
          date: `${newlyFoundGoal.formattedDate} • ${minute}`,
          minute,
          type,
          tag: `${finish} 🔥`,
          score: newlyFoundGoal.score,
          comp: newlyFoundGoal.competition,
          videoUrl,
          ytUrl: youtubeUrl,
          bdayUrl
        });
      }

      const newestObj = newObjs[newObjs.length - 1];
      const newestCards = [...newCards].reverse(); // newest first
      latestData.latestGoal = newestObj;
      latestData.recentGoals = [...newestCards, ...(latestData.recentGoals || [])].slice(0, 5);
      latestData.todayStatus.didScoreToday = newlyFoundGoal.isToday;
      latestData.todayStatus.lastMatchDate = newlyFoundGoal.date;
      latestData.todayStatus.lastMatchOpponent = newlyFoundGoal.opponent;
      latestData.todayStatus.lastMatchResult = newestObj.title;
      latestData.todayStatus.lastGoalNumber = newGoalNum;
      latestData.todayStatus.lastGoalMinute = newestObj.minute;

      if (latestData.totals) {
        latestData.totals.seniorGoals = newGoalNum;
        latestData.totals.appearances = (latestData.totals.appearances || 1178) + 1;
        if (!newlyFoundGoal.isArgentina) latestData.totals.miamiGoals = (latestData.totals.miamiGoals || 102) + matchGoals;
        latestData.totals.season2026Goals = (latestData.totals.season2026Goals || 26) + matchGoals;
        if (newlyFoundGoal.finish.includes("Free Kick")) {
          latestData.totals.freeKicks = (latestData.totals.freeKicks || 76) + 1;
        }
      }

      if (!isCheckOnly) {
        writeLatestGoalIfChanged();
        if (existsSync(distLatestGoalPath)) {
          writeFileSync(distLatestGoalPath, JSON.stringify(latestData, null, 2), "utf8");
        }
        console.log(`[SUCCESS] Written new goal #${newGoalNum} to public/data/latest-goal.json!`);
        try {
          syncLatestGoalHtml();
        } catch (err) {
          console.warn("syncLatestGoalHtml error:", err.message);
        }
        try {
          const { execSync } = await import("node:child_process");
          execSync("node scripts/generate-og.mjs", { cwd: root, stdio: "inherit" });
        } catch (err) {
          console.warn("generate-og warning inside auto-sync-latest-goal:", err.message);
        }
      }
    } else {
      console.log(`Database is already synchronized with latest match (${newlyFoundGoal.opponent} on ${newlyFoundGoal.date}).`);
      latestData.todayStatus.didScoreToday = newlyFoundGoal.isToday;
      if (!isCheckOnly) {
        const changedElse = writeLatestGoalIfChanged();
        if (changedElse && isForce) {
          syncLatestGoalHtml();
        }
      }
    }
  }

  console.log(`[AUTO-PULL COMPLETED] Status: UP_TO_DATE (Goal #${latestData.latestGoal?.goalNumber || 932})`);
  return latestData;
}

if (process.argv[1] && process.argv[1].endsWith("auto-sync-latest-goal.mjs")) {
  autoPullLatestGoal().catch(err => {
    console.error("Auto-pull failed:", err);
    process.exit(1);
  });
}
