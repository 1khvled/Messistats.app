import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const publicSitemap = path.join(rootDir, "public", "sitemap.xml");
const distSitemap = path.join(rootDir, "dist", "sitemap.xml");

const LANGS = ["en", "es", "pt", "fr", "ar", "bn", "hi", "ro", "uz"];

const todayIso = new Date().toISOString().split("T")[0];

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
  { slug: "achievements", changefreq: "monthly", priority: "0.85", lastmod: todayIso }
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
      <image:title>Lionel Messi 931 Career Goals Official Stats</image:title>
      <image:caption>Lionel Messi career overview: 931 goals in 1,177 senior appearances, 46 trophies, 8 Ballons d'Or.</image:caption>
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
      <image:title>Lionel Messi Birthday Goal Explorer: 931 Career Goals Across 366 Days</image:title>
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
      <image:title>Lionel Messi Last Goal Video and Highlights (Goal #931 vs Columbus Crew)</image:title>
      <image:caption>Watch Lionel Messi score Goal #931 of his career for Inter Miami against San Diego FC in MLS on 20 September 2026.</image:caption>
      <image:geo_location>Miami, Florida, United States</image:geo_location>
    </image:image>`
};

const videoMeta = {
  en: {
    title: "Lionel Messi Last Goal Video: Goal #931 vs Columbus Crew",
    desc: "Watch Lionel Messi's Goal #931: clinical header for Inter Miami vs Cruz Azul in the 2026 Campeones Cup Final to lift his 46th career trophy.",
    tags: ["Lionel Messi", "Inter Miami", "Goal 931", "Campeones Cup", "Messi Last Goal"]
  },
  es: {
    title: "Último Gol de Lionel Messi: Gol #931 contra Columbus Crew",
    desc: "Mira el gol #931 de Lionel Messi: cabezazo clínico con Inter Miami contra Cruz Azul en la final de la Campeones Cup 2026 para levantar su título número 46.",
    tags: ["Lionel Messi", "Inter Miami", "Gol 931", "Campeones Cup", "Último gol de Messi"]
  },
  pt: {
    title: "Último Gol de Lionel Messi: Gol #931 contra Columbus Crew",
    desc: "Veja o gol #931 de Lionel Messi: cabeceio clínico pelo Inter Miami contra o Cruz Azul na final da Campeones Cup 2026 conquistando seu 46º troféu.",
    tags: ["Lionel Messi", "Inter Miami", "Gol 931", "Campeones Cup", "Último gol do Messi"]
  },
  fr: {
    title: "Dernier But de Lionel Messi : But #931 contre Columbus Crew",
    desc: "Regardez le 929e but de Lionel Messi : tête clinique pour l'Inter Miami contre Cruz Azul en finale de la Campeones Cup 2026 pour soulever son 46e trophée.",
    tags: ["Lionel Messi", "Inter Miami", "But 931", "Campeones Cup", "Dernier but de Messi"]
  },
  ar: {
    title: "فيديو آخر هدف لليونيل ميسي: الهدف 931 ضد كولومبوس كرو",
    desc: "شاهد هدف ليونيل ميسي رقم 931: رأسية متقنة لإنتر ميامي ضد كروز أزول في نهائي كأس الأبطال 2026 ليتوج بلقبه الـ 46 في مسيرته.",
    tags: ["ليونيل ميسي", "إنتر ميامي", "الهدف 931", "كأس الأبطال", "آخر هدف لميسي"]
  },
  bn: {
    title: "লিওনেল মেসির সর্বশেষ গোল ভিডিও: কলম্বাস ক্রুর বিরুদ্ধে ৯৩১তম গোল",
    desc: "লিওনেল মেসির ক্যারিয়ারের ৯৩১তম গোল দেখুন: ২০২৬ ক্যাম্পিওনেস কাপ ফাইনালে ইন্টার মায়ামির হয়ে হেডে গোল করে ক্যারিয়ারের ৪৬তম ট্রফি জয়।",
    tags: ["লিওনেল মেসি", "ইন্টার মায়ামি", "গোল ৯৩১", "ক্যাম্পিওনেস কাপ", "মেসির শেষ গোল"]
  },
  hi: {
    title: "लियोनेल मेसी का आखिरी गोल वीडियो: कोलंबस क्रू के खिलाफ 931वां गोल",
    desc: "लियोनेल मेसी का 931वां करियर गोल देखें: 2026 कैंपियोनेस कप फाइनल में इंटर मियामी के लिए हेडर से शानदार गोल और 46वां करियर खिताब।",
    tags: ["लियोनेल मेसी", "इंटर मियामी", "गोल 931", "कैंपियोनेस कप", "मेसी का आखिरी गोल"]
  },
  ro: {
    title: "Ultimul Gol al lui Lionel Messi: Golul #931 împotriva Columbus Crew",
    desc: "Urmărește golul #931 al lui Lionel Messi: lovitură de cap pentru Inter Miami împotriva Cruz Azul în finala Campeones Cup 2026, ridicând al 46-lea său trofeu.",
    tags: ["Lionel Messi", "Inter Miami", "Gol 931", "Campeones Cup", "Ultimul gol Messi"]
  },
  uz: {
    title: "Lionel Messining so'nggi goli: Columbus Crewga qarshi 931-gol",
    desc: "Lionel Messining 931-golini tomosha qiling: 2026 Campeones Cup finalida Inter Mayami safida bosh bilan urilgan gol va 46-sovrin.",
    tags: ["Lionel Messi", "Inter Mayami", "Gol 931", "Campeones Cup", "Messining oxirgi goli"]
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
      <video:content_loc>https://cdn.messiallgoals.com/Goal931.mp4</video:content_loc>
      <video:duration>35</video:duration>
      <video:publication_date>2026-09-27T23:45:00Z</video:publication_date>
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
// Deliberately NOT in SUBPAGES: that array is reused for the other 8
// languages, and /es/days, /ar/days etc. do not exist. The day pages
// themselves are English-only too, so their hreflangs stay x-default+en.
urlBlocks.push(`  <url>
    <loc>https://www.messistat.com/en/days</loc>
    <lastmod>${todayIso}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`);

// 3. Other languages: Homepage + Subpages
const langHomeMeta = {
  es: {
    priority: "1.0",
    title: "Goles de Messi: 931 Goles Oficiales en Vivo",
    caption: "Estadísticas completas de la carrera de Lionel Messi: 931 goles en 1.177 partidos oficiales, 46 títulos colectivos y 8 Balones de Oro."
  },
  pt: {
    priority: "0.95",
    title: "Gols de Messi: 931 Gols Oficiais ao Vivo",
    caption: "Estatísticas completas da carreira de Lionel Messi: 931 gols em 1.177 jogos oficiais, 46 títulos coletivos e 8 Bolas de Ouro."
  },
  fr: {
    priority: "0.95",
    title: "Buts de Messi : 931 Buts Officiels en Direct",
    caption: "Statistiques complètes de la carrière de Lionel Messi : 931 buts en 1 177 matchs officiels, 46 trophées collectifs et 8 Ballons d'Or."
  },
  ar: {
    priority: "0.95",
    title: "أهداف ميسي: 931 هدفاً رسمياً مباشر",
    caption: "إحصائيات مسيرة ليونيل ميسي الرسمية: 931 هدفاً في 1,177 مباراة، 46 بطولة و8 كرات ذهبية."
  },
  bn: {
    priority: "0.95",
    title: "মেসির মোট গোল: ৯৩১ গোল লাইভ ট্র্যাকার",
    caption: "লিওনেল মেসির অফিসিয়াল ক্যারিয়ার পরিসংখ্যান: ১,১৭৭ ম্যাচে ৯৩১ গোল, ৪৬টি শিরোপা এবং ৮টি ব্যালন ডি'অর।"
  },
  hi: {
    priority: "0.95",
    title: "मेसी के कुल गोल: 931 आधिकारिक गोल लाइव",
    caption: "लियोनेल मेसी के करियर के आधिकारिक आंकड़े: 1,177 मैचों में 931 गोल, 46 ट्रॉफियां और 8 बैलन डी'ऑर।"
  },
  ro: {
    priority: "0.95",
    title: "Goluri Messi: 931 Goluri Oficiale Live",
    caption: "Statisticile complete ale carierei lui Lionel Messi: 931 goluri în 1.177 meciuri oficiale, 46 trofee și 8 Baloane de Aur."
  },
  uz: {
    priority: "0.95",
    title: "Messi gollari: 931 ta rasmiy gol",
    caption: "Lionel Messining toʻliq rasmiy statistikasi: 1 177 ta oʻyinda 931 ta gol, 46 ta sovrin va 8 ta Oltin toʻp."
  }
};

for (const lang of ["es", "pt", "fr", "ar", "bn", "hi", "ro", "uz"]) {
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
