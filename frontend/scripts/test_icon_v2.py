import os
from PIL import Image, ImageDraw, ImageFilter

def draw_icon_v2():
    size = 256
    scale = 4
    W = size * scale
    H = size * scale

    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 1. Dark Graphite Background
    margin = 8 * scale
    r = 56 * scale
    # Background fill: #0f1115
    draw.rounded_rectangle(
        [margin, margin, W - margin, H - margin],
        radius=r,
        fill=(15, 17, 21, 255),
        outline=(38, 41, 47, 255),
        width=int(3 * scale)
    )

    # 2. Ambient Warm Orange Glow in center
    # Create glow layer
    glow_img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_img)
    glow_r = 75 * scale
    glow_draw.ellipse(
        [W//2 - glow_r, H//2 - glow_r, W//2 + glow_r, H//2 + glow_r],
        fill=(255, 122, 69, 50)
    )
    glow_img = glow_img.filter(ImageFilter.GaussianBlur(radius=30 * scale))
    img = Image.alpha_composite(img, glow_img)
    draw = ImageDraw.Draw(img)

    # 3. Geometric Architectural "B" in Vibrant Orange (#ff7a45)
    # Colors:
    c_light = (255, 154, 108, 255)   # #ff9a6c (top highlight)
    c_main = (255, 122, 69, 255)     # #ff7a45 (main web accent)
    c_deep = (222, 75, 23, 255)      # #de4b17 (deep rich orange)
    c_dark = (175, 52, 10, 255)      # #af340a (shadow facet)

    # Geometry:
    # Left Foundation Pillar:
    px1, py1 = 60 * scale, 52 * scale
    px2, py2 = 84 * scale, 204 * scale
    draw.rounded_rectangle([px1, py1, px2, py2], radius=int(6 * scale), fill=c_main)

    # Top Chamber (Outer arc + inner cutout)
    # Outer:
    top_box = [px2 - 8*scale, py1, 180 * scale, 128 * scale]
    draw.arc(top_box, start=270, end=90, fill=c_light, width=int(22 * scale))
    draw.line([(px2 - 2*scale, py1 + 11*scale), (130*scale, py1 + 11*scale)], fill=c_light, width=int(22 * scale))
    draw.line([(px2 - 2*scale, 128*scale - 11*scale), (130*scale, 128*scale - 11*scale)], fill=c_light, width=int(22 * scale))

    # Bottom Chamber (Larger, more dynamic)
    bot_box = [px2 - 8*scale, 128 * scale - 22*scale, 196 * scale, py2]
    draw.arc(bot_box, start=270, end=90, fill=c_main, width=int(22 * scale))
    draw.line([(px2 - 2*scale, 128*scale - 11*scale), (142*scale, 128*scale - 11*scale)], fill=c_main, width=int(22 * scale))
    draw.line([(px2 - 2*scale, py2 - 11*scale), (142*scale, py2 - 11*scale)], fill=c_main, width=int(22 * scale))

    # Architectural Slit (Negative Space divider between chambers)
    draw.line([(px1, 128 * scale), (px2 + 40*scale, 128 * scale)], fill=(15, 17, 21, 255), width=int(6 * scale))

    # Precision White Vertex Dot (CAD Node)
    dot_r = int(5.5 * scale)
    draw.ellipse([180*scale - dot_r, 90*scale - dot_r, 180*scale + dot_r, 90*scale + dot_r], fill=(255, 255, 255, 240))
    dot_r2 = int(6 * scale)
    draw.ellipse([196*scale - dot_r2, 160*scale - dot_r2, 196*scale + dot_r2, 160*scale + dot_r2], fill=(255, 255, 255, 240))

    # Downsample
    final_img = img.resize((size, size), Image.Resampling.LANCZOS)
    return final_img

if __name__ == "__main__":
    out_dir = r"E:\APP\prd\frontend\public"
    img = draw_icon_v2()
    img.save(os.path.join(out_dir, "test_v2.png"), "PNG")
    print("Rendered test_v2.png")
