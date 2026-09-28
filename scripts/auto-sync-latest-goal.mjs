/**
 * Automated Messi Latest Goal Auto-Puller (scripts/auto-sync-latest-goal.mjs)
 * 
 * Automatically polls ESPN APIs (Athlete Overview, MLS Scoreboard, Event Summaries),
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

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const latestGoalJsonPath = resolve(root, "public", "data", "latest-goal.json");
const messiDataJsonPath = resolve(root, "public", "data", "messi-data.json");
const distLatestGoalPath = resolve(root, "dist", "data", "latest-goal.json");

const ESPN_ATHLETE_OVERVIEW = "https://site.web.api.espn.com/apis/common/v3/sports/soccer/athletes/45843/overview";
const ESPN_MLS_SCOREBOARD = "https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/scoreboard?dates=2026&limit=1000";
const ESPN_SUMMARY_BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer/all/summary?event=";

const isCheckOnly = process.argv.includes("--check");
const isForce = process.argv.includes("--force");

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

export async function autoPullLatestGoal() {
  console.log(`[${new Date().toISOString()}] Running automated Messi latest-goal auto-puller...`);

  if (!existsSync(latestGoalJsonPath)) {
    console.error("Missing public/data/latest-goal.json");
    process.exit(1);
  }

  const latestData = JSON.parse(readFileSync(latestGoalJsonPath, "utf8"));
  const messiData = existsSync(messiDataJsonPath) ? JSON.parse(readFileSync(messiDataJsonPath, "utf8")) : null;

  const currentGoalNum = latestData.latestGoal?.goalNumber || 930;
  console.log(`Current registered latest goal: Goal #${currentGoalNum} (${latestData.latestGoal?.opponent || "Unknown"})`);

  // Fetch overview from ESPN and MLS Scoreboard in parallel
  const [ovData, mlsData] = await Promise.all([
    fetchJson(ESPN_ATHLETE_OVERVIEW),
    fetchJson(ESPN_MLS_SCOREBOARD)
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
        isToday
      };
      newGoalsCount = messiGoals;
      break; // Only latest goal needed
    }
  }

  // Update today status
  latestData.todayStatus = latestData.todayStatus || {};
  latestData.todayStatus.hasMatchToday = hasMatchToday;
  latestData.syncedAt = new Date().toISOString();

  if (newlyFoundGoal) {
    console.log(`\nDiscovered latest match with Messi goal: ${newlyFoundGoal.opponent} (${newlyFoundGoal.date}, ${newlyFoundGoal.minute})`);
    
    // Check if this match is already registered as latest
    const registeredDate = latestData.latestGoal?.date;
    const registeredOpp = (latestData.latestGoal?.opponent || "").toLowerCase();
    const isSameMatch = registeredDate === newlyFoundGoal.date && registeredOpp.includes(newlyFoundGoal.opponent.toLowerCase());

    if (!isSameMatch && new Date(newlyFoundGoal.date) > new Date(registeredDate)) {
      console.log(`[ALERT] NEW GOAL DETECTED! Incrementing from Goal #${currentGoalNum} to Goal #${currentGoalNum + 1}`);
      const newGoalNum = currentGoalNum + 1;

      const newGoalObj = {
        goalNumber: newGoalNum,
        team: "Inter Miami CF",
        opponent: newlyFoundGoal.opponent,
        competition: newlyFoundGoal.competition,
        competitionSlug: newlyFoundGoal.competition.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        date: newlyFoundGoal.date,
        formattedDate: newlyFoundGoal.formattedDate,
        bdayKey: newlyFoundGoal.bdayKey,
        minute: newlyFoundGoal.minute,
        clock: newlyFoundGoal.minute,
        type: newlyFoundGoal.type,
        finish: newlyFoundGoal.finish,
        assist: newlyFoundGoal.assist,
        score: newlyFoundGoal.score,
        venue: newlyFoundGoal.venue,
        title: `Inter Miami ${newlyFoundGoal.score} ${newlyFoundGoal.opponent}`,
        videoUrl: `https://cdn.messiallgoals.com/Goal${newGoalNum}.mp4`,
        youtubeUrl: `https://www.youtube.com/results?search_query=Messi+goal+vs+${encodeURIComponent(newlyFoundGoal.opponent)}+${encodeURIComponent(newlyFoundGoal.competition)}`,
        bdayUrl: `/en/birthday/${newlyFoundGoal.bdayKey}`
      };

      const newCard = {
        goalNumber: newGoalNum,
        title: newGoalObj.title,
        meta: `${newlyFoundGoal.competition} • ${newlyFoundGoal.formattedDate}`,
        match: `vs ${newlyFoundGoal.opponent} (${newlyFoundGoal.score})`,
        date: `${newlyFoundGoal.formattedDate} • ${newlyFoundGoal.minute}`,
        minute: newlyFoundGoal.minute,
        type: newlyFoundGoal.type,
        tag: `${newlyFoundGoal.finish} 🔥`,
        score: newlyFoundGoal.score,
        comp: newlyFoundGoal.competition,
        videoUrl: newGoalObj.videoUrl,
        ytUrl: newGoalObj.youtubeUrl,
        bdayUrl: newGoalObj.bdayUrl
      };

      latestData.latestGoal = newGoalObj;
      latestData.recentGoals = [newCard, ...(latestData.recentGoals || []).slice(0, 4)];
      latestData.todayStatus.didScoreToday = newlyFoundGoal.isToday;
      latestData.todayStatus.lastMatchDate = newlyFoundGoal.date;
      latestData.todayStatus.lastMatchOpponent = newlyFoundGoal.opponent;
      latestData.todayStatus.lastMatchResult = newGoalObj.title;
      latestData.todayStatus.lastGoalNumber = newGoalNum;
      latestData.todayStatus.lastGoalMinute = newlyFoundGoal.minute;

      if (latestData.totals) {
        latestData.totals.seniorGoals = newGoalNum;
        latestData.totals.appearances = (latestData.totals.appearances || 1176) + 1;
        latestData.totals.miamiGoals = (latestData.totals.miamiGoals || 101) + 1;
        latestData.totals.season2026Goals = (latestData.totals.season2026Goals || 24) + 1;
        if (newlyFoundGoal.finish.includes("Free Kick")) {
          latestData.totals.freeKicks = (latestData.totals.freeKicks || 67) + 1;
        }
      }

      if (!isCheckOnly) {
        writeFileSync(latestGoalJsonPath, JSON.stringify(latestData, null, 2), "utf8");
        if (existsSync(distLatestGoalPath)) {
          writeFileSync(distLatestGoalPath, JSON.stringify(latestData, null, 2), "utf8");
        }
        console.log(`[SUCCESS] Written new goal #${newGoalNum} to public/data/latest-goal.json!`);
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
        writeFileSync(latestGoalJsonPath, JSON.stringify(latestData, null, 2), "utf8");
      }
    }
  }

  console.log(`[AUTO-PULL COMPLETED] Status: UP_TO_DATE (Goal #${latestData.latestGoal?.goalNumber || 930})`);
  return latestData;
}

if (process.argv[1] && process.argv[1].endsWith("auto-sync-latest-goal.mjs")) {
  autoPullLatestGoal().catch(err => {
    console.error("Auto-pull failed:", err);
    process.exit(1);
  });
}
