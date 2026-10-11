// Generator for all localized subpages across 7 languages: pt, fr, ar, bn, hi, ro, uz
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
  },
  ar: {
    code: "ar",
    name: "العربية",
    tag: "AR",
    dir: "rtl",
    ogLocale: "ar_AR",
    ogLocaleAlt: "ar_EG",
    dateStr: "6 أكتوبر 2026",
    skip: "الانتقال إلى المحتوى الرئيسي",
    backToStats: "← العودة إلى الإحصائيات",
    themeToggle: "تبديل المظهر",
    darkMode: "الوضع الداكن",
    adLabel: "إعلان",
    bdayPromo: {
      badge: "🎂 أداة تفاعلية شائعة",
      title: "هل سجل ميسي في يوم عيد ميلادك؟",
      desc: "ابحث في جميع أيام السنة الـ 366 عبر أهداف ميسي الـ 932. شاهد مقاطع فيديو لكل هدف سُجل في يومك المميز.",
      btn: "تحقق من عيد ميلادي ⚽",
      link: "/ar/birthday"
    },
    nav: {
      home: "الرئيسية",
      bday: "عيد الميلاد",
      ronaldo: "ضد رونالدو",
      madrid: "ضد ريال مدريد",
      ucl: "دوري الأبطال",
      byyear: "الأهداف بالسنة",
      byseason: "المواسم",
      dashboard: "لوحة البيانات",
      timeline: "المسيرة التاريخية",
      achievements: "البطولات والجوائز"
    }
  },
  bn: {
    code: "bn",
    name: "বাংলা",
    tag: "BN",
    dir: "ltr",
    ogLocale: "bn_BD",
    ogLocaleAlt: "bn_IN",
    dateStr: "৬ অক্টোবর ২০২৬",
    skip: "মূল কন্টেন্টে যান",
    backToStats: "← পরিসংখ্যানে ফিরে যান",
    themeToggle: "থিম পরিবর্তন করুন",
    darkMode: "ডার্ক মোড",
    adLabel: "বিজ্ঞাপন",
    bdayPromo: {
      badge: "🎂 ভাইরাল ইন্টারঅ্যাক্টিভ টুল",
      title: "মেসি কি আপনার জন্মদিনে গোল করেছিলেন?",
      desc: "মেসির ৯৩২টি ক্যারিয়ার গোলের মধ্য থেকে বছরের ৩৬৬ দিনের প্রতিটি দিন অনুসন্ধান করুন এবং ভিডিও দেখুন।",
      btn: "আমার জন্মদিন দেখুন ⚽",
      link: "/bn/birthday"
    },
    nav: {
      home: "হোম",
      bday: "জন্মদিন",
      ronaldo: "বনাম রোনালদো",
      madrid: "বনাম রিয়াল মাদ্রিদ",
      ucl: "চ্যাম্পিয়নস লিগ",
      byyear: "বছরভিত্তিক গোল",
      byseason: "মৌসুমভিত্তিক",
      dashboard: "ড্যাশবোর্ড",
      timeline: "ইতিহাস",
      achievements: "অর্জনসমূহ"
    }
  },
  hi: {
    code: "hi",
    name: "हिन्दी",
    tag: "HI",
    dir: "ltr",
    ogLocale: "hi_IN",
    ogLocaleAlt: "en_IN",
    dateStr: "18 सितम्बर 2026",
    skip: "मुख्य सामग्री पर जाएँ",
    backToStats: "← आंकड़ों पर वापस जाएं",
    themeToggle: "थीम बदलें",
    darkMode: "डार्क मोड",
    adLabel: "विज्ञापन",
    bdayPromo: {
      badge: "🎂 वायरल इंटरएक्टिव टूल",
      title: "क्या मेसी ने आपके जन्मदिन पर गोल किया था?",
      desc: "मेसी के 932 करियर गोलों में से साल के सभी 366 दिनों को खोजें और अपने खास दिन के गोल वीडियो देखें।",
      btn: "अपना जन्मदिन चेक करें ⚽",
      link: "/hi/birthday"
    },
    nav: {
      home: "होम",
      bday: "जन्मदिन",
      ronaldo: "बनाम रोनाल्डो",
      madrid: "बनाम रियल मैड्रिड",
      ucl: "चैंपियंस लीग",
      byyear: "साल दर साल",
      byseason: "सीज़न",
      dashboard: "डैशबोर्ड",
      timeline: "इतिहास",
      achievements: "खिताब"
    }
  },
  ro: {
    code: "ro",
    name: "Română",
    tag: "RO",
    dir: "ltr",
    ogLocale: "ro_RO",
    ogLocaleAlt: "ro_MD",
    dateStr: "18 Septembrie 2026",
    skip: "Sari la conținut",
    backToStats: "← Înapoi la statistici",
    themeToggle: "Schimbă tema",
    darkMode: "Mod întunecat",
    adLabel: "Publicitate",
    bdayPromo: {
      badge: "🎂 INSTRUMENT VIRAL INTERACTIV",
      title: "A marcat Messi de ziua ta de naștere?",
      desc: "Caută în toate cele 366 de zile din an de-a lungul celor 932 de goluri din cariera lui Messi. Urmărește videoclipuri pentru fiecare gol.",
      btn: "Verifică Ziua Mea ⚽",
      link: "/ro/birthday"
    },
    nav: {
      home: "Acasă",
      bday: "Zi de naștere",
      ronaldo: "vs Ronaldo",
      madrid: "vs Real Madrid",
      ucl: "Champions League",
      byyear: "Goluri pe Ani",
      byseason: "Sezoane",
      dashboard: "Panou",
      timeline: "Istorie",
      achievements: "Trofee"
    }
  },
  uz: {
    code: "uz",
    name: "O'zbekcha",
    tag: "UZ",
    dir: "ltr",
    ogLocale: "uz_UZ",
    ogLocaleAlt: "uz_CYRL",
    dateStr: "2026 yil 18 sentabr",
    skip: "Asosiy tarkibga o'tish",
    backToStats: "← Statistikaga qaytish",
    themeToggle: "Mavzuni o'zgartirish",
    darkMode: "Qorong'i rejim",
    adLabel: "Reklama",
    bdayPromo: {
      badge: "🎂 VIRAL INTERAKTIV VOSITA",
      title: "Messi sizning tug'ilgan kuningizda gol urganmi?",
      desc: "Messining 932 ta goli orqali yilning barcha 366 kunini qidiring va o'sha kun urilgan gollarning videolarini tomosha qiling.",
      btn: "Tug'ilgan Kunimni Tekshirish ⚽",
      link: "/uz/birthday"
    },
    nav: {
      home: "Asosiy",
      bday: "Tug'ilgan kun",
      ronaldo: "vs Ronaldu",
      madrid: "vs Real Madrid",
      ucl: "Chempionlar Ligasi",
      byyear: "Yillar bo'yicha",
      byseason: "Mavsumlar",
      dashboard: "Boshqaruv paneli",
      timeline: "Tarix",
      achievements: "Sovrinlar"
    }
  }
};

