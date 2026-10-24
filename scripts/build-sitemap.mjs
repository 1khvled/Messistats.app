import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const publicSitemap = path.join(rootDir, "public", "sitemap.xml");
const distSitemap = path.join(rootDir, "dist", "sitemap.xml");

const LANGS = ["en", "es", "pt", "fr"];

const todayIso = new Date().toISOString().split("T")[0];

// Single source of truth — the central stat registry (scripts/stats.mjs),
// so the sitemap's career totals and "last goal" meta can never drift behind
// a new goal (previously hardcoded at #932 / 1,178).
import { S } from "./stats.mjs";

const CAREER_GOALS = S.goals;
const CAREER_APPS = S.apps;
const CAREER_TROPHIES = S.trophies;
const BALLONS_DOR = 8;
const LG = S.latestGoal;
const LG_NUM = LG?.goalNumber ?? CAREER_GOALS;
const LG_OPP = (LG?.opponent || "").trim();
const LG_TEAM = (LG?.team || "Inter Miami CF").replace(/\s+CF$/, "").trim();
const LG_MIN = (LG?.minute || "").replace(/'/g, "").trim();
const LG_FINISH = (LG?.finish || "left-foot").trim();
const LG_COMP = (LG?.competition || "Major League Soccer").trim();
const LG_DATE = (LG?.formattedDate || todayIso).trim();
const LG_VIDEO = LG?.videoUrl || `https://cdn.messiallgoals.com/Goal${LG_NUM}.mp4`;
// URL-safe slug fragments for title/tags
const LG_OPP_TAG = (LG_OPP || "Opponent").replace(/[^A-Za-z0-9]+/g, " ").trim();

// 934 → "934th" / "934e" / "934e" style helpers are avoided; templates
// interpolate the raw number and let the locale wording carry the grammar.

const SUBPAGES = [
  { slug: "dashboard", changefreq: "daily", priority: "0.9", lastmod: todayIso },
  { slug: "birthday", changefreq: "daily", priority: "0.95", lastmod: todayIso },
  { slug: "goalsbyseason", changefreq: "weekly", priority: "0.9", lastmod: todayIso },
  { slug: "goalsbyyear", changefreq: "weekly", priority: "0.9", lastmod: todayIso },
  { slug: "messi-vs-ronaldo", changefreq: "weekly", priority: "0.95", lastmod: todayIso },
  { slug: "vs-real-madrid", changefreq: "weekly", priority: "0.9", lastmod: todayIso },
  { slug: "champions-league", changefreq: "monthly", priority: "0.9", lastmod: todayIso },
  { slug: "latest-goal", changefreq: "daily", priority: "0.95", lastmod: todayIso },
  { slug: "timeline", changefreq: "weekly", priority: "0.9", lastmod: todayIso },
  { slug: "achievements", changefreq: "monthly", priority: "0.85", lastmod: todayIso },
  { slug: "gear", changefreq: "weekly", priority: "0.85", lastmod: todayIso }
];

function getHreflangsXml(slugPath) {
  return [
    `    <xhtml:link rel="alternate" hreflang="en" href="https://www.messistat.com/en${slugPath}" />`,
    `    <xhtml:link rel="alternate" hreflang="en-US" href="https://www.messistat.com/en${slugPath}" />`,
    `    <xhtml:link rel="alternate" hreflang="en-NG" href="https://www.messistat.com/en${slugPath}" />`,
    `    <xhtml:link rel="alternate" hreflang="en-IN" href="https://www.messistat.com/en${slugPath}" />`,
    `    <xhtml:link rel="alternate" hreflang="en-PH" href="https://www.messistat.com/en${slugPath}" />`,
    `    <xhtml:link rel="alternate" hreflang="es" href="https://www.messistat.com/es${slugPath}" />`,
    `    <xhtml:link rel="alternate" hreflang="es-AR" href="https://www.messistat.com/es${slugPath}" />`,
    `    <xhtml:link rel="alternate" hreflang="es-ES" href="https://www.messistat.com/es${slugPath}" />`,
    `    <xhtml:link rel="alternate" hreflang="pt" href="https://www.messistat.com/pt${slugPath}" />`,
    `    <xhtml:link rel="alternate" hreflang="pt-BR" href="https://www.messistat.com/pt${slugPath}" />`,
    `    <xhtml:link rel="alternate" hreflang="pt-PT" href="https://www.messistat.com/pt${slugPath}" />`,
    `    <xhtml:link rel="alternate" hreflang="fr" href="https://www.messistat.com/fr${slugPath}" />`,
    `    <xhtml:link rel="alternate" hreflang="fr-FR" href="https://www.messistat.com/fr${slugPath}" />`,
    `    <xhtml:link rel="alternate" hreflang="fr-NE" href="https://www.messistat.com/fr${slugPath}" />`,
    `    <xhtml:link rel="alternate" hreflang="x-default" href="https://www.messistat.com/en${slugPath}" />`
  ].join("\n");
}

const urlBlocks = [];

// 1. English Homepage
urlBlocks.push(`  <url>
    <loc>https://www.messistat.com/en</loc>
    <lastmod>${todayIso}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
${getHreflangsXml("")}
    <image:image>
      <image:loc>https://www.messistat.com/img/logo.png</image:loc>
      <image:title>MessiStat Official Logo</image:title>
      <image:caption>MessiStat - Lionel Messi Career Statistics and Analytics</image:caption>
    </image:image>
    <image:image>
      <image:loc>https://www.messistat.com/img/messi.jpg</image:loc>
      <image:title>Lionel Messi Inter Miami CF 2026</image:title>
      <image:caption>Lionel Messi wearing the captain's armband for Inter Miami CF during the 2026 season.</image:caption>
      <image:geo_location>Miami, Florida, United States</image:geo_location>
    </image:image>
    <image:image>
      <image:loc>https://www.messistat.com/img/og-messi.jpg</image:loc>
      <image:title>Lionel Messi ${CAREER_GOALS} Career Goals Official Stats</image:title>
      <image:caption>Lionel Messi career overview: ${CAREER_GOALS} goals in ${CAREER_APPS.toLocaleString("en-US")} senior appearances, ${CAREER_TROPHIES} trophies, ${BALLONS_DOR} Ballons d'Or.</image:caption>
    </image:image>
  </url>`);

// 2. English Subpages
const enImages = {
  timeline: `    <image:image>
      <image:loc>https://www.messistat.com/img/era-2008-olympic.webp</image:loc>
      <image:title>Lionel Messi Olympic Gold &amp; Barcelona Breakthrough (2004–2008)</image:title>
      <image:caption>Lionel Messi celebrating his breakthrough years and Olympic Gold medal with Argentina.</image:caption>
      <image:geo_location>Beijing, China / Barcelona, Spain</image:geo_location>
    </image:image>
    <image:image>
      <image:loc>https://www.messistat.com/img/era-2011-wembley.webp</image:loc>
      <image:title>Lionel Messi Champions League Final at Wembley (2011)</image:title>
      <image:caption>Messi holding the European Cup after the 2011 Champions League final win at Wembley.</image:caption>
      <image:geo_location>London, United Kingdom</image:geo_location>
    </image:image>
    <image:image>
      <image:loc>https://www.messistat.com/img/era-2012-ballon.webp</image:loc>
      <image:title>Lionel Messi World-Record 91 Goals in 2012</image:title>
      <image:caption>Lionel Messi holding his fourth consecutive Ballon d'Or trophy after his 91-goal world record in 2012.</image:caption>
      <image:geo_location>Zurich, Switzerland</image:geo_location>
    </image:image>
    <image:image>
      <image:loc>https://www.messistat.com/img/era-2016.webp</image:loc>
      <image:title>Lionel Messi 500th Goal Celebration at Santiago Bernabéu (2017)</image:title>
      <image:caption>Lionel Messi holding up his number 10 shirt after scoring his 500th Barcelona goal in El Clásico.</image:caption>
      <image:geo_location>Madrid, Spain</image:geo_location>
    </image:image>
    <image:image>
      <image:loc>https://www.messistat.com/img/era-2021-psg-signing.webp</image:loc>
      <image:title>Lionel Messi Paris Saint-Germain (2021–2023)</image:title>
      <image:caption>Lionel Messi signing for Paris Saint-Germain at Parc des Princes.</image:caption>
      <image:geo_location>Paris, France</image:geo_location>
    </image:image>
    <image:image>
      <image:loc>https://www.messistat.com/img/era-2022.webp</image:loc>
      <image:title>Lionel Messi FIFA World Cup Champion Lusail 2022</image:title>
      <image:caption>Lionel Messi lifted on Agüero's shoulders celebrating the 2022 World Cup win at Lusail.</image:caption>
      <image:geo_location>Lusail, Qatar</image:geo_location>
    </image:image>
    <image:image>
      <image:loc>https://www.messistat.com/img/era-2023-miami.webp</image:loc>
      <image:title>Lionel Messi Inter Miami CF (2023–2026)</image:title>
      <image:caption>Lionel Messi unveiled as Inter Miami number 10 alongside David Beckham.</image:caption>
      <image:geo_location>Fort Lauderdale, Florida, United States</image:geo_location>
    </image:image>`,
  achievements: `    <image:image>
      <image:loc>https://www.messistat.com/img/cab-ballon.webp</image:loc>
      <image:title>Lionel Messi Record 8 Ballons d'Or</image:title>
      <image:caption>Lionel Messi celebrating his record 8th Ballon d'Or award (2009, 2010, 2011, 2012, 2015, 2019, 2021, 2023).</image:caption>
      <image:geo_location>Paris, France</image:geo_location>
    </image:image>
    <image:image>
      <image:loc>https://www.messistat.com/img/cab-wc.webp</image:loc>
      <image:title>Lionel Messi FIFA World Cup Trophy 2022</image:title>
      <image:caption>Lionel Messi lifting the FIFA World Cup trophy after Argentina's final victory against France in Qatar.</image:caption>
      <image:geo_location>Lusail, Qatar</image:geo_location>
    </image:image>
    <image:image>
      <image:loc>https://www.messistat.com/img/cab-ucl.webp</image:loc>
      <image:title>Lionel Messi UEFA Champions League Trophies</image:title>
      <image:caption>Lionel Messi celebrating one of his 4 UEFA Champions League titles with FC Barcelona (2006, 2009, 2011, 2015).</image:caption>
      <image:geo_location>Rome, Italy / London, UK / Berlin, Germany</image:geo_location>
    </image:image>
    <image:image>
      <image:loc>https://www.messistat.com/img/cab-copa.webp</image:loc>
      <image:title>Lionel Messi Copa América Champion</image:title>
      <image:caption>Lionel Messi celebrating continental championship with Argentina at Copa América (2021 and 2024).</image:caption>
      <image:geo_location>Rio de Janeiro, Brazil / Miami, USA</image:geo_location>
    </image:image>
    <image:image>
      <image:loc>https://www.messistat.com/img/cab-liga.webp</image:loc>
      <image:title>Lionel Messi 10 La Liga Championships</image:title>
      <image:caption>Lionel Messi celebrating domestic league supremacy with 10 La Liga titles at FC Barcelona.</image:caption>
      <image:geo_location>Barcelona, Spain</image:geo_location>
    </image:image>`,
  birthday: `    <image:image>
      <image:loc>https://www.messistat.com/img/og-messi.jpg</image:loc>
      <image:title>Lionel Messi Birthday Goal Explorer: ${CAREER_GOALS} Career Goals Across 366 Days</image:title>
      <image:caption>Interactive visual map and video player showing all goals Lionel Messi scored across 366 calendar days.</image:caption>
      <image:geo_location>Miami, Florida, United States / Barcelona, Spain / Buenos Aires, Argentina</image:geo_location>
    </image:image>`,
  "vs-real-madrid": `    <image:image>
      <image:loc>https://www.messistat.com/img/og-messi.jpg</image:loc>
      <image:title>Lionel Messi vs Real Madrid El Clasico Goals</image:title>
      <image:caption>All 26 goals and 14 assists scored by Lionel Messi against Real Madrid in El Clasico.</image:caption>
    </image:image>`,
  "messi-vs-ronaldo": `    <image:image>
      <image:loc>https://www.messistat.com/img/og-messi.jpg</image:loc>
      <image:title>Lionel Messi vs Cristiano Ronaldo Career Comparison</image:title>
      <image:caption>Complete statistical head-to-head comparison between Lionel Messi and Cristiano Ronaldo.</image:caption>
    </image:image>`,
  "champions-league": `    <image:image>
      <image:loc>https://www.messistat.com/img/era-2011-wembley.webp</image:loc>
      <image:title>Lionel Messi Champions League Goals</image:title>
      <image:caption>Lionel Messi UEFA Champions League statistics: 129 goals in 163 matches and 4 European titles.</image:caption>
    </image:image>`,
  "latest-goal": `    <image:image>
      <image:loc>https://www.messistat.com/img/og-messi.jpg</image:loc>
      <image:title>Lionel Messi Last Goal Video and Highlights (Goal #${LG_NUM} vs ${LG_OPP})</image:title>
      <image:caption>Watch Lionel Messi score Goal #${LG_NUM} of his career for ${LG_TEAM} against ${LG_OPP} in ${LG_COMP} on ${LG_DATE}.</image:caption>
      <image:geo_location>Miami, Florida, United States</image:geo_location>
    </image:image>`
};

const videoMeta = {
  en: {
    title: `Lionel Messi Last Goal Video: Goal #${LG_NUM} vs ${LG_OPP}`,
    desc: `Watch Lionel Messi's Goal #${LG_NUM}: a ${LG_FINISH.toLowerCase()} goal for ${LG_TEAM} vs ${LG_OPP} in ${LG_COMP} on ${LG_DATE}.`,
    tags: ["Lionel Messi", `Goal ${LG_NUM}`, LG_OPP_TAG, LG_COMP, "Messi Last Goal"]
  },
  es: {
    title: `Último Gol de Lionel Messi: Gol #${LG_NUM} contra ${LG_OPP}`,
    desc: `Mira el gol #${LG_NUM} de Lionel Messi: gol de ${LG_FINISH.toLowerCase()} para ${LG_TEAM} contra ${LG_OPP} en ${LG_COMP} el ${LG_DATE}.`,
    tags: ["Lionel Messi", `Gol ${LG_NUM}`, LG_OPP_TAG, LG_COMP, "Último gol de Messi"]
  },
  pt: {
    title: `Último Gol de Lionel Messi: Gol #${LG_NUM} contra ${LG_OPP}`,
    desc: `Veja o gol #${LG_NUM} de Lionel Messi: gol de ${LG_FINISH.toLowerCase()} pelo ${LG_TEAM} contra ${LG_OPP} na ${LG_COMP} em ${LG_DATE}.`,
    tags: ["Lionel Messi", `Gol ${LG_NUM}`, LG_OPP_TAG, LG_COMP, "Último gol do Messi"]
  },
  fr: {
    title: `Dernier But de Lionel Messi : But #${LG_NUM} contre ${LG_OPP}`,
    desc: `Regardez le but #${LG_NUM} de Lionel Messi : une frappe ${LG_FINISH.toLowerCase()} pour ${LG_TEAM} contre ${LG_OPP} en ${LG_COMP} le ${LG_DATE}.`,
    tags: ["Lionel Messi", `But ${LG_NUM}`, LG_OPP_TAG, LG_COMP, "Dernier but de Messi"]
  }
};

function getVideoXml(lang) {
  const v = videoMeta[lang];
  if (!v) return "";
  const tagLines = v.tags.map(t => `      <video:tag>${t}</video:tag>`).join("\n");
  return `    <video:video>
      <video:thumbnail_loc>https://www.messistat.com/img/og-messi.jpg</video:thumbnail_loc>
      <video:title>${v.title}</video:title>
      <video:description>${v.desc}</video:description>
      <video:content_loc>${LG_VIDEO}</video:content_loc>
      <video:duration>35</video:duration>
      <video:publication_date>${LG?.date || todayIso}T22:00:00Z</video:publication_date>
      <video:family_friendly>yes</video:family_friendly>
${tagLines}
      <video:category>Sports</video:category>
      <video:uploader info="https://www.messistat.com">MessiStats Official</video:uploader>
    </video:video>`;
}

for (const sub of SUBPAGES) {
  const imgXml = enImages[sub.slug] ? `\n${enImages[sub.slug]}` : "";
  const vidXml = sub.slug === "latest-goal" ? `\n${getVideoXml("en")}` : "";
  urlBlocks.push(`  <url>
    <loc>https://www.messistat.com/en/${sub.slug}</loc>
    <lastmod>${sub.lastmod || "2026-09-18"}</lastmod>
    <changefreq>${sub.changefreq}</changefreq>
    <priority>${sub.priority}</priority>
${getHreflangsXml("/" + sub.slug)}${imgXml}${vidXml}
  </url>`);
}

// 2b. English-only hub for all 366 day pages.
// Deliberately NOT in SUBPAGES: that array is reused for the other three
// languages, and /es/days, /pt/days, /fr/days do not exist. The day pages
// themselves are English-only too, so their hreflangs stay x-default+en.
urlBlocks.push(`  <url>
    <loc>https://www.messistat.com/en/days</loc>
    <lastmod>${todayIso}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`);

// 3. Other languages: Homepage + Subpages
// Number rendering per locale (each remaining locale uses its group separator).
const groupNum = (n, sep) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, sep);
const APPS_SEP = { en: ",", es: ".", pt: ".", fr: " " };
const num = (_l, n) => String(n);
const appsNum = (l) => groupNum(CAREER_APPS, APPS_SEP[l] || ",");
const trophyNum = (l) => num(l, CAREER_TROPHIES);
const ballonNum = (l) => num(l, BALLONS_DOR);

