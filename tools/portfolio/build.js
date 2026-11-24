// The portfolio PDF: dusk/portfolio.pdf, published with the site at /portfolio.pdf.
//
//   npm run portfolio      prints it from content.js with headless Chromium
//
// One grid for every page: three columns, two rows. Every picture sits in a 4:3 frame, in one of two
// sizes: a cell (one column) or a hero (two columns, two rows, with its text under it). Pictures are
// made to 4:3 beforehand by prep/ (never cropped here: the build fails if one is not 4:3), and
// re-encoded so they carry no metadata.
//
// Scope captures are the scope's own screenshots, whole. Their call-outs (assets/scopes.json, from
// prep/scope.py) are drawn here over the picture as vector lines and text.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const ASSETS = path.join(__dirname, 'assets');
const PDF = path.join(ROOT, 'dusk', 'portfolio.pdf');

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ---------- pictures ---------- */
function asset(key) {
  for (const ext of ['.jpg', '.png']) {
    const f = path.join(ASSETS, key + ext);
    if (fs.existsSync(f)) return f;
  }
  throw new Error('no asset ' + key);
}
function dims(file) {
  const b = fs.readFileSync(file);
  if (b.toString('ascii', 1, 4) === 'PNG') return [b.readUInt32BE(16), b.readUInt32BE(20)];
  for (let i = 2; i < b.length - 9;) {
    if (b[i] !== 0xff) { i++; continue; }
    const m = b[i + 1];
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
    if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }
    i += 2 + b.readUInt16BE(i + 2);
  }
  throw new Error('no size for ' + file);
}
const used = new Set();
function uri(file) {
  used.add(path.basename(file));
  const mime = file.endsWith('.png') ? 'image/png' : 'image/jpeg';
  return `data:${mime};base64,` + fs.readFileSync(file).toString('base64');
}

/* ---------- call-outs over a picture ----------
   marks are in the picture's own pixels:
   hline {y, text, side}          a level
   call  {x, y, lx, ly, text}     a point with a leader to its label
   span  {x0, x1, y, text}        a duration
   label {x, y, text}             text alone
   num   {x, y, lx, ly, n}        a numbered marker with a leader (layouts; the key is in the text)
   tag   {x, y, text}             a small centred title (layouts) */
const COL = { mark: '#FFB547', bad: '#FF6B5E', good: '#7BE08A', dim: '#D8D0C4', ink: '#241a4a' };
function overlay(w, h, marks) {
  const pc = (v, of) => (100 * v / of).toFixed(2) + '%';
  const svg = [], html = [];
  const lab = (x, y, text, c, cls) =>
    html.push(`<span class="lab ${cls}" style="left:${pc(x, w)};top:${pc(y, h)};color:${COL[c] || COL.mark}">${esc(text)}</span>`);
  const stroke = c => `stroke="${COL[c] || COL.mark}"`;
  for (const m of marks) {
    const c = m.c || 'mark';
    if (m.t === 'hline') {
      const xr = m.xmax || w;
      svg.push(`<line x1="12" x2="${xr}" y1="${m.y}" y2="${m.y}" ${stroke(c)} stroke-dasharray="5 4"/>`);
      if (m.side === 'l') lab(w * 0.075, m.y, m.text, c, 'above');
      else lab(xr - w * 0.01, m.y, m.text, c, 'above end');
    } else if (m.t === 'call') {
      svg.push(`<line x1="${m.x}" y1="${m.y}" x2="${m.lx}" y2="${m.ly}" ${stroke(c)}/>`,
        `<circle cx="${m.x}" cy="${m.y}" r="${w * 0.006}" fill="none" ${stroke(c)}/>`);
      const left = m.al ? m.al === 'end' : m.lx < m.x;
      lab(m.lx + (left ? -1 : 1) * w * 0.004, m.ly, m.text, c, left ? 'mid end' : 'mid');
    } else if (m.t === 'span') {
      const t = w * 0.009;
      svg.push(`<line x1="${m.x0}" x2="${m.x1}" y1="${m.y}" y2="${m.y}" ${stroke(c)}/>`,
        `<line x1="${m.x0}" x2="${m.x0}" y1="${m.y - t}" y2="${m.y + t}" ${stroke(c)}/>`,
        `<line x1="${m.x1}" x2="${m.x1}" y1="${m.y - t}" y2="${m.y + t}" ${stroke(c)}/>`);
      lab((m.x0 + m.x1) / 2, m.y - t * 0.6, m.text, c, 'above centre');
    } else if (m.t === 'label') {
      lab(m.x, m.y, m.text, c, m.anchor === 'end' ? 'mid end' : m.anchor === 'middle' ? 'mid centre' : 'mid');
    } else if (m.t === 'num') {
      svg.push(`<line x1="${m.x}" y1="${m.y}" x2="${m.lx}" y2="${m.ly}" stroke="${COL.ink}" class="thick"/>`,
        `<circle cx="${m.x}" cy="${m.y}" r="${w * 0.004}" fill="${COL.ink}" stroke="none"/>`);
      html.push(`<span class="num" style="left:${pc(m.lx, w)};top:${pc(m.ly, h)}">${m.n}</span>`);
    } else if (m.t === 'tag') {
      html.push(`<span class="tagl" style="left:${pc(m.x, w)};top:${pc(m.y, h)}">${esc(m.text)}</span>`);
    }
  }
  return `<svg class="ov" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${svg.join('')}</svg>${html.join('')}`;
}

