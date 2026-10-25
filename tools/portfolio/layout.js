// Turns content.js into positioned primitives on a 1920 × 1080 artboard.
// Both renderers (HTML and PPTX) draw exactly these boxes, so the web deck,
// its PDF and the .pptx line up. Text heights are estimated here from
// average glyph widths; estimates run a little wide on purpose.
const T = require('./tokens');

const M = 96;                 // outer margin
const CW = T.W - 2 * M;       // content width, 1728

// type styles, px at 1920 wide (the .pptx divides by 2 for pt)
const S = {
  name:    { size: 104, weight: 600, lh: 1.12 },
  h1:      { size: 72, weight: 600, lh: 1.05 },
  lede:    { size: 54, weight: 500, lh: 1.12 },
  h2:      { size: 46, weight: 600, lh: 1.16 },
  cjk:     { size: 40, weight: 400, lh: 1.2, cjk: true, color: 'ink2' },
  title:   { size: 44, weight: 500, lh: 1.15 },
  problem: { size: 30, weight: 400, lh: 1.3 },
  tile:    { size: 30, weight: 600, lh: 1.15 },
  head:    { size: 28, weight: 600, lh: 1.15 },
  body:    { size: 24, weight: 400, lh: 1.45 },
  sub:     { size: 26, weight: 400, lh: 1.45, color: 'ink2' },
  value:   { size: 22, weight: 500, lh: 1.3 },
  cell:    { size: 20, weight: 400, lh: 1.3 },
  small:   { size: 20, weight: 400, lh: 1.35 },
  gname:   { size: 26, weight: 600, lh: 1.15 },
  label:   { size: 16, weight: 500, lh: 1.2, mono: true, upper: true, color: 'ink2', ls: 0.08 },
  caption: { size: 17, weight: 400, lh: 1.3, mono: true, color: 'ink2' },
  chrome:  { size: 16, weight: 500, lh: 1.2, mono: true, upper: true, color: 'ink2', ls: 0.08 },
  link:    { size: 18, weight: 500, lh: 1.2, mono: true, color: 'signal' },
  page:    { size: 26, weight: 500, lh: 1, mono: true, color: 'ink' },
};

/* [[ todo ]] → runs */
function runs(str) {
  const out = [];
  String(str).split(/(\[\[[^\]]*\]\])/).forEach(p => {
    if (!p) return;
    const m = p.match(/^\[\[\s*([^\]]*?)\s*\]\]$/);
    out.push(m ? { t: `[ ${m[1]} ]`, todo: true } : { t: p });
  });
  return out;
}
const plain = s => runs(s).map(r => r.t).join('');

// average advance as a fraction of the font size
function charW(st) { return st.mono ? 0.61 : st.cjk ? 1.0 : 0.545; }
function estLines(str, w, st) {
  const cpl = Math.max(1, Math.floor(w / (st.size * charW(st) * (st.upper ? 1.08 : 1))));
  let lines = 0;
  for (const para of plain(str).split('\n')) {
    let n = 0, cur = 0;
    for (const word of para.split(' ')) {
      const L = word.length;
      if (cur === 0) { cur = L; n = 1; }
      else if (cur + 1 + L <= cpl) cur += 1 + L;
      else { n++; cur = L; }
    }
    lines += Math.max(1, n);
  }
  return lines;
}
const textH = (str, w, st) => Math.ceil(estLines(str, w, st) * st.size * st.lh);

/* ---------- primitive builders ---------- */
const P = [];
function text(x, y, w, h, s, st, o = {}) { return { k: 'text', x, y, w, h, s: runs(s), st, ...o }; }
function textAuto(x, y, w, s, st, o = {}) { const h = textH(s, w, S[st]); return text(x, y, w, h, s, st, o); }

function specs(x, y, w, rows, o = {}) {
  const labelW = o.labelW || 170, vst = o.vst || 'value', pad = o.pad || 12;
  let cy = y;
  const out = rows.map(([k, v]) => {
    const vh = textH(v, w - labelW, S[vst]);
    const h = Math.max(vh, S.label.size * 1.4) + pad * 2;
    const r = { label: k, value: runs(v), y: cy, h, vh, accent: k.toLowerCase() === 'result' };
    cy += h;
    return r;
  });
  return { items: [{ k: 'specs', x, y, w, h: cy - y, labelW, vst, pad, rows: out }], bottom: cy };
}

