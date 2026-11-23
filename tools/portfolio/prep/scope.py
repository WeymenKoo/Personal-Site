"""Scope captures for the portfolio: the RIGOL DHO804's own 1024 x 600 screenshots, whole and unedited
(re-saved only to drop any metadata), plus where each call-out goes.

The call-outs are not drawn into the picture: this writes their positions (in screenshot pixels) to
scopes.json, and tools/portfolio/build.js draws them over the picture as vector lines and text.
Positions come from the screen itself: time and voltage go through the scope's own scale (100 px per
time division, 51.75 px per volt division, centre at x 512 / y 300), and edges and peaks are found on
the trace's pixels. The numbers in the labels come from each run's logged results, not from the picture.

Only captures that show a performance figure are here (start-up, transient response, ripple, switching,
step response); fault and debug captures stay in the project repos.

  python3 scope.py <dir with the repos> <assets dir>
"""
import json, pathlib, sys
import numpy as np
from PIL import Image

SRC = pathlib.Path(sys.argv[1])
OUT = pathlib.Path(sys.argv[2])

GX0, GX1, GY0, GY1 = 12, 1012, 94, 506      # graticule
CX, CY, PX_T, PX_V = 512, 300, 100.0, 51.75  # centre, px per division
PANEL_X = 850                                 # left edge of the "Result" panel, when it is open

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
        assert self.im.size == (1024, 600), (key, self.im.size)
        self.a = np.asarray(self.im).astype(int)
        self.tdiv, self.delay, self.ch = tdiv, delay, ch   # ch: {n: (V/div, offset)}
        self.xmax = PANEL_X if panel else GX1
        self.marks, self.title, self.legend, self.note = [], title, list(legend), note

    # scope units -> screenshot pixels
    def X(self, t): return CX + (t - self.delay) / self.tdiv * PX_T
    def Y(self, n, v):
        vdiv, off = self.ch[n]
        return CY - (v + off) / vdiv * PX_V

    def trace(self, n, xa, xb):
        """(x, y) pixels of channel n's trace between x a and b"""
        y0, y1 = GY0 + 12, GY1 - 24   # skip the trigger markers on top and the time labels at the bottom
        xa, xb = int(max(GX0 + 22, xa)), int(min(self.xmax, xb))
        r, g, b = (self.a[y0:y1, xa:xb, i] for i in range(3))
        ys, xs = np.nonzero(COLOUR[n](r, g, b))
        return xs + xa, ys + y0

    def extreme(self, n, xa, xb, top=True):
        xs, ys = self.trace(n, xa, xb)
        i = np.argmin(ys) if top else np.argmax(ys)
        return float(xs[i]), float(ys[i])

    def level(self, n, xa, xb):
        return float(np.median(self.trace(n, xa, xb)[1]))

    def crossing(self, n, y, xa, xb):
        """first x after a where the trace's median passes the level y, in either direction"""
        prev = None
        for x in range(int(xa), int(xb)):
            ys = self.trace(n, x, x + 1)[1]
            if not len(ys): continue
            cur = np.median(ys) - y
            if prev is not None and (cur == 0 or (cur < 0) != (prev < 0)): return float(x)
            prev = cur
        raise ValueError(f'{self.key}: no crossing of y={y}')

    def edge_10_90(self, n, before, after, xa, xb):
        """x of the 10 % and 90 % points of a step between the levels found in the windows before / after"""
        lo, hi = self.level(n, *before), self.level(n, *after)
        return self.crossing(n, lo + 0.1 * (hi - lo), xa, xb), self.crossing(n, lo + 0.9 * (hi - lo), xa, xb), lo, hi

    # call-outs
    def hline(self, y, text, side='r', colour='mark'):
        self.marks.append(dict(t='hline', y=y, text=text, side=side, c=colour, xmax=self.xmax))
    def vline(self, x, text, colour='mark', at=0.5, al=None):
        self.marks.append(dict(t='vline', x=x, text=text, c=colour, at=at, al=al))
    def call(self, x, y, lx, ly, text, colour='mark', al=None):
        self.marks.append(dict(t='call', x=x, y=y, lx=lx, ly=ly, text=text, c=colour, al=al))
    def span(self, xa, xb, y, text, colour='mark'):
        self.marks.append(dict(t='span', x0=xa, x1=xb, y=y, text=text, c=colour))
    def label(self, x, y, text, colour='mark', anchor='start'):
        self.marks.append(dict(t='label', x=x, y=y, text=text, c=colour, anchor=anchor))

    def save(self):
        name = f'scope-{self.key}.png'
        clean = Image.new('RGB', self.im.size); clean.paste(self.im)   # same pixels, no metadata chunks
        clean.save(OUT / name, optimize=True)
        r = lambda m: {k: (round(v, 1) if isinstance(v, float) else v) for k, v in m.items() if v is not None}
        return dict(src=name, w=1024, h=600, title=self.title, legend=self.legend, note=self.note,
                    marks=[r(m) for m in self.marks])


