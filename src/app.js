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
    if (lang === "es") {
      el("foot-date").textContent =
        `Lionel Messi: ${n(d.totals.apps)} partidos oficiales senior, ${n(d.totals.goals)} goles ` +
        `(${n(d.totals.clubs.apps)} PJ / ${n(d.totals.clubs.goals)} goles en clubes, ` +
        `${n(d.totals.country.apps)} / ${n(d.totals.country.goals)} con Argentina). Actualizado al ${d.lastUpdated}.`;
    } else if (lang === "pt") {
      el("foot-date").textContent =
        `Lionel Messi: ${n(d.totals.apps)} partidas oficiais seniores, ${n(d.totals.goals)} gols ` +
        `(${n(d.totals.clubs.apps)} jogos / ${n(d.totals.clubs.goals)} gols por clubes, ` +
        `${n(d.totals.country.apps)} / ${n(d.totals.country.goals)} pela Argentina). Atualizado em ${d.lastUpdated}.`;
    } else {
      el("foot-date").textContent =
        `Lionel Messi: ${n(d.totals.apps)} senior appearances, ${n(d.totals.goals)} goals ` +
        `(${n(d.totals.clubs.apps)} apps / ${n(d.totals.clubs.goals)} goals club, ` +
        `${n(d.totals.country.apps)} / ${n(d.totals.country.goals)} Argentina). Last checked ${d.lastUpdated}.`;
    }
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
  { href: "/en/messi-vs-ronaldo", page: "messi-vs-ronaldo", t: "🐐 Messi vs Ronaldo All-Time", d: () => "Head-to-head career stats: 929 vs 924 goals, 46 vs 35 trophies, 8 vs 5 Ballons d'Or." },
  { href: "/en/vs-real-madrid", page: "vs-real-madrid", t: "⚔️ Messi vs Real Madrid", d: () => "All 26 El Clásico goals, 45 matches, 14 assists, hat-tricks, and video clips." },
  { href: "/en/champions-league", page: "champions-league", t: "⭐ Champions League Record", d: () => "129 UEFA Champions League goals, 8 hat-tricks, and 4 European titles." },
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
    { href: "/es/messi-vs-ronaldo", page: "messi-vs-ronaldo", t: "🐐 Messi vs Ronaldo Histórico", d: () => "Estadísticas cara a cara: 929 vs 924 goles, 46 vs 35 títulos, 8 vs 5 Balones de Oro." },
    { href: "/es/vs-real-madrid", page: "vs-real-madrid", t: "⚔️ Messi vs Real Madrid", d: () => "Los 26 goles en El Clásico, 45 partidos, 14 asistencias, hat-tricks y videos." },
    { href: "/es", page: "home", t: "Estadísticas de Messi", d: (d) => `Las cifras clave: ${n(d.totals.goals)} goles en ${n(d.totals.apps)} partidos profesionales.` },
    { href: "/es/goalsbyyear", page: "byyear", t: "Goles de Messi por año", d: (d) => `Cada año natural de 2004 a 2026 y el camino hacia los ${n(d.totals.goals)}.` },
    { href: "/es/goalsbyseason", page: "byseason", t: "Goles de Messi por temporada", d: () => "Desglose de liga, copas y torneos continentales para cada temporada." },
    { href: "/es/dashboard", page: "dashboard", t: "Panel interactivo de Messi", d: () => "Filtra todos los gráficos por Barcelona, PSG, Inter Miami o Argentina." },
    { href: "/es/timeline", page: "timeline", t: "Lionel Messi en el tiempo", d: () => "Cada hito histórico de su carrera, fechado y en orden, de 2004 a hoy." },
    { href: "/es/achievements", page: "achievements", t: "Títulos y premios de Messi", d: () => "Los 46 títulos de equipo más el récord de 8 Balones de Oro." }
  ],
  pt: [
    { href: "/pt/birthday", page: "birthday", t: "🎂 ¿Marcou Messi no seu aniversário?", d: (d) => `Pesquise os 366 dias do ano com vídeos de todos os ${n(d.totals.goals)} gols de Messi.` },
    { href: "/pt/messi-vs-ronaldo", page: "messi-vs-ronaldo", t: "🐐 Messi vs Ronaldo Histórico", d: () => "Estatísticas cara a cara: 929 vs 924 gols, 46 vs 35 títulos, 8 vs 5 Bolas de Ouro." },
    { href: "/pt/vs-real-madrid", page: "vs-real-madrid", t: "⚔️ Messi vs Real Madrid", d: () => "Os 26 gols no El Clásico, 45 partidas, 14 assistências e hat-tricks." },
    { href: "/pt", page: "home", t: "Estatísticas de Lionel Messi", d: (d) => `Os números oficiais: ${n(d.totals.goals)} gols em ${n(d.totals.apps)} partidas profissionais.` },
    { href: "/pt/goalsbyyear", page: "byyear", t: "Gols de Messi por ano", d: (d) => `Todos os anos civis de 2004 a 2026 e o recorde de 91 gols.` },
    { href: "/pt/goalsbyseason", page: "byseason", t: "Gols de Messi por temporada", d: () => "Divisão de liga, copas e torneios continentais para cada temporada." },
    { href: "/pt/dashboard", page: "dashboard", t: "Painel de estatísticas", d: () => "Filtre todos os gráficos por Barcelona, PSG, Inter Miami ou Argentina." },
    { href: "/pt/timeline", page: "timeline", t: "História e Linha do tempo", d: () => "Cada momento da carreira em ordem cronológica de 2004 até hoje." },
    { href: "/pt/achievements", page: "achievements", t: "Títulos e troféus", d: () => "Todos os 46 títulos oficiais mais o recorde de 8 Bolas de Ouro." }
  ],
  fr: [
    { href: "/fr/birthday", page: "birthday", t: "🎂 Messi a-t-il marqué le jour de votre anniversaire ?", d: (d) => `Recherchez parmi les 366 jours de l'année avec vidéos des ${n(d.totals.goals)} buts.` },
    { href: "/fr/messi-vs-ronaldo", page: "messi-vs-ronaldo", t: "🐐 Messi vs Ronaldo Face-à-Face", d: () => "Statistiques historiques : 929 vs 924 buts, 46 vs 35 titres, 8 vs 5 Ballons d'Or." },
    { href: "/fr/vs-real-madrid", page: "vs-real-madrid", t: "⚔️ Messi vs Real Madrid", d: () => "Tous les 26 buts dans le Clásico, 45 matchs, 14 passes décisives." },
    { href: "/fr", page: "home", t: "Statistiques de Lionel Messi", d: (d) => `Les chiffres clés : ${n(d.totals.goals)} buts en ${n(d.totals.apps)} matchs officiels.` },
    { href: "/fr/goalsbyyear", page: "byyear", t: "Buts de Messi par année", d: (d) => `Chaque année civile de 2004 à 2026 et le record de 91 buts.` },
    { href: "/fr/goalsbyseason", page: "byseason", t: "Buts de Messi par saison", d: () => "Répartition par championnat, coupes et Ligue des Champions." },
    { href: "/fr/dashboard", page: "dashboard", t: "Tableau de bord interactif", d: () => "Filtrez par Barcelone, PSG, Inter Miami ou Argentine." },
    { href: "/fr/timeline", page: "timeline", t: "Chronologie de sa carrière", d: () => "Chaque événement historique daté dans l'ordre chronologique." },
    { href: "/fr/achievements", page: "achievements", t: "Palmarès et trophées", d: () => "Les 46 trophées collectifs et le record de 8 Ballons d'Or." }
  ],
  ar: [
    { href: "/ar/birthday", page: "birthday", t: "🎂 هل سجل ميسي في يوم ميلادك؟", d: (d) => `ابحث في جميع أيام السنة الـ 366 مع مقاطع الفيديو لـ ${n(d.totals.goals)} هدفاً.` },
    { href: "/ar/messi-vs-ronaldo", page: "messi-vs-ronaldo", t: "🐐 ميسي ضد رونالدو تاريخياً", d: () => "مقارنة المسيرة: 929 ضد 924 هدفاً، 46 ضد 35 بطولة، و8 كرات ذهبية." },
    { href: "/ar/vs-real-madrid", page: "vs-real-madrid", t: "⚔️ ميسي ضد ريال مدريد", d: () => "26 هدفاً في الكلاسيكو، 45 مباراة و14 تمريرة حاسمة." },
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
    { href: "/bn", page: "home", t: "লিওনেল মেসির পরিসংখ্যান", d: (d) => `অফিসিয়াল তথ্য: ${n(d.totals.apps)} ম্যাচে ${n(d.totals.goals)} গোল।` },
    { href: "/bn/goalsbyyear", page: "byyear", t: "বছরভিত্তিক গোল", d: (d) => `২০০৪ থেকে ২০২৬ এবং ২০১২ সালে ৯১ গোলের বিশ্বরেকর্ড।` },
    { href: "/bn/goalsbyseason", page: "byseason", t: "মৌসুমভিত্তিক গোল", d: () => "লীগ, কাপ ও চ্যাম্পিয়ন্স লীগের পরিসংখ্যান।" },
    { href: "/bn/dashboard", page: "dashboard", t: "ইন্টারেক্টিভ ড্যাশবোর্ড", d: () => "বার্সেলোনা, পিএসজি, ইন্টার মায়ামি ও আর্জেন্টিনার পরিসংখ্যান।" },
    { href: "/bn/timeline", page: "timeline", t: "ক্যারিয়ার টাইমলাইন", d: () => "২০০৪ থেকে আজ পর্যন্ত প্রতিটি ঐতিহাসিক মুহূর্ত।" },
    { href: "/bn/achievements", page: "achievements", t: "ট্রফি ও খেতাব", d: () => "সর্বকালের রেকর্ড ৪৬টি অফিশিয়াল খেতাব ও ৮টি ব্যালন ডি'অর।" }
  ],
  hi: [
    { href: "/hi/birthday", page: "birthday", t: "🎂 क्या मेसी ने आपके जन्मदिन पर गोल किया था?", d: (d) => `साल के 366 दिनों में मेसी के ${n(d.totals.goals)} गोल वीडियो देखें।` },
    { href: "/hi/messi-vs-ronaldo", page: "messi-vs-ronaldo", t: "🐐 मेसी बनाम रोनाल्डो", d: () => "करियर आंकड़े: 929 बनाम 924 गोल, 46 बनाम 35 खिताब, 8 बैलन डी'ओर।" },
    { href: "/hi/vs-real-madrid", page: "vs-real-madrid", t: "⚔️ मेसी बनाम रियल मैड्रिड", d: () => "एल क्लासिको में 26 गोल, 45 मैच और 14 असिस्ट।" },
    { href: "/hi", page: "home", t: "मेसी के आधिकारिक आंकड़े", d: (d) => `${n(d.totals.apps)} आधिकारिक मैचों में ${n(d.totals.goals)} गोल।` },
    { href: "/hi/goalsbyyear", page: "byyear", t: "साल दर साल गोल", d: (d) => `2004 से 2026 और 2012 में 91 गोलों का विश्व रिकॉर्ड।` },
    { href: "/hi/goalsbyseason", page: "byseason", t: "सीज़न अनुसार गोल", d: () => "लीग, कप और महाद्वीपीय प्रतियोगिताओं का विवरण।" },
    { href: "/hi/dashboard", page: "dashboard", t: "इंटरएक्टिव डैशबोर्ड", d: () => "बार्सिलोना, पीएसजी, मियामी और अर्जेंटीना अनुसार फ़िल्टर।" },
    { href: "/hi/timeline", page: "timeline", t: "करियर टाइमलाइन", d: () => "2004 से आज तक का हर ऐतिहासिक पड़ाव।" },
    { href: "/hi/achievements", page: "achievements", t: "खिताब और अवॉर्ड", d: () => "रिकॉर्ड 46 खिताब और 8 बैलन डी'ओर।" }
  ],
  ro: [
    { href: "/ro/birthday", page: "birthday", t: "🎂 A marcat Messi de ziua ta de naștere?", d: (d) => `Caută în toate cele 366 de zile din an cu cele ${n(d.totals.goals)} goluri ale lui Messi.` },
    { href: "/ro/messi-vs-ronaldo", page: "messi-vs-ronaldo", t: "🐐 Messi vs Ronaldo All-Time", d: () => "Statistici cap la cap: 929 vs 924 goluri, 46 vs 35 trofee, 8 Baloane de Aur." },
    { href: "/ro/vs-real-madrid", page: "vs-real-madrid", t: "⚔️ Messi vs Real Madrid", d: () => "Toate cele 26 de goluri din El Clásico, 45 de meciuri, 14 pase de gol." },
    { href: "/ro", page: "home", t: "Statisticile lui Lionel Messi", d: (d) => `Cifrele cheie: ${n(d.totals.goals)} goluri în ${n(d.totals.apps)} meciuri oficiale.` },
    { href: "/ro/goalsbyyear", page: "byyear", t: "Golurile lui Messi pe ani", d: (d) => `Fiecare an calendaristic din 2004 până în 2026 și recordul de 91.` },
    { href: "/ro/goalsbyseason", page: "byseason", t: "Golurile lui Messi pe sezoane", d: () => "Campionat, cupe interne și meciuri europene." },
    { href: "/ro/dashboard", page: "dashboard", t: "Panoul interactiv de statistici", d: () => "Filtrează pe Barcelona, PSG, Inter Miami sau Argentina." },
    { href: "/ro/timeline", page: "timeline", t: "Cronologia carierei", d: () => "Fiecare moment istoric datat din 2004 până azi." },
    { href: "/ro/achievements", page: "achievements", t: "Trofeele și premiile lui Messi", d: () => "Toate cele 46 de trofee colective plus 8 Baloane de Aur." }
  ],
  uz: [
    { href: "/uz/birthday", page: "birthday", t: "🎂 Messi sizning tug'ilgan kuningizda gol urganmi?", d: (d) => `Yilning 366 kunidagi gollarni videolar bilan ko'ring (${n(d.totals.goals)} ta gol).` },
    { href: "/uz/messi-vs-ronaldo", page: "messi-vs-ronaldo", t: "🐐 Messi vs Ronaldu Tarixiy", d: () => "O'zaro solishtirma: 929 ga 924 ta gol, 46 ga 35 ta titul, 8 ta “Oltin to'p”." },
    { href: "/uz/vs-real-madrid", page: "vs-real-madrid", t: "⚔️ Messi vs Real Madrid", d: () => "El-Klasikodagi 26 ta gol, 45 ta o'yin va 14 ta assist." },
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

  s += `<line class="baseline" x1="0" y1="${base}" x2="${W}" y2="${base}"></line>`;
  s += `<text class="axis" x="4" y="${(base - maxH + 4).toFixed(1)}">${max}${opts.cumulative ? " /yr" : ""}</text><text class="axis" x="4" y="${(base - 4).toFixed(1)}">0</text>`;

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

    // Subtle area under cumulative curve
    s += `<polygon class="cum-area" points="${firstX},${base} ${pts.join(" ")} ${lastX},${base}" fill="url(#cumAreaGrad)"/>`;
    // 1,000 goal target line
    s += `<line class="thousand" x1="0" y1="${targetY}" x2="${W}" y2="${targetY}"/><text class="thousand-label" x="${W - 10}" y="${targetY - 6}">1,000 goal target</text>`;
    // Right axis for cumulative career total
    s += `<text class="axis right" x="${W - 10}" y="${targetY + 16}" text-anchor="end">${n(tot)} now</text>`;
    // Cumulative climb line
    s += `<polyline class="cum" points="${pts.join(" ")}"/>`;
    // Current total marker dot
    s += `<circle class="cum-dot" cx="${lastX}" cy="${lastY}" r="5"><title>Current career total: ${n(tot)} goals</title></circle>`;
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
  return `<p class="caveat">Penalties (109), free kicks (66), hat-tricks (57) and assists (400) are widely published compiled tallies, shown as provisional until a true match-by-match hand count is finished.</p>`;
}
function methodColophon(inner) {
  return `<div class="colophon"><p>How I put these numbers together — counted by hand and checked twice against named sources.</p>${inner}${provisionalNote()}</div>`;
}
/* ================= HOME ================= */
function renderHome(d) {
  const t = d.totals, agg = clubAgg(d), p = d.profile;
  const seasons = d.clubSeasons.length;
  const lang = (document.documentElement.lang || "en").toLowerCase().split("-")[0];
  const isEs = lang === "es";
  const isEn = lang === "en";

  if (isEs) {
    setHead(d, `<b>${n(t.goals)} goles oficiales</b> en <b>${n(t.apps)} partidos profesionales</b> con Barcelona, PSG, Inter Miami y Selección Argentina.`);
  } else {
    setHead(d, `<b>${n(t.goals)} goals</b> in <b>${n(t.apps)} senior appearances</b> — for Barcelona, PSG, ${esc(p.current.join(" and "))}. ` +
      `A World Cup winner and record eight-time Ballon d'Or holder, counted by hand and checked twice, as of ${esc(d.lastUpdated)}.`);
  }

  const prof = el("profile");
  if (prof) {
    const dob = new Date(p.born + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    prof.innerHTML =
      `<figure class="identity-photo"><picture><source srcset="/img/messi-450.webp 1x, /img/messi.webp 2x" type="image/webp"><img src="/img/messi.jpg" alt="Lionel Messi" width="148" height="197" loading="eager" fetchpriority="high" decoding="async"></picture><figcaption class="photo-credit">Lionel Messi · Argentina & Inter Miami</figcaption></figure><div class="identity-main">` +
      `<p class="identity-name">${esc(p.short)} <span class="jersey" aria-label="Shirt number 10">${p.number}</span></p>` +
      `<p class="identity-meta">${esc(p.name)}, born ${dob} in ${esc(p.birthplace)}. ` +
      `He is ${p.age}, plays as a ${esc(p.position.toLowerCase())} and is currently at ${esc(p.current.join(" and "))}.</p>` +
      `<dl class="identity-facts"><div><dt>Role</dt><dd>${esc(p.role)}</dd></div>` +
      `<div><dt>Teams</dt><dd>${esc(p.teams.join(" · "))}</dd></div>` +
      `<div><dt>Now</dt><dd>${esc(p.current.join(" · "))}</dd></div></dl></div>`;
    prof.classList.add("identity--tight");
  }

  const kpis = el("kpis");
  function kpi(l, v, s) { return `<div class="kpi"><span class="kpi-label">${l}</span><span class="kpi-value">${v}</span><span class="kpi-note">${s}</span></div>`; }
  if (kpis) {
    if (isEn) {
      const togo = 1000 - t.goals;
      const done = d.calendarYears.filter((r) => !r.provisional);
      const last3 = done.slice(-3);
      const pace = last3.reduce((s, r) => s + r.goals, 0) / last3.length;
      const projYear = done[done.length - 1].year + Math.max(1, Math.ceil(togo / pace));
      kpis.innerHTML =
        kpi("Career goals", n(t.goals), `${t.goalsPerGame} goals per game across ${seasons} club seasons.`) +
        kpi("Senior appearances", n(t.apps), `${n(t.clubs.apps)} club, ${n(t.country.apps)} Argentina.`) +
        kpi("Argentina goals", n(t.country.goals), `${gpg(t.country.goals, t.country.apps)} per cap across ${n(t.country.apps)} caps.`) +
        kpi("Team trophies", "46", `Plus a record 8 Ballons d'Or. <a href="/en/achievements">Full honours list</a>.`) +
        `<div class="kpi progress"><span class="kpi-label">Road to 1,000 goals</span>` +
        `<span class="kpi-value">${n(t.goals)} <small style="font-size:1rem;color:var(--muted)">/ 1,000</small></span>` +
        `<div class="progress-track"><div class="progress-fill" style="width:${(t.goals / 10).toFixed(1)}%"></div></div>` +
        `<span class="kpi-note">${togo} to go${d.calendarYears[d.calendarYears.length - 1].provisional ? ", 2026 season in progress" : ""}. ` +
        `Rough projection at his ${last3[0].year}–${last3[last3.length - 1].year} pace (~${pace.toFixed(0)} a year): 1,000 lands around ${projYear}.</span></div>`;
      kpis.classList.add("kpi--hero");
      if (!el("copyStats")) {
        kpis.insertAdjacentHTML("afterend",
          `<div class="share-row"><button type="button" class="btn-primary" id="copyStats">Copy headline stats</button>` +
          `<span class="share-msg" id="copyMsg" role="status" aria-live="polite"></span></div>`);
      }
    } else if (isEs && kpis.children.length === 0) {
      kpis.innerHTML =
        kpi("Goles en su carrera", n(t.goals), `${t.goalsPerGame} goles por partido en ${seasons} temporadas.`) +
        kpi("Partidos oficiales", n(t.apps), `${n(t.clubs.apps)} en clubes, ${n(t.country.apps)} con Argentina.`) +
        kpi("Goles con Argentina", n(t.country.goals), `${gpg(t.country.goals, t.country.apps)} por partido en ${n(t.country.apps)} partidos.`) +
        kpi("Títulos oficiales", "46", `Récord mundial absoluto más 8 Balones de Oro.`);
    }
  }

  const copyStatsBtn = el("copyStats");
  if (copyStatsBtn) {
    copyStatsBtn.addEventListener("click", async () => {
      const text = isEs
        ? `Messi: ${n(t.goals)} goles en ${n(t.apps)} partidos oficiales (${n(t.clubs.goals)} en clubes, ${n(t.country.goals)} con Argentina), 46 títulos oficiales, 8 Balones de Oro — al ${d.lastUpdated}.`
        : `Messi: ${n(t.goals)} goals in ${n(t.apps)} senior apps (${n(t.clubs.goals)} club, ${n(t.country.goals)} Argentina), 46 trophies, 8 Ballons d'Or — as of ${d.lastUpdated}.`;
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
        if (msg) msg.textContent = isEs ? "Copiado al portapapeles." : "Copied — paste it anywhere.";
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
  if (qa && isEn) {
    const Q = [
      ["How many goals has Lionel Messi scored?", `<b>${n(t.goals)} career goals</b> in ${n(t.apps)} senior appearances for club and country as of ${esc(d.lastUpdated)}, a rate of ${t.goalsPerGame} goals per game. See the full <a href="/en/goalsbyyear">year-by-year breakdown</a>.`],
      ["How many goals did Messi score for Barcelona?", `<b>${n(agg.barcelona.goals)} goals</b> in ${n(agg.barcelona.apps)} games from 2004 to 2021 — including a record 474 in La Liga.`],
      ["How many goals for PSG and Inter Miami?", `<b>${agg.psg.goals} for Paris Saint-Germain</b> and <b>${n(agg.miami.goals)} for Inter Miami</b> (2026 season in progress).`],
      ["How many goals has Messi scored for Argentina?", `<b>${n(t.country.goals)} goals</b> in ${n(t.country.apps)} caps since 2005, including World Cup, Copa América and qualifying goals.`],
      ["What is Messi's best goalscoring year?", `<b>2012, with 91 goals</b> — the most any player has scored in a calendar year. See <a href="/en/goalsbyyear">every year</a>.`],
      ["How many trophies has Messi won?", `<b>46 team titles</b> — 35 with Barcelona, 3 with PSG, 3 with Inter Miami and 5 with Argentina — plus 8 Ballons d'Or. <a href="/en/achievements">The full list</a>.`],
    ];
    qa.innerHTML = Q.map((q) => `<details class="faq-item"><summary class="faq-question"><span>${q[0]}</span><span class="faq-chevron" aria-hidden="true">▾</span></summary><div class="faq-answer"><p>${q[1]}</p></div></details>`).join("");
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
    const caption = isEs
      ? `Partidos y goles en cada equipo senior para Lionel Messi, al ${esc(d.lastUpdated)}. Desglose por competición en la <a href="/es/goalsbyseason">página de temporadas</a>.`
      : `Appearances and goals for every senior team Lionel Messi has played for, as of ${esc(d.lastUpdated)}. Full competition splits are on the <a href="/en/goalsbyseason">goals by season page</a>.`;
    const thTeam = isEs ? "Equipo y años" : "Team and years";
    const thApps = isEs ? "PJ" : "Apps";
    const thGoals = isEs ? "Goles" : "Goals";
    const thGpg = isEs ? "Goles / PJ" : "Goals per game";
    const thTotal = isEs ? "Total carrera" : "Career total";

    clubCard.innerHTML =
      `<table class="data-table"><caption>${caption}</caption>` +
      `<thead><tr><th scope="col" class="left">${thTeam}</th><th scope="col">${thApps}</th><th scope="col">${thGoals}</th><th scope="col">${thGpg}</th></tr></thead>` +
      `<tbody>${rows}<tr class="total"><th scope="row">${thTotal}</th><td>${n(t.apps)}</td><td>${n(t.goals)}</td><td>${t.goalsPerGame}</td></tr></tbody></table>` + clubTableCaption();
    const cTable = clubCard.querySelector("table");
    if (cTable) sortable(cTable);
  }

  // year widget: dropdown + tiles + full-range bars
  const ys = d.calendarYears;
  const cur = ys[ys.length - 1];
  const yearSub = el("year-sub");
  if (yearSub) {
    yearSub.textContent = `Pick a year and watch the running total climb — all the way from his 2004 debut to today.`;
  }
  const yearWidget = el("year-widget");
  if (yearWidget) {
    yearWidget.innerHTML =
      `<div class="year-pick-head"><h3 class="year-pick-title">Messi stats by calendar year</h3>` +
      `<div class="year-pick-control"><label for="yearPick">Year</label><select id="yearPick" class="inline">` +
      ys.slice().reverse().map((r) => `<option value="${r.year}"${r.year === cur.year ? " selected" : ""}>${r.year}</option>`).join("") +
      `</select></div></div><div class="year-tiles" id="yearTiles"></div>` +
      `<figure style="margin:12px 0 0"><div class="spark-wrap" id="yearSpark"></div>` +
      `<figcaption class="figcap">Calendar-year goals, ${ys[0].year} to ${cur.year}${cur.provisional ? " (2026 in progress)" : ""} — peaking at 91 in 2012. <a href="/en/goalsbyyear">Open the full table</a>.</figcaption></figure>`;
    const drawYear = (y) => {
      const r = ys.find((x) => x.year === +y);
      if (!r) return;
      const yt = el("yearTiles");
      if (yt) {
        yt.innerHTML =
          `<div class="tile"><div class="t-val">${r.goals}</div><div class="t-lab">Goals in ${r.year}${r.provisional ? " (so far)" : ""}</div></div>` +
          `<div class="tile"><div class="t-val">${n(r.careerTotal)}</div><div class="t-lab">Career total after ${r.year}</div></div>` +
          `<div class="tile"><div class="t-val">${r.age}</div><div class="t-lab">Age during ${r.year}</div></div>`;
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
    records.innerHTML = [
      [`91`, `<b>Goals in 2012</b>, the most any footballer has scored in a single calendar year — ${best.goals} in ${best.apps || "all competitions"}.`],
      [`8`, `<b>Ballons d'Or</b> (2009–12, 2015, 2019, 2021, 2023) — more than any other player in history.`],
      [`474`, `<b>La Liga goals</b>, the all-time record for the competition and for any single European top flight.`],
      [`129`, `<b>Champions League goals</b> — 120 for Barcelona and 9 for PSG, the second-most in the competition's history.`],
      [n(post30), `<b>Goals since turning 30</b> — about ${Math.round((post30 / t.goals) * 100)}% of his entire career total, scored from 2017 onward.`],
      [`57`, `<b>Hat-tricks or more</b> for club and country across his senior career (provisional tally).`],
      [`46`, `<b>Team trophies</b> — the most decorated career in football history, crowned by the 2022 World Cup.`],
    ].map((r) => `<div class="record"><span class="num">${r[0]}</span><span>${r[1]}</span></div>`).join("");
  }

  const silver = el("silver");
  if (silver) {
    silver.innerHTML =
      `<table class="data-table"><caption>46 senior team titles, club by club, plus the headline individual honours.</caption>` +
      `<thead><tr><th scope="col" class="left">Trophy</th><th scope="col">Times</th><th scope="col" class="left">Note</th></tr></thead><tbody>` +
      `<tr><th scope="row">Team trophies — Barcelona</th><td>35</td><td class="left">2005 to 2021, incl. 4 Champions Leagues</td></tr>` +
      `<tr><th scope="row">Team trophies — Argentina</th><td>5</td><td class="left">World Cup 2022, Copas América 2021 &amp; 2024, Finalissima 2022, Olympic gold 2008</td></tr>` +
      `<tr><th scope="row">Team trophies — PSG</th><td>3</td><td class="left">Ligue 1 2022 &amp; 2023, Trophée des Champions 2022</td></tr>` +
      `<tr><th scope="row">Team trophies — Inter Miami</th><td>3</td><td class="left">Leagues Cup 2023, Supporters' Shield 2024, MLS Cup 2025</td></tr>` +
      `<tr><th scope="row">Ballon d'Or</th><td>8</td><td class="left">Record — 2009–12, 2015, 2019, 2021, 2023</td></tr>` +
      `</tbody></table>`;
    const sTable = silver.querySelector("table");
    if (sTable) sortable(sTable);
  }

  const m = d.byFinish;
  const split = el("split");
  if (split) {
    split.innerHTML = `<div class="split-grid">` +
      `<div class="split-card"><div class="s-val">${m.freeKicks}</div><div class="s-lab">Free-kick goals</div><div class="s-note">Curled in for club and country (provisional tally).</div></div>` +
      `<div class="split-card"><div class="s-val">${m.penalties}</div><div class="s-lab">Penalty goals</div><div class="s-note">Around one in eight of all his goals (provisional tally).</div></div>` +
      `<div class="split-card"><div class="s-val">${d.hatTricks}</div><div class="s-lab">Hat-tricks or more</div><div class="s-note">Three-plus-goal games, all competitions.</div></div></div>` +
      `<p class="caveat">Free-kick and penalty splits are a widely published compiled tally — provisional until a full match-by-match hand count is finished. The ${n(t.goals)} total is unaffected.</p>`;
  }

  const faq = el("faq");
  if (faq && isEn) {
    faq.innerHTML = [
      ["How many goals has Messi scored in total?", `<b>${n(t.goals)} in ${n(t.apps)}</b> senior games — ${n(t.clubs.goals)} at club level and ${n(t.country.goals)} for Argentina.`],
      ["How many goals did Messi score in 2012?", `<b>91</b> — 79 for Barcelona and 12 for Argentina, a world record for a calendar year.`],
      ["How many World Cup goals does Messi have?", `<b>${d.byCompetition.find((r) => r.competition === "FIFA World Cup").goals}</b> — crowned by 7 in Qatar 2022 and 8 in 2026.`],
      ["How many free kicks has Messi scored?", `<b>${m.freeKicks}</b> in senior football (provisional tally, counting by hand).`],
      ["How many penalties has Messi scored?", `<b>${m.penalties}</b> (same provisional basis).`],
      ["How many Ballons d'Or has Messi won?", `<b>Eight</b> — 2009, 2010, 2011, 2012, 2015, 2019, 2021 and 2023.`],
      ["How many trophies has Messi won?", `<b>46 team titles</b> plus every major individual award. <a href="/en/achievements">Every trophy listed</a>.`],
      ["How often is this site updated?", `After every match, by hand, from named sources — the date stamp at the top of the page shows the last check (${esc(d.lastUpdated)}).`],
    ].map((q) => `<details class="faq-item"><summary class="faq-question"><span>${q[0]}</span><span class="faq-chevron" aria-hidden="true">▾</span></summary><div class="faq-answer"><p>${q[1]}</p></div></details>`).join("");
    faq.className = "faq-accordion";
  }

  // Dynamically sync Road to 1,000 widget if present
  const r1000 = el("road-1000");
  if (r1000) {
    const goals = t.goals || 929;
    const remaining = Math.max(0, 1000 - goals);
    const pct = ((goals / 1000) * 100).toFixed(1);
    const fill = r1000.querySelector(".road-1000-fill");
    if (fill) fill.style.width = `${pct}%`;
    const pin = r1000.querySelector(".road-1000-pin");
    if (pin) pin.style.left = `${pct}%`;
    const pBadge = r1000.querySelector(".r1000-percent");
    if (pBadge) pBadge.textContent = `${pct}%`;
    const numEl = r1000.querySelector(".r1000-metric.highlight .r1000-num");
    if (numEl) numEl.textContent = String(remaining);
  }

  renderExplore(d, "home");
  renderMethod(d, "");
  renderOnThisDay();
  initBdayQuickForm();
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
    window.location.href = `/en/birthday?date=${m}-${d}`;
  });
}

/* ================= ON THIS DAY (HOME PAGE WIDGET) ================= */
async function renderOnThisDay() {
  const container = el("on-this-day");
  if (!container) return;

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
    container.innerHTML = `<p class="otd-error">Could not load today's match history. <a href="/en/birthday">Check birthday explorer &rarr;</a></p>`;
    return;
  }

  const calendar = bdayData.calendar || {};
  const pad2 = (n) => String(n).padStart(2, "0");

  // Daily UTC0 date determination
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
    container.innerHTML = `<p class="otd-empty">No match data on record for today. <a href="/en/birthday">Explore all 366 days &rarr;</a></p>`;
    return;
  }

  let activeMatchIdx = 0;
  let activeGoalIdx = 0;

  const renderContent = () => {
    const matches = dayData.matches || [];
    const activeMatch = matches[activeMatchIdx] || matches[0];
    if (!activeMatch) {
      container.innerHTML = `<p class="otd-empty">No match data available.</p>`;
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
            Goal ${gIdx + 1}${min ? ` (${min}')` : ""}
          </button>`;
        }).join("") +
      `</div>`;
    }

    const currentMin = activeVideo.minute || (activeMatch.minutes && activeMatch.minutes[activeGoalIdx]) || "";
    const currentType = (activeMatch.types && activeMatch.types[activeGoalIdx]) || (activeVideo.penalty ? "Penalty" : (activeVideo.freekick ? "Direct Free Kick" : "Goal"));
    const goalNumberBadge = activeVideo.goalNumber ? `<span class="otd-goal-num-badge">Career Goal #${activeVideo.goalNumber}</span>` : "";

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
            <p>📺 Video clip for this goal is being verified.</p>
            <a href="https://www.youtube.com/results?search_query=Lionel+Messi+goal+vs+${encodeURIComponent(activeMatch.opponent)}+${activeMatch.date}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">
              🔍 Search clip on YouTube &rarr;
            </a>
          </div>
        </div>`;

    const statusBadge = isClosest
      ? `<span class="otd-badge otd-badge-closest">📅 CLOSEST SCORING DAY • ${dayData.formatted.toUpperCase()}</span>`
      : `<span class="otd-badge"><span class="live-dot pulse"></span> <b>ON THIS DAY • ${dayData.formatted.toUpperCase()} (UTC)</b></span>`;

    const headlineText = isClosest
      ? `No senior match scheduled today (${now.getUTCDate()} ${["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][utcM]} UTC). Closest scoring day: <b>${dayData.goalsCount} goals</b> on ${dayData.formatted}!`
      : `On this day in history, Lionel Messi scored <b>${dayData.goalsCount} goals</b> in <b>${matches.length} match${matches.length > 1 ? "es" : ""}</b>!`;

    container.innerHTML = `
      <div class="otd-header">
        <div class="otd-header-left">
          ${statusBadge}
          <h3 class="otd-headline">${headlineText}</h3>
        </div>
        <div class="otd-header-right">
          <a href="/en/birthday?date=${todayKey}" class="btn btn-secondary btn-sm otd-bday-link">
            🎂 Did Messi score on your birthday?
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
              <span class="otd-dt-label">Minute</span>
              <strong class="otd-dt-val">⚽ ${esc(currentMin ? `${currentMin}'` : "—")}</strong>
            </div>
            <div class="otd-detail-item">
              <span class="otd-dt-label">Shot Type</span>
              <strong class="otd-dt-val">${esc(currentType)}</strong>
            </div>
            ${activeVideo.assist ? `
            <div class="otd-detail-item">
              <span class="otd-dt-label">Assist</span>
              <strong class="otd-dt-val">👟 ${esc(activeVideo.assist)}</strong>
            </div>` : ""}
            ${activeVideo.xg ? `
            <div class="otd-detail-item">
              <span class="otd-dt-label">Expected Goal (xG)</span>
              <strong class="otd-dt-val">📊 ${activeVideo.xg}</strong>
            </div>` : ""}
          </div>

          <div class="otd-cta-row">
            <a href="/en/birthday?date=${todayKey}" class="btn btn-primary btn-sm">
              Explore All 366 Days &rarr;
            </a>
            <button type="button" class="btn btn-secondary btn-sm otd-share-btn">
              🔗 Share Clip
            </button>
          </div>
        </div>
      </div>
    `;

    container.querySelectorAll(".otd-match-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        activeMatchIdx = +tab.dataset.midx;
        activeGoalIdx = 0;
        renderContent();
      });
    });

    container.querySelectorAll(".otd-goal-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        activeGoalIdx = +tab.dataset.gidx;
        renderContent();
      });
    });

    const videoEl = container.querySelector(".otd-video-element");
    if (videoEl) {
      videoEl.addEventListener("play", () => {
        try {
          trackVideoPlay("otd_card", activeVideo.goalNumber || activeMatch.opponent);
        } catch (_) {}
      });
    }

    const shareBtn = container.querySelector(".otd-share-btn");
    if (shareBtn) {
      shareBtn.addEventListener("click", async () => {
        const shareText = `On this day in history (${dayData.formatted}), Lionel Messi scored vs ${activeMatch.opponent}! Watch the goal:`;
        const shareUrl = `${location.origin}/en/birthday?date=${todayKey}`;
        try {
          trackShare("otd_card", shareText);
        } catch (_) {}
        if (navigator.share) {
          try {
            await navigator.share({ title: "Messi Goal On This Day", text: shareText, url: shareUrl });
            return;
          } catch (_) {}
        }
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
          shareBtn.textContent = "✓ Copied Link!";
          setTimeout(() => { shareBtn.textContent = "🔗 Share Clip"; }, 2500);
        }
      });
    }
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
    kpiBestNote: "एक कैलेंडर वर्ष में विश्व रिकॉर्ड।",
    kpiCurrNote: "सीज़न जारी है।",
    kpiScoringYears: "गोल करने वाले साल",
    kpiYearsNote: `${ys[0].year} से ${last.year} तक हर साल।`,
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
  miami: [["Major League Soccer", 68], ["Concacaf Champions Cup", 8], ["Leagues Cup and playoffs", 22]],
  argentina: [["World Cup qualifiers and friendlies", 90], ["FIFA World Cup", 21], ["Copa América", 14]],
};
const FINISH_COLORS = { "Open play": "#0e7cc0", Penalties: "#7cc4ea", "Free kicks": "#132c52" };
const BODY_COLORS = { "Left foot": "#0e7cc0", "Right foot": "#55a8dc", Head: "#a9d3ee", Other: "#132c52" };

const DASH_I18N = {
  es: {
    teamNames: { all: "todos los equipos", barcelona: "Barcelona", psg: "PSG", miami: "Inter Miami", argentina: "Argentina" },
    pills: [["all", "Todos"], ["barcelona", "Barcelona"], ["psg", "PSG"], ["miami", "Inter Miami"], ["argentina", "Argentina"]],
    head: (name) => `Los 929 goles de Lionel Messi analizados de cuatro formas — por competición, por temporada, por definición y por parte del cuerpo — filtrados para <b>${esc(name)}</b>. Toca un equipo para actualizar todos los gráficos.`,
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
    head: (name) => `Todos os 929 gols de Lionel Messi analisados de quatro formas — por competição, por temporada, por finalização e por parte do corpo — filtrados para <b>${esc(name)}</b>. Toque em um time para atualizar os gráficos.`,
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
    head: (name) => `Tous les 929 buts de Lionel Messi analysés de 4 manières — par compétition, par saison, par finition et par partie du corps — filtrés pour <b>${esc(name)}</b>. Touchez une équipe pour actualiser.`,
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
    head: (name) => `جميع أهداف ليونيل ميسي الـ 929 مقسمة بأربع طرق — حسب البطولة، الموسم، طريقة التسجيل، وجزء الجسم — مصفاة حسب <b>${esc(name)}</b>. اضغط على أي فريق لتحديث المخططات.`,
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
    head: (name) => `लियोनेल मेस्सी के सभी 929 गोलों का चार प्रकार से विश्लेषण — प्रतियोगिता, सीज़न, फ़िनिश और शरीर के अंग द्वारा — <b>${esc(name)}</b> के अनुसार। चार्ट बदलने के लिए किसी टीम पर टैप करें।`,
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
    head: (name) => `Toate cele 929 de goluri ale lui Lionel Messi analizate în 4 moduri — după competiție, sezon, tip de finalizare și parte a corpului — filtrate pentru <b>${esc(name)}</b>. Atinge o echipă pentru a actualiza graficele.`,
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
    head: (name) => `Lionel Messining barcha 929 goli 4 usulda tahlil qilingan — musobaqa, mavsum, yakunlash usuli va tana a'zosi bo'yicha — <b>${esc(name)}</b> uchun filtrlangan. Diagrammalarni yangilash uchun jamoani bosing.`,
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
  const pills = cfg.pills;

  setHead(d, cfg.head(name));

  const pillsEl = el("pills");
  if (pillsEl) {
    pillsEl.innerHTML = pills.map((p) => `<button class="pill${T === p[0] ? " on" : ""}" data-team="${p[0]}" aria-pressed="${T === p[0]}">` +
      (p[0] === "all" ? "" : `<img class="pill-crest" src="img/teams/${p[0]}.png" alt="" width="20" height="20" loading="eager" decoding="async" onerror="this.remove()">`) +
      `${p[1]}</button>`).join("");
    pillsEl.querySelectorAll(".pill").forEach((b) =>
      b.addEventListener("click", () => {
        const url = new URL(location.href);
        if (b.dataset.team === "all") url.searchParams.delete("team");
        else url.searchParams.set("team", b.dataset.team);
        location.href = url.pathname + (url.search === "?" ? "" : url.search);
      })
    );
  }

  const fnEl = el("filter-note");
  if (fnEl) {
    fnEl.textContent = cfg.filterNote(name, goals, apps, T);
  }

  const kpisEl = el("kpis");
  if (kpisEl) {
    kpisEl.innerHTML =
      kpi4(cfg.kpis.goals, n(goals), cfg.kpis.forTeam(name)) +
      kpi4(cfg.kpis.apps, n(apps), cfg.kpis.forTeam(name)) +
      kpi4(cfg.kpis.gpg, gpg(goals, apps), cfg.kpis.forTeam(name));
  }

  const compRows = T === "all" ? d.byCompetition : TEAM_COMPS[T].map((r) => ({ competition: r[0], goals: r[1] }));
  const cmax = Math.max(...compRows.map((r) => r.goals));
  const compCard = el("comp-card");
  if (compCard) {
    compCard.innerHTML =
      `<div class="hbars">` + compRows.map((r) =>
        `<div class="hbar-row"><span class="hbar-name">${esc(r.competition)}</span>` +
        `<span class="hbar-track"><span class="hbar-fill${r.goals === cmax ? " top" : ""}" style="width:${((r.goals / cmax) * 100).toFixed(1)}%"></span></span>` +
        `<span class="hbar-val">${r.goals}</span></div>`
      ).join("") + `</div>`;
    if (!compRows.length) {
      compCard.insertAdjacentHTML("beforeend", `<p class="chart-empty">${cfg.chartEmpty}</p>`);
    }
  }

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

  const showFinish = T === "all" || T === "argentina" || T === "miami";
  const finishPartsRaw = [["Open play", d.byFinish.openPlay], ["Penalties", d.byFinish.penalties], ["Free kicks", d.byFinish.freeKicks]];
  const finishParts = finishPartsRaw.map((p) => {
    const lbl = cfg.finishParts[p[0]] || p[0];
    return { label: lbl, value: p[1], color: FINISH_COLORS[p[0]] };
  });

  const finishCard = el("finish-card");
  if (finishCard) {
    finishCard.innerHTML = showFinish
      ? `<div class="donut-flex">${donutSVG(
          finishParts,
          d.totals.goals, n(d.totals.goals), cfg.finishCenter
        )}<ul class="legend">` +
        finishParts
          .map((p) => `<li class="lg-row"><span class="sw" style="background:${p.color}"></span><span class="lg-name">${p.label}</span><span class="lg-val">${p.value} <small>(${((p.value / d.totals.goals) * 100).toFixed(1)}%)</small></span></li>`).join("") +
        `</ul></div><p class="caveat">${cfg.finishCaveat}</p>`
      : `<p class="caveat">${cfg.finishCaveatFiltered(d)}</p>`;
  }

  const bodyPartsRaw = [["Left foot", d.byBodyPart.left], ["Right foot", d.byBodyPart.right], ["Head", d.byBodyPart.head], ["Other", d.byBodyPart.other]];
  const bodyParts = bodyPartsRaw.map((p) => {
    const lbl = cfg.bodyParts[p[0]] || p[0];
    return { label: lbl, value: p[1], color: BODY_COLORS[p[0]] };
  });

  const bodyCard = el("body-card");
  if (bodyCard) {
    bodyCard.innerHTML =
      `<div class="donut-flex">${donutSVG(
        bodyParts,
        d.totals.goals, n(d.byBodyPart.left), cfg.bodyCenter
      )}<ul class="legend">` +
      bodyParts
        .map((p) => `<li class="lg-row"><span class="sw" style="background:${p.color}"></span><span class="lg-name">${p.label}</span><span class="lg-val">${p.value} <small>(${((p.value / d.totals.goals) * 100).toFixed(1)}%)</small></span></li>`).join("") +
      `</ul></div><p class="caveat">${cfg.bodyCaveat}</p>`;
  }

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

  const finishTable = el("finish-table");
  if (finishTable) {
    const fRows = cfg.finishRows(d);
    finishTable.innerHTML =
      `<table class="data-table"><caption>${cfg.finishCaption}</caption>` +
      `<thead><tr><th scope="col" class="left">${cfg.thFinish}</th><th scope="col">${cfg.thGoals}</th><th scope="col">${cfg.thShare}</th></tr></thead><tbody>` +
      fRows.map((r) => `<tr><th scope="row">${r[0]}</th><td><b>${r[1]}</b></td><td>${((r[1] / d.totals.goals) * 100).toFixed(1)}%</td></tr>`).join("") +
      `</tbody></table><p class="caveat">${cfg.finishCaveatTable}</p>`;
    finishTable.insertAdjacentHTML("beforeend", clubTableCaption());
    const tbl = finishTable.querySelector("table");
    if (tbl) sortable(tbl);
  }

  /* Per-team cards: career-wide, unaffected by the ?team= filter. */
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

  /* Records strip: the landmark numbers behind these charts, all from this dataset. */
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
  if (y <= 2008) return { era: "The boy from Rosario", range: "2004–2008" };
  if (y <= 2012) return { era: "The greatest peak football has seen", range: "2009–2012" };
  if (y <= 2015) return { era: "MSN and the second treble", range: "2013–2015" };
  if (y <= 2018) return { era: "Carrying Barcelona", range: "2016–2018" };
  if (y <= 2021) return { era: "Farewell to Barcelona", range: "2019–2021" };
  if (y <= 2023) return { era: "Paris and the World Cup", range: "2021–2023" };
  return { era: "Miami and the road to 1,000", range: "2023–present" };
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
const eraIntro = (era) => ERA_INTRO[era] ? `<p class="chapter-intro">${ERA_INTRO[era]}</p>` : "";
const eraPhotos = (era) => {
  const pics = ERA_PHOTOS[era];
  if (!pics || !pics.length) return "";
  return `<div class="ch-photos${pics.length === 1 ? " solo" : ""}">` + pics.map((p) => {
    return `<figure class="ch-photo"><img src="${p.src}" width="${p.w}" height="${p.h}" alt="${esc(p.alt)}" loading="lazy" style="object-position:${p.pos}" />` +
    `<figcaption class="photo-credit">${esc(p.cap)}</figcaption></figure>`;
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

function renderTimeline(d) {
  const lang = getLang();
  const cfg = TIMELINE_I18N[lang] || TIMELINE_EN;
  const t = d.totals;
  setHead(d, cfg.head(t));
  el("keydates").innerHTML =
    `<ol class="keydates">` +
    cfg.keydates(t, d.lastUpdated).map((kd) => `<li><span class="kd-date">${kd[0]}</span><span>${kd[1]}</span></li>`).join("") +
    `</ol>`;
  const groups = [];
  d.timeline.forEach((e) => {
    const { era, range } = eraOf(e.year);
    let g = groups.find((x) => x.era === era);
    if (!g) {
      g = { era, range, goalsInEra: 0, events: [] };
      groups.push(g);
    }
    g.events.push(e);
  });
  /* Era goal bars split calendar years into non-overlapping spans (walking the
     era ranges in order, so each year is counted exactly once) — the seven era
     totals always add back up to the career total. */
  let floor = d.calendarYears[0].year;
  const lastCal = d.calendarYears[d.calendarYears.length - 1].year;
  groups.forEach((g) => {
    const bits = g.range.split("–").map((x) => parseInt(x, 10));
    const a = isNaN(bits[0]) ? floor : bits[0];
    const b = isNaN(bits[1]) ? lastCal : bits[1];
    const from = Math.max(a, floor);
    g.spanFrom = from;
    g.spanTo = b;
    g.goalsInEra = d.calendarYears.filter((r) => r.year >= from && r.year <= b).reduce((s, r) => s + r.goals, 0);
    floor = b + 1;
  });
  const totalGoals = t.goals;
  const peak = Math.max(...groups.map((c) => c.goalsInEra), 1);
  const calmScroll = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  /* Sticky era jump-nav (shell lives in timeline.html; rebuilt here if missing). */
  let nav = el("era-nav");
  if (!nav) {
    nav = document.createElement("nav");
    nav.id = "era-nav";
    nav.className = "tl-era-nav";
    nav.setAttribute("aria-label", "Jump to a career era");
    el("chapters").before(nav);
  }
  nav.innerHTML = groups.map((c, i) =>
    `<a href="#era-${i}"><span class="tl-era-name">${esc(c.era)}</span>` +
    `<span class="tl-era-range">${esc(c.range)}</span></a>`
  ).join("");
  nav.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", (ev) => {
      const href = a.getAttribute("href");
      const target = document.getElementById(href.slice(1));
      if (!target) return;
      ev.preventDefault();
      target.classList.add("in");
      target.scrollIntoView({ behavior: calmScroll() ? "auto" : "smooth", block: "start" });
      try { history.replaceState(null, "", href); } catch (ignored) { /* e.g. file:// */ }
    });
  });
  /* Milestone tags: one honest label per entry, derived from its own words. */
  const tagFor = (txt) => {
    if (/record/i.test(txt)) return cfg.tagRecord || "Record";
    if (/ballon/i.test(txt)) return "Ballon d'Or";
    if (/world cup/i.test(txt)) return cfg.tagWc || "World Cup";
    if (/first |debut|youngest/i.test(txt)) return cfg.tagFirst || "First";
    return "";
  };
  /* Per-era callout: best calendar year inside the span + team trophies won there. */
  const calloutFor = (g) => {
    const yrs = d.calendarYears.filter((r) => r.year >= g.spanFrom && r.year <= g.spanTo);
    if (!yrs.length) return "";
    const pk = yrs.reduce((a, b) => (b.goals > a.goals ? b : a));
    const tr = d.trophies
      .filter((x) => x.team !== "Individual")
      .reduce((s, x) => s + x.years.filter((y) => +y >= g.spanFrom && +y <= g.spanTo).length, 0);
    return cfg.peakYear(pk, tr);
  };
  /* Chapters: per-era goal bars, date badges, milestone markers, live chip. */
  el("chapters").innerHTML = groups.map((c, i) => {
    const last = i === groups.length - 1;
    const share = ((c.goalsInEra / totalGoals) * 100).toFixed(1);
    const width = ((c.goalsInEra / peak) * 100).toFixed(1);
    return `<article class="chapter tl-reveal" id="era-${i}">` +
      `<div class="ch-head"><span class="ch-era">${esc(c.era)}</span>` +
      (last ? ` <span class="chip">${cfg.inProg}</span>` : "") +
      `<span class="ch-range" style="margin-left:auto">${esc(c.range)} · ${n(c.goalsInEra)} ${cfg.goals}</span></div>` +
      `<div class="ch-goalbar" role="img" aria-label="${esc(c.era)}: ${n(c.goalsInEra)} ${cfg.goals}, ${share} percent of a ${n(totalGoals)}-goal career">` +
      `<span class="ch-goalbar-fill" style="width:${width}%"></span></div>` +
      `<p class="ch-goalnote">${cfg.goalsInEra(c.goalsInEra, share, totalGoals)}</p>` +
      eraIntro(c.era) +
      calloutFor(c) +
      eraPhotos(c.era) +
      `<ol class="tl-events">` + c.events.map((e) => {
        const tag = tagFor(e.event);
        return `<li class="tl-event${tag === (cfg.tagRecord || "Record") ? " rec" : ""}" data-text="${esc((e.year + " " + e.event).toLowerCase())}">` +
          `<span class="tl-marker" aria-hidden="true"></span>` +
          `<span class="tl-date">${e.year}</span><span class="tl-text">${esc(e.event)}</span>` +
          (tag ? `<span class="tl-tag">${tag}</span>` : "") + `</li>`;
      }).join("") + `</ol></article>`;
  }).join("");
  /* Active-section highlight on the jump-nav. */
  const links = [...nav.querySelectorAll("a")];
  if ("IntersectionObserver" in window) {
    const spotObs = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const idx = parseInt(en.target.id.replace("era-", ""), 10);
        links.forEach((l, j) => {
          const on = j === idx;
          l.classList.toggle("on", on);
          if (on) l.setAttribute("aria-current", "true");
          else l.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-30% 0px -60% 0px", threshold: 0 });
    document.querySelectorAll("#chapters .chapter").forEach((c) => spotObs.observe(c));
  } else if (links[0]) links[0].classList.add("on");
  /* Reveal-on-scroll for chapters (instant when reduced motion is requested). */
  const cards = document.querySelectorAll("#chapters .tl-reveal");
  if ("IntersectionObserver" in window && !calmScroll()) {
    const riseObs = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("in"); riseObs.unobserve(en.target); }
      });
    }, { rootMargin: "250px 0px 250px 0px", threshold: 0.01 });
    cards.forEach((c) => riseObs.observe(c));
  } else {
    cards.forEach((c) => c.classList.add("in"));
  }
  /* Milestone search: filters events and hides emptied chapters, while the era
     goal totals stay on screen — the filter never rewrites any goal count. */
  const totalEvents = d.timeline.length;
  let inp = el("tl-filter");
  if (!inp) {
    inp = document.createElement("input");
    inp.type = "search";
    inp.id = "tl-filter";
    inp.placeholder = "Filter milestones — e.g. World Cup, 2012, Albacete";
    const bar = document.createElement("div");
    bar.className = "tl-filter-bar";
    bar.appendChild(inp);
    el("chapters").before(bar);
  }
  const countEl = el("tl-count");
  const paintCount = (matched) => {
    if (!countEl) return;
    countEl.textContent = matched === totalEvents ? "" : `${matched} of ${totalEvents} milestones`;
  };
  inp.addEventListener("input", () => {
    const q = inp.value.trim().toLowerCase();
    let shown = 0;
    document.querySelectorAll("#chapters .chapter").forEach((ch) => {
      let chHits = 0;
      ch.querySelectorAll(".tl-event").forEach((li) => {
        const hit = !q || li.dataset.text.includes(q);
        li.hidden = !hit;
        if (hit) chHits++;
      });
      ch.hidden = q && chHits === 0;
      shown += chHits;
    });
    let empty = el("tl-empty");
    if (shown === 0) {
      if (!empty) {
        empty = document.createElement("p");
        empty.id = "tl-empty";
        empty.className = "tl-empty";
        el("chapters").after(empty);
      }
      empty.textContent = cfg.empty(inp.value.trim(), totalEvents);
      empty.hidden = false;
    } else if (empty) empty.hidden = true;
    paintCount(shown);
  });
  el("faq").innerHTML = cfg.faq.map((q) => `<details class="faq-item"><summary class="faq-question"><span>${q[0]}</span><span class="faq-chevron" aria-hidden="true">▾</span></summary><div class="faq-answer"><p>${q[1]}</p></div></details>`).join("");
  el("faq").className = "faq-accordion";
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
async function copyToClipboard(text, msgEl, successMsg = "Copied to clipboard!") {
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
    msgEl.textContent = ok ? successMsg : text;
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
      shareText = `¿Marcó Lionel Messi en tu cumpleaños? Revisa los 366 días a lo largo de sus 929 goles:`;
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
      shareText = `Did Lionel Messi score on your birthday? Check all 366 days across his 929 career goals:`;
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

/* ================= BIRTHDAY GOALS EXPLORER ================= */
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

  const meta = bdayData.meta || {};
  const calendar = bdayData.calendar || {};

  if (el("kpi-days-scored")) el("kpi-days-scored").textContent = meta.daysWithGoals || 292;
  if (el("kpi-days-empty")) el("kpi-days-empty").textContent = meta.daysWithoutGoals || 74;

  const MONTH_NAMES = [
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
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

  if (pillsWrap) {
    let pillsHtml = "";
    for (let m = 1; m <= 12; m++) {
      const shortName = MONTH_NAMES[m].slice(0, 3);
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
          tabsHtml += `<button type="button" class="video-goal-tab${i === initialIndex ? " active" : ""}" data-gidx="${i}">Goal ${i + 1}${minLabel}</button>`;
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
          b.textContent = "📺 Play Inline";
        });

        if (!isCurrentlyOpen) {
          trackVideoPlay(match.opponent, match.date, match.competition);
          container.hidden = false;
          inlineBtn.classList.add("active");
          inlineBtn.textContent = "✕ Close Video";

          const videos = match.videos || [];
          const renderInline = (vIdx) => {
            const v = videos[vIdx];
            if (!v) return;
            let navHtml = "";
            if (videos.length > 1) {
              navHtml = `<div class="bday-card-inline-nav">` +
                videos.map((vid, i) => `<button type="button" class="video-goal-tab${i === vIdx ? " active" : ""}" data-inidx="${i}">Goal ${i + 1}${vid.minute ? ` (${vid.minute}')` : ""}</button>`).join("") +
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

    // Sync active state on preset chips
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

    try {
      const url = new URL(location.href);
      url.searchParams.set("date", key);
      history.replaceState(null, "", url.pathname + url.search + url.hash);
    } catch (_) {}

    try {
      trackBirthdaySearch(key, dayData.formatted, dayData.goalsCount);
    } catch (_) {}

    const formatScore = (str) => {
      if (!str) return "—";
      const sm = String(str).match(/^(\d+)\s*[:\-\u2013]\s*(\d+)$/);
      if (sm) {
        return `${parseInt(sm[1], 10)} – ${parseInt(sm[2], 10)}`;
      }
      return str;
    };

    if (targetDateEl) targetDateEl.textContent = dayData.formatted;

    if (dayData.goalsCount > 0) {
      currentMatches = dayData.matches || [];
      if (badgeEl) {
        badgeEl.innerHTML = `<span class="bday-badge-success">🎉 Yes! Messi Scored On Your Birthday!</span>`;
      }
      const matchWord = dayData.matches.length === 1 ? "match" : "matches";
      const goalWord = dayData.goalsCount === 1 ? "goal" : "goals";
      if (headlineEl) {
        headlineEl.innerHTML = `Lionel Messi scored <b>${dayData.goalsCount} ${goalWord}</b> in <b>${dayData.matches.length} ${matchWord}</b> on ${dayData.formatted} throughout his senior career!`;
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
                Watch ${match.videos.length > 1 ? match.videos.length + " Goal Clips" : "Goal Clip"}
               </button>`
            : `<a href="https://www.youtube.com/results?search_query=Lionel+Messi+goal+vs+${encodeURIComponent(match.opponent)}+${match.date}" target="_blank" rel="noopener noreferrer" class="bday-yt-search-btn">
                🔍 Search Highlights
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
                <strong>${match.goalsCount} ${match.goalsCount === 1 ? "goal" : "goals"} scored:</strong>
                <div class="bday-minute-tags">${minTags}</div>
                ${typeTags}
              </div>
              <div class="bday-match-actions">
                ${videoBtn}
                ${hasVideos ? `<button type="button" class="bday-inline-toggle-btn" data-idx="${matchIdx}">📺 Play Inline</button>` : ""}
                ${hasVideos ? `<a href="https://www.youtube.com/results?search_query=Lionel+Messi+goal+vs+${encodeURIComponent(match.opponent)}+${match.date}" target="_blank" rel="noopener noreferrer" class="bday-yt-search-btn">YouTube Highlights</a>` : ""}
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
          badgeEl.innerHTML = `<span class="bday-badge-messi">🎂 Leo Messi's Own Birthday!</span>`;
        }
        if (headlineEl) {
          headlineEl.innerHTML = `You share a birthday with <b>Lionel Andrés Messi</b> (born 24 June 1987 in Rosario)!`;
        }
        if (matchListEl) {
          matchListEl.innerHTML = `
            <div class="bday-empty-box">
              <p><b>Why 0 goals?</b> Lionel Messi has never played a competitive senior match on 24 June because late June falls during the European club summer off-season or scheduled rest intervals between international tournament rounds.</p>
              <p>You share your special day with the greatest footballer in history!</p>
            </div>
          `;
        }
      } else {
        if (badgeEl) {
          badgeEl.innerHTML = `<span class="bday-badge-empty">No Goals on this Date</span>`;
        }
        if (headlineEl) {
          headlineEl.innerHTML = `Lionel Messi has not scored on <b>${dayData.formatted}</b> during his senior career.`;
        }
        const closest = findClosestScoringDay(key);
        if (matchListEl) {
          let closestHtml = "";
          if (closest) {
            closestHtml = `
              <p>The closest calendar day Messi scored on is <b>${closest.formatted}</b> (${closest.goalsCount} career goals).</p>
              <button type="button" class="bday-closest-btn" data-month="${closest.month}" data-day="${closest.day}">
                Check ${closest.formatted} (${closest.goalsCount} goals) &rarr;
              </button>
            `;
          }
          matchListEl.innerHTML = `
            <div class="bday-empty-box">
              <p>Messi did not have a match scheduled or did not score on this specific calendar day — but he has scored on <b>292 of 366 days (79.8%)</b> of the year!</p>
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

  if (monthSelect) {
    monthSelect.addEventListener("change", (e) => {
      const m = +e.target.value;
      const currentDay = daySelect ? +daySelect.value : 1;
      updateDaysDropdown(m, currentDay);
      selectDate(m, daySelect ? +daySelect.value : 1, false);
    });
  }
  if (daySelect) {
    daySelect.addEventListener("change", (e) => {
      const dVal = +e.target.value;
      const m = monthSelect ? +monthSelect.value : 5;
      selectDate(m, dVal, false);
    });
  }
  if (checkBtn) {
    checkBtn.addEventListener("click", () => {
      const m = monthSelect ? +monthSelect.value : 5;
      const dVal = daySelect ? +daySelect.value : 2;
      selectDate(m, dVal, true);
    });
  }

  document.querySelectorAll(".bday-preset-chip[data-month]").forEach((chip) => {
    chip.addEventListener("click", () => {
      selectDate(+chip.dataset.month, +chip.dataset.day, true);
    });
  });

  const todayBtn = el("bday-preset-today");
  if (todayBtn) {
    todayBtn.addEventListener("click", () => {
      const now = new Date();
      selectDate(now.getMonth() + 1, now.getDate(), true);
    });
  }

  const randomBtn = el("bday-preset-random");
  if (randomBtn) {
    randomBtn.addEventListener("click", () => {
      const keys = Object.keys(calendar);
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      const [rm, rd] = randomKey.split("-").map(Number);
      selectDate(rm, rd, true);
    });
  }

  const heatmapNav = el("bday-heatmap-nav");
  if (heatmapNav) {
    let navHtml = `<button type="button" class="bday-heatmap-nav-btn active" data-m="all">All Months</button>`;
    for (let m = 1; m <= 12; m++) {
      navHtml += `<button type="button" class="bday-heatmap-nav-btn" data-m="${m}">${MONTH_NAMES[m].slice(0, 3)}</button>`;
    }
    heatmapNav.innerHTML = navHtml;
    heatmapNav.addEventListener("click", (e) => {
      const btn = e.target.closest(".bday-heatmap-nav-btn");
      if (!btn) return;
      heatmapNav.querySelectorAll(".bday-heatmap-nav-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const targetM = btn.dataset.m;
      if (targetM === "all") {
        heatmapGrid?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        const card = el(`bday-month-card-${targetM}`);
        if (card) {
          card.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    });
  }

  const heatmapGrid = el("bday-heatmap-grid");
  if (heatmapGrid) {
    let heatmapHtml = "";
    for (let m = 1; m <= 12; m++) {
      const mName = MONTH_NAMES[m];
      const maxDays = DAYS_IN_MONTH[m];
      const mMeta = (meta.months || []).find((x) => x.month === m) || { goals: 0, daysScored: 0 };

      let daysHtml = "";
      for (let day = 1; day <= maxDays; day++) {
        const k = makeKey(m, day);
        const gCount = calendar[k]?.goalsCount || 0;
        let tier = "tier-0";
        if (gCount >= 9) tier = "tier-4";
        else if (gCount >= 6) tier = "tier-3";
        else if (gCount >= 3) tier = "tier-2";
        else if (gCount >= 1) tier = "tier-1";

        const title = `${day} ${mName}: ${gCount} ${gCount === 1 ? "goal" : "goals"}`;
        daysHtml += `<button type="button" class="bday-day-btn ${tier}" data-month="${m}" data-day="${day}" title="${esc(title)}" aria-label="${esc(title)}">${day}</button>`;
      }

      heatmapHtml += `
        <div class="bday-month-card" id="bday-month-card-${m}" data-month="${m}">
          <div class="bday-month-card-head">
            <h3 class="bday-month-card-title">${mName}</h3>
            <span class="bday-month-card-goals">${mMeta.goals} goals</span>
          </div>
          <div class="bday-days-grid">${daysHtml}</div>
        </div>
      `;
    }
    heatmapGrid.innerHTML = heatmapHtml;
    heatmapGrid.addEventListener("click", (e) => {
      const cell = e.target.closest(".bday-day-btn");
      if (!cell) return;
      selectDate(+cell.dataset.month, +cell.dataset.day, true);
    });
  }

  const topTbody = el("top-days-tbody");
  if (topTbody && meta.topDays) {
    let topHtml = "";
    const highlights = {
      "05-02": "El Clásico 6-2 at the Bernabéu (2009), Getafe brace (2015)",
      "09-19": "Champions League hat-trick vs Ajax (2013), Eibar 4 goals (2017)",
      "01-06": "Hat-trick vs Atlético Madrid in Copa del Rey (2009)",
      "03-07": "Historic 5-goal Champions League night vs Bayer Leverkusen (2012)",
      "03-17": "Hat-trick at Real Betis with iconic Camp Nou standing ovation (2019)",
      "10-19": "Champions League hat-trick vs Manchester City (2016)",
      "02-19": "4 goals vs Valencia in La Liga (2012)",
      "12-07": "Hat-trick vs Mallorca (2019), Espanyol brace (2018)",
      "02-01": "Two goals vs Racing Santander, 5,000th Barça league goal (2009)",
      "03-14": "Chelsea UCL brace & 100th Champions League goal (2018)",
      "04-06": "Famous 4 goals vs Arsenal in Champions League quarter-final (2010)",
      "04-27": "Semi-final Bernabéu solo wondergoal vs Real Madrid (2011)",
      "06-05": "Historic 5 goals for Argentina vs Estonia (2022)",
      "09-09": "Hat-trick vs Bolivia in World Cup qualifying (2021)",
      "09-18": "Champions League hat-trick vs PSV Eindhoven (2018)"
    };

    meta.topDays.forEach((td, idx) => {
      const rate = td.matchCount ? (td.goalsCount / td.matchCount).toFixed(2) : "—";
      const [m, day] = td.key.split("-").map(Number);
      const note = highlights[td.key] || `${td.goalsCount} goals across ${td.matchCount} appearances`;

      topHtml += `
        <tr>
          <td class="left"><b>#${idx + 1}</b></td>
          <td class="left"><b>${esc(td.formatted)}</b></td>
          <td><b>${td.goalsCount}</b></td>
          <td>${td.matchCount}</td>
          <td>${rate}</td>
          <td class="left" style="font-size:0.86rem;color:var(--ink-soft)">${esc(note)}</td>
          <td>
            <button type="button" class="btn" style="padding:4px 12px;font-size:0.78rem" data-month="${m}" data-day="${day}">Check</button>
          </td>
        </tr>
      `;
    });
    topTbody.innerHTML = topHtml;
    topTbody.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-month]");
      if (btn) selectDate(+btn.dataset.month, +btn.dataset.day, true);
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
      const peakStr = peakGoals > 0 ? `${peakDay} ${row.name} (${peakGoals} goals)` : "—";

      mHtml += `
        <tr>
          <td class="left"><b>${esc(row.name)}</b></td>
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
  } catch (e) {
    console.error(e);
  }
  reveal();
  /* Chart entrance: bars grow, donuts sweep, KPIs tick on visibility — one shared
     boot observer, same pattern as the timeline .tl-reveal wiring. */
  armEntrance();
}).catch(() => {
  document.querySelectorAll("main.wrap").forEach((m) => {
    const p = document.createElement("p");
    p.className = "caveat";
    p.textContent = "Stats failed to load. Check your connection and refresh.";
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

/* ================= REDESIGNED LANGUAGE SELECTOR & MOBILE TOPBAR ================= */
function initLanguageAndMobileTopBar() {
  if (typeof document === "undefined") return;

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

  // Detect current language from <html lang="..."> or URL pathname
  const docLang = (document.documentElement.lang || "").toLowerCase().split("-")[0];
  const pathParts = location.pathname.split("/").filter(Boolean);
  let curLangCode = "en";
  if (LANGUAGES.some((l) => l.code === docLang)) {
    curLangCode = docLang;
  } else if (pathParts[0] && LANGUAGES.some((l) => l.code === pathParts[0])) {
    curLangCode = pathParts[0];
  }

  const curLangObj = LANGUAGES.find((l) => l.code === curLangCode) || LANGUAGES[0];

  function getLangUrl(targetCode) {
    const validSubpages = [
      "birthday",
      "goalsbyyear",
      "goalsbyseason",
      "dashboard",
      "timeline",
      "achievements",
      "messi-vs-ronaldo",
      "vs-real-madrid"
    ];

    let subpage = "";
    if (pathParts.length > 1) {
      subpage = pathParts[1].replace(/\.html$/, "");
    } else if (pathParts.length === 1 && !LANGUAGES.some((l) => l.code === pathParts[0])) {
      subpage = pathParts[0].replace(/\.html$/, "");
    }

    if (subpage === "champions-league") {
      return `/en/champions-league${location.search}${location.hash}`;
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
      setTimeout(() => {
        activeNav.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }, 70);
    }
  }

  // Remove any legacy inline .lang-switcher elements
  document.querySelectorAll(".lang-switcher").forEach((el) => el.remove());

  // 1. Setup Desktop Rail Language Button
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
    const railBtn = document.getElementById("rail-lang-btn");
    if (railBtn) railBtn.onclick = () => openLangModal();
  }

  // 2. Setup Mobile Top Bar
  let mobileTopBar = document.querySelector(".mobile-topbar");
  if (!mobileTopBar) {
    mobileTopBar = document.createElement("header");
    mobileTopBar.className = "mobile-topbar";
    mobileTopBar.setAttribute("aria-label", "Mobile navigation header");
    mobileTopBar.innerHTML = `
      <a href="${getLangUrl(curLangCode)}" class="mobile-topbar-brand" aria-label="MessiStats">
        <svg class="mobile-topbar-mark" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="msg-mtb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6d0f2e"></stop><stop offset=".55" stop-color="#1d3fae"></stop><stop offset="1" stop-color="#0e7cc0"></stop></linearGradient></defs><path d="M32 3 55 10v20c0 16-11 26-23 31C20 56 9 46 9 30V10Z" fill="url(#msg-mtb)" stroke="#e3b93e" stroke-linejoin="round" stroke-width="2.5"></path><path d="M47.5 9.5l1.7 3.5 3.8.6-2.8 2.7.7 3.8-3.4-1.8-3.4 1.8.7-3.8-2.8-2.7 3.8-.6z" fill="#e3b93e"></path><text fill="#fff" font-family="'Plus Jakarta Sans',Arial,sans-serif" font-size="19" font-weight="800" text-anchor="middle" x="31" y="44">M10</text></svg>
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
      </div>
    `;
    document.body.prepend(mobileTopBar);
  }

  const mobThemeBtn = document.getElementById("mobile-theme-btn");
  if (mobThemeBtn) {
    mobThemeBtn.onclick = () => {
      const isDark = document.documentElement.getAttribute("data-theme") === "dark";
      const nextTheme = isDark ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", nextTheme);
      try { localStorage.setItem("theme", nextTheme); } catch (_) {}
    };
  }

  const mobLangBtn = document.getElementById("mobile-lang-btn");
  if (mobLangBtn) mobLangBtn.onclick = () => openLangModal();

  // 3. Setup Universal Language Modal / Bottom Sheet
  let langModal = document.getElementById("lang-modal");
  if (!langModal) {
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
    langModal.querySelectorAll(".lang-card-option").forEach((card) => {
      card.addEventListener("click", () => {
        const code = card.getAttribute("data-code");
        if (code) {
          try {
            localStorage.setItem("messistats_lang_choice", code);
          } catch (_) {}
        }
      });
    });

    document.body.appendChild(langModal);
  }

  const openLangModal = () => {
    if (!langModal) return;
    langModal.hidden = false;
    langModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const closeLangModal = () => {
    if (!langModal) return;
    langModal.hidden = true;
    langModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  const closeBtn = document.getElementById("lang-modal-close-btn");
  if (closeBtn) closeBtn.onclick = closeLangModal;

  langModal.onclick = (e) => {
    if (e.target === langModal) closeLangModal();
  };

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && langModal && !langModal.hidden) {
      closeLangModal();
    }
  });

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
      stayBtn: "Continuar em English",
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

    const langs = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language || ""];
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

  // 5. Show Auto-Routed Notice Toast (if user was just auto-routed to their native hub)
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

  // 6. Show Smart Language Suggestion Banner (if viewing a language different from detected device/location)
  try {
    const isBot = /bot|googlebot|crawler|spider|robot|crawling/i.test(navigator.userAgent);
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
        document.body.prepend(banner);

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
  window.addEventListener("resize", centerActiveNav, { passive: true });
}

if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLanguageAndMobileTopBar);
  } else {
    initLanguageAndMobileTopBar();
  }
}

