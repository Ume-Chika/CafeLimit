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
      console.log('Testing drag scrub across chart...');
      const startX = box.x + box.width * 0.3;
      const startY = box.y + box.height * 0.5;
      const endX = box.x + box.width * 0.7;
      const endY = box.y + box.height * 0.5;

      // Start drag at 30%
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await new Promise((r) => setTimeout(r, 100));

      // Move to 50%
      await page.mouse.move(box.x + box.width * 0.5, startY, { steps: 5 });
      await new Promise((r) => setTimeout(r, 100));
      await page.screenshot({ path: 'screenshot-drag-50.png', fullPage: false });
      console.log('Saved screenshot-drag-50.png');

      // Move to 70%
      await page.mouse.move(endX, endY, { steps: 5 });
      await new Promise((r) => setTimeout(r, 100));
      await page.screenshot({ path: 'screenshot-drag-70.png', fullPage: false });
      console.log('Saved screenshot-drag-70.png');

      // Release mouse
      await page.mouse.up();
      await new Promise((r) => setTimeout(r, 200));
      await page.screenshot({ path: 'screenshot-drag-released.png', fullPage: false });
      console.log('Saved screenshot-drag-released.png');
    }
  }

  // Test PC Viewport (1024x768)
  const pcPage = await browser.newPage();
  await pcPage.setViewport({ width: 1024, height: 768, deviceScaleFactor: 2 });
  await pcPage.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle0' });

  // Check chart bedtime input location
  const chartBedInput = await pcPage.$('input[aria-label="就寝時刻 (グラフ内)"]');
  if (chartBedInput) {
    const rect = await chartBedInput.boundingBox();
    console.log('PC Chart Bedtime Input BoundingBox:', rect);
  }
  await pcPage.screenshot({ path: 'screenshot-pc-view.png', fullPage: false });
  console.log('Saved screenshot-pc-view.png');

  await browser.close();
  console.log('All drag and PC tests completed.');
})();
