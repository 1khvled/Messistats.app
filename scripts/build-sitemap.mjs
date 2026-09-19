import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const publicSitemap = path.join(rootDir, "public", "sitemap.xml");
const distSitemap = path.join(rootDir, "dist", "sitemap.xml");

const LANGS = ["en", "es", "pt", "fr", "ar", "bn", "hi", "ro", "uz"];

const SUBPAGES = [
  { slug: "dashboard", changefreq: "daily", priority: "0.9" },
  { slug: "birthday", changefreq: "daily", priority: "0.95" },
  { slug: "goalsbyseason", changefreq: "weekly", priority: "0.9" },
  { slug: "goalsbyyear", changefreq: "weekly", priority: "0.9" },
  { slug: "messi-vs-ronaldo", changefreq: "weekly", priority: "0.9" },
  { slug: "vs-real-madrid", changefreq: "weekly", priority: "0.9" },
  { slug: "champions-league", changefreq: "monthly", priority: "0.9" },
  { slug: "latest-goal", changefreq: "daily", priority: "0.95" },
  { slug: "timeline", changefreq: "monthly", priority: "0.85" },
  { slug: "achievements", changefreq: "monthly", priority: "0.85" }
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
    `    <xhtml:link rel="alternate" hreflang="ar" href="https://www.messistat.com/ar${slugPath}" />`,
    `    <xhtml:link rel="alternate" hreflang="ar-EG" href="https://www.messistat.com/ar${slugPath}" />`,
    `    <xhtml:link rel="alternate" hreflang="bn" href="https://www.messistat.com/bn${slugPath}" />`,
    `    <xhtml:link rel="alternate" hreflang="bn-BD" href="https://www.messistat.com/bn${slugPath}" />`,
    `    <xhtml:link rel="alternate" hreflang="bn-IN" href="https://www.messistat.com/bn${slugPath}" />`,
    `    <xhtml:link rel="alternate" hreflang="hi" href="https://www.messistat.com/hi${slugPath}" />`,
    `    <xhtml:link rel="alternate" hreflang="hi-IN" href="https://www.messistat.com/hi${slugPath}" />`,
    `    <xhtml:link rel="alternate" hreflang="ro" href="https://www.messistat.com/ro${slugPath}" />`,
    `    <xhtml:link rel="alternate" hreflang="ro-RO" href="https://www.messistat.com/ro${slugPath}" />`,
    `    <xhtml:link rel="alternate" hreflang="uz" href="https://www.messistat.com/uz${slugPath}" />`,
    `    <xhtml:link rel="alternate" hreflang="uz-UZ" href="https://www.messistat.com/uz${slugPath}" />`,
    `    <xhtml:link rel="alternate" hreflang="x-default" href="https://www.messistat.com/en${slugPath}" />`
  ].join("\n");
}

const urlBlocks = [];

// 1. English Homepage
urlBlocks.push(`  <url>
    <loc>https://www.messistat.com/en</loc>
    <lastmod>2026-09-18</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
${getHreflangsXml("")}
    <image:image>
      <image:loc>https://www.messistat.com/img/logo.png</image:loc>
      <image:title>MessiStats Official Logo</image:title>
      <image:caption>MessiStats - Lionel Messi Career Statistics and Analytics</image:caption>
    </image:image>
    <image:image>
      <image:loc>https://www.messistat.com/img/messi.jpg</image:loc>
      <image:title>Lionel Messi Inter Miami CF 2026</image:title>
      <image:caption>Lionel Messi wearing the captain's armband for Inter Miami CF during the 2026 season.</image:caption>
      <image:geo_location>Miami, Florida, United States</image:geo_location>
    </image:image>
    <image:image>
      <image:loc>https://www.messistat.com/img/og-messi.jpg</image:loc>
      <image:title>Lionel Messi 929 Career Goals Official Stats</image:title>
      <image:caption>Lionel Messi career overview: 929 goals in 1,175 senior appearances, 46 trophies, 8 Ballons d'Or.</image:caption>
    </image:image>
  </url>`);

