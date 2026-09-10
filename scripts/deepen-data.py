import json
p = 'Projects/messi-stats/public/data/messi-data.json'
d = json.load(open(p))

d['profile'].update({"age": 39, "role": "Forward", "current": ["Inter Miami", "Argentina"]})

d['totals']['goalsPerGame'] = round(927/1172, 2)
d['totals']['club']['goalsPerGame'] = round(802/965, 2)
d['totals']['country']['goalsPerGame'] = round(125/207, 2)

# Calendar-year goals: published year tallies, reconciled to 927 and to Argentina years in this file.
cal = [(2004,0),(2005,3),(2006,12),(2007,31),(2008,22),(2009,38),(2010,60),(2011,59),(2012,91),(2013,45),(2014,58),(2015,52),(2016,59),(2017,54),(2018,51),(2019,50),(2020,27),(2021,43),(2022,35),(2023,42),(2024,29),(2025,35),(2026,31)]
assert sum(g for _, g in cal) == 927, sum(g for _, g in cal)
cum = 0
rows = []
for y, g in cal:
    cum += g
    rows.append({"year": y, "goals": g, "careerTotal": cum, "age": y - 1987,
                 "status": "provisional-ongoing" if y == 2026 else "cross-checked"})
d['calendarYears'] = rows

# Competition split derived from season rows (club) + documented tournament counts (country).
d['byCompetition'] = [
  {"competition": "La Liga", "team": "Barcelona", "goals": 474},
  {"competition": "UEFA Champions League", "team": "Barcelona / PSG", "goals": 129},
  {"competition": "Argentina: qualifiers / Finalissima / friendlies", "team": "Argentina", "goals": 90},
  {"competition": "MLS (regular season)", "team": "Inter Miami", "goals": 68},
  {"competition": "Copa del Rey", "team": "Barcelona", "goals": 56},
  {"competition": "Spanish Super Cup / UEFA Super Cup / FIFA Club World Cup", "team": "Barcelona", "goals": 22},
  {"competition": "Ligue 1", "team": "Paris Saint-Germain", "goals": 22},
  {"competition": "Leagues Cup / MLS playoffs / other cups", "team": "Inter Miami", "goals": 22},
  {"competition": "FIFA World Cup", "team": "Argentina", "goals": 21},
  {"competition": "Copa America", "team": "Argentina", "goals": 14},
  {"competition": "Concacaf Champions Cup", "team": "Inter Miami", "goals": 8},
  {"competition": "Trophee des Champions", "team": "Paris Saint-Germain", "goals": 1}
]
assert sum(r['goals'] for r in d['byCompetition']) == 927

d['byFinish'] = [
  {"finish": "Open play", "goals": 752},
  {"finish": "Penalties", "goals": 109},
  {"finish": "Free kicks", "goals": 66}
]
d['hatTricks'] = 57
d['byBodyPart'] = [
  {"part": "Left foot", "goals": 740},
  {"part": "Right foot", "goals": 150},
  {"part": "Head", "goals": 27},
  {"part": "Other (chest etc.)", "goals": 10}
]
assert sum(r['goals'] for r in d['byBodyPart']) == 927

d['trophies'] = [
  {"title": "La Liga", "team": "Barcelona", "years": [2005,2006,2009,2010,2011,2013,2015,2016,2018,2019]},
  {"title": "Copa del Rey", "team": "Barcelona", "years": [2009,2012,2015,2016,2017,2018,2021]},
  {"title": "Supercopa de Espana", "team": "Barcelona", "years": [2005,2006,2009,2010,2011,2013,2016,2018]},
  {"title": "UEFA Champions League", "team": "Barcelona", "years": [2006,2009,2011,2015]},
  {"title": "UEFA Super Cup", "team": "Barcelona", "years": [2009,2011,2015]},
  {"title": "FIFA Club World Cup", "team": "Barcelona", "years": [2009,2011,2015]},
  {"title": "Ligue 1", "team": "Paris Saint-Germain", "years": [2022,2023]},
  {"title": "Trophee des Champions", "team": "Paris Saint-Germain", "years": [2022]},
  {"title": "Leagues Cup", "team": "Inter Miami", "years": [2023]},
  {"title": "MLS Cup", "team": "Inter Miami", "years": [2025], "note": "ESPN 2026 tracker: first MLS Cup in club history"},
  {"title": "Copa America", "team": "Argentina", "years": [2021,2024]},
  {"title": "Finalissima", "team": "Argentina", "years": [2022]},
  {"title": "FIFA World Cup", "team": "Argentina", "years": [2022]},
  {"title": "Ballon d'Or", "team": "Individual", "years": [2009,2010,2011,2012,2015,2019,2021,2023]},
  {"title": "European Golden Shoe", "team": "Individual", "years": [2010,2012,2013,2017,2018,2019]},
  {"title": "The Best FIFA Men's Player", "team": "Individual", "years": [2019,2022,2023]},
  {"title": "Pichichi (La Liga top scorer)", "team": "Individual", "years": [2010,2012,2013,2017,2018,2019,2020,2021]},
  {"title": "UCL top scorer", "team": "Individual", "years": [2009,2010,2011,2012,2015,2019]},
  {"title": "World Cup Golden Ball", "team": "Individual", "years": [2014,2022]},
  {"title": "Copa America Best Player", "team": "Individual", "years": [2015,2021]}
]

