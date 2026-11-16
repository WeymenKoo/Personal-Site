// Draws the laid-out slides into an editable PowerPoint.
// Same boxes as the web deck: 1920 px artboard = 13.333 in, so px / 144 = in,
// and type in px / 2 = pt. Needs pptxgenjs and sharp (npm install).
// Fonts: Space Grotesk + JetBrains Mono must be installed on the machine that
// opens the file (Google Fonts, free), or PowerPoint substitutes them.
const fs = require('fs');
const path = require('path');
const PptxGenJS = require('pptxgenjs');
const sharp = require('sharp');
const T = require('./tokens');
const { S } = require('./layout');

const IN = px => px / 144;
const PT = px => Math.round(px * 5) / 10; // px / 2, to 0.1 pt
const hex = c => (T[c] || c || T.ink).replace('#', '');

const SANS = 'Space Grotesk', SANS_MED = 'Space Grotesk Medium', MONO = 'JetBrains Mono', CJK = 'Noto Sans SC';

function fontFor(st) {
  if (st.mono) return { fontFace: MONO, bold: st.weight >= 600 };
  if (st.cjk) return { fontFace: CJK, bold: false };
  if (st.weight >= 600) return { fontFace: SANS, bold: true };
  if (st.weight >= 500) return { fontFace: SANS_MED, bold: false };
  return { fontFace: SANS, bold: false };
}

function textRuns(runs, st, base, o = {}) {
  const up = st.upper ? s => s.toUpperCase() : s => s;
  return runs.map((r, i) => {
    let t = up(r.t);
    const opt = { ...base };
    if (r.todo) opt.color = hex('todo');
    if (o.slash && i === 0 && t.startsWith('/')) {
      return [{ text: '/', options: { ...opt, color: hex(o.slash) } }, { text: t.slice(1), options: opt }];
    }
    return [{ text: t, options: opt }];
  }).flat();
}

const pngCache = {};
async function svgPng(file, w, h) {
  const key = `${file}@${w}x${h}`;
  if (!pngCache[key]) {
    const buf = await sharp(fs.readFileSync(file), { density: 192 }).resize({ width: Math.round(w * 2), height: Math.round(h * 2), fit: 'inside' }).flatten({ background: T.paper }).png().toBuffer();
    pngCache[key] = 'image/png;base64,' + buf.toString('base64');
  }
  return pngCache[key];
}

function contain(iw, ih, x, y, w, h) {
  const s = Math.min(w / iw, h / ih);
  const dw = iw * s, dh = ih * s;
  return { x: x + (w - dw) / 2, y: y + (h - dh) / 2, w: dw, h: dh };
}

