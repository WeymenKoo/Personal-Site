#!/usr/bin/env node
// Builds the portfolio from content.js.
//
//   node tools/portfolio/build.js            figures + dusk/portfolio/index.html
//   node tools/portfolio/build.js --pdf      + the PDF, printed from the web deck
//   node tools/portfolio/build.js --pptx     + the PowerPoint (needs pptxgenjs, sharp)
//   node tools/portfolio/build.js --todo     list every [[ to fill ]] left
//   --out DIR                                where the .pdf / .pptx go (default dusk/portfolio)
const path = require('path');
const fs = require('fs');
const content = require('./content');
const { layout } = require('./layout');
const { writeFigures } = require('./figures');
const { buildHtml } = require('./build-html');

const args = process.argv.slice(2);
const has = f => args.includes(f);
const outIdx = args.indexOf('--out');
const OUT = outIdx >= 0 ? path.resolve(args[outIdx + 1]) : path.join(__dirname, '../../dusk/portfolio');
const SITE = path.join(__dirname, '../../dusk/portfolio');

function todos() {
  const found = [];
  const walk = (v, where) => {
    if (typeof v === 'string') { for (const m of v.matchAll(/\[\[\s*([^\]]*?)\s*\]\]/g)) found.push([where, m[1]]); }
    else if (Array.isArray(v)) v.forEach(x => walk(x, where));
    else if (v && typeof v === 'object') Object.values(v).forEach(x => walk(x, where));
  };
  content.slides.forEach(s => walk(s, `${s.id.padEnd(3)} ${s.section}`));
  return found;
}

async function main() {
  if (has('--todo')) {
    const t = todos();
    t.forEach(([w, s]) => console.log(`${w.padEnd(30)}  ${s}`));
    console.log(`\n${t.length} left to fill.`);
    const ph = content.slides.filter(s => (s.type === 'deep' && !s.figure && !s.figures && s.layout !== 'table') || s.placeholder2);
    if (ph.length) console.log(`Figure placeholders on: ${ph.map(s => s.id).join(', ')}`);
    return;
  }
  writeFigures(path.join(SITE, 'fig'));
  const slides = layout(content);
  const html = buildHtml(slides, content.meta);
  console.log('wrote', path.relative(process.cwd(), html), `(${slides.length} pages)`);

  if (has('--pdf')) {
    const { buildPdf } = require('./build-pdf');
    const f = await buildPdf(SITE, path.join(OUT, content.meta.pdfName));
    console.log('wrote', path.relative(process.cwd(), f));
  }
  if (has('--pptx')) {
    const { buildPptx } = require('./build-pptx');
    const f = await buildPptx(slides, content.meta, SITE, path.join(OUT, content.meta.pdfName.replace(/\.pdf$/, '.pptx')));
    console.log('wrote', path.relative(process.cwd(), f));
  }
}

main().catch(e => { console.error(e); process.exit(1); });
