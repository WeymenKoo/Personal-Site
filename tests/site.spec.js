const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { startServer } = require('./serve');
const { copySite, addEntry, addRecord, addHero, removeExample, SITE } = require('./content');

/* keep tests offline and deterministic */
async function offline(page) {
  await page.route(/open\.spotify\.com|fonts\.(googleapis|gstatic)\.com/, r => r.abort());
}
async function open(page, url) {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await offline(page);
  await page.goto(url + 'index.html');
  await page.evaluate(() => window.entriesReady);
  return errors;
}
const rgb = hex => `rgb(${[1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(', ')})`;

/* ================================================================= */
test.describe('as shipped', () => {
  let server;
  test.beforeAll(async () => { server = await startServer(SITE); });
  test.afterAll(async () => { await server.close(); });

  test('loads with no script errors', async ({ page }) => {
    const errors = await open(page, server.url);
    expect(errors).toEqual([]);
  });

  test('one template of each type renders', async ({ page }) => {
    await open(page, server.url);
    await expect(page.locator('.proj')).toHaveCount(1);
    await expect(page.locator('.tape')).toHaveCount(1);
    await expect(page.locator('.rec')).toHaveCount(1);
    for (const id of ['projectCount', 'tapeCount', 'recordCount']) await expect(page.locator('#' + id)).toHaveText('01');
  });

  test('every missing image falls back to the placeholder, hero included', async ({ page }) => {
    await open(page, server.url);
    await page.evaluate(async () => { for (const i of document.images) if (i.loading === 'lazy') i.loading = 'eager'; });
    // nothing is ever a broken image: real photos load, missing ones become the placeholder
    await page.waitForFunction(() => [...document.images].filter(i => i.getAttribute('src')).every(i => i.complete && i.naturalWidth > 0));
    await expect(page.locator('.print-frame img')).toHaveAttribute('src', /placeholder\.webp$/);
    // the template roll has no photos, so every frame fell back
    const tapeImgs = page.locator('.tape img');
    for (let k = 0; k < await tapeImgs.count(); k++) await expect(tapeImgs.nth(k)).toHaveAttribute('src', /placeholder\.webp$/);
  });
});

