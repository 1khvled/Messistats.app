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

import { S } from "./stats.mjs";

// ---- ground truth: every variable comes from the central registry ---------
// (scripts/stats.mjs reads the JSON database + derives gap/fewer/road).
const goals = S.goals;                                 // 934
const apps = S.apps;                                   // 1179
const club = S.clubGoals;                              // 808
const ga = S.ga;                                       // 1341
const trophies = S.trophies;                           // 47
const ronaldoTrophies = S.rTrophies;                   // 37
const assists = S.assists;                             // 408
const tmAssists = S.tmAssists;                         // 450
const miami = S.miamiGoals;                            // 104
const miamiApps = S.miamiApps;                         // 119
const miamiAssists = S.assistsByTeam?.inter_miami?.official ?? 47;
const miamiTM = S.assistsByTeam?.inter_miami?.transfermarkt ?? 52;
const rGa = S.rGa;                                     // 1242 (Ronaldo G+A)
const astLead = S.astLead;                             // 147
const npg = S.npg;                                     // 824
const npgR = S.npgR;                                   // 797
const npgLead = S.npgLead;                             // 27
const gaDiff = S.ga - S.rGa;                           // 100 (G+A badge)
const tmGa = S.tmGa;                                   // 1384
const rateGA = (S.ga / S.apps).toFixed(2);             // 1.14
const rateGAComma = rateGA.replace(".", ",");
const ratioMiami = (S.miamiGoals / S.miamiApps).toFixed(2); // 0.87
const ratioMiamiComma = ratioMiami.replace(".", ",");

// Ronaldo comparison baseline — site-wide constant (see vs-ronaldo pages).
const RONALDO_GOALS = S.rGoals;
const RONALDO_APPS = S.rApps;

