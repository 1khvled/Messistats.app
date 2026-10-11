#!/usr/bin/env node
/**
 * scripts/sync-totals-everywhere.mjs
 *
 * Global totals reconciler. The single source of truth is
 * public/data/messi-data.json (+ public/data/latest-goal.json for the
 * Inter Miami tally). This pass rewrites value-anchored stale numbers in
 * EVERY tracked locale .html (9 languages) so no page can drift behind a
 * new goal.
 *
 * It is deliberately conservative:
 *   - Every replacement is VALUE-ANCHORED: a known-stale literal is swapped
 *     for the ground-truth value. Nothing is rewritten speculatively.
 *   - Bare career numbers are guarded with a negative lookbehind so
 *     historical references (Goal #932, data-goal-id="932", Goal932.mp4,
 *     og-messi.jpg?v=932) and SVG/ad path fragments (1.633-.931, 6161) are
 *     never touched.
 *   - latest-goal.html pages are excluded from the bare-number pass because
 *     their bare numerals are historical (the recent-5 playlist/matrix).
 *   - Ronaldo's comparison baseline (980 goals / 1,339 apps) is preserved:
 *     only Messi's stale totals move.
 *
 * Usage:
 *   node scripts/sync-totals-everywhere.mjs           # write changes
 *   node scripts/sync-totals-everywhere.mjs --check   # report only, exit 1 if stale
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const isCheck = process.argv.includes("--check");
const isVerbose = process.argv.includes("--verbose");

const readJson = (p) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
const messi = readJson("public/data/messi-data.json");
const latest = readJson("public/data/latest-goal.json");

// ---- ground truth ----------------------------------------------------------
const goals = messi.totals.combined.goals;              // 934
const apps = messi.totals.combined.appearances;          // 1179
const club = messi.totals.club.goals;                    // 808
const ga = messi.totals.goalContributions.official;      // 1341
const trophies = messi.splits?.trophies?.messi ?? 47;
const ronaldoTrophies = messi.splits?.trophies?.ronaldo ?? 37;
const assists = messi.totals?.assists?.official ?? 407;
const miami = latest.totals?.miamiGoals ?? 104;

// Ronaldo comparison baseline — site-wide constant (see vs-ronaldo pages).
const RONALDO_GOALS = 980;
const RONALDO_APPS = 1339;

const gap = RONALDO_GOALS - goals;   // 46  (Ronaldo leads by …)
const fewer = RONALDO_APPS - apps;   // 160 (Messi played … fewer matches)
const road = 1000 - goals;           // 66  (… more goals to 1,000)

// ---- helpers ---------------------------------------------------------------
// 1179 → "1,179" / "1.179" / "1 179" / "1179" (4-digit safe)
const fmt = (n, sep) => {
  const s = String(n);
  return s.length > 3 ? s.slice(0, -3) + sep + s.slice(-3) : s;
};

// Literal escape — a rule payload like "1,339+" must NOT be compiled with "+"
// as a quantifier (that would match Ronaldo's bare "1,339" appearance count).
const escRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Latin digits -> Bengali digits (bn pages render numerals in Bengali).
const bnD = (s) => String(s).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

// Guard for bare numerals: not part of a longer number, not an id/version/href,
// not inside a path fragment. Keeps Goal932 / #932 / id="932" / ?v=932 / .931 intact.
const bare = (n) => new RegExp(`(?<![\\dA-Za-z"#=.-])${escRe(n)}(?!\\d)`, "g");
// Same guard for Bengali-digit numerals (৯৩২টি, ১,১৭৮ ম্যাচে). \d does not
// cover Bengali digits, so the class lists them explicitly.
const bareBn = (bn) => new RegExp(`(?<![০-৯\\dA-Za-z"#=.-])${escRe(bn)}(?![০-৯\\d])`, "g");
// Guarded + requires a locale word for "goals" (so "47 trophies" is untouched).
const gapNum = (n) =>
  new RegExp(
    `(?<!\\d)${n}(?=\\s+(?:de\\s+)?(?:goals?\\b|goles\\b|gols\\b|buts?\\b|goluri\\b|ta gol\\b|gole\\b|gól\\b|গোল|هدفا|هدفاً|गोल))`,
    "g"
  );
const plusGap = (n) => new RegExp(`\\+(\\s*)${n}(?!\\d)`, "g");
// "161 fewer matches" and its translations. Requires a LESS-word nearby so that
// unrelated records like "129 goals in 163 matches" (Champions League) are safe.
// Also skips 6161, 1.161, 161251, 161/invoke via the digit/dot guards.
// NOTE: puțin has NO trailing \b — Romanian inflects to puține/puțini.
const fewerNum = (n) =>
  new RegExp(
    `(?<![\\d.])${n}(?![\\d.])(?=[^\\d]{0,22}(?:fewer\\b|menos\\b|moins\\b|puțin|kam\\b|أقل|কম|कम))`,
    "g"
  );
// Bengali mirror of fewerNum (১৬১ ম্যাচ কম).
const fewerBn = (bn) =>
  new RegExp(`(?<![০-৯\\d.])(?:${bn})(?![০-৯\\d.])(?=[^০-৯\\d]{0,22}কম)`, "g");
// Trophy words across locales (lookahead-only; never consumed).
const trophyWord = String.raw`(?:senior\s+team\s+title|team\s+title|troph(?:y|ies|ées?)|t[ií]tulos?|titres?|trof\w*|sovrin\w*|titluri|بطول|لقب|ألقاب|ट्रॉफ|खिताब|ট্রফি|খেতাব)`;

/** Build the ordered rule list. Each rule: {re, to, kind} */
const rules = [];
const push = (re, to, kind) => rules.push({ re, to, kind });

