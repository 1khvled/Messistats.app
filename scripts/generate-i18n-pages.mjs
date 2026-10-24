// Generator for localized subpages across Portuguese and French.
// Run with: node scripts/generate-i18n-pages.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const LANGS = {
  es: {
    code: "es",
    name: "Español",
    tag: "ES",
    dir: "ltr",
    ogLocale: "es_ES",
    ogLocaleAlt: "es_AR",
    dateStr: "18 de Septiembre de 2026",
    skip: "Saltar al contenido",
    backToStats: "← Volver a las estadísticas",
    themeToggle: "Alternar tema",
    darkMode: "Modo oscuro",
    adLabel: "Publicidad",
    bdayPromo: {
      badge: "🎂 HERRAMIENTA VIRAL INTERACTIVA",
      title: "¿Marcó Messi en tu cumpleaños?",
      desc: "Busca entre los 366 días del año a lo largo de los 932 goles de Messi. Mira videos de cada gol marcado en tu día especial.",
      btn: "Verificar Mi Cumpleaños ⚽",
      link: "/es/birthday"
    },
    nav: {
      home: "Inicio",
      bday: "Cumpleaños",
      ronaldo: "vs Ronaldo",
      madrid: "vs Real Madrid",
      ucl: "Champions League",
      byyear: "Goles por Año",
      byseason: "Temporadas",
      dashboard: "Panel",
      timeline: "Historia",
      achievements: "Títulos"
    }
  },
  pt: {
    code: "pt",
    name: "Português",
    tag: "PT",
    dir: "ltr",
    ogLocale: "pt_BR",
    ogLocaleAlt: "pt_PT",
    dateStr: "18 de Setembro de 2026",
    skip: "Pular para o conteúdo",
    backToStats: "← Volver às estatísticas",
    themeToggle: "Alternar tema",
    darkMode: "Modo escuro",
    adLabel: "Publicidade",
    bdayPromo: {
      badge: "🎂 FERRAMENTA VIRAL INTERACTIVA",
      title: "¿Marcou Messi no dia do seu aniversário?",
      desc: "Pesquise todos os 366 dias do ano ao longo dos 932 gols da carreira de Messi. Veja vídeos de cada gol marcado no seu dia especial.",
      btn: "Verificar Meu Aniversário ⚽",
      link: "/pt/birthday"
    },
    nav: {
      home: "Início",
      bday: "Aniversário",
      ronaldo: "vs Ronaldo",
      madrid: "vs Real Madrid",
      ucl: "Champions League",
      byyear: "Gols por Ano",
      byseason: "Temporadas",
      dashboard: "Painel",
      timeline: "História",
      achievements: "Títulos"
    }
  },
  fr: {
    code: "fr",
    name: "Français",
    tag: "FR",
    dir: "ltr",
    ogLocale: "fr_FR",
    ogLocaleAlt: "fr_CA",
    dateStr: "18 Septembre 2026",
    skip: "Passer au contenu",
    backToStats: "← Retour aux statistiques",
    themeToggle: "Basculer le thème",
    darkMode: "Mode sombre",
    adLabel: "Publicité",
    bdayPromo: {
      badge: "🎂 OUTIL VIRAL INTERACTIF",
      title: "Messi a-t-il marqué le jour de votre anniversaire ?",
      desc: "Recherchez parmi les 366 jours du calendrier à travers les 932 buts de Messi. Regardez les vidéos de chaque but marqué lors de votre jour spécial.",
      btn: "Vérifier Mon Anniversaire ⚽",
      link: "/fr/birthday"
    },
    nav: {
      home: "Accueil",
      bday: "Anniversaire",
      ronaldo: "vs Ronaldo",
      madrid: "vs Real Madrid",
      ucl: "Ligue des Champions",
      byyear: "Buts par Année",
      byseason: "Saisons",
      dashboard: "Tableau de bord",
      timeline: "Histoire",
      achievements: "Palmarès"
    }
  }
};

const ALL_LANG_CODES = ["en", "es", "pt", "fr"];

function renderHreflang(pageSlug) {
  const slugPath = pageSlug === "index" ? "" : `/${pageSlug}`;
  let out = `\n<link rel="canonical" href="https://www.messistat.com/LANG_CODE${slugPath}"/>\n`;
  out += `<link rel="alternate" hreflang="en" href="https://www.messistat.com/en${slugPath}"/>\n`;
  out += `<link rel="alternate" hreflang="en-US" href="https://www.messistat.com/en${slugPath}"/>\n`;
  out += `<link rel="alternate" hreflang="en-NG" href="https://www.messistat.com/en${slugPath}"/>\n`;
  out += `<link rel="alternate" hreflang="en-IN" href="https://www.messistat.com/en${slugPath}"/>\n`;
  out += `<link rel="alternate" hreflang="en-PH" href="https://www.messistat.com/en${slugPath}"/>\n`;
  out += `<link rel="alternate" hreflang="es" href="https://www.messistat.com/es${slugPath}"/>\n`;
  out += `<link rel="alternate" hreflang="es-AR" href="https://www.messistat.com/es${slugPath}"/>\n`;
  out += `<link rel="alternate" hreflang="es-ES" href="https://www.messistat.com/es${slugPath}"/>\n`;
  out += `<link rel="alternate" hreflang="pt" href="https://www.messistat.com/pt${slugPath}"/>\n`;
  out += `<link rel="alternate" hreflang="pt-BR" href="https://www.messistat.com/pt${slugPath}"/>\n`;
  out += `<link rel="alternate" hreflang="pt-PT" href="https://www.messistat.com/pt${slugPath}"/>\n`;
  out += `<link rel="alternate" hreflang="fr" href="https://www.messistat.com/fr${slugPath}"/>\n`;
  out += `<link rel="alternate" hreflang="fr-FR" href="https://www.messistat.com/fr${slugPath}"/>\n`;
  out += `<link rel="alternate" hreflang="fr-NE" href="https://www.messistat.com/fr${slugPath}"/>\n`;
  out += `<link rel="alternate" hreflang="x-default" href="https://www.messistat.com/en${slugPath}"/>\n`;
  return out;
}

function renderRailNav(lang, activeSlug) {
  const L = LANGS[lang];
  const on = (slug) => (activeSlug === slug ? ' class="on"' : "");
  const onAria = (slug) => (activeSlug === slug ? ' aria-current="page" class="on"' : "");
  const onBday = (slug) => (activeSlug === slug ? ' aria-current="page" class="on nav-bday-link"' : ' class="nav-bday-link"');

  return `<aside aria-label="Navigation" class="rail">
<a aria-label="MessiStats" class="rail-badge" href="/${lang}"><svg aria-hidden="true" class="rail-mark" viewbox="0 0 64 64"><defs><lineargradient id="msg-${lang}-${activeSlug}" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#6d0f2e"></stop><stop offset=".55" stop-color="#1d3fae"></stop><stop offset="1" stop-color="#0e7cc0"></stop></lineargradient></defs><path d="M32 3 55 10v20c0 16-11 26-23 31C20 56 9 46 9 30V10Z" fill="url(#msg-${lang}-${activeSlug})" stroke="#e3b93e" stroke-linejoin="round" stroke-width="2.5"></path><path d="M47.5 9.5l1.7 3.5 3.8.6-2.8 2.7.7 3.8-3.4-1.8-3.4 1.8.7-3.8-2.8-2.7 3.8-.6z" fill="#e3b93e"></path><text fill="#fff" font-family="'Plus Jakarta Sans',Arial,sans-serif" font-size="19" font-weight="800" text-anchor="middle" x="31" y="44">M10</text></svg><span class="rail-word">Messi<b>Stats</b></span></a>
<div class="rail-lang-wrap">
  <button type="button" class="rail-lang-btn" id="rail-lang-btn" aria-label="${L.name}" title="${L.name}">
    <svg class="rail-lang-globe" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="2" y1="12" x2="22" y2="12"></line>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
    </svg>
    <span class="rail-lang-label">${L.name}</span>
    <span class="rail-lang-tag">${L.tag}</span>
  </button>
</div>
<nav>
<a${onAria("home")} href="/${lang}" aria-label="${L.nav.home}"><svg aria-hidden="true" viewbox="0 0 24 24"><path d="M3 11.5 12 3l9 8.5"></path><path d="M5.5 10.5V21h5v-6h3v6h5V10.5"></path></svg><span>${L.nav.home}</span></a>
<a${onBday("birthday")} href="/${lang}/birthday" aria-label="${L.nav.bday}"><svg aria-hidden="true" viewbox="0 0 24 24"><rect height="4" rx="1" width="18" x="3" y="8"></rect><path d="M12 8v13M19 12v9H5v-9M7.5 8a2.5 2.5 0 0 1 0-5A4.8 4.8 0 0 1 12 8a4.8 4.8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"></path></svg><span>${L.nav.bday} <b class="nav-badge-hot">HOT 🔥</b></span></a>
<a${onAria("messi-vs-ronaldo")} href="/${lang}/messi-vs-ronaldo" aria-label="${L.nav.ronaldo}"><svg aria-hidden="true" viewbox="0 0 24 24"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1"></path><path d="M18 8l4 4-4 4"></path></svg><span>${L.nav.ronaldo}</span></a>
<a${onAria("vs-real-madrid")} href="/${lang}/vs-real-madrid" aria-label="${L.nav.madrid}"><svg aria-hidden="true" viewbox="0 0 24 24"><path d="M14.5 17.5 3 6V3h3l11.5 11.5"></path><path d="m13 19 6-6"></path><path d="m16 16 4 4"></path><path d="m19 21 2-2"></path></svg><span>${L.nav.madrid}</span></a>
<a${onAria("champions-league")} href="/${lang}/champions-league" aria-label="${L.nav.ucl}"><svg aria-hidden="true" viewbox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg><span>${L.nav.ucl}</span></a>
<a${onAria("byyear")} href="/${lang}/goalsbyyear" aria-label="${L.nav.byyear}"><svg aria-hidden="true" viewbox="0 0 24 24"><rect height="15.5" rx="2.5" width="17" x="3.5" y="5"></rect><path d="M3.5 10h17M8 2.8V6.5M16 2.8V6.5"></path></svg><span>${L.nav.byyear}</span></a>
<a${onAria("byseason")} href="/${lang}/goalsbyseason" aria-label="${L.nav.byseason}"><svg aria-hidden="true" viewbox="0 0 24 24"><rect height="7.5" rx="1.5" width="7.5" x="3.5" y="3.5"></rect><rect height="7.5" rx="1.5" width="7.5" x="13" y="3.5"></rect><rect height="7.5" rx="1.5" width="7.5" x="3.5" y="13"></rect><rect height="7.5" rx="1.5" width="7.5" x="13" y="13"></rect></svg><span>${L.nav.byseason}</span></a>
<a${onAria("dashboard")} href="/${lang}/dashboard" aria-label="${L.nav.dashboard}"><svg aria-hidden="true" viewbox="0 0 24 24"><path d="M3.5 20.5h17"></path><path d="M6.5 20v-7M12 20V5M17.5 20v-10"></path></svg><span>${L.nav.dashboard}</span></a>
<a${onAria("timeline")} href="/${lang}/timeline" aria-label="${L.nav.timeline}"><svg aria-hidden="true" viewbox="0 0 24 24"><circle cx="12" cy="12" r="8.5"></circle><path d="M12 7.5V12l3 2"></path></svg><span>${L.nav.timeline}</span></a>
<a${onAria("achievements")} href="/${lang}/achievements" aria-label="${L.nav.achievements}"><svg aria-hidden="true" viewbox="0 0 24 24"><path d="M8 3.5h8V9a4 4 0 0 1-8 0V3.5Z"></path><path d="M8 5H4.5A1.5 1.5 0 0 0 6 10H8M16 5h3.5A1.5 1.5 0 0 1 18 10h-2M12 13v3.5M8.5 20.5h7M10 16.5h4V20h-4z"></path></svg><span>${L.nav.achievements}</span></a>
</nav>
<button aria-label="${L.themeToggle}" class="theme-toggle" id="theme-toggle" title="${L.themeToggle}" type="button">
<svg aria-hidden="true" class="sun-icon" viewbox="0 0 24 24"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path></svg>
<svg aria-hidden="true" class="moon-icon" viewbox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
<span class="theme-label">${L.darkMode}</span>
</button>
</aside>`;
}

