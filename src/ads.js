// Ad-slot foundation for messi-stats. NO third-party code, NO external calls.
// Everything stays collapsed (zero height, no layout shift) until the single
// master switch window.adsConfig.enabled is set to true. Default: false, so
// the site keeps its zero-third-party runtime and identical layout.
// ONE place for config: window.adsConfig (defaults below). Pages only add
// this script tag; all placement rules live here.
// Guardrails enforced in code:
// - max 3 slots per page (MAX_PER_PAGE), extra requests are dropped.
// - never inside tables (targets must not be descendants of TABLE).
// - never above the hero on mobile (insertion points are picked below .hero,
//   plus a runtime order check that refuses anything above it).
// - lazy: slots are injected collapsed and only reserve min-height when near
//   the viewport (IntersectionObserver), and min-height applies ONLY while
//   ads are enabled, so disabled pages cannot shift layout.
// - unfilled slots stay collapsed unless placeholderWhenUnfilled is true
//   (models real AdSense collapse-empty behavior; keeps CLS at zero).
// Future AdSense activation: set enabled true, load the AdSense script in
// the page, and call window.adsReady.fill(slot) from adsbygoogle callbacks.
// See README "Ads" for the full activation checklist and UX budgets.
(function () {
  var DEFAULTS = {
    enabled: false,
    maxPerPage: 3,
    placeholderWhenUnfilled: false,
    minHeightDesktop: 250,
    minHeightMobile: 100,
  };
  var cfg = {};
  var g = (typeof window !== "undefined" && window.adsConfig) || {};
  for (const k of Object.keys(DEFAULTS)) cfg[k] = k in g ? g[k] : DEFAULTS[k];
  if (typeof window !== "undefined") window.adsConfig = cfg;
  if (!cfg.enabled) return; // disabled: inject nothing, change nothing.

  var page = (document.body && document.body.dataset && document.body.dataset.page) || "home";
  // Insertion plan per page. "after" selectors are main-level landmarks only.
  var PLAN = {
    home: [
      { id: "ad-in-content", after: ".wrap .card:nth-of-type(2)", label: "in-content" },
      { id: "ad-bottom", after: null, label: "bottom" },
    ],
    dashboard: [
      { id: "ad-in-content", after: ".wrap .card", label: "in-content" },
    ],
  };
  var wanted = PLAN[page] || [];
  var main = document.querySelector("main.wrap") || document.body;
  var hero = main.querySelector(".hero");
  var placed = 0;

  function belowHero(node) {
    if (!hero || !node) return true;
    // Refuse any placement at or above the hero in document order.
    return Boolean(hero.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_PRECEDING);
  }
  function insideTable(node) {
    let n = node;
    while (n) { if (n.tagName === "TABLE") return true; n = n.parentElement; }
    return false;
  }
  function makeSlot(def) {
    const el = document.createElement("aside");
    el.className = "ad-slot";
    el.id = def.id;
    el.setAttribute("aria-label", "Advertisement (" + def.label + ")");
    el.setAttribute("role", "complementary");
    el.dataset.slot = def.label;
    if (cfg.placeholderWhenUnfilled) {
      const ph = document.createElement("div");
      ph.className = "ad-ph";
      ph.textContent = "Advertisement";
      el.appendChild(ph);
    }
    return el;
  }
  function observe(slot) {
    slot.classList.add("ads-watching");
    if (!("IntersectionObserver" in window)) { slot.classList.add("ready"); return; }
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (en.isIntersecting) { slot.classList.add("ready"); io.disconnect(); }
        }
      },
      { rootMargin: "800px 0px" }
    );
    io.observe(slot);
  }

  document.body.classList.add("ads-on");
  for (const def of wanted) {
    if (placed >= Math.min(cfg.maxPerPage, 3)) break;
    let anchor = def.after ? main.querySelector(def.after) : null;
    if (anchor && (insideTable(anchor) || !belowHero(anchor))) anchor = null;
    if (!anchor && def.after) {
      // Fallback: append at end of main (always below hero, never in a table).
      anchor = main.lastElementChild;
    }
    const slot = makeSlot(def);
    if (anchor && anchor.parentElement === main) {
      anchor.after(slot);
    } else {
      main.appendChild(slot);
    }
    if (insideTable(slot)) { slot.remove(); continue; } // paranoia: never in tables.
    observe(slot);
    placed += 1;
  }
  // Public hook for the future AdSense fill callback. No-op until wired.
  window.adsReady = window.adsReady || {
    fill: function (slotId) {
      const s = document.getElementById(slotId);
      if (s) s.classList.add("ready");
    },
  };
})();