/* ---------- cells ---------- */
function frame(key, marks, extra = '') {
  const file = asset(key), [w, h] = dims(file);
  if (Math.abs(w / h - 4 / 3) > 0.01) throw new Error(`${key} is ${w}x${h}: every picture must be 4:3 (see prep/assets.py)`);
  return `<div class="frame"><img src="${uri(file)}" alt="">${marks ? overlay(w, h, marks) : ''}${extra}</div>`;
}
const cap = (title, text) => `<div class="cap"><b>${title}</b>${text ? ` ${text}` : ''}</div>`;

// a picture in a 4:3 frame with its caption
const fig = (key, title, text, o = {}) => `<div class="cell">${frame(key, o.marks, o.extra)}${cap(title, text)}</div>`;

const SCOPES = JSON.parse(fs.readFileSync(path.join(ASSETS, 'scopes.json'), 'utf8'));
const LAYOUTS = JSON.parse(fs.readFileSync(path.join(ASSETS, 'layouts.json'), 'utf8'));
used.add('scopes.json'); used.add('layouts.json');
const CH = { 1: '#E8D44D', 2: '#3FD0D8', 3: '#E04FD8', 4: '#4C86FF' };

// a scope capture: the whole screenshot, with a strip under it (inside the same 4:3 frame) naming the channels
function scope(key, text) {
  const s = SCOPES[key];
  if (!s) throw new Error('no scope ' + key);
  const file = path.join(ASSETS, s.src);
  return `<div class="cell"><div class="frame scope">
  <div class="shot"><img src="${uri(file)}" alt="">${overlay(s.w, s.h, s.marks)}</div>
  <div class="strip"><span class="chs">${s.legend.map(([n, name]) => `<span><i style="background:${CH[n]}"></i>${esc(name)}</span>`).join('')}</span><span class="cond">${esc(s.note)}</span></div>
</div>${cap(esc(s.title), text)}</div>`;
}