function table(x, y, w, cols, rows, o = {}) {
  const total = cols.reduce((a, c) => a + c[1], 0);
  const ws = cols.map(c => Math.round(c[1] * w / total));
  const pad = 12, cst = o.cst || 'cell';
  const headH = 44;
  const rowHs = rows.map(r => Math.max(...r.map((c, i) => textH(c, ws[i] - 20, S[cst]))) + pad * 2);
  return { k: 'table', x, y, w, ws, head: cols.map(c => c[0]), rows, headH, rowHs, cst,
           h: headH + rowHs.reduce((a, b) => a + b, 0), firstColMono: o.firstColMono };
}

function chrome(sl, page, total) {
  const items = [];
  const crumb = sl.appendix ? `/ ${sl.id} — ${sl.section} · Appendix ${sl.appendix}` : `/ ${sl.id} — ${sl.section}`;
  items.push(text(M, 52, 1100, 24, crumb, 'chrome', { slashColor: sl.tone === 'fault' ? 'fault' : 'signal', role: 'crumb' }));
  let right = '';
  if (sl.tone === 'fault') right = `Failure analysis · ${sl.partNo}`;
  else if (sl.partNo) right = sl.partNo;
  if (right) items.push(text(T.W - M - 700, 52, 700, 24, right, 'chrome', { align: 'right', color: sl.tone === 'fault' ? 'fault' : 'ink2', role: 'meta' }));
  for (const [cx, cy] of [[48, 48], [T.W - 48, 48], [48, T.H - 48], [T.W - 48, T.H - 48]]) items.push({ k: 'cross', x: cx, y: cy });
  items.push(text(M, 1018, 900, 24, 'WK · Hardware Design Portfolio · 2026', 'chrome', { role: 'foot' }));
  items.push(text(T.W - M - 120, 1012, 120, 30, String(page).padStart(2, '0'), 'page', { align: 'right', role: 'page' }));
  return items;
}

function statusLine(x, y, w, status, label, o = {}) {
  return [{ k: 'status', x, y, w, h: 24, status, s: runs(label), color: o.color }];
}

function figureBox(f, x, y, w, h) {
  if (!f) return null;
  if (f.ph) return { k: 'ph', x, y, w, h, label: f.ph };
  const isSvg = f.src.endsWith('.svg');
  return { k: isSvg ? 'svg' : 'img', x, y, w, h, src: f.src, alt: f.alt, iw: f.w, ih: f.h, fit: f.fit || 'contain' };
}

/* ---------- slide types ---------- */
const L = {};

L.cover = (sl, meta) => {
  const it = [];
  it.push(text(M, 150, 700, 24, `${meta.docId} / ${meta.rev}`, 'chrome', { color: 'signal' }));
  it.push(text(M, 334, 700, 120, meta.name, 'name'));
  it.push(text(M, 462, 680, 50, meta.cjk, 'cjk'));
  it.push(text(M, 560, 680, 54, meta.title, 'title'));
  it.push(text(M, 628, 680, 24, meta.focus, 'label', { color: 'signal' }));
  const sp = specs(M, 770, 640, [
    ['Degree', meta.degree], ['Contact', meta.email], ['Code', meta.github], ['Web', meta.site],
  ], { labelW: 130, vst: 'small', pad: 9 });
  it.push(...sp.items);
  const ix = 800, iy = 230, iw = 1024, ih = 576;
  it.push(figureBox(sl.image, ix, iy, iw, ih));
  const labelX = [830, 1010, 1300];
  [...sl.callouts].sort((a, b) => a.x - b.x).forEach((c, i) => {
    it.push({ k: 'callout', px: ix + c.x * iw, py: iy + c.y * ih, lx: labelX[i], ly: 200, label: c.label });
  });
  it.push(text(ix, 826, iw, 48, sl.caption, 'caption'));
  return it;
};

