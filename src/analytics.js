/**
 * MessiStats Client-side Analytics Tracker
 * Privacy-friendly, non-blocking, lightweight telemetry.
 * All inserts go through /api/track (server proxy) so the Supabase
 * URL and keys never appear in the client bundle.
 */

// Generate or retrieve persistent Visitor ID
function getVisitorId() {
  try {
    let vid = localStorage.getItem("messi_vid");
    if (!vid) {
      vid = "v_" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      localStorage.setItem("messi_vid", vid);
    }
    return vid;
  } catch (_) {
    return "anon_" + Math.random().toString(36).substring(2, 9);
  }
}

// Generate or retrieve Session ID (expires when browser session closes)
function getSessionId() {
  try {
    let sid = sessionStorage.getItem("messi_sid");
    if (!sid) {
      sid = "s_" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      sessionStorage.setItem("messi_sid", sid);
    }
    return sid;
  } catch (_) {
    return "session_temp";
  }
}

// Detect device type
function getDeviceType() {
  const w = window.innerWidth || (screen && screen.width) || 1024;
  const ua = navigator.userAgent || "";
  if (/mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    return w >= 768 && w <= 1024 ? "tablet" : "mobile";
  }
  return w < 768 ? "mobile" : (w <= 1024 ? "tablet" : "desktop");
}

// Fast timezone-based country heuristic for 0-latency tracking
function getEstimatedCountry() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (!tz) return null;
    const parts = tz.split("/");
    const city = parts[parts.length - 1];
    const region = parts[0];

    const tzMap = {
      "Algiers": "DZ",
      "Buenos_Aires": "AR",
      "Cordoba": "AR",
      "Madrid": "ES",
      "Barcelona": "ES",
      "Paris": "FR",
      "London": "GB",
      "New_York": "US",
      "Chicago": "US",
      "Los_Angeles": "US",
      "Miami": "US",
      "Toronto": "CA",
      "Montreal": "CA",
      "Mexico_City": "MX",
      "Sao_Paulo": "BR",
      "Bogota": "CO",
      "Santiago": "CL",
      "Lima": "PE",
      "Rome": "IT",
      "Berlin": "DE",
      "Amsterdam": "NL",
      "Brussels": "BE",
      "Zurich": "CH",
      "Riyadh": "SA",
      "Dubai": "AE",
      "Cairo": "EG",
      "Casablanca": "MA",
      "Tunis": "TN",
      "Kolkata": "IN",
      "Tokyo": "JP",
      "Sydney": "AU"
    };

    if (tzMap[city]) return tzMap[city];
    if (region === "Europe") return "EU";
    if (region === "America") return "US";
    if (region === "Africa") return "AF";
    if (region === "Asia") return "AS";
    return null;
  } catch (_) {
    return null;
  }
}

// Clean referrer
function getCleanReferrer() {
  try {
    const ref = document.referrer;
    if (!ref) return "Direct";
    const url = new URL(ref);
    if (url.hostname === location.hostname) return "Internal";
    return url.hostname.replace(/^www\./, "");
  } catch (_) {
    return document.referrer || "Direct";
  }
}

// Save recent local events for offline preview / fallback
function recordLocalEvent(eventRow) {
  try {
    const key = "messi_local_events";
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    existing.unshift(eventRow);
    if (existing.length > 50) existing.pop();
    localStorage.setItem(key, JSON.stringify(existing));
  } catch (_) {}
}

let tableWarningShown = false;

// Send event payload via server proxy (hides Supabase URL/keys from client)
async function sendToSupabase(payload) {
  try {
    const res = await fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true
    });
    if (!res.ok && res.status === 503) {
      if (!tableWarningShown) {
        console.warn("[MessiStats Analytics] tracking proxy not configured (set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in Vercel ENV).");
        tableWarningShown = true;
      }
    }
  } catch (err) {
    // Fail silently so user experience is never impacted
  }
}

