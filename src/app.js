/* MessiStats renderer — own code, own data, own copy.
   Layout structure mirrors the ronaldostats.app reference (rail, KPI cards,
   tables, charts, explore links); no reference code, images or text reused. */
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
  if (el("upd")) el("upd").textContent = "Updated " + d.lastUpdated;
  if (el("lede")) el("lede").innerHTML = ledeHTML;
  if (el("foot-date"))
    el("foot-date").textContent =
      `Lionel Messi: ${n(d.totals.apps)} senior appearances, ${n(d.totals.goals)} goals ` +
      `(${n(d.totals.clubs.apps)} apps / ${n(d.totals.clubs.goals)} goals club, ` +
      `${n(d.totals.country.apps)} / ${n(d.totals.country.goals)} Argentina). Last checked ${d.lastUpdated}.`;
}
function reveal() {
  document.querySelectorAll("main.wrap > *").forEach((s, i) => {
    s.classList.add("reveal");
    s.style.animationDelay = Math.min(i * 0.04, 0.4) + "s";
  });
}
const EXPLORE = [
  { href: "index.html", page: "home", t: "Messi career stats", d: (d) => `The headline numbers: ${n(d.totals.goals)} goals in ${n(d.totals.apps)} senior games.` },
  { href: "goalsbyyear.html", page: "byyear", t: "Messi goals by year", d: (d) => `Every calendar year from 2004 to 2026 and the climb to ${n(d.totals.goals)}.` },
  { href: "goalsbyseason.html", page: "byseason", t: "Messi goals by season", d: () => "League, cup and continental splits for every club season." },
  { href: "dashboard.html", page: "dashboard", t: "Messi stats dashboard", d: () => "Filter every chart by Barcelona, PSG, Inter Miami or Argentina." },
  { href: "timeline.html", page: "timeline", t: "Messi through the years", d: () => "Every career milestone, dated and in order, from 2004 to today." },
  { href: "achievements.html", page: "achievements", t: "Messi trophies and awards", d: () => "All 46 team titles plus a record 8 Ballons d'Or." },
  { href: "birthday.html", page: "birthday", t: "Did Messi score on your birthday?", d: (d) => `Search all 365 calendar days across Messi's ${n(d.totals.goals)} senior career goals.` },
];
function renderExplore(d, page) {
  const e = el("explore");
  if (!e) return;
  e.innerHTML = EXPLORE.filter((x) => x.page !== page)
    .slice(0, 6)
    .map((x) => `<a class="link-card" href="${x.href}"><strong>${esc(x.t)}</strong><span>${esc(x.d(d))}</span></a>`)
    .join("");
}
function methodHTML(d, extra) {
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
  return `<p class="table-hint">Click a column header to sort. Senior first-team matches only.</p>`;
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
  setHead(d, `<b>${n(t.goals)} goals</b> in <b>${n(t.apps)} senior appearances</b> — for Barcelona, PSG, ${esc(p.current.join(" and "))}. ` +
    `A World Cup winner and record eight-time Ballon d'Or holder, counted by hand and checked twice, as of ${esc(d.lastUpdated)}.`);
  const dob = new Date(p.born + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  el("profile").innerHTML =
    `<figure class="identity-photo"><img src="img/messi.jpg" alt="Lionel Messi" width="900" height="1600" loading="eager" fetchpriority="high"><figcaption class="photo-credit">Lionel Messi · Argentina & Inter Miami</figcaption></figure><div class="identity-main">` +
    `<p class="identity-name">${esc(p.short)} <span class="jersey" aria-label="Shirt number 10">${p.number}</span></p>` +
    `<p class="identity-meta">${esc(p.name)}, born ${dob} in ${esc(p.birthplace)}. ` +
    `He is ${p.age}, plays as a ${esc(p.position.toLowerCase())} and is currently at ${esc(p.current.join(" and "))}.</p>` +
    `<dl class="identity-facts"><div><dt>Role</dt><dd>${esc(p.role)}</dd></div>` +
    `<div><dt>Teams</dt><dd>${esc(p.teams.join(" · "))}</dd></div>` +
    `<div><dt>Now</dt><dd>${esc(p.current.join(" · "))}</dd></div></dl></div>`;
  el("profile").classList.add("identity--tight");

  const togo = 1000 - t.goals;
  const done = d.calendarYears.filter((r) => !r.provisional);
  const last3 = done.slice(-3);
  const pace = last3.reduce((s, r) => s + r.goals, 0) / last3.length;
  const projYear = done[done.length - 1].year + Math.max(1, Math.ceil(togo / pace));
  el("kpis").innerHTML =
    kpi("Career goals", n(t.goals), `${t.goalsPerGame} goals per game across ${seasons} club seasons.`) +
    kpi("Senior appearances", n(t.apps), `${n(t.clubs.apps)} club, ${n(t.country.apps)} Argentina.`) +
    kpi("Argentina goals", n(t.country.goals), `${gpg(t.country.goals, t.country.apps)} per cap across ${n(t.country.apps)} caps.`) +
    kpi("Team trophies", "46", `Plus a record 8 Ballons d'Or. <a href="achievements.html">Full honours list</a>.`) +
    `<div class="kpi progress"><span class="kpi-label">Road to 1,000 goals</span>` +
    `<span class="kpi-value">${n(t.goals)} <small style="font-size:1rem;color:var(--muted)">/ 1,000</small></span>` +
    `<div class="progress-track"><div class="progress-fill" style="width:${(t.goals / 10).toFixed(1)}%"></div></div>` +
    `<span class="kpi-note">${togo} to go${d.calendarYears[d.calendarYears.length - 1].provisional ? ", 2026 season in progress" : ""}. ` +
    `Rough projection at his ${last3[0].year}–${last3[last3.length - 1].year} pace (~${pace.toFixed(0)} a year): 1,000 lands around ${projYear}.</span></div>`;
  function kpi(l, v, s) { return `<div class="kpi"><span class="kpi-label">${l}</span><span class="kpi-value">${v}</span><span class="kpi-note">${s}</span></div>`; }
  el("kpis").classList.add("kpi--hero");
  el("kpis").insertAdjacentHTML("afterend",
    `<div class="share-row"><button type="button" class="btn-primary" id="copyStats">Copy headline stats</button>` +
    `<span class="share-msg" id="copyMsg" role="status" aria-live="polite"></span></div>`);
  const copyStatsBtn = el("copyStats");
  if (copyStatsBtn) {
    copyStatsBtn.addEventListener("click", async () => {
    const text = `Messi: ${n(t.goals)} goals in ${n(t.apps)} senior apps ` +
      `(${n(t.clubs.goals)} club, ${n(t.country.goals)} Argentina), 46 trophies, 8 Ballons d'Or — as of ${d.lastUpdated}.`;
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
      msg.textContent = "Copied — paste it anywhere.";
    } catch {
      msg.textContent = text;
    }
    clearTimeout(copyStatsBtn.dataset.timer);
    copyStatsBtn.dataset.timer = setTimeout(() => { msg.textContent = ""; }, 4000);
    });
  }

  const Q = [
    ["How many goals has Lionel Messi scored?", `<b>${n(t.goals)} career goals</b> in ${n(t.apps)} senior appearances for club and country as of ${esc(d.lastUpdated)}, a rate of ${t.goalsPerGame} goals per game. See the full <a href="goalsbyyear.html">year-by-year breakdown</a>.`],
    ["How many goals did Messi score for Barcelona?", `<b>${n(agg.barcelona.goals)} goals</b> in ${n(agg.barcelona.apps)} games from 2004 to 2021 — including a record 474 in La Liga.`],
    ["How many goals for PSG and Inter Miami?", `<b>${agg.psg.goals} for Paris Saint-Germain</b> and <b>${n(agg.miami.goals)} for Inter Miami</b> (2026 season in progress).`],
    ["How many goals has Messi scored for Argentina?", `<b>${n(t.country.goals)} goals</b> in ${n(t.country.apps)} caps since 2005, including World Cup, Copa América and qualifying goals.`],
    ["What is Messi's best goalscoring year?", `<b>2012, with 91 goals</b> — the most any player has scored in a calendar year. See <a href="goalsbyyear.html">every year</a>.`],
    ["How many trophies has Messi won?", `<b>46 team titles</b> — 35 with Barcelona, 3 with PSG, 3 with Inter Miami and 5 with Argentina — plus 8 Ballons d'Or. <a href="achievements.html">The full list</a>.`],
  ];
  el("qa").innerHTML = Q.map((q) => `<article class="qa"><h3>${q[0]}</h3><p>${q[1]}</p></article>`).join("");
  el("qa").classList.add("qa--dense");

  const order = ["barcelona", "psg", "miami", "argentina"];
  const rows = order.map((k2) => {
    const a = agg[k2];
    return `<tr><th scope="row"><span class="club-cell">${badge(k2)}<span class="club-name">${teamName(k2)}<small>${CLUBS[k2].years}</small></span></span></th>` +
      `<td>${n(a.apps)}</td><td><b>${n(a.goals)}</b></td><td>${gpg(a.goals, a.apps)}</td></tr>`;
  }).join("");
  el("club-card").innerHTML =
    `<table class="data-table"><caption>Appearances and goals for every senior team Lionel Messi has played for, as of ${esc(d.lastUpdated)}. Full competition splits are on the <a href="goalsbyseason.html">goals by season page</a>.</caption>` +
    `<thead><tr><th scope="col" class="left">Team and years</th><th scope="col">Apps</th><th scope="col">Goals</th><th scope="col">Goals per game</th></tr></thead>` +
    `<tbody>${rows}<tr class="total"><th scope="row">Career total</th><td>${n(t.apps)}</td><td>${n(t.goals)}</td><td>${t.goalsPerGame}</td></tr></tbody></table>` + clubTableCaption();
  sortable(el("club-card").querySelector("table"));

  // year widget: dropdown + tiles + full-range bars
  const ys = d.calendarYears;
  const cur = ys[ys.length - 1];
  el("year-sub").textContent = `Pick a year and watch the running total climb — all the way from his 2004 debut to today.`;
  el("year-widget").innerHTML =
    `<div class="year-pick-head"><h3 class="year-pick-title">Messi stats by calendar year</h3>` +
    `<div class="year-pick-control"><label for="yearPick">Year</label><select id="yearPick" class="inline">` +
    ys.slice().reverse().map((r) => `<option value="${r.year}"${r.year === cur.year ? " selected" : ""}>${r.year}</option>`).join("") +
    `</select></div></div><div class="year-tiles" id="yearTiles"></div>` +
    `<figure style="margin:12px 0 0"><div class="spark-wrap" id="yearSpark"></div>` +
    `<figcaption class="figcap">Calendar-year goals, ${ys[0].year} to ${cur.year}${cur.provisional ? " (2026 in progress)" : ""} — peaking at 91 in 2012. <a href="goalsbyyear.html">Open the full table</a>.</figcaption></figure>`;
  const drawYear = (y) => {
    const r = ys.find((x) => x.year === +y);
    if (!r) return;
    el("yearTiles").innerHTML =
      `<div class="tile"><div class="t-val">${r.goals}</div><div class="t-lab">Goals in ${r.year}${r.provisional ? " (so far)" : ""}</div></div>` +
      `<div class="tile"><div class="t-val">${n(r.careerTotal)}</div><div class="t-lab">Career total after ${r.year}</div></div>` +
      `<div class="tile"><div class="t-val">${r.age}</div><div class="t-lab">Age during ${r.year}</div></div>`;
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

  const best = ys.reduce((a, b) => (b.goals > a.goals ? b : a));
  const post30 = ys.filter((r) => r.age >= 30).reduce((s, r) => s + r.goals, 0);
  el("records").innerHTML = [
    [`91`, `<b>Goals in 2012</b>, the most any footballer has scored in a single calendar year — ${best.goals} in ${best.apps || "all competitions"}.`],
    [`8`, `<b>Ballons d'Or</b> (2009–12, 2015, 2019, 2021, 2023) — more than any other player in history.`],
    [`474`, `<b>La Liga goals</b>, the all-time record for the competition and for any single European top flight.`],
    [`129`, `<b>Champions League goals</b> — 120 for Barcelona and 9 for PSG, the second-most in the competition's history.`],
    [n(post30), `<b>Goals since turning 30</b> — about ${Math.round((post30 / t.goals) * 100)}% of his entire career total, scored from 2017 onward.`],
    [`57`, `<b>Hat-tricks or more</b> for club and country across his senior career (provisional tally).`],
    [`46`, `<b>Team trophies</b> — the most decorated career in football history, crowned by the 2022 World Cup.`],
  ].map((r) => `<div class="record"><span class="num">${r[0]}</span><span>${r[1]}</span></div>`).join("");

  el("silver").innerHTML =
    `<table class="data-table"><caption>46 senior team titles, club by club, plus the headline individual honours.</caption>` +
    `<thead><tr><th scope="col" class="left">Trophy</th><th scope="col">Times</th><th scope="col" class="left">Note</th></tr></thead><tbody>` +
    `<tr><th scope="row">Team trophies — Barcelona</th><td>35</td><td class="left">2005 to 2021, incl. 4 Champions Leagues</td></tr>` +
    `<tr><th scope="row">Team trophies — Argentina</th><td>5</td><td class="left">World Cup 2022, Copas América 2021 &amp; 2024, Finalissima 2022, Olympic gold 2008</td></tr>` +
    `<tr><th scope="row">Team trophies — PSG</th><td>3</td><td class="left">Ligue 1 2022 &amp; 2023, Trophée des Champions 2022</td></tr>` +
    `<tr><th scope="row">Team trophies — Inter Miami</th><td>3</td><td class="left">Leagues Cup 2023, Supporters' Shield 2024, MLS Cup 2025</td></tr>` +
    `<tr><th scope="row">Ballon d'Or</th><td>8</td><td class="left">Record — 2009–12, 2015, 2019, 2021, 2023</td></tr>` +
    `</tbody></table>`;
  sortable(el("silver").querySelector("table"));

  const m = d.byFinish;
  el("split").innerHTML = `<div class="split-grid">` +
    `<div class="split-card"><div class="s-val">${m.freeKicks}</div><div class="s-lab">Free-kick goals</div><div class="s-note">Curled in for club and country (provisional tally).</div></div>` +
    `<div class="split-card"><div class="s-val">${m.penalties}</div><div class="s-lab">Penalty goals</div><div class="s-note">Around one in eight of all his goals (provisional tally).</div></div>` +
    `<div class="split-card"><div class="s-val">${d.hatTricks}</div><div class="s-lab">Hat-tricks or more</div><div class="s-note">Three-plus-goal games, all competitions.</div></div></div>` +
    `<p class="caveat">Free-kick and penalty splits are a widely published compiled tally — provisional until a full match-by-match hand count is finished. The ${n(t.goals)} total is unaffected.</p>`;

  el("faq").innerHTML = [
    ["How many goals has Messi scored in total?", `<b>${n(t.goals)} in ${n(t.apps)}</b> senior games — ${n(t.clubs.goals)} at club level and ${n(t.country.goals)} for Argentina.`],
    ["How many goals did Messi score in 2012?", `<b>91</b> — 79 for Barcelona and 12 for Argentina, a world record for a calendar year.`],
    ["How many World Cup goals does Messi have?", `<b>${d.byCompetition.find((r) => r.competition === "FIFA World Cup").goals}</b> — the all-time record until Kylian Mbappé overtook him at the 2026 finals — crowned by 7 in Qatar 2022 and 8 in 2026.`],
    ["How many free kicks has Messi scored?", `<b>${m.freeKicks}</b> in senior football (provisional tally, counting by hand).`],
    ["How many penalties has Messi scored?", `<b>${m.penalties}</b> (same provisional basis).`],
    ["How many Ballons d'Or has Messi won?", `<b>Eight</b> — 2009, 2010, 2011, 2012, 2015, 2019, 2021 and 2023.`],
    ["How many trophies has Messi won?", `<b>46 team titles</b> plus every major individual award. <a href="achievements.html">Every trophy listed</a>.`],
    ["How often is this site updated?", `After every match, by hand, from named sources — the date stamp at the top of the page shows the last check (${esc(d.lastUpdated)}).`],
  ].map((q) => `<article class="qa"><h3>${q[0]}</h3><p>${q[1]}</p></article>`).join("");

  renderExplore(d, "home");
  renderMethod(d, "");
  renderOnThisDay();
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
    container.innerHTML = `<p class="otd-error">Could not load today's match history. <a href="birthday.html">Check birthday explorer &rarr;</a></p>`;
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
    container.innerHTML = `<p class="otd-empty">No match data on record for today. <a href="birthday.html">Explore all 365 days &rarr;</a></p>`;
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
            <video controls playsinline preload="metadata" poster="img/og-messi.jpg" src="${esc(activeVideo.videoUrl)}" class="otd-video-element">
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
          <a href="birthday.html?date=${todayKey}" class="btn btn-secondary btn-sm otd-bday-link">
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
            <a href="birthday.html?date=${todayKey}" class="btn btn-primary btn-sm">
              Explore All 365 Days &rarr;
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

    const vid = container.querySelector("video");
    if (vid) {
      vid.addEventListener("error", () => {
        const frame = container.querySelector(".otd-player-frame");
        if (frame) {
          frame.innerHTML = `
            <div class="otd-no-video">
              <div class="otd-no-video-inner">
                <p>📺 Video clip direct stream unavailable.</p>
                <a href="https://www.youtube.com/results?search_query=Lionel+Messi+goal+vs+${encodeURIComponent(activeMatch.opponent)}+${activeMatch.date}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">
                  🔍 Search clip on YouTube &rarr;
                </a>
              </div>
            </div>`;
        }
      });
      vid.addEventListener("play", () => {
        try {
          trackVideoPlay(activeMatch.opponent, activeMatch.date, activeMatch.competition);
        } catch (_) {}
      }, { once: true });
    }

    const shareBtn = container.querySelector(".otd-share-btn");
    if (shareBtn) {
      shareBtn.addEventListener("click", async () => {
        const shareText = `On this day in history (${dayData.formatted}), Lionel Messi scored vs ${activeMatch.opponent}! Watch the goal:`;
        const shareUrl = `${location.origin}/birthday.html?date=${todayKey}`;
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

/* ================= GOALS BY YEAR ================= */
function renderByYear(d) {
  const ys = d.calendarYears, t = d.totals;
  const best = ys.reduce((a, b) => (b.goals > a.goals ? b : a));
  const last = ys[ys.length - 1];
  setHead(d, `From his first senior goal in ${ys[0].year} to <b>${best.goals} in ${best.year}</b> — every calendar year of a ${n(t.goals)}-goal career, with running totals and his age.`);
  el("combo-card").innerHTML =
    `<figure style="margin:0"><div class="spark-wrap">${sparkSVG(
      ys.map((x) => ({ label: String(x.year), value: x.goals, year: x.year, provisional: x.provisional, peak: x.year === best.year, tip: `${x.year}: ${x.goals} goals (career total ${x.careerTotal})` })),
      { cumulative: true, peakYear: 2012, provisionalYear: 2026, linkPrefix: "goalsbyyear.html#y", label: `Messi goals per calendar year with cumulative career total, peaking at ${best.goals} in ${best.year}` }
    )}</div><figcaption class="figcap">Bars: goals that year (peak ${best.goals}, ${best.year}). Line: climb to ${n(t.goals)}.</figcaption></figure>`;
  el("kpis").innerHTML =
    kpi4("Career goals", n(t.goals), `After ${last.year}${last.provisional ? " (in progress)" : ""}.`) +
    kpi4("Best year", `${best.year} · ${best.goals}`, "A world record for a calendar year.") +
    kpi4(`${last.year} so far`, last.goals, last.provisional ? "Season in progress." : "Final tally.") +
    kpi4("Scoring years", ys.length, `Every year from ${ys[0].year} to ${last.year}.`);
  const decades = [["2000s", 2004, 2009], ["2010s", 2010, 2019], ["2020s", 2020, last.year]];
  const decEl = el("decades");
  if (decEl) decEl.innerHTML = decades.map(([lab, a, b]) => {
    const rows = ys.filter((r) => r.year >= a && r.year <= b);
    const sum = rows.reduce((s, r) => s + r.goals, 0);
    const pk = rows.reduce((x, y) => (y.goals > x.goals ? y : x));
    return kpi4(`Goals in the ${lab}`, n(sum), `${a}–${b}, peaking at ${pk.goals} in ${pk.year}.`);
  }).join("");
  el("table-sub").textContent = `Newest first. 2026 is starred while the season is still being played. Click a column to sort, or type to filter. Famous seasons get a footnote — hover the year.`;
  /* Margin notes for the seasons every fan knows. Famous facts only, each one
     backed by the trophy list or the records above — never new claims. */
  const YEAR_NOTES = {
    2005: "First senior goals",
    2009: "First Ballon d'Or · the sextuple",
    2012: "91 — the all-time record",
    2014: "World Cup final · Golden Ball",
    2019: "Sixth Ballon d'Or",
    2021: "Copa América · farewell to Barça",
    2022: "World Cup winner",
    2023: "Eighth Ballon d'Or · the Miami move",
    2024: "Copa América winner",
  };
  el("year-table").innerHTML =
    `<table class="data-table"><caption>Goals, running career total and age for every calendar year since Messi's 2004 debut.</caption>` +
    `<thead><tr><th scope="col" class="left">Year</th><th scope="col">Goals</th><th scope="col">Career total</th><th scope="col">Age</th></tr></thead><tbody>` +
    ys.slice().reverse().map((r) =>
      `<tr id="y${r.year}"${r.provisional ? ' class="total"' : ""}><th scope="row">${r.year}${r.provisional ? " *" : ""}` +
      (YEAR_NOTES[r.year] ? `<span class="yr-note">${YEAR_NOTES[r.year]}</span>` : "") +
      `</th><td><b>${r.goals}</b></td><td>${n(r.careerTotal)}</td><td>${r.age}</td></tr>`
    ).join("") + `</tbody></table>` +
    (last.provisional ? `<p class="caveat">* ${last.year} season in progress — refreshes after each appearance.</p>` : "");
  sortable(el("year-table").querySelector("table"));
  tableSearch(el("year-table").querySelector("table"), "Filter years — e.g. 2012", "q");
  el("bestyear").innerHTML =
    `<p><b>${best.year} is the greatest goalscoring year football has seen: ${best.goals} goals</b> — 79 for Barcelona and 12 for Argentina — ` +
    `breaking Gerd Müller's 40-year-old record of 85. It included a run of 33 league games scored in consecutively and a five-goal Champions League night against Bayer Leverkusen.</p>` +
    `<p>The next-best years, 2011 (60) and 2010 (60), show how far ahead of normal — even his own normal — that season was. ` +
    `<a href="dashboard.html">See how those goals break down by competition</a>.</p>`;
  renderExplore(d, "byyear");
  renderMethod(d, "");
}
function kpi4(l, v, s) { return `<div class="kpi"><span class="kpi-label">${l}</span><span class="kpi-value">${v}</span><span class="kpi-note">${s}</span></div>`; }

/* ================= GOALS BY SEASON ================= */
function renderBySeason(d) {
  const ss = d.clubSeasons, t = d.totals;
  const best = ss.reduce((a, b) => (b.goals > a.goals ? b : a));
  setHead(d, `Every club season from 2004/05 to 2026 — <b>best: ${best.goals} goals in ${best.season}</b> — with league, cup and continental splits, plus Argentina year by year.`);
  const g = ss.reduce((a, s) => ({
    apps: a.apps + s.apps, goals: a.goals + s.goals,
    la: a.la + s.league.apps, lg: a.lg + s.league.goals,
    ca: a.ca + s.cup.apps, cg: a.cg + s.cup.goals,
    ua: a.ua + s.continental.apps, ug: a.ug + s.continental.goals,
    oa: a.oa + s.other.apps, og: a.og + s.other.goals,
  }), { apps: 0, goals: 0, la: 0, lg: 0, ca: 0, cg: 0, ua: 0, ug: 0, oa: 0, og: 0 });
  const pg = (a2, g2) => `${n(a2)} / ${n(g2)}`;
  el("club-sub").textContent = `Apps / goals in each format. 2026 is the season in progress. Click a column to sort, or type to filter.`;
  el("club-table").innerHTML =
    `<table class="data-table"><caption>All ${ss.length} club seasons: Barcelona 2004/05–2020/21, PSG 2021/22–2022/23, Inter Miami 2023–2026.</caption>` +
    `<thead><tr><th scope="col" class="left">Season</th><th scope="col" class="left">Club</th><th scope="col">Apps</th><th scope="col">Goals</th><th scope="col">League</th><th scope="col">Cup</th><th scope="col">Continental</th><th scope="col">Other</th></tr></thead><tbody>` +
    ss.map((s) => `<tr id="s${s.season.slice(0, 4)}"${s.provisional ? ' class="total"' : ""}><th scope="row">${esc(s.season)}${s.provisional ? " *" : ""}` + (s.season === best.season ? `<span class="yr-note">Best club season</span>` : "") + `</th>` +
      `<td class="left">${dispClub(s.club)}</td><td>${n(s.apps)}</td><td><b>${n(s.goals)}</b></td>` +
      `<td>${pg(s.league.apps, s.league.goals)}</td><td>${pg(s.cup.apps, s.cup.goals)}</td>` +
      `<td>${pg(s.continental.apps, s.continental.goals)}</td><td>${pg(s.other.apps, s.other.goals)}</td></tr>`).join("") +
    `<tr class="total"><th scope="row" colspan="2">Club total</th><td>${n(g.apps)}</td><td>${n(g.goals)}</td>` +
    `<td>${pg(g.la, g.lg)}</td><td>${pg(g.ca, g.cg)}</td><td>${pg(g.ua, g.ug)}</td><td>${pg(g.oa, g.og)}</td></tr></tbody></table>`;
  const cy = d.countryYears;
  el("country-sub").textContent = `Competitive qualifiers and tournaments plus friendlies, newest first.`;
  el("country-table").innerHTML =
    `<table class="data-table"><caption>Argentina goals by calendar year, 2005 to 2026.</caption>` +
    `<thead><tr><th scope="col" class="left">Year</th><th scope="col">Apps</th><th scope="col">Goals</th><th scope="col" class="left">Note</th></tr></thead><tbody>` +
    cy.slice().reverse().map((s) => {
      const note = s.note || `Qualifiers/tournaments ${s.competitive[0]} apps, ${s.competitive[1]} goals · Friendlies ${s.friendly[0]} apps, ${s.friendly[1]} goals`;
      return `<tr${s.provisional ? ' class="total"' : ""}><th scope="row">${s.year}${s.provisional ? " *" : ""}</th><td>${s.apps}</td><td><b>${s.goals}</b></td><td class="left">${esc(note)}</td></tr>`;
    }).join("") +
    `<tr class="total"><th scope="row">Argentina total</th><td>${t.country.apps}</td><td>${t.country.goals}</td><td class="left"></td></tr></tbody></table>`;
  sortable(el("club-table").querySelector("table"));
  tableSearch(el("club-table").querySelector("table"), "Filter seasons — e.g. PSG, 2012", "season");
  sortable(el("country-table").querySelector("table"));
  tableSearch(el("country-table").querySelector("table"), "Filter Argentina years — e.g. 2022", "country");
  el("bestseason").innerHTML =
    `<p><b>${best.season} — ${best.goals} goals in ${best.apps} games for Barcelona</b> — is the most prolific club season ever played: ` +
    `50 in La Liga (a record), 14 in the Champions League, 3 in the Copa del Rey and 6 in the super cups. He scored in every competition he entered.</p>` +
    `<p>It sits at the heart of a four-season stretch (2009/10–2012/13) in which he never dropped below 53 club goals. ` +
    `<a href="goalsbyyear.html">The same goals counted by calendar year</a>.</p>`;
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

function renderDashboard(d, team) {
  const T = TEAM_COMPS[team] ? team : "all";
  const name = T === "all" ? "all teams" : teamName(T);
  const sum = (arr) => arr.reduce((a, r) => a + r[1], 0);
  const goals = T === "all" ? d.totals.goals : sum(TEAM_COMPS[T]);
  const apps = T === "all" ? d.totals.apps : T === "argentina" ? d.totals.country.apps : clubAgg(d)[T].apps;
  const pills = [["all", "All teams"], ["barcelona", "Barcelona"], ["psg", "PSG"], ["miami", "Inter Miami"], ["argentina", "Argentina"]];
  setHead(d, `Every Messi goal sliced four ways — by competition, by season, by finish and by body part — filtered to <b>${esc(name)}</b>. Tap a team to re-cut every chart.`);
  el("pills").innerHTML = pills.map((p) => `<button class="pill${T === p[0] ? " on" : ""}" data-team="${p[0]}" aria-pressed="${T === p[0]}">` +
    (p[0] === "all" ? "" : `<img class="pill-crest" src="img/teams/${p[0]}.png" alt="" width="20" height="20" loading="eager" decoding="async" onerror="this.remove()">`) +
    `${p[1]}</button>`).join("");
  el("pills").querySelectorAll(".pill").forEach((b) =>
    b.addEventListener("click", () => {
      const url = new URL(location.href);
      if (b.dataset.team === "all") url.searchParams.delete("team");
      else url.searchParams.set("team", b.dataset.team);
      location.href = url.pathname + (url.search === "?" ? "" : url.search);
    })
  );
  if (el("filter-note"))
    el("filter-note").textContent = `Showing ${name}: ${n(goals)} goals in ${n(apps)} apps` +
      (T === "barcelona" || T === "psg" ? " (Champions League split: Barcelona 120, PSG 9 — derived from club sources)." : ".");
  el("kpis").innerHTML =
    kpi4("Goals", n(goals), `For ${name}.`) +
    kpi4("Appearances", n(apps), `For ${name}.`) +
    kpi4("Goals per game", gpg(goals, apps), `For ${name}.`);

  const compRows = T === "all" ? d.byCompetition : TEAM_COMPS[T].map((r) => ({ competition: r[0], goals: r[1] }));
  const cmax = Math.max(...compRows.map((r) => r.goals));
  el("comp-card").innerHTML =
    `<div class="hbars">` + compRows.map((r) =>
      `<div class="hbar-row"><span class="hbar-name">${esc(r.competition)}</span>` +
      `<span class="hbar-track"><span class="hbar-fill${r.goals === cmax ? " top" : ""}" style="width:${((r.goals / cmax) * 100).toFixed(1)}%"></span></span>` +
      `<span class="hbar-val">${r.goals}</span></div>`
    ).join("") + `</div>`;
  if (!compRows.length) {
    el("comp-card").insertAdjacentHTML("beforeend", `<p class="chart-empty">No rows for this team filter.</p>`);
  }

  let seasonRows;
  if (T === "all" || T === "argentina") {
    const src = T === "all" ? d.calendarYears : d.countryYears;
    seasonRows = src.map((r) => ({ label: String(r.year ?? r.season ?? ""), value: r.goals, tip: `${r.year}: ${r.goals} goals` }));
  } else {
    seasonRows = d.clubSeasons.filter((s) => CLUB_KEY[s.club] === T)
      .map((s) => ({ label: s.season.length > 4 ? s.season.replace("20", "").replace("/20", "–") : s.season, value: s.goals, tip: `${s.season} (${dispClub(s.club)}): ${s.goals} goals` }));
  }
  const smax = Math.max(...seasonRows.map((r) => r.value));
  seasonRows.forEach((r) => { r.peak = r.value === smax; });
  el("season-card").innerHTML =
    `<figure style="margin:0"><div class="spark-wrap">${sparkSVG(seasonRows, { skipLabels: seasonRows.length > 12, label: `Messi goals season by season for ${name}` })}</div>` +
    `<figcaption class="figcap">${T === "all" ? "Calendar years, 2004 to 2026." : T === "argentina" ? "Argentina calendar years." : "Club seasons for " + esc(name) + "."}</figcaption></figure>`;

  const showFinish = T === "all" || T === "argentina" || T === "miami";
  const finishParts = [["Open play", d.byFinish.openPlay], ["Penalties", d.byFinish.penalties], ["Free kicks", d.byFinish.freeKicks]]
    .map((p) => ({ label: p[0], value: p[1], color: FINISH_COLORS[p[0]] }));
  el("finish-card").innerHTML = showFinish
    ? `<div class="donut-flex">${donutSVG(
        finishParts,
        d.totals.goals, n(d.totals.goals), "career goals"
      )}<ul class="legend">` +
      finishParts
        .map((p) => `<li class="lg-row"><span class="sw" style="background:${p.color}"></span><span class="lg-name">${p.label}</span><span class="lg-val">${p.value} <small>(${((p.value / d.totals.goals) * 100).toFixed(1)}%)</small></span></li>`).join("") +
      `</ul></div><p class="caveat">Career totals for all teams combined — no per-team split exists. Provisional until a full hand count finishes.</p>`
    : `<p class="caveat">No per-team finish split exists, so this chart only covers all teams combined — see the career totals below. ` +
      `Messi's ${n(d.totals.goals)} goals break down as ${d.byFinish.openPlay} open play, ${d.byFinish.penalties} penalties and ${d.byFinish.freeKicks} free kicks (provisional).</p>`;
  // Donut cards carry their own inline .caveat; no table caption applies.

  const bodyParts = [["Left foot", d.byBodyPart.left], ["Right foot", d.byBodyPart.right], ["Head", d.byBodyPart.head], ["Other", d.byBodyPart.other]]
    .map((p) => ({ label: p[0], value: p[1], color: BODY_COLORS[p[0]] }));
  el("body-card").innerHTML =
    `<div class="donut-flex">${donutSVG(
      bodyParts,
      d.totals.goals, n(d.byBodyPart.left), "left-foot goals"
    )}<ul class="legend">` +
    bodyParts
      .map((p) => `<li class="lg-row"><span class="sw" style="background:${p.color}"></span><span class="lg-name">${p.label}</span><span class="lg-val">${p.value} <small>(${((p.value / d.totals.goals) * 100).toFixed(1)}%)</small></span></li>`).join("") +
    `</ul></div><p class="caveat">Career totals for all teams combined (provisional until a full hand count finishes).</p>`;
  // Donut cards carry their own inline .caveat; no table caption applies.

  const ageEl = el("age-card");
  if (ageEl) {
    const ys = d.calendarYears;
    const amax = Math.max(...ys.map((r) => r.goals));
    const apeak = ys.reduce((a, b) => (b.goals > a.goals ? b : a));
    ageEl.innerHTML = T === "all"
      ? `<div class="hbars">` + ys.map((r) =>
        `<div class="hbar-row"><span class="hbar-name">Age ${r.age} · ${r.year}</span>` +
        `<span class="hbar-track"><span class="hbar-fill${r.goals === amax ? " top" : ""}" style="width:${((r.goals / amax) * 100).toFixed(1)}%"></span></span>` +
        `<span class="hbar-val">${r.goals}</span></div>`
      ).join("") + `</div><p class="caveat">Every senior goal by the age he scored it — club and country combined. Peak: ${apeak.goals} at age ${apeak.age} (${apeak.year}).</p>`
      : `<p class="caveat">Ages mix club and country goals, so this chart covers the full career only — clear the team filter to see it.</p>`;
  }

  el("comp-table").innerHTML =
    `<table class="data-table"><caption>Goals by competition — ${esc(name)}.</caption>` +
    `<thead><tr><th scope="col" class="left">Competition</th><th scope="col">Goals</th><th scope="col">Share</th></tr></thead><tbody>` +
    compRows.map((r) => `<tr><th scope="row">${esc(r.competition)}${r.team ? `<small class="comp-team">${esc(r.team)}</small>` : ""}` + (T === "all" && r.competition === "La Liga" ? `<span class="yr-note">All-time competition record</span>` : "") + (T === "all" && r.competition === "UEFA Champions League" ? `<span class="yr-note">120 Barcelona · 9 PSG</span>` : "") + `</th><td><b>${r.goals}</b></td><td>${((r.goals / goals) * 100).toFixed(1)}%</td></tr>`).join("") +
    `</tbody></table>`;
  // Competition splits are verified cross-checked totals: table caption only, no provisional note.
  el("comp-table").insertAdjacentHTML("beforeend", clubTableCaption());
  el("finish-table").innerHTML =
    `<table class="data-table"><caption>How the goals were scored and with what — career totals, all teams.</caption>` +
    `<thead><tr><th scope="col" class="left">Finish</th><th scope="col">Goals</th><th scope="col">Share</th></tr></thead><tbody>` +
    [["Open play", d.byFinish.openPlay], ["Penalties", d.byFinish.penalties], ["Free kicks", d.byFinish.freeKicks]]
      .map((r) => `<tr><th scope="row">${r[0]}</th><td><b>${r[1]}</b></td><td>${((r[1] / d.totals.goals) * 100).toFixed(1)}%</td></tr>`).join("") +
    `<tr><th scope="row">Left foot</th><td><b>${d.byBodyPart.left}</b></td><td>${((d.byBodyPart.left / d.totals.goals) * 100).toFixed(1)}%</td></tr>` +
    `<tr><th scope="row">Right foot</th><td><b>${d.byBodyPart.right}</b></td><td>${((d.byBodyPart.right / d.totals.goals) * 100).toFixed(1)}%</td></tr>` +
    `<tr><th scope="row">Head</th><td><b>${d.byBodyPart.head}</b></td><td>${((d.byBodyPart.head / d.totals.goals) * 100).toFixed(1)}%</td></tr>` +
    `<tr><th scope="row">Other (chest etc.)</th><td><b>${d.byBodyPart.other}</b></td><td>${((d.byBodyPart.other / d.totals.goals) * 100).toFixed(1)}%</td></tr>` +
    `</tbody></table><p class="caveat">Finish and body-part splits are a provisional compiled tally.</p>`;
  // Finish/body splits already carry an inline .caveat above: table caption only, no duplicate note.
  el("finish-table").insertAdjacentHTML("beforeend", clubTableCaption());
  /* Per-team cards: career-wide, unaffected by the ?team= filter. */
  const tc = el("team-cards");
  if (tc) {
    const aggAll = clubAgg(d);
    const order = ["barcelona", "psg", "miami", "argentina"];
    tc.innerHTML = order.map((k) => {
      const a = aggAll[k];
      const share = ((a.goals / d.totals.goals) * 100).toFixed(1);
      return `<article class="team-card"><div class="team-card-head">${badge(k)}` +
        `<div><strong>${teamName(k)}</strong><span class="sub">${CLUBS[k].years}</span></div>` +
        `<span class="team-share">${share}% of ${n(d.totals.goals)}</span></div>` +
        `<div class="team-nums"><div><b>${n(a.goals)}</b><span>goals</span></div>` +
        `<div><b>${n(a.apps)}</b><span>apps</span></div>` +
        `<div><b>${gpg(a.goals, a.apps)}</b><span>per game</span></div></div>` +
        `<div class="team-bar" role="img" aria-label="${teamName(k)}: ${n(a.goals)} goals"><span style="width:${((a.goals / aggAll.barcelona.goals) * 100).toFixed(1)}%"></span></div></article>`;
    }).join("");
  }

  /* Records strip: the landmark numbers behind these charts, all from this dataset. */
  const dr = el("dash-records");
  if (dr) {
    const comp = (nm) => (d.byCompetition.find((r) => r.competition === nm) || {}).goals || 0;
    dr.innerHTML = [
      ["91", `<b>Goals in 2012</b> — the most any footballer has scored in a calendar year.`],
      [n(comp("La Liga")), `<b>La Liga goals</b>, the competition's all-time record, all for Barcelona.`],
      [n(comp("UEFA Champions League")), `<b>Champions League goals</b> — 120 for Barcelona, 9 for PSG.`],
      ["8", `<b>Ballons d'Or</b>, more than any player in history (2009–12, 2015, 2019, 2021, 2023).`],
      [n(d.hatTricks), `<b>Hat-tricks or more</b> for club and country (provisional tally).`],
      ["46", `<b>Team trophies</b> — the most decorated career football has seen.`],
    ].map((r) => `<div class="record"><span class="num">${r[0]}</span><span>${r[1]}</span></div>`).join("");
  }

  sortable(el("comp-table").querySelector("table"));
  sortable(el("finish-table").querySelector("table"));
  renderExplore(d, "dashboard");
  renderMethod(d, "Champions League goals split Barcelona 120 / PSG 9 from club sources; other team-filtered competition splits follow the club-season competition mapping and are documented in the data file.");
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
function renderTimeline(d) {
  const t = d.totals;
  setHead(d, `From his Barcelona debut in 2004 to <b>${n(t.goals)} career goals</b> and counting — the defining nights, records and trophies, dated and in order.`);
  el("keydates").innerHTML =
    `<ol class="keydates">` +
    `<li><span class="kd-date">16 Oct 2004</span><span>Senior debut for <b>Barcelona</b> against Espanyol, aged 17.</span></li>` +
    `<li><span class="kd-date">1 May 2005</span><span>First senior goal, against Albacete — Barcelona's youngest scorer at the time.</span></li>` +
    `<li><span class="kd-date">17 Aug 2005</span><span><b>Argentina</b> debut against Hungary.</span></li>` +
    `<li><span class="kd-date">2012</span><span><b>91 goals</b> in the calendar year — football's all-time record.</span></li>` +
    `<li><span class="kd-date">18 Dec 2022</span><span>Wins the <b>World Cup</b> with Argentina in Qatar, scoring twice in the final.</span></li>` +
    `<li><span class="kd-date">${esc(d.lastUpdated)}</span><span><b>${n(t.goals)} career goals</b> for club and country — last checked this date.</span></li>` +
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
    if (/record/i.test(txt)) return "Record";
    if (/ballon/i.test(txt)) return "Ballon d'Or";
    if (/world cup/i.test(txt)) return "World Cup";
    if (/first |debut|youngest/i.test(txt)) return "First";
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
    return `<p class="ch-callout">Peak year <b>${pk.year} · ${pk.goals} goals</b>` +
      (tr ? ` · <b>${tr}</b> team ${tr === 1 ? "trophy" : "trophies"} won in this span` : "") + `</p>`;
  };
  /* Chapters: per-era goal bars, date badges, milestone markers, live chip. */
  el("chapters").innerHTML = groups.map((c, i) => {
    const last = i === groups.length - 1;
    const share = ((c.goalsInEra / totalGoals) * 100).toFixed(1);
    const width = ((c.goalsInEra / peak) * 100).toFixed(1);
    return `<article class="chapter tl-reveal" id="era-${i}">` +
      `<div class="ch-head"><span class="ch-era">${esc(c.era)}</span>` +
      (last ? ` <span class="chip">in progress</span>` : "") +
      `<span class="ch-range" style="margin-left:auto">${esc(c.range)} · ${n(c.goalsInEra)} goals</span></div>` +
      `<div class="ch-goalbar" role="img" aria-label="${esc(c.era)}: ${n(c.goalsInEra)} goals, ${share} percent of a ${n(totalGoals)}-goal career">` +
      `<span class="ch-goalbar-fill" style="width:${width}%"></span></div>` +
      `<p class="ch-goalnote"><b>${n(c.goalsInEra)} goals</b> · ${share}% of ${n(totalGoals)}</p>` +
      eraIntro(c.era) +
      calloutFor(c) +
      eraPhotos(c.era) +
      `<ol class="tl-events">` + c.events.map((e) => {
        const tag = tagFor(e.event);
        return `<li class="tl-event${tag === "Record" ? " rec" : ""}" data-text="${esc((e.year + " " + e.event).toLowerCase())}">` +
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
    const tools = document.createElement("div");
    tools.className = "tl-tools";
    tools.innerHTML = `<div class="tl-search"><label class="tl-search-label" for="tl-filter">Filter milestones</label>` +
      `<input id="tl-filter" type="search" placeholder="Filter milestones" autocomplete="off" aria-describedby="tl-count"></div>` +
      `<p class="tl-count" id="tl-count" role="status" aria-live="polite"></p>`;
    nav.after(tools);
    inp = el("tl-filter");
  }
  const count = el("tl-count");
  const paintCount = (shown) => {
    if (!count) return;
    count.textContent = shown === totalEvents
      ? `${totalEvents} milestones across ${groups.length} eras · ${n(totalGoals)} goals in all`
      : `${shown} of ${totalEvents} milestones match`;
  };
  paintCount(totalEvents);
  inp.addEventListener("input", () => {
    const q = inp.value.trim().toLowerCase();
    let shown = 0;
    document.querySelectorAll("#chapters .chapter").forEach((ch) => {
      let vis = 0;
      ch.querySelectorAll(".tl-event").forEach((li) => {
        const hit = !q || (li.dataset.text || li.textContent.toLowerCase()).includes(q);
        li.hidden = !hit;
        if (hit) { vis++; shown++; }
      });
      ch.hidden = vis === 0;
      if (vis > 0 && q) ch.classList.add("in");
    });
    let empty = el("tl-empty");
    if (shown === 0) {
      if (!empty) {
        empty = document.createElement("p");
        empty.id = "tl-empty";
        empty.className = "tl-empty";
        el("chapters").after(empty);
      }
      empty.textContent = `Nothing matches “${inp.value.trim()}” — clear the search to see all ${totalEvents} milestones.`;
      empty.hidden = false;
    } else if (empty) empty.hidden = true;
    paintCount(shown);
  });
  el("faq").innerHTML = [
    ["When did Messi make his debut?", "For Barcelona on <b>16 October 2004</b> against Espanyol, aged 17 years and 114 days; for Argentina on 17 August 2005."],
    ["When did Messi score his first goal?", "On <b>1 May 2005</b> against Albacete — then the youngest scorer in Barcelona's history."],
    ["When did Messi win the World Cup?", "On <b>18 December 2022</b>, beating France on penalties in the Lusail final after a 3–3 draw."],
    ["When did Messi leave Barcelona?", "In <b>August 2021</b>, joining Paris Saint-Germain after 21 years at the club."],
    ["When did Messi join Inter Miami?", "In <b>July 2023</b>, winning the Leagues Cup within weeks of arriving."],
  ].map((q) => `<article class="qa"><h3>${q[0]}</h3><p>${q[1]}</p></article>`).join("");
  renderExplore(d, "timeline");
  renderMethod(d, "Timeline entries are year- and date-granular milestones; era goal bars split calendar years into non-overlapping spans so they add back up to the career total.");
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
function renderAch(d) {
  const teamRows = d.trophies.filter((x) => x.team !== "Individual");
  const indRows = d.trophies.filter((x) => x.team === "Individual");
  const teamTotal = teamRows.reduce((a, x) => a + x.count, 0);
  const indTotal = indRows.reduce((a, x) => a + x.count, 0);
  const per = {};
  teamRows.forEach((x) => { per[x.team] = (per[x.team] || 0) + x.count; });
  setHead(d, `<b>${teamTotal} team trophies</b> — the most decorated career football has seen — plus a record <b>8 Ballons d'Or</b>. Every title, club by club, with the years won.`);
  el("kpis").innerHTML =
    kpi4("Team trophies", teamTotal, `Barcelona ${per["Barcelona"] || 0} · Argentina ${per["Argentina"] || 0} · PSG ${per["Paris Saint-Germain"] || 0} · Miami ${per["Inter Miami"] || 0}.`) +
    kpi4("Ballons d'Or", "8", "Record — 2009–12, 2015, 2019, 2021, 2023.") +
    kpi4("Champions Leagues", "4", "2006, 2009, 2011, 2015 — all with Barcelona.") +
    kpi4("Major internationals", "3", "World Cup 2022, Copas América 2021 & 2024.");
  el("qa").innerHTML = [
    ["How many trophies has Messi won?", `<b>${teamTotal} senior team titles</b>: ${per["Barcelona"] || 0} Barcelona, ${per["Paris Saint-Germain"] || 0} PSG, ${per["Inter Miami"] || 0} Inter Miami and ${per["Argentina"] || 0} Argentina.`],
    ["How many Ballons d'Or has Messi won?", "<b>Eight</b> — more than any player ever (2009–12, 2015, 2019, 2021, 2023)."],
    ["Has Messi won the World Cup?", "<b>Yes — 2022</b>, scoring twice in the final against France, plus Copas América 2021 and 2024."],
    ["How many Champions Leagues has Messi won?", "<b>Four</b>, all with Barcelona: 2006, 2009, 2011 and 2015."],
  ].map((q) => `<article class="qa"><h3>${q[0]}</h3><p>${q[1]}</p></article>`).join("");
  el("cabinet").innerHTML = cabinetPhotos();
  const order = ["Barcelona", "Paris Saint-Germain", "Inter Miami", "Argentina"];
  const trow = (x) => `<div class="tpill"><span class="tp-name">${esc(x.title)}</span><span class="tp-count">×${x.count}</span>` +
    `<span class="tp-years">${esc(x.years.join(", "))}</span></div>`;
  el("groups").innerHTML = order.map((team) => {
    const rows = teamRows.filter((x) => x.team === team);
    const sub = rows.reduce((a, x) => a + x.count, 0);
    return `<div class="trophy-group"><div class="shead"><h2>${esc(team)} — ${sub} trophies</h2></div>` +
      rows.map(trow).join("") + `</div>`;
  }).join("") + (indRows.length ?
    `<div class="trophy-group"><div class="shead"><h2>Individual honours — ${indTotal} awards</h2></div>` +
    indRows.map(trow).join("") + `</div>` : "");
  el("faq").innerHTML = [
    ["What is Messi's most important trophy?", "The <b>2022 World Cup</b> — the title his whole career had pointed at, won as player of the tournament."],
    ["How many league titles has Messi won?", "<b>Twelve</b> — 10 La Ligas, 2 Ligue 1s — plus an MLS Cup (2025) and a Leagues Cup (2023) with Miami."],
    ["How many individual awards has Messi won?", "Eight Ballons d'Or, six European Golden Shoes and two World Cup Golden Balls — each a record."],
    ["Is Messi the most decorated player ever?", "By team titles plus individual records combined — <b>yes, by any reasonable count</b>."],
  ].map((q) => `<article class="qa"><h3>${q[0]}</h3><p>${q[1]}</p></article>`).join("");
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
              <video controls playsinline webkit-playsinline preload="auto" poster="img/og-messi.jpg" src="${v.videoUrl}" style="width:100%;aspect-ratio:16/9;background:#000;display:block;">
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

      if (shareBtn) {
        shareBtn.hidden = false;
        shareBtn.onclick = async () => {
          const shareText = `Lionel Messi scored ${dayData.goalsCount} goals on my birthday (${dayData.formatted})! Did he score on yours?`;
          const shareUrl = `${location.origin}${location.pathname}?date=${key}`;
          try { trackShare("web_share", shareText); } catch (_) {}
          if (navigator.share) {
            try {
              await navigator.share({ title: "Messi Birthday Stats", text: shareText, url: shareUrl });
              return;
            } catch (_) {}
          }
          copyToClipboard(`${shareText} Check here: ${shareUrl}`, shareMsg);
        };
      }
      const copyBtn = el("bday-copy-btn");
      if (copyBtn) {
        copyBtn.onclick = () => {
          const shareUrl = `${location.origin}${location.pathname}?date=${key}`;
          copyToClipboard(shareUrl, shareMsg);
        };
      }
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

      if (shareBtn) {
        shareBtn.hidden = false;
        shareBtn.onclick = async () => {
          const shareText = `Checking if Lionel Messi scored on my birthday (${dayData.formatted})! Did he score on yours?`;
          const shareUrl = `${location.origin}${location.pathname}?date=${key}`;
          try { trackShare("web_share", shareText); } catch (_) {}
          if (navigator.share) {
            try {
              await navigator.share({ title: "Messi Birthday Stats", text: shareText, url: shareUrl });
              return;
            } catch (_) {}
          }
          copyToClipboard(`${shareText} Find out: ${shareUrl}`, shareMsg);
        };
      }
      const copyBtn = el("bday-copy-btn");
      if (copyBtn) {
        copyBtn.onclick = () => {
          const shareUrl = `${location.origin}${location.pathname}?date=${key}`;
          copyToClipboard(shareUrl, shareMsg);
        };
      }
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
        <div class="bday-month-card">
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

  if (params.get("date")) {
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

