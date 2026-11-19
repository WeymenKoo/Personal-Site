const { test, expect } = require('@playwright/test');
const fs = require('fs');
const { startServer } = require('./serve');
const { copySite, addEntry, removeExample, SITE } = require('./content');

/* keep tests offline and deterministic */
async function offline(page) {
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
}
async function open(page, url) {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await offline(page);
  await page.goto(url + 'index.html');
  await page.evaluate(() => window.entriesReady);
  return errors;
}
const TITLES = ['Flight controller SoM', 'FOC motor controller', 'AeroDesign power board', 'Shadow: power distribution',
  'Kyogre and Spirit', 'DC electronic load', 'Micromouse'];

/* ================================================================= */
test.describe('as shipped', () => {
  let server;
  test.beforeAll(async () => { server = await startServer(SITE); });
  test.afterAll(async () => { await server.close(); });

  test('loads with no script errors', async ({ page }) => {
    const errors = await open(page, server.url);
    await page.waitForTimeout(500);
    expect(errors).toEqual([]);
  });

  test('just a title screen and the projects: seven, in order, numbered A1..A7', async ({ page }) => {
    await open(page, server.url);
    await expect(page.locator('.hero h1')).toHaveText('Weymen Koo');
    await expect(page.locator('.proj h3')).toHaveText(TITLES);
    await expect(page.locator('.proj .no')).toHaveText(['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7']);
    await expect(page.locator('#projectCount')).toHaveText('07');
    // the old tape / record / hour machinery is gone
    for (const gone of ['.tape', '.rec', '.deck', '#side-b', '#records', '.tl']) await expect(page.locator(gone)).toHaveCount(0);
  });

  test('one site: no separate portfolio deck, and nothing links to one', async ({ page, request }) => {
    await open(page, server.url);
    await expect(page.locator('a[href*="portfolio"]')).toHaveCount(0);
    expect((await request.get(server.url + 'portfolio/index.html')).status()).toBe(404);
  });

  test('every card is a link to its write-up, with a visible Read button', async ({ page }) => {
    await open(page, server.url);
    const cards = page.locator('a.proj');
    await expect(cards).toHaveCount(7);
    for (let i = 0; i < 7; i++) {
      await expect(cards.nth(i)).toHaveAttribute('href', /^content\/projects\/[a-z0-9-]+\/index\.html$/);
      await expect(cards.nth(i).locator('.more')).toBeVisible();
    }
    await cards.nth(5).locator('.pic img').click();
    await expect(page).toHaveURL(/content\/projects\/dc-load\/index\.html$/);
  });

  test('every card picture loads, none falls back to the placeholder', async ({ page }) => {
    await open(page, server.url);
    await page.evaluate(() => { for (const i of document.images) i.loading = 'eager'; });
    await page.waitForFunction(() => [...document.querySelectorAll('.proj img')].every(i => i.complete && i.naturalWidth > 0));
    expect(await page.evaluate(() => [...document.querySelectorAll('.proj img')].filter(i => i.dataset.ph).length)).toBe(0);
    // the card shows the centred README / PDF picture when the project has one
    await expect(page.locator('.proj').nth(2).locator('img')).toHaveAttribute('src', /power-board\/tldr\.jpg$/);
  });

  test('hover lifts the card and fills the Read button', async ({ page }) => {
    await open(page, server.url);
    const card = page.locator('.proj').first();
    await card.scrollIntoViewIfNeeded();
    const before = await card.locator('.more').evaluate(e => getComputedStyle(e).backgroundColor);
    await card.hover();
    await page.waitForTimeout(400);
    expect(await card.evaluate(e => getComputedStyle(e).transform)).not.toBe('none');
    expect(await card.locator('.more').evaluate(e => getComputedStyle(e).backgroundColor)).not.toBe(before);
  });

  test('a quote on the title screen and another in the footer', async ({ page }) => {
    await open(page, server.url);
    await expect(page.locator('#heroQuote blockquote')).toHaveText(/^“.+”$/);
    await expect(page.locator('#offLine blockquote')).toHaveText(/^“.+”$/);
    expect(await page.locator('#heroQuote blockquote').textContent()).not.toBe(await page.locator('#offLine blockquote').textContent());
    await expect(page.locator('#contact a.telegram')).toHaveAttribute('href', 'contact.html');
  });

  test('follows the device theme: dark and light', async ({ browser }) => {
    const bg = {};
    for (const scheme of ['dark', 'light']) {
      const ctx = await browser.newContext({ colorScheme: scheme });
      const page = await ctx.newPage();
      await open(page, server.url);
      bg[scheme] = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      const city = await page.locator('.city').evaluate(e => getComputedStyle(e).backgroundImage);
      expect(city).toContain(scheme === 'dark' ? 'city-dark.png' : 'city-light.png');
      await ctx.close();
    }
    expect(bg.dark).toBe('rgb(13, 8, 32)');
    expect(bg.light).toBe('rgb(244, 238, 251)');
  });

  test('the cursor is the pixel ship, and it fires over links', async ({ page }) => {
    await open(page, server.url);
    expect(await page.evaluate(() => getComputedStyle(document.body).cursor)).toContain('cursor.svg');
    expect(await page.locator('.proj').first().evaluate(e => getComputedStyle(e).cursor)).toContain('cursor-fire.svg');
    for (const f of ['cursor.svg', 'cursor-fire.svg', 'city-dark.png', 'city-light.png']) {
      expect(fs.existsSync(`${SITE}/assets/img/${f}`), f).toBe(true);
    }
  });

  test('the bar sets out two or three drinks; each one says something', async ({ page }) => {
    await open(page, server.url);
    const n = await page.locator('.counter .drink').count();
    expect(n).toBeGreaterThanOrEqual(2);
    expect(n).toBeLessThanOrEqual(3);
    await page.locator('.counter .drink').first().click();
    await expect(page.locator('#toast')).toHaveClass(/on/);
  });

  test('the SOS window sits on the city and blinks', async ({ page }) => {
    await open(page, server.url);
    const box = await page.locator('.sos').boundingBox();
    const city = await page.locator('.city').boundingBox();
    expect(box.y).toBeGreaterThan(city.y);
    expect(await page.locator('.sos').evaluate(e => getComputedStyle(e).animationName)).toBe('sos');
  });

  test('hidden codes: the Konami code starts an invasion; sudo is refused', async ({ page }) => {
    await open(page, server.url);
    for (const k of ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']) await page.keyboard.press(k);
    await expect(page.locator('#toast')).toContainText('incoming');
    await page.keyboard.type('sudo');
    await expect(page.locator('#toast')).toContainText('Nice try');
  });

  test('with reduced motion: the sky holds still, no errors', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    const errors = await open(page, server.url);
    await page.waitForTimeout(300);
    expect(await page.locator('.hero h1').evaluate(e => getComputedStyle(e).animationName)).toBe('none');
    expect(errors).toEqual([]);
    await ctx.close();
  });

  test('works under the /Personal-Site/ subpath: no request escapes it', async ({ page }) => {
    const escaped = [];
    page.on('request', r => {
      const u = new URL(r.url());
      if (u.hostname === 'localhost' && !u.pathname.startsWith('/Personal-Site/')) escaped.push(u.pathname);
    });
    await open(page, server.url);
    await page.evaluate(() => { for (const i of document.images) i.loading = 'eager'; });
    await page.waitForLoadState('networkidle');
    expect(escaped).toEqual([]);
  });

  test('phone width: no sideways scroll, one card per row', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await open(page, server.url);
    for (const id of ['hero', 'projects', 'contact']) {
      await page.evaluate(id => document.getElementById(id).scrollIntoView(), id);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    const [a, b] = await Promise.all([0, 1].map(i => page.locator('.proj').nth(i).boundingBox()));
    expect(b.y).toBeGreaterThan(a.y + a.height - 1);
    await ctx.close();
  });

  test('favicon is the toucan', async ({ page, request }) => {
    await open(page, server.url);
    const href = await page.locator('link[rel="icon"]').getAttribute('href');
    expect((await request.get(server.url + href)).ok()).toBe(true);
  });

  test('the theme button is on every page, and the pets are gone', async ({ page }) => {
    for (const url of ['index.html', 'contact.html', 'resume.html', 'content/projects/dc-load/index.html']) {
      await page.goto(server.url + url);
      await expect(page.locator('.dock #themeBtn')).toBeVisible();
      await expect(page.locator('.dock button')).toHaveCount(1);
      await expect(page.locator('.pets, .pet, #petToggle, #petAdd')).toHaveCount(0);
    }
  });

  test('the cursor sweeps a drink along the bar; a drag slides it; a tap still talks', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await open(page, server.url);
    const glass = page.locator('.counter .drink').first();
    await glass.scrollIntoViewIfNeeded();
    const x0 = await page.evaluate(() => window.fx.drinks[0].x);
    const b = await glass.boundingBox();
    // sweep left to right through the glass, just above the bar top
    const y = b.y + b.height * .6;
    await page.mouse.move(b.x - 60, y);
    for (let i = 1; i <= 8; i++) await page.mouse.move(b.x - 60 + i * 25, y);
    await page.waitForTimeout(700);
    const x1 = await page.evaluate(() => window.fx.drinks[0].x);
    expect(x1).toBeGreaterThan(x0 + 10);
    // drag it back to the left and let go
    const c = await glass.boundingBox();
    await page.mouse.move(c.x + c.width / 2, c.y + c.height / 2);
    await page.mouse.down();
    for (let i = 1; i <= 6; i++) await page.mouse.move(c.x + c.width / 2 - i * 20, c.y + c.height / 2);
    await page.mouse.up();
    await page.waitForTimeout(700);
    const x2 = await page.evaluate(() => window.fx.drinks[0].x);
    expect(x2).toBeLessThan(x1 - 60);
    await expect(page.locator('#toast')).not.toHaveClass(/on/);          // a drag isn't a tap
    // every glass stays on the bar
    const inside = await page.evaluate(() => {
      const w = document.getElementById('counter').clientWidth;
      return window.fx.drinks.every(g => g.x >= 0 && g.x + g.w <= w + 1);
    });
    expect(inside).toBe(true);
    await glass.click();
    await expect(page.locator('#toast')).toHaveClass(/on/);
  });

  test('the cursor nudges the spacecraft aside, gently', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    await page.goto(server.url + 'index.html?scene=station');
    // the push: away from the cursor, small, and nothing beyond the radius
    const r = await page.evaluate(() => {
      const w = window.fx.wind, near = { x: 0, y: 0 }, far = { x: 0, y: 0 };
      w.x = 100; w.y = 100;
      for (let i = 0; i < 10; i++) { w.blow(near, 130, 100, 1); w.blow(far, 100 + w.R + 5, 100, 1); }
      return { near, far, R: w.R };
    });
    expect(r.near.x).toBeGreaterThan(0);                 // pushed away (to the right)
    expect(r.near.x).toBeLessThan(15);                   // a breeze over ten frames, not a shove
    expect(r.far).toEqual({ x: 0, y: 0 });
    // live: park the cursor just under the station and it rises out of the way
    await page.waitForFunction(() => window.fx.game.craft().station.x > 40);
    const s0 = await page.evaluate(() => { const q = window.fx.game.craft().station; return { x: q.x, y: q.y }; });
    await page.mouse.move(s0.x + 120, s0.y + 70);
    await page.waitForTimeout(800);
    const s1 = await page.evaluate(() => window.fx.game.craft().station.y);
    expect(s1).toBeLessThan(s0.y - 1);
  });

  test('every sky scene runs without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    for (const sc of ['patrol', 'launch', 'landing', 'station', 'capsule']) {
      await page.goto(server.url + 'index.html?scene=' + sc);
      await expect(page.locator('#sky')).toHaveAttribute('data-scene', sc);
      await page.waitForTimeout(1500);
    }
    expect(errors).toEqual([]);
  });

  test('scrolling holds 60 fps (p95 frame under 20 ms)', async ({ browser }) => {
    test.skip(!!process.env.CI, 'shared CI runners are too noisy to time frames');
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await open(page, server.url);
    const p95 = await page.evaluate(async () => {
      document.documentElement.style.scrollBehavior = 'auto';
      const frames = []; let last = performance.now(), on = true;
      (function f(t) { frames.push(t - last); last = t; if (on) requestAnimationFrame(f); })(last);
      const max = document.documentElement.scrollHeight - innerHeight;
      for (let y = 0; y <= max; y += 60) { scrollTo(0, y); await new Promise(r => requestAnimationFrame(r)); }
      on = false; frames.shift(); frames.sort((a, b) => a - b);
      return frames[Math.floor(frames.length * .95)];
    });
    expect(p95).toBeLessThan(20);
    await ctx.close();
  });
});