caps = {}
def add(c): caps[c.key] = c
PB = 'AeroDesign-Power-Board/bench_test/scope/'
FOC = 'FOC-Motor-Controller/Testing/'
EL = 'DC-Electronic-Load/bench_test/results/'

# ================= power board =================
# start-up at 12 V, no load (run 2026-11-21_235722, METRICS line in notes.txt)
c = Cap('pb-startup', PB + 'B3.4_12V_0A_opgd.png', 2.0, 8.0, {1: (10, 0), 2: (2, 0), 3: (2, 0), 4: (5, 0)}, panel=True,
        title='Start-up and sequencing',
        legend=[(1, 'VIN'), (2, 'VBUCK_OUT'), (3, '5V_PROT'), (4, 'OPGD')], note='12 V in, no load, battery-style plug-in')
x10 = c.crossing(2, c.Y(2, 0.1 * 5.03), c.X(3.0), c.X(9.0))
x90 = c.crossing(2, c.Y(2, 0.9 * 5.03), c.X(3.0), c.X(10.0))
c.span(x10, x90, c.Y(2, -3.2), 'soft-start 2.95 ms')
c.call(c.crossing(3, c.Y(3, 2.5), c.X(7), c.X(11)), c.Y(3, 2.5), c.X(7.8), c.Y(3, -5.8), '5V_PROT follows the buck', al='end')
c.call(c.X(10.95), c.Y(4, 2.6), c.X(13.6), c.Y(4, 9.5), 'power-good at 10.95 ms', al='end')
add(c)

# load step 0.1 -> 1.8 A at 7.4 V (run 2026-11-22_014316, RESULTS line)
c = Cap('pb-loadstep', PB + 'B3.19_loadstep_7.4V_load.png', 100.0, 400.0, {2: (0.05, 0), 3: (0.05, 0), 4: (0.1, 0)}, panel=True,
        title='Load transient, worst case',
        legend=[(2, 'VBUCK_OUT'), (3, '5V_PROT'), (4, 'load current')], note='7.4 V in, 0.1 to 1.8 A step, AC-coupled, 16 averages')
xm, ym = c.extreme(3, c.X(0), c.X(150), top=False)
c.call(xm, ym, c.X(130), c.Y(3, -0.15), '172 mV dip, no ringing')
c.span(c.X(0), c.X(198), c.Y(2, 0.035), 'within 10 mV in 198 µs')
c.call(c.X(8), c.Y(4, 0.17), c.X(300), c.Y(4, 0.31), '1.54 A step')
add(c)

# output ripple at 16.8 V / 1.9 A (run 2026-11-22_004508)
c = Cap('pb-ripple', PB + 'B3.10_vsrv_ripple_16V8_1A9.png', 2.0, 0.0, {2: (0.01, 0)}, panel=True,
        title='Output ripple',
        legend=[(2, '5V_PROT, AC-coupled')], note='16.8 V in, 1.9 A, 1x probe with ground spring, 20 MHz limit')
xa, ya = c.extreme(2, c.X(-7.2), c.X(-5.0)); xb, yb = c.extreme(2, c.X(-4.0), c.X(-1.6))
c.span(xa, xb, c.Y(2, 0.021), '3.24 µs: 308 kHz')
c.label(c.X(-9.6), c.Y(2, -0.021), '14.0 mVpp at the switching frequency')
add(c)

# switch node at 12 V / 1.9 A: frequency and duty (run 2026-11-22_002533)
c = Cap('pb-swfreq', PB + 'B3.7_sw_freq_12V_1A9.png', 1.0, 0.0, {1: (10, 0), 2: (5, 0), 3: (2, 0), 4: (5, 0)}, panel=True,
        title='Switching frequency',
        legend=[(2, 'switch node'), (1, 'VIN'), (3, '5V_PROT'), (4, 'OPGD')], note='12 V in, 1.9 A, continuous conduction')
xr1 = c.crossing(2, c.Y(2, 6), c.X(-3.6), c.X(-2.9)); xr2 = c.crossing(2, c.Y(2, 6), c.X(-0.4), c.X(0.4))
c.span(xr1, xr2, c.Y(2, 16.5), '308.8 kHz, fixed at every load')
c.label(c.X(-4.3), c.Y(2, -7.5), 'no pulse skipping from 0 to 1.9 A')
add(c)

# switch node rising edge, 22 V / 1.9 A, 1.25 GSa/s (run 2026-11-22_003027)
c = Cap('pb-swedge', PB + 'B3.8_sw_rise_22V_1A9_1G25.png', 10.0, 0.0, {2: (10, 0)}, panel=True,
        title='Switch-node stress',
        legend=[(2, 'switch node')], note='22 V in, 1.9 A, rising edge at 1.25 GSa/s')
c.hline(c.Y(2, 30), '30 V FET rating', side='l', colour='dim')
xp, yp = c.extreme(2, c.X(0), c.X(15))
c.call(xp, yp, c.X(-6), c.Y(2, 13), '23.4 V peak: 22 % margin', al='end')
add(c)

