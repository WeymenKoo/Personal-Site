// Prints the web deck to a PDF, one 1920 × 1080 page per slide.
// Uses the same Chromium the test suite installs (@playwright/test).
const path = require('path');
const { startServer } = require('../../tests/serve');

async function buildPdf(siteDir, outFile) {
  const { chromium } = require('@playwright/test');
  const server = await startServer(path.join(siteDir, '..'), '/Personal-Site/');
  // CHROMIUM_PATH: use an existing Chromium when Playwright can't download its own
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  try {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await page.goto(server.url + 'portfolio/index.html', { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      for (const i of document.images) i.loading = 'eager';
      await document.fonts.ready;
      await Promise.all([...document.images].map(i => i.complete ? null : new Promise(r => { i.onload = i.onerror = r; })));
    });
    await page.emulateMedia({ media: 'print' });
    await page.pdf({ path: outFile, width: '1920px', height: '1080px', printBackground: true, preferCSSPageSize: true });
  } finally {
    await browser.close();
    await server.close();
  }
  return outFile;
}

module.exports = { buildPdf };