// 1) Career goals: every number just below current → current (bare, guarded).
//    Narrow window (6) — enough to catch accumulated drift without sweeping
//    older numerals that may appear in unrelated contexts.
for (let n = goals - 6; n < goals; n++) push(bare(n), String(goals), "goals");

// 2) Club goals: two predecessors → current (bare, guarded).
for (let n = club - 2; n < club; n++) push(bare(n), String(club), "club");

// 3) Appearances in every separator format, format-preserving.
for (const sep of [",", ".", " ", ""]) {
  for (let n = apps - 2; n < apps; n++) {
    push(bare(fmt(n, sep)), fmt(apps, sep), "apps");
  }
}
// French/Uzbek may use NBSP/space variants of the space separator.
for (const sp of ["\u00A0", "\u202F"]) {
  for (let n = apps - 2; n < apps; n++) {
    push(new RegExp(`1${sp}${String(n).slice(-3)}(?!\\d)`, "g"), `1${sp}${String(apps).slice(-3)}`, "apps-nb");
  }
}

// 4) Goal contributions — ONLY when followed by "+" (bare "1,339" is Ronaldo's apps).
for (let n = ga - 2; n < ga; n++) {
  for (const sep of [",", ".", " "]) push(bare(`${fmt(n, sep)}+`), `${fmt(ga, sep)}+`, "g+a");
}

// 5) Ronaldo gap: "48 goals" / "49 buts" / "+48" badges (goal counts only).
for (let n = gap + 3; n > gap; n--) {
  push(gapNum(n), String(gap), "gap");
  push(plusGap(n), `+$1${gap}`, "gap-badge");
}

// 6) Matches-fewer: "161 fewer matches" and translations.
for (let n = fewer + 3; n >= fewer; n--) push(fewerNum(n), String(fewer), "fewer");

// 7) Road to 1,000: "68 more goals".
for (let n = road + 4; n >= road; n--)
  push(new RegExp(`(?<!\\d)${n}(?=\\s+more\\s+goals)`, "g"), String(road), "road");

