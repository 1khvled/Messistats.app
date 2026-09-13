// MessiStats Advertising & Monetization Engine
// Supports both direct Google AdSense serving and high-converting responsive partner units.
(function () {
  var DEFAULTS = {
    enabled: true,
    maxPerPage: 2,
    placeholderWhenUnfilled: true,
    minHeightDesktop: 110,
    minHeightMobile: 130,
  };
  var cfg = {};
  var g = (typeof window !== "undefined" && window.adsConfig) || {};
  for (const k of Object.keys(DEFAULTS)) cfg[k] = k in g ? g[k] : DEFAULTS[k];
  if (typeof window !== "undefined") window.adsConfig = cfg;
  if (!cfg.enabled) return;

  var page = (document.body && document.body.dataset && document.body.dataset.page) || "home";

  var CREATIVES = [
    {
      badge: "Official Gear",
      title: "Lionel Messi F50 & Official Matchday Kits",
      desc: "Shop authentic Inter Miami CF and Argentina albiceleste jerseys, signature boots and training wear.",
      btn: "Shop Official Gear →",
      href: "https://www.adidas.com/us/messi",
    },
    {
      badge: "Live Football",
      title: "Watch Every Messi Match on MLS Season Pass",
      desc: "Stream every Inter Miami regular season match, MLS Cup playoffs, and Leagues Cup live in 1080p.",
      btn: "Watch Every Game →",
      href: "https://tv.apple.com/channel/tvs.sbd.7000",
    },
    {
      badge: "Authentics",
      title: "LM10 Commemorative 8x Ballon d'Or & World Cup Memorabilia",
      desc: "Verified signed jerseys, match balls, and framed iconic photographs from Messi's career.",
      btn: "View Collection →",
      href: "https://www.fanatics.com/",
    },
  ];

  var PLAN = {
    home: [
      { id: "ad-home-mid", after: "#qa", label: "mid-content", crIdx: 0 },
      { id: "ad-home-bottom", after: "#split", label: "bottom", crIdx: 1 },
    ],
    dashboard: [
      { id: "ad-dash-top", after: "#comp-card", label: "in-content", crIdx: 1 },
      { id: "ad-dash-mid", after: "#finish-card", label: "mid-content", crIdx: 0 },
    ],
    byyear: [
      { id: "ad-byyear-mid", after: "#combo-card", label: "in-content", crIdx: 0 },
    ],
    byseason: [
      { id: "ad-byseason-mid", after: "#club-table", label: "in-content", crIdx: 1 },
    ],
    timeline: [
      { id: "ad-tl-mid", after: ".chapter:nth-of-type(3)", label: "in-content", crIdx: 2 },
    ],
    achievements: [
      { id: "ad-ach-mid", after: ".trophy-grid", label: "in-content", crIdx: 2 },
    ],
  };

  var wanted = PLAN[page] || [];
  var main = document.querySelector("main.wrap") || document.body;
  var hero = main.querySelector(".hero");
  var placed = 0;

  function belowHero(node) {
    if (!hero || !node) return true;
    return Boolean(hero.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_PRECEDING);
  }
  function insideTable(node) {
    let n = node;
    while (n) { if (n.tagName === "TABLE") return true; n = n.parentElement; }
    return false;
  }

  function makeSlot(def, idx) {
    const el = document.createElement("aside");
    el.className = "ad-slot";
    el.id = def.id;
    el.setAttribute("aria-label", "Advertisement (" + def.label + ")");
    el.setAttribute("role", "complementary");
    el.dataset.slot = def.label;

    const cr = CREATIVES[def.crIdx !== undefined ? def.crIdx : (idx % CREATIVES.length)];

    el.innerHTML =
      `<span class="ad-label">Advertisement · Sponsored Partner</span>` +
      `<a class="ad-card" href="${cr.href}" target="_blank" rel="noopener sponsored" aria-label="${cr.title} — ${cr.desc}">` +
      `<div><span class="ad-badge">${cr.badge}</span><h3 class="ad-title">${cr.title}</h3><p class="ad-desc">${cr.desc}</p></div>` +
      `<span class="ad-btn">${cr.btn}</span>` +
      `</a>` +
      `<ins class="adsbygoogle" style="display:none" data-ad-client="ca-pub-8397501846754760" data-ad-slot="1234567890" data-ad-format="auto" data-full-width-responsive="true"></ins>`;

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
      { rootMargin: "400px 0px" }
    );
    io.observe(slot);
  }

  document.body.classList.add("ads-on");
  for (let i = 0; i < wanted.length; i++) {
    if (placed >= Math.min(cfg.maxPerPage, 3)) break;
    const def = wanted[i];
    let anchor = def.after ? main.querySelector(def.after) : null;
    if (anchor && (insideTable(anchor) || !belowHero(anchor))) anchor = null;
    if (!anchor && def.after) {
      anchor = main.lastElementChild;
    }
    const slot = makeSlot(def, i);
    if (anchor && anchor.parentElement === main) {
      anchor.after(slot);
    } else {
      main.appendChild(slot);
    }
    if (insideTable(slot)) { slot.remove(); continue; }
    observe(slot);
    placed += 1;
  }

  // Public hook for Google AdSense or external networks when loaded
  window.adsReady = window.adsReady || {
    fill: function (slotId) {
      const s = document.getElementById(slotId);
      if (s) {
        s.classList.add("ready");
        const fallback = s.querySelector(".ad-card");
        const ins = s.querySelector(".adsbygoogle");
        if (fallback && ins && ins.children.length > 0) {
          fallback.style.display = "none";
          ins.style.display = "block";
        }
      }
    },
  };
})();