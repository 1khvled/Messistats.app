# Charts Come Alive — Design (2026-09-11)

Goal: bars grow, donuts sweep, KPIs tick on visibility, peak bar pulses. Direction A: CSS entrance + existing IntersectionObserver `.tl-reveal`-style pattern. No new deps, no rAF loops, no SMIL.

## Bars grow (`sparkSVG()` output + `src/styles.css`)
- Bars start `transform: scaleY(0)` (`transform-box: fill-box; transform-origin: bottom`), transition to `scaleY(1)` when an `.in` class lands on the svg root via the existing IO helper pattern (same as timeline `.tl-reveal.in`).
- Stagger: per-bar `transition-delay` from index (`--i` custom property set inline, `delay: min(var(--i) * 24ms, 480ms)` cap so 25-bar charts stay snappy).
- Anchor-wrapped bars (Task int-1) keep working — transform applies to rect, link intact.

## Donut sweep (`donutSVG()` output + CSS)
- Slice circles transition `stroke-dashoffset` from full circumference (empty ring) to target offset when `.in` lands. Same IO trigger as bars.
- Center numbers + legend static during sweep (no count-sync — out of scope).

## KPI tick on visibility + peak pulse
- Existing count-up helper: fire on IO visibility instead of page load (home KPIs, dashboard, admin). Numbers already final in markup for no-JS (progressive enhancement kept).
- `.ybar.peak`: one subtle `pulse` keyframe (opacity/scale 1→1.06→1, 1.6s, 2 iterations max — never infinite).

## Motion safety + invariants
- `prefers-reduced-motion: reduce` → all of the above render final state instantly (extend the two existing reduced-motion blocks; same house pattern).
- `messi-data.json` untouched; 927×3 via verify; zero third-party; light theme; no layout shift (transform-only, no size changes).
- Change surface: CSS append + few lines in `sparkSVG()`/`donutSVG()` + IO wiring reuse.

## Verification (throwaway)
- Build clean, verify exit 0, localhost:bars have `.in` after scroll, computed `transform: none` at rest, `prefers-reduced-motion` emulation shows final state.

## Non-goals
- No rAF scrub (B), no SMIL (C), no count-sync on donut centers, no page transitions.
