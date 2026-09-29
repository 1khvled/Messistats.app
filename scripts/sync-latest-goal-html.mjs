/**
 * Autonomous Latest Goal HTML Synchronizer (scripts/sync-latest-goal-html.mjs)
 * 
 * Synchronizes latest-goal.html across all 9 languages directly from public/data/latest-goal.json
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

  const seniorGoals = g.goalNumber || totals.seniorGoals || 931;
  const apps = totals.appearances || 1177;
  const miamiGoals = totals.miamiGoals || 102;
  const seasonGoals = totals.season2026Goals || 25;
  const freeKicks = totals.freeKicks || 68;
  const goalsNeeded = 1000 - seniorGoals;

  const clubGoals = messiData?.totals?.club?.goals || 806;
  const intlGoals = messiData?.totals?.international?.goals || 125;

  const targetFiles = [
    { lang: "en", file: path.join(root, "latest-goal.html") },
    { lang: "es", file: path.join(root, "es", "latest-goal.html") },
    { lang: "pt", file: path.join(root, "pt", "latest-goal.html") },
    { lang: "fr", file: path.join(root, "fr", "latest-goal.html") },
    { lang: "ar", file: path.join(root, "ar", "latest-goal.html") },
    { lang: "bn", file: path.join(root, "bn", "latest-goal.html") },
    { lang: "hi", file: path.join(root, "hi", "latest-goal.html") },
    { lang: "ro", file: path.join(root, "ro", "latest-goal.html") },
    { lang: "uz", file: path.join(root, "uz", "latest-goal.html") }
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
    const badgeText = lang === "uz" ? `${seniorGoals}-gol` : (lang === "ar" ? `الهدف #${seniorGoals}` : (lang === "bn" ? `গোল #${seniorGoals}` : (lang === "hi" ? `गोल #${seniorGoals}` : (lang === "fr" ? `But #${seniorGoals}` : (lang === "es" || lang === "pt" ? `Gol #${seniorGoals}` : `Goal #${seniorGoals}`)))));
    html = html.replace(/<span id="active-goal-num"[^>]*>[^<]*<\/span>/i, `<span id="active-goal-num" class="goal-number-badge">${badgeText}</span>`);

    // 3. Update Active Goal Title & Meta
    const matchTitleText = lang === "es" ? `Gol #${seniorGoals}: ${g.title}` : (lang === "pt" ? `Gol #${seniorGoals}: ${g.title}` : (lang === "fr" ? `But #${seniorGoals}: ${g.title}` : `Goal #${seniorGoals} Match Highlights: ${g.title}`));
    html = html.replace(/<h2 id="active-goal-title"[^>]*>[^<]*<\/h2>/i, `<h2 id="active-goal-title" class="latest-goal-match-title">${matchTitleText}</h2>`);

    const metaLineText = `${g.competition} • ${g.formattedDate} • ${g.venue}`;
    html = html.replace(/<p id="active-goal-meta"[^>]*>[^<]*<\/p>/i, `<p id="active-goal-meta" class="latest-goal-meta-line">${metaLineText}</p>`);

    // 4. Update Stat Boxes
    html = html.replace(/<span id="stat-minute"[^>]*>[^<]*<\/span>/i, `<span id="stat-minute" class="goal-stat-val tnum">${g.minute}</span>`);
    html = html.replace(/<span id="stat-type"[^>]*>[^<]*<\/span>/i, `<span id="stat-type" class="goal-stat-val">${g.finish || "Direct Free Kick"}</span>`);
    html = html.replace(/<span id="stat-score"[^>]*>[^<]*<\/span>/i, `<span id="stat-score" class="goal-stat-val tnum">${g.score}</span>`);
    html = html.replace(/<span id="stat-comp"[^>]*>[^<]*<\/span>/i, `<span id="stat-comp" class="goal-stat-val">${g.competition}</span>`);

    // 5. Update Action Bar (YouTube search + Birthday link)
    html = html.replace(/href="https:\/\/www\.youtube\.com\/results\?search_query=[^"]*"/i, `href="${g.youtubeUrl}"`);
    const bdayHref = lang === "en" ? `/en/birthday/${g.bdayKey}` : `/${lang}/birthday/${g.bdayKey}`;
    html = html.replace(/id="link-bday-goal"[^>]*href="[^"]*"/i, `id="link-bday-goal" href="${bdayHref}"`);

    // 6. Update Recent Goals 5-Card Switcher
    const cardsHtml = recent.slice(0, 5).map((rg, idx) => {
      const isActive = idx === 0 ? " active" : "";
      const goalLabel = lang === "uz" ? `${rg.goalNumber}-gol` : (lang === "ar" ? `الهدف #${rg.goalNumber}` : (lang === "fr" ? `But #${rg.goalNumber}` : (lang === "es" || lang === "pt" ? `Gol #${rg.goalNumber}` : `Goal #${rg.goalNumber}`)));
      const bdayPath = lang === "en" ? (rg.bdayUrl || `/en/birthday/${rg.bdayKey}`) : `/${lang}/birthday/${rg.bdayKey || "09-27"}`;
      return `    <div class="recent-goal-card${isActive}" data-goal-id="${rg.goalNumber}"
         data-goal-num="${goalLabel}"
         data-title="${rg.title}"
         data-meta="${rg.meta}"
         data-minute="${rg.minute}"
         data-type="${rg.type}"
         data-score="${rg.score}"
         data-comp="${rg.comp}"
         data-video-url="${rg.videoUrl}"
         data-yt-url="${rg.ytUrl}"
         data-bday-url="${bdayPath}">
      <div class="recent-goal-card-top">
        <span class="recent-goal-card-num">${goalLabel}</span>
        <svg class="recent-goal-play-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
      </div>
      <div class="recent-goal-card-match">${rg.match}</div>
      <div class="recent-goal-card-date">${rg.date}</div>
      <span class="recent-goal-card-tag">${rg.tag || "Goal 🔥"}</span>
    </div>`;
    }).join("\n\n");

    html = html.replace(/<div class="recent-goals-grid">[\s\S]*?<\/div>\s*<\/section>/i, `<div class="recent-goals-grid">\n${cardsHtml}\n  </div>\n</section>`);

    // 7. Update Comparison Matrix Table
    const tableRows = [
      `      <tr>
        <td><span class="table-goal-badge">#931</span></td>
        <td class="tnum">27 Sep 2026</td>
        <td><b>Columbus Crew (1–2)</b></td>
        <td>MLS</td>
        <td class="tnum"><b>33'</b></td>
        <td>Direct Free Kick</td>
        <td><a href="https://cdn.messiallgoals.com/Goal931.mp4" target="_blank" rel="noopener noreferrer" class="table-play-link">Play Video ▶</a></td>
      </tr>`,
      `      <tr>
        <td><span class="table-goal-badge">#930</span></td>
        <td class="tnum">20 Sep 2026</td>
        <td><b>San Diego FC (2–2)</b></td>
        <td>MLS</td>
        <td class="tnum"><b>24'</b></td>
        <td>Direct Free Kick</td>
        <td><a href="https://cdn.messiallgoals.com/Goal930.mp4" target="_blank" rel="noopener noreferrer" class="table-play-link">Play Video ▶</a></td>
      </tr>`,
      `      <tr>
        <td><span class="table-goal-badge">#929</span></td>
        <td class="tnum">17 Sep 2026</td>
        <td><b>Cruz Azul (2–0)</b></td>
        <td>Campeones Cup</td>
        <td class="tnum"><b>12'</b></td>
        <td>Header (Assist: Suárez)</td>
        <td><a href="https://cdn.messiallgoals.com/Goal929.mp4" target="_blank" rel="noopener noreferrer" class="table-play-link">Play Video ▶</a></td>
      </tr>`,
      `      <tr>
        <td><span class="table-goal-badge">#928</span></td>
        <td class="tnum">12 Sep 2026</td>
        <td><b>Nashville SC (2–2)</b></td>
        <td>MLS</td>
        <td class="tnum"><b>67'</b></td>
        <td>Left Foot Strike</td>
        <td><a href="https://cdn.messiallgoals.com/Goal928.mp4" target="_blank" rel="noopener noreferrer" class="table-play-link">Play Video ▶</a></td>
      </tr>`,
      `      <tr>
        <td><span class="table-goal-badge">#927</span></td>
        <td class="tnum">29 Aug 2026</td>
        <td><b>CF Montréal (7–1)</b></td>
        <td>MLS</td>
        <td class="tnum"><b>83'</b></td>
        <td>Direct Free Kick</td>
        <td><a href="https://cdn.messiallgoals.com/Goal927.mp4" target="_blank" rel="noopener noreferrer" class="table-play-link">Play Video ▶</a></td>
      </tr>`
    ].join("\n\n");

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

    // 9. Update Open Graph & Twitter Video Tags
    html = html.replace(/<meta property="og:video" content="[^"]*"/i, `<meta property="og:video" content="${g.videoUrl}"`);
    html = html.replace(/<meta property="og:video:secure_url" content="[^"]*"/i, `<meta property="og:video:secure_url" content="${g.videoUrl}"`);
    html = html.replace(/<meta name="twitter:player:stream" content="[^"]*"/i, `<meta name="twitter:player:stream" content="${g.videoUrl}"`);

    // 10. Update VideoObject Schema JSON-LD
    html = html.replace(/"contentUrl":\s*"https:\/\/cdn\.messiallgoals\.com\/Goal[0-9]+\.mp4"/g, `"contentUrl": "${g.videoUrl}"`);
    html = html.replace(/"embedUrl":\s*"https:\/\/cdn\.messiallgoals\.com\/Goal[0-9]+\.mp4"/g, `"embedUrl": "${g.videoUrl}"`);

    // 11. Narrative & FAQ updates for Columbus Crew
    html = html.replace(/against San Diego FC in MLS at Chase Stadium/gi, `against ${g.opponent} in ${g.competition} at ${g.venue}`);
    html = html.replace(/contra San Diego FC en MLS en Chase Stadium/gi, `contra ${g.opponent} en ${g.competition} en ${g.venue}`);
    html = html.replace(/contra o San Diego FC na MLS/gi, `contra o ${g.opponent} na ${g.competition}`);
    html = html.replace(/contre San Diego FC en MLS/gi, `contre ${g.opponent} en ${g.competition}`);

    html = html.replace(/20 September 2026 at Chase Stadium in Fort Lauderdale against San Diego FC \(2–2\) in MLS/gi, `${g.formattedDate} at ${g.venue} against ${g.opponent} (${g.score}) in ${g.competition}`);
    html = html.replace(/20 de septiembre de 2026 en Chase Stadium en Fort Lauderdale contra San Diego FC \(2–2\) en MLS/gi, `${g.formattedDate} en ${g.venue} contra ${g.opponent} (${g.score}) en ${g.competition}`);
    html = html.replace(/20 de setembro de 2026 no estádio Chase Stadium em Fort Lauderdale contra o San Diego FC \(2-2\) na MLS/gi, `${g.formattedDate} no estádio ${g.venue} contra ${g.opponent} (${g.score}) na ${g.competition}`);

    // Update today-status card
    html = html.replace(/<span>Latest Match Result:[^<]*<\/span>/i, `<span>Latest Match Result: ${g.title}</span>`);
    html = html.replace(/<span>Último Resultado:[^<]*<\/span>/i, `<span>Último Resultado: ${g.title}</span>`);
    html = html.replace(/<span>Résultat du dernier match :[^<]*<\/span>/i, `<span>Résultat du dernier match : ${g.title}</span>`);

    html = html.replace(/<span class="badge badge-video">[^<]*<\/span>/i, `<span class="badge badge-video">${badgeText} (${g.minute})</span>`);

    fs.writeFileSync(file, html, "utf8");
    updatedCount++;
    console.log(`  ✓ Synchronized ${lang}/latest-goal.html`);
  }

  console.log(`[sync-latest-goal-html] Successfully synchronized ${updatedCount} latest-goal HTML files to Goal #${seniorGoals} (${g.opponent})!`);
}

if (process.argv[1] && process.argv[1].endsWith("sync-latest-goal-html.mjs")) {
  syncLatestGoalHtml();
}