// a layout plot with numbered call-outs. nums: [n, board, x mm, y mm, dx px, dy px]; tags: [board, text]
function layoutMarks(key, nums, tags = []) {
  const L = LAYOUTS[key];
  const px = (b, x, y) => [(L.boards[b].mirror ? L.boards[b].ox - x : x - L.boards[b].ox) * L.boards[b].s, (L.boards[b].oy - y) * L.boards[b].s];
  const marks = nums.map(([n, b, x, y, dx, dy]) => { const [X, Y] = px(b, x, y); return { t: 'num', n, x: X, y: Y, lx: X + dx, ly: Y + dy }; });
  for (const [b, t] of tags) marks.push({ t: 'tag', x: (L.boards[b].x0 + L.boards[b].x1) / 2, y: L.boards[b].y1 + L.h * 0.012, text: t });
  return marks;
}
const LEGEND = `<div class="legend"><span><i style="background:#D63E34"></i>top copper</span><span><i style="background:#3A62E6"></i>bottom copper</span><span><i style="background:#96461E"></i>exposed pads</span><span><i style="background:#241a4a"></i>silkscreen</span></div>`;

const text = html => `<div class="cell text">${html}</div>`;
const table = (rows, head) => `<table>${head ? `<tr>${head.map(h => `<th>${h}</th>`).join('')}</tr>` : ''}${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</table>`;
const stats = list => `<div class="stats wide">${list.map(([v, l]) => `<div><b>${v}</b><span>${l}</span></div>`).join('')}</div>`;
const key = items => `<ol class="key">${items.map((t, i) => `<li><i>${i + 1}</i><span>${t}</span></li>`).join('')}</ol>`;
const kicker = t => `<div class="kicker">${t}</div>`;

/* ---------- pages ---------- */
function page(sec, title, spec, body, cls = '') {
  return `<section class="page ${cls}">
  <header><span class="sec">${sec}</span><span class="who">Weymen Koo · Portfolio · <span class="pn"></span></span></header>
  ${title ? `<h2>${title}</h2><p class="spec">${spec || '&nbsp;'}</p>` : ''}
  <div class="grid">${body}</div>
</section>`;
}
// six cells
const grid = (sec, title, spec, cells) => {
  if (cells.length !== 6) throw new Error(`${title}: a grid page takes 6 cells, got ${cells.length}`);
  return page(sec, title, spec, cells.join(''));
};
// a hero (2 x 2) with text under it, and two cells in the right column
const hero = (sec, title, spec, key_, o, under, right) => {
  if (right.length !== 2) throw new Error(`${title}: a hero page takes 2 cells on the right`);
  return page(sec, title, spec, `<div class="cell hero">${frame(key_, o.marks, o.extra)}<div class="under">${under}</div></div>${right.join('')}`);
};

