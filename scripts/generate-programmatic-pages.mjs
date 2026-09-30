import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dataPath = path.join(root, "public", "data", "birthday-goals.json");
const distDir = path.join(root, "dist");
const templatePath = path.join(distDir, "birthday.html");
const sitemapPath = path.join(distDir, "sitemap.xml");
const publicSitemapPath = path.join(root, "public", "sitemap.xml");

if (!fs.existsSync(dataPath)) {
  console.error("Missing public/data/birthday-goals.json");
  process.exit(1);
}
if (!fs.existsSync(templatePath)) {
  console.error("Missing dist/birthday.html. Run vite build first.");
  process.exit(1);
}

const bdayData = JSON.parse(fs.readFileSync(dataPath, "utf8"));
const template = fs.readFileSync(templatePath, "utf8");
const days = bdayData.calendar || bdayData.days || {};
const keys = Object.keys(days);

console.log(`Generating ${keys.length} programmatic birthday pages...`);

const escapeHtml = (str) =>
  String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const todayIso = new Date().toISOString().split("T")[0];
let sitemapUrls = [];

for (let i = 0; i < keys.length; i++) {
  const key = keys[i];
  const day = days[key];
  const { month, day: dayNum, formatted, goalsCount, matches } = day;
  const isMessiBday = month === 6 && dayNum === 24;

  const prevIdx = (i - 1 + keys.length) % keys.length;
  const nextIdx = (i + 1) % keys.length;
  const prevKey = keys[prevIdx];
  const nextKey = keys[nextIdx];
  const prevDay = days[prevKey];
  const nextDay = days[nextKey];

  let pageTitle = "";
  let metaDesc = "";

  if (goalsCount > 0) {
    pageTitle = `Did Messi Score on ${formatted}? (${goalsCount} Goals & Video Clips) | MessiStat`;
    metaDesc = `Did Lionel Messi score on ${formatted}? Lionel Messi scored ${goalsCount} goals on ${formatted} across his 930-goal career. Watch match highlights, goal videos, and stats.`;
  } else if (isMessiBday) {
    pageTitle = `Did Messi Score on His Birthday (24 June)? | MessiStat`;
    metaDesc = `Did Lionel Messi ever score on his own birthday (24 June)? Explore Leo Messi's 930 senior goals and why he never played on 24 June.`;
  } else {
    pageTitle = `Did Messi Score on ${formatted}? 366-Day Goal Explorer | MessiStat`;
    metaDesc = `Did Lionel Messi score on ${formatted}? Search all 366 calendar days across Messi's 930 career goals with video highlights and match reports.`;
  }

  // Generate VideoObject schemas if videos exist
  const videoObjects = [];
  if (matches && matches.length) {
    for (const m of matches) {
      if (m.videos && m.videos.length) {
        for (const v of m.videos) {
          videoObjects.push({
            "@type": "VideoObject",
            name: `Lionel Messi Goal vs ${m.opponent} (${formatted} ${m.year})`,
            description: `Watch Lionel Messi score vs ${m.opponent} in the ${m.competition || "official match"} on ${formatted} ${m.year}. Part of Messi's 930 career goals.`,
            thumbnailUrl: "https://www.messistat.com/img/og-messi.jpg",
            uploadDate: `${m.date}T20:00:00Z`,
            contentUrl: v.videoUrl,
            embedUrl: `https://www.messistat.com/en/birthday/${key}`
          });
        }
      }
    }
  }

  const faqMainEntity = [
    {
      "@type": "Question",
      name: `Did Lionel Messi score on ${formatted}?`,
      acceptedAnswer: {
        "@type": "Answer",
        text:
          goalsCount > 0
            ? `Yes, Lionel Messi scored ${goalsCount} career goals on ${formatted}, including matches against ${matches.map((m) => m.opponent).join(", ")}.`
            : isMessiBday
            ? `No. Lionel Messi was born on 24 June 1987 in Rosario, Argentina. He has never played a competitive senior match on 24 June because late June coincides with the club off-season or international rest days.`
            : `Lionel Messi has not scored on ${formatted} in competitive senior fixtures. However, he has scored on 292 of 366 calendar days (79.8% of the year).`
      }
    },
    {
      "@type": "Question",
      name: `How many career goals has Messi scored on this day?`,
      acceptedAnswer: {
        "@type": "Answer",
        text: `Lionel Messi has scored ${goalsCount} goals across ${matches ? matches.length : 0} match appearances on ${formatted}.`
      }
    }
  ];

  const graphItems = [
    {
      "@type": "WebPage",
      "@id": `https://www.messistat.com/en/birthday/${key}#webpage`,
      url: `https://www.messistat.com/en/birthday/${key}`,
      name: pageTitle,
      description: metaDesc,
      dateModified: todayIso,
      inLanguage: "en",
      mainEntityOfPage: `https://www.messistat.com/en/birthday/${key}`
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://www.messistat.com/en" },
        { "@type": "ListItem", position: 2, name: "Birthday Goals", item: "https://www.messistat.com/en/birthday" },
        { "@type": "ListItem", position: 3, name: formatted, item: `https://www.messistat.com/en/birthday/${key}` }
      ]
    },
    {
      "@type": "FAQPage",
      "@id": `https://www.messistat.com/en/birthday/${key}#faq`,
      mainEntity: faqMainEntity
    },
    ...videoObjects
  ];

  const schemaJson = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": graphItems
  });

  // Pre-rendered HTML content for Googlebot and instant load
  let badgeHtml = "";
  let headlineHtml = "";
  let matchesHtml = "";

  if (goalsCount > 0) {
    badgeHtml = `<span class="bday-badge-success">🎉 Yes! Messi Scored On Your Birthday!</span>`;
    const gWord = goalsCount === 1 ? "goal" : "goals";
    const mWord = matches.length === 1 ? "match" : "matches";
    headlineHtml = `Lionel Messi scored <b>${goalsCount} ${gWord}</b> in <b>${matches.length} ${mWord}</b> on ${formatted} throughout his senior career!`;

    matchesHtml = matches
      .map((m, idx) => {
        const minTags = (m.minutes || [])
          .map((min) => `<span class="bday-min-tag">⚽ ${escapeHtml(min)}'</span>`)
          .join(" ");
        const typeTags = (m.types || []).filter(Boolean).length
          ? `<span class="bday-shot-types">(${m.types.join(", ")})</span>`
          : "";
        const hasVideos = m.videos && m.videos.length > 0;
        const videoBtn = hasVideos
          ? `<button type="button" class="bday-watch-video-btn" data-idx="${idx}">
              <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Watch ${m.videos.length > 1 ? m.videos.length + " Goal Clips" : "Goal Clip"}
             </button>`
          : `<a href="https://www.youtube.com/results?search_query=Lionel+Messi+goal+vs+${encodeURIComponent(m.opponent)}+${m.date}" target="_blank" rel="noopener noreferrer" class="bday-yt-search-btn">🔍 Search Highlights</a>`;

        return `
          <article class="bday-match-card">
            <div class="bday-match-meta">
              <span class="bday-match-date-badge">${escapeHtml(m.date)}</span>
              <span class="bday-comp-chip">${escapeHtml(m.competition || "Official Match")}</span>
            </div>
            <div class="bday-match-fixture">
              <span>${escapeHtml(m.team)}</span>
              <span class="bday-score-pill">${escapeHtml(m.score || "Won")}</span>
              <span>${escapeHtml(m.opponent)}</span>
            </div>
            <div class="bday-goals-summary">
              <strong>${m.goalsCount} ${m.goalsCount === 1 ? "goal" : "goals"} scored:</strong>
              <div class="bday-minute-tags">${minTags}</div>
              ${typeTags}
            </div>
            <div class="bday-match-actions">
              ${videoBtn}
              ${hasVideos ? `<button type="button" class="bday-inline-toggle-btn" data-idx="${idx}">📺 Play Inline</button>` : ""}
            </div>
          </article>
        `;
      })
      .join("\n");
  } else if (isMessiBday) {
    badgeHtml = `<span class="bday-badge-messi">🎂 Leo Messi's Own Birthday!</span>`;
    headlineHtml = `You share a birthday with <b>Lionel Andrés Messi</b> (born 24 June 1987 in Rosario)!`;
    matchesHtml = `
      <div class="bday-empty-box">
        <p><b>Why 0 goals?</b> Lionel Messi has never played a competitive senior match on 24 June because late June falls during the European club summer off-season or scheduled rest intervals between international tournament rounds.</p>
        <p>You share your special day with the greatest footballer in history!</p>
      </div>
    `;
  } else {
    badgeHtml = `<span class="bday-badge-empty">No Goals on this Date</span>`;
    headlineHtml = `Lionel Messi has not scored on <b>${formatted}</b> during his senior career.`;
    matchesHtml = `
      <div class="bday-empty-box">
        <p>Messi did not have a match scheduled or did not score on this specific calendar day — but he has scored on <b>292 of 366 days (79.8%)</b> of the year!</p>
      </div>
    `;
  }

  // In project template, replace meta and title
  let html = template;

  // STORAGE: the shared birthday.html template carries the full 366-day heatmap
  // grid (~46 KB of anchors). Cloning that into all 366 date pages meant 32 MB of
  // near-identical HTML - 91% of every build. A single-date page does not need
  // the whole year: app.js already hides 11 of the 12 month cards on load, so
  // only the visited month is ever visible. Each date page therefore ships just
  // that month, plus a pointer to /en/days for the full archive.
  //
  // Must replace the WHOLE #bday-heatmap-grid by depth, not a lazy inner match:
  // the naive regex swallowed all 12 <article> wrappers and the section's own
  // closing tags, which silently broke the page.
  {
    const month = Number(String(key).slice(0, 2));
    const monthNames = ["January","February","March","April","May","June","July",
      "August","September","October","November","December"];
    const pad = (x) => String(x).padStart(2, "0");
    // Derive the month length and total from the data itself. Do NOT use
    // new Date(y, m, 0): the calendar carries 366 days, so February must run to
    // the 29th, and a Date-based length would silently drop 02-29.
    const monthKeys = Object.keys(days).filter((k) => k.slice(0, 2) === pad(month));
    const daysInMonth = monthKeys.length
      ? Math.max(...monthKeys.map((k) => Number(k.slice(3))))
      : 0;
    const monthGoals = monthKeys.reduce((a, k) => a + (days[k].goalsCount || 0), 0);
    const cells = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const k2 = `${pad(month)}-${pad(d)}`;
      const rec = days[k2];
      const n = rec ? (rec.goalsCount || 0) : 0;
      // Thresholds match the legend printed under the shared heatmap:
      // 0 -> t0, 1-2 -> t1, 3-5 -> t2, 6-8 -> t3, 9+ -> t4 (Peak).
      const tier = n === 0 ? 0 : n >= 9 ? 4 : n >= 6 ? 3 : n >= 3 ? 2 : 1;
      // Read the month name from the data rather than a local array, so it stays
      // correct if the calendar ever gains a locale.
      const mName = rec && rec.monthName ? rec.monthName : monthNames[month - 1];
      const title = `${d} ${mName}: ${n} goal${n === 1 ? "" : "s"}`;
      const current = k2 === key;
      cells.push(
        `<a href="/en/birthday/${k2}" class="bday-day-btn tier-${tier}${current ? " is-current" : ""}"` +
        ` data-month="${month}" data-day="${d}" title="${escapeHtml(title)}"` +
        `${current ? ` aria-current="page"` : ""}>${d}</a>`
      );
    }

    const monthGrid =
      `<div class="bday-heatmap-grid" id="bday-heatmap-grid">` +
      `<article class="bday-month-card" data-month="${month}">` +
      `<div class="bday-month-card-head">` +
      `<h3 class="bday-month-card-title">${escapeHtml(monthNames[month - 1])}</h3>` +
      `<span class="bday-month-card-goals">${monthGoals} goals</span>` +
      `</div>` +
      `<div class="bday-days-grid">${cells.join("")}</div>` +
      `</article>` +
      `</div>` +
      `<p class="bday-month-strip-more">` +
      `<a href="/en/days">Browse all 366 days &rarr;</a>` +
      `</p>`;

    // app.js fills #bday-heatmap-nav with 13 month buttons that filter the grid.
    // With one month shipped, those buttons would blank the grid, so drop the
    // element entirely - el() returns null and the whole nav block is skipped.
    html = html.replace(
      /<div\s+class="bday-heatmap-nav"\s+id="bday-heatmap-nav"[^>]*><\/div>/i,
      ""
    );

    // Depth-match the grid div so only that element is replaced.
    const openRe = /<div\s+class="bday-heatmap-grid"\s+id="bday-heatmap-grid"\s*>/i;
    const om = openRe.exec(html);
    if (!om) {
      console.warn(`[programmatic] heatmap grid not found for ${key}`);
    } else {
      let depth = 0, end = -1;
      const divRe = /<(\/?)div\b[^>]*?(\/?)>/g;
      divRe.lastIndex = om.index;
      let dm;
      while ((dm = divRe.exec(html)) !== null) {
        if (dm[2] === "/") continue;              // self-closing, ignore
        depth += dm[1] ? -1 : 1;
        if (depth === 0) { end = dm.index + dm[0].length; break; }
      }
      if (end < 0) {
        console.warn(`[programmatic] heatmap grid unbalanced for ${key}`);
      } else {
        html = html.slice(0, om.index) + monthGrid + html.slice(end);
      }
    }
  }

  // Title & H1
  html = html.replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(pageTitle)}</title>`);
  const bdayH1 = goalsCount > 0
    ? `Did Lionel Messi Score on ${formatted}? (${goalsCount} Career ${goalsCount === 1 ? "Goal" : "Goals"})`
    : isMessiBday
    ? `Did Lionel Messi Score on His Birthday (24 June)?`
    : `Did Lionel Messi Score on ${formatted}?`;
  html = html.replace(/<h1[^>]*>.*?<\/h1>/i, `<h1 class="page-title">${escapeHtml(bdayH1)}</h1>`);

  // Canonical & Alternates
  html = html.replace(/<link[^>]*rel="canonical"[^>]*>/i, `<link rel="canonical" href="https://www.messistat.com/en/birthday/${key}"/>`);
  html = html.replace(/<link[^>]*hreflang="en"[^>]*>/i, `<link rel="alternate" hreflang="en" href="https://www.messistat.com/en/birthday/${key}"/>`);
  html = html.replace(/<link[^>]*hreflang="x-default"[^>]*>/i, `<link rel="alternate" hreflang="x-default" href="https://www.messistat.com/en/birthday/${key}"/>`);

  // Meta description & titles
  html = html.replace(/<meta[^>]*name="description"[^>]*>/i, `<meta name="description" content="${escapeHtml(metaDesc)}"/>`);
  html = html.replace(/<meta[^>]*property="og:description"[^>]*>/i, `<meta property="og:description" content="${escapeHtml(metaDesc)}"/>`);
  html = html.replace(/<meta[^>]*name="twitter:description"[^>]*>/i, `<meta name="twitter:description" content="${escapeHtml(metaDesc)}"/>`);
  html = html.replace(/<meta[^>]*property="og:url"[^>]*>/i, `<meta property="og:url" content="https://www.messistat.com/en/birthday/${key}"/>`);
  html = html.replace(/<meta[^>]*property="og:title"[^>]*>/i, `<meta property="og:title" content="${escapeHtml(pageTitle)}"/>`);
  html = html.replace(/<meta[^>]*name="twitter:title"[^>]*>/i, `<meta name="twitter:title" content="${escapeHtml(pageTitle)}"/>`);

  // Replace Schema
  html = html.replace(
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script type="application/ld+json">\n${schemaJson}\n</script>`
  );

  // Pre-fill static verdict HTML
  const navHtml = `
    <nav class="bday-day-nav" aria-label="Calendar day navigation">
      <a href="/en/birthday/${prevKey}" class="bday-nav-link bday-nav-prev">← ${escapeHtml(prevDay.formatted)}</a>
      <a href="/en/birthday" class="bday-nav-link bday-nav-all">📅 All 366 Days</a>
      <a href="/en/birthday/${nextKey}" class="bday-nav-link bday-nav-next">${escapeHtml(nextDay.formatted)} →</a>
    </nav>`;

  html = html.replace(
    /<h2 class="bday-target-date" id="bday-target-date">.*?<\/h2>/,
    `${navHtml}\n      <h2 class="bday-target-date" id="bday-target-date">${escapeHtml(formatted)}</h2>`
  );
  html = html.replace(
    /<p class="bday-headline" id="bday-headline">.*?<\/p>/,
    `<p class="bday-headline" id="bday-headline">${headlineHtml}</p>`
  );
  html = html.replace(
    /<div id="bday-verdict-badge"><\/div>/,
    `<div id="bday-verdict-badge">${badgeHtml}</div>`
  );
  html = html.replace(
    /<div class="bday-match-list" id="bday-match-list">[\s\S]*?<\/div>/,
    `<div class="bday-match-list" id="bday-match-list">${matchesHtml}</div>`
  );

  // For zero-goal dates (thin programmatic content), set noindex, follow and exclude from sitemap
  if (goalsCount === 0 && !isMessiBday) {
    html = html.replace(/<meta\s+name="robots"[^>]*>/i, `<meta name="robots" content="noindex, follow"/>`);
  } else {
    let dayLastmod = "2026-09-18";
    if (matches && matches.length) {
      const dates = matches.map(m => m.date).filter(Boolean).sort();
      if (dates.length) {
        dayLastmod = dates[dates.length - 1];
      }
    }
    sitemapUrls.push(`  <url>
    <loc>https://www.messistat.com/en/birthday/${key}</loc>
    <lastmod>${dayLastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.75</priority>
  </url>`);
  }

  // Safe HTML minification to drastically reduce disk footprint & Vercel deployment storage
  const minifiedHtml = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/>\s+</g, "><")
    .replace(/\s{2,}/g, " ");

  // Write to dist/en/birthday/[key]/index.html
  const outDir = path.join(distDir, "en", "birthday", key);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"), minifiedHtml, "utf8");
}

console.log(`Generated ${keys.length} pages in dist/en/birthday/`);

// Update sitemap.xml
if (fs.existsSync(sitemapPath)) {
  let sitemapContent = fs.readFileSync(sitemapPath, "utf8");
  if (!sitemapContent.includes("https://www.messistat.com/en/birthday/05-02")) {
    const insertPos = sitemapContent.lastIndexOf("</urlset>");
    if (insertPos !== -1) {
      const updatedSitemap =
        sitemapContent.slice(0, insertPos) +
        sitemapUrls.join("\n") +
        "\n</urlset>";
      fs.writeFileSync(sitemapPath, updatedSitemap, "utf8");
      if (fs.existsSync(publicSitemapPath)) {
        fs.writeFileSync(publicSitemapPath, updatedSitemap, "utf8");
      }
      console.log(`Appended ${sitemapUrls.length} birthday URLs to sitemap.xml`);
    }
  }
}