function renderAdSlot(lang) {
  const L = LANGS[lang];
  return `<aside aria-label="${L.adLabel}" class="ad-native-wrap">
<span class="ad-native-label">${L.adLabel}</span>
<div class="ad-native-slot">
<iframe class="safe-ad-frame safe-ad-native" src="/ads/prc-native-6161.html" style="width:100%;height:320px" sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox" title="Advertisement" scrolling="no"></iframe>
</div>
</aside>`;
}

function renderBdayPromo(lang) {
  const L = LANGS[lang];
  return `<aside class="bday-promo-card" aria-label="${L.bdayPromo.title}">
  <div class="bday-promo-badge">${L.bdayPromo.badge}</div>
  <div class="bday-promo-body">
    <div class="bday-promo-text">
      <h3>${L.bdayPromo.title}</h3>
      <p>${L.bdayPromo.desc}</p>
    </div>
    <a href="${L.bdayPromo.link}" class="btn btn-primary bday-promo-btn">${L.bdayPromo.btn}</a>
  </div>
</aside>`;
}

function renderHeadBoilerplate(lang, pageSlug, title, desc, keywords) {
  const L = LANGS[lang];
  const hreflangs = renderHreflang(pageSlug).replace(/LANG_CODE/g, lang);
  return `<!DOCTYPE html>
<html lang="${lang}" dir="${L.dir}">
<head>
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-FERBLJWWWZ"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-FERBLJWWWZ');
</script>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1, viewport-fit=cover" name="viewport"/>
<title>${title} | MessiStats</title>
<meta content="${desc}" name="description"/>
<meta content="${keywords || 'messi, messi stats, lionel messi, 932 goals, messi goals'}" name="keywords"/>
${hreflangs}
<meta content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" name="robots"/>
<meta content="#16243a" name="theme-color"/>
<meta content="MessiStat" name="author"/>
<meta content="website" property="og:type"/>
<meta content="MessiStat" property="og:site_name"/>
<meta content="${L.ogLocale}" property="og:locale"/>
<meta content="${L.ogLocaleAlt}" property="og:locale:alternate"/>
<meta content="${title} | MessiStat" property="og:title"/>
<meta content="${desc}" property="og:description"/>
<meta content="https://www.messistat.com/${lang}/${pageSlug === 'index' ? '' : pageSlug}" property="og:url"/>
<meta content="https://www.messistat.com/img/og-messi.jpg?v=932" property="og:image"/>
<meta content="https://www.messistat.com/img/og-messi.jpg?v=932" property="og:image:secure_url"/>
<meta content="1200" property="og:image:width"/>
<meta content="630" property="og:image:height"/>
<meta content="summary_large_image" name="twitter:card"/>
<meta content="@messistat1" name="twitter:site"/>
<meta content="@messistat1" name="twitter:creator"/>
<meta content="messistat.com" name="twitter:domain"/>
<meta content="${title} | MessiStat" name="twitter:title"/>
<meta content="${desc}" name="twitter:description"/>
<meta content="https://www.messistat.com/img/og-messi.jpg?v=932" name="twitter:image"/>
<link rel="icon" href="/favicon.ico" sizes="48x48"/>
<link rel="icon" href="/favicon.svg" type="image/svg+xml"/>
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"/>
<link rel="manifest" href="/site.webmanifest"/>
<link as="font" crossorigin="" href="/fonts/plus-jakarta-sans-latin.woff2" rel="preload" type="font/woff2"/>
<link as="font" crossorigin="" href="/fonts/dm-sans-latin.woff2" rel="preload" type="font/woff2"/>
<script src="/js/ad-guard.js"></script>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8397501846754760" crossorigin="anonymous"></script>
<link href="/src/styles.css" rel="stylesheet"/>
<script>
  (function() {
    try {
      const saved = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (saved === 'dark' || (!saved && prefersDark)) {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    } catch(e) {}
  })();
</script>
</head>`;
}

// -------------------------------------------------------------
// PAGE TEMPLATES
// -------------------------------------------------------------

// 1. DASHBOARD
function generateDashboard(lang) {
  const L = LANGS[lang];
  const dict = {
    pt: {
      title: "Painel Interativo de Estatísticas de Lionel Messi",
      desc: "Painel interativo da carreira de Lionel Messi: 932 gols filtráveis por Barcelona, PSG, Inter Miami e Seleção Argentina.",
      h1: "Painel de Estatísticas de Lionel Messi",
      lede: "Análise interativa dos 932 gols na carreira de Lionel Messi em todas as competições, temporadas, tipos de finalização e partes do corpo — filtrável por equipe.",
      compTitle: "¿Em quais competições Messi marcou mais gols?",
      seasonTitle: "¿Como mudou seu ritmo de gols temporada após temporada?",
      teamTitle: "Gols por equipe",
      finishTitle: "¿Bola rolando, pênaltis ou faltas diretas?",
      bodyTitle: "¿Com qual pé ou parte do corpo Messi marca?",
      ageTitle: "Gols por idade",
      compTableTitle: "Totais da carreira por trás destes gráficos",
      finishTableTitle: "¿Como Lionel Messi marca seus gols?",
      recTitle: "Recordes de Messi nestes números",
      exploreTitle: "Explore todas as estatísticas"
    },
    fr: {
      title: "Tableau de Bord Interactif de Lionel Messi",
      desc: "Tableau de bord interactif de la carrière de Lionel Messi : 932 buts filtrables par Barcelone, PSG, Inter Miami et Argentine.",
      h1: "Tableau de Bord des Statistiques de Lionel Messi",
      lede: "Analyse interactive des 932 buts en carrière de Lionel Messi à travers toutes les compétitions, saisons, types de tirs et surfaces du corps.",
      compTitle: "Dans quelles compétitions Messi a-t-il marqué le plus de buts ?",
      seasonTitle: "Comment son rythme de buts a-t-il évolué saison après saison ?",
      teamTitle: "Buts par équipe",
      finishTitle: "Jeu ouvert, penaltys ou coups francs ?",
      bodyTitle: "Avec quel pied ou surface du corps Messi marque-t-il ?",
      ageTitle: "Buts à chaque âge",
      compTableTitle: "Totaux de carrière derrière ces graphiques",
      finishTableTitle: "Comment Lionel Messi marque-t-il ses buts ?",
      recTitle: "Les records de Messi dans ces chiffres",
      exploreTitle: "Explorer toutes les statistiques"
    }
  }[lang];

  return `${renderHeadBoilerplate(lang, "dashboard", dict.title, dict.desc)}
<body data-page="dashboard">
<a class="skip" href="#main">${L.skip}</a>
${renderRailNav(lang, "dashboard")}
<div class="page">
<main class="wrap" id="main">
<div hidden="" id="banner"></div>
<p class="eyebrow">${L.nav.dashboard} <i></i> <span id="upd">${L.dateStr}</span></p>
<h1>${dict.h1}</h1>
<p class="lede" id="lede">${dict.lede}</p>
<p><a class="btn" href="/${lang}">${L.backToStats}</a></p>
<div aria-label="Filter" class="dash-team-selector" id="pills" role="group"></div>
<p class="section-sub" id="filter-note"></p>
<section aria-label="KPIs" class="dash-kpis-grid" id="kpis"></section>
<div class="shead"><h2>${dict.compTitle}</h2></div>
<div class="dash-sections-grid">
  <section class="dash-card" id="body-card"></section>
  <section class="dash-card" id="finish-card"></section>
  <section class="dash-card" id="comp-card"></section>
  <section class="dash-card" id="milestones-card"></section>
</div>
${renderAdSlot(lang)}
<div class="shead"><h2>${dict.seasonTitle}</h2></div>
<section class="card chart-card" id="season-card"></section>
<div class="shead"><h2>${dict.ageTitle}</h2></div>
<section class="card chart-card" id="age-card"></section>
<div class="shead"><h2>${dict.teamTitle}</h2></div>
<section aria-label="Team cards" class="team-grid" id="team-cards">...</section>
<div class="shead"><h2>${dict.compTableTitle}</h2></div>
<section class="card" id="comp-table">...</section>
<div class="shead"><h2>${dict.finishTableTitle}</h2></div>
<section class="card" id="finish-table">...</section>
<div class="shead"><h2>${dict.recTitle}</h2></div>
<section aria-label="Records" class="records" id="dash-records"></section>
${renderBdayPromo(lang)}
<h2>${dict.exploreTitle}</h2>
<nav aria-label="Explore" class="explore" id="explore"></nav>
<section class="card method" id="method"></section>
</main>
</div>
<script type="module" src="/src/app.js"></script>
</body>
</html>`;
}

