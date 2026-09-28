/**
 * scripts/reconcile-931.mjs
 *
 * Full project reconciliation to 931 goals and 1,177 appearances.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

console.log("[reconcile-931] Starting comprehensive reconciliation to 931 goals...");

// 1. Reconcile public/data/messi-data.json
const messiDataPath = path.join(root, "public", "data", "messi-data.json");
if (fs.existsSync(messiDataPath)) {
  const d = JSON.parse(fs.readFileSync(messiDataPath, "utf8"));
  d.totals.combined.goals = 931;
  d.totals.combined.appearances = 1177;
  d.totals.club.goals = 806;
  d.totals.club.appearances = 970;
  d.totals.country.goals = 125;
  d.totals.country.appearances = 207;
  d.totals.goalContributions.official = 1336;
  d.totals.goalContributions.transfermarkt = 1378;
  d.meta.updated = "2026-09-28";
  fs.writeFileSync(messiDataPath, JSON.stringify(d, null, 2), "utf8");
  console.log("  ✓ Updated public/data/messi-data.json");
}

// 2. Reconcile public/data/latest-goal.json
const latestGoalPath = path.join(root, "public", "data", "latest-goal.json");
if (fs.existsSync(latestGoalPath)) {
  const lg = JSON.parse(fs.readFileSync(latestGoalPath, "utf8"));
  lg.syncedAt = new Date().toISOString();
  lg.latestGoal = {
    goalNumber: 931,
    team: "Inter Miami CF",
    opponent: "Columbus Crew",
    competition: "MLS",
    competitionSlug: "mls",
    date: "2026-09-27",
    formattedDate: "27 September 2026",
    bdayKey: "09-27",
    minute: "33'",
    clock: "33'",
    type: "Direct Free Kick",
    finish: "Direct Free Kick",
    assist: "",
    score: "1-2",
    venue: "ScottsMiracle-Gro Field (Columbus, Ohio)",
    title: "Columbus Crew 2-1 Inter Miami CF",
    videoUrl: "https://cdn.messiallgoals.com/Goal931.mp4",
    youtubeUrl: "https://www.youtube.com/results?search_query=Messi+goal+vs+Columbus+Crew+MLS+2026",
    bdayUrl: "/en/birthday/09-27"
  };
  lg.todayStatus = {
    didScoreToday: false,
    hasMatchToday: false,
    lastMatchDate: "2026-09-27",
    lastMatchOpponent: "Columbus Crew",
    lastMatchResult: "Columbus Crew 2-1 Inter Miami CF",
    lastGoalNumber: 931,
    lastGoalMinute: "33'"
  };
  lg.recentGoals = [
    {
      goalNumber: 931,
      title: "Columbus Crew 2-1 Inter Miami CF",
      meta: "MLS • 27 September 2026",
      match: "at Columbus Crew (1-2)",
      date: "27 September 2026 • 33'",
      minute: "33'",
      type: "Direct Free Kick",
      tag: "Direct Free Kick 🔥",
      score: "1-2",
      comp: "MLS",
      videoUrl: "https://cdn.messiallgoals.com/Goal931.mp4",
      ytUrl: "https://www.youtube.com/results?search_query=Messi+goal+vs+Columbus+Crew+MLS+2026",
      bdayUrl: "/en/birthday/09-27"
    },
    {
      goalNumber: 930,
      title: "Inter Miami 2-2 San Diego FC",
      meta: "MLS • 20 September 2026",
      match: "vs San Diego FC (2-2)",
      date: "20 September 2026 • 24'",
      minute: "24'",
      type: "Direct Free Kick",
      tag: "Direct Free Kick 🔥",
      score: "2-2",
      comp: "MLS",
      videoUrl: "https://cdn.messiallgoals.com/Goal930.mp4",
      ytUrl: "https://www.youtube.com/results?search_query=Messi+goal+vs+San+Diego+FC+MLS",
      bdayUrl: "/en/birthday/09-21"
    },
    {
      goalNumber: 929,
      title: "Inter Miami 2 – 0 Cruz Azul",
      meta: "Campeones Cup Final • 17 September 2026 • Chase Stadium (Fort Lauderdale, FL)",
      match: "vs Cruz Azul (2-0)",
      date: "17 September 2026 • 12'",
      minute: "12'",
      type: "Header (Assist: Luis Suárez)",
      tag: "Header 🔥",
      score: "2 – 0",
      comp: "Campeones Cup",
      videoUrl: "https://cdn.messiallgoals.com/Goal929.mp4",
      ytUrl: "https://www.youtube.com/results?search_query=Messi+goal+Cruz+Azul+Campeones+Cup+2026",
      bdayUrl: "/en/birthday/09-17"
    }
  ];
  fs.writeFileSync(latestGoalPath, JSON.stringify(lg, null, 2), "utf8");
  console.log("  ✓ Updated public/data/latest-goal.json");
}

// 3. Reconcile public/site.webmanifest
const manifestPath = path.join(root, "public", "site.webmanifest");
if (fs.existsSync(manifestPath)) {
  let m = fs.readFileSync(manifestPath, "utf8");
  m = m.replace(/930 goals/g, "931 goals");
  fs.writeFileSync(manifestPath, m, "utf8");
  console.log("  ✓ Updated public/site.webmanifest");
}

// 4. Update sync-twitter-and-logo.mjs
const syncScriptPath = path.join(root, "scripts", "sync-twitter-and-logo.mjs");
if (fs.existsSync(syncScriptPath)) {
  let sc = fs.readFileSync(syncScriptPath, "utf8");
  sc = sc.replace(/v=930/g, "v=931");
  fs.writeFileSync(syncScriptPath, sc, "utf8");
  console.log("  ✓ Updated scripts/sync-twitter-and-logo.mjs to v=931");
}

// 5. Update build-messi-vs-ronaldo.mjs
const mvrScriptPath = path.join(root, "scripts", "build-messi-vs-ronaldo.mjs");
if (fs.existsSync(mvrScriptPath)) {
  let mvr = fs.readFileSync(mvrScriptPath, "utf8");
  mvr = mvr.replace(/930/g, "931");
  mvr = mvr.replace(/1,176/g, "1,177");
  mvr = mvr.replace(/1\.176/g, "1.177");
  mvr = mvr.replace(/1 176/g, "1 177");
  mvr = mvr.replace(/১,১৭৬/g, "১,১৭৭");
  mvr = mvr.replace(/৯৩০/g, "৯৩১");
  mvr = mvr.replace(/821/g, "822");
  mvr = mvr.replace(/৮২১/g, "৮২২");
  mvr = mvr.replace(/67/g, "68");
  mvr = mvr.replace(/৬৭/g, "৬৮");
  mvr = mvr.replace(/161/g, "160");
  mvr = mvr.replace(/১৬১/g, "১৬০");
  mvr = mvr.replace(/49/g, "48");
  mvr = mvr.replace(/৪৯/g, "৪৮");
  mvr = mvr.replace(/26 non-penalty/g, "27 non-penalty");
  mvr = mvr.replace(/26 goluri fara penalty/g, "27 goluri fara penalty");
  mvr = mvr.replace(/26 ta penaltisiz/g, "27 ta penaltisiz");
  mvr = mvr.replace(/26 goles sin penal/g, "27 goles sin penal");
  mvr = mvr.replace(/26 gols sem pen/g, "27 gols sem pen");
  mvr = mvr.replace(/26 buts hors penalty/g, "27 buts hors penalty");
  mvr = mvr.replace(/v=930/g, "v=931");
  fs.writeFileSync(mvrScriptPath, mvr, "utf8");
  console.log("  ✓ Updated scripts/build-messi-vs-ronaldo.mjs");
}

// 6. Update build-sitemap.mjs
const sitemapScriptPath = path.join(root, "scripts", "build-sitemap.mjs");
if (fs.existsSync(sitemapScriptPath)) {
  let sm = fs.readFileSync(sitemapScriptPath, "utf8");
  sm = sm.replace(/930/g, "931");
  sm = sm.replace(/1,176/g, "1,177");
  sm = sm.replace(/1 176/g, "1 177");
  sm = sm.replace(/1\.176/g, "1.177");
  sm = sm.replace(/৯৩০/g, "৯৩১");
  sm = sm.replace(/১,১৭৬/g, "১,১৭৭");
  sm = sm.replace(/Goal #931 vs Cruz Azul/g, "Goal #931 vs Columbus Crew");
  sm = sm.replace(/Goal #931 vs San Diego FC/g, "Goal #931 vs Columbus Crew");
  sm = sm.replace(/Gol #931 contra Cruz Azul/g, "Gol #931 contra Columbus Crew");
  sm = sm.replace(/But #931 contre Cruz Azul/g, "But #931 contre Columbus Crew");
  sm = sm.replace(/الهدف 931 ضد كروز أزول/g, "الهدف 931 ضد كولومبوس كرو");
  sm = sm.replace(/ক্রুজ আজুলের বিরুদ্ধে ৯৩১তম গোল/g, "কলম্বাস ক্রুর বিরুদ্ধে ৯৩১তম গোল");
  sm = sm.replace(/क्रूज़ अज़ुल के खिलाफ 931वां गोल/g, "कोलंबस क्रू के खिलाफ 931वां गोल");
  sm = sm.replace(/Golul #931 împotriva Cruz Azul/g, "Golul #931 împotriva Columbus Crew");
  sm = sm.replace(/Cruz Azulga qarshi 931-gol/g, "Columbus Crewga qarshi 931-gol");
  sm = sm.replace(/Goal930\.mp4/g, "Goal931.mp4");
  sm = sm.replace(/2026-09-17T21:15:00Z/g, "2026-09-27T23:45:00Z");
  fs.writeFileSync(sitemapScriptPath, sm, "utf8");
  console.log("  ✓ Updated scripts/build-sitemap.mjs");
}

// 7. Update generate-i18n-pages.mjs
const genI18nPath = path.join(root, "scripts", "generate-i18n-pages.mjs");
if (fs.existsSync(genI18nPath)) {
  let gi = fs.readFileSync(genI18nPath, "utf8");
  gi = gi.replace(/930/g, "931");
  gi = gi.replace(/1,176/g, "1,177");
  gi = gi.replace(/1 176/g, "1 177");
  gi = gi.replace(/1\.176/g, "1.177");
  gi = gi.replace(/৯৩০/g, "৯৩১");
  gi = gi.replace(/১,১৭৬/g, "১,১৭৭");
  gi = gi.replace(/v=930/g, "v=931");
  fs.writeFileSync(genI18nPath, gi, "utf8");
  console.log("  ✓ Updated scripts/generate-i18n-pages.mjs");
}

// 8. Update src/app.js
const appJsPath = path.join(root, "src", "app.js");
if (fs.existsSync(appJsPath)) {
  let app = fs.readFileSync(appJsPath, "utf8");
  app = app.replace(/>930</g, ">931<");
  app = app.replace(/"930"/g, '"931"');
  app = app.replace(/1,176/g, "1,177");
  app = app.replace(/1 176/g, "1 177");
  app = app.replace(/1\.176/g, "1.177");
  app = app.replace(/৯৩০/g, "৯৩১");
  app = app.replace(/১,১৭৬/g, "১,১৭৭");
  app = app.replace(/805 goles/g, "806 goles");
  app = app.replace(/805 gols/g, "806 gols");
  app = app.replace(/805 buts/g, "806 buts");
  app = app.replace(/805 هدفاً/g, "806 هدفاً");
  app = app.replace(/৮০৫টি/g, "৮০৬টি");
  app = app.replace(/805 गोल/g, "806 गोल");
  app = app.replace(/805 goluri/g, "806 goluri");
  app = app.replace(/805 ta gol/g, "806 ta gol");
  app = app.replace(/805 goals club/g, "806 goals club");
  app = app.replace(/969 apps/g, "970 apps");
  app = app.replace(/969 PJ/g, "970 PJ");
  app = app.replace(/969 jogos/g, "970 jogos");
  app = app.replace(/969 matchs/g, "970 matchs");
  app = app.replace(/969 مباراة/g, "970 مباراة");
  app = app.replace(/৯৬৯টি/g, "৯৭০টি");
  app = app.replace(/969 क्लब/g, "970 क्लब");
  app = app.replace(/969 meciuri/g, "970 meciuri");
  app = app.replace(/969 ta klub/g, "970 ta klub");
  fs.writeFileSync(appJsPath, app, "utf8");
  console.log("  ✓ Updated src/app.js");
}

// 9. Reconcile llms.txt & llms-full.txt
for (const llmFile of ["public/llms.txt", "public/llms-full.txt"]) {
  const p = path.join(root, llmFile);
  if (fs.existsSync(p)) {
    let c = fs.readFileSync(p, "utf8");
    c = c.replace(/930/g, "931");
    c = c.replace(/1,176/g, "1,177");
    c = c.replace(/1 176/g, "1 177");
    c = c.replace(/805/g, "806");
    c = c.replace(/969/g, "970");
    c = c.replace(/101 Inter Miami/g, "102 Inter Miami");
    c = c.replace(/116 Inter Miami/g, "117 Inter Miami");
    c = c.replace(/67 direct free/g, "68 direct free");
    c = c.replace(/821 non-penalty/g, "822 non-penalty");
    c = c.replace(/1,335/g, "1,336");
    c = c.replace(/70 more goals/g, "69 more goals");
    fs.writeFileSync(p, c, "utf8");
    console.log(`  ✓ Updated ${llmFile}`);
  }
}

// 10. Update all HTML files
function getHtmlFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", "dist", ".git", "scratch", "scratch_audit"].includes(entry.name)) {
        continue;
      }
      files.push(...getHtmlFiles(full));
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(full);
    }
  }
  return files;
}

const htmlFiles = getHtmlFiles(root);
let htmlCount = 0;

for (const file of htmlFiles) {
  let content = fs.readFileSync(file, "utf8");
  const orig = content;

  // Cache busting
  content = content.replace(/og-messi\.jpg\?v=930/g, "og-messi.jpg?v=931");

  // Goals
  content = content.replace(/\b930\b/g, "931");
  content = content.replace(/৯৩০/g, "৯৩১");

  // Apps
  content = content.replace(/1,176/g, "1,177");
  content = content.replace(/1 176/g, "1 177");
  content = content.replace(/1\.176/g, "1.177");
  content = content.replace(/১,১৭৬/g, "১,১৭৭");

  // Free kicks: 67 -> 68
  content = content.replace(/67 direct free-kick goals/g, "68 direct free-kick goals");
  content = content.replace(/67 direct free kick/g, "68 direct free kick");
  content = content.replace(/67 direct free/g, "68 direct free");
  content = content.replace(/67 tiros libres/g, "68 tiros libres");
  content = content.replace(/67 cobranças de falta/g, "68 cobranças de falta");
  content = content.replace(/67 coups francs/g, "68 coups francs");
  content = content.replace(/67 هدفاً من ركلة حرة/g, "68 هدفاً من ركلة حرة");
  content = content.replace(/৬৭টি ফ্রি-কিক/g, "৬৮টি ফ্রি-কিক");
  content = content.replace(/67 फ्री-किक/g, "68 फ्री-किक");
  content = content.replace(/67 lovituri libere/g, "68 lovituri libere");
  content = content.replace(/67 ta jarima zarbasi/g, "68 ta jarima zarbasi");

  // Non-penalty goals: 821 -> 822
  content = content.replace(/821 non-penalty goals/g, "822 non-penalty goals");
  content = content.replace(/821 goles sin penal/g, "822 goles sin penal");
  content = content.replace(/821 gols sem pênalti/g, "822 gols sem pênalti");
  content = content.replace(/821 buts hors penalty/g, "822 buts hors penalty");
  content = content.replace(/821 هدفاً غير ركلة جزاء/g, "822 هدفاً غير ركلة جزاء");
  content = content.replace(/৮২১টি নন-পেনাল্টি/g, "৮২২টি নন-পেনাল্টি");
  content = content.replace(/821 गैर-पेनाल्टी/g, "822 गैर-पेनाल्टी");
  content = content.replace(/821 goluri fără penalty/g, "822 goluri fără penalty");
  content = content.replace(/821 ta penaltisiz/g, "822 ta penaltisiz");

  // Inter Miami: 101 -> 102 goals
  content = content.replace(/101 Inter Miami/g, "102 Inter Miami");
  content = content.replace(/101 goals in 116/g, "102 goals in 117");
  content = content.replace(/101 goles en 116/g, "102 goles en 117");
  content = content.replace(/101 gols em 116/g, "102 gols em 117");
  content = content.replace(/101 buts en 116/g, "102 buts en 117");
  content = content.replace(/101 هدفاً في 116/g, "102 هدفاً في 117");
  content = content.replace(/১০১টি গোল ১১৬/g, "১০২টি গোল ১১৭");
  content = content.replace(/101 गोल 116/g, "102 गोल 117");
  content = content.replace(/101 goluri în 116/g, "102 goluri în 116");
  content = content.replace(/101 ta gol 116/g, "102 ta gol 117");

  // Goal Contributions: 1,335 -> 1,336
  content = content.replace(/1,335/g, "1,336");
  content = content.replace(/1 335/g, "1 336");
  content = content.replace(/১,৩৩৫/g, "১,৩৩৬");

  // Road to 1,000 goals: 70 -> 69
  content = content.replace(/needs 70 more goals/g, "needs 69 more goals");
  content = content.replace(/necesita 70 goles más/g, "necesita 69 goles más");
  content = content.replace(/precisa de mais 70 gols/g, "precisa de mais 69 gols");
  content = content.replace(/a besoin de 70 buts supplémentaires/g, "a besoin de 69 buts supplémentaires");
  content = content.replace(/يحتاج إلى 70 هدفاً/g, "يحتاج إلى 69 هدفاً");
  content = content.replace(/৭০টি গোল প্রয়োজন/g, "৬৯টি গোল প্রয়োজন");
  content = content.replace(/70 और गोल की आवश्यकता/g, "69 और गोल की आवश्यकता");
  content = content.replace(/mai are nevoie de 70 de goluri/g, "mai are nevoie de 69 de goluri");
  content = content.replace(/yana 70 ta gol urishi kerak/g, "yana 69 ta gol urishi kerak");

  // Fix Barcelona G+A total if 931 was placed there (672 + 269 = 941)
  content = content.replace(
    /(<td>2004–2021<\/td>\s*<td>778<\/td>\s*<td><strong>672<\/strong><\/td>\s*<td>269 \/ 303<\/td>\s*<td><strong>)931(<\/strong>)/g,
    "$1941$2"
  );
  // Inter Miami in ground truth table (117 apps, 102 goals, 46/51 assists, 148 G+A)
  content = content.replace(
    /(<th scope="row">Inter Miami CF<\/th>\s*<td>2023–2026<\/td>\s*<td>)\d+(<\/td>\s*<td><strong>)\d+(<\/strong><\/td>\s*<td>46 \/ 51<\/td>\s*<td><strong>)\d+(<\/strong>)/g,
    "$1117$2102$3148$4"
  );

  // Latest match FAQ update in HTML
  content = content.replace(
    /In his most recent official match on (?:20|21) September 2026, Lionel Messi scored Goal #930 [^.]*\./g,
    "In his most recent official match on 27 September 2026, Lionel Messi scored Goal #931 (his 102nd for Inter Miami and 68th direct free kick) with a 33rd-minute free kick vs Columbus Crew in the MLS Regular Season."
  );

  if (content !== orig) {
    fs.writeFileSync(file, content, "utf8");
    htmlCount++;
  }
}

console.log(`  ✓ Updated ${htmlCount} HTML files!`);
console.log("[reconcile-931] Complete!");
