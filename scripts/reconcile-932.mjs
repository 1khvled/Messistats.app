/**
 * scripts/reconcile-932.mjs — 931 -> 932 (Messi, ARGENTINA 3-0 Benin friendly,
 * 6 Oct 2026, 71' penalty, 208th cap, 126th Argentina goal, +2 assists) and
 * 979 -> 980 (Ronaldo, Al Nassr 3-0 Al Diriyah, 9 Oct 2026).
 *
 * Lessons from reconcile-931 (retired): no blind number swaps. Video files
 * (Goal93x.mp4), goal refs (#931), SVG path data, match minutes and historic
 * rows are masked/protected; only totals and latest-match narratives change.
 *
 * After running: npm run build && npm run audit && npm run audit:i18n
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/* ============================ RETIRED — DO NOT RUN ============================
 * One-off migration for the 931 -> 932 (Benin penalty, 6 Oct 2026) and
 * 979 -> 980 (Ronaldo, Al Nassr, 9 Oct 2026) increments. Applied 2026-10-10.
 * Its rewrite targets are now CURRENT values, so reruns are harmless skips —
 * but pointless. For future goals use the automated pipeline, not this.
 * ============================================================================ */
console.error("\n[reconcile-932] RETIRED. Migration already applied; use auto-sync-*.mjs.\n");
process.exit(1);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const TODAY = new Date().toISOString().split("T")[0];

let changes = 0;
const log = (m) => { changes++; console.log("  " + m); };

// ============ 1. messi-data.json (explicit fields) ============
{
  const p = path.join(root, "public", "data", "messi-data.json");
  const d = JSON.parse(fs.readFileSync(p, "utf8"));
  d.totals.combined.goals = 932;
  d.totals.combined.appearances = 1178;
  d.totals.country.goals = 126;
  d.totals.country.appearances = 208;
  d.totals.assists.official = 407;
  d.totals.assists.transfermarkt = 449;
  d.totals.assists.byTeam.argentina.official = 58;
  d.totals.assists.byTeam.argentina.transfermarkt = 60;
  d.totals.assists.byTeam.argentina.appearances = 208;
  d.totals.goalContributions.official = 1339;
  d.totals.goalContributions.transfermarkt = 1381;
  const cy = d.countryYears.find((r) => r.year === 2026);
  cy.friendly = [4, 3];
  cy.apps = 12;
  cy.goals = 11;
  const cal = d.calendarYears.find((r) => r.year === 2026);
  cal.goals = 36;
  cal.careerTotal = 932;
  d.byCompetition.find((c) => c.team === "Argentina" && /friendlies/.test(c.competition)).goals = 91;
  d.byFinish.find((f) => f.finish === "Penalties").goals = 110;
  d.byBodyPart.find((b) => b.part === "Left foot").goals = 744;
  d.meta.updated = TODAY;
  d.meta.verification.push(`Goal #932 verified ${TODAY}: Argentina 3-0 Benin friendly, 6 Oct 2026, 71' penalty (126th Argentina goal, 208th cap, assists to Otamendi 48' + Paz 61'). Sources: BBC Sport, Guardian live, ESPN feed, messivsronaldo.app cross-check (932).`);
  // checksum: all four breakdowns must equal 932; NPG must stay 822
  const sum = (a) => a.reduce((x, r) => x + (r.goals || 0), 0);
  const checks = { calendarYears: sum(d.calendarYears), byCompetition: sum(d.byCompetition), byBodyPart: sum(d.byBodyPart), byFinish: sum(d.byFinish) };
  const npg = d.byFinish.find((f) => f.finish === "Open play").goals + d.byFinish.find((f) => f.finish === "Free kicks").goals;
  console.log("  checksums:", JSON.stringify(checks), "NPG:", npg);
  for (const [k, v] of Object.entries(checks)) if (v !== 932) throw new Error(`CHECKSUM FAIL ${k}=${v}`);
  if (npg !== 822) throw new Error(`NPG CHANGED: ${npg}`);
  fs.writeFileSync(p, JSON.stringify(d, null, 2), "utf8");
  log("messi-data.json -> 932/1178, Argentina 126/208, assists 407/449, pens 110, LF 744");
}

// ============ 2. latest-goal.json ============
{
  const p = path.join(root, "public", "data", "latest-goal.json");
  const j = JSON.parse(fs.readFileSync(p, "utf8"));
  j.syncedAt = new Date().toISOString();
  j.latestGoal = {
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
  };
  j.todayStatus = {
    didScoreToday: false,
    hasMatchToday: false,
    lastMatchDate: "2026-10-06",
    lastMatchOpponent: "Benin",
    lastMatchResult: "Argentina 3-0 Benin",
    lastGoalNumber: 932,
    lastGoalMinute: "71'"
  };
  const prev = (j.recentGoals || []).filter((g) => g.goalNumber !== 932);
  const card932 = {
    goalNumber: 932,
    title: "Argentina 3-0 Benin",
    meta: "International Friendly • 6 October 2026",
    match: "vs Benin (3-0)",
    date: "6 October 2026 • 71'",
    minute: "71'",
    type: "Penalty",
    tag: "Penalty 🔥",
    score: "3-0",
    comp: "International Friendly",
    videoUrl: "https://cdn.messiallgoals.com/Goal932.mp4",
    ytUrl: "https://www.youtube.com/results?search_query=Messi+goal+vs+Benin+Argentina+2026",
    bdayUrl: "/en/birthday/10-06"
  };
  j.recentGoals = [card932, ...prev.filter((g) => g.goalNumber >= 928)].slice(0, 5);
  if (JSON.stringify(j.recentGoals.map((g) => g.goalNumber)) !== "[932,931,930,929,928]") {
    throw new Error("recentGoals playlist wrong: " + j.recentGoals.map((g) => g.goalNumber).join(","));
  }
  j.totals = { seniorGoals: 932, appearances: 1178, miamiGoals: 102, season2026Goals: 26, freeKicks: 76 };
  fs.writeFileSync(p, JSON.stringify(j, null, 2), "utf8");
  log("latest-goal.json -> Goal #932 vs Benin (playlist 932..928)");
}

