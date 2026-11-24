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

/* Analytics: Umami Cloud. Cookie-free and anonymous: page views, referrers, country, device, and the
   events below. Only counts on the live site (data-domains), skips browsers that send Do Not Track.
   wkTrack(name, data) is safe to call anywhere; it does nothing until the tracker has loaded. */
(function () {
  var ID = "426494d4-e58a-4337-83a9-103fbc68c98c";
  try {
    var s = document.createElement("script");
    s.defer = true;
    s.src = "https://cloud.umami.is/script.js";
    s.setAttribute("data-website-id", ID);
    s.setAttribute("data-domains", "weymenkoo.github.io");
    s.setAttribute("data-do-not-track", "true");
    document.head.appendChild(s);
  } catch (e) { /* no tracker, no problem */ }
  window.wkTrack = function (name, data) {
    try { if (window.umami && window.umami.track) window.umami.track(name, data); } catch (e) { /* ignore */ }
  };
  /* one listener for every page: which project was opened, where people leave to, how they get in touch */
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest && e.target.closest("a[href]");
    if (!a) return;
    var h = a.getAttribute("href") || "";
    if (/^mailto:/i.test(h)) return wkTrack("contact", { via: a.closest(".telegraph, #sendEmail, .tg") ? "telegram" : "email" });
    var u; try { u = new URL(a.href, location.href); } catch (err) { return; }
    if (/\.pdf$/i.test(u.pathname)) return wkTrack("pdf", { file: u.pathname.split("/").pop() });
    if (u.host !== location.host) return wkTrack("outbound", { to: u.host + u.pathname });
    var m = u.pathname.match(/\/content\/projects\/([\w-]+)\//);
    if (m && a.classList.contains("proj")) return wkTrack("project-card", { slug: m[1] });
  }, true);
})();