const langHomeMeta = {
  es: {
    priority: "1.0",
    title: `Goles de Messi: ${num("es", CAREER_GOALS)} Goles Oficiales en Vivo`,
    caption: `Estadísticas completas de la carrera de Lionel Messi: ${num("es", CAREER_GOALS)} goles en ${appsNum("es")} partidos oficiales, ${trophyNum("es")} títulos colectivos y ${ballonNum("es")} Balones de Oro.`
  },
  pt: {
    priority: "0.95",
    title: `Gols de Messi: ${num("pt", CAREER_GOALS)} Gols Oficiais ao Vivo`,
    caption: `Estatísticas completas da carreira de Lionel Messi: ${num("pt", CAREER_GOALS)} gols em ${appsNum("pt")} jogos oficiais, ${trophyNum("pt")} títulos coletivos e ${ballonNum("pt")} Bolas de Ouro.`
  },
  fr: {
    priority: "0.95",
    title: `Buts de Messi : ${num("fr", CAREER_GOALS)} Buts Officiels en Direct`,
    caption: `Statistiques complètes de la carrière de Lionel Messi : ${num("fr", CAREER_GOALS)} buts en ${appsNum("fr")} matchs officiels, ${trophyNum("fr")} trophées collectifs et ${ballonNum("fr")} Ballons d'Or.`
  }
};

