// The hardware portfolio at dusk/portfolio/ — a deck built from
// tools/portfolio/content.js. See tools/portfolio/README.md.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { startServer } = require('./serve');

const SITE = path.join(__dirname, '..', 'dusk');
const content = require('../tools/portfolio/content');
const { layout } = require('../tools/portfolio/layout');
const { page: renderPage } = require('../tools/portfolio/build-html');

let server;
test.beforeAll(async () => { server = await startServer(SITE); });
test.afterAll(async () => { await server.close(); });

async function open(page, width = 1440, height = 900) {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('requestfailed', r => errors.push('failed: ' + r.url()));
  page.on('response', r => { if (r.status() >= 400 && !/\.pdf$/.test(r.url())) errors.push(`${r.status()}: ${r.url()}`); });
  await page.setViewportSize({ width, height });
  await page.goto(server.url + 'portfolio/index.html');
  await page.evaluate(() => document.fonts.ready);
  return errors;
}

test('index.html is up to date with content.js (run: npm run portfolio)', () => {
  const fresh = renderPage(layout(content), content.meta);
  const committed = fs.readFileSync(path.join(SITE, 'portfolio', 'index.html'), 'utf8');
  expect(committed === fresh, 'dusk/portfolio/index.html is stale — run `npm run portfolio` and commit it').toBe(true);
});

test('loads with every page, image and font, and no errors', async ({ page }) => {
  const errors = await open(page);
  await expect(page.locator('.slide')).toHaveCount(content.slides.length);
  await page.evaluate(async () => {
    for (const i of document.images) i.loading = 'eager';
    await Promise.all([...document.images].map(i => i.complete ? null : new Promise(r => { i.onload = i.onerror = r; })));
  });
  const broken = await page.evaluate(() => [...document.images].filter(i => i.getAttribute('src') && !i.naturalWidth).map(i => i.getAttribute('src')));
  expect(broken).toEqual([]);
  const fonts = await page.evaluate(() => [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family.replace(/"/g, '')));
  expect(fonts).toEqual(expect.arrayContaining(['Space Grotesk', 'JetBrains Mono']));
  expect(errors).toEqual([]);
});

test('every in-deck link points at a page that exists', async ({ page }) => {
  await open(page);
  const missing = await page.evaluate(() => [...document.querySelectorAll('a[href^="#"]')]
    .map(a => a.getAttribute('href')).filter(h => !document.querySelector(h)));
  expect(missing).toEqual([]);
});

test('every slide is 16:9 and no text spills out of its box', async ({ page }) => {
  await open(page, 1920, 1080);
  await page.emulateMedia({ media: 'print' });
  const sizes = await page.evaluate(() => [...document.querySelectorAll('.art')].map(a => Math.round(a.clientWidth / a.clientHeight * 1000)));
  for (const r of sizes) expect(r).toBe(1778);
  const spills = await page.evaluate(() => [...document.querySelectorAll('.art .t')]
    .filter(t => t.scrollHeight > t.clientHeight + 4 || t.scrollWidth > t.clientWidth + 4)
    .map(t => `${t.closest('.slide').id}: ${t.textContent.slice(0, 40)}`));
  expect(spills).toEqual([]);
  const outside = await page.evaluate(() => [...document.querySelectorAll('.art')].flatMap(a => {
    const A = a.getBoundingClientRect();
    return [...a.querySelectorAll('.t, .fig, .specs, .tbl, .skills, .ph')].filter(e => {
      const r = e.getBoundingClientRect();
      return r.right > A.right + 1 || r.bottom > A.bottom + 1 || r.left < A.left - 1;
    }).map(e => `${a.closest('.slide').id}: ${e.className}`);
  }));
  expect(outside).toEqual([]);
});

test('on a phone the slides reflow with no sideways scroll', async ({ page }) => {
  await open(page, 390, 844);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  // text stays readable: body copy no smaller than 12 px
  const smallest = await page.evaluate(() => Math.min(...[...document.querySelectorAll('.st-body, .st-small, .specs dd')].map(e => parseFloat(getComputedStyle(e).fontSize))));
  expect(smallest).toBeGreaterThanOrEqual(12);
});

test('present mode steps through pages with the keyboard', async ({ page }) => {
  await open(page);
  await page.click('#present');
  await expect(page.locator('body')).toHaveClass(/presenting/);
  await expect(page.locator('.slide.on')).toHaveCount(1);
  const first = await page.locator('.slide.on').getAttribute('id');
  await page.keyboard.press('ArrowRight');
  const second = await page.locator('.slide.on').getAttribute('id');
  expect(Number(second.slice(1))).toBe(Number(first.slice(1)) + 1);
  await page.keyboard.press('Escape');
  await expect(page.locator('body')).not.toHaveClass(/presenting/);
});

test('photos open in the lightbox and close with Escape', async ({ page }) => {
  await open(page);
  await page.locator('.zoom').first().click();
  await expect(page.locator('#lb')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#lb')).toBeHidden();
});

test('project cards jump into the deck, and "On this page" follows the scroll', async ({ page }) => {
  await open(page, 1600, 1000);
  const cards = page.locator('.cards .card');
  expect(await cards.count()).toBeGreaterThanOrEqual(3);
  const hrefs = await page.$$eval('.cards .hit', as => as.map(a => a.getAttribute('href')));
  for (const h of hrefs) await expect(page.locator(h)).toHaveCount(1);
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.querySelector('#p10').scrollIntoView(); });
  await expect(page.locator('.toc a.on')).toHaveAttribute('data-p', '10');
});

test('the PDF print hides the page chrome and keeps one slide per page', async ({ page }) => {
  await open(page, 1920, 1080);
  await page.emulateMedia({ media: 'print' });
  const hidden = await page.evaluate(() => ['.author', '.toc', '.index', '.bar'].map(s => getComputedStyle(document.querySelector(s)).display));
  expect(hidden).toEqual(['none', 'none', 'none', 'none']);
  const top = await page.evaluate(() => document.querySelector('#p01').getBoundingClientRect().top + scrollY);
  expect(top).toBe(0);
});
