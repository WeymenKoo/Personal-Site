/* =====================================================================
   depths.js — what's under the city, as you scroll down the page:
     · the underground, faint: the towers' piles, pipes, a data cable
       with packets running along it, an old sewer, a trilobite
     · the sea: three real research subs (click them), and a hunter-killer
       that fires torpedoes at the cursor: keep moving, or take cover
       over the project boxes
     · at the very bottom, a tube platform: a curved tiled wall, a few
       ads (click them), MIND THE GAP, and trains in and out. Stand the
       cursor on the track and the train stops for you.
   Nothing fixed sits in the middle column, and whatever crosses it fades
   almost out, so the project boxes stay clean. One small canvas, drawn
   at 1/3 scale (1/2 on phones) and blown up pixelated, fixed behind the
   page. Used on the index and the résumé.
   ===================================================================== */
(function () {
  "use strict";
  var main = document.querySelector("body > main");
  if (!main || !document.createElement("canvas").getContext) return;
  var REDUCED = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var body = document.body, hero = document.getElementById("hero");
  function el(t, c) { var n = document.createElement(t); if (c) n.className = c; return n; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function say(m) { if (window.fx && window.fx.toast) window.fx.toast(m); }
  function seeded(s) { return function () { s = (s + 0x6D2B79F5) | 0; var t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  var once = {};
  function sayOnce(k, m) { if (!once[k]) { once[k] = 1; say(m); } }

  /* ---------- the canvas, and a room at the bottom for the platform ---------- */
  var cv = el("canvas", "depths"); cv.setAttribute("aria-hidden", "true");
  body.insertBefore(cv, body.firstChild);
  var ctx = cv.getContext("2d");
  var station = el("div", "station"); station.setAttribute("aria-hidden", "true");
  var after = document.querySelector("body > footer") || main;
  after.parentNode.insertBefore(station, after.nextSibling);

  /* ---------- palettes: night and golden hour ---------- */
  var PALS = {
    dark: {
      ugTop: [30, 18, 52], ugBot: [22, 13, 38], ugA: .62, strata: "#33224f", speck: "#3a2a5a", pile: "#2e2656", pileHi: "#3e3470",
      pipeA: "#2d5a78", pipeAh: "#4f88aa", pipeB: "#6e3f36", pipeBh: "#a0604a", cable: "#43306a", pulse: "#7ff3ff",
      brick: "#3a2440", brickHi: "#4e3256", rock: "#1d1a3e",
      seaTop: [24, 20, 62], seaMid: [18, 36, 86], seaBot: [7, 11, 34], seaA: .9, bubble: "rgba(190,230,255,.55)", beam: "rgba(255,240,200,.07)",
      vault: [14, 10, 32], tile: [43, 35, 80], tileLine: "#251e46", band: "#c0303a", plate: "#120d26", plateText: "#e8ecf5",
      mouth: "#06040e", lip: "#3a3166", platform: "#1e1838", edge: "#ffd36e", bed: "#0f0b20", rail: "#9a9abb", sleeper: "#2a2042",
      car: "#2c56a8", carHi: "#4d7dd2", carSh: "#1b3878", door: "#c8343c", win: "#ffe2a0", stripe: "#e8ecf5", lamp: "#fff2c8"
    },
    light: {
      ugTop: [214, 200, 232], ugBot: [196, 178, 220], ugA: .55, strata: "#c1acd8", speck: "#b19dcc", pile: "#a99ccf", pileHi: "#bdb2dc",
      pipeA: "#5e9cc2", pipeAh: "#8cc0dc", pipeB: "#b9786a", pipeBh: "#d89c88", cable: "#9c86c4", pulse: "#1fb8d0",
      brick: "#b294b8", brickHi: "#c6aacb", rock: "#8a80b8",
      seaTop: [208, 208, 238], seaMid: [196, 224, 246], seaBot: [132, 164, 218], seaA: .9, bubble: "rgba(255,255,255,.75)", beam: "rgba(255,250,220,.18)",
      vault: [150, 138, 200], tile: [236, 230, 246], tileLine: "#e4dcf2", band: "#d0404a", plate: "#2a2150", plateText: "#ffffff",
      mouth: "#2a2150", lip: "#8a80b8", platform: "#bfb3df", edge: "#e0a530", bed: "#4a3f78", rail: "#e8e8f4", sleeper: "#6a5e96",
      car: "#3d6cc4", carHi: "#6a93dc", carSh: "#2a4e98", door: "#d0404a", win: "#fff4cf", stripe: "#ffffff", lamp: "#fffbe8"
    }
  };
  var C = PALS.dark, themeAge = 999;
  function readTheme() {
    var bg = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim().toLowerCase();
    C = bg === "#f4eefb" ? PALS.light : PALS.dark;
  }

  /* ---------- sprites ---------- */
  function sprite(rows, pal, flip) {
    var w = rows[0].length, c = el("canvas"); c.width = w; c.height = rows.length;
    var x = c.getContext("2d");
    rows.forEach(function (r, j) { for (var i = 0; i < w; i++) { var col = pal[r[i]]; if (col) { x.fillStyle = col; x.fillRect(flip ? w - 1 - i : i, j, 1, 1); } } });
    return c;
  }
  var DSV = {
    alvin: { rows: ["......rr..........", ".....rrrr.........", "...wwwwwwwww......", "..wwwwwwwwwwww....", ".wwwwwwwwwwwwwkk..",
      "wwwwwwwwwwwwwwwkk.", "wwwwwwwwwwwwwwwww.", ".wwwwwwwwwwwwwwwg.", "..dddddddddddd.ggg", "...d.d....d.d....."],
      pal: { r: "#e0402a", w: "#f0f0f4", k: "#2a3a5a", d: "#8a8f9e", g: "#9aa0b0" },
      line: "DSV Alvin: in service since 1964. In 1986 it took Ballard's team down to the Titanic." },
    trieste: { rows: ["........t.............", "..tttttttttttttttttt..", ".ffffffffffffffffffff.", "ffffffffffffffffffffff", "ffffffffffffffffffffff",
      ".ffffffffffffffffffff.", "...d.......d......d...", "..........ss..........", ".........ssss.........", "........sskss.........", ".........ssss.........", "..........ss.........."],
      pal: { t: "#9aa0b0", f: "#c9ccd6", d: "#6a6f80", s: "#5a6a8a", k: "#ffd36e" },
      line: "Trieste: Piccard and Walsh rode it to the bottom of the Challenger Deep on 23 January 1960." },
    lf: { rows: ["....wwwwww....", "...wwwwwwww...", "..wwbbbbbbww..", "..wwbbbbbbww..", "..wwwwwwwwww..", "..wwwwwwwwww..", "..ww.wwww.ww..",
      ".tww.wwww.wwt.", ".tww.wwww.wwt.", "..wwwwwwwwww..", "..wwwsssswww..", "...wssksssw...", "....ssssss....", ".....yyyy....."],
      pal: { w: "#eef0f4", b: "#2a2a33", s: "#8a8f9e", k: "#ffd36e", t: "#5a5f6e", y: "#ffe9a0" },
      line: "DSV Limiting Factor: the first crewed sub to reach the deepest point of all five oceans (Five Deeps, 2018–19)." }
  };
  /* the ads on the tube wall: two words each, made-up brands and things from this site */
  var ADS = [
    { a: "OHMS", b: "LAGER", bg: "#e8a33a", fg: "#2a1236", t: "Ohm's Lager. Resistance is futile. On tap at the top floor." },
    { a: "JAZZ", b: "LIVE", bg: "#2a1236", fg: "#ffd36e", t: "The Low Pass: jazz, live tonight. It's in the skyline, up top." },
    { a: "DC", b: "LOAD", bg: "#1d5a3a", fg: "#e8ecf5", t: "WK-01 DC electronic load: 150 W, four MOSFETs, Rev E in layout." },
    { a: "FLUX", b: "REMOVER", bg: "#e8ecf5", fg: "#c0303a", t: "Flux remover. Do not drink the flux remover." },
    { a: "TOP", b: "FLOOR", bg: "#3a2a7a", fg: "#7ff3ff", t: "The top floor: the bar, the city and the sky. Scroll all the way up." }
  ];
  var FONT = {
    A: "010101111101101", B: "110101110101110", C: "011100100100011", D: "110101101101110", E: "111100110100111", F: "111100110100100",
    G: "011100101101011", H: "101101111101101", I: "111010010010111", J: "001001001101010", K: "101101110101101", L: "100100100100111",
    M: "1000111011101011000110001", N: "110101101101101", O: "010101101101010", P: "110101110100100", Q: "010101101110011", R: "110101110101101",
    S: "011100010001110", T: "111010010010010", U: "101101101101111", V: "101101101101010", W: "1000110001101011101110001", X: "101101010101101",
    Y: "101101010010010", Z: "111001010100111", "0": "111101101101111", "1": "010110010010111", "-": "000000111000000", " ": "000000000000000"
  };
  function glyphW(ch) { return (FONT[ch] || FONT[" "]).length / 5; }      /* 3 wide, or 5 for M and W */
  function textW(s) { var w = 0; for (var i = 0; i < s.length; i++) w += glyphW(s[i]) + 1; return w - 1; }
  function text(s, x, y, col) {
    ctx.fillStyle = col;
    for (var i = 0; i < s.length; i++) {
      var g = FONT[s[i]] || FONT[" "], gw = g.length / 5;
      for (var b = 0; b < g.length; b++) if (g[b] === "1") ctx.fillRect(x + b % gw, y + Math.floor(b / gw), 1, 1);
      x += gw + 1;
    }
  }
  var IMG = {};
  function images() {
    IMG.dsv = {};
    Object.keys(DSV).forEach(function (k) { IMG.dsv[k] = [sprite(DSV[k].rows, DSV[k].pal, true), sprite(DSV[k].rows, DSV[k].pal)]; });
    IMG.sub = [subSprite(false), subSprite(true)];
    IMG.trilo = sprite(["..f.f..", ".fffff.", "ffFfFff", ".fffff.", "ffFfFff", ".fffff.", "..fff..", "...f..."], { f: "#5a4878", F: "#7a68a0" });
  }
  /* the hunter-killer: long black hull, sail with planes, cross tail; bow to the right */
  function subSprite(left) {
    var w = 46, h = 11, c = el("canvas"); c.width = w; c.height = h;
    var x = c.getContext("2d");
    function px(i, j, col) { x.fillStyle = col; x.fillRect(left ? w - 1 - i : i, j, 1, 1); }
    for (var i = 4; i < w; i++) {
      var t = (i - 4) / (w - 4), half = t < .18 ? 1 + t / .18 * 2.2 : t > .9 ? 3.2 * Math.sqrt(Math.max(0, (1 - t) / .1)) : 3.2;
      for (var j = Math.round(7 - half); j <= Math.round(7 + half * .7); j++) px(i, j, j < 6 ? "#2c3040" : "#1a1c26");
    }
    for (i = 26; i < 33; i++) for (j = 1; j < 5; j++) px(i, j, "#2c3040");     /* sail */
    for (i = 24; i < 35; i++) px(i, 3, "#3a3f52");                              /* sail planes */
    for (j = 3; j < 11; j++) px(4, j, "#2c3040");                               /* rudder */
    px(2, 7, "#3a3f52"); px(3, 6, "#3a3f52"); px(3, 8, "#3a3f52");              /* screw */
    px(44, 7, "#5a6070");                                                      /* tube door */
    return c;
  }

  /* ---------- layout: where each zone sits on the page (css px, page coords) ---------- */
  var P = 3, W = 0, H = 0, VW = 0, VH = 0, Z = null, S = null, key = "";
  function pageTop(n) { return n.getBoundingClientRect().top + scrollY; }
  function layout() {
    VW = document.documentElement.clientWidth; VH = innerHeight;
    P = VW < 700 ? 2 : 3;
    W = Math.ceil(VW / P); H = Math.ceil(VH / P) + 1;
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; ctx.imageSmoothingEnabled = false; }
    cv.style.width = W * P + "px"; cv.style.height = H * P + "px";
    var start = hero ? pageTop(hero) + hero.offsetHeight : pageTop(main) + 40;
    var stTop = pageTop(station), stH = station.offsetHeight;
    var span = Math.max(400, stTop - start), ug = Math.round(Math.min(720, Math.max(240, span * .22)));
    var r = main.getBoundingClientRect(), cs = getComputedStyle(main);
    var colL = r.left + parseFloat(cs.paddingLeft), colR = r.right - parseFloat(cs.paddingRight);
    Z = { start: start, sea: start + ug, stTop: stTop, stH: stH, colL: colL, colR: colR };
    var k = [W, H, P, Math.round(start), Math.round(stTop), Math.round(colL)].join();
    if (k !== key) { key = k; build(); }
  }
  /* the underground's fixtures: only in the margins, never behind the project boxes */
  function build() {
    var R = seeded(7), ug = Z.sea - Z.start, gap = 12;
    S = { piles: [], specks: [], mL: Math.max(0, Z.colL - gap), mR: Math.min(VW, Z.colR + gap) };
    var room = VW - S.mR;
    function marginX(f) { return f < .5 ? S.mL * f * 2 : S.mR + room * (f - .5) * 2; }
    for (var k = 0; k < 10; k++) S.piles.push({ x: marginX((k + .5) / 10 + (R() - .5) * .04), w: 2 + Math.round(R() * 2), d: 60 + R() * 90 });
    S.pipes = [{ y: Z.start + ug * .36, a: true }, { y: Z.start + ug * .63, a: false }];
    S.cable = Z.start + ug * .5;
    S.vpipe = S.mR + room * .55;
    S.sewer = { x: S.mL * .45, y: Z.start + ug * .74 };
    S.trilo = { x: S.mR + room * .3, y: Z.start + ug * .84 };
    for (var i = 0; i < 90; i++) S.specks.push({ x: marginX(R()), y: Z.start + 20 + R() * (ug - 30) });
  }

  /* ---------- what moves: positions as fractions of the sea, so they survive a relayout ---------- */
  var cur = { x: -9999, y: -9999, cx: -9999, cy: -9999, in: false };   /* the cursor: page coords, and where it is on screen */
  var subs, sub, torps = [], fx = [], bubbles = [], score = { hits: 0, dodged: 0 };
  function seaY(f) { return Z.sea + f * (Z.stTop - Z.sea); }
  function vesselsInit() {
    subs = [
      { k: "alvin", fy: .22, x: VW * .82, dir: -1, v: .25 },
      { k: "lf", fy: .6, x: VW * .08, dir: 1, v: .12 },
      { k: "trieste", fy: .88, x: VW * .6, dir: -1, v: .18 }
    ];
    sub = { fy: .42, x: -80, dir: 1, cool: 240 };
  }

  /* ---------- drawing helpers, in canvas pixels ---------- */
  var base = 0;                                                        /* page y of the canvas's top row */
  function ay(y) { return Math.round((y - base) / P); }
  function ax(x) { return Math.round(x / P); }
  function rect(x, y, w, h, col) { ctx.fillStyle = col; ctx.fillRect(x, y, w, h); }
  function mix(a, b, t) { return "rgb(" + Math.round(a[0] + (b[0] - a[0]) * t) + "," + Math.round(a[1] + (b[1] - a[1]) * t) + "," + Math.round(a[2] + (b[2] - a[2]) * t) + ")"; }
  function near(x, y, r) { var dx = x - cur.x, dy = y - cur.y; return cur.in && dx * dx + dy * dy < r * r; }
  function inColumn(x, w) { return x + (w || 0) > S.mL && x < S.mR; }  /* the project boxes' column, page x */
  var FADE = .2;                                                       /* how much shows through behind it */

  /* ---------- the underground ---------- */
  function underground(t) {
    var y0 = ay(Z.start), y1 = ay(Z.sea);
    if (y1 < 0 || y0 > H) return;
    for (var j = Math.max(0, y0); j < Math.min(H, y1); j++) {
      var f = (j - y0) / Math.max(1, y1 - y0), g = Math.max(0, (f - .6) / .4);   /* the last 40% fades into the sea */
      ctx.globalAlpha = C.ugA + (C.seaA - C.ugA) * g;
      rect(0, j, W, 1, g > 0 ? mix(C.ugBot, C.seaTop, g * g * (3 - 2 * g)) : mix(C.ugTop, C.ugBot, f / .6));
    }
    ctx.globalAlpha = C.ugA;
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, Math.floor(S.mL / P), H); ctx.rect(Math.ceil(S.mR / P), 0, W, H); ctx.clip();
    [.28, .55, .8].forEach(function (f, i) {
      var yy = y0 + f * (y1 - y0);
      for (var x = 0; x < W; x++) rect(x, Math.round(yy + Math.sin(x / (14 + i * 5) + i) * 2), 1, 1, C.strata);
    });
    S.specks.forEach(function (s) { rect(ax(s.x), ay(s.y), 1, 1, C.speck); });
    S.piles.forEach(function (p) { var x = ax(p.x), h = ay(Z.start + p.d) - y0; rect(x, y0, p.w, h, C.pile); rect(x, y0, 1, h, C.pileHi); });
    S.pipes.forEach(function (p) {
      var y = ay(p.y), c = p.a ? C.pipeA : C.pipeB, h = p.a ? C.pipeAh : C.pipeBh;
      rect(0, y, W, 3, c); rect(0, y, W, 1, h);
      for (var x = 6; x < W; x += 34) rect(x, y - 1, 2, 5, h);
    });
    var vx = ax(S.vpipe), a = ay(S.pipes[0].y), b = ay(S.pipes[1].y);
    rect(vx, a, 3, b - a + 3, C.pipeA); rect(vx, a, 1, b - a, C.pipeAh);
    var cy = ay(S.cable);
    rect(0, cy, W, 1, C.cable);
    for (var k = 0; k < 4; k++) rect(Math.round(((t * .6 + k * W / 4) % (W + 20)) - 10), cy, 3, 1, C.pulse);   /* packets */
    var sx = ax(S.sewer.x), sy = ay(S.sewer.y);
    for (var q = 0; q < 40; q++) { var an = q / 40 * Math.PI * 2; rect(Math.round(sx + Math.cos(an) * 9), Math.round(sy + Math.sin(an) * 7), 2, 1, q % 4 ? C.brick : C.brickHi); }
    ctx.drawImage(IMG.trilo, ax(S.trilo.x), ay(S.trilo.y));
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  /* ---------- the sea ---------- */
  function sea() {
    var y0 = ay(Z.sea), y1 = ay(Z.stTop + Z.stH), ys = ay(Z.stTop);
    if (y1 < 0 || y0 > H) return;
    ctx.globalAlpha = C.seaA;
    for (var j = Math.max(0, y0); j < Math.min(H, y1); j++) {
      var f = Math.min(1, (j - y0) / Math.max(1, ys - y0));
      rect(0, j, W, 1, f < .3 ? mix(C.seaTop, C.seaMid, f / .3) : mix(C.seaMid, C.seaBot, (f - .3) / .7));
    }
    ctx.globalAlpha = 1;
  }
  function vessels(t, dt) {
    subs.forEach(function (v) {
      var img = IMG.dsv[v.k][v.dir > 0 ? 0 : 1];
      v.x += v.dir * v.v * dt;
      if (v.x > VW + 40 && v.dir > 0) v.dir = -1; if (v.x < -img.width * P - 40 && v.dir < 0) v.dir = 1;
      var y = ay(seaY(v.fy) + Math.sin(t / 90 + v.fy * 10) * 5), x = ax(v.x);
      v.box = { x: v.x, y: seaY(v.fy) - 6, w: img.width * P, h: img.height * P + 12 };
      if (y < -30 || y > H + 10) return;
      ctx.globalAlpha = inColumn(v.x, img.width * P) ? FADE : 1;
      ctx.fillStyle = C.beam; ctx.beginPath();                        /* lamps ahead into the dark */
      var fx0 = v.dir > 0 ? x + img.width : x, my = y + (img.height >> 1);
      ctx.moveTo(fx0, my); ctx.lineTo(fx0 + v.dir * 40, my - 12); ctx.lineTo(fx0 + v.dir * 40, my + 14); ctx.fill();
      ctx.drawImage(img, x, y); ctx.globalAlpha = 1;
      if (Math.random() < .01) bubbles.push({ x: v.x + img.width * P / 2, y: seaY(v.fy), v: rnd(.4, .7), ph: rnd(0, 6), life: 200 });
    });
  }
  /* the hunter-killer: patrols, and fires on the cursor when it lingers in range outside the column */
  function hunter(t, dt) {
    var img = IMG.sub[sub.dir > 0 ? 0 : 1], wy = seaY(sub.fy) + Math.sin(t / 120) * 8;
    sub.x += sub.dir * .4 * dt;
    if (sub.x > VW + 60) sub.dir = -1; if (sub.x < -img.width * P - 60) sub.dir = 1;
    sub.box = { x: sub.x, y: wy, w: img.width * P, h: img.height * P };
    var y = ay(wy), on = y > -10 && y < H;
    if (on) { ctx.globalAlpha = inColumn(sub.x, img.width * P) ? FADE : 1; ctx.drawImage(img, ax(sub.x), y); ctx.globalAlpha = 1; }
    sub.cool -= dt;
    if (!REDUCED && on && cur.in && !inColumn(cur.x) && Math.abs(cur.y - wy) < 420 && sub.cool <= 0 && torps.length < 2 && sub.x > -20 && sub.x < VW - 20) {
      fire(cur.x, cur.y);
      sub.cool = rnd(200, 330);
    }
  }
  function fire(tx, ty) {
    var wy = sub.box ? sub.box.y + 7 * P : seaY(sub.fy), bx = sub.x + (sub.dir > 0 ? 46 * P : 0);
    torps.push({ x: bx, y: wy, a: Math.atan2(ty - wy, tx - bx), life: 380 });
    sayOnce("torp", "Sonar ping. Torpedo in the water: move, or take cover over the project boxes!");
  }
  function torpedoes(dt) {
    var n = Math.max(1, Math.ceil(dt)), h = dt / n;                  /* small steps: a slow frame can't skip past the cursor */
    torps = torps.filter(function (p) {
      var exposed = cur.in && !inColumn(cur.x), hit = false;         /* over the project column, the boxes are cover */
      for (var k = 0; k < n && !hit; k++) {
        if (exposed) {                                               /* homes in, but turns slowly */
          var want = Math.atan2(cur.y - p.y, cur.x - p.x), d = want - p.a;
          while (d > Math.PI) d -= 6.283; while (d < -Math.PI) d += 6.283;
          p.a += Math.max(-.014, Math.min(.014, d)) * h;
        }
        p.x += Math.cos(p.a) * 3.4 * h; p.y += Math.sin(p.a) * 3.4 * h; p.life -= h;
        hit = exposed && near(p.x, p.y, 13);
      }
      if (Math.random() < .5) bubbles.push({ x: p.x - Math.cos(p.a) * 10, y: p.y, v: rnd(.2, .5), ph: rnd(0, 6), life: 60 });
      var x = ax(p.x), y = ay(p.y);
      ctx.globalAlpha = inColumn(p.x) ? .3 : 1;
      for (var i = 0; i < 6; i++) rect(Math.round(x - Math.cos(p.a) * i), Math.round(y - Math.sin(p.a) * i), 1, 1, i === 0 ? "#ff3e5a" : "#5a6070");
      ctx.globalAlpha = 1;
      if (hit) {
        blast(p.x, p.y); score.hits++;
        say(score.hits === 1 ? "Direct hit. Glub. (Keep moving, or take cover behind the project boxes.)" : "Hit " + score.hits + ". Dodged " + score.dodged + ".");
        return false;
      }
      if (p.life <= 0) {
        score.dodged++; blast(p.x, p.y, true);
        if (score.dodged % 5 === 0) say("Dodged " + score.dodged + " torpedoes. The captain is furious.");
        return false;
      }
      return true;
    });
  }
  function blast(x, y, small) {
    fx.push({ x: x, y: y, r: 1, max: small ? 6 : 14, life: 1 });
    for (var i = 0; i < (small ? 6 : 18); i++) bubbles.push({ x: x + rnd(-10, 10), y: y + rnd(-10, 10), v: rnd(.6, 1.6), ph: rnd(0, 6), life: rnd(40, 90) });
  }
  function effects(dt) {
    fx = fx.filter(function (e) {
      e.r += (e.max - e.r) * .15 * dt; e.life -= .03 * dt;
      ctx.globalAlpha = Math.max(0, e.life);
      var x = ax(e.x), y = ay(e.y);
      if (e.life > .7) rect(x - 2, y - 2, 5, 5, "#fff6d8");
      for (var i = 0; i < 16; i++) { var a = i / 16 * 6.283; rect(Math.round(x + Math.cos(a) * e.r), Math.round(y + Math.sin(a) * e.r), 1, 1, e.r < e.max * .6 ? "#ffd36e" : "#ff8fd0"); }
      ctx.globalAlpha = 1;
      return e.life > 0;
    });
    bubbles = bubbles.filter(function (b) {
      b.y -= b.v * dt; b.ph += .1 * dt; b.life -= dt;
      if (b.y < Z.sea) return false;
      ctx.globalAlpha = inColumn(b.x) ? .3 : 1;
      rect(ax(b.x + Math.sin(b.ph) * 3), ay(b.y), 1, 1, C.bubble);
      ctx.globalAlpha = 1;
      return b.life > 0;
    });
    if (bubbles.length > 120) bubbles.splice(0, bubbles.length - 120);
  }

  /* ---------- the platform: a tube station, kept plain ---------- */
  var T = { x: -4, v: 1.4, phase: "in", t: 0 }, CARW = 40, GAP = 2, NCAR = 3, TL = NCAR * CARW + (NCAR - 1) * GAP;
  var ads = [];                                                        /* page-coord boxes of the ads, for clicks */
  function platform(dt) {
    var top = ay(Z.stTop), Hs = Math.round(Z.stH / P);
    ads = [];
    var shown = top < H && top + Hs > 0;
    var tw = Math.max(14, Math.round(W * .07)), bot = top + Hs;
    var plat = bot - 7, bed = bot - 11, trainTop = bed - 15, adY = trainTop - 22, band = adY - 9;
    if (shown) {
      /* the curved wall: dark where it bends overhead, then plain tile */
      var tileCol = mix(C.tile, C.tile, 0);
      rect(0, top, W, 2, C.rock);
      for (var j = top + 2; j < bed; j++) {
        var f = (j - top - 2) / 12;
        if (f < 1) rect(0, j, W, 1, mix(C.vault, C.tile, f * f));
        else rect(0, j, W, 1, (j - top) % 4 ? tileCol : C.tileLine);
      }
      /* the line's stripe, and the station's name on it */
      rect(0, band + 3, W, 2, C.band);
      for (var x = tw + 30; x < W - tw - 40; x += 150) {
        rect(x, band, 37, 8, C.plate); text("DEEP END", x + 3, band + 2, C.plateText);
      }
      /* the ads */
      var k = 0;
      for (x = tw + 10; x + 34 < W - tw - 4; x += 58) {
        var ad = ADS[k++ % ADS.length], aw = 34, ah = 18;
        rect(x - 1, adY - 1, aw + 2, ah + 2, C.plate); rect(x, adY, aw, ah, ad.bg);
        text(ad.a, x + Math.floor((aw - textW(ad.a)) / 2), adY + 3, ad.fg);
        text(ad.b, x + Math.floor((aw - textW(ad.b)) / 2), adY + 10, ad.fg);
        ads.push({ x: (x - 1) * P, y: base + (adY - 1) * P, w: (aw + 2) * P, h: (ah + 2) * P, t: ad.t });
      }
      /* track */
      rect(0, bed, W, plat - bed, C.bed);
      for (x = 0; x < W; x += 4) rect(x, plat - 2, 2, 1, C.sleeper);
      rect(0, plat - 3, W, 1, C.rail);
    }
    train(dt, trainTop, shown);
    if (!shown) return;
    /* tunnel mouths at both ends: the train goes into the dark */
    [0, W - tw].forEach(function (x0) {
      var cx = x0 + tw / 2, rx = tw / 2, ry = plat - trainTop + 6;
      for (var x = x0; x < x0 + tw; x++) {                          /* a round-topped hole, and its lip */
        var u = (x + .5 - cx) / rx, hgt = Math.round(Math.sqrt(Math.max(0, 1 - u * u)) * ry);
        ctx.globalAlpha = .85; rect(x, plat - hgt, 1, hgt, C.mouth); ctx.globalAlpha = 1;
        rect(x, plat - hgt - 1, 1, 1, C.lip);
      }
    });
    /* the platform edge, in front */
    rect(0, plat, W, bot - plat, C.platform);
    rect(0, plat, W, 1, C.edge);
    for (x = tw + 20; x < W - tw - 56; x += 120) text("MIND THE GAP", x, plat + 2, C.edge);
  }
  /* trains: in from the left, stop, doors, out to the right. The cursor on the track stops them. */
  function train(dt, trainTop, visible) {
    var stopX = Math.round(W / 2 + TL / 2);
    var block = Infinity, cx = cur.x / P, cyy = (cur.y - base) / P;
    if (visible && cur.in && cyy > trainTop - 6 && cyy < trainTop + 22 && cx > T.x - 1 && cx - T.x < 90) block = cx - 3;
    if (T.phase === "gap") { T.t -= dt; if (T.t <= 0) { T.phase = "in"; T.x = -4; T.v = 1.4; } return; }
    if (T.phase === "dwell") {
      T.t -= dt;
      if (T.t <= 0) { T.phase = "out"; if (visible) sayOnce("doors", "Mind the doors, please."); }
    } else {
      var target = Math.min(T.phase === "in" ? stopX : W + TL + 40, block);
      if (block < Infinity && visible) { T.blocked = true; sayOnce("horn", "The driver leans on the horn. Off the tracks!"); } else T.blocked = false;
      for (var n = Math.max(1, Math.ceil(dt)), k = 0; k < n; k++) {     /* small steps, the same at any frame rate */
        var dist = target - T.x, want = dist <= 0 ? 0 : Math.min(1.8, Math.sqrt(2 * .02 * dist));
        T.v += Math.max(-.06, Math.min(.025, want - T.v)) * dt / n;
        if (dist <= .05) T.v = 0;
        T.x += Math.max(0, T.v) * dt / n;
      }
      if (T.phase === "in" && !T.blocked && Math.abs(stopX - T.x) < .6 && T.v < .05) { T.phase = "dwell"; T.t = 220; T.x = stopX; T.v = 0; }
      if (T.phase === "out" && T.x - TL > W + 10) { T.phase = "gap"; T.t = rnd(140, 320); }
    }
    if (!visible) return;
    var open = T.phase === "dwell" && T.t > 40, y = trainTop;
    for (var c = 0; c < NCAR; c++) {
      var x2 = Math.round(T.x - c * (CARW + GAP)), x1 = x2 - CARW;
      if (x2 < 0 || x1 > W) continue;
      /* tube stock: rounded roof, a band of windows, red doors */
      rect(x1 + 2, y, CARW - 4, 1, C.carSh); rect(x1 + 1, y + 1, CARW - 2, 1, C.carHi); rect(x1, y + 2, CARW, 12, C.car);
      for (var w = x1 + 3; w < x2 - 4; w += 6) rect(w, y + 4, 4, 3, C.win);
      rect(x1, y + 9, CARW, 1, C.stripe); rect(x1, y + 12, CARW, 2, C.carSh);
      [7, 18, 29].forEach(function (d) { rect(x1 + d, y + 3, 4, 10, open ? C.bed : C.door); if (!open) rect(x1 + d + 2, y + 3, 1, 10, C.carSh); });
      rect(x1 + 4, y + 14, 3, 1, C.bed); rect(x2 - 7, y + 14, 3, 1, C.bed);
      if (c === 0) {
        rect(x2 - 1, y + 10, 1, 2, C.lamp);
        if (T.blocked && Math.floor(performance.now() / 150) % 2) rect(x2 - 1, y + 7, 1, 1, "#ff3e5a");
      }
      if (c === NCAR - 1) rect(x1, y + 10, 1, 2, "#ff3e5a");
    }
  }

  /* ---------- the loop: only while something below the city is on screen ---------- */
  var running = false, lastT = 0, clock = 0, frames = 0;
  function visible() { return Z && scrollY + innerHeight > Z.start; }
  function frame(now) {
    var dt = REDUCED ? 0 : Math.min(50, now - (lastT || now)) / 16.67; lastT = now; clock += dt; frames++;
    if (++themeAge > 60) { themeAge = 0; readTheme(); }
    var off = scrollY % P; base = scrollY - off;
    cv.style.transform = "translate3d(0," + (-off) + "px,0)";
    ctx.clearRect(0, 0, W, H);
    underground(clock);
    sea();
    vessels(clock, dt);
    hunter(clock, dt);
    platform(dt);
    torpedoes(dt);
    effects(dt);
    if (running && !REDUCED && visible() && !document.hidden) requestAnimationFrame(frame); else { running = false; lastT = 0; }
  }
  function wake() {
    if (!Z) return;
    if (REDUCED) { requestAnimationFrame(frame); return; }
    if (!running && visible() && !document.hidden) { running = true; requestAnimationFrame(frame); }
  }

  /* ---------- the cursor, and clicks on things down here ---------- */
  function things() {
    var out = [];
    subs.forEach(function (v) { if (v.box && !inColumn(v.box.x, v.box.w)) out.push({ b: v.box, t: DSV[v.k].line }); });
    if (sub.box && !inColumn(sub.box.x, sub.box.w)) out.push({ b: sub.box, t: "A hunter-killer on silent running. It doesn't like cursors." });
    ads.forEach(function (p) { out.push({ b: p, t: p.t }); });
    return out;
  }
  function thingAt(x, y) {
    var th = things();
    for (var i = th.length - 1; i >= 0; i--) { var b = th[i].b; if (x > b.x - 6 && x < b.x + b.w + 6 && y > b.y - 6 && y < b.y + b.h + 6) return th[i]; }
    return null;
  }
  function blocked(e) { return e.target.closest && e.target.closest("a,button,input,textarea,.proj,.dock,.lb,#hero,.topbar,.job"); }
  document.addEventListener("pointermove", function (e) {
    if (e.pointerType === "touch") return;
    cur.cx = cur.x = e.clientX; cur.cy = e.clientY; cur.y = e.clientY + scrollY; cur.in = !!Z && cur.y > Z.start;
    if (cur.in && !blocked(e)) body.classList.toggle("aim", !!thingAt(cur.x, cur.y));
    wake();
  }, { passive: true });
  document.documentElement.addEventListener("pointerleave", function () { cur.in = false; });
  window.addEventListener("scroll", function () {                    /* the page moves under a still cursor */
    if (cur.cy > -9999) { cur.y = cur.cy + scrollY; cur.in = !!Z && cur.y > Z.start; }
    wake();
  }, { passive: true });
  document.addEventListener("click", function (e) {
    if (!Z || blocked(e)) return;
    var t = thingAt(e.clientX, e.clientY + scrollY);
    if (t) say(t.t);
  });
  document.addEventListener("visibilitychange", wake);

  images(); readTheme(); layout(); vesselsInit(); wake();
  window.addEventListener("resize", function () { layout(); wake(); });
  if ("ResizeObserver" in window) new ResizeObserver(function () { layout(); wake(); }).observe(body);

  /* for the tests */
  window.depths = {
    zones: function () { return Z; }, train: function () { return T; }, torps: function () { return torps; },
    score: score, sub: function () { return sub; }, fire: fire, layout: layout, things: things,
    cursor: function () { return { x: cur.x, y: cur.y, in: cur.in, base: base, P: P, W: W, frames: frames }; }
  };
})();