for (const lang of ["es", "pt", "fr"]) {
  const meta = langHomeMeta[lang];
  // Homepage
  urlBlocks.push(`  <url>
    <loc>https://www.messistat.com/${lang}</loc>
    <lastmod>${todayIso}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${meta.priority}</priority>
${getHreflangsXml("")}
    <image:image>
      <image:loc>https://www.messistat.com/img/logo.png</image:loc>
      <image:title>MessiStat Official Logo</image:title>
      <image:caption>MessiStat - Lionel Messi Career Statistics and Analytics</image:caption>
    </image:image>
    <image:image>
      <image:loc>https://www.messistat.com/img/og-messi.jpg</image:loc>
      <image:title>${meta.title}</image:title>
      <image:caption>${meta.caption}</image:caption>
    </image:image>
  </url>`);

  // 8 Subpages
  for (const sub of SUBPAGES) {
    const vidXml = sub.slug === "latest-goal" ? `\n${getVideoXml(lang)}` : "";
    urlBlocks.push(`  <url>
    <loc>https://www.messistat.com/${lang}/${sub.slug}</loc>
    <lastmod>${sub.lastmod || todayIso}</lastmod>
    <changefreq>${sub.changefreq}</changefreq>
    <priority>${sub.priority}</priority>
${getHreflangsXml("/" + sub.slug)}${vidXml}
  </url>`);
  }
}

