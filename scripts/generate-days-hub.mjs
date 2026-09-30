/**
 * scripts/generate-days-hub.mjs
 *
 * Builds a single crawlable "Days" index page that links to all 366
 * /en/birthday/MM-DD pages.
 *
 * Why: the 366 day pages were only reachable from birthday.html. A single
 * hub concentrates internal link equity, gives crawlers one obvious entry
 * point, and gives the "days Messi scored on" keyword set a home page.
 *
 * Reuses dist/birthday.html so the hub inherits the site chrome, fonts,
 * rail and footer exactly. Only the <main> contents are replaced.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const distDir = path.join(root, "dist");

const dataPath = path.join(root, "public", "data", "birthday-goals.json");
const templatePath = path.join(distDir, "birthday.html");

if (!fs.existsSync(dataPath)) {
  console.error("[days] Missing public/data/birthday-goals.json");
  process.exit(1);
}
if (!fs.existsSync(templatePath)) {
  console.error("[days] Missing dist/birthday.html. Run vite build first.");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
const template = fs.readFileSync(templatePath, "utf8");
const days = Object.values(data.calendar || {});
if (!days.length) {
  console.error("[days] calendar is empty in birthday-goals.json");
  process.exit(1);
}

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const SITE = "https://www.messistat.com";
const MONTHS = data.meta.months || [];

// ---- day cell ----
function dayCell(d) {
  const n = d.goalsCount || 0;
  const href = `/en/birthday/${d.key}`;
  const label = `${d.formatted} — ${n} goal${n === 1 ? "" : "s"}`;
  const tier = n >= 8 ? 4 : n >= 5 ? 3 : n >= 2 ? 2 : n === 1 ? 1 : 0;
  const num = n > 0 ? `<b class="day-num tnum">${n}</b>` : `<span class="day-num day-num--0">0</span>`;
  return `<a class="day-cell tier-${tier}" href="${href}" title="${esc(label)}" data-day="${d.key}">` +
    `<span class="day-label">${esc(d.formatted)}</span>${num}</a>`;
}

// ---- month section ----
function monthSection(m) {
  const md = days.filter((d) => d.month === m.month);
  const cells = md.map(dayCell).join("\n        ");
  return `      <section class="days-month" id="month-${m.month}">
        <h2 class="days-month-title">${esc(m.name)} <span class="days-month-stat">${m.daysScored}/${m.totalDays} days · ${m.goals} goals</span></h2>
        <div class="days-grid">
        ${cells}
        </div>
      </section>`;
}

const monthNav = MONTHS
  .map((m) => `<a class="days-month-link" href="#month-${m.month}">${esc(m.name)}</a>`)
  .join("\n      ");

const monthSections = MONTHS.map(monthSection).join("\n");

const top = (data.meta.topDays || [])
  .map(
    (t) =>
      `<a class="days-top" href="/en/birthday/${t.key}"><b>${t.formatted}</b><span class="tnum">${t.goalsCount}</span></a>`
  )
  .join("\n        ");

const body = `
<div id="banner" hidden></div>

<header class="page-head">
  <p class="eyebrow">Day-by-day archive <i></i> <span id="upd">Updated 30 September 2026</span></p>
  <h1>All 366 Days: Every Day Lionel Messi Scored On</h1>
  <p class="lede">Messi has scored on <b>${data.meta.daysWithGoals} of the ${data.meta.totalDaysInYear}</b> days in a calendar year — <b>${data.meta.percentDaysScored}%</b> of all possible dates. Every day below links to its own page, with the matches he played and the goals he scored on that date.</p>
</header>

<nav class="days-month-nav" aria-label="Jump to month">
      ${monthNav}
</nav>

<section class="days-topdays" aria-label="Most prolific days">
  <h2 class="days-month-title">Most prolific days</h2>
  <div class="days-top-grid">
        ${top}
  </div>
</section>

      ${monthSections}

<section class="days-footnote">
  <h2>About these day pages</h2>
  <p>Each day page is generated from Messi's full senior match record: league, domestic cup, continental and international matches only. No youth football, no reserves, no friendlies. The <b>${data.meta.daysWithoutGoals}</b> days with no goals still exist as pages, because "did Messi score on this date" is a real question people ask on birthdays and New Year.</p>
  <p>Across the archive Messi scored <b>${data.meta.totalGoals} goals</b> in <b>${data.meta.totalVideosAvailable}</b> matches, with video available for <b>${data.meta.matchesWithVideoCount}</b> of them (${data.meta.videoCoveragePercent}% coverage).</p>
</section>
`;

// ---- splice into the birthday template ----
const mainOpen = template.match(/<main\b[^>]*>/i);
if (!mainOpen) {
  console.error("[days] Could not find <main> in dist/birthday.html");
  process.exit(1);
}
const openIdx = template.indexOf(mainOpen[0]);
const closeIdx = template.indexOf("</main>", openIdx);
if (closeIdx < 0) {
  console.error("[days] Could not find </main> in dist/birthday.html");
  process.exit(1);
}

let out = template.slice(0, openIdx + mainOpen[0].length) + body + template.slice(closeIdx);

// ---- head metadata: the hub needs its own title/description/canonical ----
out = out.replace(
  /<link[^>]+rel=["']canonical["'][^>]*>/i,
  `<link rel="canonical" href="${SITE}/en/days"/>`
);
out = out.replace(/<title[^>]*>[\s\S]*?<\/title>/i, `<title>All 366 Days Messi Scored On | MessiStat</title>`);
out = out.replace(
  /<meta[^>]+name=["']description["'][^>]*>/i,
  `<meta name="description" content="Every day of the year, one by one: Lionel Messi scored on ${data.meta.daysWithGoals} of 366 dates (${data.meta.percentDaysScored}%) across his ${data.meta.totalGoals} career goals. Open any day for the matches and goals.">`
);
out = out.replace(/<meta[^>]+name=["']robots["'][^>]*>/i, `<meta name="robots" content="index, follow, max-image-preview:large"/>`);
out = out.replace(/<html[^>]*>/i, (m) => m.replace(/data-page="[^"]*"/, 'data-page="days"'));

// ---- structured data: an ItemList of the day pages ----
const ld = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": `${SITE}/en/days#webpage`,
  url: `${SITE}/en/days`,
  name: "All 366 Days: Every Day Lionel Messi Scored On",
  description: `Messi scored on ${data.meta.daysWithGoals} of 366 possible dates across his ${data.meta.totalGoals} career goals.`,
  inLanguage: "en",
  isPartOf: {
    "@type": "WebSite",
    "@id": `${SITE}/#website`,
    url: SITE,
    name: "MessiStat"
  },
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/en` },
      { "@type": "ListItem", position: 2, name: "Birthday Goals", item: `${SITE}/en/birthday` },
      { "@type": "ListItem", position: 3, name: "All Days", item: `${SITE}/en/days` }
    ]
  },
  mainEntity: {
    "@type": "ItemList",
    numberOfItems: days.length,
    itemListElement: days.map((d, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${d.formatted} — ${d.goalsCount} goal${d.goalsCount === 1 ? "" : "s"}`,
      url: `${SITE}/en/birthday/${d.key}`
    }))
  }
};
out = out.replace(
  /<script[^>]+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/i,
  `<script type="application/ld+json">${JSON.stringify(ld)}</script>`
);

fs.writeFileSync(path.join(distDir, "days.html"), out, "utf8");
console.log(
  `[days] Wrote dist/days.html — ${days.length} day links across ${MONTHS.length} months ` +
  `(${data.meta.daysWithGoals} days with goals, ${data.meta.daysWithoutGoals} without).`
);
