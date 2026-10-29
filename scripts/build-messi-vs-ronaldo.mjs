import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { S } from "./stats.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const LANGS = ["en", "es", "pt", "fr"];

// Rivalry splits: single source of truth is public/data/messi-data.json
// (splits block, verified). Embedded fallback keeps builds working offline.
let SPLITS = null;
try {
  const _md = JSON.parse(fs.readFileSync(path.join(rootDir, "public", "data", "messi-data.json"), "utf8"));
  if (_md && _md.splits) SPLITS = _md.splits;
} catch (e) { void e; }
SPLITS = SPLITS || { worldCup: { messi: { goals: 21, assists: 12 }, ronaldo: { goals: 11, assists: 2 } }, trophies: { messi: 47, ronaldo: 37 } };

  // The penalty line and the big-chances line: one source each.
  //
  // The conversion rate and both leads are computed from the cells beside
  // them, so a daily stats update can never leave a stale figure behind, and
  // a number that means one thing here can never be mistaken for another.
  const PEN = { messiGoals: 110, messiAttempts: 141, ronaldoGoals: 184, ronaldoAttempts: 221 };
  const BIG_CHANCES = { messi: 430, ronaldo: 210 };
  const PEN_PCT = (goals, attempts) => (goals / attempts) * 100;
  // the rate as it is shown: rounded once, so the cell, the sentence and
  // the lead between the two cannot disagree over a rounding step
  const PCT_NUM = (goals, attempts) => Math.round((goals / attempts) * 1000) / 10;
  const PCT = (v, sep) => v.toFixed(1).replace(".", sep || ".");
  // the decimal separator each language writes a percentage with
  const PCT_SEP = { en: ".", es: ",", pt: ",", fr: "," };
function getHreflangs(lang, slug) {
  return [
    `  <link rel="canonical" href="https://www.messistat.com/${lang}/${slug}"/>`,
    `  <link rel="alternate" hreflang="en" href="https://www.messistat.com/en/${slug}"/>`,
    `  <link rel="alternate" hreflang="en-US" href="https://www.messistat.com/en/${slug}"/>`,
    `  <link rel="alternate" hreflang="en-NG" href="https://www.messistat.com/en/${slug}"/>`,
    `  <link rel="alternate" hreflang="en-IN" href="https://www.messistat.com/en/${slug}"/>`,
    `  <link rel="alternate" hreflang="en-PH" href="https://www.messistat.com/en/${slug}"/>`,
    `  <link rel="alternate" hreflang="es" href="https://www.messistat.com/es/${slug}"/>`,
    `  <link rel="alternate" hreflang="es-AR" href="https://www.messistat.com/es/${slug}"/>`,
    `  <link rel="alternate" hreflang="es-ES" href="https://www.messistat.com/es/${slug}"/>`,
    `  <link rel="alternate" hreflang="pt" href="https://www.messistat.com/pt/${slug}"/>`,
    `  <link rel="alternate" hreflang="pt-BR" href="https://www.messistat.com/pt/${slug}"/>`,
    `  <link rel="alternate" hreflang="pt-PT" href="https://www.messistat.com/pt/${slug}"/>`,
    `  <link rel="alternate" hreflang="fr" href="https://www.messistat.com/fr/${slug}"/>`,
    `  <link rel="alternate" hreflang="fr-FR" href="https://www.messistat.com/fr/${slug}"/>`,
    `  <link rel="alternate" hreflang="fr-NE" href="https://www.messistat.com/fr/${slug}"/>`,
    `  <link rel="alternate" hreflang="x-default" href="https://www.messistat.com/en/${slug}"/>`
  ].join("\n");
}

const POLL_I18N = {
  en: {
    badge: "⚔️ LIVE FAN POLL",
    title: "Who is the Greatest of All Time (GOAT)?",
    sub: "Cast your vote below and see real-time global fan percentages:",
    messiName: "Lionel Messi",
    messiDesc: "932 Goals · 47 Trophies · 8 Ballons d'Or · World Cup Champion",
    ronaldoName: "Cristiano Ronaldo",
    ronaldoDesc: "981 Goals · 37 Trophies · 5 Ballons d'Or · All-Time UCL Top Scorer",
    votedMsg: "✓ Your vote has been recorded! Global community results:",
    totalVotes: "votes cast worldwide",
    shareVote: "Share Your Vote",
    votePrefix: "Vote for ",
    messiBadge: "🐐 THE PLAYMAKER GOAT",
    ronaldoBadge: "⚡ THE RECORD GOALSCORER",
    messiCta: "Vote Messi →",
    ronaldoCta: "Vote Ronaldo →"
  },
  es: {
    badge: "⚔️ ENCUESTA GLOBAL EN VIVO",
    title: "¿Quién es el mejor de todos los tiempos (GOAT)?",
    sub: "Vota a continuación y descubre los porcentajes en tiempo real:",
    messiName: "Lionel Messi",
    messiDesc: "932 Goles · 47 Títulos · 8 Balones de Oro · Campeón del Mundo",
    ronaldoName: "Cristiano Ronaldo",
    ronaldoDesc: "981 Goles · 37 Títulos · 5 Balones de Oro · Máximo Goleador Histórico UCL",
    votedMsg: "✓ ¡Tu voto ha sido registrado! Resultados globales:",
    totalVotes: "votos registrados en todo el mundo",
    shareVote: "Compartir tu voto",
    votePrefix: "Votar por ",
    messiBadge: "🐐 EL GOAT CREADOR DE JUEGO",
    ronaldoBadge: "⚡ EL GOLEADOR RÉCORD",
    messiCta: "Votar por Messi →",
    ronaldoCta: "Votar por Ronaldo →"
  },
  pt: {
    badge: "⚔️ ENQUETE GLOBAL AO VIVO",
    title: "Quem é o Maior de Todos os Tempos (GOAT)?",
    sub: "Vote abaixo e veja as porcentagens globais em tempo real:",
    messiName: "Lionel Messi",
    messiDesc: "932 Gols · 47 Títulos · 8 Bolas de Ouro · Campeão da Copa do Mundo",
    ronaldoName: "Cristiano Ronaldo",
    ronaldoDesc: "981 Gols · 37 Títulos · 5 Bolas de Ouro · Maior Artilheiro da UCL",
    votedMsg: "✓ Seu voto foi registrado! Resultados da comunidade:",
    totalVotes: "votos no mundo todo",
    shareVote: "Compartilhar Voto",
    votePrefix: "Votar em ",
    messiBadge: "🐐 O MAESTRO GOAT",
    ronaldoBadge: "⚡ O ARTILHEIRO RECORDE",
    messiCta: "Votar no Messi →",
    ronaldoCta: "Votar no Ronaldo →"
  },
  fr: {
    badge: "⚔️ SONDAGE MONDIAL EN DIRECT",
    title: "Qui est le meilleur joueur de tous les temps (GOAT) ?",
    sub: "Votez ci-dessous et découvrez les résultats en temps réel :",
    messiName: "Lionel Messi",
    messiDesc: "932 Buts · 47 Trophées · 8 Ballons d'Or · Champion du Monde",
    ronaldoName: "Cristiano Ronaldo",
    ronaldoDesc: "981 Buts · 37 Trophées · 5 Ballons d'Or · Meilleur Buteur Histoire UCL",
    votedMsg: "✓ Votre vote a été enregistré ! Résultats de la communauté :",
    totalVotes: "votes à travers le monde",
    shareVote: "Partager votre vote",
    votePrefix: "Voter pour ",
    messiBadge: "🐐 LE GOAT MENEUR DE JEU",
    ronaldoBadge: "⚡ LE BUTEUR RECORD",
    messiCta: "Voter pour Messi →",
    ronaldoCta: "Voter pour Ronaldo →"
  }
};

