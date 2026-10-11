/**
 * Homepage KPI + Road-to-1000 static sync (scripts/sync-home-kpis.mjs)
 *
 * The app.js road-1000 updater owns these numbers at runtime, but crawlers
 * and no-JS readers see the static HTML. This script rebuilds every numeric
 * fact on all 9 homepages from public/data/messi-data.json so the static
 * fallback can never freeze at an old total again (it sat at 930-era
 * 70-to-go / 93.0% / 805 club while data moved on).
 *
 * Style-preserving: thousands/decimal separators and Bengali digits are
 * detected from the existing text and reused, so localized prose is never
 * rewritten — only the numbers transplant. Idempotent: same JSON in gives
 * byte-identical HTML out. Ends with a drift guard scoped to #kpis and
 * #road-1000 (totals-only zones; older goal numbers never legitimately
 * appear there).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const BN = "০১২৩৪৫৬৭৮৯";
const bnDigits = (s) => String(s).replace(/[0-9]/g, (d) => BN[Number(d)]);
const NBSP = " ";
const NNBSP = " ";

/** Reformat newNum to look like oldStr (grouping + decimal seps + digit system). */
function reformatLike(oldStr, newNum, decimals = 0) {
  const useBn = /[০-৯]/.test(oldStr);
  const asc = useBn ? oldStr.replace(/[০-৯]/g, (d) => String(BN.indexOf(d))) : oldStr;
  const seps = asc.match(/[,.\s  ]/g) || [];
  let out;
  if (decimals > 0) {
    const rev = [...seps].reverse();
    const decSep = rev.find((c) => c === "," || c === ".") || ".";
    const grp = seps.find((c) => c !== decSep) || "";
    const parts = Number(newNum).toFixed(decimals).split(".");
    const ip = grp ? parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, grp) : parts[0];
    out = ip + decSep + parts[1];
  } else {
    const grp = seps[0] || "";
    const n = String(Math.round(newNum));
    out = grp ? n.replace(/\B(?=(\d{3})+(?!\d))/g, grp) : n;
  }
  return useBn ? bnDigits(out) : out;
}

/** Replace the first standalone 3-digit total (never inside 1.000-style groups). */
function swapFirstInt(str, val) {
  if (/[০-৯]/.test(str)) return String(str).replace(/(?<![\d০-৯,])[\u09e6-\u09ef]{3}(?![\d০-৯])/, bnDigits(val));
  return String(str).replace(/(?<![\d.,])\d{3}(?![\d])/, String(val));
}

