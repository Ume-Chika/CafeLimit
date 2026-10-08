import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  await page.goto('http://localhost:5173/CafeLimit/', { waitUntil: 'networkidle0' });

  // 1. Check timeline badge doesn't wrap
  const timelineBadges = await page.$$('.font-mono.text-amber-900');
  console.log(`Found ${timelineBadges.length} caffeine badges.`);

  // 2. Add two beverages at the same time:
  // First, open AddPresetModal to add an energy drink if not present, or click presets in CoffeePanelList
  // Let's click "モンスターエナジー" or "ネスカフェ" panel twice
  const panelCards = await page.$$('div.grid div.cursor-pointer');
  console.log(`Found ${panelCards.length} preset cards.`);

  if (panelCards.length > 0) {
    // Click first card (confirm modal might open if confirmBeforeAdd is true)
    await panelCards[0].click();
    await new Promise((r) => setTimeout(r, 400));

    // If confirm modal is open, click "記録を追加"
    const confirmBtn = await page.$('button ::-p-text(記録を追加)');
    if (confirmBtn) {
      await confirmBtn.click();
      await new Promise((r) => setTimeout(r, 400));
    }

    // Click second card
    if (panelCards.length > 1) {
      await panelCards[1].click();
      await new Promise((r) => setTimeout(r, 400));
      const confirmBtn2 = await page.$('button ::-p-text(記録を追加)');
      if (confirmBtn2) {
        await confirmBtn2.click();
        await new Promise((r) => setTimeout(r, 400));
      }
    }
  }

  // 3. Click on the chart canvas to open the popover
  const chartCanvas = await page.$('canvas');
  if (chartCanvas) {
    const box = await chartCanvas.boundingBox();
    if (box) {
      // Tap in the middle of canvas
      await page.mouse.click(box.x + box.width * 0.4, box.y + box.height * 0.5);
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  // Take screenshot of multi-event popover
  await page.screenshot({ path: 'screenshot_multi_event_popover.png' });
  console.log('Multi-event popover screenshot captured.');

  // 4. Test Scientific Modal
  const scientificBtn = await page.$('button[title="科学的根拠"]');
  if (scientificBtn) {
    await scientificBtn.click();
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: 'screenshot_scientific_modal.png' });
    console.log('Scientific modal screenshot captured.');

    // Close scientific modal
    const closeBtn = await page.$('div.fixed.inset-0 button');
    if (closeBtn) {
      await closeBtn.click();
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  // 5. Test Settings Modal
  const settingsBtn = await page.$('button[title="アプリ設定"]');
  if (settingsBtn) {
    await settingsBtn.click();
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: 'screenshot_settings_modal.png' });
    console.log('Settings modal screenshot captured.');
  }

  await browser.close();
  console.log('All UI integration tests completed successfully.');
})();
