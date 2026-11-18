/* =====================================================================
   resume.js — the transcript table, and the exam room that unseals the
   grades under 55%.

   A sealed grade is stored only encrypted (AES-GCM, key from PBKDF2 of the
   question's answer; see tools/seal-grades.js). Handing in the right
   answer is what decrypts it: the grade isn't anywhere in the page until
   then. The uploaded working is required, shown back as a thumbnail and
   never leaves the visitor's device. Nobody marks it. It's the honour
   system, with a timer.
   ===================================================================== */
(function () {
  "use strict";

  var toast = (window.fx && window.fx.toast) || function () {};
  function $(id) { return document.getElementById(id); }
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") n.textContent = attrs[k];
      else if (k === "class") n.className = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c != null) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }

  /* ================================================================
     TRANSCRIPT
     ================================================================ */
  var rowsByCode = {};
  function vsAvg(r) {
    if (r.pct == null || r.avg == null) return "";
    var d = r.pct - r.avg;
    return el("span", { class: "vs " + (d < 0 ? "dn" : "up"), text: (d < 0 ? "▼ " : "▲ ") + Math.abs(d) + (d < 0 ? " below avg" : " above avg") });
  }
  function band(pct) { return pct == null ? "" : pct < 60 ? "bad" : pct < 68 ? "c" : ""; }

  function row(r) {
    var tr = el("tr", { class: r.exam ? "sealed" : band(r.pct), "data-code": r.code });
    var gradeCells;
    if (r.exam) {
      var btn = el("button", { class: "sit", type: "button", text: "Sit the exam ▸" });
      btn.addEventListener("click", function () { openExam(r); });
      gradeCells = [
        el("td", { class: "n pct" }, [el("span", { class: "seal" }, [el("span", { class: "redact", "aria-label": "sealed", text: "██" })])]),
        el("td", { class: "let" }, [el("span", { class: "redact", "aria-label": "sealed", text: "██" })]),
        el("td", { class: "n rec" }, [el("span", { class: "redact", "aria-label": "sealed", text: "███" })]),
        el("td", { class: "n" }, [r.size != null ? String(r.size) : ""]),
        el("td", { class: "n" }, [r.avg != null ? String(r.avg) : ""]),
        el("td", { class: "vscell" }, [btn])
      ];
    } else {
      gradeCells = [
        el("td", { class: "n pct", text: r.pct != null ? String(r.pct) : "" }),
        el("td", { class: "let", text: r.letter || "" }),
        el("td", { class: "n rec", text: r.rec || "" }),
        el("td", { class: "n", text: r.size != null ? String(r.size) : "" }),
        el("td", { class: "n", text: r.avg != null ? String(r.avg) : "" }),
        el("td", { class: "vscell" }, [vsAvg(r)])
      ];
    }
    [el("td", { text: r.term || "" }), el("td", { class: "code", text: r.code.replace("_V", "") }),
     el("td", { class: "n", text: r.credits || "" }), el("td", { text: r.title })].concat(gradeCells)
      .forEach(function (c) { tr.appendChild(c); });
    rowsByCode[r.code] = { data: r, tr: tr };
    return tr;
  }

  function session(s) {
    var head = el("tr", {}, ["Term", "Course", "Credits", "Title", "%", "Grade", "Rec'd", "Class size", "Class avg", ""].map(function (h) {
      return el("th", { text: h });
    }));
    var body = el("tbody", {}, s.rows.map(row));
    var kids = [el("h3", {}, [s.name + " ", el("span", { text: "· " + s.year })]),
      el("div", { class: "tr-scroll" }, [el("table", { class: "tr-t" }, [el("thead", {}, [head]), body])])];
    if (s.awards) kids.push(el("p", { class: "tr-src", text: "Award: " + s.awards.join(", ") }));
    return el("div", { class: "tr-sess" }, kids);
  }

  function shame(t) {
    var all = [];
    t.sessions.forEach(function (s) { all = all.concat(s.rows); });
    var graded = all.filter(function (r) { return r.pct != null; });
    var below = graded.filter(function (r) { return r.avg != null && r.pct < r.avg; });
    var worst = graded.slice().sort(function (a, b) { return a.pct - b.pct; })[0];
    var gap = below.slice().sort(function (a, b) { return (a.pct - a.avg) - (b.pct - b.avg); })[0];
    var sealed = all.filter(function (r) { return r.exam; }).length;
    var chips = [
      [String(sealed), " grades under 55%, sealed"],
      [below.length + " of " + graded.length, " visible grades below the class average"],
      [worst ? worst.code.replace("_V", "") + " " + worst.pct + "%" : "", ", the lowest you can see without an exam"],
      [gap ? gap.code.replace("_V", "") + " −" + (gap.avg - gap.pct) : "", " points, the furthest under a class average"]
    ];
    $("shame").replaceChildren.apply($("shame"), chips.map(function (c) { return el("span", {}, [el("b", { text: c[0] }), c[1]]); }));
  }

  var ready = fetch("content/transcript.json", { cache: "no-cache" }).then(function (r) {
    if (!r.ok) throw new Error("transcript.json → " + r.status);
    return r.json();
  }).then(function (t) {
    $("trProgram").textContent = t.program;
    $("sessions").replaceChildren.apply($("sessions"), t.sessions.map(session));
    $("trTotal").textContent = "Transfer credits: " + t.transfer.toFixed(1) + " · Credits earned: " + t.cumulative.credits.toFixed(1) +
      " · Cumulative average: " + t.cumulative.avg + "%";
    $("trSrc").textContent = "Source: " + t.source + ". Name, student number and date of birth removed.";
    shame(t);
  }).catch(function (e) { console.error("[resume]", e); });
  window.resumeReady = ready;

  /* ================================================================
     ANSWERS — a small, safe evaluator: numbers, + − × ÷ ^, brackets,
     sqrt(), pi, e. No eval().
     ================================================================ */
  function evaluate(src) {
    var s = String(src).toLowerCase().replace(/\s+/g, "").replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-").replace(/,/g, ".")
      .replace(/√/g, "sqrt").replace(/π/g, "pi");
    var i = 0;
    function peek() { return s[i]; }
    function eat(c) { if (s[i] === c) { i++; return true; } return false; }
    function num() {
      var m = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/.exec(s.slice(i));
      if (m) { i += m[0].length; return parseFloat(m[0]); }
      if (s.slice(i, i + 2) === "pi") { i += 2; return Math.PI; }
      if (s.slice(i, i + 4) === "sqrt") { i += 4; if (!eat("(")) throw 0; var v = expr(); if (!eat(")")) throw 0; return Math.sqrt(v); }
      if (s[i] === "e") { i++; return Math.E; }
      if (eat("(")) { var w = expr(); if (!eat(")")) throw 0; return w; }
      throw 0;
    }
    function unary() { if (eat("-")) return -unary(); if (eat("+")) return unary(); return power(); }
    function power() { var b = num(); if (eat("^")) return Math.pow(b, unary()); return b; }
    function term() { var v = unary(); for (;;) { if (eat("*")) v *= unary(); else if (eat("/")) v /= unary(); else if (peek() === "(" || /[a-z]/.test(peek() || "")) v *= unary(); else return v; } }
    function expr() { var v = term(); for (;;) { if (eat("+")) v += term(); else if (eat("-")) v -= term(); else return v; } }
    try { var v = expr(); if (i !== s.length || !isFinite(v)) return null; return v; } catch (x) { return null; }
  }
  /* the keys to try: the value to 4 d.p., and one step either side for rounding */
  function keysFor(v) {
    var r = Math.round(v * 10000);
    return [r, r - 1, r + 1].map(function (n) { return (n / 10000).toFixed(4); });
  }

  function b64(s) { return Uint8Array.from(atob(s), function (c) { return c.charCodeAt(0); }); }
  function tryOpen(variant, key) {
    var subtle = window.crypto && window.crypto.subtle;
    if (!subtle) return Promise.reject(new Error("no WebCrypto"));
    return subtle.importKey("raw", new TextEncoder().encode(key), "PBKDF2", false, ["deriveKey"]).then(function (base) {
      return subtle.deriveKey({ name: "PBKDF2", salt: b64(variant.salt), iterations: variant.iter, hash: "SHA-256" },
        base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
    }).then(function (k) {
      return subtle.decrypt({ name: "AES-GCM", iv: b64(variant.iv) }, k, b64(variant.ct));
    }).then(function (buf) { return JSON.parse(new TextDecoder().decode(buf)); });
  }
  function unseal(variant, answer) {
    var v = evaluate(answer);
    if (v == null) return Promise.resolve(null);
    var keys = keysFor(v), k = 0;
    function next() {
      if (k >= keys.length) return null;
      return tryOpen(variant, keys[k++]).catch(next);
    }
    return Promise.resolve(next());
  }

  /* ================================================================
     THE EXAM ROOM
     ================================================================ */
  var exam = $("exam"), canvas = $("examQ"), clock = $("examClock"), file = $("examFile"), ans = $("examAns"),
      submit = $("examSubmit"), msg = $("examMsg");
  var cur = null;          /* { row, variant, index, ends, strikes, timer, done } */
  var lastVariant = {};

  function drawQuestion(lines) {
    var ctx = canvas.getContext("2d"), W = canvas.width, H = canvas.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H);
    /* a faint grid and scattered specks: it's a printed page, not text */
    ctx.strokeStyle = "rgba(60,90,160,.08)"; ctx.lineWidth = 1;
    for (var x = 0; x < W; x += 22) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (var y = 0; y < H; y += 22) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    for (var k = 0; k < 500; k++) { ctx.fillStyle = "rgba(0,0,0," + (Math.random() * .12).toFixed(3) + ")"; ctx.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5); }
    ctx.translate(W / 2, H / 2); ctx.rotate((Math.random() - .5) * .012); ctx.translate(-W / 2, -H / 2);
    ctx.fillStyle = "#1b1b22"; ctx.textBaseline = "top";
    lines.forEach(function (line, j) {
      ctx.font = (j === 0 ? "bold 21px" : "20px") + " 'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace";
      ctx.fillText(line, 34 + (Math.random() - .5) * 2, 30 + j * 38 + (Math.random() - .5) * 2);
    });
    /* a light stroke through the page, like a photocopier streak */
    ctx.strokeStyle = "rgba(0,0,0,.05)"; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(0, H * Math.random()); ctx.lineTo(W, H * Math.random()); ctx.stroke();
    canvas.setAttribute("aria-label", "Exam question, printed as an image. " + lines.join(" "));
  }

  function fmt(ms) { var s = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2); }
  function tick() {
    if (!cur || cur.done) return;
    var left = cur.ends - Date.now();
    clock.textContent = fmt(left);
    clock.parentNode.classList.toggle("low", left <= 60000);
    if (left <= 0) end("Pens down. Time's up, and the grade stays sealed.", true);
  }
  function setMsg(text, kind) { msg.textContent = text; msg.className = "exam-msg" + (kind ? " " + kind : ""); }
  function ready2() { submit.disabled = !(cur && !cur.done && file.files.length && ans.value.trim()); }

  function openExam(r) {
    var vs = r.exam.variants;
    var idx = Math.floor(Math.random() * vs.length);
    if (vs.length > 1 && idx === lastVariant[r.code]) idx = (idx + 1) % vs.length;   /* a retake gets a different question */
    lastVariant[r.code] = idx;
    cur = { row: r, variant: vs[idx], index: idx, ends: Date.now() + (r.exam.minutes || 10) * 60000, strikes: 0, done: false };
    exam.dataset.code = r.code; exam.dataset.variant = String(idx);
    $("examTitle").textContent = r.code.replace("_V", "") + " · " + r.exam.subject;
    $("examAsk").textContent = cur.variant.ask;
    drawQuestion(cur.variant.lines);
    file.value = ""; ans.value = ""; $("upThumb").hidden = true; $("upName").textContent = "(photo or PDF, required)";
    setMsg("");
    exam.hidden = false;
    document.documentElement.style.overflow = "hidden";
    clearInterval(cur.timer); cur.timer = setInterval(tick, 250); tick();
    ready2();
    $("examQuit").focus();
  }
  function end(text, bad) {
    if (!cur) return;
    cur.done = true; clearInterval(cur.timer);
    setMsg(text, bad ? "bad" : "ok");
    submit.disabled = true;
    $("examQuit").textContent = "Leave the room";
  }
  function close() {
    if (cur) clearInterval(cur.timer);
    exam.hidden = true;
    document.documentElement.style.overflow = "";
    $("examQuit").textContent = "Walk out";
    cur = null;
  }
  $("examQuit").addEventListener("click", close);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !exam.hidden) close(); });

  /* leaving the tab is leaving the room */
  function strike() {
    if (!cur || cur.done || exam.hidden) return;
    cur.strikes++;
    if (cur.strikes >= 2) end("You left the exam room twice. Attempt void.", true);
    else setMsg("You left the exam room. Once more and the attempt is void.", "bad");
  }
  /* (only a tab switch counts: the file picker blurs the window too) */
  document.addEventListener("visibilitychange", function () { if (document.hidden) strike(); });

  /* the written answer: required, previewed, kept on this device */
  file.addEventListener("change", function () {
    var f = file.files[0];
    if (!f) { ready2(); return; }
    if (!/^image\/|^application\/pdf$/.test(f.type) || f.size > 15 * 1024 * 1024) {
      file.value = ""; $("upName").textContent = "(that wasn't a photo or a PDF under 15 MB)"; ready2(); return;
    }
    $("upName").textContent = "✓ " + f.name;
    var thumb = $("upThumb");
    if (/^image\//.test(f.type)) {
      if (thumb.src) URL.revokeObjectURL(thumb.src);
      thumb.src = URL.createObjectURL(f); thumb.hidden = false;
    } else thumb.hidden = true;
    ready2();
  });
  ans.addEventListener("input", ready2);
  ans.addEventListener("keydown", function (e) { if (e.key === "Enter" && !submit.disabled) submit.click(); });

  submit.addEventListener("click", function () {
    if (!cur || cur.done) return;
    if (!file.files.length) { setMsg("Upload your written answer first.", "bad"); return; }
    if (evaluate(ans.value) == null) { setMsg("That isn't a number I can read. Try 5/12, 0.4167 or sqrt(2)/2.", "bad"); return; }
    var attempt = cur;
    submit.disabled = true; setMsg("Marking…");
    unseal(attempt.variant, ans.value).then(function (g) {
      if (attempt !== cur || attempt.done) return;
      if (!g) {
        end("Incorrect. The grade stays sealed. Walk out and sit it again for a different question.", true);
        return;
      }
      end("Correct. The grade is unsealed below. You earned it; he didn't.", false);
      reveal(attempt.row.code, g);
      setTimeout(close, 1600);
    }).catch(function (e) {
      console.error("[resume]", e);
      setMsg("This browser can't do the maths needed to open the seal (no WebCrypto).", "bad");
    });
  });

  function reveal(code, g) {
    var x = rowsByCode[code];
    if (!x) return;
    var tr = x.tr, r = x.data;
    r.pct = g.pct;
    tr.className = "bad reveal";
    tr.querySelector(".pct").textContent = String(g.pct);
    tr.querySelector(".let").textContent = g.letter;
    tr.querySelector(".rec").textContent = g.rec;
    tr.querySelector(".vscell").replaceChildren(vsAvg(r));
    toast(code.replace("_V", "") + ": " + g.pct + "% (" + g.letter + "). Class average " + r.avg + "%.");
    tr.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  window.resumeExam = { evaluate: evaluate, keysFor: keysFor };
})();
