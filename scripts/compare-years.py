import json

with open('public/data/messi-data.json', 'r', encoding='utf-8') as f:
    mdata = json.load(f)

with open('public/data/birthday-goals.json', 'r', encoding='utf-8') as f:
    bdata = json.load(f)

# Count goals per year in birthday-goals.json
bday_years = {}
for k, day in bdata.get('calendar', {}).items():
    for m in day.get('matches', []):
        y = m.get('year')
        if not y and 'date' in m:
            y = int(m['date'].split('-')[0])
        bday_years[y] = bday_years.get(y, 0) + m.get('goalsCount', 0)

print("Yearly comparison (messi-data vs birthday-goals):")
for cy in mdata.get('calendarYears', []):
    y = cy['year']
    mg = cy['goals']
    bg = bday_years.get(y, 0)
    diff = bg - mg
    if diff != 0:
        print(f"MISMATCH in {y}: messi-data has {mg}, birthday-goals has {bg} (diff: {diff})")
    else:
        print(f"{y}: {mg} == {bg} (OK)")
