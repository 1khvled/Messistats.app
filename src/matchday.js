// Optional client-side matchday check. DISABLED BY DEFAULT.
// Master switch lives in one place: window.matchdayCheck = { enabled: false }.
// When enabled, and ONLY then, the browser fetches the ESPN MLS scoreboard
// directly (one request) and, if an Inter Miami match is scheduled or final
// today, shows a small banner clearly labeled PROVISIONAL. It never edits
// data, never touches messi-data.json, and fails silently offline.
// Why this exists: the Cloudflare cron CAN run every 2h on the free tier, so
// this file is only defense-in-depth for cron outages or pre-deploy use.
// Tradeoff, stated honestly: enabling it costs one third-party request per
// page view and shows unverified data, so keep it off until you accept that.
// Default off preserves the site zero-third-party runtime property.
(function () {
  var cfg = (typeof window !== "undefined" && window.matchdayCheck) || {};
  if (cfg.enabled !== true) return;
  var SCOREBOARD = "https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/scoreboard";
  function todayUtc() { return new Date().toISOString().slice(0, 10); }
  function banner(text) {
    const host = document.getElementById("banner");
    if (!host) return;
    const s = document.createElement("span");
    s.className = "mut";
    s.textContent = " | PROVISIONAL matchday check: " + text;
    host.appendChild(s);
  }
  fetch(SCOREBOARD, { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null))
    .then((j) => {
      if (!j || !j.events) return;
      const today = todayUtc();
      const mia = j.events.filter((e) => {
        return e && e.date && String(e.date).slice(0, 10) === today && JSON.stringify(e).indexOf("Miami") !== -1;
      });
      if (mia.length === 0) return;
      const e = mia[0];
      const st = (e.status && e.status.type && e.status.type.description) || "scheduled";
      banner((e.name || "Inter Miami match") + " today (" + st + "). Totals below stay verified; see README.");
    })
    .catch(() => {});
})();