import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  await page.goto('http://localhost:5173/CafeLimit/', { waitUntil: 'networkidle0' });

  // Add 2 events
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

  // Find canvas
  const chartCanvas = await page.$('canvas');
  if (chartCanvas) {
    await page.evaluate((el) => el.scrollIntoView({ behavior: 'instant', block: 'center' }), chartCanvas);
    await new Promise((r) => setTimeout(r, 300));

    const box = await chartCanvas.boundingBox();
    for (let r = 0.1; r <= 0.9; r += 0.05) {
      await page.mouse.click(box.x + box.width * r, box.y + box.height * 0.3);
      await new Promise((r) => setTimeout(r, 100));
      const popoverText = await page.evaluate(() => {
        const popup = document.querySelector('div.bg-stone-900\\/95');
        return popup ? popup.innerText : '';
      });
      if (popoverText) {
        console.log(`Ratio ${r.toFixed(2)}: ${popoverText.split('\n')[0]} - events: ${popoverText.includes('同時間帯') || popoverText.includes('編集')}`);
        if (popoverText.includes('同時間帯') || popoverText.includes('編集')) {
          console.log('Full content:\n', popoverText);
          await page.screenshot({ path: 'screenshot_multi_event_detected.png' });
          break;
        }
      }
    }
  }

  await browser.close();
})();