L.summary = (sl, meta, ctx) => {
  const it = [];
  const LW = 904;
  it.push(textAuto(M, 140, LW, sl.lede, 'lede'));
  it.push(textAuto(M, 350, LW, sl.sub, 'sub'));
  let y = 500;
  sl.tiles.forEach(t => {
    const h = 150;
    const g = [];
    g.push({ k: 'rect', x: M, y, w: LW, h, fill: 'white', stroke: 'rule' });
    g.push({ k: 'rect', x: M + 24, y: y + 26, w: 40, h: 40, fill: 'signal' });
    g.push(text(M + 24, y + 33, 40, 26, t.letter, 'label', { color: 'white', align: 'center', role: 'badge' }));
    g.push(text(M + 88, y + 26, 520, 40, t.title, 'tile'));
    g.push(...statusLine(M + LW - 250, y + 32, 230, t.status, t.statusLabel));
    g.push(text(M + 88, y + 76, LW - 200, 60, t.result, 'small'));
    g.push(text(M + LW - 130, y + 104, 106, 24, `→ p.${ctx.pageOf(t.ref)}`, 'link', { align: 'right', href: `#p${ctx.pageOf(t.ref)}` }));
    it.push({ k: 'group', role: 'tile', items: g });
    y += h + 16;
  });
  // skills map
  const RX = 1096, RW = T.W - M - RX;
  it.push(text(RX, 146, RW, 24, 'Skills × projects', 'label', { color: 'signal' }));
  const colW = 84, nameW = RW - 3 * colW;
  let sy = 186;
  const headH = 48, rowH = 54;
  it.push({ k: 'skills', x: RX, y: sy, w: RW, nameW, colW, headH, rowH, cols: ['A', 'B', 'C'],
            rows: sl.skills.map(r => ({ name: r[0], marks: r.slice(1) })), h: headH + rowH * sl.skills.length });
  sy += headH + rowH * sl.skills.length;
  sy += 18;
  it.push({ k: 'legend', x: RX, y: sy, w: 300, h: 24 });
  it.push(text(RX + 300, sy, RW - 300, 24, sl.skillsNote, 'label', { align: 'right' }));
  sy += 50;
  const sp = specs(RX, sy, RW, [['Tools', sl.tools], ['Email', meta.email], ['Code', meta.github], ['Web', meta.site]], { labelW: 120, vst: 'small', pad: 9 });
  it.push(...sp.items);
  return it;
};

L.overview = (sl, meta, ctx) => {
  const it = [];
  const S0 = 800;
  if (sl.image) it.push(figureBox({ ...sl.image, fit: 'cover' }, M, 150, S0, S0));
  else it.push({ k: 'rect', x: M, y: 150, w: S0, h: S0, fill: 'white', stroke: 'rule' }, figureBox(sl.figure, M + 24, 174, S0 - 48, S0 - 48));
  it.push(text(M, 966, S0, 28, sl.fig, 'caption'));
  const RX = M + S0 + 72, RW = T.W - M - RX;
  it.push(...statusLine(RX, 150, RW, sl.status, sl.statusLabel));
  it.push(text(RX, 190, RW, 80, sl.title, 'h1'));
  const ph = textH(sl.problem, RW, S.problem);
  it.push(text(RX, 290, RW, ph, sl.problem, 'problem'));
  const sp = specs(RX, 290 + ph + 30, RW, sl.specs, { labelW: 150 });
  it.push(...sp.items);
  it.push(text(RX, Math.max(sp.bottom + 26, 900), RW, 26, `→ Deep dive · ${ctx.nextLabel(sl)}`, 'link', { href: `#p${ctx.nextPage(sl)}` }));
  return it;
};

L.story = (sl, meta, ctx) => {
  const it = [];
  it.push(text(M, 140, 1300, 80, sl.title, 'h1'));
  it.push(text(T.W - M - 520, 162, 520, 26, `→ Deep dive · ${ctx.nextLabel(sl)}`, 'link', { align: 'right', href: `#p${ctx.nextPage(sl)}` }));
  it.push(text(M, 232, CW, 40, sl.problem, 'problem', { color: 'ink2' }));
  const cw = (CW - 72) / 2;
  sl.columns.forEach((c, i) => {
    const x = M + i * (cw + 72);
    const g = [];
    g.push(text(x, 300, cw - 320, 34, c.head, 'head'));
    g.push(...statusLine(x + cw - 300, 306, 300, c.status, c.statusLabel));
    g.push(figureBox({ ...c.image, fit: 'cover' }, x, 350, cw, 360));
    const sp = specs(x, 730, cw, c.specs, { labelW: 120, pad: 9 });
    g.push(...sp.items);
    it.push({ k: 'group', role: 'col', items: g });
  });
  it.push(text(M + cw + 14, 512, 44, 40, '→', 'head', { color: 'signal', align: 'center', role: 'arrow' }));
  it.push(text(M, 958, CW, 28, `My role · ${sl.role}`, 'caption', { color: 'ink' }));
  return it;
};

L.gallery = (sl) => {
  const it = [];
  it.push(text(M, 140, 1200, 80, sl.title, 'h1'));
  it.push(text(M, 232, 1200, 40, sl.sub, 'problem', { color: 'ink2' }));
  const tw = (CW - 3 * 24) / 4, th = 330;
  sl.tiles.forEach((t, i) => {
    const x = M + (i % 4) * (tw + 24), y = 300 + Math.floor(i / 4) * (th + 24);
    const g = [];
    g.push(t.image ? figureBox({ ...t.image, fit: 'cover' }, x, y, tw, 186) : { k: 'ph', x, y, w: tw, h: 186, label: 'render to add' });
    g.push(text(x, y + 202, tw, 32, t.name, 'gname'));
    g.push(...statusLine(x, y + 240, tw, t.status, t.statusLabel));
    g.push(text(x, y + 272, tw, 56, t.spec, 'small', { color: 'ink2' }));
    it.push({ k: 'group', role: 'gtile', items: g });
  });
  return it;
};

