/* =====================================================================
   article.js — small extras for long-form project pages.
   The hour snap, tape counter and liner note come from dusk.js.
   ===================================================================== */
(function () {
  "use strict";
  document.documentElement.classList.add("ar-js");

  /* text messages: show the typing dots, then the message, once each
     one scrolls into view */
  var chats = document.querySelectorAll(".ar-chat");
  if (!("IntersectionObserver" in window)) {
    chats.forEach(function (c) { c.classList.add("on"); });
    return;
  }
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
