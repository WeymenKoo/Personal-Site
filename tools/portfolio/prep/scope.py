"""Crop raw RIGOL DHO804 screenshots to the graticule and work out where the call-outs go.

The screenshots are the scope's own 1024 x 600 PNGs, untouched apart from the crop. The call-outs are not
drawn into the picture: this writes their positions (in cropped-image pixels) to scopes.json, and
tools/portfolio/build.js draws them over the picture as vector lines and text.

Positions come from the screen itself: time and voltage go through the scope's own scale (100 px per time
division, 51.75 px per volt division, centre at x 512 / y 300), and peaks are found on the trace's pixels.
The numbers in the labels come from each run's logged results, not from the picture.

  python3 scope.py <dir with the repos> <assets dir>
"""
import json, pathlib, sys
import numpy as np
from PIL import Image

SRC = pathlib.Path(sys.argv[1])
OUT = pathlib.Path(sys.argv[2])

GX0, GX1, GY0, GY1 = 12, 1012, 94, 506      # graticule
CX, CY, PX_T, PX_V = 512, 300, 100.0, 51.75  # centre, px per division
PANEL_X = 866                                 # left edge of the "Result" panel, when it is open

COLOUR = {  # trace colours on the DHO804 screen
    1: lambda r, g, b: (r > 170) & (g > 170) & (b < 140),
    2: lambda r, g, b: (r < 120) & (g > 170) & (b > 170),
    3: lambda r, g, b: (r > 170) & (g < 120) & (b > 170),
    4: lambda r, g, b: (r < 90) & (g > 90) & (g < 190) & (b > 200),
}


class Cap:
    def __init__(self, key, path, tdiv, delay, ch, panel=False, title='', legend=(), note=''):
        self.key, self.path = key, SRC / path
        self.im = Image.open(self.path).convert('RGB')
        self.a = np.asarray(self.im).astype(int)
        self.tdiv, self.delay, self.ch = tdiv, delay, ch   # ch: {n: (V/div, offset)}
        self.x1 = PANEL_X if panel else GX1
        self.marks, self.title, self.legend, self.note = [], title, list(legend), note

    # scope units -> raw pixels
    def X(self, t): return CX + (t - self.delay) / self.tdiv * PX_T
    def Y(self, n, v):
        vdiv, off = self.ch[n]
        return CY - (v + off) / vdiv * PX_V

    def trace(self, n, xa, xb):
        """(x, y) pixels of channel n's trace between raw x a and b"""
        y0, y1 = GY0 + 12, GY1 - 24   # skip the trigger markers on top and the time labels at the bottom
        r, g, b = (self.a[y0:y1, int(xa):int(xb), i] for i in range(3))
        ys, xs = np.nonzero(COLOUR[n](r, g, b))
        return xs + int(xa), ys + y0

    def extreme(self, n, xa, xb, top=True):
        xs, ys = self.trace(n, xa, xb)
        i = np.argmin(ys) if top else np.argmax(ys)
        return float(xs[i]), float(ys[i])

    def crossing(self, n, y, xa, xb, rising=True):
        """first x where the trace's median y passes y"""
        for x in range(int(xa), int(xb)):
            xs, ys = self.trace(n, x, x + 1)
            if len(ys) and ((np.median(ys) <= y) if rising else (np.median(ys) >= y)):
                return float(x)
        raise ValueError(f'{self.key}: no crossing of y={y}')

    def level(self, n, xa, xb):
        xs, ys = self.trace(n, xa, xb)
        return float(np.median(ys))

    # call-outs, in raw pixels (converted to crop pixels on save)
    def hline(self, y, text, side='r', dash=True, colour='mark'):
        self.marks.append(dict(t='hline', y=y, text=text, side=side, dash=dash, c=colour))
    def vline(self, x, text, colour='mark', at=0.06, al=None):
        self.marks.append(dict(t='vline', x=x, text=text, c=colour, at=at, al=al))
    def call(self, x, y, lx, ly, text, colour='mark', al=None):
        self.marks.append(dict(t='call', x=x, y=y, lx=lx, ly=ly, text=text, c=colour, al=al))
    def span(self, xa, xb, y, text, colour='mark'):
        self.marks.append(dict(t='span', x0=xa, x1=xb, y=y, text=text, c=colour))
    def vspan(self, x, ya, yb, text, colour='mark', side='r'):
        self.marks.append(dict(t='vspan', x=x, y0=ya, y1=yb, text=text, c=colour, side=side))
    def label(self, x, y, text, colour='mark', anchor='start'):
        self.marks.append(dict(t='label', x=x, y=y, text=text, c=colour, anchor=anchor))

    def save(self):
        crop = self.im.crop((GX0, GY0, self.x1, GY1))
        name = f'scope-{self.key}.png'
        crop.save(OUT / name, optimize=True)  # PIL writes no metadata chunks unless asked
        dx, dy = GX0, GY0
        def shift(m):
            m = dict(m)
            for k in ('x', 'lx', 'x0', 'x1'):
                if k in m: m[k] = round(m[k] - dx, 1)
            for k in ('y', 'ly', 'y0', 'y1'):
                if k in m: m[k] = round(m[k] - dy, 1)
            return m
        return dict(src=name, w=crop.width, h=crop.height, title=self.title, legend=self.legend,
                    note=self.note, marks=[shift(m) for m in self.marks])


