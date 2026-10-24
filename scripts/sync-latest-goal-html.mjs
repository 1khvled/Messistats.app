/**
 * Autonomous Latest Goal HTML Synchronizer (scripts/sync-latest-goal-html.mjs)
 * 
 * Synchronizes latest-goal.html across English, Spanish, Portuguese and French directly from public/data/latest-goal.json
 * and public/data/messi-data.json:
 * - Active video player src and poster
 * - Active goal badge, match title, meta line
 * - Stat boxes (Minute, Finish, Score, Comp, Team, Career Total)
 * - YouTube and Birthday action links
 * - "Did Messi score today?" card & verdict
 * - Recent 5 goals interactive switcher (.recent-goals-grid)
 * - Comparison matrix table (.recent-goals-table)
 * - Milestones section & KPIs
 * - Narrative analysis & FAQ cards
 * - Open Graph video tags & JSON-LD VideoObject/SportsEvent schemas
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildNarrative, compLabel } from "./latest-goal-narrative.mjs";

const VERDICT_LABEL = {
  en: "Latest Match Result: ",
  es: "Último Resultado: ",
  pt: "Último Resultado: ",
  fr: "Résultat du dernier match : ",
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const latestGoalJsonPath = path.join(root, "public", "data", "latest-goal.json");
const messiDataJsonPath = path.join(root, "public", "data", "messi-data.json");

const I18N = {
  en: {
    pageTitle: "Messi Goal Today",
    goalPrefix: "Goal #",
    tableGoalPrefix: "#",
    vs: "vs",
    at: "at",
    matchHighlights: "Match Highlights",
    finalScore: "Final",
    playVideo: "Play Video ▶",
    minuteLabel: "Minute",
    finishLabel: "Body Part",
    scoreLabel: "Match Score",
    compLabel: "Competition",
    teamLabel: "Team",
    totalLabel: "Career Total",
    replayVideo: "Replay Video",
    ytSearch: "YouTube Search",
    shareGoal: "Share Goal",
    viewBday: "View {date} Goals →",
    playlistTitle: "Messi's Recent Goals Playlist",
    playlistLead: "Select any of Lionel Messi's latest goals below to instantly load and watch the video highlight in the player above:",
    matrixTitle: "Lionel Messi Recent 5 Goals Comparison Matrix",
    matrixLead: "Detailed breakdown of Lionel Messi's most recent 5 official goals with exact date, scoring minute, opponent, competition, and video replay:",
    thGoal: "Goal #",
    thDate: "Date",
    thMatch: "Match & Score",
    thComp: "Competition",
    thMin: "Minute",
    thTech: "Technique & Assist",
    thVideo: "Video",
    milestonesTitle: "Milestones Unlocked by Goal #{goalNum}",
    kpiSeniorGoals: "Senior Goals",
    kpiAppsNote: "{apps} appearances",
    kpiMiamiGoals: "Inter Miami Goals",
    kpiMiamiNote: "All-time top scorer",
    kpiSeasonGoals: "2026 Season Goals",
    kpiSeasonNote: "MLS & international",
    kpiFreeKicks: "Free Kick Goals",
    kpiFkNote: "All-time career record",
    goalsTo1000: "Goals to 1,000",
    goalsTo1000Desc: "Active tracker toward the historic 1,000 official career goals mark.",
    trophiesDesc: "World record for most senior team titles in football history.",
    miamiDesc: "Centurion milestone as all-time top goalscorer for Inter Miami CF.",
    seniorGoalsDesc: "{clubGoals} official club goals and {intlGoals} international goals for Argentina.",
    didScoreTodayTitle: "Did Lionel Messi score today?",
    whenLastGoalTitle: "When did Lionel Messi score his last goal?",
    whatLastGoalNumTitle: "What was Lionel Messi's last goal number?",
    howManyMiamiTitle: "How many goals has Lionel Messi scored for Inter Miami?",
    howClose1000Title: "How close is Lionel Messi to 1,000 career goals?",
    didScoreTodayYes: "Lionel Messi's most recent official match was on {date} in {comp}, where he scored Goal #{goalNum} (his {miamiGoals}th Inter Miami goal) with a {minute} {finish} in a {score} result vs {opp}. If Inter Miami or Argentina plays today, check our live match tracker for instant updates.",
    didScoreTodayNo: "Lionel Messi's most recent official match took place on {date} in {comp}, where he featured vs {opp} ({score}). Stream the official latest goal video directly below or follow live updates whenever Inter Miami or Argentina kicks off.",
    whenLastGoalAns: "Lionel Messi scored his last goal on {date} at {venue} against {opp} ({score}) in {comp}.",
    whatLastGoalNumAns: "Messi's last official goal was Goal #{goalNum} of his senior career (his {miamiGoals}th goal for Inter Miami), bringing his verified all-time tally to {goalNum} senior goals in {apps} appearances.",
    howManyMiamiAns: "Lionel Messi has scored {miamiGoals} official goals for Inter Miami CF across all competitions (MLS, Leagues Cup, Campeones Cup, and Concacaf Champions Cup) since joining in July 2023.",
    howClose1000Ans: "Lionel Messi currently has {goalNum} official senior career goals, meaning he needs exactly {needed} more goals to reach the historic 1,000-goal milestone.",
    analysisP1: "Lionel Messi continues to set world football benchmarks in 2026. His latest strike against {opp} in {comp} at {venue} brought his career tally to an astonishing <b>{goalNum} senior goals</b> (and his {miamiGoals}th Inter Miami goal) across {apps} appearances for Barcelona, Paris Saint-Germain, Inter Miami, and the Argentina national team."
  },
  es: {
    pageTitle: "Último gol de Messi en video",
    goalPrefix: "Gol #",
    tableGoalPrefix: "#",
    vs: "vs",
    at: "en",
    matchHighlights: "Resumen del partido",
    finalScore: "Final",
    playVideo: "Ver Video ▶",
    minuteLabel: "Minuto",
    finishLabel: "Tipo de Definición",
    scoreLabel: "Resultado",
    compLabel: "Competición",
    teamLabel: "Equipo",
    totalLabel: "Total Carrera",
    replayVideo: "Repetir Video",
    ytSearch: "Buscar en YouTube",
    shareGoal: "Compartir Gol",
    viewBday: "Goles del {date} →",
    playlistTitle: "Lista de Goles Recientes de Messi",
    playlistLead: "Selecciona cualquiera de los últimos goles de Lionel Messi a continuación para cargarlo y reproducirlo al instante en el reproductor de video:",
    matrixTitle: "Matriz comparativa de los últimos 5 goles de Lionel Messi",
    matrixLead: "Desglose detallado de los últimos 5 goles oficiales de Lionel Messi con fecha exacta, minuto de gol, rival, competición y video:",
    thGoal: "Gol #",
    thDate: "Fecha",
    thMatch: "Partido y Resultado",
    thComp: "Competición",
    thMin: "Minuto",
    thTech: "Técnica y Asistencia",
    thVideo: "Video",
    milestonesTitle: "Hitos desbloqueados con el Gol #{goalNum}",
    kpiSeniorGoals: "Goles Oficiales",
    kpiAppsNote: "{apps} partidos",
    kpiMiamiGoals: "Goles en Inter Miami",
    kpiMiamiNote: "Máximo goleador histórico",
    kpiSeasonGoals: "Goles Temporada 2026",
    kpiSeasonNote: "MLS e internacional",
    kpiFreeKicks: "Goles de Tiro Libre",
    kpiFkNote: "Récord histórico mundial",
    goalsTo1000: "Goles para los 1.000",
    goalsTo1000Desc: "Seguimiento en vivo hacia los 1.000 goles oficiales en su carrera profesional.",
    trophiesDesc: "Récord mundial de más títulos oficiales de equipo en la historia del fútbol.",
    miamiDesc: "Hito como máximo goleador de todos los tiempos del Inter Miami CF.",
    seniorGoalsDesc: "{clubGoals} goles oficiales en clubes y {intlGoals} con la Selección Argentina.",
    didScoreTodayTitle: "¿Marcó Lionel Messi hoy?",
    whenLastGoalTitle: "¿Cuándo marcó Lionel Messi su último gol?",
    whatLastGoalNumTitle: "¿Cuál fue el número del último gol de Lionel Messi?",
    howManyMiamiTitle: "¿Cuántos goles lleva Lionel Messi con el Inter Miami?",
    howClose1000Title: "¿Qué tan cerca está Lionel Messi de los 1.000 goles?",
    didScoreTodayYes: "El partido oficial más reciente de Lionel Messi se disputó el {date} en {comp}, donde marcó el Gol #{goalNum} (su gol número {miamiGoals} con Inter Miami) en el minuto {minute} de tiro libre en el resultado {score} contra {opp}. Si Inter Miami o Argentina juegan hoy, consulta nuestro rastreador en vivo.",
    didScoreTodayNo: "El partido oficial más reciente de Lionel Messi se disputó el {date} en {comp} contra {opp} ({score}). Mira el video oficial de su último gol abajo.",
    whenLastGoalAns: "Lionel Messi anotó su último gol el {date} en {venue} frente a {opp} ({score}) en {comp}.",
    whatLastGoalNumAns: "El último gol oficial de Messi fue el Gol #{goalNum} de su carrera profesional ({miamiGoals}º con Inter Miami), alcanzando un total de {goalNum} goles en {apps} partidos.",
    howManyMiamiAns: "Lionel Messi suma {miamiGoals} goles oficiales con el Inter Miami CF en todas las competiciones (MLS, Leagues Cup, Campeones Cup y Concacaf Champions Cup).",
    howClose1000Ans: "Lionel Messi suma actualmente {goalNum} goles oficiales en su carrera, lo que significa que le faltan exactamente {needed} goles para alcanzar la legendaria marca de los 1.000 goles.",
    analysisP1: "Lionel Messi continúa batiendo récords mundiales en 2026. Su último tanto contra {opp} en {comp} en {venue} llevó su registro histórico a <b>{goalNum} goles oficiales</b> ({miamiGoals}º con Inter Miami) en {apps} encuentros con Barcelona, PSG, Inter Miami y la Selección Argentina."
  },
  pt: {
    pageTitle: "Último gol de Messi em vídeo",
    goalPrefix: "Gol #",
    tableGoalPrefix: "#",
    vs: "vs",
    at: "em",
    matchHighlights: "Melhores momentos",
    finalScore: "Final",
    playVideo: "Ver Vídeo ▶",
    minuteLabel: "Minuto",
    finishLabel: "Finalização",
    scoreLabel: "Placar",
    compLabel: "Competição",
    teamLabel: "Equipe",
    totalLabel: "Total Carreira",
    replayVideo: "Repetir Vídeo",
    ytSearch: "Buscar no YouTube",
    shareGoal: "Compartilhar Gol",
    viewBday: "Gols de {date} →",
    playlistTitle: "Lista de Gols Recentes de Messi",
    playlistLead: "Selecione qualquer um dos últimos gols de Lionel Messi abaixo para carregar e assistir ao vídeo instantaneamente:",
    matrixTitle: "Tabela comparativa dos últimos 5 gols de Lionel Messi",
    matrixLead: "Detalhamento dos últimos 5 gols oficiais de Lionel Messi com data, minuto, adversário, competição e vídeo:",
    thGoal: "Gol #",
    thDate: "Data",
    thMatch: "Jogo e Placar",
    thComp: "Competição",
    thMin: "Minuto",
    thTech: "Técnica e Assistência",
    thVideo: "Vídeo",
    milestonesTitle: "Marcos históricos do Gol #{goalNum}",
    kpiSeniorGoals: "Gols Oficiais",
    kpiAppsNote: "{apps} partidas",
    kpiMiamiGoals: "Gols no Inter Miami",
    kpiMiamiNote: "Maior artilheiro histórico",
    kpiSeasonGoals: "Gols em 2026",
    kpiSeasonNote: "MLS e seleção",
    kpiFreeKicks: "Gols de Falta",
    kpiFkNote: "Recorde mundial histórico",
    goalsTo1000: "Gols para os 1.000",
    goalsTo1000Desc: "Contador em tempo real rumo aos 1.000 gols oficiais na carreira.",
    trophiesDesc: "Recorde mundial de títulos por equipe na história do futebol.",
    miamiDesc: "Maior artilheiro de todos os tempos da história do Inter Miami CF.",
    seniorGoalsDesc: "{clubGoals} gols em clubes e {intlGoals} pela Seleção Argentina.",
    didScoreTodayTitle: "Lionel Messi marcou gol hoje?",
    whenLastGoalTitle: "Quando Lionel Messi marcou seu último gol?",
    whatLastGoalNumTitle: "Qual foi o número do último gol de Lionel Messi?",
    howManyMiamiTitle: "Quantos gols Lionel Messi tem pelo Inter Miami?",
    howClose1000Title: "Quão perto Lionel Messi está dos 1.000 gols?",
    didScoreTodayYes: "A partida oficial mais recente de Lionel Messi ocorreu em {date} na {comp}, onde marcou o Gol #{goalNum} (seu {miamiGoals}º gol pelo Inter Miami) aos {minute} em cobrança de falta no placar de {score} contra {opp}. Acompanhe nosso rastreador ao vivo.",
    didScoreTodayNo: "A partida mais recente de Messi ocorreu em {date} contra {opp} ({score}). Veja o vídeo do último gol abaixo.",
    whenLastGoalAns: "Lionel Messi marcou seu último gol em {date} no estádio {venue} contra {opp} ({score}) pela {comp}.",
    whatLastGoalNumAns: "O último gol oficial de Messi foi o Gol #{goalNum} da sua carreira ({miamiGoals}º pelo Inter Miami), atingindo {goalNum} gols em {apps} jogos.",
    howManyMiamiAns: "Lionel Messi tem {miamiGoals} gols oficiais pelo Inter Miami CF em todas as competições desde julho de 2023.",
    howClose1000Ans: "Lionel Messi tem atualmente {goalNum} gols oficiais, restando exatamente {needed} gols para a marca lendária de 1.000 gols.",
    analysisP1: "Lionel Messi continua quebrando recordes em 2026. Seu último gol contra o {opp} na {comp} levou sua marca a <b>{goalNum} gols oficiais</b> ({miamiGoals}º pelo Inter Miami) em {apps} jogos por Barcelona, PSG, Inter Miami e Argentina."
  },
  fr: {
    pageTitle: "Dernier but de Messi en vidéo",
    goalPrefix: "But #",
    tableGoalPrefix: "#",
    vs: "vs",
    at: "à",
    matchHighlights: "Résumé du match",
    finalScore: "Score final",
    playVideo: "Voir la vidéo ▶",
    minuteLabel: "Minute",
    finishLabel: "Finition",
    scoreLabel: "Score",
    compLabel: "Compétition",
    teamLabel: "Équipe",
    totalLabel: "Total Carrière",
    replayVideo: "Rejouer la vidéo",
    ytSearch: "Recherche YouTube",
    shareGoal: "Partager le but",
    viewBday: "Buts du {date} →",
    playlistTitle: "Derniers buts de Messi en vidéo",
    playlistLead: "Sélectionnez l'un des derniers buts de Lionel Messi ci-dessous pour lancer immédiatement la vidéo :",
    matrixTitle: "Tableau comparatif des 5 derniers buts de Lionel Messi",
    matrixLead: "Détails complets des 5 derniers buts officiels avec date, minute, adversaire, compétition et vidéo :",
    thGoal: "But #",
    thDate: "Date",
    thMatch: "Match & Score",
    thComp: "Compétition",
    thMin: "Minute",
    thTech: "Technique & Passe",
    thVideo: "Vidéo",
    milestonesTitle: "Records débloqués par le But #{goalNum}",
    kpiSeniorGoals: "Buts Officiels",
    kpiAppsNote: "{apps} matchs",
    kpiMiamiGoals: "Buts avec l'Inter Miami",
    kpiMiamiNote: "Meilleur buteur historique",
    kpiSeasonGoals: "Buts Saison 2026",
    kpiSeasonNote: "MLS et sélection",
    kpiFreeKicks: "Coups Francs Directs",
    kpiFkNote: "Record mondial absolu",
    goalsTo1000: "Buts vers les 1 000",
    goalsTo1000Desc: "Suivi en direct de la quête légendaire des 1 000 buts officiels en carrière.",
    trophiesDesc: "Record du monde du plus grand nombre de trophées collectifs de l'histoire du football.",
    miamiDesc: "Meilleur buteur de l'histoire de l'Inter Miami CF.",
    seniorGoalsDesc: "{clubGoals} buts en clubs et {intlGoals} avec l'équipe nationale d'Argentine.",
    didScoreTodayTitle: "Lionel Messi a-t-il marqué aujourd'hui ?",
    whenLastGoalTitle: "Quand Lionel Messi a-t-il marqué son dernier but ?",
    whatLastGoalNumTitle: "Quel était le numéro du dernier but de Messi ?",
    howManyMiamiTitle: "Combien de buts Lionel Messi a-t-il marqués avec l'Inter Miami ?",
    howClose1000Title: "À quelle distance Lionel Messi est-il des 1 000 buts ?",
    didScoreTodayYes: "Le match officiel le plus récent de Lionel Messi a eu lieu le {date} en {comp}, où il a inscrit le But #{goalNum} (son {miamiGoals}e avec l'Inter Miami) à la {minute} sur coup franc direct contre {opp} ({score}).",
    didScoreTodayNo: "Le match le plus récent de Messi s'est déroulé le {date} face à {opp} ({score}). Regardez son dernier but en vidéo ci-dessous.",
    whenLastGoalAns: "Lionel Messi a marqué son dernier but le {date} au stade {venue} contre {opp} ({score}) en {comp}.",
    whatLastGoalNumAns: "Le dernier but officiel de Messi était le But #{goalNum} de sa carrière ({miamiGoals}e pour l'Inter Miami), portant son total à {goalNum} buts en {apps} apparitions.",
    howManyMiamiAns: "Lionel Messi a inscrit {miamiGoals} buts officiels pour l'Inter Miami CF toutes compétitions confondues depuis juillet 2023.",
    howClose1000Ans: "Lionel Messi compte actuellement {goalNum} buts en carrière, il lui manque exactement {needed} buts pour atteindre le cap mythique des 1 000 buts.",
    analysisP1: "Lionel Messi poursuit sa légende en 2026. Sa dernière réalisation contre {opp} en {comp} à {venue} porte son total à <b>{goalNum} buts officiels</b> ({miamiGoals}e pour l'Inter Miami) en {apps} apparitions."
  }
};

// Localized month names + technique terms for dynamic goal strings.
// English is the source language in latest-goal.json; these maps convert
// rendered dates/techniques so non-EN pages don't leak English.
const MONTHS_FULL = {
  es: ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"],
  pt: ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"],
  fr: ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"]
};
const MONTHS_SHORT = {
  es: ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"],
  pt: ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"],
  fr: ["jan","fév","mar","avr","mai","juin","juil","août","sep","oct","nov","déc"]
};
const EN_MONTHS_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const EN_MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const TECH_WORDS = {
  es: { fk: "Tiro libre directo", header: "Cabeza", assist: "Asistencia", left: "Zurda", right: "Derecha", penalty: "Penalti", play: "Ver Video ▶", goalTag: "Gol 🔥" },
  pt: { fk: "Falta direta", header: "Cabeceio", assist: "assistência", left: "Chute de esquerda", right: "Chute de direita", penalty: "Pênalti", play: "Ver Vídeo ▶", goalTag: "Gol 🔥" },
  fr: { fk: "Coup franc direct", header: "Tête", assist: "passe décisive", left: "Frappe du gauche", right: "Frappe du droit", penalty: "Penalty", play: "Voir la Vidéo ▶", goalTag: "But 🔥" }
};
function locDateStr(s, lang, short = false) {
  if (!s || lang === "en" || (!MONTHS_FULL[lang] && !MONTHS_SHORT[lang])) return s;
  let out = String(s);
  EN_MONTHS_FULL.forEach((en, i) => {
    const rep = short ? (MONTHS_SHORT[lang] ? MONTHS_SHORT[lang][i] : MONTHS_FULL[lang][i]) : MONTHS_FULL[lang][i];
    out = out.split(en).join(rep);
  });
  EN_MONTHS_SHORT.forEach((en, i) => {
    const rep = MONTHS_SHORT[lang] ? MONTHS_SHORT[lang][i] : MONTHS_FULL[lang][i];
    out = out.split(` ${en} `).join(` ${rep} `);
  });
  return out;
}
function locTech(s, lang) {
  if (!s || lang === "en" || !TECH_WORDS[lang]) return s;
  const w = TECH_WORDS[lang];
  let out = String(s);
  out = out.split("Direct Free Kick").join(w.fk);
  out = out.split("Left Foot Strike").join(w.left);
  out = out.split("Right Foot Strike").join(w.right);
  out = out.split("Penalty").join(w.penalty);
  out = out.split("Header").join(w.header);
  out = out.split("Left Foot").join(w.left);
  out = out.split("Right Foot").join(w.right);
  out = out.split("Assist:").join(`${w.assist}:`);
  out = out.split("assist:").join(`${w.assist}:`);
  return out;
}
function locGoalLabel(n, lang) {
  if (lang === "fr") return `But #${n}`;
  if (lang === "es" || lang === "pt") return `Gol #${n}`;
  return `Goal #${n}`;
}

export function syncLatestGoalHtml() {
  console.log(`[sync-latest-goal-html] Synchronizing all latest-goal HTML files...`);

  if (!fs.existsSync(latestGoalJsonPath)) {
    console.error("Missing public/data/latest-goal.json");
    return;
  }

  const latestData = JSON.parse(fs.readFileSync(latestGoalJsonPath, "utf8"));
  const messiData = fs.existsSync(messiDataJsonPath) ? JSON.parse(fs.readFileSync(messiDataJsonPath, "utf8")) : null;

  const g = latestData.latestGoal;
  const recent = latestData.recentGoals || [];
  const totals = latestData.totals || {};

  const seniorGoals = g.goalNumber || totals.seniorGoals || 932;
  const apps = totals.appearances || 1177;
  const miamiGoals = totals.miamiGoals || 102;
  const seasonGoals = totals.season2026Goals || 26;
  const freeKicks = totals.freeKicks || 68;
  const goalsNeeded = 1000 - seniorGoals;

  const clubGoals = messiData?.totals?.club?.goals || 806;
  const intlGoals = messiData?.totals?.international?.goals || 126;

  const targetFiles = [
    { lang: "en", file: path.join(root, "latest-goal.html") },
    { lang: "es", file: path.join(root, "es", "latest-goal.html") },
    { lang: "pt", file: path.join(root, "pt", "latest-goal.html") },
    { lang: "fr", file: path.join(root, "fr", "latest-goal.html") }
  ];

  let updatedCount = 0;

  for (const { lang, file } of targetFiles) {
    if (!fs.existsSync(file)) continue;

    let html = fs.readFileSync(file, "utf8");

    // 1. Update Video Player Tag
    html = html.replace(
      /<video id="latest-goal-video"[^>]*src="[^"]*"[^>]*>/i,
      `<video id="latest-goal-video" class="latest-goal-video" controls playsinline preload="metadata" poster="/img/og-messi.jpg" src="${g.videoUrl}">`
    );

    // 2. Update Active Goal Number Badge
    const badgeText = locGoalLabel(seniorGoals, lang);
    html = html.replace(/<span id="active-goal-num"[^>]*>[^<]*<\/span>/i, `<span id="active-goal-num" class="goal-number-badge">${badgeText}</span>`);

    // 3. Update Active Goal Title & Meta
    const matchTitleText = lang === "en" ? `Goal #${seniorGoals} Match Highlights: ${g.title}` : `${locGoalLabel(seniorGoals, lang)}: ${g.title}`;
    html = html.replace(/<h2 id="active-goal-title"[^>]*>[^<]*<\/h2>/i, `<h2 id="active-goal-title" class="latest-goal-match-title">${matchTitleText}</h2>`);

    const metaLineText = `${g.competition} • ${locDateStr(g.formattedDate, lang)} • ${g.venue}`;
    html = html.replace(/<p id="active-goal-meta"[^>]*>[^<]*<\/p>/i, `<p id="active-goal-meta" class="latest-goal-meta-line">${metaLineText}</p>`);

    // 4. Update Stat Boxes
    html = html.replace(/<span id="stat-minute"[^>]*>[^<]*<\/span>/i, `<span id="stat-minute" class="goal-stat-val tnum">${g.minute}</span>`);
    html = html.replace(/<span id="stat-type"[^>]*>[^<]*<\/span>/i, `<span id="stat-type" class="goal-stat-val">${locTech(g.finish || "Direct Free Kick", lang)}</span>`);
    html = html.replace(/<span id="stat-score"[^>]*>[^<]*<\/span>/i, `<span id="stat-score" class="goal-stat-val tnum">${g.score}</span>`);
    html = html.replace(/<span id="stat-comp"[^>]*>[^<]*<\/span>/i, `<span id="stat-comp" class="goal-stat-val">${g.competition}</span>`);

    // 5. Update Action Bar (YouTube search + Birthday link)
    html = html.replace(/href="https:\/\/www\.youtube\.com\/results\?search_query=[^"]*"/i, `href="${g.youtubeUrl}"`);
    const bdayHref = `/en/birthday/${g.bdayKey}`;
    html = html.replace(/id="link-bday-goal"[^>]*href="[^"]*"/i, `id="link-bday-goal" href="${bdayHref}"`);
    html = html.replace(/href="[^"]*"([^>]*id="link-bday-goal")/i, `href="${bdayHref}"$1`);

    // 6. Update Recent Goals 5-Card Switcher
    const MATCH_PREP = { es: "en ", pt: "em ", fr: "contre " };
    const cardsHtml = recent.slice(0, 5).map((rg, idx) => {
      const isActive = idx === 0 ? " active" : "";
      const goalLabel = locGoalLabel(rg.goalNumber, lang);
      const bdayPath = rg.bdayUrl || `/en/birthday/${rg.bdayKey || "09-27"}`;
      const cardMatch = lang === "en" || !MATCH_PREP[lang] ? rg.match : String(rg.match || "").replace(/^(at|vs)\s+/, MATCH_PREP[lang]);
      const cardTag = rg.tag ? locTech(rg.tag, lang) : (TECH_WORDS[lang] ? TECH_WORDS[lang].goalTag : "Goal 🔥");
      return `    <div class="recent-goal-card${isActive}" data-goal-id="${rg.goalNumber}"
         data-goal-num="${goalLabel}"
         data-title="${rg.title}"
         data-meta="${locDateStr(rg.meta, lang)}"
         data-minute="${rg.minute}"
         data-type="${locTech(rg.type, lang)}"
         data-score="${rg.score}"
         data-comp="${rg.comp}"
         data-video-url="${rg.videoUrl}"
         data-yt-url="${rg.ytUrl}"
         data-bday-url="${bdayPath}">
      <div class="recent-goal-card-top">
        <span class="recent-goal-card-num">${goalLabel}</span>
        <svg class="recent-goal-play-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
      </div>
      <div class="recent-goal-card-match">${cardMatch}</div>
      <div class="recent-goal-card-date">${locDateStr(rg.date, lang)}</div>
      <span class="recent-goal-card-tag">${cardTag}</span>
    </div>`;
    }).join("\n\n");

    html = html.replace(/<div class="recent-goals-grid">[\s\S]*?<\/div>\s*<\/section>/i, `<div class="recent-goals-grid">\n${cardsHtml}\n  </div>\n</section>`);

    // 7. Update Comparison Matrix Table (built from recent-goals JSON so dates,
    // opponents and techniques render localized per language)
    function shortDateLoc(longEn, lang) {
      const m = String(longEn || "").match(/(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/);
      if (!m) return locDateStr(longEn, lang, true);
      const idx = EN_MONTHS_FULL.indexOf(m[2]);
      const short = (MONTHS_SHORT[lang] && MONTHS_SHORT[lang][idx]) || (MONTHS_FULL[lang] && MONTHS_FULL[lang][idx]) || m[2];
      return `${m[1]} ${short} ${m[3]}`;
    }
    const tableRows = recent.slice(0, 5).map((rg) => {
      const pm = String(rg.match || "").match(/^(?:at|vs)\s+(.+?)\s*\(([^)]+)\)\s*$/);
      const opp = pm ? pm[1] : rg.match;
      const sc = (pm ? pm[2] : rg.score || "").replace(/-/g, "–");
      const playWord = TECH_WORDS[lang] ? TECH_WORDS[lang].play : "Play Video ▶";
      return `      <tr>
        <td><span class="table-goal-badge">#${rg.goalNumber}</span></td>
        <td class="tnum">${shortDateLoc((rg.date || "").split("•")[0].trim(), lang)}</td>
        <td><b>${opp} (${sc})</b></td>
        <td>${rg.comp}</td>
        <td class="tnum"><b>${rg.minute}</b></td>
        <td>${locTech(rg.type, lang)}</td>
        <td><a href="${rg.videoUrl}" target="_blank" rel="noopener noreferrer" class="table-play-link">${playWord}</a></td>
      </tr>`;
    }).join("\n\n");

    html = html.replace(/<tbody>[\s\S]*?<\/tbody>/i, `<tbody>\n${tableRows}\n    </tbody>`);

    // 8. Update Milestones Section & KPIs
    html = html.replace(/<h2>Milestones Unlocked by Goal #[0-9]+<\/h2>/i, `<h2>Milestones Unlocked by Goal #${seniorGoals}</h2>`);
    html = html.replace(/<h2>Hitos desbloqueados con el Gol #[0-9]+<\/h2>/i, `<h2>Hitos desbloqueados con el Gol #${seniorGoals}</h2>`);
    html = html.replace(/<h2>Marcos históricos do Gol #[0-9]+<\/h2>/i, `<h2>Marcos históricos do Gol #${seniorGoals}</h2>`);
    html = html.replace(/<h2>Records débloqués par le But #[0-9]+<\/h2>/i, `<h2>Records débloqués par le But #${seniorGoals}</h2>`);

    // Update KPI Card Numbers
    html = html.replace(
      /(<span class="milestone-title">Inter Miami Goals<\/span>[\s\S]*?<span class="milestone-val tnum">)[0-9]+(<\/span>)/i,
      `$1${miamiGoals}$2`
    );
    html = html.replace(
      /(<span class="milestone-val tnum">)[0-9]+(<\/span>\s*<span class="milestone-title">Inter Miami Goals<\/span>)/i,
      `$1${miamiGoals}$2`
    );
    html = html.replace(
      /(<span class="milestone-val tnum">)[0-9]+(<\/span>\s*<span class="milestone-title">Senior Goals<\/span>)/i,
      `$1${seniorGoals}$2`
    );
    html = html.replace(
      /(<span class="milestone-val tnum">)[0-9]+(<\/span>\s*<span class="milestone-title">Goals to 1,000<\/span>)/i,
      `$1${goalsNeeded}$2`
    );

    // Update 4-KPI Grid
    html = html.replace(
      /(<div class="kpi">\s*<span class="kpi-label">Senior Goals<\/span>\s*<span class="kpi-value tnum">)[0-9]+(<\/span>\s*<span class="kpi-note">)[0-9,]+ appearances(<\/span>)/i,
      `$1${seniorGoals}$2${apps.toLocaleString()} appearances$3`
    );
    html = html.replace(
      /(<div class="kpi">\s*<span class="kpi-label">Inter Miami Goals<\/span>\s*<span class="kpi-value tnum">)[0-9]+(<\/span>)/i,
      `$1${miamiGoals}$2`
    );
    html = html.replace(
      /(<div class="kpi">\s*<span class="kpi-label">2026 Season Goals<\/span>\s*<span class="kpi-value tnum">)[0-9]+(<\/span>)/i,
      `$1${seasonGoals}$2`
    );
    html = html.replace(
      /(<div class="kpi">\s*<span class="kpi-label">Free Kick Goals<\/span>\s*<span class="kpi-value tnum">)[0-9]+(<\/span>)/i,
      `$1${freeKicks}$2`
    );
    // Same Free-Kick KPI in all four languages (labels are static per locale)
    for (const lbl of ["Goles de Tiro Libre", "Gols de Falta", "Coups Francs Directs"]) {
      const re = new RegExp(`(<span class="kpi-label">${lbl}<\\/span>\\s*<span class="kpi-value tnum">)[0-9]+(<\\/span>)`);
      html = html.replace(re, `$1${freeKicks}$2`);
    }

    // 9. Update Open Graph & Twitter Video Tags
    html = html.replace(/<meta property="og:video" content="[^"]*"/i, `<meta property="og:video" content="${g.videoUrl}"`);
    html = html.replace(/<meta property="og:video:secure_url" content="[^"]*"/i, `<meta property="og:video:secure_url" content="${g.videoUrl}"`);
    html = html.replace(/<meta name="twitter:player:stream" content="[^"]*"/i, `<meta name="twitter:player:stream" content="${g.videoUrl}"`);

    // 10. Update VideoObject Schema JSON-LD
    html = html.replace(/"contentUrl":\s*"https:\/\/cdn\.messiallgoals\.com\/Goal[0-9]+\.mp4"/g, `"contentUrl": "${g.videoUrl}"`);
    html = html.replace(/"embedUrl":\s*"https:\/\/cdn\.messiallgoals\.com\/Goal[0-9]+\.mp4"/g, `"embedUrl": "${g.videoUrl}"`);

    // 11. Full narrative rebuild - template-driven, sourced from JSON.
    // The old one-hop literal swaps are gone. Everything below rebuilds
    // from latest-goal.json so copy can never drift again.
    const intlGoalsN = intlGoals;
    const _bparts = String(g.bdayKey || "").split("-");
    const _bdayEn = (_bparts.length === 2) ? (Number(_bparts[1]) + " " + (EN_MONTHS_FULL[Number(_bparts[0]) - 1] || "")).trim() : "";
    const _bdayLoc = locDateStr(_bdayEn, lang);
    const _techEn = g.finish || "";
    const _techBase = locTech(_techEn, lang);
    // French needs masculine noun phrases after "d'un" (a bare feminine
    // "frappe" would be ungrammatical), so map from the English finish.
    const _techPhrase = lang === "fr"
      ? (/penalty/i.test(_techEn) ? "coup de penalty"
        : /free kick/i.test(_techEn) ? "coup franc direct"
        : /left/i.test(_techEn) ? "coup de pied gauche"
        : /right/i.test(_techEn) ? "coup de pied droit"
        : /head/i.test(_techEn) ? "coup de tête"
        : (_techBase ? _techBase.charAt(0).toLowerCase() + _techBase.slice(1) : _techBase))
      : (_techBase ? _techBase.charAt(0).toLowerCase() + _techBase.slice(1) : _techBase);
    const _verdict = VERDICT_LABEL[lang] || VERDICT_LABEL.en;
    const NAR = buildNarrative({
      g, seniorGoals, apps, miamiGoals, intlGoals: intlGoalsN, goalsNeeded, lang,
      compLoc: compLabel(g.competition, lang), techLowerLoc: _techPhrase, bdayLabel: _bdayLoc,
    });
    const escAttr = (st) => String(st).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
    const escHtml = (st) => String(st).replace(/</g, "&lt;");

    html = html.replace(/<meta name="description" content="[^"]*"/i, '<meta name="description" content="' + escAttr(NAR.desc) + '"');
    html = html.replace(/<meta property="og:description" content="[^"]*"/i, '<meta property="og:description" content="' + escAttr(NAR.desc) + '"');
    html = html.replace(/<meta name="twitter:description" content="[^"]*"/i, '<meta name="twitter:description" content="' + escAttr(NAR.desc) + '"');
    html = html.replace(/<meta content="[^"]*" property="og:image:secure_url"/i, '<meta content="https://www.messistat.com/img/og-messi.jpg?v=' + seniorGoals + '" property="og:image:secure_url"');
    html = html.replace(/og-messi\.jpg\?v=\d+/g, "og-messi.jpg?v=" + seniorGoals);
    html = html.replace(/<meta property="og:image:alt" content="[^"]*"/i, '<meta property="og:image:alt" content="' + escAttr(NAR.videoName) + '"');
    html = html.replace(/<meta name="keywords" content="([^"]*)"/i, (whole, kw) => {
      let out = kw;
      for (let back = 1; back <= 5; back++) {
        const prev = seniorGoals - back;
        out = out.split(String(prev)).join(String(seniorGoals));
      }
      return '<meta name="keywords" content="' + out + '"';
    });

        html = html.replace(/(<title>[^<]*<\/title>|<meta property="og:title" content="[^"]*"|<meta name="twitter:title" content="[^"]*")/gi, (tag) => {
      let outT = tag;
      for (let back = 1; back <= 5; back++) {
        const prevT = String(seniorGoals - back);
        outT = outT.split(prevT).join(String(seniorGoals));
      }
      return outT;
    });

    html = html.replace(/(<div class="today-status-verdict">[\s\S]*?<span>)[^<]*(<\/span>)/i, function (w, a, b) { return a + escHtml(_verdict) + escHtml(g.title) + b; });
    html = html.replace(/<span class="badge badge-season">[^<]*<\/span>/i, '<span class="badge badge-season">' + escHtml(NAR.seasonBadge) + '</span>');

    html = html.replace(/<p id="lg-today-desc"[^>]*>[\s\S]*?<\/p>/i, '<p id="lg-today-desc" class="today-status-desc">' + NAR.todayDesc + '</p>');
    html = html.replace(/<span id="stat-team"[^>]*>[^<]*<\/span>/i, '<span id="stat-team" class="goal-stat-val">' + escHtml(g.team) + '</span>');
    const _totalPair = seniorGoals + " / " + seniorGoals;
    html = html.replace(/<span id="stat-total"[^>]*>[^<]*<\/span>/i, '<span id="stat-total" class="goal-stat-val tnum">' + _totalPair + '</span>');
    html = html.replace(/(<a[^>]*id="link-bday-goal"[^>]*>[\s\S]*?<span>)[^<]*(<\/span>)/i, function (w, a, b) { return a + NAR.bdayLink + b; });
    html = html.replace(/<h2 id="lg-milestone-h2"[^>]*>[\s\S]*?<\/h2>/i, '<h2 id="lg-milestone-h2">' + NAR.milestoneH2 + '</h2>');
    html = html.replace(/<p id="lg-analysis"[^>]*>[\s\S]*?<\/p>/i, '<p id="lg-analysis">' + NAR.analysis + '</p>');
    html = html.replace(/<li id="lg-latest-line">[\s\S]*?<\/li>/i, '<li id="lg-latest-line">' + NAR.recentLine + '</li>');
    const FAQ_HTML = [NAR.faqScoredToday, NAR.faqWhenScored, NAR.faqGoalNumber, null, NAR.faq1000, null];
    FAQ_HTML.forEach((txt, i) => {
      if (!txt) return;
      html = html.replace(new RegExp('<p id="lg-faq-' + i + '"[^>]*>[\\s\\S]*?<\\/p>'), '<p id="lg-faq-' + i + '">' + txt + '</p>');
    });
    // Miami-count answer (index 3, all languages): the only 3-digit number
    // in it is the Miami total (years are 4-digit), so a range swap is safe.
    const patchMiamiAns = (txt) => {
      return String(txt).replace(/(?<![\d.,])\d{3}(?![\d])/g, (m) => {
        const nv = Number(m);
        return (nv <= miamiGoals && nv >= miamiGoals - 5) ? String(miamiGoals) : m;
      });
    };
    html = html.replace(/(<p id="lg-faq-3"[^>]*>)([\s\S]*?)(<\/p>)/i, (w, a, txt, c) => a + patchMiamiAns(txt) + c);

        html = html.replace(/<!--[\s\S]*?-->/g, (c) => {
      let outC = c;
      for (let back = 1; back <= 5; back++) {
        const prevC = String(seniorGoals - back);
        outC = outC.split(prevC).join(String(seniorGoals));
      }
      return outC;
    });

    html = html.replace(/(<section class="latest-goal-roulette-card"[\s\S]*?<\/section>)/i, (blk) => {
      let out = blk;
      for (let back = 1; back <= 5; back++) {
        const prev = String(seniorGoals - back);
        out = out.split(prev).join(String(seniorGoals));
      }
      return out;
    });

        // kpi-note / milestone-note carry the appearances total ("1,177 appearances").
    // Swap old apps -> new apps, preserving each locale's separator style.
    const APPS_NOTE_STYLES = [",", ".", " ", "\u00a0", "\u202f"];
    const groupNum = (n, sep) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, sep);
    html = html.replace(/(<span class="(?:kpi-note|milestone-note)"[^>]*>)([^<]*)(<\/span>)/g, (whole2, open2, txt2, close2) => {
      let out2 = txt2;
      for (const sep of APPS_NOTE_STYLES) {
        out2 = out2.split(groupNum(apps - 1, sep)).join(groupNum(apps, sep));
      }
      return open2 + out2 + close2;
    });

    const trophiesNow = (() => { try { return (messiData.trophies || []).filter((t) => t.team !== "Individual").reduce((a, t) => a + ((t.years || []).length), 0); } catch { return 47; } })();
    html = html.replace(/(<span class="(?:milestone-val|kpi-value) tnum"[^>]*>)([0-9,\s]+)(<\/span>)/g, (whole, open, val, close) => {
      const n = Number(val.replace(/,/g, ""));
      if (!Number.isFinite(n)) return whole;
      const put = (v) => open + String(v) + close;
      if (n <= seniorGoals && n >= seniorGoals - 5 && n >= 900) return put(seniorGoals);
      if (n <= miamiGoals && n >= miamiGoals - 5) return put(miamiGoals);
      if (n >= goalsNeeded && n <= goalsNeeded + 5) return put(goalsNeeded);
      if (n < trophiesNow && n >= trophiesNow - 5) return put(trophiesNow);
      return whole;
    });
    // milestone international-goals desc ("806 club ... 125 international"): first int -> club, last int -> country
    html = html.replace(/(<p class="milestone-desc">)([\s\S]*?)(<\/p>)/gi, (whole, open, txt, close) => {
      const ints = [...txt.matchAll(/[\d]+/g)].map((m) => m[0]);
      if (ints.length < 2) return whole;
      const first = Number(ints[0]);
      const last = Number(ints[ints.length - 1]);
      if (!(first >= clubGoals - 5 && first <= clubGoals)) return whole;
      if (!(last >= intlGoals - 5 && last <= intlGoals)) return whole;
      let out = txt;
      out = out.replace(ints[0], String(clubGoals));
      const li = out.lastIndexOf(ints[ints.length - 1]);
      out = out.slice(0, li) + String(intlGoals) + out.slice(li + ints[ints.length - 1].length);
      return open + out + close;
    });

    html = html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi, (whole, body) => {
      let data;
      try { data = JSON.parse(body); } catch (e) { return whole; }
      const classifyFaq = (qn) => {
        const q = String(qn || "");
        if (/1.?000|1000|1 000/.test(q)) return NAR.faq1000;
        if (/number|n\u00famero|num\u00e9ro|\u2116/i.test(q)) return NAR.faqGoalNumber;
        if (/when|cu\u00e1ndo|quando|quand|d\u00f3nde|onde|o\u00f9|contre/i.test(q)) return NAR.faqWhenScored;
        if (/today|hoy|hoje|aujourd|latest/i.test(q)) return NAR.faqScoredToday;
        return null;
      };
      const walk = (node) => {
        if (Array.isArray(node)) return node.forEach(walk);
        if (!node || typeof node !== "object") return;
        if (node["@type"] === "WebPage" && node.description) node.description = NAR.desc;
        if (node["@type"] === "VideoObject") {
          if (node.name) node.name = NAR.videoName;
          if (node.description) node.description = NAR.videoDesc;
        }
        if (node["@type"] === "Clip" && node.name) node.name = g.minute + " " + locGoalLabel(seniorGoals, lang) + " " + locTech(g.finish || "", lang);
        if (node["@type"] === "SportsEvent") {
          const yr = String(g.date || "").slice(0, 4) || "2026";
          const shortComp = g.competition === "International Friendly" ? "Friendly" : g.competition;
          node.name = g.team + " vs " + g.opponent + " (" + shortComp + " " + yr + ")";
          if (g.date) { node.startDate = g.date; node.endDate = g.date; }
          if (!/Inter Miami/i.test(g.team || "") && node.location && typeof node.location === "object") {
            node.location.name = g.venue;
            if (node.location.address && typeof node.location.address === "object") {
              const venParen = String(g.venue || "").match(/\(([^)]+)\)/);
              if (venParen) node.location.address.addressLocality = venParen[1];
              delete node.location.address.addressRegion;
              node.location.address.addressCountry = "AR";
            }
          } else if (node.location && typeof node.location === "object") {
            node.location.name = g.venue;
          }
          if (Array.isArray(node.competitor) && node.competitor.length >= 2) {
            node.competitor[0].name = g.team;
            node.competitor[1].name = g.opponent;
          }
        }
        if (node["@type"] === "Question" && node.name) {
          const txt = classifyFaq(node.name);
          if (txt) {
            const ansObjs = [];
            const collect = (v) => { if (Array.isArray(v)) v.forEach(collect); else if (v && typeof v === "object" && v["@type"] === "Answer") ansObjs.push(v); };
            collect(node.acceptedAnswer); collect(node.answer); collect(node.answers);
            ansObjs.forEach(a => { if (typeof a.text === "string") a.text = txt; });
          } else if (/miami|mayami/i.test(String(node.name))) {
            // Miami-count answer: same range logic as the visible card
            const ansObjs = [];
            const collect = (v) => { if (Array.isArray(v)) v.forEach(collect); else if (v && typeof v === "object" && v["@type"] === "Answer") ansObjs.push(v); };
            collect(node.acceptedAnswer); collect(node.answer); collect(node.answers);
            ansObjs.forEach(a => { if (typeof a.text === "string") a.text = patchMiamiAns(a.text); });
          }
        }
        Object.values(node).forEach(walk);
      };
      walk(data);
      return '<script type="application/ld+json">' + JSON.stringify(data, null, 2) + '</script>';
    });

    html = html.replace(/<span class="badge badge-video">[^<]*<\/span>/i, '<span class="badge badge-video">' + badgeText + ' (' + g.minute + ')</span>');

    fs.writeFileSync(file, html, "utf8");

    const written = fs.readFileSync(file, "utf8");
    const guardZone = written
      .replace(/<svg[\s\S]*?<\/svg>/gi, "")
      .replace(/<div class="recent-goals-grid">[\s\S]*?<\/section>/i, "")
      .replace(/<div class="recent-goals-table-wrap">[\s\S]*?<\/section>/i, "")
      .replace(/<li(?![^>]*id="lg-latest-line")><b>#\d+:<\/b>[\s\S]*?<\/li>/gi, "");
    if (!written.includes('<li id="lg-latest-line"><b>#' + seniorGoals + ':</b>')) {
      throw new Error("DRIFT in " + lang + "/latest-goal.html: latest-goal line missing Goal #" + seniorGoals);
    }
    const staleProblems = [];
    const _prevList = [];
    for (let back = 1; back <= 5; back++) _prevList.push(String(seniorGoals - back));
    for (const pt of _prevList) {
      const re = new RegExp("(?<![\\d,])" + pt + "(?![\\d])", "g");
      const n = (guardZone.match(re) || []).length;
      if (n > 0) staleProblems.push(pt + " x" + n);
    }
    if (staleProblems.length) {
      throw new Error("DRIFT in " + lang + "/latest-goal.html: stale goal total " + staleProblems.join(", ") + " still present after sync");
    }

    updatedCount++;
    console.log(`  ✓ Synchronized ${lang}/latest-goal.html`);
  }

  console.log(`[sync-latest-goal-html] Successfully synchronized ${updatedCount} latest-goal HTML files to Goal #${seniorGoals} (${g.opponent})!`);
}

if (process.argv[1] && process.argv[1].endsWith("sync-latest-goal-html.mjs")) {
  syncLatestGoalHtml();
}
