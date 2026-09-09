async function load() {
  const r = await fetch("data/messi-data.json", { cache: "no-store" });
  if (!r.ok) throw new Error("data load failed: " + r.status);
  return r.json();
}
function el(id) { return document.getElementById(id); }
function set(id, html) { const t = el(id); if (t) t.innerHTML = html; }
function esc(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function pair(p) { return p ? `${p[0]} / ${p[1]}` : "-"; }
function groupByClub(rows) {
  const m = new Map();
  for (const r of rows) {
    if (!m.has(r.club)) m.set(r.club, { club: r.club, apps: 0, goals: 0, seasons: 0 });
    const g = m.get(r.club); g.apps += r.apps; g.goals += r.goals; g.seasons += 1;
  }
  return [...m.values()];
}
function seasonBars(rows) {
  if (!rows.length) return `<p class="mut">No rows.</p>`;
  const max = Math.max(...rows.map(r => r.goals));
  return rows.map(r => {
    const w = max > 0 ? Math.round((r.goals / max) * 100) : 0;
    const label = `${r.season} ${r.club}, ${r.goals} goals`;
    return `<div class="yrow" role="img" aria-label="${esc(label)}"><span>${esc(r.season)} - ${esc(r.club)}</span><span class="bar"><i style="width:${w}%"></i></span><b>${r.goals}</b></div>`;
  }).join("");
}
function ths(cols) { return cols.map(c => `<th scope="col">${c}</th>`).join(""); }
function seasonTable(rows, caption) {
  const split = rows.some(r => r.league);
  const head = split
    ? ths(["Club", "Season", "League", "Cup", "Cont.", "Other", "Apps", "Goals"])
    : ths(["Club", "Season", "Apps", "Goals"]);
  const body = rows.map(r => split
    ? `<tr><td>${esc(r.club)}</td><td>${esc(r.season)}</td><td>${pair(r.league)}</td><td>${pair(r.cup)}</td><td>${pair(r.continental)}</td><td>${pair(r.other)}</td><td>${r.apps}</td><td>${r.goals}</td></tr>`
    : `<tr><td>${esc(r.club)}</td><td>${esc(r.season)}</td><td>${r.apps}</td><td>${r.goals}</td></tr>`).join("");
  return `<table><caption class="mut small">${esc(caption)}</caption><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}
function render(data) {
  const page = document.body.dataset.page || "home";
  set("banner", `<b>${esc(data.meta.status)}</b> - updated ${esc(data.meta.updated)} - senior first-team matches only; splits reconcile to row totals. Method in data file.`);
  if (page === "home") {
    const g = groupByClub(data.clubSeasons);
    set("club-table", `<table><caption class="mut small">Apps and goals by team (cross-checked rows)</caption><thead><tr>${ths(["Team", "Seasons", "Apps", "Goals"])}</tr></thead><tbody>` +
      g.map(x => `<tr><td>${esc(x.club)}</td><td>${x.seasons}</td><td>${x.apps}</td><td>${x.goals}</td></tr>`).join("") +
      `</tbody></table><p class="mut small">Plus Argentina: ${data.totals.country.appearances} caps / ${data.totals.country.goals} goals. Combined: ${data.totals.combined.appearances} apps / ${data.totals.combined.goals} goals.</p>`);
    set("season-bars", seasonBars(data.clubSeasons));
    const notes = data.meta.verification || [];
    set("claims", "<ul class='tight'>" + notes.map(n => `<li>${esc(n)}</li>`).join("") + "</ul>");
  } else if (page === "byseason") {
    set("season-full", seasonTable(data.clubSeasons, "Club seasons with competition splits, apps / goals"));
    set("country-full", data.countryYears && data.countryYears.length
      ? `<table><caption class="mut small">Argentina by year, competitive and friendly, apps / goals</caption><thead><tr>${ths(["Year", "Competitive", "Friendly", "Apps", "Goals"])}</tr></thead><tbody>` +
        data.countryYears.map(r => `<tr><td>${r.year}</td><td>${pair(r.competitive)}</td><td>${pair(r.friendly)}</td><td>${r.apps}</td><td>${r.goals}</td></tr>`).join("") + `</tbody></table>`
      : `<p class="mut">Argentina year-by-year table pending verification.</p>`);
  } else if (page === "byyear") {
    set("year-bars", seasonBars(data.clubSeasons));
    set("year-note", `<p class="mut">Calendar-year split (Jan-Dec, like ronaldostats goals-by-year) is pending: Euro-season rows cannot be re-cut into calendar years without match dates. Inter Miami rows are already calendar-year. 2026 combined press claim: 29 games / 25 goals / 10 assists on 13 Aug 2026 (ESPN).</p>`);
  } else if (page === "dashboard") {
    const g = groupByClub(data.clubSeasons);
    set("filters", [`<button type="button" data-club="ALL" aria-pressed="true">All</button>`, ...g.map(x => `<button type="button" data-club="${esc(x.club)}" aria-pressed="false">${esc(x.club)}</button>`)].join(" "));
    const show = (club) => {
      const rows = club === "ALL" ? data.clubSeasons : data.clubSeasons.filter(r => r.club === club);
      if (!rows.length) { set("dash-stats", `<p class="mut">No rows.</p>`); set("dash-bars", ""); return; }
      const a = rows.reduce((s, r) => s + r.apps, 0), gl = rows.reduce((s, r) => s + r.goals, 0);
      const best = rows.reduce((m, r) => r.goals > m.goals ? r : m, rows[0]);
      set("dash-stats", `<div class="hero"><div class="stat"><b>${a}</b><span>Apps</span></div><div class="stat"><b>${gl}</b><span>Goals</span></div><div class="stat"><b>${(gl / a).toFixed(2)}</b><span>Goals/game</span></div><div class="stat"><b>${best.goals}</b><span>Best season (${esc(best.season)})</span></div></div>`);
      set("dash-bars", seasonBars(rows));
    };
    const box = el("filters");
    if (box) box.querySelectorAll("button").forEach(b => b.onclick = () => {
      box.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", "false"));
      b.setAttribute("aria-pressed", "true");
      show(b.dataset.club);
    });
    show("ALL");
  } else if (page === "timeline") {
    set("timeline-list", "<ul class='tight'>" + data.timeline.map(t => `<li><b>${t.year}</b> - ${esc(t.event)}</li>`).join("") + "</ul>");
  } else if (page === "achievements") {
    set("trophy-list", `<table><caption class="mut small">Team honours and individual awards</caption><thead><tr>${ths(["Honour", "Team", "Detail"])}</tr></thead><tbody>` +
      data.trophies.map(t => `<tr><td>${esc(t.title)}</td><td>${esc(t.team)}</td><td>${esc(t.years ? t.years.join(", ") : "x" + t.count)}${t.note ? ` <span class="mut">- ${esc(t.note)}</span>` : ""}</td></tr>`).join("") + `</tbody></table>`);
  }
  const f = el("foot-note");
  if (f) f.textContent = "Methodology: " + data.meta.methodology;
}
load().then(render).catch(e => { const b = el("banner"); if (b) b.textContent = "DATA ERROR: " + e.message; console.error(e); });