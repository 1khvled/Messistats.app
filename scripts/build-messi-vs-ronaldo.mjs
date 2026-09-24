import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const LANGS = ["en", "es", "pt", "fr", "ar", "bn", "hi", "ro", "uz"];

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
    `  <link rel="alternate" hreflang="ar" href="https://www.messistat.com/ar/${slug}"/>`,
    `  <link rel="alternate" hreflang="ar-EG" href="https://www.messistat.com/ar/${slug}"/>`,
    `  <link rel="alternate" hreflang="bn" href="https://www.messistat.com/bn/${slug}"/>`,
    `  <link rel="alternate" hreflang="bn-BD" href="https://www.messistat.com/bn/${slug}"/>`,
    `  <link rel="alternate" hreflang="bn-IN" href="https://www.messistat.com/bn/${slug}"/>`,
    `  <link rel="alternate" hreflang="hi" href="https://www.messistat.com/hi/${slug}"/>`,
    `  <link rel="alternate" hreflang="hi-IN" href="https://www.messistat.com/hi/${slug}"/>`,
    `  <link rel="alternate" hreflang="ro" href="https://www.messistat.com/ro/${slug}"/>`,
    `  <link rel="alternate" hreflang="ro-RO" href="https://www.messistat.com/ro/${slug}"/>`,
    `  <link rel="alternate" hreflang="uz" href="https://www.messistat.com/uz/${slug}"/>`,
    `  <link rel="alternate" hreflang="uz-UZ" href="https://www.messistat.com/uz/${slug}"/>`,
    `  <link rel="alternate" hreflang="x-default" href="https://www.messistat.com/en/${slug}"/>`
  ].join("\n");
}

