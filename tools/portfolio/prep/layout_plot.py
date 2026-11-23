"""Layout figures from fabrication data, in one style: light board, copper as a tint with an outline
(top red, bottom blue), exposed pads solid, silkscreen dark, holes cut out. Every figure is composed on
the portfolio's one frame shape (4:3) and the mm -> pixel transform of each board is written to
layouts.json, so tools/portfolio/content.js can pin numbered call-outs to board coordinates.

  python3 layout_plot.py <power board gerbers> <FOC gerbers> <DC-Electronic-Load repo> <assets dir>
"""
import io, json, pathlib, sys
import cairosvg, numpy as np
from PIL import Image, ImageChops, ImageFilter
from scipy import ndimage
from gerbonara import GerberFile, ExcellonFile

W, H = 2160, 1620            # 4:3, 1.5x the hero frame
SS = 2                       # supersampling
PAPER, BOARD, EDGE = (250, 247, 242), (233, 229, 223), (120, 110, 100)
RED, BLUE, PAD, SILK = (214, 62, 52), (58, 98, 230), (150, 70, 30), (42, 33, 24)


def raster(path, bounds, ppmm, excellon=False):
    f = (ExcellonFile if excellon else GerberFile).open(str(path))
    svg = str(f.to_svg(force_bounds=bounds, fg='black', bg='white'))
    png = cairosvg.svg2png(bytestring=svg.encode(), output_width=round((bounds[1][0] - bounds[0][0]) * ppmm))
    im = Image.open(io.BytesIO(png)).convert('RGBA')
    flat = Image.new('RGBA', im.size, 'white'); flat.alpha_composite(im)
    return np.asarray(ImageChops.invert(flat.convert('L'))) > 128


def outline(path, bounds, ppmm):
    """(outline strokes, cut-out regions) of a profile layer. Altium draws the outline with a zero-width
    aperture and the cut-outs as filled regions; KiCad draws everything as thin lines."""
    from gerbonara.apertures import CircleAperture
    from gerbonara.utils import MM
    from gerbonara.graphic_objects import Region
    def part(keep_regions):
        g = GerberFile.open(str(path))
        g.objects = [o for o in g.objects if isinstance(o, Region) == keep_regions]
        if not keep_regions:
            for o in g.objects: o.aperture = CircleAperture(0.15, unit=MM)
        if not g.objects: return None
        svg = str(g.to_svg(force_bounds=bounds, fg='black', bg='white'))
        png = cairosvg.svg2png(bytestring=svg.encode(), output_width=round((bounds[1][0] - bounds[0][0]) * ppmm))
        im = Image.open(io.BytesIO(png)).convert('RGBA')
        flat = Image.new('RGBA', im.size, 'white'); flat.alpha_composite(im)
        return np.asarray(ImageChops.invert(flat.convert('L'))) > 128
    lines, cuts = part(False), part(True)
    return lines, (cuts if cuts is not None else np.zeros_like(lines))


def edge(m, r):
    return m & ~ndimage.binary_erosion(m, iterations=r)