// ============ 3. birthday-goals.json ============
{
  const p = path.join(root, "public", "data", "birthday-goals.json");
  const b = JSON.parse(fs.readFileSync(p, "utf8"));
  b.meta.totalGoals = 932;
  b.meta.months.find((m) => m.month === 10).goals = 92;
  const oct6 = b.calendar["10-06"];
  if (!oct6) throw new Error("10-06 day record missing");
  if (oct6.matches.some((m) => m.date === "2026-10-06")) {
    console.log("  birthday-goals.json 10-06 already has Benin match (skipping append)");
  } else {
    if (oct6.goalsCount !== 1) throw new Error("10-06 day record unexpected: " + JSON.stringify(oct6)?.slice(0, 120));
  oct6.goalsCount = 2;
  oct6.matches.push({
    date: "2026-10-06",
    year: 2026,
    team: "Argentina",
    opponent: "Benin",
    competition: "International Friendly",
    score: "3 – 0",
    goalsCount: 1,
    minutes: ["71"],
    types: ["Penalty"],
    videos: [{ goalNumber: 932, videoUrl: "https://cdn.messiallgoals.com/Goal932.mp4", minute: "71'", opponent: "Benin", assist: "", xg: 0.7835, freekick: false, penalty: true }]
  });
  }
  fs.writeFileSync(p, JSON.stringify(b, null, 2), "utf8");
  log("birthday-goals.json -> 10-06 now 2 goals (Benin penalty appended)");
}

// ============ 4. api/latest-goal.js fallback (explicit rewrite) ============
{
  const p = path.join(root, "api", "latest-goal.js");
  let s = fs.readFileSync(p, "utf8");
  const fallbackBlock = `      latestGoal: {
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
      },`;
  const re = /      latestGoal: \{[\s\S]*?\n      \},\n      todayStatus: \{[\s\S]*?\n      \},/;
  if (!re.test(s)) throw new Error("api/latest-goal.js: fallback block not found");
  s = s.replace(re, () => fallbackBlock);
  // recentGoals: prepend 932 card, keep 931..928, drop 927
  const card932 = `        { goalNumber: 932, match: "vs Benin (3-0)", date: "6 October 2026 • 71'", type: "Penalty", videoUrl: "https://cdn.messiallgoals.com/Goal932.mp4" },\n`;
  if (!s.includes(card932)) {
    s = s.replace(/      recentGoals: \[\n/, () => `      recentGoals: [\n${card932}`);
  }
  // drop the 927 entry (keep list at 5)
  const drop927 = /,\n        \{ goalNumber: 927, match: "vs Montreal \(7-1\)", date: "29 August 2026 • 83'", type: "Direct Free Kick", videoUrl: "https:\/\/cdn\.messiallgoals\.com\/Goal927\.mp4" \}/;
  if (drop927.test(s)) { s = s.replace(drop927, ""); } else { console.log("  api/latest-goal.js 927 entry already dropped"); }
  s = s.replace(drop927, "");
  if (/goalNumber: 927/.test(s)) throw new Error("api/latest-goal.js: 927 entry not dropped");
  s = s.replace("totals: { seniorGoals: 931, appearances: 1177, miamiGoals: 102, season2026Goals: 25, freeKicks: 68 }",
    "totals: { seniorGoals: 932, appearances: 1178, miamiGoals: 102, season2026Goals: 26, freeKicks: 76 }");
  // dynamic-live fallback defaults (used when baseline missing fields)
  s = s.replace("const baselineGoalNum = baseline.latestGoal?.goalNumber || 931;",
    "const baselineGoalNum = baseline.latestGoal?.goalNumber || 932;");
  s = s.replace('const baselineLastDate = baseline.todayStatus?.lastMatchDate || "2026-09-27";',
    'const baselineLastDate = baseline.todayStatus?.lastMatchDate || "2026-10-06";');
  fs.writeFileSync(p, s, "utf8");
  log("api/latest-goal.js fallback -> 932 Benin (932..928, totals fixed incl. stale FK 68->76)");
}

console.log(`[reconcile-932] JSON + API done (${changes} steps). HTML/scripts next.`);

// ============ 5. Static copy: HTML + generator scripts ============
// latest-goal.html x9 and messi-vs-ronaldo.html x9 are REGENERATED by the
// build (sync-latest-goal-html.mjs, build-messi-vs-ronaldo.mjs), so they are
// excluded here to avoid edit-then-overwrite churn.
const SKIP_HTML = /[\\/](en|es|pt|fr|ar|bn|hi|ro|uz)?\/?(latest-goal|messi-vs-ronaldo)\.html$/;
function trackedHtml() {
  const out = [];
  const skipDirs = ["node_modules", "dist", ".git", "scratch", "scratch_audit"];
  (function w(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const f = path.join(d, e.name);
      if (e.isDirectory()) {
        if (!skipDirs.includes(e.name)) w(f);
      } else if (e.name.endsWith(".html") && !SKIP_HTML.test(f)) {
        out.push(f);
      }
    }
  })(root);
  return out;
}

