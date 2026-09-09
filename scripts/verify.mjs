/*
 * Free-only live check. No API keys, no paid endpoints.
 * Reads ESPN MLS scoreboard (usa.1) + openfootball worldcup.json,
 * writes public/data/last-check.json. NEVER overwrites messi-data.json totals.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, "public", "data", "last-check.json");

async function get(url, timeoutMs = 15000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { signal: ctl.signal, headers: { "User-Agent": "messi-stats-draft/0.1" } });
    if (!r.ok) return { ok: false, status: r.status, url };
    return { ok: true, status: r.status, url, data: await r.json() };
  } catch (e) {
    return { ok: false, error: String(e && e.message || e), url };
  } finally {
    clearTimeout(t);
  }
}

const espn = await get("https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/scoreboard");
let miami = null;
if (espn.ok) {
  const events = espn.data?.events ?? [];
  miami = events
    .filter((e) => JSON.stringify(e).includes("Miami"))
    .slice(0, 5)
    .map((e) => ({ id: e.id, date: e.date, name: e.name, status: e.status?.type?.description ?? null }));
}

const wc = await get("https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json");
let argentina = null;
if (wc.ok) {
  const matches = wc.data?.matches ?? [];
  argentina = matches
    .filter((m) => m.team1 === "Argentina" || m.team2 === "Argentina")
    .map((m) => ({ date: m.date, round: m.round, team1: m.team1, team2: m.team2, score: m.score ?? null }));
}

const report = {
  checkedAt: new Date().toISOString(),
  espnMls: { ok: espn.ok, status: espn.status ?? null, error: espn.error ?? null, miamiEvents: miami },
  worldcup2026: { ok: wc.ok, status: wc.status ?? null, error: wc.error ?? null, argentinaMatches: argentina },
  note: "Manual review only - copy nothing into messi-data.json without a primary source."
};

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(report, null, 2));
console.log("wrote " + out);
console.log("espn ok=" + espn.ok + " worldcup ok=" + wc.ok);