// README's Projects section and portfolio.pdf are generated from the
// projects' entry.json by `npm run tldr` (tools/tldr/build.js).
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { projects, readmeSection, START, END } = require('../tools/tldr/build');

const ROOT = path.join(__dirname, '..');

test('README Projects section matches the projects (run: npm run tldr)', () => {
  const s = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
  const committed = s.slice(s.indexOf(START), s.indexOf(END) + END.length);
  expect(committed, 'README.md is stale: run `npm run tldr` and commit README.md and portfolio.pdf').toBe(readmeSection(projects()));
});

test('every project in the TL;DR has its picture, and the PDF exists', () => {
  for (const p of projects()) expect(fs.existsSync(path.join(ROOT, p.image)), p.image).toBe(true);
  expect(fs.statSync(path.join(ROOT, 'portfolio.pdf')).size).toBeGreaterThan(10000);
});