// 2. GOALS BY SEASON
function generateGoalsBySeason(lang) {
  const L = LANGS[lang];
  const dict = {
    pt: {
      title: "Gols de Messi por Temporada (2004/05–2026)",
      desc: "Todos os gols de Lionel Messi por temporada de clubes e ano de seleção: 806 por clubes e 126 pela Argentina.",
      h1: "Gols de Lionel Messi por Temporada",
      lede: "Todas as temporadas de clube desde 2004/05 até 2026 — recorde de 73 gols em 2011/12 — com divisão de liga, copas e torneios internacionais.",
      clubHead: "Todas as temporadas por clube (Barcelona, PSG, Inter Miami)",
      countryHead: "Gols com a Seleção Argentina ano a ano",
      bestSeasonHead: "¿Qual foi a melhor temporada da carreira de Messi?",
      exploreTitle: "Explore todas as estatísticas"
    },
    fr: {
      title: "Buts de Messi par Saison (2004/05–2026)",
      desc: "Tous les buts de Lionel Messi par saison en club et par année en sélection : 806 buts en club et 126 avec l'Argentine.",
      h1: "Buts de Lionel Messi par Saison",
      lede: "Toutes les saisons en club de 2004/05 à 2026 — record de 73 buts en 2011/12 — avec répartition par ligue, coupes et compétitions continentales.",
      clubHead: "Toutes les saisons en club (Barcelone, PSG, Inter Miami)",
      countryHead: "Buts avec l'Argentine année par année",
      bestSeasonHead: "Quelle a été la meilleure saison de la carrière de Messi ?",
      exploreTitle: "Explorer toutes les statistiques"
    }
  }[lang];

  return `${renderHeadBoilerplate(lang, "goalsbyseason", dict.title, dict.desc)}
<body data-page="byseason">
<a class="skip" href="#main">${L.skip}</a>
${renderRailNav(lang, "byseason")}
<div class="page">
<main class="wrap" id="main">
<div hidden="" id="banner"></div>
<p class="eyebrow">${L.nav.byseason} <i></i> <span id="upd">${L.dateStr}</span></p>
<h1>${dict.h1}</h1>
<p class="lede" id="lede">${dict.lede}</p>
<p><a class="btn" href="/${lang}">${L.backToStats}</a></p>
<div class="shead"><h2>${dict.clubHead}</h2><a href="/${lang}/goalsbyyear">${L.nav.byyear}</a></div>
<p class="section-sub" id="club-sub"></p>
<section class="card" id="club-table">...</section>
${renderAdSlot(lang)}
<div class="shead"><h2>${dict.countryHead}</h2></div>
<p class="section-sub" id="country-sub"></p>
<section class="card" id="country-table">...</section>
${renderAdSlot(lang)}
<div class="shead"><h2>${dict.bestSeasonHead}</h2><a href="/${lang}/dashboard">${L.nav.dashboard}</a></div>
<section class="prose" id="bestseason"></section>
${renderBdayPromo(lang)}
<h2>${dict.exploreTitle}</h2>
<nav aria-label="Explore" class="explore" id="explore"></nav>
<section class="card method" id="method"></section>
</main>
</div>
<script type="module" src="/src/app.js"></script>
</body>
</html>`;
}

// 3. GOALS BY YEAR
function generateGoalsByYear(lang) {
  const L = LANGS[lang];
  const dict = {
    pt: {
      title: "Gols de Messi por Ano (2004–2026): Todos os 932 Gols e Recorde de 91",
      desc: "Gols de Lionel Messi ano a ano (2004–2026): divisão de seus 932 gols oficiais e o recorde mundial de 91 gols em 2012.",
      h1: "Gols de Lionel Messi por Ano (2004–2026)",
      lede: "Todos os 932 gols de Lionel Messi divididos por ano civil de 2004 a 2026, incluindo o recorde mundial do Guinness de 91 gols em 2012.",
      chartHead: "¿Quantos gols Messi marca a cada ano?",
      decadesHead: "Gols por década",
      tableHead: "Gols de Messi ano a ano, 2004 a 2026",
      bestYearHead: "¿Qual foi o melhor ano da carreira de Messi?",
      exploreTitle: "Explore todas as estatísticas"
    },
    fr: {
      title: "Buts de Messi par Année (2004–2026) : Les 932 Buts et Record de 91",
      desc: "Buts de Lionel Messi année par année (2004–2026) : répartition de ses 932 buts officiels et record du monde de 91 buts en 2012.",
      h1: "Buts de Lionel Messi par Année (2004–2026)",
      lede: "Tous les 932 buts de Lionel Messi répartis par année civile de 2004 à 2026, avec le record mondial Guinness de 91 buts en 2012.",
      chartHead: "Combien de buts Messi marque-t-il chaque année ?",
      decadesHead: "Buts par décennie",
      tableHead: "Buts de Messi année par année, de 2004 à 2026",
      bestYearHead: "Quelle a été la meilleure année civile de Messi ?",
      exploreTitle: "Explorer toutes les statistiques"
    }
  }[lang];

  return `${renderHeadBoilerplate(lang, "goalsbyyear", dict.title, dict.desc)}
<body data-page="byyear">
<a class="skip" href="#main">${L.skip}</a>
${renderRailNav(lang, "byyear")}
<div class="page">
<main class="wrap" id="main">
<div hidden="" id="banner"></div>
<p class="eyebrow">${L.nav.byyear} <i></i> <span id="upd">${L.dateStr}</span></p>
<h1>${dict.h1}</h1>
<p class="lede" id="lede">${dict.lede}</p>
<p><a class="btn" href="/${lang}">${L.backToStats}</a></p>
<div class="shead"><h2>${dict.chartHead}</h2></div>
<section class="card chart-card" id="combo-card"></section>
<section aria-label="KPIs" class="kpis kpis-4" id="kpis"></section>
<div class="shead"><h2>${dict.decadesHead}</h2></div>
<section aria-label="Decades" class="kpis kpis-3" id="decades"></section>
${renderAdSlot(lang)}
<div class="shead"><h2>${dict.tableHead}</h2><a href="/${lang}/goalsbyseason">${L.nav.byseason}</a></div>
<p class="section-sub" id="table-sub"></p>
<section class="card" id="year-table">...</section>
${renderAdSlot(lang)}
<div class="shead"><h2>${dict.bestYearHead}</h2><a href="/${lang}/dashboard">${L.nav.dashboard}</a></div>
<section class="prose" id="bestyear"></section>
${renderBdayPromo(lang)}
<h2>${dict.exploreTitle}</h2>
<nav aria-label="Explore" class="explore" id="explore"></nav>
<section class="card method" id="method"></section>
</main>
</div>
<script type="module" src="/src/app.js"></script>
</body>
</html>`;
}

// 4. TIMELINE
function generateTimeline(lang) {
  const L = LANGS[lang];
  const dict = {
    pt: {
      title: "Linha do Tempo de Lionel Messi: Momentos Históricos de 2004 a 2026",
      desc: "História completa da carreira de Lionel Messi em ordem cronológica: do primeiro gol pelo Barcelona ao título mundial em 2022.",
      h1: "Lionel Messi Através dos Anos",
      lede: "Lionel Messi 2004–2026: cada momento histórico datado desde sua estreia no Barcelona até a glória na Copa do Mundo.",
      keyHead: "Datas-chave de Lionel Messi",
      tlHead: "A linha do tempo completa da carreira",
      searchLabel: "Filtrar momentos",
      searchPlaceholder: "Filtrar momentos — ex. “Copa do Mundo”",
      faqHead: "Perguntas frequentes",
      exploreTitle: "Explore todas as estatísticas"
    },
    fr: {
      title: "Chronologie de Lionel Messi : Tous les Moments de 2004 à 2026",
      desc: "Historique complet de la carrière de Lionel Messi par ordre chronologique : des débuts à Barcelone au sacre mondial au Qatar 2022.",
      h1: "Lionel Messi à Travers les Années",
      lede: "Lionel Messi 2004–2026 : chaque moment daté depuis ses débuts à Barcelone jusqu'au triomphe en Coupe du Monde.",
      keyHead: "Dates clés de Lionel Messi",
      tlHead: "La chronologie complète de sa carrière",
      searchLabel: "Filtrer les moments",
      searchPlaceholder: "Filtrer les moments — ex. “Coupe du Monde”",
      faqHead: "Foire aux questions",
      exploreTitle: "Explorer toutes les statistiques"
    }
  }[lang];

  return `${renderHeadBoilerplate(lang, "timeline", dict.title, dict.desc)}
<body data-page="timeline">
<a class="skip" href="#main">${L.skip}</a>
${renderRailNav(lang, "timeline")}
<div class="page">
<main class="wrap" id="main">
<div hidden="" id="banner"></div>
<p class="eyebrow">${L.nav.timeline} <i></i> <span id="upd">${L.dateStr}</span></p>
<h1>${dict.h1}</h1>
<p class="lede" id="lede">${dict.lede}</p>
<p><a class="btn" href="/${lang}">${L.backToStats}</a></p>
<section class="tl-summary-banner" id="tl-summary" aria-label="Career overview numbers">
  <div class="tl-summary-kpi"><div class="val">22</div><div class="lbl">Seasons (2004–2026)</div></div>
  <div class="tl-summary-kpi"><div class="val">932</div><div class="lbl">Senior Goals</div></div>
  <div class="tl-summary-kpi"><div class="val">407+</div><div class="lbl">Career Assists</div></div>
  <div class="tl-summary-kpi"><div class="val">47</div><div class="lbl">Major Trophies</div></div>
  <div class="tl-summary-kpi"><div class="val">8</div><div class="lbl">Ballons d'Or</div></div>
  <div class="tl-summary-kpi"><div class="val">6</div><div class="lbl">Golden Shoes</div></div>
</section>
<div class="shead"><h2>${dict.keyHead}</h2></div>
<section class="card" id="keydates">...</section>
${renderAdSlot(lang)}
<div class="shead"><h2>${dict.tlHead}</h2></div>
<nav aria-label="Eras" class="tl-era-nav" id="era-nav"></nav>
<div class="tl-tools">
<div class="tl-search">
<label class="tl-search-label" for="tl-filter">${dict.searchLabel}</label>
<input aria-describedby="tl-count" autocomplete="off" id="tl-filter" placeholder="${dict.searchPlaceholder}" type="search"/>
</div>
<p aria-live="polite" class="tl-count" id="tl-count" role="status"></p>
</div>
<section id="chapters"></section>
${renderAdSlot(lang)}
<h2>${dict.faqHead}</h2>
<section aria-label="FAQ" class="qa-grid" id="faq"></section>
${renderBdayPromo(lang)}
<h2>${dict.exploreTitle}</h2>
<nav aria-label="Explore" class="explore" id="explore"></nav>
<section class="card method" id="method"></section>
</main>
</div>
<script type="module" src="/src/app.js"></script>
</body>
</html>`;
}

