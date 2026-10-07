import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:5173/CafeLimit/', { waitUntil: 'networkidle0' });

  // 1. 設定ボタンをクリック
  const settingsBtn = await page.$('button[title="アプリ設定"]');
  if (settingsBtn) {
    await settingsBtn.click();
    await new Promise((r) => setTimeout(r, 400));
  }

  // 2. 快眠基準を15mg（敏感）に変更
  const selects = await page.$$('select');
  if (selects.length >= 3) {
    await selects[2].select('15');
    await new Promise((r) => setTimeout(r, 200));
  }

  // 3. 最大量表示形式を 'preset'（杯/缶）に変更
  if (selects.length >= 1) {
    await selects[0].select('preset');
    await new Promise((r) => setTimeout(r, 200));
  }

  // モーダルのヘッダーにある閉じるボタンをクリック
  const headerCloseBtn = await page.evaluateHandle(() => {
    const modal = document.querySelector('.animate-fadeIn');
    if (!modal) return null;
    return modal.querySelector('button');
  });
  if (headerCloseBtn) {
    await headerCloseBtn.click();
    await new Promise((r) => setTimeout(r, 400));
  }

  // メイン画面の反映状態スクリーンショット
  await page.screenshot({ path: '/Users/umeda_chikara/.gemini/antigravity/brain/be3398f0-b3ce-4b4b-8fbd-127c82ba5a41/test_main_after_settings_closed.png' });

  await browser.close();
  console.log('Main screenshot captured successfully.');
})();
