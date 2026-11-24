const { test, expect } = require('@playwright/test');
const fs = require('fs');
const { startServer } = require('./serve');
const { copySite, addEntry, removeExample, SITE } = require('./content');

/* keep tests offline and deterministic */
async function offline(page) {
  await page.route(/fonts\.(googleapis|gstatic)\.com|cloud\.umami\.is/, r => r.abort());
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
  'Kyogre and Spirit', 'DC electronic load', 'Micromouse', 'Protoboard flight computers', 'Water rocket', 'Rovers'];

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

  test('just a title screen and the projects: ten, in order, numbered A1..A10', async ({ page }) => {
    await open(page, server.url);
    await expect(page.locator('.hero h1')).toHaveText('Weymen Koo');
    await expect(page.locator('.proj h3')).toHaveText(TITLES);
    await expect(page.locator('.proj .no')).toHaveText(TITLES.map((_, i) => 'A' + (i + 1)));
    await expect(page.locator('#projectCount')).toHaveText('10');
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
    await expect(cards).toHaveCount(TITLES.length);
    for (let i = 0; i < TITLES.length; i++) {
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
    // the round is random: set it out so the first glass has the bar to itself
    await page.evaluate(() => {
      const w = document.getElementById('counter').clientWidth;
      window.fx.drinks.forEach((g, i) => {
        g.vx = 0; g.x = i === 0 ? 200 : w - (i * (g.w + 20));
        g.node.style.transform = 'translateX(' + g.x + 'px)';
      });
    });
    const x0 = await page.evaluate(() => window.fx.drinks[0].x);
    const b = await glass.boundingBox();
    // sweep left to right through the glass, just above the bar top
    const y = b.y + b.height * .6;
    await page.mouse.move(b.x - 60, y);
    for (let i = 1; i <= 8; i++) await page.mouse.move(b.x - 60 + i * 25, y);
    await page.mouse.move(b.x - 60 + 9 * 25, y - 300);          // lift the cursor off the bar
    await page.waitForFunction(() => window.fx.drinks.every(g => g.vx === 0 && !g.drag), null, { timeout: 8000 });
    const x1 = await page.evaluate(() => window.fx.drinks[0].x);
    expect(x1).toBeGreaterThan(x0 + 10);
    // drag it back to the left and let go
    const c = await glass.boundingBox();
    await page.mouse.move(c.x + c.width / 2, c.y + c.height / 2);
    await page.mouse.down();
    for (let i = 1; i <= 6; i++) await page.mouse.move(c.x + c.width / 2 - i * 20, c.y + c.height / 2);
    await page.mouse.up();
    await page.mouse.move(10, 10);
    await page.waitForFunction(() => window.fx.drinks.every(g => g.vx === 0 && !g.drag), null, { timeout: 8000 });
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
    await page.route(/fonts\.(googleapis|gstatic)\.com|cloud\.umami\.is/, r => r.abort());
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
    for (const sc of ['patrol', 'launch', 'landing', 'station', 'capsule', 'shuttle-launch', 'falcon-heavy', 'hubble', 'roadster', 'dc3', 'spitfire', 'tomcat', 'seaking']) {
      await page.goto(server.url + 'index.html?scene=' + sc);
      await expect(page.locator('#sky')).toHaveAttribute('data-scene', sc);
      await page.waitForTimeout(1500);
    }
    expect(errors).toEqual([]);
  });

  test('click anything flying and it explodes', async ({ page }) => {
    const errors = await open(page, server.url);
    await page.goto(server.url + 'index.html?scene=station');
    await page.waitForFunction(() => window.fx.game.craft().station.x > 200, null, { timeout: 20000 });
    const p = await page.evaluate(() => {
      const q = window.fx.game.craft().station, r = document.getElementById('sky').getBoundingClientRect();
      return { x: q.x + r.left + 40, y: q.y + r.top + 12 };
    });
    await page.mouse.click(p.x, p.y);
    await expect(page.locator('#toast')).toContainText('deorbited');
    // the next craft is a different one, picked at random
    expect(await page.evaluate(() => document.getElementById('sky').dataset.scene)).not.toBe('station');
    // the aliens too: invade, then shoot one by hand
    await page.keyboard.press('Escape');
    const hits = await page.evaluate(() => { window.fx.game.invade(); return window.fx.game.hits; });
    const a = await page.evaluate(() => {
      const r = document.getElementById('sky').getBoundingClientRect(), al = window.fx.game.craft().aliens;
      const t = al[al.length - 1];                         // the far one: the ship won't get there first
      return { x: r.left + t.x + 13, y: r.top + t.y + 10 };
    });
    await page.mouse.click(a.x, a.y);
    await page.waitForFunction(h => window.fx.game.hits > h, hits, { timeout: 3000 });
    expect(errors).toEqual([]);
  });

  test('the jazz club in the skyline plays a tune, and stops', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const errors = await open(page, server.url);
    const club = page.locator('#jazz');
    await expect(club).toBeVisible();
    const box = await club.boundingBox(), city = await page.locator('.city').boundingBox();
    expect(box.y).toBeGreaterThan(city.y);
    expect(box.x).toBeGreaterThan(720);                  // right of the title, with the towers
    await page.evaluate(() => document.querySelectorAll('.drink').forEach(d => d.remove()));
    await club.click();
    await expect(page.locator('#toast')).toContainText('Low Pass');
    expect(await page.evaluate(() => window.fx.jazz.playing())).toBe(true);
    await expect(page.locator('.note').first()).toBeAttached({ timeout: 4000 });
    await club.click();
    expect(await page.evaluate(() => window.fx.jazz.playing())).toBe(false);
    expect(errors).toEqual([]);
  });

  test('below the city: underground, sea, station, on the index and the résumé', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    for (const url of ['index.html', 'resume.html']) {
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await offline(page);
      await page.goto(server.url + url);
      await expect(page.locator('canvas.depths')).toHaveCount(1);
      await expect(page.locator('.station')).toHaveCount(1);
      const z = await page.evaluate(() => { window.depths.layout(); return window.depths.zones(); });   // measure now: cards load late
      expect(z.start).toBeLessThan(z.sea);
      expect(z.sea).toBeLessThan(z.stTop);
      // nothing fixed grows into the project column
      expect(z.colL).toBeGreaterThan(0);
      await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));   // the site scrolls smoothly; tests jump
      await page.waitForTimeout(600);
      expect(errors).toEqual([]);
    }
  });

  test('a popped research sub implodes, and a different one cruises in from a side', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const errors = await open(page, server.url);
    const z = await page.evaluate(() => { window.depths.layout(); return window.depths.zones(); });
    await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), (z.sea + z.stTop) / 2 - 450);
    const before = await page.evaluate(() => window.depths.fleet().map(v => v.k));
    expect(before.length).toBe(5);                        // the sea starts full
    const ys = await page.evaluate(() => window.depths.fleet().map(v => v.y));
    for (const y of ys) { expect(y).toBeGreaterThan(z.sea); expect(y).toBeLessThan(z.stTop); }   // in the sea, even though the cards loaded late
    expect(new Set(before).size).toBe(5);                 // never two the same
    await page.evaluate(() => window.depths.implode(window.depths.fleet()[0]));
    await expect(page.locator('#toast')).not.toBeEmpty();
    await page.waitForFunction(() => window.depths.fleet().length === 4, null, { timeout: 10000 });
    await page.waitForFunction(() => window.depths.fleet().length === 5, null, { timeout: 15000 });
    const after = await page.evaluate(() => window.depths.fleet().map(v => ({ k: v.k, state: v.state })));
    expect(new Set(after.map(v => v.k)).size).toBe(5);
    expect(after.some(v => v.state === 'enter' || v.state === 'sink')).toBe(true);   // the new one, on its way in
    expect(errors).toEqual([]);
  });

  test('the wreck on the seabed pays out a coin when clicked', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await open(page, server.url);
    await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
    await page.waitForFunction(() => window.depths.wreck(), null, { timeout: 5000 });
    const b = await page.evaluate(() => { const w = window.depths.wreck(); return { x: w.x + w.w * .5, y: w.y + w.h * .6 - scrollY }; });
    await page.mouse.click(b.x, b.y);
    await page.waitForFunction(() => window.depths.score.coins === 1, null, { timeout: 3000 });
    await expect(page.locator('#toast')).toContainText('coin');
  });

  test('résumé: Tesla goes red with a car sound, Dometic spins, AeroDesign and projects link out', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await offline(page);
    await page.goto(server.url + 'resume.html');
    const tesla = page.locator('[data-egg="tesla"]');
    await tesla.click();
    await expect(tesla).toHaveClass(/tesla-red/);
    await expect(page.locator('#toast')).toContainText('Error chime');      // the first one is always the error chime
    const gyro = page.locator('[data-egg="gyro"]');
    await gyro.click();
    await expect(gyro).toHaveClass(/gyro/);
    await expect(page.locator('#toast')).toContainText('gyro');
    const aero = page.locator('a.org-link');
    await expect(aero).toHaveCount(4);
    for (const h of await aero.evaluateAll(a => a.map(x => x.getAttribute('href')))) expect(h).toBe('https://ubcaerodesign.com/');
    const links = await page.locator('.job li a').evaluateAll(a => a.map(x => x.getAttribute('href')));
    expect(links.length).toBeGreaterThanOrEqual(4);
    for (const h of links) expect(fs.existsSync(`${SITE}/${h}`), h).toBe(true);
    expect(errors).toEqual([]);
  });

  test('pages carry a link preview: og tags and the 1200×627 card', async ({ page }) => {
    for (const f of ['index.html', 'resume.html', 'contact.html']) {
      const html = fs.readFileSync(`${SITE}/${f}`, 'utf8');
      expect(html, f).toContain('property="og:image" content="https://weymenkoo.github.io/Personal-Site/assets/img/og-card.png"');
      expect(html, f).toContain('name="twitter:card" content="summary_large_image"');
    }
    expect(fs.existsSync(`${SITE}/assets/img/og-card.png`)).toBe(true);
  });

  test('something is flying within a second of the page opening', async ({ page }) => {
    await open(page, server.url);
    await page.waitForFunction(() => {
      const c = window.fx.game.craft(), s = document.getElementById('sky').dataset.scene;
      return s === 'patrol' || (s === 'launch' && c.launch.t > 0) || (s === 'landing' && c.shuttle.t > 0) || (s === 'capsule' && c.capsule.t > 0)
        || ((s === 'shuttle-launch' || s === 'falcon-heavy') && c.rocket.t > 0) || (s === 'station' && c.station.x > -100)
        || (s === 'hubble' && c.hubble.x > -100) || (s === 'roadster' && c.roadster.x > -100)
        || (['dc3', 'spitfire', 'tomcat', 'seaking'].includes(s) && c.air.t > 0);
    }, null, { timeout: 1500 });
  });

  test('the cursor on the track stops the train', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await open(page, server.url);
    await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));   // the site scrolls smoothly; tests jump
    await page.waitForTimeout(300);
    // park the cursor on the track, just out of the left tunnel; the next train in must stop short of it
    const r = await page.evaluate(() => { window.depths.layout(); return window.depths.track(); });
    const cx = r.tw + 40;                                 // canvas px
    await page.mouse.move(cx * r.P, r.y - await page.evaluate(() => scrollY));
    // send a train in now, rather than waiting a whole cycle (CI renders few frames, so trains run slow there)
    await page.evaluate(() => Object.assign(window.depths.train(), { phase: 'in', x: -4, v: 1.4, t: 0 }));
    try {
      await page.waitForFunction(c => { const t = window.depths.train(); return t.blocked && t.v === 0 && t.x < c; }, cx, { timeout: 20000 });
    } catch (e) {
      throw new Error('train never stopped: ' + JSON.stringify(await page.evaluate(() => ({ train: window.depths.train(), cursor: window.depths.cursor(), zones: window.depths.zones() }))));
    }
    await expect(page.locator('#toast')).toContainText('horn');
  });

  test('torpedoes hunt the cursor in the margins; over the project boxes it is safe', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await open(page, server.url);
    const z = await page.evaluate(() => { window.depths.layout(); return window.depths.zones(); });   // measure now: cards load late
    await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), (z.sea + z.stTop) / 2 - 450);
    await page.mouse.move(60, 450);                       // in the left margin
    const y = await page.evaluate(() => scrollY + 450);
    await page.evaluate(([x, y]) => window.depths.fire(x, y), [60, y]);
    await page.waitForFunction(() => window.depths.score.hits > 0 || window.depths.score.dodged > 0, null, { timeout: 15000 });
    await page.waitForFunction(() => window.depths.torps().length === 0, null, { timeout: 15000 });
    const h1 = await page.evaluate(() => window.depths.score.hits);
    expect(h1, JSON.stringify(await page.evaluate(() => ({ score: window.depths.score, cursor: window.depths.cursor(), zones: window.depths.zones(), sub: window.depths.sub() })))).toBeGreaterThan(0);
    // now take cover over the column: a torpedo fired at it can't hit
    await page.mouse.move(720, 450);
    await page.evaluate(([x, y]) => window.depths.fire(x, y), [720, y]);
    await page.waitForFunction(() => window.depths.torps().length === 0, null, { timeout: 15000 });
    expect(await page.evaluate(() => window.depths.score.hits)).toBe(h1);
  });

  test('the city is one banner anchored to the right, never repeated, and its aviation lights blink', async ({ page }) => {
    await open(page, server.url);
    const s = await page.locator('.city').evaluate(e => ({
      pos: getComputedStyle(e).backgroundPositionX,
      rep: getComputedStyle(e).backgroundRepeat, lrep: getComputedStyle(e, '::before').backgroundRepeat,
      a: getComputedStyle(e, '::before').animationName, b: getComputedStyle(e, '::after').animationName,
      ai: getComputedStyle(e, '::before').backgroundImage, bi: getComputedStyle(e, '::after').backgroundImage,
    }));
    expect(s.pos.split(',')[0].trim()).toBe('100%');
    // one banner, cropped by the screen: never tiled
    expect(s.rep.split(',')[0].trim()).toBe('no-repeat');
    expect(s.lrep).toBe('no-repeat');
    expect([s.a, s.b]).toEqual(['av', 'av']);
    expect(s.ai).toContain('city-lights-a.png');
    expect(s.bi).toContain('city-lights-b.png');
    for (const f of ['city-lights-a.png', 'city-lights-b.png']) expect(fs.existsSync(`${SITE}/assets/img/${f}`), f).toBe(true);
  });

  const PHONE = { viewport: { width: 390, height: 664 }, screen: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 };
  test('phones get the lite site: stars stand still, no subs or flyers, one still picture under the city', async ({ browser }) => {
    const ctx = await browser.newContext(PHONE);
    const page = await ctx.newPage();
    const errors = await open(page, server.url);
    expect(await page.evaluate(() => document.documentElement.classList.contains('lite'))).toBe(true);
    // the sky is drawn once: two frames apart, the same picture
    const shot = (id) => page.evaluate(sel => document.querySelector(sel).toDataURL(), id);
    const a = await shot('#sky'); await page.waitForTimeout(400);
    expect(await shot('#sky')).toBe(a);
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('.city'), '::before').animationName)).toBe('av');
    // below the city: one canvas as tall as the underground + sea + station, scrolling with the page, no subs
    const d = await page.evaluate(() => {
      const c = document.querySelector('canvas.depths'), z = depths.zones(), r = c.getBoundingClientRect();
      return { pos: getComputedStyle(c).position, top: r.top + scrollY, h: r.height, want: z.stTop + z.stH - z.start, start: z.start, subs: depths.fleet().length };
    });
    expect(d.pos).toBe('absolute');
    expect(Math.abs(d.top - d.start)).toBeLessThan(2);
    expect(d.h).toBeGreaterThanOrEqual(d.want - 2);
    expect(d.subs).toBe(0);
    const deep = await shot('canvas.depths');
    await page.evaluate(() => scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(400);
    expect(await shot('canvas.depths')).toBe(deep);
    // the building lights, the title's shine and the drinks still go
    for (const sel of ['.shine', '.sos']) expect(await page.locator(sel).first().evaluate(n => getComputedStyle(n).animationName)).not.toBe('none');
    expect(await page.locator('.counter .drink').count()).toBeGreaterThan(0);
    // the card in the middle of the screen lights up, as a hover would
    await page.locator('.proj').nth(2).evaluate(n => n.scrollIntoView({ block: 'center' }));
    await expect(page.locator('.proj').nth(2)).toHaveClass(/\blit\b/);
    await expect(page.locator('.proj.lit')).toHaveCount(1);
    // ?full brings everything back
    await page.goto(server.url + 'index.html?full');
    expect(await page.evaluate(() => document.documentElement.classList.contains('lite'))).toBe(false);
    expect(await page.locator('canvas.depths').evaluate(c => getComputedStyle(c).position)).toBe('fixed');
    expect(errors).toEqual([]);
    await ctx.close();
  });

  test('phones: an in-app browser toolbar sliding away resizes nothing', async ({ browser }) => {
    for (const url of ['index.html', 'resume.html', 'contact.html', 'content/projects/kyogre-spirit/index.html']) {
      const ctx = await browser.newContext(PHONE);
      const page = await ctx.newPage();
      await offline(page);
      await page.goto(server.url + url);
      await page.evaluate(() => (window.entriesReady || window.articleReady));
      await page.waitForTimeout(300);
      const measure = () => page.evaluate(() => {
        const out = {};
        for (const sel of ['.hero', '.city', '.station', 'canvas.depths', '.cv', '.tg', '.ar-head', '.ar-ch', '.backdrop .city', '.projects-wrap']) {
          const n = document.querySelector(sel); if (n) { const r = n.getBoundingClientRect(), fixed = !!n.closest('.backdrop'); out[sel] = fixed ? [Math.round(r.height)] : [Math.round(r.height), Math.round(r.top + scrollY)]; }   // the contact page's backdrop is pinned to the window, so only its size counts
        }
        out.page = document.documentElement.scrollHeight;
        return out;
      });
      await page.evaluate(() => scrollTo(0, 600));
      const before = await measure();
      await page.setViewportSize({ width: 390, height: 744 });           // the toolbar slides away
      await page.waitForTimeout(300);
      expect(await measure(), url).toEqual(before);
      await page.setViewportSize({ width: 390, height: 664 });           // and back
      await page.waitForTimeout(300);
      expect(await measure(), url).toEqual(before);
      await ctx.close();
    }
  });

  test('desktop keeps the full site', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await open(page, server.url);
    expect(await page.evaluate(() => document.documentElement.classList.contains('lite'))).toBe(false);
    await expect(page.locator('canvas.depths')).toHaveCount(1);
  });

  test('the top bar stays on one line on a phone; no window frames over the city; no empty toast', async ({ browser }) => {
    for (const w of [320, 360, 390, 430]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: 700 }, isMobile: true, hasTouch: true });
      const page = await ctx.newPage();
      for (const url of ['index.html', 'resume.html', 'contact.html', 'content/projects/kyogre-spirit/index.html']) {
        await offline(page);
        await page.goto(server.url + url);
        const bar = page.locator('.topbar, .ar-bar').first();
        const h = await bar.evaluate(n => { const r = n.querySelector('.brand').getBoundingClientRect(); return { h: r.height, lh: parseFloat(getComputedStyle(n).fontSize) * 2.2, right: Math.max(...[...n.querySelectorAll('a,span')].map(e => e.getBoundingClientRect().right)) }; });
        expect(h.h, url + ' @' + w).toBeLessThan(h.lh);
        expect(h.right, url + ' @' + w).toBeLessThanOrEqual(w);
      }
      await page.goto(server.url + 'index.html');
      await expect(page.locator('.glass')).toHaveCount(0);
      expect(await page.locator('#toast').evaluate(n => getComputedStyle(n).visibility)).toBe('hidden');
      await ctx.close();
    }
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

test.describe('analytics', () => {
  let server;
  test.beforeAll(async () => { server = await startServer(SITE); });
  test.afterAll(async () => { await server.close(); });
  test('Umami: Umami loads on the live domain only, honours Do Not Track, and the footer says so', async ({ page }) => {
  await open(page, server.url);
  const t = await page.evaluate(() => { const s = document.querySelector('script[src*="cloud.umami.is"]'); return s && { id: s.dataset.websiteId, dom: s.dataset.domains, dnt: s.dataset.doNotTrack, wk: typeof window.wkTrack }; });
  expect(t).toEqual({ id: '426494d4-e58a-4337-83a9-103fbc68c98c', dom: 'weymenkoo.github.io', dnt: 'true', wk: 'function' });
  await expect(page.locator('footer')).toContainText('Anonymous visit counts via Umami. No cookies.');
  // no cookies set by the page itself
  expect(await page.context().cookies()).toEqual([]);
});
});
