import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const LANGS = ["pt", "fr"];
const PAGES = [
  "birthday.html",
  "goalsbyyear.html",
  "goalsbyseason.html",
  "dashboard.html",
  "timeline.html",
  "achievements.html",
  "messi-vs-ronaldo.html",
  "vs-real-madrid.html"
];

const HOME_NAMES = {
  pt: "Início",
  fr: "Accueil"
};

const PAGE_NAMES = {
  "birthday.html": {
    pt: "Aniversário",
    fr: "Anniversaire"
  },
  "goalsbyyear.html": {
    pt: "Gols por Ano",
    fr: "Buts par Année"
  },
  "goalsbyseason.html": {
    pt: "Temporadas",
    fr: "Saisons"
  },
  "dashboard.html": {
    pt: "Painel",
    fr: "Tableau de bord"
  },
  "timeline.html": {
    pt: "Linha do Tempo",
    fr: "Frise Chronologique"
  },
  "achievements.html": {
    pt: "Títulos",
    fr: "Palmarès"
  },
  "messi-vs-ronaldo.html": {
    pt: "Messi vs Ronaldo",
    fr: "Messi vs Ronaldo"
  },
  "vs-real-madrid.html": {
    pt: "Messi vs Real Madrid",
    fr: "Messi vs Real Madrid"
  }
};

let injectedCount = 0;

for (const lang of LANGS) {
  for (const page of PAGES) {
    const filePath = path.join(rootDir, lang, page);
    if (!fs.existsSync(filePath)) continue;

    let content = fs.readFileSync(filePath, "utf8");
    if (content.includes("application/ld+json")) {
      console.log(`[SKIP] Already has JSON-LD: ${lang}/${page}`);
      continue;
    }

    const slug = page.replace(".html", "");
    const url = `https://www.messistat.com/${lang}/${slug}`;

    // Extract title
    const titleMatch = content.match(/<title>([^<]+)<\/title>/);
    const title = titleMatch ? titleMatch[1].trim() : `Lionel Messi Stats | MessiStats`;

    // Extract description
    const descMatch = content.match(/<meta content="([^"]+)" name="description"\/>/) ||
                      content.match(/<meta name="description" content="([^"]+)"\/>/);
    const description = descMatch ? descMatch[1].trim() : title;

    const homeName = HOME_NAMES[lang] || "Home";
    const pageName = (PAGE_NAMES[page] && PAGE_NAMES[page][lang]) || slug;

    const jsonLd = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          "@id": `${url}#webpage`,
          "url": url,
          "name": title,
          "description": description,
          "dateModified": "2026-09-18",
          "inLanguage": lang,
          "mainEntityOfPage": url
        },
        {
          "@type": "BreadcrumbList",
          "@id": `${url}#breadcrumb`,
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": homeName,
              "item": `https://www.messistat.com/${lang}`
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": pageName,
              "item": url
            }
          ]
        }
      ]
    };

    const scriptTag = `<script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 2)}\n</script>\n`;

    // Inject right after `<link href="/src/styles.css" rel="stylesheet"/>`
    if (content.includes('<link href="/src/styles.css" rel="stylesheet"/>')) {
      content = content.replace(
        '<link href="/src/styles.css" rel="stylesheet"/>',
        `<link href="/src/styles.css" rel="stylesheet"/>\n${scriptTag}`
      );
    } else if (content.includes('</head>')) {
      content = content.replace('</head>', `${scriptTag}</head>`);
    } else {
      console.warn(`[WARN] Could not find insertion point for ${lang}/${page}`);
      continue;
    }

    fs.writeFileSync(filePath, content, "utf8");
    console.log(`[INJECTED] JSON-LD in ${lang}/${page}`);
    injectedCount++;
  }
}

console.log(`\nSuccessfully injected JSON-LD into ${injectedCount} files.`);