const I18N = {
  en: {
    dir: "ltr",
    title: "Messi vs Ronaldo | MessiStat",
    desc: "Lionel Messi vs Cristiano Ronaldo: 930 goals vs 979, 385+ assists vs 261, 821 non-penalty goals vs 795, 67 free kicks vs 65, 46 trophies vs 35, 8 Ballons d'Or vs 5. The definitive comparison.",
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
    verdictText: "Across all official senior matches, <b>Lionel Messi has scored 930 goals and provided 385+ assists in 1,176 appearances</b> (1.12 goal contributions per match), while <b>Cristiano Ronaldo holds the all-time goalscoring record with 979 goals and provided 261 assists in 1,337 appearances</b> (0.93 contributions per match). While Ronaldo leads the all-time goal tally (<b>979 vs 930</b>), Messi reached 930 goals in <b>161 fewer matches</b> with a higher scoring ratio (<b>0.79 vs 0.73</b>), leads in <b>non-penalty goals (821 vs 795)</b> and assists (<b>385+ vs 261</b>), won the <b>FIFA World Cup (2022)</b> with two Golden Balls, and leads in <b>Ballons d'Or (8 vs 5)</b> and <b>team trophies (46 vs 35)</b>.",
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
    faqHeader: "Frequently Asked Questions: Messi vs Ronaldo",
    exploreTitle: "Explore the full statistics",
    footerDir: "Career Records & Rivalries",
    footerIntl: "International Editions / Idiomas",
    crestNote: "Club crests are trademarks of their respective clubs, shown for identification purposes.",
    badgeRonaldoGoals: "Ronaldo (+49 goals, All-Time Record)",
    badgeMessiNPG: "Messi (+26 NPG)",
    badgeMessiFK: "Messi (+2 free kicks)",
    badgeRonaldoPen: "Ronaldo (+75 penalties)",
    badgeMessiAssists: "Messi (+124 assists)",
    badgeRonaldoHT: "Ronaldo (+7 hat-tricks)",
    badgeMessiWC: "Messi (Champion, 2x Golden Ball)",
    badgeMessiTrophies: "Messi (+11 trophies, World Record)",
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
    wcKOStageMessi: "Messi (R16, QF, SF, Final)",
    goalsKnockoutMessi: "5 Goals",
    goalsKnockoutRonaldo: "0 Goals",
    assistsKnockoutMessi: "6 Assists",
    assistsKnockoutRonaldo: "0 Assists",
    finalsRecordMessi: "35 Goals in 50 Finals",
    finalsRecordRonaldo: "22 Goals in 38 Finals",
    continentalMessi: "3 (2 Copas América, 1 Finalissima)",
    continentalRonaldo: "2 (1 Euro, 1 Nations League)",
    adLabel: "Advertisement",
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
        a: "Cristiano Ronaldo holds the all-time world record with 979 official senior career goals in 1,337 appearances (0.73 goals per match), while Lionel Messi has scored 930 goals in 1,176 appearances (0.79 goals per match). Ronaldo leads by 49 goals, though Messi has played 161 fewer matches and maintains a higher scoring ratio."
      },
      {
        q: "Who has more non-penalty goals: Messi or Ronaldo?",
        a: "Lionel Messi has scored 821 non-penalty goals in 1,176 matches (0.70 non-penalty goals per game). Cristiano Ronaldo has scored 795 non-penalty goals in 1,337 matches (0.59 per game). Messi leads Ronaldo by 26 non-penalty goals despite playing 161 fewer career games."
      },
      {
        q: "Who has scored more free kicks: Messi or Ronaldo?",
        a: "Lionel Messi leads Cristiano Ronaldo with 67 direct free-kick goals to Ronaldo's 65. Messi has scored 50 for Barcelona, 11 for Argentina, 4 for Inter Miami, and 2 for PSG. Ronaldo has scored 33 for Real Madrid, 15 for Manchester United, 11 for Portugal, 5 for Al-Nassr, and 1 for Juventus."
      },
      {
        q: "Who has more career assists: Messi or Ronaldo?",
        a: "Lionel Messi leads Cristiano Ronaldo by 124 assists. Messi has recorded over 385 official senior assists (over 327 in club football and 58+ for Argentina), making him the all-time assist leader in modern football history. Ronaldo has recorded 261 career assists."
      },
      {
        q: "Who has scored more penalties and what are their conversion rates?",
        a: "Cristiano Ronaldo has scored 184 penalties from 220 attempts (an 83.6% conversion rate). Lionel Messi has scored 109 penalties from 140 attempts (a 77.9% conversion rate). Ronaldo has scored 75 more penalties than Messi."
      },
      {
        q: "Who has more career hat-tricks: Messi or Ronaldo?",
        a: "Cristiano Ronaldo has scored 66 career hat-tricks (56 in club football, 10 for Portugal). Lionel Messi has scored 59 career hat-tricks (48 in club football, 10 for Argentina, 1 for Inter Miami). Ronaldo leads by 7 hat-tricks."
      },
      {
        q: "Who performed better in the FIFA World Cup: Messi or Ronaldo?",
        a: "Lionel Messi won the 2022 FIFA World Cup with Argentina, becoming the only player in history to win two FIFA World Cup Golden Balls (2014, 2022). In World Cup history, Messi has 13 goals and 8 assists in 26 games, including 5 goals in knockout rounds. Ronaldo has 8 goals and 2 assists in 22 matches, with 0 goals and 0 assists in World Cup knockout stages."
      },
      {
        q: "Who won more direct head-to-head matches between Messi and Ronaldo?",
        a: "In 36 official direct matches played between them, Messi's teams won 16, Ronaldo's teams won 11, and 9 ended in draws. Messi scored 22 goals in these matches; Ronaldo scored 21."
      },
      {
        q: "Who has won more trophies and Ballons d'Or?",
        a: "Lionel Messi holds the all-time world record with 46 senior team titles (including 10 La Ligas, 4 Champions Leagues, 2 Copas América, and 1 World Cup) compared to Ronaldo's 35 titles. Messi also holds the all-time record with 8 Ballons d'Or compared to Ronaldo's 5."
      },
      {
        q: "Why do most statistical analysts consider Messi the GOAT over Ronaldo?",
        a: "Statistical models favor Messi because of his dual dominance as both the world's elite goalscorer and its premier playmaker. Messi has a superior goal ratio (0.79 vs 0.73), more non-penalty goals (821 vs 795 in 161 fewer games), 124 more assists, superior minutes-per-goal involvement (72 min vs 88 min), and unparalleled international success crowned by the 2022 World Cup."
      }
    ]
  },
  es: {
    dir: "ltr",
    title: "Messi vs Ronaldo: Estadísticas, Tiros Libres, Penaltis y Cara a Cara | MessiStats",
    desc: "Lionel Messi vs Cristiano Ronaldo: 930 goluri vs 979, 385+ pase de gol vs 261, 821 goluri fără penalty vs 795, 67 lovituri libere vs 65, 46 trofee vs 35, 8 Baloane de Aur vs 5. Comparația definitivă.",
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
    verdictText: "În toate meciurile oficiale de seniori, <b>Lionel Messi a marcat 930 de goluri și a oferit peste 385 de pase de gol în 1.176 de partide</b> (1,12 contribuții la gol pe meci), în timp ce <b>Cristiano Ronaldo este cel mai bun marcator din istorie cu 979 de goluri și 261 de pase în 1.337 de meciuri</b> (0,93 contribuții pe meci). Deși Ronaldo conduce la numărul total de goluri (<b>979 vs 930</b>), Messi a atins borna de 930 în <b>161 de meciuri mai puține</b> cu o medie superioară (<b>0,79 vs 0,73</b>), are mai multe <b>goluri fără penalty (821 vs 795)</b> și pase decisive (<b>385+ vs 261</b>), a cucerit <b>Cupa Mondială FIFA (2022)</b> cu două Baloane de Aur și îl depășește pe Ronaldo la <b>Baloane de Aur (8 la 5)</b> și <b>trofee oficiale (46 la 35)</b>.",
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
    faqHeader: "Preguntas Frecuentes: Messi vs Cristiano Ronaldo",
    exploreTitle: "Explora las estadísticas completas",
    footerDir: "Récords y Rivalidades",
    footerIntl: "Ediciones Internacionales / Idiomas",
    crestNote: "Los escudos de clubes son marcas registradas de sus respectivos clubes, mostrados con fines de identificación.",
    badgeRonaldoGoals: "Ronaldo (+49 goles, récord histórico)",
    badgeMessiNPG: "Messi (+26 goles sin penalti)",
    badgeMessiFK: "Messi (+2 tiros libres)",
    badgeRonaldoPen: "Ronaldo (+75 penaltis)",
    badgeMessiAssists: "Messi (+124 asistencias)",
    badgeRonaldoHT: "Ronaldo (+7 hat-tricks)",
    badgeMessiWC: "Messi (Campeón, 2 Balones de Oro)",
    badgeMessiTrophies: "Messi (+11 títulos, récord mundial)",
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
    wcKOStageMessi: "Messi (Octavos, Cuartos, Semis, Final)",
    goalsKnockoutMessi: "5 Goles",
    goalsKnockoutRonaldo: "0 Goles",
    assistsKnockoutMessi: "6 Asistencias",
    assistsKnockoutRonaldo: "0 Asistencias",
    finalsRecordMessi: "35 Goles en 50 Finales",
    finalsRecordRonaldo: "22 Goles en 38 Finales",
    continentalMessi: "3 (2 Copas América, 1 Finalissima)",
    continentalRonaldo: "2 (1 Eurocopa, 1 Nations League)",
    adLabel: "Publicidad",
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
        a: "Cristiano Ronaldo tiene el récord mundial histórico absoluto con 979 goles oficiales en 1.337 partidos (0,73 goles por partido). Lionel Messi suma 930 goles en 1.176 partidos (0,79 goles por partido). Ronaldo aventaja a Messi por 49 goles, aunque Messi ha jugado 161 partidos menos y ostenta un mejor promedio goleador."
      },
      {
        q: "¿Quién tiene más goles sin contar penaltis?",
        a: "Lionel Messi suma 821 goles sin contar penaltis en 1.176 partidos (0,70 por partido). Cristiano Ronaldo registra 795 goles sin penalti en 1.337 encuentros (0,59 por partido). Messi aventaja a Ronaldo en 26 goles de jugada habiendo jugado 161 partidos menos."
      },
      {
        q: "¿Quién ha marcado más goles de tiro libre directo?",
        a: "Actualmente están igualados con 66 goles de falta directa cada uno en el fútbol profesional senior. Messi anotó 50 con el Barcelona, 11 con Argentina, 3 con Inter Miami y 2 con el PSG. Ronaldo marcó 33 con el Real Madrid, 15 con el Manchester United, 11 con Portugal, 6 con Al-Nassr y 1 con la Juventus."
      },
      {
        q: "¿Quién tiene más asistencias en su carrera: Messi o Ronaldo?",
        a: "Lionel Messi supera a Cristiano Ronaldo por más de 130 asistencias. Messi suma más de 385 asistencias oficiales (más de 300 en clubes y 58+ con Argentina), siendo el máximo asistente de la historia del fútbol. Ronaldo registra más de 255 asistencias."
      },
      {
        q: "¿Quién ha marcado más penaltis y cuál es su efectividad?",
        a: "Cristiano Ronaldo ha anotado 184 penaltis en 220 lanzamientos (83,6% de acierto). Lionel Messi ha marcado 109 penaltis en 140 lanzamientos (77,9% de acierto). Ronaldo ha marcado 75 penaltis más que Messi."
      },
      {
        q: "¿Quién tiene más hat-tricks: Messi o Ronaldo?",
        a: "Cristiano Ronaldo tiene 66 hat-tricks oficiales (56 en clubes y 10 con Portugal). Lionel Messi tiene 57 hat-tricks (48 en clubes y 9 con Argentina). Ronaldo lidera por 9 hat-tricks."
      },
      {
        q: "¿Quién rindió mejor en las Copas del Mundo de la FIFA?",
        a: "Lionel Messi se coronó campeón del Mundial de Catar 2022 con Argentina, siendo el único jugador de la historia en ganar dos Balones de Oro del Mundial (2014 y 2022). Acumula 13 goles y 8 asistencias en 26 partidos de Copa del Mundo, incluyendo 5 goles en rondas de eliminación directa. Ronaldo registra 8 goles y 2 asistencias en 22 partidos, con 0 goles y 0 asistencias en eliminatorias."
      },
      {
        q: "¿Quién ganó más partidos en los 36 duelos directos?",
        a: "En los 36 enfrentamientos directos oficiales, los equipos de Messi vencieron en 16 ocasiones, los de Ronaldo en 11 y hubo 9 empates. Messi marcó 22 goles en esos duelos y Ronaldo anotó 21."
      },
      {
        q: "¿Cuántos Balones de Oro y títulos tiene cada uno?",
        a: "Messi ostenta el récord mundial absoluto con 46 títulos colectivos (incluyendo 10 Ligas, 4 Champions, 2 Copas América y 1 Mundial) frente a los 35 de Ronaldo. Messi también posee el récord histórico con 8 Balones de Oro frente a los 5 de Ronaldo."
      },
      {
        q: "¿Por qué los análisis estadísticos consideran a Messi el GOAT?",
        a: "Los modelos analíticos favorecen a Messi por dominar simultáneamente el gol y la creación: mejor promedio goleador (0,79 vs 0,72), 62 goles más sin penalti en 105 partidos menos, más de 130 asistencias de ventaja, mejor promedio de minutos por gol/asistencia (72 min vs 88 min) y su coronación en el Mundial 2022."
      }
    ]
  },
  pt: {
    dir: "ltr",
    title: "Messi vs Ronaldo: Estatísticas, Faltas, Pênaltis e Frente a Frente | MessiStats",
    desc: "Lionel Messi vs Cristiano Ronaldo: 930 gols vs 979, 385+ assistências vs 261, 821 gols sem pênalti vs 795, 67 cobranças de falta vs 65, 46 títulos vs 35, 8 Bolas de Ouro vs 5. A comparação definitiva.",
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
    h1: "Lionel Messi vs Cristiano Ronaldo",
    lead: "O comparativo estatístico definitivo entre os dois maiores ícones do futebol moderno. Gols totais, gols sem pênalti, faltas, pênaltis, assistências, títulos, prêmios individuais e os 36 confrontos diretos.",
    verdictBadge: "O VEREDITO DO GOAT • DADOS OFICIAIS COMPLETOS",
    verdictTitle: "Quem tem as melhores estatísticas de carreira: Messi ou Ronaldo?",
    verdictText: "Em todos os jogos oficiais seniores, <b>Lionel Messi marcou 930 gols e distribuiu mais de 385 assistências em 1.176 jogos</b> (1,12 participações em gol por partida), enquanto <b>Cristiano Ronaldo é o maior artilheiro de todos os tempos com 979 gols e 261 assistências em 1.337 jogos</b> (0,93 participações por partida). Embora Ronaldo lidere em gols totais (<b>979 contra 930</b>), Messi alcançou seus gols em <b>161 jogos a menos</b> com melhor média (<b>0,79 contra 0,73</b>), tem mais <b>gols sem pênalti (821 contra 795)</b> e assistências (<b>385+ contra 261</b>), conquistou a <b>Copa do Mundo FIFA (2022)</b> com duas Bolas de Ouro, e lidera em <b>Bolas de Ouro (8 a 5)</b> e <b>títulos oficiais (46 a 35)</b>.",
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
    faqHeader: "Perguntas Frequentes: Messi vs Cristiano Ronaldo",
    exploreTitle: "Explore todas as estatísticas",
    footerDir: "Recordes e Rivalidades",
    footerIntl: "Edições Internacionais / Idiomas",
    crestNote: "Os escudos dos clubes são marcas registradas de seus respectivos times, exibidos para fins de identificação.",
    badgeRonaldoGoals: "Ronaldo (+49 gols, recorde histórico)",
    badgeMessiNPG: "Messi (+26 gols sem pênalti)",
    badgeMessiFK: "Messi (+2 faltas diretas)",
    badgeRonaldoPen: "Ronaldo (+75 pênaltis)",
    badgeMessiAssists: "Messi (+124 assistências)",
    badgeRonaldoHT: "Ronaldo (+7 hat-tricks)",
    badgeMessiWC: "Messi (Campeão, 2 Bolas de Ouro)",
    badgeMessiTrophies: "Messi (+11 títulos, recorde mundial)",
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
    wcKOStageMessi: "Messi (Oitavas, Quartas, Semis, Final)",
    goalsKnockoutMessi: "5 Gols",
    goalsKnockoutRonaldo: "0 Gols",
    assistsKnockoutMessi: "6 Assistências",
    assistsKnockoutRonaldo: "0 Assistências",
    finalsRecordMessi: "35 Gols em 50 Finais",
    finalsRecordRonaldo: "22 Gols em 38 Finais",
    continentalMessi: "3 (2 Copas América, 1 Finalíssima)",
    continentalRonaldo: "2 (1 Eurocopa, 1 Liga das Nações)",
    adLabel: "Publicidade",
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
        a: "Cristiano Ronaldo detém o recorde mundial absoluto com 979 gols oficiais em 1.337 jogos (0,73 gols por jogo). Lionel Messi marcou 930 gols em 1.176 jogos (0,79 gols por jogo). Ronaldo lidera por 49 gols, mas Messi disputou 161 jogos a menos e possui média superior."
      },
      {
        q: "Quem tem mais gols sem contar cobranças de pênalti?",
        a: "Lionel Messi tem 821 gols sem pênalti em 1.176 jogos (0,70 por jogo). Cristiano Ronaldo soma 795 gols sem pênalti em 1.337 jogos (0,59 por jogo). Messi tem 26 gols sem pênalti a mais jogando 161 partidas a menos."
      },
      {
        q: "Quem marcou mais gols de falta direta na carreira?",
        a: "Atualmente eles estão empatados com 66 gols de falta direta cada um. Messi marcou 50 pelo Barcelona, 11 pela Argentina, 3 pelo Inter Miami e 2 pelo PSG. Ronaldo marcou 33 pelo Real Madrid, 15 pelo Manchester United, 11 por Portugal, 6 pelo Al-Nassr e 1 pela Juventus."
      },
      {
        q: "Quem tem mais assistências oficiais: Messi ou Ronaldo?",
        a: "Lionel Messi lidera com 124 assistências a mais que Cristiano Ronaldo. Messi soma mais de 385 assistências oficiais (mais de 327 por clubes e 58+ pela Argentina), sendo o maior garçom da história do futebol moderno. Ronaldo tem 261 assistências."
      },
      {
        q: "Quem marcou mais gols de pênalti e qual é a taxa de conversão?",
        a: "Cristiano Ronaldo converteu 184 pênaltis em 220 cobranças (83,6% de aproveitamento). Lionel Messi converteu 109 pênaltis em 140 cobranças (77,9% de aproveitamento). Ronaldo marcou 75 pênaltis a mais que Messi."
      },
      {
        q: "Quem tem mais hat-tricks na carreira: Messi ou Ronaldo?",
        a: "Cristiano Ronaldo marcou 66 hat-tricks (56 por clubes e 10 por Portugal). Lionel Messi marcou 57 hat-tricks (48 por clubes e 9 pela Argentina). Ronaldo lidera por 9 hat-tricks."
      },
      {
        q: "Quem teve melhor desempenho em Copas do Mundo da FIFA?",
        a: "Lionel Messi foi campeão da Copa do Mundo no Catar 2022 pela Argentina, sendo o único jogador da história a vencer duas Bolas de Ouro da Copa (2014 e 2022). Em Mundiais, Messi tem 13 gols e 8 assistências em 26 jogos, com 5 gols no mata-mata. Ronaldo tem 8 gols e 2 assistências em 22 jogos, com 0 gols e 0 assistências no mata-mata."
      },
      {
        q: "Quem venceu mais jogos nos 36 confrontos diretos?",
        a: "Nos 36 jogos oficiais diretos, os times de Messi venceram 16 vezes, os de Ronaldo venceram 11 vezes e houve 9 empates. Messi marcou 22 gols nesses jogos; Ronaldo marcou 21."
      },
      {
        q: "Quantas Bolas de Ouro e títulos cada um conquistou?",
        a: "Messi detém o recorde mundial absoluto com 46 títulos coletivos (incluindo 10 La Ligas, 4 Champions, 2 Copas América e 1 Copa do Mundo) contra 35 títulos de Ronaldo. Messi também detém o recorde histórico com 8 Bolas de Ouro contra 5 de Ronaldo."
      },
      {
        q: "Por que analistas estatísticos consideram Messi o GOAT?",
        a: "Modelos analíticos apontam Messi no topo por dominar tanto a finalização quanto a armação: melhor média de gols (0,79 vs 0,73), 26 gols sem pênalti a mais em 161 jogos a menos, 124 assistências de vantagem, melhor ritmo de minutos por participação em gol (72 min vs 88 min) e o título da Copa do Mundo de 2022."
      }
    ]
  },
  fr: {
    dir: "ltr",
    title: "Messi vs Ronaldo : Statistiques, Coups Francs, Penaltys et Face-à-Face | MessiStat",
    desc: "Lionel Messi vs Cristiano Ronaldo : 930 buts vs 979, 385+ passes décisives vs 261, 821 buts hors penalty vs 795, 67 coups francs vs 65, 46 trophées vs 35, 8 Ballons d'Or vs 5. La comparaison ultime.",
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
    verdictText: "En matchs officiels de haut niveau, <b>Lionel Messi a marqué 930 buts et délivré plus de 385 passes décisives en 1 176 apparitions</b> (1,12 action de but par match), tandis que <b>Cristiano Ronaldo détient le record absolu avec 979 buts et 261 passes en 1 337 matchs</b> (0,93 action par match). Si Ronaldo domine le total de buts (<b>979 contre 930</b>), Messi a atteint ses 930 buts avec <b>161 matchs de moins</b> et un meilleur ratio (<b>0,79 contre 0,73</b>), compte plus de <b>buts hors penalty (821 contre 795)</b> et de passes (<b>385+ contre 261</b>), a remporté la <b>Coupe du Monde FIFA (2022)</b> avec deux Ballons d'Or du tournoi, et domine au <b>Ballon d'Or (8 contre 5)</b> et en <b>titres officiels (46 contre 35)</b>.",
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
    faqHeader: "Foire Aux Questions : Messi vs Ronaldo",
    exploreTitle: "Explorer toutes les statistiques",
    footerDir: "Records et Rivalités",
    footerIntl: "Éditions Internationales / Langues",
    crestNote: "Les logos de clubs sont des marques déposées de leurs propriétaires respectifs, utilisés à des fins d'identification.",
    badgeRonaldoGoals: "Ronaldo (+49 buts, record historique)",
    badgeMessiNPG: "Messi (+26 buts hors penalty)",
    badgeMessiFK: "Messi (+2 coups francs)",
    badgeRonaldoPen: "Ronaldo (+75 penaltys)",
    badgeMessiAssists: "Messi (+130 passes décisives)",
    badgeRonaldoHT: "Ronaldo (+7 triplés)",
    badgeMessiWC: "Messi (Champion, 2 Ballons d'Or)",
    badgeMessiTrophies: "Messi (+11 trophées, record mondial)",
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
    wcKOStageMessi: "Messi (8es, 1/4, 1/2, Finale)",
    goalsKnockoutMessi: "5 Buts",
    goalsKnockoutRonaldo: "0 But",
    assistsKnockoutMessi: "6 Passes décisives",
    assistsKnockoutRonaldo: "0 Passe",
    finalsRecordMessi: "35 Buts en 50 Finales",
    finalsRecordRonaldo: "22 Buts en 38 Finales",
    continentalMessi: "3 (2 Copas América, 1 Finalissima)",
    continentalRonaldo: "2 (1 Euro, 1 Ligue des Nations)",
    adLabel: "Publicité",
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
        a: "Cristiano Ronaldo détient le record mondial de l'histoire du football avec 979 buts officiels en 1 337 apparitions (0,73 but par match). Lionel Messi compte 930 buts en 1 176 apparitions (0,79 but par match). Ronaldo mène de 49 buts, mais Messi compte 161 matchs de moins et affiche une meilleure moyenne."
      },
      {
        q: "Qui a inscrit le plus de buts hors penalty ?",
        a: "Lionel Messi compte 821 buts hors penalty en 1 176 matchs (0,70 par match). Cristiano Ronaldo totalise 795 buts hors penalty en 1 337 matchs (0,59 par match). Messi devance Ronaldo de 26 buts hors penalty en ayant disputé 161 matchs de moins."
      },
      {
        q: "Qui a marqué le plus de coups francs directs ?",
        a: "Les deux géants sont à égalité parfaite avec 66 buts sur coup franc direct chacun. Messi en compte 50 avec Barcelone, 11 avec l'Argentine, 3 avec l'Inter Miami et 2 avec le PSG. Ronaldo en compte 33 avec le Real Madrid, 15 avec Manchester United, 11 avec le Portugal, 6 avec Al-Nassr et 1 avec la Juventus."
      },
      {
        q: "Qui a délivré le plus de passes décisives : Messi ou Ronaldo ?",
        a: "Lionel Messi possède plus de 130 passes décisives d'avance sur Cristiano Ronaldo. Messi cumule plus de 385 passes décisives officielles (plus de 300 en clubs et 58+ avec l'Argentine), constituant le record absolu de l'histoire du football. Ronaldo en compte plus de 255."
      },
      {
        q: "Qui a marqué le plus de penaltys et quel est leur taux de réussite ?",
        a: "Cristiano Ronaldo a transformé 184 penaltys sur 220 tentatives (83,6% de réussite). Lionel Messi a transformé 109 penaltys sur 140 tentatives (77,9% de réussite). Ronaldo compte 75 penaltys réussis de plus que Messi."
      },
      {
        q: "Qui compte le plus de triplés (hat-tricks) en carrière ?",
        a: "Cristiano Ronaldo a inscrit 66 triplés (56 en club, 10 en sélection). Lionel Messi en a signé 57 (48 en club, 9 en sélection). Ronaldo mène de 9 triplés."
      },
      {
        q: "Qui a été le plus performant en Coupe du Monde de la FIFA ?",
        a: "Lionel Messi a remporté la Coupe du Monde au Qatar en 2022 avec l'Argentine, devenant le seul joueur de l'histoire à remporter deux Ballons d'Or de la Coupe du Monde (2014 et 2022). En Coupe du Monde, Messi compte 13 buts et 8 passes décisives en 26 matchs, dont 5 buts en matchs à élimination directe. Ronaldo compte 8 buts et 2 passes en 22 matchs, avec 0 but et 0 passe en phase à élimination directe."
      },
      {
        q: "Qui a remporté le plus de duels directs lors de leurs 36 matchs ?",
        a: "Lors de leurs 36 confrontations directes officielles, les équipes de Messi l'ont emporté à 16 reprises, celles de Ronaldo à 11 reprises, et 9 matchs se sont soldés par un nul. Messi a inscrit 22 buts dans ces chocs, Ronaldo 21."
      },
      {
        q: "Combien de Ballons d'Or et de trophées possèdent-ils chacun ?",
        a: "Messi détient le record mondial absolu avec 46 titres collectifs (dont 10 Liga, 4 Ligue des Champions, 2 Copa América et 1 Coupe du Monde) contre 35 pour Ronaldo. Messi détient également le record avec 8 Ballons d'Or contre 5 pour Ronaldo."
      },
      {
        q: "Pourquoi les analystes statistiques placent-ils Messi comme le GOAT ?",
        a: "Les modèles statistiques consacrent Messi car il associe une finition hors normes à une créativité unique : meilleur ratio de buts (0,79 vs 0,72), 62 buts hors penalty de plus en 105 matchs de moins, plus de 130 passes d'avance, un temps de participation par but plus rapide (72 min vs 88 min) et son sacre mondial en 2022."
      }
    ]
  },
  ar: {
    dir: "rtl",
    title: "ميسي ضد رونالدو: الأهداف التاريخية، الركلات الحرة، ضربات الجزاء والمواجهات المباشرة | ميسي ستات",
    desc: "ليونيل ميسي ضد كريستيانو رونالدو: 930 هدفاً مقابل 979، أكثر من 385 تمريرة حاسمة مقابل 261، 821 هدفاً بدون ركلات جزاء مقابل 795، 67 ركلة حرة مقابل 65، 46 بطولة مقابل 35، 8 كرات ذهبية مقابل 5. المقارنة الشاملة.",
    keywords: "ميسي ضد رونالدو, احصائيات ميسي ضد رونالدو, ركلات حرة ميسي ضد رونالدو, ركلات جزاء ميسي ضد رونالدو, اهداف بدون ركلات جزاء, تمريرات حاسمة ميسي ضد رونالدو, هاتريك ميسي ضد رونالدو, من الافضل ميسي ام رونالدو, من سجل اهداف اكثر ميسي ام رونالدو, المواجهات المباشرة ميسي ضد رونالدو, كاس العالم, كرات ذهبية, بطولات",
    brand: "ميسي ستات",
    homeName: "الرئيسية",
    latestGoalName: "آخر هدف",
    bdayName: "أهداف عيد الميلاد",
    vsRonaldoName: "ضد رونالدو",
    vsRealMadridName: "ضد ريال مدريد",
    uclName: "دوري الأبطال",
    goalsByYearName: "الأهداف بالسنة",
    goalsBySeasonName: "الأهداف بالموسم",
    dashboardName: "لوحة البيانات",
    timelineName: "المسار التاريخي",
    achievementsName: "البطولات والجوائز",
    skipText: "تخطي إلى المحتوى",
    eyebrow: "المواجهة التاريخية الكبرى <i></i> <span>مقارنة المسيرة والمواجهات المباشرة</span>",
    h1: "ليونيل ميسي ضد كريستيانو رونالدو",
    lead: "المقارنة الإحصائية الشاملة والنهائية بين أسطورتي كرة القدم عبر التاريخ. إجمالي الأهداف، الأهداف بدون ركلات جزاء، الركلات الحرة، ضربات الجزاء، التمريرات الحاسمة، الألقاب الجماعية، الجوائز الفردية وكافة المواجهات المباشرة الـ 36.",
    verdictBadge: "حكم الأفضل في التاريخ • الأرقام الرسمية الكاملة",
    verdictTitle: "من يمتلك أرقاماً تاريخية أفضل: ميسي أم كريستيانو رونالدو؟",
    verdictText: "عبر كافة المباريات الرسمية، <b>سجل ليونيل ميسي 930 هدفاً وقدم أكثر من 385 تمريرة حاسمة في 1,176 مباراة</b> (بمعدل 1.12 مساهمة تهديفية في المباراة)، بينما <b>يحمل كريستيانو رونالدو الرقم القياسي التاريخي بتسجيله 979 هدفاً و261 تمريرة حاسمة في 1,337 مباراة</b> (0.93 مساهمة في المباراة). ورغم تصدر رونالدو قائمة الهدافين التاريخيين (<b>979 مقابل 930</b>)، فإن ميسي حقق أهدافه في <b>161 مباراة أقل</b> وبمعدل تهديفي أعلى (<b>0.79 مقابل 0.73</b>)، ويتفوق في <b>الأهداف بدون ركلات جزاء (821 مقابل 795)</b> والتمريرات الحاسمة (<b>385+ مقابل 261</b>)، وتوج بلقب <b>كأس العالم FIFA (2022)</b> مع كرتين ذهبيتين للبطولة، ويتفوق في <b>الكرات الذهبية (8 مقابل 5)</b> والبطولات الرسمية (<b>46 مقابل 35</b>).",
    tableStat: "الإحصائية",
    tableLeader: "الأفضلية",
    coreHeader: "إجمالي المسيرة الاحترافية الكبرى",
    coreIntro: "الأرقام الرسمية المعتمدة في بطولات الأندية الكبرى والمنتخبات الوطنية الأولى.",
    statGoals: "الأهداف الرسمية في المسيرة الاحترافية",
    statApps: "المباريات الرسمية الملعوبة",
    statRatio: "معدل التهديف في المباراة",
    statAssists: "التمريرات الحاسمة (الأسيست)",
    statGoalContrib: "المساهمات التهديفية (أهداف + تمريرات)",
    statContribRatio: "معدل المساهمة في المباراة",
    statMinsContrib: "دقائق لكل مساهمة تهديفية",
    statTrophies: "البطولات الجماعية الرسمية",
    statBallons: "جوائز الكرة الذهبية",
    statGoldenShoes: "الحذاء الذهبي الأوروبي",
    statWorldCup: "كأس العالم FIFA",
    statH2HWins: "الانتصارات في المواجهات المباشرة",
    scoringHeader: "تفاصيل الأهداف: الركلات الحرة، ركلات الجزاء والأهداف من اللعب المفتوح",
    scoringIntro: "تحليل دقيق لكيفية تسجيل كل لاعب لأهدافه وقوته في اللعب المفتوح والكرات الثابتة.",
    statNPG: "الأهداف بدون ركلات جزاء (NPG)",
    statNPGRatio: "معدل الأهداف بدون ركلات جزاء",
    statFreeKicks: "أهداف الركلات الحرة المباشرة",
    statPenalties: "ركلات الجزاء المسجلة (المسددة)",
    statPenConversion: "نسبة نجاح ركلات الجزاء",
    statHatTricks: "الهاتريك في المسيرة",
    statPokers: "مباريات السوبر هاتريك (4 أهداف)",
    stat5Goals: "مباريات تسجيل 5 أهداف",
    statOutsideBox: "الأهداف من خارج منطقة الجزاء",
    statOpenPlay: "أهداف من اللعب المفتوح",
    playmakingHeader: "صناعة اللعب، التمريرات الحاسمة والتأثير الهجومي",
    playmakingIntro: "التمريرات الحاسمة، خلق الفرص المحققة وصناعة اللعب بعيداً عن مجرد إنهاء الهجمات.",
    statAllAssists: "إجمالي التمريرات الحاسمة في المسيرة",
    statClubAssists: "التمريرات الحاسمة مع الأندية",
    statIntAssists: "التمريرات الحاسمة مع المنتخب",
    statBigChances: "الفرص الكبرى المصنوعة",
    intlHeader: "المشاركات الدولية مع المنتخبات والنهائيات الكبرى",
    intlIntro: "السجل في أكبر المحافل الرياضية العالمية: كأس العالم والنهائيات التتويجية.",
    statWCTitles: "ألقاب كأس العالم",
    statWCGoldenBall: "الكرة الذهبية في كأس العالم (أفضل لاعب)",
    statWCGoals: "الأهداف في كأس العالم",
    statWCAssists: "التمريرات الحاسمة في كأس العالم",
    statWCKO: "الأهداف في الأدوار الإقصائية لكأس العالم",
    statWCKOAssists: "التمريرات الحاسمة في الأدوار الإقصائية",
    statContTitles: "الألقاب القارية مع المنتخب الأول",
    statFinalsGoals: "الأهداف المسجلة في نهائيات الكؤوس",
    h2hHeader: "المواجهات المباشرة الـ 36 وجهاً لوجه",
    h2hIntro: "سجل اللقاءات الـ 36 الرسمية التي جمعت ميسي ورونالدو على أرض الملعب.",
    kpiMessiWins: "انتصارات ميسي",
    kpiDraws: "التعادلات",
    kpiRonaldoWins: "انتصارات رونالدو",
    kpiGoalsScored: "الأهداف المسجلة",
    kpiEqualMatches: "مباريات متكافئة",
    compClasico: "الكلاسيكو (برشلونة ضد ريال مدريد)",
    compUCL: "دوري أبطال أوروبا",
    compIntl: "المباريات الودية الدولية",
    bdayTitle: "هل سجل ميسي في يوم ميلاد كريستيانو رونالدو؟",
    bdayDesc: "ولد كريستيانو رونالدو في 5 فبراير. اكتشف ما فعله ميسي يوم 5 فبراير وجرب يوم ميلادك أيضاً!",
    bdayBtn: "تحقق من 5 فبراير ⚽",
    faqHeader: "الأسئلة الشائعة: ميسي ضد رونالدو",
    exploreTitle: "استكشف كافة الإحصائيات",
    footerDir: "الأرقام القياسية والمنافسات",
    footerIntl: "النسخ الدولية / اللغات",
    crestNote: "شعارات الأندية علامات تجارية لأنديتها وتُعرض لغايات التعريف بالفرق فقط.",
    badgeRonaldoGoals: "رونالدو (+49 هدفاً، الرقم القياسي التاريخي)",
    badgeMessiNPG: "ميسي (+62 هدفاً بدون جزاء)",
    badgeMessiFK: "ميسي (+2 ضربات حرة)",
    badgeRonaldoPen: "رونالدو (+75 ركلة جزاء)",
    badgeMessiAssists: "ميسي (+124 تمريرة حاسمة)",
    badgeRonaldoHT: "رونالدو (+7 هاتريك)",
    badgeMessiWC: "ميسي (بطل العالم، كرتان ذهبيتان)",
    badgeMessiTrophies: "ميسي (+11 لقباً، رقم قياسي عالمي)",
    badgeMessiBallon: "ميسي (+3 كرات ذهبية، رقم قياسي)",
    badgeMessiH2H: "ميسي (+5 انتصارات، 16 مقابل 11)",
    badgeMessiFinals: "ميسي (+13 هدفاً في النهائيات)",
        thCompetition: "البطولة",
    thMatches: "المباريات",
    thMessiWins: "فوز ميسي",
    thDraws: "التعادل",
    thRonaldoWins: "فوز رونالدو",
    thMessiGoals: "أهداف ميسي",
    thRonaldoGoals: "أهداف رونالدو",
    tableTotal: "المجموع",
    badge16Wins: "16 فوز",
    badge11Wins: "11 فوز",
    tied2All: "تعادل (2 لكل منهما)",
    badgeMessiRecord: "ميسي (رقم قياسي)",
    wcKOStageMessi: "ميسي (ثمن، ربع، نصف النهائي، والنهائي)",
    goalsKnockoutMessi: "5 أهداف",
    goalsKnockoutRonaldo: "0 هدف",
    assistsKnockoutMessi: "6 تمريرات حاسمة",
    assistsKnockoutRonaldo: "0 تمريرة",
    finalsRecordMessi: "35 هدفاً في 50 نهائي",
    finalsRecordRonaldo: "22 هدفاً في 38 نهائي",
    continentalMessi: "3 (2 كوبا أمريكا، 1 فيناليسيما)",
    continentalRonaldo: "2 (1 يورو، 1 دوري الأمم)",
    adLabel: "إعلان",
    bdayPromoBadge: "🎂 أداة تفاعلية فريدة",
    bdayPromoAria: "هل سجل ميسي في يوم ميلادك؟",
    jumpCore: "إجمالي المسيرة",
    jumpScoring: "الضربات الحرة وركلات الجزاء",
    jumpPlaymaking: "صناعة اللعب والتمريرات",
    jumpIntl: "كأس العالم والمباريات النهائية",
    jumpH2H: "36 مواجهة مباشرة",
    jumpFaq: "الأسئلة الشائعة",
    faqs: [
      {
        q: "من سجل أهدافاً أكثر في مسيرته: ميسي أم كريستيانو رونالدو؟",
        a: "يحمل كريستيانو رونالدو الرقم القياسي العالمي التاريخي برصيد 979 هدفاً رسمياً في 1,337 مباراة (0.73 هدف في المباراة). وسجل ليونيل ميسي 930 هدفاً في 1,176 مباراة (0.79 هدف في المباراة). يتقدم رونالدو بفارق 49 هدفاً، لكن ميسي لعب 161 مباراة أقل ويمتلك معدلاً تهديفياً أعلى."
      },
      {
        q: "من سجل أهدافاً أكثر بدون احتساب ركلات الجزاء؟",
        a: "سجل ليونيل ميسي 821 هدفاً بدون ركلات جزاء في 1,176 مباراة (0.70 في المباراة)، بينما سجل كريستيانو رونالدو 795 هدفاً بدون ركلات جزاء في 1,337 مباراة (0.59 في المباراة). يتفوق ميسي بفارق 26 هدفاً بدون ركلات جزاء رغم لعبه 161 مباراة أقل."
      },
      {
        q: "من سجل أهدافاً أكثر من ركلات حرة مباشرة؟",
        a: "يتعادل ميسي ورونالدو حالياً بـ 66 هدفاً من ركلة حرة مباشرة لكل منهما في كرة القدم الاحترافية. سجل ميسي 50 مع برشلونة، 11 مع الأرجنتين، 3 مع إنتر ميامي وهدفين مع باريس. وسجل رونالدو 33 مع ريال مدريد، 15 مع مانشستر يونايتد، 11 مع البرتغال، 6 مع النصر وهدفاً مع يوفنتوس."
      },
      {
        q: "من صنع أهدافاً أكثر (تمريرات حاسمة): ميسي أم رونالدو؟",
        a: "يتفوق ليونيل ميسي على كريستيانو رونالدو بأكثر من 130 تمريرة حاسمة. يمتلك ميسي أكثر من 385 تمريرة حاسمة رسمية (أكثر من 300 مع الأندية و58+ مع الأرجنتين)، وهو صاحب الرقم القياسي التاريخي في صناعة الأهداف. بينما يمتلك رونالدو 255+ أسيست."
      },
      {
        q: "من سجل ركلات جزاء أكثر وما هي نسبة نجاح كل منهما؟",
        a: "سجل كريستيانو رونالدو 184 ركلة جزاء من 220 محاولة (نسبة نجاح 83.6%). وسجل ليونيل ميسي 109 ركلات جزاء من 140 محاولة (نسبة نجاح 77.9%). سجل رونالدو 75 ركلة جزاء أكثر من ميسي."
      },
      {
        q: "من سجل هاتريك أكثر في مسيرته: ميسي أم رونالدو؟",
        a: "سجل كريستيانو رونالدو 66 هاتريك (56 مع الأندية و10 مع البرتغال). بينما سجل ليونيل ميسي 57 هاتريك (48 مع الأندية و9 مع الأرجنتين). يتفوق رونالدو بفارق 9 هاتريك."
      },
      {
        q: "من كان الأفضل في بطولات كأس العالم FIFA؟",
        a: "توج ليونيل ميسي بلقب كأس العالم في قطر 2022 مع الأرجنتين، وهو اللاعب الوحيد في تاريخ كرة القدم الذي فاز بجائزة الكرة الذهبية لأفضل لاعب في المونديال مرتين (2014 و2022). يمتلك ميسي 13 هدفاً و8 تمريرات حاسمة في 26 مباراة مونديالية، منها 5 أهداف في الأدوار الإقصائية. بينما يمتلك رونالدو 8 أهداف وتمريرتين في 22 مباراة، بدون أي هدف أو أسيست في الأدوار الإقصائية للمونديال."
      },
      {
        q: "من فاز أكثر في المواجهات المباشرة الـ 36 بينهما؟",
        a: "في 36 مواجهة مباشرة جمعتهما، فازت فرق ميسي في 16 مباراة، وفازت فرق رونالدو في 11 مباراة، وانتهت 9 مباريات بالتعادل. سجل ميسي 22 هدفاً في هذه المباريات، وسجل رونالدو 21 هدفاً."
      },
      {
        q: "كم عدد الكرات الذهبية والبطولات لكل منهما؟",
        a: "يمتلك ليونيل ميسي الرقم القياسي العالمي المطلق بـ 46 بطولة رسمية (تشمل 10 دوري إسباني، 4 دوري أبطال أوروبا، 2 كوبا أمريكا، وكأس العالم) مقابل 35 بطولة لرونالدو. كما يمتلك ميسي الرقم القياسي التاريخي بـ 8 كرات ذهبية مقابل 5 لرونالدو."
      },
      {
        q: "لماذا تصنف التحليلات الإحصائية ميسي كأفضل لاعب في التاريخ (GOAT)؟",
        a: "تضع النماذج الإحصائية ميسي في الصدارة لجمعه الفريد بين صدارة التهديف وصدارة صناعة اللعب: معدل تهديف أعلى (0.79 مقابل 0.72)، 62 هدفاً أكثر بدون ركلات جزاء في 105 مباريات أقل، فارق هائل يفوق 130 تمريرة حاسمة، معدل دقائق مذهل لكل مساهمة في هدف (72 دقيقة مقابل 88 دقيقة)، وتتويجه بكأس العالم 2022."
      }
    ]
  },
  bn: {
    dir: "ltr",
    title: "মেসি বনাম রোনালদো: ক্যারিয়ার পরিসংখ্যান, ফ্রি কিক, পেনাল্টি ও মুখোমুখি লড়াই | মেসি স্ট্যাট",
    desc: "লিওনেল মেসি বনাম ক্রিশ্চিয়ানো রোনালদো: ৯৩০ গোল বনাম ৯৭৯, ৩৮৫+ অ্যাসিস্ট বনাম ২৬১, ৮২১ নন-পেনাল্টি গোল বনাম ৭৯৫, ৬৭ ফ্রি কিক বনাম ৬৫, ৪৬টি ট্রফি বনাম ৩৫, ৮টি ব্যালন ডি'অর বনাম ৫। চূড়ান্ত পরিসংখ্যান।",
    keywords: "মেসি বনাম রোনালদো, মেসি বনাম রোনালদো পরিসংখ্যান, ফ্রি কিক মেসি বনাম রোনালদো, পেনাল্টি মেসি বনাম রোনালদো, পেনাল্টি ছাড়া গোল, অ্যাসিস্ট মেসি বনাম রোনালদো, হ্যাটট্রিক মেসি বনাম রোনালদো, কে সেরা মেসি নাকি রোনালদো, কার গোল বেশি মেসি না রোনালদো, মুখোমুখি লড়াই, বিশ্বকাপ, ব্যালন ডি অর, ট্রফি",
    brand: "মেসি স্ট্যাট",
    homeName: "হোম",
    latestGoalName: "সাম্প্রতিক গোল",
    bdayName: "জন্মদিনের গোল",
    vsRonaldoName: "বনাম রোনালদো",
    vsRealMadridName: "বনাম রিয়াল মাদ্রিদ",
    uclName: "চ্যাম্পিয়নস লিগ",
    goalsByYearName: "বছরভিত্তিক গোল",
    goalsBySeasonName: "মৌসুমভিত্তিক গোল",
    dashboardName: "ড্যাশবোর্ড",
    timelineName: "টাইমলাইন",
    achievementsName: "অর্জন ও ট্রফি",
    skipText: "মূল কন্টেন্টে যান",
    eyebrow: "সেরা প্রতিদ্বন্দ্বিতা <i></i> <span>মুখোমুখি লড়াই ও পূর্ণাঙ্গ ক্যারিয়ার তুলনা</span>",
    h1: "লিওনেল মেসি বনাম ক্রিশ্চিয়ানো রোনালদো",
    lead: "ফুটবল ইতিহাসের দুই মহাতারকার চূড়ান্ত পরিসংখ্যানগত তুলনা। মোট গোল, নন-পেনাল্টি গোল, ফ্রি কিক, পেনাল্টি, অ্যাসিস্ট, ট্রফি, ব্যক্তিগত অর্জন এবং মুখোমুখি ৩৬টি ম্যাচ।",
    verdictBadge: "সর্বকালের সেরার রায় • সম্পূর্ণ অফিশিয়াল তথ্য",
    verdictTitle: "কার ক্যারিয়ার পরিসংখ্যান বেশি সমৃদ্ধ: মেসি নাকি রোনালদো?",
    verdictText: "সকল সিনিয়র অফিশিয়াল ম্যাচে, <b>লিওনেল মেসি ১,১৭৬ ম্যাচে ৯৩০ গোল ও ৩৮৫টির বেশি অ্যাসিস্ট করেছেন</b> (প্রতি ম্যাচে গড়ে ১.১২ গোলে অবদান), অন্যদিকে <b>ক্রিশ্চিয়ানো রোনালদো সর্বকালের রেকর্ড হিসেবে ১,৩৩৭ ম্যাচে ৯৭৯ গোল ও ২৬১ অ্যাসিস্ট করেছেন</b> (প্রতি ম্যাচে ০.৯৩ অবদান)। রোনালদো সর্বকালের সর্বোচ্চ গোলে এগিয়ে থাকলেও (<b>৯৭৯ বনাম ৯৩০</b>), মেসি <b>১৬১ ম্যাচ কম খেলে</b> এবং উচ্চতর গোল গড়ে (<b>০.৭৯ বনাম ০.৭৩</b>) ৯৩০ গোল অর্জন করেছেন, পেনাল্টি ছাড়া গোলে (<b>৮২১ বনাম ৭৯৫</b>) এবং অ্যাসিস্টে (<b>৩৮৫+ বনাম ২৬১</b>) এগিয়ে আছেন, দুটি গোল্ডেন বল সহ <b>ফিফা বিশ্বকাপ (২০২২)</b> জিতেছেন এবং <b>ব্যালন ডি'অর (৮ বনাম ৫)</b> ও <b>দলগত ট্রফিতে (৪৬ বনাম ৩৫)</b> শীর্ষে রয়েছেন।",
    tableStat: "পরিসংখ্যান",
    tableLeader: "এগিয়ে",
    coreHeader: "সিনিয়র ক্যারিয়ারের পূর্ণাঙ্গ পরিসংখ্যান",
    coreIntro: "ক্লাব এবং জাতীয় দলের যাচাইকৃত অফিশিয়াল পরিসংখ্যান।",
    statGoals: "সিনিয়র ক্যারিয়ারের অফিশিয়াল গোল",
    statApps: "মোট ম্যাচ",
    statRatio: "ম্যাচপ্রতি গোল অনুপাত",
    statAssists: "ক্যারিয়ার অ্যাসিস্ট",
    statGoalContrib: "গোলে অবদান (গোল + অ্যাসিস্ট)",
    statContribRatio: "ম্যাচপ্রতি গোলে অবদান",
    statMinsContrib: "প্রতিটি গোলে অবদানে সময় (মিনিট)",
    statTrophies: "মোট দলগত ট্রফি",
    statBallons: "ব্যালন ডি'অর পুরস্কার",
    statGoldenShoes: "ইউরোপীয় গোল্ডেন শু",
    statWorldCup: "ফিফা বিশ্বকাপ",
    statH2HWins: "মুখোমুখি ম্যাচে জয়",
    scoringHeader: "গোলের ধরন: ফ্রি কিক, পেনাল্টি ও নন-পেনাল্টি গোল",
    scoringIntro: "কীভাবে দুজন গোল করেছেন — ওপেন প্লে দক্ষতা এবং সেট পিসের গভীর বিশ্লেষণ।",
    statNPG: "পেনাল্টি ছাড়া গোল (NPG)",
    statNPGRatio: "ম্যাচপ্রতি নন-পেনাল্টি গোল",
    statFreeKicks: "সরাসরি ফ্রি কিক গোল",
    statPenalties: "পেনাল্টি গোল (শট সংখ্যা)",
    statPenConversion: "পেনাল্টি সফলতার হার",
    statHatTricks: "ক্যারিয়ার হ্যাটট্রিক",
    statPokers: "এক ম্যাচে ৪ গোলের ম্যাচ",
    stat5Goals: "এক ম্যাচে ৫ গোলের ম্যাচ",
    statOutsideBox: "ডি-বক্সের বাইরে থেকে গোল",
    statOpenPlay: "ওপেন প্লে গোল",
    playmakingHeader: "প্লে-মেকিং ও অ্যাসিস্টের পরিসংখ্যান",
    playmakingIntro: "মাঠে শুধু গোল করাই নয়, সুযোগ তৈরি ও আক্রমণ রচনার বিস্তারিত চিত্র।",
    statAllAssists: "ক্যারিয়ারের মোট অ্যাসিস্ট",
    statClubAssists: "ক্লাব ফুটবলে অ্যাসিস্ট",
    statIntAssists: "আন্তর্জাতিক ফুটবলে অ্যাসিস্ট",
    statBigChances: "বড় সুযোগ তৈরি (বিগ চান্স ক্রিয়েট)",
    intlHeader: "আন্তর্জাতিক ফুটবল ও ফাইনালের পারফরম্যান্স",
    intlIntro: "বিশ্বমঞ্চে পারফরম্যান্স: ফিফা বিশ্বকাপ ও বড় টুর্নামেন্টের ফাইনাল।",
    statWCTitles: "বিশ্বকাপ শিরোপা",
    statWCGoldenBall: "বিশ্বকাপ গোল্ডেন বল (সেরা খেলোয়াড়)",
    statWCGoals: "বিশ্বকাপে মোট গোল",
    statWCAssists: "বিশ্বকাপে মোট অ্যাসিস্ট",
    statWCKO: "বিশ্বকাপের নকআউট পর্বে গোল",
    statWCKOAssists: "বিশ্বকাপের নকআউট পর্বে অ্যাসিস্ট",
    statContTitles: "মহাদেশীয় আন্তর্জাতিক শিরোপা",
    statFinalsGoals: "কাপ ফাইনাল ম্যাচে গোল",
    h2hHeader: "মুখোমুখি ৩৬টি লড়াই",
    h2hIntro: "মাঠে মেসি ও রোনালদো একে অপরের মুখোমুখি হওয়া ৩৬টি ম্যাচের রেকর্ড।",
    kpiMessiWins: "মেসির জয়",
    kpiDraws: "ড্র",
    kpiRonaldoWins: "রোনালদোর জয়",
    kpiGoalsScored: "মোট গোল",
    kpiEqualMatches: "সমান ম্যাচ",
    compClasico: "এল ক্লাসিকো (বার্সেলোনা বনাম রিয়াল মাদ্রিদ)",
    compUCL: "উয়েফা চ্যাম্পিয়নস লিগ",
    compIntl: "আন্তর্জাতিক প্রীতি ম্যাচ",
    bdayTitle: "ক্রিশ্চিয়ানো রোনালদোর জন্মদিনে কি মেসি গোল করেছিলেন?",
    bdayDesc: "ক্রিশ্চিয়ানো রোনালদোর জন্ম ৫ ফেব্রুয়ারি। ৫ ফেব্রুয়ারিতে মেসির পারফরম্যান্স এবং আপনার জন্মদিনের গোল দেখুন!",
    bdayBtn: "৫ ফেব্রুয়ারি দেখুন ⚽",
    faqHeader: "সাধারণ জিজ্ঞাসা: মেসি বনাম রোনালদো",
    exploreTitle: "সম্পূর্ণ পরিসংখ্যান অন্বেষণ করুন",
    footerDir: "ক্যারিয়ার রেকর্ড ও প্রতিদ্বন্দ্বিতা",
    footerIntl: "আন্তর্জাতিক সংস্করণ / ভাষা",
    crestNote: "ক্লাব ক্রেস্টগুলো তাদের স্ব স্ব ক্লাবের ট্রেডমার্ক, কেবল শনাক্তকরণের জন্য ব্যবহৃত।",
    badgeRonaldoGoals: "রোনালদো (+৪৯ গোল, সর্বকালের রেকর্ড)",
    badgeMessiNPG: "মেসি (+২৬ নন-পেনাল্টি গোল)",
    badgeMessiFK: "মেসি (+২ ফ্রি কিক)",
    badgeRonaldoPen: "রোনালদো (+৭৫ পেনাল্টি)",
    badgeMessiAssists: "মেসি (+১২৪ অ্যাসিস্ট)",
    badgeRonaldoHT: "রোনালদো (+৭ হ্যাটট্রিক)",
    badgeMessiWC: "মেসি (চ্যাম্পিয়ন, ২টি গোল্ডেন বল)",
    badgeMessiTrophies: "মেসি (+১১ ট্রফি, বিশ্বরেকর্ড)",
    badgeMessiBallon: "মেসি (+৩ ব্যালন ডি'অর, বিশ্বরেকর্ড)",
    badgeMessiH2H: "মেসি (+৫ জয়, ১৬ বনাম ১১)",
    badgeMessiFinals: "মেসি (+১৩ গোল ফাইনালে)",
        thCompetition: "প্রতিযোগিতা",
    thMatches: "ম্যাচ",
    thMessiWins: "মেসির জয়",
    thDraws: "ড্র",
    thRonaldoWins: "রোনালদোর জয়",
    thMessiGoals: "মেসির গোল",
    thRonaldoGoals: "রোনালদোর গোল",
    tableTotal: "মোট",
    badge16Wins: "১৬ জয়",
    badge11Wins: "১১ জয়",
    tied2All: "ড্র (উভয়ে ২)",
    badgeMessiRecord: "মেসি (রেকর্ড)",
    wcKOStageMessi: "মেসি (শেষ ১৬, কোয়ার্টার, সেমি, ফাইনাল)",
    goalsKnockoutMessi: "৫ গোল",
    goalsKnockoutRonaldo: "০ গোল",
    assistsKnockoutMessi: "৬ অ্যাসিস্ট",
    assistsKnockoutRonaldo: "০ অ্যাসিস্ট",
    finalsRecordMessi: "৫০ ফাইনালে ৩৫ গোল",
    finalsRecordRonaldo: "৩৮ ফাইনালে ২২ গোল",
    continentalMessi: "৩ (২ কোপা আমেরিকা, ১ ফিনালিসিমা)",
    continentalRonaldo: "২ (১ ইউরো, ১ নেশন্স লিগ)",
    adLabel: "বিজ্ঞাপন",
    bdayPromoBadge: "🎂 অনন্য ইন্টারেক্টিভ টুল",
    bdayPromoAria: "আপনার জন্মদিনে কি মেসি গোল করেছিলেন?",
    jumpCore: "ক্যারিয়ার মোট",
    jumpScoring: "ফ্রি-কিক ও পেনাল্টি",
    jumpPlaymaking: "অ্যাসিস্ট ও প্লেমেকিং",
    jumpIntl: "বিশ্বকাপ ও ফাইনাল",
    jumpH2H: "৩৬ সরাসরি লড়াই",
    jumpFaq: "সাধারণ জিজ্ঞাসা",
    faqs: [
      {
        q: "কার গোল বেশি: মেসি নাকি ক্রিশ্চিয়ানো রোনালদো?",
        a: "ক্রিশ্চিয়ানো রোনালদো ফুটবল ইতিহাসের সর্বকালের সর্বোচ্চ ৯৭৯টি অফিশিয়াল গোল করেছেন ১,৩৩৭ ম্যাচে (০.৭৩ গোল প্রতি ম্যাচ)। লিওনেল মেসি ১,১৭৬ ম্যাচে ৯৩০ গোল করেছেন (০.৭৯ গোল প্রতি ম্যাচ)। রোনালদো ৪৯ গোলে এগিয়ে থাকলেও মেসি ১৬১ ম্যাচ কম খেলেছেন এবং তার গোল গড় বেশি।"
      },
      {
        q: "পেনাল্টি ছাড়া কার গোল বেশি?",
        a: "লিওনেল মেসি পেনাল্টি ছাড়া ৮২১টি গোল করেছেন ১,১৭৬ ম্যাচে (প্রতি ম্যাচে ০.৭০ গোল)। ক্রিশ্চিয়ানো রোনালদো পেনাল্টি ছাড়া ৭৯৫টি গোল করেছেন ১,৩৩৭ ম্যাচে (০.৫৯ গোল)। ১৬১ ম্যাচ কম খেলেও মেসি পেনাল্টি ছাড়া ২৬টি গোল বেশি করেছেন।"
      },
      {
        q: "ফ্রি কিকে কে বেশি গোল করেছেন?",
        a: "লিওনেল মেসি ৬৭টি সরাসরি ফ্রি কিক গোল করে রোনালদোর (৬৫) চেয়ে এগিয়ে রয়েছেন। মেসি বার্সেলোনার হয়ে ৫০টি, আর্জেন্টিনার হয়ে ১১টি, ইন্টার মায়ামির হয়ে ৪টি এবং পিএসজির হয়ে ২টি ফ্রি কিক গোল করেছেন। রোনালদো রিয়াল মাদ্রিদের হয়ে ৩৩টি, ম্যান ইউনাইটেডের হয়ে ১৫টি, পর্তুগালের হয়ে ১১টি, আল-নাসরের হয়ে ৫টি এবং জুভেন্টাসের হয়ে ১টি ফ্রি কিক গোল করেছেন।"
      },
      {
        q: "কার অ্যাসিস্ট বেশি: মেসি নাকি রোনালদো?",
        a: "মেসি রোনালদোর চেয়ে ১২৪টি অ্যাসিস্টে এগিয়ে রয়েছেন। মেসির অফিশিয়াল অ্যাসিস্ট ৩৮৫টিরও বেশি (ক্লাবে ৩২৭+ এবং আর্জেন্টিনায় ৫৮+), যা আধুনিক ফুটবলের ইতিহাসসেরা রেকর্ড। রোনালদোর অ্যাসিস্ট ২৬১টি।"
      },
      {
        q: "কে বেশি পেনাল্টি গোল করেছেন এবং পেনাল্টির সফলতা কেমন?",
        a: "ক্রিশ্চিয়ানো রোনালদো ২২০টি পেনাল্টি শটের মধ্যে ১৮৪টি গোল করেছেন (৮৩.৬% সফলতা)। লিওনেল মেসি ১৪০টি পেনাল্টির মধ্যে ১০৯টি গোল করেছেন (৭৭.৯% সফলতা)। রোনালদো মেসির চেয়ে ৭৫টি পেনাল্টি বেশি দিয়েছেন।"
      },
      {
        q: "কার হ্যাটট্রিক বেশি: মেসি নাকি রোনালদো?",
        a: "ক্রিশ্চিয়ানো রোনালদোর মোট হ্যাটট্রিক ৬৬টি (ক্লাবে ৫৬টি, পর্তুগালে ১০টি)। লিওনেল মেসির মোট হ্যাটট্রিক ৫৯টি (ক্লাবে ৪৮টি, আর্জেন্টিনায় ১০টি, ইন্টার মায়ামিতে ১টি)। রোনালদো ৭টি হ্যাটট্রিকে এগিয়ে।"
      },
      {
        q: "ফিফা বিশ্বকাপে কার পারফরম্যান্স ভালো?",
        a: "লিওনেল মেসি ২০২২ সালের কাতার বিশ্বকাপ জিতেছেন এবং ইতিহাসের একমাত্র খেলোয়াড় হিসেবে দুটি বিশ্বকাপের গোল্ডেন বল (২০১৪ ও ২০২২) জিতেছেন। বিশ্বকাপে মেসির ২৬ ম্যাচে ১৩ গোল ও ৮ অ্যাসিস্ট রয়েছে, যার মধ্যে নকআউট পর্বে ৫টি গোল। রোনালদোর ২২ ম্যাচে ৮ গোল ও ২ অ্যাসিস্ট, তবে বিশ্বকাপের নকআউট পর্বে তার গোল বা অ্যাসিস্ট নেই।"
      },
      {
        q: "মুখোমুখি ৩৬টি ম্যাচে কে বেশি জয়ী হয়েছেন?",
        a: "মুখোমুখি ৩৬টি আনুষ্ঠানিক ম্যাচে মেসির দল জিতেছে ১৬ বার, রোনালদোর দল জিতেছে ১১ বার এবং ৯টি ম্যাচ ড্র হয়েছে। এই ম্যাচগুলোতে মেসি ২২টি এবং রোনালদো ২১টি গোল করেছেন।"
      },
      {
        q: "কার ব্যালন ডি'অর ও দলগত ট্রফি বেশি?",
        a: "মেসি ফুটবল ইতিহাসের সর্বোচ্চ ৪৬টি দলগত ট্রফি জিতেছেন (১০টি লা লিগা, ৪টি চ্যাম্পিয়নস লিগ, ২টি কোপা আমেরিকা ও ১টি বিশ্বকাপ সহ), যেখানে রোনালদোর ট্রফি ৩৫টি। মেসি রেকর্ড ৮টি ব্যালন ডি'অর জিতেছেন, রোনালদো জিতেছেন ৫টি।"
      },
      {
        q: "কেন বিশ্লেষকরা মেসিকেই সর্বকালের সেরা (GOAT) মনে করেন?",
        a: "পরিসংখ্যানগত বিশ্লেষণে মেসি এগিয়ে কারণ তিনি একাধারে অনন্য গোলস্কোরার ও সেরা প্লে-মেকার: গোল অনুপাত বেশি (০.৭৯ বনাম ০.৭২), ১০৫ ম্যাচ কম খেলেই পেনাল্টি ছাড়া ৬২ গোল বেশি, ১৩০টির বেশি অতিরিক্ত অ্যাসিস্ট, গোলে দ্রুত অবদান (প্রতি ৭২ মিনিটে একটি গোলে অবদান) এবং ২০২২ বিশ্বকাপ বিজয়।"
      }
    ]
  },
  hi: {
    dir: "ltr",
    title: "मेसी बनाम रोनाल्डो: करियर आंकड़े, फ्री किक, पेनल्टी व आमने-सामने मुकाबले | मेसी स्टैट",
    desc: "लियोनेल मेसी बनाम क्रिस्टियानो रोनाल्डो: 930 गोल बनाम 979, 385+ असिस्ट बनाम 261, 821 नॉन-पेनल्टी गोल बनाम 795, 67 फ्री किक बनाम 65, 46 खिताब बनाम 35, 8 बैलन डी'ऑर बनाम 5। संपूर्ण तुलना।",
    keywords: "मेसी बनाम रोनाल्डो, मेसी बनाम रोनाल्डो आंकड़े, फ्री किक मेसी बनाम रोनाल्डो, पेनल्टी मेसी बनाम रोनाल्डो, बिना पेनल्टी के गोल, असिस्ट मेसी बनाम रोनाल्डो, हैट्रिक मेसी बनाम रोनाल्डो, कौन बेहतर है मेसी या रोनाल्डो, किसके ज्यादा गोल हैं, आमने सामने मैच, विश्व कप, बैलन डी'ओर, ट्रॉफी",
    brand: "मेसी स्टैट",
    homeName: "होम",
    latestGoalName: "ताजा गोल",
    bdayName: "जन्मदिन गोल",
    vsRonaldoName: "बनाम रोनाल्डो",
    vsRealMadridName: "बनाम रियल मैड्रिड",
    uclName: "चैंपियंस लीग",
    goalsByYearName: "साल अनुसार गोल",
    goalsBySeasonName: "सीज़न अनुसार गोल",
    dashboardName: "डैशबोर्ड",
    timelineName: "टाइमलाइन",
    achievementsName: "खिताब व अवॉर्ड",
    skipText: "सामग्री पर जाएं",
    eyebrow: "महानतम प्रतिद्वंद्विता <i></i> <span>करियर तुलना व आमने-सामने रिकॉर्ड</span>",
    h1: "लियोनेल मेसी बनाम क्रिस्टियानो रोनाल्डो",
    lead: "आधुनिक फुटबॉल के दो दिग्गजों के बीच आधिकारिक आंकड़ों की संपूर्ण तुलना। कुल गोल, बिना पेनल्टी के गोल, फ्री किक, पेनल्टी, असिस्ट, टीम खिताब, व्यक्तिगत सम्मान और सभी 36 सीधे मुकाबले।",
    verdictBadge: "सर्वकालिक महानतम का फैसला • आधिकारिक आंकड़े",
    verdictTitle: "करियर आंकड़ों में कौन आगे है: लियोनेल मेसी या क्रिस्टियानो रोनाल्डो?",
    verdictText: "सभी आधिकारिक सीनियर मैचों में, <b>लियोनेल मेसी ने 1,176 मैचों में 930 गोल और 385 से अधिक असिस्ट दर्ज किए हैं</b> (प्रति मैच 1.12 गोल योगदान), जबकि <b>क्रिस्टियानो रोनाल्डो 1,337 मैचों में 979 गोल और 261 असिस्ट के साथ सर्वकालिक शीर्ष स्कोरर हैं</b> (प्रति मैच 0.93 योगदान)। हालांकि रोनाल्डो कुल गोलों (<b>979 बनाम 930</b>) में आगे हैं, लेकिन मेसी ने <b>161 कम मैचों में</b> और बेहतर अनुपात (<b>0.79 बनाम 0.73</b>) के साथ 930 गोल हासिल किए हैं, नॉन-पेनल्टी गोल (<b>821 बनाम 795</b>) और असिस्ट (<b>385+ बनाम 261</b>) में आगे हैं, दो गोल्डन बॉल के साथ <b>फीफा विश्व कप (2022)</b> जीता है, और <b>बैलन डी'ऑर (8 बनाम 5)</b> व <b>टीम खिताबों (46 बनाम 35)</b> में आगे हैं।",
    tableStat: "आंकड़ा",
    tableLeader: "बढ़त",
    coreHeader: "सीनियर करियर के कुल आधिकारिक आंकड़े",
    coreIntro: "क्लब और राष्ट्रीय टीम के सत्यापित आधिकारिक आंकड़े।",
    statGoals: "सीनियर करियर के आधिकारिक गोल",
    statApps: "कुल खेले गए मैच",
    statRatio: "प्रति मैच गोल औसत",
    statAssists: "करियर असिस्ट",
    statGoalContrib: "गोल योगदान (गोल + असिस्ट)",
    statContribRatio: "प्रति मैच गोल योगदान",
    statMinsContrib: "प्रति गोल योगदान में मिनट",
    statTrophies: "कुल टीम खिताब",
    statBallons: "बैलन डी'ऑर अवॉर्ड",
    statGoldenShoes: "यूरोपीय गोल्डन शू",
    statWorldCup: "फीफा विश्व कप",
    statH2HWins: "आमने-सामने मैचों में जीत",
    scoringHeader: "गोल के प्रकार: फ्री किक, पेनल्टी व नॉन-पेनल्टी गोल",
    scoringIntro: "दोनों खिलाड़ियों ने किस तरह गोल किए — ओपन प्ले और सेट पीस का विस्तृत विश्लेषण।",
    statNPG: "बिना पेनल्टी के गोल (NPG)",
    statNPGRatio: "प्रति मैच नॉन-पेनल्टी गोल",
    statFreeKicks: "सीधी फ्री किक से गोल",
    statPenalties: "पेनल्टी से गोल (प्रयास)",
    statPenConversion: "पेनल्टी सफलता दर",
    statHatTricks: "करियर हैट्रिक",
    statPokers: "एक मैच में 4 गोल वाले मैच",
    stat5Goals: "एक मैच में 5 गोल वाले मैच",
    statOutsideBox: "डी-बॉक्स के बाहर से गोल",
    statOpenPlay: "ओपन प्ले गोल",
    playmakingHeader: "प्लेमेकिंग, रचनात्मकता व असिस्ट",
    playmakingIntro: "असिस्ट, मौके बनाना और मैच पर रचनात्मक प्रभाव।",
    statAllAssists: "करियर के कुल असिस्ट",
    statClubAssists: "क्लब करियर असिस्ट",
    statIntAssists: "अंतरराष्ट्रीय असिस्ट",
    statBigChances: "बनाए गए बड़े मौके (बिग चांस)",
    intlHeader: "अंतरराष्ट्रीय फुटबॉल व टूर्नामेंट फाइनल",
    intlIntro: "फीफा विश्व कप और बड़े कप फाइनल में प्रदर्शन।",
    statWCTitles: "विश्व कप खिताब",
    statWCGoldenBall: "विश्व कप गोल्डन बॉल (सर्वश्रेष्ठ खिलाड़ी)",
    statWCGoals: "विश्व कप में गोल",
    statWCAssists: "विश्व कप में असिस्ट",
    statWCKO: "विश्व कप नॉकआउट राउंड में गोल",
    statWCKOAssists: "विश्व कप नॉकआउट राउंड में असिस्ट",
    statContTitles: "महाद्वीपीय अंतरराष्ट्रीय खिताब",
    statFinalsGoals: "कप फाइनल मैचों में गोल",
    h2hHeader: "आमने-सामने खेले गए 36 मुकाबले",
    h2hIntro: "मैदान पर दोनों के बीच सीधे खेले गए 36 मैचों का संपूर्ण ब्योरा।",
    kpiMessiWins: "मेसी की जीत",
    kpiDraws: "ड्रॉ मुकाबले",
    kpiRonaldoWins: "रोनाल्डो की जीत",
    kpiGoalsScored: "किए गए गोल",
    kpiEqualMatches: "बराबरी वाले मैच",
    compClasico: "एल क्लासिको (बार्सिलोना बनाम रियल मैड्रिड)",
    compUCL: "यूईएफए चैंपियंस लीग",
    compIntl: "अंतरराष्ट्रीय दोस्ताना मैच",
    bdayTitle: "क्या मेसी ने क्रिस्टियानो रोनाल्डो के जन्मदिन पर गोल किया?",
    bdayDesc: "क्रिस्टियानो रोनाल्डो का जन्म 5 फरवरी को हुआ था। देखें 5 फरवरी को मेसी का रिकॉर्ड और अपने जन्मदिन का गोल खोजें!",
    bdayBtn: "5 फरवरी देखें ⚽",
    faqHeader: "अक्सर पूछे जाने वाले सवाल: मेसी बनाम रोनाल्डो",
    exploreTitle: "संपूर्ण आंकड़े देखें",
    footerDir: "करियर रिकॉर्ड व प्रतिद्वंद्विता",
    footerIntl: "अंतरराष्ट्रीय संस्करण / भाषाएं",
    crestNote: "क्लब लोगो संबंधित क्लबों के पंजीकृत ट्रेडमार्क हैं, केवल पहचान हेतु प्रदर्शित।",
    badgeRonaldoGoals: "रोनाल्डो (+49 गोल, सर्वकालिक रिकॉर्ड)",
    badgeMessiNPG: "मेसी (+26 नॉन-पेनल्टी गोल)",
    badgeMessiFK: "मेसी (+2 फ्री किक)",
    badgeRonaldoPen: "रोनाल्डो (+57 पेनल्टी गोल)",
    badgeMessiAssists: "मेसी (+124 असिस्ट)",
    badgeRonaldoHT: "रोनाल्डो (+9 हैट्रिक)",
    badgeMessiWC: "मेसी (विश्व कप चैंपियन, 2 गोल्डन बॉल)",
    badgeMessiTrophies: "मेसी (+11 खिताब, विश्व रिकॉर्ड)",
    badgeMessiBallon: "मेसी (+3 बैलन डी'ऑर, विश्व रिकॉर्ड)",
    badgeMessiH2H: "मेसी (+5 जीत, 16 बनाम 11)",
    badgeMessiFinals: "मेसी (+13 गोल फाइनल में)",
        thCompetition: "प्रतियोगिता",
    thMatches: "मैच",
    thMessiWins: "मेस्सी की जीत",
    thDraws: "ड्रॉ",
    thRonaldoWins: "रोनाल्डो की जीत",
    thMessiGoals: "मेस्सी के गोल",
    thRonaldoGoals: "रोनाल्डो के गोल",
    tableTotal: "कुल",
    badge16Wins: "16 जीत",
    badge11Wins: "11 जीत",
    tied2All: "बराबर (2 प्रत्येक)",
    badgeMessiRecord: "मेस्सी (रिकॉर्ड)",
    wcKOStageMessi: "मेस्सी (राउंड 16, क्वार्टर, सेमी, फाइनल)",
    goalsKnockoutMessi: "5 गोल",
    goalsKnockoutRonaldo: "0 गोल",
    assistsKnockoutMessi: "6 असिस्ट",
    assistsKnockoutRonaldo: "0 असिस्ट",
    finalsRecordMessi: "50 फाइनल में 35 गोल",
    finalsRecordRonaldo: "38 फाइनल में 22 गोल",
    continentalMessi: "3 (2 कोपा अमेरिका, 1 फाइनलिसिमा)",
    continentalRonaldo: "2 (1 यूरो, 1 नेशंस लीग)",
    adLabel: "विज्ञापन",
    bdayPromoBadge: "🎂 अनोखा इंटरएक्टिव टूल",
    bdayPromoAria: "क्या मेस्सी ने आपके जन्मदिन पर गोल किया था?",
    jumpCore: "करियर के कुल आंकड़े",
    jumpScoring: "फ्री-किक और पेनल्टी",
    jumpPlaymaking: "असिस्ट और प्लेमेकिंग",
    jumpIntl: "विश्व कप और फाइनल",
    jumpH2H: "36 आमने-सामने के मैच",
    jumpFaq: "अक्सर पूछे जाने वाले सवाल",
    faqs: [
      {
        q: "किसके गोल ज्यादा हैं: मेसी या रोनाल्डो?",
        a: "क्रिस्टियानो रोनाल्डो 1,337 मैचों में 979 आधिकारिक गोल (0.73 गोल प्रति मैच) के साथ फुटबॉल इतिहास के सर्वकालिक शीर्ष स्कोरर हैं। लियोनेल मेसी ने 1,176 मैचों में 930 गोल किए हैं (0.79 गोल प्रति मैच)। रोनाल्डो 49 गोल से आगे हैं, हालांकि मेसी ने 161 मैच कम खेले हैं और उनका गोल औसत बेहतर है।"
      },
      {
        q: "बिना पेनल्टी के किसके गोल ज्यादा हैं?",
        a: "लियोनेल मेसी ने 1,176 मैचों में बिना पेनल्टी के 821 गोल किए हैं (प्रति मैच 0.70 गोल)। रोनाल्डो ने 1,337 मैचों में बिना पेनल्टी के 795 गोल किए हैं (0.59 गोल)। 161 मैच कम खेलकर भी मेसी नॉन-पेनल्टी गोल में 26 गोल आगे हैं।"
      },
      {
        q: "फ्री किक से किसने ज्यादा गोल किए हैं?",
        a: "वर्तमान में दोनों 66-66 फ्री किक गोल के साथ बराबरी पर हैं। मेसी ने बार्सिलोना के लिए 50, अर्जेंटीना के लिए 11, इंटर मियामी के लिए 3 और पीएसजी के लिए 2 फ्री किक गोल किए हैं। रोनाल्डो ने रियल मैड्रिड के लिए 33, मैनचेस्टर यूनाइटेड के लिए 15, पुर्तगाल के लिए 11, अल-नासर के लिए 6 और युवेंटस के लिए 1 फ्री किक गोल किया है।"
      },
      {
        q: "असिस्ट में कौन आगे है: मेसी या रोनाल्डो?",
        a: "लियोनेल मेसी क्रिस्टियानो रोनाल्डो से 130 से अधिक असिस्ट आगे हैं। मेसी के नाम 385 से अधिक आधिकारिक असिस्ट हैं (क्लब में 300+ और अर्जेंटीना के लिए 58+), जो फुटबॉल इतिहास में सर्वाधिक है। रोनाल्डो के नाम 255 से अधिक असिस्ट हैं।"
      },
      {
        q: "किसने पेनल्टी से ज्यादा गोल किए हैं और सफलता दर क्या है?",
        a: "क्रिस्टियानो रोनाल्डो ने 220 पेनल्टी में से 184 गोल किए हैं (83.6% सफलता)। लियोनेल मेसी ने 140 पेनल्टी में से 109 गोल किए हैं (77.9% सफलता)। रोनाल्डो ने मेसी से 75 पेनल्टी गोल अधिक किए हैं।"
      },
      {
        q: "करियर में किसकी हैट्रिक ज्यादा हैं?",
        a: "क्रिस्टियानो रोनाल्डो ने 66 हैट्रिक लगाई हैं (क्लब में 56, पुर्तगाल के लिए 10)। लियोनेल मेसी ने 59 हैट्रिक लगाई हैं (क्लब में 48, अर्जेंटीना के लिए 10, इंटर मियामी के लिए 1)। रोनाल्डो 7 हैट्रिक से आगे हैं।"
      },
      {
        q: "फीफा विश्व कप में किसका प्रदर्शन बेहतर रहा?",
        a: "लियोनेल मेसी ने अर्जेंटीना के साथ 2022 फीफा विश्व कप जीता और वे इतिहास के एकमात्र खिलाड़ी हैं जिन्होंने दो विश्व कप गोल्डन बॉल (2014, 2022) जीते हैं। विश्व कप में मेसी के नाम 26 मैचों में 13 गोल और 8 असिस्ट हैं, जिनमें नॉकआउट में 5 गोल शामिल हैं। रोनाल्डो के नाम 22 मैचों में 8 गोल और 2 असिस्ट हैं, लेकिन नॉकआउट राउंड में कोई गोल या असिस्ट नहीं है।"
      },
      {
        q: "सीधे आमने-सामने 36 मैचों में किसने ज्यादा जीत हासिल की?",
        a: "दोनों के बीच खेले गए 36 आधिकारिक सीधे मुकाबलों में मेसी की टीमों ने 16 मैच जीते, रोनाल्डो की टीमों ने 11 मैच जीते और 9 मैच ड्रॉ रहे। इन मैचों में मेसी ने 22 और रोनाल्डो ने 21 गोल किए।"
      },
      {
        q: "किसके पास ज्यादा बैलन डी'ऑर और टीम खिताब हैं?",
        a: "मेसी के पास विश्व रिकॉर्ड 46 टीम खिताब हैं (10 ला लीगा, 4 चैंपियंस लीग, 2 कोपा अमेरिका, 1 विश्व कप सहित), जबकि रोनाल्डो के 35 खिताब हैं। मेसी के पास रिकॉर्ड 8 बैलन डी'ऑर हैं, जबकि रोनाल्डो के पास 5 हैं।"
      },
      {
        q: "विश्लेषक मेसी को सर्वकालिक सर्वश्रेष्ठ (GOAT) क्यों मानते हैं?",
        a: "आंकड़े मेसी को सबसे आगे रखते हैं क्योंकि वे शीर्ष गोलस्कोरर होने के साथ सर्वश्रेष्ठ प्लेमेकर भी हैं: बेहतर गोल औसत (0.79 बनाम 0.72), 105 मैच कम में 62 अधिक नॉन-पेनल्टी गोल, 130 से अधिक अतिरिक्त असिस्ट, तेज गोल योगदान (प्रति 72 मिनट) और 2022 विश्व कप जीत।"
      }
    ]
  },
  ro: {
    dir: "ltr",
    title: "Messi vs Ronaldo: Statistici, Lovituri Libere, Penalty-uri și Meciuri Directe | MessiStat",
    desc: "Lionel Messi vs Cristiano Ronaldo: 930 goluri vs 979, 385+ pase de gol vs 261, 821 goluri fără penalty vs 795, 67 lovituri libere vs 65, 46 trofee vs 35, 8 Baloane de Aur vs 5. Comparația definitivă.",
    keywords: "messi vs ronaldo, statistici messi vs ronaldo, lovituri libere messi vs ronaldo, penalty uri messi vs ronaldo, goluri fara penalty, pase de gol messi vs ronaldo, hat trick uri, cine e mai bun messi sau ronaldo, cine are mai multe goluri messi sau ronaldo, meciuri directe, cupa mondiala, baloane de aur, trofee",
    brand: "MessiStat",
    homeName: "Acasă",
    latestGoalName: "Ultimul Gol",
    bdayName: "Goluri de Ziua Ta",
    vsRonaldoName: "vs Ronaldo",
    vsRealMadridName: "vs Real Madrid",
    uclName: "Champions League",
    goalsByYearName: "Goluri pe ani",
    goalsBySeasonName: "Goluri pe sezoane",
    dashboardName: "Panou statistici",
    timelineName: "Cronologie",
    achievementsName: "Palmares",
    skipText: "Sari la conținut",
    eyebrow: "Rivalitatea Supremă <i></i> <span>Comparație Completă și Meciuri Directe</span>",
    h1: "Lionel Messi vs Cristiano Ronaldo",
    lead: "Comparația statistică definitivă între cei doi uriași ai fotbalului modern. Goluri totale, goluri fără penalty, lovituri libere, penalty-uri, pase de gol, trofee, premii individuale și cele 36 de meciuri directe.",
    verdictBadge: "VERDICTUL GOAT • DATE OFICIALE COMPLETE",
    verdictTitle: "Cine are statistici superioare în carieră: Messi sau Ronaldo?",
    verdictText: "În toate meciurile oficiale de seniori, <b>Lionel Messi a marcat 930 de goluri și a oferit peste 385 de pase de gol în 1.176 de partide</b> (1,12 contribuții la gol pe meci), în timp ce <b>Cristiano Ronaldo este cel mai bun marcator din istorie cu 979 de goluri și 261 de pase în 1.337 de meciuri</b> (0,93 contribuții pe meci). Deși Ronaldo conduce la numărul total de goluri (<b>979 vs 930</b>), Messi a atins borna de 930 în <b>161 de meciuri mai puține</b> cu o medie superioară (<b>0,79 vs 0,73</b>), are mai multe <b>goluri fără penalty (821 vs 795)</b> și pase decisive (<b>385+ vs 261</b>), a cucerit <b>Cupa Mondială FIFA (2022)</b> cu două Baloane de Aur și îl depășește pe Ronaldo la <b>Baloane de Aur (8 la 5)</b> și <b>trofee oficiale (46 la 35)</b>.",
    tableStat: "Statistică",
    tableLeader: "Lider",
    coreHeader: "Totalurile Carierei Oficiale de Seniori",
    coreIntro: "Date oficiale verificate la nivel de club și echipe naționale de seniori.",
    statGoals: "Goluri Oficiale în Cariera Senior",
    statApps: "Meciuri Oficiale Jucate",
    statRatio: "Medie de Goluri pe Meci",
    statAssists: "Pase de Gol Oficiale (Assist-uri)",
    statGoalContrib: "Contribuții la Gol (Goluri + Pase)",
    statContribRatio: "Contribuții la Gol pe Meci",
    statMinsContrib: "Minute per Contribuție la Gol",
    statTrophies: "Titluri de Echipă Câștigate",
    statBallons: "Trofee Balonul de Aur",
    statGoldenShoes: "Ghete de Aur Europene",
    statWorldCup: "Cupa Mondială FIFA",
    statH2HWins: "Victorii în Meciurile Directe",
    scoringHeader: "Tipuri de Goluri: Lovituri Libere, Penalty-uri și Goluri din Acțiune",
    scoringIntro: "Detalierea modului în care a marcat fiecare jucător — eficiență din acțiune și faze fixe.",
    statNPG: "Goluri Fără Penalty (NPG)",
    statNPGRatio: "Medie de Goluri Fără Penalty",
    statFreeKicks: "Goluri din Lovitură Liberă Directă",
    statPenalties: "Goluri din Penalty (Executate)",
    statPenConversion: "Rata de Conversie a Penalty-urilor",
    statHatTricks: "Hat-trick-uri în Carieră",
    statPokers: "Meciuri cu 4 Goluri (Pokere)",
    stat5Goals: "Meciuri cu 5 Goluri",
    statOutsideBox: "Goluri din Afara Careului",
    statOpenPlay: "Goluri din Acțiune",
    playmakingHeader: "Creativitate, Pase de Gol și Influență Ofensivă",
    playmakingIntro: "Pase decisive, ocazii mari create și viziune a jocului dincolo de simpla finalizare.",
    statAllAssists: "Total Pase Decisive în Carieră",
    statClubAssists: "Pase de Gol la Cluburi",
    statIntAssists: "Pase de Gol la Națională",
    statBigChances: "Mari Ocazii Create",
    intlHeader: "Echipe Naționale și Finale Majore",
    intlIntro: "Recorduri pe cele mai mari scene: Cupa Mondială și finale de trofee.",
    statWCTitles: "Titluri de Cupă Mondială",
    statWCGoldenBall: "Baloane de Aur ale Cupei Mondiale (Cel Mai Bun Jucător)",
    statWCGoals: "Goluri la Cupa Mondială",
    statWCAssists: "Pase de Gol la Cupa Mondială",
    statWCKO: "Goluri în Fazele Eliminatorii ale Cupei Mondiale",
    statWCKOAssists: "Pase de Gol în Fazele Eliminatorii",
    statContTitles: "Titluri Continentale cu Naționala",
    statFinalsGoals: "Goluri Marcate în Finale de Cupă",
    h2hHeader: "Cele 36 de Înfruntări Directe",
    h2hIntro: "Bilanțul complet al tuturor celor 36 de meciuri directe disputate pe teren.",
    kpiMessiWins: "Victorii Messi",
    kpiDraws: "Egaluri",
    kpiRonaldoWins: "Victorii Ronaldo",
    kpiGoalsScored: "Goluri Marcate",
    kpiEqualMatches: "Partide Egale",
    compClasico: "El Clásico (Barcelona vs Real Madrid)",
    compUCL: "UEFA Champions League",
    compIntl: "Meciuri Amicale Internaționale",
    bdayTitle: "A marcat Messi de ziua de naștere a lui Cristiano Ronaldo?",
    bdayDesc: "Cristiano Ronaldo s-a născut pe 5 februarie. Află ce a făcut Messi pe 5 februarie și caută și propria ta zi de naștere!",
    bdayBtn: "Vezi 5 februarie ⚽",
    faqHeader: "Întrebări Frecvente: Messi vs Ronaldo",
    exploreTitle: "Explorează toate statisticile",
    footerDir: "Recorduri și Rivalități",
    footerIntl: "Ediții Internaționale / Limbi",
    crestNote: "Siglele cluburilor sunt mărci înregistrate ale respectivelor echipe, afișate strict în scop de identificare.",
    badgeRonaldoGoals: "Ronaldo (+49 goluri, record all-time)",
    badgeMessiNPG: "Messi (+26 goluri fără penalty)",
    badgeMessiFK: "Messi (+2 lovituri libere)",
    badgeRonaldoPen: "Ronaldo (+75 penalty-uri)",
    badgeMessiAssists: "Messi (+124 pase de gol)",
    badgeRonaldoHT: "Ronaldo (+7 hat-trick-uri)",
    badgeMessiWC: "Messi (Campion, 2 Baloane de Aur)",
    badgeMessiTrophies: "Messi (+11 trofee, record mondial)",
    badgeMessiBallon: "Messi (+3 Baloane de Aur, record)",
    badgeMessiH2H: "Messi (+5 victorii, 16 la 11)",
    badgeMessiFinals: "Messi (+13 goluri în finale)",
        thCompetition: "Competiție",
    thMatches: "Meciuri",
    thMessiWins: "Victorii Messi",
    thDraws: "Egaluri",
    thRonaldoWins: "Victorii Ronaldo",
    thMessiGoals: "Goluri Messi",
    thRonaldoGoals: "Goluri Ronaldo",
    tableTotal: "Total",
    badge16Wins: "16 Victorii",
    badge11Wins: "11 Victorii",
    tied2All: "Egalitate (câte 2)",
    badgeMessiRecord: "Messi (Record)",
    wcKOStageMessi: "Messi (Optimi, Sferturi, Semi, Finală)",
    goalsKnockoutMessi: "5 Goluri",
    goalsKnockoutRonaldo: "0 Goluri",
    assistsKnockoutMessi: "6 Pase decisive",
    assistsKnockoutRonaldo: "0 Pase decisive",
    finalsRecordMessi: "35 Goluri în 50 Finale",
    finalsRecordRonaldo: "22 Goluri în 38 Finale",
    continentalMessi: "3 (2 Copas América, 1 Finalissima)",
    continentalRonaldo: "2 (1 Euro, 1 Liga Națiunilor)",
    adLabel: "Publicitate",
    bdayPromoBadge: "🎂 INSTRUMENT INTERACTIV UNIC",
    bdayPromoAria: "A marcat Messi de ziua ta de naștere?",
    jumpCore: "Total Carieră",
    jumpScoring: "Loviri Libere & Penalty-uri",
    jumpPlaymaking: "Pase & Creație",
    jumpIntl: "Cupa Mondială & Finale",
    jumpH2H: "36 Înfruntări Directe",
    jumpFaq: "Întrebări Frecvente",
    faqs: [
      {
        q: "Cine are mai multe goluri oficiale: Messi sau Ronaldo?",
        a: "Cristiano Ronaldo este cel mai bun marcator din istoria fotbalului cu 979 de goluri oficiale în 1.337 de meciuri (0,73 goluri pe meci). Lionel Messi are 930 de goluri în 1.176 de meciuri (0,79 goluri pe meci). Ronaldo conduce cu 49 de goluri, dar Messi are 161 de meciuri mai puține și un procentaj superior."
      },
      {
        q: "Cine are mai multe goluri fără penalty?",
        a: "Lionel Messi are 821 de goluri fără penalty în 1.176 de partide (0,70 pe meci). Cristiano Ronaldo are 795 de goluri fără penalty în 1.337 de partide (0,59 pe meci). Messi are cu 26 de goluri mai mult din acțiune deși a jucat cu 161 de meciuri mai puțin."
      },
      {
        q: "Cine a marcat mai multe goluri din lovitură liberă directă?",
        a: "În prezent, cei doi sunt la egalitate perfectă cu câte 66 de goluri din lovitură liberă fiecare în fotbalul de seniori. Messi a marcat 50 pentru Barcelona, 11 pentru Argentina, 3 pentru Inter Miami și 2 pentru PSG. Ronaldo a înscris 33 pentru Real Madrid, 15 pentru Manchester United, 11 pentru Portugalia, 6 pentru Al-Nassr și 1 pentru Juventus."
      },
      {
        q: "Cine are mai multe pase de gol: Messi sau Ronaldo?",
        a: "Lionel Messi are un avans de peste 130 de pase de gol în fața lui Cristiano Ronaldo. Messi cumulează peste 385 de pase decisive oficiale (peste 300 la cluburi și 58+ la Argentina), fiind liderul all-time în istoria fotbalului modern. Ronaldo are 255+ assist-uri."
      },
      {
        q: "Cine a marcat mai multe penalty-uri și care este rata de conversie?",
        a: "Cristiano Ronaldo a înscris 184 de penalty-uri din 220 de încercări (rată de conversie de 83,6%). Lionel Messi a marcat 109 penalty-uri din 140 de încercări (rată de conversie de 77,9%). Ronaldo are cu 75 de penalty-uri înscrise mai mult decât Messi."
      },
      {
        q: "Cine are mai multe hat-trick-uri în carieră?",
        a: "Cristiano Ronaldo are 66 de hat-trick-uri în carieră (56 la echipe de club, 10 la naționala Portugaliei). Lionel Messi are 57 de hat-trick-uri (48 la cluburi, 9 la Argentina). Ronaldo are un avans de 9 hat-trick-uri."
      },
      {
        q: "Cine a avut performanțe mai bune la Cupa Mondială FIFA?",
        a: "Lionel Messi a cucerit Cupa Mondială din Qatar 2022 cu Argentina, fiind singurul fotbalist din istorie care a câștigat de două ori Balonul de Aur al Cupei Mondiale (2014 și 2022). La Mondiale, Messi are 13 goluri și 8 pase decisive în 26 de meciuri, inclusiv 5 goluri în fazele eliminatorii. Ronaldo are 8 goluri și 2 pase în 22 de partide, având 0 goluri și 0 pase decisive în fazele eliminatorii ale Cupei Mondiale."
      },
      {
        q: "Cine a câștigat mai multe meciuri în cele 36 de dueluri directe?",
        a: "În cele 36 de partide oficiale directe, echipele lui Messi au câștigat 16 meciuri, echipele lui Ronaldo au câștigat 11 meciuri, iar 9 s-au încheiat la egalitate. Messi a marcat 22 de goluri în aceste confruntări, iar Ronaldo 21."
      },
      {
        q: "Câte Baloane de Aur și trofee au câștigat fiecare?",
        a: "Messi deține recordul mondial absolut cu 46 de trofee colective oficiale (inclusiv 10 titluri La Liga, 4 Ligi ale Campionilor, 2 Copa América și 1 Cupă Mondială) față de cele 35 ale lui Ronaldo. De asemenea, Messi deține recordul istoric cu 8 Baloane de Aur față de cele 5 ale lui Ronaldo."
      },
      {
        q: "De ce modelele analitice îl desemnează pe Messi drept cel mai mare fotbalist (GOAT)?",
        a: "Statisticile îl favorizează pe Messi deoarece combină golgheterul absolut cu cel mai bun pasator din istorie: medie superioară de goluri (0,79 vs 0,72), 62 de goluri în plus fără penalty în 105 meciuri mai puține, peste 130 de assist-uri în plus, o implicare directă la gol la fiecare 72 de minute (față de 88 min Ronaldo) și triumful la Cupa Mondială 2022."
      }
    ]
  },
  uz: {
    dir: "ltr",
    title: "Messi vs Ronaldu: Statistikalar, Jarima zarbalari, Penaltilar va O'zaro o'yinlar | MessiStats",
    desc: "Lionel Messi vs Krishtianu Ronaldu: 930 ga 979 ta gol, 385+ ga 261 ta assist, 821 ta penaltisiz gol vs 795, 67 ga 65 ta jarima zarbasi, 46 ga 35 ta titul, 8 ga 5 ta “Oltin to'p”. Yakuniy taqqoslash.",
    keywords: "messi ronaldu solishtirma, messi vs ronaldu statistikasi, jarima zarbalari messi ronaldu, penaltilar messi ronaldu, penaltisiz gollar, assistlar messi ronaldu, het triklar, kim yaxshiroq messi yoki ronaldu, kimning goli ko'proq, o'zaro o'yinlar, jahon chempionati, oltin to'p, sovrinlar",
    brand: "MessiStats",
    homeName: "Bosh sahifa",
    latestGoalName: "Soʻnggi gol",
    bdayName: "Tug'ilgan kun gollari",
    vsRonaldoName: "vs Ronaldu",
    vsRealMadridName: "vs Real Madrid",
    uclName: "Chempionlar Ligasi",
    goalsByYearName: "Yillar bo'yicha gollar",
    goalsBySeasonName: "Mavsumlar bo'yicha gollar",
    dashboardName: "Boshqaruv paneli",
    timelineName: "Xronologiya",
    achievementsName: "Yutuqlar va sovrinlar",
    skipText: "Asosiy qismga o'tish",
    eyebrow: "Buyuk Raqobat <i></i> <span>To'liq Karyera Taqqoslashi va O'zaro O'yinlar</span>",
    h1: "Lionel Messi vs Krishtianu Ronaldu",
    lead: "Zamonaviy futbolning ikki buyuk afsonasi oʻrtasidagi rasmiy statistik taqqoslash. Jami gollar, penaltisiz gollar, jarima zarbalari, penaltilar, golli uzatmalar, sovrinlar, individual yutuqlar va oʻzaro 36 ta toʻqnashuv.",
    verdictBadge: "GOAT HUKMI • TOʻLIQ RASMIY MAʼLUMOTLAR",
    verdictTitle: "Karyera statistikasida kim ustun: Messi yoki Ronaldu?",
    verdictText: "Kattalar safidagi barcha rasmiy oʻyinlarda <b>Lionel Messi 1 176 ta oʻyinda 930 ta gol urib, 385 dan ortiq assist muallifi boʻlgan</b> (har bir oʻyinda oʻrtacha 1,12 ta golda ishtirok), <b>Krishtianu Ronaldu esa 1 337 ta oʻyinda 979 ta gol va 261 ta assist bilan tarixdagi mutlaq toʻpurar hisoblanadi</b> (har bir oʻyinda 0,93 ta ishtirok). Ronaldu umumiy gollar boʻyicha oldinda boʻlsa-da (<b>979 ga 930</b>), Messi <b>161 ta kam oʻyin oʻtkazib</b> va yuqori samaradorlik bilan (<b>0,79 ga 0,73</b>) 930 ta golga yetdi, penaltilarsiz gollar (<b>821 ga 795</b>) va assistlar soni boʻyicha (<b>385+ ga 261</b>) yetakchi, ikkita “Oltin toʻp” bilan <b>FIFA Jahon chempionligini (2022)</b> qoʻlga kiritdi, <b>“Oltin toʻp”lar soni (8 ga 5)</b> va <b>jamoaviy sovrinlar soni boʻyicha (46 ga 35)</b> yaqqol oldinda.",
    tableStat: "Statistika",
    tableLeader: "Yetakchi",
    coreHeader: "Kattalar safidagi rasmiy gollar",
    coreIntro: "Klublar va milliy terma jamoalarning tasdiqlangan rasmiy statistikasi.",
    statGoals: "Kattalar safidagi rasmiy gollar",
    statApps: "Oʻtkazilgan rasmiy oʻyinlar",
    statRatio: "Oʻyin boshiga gol nisbati",
    statAssists: "Karyeradagi golli uzatmalar",
    statGoalContrib: "Gollardagi ishtirok (Gol + Assist)",
    statContribRatio: "Oʻyin boshiga golda ishtirok",
    statMinsContrib: "Goldagi ishtirok uchun ketgan daqiqa",
    statTrophies: "Jamoaviy sovrinlar",
    statBallons: "“Oltin toʻp” mukofotlari",
    statGoldenShoes: "Yevropa “Oltin butsa”si",
    statWorldCup: "FIFA Jahon chempionati",
    statH2HWins: "Oʻzaro oʻyinlardagi gʻalabalar",
    scoringHeader: "Gollarning urilish usuli: Jarima zarbalari, Penaltilar va Oʻyin vaziyatidagi gollar",
    scoringIntro: "Har ikki toʻpurarning gollari tahlili — ochiq oʻyindagi mahorat va standart vaziyatlar.",
    statNPG: "Penaltisiz gollar (NPG)",
    statNPGRatio: "Oʻyin boshiga penaltisiz gol nisbati",
    statFreeKicks: "Toʻgʻridan-toʻgʻri jarima zarbasidan gollar",
    statPenalties: "Penaltidan gollar (Urinishlar)",
    statPenConversion: "Penaltilarni amalga oshirish aniqligi",
    statHatTricks: "Karyeradagi het-triklar",
    statPokers: "Bir oʻyinda 4 ta gol (Pokerlar)",
    stat5Goals: "Bir oʻyinda 5 ta gol (Penta-triklar)",
    statOutsideBox: "Jarima maydonchasi tashqarisidan gollar",
    statOpenPlay: "Ochiq oʻyindagi gollar",
    playmakingHeader: "Ijodkorlik, Paslar va Hujumdagi yetakchilik",
    playmakingIntro: "Golli uzatmalar, yaratilgan xavfli vaziyatlar va oʻyinni tashkil qilish mahorati.",
    statAllAssists: "Karyeradagi jami assistlar",
    statClubAssists: "Klublardagi assistlar",
    statIntAssists: "Terma jamoadagi assistlar",
    statBigChances: "Yaratilgan yirik vaziyatlar",
    intlHeader: "Milliy terma jamoalar va Katta finallar",
    intlIntro: "Dunyoning eng nufuzli turnirlari: Jahon chempionati va kubok finallari.",
    statWCTitles: "Jahon chempionligi unvonlari",
    statWCGoldenBall: "Jahon chempionatining “Oltin toʻpi” (Eng yaxshi oʻyinchi)",
    statWCGoals: "Jahon chempionatidagi gollar",
    statWCAssists: "Jahon chempionatidagi assistlar",
    statWCKO: "Jahon chempionatining pley-off bosqichidagi gollar",
    statWCKOAssists: "Pley-off bosqichidagi assistlar",
    statContTitles: "Qitʼa chempionligi sovrinlari",
    statFinalsGoals: "Kubok finallarida urilgan gollar",
    h2hHeader: "Oʻzaro oʻtkazilgan 36 ta uchrashuv",
    h2hIntro: "Messi va Ronaldu maydonda toʻgʻridan-toʻgʻri toʻqnash kelgan 36 ta oʻyinning toʻliq rekordi.",
    kpiMessiWins: "Messining gʻalabalari",
    kpiDraws: "Duranglar",
    kpiRonaldoWins: "Ronalduning gʻalabalari",
    kpiGoalsScored: "Urilgan gollar",
    kpiEqualMatches: "Teng natijalar",
    compClasico: "El-Klasiko (Barselona vs Real Madrid)",
    compUCL: "UEFA Chempionlar Ligasi",
    compIntl: "Xalqaro oʻrtoqlik uchrashuvlari",
    bdayTitle: "Messi Krishtianu Ronalduning tug'ilgan kunida gol urganmi?",
    bdayDesc: "Krishtianu Ronaldu 5-fevralda tugʻilgan. 5-fevral kuni Messi nima qilganini koʻring va oʻz tugʻilgan kuningizni ham tekshiring!",
    bdayBtn: "5-fevralni tekshirish ⚽",
    faqHeader: "Koʻp beriladigan savollar: Messi vs Ronaldu",
    exploreTitle: "Toʻliq statistikani koʻrish",
    footerDir: "Karyera rekordlari va Raqobat",
    footerIntl: "Xalqaro nashrlar / Tillar",
    crestNote: "Klub logotiplari tegishli klublarning savdo belgilari hisoblanadi va faqat maʼlumot berish uchun koʻrsatilgan.",
    badgeRonaldoGoals: "Ronaldu (+49 ta gol, tarixdagi mutlaq rekord)",
    badgeMessiNPG: "Messi (+26 ta penaltisiz gol)",
    badgeMessiFK: "Messi (+2 ta jarima zarbasi)",
    badgeRonaldoPen: "Ronaldu (+75 ta penalti)",
    badgeMessiAssists: "Messi (+124 ta assist)",
    badgeRonaldoHT: "Ronaldu (+7 ta het-trik)",
    badgeMessiWC: "Messi (Chempion, 2 ta Oltin toʻp)",
    badgeMessiTrophies: "Messi (+11 ta sovrin, jahon rekordi)",
    badgeMessiBallon: "Messi (+3 ta Oltin toʻp, rekord)",
    badgeMessiH2H: "Messi (+5 ta gʻalaba, 16 ga 11)",
    badgeMessiFinals: "Messi (finallarda +13 ta gol)",
        thCompetition: "Musobaqa",
    thMatches: "Oʻyinlar",
    thMessiWins: "Messi gʻalabalari",
    thDraws: "Duranglar",
    thRonaldoWins: "Ronaldo gʻalabalari",
    thMessiGoals: "Messi gollari",
    thRonaldoGoals: "Ronaldo gollari",
    tableTotal: "Jami",
    badge16Wins: "16 Gʻalaba",
    badge11Wins: "11 Gʻalaba",
    tied2All: "Teng (har biri 2 ta)",
    badgeMessiRecord: "Messi (Rekord)",
    wcKOStageMessi: "Messi (1/8, 1/4, 1/2, Final)",
    goalsKnockoutMessi: "5 Gol",
    goalsKnockoutRonaldo: "0 Gol",
    assistsKnockoutMessi: "6 Assist",
    assistsKnockoutRonaldo: "0 Assist",
    finalsRecordMessi: "50 Finalda 35 Gol",
    finalsRecordRonaldo: "38 Finalda 22 Gol",
    continentalMessi: "3 (2 Copa América, 1 Finalissima)",
    continentalRonaldo: "2 (1 Yevro, 1 Millatlar Ligasi)",
    adLabel: "Reklama",
    bdayPromoBadge: "🎂 NOYOB INTERAKTIV VOSITA",
    bdayPromoAria: "Messi sizning tugʻilgan kuningizda gol urganmi?",
    jumpCore: "Faoliyatdagi jami natijalar",
    jumpScoring: "Jarima zarbalari va penaltilar",
    jumpPlaymaking: "Assistlar va maydondagi taʼsir",
    jumpIntl: "Jahon chempionati va finallar",
    jumpH2H: "36 ta oʻzaro oʻyin",
    jumpFaq: "Koʻp beriladigan savollar",
    faqs: [
      {
        q: "Karyerada kim koʻproq gol urgan: Messi yoki Krishtianu Ronaldu?",
        a: "Krishtianu Ronaldu 1 337 ta rasmiy oʻyinda 979 ta gol urib (har bir oʻyinda 0,73 ta gol), futbol tarixidagi mutlaq toʻpurar hisoblanadi. Lionel Messi 1 176 ta oʻyinda 930 ta gol urgan (0,79 ta gol). Ronaldu 49 ta gol bilan oldinda, ammo Messi 161 ta kam oʻyin oʻtkazgan va uning oʻrtacha samaradorligi yuqoriroq."
      },
      {
        q: "Penaltilarni hisobga olmaganda kim koʻp gol urgan?",
        a: "Lionel Messi penaltisiz 821 ta gol urgan (har bir oʻyinda 0,70 ta gol). Krishtianu Ronaldu penaltisiz 795 ta gol urgan (0,59 ta gol). Messi 161 ta kam oʻyin oʻtkazgan boʻlsa-da, penaltisiz gollar boʻyicha 26 ta gol oldinda."
      },
      {
        q: "Jarima zarbasidan kim koʻproq gol urgan?",
        a: "Hozirda har ikkala afsona ham kattalar safida toʻgʻridan-toʻgʻri jarima zarbasidan 66 tadan gol urib tenglashib turibdi. Messi Barselona safida 50 ta, Argentina safida 11 ta, Inter Mayami safida 3 ta va PSJ safida 2 ta jarima zarbasi goli urgan. Ronaldu Real Madrid safida 33 ta, Manchester Yunayted safida 15 ta, Portugaliya safida 11 ta, Al-Nasr safida 6 ta va Yuventus safida 1 ta gol urgan."
      },
      {
        q: "Golli uzatmalar (assistlar) boʻyicha kim yetakchi: Messi yoki Ronaldu?",
        a: "Lionel Messi Krishtianu Ronaldudan 130 dan ortiq assist oldinda. Messi 385 dan ortiq rasmiy assist muallifi boʻlgan (klublarda 300+ va Argentina safida 58+), bu zamonaviy futbol tarixidagi mutlaq jahon rekordidir. Ronalduda 255 dan ortiq assist mavjud."
      },
      {
        q: "Kim koʻproq penalti tepgan va ularning aniqligi qanday?",
        a: "Krishtianu Ronaldu 220 ta urinishdan 184 ta penalti urgan (83,6% aniqlik). Lionel Messi 140 ta urinishdan 109 ta penalti urgan (77,9% aniqlik). Ronaldu Messidan 75 ta koʻproq penalti kiritgan."
      },
      {
        q: "Karyerada kim koʻproq het-trik qayd etgan?",
        a: "Krishtianu Ronaldu 66 ta het-trik qayd etgan (klublarda 56 ta, Portugaliya safida 10 ta). Lionel Messi 57 ta het-trik qayd etgan (klublarda 48 ta, Argentina safida 9 ta). Ronaldu 9 ta het-trik oldinda."
      },
      {
        q: "FIFA Jahon chempionatida kim yaxshiroq natija koʻrsatgan?",
        a: "Lionel Messi 2022-yilda Qatarda oʻtgan Jahon chempionatida gʻolib boʻldi va tarixdagi ikki marta Jahon chempionatining “Oltin toʻp”ini qoʻlga kiritgan yagona futbolchi hisoblanadi (2014 va 2022). Jahon chempionatlarida Messida 26 ta oʻyinda 13 ta gol va 8 ta assist bor, shundan 5 tasi pley-off bosqichida. Ronalduda 22 ta oʻyinda 8 ta gol va 2 ta assist bor, ammo Jahon chempionati pley-off bosqichida 0 ta gol va 0 ta assist qayd etgan."
      },
      {
        q: "Oʻzaro oʻtkazilgan 36 ta oʻyinda kim koʻproq gʻalaba qozongan?",
        a: "Oʻzaro oʻtkazilgan 36 ta rasmiy oʻyinda Messining jamoalari 16 marta, Ronalduning jamoalari 11 marta gʻalaba qozongan, 9 ta oʻyin durang bilan tugagan. Messi bu toʻqnashuvlarda 22 ta, Ronaldu esa 21 ta gol urgan."
      },
      {
        q: "Ular qancha “Oltin toʻp” va jamoaviy sovrin yutgan?",
        a: "Messi 46 ta jamoaviy sovrin bilan jahon rekordiga ega (shu jumladan 10 ta La Liga, 4 ta Chempionlar Ligasi, 2 ta Amerika Kubogi va 1 ta Jahon chempionati), Ronalduda esa 35 ta titul bor. Shuningdek, Messi 8 ta “Oltin toʻp” bilan mutlaq rekordchi hisoblanadi (Ronalduda 5 ta)."
      },
      {
        q: "Nima uchun statistik tahlilchilar Messini tarixdagi eng yaxshi oʻyinchi (GOAT) deb hisoblashadi?",
        a: "Tahliliy modellar Messini eng yuqori oʻringa qoʻyadi, chunki u bir vaqtning oʻzida ham eng kuchli toʻpurar, ham eng zoʻr assistent: yuqori gol koeffitsiyenti (0,79 ga 0,72), 105 ta kam oʻyinda 62 ta koʻproq penaltisiz gol, 130 dan ortiq assist ustunligi, har 72 daqiqada goldagi ishtirok va 2022-yilgi Jahon chempionligi."
      }
    ]
  }
};

