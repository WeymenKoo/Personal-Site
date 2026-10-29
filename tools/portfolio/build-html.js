// Renders the laid-out slides to dusk/portfolio/index.html.
// Desktop: every slide is a 16:9 artboard; positions are in artboard px and
// scale with the slide through the --k unit (1 artboard px = 100cqw / 1920).
// Phones: the same elements, in the same order, flow as a normal page.
const fs = require('fs');
const path = require('path');
const T = require('./tokens');
const { S } = require('./layout');

const SITE = path.join(__dirname, '../../dusk/portfolio');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r = n => Math.round(n * 10) / 10;
const box = i => `--x:${r(i.x)};--y:${r(i.y)};--w:${r(i.w)};--h:${r(i.h)}`;

function runsHtml(runs, o = {}) {
  return runs.map((x, idx) => {
    let t = esc(x.t).replace(/\n/g, '<br>');
    if (o.slash && idx === 0 && t.startsWith('/')) t = `<span class="sl">/</span>` + t.slice(1);
    return x.todo ? `<mark class="todo">${t}</mark>` : t;
  }).join('');
}

const svgCache = {};
let svgN = 0;
function inlineSvg(src) {
  const name = path.basename(src, '.svg');
  if (!svgCache[src]) {
    let s = fs.readFileSync(path.join(SITE, src), 'utf8');
    svgCache[src] = s.replace(/<\?xml[^>]*>/, '').replace(/\swidth="[\d.]+"\sheight="[\d.]+"/, '').trim();
  }
  // marker ids must be unique once a figure appears more than once on the page
  const k = `${name}-${++svgN}`;
  return svgCache[src].replace(/id="(ar|arb)"/g, `id="$1-${k}"`).replace(/url\(#(ar|arb)\)/g, `url(#$1-${k})`);
}

function item(i) {
  switch (i.k) {
    case 'text': {
      const cls = ['t', `st-${i.st}`, i.align && `al-${i.align}`, i.color && `c-${i.color}`, i.role && `r-${i.role}`].filter(Boolean).join(' ');
      const inner = runsHtml(i.s, { slash: i.role === 'crumb' });
      const tag = i.st === 'h1' || i.st === 'name' ? 'h2' : i.st === 'h2' ? 'h3' : 'p';
      const body = i.href ? `<a href="${i.href}">${inner}</a>` : inner;
      const slashC = i.slashColor ? ` data-slash="${i.slashColor}"` : '';
      const lang = i.st === 'cjk' ? ' lang="zh-Hans"' : '';
      return `<${tag} class="${cls}" style="${box(i)}"${slashC}${lang}>${body}</${tag}>`;
    }
    case 'status':
      return `<p class="t st-label status${i.color ? ' c-' + i.color : ''}" style="${box(i)}"><i class="dot ${i.status}"></i>${runsHtml(i.s)}</p>`;
    case 'img':
      return `<figure class="fig img fit-${i.fit}" style="${box(i)}"><button class="zoom" data-full="${i.src}" aria-label="Enlarge: ${esc(i.alt)}"><img src="${i.src}" alt="${esc(i.alt)}" width="${i.iw}" height="${i.ih}" loading="lazy" decoding="async"></button></figure>`;
    case 'svg':
      return `<figure class="fig svg" style="${box(i)}">${inlineSvg(i.src, i.alt)}</figure>`;
    case 'ph':
      return `<div class="ph" style="${box(i)}"><span>Figure to add</span><b>${esc(i.label)}</b></div>`;
    case 'rect':
      return `<div class="rect f-${i.fill || 'none'} s-${i.stroke || 'none'}" style="${box(i)}"></div>`;
    case 'specs': {
      const rows = i.rows.map(row => `<div class="row${row.accent ? ' acc' : ''}" style="--ry:${r(row.y - i.y)};--rh:${r(row.h)}"><dt>${esc(row.label)}</dt><dd class="st-${i.vst}">${runsHtml(row.value)}</dd></div>`).join('');
      return `<dl class="specs" style="${box(i)};--lw:${i.labelW};--pad:${i.pad}">${rows}</dl>`;
    }
    case 'table': {
      const cols = i.ws.map(w => `<col style="--cw:${w}">`).join('');
      const head = i.head.map(h => `<th>${esc(h)}</th>`).join('');
      const rows = i.rows.map((row, ri) => `<tr style="--rh:${r(i.rowHs[ri])}">${row.map(c => `<td>${runsHtml(require('./layout').runs(c))}</td>`).join('')}</tr>`).join('');
      return `<div class="tbl" style="${box(i)};--hh:${i.headH}"><table class="st-${i.cst}"><colgroup>${cols}</colgroup><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
    }
    case 'skills': {
      const mark = m => m ? `<i class="mk ${m}" title="${m === 'full' ? 'core' : 'partial'}"></i>` : '';
      const head = `<tr><th>Skill</th>${i.cols.map(c => `<th>${c}</th>`).join('')}</tr>`;
      const rows = i.rows.map(row => `<tr><td>${esc(row.name)}</td>${row.marks.map(m => `<td>${mark(m)}</td>`).join('')}</tr>`).join('');
      return `<div class="skills" style="${box(i)};--hh:${i.headH};--rh:${i.rowH};--cw:${i.colW}"><table><thead>${head}</thead><tbody>${rows}</tbody></table></div>`;
    }
    case 'legend':
      return `<p class="t st-label legend" style="${box(i)}"><i class="mk full"></i>core <i class="mk half"></i>partial</p>`;
    case 'group':
      return `<div class="g g-${i.role}">${i.items.map(item).join('')}</div>`;
    default:
      return ''; // line, cross, callout, mark → drawn in the overlay
  }
}

function overlay(items) {
  const flat = [];
  (function walk(list) { for (const i of list) i.k === 'group' ? walk(i.items) : flat.push(i); })(items);
  let s = '';
  for (const i of flat) {
    if (i.k === 'line') s += `<line x1="${r(i.x1)}" y1="${r(i.y1)}" x2="${r(i.x2)}" y2="${r(i.y2)}" stroke="${T[i.color] || i.color}" stroke-width="${i.width || 1.5}"/>`;
    if (i.k === 'cross') s += `<path d="M${i.x - 10} ${i.y}h20M${i.x} ${i.y - 10}v20" stroke="${T.ink2}" stroke-width="1.5"/>`;
    if (i.k === 'callout') {
      s += `<path d="M${r(i.lx)} ${i.ly + 30} L${r(i.lx)} ${i.ly + 52} L${r(i.px)} ${r(i.py)}" fill="none" stroke="${T.signal}" stroke-width="2"/>`;
      s += `<circle cx="${r(i.px)}" cy="${r(i.py)}" r="7" fill="${T.paper}" stroke="${T.signal}" stroke-width="3"/>`;
      s += `<text x="${r(i.lx)}" y="${i.ly + 20}" class="co">${esc(i.label)}</text>`;
    }
  }
  return s ? `<svg class="ov" viewBox="0 0 ${T.W} ${T.H}" aria-hidden="true">${s}</svg>` : '';
}

function slideHtml(sl) {
  const label = `Page ${sl.page}: ${sl.title}`;
  return `<section class="slide ty-${sl.type}" id="p${sl.page}" data-page="${sl.page}" aria-label="${esc(label)}">
<div class="art">
${sl.items.map(item).join('\n')}
${overlay(sl.items)}
</div>
</section>`;
}

const TOUCAN = `<svg viewBox="40 -6 176 176" aria-hidden="true"><path d="M44 110 L44 72 C44 48 60 32 82 32 L100 32 L100 110 Z" fill="${T.ink}"/><rect x="44" y="114" width="20" height="18" fill="${T.ink}"/><rect x="95" y="114" width="6" height="18" fill="${T.ink}"/><path d="M100 32 C150 34 190 52 212 74 C190 78 150 78 100 76 Z" fill="${T.trace}"/><path d="M100 76 C150 78 190 78 212 74 C190 94 150 106 100 110 Z" fill="${T.signal}"/><circle cx="80" cy="56" r="5" fill="${T.paper}"/></svg>`;

// the author card: who, one line, where, links (after willwhang.dev's sidebar)
function author(meta) {
  return `<aside class="author" aria-label="About">
  <div class="avatar">${TOUCAN}</div>
  <h1><span>${esc(meta.name)}</span> <span class="cjk" lang="zh-Hans">${esc(meta.cjk)}</span></h1>
  <p class="tag">${esc(meta.tagline)}</p>
  <ul class="meta">
    <li><i class="ic pin"></i>${esc(meta.location)}</li>
    <li><i class="ic cap"></i>${esc(meta.school)}</li>
    <li><a href="mailto:${esc(meta.email)}"><i class="ic mail"></i>Email</a></li>
    <li><a href="https://${esc(meta.github)}"><i class="ic code"></i>GitHub</a></li>
    <li><a href="${esc(meta.pdfName)}" download><i class="ic doc"></i>Portfolio PDF</a></li>
    <li><a href="${esc(meta.personalSite)}"><i class="ic home"></i>Personal site</a></li>
  </ul>
</aside>`;
}

// the project index: photo cards, each jumps into the deck
function projectCards(slides, content) {
  const pageOf = id => (slides.find(s => s.id === id) || {}).page;
  const gallery = content.slides.find(s => s.type === 'gallery');
  const cards = [...(content.cards || []), ...(gallery ? gallery.tiles.filter(t => t.image).map(t => ({
    to: gallery.id, title: t.name, status: t.status, statusLabel: t.statusLabel, line: t.spec, image: t.image,
  })) : [])];
  const plainTxt = s => require('./layout').plain(s);
  return cards.map(c => {
    const pg = pageOf(c.to);
    const thumb = c.figure ? `<span class="thumb fig-thumb">${inlineSvg(c.figure)}</span>`
      : `<span class="thumb"><img src="${c.image.src}" alt="${esc(c.image.alt)}" loading="lazy" decoding="async"></span>`;
    const long = c.long ? ` · <a href="${esc(c.long.href)}">${esc(c.long.label)} →</a>` : '';
    return `<li class="card">
  <a class="hit" href="#p${pg}">${thumb}<span class="ct">${esc(c.title)}</span></a>
  <p class="cl">${esc(plainTxt(c.line))}</p>
  <p class="cm"><i class="dot ${c.status}"></i>${esc(plainTxt(c.statusLabel))} · <a href="#p${pg}">p.${pg}</a>${long}</p>
</li>`;
  }).join('\n');
}

// "On this page": every slide, grouped, with the current one lit (willwhang.dev's post TOC)
function toc(slides) {
  const groups = [];
  for (const s of slides) {
    const g = s.appendix ? `${s.appendix} · ${s.section}` : (s.type === 'back' ? 'End' : 'Two-minute read');
    if (!groups.length || groups[groups.length - 1].g !== g) groups.push({ g, items: [] });
    const label = s.appendix ? `${s.id} · ${s.short}` : s.section;
    groups[groups.length - 1].items.push(`<li><a href="#p${s.page}" data-p="${s.page}"><span>${s.page}</span>${esc(label)}</a></li>`);
  }
  return `<nav class="toc" aria-label="On this page"><p class="toc-h">On this page</p>${groups.map(x => `<p class="toc-g">${esc(x.g)}</p><ol>${x.items.join('')}</ol>`).join('')}</nav>`;
}

function page(slides, meta, content = require('./content')) {
  svgN = 0;
  const index = slides.map(s => `<li><a href="#p${s.page}"><span>${s.page}</span>${esc(s.appendix ? s.id + ' · ' + s.short : s.section)}</a></li>`).join('');
  const css = Object.entries(S).map(([k, v]) => `.st-${k}{--fs:${v.size};--lh:${v.lh};font-weight:${v.weight}}`).join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(meta.name)} — ${esc(meta.title)}</title>
<meta name="description" content="Hardware design portfolio of ${esc(meta.name)}, UBC Electrical Engineering 2027: a FOC motor controller, an aircraft power system, and a flight-controller module.">
<meta name="theme-color" content="${T.paper}" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#20242C" media="(prefers-color-scheme: dark)">
<meta name="color-scheme" content="light dark">
<meta property="og:title" content="${esc(meta.name)} — ${esc(meta.title)}">
<meta property="og:image" content="img/foc-render.jpg">
<link rel="icon" href="fig/toucan.svg" type="image/svg+xml">
<link rel="preload" href="fonts/SpaceGrotesk.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="fonts/JetBrainsMono.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="portfolio.css">
<style>
${css}
</style>
</head>
<body>
<!-- GENERATED by tools/portfolio/build.js from tools/portfolio/content.js. Edit those, then run: npm run portfolio -->
<a class="skip" href="#projects">Skip to projects</a>
<header class="bar">
  <a class="who" href="#top"><b>${esc(meta.name)}</b><span>${esc(meta.title)}</span></a>
  <nav>
    <details class="idx"><summary>Pages</summary><ol>${index}</ol></details>
    <a class="btn" href="${esc(meta.pdfName)}" download>PDF</a>
    <button class="btn pri" id="present" type="button">Present</button>
  </nav>
</header>
<div class="shell" id="top">
${author(meta)}
<main>
  <section class="index" id="projects" aria-labelledby="projects-h">
    <h2 class="sec" id="projects-h">Projects</h2>
    <ul class="cards">
${projectCards(slides, content)}
    </ul>
  </section>
  <h2 class="sec deckhead" id="deck-h">The deck <span>${slides.length} pages · two-minute read, then the appendix</span></h2>
  <div id="deck">
${slides.map(slideHtml).join('\n')}
  </div>
  <footer class="foot"><a href="${esc(meta.personalSite)}">← Weymen's personal site</a><span>${esc(meta.docId)} · ${esc(meta.rev)} · ${esc(meta.updated)}</span></footer>
</main>
${toc(slides)}
</div>
<div class="lb" id="lb" role="dialog" aria-label="Image" hidden><img alt=""><button class="x" type="button" aria-label="Close">Close ×</button></div>
<script src="portfolio.js"></script>
</body>
</html>
`;
}

function buildHtml(slides, meta) {
  const html = page(slides, meta);
  fs.writeFileSync(path.join(SITE, 'index.html'), html);
  return path.join(SITE, 'index.html');
}

module.exports = { buildHtml, page };
