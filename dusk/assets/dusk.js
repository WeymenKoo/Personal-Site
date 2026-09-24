/* =====================================================================
   dusk.js
   1. Blends the page colour from one hour to the next as you scroll.
   2. Runs the tape counter + hour label in the deck.
   3. Photo lightbox.
   4. Record shelf -> player.
   ===================================================================== */
(function () {
  "use strict";

  /* -------------------------------------------------------------------
     THE HOURS
     Each <section data-hour="..."> picks one of these. The page blends
     between neighbouring sections' palettes as you scroll between them.
     Change a colour here and the whole site follows.
     ------------------------------------------------------------------- */
  var HOURS = {
    golden:    { label: "Golden hour",    bg: "#F4EBDD", fg: "#2A2118", dim: "#6E5E4E", line: "#DCCBB6", accent: "#C8742E" },
    afternoon: { label: "Late afternoon", bg: "#EEDCC6", fg: "#2A2118", dim: "#6A5747", line: "#D8C2A8", accent: "#B45E27" },
    dusk:      { label: "Dusk",           bg: "#B9A1A2", fg: "#221A22", dim: "#4A3C46", line: "#A08A8E", accent: "#7A2E4A" },
    blue:      { label: "Blue hour",      bg: "#2E3A52", fg: "#EDE6DC", dim: "#A9ABB6", line: "#46526B", accent: "#F0A35E" },
    night:     { label: "Night",          bg: "#121521", fg: "#E8E4DC", dim: "#8C8C99", line: "#262A3A", accent: "#FF4F9A" },
    off:       { label: "Lights off",     bg: "#0B0C12", fg: "#CFCBC2", dim: "#6E6E78", line: "#1D1F2A", accent: "#FF4F9A" }
  };
  var KEYS = ["bg", "fg", "dim", "line", "accent"];

  function hex(h) { h = h.replace("#", ""); return [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16); }); }
  /* relative luminance, 0 (black) .. 1 (white) — accepts "#rrggbb" or "rgb(r,g,b)" */
  function lum(c) {
    var v = c.charAt(0) === "#" ? hex(c) : c.match(/\d+/g).map(Number);
    var s = v.map(function (x) { x /= 255; return x <= .03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4); });
    return .2126 * s[0] + .7152 * s[1] + .0722 * s[2];
  }
  function contrast(a, b) {
    var x = lum(a), y = lum(b);
    return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
  }
  function mix(a, b, t) {
    var A = hex(a), B = hex(b);
    return "rgb(" + A.map(function (v, i) { return Math.round(v + (B[i] - v) * t); }).join(",") + ")";
  }

  var root = document.documentElement;
  var sections = Array.prototype.slice.call(document.querySelectorAll("[data-hour]"));
  var hourLabel = document.getElementById("hourLabel");
  var counter = document.getElementById("counter");
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".deck nav a"));
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function apply(p) { KEYS.forEach(function (k) { root.style.setProperty("--" + k, p[k]); }); }

  function tick() {
    var mid = window.scrollY + window.innerHeight * 0.55;

    /* find which two sections we're between */
    var i = 0;
    for (var n = 0; n < sections.length; n++) {
      if (sections[n].offsetTop <= mid) i = n;
    }
    var cur = sections[i], nxt = sections[i + 1];
    var A = HOURS[cur.dataset.hour];

    if (!nxt || reduce) {
      apply(A);
    } else {
      /* blend only across the last 45% of the current section,
         so each hour gets to "settle" before it starts turning */
      var start = cur.offsetTop + cur.offsetHeight * 0.55;
      var end = nxt.offsetTop;
      var t = Math.min(1, Math.max(0, (mid - start) / Math.max(1, end - start)));
      /* ease-in-out: linger on each clean hour, sweep fast through the
         grey middle of the crossfade where contrast is weakest */
      t = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      var B = HOURS[nxt.dataset.hour];
      var out = {};
      /* background, hairlines, accent: blend smoothly */
      ["bg", "line", "accent"].forEach(function (k) { out[k] = mix(A[k], B[k], t); });
      /* ink: never blend. Blending dark->light ink over a light->dark page
         puts grey text on grey paper at the crossover. Instead, pick
         whichever hour's ink has more contrast with the background NOW. */
      var pick = contrast(A.fg, out.bg) >= contrast(B.fg, out.bg) ? A : B;
      out.fg = pick.fg; out.dim = pick.dim;
      apply(out);
    }

    if (hourLabel) hourLabel.textContent = A.label;

    /* tape counter: 000 at the top, 999 at the bottom */
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var c = Math.round((window.scrollY / Math.max(1, max)) * 999);
    if (counter) counter.textContent = ("00" + c).slice(-3);

    /* highlight the deck link for the section we're in */
    navLinks.forEach(function (a) {
      a.classList.toggle("on", a.getAttribute("href") === "#" + cur.id);
    });
  }

  var ticking = false;
  window.addEventListener("scroll", function () {
    if (!ticking) { requestAnimationFrame(function () { tick(); ticking = false; }); ticking = true; }
  }, { passive: true });
  window.addEventListener("resize", tick);
  window.addEventListener("load", tick);
  tick();


  /* -------------------------------------------------------------------
     LINER NOTES — one random line at "flip the tape", a different one
     at "lights off". New pair on every visit.
       {q:"..."}  a real quote, shown in quotation marks, verbatim
       {t:"..."}  my own line (including jokes made AFTER something)
     Songs are only ever referenced, never quoted.
     ------------------------------------------------------------------- */
  var LINES = [
    /* mine */
    {t:"The fewer moving parts, the better.", src:"my own rule"},
    {t:"Gen 3 never talked to the SD card. Gen 4 didn't need one.", src:"water rocket, 2020"},
    {t:"Four years of protoboard is how you learn to want a PCB.", src:"2019 – 2021"},
    {t:"It released reliably. On the ground.", src:"recovery system, never flown"},
    {t:"I fed a 3.3 V part 5 V. Once.", src:"the magnetometer, rest in peace"},
    {t:"Every board here has a bodge wire I'd rather not discuss.", src:"still true"},

    /* western film, tv, games */
    {q:"You can't fight gravity.", src:"Red Dead Redemption 2 — silkscreened on a board"},
    {q:"Control is an illusion.", src:"Mr. Robot — silkscreened on a board"},
    {q:"Take your heart.", src:"Persona 5 Royal — calling card"},
    {q:"Tough and competent.", src:"Gene Kranz, Mission Control"},
    {q:"Nature cannot be fooled.", src:"Feynman, Challenger appendix"},
    {q:"I cannae change the laws of physics.", src:"Scotty — on the thermal budget"},
    {q:"Life finds a way.", src:"Jurassic Park — see: bodge wire"},
    {q:"Wake up, samurai.", src:"Cyberpunk 2077 — first power-on"},
    {q:"My favourite programming language is solder.", src:"Bob Pease"},
    {q:"Keep it simple, stupid.", src:"Kelly Johnson, Skunk Works"},
    {q:"Praise the sun.", src:"Dark Souls — the official religion of golden hour"},
    {q:"It's dangerous to go alone! Take this.", src:"Zelda — handing someone a multimeter"},
    {q:"Kept you waiting, huh?", src:"Metal Gear Solid — every board back from the fab"},
    {q:"The cake is a lie.", src:"Portal — on 'typical' values in a datasheet"},

    /* HK & Chinese film, games */
    {q:"做人如果冇夢想，同條鹹魚有咩分別？", src:"Shaolin Soccer — why I keep starting projects"},
    {q:"不如我哋由頭嚟過。", src:"Happy Together — the official motto of Rev 2"},
    {q:"對唔住，我係差人。", src:"Infernal Affairs — the bug, finally revealing itself"},
    {q:"Be water, my friend.", src:"Bruce Lee — also my cooling strategy"},
    {q:"直面天命", src:"Black Myth: Wukong — before every first power-on"},
    {t:"If this deadline must have a date, make it ten thousand years.", src:"after A Chinese Odyssey"},
    {t:"Every capacitor has an expiry date.", src:"after Chungking Express"},

    /* Chinese pop — titles only, never lyrics */
    {t:"The moon represents my heart. The oscilloscope represents my feelings.", src:"after Teresa Teng"},
    {t:"Forecast: 晴天. Actual: blue hour.", src:"after Jay Chou"},
    {t:"海闊天空 on repeat, 3 a.m., reflow oven still warm.", src:"after Beyond"}
  ];

  function render(el, l) {
    if (!el) return;
    el.innerHTML = '<span class="' + (l.q ? 'lq' : 'lt') + '">' + (l.q || l.t) + '</span>' +
                   '<span class="lsrc">' + l.src + '</span>';
  }
  (function () {
    var a = Math.floor(Math.random() * LINES.length);
    var b = Math.floor(Math.random() * (LINES.length - 1));
    if (b >= a) b++;
    render(document.getElementById("flipLine"), LINES[a]);
    render(document.getElementById("offLine"), LINES[b]);
  })();

  /* -------------------------------------------------------------------
     LIGHTBOX — any button[data-full] opens it. Arrows step within the
     same tape; Esc closes.
     ------------------------------------------------------------------- */
  var lb = document.getElementById("lb");
  var lbImg = lb.querySelector("img");
  var lbCap = lb.querySelector(".cap");
  var group = [], idx = 0;

  function show(i) {
    idx = (i + group.length) % group.length;
    var b = group[idx];
    lbImg.src = b.dataset.full;
    lbImg.alt = b.querySelector("img").alt;
    lbCap.textContent = b.dataset.cap || "";
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-full]");
    if (!b) return;
    group = Array.prototype.slice.call(b.closest(".frames").querySelectorAll("button[data-full]"));
    show(group.indexOf(b));
    lb.classList.add("show");
    document.body.style.overflow = "hidden";
  });
  function close() { lb.classList.remove("show"); document.body.style.overflow = ""; }
  lb.querySelector(".x").addEventListener("click", close);
  lb.querySelector(".prev").addEventListener("click", function () { show(idx - 1); });
  lb.querySelector(".next").addEventListener("click", function () { show(idx + 1); });
  lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
  document.addEventListener("keydown", function (e) {
    if (!lb.classList.contains("show")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(idx - 1);
    if (e.key === "ArrowRight") show(idx + 1);
  });

  /* -------------------------------------------------------------------
     RECORD SHELF — clicking a record loads it into the player.
     Nothing ever autoplays: Spotify's embed needs its own tap to play.
     ------------------------------------------------------------------- */
  var player = document.getElementById("player");
  var nowT = document.getElementById("nowTitle");
  document.querySelectorAll(".rec").forEach(function (r) {
    r.addEventListener("click", function () {
      document.querySelectorAll(".rec").forEach(function (x) { x.classList.remove("on"); });
      r.classList.add("on");
      player.src = "https://open.spotify.com/embed/track/" + r.dataset.track + "?utm_source=generator&theme=0";
      nowT.textContent = r.dataset.title;
    });
  });
})();
