// The telegraph contact page (dusk/contact.html).
const { test, expect } = require('@playwright/test');
const { startServer } = require('./serve');
const { SITE } = require('./content');
const { run } = require('../tools/stamp');

let server;
test.beforeAll(async () => { server = await startServer(SITE); });
test.afterAll(async () => { await server.close(); });

async function open(page) {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await page.goto(server.url + 'contact.html');
  return errors;
}
/* key a word on the telegraph with the mouse: '.' short press, '-' long, ' ' letter gap */
async function tap(page, pattern) {
  const box = await page.locator('#key').boundingBox();
  await page.mouse.move(box.x + box.width * .7, box.y + box.height * .4);
  for (const c of pattern) {
    if (c === ' ') { await page.waitForTimeout(800); continue; }
    await page.mouse.down();
    await page.waitForTimeout(c === '-' ? 320 : 60);
    await page.mouse.up();
    await page.waitForTimeout(110);
  }
  await page.waitForTimeout(800);
}

test('email and phone are on the cheat sheet in plain sight; the message line starts closed', async ({ page }) => {
  const errors = await open(page);
  await expect(page.locator('#plainEmail')).toBeVisible();
  await expect(page.locator('#plainEmail')).toHaveText('kchweymen@gmail.com');
  await expect(page.locator('#plainEmail')).toHaveAttribute('href', 'mailto:kchweymen@gmail.com');
  await expect(page.locator('#plainPhone')).toHaveText('+1 604 968 9695');
  await expect(page.locator('#plainPhone')).toHaveAttribute('href', 'tel:+16049689695');
  await expect(page.locator('#line')).toBeHidden();
  expect(errors).toEqual([]);
});

test('the sheet lists A to Z and 0 to 9', async ({ page }) => {
  await open(page);
  await expect(page.locator('#codes span')).toHaveCount(36);
  await expect(page.locator('#codes span').nth(7)).toHaveText('H····');
  await expect(page.locator('#codes span').nth(18)).toHaveText('S···');
  await expect(page.locator('#codes span').nth(14)).toHaveText('O−−−');
});

test('tapping HI on the key opens the message line', async ({ page }) => {
  await open(page);
  await tap(page, '.... ..');
  await expect(page.locator('#tapeText')).toHaveText(/HI/);
  await expect(page.locator('#line')).toBeVisible();
  await expect(page.locator('#toast')).toContainText('Line open');
});

test('dashes work, and the space bar is the key too: SOS also opens the line', async ({ page }) => {
  await open(page);
  const press = async ms => { await page.keyboard.down('Space'); await page.waitForTimeout(ms); await page.keyboard.up('Space'); await page.waitForTimeout(110); };
  for (const letter of ['...', '---', '...']) {
    for (const c of letter) await press(c === '-' ? 320 : 60);
    await page.waitForTimeout(800);
  }
  await expect(page.locator('#tapeText')).toHaveText(/SOS/);
  await expect(page.locator('#line')).toBeVisible();
});

test('anything else leaves it closed; the tape can be cleared', async ({ page }) => {
  await open(page);
  await tap(page, '. .');
  await expect(page.locator('#tapeText')).toHaveText(/EE/);
  await expect(page.locator('#line')).toBeHidden();
  await page.locator('#clearTape').click();
  await expect(page.locator('#tapeText')).toHaveText('');
});

test('the message is words only: no file input, and it goes out by email or text', async ({ page }) => {
  await open(page);
  await tap(page, '.... ..');
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
  // an empty telegram isn't sent
  await page.locator('#sendEmail').click();
  await expect(page.locator('#toast')).toContainText('blank');
  await page.fill('#from', 'Ada');
  await page.fill('#msg', 'Hello & 73');
  await expect(page.locator('#count')).toHaveText('10 / 1500');
  const mail = await page.locator('#sendEmail').getAttribute('href');
  expect(mail.startsWith('mailto:kchweymen@gmail.com?subject=')).toBe(true);
  expect(decodeURIComponent(mail.split('&body=')[1])).toBe('Hello & 73\n\n— Ada');
  const sms = await page.locator('#sendText').getAttribute('href');
  expect(sms.startsWith('sms:+16049689695?&body=')).toBe(true);
  // the message is echoed in Morse under the box
  await expect(page.locator('#echo')).toContainText('···· ·');
});

test('a dropped file is turned away', async ({ page }) => {
  await open(page);
  await tap(page, '.... ..');
  const refused = await page.evaluate(() => {
    const dt = new DataTransfer();
    dt.items.add(new File(['x'], 'resume.pdf', { type: 'application/pdf' }));
    const e = new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true });
    document.getElementById('msg').dispatchEvent(e);
    return e.defaultPrevented;
  });
  expect(refused).toBe(true);
  await expect(page.locator('#toast')).toContainText('No files');
  await expect(page.locator('#msg')).toHaveValue('');
});

test('same look as the front page, in both themes; fits a phone', async ({ browser }) => {
  for (const scheme of ['dark', 'light']) {
    const ctx = await browser.newContext({ colorScheme: scheme, viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await open(page);
    expect(await page.locator('.backdrop .city').evaluate(e => getComputedStyle(e).backgroundImage)).toContain(`city-${scheme}.png`);
    expect(await page.evaluate(() => getComputedStyle(document.body).cursor)).toContain('cursor.svg');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await ctx.close();
  }
});

test('the front page links here from the top bar and the footer', async ({ page }) => {
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await page.goto(server.url + 'index.html');
  await expect(page.locator('.topbar nav a', { hasText: 'Contact' })).toHaveAttribute('href', 'contact.html');
  await page.locator('#contact a.telegram').click();
  await expect(page).toHaveURL(/contact\.html$/);
  await expect(page.locator('h1')).toHaveText('Send a telegram.');
});

test('asset links carry the current stamp (run: npm run stamp)', () => {
  const { stale } = run(true);
  expect(stale, 'stale ?v= stamps: run `npm run stamp` and commit').toEqual([]);
});
