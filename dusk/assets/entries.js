/* =====================================================================
   entries.js — builds the project cards from content/.
   Order comes from content/manifest.json; numbering is A1, A2, …
   ===================================================================== */
(function () {
  "use strict";

  var PLACEHOLDER = "content/placeholder.webp";

  /* an image that fails to load falls back to the placeholder */
  document.addEventListener("error", function (e) {
    var img = e.target;
    if (img.tagName !== "IMG" || img.dataset.ph) return;
    img.dataset.ph = "1";
    img.src = PLACEHOLDER;
  }, true);

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") n.textContent = attrs[k];
      else if (k === "class") n.className = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }
  function pad(n) { return ("0" + n).slice(-2); }
  function getJSON(url) {
    return fetch(url, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error(url + " → " + r.status);
      return r.json();
    });
  }

  /* one card. The whole card is the link to the article; the picture is
     the README / PDF one (tldr) when there is one, else the cover. */
  function project(p, dir, i) {
    var pic = p.tldr || p.cover || {};
    var kids = [
      el("div", { class: "pic" }, [el("img", { src: dir + pic.src, alt: pic.alt || "", loading: i < 2 ? "eager" : "lazy" })]),
      el("div", { class: "body" }, [
        el("div", { class: "row" }, [
          el("span", {}, [el("span", { class: "no", text: "A" + (i + 1) }), document.createTextNode(p.year ? " · " + p.year : "")]),
          el("span", { class: "st " + (p.status || "idle"), text: p.statusLabel || "" })
        ]),
        el("h3", { text: p.title }),
        el("p", { class: "spec", text: p.spec || "" }),
        el("p", { class: "sum", text: p.summary || "" }),
        p.link ? el("span", { class: "more", text: "Read ▸" }) : null
      ])
    ];
    return p.link ? el("a", { class: "proj", href: p.link }, kids) : el("article", { class: "proj" }, kids);
  }

  /* a broken entry is skipped and logged; the rest still render */
  window.entriesReady = getJSON("content/manifest.json").then(function (m) {
    return Promise.all((m.projects || []).map(function (slug) {
      var dir = "content/projects/" + slug + "/";
      return getJSON(dir + "entry.json")
        .then(function (data) { return { data: data, dir: dir }; })
        .catch(function (err) { console.error("[entries] skipped " + dir + "entry.json:", err.message); return null; });
    }));
  }).then(function (list) {
    var cards = list.filter(Boolean).map(function (x, i) { return project(x.data, x.dir, i); });
    var grid = document.getElementById("projectGrid");
    if (!cards.length) cards = [el("p", { class: "lede", text: "Nothing here yet." })];
    grid.replaceChildren.apply(grid, cards);
    document.getElementById("projectCount").textContent = pad(list.filter(Boolean).length);
  }).catch(function (err) {
    console.error("[entries]", err);
    if (location.protocol === "file:") {
      console.error("[entries] Browsers block fetch() on file:// — run a local server: python3 -m http.server");
    }
  });
})();
