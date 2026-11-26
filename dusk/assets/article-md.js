/* =====================================================================
   article-md.js — turns a project folder's article.md into its page.

   content/projects/<slug>/index.html is a small shell that loads this
   file. It reads, from the SAME folder:
     entry.json   the card data (title, status) — reused for the header
     article.md   the write-up, in Markdown
   and builds the page: a title block, then one section per ## chapter.
   How to write article.md is in dusk/README.md, "Writing an article".
   ===================================================================== */
(function () {
  "use strict";

  var ASSETS = document.currentScript.src.replace(/[^/]*$/, "");   /* …/assets/ */
  var HOME = ASSETS + "../index.html#projects";

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") n.textContent = attrs[k];
      else if (k === "html") n.innerHTML = attrs[k];
      else if (k === "class") n.className = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }
  function script(src) {
    return new Promise(function (ok, fail) {
      var s = el("script", { src: src });
      s.onload = ok;
      s.onerror = function () { fail(new Error(src + " failed to load")); };
      document.body.appendChild(s);
    });
  }
  function get(url, as) {
    return fetch(url, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error(url + " → " + r.status);
      return r[as]();
    });
  }
  function slug(s) {
    return s.toLowerCase().normalize("NFKD").replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "part";
  }

  /* ---------- front matter: "key: value" lines between two --- lines ---------- */
  function frontMatter(src) {
    src = src.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
    var meta = {};
    var m = /^---\n([\s\S]*?)\n---[ \t]*(\n|$)/.exec(src);
    if (!m) return { meta: meta, body: src };
    m[1].split("\n").forEach(function (line) {
      var kv = /^([A-Za-z][\w-]*)\s*:\s*(.*)$/.exec(line);
      if (kv) meta[kv[1].toLowerCase()] = kv[2].trim().replace(/^(["'])(.*)\1$/, "$2");
    });
    return { meta: meta, body: src.slice(m[0].length) };
  }

  /* ---------- images ----------
     ![alt](file.jpg "Caption")       one image on its own line  -> a figure
     two or three on consecutive lines                          -> side by side
     flags go after a # on the file name: file.jpg#wide, #bleed, #tall, #land */
  function flagsOf(img) {
    var src = img.getAttribute("src") || "";
    var i = src.indexOf("#");
    if (i < 0) return [];
    img.setAttribute("src", src.slice(0, i));
    return src.slice(i + 1).split(/[#,+]/);
  }
  var SIZES = {};                                                      /* sizes.json (npm run stamp): each picture's width and height */
  function figure(img) {
    var cap = img.getAttribute("title");
    img.removeAttribute("title");
    var wh = SIZES[img.getAttribute("src")];
    if (wh) {                                                          /* hold its space before it loads, so the page doesn't jump */
      img.setAttribute("width", wh[0]); img.setAttribute("height", wh[1]);
      img.style.setProperty("--ar", wh[0] + "/" + wh[1]);
      img.style.setProperty("--w", wh[0] + "px"); img.style.setProperty("--r", wh[0] / wh[1]);
    }
    img.setAttribute("loading", "lazy");
    img.setAttribute("decoding", "async");
    /* click a figure to see it big, in the lightbox (fx.js); the link
       still points at the full-size file for a middle-click or no JS */
    var full = el("a", { class: "ar-full", href: img.getAttribute("src"), title: "Enlarge" }, [img]);
    var fig = el("figure", {}, [full, cap ? el("figcaption", { html: window.marked.parseInline(cap) }) : null]);
    if (wh) fig.style.setProperty("--r", wh[0] / wh[1]);                /* a row shares out its width by shape (article.css) */
    return fig;
  }
  function images(root, gallery) {
    Array.prototype.slice.call(root.querySelectorAll("p")).forEach(function (p) {
      var imgs = [], other = false;
      Array.prototype.forEach.call(p.childNodes, function (n) {
        if (n.nodeName === "IMG") imgs.push(n);
        else if (n.nodeName !== "BR" && !(n.nodeType === 3 && !n.textContent.trim())) other = true;
      });
      if (!imgs.length || other) return;
      var flags = [];
      imgs.forEach(function (i) { flags = flags.concat(flagsOf(i)); });
      var has = function (f) { return flags.indexOf(f) >= 0; };
      var box;
      if (imgs.length === 1) {
        box = figure(imgs[0]);
        box.className = has("bleed") ? "ar-bleed" : "ar-fig" + (has("wide") ? " wide" : "");
        if (/\.gif$/i.test(imgs[0].getAttribute("src"))) box.classList.add("ar-gif");
      } else if (gallery && imgs.length > 3) {
        /* layout: gallery — four or more in a row become a photo wall */
        box = el("div", { class: "ar-grid many", style: "--cols:" + (imgs.length % 4 === 0 ? 4 : 3) }, imgs.map(figure));
      } else {
        box = el("div", {
          class: "ar-grid " + (imgs.length === 3 ? "three" : "two") +
                 (has("tall") ? "" : has("land") ? " land" : imgs.length > 3 ? " natgrid" : " nat") + (has("wide") ? " wide" : "")
        }, imgs.map(figure));
      }
      p.replaceWith(box);
    });
  }

  /* ---------- the rest of the Markdown -> the article's own components ---------- */
  function dress(root, gallery) {
    images(root, gallery);

    /* > a quote            -> the slide-quote box; a last line starting with
       > — where it's from     an em dash becomes the source line */
    root.querySelectorAll("blockquote").forEach(function (q) {
      q.classList.add("ar-slide");
      var last = q.querySelector("p:last-of-type");
      if (!last) return;
      var lines = last.innerHTML.split("\n");
      var tail = lines[lines.length - 1];
      if (!/^\s*(—|--)/.test(tail)) return;
      lines.pop();
      if (lines.length) last.innerHTML = lines.join("\n"); else last.remove();
      q.appendChild(el("cite", { html: tail.replace(/^\s*--(?!-)/, "—") }));
    });

    /* tables: scroll sideways on a phone; an all-empty header row is dropped */
    root.querySelectorAll("table").forEach(function (t) {
      if (t.className) return;                      /* hand-written HTML table: leave it */
      t.className = "ar-table";
      var heads = t.querySelectorAll("thead th");
      if (heads.length && Array.prototype.every.call(heads, function (h) { return !h.textContent.trim(); })) {
        t.classList.add("nohead");
      }
      t.querySelectorAll("td").forEach(function (c) { if (c.textContent.trim() === "→") c.className = "arrow"; });
      var wrap = el("div", { class: "ar-scroll" });
      t.replaceWith(wrap);
      wrap.appendChild(t);
    });

    /* - [ ] option / - [x] the one you picked -> the checklist */
    root.querySelectorAll('li > input[type="checkbox"]').forEach(function (box) {
      var li = box.parentNode;
      li.parentNode.classList.add("ar-check");
      if (box.checked) li.classList.add("done");
      box.remove();
    });

    /* `5 V` -> a number in the accent colour; ~~word~~ -> struck through */
    root.querySelectorAll("code").forEach(function (c) { if (!c.closest("pre")) c.className = "ar-num"; });
    root.querySelectorAll("del").forEach(function (d) { d.className = "ar-strike"; });

    /* links that leave the site open in a new tab */
    root.querySelectorAll("a[href]").forEach(function (a) {
      if (/^https?:/i.test(a.getAttribute("href"))) { a.target = "_blank"; a.rel = "noopener"; }
    });
  }

  /* ---------- "## Heading" starts a chapter ---------- */
  function chapters(root) {
    var intro = [], list = [], cur = null;
    Array.prototype.slice.call(root.childNodes).forEach(function (n) {
      if (n.nodeName === "H2") { cur = { h2: n, nodes: [] }; list.push(cur); }
      else (cur ? cur.nodes : intro).push(n);
    });
    return { intro: intro, list: list };
  }

  function header(entry, meta) {
    var kids = [];
    if (entry.statusLabel) kids.push(el("span", { class: "st " + (entry.status || "idle"), text: entry.statusLabel }));
    kids.push(el("h1", { text: meta.title || entry.title || "Untitled" }));
    if (meta.subtitle) kids.push(el("p", { class: "ar-sub", text: meta.subtitle }));
    var row = [];
    if (meta.team) row.push(el("span", {}, [el("b", { text: meta.team })]));
    [["role", "Role/ "], ["date", "Date/ "]].forEach(function (f) {
      if (!meta[f[0]]) return;
      var s = el("span", { text: f[1] });
      s.appendChild(el("b", { text: meta[f[0]] }));
      row.push(s);
    });
    if (row.length) kids.push(el("p", { class: "ar-meta" }, row));
    return el("header", { class: "ar-head" }, kids);
  }

  function build(entry, md) {
    var fm = frontMatter(md);
    var body = el("div", { html: window.marked.parse(fm.body, { gfm: true }) });
    var gallery = fm.meta.layout === "gallery";
    dress(body, gallery);
    var parts = chapters(body);
    var title = fm.meta.title || entry.title || "Untitled";

    document.title = title + " — Weymen Koo";
    var desc = fm.meta.subtitle || entry.summary;
    if (desc) document.head.appendChild(el("meta", { name: "description", content: desc }));

    /* back link, title block, anything written above the first ## */
    var lead = parts.intro.filter(function (n) { return n.nodeName === "P"; })[0];
    if (lead) lead.classList.add("ar-lead");
    var top = el("section", { id: "top" }, [
      el("div", { class: "ar-bar" }, [el("a", { href: HOME, html: "&larr; Projects" }), el("span", { class: "brand", html: "WK<span class=\"long\"> · TOP FLOOR</span>" })]),
      el("div", { class: "ar" }, [header(entry, fm.meta)].concat(parts.intro))
    ]);

    var used = { top: 1, end: 1 };
    var sections = parts.list.map(function (c, i) {
      /* "## Kicker | Big heading": the part before the bar goes in the little label */
      var bar = c.h2.innerHTML.split(/\s+\|\s+/);
      var label = bar.length > 1 ? bar.shift() : "";
      c.h2.innerHTML = bar.join(" | ");
      var no = ("0" + (i + 1)).slice(-2);
      var id = slug(el("i", { html: label || c.h2.innerHTML }).textContent);
      while (used[id]) id += "-" + no;
      used[id] = 1;
      var kick = el("p", { class: "ar-kick" }, [el("b", { text: no }), label ? el("span", { html: label }) : null]);
      return el("section", { id: id, class: "ar-ch" }, [
        el("div", { class: "ar" }, [kick, c.h2].concat(c.nodes))
      ]);
    });

    /* a quote and the way back, at the end of the last chapter */
    var foot = [
      el("figure", { class: "quote liner", id: "offLine" }, [el("blockquote"), el("figcaption")]),
      el("div", { class: "ar-end" }, [el("a", { href: HOME, html: "&larr; Back to projects" })])
    ];
    if (sections.length) {
      var lastAr = sections[sections.length - 1].firstChild;
      foot.forEach(function (n) { lastAr.appendChild(n); });
    } else {
      sections.push(el("section", { id: "end", class: "ar-ch" }, [el("div", { class: "ar" }, foot)]));
    }

    var main = document.getElementById("article");
    main.classList.toggle("ar-gallery", gallery);
    main.replaceChildren.apply(main, [top].concat(sections));
    return main;
  }

  function sorry(err) {
    console.error("[article]", err.message);
    var why = location.protocol === "file:"
      ? "Browsers block loading files on file:// — run a local server (see dusk/README.md)."
      : "This write-up isn't here yet.";
    document.getElementById("article").replaceChildren(
      el("section", { id: "top" }, [
        el("div", { class: "ar-bar" }, [el("a", { href: HOME, html: "&larr; Projects" })]),
        el("div", { class: "ar" }, [el("header", { class: "ar-head" }, [el("h1", { text: "Nothing to read yet." }), el("p", { class: "ar-sub", text: why })])])
      ])
    );
  }

  window.articleReady = Promise.all([
    script(ASSETS + "vendor/marked.umd.js?v=62e4b958"),
    get("entry.json", "json").catch(function (e) { console.error("[article]", e.message); return {}; }),
    get("article.md", "text"),
    get("sizes.json", "json").catch(function () { return {}; })
  ]).then(function (r) {
    SIZES = r[3] || {};
    build(r[1], r[2]);
  }).catch(sorry).then(function () {
    /* fx.js (quote, pets, lightbox) and article.js (text-message reveal)
       read the page when they start, so they load after it's built */
    return script(ASSETS + "fx.js?v=62e4b958");
  }).then(function () {
    return script(ASSETS + "article.js?v=62e4b958");
  }).then(function () {
    if (location.hash.length > 1) {
      var target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (target) target.scrollIntoView();
    }
  });
})();
