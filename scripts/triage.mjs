// Triage helper for public/data/pending.json — READ the queue, don't guess it.
// Default prints a grouped summary (one line per row family + newest note).
// --prune collapses legacy per-hash article duplicates (watch:article:<slug>:<hash>
// from before the source-watch upsert) to one stable row per slug, expires rows
// older than 90 days, and caps needs_review at 100 (oldest non-internal first).
// NEVER touches messi-data.json. Internal self-check rows (watch:internal:*)
// are exempt from expiry and capping.
// Usage:
//   node scripts/triage.mjs           grouped summary (changes nothing)
//   node scripts/triage.mjs --prune   collapse + expire + cap, then rewrite file
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pendingPath = resolve(root, "public", "data", "pending.json");
const RETENTION_MS = 90 * 24 * 3600 * 1000;
const MAX_NEEDS_REVIEW = 100;

const args = new Set(process.argv.slice(2));
if (args.has("--help") || args.has("-h")) {
  console.log("triage: summarize (default) or prune (--prune) the pending.json review queue.");
  console.log("  (default)  grouped summary, changes nothing");
  console.log("  --prune    collapse per-slug article dupes + expire 90d+ rows + cap at 100");
  console.log("Never touches messi-data.json.");
  process.exit(0);
}
const prune = args.has("--prune");
for (const a of args) {
  if (a !== "--prune") { console.error("unknown flag: " + a + " (try --help)"); process.exit(1); }
}

if (!existsSync(pendingPath)) { console.log("no pending.json yet; nothing staged."); process.exit(0); }
const store = JSON.parse(readFileSync(pendingPath, "utf8"));
for (const b of ["provisional", "needs_review", "confirmed"]) if (!Array.isArray(store[b])) store[b] = [];

const groupOf = (id) => String(id || "").split(":").slice(0, 3).join(":");
const groups = new Map();
for (const r of store.needs_review) {
  const g = groupOf(r.match_id);
  if (!groups.has(g)) groups.set(g, []);
  groups.get(g).push(r);
}
console.log(`queue: provisional=${store.provisional.length} needs_review=${store.needs_review.length} confirmed=${store.confirmed.length}`);
for (const [g, rows] of [...groups.entries()].sort((a, b) => b[1].length - a[1].length)) {
  rows.sort((a, b) => String(a.fetched_at || "") < String(b.fetched_at || "") ? 1 : -1);
  const newest = rows[0];
  console.log(`  ${g} x${rows.length} (newest ${newest.fetched_at || "?"})`);
  console.log(`    ids: ${rows.map((r) => r.match_id).slice(0, 6).join(", ")}${rows.length > 6 ? ` …+${rows.length - 6}` : ""}`);
  console.log(`    note: ${String(newest.note || "").slice(0, 160)}`);
}
if (store.provisional.length) {
  console.log("provisional rows (matchday-gated, confirm by hand):");
  for (const r of store.provisional) console.log(`  [provisional] ${r.match_id} ${r.match_date || "?"} ${r.home} vs ${r.away} messi=${r.messi_goals}G/${r.messi_assists}A`);
}

if (!prune) process.exit(0);

// --- prune: collapse legacy article dupes to one stable row per slug ---
let collapsed = 0;
{
  const bySlug = new Map();
  for (const r of store.needs_review) {
    const m = String(r.match_id || "");
    const art = m === "watch:article" ? null : /^watch:article:([^:]+)/.exec(m)?.[1];
    if (!art) continue;
    if (!bySlug.has(art)) bySlug.set(art, []);
    bySlug.get(art).push(r);
  }
  const keep = new Set();
  for (const [slug, rows] of bySlug) {
    if (rows.length < 2) { rows.forEach((r) => keep.add(r)); continue; }
    rows.sort((a, b) => String(a.fetched_at || "") < String(b.fetched_at || "") ? 1 : -1);
    const winner = rows[0];
    winner.match_id = "watch:article:" + slug; // stable id going forward
    keep.add(winner);
    collapsed += rows.length - 1;
  }
  if (collapsed) {
    const keepSet = new Set(keep);
    store.needs_review = store.needs_review.filter((r) => {
      const m = String(r.match_id || "");
      if (!/^watch:article:[^:]+/.test(m)) return true;
      return keepSet.has(r);
    });
  }
}

// --- prune: expire + cap (internal rows exempt) ---
const isInternal = (r) => String((r && r.match_id) || "").startsWith("watch:internal:");
let expired = 0;
{
  const cutoff = Date.now() - RETENTION_MS;
  const before = store.needs_review.length;
  store.needs_review = store.needs_review.filter((r) => {
    if (isInternal(r)) return true;
    const t = Date.parse(r.fetched_at || "");
    return isNaN(t) || t >= cutoff;
  });
  expired = before - store.needs_review.length;
}
let capped = 0;
if (store.needs_review.length > MAX_NEEDS_REVIEW) {
  store.needs_review.sort((a, b) => String(a.fetched_at || "") < String(b.fetched_at || "") ? -1 : 1);
  while (store.needs_review.length > MAX_NEEDS_REVIEW) {
    const i = store.needs_review.findIndex((r) => !isInternal(r));
    if (i === -1) break;
    store.needs_review.splice(i, 1);
    capped += 1;
  }
}

store.updated = new Date().toISOString();
writeFileSync(pendingPath, JSON.stringify(store, null, 2));
console.log(`pruned: collapsed=${collapsed} expired=${expired} capped=${capped} (needs_review=${store.needs_review.length}).`);
console.log("messi-data.json untouched by design.");
