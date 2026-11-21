/* theme.js — loaded first in <head> so a saved light/dark choice applies
   before anything paints. "auto" (nothing saved) follows the device.
   Phones get html.lite: the drinks still slide, nothing else moves.
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
  if (lite) root.classList.add("lite");
})();
