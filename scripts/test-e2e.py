import http.server
import socketserver
import threading
import time
import os
import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
from playwright.sync_api import sync_playwright

PORT = 8989
DIST_DIR = os.path.abspath("dist")

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIST_DIR, **kwargs)
    def log_message(self, format, *args):
        pass # suppress server logs

def run_server():
    server = http.server.ThreadingHTTPServer(("", PORT), Handler)
    server.serve_forever()

t = threading.Thread(target=run_server, daemon=True)
t.start()
time.sleep(1)

pages = [
    "index.html",
    "goalsbyyear.html",
    "goalsbyseason.html",
    "dashboard.html",
    "timeline.html",
    "achievements.html",
    "birthday.html"
]

results = []
all_ok = True

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    
    # 1. Desktop test (1280x800)
    for page_name in pages:
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()
        
        errors = []
        def on_console(msg):
            url = msg.location.get("url", "") if msg.location else ""
            if msg.type == "error" and "_vercel" not in url and "_vercel" not in msg.text and "profitableratecpmnetwork" not in url and "pl31316537" not in url:
                errors.append(f"{msg.text} ({url})")
        page.on("console", on_console)
        page.on("pageerror", lambda exc: errors.append(str(exc)))
        
        url = f"http://localhost:{PORT}/{page_name}"
        page.goto(url, wait_until="domcontentloaded")
        time.sleep(0.8)
        
        # Check broken images (completed download but naturalWidth is 0)
        broken_imgs = page.evaluate("""() => {
            return Array.from(document.querySelectorAll('img')).filter(i => i.complete && i.naturalWidth === 0).map(i => i.src);
        }""")
        
        # Check horizontal overflow
        overflow = page.evaluate("""() => {
            return document.documentElement.scrollWidth > window.innerWidth;
        }""")
        
        # Test dark mode toggle
        theme_btn = page.query_selector("#theme-toggle")
        theme_ok = False
        if theme_btn:
            theme_btn.click()
            is_dark = page.evaluate("() => document.documentElement.getAttribute('data-theme') === 'dark'")
            saved = page.evaluate("() => localStorage.getItem('theme') === 'dark'")
            theme_btn.click()
            is_light = page.evaluate("() => !document.documentElement.getAttribute('data-theme')")
            theme_ok = is_dark and saved and is_light
        
        status = "OK"
        if errors or broken_imgs or overflow or (not theme_ok and theme_btn):
            status = "FAIL"
            all_ok = False
            
        results.append({
            "mode": "Desktop",
            "page": page_name,
            "status": status,
            "errors": errors,
            "broken_imgs": broken_imgs,
            "overflow": overflow,
            "theme_toggle": theme_ok
        })
        context.close()

    # 2. Mobile test (390x844)
    for page_name in pages:
        context = browser.new_context(viewport={"width": 390, "height": 844})
        page = context.new_page()
        
        errors = []
        def on_console_m(msg):
            url = msg.location.get("url", "") if msg.location else ""
            if msg.type == "error" and "_vercel" not in url and "_vercel" not in msg.text and "profitableratecpmnetwork" not in url and "pl31316537" not in url:
                errors.append(f"{msg.text} ({url})")
        page.on("console", on_console_m)
        page.on("pageerror", lambda exc: errors.append(str(exc)))
        
        url = f"http://localhost:{PORT}/{page_name}"
        page.goto(url, wait_until="domcontentloaded")
        time.sleep(0.6)
        
        # Check horizontal overflow
        overflow = page.evaluate("""() => {
            return document.documentElement.scrollWidth > window.innerWidth;
        }""")
        
        status = "OK"
        if errors or overflow:
            status = "FAIL"
            all_ok = False
            
        results.append({
            "mode": "Mobile 390px",
            "page": page_name,
            "status": status,
            "errors": errors,
            "overflow": overflow
        })
        context.close()

    # 3. Interactive Birthday Page Tests
    print("\n--- Testing Birthday Page Specific Interactions ---", flush=True)
    bday_context = browser.new_context(viewport={"width": 1280, "height": 800}, permissions=["clipboard-read", "clipboard-write"])
    bp = bday_context.new_page()
    bp.goto(f"http://localhost:{PORT}/birthday.html", wait_until="domcontentloaded")
    bp.wait_for_selector(".bday-match-card", timeout=5000)
    
    # Check default May 2 verdict
    verdict_text = bp.inner_text("#bday-verdict")
    print(f"VERDICT TEXT:\n{verdict_text}\n", flush=True)
    assert "2 May" in verdict_text and "10 goals" in verdict_text, f"Default May 2 verdict mismatch: {verdict_text}"
    
    # Check match cards count for May 2
    match_cards = bp.query_selector_all(".bday-match-card")
    print(f"Matches rendered for May 2: {len(match_cards)}")
    assert len(match_cards) == 5, f"Expected 5 matches for May 2, got {len(match_cards)}"
    
    # Click Messi's Birthday preset (June 24)
    bp.click("button[data-month='6'][data-day='24']")
    time.sleep(0.3)
    messi_verdict = bp.inner_text("#bday-verdict")
    print(f"June 24 Verdict: 'Lionel Andrés Messi' in text? {'Lionel Andrés Messi' in messi_verdict}")
    assert "Lionel Andrés Messi" in messi_verdict, "June 24 Messi birthday card not displayed"
    
    # Click El Clásico 6-2 preset
    bp.click("button[data-month='5'][data-day='2']")
    time.sleep(0.3)
    assert len(bp.query_selector_all(".bday-match-card")) == 5
    
    # Click a heatmap cell (e.g. March 7, Bayer Leverkusen 5 goals)
    bp.click(".bday-day-btn[data-month='3'][data-day='7']")
    time.sleep(0.3)
    mar7_verdict = bp.inner_text("#bday-verdict")
    print(f"March 7 Verdict: '7 March' in text? {'7 March' in mar7_verdict}, '9 goals' in text? {'9 goals' in mar7_verdict}")
    assert "7 March" in mar7_verdict and "9 goals" in mar7_verdict, "March 7 heatmap click failed"
    
    # Test Random day button
    bp.click("#bday-preset-random")
    time.sleep(0.3)
    random_date = bp.inner_text("#bday-target-date")
    print(f"Random Day picked: {random_date}")
    assert len(random_date) > 0
    
    # Test Share button
    bp.click("#bday-share-btn")
    time.sleep(0.3)
    share_msg = bp.inner_text("#bday-share-msg")
    print(f"Share button clicked, message: '{share_msg}'")
    assert len(share_msg) > 0, "Share message should not be empty"

    # Screenshot tests for Dark and Light mode
    os.makedirs("scratch_audit", exist_ok=True)
    bp.screenshot(path="scratch_audit/birthday_light.png", full_page=False)
    bp.click("#theme-toggle")
    time.sleep(0.3)
    bp.screenshot(path="scratch_audit/birthday_dark.png", full_page=False)
    print("Screenshots saved: scratch_audit/birthday_light.png and birthday_dark.png")
    
    bday_context.close()
    browser.close()

print("\n--- Summary of Page Tests ---")
for r in results:
    err_str = f" ERRORS: {r['errors']}" if r.get('errors') else ""
    flow_str = f" OVERFLOW: True" if r.get('overflow') else ""
    img_str = f" BROKEN_IMGS: {r.get('broken_imgs')}" if r.get('broken_imgs') else ""
    print(f"[{r['status']}] {r['mode']} - {r['page']}{err_str}{flow_str}{img_str}")

if all_ok:
    print("\n>>> ALL TESTS PASSED WITH FLYING COLORS! <<<")
else:
    print("\n>>> SOME TESTS FAILED! <<<")
    sys.exit(1)
