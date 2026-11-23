"""Plot the DC load's Gerbers as a layout figure: dark board, L1 red over the bottom layer blue,
pads light, outline grey. Same look as the FOC / SoM 'all signal layers' renders.

  python3 gerber_plot.py <DC-Electronic-Load repo> <out dir>
"""
import io, sys, pathlib
import cairosvg
from PIL import Image, ImageChops
from gerbonara import GerberFile

PPMM = 24  # px per mm
BG = (17, 18, 21)
BOARD = (30, 32, 37)
TOP = (230, 50, 50)
BOT = (70, 110, 255)
PAD = (225, 225, 230)


def mask(path, bounds):
    g = GerberFile.open(path)
    svg = str(g.to_svg(force_bounds=bounds, fg='black', bg='white'))
    png = cairosvg.svg2png(bytestring=svg.encode(), output_width=int((bounds[1][0] - bounds[0][0]) * PPMM))
    im = Image.open(io.BytesIO(png)).convert('RGBA')
    flat = Image.new('RGBA', im.size, 'white')
    flat.alpha_composite(im)  # cairosvg ignores the svg's CSS background: flatten onto white
    return ImageChops.invert(flat.convert('L'))  # copper = 255


def board(folder, prefix, out, margin=1.0):
    f = lambda s: str(folder / f'{prefix}_{s}.gbr')
    (x0, y0), (x1, y1) = GerberFile.open(f('Profile')).bounding_box()
    bounds = ((x0 - margin, y0 - margin), (x1 + margin, y1 + margin))
    top, bot, prof = mask(f('Copper_Signal_Top'), bounds), mask(f('Copper_Signal_Bot'), bounds), mask(f('Profile'), bounds)
    pth = mask(f('PTH_Drill'), bounds)
    W, H = top.size
    img = Image.new('RGB', (W, H), BG)
    # board body: fill the profile's bounding box (the boards are rectangles)
    m = int(margin * PPMM)
    img.paste(BOARD, (m, m, W - m, H - m))
    def lay(colour, msk, alpha):
        layer = Image.new('RGB', (W, H), colour)
        img.paste(Image.composite(layer, img, msk.point(lambda v: int(v * alpha))), (0, 0))
    lay(BOT, bot, 0.80)
    lay(TOP, top, 0.85)
    lay(BG, prof, 1.0)  # outline and the heatsink window read as cut-outs
    lay((10, 10, 12), pth, 1.0)
    img.save(out, quality=90)
    print(out, img.size, 'bounds', bounds)
    return bounds


if __name__ == '__main__':
    repo, outdir = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
    hw = repo / 'hardware'
    board(hw / 'power_board/Project Outputs for DC Electronic Load Power MOSFETS', 'Power Electronics', outdir / 'el-power-layout.jpg')
    board(hw / 'control_board/Project Outputs for DC Electronic Load Redemption Edition', 'DC Load Control Board', outdir / 'el-control-layout.jpg')
