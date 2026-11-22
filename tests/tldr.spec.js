// dusk/portfolio.pdf is generated from the projects' entry.json by
// `npm run tldr` (tools/tldr/build.js) and published with the site.
// The GitHub profile README is hand-written and only links here.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { projects, PDF } = require('../tools/tldr/build');

const ROOT = path.join(__dirname, '..');

test('every portfolio project has its picture, and the PDF exists', () => {
  for (const p of projects()) expect(fs.existsSync(path.join(ROOT, p.image)), p.image).toBe(true);
  expect(fs.statSync(PDF).size).toBeGreaterThan(10000);
});

test('no generated README section is left behind', () => {
  expect(fs.existsSync(path.join(ROOT, 'dusk/tldr.md'))).toBe(false);
  expect(fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8')).not.toContain('tldr:start');
  expect(fs.existsSync(path.join(ROOT, 'portfolio.pdf'))).toBe(false);
});

test('projects marked "portfolio": false stay on the site but not in the PDF', () => {
  const { projects: slugs } = JSON.parse(fs.readFileSync(path.join(ROOT, 'dusk/content/manifest.json'), 'utf8'));
  const off = slugs.filter(s => JSON.parse(fs.readFileSync(path.join(ROOT, 'dusk/content/projects', s, 'entry.json'), 'utf8')).portfolio === false);
  expect(off).toEqual(['protoboard-avionics', 'water-rocket', 'rover']);
  expect(projects().map(p => p.slug)).toEqual(slugs.filter(s => !off.includes(s)));
});
