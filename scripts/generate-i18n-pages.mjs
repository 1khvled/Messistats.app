// Generator for all localized subpages across 7 languages: pt, fr, ar, bn, hi, ro, uz
// Run with: node scripts/generate-i18n-pages.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const LANGS = {
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
      desc: "Pesquise todos os 366 dias do ano ao longo dos 929 gols da carreira de Messi. Veja vídeos de cada gol marcado no seu dia especial.",
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
      desc: "Recherchez parmi les 366 jours du calendrier à travers les 929 buts de Messi. Regardez les vidéos de chaque but marqué lors de votre jour spécial.",
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
    dateStr: "18 سبتمبر 2026",
    skip: "الانتقال إلى المحتوى الرئيسي",
    backToStats: "← العودة إلى الإحصائيات",
    themeToggle: "تبديل المظهر",
    darkMode: "الوضع الداكن",
    adLabel: "إعلان",
    bdayPromo: {
      badge: "🎂 أداة تفاعلية شائعة",
      title: "هل سجل ميسي في يوم عيد ميلادك؟",
      desc: "ابحث في جميع أيام السنة الـ 366 عبر أهداف ميسي الـ 929. شاهد مقاطع فيديو لكل هدف سُجل في يومك المميز.",
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
    dateStr: "১৮ সেপ্টেম্বর ২০২৬",
    skip: "মূল কন্টেন্টে যান",
    backToStats: "← পরিসংখ্যানে ফিরে যান",
    themeToggle: "থিম পরিবর্তন করুন",
    darkMode: "ডার্ক মোড",
    adLabel: "বিজ্ঞাপন",
    bdayPromo: {
      badge: "🎂 ভাইরাল ইন্টারঅ্যাক্টিভ টুল",
      title: "মেসি কি আপনার জন্মদিনে গোল করেছিলেন?",
      desc: "মেসির ৯২৯টি ক্যারিয়ার গোলের মধ্য থেকে বছরের ৩৬৬ দিনের প্রতিটি দিন অনুসন্ধান করুন এবং ভিডিও দেখুন।",
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
      desc: "मेसी के 929 करियर गोलों में से साल के सभी 366 दिनों को खोजें और अपने खास दिन के गोल वीडियो देखें।",
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
      desc: "Caută în toate cele 366 de zile din an de-a lungul celor 929 de goluri din cariera lui Messi. Urmărește videoclipuri pentru fiecare gol.",
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
      desc: "Messining 929 ta goli orqali yilning barcha 366 kunini qidiring va o'sha kun urilgan gollarning videolarini tomosha qiling.",
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
<a${onAria("champions-league")} href="/en/champions-league" aria-label="${L.nav.ucl}"><svg aria-hidden="true" viewbox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg><span>${L.nav.ucl}</span></a>
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
<script async="async" data-cfasync="false" src="https://pl31316537.profitableratecpmnetwork.com/f4bcf68dc7a4accd4a4c773aa7965161/invoke.js"></script>
<div id="container-f4bcf68dc7a4accd4a4c773aa7965161"></div>
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
<meta content="${keywords || 'messi, messi stats, lionel messi, 929 goals, messi goals'}" name="keywords"/>
${hreflangs}
<meta content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" name="robots"/>
<meta content="#16243a" name="theme-color"/>
<meta content="MessiStats" name="author"/>
<meta content="website" property="og:type"/>
<meta content="MessiStats" property="og:site_name"/>
<meta content="${L.ogLocale}" property="og:locale"/>
<meta content="${L.ogLocaleAlt}" property="og:locale:alternate"/>
<meta content="${title} | MessiStats" property="og:title"/>
<meta content="${desc}" property="og:description"/>
<meta content="https://www.messistat.com/${lang}/${pageSlug === 'index' ? '' : pageSlug}" property="og:url"/>
<meta content="https://www.messistat.com/img/og-messi.jpg" property="og:image"/>
<meta content="1200" property="og:image:width"/>
<meta content="630" property="og:image:height"/>
<meta content="summary_large_image" name="twitter:card"/>
<meta content="${title} | MessiStats" name="twitter:title"/>
<meta content="${desc}" name="twitter:description"/>
<meta content="https://www.messistat.com/img/og-messi.jpg" name="twitter:image"/>
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
      desc: "Painel interativo da carreira de Lionel Messi: 929 gols filtráveis por Barcelona, PSG, Inter Miami e Seleção Argentina.",
      h1: "Painel de Estatísticas de Lionel Messi",
      lede: "Análise interativa dos 929 gols na carreira de Lionel Messi em todas as competições, temporadas, tipos de finalização e partes do corpo — filtrável por equipe.",
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
      desc: "Tableau de bord interactif de la carrière de Lionel Messi : 929 buts filtrables par Barcelone, PSG, Inter Miami et Argentine.",
      h1: "Tableau de Bord des Statistiques de Lionel Messi",
      lede: "Analyse interactive des 929 buts en carrière de Lionel Messi à travers toutes les compétitions, saisons, types de tirs et surfaces du corps.",
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
      desc: "لوحة إحصائيات تفاعلية لمسيرة ليونيل ميسي: 929 هدفاً قابلة للتصفية حسب برشلونة، باريس سان جيرمان، إنتر ميامي ومنتخب الأرجنتين.",
      h1: "لوحة إحصائيات ليونيل ميسي",
      lede: "تحليل تفاعلي لـ 929 هدفاً في مسيرة ليونيل ميسي عبر جميع البطولات، المواسم، طرق التسجيل وأجزاء الجسم.",
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
      desc: "লিওনেল মেসির ক্যারিয়ারের ৯২৯টি অফিসিয়াল গোলের বিশদ ইন্টারেক্টিভ ড্যাশবোর্ড। দল, প্রতিযোগিতা এবং শারীরিক অংশ অনুযায়ী ফিল্টার করুন।",
      h1: "লিওনেল মেসি পরিসংখ্যান ড্যাশবোর্ড",
      lede: "লিওনেল মেসির ক্যারিয়ারের ৯২৯টি গোলের ইন্টারেক্টিভ বিশ্লেষণ — বার্সেলোনা, পিএসজি, ইন্টার মায়ামি এবং আর্জেন্টিনার জন্য ফিল্টারযোগ্য।",
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
      desc: "लियोनेल मेसी के 929 गोलों का विस्तृत इंटरएक्टिव डैशबोर्ड। बार्सिलोना, पीएसजी, इंटर मियामी और अर्जेंटीना के अनुसार फ़िल्टर करें।",
      h1: "लियोनेल मेसी आँकड़े डैशबोर्ड",
      lede: "लियोनेल मेसी के करियर के 929 गोलों का इंटरएक्टिव विश्लेषण — हर प्रतियोगिता, सीज़न और बॉडी पार्ट के अनुसार।",
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
      desc: "Panou interactiv al carierei lui Lionel Messi: 929 de goluri filtrabile pe Barcelona, PSG, Inter Miami și Argentina.",
      h1: "Panoul de Statistici Lionel Messi",
      lede: "Analiză interactivă a celor 929 de goluri din cariera lui Lionel Messi pe toate competițiile, sezoanele, tipurile de șut și părțile corpului.",
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
      desc: "Lionel Messining 929 ta rasmiy goli bo'yicha interaktiv boshqaruv paneli: Barselona, PSJ, Inter Mayami va Argentina bo'yicha saralang.",
      h1: "Lionel Messi Statistika Paneli",
      lede: "Lionel Messining faoliyatidagi 929 ta golining musobaqalar, mavsumlar, zarba turlari va tana a'zolari bo'yicha interaktiv tahlili.",
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
<div aria-label="Filter" class="pills" id="pills" role="group"></div>
<p class="section-sub" id="filter-note"></p>
<section aria-label="KPIs" class="kpis kpis-3" id="kpis"></section>
<div class="shead"><h2>${dict.compTitle}</h2></div>
<section class="card chart-card" id="comp-card"></section>
${renderAdSlot(lang)}
<div class="shead"><h2>${dict.seasonTitle}</h2></div>
<section class="card chart-card" id="season-card"></section>
<div class="shead"><h2>${dict.teamTitle}</h2></div>
<section aria-label="Team cards" class="team-grid" id="team-cards">...</section>
<div class="shead"><h2>${dict.finishTitle}</h2></div>
<section class="card chart-card" id="finish-card"></section>
${renderAdSlot(lang)}
<div class="shead"><h2>${dict.bodyTitle}</h2></div>
<section class="card chart-card" id="body-card"></section>
<div class="shead"><h2>${dict.ageTitle}</h2></div>
<section class="card chart-card" id="age-card"></section>
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
      desc: "Todos os gols de Lionel Messi por temporada de clubes e ano de seleção: 804 por clubes e 125 pela Argentina.",
      h1: "Gols de Lionel Messi por Temporada",
      lede: "Todas as temporadas de clube desde 2004/05 até 2026 — recorde de 73 gols em 2011/12 — com divisão de liga, copas e torneios internacionais.",
      clubHead: "Todas as temporadas por clube (Barcelona, PSG, Inter Miami)",
      countryHead: "Gols com a Seleção Argentina ano a ano",
      bestSeasonHead: "¿Qual foi a melhor temporada da carreira de Messi?",
      exploreTitle: "Explore todas as estatísticas"
    },
    fr: {
      title: "Buts de Messi par Saison (2004/05–2026)",
      desc: "Tous les buts de Lionel Messi par saison en club et par année en sélection : 804 buts en club et 125 avec l'Argentine.",
      h1: "Buts de Lionel Messi par Saison",
      lede: "Toutes les saisons en club de 2004/05 à 2026 — record de 73 buts en 2011/12 — avec répartition par ligue, coupes et compétitions continentales.",
      clubHead: "Toutes les saisons en club (Barcelone, PSG, Inter Miami)",
      countryHead: "Buts avec l'Argentine année par année",
      bestSeasonHead: "Quelle a été la meilleure saison de la carrière de Messi ?",
      exploreTitle: "Explorer toutes les statistiques"
    },
    ar: {
      title: "أهداف ميسي حسب الموسم (2004/05–2026)",
      desc: "جميع أهداف ليونيل ميسي حسب الموسم مع الأندية والأرجنتين: 804 هدفاً للأندية و125 للأرجنتين.",
      h1: "أهداف ليونيل ميسي حسب الموسم",
      lede: "جميع مواسم الأندية من 2004/05 إلى 2026 — الرقم القياسي 73 هدفاً في موسم 2011/12 — مع تقسيم الدوري، الكأس والبطولات القارية.",
      clubHead: "جميع مواسم الأندية (برشلونة، باريس، إنتر ميامي)",
      countryHead: "أهداف منتخب الأرجنتين سنة بسنة",
      bestSeasonHead: "ما هو أفضل موسم في مسيرة ليونيل ميسي؟",
      exploreTitle: "استكشف جميع الإحصائيات"
    },
    bn: {
      title: "মৌসুম অনুযায়ী লিওনেল মেসির গোল (২০০৪/০৫–২০২৬)",
      desc: "ক্লাব ও আর্জেন্টিনার হয়ে লিওনেল মেসির প্রতিটি মৌসুমের গোলের হিসাব: ক্লাবে ৮০৪ এবং আর্জেন্টিনার হয়ে ১২৫ গোল।",
      h1: "মৌসুম অনুযায়ী লিওনেল মেসির গোল",
      lede: "২০০৪/০৫ থেকে ২০২৬ পর্যন্ত প্রতিটি ক্লাব মৌসুম — ২০১১/১২ মৌসুমে রেকর্ড ৭৩ গোল সহ লীগ, কাপ ও মহাদেশীয় টুর্নামেন্টের বিভাজন।",
      clubHead: "ক্লাবের হয়ে প্রতিটি মৌসুম (বার্সেলোনা, পিএসজি, ইন্টার মায়ামি)",
      countryHead: "আর্জেন্টিনা জাতীয় দলের হয়ে বছরভিত্তিক গোল",
      bestSeasonHead: "মেসির ক্যারিয়ারের সেরা মৌসুম কোনটি ছিল?",
      exploreTitle: "সব পরিসংখ্যান দেখুন"
    },
    hi: {
      title: "सीज़न अनुसार लियोनेल मेसी के गोल (2004/05–2026)",
      desc: "क्लब और अर्जेंटीना के लिए लियोनेल मेसी के सीज़न दर सीज़न गोल: क्लबों के लिए 804 और अर्जेंटीना के लिए 125 गोल।",
      h1: "सीज़न अनुसार लियोनेल मेसी के गोल",
      lede: "2004/05 से 2026 तक का हर सीज़न — 2011/12 में 73 गोलों का विश्व रिकॉर्ड — लीग, कप और अंतरराष्ट्रीय प्रतियोगिताओं का पूरा ब्यौरा।",
      clubHead: "क्लब सीज़न (बार्सिलोना, पीएसजी, इंटर मियामी)",
      countryHead: "अर्जेंटीना राष्ट्रीय टीम के लिए साल दर साल गोल",
      bestSeasonHead: "मेसी के करियर का सर्वश्रेष्ठ सीज़न कौन सा था?",
      exploreTitle: "सभी आंकड़े देखें"
    },
    ro: {
      title: "Golurile lui Messi pe Sezoane (2004/05–2026)",
      desc: "Toate golurile lui Lionel Messi pe sezoane la cluburi și națională: 804 la cluburi și 125 pentru Argentina.",
      h1: "Golurile lui Lionel Messi pe Sezoane",
      lede: "Fiecare sezon de club din 2004/05 până în 2026 — record: 73 de goluri în 2011/12 — cu detalii pe campionat, cupă și meciuri europene.",
      clubHead: "Toate sezoanele de club (Barcelona, PSG, Inter Miami)",
      countryHead: "Goluri cu naționala Argentinei an de an",
      bestSeasonHead: "Care a fost cel mai bun sezon din cariera lui Messi?",
      exploreTitle: "Explorează toate statisticile"
    },
    uz: {
      title: "Messining Mavsumlar Bo'yicha Gollari (2004/05–2026)",
      desc: "Lionel Messining klublar va terma jamoadagi barcha gollari: klublarda 804 ta va Argentinada 125 ta gol.",
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
      title: "Gols de Messi por Ano (2004–2026): Todos os 929 Gols e Recorde de 91",
      desc: "Gols de Lionel Messi ano a ano (2004–2026): divisão de seus 929 gols oficiais e o recorde mundial de 91 gols em 2012.",
      h1: "Gols de Lionel Messi por Ano (2004–2026)",
      lede: "Todos os 929 gols de Lionel Messi divididos por ano civil de 2004 a 2026, incluindo o recorde mundial do Guinness de 91 gols em 2012.",
      chartHead: "¿Quantos gols Messi marca a cada ano?",
      decadesHead: "Gols por década",
      tableHead: "Gols de Messi ano a ano, 2004 a 2026",
      bestYearHead: "¿Qual foi o melhor ano da carreira de Messi?",
      exploreTitle: "Explore todas as estatísticas"
    },
    fr: {
      title: "Buts de Messi par Année (2004–2026) : Les 929 Buts et Record de 91",
      desc: "Buts de Lionel Messi année par année (2004–2026) : répartition de ses 929 buts officiels et record du monde de 91 buts en 2012.",
      h1: "Buts de Lionel Messi par Année (2004–2026)",
      lede: "Tous les 929 buts de Lionel Messi répartis par année civile de 2004 à 2026, avec le record mondial Guinness de 91 buts en 2012.",
      chartHead: "Combien de buts Messi marque-t-il chaque année ?",
      decadesHead: "Buts par décennie",
      tableHead: "Buts de Messi année par année, de 2004 à 2026",
      bestYearHead: "Quelle a été la meilleure année civile de Messi ?",
      exploreTitle: "Explorer toutes les statistiques"
    },
    ar: {
      title: "أهداف ميسي حسب السنة (2004–2026): 929 هدفاً ورقم الـ 91 التاريخي",
      desc: "أهداف ليونيل ميسي سنة بسنة (2004–2026): تفاصيل الـ 929 هدفاً ورقم جينيس القياسي العالمي بـ 91 هدفاً في عام 2012.",
      h1: "أهداف ليونيل ميسي حسب السنة (2004–2026)",
      lede: "جميع أهداف ليونيل ميسي الـ 929 مقسمة حسب السنوات الميلادية من 2004 إلى 2026، بما فيها 91 هدفاً في عام 2012 الأسطوري.",
      chartHead: "كم هدفاً يسجل ميسي في كل عام؟",
      decadesHead: "الأهداف حسب العقود",
      tableHead: "أهداف ميسي سنة بعد سنة من 2004 إلى 2026",
      bestYearHead: "ما هو أفضل عام ميلادي في مسيرة ميسي؟",
      exploreTitle: "استكشف جميع الإحصائيات"
    },
    bn: {
      title: "বছর অনুযায়ী মেসির গোল (২০০৪–২০২৬): ৯২৯ গোল ও ৯১ গোলের বিশ্বরেকর্ড",
      desc: "২০০৪ থেকে ২০২৬ সাল পর্যন্ত লিওনেল মেসির ৯২৯টি অফিসিয়াল গোলের বছরভিত্তিক তালিকা এবং ২০১২ সালে ৯১ গোলের বিশ্বরেকর্ড।",
      h1: "বছর অনুযায়ী লিওনেল মেসির গোল (২০০৪–২০২৬)",
      lede: "২০০৪ থেকে ২০২৬ সাল পর্যন্ত লিওনেল মেসির মোট ৯২৯টি ক্যারিয়ার গোলের ক্যালেন্ডার বছরভিত্তিক পূর্ণাঙ্গ পরিসংখ্যান।",
      chartHead: "মেসি প্রতি বছর কতটি গোল করেন?",
      decadesHead: "দশক অনুযায়ী গোল",
      tableHead: "বছরভিত্তিক মেসির গোলের সম্পূর্ণ তালিকা (২০০৪–২০২৬)",
      bestYearHead: "মেসির ক্যারিয়ারের সেরা বছর কোনটি ছিল?",
      exploreTitle: "সব পরিসংখ্যান দেখুন"
    },
    hi: {
      title: "साल दर साल मेसी के गोल (2004–2026): 929 गोल और 91 गोलों का विश्व रिकॉर्ड",
      desc: "2004 से 2026 तक लियोनेल मेसी के 929 आधिकारिक गोलों की साल दर साल सूची और 2012 में 91 गोलों का ऐतिहासिक रिकॉर्ड।",
      h1: "साल दर साल लियोनेल मेसी के गोल (2004–2026)",
      lede: "2004 से 2026 तक लियोनेल मेसी के सभी 929 आधिकारिक गोल, जिसमें 2012 में 91 गोलों का गिनीज वर्ल्ड रिकॉर्ड शामिल है।",
      chartHead: "मेसी हर साल कितने गोल करते हैं?",
      decadesHead: "दशक अनुसार गोल",
      tableHead: "2004 से 2026 तक साल दर साल मेसी के गोल",
      bestYearHead: "मेसी का सर्वश्रेष्ठ साल कौन सा था?",
      exploreTitle: "सभी आंकड़े देखें"
    },
    ro: {
      title: "Golurile lui Messi pe Ani (2004–2026): Toate cele 929 de Goluri și Recordul de 91",
      desc: "Golurile lui Lionel Messi an de an (2004–2026): împărțirea celor 929 de goluri oficiale și recordul mondial de 91 de goluri în 2012.",
      h1: "Golurile lui Lionel Messi pe Ani (2004–2026)",
      lede: "Toate cele 929 de goluri ale lui Lionel Messi împărțite pe ani calendaristici din 2004 până în 2026, inclusiv recordul de 91 de goluri în 2012.",
      chartHead: "Câte goluri marchează Messi în fiecare an?",
      decadesHead: "Goluri pe decenii",
      tableHead: "Golurile lui Messi an de an, din 2004 până în 2026",
      bestYearHead: "Care a fost cel mai bun an din cariera lui Messi?",
      exploreTitle: "Explorează toate statisticile"
    },
    uz: {
      title: "Messining Yillar Bo'yicha Gollari (2004–2026): 929 ta Gol va 91 ta Golli Rekord",
      desc: "Lionel Messining 2004–2026 yillardagi barcha 929 ta rasmiy gollari va 2012 yildagi 91 ta golli Ginnes jahon rekordi.",
      h1: "Lionel Messining Yillar Bo'yicha Gollari (2004–2026)",
      lede: "Lionel Messining 2004 yildan 2026 yilgacha bo'lgan barcha 929 ta goli, jumladan 2012 yildagi 91 ta golli afsonaviy rekord.",
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
      title: "Títulos e Prêmios de Lionel Messi: Recorde de 46 Troféus e 8 Bolas de Ouro",
      desc: "Todos os 46 títulos oficiais de Lionel Messi — recorde mundial absoluto na história do futebol — mais 8 Bolas de Ouro e a Copa do Mundo.",
      h1: "Títulos e Premiações de Lionel Messi",
      lede: "Todos os 46 títulos oficiais de Lionel Messi (recorde mundial), 8 Bolas de Ouro, 6 Chuteiras de Ouro e a Copa do Mundo FIFA 2022.",
      kpiHead: "Resumo de títulos",
      qaHead: "Perguntas rápidas sobre títulos",
      galleryHead: "Galeria de troféus",
      groupHead: "Todos os títulos por clube e seleção",
      faqHead: "Perguntas frequentes",
      exploreTitle: "Explore todas as estatísticas"
    },
    fr: {
      title: "Palmarès et Trophées de Lionel Messi : 46 Titres et 8 Ballons d'Or",
      desc: "Les 46 trophées collectifs officiels de Lionel Messi (record mondial absolu de l'histoire du football), 8 Ballons d'Or et la Coupe du Monde.",
      h1: "Palmarès et Trophées de Lionel Messi",
      lede: "L'intégralité des 46 trophées officiels de Lionel Messi — record absolu du football — plus 8 Ballons d'Or, 6 Souliers d'Or et la Coupe du Monde 2022.",
      kpiHead: "Résumé des titres",
      qaHead: "Questions rapides sur les trophées",
      galleryHead: "Galerie des trophées",
      groupHead: "Tous les titres par club et sélection",
      faqHead: "Foire aux questions",
      exploreTitle: "Explorer toutes les statistiques"
    },
    ar: {
      title: "بطولات وجوائز ليونيل ميسي: رقم قياسي 46 لقباً و8 كرات ذهبية",
      desc: "جميع بطولات وألقاب ليونيل ميسي الـ 46 (الرقم القياسي العالمي في تاريخ كرة القدم)، بالإضافة إلى 8 كرات ذهبية وكأس العالم.",
      h1: "بطولات وإنجازات ليونيل ميسي",
      lede: "جميع الألقاب الرسمية الـ 46 لليونيل ميسي (الرقم القياسي التاريخي)، 8 كرات ذهبية، 6 أحذية ذهبية وكأس العالم قطر 2022.",
      kpiHead: "ملخص البطولات",
      qaHead: "أسئلة سريعة حول الألقاب",
      galleryHead: "معرض الكؤوس والجوائز",
      groupHead: "جميع البطولات مع كل فريق ومنتخب",
      faqHead: "الأسئلة الشائعة",
      exploreTitle: "استكشف جميع الإحصائيات"
    },
    bn: {
      title: "লিওনেল মেসির ট্রফি ও অর্জন: রেকর্ড ৪৬টি খেতাব ও ৮টি ব্যালন ডি'অর",
      desc: "ফুটবল ইতিহাসের সর্বোচ্চ ৪৬টি অফিশিয়াল ট্রফি, রেকর্ড ৮টি ব্যালন ডি'অর এবং ২০২২ বিশ্বকাপ সহ লিওনেল মেসির সকল অর্জনের পূর্ণ বিবরণ।",
      h1: "লিওনেল মেসির ট্রফি ও অর্জনসমূহ",
      lede: "লিওনেল মেসির ক্যারিয়ারের ৪৬টি দলগত খেতাব (ফুটবল ইতিহাসের বিশ্বরেকর্ড), ৮টি ব্যালন ডি'অর, ৬টি গোল্ডেন বুট ও বিশ্বকাপ ২০২২।",
      kpiHead: "ট্রফির সারসংক্ষেপ",
      qaHead: "ট্রফি সম্পর্কিত দ্রুত প্রশ্নোত্তর",
      galleryHead: "ট্রফি গ্যালারি",
      groupHead: "ক্লাব ও দেশ অনুযায়ী সকল ট্রফি",
      faqHead: "সাধারণ জিজ্ঞাসা",
      exploreTitle: "সব পরিসংখ্যান দেখুন"
    },
    hi: {
      title: "लियोनेल मेसी के खिताब और अवॉर्ड: रिकॉर्ड 46 ट्रॉफियां और 8 बैलन डी'ओर",
      desc: "फुटबॉल इतिहास में सबसे ज्यादा 46 खिताब, 8 बैलन डी'ओर और फीफा विश्व कप 2022 सहित लियोनेल मेसी की सभी ट्रॉफियों का पूरा विवरण।",
      h1: "लियोनेल मेसी के खिताब और उपलब्धियां",
      lede: "लियोनेल मेसी की सभी 46 आधिकारिक ट्रॉफियां (विश्व रिकॉर्ड), 8 बैलन डी'ओर, 6 गोल्डन बूट और 2022 फीफा विश्व कप।",
      kpiHead: "खिताबों का सारांश",
      qaHead: "ट्रॉफियों पर त्वरित सवाल",
      galleryHead: "ट्रॉफी गैलरी",
      groupHead: "टीम और देश अनुसार सभी खिताब",
      faqHead: "अक्सर पूछे जाने वाले सवाल",
      exploreTitle: "सभी आंकड़े देखें"
    },
    ro: {
      title: "Trofeele și Premiile lui Lionel Messi: Record de 46 de Titluri și 8 Baloane de Aur",
      desc: "Toate cele 46 de trofee oficiale ale lui Lionel Messi (record mondial absolut în istoria fotbalului), 8 Baloane de Aur și Cupa Mondială.",
      h1: "Palmaresul și Trofeele lui Lionel Messi",
      lede: "Toate cele 46 de titluri de echipă ale lui Lionel Messi — record mondial, plus 8 Baloane de Aur, 6 Ghete de Aur și Cupa Mondială 2022.",
      kpiHead: "Rezumatul trofeelor",
      qaHead: "Întrebări rapide despre trofee",
      galleryHead: "Galeria de trofee",
      groupHead: "Toate titlurile pe cluburi și națională",
      faqHead: "Întrebări frecvente",
      exploreTitle: "Explorează toate statisticile"
    },
    uz: {
      title: "Lionel Messining Sovrinlari va Yutuqlari: 46 ta Titul va 8 ta “Oltin To'p”",
      desc: "Futbol tarixidagi mutlaq rekord bo'lgan 46 ta rasmiy jamoaviy sovrin, 8 ta “Oltin to'p” va 2022 yilgi Jahon chempionati.",
      h1: "Lionel Messining Sovrinlari va Unvonlari",
      lede: "Lionel Messining barcha 46 ta rasmiy sovrini (jahon rekordi), 8 ta “Oltin to'p”, 6 ta “Oltin butsa” va Jahon kubogi 2022.",
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
      lede: "Descubra se Lionel Messi marcou gols no dia do seu aniversário. Messi marcou em 292 dos 366 dias do ano (79,8%) ao longo dos seus 929 gols.",
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
      lede: "Vérifiez si Lionel Messi a marqué lors de votre jour de naissance. Messi a marqué lors de 292 des 366 jours du calendrier (79,8%) sur ses 929 buts.",
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
      lede: "تحقق مما إذا كان ميسي قد سجل أهدافاً في يوم ميلادك. سجل ميسي في 292 يوماً من أصل 366 يوماً في السنة (79.8%) خلال مسيرته بـ 929 هدفاً.",
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
      desc: "মেসি আপনার জন্মদিনে গোল করেছিলেন কিনা তা দেখুন: ৯২৯টি গোলের মধ্য থেকে বছরের ৩৬৬ দিনের প্রতিটি দিনের ভিডিও ও বিবরণ।",
      h1: "মেসি কি আপনার জন্মদিনে গোল করেছিলেন?",
      lede: "আপনার জন্মদিনে লিওনেল মেসি গোল করেছিলেন কিনা তা যাচাই করুন। মেসি তার ৯২৯ গোলের ক্যারিয়ারে বছরের ৩৬৬ দিনের মধ্যে ২৯২ দিনেই গোল করেছেন (৭৯.৮%)।",
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
      desc: "जानिए क्या लियोनेल मेसी ने आपके जन्मदिन पर गोल किया था: 366 दिनों में मेसी के 929 गोलों का वीडियो और मैच डेटा।",
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
      lede: "Verifică dacă Lionel Messi a înscris de ziua ta de naștere. Messi a marcat în 292 din cele 366 de zile ale anului (79,8%) de-a lungul celor 929 de goluri.",
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
<div class="shead"><h2>366 Days Calendar</h2></div>
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
      desc: "Lionel Messi vs Cristiano Ronaldo: 929 gols vs 924+, 46 títulos vs 35, 8 Bolas de Ouro vs 5. Estatísticas completas e os 36 confrontos diretos.",
      h1: "Messi vs Cristiano Ronaldo: A Comparação Definitiva",
      lede: "A comparação estatística definitiva entre Lionel Messi e Cristiano Ronaldo: 929 vs 924 gols, 46 vs 35 títulos e 8 vs 5 Bolas de Ouro.",
      tableTitle: "Os 36 confrontos diretos entre Messi e Ronaldo",
      faqHead: "Perguntas frequentes sobre Messi vs Ronaldo",
      exploreTitle: "Explore todas as estatísticas"
    },
    fr: {
      title: "Messi vs Ronaldo : Buts, Titres et Face-à-Face Historique",
      desc: "Lionel Messi vs Cristiano Ronaldo : 929 buts vs 924+, 46 trophées vs 35, 8 Ballons d'Or vs 5. Statistiques complètes et les 36 confrontations directes.",
      h1: "Messi vs Cristiano Ronaldo : La Comparaison Ultime",
      lede: "Le comparatif statistique absolu entre Lionel Messi et Cristiano Ronaldo : 929 contre 924 buts, 46 contre 35 titres et 8 contre 5 Ballons d'Or.",
      tableTitle: "Les 36 confrontations directes entre Messi et Ronaldo",
      faqHead: "Foire aux questions Messi vs Ronaldo",
      exploreTitle: "Explorer toutes les statistiques"
    },
    ar: {
      title: "ميسي ضد رونالدو: مقارنة الأهداف، البطولات والمواجهات المباشرة",
      desc: "ليونيل ميسي ضد كريستيانو رونالدو: 929 هدفاً مقابل 924+، 46 بطولة مقابل 35، و8 كرات ذهبية مقابل 5. تفاصيل الـ 36 مباراة المباشرة.",
      h1: "ميسي ضد كريستيانو رونالدو: المقارنة التاريخية",
      lede: "المقارنة الإحصائية الشاملة بين ليونيل ميسي وكريستيانو رونالدو: 929 مقابل 924 هدفاً، 46 مقابل 35 لقباً، و8 كرات ذهبية مقابل 5.",
      tableTitle: "المواجهات المباشرة الـ 36 بين ميسي ورونالدو",
      faqHead: "الأسئلة الشائعة حول صراع ميسي ورونالدو",
      exploreTitle: "استكشف جميع الإحصائيات"
    },
    bn: {
      title: "মেসি বনাম রোনালদো: গোল, ট্রফি এবং মুখোমুখি লড়াইয়ের পূর্ণাঙ্গ হিসাব",
      desc: "লিওনেল মেসি বনাম ক্রিশ্চিয়ানো রোনালদো: ৯২৯ গোল বনাম ৯২৪+, ৪৬ ট্রফি বনাম ৩৫, এবং ৮টি ব্যালন ডি'অর বনাম ৫। মুখোমুখি ৩৬টি ম্যাচের রেকর্ড।",
      h1: "মেসি বনাম ক্রিশ্চিয়ানো রোনালদো: সর্বকালের সেরা তুলনা",
      lede: "মেসি ও রোনালদোর ক্যারিয়ারের পুঙ্খানুপুঙ্খ পরিসংখ্যান: ৯২৯ বনাম ৯২৪ গোল, ৪৬ বনাম ৩৫টি শিরোপা এবং ৮ বনাম ৫টি ব্যালন ডি'অর।",
      tableTitle: "মেসি ও রোনালদোর মুখোমুখি ৩৬টি ম্যাচের ফলাফল",
      faqHead: "মেসি বনাম রোনালদো সাধারণ জিজ্ঞাসা",
      exploreTitle: "সব পরিসংখ্যান দেখুন"
    },
    hi: {
      title: "मेसी बनाम रोनाल्डो: गोल, ट्रॉफियां और आमने-सामने के मुकाबले",
      desc: "लियोनेल मेसी बनाम क्रिस्टियानो रोनाल्डो: 929 गोल बनाम 924+, 46 खिताब बनाम 35, और 8 बैलन डी'ओर बनाम 5। दोनों के बीच 36 सीधे मैचों का विवरण।",
      h1: "मेसी बनाम क्रिस्टियानो रोनाल्डो: अंतिम तुलना",
      lede: "लियोनेल मेसी और क्रिस्टियानो रोनाल्डो के आंकड़ों का पूर्ण तुलनात्मक विश्लेषण: 929 बनाम 924 गोल, 46 बनाम 35 ट्रॉफियां और 8 बनाम 5 बैलन डी'ओर।",
      tableTitle: "मेसी और रोनाल्डो के बीच 36 आमने-सामने के मैच",
      faqHead: "अक्सर पूछे जाने वाले सवाल",
      exploreTitle: "सभी आंकड़े देखें"
    },
    ro: {
      title: "Messi vs Ronaldo: Goluri, Trofee și Meciuri Directe",
      desc: "Lionel Messi vs Cristiano Ronaldo: 929 goluri vs 924+, 46 trofee vs 35, 8 Baloane de Aur vs 5. Comparație completă și cele 36 de meciuri directe.",
      h1: "Messi vs Cristiano Ronaldo: Comparația Supremă",
      lede: "Comparația statistică definitivă între Lionel Messi și Cristiano Ronaldo: 929 vs 924 goluri, 46 vs 35 trofee și 8 vs 5 Baloane de Aur.",
      tableTitle: "Cele 36 de meciuri directe între Messi și Ronaldo",
      faqHead: "Întrebări frecvente Messi vs Ronaldo",
      exploreTitle: "Explorează toate statisticile"
    },
    uz: {
      title: "Messi vs Ronaldu: Gollar, Sovrinlar va O'zaro To'qnashuvlar",
      desc: "Lionel Messi va Krishtianu Ronaldu: 929 ta gol vs 924+, 46 ta titul vs 35, 8 ta “Oltin to'p” vs 5. O'zaro 36 ta o'yin natijalari.",
      h1: "Messi vs Krishtianu Ronaldu: Karyeralar Qiyosi",
      lede: "Lionel Messi va Krishtianu Ronaldu o'rtasidagi to'liq statistik taqqoslash: 929 ga 924 ta gol, 46 ga 35 ta sovrin va 8 ga 5 ta “Oltin to'p”.",
      tableTitle: "Messi va Ronaldu o'rtasidagi 36 ta o'zaro to'qnashuv",
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
  <div class="kpi"><span class="kpi-label">Lionel Messi</span><span class="kpi-value">929</span><span class="kpi-note">1,175 games (0.79 g/g)</span></div>
  <div class="kpi"><span class="kpi-label">Cristiano Ronaldo</span><span class="kpi-value">924</span><span class="kpi-note">1,280+ games (0.72 g/g)</span></div>
  <div class="kpi"><span class="kpi-label">Difference</span><span class="kpi-value">+5</span><span class="kpi-note">Messi in 105 fewer games</span></div>
</section>

${renderAdSlot(lang)}

<!-- COMPARISON CARDS -->
<section class="team-grid" aria-label="Career Breakdown">
  <div class="team-card">
    <div class="team-name">🏆 Team Titles</div>
    <div class="team-goals">Messi: 46 <span>vs Ronaldo: 35</span></div>
    <div class="team-meta">Messi holds the all-time world record in football history.</div>
  </div>
  <div class="team-card">
    <div class="team-name">🌕 Ballon d'Or</div>
    <div class="team-goals">Messi: 8 <span>vs Ronaldo: 5</span></div>
    <div class="team-meta">Record 8 Ballons d'Or across three separate decades.</div>
  </div>
  <div class="team-card">
    <div class="team-name">🌍 FIFA World Cup</div>
    <div class="team-goals">Messi: 1 <span>vs Ronaldo: 0</span></div>
    <div class="team-meta">Champion & 2x Golden Ball winner (2014, 2022).</div>
  </div>
</section>

${renderAdSlot(lang)}
<div class="shead"><h2>${dict.tableTitle}</h2></div>
<section class="card" id="h2h-table">
  <table class="data-table">
    <caption>Head-to-head records across 36 official matches</caption>
    <thead>
      <tr><th scope="col" class="left">Metric</th><th scope="col">Lionel Messi</th><th scope="col">Cristiano Ronaldo</th></tr>
    </thead>
    <tbody>
      <tr><th scope="row">Wins</th><td><b>16 wins</b> (44.4%)</td><td>11 wins (30.6%)</td></tr>
      <tr><th scope="row">Draws</th><td colspan="2">9 draws (25.0%)</td></tr>
      <tr><th scope="row">Goals Scored</th><td><b>22 goals</b></td><td>21 goals</td></tr>
      <tr><th scope="row">Assists</th><td><b>12 assists</b></td><td>1 assist</td></tr>
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
      breakdownHead: "Resumo do histórico de Messi contra o Real Madrid",
      momentsHead: "Momentos mágicos de Messi no Bernabéu e Camp Nou",
      faqHead: "Perguntas frequentes sobre Messi vs Real Madrid",
      exploreTitle: "Explore todas as estatísticas"
    },
    fr: {
      title: "Messi vs Real Madrid : 26 Buts, 45 Matchs et Record dans El Clásico",
      desc: "Historique complet de Lionel Messi face au Real Madrid : 26 buts, 14 passes décisives en 45 matchs. Meilleur buteur de l'histoire du Clásico.",
      h1: "Lionel Messi vs Real Madrid : Le Roi du Clásico",
      lede: "L'historique complet du meilleur buteur de l'histoire du Clásico : 26 buts, 14 passes décisives et 16 victoires en 45 confrontations contre le Real Madrid.",
      breakdownHead: "Résumé statistique de Messi face au Real Madrid",
      momentsHead: "Nuits magiques au Bernabéu et au Camp Nou",
      faqHead: "Foire aux questions Messi vs Real Madrid",
      exploreTitle: "Explorer toutes les statistiques"
    },
    ar: {
      title: "ميسي ضد ريال مدريد: 26 هدفاً، 45 مباراة والهداف التاريخي للكلاسيكو",
      desc: "السجل التاريخي الكامل لليونيل ميسي ضد ريال مدريد: 26 هدفاً و14 تمريرة حاسمة في 45 مباراة رسمية. الهداف التاريخي لمباريات الكلاسيكو.",
      h1: "ليونيل ميسي ضد ريال مدريد: ملك الكلاسيكو",
      lede: "السجل التاريخي الكامل للهداف التاريخي لمباريات الكلاسيكو: 26 هدفاً و14 تمريرة حاسمة و16 انتصاراً في 45 مباراة ضد ريال مدريد.",
      breakdownHead: "ملخص أرقام ميسي ضد ريال مدريد",
      momentsHead: "لحظات ميسي الخالدة في البرنابيو والكامب نو",
      faqHead: "الأسئلة الشائعة حول ميسي وريال مدريد",
      exploreTitle: "استكشف جميع الإحصائيات"
    },
    bn: {
      title: "মেসি বনাম রিয়াল মাদ্রিদ: ২৬ গোল, ৪৫ ম্যাচ ও এল ক্লাসিকো রেকর্ড",
      desc: "রিয়াল মাদ্রিদের বিপক্ষে লিওনেল মেসির ক্যারিয়ার রেকর্ড: ৪৫ ম্যাচে ২৬ গোল ও ১৪টি অ্যাসিস্ট। এল ক্লাসিকোর সর্বকালের শীর্ষ গোলদাতা।",
      h1: "লিওনেল মেসি বনাম রিয়াল মাদ্রিদ: এল ক্লাসিকোর রাজা",
      lede: "এল ক্লাসিকোর ইতিহাসের সর্বোচ্চ গোলদাতার পূর্ণাঙ্গ রেকর্ড: ৪৫ ম্যাচে ২৬ গোল, ১৪টি অ্যাসিস্ট এবং ১৬টি ঐতিহাসিক জয়।",
      breakdownHead: "রিয়াল মাদ্রিদের বিরুদ্ধে মেসির সামগ্রিক পরিসংখ্যান",
      momentsHead: "বার্নাব্যু ও ক্যাম্প ন্যু-তে মেসির সেরা মুহূর্ত",
      faqHead: "মেসি বনাম রিয়াল মাদ্রিদ সাধারণ জিজ্ঞাসা",
      exploreTitle: "সব পরিসংখ্যান দেখুন"
    },
    hi: {
      title: "मेसी बनाम रियल मैड्रिड: 26 गोल, 45 मैच और एल क्लासिको का रिकॉर्ड",
      desc: "रियल मैड्रिड के खिलाफ लियोनेल मेसी का ऐतिहासिक रिकॉर्ड: 45 मैचों में 26 गोल और 14 असिस्ट। एल क्लासिको के सर्वकालिक शीर्ष स्कोरर।",
      h1: "लियोनेल मेसी बनाम रियल मैड्रिड: एल क्लासिको के बादशाह",
      lede: "एल क्लासिको इतिहास के सबसे बड़े स्कोरर का पूरा रिकॉर्ड: रियल मैड्रिड के खिलाफ 45 मैचों में 26 गोल, 14 असिस्ट और 16 जीत।",
      breakdownHead: "रियल मैड्रिड के खिलाफ मेसी के आंकड़ों का सारांश",
      momentsHead: "बर्नाबेउ और कैंप नोउ में मेसी के जादुई पल",
      faqHead: "अक्सर पूछे जाने वाले सवाल",
      exploreTitle: "सभी आंकड़े देखें"
    },
    ro: {
      title: "Messi vs Real Madrid: 26 de Goluri, 45 de Meciuri și Record în El Clásico",
      desc: "Istoricul complet al lui Lionel Messi împotriva lui Real Madrid: 26 de goluri și 14 pase de gol în 45 de meciuri oficiale. Golgheterul El Clásico.",
      h1: "Lionel Messi vs Real Madrid: Regele din El Clásico",
      lede: "Istoricul complet al celui mai prolific marcator din istoria El Clásico: 26 de goluri, 14 assist-uri și 16 victorii în 45 de partide contra lui Real Madrid.",
      breakdownHead: "Rezumatul statistic al lui Messi contra lui Real Madrid",
      momentsHead: "Nopți magice pe Bernabéu și Camp Nou",
      faqHead: "Întrebări frecvente Messi vs Real Madrid",
      exploreTitle: "Explorează toate statisticile"
    },
    uz: {
      title: "Messi vs Real Madrid: 26 ta Gol, 45 ta O'yin va El-Klasiko Rekordi",
      desc: "Lionel Messining “Real Madrid”ga qarshi to'liq statistikasi: 45 ta o'yinda 26 ta gol va 14 ta assist. El-Klasiko tarixidagi eng yaxshi to'purar.",
      h1: "Lionel Messi vs Real Madrid: El-Klasiko Qiroli",
      lede: "El-Klasiko tarixidagi eng yaxshi to'purarning to'liq ko'rsatkichi: “Real Madrid”ga qarshi 45 ta o'yinda 26 ta gol, 14 ta golli uzatma va 16 ta g'alaba.",
      breakdownHead: "Messining “Real Madrid”ga qarshi statistikasi xulosasi",
      momentsHead: "Bernabeu va Kamp Noudagi afsonaviy lahzalar",
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
  <div class="kpi"><span class="kpi-label">Appearances</span><span class="kpi-value">45</span><span class="kpi-note">All official matches</span></div>
  <div class="kpi"><span class="kpi-label">Goals</span><span class="kpi-value">26</span><span class="kpi-note">All-time #1 El Clásico</span></div>
  <div class="kpi"><span class="kpi-label">Assists</span><span class="kpi-value">14</span><span class="kpi-note">All-time #1 El Clásico</span></div>
  <div class="kpi"><span class="kpi-label">Victories</span><span class="kpi-value">19</span><span class="kpi-note">Wins across all comps</span></div>
</section>

${renderAdSlot(lang)}

<div class="shead"><h2>${dict.breakdownHead}</h2></div>
<section class="card">
  <table class="data-table">
    <caption>Messi records against Real Madrid by competition</caption>
    <thead>
      <tr><th scope="col" class="left">Competition</th><th scope="col">Apps</th><th scope="col">Goals</th><th scope="col">Assists</th></tr>
    </thead>
    <tbody>
      <tr><th scope="row">La Liga</th><td>29</td><td><b>18</b></td><td>9</td></tr>
      <tr><th scope="row">Supercopa de España</th><td>6</td><td><b>6</b></td><td>2</td></tr>
      <tr><th scope="row">UEFA Champions League</th><td>4</td><td><b>2</b></td><td>0</td></tr>
      <tr><th scope="row">Copa del Rey</th><td>6</td><td><b>0</b></td><td>3</td></tr>
      <tr class="total"><th scope="row">All Competitions Total</th><td>45</td><td><b>26</b></td><td>14</td></tr>
    </tbody>
  </table>
</section>

${renderAdSlot(lang)}

<div class="shead"><h2>${dict.momentsHead}</h2></div>
<section class="team-grid">
  <div class="team-card">
    <div class="team-name">Hat-trick at Age 19 (2007)</div>
    <div class="team-goals">Camp Nou · 3-3</div>
    <div class="team-meta">First senior career hat-trick, equalizing 3 times against Real Madrid.</div>
  </div>
  <div class="team-card">
    <div class="team-name">The Historic 2-6 (2009)</div>
    <div class="team-goals">Santiago Bernabéu · 2 goals</div>
    <div class="team-meta">Guardiola invents the False 9 role for Leo Messi in Madrid.</div>
  </div>
  <div class="team-card">
    <div class="team-name">UCL Solo Wonder Goal (2011)</div>
    <div class="team-goals">Santiago Bernabéu · 0-2</div>
    <div class="team-meta">Iconic slalom past 4 Madrid defenders in the Champions League semifinal.</div>
  </div>
  <div class="team-card">
    <div class="team-name">The 500th Goal Shirt Celebration (2017)</div>
    <div class="team-goals">Santiago Bernabéu · 2-3</div>
    <div class="team-meta">92nd-minute match winner followed by hoisting his #10 shirt to the Bernabéu.</div>
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
// EXECUTION
// -------------------------------------------------------------
const generators = {
  "dashboard.html": generateDashboard,
  "goalsbyseason.html": generateGoalsBySeason,
  "goalsbyyear.html": generateGoalsByYear,
  "timeline.html": generateTimeline,
  "achievements.html": generateAchievements,
  "birthday.html": generateBirthday,
  "messi-vs-ronaldo.html": generateMessiVsRonaldo,
  "vs-real-madrid.html": generateVsRealMadrid,
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

console.log(`Successfully generated ${createdCount} localized subpages across ${targetLangs.length} languages!`);
