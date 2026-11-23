// The portfolio PDF: dusk/portfolio.pdf, published with the site at /portfolio.pdf.
//
//   npm run portfolio      prints it from content.js with headless Chromium
//
// Pages are written in content.js with the helpers below. Pictures live in assets/ (made by prep/,
// re-encoded so they carry no metadata). Scope captures are the scope's own screenshots, cropped to
// the graticule; their call-outs (assets/scopes.json, from prep/scope.py) are drawn here over the
// picture as vector lines and text, so the capture underneath stays untouched.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const ASSETS = path.join(__dirname, 'assets');
const PDF = path.join(ROOT, 'dusk', 'portfolio.pdf');
const SITE = 'https://weymenkoo.github.io/Personal-Site/';

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
   hline {y, text, side}      a level across the picture
   vline {x, text, at}        an instant
   call  {x, y, lx, ly, text} a point with a leader to its label
   span  {x0, x1, y, text}    a duration
   label {x, y, text}         text alone
   box   {x0, y0, x1, y1, text, pos}  a region (layouts)            */
const COL = { mark: '#FFB547', bad: '#FF6B5E', good: '#7BE08A', dim: '#D8D0C4', box: '#F4EDE2' };
function overlay(w, h, marks) {
  const pc = (v, of) => (100 * v / of).toFixed(2) + '%';
  const svg = [], html = [];
  const lab = (x, y, text, c, cls, style = '') =>
    html.push(`<span class="lab ${cls}" style="left:${pc(x, w)};top:${pc(y, h)};color:${COL[c] || COL.mark};${style}">${esc(text)}</span>`);
  const stroke = c => `stroke="${COL[c] || COL.mark}"`;
  for (const m of marks) {
    const c = m.c || (m.t === 'box' ? 'box' : 'mark');
    if (m.t === 'hline') {
      svg.push(`<line x1="0" x2="${w}" y1="${m.y}" y2="${m.y}" ${stroke(c)} ${m.dash !== false ? 'stroke-dasharray="5 4"' : ''}/>`);
      if (m.side === 'l') lab(w * 0.045, m.y, m.text, c, 'above');
      else html.push(`<span class="lab above" style="right:6%;top:${pc(m.y, h)};color:${COL[c]}">${esc(m.text)}</span>`);
    } else if (m.t === 'vline') {
      svg.push(`<line y1="0" y2="${h}" x1="${m.x}" x2="${m.x}" ${stroke(c)} stroke-dasharray="5 4"/>`);
      if (m.al === 'end') lab(m.x - w * 0.008, h * m.at, m.text, c, 'mid end');
      else lab(m.x + w * 0.008, h * m.at, m.text, c, 'mid');
    } else if (m.t === 'call') {
      svg.push(`<line x1="${m.x}" y1="${m.y}" x2="${m.lx}" y2="${m.ly}" ${stroke(c)}/>`,
        `<circle cx="${m.x}" cy="${m.y}" r="${w * 0.0055}" fill="none" ${stroke(c)}/>`);
      const left = m.al ? m.al === 'end' : m.lx < m.x;
      lab(m.lx + (left ? -1 : 1) * w * 0.004, m.ly, m.text, c, left ? 'mid end' : 'mid');
    } else if (m.t === 'span') {
      const t = w * 0.008;
      svg.push(`<line x1="${m.x0}" x2="${m.x1}" y1="${m.y}" y2="${m.y}" ${stroke(c)}/>`,
        `<line x1="${m.x0}" x2="${m.x0}" y1="${m.y - t}" y2="${m.y + t}" ${stroke(c)}/>`,
        `<line x1="${m.x1}" x2="${m.x1}" y1="${m.y - t}" y2="${m.y + t}" ${stroke(c)}/>`);
      lab((m.x0 + m.x1) / 2, m.y - t * 0.6, m.text, c, 'above centre');
    } else if (m.t === 'label') {
      lab(m.x, m.y, m.text, c, m.anchor === 'end' ? 'mid end' : 'mid');
    } else if (m.t === 'box') {
      svg.push(`<rect x="${m.x0}" y="${m.y0}" width="${m.x1 - m.x0}" height="${m.y1 - m.y0}" rx="${w * 0.006}" fill="none" ${stroke(c)} stroke-dasharray="6 4"/>`);
      const p = m.pos || 'tl';
      const x = p.includes('r') ? m.x1 : m.x0, y = p.includes('b') ? m.y1 : m.y0;
      lab(x, y, m.text, c, `box ${p}`);
    }
  }
  return `<svg class="ov" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${svg.join('')}</svg>${html.join('')}`;
}

/* ---------- helpers for content.js ---------- */
// fig(key, caption, {marks, fit:'cover', h:'2.4in', pos})
function fig(key, cap = '', o = {}) {
  const file = asset(key), [w, h] = dims(file);
  const box = o.h ? `height:${o.h}` : `aspect-ratio:${w}/${h}`;
  return `<figure class="fig ${o.cls || ''}" style="${o.style || ''}">
  <div class="ph" style="${box}"><img src="${uri(file)}" style="object-fit:${o.fit || 'cover'};object-position:${o.pos || 'center'}" alt="">${o.marks ? overlay(w, h, o.marks) : ''}</div>
  ${cap ? `<figcaption>${cap}</figcaption>` : ''}</figure>`;
}