// 8) Trophies (Messi): stale predecessors anchored to trophy words, pills,
//    KPI/milestone spans and timeline vals. Window is [T-2, T) — 45/46 era
//    leftovers only; already-correct 47s are never touched. (Ronaldo's 37 is
//    current per the verified ledger; only the Arabic "مقابل 35" phrasing and
//    the vs-ronaldo table row needed a rule.)
for (let n = trophies - 2; n < trophies; n++) {
  push(new RegExp(`(?<!\\d)${n}(?=\\s+${trophyWord})`, "g"), String(trophies), "trophies-words");
  push(
    new RegExp(
      `(?<!\\d)${n}(?=\\s*\\((?:World Record|Récord Mundial|Record Mondial|Recorde Mundial|Jahon rekordi|विश्व रिकॉर्ड|رقم قياسي عالمي))`,
      "g"
    ),
    String(trophies),
    "trophies-pill"
  );
  push(new RegExp(`(?<!\\d)${n}(?=\\s+مقابل)`, "g"), String(trophies), "trophies-ar");
}
for (let n = trophies - 2; n < trophies; n++)
  push(new RegExp(`(?<!\\d)${n}(?=\\s+team\\s+trophies)`, "g"), String(trophies), "trophies");
for (let n = ronaldoTrophies; n > ronaldoTrophies - 4; n--)
  push(new RegExp(`(?<=trophies\\s+to\\s+)${n}(?!\\d)`, "g"), String(ronaldoTrophies), "ronaldo-trophies");
push(/(?<=مقابل\s+)(35|36|38)(?!\d)/g, String(ronaldoTrophies), "ronaldo-ar");
// vs-ronaldo comparison table row (identical markup, all 9 locales):
// <b style="...">47</b></td> <td>37</td> — both cells reconciled atomically.
push(
  /(<b style="color:var\(--accent\);">)(4[56])(<\/b><\/td>\s*<td>)(3[568])(<\/td>)/g,
  `$1${trophies}$3${ronaldoTrophies}$5`,
  "trophies-row"
);
// KPI / milestone / timeline-vals holding a stale trophy count.
push(/(kpi-num">|milestone-val tnum">)(4[56])(<)/g, `$147$3`, "trophies-kpi");
push(/(class="val">)(4[56])(<\/div><div class="lbl">)/g, `$1${trophies}$3`, "trophies-kpi");
// Hindi trophy phrasing with an adjective between number and noun.
for (let n = trophies - 2; n < trophies; n++)
  push(new RegExp(`(?<!\\d)${n}(?=\\s+आधिकारिक\\s+(?:टीम\\s+)?ट्रॉफियां)`, "g"), String(trophies), "trophies-hi");
// Bengali trophy pill in native digits: ৪৬ (বিশ্ব রেকর্ড) → ৪৭.
push(/(৪[৫৬])(?=\s*\(বিশ্ব রেকর্ড\))/g, bnD(trophies), "trophies-pill-bn");

// 8b) Bengali-digit mirrors (bn renders numerals natively). Goals/club/apps
//     skip latest-goal.html (historical playlist); the rest apply everywhere.
for (let n = goals - 6; n < goals; n++) push(bareBn(bnD(n)), bnD(goals), "goals-bn");
for (let n = club - 2; n < club; n++) push(bareBn(bnD(n)), bnD(club), "club-bn");
for (let n = apps - 2; n < apps; n++) push(bareBn(bnD(fmt(n, ","))), bnD(fmt(apps, ",")), "apps-bn");
for (let n = gap + 3; n > gap; n--) {
  push(new RegExp(`(?<![০-৯\\d])${bnD(n)}(?=\\s+গোল)`, "g"), bnD(gap), "gap-bn");
  push(new RegExp(`(\\+)${bnD(n)}(?=\\s*গোল)`, "g"), `$1${bnD(gap)}`, "gap-badge-bn");
}
for (let n = fewer; n <= fewer + 3; n++) push(fewerBn(`${bnD(n)}`), bnD(fewer), "fewer-bn");
// Inter Miami tally in native digits: ১০২টি অফিশিয়াল গোল → ১০৪.
for (let n = miami - 3; n < miami; n++)
  push(new RegExp(`(?<![০-৯\\d])${bnD(n)}(?=টি অফিশিয়াল গোল)`, "g"), bnD(miami), "miami-bn");
// Stale assist total in native digits: ৪০৫+ / ৪০৫টিরও → current (349+58).
push(/(?<![০-৯\d])৪০৫(?=\+|টিরও)/g, bnD(assists), "assists-bn");

