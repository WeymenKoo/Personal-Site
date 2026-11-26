/* =====================================================================
   article.js — small extras for long-form project pages.
   The quote, pets and lightbox come from fx.js.
   ===================================================================== */
(function () {
  "use strict";
  document.documentElement.classList.add("ar-js");

  /* text messages: show the typing dots, then the message, once each
     one scrolls into view */
  var chats = document.querySelectorAll(".ar-chat");
  var stats = document.querySelectorAll(".ar-stats");
  if (!("IntersectionObserver" in window)) {
    chats.forEach(function (c) { c.classList.add("on"); });
    stats.forEach(function (s) { s.classList.add("on"); });
    return;
  }

  /* big numbers: rise in, and every number in each <b> counts up from 0 */
  var still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function countUp(b) {
    var text = b.textContent, parts = text.split(/(\d+(?:\.\d+)?)/);
    if (still || parts.length < 2) return;
    var t0 = null, T = 900;
    function frame(t) {
      if (t0 === null) t0 = t;
      var k = Math.min(1, (t - t0) / T), e = 1 - Math.pow(1 - k, 3);
      b.textContent = parts.map(function (p, i) {
        if (i % 2 === 0) return p;
        var dp = (p.split(".")[1] || "").length;
        return (parseFloat(p) * e).toFixed(dp);
      }).join("");
      if (k < 1) requestAnimationFrame(frame); else b.textContent = text;
    }
    requestAnimationFrame(frame);
  }
  var so = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      so.unobserve(e.target);
      e.target.classList.add("on");
      e.target.querySelectorAll("b").forEach(countUp);
    });
  }, { threshold: 0.4 });
  stats.forEach(function (s) { so.observe(s); });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var c = e.target;
      io.unobserve(c);
      setTimeout(function () { c.classList.add("on"); }, 1100);
    });
  }, { threshold: 0.6 });
  chats.forEach(function (c) { io.observe(c); });
})();
