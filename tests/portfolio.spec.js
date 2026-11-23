// dusk/portfolio.pdf is printed from tools/portfolio/content.js by `npm run portfolio`
// (tools/portfolio/build.js) and published with the site.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { html, PDF, ASSETS, SCOPES, used } = require('../tools/portfolio/build');

const ROOT = path.join(__dirname, '..');

test('the PDF exists and every page is built from pictures that exist', () => {
  expect(fs.statSync(PDF).size).toBeGreaterThan(1e6);
  const pages = (fs.readFileSync(PDF, 'latin1').match(/\/Type\s*\/Page\b/g) || []).length;
  expect(pages).toBeGreaterThanOrEqual(12);
  expect(fs.statSync(PDF).size).toBeLessThan(8e6);   // job portals cap uploads
  expect(() => html()).not.toThrow();   // throws on a missing picture or scope capture
});

test('every file in tools/portfolio/assets is used, and every scope capture has its picture', () => {
  html();
  expect(fs.readdirSync(ASSETS).filter(f => !used.has(f))).toEqual([]);
  for (const s of Object.values(SCOPES)) expect(fs.existsSync(path.join(ASSETS, s.src)), s.src).toBe(true);
});

test('every picture is 4:3, except the scope screenshots, which are the scope\'s own 1024 x 600', () => {
  const size = b => b.toString('ascii', 1, 4) === 'PNG' ? [b.readUInt32BE(16), b.readUInt32BE(20)] : (() => {
    for (let i = 2; i < b.length - 9;) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
      if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }
      i += 2 + b.readUInt16BE(i + 2);
    }
  })();
  for (const f of fs.readdirSync(ASSETS).filter(f => /\.(jpg|png)$/.test(f))) {
    const [w, h] = size(fs.readFileSync(path.join(ASSETS, f)));
    if (f.startsWith('scope-')) expect([w, h], f).toEqual([1024, 600]);
    else expect(Math.abs(w / h - 4 / 3), f).toBeLessThan(0.01);
  }
});

test('the PDF is set in JetBrains Mono', () => {
  const page = html();
  expect(page).toContain('JetBrainsMono'.slice(0, 3));   // the @font-face family
  expect(fs.readdirSync(path.join(ASSETS, '..', 'fonts')).filter(f => f.endsWith('.woff2')).every(f => f.startsWith('JetBrainsMono-'))).toBe(true);
});

test('portfolio pictures carry no metadata', () => {
  for (const f of fs.readdirSync(ASSETS)) {
    const b = fs.readFileSync(path.join(ASSETS, f));
    if (f.endsWith('.jpg')) {
      // walk the JPEG segments up to the image data: no APP1 (EXIF / XMP), no APP13 (IPTC)
      for (let i = 2; i < b.length - 4 && b[i] === 0xff && b[i + 1] !== 0xda; i += 2 + b.readUInt16BE(i + 2)) {
        expect([0xe1, 0xed], f).not.toContain(b[i + 1]);
      }
    } else if (f.endsWith('.png')) {
      for (let i = 8; i < b.length; i += 12 + b.readUInt32BE(i)) {
        expect(['tEXt', 'iTXt', 'zTXt', 'eXIf', 'caBX', 'iCCP'], f).not.toContain(b.toString('ascii', i + 4, i + 8));
      }
    }
  }
});

test('no generated README section is left behind', () => {
  expect(fs.existsSync(path.join(ROOT, 'dusk/tldr.md'))).toBe(false);
  expect(fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8')).not.toContain('tldr:start');
  expect(fs.existsSync(path.join(ROOT, 'portfolio.pdf'))).toBe(false);
});