caps = {}
PB = 'AeroDesign-Power-Board/bench_test/scope/'
FOC = 'FOC-Motor-Controller/Testing/'
EL = 'DC-Electronic-Load/bench_test/results/'

# ---------------- power board ----------------
# start-up at 12 V, no load (run 2026-11-21_235722, METRICS line in notes.txt)
c = Cap('pb-startup', PB + 'B3.4_12V_0A_opgd.png', 2.0, 8.0, {1: (10, 0), 2: (2, 0), 3: (2, 0), 4: (5, 0)}, panel=True,
        title='Start-up at 12 V, no load',
        legend=[(1, 'VIN', '10 V/div'), (2, 'VBUCK_OUT', '2 V/div'), (3, '5V_PROT', '2 V/div'), (4, 'OPGD', '5 V/div')],
        note='2 ms/div · + lead touched on by hand, as a battery plug-in')
x10 = c.crossing(2, c.Y(2, 0.1 * 5.03), c.X(3.0), c.X(9.0))
x90 = c.crossing(2, c.Y(2, 0.9 * 5.03), c.X(3.0), c.X(10.0))
c.vline(c.X(0), 'power applied', at=0.45)
c.span(x10, x90, c.Y(2, -3.2), 'buck soft-start 2.95 ms (10–90 %)')
c.call(c.crossing(3, c.Y(3, 2.5), c.X(7), c.X(11)), c.Y(3, 2.5), c.X(7.8), c.Y(3, -5.6), '5V_PROT on, after the buck', al='end')
c.call(c.X(10.95), c.Y(4, 2.6), c.X(13.6), c.Y(4, 9.5), 'OPGD high at 10.95 ms', al='end')
caps[c.key] = c

# load step 0.1 -> 1.8 A at 7.4 V (run 2026-11-22_014316, RESULTS line)
c = Cap('pb-loadstep', PB + 'B3.19_loadstep_7.4V_load.png', 100.0, 400.0, {2: (0.05, 0), 3: (0.05, 0), 4: (0.1, 0)}, panel=True,
        title='Load step 0.1 → 1.8 A at 7.4 V in',
        legend=[(2, 'VBUCK_OUT', '50 mV/div AC'), (3, '5V_PROT', '50 mV/div AC'), (4, 'SRV_Isns', '100 mV/div AC')],
        note='100 µs/div · 16 averages · the DC load\'s square wave as the step')
xm, ym = c.extreme(3, c.X(0), c.X(150), top=False)
c.call(xm, ym, c.X(130), c.Y(3, -0.15), '5V_PROT dip 172 mV, no ringing')
c.hline(c.level(3, c.X(500), c.X(700)), '37 mV steady drop: 23.5 mΩ after the feedback point', side='r', colour='dim')
c.call(c.X(2), c.Y(4, 0.05), c.X(60), c.Y(4, 0.2) - 6, 'current step, 1.54 A (SRV_Isns)')
c.span(c.X(0), c.X(198), c.Y(2, 0.29), 'back within 10 mV in 198 µs')
caps[c.key] = c

