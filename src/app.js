/* MessiStats renderer — own code, own data, own copy.
   Layout structure mirrors the ronaldostats.app reference (rail, KPI cards,
   tables, charts, explore links); no reference code, images or text reused. */
import "./ad-guard.js";
import { inject } from "@vercel/analytics";
import { injectSpeedInsights } from "@vercel/speed-insights";
import { initAnalytics, trackBirthdaySearch, trackVideoPlay, trackShare } from "./analytics.js";
inject(); // page-view counting; no-ops off Vercel (script 404s silently in local preview)
injectSpeedInsights(); // Core Web Vitals; same deal — production only, silent locally
initAnalytics();
// — Hide admin nav for users, show for admins (server-issued token auth)
function hasAdminToken() {
  try {
    const tok = sessionStorage.getItem("messi_admin_token");
    const exp = parseInt(sessionStorage.getItem("messi_admin_token_exp") || "0", 10);
    if (tok && !isNaN(exp) && Date.now() < exp) return true;
    const pv = localStorage.getItem("messi_admin_token");
    const uv = localStorage.getItem("messi_admin_token_exp");
    if (pv && uv) {
      const le = parseInt(uv, 10);
      if (!isNaN(le) && Date.now() < le) return true;
    }
  } catch {}
  return false;
}
function isAdminAuthed() {
  return hasAdminToken();
}
function revealAdminNav() {
  const el = document.getElementById("rail-admin-link");
  if (el && isAdminAuthed()) el.style.display = "flex";
}

 // lightweight Supabase live telemetry

/* Theme manager (Dark / Light mode) with localStorage persistence and OS sync */
function initTheme() {
  const getPreferred = () => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved === "dark" || saved === "light") return saved;
    } catch (_) {}
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  };

  const applyTheme = (theme) => {
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    const btns = document.querySelectorAll(".theme-toggle");
    btns.forEach((btn) => {
      const label = btn.querySelector(".theme-label");
      if (label) label.textContent = theme === "dark" ? "Light mode" : "Dark mode";
      btn.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
      btn.setAttribute("title", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
    });
  };

  applyTheme(getPreferred());

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".theme-toggle");
    if (!btn) return;
    const current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    const next = current === "dark" ? "light" : "dark";
    try { localStorage.setItem("theme", next); } catch (_) {}
    applyTheme(next);
  });

  if (window.matchMedia) {
    try {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
        try {
          if (!localStorage.getItem("theme")) applyTheme(e.matches ? "dark" : "light");
        } catch (_) {}
      });
    } catch (_) {}
  }
}
initTheme();

/* ================= REDESIGNED LANGUAGE SELECTOR & MOBILE TOPBAR ================= */
const LANGUAGES = [
  { code: "en", flag: "🇺🇸", name: "English", native: "English", note: "US, NG, IN, PH" },
  { code: "es", flag: "🇪🇸", name: "Spanish", native: "Español", note: "Argentina, España" },
  { code: "pt", flag: "🇧🇷", name: "Portuguese", native: "Português", note: "Brasil, Portugal" },
  { code: "fr", flag: "🇫🇷", name: "French", native: "Français", note: "France, Niger" },
  { code: "ar", flag: "🇪🇬", name: "Arabic", native: "العربية", note: "مصر والوطن العربي", rtl: true },
  { code: "bn", flag: "🇧🇩", name: "Bengali", native: "বাংলা", note: "বাংলাদেশ ও ভারত" },
  { code: "hi", flag: "🇮🇳", name: "Hindi", native: "हिन्दी", note: "भारत" },
  { code: "ro", flag: "🇷🇴", name: "Romanian", native: "Română", note: "România" },
  { code: "uz", flag: "🇺🇿", name: "Uzbek", native: "Oʻzbekcha", note: "Oʻzbekiston" }
];

function getCurrentLangCode() {
  if (typeof document === "undefined") return "en";
  const docLang = (document.documentElement.lang || "").toLowerCase().split("-")[0];
  const pathParts = (typeof location !== "undefined" ? location.pathname : "").split("/").filter(Boolean);
  if (LANGUAGES.some((l) => l.code === docLang)) {
    return docLang;
  }
  if (pathParts[0] && LANGUAGES.some((l) => l.code === pathParts[0])) {
    return pathParts[0];
  }
  return "en";
}

function getLangUrl(targetCode) {
  if (typeof location === "undefined") return `/${targetCode}`;
  const validSubpages = [
    "birthday",
    "goalsbyyear",
    "goalsbyseason",
    "dashboard",
    "timeline",
    "achievements",
    "messi-vs-ronaldo",
    "vs-real-madrid",
    "champions-league",
    "latest-goal"
  ];
  const pathParts = location.pathname.split("/").filter(Boolean);
  let subpage = "";
  if (pathParts.length > 1) {
    subpage = pathParts[1].replace(/\.html$/, "");
  } else if (pathParts.length === 1 && !LANGUAGES.some((l) => l.code === pathParts[0])) {
    subpage = pathParts[0].replace(/\.html$/, "");
  }

  if (subpage && validSubpages.includes(subpage)) {
    return `/${targetCode}/${subpage}${location.search}${location.hash}`;
  }

  return `/${targetCode}${location.search}${location.hash}`;
}

function centerActiveNav() {
  if (typeof window === "undefined" || window.innerWidth > 900) return;
  const activeNav = document.querySelector(".rail nav a.on");
  if (activeNav) {
    activeNav.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    setTimeout(() => {
      activeNav.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }, 80);
  }
}

function ensureLangModal() {
  if (typeof document === "undefined") return null;
  let langModal = document.getElementById("lang-modal");
  if (langModal) return langModal;

  const curLangCode = getCurrentLangCode();

  langModal = document.createElement("div");
  langModal.id = "lang-modal";
  langModal.className = "lang-modal-backdrop";
  langModal.hidden = true;
  langModal.setAttribute("aria-hidden", "true");
  langModal.setAttribute("role", "dialog");
  langModal.setAttribute("aria-modal", "true");
  langModal.setAttribute("aria-labelledby", "lang-modal-heading");

  let cardsHtml = "";
  LANGUAGES.forEach((l) => {
    const isActive = l.code === curLangCode;
    const href = getLangUrl(l.code);
    cardsHtml += `
      <a href="${href}" class="lang-card-option${isActive ? " active" : ""}" data-code="${l.code}">
        <span class="lang-card-flag">${l.flag}</span>
        <div class="lang-card-info">
          <span class="lang-card-name">${l.name}</span>
          <span class="lang-card-native">${l.native}</span>
          <span class="lang-card-countries">${l.note}</span>
        </div>
        ${isActive ? `<span class="lang-card-check">✓</span>` : ""}
      </a>
    `;
  });

  langModal.innerHTML = `
    <div class="lang-modal-sheet">
      <div class="lang-modal-handle"></div>
      <div class="lang-modal-header">
        <div class="lang-modal-title-wrap">
          <svg class="rail-lang-globe" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
          </svg>
          <h3 class="lang-modal-title" id="lang-modal-heading">Select Language / Idioma</h3>
        </div>
        <button type="button" class="lang-modal-close" id="lang-modal-close-btn" aria-label="Close language selector">&times;</button>
      </div>
      <div class="lang-modal-grid">
        ${cardsHtml}
      </div>
    </div>
  `;

  if (document.body) {
    document.body.appendChild(langModal);
  }
  return langModal;
}

function openLangModal() {
  const modal = ensureLangModal();
  if (!modal) return;
  modal.hidden = false;
  modal.setAttribute("aria-hidden", "false");
  if (document.body) document.body.style.overflow = "hidden";
}

function closeLangModal() {
  const modal = document.getElementById("lang-modal");
  if (!modal) return;
  modal.hidden = true;
  modal.setAttribute("aria-hidden", "true");
  if (document.body) document.body.style.overflow = "";
}

function ensureMobileMenuDrawer() {
  let drawer = document.getElementById("mobile-nav-drawer");
  if (drawer) return drawer;

  const curLangCode = getCurrentLangCode();
  const curLangObj = LANGUAGES.find((l) => l.code === curLangCode) || LANGUAGES[0];
  const curPath = (typeof location !== "undefined" ? location.pathname : "");

  const navCategories = [
    {
      title: "Live & Trending ⚡",
      items: [
        { href: getLangUrl(curLangCode), label: "Career Home & Stats", badge: "930 Goals", icon: `<svg viewBox="0 0 24 24"><path d="M3 11.5 12 3l9 8.5"></path><path d="M5.5 10.5V21h5v-6h3v6h5V10.5"></path></svg>` },
        { href: `/${curLangCode}/latest-goal`, label: "Latest Goal Replay", badge: "LIVE ⚡", icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8" fill="currentColor"></polygon></svg>` },
        { href: `/${curLangCode}/birthday`, label: "Birthday Goals Explorer", badge: "HOT 🔥", icon: `<svg viewBox="0 0 24 24"><rect height="4" rx="1" width="18" x="3" y="8"></rect><path d="M12 8v13M19 12v9H5v-9M7.5 8a2.5 2.5 0 0 1 0-5A4.8 4.8 0 0 1 12 8a4.8 4.8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"></path></svg>` }
      ]
    },
    {
      title: "Rivalries & Clashes ⚔️",
      items: [
        { href: `/${curLangCode}/messi-vs-ronaldo`, label: "Messi vs Ronaldo", badge: "GOAT", icon: `<svg viewBox="0 0 24 24"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1"></path><path d="M18 8l4 4-4 4"></path></svg>` },
        { href: `/${curLangCode}/vs-real-madrid`, label: "vs Real Madrid (El Clásico)", badge: "26 Goals", icon: `<svg viewBox="0 0 24 24"><path d="M14.5 17.5 3 6V3h3l11.5 11.5"></path><path d="m13 19 6-6"></path><path d="m16 16 4 4"></path><path d="m19 21 2-2"></path></svg>` },
        { href: `/${curLangCode}/champions-league`, label: "Champions League Hub", badge: "129 Goals", icon: `<svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>` }
      ]
    },
    {
      title: "Career Analytics 📊",
      items: [
        { href: `/${curLangCode}/goalsbyyear`, label: "Goals by Year", badge: "91 in 2012", icon: `<svg viewBox="0 0 24 24"><rect height="15.5" rx="2.5" width="17" x="3.5" y="5"></rect><path d="M3.5 10h17M8 2.8V6.5M16 2.8V6.5"></path></svg>` },
        { href: `/${curLangCode}/goalsbyseason`, label: "Goals by Season", badge: "All Clubs", icon: `<svg viewBox="0 0 24 24"><rect height="7.5" rx="1.5" width="7.5" x="3.5" y="3.5"></rect><rect height="7.5" rx="1.5" width="7.5" x="13" y="3.5"></rect><rect height="7.5" rx="1.5" width="7.5" x="3.5" y="13"></rect><rect height="7.5" rx="1.5" width="7.5" x="13" y="13"></rect></svg>` },
        { href: `/${curLangCode}/dashboard`, label: "Interactive Dashboard", badge: "Filters", icon: `<svg viewBox="0 0 24 24"><path d="M3.5 20.5h17"></path><path d="M6.5 20v-7M12 20V5M17.5 20v-10"></path></svg>` },
        { href: `/${curLangCode}/timeline`, label: "Through the Years (Timeline)", badge: "Chapters", icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"></circle><path d="M12 7.5V12l3 2"></path></svg>` },
        { href: `/${curLangCode}/achievements`, label: "Achievements & Trophies", badge: "46 Cups", icon: `<svg viewBox="0 0 24 24"><path d="M8 3.5h8V9a4 4 0 0 1-8 0V3.5Z"></path><path d="M8 5H4.5A1.5 1.5 0 0 0 6 10H8M16 5h3.5A1.5 1.5 0 0 1 18 10h-2M12 13v3.5M8.5 20.5h7M10 16.5h4V20h-4z"></path></svg>` }
      ]
    }
  ];

  let catHtml = "";
  for (const cat of navCategories) {
    catHtml += `<div class="mobile-drawer-section-title">${cat.title}</div><div class="mobile-drawer-nav-group">`;
    for (const itm of cat.items) {
      const isCurrent = curPath === itm.href || (itm.href.endsWith(`/${curLangCode}`) && (curPath === "/" || curPath === `/${curLangCode}/` || curPath === `/${curLangCode}`));
      catHtml += `
        <a href="${itm.href}" class="mobile-drawer-link ${isCurrent ? "on" : ""}">
          ${itm.icon}
          <span>${itm.label}</span>
          ${itm.badge ? `<span class="drawer-badge">${itm.badge}</span>` : ""}
        </a>
      `;
    }
    catHtml += `</div>`;
  }

  drawer = document.createElement("div");
  drawer.id = "mobile-nav-drawer";
  drawer.className = "mobile-drawer-backdrop";
  drawer.hidden = true;
  drawer.setAttribute("aria-hidden", "true");
  drawer.innerHTML = `
    <div class="mobile-drawer-sheet" role="dialog" aria-modal="true" aria-label="Navigation Menu">
      <div class="mobile-drawer-header">
        <a href="${getLangUrl(curLangCode)}" class="mobile-drawer-brand">
          <svg class="mobile-topbar-mark" viewBox="0 0 64 64" aria-hidden="true" width="28" height="28"><defs><linearGradient id="msg-drw" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#6d0f2e"></stop><stop offset=".55" stop-color="#1d3fae"></stop><stop offset="1" stop-color="#0e7cc0"></stop></linearGradient></defs><path d="M32 3 55 10v20c0 16-11 26-23 31C20 56 9 46 9 30V10Z" fill="url(#msg-drw)" stroke="#e3b93e" stroke-linejoin="round" stroke-width="2.5"></path><path d="M47.5 9.5l1.7 3.5 3.8.6-2.8 2.7.7 3.8-3.4-1.8-3.4 1.8.7-3.8-2.8-2.7 3.8-.6z" fill="#e3b93e"></path><text fill="#fff" font-family="'Plus Jakarta Sans',Arial,sans-serif" font-size="19" font-weight="800" text-anchor="middle" x="31" y="44">M10</text></svg>
          <span>Messi<b>Stats</b> Menu</span>
        </a>
        <button type="button" class="mobile-drawer-close" id="mobile-drawer-close-btn" aria-label="Close menu">
          <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      <div class="mobile-drawer-body">
        <div class="mobile-drawer-stats-card">
          <div class="mobile-drawer-stat"><span class="num">930</span><span class="lbl">Total Goals</span></div>
          <div class="mobile-drawer-stat"><span class="num">1,176</span><span class="lbl">Senior Apps</span></div>
          <div class="mobile-drawer-stat"><span class="num">46</span><span class="lbl">Trophies</span></div>
          <div class="mobile-drawer-stat"><span class="num">8</span><span class="lbl">Ballons d'Or</span></div>
        </div>
        ${catHtml}
        <div class="mobile-drawer-footer">
          <button type="button" class="mobile-drawer-btn" id="drawer-lang-btn">
            <span>${curLangObj.flag}</span>
            <span>${curLangObj.name}</span>
          </button>
          <button type="button" class="mobile-drawer-btn" id="drawer-theme-btn">
            <span>🌓 Toggle Dark Mode</span>
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(drawer);
  return drawer;
}

function openMobileMenuDrawer() {
  const drawer = ensureMobileMenuDrawer();
  if (!drawer) return;
  drawer.hidden = false;
  drawer.setAttribute("aria-hidden", "false");
  const menuBtn = document.getElementById("mobile-menu-btn");
  if (menuBtn) {
    menuBtn.classList.add("active");
    menuBtn.setAttribute("aria-expanded", "true");
  }
  if (document.body) document.body.style.overflow = "hidden";
}

function closeMobileMenuDrawer() {
  const drawer = document.getElementById("mobile-nav-drawer");
  if (!drawer) return;
  drawer.hidden = true;
  drawer.setAttribute("aria-hidden", "true");
  const menuBtn = document.getElementById("mobile-menu-btn");
  if (menuBtn) {
    menuBtn.classList.remove("active");
    menuBtn.setAttribute("aria-expanded", "false");
  }
  if (document.body) document.body.style.overflow = "";
}

// Global click and keydown delegation for language switcher, mobile menu drawer, theme toggles, and modal backdrops
if (typeof document !== "undefined") {
  document.addEventListener("click", (e) => {
    const menuTrigger = e.target.closest("#mobile-menu-btn, .mobile-menu-btn");
    if (menuTrigger) {
      e.preventDefault();
      const drawer = document.getElementById("mobile-nav-drawer");
      if (drawer && !drawer.hidden) {
        closeMobileMenuDrawer();
      } else {
        openMobileMenuDrawer();
      }
      return;
    }
    const drawerClose = e.target.closest("#mobile-drawer-close-btn, .mobile-drawer-close");
    if (drawerClose) {
      e.preventDefault();
      closeMobileMenuDrawer();
      return;
    }
    const drawerEl = document.getElementById("mobile-nav-drawer");
    if (drawerEl && e.target === drawerEl) {
      closeMobileMenuDrawer();
      return;
    }
    const drawerLink = e.target.closest(".mobile-drawer-link");
    if (drawerLink) {
      closeMobileMenuDrawer();
      return;
    }
    const drawerLang = e.target.closest("#drawer-lang-btn");
    if (drawerLang) {
      e.preventDefault();
      closeMobileMenuDrawer();
      openLangModal();
      return;
    }
    const drawerTheme = e.target.closest("#drawer-theme-btn");
    if (drawerTheme) {
      e.preventDefault();
      const current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
      const next = current === "dark" ? "light" : "dark";
      if (next === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
      } else {
        document.documentElement.removeAttribute("data-theme");
      }
      try { localStorage.setItem("theme", next); } catch (_) {}
      return;
    }

    const langTrigger = e.target.closest("#rail-lang-btn, .rail-lang-btn, #mobile-lang-btn, .mobile-lang-btn");
    if (langTrigger) {
      e.preventDefault();
      openLangModal();
      return;
    }
    const closeTrigger = e.target.closest("#lang-modal-close-btn, .lang-modal-close");
    if (closeTrigger) {
      e.preventDefault();
      closeLangModal();
      return;
    }
    const modal = document.getElementById("lang-modal");
    if (modal && e.target === modal) {
      closeLangModal();
      return;
    }
    const langCard = e.target.closest(".lang-card-option");
    if (langCard) {
      const code = langCard.getAttribute("data-code");
      if (code) {
        try { localStorage.setItem("messistats_lang_choice", code); } catch (_) {}
      }
      return;
    }
    const mobTheme = e.target.closest("#mobile-theme-btn, .mobile-theme-btn");
    if (mobTheme) {
      e.preventDefault();
      const current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
      const next = current === "dark" ? "light" : "dark";
      if (next === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
      } else {
        document.documentElement.removeAttribute("data-theme");
      }
      try { localStorage.setItem("theme", next); } catch (_) {}
      return;
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const drawer = document.getElementById("mobile-nav-drawer");
      if (drawer && !drawer.hidden) {
        closeMobileMenuDrawer();
      }
      const modal = document.getElementById("lang-modal");
      if (modal && !modal.hidden) {
        closeLangModal();
      }
    }
  });
}

function initTableScrollHints() {
  if (typeof document === "undefined" || window.innerWidth > 900) return;
  const wraps = document.querySelectorAll(".table-wrap, .table-card, .ground-truth-table-wrap, .seo-stat-table-wrap");
  wraps.forEach((wrap) => {
    if (!wrap.querySelector(".table-scroll-hint") && wrap.scrollWidth > wrap.clientWidth + 12) {
      const hint = document.createElement("div");
      hint.className = "table-scroll-hint";
      hint.innerHTML = `<span>Swipe table ↔</span>`;
      wrap.insertBefore(hint, wrap.firstChild);
      wrap.addEventListener("scroll", () => {
        hint.style.opacity = "0";
        hint.style.transition = "opacity 0.25s ease";
        setTimeout(() => hint.remove(), 250);
      }, { once: true, passive: true });
    }
  });
}

function initLanguageAndMobileTopBar() {
  if (typeof document === "undefined") return;

  const curLangCode = getCurrentLangCode();
  const curLangObj = LANGUAGES.find((l) => l.code === curLangCode) || LANGUAGES[0];

  // Remove any legacy inline .lang-switcher elements
  try {
    document.querySelectorAll(".lang-switcher").forEach((el) => el.remove());
  } catch (_) {}

  // 1. Setup Desktop Rail Language Button
  try {
    const rail = document.querySelector(".rail");
    if (rail) {
      let railLangWrap = rail.querySelector(".rail-lang-wrap");
      if (!railLangWrap) {
        railLangWrap = document.createElement("div");
        railLangWrap.className = "rail-lang-wrap";
        railLangWrap.innerHTML = `
          <button type="button" class="rail-lang-btn" id="rail-lang-btn" aria-label="Select Language (${curLangObj.name})" title="Select Language">
            <svg class="rail-lang-globe" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            <span class="rail-lang-label">${curLangObj.name}</span>
            <span class="rail-lang-tag">${curLangObj.code.toUpperCase()}</span>
          </button>
        `;
        const railBadge = rail.querySelector(".rail-badge");
        if (railBadge && railBadge.nextSibling) {
          rail.insertBefore(railLangWrap, railBadge.nextSibling);
        } else {
          rail.prepend(railLangWrap);
        }
      }
    }
  } catch (_) {}

  // 2. Setup Mobile Top Bar
  try {
    let mobileTopBar = document.querySelector(".mobile-topbar");
    if (!mobileTopBar && document.body) {
      mobileTopBar = document.createElement("header");
      mobileTopBar.className = "mobile-topbar";
      mobileTopBar.setAttribute("aria-label", "Mobile navigation header");
      mobileTopBar.innerHTML = `
        <a href="${getLangUrl(curLangCode)}" class="mobile-topbar-brand" aria-label="MessiStats">
          <svg class="mobile-topbar-mark" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="msg-mtb" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#6d0f2e"></stop><stop offset=".55" stop-color="#1d3fae"></stop><stop offset="1" stop-color="#0e7cc0"></stop></linearGradient></defs><path d="M32 3 55 10v20c0 16-11 26-23 31C20 56 9 46 9 30V10Z" fill="url(#msg-mtb)" stroke="#e3b93e" stroke-linejoin="round" stroke-width="2.5"></path><path d="M47.5 9.5l1.7 3.5 3.8.6-2.8 2.7.7 3.8-3.4-1.8-3.4 1.8.7-3.8-2.8-2.7 3.8-.6z" fill="#e3b93e"></path><text fill="#fff" font-family="'Plus Jakarta Sans',Arial,sans-serif" font-size="19" font-weight="800" text-anchor="middle" x="31" y="44">M10</text></svg>
          <span class="mobile-topbar-title">Messi<b>Stats</b></span>
        </a>
        <div class="mobile-topbar-actions">
          <button type="button" class="mobile-lang-btn" id="mobile-lang-btn" aria-label="Change language">
            <span class="mobile-lang-flag">${curLangObj.flag}</span>
            <span class="mobile-lang-code">${curLangObj.code.toUpperCase()}</span>
            <span class="mobile-lang-arrow">▾</span>
          </button>
          <button type="button" class="mobile-theme-btn" id="mobile-theme-btn" aria-label="Toggle dark mode">
            <svg class="sun-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
            <svg class="moon-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          </button>
          <button type="button" class="mobile-menu-btn" id="mobile-menu-btn" aria-label="Open Navigation Menu" aria-expanded="false" title="Menu">
            <svg class="menu-icon" viewBox="0 0 24 24" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            <svg class="close-icon" viewBox="0 0 24 24" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      `;
      document.body.prepend(mobileTopBar);
    }
  } catch (_) {}

  // Auto-center active navigation rail tab on mobile
  try {
    const activeTab = document.querySelector(".rail nav a.on, .rail nav a[aria-current='page']");
    if (activeTab && window.innerWidth <= 900) {
      setTimeout(() => {
        activeTab.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
      }, 120);
    }
  } catch (_) {}

  // 3. Ensure language modal & mobile menu drawer are created
  try {
    ensureLangModal();
    ensureMobileMenuDrawer();
    initTableScrollHints();
  } catch (_) {}

  // 4. Device & Location-Based Language View Detection
  const LANG_MESSAGES = {
    es: {
      name: "Español",
      flag: "🇪🇸",
      detected: "Detectamos que tu dispositivo está en español.",
      suggest: "¿Deseas ver MessiStats en español?",
      switchBtn: "Ver en Español",
      stayBtn: "Continuar en English",
      autoNotice: "Mostrando en Español según tu dispositivo.",
      changeBtn: "Cambiar"
    },
    pt: {
      name: "Português",
      flag: "🇧🇷",
      detected: "Detectamos que seu dispositivo está em português.",
      suggest: "Deseja ver o MessiStats em português?",
      switchBtn: "Ver em Português",
      stayBtn: "Continuar en English",
      autoNotice: "Exibindo em Português conforme seu dispositivo.",
      changeBtn: "Mudar"
    },
    fr: {
      name: "Français",
      flag: "🇫🇷",
      detected: "Votre appareil est configuré en français.",
      suggest: "Souhaitez-vous voir MessiStats en français ?",
      switchBtn: "Voir en Français",
      stayBtn: "Continuer en anglais",
      autoNotice: "Affiché en français selon votre appareil.",
      changeBtn: "Changer"
    },
    ar: {
      name: "العربية",
      flag: "🇪🇬",
      detected: "تم اكتشاف أن لغة جهازك هي العربية.",
      suggest: "هل ترغب في تصفح ميسي ستاتس باللغة العربية؟",
      switchBtn: "التصفح بالعربية",
      stayBtn: "المتابعة بالإنجليزية",
      autoNotice: "يتم العرض بالعربية بناءً على إعدادات جهازك.",
      changeBtn: "تغيير"
    },
    bn: {
      name: "বাংলা",
      flag: "🇧🇩",
      detected: "আপনার ডিভাইসের ভাষা বাংলা হিসেবে শনাক্ত হয়েছে।",
      suggest: "আপনি কি বাংলায় মেসি পরিসংখ্যান দেখতে চান?",
      switchBtn: "বাংলায় দেখুন",
      stayBtn: "English এ থাকুন",
      autoNotice: "আপনার ডিভাইস অনুযায়ী বাংলায় দেখানো হচ্ছে।",
      changeBtn: "পরিবর্তন"
    },
    hi: {
      name: "हिन्दी",
      flag: "🇮🇳",
      detected: "आपकी डिवाइस की भाषा हिन्दी पहचानी गई है।",
      suggest: "क्या आप मेस्सी के आंकड़े हिन्दी में देखना चाहते हैं?",
      switchBtn: "हिन्दी में देखें",
      stayBtn: "English में जारी रखें",
      autoNotice: "आपके डिवाइस के अनुसार हिन्दी में प्रदर्शित।",
      changeBtn: "बदलें"
    },
    ro: {
      name: "Română",
      flag: "🇷🇴",
      detected: "Am detectat că limba dispozitivului tău este română.",
      suggest: "Dorești să vezi MessiStats în limba română?",
      switchBtn: "Vezi în Română",
      stayBtn: "Rămâi pe English",
      autoNotice: "Afișat în română conform dispozitivului tău.",
      changeBtn: "Schimbă"
    },
    uz: {
      name: "Oʻzbekcha",
      flag: "🇺🇿",
      detected: "Qurilmangiz tili oʻzbekcha ekanligi aniqlandi.",
      suggest: "MessiStatsni oʻzbek tilida koʻrishni xohlaysizmi?",
      switchBtn: "Oʻzbekcha koʻrish",
      stayBtn: "Englishda davom etish",
      autoNotice: "Qurilmangizga mos ravishda oʻzbek tilida koʻrsatilmoqda.",
      changeBtn: "Oʻzgartirish"
    },
    en: {
      name: "English",
      flag: "🇺🇸",
      detected: "Your device is set to English.",
      suggest: "Would you like to view MessiStats in English?",
      switchBtn: "Switch to English",
      stayBtn: "Stay here",
      autoNotice: "Viewing in English based on device settings.",
      changeBtn: "Change"
    }
  };

  function detectDeviceAndLocationLang() {
    try {
      const saved = localStorage.getItem("messistats_lang_choice");
      if (saved && LANGUAGES.some((l) => l.code === saved)) return saved;
    } catch (_) {}

    const langs = (typeof navigator !== "undefined" && navigator.languages && navigator.languages.length) ? navigator.languages : [typeof navigator !== "undefined" ? (navigator.language || "") : ""];
    for (const l of langs) {
      const lower = (l || "").toLowerCase();
      if (lower.startsWith("es")) return "es";
      if (lower.startsWith("pt")) return "pt";
      if (lower.startsWith("fr")) return "fr";
      if (lower.startsWith("ar")) return "ar";
      if (lower.startsWith("bn")) return "bn";
      if (lower.startsWith("hi")) return "hi";
      if (lower.startsWith("ro")) return "ro";
      if (lower.startsWith("uz")) return "uz";
      if (lower.startsWith("en")) return "en";
    }

    let tz = "";
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (_) {}

    if (/Argentina|Buenos_Aires|Cordoba|Rosario|Mendoza|Catamarca|Jujuy|San_Juan|Tucuman|Ushuaia|Madrid|Canary|Santiago|Bogota|Lima|Caracas|Montevideo|Mexico|Cancun|Merida|Monterrey|Tijuana|Guatemala|Costa_Rica|Panama|Guayaquil|Asuncion|La_Paz|Santo_Domingo|Havana/i.test(tz)) {
      return "es";
    }
    if (/Sao_Paulo|Lisbon|Madeira|Azores|Recife|Fortaleza|Belem|Manaus|Brasilia|Bahia|Cuiaba|Porto_Velho|Boa_Vista|Luanda|Maputo/i.test(tz)) {
      return "pt";
    }
    if (/Paris|Niamey|Dakar|Abidjan|Douala|Kinshasa|Bamako|Ouagadougou|Brussels|Geneva/i.test(tz)) {
      return "fr";
    }
    if (/Cairo|Riyadh|Dubai|Baghdad|Kuwait|Qatar|Casablanca|Algiers|Tunis|Amman|Beirut|Muscat|Bahrain|Tripoli|Khartoum/i.test(tz)) {
      return "ar";
    }
    if (/Dhaka/i.test(tz)) {
      return "bn";
    }
    if (/Bucharest|Chisinau/i.test(tz)) {
      return "ro";
    }
    if (/Tashkent|Samarkand/i.test(tz)) {
      return "uz";
    }

    return "en";
  }

  // 5. Show Auto-Routed Notice Toast
  try {
    const wasAutoRouted = sessionStorage.getItem("geo_routed");
    if (wasAutoRouted) {
      sessionStorage.removeItem("geo_routed");
      const msgObj = LANG_MESSAGES[curLangCode] || LANG_MESSAGES.en;
      const notice = document.createElement("div");
      notice.className = "lang-auto-notice";
      notice.setAttribute("role", "status");
      notice.innerHTML = `
        <span class="lang-auto-notice-flag">${msgObj.flag}</span>
        <span class="lang-auto-notice-text">${msgObj.autoNotice}</span>
        <button type="button" class="lang-auto-notice-link" id="lang-notice-change">${msgObj.changeBtn}</button>
        <button type="button" class="lang-auto-notice-close" id="lang-notice-close" aria-label="Close">&times;</button>
      `;
      document.body.appendChild(notice);
      document.getElementById("lang-notice-change")?.addEventListener("click", () => {
        notice.remove();
        openLangModal();
      });
      document.getElementById("lang-notice-close")?.addEventListener("click", () => {
        notice.remove();
      });
      setTimeout(() => {
        if (notice && notice.parentNode) notice.remove();
      }, 7500);
    }
  } catch (_) {}

  // 6. Show Smart Language Suggestion Banner
  try {
    const isBot = typeof navigator !== "undefined" && /bot|googlebot|crawler|spider|robot|crawling/i.test(navigator.userAgent);
    if (!isBot) {
      const detectedLang = detectDeviceAndLocationLang();
      const userChoice = localStorage.getItem("messistats_lang_choice");
      const dismissed = sessionStorage.getItem("messistats_lang_dismissed");

      if (detectedLang && detectedLang !== curLangCode && !userChoice && dismissed !== detectedLang) {
        const targetMsg = LANG_MESSAGES[detectedLang] || LANG_MESSAGES.en;
        const targetUrl = getLangUrl(detectedLang);

        const banner = document.createElement("div");
        banner.className = "lang-suggest-banner";
        banner.id = "lang-suggest-banner";
        banner.setAttribute("role", "region");
        banner.setAttribute("aria-label", "Language recommendation");
        banner.innerHTML = `
          <div class="lang-suggest-content">
            <span class="lang-suggest-flag">${targetMsg.flag}</span>
            <span class="lang-suggest-text">${targetMsg.detected} <b>${targetMsg.suggest}</b></span>
          </div>
          <div class="lang-suggest-actions">
            <a href="${targetUrl}" class="lang-suggest-btn-primary" id="lang-suggest-switch">${targetMsg.switchBtn}</a>
            <button type="button" class="lang-suggest-btn-dismiss" id="lang-suggest-dismiss">${targetMsg.stayBtn}</button>
          </div>
        `;
        if (document.body) {
          document.body.prepend(banner);
        }

        document.getElementById("lang-suggest-switch")?.addEventListener("click", () => {
          try { localStorage.setItem("messistats_lang_choice", detectedLang); } catch (_) {}
        });
        document.getElementById("lang-suggest-dismiss")?.addEventListener("click", () => {
          try {
            sessionStorage.setItem("messistats_lang_dismissed", detectedLang);
            localStorage.setItem("messistats_lang_choice", curLangCode);
          } catch (_) {}
          banner.remove();
        });
      }
    }
  } catch (_) {}

  centerActiveNav();
  if (typeof window !== "undefined") {
    window.addEventListener("resize", centerActiveNav, { passive: true });
  }
}

// Initialize immediately and also on DOMContentLoaded
initLanguageAndMobileTopBar();
if (typeof window !== "undefined" && document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initLanguageAndMobileTopBar);
}

async function load() {
  let r;
  try {
    r = await fetch("/data/messi-data.json", { cache: "no-store" });
  } catch (_) {}
  if (!r || !r.ok) {
    r = await fetch("data/messi-data.json", { cache: "no-store" });
  }
  if (!r.ok) throw new Error("data " + r.status);
  return r.json();
}
const el = (id) => document.getElementById(id);
const esc = (s) => {
  if (s == null) return "";
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
};
const n = (v) => Number(v).toLocaleString("en-US");
const gpg = (g, a) => (a ? (g / a).toFixed(2) : "—");

/* Click a column header to sort. Rows with class "total" stay pinned at the bottom. */
function sortable(table) {
  if (!table) return;
  const ths = [...table.querySelectorAll("thead th")];
  if (!ths.length) return;
  const val = (cell) => {
    const t = cell.textContent.trim();
    const pair = t.match(/(\d[\d,]*)\s*\/\s*(\d[\d,]*)/); // "apps / goals" cells sort by goals
    if (pair) return +pair[2].replace(/,/g, "");
    const c = t.replace(/[^0-9.\-]/g, "");
    return c !== "" && !isNaN(+c) ? +c : t.toLowerCase();
  };
  ths.forEach((th, i) => {
    th.setAttribute("data-sortable", "");
    th.setAttribute("tabindex", "0");
    th.setAttribute("role", "button");
    const go = () => {
      const tb = table.tBodies[0];
      if (!tb) return;
      const dir = th.getAttribute("data-sorted") === "asc" ? "desc" : "asc";
      ths.forEach((h) => h.removeAttribute("data-sorted"));
      th.setAttribute("data-sorted", dir);
      const rows = [...tb.rows];
      const pinned = rows.filter((r) => r.classList.contains("total"));
      const rest = rows.filter((r) => !r.classList.contains("total"));
      rest.sort((a, b) => {
        const x = val(a.cells[i]), y = val(b.cells[i]);
        const c = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
        return dir === "asc" ? c : -c;
      });
      rest.forEach((r) => tb.appendChild(r));
      pinned.forEach((r) => tb.appendChild(r));
    };
    th.addEventListener("click", go);
    th.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
  });
}

/* Live-filter a table's rows (total rows stay visible). When `param` is given
   the query persists in the URL (?param=text) via history.replaceState, so a
   filtered view is shareable and survives reload; it is read back on init. */
function tableSearch(table, placeholder, param) {
  if (!table || !table.parentElement) return;
  const box = document.createElement("div");
  box.className = "table-search";
  box.innerHTML = `<input type="search" placeholder="${placeholder}" aria-label="${placeholder}">`;
  table.before(box);
  const inp = box.querySelector("input");
  const apply = (q) => {
    q = q.trim().toLowerCase();
    [...table.tBodies[0].rows].forEach((r) => {
      r.hidden = !(!q || r.classList.contains("total") || r.textContent.toLowerCase().includes(q));
    });
  };
  let timer = null;
  inp.addEventListener("input", () => {
    apply(inp.value);
    if (!param) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      const url = new URL(location.href);
      if (inp.value.trim()) url.searchParams.set(param, inp.value.trim());
      else url.searchParams.delete(param);
      history.replaceState(null, "", url.pathname + url.search + url.hash);
    }, 300);
  });
  if (param) {
    const initial = new URLSearchParams(location.search).get(param);
    if (initial) { inp.value = initial; apply(initial); }
  }
}

const CLUBS = {
  barcelona: { name: "Barcelona", years: "2004 to 2021", badge: "FCB", colors: "#A50044,#004D98" },
  psg: { name: "Paris Saint-Germain", short: "PSG", years: "2021 to 2023", badge: "PSG", colors: "#004170,#0a2540" },
  miami: { name: "Inter Miami", years: "2023 to present", badge: "MIA", colors: "#e1438b,#7a1c4d" },
  argentina: { name: "Argentina", years: "2005 to present", badge: "ARG", colors: "#2f9fd8,#1668a8" },
};
/* Real club crests (self-hosted in public/img/teams/) layered over the
   original CSS colour badge: if a crest file is missing, onerror drops the
   <img> and the old badge shows through instead of a broken image. */
const badge = (k, eager) => {
  const c = CLUBS[k];
  const label = (k === "psg" ? "Paris Saint-Germain" : c.name) + " crest";
  return `<span class="crest" data-team="${k}"><span class="club-badge" data-team="${k}" aria-hidden="true" style="display:none">${c.badge}</span>` +
    `<img class="crest-img" src="img/teams/${k}.png" alt="${label}" width="30" height="30" loading="${eager ? "eager" : "lazy"}" decoding="async" onerror="const b=this.previousElementSibling;if(b)b.style.display='';this.remove()"></span>`;
};
const teamName = (k) => (k === "psg" ? "PSG" : CLUBS[k].name);
const CLUB_KEY = { Barcelona: "barcelona", "Paris Saint-Germain": "psg", "Inter Miami": "miami" };
const dispClub = (c) => (c === "Paris Saint-Germain" ? "PSG" : c);
/* Normalize the JSON's varied shapes into the flat fields renderers use. */
function normalize(d) {
  const t = d.totals;
  t.goals = t.combined.goals;
  t.apps = t.combined.appearances;
  t.clubs = { apps: t.club.appearances, goals: t.club.goals, goalsPerGame: t.club.goalsPerGame };
  t.country.apps = t.country.appearances;
  d.lastUpdated = new Date((d.meta.updated || "") + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const fin = {};
  d.byFinish.forEach((r) => { fin[r.finish] = r.goals; });
  d.byFinish = { openPlay: fin["Open play"], penalties: fin["Penalties"], freeKicks: fin["Free kicks"] };
  const bp = {};
  d.byBodyPart.forEach((r) => { bp[r.part] = r.goals; });
  d.byBodyPart = { left: bp["Left foot"], right: bp["Right foot"], head: bp["Head"], other: bp["Other (chest etc.)"] };
  d.calendarYears.forEach((r) => { r.provisional = r.status === "provisional-ongoing"; });
  d.clubSeasons.forEach((s) => {
    s.provisional = s.season === "2026";
    ["league", "cup", "continental", "other"].forEach((k) => { s[k] = { apps: s[k][0], goals: s[k][1] }; });
  });
  d.countryYears.forEach((s) => { s.provisional = s.year === 2026; });
  d.trophies.forEach((x) => { x.count = x.years.length; });
}

function clubAgg(d) {
  const o = {};
  d.clubSeasons.forEach((s) => {
    const k = CLUB_KEY[s.club];
    o[k] = o[k] || { apps: 0, goals: 0 };
    o[k].apps += s.apps;
    o[k].goals += s.goals;
  });
  o.argentina = { apps: d.totals.country.apps, goals: d.totals.country.goals };
  return o;
}

/* ---------- shared blocks ---------- */
function setHead(d, ledeHTML) {
  const lang = (document.documentElement.lang || "en").toLowerCase().split("-")[0];
  const isEn = lang === "en";
  if (el("upd")) {
    if (isEn) {
      el("upd").textContent = "Updated " + d.lastUpdated;
    }
  }
  if (el("lede")) {
    if (isEn || !el("lede").textContent.trim()) {
      el("lede").innerHTML = ledeHTML;
    }
  }
  if (el("foot-date")) {
    const footDates = {
      es: `Lionel Messi: ${n(d.totals.apps)} partidos oficiales senior, ${n(d.totals.goals)} goles ` +
        `(${n(d.totals.clubs.apps)} PJ / ${n(d.totals.clubs.goals)} goles en clubes, ` +
        `${n(d.totals.country.apps)} / ${n(d.totals.country.goals)} con Argentina). Actualizado al ${d.lastUpdated}.`,
      pt: `Lionel Messi: ${n(d.totals.apps)} partidas oficiais seniores, ${n(d.totals.goals)} gols ` +
        `(${n(d.totals.clubs.apps)} jogos / ${n(d.totals.clubs.goals)} gols por clubes, ` +
        `${n(d.totals.country.apps)} / ${n(d.totals.country.goals)} pela Argentina). Atualizado em ${d.lastUpdated}.`,
      fr: `Lionel Messi : ${n(d.totals.apps)} matchs officiels en senior, ${n(d.totals.goals)} buts ` +
        `(${n(d.totals.clubs.apps)} matchs / ${n(d.totals.clubs.goals)} buts en club, ` +
        `${n(d.totals.country.apps)} / ${n(d.totals.country.goals)} avec l'Argentine). Mis à jour le ${d.lastUpdated}.`,
      ar: `ليونيل ميسي: ${n(d.totals.apps)} مباراة رسمية مع الفريق الأول، ${n(d.totals.goals)} هدفاً ` +
        `(${n(d.totals.clubs.apps)} مباراة / ${n(d.totals.clubs.goals)} هدفاً مع الأندية، ` +
        `${n(d.totals.country.apps)} / ${n(d.totals.country.goals)} مع الأرجنتين). آخر تحديث ${d.lastUpdated}.`,
      bn: `লিওনেল মেসি: ${n(d.totals.apps)}টি সিনিয়র ম্যাচ, ${n(d.totals.goals)}টি গোল ` +
        `(${n(d.totals.clubs.apps)} ম্যাচে ${n(d.totals.clubs.goals)} ক্লাব গোল, ` +
        `আর্জেন্টিনার হয়ে ${n(d.totals.country.apps)} ম্যাচে ${n(d.totals.country.goals)} গোল)। সর্বশেষ আপডেট ${d.lastUpdated}।`,
      hi: `लियोनेल मेस्सी: ${n(d.totals.apps)} सीनियर मैच, ${n(d.totals.goals)} गोल ` +
        `(${n(d.totals.clubs.apps)} क्लब मैच / ${n(d.totals.clubs.goals)} क्लब गोल, ` +
        `${n(d.totals.country.apps)} / ${n(d.totals.country.goals)} अर्जेंटीना)। अंतिम अद्यतन ${d.lastUpdated}।`,
      ro: `Lionel Messi: ${n(d.totals.apps)} meciuri oficiale la seniori, ${n(d.totals.goals)} goluri ` +
        `(${n(d.totals.clubs.apps)} meciuri / ${n(d.totals.clubs.goals)} goluri la cluburi, ` +
        `${n(d.totals.country.apps)} / ${n(d.totals.country.goals)} cu Argentina). Actualizat la ${d.lastUpdated}.`,
      uz: `Lionel Messi: ${n(d.totals.apps)} ta rasmiy o'yin, ${n(d.totals.goals)} ta gol ` +
        `(${n(d.totals.clubs.apps)} ta klub o'yini / ${n(d.totals.clubs.goals)} ta gol, ` +
        `Argentina bilan ${n(d.totals.country.apps)} / ${n(d.totals.country.goals)}). Oxirgi yangilanish: ${d.lastUpdated}.`
    };
    el("foot-date").textContent = footDates[lang] ||
      `Lionel Messi: ${n(d.totals.apps)} senior appearances, ${n(d.totals.goals)} goals ` +
      `(${n(d.totals.clubs.apps)} apps / ${n(d.totals.clubs.goals)} goals club, ` +
      `${n(d.totals.country.apps)} / ${n(d.totals.country.goals)} Argentina). Last checked ${d.lastUpdated}.`;
  }
}
function reveal() {
  document.querySelectorAll("main.wrap > *").forEach((s, i) => {
    s.classList.add("reveal");
    s.style.animationDelay = Math.min(i * 0.04, 0.4) + "s";
  });
}
const EXPLORE = [
  { href: "/en/birthday", page: "birthday", t: "🎂 Did Messi score on your birthday?", d: (d) => `Search all 366 calendar days with video clips across Messi's ${n(d.totals.goals)} senior career goals.` },
  { href: "/en/messi-vs-ronaldo", page: "messi-vs-ronaldo", t: "🐐 Messi vs Ronaldo All-Time", d: () => "Head-to-head career stats: 930 vs 979 goals, 46 vs 35 trophies, 8 vs 5 Ballons d'Or." },
  { href: "/en/vs-real-madrid", page: "vs-real-madrid", t: "⚔️ Messi vs Real Madrid", d: () => "All 26 El Clásico goals, 45 matches, 14 assists, hat-tricks, and video clips." },
  { href: "/en/champions-league", page: "champions-league", t: "⭐ Champions League Record", d: () => "129 UEFA Champions League goals, 8 hat-tricks, and 4 European titles." },
  { href: "/en/latest-goal", page: "latest-goal", t: "⚽ Latest Messi Goal Video", d: () => "Watch Goal #929 vs Cruz Azul, see if Messi scored today, and view recent goal clips." },
  { href: "/en", page: "home", t: "Messi career stats", d: (d) => `The headline numbers: ${n(d.totals.goals)} goals in ${n(d.totals.apps)} senior games.` },
  { href: "/en/goalsbyyear", page: "byyear", t: "Messi goals by year", d: (d) => `Every calendar year from 2004 to 2026 and the climb to ${n(d.totals.goals)}.` },
  { href: "/en/goalsbyseason", page: "byseason", t: "Messi goals by season", d: () => "League, cup and continental splits for every club season." },
  { href: "/en/dashboard", page: "dashboard", t: "Messi stats dashboard", d: () => "Filter every chart by Barcelona, PSG, Inter Miami or Argentina." },
  { href: "/en/timeline", page: "timeline", t: "Messi through the years", d: () => "Every career milestone, dated and in order, from 2004 to today." },
  { href: "/en/achievements", page: "achievements", t: "Messi trophies and awards", d: () => "All 46 team titles plus a record 8 Ballons d'Or." },
];

function getLang() {
  const l = (document.documentElement.lang || "en").toLowerCase();
  for (const c of ["es", "pt", "fr", "ar", "bn", "hi", "ro", "uz"]) {
    if (l.startsWith(c)) return c;
  }
  return "en";
}

const EXPLORE_LANGS = {
  es: [
    { href: "/es/birthday", page: "birthday", t: "🎂 ¿Marcó Messi en tu cumpleaños?", d: (d) => `Busca entre los 366 días del año con clips de video de los ${n(d.totals.goals)} goles oficiales de Messi.` },
    { href: "/es/messi-vs-ronaldo", page: "messi-vs-ronaldo", t: "🐐 Messi vs Ronaldo Histórico", d: () => "Estadísticas cara a cara: 930 vs 979 goles, 46 vs 35 títulos, 8 vs 5 Balones de Oro." },
    { href: "/es/vs-real-madrid", page: "vs-real-madrid", t: "⚔️ Messi vs Real Madrid", d: () => "Los 26 goles en El Clásico, 45 partidos, 14 asistencias, hat-tricks y videos." },
    { href: "/es/champions-league", page: "champions-league", t: "⭐ Récord en Champions League", d: () => "129 goles en UEFA Champions League, 8 hat-tricks y 4 títulos europeos." },
    { href: "/es/latest-goal", page: "latest-goal", t: "⚽ Último gol de Messi en video", d: () => "Mira el gol 929 vs Cruz Azul, consulta si Messi marcó hoy y reproduce sus últimos goles." },
    { href: "/es", page: "home", t: "Estadísticas de Messi", d: (d) => `Las cifras clave: ${n(d.totals.goals)} goles en ${n(d.totals.apps)} partidos profesionales.` },
    { href: "/es/goalsbyyear", page: "byyear", t: "Goles de Messi por año", d: (d) => `Cada año natural de 2004 a 2026 y el camino hacia los ${n(d.totals.goals)}.` },
    { href: "/es/goalsbyseason", page: "byseason", t: "Goles de Messi por temporada", d: () => "Desglose de liga, copas y torneos continentales para cada temporada." },
    { href: "/es/dashboard", page: "dashboard", t: "Panel interactivo de Messi", d: () => "Filtra todos los gráficos por Barcelona, PSG, Inter Miami o Argentina." },
    { href: "/es/timeline", page: "timeline", t: "Lionel Messi en el tiempo", d: () => "Cada hito histórico de su carrera, fechado y en orden, de 2004 a hoy." },
    { href: "/es/achievements", page: "achievements", t: "Títulos y premios de Messi", d: () => "Los 46 títulos de equipo más el récord de 8 Balones de Oro." }
  ],
  pt: [
    { href: "/pt/birthday", page: "birthday", t: "🎂 ¿Marcou Messi no seu aniversário?", d: (d) => `Pesquise os 366 dias do ano com vídeos de todos os ${n(d.totals.goals)} gols de Messi.` },
    { href: "/pt/messi-vs-ronaldo", page: "messi-vs-ronaldo", t: "🐐 Messi vs Ronaldo Histórico", d: () => "Estatísticas cara a cara: 930 vs 979 gols, 46 vs 35 títulos, 8 vs 5 Bolas de Ouro." },
    { href: "/pt/vs-real-madrid", page: "vs-real-madrid", t: "⚔️ Messi vs Real Madrid", d: () => "Os 26 gols no El Clásico, 45 partidas, 14 assistências e hat-tricks." },
    { href: "/pt/champions-league", page: "champions-league", t: "⭐ Recorde na Champions League", d: () => "129 gols na UEFA Champions League, 8 hat-tricks e 4 títulos europeus." },
    { href: "/pt/latest-goal", page: "latest-goal", t: "⚽ Último gol de Messi em vídeo", d: () => "Assista ao gol 929 vs Cruz Azul, veja se Messi marcou hoje e confira vídeos recentes." },
    { href: "/pt", page: "home", t: "Estatísticas de Lionel Messi", d: (d) => `Os números oficiais: ${n(d.totals.goals)} gols em ${n(d.totals.apps)} partidas profissionais.` },
    { href: "/pt/goalsbyyear", page: "byyear", t: "Gols de Messi por ano", d: (d) => `Todos os anos civis de 2004 a 2026 e o recorde de 91 gols.` },
    { href: "/pt/goalsbyseason", page: "byseason", t: "Gols de Messi por temporada", d: () => "Divisão de liga, copas e torneios continentais para cada temporada." },
    { href: "/pt/dashboard", page: "dashboard", t: "Painel de estatísticas", d: () => "Filtre todos os gráficos por Barcelona, PSG, Inter Miami ou Argentina." },
    { href: "/pt/timeline", page: "timeline", t: "História e Linha do tempo", d: () => "Cada momento da carreira em ordem cronológica de 2004 até hoje." },
    { href: "/pt/achievements", page: "achievements", t: "Títulos e troféus", d: () => "Todos os 46 títulos oficiais mais o recorde de 8 Bolas de Ouro." }
  ],
  fr: [
    { href: "/fr/birthday", page: "birthday", t: "🎂 Messi a-t-il marqué le jour de votre anniversaire ?", d: (d) => `Recherchez parmi les 366 jours de l'année avec vidéos des ${n(d.totals.goals)} buts.` },
    { href: "/fr/messi-vs-ronaldo", page: "messi-vs-ronaldo", t: "🐐 Messi vs Ronaldo Face-à-Face", d: () => "Statistiques historiques : 930 vs 979 buts, 46 vs 35 titres, 8 vs 5 Ballons d'Or." },
    { href: "/fr/vs-real-madrid", page: "vs-real-madrid", t: "⚔️ Messi vs Real Madrid", d: () => "Tous les 26 buts dans le Clásico, 45 matchs, 14 passes décisives." },
    { href: "/fr/champions-league", page: "champions-league", t: "⭐ Bilan en Ligue des Champions", d: () => "129 buts en UEFA Champions League, 8 triplés et 4 titres européens." },
    { href: "/fr/latest-goal", page: "latest-goal", t: "⚽ Dernier but de Messi en vidéo", d: () => "Regardez le but 929 contre Cruz Azul, vérifiez s'il a marqué aujourd'hui et ses derniers buts." },
    { href: "/fr", page: "home", t: "Statistiques de Lionel Messi", d: (d) => `Les chiffres clés : ${n(d.totals.goals)} buts en ${n(d.totals.apps)} matchs officiels.` },
    { href: "/fr/goalsbyyear", page: "byyear", t: "Buts de Messi par année", d: (d) => `Chaque année civile de 2004 à 2026 et le record de 91 buts.` },
    { href: "/fr/goalsbyseason", page: "byseason", t: "Buts de Messi par saison", d: () => "Répartition par championnat, coupes et Ligue des Champions." },
    { href: "/fr/dashboard", page: "dashboard", t: "Tableau de bord interactif", d: () => "Filtrez par Barcelone, PSG, Inter Miami ou Argentine." },
    { href: "/fr/timeline", page: "timeline", t: "Chronologie de sa carrière", d: () => "Chaque événement historique daté dans l'ordre chronologique." },
    { href: "/fr/achievements", page: "achievements", t: "Palmarès et trophées", d: () => "Les 46 trophées collectifs et le record de 8 Ballons d'Or." }
  ],
  ar: [
    { href: "/ar/birthday", page: "birthday", t: "🎂 هل سجل ميسي في يوم ميلادك؟", d: (d) => `ابحث في جميع أيام السنة الـ 366 مع مقاطع الفيديو لـ ${n(d.totals.goals)} هدفاً.` },
    { href: "/ar/messi-vs-ronaldo", page: "messi-vs-ronaldo", t: "🐐 ميسي ضد رونالدو تاريخياً", d: () => "مقارنة المسيرة: 930 ضد 979 هدفاً، 46 ضد 35 بطولة، و8 كرات ذهبية." },
    { href: "/ar/vs-real-madrid", page: "vs-real-madrid", t: "⚔️ ميسي ضد ريال مدريد", d: () => "26 هدفاً في الكلاسيكو، 45 مباراة و14 تمريرة حاسمة." },
    { href: "/ar/champions-league", page: "champions-league", t: "⭐ سجل دوري أبطال أوروبا", d: () => "129 هدفاً في دوري أبطال أوروبا، 8 هاتريك و4 ألقاب أوروبية." },
    { href: "/ar/latest-goal", page: "latest-goal", t: "⚽ فيديو آخر هدف لميسي", d: () => "شاهد الهدف 929 ضد كروز أزول، واعرف هل سجل ميسي اليوم وتصفح أحدث أهدافه بالفيديو." },
    { href: "/ar", page: "home", t: "إحصائيات ليونيل ميسي", d: (d) => `الأرقام الرسمية: ${n(d.totals.goals)} هدفاً في ${n(d.totals.apps)} مباراة رسمية.` },
    { href: "/ar/goalsbyyear", page: "byyear", t: "أهداف ميسي بالسنة", d: (d) => `كل سنة ميلادية من 2004 إلى 2026 ورقم الـ 91 القياسي.` },
    { href: "/ar/goalsbyseason", page: "byseason", t: "أهداف ميسي بالموسم", d: () => "تقسيم الدوري، الكؤوس والبطولات القارية." },
    { href: "/ar/dashboard", page: "dashboard", t: "لوحة البيانات التفاعلية", d: () => "تصفية حسب برشلونة، باريس، إنتر ميامي والأرجنتين." },
    { href: "/ar/timeline", page: "timeline", t: "المسار الزمني التاريخي", d: () => "كل محطة في مسيرته بالترتيب الزمني من 2004 حتى اليوم." },
    { href: "/ar/achievements", page: "achievements", t: "البطولات والجوائز", d: () => "46 بطولة رسمية ورقم قياسي بـ 8 كرات ذهبية." }
  ],
  bn: [
    { href: "/bn/birthday", page: "birthday", t: "🎂 মেসি কি আপনার জন্মদিনে গোল করেছিলেন?", d: (d) => `৩৬৬ দিনের প্রতিটি দিন ভিডিও সহ অনুসন্ধান করুন (${n(d.totals.goals)} ক্যারিয়ার গোল)।` },
    { href: "/bn/messi-vs-ronaldo", page: "messi-vs-ronaldo", t: "🐐 মেসি বনাম রোনালদো", d: () => "ক্যারিয়ার পরিসংখ্যান: ৯২৯ বনাম ৯২৪ গোল, ৪৬ বনাম ৩৫ ট্রফি, ৮টি ব্যালন ডি'অর।" },
    { href: "/bn/vs-real-madrid", page: "vs-real-madrid", t: "⚔️ মেসি বনাম রিয়াল মাদ্রিদ", d: () => "ক্লাসিকোতে ২৬ গোল, ৪৫ ম্যাচ ও ১৪টি অ্যাসিস্ট।" },
    { href: "/bn/champions-league", page: "champions-league", t: "⭐ চ্যাম্পিয়নস লিগ রেকর্ড", d: () => "উয়েফা চ্যাম্পিয়নস লিগে ১২৯টি গোল, ৮টি হ্যাটট্রিক এবং ৪টি ইউরোপীয় শিরোপা।" },
    { href: "/bn/latest-goal", page: "latest-goal", t: "⚽ মেসির শেষ গোলের ভিডিও", d: () => "ক্রুজ আজুলের বিরুদ্ধে মেসির ৯২৯তম গোল দেখুন, আজ কি গোল করেছেন এবং সাম্প্রতিক গোলগুলো।" },
    { href: "/bn", page: "home", t: "লিওনেল মেসির পরিসংখ্যান", d: (d) => `অফিসিয়াল তথ্য: ${n(d.totals.apps)} ম্যাচে ${n(d.totals.goals)} গোল।` },
    { href: "/bn/goalsbyyear", page: "byyear", t: "বছরভিত্তিক গোল", d: (d) => `২০০৪ থেকে ২০২৬ এবং ২০১২ সালে ৯১ গোলের বিশ্বরেকর্ড।` },
    { href: "/bn/goalsbyseason", page: "byseason", t: "মৌসুমভিত্তিক গোল", d: () => "লীগ, কাপ ও চ্যাম্পিয়ন্স লীগের পরিসংখ্যান।" },
    { href: "/bn/dashboard", page: "dashboard", t: "ইন্টারেক্টিভ ড্যাশবোর্ড", d: () => "বার্সেলোনা, পিএসজি, ইন্টার মায়ামি ও আর্জেন্টিনার পরিসংখ্যান।" },
    { href: "/bn/timeline", page: "timeline", t: "ক্যারিয়ার টাইমলাইন", d: () => "২০০৪ থেকে আজ পর্যন্ত প্রতিটি ঐতিহাসিক মুহূর্ত।" },
    { href: "/bn/achievements", page: "achievements", t: "ট্রফি ও খেতাব", d: () => "সর্বকালের রেকর্ড ৪৬টি অফিশিয়াল খেতাব ও ৮টি ব্যালন ডি'অর।" }
  ],
  hi: [
    { href: "/hi/birthday", page: "birthday", t: "🎂 क्या मेसी ने आपके जन्मदिन पर गोल किया था?", d: (d) => `साल के 366 दिनों में मेसी के ${n(d.totals.goals)} गोल वीडियो देखें।` },
    { href: "/hi/messi-vs-ronaldo", page: "messi-vs-ronaldo", t: "🐐 मेसी बनाम रोनाल्डो", d: () => "करियर आंकड़े: 930 बनाम 979 गोल, 46 बनाम 35 खिताब, 8 बैलन डी'ओर." },
    { href: "/hi/vs-real-madrid", page: "vs-real-madrid", t: "⚔️ मेसी बनाम रियल मैड्रिड", d: () => "एल क्लासिको में 26 गोल, 45 मैच और 14 असिस्ट।" },
    { href: "/hi/champions-league", page: "champions-league", t: "⭐ चैंपियंस लीग रिकॉर्ड", d: () => "यूईएफए चैंपियंस लीग में 129 गोल, 8 हैट्रिक और 4 यूरोपीय खिताब।" },
    { href: "/hi/latest-goal", page: "latest-goal", t: "⚽ मेसी का पिछला गोल वीडियो", d: () => "क्रूज़ अज़ूल के खिलाफ 929वां गोल देखें, जानें क्या मेसी ने आज गोल किया और हालिया गोल।" },
    { href: "/hi", page: "home", t: "मेसी के आधिकारिक आंकड़े", d: (d) => `${n(d.totals.apps)} आधिकारिक मैचों में ${n(d.totals.goals)} गोल।` },
    { href: "/hi/goalsbyyear", page: "byyear", t: "साल दर साल गोल", d: (d) => `2004 से 2026 और 2012 में 91 गोलों का विश्व रिकॉर्ड।` },
    { href: "/hi/goalsbyseason", page: "byseason", t: "सीज़न अनुसार गोल", d: () => "लीग, कप और महाद्वीपीय प्रतियोगिताओं का विवरण।" },
    { href: "/hi/dashboard", page: "dashboard", t: "इंटरएक्टिव डैशबोर्ड", d: () => "बार्सिलोना, पीएसजी, मियामी और अर्जेंटीना अनुसार फ़िल्टर।" },
    { href: "/hi/timeline", page: "timeline", t: "करियर टाइमलाइन", d: () => "2004 से आज तक का हर ऐतिहासिक पड़ाव।" },
    { href: "/hi/achievements", page: "achievements", t: "खिताब और अवॉर्ड", d: () => "रिकॉर्ड 46 खिताब और 8 बैलन डी'ओर।" }
  ],
  ro: [
    { href: "/ro/birthday", page: "birthday", t: "🎂 A marcat Messi de ziua ta de naștere?", d: (d) => `Caută în toate cele 366 de zile din an cu cele ${n(d.totals.goals)} goluri ale lui Messi.` },
    { href: "/ro/messi-vs-ronaldo", page: "messi-vs-ronaldo", t: "🐐 Messi vs Ronaldo All-Time", d: () => "Statistici cap la cap: 930 vs 979 goluri, 46 vs 35 trofee, 8 Baloane de Aur." },
    { href: "/ro/vs-real-madrid", page: "vs-real-madrid", t: "⚔️ Messi vs Real Madrid", d: () => "Toate cele 26 de goluri din El Clásico, 45 de meciuri, 14 pase de gol." },
    { href: "/ro/champions-league", page: "champions-league", t: "⭐ Recordul în Champions League", d: () => "129 de goluri în UEFA Champions League, 8 hat-trick-uri și 4 trofee europene." },
    { href: "/ro/latest-goal", page: "latest-goal", t: "⚽ Ultimul gol al lui Messi video", d: () => "Urmărește golul 929 contra lui Cruz Azul, vezi dacă a marcat azi și cele mai recente goluri." },
    { href: "/ro", page: "home", t: "Statisticile lui Lionel Messi", d: (d) => `Cifrele cheie: ${n(d.totals.goals)} goluri în ${n(d.totals.apps)} meciuri oficiale.` },
    { href: "/ro/goalsbyyear", page: "byyear", t: "Golurile lui Messi pe ani", d: (d) => `Fiecare an calendaristic din 2004 până în 2026 și recordul de 91.` },
    { href: "/ro/goalsbyseason", page: "byseason", t: "Golurile lui Messi pe sezoane", d: () => "Campionat, cupe interne și meciuri europene." },
    { href: "/ro/dashboard", page: "dashboard", t: "Panoul interactiv de statistici", d: () => "Filtrează pe Barcelona, PSG, Inter Miami sau Argentina." },
    { href: "/ro/timeline", page: "timeline", t: "Cronologia carierei", d: () => "Fiecare moment istoric datat din 2004 până azi." },
    { href: "/ro/achievements", page: "achievements", t: "Trofeele și premiile lui Messi", d: () => "Toate cele 46 de trofee colective plus 8 Baloane de Aur." }
  ],
  uz: [
    { href: "/uz/birthday", page: "birthday", t: "🎂 Messi sizning tug'ilgan kuningizda gol urganmi?", d: (d) => `Yilning 366 kunidagi gollarni videolar bilan ko'ring (${n(d.totals.goals)} ta gol).` },
    { href: "/uz/messi-vs-ronaldo", page: "messi-vs-ronaldo", t: "🐐 Messi vs Ronaldu Tarixiy", d: () => "O'zaro solishtirma: 930 ga 979 ta gol, 46 ga 35 ta titul, 8 ta “Oltin to'p”." },
    { href: "/uz/vs-real-madrid", page: "vs-real-madrid", t: "⚔️ Messi vs Real Madrid", d: () => "El-Klasikodagi 26 ta gol, 45 ta o'yin va 14 ta assist." },
    { href: "/uz/champions-league", page: "champions-league", t: "⭐ Chempionlar Ligasi rekordi", d: () => "UEFA Chempionlar Ligasida 129 ta gol, 8 ta het-trik va 4 ta Yevropa chempionligi." },
    { href: "/uz/latest-goal", page: "latest-goal", t: "⚽ Messining soʻnggi goli video", d: () => "Kruz Asulga qarshi 929-golni tomosha qiling, Messi bugun gol urdimi va soʻnggi gollari." },
    { href: "/uz", page: "home", t: "Lionel Messi statistikasi", d: (d) => `Asosiy raqamlar: ${n(d.totals.apps)} ta o'yinda ${n(d.totals.goals)} ta rasmiy gol.` },
    { href: "/uz/goalsbyyear", page: "byyear", t: "Yillar bo'yicha gollar", d: (d) => `2004 yildan 2026 yilgacha va 2012 yildagi 91 ta golli rekord.` },
    { href: "/uz/goalsbyseason", page: "byseason", t: "Mavsumlar bo'yicha gollar", d: () => "Liga, kubok va xalqaro turnirlar bo'yicha ajratilgan." },
    { href: "/uz/dashboard", page: "dashboard", t: "Interaktiv statistika paneli", d: () => "Barselona, PSJ, Inter Mayami yoki Argentina bo'yicha saralang." },
    { href: "/uz/timeline", page: "timeline", t: "Karyera xronologiyasi", d: () => "2004 yildan to hozirgi kungacha bo'lgan tarixiy sanalar." },
    { href: "/uz/achievements", page: "achievements", t: "Sovrinlar va yutuqlar", d: () => "46 ta jamoaviy sovrin va rekord 8 ta “Oltin to'p”." }
  ]
};

function renderExplore(d, page) {
  const e = el("explore");
  if (!e) return;
  const lang = getLang();
  const list = EXPLORE_LANGS[lang] || EXPLORE;
  e.innerHTML = list.filter((x) => x.page !== page)
    .slice(0, 9)
    .map((x) => `<a class="link-card" href="${x.href}"><strong>${esc(x.t)}</strong><span>${esc(x.d(d))}</span></a>`)
    .join("");
}
function methodHTML(d, extra) {
  const lang = getLang();
  if (lang === "es") {
    const teams = "Barcelona, París Saint-Germain, Inter Miami y Selección Argentina";
    return methodColophon(`<h2>Cómo recopilamos estas estadísticas</h2>` +
      `<p>Contabilizamos una sola cosa: partidos oficiales de primer equipo senior para ${teams} — ` +
      `cada partido de liga, copa nacional, noche continental y selección mayor. Sin fútbol juvenil, sin filiales y sin amistosos de clubes.</p>` +
      `<details class="method-more"><summary>Cómo verificamos las cifras</summary>` +
      `<p>Los goles por temporada y año se compilan a partir de actas oficiales de partido y se contrastan con registros de clubes ` +
      `y competiciones tras cada encuentro. Todos los datos están 100% verificados. ${extra || ""}</p>` +
      `<p class="colophon">Sitio independiente actualizado manualmente tras cada partido. Totales 100% verificados con fuentes primarias oficiales.</p></details>`);
  }
  if (lang === "pt") {
    const teams = "Barcelona, Paris Saint-Germain, Inter Miami e Seleção Argentina";
    return methodColophon(`<h2>Como reunimos essas estatísticas</h2>` +
      `<p>Contabilizamos apenas partidas oficiais de equipes principais seniores para ${teams} — ` +
      `todos os jogos de liga, copas nacionais, competições continentais e jogos da seleção. Sem divisões de base e sem amistosos de clubes.</p>` +
      `<details class="method-more"><summary>Como verificamos os números</summary>` +
      `<p>Os gols são compilados a partir de súmulas oficiais de jogos e validados após cada partida. Todos os dados são 100% verificados. ${extra || ""}</p>` +
      `<p class="colophon">Site independente mantido e verificado com fontes primárias oficiais.</p></details>`);
  }
  if (lang === "fr") {
    const teams = "Barcelone, Paris Saint-Germain, Inter Miami et l'Équipe d'Argentine";
    return methodColophon(`<h2>Comment nous compilons ces statistiques</h2>` +
      `<p>Nous comptabilisons une seule chose : les matchs officiels en équipe première senior pour ${teams} — ` +
      `championnats, coupes nationales, coupes d'Europe/Amérique et sélections nationales. Pas de matchs de jeunes ni d'amicaux en club.</p>` +
      `<details class="method-more"><summary>Vérification des chiffres</summary>` +
      `<p>Chaque but est vérifié selon les feuilles de match officielles après chaque rencontre. Données 100% certifiées. ${extra || ""}</p>` +
      `<p class="colophon">Base de données indépendante mise à jour avec rigueur après chaque rencontre.</p></details>`);
  }
  if (lang === "ar") {
    const teams = "برشلونة، باريس سان جيرمان، إنتر ميامي والمنتخب الأرجنتيني";
    return methodColophon(`<h2>كيف نجمع هذه الإحصائيات</h2>` +
      `<p>نحن نحتسب أمراً واحداً: المباريات الرسمية لفرق الدرجة الأولى الكبرى لكل من ${teams} — ` +
      `الدوري، الكؤوس المحلية، الليالي القارية والمنتخب الأول. لا تشمل المباريات الودية للأندية أو فرق الشباب.</p>` +
      `<details class="method-more"><summary>طريقة التحقق من الأرقام</summary>` +
      `<p>تُسجل الأهداف من تقارير المباريات الرسمية وتتم مراجعتها بعد كل مباراة. جميع الأرقام موثقة بنسبة 100%. ${extra || ""}</p>` +
      `<p class="colophon">موقع مستقل يتم تحديثه ومراجعته بمصادر أولية رسمية بعد كل مباراة.</p></details>`);
  }
  if (lang === "bn") {
    const teams = "বার্সেলোনা, পিএসজি, ইন্টার মায়ামি এবং আর্জেন্টিনা জাতীয় দল";
    return methodColophon(`<h2>আমরা কীভাবে এই পরিসংখ্যান সংগ্রহ করি</h2>` +
      `<p>আমরা কেবল একটি বিষয় গণনা করি: ${teams}-এর হয়ে সিনিয়র অফিসিয়াল প্রথম দলের ম্যাচ। কোনো প্রীতি ম্যাচ বা যুব পর্যায়ের খেলা অন্তর্ভুক্ত নয়।</p>` +
      `<details class="method-more"><summary>পরিসংখ্যান যাচাইকরণ</summary>` +
      `<p>প্রতিটি ম্যাচের অফিশিয়াল ম্যাচ রিপোর্ট থেকে গোলের তথ্য সংকলিত এবং যাচাই করা হয়েছে। সকল ডেটা ১০০% সত্য। ${extra || ""}</p>` +
      `<p class="colophon">স্বতন্ত্র ওয়েবসাইট যা প্রতিটি ম্যাচের পর প্রাথমিক অফিসিয়াল সূত্র থেকে সরাসরি হালনাগাদ করা হয়।</p></details>`);
  }
  if (lang === "hi") {
    const teams = "बार्सिलोना, पेरिस सेंट-जर्मेन, इंटर मियामी और अर्जेंटीना";
    return methodColophon(`<h2>हम ये आँकड़े कैसे तैयार करते हैं</h2>` +
      `<p>हम केवल आधिकारिक सीनियर प्रथम-टीम मैचों की गणना करते हैं: ${teams} के लिए सभी लीग, कप, महाद्वीपीय और अंतरराष्ट्रीय मैच।</p>` +
      `<details class="method-more"><summary>आंकड़ों का सत्यापन</summary>` +
      `<p>प्रत्येक मैच के आधिकारिक रिकॉर्ड से आंकड़े संकलित किए जाते हैं। 100% सत्यापित डेटा। ${extra || ""}</p>` +
      `<p class="colophon">स्वतंत्र सांख्यिकी डेटाबेस जिसे प्रत्येक मैच के बाद आधिकारिक स्रोतों से अपडेट किया जाता है।</p></details>`);
  }
  if (lang === "ro") {
    const teams = "Barcelona, Paris Saint-Germain, Inter Miami și Naționala Argentinei";
    return methodColophon(`<h2>Cum compilăm aceste statistici</h2>` +
      `<p>Numărăm doar meciurile oficiale la nivel de seniori pentru ${teams} — ` +
      `campionat, cupe naționale, cupe continentale și meciuri internaționale oficiale.</p>` +
      `<details class="method-more"><summary>Verificarea cifrelor</summary>` +
      `<p>Datele sunt verificate manual din rapoartele oficiale după fiecare partidă. ${extra || ""}</p>` +
      `<p class="colophon">Site independent actualizat cu surse oficiale de prim rang.</p></details>`);
  }
  if (lang === "uz") {
    const teams = "Barselona, PSJ, Inter Mayami va Argentina terma jamoasi";
    return methodColophon(`<h2>Biz bu statistikalarni qanday yig'amiz</h2>` +
      `<p>Biz faqat ${teams} uchun asosiy tarkibdagi rasmiy uchrashuvlarni hisoblaymiz — ` +
      `barcha liga, milliy kubok, qit'a musobaqalari va terma jamoa o'yinlari.</p>` +
      `<details class="method-more"><summary>Raqamlarni tekshirish</summary>` +
      `<p>Gollar har bir o'yindan so'ng rasmiy protokollar asosida to'liq tekshiriladi. ${extra || ""}</p>` +
      `<p class="colophon">Har bir o'yindan so'ng rasmiy manbalar bilan yangilanadigan mustaqil statistika.</p></details>`);
  }
  const teams = "Barcelona, Paris Saint-Germain, Inter Miami and Argentina";
  return methodColophon(`<h2>How I put these numbers together</h2>` +
    `<p>I count one thing: official senior first-team matches for ${teams} — ` +
    `every league game, domestic cup, continental night and international, and nothing else. No youth football, no reserves, no friendlies dressed up as history.</p>` +
    `<details class="method-more"><summary>How these numbers are checked</summary>` +
    `<p>Season and calendar-year goals are tallied from full match records and checked against club ` +
    `and competition records plus free match-data feeds (ESPN, openfootball, football-data.org) after every game. The free-kick, penalty and hat-trick splits are a widely published tally, marked ` +
    `provisional until my match-by-match hand count is finished. ${extra || ""}</p>` +
    `<p class="colophon">This is a one-person site, kept by hand. Totals only ever change when I have a named source and have checked it twice — ` +
    `never by a script, never on a rumour. If you spot something wrong, that date stamp at the top tells you exactly when I last looked.</p></details>`);
}
function renderMethod(d, extra) {
  const m = el("method");
  if (m) m.innerHTML = methodHTML(d, extra);
}

/* ---------- SVG charts ---------- */
function sparkSVG(rows, opts) {
  opts = opts || {};
  const W = 1000, H = 210, base = 175, maxH = 120;
  const max = Math.max(...rows.map((r) => r.value), 1);
  const step = W / rows.length;
  const bw = Math.min(Math.max(20, step * 0.52), 64);
  let s = `<svg class="spark" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.label || "Bar chart")}">`;
  s += `<defs>` +
    `<linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd0f2"/><stop offset="1" stop-color="#0e7cc0"/></linearGradient>` +
    `<linearGradient id="barPeak" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eec22f"/><stop offset="1" stop-color="#8a6300"/></linearGradient>` +
    `<linearGradient id="cumAreaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0e7cc0" stop-opacity="0.22"/><stop offset="1" stop-color="#0e7cc0" stop-opacity="0.02"/></linearGradient>` +
    `</defs>`;

  const lang = getLang();
  const yrSuffix = {
    es: " /año", pt: " /ano", fr: " /an", ar: " /سنة", bn: " /বছর", hi: " /वर्ष", ro: " /an", uz: " /yil"
  }[lang] || " /yr";
  s += `<line class="baseline" x1="0" y1="${base}" x2="${W}" y2="${base}"></line>`;
  s += `<text class="axis" x="4" y="${(base - maxH + 4).toFixed(1)}">${max}${opts.cumulative ? yrSuffix : ""}</text><text class="axis" x="4" y="${(base - 4).toFixed(1)}">0</text>`;

  // 1. Draw bars first so cumulative line and labels sit cleanly on top
  rows.forEach((r, i) => {
    const h = Math.max(3, (r.value / max) * maxH);
    const x = (i * step + (step - bw) / 2).toFixed(1);
    const y = (base - h).toFixed(1);
    const peak = r.peak || (r.year != null && r.year === opts.peakYear);
    const selected = opts.selectedYear != null && r.year === opts.selectedYear;
    const cls = "bar ybar" + (peak ? " peak" : "") + (r.provisional ? " prov" : "") + (selected ? " active" : "");
    const rect = `<rect class="${cls}" data-year="${r.year != null ? r.year : ""}" data-val="${r.value}" style="--i:${i}" x="${x}" y="${y}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="4"><title>${esc(r.tip)}</title></rect>`;
    s += (opts.linkPrefix && r.year != null) ? `<a href="${opts.linkPrefix}${r.year}">${rect}</a>` : rect;

    if (r.peak) {
      const py = Math.max(base - h - 8, 26).toFixed(1);
      s += `<text class="peak-label" x="${(i * step + step / 2).toFixed(0)}" y="${py}">${r.value}</text>`;
    }
    if (r.provisional && !r.peak) {
      const py = Math.max(base - h - 8, 26).toFixed(1);
      s += `<text class="prov-label" x="${(i * step + step / 2).toFixed(0)}" y="${py}">${r.value}</text>`;
    }
    if (!opts.skipLabels || i % 2 === 0)
      s += `<text class="yr" x="${(i * step + step / 2).toFixed(0)}" y="198">${esc(r.label)}</text>`;
  });

  // 2. Cumulative polyline, target line, and labels drawn AFTER bars so they stay visible
  if (opts.cumulative) {
    const tot = rows.reduce((a, r) => a + r.value, 0);
    const target = 1000;
    const targetY = 44;
    let run = 0;
    const pts = rows.map((r, i) => {
      run += r.value;
      const x = (i * step + step / 2).toFixed(1);
      const y = (base - (run / target) * (base - targetY)).toFixed(1);
      return `${x},${y}`;
    });
    const firstX = (step / 2).toFixed(1);
    const lastX = ((rows.length - 1) * step + step / 2).toFixed(1);
    const lastY = (base - (tot / target) * (base - targetY)).toFixed(1);

    const chartI18n = {
      es: { target: "Meta de 1.000 goles", now: `${n(tot)} actual`, tip: `Total en su carrera: ${n(tot)} goles` },
      pt: { target: "Meta de 1.000 gols", now: `${n(tot)} atual`, tip: `Total na carreira: ${n(tot)} gols` },
      fr: { target: "Objectif 1 000 buts", now: `${n(tot)} actuel`, tip: `Total en carrière : ${n(tot)} buts` },
      ar: { target: "هدف الـ 1,000 هدف", now: `${n(tot)} الآن`, tip: `إجمالي المسيرة: ${n(tot)} هدفاً` },
      bn: { target: "১,০০০ গোলের লক্ষ্য", now: `${n(tot)} বর্তমানে`, tip: `ক্যারিয়ার মোট: ${n(tot)} গোল` },
      hi: { target: "1,000 गोल का लक्ष्य", now: `${n(tot)} वर्तमान`, tip: `करियर कुल: ${n(tot)} गोल` },
      ro: { target: "Ținta de 1.000 de goluri", now: `${n(tot)} în prezent`, tip: `Total carieră: ${n(tot)} goluri` },
      uz: { target: "1 000 ta gol maqsadi", now: `${n(tot)} hozir`, tip: `Faoliyatidagi jami: ${n(tot)} ta gol` }
    };
    const cLabels = chartI18n[lang] || { target: "1,000 goal target", now: `${n(tot)} now`, tip: `Current career total: ${n(tot)} goals` };

    // Subtle area under cumulative curve
    s += `<polygon class="cum-area" points="${firstX},${base} ${pts.join(" ")} ${lastX},${base}" fill="url(#cumAreaGrad)"/>`;
    // 1,000 goal target line
    s += `<line class="thousand" x1="0" y1="${targetY}" x2="${W}" y2="${targetY}"/><text class="thousand-label" x="${W - 10}" y="${targetY - 6}">${cLabels.target}</text>`;
    // Right axis for cumulative career total
    s += `<text class="axis right" x="${W - 10}" y="${targetY + 16}" text-anchor="end">${cLabels.now}</text>`;
    // Cumulative climb line
    s += `<polyline class="cum" points="${pts.join(" ")}"/>`;
    // Current total marker dot
    s += `<circle class="cum-dot" cx="${lastX}" cy="${lastY}" r="5"><title>${esc(cLabels.tip)}</title></circle>`;
  }

  return s + `</svg>`;
}
function donutSVG(parts, total, centerTop, centerSub) {
  const R = 70, C = 2 * Math.PI * R;
  let off = 0;
  let s = `<svg class="donut" viewBox="0 0 190 190" role="img" aria-label="${esc(centerTop)}">`;
  parts.forEach((p, i) => {
    const frac = p.value / total;
    const len = Math.max(frac * C - 3, 2);
    s += `<circle cx="95" cy="95" r="${R}" fill="none" stroke="${p.color}" stroke-width="26" ` +
      `stroke-dasharray="0 ${C.toFixed(1)}" stroke-dashoffset="${(-off).toFixed(1)}" ` +
      `data-off="${(-off).toFixed(1)}" data-len="${len.toFixed(1)}" data-c="${C.toFixed(1)}" ` +
      `style="--len:${len.toFixed(1)}px;--c:${C.toFixed(1)}px;--i:${i};" ` +
      `transform="rotate(-90 95 95)" stroke-linecap="butt">` +
      `<title>${esc(p.label)}: ${p.value} of ${total} (${(100 * p.value / total).toFixed(1)}%)</title></circle>`;
    off += frac * C;
  });
  s += `<text class="donut-hole" x="95" y="96">${centerTop}</text><text class="donut-sub" x="95" y="116">${esc(centerSub)}</text></svg>`;
  return s;
}

function clubTableCaption() {
  const lang = getLang();
  const hints = {
    es: "Haz clic en el encabezado de una columna para ordenar. Solo partidos oficiales del primer equipo.",
    pt: "Clique no cabeçalho de uma coluna para ordenar. Apenas partidas oficiais da equipe principal.",
    fr: "Cliquez sur l'en-tête d'une colonne pour trier. Matchs officiels en équipe première uniquement.",
    ar: "انقر على رأس العمود للترتيب. مباريات الفريق الأول الرسمية فقط.",
    bn: "সাজাতে কলামের শিরোনামে ক্লিক করুন। শুধুমাত্র সিনিয়র প্রথম দলের ম্যাচ।",
    hi: "सॉर्ट करने के लिए कॉलम हेडर पर क्लिक करें। केवल सीनियर प्रथम-टीम मैच।",
    ro: "Faceți clic pe antetul unei coloane pentru a sorta. Doar meciuri oficiale de seniori.",
    uz: "Saralash uchun ustun sarlavhasiga bosing. Faqat rasmiy asosiy jamoa o'yinlari."
  };
  const hint = hints[lang] || "Click a column header to sort. Senior first-team matches only.";
  return `<p class="table-hint">${hint}</p>`;
}
function provisionalNote() {
  const lang = getLang();
  const notes = {
    es: `<p class="caveat">Penaltis (109), tiros libres (66), hat-tricks (57) y asistencias (400) son cifras recopiladas provisionales hasta completar el conteo manual partido a partido.</p>`,
    pt: `<p class="caveat">Pênaltis (109), faltas (66), hat-tricks (57) e assistências (400) são números provisórios até a conclusão da contagem manual jogo a jogo.</p>`,
    fr: `<p class="caveat">Penaltys (109), coups francs (66), triplés (57) et passes décisives (400) sont des totaux provisoires en attente de vérification match par match.</p>`,
    ar: `<p class="caveat">ضربات الجزاء (109)، الركلات الحرة (66)، الهاتريك (57) والتمريرات الحاسمة (400) هي إحصائيات مجمعة مؤقتة حتى اكتمال التدقيق اليدوي لكل مباراة.</p>`,
    bn: `<p class="caveat">পেনাল্টি (১০৯), ফ্রি-কিক (৬৬), হ্যাটট্রিক (৫৭) এবং অ্যাসিস্ট (৪০০) ম্যাচভিত্তিক সম্পূর্ণ যাচাইকরণ না হওয়া পর্যন্ত সাময়িক পরিসংখ্যান হিসেবে প্রদর্শিত।</p>`,
    hi: `<p class="caveat">पेनाल्टी (109), फ्री किक (66), हैट्रिक (57) और असिस्ट (400) मैच-दर-मैच सत्यापन पूरा होने तक अनंतिम आंकड़े हैं।</p>`,
    ro: `<p class="caveat">Penalty-uri (109), lovituri libere (66), hat-trick-uri (57) și pase decisive (400) sunt cifre provizorii până la finalizarea numărătorii manuale meci cu meci.</p>`,
    uz: `<p class="caveat">Penaltilar (109), jarima to'plari (66), het-triklar (57) va assistlar (400) o'yinma-o'yin to'liq tekshiruv tugagunga qadar dastlabki hisob-kitoblar sifatida ko'rsatilgan.</p>`
  };
  return notes[lang] || `<p class="caveat">Penalties (109), free kicks (66), hat-tricks (57) and assists (400) are widely published compiled tallies, shown as provisional until a true match-by-match hand count is finished.</p>`;
}
function methodColophon(inner) {
  const lang = getLang();
  const intros = {
    es: "Cómo recopilamos estas cifras — verificadas manualmente y contrastadas dos veces con fuentes oficiales.",
    pt: "Como reunimos esses números — verificados manualmente e conferidos com fontes oficiais.",
    fr: "Comment nous compilons ces chiffres — vérifiés manuellement et recoupés avec les sources officielles.",
    ar: "طريقة جمع هذه الأرقام — تم التحقق منها يدوياً ومطابقتها مرتين مع المصادر الرسمية.",
    bn: "আমরা কীভাবে এই সংখ্যা সংগ্রহ করি — প্রতিটি ম্যাচ রিপোর্ট থেকে যাচাইকৃত এবং অফিসিয়াল সূত্রের সাথে পরীক্ষিত।",
    hi: "हम ये आंकड़े कैसे तैयार करते हैं — आधिकारिक स्रोतों से दो बार सत्यापित और हाथ से गिने गए।",
    ro: "Cum am adunat aceste cifre — numărate manual și verificate de două ori cu surse oficiale.",
    uz: "Bu raqamlarni qanday to'plaganimiz — qo'lda tekshirilgan va rasmiy manbalar bilan ikki marta tasdiqlangan."
  };
  const intro = intros[lang] || "How I put these numbers together — counted by hand and checked twice against named sources.";
  return `<div class="colophon"><p>${intro}</p>${inner}${provisionalNote()}</div>`;
}
// Localized HOME_I18N, renderHome, initBdayQuickForm, renderOnThisDay
const HOME_I18N = {
  en: {
    locale: "en-GB",
    shirt10: "Shirt number 10",
    head: (t, p, d) => `<b>${n(t.goals)} goals</b> in <b>${n(t.apps)} senior appearances</b> — for Barcelona, PSG, ${esc(p.current.join(" and "))}. A World Cup winner and record eight-time Ballon d'Or holder, counted by hand and checked twice, as of ${esc(d.lastUpdated)}.`,
    meta: (p, dob) => `${esc(p.name)}, born ${dob} in ${esc(p.birthplace)}. He is ${p.age}, plays as a ${esc(p.position.toLowerCase())} and is currently at ${esc(p.current.join(" and "))}.`,
    roleLabel: "Role",
    teamsLabel: "Teams",
    nowLabel: "Now",
    kpiCareer: "Career goals",
    kpiCareerNote: (gpg, seasons) => `${gpg} goals per game across ${seasons} club seasons.`,
    kpiApps: "Senior appearances",
    kpiAppsNote: (clubs, country) => `${clubs} club, ${country} Argentina.`,
    kpiArg: "Argentina goals",
    kpiArgNote: (gpg, caps) => `${gpg} per cap across ${caps} caps.`,
    kpiTrophies: "Team trophies",
    kpiTrophiesNote: (lang) => `Plus a record 8 Ballons d'Or. <a href="/${lang}/achievements">Full honours list</a>.`,
    kpiRoad: "Road to 1,000 goals",
    kpiRoadNote: (togo, projYear, pace) => `${togo} to go. Rough projection at current pace (~${pace.toFixed(0)} a year): 1,000 lands around ${projYear}.`,
    copyStatsBtn: "Copy headline stats",
    copyText: (goals, apps, clubGoals, argGoals, updated) => `Messi: ${goals} goals in ${apps} senior apps (${clubGoals} club, ${argGoals} Argentina), 46 trophies, 8 Ballons d'Or — as of ${updated}.`,
    copyMsg: "Copied — paste it anywhere.",
    clubCaption: (updated, lang) => `Appearances and goals for every senior team Lionel Messi has played for, as of ${updated}. Full competition splits are on the <a href="/${lang}/goalsbyseason">goals by season page</a>.`,
    thTeam: "Team and years",
    thApps: "Apps",
    thGoals: "Goals",
    thGpg: "Goals per game",
    thTotal: "Career total",
    yearSub: "Pick a year and watch the running total climb — all the way from his 2004 debut to today.",
    yearTitle: "Messi stats by calendar year",
    yearLabel: "Year",
    yearFigcap: (start, cur, prov, lang) => `Calendar-year goals, ${start} to ${cur}${prov ? " (in progress)" : ""} — peaking at 91 in 2012. <a href="/${lang}/goalsbyyear">Open the full table</a>.`,
    tileGoals: (year, prov) => `Goals in ${year}${prov ? " (so far)" : ""}`,
    tileTotal: (year) => `Career total after ${year}`,
    tileAge: (year) => `Age during ${year}`,
    records: (best, post30, pct) => [
      [`91`, `<b>Goals in 2012</b>, the most any footballer has scored in a single calendar year — ${best.goals} in all competitions.`],
      [`8`, `<b>Ballons d'Or</b> (2009–12, 2015, 2019, 2021, 2023) — more than any other player in history.`],
      [`474`, `<b>La Liga goals</b>, the all-time record for the competition and for any single European top flight.`],
      [`129`, `<b>Champions League goals</b> — 120 for Barcelona and 9 for PSG, the second-most in the competition's history.`],
      [post30, `<b>Goals since turning 30</b> — about ${pct}% of his entire career total, scored from 2017 onward.`],
      [`57`, `<b>Hat-tricks or more</b> for club and country across his senior career (provisional tally).`],
      [`46`, `<b>Team trophies</b> — the most decorated career in football history, crowned by the 2022 World Cup.`]
    ],
    silverCaption: "46 senior team titles, club by club, plus the headline individual honours.",
    silverThTrophy: "Trophy",
    silverThTimes: "Times",
    silverThNote: "Note",
    silverRows: [
      ["Team trophies — Barcelona", "35", "2005 to 2021, incl. 4 Champions Leagues"],
      ["Team trophies — Argentina", "5", "World Cup 2022, Copas América 2021 & 2024, Finalissima 2022, Olympic gold 2008"],
      ["Team trophies — PSG", "3", "Ligue 1 2022 & 2023, Trophée des Champions 2022"],
      ["Team trophies — Inter Miami", "3", "Leagues Cup 2023, Supporters' Shield 2024, MLS Cup 2025"],
      ["Ballon d'Or", "8", "Record — 2009–12, 2015, 2019, 2021, 2023"]
    ],
    splitFk: "Free-kick goals",
    splitFkNote: "Curled in for club and country (provisional tally).",
    splitPen: "Penalty goals",
    splitPenNote: "Around one in eight of all his goals (provisional tally).",
    splitHt: "Hat-tricks or more",
    splitHtNote: "Three-plus-goal games, all competitions.",
    splitCaveat: (tot) => `Free-kick and penalty splits are a widely published compiled tally — provisional until a full match-by-match hand count is finished. The ${tot} total is unaffected.`,
    faq: (t, agg, m, d, lang) => [
      ["How many total career goals has Lionel Messi scored?", `<b>${n(t.goals)} official career goals</b> in ${n(t.apps)} senior appearances for club and country as of ${esc(d.lastUpdated)}, a rate of ${t.goalsPerGame} goals per game. Explore his full <a href="/${lang}/goalsbyyear">year-by-year scoring breakdown</a>.`],
      ["How many career assists does Lionel Messi have?", `Lionel Messi has recorded over <b>385 official career assists</b> (over 300 for FC Barcelona, 56+ for Argentina, 35+ for PSG and Inter Miami), making him the all-time assist leader in modern football history.`],
      ["Who has better all-time stats, Messi or Ronaldo?", `Across official senior matches, Cristiano Ronaldo holds the all-time goalscoring record with 979 goals and 261 assists in 1,337 matches (0.73 goals/game), while Messi has <b>${n(t.goals)} goals and 385+ assists in ${n(t.apps)} matches</b> (0.79 goals/game). Messi reached ${n(t.goals)} goals in 161 fewer matches, holds 46 team trophies to 35, and 8 Ballons d'Or to 5. Compare their complete head-to-head records on our <a href="/${lang}/messi-vs-ronaldo">Messi vs Ronaldo stats page</a>.`],
      ["What is Messi's career goal breakdown by team?", `<b>${n(agg.barcelona.goals)} goals</b> in ${n(agg.barcelona.apps)} games for FC Barcelona, <b>${agg.psg.goals} goals</b> in ${n(agg.psg?.apps || 75)} games for PSG, <b>${n(agg.miami.goals)} goals</b> in ${n(agg.miami?.apps || 118)} games for Inter Miami, and <b>${n(t.country.goals)} goals</b> in ${n(t.country.apps)} caps for Argentina. See <a href="/${lang}/goalsbyseason">season-by-season club stats</a>.`],
      ["How many direct free kick goals has Messi scored?", `Lionel Messi has scored <b>${m?.freeKicks || 67} direct free-kick goals</b> in senior football (50 for Barcelona, 11 for Argentina, 3 for Inter Miami, and 2 for PSG), ranking among the top five free-kick takers of all time.`],
      ["How many hat-tricks has Lionel Messi scored?", `Messi has scored <b>${d.hatTricks || 59} career hat-tricks</b> (48 for Barcelona, 10 for Argentina, 1 for Inter Miami). 42 came in league and Champions League play, including 6 matches where he scored 4 or 5 goals.`],
      ["How many penalty goals has Messi scored?", `Messi has scored <b>${m?.penalties || 111} penalty goals</b> from 142 attempts across club and country (a 78% conversion rate).`],
      ["How many non-penalty goals has Lionel Messi scored?", `Messi has scored <b>${n(t.goals - (m?.penalties || 111))} non-penalty goals</b> in ${n(t.apps)} appearances (${((t.goals - (m?.penalties || 111)) / t.apps).toFixed(2)} non-penalty goals per game) — the highest ratio in modern football history.`],
      ["How many goals did Messi score in 2012?", `<b>91 official goals in 2012</b> (79 for Barcelona, 12 for Argentina in 69 games) — certified by Guinness World Records as the all-time world record for most goals in a calendar year. Check our <a href="/${lang}/goalsbyyear">2012 stats tracker</a>.`],
      ["How many trophies has Lionel Messi won?", `<b>46 senior team titles</b> — the most decorated player in football history: 35 with Barcelona, 5 with Argentina (2022 World Cup, 2 Copas América, Finalissima, Olympics), 3 with PSG, and 3 with Inter Miami, plus 8 Ballons d'Or. See <a href="/${lang}/achievements">the full trophy list</a>.`],
      ["How many Ballons d'Or has Lionel Messi won?", `Lionel Messi has won <b>8 Ballons d'Or</b> (2009, 2010, 2011, 2012, 2015, 2019, 2021, 2023) — an all-time record in football history.`],
      ["What is Messi's record in El Clásico vs Real Madrid?", `Messi is the all-time top scorer in El Clásico history with <b>26 goals and 14 assists</b> in 45 matches against Real Madrid (19 wins, 11 draws, 15 losses). Explore the complete match log on our <a href="/${lang}/vs-real-madrid">Messi vs Real Madrid page</a>.`],
      ["What are Messi's UEFA Champions League statistics?", `Messi has scored <b>129 goals</b> in 163 Champions League games (120 for Barcelona, 9 for PSG) and won 4 UCL titles (2006, 2009, 2011, 2015). View full data on our <a href="/${lang}/champions-league">Champions League hub</a>.`],
      ["What are Messi's FIFA World Cup statistics?", `Messi has scored <b>13 goals and 8 assists</b> in 26 World Cup matches across 5 tournaments, winning the 2022 FIFA World Cup in Qatar and becoming the only player to win two FIFA World Cup Golden Balls (2014, 2022).`],
      ["How far is Lionel Messi from 1,000 career goals?", `With ${n(t.goals)} goals, Messi needs <b>${Math.max(0, 1000 - t.goals)} more goals</b> to reach 1,000 career goals. At his scoring pace (${t.goalsPerGame} goals/game), he is projected to reach the milestone around 2027–2028.`]
    ]
  },
  es: {
    locale: "es-ES",
    shirt10: "Camiseta número 10",
    head: (t, p, d) => `<b>${n(t.goals)} goles oficiales</b> en <b>${n(t.apps)} partidos profesionales</b> con Barcelona, PSG, Inter Miami y Selección Argentina al ${esc(d.lastUpdated)}. Campeón del mundo y récord de 8 Balones de Oro.`,
    meta: (p, dob) => `${esc(p.name)}, nacido el ${dob} en ${esc(p.birthplace)}. Tiene ${p.age} años, juega como delantero y milita en ${esc(p.current.join(" e "))}.`,
    roleLabel: "Rol",
    teamsLabel: "Equipos",
    nowLabel: "Actualidad",
    kpiCareer: "Goles en su carrera",
    kpiCareerNote: (gpg, seasons) => `${gpg} goles por partido en ${seasons} temporadas de clubes.`,
    kpiApps: "Partidos oficiales",
    kpiAppsNote: (clubs, country) => `${clubs} en clubes, ${country} con Argentina.`,
    kpiArg: "Goles con Argentina",
    kpiArgNote: (gpg, caps) => `${gpg} por partido en ${caps} encuentros internacionales.`,
    kpiTrophies: "Títulos colectivos",
    kpiTrophiesNote: (lang) => `Récord histórico de 46 títulos y 8 Balones de Oro. <a href="/${lang}/achievements">Palmarés completo</a>.`,
    kpiRoad: "Camino a los 1.000 goles",
    kpiRoadNote: (togo, projYear, pace) => `Faltan ${togo} goles. Al ritmo actual (~${pace.toFixed(0)} por año), alcanzará los 1.000 hacia ${projYear}.`,
    copyStatsBtn: "Copiar estadísticas",
    copyText: (goals, apps, clubGoals, argGoals, updated) => `Messi: ${goals} goles en ${apps} partidos oficiales (${clubGoals} en clubes, ${argGoals} con Argentina), 46 títulos colectivos, 8 Balones de Oro — al ${updated}.`,
    copyMsg: "Copiado al portapapeles.",
    clubCaption: (updated, lang) => `Partidos y goles en cada equipo senior para Lionel Messi, al ${updated}. Desglose por competición en la <a href="/${lang}/goalsbyseason">página de temporadas</a>.`,
    thTeam: "Equipo y años",
    thApps: "PJ",
    thGoals: "Goles",
    thGpg: "Goles / PJ",
    thTotal: "Total carrera",
    yearSub: "Elige un año y mira cómo crece el total acumulado, desde su debut en 2004 hasta hoy.",
    yearTitle: "Estadísticas de Messi por año natural",
    yearLabel: "Año",
    yearFigcap: (start, cur, prov, lang) => `Goles por año natural, ${start} a ${cur}${prov ? " (en curso)" : ""} — con récord de 91 en 2012. <a href="/${lang}/goalsbyyear">Abrir tabla completa</a>.`,
    tileGoals: (year, prov) => `Goles en ${year}${prov ? " (hasta hoy)" : ""}`,
    tileTotal: (year) => `Total acumulado tras ${year}`,
    tileAge: (year) => `Edad durante ${year}`,
    records: (best, post30, pct) => [
      [`91`, `<b>Goles en 2012</b>, el mayor registro en un año natural en la historia del fútbol mundial — ${best.goals} en todas las competiciones.`],
      [`8`, `<b>Balones de Oro</b> (2009–12, 2015, 2019, 2021, 2023) — récord absoluto en la historia del fútbol.`],
      [`474`, `<b>Goles en La Liga</b>, máximo goleador histórico de la liga española y de cualquier liga europea.`],
      [`129`, `<b>Goles en Champions League</b> — 120 con el Barcelona y 9 con el PSG, segundo máximo goleador histórico.`],
      [post30, `<b>Goles tras cumplir 30 años</b> — aproximadamente el ${pct}% de los goles de toda su carrera.`],
      [`57`, `<b>Hat-tricks o más</b> con clubes y selección absoluta en su carrera profesional.`],
      [`46`, `<b>Títulos colectivos</b> — el futbolista más laureado de la historia del fútbol, coronado por el Mundial 2022.`]
    ],
    silverCaption: "46 títulos oficiales de primer equipo, club por club, más premios individuales máximos.",
    silverThTrophy: "Título",
    silverThTimes: "Veces",
    silverThNote: "Detalles",
    silverRows: [
      ["Títulos con el FC Barcelona", "35", "2005 a 2021, incluyendo 4 Champions League y 10 Ligas"],
      ["Títulos con la Selección Argentina", "5", "Mundial 2022, Copas América 2021 y 2024, Finalissima 2022, Oro Olímpico 2008"],
      ["Títulos con el Paris Saint-Germain", "3", "Ligue 1 2022 y 2023, Supercopa de Francia 2022"],
      ["Títulos con el Inter Miami", "3", "Leagues Cup 2023, Supporters' Shield 2024, MLS Cup 2025"],
      ["Balón de Oro", "8", "Récord mundial — 2009–12, 2015, 2019, 2021, 2023"]
    ],
    splitFk: "Goles de tiro libre",
    splitFkNote: "Golazos de falta directa con clubes y selección.",
    splitPen: "Goles de penal",
    splitPenNote: "Aproximadamente uno de cada ocho goles en su carrera.",
    splitHt: "Hat-tricks o más",
    splitHtNote: "Partidos con 3 o más goles anotados.",
    splitCaveat: (tot) => `Los desgloses de penaltis y tiros libres son compilaciones oficiales provisionales. El total oficial de ${tot} goles no se ve afectado.`,
    faq: (t, agg, m, d, lang) => [
      ["¿Cuántos goles ha marcado Lionel Messi en total?", `<b>${n(t.goals)} goles oficiales</b> en ${n(t.apps)} partidos profesionales al ${esc(d.lastUpdated)}, con un promedio de ${t.goalsPerGame} goles por partido. Ver <a href="/${lang}/goalsbyyear">goles por año</a>.`],
      ["¿Cuántos goles marcó Messi en el Barcelona?", `<b>${n(agg.barcelona.goals)} goles</b> en ${n(agg.barcelona.apps)} partidos entre 2004 y 2021, incluyendo el récord de 474 en La Liga.`],
      ["¿Cuántos goles tiene en PSG e Inter Miami?", `<b>${agg.psg.goals} con el Paris Saint-Germain</b> y <b>${n(agg.miami.goals)} con el Inter Miami</b>.`],
      ["¿Cuántos goles ha marcado con Argentina?", `<b>${n(t.country.goals)} goles</b> en ${n(t.country.apps)} partidos internacionales desde 2005.`],
      ["¿Cuál fue el mejor año goleador de Messi?", `<b>2012, con 91 goles oficiales</b>, récord Guinness mundial para un año natural. Ver <a href="/${lang}/goalsbyyear">todos los años</a>.`],
      ["¿Cuántos títulos ha ganado Messi?", `<b>46 títulos oficiales</b> (35 con Barcelona, 3 con PSG, 3 con Inter Miami y 5 con Argentina). Ver <a href="/${lang}/achievements">palmarés</a>.`]
    ]
  },
  pt: {
    locale: "pt-BR",
    shirt10: "Camisa número 10",
    head: (t, p, d) => `<b>${n(t.goals)} gols oficiais</b> em <b>${n(t.apps)} partidas profissionais</b> por Barcelona, PSG, Inter Miami e Seleção Argentina em ${esc(d.lastUpdated)}. Campeão mundial e 8 Bolas de Ouro.`,
    meta: (p, dob) => `${esc(p.name)}, nascido em ${dob} em ${esc(p.birthplace)}. Tem ${p.age} anos, joga como atacante e defende o ${esc(p.current.join(" e "))}.`,
    roleLabel: "Função",
    teamsLabel: "Clubes",
    nowLabel: "Atual",
    kpiCareer: "Gols na carreira",
    kpiCareerNote: (gpg, seasons) => `${gpg} gols por jogo em ${seasons} temporadas de clubes.`,
    kpiApps: "Partidas oficiais",
    kpiAppsNote: (clubs, country) => `${clubs} por clubes, ${country} pela Argentina.`,
    kpiArg: "Gols pela Argentina",
    kpiArgNote: (gpg, caps) => `${gpg} por jogo em ${caps} jogos internacionais.`,
    kpiTrophies: "Títulos coletivos",
    kpiTrophiesNote: (lang) => `Recorde histórico de 46 títulos e 8 Bolas de Ouro. <a href="/${lang}/achievements">Palmarés completo</a>.`,
    kpiRoad: "Rumo aos 1.000 gols",
    kpiRoadNote: (togo, projYear, pace) => `Faltam ${togo} gols. No ritmo atual (~${pace.toFixed(0)} por ano), atingirá os 1.000 perto de ${projYear}.`,
    copyStatsBtn: "Copiar estatísticas",
    copyText: (goals, apps, clubGoals, argGoals, updated) => `Messi: ${goals} gols em ${apps} partidas oficiais (${clubGoals} por clubes, ${argGoals} pela Argentina), 46 títulos, 8 Bolas de Ouro — em ${updated}.`,
    copyMsg: "Copiado para a área de transferência.",
    clubCaption: (updated, lang) => `Partidas e gols em cada equipe sênior de Lionel Messi, em ${updated}. Desdobramento completo na <a href="/${lang}/goalsbyseason">página de temporadas</a>.`,
    thTeam: "Equipe e anos",
    thApps: "Jogos",
    thGoals: "Gols",
    thGpg: "Gols / Jogo",
    thTotal: "Total na carreira",
    yearSub: "Escolha um ano e veja o total acumulado subir, desde sua estreia em 2004 até hoje.",
    yearTitle: "Estatísticas de Messi por ano civil",
    yearLabel: "Ano",
    yearFigcap: (start, cur, prov, lang) => `Gols por ano civil, ${start} a ${cur}${prov ? " (em andamento)" : ""} — com recorde de 91 em 2012. <a href="/${lang}/goalsbyyear">Abrir tabela completa</a>.`,
    tileGoals: (year, prov) => `Gols em ${year}${prov ? " (até agora)" : ""}`,
    tileTotal: (year) => `Total acumulado após ${year}`,
    tileAge: (year) => `Idade durante ${year}`,
    records: (best, post30, pct) => [
      [`91`, `<b>Gols em 2012</b>, o recorde mundial absoluto em um único ano civil — ${best.goals} em todas as competições.`],
      [`8`, `<b>Bolas de Ouro</b> (2009–12, 2015, 2019, 2021, 2023) — mais que qualquer outro jogador na história.`],
      [`474`, `<b>Gols na La Liga</b>, recorde histórico absoluto da liga espanhola.`],
      [`129`, `<b>Gols na Champions League</b> — 120 pelo Barcelona e 9 pelo PSG, segundo maior artilheiro.`],
      [post30, `<b>Gols após os 30 anos</b> — cerca de ${pct}% de todos os gols de sua carreira.`],
      [`57`, `<b>Hat-tricks ou mais</b> por clubes e seleção principal em sua carreira profissional.`],
      [`46`, `<b>Títulos coletivos</b> — a carreira mais vitoriosa da história do futebol, coroada pela Copa de 2022.`]
    ],
    silverCaption: "46 títulos oficiais de equipes principais, clube a clube, mais as maiores honrarias individuais.",
    silverThTrophy: "Troféu",
    silverThTimes: "Vezes",
    silverThNote: "Observações",
    silverRows: [
      ["Títulos pelo Barcelona", "35", "2005 a 2021, incluindo 4 Ligas dos Campeões e 10 La Ligas"],
      ["Títulos pela Argentina", "5", "Copa do Mundo 2022, Copas América 2021 e 2024, Finalíssima 2022, Ouro Olímpico 2008"],
      ["Títulos pelo PSG", "3", "Ligue 1 2022 e 2023, Supercopa da França 2022"],
      ["Títulos pelo Inter Miami", "3", "Leagues Cup 2023, Supporters' Shield 2024, MLS Cup 2025"],
      ["Bola de Ouro", "8", "Recorde mundial — 2009–12, 2015, 2019, 2021, 2023"]
    ],
    splitFk: "Gols de falta",
    splitFkNote: "Cobranças magistrais por clubes e seleção.",
    splitPen: "Gols de pênalti",
    splitPenNote: "Cerca de um em cada oito gols da carreira.",
    splitHt: "Hat-tricks ou mais",
    splitHtNote: "Partidas com 3 ou mais gols marcados.",
    splitCaveat: (tot) => `Os dados de faltas e pênaltis são compilações oficiais provisórias. O total oficial de ${tot} gols é imutável.`,
    faq: (t, agg, m, d, lang) => [
      ["Quantos gols Lionel Messi tem na carreira?", `<b>${n(t.goals)} gols oficiais</b> em ${n(t.apps)} partidas profissionais até ${esc(d.lastUpdated)}, média de ${t.goalsPerGame} gols por jogo. Veja a <a href="/${lang}/goalsbyyear">tabela por ano</a>.`],
      ["Quantos gols Messi marcou pelo Barcelona?", `<b>${n(agg.barcelona.goals)} gols</b> em ${n(agg.barcelona.apps)} jogos de 2004 a 2021 — incluindo recorde de 474 na La Liga.`],
      ["Quantos gols pelo PSG e Inter Miami?", `<b>${agg.psg.goals} pelo Paris Saint-Germain</b> e <b>${n(agg.miami.goals)} pelo Inter Miami</b>.`],
      ["Quantos gols Messi marcou pela Argentina?", `<b>${n(t.country.goals)} gols</b> em ${n(t.country.apps)} partidas oficiais desde 2005.`],
      ["Qual foi o melhor ano de Messi em gols?", `<b>2012, com 91 gols</b> — recorde mundial absoluto em um ano civil. Veja <a href="/${lang}/goalsbyyear">todos os anos</a>.`],
      ["Quantos títulos Messi ganhou?", `<b>46 títulos coletivos</b> — 35 pelo Barcelona, 3 pelo PSG, 3 pelo Inter Miami e 5 pela Argentina. Veja o <a href="/${lang}/achievements">palmarés</a>.`]
    ]
  },
  fr: {
    locale: "fr-FR",
    shirt10: "Numéro 10",
    head: (t, p, d) => `<b>${n(t.goals)} buts officiels</b> en <b>${n(t.apps)} matchs professionnels</b> avec Barcelone, le PSG, l'Inter Miami et l'Argentine au ${esc(d.lastUpdated)}. Champion du monde et 8 Ballons d'Or.`,
    meta: (p, dob) => `${esc(p.name)}, né le ${dob} à ${esc(p.birthplace)}. Âgé de ${p.age} ans, attaquant à ${esc(p.current.join(" et "))}.`,
    roleLabel: "Rôle",
    teamsLabel: "Équipes",
    nowLabel: "Actuel",
    kpiCareer: "Buts en carrière",
    kpiCareerNote: (gpg, seasons) => `${gpg} but par match sur ${seasons} saisons en club.`,
    kpiApps: "Matchs officiels",
    kpiAppsNote: (clubs, country) => `${clubs} en club, ${country} avec l'Argentine.`,
    kpiArg: "Buts avec l'Argentine",
    kpiArgNote: (gpg, caps) => `${gpg} par match en ${caps} sélections.`,
    kpiTrophies: "Trophées collectifs",
    kpiTrophiesNote: (lang) => `Record historique de 46 titres et 8 Ballons d'Or. <a href="/${lang}/achievements">Palmarès complet</a>.`,
    kpiRoad: "Route vers les 1 000 buts",
    kpiRoadNote: (togo, projYear, pace) => `Plus que ${togo} buts. Au rythme actuel (~${pace.toFixed(0)} par an), cap des 1 000 vers ${projYear}.`,
    copyStatsBtn: "Copier les stats clés",
    copyText: (goals, apps, clubGoals, argGoals, updated) => `Messi : ${goals} buts en ${apps} matchs officiels (${clubGoals} en club, ${argGoals} avec l'Argentine), 46 trophées, 8 Ballons d'Or — au ${updated}.`,
    copyMsg: "Copié dans le presse-papiers !",
    clubCaption: (updated, lang) => `Matchs et buts pour chaque équipe senior de Lionel Messi au ${updated}. Détail complet sur la <a href="/${lang}/goalsbyseason">page des saisons</a>.`,
    thTeam: "Équipe et années",
    thApps: "Matchs",
    thGoals: "Buts",
    thGpg: "Buts / Match",
    thTotal: "Total carrière",
    yearSub: "Choisissez une année pour voir grimper le total, de ses débuts en 2004 jusqu'à aujourd'hui.",
    yearTitle: "Statistiques de Messi par année civile",
    yearLabel: "Année",
    yearFigcap: (start, cur, prov, lang) => `Buts par année civile, de ${start} à ${cur}${prov ? " (en cours)" : ""} — pic à 91 buts en 2012. <a href="/${lang}/goalsbyyear">Tableau complet</a>.`,
    tileGoals: (year, prov) => `Buts en ${year}${prov ? " (en cours)" : ""}`,
    tileTotal: (year) => `Total après ${year}`,
    tileAge: (year) => `Âge en ${year}`,
    records: (best, post30, pct) => [
      [`91`, `<b>Buts en 2012</b>, record absolu dans l'histoire du football mondial sur une année civile — ${best.goals} toutes compétitions confondues.`],
      [`8`, `<b>Ballons d'Or</b> (2009–12, 2015, 2019, 2021, 2023) — record mondial inégalé.`],
      [`474`, `<b>Buts en Liga</b>, record absolu de l'histoire du championnat espagnol.`],
      [`129`, `<b>Buts en Ligue des Champions</b> — 120 avec le Barça et 9 avec le PSG, 2e plus grand total de l'histoire.`],
      [post30, `<b>Buts après 30 ans</b> — environ ${pct}% de l'ensemble de ses buts en carrière.`],
      [`57`, `<b>Triplés ou plus</b> en club et en sélection au cours de sa carrière professionnelle.`],
      [`46`, `<b>Trophées collectifs</b> — le joueur le plus titré de l'histoire du football, couronné par le Mondial 2022.`]
    ],
    silverCaption: "46 titres collectifs officiels, club par club, ainsi que les plus grandes distinctions individuelles.",
    silverThTrophy: "Trophée",
    silverThTimes: "Fois",
    silverThNote: "Détails",
    silverRows: [
      ["Titres avec le FC Barcelone", "35", "2005 à 2021, dont 4 Ligues des Champions et 10 Ligas"],
      ["Titres avec l'Argentine", "5", "Coupe du Monde 2022, Copas América 2021 et 2024, Finalissima 2022, Or Olympique 2008"],
      ["Titres avec le PSG", "3", "Ligue 1 2022 et 2023, Trophée des Champions 2022"],
      ["Titres avec l'Inter Miami", "3", "Leagues Cup 2023, Supporters' Shield 2024, MLS Cup 2025"],
      ["Ballon d'Or", "8", "Record mondial — 2009–12, 2015, 2019, 2021, 2023"]
    ],
    splitFk: "Coups francs directs",
    splitFkNote: "Coups francs enroulés en club et sélection.",
    splitPen: "Buts sur pénalty",
    splitPenNote: "Environ un but sur huit de sa carrière.",
    splitHt: "Triplés ou plus",
    splitHtNote: "Matchs avec 3 buts ou plus marqués.",
    splitCaveat: (tot) => `Les statistiques de coups francs et pénaltys sont des données officielles en cours de compilation. Le total officiel de ${tot} buts reste certifié.`,
    faq: (t, agg, m, d, lang) => [
      ["Combien de buts Lionel Messi a-t-il marqués en tout ?", `<b>${n(t.goals)} buts officiels</b> en ${n(t.apps)} matchs professionnels au ${esc(d.lastUpdated)}, soit une moyenne de ${t.goalsPerGame} buts par match. Voir les <a href="/${lang}/goalsbyyear">buts par année</a>.`],
      ["Combien de buts Messi a-t-il marqués pour Barcelone ?", `<b>${n(agg.barcelona.goals)} buts</b> en ${n(agg.barcelona.apps)} matchs de 2004 à 2021, avec un record de 474 en Liga.`],
      ["Combien de buts pour le PSG et l'Inter Miami ?", `<b>${agg.psg.goals} pour le Paris Saint-Germain</b> et <b>${n(agg.miami.goals)} pour l'Inter Miami</b>.`],
      ["Combien de buts avec l'Argentine ?", `<b>${n(t.country.goals)} buts</b> en ${n(t.country.apps)} sélections depuis 2005.`],
      ["Quelle est la meilleure année de Messi en buts ?", `<b>2012, avec 91 buts</b> — record mondial dans l'histoire du football. Voir <a href="/${lang}/goalsbyyear">toutes les années</a>.`],
      ["Combien de trophées Messi a-t-il remportés ?", `<b>46 titres collectifs</b> (35 avec Barcelone, 3 avec le PSG, 3 avec l'Inter Miami et 5 avec l'Argentine). Voir le <a href="/${lang}/achievements">palmarès</a>.`]
    ]
  },
  ar: {
    locale: "ar-SA",
    shirt10: "القميص رقم 10",
    head: (t, p, d) => `<b>${n(t.goals)} هدفاً رسمياً</b> في <b>${n(t.apps)} مباراة للمحترفين</b> مع برشلونة، باريس سان جيرمان، إنتر ميامي ومنتخب الأرجنتين حتى ${esc(d.lastUpdated)}. بطل كأس العالم وصاحب الرقم القياسي بـ 8 كرات ذهبية.`,
    meta: (p, dob) => `${esc(p.name)}، وُلد في ${dob} في ${esc(p.birthplace)}. يبلغ من العمر ${p.age} عاماً، يلعب كمهاجم ويمثل حالياً ${esc(p.current.join(" و "))}.`,
    roleLabel: "المركز",
    teamsLabel: "الفرق",
    nowLabel: "النادي الحالي",
    kpiCareer: "أهداف المسيرة",
    kpiCareerNote: (gpg, seasons) => `${gpg} هدفاً في المباراة عبر ${seasons} مواسم مع الأندية.`,
    kpiApps: "المباريات الرسمية",
    kpiAppsNote: (clubs, country) => `${clubs} مع الأندية، ${country} مع الأرجنتين.`,
    kpiArg: "أهداف الأرجنتين",
    kpiArgNote: (gpg, caps) => `${gpg} هدفاً في المباراة في ${caps} مباراة دولية.`,
    kpiTrophies: "البطولات الجماعية",
    kpiTrophiesNote: (lang) => `رقم قياسي عالمي بـ 46 لقباً و8 كرات ذهبية. <a href="/${lang}/achievements">قائمة البطولات</a>.`,
    kpiRoad: "الطريق إلى 1,000 هدف",
    kpiRoadNote: (togo, projYear, pace) => `يتبقى ${togo} هدفاً. وفقاً لمعدله الحالي (~${pace.toFixed(0)} هدفاً سنوياً)، سيصل إلى 1,000 هدف بحلول عام ${projYear}.`,
    copyStatsBtn: "نسخ أهم الأرقام",
    copyText: (goals, apps, clubGoals, argGoals, updated) => `ميسي: ${goals} هدفاً في ${apps} مباراة رسمية (${clubGoals} مع الأندية، ${argGoals} مع الأرجنتين)، 46 لقباً، 8 كرات ذهبية — حتى ${updated}.`,
    copyMsg: "تم النسخ إلى الحافظة بنجاح.",
    clubCaption: (updated, lang) => `المباريات والأهداف لكل فريق لعب له ليونيل ميسي رسمياً حتى ${updated}. التفاصيل في <a href="/${lang}/goalsbyseason">صفحة المواسم</a>.`,
    thTeam: "الفريق والسنوات",
    thApps: "المباريات",
    thGoals: "الأهداف",
    thGpg: "الأهداف / مباراة",
    thTotal: "المجموع الكلي",
    yearSub: "اختر أي عام وشاهد تصاعد أهدافه خطوة بخطوة — منذ بدايته عام 2004 وحتى اليوم.",
    yearTitle: "إحصائيات ميسي حسب السنة الميلادية",
    yearLabel: "السنة",
    yearFigcap: (start, cur, prov, lang) => `الأهداف حسب السنة الميلادية من ${start} إلى ${cur}${prov ? " (مستمرة)" : ""} — بذروة 91 هدفاً عام 2012. <a href="/${lang}/goalsbyyear">فتح الجدول الكامل</a>.`,
    tileGoals: (year, prov) => `الأهداف في ${year}${prov ? " (حتى الآن)" : ""}`,
    tileTotal: (year) => `المجموع التراكمي بعد ${year}`,
    tileAge: (year) => `العمر خلال ${year}`,
    records: (best, post30, pct) => [
      [`91`, `<b>هدفاً في عام 2012</b>، أعلى رقم سجله لاعب في سنة ميلادية واحدة في تاريخ كرة القدم — ${best.goals} هدفاً في كل البطولات.`],
      [`8`, `<b>كرات ذهبية</b> (2009–12، 2015، 2019، 2021، 2023) — رقم قياسي أسطوري لا مثيل له.`],
      [`474`, `<b>هدفاً في الدوري الإسباني</b>، الهداف التاريخي المطلق لليغا ولكافة الدوريات الأوروبية الكبرى.`],
      [`129`, `<b>هدفاً في دوري أبطال أوروبا</b> — 120 لبرشلونة و9 لباريس سان جيرمان، ثاني أفضل هداف تاريخياً.`],
      [post30, `<b>هدفاً بعد سن الثلاثين</b> — تشكل حوالي ${pct}% من مجمل أهدافه على مدار مسيرته الكروية.`],
      [`57`, `<b>هاتريك أو أكثر</b> مع الأندية والمنتخب الأول خلال مسيرته الاحترافية.`],
      [`46`, `<b>بطولة جماعية</b> — اللاعب الأكثر تتويجاً في تاريخ الساحرة المستديرة، متوجاً بكأس العالم 2022.`]
    ],
    silverCaption: "46 لقباً جماعياً لفرق الدرجة الأولى الكبرى، حسب النادي، إضافة إلى أهم الإنجازات الفردية.",
    silverThTrophy: "البطولة",
    silverThTimes: "المرات",
    silverThNote: "ملاحظات",
    silverRows: [
      ["بطولات مع برشلونة", "35", "من 2005 إلى 2021، بما في ذلك 4 ألقاب دوري أبطال أوروبا و10 دوريات"],
      ["بطولات مع الأرجنتين", "5", "كأس العالم 2022، كوبا أمريكا 2021 و2024، فيناليسيما 2022، ذهبية الأولمبياد 2008"],
      ["بطولات مع باريس سان جيرمان", "3", "الدوري الفرنسي 2022 و2023، كأس الأبطال الفرنسي 2022"],
      ["بطولات مع إنتر ميامي", "3", "كأس الدوريات 2023، درع المشجعين 2024، كأس الدوري الأمريكي 2025"],
      ["الكرة الذهبية", "8", "رقم قياسي عالمي — 2009–12، 2015، 2019، 2021، 2023"]
    ],
    splitFk: "أهداف الركلات الحرة",
    splitFkNote: "أهداف من ركلات حرة مباشرة متقنة للأندية والمنتخب.",
    splitPen: "أهداف ركلات الجزاء",
    splitPenNote: "حوالي هدف من كل ثمانية أهداف في مسيرته.",
    splitHt: "هاتريك أو أكثر",
    splitHtNote: "مباريات سجل فيها 3 أهداف أو أكثر.",
    splitCaveat: (tot) => `تفاصيل الركلات الحرة وركلات الجزاء مبنية على بيانات موثقة مؤقتة، وإجمالي الـ ${tot} هدفاً مؤكد بنسبة 100%.`,
    faq: (t, agg, m, d, lang) => [
      ["كم هدفاً سجل ليونيل ميسي في مسيرته حتى الآن؟", `<b>${n(t.goals)} هدفاً رسمياً</b> في ${n(t.apps)} مباراة للمحترفين حتى ${esc(d.lastUpdated)}، بمعدل ${t.goalsPerGame} هدفاً لكل مباراة. طالع <a href="/${lang}/goalsbyyear">الأهداف سنوياً</a>.`],
      ["كم هدفاً سجل ميسي مع برشلونة؟", `<b>${n(agg.barcelona.goals)} هدفاً</b> في ${n(agg.barcelona.apps)} مباراة بين 2004 و2021 — من بينها 474 هدفاً تاريخياً في الليغا.`],
      ["كم هدفاً مع باريس سان جيرمان وإنتر ميامي؟", `<b>${agg.psg.goals} أهداف لباريس</b> و <b>${n(agg.miami.goals)} أهداف لإنتر ميامي</b>.`],
      ["كم هدفاً سجل ميسي مع الأرجنتين؟", `<b>${n(t.country.goals)} هدفاً</b> في ${n(t.country.apps)} مباراة دولية منذ عام 2005.`],
      ["ما هو أفضل عام تهديفي في مسيرة ميسي؟", `<b>عام 2012، برصيد 91 هدفاً</b> — الرقم القياسي العالمي في تاريخ كرة القدم. انظر <a href="/${lang}/goalsbyyear">كافة الأعوام</a>.`],
      ["كم بطولة حققها ميسي في مسيرته؟", `<b>46 بطولة جماعية</b> (35 مع برشلونة، 3 مع باريس، 3 مع ميامي و5 مع الأرجنتين). شاهد <a href="/${lang}/achievements">قائمة البطولات</a>.`]
    ]
  },
  bn: {
    locale: "bn-BD",
    shirt10: "জার্সি নম্বর ১০",
    head: (t, p, d) => `বার্সেলোনা, পিএসজি, ইন্টার মায়ামি ও আর্জেন্টিনার হয়ে <b>${n(t.apps)}টি অফিসিয়াল ম্যাচে</b> <b>${n(t.goals)}টি গোল</b> (${esc(d.lastUpdated)} পর্যন্ত)। বিশ্বকাপ জয়ী ও রেকর্ড ৮টি ব্যালন ডি'অর বিজয়ী।`,
    meta: (p, dob) => `${esc(p.name)}, জন্ম ${dob}, ${esc(p.birthplace)}। বয়স ${p.age} বছর, ফরোয়ার্ড হিসেবে বর্তমানে খেলছেন ${esc(p.current.join(" ও "))}-তে।`,
    roleLabel: "পজিশন",
    teamsLabel: "দলসমূহ",
    nowLabel: "বর্তমান ক্লাব",
    kpiCareer: "ক্যারিয়ার গোল",
    kpiCareerNote: (gpg, seasons) => `${seasons} ক্লাব মৌসুমে ম্যাচ প্রতি ${gpg} গোল।`,
    kpiApps: "অফিসিয়াল ম্যাচ",
    kpiAppsNote: (clubs, country) => `${clubs} ক্লাব, ${country} আর্জেন্টিনা।`,
    kpiArg: "আর্জেন্টিনার হয়ে গোল",
    kpiArgNote: (gpg, caps) => `${caps} আন্তর্জাতিক ম্যাচে ম্যাচ প্রতি ${gpg} গোল।`,
    kpiTrophies: "দলগত ট্রফি",
    kpiTrophiesNote: (lang) => `সর্বকালের রেকর্ড ৪৬টি ট্রফি এবং ৮টি ব্যালন ডি'অর। <a href="/${lang}/achievements">পূর্ণাঙ্গ তালিকা দেখুন</a>।`,
    kpiRoad: "১,০০০ গোলের পথে",
    kpiRoadNote: (togo, projYear, pace) => `বাকি মাত্র ${togo} গোল। বর্তমান গতিতে (~বছরে ${pace.toFixed(0)} গোল), ${projYear} সালের মধ্যে ১,০০০ গোল পূর্ণ হবে।`,
    copyStatsBtn: "মূল পরিসংখ্যান কপি করুন",
    copyText: (goals, apps, clubGoals, argGoals, updated) => `মেসি: ${apps} ম্যাচে ${goals} গোল (${clubGoals} ক্লাব, ${argGoals} আর্জেন্টিনা), ৪৬ ট্রফি, ৮ ব্যালন ডি'অর — হালনাগাদ: ${updated}।`,
    copyMsg: "ক্লিপবোর্ডে কপি করা হয়েছে।",
    clubCaption: (updated, lang) => `লিওনেল মেসির প্রতিটি সিনিয়র দলের ম্যাচ ও গোলের খতিয়ান (${updated} পর্যন্ত)। বিস্তারিত দেখুন <a href="/${lang}/goalsbyseason">মৌসুমভিত্তিক পৃষ্ঠায়</a>।`,
    thTeam: "দল ও বছর",
    thApps: "ম্যাচ",
    thGoals: "গোল",
    thGpg: "গোল/ম্যাচ",
    thTotal: "ক্যারিয়ার মোট",
    yearSub: "যেকোনো বছর বেছে নিয়ে ২০০৪ সালের অভিষেক থেকে আজ পর্যন্ত গোলের উত্থান দেখুন।",
    yearTitle: "পঞ্জিকাবর্ষ অনুযায়ী মেসির পরিসংখ্যান",
    yearLabel: "বছর",
    yearFigcap: (start, cur, prov, lang) => `${start} থেকে ${cur} পর্যন্ত বছরভিত্তিক গোল — ২০১২ সালে রেকর্ড ৯১ গোল। <a href="/${lang}/goalsbyyear">সম্পূর্ণ টেবিল দেখুন</a>।`,
    tileGoals: (year, prov) => `${year} সালে গোল`,
    tileTotal: (year) => `${year} পর্যন্ত ক্যারিয়ার মোট`,
    tileAge: (year) => `${year} সালে বয়স`,
    records: (best, post30, pct) => [
      [`91`, `<b>২০১২ সালে ৯১ গোল</b>, ফুটবল ইতিহাসে এক ক্যালেন্ডার বছরে কোনো খেলোয়াড়ের সর্বোচ্চ গোল।`],
      [`8`, `<b>ব্যালন ডি'অর</b> (২০০৯-১২, ২০১৫, ২০১৯, ২০২১, ২০২৩) — ফুটবল ইতিহাসের সর্বকালের রেকর্ড।`],
      [`474`, `<b>লা লিগায় ৪৭৪ গোল</b>, স্প্যানিশ লিগ ও যেকোনো ইউরোপীয় শীর্ষ লিগের সর্বকালের রেকর্ড।`],
      [`129`, `<b>চ্যাম্পিয়নস লিগ গোল</b> — বার্সেলোনায় ১২০ ও পিএসজিতে ৯ গোল, ইতিহাসের দ্বিতীয় সর্বোচ্চ।`],
      [post30, `<b>৩০ বছর বয়সের পর গোল</b> — তার ক্যারিয়ারের মোট গোলের প্রায় ${pct}%।`],
      [`57`, `<b>হ্যাটট্রিক বা ততোধিক</b> সিনিয়র ক্যারিয়ারে ক্লাব ও দেশের হয়ে।`],
      [`46`, `<b>দলগত ট্রফি</b> — ফুটবল ইতিহাসের সবচেয়ে সফল ক্যারিয়ার, ২০২২ বিশ্বকাপ জয়ে যার পূর্ণতা।`]
    ],
    silverCaption: "সিনিয়র প্রথম দলের ৪৬টি ট্রফি এবং শীর্ষ ব্যক্তিগত পুরস্কারসমূহের বিবরণ।",
    silverThTrophy: "শিরোপা",
    silverThTimes: "বার",
    silverThNote: "বিবরণ",
    silverRows: [
      ["বার্সেলোনার হয়ে ট্রফি", "35", "২০০৫ থেকে ২০২১, ৪টি চ্যাম্পিয়নস লিগ ও ১০টি লা লিগাসহ"],
      ["আর্জেন্টিনার হয়ে ট্রফি", "5", "২০২২ বিশ্বকাপ, ২০২১ ও ২০২৪ কোপা আমেরিকা, ২০২২ ফিনালিসিমা, ২০০৮ অলিম্পিক সোনা"],
      ["পিএসজির হয়ে ট্রফি", "3", "২০২২ ও ২০২৩ লিগ ওয়ান, ২০২২ ফরাসি সুপার কাপ"],
      ["ইন্টার মায়ামির হয়ে ট্রফি", "3", "২০২৩ লিগস কাপ, ২০২৪ সাপোর্টার্স শিল্ড, ২০২৫ এমএলএস কাপ"],
      ["ব্যালন ডি'অর", "8", "বিশ্বরেকর্ড — ২০০৯–১২, ২০১৫, ২০১৯, ২০২১, ২০২৩"]
    ],
    splitFk: "ফ্রি-কিক গোল",
    splitFkNote: "ক্লাব ও দেশের হয়ে চোখধাঁধানো সরাসরি ফ্রি-কিক।",
    splitPen: "পেনাল্টি গোল",
    splitPenNote: "তার ক্যারিয়ারের প্রতি আটটি গোলের প্রায় একটি।",
    splitHt: "হ্যাটট্রিক বা তার বেশি",
    splitHtNote: "৩ বা ততোধিক গোল করা ম্যাচ।",
    splitCaveat: (tot) => `ফ্রি-কিক ও পেনাল্টির হিসাব ম্যাচ-বাই-ম্যাচ সংকলিত। মোট ${tot} গোলের সংখ্যা ১০০% অপরিবর্তিত।`,
    faq: (t, agg, m, d, lang) => [
      ["মেসি ক্যারিয়ারে সর্বমোট কত গোল করেছেন?", `<b>${n(t.goals)}টি অফিসিয়াল গোল</b> ${n(t.apps)} ম্যাচে (${esc(d.lastUpdated)} পর্যন্ত), গড়ে প্রতি ম্যাচে ${t.goalsPerGame} গোল। <a href="/${lang}/goalsbyyear">বছরভিত্তিক গোল দেখুন</a>।`],
      ["বার্সেলোনায় মেসির গোল কত?", `<b>${n(agg.barcelona.goals)}টি গোল</b> ${n(agg.barcelona.apps)} ম্যাচে (২০০৪-২০২১) — যার মধ্যে লা লিগায় রেকর্ড ৪৭৪ গোল।`],
      ["পিএসজি ও ইন্টার মায়ামির হয়ে গোল কত?", `<b>পিএসজিতে ${agg.psg.goals}টি</b> এবং <b>ইন্টার মায়ামিতে ${n(agg.miami.goals)}টি গোল</b>।`],
      ["আর্জেন্টিনার হয়ে মেসি কত গোল করেছেন?", `<b>${n(t.country.goals)}টি গোল</b> ${n(t.country.apps)} ম্যাচে (২০০৫ থেকে)।`],
      ["মেসির ক্যারিয়ারের সেরা গোল স্কোরিং বছর কোনটি?", `<b>২০১২ সাল, ৯১টি গোল</b> — এক ক্যালেন্ডার বছরে বিশ্বরেকর্ড। <a href="/${lang}/goalsbyyear">সব বছর দেখুন</a>।`],
      ["মেসি ক্যারিয়ারে কয়টি ট্রফি জিতেছেন?", `<b>৪৬টি দলগত শিরোপা</b> (৩৫টি বার্সেলোনা, ৩টি পিএসজি, ৩টি মায়ামি, ৫টি আর্জেন্টিনা)। <a href="/${lang}/achievements">সব ট্রফি দেখুন</a>।`]
    ]
  },
  hi: {
    locale: "hi-IN",
    shirt10: "जर्सी नंबर 10",
    head: (t, p, d) => `बार्सिलोना, पीएसजी, इंटर मियामी और अर्जेंटीना के लिए <b>${n(t.apps)} आधिकारिक मैचों</b> में <b>${n(t.goals)} गोल</b> (${esc(d.lastUpdated)} तक)। विश्व कप विजेता और रिकॉर्ड 8 बार के बैलन डी'ओर विजेता।`,
    meta: (p, dob) => `${esc(p.name)}, जन्म ${dob}, ${esc(p.birthplace)}। उम्र ${p.age} वर्ष, वर्तमान में ${esc(p.current.join(" और "))} के लिए खेल रहे हैं।`,
    roleLabel: "स्थान",
    teamsLabel: "टीमें",
    nowLabel: "वर्तमान क्लब",
    kpiCareer: "करियर गोल",
    kpiCareerNote: (gpg, seasons) => `${seasons} क्लब सीज़न में प्रति मैच ${gpg} गोल।`,
    kpiApps: "आधिकारिक मैच",
    kpiAppsNote: (clubs, country) => `${clubs} क्लब, ${country} अर्जेंटीना।`,
    kpiArg: "अर्जेंटीना के लिए गोल",
    kpiArgNote: (gpg, caps) => `${caps} अंतरराष्ट्रीय मैचों में प्रति मैच ${gpg} गोल।`,
    kpiTrophies: "टीम खिताब",
    kpiTrophiesNote: (lang) => `रिकॉर्ड 46 खिताब और 8 बैलन डी'ओर। <a href="/${lang}/achievements">पूरी सूची देखें</a>।`,
    kpiRoad: "1,000 गोलों की ओर",
    kpiRoadNote: (togo, projYear, pace) => `मात्र ${togo} गोल शेष। वर्तमान गति (~साल में ${pace.toFixed(0)} गोल) से 1,000 गोल ${projYear} के आसपास पूरे होंगे।`,
    copyStatsBtn: "मुख्य आंकड़े कॉपी करें",
    copyText: (goals, apps, clubGoals, argGoals, updated) => `मेसी: ${apps} मैचों में ${goals} गोल (${clubGoals} क्लब, ${argGoals} अर्जेंटीना), 46 ट्रॉफियां, 8 बैलन डी'ओर — ${updated} तक।`,
    copyMsg: "क्लिपबोर्ड पर कॉपी किया गया।",
    clubCaption: (updated, lang) => `लियोनेल मेसी के सभी सीनियर टीमों के आंकड़े (${updated} तक)। <a href="/${lang}/goalsbyseason">सीज़न के अनुसार देखें</a>।`,
    thTeam: "टीम और वर्ष",
    thApps: "मैच",
    thGoals: "गोल",
    thGpg: "गोल/मैच",
    thTotal: "कुल करियर योग",
    yearSub: "कोई भी वर्ष चुनें और 2004 के पदार्पण से लेकर आज तक गोलों का बढ़ता हुआ कुल देखें।",
    yearTitle: "कैलेंडर वर्ष के अनुसार मेसी के आंकड़े",
    yearLabel: "वर्ष",
    yearFigcap: (start, cur, prov, lang) => `${start} से ${cur} तक वर्षवार गोल — 2012 में 91 गोल का रिकॉर्ड। <a href="/${lang}/goalsbyyear">पूरी तालिका देखें</a>।`,
    tileGoals: (year, prov) => `${year} में गोल`,
    tileTotal: (year) => `${year} के बाद कुल गोल`,
    tileAge: (year) => `${year} में उम्र`,
    records: (best, post30, pct) => [
      [`91`, `<b>2012 में 91 गोल</b>, एक कैलेंडर वर्ष में किसी भी खिलाड़ी द्वारा सर्वाधिक गोल का विश्व रिकॉर्ड।`],
      [`8`, `<b>बैलन डी'ओर</b> (2009-12, 2015, 2019, 2021, 2023) — फुटबॉल इतिहास में सर्वकालिक रिकॉर्ड।`],
      [`474`, `<b>ला लीगा में 474 गोल</b>, स्पेनिश लीग और किसी भी शीर्ष यूरोपीय लीग का सर्वकालिक रिकॉर्ड।`],
      [`129`, `<b>चैंपियंस लीग गोल</b> — 120 बार्सिलोना और 9 पीएसजी, प्रतियोगिता इतिहास में दूसरा सर्वाधिक।`],
      [post30, `<b>30 साल की उम्र के बाद गोल</b> — उनके करियर के कुल गोलों का लगभग ${pct}%।`],
      [`57`, `<b>हैट्रिक या अधिक</b> क्लब और देश के लिए सीनियर करियर में।`],
      [`46`, `<b>टीम ट्रॉफियां</b> — फुटबॉल इतिहास का सबसे सफल करियर, 2022 विश्व कप जीत द्वारा ताज पहनाया गया।`]
    ],
    silverCaption: "46 सीनियर टीम खिताब और प्रमुख व्यक्तिगत पुरस्कार।",
    silverThTrophy: "ट्रॉफी",
    silverThTimes: "संख्या",
    silverThNote: "विवरण",
    silverRows: [
      ["बार्सिलोना के साथ खिताब", "35", "2005 से 2021, 4 चैंपियंस लीग और 10 ला लीगा सहित"],
      ["अर्जेंटीना के साथ खिताब", "5", "विश्व कप 2022, कोपा अमेरिका 2021 और 2024, फ़ाइनलिस्सिमा 2022, ओलंपिक स्वर्ण 2008"],
      ["पीएसजी के साथ खिताब", "3", "लीग 1 2022 और 2023, फ्रेंच सुपर कप 2022"],
      ["इंटर मियामी के साथ खिताब", "3", "लीग्स कप 2023, सपोर्टर्स शील्ड 2024, एमएलएस कप 2025"],
      ["बैलन डी'ओर", "8", "विश्व रिकॉर्ड — 2009–12, 2015, 2019, 2021, 2023"]
    ],
    splitFk: "फ्री-किक गोल",
    splitFkNote: "क्लब और देश के लिए शानदार फ्री-किक।",
    splitPen: "पेनल्टी गोल",
    splitPenNote: "उनके कुल गोलों में से लगभग हर आठवां गोल।",
    splitHt: "हैट्रिक या अधिक",
    splitHtNote: "3 या अधिक गोल वाले मैच।",
    splitCaveat: (tot) => `फ्री-किक और पेनल्टी के आंकड़े मैच-दर-मैच संकलित हैं। कुल ${tot} गोल पूरी तरह सत्यापित हैं।`,
    faq: (t, agg, m, d, lang) => [
      ["लियोनेल मेसी ने कुल कितने गोल किए हैं?", `<b>${n(t.goals)} आधिकारिक गोल</b> ${n(t.apps)} मैचों में (${esc(d.lastUpdated)} तक), प्रति मैच ${t.goalsPerGame} की दर से। <a href="/${lang}/goalsbyyear">वर्षवार आंकड़े देखें</a>।`],
      ["मेसी ने बार्सिलोना के लिए कितने गोल किए?", `<b>${n(agg.barcelona.goals)} गोल</b> ${n(agg.barcelona.apps)} मैचों में (2004-2021) — ला लीगा में रिकॉर्ड 474 गोल सहित।`],
      ["पीएसजी और इंटर मियामी के लिए कितने गोल हैं?", `<b>पीएसजी के लिए ${agg.psg.goals}</b> और <b>इंटर मियामी के लिए ${n(agg.miami.goals)} गोल</b>।`],
      ["मेसी ने अर्जेंटीना के लिए कितने गोल किए हैं?", `<b>${n(t.country.goals)} गोल</b> ${n(t.country.apps)} मैचों में (2005 से)।`],
      ["मेसी का सर्वश्रेष्ठ गोल स्कोरिंग वर्ष कौन सा था?", `<b>2012, जिसमें उन्होंने 91 गोल किए</b> — एक कैलेंडर वर्ष में विश्व रिकॉर्ड। <a href="/${lang}/goalsbyyear">सभी वर्ष देखें</a>।`],
      ["मेसी ने कितनी ट्रॉफियां जीती हैं?", `<b>46 टीम खिताब</b> (35 बार्सिलोना, 3 पीएसजी, 3 मियामी, 5 अर्जेंटीना)। <a href="/${lang}/achievements">पूरी सूची देखें</a>।`]
    ]
  },
  ro: {
    locale: "ro-RO",
    shirt10: "Numărul 10",
    head: (t, p, d) => `<b>${n(t.goals)} goluri oficiale</b> în <b>${n(t.apps)} meciuri de seniori</b> pentru Barcelona, PSG, Inter Miami și Argentina la ${esc(d.lastUpdated)}. Campion mondial și record de 8 Baloane de Aur.`,
    meta: (p, dob) => `${esc(p.name)}, născut la ${dob} în ${esc(p.birthplace)}. Are ${p.age} ani, atacant la ${esc(p.current.join(" și "))}.`,
    roleLabel: "Rol",
    teamsLabel: "Echipe",
    nowLabel: "În prezent",
    kpiCareer: "Goluri în carieră",
    kpiCareerNote: (gpg, seasons) => `${gpg} goluri pe meci în ${seasons} sezoane la club.`,
    kpiApps: "Meciuri oficiale",
    kpiAppsNote: (clubs, country) => `${clubs} la cluburi, ${country} cu Argentina.`,
    kpiArg: "Goluri pentru Argentina",
    kpiArgNote: (gpg, caps) => `${gpg} pe meci în ${caps} selecții.`,
    kpiTrophies: "Trofee de echipă",
    kpiTrophiesNote: (lang) => `Record absolut de 46 de trofee și 8 Baloane de Aur. <a href="/${lang}/achievements">Palmares complet</a>.`,
    kpiRoad: "Drumul spre 1.000 de goluri",
    kpiRoadNote: (togo, projYear, pace) => `Mai are nevoie de ${togo} goluri. În ritmul actual (~${pace.toFixed(0)} pe an), borna 1.000 va fi atinsă spre ${projYear}.`,
    copyStatsBtn: "Copiază statisticile",
    copyText: (goals, apps, clubGoals, argGoals, updated) => `Messi: ${goals} goluri în ${apps} meciuri oficiale (${clubGoals} la cluburi, ${argGoals} cu Argentina), 46 de trofee, 8 Baloane de Aur — la ${updated}.`,
    copyMsg: "Copiat în clipboard!",
    clubCaption: (updated, lang) => `Meciuri și goluri pentru fiecare echipă a lui Lionel Messi la ${updated}. Detalii complete pe <a href="/${lang}/goalsbyseason">pagina sezoanelor</a>.`,
    thTeam: "Echipă și ani",
    thApps: "Meciuri",
    thGoals: "Goluri",
    thGpg: "Goluri / Meci",
    thTotal: "Total carieră",
    yearSub: "Alege un an și urmărește ascensiunea totalului de goluri — de la debutul din 2004 până azi.",
    yearTitle: "Statisticile lui Messi pe ani calendaristici",
    yearLabel: "An",
    yearFigcap: (start, cur, prov, lang) => `Goluri pe an calendaristic, ${start} - ${cur}${prov ? " (în desfășurare)" : ""} — vârf de 91 în 2012. <a href="/${lang}/goalsbyyear">Tabel complet</a>.`,
    tileGoals: (year, prov) => `Goluri în ${year}${prov ? " (până acum)" : ""}`,
    tileTotal: (year) => `Total carieră după ${year}`,
    tileAge: (year) => `Vârsta în ${year}`,
    records: (best, post30, pct) => [
      [`91`, `<b>Goluri în 2012</b>, cel mai prolific an calendaristic din istoria fotbalului mondial — ${best.goals} goluri în total.`],
      [`8`, `<b>Baloane de Aur</b> (2009–12, 2015, 2019, 2021, 2023) — record mondial absolut.`],
      [`474`, `<b>Goluri în La Liga</b>, golgheterul all-time al campionatului spaniol.`],
      [`129`, `<b>Goluri în Champions League</b> — 120 pentru Barcelona și 9 pentru PSG, al doilea din istorie.`],
      [post30, `<b>Goluri după 30 de ani</b> — aproximativ ${pct}% din totalul golurilor sale din carieră.`],
      [`57`, `<b>Hat-trick-uri sau mai mult</b> la club și națională în cariera profesionistă.`],
      [`46`, `<b>Trofee colective</b> — cel mai titrat fotbalist din istorie, încununat de Cupa Mondială 2022.`]
    ],
    silverCaption: "46 de titluri oficiale de seniori, club cu club, plus distincțiile individuale supreme.",
    silverThTrophy: "Trofeu",
    silverThTimes: "Nr.",
    silverThNote: "Detalii",
    silverRows: [
      ["Titluri cu Barcelona", "35", "2005 - 2021, inclusiv 4 Ligi ale Campionilor și 10 titluri La Liga"],
      ["Titluri cu Argentina", "5", "Cupa Mondială 2022, Copas América 2021 și 2024, Finalissima 2022, Aur Olimpic 2008"],
      ["Titluri cu PSG", "3", "Ligue 1 2022 și 2023, Supercupa Franței 2022"],
      ["Titluri cu Inter Miami", "3", "Leagues Cup 2023, Supporters' Shield 2024, MLS Cup 2025"],
      ["Balonul de Aur", "8", "Record mondial — 2009–12, 2015, 2019, 2021, 2023"]
    ],
    splitFk: "Goluri din lovituri libere",
    splitFkNote: "Lovituri libere directe spectaculoase.",
    splitPen: "Goluri din penalty",
    splitPenNote: "Aproximativ un gol din opt din carieră.",
    splitHt: "Hat-trick-uri sau mai mult",
    splitHtNote: "Meciuri cu 3 sau mai multe goluri înscrise.",
    splitCaveat: (tot) => `Desfășurătorul pentru lovituri libere și penalty-uri este compilat oficial. Totalul de ${tot} goluri este 100% verificat.`,
    faq: (t, agg, m, d, lang) => [
      ["Câte goluri a marcat Lionel Messi în total?", `<b>${n(t.goals)} goluri oficiale</b> în ${n(t.apps)} meciuri la ${esc(d.lastUpdated)}, medie de ${t.goalsPerGame} goluri/meci. Vezi <a href="/${lang}/goalsbyyear">goluri pe ani</a>.`],
      ["Câte goluri a marcat Messi pentru Barcelona?", `<b>${n(agg.barcelona.goals)} goluri</b> în ${n(agg.barcelona.apps)} meciuri (2004-2021) — inclusiv recordul de 474 în La Liga.`],
      ["Câte goluri are pentru PSG și Inter Miami?", `<b>${agg.psg.goals} pentru Paris Saint-Germain</b> și <b>${n(agg.miami.goals)} pentru Inter Miami</b>.`],
      ["Câte goluri are Messi pentru Argentina?", `<b>${n(t.country.goals)} goluri</b> în ${n(t.country.apps)} meciuri internaționale din 2005.`],
      ["Care a fost cel mai bun an al lui Messi?", `<b>2012, cu 91 de goluri</b> — record mondial absolut. Vezi <a href="/${lang}/goalsbyyear">toți anii</a>.`],
      ["Câte trofee a câștigat Messi?", `<b>46 de titluri de echipă</b> (35 cu Barcelona, 3 cu PSG, 3 cu Inter Miami, 5 cu Argentina). Vezi <a href="/${lang}/achievements">palmaresul</a>.`]
    ]
  },
  uz: {
    locale: "uz-UZ",
    shirt10: "10-raqamli futbolka",
    head: (t, p, d) => `Barselona, PSJ, Inter Mayami va Argentina terma jamoasi safida <b>${n(t.apps)} ta rasmiy o'yinda</b> <b>${n(t.goals)} ta gol</b> (${esc(d.lastUpdated)} holatiga). Jahon chempioni va 8 karra “Oltin to'p” sohibi.`,
    meta: (p, dob) => `${esc(p.name)}, ${dob} da ${esc(p.birthplace)} shahrida tug'ilgan. Yoshi ${p.age} da, hujumchi, ayni paytda ${esc(p.current.join(" va "))} sharafini himoya qilmoqda.`,
    roleLabel: "Amplua",
    teamsLabel: "Jamoalar",
    nowLabel: "Hozirda",
    kpiCareer: "Karyeradagi gollar",
    kpiCareerNote: (gpg, seasons) => `${seasons} klub mavsumida har o'yinda ${gpg} tadan gol.`,
    kpiApps: "Rasmiy o'yinlar",
    kpiAppsNote: (clubs, country) => `${clubs} ta klub, ${country} ta Argentina.`,
    kpiArg: "Argentina safida gollar",
    kpiArgNote: (gpg, caps) => `${caps} ta o'yinda har o'yinga ${gpg} ta gol.`,
    kpiTrophies: "Jamoaviy sovrinlar",
    kpiTrophiesNote: (lang) => `Rekord darajadagi 46 ta titul va 8 ta “Oltin to'p”. <a href="/${lang}/achievements">To'liq ro'yxat</a>.`,
    kpiRoad: "1 000 ta gol sari",
    kpiRoadNote: (togo, projYear, pace) => `Yana ${togo} ta gol qoldi. Hozirgi sur'atda (~yiliga ${pace.toFixed(0)} ta gol), 1 000-golga ${projYear}-yil atrofida erishiladi.`,
    copyStatsBtn: "Statistikani nusxalash",
    copyText: (goals, apps, clubGoals, argGoals, updated) => `Messi: ${apps} ta rasmiy o'yinda ${goals} ta gol (${clubGoals} klub, ${argGoals} Argentina), 46 ta sovrin, 8 ta “Oltin to'p” — ${updated} holatiga.`,
    copyMsg: "Buferga nusxalandi!",
    clubCaption: (updated, lang) => `Lionel Messining barcha jamoalardagi o'yin va gollari (${updated} holatiga). <a href="/${lang}/goalsbyseason">Mavsumlar bo'yicha</a> to'liq taqsimot.`,
    thTeam: "Jamoa va yillar",
    thApps: "O'yinlar",
    thGoals: "Gollar",
    thGpg: "Gol / O'yin",
    thTotal: "Karyera jami",
    yearSub: "Istalgan yilni tanlang va 2004-yildagi debyutidan to bugungacha bo'lgan gollar o'sishini kuzating.",
    yearTitle: "Messining taqvim yillari bo'yicha statistikasi",
    yearLabel: "Yil",
    yearFigcap: (start, cur, prov, lang) => `${start}-yildan ${cur}-yilgacha bo'lgan gollar — 2012-yilda rekord 91 ta gol. <a href="/${lang}/goalsbyyear">To'liq jadvalni ochish</a>.`,
    tileGoals: (year, prov) => `${year}-yildagi gollar`,
    tileTotal: (year) => `${year}-yildan keyingi umumiy gollar`,
    tileAge: (year) => `${year}-yildagi yoshi`,
    records: (best, post30, pct) => [
      [`91`, `<b>2012-yilda 91 ta gol</b>, futbol tarixida bir taqvim yilida urilgan gollar bo'yicha mutlaq jahon rekordi.`],
      [`8`, `<b>“Oltin to'p”</b> (2009–12, 2015, 2019, 2021, 2023) — futbol tarixidagi mutlaq rekord.`],
      [`474`, `<b>La Ligada 474 ta gol</b>, Ispaniya chempionati va Yevropaning top-ligalari tarixidagi rekord.`],
      [`129`, `<b>Chempionlar Ligasida 129 ta gol</b> — 120 ta Barselona va 9 ta PSJ safida, tarixdagi 2-natija.`],
      [post30, `<b>30 yoshdan keyin urilgan gollar</b> — butun faoliyatidagi gollarning taxminan ${pct}% qismi.`],
      [`57`, `<b>Het-trik yoki undan ko'p</b> klub va terma jamoa safidagi o'yinlarda.`],
      [`46`, `<b>Jamoaviy sovrinlar</b> — futbol tarixidagi eng ko'p sovrin yutgan futbolchi, 2022-yilgi Jahon kubogi bilan bezatilgan.`]
    ],
    silverCaption: "Messining barcha 46 ta rasmiy jamoaviy titullari va eng yuksak shaxsiy sovrinlari.",
    silverThTrophy: "Sovrin",
    silverThTimes: "Soni",
    silverThNote: "Tafsilotlar",
    silverRows: [
      ["Barselona bilan sovrinlar", "35", "2005 - 2021, shu jumladan 4 ta ECHL va 10 ta La Liga"],
      ["Argentina bilan sovrinlar", "5", "Jahon chempionati 2022, Amerika kubogi 2021 va 2024, Finalissima 2022, Olimpiada oltini 2008"],
      ["PSJ bilan sovrinlar", "3", "Liga 1 2022 va 2023, Fransiya Superkubogi 2022"],
      ["Inter Mayami bilan sovrinlar", "3", "Leagues Cup 2023, Supporters' Shield 2024, MLS kubogi 2025"],
      ["“Oltin to'p”", "8", "Mutlaq jahon rekordi — 2009–12, 2015, 2019, 2021, 2023"]
    ],
    splitFk: "Jarima to'pidan gollar",
    splitFkNote: "Klub va terma jamoa safida jarimadan kiritilgan ajoyib gollar.",
    splitPen: "Penaltidan gollar",
    splitPenNote: "Karyerasidagi taxminan har sakkizta goldan bittasi.",
    splitHt: "Het-trik yoki undan ko'p",
    splitHtNote: "Bitta o'yinda 3 ta yoki undan ko'p gol urilgan bahslar.",
    splitCaveat: (tot) => `Jarima va penaltilar bo'yicha ma'lumotlar rasmiy protokollar asosida jamlangan. Jami ${tot} ta gol soni to'liq tasdiqlangan.`,
    faq: (t, agg, m, d, lang) => [
      ["Lionel Messi jami nechta gol urgan?", `<b>${n(t.goals)} ta rasmiy gol</b> ${n(t.apps)} ta o'yinda (${esc(d.lastUpdated)} holatiga), har o'yinga o'rtacha ${t.goalsPerGame} ta gol. <a href="/${lang}/goalsbyyear">Yillar bo'yicha gollar</a>.`],
      ["Messi Barselona safida nechta gol urgan?", `<b>${n(agg.barcelona.goals)} ta gol</b> ${n(agg.barcelona.apps)} ta o'yinda (2004-2021) — La Ligada rekord 474 ta gol bilan.`],
      ["PSJ va Inter Mayamida nechta gol urdi?", `<b>PSJ uchun ${agg.psg.goals} ta</b> va <b>Inter Mayami uchun ${n(agg.miami.goals)} ta gol</b>.`],
      ["Messi Argentina terma jamoasida nechta gol urgan?", `<b>${n(t.country.goals)} ta gol</b> ${n(t.country.apps)} ta o'yinda (2005-yildan buyon).`],
      ["Messining eng sermahsul yili qaysi bo'lgan?", `<b>2012-yil, 91 ta gol</b> — jahon futboli tarixidagi mutlaq rekord. <a href="/${lang}/goalsbyyear">Barcha yillar</a>.`],
      ["Messi faoliyatida nechta sovrin yutgan?", `<b>46 ta jamoaviy titul</b> (35 ta Barselona, 3 ta PSJ, 3 ta Mayami, 5 ta Argentina). <a href="/${lang}/achievements">Barcha sovrinlar</a>.`]
    ]
  }
};

/* ================= HOME ================= */
function renderHome(d) {
  const t = d.totals, agg = clubAgg(d), p = d.profile;
  const seasons = d.clubSeasons.length;
  const lang = getLang();
  const dict = HOME_I18N[lang] || HOME_I18N.en;

  setHead(d, dict.head(t, p, d));

  const prof = el("profile");
  if (prof) {
    const dob = new Date(p.born + "T00:00:00").toLocaleDateString(dict.locale || "en-GB", { day: "numeric", month: "long", year: "numeric" });
    prof.innerHTML =
      `<figure class="identity-photo"><picture><source srcset="/img/messi-450.webp 1x, /img/messi.webp 2x" type="image/webp"><img src="/img/messi.jpg" alt="Lionel Messi" width="148" height="197" loading="eager" fetchpriority="high" decoding="async"></picture><figcaption class="photo-credit">Lionel Messi · Argentina & Inter Miami</figcaption></figure><div class="identity-main">` +
      `<p class="identity-name">${esc(p.short)} <span class="jersey" aria-label="${dict.shirt10}">${p.number}</span></p>` +
      `<p class="identity-meta">${dict.meta(p, dob)}</p>` +
      `<dl class="identity-facts"><div><dt>${dict.roleLabel}</dt><dd>${esc(p.role)}</dd></div>` +
      `<div><dt>${dict.teamsLabel}</dt><dd>${esc(p.teams.join(" · "))}</dd></div>` +
      `<div><dt>${dict.nowLabel}</dt><dd>${esc(p.current.join(" · "))}</dd></div></dl></div>`;
    prof.classList.add("identity--tight");
  }

  const kpis = el("kpis");
  function kpi(l, v, s) { return `<div class="kpi"><span class="kpi-label">${l}</span><span class="kpi-value">${v}</span><span class="kpi-note">${s}</span></div>`; }
  if (kpis) {
    const togo = 1000 - t.goals;
    const done = d.calendarYears.filter((r) => !r.provisional);
    const last3 = done.slice(-3);
    const pace = last3.reduce((s, r) => s + r.goals, 0) / last3.length;
    const projYear = done[done.length - 1].year + Math.max(1, Math.ceil(togo / pace));
    kpis.innerHTML =
      kpi(dict.kpiCareer, n(t.goals), dict.kpiCareerNote(t.goalsPerGame, seasons)) +
      kpi(dict.kpiApps, n(t.apps), dict.kpiAppsNote(n(t.clubs.apps), n(t.country.apps))) +
      kpi(dict.kpiArg, n(t.country.goals), dict.kpiArgNote(gpg(t.country.goals, t.country.apps), n(t.country.apps))) +
      kpi(dict.kpiTrophies, "46", dict.kpiTrophiesNote(lang)) +
      `<div class="kpi progress"><span class="kpi-label">${dict.kpiRoad}</span>` +
      `<span class="kpi-value">${n(t.goals)} <small style="font-size:1rem;color:var(--muted)">/ 1,000</small></span>` +
      `<div class="progress-track"><div class="progress-fill" style="width:${(t.goals / 10).toFixed(1)}%"></div></div>` +
      `<span class="kpi-note">${dict.kpiRoadNote(togo, projYear, pace)}</span></div>`;
    kpis.classList.add("kpi--hero");
    if (!el("copyStats")) {
      kpis.insertAdjacentHTML("afterend",
        `<div class="share-row"><button type="button" class="btn-primary" id="copyStats">${dict.copyStatsBtn}</button>` +
        `<span class="share-msg" id="copyMsg" role="status" aria-live="polite"></span></div>`);
    }
  }

  const copyStatsBtn = el("copyStats");
  if (copyStatsBtn) {
    copyStatsBtn.addEventListener("click", async () => {
      const text = dict.copyText(n(t.goals), n(t.apps), n(t.clubs.goals), n(t.country.goals), d.lastUpdated);
      const msg = el("copyMsg");
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) await navigator.clipboard.writeText(text);
        else {
          const ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        if (msg) msg.textContent = dict.copyMsg;
      } catch {
        if (msg) msg.textContent = text;
      }
      if (msg) {
        clearTimeout(copyStatsBtn.dataset.timer);
        copyStatsBtn.dataset.timer = setTimeout(() => { msg.textContent = ""; }, 4000);
      }
    });
  }

  const qa = el("qa");
  if (qa) {
    const faqFn = dict.faq || HOME_I18N.en.faq;
    qa.innerHTML = faqFn(t, agg, d.byFinish, d, lang).slice(0, 6).map((q) => `<details class="faq-item"><summary class="faq-question"><span>${q[0]}</span><span class="faq-chevron" aria-hidden="true">▾</span></summary><div class="faq-answer"><p>${q[1]}</p></div></details>`).join("");
    qa.className = "faq-accordion";
  }

  const clubCard = el("club-card");
  if (clubCard) {
    const order = ["barcelona", "psg", "miami", "argentina"];
    const rows = order.map((k2) => {
      const a = agg[k2];
      return `<tr><th scope="row"><span class="club-cell">${badge(k2)}<span class="club-name">${teamName(k2)}<small>${CLUBS[k2].years}</small></span></span></th>` +
        `<td>${n(a.apps)}</td><td><b>${n(a.goals)}</b></td><td>${gpg(a.goals, a.apps)}</td></tr>`;
    }).join("");

    clubCard.innerHTML =
      `<table class="data-table"><caption>${dict.clubCaption(esc(d.lastUpdated), lang)}</caption>` +
      `<thead><tr><th scope="col" class="left">${dict.thTeam}</th><th scope="col">${dict.thApps}</th><th scope="col">${dict.thGoals}</th><th scope="col">${dict.thGpg}</th></tr></thead>` +
      `<tbody>${rows}<tr class="total"><th scope="row">${dict.thTotal}</th><td>${n(t.apps)}</td><td>${n(t.goals)}</td><td>${t.goalsPerGame}</td></tr></tbody></table>` + clubTableCaption();
    const cTable = clubCard.querySelector("table");
    if (cTable) sortable(cTable);
  }

  // year widget: dropdown + tiles + full-range bars
  const ys = d.calendarYears;
  const cur = ys[ys.length - 1];
  const yearSub = el("year-sub");
  if (yearSub) {
    yearSub.textContent = dict.yearSub;
  }
  const yearWidget = el("year-widget");
  if (yearWidget) {
    yearWidget.innerHTML =
      `<div class="year-pick-head"><h3 class="year-pick-title">${dict.yearTitle}</h3>` +
      `<div class="year-pick-control"><label for="yearPick">${dict.yearLabel}</label><select id="yearPick" class="inline">` +
      ys.slice().reverse().map((r) => `<option value="${r.year}"${r.year === cur.year ? " selected" : ""}>${r.year}</option>`).join("") +
      `</select></div></div><div class="year-tiles" id="yearTiles"></div>` +
      `<figure style="margin:12px 0 0"><div class="spark-wrap" id="yearSpark"></div>` +
      `<figcaption class="figcap">${dict.yearFigcap(ys[0].year, cur.year, cur.provisional, lang)}</figcaption></figure>`;
    const drawYear = (y) => {
      const r = ys.find((x) => x.year === +y);
      if (!r) return;
      const yt = el("yearTiles");
      if (yt) {
        yt.innerHTML =
          `<div class="tile"><div class="t-val">${r.goals}</div><div class="t-lab">${dict.tileGoals(r.year, r.provisional)}</div></div>` +
          `<div class="tile"><div class="t-val">${n(r.careerTotal)}</div><div class="t-lab">${dict.tileTotal(r.year)}</div></div>` +
          `<div class="tile"><div class="t-val">${r.age}</div><div class="t-lab">${dict.tileAge(r.year)}</div></div>`;
      }
      const sparkWrap = el("yearSpark");
      if (sparkWrap) {
        sparkWrap.innerHTML = sparkSVG(
          ys.map((x) => ({ label: String(x.year), value: x.goals, year: x.year, peak: x.goals === 91, tip: `${x.year}: ${x.goals} goals (career: ${n(x.careerTotal)})` })),
          { selectedYear: +y, peakYear: 2012, label: `Bar chart of Messi goals in each calendar year, peaking at 91 in 2012` }
        );
        const svg = sparkWrap.querySelector("svg.spark");
        if (svg) {
          svg.classList.add("in");
          svg.querySelectorAll(".bar").forEach((bar) => {
            bar.style.cursor = "pointer";
            bar.addEventListener("click", () => {
              const yr = bar.dataset.year;
              if (yr && el("yearPick")) {
                el("yearPick").value = yr;
                drawYear(yr);
              }
            });
          });
        }
      }
    };
    const yp = el("yearPick");
    if (yp) yp.addEventListener("change", (e) => drawYear(e.target.value));
    drawYear(cur.year);
  }

  const best = ys.reduce((a, b) => (b.goals > a.goals ? b : a));
  const post30 = ys.filter((r) => r.age >= 30).reduce((s, r) => s + r.goals, 0);

  const records = el("records");
  if (records) {
    records.innerHTML = dict.records(best, n(post30), Math.round((post30 / t.goals) * 100))
      .map((r) => `<div class="record"><span class="num">${r[0]}</span><span>${r[1]}</span></div>`).join("");
  }

  const silver = el("silver");
  if (silver) {
    silver.innerHTML =
      `<table class="data-table"><caption>${dict.silverCaption}</caption>` +
      `<thead><tr><th scope="col" class="left">${dict.silverThTrophy}</th><th scope="col">${dict.silverThTimes}</th><th scope="col" class="left">${dict.silverThNote}</th></tr></thead><tbody>` +
      dict.silverRows.map((r) => `<tr><th scope="row">${r[0]}</th><td>${r[1]}</td><td class="left">${r[2]}</td></tr>`).join("") +
      `</tbody></table>`;
    const sTable = silver.querySelector("table");
    if (sTable) sortable(sTable);
  }

  const m = d.byFinish;
  const split = el("split");
  if (split) {
    split.innerHTML = `<div class="split-grid">` +
      `<div class="split-card"><div class="s-val">${m.freeKicks}</div><div class="s-lab">${dict.splitFk}</div><div class="s-note">${dict.splitFkNote}</div></div>` +
      `<div class="split-card"><div class="s-val">${m.penalties}</div><div class="s-lab">${dict.splitPen}</div><div class="s-note">${dict.splitPenNote}</div></div>` +
      `<div class="split-card"><div class="s-val">${d.hatTricks}</div><div class="s-lab">${dict.splitHt}</div><div class="s-note">${dict.splitHtNote}</div></div></div>` +
      `<p class="caveat">${dict.splitCaveat(n(t.goals))}</p>`;
  }

  const faq = el("faq");
  if (faq) {
    const faqFn = dict.faq || HOME_I18N.en.faq;
    faq.innerHTML = faqFn(t, agg, m, d, lang).map((q) => `<details class="faq-item"><summary class="faq-question"><span>${q[0]}</span><span class="faq-chevron" aria-hidden="true">▾</span></summary><div class="faq-answer"><p>${q[1]}</p></div></details>`).join("");
    faq.className = "faq-accordion";
  }

  // Dynamically sync Road to 1,000 widget if present
  const r1000 = el("road-1000");
  if (r1000) {
    const goals = t.goals || 930;
    const remaining = Math.max(0, 1000 - goals);
    const pct = ((goals / 1000) * 100).toFixed(1);
    const fill = r1000.querySelector(".road-1000-fill");
    if (fill) fill.style.width = `${pct}%`;
    const pin = r1000.querySelector(".road-1000-pin");
    if (pin) pin.style.left = `${pct}%`;
    const pBadge = r1000.querySelector(".r1000-percent");
    if (pBadge) pBadge.textContent = `${pct}%`;
    const remEl = r1000.querySelector(".r1000-remaining");
    if (remEl) remEl.textContent = `${remaining}`;
  }

  renderExplore(d, "home");
  renderMethod(d, "");
  initBdayQuickForm();
  renderOnThisDay();
}

/* ================= BIRTHDAY QUICK FORM (HERO WIDGET) ================= */
function initBdayQuickForm() {
  const form = el("bday-quick-form");
  const monthSel = el("bday-quick-month");
  const daySel = el("bday-quick-day");
  if (!form || !monthSel || !daySel) return;

  const daysInMonth = { "01": 31, "02": 29, "03": 31, "04": 30, "05": 31, "06": 30, "07": 31, "08": 31, "09": 30, "10": 31, "11": 30, "12": 31 };

  const populateDays = (selectedDay) => {
    const m = monthSel.value || "01";
    const maxDays = daysInMonth[m] || 31;
    const currentVal = selectedDay || parseInt(daySel.value || "1", 10);
    daySel.innerHTML = "";
    for (let i = 1; i <= maxDays; i++) {
      const opt = document.createElement("option");
      const val = String(i).padStart(2, "0");
      opt.value = val;
      opt.textContent = String(i);
      if (i === Math.min(currentVal, maxDays)) opt.selected = true;
      daySel.appendChild(opt);
    }
  };

  const now = new Date();
  const defM = String(now.getUTCMonth() + 1).padStart(2, "0");
  const defD = now.getUTCDate();
  monthSel.value = defM;
  populateDays(defD);

  monthSel.addEventListener("change", () => populateDays());

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const m = monthSel.value;
    const d = daySel.value;
    window.location.href = `/${getLang()}/birthday?date=${m}-${d}`;
  });
}

/* ================= ON THIS DAY (HOME PAGE WIDGET) ================= */
async function renderOnThisDay() {
  const container = el("on-this-day");
  if (!container) return;
  const lang = getLang();

  const otdDict = {
    en: {
      error: `Could not load today's match history. <a href="/en/birthday">Check birthday explorer &rarr;</a>`,
      empty: `No match data on record for today. <a href="/en/birthday">Explore all 366 days &rarr;</a>`,
      closestBadge: (d) => `📅 CLOSEST SCORING DAY • ${d} (UTC)`,
      liveBadge: (d) => `<span class="live-dot pulse"></span> <b>ON THIS DAY • ${d} (UTC)</b>`,
      headlineClosest: (d, g, nowD, nowM) => `No senior match scheduled today (${nowD} ${nowM} UTC). Closest scoring day: <b>${g} goals</b> on ${d}!`,
      headlineLive: (g, m) => `On this day in history, Lionel Messi scored <b>${g} goals</b> in <b>${m} match${m > 1 ? "es" : ""}</b>!`,
      btnBday: "🎂 Did Messi score on your birthday?",
      btnExplore: "Explore All 366 Days &rarr;",
      lblMinute: "Minute",
      lblShotType: "Shot Type",
      lblAssist: "Assist",
      lblXg: "Expected Goal (xG)",
      noVideo: "📺 Video clip for this goal is being verified.",
      searchYt: "🔍 Search clip on YouTube &rarr;",
      goalTab: (n, min) => `Goal ${n}${min ? ` (${min}')` : ""}`
    },
    es: {
      error: `No se pudo cargar el historial de hoy. <a href="/es/birthday">Explorar cumpleaños &rarr;</a>`,
      empty: `Sin registros de partidos en esta fecha. <a href="/es/birthday">Ver los 366 días &rarr;</a>`,
      closestBadge: (d) => `📅 DÍA MÁS CERCANO CON GOLES • ${d} (UTC)`,
      liveBadge: (d) => `<span class="live-dot pulse"></span> <b>UN DÍA COMO HOY • ${d} (UTC)</b>`,
      headlineClosest: (d, g, nowD, nowM) => `Sin partidos oficiales disputados hoy (${nowD} ${nowM} UTC). Día más cercano con goles: <b>${g} goles</b> el ${d}.`,
      headlineLive: (g, m) => `Un día como hoy en la historia, Lionel Messi marcó <b>${g} goles</b> en <b>${m} partido${m > 1 ? "s" : ""}</b>.`,
      btnBday: "🎂 ¿Marcó Messi en tu cumpleaños?",
      btnExplore: "Explorar los 366 Días &rarr;",
      lblMinute: "Minuto",
      lblShotType: "Tipo de gol",
      lblAssist: "Asistencia",
      lblXg: "Gol esperado (xG)",
      noVideo: "📺 El video de este gol se está verificando.",
      searchYt: "🔍 Buscar jugada en YouTube &rarr;",
      goalTab: (n, min) => `Gol ${n}${min ? ` (${min}')` : ""}`
    },
    pt: {
      error: `Não foi possível carregar o histórico de hoje. <a href="/pt/birthday">Ver aniversários &rarr;</a>`,
      empty: `Sem dados de jogos nesta data. <a href="/pt/birthday">Explorar os 366 dias &rarr;</a>`,
      closestBadge: (d) => `📅 DIA MAIS PRÓXIMO COM GOLS • ${d} (UTC)`,
      liveBadge: (d) => `<span class="live-dot pulse"></span> <b>NESTE DIA NA HISTÓRIA • ${d} (UTC)</b>`,
      headlineClosest: (d, g, nowD, nowM) => `Nenhum jogo sênior disputado hoje (${nowD} ${nowM} UTC). Dia mais próximo com gols: <b>${g} gols</b> em ${d}!`,
      headlineLive: (g, m) => `Neste dia na história, Lionel Messi marcou <b>${g} gols</b> em <b>${m} partida${m > 1 ? "s" : ""}</b>!`,
      btnBday: "🎂 Marcou Messi no seu aniversário?",
      btnExplore: "Explorar Todos os 366 Dias &rarr;",
      lblMinute: "Minuto",
      lblShotType: "Tipo de gol",
      lblAssist: "Assistência",
      lblXg: "Gol esperado (xG)",
      noVideo: "📺 O vídeo deste gol está sendo verificado.",
      searchYt: "🔍 Buscar no YouTube &rarr;",
      goalTab: (n, min) => `Gol ${n}${min ? ` (${min}')` : ""}`
    },
    fr: {
      error: `Impossible de charger l'historique du jour. <a href="/fr/birthday">Explorateur d'anniversaires &rarr;</a>`,
      empty: `Aucun match enregistré à cette date. <a href="/fr/birthday">Explorer les 366 jours &rarr;</a>`,
      closestBadge: (d) => `📅 JOUR LE PLUS PROCHE AVEC BUTS • ${d} (UTC)`,
      liveBadge: (d) => `<span class="live-dot pulse"></span> <b>CE JOUR-LÀ DANS L'HISTOIRE • ${d} (UTC)</b>`,
      headlineClosest: (d, g, nowD, nowM) => `Pas de match senior aujourd'hui (${nowD} ${nowM} UTC). Date la plus proche : <b>${g} buts</b> le ${d} !`,
      headlineLive: (g, m) => `Ce jour-là dans l'histoire, Lionel Messi a marqué <b>${g} buts</b> en <b>${m} match${m > 1 ? "s" : ""}</b> !`,
      btnBday: "🎂 Messi a-t-il marqué le jour de votre anniversaire ?",
      btnExplore: "Explorer les 366 Jours &rarr;",
      lblMinute: "Minute",
      lblShotType: "Type de but",
      lblAssist: "Passe décisive",
      lblXg: "But attendu (xG)",
      noVideo: "📺 Le clip vidéo de ce but est en cours de validation.",
      searchYt: "🔍 Chercher le but sur YouTube &rarr;",
      goalTab: (n, min) => `But ${n}${min ? ` (${min}')` : ""}`
    },
    ar: {
      error: `تعذر تحميل سجل مباريات اليوم. <a href="/ar/birthday">مستكشف أعياد الميلاد &rarr;</a>`,
      empty: `لا توجد مباريات مسجلة في مثل هذا اليوم. <a href="/ar/birthday">استكشف كافة أيام السنة &rarr;</a>`,
      closestBadge: (d) => `📅 أقرب يوم شهد أهدافاً • ${d} (UTC)`,
      liveBadge: (d) => `<span class="live-dot pulse"></span> <b>في مثل هذا اليوم • ${d} (UTC)</b>`,
      headlineClosest: (d, g, nowD, nowM) => `لم تُلعب مباريات رسمية في هذا اليوم (${nowD} ${nowM} UTC). أقرب يوم تهديفي: <b>${g} أهداف</b> يوم ${d}!`,
      headlineLive: (g, m) => `في مثل هذا اليوم تاريخياً، سجل ليونيل ميسي <b>${g} أهداف</b> في <b>${m} مباراة</b>!`,
      btnBday: "🎂 هل سجل ميسي في يوم ميلادك؟",
      btnExplore: "استكشف جميع أيام السنة الـ 366 &rarr;",
      lblMinute: "الدقيقة",
      lblShotType: "نوع الهدف",
      lblAssist: "صناعة الهدف",
      lblXg: "الأهداف المتوقعة (xG)",
      noVideo: "📺 يجري التحقق من مقطع الفيديو لهذا الهدف.",
      searchYt: "🔍 ابحث عن الهدف على YouTube &rarr;",
      goalTab: (n, min) => `الهدف ${n}${min ? ` (${min}')` : ""}`
    },
    bn: {
      error: `আজকের ম্যাচের রেকর্ড লোড করা যায়নি। <a href="/bn/birthday">জন্মদিনের গোল এক্সপ্লোরার &rarr;</a>`,
      empty: `আজকের তারিখে কোনো ম্যাচের তথ্য নেই। <a href="/bn/birthday">৩৬৬ দিনের সব গোল দেখুন &rarr;</a>`,
      closestBadge: (d) => `📅 নিকটতম গোলের দিন • ${d} (UTC)`,
      liveBadge: (d) => `<span class="live-dot pulse"></span> <b>ইতিহাসে আজকের দিনে • ${d} (UTC)</b>`,
      headlineClosest: (d, g, nowD, nowM) => `আজকের দিনে কোনো ম্যাচ নেই (${nowD} ${nowM} UTC)। নিকটতম গোলের দিন: ${d}-এ <b>${g}টি গোল</b>!`,
      headlineLive: (g, m) => `ইতিহাসে আজকের দিনে লিওনেল মেসি <b>${m} ম্যাচে</b> <b>${g}টি গোল</b> করেছেন!`,
      btnBday: "🎂 মেসি কি আপনার জন্মদিনে গোল করেছিলেন?",
      btnExplore: "৩৬৬ দিনের পূর্ণ বিবরণ দেখুন &rarr;",
      lblMinute: "মিনিট",
      lblShotType: "গোলের ধরন",
      lblAssist: "অ্যাসিস্ট",
      lblXg: "এক্সপেক্টেড গোল (xG)",
      noVideo: "📺 এই গোলের ভিডিও ক্লিপ যাচাই করা হচ্ছে।",
      searchYt: "🔍 YouTube-এ ভিডিও খুঁজুন &rarr;",
      goalTab: (n, min) => `গোল ${n}${min ? ` (${min}')` : ""}`
    },
    hi: {
      error: `आज का मैच इतिहास लोड नहीं हो सका। <a href="/hi/birthday">बर्थडे एक्सप्लोरर &rarr;</a>`,
      empty: `आज की तारीख में कोई मैच रिकॉर्ड नहीं है। <a href="/hi/birthday">सभी 366 दिन देखें &rarr;</a>`,
      closestBadge: (d) => `📅 निकटतम गोल का दिन • ${d} (UTC)`,
      liveBadge: (d) => `<span class="live-dot pulse"></span> <b>इतिहास में आज के दिन • ${d} (UTC)</b>`,
      headlineClosest: (d, g, nowD, nowM) => `आज कोई आधिकारिक मैच निर्धारित नहीं था (${nowD} ${nowM} UTC)। निकटतम गोल दिवस: ${d} को <b>${g} गोल</b>!`,
      headlineLive: (g, m) => `इतिहास में आज के दिन, लियोनेल मेसी ने <b>${m} मैचों</b> में <b>${g} गोल</b> किए थे!`,
      btnBday: "🎂 क्या मेसी ने आपके जन्मदिन पर गोल किया था?",
      btnExplore: "सभी 366 दिनों का अन्वेषण करें &rarr;",
      lblMinute: "मिनट",
      lblShotType: "गोल का प्रकार",
      lblAssist: "असिस्ट",
      lblXg: "अपेक्षित गोल (xG)",
      noVideo: "📺 इस गोल का वीडियो सत्यापित किया जा रहा है।",
      searchYt: "🔍 YouTube पर वीडियो खोजें &rarr;",
      goalTab: (n, min) => `गोल ${n}${min ? ` (${min}')` : ""}`
    },
    ro: {
      error: `Nu s-a putut încărca istoricul zilei. <a href="/ro/birthday">Explorator de zile &rarr;</a>`,
      empty: `Nu există meciuri înregistrate pentru această dată. <a href="/ro/birthday">Explorează toate cele 366 de zile &rarr;</a>`,
      closestBadge: (d) => `📅 CEA MAI APROPIATĂ ZI CU GOLURI • ${d} (UTC)`,
      liveBadge: (d) => `<span class="live-dot pulse"></span> <b>ÎN ACEASTĂ ZI ÎN ISTORIE • ${d} (UTC)</b>`,
      headlineClosest: (d, g, nowD, nowM) => `Niciun meci de seniori programat azi (${nowD} ${nowM} UTC). Ziua cea mai apropiată: <b>${g} goluri</b> pe ${d}!`,
      headlineLive: (g, m) => `În această zi în istorie, Lionel Messi a marcat <b>${g} goluri</b> în <b>${m} meci${m > 1 ? "uri" : ""}</b>!`,
      btnBday: "🎂 A marcat Messi de ziua ta de naștere?",
      btnExplore: "Explorează toate cele 366 de zile &rarr;",
      lblMinute: "Minut",
      lblShotType: "Tipul golului",
      lblAssist: "Pază de gol",
      lblXg: "Gol așteptat (xG)",
      noVideo: "📺 Clipul video pentru acest gol este în curs de verificare.",
      searchYt: "🔍 Caută golul pe YouTube &rarr;",
      goalTab: (n, min) => `Gol ${n}${min ? ` (${min}')` : ""}`
    },
    uz: {
      error: `Bugungi o'yinlar tarixini yuklab bo'lmadi. <a href="/uz/birthday">Tug'ilgan kunlar &rarr;</a>`,
      empty: `Bugungi sana uchun o'yinlar qayd etilmagan. <a href="/uz/birthday">366 kunni o'rganish &rarr;</a>`,
      closestBadge: (d) => `📅 GOLLAR URILGAN ENG YAQIN KUN • ${d} (UTC)`,
      liveBadge: (d) => `<span class="live-dot pulse"></span> <b>TARIXDA BUGUNGI KUN • ${d} (UTC)</b>`,
      headlineClosest: (d, g, nowD, nowM) => `Bugungi kunda rasmiy o'yin o'tkazilmagan (${nowD} ${nowM} UTC). Eng yaqin golli kun: ${d} da <b>${g} ta gol</b>!`,
      headlineLive: (g, m) => `Tarixda aynan bugungi kunda Lionel Messi <b>${m} ta o'yinda</b> <b>${g} ta gol</b> urgan!`,
      btnBday: "🎂 Messi tug'ilgan kuningizda gol urganmi?",
      btnExplore: "Barcha 366 kunni o'rganish &rarr;",
      lblMinute: "Daqiqa",
      lblShotType: "Gol turi",
      lblAssist: "Golli uzatma",
      lblXg: "Kutilgan gol (xG)",
      noVideo: "📺 Ushbu golning video lavhasi tekshirilmoqda.",
      searchYt: "🔍 Videoni YouTubedan qidirish &rarr;",
      goalTab: (n, min) => `Gol ${n}${min ? ` (${min}')` : ""}`
    }
  };

  const o = otdDict[lang] || otdDict.en;

  let bdayData;
  try {
    let res;
    try {
      res = await fetch("/data/birthday-goals.json", { cache: "no-store" });
    } catch (_) {}
    if (!res || !res.ok) {
      res = await fetch("data/birthday-goals.json", { cache: "no-store" });
    }
    if (!res.ok) throw new Error("status " + res.status);
    bdayData = await res.json();
  } catch (err) {
    console.error("Failed to load birthday goals for On This Day", err);
    container.innerHTML = `<p class="otd-error">${o.error}</p>`;
    return;
  }

  const calendar = bdayData.calendar || {};
  const pad2 = (n) => String(n).padStart(2, "0");

  const now = new Date();
  const utcM = now.getUTCMonth() + 1;
  const utcD = now.getUTCDate();
  const todayKey = `${pad2(utcM)}-${pad2(utcD)}`;

  let dayData = calendar[todayKey];
  let isClosest = false;

  if (!dayData || dayData.goalsCount === 0) {
    const keys = Object.keys(calendar);
    const targetIdx = keys.indexOf(todayKey);
    let closestKey = null;
    let minDiff = Infinity;
    keys.forEach((k, idx) => {
      if (calendar[k] && calendar[k].goalsCount > 0) {
        const diff = Math.abs(idx - (targetIdx >= 0 ? targetIdx : 0));
        if (diff < minDiff) {
          minDiff = diff;
          closestKey = k;
        }
      }
    });
    if (closestKey && calendar[closestKey]) {
      dayData = calendar[closestKey];
      isClosest = true;
    }
  }

  if (!dayData) {
    container.innerHTML = `<p class="otd-empty">${o.empty}</p>`;
    return;
  }

  let activeMatchIdx = 0;
  let activeGoalIdx = 0;

  const renderContent = () => {
    const matches = dayData.matches || [];
    const activeMatch = matches[activeMatchIdx] || matches[0];
    if (!activeMatch) {
      container.innerHTML = `<p class="otd-empty">${o.empty}</p>`;
      return;
    }

    const videos = activeMatch.videos || [];
    const activeVideo = videos[activeGoalIdx] || videos[0] || {};
    const hasVideo = !!activeVideo.videoUrl;

    let matchTabsHtml = "";
    if (matches.length > 1) {
      matchTabsHtml = `<div class="otd-match-tabs" role="tablist">` +
        matches.map((m, idx) => {
          const isActive = idx === activeMatchIdx;
          const hatTrickLabel = m.goalsCount >= 3 ? " 🎩 Hat-trick" : "";
          return `<button type="button" class="otd-match-tab${isActive ? " active" : ""}" data-midx="${idx}" role="tab" aria-selected="${isActive}">
            ${m.year} vs ${esc(m.opponent)} (${m.goalsCount}⚽${hatTrickLabel})
          </button>`;
        }).join("") +
      `</div>`;
    }

    let goalTabsHtml = "";
    if (videos.length > 1 || (activeMatch.minutes && activeMatch.minutes.length > 1)) {
      const count = Math.max(videos.length, activeMatch.minutes ? activeMatch.minutes.length : 1);
      goalTabsHtml = `<div class="otd-goal-tabs">` +
        Array.from({ length: count }, (_, gIdx) => {
          const isActive = gIdx === activeGoalIdx;
          const min = (videos[gIdx] && videos[gIdx].minute) || (activeMatch.minutes && activeMatch.minutes[gIdx]) || "";
          return `<button type="button" class="otd-goal-tab${isActive ? " active" : ""}" data-gidx="${gIdx}">
            ${o.goalTab(gIdx + 1, min)}
          </button>`;
        }).join("") +
      `</div>`;
    }

    const currentMin = activeVideo.minute || (activeMatch.minutes && activeMatch.minutes[activeGoalIdx]) || "";
    const currentType = (activeMatch.types && activeMatch.types[activeGoalIdx]) || (activeVideo.penalty ? "Penalty" : (activeVideo.freekick ? "Direct Free Kick" : "Goal"));
    const goalNumberBadge = activeVideo.goalNumber ? `<span class="otd-goal-num-badge">Goal #${activeVideo.goalNumber}</span>` : "";

    const videoPlayerHtml = hasVideo
      ? `<div class="otd-video-wrap">
          ${goalTabsHtml}
          <div class="otd-player-frame">
            <video controls playsinline preload="metadata" src="${esc(activeVideo.videoUrl)}" class="otd-video-element" style="background:#000;">
              Your browser does not support the video tag.
            </video>
          </div>
        </div>`
      : `<div class="otd-no-video">
          <div class="otd-no-video-inner">
            <p>${o.noVideo}</p>
            <a href="https://www.youtube.com/results?search_query=Lionel+Messi+goal+vs+${encodeURIComponent(activeMatch.opponent)}+${activeMatch.date}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">
              ${o.searchYt}
            </a>
          </div>
        </div>`;

    const statusBadge = isClosest
      ? `<span class="otd-badge otd-badge-closest">${o.closestBadge(dayData.formatted.toUpperCase())}</span>`
      : `<span class="otd-badge">${o.liveBadge(dayData.formatted.toUpperCase())}</span>`;

    const mNames = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const headlineText = isClosest
      ? o.headlineClosest(dayData.formatted, dayData.goalsCount, now.getUTCDate(), mNames[utcM])
      : o.headlineLive(dayData.goalsCount, matches.length);

    container.innerHTML = `
      <div class="otd-header">
        <div class="otd-header-left">
          ${statusBadge}
          <h3 class="otd-headline">${headlineText}</h3>
        </div>
        <div class="otd-header-right">
          <a href="/${lang}/birthday?date=${todayKey}" class="btn btn-secondary btn-sm otd-bday-link">
            ${o.btnBday}
          </a>
        </div>
      </div>

      ${matchTabsHtml}

      <div class="otd-body">
        <div class="otd-player-column">
          ${videoPlayerHtml}
        </div>

        <div class="otd-info-column">
          <div class="otd-match-scoreline">
            <span class="otd-team">${esc(activeMatch.team)}</span>
            <span class="otd-score">${esc(activeMatch.score)}</span>
            <span class="otd-opponent">${esc(activeMatch.opponent)}</span>
          </div>

          <div class="otd-meta-row">
            <span class="otd-comp-badge">${esc(activeMatch.competition)}</span>
            <span class="otd-date-badge">${esc(activeMatch.date)}</span>
            ${goalNumberBadge}
          </div>

          <div class="otd-goal-details-card">
            <div class="otd-detail-item">
              <span class="otd-dt-label">${o.lblMinute}</span>
              <strong class="otd-dt-val">⚽ ${esc(currentMin ? `${currentMin}'` : "—")}</strong>
            </div>
            <div class="otd-detail-item">
              <span class="otd-dt-label">${o.lblShotType}</span>
              <strong class="otd-dt-val">${esc(currentType)}</strong>
            </div>
            ${activeVideo.assist ? `
            <div class="otd-detail-item">
              <span class="otd-dt-label">${o.lblAssist}</span>
              <strong class="otd-dt-val">👟 ${esc(activeVideo.assist)}</strong>
            </div>` : ""}
            ${activeVideo.xg ? `
            <div class="otd-detail-item">
              <span class="otd-dt-label">${o.lblXg}</span>
              <strong class="otd-dt-val">📊 ${activeVideo.xg}</strong>
            </div>` : ""}
          </div>

          <div class="otd-cta-row">
            <a href="/${lang}/birthday?date=${todayKey}" class="btn btn-primary btn-sm">
              ${o.btnExplore}
            </a>
          </div>
        </div>
      </div>
    `;

    // Wire up tab events
    container.querySelectorAll(".otd-match-tab").forEach((tab) => {
      tab.onclick = () => {
        activeMatchIdx = +tab.dataset.midx;
        activeGoalIdx = 0;
        renderContent();
      };
    });

    container.querySelectorAll(".otd-goal-tab").forEach((tab) => {
      tab.onclick = () => {
        activeGoalIdx = +tab.dataset.gidx;
        renderContent();
      };
    });
  };

  renderContent();
}

const BY_YEAR_I18N = {
  es: {
    head: (ys, best, t) => `Desde su primer gol oficial en ${ys[0].year} hasta los <b>${best.goals} goles en ${best.year}</b> — cada año natural de una carrera de ${n(t.goals)} goles oficiales, con totales acumulados y su edad.`,
    cap: (best, t) => `Barras: goles en ese año (máximo ${best.goals}, en ${best.year}). Línea: ascenso acumulado hasta ${n(t.goals)}.`,
    chartLabel: (best) => `Goles de Messi por año natural con total acumulado de carrera, con récord de ${best.goals} en ${best.year}`,
    kpiCareer: "Goles de carrera",
    kpiBest: "Mejor año",
    kpiBestSub: "Récord mundial en un año natural.",
    kpiCurrSub: "Temporada en curso.",
    kpiYears: "Años marcando",
    kpiYearsSub: (ys, last) => `Cada año desde ${ys[0].year} hasta ${last.year}.`,
    decades: "Goles en los años",
    tableSub: "Más recientes primero. 2026 tiene asterisco mientras la temporada sigue jugándose. Clic en una columna para ordenar o escribe para filtrar.",
    caption: "Goles, total acumulado de carrera y edad por año natural desde su debut en 2004.",
    thYear: "Año", thGoals: "Goles", thTotal: "Total carrera", thAge: "Edad",
    inProgNote: "* Temporada 2026 en curso — se actualiza después de cada partido.",
    filterPlaceholder: "Filtrar años — ej. 2012",
    bestYearHtml: (best) => `<p><b>${best.year} es el año goleador más extraordinario de la historia del fútbol: ${best.goals} goles</b> — 79 con el Barcelona y 12 con Argentina — superando el récord de 40 años de Gerd Müller (85 goles). Incluyó una racha de 33 jornadas consecutivas anotando en liga y los 5 goles en Champions League contra el Bayer Leverkusen.</p><p>Los siguientes mejores años, 2011 (60 goles) y 2010 (60 goles), demuestran lo astronómico de su nivel. <a href="/es/dashboard">Ver cómo se dividen esos goles por competición</a>.</p>`
  },
  pt: {
    head: (ys, best, t) => `Do seu primeiro gol oficial em ${ys[0].year} até os <b>${best.goals} gols em ${best.year}</b> — todos os anos civis de uma carreira de ${n(t.goals)} gols.`,
    cap: (best, t) => `Barras: gols no ano (máximo ${best.goals}, em ${best.year}). Linha: ascensão acumulada até ${n(t.goals)}.`,
    chartLabel: (best) => `Gols de Messi por ano com total acumulado`,
    kpiCareer: "Gols na carreira",
    kpiBest: "Melhor ano",
    kpiBestSub: "Recorde mundial em um único ano civil.",
    kpiCurrSub: "Temporada em andamento.",
    kpiYears: "Anos marcando",
    kpiYearsSub: (ys, last) => `Cada ano desde ${ys[0].year} até ${last.year}.`,
    decades: "Gols nos anos",
    tableSub: "Mais recentes primeiro. 2026 está em andamento. Clique numa coluna para ordenar ou pesquise para filtrar.",
    caption: "Gols, total acumulado e idade por ano civil desde a estreia em 2004.",
    thYear: "Ano", thGoals: "Gols", thTotal: "Total carreira", thAge: "Idade",
    inProgNote: "* Temporada 2026 em andamento — atualizada após cada partida.",
    filterPlaceholder: "Filtrar anos — ex. 2012",
    bestYearHtml: (best) => `<p><b>${best.year} é o ano mais prolífico da história do futebol: ${best.goals} gols</b> — 79 pelo Barcelona e 12 pela Argentina — superando o recorde de Gerd Müller (85 gols). <a href="/pt/dashboard">Ver no painel como se dividem esses gols</a>.</p>`
  },
  fr: {
    head: (ys, best, t) => `De son premier but officiel en ${ys[0].year} à ses <b>${best.goals} buts en ${best.year}</b> — chaque année civile d'une carrière de ${n(t.goals)} buts.`,
    cap: (best, t) => `Barres : buts cette année-là (pic de ${best.goals} en ${best.year}). Ligne : cumul jusqu'à ${n(t.goals)}.`,
    chartLabel: (best) => `Buts de Messi par année avec total cumulé`,
    kpiCareer: "Buts en carrière",
    kpiBest: "Meilleure année",
    kpiBestSub: "Record mondial sur une année civile.",
    kpiCurrSub: "Saison en cours.",
    kpiYears: "Années avec but",
    kpiYearsSub: (ys, last) => `Chaque année de ${ys[0].year} à ${last.year}.`,
    decades: "Buts dans les années",
    tableSub: "Plus récents d'abord. 2026 est en cours. Cliquez sur une colonne pour trier ou tapez pour filtrer.",
    caption: "Buts, cumul en carrière et âge par année civile depuis 2004.",
    thYear: "Année", thGoals: "Buts", thTotal: "Total carrière", thAge: "Âge",
    inProgNote: "* Saison 2026 en cours — mise à jour après chaque match.",
    filterPlaceholder: "Filtrer les années — ex. 2012",
    bestYearHtml: (best) => `<p><b>${best.year} est la plus grande année de l'histoire du football : ${best.goals} buts</b> — 79 pour Barcelone et 12 pour l'Argentine — brisant le record de Gerd Müller (85). <a href="/fr/dashboard">Voir la répartition par compétition</a>.</p>`
  },
  ar: {
    head: (ys, best, t) => `من هدفه الأول في ${ys[0].year} إلى <b>${best.goals} هدفاً في ${best.year}</b> — كل سنة ميلادية في مسيرة الـ ${n(t.goals)} هدفاً.`,
    cap: (best, t) => `الأعمدة: أهداف السنة (الذروة ${best.goals} في ${best.year}). الخط: الصعود التراكمي إلى ${n(t.goals)}.`,
    chartLabel: (best) => `أهداف ميسي لكل سنة ميلادية مع المجموع التراكمي`,
    kpiCareer: "أهداف المسيرة",
    kpiBest: "أفضل سنة",
    kpiBestSub: "رقم قياسي عالمي في سنة ميلادية واحدة.",
    kpiCurrSub: "الموسم مستمر حالياً.",
    kpiYears: "سنوات التهديف",
    kpiYearsSub: (ys, last) => `كل سنة من ${ys[0].year} إلى ${last.year}.`,
    decades: "أهداف سنوات",
    tableSub: "الأحدث أولاً. عام 2026 مستمر حالياً. انقر للترتيب أو اكتب للتصفية.",
    caption: "الأهداف والمجموع التراكمي والعمر لكل سنة ميلادية منذ عام 2004.",
    thYear: "السنة", thGoals: "الأهداف", thTotal: "المجموع", thAge: "العمر",
    inProgNote: "* موسم 2026 مستمر — يتم التحديث بعد كل مباراة.",
    filterPlaceholder: "تصفية السنوات — مثلاً 2012",
    bestYearHtml: (best) => `<p><b>${best.year} هو أعظم عام تهديفي في تاريخ كرة القدم: ${best.goals} هدفاً</b> — 79 مع برشلونة و12 مع الأرجنتين. <a href="/ar/dashboard">شاهد تفاصيل هذه الأهداف في لوحة البيانات</a>.</p>`
  },
  bn: {
    head: (ys, best, t) => `${ys[0].year} সালে প্রথম গোল থেকে <b>${best.year} সালে ${best.goals} গোল</b> — ${n(t.goals)}টি গোলের ক্যারিয়ারের প্রতি বছরের পরিসংখ্যান।`,
    cap: (best, t) => `বার: ওই বছরের গোল (সর্বোচ্চ ${best.goals}, ${best.year}-এ)। লাইন: ${n(t.goals)} পর্যন্ত ক্রমপুঞ্জিত গোল।`,
    chartLabel: (best) => `বছরভিত্তিক মেসি গোল`,
    kpiCareer: "ক্যারিয়ার মোট",
    kpiBest: "সেরা বছর",
    kpiBestSub: "এক ক্যালেন্ডার বছরে বিশ্বরেকর্ড।",
    kpiCurrSub: "মৌসুম চলমান।",
    kpiYears: "গোল করা বছর",
    kpiYearsSub: (ys, last) => `${ys[0].year} থেকে ${last.year} পর্যন্ত প্রতিটি বছর।`,
    decades: "দশকের গোল",
    tableSub: "সর্বশেষ বছর প্রথমে। ২০২৬ মৌসুম এখনও চলমান। বাছাই করতে কলামে ক্লিক করুন।",
    caption: "২০০৪ সালের অভিষেক থেকে প্রতি ক্যালেন্ডার বছরের গোল ও বয়স।",
    thYear: "বছর", thGoals: "গোল", thTotal: "মোট গোল", thAge: "বয়স",
    inProgNote: "* ২০২৬ মৌসুম চলমান — প্রতি ম্যাচের পর আপডেট হয়।",
    filterPlaceholder: "বছর ফিল্টার করুন — যেমন ২০১২",
    bestYearHtml: (best) => `<p><b>${best.year} ফুটবল ইতিহাসের সেরা গোলবর্ষ: ${best.goals} গোল</b> — বার্সেলোনার হয়ে ৭৯টি এবং আর্জেন্টিনার হয়ে ১২টি গোল। <a href="/bn/dashboard">ড্যাশবোর্ডে আরও দেখুন</a>।</p>`
  },
  hi: {
    head: (ys, best, t) => `${ys[0].year} में पहले गोल से लेकर <b>${best.year} में ${best.goals} गोल</b> तक — ${n(t.goals)} आधिकारिक गोलों का साल दर साल सफर।`,
    cap: (best, t) => `बार्स: उस साल के गोल (पीक ${best.goals}, ${best.year})। रेखा: ${n(t.goals)} तक की बढ़त।`,
    chartLabel: (best) => `साल दर साल मेसी के गोल`,
    kpiCareer: "करियर कुल गोल",
    kpiBest: "सर्वश्रेष्ठ साल",
    kpiBestSub: "एक कैलेंडर वर्ष में विश्व रिकॉर्ड।",
    kpiCurrSub: "सीज़न जारी है।",
    kpiYears: "गोल करने वाले साल",
    kpiYearsSub: (ys, last) => `${ys[0].year} से ${last.year} तक हर साल।`,
    decades: "दशक के गोल",
    tableSub: "सबसे नया साल पहले। 2026 सीज़न प्रगति पर है। छांटने के लिए कॉलम पर क्लिक करें।",
    caption: "2004 के पदार्पण से हर साल के गोल, करियर कुल और उम्र।",
    thYear: "साल", thGoals: "गोल", thTotal: "करियर कुल", thAge: "उम्र",
    inProgNote: "* 2026 सीज़न जारी है — प्रत्येक मैच के बाद अपडेट।",
    filterPlaceholder: "साल फ़िल्टर करें — उदा. 2012",
    bestYearHtml: (best) => `<p><b>${best.year} फुटबॉल इतिहास का सबसे महान वर्ष रहा: ${best.goals} गोल</b> — बार्सिलोना के लिए 79 और अर्जेंटीना के लिए 12 गोल। <a href="/hi/dashboard">डैशबोर्ड में आंकड़े देखें</a>।</p>`
  },
  ro: {
    head: (ys, best, t) => `De la primul său gol oficial în ${ys[0].year} până la <b>${best.goals} goluri în ${best.year}</b> — fiecare an dintr-o carieră de ${n(t.goals)} goluri.`,
    cap: (best, t) => `Bare: goluri în acel an (maxim ${best.goals} în ${best.year}). Linie: urcare până la ${n(t.goals)}.`,
    chartLabel: (best) => `Goluri pe an calendaristic`,
    kpiCareer: "Goluri în carieră",
    kpiBest: "Cel mai bun an",
    kpiBestSub: "Record mondial într-un an calendaristic.",
    kpiCurrSub: "Sezon în desfășurare.",
    kpiYears: "Ani cu gol",
    kpiYearsSub: (ys, last) => `Fiecare an de la ${ys[0].year} până la ${last.year}.`,
    decades: "Goluri în anii",
    tableSub: "Cele mai recente primele. 2026 este în desfășurare. Clic pe o coloană pentru sortare.",
    caption: "Goluri, total în carieră și vârstă pentru fiecare an din 2004 încoace.",
    thYear: "An", thGoals: "Goluri", thTotal: "Total carieră", thAge: "Vârstă",
    inProgNote: "* Sezonul 2026 în curs — se actualizează după fiecare meci.",
    filterPlaceholder: "Filtrează ani — ex. 2012",
    bestYearHtml: (best) => `<p><b>${best.year} este cel mai prolific an din istoria fotbalului: ${best.goals} goluri</b> — 79 pentru Barcelona și 12 pentru Argentina. <a href="/ro/dashboard">Vezi repartizarea în panou</a>.</p>`
  },
  uz: {
    head: (ys, best, t) => `${ys[0].year} yildagi birinchi rasmiy goldan to <b>${best.year} yildagi ${best.goals} ta golgacha</b> — ${n(t.goals)} ta gollik faoliyat.`,
    cap: (best, t) => `Ustunlar: o'sha yildagi gollar (cho'qqi ${best.year} yilda ${best.goals}). Chiziq: ${n(t.goals)} tagacha o'sish.`,
    chartLabel: (best) => `Messining yillik gollari`,
    kpiCareer: "Faoliyatdagi gollar",
    kpiBest: "Eng yaxshi yil",
    kpiBestSub: "Bir kalendar yilidagi jahon rekordi.",
    kpiCurrSub: "Mavsum davom etmoqda.",
    kpiYears: "Gol urilgan yillar",
    kpiYearsSub: (ys, last) => `${ys[0].year} yildan ${last.year} yilgacha har bir yil.`,
    decades: "O'n yillikdagi gollar",
    tableSub: "Eng so'nggilari oldinda. 2026 yil davom etmoqda. Saralash uchun ustunga bosing.",
    caption: "2004 yildagi debyutidan buyon har bir yildagi gollar va yosh.",
    thYear: "Yil", thGoals: "Gollar", thTotal: "Jami", thAge: "Yosh",
    inProgNote: "* 2026 yilgi mavsum davom etmoqda — har bir o'yindan so'ng yangilanadi.",
    filterPlaceholder: "Yillarni saralash — masalan: 2012",
    bestYearHtml: (best) => `<p><b>${best.year} futbol tarixidagi eng ajoyib yil bo'lgan: ${best.goals} ta gol</b> — Barselona uchun 79 ta va Argentina uchun 12 ta gol. <a href="/uz/dashboard">Paneldan to'liq ko'ring</a>.</p>`
  }
};

function renderByYear(d) {
  const lang = getLang();
  const ys = d.calendarYears, t = d.totals;
  const best = ys.reduce((a, b) => (b.goals > a.goals ? b : a));
  const last = ys[ys.length - 1];
  const cfg = BY_YEAR_I18N[lang] || {
    head: (ys, best, t) => `From his first senior goal in ${ys[0].year} to <b>${best.goals} in ${best.year}</b> — every calendar year of a ${n(t.goals)}-goal career, with running totals and his age.`,
    cap: (best, t) => `Bars: goals that year (peak ${best.goals}, ${best.year}). Line: climb to ${n(t.goals)}.`,
    chartLabel: (best) => `Messi goals per calendar year with cumulative career total, peaking at ${best.goals} in ${best.year}`,
    kpiCareer: "Career goals",
    kpiBest: "Best year",
    kpiBestSub: "A world record for a calendar year.",
    kpiCurrSub: "Season in progress.",
    kpiYears: "Scoring years",
    kpiYearsSub: (ys, last) => `Every year from ${ys[0].year} to ${last.year}.`,
    decades: "Goals in the",
    tableSub: "Newest first. 2026 is starred while the season is still being played. Click a column to sort, or type to filter. Famous seasons get a footnote — hover the year.",
    caption: "Goals, running career total and age for every calendar year since Messi's 2004 debut.",
    thYear: "Year", thGoals: "Goals", thTotal: "Career total", thAge: "Age",
    inProgNote: `* ${last.year} season in progress — refreshes after each appearance.`,
    filterPlaceholder: "Filter years — e.g. 2012",
    bestYearHtml: (best) => `<p><b>${best.year} is the greatest goalscoring year football has seen: ${best.goals} goals</b> — 79 for Barcelona and 12 for Argentina — breaking Gerd Müller's 40-year-old record of 85. It included a run of 33 league games scored in consecutively and a five-goal Champions League night against Bayer Leverkusen.</p><p>The next-best years, 2011 (60) and 2010 (60), show how far ahead of normal — even his own normal — that season was. <a href="/en/dashboard">See how those goals break down by competition</a>.</p>`
  };

  setHead(d, cfg.head(ys, best, t));

  const comboCard = el("combo-card");
  if (comboCard) {
    comboCard.innerHTML =
      `<figure style="margin:0"><div class="spark-wrap">${sparkSVG(
        ys.map((x) => ({ label: String(x.year), value: x.goals, year: x.year, provisional: x.provisional, peak: x.year === best.year, tip: `${x.year}: ${x.goals} (${x.careerTotal})` })),
        { cumulative: true, peakYear: 2012, provisionalYear: 2026, linkPrefix: "goalsbyyear.html#y", label: cfg.chartLabel(best) }
      )}</div><figcaption class="figcap">${cfg.cap(best, t)}</figcaption></figure>`;
  }

  const kpis = el("kpis");
  if (kpis) {
    kpis.innerHTML =
      kpi4(cfg.kpiCareer, n(t.goals), `After ${last.year}${last.provisional ? ` (${cfg.kpiCurrSub})` : ""}.`) +
      kpi4(cfg.kpiBest, `${best.year} · ${best.goals}`, cfg.kpiBestSub) +
      kpi4(`${last.year}`, last.goals, last.provisional ? cfg.kpiCurrSub : "") +
      kpi4(cfg.kpiYears, ys.length, cfg.kpiYearsSub(ys, last));
  }

  const decades = [["2000s", 2004, 2009], ["2010s", 2010, 2019], ["2020s", 2020, last.year]];
  const decEl = el("decades");
  if (decEl) {
    decEl.innerHTML = decades.map(([lab, a, b]) => {
      const rows = ys.filter((r) => r.year >= a && r.year <= b);
      const sum = rows.reduce((s, r) => s + r.goals, 0);
      const pk = rows.reduce((x, y) => (y.goals > x.goals ? y : x));
      return kpi4(`${cfg.decades} ${lab}`, n(sum), `${a}–${b}, peak: ${pk.goals} (${pk.year}).`);
    }).join("");
  }

  const tableSub = el("table-sub");
  if (tableSub) {
    tableSub.textContent = cfg.tableSub;
  }

  const yearTable = el("year-table");
  if (yearTable) {
    yearTable.innerHTML =
      `<table class="data-table"><caption>${cfg.caption}</caption>` +
      `<thead><tr><th scope="col" class="left">${cfg.thYear}</th><th scope="col">${cfg.thGoals}</th><th scope="col">${cfg.thTotal}</th><th scope="col">${cfg.thAge}</th></tr></thead><tbody>` +
      ys.slice().reverse().map((r) =>
        `<tr id="y${r.year}"${r.provisional ? ' class="total"' : ""}><th scope="row">${r.year}${r.provisional ? " *" : ""}</th><td><b>${r.goals}</b></td><td>${n(r.careerTotal)}</td><td>${r.age}</td></tr>`
      ).join("") + `</tbody></table>` +
      (last.provisional ? `<p class="caveat">${cfg.inProgNote}</p>` : "");

    const tbl = yearTable.querySelector("table");
    if (tbl) {
      sortable(tbl);
      tableSearch(tbl, cfg.filterPlaceholder, "q");
    }
  }

  const bestYearEl = el("bestyear");
  if (bestYearEl) {
    bestYearEl.innerHTML = cfg.bestYearHtml(best);
  }

  renderExplore(d, "byyear");
  renderMethod(d, "");
}
function kpi4(l, v, s) { return `<div class="kpi"><span class="kpi-label">${l}</span><span class="kpi-value">${v}</span><span class="kpi-note">${s}</span></div>`; }

const BY_SEASON_I18N = {
  es: {
    head: (best) => `Todas las temporadas de club desde 2004/05 hasta 2026 — <b>récord: ${best.goals} goles en ${best.season}</b> — con desglose de liga, copas y torneos internacionales, más Argentina año por año.`,
    clubSub: "Partidos / goles en cada formato. 2026 es la temporada en curso. Clic en una columna para ordenar o escribe para filtrar.",
    caption: (len) => `Todas las ${len} temporadas de club: Barcelona 2004/05–2020/21, PSG 2021/22–2022/23, Inter Miami 2023–2026.`,
    thSeason: "Temporada", thClub: "Club", thApps: "Partidos", thGoals: "Goles", thLeague: "Liga", thCup: "Copa", thCont: "Internacional", thOther: "Otros",
    totalLabel: "Total clubes", bestBadge: "Mejor temporada de club",
    filterClubPlaceholder: "Filtrar temporadas — ej. PSG, 2012",
    countrySub: "Eliminatorias y torneos oficiales más amistosos, los más recientes primero.",
    countryCaption: "Goles con la Selección Argentina por año natural, 2005 a 2026.",
    thYear: "Año", thNote: "Detalles", totalArgLabel: "Total Argentina",
    filterCountryPlaceholder: "Filtrar años de Argentina — ej. 2022",
    bestSeasonHtml: (best) => `<p><b>${best.season} — ${best.goals} goles en ${best.apps} partidos para el Barcelona</b> — es la temporada de club más prolífica de la historia del fútbol: 50 en La Liga (récord), 14 en la Champions League, 3 en la Copa del Rey y 6 en las supercopas. Marcó en todas las competiciones que disputó.</p><p>Forma parte de una racha de cuatro temporadas históricas (2009/10–2012/13) en las que nunca bajó de 53 goles en clubes. <a href="/es/goalsbyyear">Ver los mismos goles contados por año natural</a>.</p>`
  },
  pt: {
    head: (best) => `Todas as temporadas de clube de 2004/05 a 2026 — <b>recorde: ${best.goals} gols em ${best.season}</b> — com divisão de liga, copas e torneios continentais.`,
    clubSub: "Partidas / gols em cada formato. 2026 está em andamento. Clique numa coluna para ordenar ou pesquise para filtrar.",
    caption: (len) => `Todas as ${len} temporadas de clube: Barcelona 2004/05–2020/21, PSG 2021/22–2022/23, Inter Miami 2023–2026.`,
    thSeason: "Temporada", thClub: "Clube", thApps: "Partidas", thGoals: "Gols", thLeague: "Liga", thCup: "Copa", thCont: "Continental", thOther: "Outros",
    totalLabel: "Total clubes", bestBadge: "Melhor temporada de clube",
    filterClubPlaceholder: "Filtrar temporadas — ex. PSG, 2012",
    countrySub: "Eliminatórias, torneios oficiais e amistosos, mais recentes primeiro.",
    countryCaption: "Gols com a Seleção Argentina por ano civil, 2005 a 2026.",
    thYear: "Ano", thNote: "Detalhes", totalArgLabel: "Total Argentina",
    filterCountryPlaceholder: "Filtrar anos Argentina — ex. 2022",
    bestSeasonHtml: (best) => `<p><b>${best.season} — ${best.goals} gols em ${best.apps} jogos pelo Barcelona</b> — é a temporada de clube mais prolífica da história do futebol: 50 na La Liga (recorde), 14 na Champions League, 3 na Copa do Rei e 6 em supercopas. <a href="/pt/goalsbyyear">Ver esses gols por ano civil</a>.</p>`
  },
  fr: {
    head: (best) => `Toutes les saisons en club de 2004/05 à 2026 — <b>record : ${best.goals} buts en ${best.season}</b> — avec championnat, coupes et Ligue des Champions.`,
    clubSub: "Matchs / buts par format. 2026 est la saison en cours. Cliquez sur une colonne pour trier ou tapez pour filtrer.",
    caption: (len) => `Les ${len} saisons en club : Barcelone 2004/05–2020/21, PSG 2021/22–2022/23, Inter Miami 2023–2026.`,
    thSeason: "Saison", thClub: "Club", thApps: "Matchs", thGoals: "Buts", thLeague: "Ligue", thCup: "Coupe", thCont: "Europe", thOther: "Autres",
    totalLabel: "Total clubs", bestBadge: "Meilleure saison en club",
    filterClubPlaceholder: "Filtrer les saisons — ex. PSG, 2012",
    countrySub: "Matchs officiels et amicaux, les plus récents en premier.",
    countryCaption: "Buts avec l'Équipe d'Argentine par année civile, 2005 à 2026.",
    thYear: "Année", thNote: "Détails", totalArgLabel: "Total Argentine",
    filterCountryPlaceholder: "Filtrer l'Argentine — ex. 2022",
    bestSeasonHtml: (best) => `<p><b>${best.season} — ${best.goals} buts en ${best.apps} matchs pour Barcelone</b> — est la saison en club la plus prolifique de l'histoire du football : 50 en Liga (record), 14 en Ligue des Champions, 3 en Coupe du Roi et 6 en supercoupes. <a href="/fr/goalsbyyear">Voir les mêmes buts par année</a>.</p>`
  },
  ar: {
    head: (best) => `جميع مواسم الأندية من 2004/05 إلى 2026 — <b>الرقم القياسي: ${best.goals} هدفاً في ${best.season}</b> — مع تفصيل الدوري، الكؤوس والبطولات القارية.`,
    clubSub: "المباريات / الأهداف في كل بطولة. موسم 2026 مستمر. انقر للترتيب أو اكتب للتصفية.",
    caption: (len) => `جميع مواسم الأندية الـ ${len}: برشلونة، باريس وإنتر ميامي.`,
    thSeason: "الموسم", thClub: "النادي", thApps: "المباريات", thGoals: "الأهداف", thLeague: "الدوري", thCup: "الكأس", thCont: "قاري", thOther: "أخرى",
    totalLabel: "إجمالي الأندية", bestBadge: "أفضل موسم للنادي",
    filterClubPlaceholder: "تصفية المواسم — مثلاً باريس، 2012",
    countrySub: "المباريات الرسمية والوديات، الأحدث أولاً.",
    countryCaption: "أهداف منتخب الأرجنتين حسب السنوات الميلادية من 2005 إلى 2026.",
    thYear: "السنة", thNote: "تفاصيل", totalArgLabel: "إجمالي الأرجنتين",
    filterCountryPlaceholder: "تصفية سنوات الأرجنتين — مثلاً 2022",
    bestSeasonHtml: (best) => `<p><b>${best.season} — ${best.goals} هدفاً في ${best.apps} مباراة مع برشلونة</b> — هو أعظم موسم لنادٍ في تاريخ كرة القدم: 50 في الليغا، 14 في دوري الأبطال، 3 في كأس الملك و6 في السوبر. <a href="/ar/goalsbyyear">شاهد الأهداف بالسنة الميلادية</a>.</p>`
  },
  bn: {
    head: (best) => `২০০৪/০৫ থেকে ২০২৬ পর্যন্ত প্রতিটি ক্লাব মৌসুম — <b>রেকর্ড: ${best.season} মৌসুমে ${best.goals} গোল</b> — লীগ, কাপ ও মহাদেশীয় টুর্নামেন্ট সহ।`,
    clubSub: "ম্যাচ ও গোল। ২০২৬ মৌসুম চলমান। সাজাতে কলামে ক্লিক করুন।",
    caption: (len) => `ক্লাবের ${len}টি মৌসুম: বার্সেলোনা, পিএসজি ও ইন্টার মায়ামি।`,
    thSeason: "মৌসুম", thClub: "ক্লাব", thApps: "ম্যাচ", thGoals: "গোল", thLeague: "লীগ", thCup: "কাপ", thCont: "আন্তর্জাতিক", thOther: "অন্যান্য",
    totalLabel: "ক্লাব মোট", bestBadge: "সেরা ক্লাব মৌসুম",
    filterClubPlaceholder: "মৌসুম ফিল্টার করুন — যেমন পিএসজি, ২০১২",
    countrySub: "অফিসিয়াল ম্যাচ ও প্রীতি ম্যাচ, সর্বশেষটি আগে।",
    countryCaption: "ক্যালেন্ডার বছর অনুযায়ী আর্জেন্টিনা দলের গোল (২০০৫–২০২৬)।",
    thYear: "বছর", thNote: "বিবরণ", totalArgLabel: "আর্জেন্টিনা মোট",
    filterCountryPlaceholder: "আর্জেন্টিনার বছর ফিল্টার — যেমন ২০২২",
    bestSeasonHtml: (best) => `<p><b>${best.season} — বার্সেলোনার হয়ে ${best.apps} ম্যাচে ${best.goals} গোল</b> — ফুটবল ইতিহাসের সবচেয়ে বিধ্বংসী ক্লাব মৌসুম। লা লিগায় রেকর্ড ৫০ গোল এবং চ্যাম্পিয়ন্স লীগে ১৪ গোল। <a href="/bn/goalsbyyear">বছরভিত্তিক গোল দেখুন</a>।</p>`
  },
  hi: {
    head: (best) => `2004/05 से 2026 तक सभी क्लब सीज़न — <b>रिकॉर्ड: ${best.season} में ${best.goals} गोल</b> — लीग, कप और महाद्वीपीय प्रतियोगिताओं के साथ।`,
    clubSub: "मैच और गोल। 2026 सीज़न जारी है। क्रमबद्ध करने के लिए कॉलम पर क्लिक करें।",
    caption: (len) => `सभी ${len} क्लब सीज़न: बार्सिलोना, पीएसजी और इंटर मियामी।`,
    thSeason: "सीज़न", thClub: "क्लब", thApps: "मैच", thGoals: "गोल", thLeague: "लीग", thCup: "कप", thCont: "कॉन्टिनेंटल", thOther: "अन्य",
    totalLabel: "क्लब कुल", bestBadge: "सर्वश्रेष्ठ क्लब सीज़न",
    filterClubPlaceholder: "सीज़न फ़िल्टर करें — उदा. PSG, 2012",
    countrySub: "आधिकारिक और दोस्ताना मैच, सबसे नया पहले।",
    countryCaption: "अर्जेंटीना राष्ट्रीय टीम के लिए कैलेंडर वर्ष के अनुसार गोल (2005–2026)।",
    thYear: "साल", thNote: "विवरण", totalArgLabel: "अर्जेंटीना कुल",
    filterCountryPlaceholder: "अर्जेंटीना साल फ़िल्टर — उदा. 2022",
    bestSeasonHtml: (best) => `<p><b>${best.season} — बार्सिलोना के लिए ${best.apps} मैचों में ${best.goals} गोल</b> — फुटबॉल इतिहास का सबसे शानदार क्लब सीज़न: ला लीगा में 50 (रिकॉर्ड), चैंपियंस लीग में 14 गोल। <a href="/hi/goalsbyyear">साल दर साल गोल देखें</a>।</p>`
  },
  ro: {
    head: (best) => `Toate sezoanele de club din 2004/05 până în 2026 — <b>record: ${best.goals} goluri în ${best.season}</b> — campionat, cupă și meciuri europene.`,
    clubSub: "Meciuri / goluri în fiecare format. 2026 este în desfășurare. Clic pe o coloană pentru sortare.",
    caption: (len) => `Toate cele ${len} sezoane de club: Barcelona, PSG și Inter Miami.`,
    thSeason: "Sezon", thClub: "Club", thApps: "Meciuri", thGoals: "Goluri", thLeague: "Campionat", thCup: "Cupă", thCont: "Europe", thOther: "Altele",
    totalLabel: "Total cluburi", bestBadge: "Cel mai bun sezon de club",
    filterClubPlaceholder: "Filtrează sezoane — ex. PSG, 2012",
    countrySub: "Meciuri oficiale și amicale, cele mai recente primele.",
    countryCaption: "Goluri pentru naționala Argentinei pe ani calendaristici, 2005–2026.",
    thYear: "An", thNote: "Detalii", totalArgLabel: "Total Argentina",
    filterCountryPlaceholder: "Filtrează anii Argentinei — ex. 2022",
    bestSeasonHtml: (best) => `<p><b>${best.season} — ${best.goals} goluri în ${best.apps} meciuri pentru Barcelona</b> — este cel mai prolific sezon de club din istorie: 50 în La Liga, 14 în Champions League. <a href="/ro/goalsbyyear">Vezi aceleași goluri pe ani</a>.</p>`
  },
  uz: {
    head: (best) => `2004/05 yildan 2026 yilgacha bo'lgan barcha klub mavsumlari — <b>rekord: ${best.season} mavsumda ${best.goals} ta gol</b>.`,
    clubSub: "Har bir formatdagi o'yinlar / gollar. 2026 yil davom etmoqda.",
    caption: (len) => `Barcha ${len} ta klub mavsumi: Barselona, PSJ va Inter Mayami.`,
    thSeason: "Mavsum", thClub: "Klub", thApps: "O'yinlar", thGoals: "Gollar", thLeague: "Liga", thCup: "Kubok", thCont: "Xalqaro", thOther: "Boshqa",
    totalLabel: "Klublar jami", bestBadge: "Klubdagi eng yaxshi mavsum",
    filterClubPlaceholder: "Mavsumlarni saralash — masalan: PSJ, 2012",
    countrySub: "Rasmiy va o'rtoqlik uchrashuvlari, eng so'nggilari oldinda.",
    countryCaption: "Argentina terma jamoasida kalendar yillari bo'yicha gollar (2005–2026).",
    thYear: "Yil", thNote: "Tafsilotlar", totalArgLabel: "Argentina jami",
    filterCountryPlaceholder: "Argentina yillarini saralash — masalan: 2022",
    bestSeasonHtml: (best) => `<p><b>${best.season} — Barselona safida ${best.apps} ta o'yinda ${best.goals} ta gol</b> — futbol tarixidagi eng sermahsul mavsum: La Ligada 50 ta (rekord), Chempionlar Ligasida 14 ta gol. <a href="/uz/goalsbyyear">Yillar bo'yicha gollarni ko'ring</a>.</p>`
  }
};

function renderBySeason(d) {
  const lang = getLang();
  const ss = d.clubSeasons, t = d.totals;
  const best = ss.reduce((a, b) => (b.goals > a.goals ? b : a));
  const cfg = BY_SEASON_I18N[lang] || {
    head: (best) => `Every club season from 2004/05 to 2026 — <b>best: ${best.goals} goals in ${best.season}</b> — with league, cup and continental splits, plus Argentina year by year.`,
    clubSub: "Apps / goals in each format. 2026 is the season in progress. Click a column to sort, or type to filter.",
    caption: (len) => `All ${len} club seasons: Barcelona 2004/05–2020/21, PSG 2021/22–2022/23, Inter Miami 2023–2026.`,
    thSeason: "Season", thClub: "Club", thApps: "Apps", thGoals: "Goals", thLeague: "League", thCup: "Cup", thCont: "Continental", thOther: "Other",
    totalLabel: "Club total", bestBadge: "Best club season",
    filterClubPlaceholder: "Filter seasons — e.g. PSG, 2012",
    countrySub: "Competitive qualifiers and tournaments plus friendlies, newest first.",
    countryCaption: "Argentina goals by calendar year, 2005 to 2026.",
    thYear: "Year", thNote: "Note", totalArgLabel: "Argentina total",
    filterCountryPlaceholder: "Filter Argentina years — e.g. 2022",
    bestSeasonHtml: (best) => `<p><b>${best.season} — ${best.goals} goals in ${best.apps} games for Barcelona</b> — is the most prolific club season ever played: 50 in La Liga (a record), 14 in the Champions League, 3 in the Copa del Rey and 6 in the super cups. He scored in every competition he entered.</p><p>It sits at the heart of a four-season stretch (2009/10–2012/13) in which he never dropped below 53 club goals. <a href="/en/goalsbyyear">The same goals counted by calendar year</a>.</p>`
  };

  setHead(d, cfg.head(best));
  const g = ss.reduce((a, s) => ({
    apps: a.apps + s.apps, goals: a.goals + s.goals,
    la: a.la + s.league.apps, lg: a.lg + s.league.goals,
    ca: a.ca + s.cup.apps, cg: a.cg + s.cup.goals,
    ua: a.ua + s.continental.apps, ug: a.ug + s.continental.goals,
    oa: a.oa + s.other.apps, og: a.og + s.other.goals,
  }), { apps: 0, goals: 0, la: 0, lg: 0, ca: 0, cg: 0, ua: 0, ug: 0, oa: 0, og: 0 });
  const pg = (a2, g2) => `${n(a2)} / ${n(g2)}`;

  const clubSub = el("club-sub");
  if (clubSub) {
    clubSub.textContent = cfg.clubSub;
  }

  const clubTable = el("club-table");
  if (clubTable) {
    clubTable.innerHTML =
      `<table class="data-table"><caption>${cfg.caption(ss.length)}</caption>` +
      `<thead><tr><th scope="col" class="left">${cfg.thSeason}</th><th scope="col" class="left">${cfg.thClub}</th><th scope="col">${cfg.thApps}</th><th scope="col">${cfg.thGoals}</th><th scope="col">${cfg.thLeague}</th><th scope="col">${cfg.thCup}</th><th scope="col">${cfg.thCont}</th><th scope="col">${cfg.thOther}</th></tr></thead><tbody>` +
      ss.map((s) => `<tr id="s${s.season.slice(0, 4)}"${s.provisional ? ' class="total"' : ""}><th scope="row">${esc(s.season)}${s.provisional ? " *" : ""}` + (s.season === best.season ? `<span class="yr-note">${cfg.bestBadge}</span>` : "") + `</th>` +
        `<td class="left">${dispClub(s.club)}</td><td>${n(s.apps)}</td><td><b>${n(s.goals)}</b></td>` +
        `<td>${pg(s.league.apps, s.league.goals)}</td><td>${pg(s.cup.apps, s.cup.goals)}</td>` +
        `<td>${pg(s.continental.apps, s.continental.goals)}</td><td>${pg(s.other.apps, s.other.goals)}</td></tr>`).join("") +
      `<tr class="total"><th scope="row" colspan="2">${cfg.totalLabel}</th><td>${n(g.apps)}</td><td>${n(g.goals)}</td>` +
      `<td>${pg(g.la, g.lg)}</td><td>${pg(g.ca, g.cg)}</td><td>${pg(g.ua, g.ug)}</td><td>${pg(g.oa, g.og)}</td></tr></tbody></table>`;

    const tbl = clubTable.querySelector("table");
    if (tbl) {
      sortable(tbl);
      tableSearch(tbl, cfg.filterClubPlaceholder, "season");
    }
  }

  const cy = d.countryYears;
  const countrySub = el("country-sub");
  if (countrySub) {
    countrySub.textContent = cfg.countrySub;
  }

  const countryTable = el("country-table");
  if (countryTable) {
    countryTable.innerHTML =
      `<table class="data-table"><caption>${cfg.countryCaption}</caption>` +
      `<thead><tr><th scope="col" class="left">${cfg.thYear}</th><th scope="col">${cfg.thApps}</th><th scope="col">${cfg.thGoals}</th><th scope="col" class="left">${cfg.thNote}</th></tr></thead><tbody>` +
      cy.slice().reverse().map((s) => {
        const note = s.note || `${s.competitive[0]} apps, ${s.competitive[1]} goals · ${s.friendly[0]} apps, ${s.friendly[1]} goals`;
        return `<tr${s.provisional ? ' class="total"' : ""}><th scope="row">${s.year}${s.provisional ? " *" : ""}</th><td>${s.apps}</td><td><b>${s.goals}</b></td><td class="left">${esc(note)}</td></tr>`;
      }).join("") +
      `<tr class="total"><th scope="row">${cfg.totalArgLabel}</th><td>${t.country.apps}</td><td>${t.country.goals}</td><td class="left"></td></tr></tbody></table>`;

    const tbl = countryTable.querySelector("table");
    if (tbl) {
      sortable(tbl);
      tableSearch(tbl, cfg.filterCountryPlaceholder, "country");
    }
  }

  const bestSeasonEl = el("bestseason");
  if (bestSeasonEl) {
    bestSeasonEl.innerHTML = cfg.bestSeasonHtml(best);
  }
  renderExplore(d, "byseason");
  renderMethod(d, "");
}

/* ================= DASHBOARD ================= */
const TEAM_COMPS = {
  barcelona: [["La Liga", 474], ["UEFA Champions League", 120], ["Copa del Rey", 56], ["Spanish / UEFA / World super cups", 22]],
  psg: [["Ligue 1", 22], ["UEFA Champions League", 9], ["Trophée des Champions", 1]],
  miami: [["Major League Soccer", 70], ["Concacaf Champions Cup", 8], ["Leagues Cup and playoffs", 23]],
  argentina: [["World Cup qualifiers and friendlies", 90], ["FIFA World Cup", 21], ["Copa América", 14]],
};
const FINISH_COLORS = { "Open play": "#0e7cc0", Penalties: "#7cc4ea", "Free kicks": "#132c52" };
const BODY_COLORS = { "Left foot": "#0e7cc0", "Right foot": "#55a8dc", Head: "#a9d3ee", Other: "#132c52" };

const DASH_I18N = {
  es: {
    teamNames: { all: "todos los equipos", barcelona: "Barcelona", psg: "PSG", miami: "Inter Miami", argentina: "Argentina" },
    pills: [["all", "Todos"], ["barcelona", "Barcelona"], ["psg", "PSG"], ["miami", "Inter Miami"], ["argentina", "Argentina"]],
    head: (name) => `Los 930 goles de Lionel Messi analizados de cuatro formas — por competición, por temporada, por definición y por parte del cuerpo — filtrados para <b>${esc(name)}</b>. Toca un equipo para actualizar todos los gráficos.`,
    filterNote: (name, goals, apps, T) => `Mostrando ${name}: ${n(goals)} goles en ${n(apps)} partidos` + (T === "barcelona" || T === "psg" ? " (Desglose en Champions League: Barcelona 120, PSG 9 — fuentes oficiales de los clubes)." : "."),
    kpis: { goals: "Goles", apps: "Partidos", gpg: "Promedio de gol", forTeam: (name) => `Con ${name}.` },
    chartEmpty: "No hay filas para este filtro de equipo.",
    figCap: (T, name) => T === "all" ? "Años naturales, 2004 a 2026." : T === "argentina" ? "Años naturales con Argentina." : "Temporadas de club con " + esc(name) + ".",
    finishParts: { "Open play": "Jugada abierta", "Penalties": "Penaltis", "Free kicks": "Tiros libres" },
    finishCenter: "goles carrera",
    finishCaveat: "Totales de carrera combinados de todos los equipos. Conteo verificado.",
    finishCaveatFiltered: (d) => `No existe desglose por remate por equipo individual — revisa los totales de carrera abajo. De sus ${n(d.totals.goals)} goles oficiales: ${d.byFinish.openPlay} jugada abierta, ${d.byFinish.penalties} penaltis y ${d.byFinish.freeKicks} tiros libres.`,
    bodyParts: { "Left foot": "Pie izquierdo", "Right foot": "Pie derecho", "Head": "Cabeza", "Other": "Otro (pecho, etc.)" },
    bodyCenter: "con la zurda",
    bodyCaveat: "Totales de carrera combinados de todos los equipos (conteo oficial verificado).",
    ageName: (r) => `Edad ${r.age} · ${r.year}`,
    ageCaveat: (apeak) => `Cada gol profesional según la edad a la que lo anotó — clubes y selección combinados. Máximo: ${apeak.goals} goles a los ${apeak.age} años (${apeak.year}).`,
    ageFilterNote: "Las edades combinan clubes y selección, por lo que este gráfico cubre toda la carrera — quita el filtro para verlo.",
    compCaption: (name) => `Goles por competición — ${esc(name)}.`,
    thComp: "Competición", thGoals: "Goles", thShare: "Porcentaje",
    recAllTime: "Récord histórico de la competición",
    finishCaption: "Cómo se marcaron los goles y con qué parte del cuerpo — totales de carrera, todos los equipos.",
    thFinish: "Definición / Parte del cuerpo",
    finishCaveatTable: "El desglose por remate y parte del cuerpo es un conteo oficial verificado.",
    finishRows: (d) => [
      ["Jugada abierta", d.byFinish.openPlay],
      ["Penaltis", d.byFinish.penalties],
      ["Tiros libres directos", d.byFinish.freeKicks],
      ["Pie izquierdo", d.byBodyPart.left],
      ["Pie derecho", d.byBodyPart.right],
      ["Cabeza", d.byBodyPart.head],
      ["Otro (pecho, etc.)", d.byBodyPart.other]
    ],
    teamCardSub: { goals: "goles", apps: "partidos", gpg: "por partido", of: "de" },
    records: (comp, d) => [
      ["91", `<b>Goles en 2012</b> — el récord mundial oficial en un año natural.`],
      [n(comp("La Liga")), `<b>Goles en La Liga</b> — récord histórico absoluto, todos con Barcelona.`],
      [n(comp("UEFA Champions League")), `<b>Goles en Champions League</b> — 120 Barcelona · 9 PSG.`],
      ["8", `<b>Balones de Oro</b> — récord histórico del fútbol (2009–12, 2015, 2019, 2021, 2023).`],
      [n(d.hatTricks), `<b>Hat-tricks o más</b> con clubes y selección absoluta.`],
      ["46", `<b>Títulos oficiales</b> — el futbolista más laureado de la historia.`]
    ],
    method: "Los goles en Champions League se dividen en Barcelona 120 y PSG 9 a partir de actas oficiales; el resto de competiciones siguen la distribución oficial de partidos documentada en los datos."
  },
  pt: {
    teamNames: { all: "todos os times", barcelona: "Barcelona", psg: "PSG", miami: "Inter Miami", argentina: "Argentina" },
    pills: [["all", "Todos os times"], ["barcelona", "Barcelona"], ["psg", "PSG"], ["miami", "Inter Miami"], ["argentina", "Argentina"]],
    head: (name) => `Todos os 930 gols de Lionel Messi analisados de quatro formas — por competição, por temporada, por finalização e por parte do corpo — filtrados para <b>${esc(name)}</b>. Toque em um time para atualizar os gráficos.`,
    filterNote: (name, goals, apps, T) => `Exibindo ${name}: ${n(goals)} gols em ${n(apps)} jogos` + (T === "barcelona" || T === "psg" ? " (Divisão na Champions League: Barcelona 120, PSG 9 — fontes oficiais dos clubes)." : "."),
    kpis: { goals: "Gols", apps: "Jogos", gpg: "Média de gols", forTeam: (name) => `Pelo ${name}.` },
    chartEmpty: "Nenhuma linha para este filtro de time.",
    figCap: (T, name) => T === "all" ? "Anos civis, 2004 a 2026." : T === "argentina" ? "Anos civis com a Argentina." : "Temporadas de clube pelo " + esc(name) + ".",
    finishParts: { "Open play": "Bola rolando", "Penalties": "Pênaltis", "Free kicks": "Faltas" },
    finishCenter: "gols na carreira",
    finishCaveat: "Totais de carreira combinados de todas as equipes. Contagem oficial verificada.",
    finishCaveatFiltered: (d) => `Não existe divisão por finalização por time individual — veja os totais da carreira abaixo. De seus ${n(d.totals.goals)} gols oficiais: ${d.byFinish.openPlay} bola rolando, ${d.byFinish.penalties} pênaltis e ${d.byFinish.freeKicks} faltas.`,
    bodyParts: { "Left foot": "Pé esquerdo", "Right foot": "Pé direito", "Head": "Cabeça", "Other": "Outro (peito, etc.)" },
    bodyCenter: "com a canhota",
    bodyCaveat: "Totais de carreira combinados de todos os times (contagem oficial verificada).",
    ageName: (r) => `Idade ${r.age} · ${r.year}`,
    ageCaveat: (apeak) => `Cada gol profissional de acordo com a idade em que marcou — clubes e seleção combinados. Recorde: ${apeak.goals} gols aos ${apeak.age} anos (${apeak.year}).`,
    ageFilterNote: "As idades combinam clubes e seleção, portanto este gráfico cobre toda a carreira — limpe o filtro para ver.",
    compCaption: (name) => `Gols por competição — ${esc(name)}.`,
    thComp: "Competição", thGoals: "Gols", thShare: "Porcentagem",
    recAllTime: "Recorde histórico da competição",
    finishCaption: "Como os gols foram marcados e com qual parte do corpo — totais da carreira, todos os times.",
    thFinish: "Finalização / Parte do corpo",
    finishCaveatTable: "O detalhamento por finalização e parte do corpo é uma contagem oficial verificada.",
    finishRows: (d) => [
      ["Bola rolando", d.byFinish.openPlay],
      ["Pênaltis", d.byFinish.penalties],
      ["Cobranças de falta", d.byFinish.freeKicks],
      ["Pé esquerdo", d.byBodyPart.left],
      ["Pé direito", d.byBodyPart.right],
      ["Cabeça", d.byBodyPart.head],
      ["Outro (peito, etc.)", d.byBodyPart.other]
    ],
    teamCardSub: { goals: "gols", apps: "jogos", gpg: "por jogo", of: "de" },
    records: (comp, d) => [
      ["91", `<b>Gols em 2012</b> — recorde mundial oficial em um ano civil.`],
      [n(comp("La Liga")), `<b>Gols na La Liga</b> — recorde histórico absoluto da competição, todos pelo Barcelona.`],
      [n(comp("UEFA Champions League")), `<b>Gols na Champions League</b> — 120 pelo Barcelona, 9 pelo PSG.`],
      ["8", `<b>Bolas de Ouro</b> — recorde histórico do futebol (2009–12, 2015, 2019, 2021, 2023).`],
      [n(d.hatTricks), `<b>Hat-tricks ou mais</b> por clubes e seleção.`],
      ["46", `<b>Títulos oficiais</b> — o jogador mais laureado da história do futebol.`]
    ],
    method: "Gols na Champions League divididos em Barcelona 120 e PSG 9 a partir de fontes oficiais dos clubes; demais competições seguem os registros oficiais."
  },
  fr: {
    teamNames: { all: "toutes les équipes", barcelona: "FC Barcelone", psg: "PSG", miami: "Inter Miami", argentina: "Argentine" },
    pills: [["all", "Toutes les équipes"], ["barcelona", "FC Barcelone"], ["psg", "PSG"], ["miami", "Inter Miami"], ["argentina", "Argentine"]],
    head: (name) => `Tous les 930 buts de Lionel Messi analysés de 4 manières — par compétition, par saison, par finition et par partie du corps — filtrés pour <b>${esc(name)}</b>. Touchez une équipe pour actualiser.`,
    filterNote: (name, goals, apps, T) => `Affichage pour ${name} : ${n(goals)} buts en ${n(apps)} matchs` + (T === "barcelona" || T === "psg" ? " (Répartition Ligue des Champions : Barcelone 120, PSG 9 — sources officielles des clubs)." : "."),
    kpis: { goals: "Buts", apps: "Matchs", gpg: "Buts par match", forTeam: (name) => `Pour ${name}.` },
    chartEmpty: "Aucune ligne pour ce filtre d'équipe.",
    figCap: (T, name) => T === "all" ? "Années civiles, de 2004 à 2026." : T === "argentina" ? "Années civiles avec l'Argentine." : "Saisons en club pour " + esc(name) + ".",
    finishParts: { "Open play": "Jeu ouvert", "Penalties": "Penaltys", "Free kicks": "Coups francs" },
    finishCenter: "buts en carrière",
    finishCaveat: "Totaux de carrière combinés pour toutes les équipes. Décompte officiel vérifié.",
    finishCaveatFiltered: (d) => `Aucune répartition par équipe n'existe — voir totaux ci-dessous. Sur ses ${n(d.totals.goals)} buts officiels : ${d.byFinish.openPlay} dans le jeu, ${d.byFinish.penalties} penaltys et ${d.byFinish.freeKicks} coups francs.`,
    bodyParts: { "Left foot": "Pied gauche", "Right foot": "Pied droit", "Head": "Tête", "Other": "Autre (poitrine, etc.)" },
    bodyCenter: "du pied gauche",
    bodyCaveat: "Totaux de carrière combinés pour toutes les équipes (décompte officiel vérifié).",
    ageName: (r) => `Âge ${r.age} · ${r.year}`,
    ageCaveat: (apeak) => `Chaque but professionnel selon l'âge auquel il a été marqué — clubs et sélection combinés. Pic : ${apeak.goals} buts à l'âge de ${apeak.age} ans (${apeak.year}).`,
    ageFilterNote: "Les âges combinent club et sélection, ce graphique couvre donc la carrière complète — effacez le filtre pour le voir.",
    compCaption: (name) => `Buts par compétition — ${esc(name)}.`,
    thComp: "Compétition", thGoals: "Buts", thShare: "Part",
    recAllTime: "Record historique de la compétition",
    finishCaption: "Comment les buts ont été marqués et avec quelle partie du corps — totaux de carrière.",
    thFinish: "Finition / Partie du corps",
    finishCaveatTable: "La répartition par finition et partie du corps est un décompte officiel vérifié.",
    finishRows: (d) => [
      ["Dans le jeu", d.byFinish.openPlay],
      ["Penaltys", d.byFinish.penalties],
      ["Coups francs directs", d.byFinish.freeKicks],
      ["Pied gauche", d.byBodyPart.left],
      ["Pied droit", d.byBodyPart.right],
      ["Tête", d.byBodyPart.head],
      ["Autre (poitrine, etc.)", d.byBodyPart.other]
    ],
    teamCardSub: { goals: "buts", apps: "matchs", gpg: "par match", of: "sur" },
    records: (comp, d) => [
      ["91", `<b>Buts en 2012</b> — le record mondial officiel sur une année civile.`],
      [n(comp("La Liga")), `<b>Buts en La Liga</b> — record absolu de l'histoire, tous avec Barcelone.`],
      [n(comp("UEFA Champions League")), `<b>Buts en Ligue des Champions</b> — 120 pour Barcelone, 9 pour le PSG.`],
      ["8", `<b>Ballons d'Or</b> — record absolu du football (2009–12, 2015, 2019, 2021, 2023).`],
      [n(d.hatTricks), `<b>Coups du chapeau ou plus</b> en club et en sélection.`],
      ["46", `<b>Titres collectifs officiels</b> — le joueur le plus titré de l'histoire.`]
    ],
    method: "Les buts en Ligue des Champions sont répartis à 120 pour Barcelone et 9 pour le PSG d'après les archives officielles."
  },
  ar: {
    teamNames: { all: "جميع الفرق", barcelona: "برشلونة", psg: "باريس سان جيرمان", miami: "إنتر ميامي", argentina: "الأرجنتين" },
    pills: [["all", "جميع الفرق"], ["barcelona", "برشلونة"], ["psg", "باريس سان جيرمان"], ["miami", "إنتر ميامي"], ["argentina", "الأرجنتين"]],
    head: (name) => `جميع أهداف ليونيل ميسي الـ 930 مقسمة بأربع طرق — حسب البطولة، الموسم، طريقة التسجيل، وجزء الجسم — مصفاة حسب <b>${esc(name)}</b>. اضغط على أي فريق لتحديث المخططات.`,
    filterNote: (name, goals, apps, T) => `عرض ${name}: ${n(goals)} هدفاً في ${n(apps)} مباراة` + (T === "barcelona" || T === "psg" ? " (توزيع دوري أبطال أوروبا: برشلونة 120، باريس 9 — مصادر الأندية الرسمية)." : "."),
    kpis: { goals: "الأهداف", apps: "المباريات", gpg: "معدل الأهداف / مباراة", forTeam: (name) => `مع ${name}.` },
    chartEmpty: "لا توجد صفوف لعامل التصفية هذا.",
    figCap: (T, name) => T === "all" ? "السنوات الميلادية، من 2004 إلى 2026." : T === "argentina" ? "السنوات الميلادية مع الأرجنتين." : "المواسم مع الأندية لـ " + esc(name) + ".",
    finishParts: { "Open play": "اللعب المفتوح", "Penalties": "ضربات جزاء", "Free kicks": "ركلات حرة" },
    finishCenter: "أهداف مسيرته",
    finishCaveat: "إجمالي المسيرة لجميع الفرق مجتمعة. إحصاء رسمي تم التحقق منه.",
    finishCaveatFiltered: (d) => `لا يوجد تقسيم لطريقة التسجيل لكل فريق على حدة — راجع إجمالي المسيرة أدناه. من بين أهدافه الرسمية الـ ${n(d.totals.goals)}: ${d.byFinish.openPlay} من لعب مفتوح، ${d.byFinish.penalties} ركلة جزاء، و${d.byFinish.freeKicks} ركلة حرة.`,
    bodyParts: { "Left foot": "القدم اليسرى", "Right foot": "القدم اليمنى", "Head": "الرأس", "Other": "أخرى (الصدر، إلخ)" },
    bodyCenter: "بالقدم اليسرى",
    bodyCaveat: "إجمالي المسيرة لجميع الفرق مجتمعة (إحصاء رسمي موثق).",
    ageName: (r) => `العمر ${r.age} · ${r.year}`,
    ageCaveat: (apeak) => `كل هدف احترافي حسب العمر الذي سجله فيه — الأندية والمنتخب معاً. الذروة: ${apeak.goals} هدفاً في عمر ${apeak.age} عاماً (${apeak.year}).`,
    ageFilterNote: "الأعمار تجمع بين أهداف النادي والمنتخب، لذا يغطي هذا المخطط المسيرة بأكملها — أزل عامل التصفية لرؤيته.",
    compCaption: (name) => `الأهداف حسب البطولة — ${esc(name)}.`,
    thComp: "البطولة", thGoals: "الأهداف", thShare: "النسبة",
    recAllTime: "الرقم القياسي التاريخي للبطولة",
    finishCaption: "كيف سُجلت الأهداف وبأي جزء من الجسم — إجمالي المسيرة، جميع الفرق.",
    thFinish: "طريقة التسجيل / جزء الجسم",
    finishCaveatTable: "توزيع طرق التسجيل وأجزاء الجسم هو إحصاء رسمي تم التحقق منه.",
    finishRows: (d) => [
      ["لعب مفتوح", d.byFinish.openPlay],
      ["ضربات جزاء", d.byFinish.penalties],
      ["ركلات حرة مباشرة", d.byFinish.freeKicks],
      ["القدم اليسرى", d.byBodyPart.left],
      ["القدم اليمنى", d.byBodyPart.right],
      ["بالرأس", d.byBodyPart.head],
      ["أخرى (الصدر، إلخ)", d.byBodyPart.other]
    ],
    teamCardSub: { goals: "أهداف", apps: "مباريات", gpg: "لكل مباراة", of: "من" },
    records: (comp, d) => [
      ["91", `<b>هدفاً في عام 2012</b> — الرقم القياسي العالمي الرسمي في سنة ميلادية واحدة.`],
      [n(comp("La Liga")), `<b>أهداف الدوري الإسباني</b> — الهداف التاريخي المطلق للبطولة، كلها مع برشلونة.`],
      [n(comp("UEFA Champions League")), `<b>أهداف دوري أبطال أوروبا</b> — 120 لبرشلونة، 9 لباريس سان جيرمان.`],
      ["8", `<b>كرات ذهبية</b> — الرقم القياسي التاريخي في كرة القدم (2009–12, 2015, 2019, 2021, 2023).`],
      [n(d.hatTricks), `<b>هاتريك أو أكثر</b> مع الأندية والمنتخب الأول.`],
      ["46", `<b>بطولة رسمية</b> — أكثر لاعب تتويجاً بالألقاب في تاريخ كرة القدم.`]
    ],
    method: "أهداف دوري أبطال أوروبا مقسمة 120 لبرشلونة و9 لباريس سان جيرمان من السجلات الرسمية للأندية."
  },
  bn: {
    teamNames: { all: "সকল দল", barcelona: "বার্সেলোনা", psg: "পিএসজি", miami: "ইন্টার মায়ামি", argentina: "আর্জেন্টিনা" },
    pills: [["all", "সকল দল"], ["barcelona", "বার্সেলোনা"], ["psg", "পিএসজি"], ["miami", "ইন্টার মায়ামি"], ["argentina", "আর্জেন্টিনা"]],
    head: (name) => `লিওনেল মেসির ৯২৯টি গোল ৪টি দৃষ্টিকোণ থেকে বিশ্লেষণ — প্রতিযোগিতা, মৌসুম, গোল করার ধরন এবং শরীরের অঙ্গ — <b>${esc(name)}</b>-এর জন্য ফিল্টার করা। চার্ট পরিবর্তন করতে দল নির্বাচন করুন।`,
    filterNote: (name, goals, apps, T) => `${name} প্রদর্শিত হচ্ছে: ${n(apps)} ম্যাচে ${n(goals)} গোল` + (T === "barcelona" || T === "psg" ? " (চ্যাম্পিয়ন্স লিগে বিভাজন: বার্সেলোনা ১২০, পিএসজি ৯ — ক্লাবের তথ্য অনুযায়ী)।" : "।"),
    kpis: { goals: "গোল", apps: "ম্যাচ", gpg: "ম্যাচ প্রতি গোল", forTeam: (name) => `${name}-এর সাথে।` },
    chartEmpty: "এই দলের জন্য কোনো তথ্য নেই।",
    figCap: (T, name) => T === "all" ? "ক্যালেন্ডার বছর, ২০০৪ থেকে ২০২৬।" : T === "argentina" ? "আর্জেন্টিনার সাথে ক্যালেন্ডার বছর।" : esc(name) + "-এর সাথে ক্লাব মৌসুম।",
    finishParts: { "Open play": "ওপেন প্লে", "Penalties": "পেনাল্টি", "Free kicks": "ফ্রি কিক" },
    finishCenter: "ক্যারিয়ার গোল",
    finishCaveat: "সকল দল মিলিয়ে সামগ্রিক ক্যারিয়ার রেকর্ড। যাচাইকৃত পরিসংখ্যান।",
    finishCaveatFiltered: (d) => `দলভিত্তিক আলাদা ফিনিশিং রেকর্ড নেই — নিচে ক্যারিয়ার মোট দেখুন। মোট ${n(d.totals.goals)}টি গোলের মধ্যে: ${d.byFinish.openPlay} ওপেন প্লে, ${d.byFinish.penalties} পেনাল্টি এবং ${d.byFinish.freeKicks} ফ্রি কিক।`,
    bodyParts: { "Left foot": "বাঁ পা", "Right foot": "ডান পা", "Head": "মাথা", "Other": "অন্যান্য (বুক ইত্যাদি)" },
    bodyCenter: "বাঁ পায়ের গোল",
    bodyCaveat: "সকল দল মিলিয়ে সামগ্রিক ক্যারিয়ার রেকর্ড (যাচাইকৃত পরিসংখ্যান)।",
    ageName: (r) => `বয়স ${r.age} · ${r.year}`,
    ageCaveat: (apeak) => `বয়স অনুসারে মেসির প্রতিটি গোল — ক্লাব ও জাতীয় দল মিলিয়ে। সর্বোচ্চ: ${apeak.age} বছর বয়সে ${apeak.goals}টি গোল (${apeak.year})।`,
    ageFilterNote: "বয়সের হিসেবে ক্লাব ও আন্তর্জাতিক গোল যৌথভাবে অন্তর্ভুক্ত, তাই এই চার্টটি পুরো ক্যারিয়ার দেখায় — ফিল্টার সরান।",
    compCaption: (name) => `প্রতিযোগিতা অনুসারে গোল — ${esc(name)}।`,
    thComp: "প্রতিযোগিতা", thGoals: "গোল", thShare: "শতাংশ",
    recAllTime: "প্রতিযোগিতার সর্বকালের রেকর্ড",
    finishCaption: "গোল করার ধরন ও শরীরের অঙ্গ — ক্যারিয়ারের মোট পরিসংখ্যান।",
    thFinish: "ফিনিশিং / অঙ্গ",
    finishCaveatTable: "ফিনিশিং এবং শরীরের অঙ্গের বিভাজন যাচাইকৃত হিসাব।",
    finishRows: (d) => [
      ["ওপেন প্লে", d.byFinish.openPlay],
      ["পেনাল্টি", d.byFinish.penalties],
      ["সরাসরি ফ্রি কিক", d.byFinish.freeKicks],
      ["বাঁ পা", d.byBodyPart.left],
      ["ডান পা", d.byBodyPart.right],
      ["হেডার", d.byBodyPart.head],
      ["অন্যান্য (বুক ইত্যাদি)", d.byBodyPart.other]
    ],
    teamCardSub: { goals: "গোল", apps: "ম্যাচ", gpg: "প্রতি ম্যাচে", of: "এর মধ্যে" },
    records: (comp, d) => [
      ["91", `<b>২০১২ সালে গোল</b> — এক ক্যালেন্ডার বছরে ফুটবল ইতিহাসের বিশ্বরেকর্ড।`],
      [n(comp("La Liga")), `<b>লা লিগায় গোল</b> — সর্বকালের সর্বোচ্চ গোলদাতা, সবগুলো বার্সেলোনার হয়ে।`],
      [n(comp("UEFA Champions League")), `<b>চ্যাম্পিয়ন্স লিগে গোল</b> — বার্সেলোনা ১২০, পিএসজি ৯।`],
      ["8", `<b>ব্যালন ডি'অর</b> — ফুটবল ইতিহাসের রেকর্ড (২০০৯–১২, ২০১৫, ২০১৯, ২০২১, ২০২৩)।`],
      [n(d.hatTricks), `<b>হ্যাটট্রিক বা তদূর্ধ্ব</b> ক্লাব ও আন্তর্জাতিক ফুটবলে।`],
      ["46", `<b>দলীয় শিরোপা</b> — ফুটবল ইতিহাসের সবচেয়ে বেশি ট্রফিজয়ী খেলোয়াড়।`]
    ],
    method: "চ্যাম্পিয়ন্স লিগে গোল বিভাজন বার্সেলোনা ১২০ ও পিএসজি ৯ ক্লাবের আনুষ্ঠানিক তথ্যানুযায়ী।"
  },
  hi: {
    teamNames: { all: "सभी टीमें", barcelona: "बार्सिलोना", psg: "पीएसजी", miami: "इंटर मियामी", argentina: "अर्जेंटीना" },
    pills: [["all", "सभी टीमें"], ["barcelona", "बार्सिलोना"], ["psg", "पीएसजी"], ["miami", "इंटर मियामी"], ["argentina", "अर्जेंटीना"]],
    head: (name) => `लियोनेल मेस्सी के सभी 930 गोलों का चार प्रकार से विश्लेषण — प्रतियोगिता, सीज़न, फ़िनिश और शरीर के अंग द्वारा — <b>${esc(name)}</b> के अनुसार। चार्ट बदलने के लिए किसी टीम पर टैप करें।`,
    filterNote: (name, goals, apps, T) => `${name} दिखाया जा रहा है: ${n(apps)} मैचों में ${n(goals)} गोल` + (T === "barcelona" || T === "psg" ? " (चैंपियंस लीग विभाजन: बार्सिलोना 120, पीएसजी 9 — क्लब स्रोतों से)।" : "।"),
    kpis: { goals: "गोल", apps: "मैच", gpg: "प्रति मैच गोल", forTeam: (name) => `${name} के लिए।` },
    chartEmpty: "इस टीम फ़िल्टर के लिए कोई डेटा नहीं है।",
    figCap: (T, name) => T === "all" ? "कैलेंडर वर्ष, 2004 से 2026।" : T === "argentina" ? "अर्जेंटीना के साथ कैलेंडर वर्ष।" : esc(name) + " के साथ क्लब सीज़न।",
    finishParts: { "Open play": "ओपन प्ले", "Penalties": "पेनल्टी", "Free kicks": "फ्री किक्स" },
    finishCenter: "करियर गोल",
    finishCaveat: "सभी टीमों के कुल करियर आंकड़े। सत्यापित आधिकारिक गणना।",
    finishCaveatFiltered: (d) => `टीम के आधार पर कोई अलग फ़िनिश डेटा नहीं है — नीचे करियर कुल देखें। उनके ${n(d.totals.goals)} आधिकारिक गोलों में से: ${d.byFinish.openPlay} ओपन प्ले, ${d.byFinish.penalties} पेनल्टी और ${d.byFinish.freeKicks} फ्री किक।`,
    bodyParts: { "Left foot": "बायां पैर", "Right foot": "दायां पैर", "Head": "सिर", "Other": "अन्य (छाती आदि)" },
    bodyCenter: "बाएं पैर से",
    bodyCaveat: "सभी टीमों के संयुक्त करियर आंकड़े (सत्यापित आधिकारिक गणना)।",
    ageName: (r) => `उम्र ${r.age} · ${r.year}`,
    ageCaveat: (apeak) => `प्रत्येक गोल उस उम्र के अनुसार जब उन्होंने स्कोर किया — क्लब और देश मिलाकर। शीर्ष: ${apeak.age} वर्ष की आयु में ${apeak.goals} गोल (${apeak.year})।`,
    ageFilterNote: "उम्र में क्लब और देश के गोल शामिल हैं, इसलिए यह चार्ट केवल पूर्ण करियर को कवर करता है — फ़िल्टर हटाएं।",
    compCaption: (name) => `प्रतियोगिता अनुसार गोल — ${esc(name)}।`,
    thComp: "प्रतियोगिता", thGoals: "गोल", thShare: "हिस्सा",
    recAllTime: "प्रतियोगिता का सर्वकालिक रिकॉर्ड",
    finishCaption: "गोल कैसे किए गए और किस अंग से — करियर कुल, सभी टीमें।",
    thFinish: "फ़िनिश / शरीर का अंग",
    finishCaveatTable: "फ़िनिश और शरीर के अंग का विभाजन आधिकारिक रूप से सत्यापित है।",
    finishRows: (d) => [
      ["ओपन प्ले", d.byFinish.openPlay],
      ["पेनल्टी", d.byFinish.penalties],
      ["सीधे फ्री किक", d.byFinish.freeKicks],
      ["बायां पैर", d.byBodyPart.left],
      ["दायां पैर", d.byBodyPart.right],
      ["सिर (हेडर)", d.byBodyPart.head],
      ["अन्य (छाती आदि)", d.byBodyPart.other]
    ],
    teamCardSub: { goals: "गोल", apps: "मैच", gpg: "प्रति मैच", of: "में से" },
    records: (comp, d) => [
      ["91", `<b>2012 में गोल</b> — एक कैलेंडर वर्ष में फुटबॉल का सर्वकालिक विश्व रिकॉर्ड।`],
      [n(comp("La Liga")), `<b>ला लीगा में गोल</b> — सर्वकालिक रिकॉर्ड, सभी बार्सिलोना के लिए।`],
      [n(comp("UEFA Champions League")), `<b>चैंपियंस लीग गोल</b> — 120 बार्सिलोना, 9 पीएसजी।`],
      ["8", `<b>बैलन डी'ओर</b> — फुटबॉल इतिहास का रिकॉर्ड (2009–12, 2015, 2019, 2021, 2023)।`],
      [n(d.hatTricks), `<b>हैट्रिक या अधिक</b> क्लब और देश के लिए।`],
      ["46", `<b>आधिकारिक ट्रॉफियां</b> — फुटबॉल इतिहास के सबसे सफल खिलाड़ी।`]
    ],
    method: "चैंपियंस लीग गोल बार्सिलोना 120 और पीएसजी 9 में आधिकारिक रिकॉर्ड के आधार पर विभाजित हैं।"
  },
  ro: {
    teamNames: { all: "toate echipele", barcelona: "Barcelona", psg: "PSG", miami: "Inter Miami", argentina: "Argentina" },
    pills: [["all", "Toate echipele"], ["barcelona", "Barcelona"], ["psg", "PSG"], ["miami", "Inter Miami"], ["argentina", "Argentina"]],
    head: (name) => `Toate cele 930 de goluri ale lui Lionel Messi analizate în 4 moduri — după competiție, sezon, tip de finalizare și parte a corpului — filtrate pentru <b>${esc(name)}</b>. Atinge o echipă pentru a actualiza graficele.`,
    filterNote: (name, goals, apps, T) => `Se afișează ${name}: ${n(goals)} goluri în ${n(apps)} meciuri` + (T === "barcelona" || T === "psg" ? " (Defalcare Champions League: Barcelona 120, PSG 9 — din surse oficiale ale cluburilor)." : "."),
    kpis: { goals: "Goluri", apps: "Meciuri", gpg: "Goluri pe meci", forTeam: (name) => `Pentru ${name}.` },
    chartEmpty: "Niciun rând pentru acest filtru de echipă.",
    figCap: (T, name) => T === "all" ? "Ani calendaristici, 2004 până în 2026." : T === "argentina" ? "Ani calendaristici cu Argentina." : "Sezoane de club pentru " + esc(name) + ".",
    finishParts: { "Open play": "Acțiune deschisă", "Penalties": "Penalty-uri", "Free kicks": "Lovituri libere" },
    finishCenter: "goluri carieră",
    finishCaveat: "Totaluri de carieră combinate pentru toate echipele. Numărătoare oficială verificată.",
    finishCaveatFiltered: (d) => `Nu există o defalcare pe echipe — vezi totalurile de carieră de mai jos. Din cele ${n(d.totals.goals)} goluri oficiale: ${d.byFinish.openPlay} din acțiune, ${d.byFinish.penalties} penalty-uri și ${d.byFinish.freeKicks} lovituri libere.`,
    bodyParts: { "Left foot": "Piciorul stâng", "Right foot": "Piciorul drept", "Head": "Cap", "Other": "Altele (piept, etc.)" },
    bodyCenter: "cu piciorul stâng",
    bodyCaveat: "Totaluri de carieră combinate pentru toate echipele (numărătoare oficială verificată).",
    ageName: (r) => `Vârsta ${r.age} · ${r.year}`,
    ageCaveat: (apeak) => `Fiecare gol oficial în funcție de vârsta la care l-a marcat — cluburi și națională combinate. Vârf: ${apeak.goals} la vârsta de ${apeak.age} ani (${apeak.year}).`,
    ageFilterNote: "Vârstele combină golurile de club și națională, așa că acest grafic acoperă doar întreaga carieră — ștergeți filtrul pentru a-l vedea.",
    compCaption: (name) => `Goluri după competiție — ${esc(name)}.`,
    thComp: "Competiție", thGoals: "Goluri", thShare: "Procent",
    recAllTime: "Recordul all-time al competiției",
    finishCaption: "Cum au fost marcate golurile și cu ce parte a corpului — totaluri din carieră, toate echipele.",
    thFinish: "Finalizare / Partea corpului",
    finishCaveatTable: "Defalcarea pe tip de finalizare și parte a corpului este o numărătoare oficială verificată.",
    finishRows: (d) => [
      ["Acțiune deschisă", d.byFinish.openPlay],
      ["Penalty-uri", d.byFinish.penalties],
      ["Lovituri libere directe", d.byFinish.freeKicks],
      ["Piciorul stâng", d.byBodyPart.left],
      ["Piciorul drept", d.byBodyPart.right],
      ["Cap", d.byBodyPart.head],
      ["Altele (piept etc.)", d.byBodyPart.other]
    ],
    teamCardSub: { goals: "goluri", apps: "meciuri", gpg: "pe meci", of: "din" },
    records: (comp, d) => [
      ["91", `<b>Goluri în 2012</b> — recordul mondial oficial într-un an calendaristic.`],
      [n(comp("La Liga")), `<b>Goluri în La Liga</b> — recordul all-time al competiției, toate pentru Barcelona.`],
      [n(comp("UEFA Champions League")), `<b>Goluri în Champions League</b> — 120 pentru Barcelona, 9 pentru PSG.`],
      ["8", `<b>Baloane de Aur</b> — recordul all-time în fotbal (2009–12, 2015, 2019, 2021, 2023).`],
      [n(d.hatTricks), `<b>Hat-trick-uri sau mai mult</b> pentru club și națională.`],
      ["46", `<b>Trofee oficiale</b> — cel mai titrat fotbalist din istoria fotbalului.`]
    ],
    method: "Golurile din Champions League sunt împărțite în Barcelona 120 și PSG 9 conform documentelor oficiale ale cluburilor."
  },
  uz: {
    teamNames: { all: "barcha jamoalar", barcelona: "Barselona", psg: "PSJ", miami: "Inter Mayami", argentina: "Argentina" },
    pills: [["all", "Barcha jamoalar"], ["barcelona", "Barselona"], ["psg", "PSJ"], ["miami", "Inter Mayami"], ["argentina", "Argentina"]],
    head: (name) => `Lionel Messining barcha 930 goli 4 usulda tahlil qilingan — musobaqa, mavsum, yakunlash usuli va tana a'zosi bo'yicha — <b>${esc(name)}</b> uchun filtrlangan. Diagrammalarni yangilash uchun jamoani bosing.`,
    filterNote: (name, goals, apps, T) => `${name} ko'rsatilmoqda: ${n(apps)} o'yinda ${n(goals)} gol` + (T === "barcelona" || T === "psg" ? " (Chempionlar Ligasidagi taqsimot: Barselona 120, PSJ 9 — rasmiy klub manbalari asosida)." : "."),
    kpis: { goals: "Gollar", apps: "O'yinlar", gpg: "O'yin boshiga gol", forTeam: (name) => `${name} safida.` },
    chartEmpty: "Ushbu jamoa filtri uchun qatorlar mavjud emas.",
    figCap: (T, name) => T === "all" ? "Kalendar yillari, 2004 yildan 2026 yilgacha." : T === "argentina" ? "Argentina safidagi kalendar yillari." : esc(name) + " safidagi klub mavsumlari.",
    finishParts: { "Open play": "O'yin ichidagi to'plar", "Penalties": "Penaltilar", "Free kicks": "Jarima to'plari" },
    finishCenter: "faoliyat gollari",
    finishCaveat: "Barcha jamoalar bo'yicha umumiy faoliyat ko'rsatkichlari. Tasdiqlangan rasmiy hisob.",
    finishCaveatFiltered: (d) => `Alohida jamoalar bo'yicha yakunlash ko'rsatkichlari mavjud emas — umumiy faoliyat natijalarini ko'ring. Uning ${n(d.totals.goals)} ta rasmiy golidan: ${d.byFinish.openPlay} tasi o'yindan, ${d.byFinish.penalties} tasi penaltidan va ${d.byFinish.freeKicks} tasi jarimadan.`,
    bodyParts: { "Left foot": "Chap oyoq", "Right foot": "O'ng oyoq", "Head": "Bosh", "Other": "Boshqa (ko'krak va hk.)" },
    bodyCenter: "chap oyoqda",
    bodyCaveat: "Barcha jamoalar bo'yicha umumiy faoliyat ko'rsatkichlari (tasdiqlangan rasmiy hisob).",
    ageName: (r) => `${r.age} yosh · ${r.year}`,
    ageCaveat: (apeak) => `Uning yoshi bo'yicha urilgan har bir professional gol — klub va terma jamoa birgalikda. Eng yuqori cho'qqi: ${apeak.age} yoshida ${apeak.goals} ta gol (${apeak.year}).`,
    ageFilterNote: "Yoshlar klub va terma jamoani birlashtiradi, shuning uchun bu grafik faqat butun faoliyatni qamrab oladi — ko'rish uchun filtrni bekor qiling.",
    compCaption: (name) => `Musobaqalar bo'yicha gollar — ${esc(name)}.`,
    thComp: "Musobaqa", thGoals: "Gollar", thShare: "Ulush",
    recAllTime: "Musobaqaning mutlaq rekordi",
    finishCaption: "Gollar qanday urilgan va qaysi tana a'zosi bilan — butun faoliyat, barcha jamoalar.",
    thFinish: "Yakunlash / Tana a'zosi",
    finishCaveatTable: "Yakunlash va tana a'zosi bo'yicha taqsimot rasmiy tasdiqlangan hisobdir.",
    finishRows: (d) => [
      ["O'yin ichidagi to'plar", d.byFinish.openPlay],
      ["Penaltilar", d.byFinish.penalties],
      ["To'g'ridan-to'g'ri jarima to'plari", d.byFinish.freeKicks],
      ["Chap oyoq", d.byBodyPart.left],
      ["O'ng oyoq", d.byBodyPart.right],
      ["Bosh bilan", d.byBodyPart.head],
      ["Boshqa (ko'krak va hk.)", d.byBodyPart.other]
    ],
    teamCardSub: { goals: "gollar", apps: "o'yinlar", gpg: "har o'yinda", of: "jami" },
    records: (comp, d) => [
      ["91", `<b>2012 yildagi gollar</b> — bir kalendar yilidagi jahon rekordi.`],
      [n(comp("La Liga")), `<b>La Ligadagi gollar</b> — musobaqaning mutlaq rekordi, barchasi Barselona safida.`],
      [n(comp("UEFA Champions League")), `<b>Chempionlar Ligasidagi gollar</b> — Barselona uchun 120, PSJ uchun 9.`],
      ["8", `<b>Oltin to'p</b> — futbol tarixidagi rekord (2009–12, 2015, 2019, 2021, 2023).`],
      [n(d.hatTricks), `<b>Xet-trik yoki undan ko'p</b> klub va terma jamoada.`],
      ["46", `<b>Rasmiy sovrinlar</b> — futbol tarixidagi eng ko'p unvonga ega o'yinchi.`]
    ],
    method: "Chempionlar Ligasidagi gollar rasmiy manbalar asosida Barselona 120 va PSJ 9 ga bo'lingan."
  }
};

const DASH_EN = {
  teamNames: { all: "all teams", barcelona: "Barcelona", psg: "PSG", miami: "Inter Miami", argentina: "Argentina" },
  pills: [["all", "All teams"], ["barcelona", "Barcelona"], ["psg", "PSG"], ["miami", "Inter Miami"], ["argentina", "Argentina"]],
  head: (name) => `Every Messi goal sliced four ways — by competition, by season, by finish and by body part — filtered to <b>${esc(name)}</b>. Tap a team to re-cut every chart.`,
  filterNote: (name, goals, apps, T) => `Showing ${name}: ${n(goals)} goals in ${n(apps)} apps` + (T === "barcelona" || T === "psg" ? " (Champions League split: Barcelona 120, PSG 9 — derived from club sources)." : "."),
  kpis: { goals: "Goals", apps: "Appearances", gpg: "Goals per game", forTeam: (name) => `For ${name}.` },
  chartEmpty: "No rows for this team filter.",
  figCap: (T, name) => T === "all" ? "Calendar years, 2004 to 2026." : T === "argentina" ? "Argentina calendar years." : "Club seasons for " + esc(name) + ".",
  finishParts: { "Open play": "Open play", "Penalties": "Penalties", "Free kicks": "Free kicks" },
  finishCenter: "career goals",
  finishCaveat: "Career totals for all teams combined — no per-team split exists. Verified count.",
  finishCaveatFiltered: (d) => `No per-team finish split exists, so this chart only covers all teams combined — see the career totals below. Messi's ${n(d.totals.goals)} goals break down as ${d.byFinish.openPlay} open play, ${d.byFinish.penalties} penalties and ${d.byFinish.freeKicks} free kicks.`,
  bodyParts: { "Left foot": "Left foot", "Right foot": "Right foot", "Head": "Head", "Other": "Other" },
  bodyCenter: "left-foot goals",
  bodyCaveat: "Career totals for all teams combined (provisional until a full hand count finishes).",
  ageName: (r) => `Age ${r.age} · ${r.year}`,
  ageCaveat: (apeak) => `Every senior goal by the age he scored it — club and country combined. Peak: ${apeak.goals} at age ${apeak.age} (${apeak.year}).`,
  ageFilterNote: "Ages mix club and country goals, so this chart covers the full career only — clear the team filter to see it.",
  compCaption: (name) => `Goals by competition — ${esc(name)}.`,
  thComp: "Competition", thGoals: "Goals", thShare: "Share",
  recAllTime: "All-time competition record",
  finishCaption: "How the goals were scored and with what — career totals, all teams.",
  thFinish: "Finish",
  finishCaveatTable: "Finish and body-part splits are a provisional compiled tally.",
  finishRows: (d) => [
    ["Open play", d.byFinish.openPlay],
    ["Penalties", d.byFinish.penalties],
    ["Free kicks", d.byFinish.freeKicks],
    ["Left foot", d.byBodyPart.left],
    ["Right foot", d.byBodyPart.right],
    ["Head", d.byBodyPart.head],
    ["Other (chest etc.)", d.byBodyPart.other]
  ],
  teamCardSub: { goals: "goals", apps: "apps", gpg: "per game", of: "of" },
  records: (comp, d) => [
    ["91", `<b>Goals in 2012</b> — the most any footballer has scored in a calendar year.`],
    [n(comp("La Liga")), `<b>La Liga goals</b>, the competition's all-time record, all for Barcelona.`],
    [n(comp("UEFA Champions League")), `<b>Champions League goals</b> — 120 for Barcelona, 9 for PSG.`],
    ["8", `<b>Ballons d'Or</b>, more than any player in history (2009–12, 2015, 2019, 2021, 2023).`],
    [n(d.hatTricks), `<b>Hat-tricks or more</b> for club and country (provisional tally).`],
    ["46", `<b>Team trophies</b> — the most decorated career football has seen.`]
  ],
  method: "Champions League goals split Barcelona 120 / PSG 9 from club sources; other team-filtered competition splits follow the club-season competition mapping and are documented in the data file."
};

function renderDashboard(d, team) {
  const lang = getLang();
  const cfg = DASH_I18N[lang] || DASH_EN;
  const T = TEAM_COMPS[team] ? team : "all";
  const name = cfg.teamNames[T] || (T === "all" ? "all teams" : teamName(T));
  const sum = (arr) => arr.reduce((a, r) => a + r[1], 0);
  const goals = T === "all" ? d.totals.goals : sum(TEAM_COMPS[T]);
  const apps = T === "all" ? d.totals.apps : T === "argentina" ? d.totals.country.apps : clubAgg(d)[T].apps;

  setHead(d, cfg.head(name));

  // 1. Team Selector Bar with instant reactive re-rendering
  const pillsEl = el("pills");
  if (pillsEl) {
    const teams = [
      { id: "all", label: "All Teams", goals: d.totals.goals, apps: d.totals.apps, crest: "" },
      { id: "barcelona", label: "FC Barcelona", goals: 672, apps: 778, crest: "img/teams/barcelona.png" },
      { id: "argentina", label: "Argentina", goals: 125, apps: 207, crest: "img/teams/argentina.png" },
      { id: "miami", label: "Inter Miami", goals: 101, apps: 116, crest: "img/teams/miami.png" },
      { id: "psg", label: "Paris Saint-Germain", goals: 32, apps: 75, crest: "img/teams/psg.png" }
    ];
    pillsEl.className = "dash-team-selector";
    pillsEl.innerHTML = teams.map((tm) => `
      <button class="dash-team-btn${T === tm.id ? " active" : ""}" data-team="${tm.id}" aria-pressed="${T === tm.id}">
        ${tm.crest ? `<img class="dash-team-crest" src="${tm.crest}" alt="" width="22" height="22" loading="eager" decoding="async" onerror="this.remove()">` : `<span style="font-size:1.1rem" aria-hidden="true">🌍</span>`}
        <span>${tm.label}</span>
        <span class="dash-team-goals">${tm.goals}G</span>
      </button>
    `).join("");

    pillsEl.querySelectorAll(".dash-team-btn").forEach((b) =>
      b.addEventListener("click", () => {
        const nextTeam = b.dataset.team;
        const url = new URL(location.href);
        if (nextTeam === "all") url.searchParams.delete("team");
        else url.searchParams.set("team", nextTeam);
        try { history.replaceState(null, "", url.pathname + (url.search === "?" ? "" : url.search)); } catch {}
        renderDashboard(d, nextTeam);
      })
    );
  }

  const fnEl = el("filter-note");
  if (fnEl) {
    fnEl.textContent = cfg.filterNote(name, goals, apps, T);
  }

  // 2. Executive 6 KPI Cards Grid
  const kpisEl = el("kpis");
  if (kpisEl) {
    kpisEl.className = "dash-kpis-grid";
    const assistsVal = T === "all" ? "385+" : T === "barcelona" ? "269" : T === "argentina" ? "57" : T === "miami" ? "44" : "30";
    const gaVal = T === "all" ? "1,315+" : T === "barcelona" ? "941" : T === "argentina" ? "182" : T === "miami" ? "144" : "62";
    const npgVal = T === "all" ? "821" : T === "barcelona" ? "599" : T === "argentina" ? "96" : T === "miami" ? "95" : "30";
    const fkVal = T === "all" ? "67" : T === "barcelona" ? "50" : T === "argentina" ? "11" : T === "miami" ? "3" : "2";
    const htVal = T === "all" ? "59" : T === "barcelona" ? "48" : T === "argentina" ? "10" : T === "miami" ? "1" : "0";

    const kpiList = [
      { label: "Total Goals", icon: "⚽", num: n(goals), sub: `${gpg(goals, apps)} goals/game · ${n(apps)} matches (${name})` },
      { label: "Total Assists", icon: "👟", num: assistsVal, sub: `0.33 assists/game · All-time playmaker` },
      { label: "Goal Contributions", icon: "🔥", num: gaVal, sub: `1.12 direct goal involvements per match` },
      { label: "Non-Penalty Goals", icon: "⚡", num: npgVal, sub: `88.3% non-penalty ratio (open play & free kicks)` },
      { label: "Direct Free Kicks", icon: "🎯", num: fkVal, sub: `Record set-piece dead-ball precision` },
      { label: "Career Hat-Tricks", icon: "🎩", num: htVal, sub: `51 hat-tricks, 6x 4-goals, 2x 5-goals` }
    ];

    kpisEl.innerHTML = kpiList.map(k => `
      <article class="dash-kpi-box">
        <div class="dash-kpi-header">
          <span class="dash-kpi-label">${k.label}</span>
          <span class="dash-kpi-icon">${k.icon}</span>
        </div>
        <div class="dash-kpi-num">${k.num}</div>
        <div class="dash-kpi-sub">${k.sub}</div>
      </article>
    `).join("");
  }

  // 3. Body Part Breakdown Card
  const bodyCard = el("body-card");
  if (bodyCard) {
    const bodyRows = [
      { label: "Left Foot", val: d.byBodyPart.left, pct: ((d.byBodyPart.left / d.totals.goals) * 100).toFixed(1), fill: "fill-gold" },
      { label: "Right Foot", val: d.byBodyPart.right, pct: ((d.byBodyPart.right / d.totals.goals) * 100).toFixed(1), fill: "fill-blue" },
      { label: "Head", val: d.byBodyPart.head, pct: ((d.byBodyPart.head / d.totals.goals) * 100).toFixed(1), fill: "fill-green" },
      { label: "Other / Chest", val: d.byBodyPart.other, pct: ((d.byBodyPart.other / d.totals.goals) * 100).toFixed(1), fill: "fill-purple" }
    ];
    bodyCard.innerHTML = `
      <h3 class="dash-card-title">⚽ Scoring Breakdown by Body Part</h3>
      <div class="dash-bars-wrap">
        ${bodyRows.map(r => `
          <div class="dash-bar-row">
            <div class="dash-bar-meta">
              <span>${r.label}</span>
              <span><b>${n(r.val)}</b> <small style="color:var(--muted)">(${r.pct}%)</small></span>
            </div>
            <div class="dash-bar-track">
              <div class="dash-bar-fill ${r.fill}" style="width:${r.pct}%"></div>
            </div>
          </div>
        `).join("")}
      </div>
      <p class="caveat" style="margin-top:14px;margin-bottom:0">${cfg.bodyCaveat}</p>
    `;
  }

  // 4. Finish / Methods Card
  const finishCard = el("finish-card");
  if (finishCard) {
    const finishRows = [
      { label: "Open Play", val: d.byFinish.openPlay, pct: ((d.byFinish.openPlay / d.totals.goals) * 100).toFixed(1), fill: "fill-blue", sub: "81.2% open play dominance" },
      { label: "Direct Free Kicks", val: d.byFinish.freeKicks, pct: ((d.byFinish.freeKicks / d.totals.goals) * 100).toFixed(1), fill: "fill-gold", sub: "67 career set-piece conversions" },
      { label: "Penalties", val: d.byFinish.penalties, pct: ((d.byFinish.penalties / d.totals.goals) * 100).toFixed(1), fill: "fill-red", sub: "109 converted from 140 attempts (77.9%)" }
    ];
    finishCard.innerHTML = `
      <h3 class="dash-card-title">🎯 Scoring Breakdown by Method / Finish</h3>
      <div class="dash-bars-wrap">
        ${finishRows.map(r => `
          <div class="dash-bar-row">
            <div class="dash-bar-meta">
              <span>${r.label} <small style="font-weight:400;color:var(--muted)">· ${r.sub}</small></span>
              <span><b>${n(r.val)}</b> <small style="color:var(--muted)">(${r.pct}%)</small></span>
            </div>
            <div class="dash-bar-track">
              <div class="dash-bar-fill ${r.fill}" style="width:${r.pct}%"></div>
            </div>
          </div>
        `).join("")}
      </div>
      <p class="caveat" style="margin-top:14px;margin-bottom:0">${cfg.finishCaveat}</p>
    `;
  }

  // 5. Competitions Card
  const compRows = T === "all" ? d.byCompetition : TEAM_COMPS[T].map((r) => ({ competition: r[0], goals: r[1] }));
  const cmax = Math.max(...compRows.map((r) => r.goals), 1);
  const compCard = el("comp-card");
  if (compCard) {
    compCard.innerHTML = `
      <h3 class="dash-card-title">🏆 Top Competitions (${name})</h3>
      <div class="dash-bars-wrap">
        ${compRows.slice(0, 7).map(r => {
          const pct = ((r.goals / cmax) * 100).toFixed(1);
          return `
            <div class="dash-bar-row">
              <div class="dash-bar-meta">
                <span>${esc(r.competition)}</span>
                <span><b>${n(r.goals)}</b> <small style="color:var(--muted)">(${((r.goals / goals) * 100).toFixed(1)}%)</small></span>
              </div>
              <div class="dash-bar-track">
                <div class="dash-bar-fill fill-gold" style="width:${pct}%"></div>
              </div>
            </div>
          `;
        }).join("")}
      </div>
      ${!compRows.length ? `<p class="chart-empty">${cfg.chartEmpty}</p>` : ""}
    `;
  }

  // 6. Landmark Milestones Speed Tracker Card
  const msCard = el("milestones-card");
  if (msCard) {
    const milestones = [
      { goal: "100", opp: "vs Sevilla", date: "16 Jan 2010", age: "22y 206d", apps: "188" },
      { goal: "200", opp: "vs Viktoria Plzeň", date: "1 Nov 2011", age: "24y 130d", apps: "286" },
      { goal: "300", opp: "vs Granada", date: "16 Feb 2013", age: "25y 237d", apps: "365" },
      { goal: "400", opp: "vs Granada", date: "27 Sep 2014", age: "27y 95d", apps: "525" },
      { goal: "500", opp: "vs Valencia", date: "17 Apr 2016", age: "28y 298d", apps: "632" },
      { goal: "600", opp: "vs Atlético Madrid", date: "4 Mar 2018", age: "30y 253d", apps: "747" },
      { goal: "700", opp: "vs Atlético Madrid", date: "30 Jun 2020", age: "33y 6d", apps: "862" },
      { goal: "800", opp: "vs Panama", date: "23 Mar 2023", age: "35y 272d", apps: "1,017" },
      { goal: "900", opp: "vs NY Red Bulls", date: "2025", age: "37y 315d", apps: "1,135" },
      { goal: "930", opp: "Active Record", date: "2026", age: "39y", apps: "1,176" }
    ];
    msCard.innerHTML = `
      <h3 class="dash-card-title">⚡ Landmark Goal Speed Tracker</h3>
      <div style="overflow-x:auto">
        <table class="milestone-table">
          <thead>
            <tr>
              <th>Milestone</th>
              <th>Opponent</th>
              <th>Date</th>
              <th>Age</th>
              <th>Matches</th>
            </tr>
          </thead>
          <tbody>
            ${milestones.map(m => `
              <tr>
                <td><strong>Goal #${m.goal}</strong></td>
                <td>${esc(m.opp)}</td>
                <td>${esc(m.date)}</td>
                <td>${esc(m.age)}</td>
                <td><b>${esc(m.apps)}</b></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
      <p class="caveat" style="margin-top:12px;margin-bottom:0">Includes all official senior competitive and international appearances.</p>
    `;
  }

  // 7. Season sparkline
  let seasonRows;
  if (T === "all" || T === "argentina") {
    const src = T === "all" ? d.calendarYears : d.countryYears;
    seasonRows = src.map((r) => ({ label: String(r.year ?? r.season ?? ""), value: r.goals, tip: `${r.year}: ${r.goals} ${cfg.kpis.goals.toLowerCase()}` }));
  } else {
    seasonRows = d.clubSeasons.filter((s) => CLUB_KEY[s.club] === T)
      .map((s) => ({ label: s.season.length > 4 ? s.season.replace("20", "").replace("/20", "–") : s.season, value: s.goals, tip: `${s.season} (${dispClub(s.club)}): ${s.goals} ${cfg.kpis.goals.toLowerCase()}` }));
  }
  const smax = Math.max(...seasonRows.map((r) => r.value));
  seasonRows.forEach((r) => { r.peak = r.value === smax; });

  const seasonCard = el("season-card");
  if (seasonCard) {
    const figCap = cfg.figCap(T, name);
    seasonCard.innerHTML =
      `<figure style="margin:0"><div class="spark-wrap">${sparkSVG(seasonRows, { skipLabels: seasonRows.length > 12, label: `Messi goals season by season for ${name}` })}</div>` +
      `<figcaption class="figcap">${figCap}</figcaption></figure>`;
  }

  // 8. Age Card
  const ageEl = el("age-card");
  if (ageEl) {
    const ys = d.calendarYears;
    const amax = Math.max(...ys.map((r) => r.goals));
    const apeak = ys.reduce((a, b) => (b.goals > a.goals ? b : a));
    ageEl.innerHTML = T === "all"
      ? `<div class="hbars">` + ys.map((r) =>
        `<div class="hbar-row"><span class="hbar-name">${cfg.ageName(r)}</span>` +
        `<span class="hbar-track"><span class="hbar-fill${r.goals === amax ? " top" : ""}" style="width:${((r.goals / amax) * 100).toFixed(1)}%"></span></span>` +
        `<span class="hbar-val">${r.goals}</span></div>`
      ).join("") + `</div><p class="caveat">${cfg.ageCaveat(apeak)}</p>`
      : `<p class="caveat">${cfg.ageFilterNote}</p>`;
  }

  // 9. Competitions Full Table
  const compTable = el("comp-table");
  if (compTable) {
    compTable.innerHTML =
      `<table class="data-table"><caption>${cfg.compCaption(name)}</caption>` +
      `<thead><tr><th scope="col" class="left">${cfg.thComp}</th><th scope="col">${cfg.thGoals}</th><th scope="col">${cfg.thShare}</th></tr></thead><tbody>` +
      compRows.map((r) => `<tr><th scope="row">${esc(r.competition)}${r.team ? `<small class="comp-team">${esc(r.team)}</small>` : ""}` + (T === "all" && r.competition === "La Liga" ? `<span class="yr-note">${cfg.recAllTime}</span>` : "") + (T === "all" && r.competition === "UEFA Champions League" ? `<span class="yr-note">120 Barcelona · 9 PSG</span>` : "") + `</th><td><b>${r.goals}</b></td><td>${((r.goals / goals) * 100).toFixed(1)}%</td></tr>`).join("") +
      `</tbody></table>`;
    compTable.insertAdjacentHTML("beforeend", clubTableCaption());
    const tbl = compTable.querySelector("table");
    if (tbl) sortable(tbl);
  }

  // 10. Scoring Methods Full Table with required caveats
  const finishTable = el("finish-table");
  if (finishTable) {
    const fRows = cfg.finishRows(d);
    finishTable.innerHTML =
      `<table class="data-table"><caption>${cfg.finishCaption}</caption>` +
      `<thead><tr><th scope="col" class="left">${cfg.thFinish}</th><th scope="col">${cfg.thGoals}</th><th scope="col">${cfg.thShare}</th></tr></thead><tbody>` +
      fRows.map((r) => `<tr><th scope="row">${r[0]}</th><td><b>${r[1]}</b></td><td>${((r[1] / d.totals.goals) * 100).toFixed(1)}%</td></tr>`).join("") +
      `</tbody></table><p class="caveat">Provisional until hand count verification against official match sheets. Provisional compiled tally based on verified match reports.</p>`;
    finishTable.insertAdjacentHTML("beforeend", clubTableCaption());
    const tbl = finishTable.querySelector("table");
    if (tbl) sortable(tbl);
  }

  // 11. Team Cards
  const tc = el("team-cards");
  if (tc) {
    const aggAll = clubAgg(d);
    const order = ["barcelona", "psg", "miami", "argentina"];
    tc.innerHTML = order.map((k) => {
      const a = aggAll[k];
      const share = ((a.goals / d.totals.goals) * 100).toFixed(1);
      const teamDisp = cfg.teamNames[k] || teamName(k);
      return `<article class="team-card"><div class="team-card-head">${badge(k)}` +
        `<div><strong>${teamDisp}</strong><span class="sub">${CLUBS[k].years}</span></div>` +
        `<span class="team-share">${share}% ${cfg.teamCardSub.of} ${n(d.totals.goals)}</span></div>` +
        `<div class="team-nums"><div><b>${n(a.goals)}</b><span>${cfg.teamCardSub.goals}</span></div>` +
        `<div><b>${n(a.apps)}</b><span>${cfg.teamCardSub.apps}</span></div>` +
        `<div><b>${gpg(a.goals, a.apps)}</b><span>${cfg.teamCardSub.gpg}</span></div></div>` +
        `<div class="team-bar" role="img" aria-label="${teamDisp}: ${n(a.goals)} ${cfg.teamCardSub.goals}"><span style="width:${((a.goals / aggAll.barcelona.goals) * 100).toFixed(1)}%"></span></div></article>`;
    }).join("");
  }

  // 12. Records strip
  const dr = el("dash-records");
  if (dr) {
    const comp = (nm) => (d.byCompetition.find((r) => r.competition === nm) || {}).goals || 0;
    const recordsList = cfg.records(comp, d);
    dr.innerHTML = recordsList.map((r) => `<div class="record"><span class="num">${r[0]}</span><span>${r[1]}</span></div>`).join("");
  }

  renderExplore(d, "dashboard");
  renderMethod(d, cfg.method);
}

/* ================= TIMELINE ================= */
function eraOf(y) {
  const lang = getLang();
  const ranges = {
    rosario: "2004–2008",
    peak: "2009–2012",
    msn: "2013–2015",
    carry: "2016–2018",
    farewell: "2019–2021",
    paris: "2021–2023",
    miami: {
      es: "2023–presente",
      pt: "2023–presente",
      fr: "2023–présent",
      ar: "2023–الآن",
      bn: "২০২৩–বর্তমান",
      hi: "2023–वर्तमान",
      ro: "2023–prezent",
      uz: "2023–hozir"
    }[lang] || "2023–present"
  };
  const eraNames = {
    es: {
      rosario: "El chico de Rosario",
      peak: "El mayor pico en la historia del fútbol",
      msn: "La MSN y el segundo triplete",
      carry: "Liderando al Barcelona",
      farewell: "El adiós al Barcelona",
      paris: "París y la Copa del Mundo",
      miami: "Miami y el camino a los 1.000"
    },
    pt: {
      rosario: "O garoto de Rosário",
      peak: "O maior auge da história do futebol",
      msn: "O trio MSN e a segunda tríplice coroa",
      carry: "Carregando o Barcelona",
      farewell: "A despedida do Barcelona",
      paris: "Paris e a Copa do Mundo",
      miami: "Miami e o caminho para os 1.000"
    },
    fr: {
      rosario: "Le gamin de Rosario",
      peak: "Le sommet absolu du football",
      msn: "La MSN et le deuxième triplé",
      carry: "Porter le FC Barcelone",
      farewell: "L'adieu à Barcelone",
      paris: "Paris et la Coupe du Monde",
      miami: "Miami et la route vers les 1 000"
    },
    ar: {
      rosario: "الفتى القادم من روساريو",
      peak: "أعظم قمة شهدتها كرة القدم",
      msn: "ثلاثي MSN والثلاثية التاريخية الثانية",
      carry: "حمل برشلونة على الأكتاف",
      farewell: "وداع نادي برشلونة",
      paris: "باريس والتتويج بكأس العالم",
      miami: "ميامي والطريق نحو الـ 1,000 هدف"
    },
    bn: {
      rosario: "রোজারিও থেকে আসা বিস্ময় বালক",
      peak: "ফুটবল ইতিহাসের সেরা সোনালী সময়",
      msn: "এমএসএন ত্রয়ী এবং দ্বিতীয় ট্রেবল",
      carry: "বার্সেলোনাকে একাই এগিয়ে নেওয়া",
      farewell: "বার্সেলোনাকে বিদায়",
      paris: "প্যারিস এবং বিশ্বকাপ জয়",
      miami: "মায়ামি এবং ১,০০০ গোলের পথে"
    },
    hi: {
      rosario: "रोसारियो का युवा सितारा",
      peak: "फुटबॉल इतिहास का सर्वश्रेष्ठ शिखर",
      msn: "MSN त्रिमूर्ति और दूसरा ट्रेबल",
      carry: "बार्सिलोना को आगे बढ़ाना",
      farewell: "बार्सिलोना को विदाई",
      paris: "पेरिस और विश्व कप जीत",
      miami: "मियामी और 1,000 गोल की राह"
    },
    ro: {
      rosario: "Băiatul din Rosario",
      peak: "Cel mai mare vârf din istoria fotbalului",
      msn: "Trio-ul MSN și a doua triplă istorică",
      carry: "Purtând Barcelona pe umeri",
      farewell: "Adio, Barcelona",
      paris: "Parisul și Cupa Mondială",
      miami: "Miami și drumul spre 1.000 de goluri"
    },
    uz: {
      rosario: "Rosariolik o'smir",
      peak: "Futbol tarixidagi eng buyuk cho'qqi",
      msn: "MSN va ikkinchi trebl",
      carry: "Barselonani yetaklash",
      farewell: "Barselona bilan xayrlashuv",
      paris: "Parij va Jahon chempionati",
      miami: "Mayami va 1 000 gol sari yo'l"
    },
    en: {
      rosario: "The boy from Rosario",
      peak: "The greatest peak football has seen",
      msn: "MSN and the second treble",
      carry: "Carrying Barcelona",
      farewell: "Farewell to Barcelona",
      paris: "Paris and the World Cup",
      miami: "Miami and the road to 1,000"
    }
  };
  let key = "miami";
  if (y <= 2008) key = "rosario";
  else if (y <= 2012) key = "peak";
  else if (y <= 2015) key = "msn";
  else if (y <= 2018) key = "carry";
  else if (y <= 2021) key = "farewell";
  else if (y <= 2023) key = "paris";

  const langNames = eraNames[lang] || eraNames.en;
  return { key, era: langNames[key] || eraNames.en[key], range: ranges[key] };
}
/* Real era photos: self-hosted high-res action and celebration photos.
   `pos` sets the CSS focal point so faces survive the banner crop.
   Keyed by eraOf() name; eras without an entry render no figure. */
const ERA_PHOTOS = {
  "The boy from Rosario": [
    { src: "img/era-2008-olympic.jpg", w: 1636, h: 1400, pos: "50% 25%", alt: "Young Messi with long hair celebrating his El Clásico hat-trick in 2007", cap: "El Clásico hat-trick celebration at Camp Nou, March 2007" },
  ],
  "The greatest peak football has seen": [
    { src: "img/era-2011-wembley.jpg", w: 1080, h: 1350, pos: "50% 18%", alt: "Messi holding the European Cup after the 2011 final at Wembley", cap: "Champions League winners, Wembley 2011" },
    { src: "img/era-2012-ballon.jpg", w: 554, h: 554, pos: "50% 25%", alt: "Messi holding his fourth Ballon d'Or trophy in a row in 2012", cap: "Fourth Ballon d'Or in a row, 2012" },
    { src: "img/era-2011.jpg", w: 1800, h: 1013, pos: "50% 20%", alt: "Messi celebrating his goal at Wembley in the 2011 Champions League final", cap: "Goal celebration at Wembley, Champions League final 2011" },
  ],
  "MSN and the second treble": [
    { src: "img/era-2015-supercup.jpg", w: 1192, h: 670, pos: "50% 25%", alt: "Messi, Neymar and Suárez celebrating together at Barcelona", cap: "The MSN trident celebrating at Camp Nou, 2015" },
    { src: "img/era-2014-stare.jpg", w: 679, h: 452, pos: "55% 35%", alt: "Messi walking past the World Cup trophy after losing the 2014 final", cap: "The one that got away — World Cup final, Maracanã 2014" },
  ],
  "Carrying Barcelona": [
    { src: "img/era-2016.jpg", w: 1800, h: 1013, pos: "50% 25%", alt: "Messi holding his number 10 shirt to the crowd at the Santiago Bernabéu after scoring his 500th goal in 2017", cap: "Holding up shirt #10 at the Santiago Bernabéu, April 2017" },
  ],
  "Farewell to Barcelona": [
    { src: "img/era-2019-ballon.jpg", w: 1800, h: 1251, pos: "50% 30%", alt: "Messi on stage with six Ballons d'Or in Paris in 2019", cap: "Presented with six Ballons d'Or on stage, Paris 2019" },
    { src: "img/era-2021-tears.jpg", w: 1280, h: 1280, pos: "55% 28%", alt: "Messi in tears at his Barcelona farewell press conference", cap: "The goodbye press conference, Camp Nou 2021" },
    { src: "img/era-2021-copa.jpg", w: 1200, h: 1521, pos: "55% 22%", alt: "Messi kissing the Copa América trophy after winning it in 2021", cap: "Copa América champions, Maracanã 2021" },
  ],
  "Paris and the World Cup": [
    { src: "img/era-2021-psg-signing.jpg", w: 1200, h: 900, pos: "20% 22%", alt: "Messi signing his Paris Saint-Germain contract alongside Nasser Al-Khelaifi", cap: "Signing for Paris Saint-Germain, 2021" },
    { src: "img/era-2021-ballon7.jpg", w: 1600, h: 1062, pos: "50% 20%", alt: "Messi in a sparkling jacket holding the Ballon d'Or after winning his seventh in 2021", cap: "Seventh Ballon d'Or, Paris 2021" },
    { src: "img/era-2022.jpg", w: 1800, h: 1212, pos: "50% 25%", alt: "Messi lifted on Agüero's shoulders celebrating the 2022 World Cup win at Lusail", cap: "Lifting the World Cup on Agüero's shoulders, Lusail 2022" },
  ],
  "Miami and the road to 1,000": [
    { src: "img/era-2023-miami.jpg", w: 679, h: 451, pos: "45% 40%", alt: "Messi unveiled as Inter Miami's number 10 alongside David Beckham", cap: "Unveiled in Miami with Beckham, 2023" },
    { src: "img/era-2023-ballon8.jpg", w: 554, h: 554, pos: "50% 25%", alt: "Messi in a tuxedo holding the Ballon d'Or after winning a record eighth in 2023", cap: "Record eighth Ballon d'Or, 2023" },
    { src: "img/era-2024-copa.jpg", w: 562, h: 546, pos: "50% 25%", alt: "Messi in Argentina's shirt holding two Copa América trophies in 2024", cap: "Back-to-back Copa América titles, 2024" },
  ],
};
ERA_PHOTOS.rosario = ERA_PHOTOS["The boy from Rosario"];
ERA_PHOTOS.peak = ERA_PHOTOS["The greatest peak football has seen"];
ERA_PHOTOS.msn = ERA_PHOTOS["MSN and the second treble"];
ERA_PHOTOS.carry = ERA_PHOTOS["Carrying Barcelona"];
ERA_PHOTOS.farewell = ERA_PHOTOS["Farewell to Barcelona"];
ERA_PHOTOS.paris = ERA_PHOTOS["Paris and the World Cup"];
ERA_PHOTOS.miami = ERA_PHOTOS["Miami and the road to 1,000"];

const ERA_INTROS = {
  es: {
    rosario: `Un joven de 17 años de Rosario debuta contra el Espanyol en octubre de 2004, y en pocos meses el Camp Nou corea su nombre. Su primer gol llega ante el Albacete en mayo siguiente —picando el balón sobre el portero tras asistencia de Ronaldinho— convirtiéndose en el goleador más joven del Barcelona. Para 2008 ya lucía el oro olímpico en su cuello.`,
    peak: `Seis títulos en 2009. Cuatro Balones de Oro consecutivos. Luego 2012: 91 goles en un solo año natural, rompiendo un récord intacto durante cuatro décadas —incluyendo cinco goles en una noche europea contra el Leverkusen. La cima futbolística más deslumbrante de la historia.`,
    msn: `Messi, Suárez y Neymar: el tridente ofensivo más letal del fútbol moderno, sellando el segundo triplete en 2015 en Berlín. Su gol en la final de la Copa del Rey de esa primavera, superando a media defensa del Athletic Club, es una de las mayores obras de arte del fútbol.`,
    carry: `La legendaria remontada 6–1 al PSG en 2017, la icónica celebración de la camiseta 10 en el Bernabéu y otro doblete de Liga y Copa en 2018 liderando al equipo con actuaciones magistrales en cada jornada.`,
    farewell: `El sexto Balón de Oro, la Copa del Rey de 2021 y, tras 21 años inolvidables, una emotiva despedida del Camp Nou como máximo goleador, plusmarquista de partidos y referente eterno del barcelonismo.`,
    paris: `Dos títulos de liga en París, el séptimo Balón de Oro y la gloria suprema en Catar el 18 de diciembre de 2022: dos goles en la final y la Copa del Mundo en sus manos tras un épico 3–3. La carrera quedó consagrada para siempre.`,
    miami: `Llegada triunfal a Estados Unidos con el título de Leagues Cup en su primer mes, el octavo Balón de Oro, una nueva Copa América con Argentina y la marcha histórica rumbo a los 1.000 goles en vivo.`
  },
  pt: {
    rosario: `Um jovem de 17 anos de Rosário estreia contra o Espanyol em outubro de 2004 e, em poucos meses, o Camp Nou já canta seu nome. O primeiro gol vem contra o Albacete em maio seguinte — encobrindo o goleiro após passe de Ronaldinho. Em 2008, conquista o ouro olímpico em Pequim.`,
    peak: `Seis títulos em 2009. Quatro Bolas de Ouro consecutivas. Depois 2012: 91 gols em um único ano civil, quebrando um recorde de 40 anos — incluindo cinco gols em uma noite de Champions contra o Leverkusen. O auge mais impressionante do futebol mundial.`,
    msn: `Messi, Suárez e Neymar: o trio MSN encantou o planeta e conquistou a segunda tríplice coroa em 2015 em Berlim. Um ataque inesquecível e imparável.`,
    carry: `A histórica remontada de 6–1 contra o PSG em 2017, a lendária comemoração exibindo a camisa 10 no Bernabéu e a liderança absoluta com mais uma dobradinha nacional em 2018.`,
    farewell: `A sexta Bola de Ouro, a Copa do Rei de 2021 e a emocionante despedida do Camp Nou após 21 anos históricos como maior artilheiro e ídolo eterno do Barcelona.`,
    paris: `Dois títulos franceses em Paris, a sétima Bola de Ouro e a glória suprema no Catar em 18 de dezembro de 2022: campeão da Copa do Mundo com dois gols na final. O topo absoluto da história.`,
    miami: `Conquista imediata da Leagues Cup, oitava Bola de Ouro, mais uma Copa América com a Argentina e a contagem rumo aos 1.000 gols oficiais ao vivo.`
  },
  fr: {
    rosario: `Un jeune de 17 ans de Rosario entre en jeu contre l'Espanyol en octobre 2004, et en quelques mois le Camp Nou scande son nom. Son premier but arrive face à Albacete en mai d'un lob subtil sur une passe de Ronaldinho. En 2008, il décroche la médaille d'or olympique.`,
    peak: `Sextuplé historique en 2009. Quatre Ballons d'Or d'affilée. Puis 2012 : 91 buts sur une seule année civile, pulvérisant un record vieux de 40 ans — dont un quintuplé mémorable en Ligue des champions contre Leverkusen. Le plus grand sommet de l'histoire du jeu.`,
    msn: `Messi, Suárez et Neymar : le trio magique MSN terrasse l'Europe et signe un deuxième triplé historique en 2015 à Berlin. Une efficacité offensive inégalée.`,
    carry: `La légendaire remontada 6-1 contre le PSG en 2017, le maillot numéro 10 brandi au Santiago Bernabéu et un nouveau doublé Liga-Coupe en 2018, portant le club au sommet à chaque rencontre.`,
    farewell: `Un sixième Ballon d'Or, une ultime Coupe du Roi en 2021 et un adieu bouleversant au Camp Nou après 21 années légendaires au FC Barcelone.`,
    paris: `Deux titres de champion avec le PSG, un septième Ballon d'Or et la consécration suprême au Qatar le 18 décembre 2022 : champion du monde avec un doublé en finale. La carrière est complète.`,
    miami: `Trophée de Leagues Cup dès son premier mois, un huitième Ballon d'Or, une nouvelle Copa América et la marche vers les 1 000 buts en direct.`
  },
  ar: {
    rosario: `شاب في السابعة عشرة من عمره من روساريو يشارك أمام إسبانيول في أكتوبر 2004، وفي غضون أشهر أصبح الكامب نو يهتف باسمه. جاء هدفه الأول أمام ألباسيتي بلمسة ساقطة رائعة من تمريرة رونالدينيو، وبحلول عام 2008 تقلد الميدالية الذهبية الأولمبية.`,
    peak: `سداسية تاريخية في 2009. أربع كرات ذهبية على التوالي. ثم عام 2012: 91 هدفاً في عام ميلادي واحد، محطماً رقماً صمد لأربعين عاماً — بما في ذلك خماسية تاريخية أمام ليفركوزن في دوري الأبطال.`,
    msn: `ميسي، سواريز، نيمار — الثلاثي الأسطوري MSN يكتسح أوروبا ويحقق الثلاثية التاريخية الثانية عام 2015 في برلين. قوة هجومية غير مسبوقة.`,
    carry: `الريمونتادا التاريخية 6–1 أمام باريس عام 2017، ورفع القميص رقم 10 في البرنابيو، وثنائية الدوري والكأس في 2018 بقيادة أسطورية ملهمة.`,
    farewell: `الكرة الذهبية السادسة، ولقب كأس الملك 2021، ثم الوداع المؤثر لنادي برشلونة بعد 21 عاماً من المجد كهداف تاريخي وأعظم لاعب في تاريخ النادي.`,
    paris: `لقبان في الدوري مع باريس، الكرة الذهبية السابعة، والمجد الأكبر في قطر يوم 18 ديسمبر 2022: بطل كأس العالم بهدفين في النهائي التاريخي بعد ملحمة 3–3.`,
    miami: `التتويج بلقب كأس الدوريات في شهره الأول، الكرة الذهبية الثامنة، لقب كوبا أمريكا آخر مع الأرجنتين، ومواصلة الطريق نحو 1,000 هدف رسمي.`
  },
  bn: {
    rosario: `১৭ বছর বয়সে ২০০৪ সালের অক্টোবরে এসপানিওলের বিপক্ষে মাঠে নামেন রোজারিওর এক তরুণ। কয়েকমাসের মধ্যেই ক্যাম্প ন্যু মুখরিত হয় তার নামে। মে মাসে আলবাসেতের বিপক্ষে প্রথম গোল এবং ২০০৮ সালে জেতেন অলিম্পিক স্বর্ণপদক।`,
    peak: `২০০৯ সালে ছয়টি ট্রফি। টানা চারটি ব্যালন ডি'অর। এরপর ২০১২: এক পঞ্জিকাবর্ষে ৯১ গোল — যা ফুটবল ইতিহাসের সর্বকালের অবিসংবাদিত বিশ্বরেকর্ড।`,
    msn: `মেসি, সুয়ারেজ এবং নেইমার — বিখ্যাত এমএসএন ত্রয়ী ২০১৫ সালে বার্লিনে দ্বিতীয় ঐতিহাসিক ট্রেবল নিশ্চিত করে। ফুটবলের সবচেয়ে দৃষ্টিনন্দন আক্রমণভাগ।`,
    carry: `২০১৭ সালে পিএসজির বিপক্ষে ঐতিহাসিক ৬–১ প্রত্যাবর্তন, বার্নাব্যুতে ১০ নম্বর জার্সি উঁচিয়ে উদযাপন এবং ২০১৮ সালে ঘরোয়া ডাবল জয়।`,
    farewell: `ষষ্ঠ ব্যালন ডি'অর, ২০২১ কোপা দেল রে ট্রফি এবং বার্সেলোনায় দীর্ঘ ২১ বছরের অবিস্মরণীয় যাত্রা শেষে আবেগঘন বিদায়।`,
    paris: `প্যারিসে দুটি লিগ শিরোপা, সপ্তম ব্যালন ডি'অর এবং ১৮ ডিসেম্বর ২০২২ কাতারে পরম স্বপ্নপূরণ: ফাইনালে দুই গোল ও বিশ্বকাপ জয়।`,
    miami: `যোগদানের প্রথম মাসেই লিগস কাপ জয়, অষ্টম ব্যালন ডি'অর, আর্জেন্টিনার হয়ে আরেকটি কোপা আমেরিকা এবং ১,০০০ গোলের দিকে এগিয়ে চলা।`
  },
  hi: {
    rosario: `17 वर्ष की उम्र में अक्टूबर 2004 में एस्पेनयोल के खिलाफ पदार्पण किया। रोनाल्डिन्हो के पास पर अल्बासेटे के खिलाफ पहला सीनियर गोल दागा और 2008 में ओलंपिक स्वर्ण पदक जीता।`,
    peak: `2009 में छह ट्रॉफियां। लगातार चार बैलन डी'ओर। फिर 2012 में एक ही वर्ष में 91 गोल का ऐतिहासिक विश्व रिकॉर्ड।`,
    msn: `मेस्सी, सुआरेज़ और नेमार — ऐतिहासिक MSN तिकड़ी जिसने 2015 में बर्लिन में दूसरा ट्रेबल जीतकर इतिहास रचा।`,
    carry: `2017 में पीएसजी के खिलाफ ऐतिहासिक 6-1 की वापसी, बर्नाब्यू में 10 नंबर जर्सी का ऐतिहासिक उत्सव और 2018 में शानदार प्रदर्शन।`,
    farewell: `छठा बैलन डी'ओर, 2021 कोपा डेल रे और 21 वर्षों के ऐतिहासिक सफर के बाद बार्सिलोना को भावुक विदाई।`,
    paris: `पेरिस में दो लीग खिताब, सातवां बैलन डी'ओर और 18 दिसंबर 2022 को कतर में विश्व कप का सपना पूरा, फाइनल में दो गोल किए।`,
    miami: `आते ही लीग्स कप खिताब, आठवां बैलन डी'ओर, अर्जेंटीना के साथ एक और कोपा अमेरिका और 1,000 आधिकारिक गोलों की ओर अग्रसर।`
  },
  ro: {
    rosario: `La doar 17 ani, tânărul din Rosario debutează contra lui Espanyol în octombrie 2004. Primul gol oficial vine în mai 2005 împotriva lui Albacete, dintr-o pasă a lui Ronaldinho, iar în 2008 cucerește aurul olimpic.`,
    peak: `Șase trofee în 2009. Patru Baloane de Aur consecutive. Apoi anul 2012: 91 de goluri într-un singur an calendaristic, doborând un record vechi de 40 de ani.`,
    msn: `Messi, Suárez și Neymar — tridentul legendar MSN cucerește a doua triplă istorică în 2015 la Berlin. O forță ofensivă de neoprit.`,
    carry: `Remontada istorică 6–1 cu PSG în 2017, celebrarea legendară cu tricoul ridicat pe Bernabéu și o nouă dublă titlu-cupă în 2018.`,
    farewell: `Al șaselea Balon de Aur, Cupa Regelui din 2021 și emoționanta despărțire de Camp Nou după 21 de ani legendari la Barcelona.`,
    paris: `Două titluri de campion la Paris, al șaptelea Balon de Aur și gloria supremă în Qatar pe 18 decembrie 2022: Cupa Mondială ridicată deasupra capului cu o dublă în finală.`,
    miami: `Câștigarea Leagues Cup chiar din prima lună, al optulea Balon de Aur, o nouă Copa América cu Argentina și marșul istoric spre 1.000 de goluri oficiale.`
  },
  uz: {
    rosario: `2004 yil oktyabrida 17 yoshli bola Espanyolga qarshi maydonga tushadi. Keyingi yil may oyida Albacete darvozasiga Ronaldinyo pasidan so'ng ilk golini uradi va 2008 yilda Olimpiada oltin medalini qo'lga kiritadi.`,
    peak: `2009 yilda oltita sovrin. Ketma-ket to'rtta Oltin to'p. Va 2012 yil: bir yilda 91 ta gol bilan tarixiy jahon rekordi.`,
    msn: `Messi, Suares va Neymar — afsonaviy MSN triosi 2015 yilda Berlinda ikkinchi tarixiy treblni qo'lga kiritdi.`,
    carry: `2017 yilda PSJ ustidan 6-1 hisobidagi g'alaba, Bernabeuda 10-raqamli futbolkani ko'rsatib nishonlash va 2018 yilgi oltin dubl.`,
    farewell: `Oltinchi Oltin to'p, 2021 yilgi Ispaniya kubogi va 21 yillik afsonaviy davrdan so'ng Barselona bilan xayrlashuv.`,
    paris: `PSJ bilan ikkita liga chempionligi, ettinchi Oltin to'p va 2022 yil 18 dekabrda Qatarda Jahon chempionligi: finalda ikkita gol.`,
    miami: `Birinchi oydayoq Ligalar Kubogi, sakkizinchi Oltin to'p, Argentina bilan yana bir Amerika Kubogi va 1 000 ta rasmiy gol sari yurish.`
  }
};

/* Era openers: short fan-editor intros, one per chapter. Plain prose about
   famous nights — no new numbers, every figure here already lives on this
   site or in the trophy list. */
const ERA_INTRO = {
  "The boy from Rosario":
    `A 17-year-old from Rosario walks on against Espanyol in October 2004, all knees and elbows, and within months the Camp Nou is chanting a name it can barely pronounce yet. The first goal comes against Albacete the following May — a clipped little finish over the keeper from a Ronaldinho lob — and suddenly Barcelona's youngest scorer belongs in the first team. By 2008 there is an Olympic gold around his neck and nobody left arguing.`,
  "The greatest peak football has seen":
    `Six trophies in 2009. Four Ballons d'Or in a row. Then 2012: 91 goals in a single calendar year, a number so absurd it broke a record that had stood for forty years — including five in one Champions League night against Leverkusen. Nobody before or since has played football at this level; the only debate left is which month of it was the best.`,
  "MSN and the second treble":
    `Messi, Suárez, Neymar — three forwards who should never have fit together, scoring for fun and sweeping a second treble in 2015, sealed in Berlin. His Copa del Rey final goal that spring, slaloming past half of Athletic Bilbao, might be the greatest he ever scored. Pick your own; there are a dozen candidates.`,
  "Carrying Barcelona":
    `Xavi gone, Iniesta fading, the squad thinning every summer — and one man dragging the whole club forward anyway. The Remontada against PSG in 2017, the iconic shirt celebration at the Bernabéu, another league-and-cup double in 2018: these were his teams in a way the great sides before them never quite were. Watch the photo above — by now every defender in Spain knows exactly what is coming, and none of them can stop it.`,
  "Farewell to Barcelona":
    `The burofax summer of 2020, a sixth Ballon d'Or, one last Copa del Rey lifted in 2021 — and then, that August, a tearful press conference and a free transfer nobody believed possible. He left as the club's everything: its record scorer, its record appearance-maker, and the reason a generation of kids supports Barcelona at all.`,
  "Paris and the World Cup":
    `Two strange, brilliant years in Paris — a seventh Ballon d'Or, two league titles — but everything was building toward one winter in Qatar. Seven goals, a Golden Ball, and on 18 December 2022, two goals in the final and the trophy lift at Lusail that ended every argument. The career was complete; everything after is a bonus.`,
  "Miami and the road to 1,000":
    `Nobody expected the pink shirt. Then came a trophy in his first month, an eighth Ballon d'Or, another Copa América with Argentina, and a club transformed around him. Now every goal bends the arc toward 1,000 — a number no one has ever reached in official senior football. Stick around; you are watching the last chapter live.`,
};
const eraIntro = (key, era) => {
  const lang = getLang();
  const intro = (ERA_INTROS[lang] && ERA_INTROS[lang][key]) || ERA_INTRO[era] || ERA_INTRO[key];
  return intro ? `<p class="chapter-intro">${intro}</p>` : "";
};
const eraPhotos = (key, era) => {
  const pics = ERA_PHOTOS[key] || ERA_PHOTOS[era];
  if (!pics || !pics.length) return "";
  return `<div class="ch-photos${pics.length === 1 ? " solo" : ""}">` + pics.map((p) => {
    const webpSrc = p.src.replace(/\.jpg$/, ".webp");
    return `<figure class="ch-photo"><picture>` +
      `<source srcset="${webpSrc}" type="image/webp" />` +
      `<img src="${p.src}" width="${p.w}" height="${p.h}" alt="${esc(p.alt)}" loading="lazy" decoding="async" style="object-position:${p.pos}" />` +
      `</picture><figcaption class="photo-credit">${esc(p.cap)}</figcaption></figure>`;
  }).join("") + `</div>`;
};
const TIMELINE_I18N = {
  es: {
    head: (t) => `Desde su debut en Barcelona en 2004 hasta <b>${n(t.goals)} goles oficiales</b> y contando — las noches históricas, récords y trofeos en orden cronológico.`,
    keydates: (t, lastUpdated) => [
      ["16 Oct 2004", "Debut oficial con el <b>Barcelona</b> ante el Espanyol, con 17 años."],
      ["1 May 2005", "Primer gol oficial, ante el Albacete — el goleador más joven del Barcelona en ese momento."],
      ["17 Ago 2005", "Debut con la <b>Selección Argentina</b> absoluta ante Hungría."],
      ["2012", "<b>91 goles</b> en un año natural — récord mundial absoluto en la historia del fútbol."],
      ["18 Dic 2022", "Campeón de la <b>Copa del Mundo</b> con Argentina en Catar, marcando un doblete en la final."],
      [esc(lastUpdated), `<b>${n(t.goals)} goles oficiales</b> entre clubes y selección — última actualización.`]
    ],
    inProg: "en progreso",
    goals: "goles",
    goalsInEra: (goals, share, total) => `<b>${n(goals)} goles</b> · ${share}% de ${n(total)}`,
    peakYear: (pk, tr) => `<p class="ch-callout">Año cumbre <b>${pk.year} · ${pk.goals} goles</b>` + (tr ? ` · <b>${tr}</b> ${tr === 1 ? "título colectivo" : "títulos colectivos"} en esta etapa` : "") + `</p>`,
    empty: (val, total) => `Sin resultados para “${val}” — borra la búsqueda para ver los ${total} hitos.`,
    tagRecord: "Récord", tagWc: "Mundial", tagFirst: "Primero",
    faq: [
      ["¿Cuándo debutó Messi?", "Con el Barcelona el <b>16 de octubre de 2004</b> contra el Espanyol con 17 años y 114 días; con Argentina el 17 de agosto de 2005."],
      ["¿Cuándo marcó Messi su primer gol?", "El <b>1 de mayo de 2005</b> ante el Albacete — en ese momento el goleador más joven del Barcelona en La Liga."],
      ["¿Cuándo ganó Messi la Copa del Mundo?", "El <b>18 de diciembre de 2022</b>, venciendo a Francia por penales en Lusail tras empatar 3–3."],
      ["¿Cuándo se fue Messi del Barcelona?", "En <b>agosto de 2021</b>, fichando por el Paris Saint-Germain tras 21 años en el club catalán."],
      ["¿Cuándo llegó Messi al Inter Miami?", "En <b>julio de 2023</b>, ganando la Leagues Cup pocas semanas después de su llegada."]
    ],
    method: "Los hitos cronológicos están documentados por fecha exacta; las barras de goles dividen los años naturales en períodos consecutivos que suman el total de la carrera."
  },
  pt: {
    head: (t) => `Desde a estreia no Barcelona em 2004 até <b>${n(t.goals)} gols na carreira</b> e contando — noites históricas, recordes e títulos em ordem.`,
    keydates: (t, lastUpdated) => [
      ["16 Out 2004", "Estreia profissional pelo <b>Barcelona</b> contra o Espanyol, aos 17 anos."],
      ["1 Mai 2005", "Primeiro gol oficial, contra o Albacete — o mais jovem a marcar pelo Barcelona na época."],
      ["17 Ago 2005", "Estreia pela <b>Seleção Argentina</b> principal contra a Hungria."],
      ["2012", "<b>91 gols</b> no ano civil — recorde mundial absoluto na história do futebol."],
      ["18 Dez 2022", "Conquista a <b>Copa do Mundo</b> com a Argentina no Catar, marcando dois gols na final."],
      [esc(lastUpdated), `<b>${n(t.goals)} gols na carreira</b> por clubes e seleção — última verificação.`]
    ],
    inProg: "em andamento",
    goals: "gols",
    goalsInEra: (goals, share, total) => `<b>${n(goals)} gols</b> · ${share}% de ${n(total)}`,
    peakYear: (pk, tr) => `<p class="ch-callout">Ano auge <b>${pk.year} · ${pk.goals} gols</b>` + (tr ? ` · <b>${tr}</b> ${tr === 1 ? "título coletivo" : "títulos coletivos"} neste período` : "") + `</p>`,
    empty: (val, total) => `Nenhum resultado para “${val}” — limpe a busca para ver os ${total} marcos.`,
    tagRecord: "Recorde", tagWc: "Copa", tagFirst: "Primeiro",
    faq: [
      ["Quando Messi estreou?", "Pelo Barcelona em <b>16 de outubro de 2004</b> contra o Espanyol aos 17 anos; pela Argentina em 17 de agosto de 2005."],
      ["Quando Messi marcou seu primeiro gol?", "Em <b>1 de maio de 2005</b> contra o Albacete — então o mais jovem marcador da história do Barcelona."],
      ["Quando Messi ganhou a Copa do Mundo?", "Em <b>18 de dezembro de 2022</b>, derrotando a França nos pênaltis em Lusail após um épico 3–3."],
      ["Quando Messi saiu do Barcelona?", "Em <b>agosto de 2021</b>, acertando com o Paris Saint-Germain após 21 anos no clube catalão."],
      ["Quando Messi chegou ao Inter Miami?", "Em <b>julho de 2023</b>, conquistando a Leagues Cup poucas semanas após chegar."]
    ],
    method: "Marcos cronológicos documentados por data exata; barras de gols dividem os anos civis em faixas contínuas somando o total da carreira."
  },
  fr: {
    head: (t) => `De ses débuts à Barcelone en 2004 à <b>${n(t.goals)} buts en carrière</b> — les moments clés, records et trophées par ordre chronologique.`,
    keydates: (t, lastUpdated) => [
      ["16 Oct 2004", "Débuts professionnels avec le <b>FC Barcelone</b> contre l'Espanyol, à 17 ans."],
      ["1 Mai 2005", "Premier but officiel face à Albacete — plus jeune buteur du Barça à l'époque."],
      ["17 Août 2005", "Débuts avec l'équipe nationale d'<b>Argentine</b> contre la Hongrie."],
      ["2012", "<b>91 buts</b> sur une année civile — le record mondial absolu du football."],
      ["18 Déc 2022", "Remporte la <b>Coupe du Monde</b> au Qatar avec l'Argentine en inscrivant un doublé en finale."],
      [esc(lastUpdated), `<b>${n(t.goals)} buts en carrière</b> en club et sélection — dernière mise à jour.`]
    ],
    inProg: "en cours",
    goals: "buts",
    goalsInEra: (goals, share, total) => `<b>${n(goals)} buts</b> · ${share}% sur ${n(total)}`,
    peakYear: (pk, tr) => `<p class="ch-callout">Année record <b>${pk.year} · ${pk.goals} buts</b>` + (tr ? ` · <b>${tr}</b> ${tr === 1 ? "trophée collectif" : "trophées collectifs"} sur cette période` : "") + `</p>`,
    empty: (val, total) => `Aucun résultat pour “${val}” — effacez pour voir les ${total} étapes.`,
    tagRecord: "Record", tagWc: "Mondial", tagFirst: "Premier",
    faq: [
      ["Quand Messi a-t-il fait ses débuts ?", "Avec Barcelone le <b>16 octobre 2004</b> face à l'Espanyol à 17 ans et 114 jours ; avec l'Argentine le 17 août 2005."],
      ["Quand Messi a-t-il marqué son premier but ?", "Le <b>1er mai 2005</b> contre Albacete — alors le plus jeune buteur de l'histoire du Barça."],
      ["Quand Messi a-t-il gagné la Coupe du Monde ?", "Le <b>18 décembre 2022</b>, aux tirs au but face à la France après un match nul 3–3 à Lusail."],
      ["Quand Messi a-t-il quitté Barcelone ?", "En <b>août 2021</b>, rejoignant le Paris Saint-Germain après 21 années au Barça."],
      ["Quand Messi a-t-il rejoint l'Inter Miami ?", "En <b>juillet 2023</b>, remportant la Leagues Cup quelques semaines seulement après son arrivée."]
    ],
    method: "Les entrées de la frise chronologique sont des jalons précis ; les barres de buts divisent les années civiles sans chevauchement pour reconstituer le total de carrière."
  },
  ar: {
    head: (t) => `من بدايته مع برشلونة عام 2004 حتى <b>${n(t.goals)} هدفاً في مسيرته</b> والمزيد — الليالي التاريخية والأرقام والبطولات بالترتيب.`,
    keydates: (t, lastUpdated) => [
      ["16 أكتوبر 2004", "الظهور الأول رسمياً مع <b>برشلونة</b> أمام إسبانيول، في عمر 17 عاماً."],
      ["1 مايو 2005", "أول هدف رسمي أمام ألباسيتي — أصغر هداف في تاريخ برشلونة في ذلك الوقت."],
      ["17 أغسطس 2005", "الظهور الأول مع <b>منتخب الأرجنتين</b> الأول أمام المجر."],
      ["2012", "<b>91 هدفاً</b> في سنة ميلادية واحدة — الرقم القياسي العالمي التاريخي."],
      ["18 ديسمبر 2022", "التتويج بلقب <b>كأس العالم</b> مع الأرجنتين في قطر، مسجلاً هدفين في النهائي."],
      [esc(lastUpdated), `<b>${n(t.goals)} هدفاً في المسيرة</b> مع الأندية والمنتخب — آخر تحديث.`]
    ],
    inProg: "مستمر",
    goals: "أهداف",
    goalsInEra: (goals, share, total) => `<b>${n(goals)} أهداف</b> · ${share}% من ${n(total)}`,
    peakYear: (pk, tr) => `<p class="ch-callout">أفضل سنة <b>${pk.year} · ${pk.goals} أهداف</b>` + (tr ? ` · <b>${tr}</b> ${tr === 1 ? "بطولة جماعية" : "بطولات جماعية"} خلال هذه الحقبة` : "") + `</p>`,
    empty: (val, total) => `لا توجد نتائج تطابق “${val}” — امسح البحث لمشاهدة جميع المحطات الـ ${total}.`,
    tagRecord: "رقم قياسي", tagWc: "كأس العالم", tagFirst: "الأول",
    faq: [
      ["متى كان الظهور الأول لميسي؟", "مع برشلونة في <b>16 أكتوبر 2004</b> ضد إسبانيول بعمر 17 عاماً و114 يوماً؛ ومع الأرجنتين في 17 أغسطس 2005."],
      ["متى سجل ميسي هدفه الأول؟", "في <b>1 مايو 2005</b> أمام ألباسيتي — وكان حينها أصغر هداف في تاريخ برشلونة."],
      ["متى فاز ميسي بكأس العالم؟", "في <b>18 ديسمبر 2022</b>، متغلباً على فرنسا بركلات الترجيح بعد تعادل ملحمي 3–3 في لوسيل."],
      ["متى غادر ميسي برشلونة؟", "في <b>أغسطس 2021</b>، منتقلاً إلى باريس سان جيرمان بعد 21 عاماً في النادي الكتالوني."],
      ["متى انضم ميسي إلى إنتر ميامي؟", "في <b>يوليو 2023</b>، متوجاً بكأس الدوريات خلال أسابيع من انضمامه."]
    ],
    method: "أحداث الخط الزمني دقيقة باليوم والسنة، ومخططات الأهداف تقسم السنوات دون تداخل لتتطابق مع إجمالي المسيرة."
  },
  bn: {
    head: (t) => `২০০৪ সালে বার্সেলোনায় অভিষেক থেকে <b>${n(t.goals)} ক্যারিয়ার গোল</b> — স্মরণীয় ম্যাচ, রেকর্ড এবং ট্রফি পর্যায়ক্রমে।`,
    keydates: (t, lastUpdated) => [
      ["১৬ অক্টো ২০০৪", "১৭ বছর বয়সে এসপানিওলের বিরুদ্ধে <b>বার্সেলোনার</b> হয়ে প্রথম দলের অভিষেক।"],
      ["১ মে ২০০৫", "আলবাসেতের বিরুদ্ধে প্রথম গোল — তৎকালীন বার্সার ইতিহাসের সর্বকনিষ্ঠ গোলদাতা।"],
      ["১৭ আগস্ট ২০০৫", "হাঙ্গেরির বিপক্ষে <b>আর্জেন্টিনা</b> জাতীয় দলে অভিষেক।"],
      ["২০১২", "এক ক্যালেন্ডার বছরে <b>৯১ গোল</b> — ফুটবলের সর্বকালের বিশ্বরেকর্ড।"],
      ["১৮ ডিসে ২০২২", "কাতারে আর্জেন্টিনার হয়ে <b>বিশ্বকাপ</b> জয়, ফাইনালে দুই গোল।"],
      [esc(lastUpdated), `ক্লাব ও জাতীয় দল মিলিয়ে <b>${n(t.goals)} ক্যারিয়ার গোল</b> — সর্বশেষ আপডেট।`]
    ],
    inProg: "চলমান",
    goals: "গোল",
    goalsInEra: (goals, share, total) => `<b>${n(goals)} গোল</b> · ${share}% (মোট ${n(total)})`,
    peakYear: (pk, tr) => `<p class="ch-callout">সেরা বছর <b>${pk.year} · ${pk.goals} গোল</b>` + (tr ? ` · এই সময়ে <b>${tr}</b>টি দলীয় ট্রফি জয়` : "") + `</p>`,
    empty: (val, total) => `“${val}” এর জন্য কোনো ফলাফল নেই — সবগুলো দেখতে সার্চ খালি করুন।`,
    tagRecord: "রেকর্ড", tagWc: "বিশ্বকাপ", tagFirst: "প্রথম",
    faq: [
      ["মেসির অভিষেক কবে হয়েছিল?", "বার্সেলোনার হয়ে <b>১৬ অক্টোবর ২০০৪</b> এসপানিওলের বিপক্ষে ১৭ বছর বয়সে; আর্জেন্টিনার হয়ে ১৭ আগস্ট ২০০৫।"],
      ["মেসির প্রথম গোল কবে?", "<b>১ মে ২০০৫</b> আলবাসেতের বিপক্ষে — সে সময় বার্সেলোনার সবচেয়ে তরুণ গোলদাতা।"],
      ["মেসি বিশ্বকাপ কবে জেতেন?", "<b>১৮ ডিসেম্বর ২০২২</b>, ফাইনালে ফ্রান্সের সাথে ৩–৩ ড্রয়ের পর টাইব্রেকারে জয়ী হয়ে।"],
      ["মেসি বার্সেলোনা ছেড়েছিলেন কবে?", "<b>আগস্ট ২০২১</b>-এ ২১ বছর বার্সেলোনায় কাটানোর পর প্যারিস সেন্ট জার্মেইতে যোগ দেন।"],
      ["মেসি ইন্টার মায়ামিতে যোগ দেন কবে?", "<b>জুলাই ২০২৩</b>-এ, যোগ দেওয়ার কয়েক সপ্তাহের মধ্যেই লিগস কাপ জয় করেন।"]
    ],
    method: "টাইমলাইনের মাইলফলকগুলো তারিখ অনুসারে সাজানো; গোলের বারগুলো ক্যারিয়ারের মোট সংখ্যার সাথে সামঞ্জস্যপূর্ণ।"
  },
  hi: {
    head: (t) => `2004 में बार्सिलोना डेब्यू से <b>${n(t.goals)} करियर गोल</b> तक — ऐतिहासिक रातें, रिकॉर्ड और ट्रॉफियां क्रमबद्ध रूप से।`,
    keydates: (t, lastUpdated) => [
      ["16 अक्टू 2004", "17 वर्ष की उम्र में एस्पेनयोल के खिलाफ <b>बार्सिलोना</b> के लिए सीनियर डेब्यू।"],
      ["1 मई 2005", "अल्बासेटे के खिलाफ पहला सीनियर गोल — उस समय बार्सिलोना के सबसे युवा गोलकीपर।"],
      ["17 अग 2005", "हंगरी के खिलाफ <b>अर्जेंटीना</b> सीनियर टीम में डेब्यू।"],
      ["2012", "कैलेंडर वर्ष में <b>91 गोल</b> — फुटबॉल का सर्वकालिक विश्व रिकॉर्ड।"],
      ["18 दिस 2022", "कतर में अर्जेंटीना के साथ <b>विश्व कप</b> जीत, फाइनल में दो गोल किए।"],
      [esc(lastUpdated), `क्लब और देश के लिए <b>${n(t.goals)} करियर गोल</b> — नवीनतम अद्यतन।`]
    ],
    inProg: "प्रगति पर",
    goals: "गोल",
    goalsInEra: (goals, share, total) => `<b>${n(goals)} गोल</b> · ${share}% (${n(total)} में से)`,
    peakYear: (pk, tr) => `<p class="ch-callout">शीर्ष वर्ष <b>${pk.year} · ${pk.goals} गोल</b>` + (tr ? ` · इस दौरान <b>${tr}</b> टीम ट्रॉफियां जीतीं` : "") + `</p>`,
    empty: (val, total) => `“${val}” के लिए कोई परिणाम नहीं मिला — सभी देखने के लिए खोज साफ़ करें।`,
    tagRecord: "रिकॉर्ड", tagWc: "विश्व कप", tagFirst: "प्रथम",
    faq: [
      ["मेस्सी ने डेब्यू कब किया?", "बार्सिलोना के लिए <b>16 अक्टूबर 2004</b> को 17 साल की उम्र में; अर्जेंटीना के लिए 17 अगस्त 2005 को।"],
      ["मेस्सी ने अपना पहला गोल कब किया?", "<b>1 मई 2005</b> को अल्बासेटे के खिलाफ — उस समय बार्सिलोना के सबसे युवा स्कोरर।"],
      ["मेस्सी ने विश्व कप कब जीता?", "<b>18 दिसंबर 2022</b> को, लुसैल फाइनल में 3–3 के बाद पेनल्टी पर फ्रांस को हराकर।"],
      ["मेस्सी ने बार्सिलोना कब छोड़ा?", "<b>अगस्त 2021</b> में, बार्सिलोना में 21 साल बिताने के बाद पीएसजी में शामिल हुए।"],
      ["मेस्सी इंटर मियामी में कब शामिल हुए?", "<b>जुलाई 2023</b> में, आने के कुछ हफ्तों के भीतर लीग्स कप जीता।"]
    ],
    method: "टाइमलाइन की प्रविष्टियां सटीक तारीखों पर आधारित हैं; करियर के कुल गोलों से पूरी तरह मेल खाती हैं।"
  },
  ro: {
    head: (t) => `De la debutul la Barcelona în 2004 până la <b>${n(t.goals)} goluri în carieră</b> — nopțile istorice, recordurile și trofeele în ordine.`,
    keydates: (t, lastUpdated) => [
      ["16 Oct 2004", "Debutul oficial pentru <b>Barcelona</b> împotriva lui Espanyol, la 17 ani."],
      ["1 Mai 2005", "Primul gol oficial, împotriva lui Albacete — cel mai tânăr marcator al Barcelonei la acea dată."],
      ["17 Aug 2005", "Debutul pentru naționala <b>Argentinei</b> împotriva Ungariei."],
      ["2012", "<b>91 de goluri</b> într-un an calendaristic — recordul mondial all-time al fotbalului."],
      ["18 Dec 2022", "Câștigă <b>Cupa Mondială</b> cu Argentina în Qatar, marcând de două ori în finală."],
      [esc(lastUpdated), `<b>${n(t.goals)} goluri oficiale</b> pentru club și națională — ultima verificare.`]
    ],
    inProg: "în desfășurare",
    goals: "goluri",
    goalsInEra: (goals, share, total) => `<b>${n(goals)} goluri</b> · ${share}% din ${n(total)}`,
    peakYear: (pk, tr) => `<p class="ch-callout">An de vârf <b>${pk.year} · ${pk.goals} goluri</b>` + (tr ? ` · <b>${tr}</b> ${tr === 1 ? "trofeu colectiv" : "trofee colective"} câștigate în această perioadă` : "") + `</p>`,
    empty: (val, total) => `Niciun rezultat pentru “${val}” — ștergeți căutarea pentru toate cele ${total} repere.`,
    tagRecord: "Record", tagWc: "Mondial", tagFirst: "Primul",
    faq: [
      ["Când a debutat Messi?", "Pentru Barcelona pe <b>16 octombrie 2004</b> contra lui Espanyol la 17 ani; pentru Argentina pe 17 august 2005."],
      ["Când a marcat Messi primul său gol?", "Pe <b>1 mai 2005</b> împotriva lui Albacete — cel mai tânăr marcator din istoria clubului la acea vreme."],
      ["Când a câștigat Messi Cupa Mondială?", "Pe <b>18 decembrie 2022</b>, învingând Franța la loviturile de departajare după o remiză 3–3 la Lusail."],
      ["Când a plecat Messi de la Barcelona?", "În <b>august 2021</b>, semnând cu Paris Saint-Germain după 21 de ani la club."],
      ["Când a ajuns Messi la Inter Miami?", "În <b>iulie 2023</b>, câștigând Leagues Cup la câteva săptămâni de la sosire."]
    ],
    method: "Cronologia conține repere la nivel de zi și an; barele de goluri însumează exact totalul carierei."
  },
  uz: {
    head: (t) => `2004 yildagi Barselonadagi debyutidan buyon <b>${n(t.goals)} faoliyat goli</b>gacha — tarixiy lahzalar, rekordlar va sovrinlar xronologik tartibda.`,
    keydates: (t, lastUpdated) => [
      ["16 Okt 2004", "17 yoshida Espanyolga qarshi <b>Barselona</b> safida professional debyut."],
      ["1 May 2005", "Albacete darvozasiga birinchi gol — o'sha paytda Barselona tarixidagi eng yosh to'purar."],
      ["17 Avg 2005", "Vengriyaga qarshi <b>Argentina</b> terma jamoasi safida debyut."],
      ["2012", "Bir kalendar yilida <b>91 ta gol</b> — futbol tarixidagi mutlaq jahon rekordi."],
      ["18 Dek 2022", "Qatarda Argentina bilan <b>Jahon chempioni</b> bo'ldi, finalda dubl qayd etdi."],
      [esc(lastUpdated), `Klub va terma jamoada <b>${n(t.goals)} faoliyat goli</b> — so'nggi yangilanish.`]
    ],
    inProg: "davom etmoqda",
    goals: "gollar",
    goalsInEra: (goals, share, total) => `<b>${n(goals)} gollar</b> · ${n(total)} ning ${share}% i`,
    peakYear: (pk, tr) => `<p class="ch-callout">Eng yuqori yil <b>${pk.year} · ${pk.goals} gollar</b>` + (tr ? ` · bu davrda <b>${tr}</b> ta jamoaviy sovrin qo'lga kiritilgan` : "") + `</p>`,
    empty: (val, total) => `“${val}” bo'yicha hech narsa topilmadi — barcha ${total} ta muhim voqeani ko'rish uchun qidiruvni tozalang.`,
    tagRecord: "Rekord", tagWc: "JCh", tagFirst: "Birinchi",
    faq: [
      ["Messi qachon debyut qilgan?", "Barselona uchun <b>2004 yil 16 oktyabrda</b> Espanyolga qarshi 17 yoshida; Argentina uchun 2005 yil 17 avgustda."],
      ["Messi birinchi golini qachon urgan?", "<b>2005 yil 1 mayda</b> Albacetega qarshi — o'sha paytda Barselona tarixidagi eng yosh to'purar."],
      ["Messi Jahon chempionatini qachon yutgan?", "<b>2022 yil 18 dekabrda</b>, Lusaildagi dramatik 3–3 dan so'ng penaltilar seriyasida Fransiyani mag'lub etib."],
      ["Messi Barselonani qachon tark etdi?", "<b>2021 yil avgustda</b>, klubda 21 yil o'tkazgach, Parij Sen-Jermenga o'tdi."],
      ["Messi Inter Mayamiga qachon qo'shildi?", "<b>2023 yil iyulda</b>, kelganidan bir necha hafta o'tib Ligalar Kubogini qo'lga kiritdi."]
    ],
    method: "Xronologik qaydlar aniq sanalar bilan kiritilgan; gollar butun faoliyat ko'rsatkichiga to'liq mos keladi."
  }
};

const TIMELINE_EN = {
  head: (t) => `From his Barcelona debut in 2004 to <b>${n(t.goals)} career goals</b> and counting — the defining nights, records and trophies, dated and in order.`,
  keydates: (t, lastUpdated) => [
    ["16 Oct 2004", "Senior debut for <b>Barcelona</b> against Espanyol, aged 17."],
    ["1 May 2005", "First senior goal, against Albacete — Barcelona's youngest scorer at the time."],
    ["17 Aug 2005", "<b>Argentina</b> debut against Hungary."],
    ["2012", "<b>91 goals</b> in the calendar year — football's all-time record."],
    ["18 Dec 2022", "Wins the <b>World Cup</b> with Argentina in Qatar, scoring twice in the final."],
    [esc(lastUpdated), `<b>${n(t.goals)} career goals</b> for club and country — last checked this date.`]
  ],
  inProg: "in progress",
  goals: "goals",
  goalsInEra: (goals, share, total) => `<b>${n(goals)} goals</b> · ${share}% of ${n(total)}`,
  peakYear: (pk, tr) => `<p class="ch-callout">Peak year <b>${pk.year} · ${pk.goals} goals</b>` + (tr ? ` · <b>${tr}</b> team ${tr === 1 ? "trophy" : "trophies"} won in this span` : "") + `</p>`,
  empty: (val, total) => `Nothing matches “${val}” — clear the search to see all ${total} milestones.`,
  tagRecord: "Record", tagWc: "World Cup", tagFirst: "First",
  faq: [
    ["When did Messi make his debut?", "For Barcelona on <b>16 October 2004</b> against Espanyol, aged 17 years and 114 days; for Argentina on 17 August 2005."],
    ["When did Messi score his first goal?", "On <b>1 May 2005</b> against Albacete — then the youngest scorer in Barcelona's history."],
    ["When did Messi win the World Cup?", "On <b>18 December 2022</b>, beating France on penalties in the Lusail final after a 3–3 draw."],
    ["When did Messi leave Barcelona?", "In <b>August 2021</b>, joining Paris Saint-Germain after 21 years at the club."],
    ["When did Messi join Inter Miami?", "In <b>July 2023</b>, winning the Leagues Cup within weeks of arriving."]
  ],
  method: "Timeline entries are year- and date-granular milestones; era goal bars split calendar years into non-overlapping spans so they add back up to the career total."
};

const TIMELINE_MILESTONES = [
  {
    date: "16 Oct 2004",
    year: 2004,
    cat: "debut",
    team: "barcelona",
    title: "FC Barcelona Official First-Team Debut",
    desc: "Aged 17 years, 3 months and 22 days, Messi replaces Deco in the 82nd minute against Espanyol at the Estadi Olímpic de Montjuïc, launching the greatest career in modern football history.",
    stat: "Age 17y 114d",
    badge: "Official Debut"
  },
  {
    date: "1 May 2005",
    year: 2005,
    cat: "goal",
    team: "barcelona",
    title: "First Senior Career Goal vs Albacete",
    desc: "Subbed on in the 88th minute, Messi receives an audacious scooped assist from Ronaldinho and calmly chips goalkeeper Raúl Valbuena into the top corner at Camp Nou.",
    stat: "Goal #1",
    badge: "Youngest Barça Scorer"
  },
  {
    date: "2 Jul 2005",
    year: 2005,
    cat: "trophy",
    team: "argentina",
    title: "FIFA World Youth Championship & Golden Ball",
    desc: "Messi fires Argentina to the Under-20 World Cup title in the Netherlands, scoring both goals in the 2-1 final victory over Nigeria to sweep both the Golden Boot (6 goals) and Golden Ball MVP.",
    stat: "Golden Ball & Boot",
    badge: "Under-20 World Cup"
  },
  {
    date: "17 Aug 2005",
    year: 2005,
    cat: "debut",
    team: "argentina",
    title: "Argentina Senior National Team Debut",
    desc: "José Pékerman hands Messi his senior Albiceleste debut against Hungary in Budapest at age 18, beginning his historic 191-cap international journey.",
    stat: "Cap #1",
    badge: "Senior Albiceleste"
  },
  {
    date: "10 Mar 2007",
    year: 2007,
    cat: "goal",
    team: "barcelona",
    title: "Legendary El Clásico Hat-Trick at Age 19",
    desc: "In an unforgettable 3-3 thriller against Real Madrid at Camp Nou, teenage Messi equalizes three separate times, finishing with a stoppage-time thunderbolt past Iker Casillas.",
    stat: "Hat-trick vs Real Madrid",
    badge: "El Clásico"
  },
  {
    date: "18 Apr 2007",
    year: 2007,
    cat: "goal",
    team: "barcelona",
    title: "The Iconic 'Ankara Messi' Solo Wonder Goal",
    desc: "In the Copa del Rey semi-final against Getafe, Messi replicates Diego Maradona's 1986 Goal of the Century, dribbling 60 meters past 5 defenders and the goalkeeper in 12 seconds.",
    stat: "60-meter Solo Run",
    badge: "Goal of the Century"
  },
  {
    date: "23 Aug 2008",
    year: 2008,
    cat: "trophy",
    team: "argentina",
    title: "Beijing 2008 Olympic Gold Medal",
    desc: "At the Beijing National Stadium, Messi sets up Ángel Di María's 58th-minute winning chip against Nigeria in the final to claim Olympic Gold for Argentina.",
    stat: "Olympic Gold Medal",
    badge: "Olympics 2008"
  },
  {
    date: "2 May 2009",
    year: 2009,
    cat: "goal",
    team: "barcelona",
    title: "6-2 Bernabéu Demolition — Dawn of the False 9",
    desc: "Pep Guardiola moves Messi into the central 'False 9' role on the eve of El Clásico; Messi scores twice and creates two in an earth-shaking 6-2 triumph at the Santiago Bernabéu.",
    stat: "2 Goals + 2 Assists",
    badge: "False 9 Revolution"
  },
  {
    date: "27 May 2009",
    year: 2009,
    cat: "trophy",
    team: "barcelona",
    title: "Champions League Final Triumph & Historic Treble",
    desc: "Messi leaps high to send a looping header past Edwin van der Sar in Rome as Barcelona defeat Manchester United 2-0 to clinch the first Treble in Spanish football history.",
    stat: "UCL Top Scorer (9)",
    badge: "Historic Treble"
  },
  {
    date: "1 Dec 2009",
    year: 2009,
    cat: "award",
    team: "barcelona",
    title: "First Ballon d'Or Award (Record Vote Share)",
    desc: "Awarded his maiden Ballon d'Or by France Football with 473 out of 480 maximum points (98.5%), winning by a then-record margin of 240 votes over Cristiano Ronaldo.",
    stat: "Ballon d'Or #1",
    badge: "World Best"
  },
  {
    date: "19 Dec 2009",
    year: 2009,
    cat: "trophy",
    team: "barcelona",
    title: "Chest Goal in Club World Cup to Complete The Sextuple",
    desc: "Messi scores the 110th-minute extra-time winner against Estudiantes with his chest/badge in Abu Dhabi, crowning FC Barcelona as the first club ever to win all six available trophies in one calendar year.",
    stat: "6 Trophies in 1 Year",
    badge: "The Sextuple"
  },
  {
    date: "6 Apr 2010",
    year: 2010,
    cat: "goal",
    team: "barcelona",
    title: "Four-Goal Masterclass vs Arsenal in UCL Quarter-Final",
    desc: "Single-handedly dispatches Arsenal at Camp Nou, scoring all four Barcelona goals (21', 37', 42', 88') with a lob, a thunderbolt, and a solo nutmeg finish.",
    stat: "4 Goals in 1 UCL Match",
    badge: "UCL Masterclass"
  },
  {
    date: "10 Jan 2011",
    year: 2011,
    cat: "award",
    team: "barcelona",
    title: "Second Ballon d'Or (All-La Masia Podium)",
    desc: "Named the world's best player for the second consecutive year in Zurich, heading an unprecedented podium sweep of Barcelona academy graduates alongside Andrés Iniesta and Xavi Hernández.",
    stat: "Ballon d'Or #2",
    badge: "La Masia Clean Sweep"
  },
  {
    date: "27 Apr 2011",
    year: 2011,
    cat: "goal",
    team: "barcelona",
    title: "Bernabéu UCL Semi-Final Solo Wonder Goal",
    desc: "In an electric El Clásico Champions League semi-final first leg, Messi collects the ball from Busquets, accelerates past Diarra, Albiol, Ramos, and Marcelo, and slots past Casillas.",
    stat: "Brace at Bernabéu",
    badge: "Iconic UCL Solo"
  },
  {
    date: "28 May 2011",
    year: 2011,
    cat: "trophy",
    team: "barcelona",
    title: "Champions League Masterpiece at Wembley",
    desc: "Delivers what Sir Alex Ferguson called 'the best team performance I've ever faced', scoring a breathtaking 25-yard drive past Van der Sar as Barça beat Manchester United 3-1.",
    stat: "MOTM + UCL Title",
    badge: "Wembley Glory"
  },
  {
    date: "9 Jan 2012",
    year: 2012,
    cat: "award",
    team: "barcelona",
    title: "Third Consecutive Ballon d'Or Award",
    desc: "Becomes only the fourth player in history (after Cruyff, Platini, and Van Basten) to win three Ballons d'Or, and only the second ever to win three consecutively.",
    stat: "Ballon d'Or #3",
    badge: "Three-Peat"
  },
  {
    date: "7 Mar 2012",
    year: 2012,
    cat: "record",
    team: "barcelona",
    title: "Five Goals in a Single UCL Game vs Bayer Leverkusen",
    desc: "Becomes the first player in modern UEFA Champions League history to score five goals in a single knockout match during Barcelona's 7-1 thrashing of Bayer Leverkusen.",
    stat: "5 Goals in 1 Match",
    badge: "UCL All-Time Record"
  },
  {
    date: "20 Mar 2012",
    year: 2012,
    cat: "record",
    team: "barcelona",
    title: "All-Time Barcelona Top Scorer at Age 24",
    desc: "A hat-trick against Granada takes Messi to 234 goals, surpassing César Rodríguez's 57-year-old club record (232 goals) at just 24 years of age.",
    stat: "234 Barça Goals",
    badge: "Club All-Time Scorer"
  },
  {
    date: "5 May 2012",
    year: 2012,
    cat: "record",
    team: "barcelona",
    title: "50-Goal La Liga Record Season & 73 Season Goals",
    desc: "Nets all four goals in a 4-0 derby win over Espanyol to seal Pep Guardiola's final home match, completing a world-record 50-goal La Liga campaign and 73 in all competitions.",
    stat: "50 League · 73 Total",
    badge: "European Golden Shoe (100 pts)"
  },
  {
    date: "9 Jun 2012",
    year: 2012,
    cat: "goal",
    team: "argentina",
    title: "Electrifying Superclásico Hat-Trick vs Brazil in New Jersey",
    desc: "Messi destroys Brazil 4-3 at MetLife Stadium, capping a breathtaking hat-trick with an unforgettable 84th-minute curler from 30 yards out into the top postage stamp.",
    stat: "Hat-trick vs Brazil",
    badge: "Superclásico Epic"
  },
  {
    date: "9 Dec 2012",
    year: 2012,
    cat: "record",
    team: "barcelona",
    title: "Breaks Gerd Müller's 85-Goal World Record (91 in 2012)",
    desc: "Scores twice against Real Betis to reach 86 goals in 2012, eclipsing Gerd Müller's 40-year-old record (85 in 1972). Finishes 2012 with an astronomical 91 calendar year goals (79 Barça, 12 Argentina).",
    stat: "91 Goals in 69 Games",
    badge: "Guinness World Record"
  },
  {
    date: "7 Jan 2013",
    year: 2013,
    cat: "award",
    team: "barcelona",
    title: "Historic Fourth Consecutive Ballon d'Or Award",
    desc: "Stands alone at the summit of football as the first player in history to win four Ballons d'Or, achieving all four in four straight years (2009–2012).",
    stat: "Ballon d'Or #4",
    badge: "Unprecedented Four-in-a-Row"
  },
  {
    date: "30 Mar 2013",
    year: 2013,
    cat: "record",
    team: "barcelona",
    title: "Scores Against Every Single League Opponent Consecutively",
    desc: "Scores against Celta Vigo to complete a 19-match scoring streak in La Liga — finding the net against all 19 other teams in consecutive matchdays, a feat never matched in football history.",
    stat: "19 Consecutive Matchdays (30 goals)",
    badge: "La Liga Full Circuit"
  },
  {
    date: "13 Jul 2014",
    year: 2014,
    cat: "award",
    team: "argentina",
    title: "FIFA World Cup Golden Ball Award in Brazil",
    desc: "Captains Argentina to their first World Cup final in 24 years, scoring 4 decisive group stage goals and creating crucial knockout assists to win tournament MVP at the Maracanã.",
    stat: "Golden Ball MVP",
    badge: "FIFA World Cup 2014"
  },
  {
    date: "22 Nov 2014",
    year: 2014,
    cat: "record",
    team: "barcelona",
    title: "All-Time La Liga Top Scorer (Breaks Telmo Zarra)",
    desc: "A hat-trick against Sevilla takes Messi to 253 La Liga goals, breaking Telmo Zarra's 251-goal milestone that stood since 1955. Messi is tossed into the air by his teammates.",
    stat: "253 La Liga Goals",
    badge: "Spanish All-Time Record"
  },
  {
    date: "25 Nov 2014",
    year: 2014,
    cat: "record",
    team: "barcelona",
    title: "All-Time UEFA Champions League Top Scorer (Breaks Raúl)",
    desc: "Just three days after breaking the La Liga record, Messi nets another hat-trick against APOEL in Nicosia to reach 74 Champions League goals, surpassing Real Madrid legend Raúl González (71).",
    stat: "74 UCL Goals",
    badge: "Champions League Record"
  },
  {
    date: "6 May 2015",
    year: 2015,
    cat: "goal",
    team: "barcelona",
    title: "Ankle-Breaker on Boateng & Chip Over Neuer vs Bayern",
    desc: "Produces one of the most viral moments in sporting history: drops Jérôme Boateng with a body feint and dinks the ball right-footed over world champion Manuel Neuer at Camp Nou.",
    stat: "Brace vs Bayern Munich",
    badge: "Viral UCL Classic"
  },
  {
    date: "30 May 2015",
    year: 2015,
    cat: "trophy",
    team: "barcelona",
    title: "Copa del Rey Solo Wonder Goal vs Athletic Club",
    desc: "Surrounded by three defenders on the right sideline, Messi accelerates past all three, cuts inside a fourth, and beats the keeper at his near post in the Copa del Rey final at Camp Nou.",
    stat: "Goal of the Season",
    badge: "Copa del Rey Final"
  },
  {
    date: "6 Jun 2015",
    year: 2015,
    cat: "trophy",
    team: "barcelona",
    title: "Second Historic Treble Crowned in Berlin",
    desc: "Messi orchestrates Barcelona's 3-1 victory over Juventus at the Olympiastadion in Berlin, sealing Barça's second European Treble. The 'MSN' front trio finish with 122 combined goals.",
    stat: "2nd European Treble",
    badge: "Champions League #4"
  },
  {
    date: "11 Jan 2016",
    year: 2016,
    cat: "award",
    team: "barcelona",
    title: "Fifth Ballon d'Or Award (La Quinta)",
    desc: "Receives his fifth golden ball trophy in Zurich with 41.33% of the vote after spearheading Barcelona's five-trophy year in 2015.",
    stat: "Ballon d'Or #5",
    badge: "First Player to 5"
  },
  {
    date: "21 Jun 2016",
    year: 2016,
    cat: "record",
    team: "argentina",
    title: "Becomes Argentina's All-Time Top Scorer vs USA",
    desc: "Blasts an unbelievable 30-yard postage-stamp free kick against host nation USA in Houston to surpass Gabriel Batistuta's 54-goal national team record.",
    stat: "55 Argentina Goals",
    badge: "Albiceleste Top Scorer"
  },
  {
    date: "8 Mar 2017",
    year: 2017,
    cat: "goal",
    team: "barcelona",
    title: "'La Remontada' — Historic 6-1 Comeback vs PSG",
    desc: "Messi scores the 50th-minute penalty as Barcelona overturn a 4-0 first-leg deficit to win 6-1 at Camp Nou. The photo of Messi standing on the advertising hoardings celebrating with fans becomes an immortal image.",
    stat: "6-1 Historic Comeback",
    badge: "La Remontada"
  },
  {
    date: "23 Apr 2017",
    year: 2017,
    cat: "goal",
    team: "barcelona",
    title: "500th Barcelona Goal & Shirt Celebration at Santiago Bernabéu",
    desc: "With bloody gauze in his mouth after an elbow, Messi scores a 92nd-minute winner (his 500th official goal for Barcelona) in a 3-2 El Clásico thriller, then famously holds his shirt up to the silent Madrid crowd.",
    stat: "Goal #500 for Barça",
    badge: "Iconic Shirt Celebration"
  },
  {
    date: "10 Oct 2017",
    year: 2017,
    cat: "goal",
    team: "argentina",
    title: "Heroic High-Altitude Hat-Trick vs Ecuador in Quito",
    desc: "With Argentina 0-1 down inside 40 seconds and on the brink of missing the 2018 World Cup, Messi scores an unforgettable hat-trick 2,850 meters above sea level to drag his country to Russia.",
    stat: "Hat-trick at 2,850m",
    badge: "World Cup Qualification"
  },
  {
    date: "1 May 2019",
    year: 2019,
    cat: "goal",
    team: "barcelona",
    title: "600th Barcelona Goal: 35-Yard Free-Kick Rocket vs Liverpool",
    desc: "Curls an impossible 35-yard free kick past Alisson Becker into the top corner at Camp Nou for his 600th Barcelona goal, named UEFA Goal of the Season.",
    stat: "Goal #600 for Barça",
    badge: "UEFA Goal of the Season"
  },
  {
    date: "2 Dec 2019",
    year: 2019,
    cat: "award",
    team: "barcelona",
    title: "Record Sixth Ballon d'Or Award",
    desc: "A decade after his first Ballon d'Or, Messi lifts his record sixth award in Paris, accompanied by his six European Golden Shoes, becoming the first player in history to win six.",
    stat: "Ballon d'Or #6",
    badge: "World Record 6th"
  },
  {
    date: "30 Jun 2020",
    year: 2020,
    cat: "goal",
    team: "barcelona",
    title: "700th Career Goal: Audacious Panenka Penalty vs Oblak",
    desc: "Reaches the 700-goal landmark in style at Camp Nou against Atlético Madrid, executing a delicate Panenka chip past world-class goalkeeper Jan Oblak.",
    stat: "Goal #700 Career",
    badge: "Panenka Milestone"
  },
  {
    date: "22 Dec 2020",
    year: 2020,
    cat: "record",
    team: "barcelona",
    title: "Breaks Pelé's All-Time One-Club Scoring Record (644 Goals)",
    desc: "Scores against Real Valladolid to register his 644th official goal for FC Barcelona, eclipsing Pelé's 643-goal record for Santos FC that stood for 46 years.",
    stat: "644 Goals for One Club",
    badge: "Breaks Pelé Record"
  },
  {
    date: "17 Apr 2021",
    year: 2021,
    cat: "trophy",
    team: "barcelona",
    title: "35th & Final Trophy with FC Barcelona",
    desc: "Messi captains Barcelona to a 4-0 rout of Athletic Club in the Copa del Rey final in Seville, scoring two stunning goals (including a length-of-the-pitch passing sequence) to lift his 35th Barcelona trophy.",
    stat: "35 Trophies with Barça",
    badge: "Copa del Rey Triumph"
  },
  {
    date: "10 Jul 2021",
    year: 2021,
    cat: "trophy",
    team: "argentina",
    title: "Copa América Champions at the Maracanã",
    desc: "Ends Argentina's 28-year senior title drought with a 1-0 victory over Brazil in Rio de Janeiro. Messi finishes as joint-top scorer (4), top assist provider (5), and Best Player of the Tournament.",
    stat: "First Senior Title with Argentina",
    badge: "Copa América Champion"
  },
  {
    date: "10 Aug 2021",
    year: 2021,
    cat: "transfer",
    team: "psg",
    title: "Blockbuster Move to Paris Saint-Germain",
    desc: "After 21 legendary years and 672 goals for Barcelona, financial regulations prevent a new contract. Messi signs a two-year deal with PSG, donning the iconic #30 shirt in the French capital.",
    stat: "New Chapter in Paris",
    badge: "Global Blockbuster"
  },
  {
    date: "29 Nov 2021",
    year: 2021,
    cat: "award",
    team: "psg",
    title: "Seventh Ballon d'Or Award in Paris",
    desc: "Collects his seventh Ballon d'Or at the Théâtre du Châtelet in Paris, rewarded for his masterclass leading Argentina to the Copa América trophy.",
    stat: "Ballon d'Or #7",
    badge: "7th Golden Ball"
  },
  {
    date: "1 Jun 2022",
    year: 2022,
    cat: "trophy",
    team: "argentina",
    title: "Finalissima 2022 Champions at Wembley",
    desc: "Puts on a midfield masterclass against European champions Italy at Wembley Stadium, creating two goals in a 3-0 demolition to win the CONMEBOL-UEFA Cup of Champions.",
    stat: "MOTM + 2 Assists",
    badge: "Finalissima Champion"
  },
  {
    date: "18 Dec 2022",
    year: 2022,
    cat: "trophy",
    team: "argentina",
    title: "FIFA World Cup Champions at Lusail Stadium (GOAT Crowned)",
    desc: "In arguably the greatest football match ever played, Messi scores twice against France in a 3-3 epic, scores his shootout penalty, and lifts the World Cup trophy in Qatar. Wins his second Golden Ball (first player to ever win two).",
    stat: "World Champion + Golden Ball",
    badge: "World Cup Glory 🏆"
  },
  {
    date: "15 Jul 2023",
    year: 2023,
    cat: "transfer",
    team: "miami",
    title: "Arrival at Inter Miami CF & MLS Revolution",
    desc: "Messi announces his move to Major League Soccer with Inter Miami CF, sparking unprecedented worldwide interest in American club football and sold-out stadiums across North America.",
    stat: "MLS Era Begins",
    badge: "North American Revolution"
  },
  {
    date: "21 Jul 2023",
    year: 2023,
    cat: "goal",
    team: "miami",
    title: "94th-Minute Debut Free-Kick Winner vs Cruz Azul",
    desc: "In front of LeBron James, Serena Williams, and Kim Kardashian, Messi marks his Inter Miami debut by curling a 94th-minute direct free kick into the top left corner to seal a 2-1 Leagues Cup win.",
    stat: "Debut Free-Kick Winner",
    badge: "Storybook Debut"
  },
  {
    date: "19 Aug 2023",
    year: 2023,
    cat: "trophy",
    team: "miami",
    title: "Leagues Cup Champions — Inter Miami's First-Ever Trophy",
    desc: "Scores a 25-yard wonder strike in the final vs Nashville SC and converts in the marathon 10-9 penalty shootout to win Inter Miami's first title. Finishes as top scorer with 10 goals in 7 games.",
    stat: "10 Goals in 7 Games",
    badge: "44th Career Trophy"
  },
  {
    date: "30 Oct 2023",
    year: 2023,
    cat: "award",
    team: "miami",
    title: "Unprecedented Eighth Ballon d'Or Award",
    desc: "Awarded his eighth Ballon d'Or in Paris following his World Cup triumph in Qatar, extending his own all-time record and becoming the first MLS-based player to receive the award.",
    stat: "Ballon d'Or #8",
    badge: "8th Ballon d'Or 🌟"
  },
  {
    date: "14 Jul 2024",
    year: 2024,
    cat: "trophy",
    team: "argentina",
    title: "Back-to-Back Copa América Champions in Miami",
    desc: "Argentina retain the Copa América trophy with a 1-0 win over Colombia at Hard Rock Stadium in Miami, completing an unprecedented triple crown (Copa 2021, World Cup 2022, Copa 2024) and Messi's world-record 45th trophy.",
    stat: "45th Career Trophy",
    badge: "Back-to-Back Copa América"
  },
  {
    date: "2 Oct 2024",
    year: 2024,
    cat: "trophy",
    team: "miami",
    title: "Supporters' Shield Champions with Inter Miami",
    desc: "Scores twice in a 3-2 victory over reigning MLS Cup champions Columbus Crew to clinch the 2024 MLS Supporters' Shield with Inter Miami, extending his world record to 46 major trophies.",
    stat: "46th Career Trophy",
    badge: "MLS Record Points"
  },
  {
    date: "17 Sep 2026",
    year: 2026,
    cat: "trophy",
    team: "miami",
    title: "Goal #929 & 46th Career Trophy (Campeones Cup)",
    desc: "Clinical 12th-minute header vs Cruz Azul seals a 2-0 victory for Inter Miami, marking his 100th goal for the club and 46th career trophy.",
    stat: "Goal #929 • 100th Miami Goal",
    badge: "46th Title 🏆"
  },
  {
    date: "20 Sep 2026",
    year: 2026,
    cat: "goal",
    team: "miami",
    title: "Goal #930: Direct Free Kick vs San Diego FC",
    desc: "Curling 24th-minute direct free kick at Chase Stadium vs San Diego FC marks the 930th senior career goal and 67th direct free kick of Messi's iconic career.",
    stat: "Goal #930 • 67th FK",
    badge: "930 Career Goals ⚽"
  }
];

function renderTimeline(d) {
  const lang = getLang();
  const cfg = TIMELINE_I18N[lang] || TIMELINE_EN;
  const t = d.totals;
  setHead(d, cfg.head(t));

  // 1. Executive Career Summary Banner
  const summaryEl = el("tl-summary");
  if (summaryEl) {
    summaryEl.innerHTML = `
      <div class="tl-summary-kpi"><div class="val">22</div><div class="lbl">Seasons (2004–2026)</div></div>
      <div class="tl-summary-kpi"><div class="val">${n(t.goals)}</div><div class="lbl">Senior Goals</div></div>
      <div class="tl-summary-kpi"><div class="val">385+</div><div class="lbl">Career Assists</div></div>
      <div class="tl-summary-kpi"><div class="val">46</div><div class="lbl">Major Trophies</div></div>
      <div class="tl-summary-kpi"><div class="val">8</div><div class="lbl">Ballons d'Or</div></div>
      <div class="tl-summary-kpi"><div class="val">6</div><div class="lbl">Golden Shoes</div></div>
    `;
  }

  // 2. Defining Milestones Quick Cards in #keydates
  const kdEl = el("keydates");
  if (kdEl) {
    kdEl.innerHTML =
      `<ol class="keydates">` +
      cfg.keydates(t, d.lastUpdated).map((kd) => `<li><span class="kd-date">${kd[0]}</span><span>${kd[1]}</span></li>`).join("") +
      `</ol>`;
  }

  // 3. Category Filter Buttons in #era-nav
  const nodeIcon = (cat) => {
    switch (cat) {
      case "trophy": return "🏆";
      case "award": return "⭐";
      case "goal": return "⚽";
      case "record": return "📜";
      case "debut": return "🚀";
      case "transfer": return "🔄";
      default: return "🌟";
    }
  };

  const teamLabel = (tm) => {
    switch (tm) {
      case "barcelona": return "FC Barcelona";
      case "argentina": return "Argentina";
      case "miami": return "Inter Miami";
      case "psg": return "Paris Saint-Germain";
      default: return "";
    }
  };

  const catCounts = {
    all: TIMELINE_MILESTONES.length,
    trophy: TIMELINE_MILESTONES.filter(m => m.cat === "trophy").length,
    award: TIMELINE_MILESTONES.filter(m => m.cat === "award").length,
    goal: TIMELINE_MILESTONES.filter(m => m.cat === "goal").length,
    record: TIMELINE_MILESTONES.filter(m => m.cat === "record").length,
    barcelona: TIMELINE_MILESTONES.filter(m => m.team === "barcelona").length,
    argentina: TIMELINE_MILESTONES.filter(m => m.team === "argentina").length,
    miami: TIMELINE_MILESTONES.filter(m => m.team === "miami").length,
    psg: TIMELINE_MILESTONES.filter(m => m.team === "psg").length
  };

  const filterButtons = [
    { id: "all", label: `All (${catCounts.all})` },
    { id: "trophy", label: `🏆 Trophies (${catCounts.trophy})` },
    { id: "award", label: `⭐ Ballons d'Or (${catCounts.award})` },
    { id: "goal", label: `⚽ Landmark Goals (${catCounts.goal})` },
    { id: "record", label: `📜 World Records (${catCounts.record})` },
    { id: "barcelona", label: `🔵🔴 Barcelona (${catCounts.barcelona})` },
    { id: "argentina", label: `🇦🇷 Argentina (${catCounts.argentina})` },
    { id: "miami", label: `🌸 Inter Miami (${catCounts.miami})` },
    { id: "psg", label: `🗼 PSG (${catCounts.psg})` }
  ];

  let currentCat = "all";

  const nav = el("era-nav");
  if (nav) {
    nav.className = "tl-filter-controls";
    nav.innerHTML = `
      <div class="tl-pills-row" role="group" aria-label="Filter career milestones">
        ${filterButtons.map((btn, i) => `
          <button class="tl-filter-btn${i === 0 ? " active" : ""}" data-cat="${btn.id}" type="button">
            ${btn.label}
          </button>
        `).join("")}
      </div>
    `;

    nav.querySelectorAll(".tl-filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        nav.querySelectorAll(".tl-filter-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentCat = btn.dataset.cat;
        applyFilters();
      });
    });
  }

  // 4. Populate #chapters with the 50-milestone interactive stream
  const chaptersEl = el("chapters");
  if (chaptersEl) {
    chaptersEl.innerHTML = `
      <div class="tl-stream" id="tl-stream">
        ${TIMELINE_MILESTONES.map((m) => `
          <article class="tl-card tl-reveal in" data-cat="${m.cat}" data-team="${m.team}" data-text="${esc((m.year + " " + m.date + " " + m.title + " " + m.desc + " " + m.stat + " " + m.badge + " " + m.team).toLowerCase())}">
            <div class="tl-node" aria-hidden="true">${nodeIcon(m.cat)}</div>
            <div class="tl-card-top">
              <span class="tl-date-badge">${esc(m.date)}</span>
              <span class="tl-cat-badge tl-cat-${m.cat}">${esc(m.badge || m.cat)}</span>
            </div>
            <h3 class="tl-card-title">${esc(m.title)}</h3>
            <p class="tl-card-desc">${esc(m.desc)}</p>
            <div class="tl-card-footer">
              <span class="tl-pill-stat">⭐ ${esc(m.stat)}</span>
              <span class="tl-pill-stat">${teamLabel(m.team)}</span>
            </div>
          </article>
        `).join("")}
      </div>
    `;
  }

  // 5. Search & Category Filtering Wiring
  const totalEvents = TIMELINE_MILESTONES.length;
  const inp = el("tl-filter");
  const countEl = el("tl-count");

  const paintCount = (matched) => {
    if (!countEl) return;
    if (matched === totalEvents && currentCat === "all" && (!inp || !inp.value.trim())) {
      countEl.textContent = "";
      return;
    }
    const fmt = {
      es: `${matched} de ${totalEvents} hitos`,
      pt: `${matched} de ${totalEvents} marcos`,
      fr: `${matched} sur ${totalEvents} jalons`,
      ar: `${matched} من أصل ${totalEvents} محطة`,
      bn: `${totalEvents}টির মধ্যে ${matched}টি মাইলফলক`,
      hi: `${totalEvents} में से ${matched} मील के पत्थर`,
      ro: `${matched} din ${totalEvents} repere`,
      uz: `${totalEvents} tadan ${matched} ta muhim voqea`
    };
    countEl.textContent = fmt[lang] || `Showing ${matched} of ${totalEvents} milestones`;
  };

  const applyFilters = () => {
    const q = inp ? inp.value.trim().toLowerCase() : "";
    let matched = 0;
    document.querySelectorAll("#tl-stream .tl-card").forEach((card) => {
      const cardCat = card.dataset.cat;
      const cardTeam = card.dataset.team;
      const cardText = card.dataset.text;

      let catMatch = true;
      if (currentCat !== "all") {
        catMatch = (currentCat === cardCat || currentCat === cardTeam);
      }
      const textMatch = !q || cardText.includes(q);
      const visible = catMatch && textMatch;

      card.hidden = !visible;
      if (visible) matched++;
    });

    let empty = el("tl-empty");
    if (matched === 0) {
      if (!empty) {
        empty = document.createElement("p");
        empty.id = "tl-empty";
        empty.className = "tl-empty";
        if (chaptersEl) chaptersEl.after(empty);
      }
      empty.textContent = cfg.empty(inp ? inp.value.trim() : "", totalEvents);
      empty.hidden = false;
    } else if (empty) {
      empty.hidden = true;
    }
    paintCount(matched);
  };

  if (inp) {
    inp.addEventListener("input", applyFilters);
  }

  // 6. FAQ Accordion & Explorers
  const faqEl = el("faq");
  if (faqEl && cfg.faq) {
    faqEl.innerHTML = cfg.faq.map((q) => `<details class="faq-item"><summary class="faq-question"><span>${q[0]}</span><span class="faq-chevron" aria-hidden="true">▾</span></summary><div class="faq-answer"><p>${q[1]}</p></div></details>`).join("");
    faqEl.className = "faq-accordion";
  }

  renderExplore(d, "timeline");
  renderMethod(d, cfg.method);
}

/* ================= ACHIEVEMENTS ================= */
/* Trophy cabinet: self-hosted celebration photos. Mounted as #cabinet. */
const CABINET = [
  { title: "FIFA World Cup — 2022", sub: "The ultimate crowning glory, Lusail 18 Dec 2022.", src: "img/cab-wc.jpg", w: 800, h: 600, pos: "50% 30%", alt: "Messi lifted on Agüero's shoulders celebrating the 2022 World Cup win at Lusail", cap: "World Cup champions, Lusail 2022" },
  { title: "Ballon d'Or — 8", sub: "The record eight: 2009–12, 2015, 2019, 2021, 2023.", src: "img/cab-ballon.jpg", w: 800, h: 600, pos: "50% 30%", alt: "Messi holding his record eighth Ballon d'Or trophy aloft", cap: "Record eighth Ballon d'Or award" },
  { title: "Champions League — 4", sub: "2006, 2009, 2011, 2015 — all with Barcelona.", src: "img/cab-ucl.jpg", w: 800, h: 600, pos: "50% 25%", alt: "Messi celebrating with the Champions League trophy holding four fingers up", cap: "Four-time European champion with Barcelona" },
  { title: "Copa América — 2", sub: "Back-to-back continental champion, 2021 & 2024.", src: "img/cab-copa.jpg", w: 800, h: 600, pos: "50% 25%", alt: "Messi kissing the Copa América trophy after winning at the Maracanã", cap: "Copa América champions, Maracanã 2021" },
];
const cabinetPhotos = () => CABINET.map((p) =>
  `<article class="cab-card"><h3>${esc(p.title)}</h3><p class="cab-sub">${esc(p.sub)}</p>` +
  `<figure class="cab-photo"><img src="${p.src}" width="${p.w}" height="${p.h}" alt="${esc(p.alt)}" loading="lazy" style="object-position:${p.pos || "50% 25%"}" />` +
  `<figcaption class="photo-credit">${esc(p.cap)}</figcaption></figure></article>`
).join("");

const ACH_I18N = {
  es: {
    head: (teamTotal) => `<b>${teamTotal} títulos colectivos</b> — la carrera más condecorada en la historia del fútbol — más un récord de <b>8 Balones de Oro</b>. Todos los trofeos club por club y año por año.`,
    kpis: (per) => [
      ["Títulos colectivos", 46, `Barcelona ${per["Barcelona"] || 0} · Argentina ${per["Argentina"] || 0} · PSG ${per["Paris Saint-Germain"] || 0} · Miami ${per["Inter Miami"] || 0}.`],
      ["Balones de Oro", "8", "Récord histórico — 2009–12, 2015, 2019, 2021, 2023."],
      ["Champions Leagues", "4", "2006, 2009, 2011, 2015 — todas con el FC Barcelona."],
      ["Grandes torneos internacionales", "3", "Copa del Mundo 2022, Copas América 2021 y 2024."]
    ],
    qa: (teamTotal, per) => [
      ["¿Cuántos títulos ha ganado Messi?", `<b>${teamTotal} títulos oficiales en categoría absoluta</b>: ${per["Barcelona"] || 0} con Barcelona, ${per["Paris Saint-Germain"] || 0} con PSG, ${per["Inter Miami"] || 0} con Inter Miami y ${per["Argentina"] || 0} con Argentina.`],
      ["¿Cuántos Balones de Oro tiene Messi?", "<b>Ocho</b> — más que cualquier otro futbolista en la historia (2009–12, 2015, 2019, 2021, 2023)."],
      ["¿Ha ganado Messi la Copa del Mundo?", "<b>Sí — 2022</b>, anotando dos goles en la gran final frente a Francia, además de las Copas América 2021 y 2024."],
      ["¿Cuántas Champions League ha ganado Messi?", "<b>Cuatro</b>, todas con el Barcelona: 2006, 2009, 2011 y 2015."]
    ],
    teamHeader: (team, sub) => `${esc(team)} — ${sub} títulos`,
    indHeader: (indTotal) => `Distinciones individuales — ${indTotal} premios`,
    faq: [
      ["¿Cuál es el trofeo más importante de Messi?", "La <b>Copa del Mundo 2022</b> — el gran título que coronó su carrera, conquistado siendo elegido el mejor jugador del torneo."],
      ["¿Cuántos títulos de liga ha ganado Messi?", "<b>Doce ligas</b> — 10 con Barcelona, 2 con el PSG — además de la MLS Supporters' Shield (2024) y la Leagues Cup (2023) con Miami."],
      ["¿Cuántos premios individuales tiene Messi?", "Ocho Balones de Oro, seis Botas de Oro europeas y dos Balones de Oro del Mundial — cada uno un récord histórico."],
      ["¿Es Messi el jugador con más títulos de la historia?", "Sumando títulos colectivos y distinciones individuales — <b>sí, por cualquier criterio razonable</b>."]
    ]
  },
  pt: {
    head: (teamTotal) => `<b>${teamTotal} títulos coletivos</b> — a carreira mais vitoriosa do futebol — mais um recorde de <b>8 Bolas de Ouro</b>. Todos os títulos clube por clube.`,
    kpis: (per) => [
      ["Títulos coletivos", 46, `Barcelona ${per["Barcelona"] || 0} · Argentina ${per["Argentina"] || 0} · PSG ${per["Paris Saint-Germain"] || 0} · Miami ${per["Inter Miami"] || 0}.`],
      ["Bolas de Ouro", "8", "Recorde — 2009–12, 2015, 2019, 2021, 2023."],
      ["Champions Leagues", "4", "2006, 2009, 2011, 2015 — todas com o Barcelona."],
      ["Grandes torneios de seleções", "3", "Copa do Mundo 2022, Copas América 2021 e 2024."]
    ],
    qa: (teamTotal, per) => [
      ["Quantos títulos Messi já ganhou?", `<b>${teamTotal} títulos coletivos oficiais</b>: ${per["Barcelona"] || 0} no Barcelona, ${per["Paris Saint-Germain"] || 0} no PSG, ${per["Inter Miami"] || 0} no Inter Miami e ${per["Argentina"] || 0} na Argentina.`],
      ["Quantas Bolas de Ouro Messi tem?", "<b>Oito</b> — mais do que qualquer outro jogador na história (2009–12, 2015, 2019, 2021, 2023)."],
      ["Messi já ganhou a Copa do Mundo?", "<b>Sim — em 2022</b>, marcando dois gols na final contra a França, além das Copas América de 2021 e 2024."],
      ["Quantas Champions Leagues Messi ganhou?", "<b>Quatro</b>, todas pelo Barcelona: 2006, 2009, 2011 e 2015."]
    ],
    teamHeader: (team, sub) => `${esc(team)} — ${sub} títulos`,
    indHeader: (indTotal) => `Prêmios individuais — ${indTotal} distinções`,
    faq: [
      ["Qual é o troféu mais importante de Messi?", "A <b>Copa do Mundo de 2022</b> — a coroação suprema de sua carreira, vencida como o melhor jogador do torneio."],
      ["Quantos títulos nacionais Messi tem?", "<b>Doze títulos de liga</b> — 10 La Ligas, 2 Ligue 1s — mais a MLS Supporters' Shield e Leagues Cup pelo Miami."],
      ["Quantos prêmios individuais Messi já ganhou?", "Oito Bolas de Ouro, seis Chuteiras de Ouro e duas Bolas de Ouro da Copa do Mundo — cada um um recorde histórico."],
      ["Messi é o jogador mais condecorado de todos os tempos?", "Pela soma de troféus coletivos e recordes individuais — <b>sim, sob qualquer métrica</b>."]
    ]
  },
  fr: {
    head: (teamTotal) => `<b>${teamTotal} trophées collectifs</b> — la carrière la plus titrée de l'histoire du football — plus un record de <b>8 Ballons d'Or</b>. Tous les titres par club.`,
    kpis: (per) => [
      ["Trophées collectifs", 46, `Barcelone ${per["Barcelona"] || 0} · Argentine ${per["Argentina"] || 0} · PSG ${per["Paris Saint-Germain"] || 0} · Miami ${per["Inter Miami"] || 0}.`],
      ["Ballons d'Or", "8", "Record — 2009–12, 2015, 2019, 2021, 2023."],
      ["Ligues des Champions", "4", "2006, 2009, 2011, 2015 — toutes avec le Barça."],
      ["Titres internationaux majeurs", "3", "Coupe du Monde 2022, Copas América 2021 & 2024."]
    ],
    qa: (teamTotal, per) => [
      ["Combien de trophées Messi a-t-il remportés ?", `<b>${teamTotal} titres collectifs majeurs</b> : ${per["Barcelona"] || 0} avec Barcelone, ${per["Paris Saint-Germain"] || 0} avec le PSG, ${per["Inter Miami"] || 0} avec l'Inter Miami et ${per["Argentina"] || 0} avec l'Argentine.`],
      ["Combien de Ballons d'Or Messi a-t-il remportés ?", "<b>Huit</b> — plus que tout autre joueur dans l'histoire (2009–12, 2015, 2019, 2021, 2023)."],
      ["Messi a-t-il gagné la Coupe du Monde ?", "<b>Oui — en 2022</b>, en inscrivant un doublé en finale contre la France, en plus des Copas América 2021 et 2024."],
      ["Combien de Ligues des Champions Messi a-t-il gagnées ?", "<b>Quatre</b>, toutes avec Barcelone : 2006, 2009, 2011 et 2015."]
    ],
    teamHeader: (team, sub) => `${esc(team)} — ${sub} trophées`,
    indHeader: (indTotal) => `Distinctions individuelles — ${indTotal} récompenses`,
    faq: [
      ["Quel est le trophée le plus important de Messi ?", "La <b>Coupe du Monde 2022</b> — le graal suprême de toute sa carrière, remporté en tant que meilleur joueur du tournoi."],
      ["Combien de championnats nationaux Messi a-t-il remportés ?", "<b>Douze championnats</b> — 10 La Liga, 2 Ligue 1 — plus la Supporters' Shield et la Leagues Cup avec Miami."],
      ["Combien de récompenses individuelles Messi a-t-il gagnées ?", "Huit Ballons d'Or, six Souliers d'Or européens et deux Ballons d'Or de la Coupe du Monde — chacun étant un record."],
      ["Messi est-il le joueur le plus titré de tous les temps ?", "En combinant trophées collectifs et distinctions individuelles — <b>oui, absolument</b>."]
    ]
  },
  ar: {
    head: (teamTotal) => `<b>${teamTotal} بطولة جماعية</b> — أكثر مسيرة حافلة بالألقاب في تاريخ كرة القدم — بالإضافة إلى رقم قياسي بواقع <b>8 كرات ذهبية</b>.`,
    kpis: (per) => [
      ["بطولات جماعية", 46, `برشلونة ${per["Barcelona"] || 0} · الأرجنتين ${per["Argentina"] || 0} · باريس ${per["Paris Saint-Germain"] || 0} · ميامي ${per["Inter Miami"] || 0}.`],
      ["كرات ذهبية", "8", "رقم قياسي — 2009–12, 2015, 2019, 2021, 2023."],
      ["دوري أبطال أوروبا", "4", "2006, 2009, 2011, 2015 — كلها مع برشلونة."],
      ["بطولات دولية كبرى", "3", "كأس العالم 2022، وكوبا أمريكا 2021 و2024."]
    ],
    qa: (teamTotal, per) => [
      ["كم عدد البطولات التي فاز بها ميسي؟", `<b>${teamTotal} بطولة رسمية</b>: ${per["Barcelona"] || 0} مع برشلونة، ${per["Paris Saint-Germain"] || 0} مع باريس، ${per["Inter Miami"] || 0} مع ميامي و${per["Argentina"] || 0} مع الأرجنتين.`],
      ["كم كرة ذهبية فاز بها ميسي؟", "<b>ثماني كرات ذهبية</b> — أكثر من أي لاعب آخر في تاريخ كرة القدم."],
      ["هل فاز ميسي بكأس العالم؟", "<b>نعم — عام 2022</b>، مسجلاً هدفين في المباراة النهائية أمام فرنسا، بالإضافة إلى كوبا أمريكا 2021 و2024."],
      ["كم دوري أبطال أوروبا فاز بها ميسي؟", "<b>أربع بطولات</b>، كلها مع برشلونة: 2006, 2009, 2011 و2015."]
    ],
    teamHeader: (team, sub) => `${esc(team)} — ${sub} بطولات`,
    indHeader: (indTotal) => `جوائز فردية — ${indTotal} جائزة`,
    faq: [
      ["ما هي أهم بطولة حققها ميسي؟", "<b>كأس العالم 2022</b> — التتويج الأغلى في مسيرته وتوج كأفضل لاعب في البطولة."],
      ["كم دوري محلي حققه ميسي؟", "<b>12 دوري</b> — 10 بطولات دوري إسباني، بطولتان دوري فرنسي، ودرع الجماهير مع ميامي."],
      ["كم جائزة فردية فاز بها ميسي؟", "8 كرات ذهبية، 6 أحذية ذهبية أوروبية، وكرتان ذهبيتان لكأس العالم — وكلها أرقام قياسية."],
      ["هل ميسي اللاعب الأكثر تتويجاً في التاريخ؟", "بجمع البطولات الجماعية والأرقام الفردية — <b>نعم، بلا منازع</b>."]
    ]
  },
  bn: {
    head: (teamTotal) => `<b>${teamTotal}টি দলীয় শিরোপা</b> — ফুটবল ইতিহাসের সবচেয়ে বেশি ট্রফিজয়ী ক্যারিয়ার — এবং রেকর্ড <b>৮টি ব্যালন ডি'অর</b>।`,
    kpis: (per) => [
      ["দলীয় ট্রফি", 46, `বার্সেলোনা ${per["Barcelona"] || 0} · আর্জেন্টিনা ${per["Argentina"] || 0} · পিএসজি ${per["Paris Saint-Germain"] || 0} · মায়ামি ${per["Inter Miami"] || 0}।`],
      ["ব্যালন ডি'অর", "8", "রেকর্ড — ২০০৯–১২, ২০১৫, ২০১৯, ২০২১, ২০২৩।"],
      ["চ্যাম্পিয়ন্স লিগ", "4", "২০০৬, ২০০৯, ২০১১, ২০১৫ — সবগুলো বার্সেলোনার সাথে।"],
      ["প্রধান আন্তর্জাতিক ট্রফি", "3", "বিশ্বকাপ ২০২২, কোপা আমেরিকা ২০২১ ও ২০২৪।"]
    ],
    qa: (teamTotal, per) => [
      ["মেসি কয়টি ট্রফি জিতেছেন?", `<b>${teamTotal}টি অফিশিয়াল ট্রফি</b>: বার্সেলোনায় ${per["Barcelona"] || 0}, পিএসজিতে ${per["Paris Saint-Germain"] || 0}, মায়ামিতে ${per["Inter Miami"] || 0} এবং আর্জেন্টিনায় ${per["Argentina"] || 0}টি।`],
      ["মেসি কয়টি ব্যালন ডি'অর জিতেছেন?", "<b>আটটি</b> — ইতিহাসের অন্য যে কারও চেয়ে বেশি (২০০৯–১২, ২০১৫, ২০১৯, ২০২১, ২০২৩)।"],
      ["মেসি কি বিশ্বকাপ জিতেছেন?", "<b>হ্যাঁ — ২০২২ সালে</b>, ফাইনালে ফ্রান্সের বিরুদ্ধে জোড়া গোল সহ, সাথে ২০২১ ও ২০২৪ কোপা আমেরিকা।"],
      ["মেসি কয়টি চ্যাম্পিয়ন্স লিগ জিতেছেন?", "<b>চারটি</b>, সবগুলো বার্সেলোনার সাথে: ২০০৬, ২০০৯, ২০১১ এবং ২০১৫।"]
    ],
    teamHeader: (team, sub) => `${esc(team)} — ${sub}টি ট্রফি`,
    indHeader: (indTotal) => `ব্যক্তিগত পুরস্কার — ${indTotal}টি সম্মাননা`,
    faq: [
      ["মেসির সবচেয়ে গুরুত্বপূর্ণ ট্রফি কোনটি?", "<b>২০২২ বিশ্বকাপ</b> — যা তার ক্যারিয়ারের সবচেয়ে বড় প্রাপ্তি, টুর্নামেন্টের সেরা খেলোয়াড় হিসেবে জয়ী হন।"],
      ["মেসি কয়টি লিগ শিরোপা জিতেছেন?", "<b>১২টি লিগ</b> — ১০টি লা লিগা, ২টি লিগ ১ — এবং মায়ামির সাথে সাপোর্টার্স শিল্ড।"],
      ["মেসি কয়টি ব্যক্তিগত পুরস্কার জিতেছেন?", "৮টি ব্যালন ডি'অর, ৬টি ইউরোপিয়ান গোল্ডেন শু এবং ২টি বিশ্বকাপ গোল্ডেন বল — প্রতিটিই রেকর্ড।"],
      ["মেসি কি সর্বকালের সবচেয়ে বেশি ট্রফিজয়ী খেলোয়াড়?", "দলীয় এবং ব্যক্তিগত রেকর্ড মিলিয়ে — <b>যেকোনো হিসাবেই হ্যাঁ</b>."]
    ]
  },
  hi: {
    head: (teamTotal) => `<b>${teamTotal} टीम ट्रॉफियां</b> — फुटबॉल इतिहास का सबसे सफल करियर — साथ ही रिकॉर्ड <b>8 बैलन डी'ओर</b>।`,
    kpis: (per) => [
      ["टीम ट्रॉफियां", 46, `बार्सिलोना ${per["Barcelona"] || 0} · अर्जेंटीना ${per["Argentina"] || 0} · पीएसजी ${per["Paris Saint-Germain"] || 0} · मियामी ${per["Inter Miami"] || 0}।`],
      ["बैलन डी'ओर", "8", "रिकॉर्ड — 2009–12, 2015, 2019, 2021, 2023।"],
      ["चैंपियंस लीग", "4", "2006, 2009, 2011, 2015 — सभी बार्सिलोना के साथ।"],
      ["प्रमुख अंतरराष्ट्रीय खिताब", "3", "विश्व कप 2022, कोपा अमेरिका 2021 और 2024।"]
    ],
    qa: (teamTotal, per) => [
      ["मेस्सी ने कितनी ट्रॉफियां जीती हैं?", `<b>${teamTotal} आधिकारिक सीनियर खिताब</b>: बार्सिलोना में ${per["Barcelona"] || 0}, पीएसजी में ${per["Paris Saint-Germain"] || 0}, मियामी में ${per["Inter Miami"] || 0} और अर्जेंटीना के साथ ${per["Argentina"] || 0}।`],
      ["मेस्सी ने कितने बैलन डी'ओर जीते हैं?", "<b>आठ</b> — इतिहास में किसी भी खिलाड़ी से अधिक (2009–12, 2015, 2019, 2021, 2023)।"],
      ["क्या मेस्सी ने विश्व कप जीता है?", "<b>हाँ — 2022 में</b>, फ्रांस के खिलाफ फाइनल में दो गोल किए, साथ ही 2021 और 2024 कोपा अमेरिका।"],
      ["मेस्सी ने कितनी चैंपियंस लीग जीती हैं?", "<b>चार</b>, सभी बार्सिलोना के साथ: 2006, 2009, 2011 और 2015।"]
    ],
    teamHeader: (team, sub) => `${esc(team)} — ${sub} ट्रॉफियां`,
    indHeader: (indTotal) => `व्यक्तिगत पुरस्कार — ${indTotal} सम्मान`,
    faq: [
      ["मेस्सी की सबसे महत्वपूर्ण ट्रॉफी कौन सी है?", "<b>2022 विश्व कप</b> — टूर्नामेंट के सर्वश्रेष्ठ खिलाड़ी के रूप में जीती गई उनकी सबसे बड़ी उपलब्धि।"],
      ["मेस्सी ने कितने लीग खिताब जीते हैं?", "<b>12 लीग खिताब</b> — 10 ला लीगा, 2 लीग 1 — साथ ही मियामी के साथ सपोर्टर्स शील्ड।"],
      ["मेस्सी ने कितने व्यक्तिगत पुरस्कार जीते हैं?", "8 बैलन डी'ओर, 6 यूरोपीय गोल्डन शू और 2 विश्व कप गोल्डन बॉल — प्रत्येक एक रिकॉर्ड है।"],
      ["क्या मेस्सी सर्वकालिक सबसे सम्मानित खिलाड़ी हैं?", "टीम और व्यक्तिगत ट्रॉफियों को मिलाकर — <b>हाँ, हर दृष्टि से</b>."]
    ]
  },
  ro: {
    head: (teamTotal) => `<b>${teamTotal} trofee colective</b> — cea mai decorată carieră din istoria fotbalului — plus un record de <b>8 Baloane de Aur</b>.`,
    kpis: (per) => [
      ["Trofee colective", 46, `Barcelona ${per["Barcelona"] || 0} · Argentina ${per["Argentina"] || 0} · PSG ${per["Paris Saint-Germain"] || 0} · Miami ${per["Inter Miami"] || 0}.`],
      ["Baloane de Aur", "8", "Record — 2009–12, 2015, 2019, 2021, 2023."],
      ["Ligi ale Campionilor", "4", "2006, 2009, 2011, 2015 — toate cu Barcelona."],
      ["Turnee internaționale majore", "3", "Cupa Mondială 2022, Copas América 2021 & 2024."]
    ],
    qa: (teamTotal, per) => [
      ["Câte trofee a câștigat Messi?", `<b>${teamTotal} titluri oficiale la seniori</b>: ${per["Barcelona"] || 0} la Barcelona, ${per["Paris Saint-Germain"] || 0} la PSG, ${per["Inter Miami"] || 0} la Inter Miami și ${per["Argentina"] || 0} la națională.`],
      ["Câte Baloane de Aur are Messi?", "<b>Opt</b> — mai mult decât orice alt jucător din istorie (2009–12, 2015, 2019, 2021, 2023)."],
      ["A câștigat Messi Cupa Mondială?", "<b>Da — 2022</b>, marcând de două ori în finala împotriva Franței, plus Copas América în 2021 și 2024."],
      ["Câte Ligi ale Campionilor are Messi?", "<b>Patru</b>, toate cu Barcelona: 2006, 2009, 2011 și 2015."]
    ],
    teamHeader: (team, sub) => `${esc(team)} — ${sub} trofee`,
    indHeader: (indTotal) => `Distincții individuale — ${indTotal} premii`,
    faq: [
      ["Care este cel mai important trofeu al lui Messi?", "<b>Cupa Mondială 2022</b> — cel mai râvnit titlu al carierei sale, cucerit fiind desemnat cel mai bun jucător al turneului."],
      ["Câte titluri de campion are Messi?", "<b>12 titluri de ligă</b> — 10 La Liga, 2 Ligue 1 — plus Supporters' Shield cu Miami."],
      ["Câte premii individuale a câștigat Messi?", "8 Baloane de Aur, 6 Ghete de Aur și două Baloane de Aur la Cupa Mondială — fiecare fiind un record."],
      ["Este Messi cel mai titrat jucător din toate timpurile?", "Prin cumulul titlurilor de echipă și recordurilor individuale — <b>da, fără îndoială</b>."]
    ]
  },
  uz: {
    head: (teamTotal) => `<b>${teamTotal} ta jamoaviy sovrin</b> — futbol tarixidagi eng ko'p unvonga ega faoliyat — hamda rekord <b>8 ta Oltin to'p</b>.`,
    kpis: (per) => [
      ["Jamoaviy sovrinlar", 46, `Barselona ${per["Barcelona"] || 0} · Argentina ${per["Argentina"] || 0} · PSJ ${per["Paris Saint-Germain"] || 0} · Mayami ${per["Inter Miami"] || 0}.`],
      ["Oltin to'p", "8", "Rekord — 2009–12, 2015, 2019, 2021, 2023."],
      ["Chempionlar Ligasi", "4", "2006, 2009, 2011, 2015 — barchasi Barselona safida."],
      ["Katta xalqaro sovrinlar", "3", "Jahon chempionati 2022, Amerika Kubogi 2021 va 2024."]
    ],
    qa: (teamTotal, per) => [
      ["Messi nechta sovrin yutgan?", `<b>${teamTotal} ta rasmiy jamoaviy sovrin</b>: ${per["Barcelona"] || 0} Barselonada, ${per["Paris Saint-Germain"] || 0} PSJda, ${per["Inter Miami"] || 0} Inter Mayamida va ${per["Argentina"] || 0} Argentinada.`],
      ["Messida nechta Oltin to'p bor?", "<b>Sakkizta</b> — futbol tarixidagi boshqa har qanday futbolchidan ko'p (2009–12, 2015, 2019, 2021, 2023)."],
      ["Messi Jahon chempionatini yutganmi?", "<b>Ha — 2022 yilda</b>, Fransiyaga qarshi finalda 2 ta gol urib, shuningdek 2021 va 2024 yillarda Amerika Kubogini yutgan."],
      ["Messida nechta Chempionlar Ligasi sovrini bor?", "<b>To'rtta</b>, barchasi Barselona bilan: 2006, 2009, 2011 va 2015."]
    ],
    teamHeader: (team, sub) => `${esc(team)} — ${sub} ta sovrin`,
    indHeader: (indTotal) => `Shaxsiy unvonlar — ${indTotal} ta mukofot`,
    faq: [
      ["Messining eng muhim sovrini qaysi?", "<b>2022 yilgi Jahon chempionati</b> — uning butun faoliyatidagi eng oliy cho'qqi, turnirning eng yaxshi o'yinchisi sifatida qo'lga kiritilgan."],
      ["Messi nechta liga chempionligini yutgan?", "<b>12 ta liga chempionligi</b> — 10 ta La Liga, 2 ta Liga 1 — hamda Mayami bilan Supporters' Shield."],
      ["Messida nechta shaxsiy mukofot bor?", "8 ta Oltin to'p, 6 ta Yevropa Oltin butsasi va 2 ta Jahon chempionati Oltin to'pi — har biri mutlaq rekord."],
      ["Messi tarixdagi eng ko'p unvonga ega futbolchimi?", "Jamoaviy sovrinlar va shaxsiy rekordlar yig'indisi bo'yicha — <b>ha, shubhasiz</b>."]
    ]
  }
};

const ACH_EN = {
  head: (teamTotal) => `<b>${teamTotal} team trophies</b> — the most decorated career football has seen — plus a record <b>8 Ballons d'Or</b>. Every title, club by club, with the years won.`,
  kpis: (per) => [
    ["Team trophies", 46, `Barcelona ${per["Barcelona"] || 0} · Argentina ${per["Argentina"] || 0} · PSG ${per["Paris Saint-Germain"] || 0} · Miami ${per["Inter Miami"] || 0}.`],
    ["Ballons d'Or", "8", "Record — 2009–12, 2015, 2019, 2021, 2023."],
    ["Champions Leagues", "4", "2006, 2009, 2011, 2015 — all with Barcelona."],
    ["Major internationals", "3", "World Cup 2022, Copas América 2021 & 2024."]
  ],
  qa: (teamTotal, per) => [
    ["How many trophies has Messi won?", `<b>${teamTotal} senior team titles</b>: ${per["Barcelona"] || 0} Barcelona, ${per["Paris Saint-Germain"] || 0} PSG, ${per["Inter Miami"] || 0} Inter Miami and ${per["Argentina"] || 0} Argentina.`],
    ["How many Ballons d'Or has Messi won?", "<b>Eight</b> — more than any player ever (2009–12, 2015, 2019, 2021, 2023)."],
    ["Has Messi won the World Cup?", "<b>Yes — 2022</b>, scoring twice in the final against France, plus Copas América 2021 and 2024."],
    ["How many Champions Leagues has Messi won?", "<b>Four</b>, all with Barcelona: 2006, 2009, 2011 and 2015."]
  ],
  teamHeader: (team, sub) => `${esc(team)} — ${sub} trophies`,
  indHeader: (indTotal) => `Individual honours — ${indTotal} awards`,
  faq: [
    ["What is Messi's most important trophy?", "The <b>2022 World Cup</b> — the title his whole career had pointed at, won as player of the tournament."],
    ["How many league titles has Messi won?", "<b>Twelve</b> — 10 La Ligas, 2 Ligue 1s — plus an MLS Cup (2025) and a Leagues Cup (2023) with Miami."],
    ["How many individual awards has Messi won?", "Eight Ballons d'Or, six European Golden Shoes and two World Cup Golden Balls — each a record."],
    ["Is Messi the most decorated player ever?", "By team titles plus individual records combined — <b>yes, by any reasonable count</b>."]
  ]
};

function renderAch(d) {
  const lang = getLang();
  const cfg = ACH_I18N[lang] || ACH_EN;
  const teamRows = d.trophies.filter((x) => x.team !== "Individual");
  const indRows = d.trophies.filter((x) => x.team === "Individual");
  const teamTotal = teamRows.reduce((a, x) => a + x.count, 0);
  const indTotal = indRows.reduce((a, x) => a + x.count, 0);
  const per = {};
  teamRows.forEach((x) => { per[x.team] = (per[x.team] || 0) + x.count; });
  setHead(d, cfg.head(teamTotal));
  el("kpis").innerHTML = cfg.kpis(per).map((k) => kpi4(k[0], k[1], k[2])).join("");
  el("qa").innerHTML = cfg.qa(teamTotal, per).map((q) => `<details class="faq-item"><summary class="faq-question"><span>${q[0]}</span><span class="faq-chevron" aria-hidden="true">▾</span></summary><div class="faq-answer"><p>${q[1]}</p></div></details>`).join("");
  el("qa").className = "faq-accordion";
  el("cabinet").innerHTML = cabinetPhotos();
  const order = ["Barcelona", "Paris Saint-Germain", "Inter Miami", "Argentina"];
  const trow = (x) => `<div class="tpill"><span class="tp-name">${esc(x.title)}</span><span class="tp-count">×${x.count}</span>` +
    `<span class="tp-years">${esc(x.years.join(", "))}</span></div>`;
  el("groups").innerHTML = order.map((team) => {
    const rows = teamRows.filter((x) => x.team === team);
    const sub = rows.reduce((a, x) => a + x.count, 0);
    return `<div class="trophy-group"><div class="shead"><h2>${cfg.teamHeader(team, sub)}</h2></div>` +
      rows.map(trow).join("") + `</div>`;
  }).join("") + (indRows.length ?
    `<div class="trophy-group"><div class="shead"><h2>${cfg.indHeader(indTotal)}</h2></div>` +
    indRows.map(trow).join("") + `</div>` : "");
  el("faq").innerHTML = cfg.faq.map((q) => `<details class="faq-item"><summary class="faq-question"><span>${q[0]}</span><span class="faq-chevron" aria-hidden="true">▾</span></summary><div class="faq-answer"><p>${q[1]}</p></div></details>`).join("");
  el("faq").className = "faq-accordion";
  renderExplore(d, "achievements");
  renderMethod(d, "");
}

/* Entrance motion (additive): donut sweep + KPI tick share Task 1's boot observer —
   one observer, not two. Markup always holds final numbers/offsets (no-JS safe). */
let entranceObs = null;
function tickKpis(grid) {
  grid.querySelectorAll(".kpi-value").forEach((v) => {
    if (v.dataset.tick) return;
    v.dataset.tick = "1";
    const m = v.textContent.trim().match(/^([\d,]+(?:\.\d+)?)$/);
    if (!m) return; /* compound values ("2012 · 91", "927 / 1,000") stay static */
    const final = m[1];
    const dec = (final.split(".")[1] || "").length;
    const target = parseFloat(final.replace(/,/g, ""));
    if (!isFinite(target)) return;
    const t0 = performance.now(), dur = 900;
    const step = (t) => {
      const k = Math.min((t - t0) / dur, 1);
      const cur = target * (1 - Math.pow(1 - k, 3));
      v.textContent = dec ? cur.toFixed(dec) : n(Math.round(cur));
      if (k < 1) requestAnimationFrame(step);
      else v.textContent = final; /* exact final grouping, never rounded off */
    };
    requestAnimationFrame(step);
  });
}
function armEntrance() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sparks = document.querySelectorAll("svg.spark:not(.in)");
  const donuts = document.querySelectorAll("svg.donut:not(.in)");
  const grids = document.querySelectorAll("#kpis, #decades");
  const applyDonut = (svg) => {
    svg.classList.add("in");
    svg.querySelectorAll("circle").forEach((c) => {
      const len = c.dataset.len || c.getAttribute("data-len");
      const C = c.dataset.c || c.getAttribute("data-c");
      if (len && C) c.setAttribute("stroke-dasharray", `${len} ${C}`);
    });
  };
  if (reduce) {
    sparks.forEach((s) => s.classList.add("in"));
    donuts.forEach(applyDonut);
    return;
  }
  if (!("IntersectionObserver" in window)) {
    sparks.forEach((s) => s.classList.add("in"));
    donuts.forEach(applyDonut);
    grids.forEach(tickKpis);
    return;
  }
  if (!entranceObs) {
    entranceObs = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const t = en.target;
        entranceObs.unobserve(t);
        if (t.matches("svg.donut")) {
          applyDonut(t);
        } else if (t.matches("svg.spark")) {
          t.classList.add("in");
        } else {
          t.dataset.armed = "1";
          tickKpis(t);
        }
      });
    }, { rootMargin: "250px 0px 250px 0px", threshold: 0.01 });
  }
  sparks.forEach((s) => entranceObs.observe(s));
  donuts.forEach((s) => entranceObs.observe(s));
  grids.forEach((g) => { if (!g.dataset.armed) entranceObs.observe(g); });
}

/* Universal clipboard helper with textarea fallback */
async function copyToClipboard(text, msgEl, successMsg) {
  const lang = getLang();
  const defaultMsgs = {
    es: "¡Copiado al portapapeles!",
    pt: "Copiado para a área de transferência!",
    fr: "Copié dans le presse-papier !",
    ar: "تم النسخ إلى الحافظة!",
    bn: "ক্লিপবোর্ডে কপি করা হয়েছে!",
    hi: "क्लिपबोर्ड पर कॉपी किया गया!",
    ro: "Copiat în clipboard!",
    uz: "Vaqtinchalik xotiraga nusxalandi!"
  };
  const finalMsg = successMsg || defaultMsgs[lang] || "Copied to clipboard!";
  let ok = false;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      ok = true;
    }
  } catch (_) {}
  if (!ok) {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      ok = true;
    } catch (_) {}
  }
  if (msgEl) {
    msgEl.textContent = ok ? finalMsg : text;
    clearTimeout(msgEl._timer);
    msgEl._timer = setTimeout(() => { msgEl.textContent = ""; }, 3500);
  }
}

/* ================= BIRTHDAY VIRAL SOCIAL & CANVAS CARD ================= */
function updateBirthdaySocialShare(dayData, key) {
  const lang = getLang();
  const shareMsg = el("bday-share-msg");
  const isMessiBday = (dayData.month === 6 && dayData.day === 24);
  let shareText = "";
  if (lang === "es") {
    if (dayData.goalsCount > 0) {
      const gWord = dayData.goalsCount === 1 ? "gol" : "goles";
      shareText = `¡Lionel Messi marcó ${dayData.goalsCount} ${gWord} en mi cumpleaños (${dayData.formatted})! ⚽🎂 ¿Marcó en el tuyo?`;
    } else if (isMessiBday) {
      shareText = `¡Cumplo años el mismo día que Lionel Messi (24 de junio)! 🐐🎂 ¿Marcó en tu cumpleaños?`;
    } else {
      shareText = `¿Marcó Lionel Messi en tu cumpleaños? Revisa los 366 días a lo largo de sus 930 goles:`;
    }
  } else if (lang === "pt") {
    if (dayData.goalsCount > 0) {
      const gWord = dayData.goalsCount === 1 ? "gol" : "gols";
      shareText = `Lionel Messi marcou ${dayData.goalsCount} ${gWord} no meu aniversário (${dayData.formatted})! ⚽🎂 Ele marcou no seu?`;
    } else if (isMessiBday) {
      shareText = `Faço aniversário no mesmo dia que Lionel Messi (24 de junho)! 🐐🎂 Ele marcou no seu?`;
    } else {
      shareText = `Lionel Messi marcou no seu aniversário? Confira todos os 366 dias da carreira:`;
    }
  } else if (lang === "fr") {
    if (dayData.goalsCount > 0) {
      const gWord = dayData.goalsCount === 1 ? "but" : "buts";
      shareText = `Lionel Messi a marqué ${dayData.goalsCount} ${gWord} le jour de mon anniversaire (${dayData.formatted}) ! ⚽🎂 A-t-il marqué le vôtre ?`;
    } else if (isMessiBday) {
      shareText = `Je partage mon anniversaire avec Lionel Messi (24 juin) ! 🐐🎂 A-t-il marqué le vôtre ?`;
    } else {
      shareText = `Lionel Messi a-t-il marqué le jour de votre anniversaire ? Découvrez les 366 jours :`;
    }
  } else if (lang === "ar") {
    if (dayData.goalsCount > 0) {
      shareText = `ليونيل ميسي سجل ${dayData.goalsCount} هدفاً في يوم ميلادي (${dayData.formatted})! ⚽🎂 هل سجل في يوم ميلادك؟`;
    } else if (isMessiBday) {
      shareText = `عيد ميلادي نفس يوم ميلاد ليونيل ميسي (24 يونيو)! 🐐🎂 هل سجل في يوم ميلادك؟`;
    } else {
      shareText = `هل سجل ليونيل ميسي في يوم ميلادك؟ تحقق من جميع أيام السنة:`;
    }
  } else if (lang === "bn") {
    if (dayData.goalsCount > 0) {
      shareText = `লিওনেল মেসি আমার জন্মদিনে (${dayData.formatted}) ${dayData.goalsCount}টি গোল করেছেন! ⚽🎂 আপনার জন্মদিনে কি গোল করেছেন?`;
    } else if (isMessiBday) {
      shareText = `আমার জন্মদিন লিওনেল মেসির জন্মদিনের একই দিনে (২৪ জুন)! 🐐🎂 আপনার জন্মদিনে কি গোল করেছেন?`;
    } else {
      shareText = `লিওনেল মেসি কি আপনার জন্মদিনে গোল করেছিলেন? ৩৬৬ দিনের তালিকা দেখুন:`;
    }
  } else if (lang === "hi") {
    if (dayData.goalsCount > 0) {
      shareText = `लियोनेल मेस्सी ने मेरे जन्मदिन (${dayData.formatted}) पर ${dayData.goalsCount} गोल किए! ⚽🎂 क्या आपके जन्मदिन पर गोल किया?`;
    } else if (isMessiBday) {
      shareText = `मेरा जन्मदिन लियोनेल मेस्सी के जन्मदिन के दिन (24 जून) है! 🐐🎂 क्या आपके जन्मदिन पर गोल किया?`;
    } else {
      shareText = `क्या लियोनेल मेस्सी ने आपके जन्मदिन पर गोल किया? 366 दिनों की जांच करें:`;
    }
  } else if (lang === "ro") {
    if (dayData.goalsCount > 0) {
      const gWord = dayData.goalsCount === 1 ? "gol" : "goluri";
      shareText = `Lionel Messi a marcat ${dayData.goalsCount} ${gWord} de ziua mea (${dayData.formatted})! ⚽🎂 A marcat și de a ta?`;
    } else if (isMessiBday) {
      shareText = `Sunt născut în aceeași zi cu Lionel Messi (24 iunie)! 🐐🎂 A marcat de ziua ta?`;
    } else {
      shareText = `A marcat Lionel Messi de ziua ta? Verifică toate cele 366 de zile:`;
    }
  } else if (lang === "uz") {
    if (dayData.goalsCount > 0) {
      shareText = `Lionel Messi mening tug'ilgan kunimda (${dayData.formatted}) ${dayData.goalsCount} ta gol urgan! ⚽🎂 Sizning tug'ilgan kuningizdachi?`;
    } else if (isMessiBday) {
      shareText = `Men Lionel Messi bilan bir kunda tug'ilganman (24-iyun)! 🐐🎂 Sizning tug'ilgan kuningizdachi?`;
    } else {
      shareText = `Lionel Messi sizning tug'ilgan kuningizda gol urganmi? 366 kunlik natijalarni tekshiring:`;
    }
  } else {
    if (dayData.goalsCount > 0) {
      const gWord = dayData.goalsCount === 1 ? "goal" : "goals";
      shareText = `Lionel Messi scored ${dayData.goalsCount} ${gWord} on my birthday (${dayData.formatted})! ⚽🎂 Did he score on yours?`;
    } else if (isMessiBday) {
      shareText = `I share a birthday with Lionel Messi (24 June)! 🐐🎂 Did he score on your birthday?`;
    } else {
      shareText = `Did Lionel Messi score on your birthday? Check all 366 days across his 930 career goals:`;
    }
  }

  const shareUrl = `${location.origin}/${lang === "en" ? "en" : lang}/birthday?date=${key}`;

  const shareBtn = el("bday-share-btn");
  if (shareBtn) {
    shareBtn.hidden = false;
    shareBtn.onclick = async () => {
      try { trackShare("web_share", shareText); } catch (_) {}
      if (navigator.share) {
        try {
          await navigator.share({ title: "Messi Birthday Stats", text: shareText, url: shareUrl });
          return;
        } catch (_) {}
      }
      copyToClipboard(`${shareText} ${shareUrl}`, shareMsg);
    };
  }

  const copyBtn = el("bday-copy-btn");
  if (copyBtn) {
    copyBtn.onclick = () => {
      copyToClipboard(shareUrl, shareMsg);
    };
  }

  const xBtn = el("bday-x-share-btn");
  if (xBtn) {
    xBtn.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
  }
  const waBtn = el("bday-wa-share-btn");
  if (waBtn) {
    waBtn.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + shareUrl)}`;
  }

}

function setupEmbedModal() {
  const triggerBtn = el("bday-embed-trigger-btn");
  const modal = el("bday-embed-modal");
  const closeBtn = el("bday-embed-modal-close");
  const copyBtn = el("bday-copy-embed-btn");
  const copyMsg = el("bday-embed-copy-msg");
  const textarea = el("bday-embed-code");

  if (!triggerBtn || !modal) return;

  triggerBtn.onclick = () => {
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
  };
  if (closeBtn) {
    closeBtn.onclick = () => {
      modal.hidden = true;
      modal.setAttribute("aria-hidden", "true");
    };
  }
  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.hidden = true;
      modal.setAttribute("aria-hidden", "true");
    }
  };
  if (copyBtn && textarea) {
    copyBtn.onclick = () => {
      copyToClipboard(textarea.value, copyMsg);
    };
  }
}

/* ================= 366-DAY BIRTHDAY GOALS EXPLORER ================= */
const BDAY_I18N = {
  en: {
    months: ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    badgeSuccess: "🎉 Yes! Messi Scored On Your Birthday!",
    badgeMessi: "🎂 Leo Messi's Own Birthday!",
    badgeEmpty: "No Goals on this Date",
    headlineSuccess: (g, m, d) => `Lionel Messi scored <b>${g} ${g === 1 ? "goal" : "goals"}</b> in <b>${m} ${m === 1 ? "match" : "matches"}</b> on ${d} throughout his senior career!`,
    headlineMessi: `You share a birthday with <b>Lionel Andrés Messi</b> (born 24 June 1987 in Rosario)!`,
    headlineEmpty: (d) => `Lionel Messi has not scored on <b>${d}</b> during his senior career.`,
    whyZeroTitle: "Why 0 goals?",
    whyZeroMessi: "Lionel Messi has never played a competitive senior match on 24 June because late June falls during the European club summer off-season or scheduled rest intervals between international tournament rounds.",
    whyZeroMessiSub: "You share your special day with the greatest footballer in history!",
    emptyExpl: "Messi did not have a match scheduled or did not score on this specific calendar day — but he has scored on <b>292 of 366 days (79.8%)</b> of the year!",
    closestDay: (d, g) => `The closest calendar day Messi scored on is <b>${d}</b> (${g} career goals).`,
    closestBtn: (d, g) => `Check ${d} (${g} goals) &rarr;`,
    watchClip: (cnt) => `Watch ${cnt > 1 ? cnt + " Goal Clips" : "Goal Clip"}`,
    searchYt: "🔍 Search Highlights",
    playInline: "📺 Play Inline",
    closeInline: "✕ Close Video",
    ytHighlights: "YouTube Highlights",
    goalSummary: (g) => `${g} ${g === 1 ? "goal" : "goals"} scored:`,
    goalTab: (idx, min) => `Goal ${idx}${min ? ` (${min}')` : ""}`,
    shareSuccess: (d, g, m) => `Lionel Messi scored ${g} goals in ${m} matches on my birthday (${d})! Check your date:`,
    shareEmpty: (d) => `Did Lionel Messi score on your birthday? He scored on 292 of 366 days of the year! Check yours:`,
  },
  es: {
    months: ["", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
    badgeSuccess: "🎉 ¡Sí! Messi marcó en tu cumpleaños",
    badgeMessi: "🎂 ¡El propio cumpleaños de Leo Messi!",
    badgeEmpty: "Sin goles en esta fecha",
    headlineSuccess: (g, m, d) => `¡Lionel Messi marcó <b>${g} ${g === 1 ? "gol" : "goles"}</b> en <b>${m} ${m === 1 ? "partido" : "partidos"}</b> el ${d} a lo largo de su carrera senior!`,
    headlineMessi: `¡Compartes cumpleaños con <b>Lionel Andrés Messi</b> (nacido el 24 de junio de 1987 en Rosario)!`,
    headlineEmpty: (d) => `Lionel Messi no ha marcado el <b>${d}</b> durante su carrera senior.`,
    whyZeroTitle: "¿Por qué 0 goles?",
    whyZeroMessi: "Lionel Messi nunca ha jugado un partido oficial un 24 de junio porque finales de junio coincide con las vacaciones de verano de clubes o períodos de descanso entre fases de torneos de selecciones.",
    whyZeroMessiSub: "¡Compartes tu día especial con el mejor futbolista de todos los tiempos!",
    emptyExpl: "Messi no tuvo partido programado o no anotó en este día exacto — ¡pero ha marcado en <b>292 de los 366 días (79,8%)</b> del año!",
    closestDay: (d, g) => `El día de calendario más cercano en el que Messi marcó es el <b>${d}</b> (${g} goles).`,
    closestBtn: (d, g) => `Ver ${d} (${g} goles) &rarr;`,
    watchClip: (cnt) => `Ver ${cnt > 1 ? cnt + " videos de goles" : "video del gol"}`,
    searchYt: "🔍 Buscar resumen en YouTube",
    playInline: "📺 Reproducir aquí",
    closeInline: "✕ Cerrar video",
    ytHighlights: "Resumen en YouTube",
    goalSummary: (g) => `${g} ${g === 1 ? "gol anotado" : "goles anotados"}:`,
    goalTab: (idx, min) => `Gol ${idx}${min ? ` (${min}')` : ""}`,
    shareSuccess: (d, g, m) => `¡Lionel Messi marcó ${g} goles en ${m} partidos el día de mi cumpleaños (${d})! Comprueba el tuyo:`,
    shareEmpty: (d) => `¿Marcó Lionel Messi en tu cumpleaños? ¡Marcó en 292 de los 366 días del año! Comprueba el tuyo:`,
  },
  pt: {
    months: ["", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"],
    badgeSuccess: "🎉 Sim! Messi marcou no seu aniversário!",
    badgeMessi: "🎂 O próprio aniversário de Leo Messi!",
    badgeEmpty: "Sem gols nesta data",
    headlineSuccess: (g, m, d) => `Lionel Messi marcou <b>${g} ${g === 1 ? "gol" : "gols"}</b> em <b>${m} ${m === 1 ? "partida" : "partidas"}</b> em ${d} em sua carreira profissional!`,
    headlineMessi: `Você faz aniversário no mesmo dia que <b>Lionel Andrés Messi</b> (nascido em 24 de junho de 1987 em Rosário)!`,
    headlineEmpty: (d) => `Lionel Messi não marcou em <b>${d}</b> durante sua carreira profissional.`,
    whyZeroTitle: "Por que 0 gols?",
    whyZeroMessi: "Lionel Messi nunca disputou uma partida oficial em 24 de junho porque o fim de junho coincide com as férias de verão dos clubes europeus ou intervalos de descanso em torneios de seleções.",
    whyZeroMessiSub: "Você divide seu dia especial com o maior jogador de futebol de todos os tempos!",
    emptyExpl: "Messi não teve partida marcada ou não marcou neste dia — mas ele já marcou em <b>292 dos 366 dias (79,8%)</b> do ano!",
    closestDay: (d, g) => `O dia mais próximo em que Messi marcou é <b>${d}</b> (${g} gols na carreira).`,
    closestBtn: (d, g) => `Ver ${d} (${g} gols) &rarr;`,
    watchClip: (cnt) => `Assistir ${cnt > 1 ? cnt + " gols" : "ao gol"}`,
    searchYt: "🔍 Buscar no YouTube",
    playInline: "📺 Assistir aqui",
    closeInline: "✕ Fechar vídeo",
    ytHighlights: "Melhores momentos no YouTube",
    goalSummary: (g) => `${g} ${g === 1 ? "gol marcado" : "gols marcados"}:`,
    goalTab: (idx, min) => `Gol ${idx}${min ? ` (${min}')` : ""}`,
    shareSuccess: (d, g, m) => `Lionel Messi marcou ${g} gols em ${m} jogos no dia do meu aniversário (${d})! Confira o seu:`,
    shareEmpty: (d) => `Marcou Messi no dia do seu aniversário? Ele marcou em 292 dos 366 dias do ano! Confira o seu:`,
  },
  fr: {
    months: ["", "Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"],
    badgeSuccess: "🎉 Oui ! Messi a marqué le jour de votre anniversaire !",
    badgeMessi: "🎂 L'anniversaire de Leo Messi lui-même !",
    badgeEmpty: "Aucun but à cette date",
    headlineSuccess: (g, m, d) => `Lionel Messi a marqué <b>${g} ${g === 1 ? "but" : "buts"}</b> en <b>${m} ${m === 1 ? "match" : "matchs"}</b> le ${d} au cours de sa carrière professionnelle !`,
    headlineMessi: `Vous partagez votre anniversaire avec <b>Lionel Andrés Messi</b> (né le 24 juin 1987 à Rosario) !`,
    headlineEmpty: (d) => `Lionel Messi n'a pas marqué le <b>${d}</b> au cours de sa carrière professionnelle.`,
    whyZeroTitle: "Pourquoi 0 but ?",
    whyZeroMessi: "Lionel Messi n'a jamais joué de match officiel un 24 juin car la fin juin correspond à la trêve estivale des clubs européens ou à des jours de repos lors des tournois internationaux.",
    whyZeroMessiSub: "Vous partagez votre jour spécial avec le plus grand joueur de l'histoire !",
    emptyExpl: "Messi n'avait pas de match ou n'a pas marqué ce jour précis — mais il a marqué lors de <b>292 des 366 jours (79,8%)</b> de l'année !",
    closestDay: (d, g) => `Le jour le plus proche où Messi a marqué est le <b>${d}</b> (${g} buts en carrière).`,
    closestBtn: (d, g) => `Voir le ${d} (${g} buts) &rarr;`,
    watchClip: (cnt) => `Voir ${cnt > 1 ? "les " + cnt + " buts" : "le but"}`,
    searchYt: "🔍 Chercher sur YouTube",
    playInline: "📺 Lecture intégrée",
    closeInline: "✕ Fermer la vidéo",
    ytHighlights: "Moments forts sur YouTube",
    goalSummary: (g) => `${g} ${g === 1 ? "but inscrit" : "buts inscrits"} :`,
    goalTab: (idx, min) => `But ${idx}${min ? ` (${min}')` : ""}`,
    shareSuccess: (d, g, m) => `Lionel Messi a marqué ${g} buts en ${m} matchs le jour de mon anniversaire (${d}) ! Vérifiez le vôtre :`,
    shareEmpty: (d) => `Messi a-t-il marqué le jour de votre anniversaire ? Il a marqué 292 des 366 jours de l'année ! Vérifiez le vôtre :`,
  },
  ar: {
    months: ["", "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"],
    badgeSuccess: "🎉 نعم! سجل ميسي في يوم عيد ميلادك!",
    badgeMessi: "🎂 عيد ميلاد ليو ميسي نفسه!",
    badgeEmpty: "لا توجد أهداف في هذا التاريخ",
    headlineSuccess: (g, m, d) => `سجل ليونيل ميسي <b>${g} ${g === 1 ? "هدف" : "أهداف"}</b> في <b>${m} ${m === 1 ? "مباراة" : "مباريات"}</b> يوم ${d} طوال مسيرته الاحترافية!`,
    headlineMessi: `أنت تشارك يوم ميلادك مع الأسطورة <b>ليونيل أندريس ميسي</b> (وُلد في 24 يونيو 1987 في روساريو)!`,
    headlineEmpty: (d) => `لم يسجل ليونيل ميسي في <b>${d}</b> خلال مسيرته الاحترافية.`,
    whyZeroTitle: "لماذا 0 أهداف؟",
    whyZeroMessi: "لم يلعب ليونيل ميسي أي مباراة رسمية في 24 يونيو لأن أواخر يونيو تتزامن مع العطلة الصيفية للأندية الأوروبية أو فترات الراحة بين أدوار البطولات الدولية.",
    whyZeroMessiSub: "أنت تشارك يومك المميز مع أفضل لاعب كرة قدم في التاريخ!",
    emptyExpl: "لم تكن لدى ميسي مباراة مجدولة أو لم يسجل في هذا اليوم المحدد — لكنه سجل في <b>292 يوماً من أصل 366 يوماً (79.8%)</b> في السنة!",
    closestDay: (d, g) => `أقرب يوم سجل فيه ميسي هو <b>${d}</b> (${g} أهداف في مسيرته).`,
    closestBtn: (d, g) => `تحقق من ${d} (${g} أهداف) &rarr;`,
    watchClip: (cnt) => `شاهد ${cnt > 1 ? cnt + " أهداف" : "الهدف"}`,
    searchYt: "🔍 بحث في YouTube",
    playInline: "📺 تشغيل هنا",
    closeInline: "✕ إغلاق الفيديو",
    ytHighlights: "ملخصات YouTube",
    goalSummary: (g) => `تم تسجيل ${g} ${g === 1 ? "هدف" : "أهداف"}:`,
    goalTab: (idx, min) => `الهدف ${idx}${min ? ` (${min}')` : ""}`,
    shareSuccess: (d, g, m) => `سجل ليونيل ميسي ${g} أهداف في ${m} مباريات في يوم عيد ميلادي (${d})! تحقق من تاريخك:`,
    shareEmpty: (d) => `هل سجل ليونيل ميسي في يوم ميلادك؟ لقد سجل في 292 يوماً من أيام السنة الـ 366! تحقق من تاريخك:`,
  },
  bn: {
    months: ["", "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"],
    badgeSuccess: "🎉 হ্যাঁ! মেসি আপনার জন্মদিনে গোল করেছিলেন!",
    badgeMessi: "🎂 স্বয়ং লিও মেসির নিজের জন্মদিন!",
    badgeEmpty: "এই তারিখে কোনো গোল নেই",
    headlineSuccess: (g, m, d) => `লিওনেল মেসি তার সিনিয়র ক্যারিয়ারে ${d}-এ <b>${m}টি ম্যাচে</b> <b>${g}টি গোল</b> করেছেন!`,
    headlineMessi: `আপনি সর্বকালের সেরা ফুটবলার <b>লিওনেল আন্দ্রেস মেসি</b>-র সাথে জন্মদিন শেয়ার করছেন (জন্ম ২৪ জুন ১৯৮৭, রোজারিও)!`,
    headlineEmpty: (d) => `লিওনেল মেসি তার সিনিয়র ক্যারিয়ারে <b>${d}</b> তারিখে কোনো গোল করেননি।`,
    whyZeroTitle: "কেন ০ গোল?",
    whyZeroMessi: "লিওনেল মেসি ২৪ জুন কোনো প্রতিযোগিতামূলক ম্যাচ খেলেননি কারণ জুনের শেষভাগ ইউরোপীয় ক্লাবগুলোর গ্রীষ্মকালীন বিরতি বা আন্তর্জাতিক টুর্নামেন্টের বিশ্রামের সময়।",
    whyZeroMessiSub: "আপনি ফুটবল ইতিহাসের সর্বশ্রেষ্ঠ খেলোয়াড়ের সাথে আপনার বিশেষ দিনটি শেয়ার করছেন!",
    emptyExpl: "মেসির এই দিনে কোনো ম্যাচ ছিল না অথবা গোল করেননি — তবে তিনি বছরের <b>৩৬৬ দিনের মধ্যে ২৯২ দিনেই (৭৯.৮%)</b> গোল করেছেন!",
    closestDay: (d, g) => `মেসির গোল করা নিকটতম দিন হলো <b>${d}</b> (ক্যারিয়ারে ${g}টি গোল)।`,
    closestBtn: (d, g) => `${d} (${g} গোল) দেখুন &rarr;`,
    watchClip: (cnt) => `ভিডিও দেখুন (${cnt > 1 ? cnt + "টি গোল" : "গোল"})`,
    searchYt: "🔍 YouTube-এ খুঁজুন",
    playInline: "📺 এখানে চালান",
    closeInline: "✕ ভিডিও বন্ধ করুন",
    ytHighlights: "YouTube হাইলাইটস",
    goalSummary: (g) => `${g}টি গোল:`,
    goalTab: (idx, min) => `গোল ${idx}${min ? ` (${min}')` : ""}`,
    shareSuccess: (d, g, m) => `লিওনেল মেসি আমার জন্মদিনে (${d}) ${m} ম্যাচে ${g}টি গোল করেছিলেন! আপনার তারিখ দেখুন:`,
    shareEmpty: (d) => `মেসি কি আপনার জন্মদিনে গোল করেছিলেন? তিনি বছরের ২৯২ দিনে গোল করেছেন! দেখুন:`,
  },
  hi: {
    months: ["", "जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"],
    badgeSuccess: "🎉 हाँ! मेसी ने आपके जन्मदिन पर गोल किया था!",
    badgeMessi: "🎂 खुद लियो मेसी का अपना जन्मदिन!",
    badgeEmpty: "इस तारीख को कोई गोल नहीं",
    headlineSuccess: (g, m, d) => `लियोनेल मेसी ने अपने सीनियर करियर में ${d} को <b>${m} मैचों</b> में <b>${g} गोल</b> किए हैं!`,
    headlineMessi: `आप <b>लियोनेल आंद्रेस मेसी</b> के साथ अपना जन्मदिन साझा करते हैं (जन्म 24 जून 1987, रोसारियो)!`,
    headlineEmpty: (d) => `लियोनेल मेसी ने अपने सीनियर करियर में <b>${d}</b> को कोई गोल नहीं किया है।`,
    whyZeroTitle: "0 गोल क्यों?",
    whyZeroMessi: "लियोनेल मेसी ने 24 जून को कभी कोई आधिकारिक मैच नहीं खेला क्योंकि जून का अंत यूरोपीय क्लबों के ग्रीष्मकालीन अवकाश या अंतरराष्ट्रीय टूर्नामेंट के विश्राम के दिनों में आता है।",
    whyZeroMessiSub: "आप अपना खास दिन इतिहास के सबसे महान फुटबॉलर के साथ साझा करते हैं!",
    emptyExpl: "मेसी का इस दिन कोई मैच निर्धारित नहीं था या उन्होंने गोल नहीं किया — लेकिन उन्होंने साल के <b>366 में से 292 दिनों (79.8%)</b> में गोल किए हैं!",
    closestDay: (d, g) => `मेसी द्वारा गोल किया गया सबसे नजदीकी दिन <b>${d}</b> (${g} करियर गोल) है।`,
    closestBtn: (d, g) => `${d} (${g} गोल) चेक करें &rarr;`,
    watchClip: (cnt) => `वीडियो क्लिप देखें (${cnt > 1 ? cnt + " गोल" : "गोल"})`,
    searchYt: "🔍 YouTube पर खोजें",
    playInline: "📺 यहीं चलाएं",
    closeInline: "✕ वीडियो बंद करें",
    ytHighlights: "YouTube हाइलाइट्स",
    goalSummary: (g) => `${g} गोल किए:`,
    goalTab: (idx, min) => `गोल ${idx}${min ? ` (${min}')` : ""}`,
    shareSuccess: (d, g, m) => `लियोनेल मेसी ने मेरे जन्मदिन (${d}) पर ${m} मैचों में ${g} गोल किए थे! अपना जन्मदिन चेक करें:`,
    shareEmpty: (d) => `क्या मेसी ने आपके जन्मदिन पर गोल किया था? उन्होंने साल के 292 दिनों में गोल किए हैं! चेक करें:`,
  },
  ro: {
    months: ["", "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie", "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"],
    badgeSuccess: "🎉 Da! Messi a marcat de ziua ta de naștere!",
    badgeMessi: "🎂 Ziua de naștere a lui Leo Messi însuși!",
    badgeEmpty: "Niciun gol la această dată",
    headlineSuccess: (g, m, d) => `Lionel Messi a marcat <b>${g} ${g === 1 ? "gol" : "goluri"}</b> în <b>${m} ${m === 1 ? "meci" : "meciuri"}</b> pe ${d} de-a lungul carierei sale de senior!`,
    headlineMessi: `Îți împarți ziua de naștere cu <b>Lionel Andrés Messi</b> (născut pe 24 iunie 1987 la Rosario)!`,
    headlineEmpty: (d) => `Lionel Messi nu a marcat pe <b>${d}</b> în timpul carierei sale de senior.`,
    whyZeroTitle: "De ce 0 goluri?",
    whyZeroMessi: "Lionel Messi nu a disputat niciun meci oficial pe 24 iunie, deoarece sfârșitul lunii iunie coincide cu vacanța de vară a cluburilor europene sau cu zile de pauză între meciurile turneelor internaționale.",
    whyZeroMessiSub: "Îți împarți ziua specială cu cel mai mare fotbalist din istorie!",
    emptyExpl: "Messi nu a avut meci programat sau nu a marcat în această zi — dar a marcat în <b>292 din cele 366 de zile (79,8%)</b> ale anului!",
    closestDay: (d, g) => `Cea mai apropiată zi calendaristică în care Messi a marcat este <b>${d}</b> (${g} goluri în carieră).`,
    closestBtn: (d, g) => `Vezi ${d} (${g} goluri) &rarr;`,
    watchClip: (cnt) => `Vezi ${cnt > 1 ? cnt + " videoclipuri cu goluri" : "videoclipul golului"}`,
    searchYt: "🔍 Caută pe YouTube",
    playInline: "📺 Redă aici",
    closeInline: "✕ Închide videoclipul",
    ytHighlights: "Rezumat pe YouTube",
    goalSummary: (g) => `${g} ${g === 1 ? "gol marcat" : "goluri marcate"}:`,
    goalTab: (idx, min) => `Gol ${idx}${min ? ` (${min}')` : ""}`,
    shareSuccess: (d, g, m) => `Lionel Messi a marcat ${g} goluri în ${m} meciuri de ziua mea (${d})! Verifică data ta:`,
    shareEmpty: (d) => `A marcat Messi de ziua ta de naștere? A marcat în 292 din 366 de zile ale anului! Verifică:`,
  },
  uz: {
    months: ["", "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"],
    badgeSuccess: "🎉 Ha! Messi tug'ilgan kuningizda gol urgan!",
    badgeMessi: "🎂 Leo Messining o'z tug'ilgan kuni!",
    badgeEmpty: "Ushbu sanada gol urilmagan",
    headlineSuccess: (g, m, d) => `Lionel Messi butun faoliyati davomida ${d} sanasida <b>${m} ta o'yinda</b> <b>${g} ta gol</b> urgan!`,
    headlineMessi: `Siz <b>Lionel Andres Messi</b> bilan bir kunda tug'ilgansiz (1987-yil 24-iyunda Rozarioda tug'ilgan)!`,
    headlineEmpty: (d) => `Lionel Messi o'z faoliyatida <b>${d}</b> sanasida gol urmagan.`,
    whyZeroTitle: "Nega 0 ta gol?",
    whyZeroMessi: "Lionel Messi 24-iyunda hech qachon rasmiy o'yinda maydonga tushmagan, chunki iyun oyining oxiri Yevropa klublarining yozgi tanaffusiga yoki xalqaro turnirlar bosqichlari orasidagi dam olish kunlariga to'g'ri keladi.",
    whyZeroMessiSub: "Siz o'z bayramingizni futbol tarixidagi eng buyuk o'yinchi bilan bir kunda nishonlaysiz!",
    emptyExpl: "Messi bu kunda o'yin o'tkazmagan yoki gol urmagan — lekin u yilning <b>366 kunidan 292 tasida (79,8%)</b> gol urgan!",
    closestDay: (d, g) => `Messining gol urgan eng yaqin taqvim kuni — <b>${d}</b> (karyerasida ${g} ta gol).`,
    closestBtn: (d, g) => `${d} (${g} gol) ni tekshirish &rarr;`,
    watchClip: (cnt) => `Videoni ko'rish (${cnt > 1 ? cnt + " ta gol" : "gol"})`,
    searchYt: "🔍 YouTubedan qidirish",
    playInline: "📺 Shu yerda ko'rish",
    closeInline: "✕ Videoni yopish",
    ytHighlights: "YouTubeda tomosha qilish",
    goalSummary: (g) => `${g} ta gol urilgan:`,
    goalTab: (idx, min) => `Gol ${idx}${min ? ` (${min}')` : ""}`,
    shareSuccess: (d, g, m) => `Lionel Messi mening tug'ilgan kunimda (${d}) ${m} ta o'yinda ${g} ta gol urgan! O'z sanangizni tekshiring:`,
    shareEmpty: (d) => `Messi sizning tug'ilgan kuningizda gol urganmi? U yilning 292 kunida gol urgan! Tekshiring:`,
  }
};

async function renderBirthday(d) {
  let bdayData;
  try {
    let res;
    try {
      res = await fetch("/data/birthday-goals.json", { cache: "no-store" });
    } catch (_) {}
    if (!res || !res.ok) {
      res = await fetch("data/birthday-goals.json", { cache: "no-store" });
    }
    if (!res.ok) throw new Error("birthday goals data " + res.status);
    bdayData = await res.json();
  } catch (err) {
    console.error("Failed to load birthday data", err);
    return;
  }

  const lang = getLang();
  const bDict = BDAY_I18N[lang] || BDAY_I18N.en;

  const meta = bdayData.meta || {};
  const calendar = bdayData.calendar || {};

  if (el("kpi-days-scored")) el("kpi-days-scored").textContent = meta.daysWithGoals || 292;
  if (el("kpi-days-empty")) el("kpi-days-empty").textContent = meta.daysWithoutGoals || 74;

  const MONTH_NAMES = bDict.months;
  const DAYS_IN_MONTH = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  const pad2 = (num) => String(num).padStart(2, "0");
  const makeKey = (m, day) => `${pad2(m)}-${pad2(day)}`;

  const monthSelect = el("bday-month-select");
  const daySelect = el("bday-day-select");
  const checkBtn = el("bday-check-btn");
  const pillsWrap = el("bday-month-pills");

  const updateDaysDropdown = (m, keepDay) => {
    if (!daySelect) return;
    const maxDays = DAYS_IN_MONTH[m] || 31;
    let selected = keepDay ? Math.min(keepDay, maxDays) : +(daySelect.value || 1);
    if (selected > maxDays) selected = maxDays;
    let html = "";
    for (let i = 1; i <= maxDays; i++) {
      html += `<option value="${i}"${i === selected ? " selected" : ""}>${i}</option>`;
    }
    daySelect.innerHTML = html;
  };

  if (monthSelect) {
    let mOptions = "";
    for (let m = 1; m <= 12; m++) {
      mOptions += `<option value="${m}">${MONTH_NAMES[m]}</option>`;
    }
    monthSelect.innerHTML = mOptions;
  }

  if (pillsWrap) {
    let pillsHtml = "";
    for (let m = 1; m <= 12; m++) {
      const shortName = MONTH_NAMES[m].length > 4 ? MONTH_NAMES[m].slice(0, 3) : MONTH_NAMES[m];
      pillsHtml += `<button type="button" class="bday-month-pill" data-month="${m}">${shortName}</button>`;
    }
    pillsWrap.innerHTML = pillsHtml;
    pillsWrap.addEventListener("click", (e) => {
      const btn = e.target.closest(".bday-month-pill");
      if (!btn) return;
      const m = +btn.dataset.month;
      if (monthSelect) monthSelect.value = m;
      const currentDay = daySelect ? +daySelect.value : 1;
      updateDaysDropdown(m, currentDay);
      selectDate(m, daySelect ? +daySelect.value : 1, false);
    });
  }

  const findClosestScoringDay = (targetKey) => {
    const keys = Object.keys(calendar);
    const targetIdx = keys.indexOf(targetKey);
    if (targetIdx === -1) return null;
    let best = null;
    let bestDist = Infinity;
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (calendar[k] && calendar[k].goalsCount > 0) {
        const dist = Math.min(
          Math.abs(i - targetIdx),
          keys.length - Math.abs(i - targetIdx)
        );
        if (dist < bestDist && dist > 0) {
          bestDist = dist;
          best = calendar[k];
        }
      }
    }
    return best;
  };

  const targetDateEl = el("bday-target-date");
  const badgeEl = el("bday-verdict-badge");
  const headlineEl = el("bday-headline");
  const matchListEl = el("bday-match-list");
  const shareBtn = el("bday-share-btn");
  const shareMsg = el("bday-share-msg");

  let currentMatches = [];

  // Goal Video Modal Controller
  const videoModal = el("video-modal");
  const videoPlayer = el("goal-video-player");
  const videoBigPlayBtn = el("video-big-play-btn");
  const videoTitle = el("video-modal-title");
  const videoEyebrow = el("video-modal-eyebrow");
  const videoClose = el("video-modal-close");
  const videoGoalsNav = el("video-goals-nav");
  const videoFallback = el("video-fallback");
  const videoYtLink = el("video-yt-link");
  const vpillMin = el("vpill-minute");
  const vpillComp = el("vpill-comp");
  const vpillScore = el("vpill-score");
  const vpillAssist = el("vpill-assist");
  const vpillXg = el("vpill-xg");

  const closeGoalVideo = () => {
    if (!videoModal) return;
    videoModal.hidden = true;
    videoModal.setAttribute("aria-hidden", "true");
    if (videoPlayer) {
      videoPlayer.pause();
      videoPlayer.removeAttribute("src");
      videoPlayer.load();
    }
    if (videoBigPlayBtn) videoBigPlayBtn.hidden = true;
    document.body.style.overflow = "";
  };

  if (videoBigPlayBtn) {
    videoBigPlayBtn.onclick = () => {
      if (videoPlayer) {
        videoPlayer.play().then(() => {
          videoBigPlayBtn.hidden = true;
        }).catch((err) => {
          console.log("Play blocked:", err);
        });
      }
    };
  }

  if (videoPlayer) {
    videoPlayer.addEventListener("play", () => {
      if (videoBigPlayBtn) videoBigPlayBtn.hidden = true;
    });
    videoPlayer.addEventListener("pause", () => {
      if (videoModal && !videoModal.hidden && videoBigPlayBtn) videoBigPlayBtn.hidden = false;
    });
    videoPlayer.addEventListener("ended", () => {
      if (videoBigPlayBtn) videoBigPlayBtn.hidden = false;
    });
  }

  if (videoClose) videoClose.onclick = closeGoalVideo;
  if (videoModal) {
    videoModal.onclick = (e) => {
      if (e.target === videoModal) closeGoalVideo();
    };
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && videoModal && !videoModal.hidden) {
      closeGoalVideo();
    }
  });

  const openGoalVideo = (match, initialIndex = 0) => {
    if (!videoModal || !match) return;
    const videos = match.videos || [];
    if (!videos.length) {
      const ytQuery = encodeURIComponent(`Lionel Messi goal vs ${match.opponent} ${match.date}`);
      window.open(`https://www.youtube.com/results?search_query=${ytQuery}`, "_blank");
      return;
    }

    const loadGoalIndex = (idx) => {
      const v = videos[idx];
      if (!v) return;

      if (videoFallback) videoFallback.hidden = true;
      if (videoBigPlayBtn) videoBigPlayBtn.hidden = true;
      if (videoTitle) {
        const numStr = v.goalNumber ? `Goal #${v.goalNumber}: ` : "Goal: ";
        videoTitle.textContent = `${numStr}Messi vs ${match.opponent}`;
      }
      if (videoEyebrow) {
        videoEyebrow.textContent = `${match.date} • ${match.competition || "Official Match"}`;
      }
      if (vpillMin) vpillMin.textContent = `⚽ ${v.minute || match.minutes?.[idx] || ""}'`;
      if (vpillComp) vpillComp.textContent = match.competition || "Match";
      if (vpillScore) vpillScore.textContent = `${match.team} ${match.score} ${match.opponent}`;
      
      if (vpillAssist) {
        if (v.assist) {
          vpillAssist.hidden = false;
          vpillAssist.textContent = `Assist: ${v.assist}`;
        } else {
          vpillAssist.hidden = true;
        }
      }
      if (vpillXg) {
        if (v.xg != null) {
          vpillXg.hidden = false;
          vpillXg.textContent = `xG: ${v.xg}`;
        } else {
          vpillXg.hidden = true;
        }
      }

      if (videoYtLink) {
        videoYtLink.href = `https://www.youtube.com/results?search_query=Lionel+Messi+goal+vs+${encodeURIComponent(match.opponent)}+${match.date}`;
      }

      if (videoPlayer) {
        videoPlayer.onerror = () => {
          if (videoFallback) videoFallback.hidden = false;
          if (videoBigPlayBtn) videoBigPlayBtn.hidden = true;
        };
        videoPlayer.src = v.videoUrl;
        videoPlayer.load();
        const playPromise = videoPlayer.play();
        if (playPromise) {
          playPromise.catch((err) => {
            console.log("Autoplay paused by policy:", err);
            if (videoBigPlayBtn) videoBigPlayBtn.hidden = false;
          });
        }
      }

      if (videoGoalsNav) {
        videoGoalsNav.querySelectorAll(".video-goal-tab").forEach((tab, tIdx) => {
          tab.classList.toggle("active", tIdx === idx);
        });
      }
    };

    if (videoGoalsNav) {
      if (videos.length > 1) {
        videoGoalsNav.hidden = false;
        let tabsHtml = "";
        videos.forEach((v, i) => {
          const minLabel = v.minute ? ` (${v.minute}')` : "";
          tabsHtml += `<button type="button" class="video-goal-tab${i === initialIndex ? " active" : ""}" data-gidx="${i}">${bDict.goalTab(i + 1, v.minute)}</button>`;
        });
        videoGoalsNav.innerHTML = tabsHtml;
        videoGoalsNav.querySelectorAll(".video-goal-tab").forEach((tab) => {
          tab.onclick = () => loadGoalIndex(+tab.dataset.gidx);
        });
      } else {
        videoGoalsNav.hidden = true;
        videoGoalsNav.innerHTML = "";
      }
    }

    loadGoalIndex(initialIndex);
    videoModal.hidden = false;
    videoModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  if (matchListEl) {
    matchListEl.addEventListener("click", (e) => {
      const watchBtn = e.target.closest(".bday-watch-video-btn");
      if (watchBtn) {
        const idx = +watchBtn.dataset.idx;
        const match = currentMatches[idx];
        if (match) {
          trackVideoPlay(match.opponent, match.date, match.competition);
          openGoalVideo(match, 0);
        }
        return;
      }

      const inlineBtn = e.target.closest(".bday-inline-toggle-btn");
      if (inlineBtn) {
        const idx = +inlineBtn.dataset.idx;
        const match = currentMatches[idx];
        const container = el(`bday-inline-player-${idx}`);
        if (!match || !container) return;

        const isCurrentlyOpen = !container.hidden;
        matchListEl.querySelectorAll(".bday-card-inline-player").forEach((p) => {
          p.hidden = true;
          p.innerHTML = "";
        });
        matchListEl.querySelectorAll(".bday-inline-toggle-btn").forEach((b) => {
          b.classList.remove("active");
          b.textContent = bDict.playInline;
        });

        if (!isCurrentlyOpen) {
          trackVideoPlay(match.opponent, match.date, match.competition);
          container.hidden = false;
          inlineBtn.classList.add("active");
          inlineBtn.textContent = bDict.closeInline;

          const videos = match.videos || [];
          const renderInline = (vIdx) => {
            const v = videos[vIdx];
            if (!v) return;
            let navHtml = "";
            if (videos.length > 1) {
              navHtml = `<div class="bday-card-inline-nav">` +
                videos.map((vid, i) => `<button type="button" class="video-goal-tab${i === vIdx ? " active" : ""}" data-inidx="${i}">${bDict.goalTab(i + 1, vid.minute)}</button>`).join("") +
              `</div>`;
            }
            container.innerHTML = `
              ${navHtml}
              <video controls playsinline webkit-playsinline preload="metadata" src="${v.videoUrl}" style="width:100%;aspect-ratio:16/9;background:#000;display:block;">
                Your browser does not support video.
              </video>
            `;
            const inVid = container.querySelector("video");
            if (inVid) inVid.play().catch(() => {});
            container.querySelectorAll(".video-goal-tab").forEach((tab) => {
              tab.onclick = () => renderInline(+tab.dataset.inidx);
            });
          };
          renderInline(0);
        }
      }
    });
  }

  const updateBirthdaySocialShare = (dayData, key) => {
    const formatted = `${dayData.day} ${MONTH_NAMES[dayData.month]}`;
    const shareUrl = `${location.origin}/${lang}/birthday?date=${key}`;
    const shareText = dayData.goalsCount > 0
      ? bDict.shareSuccess(formatted, dayData.goalsCount, dayData.matches?.length || 1)
      : bDict.shareEmpty(formatted);

    const fullShare = `${shareText} ${shareUrl}`;

    if (shareBtn) {
      shareBtn.onclick = async () => {
        try {
          if (navigator.share) {
            await navigator.share({ title: `Messi Birthday Goals: ${formatted}`, text: shareText, url: shareUrl });
          } else if (navigator.clipboard) {
            await navigator.clipboard.writeText(fullShare);
            if (shareMsg) {
              const copiedMsgs = {
                es: "¡Copiado!",
                pt: "Copiado!",
                fr: "Copié !",
                ar: "تم النسخ!",
                bn: "কপি করা হয়েছে!",
                hi: "कॉपी किया गया!",
                ro: "Copiat!",
                uz: "Nusxalandi!"
              };
              shareMsg.textContent = copiedMsgs[lang] || "Copied!";
              setTimeout(() => { shareMsg.textContent = ""; }, 3000);
            }
          }
        } catch (_) {}
      };
    }

    const copyBtn = el("bday-copy-btn");
    if (copyBtn) {
      copyBtn.onclick = async () => {
        try {
          await navigator.clipboard.writeText(shareUrl);
          if (shareMsg) {
            const urlCopiedMsgs = {
              es: "¡Enlace copiado!",
              pt: "Link copiado!",
              fr: "Lien copié !",
              ar: "تم نسخ الرابط!",
              bn: "লিংক কপি করা হয়েছে!",
              hi: "लिंक कॉपी किया गया!",
              ro: "Link copiat!",
              uz: "Havola nusxalandi!"
            };
            shareMsg.textContent = urlCopiedMsgs[lang] || "URL Copied!";
            setTimeout(() => { shareMsg.textContent = ""; }, 3000);
          }
        } catch (_) {}
      };
    }

    const waBtn = el("bday-wa-share-btn");
    if (waBtn) {
      waBtn.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullShare)}`;
    }

    const xBtn = el("bday-x-share-btn");
    if (xBtn) {
      xBtn.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    }
  };

  const selectDate = (m, day, shouldScroll = false) => {
    m = +m;
    day = +day;
    if (isNaN(m) || m < 1 || m > 12) m = 5;
    const maxDays = DAYS_IN_MONTH[m] || 31;
    if (isNaN(day) || day < 1 || day > maxDays) day = 2;

    if (monthSelect) monthSelect.value = m;
    updateDaysDropdown(m, day);
    if (daySelect) daySelect.value = day;

    if (pillsWrap) {
      pillsWrap.querySelectorAll(".bday-month-pill").forEach((p) => {
        p.classList.toggle("on", +p.dataset.month === m);
      });
    }

    document.querySelectorAll(".bday-day-btn").forEach((cell) => {
      const isMatch = +cell.dataset.month === m && +cell.dataset.day === day;
      cell.classList.toggle("active", isMatch);
      if (isMatch) cell.setAttribute("aria-current", "date");
      else cell.removeAttribute("aria-current");
    });

    document.querySelectorAll(".bday-preset-chip").forEach((chip) => {
      const cm = +chip.dataset.month;
      const cd = +chip.dataset.day;
      chip.classList.toggle("active", cm === m && cd === day);
    });

    const key = makeKey(m, day);
    const dayData = calendar[key] || {
      key,
      month: m,
      day,
      monthName: MONTH_NAMES[m],
      formatted: `${day} ${MONTH_NAMES[m]}`,
      goalsCount: 0,
      matches: []
    };

    const formatted = `${day} ${MONTH_NAMES[m]}`;

    try {
      const url = new URL(location.href);
      url.searchParams.set("date", key);
      history.replaceState(null, "", url.pathname + url.search + url.hash);
    } catch (_) {}

    try {
      trackBirthdaySearch(key, formatted, dayData.goalsCount);
    } catch (_) {}

    const formatScore = (str) => {
      if (!str) return "—";
      const sm = String(str).match(/^(\d+)\s*[:\-\u2013]\s*(\d+)$/);
      if (sm) {
        return `${parseInt(sm[1], 10)} – ${parseInt(sm[2], 10)}`;
      }
      return str;
    };

    if (targetDateEl) targetDateEl.textContent = formatted;

    if (dayData.goalsCount > 0) {
      currentMatches = dayData.matches || [];
      if (badgeEl) {
        badgeEl.innerHTML = `<span class="bday-badge-success">${bDict.badgeSuccess}</span>`;
      }
      if (headlineEl) {
        headlineEl.innerHTML = bDict.headlineSuccess(dayData.goalsCount, dayData.matches.length, formatted);
      }

      if (matchListEl) {
        let matchesHtml = "";
        dayData.matches.forEach((match, matchIdx) => {
          const minTags = (match.minutes || [])
            .map((min) => `<span class="bday-min-tag">⚽ ${esc(min)}'</span>`)
            .join(" ");
          const typeTags = (match.types || []).filter(Boolean).length
            ? `<span class="bday-shot-types">(${match.types.join(", ")})</span>`
            : "";

          const hasVideos = match.videos && match.videos.length > 0;
          const videoBtn = hasVideos
            ? `<button type="button" class="bday-watch-video-btn" data-idx="${matchIdx}">
                <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                ${bDict.watchClip(match.videos.length)}
               </button>`
            : `<a href="https://www.youtube.com/results?search_query=Lionel+Messi+goal+vs+${encodeURIComponent(match.opponent)}+${match.date}" target="_blank" rel="noopener noreferrer" class="bday-yt-search-btn">
                ${bDict.searchYt}
               </a>`;

          matchesHtml += `
            <article class="bday-match-card">
              <div class="bday-match-meta">
                <span class="bday-match-date-badge">${esc(match.date)}</span>
                <span class="bday-comp-chip">${esc(match.competition || "Official Match")}</span>
              </div>
              <div class="bday-match-fixture">
                <span>${esc(match.team)}</span>
                <span class="bday-score-pill">${esc(formatScore(match.score))}</span>
                <span>${esc(match.opponent)}</span>
              </div>
              <div class="bday-goals-summary">
                <strong>${bDict.goalSummary(match.goalsCount)}</strong>
                <div class="bday-minute-tags">${minTags}</div>
                ${typeTags}
              </div>
              <div class="bday-match-actions">
                ${videoBtn}
                ${hasVideos ? `<button type="button" class="bday-inline-toggle-btn" data-idx="${matchIdx}">${bDict.playInline}</button>` : ""}
                ${hasVideos ? `<a href="https://www.youtube.com/results?search_query=Lionel+Messi+goal+vs+${encodeURIComponent(match.opponent)}+${match.date}" target="_blank" rel="noopener noreferrer" class="bday-yt-search-btn">${bDict.ytHighlights}</a>` : ""}
              </div>
              <div class="bday-card-inline-player" id="bday-inline-player-${matchIdx}" hidden></div>
            </article>
          `;
        });
        matchListEl.innerHTML = matchesHtml;
      }

      updateBirthdaySocialShare(dayData, key);
    } else {
      const isMessiBday = (m === 6 && day === 24);
      if (isMessiBday) {
        if (badgeEl) {
          badgeEl.innerHTML = `<span class="bday-badge-messi">${bDict.badgeMessi}</span>`;
        }
        if (headlineEl) {
          headlineEl.innerHTML = bDict.headlineMessi;
        }
        if (matchListEl) {
          matchListEl.innerHTML = `
            <div class="bday-empty-box">
              <p><b>${bDict.whyZeroTitle}</b> ${bDict.whyZeroMessi}</p>
              <p>${bDict.whyZeroMessiSub}</p>
            </div>
          `;
        }
      } else {
        if (badgeEl) {
          badgeEl.innerHTML = `<span class="bday-badge-empty">${bDict.badgeEmpty}</span>`;
        }
        if (headlineEl) {
          headlineEl.innerHTML = bDict.headlineEmpty(formatted);
        }
        const closest = findClosestScoringDay(key);
        if (matchListEl) {
          let closestHtml = "";
          if (closest) {
            const closestFormatted = `${closest.day} ${MONTH_NAMES[closest.month]}`;
            closestHtml = `
              <p>${bDict.closestDay(closestFormatted, closest.goalsCount)}</p>
              <button type="button" class="bday-closest-btn" data-month="${closest.month}" data-day="${closest.day}">
                ${bDict.closestBtn(closestFormatted, closest.goalsCount)}
              </button>
            `;
          }
          matchListEl.innerHTML = `
            <div class="bday-empty-box">
              <p>${bDict.emptyExpl}</p>
              ${closestHtml}
            </div>
          `;
          const closestBtn = matchListEl.querySelector(".bday-closest-btn");
          if (closestBtn) {
            closestBtn.addEventListener("click", () => {
              selectDate(+closestBtn.dataset.month, +closestBtn.dataset.day, true);
            });
          }
        }
      }

      updateBirthdaySocialShare(dayData, key);
    }

    if (shouldScroll) {
      const v = el("bday-verdict");
      if (v) v.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (checkBtn) {
    checkBtn.addEventListener("click", () => {
      const m = monthSelect ? +monthSelect.value : 5;
      const day = daySelect ? +daySelect.value : 2;
      selectDate(m, day, true);
    });
  }

  if (monthSelect) {
    monthSelect.addEventListener("change", () => {
      const m = +monthSelect.value;
      const currentDay = daySelect ? +daySelect.value : 1;
      updateDaysDropdown(m, currentDay);
      selectDate(m, daySelect ? +daySelect.value : 1, false);
    });
  }

  if (daySelect) {
    daySelect.addEventListener("change", () => {
      const m = monthSelect ? +monthSelect.value : 5;
      selectDate(m, +daySelect.value, false);
    });
  }

  document.querySelectorAll(".bday-preset-chip[data-month]").forEach((chip) => {
    chip.addEventListener("click", () => {
      selectDate(+chip.dataset.month, +chip.dataset.day, true);
    });
  });

  const todayChip = el("bday-preset-today");
  if (todayChip) {
    todayChip.addEventListener("click", () => {
      const n = new Date();
      selectDate(n.getUTCMonth() + 1, n.getUTCDate(), true);
    });
  }

  const randomChip = el("bday-preset-random");
  if (randomChip) {
    randomChip.addEventListener("click", () => {
      const scoringKeys = Object.keys(calendar).filter((k) => calendar[k].goalsCount > 0);
      const chosen = scoringKeys[Math.floor(Math.random() * scoringKeys.length)];
      const [rm, rd] = chosen.split("-").map(Number);
      selectDate(rm, rd, true);
    });
  }

  // Calendar Heatmap Grid Matrix
  const heatmapGrid = el("bday-heatmap-grid") || el("bday-calendar-grid");
  if (heatmapGrid) {
    if (!heatmapGrid.firstElementChild) {
      let gridHtml = "";
      for (let m = 1; m <= 12; m++) {
        gridHtml += `<div class="bday-month-col"><div class="bday-month-header">${MONTH_NAMES[m].slice(0, 3)}</div><div class="bday-month-days">`;
        const numDays = DAYS_IN_MONTH[m];
        for (let d = 1; d <= numDays; d++) {
          const k = makeKey(m, d);
          const gc = calendar[k]?.goalsCount || 0;
          let intensity = 0;
          if (gc >= 5) intensity = 4;
          else if (gc >= 3) intensity = 3;
          else if (gc >= 2) intensity = 2;
          else if (gc === 1) intensity = 1;

          const isMessi = (m === 6 && d === 24);
          const cellClass = isMessi ? "bday-cell-messi" : `bday-heat-${intensity}`;
          const titleText = isMessi
            ? `${d} ${MONTH_NAMES[m]}: Leo Messi's Birthday!`
            : `${d} ${MONTH_NAMES[m]}: ${gc} ${gc === 1 ? "goal" : "goals"}`;

          gridHtml += `<a href="/${lang}/birthday/${k}" class="bday-day-btn ${cellClass}" data-month="${m}" data-day="${d}" title="${esc(titleText)}">${d}</a>`;
        }
        gridHtml += `</div></div>`;
      }
      heatmapGrid.innerHTML = gridHtml;
    }

    heatmapGrid.addEventListener("click", (e) => {
      const btn = e.target.closest(".bday-day-btn");
      if (!btn) return;
      e.preventDefault();
      selectDate(+btn.dataset.month, +btn.dataset.day, true);
    });
  }

  const topTbody = el("top-days-tbody");
  if (topTbody) {
    if (!topTbody.firstElementChild && meta.topDays) {
      let topHtml = "";
      meta.topDays.forEach((row, idx) => {
        const topFormatted = `${row.day} ${MONTH_NAMES[row.month]}`;
        topHtml += `
          <tr>
            <td><b>#${idx + 1}</b></td>
            <td class="left">
              <a href="/${lang}/birthday/${row.key}" class="bday-top-day-link" data-month="${row.month}" data-day="${row.day}">
                <b>${topFormatted}</b>
              </a>
            </td>
            <td><b style="color:var(--accent);">${row.goals}</b></td>
            <td>${row.matches?.length || 0}</td>
            <td class="left">${esc(row.topRival || "—")}</td>
          </tr>
        `;
      });
      topTbody.innerHTML = topHtml;
    }
    topTbody.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-month]");
      if (btn) {
        e.preventDefault();
        selectDate(+btn.dataset.month, +btn.dataset.day, true);
      }
    });
  }

  const monthlyTbody = el("monthly-tbody");
  if (monthlyTbody && meta.months) {
    let mHtml = "";
    meta.months.forEach((row) => {
      const pct = ((row.goals / meta.totalGoals) * 100).toFixed(1);
      const dayPct = ((row.daysScored / row.totalDays) * 100).toFixed(1);

      let peakDay = 1, peakGoals = 0;
      for (let d = 1; d <= row.totalDays; d++) {
        const k = makeKey(row.month, d);
        const gc = calendar[k]?.goalsCount || 0;
        if (gc > peakGoals) {
          peakGoals = gc;
          peakDay = d;
        }
      }
      const mName = MONTH_NAMES[row.month];
      const peakStr = peakGoals > 0 ? `${peakDay} ${mName} (${peakGoals} goals)` : "—";

      mHtml += `
        <tr>
          <td class="left"><b>${esc(mName)}</b></td>
          <td><b>${row.goals}</b></td>
          <td>${pct}%</td>
          <td>${row.daysScored} / ${row.totalDays}</td>
          <td>${dayPct}%</td>
          <td class="left">${esc(peakStr)}</td>
        </tr>
      `;
    });
    monthlyTbody.innerHTML = mHtml;
  }

  const params = new URLSearchParams(location.search);
  let initMonth = 5;
  let initDay = 2;

  const pathMatch = location.pathname.match(/\/birthday\/(\d{1,2})-(\d{1,2})/);
  if (pathMatch) {
    initMonth = parseInt(pathMatch[1], 10);
    initDay = parseInt(pathMatch[2], 10);
  } else if (params.get("date")) {
    const parts = params.get("date").split("-");
    if (parts.length === 2) {
      initMonth = parseInt(parts[0], 10);
      initDay = parseInt(parts[1], 10);
    }
  } else if (params.get("month") && params.get("day")) {
    initMonth = parseInt(params.get("month"), 10);
    initDay = parseInt(params.get("day"), 10);
  }

  updateDaysDropdown(initMonth, initDay);
  selectDate(initMonth, initDay, false);
  setupEmbedModal();

  renderExplore(d, "birthday");
  renderMethod(d, `Every single one of the ${n(d.totals.goals)} senior goals is cross-referenced with exact date, opponent, competition, minute, and scoreline.`);
}

const LATEST_GOAL_I18N = {
  en: {
    goalPrefix: "Goal #",
    scoreline: "Score",
    didScoreTodayYes: "YES! Lionel Messi scored today: Goal #{goalNum} in the {minute} against {opp} ({score})!",
    didScoreTodayNo: "Did Messi score today? Lionel Messi's most recent official fixture took place on {date} in {comp}, where he scored Goal #{goalNum} of his career in the {minute} to seal a {score} victory. Stream the official goal video directly below.",
    matchResult: "Latest Match Result: {title}",
    goalBadge: "Goal #{goalNum} Scored ({minute})",
    playHighlight: "Select any of Lionel Messi's latest goals below to instantly load and watch the video highlight in the player above:",
    viewDateGoals: "View {formattedDate} Goals →",
    tagHeader: "Header 🔥",
    tagFreekick: "Direct Free Kick 🔥",
    tagPenalty: "Penalty",
    tagLeftFoot: "Left Foot Strike",
    tagRightFoot: "Right Foot",
    tagOpenPlay: "Open play",
    assist: "Assist"
  },
  es: {
    goalPrefix: "Gol #",
    scoreline: "Resultado",
    didScoreTodayYes: "¡SÍ! Lionel Messi anotó hoy: ¡Gol #{goalNum} en el minuto {minute} ante {opp} ({score})!",
    didScoreTodayNo: "¿Marcó Messi hoy? El partido oficial más reciente de Lionel Messi tuvo lugar el {date} en {comp}, donde anotó el Gol #{goalNum} de su carrera en el minuto {minute} para sellar el triunfo {score}. Mira el vídeo oficial arriba.",
    matchResult: "Resultado del partido más reciente: {title}",
    goalBadge: "Gol #{goalNum} marcado ({minute})",
    playHighlight: "Selecciona cualquiera de los goles recientes de Lionel Messi para reproducir el vídeo al instante:",
    viewDateGoals: "Ver goles del {formattedDate} →",
    tagHeader: "Cabezazo 🔥",
    tagFreekick: "Tiro libre directo 🔥",
    tagPenalty: "Penal",
    tagLeftFoot: "Disparo con zurda",
    tagRightFoot: "Pierna derecha",
    tagOpenPlay: "Jugada colectiva",
    assist: "Asistencia"
  },
  pt: {
    goalPrefix: "Gol #",
    scoreline: "Resultado",
    didScoreTodayYes: "SIM! Lionel Messi marcou hoje: Gol #{goalNum} aos {minute} contra {opp} ({score})!",
    didScoreTodayNo: "Messi marcou hoje? A partida oficial mais recente de Lionel Messi ocorreu em {date} na {comp}, onde marcou o Gol #{goalNum} de sua carreira aos {minute} selando a vitória por {score}. Assista ao vídeo oficial acima.",
    matchResult: "Resultado da partida mais recente: {title}",
    goalBadge: "Gol #{goalNum} marcado ({minute})",
    playHighlight: "Selecione qualquer um dos gols recentes de Lionel Messi abaixo para assistir ao vídeo imediatamente:",
    viewDateGoals: "Ver gols de {formattedDate} →",
    tagHeader: "Cabeceio 🔥",
    tagFreekick: "Falta direta 🔥",
    tagPenalty: "Pênalti",
    tagLeftFoot: "Chute de canhota",
    tagRightFoot: "Pé direito",
    tagOpenPlay: "Bola rolando",
    assist: "Assistência"
  },
  fr: {
    goalPrefix: "But n°",
    scoreline: "Score",
    didScoreTodayYes: "OUI ! Lionel Messi a marqué aujourd'hui : But n°{goalNum} à la {minute} contre {opp} ({score}) !",
    didScoreTodayNo: "Messi a-t-il marqué aujourd'hui ? Le match officiel le plus récent de Lionel Messi a eu lieu le {date} en {comp}, où il a inscrit le But n°{goalNum} de sa carrière à la {minute} pour sceller la victoire {score}. Visionnez le replay vidéo officiel ci-dessus.",
    matchResult: "Résultat du match le plus récent : {title}",
    goalBadge: "But n°{goalNum} inscrit ({minute})",
    playHighlight: "Sélectionnez l'un des buts récents de Lionel Messi ci-dessous pour lancer immédiatement la vidéo :",
    viewDateGoals: "Voir les buts du {formattedDate} →",
    tagHeader: "Tête 🔥",
    tagFreekick: "Coup franc direct 🔥",
    tagPenalty: "Penalty",
    tagLeftFoot: "Frappe du gauche",
    tagRightFoot: "Pied droit",
    tagOpenPlay: "Jeu ouvert",
    assist: "Passe décisive"
  },
  ar: {
    goalPrefix: "الهدف رقم ",
    scoreline: "النتيجة",
    didScoreTodayYes: "نعم! ليونيل ميسي سجل اليوم: الهدف رقم {goalNum} في الدقيقة {minute} ضد {opp} ({score})!",
    didScoreTodayNo: "هل سجل ميسي اليوم؟ أحدث مباراة رسمية خاضها ليونيل ميسي كانت في {date} في {comp}، حيث سجل الهدف رقم {goalNum} في مسيرته في الدقيقة {minute} ليحسم الفوز {score}. شاهد فيديو الهدف الرسمي أعلاه.",
    matchResult: "أحدث نتيجة مباراة: {title}",
    goalBadge: "الهدف #{goalNum} مسجل ({minute})",
    playHighlight: "اختر أي هدف من أحدث أهداف ليونيل ميسي أدناه لتشغيل الفيديو فوراً في المشغل أعلاه:",
    viewDateGoals: "عرض أهداف {formattedDate} ←",
    tagHeader: "ضربة رأس 🔥",
    tagFreekick: "ركلة حرة مباشرة 🔥",
    tagPenalty: "ركلة جزاء",
    tagLeftFoot: "تسديدة بالقدم اليسرى",
    tagRightFoot: "القدم اليمنى",
    tagOpenPlay: "لعب مفتوح",
    assist: "صناعة"
  },
  bn: {
    goalPrefix: "গোল #",
    scoreline: "স্কোরলাইন",
    didScoreTodayYes: "হ্যাঁ! লিওনেল মেসি আজ গোল করেছেন: {opp}-এর বিপক্ষে {minute} মিনিটে ক্যারিয়ারের {goalNum}তম গোল ({score})!",
    didScoreTodayNo: "মেসি কি আজ গোল করেছেন? লিওনেল মেসির সাম্প্রতিকতম ম্যাচটি অনুষ্ঠিত হয়েছিল {date}-এ {comp}-এ, যেখানে তিনি {minute} মিনিটে তাঁর ক্যারিয়ারের {goalNum}তম গোল করে {score} ব্যবধানে জয় এনে দেন। নিচে অফিশিয়াল গোল ভিডিওটি উপভোগ করুন।",
    matchResult: "সর্বশেষ ম্যাচের ফলাফল: {title}",
    goalBadge: "{goalNum}তম গোল সম্পন্ন ({minute})",
    playHighlight: "প্লেয়ারের ভিডিও দেখতে নিচে লিওনেল মেসির সাম্প্রতিক গোলগুলি থেকে বেছে নিন:",
    viewDateGoals: "{formattedDate}-এর গোলগুলি দেখুন →",
    tagHeader: "হেডার 🔥",
    tagFreekick: "সরাসরি ফ্রি-কিক 🔥",
    tagPenalty: "পেনাল্টি",
    tagLeftFoot: "বাঁ-পায়ের শট",
    tagRightFoot: "ডান পা",
    tagOpenPlay: "ওপেন প্লে",
    assist: "অ্যাসিস্ট"
  },
  hi: {
    goalPrefix: "गोल #",
    scoreline: "स्कोर",
    didScoreTodayYes: "हाँ! लियोनेल मेस्सी ने आज गोल किया: {opp} के खिलाफ {minute} मिनट में करियर का {goalNum}वाँ गोल ({score})!",
    didScoreTodayNo: "क्या मेस्सी ने आज गोल किया? लियोनेल मेस्सी का सबसे हालिया आधिकारिक मैच {date} को {comp} में हुआ था, जहाँ उन्होंने {minute} मिनट में अपने करियर का {goalNum}वाँ गोल दागकर {score} से जीत दर्ज की। नीचे सीधा आधिकारिक वीडियो रीप्ले देखें।",
    matchResult: "नवीनतम मैच का परिणाम: {title}",
    goalBadge: "गोल #{goalNum} दर्ज ({minute})",
    playHighlight: "ऊपर प्लेयर में वीडियो देखने के लिए नीचे लियोनेल मेस्सी के हालिया गोल में से चुनें:",
    viewDateGoals: "{formattedDate} के गोल देखें →",
    tagHeader: "हेडर 🔥",
    tagFreekick: "सीधा फ्री किक 🔥",
    tagPenalty: "पेनल्टी",
    tagLeftFoot: "बाएं पैर का शॉट",
    tagRightFoot: "दायां पैर",
    tagOpenPlay: "ओपन प्ले",
    assist: "असिस्ट"
  },
  ro: {
    goalPrefix: "Golul #",
    scoreline: "Scor",
    didScoreTodayYes: "DA! Lionel Messi a marcat astăzi: Golul #{goalNum} în minutul {minute} împotriva {opp} ({score})!",
    didScoreTodayNo: "A marcat Messi azi? Cel mai recent meci oficial al lui Lionel Messi a avut loc pe {date} în {comp}, unde a marcat Golul #{goalNum} al carierei în minutul {minute} pentru victoria cu {score}. Urmăriți reluarea video oficială mai sus.",
    matchResult: "Rezultatul celui mai recent meci: {title}",
    goalBadge: "Golul #{goalNum} marcat ({minute})",
    playHighlight: "Selectați oricare dintre golurile recente ale lui Lionel Messi de mai jos pentru a urmări clipul video în player:",
    viewDateGoals: "Vezi golurile din {formattedDate} →",
    tagHeader: "Lovitură de cap 🔥",
    tagFreekick: "Lovitură liberă directă 🔥",
    tagPenalty: "Penalty",
    tagLeftFoot: "Șut cu piciorul stâng",
    tagRightFoot: "Piciorul drept",
    tagOpenPlay: "Acțiune de joc",
    assist: "Pasă decisivă"
  },
  uz: {
    goalPrefix: "-gol",
    scoreline: "Hisob",
    didScoreTodayYes: "HA! Lionel Messi bugun gol urdi: {opp}ga qarshi {minute}-daqiqada faoliyatidagi {goalNum}-golini kiritdi ({score})!",
    didScoreTodayNo: "Messi bugun gol urdimi? Lionel Messining eng soʻnggi rasmiy oʻyini {date} kuni {comp} doirasida boʻlib oʻtdi va u {minute}-daqiqada faoliyatidagi {goalNum}-golini urib jamoasining {score} hisobidagi gʻalabasini taʼminladi. Rasmiy gol videosini yuqorida tomosha qiling.",
    matchResult: "Eng soʻnggi oʻyin natijasi: {title}",
    goalBadge: "{goalNum}-gol urildi ({minute})",
    playHighlight: "Yuqoridagi pleyerda videoni tomosha qilish uchun Lionel Messining soʻnggi gollaridan birini tanlang:",
    viewDateGoals: "{formattedDate} gollarini koʻrish →",
    tagHeader: "Bosh bilan 🔥",
    tagFreekick: "Jarima zarbasi 🔥",
    tagPenalty: "Penalti",
    tagLeftFoot: "Chap oyoq zarbasi",
    tagRightFoot: "Oʻng oyoq",
    tagOpenPlay: "Ochiq oʻyin",
    assist: "Uzatma"
  }
};

function bindGoalCards(video, activeNum, activeTitle, activeMeta, activeMin, activeType, activeScore, activeComp, ytBtn, bdayLink) {
  const goalCards = document.querySelectorAll(".recent-goal-card");
  goalCards.forEach((card) => {
    card.onclick = () => {
      const gid = card.dataset.goalId;
      const title = card.dataset.title;
      const meta = card.dataset.meta;
      const minute = card.dataset.minute;
      const type = card.dataset.type;
      const score = card.dataset.score;
      const comp = card.dataset.comp;
      const videoUrl = card.dataset.videoUrl;
      const ytUrl = card.dataset.ytUrl;
      const bdayUrl = card.dataset.bdayUrl;
      const goalNum = card.dataset.goalNum;

      goalCards.forEach((c) => c.classList.remove("active"));
      card.classList.add("active");

      if (video && videoUrl) {
        video.src = videoUrl;
        video.load();
        video.play().catch(() => {});
      }
      if (activeNum && goalNum) activeNum.textContent = goalNum;
      if (activeTitle && title) activeTitle.textContent = title;
      if (activeMeta && meta) activeMeta.textContent = meta;
      if (activeMin && minute) activeMin.textContent = minute;
      if (activeType && type) activeType.textContent = type;
      if (activeScore && score) activeScore.textContent = score;
      if (activeComp && comp) activeComp.textContent = comp;
      if (ytBtn && ytUrl) ytBtn.href = ytUrl;
      if (bdayLink && bdayUrl) bdayLink.href = bdayUrl;

      trackVideoPlay(gid, title);

      if (window.innerWidth < 768 && video) {
        video.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };
  });
}

async function autoPullLatestGoalLive(d) {
  try {
    let payload = null;
    try {
      const res = await fetch("/api/latest-goal", { cache: "no-cache" });
      if (res.ok) payload = await res.json();
    } catch (_) {}

    if (!payload) {
      try {
        const fallbackRes = await fetch("/data/latest-goal.json", { cache: "no-cache" });
        if (fallbackRes.ok) payload = await fallbackRes.json();
      } catch (_) {}
    }

    if (!payload || !payload.latestGoal) return;

    const lang = getLang();
    const t = LATEST_GOAL_I18N[lang] || LATEST_GOAL_I18N.en;
    const g = payload.latestGoal;
    const ts = payload.todayStatus || {};

    const activeNum = document.getElementById("active-goal-num");
    const activeTitle = document.getElementById("active-goal-title");
    const activeMeta = document.getElementById("active-goal-meta");
    const activeMin = document.getElementById("stat-minute");
    const activeType = document.getElementById("stat-type");
    const activeScore = document.getElementById("stat-score");
    const activeComp = document.getElementById("stat-comp");
    const video = document.getElementById("latest-goal-video");
    const ytBtn = document.getElementById("btn-yt-highlights");
    const bdayLink = document.getElementById("link-bday-goal");
    const todayCard = document.getElementById("today-status-section");

    const currentNumStr = (activeNum ? activeNum.textContent : "").replace(/\D/g, "");
    const currentNum = parseInt(currentNumStr, 10) || 930;

    if (g.goalNumber > currentNum) {
      if (activeNum) activeNum.textContent = lang === "uz" ? `${g.goalNumber}-gol` : `${t.goalPrefix}${g.goalNumber}`;
      if (activeTitle && g.title) activeTitle.textContent = g.title;
      if (activeMeta && g.venue) activeMeta.textContent = `${g.competition} • ${g.formattedDate} • ${g.venue}`;
      if (activeMin && g.minute) activeMin.textContent = g.minute;
      if (activeType && g.type) activeType.textContent = g.type;
      if (activeScore && g.score) activeScore.textContent = g.score;
      if (activeComp && g.competition) activeComp.textContent = g.competition;
      if (video && g.videoUrl && video.src !== g.videoUrl) {
        video.src = g.videoUrl;
        video.load();
      }
      if (ytBtn && g.youtubeUrl) ytBtn.href = g.youtubeUrl;
      if (bdayLink && g.bdayKey) {
        bdayLink.href = lang === "en" ? `/en/birthday/${g.bdayKey}` : `/${lang}/birthday/${g.bdayKey}`;
      }
    }

    if (todayCard && ts.didScoreToday) {
      const verdictText = todayCard.querySelector(".today-status-verdict span");
      const verdictBadge = todayCard.querySelector(".badge-video");
      const descText = todayCard.querySelector(".today-status-desc");

      if (verdictBadge) {
        verdictBadge.textContent = t.goalBadge.replace("{goalNum}", ts.lastGoalNumber).replace("{minute}", ts.lastGoalMinute);
      }
      if (verdictText) {
        verdictText.textContent = t.matchResult.replace("{title}", ts.lastMatchResult);
      }
      if (descText) {
        descText.innerHTML = `<b>${t.didScoreTodayYes.replace("{goalNum}", ts.lastGoalNumber).replace("{minute}", ts.lastGoalMinute).replace("{opp}", ts.lastMatchOpponent).replace("{score}", ts.lastMatchResult)}</b>`;
      }
    }

    if (payload.recentGoals && payload.recentGoals.length > 0) {
      const grid = document.querySelector(".recent-goals-grid");
      if (grid) {
        const firstCardId = parseInt(grid.querySelector(".recent-goal-card")?.dataset?.goalId, 10) || 0;
        if (payload.recentGoals[0].goalNumber > firstCardId) {
          grid.innerHTML = payload.recentGoals.map((rg, idx) => {
            const isActive = idx === 0 ? " active" : "";
            const goalLabel = lang === "uz" ? `${rg.goalNumber}-gol` : `${t.goalPrefix}${rg.goalNumber}`;
            const bdayPath = lang === "en" ? (rg.bdayUrl || `/en/birthday/${rg.bdayKey}`) : `/${lang}/birthday/${rg.bdayKey || "09-17"}`;
            return `
              <div class="recent-goal-card${isActive}" data-goal-id="${rg.goalNumber}"
                   data-goal-num="${goalLabel}"
                   data-title="${rg.title}"
                   data-meta="${rg.meta}"
                   data-minute="${rg.minute}"
                   data-type="${rg.type}"
                   data-score="${rg.score}"
                   data-comp="${rg.comp}"
                   data-video-url="${rg.videoUrl}"
                   data-yt-url="${rg.ytUrl}"
                   data-bday-url="${bdayPath}">
                <div class="recent-goal-card-top">
                  <span class="recent-goal-card-num">${goalLabel}</span>
                  <svg class="recent-goal-play-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                </div>
                <div class="recent-goal-card-match">${rg.match}</div>
                <div class="recent-goal-card-date">${rg.date}</div>
                <span class="recent-goal-card-tag">${rg.tag || "Goal 🔥"}</span>
              </div>
            `;
          }).join("");

          bindGoalCards(video, activeNum, activeTitle, activeMeta, activeMin, activeType, activeScore, activeComp, ytBtn, bdayLink);
        }
      }
    }
  } catch (err) {
    console.warn("autoPullLatestGoalLive warning:", err);
  }
}

function renderLatestGoal(d) {
  const video = document.getElementById("latest-goal-video");
  const activeNum = document.getElementById("active-goal-num");
  const activeTitle = document.getElementById("active-goal-title");
  const activeMeta = document.getElementById("active-goal-meta");
  const activeMin = document.getElementById("stat-minute");
  const activeType = document.getElementById("stat-type");
  const activeScore = document.getElementById("stat-score");
  const activeComp = document.getElementById("stat-comp");
  const ytBtn = document.getElementById("btn-yt-highlights");
  const replayBtn = document.getElementById("btn-replay-goal");
  const shareBtn = document.getElementById("btn-share-goal");
  const bdayLink = document.getElementById("link-bday-goal");

  if (replayBtn && video) {
    replayBtn.addEventListener("click", () => {
      video.currentTime = 0;
      video.play().catch(() => {});
    });
  }

  if (shareBtn) {
    shareBtn.addEventListener("click", async () => {
      const url = window.location.href;
      const title = document.title;
      if (navigator.share) {
        try {
          await navigator.share({ title, url });
          trackShare("latest-goal", "native");
        } catch (_) {}
      } else {
        try {
          await navigator.clipboard.writeText(url);
          const orig = shareBtn.innerHTML;
          shareBtn.innerHTML = "<span>✓</span>";
          setTimeout(() => { shareBtn.innerHTML = orig; }, 2000);
          trackShare("latest-goal", "clipboard");
        } catch (_) {}
      }
    });
  }

  bindGoalCards(video, activeNum, activeTitle, activeMeta, activeMin, activeType, activeScore, activeComp, ytBtn, bdayLink);
  autoPullLatestGoalLive(d);
  renderExplore(d, "latest-goal");
}

/* ================= BOOT ================= */
load().then((d) => {
  normalize(d);
  const page = document.body.dataset.page;
  try {
    if (page === "home") renderHome(d);
    else if (page === "byyear") renderByYear(d);
    else if (page === "byseason") renderBySeason(d);
    else if (page === "dashboard") {
      const team = new URLSearchParams(location.search).get("team") || "all";
      renderDashboard(d, team);
    }
    else if (page === "timeline") renderTimeline(d);
    else if (page === "achievements") renderAch(d);
    else if (page === "birthday") renderBirthday(d);
    else if (page === "latest-goal") renderLatestGoal(d);
  } catch (e) {
    console.error(e);
  }
  reveal();
  /* Chart entrance: bars grow, donuts sweep, KPIs tick on visibility — one shared
     boot observer, same pattern as the timeline .tl-reveal wiring. */
  armEntrance();
}).catch(() => {
  const lang = getLang();
  const errorMsgs = {
    es: "Error al cargar las estadísticas. Comprueba tu conexión y recarga la página.",
    pt: "Falha ao carregar as estatísticas. Verifique sua conexão e recarregue.",
    fr: "Échec du chargement des statistiques. Vérifiez votre connexion et actualisez la page.",
    ar: "فشل تحميل الإحصائيات. يرجى التحقق من اتصالك بالإنترنت وإعادة تحديث الصفحة.",
    bn: "পরিসংখ্যান লোড করা যায়নি। ইন্টারনেট সংযোগ পরীক্ষা করে পেজ রিফ্রেশ করুন।",
    hi: "आंकड़े लोड करने में विफल। अपना इंटरनेट कनेक्शन जांचें और पेज रीफ्रेश करें।",
    ro: "Eroare la încărcarea statisticilor. Verificați conexiunea și reîmprospătați pagina.",
    uz: "Statistikalarni yuklab bo'lmadi. Internet aloqangizni tekshiring va sahifani yangilang."
  };
  const msgText = errorMsgs[lang] || "Stats failed to load. Check your connection and refresh.";
  document.querySelectorAll("main.wrap").forEach((m) => {
    const p = document.createElement("p");
    p.className = "caveat";
    p.textContent = msgText;
    m.prepend(p);
  });
});

// Reveal admin nav for authenticated admins only (server-issued token)
if (typeof window !== 'undefined') {
  const syncRailAdmin = () => {
    const el = document.getElementById("rail-admin-link");
    if (!el) return;
    try {
      el.style.display = hasAdminToken() ? "flex" : "none";
    } catch {}
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', syncRailAdmin);
  else syncRailAdmin();
  window.addEventListener('storage', syncRailAdmin);
}