// Masks: content that must NEVER be touched by numeric rules.
function mask(h) {
  const store = [];
  const put = (m) => { store.push(m); return `\u0000MASK${store.length - 1}\u0000`; };
  h = h.replace(/<svg[\s\S]*?<\/svg>/g, put);                    // path data (.931, 161…)
  h = h.replace(/Goal\d+\.mp4/g, put);                            // historic video files
  h = h.replace(/Goal #\d+/g, put);                               // historic goal refs (latest narratives handled explicitly)
  h = h.replace(/#\d{3}\b/g, put);                                // #931 badges, data-goal-num
  h = h.replace(/\b\d{3,4}st\b/g, put);                           // ordinals (931st)
  return [h, store];
}
function unmask(h, store) {
  return h.replace(/\u0000MASK(\d+)\u0000/g, (_, i) => store[Number(i)]);
}

// Ordered numeric rules: [regex, replacement, label]. All run on masked text.
const NUM_RULES = [
  [/og-messi\.jpg\?v=931/g, "og-messi.jpg?v=932", "cache-bust"],
  [/\b931\b/g, "932", "totals-931"],
  [/\b1,177\b/g, "1,178", "apps-comma"],
  [/\b1 177\b/g, "1 178", "apps-space"],
  [/1\.177(?!\d)/g, "1.178", "apps-dot"],
  [/১,১৭৭/g, "১,১৭৮", "apps-bn"],
  [/\b1177\b/g, "1178", "apps-bare"],
  [/\b125\b/g, "126", "arg-goals"],       // surveyed: all 118 HTML hits are Argentina goals
  [/\b207\b/g, "208", "arg-caps"],
  [/\b204\b/g, "208", "arg-caps-stale"],  // stale caps figure in 8 locales + en
  [/২০৪/g, "২০৮", "arg-caps-bn"],
  [/\b405\b/g, "407", "assists"],         // surveyed: all assist contexts
  [/\b447\b/g, "449", "assists-tm"],      // surveyed: all Transfermarkt contexts
  [/\b1336\b/g, "1339", "ga"],
  [/\b1,336\b/g, "1,339", "ga-comma"],
  [/\b109\b/g, "110", "pens"],            // surveyed: all penalty contexts
  [/\b140\b/g, "141", "pen-attempts"],    // surveyed: all attempt contexts
  [/77\.9%/g, "78.0%", "pen-pct"],
  [/77,9%/g, "78,0%", "pen-pct-locale"],
  [/\b979\b/g, "980", "ronaldo-goals"],
  [/\b1,337\b/g, "1,339", "ronaldo-apps"],
  [/1\.337(?!\d)/g, "1.339", "ronaldo-apps-dot"],
  [/\b1 337\b/g, "1 339", "ronaldo-apps-space"],
  [/১,৩৩৭/g, "১,৩৩৯", "ronaldo-apps-bn"],
  [/\b1,240\b/g, "1,241", "ronaldo-ga"],
  [/\b795\b/g, "796", "ronaldo-npg"],
  [/৭৯৫/g, "৭৯৬", "ronaldo-npg-bn"],
  [/\b144\b(?=[^0-9]{0,30}(assist|asist|pass|pase|تمريرة|অ্যাসিস্ট|असिस्ट))/g, "146", "assist-lead"],
  [/\(\+144(?=[^0-9]{0,30}(assist|asist|pass|pase|تمريرة|অ্যাসিস্ট|असिस्ट))/g, "(+146", "assist-lead-badge"],
  [/\b27\b(?=[^0-9]{0,30}(non-penalty|sin penal|sem pen|hors penalty|penaltisiz|penalty|جزاء|পেনাল্টি|पेनल्टी|fără penalty|fara penalty))/g, "26", "npg-lead"],
  [/\(\+27(?=[^0-9]{0,30}(goles sin|buts hors|penaltisiz|non-penalty))/g, "(+26", "npg-lead-badge"],
  [/\b160\b(?=[^0-9]{0,25}(fewer|menos|moins|مباراة أقل|ম্যাচ কম|मैच कम|partidos menos|jogos a menos|matchs de moins|partide mai|kam o))/g, "161", "apps-diff"],
  [/\(\s*160(?=[^0-9]{0,25}(fewer|menos|moins|مباراة|ম্যাচ|मैच|partidos|jogos|matchs|partide|kam|færre))/g, "(161", "apps-diff-badge"],
  [/১৬০(?=[^0-9]{0,25}ম্যাচ কম)/g, "১৬১", "apps-diff-bn"],
  [/needs 69 more goals/g, "needs 68 more goals", "road-en"],
  [/69 هدفاً فقط/g, "68 هدفاً فقط", "road-ar"],
  [/69 गोल/g, "68 गोल", "road-hi"],
  [/69 goles más/g, "68 goles más", "road-es"],
  [/mais 69 gols/g, "mais 68 gols", "road-pt"],
  [/69 buts supplémentaires/g, "68 buts supplémentaires", "road-fr"],
  [/69 de goluri/g, "68 de goluri", "road-ro"],
  [/69 ta gol/g, "68 ta gol", "road-uz"],
  [/৬৯টি গোল প্রয়োজন/g, "৬৮টি গোল প্রয়োজন", "road-bn"],
  [/100 (Inter Miami|إنتر ميامي|ইন্টার মায়ামি|इंटर मियामी|Inter Mayami)/g, "102 $1", "miami-tally"],
  // as-of date stamps (only where the stale total sat beside them)
  [/18 de septiembre de 2026/g, "6 de octubre de 2026", "date-es"],
  [/Em 18 de setembro de 2026/g, "Em 6 de outubro de 2026", "date-pt"],
  [/18 septembre 2026/g, "6 octobre 2026", "date-fr"],
  [/18 سبتمبر 2026/g, "6 أكتوبر 2026", "date-ar"],
  [/18 सितंबर 2026/g, "6 अक्टूबर 2026", "date-hi"],
  [/18 septembrie 2026/g, "6 octombrie 2026", "date-ro"],
  [/18-sentyabr/g, "6-oktabr", "date-uz"],
  [/As of September 2026/g, "As of October 2026", "date-en"],
  [/figures as of 3 October 2026/g, "figures as of 6 October 2026", "date-fig"],
  // assist splits: Argentina 56 -> 58 (explicit phrases)
  [/56 for Argentina/g, "58 for Argentina", "split-en"],
  [/56 con Argentina/g, "58 con Argentina", "split-es"],
  [/56 pela Argentina/g, "58 pela Argentina", "split-pt"],
  [/56 avec l'Argentine|56 pour l'Argentine/g, "58 pour l'Argentine", "split-fr"],
  [/و56 مع الأرجنتين/g, "و58 مع الأرجنتين", "split-ar"],
  [/56 assists? for Argentina|Argentina[^.]{0,30}56 assists?/g, (m) => m.replace("56", "58"), "split-en2"],
  [/56 \/ 58/g, "58 / 60", "split-tm"],
  [/124 more assists/g, "146 more assists", "assist-lead-fix"],
];

// ============ 6b. Shared extra rules (appended to NUM_RULES at runtime) ============
// (NUM_RULES is defined in section 5 above; these run right after it.)
NUM_RULES.push(
  [/\b795\b/g, "796", "ronaldo-npg"],
  [/৭৯৫/g, "৭৯৬", "ronaldo-npg-bn"],
  [/56(?=[^0-9]{0,25}(assists|asistencias|assistências|passes décisives|asist|অ্যাসিস্ট|असिस्ट|pase|пас))/g, "58", "arg-assists"],
  [/৫৬(?=[^0-9]{0,25}(অ্যাসিস্ট))/g, "৫৮", "arg-assists-bn"],
  [/100 (Inter Miami|إنتر ميامي|ইন্টার মায়ামি|इंटर मियामी|Inter Mayami)/g, "102 $1", "miami-tally"],
  [/১৮ সেপ্টেম্বর ২০২৬/g, "৬ অক্টোবর ২০২৬", "date-bn"],
  [/আপডেট সেপ্টেম্বর ২০২৬/g, "আপডেট অক্টোবর ২০২৬", "date-bn-upd"],
  [/As of September 2026/g, "As of October 2026", "date-en"],
  [/\b125\+/g, "126+", "arg-goals-plus"],

  [/১০৯(?=[^0-9]{0,25}(পেনাল্টি|গোল))/g, "১১০", "pens-bn"],
  [/১৪০(?=[^0-9]{0,25}(পেনাল্টি))/g, "১৪১", "pen-att-bn"],
  [/৭৭\.৯%/g, "৭৮.০%", "pen-pct-bn"],
  ["রোনালদো মেসির চেয়ে ৭৫টি পেনাল্টি বেশি দিয়েছেন।", "রোনালদো মেসির চেয়ে ৭৪টি পেনাল্টি বেশি দিয়েছেন।"],
  [/56 \/ 58/g, "58 / 60", "split-tm"],
  [/৯৩১/g, "৯৩২", "totals-bn"],
  [/৪০৫(?=[^০-৯]{0,30}(অ্যাসিস্ট|গোল|ম্যাচ)|$)/g, "৪০৭", "assists-bn"],
  [/৯৭৯/g, "৯৮০", "ronaldo-bn"],
  [/১৪৪(?=[^০-৯]{0,30}অ্যাসিস্ট)/g, "১৪৬", "assist-lead-bn"],
);



// EN homepage latest-match narratives (wholesale rewrite to Benin)
const EN_NARR = `In his most recent official match on 6 October 2026, Lionel Messi scored Goal #932 (his 126th for Argentina) with a 71st-minute penalty in a 3–0 win vs Benin in an international friendly at Estadio Más Monumental, Buenos Aires — his final Argentina appearance (208th cap), adding 2 assists.`;
{
  const p = path.join(root, "index.html");
  let h = fs.readFileSync(p, "utf8");
  if (h.includes("Goal #932 (his 126th for Argentina)")) {
    console.log("  index.html narratives already Benin (skipping)");
  } else {
  const re1 = /In his most recent official match on 20 September 2026, Lionel Messi scored Goal #931 \(his 101st for Inter Miami\) with a 24th-minute direct free kick in a 2–2 draw vs San Diego FC in the MLS Regular Season\./;
  if (!re1.test(h)) throw new Error("index.html: stale JSON-LD narrative not found");
  h = h.replace(re1, () => EN_NARR);
  const re2 = /In his most recent official match on 27 September 2026, Messi scored <b>[\s\S]*?\.<\/p>/;
  const m2 = h.match(re2);
  if (!m2) throw new Error("index.html: stale FAQ narrative not found");
  h = h.replace(re2, () => `In his most recent official match on 6 October 2026, Messi scored <b>Goal #932 (his 126th for Argentina)</b> with a <b>71st-minute penalty</b> in a <b>3–0 win vs Benin</b> in an international friendly.</p>`);
  fs.writeFileSync(p, h, "utf8");
  log("index.html narratives -> Benin farewell");
  }
}

// 10-06 heatmap cell (root birthday.html only; localized grids render from JSON)
{
  const p = path.join(root, "birthday.html");
  let h = fs.readFileSync(p, "utf8");
  const from = '<a href="/en/birthday/10-06" class="bday-day-btn tier-1" data-month="10" data-day="6" title="6 October: 1 goal">6</a>';
  const to = '<a href="/en/birthday/10-06" class="bday-day-btn tier-1" data-month="10" data-day="6" title="6 October: 2 goals">6</a>';
  if (h.includes(to)) {
    console.log("  birthday.html 10-06 cell already 2 goals (skipping)");
  } else if (!h.includes(from)) {
    throw new Error("birthday.html: 10-06 cell not found");
  } else {
    h = h.split(from).join(to);
    fs.writeFileSync(p, h, "utf8");
    log("birthday.html 10-06 cell -> 2 goals (tier-1 unchanged)");
  }
}

let htmlTouched = 0;
for (const f of trackedHtml()) {
  let h = fs.readFileSync(f, "utf8");
  const orig = h;
  const [masked, store] = mask(h);
  let m = masked;
  for (const [re, rep, label] of NUM_RULES) {
    void label;
    m = m.replace(re, rep);
  }
  h = unmask(m, store);
  if (h !== orig) { fs.writeFileSync(f, h, "utf8"); htmlTouched++; }
}
console.log(`  HTML files updated: ${htmlTouched}`);

// Safety: no stale totals may remain outside masks/goals
{
  const bad = [];
  for (const f of trackedHtml()) {
    const h = fs.readFileSync(f, "utf8");
    const [masked] = mask(h);
    for (const [pat, why] of [[/\b979\b/, "ronaldo"], [/\b1,337\b/, "ronaldo-apps"], [/\b1,240\b/, "ronaldo-ga"], [/\b795\b(?![0-9])/, "ronaldo-npg"]]) {
      if (pat.test(masked)) bad.push(`${path.relative(root, f)}: stale ${why}`);
    }
  }
  if (bad.length) { console.error("STALE RONALDO NUMBERS:\n  " + bad.slice(0, 20).join("\n  ")); throw new Error(`${bad.length} stale Ronaldo refs`); }
  console.log("  Ronaldo numbers fully rolled (979/1337/1240/795 gone outside masks).");
}



// ============ 6. Generator/sync/app scripts ============
// build-messi-vs-ronaldo.mjs regenerates all 9 rivalry pages in prebuild,
// so its copy is updated here (same masked rules as HTML + explicit badges).
{
  const p = path.join(root, "scripts", "build-messi-vs-ronaldo.mjs");
  let h = fs.readFileSync(p, "utf8");
  const orig = h;
  const [masked, store] = mask(h);
  let m = masked;
  for (const [re, rep] of NUM_RULES) m = m.replace(re, rep);
  // explicit badge/lead fixes (mixed 26/27 state + pre-existing bugs)
  const explicit = [
    ['badgeMessiNPG: "Messi (+27 goles sin penalti)"', 'badgeMessiNPG: "Messi (+26 goles sin penalti)"'],
    ['badgeMessiNPG: "Messi (+27 buts hors penalty)"', 'badgeMessiNPG: "Messi (+26 buts hors penalty)"'],
    ['badgeMessiNPG: "Messi (+27 ta penaltisiz gol)"', 'badgeMessiNPG: "Messi (+26 ta penaltisiz gol)"'],
    ['ميسي (+62 هدفاً بدون جزاء)', 'ميسي (+26 هدفاً بدون جزاء)'],
    ['"Messi (+75)"', '"Messi (+98)"'],
    ['badgeRonaldoPen: "Ronaldo (+75 penalties)"', 'badgeRonaldoPen: "Ronaldo (+74 penalties)"'],
    ['badgeRonaldoPen: "Ronaldo (+75 penaltis)"', 'badgeRonaldoPen: "Ronaldo (+74 penaltis)"'],
    ['badgeRonaldoPen: "Ronaldo (+75 pênaltis)"', 'badgeRonaldoPen: "Ronaldo (+74 pênaltis)"'],
    ['badgeRonaldoPen: "Ronaldo (+75 penaltys)"', 'badgeRonaldoPen: "Ronaldo (+74 penaltys)"'],
    ['badgeRonaldoPen: "رونالدو (+75 ركلة جزاء)"', 'badgeRonaldoPen: "رونالدو (+74 ركلة جزاء)"'],
    ['badgeRonaldoPen: "রোনালদো (+৭৫ পেনাল্টি)"', 'badgeRonaldoPen: "রোনালদো (+৭৪ পেনাল্টি)"'],
    ['badgeRonaldoPen: "रोनाल्डो (+57 पेनल्टी गोल)"', 'badgeRonaldoPen: "रोनाल्डो (+74 पेनल्टी गोल)"'],
    ['badgeRonaldoPen: "Ronaldo (+75 penalty-uri)"', 'badgeRonaldoPen: "Ronaldo (+74 penalty-uri)"'],
    ['badgeRonaldoPen: "Ronaldu (+75 ta penalti)"', 'badgeRonaldoPen: "Ronaldu (+74 ta penalti)"'],
    ['badgeMessiAssists: "Messi (+144 assists)"', 'badgeMessiAssists: "Messi (+146 assists)"'],
    ['badgeMessiAssists: "Messi (+144 asistencias)"', 'badgeMessiAssists: "Messi (+146 asistencias)"'],
    ['badgeMessiAssists: "Messi (+144 assistências)"', 'badgeMessiAssists: "Messi (+146 assistências)"'],
    ['badgeMessiAssists: "Messi (+144 passes décisives)"', 'badgeMessiAssists: "Messi (+146 passes décisives)"'],
    ['badgeMessiAssists: "ميسي (+144 تمريرة حاسمة)"', 'badgeMessiAssists: "ميسي (+146 تمريرة حاسمة)"'],
    ['badgeMessiAssists: "মেসি (+১৪৪ অ্যাসিস্ট)"', 'badgeMessiAssists: "মেসি (+১৪৬ অ্যাসিস্ট)"'],
    ['badgeMessiAssists: "मेसी (+144 असिस्ट)"', 'badgeMessiAssists: "मेसी (+146 असिस्ट)"'],
    ['badgeMessiAssists: "Messi (+144 pase de gol)"', 'badgeMessiAssists: "Messi (+146 pase de gol)"'],
    ['badgeMessiAssists: "Messi (+144 ta assist)"', 'badgeMessiAssists: "Messi (+146 ta assist)"'],
    ['"Messi (160 ${lang', '"Messi (161 ${lang'],
    ['(klublarda 349 va Argentina safida 56)', '(klublarda 349 va Argentina safida 58)'],
    ['(क्लब में 349 और अर्जेंटीना के लिए 56)', '(क्लब में 349 और अर्जेंटीना के लिए 58)'],
    ['(ক্লাবে ৩৪৯ এবং আর্জেন্টিনায় ৫৬)', '(ক্লাবে ৩৪৯ এবং আর্জেন্টিনায় ৫৮)'],
    ['795 non-penalty', '796 non-penalty'],
    ['795 goles sin penalti', '796 goles sin penalti'],
    ['795 gols sem pênalti', '796 gols sem pênalti'],
    ['795 buts hors penalty', '796 buts hors penalty'],
    ['795 هدفاً بدون ركلات جزاء', '796 هدفاً بدون ركلات جزاء'],
    ['৭৯৫টি গোল করেছেন', '৭৯৬টি গোল করেছেন'],
    ['795 गोल किए', '796 गोल किए'],
    ['795 de penalty', '796 de penalty'],
    ['795 ta gol urgan', '796 ta gol urgan'],
  ];
  for (const [a, b] of explicit) {
    // warn-only: the generic masked rules above may already have converted these
    if (m.includes(a)) m = m.split(a).join(b);
    else console.log("  note: builder string already converted: " + a.slice(0, 50));
  }
  h = unmask(m, store);
  if (h !== orig) { fs.writeFileSync(p, h, "utf8"); log("build-messi-vs-ronaldo.mjs -> 932/980 figures"); }
  const [chk] = mask(h);
  // every stale source string must be gone (converted by generic rules or explicit pairs)
  for (const [a] of explicit) {
    if (chk.includes(a)) throw new Error("builder still has stale string: " + a.slice(0, 70));
  }
  for (const pat of [/\b979\b/, /\b1,337\b/, /1\.337(?!\d)/, /\b1 337\b/, /১,৩৩৭/, /\b1,240\b/, /\b795\b/, /৭৯৫/, /\(\+144 /, /\(\+27 /, /\(\+75 /, /\(\+62 هدفاً/]) {
    if (pat.test(chk)) throw new Error("builder still has stale number: " + pat);
  }
}

// generate-i18n-pages.mjs (manual-run generator; keep consistent for next run)
{
  const p = path.join(root, "scripts", "generate-i18n-pages.mjs");
  let h = fs.readFileSync(p, "utf8");
  const orig = h;
  const [masked, store] = mask(h);
  let m = masked;
  for (const [re, rep] of NUM_RULES) m = m.replace(re, rep);
  h = unmask(m, store);
  if (h !== orig) { fs.writeFileSync(p, h, "utf8"); log("generate-i18n-pages.mjs numbers rolled"); }
}

// build-sitemap.mjs: videoMeta -> Benin + langHomeMeta totals + pub date
{
  const p = path.join(root, "scripts", "build-sitemap.mjs");
  let h = fs.readFileSync(p, "utf8");
  const orig = h;
  const VIDEO = {
    en: ["Lionel Messi Last Goal Video: Goal #932 vs Benin", "Watch Lionel Messi's Goal #932: 71st-minute penalty for Argentina vs Benin in the 6 October 2026 farewell friendly at El Monumental — his 126th Argentina goal in his final international appearance.", ["Lionel Messi", "Argentina", "Goal 932", "Farewell Match", "Messi Last Goal"]],
    es: ["Último Gol de Lionel Messi: Gol #932 contra Benín", "Mira el gol #932 de Lionel Messi: penalti en el minuto 71 con Argentina contra Benín en el amistoso de despedida del 6 de octubre de 2026 en El Monumental — su gol 126 con Argentina en su último partido internacional.", ["Lionel Messi", "Argentina", "Gol 932", "Despedida", "Último gol de Messi"]],
    pt: ["Último Gol de Lionel Messi: Gol #932 contra o Benim", "Veja o gol #932 de Lionel Messi: pênalti aos 71 minutos pela Argentina contra o Benim no amistoso de despedida de 6 de outubro de 2026 no Monumental — seu 126º gol pela Argentina na última partida internacional.", ["Lionel Messi", "Argentina", "Gol 932", "Despedida", "Último gol do Messi"]],
    fr: ["Dernier But de Lionel Messi : But #932 contre le Bénin", "Regardez le 932e but de Lionel Messi : penalty à la 71e minute avec l'Argentine contre le Bénin lors du match d'adieu du 6 octobre 2026 au Monumental — son 126e but avec l'Argentine lors de sa dernière sélection.", ["Lionel Messi", "Argentine", "But 932", "Adieu", "Dernier but de Messi"]],
    ar: ["فيديو آخر هدف لليونيل ميسي: الهدف 932 ضد بنين", "شاهد هدف ليونيل ميسي رقم 932: ركلة جزاء في الدقيقة 71 مع الأرجنتين ضد بنين في مباراة الوداع الودية يوم 6 أكتوبر 2026 على ملعب مونومنتال — هدفه الـ126 مع الأرجنتين في مباراته الدولية الأخيرة.", ["ليونيل ميسي", "الأرجنتين", "الهدف 932", "مباراة الوداع", "آخر هدف لميسي"]],
    bn: ["লিওনেল মেসির সর্বশেষ গোল ভিডিও: বেনিনের বিরুদ্ধে ৯৩২তম গোল", "লিওনেল মেসির ক্যারিয়ারের ৯৩২তম গোল দেখুন: ৬ অক্টোবর ২০২৬-এ মোনুমেন্টালে বিদায়ী প্রীতি ম্যাচে বেনিনের বিরুদ্ধে আর্জেন্টিনার হয়ে ৭১ মিনিটে পেনাল্টি — শেষ আন্তর্জাতিক ম্যাচে ১২৬তম আর্জেন্টিনা গোল।", ["লিওনেল মেসি", "আর্জেন্টিনা", "গোল ৯৩২", "বিদায়ী ম্যাচ", "মেসির শেষ গোল"]],
    hi: ["लियोनेल मेसी का आखिरी गोल वीडियो: बेनिन के खिलाफ 932वां गोल", "लियोनेल मेसी का 932वां करियर गोल देखें: 6 अक्टूबर 2026 को मोनुमेंटल में विदाई मैत्री मैच में बेनिन के खिलाफ अर्जेंटीना के लिए 71वें मिनट में पेनल्टी — आखिरी अंतरराष्ट्रीय मैच में 126वां अर्जेंटीना गोल।", ["लियोनेल मेसी", "अर्जेंटीना", "गोल 932", "विदाई मैच", "मेसी का आखिरी गोल"]],
    ro: ["Ultimul Gol al lui Lionel Messi: Golul #932 împotriva Beninului", "Urmărește golul #932 al lui Lionel Messi: penalty în minutul 71 pentru Argentina împotriva Beninului în amicalul de adio din 6 octombrie 2026 de pe Monumental — al 126-lea gol pentru Argentina în ultimul meci internațional.", ["Lionel Messi", "Argentina", "Gol 932", "Adio", "Ultimul gol Messi"]],
    uz: ["Lionel Messining so'nggi goli: Beninga qarshi 932-gol", "Lionel Messining 932-golini tomosha qiling: 2026-yil 6-oktabrda Monumentalda xayrlashuv o'rtoqlik o'yinida Beninga qarshi Argentina safida 71-daqiqada urilgan penalti — so'nggi xalqaro o'yindagi 126-Argentina goli.", ["Lionel Messi", "Argentina", "Gol 932", "Xayrlashuv", "Messining oxirgi goli"]],
  };
  for (const [lang, [title, desc, tags]] of Object.entries(VIDEO)) {
    const blockRe = new RegExp(`(  ${lang}: \\{[\\s\\S]*?title: ")[^"]*(")`);
    if (!blockRe.test(h)) { console.log(`  sitemap videoMeta ${lang} title already Benin (skipping)`); continue; }
    h = h.replace(blockRe, (_, a, b) => `${a}${title}${b}`);
    const descRe = new RegExp(`((?:  ${lang}: \\{[\\s\\S]*?)desc: ")[^"]*(")`);
    if (!descRe.test(h)) { console.log(`  sitemap videoMeta ${lang} desc already Benin (skipping)`); continue; }
    h = h.replace(descRe, (_, a, b) => `${a}${desc}${b}`);
    const tagsRe = new RegExp(`((?:  ${lang}: \\{[\\s\\S]*?)tags: \\[)[^\\]]*(\\])`);
    h = h.replace(tagsRe, (_, a, b) => `${a}${tags.map((t) => `"${t}"`).join(", ")}${b}`);
  }
  h = h.split("https://cdn.messiallgoals.com/Goal931.mp4").join("https://cdn.messiallgoals.com/Goal932.mp4");
  h = h.split("2026-09-27T23:45:00Z").join("2026-10-06T23:45:00Z");
  for (const [re, rep] of NUM_RULES) h = h.replace(re, rep);
  if (h === orig) { console.log("  build-sitemap.mjs already Benin (skipping)"); }
  fs.writeFileSync(p, h, "utf8");
  log("build-sitemap.mjs videoMeta -> Benin x9 + totals rolled");
}

// sync-twitter-and-logo.mjs cache-bust
{
  const p = path.join(root, "scripts", "sync-twitter-and-logo.mjs");
  let h = fs.readFileSync(p, "utf8");
  if (!h.includes("og-messi.jpg?v=931")) { console.log("  sync-twitter-and-logo.mjs already v=932 (skipping)"); } else {
  h = h.split("og-messi.jpg?v=931").join("og-messi.jpg?v=932");
  fs.writeFileSync(p, h, "utf8");
  log("sync-twitter-and-logo.mjs cache-bust -> v=932");
}

  }
// sync-latest-goal-html.mjs + auto-sync + og + programmatic baselines
{
  let p = path.join(root, "scripts", "sync-latest-goal-html.mjs");
  let h = fs.readFileSync(p, "utf8");
  h = h.split("const seniorGoals = g.goalNumber || totals.seniorGoals || 931;").join("const seniorGoals = g.goalNumber || totals.seniorGoals || 932;");
  h = h.split("const seasonGoals = totals.season2026Goals || 25;").join("const seasonGoals = totals.season2026Goals || 26;");
  h = h.split("const intlGoals = messiData?.totals?.international?.goals || 125;").join("const intlGoals = messiData?.totals?.international?.goals || 126;");
  fs.writeFileSync(p, h, "utf8");
  p = path.join(root, "scripts", "auto-sync-latest-goal.mjs");
  h = fs.readFileSync(p, "utf8");
  h = h.split("latestData.latestGoal?.goalNumber || 930").join("latestData.latestGoal?.goalNumber || 932");
  h = h.split("(latestData.totals.appearances || 1176)").join("(latestData.totals.appearances || 1178)");
  h = h.split("(latestData.totals.miamiGoals || 101)").join("(latestData.totals.miamiGoals || 102)");
  h = h.split("(latestData.totals.season2026Goals || 24)").join("(latestData.totals.season2026Goals || 26)");
  h = h.split("(latestData.totals.freeKicks || 67)").join("(latestData.totals.freeKicks || 76)");
  h = h.split("Goal #${latestData.latestGoal?.goalNumber || 930}").join("Goal #${latestData.latestGoal?.goalNumber || 932}");
  fs.writeFileSync(p, h, "utf8");
  p = path.join(root, "scripts", "generate-og.mjs");
  h = fs.readFileSync(p, "utf8");
  h = h.split("data.totals?.combined?.goals || 930").join("data.totals?.combined?.goals || 932");
  h = h.split("data.totals?.combined?.appearances || 1176").join("data.totals?.combined?.appearances || 1178");
  h = h.split("data.totals?.country?.goals || 125").join("data.totals?.country?.goals || 126");
  h = h.split('clubs["Inter Miami"] || 101').join('clubs["Inter Miami"] || 102');
  fs.writeFileSync(p, h, "utf8");
  p = path.join(root, "scripts", "generate-programmatic-pages.mjs");
  h = fs.readFileSync(p, "utf8");
  h = h.split("bdayData.meta?.totalGoals || 931").join("bdayData.meta?.totalGoals || 932");
  fs.writeFileSync(p, h, "utf8");
  log("sync + og + programmatic baselines rolled");
}

// src/app.js explicit updates
{
  const p = path.join(root, "src", "app.js");
  let h = fs.readFileSync(p, "utf8");
  const orig = h;
  const pairs = [
    ['<div class="mobile-drawer-stat"><span class="num">931</span>', '<div class="mobile-drawer-stat"><span class="num">932</span>'],
    ['<div class="mobile-drawer-stat"><span class="num">1,177</span>', '<div class="mobile-drawer-stat"><span class="num">1,178</span>'],
    ["// Sums reconcile to the 931 / 1,177 / 109-pen / 76-FK ground truth:", "// Sums reconcile to the 932 / 1,178 / 110-pen / 76-FK ground truth:"],
    ["// hat-tricks 48+11+3+0 = 62; G+A 931+405 = 1,336.", "// hat-tricks 48+11+3+0 = 62; G+A 932+407 = 1,339."],
    ['{ goal: "931", opp: "Active Record", date: "2026", age: "39y", apps: "1,177" }', '{ goal: "932", opp: "Active Record", date: "2026", age: "39y", apps: "1,178" }'],
    ["// assists 269+56+46+34 = 405; NPG 599+96+97+30 = 822; FK 50+12+12+2 = 76;", "// assists 269+58+46+34 = 407; NPG 599+96+97+30 = 822; FK 50+12+12+2 = 76;"],
    ['const assistsVal = T === "all" ? "405+" : T === "barcelona" ? "269" : T === "argentina" ? "56" : T === "miami" ? "46" : "34";',
     'const assistsVal = T === "all" ? "407+" : T === "barcelona" ? "269" : T === "argentina" ? "58" : T === "miami" ? "46" : "34";'],
    ['{ id: "argentina", label: "Argentina", goals: 125, apps: 207,', '{ id: "argentina", label: "Argentina", goals: 126, apps: 208,'],
    ["1,377 goal involvements", "1,381 goal involvements"],
    ["Penaltis (109)", "Penaltis (110)"],
    ["Pênaltis (109)", "Pênaltis (110)"],
    ["Penaltys (109)", "Penaltys (110)"],
    ["ضربات الجزاء (109)", "ضربات الجزاء (110)"],
    ["पेनाल्टी (109)", "पेनाल्टी (110)"],
    ["Penalty-uri (109)", "Penalty-uri (110)"],
  ];
  for (const [a, b] of pairs) {
    if (h.includes(a)) h = h.split(a).join(b);
    else console.log("  app.js already converted (skipping): " + a.slice(0, 50));
  }
  h = h.replace(/930 vs 979/g, "932 vs 980");
  h = h.replace(/\b405 official career assists\b/g, "407 official career assists");
  h = h.replace(/\b405 official assists\b/g, "407 official assists");
  h = h.replace(/447 assists\b/g, "449 assists");
  h = h.replace(/447 under Transfermarkt/g, "449 under Transfermarkt");
  h = h.replace(/\b979\b/g, "980");
  h = h.replace(/\b1,337\b/g, "1,339");
  if (h === orig) { console.log("  src/app.js already rolled (skipping)"); }
  fs.writeFileSync(p, h, "utf8");
  log("src/app.js fallbacks rolled (drawer, comments, splits, share texts)");
}

// llms.txt + webmanifest
{
  for (const f of ["public/llms.txt", "public/llms-full.txt"]) {
    const p = path.join(root, f);
    let h = fs.readFileSync(p, "utf8");
    const orig = h;
    for (const [re, rep] of NUM_RULES) h = h.replace(re, rep);
    h = h.replace(/needs 69 more goals/g, "needs 68 more goals");
    h = h.replace(/69 هدفاً فقط/g, "68 هدفاً فقط");
    if (h !== orig) { fs.writeFileSync(p, h, "utf8"); log(`${f} rolled`); }
  }
  const p = path.join(root, "public", "site.webmanifest");
  let h = fs.readFileSync(p, "utf8");
  if (/931/.test(h)) {
    h = h.replace(/931/g, "932");
    fs.writeFileSync(p, h, "utf8");
    log("site.webmanifest -> 932");
  }
}

// ground-truth Argentina row (all index.html, incl. locales)
{
  let n = 0;
  for (const f of trackedHtml()) {
    let h = fs.readFileSync(f, "utf8");
    const orig = h;
    const re = /(<th scope="row">Argentina<\/th>\s*<td>2005–2026<\/td>\s*<td>)207(<\/td>\s*<td><strong>)125(<\/strong><\/td>\s*<td>)56 \/ 58(<\/td>\s*<td><strong>)181(<\/strong><\/td>\s*<td>)(0[.,])60(<\/td>)/g;
    h = h.replace(re, (_, a, b, c, d, e, f2, g, hh) => `${a}208${b}126${c}58 / 60${d}184${e}${f2}61${hh}`);
    if (h !== orig) { fs.writeFileSync(f, h, "utf8"); n++; }
  }
  console.log(`  Argentina ground-truth rows rewritten: ${n}`);
}

// ground-truth badges: Verified September -> October (all locales)
{
  const pairs = [
    ["✓ Primary Source · Verified September 2026", "✓ Primary Source · Verified October 2026"],
    ["Verificado al 18 Septiembre 2026", "Verificado al 6 Octubre 2026"],
    ["Vérifié au 18 Septembre 2026", "Vérifié au 6 Octobre 2026"],
    ["सत्यापित 18 सितंबर 2026", "सत्यापित 6 अक्टूबर 2026"],
    ["Verificado em 18 Setembro 2026", "Verificado em 6 Outubro 2026"],
    ["Verificat la 18 Septembrie 2026", "Verificat la 6 Octombrie 2026"],
    ["موثق في 18 سبتمبر 2026", "موثق في 6 أكتوبر 2026"],
    ["ভেরিফায়েড ১৮ সেপ্টেম্বর ২০২৬", "ভেরিফায়েড ৬ অক্টোবর ২০২৬"],
    ["2026-yil 18-sentyabr", "2026-yil 6-oktabr"],
  ];
  let n = 0;
  for (const f of trackedHtml()) {
    let h = fs.readFileSync(f, "utf8");
    const orig = h;
    for (const [a, b] of pairs) h = h.split(a).join(b);
    if (h !== orig) { fs.writeFileSync(f, h, "utf8"); n++; }
  }
  console.log(`  Verified badges re-dated: ${n}`);
}


// statistical-models FAQ answers: stale era mix (62/105/130 from before the
// 930 era; 124 from the 930 era) -> current 26 / 161 / 146
{
  const p = path.join(root, "scripts", "build-messi-vs-ronaldo.mjs");
  let h = fs.readFileSync(p, "utf8");
  const orig = h;
  const pairs = [
    ["62 goles más sin penalti en 105 partidos menos, más de 130 asistencias",
     "26 goles más sin penalti en 161 partidos menos, más de 146 asistencias"],
    ["62 buts hors penalty de plus en 105 matchs de moins, plus de 130 passes",
     "26 buts hors penalty de plus en 161 matchs de moins, plus de 146 passes"],
    ["62 هدفاً أكثر بدون ركلات جزاء في 105 مباريات أقل، فارق هائل يفوق 130 تمريرة حاسمة",
     "26 هدفاً أكثر بدون ركلات جزاء في 161 مباريات أقل، فارق هائل يفوق 146 تمريرة حاسمة"],
    ["105 मैच कम में 62 अधिक नॉन-पेनल्टी गोल, 130 से अधिक अतिरिक्त असिस्ट",
     "161 मैच कम में 26 अधिक नॉन-पेनल्टी गोल, 146 से अधिक अतिरिक्त असिस्ट"],
    ["62 de goluri în plus fără penalty în 105 meciuri mai puține, peste 130 de assist-uri în plus",
     "26 de goluri în plus fără penalty în 161 meciuri mai puține, peste 146 de assist-uri în plus"],
    [/105 ta kam o[^a-z]*yinda 62 ta ko[^a-z]*proq penaltisiz gol, 130 dan ortiq assist/g,
     (m) => m.replace("105", "161").replace("62", "26").replace("130", "146")],
    ["১০৫ ম্যাচ কম খেলেই পেনাল্টি ছাড়া ৬২ গোল বেশি, ১৩০টির বেশি অতিরিক্ত অ্যাসিস্ট",
     "১৬১ ম্যাচ কম খেলেই পেনাল্টি ছাড়া ২৬ গোল বেশি, ১৪৬টির বেশি অতিরিক্ত অ্যাসিস্ট"],
    ["124 assistências de vantagem", "146 assistências de vantagem"],
    ["124 more assists", "146 more assists"],
  ];
  for (const [a, b] of pairs) {
    if (typeof a === "string") {
      if (h.includes(a)) h = h.split(a).join(b);
      else console.log("  note: models-answer already fixed: " + String(a).slice(0, 40));
    } else {
      const before = h;
      h = h.replace(a, typeof b === "function" ? b : () => b);
      if (h === before) console.log("  note: models-answer regex already fixed: " + a);
    }
  }
  if (h !== orig) { fs.writeFileSync(p, h, "utf8"); log("builder statistical-models answers -> 26/161/146"); }
  const [chk] = mask(h);
  if (/62 goles más sin penalti|62 buts hors penalty|105 مباريات أقل|105 मैच कम|105 meciuri mai|105 ta kam|১০৫ ম্যাচ|130 asistencias|130 passes|130 تمريرة|130 से अधिक|130 de assist|130 dan ortiq|১৩০টির|124 assistências|124 more assists/.test(chk)) {
    throw new Error("builder still has stale models-answer numbers");
  }
}

console.log(`[reconcile-932] DONE total steps: ${changes}`);
