import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const NAV_LABELS = {
  en: {
    badgeAria: "MessiStats home",
    langName: "English",
    langTag: "EN",
    langSelectAria: "Select Language (English)",
    langSelectTitle: "Select Language",
    home: "Home",
    latestGoal: "Latest Goal",
    bday: "Birthday Goals",
    ronaldo: "vs Ronaldo",
    madrid: "vs Real Madrid",
    ucl: "UCL Hub",
    byyear: "Goals by Year",
    byseason: "Goals by Season",
    dashboard: "Dashboard",
    timeline: "Through the Years",
    achievements: "Achievements",
    themeToggle: "Toggle dark mode",
    darkMode: "Dark mode"
  },
  es: {
    badgeAria: "Inicio MessiStats",
    langName: "Español",
    langTag: "ES",
    langSelectAria: "Seleccionar idioma (Español)",
    langSelectTitle: "Seleccionar idioma",
    home: "Inicio",
    latestGoal: "Último Gol",
    bday: "Cumpleaños",
    ronaldo: "vs Ronaldo",
    madrid: "vs Real Madrid",
    ucl: "Champions League",
    byyear: "Goles por Año",
    byseason: "Temporadas",
    dashboard: "Panel",
    timeline: "Historia",
    achievements: "Títulos",
    themeToggle: "Cambiar tema",
    darkMode: "Modo oscuro"
  },
  pt: {
    badgeAria: "MessiStats",
    langName: "Português",
    langTag: "PT",
    langSelectAria: "Selecionar idioma (Português)",
    langSelectTitle: "Selecionar idioma",
    home: "Início",
    latestGoal: "Último Gol",
    bday: "Aniversário",
    ronaldo: "vs Ronaldo",
    madrid: "vs Real Madrid",
    ucl: "Champions League",
    byyear: "Gols por Ano",
    byseason: "Temporadas",
    dashboard: "Painel",
    timeline: "História",
    achievements: "Títulos",
    themeToggle: "Alternar tema",
    darkMode: "Modo escuro"
  },
  fr: {
    badgeAria: "Accueil MessiStats",
    langName: "Français",
    langTag: "FR",
    langSelectAria: "Changer de langue (Français)",
    langSelectTitle: "Changer de langue",
    home: "Accueil",
    latestGoal: "Dernier But",
    bday: "Anniversaire",
    ronaldo: "vs Ronaldo",
    madrid: "vs Real Madrid",
    ucl: "Ligue des Champions",
    byyear: "Buts par Année",
    byseason: "Saisons",
    dashboard: "Tableau de bord",
    timeline: "Histoire",
    achievements: "Palmarès",
    themeToggle: "Basculer le thème",
    darkMode: "Mode sombre"
  },
  ar: {
    badgeAria: "الرئيسية MessiStats",
    langName: "العربية",
    langTag: "AR",
    langSelectAria: "اختر اللغة (العربية)",
    langSelectTitle: "اختر اللغة",
    home: "الرئيسية",
    latestGoal: "آخر هدف",
    bday: "عيد الميلاد",
    ronaldo: "ضد رونالدو",
    madrid: "ضد ريال مدريد",
    ucl: "دوري الأبطال",
    byyear: "الأهداف سنوياً",
    byseason: "المواسم",
    dashboard: "لوحة البيانات",
    timeline: "التاريخ",
    achievements: "البطولات",
    themeToggle: "تبديل الوضع",
    darkMode: "الوضع الداكن"
  },
  bn: {
    badgeAria: "হোম MessiStats",
    langName: "বাংলা",
    langTag: "BN",
    langSelectAria: "ভাষা নির্বাচন করুন (বাংলা)",
    langSelectTitle: "ভাষা নির্বাচন করুন",
    home: "হোম",
    latestGoal: "সাম্প্রতিক গোল",
    bday: "জন্মদিন",
    ronaldo: "বনাম রোনালদো",
    madrid: "বনাম রিয়াল মাদ্রিদ",
    ucl: "চ্যাম্পিয়ন্স লিগ",
    byyear: "বছর অনুযায়ী",
    byseason: "মৌসুম",
    dashboard: "ড্যাশবোর্ড",
    timeline: "টাইমলাইন",
    achievements: "অর্জন",
    themeToggle: "থিম পরিবর্তন",
    darkMode: "ডার্ক মোড"
  },
  hi: {
    badgeAria: "होम MessiStats",
    langName: "हिन्दी",
    langTag: "HI",
    langSelectAria: "भाषा चुनें (हिन्दी)",
    langSelectTitle: "भाषा चुनें",
    home: "होम",
    latestGoal: "ताजा गोल",
    bday: "जन्मदिन",
    ronaldo: "बनाम रोनाल्डो",
    madrid: "बनाम रियल मैड्रिड",
    ucl: "चैंपियंस लीग",
    byyear: "वर्षवार गोल",
    byseason: "सीज़न",
    dashboard: "डैशबोर्ड",
    timeline: "इतिहास",
    achievements: "उपलब्धियां",
    themeToggle: "थीम बदलें",
    darkMode: "डार्क मोड"
  },
  ro: {
    badgeAria: "MessiStats Acasă",
    langName: "Română",
    langTag: "RO",
    langSelectAria: "Selectează limba (Română)",
    langSelectTitle: "Selectează limba",
    home: "Acasă",
    latestGoal: "Ultimul Gol",
    bday: "Zi de naștere",
    ronaldo: "vs Ronaldo",
    madrid: "vs Real Madrid",
    ucl: "Champions League",
    byyear: "Goluri pe An",
    byseason: "Sezoane",
    dashboard: "Panou",
    timeline: "Istorie",
    achievements: "Trofee",
    themeToggle: "Comută tema",
    darkMode: "Mod întunecat"
  },
  uz: {
    badgeAria: "MessiStats Asosiy",
    langName: "O'zbekcha",
    langTag: "UZ",
    langSelectAria: "Tilni tanlang (O'zbekcha)",
    langSelectTitle: "Tilni tanlang",
    home: "Asosiy",
    latestGoal: "Soʻnggi gol",
    bday: "Tug'ilgan kun",
    ronaldo: "vs Ronaldu",
    madrid: "vs Real Madrid",
    ucl: "Chempionlar Ligasi",
    byyear: "Yillar bo'yicha",
    byseason: "Mavsumlar",
    dashboard: "Boshqaruv paneli",
    timeline: "Tarix",
    achievements: "Sovrinlar",
    themeToggle: "Mavzuni o'zgartirish",
    darkMode: "Qorong'i rejim"
  }
};