async function draw(slide, i, ctx) {
  const { site, pageNo } = ctx;
  switch (i.k) {
    case 'group': for (const c of i.items) await draw(slide, c, ctx); return;
    case 'text': {
      const st = S[i.st];
      const base = { ...fontFor(st), fontSize: PT(st.size), color: hex(i.color || st.color || 'ink'), charSpacing: st.ls ? PT(st.size * st.ls) : undefined };
      if (i.href) base.hyperlink = { slide: Number(i.href.replace('#p', '')) };
      const opts = {
        x: IN(i.x), y: IN(i.y), w: IN(i.w), h: IN(Math.max(i.h, st.size * st.lh)),
        margin: 0, valign: 'top', align: i.align || 'left', lineSpacing: PT(st.size * st.lh), isTextBox: true,
        paraSpaceAfter: 0, paraSpaceBefore: 0, fit: 'none', wrap: true,
      };
      if (ctx.titleRole && (i.role === ctx.titleRole)) { opts.placeholder = 'title'; }
      slide.addText(textRuns(i.s, st, base, { slash: i.role === 'crumb' ? (i.slashColor || 'signal') : null }), opts);
      return;
    }
    case 'status': {
      const c = { ok: [T.ok, T.ok], wip: [T.trace, T.signal], sim: [null, T.trace], idle: [T.idle, T.idle], stop: [T.fault, T.fault] }[i.status] || [T.idle, T.idle];
      slide.addShape('ellipse', { x: IN(i.x), y: IN(i.y + 4), w: IN(16), h: IN(16), fill: c[0] ? { color: hex(c[0]) } : { type: 'none' }, line: { color: hex(c[1]), width: c[0] ? 1 : 1.75 } });
      const st = S.label;
      slide.addText(textRuns(i.s, st, { ...fontFor(st), fontSize: PT(st.size), color: hex(i.color || 'ink'), charSpacing: PT(st.size * st.ls) }),
        { x: IN(i.x + 26), y: IN(i.y), w: IN(i.w - 26), h: IN(24), margin: 0, valign: 'middle', isTextBox: true, fit: 'none' });
      return;
    }
    case 'img': {
      const file = path.join(site, i.src);
      if (i.fit === 'cover') slide.addImage({ path: file, x: IN(i.x), y: IN(i.y), w: IN(i.w), h: IN(i.h), sizing: { type: 'cover', w: IN(i.w), h: IN(i.h) }, altText: i.alt });
      else { const b = contain(i.iw, i.ih, i.x, i.y, i.w, i.h); slide.addImage({ path: file, x: IN(b.x), y: IN(b.y), w: IN(b.w), h: IN(b.h), altText: i.alt }); }
      return;
    }
    case 'svg': {
      const b = contain(i.iw, i.ih, i.x, i.y, i.w, i.h);
      slide.addImage({ data: await svgPng(path.join(site, i.src), b.w, b.h), x: IN(b.x), y: IN(b.y), w: IN(b.w), h: IN(b.h), altText: i.alt });
      return;
    }
    case 'ph': {
      slide.addShape('rect', { x: IN(i.x), y: IN(i.y), w: IN(i.w), h: IN(i.h), fill: { color: hex('trace'), transparency: 93 }, line: { color: hex('todo'), width: 1, dashType: 'dash' } });
      slide.addText([
        { text: 'FIGURE TO ADD', options: { fontFace: MONO, fontSize: 7.5, color: hex('todo'), charSpacing: 1.2, breakLine: true } },
        { text: i.label, options: { fontFace: MONO, fontSize: 10, color: hex('todo') } },
      ], { x: IN(i.x + 24), y: IN(i.y), w: IN(i.w - 48), h: IN(i.h), align: 'center', valign: 'middle', margin: 0, isTextBox: true, paraSpaceAfter: 6 });
      return;
    }
    case 'rect':
      slide.addShape('rect', { x: IN(i.x), y: IN(i.y), w: IN(i.w), h: IN(i.h), fill: i.fill ? { color: hex(i.fill) } : { type: 'none' }, line: i.stroke ? { color: hex(i.stroke), width: 0.75 } : { type: 'none' } });
      return;
    case 'line':
      slide.addShape('line', { x: IN(i.x1), y: IN(i.y1), w: IN(i.x2 - i.x1) || 0.001, h: IN(i.y2 - i.y1), line: { color: hex(i.color), width: (i.width || 1.5) / 2 } });
      return;
    case 'cross':
      slide.addShape('line', { x: IN(i.x - 10), y: IN(i.y), w: IN(20), h: 0, line: { color: hex('ink2'), width: 0.75 } });
      slide.addShape('line', { x: IN(i.x), y: IN(i.y - 10), w: 0, h: IN(20), line: { color: hex('ink2'), width: 0.75 } });
      return;
    case 'callout': {
      slide.addShape('line', { x: IN(i.lx), y: IN(i.ly + 30), w: 0, h: IN(22), line: { color: hex('signal'), width: 1 } });
      const x1 = i.lx, y1 = i.ly + 52, x2 = i.px, y2 = i.py;
      slide.addShape('line', { x: IN(Math.min(x1, x2)), y: IN(Math.min(y1, y2)), w: IN(Math.abs(x2 - x1)), h: IN(Math.abs(y2 - y1)), flipH: x2 < x1, line: { color: hex('signal'), width: 1 } });
      slide.addShape('ellipse', { x: IN(i.px - 7), y: IN(i.py - 7), w: IN(14), h: IN(14), fill: { color: hex('paper') }, line: { color: hex('signal'), width: 1.5 } });
      slide.addText(i.label.toUpperCase(), { x: IN(i.lx), y: IN(i.ly), w: IN(420), h: IN(26), margin: 0, fontFace: MONO, fontSize: 8.5, color: hex('signal'), charSpacing: 0.5, isTextBox: true, valign: 'top' });
      return;
    }
    case 'mark': return mark(slide, i.x, i.y, i.s, i.kind);
    case 'legend': {
      mark(slide, i.x, i.y + 3, 18, 'full');
      slide.addText('CORE', { x: IN(i.x + 28), y: IN(i.y), w: IN(90), h: IN(24), margin: 0, fontFace: MONO, fontSize: 8, color: hex('ink2'), charSpacing: 0.6, valign: 'middle', isTextBox: true });
      mark(slide, i.x + 120, i.y + 3, 18, 'half');
      slide.addText('PARTIAL', { x: IN(i.x + 148), y: IN(i.y), w: IN(150), h: IN(24), margin: 0, fontFace: MONO, fontSize: 8, color: hex('ink2'), charSpacing: 0.6, valign: 'middle', isTextBox: true });
      return;
    }
    case 'specs': {
      const lst = S.label, vst = S[i.vst];
      for (const row of i.rows) {
        slide.addShape('line', { x: IN(i.x), y: IN(row.y), w: IN(i.w), h: 0, line: { color: hex('rule'), width: 0.75 } });
        slide.addText(row.label.toUpperCase(), { x: IN(i.x), y: IN(row.y + i.pad + Math.max(0, (vst.size - lst.size) * 0.6)), w: IN(i.labelW - 16), h: IN(lst.size * 1.4), margin: 0,
          fontFace: MONO, fontSize: PT(lst.size), color: hex('ink2'), charSpacing: PT(lst.size * lst.ls), valign: 'top', isTextBox: true });
        slide.addText(textRuns(row.value, vst, { ...fontFor(vst), fontSize: PT(vst.size), color: hex(row.accent ? 'signal' : 'ink') }),
          { x: IN(i.x + i.labelW), y: IN(row.y + i.pad), w: IN(i.w - i.labelW), h: IN(row.vh), margin: 0, valign: 'top', lineSpacing: PT(vst.size * vst.lh), isTextBox: true, fit: 'none' });
      }
      slide.addShape('line', { x: IN(i.x), y: IN(i.y + i.h), w: IN(i.w), h: 0, line: { color: hex('rule'), width: 0.75 } });
      return;
    }
    case 'table': {
      const { runs } = require('./layout');
      const st = S[i.cst];
      const border = [{ type: 'none' }, { type: 'none' }, { pt: 0.75, color: hex('rule') }, { type: 'none' }];
      const head = i.head.map(h => ({ text: h.toUpperCase(), options: { fontFace: MONO, fontSize: 7.5, color: hex('ink2'), charSpacing: 0.6, valign: 'middle',
        border: [{ type: 'none' }, { type: 'none' }, { pt: 1, color: hex('ink') }, { type: 'none' }] } }));
      const rows = i.rows.map(r => r.map((c, ci) => {
        const mono = ci === 0;
        const base = mono ? { fontFace: MONO, fontSize: 8.5, color: hex('ink2') } : { ...fontFor(st), fontSize: PT(st.size), color: hex('ink') };
        return { text: textRuns(runs(c), st, base), options: { valign: 'top', border } };
      }));
      slide.addTable([head, ...rows], {
        x: IN(i.x), y: IN(i.y), w: IN(i.w), colW: i.ws.map(IN), rowH: [IN(i.headH), ...i.rowHs.map(IN)],
        margin: [IN(12), IN(10), IN(12), IN(10)].map(v => v * 72), fontSize: PT(st.size), autoPage: false,
      });
      return;
    }
    case 'skills': {
      slide.addText('SKILL', { x: IN(i.x), y: IN(i.y + 12), w: IN(i.nameW), h: IN(24), margin: 0, fontFace: MONO, fontSize: 8, color: hex('ink2'), charSpacing: 0.6, isTextBox: true });
      i.cols.forEach((c, k) => slide.addText(c, { x: IN(i.x + i.nameW + k * i.colW), y: IN(i.y + 12), w: IN(i.colW), h: IN(24), margin: 0, align: 'center', fontFace: MONO, fontSize: 8, color: hex('ink'), isTextBox: true }));
      slide.addShape('line', { x: IN(i.x), y: IN(i.y + i.headH), w: IN(i.w), h: 0, line: { color: hex('ink'), width: 1 } });
      i.rows.forEach((row, ri) => {
        const y = i.y + i.headH + ri * i.rowH;
        if (ri) slide.addShape('line', { x: IN(i.x), y: IN(y), w: IN(i.w), h: 0, line: { color: hex('rule'), width: 0.75 } });
        slide.addText(row.name, { x: IN(i.x), y: IN(y + 12), w: IN(i.nameW), h: IN(30), margin: 0, fontFace: SANS_MED, fontSize: PT(22), color: hex('ink'), isTextBox: true, valign: 'top' });
        row.marks.forEach((m, k) => { if (m) mark(slide, i.x + i.nameW + k * i.colW + i.colW / 2 - 11, y + 16, 22, m); });
      });
      slide.addShape('line', { x: IN(i.x), y: IN(i.y + i.h), w: IN(i.w), h: 0, line: { color: hex('rule'), width: 0.75 } });
      return;
    }
  }
}