// 5. ACHIEVEMENTS
function generateAchievements(lang) {
  const L = LANGS[lang];
  const dict = {
    pt: {
      title: "Títulos e Prêmios de Lionel Messi: Recorde de 47 Troféus e 8 Bolas de Ouro",
      desc: "Todos os 47 títulos oficiais de Lionel Messi — recorde mundial absoluto na história do futebol — mais 8 Bolas de Ouro e a Copa do Mundo.",
      h1: "Títulos e Premiações de Lionel Messi",
      lede: "Todos os 47 títulos oficiais de Lionel Messi (recorde mundial), 8 Bolas de Ouro, 6 Chuteiras de Ouro e a Copa do Mundo FIFA 2022.",
      kpiHead: "Resumo de títulos",
      qaHead: "Perguntas rápidas sobre títulos",
      galleryHead: "Galeria de troféus",
      groupHead: "Todos os títulos por clube e seleção",
      faqHead: "Perguntas frequentes",
      exploreTitle: "Explore todas as estatísticas"
    },
    fr: {
      title: "Palmarès et Trophées de Lionel Messi : 47 Titres et 8 Ballons d'Or",
      desc: "Les 47 trophées collectifs officiels de Lionel Messi (record mondial absolu de l'histoire du football), 8 Ballons d'Or et la Coupe du Monde.",
      h1: "Palmarès et Trophées de Lionel Messi",
      lede: "L'intégralité des 47 trophées officiels de Lionel Messi — record absolu du football — plus 8 Ballons d'Or, 6 Souliers d'Or et la Coupe du Monde 2022.",
      kpiHead: "Résumé des titres",
      qaHead: "Questions rapides sur les trophées",
      galleryHead: "Galerie des trophées",
      groupHead: "Tous les titres par club et sélection",
      faqHead: "Foire aux questions",
      exploreTitle: "Explorer toutes les statistiques"
    }
  }[lang];

  return `${renderHeadBoilerplate(lang, "achievements", dict.title, dict.desc)}
<body data-page="achievements">
<a class="skip" href="#main">${L.skip}</a>
${renderRailNav(lang, "achievements")}
<div class="page">
<main class="wrap" id="main">
<div hidden="" id="banner"></div>
<p class="eyebrow">${L.nav.achievements} <i></i> <span id="upd">${L.dateStr}</span></p>
<h1>${dict.h1}</h1>
<p class="lede" id="lede">${dict.lede}</p>
<p><a class="btn" href="/${lang}">${L.backToStats}</a></p>
<div class="shead"><h2>${dict.kpiHead}</h2></div>
<section aria-label="KPIs" class="kpis kpis-4" id="kpis"></section>
${renderAdSlot(lang)}
<h2>${dict.qaHead}</h2>
<section aria-label="QA" class="qa-grid" id="qa"></section>
<div class="shead"><h2>${dict.galleryHead}</h2></div>
<section aria-label="Cabinet" class="cabinet" id="cabinet"></section>
<div class="shead"><h2>${dict.groupHead}</h2></div>
<section id="groups"></section>
${renderAdSlot(lang)}
<h2>${dict.faqHead}</h2>
<section aria-label="FAQ" class="qa-grid" id="faq"></section>
${renderBdayPromo(lang)}
<h2>${dict.exploreTitle}</h2>
<nav aria-label="Explore" class="explore" id="explore"></nav>
<section class="card method" id="method"></section>
</main>
</div>
<script type="module" src="/src/app.js"></script>
</body>
</html>`;
}

// 6. BIRTHDAY
function generateBirthday(lang) {
  const L = LANGS[lang];
  const dict = {
    pt: {
      title: "Gols de Messi no seu Aniversário: Explorador dos 366 Dias do Ano",
      desc: "Descubra se Lionel Messi marcou no dia do seu aniversário: explore todos os 366 dias do ano com vídeos de cada gol marcado.",
      h1: "¿Marcou Messi no dia do seu aniversário?",
      lede: "Descubra se Lionel Messi marcou gols no dia do seu aniversário. Messi marcou em 292 dos 366 dias do ano (79,8%) ao longo dos seus 932 gols.",
      selectMonth: "Selecione o mês",
      selectDay: "Selecione o dia",
      checkBtn: "Verificar gols ⚽",
      statDaysScored: "Dias com gols",
      statDaysEmpty: "Dias sem gols",
      faqHead: "Perguntas frequentes sobre aniversários",
      exploreTitle: "Explore todas as estatísticas"
    },
    fr: {
      title: "Messi a-t-il marqué le jour de votre anniversaire ? Explorateur des 366 Jours",
      desc: "Découvrez si Lionel Messi a marqué le jour de votre anniversaire : explorez les 366 jours de l'année avec vidéos et statistiques.",
      h1: "Messi a-t-il marqué le jour de votre anniversaire ?",
      lede: "Vérifiez si Lionel Messi a marqué lors de votre jour de naissance. Messi a marqué lors de 292 des 366 jours du calendrier (79,8%) sur ses 932 buts.",
      selectMonth: "Sélectionnez le mois",
      selectDay: "Sélectionnez le jour",
      checkBtn: "Vérifier les buts ⚽",
      statDaysScored: "Jours avec buts",
      statDaysEmpty: "Jours sans buts",
      faqHead: "Foire aux questions sur les anniversaires",
      exploreTitle: "Explorer toutes les statistiques"
    }
  }[lang];

  return `${renderHeadBoilerplate(lang, "birthday", dict.title, dict.desc)}
<body data-page="birthday">
<a class="skip" href="#main">${L.skip}</a>
${renderRailNav(lang, "birthday")}
<div class="page">
<main class="wrap" id="main">
<div hidden="" id="banner"></div>
<p class="eyebrow">${L.nav.bday} <i></i> <span id="upd">${L.dateStr}</span></p>
<h1>${dict.h1}</h1>
<p class="lede" id="lede">${dict.lede}</p>

<!-- VIRAL BIRTHDAY FORM -->
<section class="bday-interactive-hero" aria-label="Birthday Picker">
  <div class="bday-picker-card">
    <div class="bday-picker-row">
      <div class="bday-field">
        <label for="bday-month-select">${dict.selectMonth}</label>
        <select id="bday-month-select" class="bday-select"></select>
      </div>
      <div class="bday-field">
        <label for="bday-day-select">${dict.selectDay}</label>
        <select id="bday-day-select" class="bday-select"></select>
      </div>
      <button type="button" id="bday-check-btn" class="btn btn-primary bday-submit-btn">${dict.checkBtn}</button>
    </div>
    <div class="bday-month-pills" id="bday-month-pills"></div>
  </div>
</section>

<section id="bday-result" class="bday-result-area" aria-live="polite"></section>

<section class="kpis kpis-2" aria-label="Stats">
  <div class="kpi"><span class="kpi-label">${dict.statDaysScored}</span><span class="kpi-value" id="kpi-days-scored">292</span><span class="kpi-note">79.8%</span></div>
  <div class="kpi"><span class="kpi-label">${dict.statDaysEmpty}</span><span class="kpi-value" id="kpi-days-empty">74</span><span class="kpi-note">20.2%</span></div>
</section>

${renderAdSlot(lang)}
<div class="shead"><h2>${dict.calendarTitle}</h2></div>
<div id="bday-calendar-grid" class="bday-grid"></div>

${renderAdSlot(lang)}
<h2>${dict.faqHead}</h2>
<section aria-label="FAQ" class="qa-grid" id="faq"></section>

<h2>${dict.exploreTitle}</h2>
<nav aria-label="Explore" class="explore" id="explore"></nav>
<section class="card method" id="method"></section>
</main>
</div>
<script type="module" src="/src/app.js"></script>
</body>
</html>`;
}

