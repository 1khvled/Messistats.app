/**
 * MessiStats Client-side Analytics Tracker
 * Privacy-friendly, non-blocking, lightweight telemetry.
 * Connects directly to Supabase table: messi_page_events
 */

const SUPABASE_URL = "https://(supabase-url-removed)";
const SUPABASE_ANON_KEY = "(supabase-anon-key-removed)";
const TABLE_NAME = "messi_page_events";

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

// Send event payload to Supabase
async function sendToSupabase(payload) {
  try {
    const endpoint = `${SUPABASE_URL}/rest/v1/${TABLE_NAME}`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": "Bearer " + SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify(payload),
      keepalive: true
    });

    if (!res.ok) {
      if (res.status === 404 || res.status === 401) {
        if (!tableWarningShown) {
          console.warn(`[MessiStats Analytics] Supabase table '${TABLE_NAME}' not ready yet. Check admin page for setup SQL.`);
          tableWarningShown = true;
        }
      }
    }
  } catch (err) {
    // Fail silently so user experience is never impacted
  }
}

function isAdminAuthenticated() {
  try {
    if (sessionStorage.getItem("messi_admin_auth") === "authenticated") return true;
    const p = localStorage.getItem("messi_admin_auth");
    const u = localStorage.getItem("messi_admin_remember_until");
    if (p === "authenticated" && u) {
      const exp = parseInt(u, 10);
      if (!isNaN(exp) && Date.now() < exp) return true;
    }
  } catch (_) {}
  return false;
}

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

  const payload = {
    client_id: getVisitorId(),
    session_id: getSessionId(),
    event: eventType || "view",
    path: window.location.pathname || "/",
    referrer: getCleanReferrer(),
    user_agent: (navigator.userAgent || "").substring(0, 300),
    country_code: getEstimatedCountry(),
    device_type: getDeviceType(),
    meta: meta || {},
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
