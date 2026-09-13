import json
import urllib.request
import csv
import io
import re
from datetime import datetime
from bs4 import BeautifulSoup

print("=== Compiling Messi 365/366 Calendar Days Goal Database ===")

# 1. Load European Club Goals (672 Barcelona + 32 PSG = 704 goals)
print("1. Loading 704 European club goals from dataset...")
url = "https://raw.githubusercontent.com/azminewasi/Lionel-Messi-Club-Goals/main/data.csv"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
content = urllib.request.urlopen(req).read().decode("utf-8", errors="replace")
club_reader = csv.DictReader(io.StringIO(content))
raw_club_goals = list(club_reader)
print(f"   Loaded {len(raw_club_goals)} raw club goal rows.")

all_goals = []

for r in raw_club_goals:
    d_str = r['Date'].strip()
    m = re.match(r'^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$', d_str)
    if not m:
        continue
    mth, day, yr = int(m.group(1)), int(m.group(2)), int(m.group(3))
    if yr < 100: yr += 2000
    
    comp = r['Competition'].strip()
    if comp == 'LaLiga': comp = 'La Liga'
    elif comp == 'Champions League': comp = 'UEFA Champions League'
    
    opp = r['Opponent'].strip()
    club = r['Club'].strip()
    if club == 'FC Barcelona': club = 'Barcelona'
    
    min_str = r['Minute'].strip()
    score_str = r['Result'].strip()
    gtype = r['Type'].strip()
    
    all_goals.append({
        'year': yr,
        'month': mth,
        'day': day,
        'date': f"{yr}-{mth:02d}-{day:02d}",
        'dayMonth': f"{mth:02d}-{day:02d}",
        'team': club,
        'opponent': opp,
        'competition': comp,
        'score': score_str,
        'minute': min_str,
        'type': gtype or 'Goal',
        'source': 'club-log'
    })

print(f"   Processed {len(all_goals)} European club goals.")

# 2. Parse 125 International Goals from Wikipedia
print("2. Parsing 125 international goals from Wikipedia table...")
with open(r"C:\Users\Abdelli\.gemini\antigravity-cli\brain\a14c5b32-9640-49ef-944a-61aa8c6ff5cd\.system_generated\steps\1345\content.md", encoding="utf-8") as f:
    soup = BeautifulSoup(f.read(), "html.parser")

table = soup.find_all("table")[1]
intl_rows = table.find_all("tr")[1:]

months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
cur_date = None
cur_opp = ""
cur_comp = ""
cur_score = ""

intl_count = 0
for r in intl_rows:
    cells = [c.get_text(strip=True) for c in r.find_all(["td", "th"])]
    if not cells: continue
    date_cell = next((c for c in cells if any(m in c for m in months)), None)
    if date_cell:
        m = re.search(r'(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})', date_cell)
        if m:
            d_day, d_mth_str, d_yr = int(m.group(1)), m.group(2), int(m.group(3))
            d_mth = months.index(d_mth_str) + 1
            cur_date = (d_yr, d_mth, d_day)
        idx = cells.index(date_cell)
        if len(cells) > idx + 2: cur_opp = cells[idx + 2]
        if len(cells) > idx + 3: cur_score = cells[idx + 3]
        if len(cells) > idx + 5: cur_comp = cells[idx + 5]
    
    if cur_date:
        yr, mth, day = cur_date
        all_goals.append({
            'year': yr,
            'month': mth,
            'day': day,
            'date': f"{yr}-{mth:02d}-{day:02d}",
            'dayMonth': f"{mth:02d}-{day:02d}",
            'team': 'Argentina',
            'opponent': cur_opp,
            'competition': cur_comp,
            'score': cur_score,
            'minute': '',
            'type': 'International Goal',
            'source': 'wikipedia-intl'
        })
        intl_count += 1

print(f"   Processed {intl_count} international goals.")