// 7. MESSI VS RONALDO
function generateMessiVsRonaldo(lang) {
  const L = LANGS[lang];
  const dict = {
    pt: {
      title: "Messi vs Ronaldo: Gols, Títulos e Confrontos Diretos",
      desc: "Lionel Messi vs Cristiano Ronaldo: 932 gols vs 980, 47 títulos vs 37, 8 Bolas de Ouro vs 5. Estatísticas completas e os 36 confrontos diretos.",
      h1: "Messi vs Cristiano Ronaldo: A Comparação Definitiva",
      lede: "A comparação estatística definitiva entre Lionel Messi e Cristiano Ronaldo: 932 vs 980 gols, 47 vs 37 títulos e 8 vs 5 Bolas de Ouro.",
      kpiMessiNote: "1.178 jogos (0,79 g/j)",
      kpiRonaldoNote: "1.339 jogos (0,72 g/j)",
      kpiDiff: "Diferença",
      kpiDiffNote: "Messi em 161 jogos a menos",
      titlesName: "🏆 Títulos Coletivos",
      titlesGoals: "Messi: 47 <span>vs Ronaldo: 37</span>",
      titlesMeta: "Messi detém o recorde mundial absoluto na história do futebol.",
      bdoName: "🌕 Bola de Ouro",
      bdoGoals: "Messi: 8 <span>vs Ronaldo: 5</span>",
      bdoMeta: "Recorde histórico de 8 Bolas de Ouro em três décadas diferentes.",
      wcName: "🌍 Copa do Mundo FIFA",
      wcGoals: "Messi: 1 <span>vs Ronaldo: 0</span>",
      wcMeta: "Campeão e 2x vencedor da Bola de Ouro do torneio (2014, 2022).",
      tableTitle: "Os 36 confrontos diretos entre Messi e Ronaldo",
      tableCaption: "Histórico frente a frente em 36 partidas oficiais",
      thMetric: "Métrica",
      thMessi: "Lionel Messi",
      thRonaldo: "Cristiano Ronaldo",
      rowWins: "Vitórias",
      rowWinsMessi: "<b>16 vitórias</b> (44,4%)",
      rowWinsRonaldo: "11 vitórias (30,6%)",
      rowDraws: "Empates",
      rowDrawsVal: "9 empates (25,0%)",
      rowGoals: "Gols Marcados",
      rowGoalsMessi: "<b>22 gols</b>",
      rowGoalsRonaldo: "21 gols",
      rowAssists: "Assistências",
      rowAssistsMessi: "<b>12 assistências</b>",
      rowAssistsRonaldo: "1 assistência",
      faqHead: "Perguntas frequentes sobre Messi vs Ronaldo",
      exploreTitle: "Explore todas as estatísticas"
    },
    fr: {
      title: "Messi vs Ronaldo : Buts, Titres et Face-à-Face Historique",
      desc: "Lionel Messi vs Cristiano Ronaldo : 932 buts vs 980, 47 trophées vs 37, 8 Ballons d'Or vs 5. Statistiques complètes et les 36 confrontations directes.",
      h1: "Messi vs Cristiano Ronaldo : La Comparaison Ultime",
      lede: "Le comparatif statistique absolu entre Lionel Messi et Cristiano Ronaldo : 932 contre 980 buts, 47 contre 37 titres et 8 contre 5 Ballons d'Or.",
      kpiMessiNote: "1 178 matchs (0,79 b/m)",
      kpiRonaldoNote: "1 280+ matchs (0,72 b/m)",
      kpiDiff: "Différence",
      kpiDiffNote: "Messi en 161 matchs de moins",
      titlesName: "🏆 Titres Collectifs",
      titlesGoals: "Messi : 47 <span>vs Ronaldo : 37</span>",
      titlesMeta: "Messi détient le record mondial absolu dans l'histoire du football.",
      bdoName: "🌕 Ballon d'Or",
      bdoGoals: "Messi : 8 <span>vs Ronaldo : 5</span>",
      bdoMeta: "Record de 8 Ballons d'Or remportés sur trois décennies distinctes.",
      wcName: "🌍 Coupe du Monde de la FIFA",
      wcGoals: "Messi : 1 <span>vs Ronaldo : 0</span>",
      wcMeta: "Champion du monde et 2x meilleur joueur du tournoi (2014, 2022).",
      tableTitle: "Les 36 confrontations directes entre Messi et Ronaldo",
      tableCaption: "Bilan des confrontations directes en 36 matchs officiels",
      thMetric: "Statistique",
      thMessi: "Lionel Messi",
      thRonaldo: "Cristiano Ronaldo",
      rowWins: "Victoires",
      rowWinsMessi: "<b>16 victoires</b> (44,4%)",
      rowWinsRonaldo: "11 victoires (30,6%)",
      rowDraws: "Matchs nuls",
      rowDrawsVal: "9 nuls (25,0%)",
      rowGoals: "Buts Marqués",
      rowGoalsMessi: "<b>22 buts</b>",
      rowGoalsRonaldo: "21 buts",
      rowAssists: "Passes Décisives",
      rowAssistsMessi: "<b>12 passes</b>",
      rowAssistsRonaldo: "1 passe",
      faqHead: "Foire aux questions Messi vs Ronaldo",
      exploreTitle: "Explorer toutes les statistiques"
    }
  }[lang];

  return `${renderHeadBoilerplate(lang, "messi-vs-ronaldo", dict.title, dict.desc)}
<body data-page="messi-vs-ronaldo">
<a class="skip" href="#main">${L.skip}</a>
${renderRailNav(lang, "messi-vs-ronaldo")}
<div class="page">
<main class="wrap" id="main">
<div hidden="" id="banner"></div>
<p class="eyebrow">${L.nav.ronaldo} <i></i> <span id="upd">${L.dateStr}</span></p>
<h1>${dict.h1}</h1>
<p class="lede" id="lede">${dict.lede}</p>
<p><a class="btn" href="/${lang}">${L.backToStats}</a></p>

<!-- HEAD TO HEAD KPIS -->
<section class="kpis kpis-3" aria-label="Head to Head">
  <div class="kpi"><span class="kpi-label">Lionel Messi</span><span class="kpi-value">932</span><span class="kpi-note">${dict.kpiMessiNote}</span></div>
  <div class="kpi"><span class="kpi-label">Cristiano Ronaldo</span><span class="kpi-value">980</span><span class="kpi-note">${dict.kpiRonaldoNote}</span></div>
  <div class="kpi"><span class="kpi-label">${dict.kpiDiff}</span><span class="kpi-value">+5</span><span class="kpi-note">${dict.kpiDiffNote}</span></div>
</section>

${renderAdSlot(lang)}

<!-- COMPARISON CARDS -->
<section class="team-grid" aria-label="Career Breakdown">
  <div class="team-card">
    <div class="team-name">${dict.titlesName}</div>
    <div class="team-goals">${dict.titlesGoals}</div>
    <div class="team-meta">${dict.titlesMeta}</div>
  </div>
  <div class="team-card">
    <div class="team-name">${dict.bdoName}</div>
    <div class="team-goals">${dict.bdoGoals}</div>
    <div class="team-meta">${dict.bdoMeta}</div>
  </div>
  <div class="team-card">
    <div class="team-name">${dict.wcName}</div>
    <div class="team-goals">${dict.wcGoals}</div>
    <div class="team-meta">${dict.wcMeta}</div>
  </div>
</section>

${renderAdSlot(lang)}
<div class="shead"><h2>${dict.tableTitle}</h2></div>
<section class="card" id="h2h-table">
  <table class="data-table">
    <caption>${dict.tableCaption}</caption>
    <thead>
      <tr><th scope="col" class="left">${dict.thMetric}</th><th scope="col">${dict.thMessi}</th><th scope="col">${dict.thRonaldo}</th></tr>
    </thead>
    <tbody>
      <tr><th scope="row">${dict.rowWins}</th><td>${dict.rowWinsMessi}</td><td>${dict.rowWinsRonaldo}</td></tr>
      <tr><th scope="row">${dict.rowDraws}</th><td colspan="2">${dict.rowDrawsVal}</td></tr>
      <tr><th scope="row">${dict.rowGoals}</th><td>${dict.rowGoalsMessi}</td><td>${dict.rowGoalsRonaldo}</td></tr>
      <tr><th scope="row">${dict.rowAssists}</th><td>${dict.rowAssistsMessi}</td><td>${dict.rowAssistsRonaldo}</td></tr>
    </tbody>
  </table>
</section>

${renderBdayPromo(lang)}
<h2>${dict.faqHead}</h2>
<section aria-label="FAQ" class="qa-grid" id="faq"></section>

<h2>${dict.exploreTitle}</h2>
<nav aria-label="Explore" class="explore" id="explore"></nav>
<section class="card method" id="method"></section>
</main>
</div>
<script type="module" src="/src/app.js"></script>
</body>
</html>`;
}

