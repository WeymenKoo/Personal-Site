"""Copy every picture the portfolio uses into tools/portfolio/assets/: resized for print and re-encoded,
so no EXIF, GPS, colour-profile or Content Credentials chunk survives.

  python3 assets.py <site repo> <renders dir> <out dir>
"""
import sys, pathlib
from PIL import Image

site, renders, out = (pathlib.Path(a) for a in sys.argv[1:4])
P = site / 'dusk/content/projects'
LIST = {
    # key: (source, longest side)
    'pb-hero': (renders / 'fc_pb/out/social/pb_top_16x9.jpg', 2200),
    'pb-exploded': (renders / 'fc_pb/out/exploded/pb_exploded_16x9_labelled.jpg', 1800),
    'pb-chalkboard': (P / 'power-board/plan-chalkboard.jpg', 1400),
    'pb-sketch': (P / 'power-board/plan-sketch.jpg', 1000),
    'pb-blocks': (P / 'power-board/plan-vs-built.jpg', 1600),
    'pb-installed': (P / 'power-board/installed-2025.jpg', 1100),
    'pb-flight': (P / 'power-board/comp-2025-flight.jpg', 1600),
    'pb-bench': (P / 'power-board/bench-setup.jpg', 1400),
    'pb-built': (P / 'power-board/tldr.jpg', 1200),
    'pb-eff': (P / 'power-board/bench-efficiency.png', 1100),
    'fc-hero': (P / 'fc-som/cover.jpg', 2000),
    'fc-bottom': (P / 'fc-som/bottom-angle.jpg', 1400),
    'fc-layers': (P / 'fc-som/layers-overview.jpg', 1800),
    'fc-signal': (P / 'fc-som/all-signal-layers.jpg', 2000),
    'fc-stack': (P / 'fc-som/layer-stack.jpg', 1600),
    'foc-hero': (P / 'foc-controller/render-pair.jpg', 2000),
    'foc-photo': (P / 'foc-controller/photo-rev1.jpg', 1000),
    'foc-layers': (P / 'foc-controller/layers-overview.jpg', 2000),
    'foc-signal': (P / 'foc-controller/all-signal-layers.jpg', 2000),
    'el-heatsink': (P / 'dc-load/rev-a-on-heatsink.jpg', 1400),
    'el-boards': (P / 'dc-load/card.jpg', 1200),
    'el-sch': (P / 'dc-load/sch-power-stage.png', 1800),
    'el-envelope': (P / 'dc-load/bench-envelope.png', 1105),
    'g-shadow': (renders / 'stack_top/out/stack_table_16x9.jpg', 1600),
    'g-shadow-installed': (P / 'avionics-2024/hub-installed.jpg', 900),
    'g-module': (P / 'avionics-2024/render-tail-module.jpg', 1190),
    'g-carrier': (renders / 'carrier_v1/out/stack_left_4x3.jpg', 1400),
    'g-carrier-top': (renders / 'carrier_v1/out/cb_top_16x9.jpg', 1400),
    'g-micromouse': (P / 'micromouse/v2-built.jpg', 1200),
    'g-kyogre': (P / 'kyogre-spirit/tldr.jpg', 1200),
}
# fractions of the source (x0, y0, x1, y1)
CROP = {'foc-signal': (0.0, 0.0, 0.545, 1.0)}
out.mkdir(parents=True, exist_ok=True)
for key, (src, side) in LIST.items():
    im = Image.open(src)
    png = src.suffix.lower() == '.png'
    im = im.convert('RGB')
    if key in CROP: im = im.crop(tuple(int(f * d) for f, d in zip(CROP[key], im.size * 2)))
    im.thumbnail((side, side), Image.LANCZOS)
    clean = Image.new('RGB', im.size); clean.paste(im)  # a fresh image carries no info dict
    if png: clean.save(out / f'{key}.png', optimize=True)
    else: clean.save(out / f'{key}.jpg', quality=86, optimize=True, progressive=True)
    print(key, clean.size)
