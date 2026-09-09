// Manual confirm helper for staged rows in public/data/pending.json.
// One-click confirm still NEVER edits messi-data.json totals automatically:
// it marks a row confirmed (local file) and prints the exact D1 SQL plus the
// manual checklist for folding a confirmed row into messi-data.json by hand.
// Usage:
//   node scripts/confirm-provisional.mjs --list
//   node scripts/confirm-provisional.mjs --confirm <match_id>
//   node scripts/confirm-provisional.mjs --help
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pendingPath = resolve(root, "public", "data", "pending.json");
const argv = process.argv.slice(2);

if (argv.includes("--help") || argv.includes("-h") || argv.length === 0) {
  console.log("confirm-provisional: review staged rows, confirm by match id.");
  console.log("  --list               show all staged rows");
  console.log("  --confirm <match_id> mark row confirmed (local file) + print D1 SQL");
  console.log("Confirming does NOT edit messi-data.json; it only clears the flag.");
  console.log("Folding numbers into messi-data.json stays a manual, sourced edit.");
  process.exit(argv.length === 0 ? 1 : 0);
}
if (!existsSync(pendingPath)) { console.error("no pending.json yet; run verify:smart first."); process.exit(1); }
const store = JSON.parse(readFileSync(pendingPath, "utf8"));
const all = [].concat(store.provisional || [], store.needs_review || [], store.confirmed || []);

if (argv[0] === "--list") {
  if (all.length === 0) { console.log("pending.json is empty: nothing staged."); process.exit(0); }
  for (const r of all) {
    console.log("[" + (r.status || "?") + "] " + r.match_id + " " + (r.match_date || "?") + " " + r.home + " vs " + r.away + " messi=" + r.messi_goals + "G/" + r.messi_assists + "A");
    console.log("    note: " + (r.note || ""));
    for (const s of r.sources || []) console.log("    src: " + s.url + " @ " + s.at);
  }
  console.log("total=" + all.length + " (provisional=" + (store.provisional || []).length + " needs_review=" + (store.needs_review || []).length + " confirmed=" + (store.confirmed || []).length + ")");
  process.exit(0);
}
if (argv[0] === "--confirm") {
  const id = String(argv[1] || "");
  if (!id) { console.error("usage: --confirm <match_id>"); process.exit(1); }
  let found = null;
  for (const bucket of ["provisional", "needs_review"]) {
    const i = (store[bucket] || []).findIndex((r) => String(r.match_id) === id);
    if (i !== -1) { found = store[bucket].splice(i, 1)[0]; break; }
  }
  if (!found) { console.error("match_id not found in provisional/needs_review: " + id); process.exit(1); }
  found.status = "confirmed";
  found.confirmed_at = new Date().toISOString();
  store.confirmed = (store.confirmed || []).concat([found]);
  store.updated = new Date().toISOString();
  writeFileSync(pendingPath, JSON.stringify(store, null, 2));
  console.log("confirmed " + id + " locally (" + found.home + " vs " + found.away + ").");
  console.log("D1 equivalent (run with wrangler when the worker DB exists):");
  console.log("  UPDATE pending_checks SET status = 'confirmed' WHERE match_id = '" + id + "';");
  console.log("Manual checklist before touching messi-data.json:");
  console.log("  1. Open each sources[] URL above; verify score + Messi goals yourself.");
  console.log("  2. Edit messi-data.json rows by hand with a primary-source citation.");
  console.log("  3. Keep assists null unless you did the full match-by-match tally.");
  process.exit(0);
}
console.error("unknown args (try --help)");
process.exit(1);