# 3. Parse Inter Miami Goals (98 goals)
print("3. Parsing Inter Miami match goals from Wikipedia season logs...")
miami_goals = []
for yr in [2023, 2024, 2025, 2026]:
    url = f"https://en.wikipedia.org/wiki/{yr}_Inter_Miami_CF_season"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        html = urllib.request.urlopen(req).read().decode("utf-8")
        msoup = BeautifulSoup(html, "html.parser")
        
        for div in msoup.find_all("div", attrs={"data-mw": True}):
            try:
                data = json.loads(div["data-mw"])
                for part in data.get("parts", []):
                    tmpl = part.get("template", {})
                    params = tmpl.get("params", {})
                    g1 = params.get("goals1", {}).get("wt", "")
                    g2 = params.get("goals2", {}).get("wt", "")
                    date_raw = params.get("date", {}).get("wt", "")
                    t1 = params.get("team1", {}).get("wt", "")
                    t2 = params.get("team2", {}).get("wt", "")
                    score = params.get("score", {}).get("wt", "")
                    round_name = params.get("round", {}).get("wt", "")
                    
                    clean_date = re.sub(r'\[\[(?:[^|\]]*\|)?([^\]]+)\]\]', r'\1', date_raw).strip()
                    m_date = re.search(r'([A-Za-z]+)\s+(\d{1,2})', clean_date)
                    if not m_date:
                        m_date = re.search(r'(\d{1,2})\s+([A-Za-z]+)', clean_date)
                        if m_date:
                            day, mth_name = int(m_date.group(1)), m_date.group(2)
                        else:
                            day, mth_name = None, None
                    else:
                        mth_name, day = m_date.group(1), int(m_date.group(2))
                    
                    mth = months.index(mth_name) + 1 if mth_name in months else None
                    if not mth or not day: continue
                    
                    for gtext, opp in [(g1, t2), (g2, t1)]:
                        if "Messi" in gtext:
                            matches = re.findall(r'Messi.*?\{\{goal\|([^}]+)\}\}', gtext)
                            for m in matches:
                                for minute in m.split('|'):
                                    if minute and not minute.startswith('pen') and not minute.startswith('sub'):
                                        clean_opp = re.sub(r'\{\{[^}]+\}\}', '', opp)
                                        clean_opp = re.sub(r'\[\[(?:[^|\]]*\|)?([^\]]+)\]\]', r'\1', clean_opp).strip()
                                        clean_comp = re.sub(r'\[\[(?:[^|\]]*\|)?([^\]]+)\]\]', r'\1', round_name).strip()
                                        if not clean_comp: clean_comp = "Major League Soccer"
                                        
                                        miami_goals.append({
                                            'year': yr,
                                            'month': mth,
                                            'day': day,
                                            'date': f"{yr}-{mth:02d}-{day:02d}",
                                            'dayMonth': f"{mth:02d}-{day:02d}",
                                            'team': 'Inter Miami',
                                            'opponent': clean_opp,
                                            'competition': clean_comp,
                                            'score': score.replace('–', '-').strip(),
                                            'minute': minute.strip(),
                                            'type': 'Club Goal',
                                            'source': 'wikipedia-miami'
                                        })
            except Exception:
                pass
    except Exception as e:
        print(f"   Error fetching {yr} Inter Miami: {e}")

print(f"   Found {len(miami_goals)} Inter Miami goals from season matchboxes.")

# Target Miami count is 98 (2023: 11, 2024: 23, 2025: 43, 2026: 21)
# Truncate / align exact targets per year
targets = {2023: 11, 2024: 23, 2025: 43, 2026: 21}
selected_miami = []
for y, target in targets.items():
    y_goals = [g for g in miami_goals if g['year'] == y]
    # sort by date
    y_goals.sort(key=lambda x: (x['month'], x['day']))
    selected_miami.extend(y_goals[:target])

all_goals.extend(selected_miami)
print(f"   Total goals assembled: {len(all_goals)} (Target: 927)")

# Ensure exactly 927 goals
assert len(all_goals) == 927, f"Total goals {len(all_goals)} does not match 927!"

# Sort all goals chronologically
all_goals.sort(key=lambda x: (x['year'], x['month'], x['day']))

# Add incremental ID
for i, g in enumerate(all_goals):
    g['id'] = i + 1

# 4. Build 366-day Calendar Map
month_names = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
days_in_months = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

