/* theme.js — loaded first in <head> so a saved light/dark choice applies
   before anything paints. "auto" (nothing saved) follows the device.
   Phones get html.lite: nothing flies or swims, and sizes stop following the toolbar.
   ?lite / ?full in the address forces either. */
(function () {
  var root = document.documentElement;
  try {
    var t = localStorage.getItem("wk-theme");
    if (t === "light" || t === "dark") root.setAttribute("data-theme", t);
  } catch (e) { /* storage blocked: follow the device */ }
  var lite = false;
  try {
    var q = location.search;
    if (/[?&]full\b/.test(q)) lite = false;
    else if (/[?&]lite\b/.test(q)) lite = true;
    else lite = matchMedia("(pointer: coarse)").matches && Math.min(screen.width, screen.height) <= 600;
  } catch (e) { /* old browser: full site */ }
  if (lite) {
    root.classList.add("lite");
    /* --vh0: 1% of the window's height when the page opened. In-app browsers (LinkedIn, Instagram) slide
       their toolbars away by resizing the page, which makes vh, svh and dvh all change mid-scroll.
       This only follows a turn of the phone. */
    var w = 0;
    var freeze = function () {
      if (innerWidth === w) return;
      w = innerWidth;
      root.style.setProperty("--vh0", (innerHeight || root.clientHeight || screen.height) / 100 + "px");
    };
    freeze();
    addEventListener("resize", freeze);
  }
})();
