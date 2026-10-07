import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:5173/CafeLimit/', { waitUntil: 'networkidle0' });

  // 1. 「ドリンク追加」カードをクリック
  const addCard = await page.evaluateHandle(() => {
    const divs = Array.from(document.querySelectorAll('div'));
    return divs.find((d) => d.textContent && d.textContent.includes('ドリンク追加') && d.classList.contains('border-dashed'));
  });

  if (addCard) {
    await addCard.click();
    await new Promise((r) => setTimeout(r, 400));
  }

  // モーダル Step 1 のスクリーンショット
  await page.screenshot({ path: '/Users/umeda_chikara/.gemini/antigravity/brain/be3398f0-b3ce-4b4b-8fbd-127c82ba5a41/test_modal_step1_soda.png' });

  // 2. 「コーラ・炭酸飲料」グループをクリック
  const sodaGroupBtn = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find((b) => b.textContent && (b.textContent.includes('コーラ') || b.textContent.includes('炭酸')));
  });

  if (sodaGroupBtn) {
    await sodaGroupBtn.click();
    await new Promise((r) => setTimeout(r, 400));
  }

  // モーダル Step 2（コーラ6種類表示）のスクリーンショット
  await page.screenshot({ path: '/Users/umeda_chikara/.gemini/antigravity/brain/be3398f0-b3ce-4b4b-8fbd-127c82ba5a41/test_modal_step2_soda_6types.png' });

  // 3. ドクターペッパー (350ml) をタップして追加
  const drPepperOpt = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find((b) => b.textContent && b.textContent.includes('350ml (缶)') && b.textContent.includes('41 mg'));
  });

  if (drPepperOpt) {
    await drPepperOpt.click();
    await new Promise((r) => setTimeout(r, 500));
  }

  // パネルに追加されたメイン画面のスクリーンショット
  await page.screenshot({ path: '/Users/umeda_chikara/.gemini/antigravity/brain/be3398f0-b3ce-4b4b-8fbd-127c82ba5a41/test_main_with_drpepper.png' });

  await browser.close();
  console.log('Soda test screenshots captured successfully.');
})();
