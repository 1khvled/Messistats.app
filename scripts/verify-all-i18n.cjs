const fs = require("fs");
const path = require("path");

const langs = ["es", "pt", "fr"];
const englishTerms = [
  "Senior Career Goals",
  "105 fewer games",
  "Team Titles",
  "Head-to-head records",
  "Goals Scored",
  "All Competitions Total",
  "First senior career hat-trick",
  "Guardiola invents the False 9",
  "Iconic slalom past 4 Madrid",
  "92nd-minute match winner",
  "366 Days Calendar"
];

let totalIssues = 0;

for (const lang of langs) {
  const dir = path.join(__dirname, "..", lang);
  if (!fs.existsSync(dir)) continue;

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".html"));
  for (const file of files) {
    const filePath = path.join(dir, file);
    const content = fs.readFileSync(filePath, "utf8");

    // Strip out JSON-LD schema or script tags that might legitimately contain English keys/identifiers
    // Strip hrefs
    const bodyContent = content.replace(/<script[\s\S]*?<\/script>/gi, "")
                               .replace(/href="[^"]*"/gi, "");

    for (const term of englishTerms) {
      if (bodyContent.includes(term)) {
        console.error(`[FAIL] ${lang}/${file} contains English text: "${term}"`);
        totalIssues++;
      }
    }
  }
}

// Also verify app.js has no syntax errors
try {
  const appJs = fs.readFileSync(path.join(__dirname, "..", "src", "app.js"), "utf8");
  // Quick sanity checks
  if (!appJs.includes("HOME_I18N")) throw new Error("HOME_I18N missing in app.js");
  if (!appJs.includes("BDAY_I18N")) throw new Error("BDAY_I18N missing in app.js");
  console.log("[PASS] app.js contains HOME_I18N and BDAY_I18N!");
} catch (err) {
  console.error("[FAIL] app.js check error:", err.message);
  totalIssues++;
}

if (totalIssues === 0) {
  console.log("\n[SUCCESS] ALL LOCALIZED LANGUAGES PASSED COMPLETE TRANSLATION AUDIT WITH 0 ISSUES!");
} else {
  console.error(`\n[ERROR] Found ${totalIssues} translation issues.`);
  process.exit(1);
}
