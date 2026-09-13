from playwright.sync_api import sync_playwright
import socketserver
import http.server
import threading
import os

PORT = 8459
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
    # 1. Desktop Test
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1280, 'height': 900})
    page.goto(f'http://localhost:{PORT}/birthday.html', wait_until='domcontentloaded')
    page.wait_for_timeout(600)
    
    # Click 2 May
    page.click('button[data-month="5"][data-day="2"]')
    page.wait_for_timeout(600)
    
    # Test Modal
    watch_btn = page.query_selector('.bday-watch-video-btn')
    assert watch_btn is not None, "Watch button should exist"
    watch_btn.click()
    page.wait_for_timeout(1500)
    
    modal_info = page.evaluate("""() => {
        const m = document.getElementById('video-modal');
        const v = document.getElementById('goal-video-player');
        const box = m.getBoundingClientRect();
        return {
            hidden: m.hidden,
            top: box.top,
            left: box.left,
            width: box.width,
            height: box.height,
            videoWidth: v.videoWidth,
            videoHeight: v.videoHeight,
            src: v.src,
            paused: v.paused,
            readyState: v.readyState
        };
    }""")
    print("Desktop modal info:", modal_info)
    page.screenshot(path='scratch_audit/verify_modal_desktop.png')
    
    # Close modal
    page.click('#video-modal-close')
    page.wait_for_timeout(400)
    
    # Test Inline Player
    inline_btn = page.query_selector('.bday-inline-toggle-btn')
    assert inline_btn is not None, "Inline button should exist"
    inline_btn.click()
    page.wait_for_timeout(1500)
    
    inline_info = page.evaluate("""() => {
        const box = document.querySelector('.bday-card-inline-player:not([hidden])');
        if (!box) return null;
        const v = box.querySelector('video');
        return {
            visible: !!box,
            videoSrc: v ? v.src : null,
            videoWidth: v ? v.videoWidth : null,
            videoHeight: v ? v.videoHeight : null
        };
    }""")
    print("Desktop inline info:", inline_info)
    page.screenshot(path='scratch_audit/verify_inline_desktop.png')
    
    # 2. Mobile Test (390x844)
    mobile_page = browser.new_page(viewport={'width': 390, 'height': 844})
    mobile_page.goto(f'http://localhost:{PORT}/birthday.html', wait_until='domcontentloaded')
    mobile_page.wait_for_timeout(600)
    
    # Click 13 September (Goal #928)
    mobile_page.click('button[data-month="9"][data-day="13"]')
    mobile_page.wait_for_timeout(600)
    
    # Check Goal #928 card
    cards_text = mobile_page.evaluate("""() => {
        return Array.from(document.querySelectorAll('.bday-match-card')).map(c => c.innerText);
    }""")
    print(f"Mobile 13 September matches found: {len(cards_text)}")
    assert any('Inter Miami' in t for t in cards_text), "Goal 928 Inter Miami should be present"
    
    # Test mobile inline player
    m_inline_btns = mobile_page.query_selector_all('.bday-inline-toggle-btn')
    print(f"Mobile inline buttons: {len(m_inline_btns)}")
    if m_inline_btns:
        m_inline_btns[-1].click() # Click latest match (Inter Miami)
        mobile_page.wait_for_timeout(1500)
        mobile_page.screenshot(path='scratch_audit/verify_inline_mobile.png')
        
    # Test mobile modal
    m_watch_btns = mobile_page.query_selector_all('.bday-watch-video-btn')
    if m_watch_btns:
        m_watch_btns[-1].click()
        mobile_page.wait_for_timeout(1500)
        
        m_modal_info = mobile_page.evaluate("""() => {
            const m = document.getElementById('video-modal');
            const v = document.getElementById('goal-video-player');
            const box = m.getBoundingClientRect();
            return {
                hidden: m.hidden,
                top: box.top,
                left: box.left,
                width: box.width,
                height: box.height,
                src: v.src,
                videoWidth: v.videoWidth,
                videoHeight: v.videoHeight
            };
        }""")
        print("Mobile modal info:", m_modal_info)
        mobile_page.screenshot(path='scratch_audit/verify_modal_mobile.png')
        
    browser.close()

server.shutdown()
print("All verifications completed successfully!")
