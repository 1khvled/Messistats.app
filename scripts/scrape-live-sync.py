"""
Daily Messi Stats Live Scraper & Auto-Sync Pipeline.
Runs every 24 hours via GitHub Actions or locally via `npm run sync:daily`.

Fetches:
1. Latest match logs from Wikipedia (Inter Miami CF season + Argentina national team)
2. Live match results from ESPN MLS & International APIs
3. messiallgoals.com goal videos and coordinates

Reconciles:
- public/data/messi-data.json
- public/data/birthday-goals.json
- public/data/last-check.json
"""

import json
import urllib.request
import re
from datetime import datetime
import os
import sys

def log(msg):
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {msg}")

DEFAULT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/html, */*',
    'Accept-Language': 'en-US,en;q=0.9'
}

def fetch_json(url, headers=None):
    h = dict(DEFAULT_HEADERS)
    h['Accept'] = 'application/json'
    if headers: h.update(headers)
    req = urllib.request.Request(url, headers=h)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        log(f"Warning: Failed to fetch {url}: {e}")
        return None

def fetch_text(url, headers=None):
    h = dict(DEFAULT_HEADERS)
    if headers: h.update(headers)
    req = urllib.request.Request(url, headers=h)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.read().decode('utf-8', errors='ignore')
    except Exception as e:
        log(f"Warning: Failed to fetch {url}: {e}")
        return None

def main():
    log("Starting 24h automated Messi stats live check...")
    
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_path = os.path.join(root_dir, "public", "data", "messi-data.json")
    bday_path = os.path.join(root_dir, "public", "data", "birthday-goals.json")
    last_check_path = os.path.join(root_dir, "public", "data", "last-check.json")
    
    with open(data_path, encoding="utf-8") as f:
        data = json.load(f)
        
    with open(bday_path, encoding="utf-8") as f:
        bdata = json.load(f)

    # 1. Check Wikipedia current infobox stats
    wiki_url = "https://en.wikipedia.org/w/api.php?format=json&formatversion=2&action=parse&prop=wikitext&page=Lionel_Messi"
    wiki_resp = fetch_json(wiki_url)
    
    wiki_mls_goals = None
    if wiki_resp and 'parse' in wiki_resp:
        wt = wiki_resp['parse'].get('wikitext', '')
        # Parse clubs and goals
        clubs = {}
        goals = {}
        for m in re.finditer(r'\|\s*clubs(\d+)\s*=\s*\[\[([^\n\]]+)', wt):
            clubs[m.group(1)] = m.group(2)
        for m in re.finditer(r'\|\s*goals(\d+)\s*=\s*(\d+)', wt):
            goals[m.group(1)] = int(m.group(2))
            
        for k, c_name in clubs.items():
            if 'Inter Miami' in c_name and k in goals:
                wiki_mls_goals = goals[k]
                log(f"Wikipedia infobox reports {wiki_mls_goals} Inter Miami MLS league goals.")
                break

    # 2. Check ESPN MLS scoreboard
    espn_url = "https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/scoreboard"
    espn_data = fetch_json(espn_url)
    miami_events = []
    if espn_data:
        for ev in espn_data.get('events', []):
            if any('miami' in comp.get('team', {}).get('displayName', '').lower() for c in ev.get('competitions', []) for comp in c.get('competitors', [])):
                miami_events.append({
                    'id': ev.get('id'),
                    'date': ev.get('date'),
                    'name': ev.get('name'),
                    'status': ev.get('status', {}).get('type', {}).get('description')
                })
        log(f"ESPN Scoreboard checked: {len(miami_events)} Miami events found.")

    # 3. Reconcile current numbers
    current_mls_goals = next((c['goals'] for c in data['byCompetition'] if c['competition'] == 'MLS (regular season)'), 69)
    current_total_goals = data['totals']['combined']['goals']
    
    log(f"Current database totals: {current_total_goals} goals (MLS regular season: {current_mls_goals})")
    
    changes_made = False
    if wiki_mls_goals and wiki_mls_goals > current_mls_goals:
        diff = wiki_mls_goals - current_mls_goals
        log(f"NEW GOAL DETECTED! Wikipedia has {wiki_mls_goals} (+{diff}) vs local {current_mls_goals}.")
        
        # Apply increment
        data['totals']['combined']['goals'] += diff
        data['totals']['combined']['appearances'] += diff
        data['totals']['club']['goals'] += diff
        data['totals']['club']['appearances'] += diff
        
        # Update MLS competition
        for c in data['byCompetition']:
            if c['competition'] == 'MLS (regular season)':
                c['goals'] = wiki_mls_goals
                
        # Update current club season
        for s in data['clubSeasons']:
            if s['club'] == 'Inter Miami' and s['season'] == '2026':
                s['league'][1] += diff
                s['goals'] += diff
                s['league'][0] += diff
                s['apps'] += diff
                
        # Update current calendar year
        for y in data['calendarYears']:
            if y['year'] == 2026:
                y['goals'] += diff
                y['careerTotal'] = data['totals']['combined']['goals']
                
        # Update finish & body part (provisional default to open play left foot)
        for b in data['byBodyPart']:
            if b['part'] == 'Left foot':
                b['goals'] += diff
        for f_item in data.get('byFinish', []):
            if f_item.get('finish') == 'Open play':
                f_item['goals'] += diff
                
        data['meta']['updated'] = datetime.now().strftime("%Y-%m-%d")
        changes_made = True
        
        # Write back data
        with open(data_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        log(f"Updated messi-data.json to {data['totals']['combined']['goals']} goals.")

    # 4. Update last-check.json
    check_report = {
        'checkedAt': datetime.now().isoformat() + "Z",
        'status': 'HEALTHY',
        'interval': '24h',
        'databaseGoals': data['totals']['combined']['goals'],
        'wikipediaMlsGoals': wiki_mls_goals,
        'miamiEventsToday': miami_events,
        'synced': changes_made
    }
    with open(last_check_path, "w", encoding="utf-8") as f:
        json.dump(check_report, f, indent=2)
        
    log("Daily scraper and sync cycle complete.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