/* ================================================================= */
test.describe('adding entries by following the README', () => {
  let server, site;

  test.beforeAll(async () => {
    site = copySite();
    addHero(site);
    addEntry(site, 'projects', 'foc-controller', {
      title: 'Field-oriented motor controller', status: 'wip', statusLabel: 'At fab', year: '2026',
      spec: '50 V · 3-phase · CAN FD', summary: 'A three-phase FOC controller.',
      cover: { src: 'cover.jpg', alt: 'FoC render', fit: 'contain' }, strip: [], link: '',
    }, ['cover.jpg']);
    addEntry(site, 'projects', 'aerodesign', {
      title: 'AeroDesign — the aircraft', status: 'ok', statusLabel: 'Flown', year: '2021',
      spec: 'SAE Advanced Class', summary: 'Wings, then wiring.',
      cover: { src: 'spirit.jpg', alt: 'Spirit', fit: 'cover' },
      strip: [
        { src: 'kyogre.jpg', alt: 'Kyogre', caption: '21–22' },
        { src: 'spirit.jpg', alt: 'Spirit', caption: '22–23' },
        { src: 'shadow.jpg', alt: 'Shadow', caption: '23–24' },
      ],
      link: 'https://github.com/WeymenKoo',
    }, ['spirit.jpg', 'kyogre.jpg', 'shadow.jpg']);
    addEntry(site, 'projects', 'micromouse', {
      title: 'Micromouse', status: 'stop', statusLabel: 'Shelved', year: '2024', spec: 'STM32F411',
      summary: 'Maze solver.', cover: { src: 'cover.jpg', alt: 'Micromouse' }, link: '',
    }, ['cover.jpg']);
    addEntry(site, 'tapes', 'humid-afternoon', {
      title: 'Humid afternoon', location: 'Hanoi', film: 'Portra 400', notes: 'Six frames.',
      song: '75Suv3FnFQji4Lp3ATMLJ1',
      frames: ['01', '02', '03', '04', '05', '06'].map(n => ({ src: n + '.jpg', alt: 'Frame ' + n })),
    }, ['01.jpg', '02.jpg', '03.jpg', '04.jpg', '05.jpg', '06.jpg']);
    addEntry(site, 'tapes', 'waterfront', {
      title: 'Waterfront', location: 'Vancouver', film: 'Gold 200', notes: 'Four.', song: '',
      frames: [
        { src: '01.jpg', alt: 'Dock' }, { src: '02.jpg', alt: 'Wharf' },
        { src: '03.jpg', alt: 'Harbour' }, { src: '04.jpg', alt: 'Cruise ship', width: 12 },
      ],
    }, ['01.jpg', '02.jpg', '03.jpg', '04.jpg']);
    addEntry(site, 'tapes', 'market-days', {
      title: 'Market days', location: 'Vancouver', film: 'HP5', notes: 'Five.', song: '75Suv3FnFQji4Lp3ATMLJ1',
      frames: [
        { src: '01.jpg', alt: 'Market' }, { src: '02.jpg', alt: 'Shopfront' }, { src: '03.jpg', alt: 'Festival' },
        { src: '04.jpg', alt: 'Swap meet', width: 6 }, { src: '05.jpg', alt: 'Lawn', width: 6 },
      ],
    }, ['01.jpg', '02.jpg', '03.jpg', '04.jpg', '05.jpg']);
    removeExample(site);
    addRecord(site, { track: 'TRACK2', title: 'Second song', artist: 'Artist Two', why: 'Second.', sleeve: ['#6FB7C9', '#2E4B8C'], ink: '#F2EEE6' });
    addRecord(site, { track: 'TRACK3', title: 'Third song', artist: 'Artist Three', why: 'Third.', sleeve: ['#111320', '#FF4F9A'], ink: '#FFE3EF' });
    server = await startServer(site);
  });
  test.afterAll(async () => { await server.close(); fs.rmSync(site, { recursive: true, force: true }); });

  test('projects appear in manifest order, numbered A1..A3, example gone', async ({ page }) => {
    await open(page, server.url);
    await expect(page.locator('.proj h3')).toHaveText(['Field-oriented motor controller', 'AeroDesign — the aircraft', 'Micromouse']);
    await expect(page.locator('.proj .no')).toHaveText(['A1', 'A2', 'A3']);
    await expect(page.locator('#projectCount')).toHaveText('03');
    await expect(page.getByText('Project title')).toHaveCount(0);
  });

  test('every project field from the README table renders', async ({ page }) => {
    await open(page, server.url);
    const [foc, aero, mouse] = [0, 1, 2].map(i => page.locator('.proj').nth(i));
    await expect(foc.locator('.st')).toHaveClass(/\bwip\b/);
    await expect(foc.locator('.st')).toHaveText('At fab');
    await expect(aero.locator('.st')).toHaveClass(/\bok\b/);
    await expect(mouse.locator('.st')).toHaveClass(/\bstop\b/);
    await expect(foc.locator('.spec')).toHaveText('50 V · 3-phase · CAN FD');
    await expect(foc.locator('.lcd')).toHaveText('2026');
    await expect(foc.locator('.pic')).toHaveClass(/\bcontain\b/);
    await expect(aero.locator('.pic')).not.toHaveClass(/\bcontain\b/);
    await expect(foc.locator('.strip')).toHaveCount(0);                      // strip: [] hides it
    await expect(mouse.locator('.strip')).toHaveCount(0);                    // strip omitted
    await expect(aero.locator('.strip figcaption')).toHaveText(['21–22', '22–23', '23–24']);
    await expect(foc.locator('.more')).toHaveCount(0);                       // link: "" hides it
    await expect(aero.locator('.more')).toHaveAttribute('href', 'https://github.com/WeymenKoo');
    await expect(aero.locator('.more')).toHaveText('Read →');
  });

  test('tapes: numbering, frame count, big first frame, widths, optional song', async ({ page }) => {
    await open(page, server.url);
    const tapes = page.locator('.tape');
    await expect(tapes.locator('.tape-head .lcd')).toHaveText(['01', '02', '03']);
    await expect(page.locator('#tapeCount')).toHaveText('03');
    await expect(tapes.nth(0).locator('.meta')).toHaveText('HanoiPortra 400 · 6 frames');
    await expect(tapes.nth(1).locator('.meta')).toContainText('4 frames');

    const first = tapes.nth(0).locator('.frames button').first();
    const other = tapes.nth(0).locator('.frames button').nth(1);
    const w = async l => (await l.boundingBox()).width;
    expect(await w(first)).toBeGreaterThan(1.9 * await w(other));           // first frame is the big one

    const full = tapes.nth(1).locator('.frames button').nth(3);
    await expect(full).toHaveClass(/\bw12\b/);
    expect(await w(full)).toBeGreaterThan(0.95 * (await tapes.nth(1).locator('.frames').boundingBox()).width);
    await expect(tapes.nth(2).locator('.frames button.w6')).toHaveCount(2);

    await expect(tapes.nth(0).locator('iframe')).toHaveCount(1);
    await expect(tapes.nth(1).locator('.side')).toHaveCount(0);             // song: "" hides the player
    await expect(tapes.nth(1).locator('.frames button').nth(3)).toHaveAttribute('data-cap', 'Tape 02 · 04');
  });

  test('records: appended in order, first one loaded in the player', async ({ page }) => {
    await open(page, server.url);
    await expect(page.locator('.rec .t')).toHaveText(['Johnny B. Goode', 'Second song', 'Third song']);
    await expect(page.locator('#recordCount')).toHaveText('03');
    await expect(page.locator('.rec').first()).toHaveClass(/\bon\b/);
    await expect(page.locator('#player')).toHaveAttribute('src', /75Suv3FnFQji4Lp3ATMLJ1/);
    await expect(page.locator('#nowTitle')).toHaveText('Johnny B. Goode — Chuck Berry');
  });

  test('every added image actually loads (no placeholders)', async ({ page }) => {
    await open(page, server.url);
    await page.evaluate(() => { for (const i of document.images) i.loading = 'eager'; });
    await page.waitForFunction(() => [...document.images].filter(i => i.getAttribute('src')).every(i => i.complete));
    const bad = await page.evaluate(() => [...document.images]
      .filter(i => i.getAttribute('src') && (i.dataset.ph || !i.naturalWidth)).map(i => i.getAttribute('src')));
    expect(bad).toEqual([]);
  });

  test('clicking a record switches the player', async ({ page }) => {
    await open(page, server.url);
    await page.locator('.rec').nth(2).click();
    await expect(page.locator('#player')).toHaveAttribute('src', /embed\/track\/TRACK3\?/);
    await expect(page.locator('#nowTitle')).toHaveText('Third song — Artist Three');
    await expect(page.locator('.rec.on')).toHaveCount(1);
    await expect(page.locator('.rec').nth(2)).toHaveClass(/\bon\b/);
  });

  test('lightbox: open, caption, arrows wrap within the roll, Esc and backdrop close', async ({ page }) => {
    await open(page, server.url);
    const lb = page.locator('#lb');
    const cap = lb.locator('.cap');
    await page.locator('.tape').nth(1).locator('.frames button').nth(1).click();
    await expect(lb).toHaveClass(/\bshow\b/);
    await expect(cap).toHaveText('Tape 02 · 02');
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
    await page.keyboard.press('ArrowRight'); await expect(cap).toHaveText('Tape 02 · 03');
    await lb.locator('.next').click();       await expect(cap).toHaveText('Tape 02 · 04');
    await lb.locator('.next').click();       await expect(cap).toHaveText('Tape 02 · 01');  // wraps
    await page.keyboard.press('ArrowLeft');  await expect(cap).toHaveText('Tape 02 · 04');
    await lb.locator('.prev').click();       await expect(cap).toHaveText('Tape 02 · 03');
    await expect(lb.locator('img')).toHaveAttribute('src', /content\/tapes\/waterfront\/03\.jpg$/);
    await page.keyboard.press('Escape');
    await expect(lb).not.toHaveClass(/\bshow\b/);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
    await page.locator('.tape').first().locator('.frames button').first().click();
    await lb.click({ position: { x: 5, y: 5 } });
    await expect(lb).not.toHaveClass(/\bshow\b/);
  });
});