const ALL_LANG_CODES = ["en", "es", "pt", "fr", "ar", "bn", "hi", "ro", "uz"];

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
  out += `<link rel="alternate" hreflang="ar" href="https://www.messistat.com/ar${slugPath}"/>\n`;
  out += `<link rel="alternate" hreflang="ar-EG" href="https://www.messistat.com/ar${slugPath}"/>\n`;
  out += `<link rel="alternate" hreflang="bn" href="https://www.messistat.com/bn${slugPath}"/>\n`;
  out += `<link rel="alternate" hreflang="bn-BD" href="https://www.messistat.com/bn${slugPath}"/>\n`;
  out += `<link rel="alternate" hreflang="bn-IN" href="https://www.messistat.com/bn${slugPath}"/>\n`;
  out += `<link rel="alternate" hreflang="hi" href="https://www.messistat.com/hi${slugPath}"/>\n`;
  out += `<link rel="alternate" hreflang="hi-IN" href="https://www.messistat.com/hi${slugPath}"/>\n`;
  out += `<link rel="alternate" hreflang="ro" href="https://www.messistat.com/ro${slugPath}"/>\n`;
  out += `<link rel="alternate" hreflang="ro-RO" href="https://www.messistat.com/ro${slugPath}"/>\n`;
  out += `<link rel="alternate" hreflang="uz" href="https://www.messistat.com/uz${slugPath}"/>\n`;
  out += `<link rel="alternate" hreflang="uz-UZ" href="https://www.messistat.com/uz${slugPath}"/>\n`;
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
    },
    ar: {
      title: "لوحة البيانات التفاعلية لإحصائيات ليونيل ميسي",
      desc: "لوحة إحصائيات تفاعلية لمسيرة ليونيل ميسي: 932 هدفاً قابلة للتصفية حسب برشلونة، باريس سان جيرمان، إنتر ميامي ومنتخب الأرجنتين.",
      h1: "لوحة إحصائيات ليونيل ميسي",
      lede: "تحليل تفاعلي لـ 932 هدفاً في مسيرة ليونيل ميسي عبر جميع البطولات، المواسم، طرق التسجيل وأجزاء الجسم.",
      compTitle: "في أي بطولات سجل ميسي أكبر عدد من الأهداف؟",
      seasonTitle: "كيف تغير معدله التهديفي موسماً بعد موسم؟",
      teamTitle: "الأهداف مع كل فريق",
      finishTitle: "لعب مفتوح، ركلات جزاء، أم ركلات حرة؟",
      bodyTitle: "بأي قدم أو جزء من الجسم يسجل ميسي؟",
      ageTitle: "الأهداف في كل عمر",
      compTableTitle: "إجماليات المسيرة خلف هذه الرسوم البيانية",
      finishTableTitle: "كيف يسجل ليونيل ميسي أهدافه؟",
      recTitle: "أرقام ميسي القياسية في هذه الإحصائيات",
      exploreTitle: "استكشف جميع الإحصائيات"
    },
    bn: {
      title: "লিওনেল মেসির ইন্টারেক্টিভ পরিসংখ্যান ড্যাশবোর্ড",
      desc: "লিওনেল মেসির ক্যারিয়ারের ৯৩২টি অফিসিয়াল গোলের বিশদ ইন্টারেক্টিভ ড্যাশবোর্ড। দল, প্রতিযোগিতা এবং শারীরিক অংশ অনুযায়ী ফিল্টার করুন।",
      h1: "লিওনেল মেসি পরিসংখ্যান ড্যাশবোর্ড",
      lede: "লিওনেল মেসির ক্যারিয়ারের ৯৩২টি গোলের ইন্টারেক্টিভ বিশ্লেষণ — বার্সেলোনা, পিএসজি, ইন্টার মায়ামি এবং আর্জেন্টিনার জন্য ফিল্টারযোগ্য।",
      compTitle: "মেসি কোন প্রতিযোগিতায় সবচেয়ে বেশি গোল করেছেন?",
      seasonTitle: "মৌসুমের পর মৌসুম তার গোল করার হার কেমন ছিল?",
      teamTitle: "প্রতিটি দলের হয়ে গোল",
      finishTitle: "ওপেন প্লে, পেনাল্টি নাকি ফ্রি-কিক?",
      bodyTitle: "মেসি কোন পায়ে বা শরীরের কোন অংশ দিয়ে গোল করেন?",
      ageTitle: "প্রতি বয়সে গোলের সংখ্যা",
      compTableTitle: "এই চার্টের পেছনের ক্যারিয়ার পরিসংখ্যান",
      finishTableTitle: "লিওনেল মেসি কীভাবে তার গোল করেন?",
      recTitle: "এই পরিসংখ্যানে মেসির বিশ্বরেকর্ড",
      exploreTitle: "সব পরিসংখ্যান দেখুন"
    },
    hi: {
      title: "लियोनेल मेसी इंटरएक्टिव आँकड़े डैशबोर्ड",
      desc: "लियोनेल मेसी के 932 गोलों का विस्तृत इंटरएक्टिव डैशबोर्ड। बार्सिलोना, पीएसजी, इंटर मियामी और अर्जेंटीना के अनुसार फ़िल्टर करें।",
      h1: "लियोनेल मेसी आँकड़े डैशबोर्ड",
      lede: "लियोनेल मेसी के करियर के 932 गोलों का इंटरएक्टिव विश्लेषण — हर प्रतियोगिता, सीज़न और बॉडी पार्ट के अनुसार।",
      compTitle: "मेसी ने किस प्रतियोगिता में सर्वाधिक गोल किए हैं?",
      seasonTitle: "सीज़न दर सीज़न उनकी गोल करने की गति कैसे बदली?",
      teamTitle: "प्रत्येक टीम के लिए गोल",
      finishTitle: "ओपन प्ले, पेनल्टी या फ्री-किक?",
      bodyTitle: "मेसी किस पैर या शरीर के हिस्से से गोल करते हैं?",
      ageTitle: "हर उम्र में गोल",
      compTableTitle: "इन चार्टों के पीछे करियर के कुल आंकड़े",
      finishTableTitle: "लियोनेल मेसी अपने गोल कैसे करते हैं?",
      recTitle: "इन आंकड़ों में मेसी के रिकॉर्ड",
      exploreTitle: "सभी आंकड़े देखें"
    },
    ro: {
      title: "Panou Interactiv de Statistici Lionel Messi",
      desc: "Panou interactiv al carierei lui Lionel Messi: 932 de goluri filtrabile pe Barcelona, PSG, Inter Miami și Argentina.",
      h1: "Panoul de Statistici Lionel Messi",
      lede: "Analiză interactivă a celor 932 de goluri din cariera lui Lionel Messi pe toate competițiile, sezoanele, tipurile de șut și părțile corpului.",
      compTitle: "În ce competiții a marcat Messi cele mai multe goluri?",
      seasonTitle: "Cum a evoluat ritmul său de goluri sezon după sezon?",
      teamTitle: "Goluri cu fiecare echipă",
      finishTitle: "Acțiune deschisă, penalty-uri sau lovituri libere?",
      bodyTitle: "Cu ce picior sau parte a corpului marchează Messi?",
      ageTitle: "Goluri la fiecare vârstă",
      compTableTitle: "Totalurile carierei din spatele acestor grafice",
      finishTableTitle: "Cum marchează Lionel Messi golurile sale?",
      recTitle: "Recordurile lui Messi în aceste cifre",
      exploreTitle: "Explorează toate statisticile"
    },
    uz: {
      title: "Lionel Messi Interaktiv Statistika Paneli",
      desc: "Lionel Messining 932 ta rasmiy goli bo'yicha interaktiv boshqaruv paneli: Barselona, PSJ, Inter Mayami va Argentina bo'yicha saralang.",
      h1: "Lionel Messi Statistika Paneli",
      lede: "Lionel Messining faoliyatidagi 932 ta golining musobaqalar, mavsumlar, zarba turlari va tana a'zolari bo'yicha interaktiv tahlili.",
      compTitle: "Messi qaysi musobaqalarda eng ko'p gol urgan?",
      seasonTitle: "Mavsumdan-mavsumga uning gol urish sur'ati qanday o'zgargan?",
      teamTitle: "Har bir jamoadagi gollar",
      finishTitle: "O'yindan, penaltidan yoki jarima zarbasidan?",
      bodyTitle: "Messi qaysi oyog'i yoki tanasi bilan gol uradi?",
      ageTitle: "Har bir yoshdagi gollar",
      compTableTitle: "Ushbu grafiklar ortidagi umumiy faoliyat ko'rsatkichlari",
      finishTableTitle: "Lionel Messi gollarini qanday uradi?",
      recTitle: "Ushbu raqamlardagi Messi rekordlari",
      exploreTitle: "Barcha statistikalarni o'rganing"
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
    },
    ar: {
      title: "أهداف ميسي حسب الموسم (2004/05–2026)",
      desc: "جميع أهداف ليونيل ميسي حسب الموسم مع الأندية والأرجنتين: 806 هدفاً للأندية و126 للأرجنتين.",
      h1: "أهداف ليونيل ميسي حسب الموسم",
      lede: "جميع مواسم الأندية من 2004/05 إلى 2026 — الرقم القياسي 73 هدفاً في موسم 2011/12 — مع تقسيم الدوري، الكأس والبطولات القارية.",
      clubHead: "جميع مواسم الأندية (برشلونة، باريس، إنتر ميامي)",
      countryHead: "أهداف منتخب الأرجنتين سنة بسنة",
      bestSeasonHead: "ما هو أفضل موسم في مسيرة ليونيل ميسي؟",
      exploreTitle: "استكشف جميع الإحصائيات"
    },
    bn: {
      title: "মৌসুম অনুযায়ী লিওনেল মেসির গোল (২০০৪/০৫–২০২৬)",
      desc: "ক্লাব ও আর্জেন্টিনার হয়ে লিওনেল মেসির প্রতিটি মৌসুমের গোলের হিসাব: ক্লাবে ৮০৬ এবং আর্জেন্টিনার হয়ে ১২৬ গোল।",
      h1: "মৌসুম অনুযায়ী লিওনেল মেসির গোল",
      lede: "২০০৪/০৫ থেকে ২০২৬ পর্যন্ত প্রতিটি ক্লাব মৌসুম — ২০১১/১২ মৌসুমে রেকর্ড ৭৩ গোল সহ লীগ, কাপ ও মহাদেশীয় টুর্নামেন্টের বিভাজন।",
      clubHead: "ক্লাবের হয়ে প্রতিটি মৌসুম (বার্সেলোনা, পিএসজি, ইন্টার মায়ামি)",
      countryHead: "আর্জেন্টিনা জাতীয় দলের হয়ে বছরভিত্তিক গোল",
      bestSeasonHead: "মেসির ক্যারিয়ারের সেরা মৌসুম কোনটি ছিল?",
      exploreTitle: "সব পরিসংখ্যান দেখুন"
    },
    hi: {
      title: "सीज़न अनुसार लियोनेल मेसी के गोल (2004/05–2026)",
      desc: "क्लब और अर्जेंटीना के लिए लियोनेल मेसी के सीज़न दर सीज़न गोल: क्लबों के लिए 806 और अर्जेंटीना के लिए 126 गोल।",
      h1: "सीज़न अनुसार लियोनेल मेसी के गोल",
      lede: "2004/05 से 2026 तक का हर सीज़न — 2011/12 में 73 गोलों का विश्व रिकॉर्ड — लीग, कप और अंतरराष्ट्रीय प्रतियोगिताओं का पूरा ब्यौरा।",
      clubHead: "क्लब सीज़न (बार्सिलोना, पीएसजी, इंटर मियामी)",
      countryHead: "अर्जेंटीना राष्ट्रीय टीम के लिए साल दर साल गोल",
      bestSeasonHead: "मेसी के करियर का सर्वश्रेष्ठ सीज़न कौन सा था?",
      exploreTitle: "सभी आंकड़े देखें"
    },
    ro: {
      title: "Golurile lui Messi pe Sezoane (2004/05–2026)",
      desc: "Toate golurile lui Lionel Messi pe sezoane la cluburi și națională: 806 la cluburi și 126 pentru Argentina.",
      h1: "Golurile lui Lionel Messi pe Sezoane",
      lede: "Fiecare sezon de club din 2004/05 până în 2026 — record: 73 de goluri în 2011/12 — cu detalii pe campionat, cupă și meciuri europene.",
      clubHead: "Toate sezoanele de club (Barcelona, PSG, Inter Miami)",
      countryHead: "Goluri cu naționala Argentinei an de an",
      bestSeasonHead: "Care a fost cel mai bun sezon din cariera lui Messi?",
      exploreTitle: "Explorează toate statisticile"
    },
    uz: {
      title: "Messining Mavsumlar Bo'yicha Gollari (2004/05–2026)",
      desc: "Lionel Messining klublar va terma jamoadagi barcha gollari: klublarda 806 ta va Argentinada 126 ta gol.",
      h1: "Lionel Messining Mavsumlar Bo'yicha Gollari",
      lede: "2004/05 yildan 2026 yilgacha bo'lgan barcha klub mavsumlari — rekord: 2011/12 mavsumda 73 ta gol — liga, kubok va qit'a musobaqalari bo'yicha.",
      clubHead: "Barcha klub mavsumlari (Barselona, PSJ, Inter Mayami)",
      countryHead: "Argentina terma jamoasida yilma-yil urilgan gollar",
      bestSeasonHead: "Messining faoliyatidagi eng yaxshi mavsum qaysi?",
      exploreTitle: "Barcha statistikalarni o'rganing"
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
    },
    ar: {
      title: "أهداف ميسي حسب السنة (2004–2026): 932 هدفاً ورقم الـ 91 التاريخي",
      desc: "أهداف ليونيل ميسي سنة بسنة (2004–2026): تفاصيل الـ 932 هدفاً ورقم جينيس القياسي العالمي بـ 91 هدفاً في عام 2012.",
      h1: "أهداف ليونيل ميسي حسب السنة (2004–2026)",
      lede: "جميع أهداف ليونيل ميسي الـ 932 مقسمة حسب السنوات الميلادية من 2004 إلى 2026، بما فيها 91 هدفاً في عام 2012 الأسطوري.",
      chartHead: "كم هدفاً يسجل ميسي في كل عام؟",
      decadesHead: "الأهداف حسب العقود",
      tableHead: "أهداف ميسي سنة بعد سنة من 2004 إلى 2026",
      bestYearHead: "ما هو أفضل عام ميلادي في مسيرة ميسي؟",
      exploreTitle: "استكشف جميع الإحصائيات"
    },
    bn: {
      title: "বছর অনুযায়ী মেসির গোল (২০০৪–২০২৬): ৯৩২ গোল ও ৯১ গোলের বিশ্বরেকর্ড",
      desc: "২০০৪ থেকে ২০২৬ সাল পর্যন্ত লিওনেল মেসির ৯৩২টি অফিসিয়াল গোলের বছরভিত্তিক তালিকা এবং ২০১২ সালে ৯১ গোলের বিশ্বরেকর্ড।",
      h1: "বছর অনুযায়ী লিওনেল মেসির গোল (২০০৪–২০২৬)",
      lede: "২০০৪ থেকে ২০২৬ সাল পর্যন্ত লিওনেল মেসির মোট ৯৩২টি ক্যারিয়ার গোলের ক্যালেন্ডার বছরভিত্তিক পূর্ণাঙ্গ পরিসংখ্যান।",
      chartHead: "মেসি প্রতি বছর কতটি গোল করেন?",
      decadesHead: "দশক অনুযায়ী গোল",
      tableHead: "বছরভিত্তিক মেসির গোলের সম্পূর্ণ তালিকা (২০০৪–২০২৬)",
      bestYearHead: "মেসির ক্যারিয়ারের সেরা বছর কোনটি ছিল?",
      exploreTitle: "সব পরিসংখ্যান দেখুন"
    },
    hi: {
      title: "साल दर साल मेसी के गोल (2004–2026): 932 गोल और 91 गोलों का विश्व रिकॉर्ड",
      desc: "2004 से 2026 तक लियोनेल मेसी के 932 आधिकारिक गोलों की साल दर साल सूची और 2012 में 91 गोलों का ऐतिहासिक रिकॉर्ड।",
      h1: "साल दर साल लियोनेल मेसी के गोल (2004–2026)",
      lede: "2004 से 2026 तक लियोनेल मेसी के सभी 932 आधिकारिक गोल, जिसमें 2012 में 91 गोलों का गिनीज वर्ल्ड रिकॉर्ड शामिल है।",
      chartHead: "मेसी हर साल कितने गोल करते हैं?",
      decadesHead: "दशक अनुसार गोल",
      tableHead: "2004 से 2026 तक साल दर साल मेसी के गोल",
      bestYearHead: "मेसी का सर्वश्रेष्ठ साल कौन सा था?",
      exploreTitle: "सभी आंकड़े देखें"
    },
    ro: {
      title: "Golurile lui Messi pe Ani (2004–2026): Toate cele 932 de Goluri și Recordul de 91",
      desc: "Golurile lui Lionel Messi an de an (2004–2026): împărțirea celor 932 de goluri oficiale și recordul mondial de 91 de goluri în 2012.",
      h1: "Golurile lui Lionel Messi pe Ani (2004–2026)",
      lede: "Toate cele 932 de goluri ale lui Lionel Messi împărțite pe ani calendaristici din 2004 până în 2026, inclusiv recordul de 91 de goluri în 2012.",
      chartHead: "Câte goluri marchează Messi în fiecare an?",
      decadesHead: "Goluri pe decenii",
      tableHead: "Golurile lui Messi an de an, din 2004 până în 2026",
      bestYearHead: "Care a fost cel mai bun an din cariera lui Messi?",
      exploreTitle: "Explorează toate statisticile"
    },
    uz: {
      title: "Messining Yillar Bo'yicha Gollari (2004–2026): 932 ta Gol va 91 ta Golli Rekord",
      desc: "Lionel Messining 2004–2026 yillardagi barcha 932 ta rasmiy gollari va 2012 yildagi 91 ta golli Ginnes jahon rekordi.",
      h1: "Lionel Messining Yillar Bo'yicha Gollari (2004–2026)",
      lede: "Lionel Messining 2004 yildan 2026 yilgacha bo'lgan barcha 932 ta goli, jumladan 2012 yildagi 91 ta golli afsonaviy rekord.",
      chartHead: "Messi har yili nechta gol uradi?",
      decadesHead: "O'n yilliklar bo'yicha gollar",
      tableHead: "Messining 2004 yildan 2026 yilgacha bo'lgan gollari",
      bestYearHead: "Messining eng sermahsul yili qaysi bo'lgan?",
      exploreTitle: "Barcha statistikalarni o'rganing"
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
    },
    ar: {
      title: "الجدول الزمني لمسيرة ليونيل ميسي (2004–2026) | محطات تاريخية",
      desc: "تاريخ مسيرة ليونيل ميسي كاملاً بالترتيب الزمني: من بداياته في برشلونة وحتى رفع كأس العالم 2022 في قطر.",
      h1: "ليونيل ميسي عبر السنين",
      lede: "ليونيل ميسي 2004–2026: كل لحظة وتاريخ موثق من الظهور الأول في برشلونة حتى المجد الأبدي في كأس العالم.",
      keyHead: "أهم التواريخ والمحطات",
      tlHead: "المسار الزمني الكامل للمسيرة",
      searchLabel: "البحث في اللحظات التاريخية",
      searchPlaceholder: "ابحث في اللحظات — مثلاً “كأس العالم”",
      faqHead: "الأسئلة الشائعة",
      exploreTitle: "استكشف جميع الإحصائيات"
    },
    bn: {
      title: "লিওনেল মেসির ক্যারিয়ার টাইমলাইন (২০০৪–২০২৬) | ঐতিহাসিক মুহূর্ত",
      desc: "২০০৪ থেকে ২০২৬ পর্যন্ত লিওনেল মেসির ক্যারিয়ারের প্রতিটি ঐতিহাসিক মুহূর্তের বিস্তারিত টাইমলাইন ও বিশ্বকাপ জয়।",
      h1: "সময়ের পরিক্রমায় লিওনেল মেসি",
      lede: "লিওনেল মেসি ২০০৪–২০২৬: বার্সেলোনায় অভিষেক থেকে শুরু করে কাতার বিশ্বকাপে বিশ্বজয়ের রূপকথা পর্যন্ত প্রতিটি তারিখ ও মুহূর্ত।",
      keyHead: "মেসির ক্যারিয়ারের গুরুত্বপূর্ণ তারিখসমূহ",
      tlHead: "সম্পূর্ণ ক্যারিয়ার টাইমলাইন",
      searchLabel: "মুহূর্ত খুঁজুন",
      searchPlaceholder: "মুহূর্ত অনুসন্ধান করুন — যেমন “বিশ্বকাপ”",
      faqHead: "সাধারণ জিজ্ঞাসা",
      exploreTitle: "সব পরিসংখ্যান দেখুন"
    },
    hi: {
      title: "लियोनेल मेसी करियर टाइमलाइन (2004–2026) | ऐतिहासिक क्षण",
      desc: "2004 से 2026 तक लियोनेल मेसी के करियर के हर ऐतिहासिक पल की पूरी क्रोनोलॉजी और विश्व कप जीत।",
      h1: "सालों के सफर में लियोनेल मेसी",
      lede: "लियोनेल मेसी 2004–2026: बार्सिलोना में डेब्यू से लेकर 2022 विश्व कप जीत तक का हर ऐतिहासिक पड़ाव।",
      keyHead: "मेसी के करियर की महत्वपूर्ण तारीखें",
      tlHead: "करियर की पूरी टाइमलाइन",
      searchLabel: "क्षण खोजें",
      searchPlaceholder: "पल खोजें — उदा. “विश्व कप”",
      faqHead: "अक्सर पूछे जाने वाले सवाल",
      exploreTitle: "सभी आंकड़े देखें"
    },
    ro: {
      title: "Cronologia lui Lionel Messi: Momente Istorice de la 2004 la 2026",
      desc: "Istoria completă a carierei lui Lionel Messi în ordine cronologică: de la debutul la Barcelona până la titlul mondial din 2022.",
      h1: "Lionel Messi de-a Lungul Anilor",
      lede: "Lionel Messi 2004–2026: fiecare moment datat de la debutul său la Barcelona până la gloria Cupei Mondiale.",
      keyHead: "Date-cheie din cariera lui Lionel Messi",
      tlHead: "Cronologia completă a carierei",
      searchLabel: "Filtrează momente",
      searchPlaceholder: "Filtrează momente — ex. “Cupa Mondială”",
      faqHead: "Întrebări frecvente",
      exploreTitle: "Explorează toate statisticile"
    },
    uz: {
      title: "Lionel Messi Karyera Xronologiyasi (2004–2026) | Tarixiy Lahzalar",
      desc: "Lionel Messining 2004 yildan 2026 yilgacha bo'lgan to'liq faoliyati: Barselonadagi ilk o'yindan Jahon chempionligigacha.",
      h1: "Yillar Osha Lionel Messi",
      lede: "Lionel Messi 2004–2026: Barselonadagi debyutidan boshlab Jahon chempionati g'alabasigacha bo'lgan har bir sana va lahza.",
      keyHead: "Lionel Messining muhim sanalari",
      tlHead: "To'liq faoliyat xronologiyasi",
      searchLabel: "Lahzalarni saralash",
      searchPlaceholder: "Lahzalarni qidiring — masalan: “Jahon chempionati”",
      faqHead: "Ko'p beriladigan savollar",
      exploreTitle: "Barcha statistikalarni o'rganing"
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
    },
    ar: {
      title: "بطولات وجوائز ليونيل ميسي: رقم قياسي 47 لقباً و8 كرات ذهبية",
      desc: "جميع بطولات وألقاب ليونيل ميسي الـ 47 (الرقم القياسي العالمي في تاريخ كرة القدم)، بالإضافة إلى 8 كرات ذهبية وكأس العالم.",
      h1: "بطولات وإنجازات ليونيل ميسي",
      lede: "جميع الألقاب الرسمية الـ 47 لليونيل ميسي (الرقم القياسي التاريخي)، 8 كرات ذهبية، 6 أحذية ذهبية وكأس العالم قطر 2022.",
      kpiHead: "ملخص البطولات",
      qaHead: "أسئلة سريعة حول الألقاب",
      galleryHead: "معرض الكؤوس والجوائز",
      groupHead: "جميع البطولات مع كل فريق ومنتخب",
      faqHead: "الأسئلة الشائعة",
      exploreTitle: "استكشف جميع الإحصائيات"
    },
    bn: {
      title: "লিওনেল মেসির ট্রফি ও অর্জন: রেকর্ড ৪৭টি খেতাব ও ৮টি ব্যালন ডি'অর",
      desc: "ফুটবল ইতিহাসের সর্বোচ্চ ৪৭টি অফিশিয়াল ট্রফি, রেকর্ড ৮টি ব্যালন ডি'অর এবং ২০২২ বিশ্বকাপ সহ লিওনেল মেসির সকল অর্জনের পূর্ণ বিবরণ।",
      h1: "লিওনেল মেসির ট্রফি ও অর্জনসমূহ",
      lede: "লিওনেল মেসির ক্যারিয়ারের ৪৭টি দলগত খেতাব (ফুটবল ইতিহাসের বিশ্বরেকর্ড), ৮টি ব্যালন ডি'অর, ৬টি গোল্ডেন বুট ও বিশ্বকাপ ২০২২।",
      kpiHead: "ট্রফির সারসংক্ষেপ",
      qaHead: "ট্রফি সম্পর্কিত দ্রুত প্রশ্নোত্তর",
      galleryHead: "ট্রফি গ্যালারি",
      groupHead: "ক্লাব ও দেশ অনুযায়ী সকল ট্রফি",
      faqHead: "সাধারণ জিজ্ঞাসা",
      exploreTitle: "সব পরিসংখ্যান দেখুন"
    },
    hi: {
      title: "लियोनेल मेसी के खिताब और अवॉर्ड: रिकॉर्ड 47 ट्रॉफियां और 8 बैलन डी'ओर",
      desc: "फुटबॉल इतिहास में सबसे ज्यादा 47 खिताब, 8 बैलन डी'ओर और फीफा विश्व कप 2022 सहित लियोनेल मेसी की सभी ट्रॉफियों का पूरा विवरण।",
      h1: "लियोनेल मेसी के खिताब और उपलब्धियां",
      lede: "लियोनेल मेसी की सभी 47 आधिकारिक ट्रॉफियां (विश्व रिकॉर्ड), 8 बैलन डी'ओर, 6 गोल्डन बूट और 2022 फीफा विश्व कप।",
      kpiHead: "खिताबों का सारांश",
      qaHead: "ट्रॉफियों पर त्वरित सवाल",
      galleryHead: "ट्रॉफी गैलरी",
      groupHead: "टीम और देश अनुसार सभी खिताब",
      faqHead: "अक्सर पूछे जाने वाले सवाल",
      exploreTitle: "सभी आंकड़े देखें"
    },
    ro: {
      title: "Trofeele și Premiile lui Lionel Messi: Record de 47 de Titluri și 8 Baloane de Aur",
      desc: "Toate cele 47 de trofee oficiale ale lui Lionel Messi (record mondial absolut în istoria fotbalului), 8 Baloane de Aur și Cupa Mondială.",
      h1: "Palmaresul și Trofeele lui Lionel Messi",
      lede: "Toate cele 47 de titluri de echipă ale lui Lionel Messi — record mondial, plus 8 Baloane de Aur, 6 Ghete de Aur și Cupa Mondială 2022.",
      kpiHead: "Rezumatul trofeelor",
      qaHead: "Întrebări rapide despre trofee",
      galleryHead: "Galeria de trofee",
      groupHead: "Toate titlurile pe cluburi și națională",
      faqHead: "Întrebări frecvente",
      exploreTitle: "Explorează toate statisticile"
    },
    uz: {
      title: "Lionel Messining Sovrinlari va Yutuqlari: 47 ta Titul va 8 ta “Oltin To'p”",
      desc: "Futbol tarixidagi mutlaq rekord bo'lgan 47 ta rasmiy jamoaviy sovrin, 8 ta “Oltin to'p” va 2022 yilgi Jahon chempionati.",
      h1: "Lionel Messining Sovrinlari va Unvonlari",
      lede: "Lionel Messining barcha 47 ta rasmiy sovrini (jahon rekordi), 8 ta “Oltin to'p”, 6 ta “Oltin butsa” va Jahon kubogi 2022.",
      kpiHead: "Sovrinlar qisqacha mazmuni",
      qaHead: "Sovrinlar bo'yicha tezkor savol-javob",
      galleryHead: "Sovrinlar galereyasi",
      groupHead: "Klublar va terma jamoa bo'yicha barcha sovrinlar",
      faqHead: "Ko'p beriladigan savollar",
      exploreTitle: "Barcha statistikalarni o'rganing"
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
    },
    ar: {
      title: "هل سجل ميسي في يوم ميلادك؟ مستكشف أهداف الـ 366 يوماً",
      desc: "اكتشف ما إذا كان الأسطورة ليونيل ميسي قد سجل في يوم ميلادك: ابحث في جميع أيام السنة الـ 366 مع مقاطع فيديو لكل هدف.",
      h1: "هل سجل ميسي في يوم عيد ميلادك؟",
      lede: "تحقق مما إذا كان ميسي قد سجل أهدافاً في يوم ميلادك. سجل ميسي في 292 يوماً من أصل 366 يوماً في السنة (79.8%) خلال مسيرته بـ 932 هدفاً.",
      selectMonth: "اختر الشهر",
      selectDay: "اختر اليوم",
      checkBtn: "تحقق من الأهداف ⚽",
      statDaysScored: "أيام شهدت أهدافاً",
      statDaysEmpty: "أيام بلا أهداف",
      faqHead: "الأسئلة الشائعة حول أهداف أعياد الميلاد",
      exploreTitle: "استكشف جميع الإحصائيات"
    },
    bn: {
      title: "মেসি কি আপনার জন্মদিনে গোল করেছিলেন? ৩৬৬ দিনের গোল এক্সপ্লোরার",
      desc: "মেসি আপনার জন্মদিনে গোল করেছিলেন কিনা তা দেখুন: ৯৩২টি গোলের মধ্য থেকে বছরের ৩৬৬ দিনের প্রতিটি দিনের ভিডিও ও বিবরণ।",
      h1: "মেসি কি আপনার জন্মদিনে গোল করেছিলেন?",
      lede: "আপনার জন্মদিনে লিওনেল মেসি গোল করেছিলেন কিনা তা যাচাই করুন। মেসি তার ৯৩২ গোলের ক্যারিয়ারে বছরের ৩৬৬ দিনের মধ্যে ২৯২ দিনেই গোল করেছেন (৭৯.৮%)।",
      selectMonth: "মাস নির্বাচন করুন",
      selectDay: "দিন নির্বাচন করুন",
      checkBtn: "গোল অনুসন্ধান করুন ⚽",
      statDaysScored: "যেসব দিনে গোল হয়েছে",
      statDaysEmpty: "যেসব দিনে গোল হয়নি",
      faqHead: "জন্মদিনের গোল সম্পর্কিত সাধারণ জিজ্ঞাসা",
      exploreTitle: "সব পরিসংখ্যান দেখুন"
    },
    hi: {
      title: "क्या मेसी ने आपके जन्मदिन पर गोल किया था? 366 दिनों का गोल एक्सप्लोरर",
      desc: "जानिए क्या लियोनेल मेसी ने आपके जन्मदिन पर गोल किया था: 366 दिनों में मेसी के 932 गोलों का वीडियो और मैच डेटा।",
      h1: "क्या मेसी ने आपके जन्मदिन पर गोल किया था?",
      lede: "अपने जन्मदिन की तारीख चुनकर देखें कि क्या उस दिन लियोनेल मेसी ने गोल किया था। मेसी ने साल के 366 में से 292 दिनों (79.8%) में गोल किए हैं।",
      selectMonth: "महीना चुनें",
      selectDay: "दिन चुनें",
      checkBtn: "गोल चेक करें ⚽",
      statDaysScored: "जिन दिनों गोल हुए",
      statDaysEmpty: "बिना गोल वाले दिन",
      faqHead: "अक्सर पूछे जाने वाले सवाल",
      exploreTitle: "सभी आंकड़े देखें"
    },
    ro: {
      title: "A marcat Messi de ziua ta de naștere? Explorator în cele 366 de Zile",
      desc: "Află dacă Lionel Messi a marcat de ziua ta: explorează toate cele 366 de zile din an cu videoclipuri pentru fiecare gol.",
      h1: "A marcat Messi de ziua ta de naștere?",
      lede: "Verifică dacă Lionel Messi a înscris de ziua ta de naștere. Messi a marcat în 292 din cele 366 de zile ale anului (79,8%) de-a lungul celor 932 de goluri.",
      selectMonth: "Selectează luna",
      selectDay: "Selectează ziua",
      checkBtn: "Verifică golurile ⚽",
      statDaysScored: "Zile cu goluri",
      statDaysEmpty: "Zile fără goluri",
      faqHead: "Întrebări frecvente despre golurile de ziua ta",
      exploreTitle: "Explorează toate statisticile"
    },
    uz: {
      title: "Messi Sizning Tug'ilgan Kuningizda Gol Urganmi? 366 Kunlik Qidiruv",
      desc: "Lionel Messi sizning tug'ilgan kuningizda gol urgan-urmaganligini tekshiring: yilning barcha 366 kunidagi gollar va ularning videolari.",
      h1: "Messi sizning tug'ilgan kuningizda gol urganmi?",
      lede: "Tug'ilgan kuningizni tanlang va Lionel Messi o'sha kuni gol urganligini bilib oling. Messi 366 kundan 292 tasida (79,8%) gol urgan.",
      selectMonth: "Oyni tanlang",
      selectDay: "Kunni tanlang",
      checkBtn: "Gollarni tekshirish ⚽",
      statDaysScored: "Gollar urilgan kunlar",
      statDaysEmpty: "Golsiz kunlar",
      faqHead: "Tug'ilgan kun gollari bo'yicha savollar",
      exploreTitle: "Barcha statistikalarni o'rganing"
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
    },
    ar: {
      title: "ميسي ضد رونالدو: مقارنة الأهداف، البطولات والمواجهات المباشرة",
      desc: "ليونيل ميسي ضد كريستيانو رونالدو: 932 هدفاً مقابل 980، 47 بطولة مقابل 37، و8 كرات ذهبية مقابل 5. تفاصيل الـ 36 مباراة المباشرة.",
      h1: "ميسي ضد كريستيانو رونالدو: المقارنة التاريخية",
      lede: "المقارنة الإحصائية الشاملة بين ليونيل ميسي وكريستيانو رونالدو: 932 مقابل 980 هدفاً، 47 مقابل 37 لقباً، و8 كرات ذهبية مقابل 5.",
      kpiMessiNote: "1,178 مباراة (0.79 هدف/مباراة)",
      kpiRonaldoNote: "+1,339 مباراة (0.72 هدف/مباراة)",
      kpiDiff: "الفارق",
      kpiDiffNote: "ميسي في 161 مباراة أقل",
      titlesName: "🏆 البطولات الجماعية",
      titlesGoals: "ميسي: 47 <span>ضد رونالدو: 37</span>",
      titlesMeta: "ميسي يحمل الرقم القياسي العالمي في تاريخ كرة القدم.",
      bdoName: "🌕 الكرة الذهبية",
      bdoGoals: "ميسي: 8 <span>ضد رونالدو: 5</span>",
      bdoMeta: "رقم قياسي بـ 8 كرات ذهبية عبر ثلاثة عقود مختلفة.",
      wcName: "🌍 كأس العالم FIFA",
      wcGoals: "ميسي: 1 <span>ضد رونالدو: 0</span>",
      wcMeta: "بطل العالم وأفضل لاعب في البطولة مرتين (2014، 2022).",
      tableTitle: "المواجهات المباشرة الـ 36 بين ميسي ورونالدو",
      tableCaption: "سجل المواجهات المباشرة عبر 36 مباراة رسمية",
      thMetric: "المؤشر",
      thMessi: "ليونيل ميسي",
      thRonaldo: "كريستيانو رونالدو",
      rowWins: "الانتصارات",
      rowWinsMessi: "<b>16 فوزاً</b> (44.4%)",
      rowWinsRonaldo: "11 فوزاً (30.6%)",
      rowDraws: "التعادلات",
      rowDrawsVal: "9 تعادلات (25.0%)",
      rowGoals: "الأهداف المسجلة",
      rowGoalsMessi: "<b>22 هدفاً</b>",
      rowGoalsRonaldo: "21 هدفاً",
      rowAssists: "التمريرات الحاسمة",
      rowAssistsMessi: "<b>12 تمريرة</b>",
      rowAssistsRonaldo: "تمريرة واحدة",
      faqHead: "الأسئلة الشائعة حول صراع ميسي ورونالدو",
      exploreTitle: "استكشف جميع الإحصائيات"
    },
    bn: {
      title: "মেসি বনাম রোনালদো: গোল, ট্রফি এবং মুখোমুখি লড়াইয়ের পূর্ণাঙ্গ হিসাব",
      desc: "লিওনেল মেসি বনাম ক্রিশ্চিয়ানো রোনালদো: ৯৩২ গোল বনাম ৯৮০+, ৪৭ ট্রফি বনাম ৩৭, এবং ৮টি ব্যালন ডি'অর বনাম ৫। মুখোমুখি ৩৬টি ম্যাচের রেকর্ড।",
      h1: "মেসি বনাম ক্রিশ্চিয়ানো রোনালদো: সর্বকালের সেরা তুলনা",
      lede: "মেসি ও রোনালদোর ক্যারিয়ারের পুঙ্খানুপুঙ্খ পরিসংখ্যান: ৯৩২ বনাম ৯৮০ গোল, ৪৭ বনাম ৩৭টি শিরোপা এবং ৮ বনাম ৫টি ব্যালন ডি'অর।",
      kpiMessiNote: "১,১৭৮ ম্যাচ (০.৭৯ গোল/ম্যাচ)",
      kpiRonaldoNote: "১,৩৩৯+ ম্যাচ (০.৭২ গোল/ম্যাচ)",
      kpiDiff: "পার্থক্য",
      kpiDiffNote: "১৬১ ম্যাচ কম খেলে মেসি",
      titlesName: "🏆 দলগত শিরোপা",
      titlesGoals: "মেসি: ৪৭ <span>বনাম রোনালদো: ৩৭</span>",
      titlesMeta: "মেসি ফুটবল ইতিহাসের সর্বকালের বিশ্বরেকর্ডের অধিকারী।",
      bdoName: "🌕 ব্যালন ডি'অর",
      bdoGoals: "মেসি: ৮ <span>বনাম রোনালদো: ৫</span>",
      bdoMeta: "তিনটি আলাদা দশকে রেকর্ড ৮টি ব্যালন ডি'অর জয়ের অনন্য কীর্তি।",
      wcName: "🌍 ফিফা বিশ্বকাপ",
      wcGoals: "মেসি: ১ <span>বনাম রোনালদো: ০</span>",
      wcMeta: "বিশ্ব চ্যাম্পিয়ন এবং ২ বার সেরা খেলোয়াড়ের গোল্ডেন বল জয়ী (২০১৪, ২০২২)।",
      tableTitle: "মেসি ও রোনালদোর মুখোমুখি ৩৬টি ম্যাচের ফলাফল",
      tableCaption: "অফিসিয়াল ৩৬টি মুখোমুখি লড়াইয়ের রেকর্ড",
      thMetric: "পরিসংখ্যান",
      thMessi: "লিওনেল মেসি",
      thRonaldo: "ক্রিশ্চিয়ানো রোনালদো",
      rowWins: "জয়",
      rowWinsMessi: "<b>১৬ জয়</b> (৪৪.৪%)",
      rowWinsRonaldo: "১১ জয় (৩০.৬%)",
      rowDraws: "ড্র",
      rowDrawsVal: "৯ ড্র (২৫.০%)",
      rowGoals: "গোল সংখ্যা",
      rowGoalsMessi: "<b>২২ গোল</b>",
      rowGoalsRonaldo: "২১ গোল",
      rowAssists: "অ্যাসিস্ট",
      rowAssistsMessi: "<b>১২ অ্যাসিস্ট</b>",
      rowAssistsRonaldo: "১ অ্যাসিস্ট",
      faqHead: "মেসি বনাম রোনালদো সাধারণ জিজ্ঞাসা",
      exploreTitle: "সব পরিসংখ্যান দেখুন"
    },
    hi: {
      title: "मेसी बनाम रोनाल्डो: गोल, ट्रॉफियां और आमने-सामने के मुकाबले",
      desc: "लियोनेल मेसी बनाम क्रिस्टियानो रोनाल्डो: 932 गोल बनाम 980, 47 खिताब बनाम 37, और 8 बैलन डी'ओर बनाम 5। दोनों के बीच 36 सीधे मैचों का विवरण।",
      h1: "मेसी बनाम क्रिस्टियानो रोनाल्डो: अंतिम तुलना",
      lede: "लियोनेल मेसी और क्रिस्टियानो रोनाल्डो के आंकड़ों का पूर्ण तुलनात्मक विश्लेषण: 932 बनाम 980 गोल, 47 बनाम 37 ट्रॉफियां और 8 बनाम 5 बैलन डी'ओर।",
      kpiMessiNote: "1,178 मैच (0.79 गोल/मैच)",
      kpiRonaldoNote: "1,339 मैच (0.72 गोल/मैच)",
      kpiDiff: "अंतर",
      kpiDiffNote: "मेसी ने 161 कम मैचों में",
      titlesName: "🏆 टीम खिताब",
      titlesGoals: "मेसी: 47 <span>बनाम रोनाल्डो: 37</span>",
      titlesMeta: "मेसी के नाम फुटबॉल इतिहास में सर्वकालिक विश्व रिकॉर्ड है।",
      bdoName: "🌕 बैलन डी'ओर",
      bdoGoals: "मेसी: 8 <span>बनाम रोनाल्डो: 5</span>",
      bdoMeta: "तीन अलग-अलग दशकों में रिकॉर्ड 8 बैलन डी'ओर जीतने का रिकॉर्ड।",
      wcName: "🌍 फीफा विश्व कप",
      wcGoals: "मेसी: 1 <span>बनाम रोनाल्डो: 0</span>",
      wcMeta: "विश्व चैंपियन और टूर्नामेंट के 2 बार गोल्डन बॉल विजेता (2014, 2022)।",
      tableTitle: "मेसी और रोनाल्डो के बीच 36 आमने-सामने के मैच",
      tableCaption: "36 आधिकारिक मैचों में आमने-सामने का रिकॉर्ड",
      thMetric: "आँकड़ा",
      thMessi: "लियोनेल मेसी",
      thRonaldo: "क्रिस्टियानो रोनाल्डो",
      rowWins: "जीत",
      rowWinsMessi: "<b>16 जीत</b> (44.4%)",
      rowWinsRonaldo: "11 जीत (30.6%)",
      rowDraws: "ड्रॉ",
      rowDrawsVal: "9 ड्रॉ (25.0%)",
      rowGoals: "किए गए गोल",
      rowGoalsMessi: "<b>22 गोल</b>",
      rowGoalsRonaldo: "21 गोल",
      rowAssists: "असिस्ट",
      rowAssistsMessi: "<b>12 असिस्ट</b>",
      rowAssistsRonaldo: "1 असिस्ट",
      faqHead: "अक्सर पूछे जाने वाले सवाल",
      exploreTitle: "सभी आंकड़े देखें"
    },
    ro: {
      title: "Messi vs Ronaldo: Goluri, Trofee și Meciuri Directe",
      desc: "Lionel Messi vs Cristiano Ronaldo: 932 goluri vs 980, 47 trofee vs 37, 8 Baloane de Aur vs 5. Comparație completă și cele 36 de meciuri directe.",
      h1: "Messi vs Cristiano Ronaldo: Comparația Supremă",
      lede: "Comparația statistică definitivă între Lionel Messi și Cristiano Ronaldo: 932 vs 980 goluri, 47 vs 37 trofee și 8 vs 5 Baloane de Aur.",
      kpiMessiNote: "1.178 meciuri (0,79 g/m)",
      kpiRonaldoNote: "1.339 meciuri (0,72 g/m)",
      kpiDiff: "Diferență",
      kpiDiffNote: "Messi în 161 meciuri mai puține",
      titlesName: "🏆 Titluri de Echipă",
      titlesGoals: "Messi: 47 <span>vs Ronaldo: 37</span>",
      titlesMeta: "Messi deține recordul mondial absolut din istoria fotbalului.",
      bdoName: "🌕 Balonul de Aur",
      bdoGoals: "Messi: 8 <span>vs Ronaldo: 5</span>",
      bdoMeta: "Record de 8 Baloane de Aur de-a lungul a trei decenii diferite.",
      wcName: "🌍 Cupa Mondială FIFA",
      wcGoals: "Messi: 1 <span>vs Ronaldo: 0</span>",
      wcMeta: "Campion mondial și de 2 ori câștigător al Balonului de Aur al turneului (2014, 2022).",
      tableTitle: "Cele 36 de meciuri directe între Messi și Ronaldo",
      tableCaption: "Palmaresul confruntărilor directe în 36 de meciuri oficiale",
      thMetric: "Statistică",
      thMessi: "Lionel Messi",
      thRonaldo: "Cristiano Ronaldo",
      rowWins: "Victorii",
      rowWinsMessi: "<b>16 victorii</b> (44,4%)",
      rowWinsRonaldo: "11 victorii (30,6%)",
      rowDraws: "Egaluri",
      rowDrawsVal: "9 egaluri (25,0%)",
      rowGoals: "Goluri Marcate",
      rowGoalsMessi: "<b>22 goluri</b>",
      rowGoalsRonaldo: "21 goluri",
      rowAssists: "Pase de Gol",
      rowAssistsMessi: "<b>12 pase</b>",
      rowAssistsRonaldo: "1 pasă",
      faqHead: "Întrebări frecvente Messi vs Ronaldo",
      exploreTitle: "Explorează toate statisticile"
    },
    uz: {
      title: "Messi vs Ronaldu: Gollar, Sovrinlar va O'zaro To'qnashuvlar",
      desc: "Lionel Messi va Krishtianu Ronaldu: 932 ta gol vs 980, 47 ta titul vs 37, 8 ta “Oltin to'p” vs 5. O'zaro 36 ta o'yin natijalari.",
      h1: "Messi vs Krishtianu Ronaldu: Karyeralar Qiyosi",
      lede: "Lionel Messi va Krishtianu Ronaldu o'rtasidagi to'liq statistik taqqoslash: 932 ga 980 ta gol, 47 ga 37 ta sovrin va 8 ga 5 ta “Oltin to'p”.",
      kpiMessiNote: "1 178 o'yin (0,79 g/o')",
      kpiRonaldoNote: "1 280+ o'yin (0,72 g/o')",
      kpiDiff: "Farq",
      kpiDiffNote: "Messi 105 ta kam o'yinda",
      titlesName: "🏆 Jamoaviy Sovrinlar",
      titlesGoals: "Messi: 47 <span>vs Ronaldu: 37</span>",
      titlesMeta: "Messi futbol tarixidagi mutlaq jahon rekordchisidir.",
      bdoName: "🌕 “Oltin to'p”",
      bdoGoals: "Messi: 8 <span>vs Ronaldu: 5</span>",
      bdoMeta: "Uch xil o'n yillikda rekord darajadagi 8 ta “Oltin to'p”.",
      wcName: "🌍 FIFA Jahon Chempionati",
      wcGoals: "Messi: 1 <span>vs Ronaldu: 0</span>",
      wcMeta: "Jahon chempioni va 2 karra turnirning eng yaxshi futbolchisi (2014, 2022).",
      tableTitle: "Messi va Ronaldu o'rtasidagi 36 ta o'zaro to'qnashuv",
      tableCaption: "36 ta rasmiy o'yindagi o'zaro to'qnashuvlar rekordi",
      thMetric: "Ko'rsatkich",
      thMessi: "Lionel Messi",
      thRonaldo: "Krishtianu Ronaldu",
      rowWins: "G'alabalar",
      rowWinsMessi: "<b>16 g'alaba</b> (44,4%)",
      rowWinsRonaldo: "11 g'alaba (30,6%)",
      rowDraws: "Duranglar",
      rowDrawsVal: "9 durang (25,0%)",
      rowGoals: "Urilgan gollar",
      rowGoalsMessi: "<b>22 gol</b>",
      rowGoalsRonaldo: "21 gol",
      rowAssists: "Golli uzatmalar",
      rowAssistsMessi: "<b>12 uzatma</b>",
      rowAssistsRonaldo: "1 uzatma",
      faqHead: "Ko'p beriladigan savollar",
      exploreTitle: "Barcha statistikalarni o'rganing"
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
    },
    ar: {
      title: "ميسي ضد ريال مدريد: 26 هدفاً، 45 مباراة والهداف التاريخي للكلاسيكو",
      desc: "السجل التاريخي الكامل لليونيل ميسي ضد ريال مدريد: 26 هدفاً و14 تمريرة حاسمة في 45 مباراة رسمية. الهداف التاريخي لمباريات الكلاسيكو.",
      h1: "ليونيل ميسي ضد ريال مدريد: ملك الكلاسيكو",
      lede: "السجل التاريخي الكامل للهداف التاريخي لمباريات الكلاسيكو: 26 هدفاً و14 تمريرة حاسمة و16 انتصاراً في 45 مباراة ضد ريال مدريد.",
      kpiApps: "المباريات",
      kpiAppsNote: "كافة المباريات الرسمية",
      kpiGoals: "الأهداف",
      kpiGoalsNote: "الهداف التاريخي الأول للكلاسيكو",
      kpiAssists: "التمريرات الحاسمة",
      kpiAssistsNote: "الأكثر صناعة في تاريخ الكلاسيكو",
      kpiWins: "الانتصارات",
      kpiWinsNote: "الفوز في كافة البطولات",
      breakdownHead: "ملخص أرقام ميسي ضد ريال مدريد",
      tableCaption: "سجل أرقام ميسي ضد ريال مدريد حسب المسابقة",
      thComp: "المسابقة",
      thApps: "المباريات",
      thGoals: "الأهداف",
      thAssists: "التمريرات",
      compLaLiga: "الدوري الإسباني (La Liga)",
      compSupercopa: "كأس السوبر الإسباني",
      compUcl: "دوري أبطال أوروبا",
      compCdr: "كأس ملك إسبانيا",
      compTotal: "المجموع في جميع المسابقات",
      momentsHead: "لحظات ميسي الخالدة في البرنابيو والكامب نو",
      m1Name: "هاتريك في سن الـ 19 (2007)",
      m1Goals: "كامب نو · 3-3",
      m1Meta: "أول هاتريك في مسيرته الاحترافية، مُعادلاً النتيجة 3 مرات ضد ريال مدريد.",
      m2Name: "السداسية التاريخية 2-6 (2009)",
      m2Goals: "سانتياغو برنابيو · هدفان",
      m2Meta: "غوارديولا يبتكر مركز المهاجم الوهمي (False 9) لميسي في قلب مدريد.",
      m3Name: "الهدف الإعجازي في دوري الأبطال (2011)",
      m3Goals: "سانتياغو برنابيو · 0-2",
      m3Meta: "مراوغة أسطورية تخطى بها 4 مدافعين من مدريد في نصف نهائي الأبطال.",
      m4Name: "احتفال القميص بالهدف رقم 500 (2017)",
      m4Goals: "سانتياغو برنابيو · 2-3",
      m4Meta: "هدف الفوز في الدقيقة 92 متبوعاً برفع قميصه رقم 10 التاريخي في قلب البرنابيو.",
      faqHead: "الأسئلة الشائعة حول ميسي وريال مدريد",
      exploreTitle: "استكشف جميع الإحصائيات"
    },
    bn: {
      title: "মেসি বনাম রিয়াল মাদ্রিদ: ২৬ গোল, ৪৫ ম্যাচ ও এল ক্লাসিকো রেকর্ড",
      desc: "রিয়াল মাদ্রিদের বিপক্ষে লিওনেল মেসির ক্যারিয়ার রেকর্ড: ৪৫ ম্যাচে ২৬ গোল ও ১৪টি অ্যাসিস্ট। এল ক্লাসিকোর সর্বকালের শীর্ষ গোলদাতা।",
      h1: "লিওনেল মেসি বনাম রিয়াল মাদ্রিদ: এল ক্লাসিকোর রাজা",
      lede: "এল ক্লাসিকোর ইতিহাসের সর্বোচ্চ গোলদাতার পূর্ণাঙ্গ রেকর্ড: ৪৫ ম্যাচে ২৬ গোল, ১৪টি অ্যাসিস্ট এবং ১৬টি ঐতিহাসিক জয়।",
      kpiApps: "ম্যাচ সংখ্যা",
      kpiAppsNote: "সকল অফিসিয়াল ম্যাচ",
      kpiGoals: "গোল",
      kpiGoalsNote: "এল ক্লাসিকোর সর্বকালের #১ গোলদাতা",
      kpiAssists: "অ্যাসিস্ট",
      kpiAssistsNote: "এল ক্লাসিকোর সর্বকালের রেকর্ড",
      kpiWins: "জয়",
      kpiWinsNote: "সকল প্রতিযোগিতা মিলিয়ে জয়",
      breakdownHead: "রিয়াল মাদ্রিদের বিরুদ্ধে মেসির সামগ্রিক পরিসংখ্যান",
      tableCaption: "প্রতিযোগিতা অনুসারে রিয়াল মাদ্রিদের বিরুদ্ধে মেসির রেকর্ড",
      thComp: "প্রতিযোগিতা",
      thApps: "ম্যাচ",
      thGoals: "গোল",
      thAssists: "অ্যাসিস্ট",
      compLaLiga: "লা লিগা",
      compSupercopa: "স্প্যানিশ সুপার কাপ",
      compUcl: "উয়েফা চ্যাম্পিয়নস লিগ",
      compCdr: "কোপা দেল রে",
      compTotal: "সর্বমোট (সকল প্রতিযোগিতা)",
      momentsHead: "বার্নাব্যু ও ক্যাম্প ন্যু-তে মেসির সেরা মুহূর্ত",
      m1Name: "১৯ বছর বয়সে হ্যাটট্রিক (২০০৭)",
      m1Goals: "ক্যাম্প ন্যু · ৩-৩",
      m1Meta: "সিনিয়র ক্যারিয়ারের প্রথম হ্যাটট্রিক, যেখানে রিয়ালের বিপক্ষে ৩ বার সমতা ফেরান।",
      m2Name: "ঐতিহাসিক ২-৬ ব্যবধানের জয় (২০০৯)",
      m2Goals: "সান্তিয়াগো বার্নাব্যু · ২ গোল",
      m2Meta: "বার্নাব্যুতে মেসির জন্য পেপ গার্দিওলার 'ফলস নাইন' পজিশনের সূচনা।",
      m3Name: "চ্যাম্পিয়নস লিগে একক নৈপুণ্যের গোল (২০১১)",
      m3Goals: "সান্তিয়াগো বার্নাব্যু · ০-২",
      m3Meta: "চ্যাম্পিয়নস লিগের সেমিফাইনালে রিয়ালের ৪ ডিফেন্ডারকে কাটিয়ে করা জাদুকরী গোল।",
      m4Name: "৫০০তম গোলে জার্সি উঁচিয়ে উদযাপন (২০১৭)",
      m4Goals: "সান্তিয়াগো বার্নাব্যু · ২-৩",
      m4Meta: "৯২তম মিনিটের জয়সূচক গোল এবং বার্নাব্যুর সামনে নিজের ১০ নম্বর জার্সি তুলে ধরা।",
      faqHead: "মেসি বনাম রিয়াল মাদ্রিদ সাধারণ জিজ্ঞাসা",
      exploreTitle: "সব পরিসংখ্যান দেখুন"
    },
    hi: {
      title: "मेसी बनाम रियल मैड्रिड: 26 गोल, 45 मैच और एल क्लासिको का रिकॉर्ड",
      desc: "रियल मैड्रिड के खिलाफ लियोनेल मेसी का ऐतिहासिक रिकॉर्ड: 45 मैचों में 26 गोल और 14 असिस्ट। एल क्लासिको के सर्वकालिक शीर्ष स्कोरर।",
      h1: "लियोनेल मेसी बनाम रियल मैड्रिड: एल क्लासिको के बादशाह",
      lede: "एल क्लासिको इतिहास के सबसे बड़े स्कोरर का पूरा रिकॉर्ड: रियल मैड्रिड के खिलाफ 45 मैचों में 26 गोल, 14 असिस्ट और 16 जीत।",
      kpiApps: "मैच खेले",
      kpiAppsNote: "सभी आधिकारिक मैच",
      kpiGoals: "गोल",
      kpiGoalsNote: "एल क्लासिको के सर्वकालिक #1 स्कोरर",
      kpiAssists: "असिस्ट",
      kpiAssistsNote: "एल क्लासिको का सर्वकालिक रिकॉर्ड",
      kpiWins: "जीत",
      kpiWinsNote: "सभी प्रतियोगिताओं में जीत",
      breakdownHead: "रियल मैड्रिड के खिलाफ मेसी के आंकड़ों का सारांश",
      tableCaption: "प्रतियोगिता अनुसार रियल मैड्रिड के खिलाफ मेसी का रिकॉर्ड",
      thComp: "प्रतियोगिता",
      thApps: "मैच",
      thGoals: "गोल",
      thAssists: "असिस्ट",
      compLaLiga: "ला लीगा",
      compSupercopa: "सुपरकोपा डे एस्पान्या",
      compUcl: "यूईएफए चैंपियंस लीग",
      compCdr: "कोपा डेल रे",
      compTotal: "कुल योग (सभी प्रतियोगिताएं)",
      momentsHead: "बर्नाबेउ और कैंप नोउ में मेसी के जादुई पल",
      m1Name: "19 साल की उम्र में हैट्रिक (2007)",
      m1Goals: "कैंप नोउ · 3-3",
      m1Meta: "सीनियर करियर की पहली हैट्रिक, रियल मैड्रिड के खिलाफ 3 बार बराबरी की।",
      m2Name: "ऐतिहासिक 2-6 की जीत (2009)",
      m2Goals: "सैंटियागो बर्नाबेउ · 2 गोल",
      m2Meta: "गार्डियोला ने मैड्रिड में लियो मेसी के लिए फाल्स 9 रोल की शुरुआत की।",
      m3Name: "चैंपियंस लीग में जादुई सोलो गोल (2011)",
      m3Goals: "सैंटियागो बर्नाबेउ · 0-2",
      m3Meta: "चैंपियंस लीग सेमीफाइनल में मैड्रिड के 4 डिफेंडरों को छकाकर किया गया ऐतिहासिक गोल।",
      m4Name: "500वें गोल पर जर्सी का ऐतिहासिक जश्न (2017)",
      m4Goals: "सैंटियागो बर्नाबेउ · 2-3",
      m4Meta: "92वें मिनट में विजयी गोल और बर्नाबेउ में अपनी 10 नंबर जर्सी को लहराने का ऐतिहासिक पल।",
      faqHead: "अक्सर पूछे जाने वाले सवाल",
      exploreTitle: "सभी आंकड़े देखें"
    },
    ro: {
      title: "Messi vs Real Madrid: 26 de Goluri, 45 de Meciuri și Record în El Clásico",
      desc: "Istoricul complet al lui Lionel Messi împotriva lui Real Madrid: 26 de goluri și 14 pase de gol în 45 de meciuri oficiale. Golgheterul El Clásico.",
      h1: "Lionel Messi vs Real Madrid: Regele din El Clásico",
      lede: "Istoricul complet al celui mai prolific marcator din istoria El Clásico: 26 de goluri, 14 assist-uri și 16 victorii în 45 de partide contra lui Real Madrid.",
      kpiApps: "Meciuri Jucate",
      kpiAppsNote: "Toate meciurile oficiale",
      kpiGoals: "Goluri",
      kpiGoalsNote: "Golgheterul all-time din El Clásico",
      kpiAssists: "Pase de Gol",
      kpiAssistsNote: "Record all-time în El Clásico",
      kpiWins: "Victorii",
      kpiWinsNote: "Victorii în toate competițiile",
      breakdownHead: "Rezumatul statistic al lui Messi contra lui Real Madrid",
      tableCaption: "Palmaresul lui Messi contra lui Real Madrid pe competiții",
      thComp: "Competiție",
      thApps: "Meciuri",
      thGoals: "Goluri",
      thAssists: "Pase",
      compLaLiga: "La Liga",
      compSupercopa: "Supercupa Spaniei",
      compUcl: "UEFA Champions League",
      compCdr: "Copa del Rey",
      compTotal: "Total în Toate Competițiile",
      momentsHead: "Nopți magice pe Bernabéu și Camp Nou",
      m1Name: "Hat-trick la 19 ani (2007)",
      m1Goals: "Camp Nou · 3-3",
      m1Meta: "Primul hat-trick la seniori, egalând de 3 ori împotriva lui Real Madrid.",
      m2Name: "Istoricul 2-6 (2009)",
      m2Goals: "Santiago Bernabéu · 2 goluri",
      m2Meta: "Guardiola inventează rolul de Fals 9 pentru Leo Messi pe Bernabéu.",
      m3Name: "Golul antologic solitar din UCL (2011)",
      m3Goals: "Santiago Bernabéu · 0-2",
      m3Meta: "Slalom memorabil depășind 4 fundași madrileni în semifinala Ligii Campionilor.",
      m4Name: "Sărbătorirea tricoului la Golul 500 (2017)",
      m4Goals: "Santiago Bernabéu · 2-3",
      m4Meta: "Gol victorios în minutul 92, urmat de ridicarea celebră a tricoului cu numărul 10.",
      faqHead: "Întrebări frecvente Messi vs Real Madrid",
      exploreTitle: "Explorează toate statisticile"
    },
    uz: {
      title: "Messi vs Real Madrid: 26 ta Gol, 45 ta O'yin va El-Klasiko Rekordi",
      desc: "Lionel Messining “Real Madrid”ga qarshi to'liq statistikasi: 45 ta o'yinda 26 ta gol va 14 ta assist. El-Klasiko tarixidagi eng yaxshi to'purar.",
      h1: "Lionel Messi vs Real Madrid: El-Klasiko Qiroli",
      lede: "El-Klasiko tarixidagi eng yaxshi to'purarning to'liq ko'rsatkichi: “Real Madrid”ga qarshi 45 ta o'yinda 26 ta gol, 14 ta golli uzatma va 16 ta g'alaba.",
      kpiApps: "O'yinlar",
      kpiAppsNote: "Barcha rasmiy o'yinlar",
      kpiGoals: "Gollar",
      kpiGoalsNote: "El-Klasiko tarixidagi mutlaq #1 to'purar",
      kpiAssists: "Assistlar",
      kpiAssistsNote: "El-Klasiko tarixidagi rekord",
      kpiWins: "G'alabalar",
      kpiWinsNote: "Barcha musobaqalardagi g'alabalar",
      breakdownHead: "Messining “Real Madrid”ga qarshi statistikasi xulosasi",
      tableCaption: "Messining “Real Madrid”ga qarshi musobaqalar bo'yicha statistikasi",
      thComp: "Musobaqa",
      thApps: "O'yinlar",
      thGoals: "Gollar",
      thAssists: "Assistlar",
      compLaLiga: "La Liga",
      compSupercopa: "Ispaniya Superkubogi",
      compUcl: "UEFA Chempionlar Ligasi",
      compCdr: "Qirol Kubogi (Copa del Rey)",
      compTotal: "Barcha musobaqalar jami",
      momentsHead: "Bernabeu va Kamp Noudagi afsonaviy lahzalar",
      m1Name: "19 yoshda het-trik (2007)",
      m1Goals: "Kamp Nou · 3-3",
      m1Meta: "Karyerasidagi ilk het-trik, “Real Madrid”ga qarshi 3 marta hisobni tenglashtirgan.",
      m2Name: "Tarixiy 2:6 (2009)",
      m2Goals: "Santyago Bernabeu · 2 ta gol",
      m2Meta: "Gvardiola Bernabeuda Leo Messi uchun “Soxta to'qqizlik” rolini yaratdi.",
      m3Name: "ECHLdagi ajoyib yakkaxon gol (2011)",
      m3Goals: "Santyago Bernabeu · 0-2",
      m3Meta: "Chempionlar Ligasi yarim finalida “Real”ning 4 nafar himoyachisini aldab o'tilgan afsonaviy gol.",
      m4Name: "500-gol va futbolka bilan nishonlash (2017)",
      m4Goals: "Santyago Bernabeu · 2-3",
      m4Meta: "92-daqiqadagi g'alaba goli va Bernabeuda 10-raqamli futbolkasini ko'rsatib nishonlashi.",
      faqHead: "Ko'p beriladigan savollar",
      exploreTitle: "Barcha statistikalarni o'rganing"
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
    },
    ar: {
      title: "أهداف ليونيل ميسي في دوري أبطال أوروبا: 129 هدفاً و4 ألقاب",
      desc: "سجل ليونيل ميسي في دوري أبطال أوروبا: 129 هدفاً في 163 مباراة (0.79 هدف/مباراة)، 4 ألقاب دوري أبطال، 8 هاتريك وتفصيل الأدوار الإقصائية.",
      eyebrow: "السيادة الأوروبية",
      eyebrowSub: "سجل دوري أبطال أوروبا",
      h1: "أهداف ليونيل ميسي في دوري أبطال أوروبا",
      lede: "سجل ليونيل ميسي 129 هدفاً في 163 مباراة بدوري أبطال أوروبا خلال 19 موسماً متتالياً مع برشلونة وباريس سان جيرمان، متوجاً باللقب الأوروبي 4 مرات.",
      kpiGoals: "أهداف دوري الأبطال",
      kpiGoalsNote: "120 مع برشلونة، 9 مع باريس",
      kpiApps: "المباريات",
      kpiAppsNote: "0.79 هدف لكل مباراة",
      kpiTrophies: "الألقاب المحققة",
      kpiTrophiesNote: "2006، 2009، 2011، 2015",
      kpiHatTricks: "هاتريك دوري الأبطال",
      kpiHatTricksNote: "رقم قياسي تاريخي مشترك",
      stageHead: "الأهداف حسب أدوار البطولة",
      thStage: "الدور",
      thGoals: "الأهداف",
      thApps: "المباريات",
      thRatio: "المعدل",
      thHighlights: "أبرز اللحظات التاريخية",
      rowGroup: "دور المجموعات",
      rowGroupHl: "هاتريك ضد مانشستر سيتي، 4 أهداف ضد آيندهوفن",
      rowR16: "ثمن النهائي (دور الـ 16)",
      rowR16Hl: "5 أهداف ضد باير ليفركوزن (2012)، هدفان ضد تشيلسي (2018)",
      rowQf: "ربع النهائي",
      rowQfHl: "4 أهداف ضد أرسنال (2010)، هدفان ضد مانشستر يونايتد (2019)",
      rowSf: "نصف النهائي",
      rowSfHl: "هدف تاريخي فردي في البرنابيو (2011)، هدفان ضد بايرن (2015)",
      rowFinal: "المباريات النهائية",
      rowFinalHl: "رأسية روما الشهيرة (2009)، تسديدة ويمبلي التاريخية (2011)",
      rowTotal: "إجمالي دوري أبطال أوروبا",
      rowTotalHl: "4 كؤوس أوروبية",
      bdayBadge: "🎂 أداة تفاعلية شائعة",
      bdayTitle: "هل سجل ليونيل ميسي في دوري أبطال أوروبا في يوم ميلادك؟",
      bdayDesc: "ابحث في جميع أيام السنة الـ 366 مع مقاطع فيديو لجميع أهداف ميسي الـ 129 في دوري أبطال أوروبا.",
      bdayBtn: "تحقق من يوم ميلادي ⚽",
      faqHead: "الأسئلة الشائعة",
      q1: "كم هدفاً سجله ميسي في دوري أبطال أوروبا مع برشلونة؟",
      a1: "سجل ليونيل ميسي 120 هدفاً في دوري أبطال أوروبا لصالح نادي برشلونة، وهو أكبر عدد من الأهداف يسجله لاعب لنادٍ واحد في تاريخ البطولة.",
      q2: "في أي نهائيات لدوري أبطال أوروبا سجل ميسي؟",
      a2: "سجل ميسي في مباراتين نهائيتين بدوري أبطال أوروبا، كلاهما ضد مانشستر يونايتد: رأسية ساقطة في روما 2009 (2-0) وتسديدة قوية في ويمبلي 2011 (3-1).",
      q3: "ما هي أكثر مباراة سجل فيها ميسي أهدافاً في دوري أبطال أوروبا؟",
      a3: "في 7 مارس 2012، سجل ميسي 5 أهداف في مباراة واحدة ضد باير ليفركوزن (7-1)، ليصبح أول لاعب في تاريخ دوري أبطال أوروبا الحديث يحقق هذا الإنجاز.",
      q4: "كم نادياً مختلفاً سجل ميسي في شباكه بدوري أبطال أوروبا؟",
      a4: "يمتلك ليونيل ميسي الرقم القياسي التاريخي في دوري أبطال أوروبا بالتسجيل في شباك 40 نادياً مختلفاً طوال مسيرته الأوروبية.",
      videoName: "هدف ميسي في نهائي دوري أبطال أوروبا 2011 ضد مانشستر يونايتد",
      videoDesc: "شاهد تسديدة ميسي الصاروخية في شباك فان دير سار في فوز برشلونة 3-1 في ويمبلي."
    },
    bn: {
      title: "চ্যাম্পিয়নস লিগে মেসির গোল: ১২৯ গোল ও ৪টি শিরোপা",
      desc: "উয়েফা চ্যাম্পিয়নস লিগে লিওনেল মেসির রেকর্ড: ১৬৩ ম্যাচে ১২৯ গোল (ম্যাচ প্রতি ০.৭৯ গোল), ৪টি চ্যাম্পিয়নস লিগ ট্রফি, ৮টি হ্যাটট্রিক এবং নকআউট পর্বের পূর্ণাঙ্গ হিসাব।",
      eyebrow: "ইউরোপীয় আধিপত্য",
      eyebrowSub: "উয়েফা চ্যাম্পিয়নস লিগ রেকর্ড",
      h1: "চ্যাম্পিয়নস লিগে লিওনেল মেসির গোল",
      lede: "বার্সেলোনা ও প্যারিস সেন্ট জার্মেইর হয়ে টানা ১৯টি মৌসুমে উয়েফা চ্যাম্পিয়নস লিগে ১৬৩ ম্যাচে ১২৯ গোল করেছেন লিওনেল মেসি এবং ৪ বার ইউরোপ সেরার খেতাব জিতেছেন।",
      kpiGoals: "চ্যাম্পিয়নস লিগ গোল",
      kpiGoalsNote: "১২০ বার্সেলোনা, ৯ পিএসজি",
      kpiApps: "ম্যাচ",
      kpiAppsNote: "ম্যাচ প্রতি ০.৭৯ গোল",
      kpiTrophies: "ট্রফি জয়",
      kpiTrophiesNote: "২০০৬, ২০০৯, ২০১১, ২০১৫",
      kpiHatTricks: "চ্যাম্পিয়নস লিগ হ্যাটট্রিক",
      kpiHatTricksNote: "সর্বকালের যৌথ রেকর্ড",
      stageHead: "টুর্নামেন্টের পর্বভিত্তিক গোল",
      thStage: "পর্ব",
      thGoals: "গোল",
      thApps: "ম্যাচ",
      thRatio: "অনুপাত",
      thHighlights: "স্মরণীয় মুহূর্ত",
      rowGroup: "গ্রুপ পর্ব",
      rowGroupHl: "ম্যান সিটির বিরুদ্ধে হ্যাটট্রিক, পিএসভির বিপক্ষে ৪ গোল",
      rowR16: "শেষ ১৬",
      rowR16Hl: "লেভারকুসেনের বিপক্ষে ৫ গোল (২০১২), চেলসির বিরুদ্ধে ২ গোল (২০১৮)",
      rowQf: "কোয়ার্টার-ফাইনাল",
      rowQfHl: "আর্সেনালের বিপক্ষে ৪ গোল (২০১০), ম্যান ইউনাইটেডের বিরুদ্ধে ২ গোল (২০১৯)",
      rowSf: "সেমিফাইনাল",
      rowSfHl: "বার্নাব্যুতে ঐতিহাসিক একক গোল (২০১১), বায়ার্নের বিপক্ষে ২ গোল (২০১৫)",
      rowFinal: "ফাইনাল",
      rowFinalHl: "রোমে দুর্দান্ত হেডার (২০০৯), ওয়েম্বলিতে দুরপাল্লার গোল (২০১১)",
      rowTotal: "সর্বমোট চ্যাম্পিয়নস লিগ",
      rowTotalHl: "৪টি ইউরোপিয়ান ট্রফি",
      bdayBadge: "🎂 ভাইরাল ইন্টারঅ্যাক্টিভ টুল",
      bdayTitle: "লিওনেল মেসি কি আপনার জন্মদিনে চ্যাম্পিয়নস লিগে গোল করেছিলেন?",
      bdayDesc: "চ্যাম্পিয়নস লিগে মেসির ১২৯টি গোলের প্রতিটি ভিডিও সহ বছরের ৩৬৬ দিনের ক্যালেন্ডার অনুসন্ধান করুন।",
      bdayBtn: "আমার জন্মদিন দেখুন ⚽",
      faqHead: "সচরাচর জিজ্ঞাস্য প্রশ্নসমূহ",
      q1: "বার্সেলোনার হয়ে চ্যাম্পিয়নস লিগে মেসি কতটি গোল করেছেন?",
      a1: "লিওনেল মেসি এফসি বার্সেলোনার হয়ে চ্যাম্পিয়নস লিগে ১২০টি গোল করেছেন — যা টুর্নামেন্টের ইতিহাসে একক ক্লাবের হয়ে সর্বোচ্চ গোলের বিশ্বরেকর্ড।",
      q2: "মেসি কোন কোন চ্যাম্পিয়নস লিগ ফাইনালে গোল করেছেন?",
      a2: "মেসি দুটি চ্যাম্পিয়নস লিগ ফাইনালে গোল করেছেন, দুটিই ম্যানচেস্টার ইউনাইটেডের বিরুদ্ধে: রোম ২০০৯ ফাইনালে দুর্দান্ত হেডার (২-০) এবং ওয়েম্বলি ২০১১ ফাইনালে জোরালো শটে গোল (৩-১)।",
      q3: "চ্যাম্পিয়নস লিগে এক ম্যাচে মেসির সর্বোচ্চ গোল কত?",
      a3: "২০১২ সালের ৭ মার্চ বায়ার লেভারকুসেনের বিপক্ষে ৭-১ গোলের জয়ে মেসি একাই ৫ গোল করেন, যা আধুনিক চ্যাম্পিয়নস লিগ যুগে প্রথম এমন অনন্য রেকর্ড।",
      q4: "চ্যাম্পিয়নস লিগে মেসি কতটি ভিন্ন ক্লাবের বিপক্ষে গোল করেছেন?",
      a4: "উয়েফা চ্যাম্পিয়নস লিগের ইতিহাসে রেকর্ড গড়ে লিওনেল মেসি ইউরোপীয় ক্যারিয়ারে মোট ৪০টি ভিন্ন ক্লাবের বিপক্ষে গোল করেছেন।",
      videoName: "ম্যান ইউনাইটেডের বিপক্ষে ২০১১ সালের ফাইনালে মেসির গোল",
      videoDesc: "ওয়েম্বলিতে বার্সেলোনার ৩-১ গোলের জয়ে ৫৪তম মিনিটে এডউইন ভ্যান ডার সারকে পরাস্ত করা মেসির জোরালো শট।"
    },
    hi: {
      title: "चैंपियंस लीग में लियोनेल मेसी के गोल: 129 गोल और 4 ट्रॉफियां",
      desc: "यूईएफए चैंपियंस लीग में लियोनेल मेसी का रिकॉर्ड: 163 मैचों में 129 गोल (0.79 गोल प्रति मैच), 4 यूसीएल ट्रॉफियां, 8 हैट्रिक और सभी दौरों का विवरण।",
      eyebrow: "यूरोपीय महारत",
      eyebrowSub: "यूईएफए चैंपियंस लीग रिकॉर्ड",
      h1: "चैंपियंस लीग में लियोनेल मेसी के गोल",
      lede: "लियोनेल मेसी ने बार्सिलोना और पेरिस सेंट-जर्मेन के लिए लगातार 19 सत्रों में 163 यूईएफए चैंपियंस लीग मैचों में 129 गोल किए और 4 बार यूरोपीय कप जीता।",
      kpiGoals: "यूसीएल गोल",
      kpiGoalsNote: "120 बार्सिलोना, 9 पीएसजी",
      kpiApps: "मैच",
      kpiAppsNote: "0.79 गोल प्रति मैच",
      kpiTrophies: "जीते गए खिताब",
      kpiTrophiesNote: "2006, 2009, 2011, 2015",
      kpiHatTricks: "यूसीएल हैट्रिक",
      kpiHatTricksNote: "सर्वकालिक संयुक्त रिकॉर्ड",
      stageHead: "टूर्नामेंट के चरण अनुसार गोल",
      thStage: "चरण",
      thGoals: "गोल",
      thApps: "मैच",
      thRatio: "औसत",
      thHighlights: "यादगार पल",
      rowGroup: "ग्रुप चरण",
      rowGroupHl: "मैन सिटी के खिलाफ हैट्रिक, पीएसवी के खिलाफ 4 गोल",
      rowR16: "राउंड ऑफ 16",
      rowR16Hl: "लीवरकुसेन के खिलाफ 5 गोल (2012), चेल्सी के खिलाफ 2 (2018)",
      rowQf: "क्वार्टर-फाइनल",
      rowQfHl: "आर्सेनल के खिलाफ 4 गोल (2010), मैन यूनाइटेड के खिलाफ 2 (2019)",
      rowSf: "सेमीफाइनल",
      rowSfHl: "बर्नाब्यू में जादुई गोल (2011), बायर्न के खिलाफ 2 गोल (2015)",
      rowFinal: "फाइनल",
      rowFinalHl: "रोम में प्रसिद्ध हेडर (2009), वेम्बली में जोरदार गोल (2011)",
      rowTotal: "कुल चैंपियंस लीग",
      rowTotalHl: "4 यूरोपीय कप",
      bdayBadge: "🎂 वायरल इंटरएक्टिव टूल",
      bdayTitle: "क्या लियोनेल मेसी ने आपके जन्मदिन पर चैंपियंस लीग में गोल किया था?",
      bdayDesc: "चैंपियंस लीग में मेसी के 129 गोलों के सभी वीडियो के साथ साल के 366 दिन खोजें।",
      bdayBtn: "अपना जन्मदिन चेक करें ⚽",
      faqHead: "अक्सर पूछे जाने वाले सवाल",
      q1: "बार्सिलोना के लिए मेसी ने चैंपियंस लीग में कितने गोल किए?",
      a1: "लियोनेल मेसी ने एफसी बार्सिलोना के लिए 120 चैंपियंस लीग गोल किए — जो टूर्नामेंट के इतिहास में किसी एक क्लब के लिए सबसे अधिक गोल हैं।",
      q2: "मेसी ने किन चैंपियंस लीग फाइनल में गोल किया था?",
      a2: "मेसी ने दो चैंपियंस लीग फाइनल में गोल किया, दोनों मैनचेस्टर यूनाइटेड के खिलाफ: रोम 2009 (2-0) में हेडर से और वेम्बली 2011 (3-1) में 20 गज की दूरी से शानदार गोल।",
      q3: "चैंपियंस लीग में एक मैच में मेसी का सर्वाधिक स्कोर क्या है?",
      a3: "7 मार्च 2012 को मेसी ने बायर लीवरकुसेन के खिलाफ 7-1 की जीत में एक ही मैच में 5 गोल किए, और आधुनिक चैंपियंस लीग में ऐसा करने वाले पहले खिलाड़ी बने।",
      q4: "मेसी ने यूसीएल में कितने अलग-अलग क्लबों के खिलाफ गोल किए?",
      a4: "लियोनेल मेसी के नाम यूईएफए चैंपियंस लीग का सर्वकालिक रिकॉर्ड है, उन्होंने अपने यूरोपीय करियर में 40 विभिन्न क्लबों के खिलाफ गोल किए हैं।",
      videoName: "मैनचेस्टर यूनाइटेड के खिलाफ 2011 चैंपियंस लीग फाइनल में मेसी का गोल",
      videoDesc: "वेम्बली में बार्सिलोना की 3-1 की फाइनल जीत में एडविन वैन डेर सार को छकाते हुए मेसी का 54वें मिनट का गोल देखें।"
    },
    ro: {
      title: "Golurile lui Lionel Messi în Champions League: 129 de Goluri și 4 Trofee",
      desc: "Recordul lui Lionel Messi în UEFA Champions League: 129 de goluri în 163 de meciuri (0,79/meci), 4 trofee UCL, 8 hat-trick-uri și statistica pe faze.",
      eyebrow: "Supremație Europeană",
      eyebrowSub: "Recordul în UEFA Champions League",
      h1: "Golurile lui Lionel Messi în Liga Campionilor",
      lede: "Lionel Messi a marcat 129 de goluri în 163 de meciuri din UEFA Champions League de-a lungul a 19 sezoane consecutive pentru Barcelona și Paris Saint-Germain, cucerind Cupa Campionilor de 4 ori.",
      kpiGoals: "Goluri UCL",
      kpiGoalsNote: "120 Barcelona, 9 PSG",
      kpiApps: "Meciuri",
      kpiAppsNote: "0,79 Goluri pe Meci",
      kpiTrophies: "Trofee Câștigate",
      kpiTrophiesNote: "2006, 2009, 2011, 2015",
      kpiHatTricks: "Hat-Trick-uri UCL",
      kpiHatTricksNote: "Record Istoric Împărțit",
      stageHead: "Goluri pe Etape ale Turneului",
      thStage: "Etapă",
      thGoals: "Goluri",
      thApps: "Meciuri",
      thRatio: "Medie",
      thHighlights: "Momente Memorabile",
      rowGroup: "Faza Grupelor",
      rowGroupHl: "Hat-trick vs Man City, 4 goluri vs PSV",
      rowR16: "Optimi de Finală",
      rowR16Hl: "5 goluri vs Leverkusen (2012), 2 vs Chelsea (2018)",
      rowQf: "Sferturi de Finală",
      rowQfHl: "4 goluri vs Arsenal (2010), 2 vs Man United (2019)",
      rowSf: "Semifinale",
      rowSfHl: "Gol antologic pe Bernabéu (2011), 2 vs Bayern (2015)",
      rowFinal: "Finale",
      rowFinalHl: "Lovitură de cap la Roma (2009), Șut la Wembley (2011)",
      rowTotal: "Total Liga Campionilor",
      rowTotalHl: "4 Cupe ale Campionilor",
      bdayBadge: "🎂 INSTRUMENT VIRAL INTERACTIV",
      bdayTitle: "A marcat Lionel Messi în Champions League de ziua ta?",
      bdayDesc: "Caută în toate cele 366 de zile din an cu videoclipuri pentru fiecare din cele 129 de goluri ale lui Messi în UCL.",
      bdayBtn: "Verifică Ziua Mea ⚽",
      faqHead: "Întrebări Frecvente",
      q1: "Câte goluri a marcat Messi în Champions League pentru Barcelona?",
      a1: "Lionel Messi a marcat 120 de goluri în Liga Campionilor pentru FC Barcelona — cele mai multe goluri înscrise pentru un singur club în istoria competiției.",
      q2: "În ce finale de Champions League a marcat Messi?",
      a2: "Messi a marcat în două finale de Champions League, ambele împotriva lui Manchester United: o lovitură de cap la Roma în 2009 (2-0) și un șut de la distanță pe Wembley în 2011 (3-1).",
      q3: "Care este meciul cu cele mai multe goluri marcate de Messi în UCL?",
      a3: "Pe 7 martie 2012, Messi a marcat 5 goluri într-un singur meci din Liga Campionilor împotriva lui Bayer Leverkusen (7-1), devenind primul jucător din era modernă a competiției care a reușit această performanță.",
      q4: "Împotriva a câte cluburi diferite a marcat Messi în Liga Campionilor?",
      a4: "Lionel Messi deține recordul absolut în UEFA Champions League, înscriind împotriva a 40 de cluburi adverse diferite de-a lungul carierei sale europene.",
      videoName: "Golul lui Messi din finala Ligii Campionilor 2011 cu Manchester United",
      videoDesc: "Șutul superb al lui Lionel Messi din minutul 54 pe Wembley împotriva lui Van der Sar în victoria 3-1."
    },
    uz: {
      title: "Lionel Messining Chempionlar Ligasidagi gollari: 129 ta gol va 4 ta titul",
      desc: "Lionel Messining UEFA Chempionlar Ligasidagi rekordi: 163 ta o'yinda 129 ta gol (0,79 gol/o'yin), 4 ta ECHL kubogi, 8 ta het-trik va pley-off bosqichlari statistikasi.",
      eyebrow: "Yevropa Hukmronligi",
      eyebrowSub: "UEFA Chempionlar Ligasi Rekordi",
      h1: "Lionel Messining Chempionlar Ligasidagi Gollari",
      lede: "Lionel Messi “Barselona” va “Pari Sen-Jermen” safida ketma-ket 19 mavsum davomida UEFA Chempionlar Ligasida 163 ta o'yinda 129 ta gol urdi va 4 marta Yevropa kubogini qo'lga kiritdi.",
      kpiGoals: "ECHL Gollari",
      kpiGoalsNote: "120 Barselona, 9 PSJ",
      kpiApps: "O'yinlar",
      kpiAppsNote: "0,79 Gol Har O'yinda",
      kpiTrophies: "Qit'a Chempionliklari",
      kpiTrophiesNote: "2006, 2009, 2011, 2015",
      kpiHatTricks: "ECHL Het-triklari",
      kpiHatTricksNote: "Mutlaq Umumiy Rekord",
      stageHead: "Turnir Bosqichlari Bo'yicha Gollar",
      thStage: "Bosqich",
      thGoals: "Gollar",
      thApps: "O'yinlar",
      thRatio: "Nisbat",
      thHighlights: "Tarixiy Muhim Lahzalar",
      rowGroup: "Guruh Bosqichi",
      rowGroupHl: "“Man Siti”ga qarshi het-trik, PSVga 4 ta gol",
      rowR16: "Nimchorak Final",
      rowR16Hl: "“Leverkuzen”ga 5 ta gol (2012), “Chelsi”ga 2 ta gol (2018)",
      rowQf: "Chorak Final",
      rowQfHl: "“Arsenal”ga 4 ta gol (2010), “MYu”ga 2 ta gol (2019)",
      rowSf: "Yarim Final",
      rowSfHl: "Bernabeudagi afsonaviy yakkaxon gol (2011), “Bavariya”ga 2 ta gol (2015)",
      rowFinal: "Finallar",
      rowFinalHl: "Rimda bosh bilan urilgan gol (2009), Uemblidagi zarba (2011)",
      rowTotal: "Jami Chempionlar Ligasi",
      rowTotalHl: "4 karra Yevropa Chempioni",
      bdayBadge: "🎂 VIRAL INTERAKTIV VOSITA",
      bdayTitle: "Lionel Messi sizning tug'ilgan kuningizda Chempionlar Ligasida gol urganmi?",
      bdayDesc: "Messining Chempionlar Ligasidagi 129 ta golining har birini videolari bilan 366 kun ichidan izlang.",
      bdayBtn: "Tug'ilgan Kunimni Tekshirish ⚽",
      faqHead: "Ko'p Beriladigan Savollar",
      q1: "Messi “Barselona” safida Chempionlar Ligasida nechta gol urgan?",
      a1: "Lionel Messi “Barselona” klubi safida Chempionlar Ligasida 120 ta gol urgan — bu musobaqa tarixida bitta klub uchun urilgan eng ko'p gollardir.",
      q2: "Messi Chempionlar Ligasining qaysi finallarida gol urgan?",
      a2: "Messi ikkita Chempionlar Ligasi finalida gol urgan, ikkalasi ham “Manchester Yunayted”ga qarshi: Rimdagi finalda (2009, 2:0) bosh bilan va Uemblida (2011, 3:1) uzoqdan berilgan zarba bilan.",
      q3: "Chempionlar Ligasida Messining bir o'yindagi eng ko'p goli qancha?",
      a3: "2012 yil 7 martda Messi “Bayer Leverkuzen”ga qarshi o'yinda (7:1) bitta uchrashuvda 5 ta gol urib, zamonaviy Chempionlar Ligasi tarixida buni uddalagan birinchi futbolchiga aylandi.",
      q4: "Messi ECHLda nechta turli klub darvozasiga gol urgan?",
      a4: "Lionel Messi Chempionlar Ligasi tarixidagi mutlaq rekordga ega bo'lib, o'zining yevrokuboklardagi faoliyatida 40 ta turli xil klub darvozasiga gol kiritgan.",
      videoName: "Messining 2011 yilgi Chempionlar Ligasi finalidagi “MYu”ga urgan goli",
      videoDesc: "54-daqiqada Uemblida van der Sarni dog'da qoldirgan Messining zarbasi va “Barselona”ning 3:1 hisobidagi g'alabasi."
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
    fr: "Statistiques et Rivalités",
    ar: "الأرقام القياسية والمنافسات",
    bn: "রেকর্ড ও প্রতিদ্বন্দ্বিতা",
    hi: "रिकॉर्ड और प्रतिद्वंद्विता",
    ro: "Recorduri și Rivalități",
    uz: "Rekordlar va Raqobat"
  }[lang] || "Career Records & Rivalries";

  const footerLangsHead = {
    es: "Idiomas / Languages",
    pt: "Idiomas / Languages",
    fr: "Éditions Internationales / Languages",
    ar: "اللغات / Languages",
    bn: "আন্তর্জাতিক সংস্করণ / Languages",
    hi: "अंतर्राष्ट्रीय संस्करण / Languages",
    ro: "Ediții Internaționale / Languages",
    uz: "Xalqaro nashrlar / Languages"
  }[lang] || "International Editions / Idiomas";

  const exploreHead = {
    es: "Explora todas las estadísticas",
    pt: "Explore todas as estatísticas",
    fr: "Explorer toutes les statistiques",
    ar: "استكشف جميع الإحصائيات",
    bn: "সব পরিসংখ্যান দেখুন",
    hi: "सभी आंकड़े देखें",
    ro: "Explorează toate statisticile",
    uz: "Barcha statistikalarni o'rganing"
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
            <a href="/ar" hreflang="ar">العربية</a>
            <a href="/bn" hreflang="bn">বাংলা</a>
            <a href="/hi" hreflang="hi">हिन्दी</a>
            <a href="/ro" hreflang="ro">Română</a>
            <a href="/uz" hreflang="uz">Oʻzbekcha</a>
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
const targetLangs = ["pt", "fr", "ar", "bn", "hi", "ro", "uz"];

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

console.log(`Successfully generated ${createdCount} localized subpages across all languages!`);