# ================= FOC motor controller =================
# high-side turn-on at the shipped gate drive (CHAR_LOG B4, IDRIVE 7)
c = Cap('foc-edge', FOC + 'Bench/char/B4/20261122_172801/ID7_rise.png', 0.05, 0.0, {1: (5, -15), 2: (0.2, -1.75)},
        title='Switching edge',
        legend=[(1, 'phase A switch node'), (2, 'current-sense output')], note='30 V bus, 3 A, gate drive 190 / 380 mA')
c.label(c.X(-0.215), c.Y(1, 22), 'rise 25.5 ns (10–90 %)')
xp, yp = c.extreme(1, c.X(0.02), c.X(0.12))
c.call(xp, yp, c.X(0.07), c.Y(1, 22), '+0.11 V overshoot')
add(c)

# one PWM period with the current-sense amplifier (CHAR_LOG B1, 3 A)
c = Cap('foc-pwm', FOC + 'Bench/char/B1/20261122_171957/I3A_period.png', 10.0, 0.0, {1: (5, -15), 2: (0.2, -1.75)},
        title='PWM and current sense',
        legend=[(1, 'phase A switch node'), (2, 'current-sense output')], note='30 V bus, phase A sourcing 3 A, rotor parked')
x1 = c.crossing(1, c.Y(1, 15), c.X(-41), c.X(-38)); x2 = c.crossing(1, c.Y(1, 15), c.X(-1), c.X(1))
c.span(x1, x2, c.Y(1, 7), '40 µs: 25 kHz')
c.label(c.X(-39), c.Y(2, 2.05), 'sense output settled in each low-side window')
add(c)

# bus ripple with the motor spinning (CHAR_LOG B5b, 2000 rpm)
c = Cap('foc-ripple', FOC + 'Bench/char/B5b/20261122_180144/steady_2000.png', 10.0, 0.0, {1: (0.1, 0), 2: (10, -20)},
        title='Bus ripple under load',
        legend=[(1, 'bus, AC-coupled'), (2, 'phase A switch node')], note='30 V bus, sensorless closed loop at 2000 rpm, 13.3 W')
c.label(c.X(-47), c.Y(1, 0.26), '67 mV p-p between edges on a 30 V bus')
add(c)

# back-EMF while coasting (CHAR_LOG BEMF, run 0)
c = Cap('foc-bemf', FOC + 'Bench/char/BEMF/20261122_205105/coast0.png', 2.0, 0.0, {1: (5, -15), 2: (5, -15)},
        title='Back-EMF, coasting',
        legend=[(1, 'phase A'), (2, 'phase B')], note='outputs off at 1000 rpm, phases float near the 30 V bus')
c.label(c.X(-9.3), c.Y(1, 17.5), 'line-to-line 3.04 V peak at 858 rpm')
c.label(c.X(-9.3), c.Y(1, 12.5), 'flux 1.396 mV·s, ±0.5 % over 3 runs')
add(c)

# ================= DC electronic load =================
S5 = EL + '2026-11-21_202523_p3_5_step_5V/'
CH = {1: (0.05, -0.03585), 2: (0.05, -0.05941), 3: (0.5, -3.57), 4: (0.5, -3.56)}
LEG = [(1, 'FET Q2 current'), (2, 'FET Q1 current'), (3, 'gate 1'), (4, 'gate 2')]
c = Cap('el-rise', S5 + 'step_rise_20us.png', 20.0, 60.0, CH, panel=True, title='Step response, rising',
        legend=LEG, note='0.1 to 1.8 A into a 5 V source, 16 averages')
xa, xb, lo, hi = c.edge_10_90(2, (c.X(-20), c.X(-6)), (c.X(60), c.X(100)), c.X(-10), c.X(60))
c.span(xa, xb, hi - 62, '≈ 12 µs')
c.label(c.X(18), hi + 50, 'overshoot ≤ 0.6 %, no ringing')
add(c)

c = Cap('el-fall', S5 + 'step_fall_20us.png', 20.0, 60.0, CH, panel=True, title='Step response, falling',
        legend=LEG, note='1.8 to 0.1 A into a 5 V source, 16 averages')
xa, xb, lo, hi = c.edge_10_90(2, (c.X(-20), c.X(-8)), (c.X(70), c.X(100)), c.X(-10), c.X(60))
c.span(xa, xb, lo - 34, '≈ 16 µs')
c.label(c.X(18), c.Y(2, 4.3), 'the two FETs move together')
add(c)

c = Cap('el-settle', S5 + 'step_rise_200us.png', 200.0, 600.0, CH, panel=True, title='Settling',
        legend=LEG, note='same step at 200 µs/div')
c.label(c.X(180), c.level(2, c.X(400), c.X(900)) + 46, 'within ±5 % in 12 µs, then flat')
add(c)

if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    data = {k: v.save() for k, v in caps.items()}
    (OUT / 'scopes.json').write_text(json.dumps(data, indent=1, ensure_ascii=False))
    print(len(data), 'captures ->', OUT)