// 8c) Ronaldo scoring-rate ratio: stale 0.72 (924/1,280 era) → 0.73
//     (980/1,339). CSS guards keep font-size/opacity literals intact.
push(/(?<![\d.])(0\.72)(?!\s*(?:rem|em|px|%))(?!\d)/g, "0.73", "gpg");
push(/(?<![\d,])0,72(?!\d)/g, "0,73", "gpg-comma");
push(/(?<![০-৯\d.])০\.৭২(?![০-৯\d])/g, "০.৭৩", "gpg-bn");
// Bengali Ronaldo snapshot on bn/index: ১,২৮০ ম্যাচে ৯২৪ গোল → current.
push(/(?<![০-৯\d])১,২৮০(?=\s+ম্যাচে)/g, "১,৩৩৯", "ronaldo-bn");
push(/(?<![০-৯\d])৯২৪(?=\s+গোল)/g, "৯৮০", "ronaldo-bn");

// 8d) Inter Miami appearances prose: 117 (pre-D.C. game) → 118.
push(/(?<!\d)117(?=\s+appearances)/g, "118", "miami-apps");

// 9) Inter Miami tally: "102 goals and 46 assists".
for (let n = miami - 3; n < miami; n++)
  push(new RegExp(`(?<!\\d)${n}(?=\\s+goals\\s+and\\s+46\\s+assists)`, "g"), String(miami), "miami");

// 10) OG image cache-buster (aligned to current goal count).
for (let n = goals - 6; n < goals; n++)
  push(new RegExp(`(og-messi\\.jpg\\?v=)${n}(?!\\d)`, "g"), `$1${goals}`, "og-cache");

// ---- run over every tracked .html -----------------------------------------
const files = execSync("git ls-files", { cwd: root })
  .toString("utf8")
  .split("\n")
  .filter((f) => f.endsWith(".html"));

let changedFiles = 0;
const report = new Map(); // kind → count
const samples = new Map(); // kind → sample contexts (for --verbose review)

for (const rel of files) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) continue;
  const isLatestGoal = /(^|[\\/])latest-goal\.html$/.test(rel);
  let src = fs.readFileSync(abs, "utf8");
  let out = src;

  for (const { re, to, kind } of rules) {
    // latest-goal.html keeps its historical bare numerals (playlist/matrix).
    if (isLatestGoal && ["goals", "club", "apps", "g+a", "goals-bn", "club-bn", "apps-bn"].includes(kind)) continue;
    re.lastIndex = 0;
    const m = out.match(re);
    if (!m) continue;
    report.set(kind, (report.get(kind) || 0) + m.length);
    if (isVerbose && (samples.get(kind)?.length ?? 0) < 6) {
      re.lastIndex = 0;
      const one = re.exec(out);
      if (one) {
        const i = one.index;
        const ctx = out.slice(Math.max(0, i - 55), i + one[0].length + 40).replace(/\s+/g, " ");
        if (!samples.has(kind)) samples.set(kind, []);
        samples.get(kind).push(`${rel}: …${ctx}…`);
      }
    }
    re.lastIndex = 0;
    out = out.replace(re, to);
  }

  if (out !== src) {
    changedFiles++;
    if (!isCheck) fs.writeFileSync(abs, out, "utf8");
    console.log(`  ${isCheck ? "[stale]" : "[fixed]"} ${rel}`);
  }
}

console.log(`\nGround truth: goals=${goals} apps=${apps} club=${club} g+a=${ga} miami=${miami}`);
console.log(`Derived: gap=${gap} fewer=${fewer} road=${road} trophies=${trophies}/${ronaldoTrophies}`);
if (report.size) {
  console.log("Replacements by kind:");
  for (const [k, v] of [...report.entries()].sort()) console.log(`  ${k.padEnd(16)} ${v}`);
}
if (isVerbose && samples.size) {
  console.log("\nSample matches per kind (review before trusting):");
  for (const [k, list] of [...samples.entries()].sort()) {
    for (const s of list) console.log(`  [${k}] ${s}`);
  }
}
console.log(changedFiles ? `${changedFiles} file(s) ${isCheck ? "still stale" : "updated"}.` : "All pages already match ground truth.");

if (isCheck && changedFiles) process.exit(1);
