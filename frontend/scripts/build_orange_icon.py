import os
from PIL import Image, ImageDraw, ImageFilter

def make_clean_bold_orange_icon():
    # 512x512 master resolution for super-sampling
    S = 512
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 1. Dark Obsidian Canvas (#0c0d0f with subtle graphite border #26292f)
    margin = 16
    r = 112
    draw.rounded_rectangle(
        [margin, margin, S - margin, S - margin],
        radius=r,
        fill=(12, 13, 15, 255),
        outline=(38, 41, 47, 255),
        width=5
    )

    # 2. Warm Orange Ambient Core Glow
    glow = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    gdraw.ellipse([100, 100, S - 100, S - 100], fill=(255, 122, 69, 70))
    glow = glow.filter(ImageFilter.GaussianBlur(radius=65))
    img = Image.alpha_composite(img, glow)
    draw = ImageDraw.Draw(img)

    # 3. Bold Architectural Monogram "B" in #ff7a45
    # Dimensions:
    # Stem: x=112..168 (width=56), y=104..408 (height=304)
    # Upper Loop: x=168..348, y=104..246
    # Lower Loop: x=168..376, y=246..408
    # Gap: y=241..251 (height=10)

    # Color palette:
    # Top highlight: #ffa06e (255, 160, 110)
    # Primary accent: #ff7a45 (255, 122, 69)
    # Deep shadow: #e65616 (230, 86, 22)
    # Dark shadow: #be3c07 (190, 60, 7)

    # Draw Upper Loop Outer:
    draw.pieslice([168, 104, 348, 246], start=270, end=90, fill=(255, 152, 98, 255))
    draw.rectangle([160, 104, 258, 246], fill=(255, 152, 98, 255))
    # Upper Loop Cutout:
    draw.pieslice([168, 150, 302, 200], start=270, end=90, fill=(12, 13, 15, 255))
    draw.rectangle([160, 150, 235, 200], fill=(12, 13, 15, 255))

    # Draw Lower Loop Outer (slightly larger & bolder):
    draw.pieslice([168, 244, 384, 408], start=270, end=90, fill=(230, 86, 22, 255))
    draw.rectangle([160, 244, 276, 408], fill=(230, 86, 22, 255))
    # Lower Loop Cutout:
    draw.pieslice([168, 290, 332, 362], start=270, end=90, fill=(12, 13, 15, 255))
    draw.rectangle([160, 290, 250, 362], fill=(12, 13, 15, 255))

    # Negative Space Divider Gap between top and bottom loops
    draw.rectangle([150, 240, 390, 250], fill=(12, 13, 15, 255))

    # Draw Foundation Pillar on left:
    draw.rounded_rectangle([112, 104, 168, 408], radius=16, fill=(255, 122, 69, 255))

    # Architectural Drafting Scale Tick (White contrast marker)
    draw.rounded_rectangle([116, 242, 150, 248], radius=3, fill=(255, 255, 255, 240))

    # Vertex Spark Dots (Precision White Nodes)
    # Top apex: (348, 175) -> center of curve is at (258, 175), rightmost is (348, 175)
    draw.ellipse([348 - 10, 175 - 10, 348 + 10, 175 + 10], fill=(255, 255, 255, 250))
    # Bottom apex: (384, 326)
    draw.ellipse([384 - 12, 326 - 12, 384 + 12, 326 + 12], fill=(255, 255, 255, 250))

    # Architectural Blueprint Corner Tick Marks (Faint orange)
    tick_c = (255, 122, 69, 85)
    t_len = 36
    t_w = 4
    # TL
    draw.line([(56, 56), (56 + t_len, 56)], fill=tick_c, width=t_w)
    draw.line([(56, 56), (56, 56 + t_len)], fill=tick_c, width=t_w)
    # TR
    draw.line([(S - 56, 56), (S - 56 - t_len, 56)], fill=tick_c, width=t_w)
    draw.line([(S - 56, 56), (S - 56, 56 + t_len)], fill=tick_c, width=t_w)
    # BL
    draw.line([(56, S - 56), (56 + t_len, S - 56)], fill=tick_c, width=t_w)
    draw.line([(56, S - 56), (56, S - 56 - t_len)], fill=tick_c, width=t_w)
    # BR
    draw.line([(S - 56, S - 56), (S - 56 - t_len, S - 56)], fill=tick_c, width=t_w)
    draw.line([(S - 56, S - 56), (S - 56, S - 56 - t_len)], fill=tick_c, width=t_w)

    return img

if __name__ == "__main__":
    out_dir = r"E:\APP\prd\frontend\public"
    master_img = make_clean_bold_orange_icon()
    
    # Save 256x256 PNG
    png_256 = master_img.resize((256, 256), Image.Resampling.LANCZOS)
    png_256.save(os.path.join(out_dir, "favicon.png"), "PNG")
    print("Saved favicon.png")

    # Save multi-size favicon.ico
    png_256.save(
        os.path.join(out_dir, "favicon.ico"),
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    )
    print("Saved favicon.ico")
