// Article pages ("Read →"): follows dusk/README.md "Writing an article".
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const { startServer } = require('./serve');
const { copySite, addEntry, SITE } = require('./content');

async function offline(page) {
  await page.route(/open\.spotify\.com|fonts\.(googleapis|gstatic)\.com/, r => r.abort());
}
async function openArticle(page, url) {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await offline(page);
  await page.goto(url);
  await page.evaluate(() => window.articleReady);
  return errors;
}
const ARTICLE = 'content/projects/writeup/index.html';

/* one of everything the README's "Writing an article" table lists */
const MARKDOWN = `---
title: The long title
subtitle: One sentence under it.
team: Individual work
role: Design, layout, bring-up
date: 2024
---

The opening paragraph, with a number: \`5 V\`.

| | |
|---|---|
| Bus | 12S LiPo |
| MCU | STM32G431 |

## First chapter

Body text, with ~~one~~ two ideas.

![A single image](cover.jpg "A caption with *emphasis*.")

### A smaller heading

- [ ] Option one
- [x] Option two, the one picked

## The label | Second chapter

![Left image](cover.jpg "Left")
![Right image](cover.jpg "Right")

![A wide image](cover.jpg#wide)

> Words lifted off a slide.
> — Design review, Jan 2024

| Before | | After |
|---|---|---|
| Two layers | → | Six layers |

## Third chapter

<div class="ar-chat">
<span class="who">A team member</span>
<span class="typing" aria-hidden="true"><i></i><i></i><i></i></span>
<div class="msg">I think we have a problem</div>
<span class="seen">Seen <b>✓✓</b><br>05:23 AM</span>
</div>

Read the [datasheet](https://example.com/ds.pdf).

## Last chapter

The end.
`;

