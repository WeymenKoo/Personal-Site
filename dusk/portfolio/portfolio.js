/* Hardware Design Portfolio — present mode, keyboard, lightbox.
   No build step and no dependencies; the deck works without this file. */
(function () {
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var body = document.body;
  var cur = 0;

  /* which slide is on screen (for entering present mode at the right page) */
  function visibleIndex() {
    var mid = window.innerHeight / 2, best = 0, bestD = Infinity;
    slides.forEach(function (s, i) {
      var r = s.getBoundingClientRect(), d = Math.abs(r.top + r.height / 2 - mid);
      if (d < bestD) { bestD = d; best = i; }
    });
    return best;
  }

  function show(i) {
    cur = Math.max(0, Math.min(slides.length - 1, i));
    slides.forEach(function (s, k) { s.classList.toggle('on', k === cur); });
    if (history.replaceState) history.replaceState(null, '', '#' + slides[cur].id);
  }

  function present(on) {
    if (on) {
      show(visibleIndex());
      body.classList.add('presenting');
      var el = document.documentElement;
      if (el.requestFullscreen) el.requestFullscreen().catch(function () {});
    } else {
      body.classList.remove('presenting');
      if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(function () {});
      slides[cur].scrollIntoView({ block: 'start' });
    }
  }

  var btn = document.getElementById('present');
  if (btn) btn.addEventListener('click', function () { present(true); });
  document.addEventListener('fullscreenchange', function () {
    if (!document.fullscreenElement && body.classList.contains('presenting')) present(false);
  });

  document.addEventListener('keydown', function (e) {
    if (!body.classList.contains('presenting')) return;
    var k = e.key;
    if (k === 'ArrowRight' || k === 'PageDown' || k === ' ' || k === 'ArrowDown') { show(cur + 1); e.preventDefault(); }
    else if (k === 'ArrowLeft' || k === 'PageUp' || k === 'ArrowUp') { show(cur - 1); e.preventDefault(); }
    else if (k === 'Home') { show(0); e.preventDefault(); }
    else if (k === 'End') { show(slides.length - 1); e.preventDefault(); }
    else if (k === 'Escape') { present(false); }
  });
  /* click right half: next, left half: previous */
  document.getElementById('deck').addEventListener('click', function (e) {
    if (!body.classList.contains('presenting') || e.target.closest('a,button')) return;
    show(e.clientX > window.innerWidth / 2 ? cur + 1 : cur - 1);
  });

  /* the page index closes after a pick */
  var idx = document.querySelector('.idx');
  if (idx) idx.addEventListener('click', function (e) { if (e.target.closest('a')) idx.open = false; });

  /* lightbox for photos and renders */
  var lb = document.getElementById('lb');
  if (lb) {
    var img = lb.querySelector('img'), last = null;
    document.addEventListener('click', function (e) {
      var z = e.target.closest('.zoom');
      if (!z || body.classList.contains('presenting')) return;
      last = z;
      img.src = z.getAttribute('data-full');
      img.alt = (z.querySelector('img') || {}).alt || '';
      lb.hidden = false;
      lb.querySelector('.x').focus();
    });
    function close() { lb.hidden = true; img.removeAttribute('src'); if (last) last.focus(); }
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.closest('.x')) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !lb.hidden) close(); });
  }
})();
