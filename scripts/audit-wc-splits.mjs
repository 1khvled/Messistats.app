/**
 * Rivalry splits audit (scripts/audit-wc-splits.mjs)
 *
 * The Sep-2026 miss: messi-data.json knew 21 World Cup goals while the
 * vs-Ronaldo comparison table still showed 13 across all 9 languages.
 * This audit fails loudly (non-zero exit, CI-blocking) whenever the built
 * comparison pages drift from public/data/messi-data.json `splits`.
 *
 * Checks:
 *  1. splits.worldCup.messi.goals === byCompetition FIFA World Cup goals
 *  2. splits.trophies.messi === team-title years in trophies array
 *  3. EN table rows equal splits (WC, assists, KO, KO assists,
 *     continental + tie, finals, trophies)
 *  4. All 9 locale pages carry the shared cells (21/11/12, 47/37, tie)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const fail = [];
const eq = (label, a, b) => {
  if (String(a) !== String(b)) fail.push(`${label}: expected ${b}, found ${a}`);
};

const md = JSON.parse(fs.readFileSync(path.join(root, "public", "data", "messi-data.json"), "utf8"));
const S = md.splits;
if (!S) { console.error("FAIL: messi-data.json has no splits block"); process.exit(1); }

// 1. WC goals cross-check vs competition split
const wcSplit = (Array.isArray(md.byCompetition) ? md.byCompetition : Object.values(md.byCompetition || {}))
  .find((c) => /fifa world cup/i.test(c.competition || ""));
eq("splits.worldCup.messi.goals vs byCompetition", S.worldCup.messi.goals, wcSplit?.goals);

// 2. trophies cross-check vs trophies array (team titles only)
const teamTitles = (md.trophies || []).filter((t) => t.team !== "Individual").reduce((n, t) => n + ((t.years || []).length), 0);
eq("splits.trophies.messi vs trophies array", S.trophies.messi, teamTitles);

// 3. EN table rows
const en = fs.readFileSync(path.join(root, "messi-vs-ronaldo.html"), "utf8");
const row = (labelRe) => {
  const m = en.match(new RegExp(`<tr>\\s*<td class="left"><b>${labelRe}</b></td>\\s*<td[^>]*>([\\s\\S]*?)</td>\\s*<td[^>]*>([\\s\\S]*?)</td>\\s*<td[^>]*>([\\s\\S]*?)</td>`, "i"));
  if (!m) { fail.push(`EN row not found: ${labelRe}`); return ["", "", ""]; }
  const txt = (h) => h.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  return [txt(m[1]), txt(m[2]), txt(m[3])];
};
{
  const [m, r, l] = row("World Cup Goals");
  eq("EN WC goals Messi", m, S.worldCup.messi.goals);
  eq("EN WC goals Ronaldo", r, S.worldCup.ronaldo.goals);
  eq("EN WC goals lead", l, `Messi (+${S.worldCup.messi.goals - S.worldCup.ronaldo.goals})`);
}
{
  const [m, r, l] = row("World Cup Assists");
  eq("EN WC assists Messi", m, S.worldCup.messi.assists);
  eq("EN WC assists Ronaldo", r, S.worldCup.ronaldo.assists);
  eq("EN WC assists lead", l, `Messi (+${S.worldCup.messi.assists - S.worldCup.ronaldo.assists})`);
}
{
  const [m, r] = row("World Cup Knockout Stage Goals");
  eq("EN KO goals Messi", m, `${S.worldCup.messi.koGoals} Goals`);
  eq("EN KO goals Ronaldo", r, `${S.worldCup.ronaldo.koGoals} Goal`);
}
{
  const [m, r] = row("World Cup Knockout Stage Assists");
  eq("EN KO assists Messi", m, `${S.worldCup.messi.koAssists} Assists`);
  eq("EN KO assists Ronaldo", r, `${S.worldCup.ronaldo.koAssists} Assists`);
}
{
  const [m, r, l] = row("Continental Championships");
  const lead = (s) => (s.match(/^\d+/) || [""])[0];
  eq("EN continental Messi", lead(m), S.continental.messi);
  eq("EN continental Ronaldo", lead(r), S.continental.ronaldo);
  if (!/Tie 3–3/.test(l)) fail.push(`EN continental leader not tied: ${l}`);
}
{
  const [m, r] = row("Goals Scored in Cup Finals");
  eq("EN finals Messi", m, `${S.finals.messi.goals} Goals in ${S.finals.messi.apps} Finals`);
  eq("EN finals Ronaldo", r, `${S.finals.ronaldo.goals} Goals in ${S.finals.ronaldo.apps} Finals`);
}
{
  const [m, r] = row("Total Team Trophies");
  eq("EN trophies Messi", m, S.trophies.messi);
  eq("EN trophies Ronaldo", r, S.trophies.ronaldo);
}

// 4. shared cells across all 9 locales (come from shared template code)
for (const rel of ["messi-vs-ronaldo.html", "es/messi-vs-ronaldo.html", "pt/messi-vs-ronaldo.html", "fr/messi-vs-ronaldo.html", "ar/messi-vs-ronaldo.html", "bn/messi-vs-ronaldo.html", "hi/messi-vs-ronaldo.html", "ro/messi-vs-ronaldo.html", "uz/messi-vs-ronaldo.html"]) {
  const h = fs.readFileSync(path.join(root, rel), "utf8");
  const need = [`>${S.worldCup.messi.goals}</b>`, `>${S.worldCup.ronaldo.goals}</td>`, `>${S.worldCup.messi.assists}</b>`, `>${S.trophies.messi}</b>`, `>${S.trophies.ronaldo}</td>`, "leader-badge-tie"];
  for (const nd of need) {
    if (!h.includes(nd)) fail.push(`${rel} missing shared cell ${nd}`);
  }
}

// ---- Phase 2: every leader badge must equal its row's cell difference ----
// (catches frozen badges like the old G+A +75: cells moved on, badge didn't)
{
  const rows = [...en.matchAll(/<tr>\s*<td class="left"><b>([^<]*)<\/b><\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/g)];
  const firstNum = (h) => {
    const t = h.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    const m = t.match(/-?[\d,]+\.?\d*/);
    return m ? parseFloat(m[0].replace(/,/g, "")) : NaN;
  };
  for (const r of rows) {
    const label = r[1].replace(/\s+/g, " ").trim();
    const mv = firstNum(r[2]);
    const rv = firstNum(r[3]);
    const badge = r[4].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (Number.isNaN(mv) || Number.isNaN(rv)) continue; // non-numeric row (titles, H2H splits)
    const dm = badge.match(/(Messi|Ronaldo) \(\+([\d.]+)([^)]*)\)/);
    if (dm) {
      const bv = parseFloat(dm[2]);
      const isPct = /%/.test(badge) || /%/.test(r[2]);
      const tol = isPct ? 0.06 : (Number.isInteger(bv) ? 0.51 : 0.011);
      if (Math.abs(Math.abs(mv - rv) - bv) > tol) fail.push(`EN badge drift [${label}]: badge +${bv} but cells ${mv} vs ${rv}`);
      continue;
    }
    const fewer = badge.match(/(\d+) fewer/);
    if (fewer && Math.abs(mv - rv) !== Number(fewer[1])) fail.push(`EN badge drift [${label}]: badge ${fewer[1]} fewer but cells ${mv} vs ${rv}`);
    const mins = badge.match(/\(([\d.]+)\s*min\)/);
    if (mins && Math.abs(Math.abs(mv - rv) - parseFloat(mins[1])) > 0.51) fail.push(`EN badge drift [${label}]: badge ${mins[1]} min but cells ${mv} vs ${rv}`);
  }
}

if (fail.length) {
  console.error(`[audit-wc-splits] FAIL (${fail.length}):\n- ${fail.join("\n- ")}`);
  process.exit(1);
}
console.log(`[audit-wc-splits] OK — 9 locales match splits (WC ${S.worldCup.messi.goals}/${S.worldCup.ronaldo.goals}, KO ${S.worldCup.messi.koGoals}/${S.worldCup.ronaldo.koGoals}, finals ${S.finals.messi.goals}/${S.finals.messi.apps}, trophies ${S.trophies.messi}/${S.trophies.ronaldo}).`);
