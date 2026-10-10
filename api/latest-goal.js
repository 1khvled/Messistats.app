/**
 * GET /api/latest-goal
 * 
 * Auto-pulls Lionel Messi's latest career goal, match details, video stream URL,
 * and live "Did Messi score today?" status directly from ESPN & local verified feeds.
 * 
 * Includes CDN caching (s-maxage=60) with instant stale-while-revalidate fallback.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ESPN_ATHLETE_OVERVIEW = "https://site.web.api.espn.com/apis/common/v3/sports/soccer/athletes/45843/overview";
const ESPN_MLS_SCOREBOARD = "https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/scoreboard?dates=2026&limit=1000";
const ESPN_SUMMARY_BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer/all/summary?event=";

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  "Accept": "application/json"
};

function getLocalFallback() {
  try {
    const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
    const jsonPath = resolve(root, "public", "data", "latest-goal.json");
    return JSON.parse(readFileSync(jsonPath, "utf8"));
  } catch (e) {
    return {
      syncedAt: new Date().toISOString(),
      latestGoal: {
        goalNumber: 932,
        team: "Argentina",
        opponent: "Benin",
        competition: "International Friendly",
        competitionSlug: "friendly",
        date: "2026-10-06",
        formattedDate: "6 October 2026",
        bdayKey: "10-06",
        minute: "71'",
        clock: "71'",
        type: "Penalty",
        finish: "Penalty",
        assist: "",
        score: "3-0",
        venue: "Estadio Más Monumental (Buenos Aires)",
        title: "Argentina 3-0 Benin",
        videoUrl: "https://cdn.messiallgoals.com/Goal932.mp4",
        youtubeUrl: "https://www.youtube.com/results?search_query=Messi+goal+vs+Benin+Argentina+2026",
        bdayUrl: "/en/birthday/10-06"
      },
      todayStatus: {
        didScoreToday: false,
        hasMatchToday: false,
        lastMatchDate: "2026-10-06",
        lastMatchOpponent: "Benin",
        lastMatchResult: "Argentina 3-0 Benin",
        lastGoalNumber: 932,
        lastGoalMinute: "71'"
      },
      recentGoals: [
        { goalNumber: 932, match: "vs Benin (3-0)", date: "6 October 2026 • 71'", type: "Penalty", videoUrl: "https://cdn.messiallgoals.com/Goal932.mp4" },
        { goalNumber: 931, match: "at Columbus Crew (1-2)", date: "27 September 2026 • 33'", type: "Direct Free Kick", videoUrl: "https://cdn.messiallgoals.com/Goal931.mp4" },
        { goalNumber: 930, match: "vs San Diego FC (2-2)", date: "20 September 2026 • 24'", type: "Direct Free Kick", videoUrl: "https://cdn.messiallgoals.com/Goal930.mp4" },
        { goalNumber: 929, match: "vs Cruz Azul (2-0)", date: "17 September 2026 • 12'", type: "Header", videoUrl: "https://cdn.messiallgoals.com/Goal929.mp4" },
        { goalNumber: 928, match: "vs Nashville SC (2-2)", date: "12 September 2026 • 67'", type: "Left Foot", videoUrl: "https://cdn.messiallgoals.com/Goal928.mp4" }
      ],
      totals: { seniorGoals: 932, appearances: 1178, miamiGoals: 102, season2026Goals: 26, freeKicks: 76 }
    };
  }
}

async function fetchJsonSafe(url, timeoutMs = 2500) {
  try {
    const res = await fetch(url, {
      headers: HEADERS,
      signal: AbortSignal.timeout(timeoutMs)
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (_) {
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const baseline = getLocalFallback();

  try {
    // Parallel fetch from both Overview & MLS Scoreboard with 2.5s fast timeout
    const [ovData, mlsData] = await Promise.all([
      fetchJsonSafe(ESPN_ATHLETE_OVERVIEW, 2500),
      fetchJsonSafe(ESPN_MLS_SCOREBOARD, 2500)
    ]);

    const candidateMap = new Map();

    if (ovData?.gameLog?.events) {
      for (const [id, ev] of Object.entries(ovData.gameLog.events)) {
        candidateMap.set(String(id), {
          id: String(id),
          gameDate: ev.gameDate,
          opponent: ev.opponent?.displayName || "Opponent",
          leagueName: ev.leagueName || "Major League Soccer",
          score: ev.score || "Final"
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
              opponent: oppComp?.team?.displayName || "Opponent",
              leagueName: "Major League Soccer",
              score: scoreStr
            });
          }
        }
      }
    }

    const events = Array.from(candidateMap.values());
    if (!events.length) {
      return res.status(200).json(baseline);
    }

    // Sort by gameDate descending (most recent first)
    events.sort((a, b) => new Date(b.gameDate) - new Date(a.gameDate));
    const latestEvent = events[0];

    const matchDateObj = new Date(latestEvent.gameDate);
    const todayUtc = new Date().toISOString().split("T")[0];
    const matchDateStr = latestEvent.gameDate.split("T")[0];
    const isToday = matchDateStr === todayUtc;

    let hasMatchToday = isToday;
    if (ovData?.nextGame) {
      const nextDate = (ovData.nextGame.date || "").split("T")[0];
      if (nextDate === todayUtc) hasMatchToday = true;
    }

    const baselineLastDate = baseline.todayStatus?.lastMatchDate || "2026-10-06";
    const baselineGoalNum = baseline.latestGoal?.goalNumber || 932;

    // If latest event is already accounted for in our baseline, return baseline with fresh live status
    if (matchDateStr <= baselineLastDate && (latestEvent.id === "761844" || matchDateStr === baselineLastDate)) {
      baseline.todayStatus.hasMatchToday = hasMatchToday;
      baseline.todayStatus.didScoreToday = isToday && (baseline.latestGoal?.date === todayUtc);
      return res.status(200).json(baseline);
    }

    // A newer fixture exists: fetch summary to check if Messi scored
    const sumData = await fetchJsonSafe(`${ESPN_SUMMARY_BASE}${latestEvent.id}`, 2500);
    if (!sumData) {
      return res.status(200).json(baseline);
    }

    let messiGoals = 0;
    for (const team of sumData.rosters || []) {
      for (const p of team.roster || []) {
        if (/messi/i.test(p.athlete?.displayName || "")) {
          for (const s of p.stats || []) {
            if (s.name === "totalGoals") messiGoals = Number(s.value) || 0;
          }
        }
      }
    }

    if (messiGoals > 0) {
      let minute = "";
      let finish = "Open play";
      let assist = "";
      let venue = sumData.gameInfo?.venue?.fullName || "Chase Stadium (Fort Lauderdale, FL)";

      for (const ev of sumData.keyEvents || []) {
        const isGoal = /goal/i.test(ev.type?.text || "") && !/own\s*goal/i.test(ev.type?.text || "");
        const goalTextRaw = ev.text || "";
        const primaryAthlete = ev.participants?.[0]?.athlete;
        const isMessiScorer = primaryAthlete ? 
          (primaryAthlete.id === "45843" || /messi/i.test(primaryAthlete.displayName || "")) :
          /Lionel Messi\s*\(/i.test(goalTextRaw);
        if (isGoal && isMessiScorer) {
          const rawClock = (ev.clock?.displayValue || "").replace(/'/g, "");
          minute = rawClock ? `${rawClock}'` : "";
          const isPen = /penalty/i.test(goalTextRaw);
          const isFK = /free\s*kick/i.test(goalTextRaw);
          const isHead = /header|head/i.test(goalTextRaw);
          const isRight = /right\s*foot/i.test(goalTextRaw);

          finish = isPen ? "Penalty" : (isFK ? "Direct Free Kick" : (isHead ? "Header" : (isRight ? "Right Foot" : "Left Foot")));
          const assistMatch = goalTextRaw.match(/Assisted by ([^.]+)/i);
          if (assistMatch) assist = assistMatch[1].trim();
        }
      }

      const oppName = latestEvent.opponent;
      const compName = latestEvent.leagueName;
      const scoreLine = latestEvent.score;
      const newGoalNumber = baselineGoalNum + messiGoals;
      const formattedDate = matchDateObj.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
      const bdayKey = `${String(matchDateObj.getMonth() + 1).padStart(2, '0')}-${String(matchDateObj.getDate()).padStart(2, '0')}`;

      const dynamicLatest = {
        goalNumber: newGoalNumber,
        team: "Inter Miami CF",
        opponent: oppName,
        competition: compName,
        competitionSlug: compName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        date: matchDateStr,
        formattedDate,
        bdayKey,
        minute: minute || "90'",
        clock: minute || "90'",
        type: `${finish}${assist ? ` (Assist: ${assist})` : ""}`,
        finish,
        assist,
        score: scoreLine,
        venue,
        title: `Inter Miami ${scoreLine} ${oppName}`,
        videoUrl: `https://cdn.messiallgoals.com/Goal${newGoalNumber}.mp4`,
        youtubeUrl: `https://www.youtube.com/results?search_query=Messi+goal+vs+${encodeURIComponent(oppName)}+${encodeURIComponent(compName)}`,
        bdayUrl: `/en/birthday/${bdayKey}`
      };

      const newRecentGoals = [
        {
          goalNumber: newGoalNumber,
          title: dynamicLatest.title,
          meta: `${compName} • ${formattedDate}`,
          match: `vs ${oppName} (${scoreLine})`,
          date: `${formattedDate} • ${minute || "90'"}`,
          minute: minute || "90'",
          type: dynamicLatest.type,
          tag: `${finish} 🔥`,
          score: scoreLine,
          comp: compName,
          videoUrl: dynamicLatest.videoUrl,
          ytUrl: dynamicLatest.youtubeUrl,
          bdayUrl: dynamicLatest.bdayUrl
        },
        ...baseline.recentGoals.slice(0, 4)
      ];

      return res.status(200).json({
        syncedAt: new Date().toISOString(),
        latestGoal: dynamicLatest,
        todayStatus: {
          didScoreToday: isToday,
          hasMatchToday,
          lastMatchDate: matchDateStr,
          lastMatchOpponent: oppName,
          lastMatchResult: `Inter Miami ${scoreLine} ${oppName}`,
          lastGoalNumber: newGoalNumber,
          lastGoalMinute: minute || "90'"
        },
        recentGoals: newRecentGoals,
        totals: {
          seniorGoals: newGoalNumber,
          appearances: (baseline.totals?.appearances || 1177) + 1,
          miamiGoals: (baseline.totals?.miamiGoals || 102) + messiGoals,
          season2026Goals: (baseline.totals?.season2026Goals || 25) + messiGoals,
          freeKicks: finish.includes("Free Kick") ? (baseline.totals?.freeKicks || 68) + 1 : (baseline.totals?.freeKicks || 68)
        }
      });
    }

    // Match played but Messi didn't score
    baseline.todayStatus.hasMatchToday = hasMatchToday;
    baseline.todayStatus.didScoreToday = false;
    baseline.todayStatus.lastMatchDate = matchDateStr;
    baseline.todayStatus.lastMatchResult = `Inter Miami ${latestEvent.score || ""} ${latestEvent.opponent || ""}`;
    return res.status(200).json(baseline);

  } catch (err) {
    console.error("api/latest-goal live fetch error, using baseline:", err.message);
    return res.status(200).json(baseline);
  }
}
