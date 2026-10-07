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
      // 08:00 AM is around x: ~16% of canvas, y: ~50%
      await page.mouse.click(box.x + box.width * 0.16, box.y + box.height * 0.5);
      await new Promise((r) => setTimeout(r, 600));
      await page.screenshot({ path: 'screenshot-event-dot-popover.png', fullPage: false });
      console.log('Saved screenshot-event-dot-popover.png');
    }
  }

  await browser.close();
})();