/* ================================================================= */
test.describe('adding projects by following the README', () => {
  let server, site;

  test.beforeAll(async () => {
    site = copySite();
    addEntry(site, 'foc', {
      title: 'Field-oriented motor controller', status: 'wip', statusLabel: 'At fab', year: '2026',
      spec: '50 V · 3-phase · CAN FD', summary: 'A three-phase FOC controller.',
      cover: { src: 'cover.jpg', alt: 'FoC render' }, link: '',
    }, ['cover.jpg']);
    addEntry(site, 'aero', {
      title: 'AeroDesign — the aircraft', status: 'ok', statusLabel: 'Flown', year: '2021',
      spec: 'SAE Advanced Class', summary: 'Wings, then wiring.',
      cover: { src: 'render.jpg', alt: 'Render' }, tldr: { src: 'photo.jpg', alt: 'Photo' },
      link: 'https://github.com/WeymenKoo',
    }, ['render.jpg', 'photo.jpg']);
    addEntry(site, 'mouse', {
      title: 'Micromouse', status: 'stop', statusLabel: 'Shelved', year: '2024', spec: 'STM32F411',
      summary: 'Maze solver.', cover: { src: 'missing.jpg', alt: 'Micromouse' }, link: '',
    }, []);
    removeExample(site);
    server = await startServer(site);
  });
  test.afterAll(async () => { await server.close(); fs.rmSync(site, { recursive: true, force: true }); });

  test('projects appear in manifest order, numbered A1..A3, example gone', async ({ page }) => {
    await open(page, server.url);
    await expect(page.locator('.proj h3')).toHaveText(['Field-oriented motor controller', 'AeroDesign — the aircraft', 'Micromouse']);
    await expect(page.locator('.proj .no')).toHaveText(['A1', 'A2', 'A3']);
    await expect(page.locator('#projectCount')).toHaveText('03');
  });

  test('every field from the README table renders', async ({ page }) => {
    await open(page, server.url);
    const [foc, aero, mouse] = [0, 1, 2].map(i => page.locator('.proj').nth(i));
    await expect(foc.locator('.st')).toHaveClass(/\bwip\b/);
    await expect(foc.locator('.st')).toHaveText('At fab');
    await expect(aero.locator('.st')).toHaveClass(/\bok\b/);
    await expect(mouse.locator('.st')).toHaveClass(/\bstop\b/);
    await expect(foc.locator('.spec')).toHaveText('50 V · 3-phase · CAN FD');
    await expect(foc.locator('.row')).toContainText('2026');
    await expect(foc.locator('.sum')).toHaveText('A three-phase FOC controller.');
    await expect(foc.locator('.more')).toHaveCount(0);                     // link: "" — no button, not a link
    expect(await foc.evaluate(e => e.tagName)).toBe('ARTICLE');
    await expect(aero).toHaveAttribute('href', 'https://github.com/WeymenKoo');
    await expect(aero.locator('.more')).toHaveText('Read ▸');
    await expect(aero.locator('img')).toHaveAttribute('src', /photo\.jpg$/);   // tldr wins over cover
  });

  test('a missing picture falls back to the placeholder', async ({ page }) => {
    await open(page, server.url);
    await expect(page.locator('.proj').nth(2).locator('img')).toHaveAttribute('src', /placeholder\.webp$/);
  });

});

test('a broken entry is skipped and logged; the rest still render', async ({ page }) => {
  const site = copySite();
  addEntry(site, 'good', { title: 'Good', status: 'ok', statusLabel: 'Fine', cover: { src: 'c.jpg', alt: 'c' }, link: '' }, ['c.jpg']);
  addEntry(site, 'bad', {}, []);
  fs.writeFileSync(`${site}/content/projects/bad/entry.json`, '{ broken');
  const server = await startServer(site);
  const logs = [];
  page.on('console', m => { if (m.type() === 'error') logs.push(m.text()); });
  await open(page, server.url);
  await expect(page.locator('.proj')).toHaveCount(2);           // the example and the good one
  expect(logs.join('\n')).toContain('skipped content/projects/bad/entry.json');
  await server.close();
  fs.rmSync(site, { recursive: true, force: true });
});
