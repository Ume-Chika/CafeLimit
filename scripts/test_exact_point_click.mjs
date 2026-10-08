import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  await page.goto('http://localhost:5173/CafeLimit/', { waitUntil: 'networkidle0' });

  // Add 2 events at current selected time
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

  // Click on chart canvas using Chart.js internal scale coordinate
  const chartCanvas = await page.$('canvas');
  if (chartCanvas) {
    await page.evaluate((el) => el.scrollIntoView({ behavior: 'instant', block: 'center' }), chartCanvas);
    await new Promise((r) => setTimeout(r, 300));

    // Evaluate the exact clientX of the 13:15 point from Chart.js instance or canvas width
    const rect = await chartCanvas.boundingBox();
    // In Chart.js with ~82 points, point 29 is at:
    // Left scale margin ~35px, right margin ~15px
    const innerWidth = rect.width - 50;
    const targetX = rect.x + 35 + innerWidth * (29 / 82);
    const targetY = rect.y + rect.height * 0.4;

    await page.mouse.click(targetX, targetY);
    await new Promise((r) => setTimeout(r, 600));

    const popoverInfo = await page.evaluate(() => {
      const popup = document.querySelector('div.bg-stone-900\\/95');
      if (!popup) return null;
      return {
        text: popup.innerText,
        hasEditButtons: popup.querySelectorAll('button').length,
      };
    });

    console.log('Popover Info at 13:15:', popoverInfo);
    await page.screenshot({ path: 'screenshot_multi_event_exact_click.png' });
  }

  await browser.close();
})();