def board(files, ppmm, upper=RED, lower=BLUE, pads=True, mirror=False):
    """files: dict(profile, upper, lower, mask, silk, drill[, drill_excellon]) -> (RGBA image, bounds)"""
    p = ppmm * SS
    (x0, y0), (x1, y1) = GerberFile.open(str(files['profile'])).bounding_box()
    m = 0.6
    b = ((x0 - m, y0 - m), (x1 + m, y1 + m))
    r = lambda k, **kw: raster(files[k], b, p, **kw)
    prof, cuts = outline(files['profile'], b, p)
    prof = ndimage.binary_dilation(prof, iterations=SS)
    # the board is the biggest region the outline encloses; other enclosed regions (windows, slots) are cut-outs
    lab, n = ndimage.label(~prof)
    outside = lab[0, 0]
    sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
    body = max((i for i in range(1, n + 1) if i != outside), key=lambda i: sizes[i - 1])
    inside = ((lab == body) | (prof & ndimage.binary_dilation(lab == body, iterations=3 * SS))) & ~cuts
    up = r('upper') & inside
    lo = (r('lower') & inside) if files.get('lower') else np.zeros_like(up)
    hh, ww = up.shape
    def fit(a):  # layers can come out a pixel different in size
        o = np.zeros((hh, ww), bool); o[:min(hh, a.shape[0]), :min(ww, a.shape[1])] = a[:hh, :ww]; return o
    lo = fit(lo)
    img = np.zeros((hh, ww, 4), float)
    img[inside] = (*BOARD, 255)
    def paint(mask, col, a=1.0):
        mask = fit(mask) & inside
        img[mask, :3] = img[mask, :3] * (1 - a) + np.array(col) * a
    paint(lo, lower, 0.20); paint(edge(lo, SS), lower, 0.75)
    paint(up, upper, 0.22); paint(edge(up, SS), upper, 0.95)
    if pads and 'mask' in files:
        paint(r('mask') & up, PAD)
    if 'silk' in files:
        paint(r('silk'), SILK)
    if 'drill' in files:
        holes = fit(r('drill', excellon=files.get('drill_excellon', False))) & inside
        img[holes] = (*PAPER, 255)
    out = edge(inside, 2 * SS)
    img[out] = (*EDGE, 255)
    im = Image.fromarray(img.astype('uint8'), 'RGBA')
    im = im.resize((ww // SS, hh // SS), Image.LANCZOS)
    if mirror: im = im.transpose(Image.FLIP_LEFT_RIGHT)   # a bottom layer, seen from below
    return im, b


def compose(name, items, out):
    """items: list of (key, files, kwargs, box). box = (x0, y0, x1, y1) as fractions of the frame; the board
    is scaled to fit its box and centred in it."""
    canvas = Image.new('RGBA', (W, H), (*PAPER, 255))
    info = {}
    for key, files, kw, (bx0, by0, bx1, by1) in items:
        (x0, y0), (x1, y1) = GerberFile.open(str(files['profile'])).bounding_box()
        sw, sh = x1 - x0 + 1.2, y1 - y0 + 1.2
        ppmm = min((bx1 - bx0) * W / sw, (by1 - by0) * H / sh)
        im, b = board(files, ppmm, **kw)
        x = bx0 * W + ((bx1 - bx0) * W - im.width) / 2
        y = by0 * H + ((by1 - by0) * H - im.height) / 2
        canvas.alpha_composite(im, (round(x), round(y)))
        # pixel = (mm - ox) * s for x, (oy - mm) * s for y, in this image's pixels
        # (a mirrored board: pixel x = (ox - mm) * s)
        mir = kw.get('mirror', False)
        info[key] = dict(s=round(ppmm, 4), ox=round((b[1][0] + x / ppmm) if mir else (b[0][0] - x / ppmm), 4), oy=round(b[1][1] + y / ppmm, 4), mirror=mir,
                         x0=round(x), y0=round(y), x1=round(x + im.width), y1=round(y + im.height))
        print(name, key, 'px/mm %.2f' % ppmm)
    # line art: a 64-colour palette keeps the PNG small without visible change
    canvas.convert('RGB').quantize(64, method=Image.MEDIANCUT, dither=Image.NONE).save(out / f'{name}.png', optimize=True)
    return dict(src=f'{name}.png', w=W, h=H, boards=info)


if __name__ == '__main__':
    pb, foc, el, out = (pathlib.Path(a) for a in sys.argv[1:5])
    P = lambda s: pb / f'Power Board_{s}.gbr'
    F = lambda s: foc / f'FoC Motor Controller-{s}'
    E1 = lambda s: el / 'hardware/power_board/Project Outputs for DC Electronic Load Power MOSFETS' / f'Power Electronics_{s}.gbr'
    E2 = lambda s: el / 'hardware/control_board/Project Outputs for DC Electronic Load Redemption Edition' / f'DC Load Control Board_{s}.gbr'
    alt = lambda g: dict(profile=g('Profile'), upper=g('Copper_Signal_Top'), lower=g('Copper_Signal_Bot'), mask=g('Soldermask_Top'),
                         silk=g('Legend_Top'), drill=g('PTH_Drill'))
    pbf = dict(profile=P('Profile'), upper=P('Copper_Signal_Top'), lower=P('Copper_Signal_Bot'), mask=P('Soldermask_Top'),
               silk=P('Legend_Top'), drill=pb / 'NC Drill/Power Board.TXT', drill_excellon=True)
    focf = dict(profile=F('Edge_Cuts.gm1'), upper=F('L1 (Sig, PWR).gtl'), lower=F('L6 (Sig, PWR).gbl'), mask=F('F_Mask.gts'),
                silk=F('F_Silkscreen.gto'), drill=F('PTH.drl'), drill_excellon=True)
    data = {
        'layout-pb': compose('layout-pb', [('pb', pbf, {}, (0.03, 0.08, 0.97, 0.88))], out),
        # outer layers large; the two inner signal / power layers beside them, one each
        # top, and bottom seen from below
        'layout-foc': compose('layout-foc', [('top', dict(focf, lower=None), {}, (0.03, 0.09, 0.49, 0.86)),
                                             ('bottom', dict(profile=F('Edge_Cuts.gm1'), upper=F('L6 (Sig, PWR).gbl'), lower=None, mask=F('B_Mask.gbs'),
                                                             silk=F('B_Silkscreen.gbo'), drill=F('PTH.drl'), drill_excellon=True), dict(upper=BLUE, mirror=True), (0.51, 0.09, 0.97, 0.86))], out),
        'layout-el': compose('layout-el', [('power', alt(E1), {}, (0.03, 0.09, 0.53, 0.86)), ('control', alt(E2), {}, (0.56, 0.09, 0.97, 0.86))], out),
    }
    (out / 'layouts.json').write_text(json.dumps(data, indent=1))