/* ================================================================= */
test.describe('resilience', () => {
  let server, site;
  test.beforeAll(async () => {
    site = copySite();
    fs.writeFileSync(path.join(site, 'content/projects/example/entry.json'), '{ "title": "oops", }');  // trailing comma
    const m = JSON.parse(fs.readFileSync(path.join(site, 'content/manifest.json')));
    m.projects.push('not-a-folder');
    addEntry(site, 'projects', 'good', {
      title: 'Good one', status: 'ok', statusLabel: 'Fine', year: '2025', spec: 's', summary: 's',
      cover: { src: 'Cover.JPG', alt: 'wrong case' }, link: '',
    }, ['cover.jpg']);
    m.projects.push('good');
    fs.writeFileSync(path.join(site, 'content/manifest.json'), JSON.stringify(m));
    server = await startServer(site);
  });
  test.afterAll(async () => { await server.close(); fs.rmSync(site, { recursive: true, force: true }); });

  test('a broken or missing entry is skipped and logged; the rest still render', async ({ page }) => {
    const logs = [];
    page.on('console', m => { if (m.text().includes('[entries] skipped')) logs.push(m.text()); });
    await open(page, server.url);
    await expect(page.locator('.proj h3')).toHaveText(['Good one']);
    await expect(page.locator('.proj .no')).toHaveText(['A1']);
    await expect(page.locator('.tape')).toHaveCount(1);
    expect(logs.join('\n')).toContain('projects/example/entry.json');
    expect(logs.join('\n')).toContain('projects/not-a-folder/entry.json');
  });

  test('filenames are case-sensitive, as the README warns', async ({ page }) => {
    await open(page, server.url);
    await expect(page.locator('.proj .pic img')).toHaveAttribute('src', /placeholder\.webp$/);
  });
});

