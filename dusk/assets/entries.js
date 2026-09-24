/* =====================================================================
   entries.js — builds Side A, Side B and the record shelf from content/.
   Order and numbering come from content/manifest.json.
   ===================================================================== */
(function () {
  "use strict";

  var PLACEHOLDER = "content/placeholder.svg";
  var SPOTIFY = "https://open.spotify.com/embed/track/";

  /* any image that fails to load (e.g. a template photo you haven't added yet)
     falls back to the placeholder */
  function toPlaceholder(img) {
    if (img.dataset.ph) return;
    img.dataset.ph = "1";
    img.src = PLACEHOLDER;
  }
  document.addEventListener("error", function (e) {
    if (e.target.tagName === "IMG") toPlaceholder(e.target);
  }, true);
  /* images above this script (the hero) may have failed before the listener existed */
  Array.prototype.forEach.call(document.images, function (img) {
    if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) toPlaceholder(img);
  });

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
  function pad(n, w) { return ("000" + n).slice(-w); }
  function getJSON(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error(url + " → " + r.status);
      return r.json();
    });
  }
  function img(src, alt, extra) {
    var a = { src: src, alt: alt || "", loading: "lazy" };
    Object.keys(extra || {}).forEach(function (k) { a[k] = extra[k]; });
    return el("img", a);
  }
  function spotify(track, title, id) {
    var a = { src: SPOTIFY + track + "?utm_source=generator&theme=0", loading: "lazy",
              allow: "clipboard-write; encrypted-media; fullscreen; picture-in-picture", title: title };
    if (id) a.id = id;
    return el("iframe", a);
  }

  /* ---------- Side A: one project ---------- */
  function project(p, dir, i) {
    var cover = p.cover || {};
    var strip = (p.strip || []).map(function (s) {
      return el("figure", {}, [img(dir + s.src, s.alt), el("figcaption", { text: s.caption || "" })]);
    });
    return el("article", { class: "proj" }, [
      el("div", { class: "pic" + (cover.fit === "contain" ? " contain" : "") }, [img(dir + cover.src, cover.alt)]),
      el("div", {}, [
        el("div", { class: "row" }, [
          el("span", { class: "no", text: "A" + (i + 1) }),
          el("span", { class: "st " + (p.status || "idle"), text: p.statusLabel || "" })
        ]),
        el("h3", { text: p.title }),
        el("p", { class: "spec", text: p.spec || "" }),
        strip.length ? el("div", { class: "strip" }, strip) : null,
        el("p", { text: p.summary || "" }),
        el("div", { class: "foot" }, [
          el("span", { class: "lcd", "data-ghost": "8888", text: p.year || "" }),
          p.link ? el("a", { class: "more", href: p.link, text: "Read →" }) : null
        ])
      ])
    ]);
  }

  /* ---------- Side B: one photo roll ---------- */
  function tape(t, dir, i) {
    var no = pad(i + 1, 2);
    var frames = (t.frames || []).map(function (f, j) {
      var n = pad(j + 1, 2);
      var b = el("button", { "data-full": dir + f.src, "data-cap": "Tape " + no + " · " + n }, [
        img(dir + f.src, f.alt),
        el("span", { class: "n", text: n })
      ]);
      if (f.width) b.classList.add("w" + f.width);
      return b;
    });
    var meta = el("div", { class: "meta" });
    meta.append(t.location || "", el("br"), (t.film || "Film") + " · " + frames.length + " frames");
    return el("article", { class: "tape" }, [
      el("header", { class: "tape-head" }, [
        el("span", { class: "lcd", "data-ghost": "88", text: no }),
        el("h3", { text: t.title }),
        meta
      ]),
      el("p", { class: "notes", text: t.notes || "" }),
      el("div", { class: "frames" }, frames),
      t.song ? el("div", { class: "side" }, [
        el("span", { class: "print", text: "Play with →" }),
        spotify(t.song, "Song for tape " + no)
      ]) : null
    ]);
  }

  /* ---------- Records: the shelf + one shared player ---------- */
  function record(r, i) {
    var s = r.sleeve || ["#888", "#444"];
    var cover = el("div", { class: "cover" }, [
      el("span", { text: pad(i + 1, 2) }),
      el("span", { text: r.artist || "" })
    ]);
    cover.style.background = "linear-gradient(160deg," + s[0] + "," + s[1] + ")";
    cover.style.color = r.ink || "#fff";
    return el("button", {
      class: "rec" + (i === 0 ? " on" : ""),
      "data-track": r.track,
      "data-title": r.title + " — " + r.artist
    }, [
      el("div", { class: "sleeve" }, [el("span", { class: "disc" }), cover]),
      el("p", { class: "t", text: r.title }),
      el("p", { class: "a", text: r.artist }),
      el("p", { class: "why", text: r.why || "" })
    ]);
  }

  function fill(id, nodes) {
    var box = document.getElementById(id);
    box.replaceChildren.apply(box, nodes);
  }
  function count(id, n) { document.getElementById(id).textContent = pad(n, 2); }

  function loadAll(kind, slugs, build) {
    return Promise.all(slugs.map(function (slug) {
      var dir = "content/" + kind + "/" + slug + "/";
      return getJSON(dir + "entry.json").then(function (data) { return { data: data, dir: dir }; });
    })).then(function (list) {
      return list.map(function (x, i) { return build(x.data, x.dir, i); });
    });
  }

  window.entriesReady = getJSON("content/manifest.json").then(function (m) {
    return Promise.all([
      loadAll("projects", m.projects || [], project),
      loadAll("tapes", m.tapes || [], tape),
      getJSON("content/records.json")
    ]);
  }).then(function (res) {
    fill("projects", res[0]); count("projectCount", res[0].length);
    fill("tapes", res[1]);    count("tapeCount", res[1].length);

    var recs = res[2];
    fill("shelf", recs.map(record)); count("recordCount", recs.length);
    if (recs[0]) {
      document.getElementById("nowTitle").textContent = recs[0].title + " — " + recs[0].artist;
      document.getElementById("playerSlot").replaceChildren(spotify(recs[0].track, "Record player", "player"));
    }
  }).catch(function (err) {
    console.error("[entries]", err);
    if (location.protocol === "file:") {
      console.error("[entries] Browsers block fetch() on file:// — run a local server: python3 -m http.server");
    }
  });
})();