# hot-plug at 16.8 V (run 2026-11-22_001301)
c = Cap('pb-hotplug', PB + 'B3.6_hotplug_16.8V.png', 2.0, 6.0, {1: (10, 0)}, panel=True,
        title='Hot-plug at 16.8 V (4S, full charge)',
        legend=[(1, 'VIN', '10 V/div, full bandwidth')],
        note='2 µs/div · live supply lead touched on, no load')
c.hline(c.Y(1, 30), '30 V: absolute max of U4 and the input FETs', side='r')
xp, yp = c.extreme(1, c.X(0), c.X(4))
c.call(xp, yp, c.X(-2.0), c.Y(1, 25), '30.5 V peak, 1.8 × VIN', colour='bad', al='start')
c.label(c.X(5.0), c.Y(1, -6), 'leads (≈ 0.9 µH) ring against 1 µF of ceramics at ≈ 2 MHz')
caps[c.key] = c

# servo output short circuit at 22 V, run 2 (CH2 at 5 V/div)
c = Cap('pb-short', PB + 'B4.6_short_22V_full_r2.png', 100.0, 400.0, {1: (10, 0), 2: (5, 0), 3: (2, 0), 4: (2, 0)}, panel=True,
        title='Servo rail shorted at 22 V in',
        legend=[(1, 'VIN', '10 V/div'), (2, 'VBUCK_OUT', '5 V/div'), (3, '5V_PROT', '2 V/div'), (4, 'OPGD', '2 V/div')],
        note='100 ms/div · hard short across a servo header · peaks read off the screen (±0.3 V)')
c.hline(c.Y(2, 10), '10 V rating of C17–C21', side='r', colour='bad')
c.hline(c.Y(2, 7.93), '7.93 V: U1 over-voltage', side='r', colour='dim')
c.call(c.X(2), c.Y(2, 9.3), c.X(14), c.Y(2, 16.6), 'first trip: VBUCK_OUT to ≈ 9.3 V')
c.label(c.X(95), c.Y(2, 13.4), '5 retries: 11.3 / 11.0 / 10.4 / 9.6 / 10.7 V, then latched off')
c.call(c.X(520), c.Y(2, 5.1), c.X(560), c.Y(2, 2.3), 'bleeds back to 5.07 V')
caps[c.key] = c

# switch node rising edge, 22 V / 1.9 A, 1.25 GSa/s
c = Cap('pb-sw', PB + 'B3.8_sw_rise_22V_1A9_1G25.png', 10.0, 0.0, {2: (10, 0)}, panel=True,
        title='Switch node, rising edge, 22 V in / 1.9 A',
        legend=[(2, 'SW', '10 V/div')], note='10 ns/div · 1.25 GSa/s · 70 MHz scope, so the peak is a minimum')
c.hline(c.Y(2, 30), '30 V FET rating', side='r', colour='dim')
xp, yp = c.extreme(2, c.X(0), c.X(15))
c.call(xp, yp, xp - 40, yp + 30, '23.4 V peak: 22 % margin', al='end')
caps[c.key] = c

# ---------------- FOC motor controller ----------------
for key, f, idr, vmin, edge in [('foc-id15', 'ID15_fall.png', '1000 / 2000 mA (driver default)', '−10.0 V', '7.1 ns'),
                                 ('foc-id7', 'ID7_fall.png', '190 / 380 mA (now the default)', '−0.76 V', '18.4 ns')]:
    c = Cap(key, FOC + 'Bench/char/B4neg/20261122_202344/' + f, 0.05, 0.0, {1: (10, -10), 2: (0.2, -1.75)},
            title=f'Low-side turn-on, gate drive {idr}',
            legend=[(1, 'Phase A switch node', '10 V/div'), (2, 'Phase A current sense', '200 mV/div')],
            note='50 ns/div · 30 V bus · phase A sinking 3 A')
    c.hline(c.Y(1, -7), '−7 V: DRV8323 SHx abs max', side='l', colour='bad')
    xm, ym = c.extreme(1, c.X(-0.01), c.X(0.1), top=False)
    c.call(xm, ym, xm + 110, c.Y(1, -17.5), f'{vmin}', colour='bad' if key == 'foc-id15' else 'good')
    c.label(c.X(-0.21), c.Y(1, 36.5), f'edge {edge} (10–90 %)')
    caps[c.key] = c

