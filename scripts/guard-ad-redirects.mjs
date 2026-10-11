/**
 * Ad-redirect guard. Fails the build if the sandboxing that stops popunder /
 * forced-redirect ads from hijacking visitors ever regresses.
 *
 * Ad-network scripts (highrevenueformat, profitableratecpmnetwork) must NEVER
 * run in a top-level page: they register document-wide click handlers that
 * bounce mobile visitors off-site on the first tap. They run only inside
 * public/ads/*.html, embedded via sandboxed iframes that cannot navigate the
 * top page (no allow-top-navigation / allow-top-navigation-by-user-activation).
 * The frames DO carry allow-same-origin: the networks refuse to paint into
 * opaque-origin frames, so without it every slot stays blank. Top-level
 * navigation stays dead regardless (it needs a top-navigation token), and an
 * in-frame popup gate (timers/synthetic/spray blocked, one genuine click at
 * a time) keeps popunders dead while genuine creative clicks still open.
 * The banners keep rendering and keep earning; only the redirect capability
 * is removed.
 *
 * Asserts:
 *   1. No top-level page loads a network script directly (<script src> to a
 *      popunder host, or a bare atOptions block).
 *   2. Every iframe.safe-ad-frame points at /ads/ and carries a sandbox
 *      without top-navigation tokens (same-origin required so networks paint).
 *   3. public/ads/*.html exist, contain the expected network payloads, and
 *      carry the storage shim + in-frame popup gate.
 *   4. ad-guard.js is present on every page that embeds ads or frames.
 *   5. Cross-Origin-Opener-Policy does not re-allow popups.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');

const NETWORKS = ['highrevenueformat.com', 'profitableratecpmnetwork.com', 'adsterra.com', 'propellerads.com'];
const failures = [];
const pages = [];

(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const f = path.join(d, e.name);
    if (e.isDirectory()) walk(f);
    else if (e.name.endsWith('.html')) pages.push(f);
  }
})(DIST);

// The isolated ad documents. Keyed by the iframe src pages must use.
const ADS_DIR = path.join(DIST, 'ads');
const EXPECTED_ADS = {
  'hrf-300x250.html': 'highrevenueformat.com',
  'hrf-728x90.html': 'highrevenueformat.com',
  'prc-native-6161.html': 'profitableratecpmnetwork.com',
  'prc-native-6160.html': 'profitableratecpmnetwork.com',
  'frame.css': null,
};
for (const [file, net] of Object.entries(EXPECTED_ADS)) {
  const p = path.join(ADS_DIR, file);
  if (!fs.existsSync(p)) {
    failures.push(`dist/ads/${file} is missing - sandboxed ad docs must ship`);
    continue;
  }
  if (net && !fs.readFileSync(p, 'utf8').includes(net)) {
    failures.push(`dist/ads/${file} no longer loads ${net}`);
  }
  if (file.endsWith('.html')) {
    const doc = fs.readFileSync(p, 'utf8');
    if (!doc.includes('Sandbox storage shim')) {
      failures.push(`dist/ads/${file} lost the storage shim (creatives will not render sandboxed)`);
    }
    if (!doc.includes('In-frame popup gate')) {
      failures.push(`dist/ads/${file} lost the in-frame popup gate (popunders would fire freely)`);
    }
  }
}

let withFrames = 0;
let noAds = 0;

for (const f of pages) {
  const h = fs.readFileSync(f, 'utf8');
  const rel = path.relative(DIST, f).replace(/\\/g, '/');
  const isAdDoc = rel.startsWith('ads/');

  // 1. Raw network scripts must not run in top-level pages.
  if (!isAdDoc) {
    if (/<script[^>]*src="https:\/\/(www\.highrevenueformat\.com|pl31316537\.profitableratecpmnetwork\.com|[^"]*adsterra\.com|[^"]*propellerads\.com)/.test(h)) {
      failures.push(`${rel}: loads a popunder script top-level - move it into public/ads/`);
    }
    if (/<script>\s*atOptions\s*=/.test(h)) {
      failures.push(`${rel}: bare atOptions block top-level - belongs in public/ads/hrf-*.html`);
    }
  }

  // 2. Every safe-ad-frame must be a sandboxed /ads/ embed.
  const frames = [...h.matchAll(/<iframe\b[^>]*class="[^"]*safe-ad-frame[^"]*"[^>]*>/g)].map((m) => m[0]);
  for (const tag of frames) {
    const src = (tag.match(/\ssrc="([^"]*)"/) || [])[1] || '';
    const sb = (tag.match(/\ssandbox="([^"]*)"/) || [])[1];
    if (!src.startsWith('/ads/')) {
      failures.push(`${rel}: safe-ad-frame points outside /ads/ (${src})`);
    }
    if (sb === undefined) {
      failures.push(`${rel}: safe-ad-frame has no sandbox attribute`);
    } else {
      const toks = sb.split(/\s+/);
      // allow-top-navigation (any form) would let ad frames redirect the
      // page itself: always forbidden. allow-same-origin is permitted: the
      // ad servers refuse to paint into opaque-origin frames, and top-level
      // navigation stays dead without a top-navigation token.
      for (const bad of ['allow-top-navigation', 'allow-top-navigation-by-user-activation']) {
        if (toks.includes(bad)) failures.push(`${rel}: safe-ad-frame sandbox allows ${bad}`);
      }
      if (!toks.includes('allow-scripts')) failures.push(`${rel}: safe-ad-frame sandbox drops allow-scripts (creative would not render)`);
      if (!toks.includes('allow-same-origin')) failures.push(`${rel}: safe-ad-frame sandbox drops allow-same-origin (network refuses opaque-origin frames, creative would not render)`);
    }
  }

  const mentionsAds = frames.length > 0 || /googlesyndication\.com|doubleclick\.net/.test(h);
  if (!mentionsAds) { noAds++; continue; }
  withFrames++;

  // 4. Pages with ads must carry the shield (second layer of defence).
  if (!isAdDoc && !h.includes('/js/ad-guard.js')) {
    failures.push(`${rel}: embeds ads but ad-guard.js is missing`);
  }
}

// 5. Header check
const vercel = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
for (const block of vercel.headers || []) {
  for (const h of block.headers || []) {
    if (/cross-origin-opener-policy/i.test(h.key) && /allow-popups/i.test(String(h.value))) {
      failures.push(`vercel.json ${block.source}: Cross-Origin-Opener-Policy re-allows popups (${h.value})`);
    }
  }
}

console.log(`[ad-guard] pages with sandboxed ads, verified: ${withFrames}`);
console.log(`[ad-guard] pages with no ads (no shield needed): ${noAds}`);

if (failures.length) {
  console.error(`\n[ad-guard] BUILD BLOCKED - ${failures.length} problem(s):`);
  failures.slice(0, 25).forEach((f) => console.error('  ' + f));
  if (failures.length > 25) console.error(`  ... +${failures.length - 25} more`);
  process.exit(1);
}
console.log('[ad-guard] OK - networks isolated in /ads/, frames sandboxed, shield present.');