const I18N = {
  en: {
    dir: "ltr",
    title: "Messi vs Ronaldo | MessiStats",
    desc: "Lionel Messi vs Cristiano Ronaldo: 932 goals vs 981, 407+ assists vs 261, 822 non-penalty goals vs 796, 76 free kicks vs 64, 47 trophies vs 37, 8 Ballons d'Or vs 5. The definitive comparison.",
    keywords: "messi vs ronaldo, messi vs ronaldo stats, messi vs ronaldo free kicks, messi vs ronaldo penalties, messi vs ronaldo non penalty goals, messi vs ronaldo assists, messi vs ronaldo hat tricks, messi vs ronaldo all time goals, who is the goat messi or ronaldo, who has more goals messi or ronaldo, messi vs ronaldo head to head, messi vs ronaldo world cup, messi ronaldo trophies, messi ronaldo ballons d or",
    brand: "MessiStat",
    homeName: "Home",
    latestGoalName: "Latest Goal",
    bdayName: "Birthday Goals",
    vsRonaldoName: "vs Ronaldo",
    vsRealMadridName: "vs Real Madrid",
    uclName: "UCL Hub",
    goalsByYearName: "Goals by Year",
    goalsBySeasonName: "Goals by Season",
    dashboardName: "Dashboard",
    timelineName: "Through the Years",
    achievementsName: "Achievements",
    skipText: "Skip to content",
    eyebrow: "The Ultimate Rivalry <i></i> <span>Head-to-Head & Complete Career Comparison</span>",
    h1: "Messi vs Ronaldo",
    lead: "The definitive statistical comparison between the two greatest icons of modern football. All-time goals, non-penalty goals, free kicks, penalties, assists, trophies, individual accolades, and all 36 direct matches.",
    verdictBadge: "THE GOAT VERDICT • COMPLETE OFFICIAL TOTALS",
    verdictTitle: "Who has better all-time career statistics: Messi or Ronaldo?",
    verdictText: "Across all official senior matches, <b>Lionel Messi has scored 932 goals and provided 407+ assists in 1,178 appearances</b> (1.14 goal contributions per match), while <b>Cristiano Ronaldo holds the all-time goalscoring record with 981 goals and provided 261 assists in 1,342 appearances</b> (0.93 contributions per match). While Ronaldo leads the all-time goal tally (<b>981 vs 932</b>), Messi reached 932 goals in <b>161 fewer matches</b> with a higher scoring ratio (<b>0.79 vs 0.73</b>), leads in <b>non-penalty goals (822 vs 796)</b> and assists (<b>407+ vs 261</b>), won the <b>FIFA World Cup (2022)</b> with two Golden Balls, and leads in <b>Ballons d'Or (8 vs 5)</b> and <b>team trophies (47 vs 37)</b>.",
    tableStat: "Statistic",
    tableLeader: "Leader",
    coreHeader: "All-Time Senior Career Totals",
    coreIntro: "Verified official senior career figures across club competitions and senior national teams.",
    statGoals: "Senior Career Goals",
    statApps: "Senior Career Appearances",
    statRatio: "Goals per Match (Ratio)",
    statAssists: "Career Assists",
    statGoalContrib: "Goal Contributions (Goals + Assists)",
    statContribRatio: "Goal Contributions per Match",
    statMinsContrib: "Minutes per Goal Contribution",
    statTrophies: "Total Team Trophies",
    statBallons: "Ballon d'Or Awards",
    statGoldenShoes: "European Golden Shoes",
    statWorldCup: "FIFA World Cup",
    statH2HWins: "Direct Head-to-Head Wins",
    scoringHeader: "Scoring Mechanics: Free Kicks, Penalties & Non-Penalty Goals",
    scoringIntro: "Deep breakdown of how both players scored their goals — highlighting open-play efficiency, set pieces, and range.",
    statNPG: "Non-Penalty Goals",
    statNPGRatio: "Non-Penalty Goals per Match",
    statFreeKicks: "Direct Free-Kick Goals",
    statPenalties: "Penalties Scored (Attempts)",
    statPenConversion: "Penalty Conversion Rate",
    statHatTricks: "Career Hat-Tricks",
    statPokers: "4+ Goal Matches (Pokers)",
    stat5Goals: "5-Goal Matches in a Game",
    statOutsideBox: "Goals from Outside Penalty Box",
    statOpenPlay: "Open-Play Goals",
    playmakingHeader: "Playmaking, Creativity & Offensive Influence",
    playmakingIntro: "Assists, playmaking dominance, and overall match influence beyond pure finishing.",
    statAllAssists: "Total Career Assists",
    statClubAssists: "Club Career Assists",
    statIntAssists: "International Assists",
    statBigChances: "Big Chances Created (Tracked Era)",
    intlHeader: "International & Tournament Finals Dominance",
    intlIntro: "Record on football's biggest stages — FIFA World Cup, continental championships, and cup finals.",
    statWCTitles: "World Cup Titles",
    statWCGoldenBall: "World Cup Golden Balls (Best Player)",
    statWCGoals: "World Cup Goals",
    statWCAssists: "World Cup Assists",
    statWCKO: "World Cup Knockout Stage Goals",
    statWCKOAssists: "World Cup Knockout Stage Assists",
    statContTitles: "Continental Championships",
    statFinalsGoals: "Goals Scored in Cup Finals",
    h2hHeader: "36 Direct Head-to-Head Encounters",
    h2hIntro: "Every single time Lionel Messi and Cristiano Ronaldo faced each other on the pitch.",
    kpiMessiWins: "Messi Wins",
    kpiDraws: "Draws",
    kpiRonaldoWins: "Ronaldo Wins",
    kpiGoalsScored: "Goals Scored",
    kpiEqualMatches: "Equal Matches",
    compClasico: "El Clásico (Real Madrid vs Barcelona)",
    compUCL: "UEFA Champions League",
    compIntl: "International Friendlies",
    bdayTitle: "Did Lionel Messi score on Cristiano Ronaldo's birthday?",
    bdayDesc: "Cristiano Ronaldo was born on 5 February. See what Messi did on 5 February and explore goals on your own birthday!",
    bdayBtn: "Check 5 February ⚽",
    supportAria: "Support MessiStats",
    supportTitle: "Support MessiStats",
    supportText: "MessiStats is an independent project dedicated to tracking all 932+ career goals and video replays with zero paywalls. If you enjoy using this site, consider supporting us on Ko-fi or donating with crypto to help cover hosting and video CDN costs!",
    supportCta: "💖 Support on Ko-fi",
    cryptoLabel: "Direct Wallet Donation (USDT / BNB / ETH / BUSD):",
    copyBtn: "Copy 📋",
    copiedMsg: "✓ Copied!",
    brandSub: "The Verified Lionel Messi Statistics & Video Database",
    logoAlt: "MessiStat Logo",
    showdownAlt: "Lionel Messi and Cristiano Ronaldo facing each other on the pitch",
    showdownBadge: "⚔️ 36 DIRECT HEAD-TO-HEAD MATCHES · 13 BALLONS D'OR COMBINED",
    tocAria: "Comparison Sections",
    verdictAria: "GOAT Verdict Summary",
    siteDirAria: "Site directory",
    closeAdAria: "Close advertisement",
    faqHeader: "Frequently Asked Questions: Messi vs Ronaldo",
    exploreTitle: "Explore the full statistics",
    footerDir: "Career Records & Rivalries",
    footerIntl: "International Editions / Idiomas",
    crestNote: "Club crests are trademarks of their respective clubs, shown for identification purposes.",
    badgeRonaldoGoals: "Ronaldo (+48 goals, All-Time Record)",
    badgeMessiNPG: "Messi (+26 NPG)",
    badgeMessiFK: "Messi (+12 free kicks)",
    badgeRonaldoPen: "Ronaldo (+74 penalties)",
    badgeMessiAssists: "Messi (+146 assists)",
    badgeRonaldoHT: "Ronaldo (+4 hat-tricks)",
    badgeMessiWC: "Messi (Champion, 2x Golden Ball)",
    badgeMessiTrophies: "Messi (+10 trophies, World Record)",
    badgeMessiBallon: "Messi (+3 Ballons d'Or, World Record)",
    badgeMessiH2H: "Messi (+5 wins, 16 vs 11)",
    badgeMessiFinals: "Messi (+13 goals in finals)",
        thCompetition: "Competition",
    thMatches: "Matches",
    thMessiWins: "Messi Wins",
    thDraws: "Draws",
    thRonaldoWins: "Ronaldo Wins",
    thMessiGoals: "Messi Goals",
    thRonaldoGoals: "Ronaldo Goals",
    tableTotal: "Total",
    badge16Wins: "16 Wins",
    badge11Wins: "11 Wins",
    tied2All: "Tied (2 all)",
    badgeMessiRecord: "Messi (Record)",
    wcKOStageMessi: "Messi (+6)",
    goalsKnockoutMessi: "7 Goals",
    goalsKnockoutRonaldo: "1 Goal",
    assistsKnockoutMessi: "10 Assists",
    assistsKnockoutRonaldo: "0 Assists",
    finalsRecordMessi: "36 Goals in 52 Finals",
    finalsRecordRonaldo: "23 Goals in 40 Finals",
    continentalMessi: "3 (2 Copas América, 1 Finalissima)",
    continentalRonaldo: "3 (1 Euro, 2 Nations Leagues)",
    contTie: "Tie 3–3",
    adLabel: "Advertisement",
    showdownCaption: `<strong>The Eternal Duel:</strong> Lionel Messi &amp; Cristiano Ronaldo — Two football titans whose era-defining rivalry redefined world sports history across 36 direct clashes.`,
    bdayPromoBadge: "🎂 UNIQUE INTERACTIVE TOOL",
    bdayPromoAria: "Did Messi score on your birthday?",
    jumpCore: "All-Time Totals",
    jumpScoring: "Free Kicks & Penalties",
    jumpPlaymaking: "Assists & Creation",
    jumpIntl: "World Cup & Finals",
    jumpH2H: "36 Direct Matches",
    jumpFaq: "Frequently Asked Questions",
    faqs: [
      {
        q: "Who has more total career goals: Messi or Ronaldo?",
        a: "Cristiano Ronaldo holds the all-time world record with 981 official senior career goals in 1,342 appearances (0.73 goals per match), while Lionel Messi has scored 932 goals in 1,178 appearances (0.79 goals per match). Ronaldo leads by 48 goals, though Messi has played 161 fewer matches and maintains a higher scoring ratio."
      },
      {
        q: "Who has more non-penalty goals: Messi or Ronaldo?",
        a: "Lionel Messi has scored 822 non-penalty goals in 1,178 matches (0.70 non-penalty goals per game). Cristiano Ronaldo has scored 796 non-penalty goals in 1,342 matches (0.59 per game). Messi leads Ronaldo by 26 non-penalty goals despite playing 161 fewer career games."
      },
      {
        q: "Who has scored more free kicks: Messi or Ronaldo?",
        a: "Lionel Messi leads Cristiano Ronaldo with 76 direct free-kick goals to Ronaldo's 64. Messi has scored 50 for Barcelona, 12 for Argentina, 12 for Inter Miami, and 2 for PSG. Ronaldo has scored 33 for Real Madrid, 14 for Manchester United, 11 for Portugal, 5 for Al-Nassr, and 1 for Juventus."
      },
      {
        q: "Who has more career assists: Messi or Ronaldo?",
        a: "Lionel Messi leads Cristiano Ronaldo by 146 assists. Messi has recorded over 407 official senior assists (349 in club football and 58 for Argentina), making him the all-time assist leader in modern football history. Ronaldo has recorded 261 career assists."
      },
      {
        q: "Who has scored more penalties and what are their conversion rates?",
        a: `Cristiano Ronaldo has scored ${PEN.ronaldoGoals} penalties from ${PEN.ronaldoAttempts} attempts (an ${PCT(PCT_NUM(PEN.ronaldoGoals, PEN.ronaldoAttempts), PCT_SEP.en)}% conversion rate). Lionel Messi has scored 110 penalties from 141 attempts (a 78.0% conversion rate). Ronaldo has scored ${PEN.ronaldoGoals - PEN.messiGoals} more penalties than Messi.`
      },
      {
        q: "Who has more career hat-tricks: Messi or Ronaldo?",
        a: "Cristiano Ronaldo has scored 66 career hat-tricks (56 in club football, 10 for Portugal). Lionel Messi has scored 62 career hat-tricks (48 for Barcelona, 11 for Argentina, 3 for Inter Miami). Ronaldo leads by 4 hat-tricks."
      },
      {
        q: "Who performed better in the FIFA World Cup: Messi or Ronaldo?",
        a: "Lionel Messi won the 2022 FIFA World Cup with Argentina, becoming the only player in history to win two FIFA World Cup Golden Balls (2014, 2022). In World Cup history, Messi has 21 goals and 12 assists in 34 games, including 7 goals in knockout rounds. Ronaldo has 11 goals and 2 assists across six World Cups, including his first knockout goal (against Croatia in 2026)."
      },
      {
        q: "Who won more direct head-to-head matches between Messi and Ronaldo?",
        a: "In 36 official direct matches played between them, Messi's teams won 16, Ronaldo's teams won 11, and 9 ended in draws. Messi scored 22 goals in these matches; Ronaldo scored 21."
      },
      {
        q: "Who has won more trophies and Ballons d'Or?",
        a: "Lionel Messi holds the all-time world record with 47 senior team titles (including 10 La Ligas, 4 Champions Leagues, 2 Copas América, and 1 World Cup) compared to Ronaldo's 37 titles. Messi also holds the all-time record with 8 Ballons d'Or compared to Ronaldo's 5."
      },
      {
        q: "Why do most statistical analysts consider Messi the GOAT over Ronaldo?",
        a: "Statistical models favor Messi because of his dual dominance as both the world's elite goalscorer and its premier playmaker. Messi has a superior goal ratio (0.79 vs 0.73), more non-penalty goals (822 vs 796 in 161 fewer games), 146 more assists, superior minutes-per-goal involvement (72 min vs 88 min), and unparalleled international success crowned by the 2022 World Cup."
      }
    ]
  },
  es: {
    dir: "ltr",
    title: "Messi vs Ronaldo: Goles, Stats y ¿Quién Es Mejor? | MessiStats",
    desc: "Messi vs Ronaldo: 932 vs 981 goles, tiros libres, penaltis, asistencias y títulos. ¿Quién es mejor? Comparativa 2026 cara a cara.",
    keywords: "messi vs ronaldo, messi vs ronaldo estadisticas, messi vs ronaldo tiros libres, messi vs ronaldo penales, messi vs ronaldo goles sin penal, messi vs ronaldo asistencias, messi vs ronaldo hat tricks, quien es mejor messi o ronaldo, quien tiene mas goles messi o ronaldo, messi vs ronaldo cara a cara, messi vs ronaldo mundiales, messi ronaldo titulos, balones de oro",
    brand: "MessiStats",
    homeName: "Inicio",
    latestGoalName: "Último Gol",
    bdayName: "Cumpleaños",
    vsRonaldoName: "vs Ronaldo",
    vsRealMadridName: "vs Real Madrid",
    uclName: "Champions League",
    goalsByYearName: "Goles por año",
    goalsBySeasonName: "Goles por temporada",
    dashboardName: "Panel de control",
    timelineName: "Cronología",
    achievementsName: "Palmarés y Títulos",
    skipText: "Saltar al contenido",
    eyebrow: "La Mayor Rivalidad <i></i> <span>Comparativa Completa y Cara a Cara</span>",
    h1: "Lionel Messi vs Cristiano Ronaldo",
    lead: "La comparativa estadística definitiva entre los dos máximos iconos del fútbol moderno. Goles totales, goles sin penalti, tiros libres, penaltis, asistencias, títulos, galardones individuales y los 36 enfrentamientos directos.",
    verdictBadge: "EL VEREDICTO GOAT • CIFRAS OFICIALES COMPLETAS",
    verdictTitle: "¿Quién tiene mejores estadísticas históricas: Messi o Ronaldo?",
    verdictText: "En todos los partidos oficiales senior, <b>Lionel Messi ha marcado 932 goles y ha dado más de 407 asistencias en 1.178 partidos</b> (1,12 contribuciones de gol por partido), mientras que <b>Cristiano Ronaldo es el máximo goleador histórico con 981 goles y 261 asistencias en 1.342 partidos</b> (0,93 contribuciones por partido). Aunque Ronaldo lidera el total histórico de goles (<b>981 vs 932</b>), Messi llegó a 932 en <b>161 partidos menos</b> con mejor promedio (<b>0,79 vs 0,73</b>), lidera en <b>goles sin penalti (822 vs 796)</b> y asistencias (<b>407+ vs 261</b>), ganó la <b>Copa del Mundo FIFA (2022)</b> con dos Balones de Oro, y supera a Ronaldo en <b>Balones de Oro (8 vs 5)</b> y <b>títulos oficiales (47 vs 37)</b>.",
    tableStat: "Estadística",
    tableLeader: "Líder",
    coreHeader: "Totales de Carrera Senior Oficial",
    coreIntro: "Cifras oficiales verificadas en competiciones de clubes y selecciones absolutas.",
    statGoals: "Goles Oficiales en Carrera Senior",
    statApps: "Partidos Disputados",
    statRatio: "Promedio de Gol por Partido",
    statAssists: "Asistencias Oficiales",
    statGoalContrib: "Contribuciones de Gol (Goles + Asistencias)",
    statContribRatio: "Contribución de Gol por Partido",
    statMinsContrib: "Minutos por Contribución de Gol",
    statTrophies: "Títulos Oficiales de Equipo",
    statBallons: "Balones de Oro",
    statGoldenShoes: "Botas de Oro Europeas",
    statWorldCup: "Copa del Mundo FIFA",
    statH2HWins: "Victorias en Duelos Directos",
    scoringHeader: "Desglose de Goles: Tiros Libres, Penaltis y Goles en Juego",
    scoringIntro: "Análisis pormenorizado del tipo de goles de cada jugador, efectividad en jugada y balón parado.",
    statNPG: "Goles Sin Penalti (NPG)",
    statNPGRatio: "Promedio de Gol Sin Penalti",
    statFreeKicks: "Goles de Tiro Libre Directo",
    statPenalties: "Goles de Penalti (Intentos)",
    statPenConversion: "Efectividad desde el Punto Penal",
    statHatTricks: "Hat-Tricks en su Carrera",
    statPokers: "Partidos de 4 Goles (Pókers)",
    stat5Goals: "Partidos de 5 Goles (Repókers)",
    statOutsideBox: "Goles desde Fuera del Área",
    statOpenPlay: "Goles en Jugada Abierta",
    playmakingHeader: "Creación de Juego, Asistencias e Influencia",
    playmakingIntro: "Asistencias, pases clave y generación ofensiva más allá de la finalización.",
    statAllAssists: "Asistencias Totales de Carrera",
    statClubAssists: "Asistencias en Clubes",
    statIntAssists: "Asistencias en Selección",
    statBigChances: "Grandes Ocasiones Creadas",
    intlHeader: "Selecciones Nacionales y Finales de Torneo",
    intlIntro: "Rendimiento en los escenarios más determinantes: Mundiales, torneos continentales y finales.",
    statWCTitles: "Títulos de Copa del Mundo",
    statWCGoldenBall: "Balones de Oro del Mundial (Mejor Jugador)",
    statWCGoals: "Goles en Copas del Mundo",
    statWCAssists: "Asistencias en Copas del Mundo",
    statWCKO: "Goles en Rondas Eliminatorias de Mundiales",
    statWCKOAssists: "Asistencias en Rondas Eliminatorias",
    statContTitles: "Títulos Continentales de Selección",
    statFinalsGoals: "Goles Marcados en Finales de Copa",
    h2hHeader: "Los 36 Enfrentamientos Directos",
    h2hIntro: "Registro completo de cada uno de los 36 partidos en que se midieron en el campo.",
    kpiMessiWins: "Victorias Messi",
    kpiDraws: "Empates",
    kpiRonaldoWins: "Victorias Ronaldo",
    kpiGoalsScored: "Goles Marcados",
    kpiEqualMatches: "Partidos Igualados",
    compClasico: "El Clásico (Barcelona vs Real Madrid)",
    compUCL: "UEFA Champions League",
    compIntl: "Amistosos Internacionales",
    bdayTitle: "¿Marcó Messi el día del cumpleaños de Cristiano Ronaldo?",
    bdayDesc: "Cristiano Ronaldo nació el 5 de febrero. ¡Mira qué hizo Messi el 5 de febrero y busca también tu propio cumpleaños!",
    bdayBtn: "Comprobar 5 de febrero ⚽",
    supportAria: "Apoyar a MessiStats",
    supportTitle: "Apoyar a MessiStats",
    supportText: "MessiStats es un proyecto independiente dedicado a registrar los más de 932 goles de su carrera con videos y sin muros de pago. Si te gusta este sitio, apóyanos en Ko-fi o dona con cripto para cubrir el hosting y los videos.",
    supportCta: "💖 Apoyar en Ko-fi",
    cryptoLabel: "Donación directa (USDT / BNB / ETH / BUSD):",
    copyBtn: "Copiar 📋",
    copiedMsg: "✓ ¡Copiado!",
    brandSub: "La Base de Datos Verificada de Estadísticas y Videos de Lionel Messi",
    logoAlt: "Logotipo de MessiStats",
    showdownAlt: "Lionel Messi y Cristiano Ronaldo frente a frente en el campo",
    showdownBadge: "⚔️ 36 DUELOS DIRECTOS · 13 BALONES DE ORO COMBINADOS",
    tocAria: "Secciones de la comparativa",
    verdictAria: "Resumen del veredicto GOAT",
    siteDirAria: "Directorio del sitio",
    closeAdAria: "Cerrar publicidad",
    faqHeader: "Preguntas Frecuentes: Messi vs Cristiano Ronaldo",
    exploreTitle: "Explora las estadísticas completas",
    footerDir: "Récords y Rivalidades",
    footerIntl: "Ediciones Internacionales / Idiomas",
    crestNote: "Los escudos de clubes son marcas registradas de sus respectivos clubes, mostrados con fines de identificación.",
    badgeRonaldoGoals: "Ronaldo (+48 goles, récord histórico)",
    badgeMessiNPG: "Messi (+26 goles sin penalti)",
    badgeMessiFK: "Messi (+12 tiros libres)",
    badgeRonaldoPen: "Ronaldo (+74 penaltis)",
    badgeMessiAssists: "Messi (+146 asistencias)",
    badgeRonaldoHT: "Ronaldo (+4 hat-tricks)",
    badgeMessiWC: "Messi (Campeón, 2 Balones de Oro)",
    badgeMessiTrophies: "Messi (+10 títulos, récord mundial)",
    badgeMessiBallon: "Messi (+3 Balones de Oro, récord)",
    badgeMessiH2H: "Messi (+5 victorias, 16 a 11)",
    badgeMessiFinals: "Messi (+13 goles en finales)",
        thCompetition: "Competición",
    thMatches: "Partidos",
    thMessiWins: "Victorias Messi",
    thDraws: "Empates",
    thRonaldoWins: "Victorias Ronaldo",
    thMessiGoals: "Goles Messi",
    thRonaldoGoals: "Goles Ronaldo",
    tableTotal: "Total",
    badge16Wins: "16 Victorias",
    badge11Wins: "11 Victorias",
    tied2All: "Empate (2 cada uno)",
    badgeMessiRecord: "Messi (Récord)",
    wcKOStageMessi: "Messi (+6)",
    goalsKnockoutMessi: "7 Goles",
    goalsKnockoutRonaldo: "1 Gol",
    assistsKnockoutMessi: "10 Asistencias",
    assistsKnockoutRonaldo: "0 Asistencias",
    finalsRecordMessi: "36 Goles en 52 Finales",
    finalsRecordRonaldo: "23 Goles en 40 Finales",
    continentalMessi: "3 (2 Copas América, 1 Finalissima)",
    continentalRonaldo: "3 (1 Eurocopa, 2 Ligas de Naciones)",
    contTie: "Empate 3–3",
    adLabel: "Publicidad",
    showdownCaption: `<strong>El Duelo Eterno:</strong> Lionel Messi y Cristiano Ronaldo — Dos titanes del fútbol cuya rivalidad histórica marcó época en 36 enfrentamientos directos.`,
    bdayPromoBadge: "🎂 HERRAMIENTA INTERACTIVA ÚNICA",
    bdayPromoAria: "¿Marcó Messi el día de tu cumpleaños?",
    jumpCore: "Totales de Carrera",
    jumpScoring: "Tiros Libres y Penaltis",
    jumpPlaymaking: "Asistencias y Creación",
    jumpIntl: "Mundiales y Finales",
    jumpH2H: "36 Duelos Directos",
    jumpFaq: "Preguntas Frecuentes",
    faqs: [
      {
        q: "¿Quién tiene más goles en total: Messi o Cristiano Ronaldo?",
        a: "Cristiano Ronaldo tiene el récord mundial histórico absoluto con 981 goles oficiales en 1.342 partidos (0,73 goles por partido). Lionel Messi suma 932 goles en 1.178 partidos (0,79 goles por partido). Ronaldo aventaja a Messi por 48 goles, aunque Messi ha jugado 161 partidos menos y ostenta un mejor promedio goleador."
      },
      {
        q: "¿Quién tiene más goles sin contar penaltis?",
        a: "Lionel Messi suma 822 goles sin contar penaltis en 1.178 partidos (0,70 por partido). Cristiano Ronaldo registra 796 goles sin penalti en 1.342 encuentros (0,59 por partido). Messi aventaja a Ronaldo en 26 goles de jugada habiendo jugado 161 partidos menos."
      },
      {
        q: "¿Quién ha marcado más goles de tiro libre directo?",
        a: "Actualmente supera a Cristiano Ronaldo con 76 goles de tiro libre directo frente a los 64 de Ronaldo en el fútbol profesional senior. Messi anotó 50 con el Barcelona, 12 con Argentina, 12 con el Inter Miami y 2 con el PSG. Ronaldo marcó 33 con el Real Madrid, 15 con el Manchester United, 11 con Portugal, 5 con Al-Nassr y 1 con la Juventus."
      },
      {
        q: "¿Quién tiene más asistencias en su carrera: Messi o Ronaldo?",
        a: "Lionel Messi supera a Cristiano Ronaldo por 146 asistencias. Messi suma más de 407 asistencias oficiales (349 en clubes y 58 con Argentina), siendo el máximo asistente de la historia del fútbol. Ronaldo registra 261 asistencias."
      },
      {
        q: "¿Quién ha marcado más penaltis y cuál es su efectividad?",
        a: `Cristiano Ronaldo ha anotado ${PEN.ronaldoGoals} penaltis en ${PEN.ronaldoAttempts} lanzamientos (${PCT(PCT_NUM(PEN.ronaldoGoals, PEN.ronaldoAttempts), PCT_SEP.es)}% de acierto). Lionel Messi ha marcado 110 penaltis en 141 lanzamientos (78,0% de acierto). Ronaldo ha marcado ${PEN.ronaldoGoals - PEN.messiGoals} penaltis más que Messi.`
      },
      {
        q: "¿Quién tiene más hat-tricks: Messi o Ronaldo?",
        a: "Cristiano Ronaldo tiene 66 hat-tricks oficiales (56 en clubes y 10 con Portugal). Lionel Messi tiene 62 hat-tricks (48 con el Barcelona, 11 con Argentina y 3 con el Inter Miami). Ronaldo lidera por 4 hat-tricks."
      },
      {
        q: "¿Quién rindió mejor en las Copas del Mundo de la FIFA?",
        a: "Lionel Messi se coronó campeón del Mundial de Catar 2022 con Argentina, siendo el único jugador de la historia en ganar dos Balones de Oro del Mundial (2014 y 2022). Acumula 21 goles y 12 asistencias en 34 partidos de Copa del Mundo, incluyendo 7 goles en rondas de eliminación directa. Ronaldo registra 11 goles y 2 asistencias en seis Mundiales, incluyendo su primer gol en eliminatorias (ante Croacia en 2026)."
      },
      {
        q: "¿Quién ganó más partidos en los 36 duelos directos?",
        a: "En los 36 enfrentamientos directos oficiales, los equipos de Messi vencieron en 16 ocasiones, los de Ronaldo en 11 y hubo 9 empates. Messi marcó 22 goles en esos duelos y Ronaldo anotó 21."
      },
      {
        q: "¿Cuántos Balones de Oro y títulos tiene cada uno?",
        a: "Messi ostenta el récord mundial absoluto con 47 títulos colectivos (incluyendo 10 Ligas, 4 Champions, 2 Copas América y 1 Mundial) frente a los 37 de Ronaldo. Messi también posee el récord histórico con 8 Balones de Oro frente a los 5 de Ronaldo."
      },
      {
        q: "¿Por qué los análisis estadísticos consideran a Messi el GOAT?",
        a: "Los modelos analíticos favorecen a Messi por dominar simultáneamente el gol y la creación: mejor promedio goleador (0,79 vs 0,72), 26 goles más sin penalti en 161 partidos menos, más de 146 asistencias de ventaja, mejor promedio de minutos por gol/asistencia (72 min vs 88 min) y su coronación en el Mundial 2022."
      }
    ]
  },
  pt: {
    dir: "ltr",
    title: "Messi vs Cristiano Ronaldo: Gols e Estatísticas 2026 | MessiStats",
    desc: "Messi vs Cristiano Ronaldo: 932 x 981 gols, assistências, faltas, pênaltis, títulos e Bolas de Ouro. Comparativo completo 2026.",
    keywords: "messi vs ronaldo, messi vs ronaldo estatisticas, messi vs ronaldo faltas, messi vs ronaldo penaltis, messi vs ronaldo gols sem penalti, messi vs ronaldo assistencias, messi vs ronaldo hat tricks, quem e melhor messi ou ronaldo, quem tem mais gols messi ou ronaldo, messi vs ronaldo confronto direto, messi vs ronaldo copa do mundo, titulos, bolas de ouro",
    brand: "MessiStats",
    homeName: "Início",
    latestGoalName: "Último Gol",
    bdayName: "Aniversário",
    vsRonaldoName: "vs Ronaldo",
    vsRealMadridName: "vs Real Madrid",
    uclName: "Champions League",
    goalsByYearName: "Gols por ano",
    goalsBySeasonName: "Gols por temporada",
    dashboardName: "Painel",
    timelineName: "Linha do tempo",
    achievementsName: "Títulos e Prêmios",
    skipText: "Pular para o conteúdo",
    eyebrow: "A Maior Rivalidade <i></i> <span>Comparativo Completo e Confronto Direto</span>",
    h1: "Messi vs Cristiano Ronaldo: Quem Tem Mais Gols?",
    lead: "O comparativo estatístico definitivo entre os dois maiores ícones do futebol moderno. Gols totais, gols sem pênalti, faltas, pênaltis, assistências, títulos, prêmios individuais e os 36 confrontos diretos.",
    verdictBadge: "O VEREDITO DO GOAT • DADOS OFICIAIS COMPLETOS",
    verdictTitle: "Quem tem as melhores estatísticas de carreira: Messi ou Ronaldo?",
    verdictText: "Em todos os jogos oficiais seniores, <b>Lionel Messi marcou 932 gols e distribuiu mais de 407 assistências em 1.178 jogos</b> (1,12 participações em gol por partida), enquanto <b>Cristiano Ronaldo é o maior artilheiro de todos os tempos com 981 gols e 261 assistências em 1.342 jogos</b> (0,93 participações por partida). Embora Ronaldo lidere em gols totais (<b>981 contra 932</b>), Messi alcançou seus gols em <b>161 jogos a menos</b> com melhor média (<b>0,79 contra 0,73</b>), tem mais <b>gols sem pênalti (822 contra 796)</b> e assistências (<b>407+ contra 261</b>), conquistou a <b>Copa do Mundo FIFA (2022)</b> com duas Bolas de Ouro, e lidera em <b>Bolas de Ouro (8 a 5)</b> e <b>títulos oficiais (47 a 37)</b>.",
    tableStat: "Estatística",
    tableLeader: "Líder",
    coreHeader: "Totais da Carreira Sênior Oficial",
    coreIntro: "Números oficiais verificados em competições de clubes e seleções principais.",
    statGoals: "Gols Oficiais na Carreira Sênior",
    statApps: "Jogos Disputados",
    statRatio: "Média de Gols por Jogo",
    statAssists: "Assistências Oficiais",
    statGoalContrib: "Participações em Gols (Gols + Assistências)",
    statContribRatio: "Participações em Gol por Jogo",
    statMinsContrib: "Minutos por Participação em Gol",
    statTrophies: "Títulos Coletivos de Equipe",
    statBallons: "Bolas de Ouro",
    statGoldenShoes: "Chuteiras de Ouro Europeias",
    statWorldCup: "Copa do Mundo FIFA",
    statH2HWins: "Vitórias em Confrontos Diretos",
    scoringHeader: "Tipos de Gol: Faltas, Pênaltis e Bola Rolando",
    scoringIntro: "Detalhamento de como cada craque marcou seus gols — eficiência com bola rolando e bola parada.",
    statNPG: "Gols Sem Pênalti (NPG)",
    statNPGRatio: "Média de Gols Sem Pênalti",
    statFreeKicks: "Gols de Falta Direta",
    statPenalties: "Gols de Pênalti (Cobranças)",
    statPenConversion: "Aproveitamento em Pênaltis",
    statHatTricks: "Hat-Tricks na Carreira",
    statPokers: "Jogos com 4 Gols (Pokers)",
    stat5Goals: "Jogos com 5 Gols",
    statOutsideBox: "Gols Fora da Área",
    statOpenPlay: "Gols com Bola Rolando",
    playmakingHeader: "Criação de Jogadas, Assistências e Influência",
    playmakingIntro: "Assistências, passes decisivos e impacto ofensivo muito além da finalização.",
    statAllAssists: "Total de Assistências na Carreira",
    statClubAssists: "Assistências por Clubes",
    statIntAssists: "Assistências pela Seleção",
    statBigChances: "Grandes Chances Criadas",
    intlHeader: "Seleções Nacionais e Finais de Torneio",
    intlIntro: "Desempenho nos maiores palcos do futebol: Copa do Mundo, torneios continentais e decisões.",
    statWCTitles: "Títulos de Copa do Mundo",
    statWCGoldenBall: "Bolas de Ouro da Copa (Melhor Jogador)",
    statWCGoals: "Gols em Copas do Mundo",
    statWCAssists: "Assistências em Copas do Mundo",
    statWCKO: "Gols no Mata-Mata da Copa do Mundo",
    statWCKOAssists: "Assistências no Mata-Mata da Copa",
    statContTitles: "Títulos Continentais de Seleção",
    statFinalsGoals: "Gols Marcados em Finais de Copa",
    h2hHeader: "Os 36 Confrontos Diretos",
    h2hIntro: "Histórico completo de todos os 36 jogos em que Messi e Ronaldo se enfrentaram em campo.",
    kpiMessiWins: "Vitórias Messi",
    kpiDraws: "Empates",
    kpiRonaldoWins: "Vitórias Ronaldo",
    kpiGoalsScored: "Gols Marcados",
    kpiEqualMatches: "Jogos Empatados",
    compClasico: "El Clásico (Barcelona vs Real Madrid)",
    compUCL: "UEFA Champions League",
    compIntl: "Amistosos Internacionais",
    bdayTitle: "Messi marcou gol no aniversário de Cristiano Ronaldo?",
    bdayDesc: "Cristiano Ronaldo nasceu em 5 de fevereiro. Veja o que Messi fez em 5 de fevereiro e pesquise também seu aniversário!",
    bdayBtn: "Ver 5 de fevereiro ⚽",
    supportAria: "Apoiar o MessiStats",
    supportTitle: "Apoie o MessiStats",
    supportText: "MessiStats é um projeto independente dedicado a registrar os mais de 932 gols da carreira com vídeos e sem paywall. Se você gosta do site, apoie-nos no Ko-fi ou doe com cripto para cobrir hospedagem e vídeos.",
    supportCta: "💖 Apoiar no Ko-fi",
    cryptoLabel: "Doação direta (USDT / BNB / ETH / BUSD):",
    copyBtn: "Copiar 📋",
    copiedMsg: "✓ Copiado!",
    brandSub: "O Banco de Dados Verificado de Estatísticas e Vídeos de Lionel Messi",
    logoAlt: "Logotipo do MessiStats",
    showdownAlt: "Lionel Messi e Cristiano Ronaldo frente a frente em campo",
    showdownBadge: "⚔️ 36 CONFRONTOS DIRETOS · 13 BOLAS DE OURO SOMADAS",
    tocAria: "Seções da comparação",
    verdictAria: "Resumo do veredito GOAT",
    siteDirAria: "Diretório do site",
    closeAdAria: "Fechar publicidade",
    faqHeader: "Perguntas Frequentes: Messi vs Cristiano Ronaldo",
    exploreTitle: "Explore todas as estatísticas",
    footerDir: "Recordes e Rivalidades",
    footerIntl: "Edições Internacionais / Idiomas",
    crestNote: "Os escudos dos clubes são marcas registradas de seus respectivos times, exibidos para fins de identificação.",
    badgeRonaldoGoals: "Ronaldo (+48 gols, recorde histórico)",
    badgeMessiNPG: "Messi (+26 gols sem pênalti)",
    badgeMessiFK: "Messi (+12 faltas diretas)",
    badgeRonaldoPen: "Ronaldo (+74 pênaltis)",
    badgeMessiAssists: "Messi (+146 assistências)",
    badgeRonaldoHT: "Ronaldo (+4 hat-tricks)",
    badgeMessiWC: "Messi (Campeão, 2 Bolas de Ouro)",
    badgeMessiTrophies: "Messi (+10 títulos, recorde mundial)",
    badgeMessiBallon: "Messi (+3 Bolas de Ouro, recorde)",
    badgeMessiH2H: "Messi (+5 vitórias, 16 a 11)",
    badgeMessiFinals: "Messi (+13 gols em finais)",
        thCompetition: "Competição",
    thMatches: "Jogos",
    thMessiWins: "Vitórias de Messi",
    thDraws: "Empates",
    thRonaldoWins: "Vitórias de Ronaldo",
    thMessiGoals: "Gols de Messi",
    thRonaldoGoals: "Gols de Ronaldo",
    tableTotal: "Total",
    badge16Wins: "16 Vitórias",
    badge11Wins: "11 Vitórias",
    tied2All: "Empate (2 cada)",
    badgeMessiRecord: "Messi (Recorde)",
    wcKOStageMessi: "Messi (+6)",
    goalsKnockoutMessi: "7 Gols",
    goalsKnockoutRonaldo: "1 Gol",
    assistsKnockoutMessi: "10 Assistências",
    assistsKnockoutRonaldo: "0 Assistências",
    finalsRecordMessi: "36 Gols em 52 Finais",
    finalsRecordRonaldo: "23 Gols em 40 Finais",
    continentalMessi: "3 (2 Copas América, 1 Finalíssima)",
    continentalRonaldo: "3 (1 Eurocopa, 2 Ligas das Nações)",
    contTie: "Empate 3–3",
    adLabel: "Publicidade",
    showdownCaption: `<strong>O Duelo Eterno:</strong> Lionel Messi e Cristiano Ronaldo — Dois gigantes do futebol cuja rivalidade histórica marcou época em 36 confrontos diretos.`,
    bdayPromoBadge: "🎂 FERRAMENTA INTERATIVA EXCLUSIVA",
    bdayPromoAria: "Messi marcou no dia do seu aniversário?",
    jumpCore: "Totais da Carreira",
    jumpScoring: "Faltas e Pênaltis",
    jumpPlaymaking: "Assistências e Criação",
    jumpIntl: "Copa do Mundo e Finais",
    jumpH2H: "36 Duelos Diretos",
    jumpFaq: "Perguntas Frequentes",
    faqs: [
      {
        q: "Quem tem mais gols na carreira: Messi ou Cristiano Ronaldo?",
        a: "Cristiano Ronaldo detém o recorde mundial absoluto com 981 gols oficiais em 1.342 jogos (0,73 gols por jogo). Lionel Messi marcou 932 gols em 1.178 jogos (0,79 gols por jogo). Ronaldo lidera por 48 gols, mas Messi disputou 161 jogos a menos e possui média superior."
      },
      {
        q: "Quem tem mais gols sem contar cobranças de pênalti?",
        a: "Lionel Messi tem 822 gols sem pênalti em 1.178 jogos (0,70 por jogo). Cristiano Ronaldo soma 796 gols sem pênalti em 1.342 jogos (0,59 por jogo). Messi tem 26 gols sem pênalti a mais jogando 161 partidas a menos."
      },
      {
        q: "Quem marcou mais gols de falta direta na carreira?",
        a: "Atualmente eles supera Cristiano Ronaldo com 76 gols de falta direta contra 64 de Ronaldo. Messi marcou 50 pelo Barcelona, 12 pela Argentina, 12 pelo Inter Miami e 2 pelo PSG. Ronaldo marcou 33 pelo Real Madrid, 15 pelo Manchester United, 11 por Portugal, 5 pelo Al-Nassr e 1 pela Juventus."
      },
      {
        q: "Quem tem mais assistências oficiais: Messi ou Ronaldo?",
        a: "Lionel Messi lidera com 146 assistências a mais que Cristiano Ronaldo. Messi soma mais de 407 assistências oficiais (349 por clubes e 58 pela Argentina), sendo o maior garçom da história do futebol moderno. Ronaldo tem 261 assistências."
      },
      {
        q: "Quem marcou mais gols de pênalti e qual é a taxa de conversão?",
        a: `Cristiano Ronaldo converteu ${PEN.ronaldoGoals} pênaltis em ${PEN.ronaldoAttempts} cobranças (${PCT(PCT_NUM(PEN.ronaldoGoals, PEN.ronaldoAttempts), PCT_SEP.pt)}% de aproveitamento). Lionel Messi converteu 110 pênaltis em 141 cobranças (78,0% de aproveitamento). Ronaldo marcou ${PEN.ronaldoGoals - PEN.messiGoals} pênaltis a mais que Messi.`
      },
      {
        q: "Quem tem mais hat-tricks na carreira: Messi ou Ronaldo?",
        a: "Cristiano Ronaldo marcou 66 hat-tricks (56 por clubes e 10 por Portugal). Lionel Messi marcou 62 hat-tricks (48 pelo Barcelona, 11 pela Argentina e 3 pelo Inter Miami). Ronaldo lidera por 4 hat-tricks."
      },
      {
        q: "Quem teve melhor desempenho em Copas do Mundo da FIFA?",
        a: "Lionel Messi foi campeão da Copa do Mundo no Catar 2022 pela Argentina, sendo o único jogador da história a vencer duas Bolas de Ouro da Copa (2014 e 2022). Em Mundiais, Messi tem 21 gols e 12 assistências em 34 jogos, com 7 gols no mata-mata. Ronaldo tem 11 gols e 2 assistências em seis Copas, incluindo seu primeiro gol no mata-mata (contra a Croácia em 2026)."
      },
      {
        q: "Quem venceu mais jogos nos 36 confrontos diretos?",
        a: "Nos 36 jogos oficiais diretos, os times de Messi venceram 16 vezes, os de Ronaldo venceram 11 vezes e houve 9 empates. Messi marcou 22 gols nesses jogos; Ronaldo marcou 21."
      },
      {
        q: "Quantas Bolas de Ouro e títulos cada um conquistou?",
        a: "Messi detém o recorde mundial absoluto com 47 títulos coletivos (incluindo 10 La Ligas, 4 Champions, 2 Copas América e 1 Copa do Mundo) contra 37 títulos de Ronaldo. Messi também detém o recorde histórico com 8 Bolas de Ouro contra 5 de Ronaldo."
      },
      {
        q: "Por que analistas estatísticos consideram Messi o GOAT?",
        a: "Modelos analíticos apontam Messi no topo por dominar tanto a finalização quanto a armação: melhor média de gols (0,79 vs 0,73), 26 gols sem pênalti a mais em 161 jogos a menos, 146 assistências de vantagem, melhor ritmo de minutos por participação em gol (72 min vs 88 min) e o título da Copa do Mundo de 2022."
      }
    ]
  },
  fr: {
    dir: "ltr",
    title: "Messi vs Ronaldo : Statistiques, Coups Francs, Penaltys et Face-à-Face | MessiStat",
    desc: "Lionel Messi vs Cristiano Ronaldo : 932 buts vs 981, 407+ passes décisives vs 261, 822 buts hors penalty vs 796, 76 coups francs vs 64, 47 trophées vs 37, 8 Ballons d'Or vs 5. La comparaison ultime.",
    keywords: "messi vs ronaldo, messi vs ronaldo statistiques, messi vs ronaldo coups francs, messi vs ronaldo penaltys, messi vs ronaldo buts hors penalty, messi vs ronaldo passes decisives, messi vs ronaldo triples, qui est le meilleur messi ou ronaldo, qui a le plus de buts messi ou ronaldo, face a face messi ronaldo, coupe du monde, ballons d or, trophees",
    brand: "MessiStat",
    homeName: "Accueil",
    latestGoalName: "Dernier But",
    bdayName: "Anniversaire",
    vsRonaldoName: "vs Ronaldo",
    vsRealMadridName: "vs Real Madrid",
    uclName: "Ligue des Champions",
    goalsByYearName: "Buts par année",
    goalsBySeasonName: "Buts par saison",
    dashboardName: "Tableau de bord",
    timelineName: "Chronologie",
    achievementsName: "Palmarès",
    skipText: "Aller au contenu",
    eyebrow: "La Plus Grande Rivalité <i></i> <span>Comparatif Complet et Face-à-Face</span>",
    h1: "Lionel Messi vs Cristiano Ronaldo",
    lead: "Le comparatif statistique absolu entre les deux plus grandes légendes du football contemporain. Buts officiels, buts hors penalty, coups francs, penaltys, passes décisives, trophées collectifs, distinctions individuelles et l'intégralité des 36 duels directs.",
    verdictBadge: "LE VERDICT GOAT • CHIFFRES OFFICIELS COMPLETS",
    verdictTitle: "Qui a les meilleures statistiques en carrière : Messi ou Ronaldo ?",
    verdictText: "En matchs officiels de haut niveau, <b>Lionel Messi a marqué 932 buts et délivré plus de 407 passes décisives en 1 178 apparitions</b> (1,12 action de but par match), tandis que <b>Cristiano Ronaldo détient le record absolu avec 981 buts et 261 passes en 1 342 matchs</b> (0,93 action par match). Si Ronaldo domine le total de buts (<b>981 contre 932</b>), Messi a atteint ses 932 buts avec <b>161 matchs de moins</b> et un meilleur ratio (<b>0,79 contre 0,73</b>), compte plus de <b>buts hors penalty (822 contre 796)</b> et de passes (<b>407+ contre 261</b>), a remporté la <b>Coupe du Monde FIFA (2022)</b> avec deux Ballons d'Or du tournoi, et domine au <b>Ballon d'Or (8 contre 5)</b> et en <b>titres officiels (47 contre 37)</b>.",
    tableStat: "Statistique",
    tableLeader: "Avantage",
    coreHeader: "Totaux de Carrière Senior Officiels",
    coreIntro: "Chiffres officiels vérifiés en clubs et équipes nationales seniors.",
    statGoals: "Buts Officiels en Carrière Senior",
    statApps: "Matchs Officiels Joués",
    statRatio: "Moyenne de Buts par Match",
    statAssists: "Passes Décisives Officielles",
    statGoalContrib: "Actions Décisives (Buts + Passes)",
    statContribRatio: "Action Décisive par Match",
    statMinsContrib: "Minutes par Action Décisive",
    statTrophies: "Titres Collectifs Remportés",
    statBallons: "Trophées du Ballon d'Or",
    statGoldenShoes: "Souliers d'Or Européens",
    statWorldCup: "Coupe du Monde FIFA",
    statH2HWins: "Victoires en Duels Directs",
    scoringHeader: "Types de Buts : Coups Francs, Penaltys et Jeu Ouvert",
    scoringIntro: "Répartition précise de la finition de chaque joueur, efficacité dans le jeu et sur coups de pied arrêtés.",
    statNPG: "Buts Hors Penalty (NPG)",
    statNPGRatio: "Moyenne de Buts Hors Penalty",
    statFreeKicks: "Buts sur Coup Franc Direct",
    statPenalties: "Penaltys Transformés (Tentatives)",
    statPenConversion: "Taux de Réussite sur Penalty",
    statHatTricks: "Triplés en Carrière (Hat-Tricks)",
    statPokers: "Matchs à 4 Buts (Quadruplés)",
    stat5Goals: "Matchs à 5 Buts (Quintuplés)",
    statOutsideBox: "Buts Hors de la Surface",
    statOpenPlay: "Buts dans le Jeu Courant",
    playmakingHeader: "Création de Jeu, Passes et Influence Globale",
    playmakingIntro: "Passes décisives, vision du jeu et influence créative au-delà de la finition.",
    statAllAssists: "Total de Passes Décisives en Carrière",
    statClubAssists: "Passes Décisives en Club",
    statIntAssists: "Passes Décisives en Sélection",
    statBigChances: "Grandes Occasions Créées",
    intlHeader: "Sélections Nationales et Finales Majeures",
    intlIntro: "Performance dans les plus grands rendez-vous mondiaux : Coupe du Monde et finales.",
    statWCTitles: "Titres en Coupe du Monde",
    statWCGoldenBall: "Ballons d'Or de la Coupe du Monde (Meilleur Joueur)",
    statWCGoals: "Buts en Coupe du Monde",
    statWCAssists: "Passes Décisives en Coupe du Monde",
    statWCKO: "Buts en Phase à Élimination Directe (Mondial)",
    statWCKOAssists: "Passes Décisives en Phase à Élimination Directe",
    statContTitles: "Titres Continentaux en Sélection",
    statFinalsGoals: "Buts Marqués en Finales de Coupe",
    h2hHeader: "Les 36 Duels Directs en Face-à-Face",
    h2hIntro: "Bilan complet des 36 confrontations directes disputées entre Messi et Ronaldo.",
    kpiMessiWins: "Victoires Messi",
    kpiDraws: "Matchs Nuls",
    kpiRonaldoWins: "Victoires Ronaldo",
    kpiGoalsScored: "Buts Marqués",
    kpiEqualMatches: "Matchs Nuls",
    compClasico: "Le Clásico (Barcelone vs Real Madrid)",
    compUCL: "Ligue des Champions UEFA",
    compIntl: "Matchs Amicaux Internationaux",
    bdayTitle: "Messi a-t-il marqué le jour de l'anniversaire de Cristiano Ronaldo ?",
    bdayDesc: "Cristiano Ronaldo est né le 5 février. Découvrez ce que Messi a fait un 5 février et testez votre propre anniversaire !",
    bdayBtn: "Tester le 5 février ⚽",
    supportAria: "Soutenir MessiStats",
    supportTitle: "Soutenir MessiStats",
    supportText: "MessiStats est un projet indépendant dédié au suivi des 932+ buts en carrière avec vidéos, sans paywall. Si vous aimez ce site, soutenez-nous sur Ko-fi ou donnez en crypto pour couvrir l'hébergement et les vidéos.",
    supportCta: "💖 Soutenir sur Ko-fi",
    cryptoLabel: "Don direct (USDT / BNB / ETH / BUSD) :",
    copyBtn: "Copier 📋",
    copiedMsg: "✓ Copié !",
    brandSub: "La Base de Données Vérifiée des Statistiques et Vidéos de Lionel Messi",
    logoAlt: "Logo MessiStats",
    showdownAlt: "Lionel Messi et Cristiano Ronaldo face à face sur le terrain",
    showdownBadge: "⚔️ 36 DUELS DIRECTS · 13 BALLONS D'OR COMBINÉS",
    tocAria: "Sections de la comparaison",
    verdictAria: "Résumé du verdict GOAT",
    siteDirAria: "Plan du site",
    closeAdAria: "Fermer la publicité",
    faqHeader: "Foire Aux Questions : Messi vs Ronaldo",
    exploreTitle: "Explorer toutes les statistiques",
    footerDir: "Records et Rivalités",
    footerIntl: "Éditions Internationales / Langues",
    crestNote: "Les logos de clubs sont des marques déposées de leurs propriétaires respectifs, utilisés à des fins d'identification.",
    badgeRonaldoGoals: "Ronaldo (+48 buts, record historique)",
    badgeMessiNPG: "Messi (+26 buts hors penalty)",
    badgeMessiFK: "Messi (+12 coups francs)",
    badgeRonaldoPen: "Ronaldo (+74 penaltys)",
    badgeMessiAssists: "Messi (+146 passes décisives)",
    badgeRonaldoHT: "Ronaldo (+4 triplés)",
    badgeMessiWC: "Messi (Champion, 2 Ballons d'Or)",
    badgeMessiTrophies: "Messi (+10 trophées, record mondial)",
    badgeMessiBallon: "Messi (+3 Ballons d'Or, record)",
    badgeMessiH2H: "Messi (+5 victoires, 16 à 11)",
    badgeMessiFinals: "Messi (+13 buts en finales)",
        thCompetition: "Compétition",
    thMatches: "Matchs",
    thMessiWins: "Victoires Messi",
    thDraws: "Nuls",
    thRonaldoWins: "Victoires Ronaldo",
    thMessiGoals: "Buts Messi",
    thRonaldoGoals: "Buts Ronaldo",
    tableTotal: "Total",
    badge16Wins: "16 Victoires",
    badge11Wins: "11 Victoires",
    tied2All: "Égalité (2 chacun)",
    badgeMessiRecord: "Messi (Record)",
    wcKOStageMessi: "Messi (+6)",
    goalsKnockoutMessi: "7 Buts",
    goalsKnockoutRonaldo: "1 But",
    assistsKnockoutMessi: "10 Passes décisives",
    assistsKnockoutRonaldo: "0 Passe",
    finalsRecordMessi: "36 Buts en 52 Finales",
    finalsRecordRonaldo: "23 Buts en 40 Finales",
    continentalMessi: "3 (2 Copas América, 1 Finalissima)",
    continentalRonaldo: "3 (1 Euro, 2 Ligues des Nations)",
    contTie: "Égalité 3–3",
    adLabel: "Publicité",
    showdownCaption: `<strong>Le Duel Éternel :</strong> Lionel Messi &amp; Cristiano Ronaldo — Deux géants du football dont la rivalité historique a marqué le sport mondial à travers 36 duels directs.`,
    bdayPromoBadge: "🎂 OUTIL INTERACTIF UNIQUE",
    bdayPromoAria: "Messi a-t-il marqué le jour de votre anniversaire ?",
    jumpCore: "Totaux de Carrière",
    jumpScoring: "Coups Francs & Penaltys",
    jumpPlaymaking: "Passes & Création",
    jumpIntl: "Coupe du Monde & Finales",
    jumpH2H: "36 Face-à-Face",
    jumpFaq: "Foire Aux Questions",
    faqs: [
      {
        q: "Qui a marqué le plus de buts officiels : Messi ou Ronaldo ?",
        a: "Cristiano Ronaldo détient le record mondial de l'histoire du football avec 981 buts officiels en 1 342 apparitions (0,73 but par match). Lionel Messi compte 932 buts en 1 178 apparitions (0,79 but par match). Ronaldo mène de 48 buts, mais Messi compte 161 matchs de moins et affiche une meilleure moyenne."
      },
      {
        q: "Qui a inscrit le plus de buts hors penalty ?",
        a: "Lionel Messi compte 822 buts hors penalty en 1 178 matchs (0,70 par match). Cristiano Ronaldo totalise 796 buts hors penalty en 1 342 matchs (0,59 par match). Messi devance Ronaldo de 26 buts hors penalty en ayant disputé 161 matchs de moins."
      },
      {
        q: "Qui a marqué le plus de coups francs directs ?",
        a: "Les deux géants sont à égalité parfaite avec 66 buts sur coup franc direct chacun. Messi en compte 50 avec Barcelone, 11 avec l'Argentine, 3 avec l'Inter Miami et 2 avec le PSG. Ronaldo en compte 33 avec le Real Madrid, 15 avec Manchester United, 11 avec le Portugal, 6 avec Al-Nassr et 1 avec la Juventus."
      },
      {
        q: "Qui a délivré le plus de passes décisives : Messi ou Ronaldo ?",
        a: "Lionel Messi possède 146 passes décisives d'avance sur Cristiano Ronaldo. Messi cumule plus de 407 passes décisives officielles (349 en clubs et 58 pour l'Argentine), constituant le record absolu de l'histoire du football. Ronaldo en compte 261."
      },
      {
        q: "Qui a marqué le plus de penaltys et quel est leur taux de réussite ?",
        a: `Cristiano Ronaldo a transformé ${PEN.ronaldoGoals} penaltys sur ${PEN.ronaldoAttempts} tentatives (${PCT(PCT_NUM(PEN.ronaldoGoals, PEN.ronaldoAttempts), PCT_SEP.fr)}% de réussite). Lionel Messi a transformé 110 penaltys sur 141 tentatives (78,0% de réussite). Ronaldo compte ${PEN.ronaldoGoals - PEN.messiGoals} penaltys réussis de plus que Messi.`
      },
      {
        q: "Qui compte le plus de triplés (hat-tricks) en carrière ?",
        a: "Cristiano Ronaldo a inscrit 66 triplés (56 en club, 10 en sélection). Lionel Messi en a signé 62 (48 avec Barcelone, 11 avec l'Argentine et 3 avec l'Inter Miami). Ronaldo mène de 4 triplés."
      },
      {
        q: "Qui a été le plus performant en Coupe du Monde de la FIFA ?",
        a: "Lionel Messi a remporté la Coupe du Monde au Qatar en 2022 avec l'Argentine, devenant le seul joueur de l'histoire à remporter deux Ballons d'Or de la Coupe du Monde (2014 et 2022). En Coupe du Monde, Messi compte 21 buts et 12 passes décisives en 34 matchs, dont 7 buts en matchs à élimination directe. Ronaldo compte 11 buts et 2 passes en six Coupes du Monde, dont son premier but en match éliminatoire (contre la Croatie en 2026)."
      },
      {
        q: "Qui a remporté le plus de duels directs lors de leurs 36 matchs ?",
        a: "Lors de leurs 36 confrontations directes officielles, les équipes de Messi l'ont emporté à 16 reprises, celles de Ronaldo à 11 reprises, et 9 matchs se sont soldés par un nul. Messi a inscrit 22 buts dans ces chocs, Ronaldo 21."
      },
      {
        q: "Combien de Ballons d'Or et de trophées possèdent-ils chacun ?",
        a: "Messi détient le record mondial absolu avec 47 titres collectifs (dont 10 Liga, 4 Ligue des Champions, 2 Copa América et 1 Coupe du Monde) contre 37 pour Ronaldo. Messi détient également le record avec 8 Ballons d'Or contre 5 pour Ronaldo."
      },
      {
        q: "Pourquoi les analystes statistiques placent-ils Messi comme le GOAT ?",
        a: "Les modèles statistiques consacrent Messi car il associe une finition hors normes à une créativité unique : meilleur ratio de buts (0,79 vs 0,72), 26 buts hors penalty de plus en 161 matchs de moins, plus de 146 passes d'avance, un temps de participation par but plus rapide (72 min vs 88 min) et son sacre mondial en 2022."
      }
    ]
  }
};