test.describe('writing an article by following the README', () => {
  let server, site;

  test.beforeAll(async () => {
    site = copySite();
    // step 1: copying the template folder brings article.md and the page that shows it
    addEntry(site, 'projects', 'writeup', {
      title: 'A write-up', status: 'ok', statusLabel: 'Flown', year: '2024',
      spec: 'One · two · three', summary: 'Has an article.',
      cover: { src: 'cover.jpg', alt: 'Cover' }, strip: [], link: ARTICLE,   // step 2: point the card at it
    }, ['cover.jpg']);
    addEntry(site, 'projects', 'untouched', {
      title: 'Straight from the template', status: 'wip', statusLabel: 'In progress', year: '2024',
      spec: 's', summary: 's', cover: { src: 'cover.jpg', alt: 'Cover' }, link: 'content/projects/untouched/index.html',
    }, ['cover.jpg']);
    addEntry(site, 'projects', 'unwritten', {
      title: 'Not written yet', status: 'idle', statusLabel: 'Idle', year: '2024',
      spec: 's', summary: 's', cover: { src: 'cover.jpg', alt: 'Cover' }, link: '',
    }, ['cover.jpg']);
    fs.writeFileSync(`${site}/content/projects/writeup/article.md`, MARKDOWN);   // step 3: write article.md
    fs.rmSync(`${site}/content/projects/unwritten/article.md`);
    server = await startServer(site);
  });
  test.afterAll(async () => { await server.close(); fs.rmSync(site, { recursive: true, force: true }); });

  test('the template ships in the example folder, so a copied project already has both files', async () => {
    expect(fs.existsSync(`${site}/content/projects/untouched/index.html`)).toBe(true);
    expect(fs.existsSync(`${site}/content/projects/untouched/article.md`)).toBe(true);
  });

  test('the page in every project folder is the same file: nothing in it to edit', async () => {
    const shell = fs.readFileSync(`${SITE}/content/projects/example/index.html`, 'utf8');
    for (const slug of fs.readdirSync(`${SITE}/content/projects`)) {
      expect(fs.readFileSync(`${SITE}/content/projects/${slug}/index.html`, 'utf8'), slug).toBe(shell);
    }
  });

  test('the untouched template renders as an article', async ({ page }) => {
    const errors = await openArticle(page, server.url + 'content/projects/untouched/index.html');
    await expect(page.locator('.ar-head h1')).toContainText('PLACEHOLDER');
    await expect(page.locator('section.ar-ch')).toHaveCount(2);
    await expect(page.locator('.ar-kick span')).toHaveText('Small label');
    expect(errors).toEqual([]);
  });

  test('"Read →" on the card opens the article', async ({ page }) => {
    await offline(page);
    await page.goto(server.url + 'index.html');
    await page.evaluate(() => window.entriesReady);
    const card = page.locator('.proj', { hasText: 'A write-up' });
    await card.locator('.more').click();
    await expect(page).toHaveURL(new RegExp(ARTICLE.replace(/\./g, '\\.') + '$'));
    await expect(page.locator('.ar-head h1')).toHaveText('The long title');
  });

  test('loads with no script errors (no lightbox on the page)', async ({ page }) => {
    const errors = await openArticle(page, server.url + ARTICLE);
    await page.mouse.wheel(0, 3000);
    await page.waitForTimeout(300);
    expect(errors).toEqual([]);
  });

  test('the header: title and details from article.md, status from entry.json', async ({ page }) => {
    await openArticle(page, server.url + ARTICLE);
    await expect(page).toHaveTitle('The long title — Weymen Koo');
    await expect(page.locator('.ar-head .st')).toHaveText('Flown');
    await expect(page.locator('.ar-head .st')).toHaveClass(/\bok\b/);
    await expect(page.locator('.ar-sub')).toHaveText('One sentence under it.');
    await expect(page.locator('.ar-meta')).toHaveText('Individual workRole/ Design, layout, bring-upDate/ 2024');
    await expect(page.locator('p.ar-lead')).toContainText('The opening paragraph');
  });

  test('each ## heading is a numbered chapter, with an optional small label', async ({ page }) => {
    await openArticle(page, server.url + ARTICLE);
    await expect(page.locator('section.ar-ch h2')).toHaveText(['First chapter', 'Second chapter', 'Third chapter', 'Last chapter']);
    await expect(page.locator('.ar-kick b')).toHaveText(['01', '02', '03', '04']);
    await expect(page.locator('section.ar-ch').nth(1).locator('.ar-kick span')).toHaveText('The label');
    await expect(page.locator('section.ar-ch').nth(0).locator('.ar-kick span')).toHaveCount(0);
    await expect(page.locator('.deck nav a')).toHaveText(['01', '02', '03', '04']);
  });

  test('chapters walk the page through the hours, golden to lights off', async ({ page }) => {
    await openArticle(page, server.url + ARTICLE);
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
    await expect(page.locator('#hourLabel')).toHaveText('Golden hour');
    for (const [id, label] of [['first-chapter', 'Late afternoon'], ['the-label', 'Dusk'], ['third-chapter', 'Blue hour'], ['last-chapter', 'Lights off']]) {
      await page.evaluate(i => document.getElementById(i).scrollIntoView(), id);
      await expect(page.locator('#hourLabel')).toHaveText(label);
    }
    await expect(page.locator('.deck nav a.on')).toHaveText('04');
  });

  test('Markdown turns into the article components', async ({ page }) => {
    await openArticle(page, server.url + ARTICLE);
    // one image on its own line: a figure, with the "title" as its caption
    const fig = page.locator('figure.ar-fig').first();
    await expect(fig.locator('img')).toHaveAttribute('alt', 'A single image');
    await expect(fig.locator('figcaption em')).toHaveText('emphasis');
    // clicking a figure opens the full-size file
    await expect(fig.locator('a.ar-full')).toHaveAttribute('href', 'cover.jpg');
    await expect(fig.locator('a.ar-full')).toHaveAttribute('target', '_blank');
    // two on consecutive lines: side by side; #wide after the file name: a wider figure
    await expect(page.locator('.ar-grid.two figure')).toHaveCount(2);
    await expect(page.locator('figure.ar-fig.wide img')).toHaveAttribute('src', 'cover.jpg');
    // a quote, with its source line
    await expect(page.locator('blockquote.ar-slide p')).toHaveText('Words lifted off a slide.');
    await expect(page.locator('blockquote.ar-slide cite')).toHaveText('— Design review, Jan 2024');
    // tables: an empty header row is dropped; a lone arrow gets the accent
    await expect(page.locator('table.ar-table.nohead thead')).toBeHidden();
    await expect(page.locator('table.ar-table.nohead td').first()).toHaveText('Bus');
    await expect(page.locator('table.ar-table td.arrow')).toHaveText('→');
    // checklist, numbers, strike-through, outside links
    await expect(page.locator('ul.ar-check li')).toHaveCount(2);
    await expect(page.locator('ul.ar-check li.done')).toHaveText('Option two, the one picked');
    await expect(page.locator('p.ar-lead .ar-num')).toHaveText('5 V');
    await expect(page.locator('.ar-strike')).toHaveText('one');
    await expect(page.locator('a[href="https://example.com/ds.pdf"]')).toHaveAttribute('target', '_blank');
  });

  test('every image loads from the project folder', async ({ page }) => {
    await openArticle(page, server.url + ARTICLE);
    await page.evaluate(() => { for (const i of document.images) i.loading = 'eager'; });
    await page.waitForFunction(() => [...document.images].every(i => i.complete));
    expect(await page.evaluate(() => [...document.images].filter(i => !i.naturalWidth).map(i => i.getAttribute('src')))).toEqual([]);
    expect(await page.locator('.ar img').count()).toBe(4);
  });

  test('a hand-written HTML block passes through: the text message types, then appears', async ({ page }) => {
    await openArticle(page, server.url + ARTICLE);
    const msg = page.locator('.ar-chat .msg').first();
    await page.locator('.ar-chat').first().scrollIntoViewIfNeeded();
    await expect(msg).toHaveCSS('opacity', '1', { timeout: 4000 });
  });

  test('without JavaScript the page points at the Markdown file', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await offline(page);
    await page.goto(server.url + ARTICLE);
    await expect(page.locator('a[href="article.md"]')).toBeVisible();
    await ctx.close();
  });

  test('a liner note renders at the end', async ({ page }) => {
    await openArticle(page, server.url + ARTICLE);
    await expect(page.locator('#offLine .lsrc')).not.toBeEmpty();
  });

  test('the back links return to Side A, and no request escapes /Personal-Site/', async ({ page }) => {
    const escaped = [];
    page.on('request', r => {
      const u = new URL(r.url());
      if (u.hostname === 'localhost' && !u.pathname.startsWith('/Personal-Site/')) escaped.push(u.pathname);
    });
    await openArticle(page, server.url + ARTICLE);
    await page.waitForLoadState('networkidle');
    expect(escaped).toEqual([]);
    await page.locator('.ar-end a').click();
    await expect(page).toHaveURL(/\/Personal-Site\/index\.html#side-a$/);
  });

  test('phone width: no sideways scroll', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await openArticle(page, server.url + ARTICLE);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    await ctx.close();
  });

  test('a folder with no article.md says so instead of breaking', async ({ page }) => {
    const errors = await openArticle(page, server.url + 'content/projects/unwritten/index.html');
    await expect(page.locator('.ar-head h1')).toHaveText('Nothing to read yet.');
    await page.locator('.ar-bar a').click();
    await expect(page).toHaveURL(/\/Personal-Site\/index\.html#side-a$/);
    expect(errors).toEqual([]);
  });
});

