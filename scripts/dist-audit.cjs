// One-shot dist audit. Run: node scripts/dist-audit.cjs
const fs = require("fs");
const dist = "./dist";
const must = ["index.html", "goalsbyyear.html", "goalsbyseason.html", "dashboard.html",
  "timeline.html", "achievements.html", "birthday.html", "vs-real-madrid.html", "messi-vs-ronaldo.html", "champions-league.html", "latest-goal.html",
  "es/index.html", "es/birthday.html", "es/latest-goal.html", "pt/index.html", "fr/index.html", "ar/index.html", "bn/index.html", "hi/index.html", "ro/index.html", "uz/index.html",
  "404.html", "sitemap.xml", "robots.txt", "llms.txt", "18188f5363f745f1bbf821767e0f0daf.txt",
  "data/messi-data.json", "data/birthday-goals.json", "fonts/dm-sans-latin.woff2", "img/og-messi.jpg",
  "img/era-2008-olympic.webp", "img/teams/barcelona.png", "favicon.svg", "favicon.ico", "favicon-48x48.png",
  "apple-touch-icon.png", "site.webmanifest", "img/logo.png", "img/messi.webp", "img/messi-450.webp"];
let ok = true;
for (const f of must) {
  if (!fs.existsSync(dist + "/" + f)) { ok = false; console.log("MISSING " + f); }
}
for (const p of ["index.html", "goalsbyyear.html", "goalsbyseason.html", "dashboard.html", "timeline.html", "achievements.html", "birthday.html", "vs-real-madrid.html", "messi-vs-ronaldo.html", "champions-league.html", "latest-goal.html", "es/index.html", "es/birthday.html", "es/latest-goal.html", "pt/index.html", "fr/index.html", "ar/index.html", "bn/index.html", "hi/index.html", "ro/index.html", "uz/index.html"]) {
  const s = fs.readFileSync(dist + "/" + p, "utf8");
  if (!s.includes('class="skip"') || !s.includes('id="main"')) { ok = false; console.log("NO SKIP in " + p); }
  if (!s.includes('G-FERBLJWWWZ')) { ok = false; console.log("NO GTAG in " + p); }
}
const d = JSON.parse(fs.readFileSync(dist + "/data/messi-data.json", "utf8"));
const totalGoalsStr = String(d.totals?.combined?.goals || 931);
const bnDigits = ["০","১","২","৩","৪","৫","৬","৭","৮","৯"];
const bnGoalsStr = totalGoalsStr.split("").map((c) => bnDigits[c] || c).join("");
for (const p of ["index.html", "es/index.html", "pt/index.html", "fr/index.html", "ar/index.html", "bn/index.html", "hi/index.html", "ro/index.html", "uz/index.html"]) {
  const s = fs.readFileSync(dist + "/" + p, "utf8");
  const hasGoals = s.includes(totalGoalsStr) || (p.startsWith("bn/") && s.includes(bnGoalsStr));
  if (!s.includes('id="messi-total-goals"') || !hasGoals) {
    ok = false;
    console.log("MISSING ground-truth " + totalGoalsStr + " goals in " + p);
  }
}
const jsFiles = fs.readdirSync(dist + "/assets").filter((f) => f.endsWith(".js"));
const b = jsFiles.map((f) => fs.readFileSync(dist + "/assets/" + f, "utf8")).join("\n");
for (const needle of ["copyStats", "replaceState", "btn-primary"]) {
  if (!b.includes(needle)) { ok = false; console.log("JS MISSING " + needle); }
}
const css = fs.readdirSync(dist + "/assets").find((f) => f.endsWith(".css"));
const c = fs.readFileSync(dist + "/assets/" + css, "utf8");
for (const needle of [".skip", "@media print", ".btn-primary"]) {
  if (!c.includes(needle)) { ok = false; console.log("CSS MISSING " + needle); }
}
// 404 must be self-contained (no src/ link, which never exists in dist)
const nf = fs.readFileSync(dist + "/404.html", "utf8");
if (nf.includes('href="src/styles.css"')) { ok = false; console.log("404 still links src/styles.css"); }
const sum = (a) => a.reduce((x, r) => x + r.goals, 0);
console.log("dist sums:", sum(d.calendarYears), sum(d.byCompetition), sum(d.byBodyPart));
console.log(ok ? "ALL DIST CHECKS PASS" : "DIST CHECKS FAILED");
process.exit(ok ? 0 : 1);
