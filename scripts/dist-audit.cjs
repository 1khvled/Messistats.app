// One-shot dist audit. Run: node scripts/dist-audit.cjs
const fs = require("fs");
const dist = "./dist";
const must = ["index.html", "goalsbyyear.html", "goalsbyseason.html", "dashboard.html",
  "timeline.html", "achievements.html", "birthday.html", "404.html", "sitemap.xml", "robots.txt", "llms.txt",
  "data/messi-data.json", "data/birthday-goals.json", "fonts/dm-sans-latin.woff2", "img/og-messi.jpg",
  "img/era-2008-olympic.jpg", "img/teams/barcelona.png", "favicon.svg"];
let ok = true;
for (const f of must) {
  if (!fs.existsSync(dist + "/" + f)) { ok = false; console.log("MISSING " + f); }
}
for (const p of ["index.html", "goalsbyyear.html", "goalsbyseason.html", "dashboard.html", "timeline.html", "achievements.html", "birthday.html"]) {
  const s = fs.readFileSync(dist + "/" + p, "utf8");
  if (!s.includes('class="skip"') || !s.includes('id="main"')) { ok = false; console.log("NO SKIP in " + p); }
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
const d = JSON.parse(fs.readFileSync(dist + "/data/messi-data.json", "utf8"));
const sum = (a) => a.reduce((x, r) => x + r.goals, 0);
console.log("dist sums:", sum(d.calendarYears), sum(d.byCompetition), sum(d.byBodyPart));
console.log(ok ? "ALL DIST CHECKS PASS" : "DIST CHECKS FAILED");
process.exit(ok ? 0 : 1);