function generateRailHtml(lang, activeSlug) {
  const L = NAV_LABELS[lang] || NAV_LABELS.en;
  const isAct = (slug) => activeSlug === slug;
  const onAria = (slug) => isAct(slug) ? ' aria-current="page" class="on"' : '';
  const onBday = (slug) => isAct(slug) ? ' aria-current="page" class="on nav-bday-link"' : ' class="nav-bday-link"';

  const uclLink = lang === "en" ? "/en/champions-league" : `/${lang}/champions-league`;
  const uclItem = `\n<a${onAria("champions-league")} href="${uclLink}" aria-label="${L.ucl}"><svg aria-hidden="true" viewbox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg><span>${L.ucl}</span></a>`;

  const latestGoalLink = lang === "en" ? "/en/latest-goal" : `/${lang}/latest-goal`;
  const latestGoalItem = `\n<a${onAria("latest-goal")} href="${latestGoalLink}" aria-label="${L.latestGoal}"><svg aria-hidden="true" viewbox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8" fill="currentColor"></polygon></svg><span>${L.latestGoal} <b class="nav-badge-hot">LIVE ⚡</b></span></a>`;

  const adminLink = "";

  return `<aside aria-label="Navigation" class="rail">
<a aria-label="${L.badgeAria}" class="rail-badge" href="/${lang}"><svg aria-hidden="true" class="rail-mark" viewbox="0 0 64 64"><defs><lineargradient id="msg-${lang}-${activeSlug}" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#6d0f2e"></stop><stop offset=".55" stop-color="#1d3fae"></stop><stop offset="1" stop-color="#0e7cc0"></stop></lineargradient></defs><path d="M32 3 55 10v20c0 16-11 26-23 31C20 56 9 46 9 30V10Z" fill="url(#msg-${lang}-${activeSlug})" stroke="#e3b93e" stroke-linejoin="round" stroke-width="2.5"></path><path d="M47.5 9.5l1.7 3.5 3.8.6-2.8 2.7.7 3.8-3.4-1.8-3.4 1.8.7-3.8-2.8-2.7 3.8-.6z" fill="#e3b93e"></path><text fill="#fff" font-family="'Plus Jakarta Sans',Arial,sans-serif" font-size="19" font-weight="800" text-anchor="middle" x="31" y="44">M10</text></svg><span class="rail-word">Messi<b>Stats</b></span></a>
<div class="rail-lang-wrap">
  <button type="button" class="rail-lang-btn" id="rail-lang-btn" aria-label="${L.langSelectAria}" title="${L.langSelectTitle}">
    <svg class="rail-lang-globe" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="2" y1="12" x2="22" y2="12"></line>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
    </svg>
    <span class="rail-lang-label">${L.langName}</span>
    <span class="rail-lang-tag">${L.langTag}</span>
  </button>
</div>
<nav>
<a${onAria("home")} href="/${lang}" aria-label="${L.home}"><svg aria-hidden="true" viewbox="0 0 24 24"><path d="M3 11.5 12 3l9 8.5"></path><path d="M5.5 10.5V21h5v-6h3v6h5V10.5"></path></svg><span>${L.home}</span></a>${latestGoalItem}
<a${onBday("birthday")} href="/${lang}/birthday" aria-label="${L.bday}"><svg aria-hidden="true" viewbox="0 0 24 24"><rect height="4" rx="1" width="18" x="3" y="8"></rect><path d="M12 8v13M19 12v9H5v-9M7.5 8a2.5 2.5 0 0 1 0-5A4.8 4.8 0 0 1 12 8a4.8 4.8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"></path></svg><span>${L.bday} <b class="nav-badge-hot">HOT 🔥</b></span></a>
<a${onAria("messi-vs-ronaldo")} href="/${lang}/messi-vs-ronaldo" aria-label="${L.ronaldo}"><svg aria-hidden="true" viewbox="0 0 24 24"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1"></path><path d="M18 8l4 4-4 4"></path></svg><span>${L.ronaldo}</span></a>
<a${onAria("vs-real-madrid")} href="/${lang}/vs-real-madrid" aria-label="${L.madrid}"><svg aria-hidden="true" viewbox="0 0 24 24"><path d="M14.5 17.5 3 6V3h3l11.5 11.5"></path><path d="m13 19 6-6"></path><path d="m16 16 4 4"></path><path d="m19 21 2-2"></path></svg><span>${L.madrid}</span></a>${uclItem}
<a${onAria("byyear")} href="/${lang}/goalsbyyear" aria-label="${L.byyear}"><svg aria-hidden="true" viewbox="0 0 24 24"><rect height="15.5" rx="2.5" width="17" x="3.5" y="5"></rect><path d="M3.5 10h17M8 2.8V6.5M16 2.8V6.5"></path></svg><span>${L.byyear}</span></a>
<a${onAria("byseason")} href="/${lang}/goalsbyseason" aria-label="${L.byseason}"><svg aria-hidden="true" viewbox="0 0 24 24"><rect height="7.5" rx="1.5" width="7.5" x="3.5" y="3.5"></rect><rect height="7.5" rx="1.5" width="7.5" x="13" y="3.5"></rect><rect height="7.5" rx="1.5" width="7.5" x="3.5" y="13"></rect><rect height="7.5" rx="1.5" width="7.5" x="13" y="13"></rect></svg><span>${L.byseason}</span></a>
<a${onAria("dashboard")} href="/${lang}/dashboard" aria-label="${L.dashboard}"><svg aria-hidden="true" viewbox="0 0 24 24"><path d="M3.5 20.5h17"></path><path d="M6.5 20v-7M12 20V5M17.5 20v-10"></path></svg><span>${L.dashboard}</span></a>
<a${onAria("timeline")} href="/${lang}/timeline" aria-label="${L.timeline}"><svg aria-hidden="true" viewbox="0 0 24 24"><circle cx="12" cy="12" r="8.5"></circle><path d="M12 7.5V12l3 2"></path></svg><span>${L.timeline}</span></a>
<a${onAria("achievements")} href="/${lang}/achievements" aria-label="${L.achievements}"><svg aria-hidden="true" viewbox="0 0 24 24"><path d="M8 3.5h8V9a4 4 0 0 1-8 0V3.5Z"></path><path d="M8 5H4.5A1.5 1.5 0 0 0 6 10H8M16 5h3.5A1.5 1.5 0 0 1 18 10h-2M12 13v3.5M8.5 20.5h7M10 16.5h4V20h-4z"></path></svg><span>${L.achievements}</span></a>
</nav>
<button aria-label="${L.themeToggle}" class="theme-toggle" id="theme-toggle" title="${L.themeToggle}" type="button">
<svg aria-hidden="true" class="sun-icon" viewbox="0 0 24 24"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path></svg>
<svg aria-hidden="true" class="moon-icon" viewbox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
<span class="theme-label">${L.darkMode}</span>
</button>
</aside>`;
}

