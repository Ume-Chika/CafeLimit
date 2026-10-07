import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle0' });

  const canvas = await page.$('canvas');
  if (canvas) {
    const box = await canvas.boundingBox();
    if (box) {
      // 08:00 is around x: ~23% of canvas, y: ~20%
      await page.mouse.click(box.x + box.width * 0.22, box.y + box.height * 0.22);
      await new Promise((r) => setTimeout(r, 600));
      await page.screenshot({ path: 'screenshot-event-dot-popover-8am.png', fullPage: false });
      console.log('Saved screenshot-event-dot-popover-8am.png');
    }
  }

  await browser.close();
})();
