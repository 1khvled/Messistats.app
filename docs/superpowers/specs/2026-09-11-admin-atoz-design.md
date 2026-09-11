# Admin A-to-Z Workup — Design (2026-09-11)

Problem: owner has never SEEN the redesign — localhost has no backend, so only the offline fallback ever renders. This workup both overhauls the page AND adds a demo mode so it's visible anywhere.

## Layout: command grid (Task 1)
- Unlocked dashboard becomes two-column (`admin-grid`: main + rail, collapse ≤900px):
  - Main: status strip + command KPIs + visits chart card.
  - Rail: ranked table card + health card + lock control.
- Ranked table: FIXED most-read order — REMOVE `sortable()` from the admin table (ranking IS the order; kills the static-rank-vs-sort nit permanently). Caption says fixed order.
- Per-page share bars: new Share-visual column — inline `.sharebar` (div fill, width % = share, gold for #1). Pure CSS, no new libs.
- Vault restyle: full-height centered composition, inline SVG shield (replace 🛡️ emoji — own artwork language), larger password field, session note. Lock button moves into rail card footer.
- Reduced-motion: inherit (no new animation).

## Demo mode + health (Task 2)
- `?demo=1` query flag: `renderAdmin` uses a mock rollup (fixed sample: home 128, byyear 96, dashboard 74, timeline 61, byseason 44, achievements 31, admin 12) with a prominent DEMO banner (`This is sample data — connect the backend for real numbers`). Works offline/localhost. NEVER writes anywhere; never confuses real path (banner + `demo:true` threaded through render only).
- Health card (REAL client-side data, no backend): dataset sums from loaded `d` (calendarYears/byCompetition vs 927 ✓/✗), `meta.status`, build stamp (`document.lastModified`), backend state (same pill language). Computed live in browser via existing normalized fields.
- Demo linked NOWHERE (super-hide kept); owner types `?demo=1` by hand. Documented in Vercel guide appendix + demo banner.

## Invariants (both tasks)
- Security behavior identical: Bearer gate, 503/401, noindex, no public links, tab-scoped key. Demo never touches fetch/auth lines (branch BEFORE `fetchStats`, clearly fenced).
- `messi-data.json` untouched; 927×3; zero third-party; light theme; `api/count.js` untouched.

## Verification
- Build clean, verify exit 0, `dist/admin.html` present.
- Live: `/admin.html?demo=1` shows FULL dashboard (vault skipped? No — demo still requires... decision: demo BYPASSES login with DEMO banner + `Exit demo` control that clears flag. Rationale: demo is a local preview utility; production `?demo=1` shows sample data clearly labeled — harmless, no real numbers leak (there are none without backend key... wait, demo shows FAKE numbers publicly if someone guesses ?demo=1. Hmm: acceptable — numbers are obviously fake samples, banner says so, no real data exists client-side. Keep, documented.)
- Reduced-motion + 390px checks via eval.