// 2. English Subpages
const enImages = {
  timeline: `    <image:image>
      <image:loc>https://www.messistat.com/img/era-2008-olympic.jpg</image:loc>
      <image:title>Lionel Messi Olympic Gold &amp; Barcelona Breakthrough (2004–2008)</image:title>
      <image:caption>Lionel Messi celebrating his breakthrough years and Olympic Gold medal with Argentina.</image:caption>
      <image:geo_location>Beijing, China / Barcelona, Spain</image:geo_location>
    </image:image>
    <image:image>
      <image:loc>https://www.messistat.com/img/era-2011-wembley.jpg</image:loc>
      <image:title>Lionel Messi Champions League Final at Wembley (2011)</image:title>
      <image:caption>Messi holding the European Cup after the 2011 Champions League final win at Wembley.</image:caption>
      <image:geo_location>London, United Kingdom</image:geo_location>
    </image:image>
    <image:image>
      <image:loc>https://www.messistat.com/img/era-2012-ballon.jpg</image:loc>
      <image:title>Lionel Messi World-Record 91 Goals in 2012</image:title>
      <image:caption>Lionel Messi holding his fourth consecutive Ballon d'Or trophy after his 91-goal world record in 2012.</image:caption>
      <image:geo_location>Zurich, Switzerland</image:geo_location>
    </image:image>
    <image:image>
      <image:loc>https://www.messistat.com/img/era-2016.jpg</image:loc>
      <image:title>Lionel Messi 500th Goal Celebration at Santiago Bernabéu (2017)</image:title>
      <image:caption>Lionel Messi holding up his number 10 shirt after scoring his 500th Barcelona goal in El Clásico.</image:caption>
      <image:geo_location>Madrid, Spain</image:geo_location>
    </image:image>
    <image:image>
      <image:loc>https://www.messistat.com/img/era-2021-psg-signing.jpg</image:loc>
      <image:title>Lionel Messi Paris Saint-Germain (2021–2023)</image:title>
      <image:caption>Lionel Messi signing for Paris Saint-Germain at Parc des Princes.</image:caption>
      <image:geo_location>Paris, France</image:geo_location>
    </image:image>
    <image:image>
      <image:loc>https://www.messistat.com/img/era-2022.jpg</image:loc>
      <image:title>Lionel Messi FIFA World Cup Champion Lusail 2022</image:title>
      <image:caption>Lionel Messi lifted on Agüero's shoulders celebrating the 2022 World Cup win at Lusail.</image:caption>
      <image:geo_location>Lusail, Qatar</image:geo_location>
    </image:image>
    <image:image>
      <image:loc>https://www.messistat.com/img/era-2023-miami.jpg</image:loc>
      <image:title>Lionel Messi Inter Miami CF (2023–2026)</image:title>
      <image:caption>Lionel Messi unveiled as Inter Miami number 10 alongside David Beckham.</image:caption>
      <image:geo_location>Fort Lauderdale, Florida, United States</image:geo_location>
    </image:image>`,
  achievements: `    <image:image>
      <image:loc>https://www.messistat.com/img/cab-ballon.jpg</image:loc>
      <image:title>Lionel Messi Record 8 Ballons d'Or</image:title>
      <image:caption>Lionel Messi celebrating his record 8th Ballon d'Or award (2009, 2010, 2011, 2012, 2015, 2019, 2021, 2023).</image:caption>
      <image:geo_location>Paris, France</image:geo_location>
    </image:image>
    <image:image>
      <image:loc>https://www.messistat.com/img/cab-wc.jpg</image:loc>
      <image:title>Lionel Messi FIFA World Cup Trophy 2022</image:title>
      <image:caption>Lionel Messi lifting the FIFA World Cup trophy after Argentina's final victory against France in Qatar.</image:caption>
      <image:geo_location>Lusail, Qatar</image:geo_location>
    </image:image>
    <image:image>
      <image:loc>https://www.messistat.com/img/cab-ucl.jpg</image:loc>
      <image:title>Lionel Messi UEFA Champions League Trophies</image:title>
      <image:caption>Lionel Messi celebrating one of his 4 UEFA Champions League titles with FC Barcelona (2006, 2009, 2011, 2015).</image:caption>
      <image:geo_location>Rome, Italy / London, UK / Berlin, Germany</image:geo_location>
    </image:image>
    <image:image>
      <image:loc>https://www.messistat.com/img/cab-copa.jpg</image:loc>
      <image:title>Lionel Messi Copa América Champion</image:title>
      <image:caption>Lionel Messi celebrating continental championship with Argentina at Copa América (2021 and 2024).</image:caption>
      <image:geo_location>Rio de Janeiro, Brazil / Miami, USA</image:geo_location>
    </image:image>
    <image:image>
      <image:loc>https://www.messistat.com/img/cab-liga.jpg</image:loc>
      <image:title>Lionel Messi 10 La Liga Championships</image:title>
      <image:caption>Lionel Messi celebrating domestic league supremacy with 10 La Liga titles at FC Barcelona.</image:caption>
      <image:geo_location>Barcelona, Spain</image:geo_location>
    </image:image>`,
  birthday: `    <image:image>
      <image:loc>https://www.messistat.com/img/og-messi.jpg</image:loc>
      <image:title>Lionel Messi Birthday Goal Explorer: 929 Career Goals Across 366 Days</image:title>
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
      <image:loc>https://www.messistat.com/img/era-2011-wembley.jpg</image:loc>
      <image:title>Lionel Messi Champions League Goals</image:title>
      <image:caption>Lionel Messi UEFA Champions League statistics: 129 goals in 163 matches and 4 European titles.</image:caption>
    </image:image>`,
  "latest-goal": `    <image:image>
      <image:loc>https://www.messistat.com/img/og-messi.jpg</image:loc>
      <image:title>Lionel Messi Last Goal Video and Highlights (Goal #928 vs Nashville SC)</image:title>
      <image:caption>Watch Lionel Messi's most recent official senior goal replay and match statistics.</image:caption>
      <image:geo_location>Miami, Florida, United States</image:geo_location>
    </image:image>`
};

