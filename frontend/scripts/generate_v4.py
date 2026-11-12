import os
from PIL import Image, ImageDraw, ImageFilter

def make_architectural_cut_b():
    size = 512
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 1. Background: Deep obsidian (#0c0d0f with #26292f border)
    margin = 16
    r = 116
    draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=r,
        fill=(12, 13, 15, 255),
        outline=(38, 41, 47, 255),
        width=5
    )

    # 2. Subtle Warm Orange Radial Glow in center
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    gdraw.ellipse([110, 110, size - 110, size - 110], fill=(255, 122, 69, 70))
    glow = glow.filter(ImageFilter.GaussianBlur(radius=65))
    img = Image.alpha_composite(img, glow)
    draw = ImageDraw.Draw(img)

    # 3. Bold, Ultra-Clean Architectural "B" with 45° Precision Drafting Slashes
    # Web primary orange: (255, 122, 69) -> #ff7a45
    # Light orange: (255, 156, 112) -> #ff9c70
    # Deep orange: (230, 88, 28) -> #e6581c
    # Shadow orange: (195, 62, 12) -> #c33e0c

    # Left Foundation Pillar:
    # x: 110..164, y: 104..408 (width=54, height=304)
    draw.rounded_rectangle([110, 104, 164, 408], radius=14, fill=(255, 122, 69, 255))

    # Upper Architectural Chamber:
    # Outer:
    draw.rounded_rectangle([140, 104, 334, 246], radius=71, fill=(255, 146, 96, 255))
    # Inner Cutout:
    draw.rounded_rectangle([140, 152, 286, 198], radius=23, fill=(12, 13, 15, 255))

    # Lower Architectural Chamber:
    # Outer (slightly larger, bolder):
    draw.rounded_rectangle([140, 238, 372, 408], radius=85, fill=(230, 88, 28, 255))
    # Inner Cutout:
    draw.rounded_rectangle([140, 290, 316, 356], radius=33, fill=(12, 13, 15, 255))

    # Clean architectural divider cut (Horizontal precision split):
    draw.line([(140, 242), (380, 242)], fill=(12, 13, 15, 255), width=16)

    # Re-draw Pillar with gradient highlight
    draw.rounded_rectangle([110, 104, 164, 408], radius=14, fill=(255, 122, 69, 255))

    # Architectural Drafting Scale Tick (White contrast mark)
    draw.rounded_rectangle([114, 238, 148, 246], radius=3, fill=(255, 255, 255, 240))

    # Precision Architectural Corner Crosshairs in faint orange
    cross_c = (255, 122, 69, 75)
    # TL
    draw.line([(64, 52), (64, 84)], fill=cross_c, width=3)
    draw.line([(48, 68), (80, 68)], fill=cross_c, width=3)
    # TR
    draw.line([(448, 52), (448, 84)], fill=cross_c, width=3)
    draw.line([(432, 68), (464, 68)], fill=cross_c, width=3)
    # BL
    draw.line([(64, 428), (64, 460)], fill=cross_c, width=3)
    draw.line([(48, 444), (80, 444)], fill=cross_c, width=3)
    # BR
    draw.line([(448, 428), (448, 460)], fill=cross_c, width=3)
    draw.line([(432, 444), (464, 444)], fill=cross_c, width=3)

    return img

if __name__ == "__main__":
    out_dir = r"E:\APP\prd\frontend\public"
    img = make_architectural_cut_b()
    img.save(os.path.join(out_dir, "v4_preview.png"), "PNG")
    print("Rendered v4_preview.png")
