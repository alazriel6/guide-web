import os
from PIL import Image, ImageDraw, ImageFont

def generate_svg_designs():
    out_dir = r"E:\APP\prd\frontend\public"
    
    # Design 1: Modern Architectural Blueprint "B" (Precision Isometric / CAD Bevels)
    # Hero Color: #ff7a45 (The web's primary accent) with deep obsidian backdrop #0c0d0f
    svg_content = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="100%" height="100%">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#14161a"/>
      <stop offset="100%" stop-color="#0a0b0d"/>
    </linearGradient>

    <!-- Warm Orange Brand Gradient (Web Accent) -->
    <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff9359"/>
      <stop offset="50%" stop-color="#ff7a45"/>
      <stop offset="100%" stop-color="#ea580c"/>
    </linearGradient>

    <!-- Vibrant Highlight Gradient -->
    <linearGradient id="highlightGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffb088"/>
      <stop offset="100%" stop-color="#ff7a45"/>
    </linearGradient>

    <!-- Soft Orange Glow -->
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ff7a45" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#ff7a45" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Dark Obsidian Container with 1px Precision Border -->
  <rect x="4" y="4" width="120" height="120" rx="28" fill="url(#bgGrad)" stroke="#26292f" stroke-width="2"/>

  <!-- Ambient Glow Behind Icon -->
  <circle cx="64" cy="64" r="48" fill="url(#glow)"/>

  <!-- Architectural Blueprint Grid Accents (Minimal, Elegant, Crisp) -->
  <g stroke="#ff7a45" stroke-width="0.75" opacity="0.15" stroke-dasharray="2 3">
    <line x1="26" y1="20" x2="26" y2="108"/>
    <line x1="102" y1="20" x2="102" y2="108"/>
    <line x1="20" y1="26" x2="108" y2="26"/>
    <line x1="20" y1="102" x2="108" y2="102"/>
  </g>

  <!-- Precision Corner Marks -->
  <path d="M 18 26 L 18 18 L 26 18" fill="none" stroke="#ff7a45" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
  <path d="M 110 26 L 110 18 L 102 18" fill="none" stroke="#ff7a45" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
  <path d="M 18 102 L 18 110 L 26 110" fill="none" stroke="#ff7a45" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
  <path d="M 110 102 L 110 110 L 102 110" fill="none" stroke="#ff7a45" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>

  <!-- HERO GLYPH: Architectural Blueprint "B" -->
  <!-- 1. Left Foundation Stem (Pillar) -->
  <rect x="30" y="27" width="13" height="74" rx="4" fill="url(#orangeGrad)"/>

  <!-- 2. Upper Architectural Chamber (Loop 1) -->
  <path d="M 43 27 H 70 C 83.5 27 93 35.5 93 47.5 C 93 59.5 83.5 67 70 67 H 43 Z"
        fill="none" stroke="url(#orangeGrad)" stroke-width="11" stroke-linejoin="round" stroke-linecap="round"/>

  <!-- 3. Lower Architectural Chamber (Loop 2, Extended) -->
  <path d="M 43 65 H 74 C 88.5 65 98 74 98 85.5 C 98 97 88.5 105 73 105 H 43 Z"
        fill="none" stroke="url(#orangeGrad)" stroke-width="11" stroke-linejoin="round" stroke-linecap="round"/>

  <!-- 4. Inner Blueprint Coordinate Spark (Technical Cut/Accent) -->
  <path d="M 43 66 L 73 66" stroke="#121316" stroke-width="4" stroke-linecap="round"/>
  
  <!-- Precision Technical Dot / Compiler Node at apex -->
  <circle cx="93" cy="47.5" r="3.2" fill="#ffffff" opacity="0.95"/>
  <circle cx="98" cy="85.5" r="3.6" fill="#ffffff" opacity="0.95"/>
</svg>'''

    svg_path = os.path.join(out_dir, "favicon.svg")
    with open(svg_path, "w", encoding="utf-8") as f:
        f.write(svg_content)
    print(f"Written {svg_path}")

if __name__ == "__main__":
    generate_svg_designs()
