// The résumé page (dusk/resume.html): work history only.
const { test, expect } = require('@playwright/test');
const { startServer } = require('./serve');
const { SITE } = require('./content');

let server;
test.beforeAll(async () => { server = await startServer(SITE); });
test.afterAll(async () => { await server.close(); });

test('the work history renders, with no errors and no transcript', async ({ page, request }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route(/fonts\.(googleapis|gstatic)\.com|cloud\.umami\.is/, r => r.abort());
  await page.goto(server.url + 'resume.html');
  await expect(page.locator('h1')).toHaveText('Weymen Koo');
  await expect(page.locator('.cv-sec h2')).toHaveText(['Education', 'Skills', 'Experience', 'Projects', 'Earlier experience']);
  await expect(page.locator('.cv-sec .job', { hasText: 'Tesla' })).toContainText('Test System Engineer');
  for (const slug of ['power-board', 'foc-controller', 'dc-load'])
    await expect(page.locator(`.cv-sec .job a.proj-link[href="content/projects/${slug}/index.html"]`)).toHaveCount(1);
  await expect(page.locator('#transcript, .tr-paper, #exam')).toHaveCount(0);
  expect((await request.get(server.url + 'content/transcript.json')).status()).toBe(404);
  expect(errors).toEqual([]);
});
