// The résumé and transcript page (dusk/resume.html), and its exam room.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { startServer } = require('./serve');
const { copySite, SITE } = require('./content');

async function open(page, url) {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await page.goto(url + 'resume.html');
  await page.evaluate(() => window.resumeReady);
  return errors;
}
const WORK = { name: 'work.png', mimeType: 'image/png', buffer: fs.readFileSync(path.join(SITE, 'assets/img/city-dark.png')) };

/* ================================================================= */
test.describe('as shipped', () => {
  let server;
  test.beforeAll(async () => { server = await startServer(SITE); });
  test.afterAll(async () => { await server.close(); });

  test('loads with no errors: work history, then the whole transcript', async ({ page }) => {
    const errors = await open(page, server.url);
    await expect(page.locator('.job h3').first()).toHaveText('B.A.Sc., Electrical Engineering');
    await expect(page.locator('.cv-sec .job', { hasText: 'Tesla' })).toContainText('Test System Engineer');
    await expect(page.locator('.tr-sess')).toHaveCount(6);
    await expect(page.locator('.tr-t tbody tr')).toHaveCount(37);           // 12 + 11 + 1 + 9 + 2 + 2, every row on the record
    await expect(page.locator('#trTotal')).toContainText('69.7%');
    expect(errors).toEqual([]);
  });

  test('nothing identifying is published: no student number, legal name or birthday anywhere', async ({ page, request }) => {
    await open(page, server.url);
    const files = ['resume.html', 'content/transcript.json', 'assets/resume.js'];
    for (const f of files) {
      const s = await (await request.get(server.url + f)).text();
      for (const bad of ['58746975', 'Chen Huan', 'December 14', 'Date of Birth:']) expect(s, f).not.toContain(bad);
    }
    await expect(page.locator('.tr-id .redact')).toHaveCount(3);
    expect(fs.readdirSync(SITE).filter(f => /transcript.*\.pdf$/i.test(f))).toEqual([]);
  });

  test('the two grades under 55% are sealed: not in the page, not in the data', async ({ page, request }) => {
    await open(page, server.url);
    await expect(page.locator('tr.sealed')).toHaveCount(2);
    await expect(page.locator('tr.sealed .code')).toHaveText(['ELEC 202', 'MATH 302']);
    const t = await (await request.get(server.url + 'content/transcript.json')).json();
    const sealed = t.sessions.flatMap(s => s.rows).filter(r => r.exam);
    for (const r of sealed) {
      expect(r.pct).toBeUndefined(); expect(r.letter).toBeUndefined(); expect(r.rec).toBeUndefined();
      expect(r.exam.variants.length).toBeGreaterThanOrEqual(2);
      for (const v of r.exam.variants) { expect(v.ct).toBeTruthy(); expect(v.answer).toBeUndefined(); }
    }
    for (const tr of await page.locator('tr.sealed').all()) await expect(tr.locator('.pct')).toHaveText('██');
  });

  test('bad grades are highlighted, with how far under the class average', async ({ page }) => {
    await open(page, server.url);
    const phys = page.locator('tr[data-code="PHYS_V 158"]');
    await expect(phys).toHaveClass(/\bbad\b/);
    await expect(phys.locator('.vs')).toHaveText('▼ 4 below avg');
    await expect(page.locator('tr[data-code="MATH_V 256"]')).toHaveClass(/\bc\b/);
    await expect(page.locator('tr[data-code="ELEC_V 391"] .vs')).toHaveText('▲ 8 above avg');
    await expect(page.locator('#shame')).toContainText('2 grades under 55%, sealed');
  });

  test('the exam: question as an image, ten minutes, upload required', async ({ page }) => {
    await open(page, server.url);
    await page.locator('tr[data-code="MATH_V 302"] .sit').click();
    await expect(page.locator('#exam')).toBeVisible();
    await expect(page.locator('#examTitle')).toHaveText('MATH 302 · Introduction to Probability');
    await expect(page.locator('#examClock')).toHaveText(/^(10:00|9:5\d)$/);
    expect(await page.locator('#exam').evaluate(e => e.innerText)).not.toContain('Poisson(4)');   // not selectable text
    await page.fill('#examAns', '1/3');
    await expect(page.locator('#examSubmit')).toBeDisabled();                                      // no working, no hand-in
    await expect(page.locator('#examFile')).toHaveAttribute('accept', 'image/*,application/pdf');
    await page.locator('#examQuit').click();
    await expect(page.locator('#exam')).toBeHidden();
  });
});

