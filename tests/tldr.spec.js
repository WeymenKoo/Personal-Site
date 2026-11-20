// The Projects section for the GitHub profile README (dusk/tldr.md) and
// dusk/portfolio.pdf are generated from the projects' entry.json by
// `npm run tldr` (tools/tldr/build.js), and published with the site.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { projects, readmeSection, TLDR, PDF } = require('../tools/tldr/build');

const ROOT = path.join(__dirname, '..');

test('dusk/tldr.md matches the projects (run: npm run tldr)', () => {
  expect(fs.readFileSync(TLDR, 'utf8'), 'dusk/tldr.md is stale: run `npm run tldr` and commit dusk/tldr.md and dusk/portfolio.pdf').toBe(readmeSection(projects()) + '\n');
});

test('every project has its picture, the PDF exists, and the section only uses absolute links', () => {
  for (const p of projects()) expect(fs.existsSync(path.join(ROOT, p.image)), p.image).toBe(true);
  expect(fs.statSync(PDF).size).toBeGreaterThan(10000);
  const md = fs.readFileSync(TLDR, 'utf8');
  for (const m of md.matchAll(/<img src="([^"]+)"/g)) expect(m[1]).toMatch(/^https:\/\/weymenkoo\.github\.io\/Personal-Site\//);
});

test('the TL;DR moved to the profile: README.md here just points there, no PDF at the root', () => {
  const s = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
  expect(s).not.toContain('tldr:start');
  expect(s).toContain('https://github.com/WeymenKoo');
  expect(fs.existsSync(path.join(ROOT, 'portfolio.pdf'))).toBe(false);
});

test('projects marked "portfolio": false stay on the site but not in the README section or the PDF', () => {
  const md = fs.readFileSync(TLDR, 'utf8');
  const { projects: slugs } = JSON.parse(fs.readFileSync(path.join(ROOT, 'dusk/content/manifest.json'), 'utf8'));
  const off = slugs.filter(s => JSON.parse(fs.readFileSync(path.join(ROOT, 'dusk/content/projects', s, 'entry.json'), 'utf8')).portfolio === false);
  expect(off).toEqual(['protoboard-avionics', 'water-rocket', 'rover']);
  for (const s of off) expect(md).not.toContain('/projects/' + s + '/');
  expect(projects().map(p => p.slug)).toEqual(slugs.filter(s => !off.includes(s)));
});