function html() {
  const content = require('./content')({ fig, scope, text, table, stats, key, kicker, grid, hero, page, layoutMarks, LEGEND, frame, cap, esc });
  const font = f => 'data:font/woff2;base64,' + fs.readFileSync(path.join(__dirname, 'fonts', f)).toString('base64');
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Weymen Koo — Hardware portfolio</title><style>
@font-face{font-family:JBM;src:url(${font('JetBrainsMono-Regular.woff2')}) format("woff2");font-weight:400;font-style:normal}
@font-face{font-family:JBM;src:url(${font('JetBrainsMono-Italic.woff2')}) format("woff2");font-weight:400;font-style:italic}
@font-face{font-family:JBM;src:url(${font('JetBrainsMono-Bold.woff2')}) format("woff2");font-weight:700;font-style:normal}
@font-face{font-family:JBM;src:url(${font('JetBrainsMono-ExtraBold.woff2')}) format("woff2");font-weight:800;font-style:normal}
@font-face{font-family:JBM;src:url(${font('JetBrainsMono-ExtraBoldItalic.woff2')}) format("woff2");font-weight:800;font-style:italic}
@page{size:11in 8.5in;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
body{color:#241a4a;font-family:JBM,"JetBrains Mono",monospace;font-variant-ligatures:none;font-size:7.9pt;line-height:1.42;
  -webkit-print-color-adjust:exact;print-color-adjust:exact;counter-reset:pg}
a{color:inherit;text-decoration:none}
b{font-weight:700}
.page{width:11in;height:8.5in;padding:.38in .42in .34in;display:flex;flex-direction:column;break-after:page;overflow:hidden;counter-increment:pg}
.page:last-child{break-after:auto}
header{display:flex;justify-content:space-between;font-size:6.6pt;letter-spacing:.1em;text-transform:uppercase;color:#5f5486;border-bottom:1px solid #cfc5df;padding-bottom:.07in}
header .sec b{color:#0a6f83}
h2{font-size:17pt;font-weight:800;font-style:italic;letter-spacing:-.02em;line-height:1.1;margin-top:.13in}
.spec{font-size:7.7pt;color:#0a6f83;margin-top:.045in}
.grid{flex:1;min-height:0;margin-top:.14in;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-template-rows:repeat(2,minmax(0,1fr));gap:.16in .2in}
.cell{min-width:0;min-height:0;display:flex;flex-direction:column}
.hero{grid-column:1/3;grid-row:1/3}
.frame{position:relative;width:100%;aspect-ratio:4/3;flex:none;overflow:hidden;border-radius:2px;background:#101113}
.frame>img,.shot>img{display:block;width:100%;height:100%}
.shot{position:relative;width:100%;aspect-ratio:1024/600}
.strip{position:absolute;left:0;right:0;bottom:0;top:78.125%;background:#101113;color:#E9E4DC;display:flex;flex-direction:column;justify-content:center;gap:.025in;padding:0 .09in;font-size:6.3pt;line-height:1.25;overflow:hidden}
.strip i{display:inline-block;width:.62em;height:.62em;border-radius:1px;margin:0 .4em 0 0}
.strip .chs{display:flex;flex-wrap:wrap;gap:0 1.1em}
.strip .cond{color:#A39A8E}
.ov{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.ov *{vector-effect:non-scaling-stroke;stroke-width:.8}
.ov .thick{stroke-width:.9}
.lab{position:absolute;font-size:5.9pt;line-height:1.2;white-space:nowrap;background:rgba(12,12,14,.82);padding:.12em .4em;border-radius:1.5px}
.lab.mid{transform:translateY(-50%)}
.lab.mid.end{transform:translate(-100%,-50%)}
.lab.mid.centre{transform:translate(-50%,-50%)}
.lab.above{transform:translateY(-120%)}
.lab.above.end{transform:translate(-100%,-120%)}
.lab.above.centre{transform:translate(-50%,-115%)}
.num{position:absolute;transform:translate(-50%,-50%);width:1.75em;height:1.75em;border-radius:50%;background:#241a4a;color:#fff;font-weight:700;font-size:7.6pt;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 1.2px #fff}
.tagl{position:absolute;transform:translateX(-50%);font-size:6.6pt;letter-spacing:.1em;text-transform:uppercase;color:#5f5486;white-space:nowrap}
.legend{position:absolute;left:2.2%;bottom:2.4%;display:flex;gap:1.3em;font-size:6.3pt;color:#4c3f80}
.legend i{display:inline-block;width:.7em;height:.7em;border-radius:1px;margin-right:.45em}
.cap{flex:1;min-height:0;overflow:hidden;font-size:7.1pt;line-height:1.42;color:#4c3f80;padding-top:.06in}
.cap b{color:#241a4a;display:block;font-size:8pt;font-weight:800;font-style:italic;margin-bottom:.015in}
.under{flex:1;min-height:0;overflow:hidden;padding-top:.11in;display:grid;grid-template-columns:1fr 1fr;gap:.1in .22in;align-content:start}
.under .wide{grid-column:1/3}
.text{overflow:hidden;gap:.1in;border-top:2px solid #241a4a;padding-top:.08in}
.kicker{font-size:6.7pt;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#0a6f83;margin-bottom:.03in}
p+p{margin-top:.05in}
ul{list-style:none}
ul li{padding-left:1em;text-indent:-1em;margin:.025in 0}
ul li::before{content:"– ";color:#0a6f83}
table{border-collapse:collapse;width:100%;font-size:7.3pt;line-height:1.36}
th{text-align:left;font-weight:700;color:#5f5486;border-bottom:1px solid #c4b8d8;padding:.025in .08in .025in 0}
td{border-bottom:1px solid #ddd3ec;padding:.027in .08in .027in 0;vertical-align:top}
td:first-child{white-space:nowrap;color:#5f5486}
td:last-child,th:last-child{padding-right:0}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:.14in}
.stats div{border-top:2px solid #0a6f83;padding-top:.04in}
.stats b{display:block;font-size:14pt;font-weight:800;letter-spacing:-.03em;line-height:1.15}
.stats span{display:block;font-size:6.7pt;line-height:1.35;color:#4c3f80;margin-top:.015in}
.key{list-style:none;columns:2;column-gap:.22in;grid-column:1/3;font-size:7.4pt;line-height:1.35}
.key li{display:flex;gap:.07in;align-items:flex-start;break-inside:avoid;margin-bottom:.05in}
.key i{flex:none;font-style:normal;width:1.6em;height:1.6em;border-radius:50%;background:#241a4a;color:#fff;font-weight:700;font-size:6.4pt;display:flex;align-items:center;justify-content:center;margin-top:-.01in}
.muted{color:#5f5486}
.cover .grid{margin-top:.2in}
.cover .text{border-top:none;padding-top:0;grid-row:1/3;gap:0}
.cover .name{font-size:31pt;font-weight:800;font-style:italic;letter-spacing:-.04em;line-height:1}
.cover .cjk{font-family:"PingFang SC","Noto Sans SC","Noto Sans CJK SC","Microsoft YaHei",sans-serif;font-size:13pt;color:#5f5486;margin-top:.08in}
.cover .lede{font-size:8.6pt;line-height:1.5;margin-top:.22in}
.cover .toc{margin-top:.22in}
.cover .toc td{font-size:7.6pt;padding:.045in .08in .045in 0}
.cover .toc td:first-child{color:#0a6f83;font-weight:700}
.cover .contact{margin-top:auto;font-size:7.9pt;line-height:1.7;color:#4c3f80}
</style></head><body>${content.join('')}</body></html>`;
}

async function writePdf() {
  const { chromium } = require('@playwright/test');
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const page_ = await browser.newPage();
  await page_.setContent(html(), { waitUntil: 'load' });
  await page_.evaluate(() => document.fonts.ready);
  // page numbers as n / total
  await page_.evaluate(() => { const ps = [...document.querySelectorAll('.page')];
    ps.forEach((p, i) => p.querySelectorAll('.pn').forEach(e => { e.textContent = `${i + 1} / ${ps.length}`; })); });
  // no text block may be clipped
  const over = await page_.evaluate(() => [...document.querySelectorAll('.page')].flatMap((p, i) =>
    [...p.querySelectorAll('.cap,.under,.text,.strip')].filter(b => b.scrollHeight > b.clientHeight + 1 || b.scrollWidth > b.clientWidth + 1)
      .map(b => `p${i + 1} ${b.className} "${b.textContent.trim().slice(0, 28)}" +${b.scrollHeight - b.clientHeight}px`)));
  if (over.length) console.warn('TEXT CLIPPED:\n  ' + over.join('\n  '));
  await page_.pdf({ path: PDF, width: '11in', height: '8.5in', printBackground: true });
  await browser.close();
  const unused = fs.readdirSync(ASSETS).filter(f => !used.has(f));
  if (unused.length) console.warn('assets not used:', unused.join(', '));
  console.log(`dusk/portfolio.pdf written, ${(fs.statSync(PDF).size / 1e6).toFixed(2)} MB`);
  return over;
}

if (require.main === module) {
  writePdf().catch(e => { console.error(e); process.exit(1); });
}

module.exports = { html, writePdf, PDF, ASSETS, SCOPES, used };