/* ================================================================= */
test.describe('unsealing, with a grade sealed by the test itself', () => {
  let server, site;
  const ANSWERS = ['0.4167', '2.0000'];       // 5/12, and 2
  test.beforeAll(async () => {
    site = copySite();
    const f = path.join(site, 'content', 'transcript.json');
    const t = JSON.parse(fs.readFileSync(f, 'utf8'));
    const r = t.sessions.flatMap(s => s.rows).find(r => r.code === 'MATH_V 302');
    // sealed here at 1000 iterations (the real ones use 150 000) so the test is quick
    r.exam.variants = ANSWERS.map((a, i) => {
      const s = require('crypto'); const salt = s.randomBytes(16), iv = s.randomBytes(12);
      const key = s.pbkdf2Sync(a, salt, 1000, 32, 'sha256'); const c = s.createCipheriv('aes-256-gcm', key, iv);
      const ct = Buffer.concat([c.update(JSON.stringify({ pct: 41, letter: 'F', rec: '0.0' })), c.final(), c.getAuthTag()]);
      return { lines: ['TEST QUESTION ' + i], ask: 'the answer', salt: salt.toString('base64'), iv: iv.toString('base64'), ct: ct.toString('base64'), iter: 1000 };
    });
    fs.writeFileSync(f, JSON.stringify(t));
    server = await startServer(site);
  });
  test.afterAll(async () => { await server.close(); fs.rmSync(site, { recursive: true, force: true }); });

  async function sit(page) {
    await page.locator('tr[data-code="MATH_V 302"] .sit').click();
    return Number(await page.locator('#exam').getAttribute('data-variant'));
  }

  test('the right answer, in any exact or decimal form, unseals the grade', async ({ page }) => {
    await open(page, server.url);
    const v = await sit(page);
    await page.setInputFiles('#examFile', WORK);
    await expect(page.locator('#upThumb')).toBeVisible();
    await page.fill('#examAns', v === 0 ? '5/12' : '4/2');
    await page.locator('#examSubmit').click();
    await expect(page.locator('#examMsg')).toContainText('Correct', { timeout: 10000 });
    const tr = page.locator('tr[data-code="MATH_V 302"]');
    await expect(tr.locator('.pct')).toHaveText('41');
    await expect(tr.locator('.let')).toHaveText('F');
    await expect(tr.locator('.vs')).toHaveText('▼ 29 below avg');
  });

  test('a wrong answer leaves it sealed, and a retake is a different question', async ({ page }) => {
    await open(page, server.url);
    const v = await sit(page);
    await page.setInputFiles('#examFile', WORK);
    await page.fill('#examAns', '0.5');
    await page.locator('#examSubmit').click();
    await expect(page.locator('#examMsg')).toContainText('Incorrect', { timeout: 10000 });
    await expect(page.locator('#examSubmit')).toBeDisabled();
    await page.locator('#examQuit').click();
    await expect(page.locator('tr[data-code="MATH_V 302"] .pct')).toHaveText('██');
    expect(await sit(page)).not.toBe(v);
  });

  test('pens down at 10:00', async ({ page }) => {
    await page.clock.install();
    await open(page, server.url);
    await sit(page);
    await page.setInputFiles('#examFile', WORK);
    await page.fill('#examAns', '1');
    await page.clock.fastForward('10:01');
    await expect(page.locator('#examMsg')).toContainText('Pens down');
    await expect(page.locator('#examSubmit')).toBeDisabled();
    await expect(page.locator('#examClock')).toHaveText('0:00');
  });

  test('leaving the tab twice voids the attempt', async ({ page }) => {
    await open(page, server.url);
    await sit(page);
    const leave = () => page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
      Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    });
    await leave();
    await expect(page.locator('#examMsg')).toContainText('Once more');
    await leave();
    await expect(page.locator('#examMsg')).toContainText('void');
    await expect(page.locator('#examSubmit')).toBeDisabled();
  });

  test('the answer box reads fractions, sqrt and pi, and nothing else', async ({ page }) => {
    await open(page, server.url);
    const r = await page.evaluate(() => ['5/12', '0.4167', 'sqrt(2)/2', '1/sqrt(2)', '2pi', '3/80', 'alert(1)', '1/0'].map(window.resumeExam.evaluate));
    expect(r[0]).toBeCloseTo(5 / 12, 9); expect(r[1]).toBeCloseTo(0.4167, 9);
    expect(r[2]).toBeCloseTo(Math.SQRT1_2, 9); expect(r[3]).toBeCloseTo(Math.SQRT1_2, 9);
    expect(r[4]).toBeCloseTo(2 * Math.PI, 9); expect(r[5]).toBeCloseTo(0.0375, 9);
    expect(r[6]).toBeNull(); expect(r[7]).toBeNull();
  });
});
