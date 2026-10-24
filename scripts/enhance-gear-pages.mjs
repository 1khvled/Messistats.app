import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const GEAR_DATA = {
  en: {
    title: "Lionel Messi Gear, Official Match Jerseys & Fan Store | MessiStats",
    description: "Explore authentic Lionel Messi match jerseys, Inter Miami CF pink #10 kits, Argentina 3-Star World Cup Champions shirts, Adidas F50 Elite cleats, and collectibles on Amazon. Verified affiliate picks supporting MessiStats.",
    keywords: "Lionel Messi gear, Messi jerseys, Messi Inter Miami jersey 10, Messi Argentina 3 star jersey, Argentina World Cup champions shirt, Adidas F50 Messi cleats, retro Barcelona 2011 jersey, Messi Amazon store, buy Messi shirt, authentic Messi merchandise",
    homeLabel: "Home",
    homeHref: "/en",
    breadcrumbCurrent: "Messi Fan Gear & Official Merch",
    eyebrow: "⚽ OFFICIAL & FAN MERCHANDISE · AMAZON AFFILIATE PICKS",
    h1: "Lionel Messi Gear, Official Match Jerseys & Fan Store",
    lede: "Equip yourself with verified Lionel Messi match jerseys, Argentina 3-Star World Cup kits, Inter Miami #10 apparel, signature Adidas F50 boots, and authentic memorabilia on Amazon. Every purchase through our verified links helps keep MessiStats 100% free, fast, and independently maintained.",
    whyH2: "<span>💖</span> Why Your Support Matters",
    sectionH2: "<span>🛍️</span> Curated Lionel Messi Fan Gear & Official Kits",
    schemaTitle: "Lionel Messi Gear, Official Match Jerseys & Fan Store | MessiStats",
    schemaDesc: "Shop official Lionel Messi jerseys, Inter Miami #10 kits, Argentina 3-Star World Cup shirts, Adidas F50 boots, and collectibles on Amazon.",
    itemListTitle: "Curated Lionel Messi Official Matchwear & Fan Gear"
  },
  es: {
    title: "Camisetas Oficiales de Lionel Messi, Botas y Tienda de Aficionados | MessiStats",
    description: "Compra camisetas oficiales de Lionel Messi, equipación del Inter Miami #10, camisetas de Argentina 3 Estrellas, botas Adidas F50 y coleccionables en Amazon. Apoya a MessiStats.",
    keywords: "camisetas de messi, camiseta messi inter miami 10, camiseta argentina messi 3 estrellas, botas messi adidas f50, equipacion messi, tienda oficial messi amazon, comprar camiseta messi, messistats",
    homeLabel: "Inicio",
    homeHref: "/es",
    breadcrumbCurrent: "Equipación y Camisetas de Lionel Messi",
    eyebrow: "⚽ PRODUCTOS OFICIALES Y DE FANS · SELECCIÓN DE AFILIADOS AMAZON",
    h1: "Equipación Oficial y Camisetas de Lionel Messi | Tienda de Aficionados",
    lede: "Equípate con camisetas oficiales de Lionel Messi, equipaciones de Argentina Tricampeona del Mundo, prendas del Inter Miami nº 10, botas exclusivas Adidas F50 y recuerdos auténticos en Amazon. Cada compra a través de nuestros enlaces verificados ayuda a mantener MessiStats 100% gratuito, rápido e independiente.",
    whyH2: "<span>💖</span> Por qué tu apoyo es fundamental",
    sectionH2: "<span>🛍️</span> Colección Curada de Equipaciones y Productos Oficiales de Messi",
    schemaTitle: "Camisetas Oficiales de Lionel Messi, Botas y Tienda de Aficionados | MessiStats",
    schemaDesc: "Compra camisetas oficiales de Lionel Messi, equipación del Inter Miami #10, camisetas de Argentina 3 Estrellas, botas Adidas F50 y coleccionables en Amazon.",
    itemListTitle: "Colección Oficial de Equipaciones y Camisetas de Lionel Messi"
  },
  pt: {
    title: "Camisas Oficiais de Lionel Messi, Chuteiras e Loja de Fãs | MessiStats",
    description: "Compre camisas oficiais de Lionel Messi, uniforme do Inter Miami nº 10, camisas da Argentina Tricampeã Mundial, chuteiras Adidas F50 e colecionáveis na Amazon. Apoie o MessiStats.",
    keywords: "camisa messi, camisa messi inter miami 10, camisa argentina messi 3 estrelas, chuteiras messi adidas f50, uniforme messi, loja messi amazon, comprar camisa do messi, messistats",
    homeLabel: "Início",
    homeHref: "/pt",
    breadcrumbCurrent: "Camisas e Produtos Oficiais do Messi",
    eyebrow: "⚽ PRODUTOS OFICIAIS E PARA FÃS · SELEÇÃO DE AFILIADOS AMAZON",
    h1: "Equipamentos e Camisas Oficiais de Lionel Messi | Loja de Fãs",
    lede: "Vista as camisas oficiais de Lionel Messi, uniformes da Argentina Tricampeã do Mundo, kits do Inter Miami nº 10, chuteiras exclusivas Adidas F50 e itens de colecionador na Amazon. Cada compra através dos nossos links verificados ajuda a manter o MessiStats 100% gratuito, veloz e independente.",
    whyH2: "<span>💖</span> Por que seu apoio é essencial",
    sectionH2: "<span>🛍️</span> Coleção Selecionada de Camisas e Produtos Oficiais do Messi",
    schemaTitle: "Camisas Oficiais de Lionel Messi, Chuteiras e Loja de Fãs | MessiStats",
    schemaDesc: "Compre camisas oficiais de Lionel Messi, uniforme do Inter Miami nº 10, camisas da Argentina Tricampeã Mundial, chuteiras Adidas F50 e colecionáveis na Amazon.",
    itemListTitle: "Coleção Oficial de Equipamentos e Camisas de Lionel Messi"
  },
  fr: {
    title: "Maillots Officiels de Lionel Messi, Crampons et Boutique Fan | MessiStats",
    description: "Achetez les maillots officiels de Lionel Messi, kits Inter Miami #10, maillots Argentine 3 Étoiles Championne du Monde, crampons Adidas F50 et objets de collection sur Amazon. Soutenez MessiStats.",
    keywords: "maillot messi, maillot messi inter miami 10, maillot argentine messi 3 etoiles, crampons messi adidas f50, boutique lionel messi amazon, acheter maillot messi, messistats",
    homeLabel: "Accueil",
    homeHref: "/fr",
    breadcrumbCurrent: "Maillots et Équipements Officiels de Messi",
    eyebrow: "⚽ MARCHANDISE OFFICIELLE & SUPPORTERS · SÉLECTION AMAZON",
    h1: "Équipements et Maillots Officiels de Lionel Messi | Boutique Fan",
    lede: "Équipez-vous avec les maillots officiels de Lionel Messi, tenues de l'Argentine 3 Étoiles Championne du Monde, maillots de l'Inter Miami #10, crampons Adidas F50 et souvenirs exclusifs sur Amazon. Chaque commande via nos liens vérifiés aide à maintenir MessiStats 100% gratuit, rapide et indépendant.",
    whyH2: "<span>💖</span> Pourquoi votre soutien est essentiel",
    sectionH2: "<span>🛍️</span> Sélection Officielle de Maillots et Équipements de Messi",
    schemaTitle: "Maillots Officiels de Lionel Messi, Crampons et Boutique Fan | MessiStats",
    schemaDesc: "Achetez les maillots officiels de Lionel Messi, kits Inter Miami #10, maillots Argentine 3 Étoiles Championne du Monde, crampons Adidas F50 et objets de collection sur Amazon.",
    itemListTitle: "Sélection Officielle de Maillots et Équipements de Lionel Messi"
  }
};