function generateHtml(lang) {
  const t = I18N[lang] || I18N.en;
  const p = POLL_I18N[lang] || POLL_I18N.en;
  const isEn = lang === "en";
  const canonicalUrl = `https://www.messistat.com/${lang}/messi-vs-ronaldo`;
  const slugPath = isEn ? "/en" : `/${lang}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${canonicalUrl}#webpage`,
        "url": canonicalUrl,
        "name": t.title,
        "description": t.desc,
        "dateModified": "2026-09-19",
        "inLanguage": lang,
        "speakable": {
          "@type": "SpeakableSpecification",
          "cssSelector": [
            ".goat-verdict-box",
            "#core-matrix",
            "#scoring-matrix",
            "#playmaking-matrix",
            "#faq"
          ]
        },
        "publisher": {
          "@type": "Organization",
          "name": "MessiStat",
          "alternateName": "messistat.com",
          "url": "https://www.messistat.com/",
          "logo": {
            "@type": "ImageObject",
            "@id": "https://www.messistat.com/#logo",
            "url": "https://www.messistat.com/img/logo.png",
            "contentUrl": "https://www.messistat.com/img/logo.png",
            "caption": "MessiStat Official Logo",
            "width": 512,
            "height": 512
          },
          "sameAs": [
            "https://x.com/messistat1",
            "https://twitter.com/messistat1",
            "https://t.me/messistatdotcom"
          ]
        }
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": t.homeName,
            "item": `https://www.messistat.com/${lang}`
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": t.vsRonaldoName,
            "item": canonicalUrl
          }
        ]
      },
      {
        "@type": "FAQPage",
        "@id": `${canonicalUrl}#faq`,
        "mainEntity": t.faqs.map(f => ({
          "@type": "Question",
          "name": f.q,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": f.a
          }
        }))
      }
    ]
  };

  const faqItemsHtml = t.faqs.map(f => `      <details class="faq-item">
        <summary class="faq-question">
          <span>${f.q}</span>
          <span class="faq-chevron" aria-hidden="true">▾</span>
        </summary>
        <div class="faq-answer">
          <p>${f.a}</p>
        </div>
      </details>`).join("\n");

  const html = `<!DOCTYPE html>
<html lang="${lang}" dir="${t.dir}">
<head>
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-FERBLJWWWZ"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-FERBLJWWWZ');
</script>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>
<title>${t.title}</title>
<meta name="description" content="${t.desc}"/>
${getHreflangs(lang, "messi-vs-ronaldo")}
<meta name="keywords" content="${t.keywords}"/>
<script src="/js/ad-guard.js"></script>
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"/>
<meta name="theme-color" content="#16243a"/>
<meta name="author" content="${t.brand}"/>
<meta property="og:type" content="article"/>
<meta property="og:site_name" content="${t.brand}"/>
<meta property="og:title" content="${t.title}"/>
<meta property="og:description" content="${t.desc}"/>
<meta property="og:url" content="${canonicalUrl}"/>
<meta property="og:image" content="https://www.messistat.com/img/og-messi.jpg?v=${S.goals}"/>
<meta property="og:image:secure_url" content="https://www.messistat.com/img/og-messi.jpg?v=${S.goals}"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:site" content="@messistat1"/>
<meta name="twitter:creator" content="@messistat1"/>
<meta name="twitter:domain" content="messistat.com"/>
<meta name="twitter:title" content="${t.title}"/>
<meta name="twitter:description" content="${t.desc}"/>
<meta name="twitter:image" content="https://www.messistat.com/img/og-messi.jpg?v=${S.goals}"/>
<link rel="icon" href="/favicon.ico" sizes="48x48"/>
<link rel="icon" href="/favicon.svg" type="image/svg+xml"/>
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"/>
<link rel="manifest" href="/site.webmanifest"/>
<link rel="preload" href="/fonts/plus-jakarta-sans-latin.woff2" as="font" type="font/woff2" crossorigin/>
<link rel="preload" href="/fonts/dm-sans-latin.woff2" as="font" type="font/woff2" crossorigin/>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8397501846854760" crossorigin="anonymous"></script>
<link rel="stylesheet" href="/src/styles.css"/>
<script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
</script>
</head>
<body data-page="vs-ronaldo">
<a class="skip" href="#main">${t.skipText}</a>
<aside aria-label="Navigation" class="rail">
<a aria-label="${t.brand}" class="rail-badge" href="${slugPath}"><img src="/img/logo.png" alt="${t.brand}" class="rail-mark-logo" width="36" height="36" /><span class="rail-word">Messi<b>Stat</b></span></a>
<div class="rail-lang-wrap">
  <button type="button" class="rail-lang-btn" id="rail-lang-btn" aria-label="Select Language" title="Select Language">
    <svg class="rail-lang-globe" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="2" y1="12" x2="22" y2="12"></line>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
    </svg>
    <span class="rail-lang-label">${lang.toUpperCase()}</span>
    <span class="rail-lang-tag">${lang.toUpperCase()}</span>
  </button>
</div>
<nav>
<a href="${slugPath}" aria-label="${t.homeName}"><svg aria-hidden="true" viewbox="0 0 24 24"><path d="M3 11.5 12 3l9 8.5"></path><path d="M5.5 10.5V21h5v-6h3v6h5V10.5"></path></svg><span>${t.homeName}</span></a>
<a href="${slugPath}/latest-goal" aria-label="${t.latestGoalName}"><svg aria-hidden="true" viewbox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8" fill="currentColor"></polygon></svg><span>${t.latestGoalName} <b class="nav-badge-hot">LIVE ⚡</b></span></a>
<a class="nav-bday-link" href="${slugPath}/birthday" aria-label="${t.bdayName}"><svg aria-hidden="true" viewbox="0 0 24 24"><rect height="4" rx="1" width="18" x="3" y="8"></rect><path d="M12 8v13M19 12v9H5v-9M7.5 8a2.5 2.5 0 0 1 0-5A4.8 4.8 0 0 1 12 8a4.8 4.8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"></path></svg><span>${t.bdayName} <b class="nav-badge-hot">HOT 🔥</b></span></a>
<a aria-current="page" class="on" href="${slugPath}/messi-vs-ronaldo" aria-label="${t.vsRonaldoName}"><svg aria-hidden="true" viewbox="0 0 24 24"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1"></path><path d="M18 8l4 4-4 4"></path></svg><span>${t.vsRonaldoName}</span></a>
<a href="${slugPath}/vs-real-madrid" aria-label="${t.vsRealMadridName}"><svg aria-hidden="true" viewbox="0 0 24 24"><path d="M14.5 17.5 3 6V3h3l11.5 11.5"></path><path d="m13 19 6-6"></path><path d="m16 16 4 4"></path><path d="m19 21 2-2"></path></svg><span>${t.vsRealMadridName}</span></a>
<a href="${slugPath}/champions-league" aria-label="${t.uclName}"><svg aria-hidden="true" viewbox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg><span>${t.uclName}</span></a>
<a href="${slugPath}/goalsbyyear" aria-label="${t.goalsByYearName}"><svg aria-hidden="true" viewbox="0 0 24 24"><rect height="15.5" rx="2.5" width="17" x="3.5" y="5"></rect><path d="M3.5 10h17M8 2.8V6.5M16 2.8V6.5"></path></svg><span>${t.goalsByYearName}</span></a>
<a href="${slugPath}/goalsbyseason" aria-label="${t.goalsBySeasonName}"><svg aria-hidden="true" viewbox="0 0 24 24"><rect height="7.5" rx="1.5" width="7.5" x="3.5" y="3.5"></rect><rect height="7.5" rx="1.5" width="7.5" x="13" y="3.5"></rect><rect height="7.5" rx="1.5" width="7.5" x="3.5" y="13"></rect><rect height="7.5" rx="1.5" width="7.5" x="13" y="13"></rect></svg><span>${t.goalsBySeasonName}</span></a>
<a href="${slugPath}/dashboard" aria-label="${t.dashboardName}"><svg aria-hidden="true" viewbox="0 0 24 24"><path d="M3.5 20.5h17"></path><path d="M6.5 20v-7M12 20V5M17.5 20v-10"></path></svg><span>${t.dashboardName}</span></a>
<a href="${slugPath}/timeline" aria-label="${t.timelineName}"><svg aria-hidden="true" viewbox="0 0 24 24"><circle cx="12" cy="12" r="8.5"></circle><path d="M12 7.5V12l3 2"></path></svg><span>${t.timelineName}</span></a>
<a href="${slugPath}/achievements" aria-label="${t.achievementsName}"><svg aria-hidden="true" viewbox="0 0 24 24"><path d="M8 3.5h8V9a4 4 0 0 1-8 0V3.5Z"></path><path d="M8 5H4.5A1.5 1.5 0 0 0 6 10H8M16 5h3.5A1.5 1.5 0 0 1 18 10h-2M12 13v3.5M8.5 20.5h7M10 16.5h4V20h-4z"></path></svg><span>${t.achievementsName}</span></a>
</nav>
<button aria-label="Toggle dark mode" class="theme-toggle" id="theme-toggle" title="Toggle dark mode" type="button">
<svg aria-hidden="true" class="sun-icon" viewbox="0 0 24 24"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path></svg>
<svg aria-hidden="true" class="moon-icon" viewbox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
<span class="theme-label">Dark mode</span>
</button>
</aside>

<div class="page">
  <main class="wrap" id="main">
    <div class="desktop-brand-header">
      <a href="${slugPath}" class="desktop-brand-logo-link" aria-label="${t.brand}">
        <img src="/img/logo.png" alt="${t.logoAlt}" class="desktop-brand-logo" width="48" height="48" />
      </a>
      <div class="desktop-brand-titles">
        <div class="desktop-brand-name">Messi<span>Stat</span></div>
        <div class="desktop-brand-sub">${t.brandSub}</div>
      </div>
    </div>

    <!-- Top Header Ad Banner Slot -->
    <aside aria-label="${t.adLabel}" class="ad-banner-wrap ad-banner-top">
      <span class="ad-native-label">${t.adLabel}</span>
      <div class="ad-banner-slot">
        <iframe class="safe-ad-frame" src="/ads/hrf-300x250.html" width="300" height="250" sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox" title="Advertisement" scrolling="no"></iframe>
      </div>
    </aside>

    <p class="eyebrow">${t.eyebrow}</p>
    <h1>${t.h1}</h1>
    <p class="lede">${t.lead}</p>

    <!-- Iconic Rivalry Showdown Photograph -->
    <figure class="rivalry-showdown-card card">
      <div class="showdown-media-wrap">
        <img src="/img/messi-vs-ronaldo.webp" alt="${t.showdownAlt}" class="showdown-img" width="1100" height="460" loading="eager" fetchpriority="high" />
        <div class="showdown-overlay-badge">${t.showdownBadge}</div>
      </div>
      <figcaption class="showdown-caption">
        ${t.showdownCaption}
      </figcaption>
    </figure>

    <!-- Interactive Jump Navigation Pills -->
    <nav class="comparison-toc" aria-label="${t.tocAria}">
      <a href="#core-matrix" class="toc-pill">📊 ${t.jumpCore}</a>
      <a href="#scoring-matrix" class="toc-pill">🎯 ${t.jumpScoring}</a>
      <a href="#playmaking-matrix" class="toc-pill">🅰️ ${t.jumpPlaymaking}</a>
      <a href="#intl-matrix" class="toc-pill">🏆 ${t.jumpIntl}</a>
      <a href="#h2h-matrix" class="toc-pill">⚔️ ${t.jumpH2H}</a>
      <a href="#faq" class="toc-pill">❓ ${t.jumpFaq}</a>
    </nav>

    <!-- Rank #0 Featured Snippet GOAT Verdict Box -->
    <section class="goat-verdict-box" aria-label="${t.verdictAria}">
      <div class="goat-verdict-badge">${t.verdictBadge}</div>
      <h2 class="goat-verdict-title">${t.verdictTitle}</h2>
      <p class="goat-verdict-summary">${t.verdictText}</p>
    </section>

    <!-- Dedicated Live GOAT Community Poll Card -->
    <section class="goat-poll-card" id="goat-community-poll" aria-label="${p.title}">
      <div class="goat-poll-header">
        <span class="goat-poll-badge">${p.badge}</span>
        <h2 class="goat-poll-title">${p.title}</h2>
        <p class="goat-poll-subtitle">${p.sub}</p>
      </div>

      <div class="goat-vote-buttons" id="goat-page-vote-buttons">
        <button type="button" class="btn-vote-candidate messi" data-vote="messi" aria-label="${p.votePrefix}${p.messiName}">
          <div class="candidate-badge-pill">${p.messiBadge}</div>
          <div class="candidate-avatar-wrap">
            <img src="/img/messi.webp" alt="Lionel Messi" class="candidate-avatar-img" width="76" height="76" loading="lazy" />
          </div>
          <span class="vote-name">${p.messiName}</span>
          <span class="vote-subtitle">${p.messiDesc}</span>
          <span class="vote-cta-action">${p.messiCta}</span>
        </button>
        <button type="button" class="btn-vote-candidate ronaldo" data-vote="ronaldo" aria-label="${p.votePrefix}${p.ronaldoName}">
          <div class="candidate-badge-pill">${p.ronaldoBadge}</div>
          <div class="candidate-avatar-wrap">
            <img src="/img/ronaldo.webp" alt="Cristiano Ronaldo" class="candidate-avatar-img" width="76" height="76" loading="lazy" />
          </div>
          <span class="vote-name">${p.ronaldoName}</span>
          <span class="vote-subtitle">${p.ronaldoDesc}</span>
          <span class="vote-cta-action">${p.ronaldoCta}</span>
        </button>
      </div>

      <div class="goat-vote-results" id="goat-page-vote-results" style="display:none;"></div>
    </section>

    <!-- 1. All-Time Career Overview Matrix Table -->
    <div class="shead"><h2>${t.coreHeader}</h2></div>
    <p class="comparison-intro-p">${t.coreIntro}</p>
    <div class="table-wrap card" id="core-matrix">
      <table class="data-table">
        <thead>
          <tr>
            <th scope="col" class="left">${t.tableStat}</th>
            <th scope="col">Lionel Messi</th>
            <th scope="col">Cristiano Ronaldo</th>
            <th scope="col" class="left">${t.tableLeader}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="left"><b>${t.statGoals}</b></td>
            <td>${S.goals}</td>
            <td><b style="color:#dc2626;">${S.rGoals}</b></td>
            <td class="left"><span class="leader-badge-ronaldo">${t.badgeRonaldoGoals}</span></td>
          </tr>
          <tr>
            <td class="left"><b>${t.statApps}</b></td>
            <td>${S.apps.toLocaleString("en-US")}</td>
            <td>${S.rApps.toLocaleString("en-US")}</td>
            <td class="left"><span class="leader-badge-messi">Messi (${S.fewer} ${lang === 'es' ? 'partidos menos' : lang === 'pt' ? 'jogos a menos' : lang === 'fr' ? 'matchs de moins' : 'fewer matches'})</span></td>
          </tr>
          <tr>
            <td class="left"><b>${t.statRatio}</b></td>
            <td><b style="color:var(--accent);">${S.gpg.toFixed(2)}</b></td>
            <td>${S.rGpg.toFixed(2)}</td>
            <td class="left"><span class="leader-badge-messi">Messi (+${(S.gpg - S.rGpg).toFixed(2)})</span></td>
          </tr>
          <tr>
            <td class="left"><b>${t.statAssists}</b></td>
            <td><b style="color:var(--accent);">${S.assists}+</b></td>
            <td>${S.rAssists}</td>
            <td class="left"><span class="leader-badge-messi">${t.badgeMessiAssists}</span></td>
          </tr>
          <tr>
            <td class="left"><b>${t.statGoalContrib}</b></td>
            <td><b style="color:var(--accent);">${S.ga.toLocaleString("en-US")}+</b></td>
            <td>${S.rGa.toLocaleString("en-US")}</td>
            <td class="left"><span class="leader-badge-messi">Messi (+${S.ga - S.rGa})</span></td>
          </tr>
          <tr>
            <td class="left"><b>${t.statContribRatio}</b></td>
            <td><b style="color:var(--accent);">${S.gaPerGame.toFixed(2)}</b></td>
            <td>${(S.rGa / S.rApps).toFixed(2)}</td>
            <td class="left"><span class="leader-badge-messi">Messi (+${(S.gaPerGame - (S.rGa / S.rApps)).toFixed(2)})</span></td>
          </tr>
          <tr>
            <td class="left"><b>${t.statMinsContrib}</b></td>
            <td><b style="color:var(--accent);">72 min</b></td>
            <td>88 min</td>
            <td class="left"><span class="leader-badge-messi">Messi (16 min)</span></td>
          </tr>
          <tr>
            <td class="left"><b>${t.statTrophies}</b></td>
            <td><b style="color:var(--accent);">${SPLITS.trophies.messi}</b></td>
            <td>${SPLITS.trophies.ronaldo}</td>
            <td class="left"><span class="leader-badge-messi">${t.badgeMessiTrophies}</span></td>
          </tr>
          <tr>
            <td class="left"><b>${t.statBallons}</b></td>
            <td><b style="color:var(--accent);">8</b></td>
            <td>5</td>
            <td class="left"><span class="leader-badge-messi">${t.badgeMessiBallon}</span></td>
          </tr>
          <tr>
            <td class="left"><b>${t.statGoldenShoes}</b></td>
            <td><b style="color:var(--accent);">6</b></td>
            <td>4</td>
            <td class="left"><span class="leader-badge-messi">Messi (+2)</span></td>
          </tr>
          <tr>
            <td class="left"><b>${t.statWorldCup}</b></td>
            <td><b style="color:var(--accent);">1 (2022)</b></td>
            <td>0</td>
            <td class="left"><span class="leader-badge-messi">${t.badgeMessiWC}</span></td>
          </tr>
          <tr>
            <td class="left"><b>${t.statH2HWins}</b></td>
            <td><b style="color:var(--accent);">16</b></td>
            <td>11</td>
            <td class="left"><span class="leader-badge-messi">${t.badgeMessiH2H}</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 2. Scoring Breakdown Matrix (Free Kicks, Penalties, Non-Penalty Goals) -->
    <div class="shead"><h2>${t.scoringHeader}</h2></div>
    <p class="comparison-intro-p">${t.scoringIntro}</p>
    <div class="table-wrap card" id="scoring-matrix">
      <table class="data-table">
        <thead>
          <tr>
            <th class="left">${t.tableStat}</th>
            <th>Lionel Messi</th>
            <th>Cristiano Ronaldo</th>
            <th class="left">${t.tableLeader}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="left"><b>${t.statNPG}</b></td>
            <td><b style="color:var(--accent);">${S.npg}</b></td>
            <td>${S.npgR}</td>
            <td class="left"><span class="leader-badge-messi">${t.badgeMessiNPG}</span></td>
          </tr>
          <tr>
            <td class="left"><b>${t.statNPGRatio}</b></td>
            <td><b style="color:var(--accent);">0.70</b></td>
            <td>0.59</td>
            <td class="left"><span class="leader-badge-messi">Messi (+0.11)</span></td>
          </tr>
          <tr>
            <td class="left"><b>${t.statFreeKicks}</b></td>
            <td><b style="color:var(--accent);">76</b></td>
            <td>64</td>
            <td class="left"><span class="leader-badge-messi">${t.badgeMessiFK}</span></td>
          </tr>
          <tr>
            <td class="left"><b>${t.statPenalties}</b></td>
            <td>${PEN.messiGoals} (${PEN.messiAttempts})</td>
            <td><b style="color:#dc2626;">${PEN.ronaldoGoals} (${PEN.ronaldoAttempts})</b></td>
            <td class="left"><span class="leader-badge-ronaldo">${t.badgeRonaldoPen}</span></td>
          </tr>
          <tr>
            <td class="left"><b>${t.statPenConversion}</b></td>
            <td>${PCT(PCT_NUM(PEN.messiGoals, PEN.messiAttempts), PCT_SEP[lang])}%</td>
            <td><b style="color:#dc2626;">${PCT(PCT_NUM(PEN.ronaldoGoals, PEN.ronaldoAttempts), PCT_SEP[lang])}%</b></td>
            <td class="left"><span class="leader-badge-ronaldo">Ronaldo (+${(PCT_NUM(PEN.ronaldoGoals, PEN.ronaldoAttempts) - PCT_NUM(PEN.messiGoals, PEN.messiAttempts)).toFixed(1)}%)</span></td>
          </tr>
          <tr>
            <td class="left"><b>${t.statHatTricks}</b></td>
            <td>62</td>
            <td><b style="color:#dc2626;">66</b></td>
            <td class="left"><span class="leader-badge-ronaldo">${t.badgeRonaldoHT}</span></td>
          </tr>
          <tr>
            <td class="left"><b>${t.statPokers}</b></td>
            <td>6</td>
            <td><b style="color:#dc2626;">11</b></td>
            <td class="left"><span class="leader-badge-ronaldo">Ronaldo (+5)</span></td>
          </tr>
          <tr>
            <td class="left"><b>${t.stat5Goals}</b></td>
            <td><b>2</b></td>
            <td><b>2</b></td>
            <td class="left"><span class="leader-badge-tie">${t.tied2All}</span></td>
          </tr>
          <tr>
            <td class="left"><b>${t.statOutsideBox}</b></td>
            <td><b style="color:var(--accent);">155+</b></td>
            <td>126+</td>
            <td class="left"><span class="leader-badge-messi">Messi (+29)</span></td>
          </tr>
          <tr>
            <td class="left"><b>${t.statOpenPlay}</b></td>
            <td><b style="color:var(--accent);">754</b></td>
            <td>730</td>
            <td class="left"><span class="leader-badge-messi">Messi (+24)</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 3. Playmaking & Creativity Matrix -->
    <div class="shead"><h2>${t.playmakingHeader}</h2></div>
    <p class="comparison-intro-p">${t.playmakingIntro}</p>
    <div class="table-wrap card" id="playmaking-matrix">
      <table class="data-table">
        <thead>
          <tr>
            <th class="left">${t.tableStat}</th>
            <th>Lionel Messi</th>
            <th>Cristiano Ronaldo</th>
            <th class="left">${t.tableLeader}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="left"><b>${t.statAllAssists}</b></td>
            <td><b style="color:var(--accent);">${S.assists}+</b></td>
            <td>${S.rAssists}</td>
            <td class="left"><span class="leader-badge-messi">${t.badgeMessiAssists}</span></td>
          </tr>
          <tr>
            <td class="left"><b>${t.statClubAssists}</b></td>
            <td><b style="color:var(--accent);">349+</b></td>
            <td>216</td>
            <td class="left"><span class="leader-badge-messi">Messi (+133)</span></td>
          </tr>
          <tr>
            <td class="left"><b>${t.statIntAssists}</b></td>
            <td><b style="color:var(--accent);">58+</b></td>
            <td>45</td>
            <td class="left"><span class="leader-badge-messi">Messi (+13)</span></td>
          </tr>
          <tr>
            <td class="left"><b>${t.statBigChances}</b></td>
            <td><b style="color:var(--accent);">${BIG_CHANCES.messi}+</b></td>
            <td>${BIG_CHANCES.ronaldo}+</td>
            <td class="left"><span class="leader-badge-messi">Messi (+${BIG_CHANCES.messi - BIG_CHANCES.ronaldo})</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 4. International & Finals Dominance Matrix -->
    <div class="shead"><h2>${t.intlHeader}</h2></div>
    <p class="comparison-intro-p">${t.intlIntro}</p>
    <div class="table-wrap card" id="intl-matrix">
      <table class="data-table">
        <thead>
          <tr>
            <th class="left">${t.tableStat}</th>
            <th>Lionel Messi</th>
            <th>Cristiano Ronaldo</th>
            <th class="left">${t.tableLeader}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="left"><b>${t.statWCTitles}</b></td>
            <td><b style="color:var(--accent);">1 (Qatar 2022)</b></td>
            <td>0</td>
            <td class="left"><span class="leader-badge-messi">Messi</span></td>
          </tr>
          <tr>
            <td class="left"><b>${t.statWCGoldenBall}</b></td>
            <td><b style="color:var(--accent);">2 (2014, 2022)</b></td>
            <td>0</td>
            <td class="left"><span class="leader-badge-messi">${t.badgeMessiRecord}</span></td>
          </tr>
          <tr>
            <td class="left"><b>${t.statWCGoals}</b></td>
            <td><b style="color:var(--accent);">${SPLITS.worldCup.messi.goals}</b></td>
            <td>${SPLITS.worldCup.ronaldo.goals}</td>
            <td class="left"><span class="leader-badge-messi">Messi (+${SPLITS.worldCup.messi.goals - SPLITS.worldCup.ronaldo.goals})</span></td>
          </tr>
          <tr>
            <td class="left"><b>${t.statWCAssists}</b></td>
            <td><b style="color:var(--accent);">${SPLITS.worldCup.messi.assists}</b></td>
            <td>${SPLITS.worldCup.ronaldo.assists}</td>
            <td class="left"><span class="leader-badge-messi">Messi (+${SPLITS.worldCup.messi.assists - SPLITS.worldCup.ronaldo.assists})</span></td>
          </tr>
          <tr>
            <td class="left"><b>${t.statWCKO}</b></td>
            <td><b style="color:var(--accent);">${t.goalsKnockoutMessi}</b></td>
            <td>${t.goalsKnockoutRonaldo}</td>
            <td class="left"><span class="leader-badge-messi">${t.wcKOStageMessi}</span></td>
          </tr>
          <tr>
            <td class="left"><b>${t.statWCKOAssists}</b></td>
            <td><b style="color:var(--accent);">${t.assistsKnockoutMessi}</b></td>
            <td>${t.assistsKnockoutRonaldo}</td>
            <td class="left"><span class="leader-badge-messi">Messi</span></td>
          </tr>
          <tr>
            <td class="left"><b>${t.statContTitles}</b></td>
            <td><b style="color:var(--accent);">${t.continentalMessi}</b></td>
            <td>${t.continentalRonaldo}</td>
            <td class="left"><span class="leader-badge-tie">${t.contTie}</span></td>
          </tr>
          <tr>
            <td class="left"><b>${t.statFinalsGoals}</b></td>
            <td><b style="color:var(--accent);">${t.finalsRecordMessi}</b></td>
            <td>${t.finalsRecordRonaldo}</td>
            <td class="left"><span class="leader-badge-messi">${t.badgeMessiFinals}</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Banner Ad Slot -->
    <aside aria-label="${t.adLabel}" class="ad-banner-wrap">
      <span class="ad-native-label">${t.adLabel}</span>
      <div class="ad-banner-slot">
        <iframe class="safe-ad-frame" src="/ads/hrf-300x250.html" width="300" height="250" sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox" title="Advertisement" scrolling="no"></iframe>
      </div>
    </aside>

    <!-- 5. 36 Direct Encounters (Head-to-Head Table) -->
    <div class="shead"><h2>${t.h2hHeader}</h2></div>
    <p class="comparison-intro-p">${t.h2hIntro}</p>
    <div class="kpis kpis-3" style="margin-bottom: 24px;">
      <div class="kpi">
        <span class="kpi-label">${t.kpiMessiWins}</span>
        <span class="kpi-value tnum" style="color:var(--accent);">16</span>
        <span class="kpi-note">22 ${t.kpiGoalsScored}</span>
      </div>
      <div class="kpi">
        <span class="kpi-label">${t.kpiDraws}</span>
        <span class="kpi-value tnum">9</span>
        <span class="kpi-note">${t.kpiEqualMatches}</span>
      </div>
      <div class="kpi">
        <span class="kpi-label">${t.kpiRonaldoWins}</span>
        <span class="kpi-value tnum" style="color:#dc2626;">11</span>
        <span class="kpi-note">21 ${t.kpiGoalsScored}</span>
      </div>
    </div>

    <div class="table-wrap card" id="h2h-matrix" style="margin-bottom: 32px;">
      <table class="data-table">
        <thead>
          <tr>
            <th scope="col" class="left">${t.thCompetition}</th>
            <th scope="col">${t.thMatches}</th>
            <th scope="col">${t.thMessiWins}</th>
            <th scope="col">${t.thDraws}</th>
            <th scope="col">${t.thRonaldoWins}</th>
            <th scope="col">${t.thMessiGoals}</th>
            <th scope="col">${t.thRonaldoGoals}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="left"><b>${t.compClasico}</b></td>
            <td>30</td>
            <td><b>14</b></td>
            <td>8</td>
            <td>8</td>
            <td><b>20</b></td>
            <td>18</td>
          </tr>
          <tr>
            <td class="left"><b>${t.compUCL}</b></td>
            <td>5</td>
            <td><b>2</b></td>
            <td>2</td>
            <td>1</td>
            <td><b>3</b></td>
            <td>2</td>
          </tr>
          <tr>
            <td class="left"><b>${t.compIntl}</b></td>
            <td>2</td>
            <td><b>1</b></td>
            <td>0</td>
            <td>1</td>
            <td><b>1</b></td>
            <td>1</td>
          </tr>
          <tr style="background:rgba(11, 111, 164, 0.05); font-weight:bold;">
            <td class="left">${t.tableTotal}</td>
            <td>36</td>
            <td><span class="leader-badge-messi">${t.badge16Wins}</span></td>
            <td>9</td>
            <td>${t.badge11Wins}</td>
            <td>22</td>
            <td>21</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- In-Content Banner Ad Slot (post-H2H, lazy: below fold) -->
    <aside aria-label="${t.adLabel}" class="ad-banner-wrap">
      <span class="ad-native-label">${t.adLabel}</span>
      <div class="ad-banner-slot">
        <iframe class="safe-ad-frame" src="/ads/hrf-300x250.html" width="300" height="250" sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox" title="Advertisement" scrolling="no" loading="lazy"></iframe>
      </div>
    </aside>

    <!-- VIRAL MAIN ATTRACTION: Birthday Promo Card -->
    <aside class="bday-promo-card" aria-label="${t.bdayPromoAria}">
      <div class="bday-promo-badge">${t.bdayPromoBadge}</div>
      <div class="bday-promo-body">
        <div class="bday-promo-text">
          <h3>${t.bdayTitle}</h3>
          <p>${t.bdayDesc}</p>
        </div>
        <a href="/en/birthday/02-05" class="btn btn-primary bday-promo-btn">${t.bdayBtn}</a>
      </div>
    </aside>

    <!-- Ad Slot -->
    <aside aria-label="${t.adLabel}" class="ad-native-wrap">
      <span class="ad-native-label">${t.adLabel}</span>
      <div class="ad-native-slot">
        <iframe class="safe-ad-frame safe-ad-native" src="/ads/prc-native-6160.html" style="width:100%;height:320px" sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox" title="Advertisement" scrolling="no"></iframe>
      </div>
    </aside>

    <!-- FAQ Accordion Section -->
    <div class="shead"><h2>${t.faqHeader}</h2></div>
    <div class="faq-accordion" id="faq">
${faqItemsHtml}
    </div>

    <!-- Post-FAQ Native Ad Slot (format alternation, lazy: below fold) -->
    <aside aria-label="${t.adLabel}" class="ad-native-wrap">
      <span class="ad-native-label">${t.adLabel}</span>
      <div class="ad-native-slot">
        <iframe class="safe-ad-frame safe-ad-native" src="/ads/prc-native-6161.html" style="width:100%;height:320px" sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox" title="Advertisement" scrolling="no" loading="lazy"></iframe>
      </div>
    </aside>

    <!-- Banner Ad Slot -->
    <aside aria-label="${t.adLabel}" class="ad-banner-wrap">
      <span class="ad-native-label">${t.adLabel}</span>
      <div class="ad-banner-slot">
        <iframe class="safe-ad-frame" src="/ads/hrf-300x250.html" width="300" height="250" sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox" title="Advertisement" scrolling="no"></iframe>
      </div>
    </aside>

    <!-- Support & Donation Card -->
    <section class="support-card" id="support" aria-label="${t.supportAria}">
      <div class="support-inner">
        <div class="support-icon">❤️</div>
        <div class="support-text">
          <h3>${t.supportTitle}</h3>
          <p>${t.supportText}</p>
        </div>
        <div class="support-actions">
          <a href="https://ko-fi.com/messistat" target="_blank" rel="noopener noreferrer" class="btn-support kofi">
            <span>${t.supportCta}</span>
          </a>
          <a href="https://t.me/messistatdotcom" target="_blank" rel="noopener noreferrer" class="btn-support tg">
            <span>Join Telegram Channel</span>
          </a>
        </div>
      </div>

      <div class="support-crypto-box">
        <div class="crypto-meta">
          <span class="crypto-badge">🪙 Crypto (BEP-20 / BNB Chain)</span>
          <span class="crypto-label">${t.cryptoLabel}</span>
        </div>
        <div class="crypto-copy-row">
          <code class="crypto-address" id="crypto-addr">0xe78ee7a6ce01978562c90df0fa3f775215457390</code>
          <button type="button" class="btn-copy-crypto" onclick="navigator.clipboard.writeText('0xe78ee7a6ce01978562c90df0fa3f775215457390'); this.textContent='${t.copiedMsg}'; setTimeout(()=>this.textContent='${t.copyBtn}', 2500);" aria-label="Copy BEP20 Wallet Address">
            ${t.copyBtn}
          </button>
        </div>
      </div>
    </section>

    <h2>${t.exploreTitle}</h2>
    <nav class="explore" id="explore"></nav>
    <footer class="site-footer">
      <nav class="footer-nav" aria-label="${t.siteDirAria}">
        <div class="footer-group">
          <span class="footer-heading">${t.footerDir}</span>
          <div class="footer-links">
            <a href="${slugPath}">${t.homeName}</a>
            <a href="${slugPath}/latest-goal">⚽ ${t.latestGoalName}</a>
            <a href="${slugPath}/birthday">🎂 ${t.bdayName}</a>
            <a href="${slugPath}/messi-vs-ronaldo">🐐 ${t.vsRonaldoName}</a>
            <a href="${slugPath}/vs-real-madrid">⚔️ ${t.vsRealMadridName}</a>
            <a href="${slugPath}/champions-league">⭐ ${t.uclName}</a>
            <a href="${slugPath}/goalsbyyear">${t.goalsByYearName}</a>
            <a href="${slugPath}/goalsbyseason">${t.goalsBySeasonName}</a>
            <a href="${slugPath}/dashboard">${t.dashboardName}</a>
            <a href="${slugPath}/timeline">${t.timelineName}</a>
            <a href="${slugPath}/achievements">${t.achievementsName}</a>
          </div>
        </div>
        <div class="footer-group">
          <span class="footer-heading">${t.footerIntl}</span>
          <div class="footer-links footer-langs">
            <a href="/en" hreflang="en">English (US, NG, IN, PH)</a>
            <a href="/es" hreflang="es">Español (Argentina, España)</a>
            <a href="/pt" hreflang="pt">Português (Brasil, Portugal)</a>
            <a href="/fr" hreflang="fr">Français (France, Niger)</a>
          </div>
        </div>
      </nav>
      <p id="foot-date"></p>
      <p class="crest-note">${t.crestNote}</p>
    </footer>
  </main>
</div>

<script src="/src/app.js" type="module"></script>
</body>
</html>
`;

  return html;
}

console.log("Generating 4 sophisticated /messi-vs-ronaldo pages...");
for (const lang of LANGS) {
  const html = generateHtml(lang);
  const targetFile = lang === "en" 
    ? path.join(rootDir, "messi-vs-ronaldo.html")
    : path.join(rootDir, lang, "messi-vs-ronaldo.html");
  
  fs.writeFileSync(targetFile, html, "utf8");
  console.log(`[PASS] Generated ${lang === "en" ? "" : lang + "/"}messi-vs-ronaldo.html (${(html.length / 1024).toFixed(1)} KB)`);
}

console.log("\nAll 4 Messi vs Ronaldo pages generated successfully!");
