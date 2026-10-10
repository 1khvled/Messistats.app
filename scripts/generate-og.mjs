/**
 * Dynamic Open Graph / Twitter Card Image Generator (scripts/generate-og.mjs)
 * 
 * Generates public/img/og-messi.jpg and public/img/og-messi.webp (1200x630).
 * Dynamically reads public/data/messi-data.json so the headline career goal tally,
 * appearances, club breakdown, and bar chart automatically update with ZERO manual edits!
 * 
 * Works cross-platform on Windows, macOS, and Linux (GitHub Actions CI/CD).
 */

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, copyFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = join(root, "public", "data", "messi-data.json");

// Vercel build containers do not include Python Pillow. Use pre-rendered assets.
if (process.env.VERCEL) {
  console.log("[generate-og] Vercel environment detected; using pre-rendered public/img/og-messi.jpg");
  process.exit(0);
}

if (!existsSync(dataPath)) {
  console.error("Missing messi-data.json at:", dataPath);
  process.exit(1);
}

const data = JSON.parse(readFileSync(dataPath, "utf8"));
const totalGoals = data.totals?.combined?.goals || 932;
const totalApps = data.totals?.combined?.appearances || 1178;
const formattedApps = totalApps.toLocaleString("en-US");

// Calculate club goals breakdown
const clubs = {};
for (const s of (data.clubSeasons || [])) {
  clubs[s.club] = (clubs[s.club] || 0) + s.goals;
}
const barcaGoals = clubs["Barcelona"] || 672;
const psgGoals = clubs["Paris Saint-Germain"] || 32;
const miamiGoals = clubs["Inter Miami"] || 102;
const argGoals = data.totals?.country?.goals || 126;

// Formatted update date
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
let updatedDate = new Date();
if (data.meta?.updated) {
  const parts = data.meta.updated.split("-");
  if (parts.length === 3) {
    updatedDate = new Date(Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)));
  }
}
const formattedDate = `${updatedDate.getUTCDate()} ${months[updatedDate.getUTCMonth()]} ${updatedDate.getUTCFullYear()}`;

console.log(`[generate-og] Generating social banner for: ${totalGoals} goals, ${formattedApps} apps, Inter Miami ${miamiGoals} goals...`);