/* ================================================================= */
test.describe('the five articles, as shipped', () => {
  let server;
  const SLUGS = ['fc-som', 'foc-controller', 'power-board', 'avionics-2024', 'kyogre-spirit', 'dc-load', 'micromouse'];
  const url = slug => `content/projects/${slug}/index.html`;
  test.beforeAll(async () => { server = await startServer(SITE); });
  test.afterAll(async () => { await server.close(); });

  test('each card links to its own article', async ({ page }) => {
    await offline(page);
    await page.goto(server.url + 'index.html');
    await page.evaluate(() => window.entriesReady);
    for (const [i, slug] of SLUGS.entries()) await expect(page.locator('.proj .more').nth(i)).toHaveAttribute('href', url(slug));
  });

  for (const slug of SLUGS) {
    test(`${slug}: every image loads and has alt text, with no script errors`, async ({ page }) => {
      const errors = await openArticle(page, server.url + url(slug));
      await expect(page.locator('section.ar-ch').first()).toBeVisible();
      await page.evaluate(() => { for (const i of document.images) i.loading = 'eager'; });
      await page.waitForFunction(() => [...document.images].every(i => i.complete), null, { timeout: 15000 });
      const broken = await page.evaluate(() => [...document.images].filter(i => !i.naturalWidth).map(i => i.getAttribute('src')));
      expect(broken).toEqual([]);
      const noAlt = await page.evaluate(() => [...document.images].filter(i => !(i.getAttribute('alt') || '').trim()).map(i => i.getAttribute('src')));
      expect(noAlt).toEqual([]);
      expect(errors).toEqual([]);
    });

    test(`${slug}: ends with the lights off, and fits a phone`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const page = await ctx.newPage();
      await openArticle(page, server.url + url(slug));
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
      // lazy images keep growing the page, so keep jumping to the bottom until it stops
      await expect.poll(() => page.evaluate(() => {
        document.documentElement.style.scrollBehavior = 'auto';
        scrollTo(0, document.documentElement.scrollHeight);
        return document.getElementById('hourLabel').textContent;
      }), { timeout: 10000 }).toBe('Lights off');
      await ctx.close();
    });

    test(`${slug}: no leftover PLACEHOLDER text, and no single image over 1 MB`, async () => {
      const dir = `${SITE}/content/projects/${slug}`;
      expect(fs.readFileSync(`${dir}/article.md`, 'utf8') + fs.readFileSync(`${dir}/entry.json`, 'utf8')).not.toContain('PLACEHOLDER');
      const big = fs.readdirSync(dir).filter(f => /\.(gif|jpe?g|png|webp)$/i.test(f) && fs.statSync(`${dir}/${f}`).size > 1024 * 1024);
      expect(big).toEqual([]);
    });
  }

  test('power-board: one chapter per stage, walking golden hour to lights off', async ({ page }) => {
    await openArticle(page, server.url + url('power-board'));
    await expect(page.locator('section.ar-ch h2')).toHaveText([
      'Power flow', 'Input eFuse and reverse polarity', '5 V, 15 A: LM5146', 'Output eFuse and current sense',
      'Connectors', 'PCB layout', 'The flight controller (not my design)', 'SAE Aero Design 2025',
    ]);
    // load every image first: a lazy image arriving mid-test moves the chapters under the check
    await page.evaluate(async () => {
      document.documentElement.style.scrollBehavior = 'auto';
      for (const i of document.images) i.loading = 'eager';
      await Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
    });
    for (const [id, label] of [['power-flow', 'Late afternoon'], ['buck-converter', 'Dusk'], ['connectors', 'Blue hour'], ['flight-controller-v2', 'Night'], ['sae-aero-design-2025', 'Lights off']]) {
      await expect.poll(() => page.evaluate(i => { document.getElementById(i).scrollIntoView(); return document.getElementById('hourLabel').textContent; }, id)).toBe(label);
    }
    // every schematic sheet after the top one is shown, and the results link goes to SAE
    await expect(page.locator('img[src^="sch-"]')).toHaveCount(4);
    await expect(page.locator('a[href*="saeaerodesign.com"]')).toHaveAttribute('target', '_blank');
  });
});