const SCOPES = JSON.parse(fs.readFileSync(path.join(ASSETS, 'scopes.json'), 'utf8'));
used.add('scopes.json');
const CH = { 1: '#E8D44D', 2: '#3FD0D8', 3: '#E04FD8', 4: '#3D7BFF' };
// scope(key, extra caption)
function scope(key, extra = '') {
  const s = SCOPES[key];
  if (!s) throw new Error('no scope ' + key);
  const file = path.join(ASSETS, s.src);
  return `<figure class="fig scope">
  <div class="ph" style="aspect-ratio:${s.w}/${s.h}"><img src="${uri(file)}" alt="">${overlay(s.w, s.h, s.marks)}</div>
  <figcaption><b>${esc(s.title)}</b>${extra ? ' ' + extra : ''}
  <span class="legend">${s.legend.map(([n, name, sc]) => `<i style="background:${CH[n]}"></i>${esc(name)} <em>${esc(sc)}</em>`).join('')}</span>
  <span class="note">${esc(s.note)}</span></figcaption></figure>`;
}

const stats = list => `<div class="stats">${list.map(([v, l]) => `<div><b>${v}</b><span>${l}</span></div>`).join('')}</div>`;
const table = (rows, head) => `<table>${head ? `<tr>${head.map(h => `<th>${h}</th>`).join('')}</tr>` : ''}${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</table>`;

// page(section, title, body, {spec, no})
function page(sec, title, body, o = {}) {
  return `<section class="page ${o.cls || ''}">
  <header><span class="sec">${sec}</span><span class="pg"></span></header>
  ${title ? `<h2>${title}</h2>` : ''}${o.spec ? `<p class="spec">${o.spec}</p>` : ''}
  <div class="body">${body}</div>
  <footer><span>Weymen Koo · Portfolio</span><span class="pn"></span></footer>
</section>`;
}