const pyScript = `
import os
import sys
from PIL import Image, ImageDraw, ImageFont

root = ${JSON.stringify(root)}
total_goals = ${totalGoals}
total_apps = ${JSON.stringify(formattedApps)}
barca_goals = ${barcaGoals}
psg_goals = ${psgGoals}
miami_goals = ${miamiGoals}
arg_goals = ${argGoals}
formatted_date = ${JSON.stringify(formattedDate)}

W, H = 1200, 630
NAVY, GOLD, PAPER, MUTED = (22, 36, 58), (238, 194, 47), (244, 240, 232), (159, 176, 199)
img = Image.new("RGB", (W, H), NAVY)
px = img.load()

# Faint top-light falloff
for y in range(H):
    k = 1.0 - 0.10 * (y / H)
    for x in range(0, W, 4):
        r, g, b = px[x, y]
        for dx in range(4):
            if x + dx < W:
                px[x + dx, y] = (int(r * k), int(g * k), int(b * k))

d = ImageDraw.Draw(img)

def load_font(bold=False, size=32):
    candidates = []
    if bold:
        candidates = [
            "C:/Windows/Fonts/arialbd.ttf",
            "C:/Windows/Fonts/segoeuib.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
            "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
            "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        ]
    else:
        candidates = [
            "C:/Windows/Fonts/arial.ttf",
            "C:/Windows/Fonts/segoeui.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
            "/usr/share/fonts/truetype/freefont/FreeSans.ttf",
            "/System/Library/Fonts/Supplemental/Arial.ttf",
        ]
    for c in candidates:
        if os.path.exists(c):
            try:
                return ImageFont.truetype(c, size)
            except Exception:
                pass
    try:
        return ImageFont.load_default(size=size)
    except Exception:
        return ImageFont.load_default()

def label(xy, s, size, fill, bold=True, anchor="la"):
    f = load_font(bold=bold, size=size)
    d.text(xy, s, font=f, fill=fill, anchor=anchor)

# 1. Gold outer frame
d.rectangle([14, 14, W - 15, H - 15], outline=GOLD, width=3)

# 2. Header
label((90, 84), "LIONEL MESSI  \\u00b7  CAREER STATISTICS", 34, GOLD)

# 3. Big dynamic Goal tally
label((88, 145), str(total_goals), 200, PAPER)

# 4. Appearances & Club breakdown
label((90, 350), f"career goals in {total_apps} senior appearances", 36, PAPER)
breakdown_text = f"Barcelona {barca_goals}  \\u00b7  PSG {psg_goals}  \\u00b7  Inter Miami {miami_goals}  \\u00b7  Argentina {arg_goals}"
label((90, 398), breakdown_text, 25, MUTED, bold=False)

# 5. Club-colour strip proportional to dynamic goals
bx, bw, by, bh = 90, 610, 436, 10
segs = [
    (barca_goals, "#A50044", "#004D98", "v"),
    (psg_goals, "#0a2540", "#DA291C", "band"),
    (miami_goals, "#e1438b", "#7a1c4d", "h"),
    (arg_goals, "#f4f0e8", "#2f9fd8", "stripes")
]
x = bx
for goals, c1, c2, style in segs:
    w = max(int(round(bw * goals / total_goals)), 8)
    w = min(w, bx + bw - x)
    if style == "v":
        d.rectangle([x, by, x + w // 2, by + bh], fill=c1)
        d.rectangle([x + w // 2, by, x + w, by + bh], fill=c2)
    elif style == "band":
        d.rectangle([x, by, x + w, by + bh], fill=c1)
        d.rectangle([x + w - 4, by, x + w, by + bh], fill=c2)
    elif style == "h":
        d.rectangle([x, by, x + w, by + (bh // 2)], fill=c1)
        d.rectangle([x, by + (bh // 2), x + w, by + bh], fill=c2)
    else:
        for j in range(0, w, 8):
            d.rectangle([x + j, by, min(x + j + 4, x + w), by + bh], fill=c2 if (j // 8) % 2 else c1)
    x += w

# 6. Secondary stat highlights
for i, (a, b) in enumerate([("91", "2012 \\u00b7 world record"), ("21", "World Cup goals"), ("8", "Ballons d\\u2019Or")]):
    x_pos = (90, 330, 560)[i]
    label((x_pos, 462), a, 44, GOLD)
    label((x_pos, 515), b, 26, PAPER, bold=False)

# 7. Brand footer with verified date
label((90, 566), f"MESSISTAT  \\u00b7  Updated {formatted_date}", 24, MUTED, bold=False)

# 8. Blend Messi Portrait
portrait_path = os.path.join(root, "public", "img", "messi.jpg")
if os.path.exists(portrait_path):
    photo = Image.open(portrait_path).convert("RGB")
    PW = 330
    s = max(PW / photo.width, H / photo.height)
    photo = photo.resize((int(photo.width * s + 0.5), int(photo.height * s + 0.5)), Image.LANCZOS)
    ox, oy = (photo.width - PW) // 2, (photo.height - H) // 2
    photo = photo.crop((ox, oy, ox + PW, oy + H))
    mask = Image.new("L", (PW, H), 255)
    mp = mask.load()
    for x in range(120):
        for y in range(H):
            mp[x, y] = int(255 * (x / 120) ** 1.5)
    img.paste(photo, (W - PW, 0), mask)

# 9. Output JPG and WEBP
out_jpg = os.path.join(root, "public", "img", "og-messi.jpg")
out_webp = os.path.join(root, "public", "img", "og-messi.webp")
img.save(out_jpg, "JPEG", quality=88, optimize=True, progressive=True)
img.save(out_webp, "WEBP", quality=88)

print(f"[generate-og] Successfully rendered {out_jpg} ({os.path.getsize(out_jpg)} bytes)")
print(f"[generate-og] Successfully rendered {out_webp} ({os.path.getsize(out_webp)} bytes)")
`;

const tmp = join(tmpdir(), "generate-og-dynamic.py");
writeFileSync(tmp, pyScript, "utf8");
let r = spawnSync("python", [tmp], { stdio: "inherit" });
if (r.status !== 0) {
  r = spawnSync("python3", [tmp], { stdio: "inherit" });
}
if (r.status !== 0) {
  console.warn("[generate-og] Python or Pillow not found; continuing with committed public/img/og-messi.jpg.");
  process.exit(0);
}

// Mirror to dist/img if dist exists
const distImgDir = join(root, "dist", "img");
if (existsSync(distImgDir)) {
  copyFileSync(join(root, "public", "img", "og-messi.jpg"), join(distImgDir, "og-messi.jpg"));
  copyFileSync(join(root, "public", "img", "og-messi.webp"), join(distImgDir, "og-messi.webp"));
  console.log("[generate-og] Mirrored new social assets to dist/img/");
}