function mark(slide, x, y, s, kind) {
  slide.addShape('rect', { x: IN(x), y: IN(y), w: IN(s), h: IN(s), fill: kind === 'full' ? { color: hex('signal') } : { type: 'none' }, line: { color: hex('signal'), width: 1 } });
  if (kind === 'half') slide.addShape('rect', { x: IN(x), y: IN(y), w: IN(s / 2), h: IN(s), fill: { color: hex('signal') }, line: { type: 'none' } });
}

// which text item becomes the slide's title placeholder, per slide type
const TITLE_ROLE = { deep: 'headline', overview: 'title', story: 'title', gallery: 'title' };

async function buildPptx(slides, meta, site, outFile) {
  const pres = new PptxGenJS();
  pres.layout = 'LAYOUT_WIDE';
  pres.author = meta.name;
  pres.company = meta.name;
  pres.title = `${meta.name} — ${meta.title}`;
  pres.subject = meta.focus;
  pres.theme = { headFontFace: SANS, bodyFontFace: SANS };

  // one layout per title position, so every slide has a real title (outline view, screen readers)
  const titleBox = {};
  for (const sl of slides) {
    const role = TITLE_ROLE[sl.type];
    if (!role || titleBox[sl.type]) continue;
    const it = sl.items.find(x => x.k === 'text' && (x.role === role || (role === 'title' && ['h1'].includes(x.st))));
    if (it) titleBox[sl.type] = it;
  }
  const masters = {};
  for (const type of ['cover', 'summary', 'overview', 'story', 'gallery', 'deep', 'back']) {
    const name = `WK ${type}`;
    const objects = [];
    const t = titleBox[type];
    if (t) {
      const st = S[t.st];
      objects.push({ placeholder: { options: { name: 'title', type: 'title', x: IN(t.x), y: IN(t.y), w: IN(t.w), h: IN(t.h), margin: 0, valign: 'top',
        fontFace: st.weight >= 600 ? SANS : SANS_MED, bold: st.weight >= 600, fontSize: PT(st.size), color: hex('ink'), lineSpacing: PT(st.size * st.lh) }, text: '' } });
    }
    pres.defineSlideMaster({ title: name, background: { color: hex('paper') }, objects });
    masters[type] = name;
  }

  const sectionOf = sl => sl.appendix ? { A: 'A · FOC Motor Controller', B: 'B · AeroDesign Power System', C: 'C · Flight Controller SoM' }[sl.appendix] : (sl.type === 'back' ? 'Contact' : 'Two-minute read');
  let lastSection = null;
  for (const sl of slides) {
    const sec = sectionOf(sl);
    if (sec !== lastSection) { pres.addSection({ title: sec }); lastSection = sec; }
    const slide = pres.addSlide({ masterName: masters[sl.type], sectionTitle: sec });
    const role = TITLE_ROLE[sl.type];
    // overview/story/gallery titles are h1 text items without a role; tag them
    if (role === 'title') { const h = sl.items.find(x => x.k === 'text' && x.st === 'h1'); if (h) h.role = 'title'; }
    for (const it of sl.items) await draw(slide, it, { site, pageNo: sl.page, titleRole: role });
    slide.addNotes(`Page ${sl.page} · ${sl.appendix ? 'Appendix ' + sl.appendix + ' · ' : ''}${sl.section}`);
  }
  await pres.writeFile({ fileName: outFile });
  return outFile;
}

module.exports = { buildPptx };
