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
    shuttlestack: { pal: { o: "#d9792b", O: "#a85a1e", s: "#eef0f4", S: "#c9ccd6", d: "#5a5f6e", k: "#22232b", w: "#f2f2f2", g: "#c9ccd6", e: "#8a8f9e" }, rows: ["...........", "......oo...", ".....oooO..", ".....oooO..", "s....oooOs.", "sS...oooOsS", "sS...oooOsS", "sS...oooOsS", "sS...oooOsS", "sS...oooOsS", "sS.kwoooOsS", "sS.kwoooOsS", "ddkwwoooOdd", "sSkwwoooOsS", "sSkwwoooOsS", "sSkwwoooOsS", "sSkwwoooOsS", "sSkwwoooOsS", "sSkwwoooOsS", "sSkwwoooOsS", "sSkwwoooOsS", "sSkwwoooOsS", "sSkwwoooOsS", "sSkwwoooOsS", "ddkwwoooOdd", "sSkwwoooOsS", "sSkwwoooOsS", "sSkwwoooOsS", "sSkwwoooOsS", "sSkwwoooOsS", "sSkwwoooOsS", "sSkwwoooOsS", "sgkwwoooOsS", "sgkwwoooOsS", "sgkww....sS", "sSeee....sS", "kk.......kk", "kk.......kk"] },
    shuttlecore: { pal: { o: "#d9792b", O: "#a85a1e", k: "#22232b", w: "#f2f2f2", e: "#8a8f9e" }, rows: ["...........", "......oo...", ".....oooO..", ".....oooO..", ".....oooO..", ".....oooO..", ".....oooO..", ".....oooO..", ".....oooO..", ".....oooO..", "...kwoooO..", "...kwoooO..", "..kwwoooO..", "..kwwoooO..", "..kwwoooO..", "..kwwoooO..", "..kwwoooO..", "..kwwoooO..", "..kwwoooO..", "..kwwoooO..", "..kwwoooO..", "..kwwoooO..", "..kwwoooO..", "..kwwoooO..", "..kwwoooO..", "..kwwoooO..", "..kwwoooO..", "..kwwoooO..", "..kwwoooO..", "..kwwoooO..", "..kwwoooO..", "..kwwoooO..", "..kwwoooO..", "..kwwoooO..", "..kww......", "..eee......", "...........", "..........."] },
    srb: { pal: { s: "#eef0f4", S: "#c9ccd6", d: "#5a5f6e", g: "#c9ccd6", k: "#22232b" }, rows: ["..", "..", "..", "..", "s.", "sS", "sS", "sS", "sS", "sS", "sS", "sS", "dd", "sS", "sS", "sS", "sS", "sS", "sS", "sS", "sS", "sS", "sS", "sS", "dd", "sS", "sS", "sS", "sS", "sS", "sS", "sS", "sg", "sg", "sg", "sS", "kk", "kk"] },
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
    ["boba", "Brown sugar boba from Richmond. Mind the pearls in the straw."]
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
        var sz = b.big ? P * 2 : P;
        ctx.globalAlpha = b.big ? Math.min(1, b.life / 60) : 1;
        ctx.fillStyle = b.c; ctx.fillRect(Math.round(b.x / P) * P, Math.round(b.y / P) * P, sz, sz);
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
          add(a.x, a.y - 4, 27, 29, function () { explode(a); aliens.splice(aliens.indexOf(a), 1); boom(a.x + 13, a.y + 10, 20); });
        });
        if (shipImg && ship.x > -60) add(ship.x, ship.y, shipImg.width, shipImg.height, function () {
          boom(ship.x + shipImg.width / 2, ship.y + shipImg.height / 2, 34);
          ship.x = -rnd(500, 900); ship.y = Math.round(rnd(H * .18, H * .42));
          line("ship", "You shot down your own escort. Bold.");
        });
      }
      var RUD = "Rapid unscheduled disassembly.";
      if (scene === "launch" && L.t >= 0) {
        var top = L.sep ? SS.height - BO.height : SS.height;
        add(L.x - SS.width / 2, L.y, SS.width, top, function () {
          boom(L.x, L.y + top / 2, 60); if (L.sep && !L.gone) boom(L.bx, L.by + BO.height / 2, 40);
          L.t = -rnd(400, 900); smoke = []; line("rud", RUD);
        });
        if (L.sep && !L.gone) add(L.bx - BO.width / 2, L.by, BO.width, BO.height, function () {
          boom(L.bx, L.by + BO.height / 2, 40); L.gone = true; line("booster", "Booster recovery: not today.");
        });
      }
      if ((scene === "shuttle-launch" || scene === "falcon-heavy") && R.t >= 0) {
        var img = R.sep ? (scene === "falcon-heavy" ? FHC : STC) : (scene === "falcon-heavy" ? FH : STK);
        add(R.x - img.width / 2, R.y, img.width, img.height, function () {
          boom(R.x, R.y + img.height / 2, 70); R.parts.forEach(function (q) { boom(q.x, q.y + q.img.height / 2, 30); });
          R.parts = []; R.y = -9999; R.t = -rnd(400, 900); smoke = []; line("rud", RUD);
        });
        R.parts.forEach(function (q) {
          add(q.x - q.img.width / 2, q.y, q.img.width, q.img.height, function () {
            boom(q.x, q.y + q.img.height / 2, 30); R.parts.splice(R.parts.indexOf(q), 1); line("booster", "Booster recovery: not today.");
          });
        });
      }
      if (scene === "landing" && D.t >= 0) add(D.x, D.y, SH.width, SH.height, function () {
        boom(D.x + SH.width / 2, D.y + SH.height / 2, 50); D.t = -rnd(300, 700); line("landing", "Wheel stop cancelled.");
      });
      if (scene === "station" && !(Q.wait > 0)) add(Q.x, Q.y, ST.width, ST.height, function () {
        boom(Q.x + ST.width / 2, Q.y + ST.height / 2, 60); Q.x = -149; Q.wait = rnd(300, 600); line("station", "Station deorbited, ahead of schedule.");
      });
      if (scene === "capsule" && C.t >= 0) add(C.x - 50, C.y - 50, 100, 50 + CA.height, function () {
        boom(C.x, C.y, 40); C.t = -rnd(300, 600); line("capsule", "Splashdown cancelled.");
      });
      if (scene === "hubble" && !(U.wait > 0)) add(U.x, U.y, HU.width, HU.height, function () {
        boom(U.x + HU.width / 2, U.y + HU.height / 2, 50); U.x = -199; U.wait = rnd(300, 600); line("hubble", "There go thirty years of deep fields.");
      });
      if (scene === "roadster" && !(Z.wait > 0)) add(Z.x, Z.y, RD.width, RD.height, function () {
        boom(Z.x + RD.width / 2, Z.y + RD.height / 2, 36); Z.x = -199; Z.wait = rnd(300, 600); line("roadster", "Starman, no!");
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

    /* ---- one scene per visit: the patrol (ship vs aliens), a launch,
       a shuttle landing, the station going over, or a capsule coming home */
    var SCENE_LIST = ["patrol", "launch", "landing", "station", "capsule", "shuttle-launch", "falcon-heavy", "hubble", "roadster"];
    var asked = (location.search.match(/[?&]scene=([\w-]+)/) || [])[1];     /* ?scene=launch picks one */
    var scene = SCENE_LIST.indexOf(asked) >= 0 ? asked : SCENE_LIST[Math.floor(Math.random() * SCENE_LIST.length)];
    sky.dataset.scene = scene;
    var horizon = function () { return H - (parseFloat(css("--counterH")) || 92) - 40; };
    var big = 3;
    var SS = sprite("starship", big), BO = sprite("booster", big), SH = sprite("shuttle", big), ST = sprite("station", big),
        CA = sprite("capsule", big), CH = sprite("chute", big),
        SHL = sprite("shuttle", big, true),                      /* the orbiter drawn nose-left, for gliding in from the right */
        STK = sprite("shuttlestack", big), STC = sprite("shuttlecore", big), SRB = sprite("srb", big),
        FH = sprite("falconheavy", big), FHC = sprite("fhcenter", big), FHS = sprite("fhside", big),
        HU = sprite("hubble", big), RD = sprite("roadster", big);
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
    game.craft = function () { return { ship: ship, launch: L, shuttle: D, station: Q, capsule: C, rocket: R, hubble: U, roadster: Z, aliens: aliens }; };
    /* a rocket that climbs, drops what it doesn't need, and keeps going */
    var R = { t: -60 };
    function climb(dt, full, rest, drops, sepAt) {
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
      flame(R.x, R.y + img.height, (R.sep ? 7 : 11) + Math.floor(Math.random() * 3));
      if (!R.sep && Math.random() < .9) puff(R.x, R.y + img.height + 30, 3, "rgba(230,225,240,.9)");
      drawSmoke(dt);
      if (R.y < -img.height - 40 && R.parts.every(function (q) { return q.y > H; })) R.t = -rnd(400, 900);
    }
    var U = { x: -300, y: 0, first: true }, Z = { x: -300, y: 0, rot: 0, first: true };
    var SCENES = {
      "shuttle-launch": function (dt) {
        climb(dt, STK, STC, [
          { img: SRB, dx: -STK.width / 2 + SRB.width / 2, dy: 0, vx: -.6, vr: -.004 },
          { img: SRB, dx: STK.width / 2 - SRB.width / 2, dy: 0, vx: .6, vr: .004 }
        ], .38);
      },
      "falcon-heavy": function (dt) {
        climb(dt, FH, FHC, [
          { img: FHS, dx: -FH.width / 2 + FHS.width / 2, dy: FH.height - FHS.height, vx: -.5, vr: 0, burn: true },
          { img: FHS, dx: FH.width / 2 - FHS.width / 2, dy: FH.height - FHS.height, vx: .5, vr: 0, burn: true }
        ], .42);
      },
      hubble: function (dt, t) {
        if (U.wait > 0) { U.wait -= dt; return; }
        if (U.x < -200 || U.x > W + 200) { U.x = U.first ? rnd(W * .5, W * .75) : -180; U.y = rnd(H * .1, H * .3); U.first = false; }
        U.x += .3 * dt;
        blow(U, U.x + HU.width / 2, U.y + HU.height / 2, dt);
        ctx.drawImage(HU, U.x, U.y);
        if (Math.floor(t / 900) % 2) { ctx.fillStyle = "#7ff3ff"; ctx.fillRect(U.x + 21 * big, U.y + 4 * big, big, big); }
      },
      roadster: function (dt) {
        if (Z.wait > 0) { Z.wait -= dt; return; }
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
        if (D.t < 140) { ctx.globalAlpha = .5; ctx.fillStyle = "#ff8a3d"; ctx.fillRect(D.x - 40, D.y + SH.height / 2, 40, P); ctx.globalAlpha = 1; }
        ctx.drawImage(SHL, D.x, D.y);                              /* nose first, the way it's going */
        if (D.y > horizon() - 60) { ctx.fillStyle = "#2a2a33"; ctx.fillRect(D.x + 12, D.y + SH.height, P, P * 2); ctx.fillRect(D.x + SH.width - 24, D.y + SH.height, P, P * 2); }
        if (D.y > horizon() + 20 || D.x < -120) D.t = -rnd(300, 700);
      },
      station: function (dt, t) {
        if (Q.wait > 0) { Q.wait -= dt; return; }
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
      drawBits(dt);

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
      scene = "patrol";
      for (var i = 0; i < 12; i++) spawnAlien(W * .4 + i * (W * .05));
      ship.x = 20; ship.vx = 1.6;
      toast("↑↑↓↓←→←→BA — incoming. 30 lives granted (not really).");
    };
  })();

  /* ================================================================
     THE CITY: the picture is anchored to the right edge (so the towers
     stand clear of the title). These place things on it, in image pixels
     of the 2400x570 tile (see tools/city/build_city.py --sos).
     ================================================================ */
  var TILE = { w: 2400, h: 570, sos: [1998, 208], jazz: [2128, 440, 2212, 524] };
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

  /* for the people who open the console */
  if (window.console && console.log) {
    console.log("%c WK · TOP FLOOR ", "background:#0d0820;color:#7ff3ff;font:bold 14px monospace;padding:4px 8px");
    console.log("Hello, fellow engineer. Three messages are hidden in the city: two in the car lights, one in a window. Also try ↑↑↓↓←→←→BA.");
  }
})();