for (const sub of SUBPAGES) {
  const imgXml = enImages[sub.slug] ? `\n${enImages[sub.slug]}` : "";
  urlBlocks.push(`  <url>
    <loc>https://www.messistat.com/en/${sub.slug}</loc>
    <lastmod>2026-09-18</lastmod>
    <changefreq>${sub.changefreq}</changefreq>
    <priority>${sub.priority}</priority>
${getHreflangsXml("/" + sub.slug)}${imgXml}
  </url>`);
}

// 3. Other languages: Homepage + Subpages
const langHomeMeta = {
  es: {
    priority: "1.0",
    title: "Goles de Messi: 929 Goles Oficiales en Vivo",
    caption: "Estadísticas completas de la carrera de Lionel Messi: 929 goles en 1.175 partidos oficiales, 46 títulos colectivos y 8 Balones de Oro."
  },
  pt: {
    priority: "0.95",
    title: "Gols de Messi: 929 Gols Oficiais ao Vivo",
    caption: "Estatísticas completas da carreira de Lionel Messi: 929 gols em 1.175 jogos oficiais, 46 títulos coletivos e 8 Bolas de Ouro."
  },
  fr: {
    priority: "0.95",
    title: "Buts de Messi : 929 Buts Officiels en Direct",
    caption: "Statistiques complètes de la carrière de Lionel Messi : 929 buts en 1 175 matchs officiels, 46 trophées collectifs et 8 Ballons d'Or."
  },
  ar: {
    priority: "0.95",
    title: "أهداف ميسي: 929 هدفاً رسمياً مباشر",
    caption: "إحصائيات مسيرة ليونيل ميسي الرسمية: 929 هدفاً في 1,175 مباراة، 46 بطولة و8 كرات ذهبية."
  },
  bn: {
    priority: "0.95",
    title: "মেসির মোট গোল: ৯২৯ গোল লাইভ ট্র্যাকার",
    caption: "লিওনেল মেসির অফিসিয়াল ক্যারিয়ার পরিসংখ্যান: ১,১৭৫ ম্যাচে ৯২৯ গোল, ৪৬টি শিরোপা এবং ৮টি ব্যালন ডি'অর।"
  },
  hi: {
    priority: "0.95",
    title: "मेसी के कुल गोल: 929 आधिकारिक गोल लाइव",
    caption: "लियोनेल मेसी के करियर के आधिकारिक आंकड़े: 1,175 मैचों में 929 गोल, 46 ट्रॉफियां और 8 बैलन डी'ऑर।"
  },
  ro: {
    priority: "0.95",
    title: "Goluri Messi: 929 Goluri Oficiale Live",
    caption: "Statisticile complete ale carierei lui Lionel Messi: 929 goluri în 1.175 meciuri oficiale, 46 trofee și 8 Baloane de Aur."
  },
  uz: {
    priority: "0.95",
    title: "Messi gollari: 929 ta rasmiy gol",
    caption: "Lionel Messining toʻliq rasmiy statistikasi: 1 175 ta oʻyinda 929 ta gol, 46 ta sovrin va 8 ta Oltin toʻp."
  }
};

for (const lang of ["es", "pt", "fr", "ar", "bn", "hi", "ro", "uz"]) {
  const meta = langHomeMeta[lang];
  // Homepage
  urlBlocks.push(`  <url>
    <loc>https://www.messistat.com/${lang}</loc>
    <lastmod>2026-09-18</lastmod>
    <changefreq>daily</changefreq>
    <priority>${meta.priority}</priority>
${getHreflangsXml("")}
    <image:image>
      <image:loc>https://www.messistat.com/img/og-messi.jpg</image:loc>
      <image:title>${meta.title}</image:title>
      <image:caption>${meta.caption}</image:caption>
    </image:image>
  </url>`);

  // 8 Subpages
  for (const sub of SUBPAGES) {
    urlBlocks.push(`  <url>
    <loc>https://www.messistat.com/${lang}/${sub.slug}</loc>
    <lastmod>2026-09-18</lastmod>
    <changefreq>${sub.changefreq}</changefreq>
    <priority>${sub.priority}</priority>
${getHreflangsXml("/" + sub.slug)}
  </url>`);
  }
}

// 5. Programmatic Birthday Pages (366 days)
const dataPath = path.join(rootDir, "public", "data", "birthday-goals.json");
if (fs.existsSync(dataPath)) {
  const bdayData = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  const days = bdayData.calendar || bdayData.days || {};
  const keys = Object.keys(days);
  for (const key of keys) {
    urlBlocks.push(`  <url>
    <loc>https://www.messistat.com/en/birthday/${key}</loc>
    <lastmod>2026-09-18</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.75</priority>
  </url>`);
  }
}

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlBlocks.join("\n")}
</urlset>
`;

fs.writeFileSync(publicSitemap, sitemapXml, "utf8");
console.log(`Generated public/sitemap.xml with ${urlBlocks.length} URLs`);

if (fs.existsSync(distSitemap)) {
  fs.writeFileSync(distSitemap, sitemapXml, "utf8");
  console.log(`Updated dist/sitemap.xml with ${urlBlocks.length} URLs`);
}
