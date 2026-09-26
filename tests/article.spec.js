// Article pages ("Read →"): follows dusk/README.md "Writing an article".
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const { startServer } = require('./serve');
const { copySite, addEntry } = require('./content');

async function offline(page) {
  await page.route(/open\.spotify\.com|fonts\.(googleapis|gstatic)\.com/, r => r.abort());
}
const ARTICLE = 'content/projects/writeup/index.html';

test.describe('writing an article by following the README', () => {
  let server, site;

  test.beforeAll(async () => {
    site = copySite();
    // steps 1–2: the template comes with the copied folder; point the card at it
    addEntry(site, 'projects', 'writeup', {
      title: 'A write-up', status: 'ok', statusLabel: 'Flown', year: '2024',
      spec: 'One · two · three', summary: 'Has an article.',
      cover: { src: 'cover.jpg', alt: 'Cover' }, strip: [], link: ARTICLE,
    }, ['cover.jpg']);
    server = await startServer(site);
  });
  test.afterAll(async () => { await server.close(); fs.rmSync(site, { recursive: true, force: true }); });

  async function openArticle(page) {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await offline(page);
    await page.goto(server.url + ARTICLE);
    return errors;
  }

  test('the template ships in the example folder, so a copied project already has one', async () => {
    expect(fs.existsSync(`${site}/content/projects/writeup/index.html`)).toBe(true);
  });

  test('"Read →" on the card opens the article', async ({ page }) => {
    await offline(page);
    await page.goto(server.url + 'index.html');
    await page.evaluate(() => window.entriesReady);
    const card = page.locator('.proj', { hasText: 'A write-up' });
    await card.locator('.more').click();
    await expect(page).toHaveURL(new RegExp(ARTICLE.replace(/\./g, '\\.') + '$'));
  });

  test('loads with no script errors (no lightbox on the page)', async ({ page }) => {
    const errors = await openArticle(page);
    await page.mouse.wheel(0, 3000);
    await page.waitForTimeout(300);
    expect(errors).toEqual([]);
  });

  test('sections snap the page to their hour, like the homepage', async ({ page }) => {
    await openArticle(page);
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
    for (const [id, label] of [['one', 'Late afternoon'], ['two', 'Night'], ['end', 'Lights off']]) {
      await page.evaluate(i => document.getElementById(i).scrollIntoView(), id);
      await expect(page.locator('#hourLabel')).toHaveText(label);
    }
  });

  test('the text message types, then appears once scrolled to', async ({ page }) => {
    await openArticle(page);
    const msg = page.locator('.ar-chat .msg').first();
    await page.locator('.ar-chat').first().scrollIntoViewIfNeeded();
    await expect(msg).toHaveCSS('opacity', '1', { timeout: 4000 });
  });

  test('without JavaScript the message is still readable', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await offline(page);
    await page.goto(server.url + ARTICLE);
    await expect(page.locator('.ar-chat .msg').first()).toHaveCSS('opacity', '1');
    await expect(page.locator('.ar-chat .typing').first()).toBeHidden();
    await ctx.close();
  });

  test('a liner note renders at the end', async ({ page }) => {
    await openArticle(page);
    await expect(page.locator('#offLine .lsrc')).not.toBeEmpty();
  });

  test('the back links return to Side A, and no request escapes /Personal-Site/', async ({ page }) => {
    const escaped = [];
    page.on('request', r => {
      const u = new URL(r.url());
      if (u.hostname === 'localhost' && !u.pathname.startsWith('/Personal-Site/')) escaped.push(u.pathname);
    });
    await openArticle(page);
    await page.waitForLoadState('networkidle');
    expect(escaped).toEqual([]);
    await page.locator('.ar-end a').click();
    await expect(page).toHaveURL(/\/Personal-Site\/index\.html#side-a$/);
  });

  test('phone width: no sideways scroll', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await offline(page);
    await page.goto(server.url + ARTICLE);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    await ctx.close();
  });
});