function generateHtml(lang) {
  const t = I18N[lang] || I18N.en;
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
          "name": "MessiStats",
          "alternateName": "messistat.com",
          "url": "https://www.messistat.com/",
          "logo": {
            "@type": "ImageObject",
            "url": "https://www.messistat.com/img/logo.png",
            "width": 512,
            "height": 512
          }
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
<meta property="og:image" content="https://www.messistat.com/img/og-messi.jpg"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${t.title}"/>
<meta name="twitter:description" content="${t.desc}"/>
<meta name="twitter:image" content="https://www.messistat.com/img/og-messi.jpg"/>
<link rel="icon" href="/favicon.ico" sizes="48x48"/>
<link rel="icon" href="/favicon.svg" type="image/svg+xml"/>
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"/>
<link rel="manifest" href="/site.webmanifest"/>
<link rel="preload" href="/fonts/plus-jakarta-sans-latin.woff2" as="font" type="font/woff2" crossorigin/>
<link rel="preload" href="/fonts/dm-sans-latin.woff2" as="font" type="font/woff2" crossorigin/>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8397501846754760" crossorigin="anonymous"></script>
<link rel="stylesheet" href="/src/styles.css"/>
<script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
</script>
</head>
<body data-page="vs-ronaldo">
<a class="skip" href="#main">${t.skipText}</a>
<aside aria-label="Navigation" class="rail">
<a aria-label="${t.brand}" class="rail-badge" href="${slugPath}"><svg aria-hidden="true" class="rail-mark" viewbox="0 0 64 64"><defs><lineargradient id="msg-${lang}-vs-ronaldo" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#6d0f2e"></stop><stop offset=".55" stop-color="#1d3fae"></stop><stop offset="1" stop-color="#0e7cc0"></stop></lineargradient></defs><path d="M32 3 55 10v20c0 16-11 26-23 31C20 56 9 46 9 30V10Z" fill="url(#msg-${lang}-vs-ronaldo)" stroke="#e3b93e" stroke-linejoin="round" stroke-width="2.5"></path><path d="M47.5 9.5l1.7 3.5 3.8.6-2.8 2.7.7 3.8-3.4-1.8-3.4 1.8.7-3.8-2.8-2.7 3.8-.6z" fill="#e3b93e"></path><text fill="#fff" font-family="'Plus Jakarta Sans',Arial,sans-serif" font-size="19" font-weight="800" text-anchor="middle" x="31" y="44">M10</text></svg><span class="rail-word">Messi<b>Stat</b></span></a>
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
    <a id="rail-admin-link" href="${slugPath}/admin" style="display:none;" aria-label="Admin">
      <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"></path><path d="M12 6v6l4 2"></path></svg>
      <span>Admin</span>
    </a>
</nav>
<button aria-label="Toggle dark mode" class="theme-toggle" id="theme-toggle" title="Toggle dark mode" type="button">
<svg aria-hidden="true" class="sun-icon" viewbox="0 0 24 24"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path></svg>
<svg aria-hidden="true" class="moon-icon" viewbox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
<span class="theme-label">Dark mode</span>
</button>
</aside>

<div class="page">
  <main class="wrap" id="main">
    <p class="eyebrow">${t.eyebrow}</p>
    <h1>${t.h1}</h1>
    <p class="lede">${t.lead}</p>

    <!-- Interactive Jump Navigation Pills -->
    <nav class="comparison-toc" aria-label="Comparison Sections">
      <a href="#core-matrix" class="toc-pill">📊 ${t.jumpCore}</a>
      <a href="#scoring-matrix" class="toc-pill">🎯 ${t.jumpScoring}</a>
      <a href="#playmaking-matrix" class="toc-pill">🅰️ ${t.jumpPlaymaking}</a>
      <a href="#intl-matrix" class="toc-pill">🏆 ${t.jumpIntl}</a>
      <a href="#h2h-matrix" class="toc-pill">⚔️ ${t.jumpH2H}</a>
      <a href="#faq" class="toc-pill">❓ ${t.jumpFaq}</a>
    </nav>

    <!-- Rank #0 Featured Snippet GOAT Verdict Box -->
    <section class="goat-verdict-box" aria-label="GOAT Verdict Summary">
      <div class="goat-verdict-badge">${t.verdictBadge}</div>
      <h2 class="goat-verdict-title">${t.verdictTitle}</h2>
      <p class="goat-verdict-summary">${t.verdictText}</p>
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
            <td>930</td>
            <td><b style="color:#dc2626;">979</b></td>
            <td class="left"><span class="leader-badge-ronaldo">${t.badgeRonaldoGoals}</span></td>
          </tr>
          <tr>
            <td class="left"><b>${t.statApps}</b></td>
            <td>1,176</td>
            <td>1,337</td>
            <td class="left"><span class="leader-badge-messi">Messi (161 ${lang === 'es' ? 'partidos menos' : lang === 'pt' ? 'jogos a menos' : lang === 'fr' ? 'matchs de moins' : lang === 'ar' ? 'مباراة أقل' : lang === 'bn' ? 'ম্যাচ কম' : lang === 'hi' ? 'मैच कम' : lang === 'ro' ? 'meciuri mai puține' : lang === 'uz' ? 'ta kam oʻyin' : 'fewer matches'})</span></td>
          </tr>
          <tr>
            <td class="left"><b>${t.statRatio}</b></td>
            <td><b style="color:var(--accent);">0.79</b></td>
            <td>0.73</td>
            <td class="left"><span class="leader-badge-messi">Messi (+0.06)</span></td>
          </tr>
          <tr>
            <td class="left"><b>${t.statAssists}</b></td>
            <td><b style="color:var(--accent);">385+</b></td>
            <td>261</td>
            <td class="left"><span class="leader-badge-messi">${t.badgeMessiAssists}</span></td>
          </tr>
          <tr>
            <td class="left"><b>${t.statGoalContrib}</b></td>
            <td><b style="color:var(--accent);">1,315+</b></td>
            <td>1,240</td>
            <td class="left"><span class="leader-badge-messi">Messi (+75)</span></td>
          </tr>
          <tr>
            <td class="left"><b>${t.statContribRatio}</b></td>
            <td><b style="color:var(--accent);">1.12</b></td>
            <td>0.93</td>
            <td class="left"><span class="leader-badge-messi">Messi (+0.19)</span></td>
          </tr>
          <tr>
            <td class="left"><b>${t.statMinsContrib}</b></td>
            <td><b style="color:var(--accent);">72 min</b></td>
            <td>88 min</td>
            <td class="left"><span class="leader-badge-messi">Messi (16 min)</span></td>
          </tr>
          <tr>
            <td class="left"><b>${t.statTrophies}</b></td>
            <td><b style="color:var(--accent);">46</b></td>
            <td>35</td>
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
            <td><b style="color:var(--accent);">821</b></td>
            <td>795</td>
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
            <td><b style="color:var(--accent);">67</b></td>
            <td>65</td>
            <td class="left"><span class="leader-badge-messi">${t.badgeMessiFK}</span></td>
          </tr>
          <tr>
            <td class="left"><b>${t.statPenalties}</b></td>
            <td>109 (140)</td>
            <td><b style="color:#dc2626;">184 (220)</b></td>
            <td class="left"><span class="leader-badge-ronaldo">${t.badgeRonaldoPen}</span></td>
          </tr>
          <tr>
            <td class="left"><b>${t.statPenConversion}</b></td>
            <td>77.9%</td>
            <td><b style="color:#dc2626;">83.6%</b></td>
            <td class="left"><span class="leader-badge-ronaldo">Ronaldo (+5.7%)</span></td>
          </tr>
          <tr>
            <td class="left"><b>${t.statHatTricks}</b></td>
            <td>59</td>
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
            <td>125+</td>
            <td class="left"><span class="leader-badge-messi">Messi (+30)</span></td>
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
            <td><b style="color:var(--accent);">385+</b></td>
            <td>261</td>
            <td class="left"><span class="leader-badge-messi">${t.badgeMessiAssists}</span></td>
          </tr>
          <tr>
            <td class="left"><b>${t.statClubAssists}</b></td>
            <td><b style="color:var(--accent);">327+</b></td>
            <td>216</td>
            <td class="left"><span class="leader-badge-messi">Messi (+111)</span></td>
          </tr>
          <tr>
            <td class="left"><b>${t.statIntAssists}</b></td>
            <td><b style="color:var(--accent);">58+</b></td>
            <td>45</td>
            <td class="left"><span class="leader-badge-messi">Messi (+13)</span></td>
          </tr>
          <tr>
            <td class="left"><b>${t.statBigChances}</b></td>
            <td><b style="color:var(--accent);">430+</b></td>
            <td>210+</td>
            <td class="left"><span class="leader-badge-messi">Messi (+220)</span></td>
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
            <td><b style="color:var(--accent);">13</b></td>
            <td>8</td>
            <td class="left"><span class="leader-badge-messi">Messi (+5)</span></td>
          </tr>
          <tr>
            <td class="left"><b>${t.statWCAssists}</b></td>
            <td><b style="color:var(--accent);">8</b></td>
            <td>2</td>
            <td class="left"><span class="leader-badge-messi">Messi (+6)</span></td>
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
            <td class="left"><span class="leader-badge-messi">Messi (+1)</span></td>
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
        <script>
          atOptions = {
            'key' : '53bbdf66c3aca04103610bd62cfc3e6a',
            'format' : 'iframe',
            'height' : 250,
            'width' : 300,
            'params' : {}
          };
        </script>
        <script src="https://www.highrevenueformat.com/53bbdf66c3aca04103610bd62cfc3e6a/invoke.js"></script>
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

    <!-- VIRAL MAIN ATTRACTION: Birthday Promo Card -->
    <aside class="bday-promo-card" aria-label="${t.bdayPromoAria}">
      <div class="bday-promo-badge">${t.bdayPromoBadge}</div>
      <div class="bday-promo-body">
        <div class="bday-promo-text">
          <h3>${t.bdayTitle}</h3>
          <p>${t.bdayDesc}</p>
        </div>
        <a href="${slugPath}/birthday?date=02-05" class="btn btn-primary bday-promo-btn">${t.bdayBtn}</a>
      </div>
    </aside>

    <!-- Ad Slot -->
    <aside aria-label="${t.adLabel}" class="ad-native-wrap">
      <span class="ad-native-label">${t.adLabel}</span>
      <div class="ad-native-slot">
        <script async="async" data-cfasync="false" src="https://pl31316537.profitableratecpmnetwork.com/f4bcf68dc7a4accd4a4c773aa7965161/invoke.js"></script>
        <div id="container-f4bcf68dc7a4accd4a4c773aa7965161"></div>
      </div>
    </aside>

    <!-- FAQ Accordion Section -->
    <div class="shead"><h2>${t.faqHeader}</h2></div>
    <div class="faq-accordion" id="faq">
${faqItemsHtml}
    </div>

    <!-- Banner Ad Slot -->
    <aside aria-label="${t.adLabel}" class="ad-banner-wrap">
      <span class="ad-native-label">${t.adLabel}</span>
      <div class="ad-banner-slot">
        <script>
          atOptions = {
            'key' : '53bbdf66c3aca04103610bd62cfc3e6a',
            'format' : 'iframe',
            'height' : 250,
            'width' : 300,
            'params' : {}
          };
        </script>
        <script src="https://www.highrevenueformat.com/53bbdf66c3aca04103610bd62cfc3e6a/invoke.js"></script>
      </div>
    </aside>

    <!-- Support & Donation Card -->
    <section class="support-card" id="support" aria-label="Support MessiStats">
      <div class="support-inner">
        <div class="support-icon">☕</div>
        <div class="support-text">
          <h3>Support MessiStats</h3>
          <p>MessiStats is an independent project dedicated to tracking all 930+ career goals and video replays with zero paywalls. If you enjoy using this site, consider buying us a coffee or donating with crypto to help cover hosting and video CDN costs!</p>
        </div>
        <div class="support-actions">
          <a href="https://buymeacoffee.com/messistat" target="_blank" rel="noopener noreferrer" class="btn-support bmac">
            <span>☕ Buy Me a Coffee</span>
          </a>
          <a href="https://ko-fi.com/messistat" target="_blank" rel="noopener noreferrer" class="btn-support kofi">
            <span>💖 Support on Ko-fi</span>
          </a>
        </div>
      </div>

      <div class="support-crypto-box">
        <div class="crypto-meta">
          <span class="crypto-badge">🪙 Crypto (BEP-20 / BNB Chain)</span>
          <span class="crypto-label">Direct Wallet Donation (USDT / BNB / ETH / BUSD):</span>
        </div>
        <div class="crypto-copy-row">
          <code class="crypto-address" id="crypto-addr">0xe78ee7a6ce01978562c90df0fa3f775215457390</code>
          <button type="button" class="btn-copy-crypto" onclick="navigator.clipboard.writeText('0xe78ee7a6ce01978562c90df0fa3f775215457390'); this.textContent='✓ Copied!'; setTimeout(()=>this.textContent='Copy 📋', 2500);" aria-label="Copy BEP20 Wallet Address">
            Copy 📋
          </button>
        </div>
      </div>
    </section>

    <h2>${t.exploreTitle}</h2>
    <nav class="explore" id="explore"></nav>
    <footer class="site-footer">
      <nav class="footer-nav" aria-label="Site directory">
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
            <a href="/ar" hreflang="ar">العربية (مصر والوطن العربي)</a>
            <a href="/bn" hreflang="bn">বাংলা (বাংলাদেশ ও ভারত)</a>
            <a href="/hi" hreflang="hi">हिन्दी (भारत)</a>
            <a href="/ro" hreflang="ro">Română (România)</a>
            <a href="/uz" hreflang="uz">Oʻzbekcha (Oʻzbekiston)</a>
          </div>
        </div>
      </nav>
      <p id="foot-date"></p>
      <p class="crest-note">${t.crestNote}</p>
    </footer>
  </main>
</div>

<script src="/src/app.js" type="module"></script>
<!-- Sticky Bottom Anchor Ad Dock (Dismissible) -->
<aside class="ad-sticky-dock" id="ad-sticky-dock" aria-label="${t.adLabel}">
  <div class="ad-sticky-bar">
    <span class="ad-sticky-tag">${t.adLabel}</span>
    <button type="button" class="ad-sticky-close-btn" id="ad-sticky-close" aria-label="Close advertisement" onclick="document.getElementById('ad-sticky-dock').classList.add('hidden')">&times;</button>
  </div>
  <div class="ad-sticky-slot">
    <script>
      atOptions = {
        'key' : '53bbdf66c3aca04103610bd62cfc3e6a',
        'format' : 'iframe',
        'height' : 250,
        'width' : 300,
        'params' : {}
      };
    </script>
    <script src="https://www.highrevenueformat.com/53bbdf66c3aca04103610bd62cfc3e6a/invoke.js"></script>
  </div>
</aside>
</body>
</html>
`;

  return html;
}

console.log("Generating 9 sophisticated /messi-vs-ronaldo pages...");
for (const lang of LANGS) {
  const html = generateHtml(lang);
  const targetFile = lang === "en" 
    ? path.join(rootDir, "messi-vs-ronaldo.html")
    : path.join(rootDir, lang, "messi-vs-ronaldo.html");
  
  fs.writeFileSync(targetFile, html, "utf8");
  console.log(`[PASS] Generated ${lang === "en" ? "" : lang + "/"}messi-vs-ronaldo.html (${(html.length / 1024).toFixed(1)} KB)`);
}

console.log("\nAll 9 Messi vs Ronaldo pages generated successfully!");
