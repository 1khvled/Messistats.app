/**
 * GET /api/latest-goal
 * 
 * Auto-pulls Lionel Messi's latest career goal, match details, video stream URL,
 * and live "Did Messi score today?" status directly from ESPN & local verified feeds.
 * 
 * Includes CDN caching (s-maxage=120) with instant stale-while-revalidate fallback.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ESPN_ATHLETE_OVERVIEW = "https://site.web.api.espn.com/apis/common/v3/sports/soccer/athletes/45843/overview";
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
    // Hardcoded minimal baseline in case of filesystem constraints
    return {
      syncedAt: new Date().toISOString(),
      latestGoal: {
        goalNumber: 929,
        team: "Inter Miami CF",
        opponent: "Cruz Azul",
        competition: "Campeones Cup Final",
        date: "2026-09-17",
        formattedDate: "17 September 2026",
        minute: "12'",
        type: "Header (Assist: Luis Suárez)",
        finish: "Header",
        score: "2 – 0",
        videoUrl: "https://cdn.messiallgoals.com/Goal929.mp4",
        youtubeUrl: "https://www.youtube.com/results?search_query=Messi+goal+vs+Cruz+Azul+Campeones+Cup+September+2026+Inter+Miami",
        bdayUrl: "/en/birthday/09-17"
      },
      todayStatus: {
        didScoreToday: false,
        hasMatchToday: false,
        lastMatchDate: "2026-09-17",
        lastMatchOpponent: "Cruz Azul",
        lastMatchResult: "Inter Miami 2 – 0 Cruz Azul",
        lastGoalNumber: 929,
        lastGoalMinute: "12'"
      },
      recentGoals: [
        { goalNumber: 929, match: "vs Cruz Azul (2-0)", date: "17 September 2026 • 12'", type: "Header", videoUrl: "https://cdn.messiallgoals.com/Goal929.mp4" },
        { goalNumber: 928, match: "vs Nashville SC (2-2)", date: "12 September 2026 • 67'", type: "Left Foot", videoUrl: "https://cdn.messiallgoals.com/Goal928.mp4" },
        { goalNumber: 927, match: "vs Montreal (7-1)", date: "29 August 2026 • 83'", type: "Direct Free Kick", videoUrl: "https://cdn.messiallgoals.com/Goal927.mp4" },
        { goalNumber: 926, match: "vs Montreal (7-1)", date: "29 August 2026 • 65'", type: "Left Foot", videoUrl: "https://cdn.messiallgoals.com/Goal926.mp4" },
        { goalNumber: 925, match: "vs Montreal (7-1)", date: "29 August 2026 • 49'", type: "Right Foot", videoUrl: "https://cdn.messiallgoals.com/Goal925.mp4" }
      ],
      totals: { seniorGoals: 929, appearances: 1175, miamiGoals: 100, season2026Goals: 23, freeKicks: 67 }
    };
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=300");
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5s fast timeout

    const ovRes = await fetch(ESPN_ATHLETE_OVERVIEW, {
      headers: HEADERS,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!ovRes.ok) {
      return res.status(200).json(baseline);
    }

    const ovData = await ovRes.json();
    const events = Object.values(ovData.gameLog?.events || {});
    if (!events.length) {
      return res.status(200).json(baseline);
    }

    // Sort by gameDate descending (most recent first)
    events.sort((a, b) => new Date(b.gameDate) - new Date(a.gameDate));
    const latestEvent = events[0];

    // Check if match was today
    const matchDateObj = new Date(latestEvent.gameDate);
    const todayUtc = new Date().toISOString().split("T")[0];
    const matchDateStr = latestEvent.gameDate.split("T")[0];
    const isToday = matchDateStr === todayUtc;

    // Check nextGame to see if there is a match scheduled for today
    let hasMatchToday = isToday;
    if (ovData.nextGame) {
      const nextDate = (ovData.nextGame.date || "").split("T")[0];
      if (nextDate === todayUtc) hasMatchToday = true;
    }

    // If latest event matches our baseline, return baseline enriched with real-time today status
    const baselineLastDate = baseline.todayStatus?.lastMatchDate;
    if (matchDateStr <= baselineLastDate && latestEvent.id === "401901377") {
      baseline.todayStatus.hasMatchToday = hasMatchToday;
      baseline.todayStatus.didScoreToday = isToday;
      return res.status(200).json(baseline);
    }

    // If there is a newer event, fetch summary to get scorer details
    const sumRes = await fetch(`${ESPN_SUMMARY_BASE}${latestEvent.id}`, {
      headers: HEADERS,
      signal: AbortSignal.timeout(2500)
    });

    if (!sumRes.ok) {
      return res.status(200).json(baseline);
    }

    const sumData = await sumRes.json();
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

    // If Messi scored in the newly discovered fixture
    if (messiGoals > 0) {
      let minute = "";
      let finish = "Open play";
      let assist = "";
      let goalText = "";

      for (const ev of sumData.keyEvents || []) {
        const isGoal = /goal/i.test(ev.type?.text || "") && !/own\s*goal/i.test(ev.type?.text || "");
        const primaryAthlete = ev.participants?.[0]?.athlete;
        const isMessiScorer = primaryAthlete ? 
          (primaryAthlete.id === "45843" || /messi/i.test(primaryAthlete.displayName || "")) :
          /Lionel Messi\s*\(/i.test(goalTextRaw);
        if (isGoal && isMessiScorer) {
          const rawClock = (ev.clock?.displayValue || "").replace(/'/g, "");
          minute = rawClock ? `${rawClock}'` : "";
          goalText = goalTextRaw;
          const isPen = /penalty/i.test(goalText);
          const isFK = /free\s*kick/i.test(goalText);
          const isHead = /header|head/i.test(goalText);
          const isRight = /right\s*foot/i.test(goalText);

          finish = isPen ? "Penalty" : (isFK ? "Direct Free Kick" : (isHead ? "Header" : (isRight ? "Right Foot" : "Left Foot")));
          const assistMatch = goalText.match(/Assisted by ([^.]+)/i);
          if (assistMatch) assist = assistMatch[1].trim();
        }
      }

      const oppName = latestEvent.opponent?.displayName || "Opponent";
      const compName = latestEvent.leagueName || "Major League Soccer";
      const scoreLine = latestEvent.score || "Final";
      const newGoalNumber = (baseline.latestGoal.goalNumber || 929) + 1;
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
        minute: minute ? `${minute}'` : "",
        clock: minute ? `${minute}'` : "",
        type: `${finish}${assist ? ` (Assist: ${assist})` : ""}`,
        finish,
        assist,
        score: scoreLine,
        venue: "Chase Stadium (Fort Lauderdale, FL)",
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
          date: `${formattedDate} • ${minute}'`,
          minute: `${minute}'`,
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
          lastGoalMinute: minute ? `${minute}'` : ""
        },
        recentGoals: newRecentGoals,
        totals: {
          seniorGoals: newGoalNumber,
          appearances: (baseline.totals?.appearances || 1175) + 1,
          miamiGoals: (baseline.totals?.miamiGoals || 100) + messiGoals,
          season2026Goals: (baseline.totals?.season2026Goals || 23) + messiGoals,
          freeKicks: finish.includes("Free Kick") ? (baseline.totals?.freeKicks || 67) + 1 : (baseline.totals?.freeKicks || 67)
        }
      });
    }

    // Messi played but didn't score in the latest event
    baseline.todayStatus.hasMatchToday = hasMatchToday;
    baseline.todayStatus.didScoreToday = false;
    baseline.todayStatus.lastMatchDate = matchDateStr;
    baseline.todayStatus.lastMatchResult = `Inter Miami ${latestEvent.score || ""} ${latestEvent.opponent?.displayName || ""}`;
    return res.status(200).json(baseline);

  } catch (err) {
    console.error("api/latest-goal live fetch error, using baseline:", err.message);
    return res.status(200).json(baseline);
  }
}
