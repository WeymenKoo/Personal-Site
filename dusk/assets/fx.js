/* =====================================================================
   fx.js — the moving parts, on every page:
     · quotes (hero, footer, end of each article)
     · the sky over the title screen: stars, shooting stars, the ship
       and the aliens it shoots down, or a launch, a landing, the station
       or a capsule, all nudged gently aside by the cursor, like wind
     · the drinks on the bar, which the cursor can push and slide
     · the lightbox for article pictures
     · a few things hidden for whoever goes looking
   Nothing here is needed to read the site; with reduced motion the
   sky holds still.
   ===================================================================== */
(function () {
  "use strict";

  var REDUCED = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ASSETS = (document.currentScript && document.currentScript.src || "").replace(/[^/]*$/, "");

  function $(s, r) { return (r || document).querySelector(s); }
  function el(tag, cls) { var n = document.createElement(tag); if (cls) n.className = cls; return n; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

  /* ---------- toast ---------- */
  var toastT;
  function toast(msg) {
    var t = $("#toast");
    if (!t) { t = el("div", "toast"); t.id = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add("on");
    clearTimeout(toastT);
    toastT = setTimeout(function () { t.classList.remove("on"); }, 3200);
  }

  /* ================================================================
     QUOTES
     ================================================================ */
  var LINES = [
    { q: "Tough and competent.", src: "Gene Kranz, Mission Control" },
    { q: "Nature cannot be fooled.", src: "Feynman, Challenger appendix" },
    { q: "I cannae change the laws of physics.", src: "Scotty — on the thermal budget" },
    { q: "Life finds a way.", src: "Jurassic Park — see: bodge wire" },
    { q: "Wake up, samurai.", src: "Cyberpunk 2077 — first power-on" },
    { q: "My favourite programming language is solder.", src: "Bob Pease" },
    { q: "Keep it simple, stupid.", src: "Kelly Johnson, Skunk Works" },
    { q: "Praise the sun.", src: "Dark Souls — the official religion of golden hour" },
    { q: "It's dangerous to go alone! Take this.", src: "Zelda — handing someone a multimeter" },
    { q: "Kept you waiting, huh?", src: "Metal Gear Solid — every board back from the fab" },
    { q: "The cake is a lie.", src: "Portal — on 'typical' values in a datasheet" },
    { q: "做人如果冇夢想，同條鹹魚有咩分別？", src: "Shaolin Soccer — why I keep starting projects" },
    { q: "不如我哋由頭嚟過。", src: "Happy Together — the official motto of Rev 2" },
    { q: "對唔住，我係差人。", src: "Infernal Affairs — the bug, finally revealing itself" },
    { q: "Be water, my friend.", src: "Bruce Lee — also my cooling strategy" },
    { q: "直面天命", src: "Black Myth: Wukong — before every first power-on" },
    { q: "If this deadline must have a date, make it ten thousand years.", src: "after A Chinese Odyssey" },
    { q: "Every capacitor has an expiry date.", src: "after Chungking Express" },
    { q: "The moon represents my heart. The oscilloscope represents my feelings.", src: "after Teresa Teng" },
    { q: "Forecast: 晴天. Actual: blue hour.", src: "after Jay Chou" },
    { q: "海闊天空 on repeat, 3 a.m., reflow oven still warm.", src: "after Beyond" }
  ];
  function setQuote(fig, line) {
    if (!fig) return;
    var bq = fig.querySelector("blockquote"), cap = fig.querySelector("figcaption");
    if (!bq) { bq = el("blockquote"); fig.appendChild(bq); }
    if (!cap) { cap = el("figcaption"); fig.appendChild(cap); }
    bq.textContent = "“" + line.q + "”";
    cap.textContent = line.src;
  }
  var qi = Math.floor(Math.random() * LINES.length);
  var hero = $("#heroQuote"), off = $("#offLine");
  setQuote(hero, LINES[qi]);
  setQuote(off, LINES[(qi + 1 + Math.floor(Math.random() * (LINES.length - 1))) % LINES.length]);
  if (hero && !REDUCED) {
    setInterval(function () {
      hero.classList.add("fade");
      setTimeout(function () { qi = (qi + 1) % LINES.length; setQuote(hero, LINES[qi]); hero.classList.remove("fade"); }, 600);
    }, 7000);
  }

  /* ================================================================
     PIXEL SPRITES — rows of characters, one colour per letter.
     All drawn for this site.
     ================================================================ */
  var SPR = {
    ship: { pal: { "#": "#efe4ff", c: "#7ff3ff", o: "#ff8fd0" }, rows: [
      "......#......", ".....###.....", ".....#c#.....", "....##c##....", "....#####....", "..#.#####.#..",
      "..#########..", ".###########.", "##.#######.##", "#...##.##...#", ".....#.#.....", "....o...o...."] },
    alien: { pal: { x: "#7dff7a", e: "#1a0d2e", a: "#c6ffb0" }, rows: [
      "..a...a..", "...x.x...", ".xxxxxxx.", "xxexxxexx", "xxxxxxxxx", ".x.x.x.x.", "x.......x"] },
    /* spacecraft, side views */
    starship: { pal: { s: "#c7cbd6", d: "#9aa0b0", t: "#2a2a33", f: "#5a5f6e" }, rows: [
      "...s...", "..sst..", "..sst..", ".fsstf.", ".fsstf.", "..sst..", "..sst..", "..sst..", "..sst..", "..sst..",
      "..sst..", "..sst..", "..sst..", ".fsstf.", "ffsstff", "..sst..", ".ddddd.", ".dsssd.", "..sss..", "..sss..",
      "..sss..", "..sss..", "..sss..", "..sss..", "..sss..", "..sss..", "..sss..", "..sss..", "..sss..", "..sss..",
      "..sss..", "..sss..", "..sss..", "..sss..", ".sssss.", ".d.d.d."] },
    booster: { pal: { s: "#c7cbd6", d: "#9aa0b0", f: "#5a5f6e" }, rows: [
      "fdddddf", ".dsssd.", "..sss..", "..sss..", "..sss..", "..sss..", "..sss..", "..sss..", "..sss..", "..sss..",
      "..sss..", "..sss..", "..sss..", "..sss..", "..sss..", "..sss..", "..sss..", "..sss..", ".sssss.", ".d.d.d."] },
    shuttle: { pal: { w: "#f2f2f2", g: "#c9ccd6", k: "#22232b", e: "#8a8f9e" }, rows: [
      "..k.......................", "..kk......................", "..kkk.....................", ".ekwwwwwwwwwwwwwwwwwww....",
      "eekwwwwwwwwwwwwwwwwwwwwk..", ".ekggggwwwwwwwwwwwwwwwkkk.", "....ggggggggwwwwwwkkkkkkk.", ".......gggggggggkkkkkk....", "..........kkkkkkk........."], face: 1 },
    station: { pal: { p: "#3a5ba8", b: "#d9a43a", t: "#c9ccd6", w: "#f2f2f2", r: "#ff4f6d" }, rows: [
      "pppp.pppp.........pppp.pppp", "pppp.pppp.........pppp.pppp", "pppp.pppp....w....pppp.pppp", "..t...t.....www.....t...t..",
      "ttttttttttttwwwwwttttttttttt", "..t...t.....www.....t...t..", "pppp.pppp....w....pppp.pppp", "pppp.pppp....b....pppp.pppp", "pppp.pppp.........pppp.pppp"] },
    capsule: { pal: { w: "#e9ebf2", d: "#9aa0b0", k: "#2a2a33" }, rows: [
      "....w....", "...www...", "..wwwww..", "..wwdww..", ".wwwwwww.", ".wwwwwww.", "wwwwwwwww", "kkkkkkkkk"] },
    chute: { pal: { o: "#ff8a3d", w: "#f2f2f2", l: "#9aa0b0" }, rows: [
      "...ooowww...", ".oowwwoooww.", "oowwwoooowwo", "l..........l", ".l........l.", "..l......l..", "...l....l...", "....l..l...."] },
    /* the round on the bar */
    martini: { pal: { g: "rgba(239,228,255,.72)", h: "rgba(239,228,255,.45)", l: "#ff8fd0", c: "#ff3e5a" }, rows: [
      "gggggggggcg", ".hhhhhhhhh.", "..lllllll..", "...lllll...", "....hhh....", ".....g.....", ".....g.....", ".....g.....",
      ".....g.....", ".....g.....", ".....g.....", ".....g.....", ".....g.....", "...ggggg..."] },
    rocks: { pal: { g: "rgba(239,228,255,.72)", l: "#ffb347", i: "rgba(255,255,255,.75)" }, rows: [
      "g......g", "g......g", "g......g", "g......g", "gllllllg", "gliilllg", "gliilllg", "gllllllg", "gllllllg", "gggggggg"] },
    highball: { pal: { g: "rgba(239,228,255,.72)", l: "#7ff3ff", s: "#ff8fd0", m: "#5ef0a6" }, rows: [
      "......s", ".....s.", "g...s.g", "g..s..g", "gllsllg", "gllslmg", "glllllg", "glllllg", "glllllg", "glllllg", "glllllg", "glllllg", "ggggggg"] },
    wine: { pal: { g: "rgba(239,228,255,.72)", l: "#a3245a" }, rows: [
      "g.....g", "g.....g", "glllllg", "glllllg", ".glllg.", "..ggg..", "...g...", "...g...", "...g...", "...g...", ".ggggg."] },
    pint: { pal: { g: "rgba(239,228,255,.72)", f: "#fff6e0", l: "#e8a33a" }, rows: [
      "ffffffff", "gffffffg", "gllllllg", "gllllllg", "gllllllg", "gllllllg", ".gllllg.", ".gllllg.", ".gllllg.", ".gllllg.", ".gggggg."] },
    mug: { pal: { m: "#efe4ff", c: "#5a3a2a", s: "rgba(239,228,255,.5)" }, rows: [
      "..s..s....", ".s..s.....", "..s..s....", "mmmmmmm...", "mccccmmmm.", "mmmmmmm..m", "mmmmmmm..m", "mmmmmmmmm.", "mmmmmmm...", ".mmmmm...."] },
    tokkuri: { pal: { b: "#e8e3d6", k: "#3a5ba8", c: "#e8e3d6" }, rows: [
      "..bb..", "..bb..", ".bbbb.", "bbbbbb", "bkkkkb", "bbbbbb", "bbbbbb", "bbbbbb", ".bbbb.", "......", ".c..c."] }
  };
  function sprite(name, scale, flip) {
    var s = SPR[name], h = s.rows.length, w = s.rows[0].length;
    var c = el("canvas"); c.width = w * scale; c.height = h * scale;
    var x = c.getContext("2d");
    s.rows.forEach(function (row, j) {
      for (var i = 0; i < w; i++) {
        var col = s.pal[row[i]];
        if (!col) continue;
        x.fillStyle = col;
        x.fillRect((flip ? w - 1 - i : i) * scale, j * scale, scale, scale);
      }
    });
    return c;
  }

  /* ================================================================
     THE BAR — a different round on every visit, set out at random
     ================================================================ */
  var DRINKS = [
    ["martini", "Pan Galactic Gargle Blaster, shaken. Bench closes at 3 a.m."],
    ["rocks", "Flux remover, neat. (Do not drink the flux remover.)"],
    ["highball", "Blue Screen of Death: gin, curaçao, a reboot."],
    ["wine", "A 2023 Rev A. Notes of burnt FR-4."],
    ["pint", "Pint of Ohm's Lager. Resistance is futile."],
    ["mug", "Coffee, for the designated debugger."],
    ["tokkuri", "Hot sake for the long reflow."]
  ];
  /* The cursor can push them along the counter (sweep across a glass),
     or pick one up and slide it (drag and let go). They slow down on
     their own, knock into each other and stop at the ends of the bar.
     A tap that doesn't move a glass says what's in it. */
  var counter = $("#counter"), drinks = [];
  if (counter) {
    var pool = DRINKS.slice().sort(function () { return Math.random() - .5; }).slice(0, 2 + Math.floor(Math.random() * 2));
    var slots = [];
    pool.forEach(function (d) {
      var x, tries = 0;
      do { x = rnd(4, 92); tries++; } while (slots.some(function (o) { return Math.abs(o - x) < 9; }) && tries < 30);
      slots.push(x);
      var b = el("button", "drink");
      b.type = "button"; b.title = d[1]; b.setAttribute("aria-label", d[1]);
      b.appendChild(sprite(d[0], 4, Math.random() < .5));
      counter.appendChild(b);
      drinks.push({ node: b, line: d[1], pct: x, x: 0, w: 0, h: 0, vx: 0, drag: null });
    });
    var CW = 0, moving = false, lastClink = 0, pointer = null;
    function measure() {
      var old = CW;
      CW = counter.clientWidth;
      drinks.forEach(function (g) {
        g.w = g.node.offsetWidth; g.h = g.node.offsetHeight;
        g.x = old ? g.x * CW / old : g.pct / 100 * CW;
        g.x = Math.max(0, Math.min(CW - g.w, g.x));
        g.node.style.left = "0"; g.node.style.transform = "translateX(" + Math.round(g.x) + "px)";
      });
    }
    function slide(dt) {
      var any = false;
      drinks.forEach(function (g) {
        if (g.drag) { any = true; return; }
        if (Math.abs(g.vx) < .05) { g.vx = 0; return; }
        any = true;
        g.x += g.vx * dt;
        g.vx *= Math.pow(.94, dt);                              /* friction on the bar top */
        if (g.x < 0) { g.x = 0; g.vx = Math.abs(g.vx) * .4; }
        if (g.x > CW - g.w) { g.x = CW - g.w; g.vx = -Math.abs(g.vx) * .4; }
      });
      /* glasses knock into each other: equal masses, so they trade speeds */
      var order = drinks.slice().sort(function (p, q) { return p.x - q.x; });
      for (var i = 0; i + 1 < order.length; i++) {
        var l = order[i], r = order[i + 1], gap = r.x - (l.x + l.w);
        if (gap < 0) {
          if (!l.drag && !r.drag) { var v = l.vx; l.vx = r.vx; r.vx = v; }
          else if (l.drag) r.vx = Math.max(r.vx, 2); else l.vx = Math.min(l.vx, -2);
          if (!r.drag) r.x -= gap / (l.drag ? 1 : 2);
          if (!l.drag) l.x += gap / (r.drag ? 1 : 2);
          var hit = Math.abs(l.vx - r.vx);
          if (hit > 6 && performance.now() - lastClink > 4000) { lastClink = performance.now(); toast("Clink. Careful, those are full."); }
          any = true;
        }
      }
      drinks.forEach(function (g) {
        g.x = Math.max(0, Math.min(CW - g.w, g.x));
        g.node.style.transform = "translateX(" + Math.round(g.x) + "px)";
      });
      return any;
    }
    var dlast = 0;
    function loop(t) {
      var dt = Math.min(50, t - (dlast || t)) / 16.67; dlast = t;
      if (slide(dt)) requestAnimationFrame(loop); else { moving = false; dlast = 0; }
    }
    function wake() { if (!moving) { moving = true; dlast = 0; requestAnimationFrame(loop); } }

    /* sweep the cursor across a glass and it moves the way the cursor went */
    document.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") return;
      var r = counter.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      var prev = pointer; pointer = { x: x, y: y };
      if (!prev) return;
      var dx = x - prev.x;
      if (Math.abs(dx) < .5) return;
      drinks.forEach(function (g) {
        if (g.drag) return;
        var top = -g.h, left = g.x, right = g.x + g.w;
        var crossed = (prev.x < left && x >= left) || (prev.x > right && x <= right) || (x >= left && x <= right);
        if (crossed && y > top - 4 && y < 6) {
          g.vx += dx * .45;
          g.vx = Math.max(-28, Math.min(28, g.vx));
          wake();
        }
      });
    }, { passive: true });

    /* or pick one up and slide it */
    drinks.forEach(function (g) {
      var b = g.node;
      b.addEventListener("pointerdown", function (e) {
        if (e.button) return;
        try { b.setPointerCapture(e.pointerId); } catch (x) { /* fine */ }
        g.drag = { start: e.clientX, from: g.x, lastX: e.clientX, lastT: performance.now(), v: 0, moved: false };
        g.vx = 0; b.classList.add("held"); wake();
      });
      b.addEventListener("pointermove", function (e) {
        var d = g.drag; if (!d) return;
        var now = performance.now();
        if (Math.abs(e.clientX - d.start) > 4) d.moved = true;
        d.v = (e.clientX - d.lastX) / Math.max(1, now - d.lastT) * 16.67;
        d.lastX = e.clientX; d.lastT = now;
        g.x = Math.max(0, Math.min(CW - g.w, d.from + e.clientX - d.start));
        g.node.style.transform = "translateX(" + Math.round(g.x) + "px)";
      });
      function letGo() {
        var d = g.drag; if (!d) return;
        g.drag = null; b.classList.remove("held");
        g.vx = Math.max(-28, Math.min(28, d.v));
        g.wasDragged = d.moved;
        wake();
      }
      b.addEventListener("pointerup", letGo);
      b.addEventListener("pointercancel", letGo);
      b.addEventListener("click", function (e) {
        if (g.wasDragged) { g.wasDragged = false; e.preventDefault(); return; }
        toast(g.line);
      });
      /* keyboard: arrow keys nudge the focused glass */
      b.addEventListener("keydown", function (e) {
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); e.stopPropagation(); g.vx += e.key === "ArrowLeft" ? -8 : 8; wake(); }
      });
    });
    measure();
    window.addEventListener("resize", function () { measure(); });
  }

  /* ================================================================
     THE SKY over the title screen
     ================================================================ */
  var sky = $("#sky");
  var game = { score: 0, hits: 0 };
  /* the cursor as wind: anything in the sky near it drifts gently away */
  var wind = { x: -9999, y: -9999, R: 170, K: .55 };
  if (sky) (function () {
    var ctx = sky.getContext("2d"), P = 3, W = 0, H = 0;
    var stars = [], shoots = [], aliens = [], bolts = [], bits = [], pops = [];
    var shipImg = null, alienImg = sprite("alien", P);
    var ship = { x: -60, y: 0, vx: 1.1, roll: 0, cool: 0 };
    var skyRect = null;
    document.addEventListener("pointermove", function (e) {
      skyRect = skyRect || sky.getBoundingClientRect();
      wind.x = e.clientX - skyRect.left; wind.y = e.clientY - skyRect.top;
    }, { passive: true });
    document.addEventListener("pointerleave", function () { wind.x = wind.y = -9999; });
    window.addEventListener("scroll", function () { skyRect = null; }, { passive: true });
    /* push o.x / o.y away from the cursor, softly, by how close (cx, cy) is to it */
    function blow(o, cx, cy, dt, keyX, keyY) {
      var dx = cx - wind.x, dy = cy - wind.y, d = Math.sqrt(dx * dx + dy * dy);
      if (d >= wind.R || d < .001) return;
      var f = (1 - d / wind.R); f = f * f * wind.K * dt;           /* eases in: barely anything at the edge */
      o[keyX || "x"] += dx / d * f * 2.2;
      o[keyY || "y"] += dy / d * f * 1.6;
    }

    function size() {
      var r = sky.getBoundingClientRect();
      W = sky.width = Math.round(r.width); H = sky.height = Math.round(r.height); skyRect = null;
      ctx.imageSmoothingEnabled = false;
      stars = [];
      for (var i = 0; i < Math.round(W * H / 9000); i++) {
        stars.push({ x: Math.round(rnd(0, W) / P) * P, y: Math.round(rnd(0, H * .55) / P) * P, t: rnd(0, 6.28), s: rnd(.4, 1.6), big: Math.random() < .12 });
      }
      ship.y = Math.round(H * .3);
      /* the ship flies sideways: draw the upward sprite turned to the right */
      var up = sprite("ship", P), c = el("canvas"); c.width = up.height; c.height = up.width;
      var x = c.getContext("2d"); x.translate(c.width, 0); x.rotate(Math.PI / 2); x.drawImage(up, 0, 0);
      shipImg = c;
      placeSOS();
    }

    function spawnAlien(atX) {
      aliens.push({ x: atX != null ? atX : rnd(W * .45, W - 60), y: ship.y + rnd(-14, 14), bob: rnd(0, 6.28), hp: 1, vx: rnd(-.3, -.05) });
    }

    function explode(a) {
      for (var i = 0; i < 18; i++) bits.push({ x: a.x + 12, y: a.y + 9, vx: rnd(-2.2, 2.2), vy: rnd(-2.2, 2.2), life: rnd(25, 50), c: Math.random() < .5 ? "#7dff7a" : "#ffd36e" });
      pops.push({ x: a.x, y: a.y, life: 50 });
      game.score += 100; game.hits++;
      if (game.hits === 10) toast("10 aliens down. The bar's quieter now.");
    }

    /* ---- one scene per visit: the patrol (ship vs aliens), a launch,
       a shuttle landing, the station going over, or a capsule coming home */
    var SCENE_LIST = ["patrol", "launch", "landing", "station", "capsule"];
    var asked = (location.search.match(/[?&]scene=(\w+)/) || [])[1];     /* ?scene=launch picks one */
    var scene = SCENE_LIST.indexOf(asked) >= 0 ? asked : SCENE_LIST[Math.floor(Math.random() * SCENE_LIST.length)];
    sky.dataset.scene = scene;
    var horizon = function () { return H - (parseFloat(css("--counterH")) || 92) - 40; };
    var big = 3;
    var SS = sprite("starship", big), BO = sprite("booster", big), SH = sprite("shuttle", big), ST = sprite("station", big),
        CA = sprite("capsule", big), CH = sprite("chute", big);
    var smoke = [];
    function puff(x, y, n, col) { for (var i = 0; i < n; i++) smoke.push({ x: x + rnd(-6, 6), y: y, vx: rnd(-.6, .6), vy: rnd(.2, 1.2), life: rnd(30, 70), c: col }); }
    function drawSmoke(dt) {
      smoke = smoke.filter(function (p) {
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy *= .98; p.life -= dt;
        blow(p, p.x, p.y, dt);
        ctx.globalAlpha = Math.max(0, Math.min(.8, p.life / 60)); ctx.fillStyle = p.c;
        ctx.fillRect(Math.round(p.x / P) * P, Math.round(p.y / P) * P, P * 2, P * 2);
        ctx.globalAlpha = 1; return p.life > 0;
      });
    }
    function flame(x, y, len) {
      for (var i = 0; i < len; i++) {
        ctx.fillStyle = i < 2 ? "#ffffff" : i < len * .5 ? "#ffd36e" : "#ff8a3d";
        var w = Math.max(1, 3 - Math.floor(i / 3)) + (Math.random() < .4 ? 1 : 0);
        ctx.fillRect(x - w * P / 2, y + i * P, w * P, P);
      }
    }
    var L = { t: -60, x: 0, sep: false, bx: 0, by: 0, bvy: 0 };
    var D = { t: -40 }, Q = { x: -200, y: 0 }, C = { t: -30 };
    wind.blow = blow;
    game.craft = function () { return { ship: ship, launch: L, shuttle: D, station: Q, capsule: C }; };
    var SCENES = {
      launch: function (dt) {
        if (L.t < 0) { L.t += dt; if (L.t >= 0) { L.x = Math.round(rnd(W * .2, W * .8) / P) * P; L.y = horizon(); L.v = 0; L.sep = false; } drawSmoke(dt); return; }
        L.t += dt; L.v = Math.min(6, L.v + .012 * dt); L.y -= L.v * dt;
        blow(L, L.x, L.y + SS.height / 2, dt);
        if (L.sep) blow(L, L.bx, L.by + BO.height / 2, dt, "bx", "by");
        if (!L.sep && L.y < H * .32) { L.sep = true; L.bx = L.x; L.by = L.y + SS.height - BO.height; L.bvy = -L.v * .6; 0; }
        if (L.sep) {
          L.bvy += .03 * dt; L.by += L.bvy * dt;
          ctx.drawImage(BO, L.bx - BO.width / 2, L.by);
          if (L.bvy > .5) flame(L.bx, L.by + BO.height, 4);
          ctx.drawImage(SS, 0, 0, SS.width, SS.height - BO.height, L.x - SS.width / 2, L.y, SS.width, SS.height - BO.height);
          flame(L.x, L.y + SS.height - BO.height, 6);
          if (L.by > H) { L.t = -rnd(400, 900); }
        } else {
          ctx.drawImage(SS, L.x - SS.width / 2, L.y);
          flame(L.x, L.y + SS.height, 10 + Math.floor(Math.random() * 4));
          if (Math.random() < .8) puff(L.x, L.y + SS.height + 30, 2, "rgba(230,225,240,.9)");
        }
        drawSmoke(dt);
      },
      landing: function (dt) {
        if (D.t < 0) { D.t += dt; if (D.t >= 0) { D.x = W + 40; D.y = H * .08; D.vx = -2.2; D.vy = .55; } return; }
        D.t += dt; D.x += D.vx * dt; D.y += D.vy * dt;
        blow(D, D.x + SH.width / 2, D.y + SH.height / 2, dt);
        if (D.t < 140) { ctx.globalAlpha = .5; ctx.fillStyle = "#ff8a3d"; ctx.fillRect(D.x + SH.width, D.y + SH.height / 2, 40, P); ctx.globalAlpha = 1; }
        ctx.drawImage(SH, D.x, D.y);
        if (D.y > horizon() - 60) { ctx.fillStyle = "#2a2a33"; ctx.fillRect(D.x + 12, D.y + SH.height, P, P * 2); ctx.fillRect(D.x + SH.width - 24, D.y + SH.height, P, P * 2); }
        if (D.y > horizon() + 20 || D.x < -120) D.t = -rnd(300, 700);
      },
      station: function (dt, t) {
        if (Q.x < -150 || Q.x > W + 150) { Q.x = -140; Q.y = rnd(H * .08, H * .25); }
        Q.x += .45 * dt;
        blow(Q, Q.x + ST.width / 2, Q.y + ST.height / 2, dt);
        ctx.drawImage(ST, Q.x, Q.y);
        if (Math.floor(t / 700) % 2) { ctx.fillStyle = "#ff4f6d"; ctx.fillRect(Q.x + 13 * big, Q.y + 7 * big, big, big); }
      },
      capsule: function (dt, t) {
        if (C.t < 0) { C.t += dt; if (C.t >= 0) { C.x = rnd(W * .2, W * .8); C.y = -80; } return; }
        C.t += dt; C.y += .55 * dt;
        blow(C, C.x, C.y - 20, dt);
        var sway = Math.sin(t / 900) * 6;
        [-30, 0, 30].forEach(function (o, i) { ctx.drawImage(CH, C.x + o - CH.width / 2 + sway, C.y - 40 - (i === 1 ? 8 : 0)); });
        ctx.strokeStyle = "rgba(200,200,215,.6)"; ctx.lineWidth = 1;
        [-30, 0, 30].forEach(function (o) { ctx.beginPath(); ctx.moveTo(C.x + o + sway, C.y - 16); ctx.lineTo(C.x + sway * .4, C.y + 4); ctx.stroke(); });
        ctx.drawImage(CA, C.x - CA.width / 2 + sway * .4, C.y);
        if (C.y > horizon() + 30) C.t = -rnd(300, 600);
      }
    };
    function patrol(dt, t) {
      /* aliens drift in now and then; the ship patrols and shoots them */
      spawnT -= dt / 60;
      if (spawnT <= 0) { spawnAlien(); spawnT = rnd(5, 11); }
      ship.x += ship.vx * dt;
      blow(ship, ship.x + 18, ship.y + 18, dt);
      if (ship.x > W + 80) { ship.x = -80; ship.y = Math.round(rnd(H * .18, H * .42)); }
      ship.cool -= dt;
      var target = aliens.filter(function (a) { return a.x > ship.x && Math.abs(a.y - ship.y) < 30; })[0];
      if (target && ship.cool <= 0 && target.x - ship.x < 420) { bolts.push({ x: ship.x + 38, y: ship.y + 18 }); ship.cool = 28; }
      if (target) ship.y += Math.sign(target.y - ship.y) * .4 * dt;

      bolts = bolts.filter(function (b) {
        b.x += 7 * dt;
        ctx.fillStyle = "#ff8fd0"; ctx.fillRect(b.x, b.y, 10, P);
        for (var i = 0; i < aliens.length; i++) {
          var a = aliens[i];
          if (b.x > a.x && b.x < a.x + 27 && b.y > a.y - 2 && b.y < a.y + 23) { explode(a); aliens.splice(i, 1); return false; }
        }
        return b.x < W;
      });

      aliens = aliens.filter(function (a) {
        a.bob += .05 * dt; a.x += a.vx * dt;
        blow(a, a.x + 13, a.y + 10, dt);
        ctx.drawImage(alienImg, Math.round(a.x / P) * P, Math.round((a.y + Math.sin(a.bob) * 4) / P) * P);
        return a.x > -40;
      });

      bits = bits.filter(function (b) {
        b.x += b.vx * dt; b.y += b.vy * dt; b.vy += .05 * dt; b.life -= dt;
        ctx.fillStyle = b.c; ctx.fillRect(Math.round(b.x), Math.round(b.y), P, P);
        return b.life > 0;
      });
      pops = pops.filter(function (p) {
        p.life -= dt; p.y -= .4 * dt;
        ctx.globalAlpha = Math.min(1, p.life / 25);
        ctx.fillStyle = "#ffd36e"; ctx.font = "bold 12px 'JetBrains Mono', monospace"; ctx.fillText("+100", p.x, p.y);
        ctx.globalAlpha = 1;
        return p.life > 0;
      });

      /* the ship (a click makes it barrel-roll) */
      ctx.save();
      ctx.translate(Math.round(ship.x) + shipImg.width / 2, Math.round(ship.y) + shipImg.height / 2);
      if (ship.roll > 0) { ship.roll -= dt; ctx.scale(1, Math.cos((1 - ship.roll / 40) * Math.PI * 2)); }
      ctx.drawImage(shipImg, -shipImg.width / 2, -shipImg.height / 2);
      if (Math.floor(t / 90) % 2) { ctx.fillStyle = "#ffd36e"; ctx.fillRect(-shipImg.width / 2 - P, -P / 2, P, P); }
      ctx.restore();

    }

    var last = 0, spawnT = 4, starCol = "", starAge = 0;
    function frame(t) {
      var dt = Math.min(50, t - (last || t)) / 16.67; last = t;
      ctx.clearRect(0, 0, W, H);
      if (!starCol || ++starAge > 90) { starCol = css("--star") || "#fff"; starAge = 0; }   /* re-read now and then: the theme can change */

      stars.forEach(function (s) {
        s.t += .02 * s.s * dt;
        ctx.globalAlpha = .35 + .65 * Math.abs(Math.sin(s.t));
        ctx.fillStyle = starCol;
        ctx.fillRect(s.x, s.y, s.big ? P : P - 1, s.big ? P : P - 1);
      });
      ctx.globalAlpha = 1;

      /* shooting stars */
      if (Math.random() < .004 * dt) shoots.push({ x: rnd(W * .3, W), y: rnd(0, H * .3), life: 40 });
      shoots = shoots.filter(function (s) {
        s.x -= 9 * dt; s.y += 3 * dt; s.life -= dt;
        var g = ctx.createLinearGradient(s.x, s.y, s.x + 90, s.y - 30);
        g.addColorStop(0, starCol); g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.strokeStyle = g; ctx.lineWidth = 2; ctx.globalAlpha = Math.min(1, s.life / 20);
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x + 90, s.y - 30); ctx.stroke();
        ctx.globalAlpha = 1;
        return s.life > 0;
      });

      if (scene === "patrol") patrol(dt, t); else SCENES[scene](dt, t);

      if (!document.hidden && running) requestAnimationFrame(frame);
    }

    /* only animate while the title screen is on screen */
    var running = false;
    function start() { if (running || REDUCED) return; running = true; last = 0; requestAnimationFrame(frame); }
    function stop() { running = false; }
    size();
    window.addEventListener("resize", size);
    if (REDUCED) { frame(0); return; }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) { e[0].isIntersecting ? start() : stop(); }).observe(sky);
    } else start();
    document.addEventListener("visibilitychange", function () { if (!document.hidden) { running = false; start(); } });

    document.addEventListener("click", function (e) {
      var r = sky.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      if (x > ship.x - 10 && x < ship.x + 50 && y > ship.y - 10 && y < ship.y + 50) {
        ship.roll = 40;
        if (!game.rolled) { game.rolled = 1; toast("Do a barrel roll!"); }
      }
    });

    game.invade = function () {
      scene = "patrol";
      for (var i = 0; i < 12; i++) spawnAlien(W * .4 + i * (W * .05));
      ship.x = 20; ship.vx = 1.6;
      toast("↑↑↓↓←→←→BA — incoming. 30 lives granted (not really).");
    };
  })();

  /* the SOS window: on the tallest tower, wherever the city image is scaled to */
  function placeSOS() {
    var city = $(".city"), sos = $(".sos");
    if (!city || !sos) return;
    var s = city.getBoundingClientRect().height / 570;
    sos.style.left = (531 * s) + "px";
    sos.style.top = (city.offsetTop + 117 * s) + "px";
    sos.style.width = Math.max(3, 6 * s) + "px";
    sos.style.height = Math.max(2, 3 * s) + "px";
  }
  placeSOS();

  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
  /* pets are gone; forget what earlier visits saved for them */
  store("wk-pets", null); store("wk-pet-kinds", null);

  /* ================================================================
     THE DOCK — always in the corner, on every page: light / dark / auto
     ================================================================ */
  var THEMES = ["auto", "light", "dark"];
  var LABEL = { auto: "◐ Auto", light: "☀ Light", dark: "☾ Dark" };
  function theme() { var t = store("wk-theme"); return t === "light" || t === "dark" ? t : "auto"; }
  function setTheme(t) {
    if (t === "auto") { store("wk-theme", null); document.documentElement.removeAttribute("data-theme"); }
    else { store("wk-theme", t); document.documentElement.setAttribute("data-theme", t); }
    themeBtn.textContent = LABEL[t];
    themeBtn.setAttribute("aria-label", "Theme: " + t + ". Change theme");
  }
  var dock = el("div", "dock"); dock.setAttribute("role", "group"); dock.setAttribute("aria-label", "Site controls");
  var themeBtn = el("button", "dock-btn"); themeBtn.type = "button"; themeBtn.id = "themeBtn";
  themeBtn.title = "Light, dark, or follow your device";
  themeBtn.addEventListener("click", function () {
    var next = THEMES[(THEMES.indexOf(theme()) + 1) % THEMES.length];
    setTheme(next);
    toast(next === "auto" ? "Theme follows your device." : next === "light" ? "Golden hour." : "Night shift.");
  });
  dock.appendChild(themeBtn);
  document.body.appendChild(dock);
  setTheme(theme());
  window.fx = { game: game, toast: toast, drinks: drinks, wind: wind, setTheme: function (t) { setTheme(t); } };

  /* ================================================================
     LIGHTBOX — every article picture opens here, not in a new tab.
     ← → step through the page's pictures, Esc closes.
     ================================================================ */
  var lb = null, group = [], idx = 0;
  function makeLB() {
    lb = el("div", "lb"); lb.id = "lb"; lb.setAttribute("role", "dialog"); lb.setAttribute("aria-modal", "true"); lb.setAttribute("aria-label", "Picture");
    lb.innerHTML = '<img alt=""><span class="cap"></span><span class="n"></span>' +
      '<button class="x" type="button" aria-label="Close">Close ✕</button>' +
      '<button class="prev" type="button" aria-label="Previous">←</button>' +
      '<button class="next" type="button" aria-label="Next">→</button>';
    document.body.appendChild(lb);
    lb.querySelector(".x").onclick = close;
    lb.querySelector(".prev").onclick = function () { show(idx - 1); };
    lb.querySelector(".next").onclick = function () { show(idx + 1); };
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
  }
  function show(i) {
    idx = (i + group.length) % group.length;
    var a = group[idx], img = a.querySelector("img"), fig = a.closest("figure");
    var cap = fig && fig.querySelector("figcaption");
    lb.querySelector("img").src = a.getAttribute("href");
    lb.querySelector("img").alt = img ? img.alt : "";
    lb.querySelector(".cap").textContent = cap ? cap.textContent : (img ? img.alt : "");
    lb.querySelector(".n").textContent = (idx + 1) + " / " + group.length;
    var many = group.length > 1;
    lb.querySelector(".prev").hidden = lb.querySelector(".next").hidden = !many;
  }
  function open(a) {
    if (!lb) makeLB();
    group = Array.prototype.slice.call(document.querySelectorAll("a.ar-full"));
    show(group.indexOf(a));
    lb.classList.add("on");
    document.documentElement.style.overflow = "hidden";
    lb.querySelector(".x").focus();
  }
  function close() {
    if (!lb) return;
    lb.classList.remove("on");
    document.documentElement.style.overflow = "";
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a.ar-full");
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    open(a);
  });

  /* ================================================================
     KEYS: lightbox control, and a couple of codes
     ================================================================ */
  var KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  var kpos = 0, typed = "";
  document.addEventListener("keydown", function (e) {
    if (lb && lb.classList.contains("on")) {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") show(idx - 1);
      else if (e.key === "ArrowRight") show(idx + 1);
      return;
    }
    if (/^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || ""))) return;
    var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    kpos = k === KONAMI[kpos] ? kpos + 1 : (k === KONAMI[0] ? 1 : 0);
    if (kpos === KONAMI.length) { kpos = 0; if (game.invade) game.invade(); else toast("Wrong floor. Try the title screen."); }
    if (e.key.length === 1) {
      typed = (typed + k).slice(-12);
      if (/sudo$/.test(typed)) toast("Nice try. This incident will be reported.");
      if (/smoke$/.test(typed)) toast("Don't let it out. The red car lights told you.");
      if (/42$/.test(typed)) toast("The answer. Now what was the question?");
    }
  });

  /* the cocktail on the bar */
  var martini = $(".martini");
  if (martini) martini.addEventListener("dblclick", function () { toast("One Pan Galactic Gargle Blaster, shaken. Bench closes at 3 a.m."); });

  /* for the people who open the console */
  if (window.console && console.log) {
    console.log("%c WK · TOP FLOOR ", "background:#0d0820;color:#7ff3ff;font:bold 14px monospace;padding:4px 8px");
    console.log("Hello, fellow engineer. Three messages are hidden in the city: two in the car lights, one in a window. Also try ↑↑↓↓←→←→BA.");
  }
})();
