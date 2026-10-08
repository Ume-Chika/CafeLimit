import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  await page.goto('http://localhost:5173/CafeLimit/', { waitUntil: 'networkidle0' });

  // Add 2 events at 13:00
  const panelCards = await page.$$('div.grid div.cursor-pointer');
  if (panelCards.length >= 2) {
    await panelCards[0].click();
    await new Promise((r) => setTimeout(r, 200));
    const confirmBtn1 = await page.$('button ::-p-text(記録を追加)');
    if (confirmBtn1) await confirmBtn1.click();
    await new Promise((r) => setTimeout(r, 200));

    await panelCards[1].click();
    await new Promise((r) => setTimeout(r, 200));
    const confirmBtn2 = await page.$('button ::-p-text(記録を追加)');
    if (confirmBtn2) await confirmBtn2.click();
    await new Promise((r) => setTimeout(r, 200));
  }

  // Scroll chart into view and click 13:00
  const chartCanvas = await page.$('canvas');
  if (chartCanvas) {
    await page.evaluate((el) => el.scrollIntoView({ behavior: 'instant', block: 'center' }), chartCanvas);
    await new Promise((r) => setTimeout(r, 300));

    const clickPos = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      const rect = canvas.getBoundingClientRect();
      const x = rect.left + 40 + (rect.width - 50) * (28 / 82) + 6;
      const y = rect.top + rect.height * 0.2;
      return { x, y };
    });

    await page.mouse.click(clickPos.x, clickPos.y);
    await new Promise((r) => setTimeout(r, 600));

    // Click on the first "✏️ 編集" button in the popover
    const editBtns = await page.$$('button ::-p-text(編集)');
    if (editBtns.length > 0) {
      await editBtns[0].click();
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  await page.screenshot({ path: 'screenshot_multi_event_edit_modal_opened.png' });
  console.log('Edit modal opened from popover screenshot captured.');

  await browser.close();
})();
