// Prebuild gate: fail `npm run build` on broken data or missing caveats.
// Reads public/data/messi-data.json + src/app.js only. Never writes.
// Checks:
//   1. calendarYears / byCompetition / byBodyPart each sum to the same total
//      as totals.combined.goals (iron rule — no hardcoded 927, so the gate
//      survives a legitimate hand-bumped total).
//   2. Provisional caveat strings still ship next to the finish/body splits
//      (guards against an edit that drops the "provisional until hand count"
//      wording the data model requires).
// Exit 0 = safe to build. Exit 1 = fix by hand, then rebuild.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fail = (m) => { console.error("prebuild-check FAIL: " + m); process.exit(1); };

let d;
try {
  d = JSON.parse(readFileSync(resolve(root, "public", "data", "messi-data.json"), "utf8"));
} catch (e) { fail("messi-data.json unreadable: " + e.message); }

const total = d?.totals?.combined?.goals;
if (typeof total !== "number" || total <= 0) fail("totals.combined.goals missing/not a number");

const sum = (arr) => arr.reduce((a, r) => a + (r.goals || 0), 0);
const s1 = sum(d.calendarYears || []);
const s2 = sum(d.byCompetition || []);
const s3 = sum(d.byBodyPart || []);
console.log(`sums: calendarYears=${s1} byCompetition=${s2} byBodyPart=${s3} totals.combined.goals=${total}`);
if (s1 !== total || s2 !== total || s3 !== total)
  fail(`checksum broke (${s1}/${s2}/${s3} vs ${total}) — hand-fix messi-data.json before building.`);

let app;
try {
  app = readFileSync(resolve(root, "src", "app.js"), "utf8");
} catch (e) { fail("src/app.js unreadable: " + e.message); }

// The data model requires provisional splits to ship with the caveat in UI copy.
const caveats = ["provisional until", "hand count"];
for (const c of caveats) {
  if (!app.toLowerCase().includes(c)) fail(`src/app.js lost the "${c}" caveat wording.`);
}
// Finish + body-part tables must still render their caveat paragraphs.
if (!/finish-table[\s\S]{0,2000}provisional/i.test(app) && !/provisional compiled tally/i.test(app))
  fail("finish/body-part provisional caveat paragraph missing from src/app.js.");

console.log("prebuild-check ok.");