L.deep = (sl) => {
  const it = [];
  const hh = textH(sl.headline, CW, S.h2);
  it.push(text(M, 132, CW, hh, sl.headline, 'h2', { role: 'headline' }));
  const top = Math.max(290, 132 + hh + 44);

  if (sl.layout === 'table') {
    const tb = table(M, top, CW, sl.table.cols, sl.table.rows);
    it.push(tb);
    let y = top + tb.h + 18;
    it.push(text(M, y, CW, 26, sl.caption, 'caption'));
    y += 46;
    if (sl.note) it.push(textAuto(M, y, CW, sl.note, 'body'));
    return it;
  }

  const FW = 1080, FB = 910, RX = M + FW + 48, RW = T.W - M - RX;
  // figures
  const figs = sl.figures || (sl.figure ? [sl.figure] : []);
  const extra = [];
  if (sl.figure2) extra.push(sl.figure2);
  if (sl.placeholder2) extra.push({ ph: sl.placeholder2 });
  if (!figs.length) it.push({ k: 'ph', x: M, y: top, w: FW, h: FB - top, label: sl.placeholder });
  else if (extra.length) {
    const h1 = Math.round((FB - top) * 0.64);
    it.push(figureBox(figs[0], M, top, FW, h1));
    it.push(figureBox(extra[0], M, top + h1 + 20, FW, FB - top - h1 - 20));
  } else if (figs.length === 2) {
    const w2 = (FW - 24) / 2;
    figs.forEach((f, i) => it.push(figureBox(f, M + i * (w2 + 24), top, w2, FB - top)));
  } else it.push(figureBox(figs[0], M, top, FW, FB - top));
  it.push(text(M, FB + 16, FW, 48, sl.caption, 'caption'));

  // right column
  let y = top;
  if (sl.body) { const b = textAuto(RX, y, RW, sl.body, 'body'); it.push(b); y += b.h + 40; }
  if (sl.specs) { const sp = specs(RX, y, RW, sl.specs, { labelW: 150, pad: 10 }); it.push(...sp.items); y = sp.bottom; }
  if (sl.table) { const tb = table(RX, y, RW, sl.table.cols, sl.table.rows); it.push(tb); y += tb.h; }
  return it;
};

L.back = (sl, meta) => {
  const it = [];
  it.push(text(M, 300, 1300, 80, 'Thanks for reading.', 'h1'));
  it.push(text(M, 400, 1100, 80, 'Happy to walk through any of these boards, the schematics or the bench data in an interview.', 'problem', { color: 'ink2' }));
  const sp = specs(M, 540, 900, [
    ['Email', meta.email], ['Code', meta.github], ['Web', meta.site], ['Long read', 'The AeroDesign story, in full: weymenkoo.github.io/Personal-Site'],
  ], { labelW: 170 });
  it.push(...sp.items);
  it.push({ k: 'svg', x: 1404, y: 300, w: 420, h: 420, src: 'fig/toucan.svg', alt: 'Toucan mark', iw: 176, ih: 176, fit: 'contain' });
  it.push(text(M, 900, 1200, 24, `${meta.docId} · ${meta.rev} · last updated ${meta.updated}`, 'chrome'));
  return it;
};

function layout(content) {
  const { meta, slides } = content;
  const pageById = {};
  slides.forEach((s, i) => { pageById[s.id] = String(i + 1).padStart(2, '0'); });
  const firstOf = l => slides.findIndex(s => s.appendix === l) + 1;
  const letterOf = sl => ({ '02': 'A', '03': 'B', '04': 'C' })[sl.id];
  const ctx = {
    pageOf: id => pageById[id],
    nextPage: sl => String(firstOf(letterOf(sl))).padStart(2, '0'),
    nextLabel: sl => `Appendix ${letterOf(sl)} · p.${String(firstOf(letterOf(sl))).padStart(2, '0')}`,
  };
  return slides.map((sl, i) => {
    const page = i + 1;
    const items = [...chrome(sl, page, slides.length), ...L[sl.type](sl, meta, ctx)].filter(Boolean);
    return { id: sl.id, page: String(page).padStart(2, '0'), type: sl.type, title: sl.title || sl.headline || sl.section, section: sl.section, appendix: sl.appendix, items };
  });
}

module.exports = { layout, S, runs, plain, M, CW };
