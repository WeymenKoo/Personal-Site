// Scrolls the page top to bottom in headless Chromium and reports frame times.
// 16.7 ms = 60 fps. p95 above ~20 ms means you're dropping frames.
//
//   npm run serve &
//   npm run profile -- [url] ["css to inject for an A/B test"]

const { chromium } = require('@playwright/test');

const url = process.argv[2] || 'http://localhost:8000/Personal-Site/index.html';
const css = process.argv[3] || '';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await page.route(/spotify|fonts\.g/, r => r.abort());
  await page.goto(url, { waitUntil: 'load' });
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' + css });
  await page.waitForTimeout(500);

  const r = await page.evaluate(async () => {
    const frames = [];
    let last = performance.now(), running = true;
    (function f(t) { frames.push(t - last); last = t; if (running) requestAnimationFrame(f); })(last);
    const max = document.documentElement.scrollHeight - innerHeight;
    for (let y = 0; y <= max; y += 60) {
      scrollTo(0, y);
      await new Promise(res => requestAnimationFrame(res));
    }
    running = false;
    frames.shift();
    frames.sort((a, b) => a - b);
    const avg = frames.reduce((a, b) => a + b, 0) / frames.length;
    return { frames: frames.length, avg: avg.toFixed(1), p95: frames[Math.floor(frames.length * .95)].toFixed(1), worst: frames.at(-1).toFixed(1) };
  });

  console.log(`frames ${r.frames}   avg ${r.avg} ms   p95 ${r.p95} ms   worst ${r.worst} ms`);
  await browser.close();
})();