// 8. VS REAL MADRID
function generateVsRealMadrid(lang) {
  const L = LANGS[lang];
  const dict = {
    pt: {
      title: "Messi vs Real Madrid: 26 Gols, 45 Jogos e Recorde no El Clásico",
      desc: "Histórico completo de Lionel Messi contra o Real Madrid: 26 gols e 14 assistências em 45 jogos oficiais. O maior artilheiro do El Clásico.",
      h1: "Lionel Messi vs Real Madrid: O Rei do El Clásico",
      lede: "O histórico completo do maior artilheiro da história do El Clásico: 26 gols, 14 assistências e 16 vitórias em 45 partidas contra o Real Madrid.",
      kpiApps: "Partidas",
      kpiAppsNote: "Todas as partidas oficiais",
      kpiGoals: "Gols",
      kpiGoalsNote: "Maior artilheiro do El Clásico",
      kpiAssists: "Assistências",
      kpiAssistsNote: "Líder histórico de assistências",
      kpiWins: "Vitórias",
      kpiWinsNote: "Triunfos em todas as competições",
      breakdownHead: "Resumo do histórico de Messi contra o Real Madrid",
      tableCaption: "Histórico de Messi contra o Real Madrid por competição",
      thComp: "Competição",
      thApps: "Jogos",
      thGoals: "Gols",
      thAssists: "Assistências",
      compLaLiga: "La Liga",
      compSupercopa: "Supercopa da Espanha",
      compUcl: "Liga dos Campeões da UEFA",
      compCdr: "Copa do Rei",
      compTotal: "Total em Todas as Competições",
      momentsHead: "Momentos mágicos de Messi no Bernabéu e Camp Nou",
      m1Name: "Hat-trick aos 19 Anos (2007)",
      m1Goals: "Camp Nou · 3-3",
      m1Meta: "Primeiro hat-trick da carreira profissional, empatando 3 vezes contra o Real Madrid.",
      m2Name: "O Histórico 2-6 (2009)",
      m2Goals: "Santiago Bernabéu · 2 gols",
      m2Meta: "Guardiola inventa a função de Falso 9 para Leo Messi em pleno Bernabéu.",
      m3Name: "Gol Solo Antológico na Champions (2011)",
      m3Goals: "Santiago Bernabéu · 0-2",
      m3Meta: "Slalom icônico passando por 4 defensores do Madrid na semifinal da Champions League.",
      m4Name: "A Comemoração da Camisa no Gol 500 (2017)",
      m4Goals: "Santiago Bernabéu · 2-3",
      m4Meta: "Gol da vitória aos 92 minutos seguido pela icônica exibição da camisa 10 ao Bernabéu.",
      faqHead: "Perguntas frequentes sobre Messi vs Real Madrid",
      exploreTitle: "Explore todas as estatísticas"
    },
    fr: {
      title: "Messi vs Real Madrid : 26 Buts, 45 Matchs et Record dans El Clásico",
      desc: "Historique complet de Lionel Messi face au Real Madrid : 26 buts, 14 passes décisives en 45 matchs. Meilleur buteur de l'histoire du Clásico.",
      h1: "Lionel Messi vs Real Madrid : Le Roi du Clásico",
      lede: "L'historique complet du meilleur buteur de l'histoire du Clásico : 26 buts, 14 passes décisives et 16 victoires en 45 confrontations contre le Real Madrid.",
      kpiApps: "Matchs Joués",
      kpiAppsNote: "Toutes compétitions officielles",
      kpiGoals: "Buts",
      kpiGoalsNote: "Meilleur buteur historique du Clásico",
      kpiAssists: "Passes Décisives",
      kpiAssistsNote: "Record absolu du Clásico",
      kpiWins: "Victoires",
      kpiWinsNote: "Gains toutes compétitions confondues",
      breakdownHead: "Résumé statistique de Messi face au Real Madrid",
      tableCaption: "Bilan de Messi contre le Real Madrid par compétition",
      thComp: "Compétition",
      thApps: "Matchs",
      thGoals: "Buts",
      thAssists: "Passes",
      compLaLiga: "La Liga",
      compSupercopa: "Supercoupe d'Espagne",
      compUcl: "Ligue des Champions de l'UEFA",
      compCdr: "Coupe du Roi",
      compTotal: "Total Toutes Compétitions",
      momentsHead: "Nuits magiques au Bernabéu et au Camp Nou",
      m1Name: "Coup du chapeau à 19 ans (2007)",
      m1Goals: "Camp Nou · 3-3",
      m1Meta: "Premier triplé en carrière senior, égalisant 3 fois contre le Real Madrid.",
      m2Name: "L'Historique 2-6 (2009)",
      m2Goals: "Santiago Bernabéu · 2 buts",
      m2Meta: "Guardiola invente le rôle de Faux 9 pour Leo Messi au Bernabéu.",
      m3Name: "Chef-d'œuvre solitaire en C1 (2011)",
      m3Goals: "Santiago Bernabéu · 0-2",
      m3Meta: "Slalom d'anthologie effaçant 4 défenseurs madrilènes en demi-finale de C1.",
      m4Name: "La Célébration du Maillot pour le 500e But (2017)",
      m4Goals: "Santiago Bernabéu · 2-3",
      m4Meta: "But de la victoire à la 92e minute, suivi du maillot #10 brandi face au Bernabéu.",
      faqHead: "Foire aux questions Messi vs Real Madrid",
      exploreTitle: "Explorer toutes les statistiques"
    }
  }[lang];

  return `${renderHeadBoilerplate(lang, "vs-real-madrid", dict.title, dict.desc)}
<body data-page="vs-real-madrid">
<a class="skip" href="#main">${L.skip}</a>
${renderRailNav(lang, "vs-real-madrid")}
<div class="page">
<main class="wrap" id="main">
<div hidden="" id="banner"></div>
<p class="eyebrow">${L.nav.madrid} <i></i> <span id="upd">${L.dateStr}</span></p>
<h1>${dict.h1}</h1>
<p class="lede" id="lede">${dict.lede}</p>
<p><a class="btn" href="/${lang}">${L.backToStats}</a></p>

<!-- STATS CARDS -->
<section class="kpis kpis-4" aria-label="El Clasico KPIs">
  <div class="kpi"><span class="kpi-label">${dict.kpiApps}</span><span class="kpi-value">45</span><span class="kpi-note">${dict.kpiAppsNote}</span></div>
  <div class="kpi"><span class="kpi-label">${dict.kpiGoals}</span><span class="kpi-value">26</span><span class="kpi-note">${dict.kpiGoalsNote}</span></div>
  <div class="kpi"><span class="kpi-label">${dict.kpiAssists}</span><span class="kpi-value">14</span><span class="kpi-note">${dict.kpiAssistsNote}</span></div>
  <div class="kpi"><span class="kpi-label">${dict.kpiWins}</span><span class="kpi-value">19</span><span class="kpi-note">${dict.kpiWinsNote}</span></div>
</section>

${renderAdSlot(lang)}

<div class="shead"><h2>${dict.breakdownHead}</h2></div>
<section class="card">
  <table class="data-table">
    <caption>${dict.tableCaption}</caption>
    <thead>
      <tr><th scope="col" class="left">${dict.thComp}</th><th scope="col">${dict.thApps}</th><th scope="col">${dict.thGoals}</th><th scope="col">${dict.thAssists}</th></tr>
    </thead>
    <tbody>
      <tr><th scope="row">${dict.compLaLiga}</th><td>29</td><td><b>18</b></td><td>9</td></tr>
      <tr><th scope="row">${dict.compSupercopa}</th><td>6</td><td><b>6</b></td><td>2</td></tr>
      <tr><th scope="row">${dict.compUcl}</th><td>4</td><td><b>2</b></td><td>0</td></tr>
      <tr><th scope="row">${dict.compCdr}</th><td>6</td><td><b>0</b></td><td>3</td></tr>
      <tr class="total"><th scope="row">${dict.compTotal}</th><td>45</td><td><b>26</b></td><td>14</td></tr>
    </tbody>
  </table>
</section>

${renderAdSlot(lang)}

<div class="shead"><h2>${dict.momentsHead}</h2></div>
<section class="team-grid">
  <div class="team-card">
    <div class="team-name">${dict.m1Name}</div>
    <div class="team-goals">${dict.m1Goals}</div>
    <div class="team-meta">${dict.m1Meta}</div>
  </div>
  <div class="team-card">
    <div class="team-name">${dict.m2Name}</div>
    <div class="team-goals">${dict.m2Goals}</div>
    <div class="team-meta">${dict.m2Meta}</div>
  </div>
  <div class="team-card">
    <div class="team-name">${dict.m3Name}</div>
    <div class="team-goals">${dict.m3Goals}</div>
    <div class="team-meta">${dict.m3Meta}</div>
  </div>
  <div class="team-card">
    <div class="team-name">${dict.m4Name}</div>
    <div class="team-goals">${dict.m4Goals}</div>
    <div class="team-meta">${dict.m4Meta}</div>
  </div>
</section>

${renderBdayPromo(lang)}
<h2>${dict.faqHead}</h2>
<section aria-label="FAQ" class="qa-grid" id="faq"></section>

<h2>${dict.exploreTitle}</h2>
<nav aria-label="Explore" class="explore" id="explore"></nav>
<section class="card method" id="method"></section>
</main>
</div>
<script type="module" src="/src/app.js"></script>
</body>
</html>`;
}

