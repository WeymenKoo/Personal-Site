#!/usr/bin/env python3
"""
build_city.py: draws the title-screen skyline, dusk/assets/img/city-{dark,light}.png.

Drawn at 2400x285 "art pixels" and scaled 2x (nearest) to 4800x570, so every
art pixel is a 2x2 block on the page. The sky is transparent (the CSS gradient
shows through). It is one banner, not a tile: the page anchors it to the right
edge and never repeats it, so a narrower screen just crops more off the left.

The right half (art x >= X0) is what most screens see. Left to right in it:
  a low district (under the title text, so it's kept short) ·
  Marina Bay Sands (Singapore) · Pacific Central Station (Vancouver) ·
  Tokyo Tower · Elizabeth Tower (London) · Bitexco Financial Tower (Saigon) ·
  Transamerica Pyramid (SF) · Petronas Twin Towers (KL) · The Low Pass jazz club.
The left half is more of the district, for wide screens.

Also writes city-lights-a.png / -b.png: just the aviation obstruction lights, lit,
in two groups that site.css blinks out of step (lights on one building share a group).

Run:  python3 tools/city/build_city.py           (writes both PNGs)
      python3 tools/city/build_city.py --sos      (prints the SOS window coords for fx.js)
"""
import math
import random
import sys
from pathlib import Path

from PIL import Image, ImageFilter

W, H = 2400, 285
X0 = 1200            # the right half starts here; the landmarks are placed from it
SCALE = 2
GROUND = 262          # buildings stand on this row
OUT = Path(__file__).resolve().parents[2] / "dusk" / "assets" / "img"

# the SOS window (art pixels) on Petronas tower 1; fx.js multiplies by 2
SOS = (X0 + 999, 104)

PALETTES = {
    "dark": dict(
        far="#1c1140", far_hi="#26185a", far_win="#3c2a72",
        mid="#211552", mid_sh="#180e3e", mid_hi="#33246f", mid_win_off="#2c1e60",
        near="#0c0820", near_hi="#16102e", near_win="#c98a3c",
        win_warm="#ffd36e", win_cyan="#7ff3ff", win_pink="#ff8fd0", win_white="#efe4ff",
        petro="#4b4196", petro_rib="#a59cf0", petro_hi="#e6e1ff", petro_dk="#2c2466",
        trans="#3a2e78", trans_lit="#6b5cb8", trans_dk="#251a52", trans_win="#ffe2a0",
        bit="#2a2266", bit_fin="#5446a8", bit_led="#3ef2ff", bit_win="#9fe8ff",
        stone="#4a3c78", stone_hi="#7c6aa8", stone_dk="#2a2050", stone_win="#ffc46b",
        neon_pink="#ff3ea5", neon_cyan="#3ef2ff", neon_red="#ff4d5e", neon_yel="#ffd36e",
        neon_purple="#b46bff", av_off="#4a1426", brick="#2a1030", brick_hi="#3d1a45", awning_a="#ff3ea5", awning_b="#3ef2ff", door="#ffb860",
        holo_a="#ff3ea5", holo_b="#5a2fd0", holo_c="#3ef2ff",
        antenna="#2a2050", blink="#ff4d5e", tank="#1e1440",
        tt_red="#ff5a2a", tt_white="#ffe9d6", tt_dk="#7a2416", clock="#fff1c4", clock_hand="#2a2050", gilt="#ffd36e",
        mbs="#34307a", mbs_hi="#8f88e0", mbs_dk="#1f1a52", mbs_win="#ffd9a0", deck="#b9b2f0", deck_dk="#4b4196", palm="#3fd08a", pool="#3ef2ff",
        cable="#07040f",
        lamp_post="#100a24", lamp="#ffe2a8",
        walk="#140d2a", road="#08050f", tail="#ff4d5e", head="#fff3e0",
        glow_alpha=0.55,
        lit_prob=0.42,
    ),
    "light": dict(
        far="#b6a3d8", far_hi="#c2b0e0", far_win="#a693cc",
        mid="#8a7fc4", mid_sh="#7468b0", mid_hi="#9d93d0", mid_win_off="#7a70b8",
        near="#2d2350", near_hi="#3a2f66", near_win="#e0b060",
        win_warm="#ffe08a", win_cyan="#c8f6ff", win_pink="#ffc2e4", win_white="#f4eefb",
        petro="#8d86c8", petro_rib="#d8d3f5", petro_hi="#ffffff", petro_dk="#6a62a8",
        trans="#c9bfe6", trans_lit="#e8e1f8", trans_dk="#9b8fcf", trans_win="#8f84c0",
        bit="#5d56a0", bit_fin="#8c84c8", bit_led="#a8f0ff", bit_win="#bfe9ff",
        stone="#e3d6ea", stone_hi="#f7eef6", stone_dk="#a99ac6", stone_win="#6f6398",
        neon_pink="#e8408f", neon_cyan="#1fb8d0", neon_red="#e0404f", neon_yel="#e0a530",
        neon_purple="#8a52d8", av_off="#8a4a5a", brick="#4a2a5a", brick_hi="#5e3a70", awning_a="#e8408f", awning_b="#1fb8d0", door="#ffd08a",
        holo_a="#e8408f", holo_b="#6a4fd0", holo_c="#4fd0e8",
        antenna="#3a2f66", blink="#e0404f", tank="#3a2f66",
        tt_red="#e8502a", tt_white="#fbf3ea", tt_dk="#a83a20", clock="#fff8e0", clock_hand="#3a2f66", gilt="#d8a030",
        mbs="#9a94d0", mbs_hi="#e4e0fa", mbs_dk="#6a62a8", mbs_win="#6f66a8", deck="#f4f0ff", deck_dk="#8d86c8", palm="#2f9a6a", pool="#4fd0e8",
        cable="#241a44",
        lamp_post="#241a44", lamp="#fff0c8",
        walk="#3a2f66", road="#2a2150", tail="#e0404f", head="#fff7e8",
        glow_alpha=0.28,
        lit_prob=0.16,
    ),
}

