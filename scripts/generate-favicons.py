from playwright.sync_api import sync_playwright
from PIL import Image
import os

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
svg_path = os.path.join(root, 'public', 'favicon.svg')
with open(svg_path, 'r', encoding='utf-8') as f:
    svg_content = f.read()

html_template = f'''<!DOCTYPE html>
<html>
<head>
<style>
  html, body {{ margin: 0; padding: 0; background: transparent; overflow: hidden; }}
  svg {{ width: 100vw; height: 100vh; display: block; }}
</style>
</head>
<body>
{svg_content}
</body>
</html>'''

scratch_dir = os.path.join(root, 'scratch')
os.makedirs(scratch_dir, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width': 512, 'height': 512})
    page.set_content(html_template)
    
    # 512x512
    page.screenshot(path=os.path.join(root, 'public', 'favicon-512x512.png'), omit_background=True)
    page.screenshot(path=os.path.join(root, 'public', 'img', 'logo.png'), omit_background=True)
    
    # 192x192
    page.set_viewport_size({'width': 192, 'height': 192})
    page.screenshot(path=os.path.join(root, 'public', 'favicon-192x192.png'), omit_background=True)
    page.screenshot(path=os.path.join(root, 'public', 'img', 'logo-192.png'), omit_background=True)
    
    # 180x180 apple touch icon
    page.set_viewport_size({'width': 180, 'height': 180})
    page.screenshot(path=os.path.join(root, 'public', 'apple-touch-icon.png'), omit_background=True)
    
    # 96x96
    page.set_viewport_size({'width': 96, 'height': 96})
    page.screenshot(path=os.path.join(root, 'public', 'favicon-96x96.png'), omit_background=True)
    
    # 48x48
    page.set_viewport_size({'width': 48, 'height': 48})
    page.screenshot(path=os.path.join(root, 'public', 'favicon-48x48.png'), omit_background=True)
    page.screenshot(path=os.path.join(root, 'public', 'favicon.png'), omit_background=True)
    
    # 32x32 & 16x16 for ICO
    page.set_viewport_size({'width': 32, 'height': 32})
    page.screenshot(path=os.path.join(scratch_dir, 'icon32.png'), omit_background=True)
    page.set_viewport_size({'width': 16, 'height': 16})
    page.screenshot(path=os.path.join(scratch_dir, 'icon16.png'), omit_background=True)
    
    browser.close()

# Create multi-size favicon.ico (16, 32, 48)
img48 = Image.open(os.path.join(root, 'public', 'favicon-48x48.png'))
img32 = Image.open(os.path.join(scratch_dir, 'icon32.png'))
img16 = Image.open(os.path.join(scratch_dir, 'icon16.png'))
img48.save(os.path.join(root, 'public', 'favicon.ico'), format='ICO', sizes=[(16, 16), (32, 32), (48, 48)], append_images=[img32, img16])

print('Successfully generated all favicons, logo.png, and favicon.ico!')