const gap = S.gap;        // 46  (Ronaldo leads by …)
const fewer = S.fewer;    // 160 (Messi played … fewer matches)
const road = S.road;      // 66  (… more goals to 1,000)

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
  for (let n = apps - 3; n < apps; n++) {
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
for (let n = ga - 3; n < ga; n++) {
  for (const sep of [",", ".", " "]) push(bare(`${fmt(n, sep)}+`), `${fmt(ga, sep)}+`, "g+a");
}

// 5) Ronaldo gap: "48 goals" / "49 buts" / "+48" badges (goal counts only).
// Bidirectional window: the gap moves both ways (46 <-> 47), so the previous
// value goes stale the same way a predecessor does.
for (let n = gap + 3; n >= gap - 2; n--) {
  push(gapNum(n), String(gap), "gap");
  push(plusGap(n), `+$1${gap}`, "gap-badge");
}

// 6) Matches-fewer: "161 fewer matches" and translations.
for (let n = fewer + 3; n >= fewer - 2; n--) push(fewerNum(n), String(fewer), "fewer");

// 7) Road to 1,000: "68 more goals".
for (let n = road + 4; n >= road; n--)
  push(new RegExp(`(?<!\\d)${n}(?=\\s+more\\s+goals)`, "g"), String(road), "road");

// 8) Trophies (Messi): stale predecessors anchored to trophy words, pills,
//    KPI/milestone spans and timeline vals. Window is [T-2, T) — 45/46 era
//    leftovers only; already-correct 47s are never touched. (Ronaldo's 37 is
//    current per the verified ledger; only the Arabic "مقابل 35" phrasing and
//    the vs-ronaldo table row needed a rule.)
for (let n = trophies - 3; n < trophies; n++) {
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
for (let n = trophies - 3; n < trophies; n++)
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
for (let n = trophies - 3; n < trophies; n++)
  push(new RegExp(`(?<!\\d)${n}(?=\\s+आधिकारिक\\s+(?:टीम\\s+)?ट्रॉफियां)`, "g"), String(trophies), "trophies-hi");
// Bengali trophy pill in native digits: ৪৬ (বিশ্ব রেকর্ড) → ৪৭.
push(/(৪[৪-৬])(?=\s*\(বিশ্ব রেকর্ড\))/g, bnD(trophies), "trophies-pill-bn");

// 8b) Bengali-digit mirrors (bn renders numerals natively). Goals/club/apps
//     skip latest-goal.html (historical playlist); the rest apply everywhere.
for (let n = goals - 6; n < goals; n++) push(bareBn(bnD(n)), bnD(goals), "goals-bn");
for (let n = club - 2; n < club; n++) push(bareBn(bnD(n)), bnD(club), "club-bn");
for (let n = apps - 3; n < apps; n++) push(bareBn(bnD(fmt(n, ","))), bnD(fmt(apps, ",")), "apps-bn");
for (let n = gap + 3; n >= gap - 2; n--) {
  push(new RegExp(`(?<![০-৯\\d])${bnD(n)}(?=\\s+গোল)`, "g"), bnD(gap), "gap-bn");
  push(new RegExp(`(\\+)${bnD(n)}(?=\\s*গোল)`, "g"), `$1${bnD(gap)}`, "gap-badge-bn");
}
for (let n = fewer - 2; n <= fewer + 3; n++) push(fewerBn(`${bnD(n)}`), bnD(fewer), "fewer-bn");
// Inter Miami tally in native digits: ১০২টি অফিশিয়াল গোল → ১০৪.
for (let n = miami - 3; n < miami; n++)
  push(new RegExp(`(?<![০-৯\\d])${bnD(n)}(?=টি অফিশিয়াল গোল)`, "g"), bnD(miami), "miami-bn");
// Stale assist total in native digits (৪০৫+/৪০৫টিরও era) → current.
for (let n = assists - 3; n < assists; n++)
  push(new RegExp(`(?<![০-৯\\d])${bnD(n)}(?=\\+|টি)`, "g"), bnD(assists), "assists-bn");

// 8c) Ronaldo scoring-rate ratio → S.rGpg. Predecessors are the literal
//     {x.72, x.73} forms ONLY — x.70/x.71 are legitimate NPG rates elsewhere
//     (0.70 non-penalty/game) and must never move. CSS guards keep
//     font-size/opacity literals intact.
{
  const rDot = S.rGpg.toFixed(2);
  const rComma = rDot.replace(".", ",");
  const rBn = bnD(rDot);
  for (const oldV of ["0.72", "0.73"]) {
    if (oldV === rDot) continue;
    push(new RegExp(`(?<![\\d.])${escRe(oldV)}(?!\\s*(?:rem|em|px|%))(?!\\d)`, "g"), rDot, "gpg");
  }
  for (const oldV of ["0,72", "0,73"]) {
    if (oldV === rComma) continue;
    push(new RegExp(`(?<![\\d,])${escRe(oldV)}(?!\\d)`, "g"), rComma, "gpg-comma");
  }
  for (const oldV of ["০.৭২", "০.৭৩"]) {
    if (oldV === rBn) continue;
    push(new RegExp(`(?<![০-৯\\d.])${oldV}(?![০-৯\\d])`, "g"), rBn, "gpg-bn");
  }
}
// Bengali Ronaldo snapshot on bn/index → current (S-driven, windowed).
for (let n = S.rApps - 3; n < S.rApps; n++)
  push(new RegExp(`(?<![০-৯\\d])${bnD(fmt(n, ","))}(?=\\s+ম্যাচে)`, "g"), bnD(fmt(S.rApps, ",")), "ronaldo-bn");
for (let n = S.rGoals - 3; n < S.rGoals; n++)
  push(new RegExp(`(?<![০-৯\\d])${bnD(n)}(?=\\s*(?:গোল|টি|বনাম))`, "g"), bnD(S.rGoals), "ronaldo-bn");

// 8d) Inter Miami appearances prose → S.miamiApps (moves with every game).
for (let n = miamiApps - 3; n < miamiApps; n++)
  push(new RegExp(`(?<!\\d)${n}(?=\\s+appearances)`, "g"), String(miamiApps), "miami-apps");

// 9) Inter Miami tally: "102 goals and 46 assists".
for (let n = miami - 3; n < miami; n++)
  push(new RegExp(`(?<!\\d)${n}(?=\\s+goals\\s+and\\s+46\\s+assists)`, "g"), String(miami), "miami");

// 8e) Assists (Messi official): predecessors → current, anchored to the
//     noun so bare 407s nowhere else can move. Plus-forms ("407+") are
//     assists-only (G+A uses 1,3xx+ magnitudes — disjoint).
for (let n = assists - 3; n < assists; n++) {
  push(new RegExp(`(?<!\\d)${n}(?=\\s+(?:official\\s+)?assists\\b)`, "g"), String(assists), "assists");
  push(new RegExp(`(?<!\\d)${n}(?=\\+)`, "g"), String(assists), "assists-plus");
}
for (let n = assists - 3; n < assists; n++)
  push(new RegExp(`(?<![০-৯\\d])${bnD(n)}(?=\\+|টি)`, "g"), bnD(assists), "assists-bn");
// Transfermarkt assists: 449-era leftovers → current.
for (let n = tmAssists - 2; n < tmAssists; n++) {
  push(new RegExp(`(?<!\\d)${n}(?=\\s+assists)`, "g"), String(tmAssists), "tm-assists");
  push(new RegExp(`(?<!\\d)${n}(?=\\s*(?:TM\\b|Transfermarkt|under Transfermarkt))`, "g"), String(tmAssists), "tm-assists");
}
// Official/TM table pairs. Career row is 40x/44x ("407 / 449"); the Miami
// row is 4x/5x ("46 / 51") — disjoint magnitudes, separate windows.
for (let n = assists - 3; n < assists; n++) {
  for (let m = tmAssists - 2; m < tmAssists; m++) {
    push(new RegExp(`(?<!\\d)${n}(\\s*\\/\\s*)${m}(?!\\d)`, "g"), `${assists}$1${tmAssists}`, "tm-pair");
  }
}
for (let n = miamiAssists - 3; n < miamiAssists; n++) {
  for (let m = miamiTM - 2; m < miamiTM; m++) {
    push(new RegExp(`(?<!\\d)${n}(\\s*\\/\\s*)${m}(?!\\d)`, "g"), `${miamiAssists}$1${miamiTM}`, "tm-pair");
  }
}
// 8f) Ronaldo side (moves too — ronaldo.json is ground truth via S).
// Goals: goal-word anchored + ordinal-safe (trailing lookahead excludes
// letters, so "980th"-style ordinals can never match).
for (let n = S.rGoals - 3; n < S.rGoals; n++)
  push(new RegExp(`(?<!\\d)${n}(?=\\s+(?:de\\s+)?(?:goals?\\b|goles\\b|gols\\b|buts?\\b|goluri\\b|ta gol\\b|gole\\b|gól\\b|গোল|هدفا|هدفاً|गोल))(?![\\dA-Za-z])`, "g"), String(S.rGoals), "rgoals");
// Appearances: full separator mirror of rule 3. Disjoint from Messi G+A:
// that rule needs "+", this one forbids it (bare "1,339" was verified to be
// Ronaldo's apps; bare "1,341" never occurs).
for (const sep of [",", ".", " ", ""]) {
  for (let n = S.rApps - 3; n < S.rApps; n++) {
    push(bare(fmt(n, sep)), fmt(S.rApps, sep), "rapps");
  }
}
for (const sp of ["\u00A0", "\u202F"]) {
  for (let n = S.rApps - 3; n < S.rApps; n++) {
    push(new RegExp(`1${sp}${String(n).slice(-3)}(?!\\d)`, "g"), `1${sp}${String(S.rApps).slice(-3)}`, "rapps-nb");
  }
}
for (let n = S.rApps - 3; n < S.rApps; n++)
  push(bareBn(bnD(fmt(n, ","))), bnD(fmt(S.rApps, ",")), "rapps-bn");
// 8g) Leader badges: unit tells them apart — bare (+98) is G+A,
// (+26 NPG) is non-penalty, (+146 assists) is the playmaker lead.
{
  const gaDiff = S.ga - S.rGa;
  for (let n = gaDiff - 8; n < gaDiff; n++)
    push(new RegExp(`Messi \\(\\+${n}\\)`, "g"), `Messi (+${gaDiff})`, "ga-badge");
  for (let n = S.npgLead - 3; n < S.npgLead; n++)
    push(new RegExp(`Messi \\(\\+${n} NPG\\)`, "g"), `Messi (+${S.npgLead} NPG)`, "npg-badge");
  {
    // (+146 assists) style badges, all locales (name + number + unit).
    const aPrev = [S.astLead - 3, S.astLead - 2, S.astLead - 1].join("|");
    push(
      new RegExp(`((?:Messi|ميسي)) \\(\\+(?:${aPrev})(\\s+[^)]*)\\)`, "g"),
      `$1 (+${S.astLead}$2)`,
      "ast-badge"
    );
    const aPrevBn = [S.astLead - 3, S.astLead - 2, S.astLead - 1].map(bnD).join("|");
    push(new RegExp(`(মেসি) \\(\\+(?:${aPrevBn})([^)]*)\\)`, "g"), `$1 (+${bnD(S.astLead)}$2)`, "ast-badge-bn");
  }
}
// 8h) Assists-lead prose (146-era → current).
{
  const aLead = String(S.astLead);
  const aPrev = [S.astLead - 2, S.astLead - 1].join("|");
  push(new RegExp(`(?<!\\d)(?:${aPrev})(?=\\s+(?:more\\s+)?(?:assists?|asistencias|assistências|passes?)\\b)`, "g"), aLead, "ast-lead");
  push(new RegExp(`(?<!\\d)(?:${aPrev})(?=\\s+(?:de\\s+(?:pase|assist)|ta\\s+assist|dan\\s+ortiq|تمريرة|असिस्ट|से\\s+अधिक))`, "g"), aLead, "ast-lead");
  push(new RegExp(`(?<![০-৯\\d])(?:${bnD(S.astLead - 2)}|${bnD(S.astLead - 1)})(?=টি)`, "g"), bnD(S.astLead), "ast-lead-bn");
}
// 8i) Non-penalty triple. Rationale (see stats.mjs): the pages' "822" was the
// 932-era value (932-110); both D.C. goals were open play → 824 now.
// Bare-magnitude rules (verified: these magnitudes occur only as NPG).
for (let n = S.npg - 4; n < S.npg; n++) push(bare(n), String(S.npg), "npg");
for (let n = S.npgR - 3; n < S.npgR; n++) push(bare(n), String(S.npgR), "npgr");
// NPG lead prose (26-era → current; EN uses the pair form, no literal).
{
  const nl = String(S.npgLead);
  const np = [S.npgLead - 3, S.npgLead - 2, S.npgLead - 1].join("|");
  const npgAfter = "(?:goles más sin penalti|buts hors penalty|gols sem pênalti|هدفاً أكثر بدون|अधिक नॉन-पेनल्टी|de goluri în plus fără|ta koʻproq penaltisiz)";
  push(new RegExp(`(?<!\\d)(?:${np})(?=\\s+${npgAfter})`, "g"), nl, "npg-lead");
  push(new RegExp(`(?<![০-৯\\d])(?:${[S.npgLead - 3, S.npgLead - 2, S.npgLead - 1].map(bnD).join("|")})(?=\\s+গোল বেশি)`, "g"), bnD(S.npgLead), "npg-lead-bn");
}
// 8j) G+A rate (es/fr/pt/ro/uz "1,12" era) + Miami-row ratio, both computed.
{
  push(/(?<!\d)1([.,])1[12](?!\d)/g, (m, sep) => (sep === "," ? rateGAComma : rateGA), "ga-rate");
  const rDot = ratioMiami, rComma = ratioMiamiComma;
  push(new RegExp(`(<td>11[89]<\\/td>\\s*<td><strong>104<\\/strong><\\/td>\\s*<td>[^<]*?<\\/td>\\s*<td>)0([.,])8[78](<\\/td>)`, "g"),
    (m, a, sep, c) => `${a}${sep === "," ? ratioMiamiComma : ratioMiami}${c}`, "miami-ratio");
}
// 8k) Messi G+A bare form (table cells carry "+", this is the JSON-LD prose:
// "1,341 official [career] goal contributions").
for (let n = ga - 2; n < ga; n++)
  push(new RegExp(`(?<!\\d)${fmt(n, ",")}(?=\\s+official(?: career)? goal contributions)`, "g"), fmt(ga, ","), "ga-bare");
// Ronaldo G+A cell (bare/comma/dot/space forms; never carries "+").
for (let n = S.rGa - 3; n < S.rGa; n++) {
  for (const sep of [",", ".", " ", ""]) push(bare(fmt(n, sep)), fmt(S.rGa, sep), "rga");
}
for (const sp of ["\u00A0", "\u202F"]) {
  for (let n = S.rGa - 3; n < S.rGa; n++) {
    push(new RegExp(`1${sp}${String(n).slice(-3)}(?!\\d)`, "g"), `1${sp}${String(S.rGa).slice(-3)}`, "rga-nb");
  }
}
// Transfermarkt G+A total ("1,377" was stale even before: 934+449=1383).
for (let n = tmGa - 7; n < tmGa; n++)
  push(bare(fmt(n, ",")), fmt(tmGa, ","), "tm-ga");
// Miami G+A cell (goals + official assists, computed — was frozen at 150).
push(
  new RegExp(
    `(<td>11[89]<\\/td>\\s*<td><strong>104<\\/strong><\\/td>\\s*<td>[^<]*?<\\/td>\\s*<td><strong>)15[01](<\\/strong>)`,
    "g"
  ),
  `$1${miami + miamiAssists}$2`,
  "miami-ga"
);
// Miami-row cells in the various table structures (career tables show TM
// assists alone as "51"; the index summary row shows bare triples).
// All computed from S so they track every game.
push(
  new RegExp(
    `(<td><strong>104<\\/strong><\\/td>\\s*<td>)5[012](<\\/td>)`,
    "g"
  ),
  `$1${miamiTM}$2`,
  "miami-tm"
);
push(
  new RegExp(`(<td><strong>15[01]<\\/strong><\\/td>\\s*<td>)0([.,])8[78](<\\/td>)`, "g"),
  (m, a, sep, c) => `${a}${sep === "," ? ratioMiamiComma : ratioMiami}${c}`,
  "miami-ratio"
);
push(new RegExp(`(<td>104<\\/td>\\s*<td>)4[678](<\\/td>)`, "g"), `$1${miamiAssists}$2`, "miami");
push(
  new RegExp(`(<td>104<\\/td>\\s*<td>\\d+<\\/td>\\s*<td>)0([.,])8[78](<\\/td>)`, "g"),
  (m, a, sep, c) => `${a}${sep === "," ? ratioMiamiComma : ratioMiami}${c}`,
  "miami-ratio"
);
push(new RegExp(`(<td>)11[78](<\\/td>\\s*<td>104<\\/td>)`, "g"), `$1${miamiApps}$2`, "miami-apps");
// Miami goals+assists prose + official/TM table pair.
push(new RegExp(`(?<!\\d)10[1-4](?=\\s+goals\\s+and\\s+\\d+\\s+assists)`, "g"), String(miami), "miami");
push(new RegExp(`(\\d+\\s+goals\\s+and\\s+)4[678](\\s+assists)`, "g"), `$1${miamiAssists}$2`, "miami");
push(new RegExp(`(?<!\\d)4[678](\\s*\\/\\s*)5[12](?!\\d)`, "g"), `${miamiAssists}$1${miamiTM}`, "miami");

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
