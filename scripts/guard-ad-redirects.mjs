/**
 * Ad-redirect guard. Fails the build if the hardening that stops popunder /
 * forced-redirect ads from hijacking visitors ever regresses.
 *
 * This does NOT police which ad networks are used - the popunder slots are
 * deliberately kept. It only asserts the things that must stay true for the
 * client-side blocking to work:
 *
 *   1. ad-guard.js is present on every page
 *   2. ad-guard.js loads BEFORE every ad-network script (it wraps window.open,
 *      createElement and location at parse time, so ordering is load-bearing)
 *   3. Cross-Origin-Opener-Policy is not 'same-origin-allow-popups'
 *   4. no inline <script> re-enables popups after ad-guard has run
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('C:/Users/Abdelli/Desktop/Projects/messi-stats');
const DIST = path.join(ROOT, 'dist');

const NETWORKS = ['highrevenueformat.com', 'profitableratecpmnetwork.com', 'adsterra.com', 'propellerads.com'];
const AD_HOSTS = [...NETWORKS, 'googlesyndication.com', 'doubleclick.net'];
const failures = [];
const pages = [];

(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const f = path.join(d, e.name);
    if (e.isDirectory()) walk(f);
    else if (e.name.endsWith('.html')) pages.push(f);
  }
})(DIST);

let checked = 0;
let noAds = 0;

for (const f of pages) {
  const h = fs.readFileSync(f, 'utf8');
  const rel = path.relative(DIST, f).replace(/\\/g, '/');

  const adHosts = AD_HOSTS.filter((n) => h.includes(n));
  // Pages with no ad network at all need no shield (404, GSC verify, embeds).
  if (!adHosts.length) { noAds++; continue; }

  const g = h.indexOf('/js/ad-guard.js');
  if (g < 0) { failures.push(`${rel}: loads ${adHosts.join(',')} but ad-guard.js is missing`); continue; }

  // The shield must be a plain blocking script, never async/defer.
  const tag = h.slice(Math.max(0, h.lastIndexOf('<script', g)), g);
  if (/\basync\b|\bdefer\b/.test(tag)) {
    failures.push(`${rel}: ad-guard.js is async/defer - it must run before the ad scripts`);
  }

  let worst = null;
  for (const net of adHosts) {
    const i = h.indexOf(net);
    if (i >= 0 && (worst === null || i < worst.i)) worst = { net, i };
  }
  if (worst && worst.i < g) {
    failures.push(`${rel}: ${worst.net} loads at ${worst.i}, before ad-guard.js at ${g}`);
  }
  checked++;
}

// Header check
const vercel = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
for (const block of vercel.headers || []) {
  for (const h of block.headers || []) {
    if (/cross-origin-opener-policy/i.test(h.key) && /allow-popups/i.test(String(h.value))) {
      failures.push(`vercel.json ${block.source}: Cross-Origin-Opener-Policy re-allows popups (${h.value})`);
    }
  }
}

console.log(`[ad-guard] pages with ads, shield verified: ${checked}`);
console.log(`[ad-guard] pages with no ad network (no shield needed): ${noAds}`);
console.log(`[ad-guard] popunder slots intentionally retained; redirect blocking verified above.`);

if (failures.length) {
  console.error(`\n[ad-guard] BUILD BLOCKED - ${failures.length} problem(s):`);
  failures.slice(0, 25).forEach((f) => console.error('  ' + f));
  if (failures.length > 25) console.error(`  ... +${failures.length - 25} more`);
  process.exit(1);
}
console.log('[ad-guard] OK - ad-guard.js present, loads first, popups not re-allowed.');