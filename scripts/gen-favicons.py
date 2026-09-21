"""
Generate proper solid favicons for MessiStat.
Creates a solid shield logo using Pillow's drawing primitives,
matching the SVG design: navy/blue gradient shield + gold star + "M10" text.
"""

from PIL import Image, ImageDraw, ImageFont
import os, struct, math

# ── Brand colours ────────────────────────────────────────────────────────────
NAVY   = (22, 36, 58)          # #16243a  dark background
BLUE1  = (109, 15, 46)         # #6d0f2e  top of gradient (actually maroon/crimson)
BLUE2  = (29, 63, 174)         # #1d3fae  mid blue
BLUE3  = (14, 124, 192)        # #0e7cc0  light blue
GOLD   = (227, 185, 62)        # #e3b93e
WHITE  = (255, 255, 255, 255)
TRANSPARENT = (0, 0, 0, 0)


def lerp_color(c1, c2, t):
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))


def make_shield_favicon(size: int) -> Image.Image:
    """Draw a solid, filled shield icon."""
    img = Image.new("RGBA", (size, size), TRANSPARENT)
    draw = ImageDraw.Draw(img)

    pad = max(1, size // 12)
    cx = size // 2

    # Shield polygon points (relative to size)
    # Classic kite/heater shield: wide top, tapers to a point at bottom
    top_y    = pad
    bot_y    = size - pad
    side_x_l = pad
    side_x_r = size - pad
    arch_h   = size // 5          # curved shoulder depth
    tip_y    = bot_y              # bottom tip

    # Build shield polygon
    shield = [
        (side_x_l, top_y + arch_h),           # left shoulder
        (cx,       top_y),                     # top centre
        (side_x_r, top_y + arch_h),           # right shoulder
        (side_x_r, top_y + arch_h + int(size * 0.35)),  # right waist
        (cx,       tip_y),                     # bottom tip
        (side_x_l, top_y + arch_h + int(size * 0.35)),  # left waist
    ]

    # Draw gradient-filled shield (simulate with vertical bands)
    # Use a mask approach: draw gradient rect then clip to shield shape
    grad = Image.new("RGBA", (size, size), TRANSPARENT)
    gdraw = ImageDraw.Draw(grad)

    # Build gradient rows
    for y in range(size):
        t = y / size
        if t < 0.45:
            col = lerp_color(BLUE1, BLUE2, t / 0.45)
        else:
            col = lerp_color(BLUE2, BLUE3, (t - 0.45) / 0.55)
        gdraw.line([(0, y), (size - 1, y)], fill=(*col, 255))

    # Create shield mask
    mask_img = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask_img).polygon(shield, fill=255)

    # Apply mask to gradient
    grad.putalpha(mask_img)

    # Composite onto main image
    img.paste(grad, (0, 0), grad)

    # ── Gold border around shield ─────────────────────────────────────────────
    border_w = max(1, size // 20)
    draw2 = ImageDraw.Draw(img)
    draw2.polygon(shield, outline=(*GOLD, 255), fill=None,
                  width=border_w)

    # ── Gold star (top-right of shield) ──────────────────────────────────────
    star_cx = side_x_r - size // 7
    star_cy = top_y + arch_h - size // 14
    star_r_outer = size // 8
    star_r_inner = star_r_outer * 0.4
    star_pts = []
    for i in range(10):
        angle = math.radians(-90 + i * 36)
        r = star_r_outer if i % 2 == 0 else star_r_inner
        star_pts.append((star_cx + r * math.cos(angle),
                          star_cy + r * math.sin(angle)))
    draw2.polygon(star_pts, fill=(*GOLD, 255))

    # ── "M10" text centred in shield ─────────────────────────────────────────
    text = "M10"
    font_size = max(8, int(size * 0.32))
    font = None
    for font_path in [
        "C:/Windows/Fonts/arialbd.ttf",
        "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/calibrib.ttf",
    ]:
        if os.path.exists(font_path):
            font = ImageFont.truetype(font_path, font_size)
            break
    if font is None:
        font = ImageFont.load_default()

    text_x = size // 2
    text_y = int(size * 0.58)
    # Shadow for legibility
    draw2.text((text_x + 1, text_y + 1), text, font=font, fill=(0, 0, 0, 180),
               anchor="mm")
    draw2.text((text_x, text_y), text, font=font, fill=WHITE, anchor="mm")

    return img


def save_png(img: Image.Image, path: str):
    img.save(path, "PNG", optimize=True)
    print(f"  Saved {path}  ({os.path.getsize(path):,} bytes)")


def save_ico(sizes, paths_map, output_path: str):
    """Pack multiple PNG images into a .ico file."""
    images_data = []
    for size in sizes:
        img = paths_map[size]
        from io import BytesIO
        buf = BytesIO()
        img.save(buf, "PNG")
        images_data.append(buf.getvalue())

    # ICO format
    count = len(sizes)
    ico_header = struct.pack("<HHH", 0, 1, count)  # reserved, type=1 (ICO), count
    data_offset = 6 + count * 16

    directory = b""
    for i, (size, data) in enumerate(zip(sizes, images_data)):
        w = size if size < 256 else 0
        h = size if size < 256 else 0
        directory += struct.pack("<BBBBHHII",
            w, h,   # width, height (0 = 256)
            0,       # color count (0 = no palette)
            0,       # reserved
            1,       # color planes
            32,      # bit count
            len(data),
            data_offset
        )
        data_offset += len(data)

    with open(output_path, "wb") as f:
        f.write(ico_header + directory)
        for data in images_data:
            f.write(data)
    print(f"  Saved {output_path}  ({os.path.getsize(output_path):,} bytes)")


def main():
    out = "public"
    os.makedirs(out, exist_ok=True)

    sizes = {16: None, 32: None, 48: None, 96: None, 192: None, 512: None}
    print("Generating shield favicons…")
    for size in sizes:
        img = make_shield_favicon(size)
        sizes[size] = img

    # PNGs
    save_png(sizes[48],  f"{out}/favicon-48x48.png")
    save_png(sizes[96],  f"{out}/favicon-96x96.png")
    save_png(sizes[192], f"{out}/favicon-192x192.png")
    save_png(sizes[512], f"{out}/favicon-512x512.png")
    save_png(sizes[192], f"{out}/favicon.png")          # generic
    save_png(sizes[192], f"{out}/apple-touch-icon.png") # 192 is fine for ATC

    # ICO (16, 32, 48)
    save_ico([16, 32, 48],
             {16: sizes[16], 32: sizes[32], 48: sizes[48]},
             f"{out}/favicon.ico")

    # Quick sanity: count visible pixels in 48×48
    img48 = sizes[48].convert("RGBA")
    pixels = list(img48.getdata())
    visible = sum(1 for _, _, _, a in pixels if a > 50)
    print(f"\nSanity check 48x48: {visible}/{48*48} visible pixels  "
          f"({'✓ OK' if visible > 1000 else '✗ STILL BROKEN'})")

    print("\nDone! Push to GitHub then request re-crawl in Google Search Console.")


if __name__ == "__main__":
    main()