# 3x5 pixel font for the neon signs
FONT = {
    "A": ["010", "101", "111", "101", "101"], "B": ["110", "101", "110", "101", "110"],
    "C": ["011", "100", "100", "100", "011"], "E": ["111", "100", "110", "100", "111"],
    "F": ["111", "100", "110", "100", "100"], "I": ["111", "010", "010", "010", "111"],
    "K": ["101", "101", "110", "101", "101"], "L": ["100", "100", "100", "100", "111"],
    "N": ["101", "111", "111", "111", "101"], "O": ["010", "101", "101", "101", "010"],
    "P": ["110", "101", "110", "100", "100"], "R": ["110", "101", "110", "101", "101"],
    "S": ["011", "100", "010", "001", "110"], "T": ["111", "010", "010", "010", "010"],
    "W": ["101", "101", "111", "111", "101"], "0": ["111", "101", "101", "101", "111"],
    "1": ["010", "110", "010", "010", "111"], "J": ["001", "001", "001", "101", "010"],
    "Z": ["111", "001", "010", "100", "111"], "V": ["101", "101", "101", "101", "010"], "-": ["000", "000", "111", "000", "000"],
    " ": ["000", "000", "000", "000", "000"],
}


def hexc(h, a=255):
    h = h.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)


class Canvas:
    def __init__(self, pal):
        self.p = pal
        self.img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        self.px = self.img.load()
        self.glow = []          # (x, y, colour) neon pixels to haloed later
        self.lights = []        # (x, y, group) aviation lights; drawn unlit here, lit in the overlay layers

    def c(self, role):
        return hexc(self.p[role]) if isinstance(role, str) and not role.startswith("#") else hexc(role)

    def dot(self, x, y, role, glow=False):
        if 0 <= y < H and 0 <= x < W:
            col = self.c(role)
            self.px[x, y] = col
            if glow:
                self.glow.append((x, y, col))

    def rect(self, x0, y0, x1, y1, role, glow=False):
        """x1/y1 exclusive; clipped to the banner."""
        for y in range(max(0, y0), min(H, y1)):
            for x in range(x0, x1):
                self.dot(x, y, role, glow)

    def hline(self, x0, x1, y, role, glow=False):
        self.rect(x0, y, x1, y + 1, role, glow)

    def vline(self, x, y0, y1, role, glow=False):
        self.rect(x, y0, x + 1, y1, role, glow)

    def light(self, x, y, group="a"):
        """An aviation obstruction light: an unlit red lens in the city, a lit one in the blink layer."""
        self.dot(x, y, "av_off")
        if 0 <= y < H and 0 <= x < W:
            self.lights.append((x, y, group))

    def light_layers(self):
        """One transparent PNG per blink group: the lit lenses and their halo. CSS blinks them."""
        live = [(x, y, g) for x, y, g in self.lights if self.px[x, y] == self.c("av_off")]
        out = {}
        for group in sorted({g for _, _, g in live}):
            lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            lp = lay.load()
            mine = [(x, y) for x, y, g in live if g == group]
            for x, y in mine:
                lp[x, y] = hexc("#ff2a3a")
            halo = lay.filter(ImageFilter.GaussianBlur(2.2))
            halo.putalpha(halo.getchannel("A").point(lambda v: min(210, int(v * 6)) // 42 * 42))
            hp = halo.load()
            for x, y in mine:                          # a small plus of lit lens, bright core
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    if 0 <= y + dy < H and 0 <= x + dx < W:
                        hp[x + dx, y + dy] = hexc("#ff3040", 230)
                hp[x, y] = hexc("#ffb0a8")
            out[group] = halo.resize((W * SCALE, H * SCALE), Image.NEAREST)
        return out

    def text(self, s, x, y, role, glow=True):
        for ch in s:
            g = FONT[ch]
            for r, row in enumerate(g):
                for k, b in enumerate(row):
                    if b == "1":
                        self.dot(x + k, y + r, role, glow)
            x += 4
        return x

    def finish(self):
        """Neon halo: blur the neon pixels, lay them under the crisp ones."""
        # only neon still visible glows: anything later drawn over it is dropped
        self.glow = [(x, y, col) for x, y, col in self.glow if self.px[x, y] == col]
        if self.glow:
            g = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            gp = g.load()
            for x, y, col in self.glow:
                gp[x, y] = col
            halo = g.filter(ImageFilter.GaussianBlur(1.6))
            # boost and cap the halo alpha, then quantise it to a few steps (pixel-art glow, not airbrush)
            a = halo.getchannel("A").point(lambda v: min(255, int(v * 2.6 * self.p["glow_alpha"])) // 40 * 40)
            halo.putalpha(a)
            self.img = Image.alpha_composite(self.img, halo)
            self.px = self.img.load()
            for x, y, col in self.glow:
                self.px[x, y] = col
        return self.img.resize((W * SCALE, H * SCALE), Image.NEAREST)


# ----------------------------------------------------------------- pieces
def windows(cv, rnd, x0, y0, x1, y1, px=3, py=3, ww=2, wh=1, lit=None, off="mid_win_off",
            colours=("win_warm", "win_warm", "win_cyan", "win_white", "win_pink")):
    lit = cv.p["lit_prob"] if lit is None else lit
    for y in range(y0, y1 - wh + 1, py):
        for x in range(x0, x1 - ww + 1, px):
            role = rnd.choice(colours) if rnd.random() < lit else off
            cv.rect(x, y, x + ww, y + wh, role)


def antenna(cv, x, top, base, group="a"):
    cv.vline(x, top, base, "antenna")
    cv.light(x, top - 1, group)


def water_tank(cv, x, base):
    cv.rect(x, base - 5, x + 5, base - 1, "tank")
    cv.hline(x - 1, x + 6, base - 6, "tank")
    cv.dot(x, base - 1, "tank")
    cv.dot(x + 4, base - 1, "tank")


def far_layer(cv, rnd):
    x = 0
    while x < W:
        w = rnd.randint(14, 34)
        top = rnd.randint(118, 200)
        cv.rect(x, top, x + w, GROUND, "far")
        cv.vline(x, top, GROUND, "far_hi")
        for y in range(top + 3, GROUND - 4, 4):
            for xx in range(x + 2, x + w - 2, 3):
                if rnd.random() < 0.18:
                    cv.dot(xx, y, "far_win")
        if rnd.random() < 0.35:
            antenna(cv, x + w // 2, top - rnd.randint(4, 10), top, "b")
        else:
            cv.light(x + 1, top - 1, "b")
        x += w + rnd.randint(-4, 2)


def mid_tower(cv, rnd, x0, w, top, sign=None, tank=False, billboard=False):
    cv.rect(x0, top, x0 + w, GROUND, "mid")
    cv.rect(x0 + w - 2, top, x0 + w, GROUND, "mid_sh")
    cv.vline(x0, top, GROUND, "mid_hi")
    group = rnd.choice("ab")                 # lights on one building flash together
    # stepped crown
    roof, l, r = top, x0, x0 + w - 1
    if w > 14 and rnd.random() < 0.6:
        cv.rect(x0 + 3, top - 4, x0 + w - 3, top, "mid")
        cv.vline(x0 + 3, top - 4, top, "mid_hi")
        roof, l, r = top - 4, x0 + 3, x0 + w - 4
    windows(cv, rnd, x0 + 2, top + 3, x0 + w - 2, GROUND - 2)
    if tank:
        water_tank(cv, x0 + 3, top)
    elif rnd.random() < 0.6:
        antenna(cv, x0 + w // 2 + rnd.randint(-2, 2), top - rnd.randint(8, 18), roof, group)
    # corner obstruction lights on every roof
    cv.light(l, roof - 1, group)
    cv.light(r, roof - 1, group)
    if billboard:
        holo_billboard(cv, rnd, x0 + 2, top + 14, w - 4, 16)
    if sign:
        vertical_sign(cv, rnd, x0 + w - 1, top + 10, *sign)


def holo_billboard(cv, rnd, x, y, w, h):
    """Pink-to-cyan holo ad with rows of made-up glyphs."""
    bands = ["holo_b", "holo_b", "holo_a", "holo_b", "holo_c", "holo_b"]
    for i in range(h):
        cv.hline(x, x + w, y + i, bands[(i * len(bands)) // h], glow=False)
    cv.hline(x - 1, x + w + 1, y - 1, "neon_cyan", glow=True)
    cv.hline(x - 1, x + w + 1, y + h, "neon_cyan", glow=True)
    for gy in range(y + 3, y + h - 3, 5):
        gx = x + 2
        while gx < x + w - 4:
            for dy in range(3):
                for dx in range(3):
                    if rnd.random() < 0.55:
                        cv.dot(gx + dx, gy + dy, "win_white", glow=True)
            gx += 4


def vertical_sign(cv, rnd, x, y, length, role):
    """Hanging vertical sign: a frame with blocky pseudo-glyphs, VA-11 alley style."""
    cv.rect(x, y, x + 5, y + length, "near")
    cv.vline(x, y, y + length, role, glow=True)
    cv.vline(x + 4, y, y + length, role, glow=True)
    for gy in range(y + 1, y + length - 3, 4):
        for dy in range(3):
            for dx in range(1, 4):
                if rnd.random() < 0.6:
                    cv.dot(x + dx, gy + dy, role, glow=True)


# ------------------------------------------------------------- landmarks
def transamerica(cv, rnd, cx):
    """Transamerica Pyramid: tapering spire, the two 'wing' shafts, lit crown."""
    top, base_hw = 66, 16

    def hw(y):
        return max(1, round(1 + (base_hw - 1) * (y - top) / (GROUND - top)))

    for y in range(top, GROUND):
        h = hw(y)
        cv.hline(cx - h, cx, y, "trans_lit")       # lit face
        cv.hline(cx, cx + h + 1, y, "trans")       # shade face
        cv.dot(cx + h, y, "trans_dk")
    # windows: tiny 1px slits following the taper
    for y in range(top + 30, GROUND - 16, 3):
        h = hw(y)
        for x in range(cx - h + 2, cx + h - 1, 2):
            if rnd.random() < cv.p["lit_prob"] * 0.9:
                cv.dot(x, y, "trans_win")
            elif x >= cx:
                cv.dot(x, y, "trans_dk")
    # the wings (elevator east, stair/smoke tower west): vertical outer walls rising from
    # ~floor 29, standing proud of the taper, with a dark seam so the core still reads
    wing_base, wing_top = 150, 84
    for side in (-1, 1):
        edge = cx + side * (hw(wing_base) + 1)
        for y in range(wing_top, wing_base):
            core = cx + side * (hw(y) + 1)
            a, b = sorted((core, edge))
            cv.hline(a, b + 1, y, "trans_lit" if side < 0 else "trans")
            cv.dot(core, y, "trans_dk")                       # seam against the core
            if y % 4 == 0 and abs(edge - core) > 2:
                cv.dot(edge - side, y, "trans_win" if rnd.random() < .5 else "trans_dk")
        cv.vline(edge, wing_top, wing_base, "trans_dk" if side > 0 else "trans_lit")
        # slanted wing cap
        for i in range(abs(edge - (cx + side * (hw(wing_top) + 1))) + 1):
            cv.dot(edge - side * i, wing_top - 1, "trans_dk")
    # base: the legs / arcade
    for x in range(cx - base_hw + 2, cx + base_hw - 1, 4):
        cv.rect(x, GROUND - 10, x + 2, GROUND, "trans_dk")
    # crown, lit, and the aircraft light
    cv.vline(cx, 44, top + 1, "trans_lit")
    cv.vline(cx, 52, top + 1, "neon_yel", glow=True)
    cv.light(cx, 43, "a")
    cv.light(cx - hw(wing_top) - 4, wing_top - 2, "a")   # wing tops
    cv.light(cx + hw(wing_top) + 4, wing_top - 2, "a")
    cv.rect(cx - 1, top + 1, cx + 2, top + 4, "neon_yel", glow=True)


def petronas_tower(cv, rnd, x0, w=20):
    """One Petronas tower: setbacks, steel ribs, pinnacle."""
    cx = x0 + w // 2
    tiers = [(GROUND, 128, w), (128, 108, w - 2), (108, 92, w - 4), (92, 80, w - 8), (80, 70, w - 12),
             (70, 62, w - 15)]
    for y1, y0, tw in tiers:
        a = cx - tw // 2
        cv.rect(a, y0, a + tw, y1, "petro")
        cv.vline(a, y0, y1, "petro_hi")
        cv.vline(a + tw - 1, y0, y1, "petro_dk")
        for x in range(a + 2, a + tw - 1, 3):
            cv.vline(x, y0, y1, "petro_rib")
        # floor bands of lit windows between the ribs
        for y in range(y0 + 2, y1 - 1, 3):
            for x in range(a + 3, a + tw - 2, 3):
                if rnd.random() < cv.p["lit_prob"] + 0.15:
                    cv.dot(x, y, rnd.choice(["win_white", "win_cyan", "win_white"]))
        cv.hline(a, a + tw, y0, "petro_hi")
    # pinnacle: ball, then needle
    cv.rect(cx - 1, 55, cx + 1, 62, "petro_hi", glow=True)
    cv.vline(cx - 1, 34, 55, "petro_rib")
    cv.vline(cx - 1, 20, 34, "petro_hi")
    cv.light(cx - 1, 19, "a")
    cv.light(cx - 1, 40, "a")               # a second lens partway up the needle
    return cx


def petronas(cv, rnd, x0):
    a = x0
    b = x0 + 34
    petronas_tower(cv, rnd, a)
    petronas_tower(cv, rnd, b)
    # skybridge (levels 41-42) and its V legs
    cv.rect(a + 20, 150, b, 153, "petro")
    cv.hline(a + 20, b, 150, "petro_hi")
    for x in range(a + 21, b - 1, 2):
        cv.dot(x, 151, "win_cyan", glow=True)
    mid = (a + 20 + b) // 2
    for i in range(1, 11):
        cv.dot(mid - i * 7 // 10 - 1, 153 + i, "petro_rib")
        cv.dot(mid + i * 7 // 10, 153 + i, "petro_rib")
    # the SOS window sits on tower 1; make sure there's a window there
    cv.dot(SOS[0], SOS[1], "mid_win_off")
    cv.dot(SOS[0] + 1, SOS[1], "mid_win_off")


def bitexco(cv, rnd, cx):
    """Bitexco Financial Tower: lotus-bud bulge, slanted crown, cantilevered helipad."""
    bot, top = GROUND, 66

    def hw(y):
        t = (bot - y) / (bot - top)
        return 10 + 3.2 * math.sin(math.pi * t * 0.92) - 6.5 * t ** 2.4

    def crown(x):  # slanted cut, high on the left
        return top + round((x - (cx - 6)) * 0.8)

    for y in range(top - 6, bot):
        h = hw(min(max(y, top), bot))
        a, b = round(cx - h), round(cx + h)
        for x in range(a, b + 1):
            if y < crown(x):
                continue
            role = "bit_fin" if (x - a) % 3 == 0 else "bit"
            if x == b:
                role = "mid_sh"
            cv.dot(x, y, role)
        # LED outline on both curved edges
        if y >= crown(a):
            cv.dot(a, y, "bit_led", glow=True)
        if y >= crown(b) and y % 2 == 0:
            cv.dot(b, y, "bit_led", glow=True)
    for y in range(top + 6, bot - 4, 3):
        h = hw(y)
        for x in range(round(cx - h) + 2, round(cx + h) - 1, 3):
            if y > crown(x) + 2 and rnd.random() < cv.p["lit_prob"] + 0.1:
                cv.dot(x, y, "bit_win")
    # crown edge lit
    for x in range(round(cx - hw(top)), round(cx + hw(top)) + 1):
        cv.dot(x, crown(x), "bit_led", glow=True)
    # helipad on the east side, ~50th floor: a disc seen nearly edge-on
    hy = 116
    edge = round(cx + hw(hy))
    cv.rect(edge - 6, hy, edge + 15, hy + 2, "petro_rib")        # deck
    cv.rect(edge - 4, hy + 2, edge + 13, hy + 4, "petro_dk")      # rim
    for x in range(edge - 4, edge + 14, 3):
        cv.dot(x, hy + 2, "neon_yel", glow=True)                  # perimeter lights
    for i in range(10):                                           # under-truss back to the tower
        cv.dot(edge + 11 - i, hy + 4 + i // 2, "petro_dk")
    cv.vline(edge + 1, hy + 4, hy + 9, "petro_dk")
    cv.light(edge + 14, hy - 1, "a")
    antenna(cv, round(cx - 4), top - 14, crown(round(cx - 4)), "a")


def tokyo_tower(cv, rnd, cx):
    """Tokyo Tower: an open lattice in orange and white bands, two decks, Foot Town between the legs."""
    tip, mast, deck2, deck1 = 46, 92, 100, 166

    def hw(y):                                   # half-width of the lattice at row y
        if y < deck2:
            return 2
        return 2 + 24 * ((y - deck2) / (GROUND - deck2)) ** 2.2

    def band(y):
        return "tt_red" if ((y - tip) // 23) % 2 == 0 else "tt_white"

    cv.vline(cx, tip, mast - 14, "tt_white")                      # the antenna, stepping out toward the mast
    for y in range(mast - 14, mast):
        cv.hline(cx - 1, cx + 1, y, band(y))
    for y in range(mast, GROUND):
        h, role = round(hw(y)), band(y)
        lit = role == "tt_red"
        thick = 2 if y > deck1 else 1
        if y > GROUND - 24:                                       # the feet: four legs, the arch open between them
            for a in (cx - h, cx - h // 2 - 1, cx + h // 2 - 1, cx + h - thick):
                cv.hline(a, a + thick, y, role, glow=lit and a in (cx - h, cx + h - thick))
            continue
        cv.hline(cx - h, cx - h + thick, y, role, glow=lit)
        cv.hline(cx + h - thick + 1, cx + h + 1, y, role, glow=lit)
        if (y - mast) % 6 == 0:                                   # girders
            cv.hline(cx - h, cx + h + 1, y, role)
        elif h > 3:                                               # cross bracing
            f = ((y - mast) % 6) / 6
            for k in range(max(1, h // 5)):
                span = 2 * h / max(1, h // 5)
                xa = cx - h + k * span
                cv.dot(round(xa + span * f), y, "tt_dk" if not lit else role)
                cv.dot(round(xa + span * (1 - f)), y, "tt_dk" if not lit else role)
    for y0, y1, pad in ((deck2 - 3, deck2 + 1, 2), (deck1 - 4, deck1 + 3, 3)):   # the two observatories
        h = round(hw(y0)) + pad
        cv.rect(cx - h, y0, cx + h + 1, y1, "tt_white")
        cv.hline(cx - h, cx + h + 1, y1, "tt_dk")
        for x in range(cx - h + 1, cx + h, 2):
            cv.dot(x, y0 + 1, "win_warm", glow=True)
        cv.light(cx - h, y0 - 1, "b")
        cv.light(cx + h, y0 - 1, "b")
    cv.rect(cx - 11, GROUND - 13, cx + 12, GROUND, "near")        # Foot Town
    cv.hline(cx - 11, cx + 12, GROUND - 13, "near_hi")
    for x in range(cx - 9, cx + 10, 3):
        cv.dot(x, GROUND - 9, "near_win"); cv.dot(x, GROUND - 5, "win_warm")
    cv.light(cx, tip - 1, "b")


def elizabeth_tower(cv, rnd, cx):
    """Elizabeth Tower (Big Ben): stone shaft, the lit clock, belfry, and the stepped spire."""
    hw, top = 7, 172                                              # shaft half-width; top of the shaft
    cv.rect(cx - hw, top, cx + hw + 1, GROUND, "stone")
    cv.vline(cx - hw, top, GROUND, "stone_hi")
    cv.vline(cx + hw, top, GROUND, "stone_dk")
    for x in range(cx - hw + 2, cx + hw, 3):                      # the tall recessed panels
        cv.vline(x, top + 3, GROUND - 6, "stone_dk")
    for y in range(top + 8, GROUND - 10, 9):
        for x in range(cx - hw + 3, cx + hw, 3):
            if rnd.random() < cv.p["lit_prob"] * .6:
                cv.dot(x, y, "stone_win")
    cv.hline(cx - hw - 1, cx + hw + 2, GROUND - 5, "stone_hi")    # plinth
    # the clock stage, a little proud of the shaft
    c0, c1 = top - 19, top
    cv.rect(cx - hw - 1, c0, cx + hw + 2, c1, "stone")
    cv.hline(cx - hw - 2, cx + hw + 3, c1, "stone_hi")
    cv.hline(cx - hw - 2, cx + hw + 3, c0, "stone_hi")
    cv.vline(cx + hw + 1, c0, c1, "stone_dk")
    cy = c0 + 10
    for dy in range(-6, 7):
        for dx in range(-6, 7):
            d = dx * dx + dy * dy
            if d <= 30:
                cv.dot(cx + dx, cy + dy, "clock", glow=True)
            elif d <= 42:
                cv.dot(cx + dx, cy + dy, "gilt")
    cv.vline(cx, cy - 5, cy + 1, "clock_hand")                    # five o'clock
    for i in range(1, 4):
        cv.dot(cx + i, cy + i, "clock_hand")
    # belfry: arched openings
    b0 = c0 - 9
    cv.rect(cx - hw, b0, cx + hw + 1, c0, "stone")
    cv.hline(cx - hw - 1, cx + hw + 2, b0, "stone_hi")
    for x in range(cx - hw + 2, cx + hw, 3):
        cv.vline(x, b0 + 3, c0 - 1, "stone_dk")
    # the roof: a steep pyramid, the lantern, the upper spire and its finial
    for i in range(10):
        h = hw - i * 5 // 10
        cv.hline(cx - h, cx + h + 1, b0 - 1 - i, "stone_dk")
        cv.dot(cx - h, b0 - 1 - i, "stone")
    l0 = b0 - 15
    cv.rect(cx - 3, l0, cx + 4, b0 - 10, "stone")
    for x in (cx - 2, cx, cx + 2):
        cv.dot(x, l0 + 2, "gilt", glow=True)
    cv.hline(cx - 4, cx + 5, l0, "stone_hi")
    for i in range(9):
        h = max(0, 3 - i // 3)
        cv.hline(cx - h, cx + h + 1, l0 - 1 - i, "stone_dk")
    cv.vline(cx, l0 - 15, l0 - 9, "gilt")
    cv.light(cx, l0 - 16, "a")
    for x in (cx - hw - 1, cx + hw + 1):                          # corner pinnacles
        cv.vline(x, c0 - 4, c0, "stone_hi")


def marina_bay_sands(cv, rnd, x0):
    """Marina Bay Sands: three splayed hotel towers under the SkyPark, which overhangs at one end."""
    tw, gap, roof = 17, 9, 180
    for i in range(3):
        a = x0 + i * (tw + gap)
        for y in range(roof, GROUND):
            lean = round(5 * ((y - roof) / (GROUND - roof)) ** 1.6)   # the east slab leans out toward the ground
            cv.hline(a - lean, a + tw, y, "mbs")
            cv.dot(a - lean, y, "mbs_hi")
            cv.dot(a + tw - 1, y, "mbs_dk")
            if y > roof + 30 and lean:                                # the slot between the two slabs
                cv.dot(a + 5 - lean // 2, y, "mbs_dk")
        for y in range(roof + 4, GROUND - 6, 3):                      # room lights in floor bands
            for x in range(a + 2, a + tw - 2, 2):
                if rnd.random() < cv.p["lit_prob"] + .12:
                    cv.dot(x, y, "mbs_win")
    # the SkyPark: a long hull on top, bow overhanging past the last tower
    l, r = x0 - 6, x0 + 3 * tw + 2 * gap + 15
    cv.hline(l + 2, r - 1, roof - 5, "deck")
    cv.hline(l, r + 1, roof - 4, "deck")
    cv.hline(l + 1, r, roof - 3, "deck_dk")
    cv.hline(l + 3, r - 3, roof - 2, "deck_dk")
    for i in range(3):                                               # where it sits on each tower
        a = x0 + i * (tw + gap)
        cv.rect(a + 1, roof - 1, a + tw - 1, roof, "mbs_dk")
    for x in range(l + 6, r - 22, 5):                                # palms
        cv.dot(x, roof - 7, "palm"); cv.dot(x - 1, roof - 6, "palm"); cv.dot(x + 1, roof - 6, "palm")
    cv.hline(l + 8, r - 26, roof - 5, "pool", glow=True)             # the infinity pool
    cv.light(l, roof - 5, "b")
    cv.light(r, roof - 5, "b")


def pacific_central(cv, rnd, x0, w=130):
    """Pacific Central Station: long Beaux-Arts front, columned centre, the neon roof sign."""
    x1 = x0 + w
    roof = 218
    cv.rect(x0, roof, x1, GROUND, "stone")
    cv.hline(x0, x1, roof, "stone_hi")
    cv.hline(x0, x1, roof + 1, "stone_dk")
    cv.hline(x0, x1, GROUND - 3, "stone_hi")           # plinth line
    # wings: tall arched windows
    cx = x0 + w // 2
    pav = 26                                             # half-width of the centre pavilion
    for x in list(range(x0 + 4, cx - pav - 3, 7)) + list(range(cx + pav + 4, x1 - 5, 7)):
        role = "stone_win" if rnd.random() < cv.p["lit_prob"] + 0.35 else "stone_dk"
        cv.rect(x, roof + 8, x + 3, GROUND - 6, role)
        cv.dot(x + 1, roof + 7, role)
    # centre pavilion: taller, columns, attic
    cv.rect(cx - pav, roof - 8, cx + pav, GROUND, "stone")
    cv.hline(cx - pav - 1, cx + pav + 1, roof - 8, "stone_hi")
    cv.hline(cx - pav, cx + pav, roof - 3, "stone_dk")
    cv.rect(cx - pav + 3, roof + 1, cx + pav - 3, GROUND - 4, "stone_dk")    # deep porch
    for y in range(roof + 4, GROUND - 6, 4):
        for x in range(cx - pav + 4, cx + pav - 4, 2):
            if rnd.random() < 0.5:
                cv.dot(x, y, "stone_win")
    for x in range(cx - pav + 3, cx + pav - 3, 6):                          # columns
        cv.rect(x, roof + 1, x + 2, GROUND - 4, "stone_hi")
    cv.hline(cx - pav - 2, cx + pav + 2, GROUND - 4, "stone_hi")             # steps
    cv.hline(cx - pav - 4, cx + pav + 4, GROUND - 2, "stone_hi")
    # the neon sign on its rooftop frame
    words = "PACIFIC CENTRAL STATION"
    tw = len(words) * 4 - 1
    sx, sy = cx - tw // 2, roof - 20
    for lx in (sx + 6, sx + tw - 7, cx):
        cv.vline(lx, sy + 6, roof - 8, "antenna")
    cv.hline(sx - 1, sx + tw + 1, sy + 6, "antenna")
    cv.text(words, sx, sy, "neon_red")


def near_layer(cv, rnd, spans):
    """Low foreground blocks, cables, shopfront neon."""
    tops = []
    for x0, x1 in spans:
        x = x0
        while x < x1 - 8:
            w = min(rnd.randint(12, 26), x1 - x)
            top = GROUND - rnd.randint(18, 52)
            cv.rect(x, top, x + w, GROUND, "near")
            cv.vline(x, top, GROUND, "near_hi")
            for y in range(top + 4, GROUND - 6, 4):
                for xx in range(x + 2, x + w - 2, 3):
                    if rnd.random() < 0.22:
                        cv.dot(xx, y, "near_win")
            if rnd.random() < 0.4:
                water_tank(cv, x + 2, top)
            tops.append((x, x + w, top))
            x += w + rnd.randint(0, 3)
    # cables slung between neighbouring roofs
    for (a0, a1, at), (b0, b1, bt) in zip(tops, tops[1:]):
        if b0 - a1 > 14 or rnd.random() < 0.4:
            continue
        xa, xb, ya, yb = a1 - 1, b0 + 1, at + 3, bt + 3
        sag = rnd.randint(3, 7)
        for x in range(xa, xb + 1):
            t = (x - xa) / max(1, xb - xa)
            cv.dot(x, round(ya + (yb - ya) * t + sag * 4 * t * (1 - t)), "cable")
    return tops


def street(cv, rnd):
    cv.rect(0, GROUND, W, GROUND + 3, "walk")
    cv.rect(0, GROUND + 3, W, H, "road")
    for x in range(8, W, 54):
        cv.vline(x, GROUND - 13, GROUND, "lamp_post")
        cv.hline(x, x + 3, GROUND - 13, "lamp_post")
        cv.rect(x + 2, GROUND - 12, x + 4, GROUND - 11, "lamp", glow=True)
    for lane, roles in ((GROUND + 9, ("tail",)), (GROUND + 15, ("head",))):
        x = rnd.randint(0, 10)
        while x < W - 4:
            cv.dot(x, lane, roles[0], glow=roles[0] == "tail")
            cv.dot(x + 2, lane, roles[0], glow=roles[0] == "tail")
            x += rnd.choice([6, 9, 13, 17, 26])


# ------------------------------------------------------------------ jazz club
JAZZ = (X0 + 1064, 220, X0 + 1106, GROUND)         # art px: x0, y0, x1, y1 (the click target in fx.js)


def jazz_club(cv, rnd):
    """The Low Pass: a basement jazz club with a neon sign, an awning and the door open."""
    x0, y0, x1, y1 = JAZZ
    cv.rect(x0, y0, x1, y1, "brick")
    for y in range(y0 + 2, y1, 3):                                   # brick courses
        off = 0 if (y // 3) % 2 else 2
        for x in range(x0 + off, x1, 4):
            cv.dot(x, y, "brick_hi")
    cv.hline(x0 - 1, x1 + 1, y0, "brick_hi")
    cv.hline(x0 - 1, x1 + 1, y0 + 1, "near")
    # sign board: JAZZ and a neon sax
    cv.rect(x0 + 2, y0 + 4, x0 + 21, y0 + 13, "near")
    cv.text("JAZZ", x0 + 3, y0 + 6, "neon_yel")
    sax = ["..##", "..#.", "..#.", "..#.", "#.#.", "#.#.", "##.."]
    for r, row in enumerate(sax):
        for k, b in enumerate(row):
            if b == "#":
                cv.dot(x0 + 24 + k, y0 + 5 + r, "neon_pink", glow=True)
    cv.dot(x0 + 28, y0 + 4, "neon_pink", glow=True)
    # LIVE marquee
    cv.rect(x0 + 29, y0 + 6, x0 + 41, y0 + 13, "near")
    for i in range(0, 11, 2):
        cv.dot(x0 + 30 + i, y0 + 7, "win_warm", glow=True)
        cv.dot(x0 + 30 + i, y0 + 12, "win_warm", glow=True)
    cv.dot(x0 + 32, y0 + 9, "neon_cyan", glow=True); cv.dot(x0 + 35, y0 + 10, "neon_cyan", glow=True)
    cv.dot(x0 + 38, y0 + 9, "neon_cyan", glow=True)
    # round windows, warm inside
    for wx in (x0 + 5, x0 + 34):
        cv.rect(wx, y0 + 18, wx + 4, y0 + 22, "door")
        cv.dot(wx, y0 + 18, "brick"); cv.dot(wx + 3, y0 + 18, "brick")
        cv.dot(wx, y0 + 21, "brick"); cv.dot(wx + 3, y0 + 21, "brick")
    # striped awning over the door, and the door spilling light
    for i, x in enumerate(range(x0 + 12, x1 - 12)):
        cv.vline(x, y0 + 16, y0 + 19, "awning_a" if (i // 2) % 2 else "awning_b", glow=True)
    cv.rect(x0 + 16, y0 + 22, x1 - 16, y1, "door")
    cv.rect(x0 + 18, y0 + 24, x0 + 20, y1, "brick")                 # someone in the doorway
    cv.dot(x0 + 18, y0 + 23, "brick"); cv.dot(x0 + 19, y0 + 23, "brick")


# ------------------------------------------------------------------ scene
def district(cv, rnd, x0, x1, lo, hi, signs=.35):
    """Fill x0..x1 with mid towers whose roofs sit between rows lo and hi."""
    x = x0
    while x < x1 - 12:
        w = min(rnd.randint(14, 26), x1 - x)
        mid_tower(cv, rnd, x, w, rnd.randint(lo, hi),
                  sign=(rnd.randint(24, 40), rnd.choice(["neon_pink", "neon_cyan", "neon_purple", "neon_red"]))
                  if rnd.random() < signs else None,
                  tank=rnd.random() < .25, billboard=w > 20 and rnd.random() < .5)
        x += w + rnd.randint(1, 5)


def draw(theme):
    """Right-anchored on the page: the low district sits under the title, the towers rise to its right."""
    cv = Canvas(PALETTES[theme])
    rnd = random.Random(2026)            # same layout for both themes
    X = X0

    far_layer(cv, rnd)

    # the left half: more city for wide screens, no landmarks
    district(cv, rnd, 0, 330, 150, 205)
    district(cv, rnd, 336, 760, 118, 198)
    district(cv, rnd, 766, X, 142, 205)

    district(cv, rnd, X, X + 312, 160, 205)          # under the title: kept low
    district(cv, rnd, X + 556, X + 582, 150, 196)
    district(cv, rnd, X + 646, X + 678, 150, 198)
    district(cv, rnd, X + 704, X + 740, 150, 196)
    district(cv, rnd, X + 784, X + 868, 140, 190)
    district(cv, rnd, X + 916, X + 986, 150, 196)
    district(cv, rnd, X + 1050, X + 1200, 132, 190)

    marina_bay_sands(cv, rnd, X + 328)
    tokyo_tower(cv, rnd, X + 613)
    elizabeth_tower(cv, rnd, X + 691)
    bitexco(cv, rnd, X + 760)
    transamerica(cv, rnd, X + 895)
    petronas(cv, rnd, X + 990)

    near_layer(cv, rnd, [(0, X + 312), (X + 556, X + 582), (X + 648, X + 678), (X + 704, X + 742),
                         (X + 778, X + 868), (X + 918, X + 986), (X + 1046, X + 1200)])
    pacific_central(cv, rnd, X + 420)
    jazz_club(cv, rnd)

    # shopfront neon on the near layer
    for word, x, y, role in (("BAR", X + 140, 238, "neon_pink"), ("OPEN", X + 270, 232, "neon_cyan"),
                             ("NOOK", X + 654, 236, "neon_purple"), ("WK-01", X + 930, 240, "neon_yel"),
                             ("BAR", X + 1150, 238, "neon_cyan"),
                             ("OPEN", 180, 236, "neon_pink"), ("BAR", 520, 238, "neon_cyan"), ("NOOK", 900, 234, "neon_yel")):
        cv.rect(x - 2, y - 2, x + len(word) * 4 + 1, y + 7, "near")
        cv.text(word, x, y, role)
    for x, y, n, role in ((X + 60, 214, 30, "neon_red"), (X + 250, 206, 36, "neon_pink"),
                          (X + 668, 208, 30, "neon_pink"), (X + 800, 210, 30, "neon_yel"),
                          (X + 960, 208, 34, "neon_red"), (X + 1180, 206, 34, "neon_purple"),
                          (90, 210, 32, "neon_cyan"), (410, 204, 36, "neon_purple"), (700, 208, 32, "neon_red"),
                          (1040, 206, 34, "neon_pink")):
        vertical_sign(cv, rnd, x, y, n, role)

    street(cv, rnd)
    return cv


if __name__ == "__main__":
    if "--sos" in sys.argv:
        print(f"banner {W * SCALE}x{H * SCALE}; SOS image px ({SOS[0] * SCALE}, {SOS[1] * SCALE}); "
              f"jazz image px {tuple(v * SCALE for v in JAZZ)}")
        sys.exit()
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else OUT
    out.mkdir(parents=True, exist_ok=True)
    for theme in ("dark", "light"):
        cv = draw(theme)
        layers = cv.light_layers()            # before finish(): reads the unlit lenses
        cv.finish().save(out / f"city-{theme}.png", optimize=True)
        print("wrote", out / f"city-{theme}.png")
        if theme == "dark":
            for g, im in layers.items():
                im.save(out / f"city-lights-{g}.png", optimize=True)
                print("wrote", out / f"city-lights-{g}.png")
