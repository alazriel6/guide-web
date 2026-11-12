import math
import os
from PIL import Image, ImageDraw, ImageFilter

def draw_isometric_blueprint_block():
    size = 256
    scale = 4
    W = size * scale
    H = size * scale

    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 1. Background Squircle (#0c0d0f with #26292f border)
    margin = 8 * scale
    r = 56 * scale
    draw.rounded_rectangle(
        [margin, margin, W - margin, H - margin],
        radius=r,
        fill=(12, 13, 15, 255),
        outline=(38, 41, 47, 255),
        width=int(2.5 * scale)
    )

    # 2. Ambient Warm Orange Glow
    glow_img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_img)
    glow_r = 85 * scale
    glow_draw.ellipse(
        [W//2 - glow_r, H//2 - glow_r, W//2 + glow_r, H//2 + glow_r],
        fill=(255, 122, 69, 65)
    )
    glow_img = glow_img.filter(ImageFilter.GaussianBlur(radius=35 * scale))
    img = Image.alpha_composite(img, glow_img)
    draw = ImageDraw.Draw(img)

    # 3. Geometric Isometric Blueprint Monogram "B"
    # An isometric cube folded into a futuristic architectural "B"
    # Center coordinates:
    cx = W // 2
    cy = H // 2

    # Primary colors matching the website:
    c_top = (255, 162, 114, 255)    # #ffa272 (Highlight top)
    c_left = (255, 122, 69, 255)    # #ff7a45 (The exact web accent!)
    c_right = (220, 72, 20, 255)    # #dc4814 (Shadow right)
    c_dark = (165, 45, 10, 255)     # #a52d0a (Deep shadow)

    # Let's draw a super clean geometric "B" in solid, modern Swiss typography/geometry:
    # Instead of awkward loops, let's use bold, precision-radiused geometric shapes:
    # A solid vertical pillar on the left:
    # x1=64..94, y1=48..208, radius=8
    # Top lobe: x=94..180, y=48..124
    # Bottom lobe: x=94..196, y=124..208
    # With a sleek 45-degree architectural bevel!
    
    # Let's test this in Python and save to test_isometric.png
    return img

if __name__ == "__main__":
    pass
