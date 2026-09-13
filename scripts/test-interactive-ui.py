from playwright.sync_api import sync_playwright
import socketserver
import http.server
import threading
import os
import sys

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

PORT = 8460
DIRECTORY = os.path.abspath('dist')

class ThreadingHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    def log_message(self, *args):
        pass

server = ThreadingHTTPServer(('', PORT), Handler)
threading.Thread(target=server.serve_forever, daemon=True).start()

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1280, 'height': 900})
    page.goto(f'http://localhost:{PORT}/birthday.html', wait_until='domcontentloaded')
    page.wait_for_timeout(800)

    # 1. Test Stepper (Next Day, Prev Day)
    page.click('#bday-next-day')
    page.wait_for_timeout(400)
    target_date = page.inner_text('#bday-target-date')
    print("After Next Day click:", target_date)
    assert target_date == "3 May", f"Expected 3 May, got {target_date}"

    page.click('#bday-prev-day')
    page.wait_for_timeout(400)
    target_date = page.inner_text('#bday-target-date')
    print("After Prev Day click:", target_date)
    assert target_date == "2 May", f"Expected 2 May, got {target_date}"

    # 2. Test Zodiac selector
    cancer_btn = page.query_selector('.bday-zodiac-chip[data-zodiac="Cancer"]')
    assert cancer_btn is not None, "Cancer chip should exist"
    cancer_btn.click()
    page.wait_for_timeout(500)
    badge_text = page.inner_text('#bday-verdict-badge')
    print("Zodiac Cancer badge:", badge_text)
    assert "MESSI'S OWN BIRTHDAY" in badge_text.upper(), f"Unexpected badge text: {badge_text}"

    # 3. Test 2 May & Pitch Timeline
    page.click('button[data-month="5"][data-day="2"]')
    page.wait_for_timeout(600)
    timelines = page.query_selector_all('.bday-match-timeline')
    print(f"Match timelines rendered: {len(timelines)}")
    assert len(timelines) > 0, "Match goal timeline should be rendered"
    pins = page.query_selector_all('.timeline-goal-pin')
    print(f"Goal timeline pins found: {len(pins)}")
    assert len(pins) >= 2, "Goal timeline pins should exist"

    # 4. Test Confetti trigger
    confetti_btn = page.query_selector('#bday-confetti-btn')
    assert confetti_btn is not None, "Confetti button should exist"
    confetti_btn.click()
    page.wait_for_timeout(300)
    canvas = page.query_selector('#bday-confetti-canvas')
    assert canvas is not None, "Confetti canvas should exist"

    # 5. Test Video Toolbar & Speed Controller
    page.click('.bday-watch-video-btn')
    page.wait_for_timeout(1500)

    # Check playback rate button 0.5x
    page.click('.vspeed-btn[data-speed="0.5"]')
    page.wait_for_timeout(300)
    speed = page.evaluate("() => document.getElementById('goal-video-player').playbackRate")
    print("Video playback rate after 0.5x click:", speed)
    assert speed == 0.5, f"Expected 0.5, got {speed}"

    page.click('.vspeed-btn[data-speed="1.25"]')
    page.wait_for_timeout(300)
    speed = page.evaluate("() => document.getElementById('goal-video-player').playbackRate")
    print("Video playback rate after 1.25x click:", speed)
    assert speed == 1.25, f"Expected 1.25, got {speed}"

    page.screenshot(path='scratch_audit/interactive_modal_desktop.png')

    # Close modal
    page.click('#video-modal-close')
    page.wait_for_timeout(400)

    # 6. Test Heatmap Filters
    page.click('.bday-hfilter-btn[data-filter="hattrick"]')
    page.wait_for_timeout(400)
    highlighted = len(page.query_selector_all('.bday-day-btn.highlighted'))
    dimmed = len(page.query_selector_all('.bday-day-btn.dimmed'))
    print(f"Heatmap filter hattrick: {highlighted} highlighted, {dimmed} dimmed")
    assert highlighted > 0, "Should have highlighted hattrick days"

    page.click('.bday-hfilter-btn[data-filter="all"]')
    page.wait_for_timeout(400)
    highlighted_after = len(page.query_selector_all('.bday-day-btn.highlighted'))
    assert highlighted_after == 0, "All highlighted should be removed on filter 'all'"

    page.screenshot(path='scratch_audit/interactive_page_desktop.png')

    # 7. Mobile Viewport Test (390x844)
    mobile = browser.new_page(viewport={'width': 390, 'height': 844})
    mobile.goto(f'http://localhost:{PORT}/birthday.html', wait_until='domcontentloaded')
    mobile.wait_for_timeout(800)

    # Check 0 horizontal overflow on mobile
    scroll_width = mobile.evaluate("() => document.documentElement.scrollWidth")
    inner_width = mobile.evaluate("() => window.innerWidth")
    print(f"Mobile scrollWidth: {scroll_width}, innerWidth: {inner_width}")
    assert scroll_width <= inner_width, f"Horizontal overflow on mobile: {scroll_width} > {inner_width}"

    mobile.screenshot(path='scratch_audit/interactive_page_mobile.png')

    browser.close()

server.shutdown()
print("ALL INTERACTIVE UI TESTS PASSED!")
