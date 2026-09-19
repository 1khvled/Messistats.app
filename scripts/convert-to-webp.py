import os
import glob
from PIL import Image

img_dir = os.path.join(os.path.dirname(__file__), "..", "public", "img")
jpg_files = glob.glob(os.path.join(img_dir, "*.jpg"))

print(f"Found {len(jpg_files)} JPG images in {img_dir}")

total_orig = 0
total_webp = 0

for jpg_path in jpg_files:
    filename = os.path.basename(jpg_path)
    base_name, _ = os.path.splitext(filename)
    webp_path = os.path.join(img_dir, f"{base_name}.webp")
    
    orig_size = os.path.getsize(jpg_path)
    total_orig += orig_size
    
    with Image.open(jpg_path) as im:
        # Convert RGB if needed
        if im.mode in ("RGBA", "P"):
            im = im.convert("RGB")
        im.save(webp_path, "WEBP", quality=82, method=6)
        
    webp_size = os.path.getsize(webp_path)
    total_webp += webp_size
    
    reduction = (1 - webp_size / orig_size) * 100
    print(f"  {filename} ({orig_size // 1024} KB) -> {base_name}.webp ({webp_size // 1024} KB) [-{reduction:.1f}%]")

print(f"\nTotal JPG size:  {total_orig // 1024} KB")
print(f"Total WebP size: {total_webp // 1024} KB")
savings = (1 - total_webp / total_orig) * 100
print(f"Saved { (total_orig - total_webp) // 1024 } KB (-{savings:.1f}%) bandwidth!")