/* ---------- document ---------- */
function html() {
  const content = require('./content')({ fig, scope, stats, table, page, esc, SITE });
  const font = f => 'data:font/woff2;base64,' + fs.readFileSync(path.join(__dirname, 'fonts', f)).toString('base64');
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Weymen Koo — Portfolio</title><style>
@font-face{font-family:Literata;src:url(${font('literata-latin-opsz-normal.woff2')}) format("woff2");font-weight:200 900;font-style:normal}
@font-face{font-family:Literata;src:url(${font('literata-latin-opsz-italic.woff2')}) format("woff2");font-weight:200 900;font-style:italic}
@font-face{font-family:"IBM Plex Mono";src:url(${font('ibm-plex-mono-latin-400-normal.woff2')}) format("woff2");font-weight:400}
@font-face{font-family:"IBM Plex Mono";src:url(${font('ibm-plex-mono-latin-600-normal.woff2')}) format("woff2");font-weight:600}
@page{size:11in 8.5in;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
body{color:#2A2118;font-family:Literata,Georgia,serif;font-size:9.5pt;line-height:1.45;-webkit-print-color-adjust:exact;print-color-adjust:exact;counter-reset:pg}
a{color:inherit;text-decoration:none}
b,strong{font-weight:650}
.page{width:11in;height:8.5in;padding:.45in .55in .4in;display:flex;flex-direction:column;break-after:page;position:relative;overflow:hidden;counter-increment:pg}
.page:last-child{break-after:auto}
header,footer,.spec,.mono,figcaption,.stats span,table,.lab,.kicker{font-family:"IBM Plex Mono",monospace}
header{display:flex;justify-content:space-between;font-size:7.5pt;letter-spacing:.12em;text-transform:uppercase;color:#6E5E4E;border-bottom:1px solid #D9C8B4;padding-bottom:.08in}
header .sec b{color:#C8742E;font-weight:600}
footer{margin-top:auto;display:flex;justify-content:space-between;font-size:7pt;letter-spacing:.12em;text-transform:uppercase;color:#8A7A6A;border-top:1px solid #D9C8B4;padding-top:.08in}
footer .pn::after{content:counter(pg)}
h2{font-size:21pt;font-weight:600;letter-spacing:-.01em;line-height:1.1;margin-top:.14in}
h3{font-size:10.5pt;font-weight:650;margin:.1in 0 .03in}
h3:first-child{margin-top:0}
.spec{font-size:8.5pt;color:#C8742E;margin-top:.05in}
.body{flex:1;min-height:0;margin-top:.16in;margin-bottom:.12in}
p+p{margin-top:.06in}
ul{padding-left:1.05em}
li{margin:.02in 0}
li::marker{color:#C8742E}
.kicker{font-size:7pt;letter-spacing:.14em;text-transform:uppercase;color:#C8742E;margin-bottom:.04in}
.cols{display:grid;gap:.22in;height:100%;min-height:0}
.stack{display:flex;flex-direction:column;gap:.13in;min-height:0}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:.14in .2in}
.fig{min-width:0}
.ph{position:relative;width:100%;border-radius:3px;overflow:hidden;background:#141518}
.ph img{width:100%;height:100%;display:block}
.ov{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.ov *{vector-effect:non-scaling-stroke;stroke-width:.9}
figcaption{font-size:6.8pt;line-height:1.45;color:#6E5E4E;margin-top:.045in}
figcaption b{color:#2A2118;font-weight:600}
.scope figcaption .legend{display:block;margin-top:.02in;color:#2A2118}
.legend i{display:inline-block;width:.6em;height:.6em;border-radius:1px;margin:0 .35em 0 0;vertical-align:-.02em}
.legend em{font-style:normal;color:#8A7A6A;margin-right:1.1em}
.note{display:block;color:#8A7A6A}
.lab{position:absolute;font-size:6.1pt;line-height:1.25;white-space:nowrap;background:rgba(14,14,16,.78);padding:.1em .35em;border-radius:2px}
.lab.mid{transform:translateY(-50%)}
.lab.mid.end{transform:translate(-100%,-50%)}
.lab.above{transform:translateY(-118%)}
.lab.above.centre{transform:translate(-50%,-112%)}
.lab.box{font-size:6.4pt;color:#F4EDE2!important;background:rgba(14,14,16,.85)}
.lab.box.tl{transform:translate(0,-110%)}
.lab.box.bl{transform:translate(0,10%)}
.lab.box.tr{transform:translate(-100%,-110%)}
.lab.box.br{transform:translate(-100%,10%)}
.stats{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:.12in}
.stats div{border-top:2px solid #C8742E;padding-top:.05in}
.stats b{display:block;font-family:Literata,serif;font-size:17pt;font-weight:600;line-height:1.1}
.stats span{display:block;font-size:6.8pt;line-height:1.35;color:#6E5E4E;margin-top:.02in}
table{border-collapse:collapse;width:100%;font-size:7pt;line-height:1.35}
th{text-align:left;font-weight:600;color:#6E5E4E;border-bottom:1px solid #C9B8A4;padding:.03in .06in .03in 0}
td{border-bottom:1px solid #E6D9C9;padding:.03in .06in .03in 0;vertical-align:top}
td:first-child{white-space:nowrap}
.tag{display:inline-block;font-family:"IBM Plex Mono",monospace;font-size:6.3pt;letter-spacing:.06em;text-transform:uppercase;padding:.01in .05in;border-radius:2px;color:#fff;background:#B8433A}
.tag.mod{background:#C8742E}.tag.min{background:#8A7A6A}.tag.ok{background:#3E8A58}
.small{font-size:8.3pt}
.muted{color:#6E5E4E}
.cover{padding:.7in .8in .5in}
.cover h1{font-size:50pt;font-weight:600;line-height:1}
.cover .cjk{font-family:"PingFang SC","Noto Sans SC","Noto Sans CJK SC","Microsoft YaHei",sans-serif;font-size:18pt;color:#6E5E4E;margin-top:.12in}
.cover .lede{font-size:13pt;line-height:1.5;max-width:6.4in;margin-top:.3in}
.toc{margin-top:.35in;display:grid;grid-template-columns:repeat(3,1fr);gap:.25in}
.toc h4{font-family:"IBM Plex Mono",monospace;font-size:7.5pt;letter-spacing:.14em;text-transform:uppercase;color:#C8742E;font-weight:600;border-bottom:1px solid #D9C8B4;padding-bottom:.05in;margin-bottom:.07in}
.toc li{list-style:none;font-size:10.5pt;line-height:1.35;margin-bottom:.07in}
.toc li span{display:block;font-family:"IBM Plex Mono",monospace;font-size:7pt;color:#8A7A6A}
.toc ul{padding:0}
.strip{display:grid;grid-template-columns:repeat(4,1fr);gap:.14in;margin-top:.4in}
.cover .meta{font-family:"IBM Plex Mono",monospace;font-size:8.5pt;letter-spacing:.04em;color:#6E5E4E;margin-top:auto;line-height:1.8}
</style></head><body>${content.join('')}</body></html>`;
}

async function writePdf() {
  const { chromium } = require('@playwright/test');
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const page = await browser.newPage();
  await page.setContent(html(), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  // nothing may spill out of a page
  const over = await page.evaluate(() => [...document.querySelectorAll('.page')].map((p, i) => {
    const b = p.querySelector('.body'); return b && b.scrollHeight > b.clientHeight + 2 ? i + 1 : 0;
  }).filter(Boolean));
  if (over.length) console.warn('content overflows on page(s)', over.join(', '));
  await page.pdf({ path: PDF, width: '11in', height: '8.5in', printBackground: true });
  await browser.close();
  const unused = fs.readdirSync(ASSETS).filter(f => !used.has(f));
  if (unused.length) console.warn('assets not used:', unused.join(', '));
}

if (require.main === module) {
  writePdf().then(() => console.log('dusk/portfolio.pdf written')).catch(e => { console.error(e); process.exit(1); });
}

module.exports = { html, PDF, ASSETS, SCOPES, used };
