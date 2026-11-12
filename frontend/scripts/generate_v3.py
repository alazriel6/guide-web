import math
import os
from PIL import Image, ImageDraw, ImageFilter

def make_blueprint_icon_v3():
    size = 512
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 1. Dark Obsidian Canvas (#0c0d0f with #26292f border)
    margin = 16
    r = 112
    draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=r,
        fill=(14, 15, 18, 255),
        outline=(42, 45, 52, 255),
        width=5
    )

    # 2. Ambient Warm Orange Glow
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    gdraw.ellipse([100, 100, size - 100, size - 100], fill=(255, 122, 69, 50))
    glow = glow.filter(ImageFilter.GaussianBlur(radius=60))
    img = Image.alpha_composite(img, glow)
    draw = ImageDraw.Draw(img)

    # 3. Geometric Monogram "B" with Architectural Precision
    # Main Orange Colors matching the web exactly:
    # #ff945e (Highlight)
    # #ff7a45 (Web Accent Primary)
    # #e85918 (Deep Orange)
    # #c23e08 (Shadow)

    # Left vertical stem (Pill shape)
    stem_x1, stem_x2 = 120, 172
    stem_y1, stem_y2 = 104, 408
    draw.rounded_rectangle([stem_x1, stem_y1, stem_x2, stem_y2], radius=16, fill=(255, 122, 69, 255))

    # Upper Lobe of B:
    # Outer curve: from (172, 104) to (316, 104), arc to (316, 240), line to (172, 240)
    # Inner cutout: from (172, 144) to (270, 144), arc to (270, 200), line to (172, 200)
    # Let's draw this with high quality polygons and arcs:
    # Upper Lobe Outer:
    draw.pieslice([172, 104, 344, 246], start=270, end=90, fill=(255, 142, 88, 255))
    draw.rectangle([170, 104, 258, 246], fill=(255, 142, 88, 255))
    # Inner Cutout of Upper Lobe:
    draw.pieslice([172, 146, 296, 204], start=270, end=90, fill=(14, 15, 18, 255))
    draw.rectangle([170, 146, 234, 204], fill=(14, 15, 18, 255))

    # Lower Lobe Outer (Larger, bold):
    draw.pieslice([172, 238, 380, 408], start=270, end=90, fill=(232, 89, 24, 255))
    draw.rectangle([170, 238, 276, 408], fill=(232, 89, 24, 255))
    # Inner Cutout of Lower Lobe:
    draw.pieslice([172, 280, 328, 366], start=270, end=90, fill=(14, 15, 18, 255))
    draw.rectangle([170, 280, 250, 366], fill=(14, 15, 18, 255))

    # Clean horizontal gap / architectural negative space between upper and lower lobes
    draw.line([(160, 242), (370, 242)], fill=(14, 15, 18, 255), width=10)

    # Re-draw stem for crisp layering
    draw.rounded_rectangle([stem_x1, stem_y1, stem_x2, stem_y2], radius=16, fill=(255, 122, 69, 255))

    # Add precision white coordinate tick on stem
    draw.line([(stem_x1 + 6, 242), (stem_x1 + 36, 242)], fill=(255, 255, 255, 240), width=6)

    # Architectural Blueprint Corner Crosshairs (Faint, high-end touch)
    cross_c = (255, 122, 69, 90)
    # Top-Left cross
    draw.line([(56, 46), (56, 76)], fill=cross_c, width=3)
    draw.line([(41, 61), (71, 61)], fill=cross_c, width=3)
    # Top-Right cross
    draw.line([(456, 46), (456, 76)], fill=cross_c, width=3)
    draw.line([(441, 61), (471, 61)], fill=cross_c, width=3)
    # Bottom-Left cross
    draw.line([(56, 436), (56, 466)], fill=cross_c, width=3)
    draw.line([(41, 451), (71, 451)], fill=cross_c, width=3)
    # Bottom-Right cross
    draw.line([(456, 436), (456, 466)], fill=cross_c, width=3)
    draw.line([(441, 451), (471, 451)], fill=cross_c, width=3)

    return img

if __name__ == "__main__":
    out_dir = r"E:\APP\prd\frontend\public"
    img = make_blueprint_icon_v3()
    img.save(os.path.join(out_dir, "v3_preview.png"), "PNG")
    print("Generated v3_preview.png")
