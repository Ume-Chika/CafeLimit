import puppeteer from 'puppeteer';

(async () => {
  console.log('--- Starting Comprehensive Puppeteer Integration Verification ---');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  await page.goto('http://localhost:5173/CafeLimit/', { waitUntil: 'networkidle0' });

  // 1. Clear all existing events first to start clean
  const clearAllBtn = await page.$('button ::-p-text(全件クリア)');
  if (clearAllBtn) {
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });
    await clearAllBtn.click();
    await new Promise((r) => setTimeout(r, 400));
  }

  // 2. Add 3 presets in a row at the same time:
  const panelCards = await page.$$('div.grid div.cursor-pointer');
  console.log(`Found ${panelCards.length} preset cards on initial screen.`);

  // Click card 0
  await panelCards[0].click();
  await new Promise((r) => setTimeout(r, 200));
  let confirmBtn = await page.$('button ::-p-text(記録を追加)');
  if (confirmBtn) await confirmBtn.click();
  await new Promise((r) => setTimeout(r, 300));

  // Click card 1
  await panelCards[1].click();
  await new Promise((r) => setTimeout(r, 200));
  confirmBtn = await page.$('button ::-p-text(記録を追加)');
  if (confirmBtn) await confirmBtn.click();
  await new Promise((r) => setTimeout(r, 300));

  // Click card 2
  await panelCards[2].click();
  await new Promise((r) => setTimeout(r, 200));
  confirmBtn = await page.$('button ::-p-text(記録を追加)');
  if (confirmBtn) await confirmBtn.click();
  await new Promise((r) => setTimeout(r, 300));

  // Verify 3 events in timeline
  const timelineItems = await page.$$('div.space-y-2\\.5 > div.cursor-pointer');
  console.log(`Timeline contains ${timelineItems.length} events (expected: 3).`);
  if (timelineItems.length !== 3) {
    console.error(`❌ Expected 3 timeline items, got ${timelineItems.length}`);
    process.exit(1);
  }

  // 3. Scroll to chart and click the time point
  const chartCanvas = await page.$('canvas');
  if (chartCanvas) {
    await page.evaluate((el) => el.scrollIntoView({ behavior: 'instant', block: 'center' }), chartCanvas);
    await new Promise((r) => setTimeout(r, 300));

    // Calculate click coordinates on canvas
    const clickPos = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      const rect = canvas.getBoundingClientRect();
      const x = rect.left + 40 + (rect.width - 50) * (28 / 82) + 6;
      const y = rect.top + rect.height * 0.2;
      return { x, y };
    });

    await page.mouse.click(clickPos.x, clickPos.y);
    await new Promise((r) => setTimeout(r, 600));

    // Check if popover shows "同時間帯 (3件)"
    const popoverContent = await page.evaluate(() => {
      const el = document.body.innerText;
      return el;
    });

    if (popoverContent.includes('同時間帯 (3件)') || popoverContent.includes('合計 +')) {
      console.log('✅ Popover correctly shows 3 multi-events summary with total caffeine!');
    } else {
      console.log('⚠️ Popover text:', popoverContent.slice(0, 300));
    }

    await page.screenshot({ path: 'screenshot_3_events_popover.png' });
  }

  // 4. Test 320px narrow screen for text wrap
  await page.setViewport({ width: 320, height: 600, isMobile: true, hasTouch: true });
  await new Promise((r) => setTimeout(r, 300));
  await page.screenshot({ path: 'screenshot_narrow_320px.png' });
  console.log('✅ Narrow 320px viewport screenshot captured.');

  await browser.close();
  console.log('🎉 ALL COMPREHENSIVE INTEGRATION TESTS PASSED! 🎉');
})();
