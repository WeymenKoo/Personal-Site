/* =====================================================================
   depths.js — what's under the city, as you scroll down the page:
     · the underground, faint: the towers' piles, pipes, a data cable
       with packets running along it, an old sewer, a trilobite
     · the sea: three real research subs (click them), and a hunter-killer
       that fires torpedoes at the cursor: keep moving, or take cover
       over the project boxes
     · at the very bottom, a plain tube station: the train comes out of
       one tunnel, stops, and goes into the other. Stand the cursor on
       the track and it stops for you.
   Drawn at the city picture's own pixel size, so the two read as one
   picture. Nothing fixed sits in the middle column (things in the
   margins fade out before they reach it), and whatever crosses it fades
   almost out, so the project boxes stay clean. Index and résumé.
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

  /* ---------- the canvas, and a room at the bottom for the station ---------- */
  var cv = el("canvas", "depths"); cv.setAttribute("aria-hidden", "true");
  body.insertBefore(cv, body.firstChild);
  var ctx = cv.getContext("2d");
  var station = el("div", "station"); station.setAttribute("aria-hidden", "true");
  var after = document.querySelector("body > footer") || main;
  after.parentNode.insertBefore(station, after.nextSibling);

  /* ---------- palettes: night and golden hour ---------- */
  var PALS = {
    dark: {
      ugTop: [30, 18, 52], ugBot: [22, 13, 38], ugA: .62, strata: "#33224f", strataLo: "#2a1c44", speck: "#3a2a5a", pile: "#2a2350", pileHi: "#3a3268", pileSh: "#211c42",
      pipeA: "#2d5a78", pipeAh: "#4f88aa", pipeAs: "#21455e", pipeB: "#6e3f36", pipeBh: "#a0604a", pipeBs: "#552f29", cable: "#43306a", pulse: "#7ff3ff",
      brick: "#3a2440", brickHi: "#4e3256", fossil: "#4a3b66", fossilHi: "#5e4c80",
      seaTop: [24, 20, 62], seaMid: [18, 36, 86], seaBot: [7, 11, 34], seaA: .9, bubble: "rgba(190,230,255,.55)", beam: "rgba(255,240,200,.07)",
      rock: "#120e26", rockHi: "#1c1738", vault: [16, 12, 36], wall: [40, 33, 76], stripe: "#c0303a", plate: "#120d26", plateText: "#e8ecf5",
      tunnel: "#05030b", lining: "#2e2758", platTop: "#3a3066", platEdge: "#e0b050", platFace: "#1a1534",
      car: "#2c56a8", carHi: "#4d7dd2", carSh: "#1d3c7e", roof: "#9aa3b8", door: "#c8343c", doorSh: "#9a2630", win: "#ffe2a0", winSh: "#c9a060", lamp: "#fff2c8", tail: "#ff3e5a"
    },
    light: {
      ugTop: [214, 200, 232], ugBot: [196, 178, 220], ugA: .55, strata: "#c1acd8", strataLo: "#b8a2d0", speck: "#b19dcc", pile: "#a99ccf", pileHi: "#bdb2dc", pileSh: "#9a8cc4",
      pipeA: "#5e9cc2", pipeAh: "#8cc0dc", pipeAs: "#4c82a6", pipeB: "#b9786a", pipeBh: "#d89c88", pipeBs: "#9c6458", cable: "#9c86c4", pulse: "#1fb8d0",
      brick: "#b294b8", brickHi: "#c6aacb", fossil: "#9a86b8", fossilHi: "#b2a0cc",
      seaTop: [208, 208, 238], seaMid: [196, 224, 246], seaBot: [132, 164, 218], seaA: .9, bubble: "rgba(255,255,255,.75)", beam: "rgba(255,250,220,.18)",
      rock: "#6c62a0", rockHi: "#7a70ae", vault: [150, 138, 200], wall: [232, 226, 244], stripe: "#d0404a", plate: "#2a2150", plateText: "#ffffff",
      tunnel: "#1e1838", lining: "#8a80b8", platTop: "#cfc4ea", platEdge: "#e0a530", platFace: "#a598cf",
      car: "#3d6cc4", carHi: "#6a93dc", carSh: "#2c5196", roof: "#c4cada", door: "#d0404a", doorSh: "#a8323b", win: "#fff4cf", winSh: "#d8c08a", lamp: "#fffbe8", tail: "#e0404f"
    }
  };
  var C = PALS.dark, theme = "", themeAge = 999;
  function readTheme() {
    var bg = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim().toLowerCase();
    var t = bg === "#f4eefb" ? "light" : "dark";
    if (t !== theme) { theme = t; C = PALS[t]; if (Z) { key = ""; layout(); } }
  }

  /* ---------- drawing tools ---------- */
  function canvas(w, h) { var c = el("canvas"); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
  /* draw with paths, then snap every pixel fully on or off: vector shapes, pixel-art edges */
  function pix(w, h, draw) {
    var c = canvas(w, h), x = c.getContext("2d");
    draw(x);
    var d = x.getImageData(0, 0, c.width, c.height), a = d.data;
    for (var i = 3; i < a.length; i += 4) a[i] = a[i] < 110 ? 0 : 255;
    x.putImageData(d, 0, 0);
    return c;
  }
  function rrect(x, X, Y, w, h, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }
  function flipped(c) { var f = canvas(c.width, c.height), x = f.getContext("2d"); x.translate(c.width, 0); x.scale(-1, 1); x.drawImage(c, 0, 0); return f; }
  function mix(a, b, t) { return "rgb(" + Math.round(a[0] + (b[0] - a[0]) * t) + "," + Math.round(a[1] + (b[1] - a[1]) * t) + "," + Math.round(a[2] + (b[2] - a[2]) * t) + ")"; }
  var FONT = { D: "110101101101110", E: "111100110100111", P: "110101110100100", N: "110101101101101", " ": "000000000000000" };
  function text(x, s, X, Y, k, col) {
    x.fillStyle = col;
    for (var i = 0; i < s.length; i++) { var g = FONT[s[i]]; for (var b = 0; b < 15; b++) if (g[b] === "1") x.fillRect(X + (i * 4 + b % 3) * k, Y + Math.floor(b / 3) * k, k, k); }
  }

  /* ---------- the vessels, as fine pixel art (facing right) ---------- */
  /* the fleet: real crewed research subs, facing right. arm: where a manipulator comes out (fractions of w, h) */
  var DSV = {
    alvin: { w: 48, h: 30, arm: [.86, .8], line: "DSV Alvin: in service since 1964. In 1986 it took Ballard's team down to the Titanic.",
      draw: function (x) {
        x.fillStyle = "#c9ccd6"; rrect(x, 3, 10, 38, 15, 7); x.fill();
        x.fillStyle = "#eef0f4"; rrect(x, 3, 9, 38, 12, 6); x.fill();
        x.fillStyle = "#e0402a"; rrect(x, 13, 2, 15, 10, 3); x.fill();
        x.fillStyle = "#ff6a50"; x.fillRect(14, 2, 13, 2);
        x.fillStyle = "#2a3a5a"; x.beginPath(); x.arc(35, 18, 2.6, 0, 7); x.fill();
        x.strokeStyle = "#9aa0b0"; x.lineWidth = 1.2; x.strokeRect(38.5, 19.5, 8, 6); x.beginPath(); x.moveTo(42.5, 19.5); x.lineTo(42.5, 25.5); x.stroke();
        x.fillStyle = "#8a8f9e"; x.fillRect(0, 12, 4, 4); x.fillRect(0, 18, 4, 4); x.fillRect(8, 25, 26, 2);
      } },
    trieste: { w: 66, h: 42, line: "Trieste: Piccard and Walsh rode it to the bottom of the Challenger Deep on 23 January 1960.",
      draw: function (x) {
        x.fillStyle = "#a9adb8"; rrect(x, 2, 7, 62, 17, 8); x.fill();
        x.fillStyle = "#c9ccd6"; rrect(x, 2, 6, 62, 14, 7); x.fill();
        x.fillStyle = "#e2e5ec"; x.fillRect(8, 7, 50, 2);
        x.fillStyle = "#9aa0b0"; rrect(x, 28, 1, 8, 7, 2); x.fill();
        x.fillStyle = "#6a6f80"; x.fillRect(13, 23, 7, 4); x.fillRect(46, 23, 7, 4); x.fillRect(29, 23, 2, 5); x.fillRect(35, 23, 2, 5);
        x.fillStyle = "#4a5878"; x.beginPath(); x.arc(33, 33, 7.5, 0, 7); x.fill();
        x.fillStyle = "#6a7a9c"; x.beginPath(); x.arc(31, 31, 3, 0, 7); x.fill();
        x.fillStyle = "#ffd36e"; x.fillRect(38, 32, 2, 2);
      } },
    lf: { w: 36, h: 50, arm: [.8, .7], line: "DSV Limiting Factor: the first crewed sub to reach the deepest point of all five oceans (Five Deeps, 2018–19).",
      draw: function (x) {
        x.fillStyle = "#c9ccd6"; rrect(x, 6, 2, 24, 37, 6); x.fill();
        x.fillStyle = "#eef0f4"; rrect(x, 6, 2, 21, 37, 6); x.fill();
        x.fillStyle = "#2a2a33"; x.fillRect(6, 9, 24, 8);
        x.fillStyle = "#5a5f6e"; x.fillRect(1, 20, 5, 9); x.fillRect(30, 20, 5, 9);
        x.fillStyle = "#8a8f9e"; x.beginPath(); x.arc(18, 41, 7.5, 0, 7); x.fill();
        x.fillStyle = "#a9adb8"; x.beginPath(); x.arc(16, 39, 3, 0, 7); x.fill();
        x.fillStyle = "#ffd36e"; x.fillRect(22, 41, 2, 2); x.fillRect(10, 47, 2, 2); x.fillRect(24, 47, 2, 2);
      } },
    dsc: { w: 26, h: 68, arm: [.7, .82], line: "Deepsea Challenger: James Cameron dived it solo to the Challenger Deep on 26 March 2012.",
      draw: function (x) {
        x.fillStyle = "#78a82a"; rrect(x, 7, 2, 13, 54, 6); x.fill();
        x.fillStyle = "#9ccf3a"; rrect(x, 7, 2, 10, 54, 5); x.fill();
        x.fillStyle = "#c8ee6a"; x.fillRect(9, 4, 2, 46);
        x.fillStyle = "#5a5f6e"; x.fillRect(0, 14, 26, 2);                /* the lights boom */
        x.fillStyle = "#ffe9a0"; x.fillRect(0, 12, 3, 2); x.fillRect(23, 12, 3, 2);
        x.fillStyle = "#6a7080"; x.beginPath(); x.arc(13, 59, 6.5, 0, 7); x.fill();
        x.fillStyle = "#ffd36e"; x.fillRect(17, 58, 2, 2);
      } },
    shinkai: { w: 54, h: 30, arm: [.88, .8], line: "Shinkai 6500: JAMSTEC's research sub from Japan, rated to 6,500 m, as the name says.",
      draw: function (x) {
        x.fillStyle = "#c9ccd6"; rrect(x, 4, 9, 42, 16, 8); x.fill();
        x.fillStyle = "#eef0f4"; rrect(x, 4, 8, 42, 13, 7); x.fill();
        x.fillStyle = "#f2a33a"; rrect(x, 10, 4, 28, 6, 3); x.fill();
        x.fillStyle = "#3a7ac0"; x.fillRect(6, 17, 38, 2);
        x.fillStyle = "#8a8f9e"; x.fillRect(0, 9, 5, 3); x.fillRect(0, 20, 5, 3); x.fillRect(2, 5, 3, 22);   /* the X tail */
        x.fillStyle = "#2a3a5a"; x.beginPath(); x.arc(40, 18, 2.3, 0, 7); x.fill(); x.beginPath(); x.arc(36, 20, 1.8, 0, 7); x.fill();
        x.fillStyle = "#9aa0b0"; x.fillRect(44, 21, 8, 5);
      } },
    jiaolong: { w: 56, h: 30, arm: [.88, .82], line: "Jiaolong: China's crewed research sub. In 2012 it reached 7,062 m in the Mariana Trench.",
      draw: function (x) {
        x.fillStyle = "#c9ccd6"; rrect(x, 4, 9, 44, 16, 8); x.fill();
        x.fillStyle = "#f4f5f8"; rrect(x, 4, 8, 44, 13, 7); x.fill();
        x.fillStyle = "#d8452a"; x.beginPath(); x.moveTo(14, 9); x.lineTo(20, 3); x.lineTo(34, 3); x.lineTo(38, 9); x.fill();   /* the sail */
        x.fillStyle = "#8a8f9e"; x.fillRect(0, 7, 6, 3); x.fillRect(0, 21, 6, 3);
        x.fillStyle = "#2a3a5a"; x.beginPath(); x.arc(42, 17, 2.5, 0, 7); x.fill();
        x.fillStyle = "#9aa0b0"; x.fillRect(46, 20, 8, 6);
      } },
    mir: { w: 52, h: 34, arm: [.9, .78], line: "Mir: one of a Russian pair of deep subs. In 2007 they went to the seabed under the North Pole.",
      draw: function (x) {
        x.fillStyle = "#c99a20"; rrect(x, 4, 6, 40, 22, 11); x.fill();
        x.fillStyle = "#f2c230"; rrect(x, 4, 5, 38, 19, 10); x.fill();
        x.fillStyle = "#e05a2a"; x.beginPath(); x.arc(5, 17, 6, 0, 7); x.fill();       /* the stern thruster's duct */
        x.fillStyle = "#2a2a33"; x.beginPath(); x.arc(5, 17, 3, 0, 7); x.fill();
        x.fillStyle = "#3a4a6a"; x.beginPath(); x.arc(39, 16, 5, 0, 7); x.fill();      /* the bow sphere's viewport */
        x.fillStyle = "#7a8aac"; x.beginPath(); x.arc(38, 14, 2, 0, 7); x.fill();
        x.fillStyle = "#ffe9a0"; x.fillRect(22, 2, 3, 3);
        x.fillStyle = "#9aa0b0"; x.fillRect(42, 24, 9, 5);
      } },
    bathy: { w: 30, h: 32, cable: true, line: "Bathysphere: Beebe and Barton reached 923 m off Bermuda in 1934, on the end of a steel cable.",
      draw: function (x) {
        x.fillStyle = "#3e4a66"; x.beginPath(); x.arc(15, 18, 13, 0, 7); x.fill();
        x.fillStyle = "#5a6a8a"; x.beginPath(); x.arc(13, 16, 11, 0, 7); x.fill();
        x.fillStyle = "#7a8aac"; x.beginPath(); x.arc(10, 12, 4, 0, 7); x.fill();
        x.fillStyle = "#2a2f40"; x.fillRect(12, 0, 6, 6);                         /* the lifting eye */
        x.fillStyle = "#c9ccd6"; x.beginPath(); x.arc(21, 18, 3, 0, 7); x.fill(); x.beginPath(); x.arc(16, 23, 2.4, 0, 7); x.fill();
        x.fillStyle = "#ffd36e"; x.beginPath(); x.arc(21, 18, 1.6, 0, 7); x.fill();
      } }
  };
  /* things an arm can come back with */
  var FINDS = [["#7a7f8e", "#a9adb8"], ["#1d1b26", "#5a5f6e"], ["#ff8fd0", "#ffd0e8"], ["#7a4a2a", "#a0683a"], ["#c0303a", "#e8ecf5"]];
  /* the wreck: an old wooden ship listing hard on the seabed — weathered planks with ribs showing through,
     a faded stripe, a rust-red bottom, masts with their yards and rigging, and a chest spilling gold */
  var WRECK = { w: 136, h: 78, chest: [116, 64] };
  function drawWreck(x) {
    function ln(a, b, c, d, col, w) { x.strokeStyle = col; x.lineWidth = w || 1.2; x.beginPath(); x.moveTo(a, b); x.lineTo(c, d); x.stroke(); }
    x.fillStyle = "#7a6c52"; x.beginPath(); x.ellipse(66, 75, 66, 6, 0, 0, 7); x.fill();              /* sand */
    x.fillStyle = "#94866a"; x.beginPath(); x.ellipse(60, 74, 50, 3.5, 0, 0, 7); x.fill();
    [[14, 72, 4], [102, 71, 3], [124, 73, 2.5]].forEach(function (r) { x.fillStyle = "#5a5260"; x.beginPath(); x.arc(r[0], r[1], r[2], 0, 7); x.fill(); });
    x.save(); x.translate(68, 52); x.rotate(-.24);                      /* listing, bow up */
    /* masts first, behind the hull: the main still standing, the fore snapped, a bowsprit */
    x.fillStyle = "#4a3828"; x.fillRect(-12, -54, 3, 44); x.fillRect(22, -30, 3, 20);
    ln(25, -30, 31, -36, "#4a3828", 2.5);
    x.fillStyle = "#5a4430"; x.fillRect(-28, -46, 34, 2); x.fillRect(-22, -34, 24, 2);         /* yards */
    x.save(); x.translate(18, -28); x.rotate(.5); x.fillRect(-12, 0, 22, 2); x.restore();
    ln(42, -10, 62, -22, "#4a3828", 2.2);                                                       /* bowsprit */
    ln(-11, -54, -46, -14, "#3a2c20"); ln(-10, -54, 40, -12, "#3a2c20"); ln(-27, -46, -40, -16, "#3a2c20");
    ln(5, -46, 20, -14, "#3a2c20"); ln(-10, -40, 61, -21, "#3a2c20"); ln(23, -29, 60, -21, "#3a2c20");
    x.fillStyle = "#b8ab90"; x.beginPath(); x.moveTo(-26, -44); x.lineTo(-6, -44); x.lineTo(-10, -38); x.lineTo(-24, -36); x.fill();   /* rag of sail */
    /* the hull: a raised stern on the left, the bow up and right */
    function hull() { x.beginPath(); x.moveTo(-52, -22); x.lineTo(-40, -16); x.lineTo(30, -12); x.lineTo(50, -18); x.lineTo(56, -10);
      x.quadraticCurveTo(50, 8, 30, 14); x.lineTo(-30, 14); x.quadraticCurveTo(-48, 10, -54, -6); x.closePath(); }
    hull(); x.fillStyle = "#8a7a60"; x.fill();
    x.save(); hull(); x.clip();
    x.fillStyle = "#6e2e24"; x.fillRect(-60, 6, 120, 12);                                       /* rust-red bottom */
    x.fillStyle = "#8a4a2a"; [-40, -18, 6, 26].forEach(function (u) { x.fillRect(u, 6, 2, 8); });
    x.fillStyle = "#3e6a7a"; x.fillRect(-60, 1, 120, 5);                                        /* faded stripe */
    x.fillStyle = "#5a8a96"; x.fillRect(-60, 1, 120, 1);
    x.fillStyle = "#6a5a44"; for (var y = -20; y < 1; y += 3) x.fillRect(-60, y, 120, 1);      /* planks */
    x.fillStyle = "#1a120e"; x.fillRect(-14, -12, 18, 12); x.fillRect(12, -10, 9, 8); x.fillRect(-36, -9, 8, 9);   /* missing planks */
    x.fillStyle = "#6a5038"; [-12, -7, -2, 3, 14, 18, -34, -30].forEach(function (u) { x.fillRect(u, -13, 1.6, 14); });   /* ribs */
    x.restore();
    x.fillStyle = "#b8a888"; x.fillRect(-52, -23, 14, 2); x.fillRect(-40, -17, 70, 1.6); x.fillRect(30, -13, 21, 1.6);   /* rail */
    x.fillStyle = "#7a6a52"; [-36, -24, -12, 0, 12, 24].forEach(function (u) { x.fillRect(u, -20, 1.4, 4); });     /* stanchions */
    x.fillStyle = "#2f8a5a"; [[-44, 10], [-6, 13], [36, 9]].forEach(function (k) { for (var j = 0; j < 9; j++) x.fillRect(k[0] + Math.round(Math.sin(j * .8)), k[1] - j, 1.2, 1); });
    x.restore();
    /* the chest, lid up, gold spilling onto the sand */
    x.fillStyle = "#6a4426"; x.fillRect(108, 63, 16, 10); x.fillStyle = "#4a2e1a"; x.fillRect(108, 59, 16, 4); x.fillRect(108, 66, 16, 1);
    x.fillStyle = "#e3b552"; x.fillRect(109, 63, 14, 2); x.fillRect(114, 67, 3, 3); x.fillRect(104, 72, 5, 2); x.fillRect(125, 71, 4, 2);
    x.fillStyle = "#fff2c8"; x.fillRect(111, 63, 2, 1); x.fillRect(126, 71, 1, 1);
  }
  var HK = { w: 126, h: 28 };
  function drawHunter(x) {
    x.fillStyle = "#171a24"; rrect(x, 12, 12, 112, 13, 6.5); x.fill();
    x.fillStyle = "#252a38"; rrect(x, 12, 11, 112, 10, 5); x.fill();
    x.fillStyle = "#3a4156"; x.fillRect(18, 12, 100, 1);
    x.fillStyle = "#252a38"; x.beginPath(); x.moveTo(13, 12); x.lineTo(3, 16); x.lineTo(3, 20); x.lineTo(13, 24); x.fill();
    x.fillStyle = "#1d212d"; x.fillRect(4, 8, 4, 19);                    /* rudder */
    x.fillStyle = "#3a3f52"; x.fillRect(1, 15, 2, 7);                    /* screw */
    x.fillStyle = "#252a38"; rrect(x, 74, 2, 15, 11, 2); x.fill();       /* sail */
    x.fillStyle = "#3a4156"; x.fillRect(75, 2, 13, 1); x.fillRect(70, 6, 24, 2);
    x.fillStyle = "#5a6070"; x.fillRect(121, 17, 2, 2);                  /* tube door */
  }
  var IMG = {};
  function images() {
    IMG.dsv = {};
    Object.keys(DSV).forEach(function (k) { var c = pix(DSV[k].w, DSV[k].h, DSV[k].draw); IMG.dsv[k] = [c, flipped(c)]; });
    var h = pix(HK.w, HK.h, drawHunter); IMG.sub = [h, flipped(h)];
    IMG.wreck = pix(WRECK.w, WRECK.h, drawWreck);
    IMG.coin = [8, 6, 2, 6].map(function (w) {                       /* four turns of a spinning coin */
      return pix(10, 12, function (x) {
        x.fillStyle = "#b8862a"; x.beginPath(); x.ellipse(5, 6, w / 2 + .6, 5.6, 0, 0, 7); x.fill();
        x.fillStyle = "#ffd36e"; x.beginPath(); x.ellipse(5, 6, Math.max(.6, w / 2 - .4), 4.6, 0, 0, 7); x.fill();
        if (w > 3) { x.fillStyle = "#fff2c8"; x.fillRect(5 - w / 4, 3, 1, 5); }
      });
    });
    var F = ["...ffffff...", "..fFFFFFFf..", ".fFffffffFf.", "fFff.ff.ffFf", "ffffffffffff", ".ff.ffff.ff.", "ffffffffffff",
             ".ff.ffff.ff.", "ffffffffffff", ".ff.ffff.ff.", "..ffffffff..", "...ffffff...", "....ffff....", ".....ff....."];
    IMG.trilo = canvas(12, 14);
    var tx = IMG.trilo.getContext("2d");
    F.forEach(function (r, j) { for (var i = 0; i < 12; i++) if (r[i] !== ".") { tx.fillStyle = r[i] === "F" ? C.fossilHi : C.fossil; tx.fillRect(i, j, 1, 1); } });
  }

  /* ---------- layout ---------- */
  var P = 1.5, W = 0, H = 0, VW = 0, VH = 0, Z = null, S = null, key = "";
  function pageTop(n) { return n.getBoundingClientRect().top + scrollY; }
  /* one art pixel = one pixel of the city picture (2 image px of a 570-tall image, scaled to the city's height) */
  function pixelSize() {
    var city = document.querySelector(".city"), h = city && city.offsetHeight;
    if (!h) h = Math.max(220, Math.min(480, innerHeight * .4));
    return 2 * h / 570;
  }
  function layout() {
    VW = document.documentElement.clientWidth; VH = innerHeight;
    P = pixelSize();
    W = Math.ceil(VW / P); H = Math.ceil(VH / P) + 2;
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    ctx.imageSmoothingEnabled = false;
    cv.style.width = W * P + "px"; cv.style.height = H * P + "px";
    var start = hero ? pageTop(hero) + hero.offsetHeight : pageTop(main) + 40;
    var stTop = pageTop(station), stH = station.offsetHeight;
    var span = Math.max(400, stTop - start), ug = Math.round(Math.min(720, Math.max(240, span * .22)));
    var r = main.getBoundingClientRect(), cs = getComputedStyle(main);
    var colL = r.left + parseFloat(cs.paddingLeft), colR = r.right - parseFloat(cs.paddingRight);
    Z = { start: start, sea: start + ug, stTop: stTop, stH: stH, colL: colL, colR: colR };
    var k = [W, H, P.toFixed(3), Math.round(start), Math.round(stTop), Math.round(colL), theme].join();
    if (k !== key) { key = k; build(); }
  }

  /* ---------- the static parts, drawn once per layout ---------- */
  function build() {
    var gap = 12;
    S = { mL: Math.max(0, Z.colL - gap), mR: Math.min(VW, Z.colR + gap) };
    images();
    buildUnderground();
    buildSea();
    buildStation();
  }
  /* the underground: a band from the street down to the sea. Fixtures sit in the margins and fade out before the column. */
  function buildUnderground() {
    var R = seeded(7), rows = Math.ceil((Z.sea - Z.start) / P) + 1, ug = S.ug = canvas(W, rows), x = ug.getContext("2d");
    for (var j = 0; j < rows; j++) {
      var f = j / rows, g = Math.max(0, (f - .6) / .4);                   /* the last 40% fades into the sea */
      x.globalAlpha = C.ugA + (C.seaA - C.ugA) * g;
      x.fillStyle = g > 0 ? mix(C.ugBot, C.seaTop, g * g * (3 - 2 * g)) : mix(C.ugTop, C.ugBot, f / .6);
      x.fillRect(0, j, W, 1);
    }
    x.globalAlpha = 1;
    /* the fixtures, on their own layer so they can be faded at the column */
    var fx = canvas(W, rows), y = fx.getContext("2d");
    var mL = S.mL / P, mR = S.mR / P, room = W - mR;
    function mx(f) { return f < .5 ? mL * f * 2 : mR + room * (f - .5) * 2; }
    [.26, .52, .78].forEach(function (f, i) {                              /* strata */
      var yy = f * rows;
      for (var q = 0; q < W; q++) {
        var w = Math.round(yy + Math.sin(q / (22 + i * 9) + i) * 3 + Math.sin(q / 7 + i) * .8);
        y.fillStyle = C.strata; y.fillRect(q, w, 1, 1);
        if (q % 3 === 0) { y.fillStyle = C.strataLo; y.fillRect(q, w + 2, 1, 1); }
      }
    });
    for (var i = 0; i < 260; i++) { y.fillStyle = C.speck; y.fillRect(Math.round(mx(R())), Math.round(8 + R() * (rows - 12)), R() < .3 ? 2 : 1, 1); }
    for (var k = 0; k < 12; k++) {                                         /* the towers' piles */
      var px = Math.round(mx((k + .5) / 12 + (R() - .5) * .03)), pw = 4 + Math.round(R() * 3), ph = Math.round((60 + R() * 110) / P);
      y.fillStyle = C.pile; y.fillRect(px, 0, pw, ph);
      y.fillStyle = C.pileHi; y.fillRect(px, 0, 1, ph);
      y.fillStyle = C.pileSh; y.fillRect(px + pw - 1, 0, 1, ph); y.fillRect(px - 1, ph, pw + 2, 2);
    }
    [[.36, "A"], [.63, "B"]].forEach(function (p) {                       /* pipes, with flanges */
      var py = Math.round(p[0] * rows), c = C["pipe" + p[1]], h = C["pipe" + p[1] + "h"], s = C["pipe" + p[1] + "s"];
      y.fillStyle = c; y.fillRect(0, py, W, 6);
      y.fillStyle = h; y.fillRect(0, py + 1, W, 1);
      y.fillStyle = s; y.fillRect(0, py + 5, W, 1);
      for (var q = 10; q < W; q += 64) { y.fillStyle = h; y.fillRect(q, py - 2, 4, 10); y.fillStyle = s; y.fillRect(q + 3, py - 2, 1, 10); }
      S["pipe" + p[1]] = py;
    });
    var vx = Math.round(mR + room * .55), a = S.pipeA, b = S.pipeB;      /* a riser between them */
    y.fillStyle = C.pipeA; y.fillRect(vx, a, 6, b - a + 6); y.fillStyle = C.pipeAh; y.fillRect(vx + 1, a, 1, b - a + 6); y.fillStyle = C.pipeAs; y.fillRect(vx + 5, a, 1, b - a + 6);
    S.cable = Math.round(.49 * rows);
    y.fillStyle = C.cable; y.fillRect(0, S.cable, W, 2);
    var sx = Math.round(mL * .45), sy = Math.round(.75 * rows);           /* an old brick sewer, end on */
    for (var q2 = 0; q2 < 90; q2++) {
      var an = q2 / 90 * Math.PI * 2;
      y.fillStyle = (q2 % 6 === 0) ? C.brickHi : C.brick;
      y.fillRect(Math.round(sx + Math.cos(an) * 20), Math.round(sy + Math.sin(an) * 15), 3, 2);
    }
    y.drawImage(IMG.trilo, Math.round(mR + room * .3), Math.round(.85 * rows));
    /* fade the fixtures out over the last stretch before the column */
    var fade = 50 / P;
    y.globalCompositeOperation = "destination-out";
    var gL = y.createLinearGradient(mL - fade, 0, mL, 0); gL.addColorStop(0, "rgba(0,0,0,0)"); gL.addColorStop(1, "rgba(0,0,0,1)");
    y.fillStyle = gL; y.fillRect(mL - fade, 0, fade + 1, rows);
    var gR = y.createLinearGradient(mR, 0, mR + fade, 0); gR.addColorStop(0, "rgba(0,0,0,1)"); gR.addColorStop(1, "rgba(0,0,0,0)");
    y.fillStyle = gR; y.fillRect(mR - 1, 0, fade + 1, rows);
    y.fillStyle = "#000"; y.fillRect(mL, 0, mR - mL, rows);
    y.globalCompositeOperation = "source-over";
    x.globalAlpha = C.ugA; x.drawImage(fx, 0, 0); x.globalAlpha = 1;
    S.fade = [mL - fade, mL, mR, mR + fade];
  }
  /* the sea: one column of colour, stretched across */
  function buildSea() {
    var rows = Math.ceil((Z.stTop + Z.stH - Z.sea) / P) + 1, top = (Z.stTop - Z.sea) / P, s = S.sea = canvas(1, rows), x = s.getContext("2d");
    for (var j = 0; j < rows; j++) {
      var f = Math.min(1, j / Math.max(1, top));
      x.fillStyle = f < .3 ? mix(C.seaTop, C.seaMid, f / .3) : mix(C.seaMid, C.seaBot, (f - .3) / .7);
      x.fillRect(0, j, 1, 1);
    }
  }
  /* the station: a vault between two running tunnels, kept plain */
  var G = {};                                                         /* its geometry, in canvas px from the station's top */
  var T = { x: -4, v: 1.4, phase: "in", t: 0 }, CAR = 92, CGAP = 3, TH = 30, NCAR = 3, TL = 0;
  function buildStation() {
    var Hs = Math.round(Z.stH / P), tw = Math.round(Math.max(40, Math.min(130, W * .12)));
    NCAR = W > 560 ? 3 : 2; TL = NCAR * CAR + (NCAR - 1) * CGAP;
    var plat = Hs - 20, rail = plat + 10, trainTop = rail - TH, tunTop = trainTop - 7, tunBot = rail + 4, ceil = 7;
    G = { Hs: Hs, tw: tw, plat: plat, rail: rail, trainTop: trainTop, tunTop: tunTop, tunBot: tunBot, stop: Math.round(W / 2 + TL / 2) };
    var rc = Math.max(4, Math.min(tunTop - ceil, tw));                                /* the headwall curve, tunnel roof up to the vault */
    function roof(q) {
      if (q < tw || q >= W - tw) return tunTop;
      var d = q < W / 2 ? q - tw : W - 1 - tw - q;
      return d >= rc ? ceil : Math.round(ceil + rc - Math.sqrt(Math.max(0, rc * rc - (rc - d) * (rc - d))));
    }
    /* behind the train: rock, the vault wall, the line's stripe, one name plate, the tunnels' dark */
    var bg = S.stBg = canvas(W, Hs), x = bg.getContext("2d");
    var shell = 5;                                                     /* a rock shell round the tube; the sea shows above it */
    for (var q = 0; q < W; q++) {
      var r0 = roof(q), outer = Math.max(0, r0 - shell);
      x.fillStyle = C.rock; x.fillRect(q, outer, 1, Hs - outer);
      x.fillStyle = C.rockHi; x.fillRect(q, outer, 1, 1);
      if (q >= tw && q < W - tw) {
        for (var j = r0; j < plat; j++) {
          var f = Math.min(1, (j - ceil) / 26);                        /* dark where it curves overhead */
          x.fillStyle = mix(C.vault, C.wall, f * f); x.fillRect(q, j, 1, 1);
        }
      } else { x.fillStyle = C.tunnel; x.fillRect(q, tunTop, 1, tunBot - tunTop); }
    }
    var sy = trainTop - 16;
    x.fillStyle = C.stripe; x.fillRect(tw + rc, sy, W - 2 * (tw + rc), 2);
    var pw = 8 * 4 * 2 + 6, px = Math.round(W / 2 - pw / 2);
    x.fillStyle = C.plate; x.fillRect(px, sy - 7, pw, 16);
    text(x, "DEEP END", px + 4, sy - 4, 2, C.plateText);
    /* in front of the train: the tunnels' darkness and lining, and the platform edge */
    var fg = S.stFg = canvas(W, Hs), y = fg.getContext("2d");
    [[0, tw, 1], [W - tw, W, -1]].forEach(function (t) {
      for (var q = t[0]; q < t[1]; q++) {
        var depth = t[2] > 0 ? (tw - q) / tw : (q - (W - tw)) / tw;     /* darker the further in */
        y.globalAlpha = .55 + .4 * depth; y.fillStyle = C.tunnel; y.fillRect(q, tunTop, 1, tunBot - tunTop);
      }
      y.globalAlpha = 1; y.fillStyle = C.lining; y.fillRect(t[0], tunTop - 1, tw, 1); y.fillRect(t[0], tunBot, tw, 1);
    });
    y.fillStyle = C.lining;
    for (q = tw; q < tw + rc; q++) { y.fillRect(q, roof(q), 1, 1); y.fillRect(W - 1 - q, roof(W - 1 - q), 1, 1); }
    y.fillStyle = C.rock; y.fillRect(0, tunBot + 1, tw, Hs - tunBot - 1); y.fillRect(W - tw, tunBot + 1, tw, Hs - tunBot - 1);
    y.fillStyle = C.platFace; y.fillRect(tw, plat, W - 2 * tw, Hs - plat);
    y.fillStyle = C.platTop; y.fillRect(tw, plat, W - 2 * tw, 3);
    y.fillStyle = C.platEdge; y.fillRect(tw, plat + 3, W - 2 * tw, 1);
  }

  /* ---------- what moves: positions as fractions of the sea, so they survive a relayout ---------- */
  var cur = { x: -9999, y: -9999, cx: -9999, cy: -9999, in: false };   /* the cursor: page coords, and where it is on screen */
  var subs = [], due = [], sub, torps = [], fx = [], bubbles = [], debris = [], coins = [], score = { hits: 0, dodged: 0, coins: 0, imploded: 0 };
  function seaY(f) { return Z.sea + f * (Z.stTop - Z.sea); }
  /* three research subs at a time, never two the same; each new one sinks in from just above the screen */
  var POOL = Object.keys(DSV);
  function spawnDSV(k, settled) {
    var free = POOL.filter(function (q) { return !subs.some(function (v) { return v.k === q; }); });
    k = k || free[Math.floor(Math.random() * free.length)];
    var d = DSV[k], span = Z.stTop - Z.sea;
    var top = Math.max(Z.sea + 20, Math.min(Z.stTop - 120, scrollY - d.h * P - 20));
    var v = { k: k, x: d.cable ? rnd(.08, .85) * VW : rnd(.05, .85) * VW, y: top, dir: Math.random() < .5 ? 1 : -1, v: rnd(.12, .3),
              state: "sink", mode: "hover", t: 0, arm: 0, find: null, imp: 0 };
    v.ty = Math.min(Z.stTop - 90, top + rnd(140, Math.max(160, innerHeight * .7)));
    if (settled) { v.y = v.ty = Z.sea + rnd(.1, .85) * span; v.state = "live"; }
    subs.push(v);
    return v;
  }
  function vesselsInit() {
    sub = { fy: .42, x: -160, dir: 1, cool: 240 };
    for (var i = 0; i < 3; i++) spawnDSV(null, true);
  }

  /* ---------- per-frame drawing, in canvas pixels ---------- */
  var base = 0;                                                        /* page y of the canvas's top row */
  function ay(y) { return Math.round((y - base) / P); }
  function ax(x) { return Math.round(x / P); }
  function rect(x, y, w, h, col) { ctx.fillStyle = col; ctx.fillRect(x, y, w, h); }
  function near(x, y, r) { var dx = x - cur.x, dy = y - cur.y; return cur.in && dx * dx + dy * dy < r * r; }
  function inColumn(x, w) { return x + (w || 0) > S.mL && x < S.mR; }  /* the project boxes' column, page x */
  var FADE = .2;                                                       /* how much shows through behind it */
  function blit(img, pageY) {                                          /* a prerendered band, at its place on the page */
    var y = ay(pageY);
    if (y > H || y + img.height < 0) return y;
    ctx.drawImage(img, 0, y);
    return y;
  }

  function underground(t) {
    var y = blit(S.ug, Z.start);
    if (y > H || y + S.ug.height < 0) return;
    /* packets along the cable, only in the margins */
    var cy = y + S.cable;
    for (var k = 0; k < 6; k++) {
      var px = ((t * .9 + k * W / 6) % (W + 20)) - 10;
      if (px > S.fade[1] - 3 && px < S.fade[2]) continue;
      ctx.globalAlpha = px > S.fade[0] && px < S.fade[3] ? .35 : .8;
      rect(Math.round(px), cy, 5, 2, C.pulse);
    }
    ctx.globalAlpha = 1;
  }
  function sea() {
    var y = ay(Z.sea);
    if (y > H || y + S.sea.height < 0) return;
    var from = Math.max(0, -y), to = Math.min(S.sea.height, H - y);
    if (to <= from) return;
    ctx.globalAlpha = C.seaA;
    ctx.drawImage(S.sea, 0, from, 1, to - from, 0, y + from, W, to - from);
    ctx.globalAlpha = 1;
  }
  /* each sub picks something to do: cruise, hover, put out an arm and grab something, blow bubbles, turn round */
  function choose(v) {
    var d = DSV[v.k], r = Math.random();
    v.t = 0;
    if (d.cable) { v.mode = r < .4 ? "hover" : r < .65 ? "bubbles" : "winch"; if (v.mode === "winch") v.ty = Math.max(Z.sea + 60, Math.min(Z.stTop - 90, v.y + rnd(-160, 160))); v.len = rnd(120, 300); return; }
    if (r < .38) { v.mode = "cruise"; v.len = rnd(240, 600); if (Math.random() < .5) v.ty = Math.max(Z.sea + 40, Math.min(Z.stTop - 90, v.y + rnd(-140, 140))); }
    else if (r < .55) { v.mode = "hover"; v.len = rnd(100, 240); }
    else if (r < .77 && d.arm) { v.mode = "grab"; v.len = 150; v.find = FINDS[Math.floor(Math.random() * FINDS.length)]; }
    else if (r < .9) { v.mode = "bubbles"; v.len = 60; }
    else { v.mode = "cruise"; v.len = rnd(200, 400); v.dir *= -1; }
  }
  function vessels(t, dt) {
    due = due.filter(function (q) { q.t -= dt; if (q.t <= 0) { spawnDSV(); return false; } return true; });
    subs = subs.filter(function (v) {
      var d = DSV[v.k], img = IMG.dsv[v.k][v.dir > 0 ? 0 : 1], wpx = d.w * P, hpx = d.h * P;
      if (v.state === "sink") {                                     /* coming down from above, swaying */
        v.y += .8 * dt; v.x += Math.sin(t / 40 + v.ty) * .25 * dt;
        if (v.y >= v.ty) { v.state = "live"; choose(v); }
      } else if (v.state === "live") {
        v.t += dt;
        if (v.mode === "cruise") { v.x += v.dir * v.v * dt; if (v.x > VW + 30) v.dir = -1; if (v.x < -wpx - 30) v.dir = 1; }
        if (v.mode === "bubbles" && Math.random() < .6) bubbles.push({ x: v.x + wpx * rnd(.3, .7), y: v.y + 2, v: rnd(.6, 1.4), ph: rnd(0, 6), life: rnd(90, 180) });
        if (v.mode === "grab") v.arm = v.t < 50 ? v.t / 50 : v.t < 80 ? 1 : Math.max(0, 1 - (v.t - 80) / 50);
        else v.arm = Math.max(0, v.arm - .05 * dt);
        v.y += (v.ty - v.y) * .01 * dt;
        if (v.t > v.len) choose(v);
      } else {                                                      /* imploding */
        v.imp += .05 * dt;
        if (v.imp >= 1) {
          var cx = v.x + wpx / 2, cy = v.y + hpx / 2;
          for (var i = 0; i < 40; i++) bubbles.push({ x: cx + rnd(-wpx / 2, wpx / 2), y: cy + rnd(-hpx / 2, hpx / 2), v: rnd(.8, 2.4), ph: rnd(0, 6), life: rnd(60, 140) });
          for (i = 0; i < 18; i++) debris.push({ x: cx, y: cy, vx: rnd(-1.6, 1.6), vy: rnd(-1.4, .6), life: rnd(80, 160), c: ["#c9ccd6", "#8a8f9e", "#5a5f6e", d.k === "mir" ? "#f2c230" : "#e0402a"][i % 4] });
          fx.push({ x: cx, y: cy, r: 1, max: 30 / P, life: 1 });
          due.push({ t: rnd(120, 300) });
          return false;
        }
      }
      v.box = { x: v.x, y: v.y - 6, w: wpx, h: hpx + 12 };
      var y = ay(v.y + (v.state === "live" ? Math.sin(t / 90 + v.x) * 4 : 0)), x = ax(v.x);
      if (d.cable) {                                                /* the bathysphere hangs from its cable */
        ctx.globalAlpha = inColumn(v.x + wpx / 2) ? FADE : .8;
        rect(x + (d.w >> 1) - 1, Math.max(0, ay(Z.sea)), 1, Math.max(0, y - Math.max(0, ay(Z.sea))), "#9aa0b0");
      }
      if (y < -d.h - 40 || y > H + 10) return true;
      ctx.globalAlpha = inColumn(v.x, wpx) ? FADE : 1;
      if (v.state === "implode") {                                   /* crushed in from every side */
        var s = Math.max(.08, 1 - v.imp * .92), j = (Math.random() - .5) * 2 * (1 - s);
        ctx.drawImage(img, Math.round(x + d.w * (1 - s) / 2 + j), Math.round(y + d.h * (1 - s) / 2), Math.max(1, Math.round(d.w * s)), Math.max(1, Math.round(d.h * s)));
        if (v.imp < .25) { ctx.globalAlpha = .7; rect(x, y, d.w, d.h, "#fff6d8"); }
        ctx.globalAlpha = 1;
        return true;
      }
      if (!d.cable) {                                               /* lamps ahead into the dark */
        ctx.fillStyle = C.beam; ctx.beginPath();
        var fx0 = v.dir > 0 ? x + img.width : x, my = y + (img.height >> 1);
        ctx.moveTo(fx0, my); ctx.lineTo(fx0 + v.dir * 90, my - 26); ctx.lineTo(fx0 + v.dir * 90, my + 30); ctx.fill();
      }
      ctx.drawImage(img, x, y);
      if (v.arm > 0 && d.arm) {                                     /* the manipulator: out, down, a grab, back */
        var rx = x + (v.dir > 0 ? Math.round(d.w * d.arm[0]) : Math.round(d.w * (1 - d.arm[0]))), ry = y + Math.round(d.h * d.arm[1]);
        var ex = rx + v.dir * Math.round(9 * v.arm), ey = ry + Math.round(3 * v.arm), hx = ex + v.dir * Math.round(5 * v.arm), hy = ey + Math.round(9 * v.arm);
        for (var q = 0; q <= 8; q++) { rect(Math.round(rx + (ex - rx) * q / 8), Math.round(ry + (ey - ry) * q / 8), 2, 2, "#8a8f9e"); rect(Math.round(ex + (hx - ex) * q / 8), Math.round(ey + (hy - ey) * q / 8), 2, 2, "#9aa0b0"); }
        rect(hx - 2, hy + 1, 2, 3, "#5a5f6e"); rect(hx + 2, hy + 1, 2, 3, "#5a5f6e");
        if (v.find && v.t > 65) { rect(hx - 1, hy + 2, 4, 3, v.find[0]); rect(hx, hy + 2, 2, 1, v.find[1]); }
      }
      ctx.globalAlpha = 1;
      if (Math.random() < .006) bubbles.push({ x: v.x + wpx / 2, y: v.y, v: rnd(.4, .7), ph: rnd(0, 6), life: 200 });
      return true;
    });
  }
  function implode(v) {
    if (v.state === "implode") return;
    v.state = "implode"; v.imp = 0; score.imploded++;
    thump();
    say(DSV[v.k].line);
  }
  /* the wreck on the seabed, in a margin; click it for coins */
  var wreckBox = null;
  function wreck(dt) {
    wreckBox = null;
    if (!G.Hs) return;
    var mR = S.mR / P, mL = S.mL / P, ww = WRECK.w, room = W - mR, x;
    if (mL >= ww * .7 + 4) x = Math.min(Math.floor(mL) - ww - 4, 8);         /* left: the theme button lives bottom right */
    else if (room >= ww * .7 + 4) x = Math.max(Math.ceil(mR) + 4, W - ww - 8);
    else return;
    var y = ay(Z.stTop) + G.tunTop - 5 - WRECK.h + 6;
    if (y > H || y + WRECK.h < 0) return;
    ctx.drawImage(IMG.wreck, x, y);
    wreckBox = { x: x * P, y: base + y * P, w: ww * P, h: WRECK.h * P, cx: (x + WRECK.chest[0]) * P, cy: base + (y + WRECK.chest[1]) * P };
  }
  function coin() {
    if (!wreckBox) return;
    coins.push({ x: wreckBox.cx + rnd(-6, 6), y: wreckBox.cy, vy: -5.5, t: 0 });
    score.coins++;
    ding();
    var c = score.coins;
    if (c === 1) say("A coin! The wreck still pays out.");
    else if (c === 10 || c === 25 || c === 50 || c === 100) say(c + " coins. " + (c >= 50 ? "That chest is bottomless." : "Keep clicking."));
  }
  function coinsAndDebris(dt) {
    coins = coins.filter(function (o) {
      o.y += o.vy * dt; o.vy += .3 * dt; o.t += dt;
      var img = IMG.coin[Math.floor(o.t / 3) % 4];
      if (o.vy > 1.2) {                                             /* at the top of its hop: a sparkle, and gone */
        fx.push({ x: o.x, y: o.y, r: 1, max: 10 / P, life: .8, spark: true });
        return false;
      }
      ctx.drawImage(img, ax(o.x) - 5, ay(o.y) - 6);
      return true;
    });
    debris = debris.filter(function (b) {
      b.x += b.vx * dt; b.y += b.vy * dt; b.vy += .02 * dt; b.vx *= Math.pow(.98, dt); b.life -= dt;
      ctx.globalAlpha = inColumn(b.x) ? .3 : 1;
      rect(ax(b.x), ay(b.y), 2, 2, b.c);
      ctx.globalAlpha = 1;
      return b.life > 0;
    });
  }
  /* a few sounds, made here: a coin, and the dull crump of a hull giving way */
  var AC = null;
  function audio() {
    try { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === "suspended") AC.resume(); } catch (e) { AC = null; }
    return AC;
  }
  function ding() {
    var ac = audio(); if (!ac) return;
    [[1047, 0, .07], [1568, .07, .32]].forEach(function (n) {
      var o = ac.createOscillator(), g = ac.createGain(), t0 = ac.currentTime + n[1];
      o.type = "square"; o.frequency.value = n[0];
      g.gain.setValueAtTime(.05, t0); g.gain.exponentialRampToValueAtTime(.001, t0 + n[2]);
      o.connect(g); g.connect(ac.destination); o.start(t0); o.stop(t0 + n[2] + .02);
    });
  }
  function thump() {
    var ac = audio(); if (!ac) return;
    var o = ac.createOscillator(), g = ac.createGain(), t0 = ac.currentTime;
    o.frequency.setValueAtTime(140, t0); o.frequency.exponentialRampToValueAtTime(35, t0 + .4);
    g.gain.setValueAtTime(.25, t0); g.gain.exponentialRampToValueAtTime(.001, t0 + .5);
    o.connect(g); g.connect(ac.destination); o.start(t0); o.stop(t0 + .55);
  }
  /* the hunter-killer: patrols, and fires on the cursor when it lingers in range outside the column */
  function hunter(t, dt) {
    var img = IMG.sub[sub.dir > 0 ? 0 : 1], wpx = img.width * P, wy = seaY(sub.fy) + Math.sin(t / 120) * 8;
    sub.x += sub.dir * .4 * dt;
    if (sub.x > VW + 60) sub.dir = -1; if (sub.x < -wpx - 60) sub.dir = 1;
    sub.box = { x: sub.x, y: wy, w: wpx, h: img.height * P };
    var y = ay(wy), on = y > -30 && y < H;
    if (on) { ctx.globalAlpha = inColumn(sub.x, wpx) ? FADE : 1; ctx.drawImage(img, ax(sub.x), y); ctx.globalAlpha = 1; }
    sub.cool -= dt;
    if (!REDUCED && on && cur.in && !inColumn(cur.x) && Math.abs(cur.y - wy) < 420 && sub.cool <= 0 && torps.length < 2 && sub.x > -20 && sub.x < VW - 20) {
      fire(cur.x, cur.y);
      sub.cool = rnd(200, 330);
    }
  }
  function fire(tx, ty) {
    var wpx = HK.w * P, wy = sub.box ? sub.box.y + 18 * P : seaY(sub.fy), bx = sub.x + (sub.dir > 0 ? wpx : 0);
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
      if (Math.random() < .5) bubbles.push({ x: p.x - Math.cos(p.a) * 14, y: p.y, v: rnd(.2, .5), ph: rnd(0, 6), life: 60 });
      var x = ax(p.x), y = ay(p.y), ca = Math.cos(p.a), sa = Math.sin(p.a);
      ctx.globalAlpha = inColumn(p.x) ? .3 : 1;
      for (var i = 0; i < 14; i++) rect(Math.round(x - ca * i), Math.round(y - sa * i), 2, 2, i < 2 ? "#ff3e5a" : i > 11 ? "#3a3f52" : "#6a7080");
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
    fx.push({ x: x, y: y, r: 1, max: (small ? 18 : 42) / P, life: 1 });
    for (var i = 0; i < (small ? 6 : 18); i++) bubbles.push({ x: x + rnd(-12, 12), y: y + rnd(-12, 12), v: rnd(.6, 1.6), ph: rnd(0, 6), life: rnd(40, 90) });
  }
  function effects(dt) {
    fx = fx.filter(function (e) {
      e.r += (e.max - e.r) * .15 * dt; e.life -= .03 * dt;
      ctx.globalAlpha = Math.max(0, e.life);
      var x = ax(e.x), y = ay(e.y), k = Math.round(e.max * 2.4);
      if (e.spark) {                                                  /* four points of light */
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { rect(Math.round(x + d[0] * e.r), Math.round(y + d[1] * e.r), 2, 2, "#fff2c8"); });
        ctx.globalAlpha = 1; return e.life > 0;
      }
      if (e.life > .7) rect(x - 4, y - 4, 9, 9, "#fff6d8");
      for (var i = 0; i < k; i++) { var a = i / k * 6.283; rect(Math.round(x + Math.cos(a) * e.r), Math.round(y + Math.sin(a) * e.r), 2, 2, e.r < e.max * .6 ? "#ffd36e" : "#ff8fd0"); }
      ctx.globalAlpha = 1;
      return e.life > 0;
    });
    bubbles = bubbles.filter(function (b) {
      b.y -= b.v * dt; b.ph += .1 * dt; b.life -= dt;
      if (b.y < Z.sea) return false;
      ctx.globalAlpha = inColumn(b.x) ? .3 : 1;
      rect(ax(b.x + Math.sin(b.ph) * 3), ay(b.y), 2, 2, C.bubble);
      ctx.globalAlpha = 1;
      return b.life > 0;
    });
    if (bubbles.length > 120) bubbles.splice(0, bubbles.length - 120);
  }

  /* ---------- the station ---------- */
  function stationScene(dt) {
    var top = ay(Z.stTop), shown = top < H && top + G.Hs > 0;
    if (shown) ctx.drawImage(S.stBg, 0, top);
    train(dt, top, shown);
    if (!shown) return;
    ctx.drawImage(S.stFg, 0, top);
    /* the cab's lamps light the tunnel ahead */
    var front = Math.round(T.x);
    if ((front < G.tw || front > W - G.tw) && front > -20 && front < W + 40 && T.phase !== "gap") {
      ctx.globalAlpha = .18; ctx.fillStyle = C.lamp;
      ctx.beginPath(); ctx.moveTo(front, top + G.trainTop + 18); ctx.lineTo(front + 60, top + G.tunTop + 1); ctx.lineTo(front + 60, top + G.tunBot - 1); ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
  /* trains: out of the left tunnel, stop, doors, into the right one. The cursor on the track stops them. */
  function train(dt, top, visible) {
    var block = Infinity, cx = cur.x / P, cyy = (cur.y - base) / P - top;
    if (visible && cur.in && cyy > G.trainTop - 8 && cyy < G.rail + 6 && cx > T.x - 1 && cx - T.x < 160) block = cx - 4;
    if (T.phase === "gap") { T.t -= dt; if (T.t <= 0) { T.phase = "in"; T.x = -4; T.v = 1.6; } return; }
    if (T.phase === "dwell") {
      T.t -= dt;
      if (T.t <= 0) { T.phase = "out"; if (visible) sayOnce("doors", "Mind the doors, please."); }
    } else {
      var target = Math.min(T.phase === "in" ? G.stop : W + TL + 40, block);
      if (block < Infinity && visible) { T.blocked = true; sayOnce("horn", "The driver leans on the horn. Off the tracks!"); } else T.blocked = false;
      for (var n = Math.max(1, Math.ceil(dt)), k = 0; k < n; k++) {     /* small steps, the same at any frame rate */
        var dist = target - T.x, want = dist <= 0 ? 0 : Math.min(2.6, Math.sqrt(2 * .03 * dist));
        T.v += Math.max(-.08, Math.min(.03, want - T.v)) * dt / n;
        if (dist <= .05) T.v = 0;
        T.x += Math.max(0, T.v) * dt / n;
      }
      if (T.phase === "in" && !T.blocked && Math.abs(G.stop - T.x) < .6 && T.v < .05) { T.phase = "dwell"; T.t = 220; T.x = G.stop; T.v = 0; }
      if (T.phase === "out" && T.x - TL > W + 10) { T.phase = "gap"; T.t = rnd(140, 320); }
    }
    if (!visible) return;
    var open = T.phase === "dwell" && T.t > 40, y = top + G.trainTop;
    for (var c = 0; c < NCAR; c++) {
      var x2 = Math.round(T.x - c * (CAR + CGAP)), x1 = x2 - CAR;
      if (x2 < 0 || x1 > W) continue;
      car(x1, y, c === 0, c === NCAR - 1, open);
    }
  }
  /* one tube car: rounded roof, a band of windows, two pairs of doors */
  function car(x1, y, cab, tail, open) {
    rect(x1 + 4, y, CAR - 8, 1, C.roof); rect(x1 + 2, y + 1, CAR - 4, 1, C.roof); rect(x1 + 1, y + 2, CAR - 2, 1, C.roof);
    rect(x1, y + 3, CAR, TH - 3, C.car);
    rect(x1, y + 3, CAR, 1, C.carHi);
    rect(x1, y + TH - 6, CAR, 6, C.carSh);
    for (var w = x1 + 6; w < x1 + CAR - 10; w += 11) {
      if ((w - x1 > 20 && w - x1 < 34) || (w - x1 > 58 && w - x1 < 72)) continue;   /* the doors go here */
      rect(w, y + 7, 8, 8, C.win); rect(w, y + 14, 8, 1, C.winSh);
    }
    [22, 60].forEach(function (d) {
      if (open) { rect(x1 + d - 4, y + 5, 4, TH - 8, C.door); rect(x1 + d + 12, y + 5, 4, TH - 8, C.door); rect(x1 + d, y + 5, 12, TH - 8, C.tunnel); }
      else {
        rect(x1 + d, y + 5, 12, TH - 8, C.door); rect(x1 + d + 6, y + 5, 1, TH - 8, C.doorSh);
        rect(x1 + d + 2, y + 8, 3, 6, C.win); rect(x1 + d + 8, y + 8, 3, 6, C.win);
      }
    });
    if (cab) {                                                       /* the cab: rounded nose, windscreen, lamps */
      rect(x1 + CAR, y + 4, 2, TH - 6, C.car); rect(x1 + CAR + 2, y + 7, 1, TH - 10, C.carSh);
      rect(x1 + CAR - 7, y + 6, 6, 9, C.tunnel);
      rect(x1 + CAR, y + TH - 9, 2, 2, C.lamp);
      if (T.blocked && Math.floor(performance.now() / 150) % 2) rect(x1 + CAR - 5, y + 17, 2, 2, C.tail);
    }
    if (tail) { rect(x1 - 1, y + 5, 1, TH - 8, C.carSh); rect(x1, y + TH - 9, 2, 2, C.tail); }
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
    stationScene(dt);
    wreck(dt);
    coinsAndDebris(dt);
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
    subs.forEach(function (v) { if (v.box && v.state !== "implode" && !inColumn(v.box.x, v.box.w)) out.push({ b: v.box, act: function () { implode(v); } }); });
    if (sub.box && !inColumn(sub.box.x, sub.box.w)) out.push({ b: sub.box, act: function () { say("A hunter-killer on silent running. It doesn't like cursors."); } });
    if (wreckBox) out.push({ b: wreckBox, act: coin });
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
    if (t) t.act();
  });
  document.addEventListener("visibilitychange", wake);

  readTheme(); layout(); vesselsInit(); wake();
  window.addEventListener("resize", function () { layout(); wake(); });
  if ("ResizeObserver" in window) new ResizeObserver(function () { layout(); wake(); }).observe(body);

  /* for the tests */
  window.depths = {
    zones: function () { return Z; }, train: function () { return T; }, torps: function () { return torps; },
    score: score, sub: function () { return sub; }, fire: fire, layout: layout, things: things, spawn: spawnDSV,
    cursor: function () { return { x: cur.x, y: cur.y, in: cur.in, base: base, P: P, W: W, frames: frames }; },
    /* the track: page y through the middle of the train, and where trains come out of the tunnel (canvas px) */
    fleet: function () { return subs; }, wreck: function () { return wreckBox; }, coin: coin, implode: implode,
    track: function () { return { y: Z.stTop + (G.trainTop + TH / 2) * P, P: P, tw: G.tw, stop: G.stop }; }
  };
})();