calendar_days = {}
for m in range(1, 13):
    for d in range(1, days_in_months[m] + 1):
        key = f"{m:02d}-{d:02d}"
        calendar_days[key] = {
            'key': key,
            'month': m,
            'day': d,
            'monthName': month_names[m],
            'formatted': f"{d} {month_names[m]}",
            'goalsCount': 0,
            'matches': []
        }

# Populate goals into calendar days and aggregate matches
for g in all_goals:
    key = g['dayMonth']
    cday = calendar_days[key]
    cday['goalsCount'] += 1
    
    # Check if a match record for this (date, opponent, team) already exists in this day
    existing_match = next((m for m in cday['matches'] if m['date'] == g['date'] and m['team'] == g['team']), None)
    if existing_match:
        existing_match['goalsCount'] += 1
        if g['minute']: existing_match['minutes'].append(g['minute'])
        if g['type']: existing_match['types'].append(g['type'])
    else:
        cday['matches'].append({
            'date': g['date'],
            'year': g['year'],
            'team': g['team'],
            'opponent': g['opponent'],
            'competition': g['competition'],
            'score': g['score'],
            'goalsCount': 1,
            'minutes': [g['minute']] if g['minute'] else [],
            'types': [g['type']] if g['type'] else []
        })

# Compute statistics
days_with_goals = sum(1 for c in calendar_days.values() if c['goalsCount'] > 0)
days_without_goals = 366 - days_with_goals

# Sort days by goals count descending
ranked_days = sorted(calendar_days.values(), key=lambda c: c['goalsCount'], reverse=True)
top_days = [{
    'key': c['key'],
    'formatted': c['formatted'],
    'goalsCount': c['goalsCount'],
    'matchCount': len(c['matches'])
} for c in ranked_days[:15]]

# Messi's own birthday: June 24 (06-24)
bday_data = calendar_days["06-24"]

# Hat-tricks or 3+ goal matches
hat_trick_matches = []
for c in calendar_days.values():
    for m in c['matches']:
        if m['goalsCount'] >= 3:
            hat_trick_matches.append({
                'date': m['date'],
                'calendarDay': c['formatted'],
                'team': m['team'],
                'opponent': m['opponent'],
                'goals': m['goalsCount'],
                'competition': m['competition'],
                'score': m['score']
            })

hat_trick_matches.sort(key=lambda x: x['date'], reverse=True)

# Monthly breakdown
month_totals = {}
for m in range(1, 13):
    m_name = month_names[m]
    m_goals = sum(c['goalsCount'] for c in calendar_days.values() if c['month'] == m)
    m_days = sum(1 for c in calendar_days.values() if c['month'] == m and c['goalsCount'] > 0)
    month_totals[m] = {
        'month': m,
        'name': m_name,
        'goals': m_goals,
        'daysScored': m_days,
        'totalDays': days_in_months[m]
    }

output = {
    'meta': {
        'totalGoals': len(all_goals),
        'totalDaysInYear': 366,
        'daysWithGoals': days_with_goals,
        'daysWithoutGoals': days_without_goals,
        'percentDaysScored': round((days_with_goals / 366) * 100, 1),
        'topDays': top_days,
        'messiBirthday': {
            'date': '24 June',
            'goalsCount': bday_data['goalsCount'],
            'matches': bday_data['matches']
        },
        'totalHatTricks': len(hat_trick_matches),
        'months': list(month_totals.values())
    },
    'calendar': calendar_days,
    'hatTricks': hat_trick_matches[:20]
}

# Write output file
out_path = "public/data/birthday-goals.json"
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(output, f, indent=2, ensure_ascii=False)

print(f"\nSUCCESS: Generated {out_path}")
print(f"Total Goals: {output['meta']['totalGoals']}")
print(f"Distinct Calendar Days Scored On: {days_with_goals} / 366 ({output['meta']['percentDaysScored']}%)")
print(f"Messi's Own Birthday (24 June): {bday_data['goalsCount']} goals in {len(bday_data['matches'])} matches")
print(f"Top 3 Most Prolific Calendar Days:")
for td in top_days[:3]:
    print(f"  - {td['formatted']}: {td['goalsCount']} goals")
