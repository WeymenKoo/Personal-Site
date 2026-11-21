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
  var LITE = document.documentElement.classList.contains("lite");     /* phones: only the drinks move (theme.js) */
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
    station: { pal: { p: "#3a5ba8", b: "#d9a43a", t: "#c9ccd6", w: "#f2f2f2", r: "#ff4f6d" }, rows: [
      "pppp.pppp.........pppp.pppp", "pppp.pppp.........pppp.pppp", "pppp.pppp....w....pppp.pppp", "..t...t.....www.....t...t..",
      "ttttttttttttwwwwwttttttttttt", "..t...t.....www.....t...t..", "pppp.pppp....w....pppp.pppp", "pppp.pppp....b....pppp.pppp", "pppp.pppp.........pppp.pppp"] },
    capsule: { pal: { w: "#e9ebf2", d: "#9aa0b0", k: "#2a2a33" }, rows: [
      "....w....", "...www...", "..wwwww..", "..wwdww..", ".wwwwwww.", ".wwwwwww.", "wwwwwwwww", "kkkkkkkkk"] },
    chute: { pal: { o: "#ff8a3d", w: "#f2f2f2", l: "#9aa0b0" }, rows: [
      "...ooowww...", ".oowwwoooww.", "oowwwoooowwo", "l..........l", ".l........l.", "..l......l..", "...l....l...", "....l..l...."] },
    falconheavy: { pal: { w: "#f2f2f2", W: "#c9ccd6", k: "#22232b" }, rows: ["......w......", "......w......", ".....wwW.....", ".....wwW.....", ".....wwW.....", ".....wwW.....", ".....wwW.....", ".....wwW.....", ".....wwW.....", ".....kkk.....", ".....wwW.....", ".....wwW.....", ".....wwW.....", ".w...wwW...w.", "wwW..wwW..wwW", "wwW..wwW..wwW", "wwW..kkk..wwW", "wwW..wwW..wwW", "wwW..wwW..wwW", "wwW..wwW..wwW", "kkk..wwW..kkk", "wwW..wwW..wwW", "wwW..wwW..wwW", "wwW..wwW..wwW", "wwW..wwW..wwW", "wwW..wwW..wwW", "wwW..wwW..wwW", "wwW..wwW..wwW", "wwW..wwW..wwW", "wwW..wwW..wwW", "wwW..wwW..wwW", "wwW..wwW..wwW", "wwW..wwW..wwW", "wwW..wwW..wwW", "wwW..wwW..wwW", "wwW..wwW..wwW", "wwW..wwW..wwW", "wwW..wwW..wwW", "wwW..wwW..wwW", "wwW..wwW..wwW", "wwW..wwW..wwW", "wwW..wwW..wwW", "wwW..wwW..wwW", "wwW..wwW..wwW", "kkk..kkk..kkk", "kkk..kkk..kkk"] },
    fhcenter: { pal: { w: "#f2f2f2", W: "#c9ccd6", k: "#22232b" }, rows: ["...w...", "...w...", "..wwW..", "..wwW..", "..wwW..", "..wwW..", "..wwW..", "..wwW..", "..wwW..", "..kkk..", "..wwW..", "..wwW..", "..wwW..", "..wwW..", "..wwW..", "..wwW..", "..kkk..", "..wwW..", "..wwW..", "..wwW..", "..wwW..", "..wwW..", "..wwW..", "..wwW..", "..wwW..", "..wwW..", "..wwW..", "..wwW..", "..wwW..", "..wwW..", "..wwW..", "..wwW..", "..wwW..", "..wwW..", "..wwW..", "..wwW..", "..wwW..", "..wwW..", "..wwW..", "..wwW..", "..wwW..", "..wwW..", "..wwW..", "..wwW..", "..kkk..", "..kkk.."] },
    fhside: { pal: { w: "#f2f2f2", W: "#c9ccd6", k: "#22232b" }, rows: [".w.", "wwW", "wwW", "kkk", "wwW", "wwW", "wwW", "kkk", "wwW", "wwW", "wwW", "wwW", "wwW", "wwW", "wwW", "wwW", "wwW", "wwW", "wwW", "wwW", "wwW", "wwW", "wwW", "wwW", "wwW", "wwW", "wwW", "wwW", "wwW", "wwW", "kkk", "kkk"] },
    hubble: { pal: { w: "#e3e6ee", d: "#8a8f9e", k: "#22232b", b: "#3a5ba8", B: "#d9a43a" }, rows: ["k........bBbBbB...........", ".k.......BbBbBb...........", "..k......bBbBbB...........", "...d.......dd.............", "...dwwwwwwwwwwwwwwwwwwkd..", "...dwwwwwwwwwwwwwwwwwwkd..", "...dwwwwwwwwwwwwwwwwwwkd..", "...dddddddddddddddddddkd..", "...dddddddddddddddddddkd..", "...d.......dd.............", ".........bBbBbB...........", ".........BbBbBb...........", ".........bBbBbB..........."] },
    roadster: { pal: { r: "#d61f2c", k: "#1b1b22", w: "#f2f2f2", W: "#c9ccd6" }, rows: ["........ww.......", ".......wWw.......", "....rrrrwwrrr....", "..rrrrrrrrrrrrrr.", ".rrrrrrrrrrrrrrrr", ".rkkrrrrrrrrrkkr.", "..kk.........kk.."] },
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
      "..bb..", "..bb..", ".bbbb.", "bbbbbb", "bkkkkb", "bbbbbb", "bbbbbb", "bbbbbb", ".bbbb.", "......", ".c..c."] },
    /* the tropical shelf */
    coconut: { pal: { b: "#7a4a2a", B: "#5a331c", w: "#f4efe6", s: "#ff8fd0", u: "#7ff3ff", k: "#efe4ff" }, rows: [
      "......uuu.", ".....uuuuu", "....s..k..", "...s...k..", "..wwswwk..", ".bwwwwwwb.", "bbbbbbbbbb", "bBbbbBbbbb", "bbbBbbbBbb", ".bbbbbbbb.", "..bbbbbb.."] },
    hurricane: { pal: { g: "rgba(239,228,255,.72)", o: "#ffb347", r: "#ff5a6e", u: "#ff3ea5", U: "#7ff3ff", k: "#efe4ff", y: "#ffe06b" }, rows: [
      "..uuuuu..", ".uUuUuUu.", "....k....", "g...k..yg", "gooookoyg", "goooookog", ".gooooog.", ".grrrrrg.", "..grrrg..", "...grg...", "....g....", "....g....", "..ggggg.."] },
    tiki: { pal: { t: "#2fa39a", T: "#1f7a72", k: "#0d0820", m: "#5ef0a6", s: "#ff8fd0" }, rows: [
      "..m...s..", ".mm..s...", "ttttsttt.", "tTTtTTtt.", "tkTtkTtt.", "tttttttt.", "tTkkkkTt.", "tTtTtTtt.", "tttttttt.", ".tttttt.."] },
    margarita: { pal: { w: "#ffffff", g: "rgba(239,228,255,.72)", l: "#c8f27a", G: "#5ef0a6" }, rows: [
      "wwwwwwwwwG", ".gllllllgG", "..gllllg..", "...gllg...", "....gg....", "....g.....", "....g.....", "....g.....", "..ggggg..."] },
    oj: { pal: { g: "rgba(239,228,255,.72)", y: "#ffa62b", o: "#ff8a1e", O: "#ffd36e" }, rows: [
      "......oo", ".....oOo", "g....oog", "gyyyyyyg", "gyyyyyyg", "gyyyyyyg", "gyyyyyyg", "gyyyyyyg", "gggggggg"] },
    watermelon: { pal: { g: "rgba(239,228,255,.72)", p: "#ff5a7a", P: "#2a1236", r: "#ff3e5a", G: "#5ef0a6" }, rows: [
      "....rG.", "...rrG.", "g..rG.g", "gppppPg", "gppppPg", "gpPpppg", "gpppppg", "gppPppg", "gpppppg", "ggggggg"] },
    lassi: { pal: { g: "rgba(239,228,255,.72)", a: "#ffc23d", f: "#fff2c4", m: "#5ef0a6" }, rows: [
      "...mm..", "g.mm..g", "gfffffg", "gaaaaag", "gaaaaag", "gaaaaag", "gaaaaag", "gaaaaag", "gaaaaag", ".ggggg."] },
    solo: { pal: { w: "#f4f0ec", r: "#d8222e", R: "#a8121e" }, rows: [
      "wwwwwwwww", "rrrrrrrrr", ".rrrrrrr.", ".RRRRRRR.", ".rrrrrrr.", ".RRRRRRR.", "..rrrrr..", "..rrrrr..", "..RRRRR.."] },
    boba: { pal: { l: "rgba(239,228,255,.85)", s: "#ff8fd0", t: "#d9b38c", k: "#2a1a14", g: "rgba(239,228,255,.72)" }, rows: [
      "....ss.", "....ss.", "lllllll", "gtttttg", "gtttttg", "gtttttg", "gtktktg", "gkttkkg", "gkkktkg", ".ggggg."] }
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
    ["tokkuri", "Hot sake for the long reflow."],
    ["coconut", "Coconut water, straight from the shell. Electrolytes for the bring-up."],
    ["hurricane", "Passionfruit Hurricane. Category 5, zero ohms."],
    ["tiki", "Mai Tai in a tiki mug. The mug has seen things."],
    ["margarita", "Margarita, salted rim. Fixes everything except ground loops."],
    ["oj", "Fresh orange juice. 100% vitamin C, 0% capacitors."],
    ["watermelon", "Watermelon juice. Mostly water, like the flux washer."],
    ["lassi", "Mango lassi. Thick enough for thermal paste. Please don't."],
    ["boba", "Brown sugar boba from Richmond. Mind the pearls in the straw."],
    ["solo", "Red cup. Don't ask what's in it."]
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
     SOUND: one AudioContext, made on the first click that needs it
     ================================================================ */
  var AC = null, NOISE = null;
  function audio() {
    if (!AC) { var C = window.AudioContext || window.webkitAudioContext; if (!C) return null; AC = new C(); }
    if (AC.state === "suspended") AC.resume();
    return AC;
  }
  function noiseBuf(ac) {
    if (!NOISE) {
      NOISE = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      var d = NOISE.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    return NOISE;
  }
  /* a muffled, far-off bang: filtered noise falling in pitch */
  function bang(size) {
    var ac = audio(); if (!ac) return;
    var t = ac.currentTime, n = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    n.buffer = noiseBuf(ac); f.type = "lowpass";
    f.frequency.setValueAtTime(1800, t); f.frequency.exponentialRampToValueAtTime(90, t + .7);
    var v = Math.min(.35, .12 + size / 300);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + .9);
    n.connect(f); f.connect(g); g.connect(ac.destination); n.start(t); n.stop(t + 1);
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
    var shipImg = null, alienImg = null;                               /* painted with the rest (paintCraft) */
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
      if (Math.round(r.width) === W && Math.round(r.height) === H) { placeSOS(); return; }   /* phone toolbars fire resize on scroll */
      if (typeof rebuildShuttle === "function" && SH) rebuildShuttle();
      W = sky.width = Math.round(r.width); H = sky.height = Math.round(r.height); skyRect = null;
      ctx.imageSmoothingEnabled = false;
      stars = [];
      for (var i = 0; i < Math.round(W * H / 9000); i++) {
        stars.push({ x: Math.round(rnd(0, W) / P) * P, y: Math.round(rnd(0, H * .55) / P) * P, t: rnd(0, 6.28), s: rnd(.4, 1.6), big: Math.random() < .12 });
      }
      ship.y = Math.round(H * .3);
      placeSOS();
    }

    function spawnAlien(atX) {
      aliens.push({ x: atX != null ? atX : rnd(W * .45, W - 60), y: ship.y + rnd(-14, 14), bob: rnd(0, 6.28), hp: 1, vx: rnd(-.3, -.05) });
    }

    function explode(a) {
      for (var i = 0; i < 18; i++) bits.push({ x: a.x + alienImg.width / 2, y: a.y + alienImg.height / 2, vx: rnd(-2.2, 2.2), vy: rnd(-2.2, 2.2), life: rnd(25, 50), c: Math.random() < .5 ? "#7dff7a" : "#ffd36e" });
      pops.push({ x: a.x, y: a.y, life: 50 });
      game.score += 100; game.hits++;
      if (game.hits === 10) toast("10 aliens down. The bar's quieter now.");
    }

    /* ---- click anything flying and it blows up: shrapnel, a shock ring, smoke, a far-off bang */
    var rings = [], FIRE = ["#ffffff", "#ffe9b0", "#ffd36e", "#ff8a3d", "#ff3e5a", "#ff8fd0"];
    function boom(x, y, size) {
      var n = Math.round(14 + size * .9);
      for (var i = 0; i < n; i++) {
        var a = rnd(0, 6.283), v = rnd(.3, 1) * (1.4 + size / 22);
        bits.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - .6, life: rnd(28, 70), c: FIRE[i % FIRE.length], g: .05 });
      }
      for (i = 0; i < n / 2; i++) {
        bits.push({ x: x + rnd(-size / 3, size / 3), y: y + rnd(-size / 3, size / 3), vx: rnd(-.4, .4), vy: rnd(-.8, -.2),
          life: rnd(50, 110), c: "rgba(205,195,225,.55)", g: -.004, big: true });
      }
      rings.push({ x: x, y: y, r: 2, max: Math.max(24, size), life: 1 });
      bang(size);
    }
    function drawBits(dt) {
      bits = bits.filter(function (b) {
        b.x += b.vx * dt; b.y += b.vy * dt; b.vy += (b.g == null ? .05 : b.g) * dt; b.vx *= Math.pow(.985, dt); b.life -= dt;
        var fp = SHUT.fp, sz = b.big ? fp * 2 : fp;
        ctx.globalAlpha = b.big ? Math.min(1, b.life / 60) : 1;
        ctx.fillStyle = b.c; ctx.fillRect(Math.round(b.x / fp) * fp, Math.round(b.y / fp) * fp, sz, sz);
        ctx.globalAlpha = 1;
        return b.life > 0;
      });
      rings = rings.filter(function (g) {
        g.r += (g.max - g.r) * .12 * dt + .4 * dt; g.life -= .025 * dt;
        if (g.r < g.max * .35) {                                     /* the flash */
          ctx.fillStyle = "#fff6d8"; ctx.globalAlpha = g.life;
          ctx.fillRect(Math.round((g.x - g.r * .6) / P) * P, Math.round((g.y - g.r * .6) / P) * P, Math.round(g.r * 1.2 / P) * P, Math.round(g.r * 1.2 / P) * P);
        }
        ctx.globalAlpha = Math.max(0, g.life); ctx.fillStyle = g.r < g.max * .6 ? "#ffd36e" : "#ff8fd0";
        var k = Math.max(8, Math.round(g.r / 2));
        for (var i = 0; i < k; i++) {
          var a = i / k * 6.283;
          ctx.fillRect(Math.round((g.x + Math.cos(a) * g.r) / P) * P, Math.round((g.y + Math.sin(a) * g.r) / P) * P, P, P);
        }
        ctx.globalAlpha = 1;
        return g.life > 0;
      });
    }
    var said = {};
    function line(kind, msg) { if (!said[kind]) { said[kind] = 1; toast(msg); } }
    /* what's in the sky right now, as boxes: x, y, w, h, and what happens when it's hit */
    function targets() {
      var out = [];
      function add(x, y, w, h, kill) { out.push({ x: x, y: y, w: w, h: h, kill: kill }); }
      if (scene === "patrol") {
        aliens.forEach(function (a) {
          add(a.x, a.y - 4, alienImg.width, alienImg.height + 8, function () { explode(a); aliens.splice(aliens.indexOf(a), 1); boom(a.x + alienImg.width / 2, a.y + alienImg.height / 2, 20); });
        });
        if (shipImg && ship.x > -60) add(ship.x, ship.y, shipImg.width, shipImg.height, function () {
          boom(ship.x + shipImg.width / 2, ship.y + shipImg.height / 2, 34);
          ship.x = -rnd(500, 900); ship.y = Math.round(rnd(H * .18, H * .42));
          if (!game.invading) nextCraft(rnd(200, 400));
          line("ship", "You shot down your own escort. Bold.");
        });
      }
      var RUD = "Rapid unscheduled disassembly.";
      if (scene === "launch" && L.t >= 0) {
        var top = L.sep ? SS.height - BO.height : SS.height;
        add(L.x - SS.width / 2, L.y, SS.width, top, function () {
          boom(L.x, L.y + top / 2, 60); if (L.sep && !L.gone) boom(L.bx, L.by + BO.height / 2, 40);
          nextCraft(rnd(200, 450)); line("rud", RUD);
        });
        if (L.sep && !L.gone) add(L.bx - BO.width / 2, L.by, BO.width, BO.height, function () {
          boom(L.bx, L.by + BO.height / 2, 40); L.gone = true; line("booster", "Booster recovery: not today.");
        });
      }
      if ((scene === "shuttle-launch" || scene === "falcon-heavy") && R.t >= 0) {
        var img = R.sep ? (scene === "falcon-heavy" ? FHC : STC) : (scene === "falcon-heavy" ? FH : STK);
        add(R.x - img.width / 2, R.y, img.width, img.height, function () {
          boom(R.x, R.y + img.height / 2, 70); R.parts.forEach(function (q) { boom(q.x, q.y + q.img.height / 2, 30); });
          R.y = -9999; nextCraft(rnd(200, 450)); line("rud", RUD);
        });
        R.parts.forEach(function (q) {
          add(q.x - q.img.width / 2, q.y, q.img.width, q.img.height, function () {
            boom(q.x, q.y + q.img.height / 2, 30); R.parts.splice(R.parts.indexOf(q), 1); line("booster", "Booster recovery: not today.");
          });
        });
      }
      if (scene === "landing" && D.t >= 0) add(D.x - SH.width / 2, D.y - SH.height / 2, SH.width, SH.height, function () {
        boom(D.x, D.y, 50); nextCraft(rnd(200, 450)); line("landing", "Wheel stop cancelled.");
      });
      if (scene === "station" && !(Q.wait > 0)) add(Q.x, Q.y, ST.width, ST.height, function () {
        boom(Q.x + ST.width / 2, Q.y + ST.height / 2, 60); nextCraft(rnd(200, 450)); line("station", "Station deorbited, ahead of schedule.");
      });
      if (scene === "capsule" && C.t >= 0) add(C.x - 50, C.y - 50, 100, 50 + CA.height, function () {
        boom(C.x, C.y, 40); nextCraft(rnd(200, 450)); line("capsule", "Splashdown cancelled.");
      });
      if (AIR[scene] && A.t >= 0) {
        var ai = AIR[scene].img[A.dir > 0 ? 0 : 1];
        add(A.x, A.y, ai.width, ai.height, function () { boom(A.x + ai.width / 2, A.y + ai.height / 2, 40); var key = scene, msg = AIR[key].line; nextCraft(rnd(200, 450)); line(key, msg); });
      }
      if (scene === "hubble" && !(U.wait > 0)) add(U.x, U.y, HU.width, HU.height, function () {
        boom(U.x + HU.width / 2, U.y + HU.height / 2, 50); nextCraft(rnd(200, 450)); line("hubble", "There go thirty years of deep fields.");
      });
      if (scene === "roadster" && !(Z.wait > 0)) add(Z.x, Z.y, RD.width, RD.height, function () {
        boom(Z.x + RD.width / 2, Z.y + RD.height / 2, 36); nextCraft(rnd(200, 450)); line("roadster", "Starman, no!");
      });
      return out;
    }
    function hitAt(x, y) {
      var t = targets(), pad = 10;
      for (var i = t.length - 1; i >= 0; i--) {
        var o = t[i];
        if (x > o.x - pad && x < o.x + o.w + pad && y > o.y - pad && y < o.y + o.h + pad) return o;
      }
      return null;
    }

    /* ---- the Space Shuttle, painted at the city picture's own pixel size (not the chunky 3 px of
       the rest of the sky): vector shapes in metres, snapped to whole pixels. Side views throughout:
       the orbiter nose-left; the launch stack nose-up, orbiter belly against the tank, one booster
       in front of the tank (the other hides behind it). */
    var SH, STK, STC, SRB, SHUT = {}, fineP = 0;
    var SS, BO, ST, CA, CH, FH, FHC, FHS, HU, RD, AIR = {};
    function cityPx() { var c = document.querySelector(".city"); return c && c.offsetHeight ? 2 * c.offsetHeight / 570 : 1.3; }
    function snap(c) {                                                /* every pixel fully on or off */
      var x = c.getContext("2d"), d = x.getImageData(0, 0, c.width, c.height), a = d.data;
      for (var i = 3; i < a.length; i += 4) a[i] = a[i] < 110 ? 0 : 255;
      x.putImageData(d, 0, 0); return c;
    }
    function grow(c, k) {                                             /* up to page size, nearest-neighbour */
      var o = el("canvas"); o.width = Math.round(c.width * k); o.height = Math.round(c.height * k);
      var x = o.getContext("2d"); x.imageSmoothingEnabled = false; x.drawImage(c, 0, 0, o.width, o.height); return o;
    }
    function poly(x, k, ox, oy, pts, col) {                           /* pts in metres: x along, y up */
      x.fillStyle = col; x.beginPath();
      pts.forEach(function (p, i) { x[i ? "lineTo" : "moveTo"](ox + p[0] * k, oy - p[1] * k); });
      x.closePath(); x.fill();
    }
    function orbiter(k) {                                             /* nose left, belly down; ~39 m with the engines */
      var c = el("canvas"); c.width = Math.ceil(39 * k) + 4; c.height = Math.ceil(15.2 * k) + 4;
      var x = c.getContext("2d"), ox = 2, oy = c.height - 2;
      function P(pts, col) { poly(x, k, ox, oy, pts, col); }
      function line(a, b, col, w) { x.strokeStyle = col; x.lineWidth = w || 1; x.beginPath(); x.moveTo(ox + a[0] * k, oy - a[1] * k); x.lineTo(ox + b[0] * k, oy - b[1] * k); x.stroke(); }
      P([[26, 6.2], [33.4, 14.6], [35.8, 14.6], [35.6, 13.8], [35.2, 6.6]], "#eceef3");                 /* fin */
      line([33.6, 14.4], [26.4, 6.4], "#c9ccd6", 1);
      line([34.2, 7.2], [35.3, 13.8], "#a9adb8", 1);                                                   /* rudder hinge */
      P([[35.4, 2.0], [38.4, 1.3], [38.4, 3.9], [35.4, 3.2]], "#6a6f80");                             /* engines: two low */
      P([[35.3, 1.8], [38.2, 1.1], [38.2, 3.6], [35.3, 2.9]], "#8a8f9e");
      P([[35.3, 4.4], [38.6, 3.8], [38.6, 6.2], [35.3, 5.6]], "#8a8f9e");                             /* and one high */
      x.fillStyle = "#3a3c48"; x.fillRect(ox + 38.1 * k, oy - 6.1 * k, k * .5, 2.3 * k); x.fillRect(ox + 37.9 * k, oy - 3.7 * k, k * .5, 2.5 * k);
      P([[0, 2], [.3, 2.9], [1, 3.7], [2.2, 4.4], [3.6, 4.9], [4.6, 5.6], [6, 6.3], [8, 6.6], [10, 6.4], [11.5, 6], [28.5, 6], [29.2, 6.6],
         [31, 6.9], [33.6, 6.8], [34.6, 6], [35.4, 4.8], [35.6, 2.6], [35.4, 1], [34.6, .4], [20, 0], [4, 0], [2, .3], [.8, .9], [.2, 1.5]], "#f2f3f6");
      P([[29.4, 5.3], [29.2, 6.6], [31, 6.9], [33.6, 6.8], [34.6, 6], [34.3, 5.3]], "#e0e2ea");         /* OMS pod */
      line([29.4, 5.3], [34.3, 5.3], "#a9adb8", 1);
      P([[0, 2], [.6, 2.7], [2, 2.7], [5, 2.3], [9, 1.9], [14, 1.6], [18, 1.6], [22, 1.8], [27, 2.1], [33, 2.3], [35.5, 2.5], [35.4, 1],
         [34.6, .4], [20, 0], [4, 0], [2, .3], [.8, .9], [.2, 1.5]], "#23242c");                          /* black tiles below */
      line([10, 2.4], [31, 2.9], "#9aa0b0", 1);                                                         /* the wing's edge */
      line([11.8, 5.35], [28.4, 5.35], "#c9ccd6", 1);                                                   /* payload bay doors */
      [15, 19, 23].forEach(function (u) { line([u, 5.4], [u, 6], "#d4d7e0", 1); });
      P([[4.3, 5.25], [5.1, 5.95], [6.5, 6.3], [6.7, 5.7], [5.3, 5.05]], "#23242c");                   /* windscreen */
      P([[7.3, 5.7], [8.6, 5.9], [8.6, 5.4], [7.3, 5.3]], "#23242c");
      P([[0, 2], [.3, 2.6], [.7, 2], [.3, 1.4]], "#3a3c48");                                           /* nose cap */
      P([[33.4, .55], [37.4, .85], [37.4, 1.45], [33.8, 1.45]], "#23242c");                           /* body flap */
      return snap(c);
    }
    function rebuildShuttle() {
      var f = cityPx();
      if (Math.abs(f - fineP) < .01 && SH) return;
      fineP = f;
      var k = 2.4;                                                    /* pixels per metre, before scaling to the page */
      var O = orbiter(k);
      SH = grow(O, f);
      /* the stack: tank up the middle, orbiter on its right, one booster in front */
      var axisR = 4.6 * k + O.height + 2, cw = Math.ceil(axisR * 2) + 2, ch = Math.ceil(52 * k), ax = cw / 2;
      function tank(x) {
        var pts = [], i, y, r;
        for (i = 0; i <= 12; i++) { y = i / 12 * 10; r = 4.2 * Math.sqrt(y / 10); pts.push([ax + r * k, y * k]); }
        pts.push([ax + 4.2 * k, 47 * k], [ax - 4.2 * k, 47 * k]);
        for (i = 12; i >= 0; i--) { y = i / 12 * 10; r = 4.2 * Math.sqrt(y / 10); pts.push([ax - r * k, y * k]); }
        x.fillStyle = "#d9792b"; x.beginPath(); pts.forEach(function (p, j) { x[j ? "lineTo" : "moveTo"](p[0], p[1]); }); x.closePath(); x.fill();
        x.fillStyle = "#a85a1e"; x.fillRect(ax + 1.8 * k, 10 * k, 2.4 * k, 37 * k);
        x.fillStyle = "#e8914a"; x.fillRect(ax - 3.4 * k, 10 * k, 1.2 * k, 37 * k);
        x.fillStyle = "#b8661f"; x.fillRect(ax - 4.2 * k, 13.5 * k, 8.4 * k, .5 * k); x.fillRect(ax - 4.2 * k, 19 * k, 8.4 * k, .5 * k);
      }
      function booster(x) {
        var r = 1.85 * k;
        x.fillStyle = "#eef0f4"; x.beginPath(); x.moveTo(ax, 4 * k); x.lineTo(ax + r, 9 * k); x.lineTo(ax + r, 46 * k); x.lineTo(ax + 2.4 * k, 49 * k);
        x.lineTo(ax - 2.4 * k, 49 * k); x.lineTo(ax - r, 46 * k); x.lineTo(ax - r, 9 * k); x.closePath(); x.fill();
        x.fillStyle = "#c9ccd6"; x.fillRect(ax + .6 * k, 9 * k, r - .6 * k, 37 * k);
        x.fillStyle = "#8a8f9e"; [20, 28, 36].forEach(function (y) { x.fillRect(ax - r, y * k, 2 * r, .35 * k); });
        x.fillStyle = "#6a6f80"; x.beginPath(); x.moveTo(ax - 1.1 * k, 49 * k); x.lineTo(ax + 1.1 * k, 49 * k); x.lineTo(ax + 1.6 * k, 51.5 * k); x.lineTo(ax - 1.6 * k, 51.5 * k); x.fill();
      }
      function attach(x) {                                            /* the orbiter, rotated nose-up, belly to the tank */
        var bx = ax + 4.6 * k - 2, ny = 11 * k - 2;
        x.save(); x.translate(bx + O.height, ny); x.rotate(Math.PI / 2); x.drawImage(O, 0, 0); x.restore();
      }
      function make(withBooster, onlyBooster) {
        var c = el("canvas"); c.width = cw; c.height = ch; var x = c.getContext("2d");
        if (onlyBooster) booster(x); else { tank(x); attach(x); if (withBooster) booster(x); }
        return grow(snap(c), f);
      }
      STK = make(true); STC = make(false); SRB = make(false, true);
      /* where the fires go, in page px from the image's centre and top */
      SHUT = { srbY: 51.5 * k * f, ssmeDx: (4.6 + 3.7) * k * f,          /* belly at 4.6 m off the axis, engines ~3.7 m above the belly */
                ssmeY: (11 * k + 38.6 * k) * f, fp: Math.max(2, Math.round(f * 2)) };
      paintCraft(f);
    }
    /* ---- everything else that flies, painted the same way: shapes in canvas pixels at the city's
       pixel size, snapped on/off. Rockets nose-up; everything else faces right (flipped as needed). */
    function paint(w, h, fn) { var c = el("canvas"); c.width = w; c.height = h; fn(c.getContext("2d")); return grow(snap(c), fineP); }
    function flipX(c) { var o = el("canvas"); o.width = c.width; o.height = c.height; var x = o.getContext("2d"); x.translate(c.width, 0); x.scale(-1, 1); x.drawImage(c, 0, 0); return o; }
    function rr(x, X, Y, w, h, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }
    function pg(x, pts, col) { x.fillStyle = col; x.beginPath(); pts.forEach(function (p, i) { x[i ? "lineTo" : "moveTo"](p[0], p[1]); }); x.closePath(); x.fill(); }
    function box(x, X, Y, w, h, col) { x.fillStyle = col; x.fillRect(X, Y, w, h); }
    var STEEL = "#c9ccd6", STEEL_HI = "#eceef3", STEEL_SH = "#9aa0b0", INK = "#23242c";
    function starship(x, oy, ship, booster) {                         /* Starship on Super Heavy; stainless, tiles on the windward side */
      var c = 6, r = 4.5;
      if (ship) {
        x.fillStyle = STEEL; x.beginPath(); x.moveTo(c, oy); x.quadraticCurveTo(c + r + .5, oy + 4, c + r, oy + 12); x.lineTo(c + r, oy + 44); x.lineTo(c - r, oy + 44); x.lineTo(c - r, oy + 12); x.quadraticCurveTo(c - r - .5, oy + 4, c, oy); x.fill();
        box(x, c + r - 2, oy + 6, 2, 38, STEEL_SH); box(x, c - 1, oy + 4, 1, 40, STEEL_HI);
        box(x, c - r, oy + 10, 3, 34, INK);                           /* heat shield */
        pg(x, [[c - r, oy + 9], [c - r - 2, oy + 15], [c - r, oy + 15]], INK); pg(x, [[c + r, oy + 9], [c + r + 2, oy + 15], [c + r, oy + 15]], STEEL_SH);
        pg(x, [[c - r, oy + 33], [c - r - 3, oy + 44], [c - r, oy + 44]], INK); pg(x, [[c + r, oy + 33], [c + r + 3, oy + 44], [c + r, oy + 44]], STEEL_SH);
      }
      if (booster) {
        var b = oy + (ship ? 44 : 0);
        box(x, c - r, b, 2 * r, 4, "#3a3c48"); [1, 3, 5, 7].forEach(function (q) { box(x, c - r + q, b + 1, 1, 2, "#6a6f80"); });   /* hot-staging ring */
        box(x, c - r, b + 4, 2 * r, 52, STEEL); box(x, c + r - 2, b + 4, 2, 52, STEEL_SH); box(x, c - 1, b + 4, 1, 52, STEEL_HI);
        box(x, c - r - 2, b + 5, 2, 4, "#3a3c48"); box(x, c + r, b + 5, 2, 4, "#3a3c48");     /* grid fins */
        box(x, c - r, b + 56, 2 * r, 6, "#5a5f6e"); [1.5, 4.5, 7.5].forEach(function (q) { box(x, c - r + q - .5, b + 60, 2, 2, "#3a3c48"); });
      }
    }
    function falcon(x, center, sides, yoff) {                         /* Falcon Heavy: three cores, a fairing on the middle one */
      function core(X, top, cone) {
        if (cone) pg(x, [[X + 3, top - 8], [X + 6, top], [X, top]], "#f2f2f2");
        box(x, X, top, 6, 114 - top - yoff, "#f2f2f2"); box(x, X + 4, top, 2, 114 - top - yoff, "#c9ccd6");
        box(x, X, 38 - yoff, 6, 6, INK);                                 /* interstage */
        box(x, X - 1, 46 - yoff, 1, 3, INK); box(x, X + 6, 46 - yoff, 1, 3, INK);   /* grid fins */
        box(x, X, 114 - yoff, 6, 6, "#3a3c48"); box(x, X - 1, 112 - yoff, 1, 6, INK); box(x, X + 6, 112 - yoff, 1, 6, INK);   /* legs */
      }
      if (sides) { core(0, 38 - yoff, true); core(16, 38 - yoff, true); }
      if (center) {
        x.fillStyle = "#f2f2f2"; x.beginPath(); x.moveTo(11, 0); x.quadraticCurveTo(15.5, 3, 15, 10); x.lineTo(15, 16); x.lineTo(7, 16); x.lineTo(7, 10); x.quadraticCurveTo(6.5, 3, 11, 0); x.fill();
        box(x, 13, 3, 2, 13, "#c9ccd6"); box(x, 8, 16, 6, 22, "#f2f2f2"); box(x, 12, 16, 2, 22, "#c9ccd6"); core(8, 44, false);
      }
    }
    function paintCraft(f) {
      SS = paint(12, 106, function (x) { starship(x, 0, true, true); });
      BO = paint(12, 62, function (x) { starship(x, 0, false, true); });
      FH = paint(22, 120, function (x) { falcon(x, true, true, 0); });
      FHC = paint(22, 120, function (x) { falcon(x, true, false, 0); });
      FHS = paint(8, 90, function (x) {                              /* one side booster, the same as on the full stack */
        pg(x, [[4, 0], [7, 8], [1, 8]], "#f2f2f2"); box(x, 1, 8, 6, 76, "#f2f2f2"); box(x, 5, 8, 2, 76, "#c9ccd6"); box(x, 1, 8, 6, 6, INK);
        box(x, 0, 16, 1, 3, INK); box(x, 7, 16, 1, 3, INK); box(x, 1, 84, 6, 6, "#3a3c48"); box(x, 0, 82, 1, 6, INK); box(x, 7, 82, 1, 6, INK); });
      ST = paint(96, 36, function (x) {                               /* the station: truss, four pairs of wings, modules */
        [8, 22, 64, 78].forEach(function (X) {
          [[2, 14], [21, 14]].forEach(function (w) { box(x, X, w[0], 11, w[1], "#c8963a"); for (var q = 1; q < 11; q += 3) box(x, X + q, w[0], 1, w[1], "#8a6424"); box(x, X, w[0], 11, 1, "#e0b860"); });
          box(x, X + 5, 2, 1, 32, "#6a6f80");
        });
        box(x, 2, 17, 92, 3, "#9aa0b0"); box(x, 2, 17, 92, 1, "#c9ccd6"); for (var q = 4; q < 94; q += 4) box(x, q, 18, 1, 2, "#6a6f80");
        box(x, 30, 21, 4, 10, "#f2f2f2"); box(x, 62, 6, 4, 10, "#f2f2f2");
        rr(x, 36, 14, 24, 8, 3); x.fillStyle = "#e6e8ee"; x.fill(); box(x, 36, 20, 24, 2, "#b8bcc8");
        rr(x, 44, 6, 8, 24, 3); x.fillStyle = "#e6e8ee"; x.fill(); box(x, 50, 6, 2, 24, "#b8bcc8");
        [40, 48, 56].forEach(function (X) { box(x, X, 14, 1, 8, "#b8bcc8"); });
      });
      ST.blink = [48 * f, 8 * f];
      HU = paint(76, 34, function (x) {                               /* Hubble: the tube, the aperture door open, two wings */
        [[1, 9], [25, 9]].forEach(function (w) { box(x, 22, w[0], 28, w[1] - 1, "#2a3a6a"); for (var q = 22; q < 50; q += 4) box(x, q, w[0], 1, w[1] - 1, "#c8963a"); box(x, 22, w[0], 28, 1, "#c8963a"); });
        box(x, 35, 9, 2, 3, "#8a8f9e"); box(x, 35, 22, 2, 3, "#8a8f9e");
        rr(x, 10, 11, 54, 12, 4); x.fillStyle = "#c9ccd6"; x.fill();
        box(x, 12, 12, 50, 1, "#eceef3"); box(x, 10, 20, 54, 2, "#9aa0b0"); box(x, 10, 11, 20, 12, "#a9adb8"); box(x, 30, 11, 2, 12, "#3a3c48");
        box(x, 6, 12, 4, 10, "#8a8f9e");
        pg(x, [[63, 11], [72, 5], [74, 7], [65, 12]], "#9aa0b0"); box(x, 62, 12, 2, 10, INK);
      });
      HU.blink = [66 * f, 15 * f];
      RD = paint(54, 24, function (x) {                               /* the roadster, and its driver in a white suit */
        x.fillStyle = "#f0f0f4"; x.beginPath(); x.arc(24, 6, 4, 0, 7); x.fill(); box(x, 25, 5, 3, 2, INK);
        box(x, 21, 9, 8, 6, "#f0f0f4"); pg(x, [[28, 10], [35, 12], [34, 14], [27, 13]], "#e0e2ea");
        pg(x, [[2, 15], [10, 13], [18, 13], [22, 11], [34, 11], [42, 13], [52, 15], [52, 19], [2, 19]], "#c8202a");
        box(x, 4, 14, 46, 1, "#ff4a4a"); box(x, 2, 18, 50, 1, "#8a1418"); pg(x, [[30, 9], [34, 9], [35, 11], [31, 11]], "#2a3a5a");
        [11, 43].forEach(function (X) { x.fillStyle = "#1a1a22"; x.beginPath(); x.arc(X, 19, 3.6, 0, 7); x.fill(); box(x, X - 1, 18, 2, 2, "#8a8f9e"); });
      });
      CA = paint(28, 26, function (x) {                               /* a capsule home from orbit: scorched shield down */
        pg(x, [[10, 2], [18, 2], [25, 20], [3, 20]], "#e9ebf2"); pg(x, [[16, 2], [18, 2], [25, 20], [21, 20]], "#c9ccd6");
        box(x, 11, 0, 6, 3, "#8a8f9e"); box(x, 10, 8, 2, 2, INK); box(x, 15, 8, 2, 2, INK);
        rr(x, 2, 19, 24, 6, 2); x.fillStyle = "#2a2a33"; x.fill(); box(x, 3, 19, 22, 1, "#5a3a2a");
      });
      CH = paint(34, 20, function (x) {                               /* a main chute: orange and white gores */
        for (var g = 0; g < 6; g++) {
          x.fillStyle = g % 2 ? "#f2f2f2" : "#ff8a3d"; x.beginPath(); x.moveTo(17, 19);
          x.arc(17, 19, 16, Math.PI + g * Math.PI / 6, Math.PI + (g + 1) * Math.PI / 6); x.closePath(); x.fill();
        }
        box(x, 1, 18, 32, 1, "#c96a2a"); box(x, 16, 3, 2, 1, "#c9ccd6");
      });
      var ship = paint(34, 26, function (x) {                         /* the escort: a sleek little fighter, nose right */
        pg(x, [[20, 10], [10, 1], [6, 1], [12, 10]], "#8a93a8"); pg(x, [[20, 16], [10, 25], [6, 25], [12, 16]], "#6a7488");
        pg(x, [[33, 13], [26, 10], [10, 10], [4, 11], [4, 15], [10, 16], [26, 16]], "#d8dce6");
        box(x, 6, 13, 22, 1, "#3a5ba8"); x.fillStyle = "#7ff3ff"; x.beginPath(); x.ellipse(24, 11.6, 3.5, 1.6, 0, 0, 7); x.fill();
        box(x, 2, 11, 3, 4, "#3a3f52"); box(x, 0, 12, 2, 2, "#ff3ea5");
      });
      shipImg = ship;
      alienImg = paint(22, 18, function (x) {                         /* a visitor: three eyes, a dome, wiggly legs */
        [5, 9, 13, 17].forEach(function (X, i) { box(x, X, 14, 1.4, 3 + (i % 2), "#2fa04a"); });
        x.fillStyle = "#2fa04a"; x.beginPath(); x.ellipse(11, 11, 9, 5, 0, 0, 7); x.fill();
        x.fillStyle = "#5ef07a"; x.beginPath(); x.ellipse(11, 9.5, 9, 4.5, 0, 0, 7); x.fill();
        x.fillStyle = "#7dff9a"; x.beginPath(); x.ellipse(11, 5.5, 6, 4.5, 0, 0, 7); x.fill();
        [[7, 7], [11, 5], [15, 7]].forEach(function (e) { x.fillStyle = "#0d0820"; x.beginPath(); x.arc(e[0], e[1], 1.6, 0, 7); x.fill(); box(x, e[0] - 1, e[1] - 1, 1, 1, "#ffffff"); });
      });
      /* and the aircraft, nose right */
      var dc3 = paint(100, 30, function (x) {                         /* Douglas DC-3: bare metal, a blue cheatline, round engines */
        pg(x, [[12, 10], [6, 1], [1, 1], [4, 10]], "#b8bcc8"); box(x, 2, 2, 1, 8, "#9aa0b0");
        pg(x, [[97, 14], [94, 10], [86, 8], [40, 8], [14, 10], [6, 12], [6, 15], [14, 17], [40, 19], [86, 19], [94, 17]], "#c9ccd6");
        pg(x, [[94, 10], [86, 8], [40, 8], [14, 10], [12, 12], [96, 12]], "#e3e6ec");
        box(x, 10, 13, 84, 1, "#2a4f9a"); box(x, 2, 13, 13, 1, "#9aa0b0");
        for (var q = 46; q < 84; q += 5) box(x, q, 10, 2, 2, "#2a3a5a"); pg(x, [[88, 10], [92, 10], [93, 12], [88, 12]], "#2a3a5a");
        box(x, 46, 17, 26, 2, "#9aa0b0"); rr(x, 66, 15, 15, 6, 2.5); x.fillStyle = "#b8bcc8"; x.fill(); box(x, 79, 15, 2, 6, "#6a6f80");
        for (var y = 10; y < 27; y += 2) box(x, 83, y, 1, 1, "#8a8f9e");
      });
      var spit = paint(64, 22, function (x) {                         /* Supermarine Spitfire: camouflage, roundel, fin flash */
        pg(x, [[8, 10], [4, 2], [1, 3], [2, 10]], "#4a5a3a"); box(x, 3, 4, 1, 5, "#c0303a"); box(x, 4, 4, 1, 5, "#f2f2f2"); box(x, 5, 5, 1, 4, "#2a3a7a");
        pg(x, [[62, 11], [58, 8], [50, 7], [26, 8], [6, 10], [2, 10], [2, 12], [6, 12], [26, 14], [50, 15], [58, 14]], "#a8b8a8");
        pg(x, [[58, 8], [50, 7], [26, 8], [6, 10], [2, 11], [60, 11]], "#4a5a3a");
        [[16, 9, 6], [34, 8, 7], [48, 8, 5]].forEach(function (b) { box(x, b[0], b[1], b[2], 2, "#6a5a3a"); });
        x.fillStyle = "#9ac8e8"; x.beginPath(); x.ellipse(37, 7, 5, 2.4, 0, Math.PI, 0); x.fill(); box(x, 36, 5, 1, 2, "#3a3a3a");
        x.fillStyle = "#2a3a7a"; x.beginPath(); x.arc(22, 11, 3, 0, 7); x.fill(); x.fillStyle = "#f2f2f2"; x.beginPath(); x.arc(22, 11, 2, 0, 7); x.fill(); x.fillStyle = "#c0303a"; x.beginPath(); x.arc(22, 11, 1.1, 0, 7); x.fill();
        box(x, 30, 13, 20, 2, "#7a8a7a"); box(x, 36, 15, 6, 2, "#5a6a5a"); box(x, 58, 9, 4, 4, "#3a3a3a");
        for (var y = 2; y < 21; y += 2) box(x, 63, y, 1, 1, "#8a8f9e");
      });
      var tomcat = paint(104, 26, function (x) {                      /* F-14 Tomcat: twin tails, long nose, swept wing */
        pg(x, [[18, 11], [9, 0], [4, 0], [6, 11]], "#6a7488");
        pg(x, [[22, 11], [13, 0], [8, 0], [10, 11]], "#8a93a8");
        pg(x, [[103, 15], [96, 12], [84, 10], [70, 9], [40, 10], [14, 11], [6, 12], [6, 17], [30, 18], [70, 18], [88, 17], [96, 16]], "#8a93a8");
        pg(x, [[96, 12], [84, 10], [70, 9], [40, 10], [14, 11], [10, 13], [98, 13]], "#b8bcc8");
        pg(x, [[76, 10], [80, 7], [86, 8], [89, 10]], "#2a3a5a"); box(x, 58, 13, 7, 4, "#3a3f52");
        pg(x, [[58, 16], [30, 22], [24, 22], [44, 16]], "#7a8398"); pg(x, [[16, 15], [2, 18], [10, 18]], "#7a8398");
        box(x, 3, 13, 4, 4, "#3a3c48"); box(x, 100, 14, 3, 1, "#6a6f80");
      });
      var seaking = paint(92, 40, function (x) {                      /* Sikorsky SH-3 Sea King: boat hull, sponsons, tail boom */
        pg(x, [[30, 14], [6, 8], [4, 12], [26, 23]], "#6a7488"); pg(x, [[8, 10], [4, 1], [1, 2], [3, 12]], "#6a7488");
        pg(x, [[88, 22], [86, 16], [78, 13], [30, 13], [24, 15], [24, 30], [80, 30], [88, 26]], "#6a7488");
        pg(x, [[86, 16], [78, 13], [30, 13], [26, 16], [87, 18]], "#8a93a8"); box(x, 24, 26, 64, 4, "#4a5266");
        rr(x, 40, 8, 30, 7, 2.5); x.fillStyle = "#6a7488"; x.fill(); box(x, 40, 10, 3, 3, "#3a3f52");
        box(x, 54, 4, 4, 5, "#3a3c48");
        pg(x, [[80, 15], [86, 16], [87, 20], [80, 20]], "#2a3a5a"); for (var q = 34; q < 72; q += 8) box(x, q, 18, 3, 3, "#2a3a5a");
        box(x, 50, 17, 1, 9, "#4a5266");
        x.fillStyle = "#4a5266"; x.beginPath(); x.ellipse(42, 30, 8, 3, 0, 0, 7); x.fill();
        box(x, 30, 31, 1, 2, "#3a3c48"); box(x, 72, 31, 1, 2, "#3a3c48");
      });
      AIR = {
        dc3: { img: [dc3, flipX(dc3)], v: 1.6, line: "DC-3 down. Ninety years of flying, undone in one click." },
        spitfire: { img: [spit, flipX(spit)], v: 2.6, line: "Spitfire down. Somewhere a museum curator just felt that." },
        tomcat: { img: [tomcat, flipX(tomcat)], v: 4.6, jet: [0, 15 * f], line: "Tomcat down. Bingo fuel, apparently." },
        seaking: { img: [seaking, flipX(seaking)], v: 1.1, rotor: [56 * f, 4 * f, 46 * f], tail: [3 * f, 4 * f, 6 * f], line: "Sea King down. It was only out looking for a ship." }
      };
    }
    rebuildShuttle();
    /* engine fire, in fine pixels: a white core, then yellow and orange; the main engines run blue-white */
    function fineFlame(x, y, len, w0, blue) {
      var b = SHUT.fp;
      for (var i = 0; i < len; i++) {
        var w = Math.max(1, Math.round(w0 * (1 - i / len * .6) + (Math.random() < .3 ? 1 : 0)));
        ctx.fillStyle = blue ? (i < len * .35 ? "#ffffff" : i < len * .7 ? "#bfe6ff" : "rgba(170,200,255,.6)")
          : (i < len * .2 ? "#ffffff" : i < len * .55 ? "#ffd36e" : "#ff8a3d");
        ctx.fillRect(Math.round(x - w * b / 2), Math.round(y + i * b), w * b, b);
      }
    }
    function shuttleFire(x, y, img, sep) {
      if (!sep) fineFlame(x, y + SHUT.srbY, 16 + Math.floor(Math.random() * 5), 4);
      fineFlame(x + SHUT.ssmeDx, y + SHUT.ssmeY, 8 + Math.floor(Math.random() * 3), 2, true);
    }

    /* ---- one scene per visit: the patrol (ship vs aliens), a launch,
       a shuttle landing, the station going over, or a capsule coming home */
    var SCENE_LIST = ["patrol", "launch", "landing", "station", "capsule", "shuttle-launch", "falcon-heavy", "hubble", "roadster", "dc3", "spitfire", "tomcat", "seaking"];
    var asked = (location.search.match(/[?&]scene=([\w-]+)/) || [])[1];     /* ?scene=launch picks one */
    var scene = SCENE_LIST.indexOf(asked) >= 0 ? asked : SCENE_LIST[Math.floor(Math.random() * SCENE_LIST.length)];
    sky.dataset.scene = scene;
    /* one craft in the sky at a time; when it's popped or gone, the next is a different one, picked at random */
    var CRAFT = SCENE_LIST.slice(1);
    function nextCraft(wait) {
      var pool = CRAFT.filter(function (k) { return k !== scene; }), k = pool[Math.floor(Math.random() * pool.length)];
      scene = k; sky.dataset.scene = k; smoke = [];
      if (k === "launch") L.t = -wait;
      else if (k === "landing") { D.t = -wait; D.pl = []; }
      else if (k === "capsule") C.t = -wait;
      else if (k === "shuttle-launch" || k === "falcon-heavy") { R.t = -wait; R.parts = []; }
      else if (k === "station") { Q.x = -9999; Q.wait = wait; }
      else if (k === "hubble") { U.x = -9999; U.first = false; U.wait = wait; }
      else if (k === "roadster") { Z.x = -9999; Z.first = false; Z.wait = wait; }
      else if (AIR[k]) { A.t = -wait; A.trail = []; }
      return k;
    }
    game.next = nextCraft;
    var horizon = function () { return H - (parseFloat(css("--counterH")) || 92) - 40; };
    var big = 3;
    var smoke = [];
    function puff(x, y, n, col) { for (var i = 0; i < n; i++) smoke.push({ x: x + rnd(-6, 6), y: y, vx: rnd(-.6, .6), vy: rnd(.2, 1.2), life: rnd(30, 70), c: col }); }
    function drawSmoke(dt) {
      smoke = smoke.filter(function (p) {
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy *= .98; p.life -= dt;
        blow(p, p.x, p.y, dt);
        ctx.globalAlpha = Math.max(0, Math.min(.8, p.life / 60)); ctx.fillStyle = p.c;
        var b = SHUT.fp; ctx.fillRect(Math.round(p.x / b) * b, Math.round(p.y / b) * b, b * 2, b * 2);
        ctx.globalAlpha = 1; return p.life > 0;
      });
    }
    function flame(x, y, len) { fineFlame(x, y, Math.round(len * 1.5), 3); }   /* in the city's pixels, like the rest */
    var L = { t: -2, x: 0, sep: false, bx: 0, by: 0, bvy: 0 };          /* timers start near zero: something flies as the page opens */
    var PLASMA = ["#fff4e0", "#ffc06b", "#ff6fae", "#9a5cff"];
    function drawPlasma(dt) {
      if (!D.pl || !D.pl.length) return;
      var b = SHUT.fp;
      ctx.globalCompositeOperation = "lighter";
      D.pl = D.pl.filter(function (p) {
        p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= Math.pow(.985, dt); p.life += dt;
        var age = p.life / p.max;
        ctx.globalAlpha = Math.max(0, .85 * (1 - age));
        ctx.fillStyle = PLASMA[Math.min(3, Math.floor(age * 4))];
        ctx.fillRect(Math.round(p.x / b) * b, Math.round(p.y / b) * b, b * (age < .3 ? 2 : 1), b);
        return age < 1;
      });
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
      if (D.pl.length > 900) D.pl.splice(0, D.pl.length - 900);
    }
    var D = { t: -2 }, Q = { x: -200, y: 0, first: true }, C = { t: -2 };
    wind.blow = blow;
    game.craft = function () { return { ship: ship, launch: L, shuttle: D, station: Q, capsule: C, rocket: R, hubble: U, roadster: Z, aliens: aliens, air: A }; };
    /* a rocket that climbs, drops what it doesn't need, and keeps going */
    var R = { t: -2 };
    function climb(dt, full, rest, drops, sepAt, fire) {
      if (R.t < 0) { R.t += dt; if (R.t >= 0) { R.x = Math.round(rnd(W * .2, W * .8) / P) * P; R.y = horizon(); R.v = 0; R.sep = false; R.parts = []; } drawSmoke(dt); return; }
      R.t += dt; R.v = Math.min(4.5, R.v + .008 * dt); R.y -= R.v * dt;     /* slower than the Starship: these are heavier */
      var img = R.sep ? rest : full;
      blow(R, R.x, R.y + img.height / 2, dt);
      if (!R.sep && R.y < H * sepAt) {
        R.sep = true;
        R.parts = drops.map(function (d) { return { img: d.img, x: R.x + d.dx, y: R.y + d.dy, vx: d.vx, vy: -R.v * .5, rot: 0, vr: d.vr, burn: d.burn }; });
      }
      R.parts.forEach(function (q) {
        q.vy += .03 * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.rot += q.vr * dt;
        blow(q, q.x, q.y + q.img.height / 2, dt);
        ctx.save(); ctx.translate(q.x, q.y + q.img.height / 2); ctx.rotate(q.rot);
        ctx.drawImage(q.img, -q.img.width / 2, -q.img.height / 2);
        if (q.burn && q.vy > .6) flame(0, q.img.height / 2, 4);       /* side boosters fire to come home */
        ctx.restore();
      });
      ctx.drawImage(img, R.x - img.width / 2, R.y);
      if (fire) fire(R.x, R.y, img, R.sep); else flame(R.x, R.y + img.height, (R.sep ? 7 : 11) + Math.floor(Math.random() * 3));
      if (!R.sep && Math.random() < .9) puff(R.x, R.y + img.height + 30, 3, "rgba(230,225,240,.9)");
      drawSmoke(dt);
      if (R.y < -img.height - 40 && R.parts.every(function (q) { return q.y > H; })) nextCraft(rnd(400, 900));
    }
    var U = { x: -300, y: 0, first: true }, Z = { x: -300, y: 0, rot: 0, first: true };
    var A = { t: -2, trail: [] };                                     /* whichever aircraft is crossing */
    /* an aircraft crossing the sky at a steady height: in from one side, out the other. The jet leaves a
       trail and lights its burners; the helicopter's rotors turn. */
    function flyby(k, dt, t) {
      var d = AIR[k];
      if (A.t < 0) {
        A.t += dt;
        if (A.t >= 0) { A.dir = Math.random() < .5 ? 1 : -1; var w0 = d.img[0].width; A.x = A.dir > 0 ? -w0 - 10 : W + 10; A.y = rnd(H * .1, H * .38); A.trail = []; }
        return;
      }
      A.t += dt;
      var img = d.img[A.dir > 0 ? 0 : 1];
      A.x += A.dir * d.v * dt; A.y += Math.sin(A.t / 60) * .12 * dt;
      blow(A, A.x + img.width / 2, A.y + img.height / 2, dt);
      var fp = SHUT.fp;
      if (d.jet) {                                                    /* a vapour trail, and the burners */
        var tx = A.dir > 0 ? A.x + d.jet[0] : A.x + img.width - d.jet[0], ty = A.y + d.jet[1];
        A.trail.push({ x: tx, y: ty, life: 90 });
        A.trail = A.trail.filter(function (p) { p.life -= dt; ctx.globalAlpha = Math.max(0, p.life / 90) * .5; ctx.fillStyle = "#efe4ff"; ctx.fillRect(Math.round(p.x / fp) * fp, Math.round(p.y / fp) * fp, fp, fp); return p.life > 0; });
        ctx.globalAlpha = 1;
        for (var i = 0; i < 4 + Math.floor(Math.random() * 3); i++) { ctx.fillStyle = i < 2 ? "#bfe6ff" : "#ff8a3d"; ctx.fillRect(Math.round(tx - A.dir * (i + 1) * fp), Math.round(ty - fp / 2), fp, fp); }
      }
      ctx.drawImage(img, Math.round(A.x), Math.round(A.y));
      if (d.rotor) {                                                  /* five blades seen edge-on: they shorten and lengthen as they turn */
        var hx = A.dir > 0 ? A.x + d.rotor[0] : A.x + img.width - d.rotor[0], hy = A.y + d.rotor[1], L = d.rotor[2], a = t / 40;
        ctx.fillStyle = "#2a2a33";
        [0, 1.257, 2.513].forEach(function (o) { var l = Math.abs(Math.cos(a + o)) * L; ctx.fillRect(Math.round(hx - l), Math.round(hy), Math.round(l * 2), fp); });
        var rx = A.dir > 0 ? A.x + d.tail[0] : A.x + img.width - d.tail[0], ry = A.y + d.tail[1], tl = Math.abs(Math.cos(t / 12)) * d.tail[2];
        ctx.fillRect(Math.round(rx), Math.round(ry - tl), fp, Math.round(tl * 2));
      }
      if ((A.dir > 0 && A.x > W + 20) || (A.dir < 0 && A.x < -img.width - 20)) nextCraft(rnd(300, 700));
    }
    var SCENES = {
      "shuttle-launch": function (dt) {
        climb(dt, STK, STC, [                                         /* both boosters off the tank's middle: one was hidden behind */
          { img: SRB, dx: 0, dy: 0, vx: -.6, vr: -.004 },
          { img: SRB, dx: 0, dy: 0, vx: .6, vr: .004 }
        ], .38, shuttleFire);
      },
      "falcon-heavy": function (dt) {
        climb(dt, FH, FHC, [
          { img: FHS, dx: -FH.width / 2 + FHS.width / 2, dy: FH.height - FHS.height, vx: -.5, vr: 0, burn: true },
          { img: FHS, dx: FH.width / 2 - FHS.width / 2, dy: FH.height - FHS.height, vx: .5, vr: 0, burn: true }
        ], .42);
      },
      dc3: function (dt, t) { flyby("dc3", dt, t); },
      spitfire: function (dt, t) { flyby("spitfire", dt, t); },
      tomcat: function (dt, t) { flyby("tomcat", dt, t); },
      seaking: function (dt, t) { flyby("seaking", dt, t); },
      hubble: function (dt, t) {
        if (U.wait > 0) { U.wait -= dt; return; }
        if (U.x > W + 200 && U.x < 9000) { nextCraft(rnd(300, 700)); return; }
        if (U.x < -200 || U.x > W + 200) { U.x = U.first ? rnd(W * .5, W * .75) : -180; U.y = rnd(H * .1, H * .3); U.first = false; }
        U.x += .3 * dt;
        blow(U, U.x + HU.width / 2, U.y + HU.height / 2, dt);
        ctx.drawImage(HU, U.x, U.y);
        if (Math.floor(t / 900) % 2) { ctx.fillStyle = "#7ff3ff"; ctx.fillRect(U.x + HU.blink[0], U.y + HU.blink[1], SHUT.fp, SHUT.fp); }
      },
      roadster: function (dt) {
        if (Z.wait > 0) { Z.wait -= dt; return; }
        if (Z.x > W + 200 && Z.x < 9000) { nextCraft(rnd(300, 700)); return; }
        if (Z.x < -200 || Z.x > W + 200) { Z.x = Z.first ? rnd(W * .5, W * .75) : -160; Z.y = rnd(H * .1, H * .35); Z.rot = rnd(-.3, .3); Z.first = false; }
        Z.x += .4 * dt; Z.y += .05 * dt; Z.rot += .0025 * dt;   /* tumbling, very slowly */
        blow(Z, Z.x + RD.width / 2, Z.y + RD.height / 2, dt);
        ctx.save(); ctx.translate(Z.x + RD.width / 2, Z.y + RD.height / 2); ctx.rotate(Z.rot);
        ctx.drawImage(RD, -RD.width / 2, -RD.height / 2); ctx.restore();
      },
      launch: function (dt) {
        if (L.t < 0) { L.t += dt; if (L.t >= 0) { L.x = Math.round(rnd(W * .2, W * .8) / P) * P; L.y = horizon(); L.v = 0; L.sep = false; L.gone = false; } drawSmoke(dt); return; }
        L.t += dt; L.v = Math.min(6, L.v + .012 * dt); L.y -= L.v * dt;
        blow(L, L.x, L.y + SS.height / 2, dt);
        if (L.sep) blow(L, L.bx, L.by + BO.height / 2, dt, "bx", "by");
        if (!L.sep && L.y < H * .32) { L.sep = true; L.bx = L.x; L.by = L.y + SS.height - BO.height; L.bvy = -L.v * .6; 0; }
        if (L.sep) {
          L.bvy += .03 * dt; L.by += L.bvy * dt;
          if (!L.gone) { ctx.drawImage(BO, L.bx - BO.width / 2, L.by); if (L.bvy > .5) flame(L.bx, L.by + BO.height, 4); }
          ctx.drawImage(SS, 0, 0, SS.width, SS.height - BO.height, L.x - SS.width / 2, L.y, SS.width, SS.height - BO.height);
          flame(L.x, L.y + SS.height - BO.height, 6);
          if (L.by > H) nextCraft(rnd(400, 900));
        } else {
          ctx.drawImage(SS, L.x - SS.width / 2, L.y);
          flame(L.x, L.y + SS.height, 10 + Math.floor(Math.random() * 4));
          if (Math.random() < .8) puff(L.x, L.y + SS.height + 30, 2, "rgba(230,225,240,.9)");
        }
        drawSmoke(dt);
      },
      /* re-entry, side on: nose high, the belly in a sheath of plasma that streams off behind; lower down
         the plasma fades, the nose comes down to a glide, gear drops, and it flares behind the city */
      landing: function (dt) {
        if (D.t < 0) {
          D.t += dt; drawPlasma(dt);
          if (D.t >= 0) { D.x = W + SH.width; D.y = H * .06; D.vx = -2.1; D.vy = .62; D.aoa = 40; D.pl = D.pl || []; }
          return;
        }
        D.t += dt;
        var f = Math.max(0, Math.min(1, D.y / horizon())), heat = Math.max(0, 1 - f / .42);
        var want = f < .35 ? 40 : f < .65 ? 40 - (f - .35) / .3 * 28 : f < .85 ? 12 : 7;
        D.aoa += (want - D.aoa) * .03 * dt;
        D.vx += ((f < .5 ? -2.1 : -1.6) - D.vx) * .01 * dt;
        D.x += D.vx * dt; D.y += D.vy * dt;
        blow(D, D.x, D.y, dt);
        var a = D.aoa * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a), hw = SH.width / 2, hh = SH.height / 2;
        var belly = hh * .72;                                         /* the belly line, below the centre */
        function at(u, v) { return { x: D.x + u * ca - v * sa, y: D.y + u * sa + v * ca }; }
        if (heat > 0) {                                               /* new plasma off the nose and belly */
          var n = Math.round(30 * heat), back = Math.atan2(-D.vy, -D.vx);
          for (var i = 0; i < n; i++) {
            var u = -hw + Math.pow(Math.random(), 2.2) * SH.width * .75, p = at(u, belly + rnd(0, 4)), sp = rnd(1.2, 3);
            D.pl.push({ x: p.x, y: p.y, vx: Math.cos(back) * sp + rnd(-.25, .25), vy: Math.sin(back) * sp + rnd(0, .6), life: 0, max: rnd(18, 40) * heat + 10 });
          }
        }
        drawPlasma(dt);
        ctx.save(); ctx.translate(D.x, D.y); ctx.rotate(a);
        if (heat > 0) {                                               /* the hot sheath hugging the belly */
          ctx.globalCompositeOperation = "lighter";
          var fp = SHUT.fp, fl = .8 + Math.random() * .2;
          [[4, "#9a5cff", .25], [3, "#ff6fae", .35], [2, "#ffb36b", .5], [1, "#fff4e0", .7]].forEach(function (l) {   /* layered sheath, widest and coolest outside */
            ctx.globalAlpha = l[2] * heat * fl; ctx.fillStyle = l[1];
            ctx.fillRect(-hw - fp * l[0], belly - fp, SH.width * (.55 + l[0] * .06), fp * (1 + l[0]));
            ctx.fillRect(-hw - fp * l[0], -hh * .2, fp * l[0], belly + hh * .2 + fp * l[0]);
          });
          ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
        }
        ctx.drawImage(SH, -hw, -hh);
        if (f > .78) {                                                /* gear down */
          var g = SHUT.fp;
          ctx.fillStyle = "#2a2a33";
          ctx.fillRect(-hw + SH.width * .14, belly, g, g * 3); ctx.fillRect(-hw + SH.width * .62, belly, g, g * 3);
          ctx.fillRect(-hw + SH.width * .62 - g, belly + g * 3, g * 3, g);
        }
        ctx.restore();
        if (D.y > horizon() + 20 || D.x < -SH.width - 60) nextCraft(rnd(300, 700));
      },
      station: function (dt, t) {
        if (Q.wait > 0) { Q.wait -= dt; return; }
        if (Q.x > W + 150 && Q.x < 9000) { nextCraft(rnd(300, 700)); return; }
        if (Q.x < -150 || Q.x > W + 150) { Q.x = Q.first ? rnd(W * .15, W * .45) : -140; Q.y = rnd(H * .08, H * .25); Q.first = false; }
        Q.x += .45 * dt;
        blow(Q, Q.x + ST.width / 2, Q.y + ST.height / 2, dt);
        ctx.drawImage(ST, Q.x, Q.y);
        if (Math.floor(t / 700) % 2) { ctx.fillStyle = "#ff4f6d"; ctx.fillRect(Q.x + ST.blink[0], Q.y + ST.blink[1], SHUT.fp, SHUT.fp); }
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
        if (C.y > horizon() + 30) nextCraft(rnd(300, 700));
      }
    };
    function patrol(dt, t) {
      /* aliens drift in now and then; the ship patrols and shoots them */
      spawnT -= dt / 60;
      if (spawnT <= 0) { spawnAlien(); spawnT = rnd(5, 11); }
      ship.x += ship.vx * dt;
      blow(ship, ship.x + shipImg.width / 2, ship.y + shipImg.height / 2, dt);
      if (ship.x > W + 80) { ship.x = -80; ship.y = Math.round(rnd(H * .18, H * .42)); }
      ship.cool -= dt;
      var target = aliens.filter(function (a) { return a.x > ship.x && Math.abs(a.y - ship.y) < 30; })[0];
      if (target && ship.cool <= 0 && target.x - ship.x < 420) { bolts.push({ x: ship.x + shipImg.width, y: ship.y + shipImg.height / 2 }); ship.cool = 28; }
      if (target) ship.y += Math.sign(target.y - ship.y) * .4 * dt;

      bolts = bolts.filter(function (b) {
        b.x += 7 * dt;
        ctx.fillStyle = "#ff8fd0"; ctx.fillRect(b.x, b.y, 12, SHUT.fp);
        for (var i = 0; i < aliens.length; i++) {
          var a = aliens[i];
          if (b.x > a.x && b.x < a.x + alienImg.width && b.y > a.y - 3 && b.y < a.y + alienImg.height + 3) { explode(a); aliens.splice(i, 1); return false; }
        }
        return b.x < W;
      });

      aliens = aliens.filter(function (a) {
        a.bob += .05 * dt; a.x += a.vx * dt;
        blow(a, a.x + alienImg.width / 2, a.y + alienImg.height / 2, dt);
        ctx.drawImage(alienImg, Math.round(a.x), Math.round(a.y + Math.sin(a.bob) * 4));
        return a.x > -40;
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
      if (Math.floor(t / 90) % 2) { var fp = SHUT.fp; ctx.fillStyle = "#ffd36e"; ctx.fillRect(-shipImg.width / 2 - fp, -fp / 2, fp, fp); }
      ctx.restore();

    }

    var last = 0, spawnT = 4, starCol = "", starAge = 0;
    var SLOW = window.matchMedia && matchMedia("(pointer: coarse)").matches, drawn = 0;   /* phones: 30 fps, half the battery */
    function frame(t) {
      if (SLOW && t - drawn < 30) { if (!document.hidden && running) requestAnimationFrame(frame); return; }
      drawn = t;
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
      drawBits(dt);

      if (!document.hidden && running) requestAnimationFrame(frame);
    }

    /* only animate while the title screen is on screen */
    var running = false;
    function start() { if (running || REDUCED) return; running = true; last = 0; requestAnimationFrame(frame); }
    function stop() { running = false; }
    /* phones: the stars, drawn once, and nothing flying */
    function still() {
      ctx.clearRect(0, 0, W, H); starCol = css("--star") || "#fff";
      stars.forEach(function (s) {
        ctx.globalAlpha = .35 + .65 * Math.abs(Math.sin(s.t)); ctx.fillStyle = starCol;
        ctx.fillRect(s.x, s.y, s.big ? P : P - 1, s.big ? P : P - 1);
      });
      ctx.globalAlpha = 1;
    }
    size();
    if (LITE) {
      still();
      window.addEventListener("resize", function () { var w = W, h = H; size(); if (w !== W || h !== H) still(); });
      new MutationObserver(function () { setTimeout(still, 0); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
      if (window.matchMedia) { var mq = matchMedia("(prefers-color-scheme: dark)"); (mq.addEventListener ? mq.addEventListener("change", still) : mq.addListener(still)); }
      return;
    }
    window.addEventListener("resize", size);
    if (REDUCED) { frame(0); return; }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) { e[0].isIntersecting ? start() : stop(); }).observe(sky);
    } else start();
    document.addEventListener("visibilitychange", function () { if (!document.hidden) { running = false; start(); } });

    /* click something flying and it explodes; the cursor turns to the firing ship over a target */
    function skyPoint(e) {
      if (e.target.closest && e.target.closest("a,button,input,textarea,.dock,.lb,.counter")) return null;
      var r = sky.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      return x >= 0 && y >= 0 && x <= r.width && y <= r.height ? { x: x, y: y } : null;
    }
    document.addEventListener("click", function (e) {
      if (REDUCED) return;
      var p = skyPoint(e), o = p && hitAt(p.x, p.y);
      if (o) { o.kill(); game.kills = (game.kills || 0) + 1; document.body.classList.remove("aim"); }
    });
    document.addEventListener("pointermove", function (e) {
      if (REDUCED || e.pointerType === "touch") return;
      var p = skyPoint(e);
      document.body.classList.toggle("aim", !!(p && hitAt(p.x, p.y)));
    }, { passive: true });
    game.hitAt = function (x, y) { return !!hitAt(x, y); };

    game.invade = function () {
      scene = "patrol"; sky.dataset.scene = "patrol"; game.invading = true;   /* your own ship comes back while the aliens are here */
      for (var i = 0; i < 12; i++) spawnAlien(W * .4 + i * (W * .05));
      ship.x = 20; ship.vx = 1.6;
      toast("↑↑↓↓←→←→BA — incoming. 30 lives granted (not really).");
    };
  })();

  /* ================================================================
     THE CITY: the picture is anchored to the right edge (so the towers
     stand clear of the title). These place things on it, in image pixels
     of the 4800x570 banner (see tools/city/build_city.py --sos). The banner
     never repeats: a narrower screen crops more off its left.
     ================================================================ */
  var TILE = { w: 4800, h: 570, sos: [4398, 208], jazz: [4528, 440, 4612, 524] };
  function cityPoint(ix, iy) {
    var city = $(".city"); if (!city) return null;
    var s = city.getBoundingClientRect().height / TILE.h;
    return { x: city.offsetLeft + city.offsetWidth - (TILE.w - ix) * s, y: city.offsetTop + iy * s, s: s };
  }
  var jazzBtn = null;
  /* the SOS window on the first Petronas tower, and the jazz club's door */
  function placeSOS() {
    if (!TILE) return;                       /* the sky calls this before this part of the file has run */
    var sos = $(".sos"), p = cityPoint(TILE.sos[0], TILE.sos[1]);
    if (sos && p) {
      sos.style.left = p.x + "px"; sos.style.top = p.y + "px";
      sos.style.width = Math.max(3, 4 * p.s) + "px"; sos.style.height = Math.max(2, 2 * p.s) + "px";
    }
    var hero = $("#hero"), j = TILE.jazz, a = cityPoint(j[0], j[1]);
    if (!hero || !a || !$(".city", hero)) return;
    if (!jazzBtn) {
      jazzBtn = el("button", "jazz"); jazzBtn.type = "button"; jazzBtn.id = "jazz";
      jazzBtn.title = "The Low Pass: jazz, live tonight";
      jazzBtn.setAttribute("aria-label", "The Low Pass jazz club: play a tune");
      jazzBtn.addEventListener("click", function () { jazz.toggle(); });
      hero.appendChild(jazzBtn);
    }
    jazzBtn.style.left = a.x + "px"; jazzBtn.style.top = a.y + "px";
    jazzBtn.style.width = (j[2] - j[0]) * a.s + "px"; jazzBtn.style.height = (j[3] - j[1]) * a.s + "px";
    jazzBtn.hidden = a.x < 0;
  }

  /* ================================================================
     THE LOW PASS: an original 16-bar swing in F, "Ground Loop Swing",
     played twice through with a tag ending. Vibes on the tune, piano
     comping, a walking upright bass, ride and hi-hat. All synthesised
     here, nothing downloaded.
     ================================================================ */
  var jazz = (function () {
    var B = 60 / 132, SW = 2 / 3;                                   /* a beat; the swung "and" */
    var PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
    function pc(n) { return PC[n[0]] + (n[1] === "#" ? 1 : n[1] === "b" ? -1 : 0); }
    function midi(n) { return 12 * (+n[n.length - 1] + 1) + pc(n); }
    function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
    /* the piano's rootless voicings: 3rd, 7th (or 6th), 9th (or b9) */
    var VOICE = { maj7: [4, 11, 14], "7": [4, 10, 14], m7: [3, 10, 14], "6": [4, 9, 14], "7b9": [4, 10, 13] };
    var CHANGES = ["F maj7", "D 7b9", "G m7", "C 7", "A m7|D 7", "G m7|C 7", "F maj7", "C m7|F 7",
                   "Bb maj7", "Bb m7|Eb 7", "A m7", "D 7", "G m7", "C 7", "F 6|D 7", "G m7|C 7"];
    /* eight swung eighths a bar: a note, "-" holds it, "." rests */
    var TUNE = [". A4 C5 E5 - - D5 C5", "A4 - F#4 A4 C5 Eb5 - D5", "Bb4 - - - . G4 Bb4 D5", "F5 E5 D5 C5 Bb4 G4 E4 G4",
                "C5 - . A4 . F#4 A4 C5", "Bb4 A4 G4 F4 E4 - G4 Bb4", "A4 - - - . . . .", ". G4 Bb4 D5 Eb5 - C5 A4",
                "D5 - - F5 . D5 C5 Bb4", "Db5 - C5 Bb4 G4 - Db5 C5", "C5 - - . E5 - D5 C5", "A4 C5 F#5 - E5 D5 C5 A4",
                "Bb4 - D5 F5 - E5 D5 Bb4", "G4 E4 G4 Bb4 Db5 C5 Bb4 G4", "A4 - - F4 . F#4 A4 C5", "Eb5 D5 Bb4 G4 E4 - . ."];
    var MEL = TUNE.map(function (bar) {
      var ev = [];
      bar.split(" ").forEach(function (x, i) {
        var b = Math.floor(i / 2) + (i % 2 ? SW : 0), open = ev[ev.length - 1];
        if (x === "-") return;
        if (open && open.d == null) open.d = b - open.b;
        if (x !== ".") ev.push({ b: b, m: midi(x) });
      });
      ev.forEach(function (e) { if (e.d == null) e.d = 4 - e.b; });
      return ev;
    });
    var COMP = [[[0, .6], [1 + SW, 1.2]], [[SW, .5], [2 + SW, 1.2]], [[1 + SW, .6], [3, .8]], [[0, 1.6], [2 + SW, .9]]];

    var ac, out, timer = null, endT = null, nextT = 0, barN = 0, playing = false;
    function bassNote(name) { return 29 + (pc(name) - 5 + 12) % 12; }      /* F1 .. E2 */
    function osc(type, f, t, end, dest) {
      var o = ac.createOscillator(); o.type = type; o.frequency.value = f; o.connect(dest); o.start(t); o.stop(end + .05); return o;
    }
    function vibe(t, d, m) {
      var end = t + Math.max(.6, d) + 1, g = ac.createGain(), trem = ac.createGain(), lfo = ac.createOscillator(), depth = ac.createGain();
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.15, t + .004); g.gain.exponentialRampToValueAtTime(.0008, end);
      lfo.frequency.value = 5.5; depth.gain.value = .25; lfo.connect(depth); depth.connect(trem.gain); lfo.start(t); lfo.stop(end);
      g.connect(trem); trem.connect(out);
      osc("sine", hz(m), t, end, g);
      var strike = ac.createGain(); strike.gain.setValueAtTime(.35, t); strike.gain.exponentialRampToValueAtTime(.001, t + .25); strike.connect(g);
      osc("sine", hz(m) * 4, t, t + .3, strike);                        /* the bright 4th partial of a struck bar */
    }
    function bass(t, d, m) {
      var g = ac.createGain(), f = ac.createBiquadFilter(), k = Math.min(.12, d * .3);
      f.type = "lowpass"; f.frequency.value = 650;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.5, t + .008); g.gain.exponentialRampToValueAtTime(.2, t + k);
      g.gain.setValueAtTime(.2, t + d * .8); g.gain.exponentialRampToValueAtTime(.001, t + d + .08);
      g.connect(f); f.connect(out);
      osc("triangle", hz(m), t, t + d + .1, g); osc("sine", hz(m), t, t + d + .1, g);
    }
    function keys(t, d, m) {
      var g = ac.createGain(), f = ac.createBiquadFilter(), k = Math.min(.25, d * .7);
      f.type = "lowpass"; f.frequency.value = 1900;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.05, t + .006); g.gain.exponentialRampToValueAtTime(.02, t + k);
      g.gain.setValueAtTime(.02, t + d); g.gain.exponentialRampToValueAtTime(.0005, t + d + .15);
      g.connect(f); f.connect(out);
      osc("triangle", hz(m), t, t + d + .2, g); osc("sine", hz(m) * 2.002, t, t + d + .2, g);
    }
    function hiss(t, v, hp, len) {
      var n = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
      n.buffer = noiseBuf(ac); f.type = "highpass"; f.frequency.value = hp;
      g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0008, t + len);
      n.connect(f); f.connect(g); g.connect(out); n.start(t, Math.random() * .5); n.stop(t + len + .05);
    }
    function ride(t, v) {
      hiss(t, v, 7000, .45);
      var b = ac.createGain(); b.gain.setValueAtTime(v * .18, t); b.gain.exponentialRampToValueAtTime(.0005, t + .35); b.connect(out);
      osc("sine", 3150, t, t + .35, b); osc("sine", 4710, t, t + .35, b);
    }
    function kick(t) {
      var o = ac.createOscillator(), g = ac.createGain();
      o.frequency.setValueAtTime(75, t); o.frequency.exponentialRampToValueAtTime(42, t + .15);
      g.gain.setValueAtTime(.12, t); g.gain.exponentialRampToValueAtTime(.001, t + .2);
      o.connect(g); g.connect(out); o.start(t); o.stop(t + .22);
    }
    function bar(i, t0) {
      var segs = CHANGES[i].split("|"), each = 4 / segs.length;
      segs.forEach(function (c, k) {
        var p = c.split(" "), t = t0 + k * each * B, br = bassNote(p[0]);
        var next = (k + 1 < segs.length ? segs[k + 1] : CHANGES[(i + 1) % 16].split("|")[0]).split(" ")[0], nr = bassNote(next);
        var walk = each === 4
          ? [br, Math.random() < .5 ? br + (p[1] === "m7" ? 3 : 4) : br + 2, br + 7, nr + (Math.random() < .5 ? -1 : 1)]
          : [br, nr + (nr > br ? -1 : 1)];
        walk.forEach(function (m, j) { bass(t + j * B, B * .92, m); });
        var vo = VOICE[p[1]].map(function (iv) { var m = 48 + (pc(p[0]) + iv) % 12; while (m < 52) m += 12; return m; });
        var hits = each === 4 ? COMP[Math.floor(Math.random() * COMP.length)] : [[Math.random() < .5 ? 0 : SW, .9]];
        hits.forEach(function (h) { vo.forEach(function (m) { keys(t + h[0] * B, h[1] * B, m); }); });
      });
      [0, 1, 1 + SW, 2, 3, 3 + SW].forEach(function (b) { ride(t0 + b * B, b === 1 || b === 3 ? .06 : .04); });
      [1, 3].forEach(function (b) { hiss(t0 + b * B, .05, 9000, .05); });
      [0, 1, 2, 3].forEach(function (b) { kick(t0 + b * B); });
      MEL[i].forEach(function (e) { vibe(t0 + e.b * B, e.d * B, e.m); });
    }
    function ending(t) {
      bass(t, 3 * B, 29);
      [57, 62, 65, 69].forEach(function (m) { keys(t, 3 * B, m); });       /* F6: A D F A */
      vibe(t, 3 * B, 77); vibe(t + .04, 3 * B, 81);
      for (var i = 0; i < 8; i++) ride(t - 2 * B + i * B / 4, .02 + i * .006);
      ride(t, .09); kick(t);
    }
    function float(at) {                                             /* a note drifts up from the club */
      setTimeout(function () {
        if (!playing || !jazzBtn) return;
        var n = el("span", "note"); n.textContent = Math.random() < .5 ? "\u266A" : "\u266B"; n.setAttribute("aria-hidden", "true");
        n.style.left = (parseFloat(jazzBtn.style.left) + parseFloat(jazzBtn.style.width) * rnd(.3, .7)) + "px";
        n.style.top = (parseFloat(jazzBtn.style.top) - 6) + "px";
        n.style.setProperty("--dx", rnd(-24, 24) + "px"); n.style.setProperty("--r", rnd(-30, 30) + "deg");
        jazzBtn.parentNode.appendChild(n);
        setTimeout(function () { n.remove(); }, 2700);
      }, Math.max(0, (at - ac.currentTime) * 1000));
    }
    function pump() {
      while (playing && nextT < ac.currentTime + .6) {
        if (barN < 32) { bar(barN % 16, nextT); float(nextT); float(nextT + 2 * B); nextT += 4 * B; barN++; }
        else {
          ending(nextT); clearInterval(timer); timer = null;
          endT = setTimeout(function () { stop(true); }, (nextT - ac.currentTime + 4 * B + 1.2) * 1000);
          break;
        }
      }
    }
    function start() {
      ac = audio(); if (!ac) return false;
      out = ac.createGain(); out.gain.value = .9;
      var comp = ac.createDynamicsCompressor(), d = ac.createDelay(), fb = ac.createGain(), lp = ac.createBiquadFilter(), wet = ac.createGain();
      out.connect(comp); comp.connect(ac.destination);
      d.delayTime.value = .11; fb.gain.value = .3; lp.type = "lowpass"; lp.frequency.value = 2200; wet.gain.value = .2;   /* a small room */
      out.connect(d); d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(wet); wet.connect(comp);
      barN = 0; nextT = ac.currentTime + .12; playing = true;
      timer = setInterval(pump, 80); pump();
      if (jazzBtn) jazzBtn.classList.add("on");
      return true;
    }
    function stop(natural) {
      if (!playing) return;
      playing = false; clearInterval(timer); clearTimeout(endT); timer = endT = null;
      var g = out, t = ac.currentTime;
      g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0, t + (natural ? .05 : .5));
      setTimeout(function () { g.disconnect(); }, 700);
      if (jazzBtn) jazzBtn.classList.remove("on");
      if (!natural) toast("You step back out into the rain.");
    }
    document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); });
    return {
      toggle: function () {
        if (playing) return stop();
        if (start()) toast("\u266A Live at The Low Pass: \u201cGround Loop Swing\u201d. Click the club again to leave.");
        else toast("The Low Pass is closed tonight (no audio in this browser).");
      },
      playing: function () { return playing; }
    };
  })();
  placeSOS();
  window.addEventListener("resize", placeSOS);
  /* the city's blinking lights only run while the title screen is in view */
  (function () {
    var hero = $("#hero");
    if (hero && "IntersectionObserver" in window) {
      new IntersectionObserver(function (e) { hero.classList.toggle("away", !e[0].isIntersecting); }).observe(hero);
    }
  })();

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
  /* ================================================================
     THE RÉSUMÉ: click "Tesla, Inc." and it goes Tesla red, with a car
     sound (an error chime first, then whatever it feels like); click
     "Dometic Marine" and it spins up like a boat gyro. The sounds are
     made here, in the style of a car's, not recordings.
     ================================================================ */
  var carSounds = (function () {
    function tone(ac, f, t, len, type, v, out) {
      var o = ac.createOscillator(), g = ac.createGain();
      o.type = type || "sine"; o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v || .12, t + .01); g.gain.exponentialRampToValueAtTime(.0008, t + len);
      o.connect(g); g.connect(out || ac.destination); o.start(t); o.stop(t + len + .05); return o;
    }
    var S = {
      error: ["Error chime. Something needs attention.", function (ac, t) { tone(ac, 880, t, .45); tone(ac, 659, t + .22, .6); }],
      seatbelt: ["Seatbelt reminder.", function (ac, t) { for (var i = 0; i < 4; i++) tone(ac, 1046, t + i * .32, .22, "sine", .09); }],
      signal: ["Turn signal.", function (ac, t) {
        for (var i = 0; i < 6; i++) { var n = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(), at = t + i * .38;
          n.buffer = noiseBuf(ac); f.type = "bandpass"; f.frequency.value = i % 2 ? 1800 : 2600; f.Q.value = 6;
          g.gain.setValueAtTime(.5, at); g.gain.exponentialRampToValueAtTime(.001, at + .03);
          n.connect(f); f.connect(g); g.connect(ac.destination); n.start(at); n.stop(at + .05); } }],
      lock: ["Lock chirp.", function (ac, t) { tone(ac, 1568, t, .08, "square", .05); tone(ac, 2093, t + .1, .12, "square", .05); }],
      autopilot: ["Driver assist engaged.", function (ac, t) { tone(ac, 784, t, .25); tone(ac, 1175, t + .14, .45); }],
      emissions: ["Emissions Testing Mode.", function (ac, t) {           /* yes, the car can do this */
        var o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain(), lfo = ac.createOscillator(), d = ac.createGain();
        o.type = "sawtooth"; o.frequency.setValueAtTime(95, t); o.frequency.exponentialRampToValueAtTime(55, t + .8);
        lfo.frequency.value = 23; d.gain.value = 18; lfo.connect(d); d.connect(o.frequency);
        f.type = "lowpass"; f.frequency.value = 420;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.3, t + .04); g.gain.exponentialRampToValueAtTime(.001, t + .85);
        o.connect(f); f.connect(g); g.connect(ac.destination); o.start(t); lfo.start(t); o.stop(t + .9); lfo.stop(t + .9); }]
    };
    var keys = Object.keys(S), played = 0;
    return function () {
      var ac = audio(), k = played++ === 0 ? "error" : keys[Math.floor(Math.random() * keys.length)];
      if (ac) S[k][1](ac, ac.currentTime + .02);
      return S[k][0];
    };
  })();
  function gyroWhine() {
    var ac = audio(); if (!ac) return;
    var t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
    o.type = "triangle"; o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(880, t + 1.2); o.frequency.exponentialRampToValueAtTime(140, t + 2.6);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.06, t + .3); g.gain.setValueAtTime(.06, t + 1.6); g.gain.exponentialRampToValueAtTime(.001, t + 2.7);
    o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + 2.8);
  }
  Array.prototype.forEach.call(document.querySelectorAll("[data-egg]"), function (n) {
    function go() {
      if (n.dataset.egg === "tesla") { n.classList.add("tesla-red"); toast(carSounds()); }
      else if (n.dataset.egg === "gyro") {
        gyroWhine();
        if (!REDUCED) { n.classList.remove("gyro"); void n.offsetWidth; n.classList.add("gyro"); }
        toast("Spinning up the gyro.");
      }
    }
    n.addEventListener("click", go);
    n.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
  });

  window.fx = { game: game, toast: toast, drinks: drinks, wind: wind, jazz: jazz, setTheme: function (t) { setTheme(t); } };

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

  /* phones have no hover: the card or job in the middle of the screen lights up instead */
  if (LITE && "IntersectionObserver" in window) {
    var lit = new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.target.classList.toggle("lit", e.isIntersecting); });
    }, { rootMargin: "-40% 0px -40% 0px" });
    var watch = function () { document.querySelectorAll(".proj,.job").forEach(function (n) { lit.observe(n); }); };
    watch();
    if (window.entriesReady) window.entriesReady.then(watch);
  }

  /* for the people who open the console */
  if (window.console && console.log) {
    console.log("%c WK · TOP FLOOR ", "background:#0d0820;color:#7ff3ff;font:bold 14px monospace;padding:4px 8px");
    console.log("Hello, fellow engineer. Three messages are hidden in the city: two in the car lights, one in a window. Also try ↑↑↓↓←→←→BA.");
  }
})();