c = Cap('foc-vds', FOC + 'Bench/char/F2/20261122_214445/ceil22_3.png', 200.0, 0.0, {1: (10, -10), 2: (0.5, -1.65)},
        title='Short-circuit protection: DRV8323 VDS trip',
        legend=[(1, 'Phase A switch node', '10 V/div'), (2, 'Phase A current sense', '500 mV/div, 60 mV/A')],
        note='200 µs/div · 30 V bus · VDS_LVL 0.06 V · firmware ceiling set to 22 A')
xs, ys = c.extreme(2, c.X(-120), c.X(-10))
c.call(xs, ys, c.X(-900), c.Y(2, 3.05), 'current ramps ≈ 1.8 A per PWM period', al='start')
c.vline(c.X(-20), 'driver trips first: 21.75 A', at=0.75, al='end')
caps[c.key] = c

c = Cap('foc-hotplug', FOC + 'Simulation/01_hot_plug/bench/hotplug4_screen.png', 50.0, 200.0, {1: (5, -20)},
        title='Hot-plug into a live 30 V supply',
        legend=[(1, 'Bus (C34)', '5 V/div')], note='50 ms/div · XT60 plugged in by hand · ≈ 360 µF bus')
xp, yp = c.extreme(1, c.X(50), c.X(390))
c.call(c.X(220), c.Y(1, 30.13), c.X(250), c.Y(1, 22.5), '30.13 V peak, no overshoot')
c.call(c.X(1), c.Y(1, 23.3), c.X(40), c.Y(1, 13), '23.3 V at 1 ms, then τ = 6.2 ms to 29.9 V')
caps[c.key] = c

# ---------------- DC electronic load ----------------
c = Cap('el-step', EL + '2026-11-21_202523_p3_5_step_5V/step_rise_20us.png', 20.0, 60.0,
        {1: (0.05, -0.03585), 2: (0.05, -0.05941), 3: (0.5, -3.57), 4: (0.5, -3.56)}, panel=True,
        title='Load step 0.1 → 1.8 A, 5 V source',
        legend=[(1, 'Source 2 (FET Q2)', '50 mV/div'), (2, 'Source 1 (FET Q1)', '50 mV/div'), (3, 'Gate 1', '500 mV/div'), (4, 'Gate 2', '500 mV/div')],
        note='20 µs/div · 16 averages · each FET\'s current through its own 0.2 Ω pair')
lo, hi = c.level(2, c.X(-20), c.X(-5)), c.level(2, c.X(60), c.X(110))
y10, y90 = lo + 0.1 * (hi - lo), lo + 0.9 * (hi - lo)
xa, xb = c.crossing(2, y10, c.X(-10), c.X(40)), c.crossing(2, y90, c.X(-10), c.X(60))
c.span(xa, xb, hi - 30, '11.6 µs (10–90 %)')
c.label(c.X(22), hi + 48, '0.4 % overshoot, no ringing')
caps[c.key] = c

c = Cap('el-vsen', EL + '2026-11-21_185734_p3_7_vsen/vsen_up_20V.png', 1.0, 0.0, {1: (2, 0), 2: (2, 0), 3: (2, 0), 4: (2, 0)}, panel=True,
        title='Voltage readback, source at 20 V',
        legend=[(1, '4.096 V reference', '2 V/div'), (2, 'DUT_VSEN', '2 V/div'), (3, 'Gate 1', '2 V/div'), (4, 'Gate 2', '2 V/div')],
        note='1 ms/div · load off')
c.call(c.X(-3.2), c.level(2, c.X(-4), c.X(-2)), c.X(-2.9), c.Y(2, 5.6), 'DUT_VSEN latched at 3.96 V', colour='bad')
c.hline(c.Y(2, 2.0), 'should read 0.1 × 20 V = 2.0 V', side='r', colour='good')
caps[c.key] = c

if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    data = {k: v.save() for k, v in caps.items()}
    (OUT / 'scopes.json').write_text(json.dumps(data, indent=1, ensure_ascii=False))
    print(len(data), 'captures ->', OUT)
