/**
 * Template-driven narrative copy for latest-goal.html (all 9 languages).
 *
 * Why this exists: the previous syncer only did one-hop literal string swaps
 * ("against San Diego FC" -> new opponent). Once a page mentioned a newer
 * opponent, every regex stopped matching and the page silently froze at an
 * old goal number. These templates are rebuilt from latest-goal.json on every
 * run instead, so the copy can never drift.
 *
 * Every string is filled from JSON facts only - never hardcode a number here.
 */

const EN_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function ordinal(n, lang = "en") {
  if (lang === "bn") return `${bnDigits(n)}তম`;
  const v = Number(n);
  const rem100 = v % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${v}th`;
  switch (v % 10) {
    case 1: return `${v}st`;
    case 2: return `${v}nd`;
    case 3: return `${v}rd`;
    default: return `${v}th`;
  }
}

/** Latin digits -> Bengali digits (bn pages render numerals in Bengali). */
export function bnDigits(s) {
  return String(s).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);
}

/** "3-0" -> { a:3, b:0, word:"win"|"draw"|"loss", dash:"3–0" } */
export function scoreResult(score) {
  const m = String(score || "").match(/(\d+)\s*[-–:]\s*(\d+)/);
  if (!m) return { a: null, b: null, word: "match", dash: String(score || "") };
  const a = Number(m[1]);
  const b = Number(m[2]);
  const word = a > b ? "win" : a < b ? "loss" : "draw";
  return { a, b, word, dash: `${a}–${b}` };
}

/** Minute "71'" -> 71 */
export function minuteNum(minute) {
  const m = String(minute || "").match(/(\d+)/);
  return m ? Number(m[1]) : null;
}

function lowerFirst(s) {
  const str = String(s || "");
  return str ? str.charAt(0).toLowerCase() + str.slice(1) : str;
}

function fill(tpl, map) {
  return String(tpl).replace(/\{(\w+)\}/g, (whole, key) => (key in map && map[key] !== undefined && map[key] !== null ? String(map[key]) : whole));
}

/**
 * @returns per-language block strings, all derived from `g` + totals.
 */
export function buildNarrative({ g, seniorGoals, apps, miamiGoals, intlGoals, goalsNeeded, lang, compLoc, techLowerLoc, bdayLabel }) {
  const R = scoreResult(g.score);
  const minN = minuteNum(g.minute);
  const minOrd = minN ? ordinal(minN) : g.minute;
  const teamIsMiami = /Inter Miami/i.test(g.team || "");
  const opp = g.opponent;
  const dateEn = g.formattedDate;
  const venue = g.venue;
  const title = g.title;

  // Localized strings handed in by the syncer (it already owns TECH_WORDS etc.)
  const comp = compLoc || g.competition;
  const techLower = techLowerLoc || lowerFirst(g.finish || "");

  // "his 102nd goal for Inter Miami" / "his 126th goal for Argentina"
  const clubName = teamIsMiami ? "Inter Miami" : "Argentina";
  const clubGoalsN = teamIsMiami ? miamiGoals : intlGoals;

  const MONTHS = MONTH[lang] || EN_MONTHS;
  const dateLoc = lang === "en" ? dateEn : String(dateEn).replace(/([A-Za-zÀ-ÿ\u0600-\u06FF\u0980-\u09FF\u0900-\u097F]+)/g, (w) => {
    const i = EN_MONTHS.indexOf(w);
    return i >= 0 ? MONTHS[i] : w;
  });

  const RW = {
    win: { en: "win", es: "victoria", pt: "vitória", fr: "victoire", ar: "فوز", bn: "জয়", hi: "जीत", ro: "victorie", uz: "g'alaba" },
    draw: { en: "draw", es: "empate", pt: "empate", fr: "match nul", ar: "تعادل", bn: "ড্র", hi: "ड्रॉ", ro: "egal", uz: "durang" },
    loss: { en: "defeat", es: "derrota", pt: "derrota", fr: "défaite", ar: "خسارة", bn: "হার", hi: "हार", ro: "înfrângere", uz: "mag'lubiyat" },
  };
  const rw = (RW[R.word] && RW[R.word][lang]) || RW[R.word].en;

  const teamClauseFn = teamClause[lang] || teamClause.en;
  // Only English takes a Latin ordinal suffix; bn has its own, everything
  // else uses the bare number (es/pt/fr/hi/ar/ro/uz supply their own suffix).
  const ordN = (n) => (lang === "en" || lang === "bn" ? ordinal(n, lang) : String(n));
  const res = {
    N: seniorGoals,
    apps: apps.toLocaleString("en-US"),
    appsLoc: fmtApps(apps, lang),
    date: dateLoc,
    dateEn,
    opp,
    comp,
    min: g.minute,
    minOrd: minN ? ordinal(minN, lang) : g.minute,
    tech: g.finish || "",
    techLower,
    score: R.dash,
    venue,
    team: g.team,
    rw,
    needed: goalsNeeded,
    club: clubLoc(lang, clubName),
    matchTitle: String(title).replace(/-/g, "\u2013"),
    clubN: clubGoalsN,
    bdayLabel,
    teamClause: teamClauseFn({ n: clubGoalsN, ord: ordN(clubGoalsN), club: clubLoc(lang, clubName) }),
  };

  const T = COPY[lang] || COPY.en;
  // Latin ordinal suffixes (71st) only read correctly in English; every other
  // language takes the bare number. bn renders its own ordinal (৭১তম).
  const minOrdOut = lang === "en" ? ordinal(minN, lang) : lang === "bn" ? bnDigits(`${minN}তম`) : String(minN);
  // bn pages render numerals in Bengali; convert only the filled prose,
  // never the localized month names (they are already Bengali text).
  const localizeNum = (s) => (lang === "bn" ? bnDigits(s) : s);
  const pick = (k) => localizeNum(fill(T[k], { ...res, minOrd: minOrdOut }));
  return {
    desc: pick("desc"),
    videoName: pick("videoName"),
    videoDesc: pick("videoDesc"),
    todayDesc: pick("todayDesc"),
    faqScoredToday: pick("faqScoredToday"),
    faqWhenScored: pick("faqWhenScored"),
    faqGoalNumber: pick("faqGoalNumber"),
    faq1000: pick("faq1000"),
    analysis: pick("analysis"),
    recentLine: pick("recentLine"),
    bdayLink: pick("bdayLink"),
    milestoneH2: pick("milestoneH2"),
    seasonBadge: comp,
  };
}

function locLangKey(lang) { return lang; }

function fmtApps(apps, lang) {
  const s = String(apps);
  if (lang === "fr") return s.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function clubLoc(lang, club) {
  const map = {
    en: { "Inter Miami": "Inter Miami", Argentina: "Argentina" },
    es: { "Inter Miami": "el Inter Miami", Argentina: "Argentina" },
    pt: { "Inter Miami": "o Inter Miami", Argentina: "a Argentina" },
    fr: { "Inter Miami": "l'Inter Miami", Argentina: "l'Argentine" },
    ar: { "Inter Miami": "إنتر ميامي", Argentina: "الأرجنتين" },
    bn: { "Inter Miami": "ইন্টার মায়ামি", Argentina: "আর্জেন্টিনা" },
    hi: { "Inter Miami": "इंटर मियामी", Argentina: "अर्जेंटीना" },
    ro: { "Inter Miami": "Inter Miami", Argentina: "Argentina" },
    uz: { "Inter Miami": "Inter Mayami", Argentina: "Argentina" },
  };
  return (map[lang] && map[lang][club]) || club;
}

const teamClause = {
  en: ({ n, club }) => `his ${ordinal(n)} goal for ${club}`,
  es: ({ n, ord, club }) => `su gol número ${ord} con ${club}`,
  pt: ({ n, ord, club }) => `seu gol número ${ord} com ${club}`,
  fr: ({ n, ord, club }) => `son but n°${ord} avec ${club}`,
  ar: ({ n, club }) => `هدفه رقم ${n} مع ${club}`,
  bn: ({ n, ord, club }) => `${club}-এর হয়ে তার ${ord} গোল`,
  hi: ({ n, club }) => `${club} के लिए उनका ${n}वाँ गोल`,
  ro: ({ n, club }) => `al ${n}-lea său gol pentru ${club}`,
  uz: ({ n, club }) => `${club} uchun ${n}-goli`,
};

const MONTH = {
  en: EN_MONTHS,
  es: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
  pt: ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"],
  fr: ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
  ar: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"],
  bn: ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"],
  hi: ["जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"],
  ro: ["ianuarie", "februarie", "martie", "aprilie", "mai", "iunie", "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie"],
  uz: ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"],
};

const COPY = {
  en: {
    desc: "Did Messi score today? Check Lionel Messi's goal today status, match result, and HD video replay of Goal #{N} vs {opp}. Live 2026 match tracker & recent goal stats.",
    videoName: "Lionel Messi Last Goal: Goal #{N} vs {opp} ({date})",
    videoDesc: "Watch Lionel Messi score Goal #{N} of his career ({teamClause}) against {opp} in {comp} on {date}.",
    todayDesc: "Did Lionel Messi score a goal today? Messi's most recent official fixture took place on <b>{date}</b> in {comp}, where he scored <b>Goal #{N}</b> of his career ({teamClause}) in the {minOrd} minute with a {techLower} in a {score} {rw} vs {opp}. Stream the official goal video directly below or follow live updates whenever Inter Miami or Argentina kicks off.",
    faqScoredToday: "Lionel Messi's most recent official match was on {date} in {comp}, where he scored Goal #{N} ({teamClause}) with a {minOrd}-minute {techLower} in a {score} {rw} vs {opp}. If Inter Miami or Argentina plays today, our live tracker updates in real time.",
    faqWhenScored: "Lionel Messi scored his last goal on {date} at {venue} against {opp} ({score}) in {comp}.",
    faqGoalNumber: "Messi's last official goal was Goal #{N} of his senior career ({teamClause}), bringing his verified all-time tally to {N} senior goals in {apps} appearances.",
    faq1000: "Lionel Messi currently has {N} official senior career goals, meaning he needs exactly {needed} more goals to reach the historic 1,000-goal milestone.",
    analysis: "Lionel Messi continues to set world football benchmarks in 2026. His latest strike against {opp} in {comp} at {venue} brought his career tally to an astonishing <b>{N} senior goals</b> ({teamClause}) across {apps} appearances for Barcelona, PSG, Inter Miami and Argentina.",
    recentLine: "<b>#{N}:</b> {date} — {matchTitle} ({min}, {techLower})",
    milestoneH2: "Milestones Unlocked by Goal #{N}",
    bdayLink: "View {bdayLabel} Goals &rarr;",
  },
  es: {
    desc: "¿Messi marcó hoy? Consulta el último gol de Lionel Messi, el resultado del partido y el vídeo en HD del Gol #{N} vs {opp}.",
    videoName: "Último gol de Lionel Messi: Gol #{N} vs {opp} ({date})",
    videoDesc: "Mira a Lionel Messi marcar el Gol #{N} de su carrera ({teamClause}) ante {opp} en {comp} el {date}.",
    todayDesc: "<b>¿Ha marcado Lionel Messi hoy?</b> El último partido oficial de Lionel Messi se jugó el <b>{date}</b> en {comp}, donde marcó el <b>Gol #{N}</b> de su carrera ({teamClause}) en el minuto {minOrd} con un/a {techLower} en una {rw} {score} vs {opp}.",
    faqScoredToday: "El último partido oficial de Lionel Messi fue el {date} en {comp}, donde marcó el Gol #{N} ({teamClause}) con un/a {techLower} en el minuto {minOrd} en una {rw} {score} vs {opp}.",
    faqWhenScored: "Lionel Messi marcó su último gol el {date} en {venue} contra {opp} ({score}) en {comp}.",
    faqGoalNumber: "El último gol oficial de Messi fue el Gol #{N} de su carrera profesional ({teamClause}), elevando su total verificado a {N} goles en {apps} partidos.",
    faq1000: "Lionel Messi tiene actualmente {N} goles oficiales en su carrera, por lo que necesita exactamente {needed} goles más para alcanzar la histórica cifra de 1.000.",
    analysis: "Lionel Messi sigue marcando hitos del fútbol mundial en 2026. Su último tanto ante {opp} en {comp}, en {venue}, elevó su cuenta a unos asombrosos <b>{N} goles</b> ({teamClause}) en {apps} partidos con Barcelona, PSG, Inter Miami y Argentina.",
    recentLine: "<b>#{N}:</b> {date} — {matchTitle} ({min}, {techLower})",
    milestoneH2: "Hitos desbloqueados con el Gol #{N}",
    bdayLink: "Ver goles del {bdayLabel} &rarr;",
  },
  pt: {
    desc: "O Messi marcou hoje? Confira o último gol do Lionel Messi, o resultado e o vídeo em HD do Gol #{N} vs {opp}.",
    videoName: "Último gol do Lionel Messi: Gol #{N} vs {opp} ({date})",
    videoDesc: "Veja o Lionel Messi marcar o Gol #{N} da carreira ({teamClause}) contra o {opp} em {comp} no dia {date}.",
    todayDesc: "<b>O Lionel Messi marcou hoje?</b> O último jogo oficial do Lionel Messi foi em <b>{date}</b>, em {comp}, quando marcou o <b>Gol #{N}</b> da carreira ({teamClause}) no minuto {minOrd}, de {techLower}, em uma {rw} de {score} contra o {opp}.",
    faqScoredToday: "O último jogo oficial do Lionel Messi foi em {date}, em {comp}, onde marcou o Gol #{N} ({teamClause}) de {techLower} no minuto {minOrd}, em uma {rw} de {score} contra o {opp}.",
    faqWhenScored: "O Lionel Messi marcou seu último gol em {date}, no {venue}, contra o {opp} ({score}), em {comp}.",
    faqGoalNumber: "O último gol oficial do Messi foi o Gol #{N} de sua carreira ({teamClause}), levando seu total verificado a {N} gols em {apps} jogos.",
    faq1000: "O Lionel Messi tem atualmente {N} gols oficiais na carreira, ou seja, precisa exatamente de mais {needed} gols para alcançar a histórica marca de 1.000.",
    analysis: "O Lionel Messi continua marcando marcos do futebol mundial em 2026. Sua última golada contra o {opp} em {comp}, no {venue}, levou sua conta a um surpreendente <b>{N} gols</b> ({teamClause}) em {apps} jogos por Barcelona, PSG, Inter Miami e Argentina.",
    recentLine: "<b>#{N}:</b> {date} — {matchTitle} ({min}, {techLower})",
    milestoneH2: "Marcos históricos do Gol #{N}",
    bdayLink: "Ver gols de {bdayLabel} &rarr;",
  },
  fr: {
    desc: "Regardez la vidéo du dernier but de Lionel Messi et vérifiez s'il a marqué aujourd'hui. Résumé du match, statistiques et vidéo du But n°{N} face à {opp}.",
    videoName: "Dernier but de Lionel Messi : But n°{N} face à {opp} ({date})",
    videoDesc: "Regardez Lionel Messi marquer le But n°{N} de sa carrière ({teamClause}) face à {opp} en {comp} le {date}.",
    todayDesc: "<b>Messi a-t-il marqué aujourd'hui ?</b> Le match officiel le plus récent de Lionel Messi s'est déroulé le <b>{date}</b> en {comp}, où il a inscrit le <b>But n°{N}</b> de sa carrière ({teamClause}) à la {minOrd} minute, d'un {techLower}, dans une {rw} {score} contre {opp}.",
    faqScoredToday: "Le match officiel le plus récent de Lionel Messi a eu lieu le {date} en {comp}, où il a inscrit le But n°{N} ({teamClause}) d'un {techLower} à la {minOrd} minute, dans une {rw} {score} contre {opp}.",
    faqWhenScored: "Lionel Messi a marqué son dernier but le {date} au {venue} contre {opp} ({score}) en {comp}.",
    faqGoalNumber: "Le dernier but officiel de Messi était le But n°{N} de sa carrière chez les professionnels ({teamClause}), portant son total à {N} buts en {appsLoc} matchs.",
    faq1000: "Lionel Messi compte actuellement {N} buts officiels chez les seniors, il ne lui manque donc que {needed} buts pour franchir la barre mythique des 1 000 buts.",
    analysis: "Lionel Messi continue de fixer les standards du football mondial en 2026. Son dernier but contre {opp} en {comp}, au {venue}, porte son total à un bluffant <b>{N} buts</b> ({teamClause}) en {appsLoc} matchs avec Barcelone, le PSG, Miami et l'Argentine.",
    recentLine: "<b>#{N}:</b> {date} — {matchTitle} ({min}, {techLower})",
    milestoneH2: "Records débloqués par le But #{N}",
    bdayLink: "Voir les buts du {bdayLabel} &rarr;",
  },
  ar: {
    desc: "شاهد فيديو آخر هدف سجّله ليونيل ميسي وتحقق مما إذا كان قد سجّل اليوم. ملخص المباراة والإحصائيات وفيديو الهدف رقم {N} ضد {opp}.",
    videoName: "آخر هدف لليونيل ميسي: الهدف رقم {N} ضد {opp} ({date})",
    videoDesc: "شاهد ليونيل ميسي يسجّل هدفه رقم {N} في مسيرته ({teamClause}) ضد {opp} في {comp} يوم {date}.",
    todayDesc: "<b>هل سجّل ميسي اليوم؟</b> آخر مباراة رسمية لليونيل ميسي أُقيمت يوم <b>{date}</b> في {comp}، حيث سجّل <b>الهدف رقم {N}</b> من مسيرته ({teamClause}) في الدقيقة {minOrd} من {techLower} خلال {rw} بنتيجة {score} ضد {opp}.",
    faqScoredToday: "آخر مباراة رسمية لليونيل ميسي كانت يوم {date} في {comp}، حيث سجّل الهدف رقم {N} ({teamClause}) من {techLower} في الدقيقة {minOrd} خلال {rw} بنتيجة {score} ضد {opp}.",
    faqWhenScored: "سجّل ليونيل ميسي آخر هدف له يوم {date} في {venue} ضد {opp} ({score}) في {comp}.",
    faqGoalNumber: "كان آخر هدف رسمي لميسي هو الهدف رقم {N} في مسيرته الاحترافية ({teamClause})، ليرفع رصيده إلى {N} هدفاً في {apps} مباراة.",
    faq1000: "يملك ليونيل ميسي حالياً {N} هدفاً رسمياً في مسيرته، أي أنه يحتاج بالضبط إلى {needed} هدفاً إضافياً للوصول إلى رقم الألف التاريخي.",
    analysis: "يواصل ليونيل ميسي صناعة إنجازات كرة القدم العالمية في 2026. هدفه الأخير ضد {opp} في {comp} بملعب {venue} رفع رصيده إلى <b>{N} هدفاً</b> ({teamClause}) في {apps} مباراة مع برشلونة وباريس سان جيرمان وإنتر ميامي والأرجنتين.",
    recentLine: "<b>#{N}:</b> {date} — {matchTitle} ({min}, {techLower})",
    milestoneH2: "معالم جديدة حققها الهدف رقم {N}",
    bdayLink: "أهداف يوم {bdayLabel} &rarr;",
  },
  bn: {
    desc: "মেসি আজ গোল করেছেন কি না দেখুন। লিওনেল মেসির সর্বশেষ গোলের ভিডিও, ফলাফল ও পরিসংখ্যান — গোল নং {N} বনাম {opp}।",
    videoName: "লিওনেল মেসির সর্বশেষ গোল: গোল নং {N} বনাম {opp} ({date})",
    videoDesc: "{date} তারিখে {comp}-এ লিওনেল মেসির ক্যারিয়ারের {N} নম্বর গোলটি ({teamClause}) দেখুন, প্রতিপক্ষ {opp}।",
    todayDesc: "<b>মেসি আজ কি গোল করেছেন?</b> লিওনেল মেসির সর্বশেষ অফিসিয়াল ম্যাচটি অনুষ্ঠিত হয়েছিল <b>{date}</b> তারিখে {comp}-এ, যেখানে তিনি {score} ব্যবধানে {rw}-এ {opp}-এর বিপক্ষে {techLower} মারে ম্যাচের {minOrd} মিনিটে ক্যারিয়ারের <b>{N} নম্বর গোলটি</b> ({teamClause}) করেন।",
    faqScoredToday: "লিওনেল মেসির সর্বশেষ অফিসিয়াল ম্যাচ ছিল {date} তারিখে {comp}-এ, যেখানে তিনি {opp}-এর বিপক্ষে {score} ব্যবধানে {rw}-এ {minOrd} মিনিটে {techLower} মারে {N} নম্বর গোলটি ({teamClause}) করেন।",
    faqWhenScored: "লিওনেল মেসি {date} তারিখে {venue}-এ {comp}-এ {opp}-এর বিপক্ষে ({score}) তার সর্বশেষ গোলটি করেন।",
    faqGoalNumber: "মেসির সর্বশেষ অফিসিয়াল গোলটি ছিল তার সিনিয়র ক্যারিয়ারের {N} নম্বর গোল ({teamClause}), যা তাকে {apps} ম্যাচে {N} গোলে পৌঁছে দেয়।",
    faq1000: "লিওনেল মেসির বর্তমানে ক্যারিয়ারে {N} অফিসিয়াল গোল আছে, অর্থাৎ ঐতিহাসিক ১০০০ গোলে পৌঁছাতে তার ঠিক {needed}টি গোল দরকার।",
    analysis: "২০২৬ সালেও লিওনেল মেসি বিশ্ব ফুটবলের মানদণ্ড তৈরি করছেন। {comp}-এ {venue}-এ {opp}-এর বিপক্ষে তার সর্বশেষ গোলটি তার ক্যারিয়ারকে দাঁড় করিয়েছে <b>{N} গোলে</b> ({teamClause}) — বার্সেলোনা, পিএসজি, ইন্টার মায়ামি ও আর্জেন্টিনার হয়ে {apps} ম্যাচে।",
    recentLine: "<b>#{N}:</b> {date} — {matchTitle} ({min}, {techLower})",
    milestoneH2: "{N}তম গোলের মাধ্যমে অর্জিত নতুন মাইলফলক",
    bdayLink: "{bdayLabel} তারিখের গোল দেখুন &rarr;",
  },
  hi: {
    desc: "क्या मेसी आज गोल किया? लियोनेल मेसी के आज के गोल की स्थिति, मैच नतीजा और HD वीडियो देखें — गोल नंबर {N} बनाम {opp}।",
    videoName: "लियोनेल मेसी का आख़िरी गोल: गोल नंबर {N} बनाम {opp} ({date})",
    videoDesc: "{date} को {comp} में लियोनेल मेसी के करियर के {N}वें गोल ({teamClause}) को {opp} के ख़िलाफ़ देखें।",
    todayDesc: "<b>क्या लियोनेल मेसी ने आज गोल किया?</b> लियोनेल मेसी का आख़िरी आधिकारिक मुक़ाबला <b>{date}</b> को {comp} में हुआ, जहाँ उन्होंने {opp} के ख़िलाफ़ {score} {rw} में {minOrd}वें मिनट पर {techLower} से करियर का <b>{N}वाँ गोल</b> ({teamClause}) किया।",
    faqScoredToday: "लियोनेल मेसी का आख़िरी आधिकारिक मैच {date} को {comp} में था, जहाँ उन्होंने {opp} के ख़िलाफ़ {score} {rw} में {minOrd}वें मिनट पर {techLower} से {N}वाँ गोल ({teamClause}) किया।",
    faqWhenScored: "लियोनेल मेसी ने {date} को {venue} में {comp} में {opp} के ख़िलाफ़ ({score}) अपना आख़िरी गोल किया।",
    faqGoalNumber: "मेसी का आख़िरी आधिकारिक गोल उनके सीनियर करियर का {N}वाँ गोल ({teamClause}) था, जिससे उनका कुल {N} गोल हो गया — {apps} मैचों में।",
    faq1000: "लियोनेल मेसी के करियर में अभी {N} आधिकारिक गोल हैं, यानी ऐतिहासिक 1,000 गोल तक पहुँचने के लिए उन्हें ठीक {needed} गोल और चाहिए।",
    analysis: "2026 में लियोनेल मेसी विश्व फ़ुटबॉल के मानक बनाते जा रहे हैं। {comp} में {venue} पर {opp} के ख़िलाफ़ उनके आख़िरी गोल ने उनके करियर को <b>{N} गोल</b> ({teamClause}) तक पहुँचा दिया — बार्सिलोना, पीएसजी, इंटर मियामी और अर्जेंटीना के लिए {apps} मैचों में।",
    recentLine: "<b>#{N}:</b> {date} — {matchTitle} ({min}, {techLower})",
    milestoneH2: "{N}वें गोल के साथ हासिल की गई नई उपलब्धियाँ",
    bdayLink: "{bdayLabel} के गोल देखें &rarr;",
  },
  ro: {
    desc: "A marcat Messi azi? Vezi ultimul gol al lui Lionel Messi, rezultatul meciului și video HD cu Golul #{N} contra {opp}.",
    videoName: "Ultimul gol al lui Lionel Messi: Golul #{N} contra {opp} ({date})",
    videoDesc: "Vezi pe Lionel Messi marcând Golul #{N} din cariera sa ({teamClause}) contra {opp} în {comp}, pe {date}.",
    todayDesc: "<b>A marcat Lionel Messi azi?</b> Cel mai recent meci oficial al lui Lionel Messi a avut loc pe <b>{date}</b>, în {comp}, unde a marcat <b>Golul #{N}</b> din cariera sa ({teamClause}) în minutul {minOrd}, din {techLower}, într-o {rw} de {score} contra {opp}.",
    faqScoredToday: "Cel mai recent meci oficial al lui Lionel Messi a fost pe {date}, în {comp}, unde a marcat Golul #{N} ({teamClause}) din {techLower} în minutul {minOrd}, într-o {rw} de {score} contra {opp}.",
    faqWhenScored: "Lionel Messi a marcat ultimul său gol pe {date}, pe {venue}, contra {opp} ({score}), în {comp}.",
    faqGoalNumber: "Ultimul gol oficial al lui Messi a fost Golul #{N} din cariera sa ({teamClause}), ducând bilanțul său la {N} goluri în {apps} meciuri.",
    faq1000: "Lionel Messi are în prezent {N} goluri oficiale în carieră, ceea ce înseamnă că îi mai trebuie exact {needed} goluri pentru a atinge istorica bornă de 1.000.",
    analysis: "Lionel Messi continuă să stabilească standardele fotbalului mondial în 2026. Ultimul său gol contra {opp} în {comp}, pe {venue}, i-a dus bilanțul la un uimitor <b>{N} goluri</b> ({teamClause}) în {apps} meciuri pentru Barcelona, PSG, Inter Miami și Argentina.",
    recentLine: "<b>#{N}:</b> {date} — {matchTitle} ({min}, {techLower})",
    milestoneH2: "Repere deblocate de Golul #{N}",
    bdayLink: "Vezi golurile din {bdayLabel} &rarr;",
  },
  uz: {
    desc: "Messi bugun gol urdimi? Lionel Messining so'nggi goli, hisob natijasi va HD videosini ko'ring — {N}-gol {opp} ga qarshi.",
    videoName: "Lionel Messining so'nggi goli: {N}-gol {opp} ga qarshi ({date})",
    videoDesc: "{date} kuni {comp} doirasida Lionel Messining {teamClause} bo'lgan {N}-golini {opp} ga qarshi tomosha qiling.",
    todayDesc: "<b>Messi bugun gol urdimi?</b> Lionel Messining so'nggi rasmiy o'yini <b>{date}</b> kuni {comp} da o'tdi, u yerda u {opp} ga qarshi {score} {rw} hisobida {minOrd}-daqiqa {techLower} bilan karerasidagi <b>{N}-golni</b> ({teamClause}) urdi.",
    faqScoredToday: "Lionel Messining so'nggi rasmiy o'yini {date} kuni {comp} da bo'ldi, u yerda u {opp} ga qarshi {score} {rw} hisobida {minOrd}-daqiqa {techLower} bilan {N}-golni ({teamClause}) urdi.",
    faqWhenScored: "Lionel Messi {date} kuni {venue}da {comp} doirasida {opp} ga qarshi ({score}) so'nggi golini urdi.",
    faqGoalNumber: "Messining so'nggi rasmiy goli — karerasidagi {N}-gol ({teamClause}), umumiy hisobi {apps} o'yinda {N} gollga yetdi.",
    faq1000: "Lionel Messining hozir karerasida {N} rasmiy goli bor, ya'ni tarixiy 1000-golga yetish uchun unga aynan {needed} gol kerak.",
    analysis: "Lionel Messi 2026-yilda jahon futboli me'yorlarini belgilashda davom etmoqda. {comp} doirasida {venue}da {opp} ga qarshi so'nggi goli hisobini ajoyib <b>{N} golga</b> ({teamClause}) yetkazdi — Barcelona, PSG, Inter Mayami va Argentina safida {apps} o'yinda.",
    recentLine: "<b>#{N}:</b> {date} — {matchTitle} ({min}, {techLower})",
    milestoneH2: "{N}-gol orqali zabt etilgan yangi marralar",
    bdayLink: "{bdayLabel} kunlari gollarini ko'rish &rarr;",
  },
};


/** Competition label per language; falls back to the raw JSON value. */
const COMP_LABELS = {
  en: {},
  es: { "International Friendly": "Amistoso Internacional" },
  pt: { "International Friendly": "Amistoso Internacional" },
  fr: { "International Friendly": "Match amical international" },
  ar: { "International Friendly": "ودية دولية" },
  bn: { "International Friendly": "আন্তর্জাতিক বন্ধুত্বপূর্ণ ম্যাচ" },
  hi: { "International Friendly": "अंतरराष्ट्रीय फ्रेंडली" },
  ro: { "International Friendly": "Amical internațional" },
  uz: { "International Friendly": "Xalqaro o'rtoqlik o'yini" },
};

export function compLabel(comp, lang) {
  return (COMP_LABELS[lang] && COMP_LABELS[lang][comp]) || comp;
}