// -------------------------------------------------------------
// CHAMPIONS LEAGUE PAGE GENERATOR
// -------------------------------------------------------------
function generateChampionsLeague(lang) {
  const L = LANGS[lang];
  const dict = {
    es: {
      title: "Goles de Lionel Messi en Champions League: 129 Goles y 4 Títulos",
      desc: "Récord de Lionel Messi en UEFA Champions League: 129 goles en 163 partidos (0,79 por partido), 4 títulos, 8 hat-tricks y desglose completo por fases.",
      eyebrow: "Dominio Europeo",
      eyebrowSub: "Récord en UEFA Champions League",
      h1: "Goles de Lionel Messi en Champions League",
      lede: "Lionel Messi anotó 129 goles en 163 partidos de la UEFA Champions League a lo largo de 19 temporadas consecutivas con el Barcelona y el Paris Saint-Germain, ganando la Copa de Europa en 4 ocasiones.",
      kpiGoals: "Goles UCL",
      kpiGoalsNote: "120 Barcelona, 9 PSG",
      kpiApps: "Partidos",
      kpiAppsNote: "0,79 Goles por Partido",
      kpiTrophies: "Títulos Ganados",
      kpiTrophiesNote: "2006, 2009, 2011, 2015",
      kpiHatTricks: "Hat-Tricks UCL",
      kpiHatTricksNote: "Récord Histórico Compartido",
      stageHead: "Goles por Fase del Torneo",
      thStage: "Fase",
      thGoals: "Goles",
      thApps: "Partidos",
      thRatio: "Promedio",
      thHighlights: "Momentos Icónicos",
      rowGroup: "Fase de Grupos",
      rowGroupHl: "Hat-trick al Man City, 4 goles al PSV",
      rowR16: "Octavos de Final",
      rowR16Hl: "5 goles al Leverkusen (2012), 2 al Chelsea (2018)",
      rowQf: "Cuartos de Final",
      rowQfHl: "4 goles al Arsenal (2010), 2 al Man United (2019)",
      rowSf: "Semifinales",
      rowSfHl: "Gol antológico en el Bernabéu (2011), 2 al Bayern (2015)",
      rowFinal: "Finales",
      rowFinalHl: "Gol de cabeza en Roma (2009), Zurdazo en Wembley (2011)",
      rowTotal: "Total en Champions League",
      rowTotalHl: "4 Copas de Europa",
      bdayBadge: "🎂 HERRAMIENTA VIRAL INTERACTIVA",
      bdayTitle: "¿Marcó Lionel Messi en Champions League en tu cumpleaños?",
      bdayDesc: "Busca entre los 366 días del calendario con videos de cada uno de los 129 goles de Messi en Champions League.",
      bdayBtn: "Verificar Mi Cumpleaños ⚽",
      faqHead: "Preguntas Frecuentes",
      q1: "¿Cuántos goles marcó Messi en Champions League con el Barcelona?",
      a1: "Lionel Messi marcó 120 goles en Champions League con el FC Barcelona, la mayor cantidad de goles anotados para un solo club en la historia del torneo.",
      q2: "¿En qué finales de Champions League marcó gol Messi?",
      a2: "Messi marcó en dos finales de Champions League, ambas contra el Manchester United: un histórico cabezazo en Roma 2009 (2-0) y un disparo desde fuera del área en Wembley 2011 (3-1).",
      q3: "¿Cuál es el partido con más goles de Messi en Champions League?",
      a3: "El 7 de marzo de 2012, Messi anotó 5 goles en un solo partido de Champions League contra el Bayer Leverkusen (7-1), siendo el primer jugador en la historia moderna del torneo en lograrlo.",
      q4: "¿A cuántos clubes diferentes les marcó gol Messi en Champions League?",
      a4: "Lionel Messi posee el récord histórico de la UEFA Champions League habiendo anotado contra 40 clubes rivales diferentes a lo largo de su carrera europea.",
      videoName: "Gol de Lionel Messi en la Final de Champions 2011 contra Manchester United",
      videoDesc: "Disparo lejano de Lionel Messi en el minuto 54 batiendo a Van der Sar en la victoria 3-1 del Barcelona en Wembley."
    },
    pt: {
      title: "Gols de Lionel Messi na Champions League: 129 Gols e 4 Títulos",
      desc: "Recorde de Lionel Messi na UEFA Champions League: 129 gols em 163 jogos (0,79 por jogo), 4 títulos da UCL, 8 hat-tricks e fases eliminatórias.",
      eyebrow: "Domínio Europeu",
      eyebrowSub: "Recorde na UEFA Champions League",
      h1: "Gols de Lionel Messi na Champions League",
      lede: "Lionel Messi marcou 129 gols em 163 jogos da UEFA Champions League ao longo de 19 temporadas consecutivas pelo Barcelona e Paris Saint-Germain, vencendo a Liga dos Campeões 4 vezes.",
      kpiGoals: "Gols na UCL",
      kpiGoalsNote: "120 Barcelona, 9 PSG",
      kpiApps: "Jogos",
      kpiAppsNote: "0,79 Gols por Jogo",
      kpiTrophies: "Títulos Conquistados",
      kpiTrophiesNote: "2006, 2009, 2011, 2015",
      kpiHatTricks: "Hat-Tricks na UCL",
      kpiHatTricksNote: "Recorde Histórico Compartilhado",
      stageHead: "Gols por Fase do Torneio",
      thStage: "Fase",
      thGoals: "Gols",
      thApps: "Jogos",
      thRatio: "Média",
      thHighlights: "Momentos Marcantes",
      rowGroup: "Fase de Grupos",
      rowGroupHl: "Hat-trick contra o Man City, 4 gols contra o PSV",
      rowR16: "Oitavas de Final",
      rowR16Hl: "5 gols contra o Leverkusen (2012), 2 contra o Chelsea (2018)",
      rowQf: "Quartas de Final",
      rowQfHl: "4 gols contra o Arsenal (2010), 2 contra o Man United (2019)",
      rowSf: "Semifinais",
      rowSfHl: "Gol antológico no Bernabéu (2011), 2 contra o Bayern (2015)",
      rowFinal: "Finais",
      rowFinalHl: "Gol de cabeça em Roma (2009), Chute em Wembley (2011)",
      rowTotal: "Total na Champions League",
      rowTotalHl: "4 Copas da Europa",
      bdayBadge: "🎂 FERRAMENTA VIRAL INTERATIVA",
      bdayTitle: "Lionel Messi marcou na Champions League no dia do seu aniversário?",
      bdayDesc: "Pesquise os 366 dias do calendário com vídeos de cada um dos 129 gols de Messi na Champions League.",
      bdayBtn: "Verificar Meu Aniversário ⚽",
      faqHead: "Perguntas Frequentes",
      q1: "Quantos gols Messi marcou na Champions League pelo Barcelona?",
      a1: "Lionel Messi marcou 120 gols na Champions League pelo FC Barcelona — o maior número de gols por um único clube na história da competição.",
      q2: "Em quais finais de Champions League Messi marcou gol?",
      a2: "Messi marcou em duas finais de Champions League, ambas contra o Manchester United: de cabeça em Roma 2009 (2-0) e com um chute preciso em Wembley 2011 (3-1).",
      q3: "Qual foi o jogo com mais gols de Messi na Champions League?",
      a3: "Em 7 de março de 2012, Messi marcou 5 gols em uma única partida da Champions League contra o Bayer Leverkusen (7-1), tornando-se o primeiro jogador na era moderna da UCL a atingir esse feito.",
      q4: "Contra quantos clubes diferentes Messi marcou na Champions League?",
      a4: "Lionel Messi detém o recorde histórico da UEFA Champions League ao marcar contra 40 clubes adversários diferentes ao longo de sua carreira.",
      videoName: "Gol de Lionel Messi na Final da Champions de 2011 contra o Manchester United",
      videoDesc: "Veja o golaço de Messi de fora da área aos 54 minutos na vitória do Barcelona por 3 a 1 em Wembley."
    },
    fr: {
      title: "Buts de Lionel Messi en Ligue des Champions : 129 Buts et 4 Titres",
      desc: "Bilan de Lionel Messi en Ligue des Champions : 129 buts en 163 matchs (0,79 but/match), 4 trophées, 8 triplés et détails par tour.",
      eyebrow: "Maîtrise Européenne",
      eyebrowSub: "Bilan en Ligue des Champions de l'UEFA",
      h1: "Buts de Lionel Messi en Ligue des Champions",
      lede: "Lionel Messi a inscrit 129 buts en 163 matchs de Ligue des Champions de l'UEFA sur 19 campagnes consécutives avec Barcelone et le Paris Saint-Germain, remportant 4 Coupes d'Europe.",
      kpiGoals: "Buts en LDC",
      kpiGoalsNote: "120 Barcelone, 9 PSG",
      kpiApps: "Matchs Joués",
      kpiAppsNote: "0,79 But par Match",
      kpiTrophies: "Trophées Remportés",
      kpiTrophiesNote: "2006, 2009, 2011, 2015",
      kpiHatTricks: "Triplés en LDC",
      kpiHatTricksNote: "Record Historique Partagé",
      stageHead: "Buts par Phase de la Compétition",
      thStage: "Phase",
      thGoals: "Buts",
      thApps: "Matchs",
      thRatio: "Ratio",
      thHighlights: "Faits Marquants",
      rowGroup: "Phase de Groupes",
      rowGroupHl: "Triplé contre Manchester City, 4 buts contre le PSV",
      rowR16: "Huitièmes de Finale",
      rowR16Hl: "5 buts contre Leverkusen (2012), 2 contre Chelsea (2018)",
      rowQf: "Quarts de Finale",
      rowQfHl: "4 buts contre Arsenal (2010), 2 contre Man United (2019)",
      rowSf: "Demi-Finales",
      rowSfHl: "Slalom historique au Bernabéu (2011), 2 contre le Bayern (2015)",
      rowFinal: "Finales",
      rowFinalHl: "Tête mémorable à Rome (2009), Frappe limpide à Wembley (2011)",
      rowTotal: "Total Ligue des Champions",
      rowTotalHl: "4 Coupes d'Europe",
      bdayBadge: "🎂 OUTIL VIRAL INTERACTIF",
      bdayTitle: "Lionel Messi a-t-il marqué en Ligue des Champions le jour de votre anniversaire ?",
      bdayDesc: "Recherchez parmi les 366 jours de l'année avec les vidéos de chacun des 129 buts de Messi en Ligue des Champions.",
      bdayBtn: "Vérifier Mon Anniversaire ⚽",
      faqHead: "Questions Fréquemment Posées",
      q1: "Combien de buts Messi a-t-il marqués en Ligue des Champions pour Barcelone ?",
      a1: "Lionel Messi a inscrit 120 buts en Ligue des Champions avec le FC Barcelone, le plus grand nombre de buts marqués pour un seul club dans l'histoire de la compétition.",
      q2: "Dans quelles finales de Ligue des Champions Messi a-t-il marqué ?",
      a2: "Messi a marqué dans deux finales de Ligue des Champions, toutes deux contre Manchester United : une tête lobée à Rome en 2009 (2-0) et une frappe limpide à Wembley en 2011 (3-1).",
      q3: "Quel est le match où Messi a marqué le plus de buts en Ligue des Champions ?",
      a3: "Le 7 mars 2012, Messi a inscrit 5 buts dans un seul match de Ligue des Champions face au Bayer Leverkusen (7-1), devenant le premier joueur de l'histoire moderne de la compétition à réussir un quintuplé.",
      q4: "Contre combien de clubs différents Messi a-t-il marqué en C1 ?",
      a4: "Lionel Messi détient le record absolu de la Ligue des Champions de l'UEFA en ayant marqué contre 40 clubs différents tout au long de sa carrière européenne.",
      videoName: "But de Lionel Messi en Finale de Ligue des Champions 2011 contre Manchester United",
      videoDesc: "Frappe puissante de Lionel Messi à la 54e minute trompant Edwin van der Sar lors de la victoire 3-1 du Barça à Wembley."
    }
  }[lang];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `https://www.messistat.com/${lang}/champions-league#webpage`,
        "url": `https://www.messistat.com/${lang}/champions-league`,
        "name": `${dict.title} | MessiStats`,
        "description": dict.desc,
        "dateModified": "2026-09-18",
        "inLanguage": lang
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": L.nav.home, "item": `https://www.messistat.com/${lang}` },
          { "@type": "ListItem", "position": 2, "name": L.nav.ucl, "item": `https://www.messistat.com/${lang}/champions-league` }
        ]
      },
      {
        "@type": "FAQPage",
        "@id": `https://www.messistat.com/${lang}/champions-league#faq`,
        "mainEntity": [
          {
            "@type": "Question",
            "name": dict.q1,
            "acceptedAnswer": { "@type": "Answer", "text": dict.a1 }
          },
          {
            "@type": "Question",
            "name": dict.q2,
            "acceptedAnswer": { "@type": "Answer", "text": dict.a2 }
          },
          {
            "@type": "Question",
            "name": dict.q3,
            "acceptedAnswer": { "@type": "Answer", "text": dict.a3 }
          },
          {
            "@type": "Question",
            "name": dict.q4,
            "acceptedAnswer": { "@type": "Answer", "text": dict.a4 }
          }
        ]
      },
      {
        "@type": "VideoObject",
        "name": dict.videoName,
        "description": dict.videoDesc,
        "thumbnailUrl": "https://www.messistat.com/img/era-2011-wembley.webp",
        "uploadDate": "2011-05-28T20:45:00Z",
        "contentUrl": "https://cdn.messiallgoals.com/Goal180.mp4",
        "embedUrl": `https://www.messistat.com/en/birthday/05-28`
      }
    ]
  };

  const footerDirHead = {
    es: "Registros y Rivalidades",
    pt: "Registros e Rivalidades",
    fr: "Statistiques et Rivalités"
  }[lang] || "Career Records & Rivalries";

  const footerLangsHead = {
    es: "Idiomas / Languages",
    pt: "Idiomas / Languages",
    fr: "Éditions Internationales / Languages"
  }[lang] || "International Editions / Idiomas";

  const exploreHead = {
    es: "Explora todas las estadísticas",
    pt: "Explore todas as estatísticas",
    fr: "Explorer toutes les statistiques"
  }[lang] || "Explore the full statistics";

  return `${renderHeadBoilerplate(lang, "champions-league", dict.title, dict.desc)}
<script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
</script>
<body data-page="champions-league">
<a class="skip" href="#main">${L.skip}</a>
${renderRailNav(lang, "champions-league")}
<div class="page">
  <main class="wrap" id="main">
    <p class="eyebrow">${dict.eyebrow} <i></i> <span>${dict.eyebrowSub}</span></p>
    <h1>${dict.h1}</h1>
    <p class="lede">${dict.lede}</p>

    <div class="kpis kpis-4" style="margin-bottom: 24px;">
      <div class="kpi">
        <span class="kpi-label">${dict.kpiGoals}</span>
        <span class="kpi-value tnum" style="color:var(--accent);">129</span>
        <span class="kpi-note">${dict.kpiGoalsNote}</span>
      </div>
      <div class="kpi">
        <span class="kpi-label">${dict.kpiApps}</span>
        <span class="kpi-value tnum">163</span>
        <span class="kpi-note">${dict.kpiAppsNote}</span>
      </div>
      <div class="kpi">
        <span class="kpi-label">${dict.kpiTrophies}</span>
        <span class="kpi-value tnum">4</span>
        <span class="kpi-note">${dict.kpiTrophiesNote}</span>
      </div>
      <div class="kpi">
        <span class="kpi-label">${dict.kpiHatTricks}</span>
        <span class="kpi-value tnum">8</span>
        <span class="kpi-note">${dict.kpiHatTricksNote}</span>
      </div>
    </div>

    ${renderAdSlot(lang)}

    <!-- Stage by Stage Breakdown -->
    <div class="shead"><h2>${dict.stageHead}</h2></div>
    <div class="table-wrap card">
      <table class="data-table">
        <thead>
          <tr>
            <th class="left">${dict.thStage}</th>
            <th>${dict.thGoals}</th>
            <th>${dict.thApps}</th>
            <th>${dict.thRatio}</th>
            <th class="left">${dict.thHighlights}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="left"><b>${dict.rowGroup}</b></td>
            <td><b>80</b></td>
            <td>86</td>
            <td>0.93</td>
            <td class="left">${dict.rowGroupHl}</td>
          </tr>
          <tr>
            <td class="left"><b>${dict.rowR16}</b></td>
            <td><b>29</b></td>
            <td>36</td>
            <td>0.81</td>
            <td class="left">${dict.rowR16Hl}</td>
          </tr>
          <tr>
            <td class="left"><b>${dict.rowQf}</b></td>
            <td><b>12</b></td>
            <td>24</td>
            <td>0.50</td>
            <td class="left">${dict.rowQfHl}</td>
          </tr>
          <tr>
            <td class="left"><b>${dict.rowSf}</b></td>
            <td><b>6</b></td>
            <td>15</td>
            <td>0.40</td>
            <td class="left">${dict.rowSfHl}</td>
          </tr>
          <tr>
            <td class="left"><b>${dict.rowFinal}</b></td>
            <td><b>2</b></td>
            <td>3</td>
            <td>0.67</td>
            <td class="left">${dict.rowFinalHl}</td>
          </tr>
          <tr style="font-weight: 800; background: var(--surface);">
            <td class="left">${dict.rowTotal}</td>
            <td>129</td>
            <td>163</td>
            <td>0.79</td>
            <td class="left">${dict.rowTotalHl}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- VIRAL MAIN ATTRACTION: Birthday Promo Card -->
    <aside class="bday-promo-card" aria-label="${dict.bdayTitle}">
      <div class="bday-promo-badge">${dict.bdayBadge}</div>
      <div class="bday-promo-body">
        <div class="bday-promo-text">
          <h3>${dict.bdayTitle}</h3>
          <p>${dict.bdayDesc}</p>
        </div>
        <a href="/${lang}/birthday" class="btn btn-primary bday-promo-btn">${dict.bdayBtn}</a>
      </div>
    </aside>

    <!-- FAQ Section -->
    <div class="shead"><h2>${dict.faqHead}</h2></div>
    <div class="qa-grid">
      <div class="card qa-card">
        <h3>${dict.q1}</h3>
        <p>${dict.a1}</p>
      </div>
      <div class="card qa-card">
        <h3>${dict.q2}</h3>
        <p>${dict.a2}</p>
      </div>
      <div class="card qa-card">
        <h3>${dict.q3}</h3>
        <p>${dict.a3}</p>
      </div>
      <div class="card qa-card">
        <h3>${dict.q4}</h3>
        <p>${dict.a4}</p>
      </div>
    </div>

    <h2>${exploreHead}</h2>
    <footer class="site-footer">
      <nav class="footer-nav" aria-label="Site directory">
        <div class="footer-group">
          <span class="footer-heading">${footerDirHead}</span>
          <div class="footer-links">
            <a href="/${lang}">${L.nav.home}</a>
            <a href="/${lang}/birthday">🎂 ${L.nav.bday}</a>
            <a href="/${lang}/messi-vs-ronaldo">🐐 ${L.nav.ronaldo}</a>
            <a href="/${lang}/vs-real-madrid">⚔️ ${L.nav.madrid}</a>
            <a href="/${lang}/champions-league">⭐ ${L.nav.ucl}</a>
            <a href="/${lang}/goalsbyyear">${L.nav.byyear}</a>
            <a href="/${lang}/goalsbyseason">${L.nav.byseason}</a>
            <a href="/${lang}/dashboard">${L.nav.dashboard}</a>
            <a href="/${lang}/timeline">${L.nav.timeline}</a>
            <a href="/${lang}/achievements">${L.nav.achievements}</a>
          </div>
        </div>
        <div class="footer-group">
          <span class="footer-heading">${footerLangsHead}</span>
          <div class="footer-links footer-langs">
            <a href="/en" hreflang="en">English</a>
            <a href="/es" hreflang="es">Español</a>
            <a href="/pt" hreflang="pt">Português</a>
            <a href="/fr" hreflang="fr">Français</a>
          </div>
        </div>
      </nav>
      <p id="foot-date"></p>
    </footer>
  </main>
</div>

<script src="/src/app.js" type="module"></script>
</body>
</html>`;
}