// 5. Programmatic Birthday Pages (high-value only: days with goals + Messi's birthday)
const dataPath = path.join(rootDir, "public", "data", "birthday-goals.json");
if (fs.existsSync(dataPath)) {
  const bdayData = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  const days = bdayData.calendar || bdayData.days || {};
  const keys = Object.keys(days);
  for (const key of keys) {
    const day = days[key];
    const hasGoals = (day.goalsCount || 0) > 0;
    const isMessiBday = day.month === 6 && day.day === 24;
    if (hasGoals || isMessiBday) {
      let dayLastmod = "2026-09-18";
      if (day.matches && day.matches.length) {
        const dates = day.matches.map(m => m.date).filter(Boolean).sort();
        if (dates.length) {
          dayLastmod = dates[dates.length - 1];
        }
      }
      urlBlocks.push(`  <url>
    <loc>https://www.messistat.com/en/birthday/${key}</loc>
    <lastmod>${dayLastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.75</priority>
  </url>`);
    }
  }
}

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urlBlocks.join("\n")}
</urlset>
`;

fs.writeFileSync(publicSitemap, sitemapXml, "utf8");
console.log(`Generated public/sitemap.xml with ${urlBlocks.length} URLs`);

if (fs.existsSync(distSitemap)) {
  fs.writeFileSync(distSitemap, sitemapXml, "utf8");
  console.log(`Updated dist/sitemap.xml with ${urlBlocks.length} URLs`);
}
