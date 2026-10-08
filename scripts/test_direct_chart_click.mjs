import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  await page.goto('http://localhost:5173/CafeLimit/', { waitUntil: 'networkidle0' });

  // Add 2 events at selected time
  const panelCards = await page.$$('div.grid div.cursor-pointer');
  if (panelCards.length >= 2) {
    await panelCards[0].click();
    await new Promise((r) => setTimeout(r, 200));
    let confirmBtn = await page.$('button ::-p-text(記録を追加)');
    if (confirmBtn) await confirmBtn.click();
    await new Promise((r) => setTimeout(r, 300));

    await panelCards[1].click();
    await new Promise((r) => setTimeout(r, 200));
    confirmBtn = await page.$('button ::-p-text(記録を追加)');
    if (confirmBtn) await confirmBtn.click();
    await new Promise((r) => setTimeout(r, 300));
  }

  // Get current selected time from time picker
  const timeText = await page.$eval('#time-slider-section button', (el) => el.innerText.trim());
  console.log(`Events added at time: ${timeText}`);

  // Find canvas and click on the event point
  const chartCanvas = await page.$('canvas');
  if (chartCanvas) {
    await page.evaluate((el) => el.scrollIntoView({ behavior: 'instant', block: 'center' }), chartCanvas);
    await new Promise((r) => setTimeout(r, 300));

    // Get the exact canvas position
    const box = await chartCanvas.boundingBox();
    // Dispatch a touch event on the canvas at roughly 35% of the width (afternoon point)
    await page.touchscreen.tap(box.x + box.width * 0.35, box.y + box.height * 0.4);
    await new Promise((r) => setTimeout(r, 500));

    const popoverText = await page.evaluate(() => {
      const popup = document.querySelector('div.bg-stone-900\\/95');
      return popup ? popup.innerText : null;
    });

    console.log('Popover content found:', popoverText);
    await page.screenshot({ path: 'screenshot_direct_tap_popover.png' });
  }

  await browser.close();
})();