function generateJsonLd(lang, data) {
  const pageUrl = `https://www.messistat.com/${lang}/gear`;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        "url": pageUrl,
        "name": data.schemaTitle,
        "description": data.schemaDesc,
        "breadcrumb": {
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": data.homeLabel,
              "item": `https://www.messistat.com/${lang}`
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": data.breadcrumbCurrent,
              "item": pageUrl
            }
          ]
        }
      },
      {
        "@type": "ItemList",
        "@id": `${pageUrl}#itemlist`,
        "name": data.itemListTitle,
        "itemListOrder": "https://schema.org/ItemListOrderAscending",
        "numberOfItems": 18
      }
    ]
  };
  return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;
}

for (const [lang, d] of Object.entries(GEAR_DATA)) {
  const filePath = lang === "en" ? path.join(rootDir, "gear.html") : path.join(rootDir, lang, "gear.html");
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    continue;
  }

  let html = fs.readFileSync(filePath, "utf8");

  // 1. Update Title, Description, Keywords
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${d.title}</title>`);
  
  const metaDescTag = `<meta content="${d.description.replace(/"/g, '&quot;')}" name="description"/>`;
  if (/<meta[^>]+name=["']description["'][^>]*>/i.test(html)) {
    html = html.replace(/<meta[^>]+name=["']description["'][^>]*>/i, metaDescTag);
  }
  
  const metaKeywordsTag = `<meta content="${d.keywords.replace(/"/g, '&quot;')}" name="keywords"/>`;
  if (/<meta[^>]+name=["']keywords["'][^>]*>/i.test(html)) {
    html = html.replace(/<meta[^>]+name=["']keywords["'][^>]*>/i, metaKeywordsTag);
  } else {
    html = html.replace(/(<meta[^>]+name=["']description["'][^>]*>)/i, `$1\n${metaKeywordsTag}`);
  }

  // 2. Update OG meta
  html = html.replace(/<meta[^>]+property=["']og:title["'][^>]*>/i, `<meta content="${d.title.replace(/"/g, '&quot;')}" property="og:title"/>`);
  html = html.replace(/<meta[^>]+property=["']og:description["'][^>]*>/i, `<meta content="${d.description.replace(/"/g, '&quot;')}" property="og:description"/>`);
  html = html.replace(/<meta[^>]+property=["']og:url["'][^>]*>/i, `<meta content="https://www.messistat.com/${lang}/gear" property="og:url"/>`);
  html = html.replace(/<meta[^>]+name=["']twitter:title["'][^>]*>/i, `<meta content="${d.title.replace(/"/g, '&quot;')}" name="twitter:title"/>`);
  html = html.replace(/<meta[^>]+name=["']twitter:description["'][^>]*>/i, `<meta content="${d.description.replace(/"/g, '&quot;')}" name="twitter:description"/>`);

  // 3. Remove existing ld+json schemas in head and replace with clean one
  html = html.replace(/<script type=["']application\/ld\+json["']>[\s\S]*?<\/script>\s*/gi, "");
  
  // Ensure theme script is properly closed before inject
  const properThemeScript = `<script>
  (function() {
    try {
      const saved = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (saved === 'dark' || (!saved && prefersDark)) {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    } catch(e) {}
  })();
</script>`;
  html = html.replace(/<script>\s*\(function\(\)\s*\{[\s\S]*?\}\)\(\);\s*<\/script>/i, properThemeScript);

  // Inject fresh JSON-LD right before </head>
  const jsonLdBlock = generateJsonLd(lang, d);
  html = html.replace(/<\/head>/i, `${jsonLdBlock}\n</head>`);

  // 4. Update Hero: Breadcrumbs, Eyebrow, H1, Lede
  const heroRegex = /<div class=["']gear-hero["']>[\s\S]*?<\/div>\s*<!--/i;
  const newHero = `<div class="gear-hero">
  <div class="gear-breadcrumbs">
    <a href="${d.homeHref}">${d.homeLabel}</a>
    <span>/</span>
    <span>${d.breadcrumbCurrent}</span>
  </div>
  <div class="gear-eyebrow">
    <span>${d.eyebrow}</span>
  </div>
  <h1 class="gear-title">${d.h1}</h1>
  <p class="gear-lede">
    ${d.lede}
  </p>
</div>\n\n<!--`;
  html = html.replace(heroRegex, newHero);

  // 5. Update Why Support H2 in impact banner
  html = html.replace(/<div class=["']impact-info["']>\s*<h2>[\s\S]*?<\/h2>/i, `<div class="impact-info">\n      <h2>${d.whyH2}</h2>`);

  // 6. Section H2 above toolbar
  // Remove existing .gear-section-heading if any
  html = html.replace(/<!-- Products Section Heading -->\s*<h2 class=["']gear-section-heading["']>[\s\S]*?<\/h2>\s*/gi, "");
  html = html.replace(/<h2 class=["']gear-section-heading["']>[\s\S]*?<\/h2>\s*/gi, "");

  const sectionH2Block = `<!-- Products Section Heading -->\n<h2 class="gear-section-heading">${d.sectionH2}</h2>\n\n`;
  html = html.replace(/(<!-- Toolbar: Filter Tabs & Live Search -->)/i, `${sectionH2Block}$1`);

  fs.writeFileSync(filePath, html, "utf8");
  console.log(`Updated and enhanced SEO headings & Schema for ${lang}/gear.html`);
}