function updateFileRail(filePath, lang, activeSlug) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, "utf8");

  const railRegex = /<aside[^>]*class=["'][^"']*rail[^"']*["'][^>]*>[\s\S]*?<\/aside>/i;
  if (!railRegex.test(content)) {
    console.warn(`No rail found in ${filePath}`);
    return;
  }

  const newRail = generateRailHtml(lang, activeSlug);
  content = content.replace(railRegex, newRail);

  fs.writeFileSync(filePath, content, "utf8");
}

const PAGES_MAP = {
  "index.html": "home",
  "latest-goal.html": "latest-goal",
  "birthday.html": "birthday",
  "messi-vs-ronaldo.html": "messi-vs-ronaldo",
  "vs-real-madrid.html": "vs-real-madrid",
  "champions-league.html": "champions-league",
  "goalsbyyear.html": "byyear",
  "goalsbyseason.html": "byseason",
  "dashboard.html": "dashboard",
  "timeline.html": "timeline",
  "achievements.html": "achievements",
  "admin.html": "admin"
};

// 1. Root English files
for (const [file, slug] of Object.entries(PAGES_MAP)) {
  updateFileRail(path.join(rootDir, file), "en", slug);
}

// 2. All 8 localized languages (es, pt, fr, ar, bn, hi, ro, uz)
const ALL_LANGS = ["es", "pt", "fr", "ar", "bn", "hi", "ro", "uz"];
for (const lang of ALL_LANGS) {
  for (const [file, slug] of Object.entries(PAGES_MAP)) {
    if (file === "admin.html") continue;
    updateFileRail(path.join(rootDir, lang, file), lang, slug);
  }
}

console.log("Unified and updated rail navigation across ALL files and ALL languages!");