function isAdminAuthenticated() {
  // Token-based (server-issued). Cosmetic only — the real gate is the
  // server proxy + RLS; this just keeps admin browsing out of KPIs.
  try {
    const tok = sessionStorage.getItem("messi_admin_token");
    const exp = parseInt(sessionStorage.getItem("messi_admin_token_exp") || "0", 10);
    if (tok && !isNaN(exp) && Date.now() < exp) return true;
    const p = localStorage.getItem("messi_admin_token");
    const u = localStorage.getItem("messi_admin_token_exp");
    if (p && u) {
      const le = parseInt(u, 10);
      if (!isNaN(le) && Date.now() < le) return true;
    }
  } catch (_) {}
  return false;
}

// Client-side abuse caps: the table is INSERT-open by design (public
// tracking), so validate + throttle here AND in the RLS WITH CHECK policy.
const ALLOWED_EVENTS = new Set(["view", "ping", "birthday_search", "video_play", "share"]);
const MAX_EVENTS_PER_SESSION = 300;
let sessionEventCount = 0;
let lastSendAt = 0;

// Core tracking dispatcher
export function trackEvent(eventType, meta = {}) {
  // Never track admin actions as user traffic
  if (window.location.pathname.includes("admin")) {
    return;
  }
  // Ignore logged-in admins even when they browse public pages (not counted in KPIs)
  if (isAdminAuthenticated()) {
    return;
  }
  if (!ALLOWED_EVENTS.has(eventType || "view")) return;
  if (sessionEventCount >= MAX_EVENTS_PER_SESSION) return;
  const nowMs = Date.now();
  // Min 2s between sends — drops runaway loops / spammy callers
  if (nowMs - lastSendAt < 2000 && eventType !== "view") return;

  let safeMeta = {};
  try {
    safeMeta = meta && typeof meta === "object" ? meta : {};
    const s = JSON.stringify(safeMeta);
    if (s.length > 2000) return; // oversized payload — drop
  } catch (_) {
    return;
  }

  const path = String(window.location.pathname || "/").slice(0, 200);
  const referrer = String(getCleanReferrer() || "Direct").slice(0, 200);
  const country = getEstimatedCountry();
  sessionEventCount += 1;
  lastSendAt = nowMs;

  const payload = {
    client_id: String(getVisitorId()).slice(0, 80),
    session_id: String(getSessionId()).slice(0, 80),
    event: eventType || "view",
    path,
    referrer,
    user_agent: (navigator.userAgent || "").substring(0, 300),
    country_code: country ? String(country).slice(0, 8) : null,
    device_type: String(getDeviceType()).slice(0, 16),
    meta: safeMeta || {},
    created_at: new Date().toISOString()
  };

  recordLocalEvent(payload);
  sendToSupabase(payload);
}

// Specialized event shortcuts
export function trackPageView(customPath) {
  trackEvent("view", {
    title: document.title,
    path: customPath || window.location.pathname
  });
}

export function trackBirthdaySearch(dateKey, formatted, goalsCount) {
  trackEvent("birthday_search", {
    dateKey,
    formatted,
    goalsCount: goalsCount || 0
  });
}

export function trackVideoPlay(opponent, date, competition) {
  trackEvent("video_play", {
    opponent,
    date,
    competition
  });
}

export function trackShare(channel, text) {
  trackEvent("share", {
    channel: channel || "generic",
    text: text ? text.substring(0, 100) : ""
  });
}

// Auto-initialize tracking on load
let initialized = false;
export function initAnalytics() {
  if (initialized || typeof window === "undefined") return;
  if (isAdminAuthenticated()) return;
  initialized = true;

  // Track initial page view (skip on admin page)
  if (!window.location.pathname.includes("admin")) {
    trackPageView();

    // Heartbeat ping every 45s while user is actively reading
    setInterval(() => {
      if (document.visibilityState === "visible") {
        trackEvent("ping", {});
      }
    }, 45000);

    // Track tab return
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        trackEvent("ping", { trigger: "visible" });
      }
    });
  }
}

// Expose globally for easy inline calls if needed
if (typeof window !== "undefined") {
  window.MessiAnalytics = {
    trackEvent,
    trackPageView,
    trackBirthdaySearch,
    trackVideoPlay,
    trackShare,
    initAnalytics
  };
}
