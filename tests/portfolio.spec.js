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
  expect(() => html()).not.toThrow();   // throws on a missing picture or scope capture
});

test('every file in tools/portfolio/assets is used, and every scope capture has its picture', () => {
  html();
  expect(fs.readdirSync(ASSETS).filter(f => !used.has(f))).toEqual([]);
  for (const s of Object.values(SCOPES)) expect(fs.existsSync(path.join(ASSETS, s.src)), s.src).toBe(true);
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