/* ================================================================= */
test.describe('page behaviour', () => {
  let server;
  const HOURS = [
    ['golden', 'Golden hour', '#F4EBDD', null],
    ['side-a', 'Late afternoon', '#EEDCC6', 'A'],
    ['flip', 'Dusk', '#B9A1A2', null],
    ['side-b', 'Blue hour', '#2E3A52', 'B'],
    ['records', 'Night', '#121521', 'Rec'],
    ['off', 'Lights off', '#0B0C12', 'Off'],
  ];
  test.beforeAll(async () => { server = await startServer(SITE); });
  test.afterAll(async () => { await server.close(); });

  test('each section snaps the page to its hour, label and nav follow', async ({ page }) => {
    await open(page, server.url);
    await page.mouse.move(400, 400); await page.mouse.wheel(0, 1);   // arm the fade like a real user
    for (const [id, label, bg, nav] of HOURS) {
      await page.evaluate(id => {
        document.documentElement.style.scrollBehavior = 'auto';
        scrollTo(0, Math.min(document.getElementById(id).offsetTop + 10, document.documentElement.scrollHeight));
      }, id);
      await expect(page.locator('#hourLabel')).toHaveText(label);
      await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bg').trim())).toBe(rgb(bg));
      await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', bg);
      if (nav) await expect(page.locator('.deck nav a.on')).toHaveText(nav);
    }
  });

  test('the change is a short fade, not an instant cut, and ink flips mid-fade', async ({ page }) => {
    await open(page, server.url);
    await page.mouse.move(400, 400); await page.mouse.wheel(0, 1);
    const samples = await page.evaluate(async () => {
      document.documentElement.style.scrollBehavior = 'auto';
      const read = () => { const s = getComputedStyle(document.documentElement); return [s.getPropertyValue('--bg').trim(), s.getPropertyValue('--fg').trim()]; };
      const edge = document.getElementById('flip').offsetTop - innerHeight * 0.55;
      scrollTo(0, edge - 30); await new Promise(r => setTimeout(r, 800));
      const before = read();
      scrollTo(0, edge + 30); await new Promise(r => setTimeout(r, 150));
      const early = read();
      await new Promise(r => setTimeout(r, 800));
      return { before, early, after: read() };
    });
    expect(samples.after[0]).toBe(rgb('#B9A1A2'));
    expect(samples.early[0]).not.toBe(samples.before[0]);   // fading…
    expect(samples.early[0]).not.toBe(samples.after[0]);    // …not cut
    expect(samples.early[1]).toBe(samples.before[1]);       // ink hasn't flipped yet at 150 ms
    expect(samples.after[1]).toBe(rgb('#221A22'));
  });

  test('with reduced motion the hour changes instantly', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await open(page, server.url);
    await page.mouse.move(400, 400); await page.mouse.wheel(0, 1);
    const bg = await page.evaluate(async () => {
      document.documentElement.style.scrollBehavior = 'auto';
      scrollTo(0, document.getElementById('side-b').offsetTop + 10);
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      return getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
    });
    expect(bg).toBe(rgb('#2E3A52'));
    await ctx.close();
  });

  test('tape counter runs 000 at the top to 999 at the bottom', async ({ page }) => {
    await open(page, server.url);
    await expect(page.locator('#counter')).toHaveText('000');
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, document.documentElement.scrollHeight); });
    await expect(page.locator('#counter')).toHaveText('999');
  });

  test('deck nav links jump to their sections', async ({ page }) => {
    await open(page, server.url);
    for (const [href, id] of [['#side-b', 'side-b'], ['#records', 'records'], ['#side-a', 'side-a']]) {
      await page.locator(`.deck nav a[href="${href}"]`).click();
      await expect.poll(() => page.evaluate(id => Math.abs(document.getElementById(id).getBoundingClientRect().top), id)).toBeLessThan(5);
    }
  });

  test('liner notes: two different lines at flip and lights-off', async ({ page }) => {
    await open(page, server.url);
    const a = await page.locator('#flipLine').innerText();
    const b = await page.locator('#offLine').innerText();
    expect(a.length).toBeGreaterThan(5);
    expect(b.length).toBeGreaterThan(5);
    expect(a).not.toBe(b);
  });

  test('favicon and logo are the filled-silhouette toucan', async ({ page, request }) => {
    await open(page, server.url);
    const href = await page.locator('link[rel="icon"]').getAttribute('href');
    const res = await request.get(server.url + href);
    expect(res.ok()).toBe(true);
    expect(await res.text()).toContain('#E0892F');
    await expect(page.locator('svg.mark path[fill="#E0892F"]')).toHaveCount(1);
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

  test('phone width: no sideways scroll, hour label hidden', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await open(page, server.url);
    for (const id of ['golden', 'side-a', 'side-b', 'records', 'off']) {
      await page.evaluate(id => document.getElementById(id).scrollIntoView(), id);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await expect(page.locator('.deck .hr')).toBeHidden();
    await ctx.close();
  });

  test('grain overlay has no blend mode (it froze scrolling before)', async ({ page }) => {
    await open(page, server.url);
    expect(await page.evaluate(() => getComputedStyle(document.body, '::after').mixBlendMode)).toBe('normal');
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
