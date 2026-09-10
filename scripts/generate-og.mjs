// Generates public/img/og-messi.jpg — the 1200x630 social share image.
// ORIGINAL composition (own code, own numbers, self-hosted photo): navy/gold
// editorial card, giant "927", verified stat strip, CSS-style club-colour
// badges, and public/img/messi.jpg blended into a right-hand panel.
// No npm dependencies: shells out to python3 + Pillow (stdlib-free images
// can't encode JPEG by hand sanely). Re-run: `node scripts/generate-og.mjs`.
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const py = `
from PIL import Image, ImageDraw, ImageFont
import os
root = ${JSON.stringify(root)}
W, H = 1200, 630
NAVY, GOLD, PAPER, MUTED = (22,36,58), (238,194,47), (244,240,232), (159,176,199)
img = Image.new("RGB", (W, H), NAVY)
px = img.load()
for y in range(H):  # faint top-light falloff, painted pixel by pixel
    k = 1.0 - 0.10 * (y / H)
    for x in range(0, W, 4):
        r, g, b = px[x, y]
        for dx in range(4):
            if x + dx < W: px[x+dx, y] = (int(r*k), int(g*k), int(b*k))
d = ImageDraw.Draw(img)
F = lambda n, s: ImageFont.truetype(n, s)
fb, fr, frb = "C:/Windows/Fonts/arialbd.ttf", "C:/Windows/Fonts/arial.ttf", "C:/Windows/Fonts/arial.ttf"
def label(xy, s, size, fill, bold=True, anchor="la"):
    d.text(xy, s, font=F(fb if bold else fr, size), fill=fill, anchor=anchor)
# thin gold frame + accent bar
d.rectangle([14, 14, W-15, H-15], outline=GOLD, width=3)
label((90, 84), "LIONEL MESSI  \\u00b7  CAREER STATISTICS", 34, GOLD)
label((88, 150), "927", 200, PAPER)
label((90, 350), "career goals in 1,172 senior appearances", 36, PAPER)
label((90, 398), "Barcelona 672  \\u00b7  PSG 32  \\u00b7  Inter Miami 98  \\u00b7  Argentina 125", 25, MUTED, bold=False)
# club-colour strip: original segmented bar, widths proportional to goals (672/32/98/125)
bx, bw, by, bh = 90, 610, 436, 10
segs = [(672, "#A50044", "#004D98", "v"), (32, "#0a2540", "#DA291C", "band"),
        (98, "#e1438b", "#7a1c4d", "h"), (125, "#f4f0e8", "#2f9fd8", "stripes")]
x = bx
for goals, c1, c2, style in segs:
    w = max(int(round(bw * goals / 927)), 8)
    w = min(w, bx + bw - x)
    if style == "v":
        d.rectangle([x, by, x+w//2, by+bh], fill=c1)
        d.rectangle([x+w//2, by, x+w, by+bh], fill=c2)
    elif style == "band":
        d.rectangle([x, by, x+w, by+bh], fill=c1)
        d.rectangle([x+w-4, by, x+w, by+bh], fill=c2)
    elif style == "h":
        d.rectangle([x, by, x+w, by+(bh//2)], fill=c1)
        d.rectangle([x, by+(bh//2), x+w, by+bh], fill=c2)
    else:
        for j in range(0, w, 8): d.rectangle([x+j, by, min(x+j+4, x+w), by+bh], fill=c2 if (j//8) % 2 else c1)
    x += w
for i, (a, b) in enumerate([("91", "2012 \\u00b7 world record"), ("21", "World Cup goals"), ("8", 'Ballons d\\u2019Or')]):
    x = (90, 330, 560)[i]
    label((x, 462), a, 44, GOLD)
    label((x, 515), b, 26, PAPER, bold=False)
label((90, 566), "MESSISTATS  \\u00b7  Updated 9 September 2026", 24, MUTED, bold=False)
# photo panel: self-hosted portrait, left edge feathered into the navy
photo = Image.open(os.path.join(root, "public", "img", "messi.jpg")).convert("RGB")
PW = 330
s = max(PW / photo.width, H / photo.height)
photo = photo.resize((int(photo.width*s+0.5), int(photo.height*s+0.5)), Image.LANCZOS)
ox, oy = (photo.width-PW)//2, (photo.height-H)//2
photo = photo.crop((ox, oy, ox+PW, oy+H))
mask = Image.new("L", (PW, H), 255)
mp = mask.load()
for x in range(120):
    for y in range(H): mp[x, y] = int(255 * (x/120) ** 1.5)
img.paste(photo, (W-PW, 0), mask)
out = os.path.join(root, "public", "img", "og-messi.jpg")
img.save(out, "JPEG", quality=82, optimize=True, progressive=True)
print("wrote", out, os.path.getsize(out), "bytes")
`;
const tmp = join(tmpdir(), "generate-og.py");
writeFileSync(tmp, py);
const r = spawnSync("python", [tmp], { stdio: "inherit" });
if (r.status !== 0) process.exit(r.status);