export function syncHomeKpis() {
  const messi = JSON.parse(fs.readFileSync(path.join(root, "public", "data", "messi-data.json"), "utf8"));
  const T = messi.totals || {};
  const goals = T.combined?.goals ?? 932;
  const apps = T.combined?.appearances ?? 1178;
  const club = T.club?.goals ?? 806;
  const arg = T.country?.goals ?? 126;
  const assists = T.assists?.official ?? 407;
  const ga = goals + assists;
  const toGo = Math.max(0, 1000 - goals);
  const pct = ((goals / 1000) * 100).toFixed(1);
  const pace = apps ? goals / apps : 0.79;
  const gaRate = apps ? ga / apps : 1.14;
  const fy = new Date().getFullYear();
  const estEnd = fy + Math.max(1, Math.ceil(toGo / (pace * 50)));
  const estStr = `${estEnd - 1}/${estEnd}`;
  const trophies = (messi.trophies || []).filter((t) => t.team !== "Individual").reduce((n, t) => n + ((t.years || []).length), 0);
  let miami = 102;
  try {
    const lg = JSON.parse(fs.readFileSync(path.join(root, "public", "data", "latest-goal.json"), "utf8"));
    if (lg.totals?.miamiGoals) miami = lg.totals.miamiGoals;
  } catch {}
  // value-anchored transplant for prose facts (magnitudes that can ONLY mean
  // one thing on homepages; trophies-adjacent 46 handled explicitly elsewhere
  // to avoid the "46 assists" collision)
  const BN_D = "০১২৩৪৫৬৭৮৯";
  const toLatin = (tok) => tok.replace(/[০-৯]/g, (d) => String(BN_D.indexOf(d))).replace(/[,\.\s  ]/g, "");
  const transplantNums = (txt) => {
    const map = [[[goals - 2, goals - 1, goals], goals], [[apps - 1, apps], apps], [[club - 2, club - 1, club], club], [[arg - 1, arg], arg], [[miami - 2, miami - 1, miami], miami]];
    return txt.replace(/[\d০-৯]{1,3}(?:[,\.\s  ][\d০-৯]{3})+|[\d০-৯]+/g, (tok, off, full) => {
      const before = full[off - 1] || "";
      const after = full[off + tok.length] || "";
      if (/[\d.,]/.test(before) || /[\d\w]/.test(after)) return tok;
      if (/[০-৯]/.test(tok) && /[0-9]/.test(tok)) return tok;
      const key = Number(toLatin(tok));
      if (!Number.isFinite(key)) return tok;
      for (const [olds, nv] of map) {
        if (olds.includes(key)) {
          const rendered = reformatLike(tok, nv);
          return rendered;
        }
      }
      return tok;
    });
  };

  const files = ["index.html", "es/index.html", "pt/index.html", "fr/index.html", "ar/index.html", "bn/index.html", "hi/index.html", "ro/index.html", "uz/index.html"];
  let n = 0;

  for (const rel of files) {
    const file = path.join(root, rel);
    if (!fs.existsSync(file)) continue;
    let html = fs.readFileSync(file, "utf8");

    // ---- Road to 1,000 widget (present on root + es/pt/fr/ar) ----
    if (html.includes("road-1000-card")) {
      html = html.replace(/(<section class="road-1000-card"[\s\S]*?<\/section>)/, (section) => {
        let s = section;
        const want = [goals, toGo, club, arg];
        let i = 0;
        s = s.replace(/(<span class="r1000-num">)[^<]*(<\/span>)/g, (w, a, b) => (i < want.length ? `${a}${want[i++] ?? ""}${b}` : w));
        s = s.replace(/(<span class="r1000-percent">)[^<]*(<\/span>)/i, `$1${pct}%$2`);
        s = s.replace(/(<div class="road-1000-fill" style="width: )[^;]+(;")/i, `$1${pct}%$2`);
        s = s.replace(/(<div class="road-1000-pin" style="left: )[^;]+(;)"/i, `$1${pct}%$2"`);
        s = s.replace(/(<div class="road-1000-track"[^>]*aria-valuenow=")[^"]*(")/i, `$1${goals}$2`);
        s = s.replace(/(<div class="road-1000-track"[^>]*aria-label=")([^"]*)(")/i, (w, a, label, c) => `${a}${swapFirstInt(label, goals)}${c}`);
        s = s.replace(/(<div class="road-1000-pin"[^>]*title=")([^"]*)(")/i, (w, a, ti, c) => `${a}${swapFirstInt(ti, goals)}${c}`);
        s = s.replace(/(<span class="pin-label">)([^<]*)(<\/span>)/i, (w, a, label, c) => `${a}${swapFirstInt(label, goals)}${c}`);
        s = s.replace(/(<span class="r1000-pace">[\s\S]*?<\/span>)/i, (paceSpan) => {
          let p = paceSpan;
          p = p.replace(/(<b>)(\d{4}\/\d{4})(<\/b>)/, `$1${estStr}$3`);
          p = p.replace(/(<b>)([^<]*\d+[.,]\d+[^<]*)(<\/b>)/g, (w, a, txt, c) => {
            const mm = txt.match(/\d+([.,])\d+/);
            if (!mm) return w;
            let v = pace.toFixed(2).replace(".", mm[1]);
            if (/[০-৯]/.test(txt)) v = bnDigits(v);
            return a + txt.replace(/\d+([.,])\d+/, v) + c;
          });
          return p;
        });
        return s;
      });
    }

    // ---- KPI cards: root 6 nums, locales 4 nums, es none static ----
    if (html.includes('id="kpis"')) {
      html = html.replace(/(<section[^>]*id="kpis"[^>]*>[\s\S]*?<\/section>)/i, (section) => {
        let s = section;
        const nums = [...s.matchAll(/(<span class="kpi-num">)([^<]*)(<\/span>)/g)];
        if (nums.length === 6) {
          const vals = [String(goals), `${assists}*`, reformatLike(nums[2][2], ga), reformatLike(nums[3][2], apps), reformatLike(nums[4][2], trophies), nums[5][2]];
          let i = 0;
          s = s.replace(/(<span class="kpi-num">)([^<]*)(<\/span>)/g, (w, a, _o, c) => (i < vals.length ? `${a}${vals[i++] ?? ""}${c}` : w));
        } else if (nums.length === 4) {
          const vals = [reformatLike(nums[0][2], goals), reformatLike(nums[1][2], apps), reformatLike(nums[2][2], trophies), nums[3][2]];
          let i = 0;
          s = s.replace(/(<span class="kpi-num">)([^<]*)(<\/span>)/g, (w, a, _o, c) => (i < vals.length ? `${a}${vals[i++] ?? ""}${c}` : w));
        }
        // subs: only spans carrying digits; record prose untouched
        s = s.replace(/(<span class="kpi-sub">)([^<]*)(<\/span>)/g, (w, a, txt, c) => {
          if (!/[\d০-৯]/.test(txt)) return w;
          let out = txt;
          if (/G\+A/.test(txt)) {
            out = txt.replace(/[\d০-৯]+([.,][\d০-৯]+)?/, (m) => reformatLike(m, gaRate, 2));
          } else if (/\d+[.,]\d+/.test(txt)) {
            out = txt.replace(/[\d০-৯]+([.,][\d০-৯]+)?/, (m) => reformatLike(m, pace, 2));
          } else {
            // club · country split ("806 Club · 126 Argentina" in every
            // locale's words): transplant both, preserving digit systems
            const ints = [...txt.matchAll(/[\d০-৯]+/g)].map((m) => m[0]);
            if (ints.length >= 2) {
              out = txt.replace(ints[0], /[০-৯]/.test(ints[0]) ? bnDigits(club) : String(club));
              out = out.replace(ints[1], /[০-৯]/.test(ints[1]) ? bnDigits(arg) : String(arg));
            }
          }
          return a + out + c;
        });
        return s;
      });
    }

    // ---- Facts pass: prose totals/splits (bio JSON-LD, lede, pills,
    // footer links, chips, FAQ answers). Value-anchored: only magnitudes
    // that unambiguously mean one fact. Trophies-46 handled explicitly
    // (never blanket: "46 assists" collision); WC splits untouched here.
    {
      const TROPHY_WORDS = /troph|t[ií]tul|titre|لقب|بطولة|ট্রফি|शिरोपा|ट्रॉफी|खिताब|trofe|sovrin|palmar|record.*cup|cups/i;
      const ASSIST_WORDS = /assist|asist|передача/i;
      const transplantPlus = (txt, allowTrophies, trophies) => {
        let out = transplantNums(txt);
        if (allowTrophies) {
          out = out.replace(/(?<![\d০-৯,])(46|৪৬)(?![\d০-৯])/g, (tok) => (/[০-৯]/.test(tok) ? bnDigits(trophies) : String(trophies)));
        }
        return out;
      };
      const trophyOk = (txt) => TROPHY_WORDS.test(txt) && !ASSIST_WORDS.test(txt);
      html = html.replace(/("description": ")((?:[^"\\]|\\.)*)(")/gi, (w, a, desc, c) => a + transplantPlus(desc, trophyOk(desc), trophies) + c);
      html = html.replace(/("text": ")((?:[^"\\]|\\.)*)(")/gi, (w, a, txt, c) => a + transplantPlus(txt, trophyOk(txt), trophies) + c);
      const block = (re, trophyScope) => {
        html = html.replace(re, (w, a, inner, c) => a + transplantPlus(inner, trophyScope ? trophyOk(inner) : false, trophies) + c);
      };
      block(/(<h1[^>]*>)([\s\S]*?)(<\/h1>)/gi, true);
      block(/(<p class="lede"[^>]*>)([\s\S]*?)(<\/p>)/gi, true);
      block(/(<div class="gt-stat-pill">[\s\S]*?)(<\/div>)/gi, true);
      html = html.replace(/(<a href="[^"]*achievements"[^>]*>)([^<]*)(<\/a>)/gi, (w, a, txt, c) => a + transplantPlus(txt, trophyOk(txt), trophies) + c);
      block(/(<span class="id-chip[^"]*">)([^<]*)(<\/span>)/gi, true);
      block(/(<p class="section-sub">)([\s\S]*?)(<\/p>)/gi, true);
      block(/(<div class="faq-answer"><p>)([\s\S]*?)(<\/p><\/div>)/gi, false);
      // table cells (club/trophy tables; years/scores/assists magnitudes unmapped)
      html = html.replace(/(<(?:td|th)[^>]*>)([\s\S]*?)(<\/(?:td|th)>)/gi, (w, a, inner, c) => {
        if (/<(?:td|th)[^>]*>/.test(inner)) return w; // nested: leave
        return a + transplantNums(inner) + c;
      });
    }

    fs.writeFileSync(file, html, "utf8");

    // ---- drift guard: totals-only zones must not hold older totals ----
    const fresh = fs.readFileSync(file, "utf8");
    const zones = [
      ...(fresh.match(/<section[^>]*id="kpis"[^>]*>[\s\S]*?<\/section>/gi) || []),
      ...(fresh.match(/<section class="road-1000-card"[\s\S]*?<\/section>/gi) || []),
    ].join("\n");
    if (!zones) { n++; continue; }
    const stale = [];
    for (const prev of [goals - 1, goals - 2, trophies - 1]) {
      if (prev <= 0) continue;
      for (const tok of [String(prev), bnDigits(prev)]) {
        const esc = tok.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const re = new RegExp(`(?<![\\d.,])${esc}(?![\\d])`, "g");
        const hits = (zones.match(re) || []).length;
        if (hits > 0) stale.push(`${tok} x${hits}`);
      }
    }
    if (stale.length) throw new Error(`DRIFT in ${rel}: stale totals ${stale.join(", ")} inside #kpis/#road-1000`);
    n++;
  }
  console.log(`[sync-home-kpis] synchronized ${n} homepages to ${goals} goals (${toGo} to go, ${pct}%).`);
}

if (process.argv[1] && process.argv[1].endsWith("sync-home-kpis.mjs")) {
  syncHomeKpis();
}
