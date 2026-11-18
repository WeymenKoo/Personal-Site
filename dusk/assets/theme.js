/* theme.js — loaded first in <head> so a saved light/dark choice applies
   before anything paints. "auto" (nothing saved) follows the device. */
(function () {
  try {
    var t = localStorage.getItem("wk-theme");
    if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t);
  } catch (e) { /* storage blocked: follow the device */ }
})();
