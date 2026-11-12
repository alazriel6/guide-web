import os
from PIL import Image, ImageDraw, ImageFilter

def create_blueprint_icon():
    size = 256
    # 2x supersampling for ultra crisp anti-aliasing
    scale = 2
    w = size * scale
    h = size * scale

    # Transparent RGBA canvas
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 1. Dark Blueprint Obsidian Background Squircle
    margin = 8 * scale
    r = 54 * scale
    draw.rounded_rectangle(
        [margin, margin, w - margin, h - margin],
        radius=r,
        fill=(10, 15, 26, 255),
        outline=(30, 41, 59, 255),
        width=int(2.5 * scale)
    )

    # 2. Blueprint Architectural Grid (faint cyan lines)
    grid_color = (14, 165, 233, 45)
    grid_step = 28 * scale
    for x in range(margin + grid_step, w - margin, grid_step):
        draw.line([(x, margin + 10 * scale), (x, h - margin - 10 * scale)], fill=grid_color, width=int(1 * scale))
    for y in range(margin + grid_step, h - margin, grid_step):
        draw.line([(margin + 10 * scale, y), (w - margin - 10 * scale, y)], fill=grid_color, width=int(1 * scale))

    # 3. Corner Blueprint Tick Marks
    corner_color = (56, 189, 248, 160)
    cw = 24 * scale
    ch = 24 * scale
    ct = int(2.5 * scale)
    
    # Top-Left
    draw.line([(margin + 16 * scale, margin + 16 * scale), (margin + 16 * scale + cw, margin + 16 * scale)], fill=corner_color, width=ct)
    draw.line([(margin + 16 * scale, margin + 16 * scale), (margin + 16 * scale, margin + 16 * scale + ch)], fill=corner_color, width=ct)

    # Top-Right
    draw.line([(w - margin - 16 * scale - cw, margin + 16 * scale), (w - margin - 16 * scale, margin + 16 * scale)], fill=corner_color, width=ct)
    draw.line([(w - margin - 16 * scale, margin + 16 * scale), (w - margin - 16 * scale, margin + 16 * scale + ch)], fill=corner_color, width=ct)

    # Bottom-Left
    draw.line([(margin + 16 * scale, h - margin - 16 * scale), (margin + 16 * scale + cw, h - margin - 16 * scale)], fill=corner_color, width=ct)
    draw.line([(margin + 16 * scale, h - margin - 16 * scale - ch), (margin + 16 * scale, h - margin - 16 * scale)], fill=corner_color, width=ct)

    # Bottom-Right
    draw.line([(w - margin - 16 * scale - cw, h - margin - 16 * scale), (w - margin - 16 * scale, h - margin - 16 * scale)], fill=corner_color, width=ct)
    draw.line([(w - margin - 16 * scale, h - margin - 16 * scale - ch), (w - margin - 16 * scale, h - margin - 16 * scale)], fill=corner_color, width=ct)

    # 4. Stylized "B" Monogram (Architectural Blueprint Spine & Arcs)
    spine_x1 = 62 * scale
    spine_x2 = 86 * scale
    spine_y1 = 58 * scale
    spine_y2 = 198 * scale
    cyan = (56, 189, 248, 255)
    cyan_dark = (2, 132, 199, 255)
    orange = (249, 115, 22, 255)
    white = (255, 255, 255, 220)

    # Vertical Spine
    draw.rounded_rectangle([spine_x1, spine_y1, spine_x2, spine_y2], radius=6*scale, fill=cyan)

    # Spine Ruler Ticks
    draw.line([(spine_x1 + 3*scale, 93*scale), (spine_x1 + 14*scale, 93*scale)], fill=white, width=int(2*scale))
    draw.line([(spine_x1 + 3*scale, 128*scale), (spine_x1 + 20*scale, 128*scale)], fill=white, width=int(2.5*scale))
    draw.line([(spine_x1 + 3*scale, 163*scale), (spine_x1 + 14*scale, 163*scale)], fill=white, width=int(2*scale))

    # Upper Arc Loop
    top_box = [spine_x2 - 10*scale, spine_y1, 172*scale, 128*scale]
    draw.arc(top_box, start=270, end=90, fill=cyan, width=int(18*scale))
    draw.line([(spine_x2 - 2*scale, spine_y1 + 9*scale), (130*scale, spine_y1 + 9*scale)], fill=cyan, width=int(18*scale))
    draw.line([(spine_x2 - 2*scale, 128*scale - 9*scale), (130*scale, 128*scale - 9*scale)], fill=cyan, width=int(18*scale))

    # Lower Arc Loop (Larger)
    bot_box = [spine_x2 - 10*scale, 128*scale - 18*scale, 188*scale, spine_y2]
    draw.arc(bot_box, start=270, end=90, fill=cyan, width=int(18*scale))
    draw.line([(spine_x2 - 2*scale, 128*scale - 9*scale), (142*scale, 128*scale - 9*scale)], fill=cyan, width=int(18*scale))
    draw.line([(spine_x2 - 2*scale, spine_y2 - 9*scale), (142*scale, spine_y2 - 9*scale)], fill=cyan, width=int(18*scale))

    # 5. Orange Execution / Compiler Vertex Nodes
    # Top Arc Apex Node
    draw.ellipse([168*scale - 8*scale, 93*scale - 8*scale, 168*scale + 8*scale, 93*scale + 8*scale], fill=orange)
    # Bottom Arc Apex Node
    draw.ellipse([184*scale - 9*scale, 159*scale - 9*scale, 184*scale + 9*scale, 159*scale + 9*scale], fill=orange)

    # 6. Technical Drafting Angle Marker (">") in Orange
    angle_pts = [
        (196*scale, 82*scale),
        (210*scale, 93*scale),
        (196*scale, 104*scale)
    ]
    draw.line(angle_pts, fill=orange, width=int(4*scale), joint="round")

    # Downsample with Lanczos filter for crispness
    final_img = img.resize((size, size), Image.Resampling.LANCZOS)
    return final_img

if __name__ == "__main__":
    out_dir = r"E:\APP\prd\frontend\public"
    os.makedirs(out_dir, exist_ok=True)
    
    icon_img = create_blueprint_icon()
    
    # Save as PNG
    png_path = os.path.join(out_dir, "favicon.png")
    icon_img.save(png_path, "PNG")
    print(f"Saved {png_path}")

    # Save as multi-resolution ICO
    ico_path = os.path.join(out_dir, "favicon.ico")
    icon_img.save(ico_path, format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    print(f"Saved {ico_path}")
