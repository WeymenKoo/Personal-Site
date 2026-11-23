"""Power board layout figure from the per-layer textures made for the Blender renders
(~/Claude/renders/fc_pb/tex_stack/pb_L*.png, 40 px/mm, copper = the dark pixels).
L1 (power, top) in red, on the same dark board as the other layout plots.

  python3 pb_layout.py <tex_stack dir> <out.jpg>
"""
import sys, pathlib
import numpy as np
from PIL import Image

src, out = pathlib.Path(sys.argv[1]), sys.argv[2]
def copper(n):
    a = np.asarray(Image.open(src / f'pb_L{n}.png').convert('RGB')).astype(int)
    return a.sum(2) < np.median(a.sum(2)[a.sum(2) > 0]) * 0.75 if n != 1 else a[:, :, 0] < 180

l1 = copper(1)
H, W = l1.shape
img = np.zeros((H, W, 3), float); img[:] = (30, 32, 37)
for m, col, al in [(l1, (230, 50, 50), 0.85)]:
    img[m] = img[m] * (1 - al) + np.array(col) * al
im = Image.fromarray(img.astype('uint8'))
pad = 40
canvas = Image.new('RGB', (W + 2 * pad, H + 2 * pad), (17, 18, 21)); canvas.paste(im, (pad, pad))
canvas.thumbnail((2400, 2400)); canvas.save(out, quality=90)
print(out, canvas.size)