const generators = {
  "dashboard.html": generateDashboard,
  "goalsbyseason.html": generateGoalsBySeason,
  "goalsbyyear.html": generateGoalsByYear,
  "timeline.html": generateTimeline,
  "achievements.html": generateAchievements,
  "birthday.html": generateBirthday,
  "vs-real-madrid.html": generateVsRealMadrid,
  "champions-league.html": generateChampionsLeague,
};

let createdCount = 0;
const targetLangs = ["pt", "fr"];

for (const lang of targetLangs) {
  const langDir = path.join(rootDir, lang);
  if (!fs.existsSync(langDir)) {
    fs.mkdirSync(langDir, { recursive: true });
  }

  for (const [filename, genFn] of Object.entries(generators)) {
    const filePath = path.join(langDir, filename);
    const content = genFn(lang);
    fs.writeFileSync(filePath, content, "utf8");
    createdCount++;
  }
}

// Generate Spanish Champions League
const esDir = path.join(rootDir, "es");
if (!fs.existsSync(esDir)) {
  fs.mkdirSync(esDir, { recursive: true });
}
fs.writeFileSync(path.join(esDir, "champions-league.html"), generateChampionsLeague("es"), "utf8");
createdCount++;

console.log(`Successfully generated ${createdCount} localized subpages.`);
