import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 }); // iPhone 14 Pro

  console.log('Navigating to http://127.0.0.1:5173...');
  await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle0' });

  // 1. Initial screenshot
  await page.screenshot({ path: 'screenshot-modern-initial.png', fullPage: false });
  console.log('Saved screenshot-modern-initial.png');

  // 2. Click on the chart curve (middle of the chart canvas)
  const canvas = await page.$('canvas');
  if (canvas) {
    const box = await canvas.boundingBox();
    if (box) {
      // Click at x: 60% of canvas, y: 50%
      await page.mouse.click(box.x + box.width * 0.65, box.y + box.height * 0.55);
      await new Promise((r) => setTimeout(r, 600));
      await page.screenshot({ path: 'screenshot-modern-popover.png', fullPage: false });
      console.log('Saved screenshot-modern-popover.png');

      // Click the "この時間に追加" button inside the floating tooltip
      const addBtn = await page.$('button ::-p-text(この時間に追加)');
      if (addBtn) {
        console.log('Found [この時間に追加] button in floating popover, clicking it...');
        await addBtn.click();
        await new Promise((r) => setTimeout(r, 600));
        await page.screenshot({ path: 'screenshot-modern-after-add-click.png', fullPage: false });
        console.log('Saved screenshot-modern-after-add-click.png');
      }
    }
  }

  // 3. Test clicking existing event dot
  if (canvas) {
    const box = await canvas.boundingBox();
    if (box) {
      // 朝8:00のイベント付近 (left ~20%)
      await page.mouse.click(box.x + box.width * 0.2, box.y + box.height * 0.6);
      await new Promise((r) => setTimeout(r, 600));
      await page.screenshot({ path: 'screenshot-modern-event-popover.png', fullPage: false });
      console.log('Saved screenshot-modern-event-popover.png');
    }
  }

  await browser.close();
  console.log('All tests finished.');
})();
