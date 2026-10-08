import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:5173/CafeLimit/', { waitUntil: 'networkidle0' });

  // 1. デフォルト状態（集中ゾーンOFF）のスクリーンショット
  await page.screenshot({ path: '/Users/umeda_chikara/.gemini/antigravity/brain/be3398f0-b3ce-4b4b-8fbd-127c82ba5a41/test_focus_zone_off.png' });

  // 2. 設定ボタンをクリック
  const settingsBtn = await page.$('button[title="アプリ設定"]');
  if (settingsBtn) {
    await settingsBtn.click();
    await new Promise((r) => setTimeout(r, 400));
  }

  // 設定モーダル内の集中ゾーントグルをクリック
  const toggleCards = await page.$$('div.cursor-pointer');
  for (const card of toggleCards) {
    const text = await page.evaluate((el) => el.innerText, card);
    if (text.includes('日中の集中ゾーン表示')) {
      await card.click();
      await new Promise((r) => setTimeout(r, 300));
      break;
    }
  }

  // 設定モーダルのスクリーンショット
  await page.screenshot({ path: '/Users/umeda_chikara/.gemini/antigravity/brain/be3398f0-b3ce-4b4b-8fbd-127c82ba5a41/test_focus_zone_modal.png' });

  // モーダルを閉じる
  const headerCloseBtn = await page.evaluateHandle(() => {
    const modal = document.querySelector('.animate-fadeIn');
    if (!modal) return null;
    return modal.querySelector('button');
  });
  if (headerCloseBtn) {
    await headerCloseBtn.click();
    await new Promise((r) => setTimeout(r, 400));
  }

  // 3. 集中ゾーンON後のメイン画面スクリーンショット
  await page.screenshot({ path: '/Users/umeda_chikara/.gemini/antigravity/brain/be3398f0-b3ce-4b4b-8fbd-127c82ba5a41/test_focus_zone_on.png' });

  await browser.close();
  console.log('Focus zone test screenshots captured successfully.');
})();