d['timeline'] = [
  {"year": 2004, "event": "Barcelona senior debut vs Espanyol at 17; first goal vs Albacete makes him the club youngest scorer"},
  {"year": 2005, "event": "Argentina senior debut vs Hungary; U-20 World Cup Golden Ball and Golden Boot"},
  {"year": 2006, "event": "First La Liga and Champions League titles; first World Cup goal vs Serbia and Montenegro"},
  {"year": 2009, "event": "Treble with Barcelona (Copa, Liga, Champions League); first Ballon d'Or at 22"},
  {"year": 2011, "event": "Champions League final goal vs Manchester United at Wembley; Ballon d'Or No. 3"},
  {"year": 2012, "event": "91 goals in the calendar year, the all-time record; fourth straight Ballon d'Or"},
  {"year": 2014, "event": "World Cup final with Argentina, wins Golden Ball; becomes Barcelona all-time top scorer"},
  {"year": 2015, "event": "Second treble with Barcelona (MSN); fifth Ballon d'Or"},
  {"year": 2016, "event": "Brief Argentina retirement then return after the Copa America final defeat"},
  {"year": 2018, "event": "Hat-trick vs Ecuador seals World Cup qualification; record fifth European Golden Shoe"},
  {"year": 2019, "event": "Sixth Ballon d'Or after a 50-goal season; 10th La Liga title"},
  {"year": 2021, "event": "Joins PSG; wins Copa America with Argentina (Golden Boot + Best Player); 7th Ballon d'Or"},
  {"year": 2022, "event": "Wins the FIFA World Cup with Argentina (7 goals, Golden Ball); Finalissima vs Italy"},
  {"year": 2023, "event": "Joins Inter Miami; wins the Leagues Cup; record 8th Ballon d'Or"},
  {"year": 2024, "event": "Second Copa America with Argentina; becomes the most-capped Argentine ever"},
  {"year": 2025, "event": "Lifts the MLS Cup, the first in Miami history; passes 900 career goals"},
  {"year": 2026, "event": "World Cup final: Spain 1-0 Argentina a.e.t.; Messi scores 8 and sets the all-time World Cup scoring record (21)"},
  {"year": 2026, "event": "927 career goals in 1,172 games; the chase to 1,000 continues at Inter Miami"}
]

d['meta']['verification'] = [
  "Club season splits: Wikipedia Lionel Messi career table (cites BDFutbol match logs), fetched 2026-09-09. Corrected 6 AS.com rows that disagreed (2009/10, 2010/11, 2011/12, 2012/13, 2013/14, 2015/16).",
  "Barcelona total 778 apps / 672 goals matches the club's official tally.",
  "Argentina yearly: Wikipedia sums (207 caps / 125 goals) independently confirmed by ESPN milestones - 196 caps / 115 goals at end 2025, 200th cap and 117th goal in June 2026.",
  "World Cup goals counted directly from openfootball worldcup.json: 2022 = 7, 2026 = 8 - both match press reports and the yearly rows. All-time World Cup total 21.",
  "2026 combined reconciliation: Miami 24/21 + Argentina 11/10 = 35/31 through early Sep 2026, consistent with ESPN 29/25 on 13 Aug 2026 plus games since.",
  "Competition split is derived arithmetic from the season rows (e.g. Barca continental = UCL 120; other = 14 Supercopa + 3 UEFA Super Cup + 5 Club World Cup), so it reconciles to 927 by construction.",
  "Calendar-year table reconciles to 927 and to the Argentina years in this file; 2012 = 91 (record). 2026 is provisional (season ongoing).",
  "PROVISIONAL: byFinish/byBodyPart show widely published compiled tallies (penalties 109, free kicks 66, hat-tricks 57) and must be treated as provisional until hand-counted match by match like ronaldostats.app does."
]
d['byOpponent'] = []

json.dump(d, open(p, 'w'), indent=2, ensure_ascii=False)
print('wrote OK; trophies:', len(d['trophies']), 'timeline:', len(d['timeline']), 'calYears:', len(d['calendarYears']))
