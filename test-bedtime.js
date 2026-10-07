import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle0' });

  // Listen to any console logs or state changes
  page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));

  // Let's click on the Bedtime line (x: ~81%, y: ~40%)
  const canvas = await page.$('canvas');
  if (canvas) {
    const box = await canvas.boundingBox();
    if (box) {
      console.log('Clicking bedtime line on chart...');
      await page.mouse.click(box.x + box.width * 0.81, box.y + box.height * 0.4);
      await new Promise((r) => setTimeout(r, 600));
      await page.screenshot({ path: 'screenshot-chart-bedtime-click.png', fullPage: false });
      console.log('Saved screenshot-chart-bedtime-click.png');
    }
  }

  // Also test clicking the Bedtime button in header
  const bedBtn = await page.$('#bedtime-picker-button');
  if (bedBtn) {
    console.log('Clicking header bedtime button...');
    await bedBtn.click();
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: 'screenshot-header-bedtime-click.png', fullPage: false });
    console.log('Saved screenshot-header-bedtime-click.png');
  }

  await browser.close();
})();
