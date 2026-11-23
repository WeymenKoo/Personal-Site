"""Every photo and render the portfolio uses, made to the one frame shape (4:3) and re-encoded, so no
EXIF, GPS, colour-profile or Content Credentials chunk survives.

A picture gets to 4:3 in one of three ways, chosen per picture so the subject is never cut:
  full   it is already 4:3 (a few pixels of centre trim at most)
  crop   an explicit box (x0, y0, width as fractions of the source; the height follows from 4:3)
  pad    bars in the picture's own flat background colour (diagrams, layer cards, screenshots)
  extend a render on a plain studio backdrop: the backdrop is continued above and below by mirroring it

  python3 assets.py <site repo> <renders dir> <repos dir> <out dir>
"""
import sys, pathlib
from PIL import Image

site, renders, repos, out = (pathlib.Path(a) for a in sys.argv[1:5])
P = site / 'dusk/content/projects'
HERO, CELL = (1440, 1080), (760, 570)
full = ('full',)
crop = lambda x0, y0, w: ('crop', x0, y0, w)
pad = ('pad',)
extend = ('extend',)

LIST = {
    # power board
    'pb-photo': (P / 'power-board/bench-solder.jpg', full, HERO),
    'pb-chalkboard': (P / 'power-board/plan-chalkboard.jpg', full, CELL),
    'pb-sketch': (P / 'power-board/plan-sketch.jpg', crop(0.09, 0.0, 0.88), CELL),
    'pb-blocks': (P / 'power-board/plan-vs-built.jpg', pad, CELL),
    'pb-exploded': (renders / 'fc_pb/out/exploded/pb_exploded_16x9_labelled.jpg', pad, CELL),
    'pb-flight': (P / 'power-board/comp-2025-flight.jpg', crop(0.14, 0.19, 0.50), CELL),
    'pb-stack': (renders / 'fc_pb/out/social/stack_16x9.jpg', extend, CELL),
    'pb-installed': (P / 'power-board/installed-2025.jpg', crop(0, 0.10, 1.0), CELL),
    'pb-bench': (P / 'power-board/bench-setup.jpg', full, CELL),
    # flight controller SoM (renders only: Rev A is not built yet)
    'fc-hero': (P / 'fc-som/cover.jpg', crop(0.125, 0, 0.75), HERO),
    'fc-bottom': (P / 'fc-som/bottom-angle.jpg', crop(0.125, 0, 0.75), CELL),
    'fc-signal': (P / 'fc-som/all-signal-layers.jpg', pad, HERO),
    'fc-stack': (P / 'fc-som/layer-stack.jpg', pad, CELL),
    'fc-carrier': (renders / 'carrier_v1/out/stack_left_4x3.jpg', full, CELL),
    # FOC motor controller
    'foc-photo': (P / 'foc-controller/tldr.jpg', full, HERO),
    'foc-render': (P / 'foc-controller/render-pair.jpg', crop(0.125, 0, 0.75), CELL),
    'foc-stack': (P / 'foc-controller/layer-stack.jpg', pad, CELL),
    'foc-bench': (P / 'foc-controller/bench-test.jpg', full, CELL),
    'foc-gui': (P / 'foc-controller/gui-spin-control.png', pad, CELL),
    # DC electronic load
    'el-photo': (repos / 'DC-Electronic-Load/bench_test/photos/board_on_bench.jpg', full, HERO),
    'el-sch': (P / 'dc-load/sch-power-stage.png', crop(0.228, 0.03, 0.321), CELL),
    'el-probing': (repos / 'DC-Electronic-Load/bench_test/photos/bench_probing.jpg', full, CELL),
    # gallery
    'g-hub': (P / 'avionics-2024/hub-assembled.jpg', full, CELL),
    'g-hub-installed': (P / 'avionics-2024/tldr.jpg', full, CELL),
    'g-micromouse': (P / 'micromouse/v2-built.jpg', full, CELL),
    'g-spirit': (P / 'kyogre-spirit/spirit-flight-takeoff.jpg', full, CELL),
}

R = 4 / 3
out.mkdir(parents=True, exist_ok=True)
for key, (src, how, size) in LIST.items():
    im = Image.open(src).convert('RGB')
    w, h = im.size
    if how[0] == 'full':
        assert abs(w / h - R) < 0.012, f'{key}: {w}x{h} is not 4:3, give it a crop or pad'
        cw, ch = (w, round(w / R)) if w / h < R else (round(h * R), h)
        im = im.crop(((w - cw) // 2, (h - ch) // 2, (w - cw) // 2 + cw, (h - ch) // 2 + ch))
    elif how[0] == 'crop':
        _, fx, fy, fw = how
        cw = round(fw * w); ch = round(cw / R)
        x0, y0 = round(fx * w), round(fy * h)
        assert x0 + cw <= w + 1 and y0 + ch <= h + 1, f'{key}: crop box leaves the picture ({x0 + cw}x{y0 + ch} of {w}x{h})'
        im = im.crop((x0, y0, min(w, x0 + cw), min(h, y0 + ch)))
    elif how[0] == 'extend':
        import numpy as np
        assert w / h > R
        add = (round(w / R) - h) // 2
        im = Image.fromarray(np.pad(np.asarray(im), ((add, add), (0, 0), (0, 0)), mode='reflect'))
    else:
        bg = im.getpixel((3, 3))
        cw, ch = (w, round(w / R)) if w / h > R else (round(h * R), h)
        canvas = Image.new('RGB', (cw, ch), bg); canvas.paste(im, ((cw - w) // 2, (ch - h) // 2)); im = canvas
    im = im.resize(size, Image.LANCZOS)
    clean = Image.new('RGB', im.size); clean.paste(im)  # a fresh image carries no info dict
    if src.suffix.lower() == '.png' and how[0] != 'crop' or key in ('pb-blocks', 'el-sch'):
        clean.save(out / f'{key}.png', optimize=True)
    else:
        clean.save(out / f'{key}.jpg', quality=84, optimize=True)
    print(key, how[0], f'{w}x{h}')
