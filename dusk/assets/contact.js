/* =====================================================================
   contact.js — the telegraph on contact.html.
   Tap the key (mouse, finger, or the space bar): a short press is a dot,
   a held one is a dash, a pause ends the letter. Tapping HI opens the
   message line. The message is words only: it goes out through the
   visitor's own email or messages app, so nothing is stored here and
   there is nowhere to attach a file.
   ===================================================================== */
(function () {
  "use strict";

  var EMAIL = "kchweymen@gmail.com";
  var DASH_MS = 220;        /* a press this long or longer is a dash */
  var LETTER_MS = 650;      /* this long with the key up ends the letter */
  var WORD_MS = 1700;       /* and this long ends the word */
  var OPENERS = ["HI", "SOS"];

  var MORSE = {
    A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....", I: "..", J: ".---",
    K: "-.-", L: ".-..", M: "--", N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.", S: "...", T: "-",
    U: "..-", V: "...-", W: ".--", X: "-..-", Y: "-.--", Z: "--..",
    1: ".----", 2: "..---", 3: "...--", 4: "....-", 5: ".....", 6: "-....", 7: "--...", 8: "---..", 9: "----.", 0: "-----"
  };
  var DECODE = {};
  Object.keys(MORSE).forEach(function (k) { DECODE[MORSE[k]] = k; });
  function pretty(code) { return code.replace(/\./g, "·").replace(/-/g, "−"); }

  function $(id) { return document.getElementById(id); }
  var toast = (window.fx && window.fx.toast) || function () {};

  /* ---------- the cheat sheet, from the same table the decoder uses ---------- */
  var codes = $("codes");
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890".split("").forEach(function (ch) {
    var row = document.createElement("span"), b = document.createElement("b"), i = document.createElement("i");
    b.textContent = ch; i.textContent = pretty(MORSE[ch]);
    row.appendChild(b); row.appendChild(i); codes.appendChild(row);
  });

  /* ---------- the sounder ---------- */
  var soundOn = true, audio = null, osc = null, gain = null;
  function toneOn() {
    if (!soundOn) return;
    try {
      if (!audio) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        audio = new AC();
        gain = audio.createGain(); gain.gain.value = 0; gain.connect(audio.destination);
        osc = audio.createOscillator(); osc.type = "sine"; osc.frequency.value = 620; osc.connect(gain); osc.start();
      }
      if (audio.state === "suspended") audio.resume();
      gain.gain.setTargetAtTime(.12, audio.currentTime, .005);
    } catch (e) { /* no sound, the key still works */ }
  }
  function toneOff() { if (gain && audio) gain.gain.setTargetAtTime(0, audio.currentTime, .008); }
  $("sound").addEventListener("click", function () {
    soundOn = !soundOn;
    this.textContent = "Sound: " + (soundOn ? "on" : "off");
    this.setAttribute("aria-pressed", String(soundOn));
    if (!soundOn) toneOff();
  });

  /* ---------- keying ---------- */
  var key = $("key"), tapeText = $("tapeText"), tapeNow = $("tapeNow"), hint = $("hint"), line = $("line");
  var isDown = false, downAt = 0, symbols = "", text = "", letterT = null, wordT = null, open = false;

  function show() {
    tapeText.textContent = text.slice(-40);
    tapeNow.textContent = pretty(symbols);
  }
  function press() {
    if (isDown) return;
    isDown = true; downAt = performance.now();
    clearTimeout(letterT); clearTimeout(wordT);
    key.classList.add("down");
    toneOn();
  }
  function release() {
    if (!isDown) return;
    isDown = false;
    key.classList.remove("down");
    toneOff();
    symbols += (performance.now() - downAt) >= DASH_MS ? "-" : ".";
    if (symbols.length > 7) symbols = symbols.slice(-7);
    show();
    letterT = setTimeout(endLetter, LETTER_MS);
  }
  function endLetter() {
    var ch = DECODE[symbols];
    symbols = "";
    text += ch || "?";
    show();
    if (!ch) hint.textContent = "That one isn't on the sheet. Keep going, or clear the tape.";
    check();
    wordT = setTimeout(function () { if (text && text.slice(-1) !== " ") { text += " "; show(); } }, WORD_MS - LETTER_MS);
  }
  function check() {
    var t = text.replace(/\s+/g, "");
    if (!open && OPENERS.some(function (w) { return t.slice(-w.length) === w; })) return openLine(/SOS$/.test(t));
    if (/73$/.test(t)) toast("73 to you too. (Best regards, in telegraph.)");
    else if (/CQ$/.test(t)) toast("CQ CQ, this is WK-01. Go ahead.");
    else if (/WK$/.test(t)) toast("That's me.");
  }
  function openLine(sos) {
    open = true;
    line.hidden = false;
    hint.innerHTML = "<b>Line open.</b> Write your message below.";
    toast(sos ? "Help is not coming. But the line is open." : "HI received. Line open.");
    line.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
    setTimeout(function () { $("msg").focus({ preventScroll: true }); }, 400);
  }

  key.addEventListener("pointerdown", function (e) {
    if (e.button) return;
    e.preventDefault();
    try { key.setPointerCapture(e.pointerId); } catch (x) { /* fine */ }
    press();
  });
  key.addEventListener("pointerup", release);
  key.addEventListener("pointercancel", release);
  key.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  key.addEventListener("click", function (e) { e.preventDefault(); });

  /* the space bar is the key too, unless you're typing your message */
  function busy(e) {
    var t = e.target;
    return !!(t && t.closest && t.closest("a, input, textarea, select, button:not(#key)"));
  }
  document.addEventListener("keydown", function (e) {
    if (e.code !== "Space" || busy(e)) return;
    e.preventDefault();                 /* no page scroll */
    if (!e.repeat) press();
  });
  document.addEventListener("keyup", function (e) {
    if (e.code !== "Space" || busy(e)) return;
    e.preventDefault(); release();
  });
  window.addEventListener("blur", release);

  $("clearTape").addEventListener("click", function () {
    clearTimeout(letterT); clearTimeout(wordT);
    symbols = ""; text = ""; show();
    if (!open) hint.innerHTML = "Tap the key: <b>HI</b> is four dots, a pause, two dots.";
  });

  /* ---------- the message: words only ---------- */
  var msg = $("msg"), from = $("from"), echo = $("echo"), count = $("count");
  var sendEmail = $("sendEmail");
  function toMorse(s) {
    return s.toUpperCase().split("").map(function (c) { return c === " " ? "/" : (MORSE[c] ? pretty(MORSE[c]) : ""); })
      .filter(Boolean).join(" ");
  }
  function compose() {
    var body = msg.value.trim(), who = from.value.trim();
    count.textContent = msg.value.length + " / 1500";
    echo.textContent = toMorse(msg.value.slice(-60));
    var full = body + (who ? "\n\n— " + who : "");
    sendEmail.href = "mailto:" + EMAIL + "?subject=" + encodeURIComponent("Telegram from the website" + (who ? " — " + who : "")) +
      "&body=" + encodeURIComponent(full);
  }
  msg.addEventListener("input", compose);
  from.addEventListener("input", compose);
  [sendEmail].forEach(function (a) {
    a.addEventListener("click", function (e) {
      if (!msg.value.trim()) { e.preventDefault(); toast("The tape is blank. Write something first."); msg.focus(); }
    });
  });

  /* no files: nothing to attach to, and dropped or pasted files are turned away */
  function hasFiles(dt) { return dt && dt.types && Array.prototype.indexOf.call(dt.types, "Files") >= 0; }
  function refuse() {
    toast("No files on this line. Words only.");
    msg.classList.add("nope");
    setTimeout(function () { msg.classList.remove("nope"); }, 400);
  }
  ["dragover", "drop"].forEach(function (type) {
    document.addEventListener(type, function (e) {
      if (!hasFiles(e.dataTransfer)) return;
      e.preventDefault();
      if (type === "drop") refuse();
    });
  });
  document.addEventListener("paste", function (e) {
    if (hasFiles(e.clipboardData)) { e.preventDefault(); refuse(); }
  });

  compose();
  show();
})();
